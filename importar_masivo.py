"""
IMPORTADOR MASIVO: Plantas, Minerales, Razas, Criaturas adicionales
Ejecutar desde c:\\Users\\LUCK\\Downloads\\enciclopedia\\
"""
import sqlite3
import pandas as pd
import os
import glob
import io
import sys
import time

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

DB_PATH = "encyclopedia.db"
DATOS = "datos"

# ── Utilidades ────────────────────────────────────────────────
def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")
    conn.execute("PRAGMA cache_size=-131072")
    conn.execute("PRAGMA temp_store=MEMORY")
    conn.execute("PRAGMA mmap_size=536870912")
    return conn

def read_csv(path):
    for enc in ['utf-8-sig', 'utf-8', 'latin-1', 'cp1252']:
        try:
            return pd.read_csv(path, encoding=enc)
        except (UnicodeDecodeError, UnicodeError):
            continue
    return pd.read_csv(path, encoding='latin-1', errors='replace')

def planet_id(conn):
    cur = conn.cursor()
    cur.execute("SELECT planet_id FROM categories WHERE name='Clases' LIMIT 1")
    r = cur.fetchone()
    return r[0] if r else 2

def table_for(conn, pid, name):
    cur = conn.cursor()
    cur.execute("SELECT table_name FROM categories WHERE planet_id=? AND name=?", (pid, name))
    r = cur.fetchone()
    return r[0] if r else None

def count(conn, tbl):
    return conn.execute(f'SELECT COUNT(*) FROM "{tbl}"').fetchone()[0]

def get_cols(conn, tbl):
    return [r[1] for r in conn.execute(f'PRAGMA table_info("{tbl}")').fetchall()]

def bulk_insert(conn, tbl, df, chunk=10000):
    """Inserta df → tbl mapeando columnas por nombre normalizado."""
    if df.empty:
        return 0
    real_cols = get_cols(conn, tbl)
    skip = {'id', 'parent_id', 'image_path', 'is_favorite'}
    valid = [c for c in real_cols if c.lower() not in skip]

    def norm(s):
        return s.lower().replace(' ', '_').replace('ó','o').replace('á','a') \
                .replace('é','e').replace('í','i').replace('ú','u') \
                .replace('ñ','n').replace('ü','u')

    mapping = {}
    for vc in valid:
        vn = norm(vc)
        for dc in df.columns:
            if norm(dc) == vn or dc == vc:
                mapping[dc] = vc
                break

    if not mapping:
        # Mapeo posicional
        df_cols = [c for c in df.columns if c.lower() not in {'id','index','id_raza','id_clase','id_habilidad'}][:len(valid)]
        mapping = {df_cols[i]: valid[i] for i in range(min(len(df_cols), len(valid)))}

    df_m = df[list(mapping)].rename(columns=mapping)
    df_f = df_m[[c for c in df_m.columns if c in real_cols]].fillna('').astype(str).replace('nan', '')

    if df_f.empty:
        print(f"  [WARN] sin columnas mapeables para {tbl}")
        return 0

    cols_q = ', '.join(f'"{c}"' for c in df_f.columns)
    ph = ', '.join(['?'] * len(df_f.columns))
    sql = f'INSERT OR IGNORE INTO "{tbl}" ({cols_q}) VALUES ({ph})'

    rows = df_f.values.tolist()
    total = 0
    for i in range(0, len(rows), chunk):
        conn.executemany(sql, rows[i:i+chunk])
        conn.commit()
        total += len(rows[i:i+chunk])
        print(f"    -> {total}/{len(rows)}", end='\r')
    print()
    return total

def ensure_table(conn, pid, cat_name, schema_cols):
    """Crea la tabla y la registra en categories si no existe."""
    cur = conn.cursor()
    tbl = f"p_{pid}_{cat_name.lower()}"
    cur.execute("SELECT COUNT(*) FROM categories WHERE planet_id=? AND name=?", (pid, cat_name))
    if cur.fetchone()[0] == 0:
        cols_sql = ', '.join(f'"{c}" {t}' for c, t in schema_cols)
        cur.execute(f"""CREATE TABLE IF NOT EXISTS "{tbl}" (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            {cols_sql},
            parent_id INTEGER DEFAULT 0,
            image_path TEXT DEFAULT '',
            is_favorite INTEGER DEFAULT 0
        )""")
        cur.execute("INSERT INTO categories (planet_id, name, table_name) VALUES (?,?,?)", (pid, cat_name, tbl))
        conn.commit()
        print(f"  [CREATE] Tabla {tbl} creada")
    return tbl

# ── 1. RAZAS (960 = 96 razas x 10 niveles) ───────────────────
def importar_razas(conn, pid):
    print("\n[RAZAS] Importando 960 razas/niveles...")
    path = os.path.join(DATOS, "02_Razas_960_COMPLETO.csv")
    if not os.path.exists(path):
        print("  [SKIP] Archivo no encontrado")
        return

    # Crear tabla si no existe
    schema = [
        ("Raza", "TEXT"), ("Categoria", "TEXT"), ("Nivel", "INTEGER"),
        ("Nombre_Nivel", "TEXT"), ("Bonificacion", "TEXT"),
        ("Poder_Relativo", "TEXT"), ("Descripcion", "TEXT"),
    ]
    tbl = ensure_table(conn, pid, "Razas", schema)

    if count(conn, tbl) > 0:
        print(f"  [SKIP] Ya hay {count(conn, tbl)} razas")
        return

    df = read_csv(path)
    print(f"  Leidas: {len(df)} filas | cols: {list(df.columns)}")
    n = bulk_insert(conn, tbl, df)
    print(f"  [OK] {n} razas importadas -> {tbl}")

    # Indices
    for col in ['Raza', 'Nivel', 'Categoria']:
        try:
            conn.execute(f'CREATE INDEX IF NOT EXISTS "idx_{tbl}_{col}" ON "{tbl}" ("{col}")')
        except Exception:
            pass
    conn.commit()

# ── 2. PLANTAS (5 batches x 50K = 250K) ──────────────────────
def importar_plantas(conn, pid, max_batches=5):
    print(f"\n[PLANTAS] Importando primeros {max_batches} batches (hasta 250K)...")
    tbl = table_for(conn, pid, "Plantas")
    if not tbl:
        print("  [ERR] Tabla Plantas no encontrada")
        return

    existing = count(conn, tbl)
    if existing > 0:
        print(f"  [SKIP] Ya hay {existing:,} plantas")
        return

    # Mapeo de columnas CSV → esquema BD
    # CSV:  Nombre_Común, Nombre_Científico, Rareza, Utilidad, Peligrosidad, Peligrosidad_Icono, Tamaño, Hábitat...
    # BD:   "Nombre Común", "Nombre Científico", "Utilidad", "Utilidad Título", "Peligrosidad", "Peligrosidad Icono"...
    # El bulk_insert resuelve por normalización. Solo necesitamos asegurar las columnas numéricas de nivel.

    batches = sorted(glob.glob(os.path.join(DATOS, "PLANTAS_PARTE*.csv")))[:max_batches]
    if not batches:
        print("  [ERR] No se encontraron archivos PLANTAS_PARTE*.csv")
        return

    total = 0
    for i, fpath in enumerate(batches, 1):
        print(f"  Batch {i}/{len(batches)}: {os.path.basename(fpath)}")
        df = read_csv(fpath)

        # Adaptar columnas al esquema de la BD
        rename_map = {
            'ID': None,
            'Nombre_Común': 'Nombre Común',
            'Nombre_Comun': 'Nombre Común',
            'Nombre_Científico': 'Nombre Científico',
            'Nombre_Cientifico': 'Nombre Científico',
            'Peligrosidad_Icono': 'Peligrosidad Icono',
            'Utilidad': 'Utilidad',
        }
        # Aplicar renombrado
        for old, new in list(rename_map.items()):
            if old in df.columns and new:
                df = df.rename(columns={old: new})
            elif old in df.columns and new is None:
                df = df.drop(columns=[old])

        # Añadir columnas de nivel (Utilidad Nivel, Peligrosidad Nivel) si no están
        rareza_nivel = {
            'Decorativa': 1, 'Comestible': 2, 'Medicinal': 3,
            'Alquímica': 4, 'Alquimica': 4, 'Magica': 5, 'Mágica': 5,
            'Sagrada': 6, 'Prohibida': 7, 'Venenosa': 8, 'Curativa': 8,
        }
        peligro_nivel = {
            'Inofensiva': 1, 'Irritante': 2, 'Venenosa': 3, 'Letal': 4,
            'Corrosiva': 5, 'Paralizante': 6, 'Devastadora': 7, 'Apocaliptica': 8,
        }
        if 'Utilidad' in df.columns and 'Utilidad Nivel' not in df.columns:
            df['Utilidad Nivel'] = df['Utilidad'].map(rareza_nivel).fillna(1).astype(int)
        if 'Peligrosidad' in df.columns and 'Peligrosidad Nivel' not in df.columns:
            df['Peligrosidad Nivel'] = df['Peligrosidad'].map(peligro_nivel).fillna(1).astype(int)

        n = bulk_insert(conn, tbl, df)
        total += n
        print(f"  +{n:,} plantas | total acumulado: {total:,}")

    # Indices
    for col in ['Utilidad', 'Peligrosidad', 'Utilidad Nivel']:
        try:
            conn.execute(f'CREATE INDEX IF NOT EXISTS "idx_{tbl}_{col.replace(" ","_")}" ON "{tbl}" ("{col}")')
        except Exception:
            pass
    conn.commit()
    print(f"  [OK] Total plantas importadas: {total:,}")

# ── 3. MINERALES (5 batches x 50K = 250K) ────────────────────
def importar_minerales(conn, pid, max_batches=5):
    print(f"\n[MINERALES] Importando primeros {max_batches} batches (hasta 250K)...")
    tbl = table_for(conn, pid, "Minerales")
    if not tbl:
        print("  [ERR] Tabla Minerales no encontrada")
        return

    existing = count(conn, tbl)
    if existing > 0:
        print(f"  [SKIP] Ya hay {existing:,} minerales")
        return

    # CSV: ID, Nombre, Fórmula, Rareza, Poder, Nivel_Poder, Dureza_Mohs, Color,
    #      Estabilidad, Valor_Monedas, Dificultad_Extracción, Peso_Específico,
    #      Propiedades_Especiales, Conductividad_Mágica, Resistencia_Magia
    # BD:  "Nombre", "Fórmula", "Poder Nivel", "Poder", "Poder Título",
    #      "Estabilidad Nivel", "Estabilidad", "Estabilidad Icono",
    #      "Extracción Nivel", "Extracción", "Extracción Método", "Dureza Mohs", "Color"

    batches = sorted(glob.glob(os.path.join(DATOS, "MINERALES_Batch_*.csv")))[:max_batches]
    if not batches:
        print("  [ERR] No se encontraron archivos MINERALES_Batch_*.csv")
        return

    poder_nivel = {
        'Inerte': 0, 'Resonante': 1, 'Activo': 2, 'Potente': 3,
        'Intenso': 4, 'Poderoso': 5, 'Arcano': 6, 'Sagrado': 7,
        'Legendario': 8, 'Cosmico': 9, 'Cósmico': 9,
    }
    estab_nivel = {
        'Indestructible': 0, 'Estable': 1, 'Sensible': 2, 'Volatile': 3,
        'Volátil': 3, 'Inestable': 4, 'Reactivo': 5, 'Explosivo': 6, 'Impredecible': 7,
    }

    total = 0
    for i, fpath in enumerate(batches, 1):
        print(f"  Batch {i}/{len(batches)}: {os.path.basename(fpath)}")
        df = read_csv(fpath)

        # Adaptar nombres de columnas CSV → BD
        rename = {
            'ID': None,
            'Fórmula': 'Fórmula',
            'Formula': 'Fórmula',
            'Nivel_Poder': 'Poder Nivel',
            'Poder': 'Poder',
            'Dureza_Mohs': 'Dureza Mohs',
            'Dificultad_Extracción': 'Extracción',
            'Dificultad_Extraccion': 'Extracción',
        }
        for old, new in list(rename.items()):
            if old in df.columns and new:
                df = df.rename(columns={old: new})
            elif old in df.columns and new is None:
                df = df.drop(columns=[old])

        # Añadir Estabilidad Nivel si falta
        if 'Estabilidad' in df.columns and 'Estabilidad Nivel' not in df.columns:
            df['Estabilidad Nivel'] = df['Estabilidad'].map(estab_nivel).fillna(1).astype(int)
        if 'Poder' in df.columns and 'Poder Nivel' not in df.columns:
            df['Poder Nivel'] = df['Poder'].map(poder_nivel).fillna(0).astype(int)

        n = bulk_insert(conn, tbl, df)
        total += n
        print(f"  +{n:,} minerales | total acumulado: {total:,}")

    # Indices
    for col in ['Rareza', 'Poder', 'Poder Nivel']:
        try:
            conn.execute(f'CREATE INDEX IF NOT EXISTS "idx_{tbl}_{col.replace(" ","_")}" ON "{tbl}" ("{col}")')
        except Exception:
            pass
    conn.commit()
    print(f"  [OK] Total minerales importados: {total:,}")

# ── 4. CRIATURAS ADICIONALES (4 batches x 50K = 200K mas) ────
def importar_criaturas_extra(conn, pid, max_extra_batches=4):
    print(f"\n[CRIATURAS] Importando {max_extra_batches} batches adicionales...")
    tbl = table_for(conn, pid, "Criaturas")
    if not tbl:
        print("  [ERR] Tabla Criaturas no encontrada")
        return

    existing = count(conn, tbl)
    print(f"  Criaturas actuales: {existing:,}")

    # Tomar los batches 2-5 de PARTE1 (ya se importó el 1)
    batches = sorted(glob.glob(os.path.join(DATOS, "PARTE1_Criaturas_Batch_*.csv")))
    # Excluir batch 01 si ya hay datos
    if existing >= 50000:
        batches = [b for b in batches if "Batch_01" not in b]
    batches = batches[:max_extra_batches]

    if not batches:
        print("  [SKIP] No hay batches adicionales disponibles")
        return

    # Mapeo CSV -> BD criaturas
    # CSV: Nombre_Común, Nombre_Científico, Rareza, Peligrosidad, Peligrosidad_Icono,
    #      Nivel_Captura, Dificultad_Captura, Ritual_Captura, Tamaño, Hábitat, Dieta,
    #      HP_Base, Ataque_Base, Defensa_Base, Velocidad, Nivel_Poder
    # BD:  "Nombre Común", "Nombre Científico", "Rareza Nivel", "Rareza", "Rareza Título",
    #      "Peligrosidad Nivel", "Peligrosidad", "Peligrosidad Icono",
    #      "Captura Nivel", "Captura", "Captura Ritual", "Tamaño", "Hábitat"

    rareza_a_nivel = {
        'Mundano': 1, 'Poco Común': 2, 'Singular': 3, 'Extraordinario': 4,
        'Mítico': 5, 'Mitico': 5, 'Trascendente': 6, 'Divino': 7,
        'Primordial': 8, 'Único': 9, 'Unico': 9,
    }
    peligro_a_nivel = {
        'Inocuo': 1, 'Menor': 2, 'Cauteloso': 3, 'Amenazante': 4,
        'Mortal': 5, 'Cataclimsico': 6, 'Cataclísmico': 6,
        'Apocaliptico': 7, 'Apocalíptico': 7, 'Cosmico': 8, 'Cósmico': 8,
        'Omniversal': 9,
    }

    total = 0
    for i, fpath in enumerate(batches, 1):
        print(f"  Batch {i}/{len(batches)}: {os.path.basename(fpath)}")
        df = read_csv(fpath)
        df = df.drop(columns=['ID'], errors='ignore')

        rename = {
            'Nombre_Común': 'Nombre Común',
            'Nombre_Comun': 'Nombre Común',
            'Nombre_Científico': 'Nombre Científico',
            'Nombre_Cientifico': 'Nombre Científico',
            'Peligrosidad_Icono': 'Peligrosidad Icono',
            'Ritual_Captura': 'Captura Ritual',
            'Nivel_Captura': 'Captura Nivel',
            'Dificultad_Captura': 'Captura',
        }
        for old, new in rename.items():
            if old in df.columns:
                df = df.rename(columns={old: new})

        if 'Rareza' in df.columns and 'Rareza Nivel' not in df.columns:
            df['Rareza Nivel'] = df['Rareza'].map(rareza_a_nivel).fillna(1).astype(int)
        if 'Peligrosidad' in df.columns and 'Peligrosidad Nivel' not in df.columns:
            df['Peligrosidad Nivel'] = df['Peligrosidad'].map(peligro_a_nivel).fillna(1).astype(int)

        n = bulk_insert(conn, tbl, df)
        total += n
        print(f"  +{n:,} criaturas | total acumulado en tabla: {count(conn, tbl):,}")

    print(f"  [OK] +{total:,} criaturas adicionales importadas")

# ── RESUMEN ───────────────────────────────────────────────────
def resumen(conn, pid):
    print("\n=== RESUMEN FINAL ===")
    cur = conn.cursor()
    cur.execute("SELECT name, table_name FROM categories WHERE planet_id=?", (pid,))
    for name, tbl in cur.fetchall():
        n = conn.execute(f'SELECT COUNT(*) FROM "{tbl}"').fetchone()[0]
        tag = "[OK]" if n > 0 else "[---]"
        if n > 0:
            print(f"  {tag} {name}: {n:,} registros")

# ── MAIN ──────────────────────────────────────────────────────
def main():
    t0 = time.time()
    print("=" * 55)
    print("  IMPORTADOR MASIVO: Razas, Plantas, Minerales, Criaturas")
    print("=" * 55)

    conn = get_conn()
    try:
        pid = planet_id(conn)
        print(f"  Planeta: ID={pid}")

        importar_razas(conn, pid)
        importar_plantas(conn, pid, max_batches=5)
        importar_minerales(conn, pid, max_batches=5)
        importar_criaturas_extra(conn, pid, max_extra_batches=4)

        conn.execute("PRAGMA optimize")
        resumen(conn, pid)
    finally:
        conn.close()

    print(f"\n  COMPLETADO en {time.time()-t0:.1f}s")

if __name__ == "__main__":
    main()
