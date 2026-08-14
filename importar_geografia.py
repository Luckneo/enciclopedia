"""
IMPORTADOR GEOGRÁFICO + HABILIDADES — SISTEMA ERYNDOR/AETHERMUNDUS
Importa toda la jerarquía geográfica y las habilidades del sistema.
"""
import sqlite3
import pandas as pd
import os
import time
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

DB_PATH = "encyclopedia.db"
DATOS_DIR = "datos"

# ─────────────────────────────────────────────────────────────
def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")
    conn.execute("PRAGMA cache_size=-131072")
    conn.execute("PRAGMA temp_store=MEMORY")
    conn.execute("PRAGMA mmap_size=536870912")
    return conn

def read_df(path, sheet=0, nrows=None):
    if path.endswith('.xlsx'):
        return pd.read_excel(path, sheet_name=sheet, nrows=nrows)
    for enc in ['utf-8-sig', 'utf-8', 'latin-1', 'cp1252']:
        try:
            return pd.read_csv(path, encoding=enc, nrows=nrows)
        except (UnicodeDecodeError, UnicodeError):
            continue
    return pd.read_csv(path, encoding='latin-1', errors='replace', nrows=nrows)

def get_planet_id(conn):
    cur = conn.cursor()
    cur.execute("SELECT planet_id FROM categories WHERE name='Clases' LIMIT 1")
    res = cur.fetchone()
    pid = res[0] if res else 2
    print(f"  [OK] Planeta objetivo: ID={pid}")
    return pid

def get_table_cols(conn, table_name):
    cur = conn.cursor()
    cur.execute(f'PRAGMA table_info("{table_name}")')
    return [r[1] for r in cur.fetchall()]

def get_table_name(conn, planet_id, cat_name):
    cur = conn.cursor()
    cur.execute("SELECT table_name FROM categories WHERE planet_id=? AND name=?", (planet_id, cat_name))
    res = cur.fetchone()
    return res[0] if res else None

def bulk_insert(conn, table_name, df, chunk=10000):
    if df.empty:
        return 0
    cur = conn.cursor()
    real_cols = get_table_cols(conn, table_name)
    skip = {'id', 'parent_id', 'image_path', 'is_favorite'}
    valid_cols = [c for c in real_cols if c.lower() not in skip]

    # Mapeo case-insensitive + normalización de nombres
    mapping = {}
    for vc in valid_cols:
        vc_norm = vc.lower().replace(' ', '_').replace('ó', 'o').replace('á', 'a').replace('é', 'e').replace('ú', 'u').replace('ñ', 'n')
        for dc in df.columns:
            dc_norm = dc.lower().replace(' ', '_').replace('ó', 'o').replace('á', 'a').replace('é', 'e').replace('ú', 'u').replace('ñ', 'n')
            if dc_norm == vc_norm or dc == vc:
                mapping[dc] = vc
                break

    if not mapping:
        # Mapeo posicional: las primeras N columnas del DF → primeras N columnas válidas
        df_cols = [c for c in df.columns if c.lower() not in {'id', 'index'}][:len(valid_cols)]
        mapping = {df_cols[i]: valid_cols[i] for i in range(min(len(df_cols), len(valid_cols)))}

    df_m = df[list(mapping.keys())].rename(columns=mapping)
    df_f = df_m[[c for c in df_m.columns if c in real_cols]].fillna('')

    if df_f.empty:
        print(f"  [WARN] Sin columnas mapeables. DF cols: {list(df.columns)[:8]}, tabla cols: {valid_cols[:8]}")
        return 0

    cols_str = ', '.join(f'"{c}"' for c in df_f.columns)
    ph = ', '.join(['?'] * len(df_f.columns))
    sql = f'INSERT OR IGNORE INTO "{table_name}" ({cols_str}) VALUES ({ph})'

    rows = df_f.astype(str).replace('nan', '').values.tolist()
    total = 0
    for i in range(0, len(rows), chunk):
        conn.executemany(sql, rows[i:i+chunk])
        conn.commit()
        total += len(rows[i:i+chunk])
        print(f"    → {total}/{len(rows)}", end='\r')
    print()
    return total

# ─────────────────────────────────────────────────────────────
# STEP 1: LIMPIAR HEMISFERIOS (datos incorrectos)
# ─────────────────────────────────────────────────────────────
def limpiar_hemisferios(conn, planet_id):
    tbl = get_table_name(conn, planet_id, "Hemisferios")
    if not tbl:
        return
    # Skip geografía si ya tiene datos (idempotente)
    cur = conn.cursor()
    cur.execute(f'SELECT COUNT(*) FROM "{tbl}"')
    n = cur.fetchone()[0]
    if n > 10:
        print(f"  [CLEAN] Limpiando {n} registros incorrectos de Hemisferios...")
        cur.execute(f'DELETE FROM "{tbl}"')
        conn.commit()
    
    # Resetear autoincrement
    cur.execute(f'DELETE FROM sqlite_sequence WHERE name="{tbl}"')
    conn.commit()

# ─────────────────────────────────────────────────────────────
# STEP 2: IMPORTAR GEOGRAFÍA COMPLETA
# ─────────────────────────────────────────────────────────────
def importar_geografia(conn, planet_id):
    print("\n[GEO] Importando GEOGRAFIA completa...")
    geo_file = os.path.join(DATOS_DIR, "Eryndor_COMPLETO_PARTE1_Geografia.xlsx")
    
    # --- Hemisferios (2) ---
    tbl = get_table_name(conn, planet_id, "Hemisferios")
    if tbl:
        df = read_df(geo_file, sheet="Hemisferios")
        print(f"  Hemisferios: {len(df)} filas")
        n = bulk_insert(conn, tbl, df)
        print(f"  [OK] {n} hemisferios -> {tbl}")
    
    # --- Macrorregiones (12) ---
    tbl = get_table_name(conn, planet_id, "Macrorregiones")
    if tbl:
        df = read_df(geo_file, sheet="Macrorregiones")
        print(f"  Macrorregiones: {len(df)} filas")
        n = bulk_insert(conn, tbl, df)
        print(f"  [OK] {n} macrorregiones -> {tbl}")
    
    # --- Supercontinentes (24) ---
    tbl = get_table_name(conn, planet_id, "Supercontinentes")
    if tbl:
        df = read_df(geo_file, sheet="Supercontinentes")
        print(f"  Supercontinentes: {len(df)} filas")
        n = bulk_insert(conn, tbl, df)
        print(f"  [OK] {n} supercontinentes -> {tbl}")

def importar_continentes_naciones(conn, planet_id):
    print("\n[GEO] Importando CONTINENTES y NACIONES...")
    geo2 = os.path.join(DATOS_DIR, "Eryndor_COMPLETO_PARTE2_Continentes_Naciones.xlsx")
    
    # --- Continentes (60) ---
    tbl = get_table_name(conn, planet_id, "Continentes")
    if tbl:
        df = read_df(geo2, sheet="Continentes")
        print(f"  Continentes: {len(df)} filas")
        n = bulk_insert(conn, tbl, df)
        print(f"  [OK] {n} continentes -> {tbl}")
    
    # --- Naciones (240) ---
    tbl = get_table_name(conn, planet_id, "Naciones")
    if tbl:
        # Usar el archivo FINAL de naciones que tiene más detalle
        nac_path = os.path.join(DATOS_DIR, "Eryndor_FINAL_Naciones.xlsx")
        df = read_df(nac_path)
        # Añadir columna Continente_ID si falta
        if 'Continente_ID' not in df.columns and 'Continente' in df.columns:
            df['Continente_ID'] = ''
        print(f"  Naciones: {len(df)} filas")
        n = bulk_insert(conn, tbl, df)
        print(f"  [OK] {n} naciones -> {tbl}")

def importar_provincias(conn, planet_id):
    print("\n[GEO] Importando PROVINCIAS...")
    path = os.path.join(DATOS_DIR, "Eryndor_FINAL_Provincias.xlsx")
    tbl = get_table_name(conn, planet_id, "Provincias")
    if not tbl:
        print("  ❌ Tabla Provincias no encontrada")
        return
    df = read_df(path)
    print(f"  Provincias: {len(df)} filas")
    n = bulk_insert(conn, tbl, df)
    print(f"  ✅ {n} provincias → {tbl}")

def importar_ciudades(conn, planet_id):
    print("\n[GEO] Importando CIUDADES (23,015)...")
    path = os.path.join(DATOS_DIR, "Eryndor_FINAL_Ciudades.xlsx")
    tbl = get_table_name(conn, planet_id, "Ciudades")
    if not tbl:
        print("  ❌ Tabla Ciudades no encontrada")
        return
    df = read_df(path)
    print(f"  Ciudades: {len(df)} filas")
    n = bulk_insert(conn, tbl, df, chunk=5000)
    print(f"  ✅ {n} ciudades → {tbl}")

def importar_villas(conn, planet_id):
    print("\n[GEO] Importando VILLAS (114,983)...")
    path = os.path.join(DATOS_DIR, "Eryndor_FINAL_Villas.xlsx")
    tbl = get_table_name(conn, planet_id, "Villas")
    if not tbl:
        print("  ❌ Tabla Villas no encontrada")
        return
    # Leer por chunks para no saturar RAM
    print("  Leyendo Villas (archivo grande)...")
    df = read_df(path)
    print(f"  Villas: {len(df)} filas")
    n = bulk_insert(conn, tbl, df, chunk=10000)
    print(f"  ✅ {n} villas → {tbl}")

def importar_aldeas(conn, planet_id):
    print("\n[GEO] Importando ALDEAS (10pct = 114,722)...")
    path = os.path.join(DATOS_DIR, "Eryndor_FINAL_Aldeas_10pct.xlsx")
    tbl = get_table_name(conn, planet_id, "Aldeas")
    if not tbl:
        print("  ❌ Tabla Aldeas no encontrada")
        return
    df = read_df(path)
    print(f"  Aldeas: {len(df)} filas")
    n = bulk_insert(conn, tbl, df, chunk=10000)
    print(f"  ✅ {n} aldeas → {tbl}")

# ─────────────────────────────────────────────────────────────
# STEP 3: CREAR E IMPORTAR HABILIDADES
# ─────────────────────────────────────────────────────────────
def crear_tabla_habilidades(conn, planet_id):
    """Crea la tabla Habilidades si no existe y la registra en categories."""
    cur = conn.cursor()
    tbl_name = f"p_{planet_id}_habilidades"
    
    # Verificar si ya existe en categories
    cur.execute("SELECT COUNT(*) FROM categories WHERE planet_id=? AND name='Habilidades'", (planet_id,))
    if cur.fetchone()[0] == 0:
        cur.execute("INSERT INTO categories (planet_id, name, table_name) VALUES (?, 'Habilidades', ?)",
                    (planet_id, tbl_name))
    
    cur.execute(f"""
        CREATE TABLE IF NOT EXISTS "{tbl_name}" (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            "Nombre"      TEXT,
            "Tipo"        TEXT,
            "Elemento"    TEXT,
            "Rareza"      TEXT,
            "Nivel_Requerido" INTEGER,
            "Costo_Mana"  INTEGER,
            "Cooldown_Segundos" INTEGER,
            "Daño_Base"   INTEGER,
            "Curación_Base" INTEGER,
            parent_id     INTEGER DEFAULT 0,
            image_path    TEXT DEFAULT '',
            is_favorite   INTEGER DEFAULT 0
        )
    """)
    # Índice por nombre y rareza
    cur.execute(f'CREATE INDEX IF NOT EXISTS "idx_{tbl_name}_nombre" ON "{tbl_name}" ("Nombre")')
    cur.execute(f'CREATE INDEX IF NOT EXISTS "idx_{tbl_name}_rareza" ON "{tbl_name}" ("Rareza")')
    conn.commit()
    print(f"  ✅ Tabla {tbl_name} lista")
    return tbl_name

def importar_habilidades(conn, planet_id):
    print("\n[HAB] Importando HABILIDADES (61,100 legendarias + miticas)...")
    tbl = crear_tabla_habilidades(conn, planet_id)
    
    # Verificar si ya hay datos
    cur = conn.cursor()
    cur.execute(f'SELECT COUNT(*) FROM "{tbl}"')
    existing = cur.fetchone()[0]
    if existing > 0:
        print(f"  [SKIP] Ya hay {existing} habilidades.")
        return
    
    files = [
        os.path.join(DATOS_DIR, "07_Habilidades_Parte5_50000_Legendarias.csv"),
        os.path.join(DATOS_DIR, "08_Habilidades_Parte6_11100_Miticas_y_Unicas.csv"),
    ]
    total = 0
    for f in files:
        if not os.path.exists(f):
            print(f"  [WARN] No encontrado: {os.path.basename(f)}")
            continue
        df = read_df(f)
        # Mapeo de columnas del CSV a la tabla
        rename = {
            'ID_Habilidad': 'id_ext',  # ignorar
            'Nombre': 'Nombre',
            'Tipo': 'Tipo',
            'Elemento': 'Elemento',
            'Nivel_Requerido': 'Nivel_Requerido',
            'Costo_Mana': 'Costo_Mana',
            'Cooldown_Segundos': 'Cooldown_Segundos',
            'Daño_Base': 'Daño_Base',
            'Curación_Base': 'Curación_Base',
            'Rareza': 'Rareza',
        }
        df = df.rename(columns=rename)
        df = df.drop(columns=[c for c in ['id_ext', 'ID_Habilidad'] if c in df.columns], errors='ignore')
        print(f"  Leyendo {os.path.basename(f)}: {len(df)} filas")
        n = bulk_insert(conn, tbl, df, chunk=10000)
        total += n
        print(f"  +{n} habilidades importadas")
    
    print(f"  Total habilidades: {total}")

# ─────────────────────────────────────────────────────────────
# STEP 4: OPTIMIZAR ÍNDICES FINALES
# ─────────────────────────────────────────────────────────────
def optimizar_indices_finales(conn, planet_id):
    print("\n[IDX] Creando indices de rendimiento en tablas grandes...")
    cur = conn.cursor()
    cur.execute("SELECT table_name FROM categories WHERE planet_id=?", (planet_id,))
    tables = [r[0] for r in cur.fetchall()]
    
    index_specs = {
        'ciudades': ['Nombre_Completo', 'Nombre_Corto', 'Nacion_ID', 'Provincia_ID', 'Sistema'],
        'villas':   ['Nombre_Completo', 'Nombre_Corto', 'Ciudad_ID', 'Nacion_ID'],
        'aldeas':   ['Nombre_Completo', 'Nombre_Corto', 'Villa_ID', 'Ciudad_ID'],
        'naciones': ['Nombre', 'Sistema_Gobierno', 'Continente'],
        'provincias': ['Nombre_Completo', 'Nacion_ID', 'Tipo_Division'],
        'criaturas': ['Rareza', 'Peligrosidad', 'Habito'],
        'minerales': ['Rareza', 'Poder'],
        'plantas':  ['Rareza', 'Utilidad'],
        'clases':   ['Rareza', 'Nivel'],
        'especialidades': ['Nivel_Rareza', 'Clase_Base'],
        'habilidades':    ['Rareza', 'Tipo'],
    }
    
    for tbl in tables:
        key = next((k for k in index_specs if k in tbl.lower()), None)
        if not key:
            continue
        cur.execute(f'PRAGMA table_info("{tbl}")')
        existing_cols = {r[1] for r in cur.fetchall()}
        for col in index_specs[key]:
            if col not in existing_cols:
                continue
            idx_name = f"idx_{tbl}_{col}".replace(' ', '_')[:63]
            try:
                cur.execute(f'CREATE INDEX IF NOT EXISTS "{idx_name}" ON "{tbl}" ("{col}")')
            except Exception as e:
                pass
    
    conn.commit()
    cur.execute("PRAGMA optimize")
    print("  [OK] Indices creados y BD optimizada")

# ─────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────
def main():
    t0 = time.time()
    print("=" * 60)
    print("  IMPORTADOR GEOGRÁFICO + HABILIDADES")
    print("=" * 60)
    
    conn = get_conn()
    try:
        planet_id = get_planet_id(conn)
        
        # 1. Limpiar hemisferios erróneos
        limpiar_hemisferios(conn, planet_id)
        
        # 2. Geografía en orden jerárquico
        importar_geografia(conn, planet_id)
        importar_continentes_naciones(conn, planet_id)
        importar_provincias(conn, planet_id)
        importar_ciudades(conn, planet_id)
        importar_villas(conn, planet_id)
        importar_aldeas(conn, planet_id)
        
        # 3. Habilidades
        importar_habilidades(conn, planet_id)
        
        # 4. Optimización final
        optimizar_indices_finales(conn, planet_id)
        
        # 5. Resumen
        print("\nRESUMEN FINAL:")
        cur = conn.cursor()
        cur.execute("SELECT name, table_name FROM categories WHERE planet_id=?", (planet_id,))
        for name, tbl in cur.fetchall():
            cur.execute(f'SELECT COUNT(*) FROM "{tbl}"')
            n = cur.fetchone()[0]
            if n > 0:
                print(f"  OK {name}: {n:,} registros")
        
    finally:
        conn.close()
    
    elapsed = time.time() - t0
    print(f"\n{'='*60}")
    print(f"  COMPLETADO en {elapsed:.1f}s")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()
