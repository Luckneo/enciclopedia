"""
IMPORTADOR COMPLETO - Todos los batches restantes de Plantas, Minerales y Criaturas
"""
import sqlite3, pandas as pd, glob, os, io, sys, time
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

DB_PATH = "encyclopedia.db"
DATOS   = "datos"

def get_conn():
    c = sqlite3.connect(DB_PATH)
    c.execute("PRAGMA journal_mode=WAL")
    c.execute("PRAGMA synchronous=NORMAL")
    c.execute("PRAGMA cache_size=-131072")
    c.execute("PRAGMA temp_store=MEMORY")
    c.execute("PRAGMA mmap_size=536870912")
    return c

def read_csv(path):
    for enc in ['utf-8-sig','utf-8','latin-1','cp1252']:
        try: return pd.read_csv(path, encoding=enc)
        except (UnicodeDecodeError, UnicodeError): pass
    return pd.read_csv(path, encoding='latin-1', errors='replace')

def norm(s):
    return s.lower().replace(' ','_').replace('ó','o').replace('á','a')\
            .replace('é','e').replace('í','i').replace('ú','u').replace('ñ','n')

def get_cols(conn, tbl):
    return [r[1] for r in conn.execute(f'PRAGMA table_info("{tbl}")').fetchall()]

def count(conn, tbl):
    return conn.execute(f'SELECT COUNT(*) FROM "{tbl}"').fetchone()[0]

def table_for(conn, pid, name):
    r = conn.execute("SELECT table_name FROM categories WHERE planet_id=? AND name=?", (pid,name)).fetchone()
    return r[0] if r else None

def planet_id(conn):
    r = conn.execute("SELECT planet_id FROM categories WHERE name='Clases' LIMIT 1").fetchone()
    return r[0] if r else 2

def bulk_insert(conn, tbl, df, chunk=15000):
    if df.empty: return 0
    real_cols = get_cols(conn, tbl)
    skip = {'id','parent_id','image_path','is_favorite'}
    valid = [c for c in real_cols if c.lower() not in skip]
    mapping = {}
    for vc in valid:
        vn = norm(vc)
        for dc in df.columns:
            if norm(dc) == vn or dc == vc:
                mapping[dc] = vc; break
    if not mapping:
        df_cols = [c for c in df.columns if c.lower() not in {'id','index'}][:len(valid)]
        mapping = {df_cols[i]: valid[i] for i in range(min(len(df_cols),len(valid)))}
    df_m = df[list(mapping)].rename(columns=mapping)
    df_f = df_m[[c for c in df_m.columns if c in real_cols]].fillna('').astype(str).replace('nan','')
    if df_f.empty: return 0
    cols_q = ', '.join(f'"{c}"' for c in df_f.columns)
    ph = ', '.join(['?']*len(df_f.columns))
    sql = f'INSERT OR IGNORE INTO "{tbl}" ({cols_q}) VALUES ({ph})'
    rows = df_f.values.tolist()
    total = 0
    for i in range(0, len(rows), chunk):
        conn.executemany(sql, rows[i:i+chunk])
        conn.commit()
        total += len(rows[i:i+chunk])
        print(f"    {total:>8,}/{len(rows):,}", end='\r')
    print()
    return total

def importar_todo():
    conn = get_conn()
    pid  = planet_id(conn)
    t0   = time.time()

    rareza_nivel = {'Decorativa':1,'Comestible':2,'Medicinal':3,'Alquimica':4,
                    'Alquímica':4,'Magica':5,'Mágica':5,'Sagrada':6,'Prohibida':7,'Venenosa':8,'Curativa':8}
    peligro_niv_pl= {'Inofensiva':1,'Irritante':2,'Venenosa':3,'Letal':4,
                     'Corrosiva':5,'Paralizante':6,'Devastadora':7,'Apocaliptica':8,'Apocalíptica':8}
    poder_nivel  = {'Inerte':0,'Resonante':1,'Activo':2,'Potente':3,'Intenso':4,
                    'Poderoso':5,'Arcano':6,'Sagrado':7,'Legendario':8,'Cosmico':9,'Cósmico':9}
    estab_nivel  = {'Indestructible':0,'Estable':1,'Sensible':2,'Volatile':3,'Volátil':3,
                    'Inestable':4,'Reactivo':5,'Explosivo':6,'Impredecible':7}
    rareza_crit  = {'Mundano':1,'Poco Común':2,'Singular':3,'Extraordinario':4,'Mítico':5,
                    'Mitico':5,'Trascendente':6,'Divino':7,'Primordial':8,'Único':9,'Unico':9}
    peligro_crit = {'Inocuo':1,'Menor':2,'Cauteloso':3,'Amenazante':4,'Mortal':5,
                    'Cataclismico':6,'Cataclísmico':6,'Apocaliptico':7,'Apocalíptico':7,
                    'Cosmico':8,'Cósmico':8,'Omniversal':9}

    # ── PLANTAS ──────────────────────────────────────────────
    tbl = table_for(conn, pid, "Plantas")
    existing = count(conn, tbl)
    batches = sorted(glob.glob(os.path.join(DATOS, "PLANTAS_PARTE*.csv")))
    done = existing // 50000  # batches ya procesados
    pending = batches[done:]
    print(f"\n[PLANTAS] {existing:,} ya importadas. Batches pendientes: {len(pending)}")
    total_pl = 0
    for i, fpath in enumerate(pending, done+1):
        print(f"  Batch {i}/{len(batches)}: {os.path.basename(fpath)}")
        df = read_csv(fpath).drop(columns=['ID'], errors='ignore')
        ren = {'Nombre_Común':'Nombre Común','Nombre_Comun':'Nombre Común',
               'Nombre_Científico':'Nombre Científico','Nombre_Cientifico':'Nombre Científico',
               'Peligrosidad_Icono':'Peligrosidad Icono'}
        for o,n in ren.items():
            if o in df.columns: df = df.rename(columns={o:n})
        if 'Utilidad' in df.columns and 'Utilidad Nivel' not in df.columns:
            df['Utilidad Nivel'] = df['Utilidad'].map(rareza_nivel).fillna(1).astype(int)
        if 'Peligrosidad' in df.columns and 'Peligrosidad Nivel' not in df.columns:
            df['Peligrosidad Nivel'] = df['Peligrosidad'].map(peligro_niv_pl).fillna(1).astype(int)
        n2 = bulk_insert(conn, tbl, df)
        total_pl += n2
        print(f"  +{n2:,} | acumulado tabla: {count(conn, tbl):,}")
    print(f"  [OK] Plantas totales: {count(conn, tbl):,}")

    # ── MINERALES ────────────────────────────────────────────
    tbl = table_for(conn, pid, "Minerales")
    existing = count(conn, tbl)
    batches = sorted(glob.glob(os.path.join(DATOS, "MINERALES_Batch_*.csv")))
    done = existing // 50000
    pending = batches[done:]
    print(f"\n[MINERALES] {existing:,} ya importados. Batches pendientes: {len(pending)}")
    for i, fpath in enumerate(pending, done+1):
        print(f"  Batch {i}/{len(batches)}: {os.path.basename(fpath)}")
        df = read_csv(fpath).drop(columns=['ID'], errors='ignore')
        ren = {'Fórmula':'Fórmula','Formula':'Fórmula','Nivel_Poder':'Poder Nivel',
               'Dificultad_Extracción':'Extracción','Dificultad_Extraccion':'Extracción',
               'Dureza_Mohs':'Dureza Mohs'}
        for o,n in ren.items():
            if o in df.columns: df = df.rename(columns={o:n})
        if 'Estabilidad' in df.columns and 'Estabilidad Nivel' not in df.columns:
            df['Estabilidad Nivel'] = df['Estabilidad'].map(estab_nivel).fillna(1).astype(int)
        if 'Poder' in df.columns and 'Poder Nivel' not in df.columns:
            df['Poder Nivel'] = df['Poder'].map(poder_nivel).fillna(0).astype(int)
        n2 = bulk_insert(conn, tbl, df)
        print(f"  +{n2:,} | acumulado tabla: {count(conn, tbl):,}")
    print(f"  [OK] Minerales totales: {count(conn, tbl):,}")

    # ── CRIATURAS (PARTE1 batches 6-10, PARTE2, PARTE3) ──────
    tbl = table_for(conn, pid, "Criaturas")
    existing = count(conn, tbl)
    all_batches = (sorted(glob.glob(os.path.join(DATOS,"PARTE1_Criaturas_Batch_*.csv"))) +
                   sorted(glob.glob(os.path.join(DATOS,"PARTE2_Criaturas_Batch_*.csv"))) +
                   sorted(glob.glob(os.path.join(DATOS,"PARTE3_Criaturas_Batch_*.csv"))))
    done = existing // 50000
    pending = all_batches[done:]
    print(f"\n[CRIATURAS] {existing:,} ya importadas. Batches pendientes: {len(pending)}/{len(all_batches)}")
    for i, fpath in enumerate(pending, done+1):
        print(f"  Batch {i}/{len(all_batches)}: {os.path.basename(fpath)}")
        df = read_csv(fpath).drop(columns=['ID'], errors='ignore')
        ren = {'Nombre_Común':'Nombre Común','Nombre_Comun':'Nombre Común',
               'Nombre_Científico':'Nombre Científico','Nombre_Cientifico':'Nombre Científico',
               'Peligrosidad_Icono':'Peligrosidad Icono','Ritual_Captura':'Captura Ritual',
               'Nivel_Captura':'Captura Nivel','Dificultad_Captura':'Captura'}
        for o,n in ren.items():
            if o in df.columns: df = df.rename(columns={o:n})
        if 'Rareza' in df.columns and 'Rareza Nivel' not in df.columns:
            df['Rareza Nivel'] = df['Rareza'].map(rareza_crit).fillna(1).astype(int)
        if 'Peligrosidad' in df.columns and 'Peligrosidad Nivel' not in df.columns:
            df['Peligrosidad Nivel'] = df['Peligrosidad'].map(peligro_crit).fillna(1).astype(int)
        n2 = bulk_insert(conn, tbl, df)
        print(f"  +{n2:,} | acumulado tabla: {count(conn, tbl):,}")
    print(f"  [OK] Criaturas totales: {count(conn, tbl):,}")

    # ── FINAL ────────────────────────────────────────────────
    conn.execute("PRAGMA optimize")
    conn.close()
    print(f"\n  COMPLETADO en {time.time()-t0:.0f}s")

if __name__ == "__main__":
    importar_todo()
