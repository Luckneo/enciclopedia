"""
IMPORTADOR MAESTRO DEL SISTEMA DE AETHERMUNDUS
Importa: Clases, Especialidades, Conceptos, Subespecies, Razas/Subespecies
a la base de datos de la Enciclopedia Planetaria.

Uso: python importar_sistema.py
"""

import sqlite3
import pandas as pd
import os
import glob
import time

DB_PATH = "encyclopedia.db"
DATOS_DIR = "datos"

# ─────────────────────────────────────────────────────────────
# UTILS
# ─────────────────────────────────────────────────────────────

def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")
    conn.execute("PRAGMA cache_size=-65536")   # 64 MB cache
    conn.execute("PRAGMA temp_store=MEMORY")
    return conn

def get_planet_id(conn, name_hint="li"):
    """Obtiene el planeta que contiene las tablas Clases/Especialidades/Conceptos."""
    cur = conn.cursor()
    cur.execute("SELECT id, name FROM planets ORDER BY id LIMIT 10")
    rows = cur.fetchall()
    print("Planetas disponibles:")
    for pid, pname in rows:
        cur.execute("SELECT COUNT(*) FROM categories WHERE planet_id=?", (pid,))
        n = cur.fetchone()[0]
        # Verificar si tiene la tabla Clases
        cur.execute("SELECT COUNT(*) FROM categories WHERE planet_id=? AND name='Clases'", (pid,))
        has_clases = cur.fetchone()[0]
        marker = " ← SELECCIONADO (tiene Clases)" if has_clases else ""
        print(f"  [{pid}] {pname}: {n} categorías{marker}")
    
    # Preferir el planeta que tenga la tabla Clases
    cur.execute("SELECT planet_id FROM categories WHERE name='Clases' LIMIT 1")
    res = cur.fetchone()
    if res:
        best = res[0]
    else:
        # Fallback: planeta con más categorías
        cur.execute("""SELECT planet_id, COUNT(*) as c FROM categories 
                       GROUP BY planet_id ORDER BY c DESC LIMIT 1""")
        res = cur.fetchone()
        best = res[0] if res else (rows[0][0] if rows else 1)
    
    print(f"✅ Usando planeta ID={best}")
    return best

def get_table_name(conn, planet_id, cat_name):
    cur = conn.cursor()
    cur.execute("SELECT table_name FROM categories WHERE planet_id=? AND name=?", (planet_id, cat_name))
    res = cur.fetchone()
    return res[0] if res else None

def read_csv_safe(path, **kwargs):
    """Lee CSV intentando múltiples encodings."""
    for enc in ["utf-8", "utf-8-sig", "latin-1", "cp1252"]:
        try:
            return pd.read_csv(path, encoding=enc, **kwargs)
        except (UnicodeDecodeError, UnicodeError):
            continue
    return pd.read_csv(path, encoding="latin-1", errors="replace", **kwargs)

def bulk_insert(conn, table_name, df, chunk=5000):
    """Inserta DataFrame en la tabla con transacciones en lotes."""
    if df.empty:
        return 0
    cur = conn.cursor()
    # Obtener columnas reales de la tabla
    cur.execute(f'PRAGMA table_info("{table_name}")')
    real_cols = [r[1] for r in cur.fetchall()]
    skip = {"id", "parent_id", "image_path", "is_favorite"}
    valid_cols = [c for c in real_cols if c.lower() not in skip]

    # Mapear columnas del DF a columnas de la tabla (case-insensitive)
    mapping = {}
    for vc in valid_cols:
        for dc in df.columns:
            if dc.strip().lower().replace("_","") == vc.strip().lower().replace("_",""):
                mapping[dc] = vc
                break
            if dc.strip() == vc.strip():
                mapping[dc] = vc
                break
    if not mapping:
        print(f"  ⚠️  Sin columnas mapeables para {table_name}. DF cols: {list(df.columns)[:6]}")
        return 0

    df_mapped = df[list(mapping.keys())].rename(columns=mapping)
    # Mantener solo columnas que existen en la tabla
    df_final = df_mapped[[c for c in df_mapped.columns if c in real_cols]]
    df_final = df_final.fillna("")

    cols_str = ", ".join(f'"{c}"' for c in df_final.columns)
    placeholders = ", ".join("?" * len(df_final.columns))
    sql = f'INSERT OR IGNORE INTO "{table_name}" ({cols_str}) VALUES ({placeholders})'

    total = 0
    rows = df_final.values.tolist()
    for i in range(0, len(rows), chunk):
        batch = rows[i:i+chunk]
        conn.executemany(sql, batch)
        conn.commit()
        total += len(batch)
        print(f"    → {total}/{len(rows)} registros insertados", end="\r")
    print()
    return total

# ─────────────────────────────────────────────────────────────
# STEP 1: OPTIMIZAR BD (índices y PRAGMA)
# ─────────────────────────────────────────────────────────────

def optimizar_bd(conn, planet_id):
    print("\n⚡ Aplicando optimizaciones de BD...")
    cur = conn.cursor()
    # PRAGMA de velocidad
    cur.execute("PRAGMA journal_mode=WAL")
    cur.execute("PRAGMA synchronous=NORMAL")
    cur.execute("PRAGMA cache_size=-131072")  # 128 MB
    cur.execute("PRAGMA temp_store=MEMORY")
    cur.execute("PRAGMA mmap_size=536870912")  # 512 MB mmap
    
    # Obtener todas las tablas del planeta
    cur.execute("SELECT table_name FROM categories WHERE planet_id=?", (planet_id,))
    tables = [r[0] for r in cur.fetchall()]
    
    for tbl in tables:
        # Buscar columnas de nombre y nivel para indexar
        cur.execute(f'PRAGMA table_info("{tbl}")')
        cols = [r[1] for r in cur.fetchall()]
        idx_cols = []
        for col in cols:
            cl = col.lower()
            if any(k in cl for k in ["nombre", "rareza nivel", "utilidad nivel", "poder nivel", "nivel_rareza", "nivel"]):
                idx_cols.append(col)
        for col in idx_cols[:3]:  # max 3 índices por tabla
            idx_name = f"idx_{tbl}_{col}".replace(" ", "_").replace("/", "_")[:60]
            try:
                cur.execute(f'CREATE INDEX IF NOT EXISTS "{idx_name}" ON "{tbl}" ("{col}")')
            except Exception:
                pass
    conn.commit()
    print("  ✅ Índices y PRAGMA aplicados")

# ─────────────────────────────────────────────────────────────
# STEP 2: IMPORTAR CLASES
# ─────────────────────────────────────────────────────────────

RAREZA_EQUIVALENCIA = {
    "Común": "Común y Frecuente",
    "Comun": "Común y Frecuente",
    "Com\u00fan": "Común y Frecuente",
    "Poco Común": "Inusual y Poco Común",
    "Poco Com\u00fan": "Inusual y Poco Común",
    "Raro": "Raro y Excepcional",
    "Épico": "Élite y Épico",
    "Epico": "Élite y Épico",
    "\u00c9pico": "Élite y Épico",
    "Legendario": "Legendario",
    "Mítico": "Mítico",
    "M\u00edtico": "Mítico",
    "Ancestral": "Ancestral",
    "Divino": "Divino",
    "Cósmico": "Cósmico",
    "C\u00f3smico": "Cósmico",
    "Trascendente": "Trascendental",
    "Trascendental": "Trascendental",
    "Primordial": "Primordial",
    "Absoluta": "Absoluta",
    "Etéreo": "Etéreo",
    "Et\u00e9reo": "Etéreo",
    "Único": "Único",
    "\u00danico": "Único",
}

RAREZA_A_NIVEL = {
    "Común y Frecuente": 1, "Inusual y Poco Común": 2, "Raro y Excepcional": 3,
    "Élite y Épico": 4, "Legendario": 5, "Mítico": 6, "Ancestral": 7,
    "Divino": 8, "Cósmico": 9, "Trascendental": 10, "Primordial": 11,
    "Absoluta": 12, "Etéreo": 13, "Único": 14,
}

def normalizar_rareza(val):
    if pd.isna(val) or val == "":
        return "Común y Frecuente"
    v = str(val).strip()
    return RAREZA_EQUIVALENCIA.get(v, v)

def importar_clases(conn, planet_id):
    print("\n📚 Importando CLASES (1,119)...")
    path = os.path.join(DATOS_DIR, "01_Clases_1119_COMPLETO.csv")
    if not os.path.exists(path):
        print("  ❌ Archivo no encontrado:", path)
        return
    
    df = read_csv_safe(path)
    print(f"  Leídas {len(df)} filas. Columnas: {list(df.columns)}")
    
    # Normalizar rareza y calcular nivel
    if "Rareza" in df.columns:
        df["Rareza"] = df["Rareza"].apply(normalizar_rareza)
        df["Nivel"] = df["Rareza"].map(RAREZA_A_NIVEL).fillna(1).astype(int)
    
    # Mapear columnas del CSV al esquema de la BD
    # Esquema BD: id, Nivel, Rareza, "Nombre de Clase", "Categoría Funcional", "Rol de Juego", "Descripción Funcional", "Recomendado para"
    rename = {}
    col_map = {
        "Nombre": "Nombre de Clase",
        "Rol_Principal": "Rol de Juego",
        "Tipo": "Categoría Funcional",
        "Descripción": "Descripción Funcional",
        "Descripcion": "Descripción Funcional",
        "Dificultad": "Recomendado para",
    }
    for src, dst in col_map.items():
        if src in df.columns:
            rename[src] = dst
    if rename:
        df = df.rename(columns=rename)
    
    tbl = get_table_name(conn, planet_id, "Clases")
    if not tbl:
        print("  ❌ Tabla Clases no encontrada en BD")
        return
    
    n = bulk_insert(conn, tbl, df)
    print(f"  ✅ {n} clases importadas → {tbl}")

# ─────────────────────────────────────────────────────────────
# STEP 3: IMPORTAR ESPECIALIDADES
# ─────────────────────────────────────────────────────────────

def importar_especialidades(conn, planet_id):
    print("\n⚔️  Importando ESPECIALIDADES...")
    path = os.path.join(DATOS_DIR, "Sistema_Especialidades_Fantasy_COMPLETO.xlsx")
    if not os.path.exists(path):
        print("  ❌ Archivo no encontrado:", path)
        return
    
    df = pd.read_excel(path, sheet_name="Especialidades Generadas")
    print(f"  Leídas {len(df)} filas. Columnas: {list(df.columns)}")
    
    if "Nombre_Rareza" in df.columns:
        df["Nombre_Rareza"] = df["Nombre_Rareza"].apply(normalizar_rareza)
    
    tbl = get_table_name(conn, planet_id, "Especialidades")
    if not tbl:
        print("  ❌ Tabla Especialidades no encontrada")
        return
    
    n = bulk_insert(conn, tbl, df)
    print(f"  ✅ {n} especialidades importadas → {tbl}")

# ─────────────────────────────────────────────────────────────
# STEP 4: IMPORTAR CONCEPTOS
# ─────────────────────────────────────────────────────────────

def importar_conceptos(conn, planet_id):
    print("\n💫 Importando CONCEPTOS...")
    path = os.path.join(DATOS_DIR, "Sistema_Conceptos_Fantasy_COMPLETO.xlsx")
    if not os.path.exists(path):
        print("  ❌ Archivo no encontrado:", path)
        return
    
    df = pd.read_excel(path, sheet_name="Conceptos (Muestra)")
    print(f"  Leídas {len(df)} filas. Columnas: {list(df.columns)}")
    
    # Columnas BD: id, Nombre, Categoría, Rareza, Bonificación, Nivel
    # Columnas CSV: Nombre, Categoría, Rareza, Bonificación, Nivel  → ya coinciden
    
    tbl = get_table_name(conn, planet_id, "Conceptos")
    if not tbl:
        print("  ❌ Tabla Conceptos no encontrada")
        return
    
    n = bulk_insert(conn, tbl, df)
    print(f"  ✅ {n} conceptos importados → {tbl}")

# ─────────────────────────────────────────────────────────────
# STEP 5: IMPORTAR SUBESPECIES
# ─────────────────────────────────────────────────────────────

def importar_subespecies(conn, planet_id):
    print("\n🧬 Importando SUBESPECIES (251)...")
    path = os.path.join(DATOS_DIR, "Sistema_Subespecies_Mitologicas.xlsx")
    if not os.path.exists(path):
        print("  ❌ Archivo no encontrado:", path)
        return
    
    df = pd.read_excel(path, sheet_name="Todas las Subespecies")
    print(f"  Leídas {len(df)} filas. Columnas: {list(df.columns)}")
    # BD: "Raza Base", "Subespecie/Variante", "Origen Mitológico", "Descripción" → ya coinciden
    
    tbl = get_table_name(conn, planet_id, "Subespecies")
    if not tbl:
        print("  ❌ Tabla Subespecies no encontrada")
        return
    
    n = bulk_insert(conn, tbl, df)
    print(f"  ✅ {n} subespecies importadas → {tbl}")

# ─────────────────────────────────────────────────────────────
# STEP 6: VERIFICAR + NORMALIZAR CRIATURAS EXISTENTES
# ─────────────────────────────────────────────────────────────

RAREZA_NIVEL_MAP = {
    "Mundano": 1, "Poco Común": 2, "Singular": 3, "Extraordinario": 4,
    "Mítico": 5, "Trascendente": 6, "Divino": 7, "Primordial": 8, "Único": 9,
}

def verificar_criaturas(conn, planet_id):
    """Verifica si las criaturas ya están normalizadas con los nombres épicos."""
    tbl = get_table_name(conn, planet_id, "Criaturas")
    if not tbl:
        print("  ❌ Tabla Criaturas no encontrada")
        return
    cur = conn.cursor()
    cur.execute(f'SELECT COUNT(*) FROM "{tbl}"')
    total = cur.fetchone()[0]
    if total == 0:
        print("  ℹ️  Tabla Criaturas vacía, nada que verificar")
        return
    cur.execute(f'SELECT "Rareza" FROM "{tbl}" LIMIT 5')
    samples = [r[0] for r in cur.fetchall()]
    print(f"  📊 Criaturas en BD: {total}")
    print(f"  Muestra rareza: {samples}")
    
    # Si ya tienen nombres épicos (ej: "Mundano"), están bien
    epic_names = set(RAREZA_NIVEL_MAP.keys())
    if any(str(s) in epic_names for s in samples if s):
        print("  ✅ Criaturas ya normalizadas con nombres épicos del sistema")
    else:
        print("  ⚠️  Criaturas con nombres simples — considera re-importar con los batch CSVs")

# ─────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────

def main():
    t0 = time.time()
    print("═" * 60)
    print("  IMPORTADOR MAESTRO — SISTEMA AETHERMUNDUS")
    print("═" * 60)
    
    if not os.path.exists(DB_PATH):
        print(f"❌ Base de datos no encontrada: {DB_PATH}")
        return
    
    conn = get_conn()
    
    try:
        planet_id = get_planet_id(conn)
        
        # 1. Optimizar BD primero
        optimizar_bd(conn, planet_id)
        
        # 2. Importar datos del sistema
        importar_clases(conn, planet_id)
        importar_especialidades(conn, planet_id)
        importar_conceptos(conn, planet_id)
        importar_subespecies(conn, planet_id)
        
        # 3. Verificar criaturas existentes
        print("\n🔍 Verificando criaturas existentes...")
        verificar_criaturas(conn, planet_id)
        
        # 4. VACUUM final para compactar
        print("\n🧹 Optimizando archivo de BD (VACUUM ANALYZE)...")
        conn.execute("PRAGMA optimize")
        conn.commit()
        
    finally:
        conn.close()
    
    elapsed = time.time() - t0
    print(f"\n{'═'*60}")
    print(f"  ✅ IMPORTACIÓN COMPLETADA en {elapsed:.1f}s")
    print(f"{'═'*60}")

if __name__ == "__main__":
    main()
