import sqlite3
import pandas as pd
import shutil
import os
import zipfile
import time

def backup_database(db_path="encyclopedia.db"):
    if not os.path.exists(db_path): return False
    base_dir = os.path.dirname(os.path.abspath(db_path))
    backup_dir = os.path.join(base_dir, "datos", "backups")
    os.makedirs(backup_dir, exist_ok=True)
    
    # Solo hacer backup si el último tiene más de 24 horas (86400 segundos) para evitar lag y desperdicio de disco
    try:
        backups = [os.path.join(backup_dir, f) for f in os.listdir(backup_dir) if f.endswith(".db")]
        if backups:
            latest_backup = max(backups, key=os.path.getmtime)
            if time.time() - os.path.getmtime(latest_backup) < 86400:
                return True
    except Exception:
        pass

    import threading
    def run_backup():
        try:
            stamp = time.strftime("%Y%m%d_%H%M%S")
            dest = os.path.join(backup_dir, f"encyclopedia_backup_{stamp}.db")
            dst_conn = sqlite3.connect(dest)
            with dst_conn:
                src_conn = sqlite3.connect(db_path)
                src_conn.backup(dst_conn)
                src_conn.close()
            dst_conn.close()
        except Exception:
            pass

    threading.Thread(target=run_backup, daemon=True).start()
    return True


def get_connection(db_path="encyclopedia.db"):
    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA foreign_keys = 1")
    # Rendimiento: WAL mode + cache 64MB + mmap 256MB
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")
    conn.execute("PRAGMA cache_size=-65536")
    conn.execute("PRAGMA temp_store=MEMORY")
    conn.execute("PRAGMA mmap_size=268435456")
    return conn

def init_db(db_path="encyclopedia.db"):
    conn = get_connection(db_path)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS planets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            planet_id INTEGER,
            name TEXT,
            table_name TEXT,
            FOREIGN KEY(planet_id) REFERENCES planets(id)
        )
    """)
    # Migration for old tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'p_%'")
    tables = cursor.fetchall()
    for (table,) in tables:
        cursor.execute(f"PRAGMA table_info({table})")
        columns = [info[1] for info in cursor.fetchall()]
        if "parent_id" not in columns:
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN parent_id INTEGER DEFAULT 0")
        if "image_path" not in columns:
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN image_path TEXT DEFAULT ''")
        if "is_favorite" not in columns:
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN is_favorite INTEGER DEFAULT 0")
    # Migration for new missing tables on existing planets
    cursor.execute("SELECT id FROM planets")
    planet_ids = [r[0] for r in cursor.fetchall()]
    conn.commit()
    conn.close()
    
    import threading
    for pid in planet_ids:
        sync_planet_tables(pid, db_path)
        # Lanzar la construcción del índice FTS en un hilo secundario para evitar colgar la interfaz de usuario
        threading.Thread(target=build_fts_index, args=(pid, db_path), daemon=True).start()

def build_fts_index(planet_id, db_path="encyclopedia.db"):
    """Crea/actualiza índice FTS5 para búsqueda instantánea en todas las tablas del planeta."""
    conn = get_connection(db_path)
    cursor = conn.cursor()
    
    # Verificar que SQLite tiene soporte FTS5
    try:
        cursor.execute("CREATE VIRTUAL TABLE IF NOT EXISTS _fts_test USING fts5(x)")
        cursor.execute("DROP TABLE IF EXISTS _fts_test")
    except Exception:
        conn.close()
        return  # FTS5 no disponible, salir silenciosamente
    
    fts_table = f"fts_planet_{planet_id}"
    
    # Crear tabla FTS5 si no existe
    cursor.execute(f"""
        CREATE VIRTUAL TABLE IF NOT EXISTS "{fts_table}"
        USING fts5(
            nombre,
            categoria,
            tabla_origen,
            row_id UNINDEXED,
            tokenize='unicode61'
        )
    """)
    conn.commit()

    # Comprobar si ya está poblado para evitar reconstrucción costosa e innecesaria en el inicio
    try:
        cursor.execute(f"SELECT COUNT(*) FROM \"{fts_table}\"")
        if cursor.fetchone()[0] > 0:
            conn.close()
            return
    except Exception:
        pass
    
    # Detectar columnas de nombre en cada tabla del planeta
    cursor.execute("SELECT name, table_name FROM categories WHERE planet_id=?", (planet_id,))
    cats = cursor.fetchall()
    
    NAME_COLS = ["Nombre", "Nombre_Completo", "Nombre Común", "Nombre de Clase",
                 "Especialidad", "Raza Base", "Raza"]
    
    for cat_name, table_name in cats:
        try:
            cursor.execute(f'PRAGMA table_info("{table_name}")')
            cols = [r[1] for r in cursor.fetchall()]
            name_col = next((c for c in NAME_COLS if c in cols), None)
            if not name_col:
                continue
            
            cat_col = next((c for c in cols if "categ" in c.lower() or "tipo" in c.lower()), "")
            
            # 1. Autocuración: Eliminar de fts_table las filas huérfanas que ya no existen en la tabla base
            cursor.execute(f"""
                DELETE FROM "{fts_table}"
                WHERE tabla_origen = ? AND row_id NOT IN (SELECT id FROM "{table_name}")
            """, (cat_name,))
            
            # 2. Autocuración: Insertar solo las filas que falten por indexar
            sql = f"""
                INSERT INTO "{fts_table}" (nombre, categoria, tabla_origen, row_id)
                SELECT t."{name_col}", {f't."{cat_col}"' if cat_col else "''"}, ?, t.id
                FROM "{table_name}" t
                LEFT JOIN "{fts_table}" f ON f.tabla_origen = ? AND f.row_id = t.id
                WHERE f.row_id IS NULL AND t."{name_col}" IS NOT NULL AND t."{name_col}" != ''
            """
            cursor.execute(sql, (cat_name, cat_name))
            conn.commit()
            
            # 3. Crear disparadores (triggers) para mantener FTS5 sincronizado de manera autónoma
            cursor.execute(f"""
                CREATE TRIGGER IF NOT EXISTS "trg_{table_name}_insert" AFTER INSERT ON "{table_name}"
                BEGIN
                    INSERT INTO "{fts_table}" (nombre, categoria, tabla_origen, row_id)
                    VALUES (new."{name_col}", {f'new."{cat_col}"' if cat_col else "''"}, '{cat_name}', new.id);
                END;
            """)
            cursor.execute(f"""
                CREATE TRIGGER IF NOT EXISTS "trg_{table_name}_update" AFTER UPDATE OF "{name_col}"{f', "{cat_col}"' if cat_col else ''} ON "{table_name}"
                BEGIN
                    UPDATE "{fts_table}"
                    SET nombre = new."{name_col}"{f', categoria = new."{cat_col}"' if cat_col else ''}
                    WHERE tabla_origen = '{cat_name}' AND row_id = old.id;
                END;
            """)
            cursor.execute(f"""
                CREATE TRIGGER IF NOT EXISTS "trg_{table_name}_delete" AFTER DELETE ON "{table_name}"
                BEGIN
                    DELETE FROM "{fts_table}"
                    WHERE tabla_origen = '{cat_name}' AND row_id = old.id;
                END;
            """)
            conn.commit()
        except Exception:
            pass
    
    conn.close()

def global_search(query, planet_id, db_path="encyclopedia.db", limit=200):
    """
    Búsqueda FTS5 instantánea en todas las categorías del planeta.
    Retorna lista de dicts: {nombre, categoria, tabla_origen, row_id}
    """
    if not query or not query.strip():
        return []
    conn = get_connection(db_path)
    cursor = conn.cursor()
    fts_table = f"fts_planet_{planet_id}"
    
    results = []
    try:
        # FTS5 query — añadir * para prefix search
        fts_query = " ".join(f'"{w}"*' for w in query.strip().split() if w)
        cursor.execute(f"""
            SELECT nombre, categoria, tabla_origen, row_id
            FROM "{fts_table}"
            WHERE "{fts_table}" MATCH ?
            ORDER BY rank
            LIMIT ?
        """, (fts_query, limit))
        for nombre, cat, tabla, rid in cursor.fetchall():
            results.append({"nombre": nombre, "categoria": cat,
                           "tabla_origen": tabla, "row_id": rid})
    except Exception:
        # Fallback: LIKE simple en la primera tabla disponible
        pass
    finally:
        conn.close()
    return results


def init_planet_systems(planet_id, conn):
    cursor = conn.cursor()
    cursor.execute(f"""
        CREATE TABLE IF NOT EXISTS "p_{planet_id}_relaciones" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT,
            "origen_tabla" TEXT NOT NULL,
            "origen_id" INTEGER NOT NULL,
            "destino_tabla" TEXT NOT NULL,
            "destino_id" INTEGER NOT NULL,
            "tipo_relacion" TEXT,
            "descripcion" TEXT
        )
    """)
    cursor.execute(f"""
        CREATE TABLE IF NOT EXISTS "p_{planet_id}_game_rules" (
            "clave" TEXT PRIMARY KEY,
            "valor" TEXT
        )
    """)
    cursor.execute(f"""
        CREATE TABLE IF NOT EXISTS "p_{planet_id}_map_pins" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT,
            "x" REAL NOT NULL,
            "y" REAL NOT NULL,
            "target_tabla" TEXT NOT NULL,
            "target_id" INTEGER NOT NULL,
            "etiqueta" TEXT,
            "tipo_icono" TEXT DEFAULT 'default',
            "color" TEXT DEFAULT '#3b82f6'
        )
    """)
    cursor.execute(f"""
        CREATE TABLE IF NOT EXISTS "p_{planet_id}_quests" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT,
            "nombre" TEXT NOT NULL,
            "resumen" TEXT,
            "nivel_recomendado" INTEGER DEFAULT 1,
            "dificultad" TEXT DEFAULT 'Común',
            "dador_id" INTEGER,
            "destino_id" INTEGER,
            "objetivos" TEXT,
            "recompensas" TEXT,
            "estado" TEXT DEFAULT 'Disponible'
        )
    """)
    # Pre-populate default game rules
    cursor.execute(f"SELECT COUNT(*) FROM \"p_{planet_id}_game_rules\"")
    if cursor.fetchone()[0] == 0:
        defaults = [
            ("str_name", "Fuerza (STR)"),
            ("agi_name", "Agilidad (AGI)"),
            ("int_name", "Inteligencia (INT)"),
            ("vit_name", "Vitalidad (VIT)"),
            ("formula_hp", "vit * 12"),
            ("formula_mp", "int * 10"),
            ("formula_atk", "str * 2 + agi * 0.5"),
            ("formula_mag", "int * 2.5"),
            ("formula_spd", "agi * 0.8")
        ]
        cursor.executemany(f"INSERT INTO \"p_{planet_id}_game_rules\" (clave, valor) VALUES (?, ?)", defaults)

def bulk_insert_records(table_name, records, db_path="encyclopedia.db"):
    """Inserta una lista de diccionarios de forma masiva en una sola transacción."""
    if not records:
        return True, "No hay registros para insertar."
    try:
        conn = get_connection(db_path)
        cursor = conn.cursor()
        
        # Obtener columnas de la tabla para asegurar coincidencia
        cursor.execute(f'PRAGMA table_info("{table_name}")')
        cols = [r[1] for r in cursor.fetchall()]
        
        # Filtrar claves válidas
        sample = records[0]
        keys = [k for k in sample.keys() if k in cols]
        
        if not keys:
            conn.close()
            return False, "Ninguna columna coincide con el esquema."
            
        columns_str = ", ".join([f'"{k}"' for k in keys])
        placeholders = ", ".join(["?" for _ in keys])
        
        sql = f'INSERT INTO "{table_name}" ({columns_str}) VALUES ({placeholders})'
        
        data = []
        for r in records:
            data.append(tuple(r[k] for k in keys))
            
        cursor.executemany(sql, data)
        conn.commit()
        conn.close()
        return True, f"Se insertaron {len(records)} registros correctamente."
    except Exception as e:
        return False, str(e)


def sync_planet_tables(planet_id, db_path="encyclopedia.db"):
    # Añade tablas faltantes a planetas viejos
    conn = get_connection(db_path)
    init_planet_systems(planet_id, conn)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM categories WHERE planet_id = ?", (planet_id,))
    existing = [r[0] for r in cursor.fetchall()]
    
    categories = [
        ("Eventos Históricos", f"p_{planet_id}_eventos", '"id" INTEGER PRIMARY KEY AUTOINCREMENT, "Año_Época" TEXT, "Nombre del Evento" TEXT, "Descripción" TEXT, "Tipo" TEXT, "Importancia" INTEGER, parent_id INTEGER DEFAULT 0, image_path TEXT DEFAULT ""'),
        ("Facciones", f"p_{planet_id}_facciones", '"id" INTEGER PRIMARY KEY AUTOINCREMENT, "Nombre" TEXT, "Alineación" TEXT, "Líder" TEXT, "Sede" TEXT, "Descripción" TEXT, parent_id INTEGER DEFAULT 0, image_path TEXT DEFAULT ""'),
        ("Mitos y Deidades", f"p_{planet_id}_mitos", '"id" INTEGER PRIMARY KEY AUTOINCREMENT, "Nombre" TEXT, "Dominio" TEXT, "Culto" TEXT, "Descripción" TEXT, parent_id INTEGER DEFAULT 0, image_path TEXT DEFAULT ""'),
        ("Diario de Aventuras", f"p_{planet_id}_diario", '"id" INTEGER PRIMARY KEY AUTOINCREMENT, "Día/Sesión" TEXT, "Título del Capítulo" TEXT, "Resumen" TEXT, "Recompensas" TEXT, "Notas" TEXT, parent_id INTEGER DEFAULT 0, image_path TEXT DEFAULT ""'),
        ("Artefactos y Reliquias", f"p_{planet_id}_reliquias", '"id" INTEGER PRIMARY KEY AUTOINCREMENT, "Nombre" TEXT, "Poder" TEXT, "Creador" TEXT, "Ubicación Actual" TEXT, "Peligrosidad" INTEGER, parent_id INTEGER DEFAULT 0, image_path TEXT DEFAULT ""'),
        ("NPCs Notables", f"p_{planet_id}_npcs", '"id" INTEGER PRIMARY KEY AUTOINCREMENT, "Nombre" TEXT, "Raza" TEXT, "Ocupación" TEXT, "Secretos" TEXT, "Alineación" TEXT, parent_id INTEGER DEFAULT 0, image_path TEXT DEFAULT ""'),
        # --- Sistema de clases y razas ---
        ("Razas", f"p_{planet_id}_razas", '"id" INTEGER PRIMARY KEY AUTOINCREMENT, "Raza" TEXT, "Categoría" TEXT, "Nivel" INTEGER, "Nombre_Nivel" TEXT, "Bonificación" TEXT, "Poder_Relativo" TEXT, "Descripción" TEXT, parent_id INTEGER DEFAULT 0, image_path TEXT DEFAULT ""'),
        ("Habilidades", f"p_{planet_id}_habilidades", '"id" INTEGER PRIMARY KEY AUTOINCREMENT, "Nombre" TEXT, "Tipo" TEXT, "Elemento" TEXT, "Rareza" TEXT, "Nivel_Requerido" INTEGER, "Costo_Mana" INTEGER, "Cooldown_Segundos" INTEGER, "Daño_Base" INTEGER, "Curación_Base" INTEGER, parent_id INTEGER DEFAULT 0, image_path TEXT DEFAULT ""'),
    ]
    for cat_name, table_name, schema in categories:
        if cat_name not in existing:
            cursor.execute(f"CREATE TABLE IF NOT EXISTS {table_name} ({schema}, is_favorite INTEGER DEFAULT 0)")
            cursor.execute("INSERT INTO categories (planet_id, name, table_name) VALUES (?, ?, ?)", (planet_id, cat_name, table_name))
            
    conn.commit()
    conn.close()


def create_planet(name, db_path="encyclopedia.db"):
    conn = get_connection(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO planets (name) VALUES (?)", (name,))
        planet_id = cursor.lastrowid
        conn.commit()
        return planet_id, None
    except sqlite3.IntegrityError:
        return None, "El planeta ya existe."
    finally:
        conn.close()

def delete_planet(planet_id, db_path="encyclopedia.db"):
    conn = get_connection(db_path)
    cursor = conn.cursor()
    try:
        # Drop all tables linked to this planet
        cursor.execute("SELECT table_name FROM categories WHERE planet_id=?", (planet_id,))
        tables = [r[0] for r in cursor.fetchall()]
        for t in tables:
            cursor.execute(f"DROP TABLE IF EXISTS \"{t}\"")
        cursor.execute("DELETE FROM categories WHERE planet_id=?", (planet_id,))
        cursor.execute("DELETE FROM planets WHERE id=?", (planet_id,))
        conn.commit()
    finally:
        conn.close()

def create_default_tables(planet_id, db_path="encyclopedia.db"):
    conn = get_connection(db_path)
    init_planet_systems(planet_id, conn)
    cursor = conn.cursor()
    
    categories = [
        ("Hemisferios", f"p_{planet_id}_hemisferios", '"id" INTEGER PRIMARY KEY AUTOINCREMENT, "Nombre" TEXT, "Nombre_Corto" TEXT, "Descripción" TEXT, parent_id INTEGER DEFAULT 0, image_path TEXT DEFAULT ""'),
        ("Macrorregiones", f"p_{planet_id}_macrorregiones", '"id" INTEGER PRIMARY KEY AUTOINCREMENT, "Nombre" TEXT, "Nombre_Corto" TEXT, "Estado" TEXT, "Hemisferio" TEXT, parent_id INTEGER DEFAULT 0, image_path TEXT DEFAULT ""'),
        ("Supercontinentes", f"p_{planet_id}_supercontinentes", '"id" INTEGER PRIMARY KEY AUTOINCREMENT, "Nombre" TEXT, "Tipo" TEXT, "Macrorregión" TEXT, "Estado" TEXT, parent_id INTEGER DEFAULT 0, image_path TEXT DEFAULT ""'),
        ("Continentes", f"p_{planet_id}_continentes", '"id" INTEGER PRIMARY KEY AUTOINCREMENT, "Nombre" TEXT, "Tipo" TEXT, "Supercontinente" TEXT, "Estado" TEXT, "Naciones" TEXT, parent_id INTEGER DEFAULT 0, image_path TEXT DEFAULT ""'),
        ("Naciones", f"p_{planet_id}_naciones", '"id" INTEGER PRIMARY KEY AUTOINCREMENT, "Nombre" TEXT, "Sistema_Gobierno" TEXT, "Continente" TEXT, "Continente_ID" TEXT, "Provincias" TEXT, parent_id INTEGER DEFAULT 0, image_path TEXT DEFAULT ""'),
        ("Provincias", f"p_{planet_id}_provincias", '"id" INTEGER PRIMARY KEY AUTOINCREMENT, "Nombre_Completo" TEXT, "Nombre_Corto" TEXT, "Tipo_Division" TEXT, "Nacion_ID" TEXT, "Nacion" TEXT, "Sistema" TEXT, "Orden" TEXT, parent_id INTEGER DEFAULT 0, image_path TEXT DEFAULT ""'),
        ("Ciudades", f"p_{planet_id}_ciudades", '"id" INTEGER PRIMARY KEY AUTOINCREMENT, "Nombre_Completo" TEXT, "Nombre_Corto" TEXT, "Tipo_Ciudad" TEXT, "Es_Capital_Provincial" TEXT, "Provincia_ID" TEXT, "Provincia" TEXT, "Nacion_ID" TEXT, "Sistema" TEXT, parent_id INTEGER DEFAULT 0, image_path TEXT DEFAULT ""'),
        ("Villas", f"p_{planet_id}_villas", '"id" INTEGER PRIMARY KEY AUTOINCREMENT, "Nombre_Completo" TEXT, "Nombre_Corto" TEXT, "Tipo_Villa" TEXT, "Ciudad_ID" TEXT, "Ciudad" TEXT, "Provincia_ID" TEXT, "Sistema" TEXT, parent_id INTEGER DEFAULT 0, image_path TEXT DEFAULT ""'),
        ("Aldeas", f"p_{planet_id}_aldeas", '"id" INTEGER PRIMARY KEY AUTOINCREMENT, "Nombre_Completo" TEXT, "Nombre_Corto" TEXT, "Tipo_Aldea" TEXT, "Villa_ID" TEXT, "Villa" TEXT, "Ciudad_ID" TEXT, "Sistema" TEXT, parent_id INTEGER DEFAULT 0, image_path TEXT DEFAULT ""'),
        
        ("Criaturas", f"p_{planet_id}_criaturas", '"id" INTEGER PRIMARY KEY AUTOINCREMENT, "Nombre Común" TEXT, "Nombre Científico" TEXT, "Rareza Nivel" INTEGER, "Rareza" TEXT, "Rareza Título" TEXT, "Peligrosidad Nivel" INTEGER, "Peligrosidad" TEXT, "Peligrosidad Icono" TEXT, "Captura Nivel" INTEGER, "Captura" TEXT, "Captura Ritual" TEXT, "Tamaño" TEXT, "Hábitat" TEXT, parent_id INTEGER DEFAULT 0, image_path TEXT DEFAULT ""'),
        ("Plantas", f"p_{planet_id}_plantas", '"id" INTEGER PRIMARY KEY AUTOINCREMENT, "Nombre Común" TEXT, "Nombre Científico" TEXT, "Utilidad Nivel" INTEGER, "Utilidad" TEXT, "Utilidad Título" TEXT, "Peligrosidad Nivel" INTEGER, "Peligrosidad" TEXT, "Peligrosidad Icono" TEXT, "Cosecha Nivel" INTEGER, "Cosecha" TEXT, "Cosecha Método" TEXT, "Tamaño" TEXT, "Hábitat" TEXT, parent_id INTEGER DEFAULT 0, image_path TEXT DEFAULT ""'),
        ("Minerales", f"p_{planet_id}_minerales", '"id" INTEGER PRIMARY KEY AUTOINCREMENT, "Nombre" TEXT, "Fórmula" TEXT, "Poder Nivel" INTEGER, "Poder" TEXT, "Poder Título" TEXT, "Estabilidad Nivel" INTEGER, "Estabilidad" TEXT, "Estabilidad Icono" TEXT, "Extracción Nivel" INTEGER, "Extracción" TEXT, "Extracción Método" TEXT, "Dureza Mohs" TEXT, "Color" TEXT, parent_id INTEGER DEFAULT 0, image_path TEXT DEFAULT ""'),
        
        ("Clases", f"p_{planet_id}_clases", '"id" INTEGER PRIMARY KEY AUTOINCREMENT, "Nivel" INTEGER, "Rareza" TEXT, "Nombre de Clase" TEXT, "Categoría Funcional" TEXT, "Rol de Juego" TEXT, "Descripción Funcional" TEXT, "Recomendado para" TEXT, parent_id INTEGER DEFAULT 0, image_path TEXT DEFAULT ""'),
        ("Subespecies", f"p_{planet_id}_subespecies", '"id" INTEGER PRIMARY KEY AUTOINCREMENT, "Raza Base" TEXT, "Subespecie/Variante" TEXT, "Origen Mitológico" TEXT, "Descripción" TEXT, parent_id INTEGER DEFAULT 0, image_path TEXT DEFAULT ""'),
        ("Conceptos", f"p_{planet_id}_conceptos", '"id" INTEGER PRIMARY KEY AUTOINCREMENT, "Nombre" TEXT, "Categoría" TEXT, "Rareza" TEXT, "Bonificación" TEXT, "Nivel" INTEGER, parent_id INTEGER DEFAULT 0, image_path TEXT DEFAULT ""'),
        ("Especialidades", f"p_{planet_id}_especialidades", '"id" INTEGER PRIMARY KEY AUTOINCREMENT, "Nivel_Rareza" INTEGER, "Nombre_Rareza" TEXT, "Clase_Base" TEXT, "Especialidad" TEXT, "Descripción" TEXT, "Nivel_Poder" INTEGER, "Categoría" TEXT, parent_id INTEGER DEFAULT 0, image_path TEXT DEFAULT ""'),
        ("Razas", f"p_{planet_id}_razas", '"id" INTEGER PRIMARY KEY AUTOINCREMENT, "Raza" TEXT, "Categoría" TEXT, "Nivel" INTEGER, "Nombre_Nivel" TEXT, "Bonificación" TEXT, "Poder_Relativo" TEXT, "Descripción" TEXT, parent_id INTEGER DEFAULT 0, image_path TEXT DEFAULT ""'),
        ("Habilidades", f"p_{planet_id}_habilidades", '"id" INTEGER PRIMARY KEY AUTOINCREMENT, "Nombre" TEXT, "Tipo" TEXT, "Elemento" TEXT, "Rareza" TEXT, "Nivel_Requerido" INTEGER, "Costo_Mana" INTEGER, "Cooldown_Segundos" INTEGER, "Daño_Base" INTEGER, "Curación_Base" INTEGER, parent_id INTEGER DEFAULT 0, image_path TEXT DEFAULT ""'),
        ("Eventos Históricos", f"p_{planet_id}_eventos", '"id" INTEGER PRIMARY KEY AUTOINCREMENT, "Año_Época" TEXT, "Nombre del Evento" TEXT, "Descripción" TEXT, "Tipo" TEXT, "Importancia" INTEGER, parent_id INTEGER DEFAULT 0, image_path TEXT DEFAULT ""'),
        ("Facciones", f"p_{planet_id}_facciones", '"id" INTEGER PRIMARY KEY AUTOINCREMENT, "Nombre" TEXT, "Alineación" TEXT, "Líder" TEXT, "Sede" TEXT, "Descripción" TEXT, parent_id INTEGER DEFAULT 0, image_path TEXT DEFAULT ""'),
        ("Mitos y Deidades", f"p_{planet_id}_mitos", '"id" INTEGER PRIMARY KEY AUTOINCREMENT, "Nombre" TEXT, "Dominio" TEXT, "Culto" TEXT, "Descripción" TEXT, parent_id INTEGER DEFAULT 0, image_path TEXT DEFAULT ""'),
        ("Diario de Aventuras", f"p_{planet_id}_diario", '"id" INTEGER PRIMARY KEY AUTOINCREMENT, "Día/Sesión" TEXT, "Título del Capítulo" TEXT, "Resumen" TEXT, "Recompensas" TEXT, "Notas" TEXT, parent_id INTEGER DEFAULT 0, image_path TEXT DEFAULT ""'),
        ("Artefactos y Reliquias", f"p_{planet_id}_reliquias", '"id" INTEGER PRIMARY KEY AUTOINCREMENT, "Nombre" TEXT, "Poder" TEXT, "Creador" TEXT, "Ubicación Actual" TEXT, "Peligrosidad" INTEGER, parent_id INTEGER DEFAULT 0, image_path TEXT DEFAULT ""'),
        ("NPCs Notables", f"p_{planet_id}_npcs", '"id" INTEGER PRIMARY KEY AUTOINCREMENT, "Nombre" TEXT, "Raza" TEXT, "Ocupación" TEXT, "Secretos" TEXT, "Alineación" TEXT, parent_id INTEGER DEFAULT 0, image_path TEXT DEFAULT ""')
    ]
    
    for cat_name, table_name, schema in categories:
        cursor.execute(f"CREATE TABLE IF NOT EXISTS {table_name} ({schema}, is_favorite INTEGER DEFAULT 0)")
        cursor.execute("INSERT INTO categories (planet_id, name, table_name) VALUES (?, ?, ?)", (planet_id, cat_name, table_name))
        
        # Crear índices para estadísticas rápidas
        try:
            if cat_name.lower() == "plantas":
                cursor.execute(f'CREATE INDEX IF NOT EXISTS "idx_{table_name}_util" ON "{table_name}"("Utilidad Nivel")')
            elif cat_name.lower() == "minerales":
                cursor.execute(f'CREATE INDEX IF NOT EXISTS "idx_{table_name}_poder" ON "{table_name}"("Poder Nivel")')
            elif cat_name.lower() == "criaturas":
                cursor.execute(f'CREATE INDEX IF NOT EXISTS "idx_{table_name}_rareza" ON "{table_name}"("Rareza Nivel")')
            elif cat_name.lower() == "clases":
                cursor.execute(f'CREATE INDEX IF NOT EXISTS "idx_{table_name}_nivel" ON "{table_name}"("Nivel")')
        except:
            pass
        
    conn.commit()
    conn.close()

def add_new_planet(name, db_path="encyclopedia.db"):
    planet_id, err = create_planet(name, db_path)
    if err:
        return None, err
    create_default_tables(planet_id, db_path)
    return planet_id, None

def clone_planet(source_id, new_name, db_path="encyclopedia.db"):
    # Obtener el nombre original del planeta para saber si existe
    conn = get_connection(db_path)
    cursor = conn.cursor()

    new_planet_id, err = create_planet(new_name, db_path)
    if err:
        return None, err
        
    cursor.execute("SELECT name, table_name FROM categories WHERE planet_id = ?", (source_id,))
    categories = cursor.fetchall()
    
    for cat_name, source_table in categories:
        cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name=?", (source_table,))
        result = cursor.fetchone()
        if not result:
            continue
            
        original_sql = result[0]
        new_table_name = source_table.replace(f"p_{source_id}_", f"p_{new_planet_id}_")
        
        # Replace the table name in the CREATE statement.
        # This assumes the table name appears after CREATE TABLE.
        new_sql = original_sql.replace(f'"{source_table}"', f'"{new_table_name}"')
        new_sql = new_sql.replace(f" {source_table} ", f" {new_table_name} ")
        new_sql = new_sql.replace(f'`{source_table}`', f'`{new_table_name}`')
        if new_sql == original_sql:
            # Fallback simple replacement
            new_sql = original_sql.replace(source_table, new_table_name, 1)

        cursor.execute(new_sql)
        cursor.execute("INSERT INTO categories (planet_id, name, table_name) VALUES (?, ?, ?)", (new_planet_id, cat_name, new_table_name))
        try:
            cursor.execute(f'INSERT INTO "{new_table_name}" SELECT * FROM "{source_table}"')
        except Exception as e:
            print(f"Failed to copy data for {source_table}: {e}")
        
    conn.commit()
    conn.close()
    return new_planet_id, None

def get_planets(db_path="encyclopedia.db"):
    conn = get_connection(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT id, name FROM planets")
    planets = cursor.fetchall()
    conn.close()
    return planets

def get_planet_categories(planet_id, db_path="encyclopedia.db"):
    conn = get_connection(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, table_name FROM categories WHERE planet_id = ?", (planet_id,))
    cats = cursor.fetchall()
    conn.close()
    return cats

def export_db(destination_dir, db_path="encyclopedia.db"):
    try:
        shutil.copy(db_path, os.path.join(destination_dir, "encyclopedia_backup.db"))
        return True, "Base de datos exportada con éxito."
    except Exception as e:
        return False, str(e)

def auto_backup(db_path="encyclopedia.db"):
    import datetime
    backup_name = f"encyclopedia_auto_{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}.bak"
    dst_conn = sqlite3.connect(backup_name)
    with dst_conn:
        src_conn = sqlite3.connect(db_path)
        src_conn.backup(dst_conn)
        src_conn.close()
    dst_conn.close()

def limpiar_tabla(table_name, db_path="encyclopedia.db"):
    try:
        auto_backup(db_path)
        conn = get_connection(db_path)
        cursor = conn.cursor()
        cursor.execute(f"DELETE FROM {table_name}")
        conn.commit()
        conn.close()
        return True, "Tabla limpiada correctamente."
    except Exception as e:
        return False, str(e)

def import_csv(table_name, csv_path, db_path="encyclopedia.db"):
    try:
        if csv_path.endswith('.csv'):
            try:
                df = pd.read_csv(csv_path, encoding='utf-8')
            except UnicodeDecodeError:
                df = pd.read_csv(csv_path, encoding='latin-1')
        elif csv_path.endswith('.xlsx'):
            df = pd.read_excel(csv_path)
        else:
            return False, "Formato no soportado, debe ser .csv o .xlsx"
            
        # Transform ID column to lowercase 'id' if exists to match schema
        if 'ID' in df.columns:
            df.rename(columns={'ID': 'id'}, inplace=True)
            
        conn = get_connection(db_path)
        
        # Validation
        cursor = conn.cursor()
        cursor.execute(f"PRAGMA table_info({table_name})")
        valid_cols = [col[1] for col in cursor.fetchall()]
        
        # Eliminar tildes y caracteres raros para la comparación
        import unicodedata
        def normalize_str(s):
            s = str(s).replace('_', ' ').lower()
            return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')
            
        df_cols_normalized = [normalize_str(c) for c in df.columns]
        valid_cols_normalized = [normalize_str(c) for c in valid_cols if c != 'id']
        
        rename_map = {}
        invalid = []
        for c, c_norm in zip(df.columns, df_cols_normalized):
            if c.lower() == 'id':
                continue
            matched = False
            for vc in valid_cols:
                if c_norm == normalize_str(vc):
                    rename_map[c] = vc
                    matched = True
                    break
            if not matched:
                # Evolución de esquema: Añadir la columna sobrante a esta tabla dinámicamente
                safe_col = str(c).replace('"', '""')
                try:
                    cursor.execute(f'ALTER TABLE "{table_name}" ADD COLUMN "{safe_col}" TEXT DEFAULT ""')
                    # La columna ya existe en la BD oficialmente, mapearla a sí misma
                    rename_map[c] = c
                except Exception as e:
                    print(f"Error evolucionando esquema para {c}: {e}")
                    invalid.append(c)
                
        # Ignorar cualquier columna que de verdad haya fallado horriblemente
        df.drop(columns=invalid, inplace=True, errors='ignore')
            
        # Renombrar mágicamente el Dataframe para que encaje 1:1 en el esquema oficial SQL
        df.rename(columns=rename_map, inplace=True)
        
        # Quedarse estrictamente con las columnas reconocidas por SQLite (evita crashes)
        final_cols = [c for c in rename_map.values() if c in df.columns]
        df = df[final_cols].copy()
        
        # Eliminar cualquier rastro de NaNs confusos para evitar 'Datatype mismatch'
        df = df.fillna("")
            
        auto_backup(db_path)
        
        # Append data safely in chunks
        df.to_sql(table_name, conn, if_exists='append', index=False, chunksize=10000)
        conn.close()
        return True, f"Importación masiva exitosa. Se insertaron {len(df)} registros."
    except Exception as e:
        return False, str(e)


def export_planet(planet_id, planet_name, destination_path, db_path="encyclopedia.db"):
    try:
        cats = get_planet_categories(planet_id, db_path)
        conn = get_connection(db_path)
        with zipfile.ZipFile(destination_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for _, cat_name, table_name in cats:
                df = pd.read_sql_query(f"SELECT * FROM {table_name}", conn)
                csv_name = f"{planet_name}_{cat_name}.csv"
                df.to_csv(csv_name, index=False)
                zipf.write(csv_name)
                os.remove(csv_name)
        conn.close()
        return True, f"Planeta {planet_name} exportado a {destination_path}."
    except Exception as e:
        return False, str(e)
