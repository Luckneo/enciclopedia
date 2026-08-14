import sys
import os
import sqlite3
from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QListWidget, QListWidgetItem, QPushButton, QTabWidget, QTableView, QInputDialog,
    QMessageBox, QSplitter, QHeaderView, QFileDialog, QStyledItemDelegate, QComboBox,
    QLabel, QTreeWidget, QTreeWidgetItem, QDialog, QLineEdit, QProgressDialog, QMenu, QStatusBar,
    QAbstractItemView, QScrollArea, QFormLayout, QPlainTextEdit, QDataWidgetMapper, QFrame, QSizePolicy, QCheckBox,
    QStyle
)
from PyQt6.QtGui import QShortcut, QKeySequence, QPixmap, QFont, QColor, QIcon, QTextDocument, QLinearGradient
from PyQt6.QtPrintSupport import QPrinter
from PyQt6.QtSql import QSqlDatabase, QSqlTableModel, QSqlRelationalTableModel, QSqlRelation, QSqlRelationalDelegate
from PyQt6.QtCore import Qt, QModelIndex, QSize, QThread, pyqtSignal, QTimer, QRect, QPoint, QPointF
import database
import shutil

def get_media_path(db_path, original_file_path):
    if not original_file_path or not os.path.exists(original_file_path):
        return original_file_path
    if "datos/media" in original_file_path.replace("\\", "/"): return original_file_path
    base_dir = os.path.dirname(os.path.abspath(db_path))
    if not base_dir: base_dir = os.getcwd()
    media_dir = os.path.join(base_dir, "datos", "media")
    os.makedirs(media_dir, exist_ok=True)
    filename = os.path.basename(original_file_path)
    import time
    new_name = f"{int(time.time())}_{filename}"
    dest_path = os.path.join(media_dir, new_name)
    shutil.copy(original_file_path, dest_path)
    return f"datos/media/{new_name}"

def resolve_path(db_path, rel_or_abs_path):
    if not rel_or_abs_path: return ""
    if os.path.isabs(rel_or_abs_path): return rel_or_abs_path
    base_dir = os.path.dirname(os.path.abspath(db_path))
    if not base_dir: base_dir = os.getcwd()
    return os.path.join(base_dir, rel_or_abs_path)

class DropImageLabel(QLabel):
    def __init__(self, parent=None, on_drop=None):
        super().__init__(parent)
        self.setAcceptDrops(True)
        self.on_drop = on_drop

    def dragEnterEvent(self, event):
        if event.mimeData().hasUrls():
            event.acceptProposedAction()

    def dropEvent(self, event):
        urls = event.mimeData().urls()
        if urls and urls[0].isLocalFile():
            path = urls[0].toLocalFile()
            if self.on_drop:
                self.on_drop(path)

class CsvImportThread(QThread):
    progress = pyqtSignal(int, str)
    finished = pyqtSignal(bool, str)
    def __init__(self, table_name, files, db_path):
        super().__init__()
        self.table_name = table_name
        self.files = files
        self.db_path = db_path
        self._is_cancelled = False
    def cancel(self):
        self._is_cancelled = True
    def run(self):
        for idx, file_path in enumerate(self.files):
            if self._is_cancelled:
                self.finished.emit(False, "Cancelado por el usuario.")
                return
            self.progress.emit(idx, f"Procesando: {os.path.basename(file_path)}")
            ok, msg = database.import_csv(self.table_name, file_path, self.db_path)
            if not ok:
                self.finished.emit(False, f"Error en {os.path.basename(file_path)}: {msg}")
                return
        self.progress.emit(len(self.files), "Completado")
        self.finished.emit(True, "El proceso masivo ha terminado.")

class PlanetLoaderThread(QThread):
    planet_loaded = pyqtSignal(int, dict, dict)  # planet_id, counts, levels
    finished = pyqtSignal()
    
    def __init__(self, db_path, planets, all_cat_names):
        super().__init__()
        self.db_path = db_path
        self.planets = planets
        self.all_cat_names = all_cat_names
        
    def run(self):
        level_col_map = {"criaturas": "Rareza Nivel", "plantas": "Utilidad Nivel", "minerales": "Poder Nivel"}
        try:
            con = sqlite3.connect(self.db_path)
            cur = con.cursor()
            for p_id, p_name in self.planets:
                counts = {}
                levels = {}
                
                # Fetch categories for this planet
                placeholders = ",".join("?" * len(self.all_cat_names))
                cur.execute(
                    f"SELECT name, table_name FROM categories WHERE planet_id=? AND name IN ({placeholders})",
                    [p_id] + list(self.all_cat_names)
                )
                table_map = {row[0]: row[1] for row in cur.fetchall()}
                
                for cat in self.all_cat_names:
                    table = table_map.get(cat, f"p_{p_id}_{cat.replace(' ', '_').lower()}")
                    try:
                        cur.execute(f'SELECT COUNT(*) FROM "{table}"')
                        counts[cat] = cur.fetchone()[0]
                    except:
                        counts[cat] = 0
                        
                    lvl_col = level_col_map.get(cat.lower())
                    if lvl_col:
                        try:
                            cur.execute(f'SELECT DISTINCT "{lvl_col}" FROM "{table}" WHERE "{lvl_col}" IS NOT NULL ORDER BY "{lvl_col}"')
                            levels[cat] = [r[0] for r in cur.fetchall() if r[0]]
                        except:
                            levels[cat] = []
                    else:
                        levels[cat] = []
                self.planet_loaded.emit(p_id, counts, levels)
            con.close()
        except Exception as e:
            print(f"Error in PlanetLoaderThread: {e}")
        self.finished.emit()

class BackupAndTruncateThread(QThread):
    finished = pyqtSignal(bool, str)
    def __init__(self, table_name, db_path):
        super().__init__()
        self.table_name = table_name
        self.db_path = db_path
        
    def run(self):
        try:
            # 1. Run backup online safely
            import datetime
            backup_name = f"encyclopedia_auto_{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}.bak"
            dst_conn = sqlite3.connect(backup_name)
            with dst_conn:
                src_conn = sqlite3.connect(self.db_path)
                src_conn.backup(dst_conn)
                src_conn.close()
            dst_conn.close()
            
            # 2. Truncate table
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute(f'DELETE FROM "{self.table_name}"')
            conn.commit()
            conn.close()
            self.finished.emit(True, "La categoría ha sido vaciada y se ha creado un backup de seguridad.")
        except Exception as e:
            self.finished.emit(False, str(e))

class ClonePlanetThread(QThread):
    progress = pyqtSignal(int, str)
    finished = pyqtSignal(bool, str)
    
    def __init__(self, source_id, new_name, db_path):
        super().__init__()
        self.source_id = source_id
        self.new_name = new_name
        self.db_path = db_path
        
    def run(self):
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # 1. Create new planet
            cursor.execute("INSERT INTO planets (name) VALUES (?)", (self.new_name,))
            new_planet_id = cursor.lastrowid
            
            # 2. Get categories of source planet
            cursor.execute("SELECT name, table_name FROM categories WHERE planet_id = ?", (self.source_id,))
            categories = cursor.fetchall()
            
            total = len(categories)
            for idx, (cat_name, source_table) in enumerate(categories):
                self.progress.emit(idx, f"Clonando {cat_name}...")
                
                # Check original table schema
                cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name=?", (source_table,))
                result = cursor.fetchone()
                if not result:
                    continue
                    
                original_sql = result[0]
                new_table_name = source_table.replace(f"p_{self.source_id}_", f"p_{new_planet_id}_")
                
                # Re-map table names in CREATE table statement
                new_sql = original_sql.replace(f'"{source_table}"', f'"{new_table_name}"')
                new_sql = new_sql.replace(f" {source_table} ", f" {new_table_name} ")
                new_sql = new_sql.replace(f'`{source_table}`', f'`{new_table_name}`')
                if new_sql == original_sql:
                    new_sql = original_sql.replace(source_table, new_table_name, 1)
                    
                cursor.execute(new_sql)
                cursor.execute("INSERT INTO categories (planet_id, name, table_name) VALUES (?, ?, ?)", (new_planet_id, cat_name, new_table_name))
                
                # Copy table contents
                cursor.execute(f'INSERT INTO "{new_table_name}" SELECT * FROM "{source_table}"')
                conn.commit()
                
            conn.close()
            # Asynchronously sync tables and trigger FTS index build
            database.sync_planet_tables(new_planet_id, self.db_path)
            
            self.finished.emit(True, "Planeta clonado exitosamente.")
        except sqlite3.IntegrityError:
            self.finished.emit(False, "El planeta ya existe.")
        except Exception as e:
            self.finished.emit(False, str(e))

# ──────────────────────────────────────────────
# DELEGATE: Badge con color para Rareza/Utilidad/Poder
# ──────────────────────────────────────────────
from PyQt6.QtGui import QPainter, QBrush, QPen, QFont as _QFont
from PyQt6.QtCore import QRectF

# Paletas de color por valor de texto (minusculas) -> (bg_hex, text_hex)
_RARITY_COLORS = {
    # Sistema rareza criaturas/clases/habilidades (14 niveles)
    "comun y frecuente":       ("#2d333b", "#adbac7"),
    "comun":                   ("#2d333b", "#adbac7"),
    "inusual y poco comun":    ("#1c3a2a", "#4ac97e"),
    "poco comun":              ("#1c3a2a", "#4ac97e"),
    "raro y excepcional":      ("#1a3350", "#58a6ff"),
    "raro":                    ("#1a3350", "#58a6ff"),
    "elite y epico":           ("#2e1a5e", "#a371f7"),
    "epico":                   ("#2e1a5e", "#a371f7"),
    "legendario":              ("#4a2800", "#f0883e"),
    "mitico":                  ("#3d1a1a", "#ff7b72"),
    "mitico":                  ("#3d1a1a", "#ff7b72"),
    "ancestral":               ("#1a3d3d", "#39d353"),
    "divino":                  ("#35291a", "#f0e68c"),
    "cosmico":                 ("#1a1a3d", "#79c0ff"),
    "trascendental":           ("#3d1a3d", "#f778ba"),
    "primordial":              ("#1a1a1a", "#e3b341"),
    "absoluta":                ("#0a0a0a", "#d29922"),
    "etereo":                  ("#1e2a3a", "#a5d6ff"),
    "unico":                   ("#2a0d0d", "#ff6e6e"),
    # Rareza criaturas epicas (9 niveles cortos)
    "mundano":                 ("#21262d", "#8b949e"),
    "singular":                ("#1a3350", "#58a6ff"),
    "extraordinario":          ("#2e1a5e", "#a371f7"),
    "trascendente":            ("#3d1a3d", "#f778ba"),
    "primordial":              ("#1a1a1a", "#e3b341"),
    # Peligrosidad
    "inocuo":                  ("#1c3a2a", "#4ac97e"),
    "menor":                   ("#1a3350", "#58a6ff"),
    "cauteloso":               ("#2a2800", "#e3b341"),
    "amenazante":              ("#4a2800", "#f0883e"),
    "mortal":                  ("#3d1a1a", "#ff7b72"),
    "cataclimsico":            ("#3d1a1a", "#ff4444"),
    "catacl\u00edsmico":        ("#3d1a1a", "#ff4444"),
    "apocaliptico":            ("#2a0d0d", "#ff6e6e"),
    "apocal\u00edptico":        ("#2a0d0d", "#ff6e6e"),
    "cosmico":                 ("#1a1a3d", "#79c0ff"),
    "omniversal":              ("#0d0d0d", "#c3a5ff"),
    # Utilidad plantas
    "decorativa":              ("#1c3a2a", "#4ac97e"),
    "comestible":              ("#2a2800", "#e3b341"),
    "medicinal":               ("#1a3a3a", "#39d353"),
    "alquimica":               ("#2e1a5e", "#a371f7"),
    "alqu\u00edmica":            ("#2e1a5e", "#a371f7"),
    "magica":                  ("#1a1a3d", "#79c0ff"),
    "m\u00e1gica":               ("#1a1a3d", "#79c0ff"),
    "sagrada":                 ("#35291a", "#f0e68c"),
    "prohibida":               ("#3d1a1a", "#ff7b72"),
    "venenosa":                ("#1a2a0d", "#bb9af7"),
    "curativa":                ("#1c3a2a", "#56d364"),
    # Poder minerales
    "inerte":                  ("#21262d", "#8b949e"),
    "resonante":               ("#1c3a2a", "#4ac97e"),
    "activo":                  ("#1a3350", "#58a6ff"),
    "potente":                 ("#2e1a5e", "#a371f7"),
    "intenso":                 ("#4a2800", "#f0883e"),
    "poderoso":                ("#3d1a1a", "#ff7b72"),
    "arcano":                  ("#1a1a3d", "#79c0ff"),
    "legendario":              ("#4a2800", "#f0883e"),
    "cosmico":                 ("#1a1a3d", "#79c0ff"),
}
_DEFAULT_COLORS = ("#21262d", "#adbac7")

class RarityDelegate(QStyledItemDelegate):
    """Pinta un badge con color segun el valor de rareza/utilidad/poder."""
    # Combos para edicion
    RAREZA_ITEMS = [
        "Comun y Frecuente", "Inusual y Poco Comun", "Raro y Excepcional",
        "Elite y Epico", "Legendario", "Mitico", "Ancestral", "Divino",
        "Cosmico", "Trascendental", "Primordial", "Absoluta", "Etereo", "Unico",
        # cortos
        "Mundano", "Poco Comun", "Singular", "Extraordinario", "Trascendente",
    ]
    UTILIDAD_ITEMS = ["Decorativa", "Comestible", "Medicinal", "Alquimica",
                      "Magica", "Sagrada", "Prohibida", "Venenosa", "Curativa"]
    PODER_ITEMS = ["Inerte", "Resonante", "Activo", "Potente", "Intenso",
                   "Poderoso", "Arcano", "Sagrado", "Legendario", "Cosmico"]
    PELIGRO_ITEMS = ["Inocuo", "Menor", "Cauteloso", "Amenazante", "Mortal",
                     "Cataclimsico", "Apocaliptico", "Cosmico", "Omniversal"]

    def __init__(self, parent=None):
        super().__init__(parent)
        self._all_items = (self.RAREZA_ITEMS + self.UTILIDAD_ITEMS +
                           self.PODER_ITEMS + self.PELIGRO_ITEMS)

    def _colors(self, text):
        key = str(text).lower().strip()
        # Quitar emojis y parentesis
        for ch in ('\U0001f338','\u26a1','\u2764','\ud83d\udc80','\u2620',
                   '\U0001f30a','\U0001f4a5','\U0001f30b','\u26ab'):
            key = key.replace(ch, '').strip()
        return _RARITY_COLORS.get(key, _DEFAULT_COLORS)

    def paint(self, painter, option, index):
        value = index.data(Qt.ItemDataRole.DisplayRole)
        if not value:
            super().paint(painter, option, index)
            return
        bg, fg = self._colors(str(value))
        painter.save()
        # Fondo de la celda
        if option.state & QStyle.StateFlag.State_Selected:
            painter.fillRect(option.rect, QBrush(QColor(99, 102, 241, 50)))  # Semi-transparente índigo para selección
        else:
            if index.row() % 2 == 0:
                painter.fillRect(option.rect, QBrush(QColor("#151822")))
            else:
                painter.fillRect(option.rect, QBrush(QColor("#1a1e2b")))
        # Badge
        rect = option.rect
        badge_w = min(rect.width() - 10, 160)
        badge_h = min(rect.height() - 6, 22)
        x = rect.left() + (rect.width() - badge_w) // 2
        y = rect.top() + (rect.height() - badge_h) // 2
        badge_rect = QRectF(x, y, badge_w, badge_h)
        painter.setBrush(QBrush(QColor(bg)))
        painter.setPen(QPen(QColor(fg), 1))
        painter.drawRoundedRect(badge_rect, 4, 4)
        painter.setPen(QColor(fg))
        f = _QFont()
        f.setPixelSize(11)
        f.setBold(True)
        painter.setFont(f)
        painter.drawText(badge_rect, Qt.AlignmentFlag.AlignCenter, str(value))
        painter.restore()

    def sizeHint(self, option, index):
        sh = super().sizeHint(option, index)
        return sh.__class__(max(sh.width(), 120), max(sh.height(), 28))

    def createEditor(self, parent, option, index):
        editor = QComboBox(parent)
        editor.addItems(self._all_items)
        return editor

    def setEditorData(self, editor, index):
        value = str(index.model().data(index, Qt.ItemDataRole.EditRole) or "")
        idx = editor.findText(value)
        if idx >= 0: editor.setCurrentIndex(idx)

    def setModelData(self, editor, model, index):
        model.setData(index, editor.currentText(), Qt.ItemDataRole.EditRole)

# ──────────────────────────────────────────────
# PROXY MODEL: Ordenamiento Jerárquico Invisible
# ──────────────────────────────────────────────
from PyQt6.QtCore import QSortFilterProxyModel

class HierarchyProxyModel(QSortFilterProxyModel):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.target_col_idx = -1
        self.lvl_col_idx = -1

    def set_hierarchy_columns(self, target_idx, lvl_idx):
        self.target_col_idx = target_idx
        self.lvl_col_idx = lvl_idx

    def lessThan(self, source_left, source_right):
        if source_left.column() == self.target_col_idx and self.lvl_col_idx != -1:
            left_lvl_idx = self.sourceModel().index(source_left.row(), self.lvl_col_idx)
            right_lvl_idx = self.sourceModel().index(source_right.row(), self.lvl_col_idx)
            l_val = self.sourceModel().data(left_lvl_idx, Qt.ItemDataRole.EditRole)
            r_val = self.sourceModel().data(right_lvl_idx, Qt.ItemDataRole.EditRole)
            
            # Helper para convertir niveles textuales "1", "2" a enteros sanos
            def to_int(v):
                try: return int(v)
                except: return -1

            return to_int(l_val) < to_int(r_val)
            
        return super().lessThan(source_left, source_right)

# ──────────────────────────────────────────────
# EDIT DIALOG — Formulario dinámico para añadir/editar
# ──────────────────────────────────────────────
COMBO_OPTIONS = {
    # 14 niveles de rareza
    "rareza": ["Comun y Frecuente", "Inusual y Poco Comun", "Raro y Excepcional",
               "Elite y Epico", "Legendario", "Mitico", "Ancestral", "Divino",
               "Cosmico", "Trascendental", "Primordial", "Absoluta", "Etereo", "Unico"],
    "nombre_rareza": ["Comun y Frecuente", "Inusual y Poco Comun", "Raro y Excepcional",
                      "Elite y Epico", "Legendario", "Mitico", "Ancestral", "Divino",
                      "Cosmico", "Trascendental", "Primordial", "Absoluta", "Etereo", "Unico"],
    # 9 niveles rareza criaturas
    "rareza nivel": ["1","2","3","4","5","6","7","8","9"],
    # Utilidad plantas
    "utilidad": ["Decorativa","Comestible","Medicinal","Alquimica","Magica",
                 "Sagrada","Prohibida","Venenosa","Curativa"],
    "utilidad nivel": ["1","2","3","4","5","6","7","8"],
    # Poder minerales
    "poder": ["Inerte","Resonante","Activo","Potente","Intenso",
              "Poderoso","Arcano","Sagrado","Legendario","Cosmico"],
    "poder nivel": ["0","1","2","3","4","5","6","7","8","9"],
    # Peligrosidad
    "peligrosidad nivel": ["1","2","3","4","5","6","7","8","9"],
    "captura nivel":      ["1","2","3","4","5","6","7","8","9"],
    "cosecha nivel":      ["1","2","3","4","5","6","7","8"],
    "extraccion nivel":   ["1","2","3","4","5","6"],
    "nivel":              [str(i) for i in range(1, 15)],
    "nivel_rareza":       [str(i) for i in range(1, 15)],
    "nivel_requerido":    [str(i) for i in range(1, 501, 50)],
    "sistema_gobierno":   ["Monarquia","Republica","Imperio","Teocracia",
                           "Oligarquia","Democracia","Khanato","Shogunato",
                           "Sultanato","Tsardom","Magiocracia","Otro"],
    "tipo_ciudad":        ["Capital","Metropolis","Ciudad","Pueblo","Fortaleza","Puerto","Otro"],
}
HEAVY_KEYWORDS = ["descripción", "descripcion", "lore", "rasgos", "propiedades", "efectos",
                  "descripción funcional", "origen mitológico", "recomendado para",
                  "bonificación", "captura ritual", "cosecha método", "extracción método"]

class ParentSelectDialog(QDialog):
    def __init__(self, parent, table_name, db_path, display_col):
        super().__init__(parent)
        self.setWindowTitle("Seleccionar Elemento Padre")
        self.resize(500, 400)
        self.table_name = table_name
        self.db_path = db_path
        self.display_col = display_col
        self.selected_id = None
        self.selected_name = None
        
        layout = QVBoxLayout(self)
        
        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText("Escribe para buscar...")
        layout.addWidget(self.search_input)
        
        self.list_widget = QListWidget()
        layout.addWidget(self.list_widget)
        
        self.search_timer = QTimer()
        self.search_timer.setSingleShot(True)
        self.search_timer.setInterval(250)
        
        def run_search():
            term = self.search_input.text().strip()
            self.list_widget.clear()
            try:
                conn = database.get_connection(self.db_path)
                cursor = conn.cursor()
                if term:
                    cursor.execute(f'SELECT id, "{self.display_col}" FROM "{self.table_name}" WHERE "{self.display_col}" LIKE ? LIMIT 100', (f"%{term}%",))
                else:
                    cursor.execute(f'SELECT id, "{self.display_col}" FROM "{self.table_name}" LIMIT 100')
                for r_id, r_name in cursor.fetchall():
                    item = QListWidgetItem(f"{r_name} [ID: {r_id}]")
                    item.setData(Qt.ItemDataRole.UserRole, (r_id, r_name))
                    self.list_widget.addItem(item)
                conn.close()
            except Exception as e:
                print(f"Error searching parents: {e}")
                
        self.search_input.textChanged.connect(lambda _: self.search_timer.start())
        self.search_timer.timeout.connect(run_search)
        
        btn_box = QHBoxLayout()
        btn_cancel = QPushButton("Cancelar")
        btn_cancel.clicked.connect(self.reject)
        btn_ok = QPushButton("Seleccionar")
        btn_ok.clicked.connect(self.accept_selection)
        btn_box.addStretch()
        btn_box.addWidget(btn_cancel)
        btn_box.addWidget(btn_ok)
        layout.addLayout(btn_box)
        
        self.list_widget.itemDoubleClicked.connect(lambda _: self.accept_selection())
        
        run_search()
        
    def accept_selection(self):
        item = self.list_widget.currentItem()
        if item:
            data = item.data(Qt.ItemDataRole.UserRole)
            self.selected_id = data[0]
            self.selected_name = data[1]
            self.accept()
        else:
            QMessageBox.warning(self, "Aviso", "Selecciona un elemento de la lista.")

class EditDialog(QDialog):
    """Diálogo dinámico para añadir o editar una fila en cualquier tabla."""
    def __init__(self, parent, table_name, db_path, row_data=None, columns=None):
        super().__init__(parent)
        self.table_name = table_name
        self.db_path = db_path
        self.row_data = row_data  # dict col→valor si es edición
        self.columns = columns or []  # lista de nombres de columna (sin id/image_path/parent_id)
        self.fields = {}  # col_name → widget
        self.image_path = row_data.get("image_path", "") if row_data else ""

        mode = "✏️ Editar Entrada" if row_data else "✨ Nueva Entrada"
        self.setWindowTitle(mode)
        self.setMinimumWidth(560)
        self.setModal(True)

        self._build_ui()

    def _build_ui(self):
        root = QVBoxLayout(self)
        root.setSpacing(10)
        root.setContentsMargins(16, 16, 16, 16)

        # Título
        title = QLabel(("✏️ Editar Entrada" if self.row_data else "✨ Nueva Entrada"))
        title.setObjectName("section_title")
        root.addWidget(title)

        # Imagen
        img_row = QHBoxLayout()
        self.img_label = DropImageLabel(on_drop=self._on_drop_image)
        self.img_label.setFixedSize(110, 90)
        self.img_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.img_label.setObjectName("img_placeholder")
        self.img_label.setText("Drag Foto\nAquí")
        
        resolved_img = resolve_path(self.db_path, self.image_path)
        if self.image_path and os.path.exists(resolved_img):
            self.img_label.setPixmap(QPixmap(resolved_img).scaled(110, 90, Qt.AspectRatioMode.KeepAspectRatio, Qt.TransformationMode.SmoothTransformation))
        
        btn_img = QPushButton("📸 Buscar")
        btn_img.setFixedWidth(90)
        btn_img.clicked.connect(self._pick_image)
        img_row.addWidget(self.img_label)
        img_row.addWidget(btn_img, alignment=Qt.AlignmentFlag.AlignTop)
        img_row.addStretch()
        root.addLayout(img_row)

        # Scroll con formulario
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        scroll.setFrameShape(QFrame.Shape.NoFrame)
        inner = QWidget()
        form = QFormLayout(inner)
        form.setLabelAlignment(Qt.AlignmentFlag.AlignRight)
        form.setSpacing(8)
        scroll.setWidget(inner)
        root.addWidget(scroll)

        for col in self.columns:
            col_lower = col.lower().strip()
            val = (self.row_data or {}).get(col, "")
            val_str = str(val) if val is not None else ""

            if col_lower == "parent_id":
                count = 0
                try:
                    conn = database.get_connection(self.db_path)
                    cursor = conn.cursor()
                    cursor.execute(f'SELECT COUNT(*) FROM "{self.table_name}"')
                    count = cursor.fetchone()[0]
                    cursor.execute(f"PRAGMA table_info({self.table_name})")
                    cinfo = [x[1] for x in cursor.fetchall()]
                    dcol = cinfo[1] if len(cinfo) > 1 else "id"
                    for c in ["Nombre", "Nombre_Completo", "Nombre Común", "Nombre de Clase", "Nombre del Evento", "Raza Base"]:
                        if c in cinfo:
                            dcol = c; break
                    conn.close()
                except:
                    dcol = "Nombre"
                
                self._parent_display_col = dcol

                if count <= 1000:
                    widget = QComboBox()
                    widget.addItem("— Ninguno (Raíz) —", 0)
                    try:
                        conn = database.get_connection(self.db_path)
                        cursor = conn.cursor()
                        cursor.execute(f'SELECT id, "{dcol}" FROM "{self.table_name}"')
                        for r_id, r_name in cursor.fetchall():
                            widget.addItem(f"{r_name} [ID:{r_id}]", r_id)
                        conn.close()
                    except: pass
                    
                    curr_id = int(val) if str(val).isdigit() else 0
                    idx = widget.findData(curr_id)
                    widget.setCurrentIndex(idx if idx >= 0 else 0)
                    form.addRow("Anclaje (Linaje/Padre):", widget)
                    self.fields[col] = widget
                else:
                    self.parent_id_val = int(val) if str(val).isdigit() else 0
                    parent_name = "— Ninguno (Raíz) —"
                    if self.parent_id_val > 0:
                        try:
                            conn = database.get_connection(self.db_path)
                            cursor = conn.cursor()
                            cursor.execute(f'SELECT "{dcol}" FROM "{self.table_name}" WHERE id=?', (self.parent_id_val,))
                            res = cursor.fetchone()
                            if res:
                                parent_name = f"{res[0]} [ID: {self.parent_id_val}]"
                            conn.close()
                        except: pass
                        
                    container = QWidget()
                    lay = QHBoxLayout(container)
                    lay.setContentsMargins(0, 0, 0, 0)
                    lay.setSpacing(6)
                    
                    self.lbl_parent_desc = QLabel(parent_name)
                    self.lbl_parent_desc.setStyleSheet("color: #a78bfa; font-weight: bold;")
                    btn_select_parent = QPushButton("🔍 Seleccionar")
                    btn_select_parent.setFixedWidth(110)
                    
                    def on_select_parent():
                        dlg = ParentSelectDialog(self, self.table_name, self.db_path, self._parent_display_col)
                        if dlg.exec() == QDialog.DialogCode.Accepted:
                            self.parent_id_val = dlg.selected_id
                            self.lbl_parent_desc.setText(f"{dlg.selected_name} [ID: {self.parent_id_val}]")
                            
                    btn_select_parent.clicked.connect(on_select_parent)
                    
                    btn_clear_parent = QPushButton("❌ Borrar")
                    btn_clear_parent.setFixedWidth(80)
                    def on_clear_parent():
                        self.parent_id_val = 0
                        self.lbl_parent_desc.setText("— Ninguno (Raíz) —")
                    btn_clear_parent.clicked.connect(on_clear_parent)
                    
                    lay.addWidget(self.lbl_parent_desc, stretch=1)
                    lay.addWidget(btn_select_parent)
                    lay.addWidget(btn_clear_parent)
                    
                    form.addRow("Anclaje (Linaje/Padre):", container)
                    
                    class ParentFieldHelper:
                        def __init__(self, dialog):
                            self.dialog = dialog
                        def currentData(self):
                            return self.dialog.parent_id_val
                            
                    self.fields[col] = ParentFieldHelper(self)
            
            # Detectar si es campo pesado (texto largo)
            elif any(h in col_lower for h in HEAVY_KEYWORDS):
                widget = QPlainTextEdit()
                widget.setPlainText(val_str)
                widget.setMinimumHeight(90)
                widget.setMaximumHeight(150)
                form.addRow(f"{col}:", widget)
            # Detectar si hay opciones predefinidas
            elif col_lower in COMBO_OPTIONS:
                widget = QComboBox()
                widget.setEditable(True)
                widget.addItems(COMBO_OPTIONS[col_lower])
                idx = widget.findText(val_str)
                widget.setCurrentIndex(idx if idx >= 0 else 0)
                if val_str and idx < 0:
                    widget.setCurrentText(val_str)
                form.addRow(f"{col}:", widget)
            else:
                widget = QLineEdit()
                widget.setText(val_str)
                if col_lower in ("nombre", "nombre común", "nombre completo", "nombre de clase", "especialidad"):
                    widget.setObjectName("edit_dialog_required_field")
                    widget.setPlaceholderText("Requerido")
                form.addRow(f"{col}:", widget)

            self.fields[col] = widget

        # Botones de acción
        sep = QFrame(); sep.setFrameShape(QFrame.Shape.HLine)
        sep.setObjectName("dialog_separator")
        root.addWidget(sep)

        btn_row = QHBoxLayout()
        btn_cancel = QPushButton("❌ Cancelar")
        btn_cancel.clicked.connect(self.reject)
        btn_save = QPushButton("💾 Guardar")
        btn_save.setObjectName("btn_save")
        btn_save.setDefault(True)
        btn_save.clicked.connect(self._save)
        btn_row.addStretch()
        btn_row.addWidget(btn_cancel)
        btn_row.addWidget(btn_save)
        root.addLayout(btn_row)

    def _on_drop_image(self, path):
        if path:
            self.image_path = path
            self.img_label.setPixmap(QPixmap(path).scaled(110, 90, Qt.AspectRatioMode.KeepAspectRatio, Qt.TransformationMode.SmoothTransformation))

    def _pick_image(self):
        path, _ = QFileDialog.getOpenFileName(self, "Seleccionar Imagen", "", "Images (*.png *.jpg *.jpeg *.bmp *.gif *.webp)")
        if path:
            self.image_path = path
            self.img_label.setPixmap(QPixmap(path).scaled(110, 90, Qt.AspectRatioMode.KeepAspectRatio, Qt.TransformationMode.SmoothTransformation))

    def _save(self):
        data = {}
        for col, widget in self.fields.items():
            if col.lower().strip() == "parent_id":
                data[col] = widget.currentData()
            elif isinstance(widget, QPlainTextEdit):
                data[col] = widget.toPlainText()
            elif isinstance(widget, QComboBox):
                data[col] = widget.currentText()
            else:
                data[col] = widget.text()
        final_img = get_media_path(self.db_path, self.image_path)
        data["image_path"] = final_img
        self.result_data = data
        self.accept()

    def get_data(self):
        return getattr(self, "result_data", None)


import random
import math

class RarityChartWidget(QWidget):
    def __init__(self, data=None, parent=None):
        super().__init__(parent)
        self.data = data or {}
        self.setMinimumHeight(220)
        
    def set_data(self, data):
        self.data = data
        self.update()
        
    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        
        rect = self.rect()
        if not self.data:
            painter.setPen(QColor("#64748b"))
            painter.drawText(rect, Qt.AlignmentFlag.AlignCenter, "No hay datos de rareza.")
            return
            
        margin_left = 60
        margin_bottom = 30
        margin_top = 10
        margin_right = 10
        
        plot_w = rect.width() - margin_left - margin_right
        plot_h = rect.height() - margin_top - margin_bottom
        
        max_val = max(self.data.values()) if self.data.values() else 1
        if max_val > 10:
            order = 10 ** int(math.log10(max_val))
            max_val = math.ceil(max_val / order) * order
            
        painter.setPen(QPen(QColor("rgba(255,255,255,0.05)"), 1, Qt.PenStyle.DashLine))
        grid_lines = 4
        for i in range(grid_lines + 1):
            y = margin_top + plot_h - (i * plot_h // grid_lines)
            painter.drawLine(margin_left, y, rect.width() - margin_right, y)
            
            val = i * max_val // grid_lines
            painter.setPen(QColor("#64748b"))
            font = painter.font()
            font.setPixelSize(10)
            painter.setFont(font)
            painter.drawText(QRect(5, y - 7, margin_left - 10, 15), Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter, f"{val:,}")
            painter.setPen(QPen(QColor("rgba(255,255,255,0.05)"), 1, Qt.PenStyle.DashLine))

        keys = list(self.data.keys())
        num_bars = len(keys)
        bar_gap = 12
        total_gaps_w = bar_gap * (num_bars + 1)
        bar_w = (plot_w - total_gaps_w) // num_bars if num_bars > 0 else 30
        bar_w = max(bar_w, 15)
        
        rarity_color_map = {
            "comun":       "#8b949e",
            "inusual":     "#4ac97e",
            "poco comun":  "#4ac97e",
            "raro":        "#58a6ff",
            "elite":       "#a371f7",
            "epico":       "#a371f7",
            "legendario":  "#f0883e",
            "mitico":      "#ff7b72",
            "ancestral":   "#39d353",
            "divino":      "#f0e68c",
            "cosmico":     "#79c0ff",
            "trascendental":"#f778ba",
            "primordial":  "#e3b341",
            "absoluta":    "#d29922",
            "etereo":      "#a5d6ff",
            "unico":       "#ff6e6e"
        }
        
        for idx, key in enumerate(keys):
            val = self.data[key]
            bar_h = val * plot_h // max_val if max_val else 0
            
            x = margin_left + bar_gap + idx * (bar_w + bar_gap)
            y = margin_top + plot_h - bar_h
            
            col_hex = rarity_color_map.get(key.lower().strip(), "#8b949e")
            base_color = QColor(col_hex)
            
            grad = QLinearGradient(x, y, x, margin_top + plot_h)
            grad.setColorAt(0, base_color)
            grad.setColorAt(1, QColor(base_color.red(), base_color.green(), base_color.blue(), 30))
            
            painter.setBrush(QBrush(grad))
            painter.setPen(QPen(base_color, 1.5))
            painter.drawRoundedRect(QRectF(x, y, bar_w, bar_h), 4, 4)
            
            painter.setPen(QColor("#ffffff"))
            font = painter.font()
            font.setBold(True)
            font.setPixelSize(10)
            painter.setFont(font)
            painter.drawText(QRect(x - 5, y - 16, bar_w + 10, 15), Qt.AlignmentFlag.AlignCenter, str(val))
            
            painter.setPen(QColor("#adbac7"))
            font.setBold(False)
            painter.setFont(font)
            disp_key = key
            if len(disp_key) > 8:
                disp_key = disp_key[:6] + ".."
            painter.drawText(QRect(x - 10, margin_top + plot_h + 5, bar_w + 20, 20), Qt.AlignmentFlag.AlignCenter, disp_key)

class StatsDashboardDialog(QDialog):
    def __init__(self, parent, planet_id, db_path):
        super().__init__(parent)
        self.planet_id = planet_id
        self.db_path = db_path
        self.setWindowTitle("📊 Panel de Control y Estadísticas")
        self.resize(750, 580)
        
        self._load_stats()
        self._build_ui()
        
    def _load_stats(self):
        self.total_entities = 0
        self.fav_count = 0
        self.cat_counts = {}
        self.rarity_counts = {}
        
        try:
            conn = database.get_connection(self.db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT name, table_name FROM categories WHERE planet_id = ?", (self.planet_id,))
            categories = cursor.fetchall()
            
            rarity_cols = ["Rareza", "Utilidad", "Poder", "Nombre_Rareza", "Nombre_Nivel"]
            for cat_name, table_name in categories:
                try:
                    cursor.execute(f'SELECT COUNT(*) FROM "{table_name}"')
                    cnt = cursor.fetchone()[0]
                    if cnt > 0:
                        self.cat_counts[cat_name] = cnt
                        self.total_entities += cnt
                    
                    cursor.execute(f'SELECT COUNT(*) FROM "{table_name}" WHERE is_favorite = 1')
                    self.fav_count += cursor.fetchone()[0]
                    
                    cursor.execute(f'PRAGMA table_info("{table_name}")')
                    cols = [r[1] for r in cursor.fetchall()]
                    rarity_col = next((c for c in rarity_cols if c in cols), None)
                    if rarity_col:
                        cursor.execute(f'SELECT "{rarity_col}", COUNT(*) FROM "{table_name}" GROUP BY "{rarity_col}"')
                        for val, r_cnt in cursor.fetchall():
                            if val:
                                val_clean = str(val).strip()
                                for emoji in ('\U0001f338','\u26a1','\u2764','\ud83d\udc80','\u2620'):
                                    val_clean = val_clean.replace(emoji, '').strip()
                                if val_clean:
                                    self.rarity_counts[val_clean] = self.rarity_counts.get(val_clean, 0) + r_cnt
                except Exception as e:
                    print(f"Error querying table stats for {table_name}: {e}")
            conn.close()
        except Exception as e:
            print(f"Error loading stats: {e}")
            
    def _build_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(20, 20, 20, 20)
        layout.setSpacing(16)
        
        title_label = QLabel("📊 Panel Metrógrafo Planetario")
        title_label.setObjectName("section_title")
        title_label.setStyleSheet("font-size: 16px; font-weight: bold; color: #818cf8;")
        layout.addWidget(title_label)
        
        cards_layout = QHBoxLayout()
        cards_layout.setSpacing(12)
        
        def create_card(title, value, color_hex):
            card = QFrame()
            card.setStyleSheet(f"""
                QFrame {{
                    background-color: #0d0f17;
                    border: 1px solid rgba(255, 255, 255, 0.04);
                    border-left: 4px solid {color_hex};
                    border-radius: 8px;
                }}
            """)
            lay = QVBoxLayout(card)
            lay.setContentsMargins(16, 12, 16, 12)
            lbl_title = QLabel(title)
            lbl_title.setStyleSheet("color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;")
            lbl_val = QLabel(str(value))
            lbl_val.setStyleSheet("color: #ffffff; font-size: 24px; font-weight: 800; margin-top: 4px;")
            lay.addWidget(lbl_title)
            lay.addWidget(lbl_val)
            return card
            
        cards_layout.addWidget(create_card("Entidades Totales", f"{self.total_entities:,}", "#818cf8"))
        cards_layout.addWidget(create_card("Favoritos Destacados", f"{self.fav_count:,}", "#fbbf24"))
        cards_layout.addWidget(create_card("Categorías Activas", f"{len(self.cat_counts)}", "#34d399"))
        layout.addLayout(cards_layout)
        
        splitter = QSplitter(Qt.Orientation.Vertical)
        layout.addWidget(splitter, stretch=1)
        
        chart_container = QWidget()
        chart_lay = QVBoxLayout(chart_container)
        chart_lay.setContentsMargins(0, 0, 0, 0)
        chart_title = QLabel("DISTRIBUCIÓN DE RAREZA / PODER / UTILIDAD")
        chart_title.setStyleSheet("color: #64748b; font-size: 10px; font-weight: 700; letter-spacing: 0.8px;")
        chart_lay.addWidget(chart_title)
        
        self.chart_widget = RarityChartWidget(self.rarity_counts)
        chart_lay.addWidget(self.chart_widget)
        splitter.addWidget(chart_container)
        
        cat_container = QWidget()
        cat_lay = QVBoxLayout(cat_container)
        cat_lay.setContentsMargins(0, 10, 0, 0)
        cat_title = QLabel("BREAKDOWN POR CATEGORÍAS")
        cat_title.setStyleSheet("color: #64748b; font-size: 10px; font-weight: 700; letter-spacing: 0.8px;")
        cat_lay.addWidget(cat_title)
        
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setFrameShape(QFrame.Shape.NoFrame)
        scroll.setStyleSheet("QScrollArea { background-color: transparent; }")
        
        scroll_content = QWidget()
        scroll_lay = QVBoxLayout(scroll_content)
        scroll_lay.setContentsMargins(0, 0, 0, 0)
        scroll_lay.setSpacing(10)
        
        for cat_name, cnt in sorted(self.cat_counts.items(), key=lambda x: x[1], reverse=True):
            row = QWidget()
            row_lay = QHBoxLayout(row)
            row_lay.setContentsMargins(8, 6, 8, 6)
            
            lbl_name = QLabel(cat_name)
            lbl_name.setStyleSheet("color: #e2e8f0; font-weight: 600; font-size: 12px;")
            
            percent = (cnt * 100 // self.total_entities) if self.total_entities else 0
            pbar = QProgressBar()
            pbar.setValue(percent)
            pbar.setFixedHeight(8)
            pbar.setTextVisible(False)
            pbar.setStyleSheet("""
                QProgressBar {
                    background-color: #0d0f17;
                    border: none;
                    border-radius: 4px;
                }
                QProgressBar::chunk {
                    background-color: #4f46e5;
                    border-radius: 4px;
                }
            """)
            
            lbl_cnt = QLabel(f"{cnt:,} ({percent}%)")
            lbl_cnt.setStyleSheet("color: #64748b; font-size: 11px; font-weight: 700;")
            lbl_cnt.setFixedWidth(80)
            lbl_cnt.setAlignment(Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter)
            
            row_lay.addWidget(lbl_name, stretch=2)
            row_lay.addWidget(pbar, stretch=3)
            row_lay.addWidget(lbl_cnt, stretch=1)
            
            scroll_lay.addWidget(row)
            
        scroll_lay.addStretch()
        scroll.setWidget(scroll_content)
        cat_lay.addWidget(scroll)
        splitter.addWidget(cat_container)
        
        splitter.setSizes([300, 200])
        
        btn_close = QPushButton("Cerrar")
        btn_close.clicked.connect(self.accept)
        btn_close.setFixedWidth(120)
        btn_close.setObjectName("btn_save")
        layout.addWidget(btn_close, alignment=Qt.AlignmentFlag.AlignRight)

class TimelineEventCard(QFrame):
    double_clicked = pyqtSignal(int)
    edit_clicked = pyqtSignal(int)
    
    def __init__(self, event_id, year, title, desc, type_str, parent=None):
        super().__init__(parent)
        self.event_id = event_id
        self.setObjectName("timeline_card")
        
        importance_colors = {
            "cauteloso":    ("#2a2800", "#e3b341"),
            "amenazante":   ("#4a2800", "#f0883e"),
            "mortal":       ("#3d1a1a", "#ff7b72"),
            "cataclimsico": ("#3d1a1a", "#ff4444"),
            "catacl\u00edsmico": ("#3d1a1a", "#ff4444"),
            "apocaliptico": ("#2a0d0d", "#ff6e6e"),
            "apocal\u00edptico": ("#2a0d0d", "#ff6e6e"),
            "cosmico":      ("#1a1a3d", "#79c0ff"),
            "omniversal":   ("#0d0d0d", "#c3a5ff"),
        }
        bg, border = importance_colors.get(str(type_str).lower().strip(), ("#0d0f17", "rgba(255, 255, 255, 0.05)"))
        
        self.setStyleSheet(f"""
            QFrame#timeline_card {{
                background-color: #0d0f17;
                border: 1px solid {border};
                border-left: 4px solid {border};
                border-radius: 8px;
            }}
        """)
        
        lay = QVBoxLayout(self)
        lay.setContentsMargins(12, 10, 12, 10)
        lay.setSpacing(4)
        
        header_lay = QHBoxLayout()
        lbl_year = QLabel(f"[{year or '—'}]")
        lbl_year.setStyleSheet(f"color: {border}; font-weight: bold; font-size: 13px;")
        lbl_title = QLabel(title or "Sin Nombre")
        lbl_title.setStyleSheet("color: #ffffff; font-weight: 800; font-size: 13px;")
        header_lay.addWidget(lbl_year)
        header_lay.addWidget(lbl_title, stretch=1)
        
        btn_edit = QPushButton("✏️")
        btn_edit.setFixedSize(24, 24)
        btn_edit.setStyleSheet("QPushButton { border: none; background: transparent; font-size: 11px; padding:0; } QPushButton:hover { background: rgba(255,255,255,0.05); }")
        btn_edit.clicked.connect(lambda: self.edit_clicked.emit(self.event_id))
        header_lay.addWidget(btn_edit)
        
        lay.addLayout(header_lay)
        
        if desc:
            lbl_desc = QLabel(desc)
            lbl_desc.setWordWrap(True)
            lbl_desc.setStyleSheet("color: #94a3b8; font-size: 12px; margin-top: 4px;")
            lay.addWidget(lbl_desc)
            
        if type_str:
            lbl_type = QLabel(f"Tipo/Importancia: {type_str}")
            lbl_type.setStyleSheet("color: #64748b; font-style: italic; font-size: 10px; margin-top: 4px;")
            lay.addWidget(lbl_type)
            
    def mouseDoubleClickEvent(self, event):
        self.double_clicked.emit(self.event_id)
        super().mouseDoubleClickEvent(event)

class TimelineManagerDialog(QDialog):
    def __init__(self, parent, planet_id, db_path):
        super().__init__(parent)
        self.planet_id = planet_id
        self.db_path = db_path
        self.setWindowTitle("⏳ Cronología Interactiva")
        self.resize(680, 680)
        
        self._load_events()
        self._build_ui()
        
    def _load_events(self):
        self.events = []
        try:
            conn = database.get_connection(self.db_path)
            cursor = conn.cursor()
            cursor.execute(f"SELECT id, \"Año_Época\", \"Nombre del Evento\", \"Descripción\", \"Tipo\" FROM p_{self.planet_id}_eventos ORDER BY id ASC")
            self.events = cursor.fetchall()
            conn.close()
        except Exception as e:
            print(f"Error loading events for timeline: {e}")
            
    def _build_ui(self):
        self.main_layout = QVBoxLayout(self)
        self.main_layout.setContentsMargins(20, 20, 20, 20)
        self.main_layout.setSpacing(12)
        
        hdr_lay = QHBoxLayout()
        title = QLabel("⏳ Cronología del Mundo")
        title.setObjectName("section_title")
        title.setStyleSheet("font-size: 15px; font-weight: bold; color: #818cf8;")
        hdr_lay.addWidget(title, stretch=1)
        
        btn_add = QPushButton("➕ Añadir Evento")
        btn_add.setObjectName("btn_add_row")
        btn_add.setFixedWidth(140)
        btn_add.clicked.connect(self._add_event)
        hdr_lay.addWidget(btn_add)
        self.main_layout.addLayout(hdr_lay)
        
        filter_lay = QHBoxLayout()
        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText("🔍 Filtrar eventos...")
        self.search_input.textChanged.connect(self._apply_filter)
        filter_lay.addWidget(self.search_input)
        
        self.importance_filter = QComboBox()
        self.importance_filter.addItem("— Importancia (Todos) —")
        self.importance_filter.addItems(["Inocuo", "Menor", "Cauteloso", "Amenazante", "Mortal", "Cataclísmico", "Apocalíptico", "Cósmico", "Omniversal"])
        self.importance_filter.currentTextChanged.connect(self._apply_filter)
        self.importance_filter.setFixedWidth(180)
        filter_lay.addWidget(self.importance_filter)
        self.main_layout.addLayout(filter_lay)
        
        self.scroll = QScrollArea()
        self.scroll.setWidgetResizable(True)
        self.scroll.setFrameShape(QFrame.Shape.NoFrame)
        self.scroll.setStyleSheet("QScrollArea { background-color: transparent; }")
        
        self.scroll_content = QWidget()
        self.scroll_lay = QVBoxLayout(self.scroll_content)
        self.scroll_lay.setContentsMargins(0, 0, 0, 0)
        self.scroll_lay.setSpacing(14)
        
        self._populate_timeline()
        self.scroll.setWidget(self.scroll_content)
        self.main_layout.addWidget(self.scroll, stretch=1)
        
        btn_close = QPushButton("Cerrar")
        btn_close.clicked.connect(self.accept)
        btn_close.setFixedWidth(100)
        self.main_layout.addWidget(btn_close, alignment=Qt.AlignmentFlag.AlignRight)
        
    def _populate_timeline(self):
        while self.scroll_lay.count():
            item = self.scroll_lay.takeAt(0)
            if item.widget():
                item.widget().deleteLater()
                
        term = self.search_input.text().strip().lower()
        imp_filter = self.importance_filter.currentText()
        if "—" in imp_filter:
            imp_filter = ""
            
        import unicodedata
        def norm(s):
            return ''.join(c for c in unicodedata.normalize('NFD', str(s).lower()) if unicodedata.category(c) != 'Mn')
            
        term_norm = norm(term)
        imp_filter_norm = norm(imp_filter)
        
        has_items = False
        for e_id, year, etitle, desc, etype in self.events:
            if term_norm:
                if term_norm not in norm(year) and term_norm not in norm(etitle) and term_norm not in norm(desc):
                    continue
            if imp_filter_norm:
                if imp_filter_norm != norm(etype):
                    continue
                    
            card = TimelineEventCard(e_id, year, etitle, desc, etype, self)
            card.double_clicked.connect(self._edit_event)
            card.edit_clicked.connect(self._edit_event)
            self.scroll_lay.addWidget(card)
            has_items = True
            
        if not has_items:
            lbl = QLabel("No se encontraron eventos coincidentes.")
            lbl.setAlignment(Qt.AlignmentFlag.AlignCenter)
            lbl.setStyleSheet("color: #64748b; font-style: italic; padding: 40px;")
            self.scroll_lay.addWidget(lbl)
            
        self.scroll_lay.addStretch()
        
    def _apply_filter(self):
        self._populate_timeline()
        
    def _edit_event(self, event_id):
        table_name = f"p_{self.planet_id}_eventos"
        try:
            conn = database.get_connection(self.db_path)
            cursor = conn.cursor()
            cursor.execute(f"SELECT * FROM {table_name} WHERE id=?", (event_id,))
            row_vals = cursor.fetchone()
            cursor.execute(f"PRAGMA table_info({table_name})")
            cols = [r[1] for r in cursor.fetchall()]
            conn.close()
        except Exception as e:
            QMessageBox.warning(self, "Error", f"No se pudo cargar la información: {e}")
            return
            
        row_data = {cols[i]: row_vals[i] for i in range(len(cols))}
        editable_cols = [c for c in cols if c.lower() not in ("id", "image_path")]
        
        dlg = EditDialog(self, table_name, self.db_path, row_data=row_data, columns=editable_cols)
        if dlg.exec() == QDialog.DialogCode.Accepted:
            data = dlg.get_data()
            if not data: return
            try:
                conn = database.get_connection(self.db_path)
                cursor = conn.cursor()
                set_clauses = []
                params = []
                for col in cols:
                    if col.lower() == "id": continue
                    if col in data:
                        set_clauses.append(f'"{col}" = ?')
                        params.append(data[col])
                    elif col == "image_path" and "image_path" in data:
                        set_clauses.append('"image_path" = ?')
                        params.append(data["image_path"])
                params.append(event_id)
                cursor.execute(f'UPDATE "{table_name}" SET {", ".join(set_clauses)} WHERE id=?', params)
                conn.commit()
                conn.close()
                
                self._load_events()
                self._populate_timeline()
                
                mw = self.parent()
                if hasattr(mw, "tabs") and mw.tabs.currentWidget():
                    view = mw.tabs.currentWidget().property("view")
                    if view and mw.tabs.tabText(mw.tabs.currentIndex()) == "Eventos Históricos":
                        view.model().select()
            except Exception as e:
                QMessageBox.warning(self, "Error", f"No se pudo actualizar: {e}")
                
    def _add_event(self):
        table_name = f"p_{self.planet_id}_eventos"
        try:
            conn = database.get_connection(self.db_path)
            cursor = conn.cursor()
            cursor.execute(f"PRAGMA table_info({table_name})")
            cols = [r[1] for r in cursor.fetchall()]
            conn.close()
        except Exception as e:
            QMessageBox.warning(self, "Error", f"No se pudo cargar estructura: {e}")
            return
            
        editable_cols = [c for c in cols if c.lower() not in ("id", "image_path")]
        dlg = EditDialog(self, table_name, self.db_path, row_data=None, columns=editable_cols)
        if dlg.exec() == QDialog.DialogCode.Accepted:
            data = dlg.get_data()
            if not data: return
            try:
                conn = database.get_connection(self.db_path)
                cursor = conn.cursor()
                cols_str = []
                phs = []
                params = []
                for col in cols:
                    if col.lower() == "id": continue
                    if col in data:
                        cols_str.append(f'"{col}"')
                        phs.append("?")
                        params.append(data[col])
                    elif col == "image_path" and "image_path" in data:
                        cols_str.append('"image_path"')
                        phs.append("?")
                        params.append(data["image_path"])
                cursor.execute(f'INSERT INTO "{table_name}" ({", ".join(cols_str)}) VALUES ({", ".join(phs)})', params)
                conn.commit()
                conn.close()
                
                self._load_events()
                self._populate_timeline()
                
                mw = self.parent()
                if hasattr(mw, "load_planets"):
                    mw.load_planets()
                if hasattr(mw, "tabs") and mw.tabs.currentWidget():
                    view = mw.tabs.currentWidget().property("view")
                    if view and mw.tabs.tabText(mw.tabs.currentIndex()) == "Eventos Históricos":
                        view.model().select()
            except Exception as e:
                QMessageBox.warning(self, "Error al Guardar", f"No se pudo guardar: {e}")

class MassGeneratorThread(QThread):
    progress = pyqtSignal(int, str)
    finished = pyqtSignal(bool, str)
    
    def __init__(self, planet_id, db_path, table_name, cat_name, quantity):
        super().__init__()
        self.planet_id = planet_id
        self.db_path = db_path
        self.table_name = table_name
        self.cat_name = cat_name
        self.quantity = quantity
        
    def run(self):
        try:
            import random
            import sqlite3
            import database
            
            conn = database.get_connection(self.db_path)
            cursor = conn.cursor()
            cursor.execute(f'PRAGMA table_info("{self.table_name}")')
            cols = [(r[1], r[2]) for r in cursor.fetchall()]
            conn.close()
            
            if not cols:
                self.finished.emit(False, f"La tabla {self.table_name} no existe o no tiene columnas.")
                return
                
            razas = ["Humano", "Elfo", "Enano", "Orco", "Gnomo", "Troll", "Dracónido", "Elfo Oscuro", "Celestial"]
            ocupaciones = ["Guardia", "Mercader", "Herrero", "Cazador", "Mago", "Sacerdote", "Tabernero", "Gobernador", "Científico"]
            alineaciones = ["Legal Bueno", "Neutral Bueno", "Caótico Bueno", "Legal Neutral", "Neutral Auténtico", "Caótico Neutral", "Legal Malo", "Neutral Malo", "Caótico Malo"]
            habitats = ["Bosque de Eter", "Montañas Nubladas", "Desierto Silbante", "Cuevas de Cristal", "Océano Abisal", "Islas Flotantes", "Volcán de Cenizas"]
            elementos = ["Fuego", "Agua", "Tierra", "Viento", "Rayo", "Hielo", "Luz", "Oscuridad", "Eter"]
            rareza_titulos = ["Común", "Poco Común", "Raro", "Épico", "Legendario", "Mítico"]
            
            prefixes = ["Bal", "Ela", "Mor", "Gor", "Ael", "Fae", "Kael", "Syl", "Thor", "Brim", "Aer", "Umbr", "Nox"]
            suffixes = ["dor", "na", "gond", "sil", "ion", "wen", "mir", "thor", "ias", "ar", "eth", "zhar"]
            
            def gen_name():
                return random.choice(prefixes) + random.choice(suffixes)
                
            def gen_desc():
                w1 = random.choice(prefixes) + random.choice(suffixes)
                w2 = random.choice(prefixes) + random.choice(suffixes)
                return f"Una entidad originaria de {w1}, conocida por su influencia sobre {w2} y su rol en el lore planetario."
                
            records = []
            
            for i in range(self.quantity):
                if i % 100 == 0:
                    self.progress.emit(int(i / self.quantity * 100), f"Generando registro {i} de {self.quantity}...")
                    
                record = {}
                for col_name, col_type in cols:
                    col_lower = col_name.lower()
                    if col_lower == "id":
                        continue
                    elif col_lower in ("parent_id", "is_favorite"):
                        record[col_name] = 0
                    elif col_lower == "image_path":
                        record[col_name] = ""
                    elif col_lower in ("nombre", "nombre común", "nombre_completo", "nombre de clase", "nombre del evento", "especialidad", "nombre_corto"):
                        record[col_name] = gen_name()
                    elif col_lower in ("raza", "raza base"):
                        record[col_name] = random.choice(razas)
                    elif col_lower == "ocupación":
                        record[col_name] = random.choice(ocupaciones)
                    elif col_lower == "alineación":
                        record[col_name] = random.choice(alineaciones)
                    elif col_lower == "hábitat":
                        record[col_name] = random.choice(habitats)
                    elif col_lower == "elemento":
                        record[col_name] = random.choice(elementos)
                    elif col_lower == "rareza":
                        record[col_name] = random.choice(rareza_titulos)
                    elif col_lower == "descripción" or col_lower == "resumen" or col_lower == "notas" or col_lower == "secretos":
                        record[col_name] = gen_desc()
                    elif col_lower in ("nivel", "rareza nivel", "peligrosidad nivel", "utilidad nivel", "poder nivel", "nivel_requerido", "importancia", "estabilidad nivel", "extracción nivel", "nivel_poder"):
                        record[col_name] = random.randint(1, 5)
                    elif col_lower == "costo_mana":
                        record[col_name] = random.randint(10, 80)
                    elif col_lower in ("daño_base", "curación_base"):
                        record[col_name] = random.randint(20, 150)
                    elif "nivel" in col_lower or "poder" in col_lower:
                        record[col_name] = random.randint(1, 100)
                    else:
                        if "int" in col_type.lower():
                            record[col_name] = random.randint(1, 100)
                        else:
                            record[col_name] = f"Procedural {col_name} {random.randint(100, 999)}"
                            
                records.append(record)
                
            self.progress.emit(95, "Grabando registros masivos en la base de datos...")
            
            success, msg = database.bulk_insert_records(self.table_name, records, self.db_path)
            if success:
                self.finished.emit(True, f"¡Éxito! Se generaron e insertaron {self.quantity} registros en '{self.cat_name}'.")
            else:
                self.finished.emit(False, f"Fallo al escribir en base de datos: {msg}")
                
        except Exception as e:
            self.finished.emit(False, f"Error en generación masiva: {str(e)}")

class NameGeneratorSuiteDialog(QDialog):
    def __init__(self, parent, planet_id, db_path):
        super().__init__(parent)
        self.planet_id = planet_id
        self.db_path = db_path
        self.setWindowTitle("🎲 Suite de Generación Fantástica")
        self.resize(750, 480)
        
        self._build_ui()
        
    def _build_ui(self):
        main_lay = QHBoxLayout(self)
        main_lay.setContentsMargins(16, 16, 16, 16)
        main_lay.setSpacing(16)
        
        left_widget = QWidget()
        left_lay = QVBoxLayout(left_widget)
        left_lay.setContentsMargins(0, 0, 0, 0)
        left_lay.setSpacing(12)
        
        self.tabs = QTabWidget()
        left_lay.addWidget(self.tabs, stretch=1)
        main_lay.addWidget(left_widget, stretch=3)
        
        right_widget = QWidget()
        right_widget.setFixedWidth(220)
        right_lay = QVBoxLayout(right_widget)
        right_lay.setContentsMargins(0, 0, 0, 0)
        right_lay.setSpacing(8)
        
        lbl_hist = QLabel("📋 HISTORIAL DE GENERACIÓN")
        lbl_hist.setStyleSheet("color: #64748b; font-size: 10px; font-weight: 700; letter-spacing: 0.8px;")
        right_lay.addWidget(lbl_hist)
        
        self.history_list = QListWidget()
        self.history_list.setStyleSheet("QListWidget { background-color: #0d0f17; border: 1px solid rgba(255,255,255,0.04); border-radius: 8px; color: #cbd5e1; }")
        right_lay.addWidget(self.history_list)
        
        btn_copy = QPushButton("📋 Copiar Selección")
        btn_copy.clicked.connect(self._copy_history_item)
        right_lay.addWidget(btn_copy)
        
        self.btn_create_entity = QPushButton("🧙‍♂️ Crear Entidad")
        self.btn_create_entity.setObjectName("btn_add_row")
        self.btn_create_entity.clicked.connect(self._create_entity_from_gen)
        right_lay.addWidget(self.btn_create_entity)
        
        main_lay.addWidget(right_widget)
        
        self._init_tab_names()
        self._init_tab_npc()
        self._init_tab_mass_gen()
        self._init_tab_world_forge()
        
    def _init_tab_names(self):
        tab = QWidget()
        lay = QVBoxLayout(tab)
        lay.setContentsMargins(12, 12, 12, 12)
        lay.setSpacing(12)
        
        form = QFormLayout()
        form.setSpacing(10)
        
        self.style_combo = QComboBox()
        self.style_combo.addItems(["Clásico", "Élfico", "Enano", "Humano", "Sombra", "Celestial", "Bestial", "Ubicación", "Criatura / Planta"])
        form.addRow("Estilo / Raza:", self.style_combo)
        
        self.gender_combo = QComboBox()
        self.gender_combo.addItems(["Masculino", "Femenino", "Neutral"])
        form.addRow("Género:", self.gender_combo)
        
        self.num_names_spin = QComboBox()
        self.num_names_spin.addItems(["1", "5", "10", "15"])
        form.addRow("Cantidad:", self.num_names_spin)
        
        lay.addLayout(form)
        
        self.txt_names_out = QPlainTextEdit()
        self.txt_names_out.setReadOnly(True)
        self.txt_names_out.setStyleSheet("background-color: #08090d; border-radius: 8px; color: #f8fafc;")
        lay.addWidget(self.txt_names_out, stretch=1)
        
        btn_gen = QPushButton("🎲 Generar Nombre(s)")
        btn_gen.setObjectName("btn_save")
        btn_gen.clicked.connect(self._generate_names)
        lay.addWidget(btn_gen)
        
        self.tabs.addTab(tab, "🧙‍♂️ Nombres")
        
    def _init_tab_npc(self):
        tab = QWidget()
        lay = QVBoxLayout(tab)
        lay.setContentsMargins(12, 12, 12, 12)
        lay.setSpacing(10)
        
        self.txt_npc_out = QPlainTextEdit()
        self.txt_npc_out.setReadOnly(True)
        self.txt_npc_out.setStyleSheet("background-color: #08090d; border-radius: 8px; color: #f8fafc; font-family: consolas, monospace;")
        lay.addWidget(self.txt_npc_out, stretch=1)
        
        btn_gen = QPushButton("🎲 Generar Ficha de NPC")
        btn_gen.setObjectName("btn_save")
        btn_gen.clicked.connect(self._generate_npc)
        lay.addWidget(btn_gen)
        
        self.tabs.addTab(tab, "🎭 Ficha NPC")
        
    def _init_tab_mass_gen(self):
        tab = QWidget()
        lay = QVBoxLayout(tab)
        lay.setContentsMargins(12, 12, 12, 12)
        lay.setSpacing(10)
        
        lbl_info = QLabel("🎲 <b>GENERACIÓN MASIVA PROCEDURAL</b>")
        lbl_info.setStyleSheet("color: #818cf8; font-size: 12px; font-weight: bold;")
        lay.addWidget(lbl_info)
        
        lbl_desc = QLabel("Puebla tu base de datos al instante. Selecciona una categoría y la cantidad de registros coherentes que deseas generar.")
        lbl_desc.setWordWrap(True)
        lbl_desc.setStyleSheet("color: #64748b; font-size: 11px;")
        lay.addWidget(lbl_desc)
        
        form = QFormLayout()
        form.setSpacing(8)
        
        self.mass_cat_combo = QComboBox()
        self.categories_map = {}
        try:
            conn = sqlite3.connect(self.db_path)
            c = conn.cursor()
            c.execute("SELECT name, table_name FROM categories WHERE planet_id = ?", (self.planet_id,))
            for cat_name, table_name in c.fetchall():
                if "relaciones" not in table_name and "game_rules" not in table_name:
                    self.categories_map[cat_name] = table_name
            conn.close()
        except Exception as e:
            print("Error loading categories in generator:", e)
            
        self.mass_cat_combo.addItems(sorted(self.categories_map.keys()))
        form.addRow("Categoría de Destino:", self.mass_cat_combo)
        
        self.mass_qty_combo = QComboBox()
        self.mass_qty_combo.addItems(["10", "50", "100", "500", "1000"])
        self.mass_qty_combo.setCurrentIndex(2)
        form.addRow("Cantidad a Generar:", self.mass_qty_combo)
        
        lay.addLayout(form)
        
        self.mass_progress = QProgressBar()
        self.mass_progress.setRange(0, 100)
        self.mass_progress.setValue(0)
        self.mass_progress.setFixedHeight(12)
        self.mass_progress.setTextVisible(False)
        self.mass_progress.setStyleSheet("""
            QProgressBar { background-color: #0d0f17; border: none; border-radius: 6px; }
            QProgressBar::chunk { background-color: #818cf8; border-radius: 6px; }
        """)
        lay.addWidget(self.mass_progress)
        
        self.mass_log = QPlainTextEdit()
        self.mass_log.setReadOnly(True)
        self.mass_log.setStyleSheet("background-color: #08090d; border-radius: 8px; color: #f8fafc; font-family: consolas, monospace; font-size: 11px;")
        self.mass_log.appendPlainText("Listo para iniciar generación masiva.")
        lay.addWidget(self.mass_log, stretch=1)
        
        self.btn_run_mass = QPushButton("🎲 Ejecutar Generación Masiva")
        self.btn_run_mass.setObjectName("btn_save")
        self.btn_run_mass.clicked.connect(self._run_mass_generation)
        lay.addWidget(self.btn_run_mass)
        
        self.tabs.addTab(tab, "🎲 Gen Masiva")

    def _run_mass_generation(self):
        cat_name = self.mass_cat_combo.currentText()
        if not cat_name or cat_name not in self.categories_map:
            QMessageBox.warning(self, "Aviso", "Selecciona una categoría válida.")
            return
            
        qty = int(self.mass_qty_combo.currentText())
        table_name = self.categories_map[cat_name]
        
        self.btn_run_mass.setEnabled(False)
        self.mass_log.appendPlainText(f"Iniciando generación de {qty} registros para '{cat_name}'...")
        self.mass_progress.setValue(0)
        
        self.gen_thread = MassGeneratorThread(self.planet_id, self.db_path, table_name, cat_name, qty)
        self.gen_thread.progress.connect(self._on_mass_gen_progress)
        self.gen_thread.finished.connect(self._on_mass_gen_finished)
        self.gen_thread.start()
        
    def _on_mass_gen_progress(self, val, msg):
        self.mass_progress.setValue(val)
        self.mass_log.appendPlainText(msg)
        
    def _on_mass_gen_finished(self, success, msg):
        self.btn_run_mass.setEnabled(True)
        self.mass_progress.setValue(100 if success else 0)
        self.mass_log.appendPlainText(msg)
        
        if success:
            QMessageBox.information(self, "Generación Exitosa", msg)
            mw = self.parent()
            # Refrescar la tabla activa si coincide
            if hasattr(mw, "tabs") and mw.tabs.currentWidget():
                view = mw.tabs.currentWidget().property("view")
                if view and mw.tabs.tabText(mw.tabs.currentIndex()) == self.mass_cat_combo.currentText():
                    view.model().select()
        else:
            QMessageBox.critical(self, "Error", msg)

    def _generate_names(self):
        style = self.style_combo.currentText()
        gender = self.gender_combo.currentText()
        count = int(self.num_names_spin.currentText())
        
        import utils_generators
        prefixes_map = {
            "Élfico": ["Ael", "Ela", "Fae", "Ily", "Kael", "Lor", "Nym", "Syl", "Wyn", "Xyl"],
            "Enano": ["Bal", "Gor", "Hal", "Mor", "Ond", "Tyr", "Vyr", "Zor", "Thor", "Brim"],
            "Celestial": ["Aer", "Cor", "El", "Pry", "Tyr", "Val", "Sol", "Aura", "Zoph"],
            "Sombra": ["Dra", "Gor", "Mor", "Qor", "Vyr", "Zor", "Obsc", "Umbr", "Nox"],
            "Bestial": ["Gor", "Hal", "Tyr", "Ula", "Krag", "Fang", "Gnar", "Grom"],
        }
        suffixes_map = {
            "Élfico": ["dor", "rion", "thas", "wyn", "lan", "riel", "lyn", "las"],
            "Enano": ["gath", "mir", "zor", "tor", "vash", "adin", "grim", "dar"],
            "Celestial": ["rion", "riel", "mar", "vash", "tor", "el", "on", "as"],
            "Sombra": ["gath", "vash", "xar", "zor", "ul", "ath", "rim", "dun"],
            "Bestial": ["gath", "zor", "tor", "krog", "osh", "gar", "ok", "ar"],
        }
        
        titles_masc = ["el Invencible", "el Sabio", "Ojo de Cuervo", "el Justo", "Manoscuro", "Estrella del Norte", "el Quebrado", "Corazón Férreo", "Portador de Luz"]
        titles_fem = ["la Invencible", "la Sabia", "Ojo de Halcón", "la Justa", "Manosilente", "Estrella del Sur", "la Quebrada", "Alma de Fuego", "Portadora de Luz"]
        
        generated = []
        for _ in range(count):
            if style == "Ubicación":
                name = utils_generators.generate_location_name()
            elif style == "Criatura / Planta":
                name = utils_generators.generate_specimen_name()
            else:
                pfxs = prefixes_map.get(style, utils_generators.PREFIXES)
                sfxs = suffixes_map.get(style, utils_generators.SUFFIXES)
                
                length = random.randint(1, 2)
                name = "".join(random.choice(pfxs if i == 0 else sfxs) for i in range(length + 1)).title()
                
                if random.random() > 0.4:
                    titles = titles_fem if gender == "Femenino" else titles_masc
                    name += f" {random.choice(titles)}"
            generated.append(name)
            
        self.txt_names_out.setPlainText("\n".join(generated))
        
        for g in generated:
            item = QListWidgetItem(g)
            item.setData(Qt.ItemDataRole.UserRole, ("name", g))
            self.history_list.addItem(item)
            
    def _generate_npc(self):
        import utils_generators
        style = self.style_combo.currentText()
        gender = self.gender_combo.currentText()
        
        import random as rnd
        pfxs = ["Ael", "Ela", "Fae", "Kael", "Lor", "Wyn", "Bal", "Gor", "Mor", "Tyr", "Vyr", "Zor"]
        sfxs = ["dor", "rion", "thas", "wyn", "riel", "lyn", "las", "gath", "mir", "zor", "tor"]
        name = "".join(rnd.choice(pfxs if i == 0 else sfxs) for i in range(rnd.randint(1,2)+1)).title()
        
        traits = utils_generators.generate_npc_traits()
        full_spec = f"🧙‍♂️ Nombre: {name}\n🚻 Género: {gender}\n{traits}"
        
        self.txt_npc_out.setPlainText(full_spec)
        
        item = QListWidgetItem(f"NPC: {name}")
        item.setData(Qt.ItemDataRole.UserRole, ("npc", full_spec))
        self.history_list.addItem(item)
        
    def _copy_history_item(self):
        item = self.history_list.currentItem()
        if item:
            kind, text = item.data(Qt.ItemDataRole.UserRole)
            QApplication.clipboard().setText(text)
                
    def _create_entity_from_gen(self):
        item = self.history_list.currentItem()
        if not item:
            QMessageBox.information(self, "Aviso", "Selecciona un elemento generado en la lista de historial.")
            return
            
        kind, text = item.data(Qt.ItemDataRole.UserRole)
        
        try:
            conn = database.get_connection(self.db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT name, table_name FROM categories WHERE planet_id=?", (self.planet_id,))
            categories = cursor.fetchall()
            conn.close()
        except:
            categories = []
            
        if not categories:
            QMessageBox.warning(self, "Error", "No se encontraron categorías en el planeta actual.")
            return
            
        cat_names = [c[0] for c in categories]
        default_idx = 0
        if kind == "npc":
            default_idx = cat_names.index("NPCs Notables") if "NPCs Notables" in cat_names else 0
        elif "Criatura" in text or "Hongo" in text or "Bestia" in text or "Lobo" in text:
            default_idx = cat_names.index("Criaturas") if "Criaturas" in cat_names else 0
        elif "Plantas" in text or "Árbol" in text or "Liquen" in text or "Loto" in text:
            default_idx = cat_names.index("Plantas") if "Plantas" in cat_names else 0
            
        target_cat, ok = QInputDialog.getItem(self, "Inyección de Entidad", "Selecciona la categoría de destino:", cat_names, default_idx, False)
        if not ok or not target_cat: return
        
        table_name = next((c[1] for c in categories if c[0] == target_cat), None)
        if not table_name: return
        
        try:
            conn = database.get_connection(self.db_path)
            cursor = conn.cursor()
            cursor.execute(f"PRAGMA table_info({table_name})")
            cols = [r[1] for r in cursor.fetchall()]
            conn.close()
        except:
            cols = []
            
        editable_cols = [c for c in cols if c.lower() not in ("id", "image_path")]
        
        prefill = {}
        name_cols = ["Nombre", "Nombre Común", "Nombre de Clase", "Especialidad", "Raza", "Nombre del Evento"]
        desc_cols = ["Descripción", "Resumen", "Secretos", "Notas"]
        
        npc_name = ""
        if kind == "name":
            n_col = next((c for c in name_cols if c in editable_cols), editable_cols[0] if editable_cols else "")
            if n_col: prefill[n_col] = text
        else:
            lines = text.split("\n")
            appearance = ""
            personality = ""
            defect = ""
            motiv = ""
            for line in lines:
                if "Nombre:" in line:
                    npc_name = line.split("Nombre:")[1].strip()
                elif "Apariencia:" in line:
                    appearance = line.split("Apariencia:")[1].strip()
                elif "Personalidad:" in line:
                    personality = line.split("Personalidad:")[1].strip()
                elif "Defecto:" in line:
                    defect = line.split("Defecto:")[1].strip()
                elif "Motivación:" in line:
                    motiv = line.split("Motivación:")[1].strip()
                    
            n_col = next((c for c in name_cols if c in editable_cols), "")
            if n_col:
                prefill[n_col] = npc_name
                
            traits_summary = f"✨ Apariencia: {appearance}\n🧠 Personalidad: {personality}\n⚠️ Defecto: {defect}\n🎯 Motivación: {motiv}"
            desc_col = next((c for c in desc_cols if c in editable_cols), None)
            if desc_col:
                prefill[desc_col] = traits_summary
                
            if "Raza" in editable_cols:
                prefill["Raza"] = "Humano"
                
        dlg = EditDialog(self, table_name, self.db_path, row_data=prefill, columns=editable_cols)
        if dlg.exec() == QDialog.DialogCode.Accepted:
            data = dlg.get_data()
            if not data: return
            try:
                conn = database.get_connection(self.db_path)
                cursor = conn.cursor()
                cols_str = []
                phs = []
                params = []
                for col in cols:
                    if col.lower() == "id": continue
                    if col in data:
                        cols_str.append(f'"{col}"')
                        phs.append("?")
                        params.append(data[col])
                    elif col == "image_path" and "image_path" in data:
                        cols_str.append('"image_path"')
                        phs.append("?")
                        params.append(data["image_path"])
                cursor.execute(f'INSERT INTO "{table_name}" ({", ".join(cols_str)}) VALUES ({", ".join(phs)})', params)
                conn.commit()
                conn.close()
                
                mw = self.parent()
                if hasattr(mw, "load_planets"):
                    mw.load_planets()
                if hasattr(mw, "tabs") and mw.tabs.currentWidget():
                    view = mw.tabs.currentWidget().property("view")
                    if view and mw.tabs.tabText(mw.tabs.currentIndex()) == target_cat:
                        view.model().select()
                QMessageBox.information(self, "Entidad Creada", f"La entidad '{npc_name or text}' ha sido grabada exitosamente en '{target_cat}'.")
            except Exception as e:
                QMessageBox.warning(self, "Error al Guardar", f"No se pudo guardar la entidad: {e}")

    def _init_tab_world_forge(self):
        tab = QWidget()
        lay = QVBoxLayout(tab)
        lay.setContentsMargins(12, 12, 12, 12)
        lay.setSpacing(10)
        
        lbl_info = QLabel("🪐 <b>FORJADOR DE LORE PLANETARIO COHERENTE</b>")
        lbl_info.setStyleSheet("color: #818cf8; font-size: 12px; font-weight: bold;")
        lay.addWidget(lbl_info)
        
        lbl_desc = QLabel("Genera de golpe un continente completo con reinos, ciudades, gobernantes, monstruos y mitos vinculados lógicamente entre sí en la base de datos.")
        lbl_desc.setWordWrap(True)
        lbl_desc.setStyleSheet("color: #64748b; font-size: 11px;")
        lay.addWidget(lbl_desc)
        
        form = QFormLayout()
        form.setSpacing(8)
        
        import utils_generators
        self.wf_continent = QLineEdit()
        self.wf_continent.setText("Continente de " + utils_generators.generate_location_name())
        btn_rand_cont = QPushButton("🎲")
        btn_rand_cont.setFixedWidth(30)
        btn_rand_cont.clicked.connect(lambda: self.wf_continent.setText("Continente de " + utils_generators.generate_location_name()))
        
        row_cont = QHBoxLayout()
        row_cont.addWidget(self.wf_continent, stretch=1)
        row_cont.addWidget(btn_rand_cont)
        form.addRow("Nombre del Continente:", row_cont)
        
        self.wf_nations = QSpinBox()
        self.wf_nations.setRange(1, 4)
        self.wf_nations.setValue(2)
        form.addRow("Cantidad de Naciones:", self.wf_nations)
        
        self.wf_cities = QSpinBox()
        self.wf_cities.setRange(1, 4)
        self.wf_cities.setValue(2)
        form.addRow("Ciudades por Nación:", self.wf_cities)
        
        self.wf_npcs = QSpinBox()
        self.wf_npcs.setRange(1, 4)
        self.wf_npcs.setValue(2)
        form.addRow("NPCs por Ciudad:", self.wf_npcs)
        
        lay.addLayout(form)
        
        self.wf_progress = QProgressBar()
        self.wf_progress.setValue(0)
        self.wf_progress.setTextVisible(True)
        self.wf_progress.setStyleSheet("QProgressBar { background-color: #0d0f17; border: 1px solid rgba(255,255,255,0.04); border-radius: 6px; text-align: center; color: #ffffff; } QProgressBar::chunk { background-color: #6366f1; border-radius: 5px; }")
        lay.addWidget(self.wf_progress)
        
        self.wf_status = QLabel("Listo para forjar.")
        self.wf_status.setStyleSheet("color: #94a3b8; font-size: 11px;")
        lay.addWidget(self.wf_status)
        
        self.btn_forge_world = QPushButton("🔥 FORJAR MUNDO EN LA BASE DE DATOS")
        self.btn_forge_world.setObjectName("btn_add_row")
        self.btn_forge_world.clicked.connect(self._run_world_forge)
        lay.addWidget(self.btn_forge_world)
        
        lay.addStretch()
        self.tabs.addTab(tab, "🪐 Forjador de Lore")
        
    def _run_world_forge(self):
        continent = self.wf_continent.text().strip()
        nations = self.wf_nations.value()
        cities = self.wf_cities.value()
        npcs = self.wf_npcs.value()
        
        self.btn_forge_world.setEnabled(False)
        self.wf_progress.setValue(0)
        self.wf_status.setText("Iniciando hilo del Forjador de Lore...")
        
        self.forge_thread = WorldForgeThread(self.planet_id, self.db_path, continent, nations, cities, npcs)
        
        def on_progress(val, msg):
            self.wf_progress.setValue(val)
            self.wf_status.setText(msg)
            
        def on_finished(success, msg):
            self.btn_forge_world.setEnabled(True)
            if success:
                self.wf_progress.setValue(100)
                QMessageBox.information(self, "Yunque de Lore", msg)
                if self.parent():
                    self.parent().load_planet_data(self.planet_id)
            else:
                QMessageBox.warning(self, "Error de Forja", f"Ha ocurrido un error durante la forja:\n{msg}")
                self.wf_status.setText("Error en la forja de lore.")
                
        self.forge_thread.progress.connect(on_progress)
        self.forge_thread.finished_sig.connect(on_finished)
        self.forge_thread.start()


class DragDropTreeWidget(QTreeWidget):
    item_dropped = pyqtSignal(int, int) # item_id, new_parent_id
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setDragEnabled(True)
        self.setAcceptDrops(True)
        self.setDragDropMode(QAbstractItemView.DragDropMode.InternalMove)
        
    def dropEvent(self, event):
        selected = self.selectedItems()
        if not selected:
            super().dropEvent(event)
            return
        dragged_item = selected[0]
        dragged_id = dragged_item.data(0, Qt.ItemDataRole.UserRole)
        
        super().dropEvent(event)
        
        new_parent = dragged_item.parent()
        new_parent_id = new_parent.data(0, Qt.ItemDataRole.UserRole) if new_parent else 0
        self.item_dropped.emit(dragged_id, new_parent_id)

class LineageTreeDialog(QDialog):
    def __init__(self, parent, table_name, db_path, display_col):
        super().__init__(parent)
        self.table_name = table_name
        self.db_path = db_path
        self.display_col = display_col
        self.setWindowTitle("🌳 Jerarquía & Organigrama Interactivo")
        self.resize(600, 600)
        
        self._build_ui()
        self._load_tree_data()
        
    def _build_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(16, 16, 16, 16)
        layout.setSpacing(10)
        
        hdr_lay = QHBoxLayout()
        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText("🔍 Buscar y expandir nodos...")
        self.search_input.textChanged.connect(self._search_tree)
        hdr_lay.addWidget(self.search_input)
        layout.addLayout(hdr_lay)
        
        info = QLabel("💡 Arrastra y suelta elementos para re-estructurar jerarquía en la BD.")
        info.setStyleSheet("color: #64748b; font-size: 11px; font-style: italic;")
        layout.addWidget(info)
        
        self.tree = DragDropTreeWidget(self)
        self.tree.setHeaderLabel("Estructura Jerárquica")
        self.tree.item_dropped.connect(self._handle_reparent)
        layout.addWidget(self.tree, stretch=1)
        
        btn_box = QHBoxLayout()
        btn_close = QPushButton("Cerrar")
        btn_close.clicked.connect(self.accept)
        btn_close.setFixedWidth(100)
        btn_box.addStretch()
        btn_box.addWidget(btn_close)
        layout.addLayout(btn_box)
        
    def _load_tree_data(self):
        self.tree.clear()
        query = f'SELECT id, "{self.display_col}", parent_id FROM "{self.table_name}"'
        try:
            conn = database.get_connection(self.db_path)
            cursor = conn.cursor()
            cursor.execute(query)
            rows = cursor.fetchall()
            conn.close()
        except:
            rows = []
            
        items_map = {}
        child_counts = {}
        for _, _, p_id_raw in rows:
            p_id = int(p_id_raw) if p_id_raw and str(p_id_raw).isdigit() else 0
            if p_id > 0:
                child_counts[p_id] = child_counts.get(p_id, 0) + 1
                
        for r_id, r_name, p_id_raw in rows:
            p_id = int(p_id_raw) if p_id_raw and str(p_id_raw).isdigit() else 0
            ext = f" [{child_counts[r_id]} ramas]" if r_id in child_counts else ""
            item = QTreeWidgetItem([f"{r_name}{ext}"])
            item.setData(0, Qt.ItemDataRole.UserRole, r_id)
            items_map[r_id] = (item, p_id)
            
        roots = []
        for r_id, (item, p_id) in items_map.items():
            if p_id == 0 or p_id not in items_map:
                roots.append(item)
            else:
                items_map[p_id][0].addChild(item)
                
        self.tree.addTopLevelItems(roots)
        self.tree.expandAll()
        
    def _search_tree(self):
        term = self.search_input.text().strip().lower()
        
        def filter_item(item):
            text = item.text(0).lower()
            match = term in text
            
            any_child_match = False
            for i in range(item.childCount()):
                if filter_item(item.child(i)):
                    any_child_match = True
                    
            if match or any_child_match:
                item.setHidden(False)
                item.setExpanded(True)
                if match and term:
                    item.setForeground(0, QColor("#818cf8"))
                else:
                    item.setForeground(0, QColor("#cbd5e1"))
                return True
            else:
                if term:
                    item.setHidden(True)
                else:
                    item.setHidden(False)
                    item.setForeground(0, QColor("#cbd5e1"))
                return False
                
        for i in range(self.tree.topLevelItemCount()):
            filter_item(self.tree.topLevelItem(i))
            
    def _handle_reparent(self, dragged_id, new_parent_id):
        if dragged_id == new_parent_id:
            QMessageBox.warning(self, "Aviso", "Un elemento no puede ser su propio padre.")
            self._load_tree_data()
            return
            
        try:
            conn = database.get_connection(self.db_path)
            cursor = conn.cursor()
            cursor.execute(f'UPDATE "{self.table_name}" SET parent_id=? WHERE id=?', (new_parent_id, dragged_id))
            conn.commit()
            conn.close()
            
            self._load_tree_data()
            
            mw = self.parent()
            if hasattr(mw, "tabs") and mw.tabs.currentWidget():
                view = mw.tabs.currentWidget().property("view")
                if view: view.model().select()
        except Exception as e:
            QMessageBox.warning(self, "Error", f"No se pudo guardar la relación en la base de datos: {e}")
            self._load_tree_data()

class SchemaManagerDialog(QDialog):
    def __init__(self, parent, planet_id, db_path):
        super().__init__(parent)
        self.planet_id = planet_id
        self.db_path = db_path
        self.setWindowTitle("🧩 Gestor de Esquema y Categorías Libres")
        self.resize(600, 480)
        
        self._build_ui()
        self._load_categories()
        
    def _build_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(16, 16, 16, 16)
        layout.setSpacing(12)
        
        title = QLabel("🧩 Gestor de Categorías Libres")
        title.setObjectName("section_title")
        title.setStyleSheet("font-size: 15px; font-weight: bold; color: #818cf8;")
        layout.addWidget(title)
        
        split = QSplitter(Qt.Orientation.Horizontal)
        layout.addWidget(split, stretch=1)
        
        left_widget = QWidget()
        left_lay = QVBoxLayout(left_widget)
        left_lay.setContentsMargins(0, 0, 0, 0)
        
        lbl_list = QLabel("CATEGORÍAS REGISTRADAS:")
        lbl_list.setStyleSheet("color: #64748b; font-size: 10px; font-weight: 700; letter-spacing: 0.8px; margin-bottom: 4px;")
        left_lay.addWidget(lbl_list)
        
        self.cat_list = QListWidget()
        self.cat_list.setStyleSheet("QListWidget { background-color: #0d0f17; border: 1px solid rgba(255,255,255,0.04); border-radius: 8px; color: #cbd5e1; }")
        self.cat_list.currentItemChanged.connect(self._on_category_selected)
        left_lay.addWidget(self.cat_list)
        
        btn_create = QPushButton("➕ Crear Categoría Libre")
        btn_create.setObjectName("btn_new_planet")
        btn_create.clicked.connect(self._create_category)
        left_lay.addWidget(btn_create)
        
        split.addWidget(left_widget)
        
        self.right_widget = QWidget()
        right_lay = QVBoxLayout(self.right_widget)
        right_lay.setContentsMargins(0, 0, 0, 0)
        right_lay.setSpacing(10)
        
        lbl_actions = QLabel("ATRIBUTOS Y CAMPOS:")
        lbl_actions.setStyleSheet("color: #64748b; font-size: 10px; font-weight: 700; letter-spacing: 0.8px;")
        right_lay.addWidget(lbl_actions)
        
        self.fields_list = QListWidget()
        self.fields_list.setStyleSheet("QListWidget { background-color: #0d0f17; border: 1px solid rgba(255,255,255,0.04); border-radius: 8px; color: #64748b; }")
        right_lay.addWidget(self.fields_list)
        
        self.btn_add_attr = QPushButton("➕ Añadir Campo Nuevo")
        self.btn_add_attr.clicked.connect(self._add_attribute)
        self.btn_add_attr.setEnabled(False)
        right_lay.addWidget(self.btn_add_attr)
        
        self.btn_delete_cat = QPushButton("🗑️ Eliminar Categoría")
        self.btn_delete_cat.setObjectName("btn_del_row")
        self.btn_delete_cat.clicked.connect(self._delete_category)
        self.btn_delete_cat.setEnabled(False)
        right_lay.addWidget(self.btn_delete_cat)
        
        split.addWidget(self.right_widget)
        split.setSizes([260, 300])
        
        btn_close = QPushButton("Cerrar")
        btn_close.clicked.connect(self.accept)
        btn_close.setFixedWidth(100)
        layout.addWidget(btn_close, alignment=Qt.AlignmentFlag.AlignRight)
        
    def _load_categories(self):
        self.cat_list.clear()
        self.categories = []
        try:
            conn = database.get_connection(self.db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT id, name, table_name FROM categories WHERE planet_id=?", (self.planet_id,))
            self.categories = cursor.fetchall()
            conn.close()
        except Exception as e:
            print(f"Error loading categories: {e}")
            
        for c_id, name, table in self.categories:
            item = QListWidgetItem(f"🧩 {name}")
            item.setData(Qt.ItemDataRole.UserRole, (c_id, name, table))
            self.cat_list.addItem(item)
            
        self.btn_add_attr.setEnabled(False)
        self.btn_delete_cat.setEnabled(False)
        self.fields_list.clear()
        
    def _on_category_selected(self, current, previous):
        if not current:
            self.btn_add_attr.setEnabled(False)
            self.btn_delete_cat.setEnabled(False)
            self.fields_list.clear()
            return
            
        c_id, name, table = current.data(Qt.ItemDataRole.UserRole)
        
        geo_cats = ["Hemisferios", "Macrorregiones", "Supercontinentes", "Continentes", "Naciones", "Provincias", "Ciudades", "Villas", "Aldeas"]
        bio_cats = ["Criaturas", "Plantas", "Minerales"]
        lore_cats = ["Facciones", "Mitos y Deidades", "Eventos Históricos", "Diario de Aventuras", "Artefactos y Reliquias", "NPCs Notables", "Clases", "Subespecies", "Conceptos", "Especialidades", "Habilidades", "Razas"]
        all_std_cats = geo_cats + bio_cats + lore_cats
        
        is_custom = name not in all_std_cats
        self.btn_delete_cat.setEnabled(is_custom)
        self.btn_add_attr.setEnabled(True)
        
        self.fields_list.clear()
        try:
            conn = database.get_connection(self.db_path)
            cursor = conn.cursor()
            cursor.execute(f'PRAGMA table_info("{table}")')
            for col in cursor.fetchall():
                col_name = col[1]
                col_type = col[2]
                if col_name.lower() in ("id", "image_path", "parent_id", "is_favorite"):
                    item = QListWidgetItem(f"🔑 {col_name} ({col_type}) [Sistema]")
                else:
                    item = QListWidgetItem(f"📝 {col_name} ({col_type})")
                self.fields_list.addItem(item)
            conn.close()
        except:
            pass
            
    def _create_category(self):
        name, ok = QInputDialog.getText(self, "Nueva Categoría", "Nombra la nueva categoría libre (ej: 'Deidades Menores'):")
        if ok and name.strip():
            safe_name = name.strip()
            if any(c[1].lower() == safe_name.lower() for c in self.categories):
                QMessageBox.warning(self, "Aviso", "Esa categoría ya existe en este planeta.")
                return
                
            table_str = f"p_{self.planet_id}_{safe_name.replace(' ', '_').lower()}"
            try:
                conn = database.get_connection(self.db_path)
                cursor = conn.cursor()
                cursor.execute(f'''CREATE TABLE IF NOT EXISTS "{table_str}" (
                    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
                    "Nombre" TEXT,
                    "parent_id" INTEGER DEFAULT 0,
                    "image_path" TEXT DEFAULT "",
                    "is_favorite" INTEGER DEFAULT 0
                )''')
                cursor.execute("INSERT INTO categories (planet_id, name, table_name) VALUES (?, ?, ?)", (self.planet_id, safe_name, table_str))
                conn.commit()
                conn.close()
                
                self._load_categories()
                
                mw = self.parent()
                if hasattr(mw, "load_planets"): mw.load_planets()
            except Exception as e:
                QMessageBox.warning(self, "Error Structural", f"Fallo al crear categoría: {e}")
                
    def _add_attribute(self):
        item = self.cat_list.currentItem()
        if not item: return
        c_id, name, table = item.data(Qt.ItemDataRole.UserRole)
        
        col_name, ok = QInputDialog.getText(self, "Nuevo Campo", f"Añadir columna a la categoría '{name}':")
        if ok and col_name.strip():
            safe_col = col_name.strip().replace('"', '""')
            try:
                conn = database.get_connection(self.db_path)
                cursor = conn.cursor()
                cursor.execute(f'ALTER TABLE "{table}" ADD COLUMN "{safe_col}" TEXT DEFAULT ""')
                conn.commit()
                conn.close()
                
                self._on_category_selected(item, None)
                
                mw = self.parent()
                if hasattr(mw, "load_planet_data"):
                    idx = mw.tabs.currentIndex()
                    mw.load_planet_data(self.planet_id)
                    mw.tabs.setCurrentIndex(idx)
                    mw._enable_planet_buttons(True)
            except Exception as e:
                QMessageBox.warning(self, "Error Estructural", f"Fallo al inyectar campo: {e}")
                
    def _delete_category(self):
        item = self.cat_list.currentItem()
        if not item: return
        c_id, name, table = item.data(Qt.ItemDataRole.UserRole)
        
        ans = QMessageBox.warning(
            self, 
            "🗑️ Destruir Categoría",
            f"¿Estás seguro de que quieres eliminar por completo la categoría '{name}'?\n"
            "Esto borrará todos los registros y la tabla de la base de datos de forma irreversible.",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
        )
        if ans == QMessageBox.StandardButton.Yes:
            try:
                conn = database.get_connection(self.db_path)
                cursor = conn.cursor()
                cursor.execute(f'DROP TABLE IF EXISTS "{table}"')
                cursor.execute("DELETE FROM categories WHERE id=?", (c_id,))
                conn.commit()
                conn.close()
                
                self._load_categories()
                
                mw = self.parent()
                if hasattr(mw, "load_planets"): mw.load_planets()
                if hasattr(mw, "load_planet_data"): mw.load_planet_data(self.planet_id)
            except Exception as e:
                QMessageBox.warning(self, "Error", f"No se pudo eliminar la categoría: {e}")

class RpgStatsChartWidget(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.stats = {"str": (10, 0), "agi": (10, 0), "int": (10, 0), "vit": (10, 0)}
        self.setMinimumHeight(220)
        
    def set_stats(self, stats):
        self.stats = stats
        self.update()
        
    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        
        rect = self.rect()
        margin_left = 110
        margin_bottom = 20
        margin_top = 20
        margin_right = 20
        
        plot_w = rect.width() - margin_left - margin_right
        plot_h = rect.height() - margin_top - margin_bottom
        
        max_val = 1
        for base, bonus in self.stats.values():
            max_val = max(max_val, base + bonus)
        max_val = max(max_val, 80)
        
        keys = ["str", "agi", "int", "vit"]
        labels = {"str": "Fuerza (STR)", "agi": "Agilidad (AGI)", "int": "Inteligencia (INT)", "vit": "Vitalidad (VIT)"}
        colors_base = {"str": "#ef4444", "agi": "#3b82f6", "int": "#a855f7", "vit": "#10b981"}
        colors_bonus = {"str": "#f87171", "agi": "#60a5fa", "int": "#c084fc", "vit": "#34d399"}
        
        num_bars = len(keys)
        bar_h = 24
        bar_gap = (plot_h - (bar_h * num_bars)) // (num_bars + 1)
        
        for idx, key in enumerate(keys):
            base, bonus = self.stats[key]
            total = base + bonus
            
            y = margin_top + bar_gap + idx * (bar_h + bar_gap)
            
            # Label
            painter.setPen(QColor("#cbd5e1"))
            font = painter.font()
            font.setBold(True)
            font.setPixelSize(11)
            painter.setFont(font)
            painter.drawText(QRect(10, int(y), margin_left - 20, bar_h), Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter, labels[key])
            
            # Bar Background
            bg_rect = QRectF(margin_left, y, plot_w, bar_h)
            painter.setBrush(QBrush(QColor("#0d0f17")))
            painter.setPen(QPen(QColor("#262b3d"), 1))
            painter.drawRoundedRect(bg_rect, 4, 4)
            
            # Base Bar
            base_w = base * plot_w / max_val
            if base_w > 0:
                base_rect = QRectF(margin_left, y, base_w, bar_h)
                painter.setBrush(QBrush(QColor(colors_base[key])))
                painter.setPen(Qt.PenStyle.NoPen)
                painter.drawRoundedRect(base_rect, 4, 4)
                
            # Bonus Bar
            bonus_w = bonus * plot_w / max_val
            if bonus_w > 0:
                bonus_rect = QRectF(margin_left + base_w, y, bonus_w, bar_h)
                painter.setBrush(QBrush(QColor(colors_bonus[key])))
                painter.setPen(Qt.PenStyle.NoPen)
                painter.drawRoundedRect(bonus_rect, 4, 4)
                
            # Values Text
            painter.setPen(QColor("#ffffff"))
            font.setBold(True)
            painter.setFont(font)
            val_text = f"{int(total)}"
            if bonus > 0:
                val_text += f" (+{int(bonus)})"
            painter.drawText(QRect(margin_left + 10, int(y), int(plot_w - 20), bar_h), Qt.AlignmentFlag.AlignLeft | Qt.AlignmentFlag.AlignVCenter, val_text)

class RpgProgressionSimulatorDialog(QDialog):
    def __init__(self, parent, planet_id, db_path):
        super().__init__(parent)
        self.planet_id = planet_id
        self.db_path = db_path
        self.setWindowTitle("⚡ Yunque de Clases y Simulador de Progresión RPG")
        self.resize(900, 680)
        
        self.custom_spinboxes = {}
        self.custom_spinbox_rows = []
        self.custom_derived_labels = []
        
        self._load_game_rules()
        self._load_database_data()
        self._build_ui()
        self._update_rules_custom_list()
        self._update_custom_attributes_ui()
        self._load_quests_list()
        
    def _load_game_rules(self):
        self.game_rules = {
            "str_name": "Fuerza (STR)",
            "agi_name": "Agilidad (AGI)",
            "int_name": "Inteligencia (INT)",
            "vit_name": "Vitalidad (VIT)",
            "formula_hp": "vit * 12",
            "formula_mp": "int * 10",
            "formula_atk": "str * 2 + agi * 0.5",
            "formula_mag": "int * 2.5",
            "formula_spd": "agi * 0.8"
        }
        try:
            conn = sqlite3.connect(self.db_path)
            c = conn.cursor()
            c.execute(f"SELECT clave, valor FROM \"p_{self.planet_id}_game_rules\"")
            for k, v in c.fetchall():
                if v: self.game_rules[k] = v
            conn.close()
        except Exception as e:
            print("Error loading game rules:", e)
            
    def _load_database_data(self):
        self.classes = []
        self.concepts = []
        self.creatures = []
        self.skills = []
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Load classes
            cursor.execute(f"SELECT id, \"Nombre de Clase\", \"Categoría Funcional\", \"Rol de Juego\", \"Descripción Funcional\" FROM p_{self.planet_id}_clases")
            self.classes = cursor.fetchall()
            
            # Load concepts
            cursor.execute(f"SELECT id, \"Nombre\", \"Categoría\", \"Rareza\", \"Bonificación\", \"Nivel\" FROM p_{self.planet_id}_conceptos")
            self.concepts = cursor.fetchall()
            
            # Load creatures for battle arena
            try:
                cursor.execute(f"SELECT id, \"Nombre Común\", \"Rareza Nivel\", \"Peligrosidad Nivel\", \"Tamaño\", \"Hábitat\" FROM p_{self.planet_id}_criaturas")
                self.creatures = cursor.fetchall()
            except Exception as ex:
                print("No creatures table:", ex)
                
            # Load skills for spell casting
            try:
                cursor.execute(f"SELECT id, \"Nombre\", \"Tipo\", \"Elemento\", \"Costo_Mana\", \"Daño_Base\", \"Curación_Base\" FROM p_{self.planet_id}_habilidades")
                self.skills = cursor.fetchall()
            except Exception as ex:
                print("No skills table:", ex)
                
            conn.close()
        except Exception as e:
            print(f"Error loading RPG data: {e}")
            
    def _build_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(16, 16, 16, 16)
        layout.setSpacing(12)
        
        title = QLabel("⚡ Simulador y Forjador RPG Intersolar")
        title.setObjectName("section_title")
        title.setStyleSheet("font-size: 16px; font-weight: bold; color: #818cf8;")
        layout.addWidget(title)
        
        self.tabs = QTabWidget()
        layout.addWidget(self.tabs, stretch=1)
        
        self._build_forge_tab()
        self._build_simulator_tab()
        self._build_combat_tab()
        self._build_quests_tab()
        self._build_rules_tab()
        
        btn_close = QPushButton("Cerrar")
        btn_close.clicked.connect(self.accept)
        btn_close.setFixedWidth(100)
        layout.addWidget(btn_close, alignment=Qt.AlignmentFlag.AlignRight)
        
    def _build_forge_tab(self):
        tab = QWidget()
        lay = QHBoxLayout(tab)
        lay.setContentsMargins(10, 10, 10, 10)
        lay.setSpacing(14)
        
        # Left Panel: Class List
        left = QWidget()
        left_lay = QVBoxLayout(left)
        left_lay.setContentsMargins(0, 0, 0, 0)
        left_lay.setSpacing(8)
        
        lbl_classes = QLabel("SELECCIONA CLASE:")
        lbl_classes.setStyleSheet("color: #64748b; font-size: 10px; font-weight: 700;")
        left_lay.addWidget(lbl_classes)
        
        self.forge_search = QLineEdit()
        self.forge_search.setPlaceholderText("🔍 Filtrar clases...")
        self.forge_search.textChanged.connect(self._filter_forge_classes)
        left_lay.addWidget(self.forge_search)
        
        self.forge_class_list = QListWidget()
        self.forge_class_list.setStyleSheet("QListWidget { background-color: #0d0f17; border: 1px solid rgba(255,255,255,0.04); border-radius: 8px; color: #cbd5e1; }")
        self.forge_class_list.currentItemChanged.connect(self._on_forge_class_changed)
        left_lay.addWidget(self.forge_class_list)
        
        lay.addWidget(left, stretch=2)
        
        # Middle Panel: Concept Checkbox List
        mid = QWidget()
        mid_lay = QVBoxLayout(mid)
        mid_lay.setContentsMargins(0, 0, 0, 0)
        mid_lay.setSpacing(8)
        
        lbl_concepts = QLabel("COMBINA CONCEPTOS:")
        lbl_concepts.setStyleSheet("color: #64748b; font-size: 10px; font-weight: 700;")
        mid_lay.addWidget(lbl_concepts)
        
        self.concept_search = QLineEdit()
        self.concept_search.setPlaceholderText("🔍 Filtrar conceptos...")
        self.concept_search.textChanged.connect(self._filter_forge_concepts)
        mid_lay.addWidget(self.concept_search)
        
        self.forge_concepts_list = QListWidget()
        self.forge_concepts_list.setStyleSheet("QListWidget { background-color: #0d0f17; border: 1px solid rgba(255,255,255,0.04); border-radius: 8px; color: #cbd5e1; }")
        self.forge_concepts_list.itemChanged.connect(self._on_concept_checked)
        mid_lay.addWidget(self.forge_concepts_list)
        
        lay.addWidget(mid, stretch=2)
        
        # Right Panel: Results & Forge
        right = QWidget()
        right_lay = QVBoxLayout(right)
        right_lay.setContentsMargins(0, 0, 0, 0)
        right_lay.setSpacing(12)
        
        lbl_res = QLabel("ANÁLISIS DE SINERGIA:")
        lbl_res.setStyleSheet("color: #64748b; font-size: 10px; font-weight: 700;")
        right_lay.addWidget(lbl_res)
        
        self.synergy_bar = QProgressBar()
        self.synergy_bar.setValue(0)
        self.synergy_bar.setFixedHeight(12)
        self.synergy_bar.setTextVisible(False)
        self.synergy_bar.setStyleSheet("""
            QProgressBar { background-color: #0d0f17; border: none; border-radius: 6px; }
            QProgressBar::chunk { background-color: #6366f1; border-radius: 6px; }
        """)
        right_lay.addWidget(self.synergy_bar)
        
        self.lbl_synergy_desc = QLabel("Selecciona una clase y marca conceptos para ver la compatibilidad de mutación.")
        self.lbl_synergy_desc.setWordWrap(True)
        self.lbl_synergy_desc.setStyleSheet("background-color: #0d0f17; border: 1px solid rgba(255,255,255,0.04); border-radius: 8px; padding: 12px; color: #94a3b8; font-size: 12px; min-height: 120px;")
        self.lbl_synergy_desc.setAlignment(Qt.AlignmentFlag.AlignTop)
        right_lay.addWidget(self.lbl_synergy_desc)
        
        self.lbl_class_info = QLabel("Detalles de la Clase...")
        self.lbl_class_info.setWordWrap(True)
        self.lbl_class_info.setStyleSheet("background-color: #0d0f17; border: 1px solid rgba(255,255,255,0.04); border-radius: 8px; padding: 12px; color: #cbd5e1; font-size: 12px; min-height: 120px;")
        self.lbl_class_info.setAlignment(Qt.AlignmentFlag.AlignTop)
        right_lay.addWidget(self.lbl_class_info)
        
        self.btn_forge = QPushButton("🔨 Forjar Mutación de Clase")
        self.btn_forge.setObjectName("btn_add_row")
        self.btn_forge.clicked.connect(self._forge_mutation)
        self.btn_forge.setFixedHeight(36)
        right_lay.addWidget(self.btn_forge)
        
        right_lay.addStretch()
        lay.addWidget(right, stretch=3)
        
        self._populate_classes()
        self._populate_concepts()
        
        self.tabs.addTab(tab, "🔨 Yunque de Combinación")
        
    def _build_simulator_tab(self):
        tab = QWidget()
        lay = QHBoxLayout(tab)
        lay.setContentsMargins(10, 10, 10, 10)
        lay.setSpacing(14)
        
        # Left Panel: Character Editor
        left = QWidget()
        left.setFixedWidth(320)
        left_lay = QVBoxLayout(left)
        left_lay.setContentsMargins(0, 0, 0, 0)
        left_lay.setSpacing(10)
        
        lbl_char = QLabel("DISEÑO DE FICHA:")
        lbl_char.setStyleSheet("color: #64748b; font-size: 10px; font-weight: 700;")
        left_lay.addWidget(lbl_char)
        
        form = QFormLayout()
        self.char_form_layout = form
        form.setSpacing(8)
        
        self.char_name = QLineEdit("Héroe Sin Nombre")
        form.addRow("Nombre:", self.char_name)
        
        self.char_class_combo = QComboBox()
        self.char_class_combo.addItem("— Sin Clase —", None)
        for c_id, name, cat, rol, desc in self.classes:
            self.char_class_combo.addItem(name, (c_id, name, cat, rol, desc))
        self.char_class_combo.currentIndexChanged.connect(self._recalculate_simulation)
        form.addRow("Clase Activa:", self.char_class_combo)
        
        self.char_lvl_slider = QSlider(Qt.Orientation.Horizontal)
        self.char_lvl_slider.setRange(1, 100)
        self.char_lvl_slider.setValue(1)
        self.char_lvl_slider.valueChanged.connect(self._recalculate_simulation)
        self.lbl_lvl_val = QLabel("Nivel: 1")
        self.lbl_lvl_val.setStyleSheet("color: #818cf8; font-weight: bold;")
        form.addRow(self.lbl_lvl_val, self.char_lvl_slider)
        
        from PyQt6.QtWidgets import QSpinBox
        self.char_str_spin = QSpinBox(); self.char_str_spin.setRange(10, 999); self.char_str_spin.setValue(10); self.char_str_spin.valueChanged.connect(self._recalculate_simulation)
        self.char_agi_spin = QSpinBox(); self.char_agi_spin.setRange(10, 999); self.char_agi_spin.setValue(10); self.char_agi_spin.valueChanged.connect(self._recalculate_simulation)
        self.char_int_spin = QSpinBox(); self.char_int_spin.setRange(10, 999); self.char_int_spin.setValue(10); self.char_int_spin.valueChanged.connect(self._recalculate_simulation)
        self.char_vit_spin = QSpinBox(); self.char_vit_spin.setRange(10, 999); self.char_vit_spin.setValue(10); self.char_vit_spin.valueChanged.connect(self._recalculate_simulation)
        
        form.addRow("Fuerza Base (STR):", self.char_str_spin)
        form.addRow("Agilidad Base (AGI):", self.char_agi_spin)
        form.addRow("Inteligencia Base (INT):", self.char_int_spin)
        form.addRow("Vitalidad Base (VIT):", self.char_vit_spin)
        
        left_lay.addLayout(form)
        
        sep = QFrame(); sep.setFrameShape(QFrame.Shape.HLine); sep.setObjectName("separator")
        left_lay.addWidget(sep)
        
        # Concept Selectors (up to 4)
        lbl_slot = QLabel("SLOTS DE CONCEPTOS ACTIVOS:")
        lbl_slot.setStyleSheet("color: #64748b; font-size: 10px; font-weight: 700; margin-top: 4px;")
        left_lay.addWidget(lbl_slot)
        
        self.concept_combos = []
        for i in range(4):
            combo = QComboBox()
            combo.addItem("— Vacío —", None)
            for con_id, name, cat, rare, bonus, lvl in self.concepts:
                combo.addItem(f"[{cat}] {name}", (con_id, name, cat, rare, bonus, lvl))
            combo.currentIndexChanged.connect(self._recalculate_simulation)
            left_lay.addWidget(combo)
            self.concept_combos.append(combo)
            
        lay.addWidget(left, stretch=1)
        
        # Right Panel: Results & Stats Chart
        right = QWidget()
        right_lay = QVBoxLayout(right)
        right_lay.setContentsMargins(0, 0, 0, 0)
        right_lay.setSpacing(12)
        
        lbl_char_sheet = QLabel("ATRIBUTOS DERIVADOS DE COMBATE:")
        lbl_char_sheet.setStyleSheet("color: #64748b; font-size: 10px; font-weight: 700;")
        right_lay.addWidget(lbl_char_sheet)
        
        stats_panel = QFrame()
        stats_panel.setStyleSheet("QFrame { background-color: #0d0f17; border: 1px solid rgba(255,255,255,0.04); border-radius: 8px; }")
        stats_lay = QVBoxLayout(stats_panel)
        self.derived_stats_layout = stats_lay
        stats_lay.setSpacing(6)
        
        self.lbl_hp = QLabel("Vida (HP): 120"); self.lbl_hp.setStyleSheet("color: #10b981; font-weight: bold; font-size: 13px;")
        self.lbl_mp = QLabel("Maná (MP): 100"); self.lbl_mp.setStyleSheet("color: #3b82f6; font-weight: bold; font-size: 13px;")
        self.lbl_phys_dmg = QLabel("Ataque Físico: 20"); self.lbl_phys_dmg.setStyleSheet("color: #ef4444; font-weight: bold; font-size: 13px;")
        self.lbl_spell_pwr = QLabel("Poder Mágico: 25"); self.lbl_spell_pwr.setStyleSheet("color: #a855f7; font-weight: bold; font-size: 13px;")
        self.lbl_combat_spd = QLabel("Velocidad de Combate: 8"); self.lbl_combat_spd.setStyleSheet("color: #e2e8f0; font-weight: bold; font-size: 13px;")
        
        for lbl in [self.lbl_hp, self.lbl_mp, self.lbl_phys_dmg, self.lbl_spell_pwr, self.lbl_combat_spd]:
            stats_lay.addWidget(lbl)
            
        right_lay.addWidget(stats_panel)
        
        # Custom Stats Chart
        self.stats_chart = RpgStatsChartWidget()
        right_lay.addWidget(self.stats_chart, stretch=1)
        
        btn_export = QPushButton("📋 Exportar Ficha a Markdown")
        btn_export.clicked.connect(self._export_character_sheet)
        right_lay.addWidget(btn_export)
        
        lay.addWidget(right, stretch=2)
        
        self._recalculate_simulation()
        self.tabs.addTab(tab, "👤 Simulador de Ficha RPG")
        
    def _populate_classes(self):
        self.forge_class_list.clear()
        for c_id, name, cat, rol, desc in self.classes:
            item = QListWidgetItem(name)
            item.setData(Qt.ItemDataRole.UserRole, (c_id, name, cat, rol, desc))
            self.forge_class_list.addItem(item)
            
    def _populate_concepts(self):
        self.forge_concepts_list.clear()
        for con_id, name, cat, rare, bonus, lvl in self.concepts:
            item = QListWidgetItem(f"[{cat}] {name}")
            item.setFlags(item.flags() | Qt.ItemFlag.ItemIsUserCheckable)
            item.setCheckState(Qt.CheckState.Unchecked)
            item.setData(Qt.ItemDataRole.UserRole, (con_id, name, cat, rare, bonus, lvl))
            self.forge_concepts_list.addItem(item)
            
    def _filter_forge_classes(self, text):
        term = text.strip().lower()
        for i in range(self.forge_class_list.count()):
            item = self.forge_class_list.item(i)
            item.setHidden(term not in item.text().lower())
            
    def _filter_forge_concepts(self, text):
        term = text.strip().lower()
        for i in range(self.forge_concepts_list.count()):
            item = self.forge_concepts_list.item(i)
            item.setHidden(term not in item.text().lower())
            
    def _on_forge_class_changed(self, current, previous):
        if not current:
            self.lbl_class_info.setText("Selecciona una clase para ver sus detalles.")
            return
        c_id, name, cat, rol, desc = current.data(Qt.ItemDataRole.UserRole)
        info = f"<b>Clase:</b> {name}<br/>"
        info += f"<b>Categoría:</b> {cat or '—'}<br/>"
        info += f"<b>Rol:</b> {rol or '—'}<br/><br/>"
        info += f"<b>Descripción:</b> {desc or 'Sin descripción.'}"
        self.lbl_class_info.setText(info)
        self._recalculate_synergy()
        
    def _on_concept_checked(self, item):
        self._recalculate_synergy()
        
    def _recalculate_synergy(self):
        class_item = self.forge_class_list.currentItem()
        if not class_item:
            self.synergy_bar.setValue(0)
            self.lbl_synergy_desc.setText("Selecciona una clase para calcular sinergia.")
            return
            
        c_id, c_name, c_cat, c_rol, c_desc = class_item.data(Qt.ItemDataRole.UserRole)
        
        checked_concepts = []
        for i in range(self.forge_concepts_list.count()):
            item = self.forge_concepts_list.item(i)
            if item.checkState() == Qt.CheckState.Checked:
                checked_concepts.append(item.data(Qt.ItemDataRole.UserRole))
                
        if not checked_concepts:
            self.synergy_bar.setValue(0)
            self.lbl_synergy_desc.setText("Selecciona al menos un concepto para combinar.")
            return
            
        score = 15
        match_reasons = []
        
        c_words = set(re.findall(r'\w+', (c_desc or "") + " " + (c_rol or "") + " " + (c_cat or "")))
        c_words = {w.lower() for w in c_words if len(w) > 3}
        
        for con_id, con_name, con_cat, con_rare, con_bonus, con_lvl in checked_concepts:
            con_name_clean = con_name.replace("[", "").replace("]", "").lower().strip()
            if con_name_clean in (c_desc or "").lower() or con_name_clean in (c_rol or "").lower():
                score += 30
                match_reasons.append(f"Alineación de Concepto [{con_name}]")
            if con_cat.lower() == "físicos" and any(w in c_words for w in ["guerrero", "físico", "combate", "espada", "defensa", "tanque", "daño"]):
                score += 20
                match_reasons.append(f"Compatibilidad Física con {con_name}")
            elif con_cat.lower() == "elementales" and any(w in c_words for w in ["mago", "hechizo", "fuego", "hielo", "rayo", "elemento", "místico"]):
                score += 25
                match_reasons.append(f"Sintonía Elemental con {con_name}")
            elif con_cat.lower() == "mentales" and any(w in c_words for w in ["sabio", "mente", "intelecto", "psíquico", "oráculo", "meditación"]):
                score += 20
                match_reasons.append(f"Alineación Mental con {con_name}")
            else:
                bonus_clean = (con_bonus or "").lower()
                overlap = any(w in bonus_clean for w in c_words)
                if overlap:
                    score += 15
                    match_reasons.append(f"Sinergia de Atributos con {con_name}")
                    
        score = min(score, 100)
        self.synergy_bar.setValue(score)
        
        if score >= 85:
            quality = "💫 MUTACIÓN PERFECTA"
            color = "#10b981"
        elif score >= 60:
            quality = "⚡ FUSIÓN ESTABLE"
            color = "#fbbf24"
        else:
            quality = "⚠️ COMPATIBILIDAD BAJA"
            color = "#ef4444"
            
        desc = f"<b style='color:{color};'>{quality} ({score}%)</b><br/>"
        if match_reasons:
            desc += "• " + "<br/>• ".join(match_reasons)
        else:
            desc += "Baja sintonía detectada en las palabras clave del lore."
            
        self.lbl_synergy_desc.setText(desc)
        
    def _forge_mutation(self):
        class_item = self.forge_class_list.currentItem()
        if not class_item: return
        c_id, c_name, c_cat, c_rol, c_desc = class_item.data(Qt.ItemDataRole.UserRole)
        
        checked_concepts = []
        for i in range(self.forge_concepts_list.count()):
            item = self.forge_concepts_list.item(i)
            if item.checkState() == Qt.CheckState.Checked:
                checked_concepts.append(item.data(Qt.ItemDataRole.UserRole))
                
        if not checked_concepts:
            QMessageBox.information(self, "Aviso", "Selecciona al menos un concepto para forjar.")
            return
            
        concepts_str = ", ".join([f"[{c[1]}]" for c in checked_concepts])
        ans = QMessageBox.question(
            self, 
            "Forjar Mutación", 
            f"¿Deseas fusionar permanentemente los conceptos {concepts_str} en la clase '{c_name}'?\n\nEsto añadirá los requisitos de concepto a la descripción de la clase en la base de datos.",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
        )
        if ans == QMessageBox.StandardButton.Yes:
            new_reqs = f"\n\n[Requisitos de Fusión: {concepts_str}]"
            updated_desc = (c_desc or "") + new_reqs
            try:
                conn = sqlite3.connect(self.db_path)
                cursor = conn.cursor()
                cursor.execute(
                    f"UPDATE p_{self.planet_id}_clases SET \"Descripción Funcional\"=? WHERE id=?",
                    (updated_desc, c_id)
                )
                conn.commit()
                conn.close()
                QMessageBox.information(self, "Forja Exitosa", f"La clase '{c_name}' ha mutado con éxito.")
                self._load_database_data()
                self._populate_classes()
                
                mw = self.parent()
                if hasattr(mw, "tabs") and mw.tabs.currentWidget():
                    view = mw.tabs.currentWidget().property("view")
                    if view and mw.tabs.tabText(mw.tabs.currentIndex()) == "Clases":
                        view.model().select()
            except Exception as e:
                QMessageBox.warning(self, "Error", f"Fallo al forjar: {e}")
                
    def _parse_bonus(self, bonus_text):
        if not bonus_text: return None
        text = bonus_text.lower().strip()
        match_pct = re.search(r'\+?(\d+)%\s*([a-záéíóúñ]+)', text)
        if match_pct:
            val = int(match_pct.group(1))
            attr = match_pct.group(2)
            is_pct = True
        else:
            match_flat = re.search(r'\+?(\d+)\s*([a-záéíóúñ]+)', text)
            if match_flat:
                val = int(match_flat.group(1))
                attr = match_flat.group(2)
                is_pct = False
            else:
                return None
                
        if "intelig" in attr or "mana" in attr: attr = "int"
        elif "fuerza" in attr or "fuer" in attr: attr = "str"
        elif "agil" in attr or "veloc" in attr: attr = "agi"
        elif "vital" in attr or "vida" in attr: attr = "vit"
        else:
            custom_keys = self._get_custom_attributes_list()
            for k in custom_keys:
                display_name = self.game_rules.get(f"attr_{k}_name", k.upper()).lower()
                if k in attr or display_name in attr:
                    attr = k
                    break
        return (attr, is_pct, val)
        
    def _recalculate_simulation(self):
        level = self.char_lvl_slider.value()
        self.lbl_lvl_val.setText(f"Nivel del Personaje: {level}")
        
        base_str = self.char_str_spin.value()
        base_agi = self.char_agi_spin.value()
        base_int = self.char_int_spin.value()
        base_vit = self.char_vit_spin.value()
        
        custom_keys = self._get_custom_attributes_list()
        custom_values = {}
        for k in custom_keys:
            spin = self.custom_spinboxes.get(k)
            base_val = spin.value() if spin else 10
            lvl_val = base_val + (level - 1) * 1.0
            custom_values[k] = {"lvl": lvl_val, "mult": 1.0, "flat": 0}
            
        mult = {"str": 1.0, "agi": 1.0, "int": 1.0, "vit": 1.0}
        
        class_idx = self.char_class_combo.currentIndex()
        class_name = "Sin Clase"
        if class_idx > 0:
            c_data = self.char_class_combo.itemData(class_idx)
            class_name = c_data[1]
            cat = str(c_data[2]).lower()
            rol = str(c_data[3]).lower()
            
            if "combatiente" in cat or "combatiente" in rol or "guerrero" in rol:
                mult = {"str": 1.6, "agi": 1.2, "int": 0.6, "vit": 1.3}
            elif "místico" in cat or "hechicero" in rol or "mago" in rol:
                mult = {"str": 0.5, "agi": 0.8, "int": 1.8, "vit": 0.8}
            elif "sanador" in cat or "soporte" in rol or "médico" in rol:
                mult = {"str": 0.6, "agi": 1.0, "int": 1.3, "vit": 1.1}
            elif "guardián" in cat or "defensa" in rol or "tanque" in rol:
                mult = {"str": 1.1, "agi": 0.7, "int": 0.7, "vit": 1.8}
            elif "sigilo" in cat or "asesino" in rol or "espía" in rol:
                mult = {"str": 1.1, "agi": 1.7, "int": 0.7, "vit": 1.0}
                
        str_lvl = base_str + (level - 1) * mult["str"]
        agi_lvl = base_agi + (level - 1) * mult["agi"]
        int_lvl = base_int + (level - 1) * mult["int"]
        vit_lvl = base_vit + (level - 1) * mult["vit"]
        
        str_mult = 1.0
        agi_mult = 1.0
        int_mult = 1.0
        vit_mult = 1.0
        
        str_flat = 0
        agi_flat = 0
        int_flat = 0
        vit_flat = 0
        
        selected_concepts = []
        for combo in self.concept_combos:
            idx = combo.currentIndex()
            if idx > 0:
                selected_concepts.append(combo.itemData(idx))
                
        for con_id, con_name, con_cat, con_rare, con_bonus, con_lvl in selected_concepts:
            parsed = self._parse_bonus(con_bonus)
            if parsed:
                attr, is_pct, val = parsed
                if attr == "str":
                    if is_pct: str_mult += (val / 100.0)
                    else: str_flat += val
                elif attr == "agi":
                    if is_pct: agi_mult += (val / 100.0)
                    else: agi_flat += val
                elif attr == "int":
                    if is_pct: int_mult += (val / 100.0)
                    else: int_flat += val
                elif attr == "vit":
                    if is_pct: vit_mult += (val / 100.0)
                    else: vit_flat += val
                elif attr in custom_values:
                    if is_pct: custom_values[attr]["mult"] += (val / 100.0)
                    else: custom_values[attr]["flat"] += val
                    
        final_str = str_lvl * str_mult + str_flat
        final_agi = agi_lvl * agi_mult + agi_flat
        final_int = int_lvl * int_mult + int_flat
        final_vit = vit_lvl * vit_mult + vit_flat
        
        final_custom_values = {}
        for k, info in custom_values.items():
            final_custom_values[k] = info["lvl"] * info["mult"] + info["flat"]
            
        hp, mp, phys_dmg, spell_pwr, combat_spd = self._evaluate_custom_formulas(final_str, final_agi, final_int, final_vit, final_custom_values)
        
        self.lbl_hp.setText(f"Vida Máxima (HP): {int(hp)}")
        self.lbl_mp.setText(f"Maná Máximo (MP): {int(mp)}")
        self.lbl_phys_dmg.setText(f"Daño de Ataque Físico: {int(phys_dmg)}")
        self.lbl_spell_pwr.setText(f"Poder del Hechizo Mágico: {int(spell_pwr)}")
        self.lbl_combat_spd.setText(f"Velocidad en Combate: {int(combat_spd)}")
        
        if hasattr(self, "custom_derived_labels"):
            for lbl in self.custom_derived_labels:
                self.derived_stats_layout.removeWidget(lbl)
                lbl.deleteLater()
        self.custom_derived_labels = []
        
        for k, val in final_custom_values.items():
            display_name = self.game_rules.get(f"attr_{k}_name", k.upper())
            lbl = QLabel(f"{display_name} Final: {int(val)}")
            lbl.setStyleSheet("color: #38bdf8; font-weight: bold; font-size: 13px;")
            self.derived_stats_layout.addWidget(lbl)
            self.custom_derived_labels.append(lbl)
            
        self.stats_chart.set_stats({
            "str": (str_lvl, final_str - str_lvl),
            "agi": (agi_lvl, final_agi - agi_lvl),
            "int": (int_lvl, final_int - int_lvl),
            "vit": (vit_lvl, final_vit - vit_lvl)
        })
        
        if hasattr(self, "lbl_p1_summary"):
            self._recalculate_combat_player()
        
    def _export_character_sheet(self):
        level = self.char_lvl_slider.value()
        name = self.char_name.text().strip()
        class_idx = self.char_class_combo.currentIndex()
        class_name = self.char_class_combo.itemText(class_idx) if class_idx > 0 else "Sin Clase"
        
        concepts = []
        for combo in self.concept_combos:
            idx = combo.currentIndex()
            if idx > 0:
                concepts.append(combo.itemText(idx))
                
        concepts_str = "\n".join([f"- {c}" for c in concepts]) if concepts else "- Ninguno"
        
        chart_stats = self.stats_chart.stats
        final_str = sum(chart_stats["str"])
        final_agi = sum(chart_stats["agi"])
        final_int = sum(chart_stats["int"])
        final_vit = sum(chart_stats["vit"])
        
        hp, mp, phys_dmg, spell_pwr, combat_spd = self._evaluate_custom_formulas(final_str, final_agi, final_int, final_vit)
        
        md = f"""# 👤 FICHA DE PERSONAJE RPG: {name}

## 📊 Datos Base
- **Nivel**: {level}
- **Clase**: {class_name}

## 🏷️ Conceptos Activos
{concepts_str}

## 📈 Atributos Finales
- **Fuerza (STR)**: {int(final_str)}
- **Agilidad (AGI)**: {int(final_agi)}
- **Inteligencia (INT)**: {int(final_int)}
- **Vitalidad (VIT)**: {int(final_vit)}

## ⚔️ Estadísticas de Combate
- **Puntos de Vida (HP)**: {int(hp)}
- **Puntos de Maná (MP)**: {int(mp)}
- **Daño Físico**: {int(phys_dmg)}
- **Poder Mágico**: {int(spell_pwr)}
- **Velocidad de Acción**: {int(combat_spd)}
"""
        fpath, _ = QFileDialog.getSaveFileName(self, "Exportar Ficha", f"{name}_ficha.md", "Markdown Files (*.md)")
        if fpath:
            with open(fpath, "w", encoding="utf-8") as f:
                f.write(md)
            QMessageBox.information(self, "Ficha Exportada", "Ficha guardada exitosamente.")

    def _build_combat_tab(self):
        tab = QWidget()
        lay = QHBoxLayout(tab)
        lay.setContentsMargins(10, 10, 10, 10)
        lay.setSpacing(14)
        
        left = QWidget()
        left.setFixedWidth(320)
        left_lay = QVBoxLayout(left)
        left_lay.setContentsMargins(0, 0, 0, 0)
        left_lay.setSpacing(10)
        
        lbl_p1 = QLabel("🔌 JUGADOR 1 (Sincronizado de Ficha)")
        lbl_p1.setStyleSheet("color: #818cf8; font-size: 10px; font-weight: 700;")
        left_lay.addWidget(lbl_p1)
        
        self.lbl_p1_summary = QLabel()
        self.lbl_p1_summary.setStyleSheet("background-color: #0d0f17; padding: 8px; border-radius: 6px; color: #cbd5e1; font-size: 11px;")
        left_lay.addWidget(self.lbl_p1_summary)
        
        sep = QFrame(); sep.setFrameShape(QFrame.Shape.HLine); sep.setObjectName("separator")
        left_lay.addWidget(sep)
        
        lbl_p2 = QLabel("😈 CONFIGURAR OPONENTE")
        lbl_p2.setStyleSheet("color: #f87171; font-size: 10px; font-weight: 700;")
        left_lay.addWidget(lbl_p2)
        
        form = QFormLayout()
        form.setSpacing(8)
        
        self.combat_opponent_type = QComboBox()
        self.combat_opponent_type.addItems(["Clon del Jugador", "Criatura de la BD"])
        self.combat_opponent_type.currentIndexChanged.connect(self._on_opponent_type_changed)
        form.addRow("Tipo de Oponente:", self.combat_opponent_type)
        
        self.combat_creature_combo = QComboBox()
        self.combat_creature_combo.addItem("— Seleccionar Criatura —", None)
        for c_id, name, rare, peli, tam, hab in self.creatures:
            self.combat_creature_combo.addItem(name, (c_id, name, rare, peli, tam, hab))
        self.combat_creature_combo.setEnabled(False)
        self.combat_creature_combo.currentIndexChanged.connect(self._recalculate_combat_opponent)
        form.addRow("Criatura:", self.combat_creature_combo)
        
        self.combat_opponent_lvl = QSlider(Qt.Orientation.Horizontal)
        self.combat_opponent_lvl.setRange(1, 100)
        self.combat_opponent_lvl.setValue(1)
        self.combat_opponent_lvl.valueChanged.connect(self._recalculate_combat_opponent)
        self.lbl_opp_lvl = QLabel("Nivel Enemigo: 1")
        self.lbl_opp_lvl.setStyleSheet("color: #f87171; font-weight: bold;")
        form.addRow(self.lbl_opp_lvl, self.combat_opponent_lvl)
        
        self.combat_opponent_class = QComboBox()
        self.combat_opponent_class.addItem("— Misma clase —", None)
        for c_id, name, cat, rol, desc in self.classes:
            self.combat_opponent_class.addItem(name, (c_id, name, cat, rol, desc))
        self.combat_opponent_class.currentIndexChanged.connect(self._recalculate_combat_opponent)
        form.addRow("Clase (si Clon):", self.combat_opponent_class)
        
        left_lay.addLayout(form)
        
        self.lbl_p2_summary = QLabel()
        self.lbl_p2_summary.setStyleSheet("background-color: #0d0f17; padding: 8px; border-radius: 6px; color: #cbd5e1; font-size: 11px;")
        left_lay.addWidget(self.lbl_p2_summary)
        
        left_lay.addStretch()
        lay.addWidget(left, stretch=1)
        
        right = QWidget()
        right_lay = QVBoxLayout(right)
        right_lay.setContentsMargins(0, 0, 0, 0)
        right_lay.setSpacing(10)
        
        row_btns = QHBoxLayout()
        btn_start_combat = QPushButton("⚔️ Simular Combate")
        btn_start_combat.clicked.connect(self._run_combat_simulation)
        btn_start_combat.setObjectName("btn_add_row")
        btn_start_combat.setFixedHeight(32)
        
        btn_benchmark = QPushButton("📊 Test de Balance (100 peleas)")
        btn_benchmark.clicked.connect(self._run_balance_benchmark)
        btn_benchmark.setFixedHeight(32)
        
        row_btns.addWidget(btn_start_combat)
        row_btns.addWidget(btn_benchmark)
        right_lay.addLayout(row_btns)
        
        self.combat_log = QTextEdit()
        self.combat_log.setReadOnly(True)
        self.combat_log.setStyleSheet("QTextEdit { background-color: #08090d; border: 1px solid rgba(255,255,255,0.04); border-radius: 8px; color: #f8fafc; font-family: consolas, monospace; font-size: 11px; }")
        right_lay.addWidget(self.combat_log, stretch=1)
        
        lay.addWidget(right, stretch=2)
        
        self._recalculate_combat_player()
        self._recalculate_combat_opponent()
        
        self.tabs.addTab(tab, "⚔️ Arena de Combate")

    def _on_opponent_type_changed(self, idx):
        is_creature = (idx == 1)
        self.combat_creature_combo.setEnabled(is_creature)
        self.combat_opponent_class.setEnabled(not is_creature)
        self._recalculate_combat_opponent()

    def _calculate_opponent_stats(self):
        opponent_type = self.combat_opponent_type.currentIndex()
        level = self.combat_opponent_lvl.value()
        
        if opponent_type == 0: # Clon
            class_idx = self.combat_opponent_class.currentIndex()
            if class_idx > 0:
                c_data = self.combat_opponent_class.itemData(class_idx)
                class_name = c_data[1]
                cat = str(c_data[2]).lower()
                rol = str(c_data[3]).lower()
            else:
                p_class_idx = self.char_class_combo.currentIndex()
                if p_class_idx > 0:
                    c_data = self.char_class_combo.itemData(p_class_idx)
                    class_name = c_data[1]
                    cat = str(c_data[2]).lower()
                    rol = str(c_data[3]).lower()
                else:
                    class_name = "Sin Clase"
                    cat, rol = "", ""
            
            base_str, base_agi, base_int, base_vit = 10, 10, 10, 10
            mult = {"str": 1.0, "agi": 1.0, "int": 1.0, "vit": 1.0}
            if "combatiente" in cat or "combatiente" in rol or "guerrero" in rol:
                mult = {"str": 1.6, "agi": 1.2, "int": 0.6, "vit": 1.3}
            elif "místico" in cat or "hechicero" in rol or "mago" in rol:
                mult = {"str": 0.5, "agi": 0.8, "int": 1.8, "vit": 0.8}
            elif "sanador" in cat or "soporte" in rol or "médico" in rol:
                mult = {"str": 0.6, "agi": 1.0, "int": 1.3, "vit": 1.1}
            elif "guardián" in cat or "defensa" in rol or "tanque" in rol:
                mult = {"str": 1.1, "agi": 0.7, "int": 0.7, "vit": 1.8}
            elif "sigilo" in cat or "asesino" in rol or "espía" in rol:
                mult = {"str": 1.1, "agi": 1.7, "int": 0.7, "vit": 1.0}
                
            str_lvl = base_str + (level - 1) * mult["str"]
            agi_lvl = base_agi + (level - 1) * mult["agi"]
            int_lvl = base_int + (level - 1) * mult["int"]
            vit_lvl = base_vit + (level - 1) * mult["vit"]
            
            hp, mp, atk, mag, spd = self._evaluate_custom_formulas(str_lvl, agi_lvl, int_lvl, vit_lvl)
            return {"hp": hp, "mp": mp, "atk": atk, "mag": mag, "spd": spd, "name": f"Clon ({class_name})", "lvl": level}
            
        else: # Criatura
            cr_idx = self.combat_creature_combo.currentIndex()
            if cr_idx <= 0:
                return {"hp": 100, "mp": 50, "atk": 15, "mag": 10, "spd": 8, "name": "Bestia Salvaje", "lvl": level}
            c_data = self.combat_creature_combo.itemData(cr_idx)
            c_name = c_data[1]
            rare_lvl = c_data[2] or 1
            peli_lvl = c_data[3] or 1
            
            base_vit = 10 + peli_lvl * 5 + rare_lvl * 3
            base_str = 8 + peli_lvl * 4 + rare_lvl * 2
            base_agi = 6 + peli_lvl * 2 + rare_lvl * 1
            base_int = 5 + rare_lvl * 5
            
            mult_vit = 1.0 + (peli_lvl * 0.4) + (rare_lvl * 0.2)
            mult_str = 0.8 + (peli_lvl * 0.3) + (rare_lvl * 0.1)
            mult_agi = 0.7 + (peli_lvl * 0.1)
            mult_int = 0.5 + (rare_lvl * 0.3)
            
            final_str = base_str + (level - 1) * mult_str
            final_agi = base_agi + (level - 1) * mult_agi
            final_int = base_int + (level - 1) * mult_int
            final_vit = base_vit + (level - 1) * mult_vit
            
            hp, mp, atk, mag, spd = self._evaluate_custom_formulas(final_str, final_agi, final_int, final_vit)
            return {"hp": hp, "mp": mp, "atk": atk, "mag": mag, "spd": spd, "name": c_name, "lvl": level}

    def _calculate_player_stats(self):
        level = self.char_lvl_slider.value()
        base_str = self.char_str_spin.value()
        base_agi = self.char_agi_spin.value()
        base_int = self.char_int_spin.value()
        base_vit = self.char_vit_spin.value()
        
        mult = {"str": 1.0, "agi": 1.0, "int": 1.0, "vit": 1.0}
        class_idx = self.char_class_combo.currentIndex()
        class_name = "Sin Clase"
        if class_idx > 0:
            c_data = self.char_class_combo.itemData(class_idx)
            class_name = c_data[1]
            cat = str(c_data[2]).lower()
            rol = str(c_data[3]).lower()
            
            if "combatiente" in cat or "combatiente" in rol or "guerrero" in rol:
                mult = {"str": 1.6, "agi": 1.2, "int": 0.6, "vit": 1.3}
            elif "místico" in cat or "hechicero" in rol or "mago" in rol:
                mult = {"str": 0.5, "agi": 0.8, "int": 1.8, "vit": 0.8}
            elif "sanador" in cat or "soporte" in rol or "médico" in rol:
                mult = {"str": 0.6, "agi": 1.0, "int": 1.3, "vit": 1.1}
            elif "guardián" in cat or "defensa" in rol or "tanque" in rol:
                mult = {"str": 1.1, "agi": 0.7, "int": 0.7, "vit": 1.8}
            elif "sigilo" in cat or "asesino" in rol or "espía" in rol:
                mult = {"str": 1.1, "agi": 1.7, "int": 0.7, "vit": 1.0}
                
        str_lvl = base_str + (level - 1) * mult["str"]
        agi_lvl = base_agi + (level - 1) * mult["agi"]
        int_lvl = base_int + (level - 1) * mult["int"]
        vit_lvl = base_vit + (level - 1) * mult["vit"]
        
        str_mult = 1.0; agi_mult = 1.0; int_mult = 1.0; vit_mult = 1.0
        str_flat = 0; agi_flat = 0; int_flat = 0; vit_flat = 0
        
        selected_concepts = []
        for combo in self.concept_combos:
            idx = combo.currentIndex()
            if idx > 0:
                selected_concepts.append(combo.itemData(idx))
                
        for con_id, con_name, con_cat, con_rare, con_bonus, con_lvl in selected_concepts:
            parsed = self._parse_bonus(con_bonus)
            if parsed:
                attr, is_pct, val = parsed
                if attr == "str":
                    if is_pct: str_mult += (val / 100.0)
                    else: str_flat += val
                elif attr == "agi":
                    if is_pct: agi_mult += (val / 100.0)
                    else: agi_flat += val
                elif attr == "int":
                    if is_pct: int_mult += (val / 100.0)
                    else: int_flat += val
                elif attr == "vit":
                    if is_pct: vit_mult += (val / 100.0)
                    else: vit_flat += val
                    
        final_str = str_lvl * str_mult + str_flat
        final_agi = agi_lvl * agi_mult + agi_flat
        final_int = int_lvl * int_mult + int_flat
        final_vit = vit_lvl * vit_mult + vit_flat
        
        hp, mp, atk, mag, spd = self._evaluate_custom_formulas(final_str, final_agi, final_int, final_vit)
        name = self.char_name.text().strip() or "Héroe"
        return {"hp": hp, "mp": mp, "atk": atk, "mag": mag, "spd": spd, "name": f"{name} ({class_name})", "lvl": level}

    def _recalculate_combat_opponent(self):
        stats = self._calculate_opponent_stats()
        self.lbl_opp_lvl.setText(f"Nivel Enemigo: {stats['lvl']}")
        summary = f"<b>{stats['name']}</b> Nivel {stats['lvl']}<br/>"
        summary += f"HP: {stats['hp']} | MP: {stats['mp']}<br/>"
        summary += f"Ataque: {stats['atk']} | Poder Mágico: {stats['mag']}<br/>"
        summary += f"Velocidad: {stats['spd']}"
        self.lbl_p2_summary.setText(summary)
        self.lbl_p2_summary.setStyleSheet("background-color: #110e14; border: 1px solid rgba(248,113,113,0.15); padding: 8px; border-radius: 6px; color: #fca5a5; font-size: 11px;")

    def _recalculate_combat_player(self):
        stats = self._calculate_player_stats()
        summary = f"<b>{stats['name']}</b> Nivel {stats['lvl']}<br/>"
        summary += f"HP: {stats['hp']} | MP: {stats['mp']}<br/>"
        summary += f"Ataque: {stats['atk']} | Poder Mágico: {stats['mag']}<br/>"
        summary += f"Velocidad: {stats['spd']}"
        self.lbl_p1_summary.setText(summary)

    def _evaluate_custom_formulas(self, str_v, agi_v, int_v, vit_v, custom_vals=None):
        context = {"str": str_v, "agi": agi_v, "int": int_v, "vit": vit_v, "math": __import__('math')}
        if custom_vals:
            context.update(custom_vals)
        
        hp = vit_v * 12
        mp = int_v * 10
        atk = str_v * 2 + agi_v * 0.5
        mag = int_v * 2.5
        spd = agi_v * 0.8
        
        try:
            hp = eval(self.game_rules["formula_hp"], {"__builtins__": None}, context)
        except: pass
        try:
            mp = eval(self.game_rules["formula_mp"], {"__builtins__": None}, context)
        except: pass
        try:
            atk = eval(self.game_rules["formula_atk"], {"__builtins__": None}, context)
        except: pass
        try:
            mag = eval(self.game_rules["formula_mag"], {"__builtins__": None}, context)
        except: pass
        try:
            spd = eval(self.game_rules["formula_spd"], {"__builtins__": None}, context)
        except: pass
        
        return max(10, int(hp)), max(5, int(mp)), max(1, int(atk)), max(1, int(mag)), max(1, int(spd))

    def _run_combat_simulation(self):
        p1 = self._calculate_player_stats()
        p2 = self._calculate_opponent_stats()
        
        self.combat_log.clear()
        self.combat_log.append("⚔️ <b>¡INICIA EL COMBATE EN LA ARENA!</b> ⚔️")
        self.combat_log.append(f"🔵 <b>{p1['name']}</b> Nivel {p1['lvl']} (HP: {p1['hp']} | MP: {p1['mp']} | Atk: {p1['atk']} | Spd: {p1['spd']})")
        self.combat_log.append(f"🔴 <b>{p2['name']}</b> Nivel {p2['lvl']} (HP: {p2['hp']} | MP: {p2['mp']} | Atk: {p2['atk']} | Spd: {p2['spd']})")
        self.combat_log.append("-" * 60)
        
        hp1, mp1 = p1['hp'], p1['mp']
        hp2, mp2 = p2['hp'], p2['mp']
        
        gauge1 = 0
        gauge2 = 0
        rounds = 0
        max_rounds = 100
        
        while hp1 > 0 and hp2 > 0 and rounds < max_rounds:
            rounds += 1
            gauge1 += p1['spd']
            gauge2 += p2['spd']
            
            # Quien llegue a 100 actúa
            if gauge1 >= 100 or gauge2 >= 100:
                if gauge1 >= gauge2:
                    gauge1 -= 100
                    dmg_log, hp2, mp1 = self._take_turn(p1, p2, hp1, hp2, mp1, "🔵")
                    self.combat_log.append(dmg_log)
                else:
                    gauge2 -= 100
                    dmg_log, hp1, mp2 = self._take_turn(p2, p1, hp2, hp1, mp2, "🔴")
                    self.combat_log.append(dmg_log)
                    
        self.combat_log.append("-" * 60)
        if hp1 <= 0 and hp2 <= 0:
            self.combat_log.append("💥 <b>¡MUTUA DESTRUCCIÓN! Ambos combatientes han caído.</b>")
        elif hp1 <= 0:
            self.combat_log.append(f"🏆 <b>¡VICTORIA PARA {p2['name'].upper()}!</b> (HP restante: {int(hp2)})")
        elif hp2 <= 0:
            self.combat_log.append(f"🏆 <b>¡VICTORIA PARA {p1['name'].upper()}!</b> (HP restante: {int(hp1)})")
        else:
            self.combat_log.append("⏳ <b>¡LÍMITE DE RONDAS EXCEDIDO! Combate empatado.</b>")

    def _take_turn(self, caster, target, caster_hp, target_hp, caster_mp, icon):
        import random
        cast_skill = False
        skill_dmg = 0
        skill_heal = 0
        skill_name = ""
        mana_cost = 0
        
        if self.skills and caster_mp > 5 and random.random() < 0.4:
            affordable = [s for s in self.skills if s[4] <= caster_mp]
            if affordable:
                sk = random.choice(affordable)
                skill_name = sk[1]
                mana_cost = sk[4]
                skill_dmg = sk[5] or 0
                skill_heal = sk[6] or 0
                cast_skill = True
                
        if cast_skill:
            caster_mp -= mana_cost
            if skill_dmg > 0:
                raw_dmg = skill_dmg + (caster['mag'] * 1.5)
                defense = target['lvl'] * 1.2
                final_dmg = int(raw_dmg * 100 / (100 + defense))
                target_hp = max(0, target_hp - final_dmg)
                log = f"{icon} <b>{caster['name']}</b> lanza <i>{skill_name}</i> gastando {mana_cost} MP e inflige <font color='#ef4444'>{final_dmg}</font> de daño mágico."
            elif skill_heal > 0:
                heal_val = int(skill_heal + (caster['mag'] * 1.2))
                caster_hp = caster_hp + heal_val
                log = f"{icon} <b>{caster['name']}</b> usa <i>{skill_name}</i> gastando {mana_cost} MP y se cura <font color='#10b981'>{heal_val}</font> HP."
            else:
                log = f"{icon} <b>{caster['name']}</b> usa <i>{skill_name}</i> pero no tiene efecto."
        else:
            raw_dmg = caster['atk'] * random.uniform(0.9, 1.1)
            is_crit = random.random() < (caster['spd'] * 0.02)
            if is_crit:
                raw_dmg *= 1.5
                
            defense = target['lvl'] * 1.5
            final_dmg = int(raw_dmg * 100 / (100 + defense))
            target_hp = max(0, target_hp - final_dmg)
            
            crit_txt = " <font color='#fbbf24'><b>¡GOLPE CRÍTICO!</b></font>" if is_crit else ""
            log = f"{icon} <b>{caster['name']}</b> ataca e inflige <font color='#f87171'>{final_dmg}</font> de daño físico.{crit_txt}"
            
        return log, target_hp, caster_mp

    def _run_balance_benchmark(self):
        p1 = self._calculate_player_stats()
        p2 = self._calculate_opponent_stats()
        
        self.combat_log.clear()
        self.combat_log.append(f"📊 <b>INICIANDO BENCHMARK DE BALANCE (100 Simulaciones)</b>")
        self.combat_log.append(f"🔵 Jugador: {p1['name']} (Nivel {p1['lvl']})")
        self.combat_log.append(f"🔴 Oponente: {p2['name']} (Nivel {p2['lvl']})")
        self.combat_log.append("Simulando combates en segundo plano...")
        
        import random
        p1_wins = 0
        p2_wins = 0
        draws = 0
        total_rounds = 0
        
        for _ in range(100):
            hp1, mp1 = p1['hp'], p1['mp']
            hp2, mp2 = p2['hp'], p2['mp']
            gauge1 = 0
            gauge2 = 0
            rounds = 0
            max_rounds = 150
            
            while hp1 > 0 and hp2 > 0 and rounds < max_rounds:
                rounds += 1
                gauge1 += p1['spd']
                gauge2 += p2['spd']
                if gauge1 >= 100 or gauge2 >= 100:
                    if gauge1 >= gauge2:
                        gauge1 -= 100
                        cast_skill = False
                        skill_dmg = 0
                        mana_cost = 0
                        if self.skills and mp1 > 5 and random.random() < 0.4:
                            affordable = [s for s in self.skills if s[4] <= mp1]
                            if affordable:
                                sk = random.choice(affordable)
                                mana_cost = sk[4]
                                skill_dmg = sk[5] or 0
                                cast_skill = True
                        if cast_skill:
                            mp1 -= mana_cost
                            if skill_dmg > 0:
                                raw_dmg = skill_dmg + (p1['mag'] * 1.5)
                                defense = p2['lvl'] * 1.2
                                final_dmg = int(raw_dmg * 100 / (100 + defense))
                                hp2 = max(0, hp2 - final_dmg)
                        else:
                            raw_dmg = p1['atk'] * random.uniform(0.9, 1.1)
                            if random.random() < (p1['spd'] * 0.02): raw_dmg *= 1.5
                            defense = p2['lvl'] * 1.5
                            final_dmg = int(raw_dmg * 100 / (100 + defense))
                            hp2 = max(0, hp2 - final_dmg)
                    else:
                        gauge2 -= 100
                        cast_skill = False
                        skill_dmg = 0
                        mana_cost = 0
                        if self.skills and mp2 > 5 and random.random() < 0.4:
                            affordable = [s for s in self.skills if s[4] <= mp2]
                            if affordable:
                                sk = random.choice(affordable)
                                mana_cost = sk[4]
                                skill_dmg = sk[5] or 0
                                cast_skill = True
                        if cast_skill:
                            mp2 -= mana_cost
                            if skill_dmg > 0:
                                raw_dmg = skill_dmg + (p2['mag'] * 1.5)
                                defense = p1['lvl'] * 1.2
                                final_dmg = int(raw_dmg * 100 / (100 + defense))
                                hp1 = max(0, hp1 - final_dmg)
                        else:
                            raw_dmg = p2['atk'] * random.uniform(0.9, 1.1)
                            if random.random() < (p2['spd'] * 0.02): raw_dmg *= 1.5
                            defense = p1['lvl'] * 1.5
                            final_dmg = int(raw_dmg * 100 / (100 + defense))
                            hp1 = max(0, hp1 - final_dmg)
                            
            total_rounds += rounds
            if hp1 <= 0 and hp2 <= 0:
                draws += 1
            elif hp1 <= 0:
                p2_wins += 1
            elif hp2 <= 0:
                p1_wins += 1
            else:
                draws += 1
                
        self.combat_log.append("=" * 60)
        self.combat_log.append("📊 <b>RESULTADOS DEL INFORME DE BALANCE</b>")
        self.combat_log.append(f"🔵 Victorias de Jugador: <b>{p1_wins}%</b>")
        self.combat_log.append(f"🔴 Oponente: <b>{p2_wins}%</b>")
        self.combat_log.append(f"⚪ Empates/Caídas Mutuas: <b>{draws}%</b>")
        self.combat_log.append(f"⏳ Rondas promedio por batalla: <b>{total_rounds / 100:.1f}</b>")
        self.combat_log.append("-" * 60)
        
        if p1_wins > 80:
            sug = "⚠️ <b>Recomendación de Balance:</b> El Jugador tiene una ventaja aplastante (Win Rate > 80%). Se sugiere reducir sus multiplicadores de clase o aumentar la peligrosidad de la criatura."
        elif p2_wins > 80:
            sug = "⚠️ <b>Recomendación de Balance:</b> El Oponente es excesivamente fuerte (Win Rate > 80%). Se sugiere aumentar la resistencia o velocidad del Jugador, o disminuir el escalado de atributos del Enemigo."
        else:
            sug = "✅ <b>Recomendación de Balance:</b> El encuentro está equilibrado. ¡La distribución de combate es óptima!"
        self.combat_log.append(sug)

    def _build_rules_tab(self):
        tab = QWidget()
        lay = QVBoxLayout(tab)
        lay.setContentsMargins(12, 12, 12, 12)
        lay.setSpacing(10)
        
        lbl_info = QLabel("⚙️ <b>CONFIGURACIÓN DE REGLAS Y FÓRMULAS DE JUEGO</b>")
        lbl_info.setStyleSheet("color: #818cf8; font-size: 12px; font-weight: bold;")
        lay.addWidget(lbl_info)
        
        lbl_desc = QLabel("Personaliza las ecuaciones matemáticas que calculan las estadísticas derivadas. Puedes usar las variables base e identificadores personalizados.")
        lbl_desc.setWordWrap(True)
        lbl_desc.setStyleSheet("color: #64748b; font-size: 11px;")
        lay.addWidget(lbl_desc)
        
        form = QFormLayout()
        form.setSpacing(8)
        
        self.edit_formula_hp = QLineEdit(self.game_rules["formula_hp"])
        self.edit_formula_mp = QLineEdit(self.game_rules["formula_mp"])
        self.edit_formula_atk = QLineEdit(self.game_rules["formula_atk"])
        self.edit_formula_mag = QLineEdit(self.game_rules["formula_mag"])
        self.edit_formula_spd = QLineEdit(self.game_rules["formula_spd"])
        
        form.addRow("Vida Máxima (HP):", self.edit_formula_hp)
        form.addRow("Maná Máximo (MP):", self.edit_formula_mp)
        form.addRow("Daño de Ataque Físico:", self.edit_formula_atk)
        form.addRow("Poder de Hechizo Mágico:", self.edit_formula_mag)
        form.addRow("Velocidad de Combate:", self.edit_formula_spd)
        
        lay.addLayout(form)
        
        # Custom attributes list
        lbl_custom = QLabel("<b>Atributos Personalizados:</b>")
        lbl_custom.setStyleSheet("color: #e2e8f0; margin-top: 10px;")
        lay.addWidget(lbl_custom)
        
        self.rules_custom_list = QListWidget()
        self.rules_custom_list.setFixedHeight(100)
        self.rules_custom_list.setStyleSheet("QListWidget { background-color: #0d0f17; border: 1px solid rgba(255,255,255,0.04); border-radius: 6px; color: #cbd5e1; }")
        lay.addWidget(self.rules_custom_list)
        
        row_custom_btns = QHBoxLayout()
        btn_add_attr = QPushButton("➕ Añadir Atributo")
        btn_add_attr.clicked.connect(self._add_custom_attribute)
        btn_del_attr = QPushButton("➖ Eliminar Atributo")
        btn_del_attr.clicked.connect(self._delete_custom_attribute)
        row_custom_btns.addWidget(btn_add_attr)
        row_custom_btns.addWidget(btn_del_attr)
        lay.addLayout(row_custom_btns)
        
        row_btns = QHBoxLayout()
        btn_reset_rules = QPushButton("🔄 Predeterminados")
        btn_reset_rules.clicked.connect(self._reset_game_rules)
        btn_reset_rules.setFixedHeight(30)
        
        btn_save_rules = QPushButton("💾 Guardar Ecuaciones")
        btn_save_rules.setObjectName("btn_add_row")
        btn_save_rules.clicked.connect(self._save_game_rules_to_db)
        btn_save_rules.setFixedHeight(30)
        
        row_btns.addWidget(btn_reset_rules)
        row_btns.addWidget(btn_save_rules)
        lay.addLayout(row_btns)
        
        lay.addStretch()
        self.tabs.addTab(tab, "⚙️ Reglas y Fórmulas")

    def _get_custom_attributes_list(self):
        attrs_str = self.game_rules.get("custom_attributes", "").strip()
        if not attrs_str:
            return []
        return [a.strip() for a in attrs_str.split(",") if a.strip()]

    def _update_rules_custom_list(self):
        self.rules_custom_list.clear()
        custom_keys = self._get_custom_attributes_list()
        for k in custom_keys:
            name = self.game_rules.get(f"attr_{k}_name", k.upper())
            item = QListWidgetItem(f"{name} ({k})")
            item.setData(Qt.ItemDataRole.UserRole, k)
            self.rules_custom_list.addItem(item)

    def _update_custom_attributes_ui(self):
        if hasattr(self, "custom_spinbox_rows"):
            for label_w, spin_w in self.custom_spinbox_rows:
                self.char_form_layout.removeRow(label_w)
                label_w.deleteLater()
                spin_w.deleteLater()
        self.custom_spinbox_rows = []
        self.custom_spinboxes = {}
        
        from PyQt6.QtWidgets import QSpinBox
        custom_attrs = self._get_custom_attributes_list()
        for attr in custom_attrs:
            display_name = self.game_rules.get(f"attr_{attr}_name", attr.upper())
            spin = QSpinBox()
            spin.setRange(10, 999)
            spin.setValue(10)
            spin.valueChanged.connect(self._recalculate_simulation)
            
            label_widget = QLabel(f"{display_name} Base:")
            self.char_form_layout.addRow(label_widget, spin)
            self.custom_spinbox_rows.append((label_widget, spin))
            self.custom_spinboxes[attr] = spin

    def _add_custom_attribute(self):
        key, ok1 = QInputDialog.getText(self, "Nuevo Atributo", "Ingresa el identificador corto (letras minúsculas, ej: 'lck', 'fth'):")
        if not ok1 or not key.strip():
            return
        key = key.strip().lower()
        if not key.isalpha():
            QMessageBox.warning(self, "Error", "El identificador debe contener únicamente letras.")
            return
        if key in ["str", "agi", "int", "vit"]:
            QMessageBox.warning(self, "Error", "Este identificador ya está reservado por el sistema base.")
            return
            
        current_keys = self._get_custom_attributes_list()
        if key in current_keys:
            QMessageBox.warning(self, "Error", "Este atributo ya existe.")
            return
            
        name, ok2 = QInputDialog.getText(self, "Nombre del Atributo", f"Ingresa el nombre visible para '{key.upper()}' (ej: 'Suerte (LCK)'):")
        if not ok2 or not name.strip():
            name = key.upper()
            
        current_keys.append(key)
        self.game_rules["custom_attributes"] = ",".join(current_keys)
        self.game_rules[f"attr_{key}_name"] = name.strip()
        
        self._save_custom_attributes_to_db()
        self._update_rules_custom_list()
        self._update_custom_attributes_ui()
        self._recalculate_simulation()
        
    def _delete_custom_attribute(self):
        selected = self.rules_custom_list.currentItem()
        if not selected:
            QMessageBox.warning(self, "Seleccionar", "Por favor, selecciona un atributo para eliminar.")
            return
        key = selected.data(Qt.ItemDataRole.UserRole)
        
        reply = QMessageBox.question(self, "Confirmar Eliminación", 
                                     f"¿Estás seguro de que deseas eliminar el atributo '{key.upper()}'? Las fórmulas que lo utilicen podrían fallar.",
                                     QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No)
        if reply == QMessageBox.StandardButton.Yes:
            current_keys = self._get_custom_attributes_list()
            if key in current_keys:
                current_keys.remove(key)
            self.game_rules["custom_attributes"] = ",".join(current_keys)
            self.game_rules.pop(f"attr_{key}_name", None)
            
            self._save_custom_attributes_to_db()
            self._update_rules_custom_list()
            self._update_custom_attributes_ui()
            self._recalculate_simulation()
            
    def _save_custom_attributes_to_db(self):
        try:
            conn = sqlite3.connect(self.db_path)
            c = conn.cursor()
            c.execute(f"INSERT OR REPLACE INTO \"p_{self.planet_id}_game_rules\" (clave, valor) VALUES (?, ?)", 
                      ("custom_attributes", self.game_rules.get("custom_attributes", "")))
            for k, v in self.game_rules.items():
                if k.startswith("attr_"):
                    c.execute(f"INSERT OR REPLACE INTO \"p_{self.planet_id}_game_rules\" (clave, valor) VALUES (?, ?)", (k, v))
            current_keys = self._get_custom_attributes_list()
            c.execute(f"SELECT clave FROM \"p_{self.planet_id}_game_rules\" WHERE clave LIKE 'attr_%_name'")
            existing_names = [r[0] for r in c.fetchall()]
            for name_key in existing_names:
                attr_key = name_key[5:-5]
                if attr_key not in current_keys:
                    c.execute(f"DELETE FROM \"p_{self.planet_id}_game_rules\" WHERE clave=?", (name_key,))
            conn.commit()
            conn.close()
        except Exception as e:
            print("Error saving custom attributes:", e)

    # ── GESTOR DE MISIONES Y CAMPAÑAS ──
    def _build_quests_tab(self):
        tab = QWidget()
        lay = QHBoxLayout(tab)
        lay.setContentsMargins(10, 10, 10, 10)
        lay.setSpacing(14)
        
        left = QWidget()
        left.setFixedWidth(280)
        left_lay = QVBoxLayout(left)
        left_lay.setContentsMargins(0, 0, 0, 0)
        left_lay.setSpacing(8)
        
        lbl_q = QLabel("LISTA DE MISIONES:")
        lbl_q.setStyleSheet("color: #64748b; font-size: 10px; font-weight: 700;")
        left_lay.addWidget(lbl_q)
        
        self.quest_search = QLineEdit()
        self.quest_search.setPlaceholderText("🔍 Filtrar misiones...")
        self.quest_search.textChanged.connect(self._filter_quests)
        left_lay.addWidget(self.quest_search)
        
        self.quest_list_widget = QListWidget()
        self.quest_list_widget.setStyleSheet("QListWidget { background-color: #0d0f17; border: 1px solid rgba(255,255,255,0.04); border-radius: 8px; color: #cbd5e1; }")
        self.quest_list_widget.currentItemChanged.connect(self._on_quest_selected)
        left_lay.addWidget(self.quest_list_widget)
        
        row_btns = QHBoxLayout()
        btn_new_q = QPushButton("➕ Nueva")
        btn_new_q.clicked.connect(self._new_quest)
        btn_del_q = QPushButton("❌ Eliminar")
        btn_del_q.clicked.connect(self._delete_quest)
        row_btns.addWidget(btn_new_q)
        row_btns.addWidget(btn_del_q)
        left_lay.addLayout(row_btns)
        
        lay.addWidget(left, stretch=1)
        
        right = QWidget()
        right_lay = QVBoxLayout(right)
        right_lay.setContentsMargins(0, 0, 0, 0)
        right_lay.setSpacing(10)
        
        lbl_ed = QLabel("EDITOR DE MISIÓN / CAMPAÑA:")
        lbl_ed.setStyleSheet("color: #64748b; font-size: 10px; font-weight: 700;")
        right_lay.addWidget(lbl_ed)
        
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setStyleSheet("QScrollArea { border: none; background: transparent; }")
        scroll_w = QWidget()
        scroll_lay = QVBoxLayout(scroll_w)
        scroll_lay.setContentsMargins(0, 0, 0, 0)
        scroll_lay.setSpacing(8)
        
        form = QFormLayout()
        form.setSpacing(6)
        
        self.q_edit_name = QLineEdit()
        form.addRow("Nombre de Misión:", self.q_edit_name)
        
        self.q_edit_lvl = QSpinBox()
        self.q_edit_lvl.setRange(1, 100)
        form.addRow("Nivel Recomendado:", self.q_edit_lvl)
        
        self.q_edit_diff = QComboBox()
        self.q_edit_diff.addItems(["Común", "Inusual", "Rara", "Épica", "Legendaria", "Absoluta", "Única"])
        form.addRow("Dificultad:", self.q_edit_diff)
        
        self.q_edit_giver = QComboBox()
        self.q_edit_giver.addItem("— Sin Dador (Taberna / Rumor) —", 0)
        self.q_edit_target = QComboBox()
        self.q_edit_target.addItem("— Sin Objetivo Específico —", "")
        
        self.q_edit_desc = QPlainTextEdit()
        self.q_edit_desc.setFixedHeight(60)
        self.q_edit_desc.setPlaceholderText("Describe la trama de esta aventura...")
        form.addRow("Resumen/Lore:", self.q_edit_desc)
        
        self.q_edit_objectives = QPlainTextEdit()
        self.q_edit_objectives.setFixedHeight(60)
        self.q_edit_objectives.setPlaceholderText("Ingresa los objetivos (uno por línea)...")
        form.addRow("Objetivos:", self.q_edit_objectives)
        
        self.q_edit_rewards = QLineEdit()
        self.q_edit_rewards.setPlaceholderText("Ej: 1500 Oro, Espada Mítica, +100 EXP")
        form.addRow("Recompensas:", self.q_edit_rewards)
        
        self.q_edit_status = QComboBox()
        self.q_edit_status.addItems(["Disponible", "Activa", "Completada", "Fallida"])
        form.addRow("Estado:", self.q_edit_status)
        
        scroll_lay.addLayout(form)
        
        row_act = QHBoxLayout()
        btn_save_q = QPushButton("💾 Guardar Misión")
        btn_save_q.setObjectName("btn_add_row")
        btn_save_q.clicked.connect(self._save_quest)
        
        btn_simulate_q = QPushButton("🎭 Narrar Aventura (Simular)")
        btn_simulate_q.clicked.connect(self._simulate_quest_run)
        
        row_act.addWidget(btn_save_q)
        row_act.addWidget(btn_simulate_q)
        scroll_lay.addLayout(row_act)
        
        self.q_log = QPlainTextEdit()
        self.q_log.setReadOnly(True)
        self.q_log.setFixedHeight(120)
        self.q_log.setStyleSheet("QPlainTextEdit { background-color: #020617; border: 1px solid rgba(255,255,255,0.03); border-radius: 8px; color: #a5b4fc; font-family: Consolas, monospace; font-size: 11px; }")
        scroll_lay.addWidget(QLabel("REGISTRO NARRATIVO DE LA CAMPAÑA:"))
        scroll_lay.addWidget(self.q_log)
        
        scroll.setWidget(scroll_w)
        right_lay.addWidget(scroll)
        
        lay.addWidget(right, stretch=2)
        self.tabs.addTab(tab, "📜 Misiones")
        self._load_quest_combos_data()

    def _load_quest_combos_data(self):
        try:
            self.q_edit_giver.clear()
            self.q_edit_giver.addItem("— Sin Dador (Taberna / Rumor) —", 0)
            self.q_edit_target.clear()
            self.q_edit_target.addItem("— Sin Objetivo Específico —", "")
            
            conn = sqlite3.connect(self.db_path)
            c = conn.cursor()
            
            try:
                c.execute(f"SELECT id, Nombre, Ocupación FROM p_{self.planet_id}_npcs ORDER BY Nombre")
                for npc_id, nombre, ocup in c.fetchall():
                    self.q_edit_giver.addItem(f"{nombre} ({ocup or 'NPC'})", npc_id)
            except Exception as e:
                print("Error loading NPCs in quest:", e)
                
            try:
                c.execute(f"SELECT id, \"Nombre Común\" FROM p_{self.planet_id}_criaturas ORDER BY \"Nombre Común\"")
                for c_id, name in c.fetchall():
                    self.q_edit_target.addItem(f"[Criatura] {name}", f"criaturas:{c_id}")
            except Exception as e:
                print("Error loading creatures in quest:", e)
            try:
                c.execute(f"SELECT id, Nombre_Completo FROM p_{self.planet_id}_ciudades ORDER BY Nombre_Completo")
                for c_id, name in c.fetchall():
                    self.q_edit_target.addItem(f"[Ciudad] {name}", f"ciudades:{c_id}")
            except Exception as e:
                print("Error loading cities in quest:", e)
            try:
                c.execute(f"SELECT id, Nombre FROM p_{self.planet_id}_facciones ORDER BY Nombre")
                for f_id, name in c.fetchall():
                    self.q_edit_target.addItem(f"[Facción] {name}", f"facciones:{f_id}")
            except Exception as e:
                print("Error loading factions in quest:", e)
                
            conn.close()
        except Exception as e:
            print("Error loading quest combo data:", e)

    def _load_quests_list(self):
        self.quest_list_widget.clear()
        try:
            conn = sqlite3.connect(self.db_path)
            c = conn.cursor()
            c.execute(f"SELECT id, nombre, estado FROM p_{self.planet_id}_quests ORDER BY id DESC")
            for q_id, name, status in c.fetchall():
                status_icon = "🟢" if status == "Completada" else "🔵" if status == "Activa" else "🔴" if status == "Fallida" else "⚪"
                item = QListWidgetItem(f"{status_icon} {name}")
                item.setData(Qt.ItemDataRole.UserRole, q_id)
                self.quest_list_widget.addItem(item)
            conn.close()
        except Exception as e:
            print("Error loading quests list:", e)

    def _on_quest_selected(self, current_item):
        if not current_item:
            self._clear_quest_editor()
            return
        q_id = current_item.data(Qt.ItemDataRole.UserRole)
        try:
            conn = sqlite3.connect(self.db_path)
            c = conn.cursor()
            c.execute(f"SELECT nombre, resumen, nivel_recomendado, dificultad, dador_id, destino_id, objetivos, recompensas, estado FROM p_{self.planet_id}_quests WHERE id=?", (q_id,))
            res = c.fetchone()
            conn.close()
            if res:
                nombre, resumen, lvl, diff, dador, dest, objs, rewards, status = res
                self.q_edit_name.setText(nombre)
                self.q_edit_lvl.setValue(lvl)
                
                idx_diff = self.q_edit_diff.findText(diff)
                if idx_diff != -1: self.q_edit_diff.setCurrentIndex(idx_diff)
                
                idx_giver = self.q_edit_giver.findData(dador)
                if idx_giver != -1: self.q_edit_giver.setCurrentIndex(idx_giver)
                
                idx_dest = self.q_edit_target.findData(dest)
                if idx_dest != -1: self.q_edit_target.setCurrentIndex(idx_dest)
                
                self.q_edit_desc.setPlainText(resumen)
                self.q_edit_objectives.setPlainText(objs)
                self.q_edit_rewards.setText(rewards)
                
                idx_status = self.q_edit_status.findText(status)
                if idx_status != -1: self.q_edit_status.setCurrentIndex(idx_status)
        except Exception as e:
            print("Error selecting quest:", e)

    def _new_quest(self):
        self._clear_quest_editor()
        self.quest_list_widget.clearSelection()
        self.q_edit_name.setFocus()

    def _save_quest(self):
        selected = self.quest_list_widget.currentItem()
        q_id = selected.data(Qt.ItemDataRole.UserRole) if selected else None
        
        name = self.q_edit_name.text().strip()
        if not name:
            QMessageBox.warning(self, "Error", "El nombre de la misión es obligatorio.")
            return
            
        resumen = self.q_edit_desc.toPlainText().strip()
        lvl = self.q_edit_lvl.value()
        diff = self.q_edit_diff.currentText()
        dador = self.q_edit_giver.currentData()
        dest = self.q_edit_target.currentData()
        objs = self.q_edit_objectives.toPlainText().strip()
        rewards = self.q_edit_rewards.text().strip()
        status = self.q_edit_status.currentText()
        
        try:
            conn = sqlite3.connect(self.db_path)
            c = conn.cursor()
            if q_id:
                c.execute(f"UPDATE p_{self.planet_id}_quests SET nombre=?, resumen=?, nivel_recomendado=?, dificultad=?, dador_id=?, destino_id=?, objetivos=?, recompensas=?, estado=? WHERE id=?", 
                          (name, resumen, lvl, diff, dador, dest, objs, rewards, status, q_id))
            else:
                c.execute(f"INSERT INTO p_{self.planet_id}_quests (nombre, resumen, nivel_recomendado, dificultad, dador_id, destino_id, objetivos, recompensas, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", 
                          (name, resumen, lvl, diff, dador, dest, objs, rewards, status))
            conn.commit()
            conn.close()
            self._load_quests_list()
            QMessageBox.information(self, "Misión Guardada", "La misión se ha guardado en la base de datos con éxito.")
        except Exception as e:
            QMessageBox.warning(self, "Error", f"No se pudo guardar la misión: {e}")

    def _delete_quest(self):
        selected = self.quest_list_widget.currentItem()
        if not selected:
            return
        q_id = selected.data(Qt.ItemDataRole.UserRole)
        reply = QMessageBox.question(self, "Confirmar", "¿Seguro que deseas eliminar esta misión?", QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No)
        if reply == QMessageBox.StandardButton.Yes:
            try:
                conn = sqlite3.connect(self.db_path)
                c = conn.cursor()
                c.execute(f"DELETE FROM p_{self.planet_id}_quests WHERE id=?", (q_id,))
                conn.commit()
                conn.close()
                self._load_quests_list()
                self._clear_quest_editor()
            except Exception as e:
                QMessageBox.warning(self, "Error", f"No se pudo eliminar: {e}")

    def _simulate_quest_run(self):
        name = self.q_edit_name.text().strip()
        if not name:
            return
        objs = [o.strip() for o in self.q_edit_objectives.toPlainText().split('\n') if o.strip()]
        rewards = self.q_edit_rewards.text().strip()
        giver_name = self.q_edit_giver.currentText()
        target_name = self.q_edit_target.currentText()
        
        self.q_log.clear()
        self.q_log.appendPlainText(f"[SISTEMA] Iniciando simulación de aventura: '{name}'")
        self.q_log.appendPlainText(f"[NARRACIÓN] Aceptas la encomienda de {giver_name}.")
        
        if objs:
            for i, obj in enumerate(objs):
                self.q_log.appendPlainText(f"[AVANCE] Completando Objetivo {i+1}: {obj}...")
        else:
            self.q_log.appendPlainText("[AVANCE] Viajas por las tierras resolviendo misterios...")
            
        if target_name and "Sin" not in target_name:
            self.q_log.appendPlainText(f"[NARRACIÓN] Llegas a interactuar con: {target_name}.")
            
        self.q_log.appendPlainText(f"[ÉXITO] Misión completada con éxito. Reclamas las recompensas: {rewards if rewards else 'Ninguna'}")
        
        self.q_edit_status.setCurrentIndex(2) # Completada
        self._save_quest()

    def _clear_quest_editor(self):
        self.q_edit_name.clear()
        self.q_edit_lvl.setValue(1)
        self.q_edit_diff.setCurrentIndex(0)
        self.q_edit_giver.setCurrentIndex(0)
        self.q_edit_target.setCurrentIndex(0)
        self.q_edit_desc.clear()
        self.q_edit_objectives.clear()
        self.q_edit_rewards.clear()
        self.q_edit_status.setCurrentIndex(0)
        self.q_log.clear()

    def _filter_quests(self):
        text = self.quest_search.text().lower().strip()
        for i in range(self.quest_list_widget.count()):
            item = self.quest_list_widget.item(i)
            item.setHidden(text not in item.text().lower())


    def _save_game_rules_to_db(self):
        self.game_rules["formula_hp"] = self.edit_formula_hp.text().strip()
        self.game_rules["formula_mp"] = self.edit_formula_mp.text().strip()
        self.game_rules["formula_atk"] = self.edit_formula_atk.text().strip()
        self.game_rules["formula_mag"] = self.edit_formula_mag.text().strip()
        self.game_rules["formula_spd"] = self.edit_formula_spd.text().strip()
        
        try:
            self._evaluate_custom_formulas(10, 10, 10, 10)
        except Exception as e:
            QMessageBox.critical(self, "Error de Ecuación", f"Una de las ecuaciones tiene errores de sintaxis:\n{e}")
            return
            
        try:
            conn = sqlite3.connect(self.db_path)
            c = conn.cursor()
            for k, v in self.game_rules.items():
                c.execute(f"INSERT OR REPLACE INTO \"p_{self.planet_id}_game_rules\" (clave, valor) VALUES (?, ?)", (k, v))
            conn.commit()
            conn.close()
            QMessageBox.information(self, "Reglas Guardadas", "Las reglas del juego se han actualizado y aplicado con éxito.")
            self._recalculate_simulation()
            self._recalculate_combat_opponent()
        except Exception as e:
            QMessageBox.warning(self, "Error", f"No se pudo guardar en la BD: {e}")
            
    def _reset_game_rules(self):
        defaults = {
            "formula_hp": "vit * 12",
            "formula_mp": "int * 10",
            "formula_atk": "str * 2 + agi * 0.5",
            "formula_mag": "int * 2.5",
            "formula_spd": "agi * 0.8"
        }
        self.edit_formula_hp.setText(defaults["formula_hp"])
        self.edit_formula_mp.setText(defaults["formula_mp"])
        self.edit_formula_atk.setText(defaults["formula_atk"])
        self.edit_formula_mag.setText(defaults["formula_mag"])
        self.edit_formula_spd.setText(defaults["formula_spd"])
        self._save_game_rules_to_db()


# ──────────────────────────────────────────────
# RELACIONES DE LORE: DIÁLOGOS Y GRAFOS
# ──────────────────────────────────────────────

class AddRelationshipDialog(QDialog):
    def __init__(self, parent, planet_id, db_path, source_table, source_id, source_name):
        super().__init__(parent)
        self.planet_id = planet_id
        self.db_path = db_path
        self.source_table = source_table
        self.source_id = source_id
        self.source_name = source_name
        self.setWindowTitle("🔗 Crear Nuevo Vínculo de Lore")
        self.resize(500, 420)
        self.categories_map = {}
        self._load_categories()
        self._build_ui()

    def _load_categories(self):
        try:
            conn = sqlite3.connect(self.db_path)
            c = conn.cursor()
            c.execute("SELECT name, table_name FROM categories WHERE planet_id = ?", (self.planet_id,))
            for cat_name, table_name in c.fetchall():
                if "relaciones" not in table_name and "game_rules" not in table_name:
                    self.categories_map[cat_name] = table_name
            conn.close()
        except Exception as e:
            print("Error loading categories in dialog:", e)

    def _build_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(16, 16, 16, 16)
        layout.setSpacing(12)

        lbl_title = QLabel(f"Vincular: <b>{self.source_name}</b> con...")
        lbl_title.setStyleSheet("font-size: 13px; color: #818cf8;")
        lbl_title.setWordWrap(True)
        layout.addWidget(lbl_title)

        form = QFormLayout()
        form.setSpacing(8)

        self.target_cat_combo = QComboBox()
        self.target_cat_combo.addItems(sorted(self.categories_map.keys()))
        self.target_cat_combo.currentIndexChanged.connect(self.on_category_changed)
        form.addRow("Categoría Destino:", self.target_cat_combo)

        search_widget = QWidget()
        search_lay = QHBoxLayout(search_widget)
        search_lay.setContentsMargins(0,0,0,0)
        search_lay.setSpacing(4)
        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText("Filtrar registros...")
        self.search_input.returnPressed.connect(self.perform_search)
        btn_search = QPushButton("🔍 Buscar")
        btn_search.clicked.connect(self.perform_search)
        search_lay.addWidget(self.search_input)
        search_lay.addWidget(btn_search)
        form.addRow("Buscar Entidad:", search_widget)

        self.target_list = QListWidget()
        self.target_list.setFixedHeight(120)
        self.target_list.setStyleSheet("QListWidget { background-color: #0d0f17; border: 1px solid rgba(255,255,255,0.04); border-radius: 6px; color: #cbd5e1; }")
        form.addRow("Seleccionar Registro:", self.target_list)

        self.rel_type_combo = QComboBox()
        self.rel_type_combo.setEditable(True)
        self.rel_type_combo.addItems(["Miembro de", "Líder de", "Sede de", "Aliado", "Enemigo", "Creado por", "Hábitat de", "Origen de", "Dueño de", "Vinculado a"])
        form.addRow("Tipo de Relación:", self.rel_type_combo)

        self.txt_desc = QPlainTextEdit()
        self.txt_desc.setMaximumHeight(80)
        self.txt_desc.setPlaceholderText("Descripción o detalles del vínculo...")
        form.addRow("Descripción:", self.txt_desc)

        layout.addLayout(form)

        row_btns = QHBoxLayout()
        btn_ok = QPushButton("Guardar Vínculo")
        btn_ok.setObjectName("btn_add_row")
        btn_ok.clicked.connect(self.save_relation)
        btn_cancel = QPushButton("Cancelar")
        btn_cancel.clicked.connect(self.reject)
        row_btns.addStretch()
        row_btns.addWidget(btn_cancel)
        row_btns.addWidget(btn_ok)
        layout.addLayout(row_btns)

        self.on_category_changed()

    def on_category_changed(self):
        self.search_input.clear()
        self.target_list.clear()
        self.perform_search()

    def perform_search(self):
        query = self.search_input.text().strip()
        cat_name = self.target_cat_combo.currentText()
        if not cat_name or cat_name not in self.categories_map: return
        table_name = self.categories_map[cat_name]
        
        self.target_list.clear()
        try:
            conn = sqlite3.connect(self.db_path)
            c = conn.cursor()
            
            c.execute(f'PRAGMA table_info("{table_name}")')
            cols = [col[1] for col in c.fetchall()]
            name_col = next((col for col in ["Nombre", "Nombre_Completo", "Nombre Común", "Nombre de Clase", "Raza Base", "Especialidad", "Concepto", "Nombre_Corto"] if col in cols), "id")
            
            if not query:
                c.execute(f'SELECT id, "{name_col}" FROM "{table_name}" LIMIT 30')
            else:
                c.execute(f'SELECT id, "{name_col}" FROM "{table_name}" WHERE "{name_col}" LIKE ? LIMIT 50', (f"%{query}%",))
                
            for rid, rname in c.fetchall():
                item = QListWidgetItem(str(rname) if rname else f"ID {rid}")
                item.setData(Qt.ItemDataRole.UserRole, (rid, rname, table_name, cat_name))
                self.target_list.addItem(item)
            conn.close()
        except Exception as e:
            print("Error loading target records in dialog:", e)

    def save_relation(self):
        current_item = self.target_list.currentItem()
        if not current_item:
            QMessageBox.warning(self, "Aviso", "Selecciona una entidad de destino.")
            return
            
        target_id, target_name, target_table, target_cat = current_item.data(Qt.ItemDataRole.UserRole)
        rel_type = self.rel_type_combo.currentText().strip()
        desc = self.txt_desc.toPlainText().strip()
        
        if not rel_type:
            QMessageBox.warning(self, "Aviso", "Indica el tipo de relación.")
            return
            
        try:
            conn = sqlite3.connect(self.db_path)
            c = conn.cursor()
            c.execute(f"""
                INSERT INTO "p_{self.planet_id}_relaciones" 
                (origen_tabla, origen_id, destino_tabla, destino_id, tipo_relacion, descripcion)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (self.source_table, self.source_id, target_table, target_id, rel_type, desc))
            conn.commit()
            conn.close()
            self.accept()
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Fallo al guardar la relación: {e}")


class RelationshipGraphWidget(QWidget):
    def __init__(self, parent, dialog):
        super().__init__(parent)
        self.dialog = dialog
        self.setMinimumSize(500, 450)
        self.setMouseTracking(True)
        self.node_rects = []
        self.central_rect = None
        self.hovered_node = None

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        
        w = self.width()
        h = self.height()
        cx = w // 2
        cy = h // 2
        
        painter.setBrush(QBrush(QColor("#08090d")))
        painter.setPen(Qt.PenStyle.NoPen)
        painter.drawRect(0, 0, w, h)
        
        rels = self.dialog.relationships
        center_name = self.dialog.entity_name
        
        n = len(rels)
        import math
        radius = 160
        
        painter.setFont(QFont("Inter", 8))
        for i, (rel_id, target_id, target_tbl, target_name, target_cat, r_type, is_outgoing) in enumerate(rels):
            angle = i * (2 * math.pi / n) if n > 0 else 0
            tx = int(cx + radius * math.cos(angle))
            ty = int(cy + radius * math.sin(angle))
            
            color = QColor("#6366f1") if is_outgoing else QColor("#10b981")
            pen = QPen(color, 1.5, Qt.PenStyle.DashLine if not is_outgoing else Qt.PenStyle.SolidLine)
            painter.setPen(pen)
            painter.drawLine(cx, cy, tx, ty)
            
            mx = (cx + tx) // 2
            my = (cy + ty) // 2
            
            painter.setBrush(QBrush(QColor("#0d0f17")))
            painter.setPen(QPen(QColor("rgba(255,255,255,0.06)"), 1))
            
            label_text = f" {r_type} "
            lbl_rect = painter.fontMetrics().boundingRect(label_text)
            lbl_rect.moveCenter(QPoint(mx, my))
            painter.drawRoundedRect(lbl_rect.adjusted(-4, -2, 4, 2), 4, 4)
            
            painter.setPen(QPen(QColor("#94a3b8")))
            painter.drawText(lbl_rect, Qt.AlignmentFlag.AlignCenter, label_text)
            
        central_color = QColor("#818cf8")
        painter.setBrush(QBrush(QColor("#1e1b4b")))
        pen_central = QPen(central_color, 2)
        painter.setPen(pen_central)
        
        central_radius = 50
        self.central_rect = QRect(cx - central_radius, cy - central_radius, central_radius * 2, central_radius * 2)
        painter.drawEllipse(self.central_rect)
        
        painter.setPen(QPen(QColor("#ffffff")))
        painter.setFont(QFont("Inter", 9, QFont.Weight.Bold))
        metrics = painter.fontMetrics()
        elided_center = metrics.elidedText(center_name, Qt.TextElideMode.ElideRight, central_radius * 2 - 12)
        painter.drawText(self.central_rect, Qt.AlignmentFlag.AlignCenter | Qt.TextFlag.TextWordWrap, elided_center)
        
        self.node_rects = []
        painter.setFont(QFont("Inter", 8))
        for i, (rel_id, target_id, target_tbl, target_name, target_cat, r_type, is_outgoing) in enumerate(rels):
            angle = i * (2 * math.pi / n)
            tx = int(cx + radius * math.cos(angle))
            ty = int(cy + radius * math.sin(angle))
            
            r_outer = 40
            rect = QRect(tx - r_outer, ty - r_outer, r_outer * 2, r_outer * 2)
            self.node_rects.append((target_id, rect, target_tbl, target_name, target_cat))
            
            border_color = QColor("#6366f1") if is_outgoing else QColor("#10b981")
            bg_color = QColor("#0d0f17")
            
            if self.hovered_node == target_id:
                bg_color = QColor("#1e293b")
                border_color = border_color.lighter(130)
                
            painter.setBrush(QBrush(bg_color))
            painter.setPen(QPen(border_color, 1.5))
            painter.drawEllipse(rect)
            
            painter.setPen(QPen(QColor("#64748b")))
            painter.setFont(QFont("Inter", 7, QFont.Weight.Bold))
            painter.drawText(QRect(tx - r_outer, ty - r_outer + 8, r_outer * 2, 12), Qt.AlignmentFlag.AlignCenter, f"[{target_cat.upper()}]")
            
            painter.setPen(QPen(QColor("#cbd5e1")))
            painter.setFont(QFont("Inter", 8))
            elided_name = painter.fontMetrics().elidedText(target_name, Qt.TextElideMode.ElideRight, r_outer * 2 - 10)
            painter.drawText(QRect(tx - r_outer + 5, ty - r_outer + 20, r_outer * 2 - 10, r_outer * 2 - 28), Qt.AlignmentFlag.AlignCenter | Qt.TextFlag.TextWordWrap, elided_name)

    def mousePressEvent(self, event):
        pos = event.position()
        for target_id, rect, target_tbl, target_name, target_cat in self.node_rects:
            dx = pos.x() - rect.center().x()
            dy = pos.y() - rect.center().y()
            if dx*dx + dy*dy <= rect.width()*rect.width()/4:
                self.dialog.recenter_on(target_tbl, target_id, target_name, target_cat)
                break

    def mouseMoveEvent(self, event):
        pos = event.position()
        old_hover = self.hovered_node
        self.hovered_node = None
        for target_id, rect, _, _, _ in self.node_rects:
            dx = pos.x() - rect.center().x()
            dy = pos.y() - rect.center().y()
            if dx*dx + dy*dy <= rect.width()*rect.width()/4:
                self.hovered_node = target_id
                self.setCursor(Qt.CursorShape.PointingHandCursor)
                break
        if not self.hovered_node:
            self.setCursor(Qt.CursorShape.ArrowCursor)
            
        if old_hover != self.hovered_node:
            self.update()


class RelationshipGraphDialog(QDialog):
    def __init__(self, parent, planet_id, db_path, table_name, entity_id, entity_name, cat_name):
        super().__init__(parent)
        self.parent_mw = parent
        self.planet_id = planet_id
        self.db_path = db_path
        self.table_name = table_name
        self.entity_id = entity_id
        self.entity_name = entity_name
        self.cat_name = cat_name
        
        self.relationships = []
        self.history = []
        
        self.setWindowTitle(f"🕸️ Red de Relaciones: {self.entity_name}")
        self.resize(750, 500)
        self._load_relationships()
        self._build_ui()

    def _load_relationships(self):
        self.relationships = []
        try:
            conn = sqlite3.connect(self.db_path)
            c = conn.cursor()
            
            c.execute(f"""
                SELECT id, origen_tabla, origen_id, destino_tabla, destino_id, tipo_relacion
                FROM "p_{self.planet_id}_relaciones"
                WHERE (origen_tabla = ? AND origen_id = ?) OR (destino_tabla = ? AND destino_id = ?)
            """, (self.table_name, self.entity_id, self.table_name, self.entity_id))
            
            rows = c.fetchall()
            for r_id, orig_tbl, orig_id, dest_tbl, dest_id, r_type in rows:
                is_outgoing = (orig_tbl == self.table_name and orig_id == self.entity_id)
                target_tbl = dest_tbl if is_outgoing else orig_tbl
                target_id = dest_id if is_outgoing else orig_id
                
                c.execute("SELECT name FROM categories WHERE planet_id = ? AND table_name = ?", (self.planet_id, target_tbl))
                cat_row = c.fetchone()
                target_cat = cat_row[0] if cat_row else target_tbl
                
                target_name = f"ID {target_id}"
                try:
                    c.execute(f'PRAGMA table_info("{target_tbl}")')
                    cols = [col[1] for col in c.fetchall()]
                    name_col = next((col for col in ["Nombre", "Nombre_Completo", "Nombre Común", "Nombre de Clase", "Raza Base", "Especialidad", "Concepto", "Nombre_Corto"] if col in cols), None)
                    if name_col:
                        c.execute(f'SELECT "{name_col}" FROM "{target_tbl}" WHERE id = ?', (target_id,))
                        name_row = c.fetchone()
                        if name_row and name_row[0]:
                            target_name = name_row[0]
                except Exception as ex:
                    print("Error getting target name in graph:", ex)
                    
                self.relationships.append((r_id, target_id, target_tbl, target_name, target_cat, r_type, is_outgoing))
            conn.close()
        except Exception as e:
            print("Error loading relationships for graph:", e)

    def _build_ui(self):
        main_lay = QHBoxLayout(self)
        main_lay.setContentsMargins(12, 12, 12, 12)
        main_lay.setSpacing(10)
        
        left = QWidget()
        left.setFixedWidth(200)
        left_lay = QVBoxLayout(left)
        left_lay.setContentsMargins(0, 0, 0, 0)
        left_lay.setSpacing(8)
        
        self.lbl_entity = QLabel(f"Entidad:<br/><b>{self.entity_name}</b>")
        self.lbl_entity.setWordWrap(True)
        self.lbl_entity.setStyleSheet("color: #818cf8; font-size: 11px;")
        left_lay.addWidget(self.lbl_entity)
        
        self.lbl_cat = QLabel(f"Categoría: {self.cat_name}")
        self.lbl_cat.setStyleSheet("color: #64748b; font-size: 10px;")
        left_lay.addWidget(self.lbl_cat)
        
        sep = QFrame(); sep.setFrameShape(QFrame.Shape.HLine); sep.setObjectName("separator")
        left_lay.addWidget(sep)
        
        lbl_list = QLabel("ENLACES DIRECTOS:")
        lbl_list.setStyleSheet("color: #64748b; font-size: 10px; font-weight: bold;")
        left_lay.addWidget(lbl_list)
        
        self.list_view = QListWidget()
        self.list_view.setStyleSheet("QListWidget { background-color: #0d0f17; border: 1px solid rgba(255,255,255,0.04); border-radius: 6px; color: #cbd5e1; font-size: 11px; }")
        self.list_view.itemDoubleClicked.connect(self.on_list_item_double_clicked)
        left_lay.addWidget(self.list_view)
        
        self.btn_back = QPushButton("⬅️ Atrás")
        self.btn_back.clicked.connect(self.go_back)
        self.btn_back.setEnabled(False)
        left_lay.addWidget(self.btn_back)
        
        self.btn_go_to = QPushButton("🚀 Ir a Entidad")
        self.btn_go_to.setObjectName("btn_add_row")
        self.btn_go_to.clicked.connect(self.jump_to_entity)
        left_lay.addWidget(self.btn_go_to)
        
        main_lay.addWidget(left)
        
        self.graph_widget = RelationshipGraphWidget(self, self)
        main_lay.addWidget(self.graph_widget, stretch=1)
        
        self._populate_sidebar()

    def _populate_sidebar(self):
        self.list_view.clear()
        for r_id, target_id, target_tbl, target_name, target_cat, r_type, is_outgoing in self.relationships:
            arrow = "→" if is_outgoing else "←"
            item = QListWidgetItem(f"{arrow} [{target_cat}] {target_name}")
            item.setData(Qt.ItemDataRole.UserRole, (target_id, target_tbl, target_name, target_cat))
            self.list_view.addItem(item)
            
    def recenter_on(self, table_name, entity_id, entity_name, cat_name):
        self.history.append((self.table_name, self.entity_id, self.entity_name, self.cat_name))
        self.btn_back.setEnabled(True)
        
        self.table_name = table_name
        self.entity_id = entity_id
        self.entity_name = entity_name
        self.cat_name = cat_name
        
        self.setWindowTitle(f"🕸️ Red de Relaciones: {self.entity_name}")
        self.lbl_entity.setText(f"Entidad:<br/><b>{self.entity_name}</b>")
        self.lbl_cat.setText(f"Categoría: {self.cat_name}")
        
        self._load_relationships()
        self._populate_sidebar()
        self.graph_widget.update()

    def go_back(self):
        if not self.history: return
        tbl, eid, name, cat = self.history.pop()
        
        self.table_name = tbl
        self.entity_id = eid
        self.entity_name = name
        self.cat_name = cat
        
        self.setWindowTitle(f"🕸️ Red de Relaciones: {self.entity_name}")
        self.lbl_entity.setText(f"Entidad:<br/><b>{self.entity_name}</b>")
        self.lbl_cat.setText(f"Categoría: {self.cat_name}")
        
        self._load_relationships()
        self._populate_sidebar()
        self.btn_back.setEnabled(len(self.history) > 0)
        self.graph_widget.update()

    def on_list_item_double_clicked(self, item):
        data = item.data(Qt.ItemDataRole.UserRole)
        if data:
            target_id, target_tbl, target_name, target_cat = data
            self.recenter_on(target_tbl, target_id, target_name, target_cat)

    def jump_to_entity(self):
        self.parent_mw.select_entity(self.cat_name, self.entity_id)
        self.accept()


# ──────────────────────────────────────────────
# CARTOGRAFÍA E INTERACTIVIDAD DE MAPAS (MEJORA 1000%)
# ──────────────────────────────────────────────
from PyQt6.QtGui import QPainterPath, QPen

def parse_wikilinks(text, planet_id, db_path):
    if not text:
        return ""
    import re
    
    def replace_link(match):
        content = match.group(1).strip()
        if ":" in content:
            parts = content.split(":", 1)
            cat_name = parts[0].strip()
            ent_name = parts[1].strip()
        else:
            cat_name = None
            ent_name = content
            
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        resolved_cat = None
        resolved_id = None
        tbl = None
        
        if cat_name:
            cursor.execute("SELECT name, table_name FROM categories WHERE planet_id=? AND name LIKE ?", (planet_id, f"%{cat_name}%"))
            cat_res = cursor.fetchone()
            if cat_res:
                resolved_cat = cat_res[0]
                tbl = cat_res[1]
                cursor.execute(f"PRAGMA table_info(\"{tbl}\")")
                cols = [r[1] for r in cursor.fetchall()]
                name_col = next((c for c in ["Nombre", "Nombre_Completo", "Nombre Común", "Nombre de Clase", "Especialidad", "Raza Base", "Raza"] if c in cols), None)
                if not name_col:
                    name_col = cols[1] if len(cols) > 1 else "id"
                cursor.execute(f"SELECT id FROM \"{tbl}\" WHERE \"{name_col}\" = ?", (ent_name,))
                ent_res = cursor.fetchone()
                if ent_res:
                    resolved_id = ent_res[0]
        else:
            cursor.execute("SELECT name, table_name FROM categories WHERE planet_id=?", (planet_id,))
            cats = cursor.fetchall()
            for c_name, t_name in cats:
                try:
                    cursor.execute(f"PRAGMA table_info(\"{t_name}\")")
                    cols = [r[1] for r in cursor.fetchall()]
                    name_col = next((c for c in ["Nombre", "Nombre_Completo", "Nombre Común", "Nombre de Clase", "Especialidad", "Raza Base", "Raza"] if c in cols), None)
                    if not name_col:
                        name_col = cols[1] if len(cols) > 1 else "id"
                    cursor.execute(f"SELECT id FROM \"{t_name}\" WHERE \"{name_col}\" = ?", (ent_name,))
                    ent_res = cursor.fetchone()
                    if ent_res:
                        resolved_cat = c_name
                        resolved_id = ent_res[0]
                        tbl = t_name
                        break
                except:
                    pass
                    
        tooltip = ""
        if resolved_cat and resolved_id and tbl:
            cursor.execute(f"PRAGMA table_info(\"{tbl}\")")
            cols = [r[1] for r in cursor.fetchall()]
            desc_col = next((c for c in ["Descripción", "Descripción Funcional", "Resumen", "Secretos", "Notas"] if c in cols), None)
            if desc_col:
                try:
                    cursor.execute(f"SELECT \"{desc_col}\" FROM \"{tbl}\" WHERE id=?", (resolved_id,))
                    desc_res = cursor.fetchone()
                    if desc_res and desc_res[0]:
                        text_val = str(desc_res[0])
                        tooltip = text_val[:120] + "..." if len(text_val) > 120 else text_val
                        tooltip = tooltip.replace('"', '&quot;').replace('<', '&lt;').replace('>', '&gt;')
                except:
                    pass
        conn.close()
        
        if resolved_cat and resolved_id:
            tooltip_attr = f' title="{tooltip}"' if tooltip else ""
            return f'<a href="wikilink://{resolved_cat}/{resolved_id}"{tooltip_attr} style="color: #818cf8; text-decoration: underline; font-weight: bold;">{content}</a>'
        else:
            return f'<span style="color: #ef4444; text-decoration: line-through;" title="Entidad no encontrada en la base de datos">{content}</span>'
            
    return re.sub(r'\[\[(.*?)\]\]', replace_link, text)


class WorldForgeThread(QThread):
    progress = pyqtSignal(int, str)
    finished_sig = pyqtSignal(bool, str)
    
    def __init__(self, planet_id, db_path, continent_name, num_nations, num_cities, num_npcs):
        super().__init__()
        self.planet_id = planet_id
        self.db_path = db_path
        self.continent_name = continent_name if continent_name else "Continente Desconocido"
        self.num_nations = num_nations
        self.num_cities = num_cities
        self.num_npcs = num_npcs
        
    def run(self):
        import random
        from utils_generators import generate_character_name, generate_location_name, generate_npc_traits
        
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("BEGIN TRANSACTION")
            
            self.progress.emit(10, "Forjando Continente y Geografía...")
            cont_table = f"p_{self.planet_id}_continentes"
            cursor.execute(f"INSERT INTO \"{cont_table}\" (Nombre, Tipo, Supercontinente, Estado) VALUES (?, ?, ?, ?)",
                           (self.continent_name, "Principal", "Ninguno", "Activo"))
            cont_id = cursor.lastrowid
            
            nations = []
            nat_table = f"p_{self.planet_id}_naciones"
            for i in range(self.num_nations):
                nat_name = f"Reino de {generate_location_name()}"
                govs = ["Monarquía", "República Arcana", "Teocracia", "Consejo de Ancianos", "Oligarquía Comercial"]
                gov = random.choice(govs)
                cursor.execute(f"INSERT INTO \"{nat_table}\" (Nombre, Sistema_Gobierno, Continente) VALUES (?, ?, ?)",
                               (nat_name, gov, self.continent_name))
                nat_id = cursor.lastrowid
                nations.append((nat_id, nat_name))
                
            cities = []
            city_table = f"p_{self.planet_id}_ciudades"
            prov_table = f"p_{self.planet_id}_provincias"
            
            total_cities = self.num_nations * self.num_cities
            city_idx = 0
            
            for nat_id, nat_name in nations:
                prov_name = f"Provincia del Este de {nat_name}"
                cursor.execute(f"INSERT INTO \"{prov_table}\" (Nombre_Completo, Nombre_Corto, Tipo_Division, Nacion) VALUES (?, ?, ?, ?)",
                               (prov_name, "Este", "Provincia", nat_name))
                prov_id = cursor.lastrowid
                
                for j in range(self.num_cities):
                    city_idx += 1
                    pct = 10 + int((city_idx / total_cities) * 30)
                    self.progress.emit(pct, f"Forjando Ciudades ({city_idx}/{total_cities})...")
                    
                    c_name = f"Ciudad de {generate_location_name()}"
                    c_types = ["Metrópolis", "Fortaleza", "Puerto Comercial", "Santuario Místico"]
                    c_type = random.choice(c_types)
                    is_capital = "Sí" if j == 0 else "No"
                    
                    cursor.execute(f"INSERT INTO \"{city_table}\" (Nombre_Completo, Nombre_Corto, Tipo_Ciudad, Es_Capital_Provincial, Provincia, Nacion) VALUES (?, ?, ?, ?, ?, ?)",
                                   (c_name, c_name, c_type, is_capital, prov_name, nat_name))
                    c_id = cursor.lastrowid
                    cities.append((c_id, c_name, nat_name))
                    
            npcs = []
            npc_table = f"p_{self.planet_id}_npcs"
            races = ["Humano", "Alto Elfo", "Enano de las Montañas", "Semiorco", "Gnomo de Cristal", "Tiefling de las Sombras"]
            occupations = ["Gobernador", "Gran Mago", "Herrero Rúnico", "Gran Inquisidor", "Capitán de la Guardia", "Comerciante de Especias", "Tabernero", "Explorador de Ruinas"]
            alignments = ["Legal Bueno", "Neutral Bueno", "Caótico Bueno", "Legal Neutral", "Neutral", "Caótico Neutral", "Legal Malo", "Neutral Malo", "Caótico Malo"]
            
            total_npcs = len(cities) * self.num_npcs
            npc_idx = 0
            
            for c_id, c_name, nat_name in cities:
                for k in range(self.num_npcs):
                    npc_idx += 1
                    pct = 40 + int((npc_idx / total_npcs) * 30)
                    self.progress.emit(pct, f"Poblando de NPCs ({npc_idx}/{total_npcs})...")
                    
                    is_ruler = (k == 0 and "Metrópolis" in c_name) or (k == 0 and random.random() > 0.5)
                    job = "Gobernador" if is_ruler else random.choice(occupations)
                    name = generate_character_name(include_title=True)
                    race = random.choice(races)
                    align = random.choice(alignments)
                    traits = generate_npc_traits()
                    
                    cursor.execute(f"INSERT INTO \"{npc_table}\" (Nombre, Raza, Ocupación, Secretos, Alineación) VALUES (?, ?, ?, ?, ?)",
                                   (name, race, job, traits, align))
                    n_id = cursor.lastrowid
                    npcs.append((n_id, name, c_id, c_name, job))
                    
            self.progress.emit(75, "Forjando Facciones y Gremios...")
            fac_table = f"p_{self.planet_id}_facciones"
            factions = []
            fac_types = [
                ("Gremio de Magos Celestiales", "Neutral Bueno", "Ficción arcana de eruditos"),
                ("La Garra Roja", "Caótico Neutral", "Organización de mercenarios y contrabandistas"),
                ("La Orden del Alba Férrea", "Legal Bueno", "Caballeros paladines protectores de los desvalidos"),
                ("Consorcio de Comercio de Aerlan", "Neutral", "Mercaderes que controlan las rutas de caravanas")
            ]
            for name_base, align, desc in fac_types:
                leader_id, leader_name, l_city_id, l_city_name, _ = random.choice(npcs)
                hq_id, hq_name, _ = random.choice(cities)
                fac_name = f"{name_base} de {self.continent_name}"
                
                cursor.execute(f"INSERT INTO \"{fac_table}\" (Nombre, Alineación, Líder, Sede, Descripción) VALUES (?, ?, ?, ?, ?)",
                               (fac_name, align, leader_name, hq_name, desc))
                fac_id = cursor.lastrowid
                factions.append((fac_id, fac_name, leader_id, leader_name, hq_id, hq_name))
                
            self.progress.emit(80, "Invocando Mitos y Panteones...")
            mitos_table = f"p_{self.planet_id}_mitos"
            mitos = [
                ("Sol Invictus de Aerlan", "Luz y Justicia", "Culto de los templos de piedra dorada", f"Se dice que protege a los viajeros del continente {self.continent_name}."),
                ("El Durmiente del Abismo", "Sombras y Secretos", "Culto oculto en las profundidades de los océanos", "Una deidad ancestral que espera el alineamiento de las estrellas.")
            ]
            for m_name, dom, culto, m_desc in mitos:
                cursor.execute(f"INSERT INTO \"{mitos_table}\" (Nombre, Dominio, Culto, Descripción) VALUES (?, ?, ?, ?)",
                               (m_name, dom, culto, m_desc))
                               
            self.progress.emit(85, "Forjando Reliquias de Poder...")
            rel_table = f"p_{self.planet_id}_reliquias"
            reliquias = []
            rel_types = [
                ("Cáliz de Ceniza", "Permite curar cualquier veneno al verter agua bendita", 4),
                ("Hoja Rúnica de Tyr", "Una espada tallada en mithril que brilla cerca de enemigos", 7),
                ("Ojo del Caos", "Una gema carmesí que revela caminos ocultos en las ruinas", 9)
            ]
            for r_name, pwr, danger in rel_types:
                creator_id, creator_name, c_city_id, c_city_name, _ = random.choice(npcs)
                hq_id, hq_name, _ = random.choice(cities)
                
                cursor.execute(f"INSERT INTO \"{rel_table}\" (Nombre, Poder, Creador, \"Ubicación Actual\", Peligrosidad) VALUES (?, ?, ?, ?, ?)",
                               (r_name, pwr, creator_name, hq_name, danger))
                r_id = cursor.lastrowid
                reliquias.append((r_id, r_name, creator_id, creator_name, hq_id, hq_name))
                
            self.progress.emit(90, "Registrando Crónicas Históricas...")
            events_table = f"p_{self.planet_id}_eventos"
            events = [
                ("Año 1 DE", "El Gran Tratado de Paz", f"Tratado fundacional que delimitó las fronteras del Continente {self.continent_name}.", "Político", 5),
                ("Año 342 DE", "La Invasión de las Sombras", f"Una legión de criaturas asoló la metrópolis de {random.choice(cities)[1]}.", "Militar", 8)
            ]
            for epoch, ev_name, ev_desc, ev_type, imp in events:
                cursor.execute(f"INSERT INTO \"{events_table}\" (Año_Época, \"Nombre del Evento\", Descripción, Tipo, Importancia) VALUES (?, ?, ?, ?, ?)",
                               (epoch, ev_name, ev_desc, ev_type, imp))
                               
            self.progress.emit(95, "Conectando Hilos de Relaciones...")
            relaciones_table = f"p_{self.planet_id}_relaciones"
            
            for c_id, c_name, nat_name in cities:
                nat_id = next((n[0] for n in nations if n[1] == nat_name), 0)
                cursor.execute(f"INSERT INTO \"{relaciones_table}\" (origen_tabla, origen_id, destino_tabla, destino_id, tipo_relacion, descripcion) VALUES (?, ?, ?, ?, ?, ?)",
                               ("Ciudades", c_id, "Naciones", nat_id, "Ubicado en", f"La ciudad es parte del territorio de {nat_name}."))
                               
            for n_id, name, c_id, c_name, job in npcs:
                cursor.execute(f"INSERT INTO \"{relaciones_table}\" (origen_tabla, origen_id, destino_tabla, destino_id, tipo_relacion, descripcion) VALUES (?, ?, ?, ?, ?, ?)",
                               ("NPCs Notables", n_id, "Ciudades", c_id, "Reside en", f"Este personaje reside en la {c_name}."))
                if job == "Gobernador":
                    cursor.execute(f"INSERT INTO \"{relaciones_table}\" (origen_tabla, origen_id, destino_tabla, destino_id, tipo_relacion, descripcion) VALUES (?, ?, ?, ?, ?, ?)",
                                   ("NPCs Notables", n_id, "Ciudades", c_id, "Gobernante de", f"Es el líder político encargado de {c_name}."))
                                   
            for fac_id, fac_name, leader_id, leader_name, hq_id, hq_name in factions:
                cursor.execute(f"INSERT INTO \"{relaciones_table}\" (origen_tabla, origen_id, destino_tabla, destino_id, tipo_relacion, descripcion) VALUES (?, ?, ?, ?, ?, ?)",
                               ("Facciones", fac_id, "Ciudades", hq_id, "Sede en", f"El gremio opera principalmente en {hq_name}."))
                cursor.execute(f"INSERT INTO \"{relaciones_table}\" (origen_tabla, origen_id, destino_tabla, destino_id, tipo_relacion, descripcion) VALUES (?, ?, ?, ?, ?, ?)",
                               ("Facciones", fac_id, "NPCs Notables", leader_id, "Liderado por", f"{leader_name} ostenta la autoridad suprema del gremio."))
                cursor.execute(f"INSERT INTO \"{relaciones_table}\" (origen_tabla, origen_id, destino_tabla, destino_id, tipo_relacion, descripcion) VALUES (?, ?, ?, ?, ?, ?)",
                               ("NPCs Notables", leader_id, "Facciones", fac_id, "Líder de", f"Lidera formalmente a {fac_name}."))
                               
            for r_id, r_name, creator_id, creator_name, hq_id, hq_name in reliquias:
                cursor.execute(f"INSERT INTO \"{relaciones_table}\" (origen_tabla, origen_id, destino_tabla, destino_id, tipo_relacion, descripcion) VALUES (?, ?, ?, ?, ?, ?)",
                               ("Artefactos y Reliquias", r_id, "NPCs Notables", creator_id, "Creado por", f"Reliquia forjada por las manos de {creator_name}."))
                cursor.execute(f"INSERT INTO \"{relaciones_table}\" (origen_tabla, origen_id, destino_tabla, destino_id, tipo_relacion, descripcion) VALUES (?, ?, ?, ?, ?, ?)",
                               ("Artefactos y Reliquias", r_id, "Ciudades", hq_id, "Ubicado en", f"Se rumorea que el artefacto descansa en {hq_name}."))
            
            cursor.execute("COMMIT")
            conn.close()
            
            self.progress.emit(98, "Reconstruyendo índice de búsqueda...")
            database.build_fts_index(self.planet_id, self.db_path)
            
            self.progress.emit(100, "¡Lore Forjado con éxito!")
            self.finished_sig.emit(True, f"Se ha forjado un nuevo continente '{self.continent_name}' con {self.num_nations} naciones, {total_cities} ciudades y {total_npcs} personajes notables completamente interconectados.")
            
        except Exception as e:
            try:
                cursor.execute("ROLLBACK")
                conn.close()
            except:
                pass
            self.finished_sig.emit(False, str(e))


class AddPinDialog(QDialog):
    def __init__(self, parent, planet_id, db_path):
        super().__init__(parent)
        self.planet_id = planet_id
        self.db_path = db_path
        self.setWindowTitle("📍 Añadir Pin de Mapa")
        self.resize(400, 420)
        self.selected_row_id = None
        self.selected_table = None
        self.selected_name = ""
        
        self._build_ui()
        self._load_categories()
        
    def _build_ui(self):
        lay = QVBoxLayout(self)
        lay.setSpacing(10)
        
        form = QFormLayout()
        self.cat_combo = QComboBox()
        self.cat_combo.currentIndexChanged.connect(self._on_category_changed)
        form.addRow("Categoría:", self.cat_combo)
        
        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText("🔍 Escribe para buscar registro...")
        self.search_input.textChanged.connect(self._search_entities)
        form.addRow("Buscar:", self.search_input)
        lay.addLayout(form)
        
        self.results_list = QListWidget()
        self.results_list.currentItemChanged.connect(self._on_result_selected)
        lay.addWidget(self.results_list)
        
        form2 = QFormLayout()
        self.label_input = QLineEdit()
        form2.addRow("Etiqueta Pin:", self.label_input)
        
        self.color_combo = QComboBox()
        self.color_combo.addItems(["Azul", "Rojo", "Verde", "Amarillo", "Púrpura", "Naranja", "Blanco"])
        form2.addRow("Color del Pin:", self.color_combo)
        lay.addLayout(form2)
        
        row = QHBoxLayout()
        btn_ok = QPushButton("Aceptar")
        btn_ok.clicked.connect(self.accept)
        btn_cancel = QPushButton("Cancelar")
        btn_cancel.clicked.connect(self.reject)
        row.addWidget(btn_ok)
        row.addWidget(btn_cancel)
        lay.addLayout(row)
        
    def _load_categories(self):
        try:
            conn = sqlite3.connect(self.db_path)
            c = conn.cursor()
            c.execute("SELECT name, table_name FROM categories WHERE planet_id = ?", (self.planet_id,))
            for cat_name, table_name in c.fetchall():
                if "relaciones" not in table_name and "game_rules" not in table_name and "map_pins" not in table_name and "quests" not in table_name:
                    self.cat_combo.addItem(cat_name, table_name)
            conn.close()
        except Exception as e:
            print("Error loading categories in Pin dialog:", e)
            
    def _on_category_changed(self):
        self.search_input.clear()
        self.results_list.clear()
        self.selected_row_id = None
        self.label_input.clear()
        
    def _search_entities(self):
        self.results_list.clear()
        self.selected_row_id = None
        
        text = self.search_input.text().strip()
        if not text:
            return
            
        table_name = self.cat_combo.currentData()
        if not table_name:
            return
            
        try:
            conn = sqlite3.connect(self.db_path)
            c = conn.cursor()
            c.execute(f"PRAGMA table_info(\"{table_name}\")")
            cols = [r[1] for r in c.fetchall()]
            
            name_col = next((col for col in ["Nombre", "Nombre_Completo", "Nombre Común", "Nombre de Clase", "Especialidad", "Raza Base", "Raza"] if col in cols), None)
            if not name_col:
                name_col = cols[1] if len(cols) > 1 else "id"
                
            c.execute(f"SELECT id, \"{name_col}\" FROM \"{table_name}\" WHERE \"{name_col}\" LIKE ? LIMIT 50", (f"%{text}%",))
            for r_id, r_name in c.fetchall():
                item = QListWidgetItem(str(r_name))
                item.setData(Qt.ItemDataRole.UserRole, r_id)
                self.results_list.addItem(item)
            conn.close()
        except Exception as e:
            print("Error searching entities:", e)
            
    def _on_result_selected(self, current_item):
        if not current_item:
            return
        self.selected_row_id = current_item.data(Qt.ItemDataRole.UserRole)
        self.selected_table = self.cat_combo.currentData()
        self.selected_name = current_item.text()
        self.label_input.setText(self.selected_name)
        
    def get_color_hex(self):
        colors = {
            "Azul": "#3b82f6",
            "Rojo": "#ef4444",
            "Verde": "#10b981",
            "Amarillo": "#f59e0b",
            "Púrpura": "#8b5cf6",
            "Naranja": "#f97316",
            "Blanco": "#ffffff"
        }
        return colors.get(self.color_combo.currentText(), "#3b82f6")


class MapGraphicsView(QGraphicsView):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.setRenderHint(QPainter.RenderHint.Antialiasing)
        self.setDragMode(QGraphicsView.DragMode.ScrollHandDrag)
        
    def wheelEvent(self, event):
        zoom_factor = 1.15
        if event.angleDelta().y() < 0:
            zoom_factor = 1.0 / zoom_factor
        self.scale(zoom_factor, zoom_factor)


class MapPinItem(QGraphicsItem):
    def __init__(self, pin_id, target_table, target_id, label, icon_type, color_str, x_pct, y_pct, dialog):
        super().__init__()
        self.pin_id = pin_id
        self.target_table = target_table
        self.target_id = target_id
        self.label = label
        self.icon_type = icon_type
        self.color = QColor(color_str)
        self.x_pct = x_pct
        self.y_pct = y_pct
        self.dialog = dialog
        
        self.setFlag(QGraphicsItem.GraphicsItemFlag.ItemIsMovable, True)
        self.setFlag(QGraphicsItem.GraphicsItemFlag.ItemIsSelectable, True)
        self.setFlag(QGraphicsItem.GraphicsItemFlag.ItemSendsGeometryChanges, True)
        self.setToolTip(f"<b>{label}</b><br/>Cat: {target_table}<br/>Arrastra para mover. Clic para seleccionar.")
        
    def boundingRect(self):
        return QRectF(-15, -30, 30, 45)
        
    def paint(self, painter, option, widget):
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        color = self.color
        if self.isSelected():
            color = QColor("#ec4899")
            
        painter.setBrush(color)
        painter.setPen(QPen(QColor(255, 255, 255, 200), 2))
        
        path = QPainterPath()
        path.moveTo(0, 0)
        path.cubicTo(-12, -12, -12, -26, 0, -26)
        path.cubicTo(12, -26, 12, -12, 0, 0)
        painter.drawPath(path)
        
        painter.setBrush(QColor(255, 255, 255))
        painter.setPen(Qt.PenStyle.NoPen)
        painter.drawEllipse(-3, -17, 6, 6)
        
        painter.setPen(QPen(QColor("#cbd5e1")))
        font = QFont("Inter", 8, QFont.Weight.Bold)
        painter.setFont(font)
        short_label = self.label
        if len(short_label) > 15:
            short_label = short_label[:12] + "..."
        fm = painter.fontMetrics()
        w = fm.horizontalAdvance(short_label)
        
        painter.setBrush(QColor(15, 23, 42, 220))
        painter.setPen(QPen(QColor(255, 255, 255, 20), 1))
        painter.drawRoundedRect(QRectF(-w/2 - 4, 3, w + 8, fm.height() + 2), 4, 4)
        
        painter.setPen(QColor("#ffffff"))
        painter.drawText(int(-w/2), 3 + fm.ascent() + 1, short_label)
        
    def mouseReleaseEvent(self, event):
        super().mouseReleaseEvent(event)
        self.dialog.update_pin_position(self)
        
    def mousePressEvent(self, event):
        super().mousePressEvent(event)
        if event.button() == Qt.MouseButton.LeftButton:
            self.dialog.on_pin_clicked(self)


class CartografiaDialog(QDialog):
    def __init__(self, parent, planet_id, db_path):
        super().__init__(parent)
        self.planet_id = planet_id
        self.db_path = db_path
        self.setWindowTitle("🗺️ Cartografía Planetaria - Mapa Interactivo")
        self.resize(1100, 720)
        self.map_path = ""
        self.show_grid = False
        self.background_item = None
        self.pin_items = []
        
        self._load_settings()
        self._build_ui()
        self.load_map_and_pins()
        
    def _load_settings(self):
        try:
            conn = sqlite3.connect(self.db_path)
            c = conn.cursor()
            c.execute(f"SELECT valor FROM \"p_{self.planet_id}_game_rules\" WHERE clave='map_image_path'")
            res = c.fetchone()
            if res: self.map_path = res[0]
            
            c.execute(f"SELECT valor FROM \"p_{self.planet_id}_game_rules\" WHERE clave='map_show_grid'")
            res_grid = c.fetchone()
            if res_grid: self.show_grid = (res_grid[0] == "1")
            conn.close()
        except Exception as e:
            print("Error loading map settings:", e)
            
    def _save_settings(self):
        try:
            conn = sqlite3.connect(self.db_path)
            c = conn.cursor()
            c.execute(f"INSERT OR REPLACE INTO \"p_{self.planet_id}_game_rules\" (clave, valor) VALUES ('map_image_path', ?)", (self.map_path,))
            c.execute(f"INSERT OR REPLACE INTO \"p_{self.planet_id}_game_rules\" (clave, valor) VALUES ('map_show_grid', ?)", ("1" if self.show_grid else "0",))
            conn.commit()
            conn.close()
        except Exception as e:
            print("Error saving map settings:", e)
            
    def _build_ui(self):
        main_lay = QHBoxLayout(self)
        main_lay.setContentsMargins(10, 10, 10, 10)
        main_lay.setSpacing(10)
        
        map_w = QWidget()
        map_lay = QVBoxLayout(map_w)
        map_lay.setContentsMargins(0, 0, 0, 0)
        
        self.scene = QGraphicsScene(self)
        
        def scene_double_click(event):
            self.on_scene_double_clicked(event.scenePos())
        self.scene.mouseDoubleClickEvent = scene_double_click
        
        self.view = MapGraphicsView(self.scene)
        self.view.setStyleSheet("QGraphicsView { background-color: #0b0f19; border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; }")
        map_lay.addWidget(self.view)
        
        main_lay.addWidget(map_w, stretch=3)
        
        right = QWidget()
        right.setFixedWidth(280)
        right_lay = QVBoxLayout(right)
        right_lay.setContentsMargins(0, 0, 0, 0)
        right_lay.setSpacing(10)
        
        lbl_title = QLabel("🗺️ MAPA INTERACTIVO")
        lbl_title.setStyleSheet("color: #818cf8; font-size: 13px; font-weight: bold;")
        right_lay.addWidget(lbl_title)
        
        self.btn_load_img = QPushButton("🖼️ Cargar Imagen de Mapa")
        self.btn_load_img.clicked.connect(self.load_custom_map_image)
        right_lay.addWidget(self.btn_load_img)
        
        self.grid_chk = QCheckBox("Mostrar Cuadrícula")
        self.grid_chk.setChecked(self.show_grid)
        self.grid_chk.stateChanged.connect(self.toggle_grid)
        right_lay.addWidget(self.grid_chk)
        
        sep = QFrame(); sep.setFrameShape(QFrame.Shape.HLine); sep.setObjectName("separator")
        right_lay.addWidget(sep)
        
        right_lay.addWidget(QLabel("LISTA DE PINES EN EL MAPA:"))
        self.pins_list = QListWidget()
        self.pins_list.setStyleSheet("QListWidget { background-color: #0d0f17; border: 1px solid rgba(255,255,255,0.04); border-radius: 8px; color: #cbd5e1; }")
        self.pins_list.itemDoubleClicked.connect(self.focus_pin_item)
        right_lay.addWidget(self.pins_list)
        
        self.btn_delete_pin = QPushButton("❌ Eliminar Pin Seleccionado")
        self.btn_delete_pin.clicked.connect(self.delete_selected_pin)
        right_lay.addWidget(self.btn_delete_pin)
        
        lbl_help = QLabel("💡 <i>Doble clic en el mapa para colocar un pin.<br/>Arrastra pines para moverlos.<br/>Pasa el cursor para ver resumen.</i>")
        lbl_help.setStyleSheet("color: #64748b; font-size: 10px;")
        lbl_help.setWordWrap(True)
        right_lay.addWidget(lbl_help)
        
        self.status_label = QLabel("Listo.")
        self.status_label.setStyleSheet("color: #94a3b8; font-size: 11px;")
        right_lay.addWidget(self.status_label)
        
        btn_close = QPushButton("Cerrar")
        btn_close.clicked.connect(self.accept)
        right_lay.addWidget(btn_close)
        
        main_lay.addWidget(right)
        
    def load_custom_map_image(self):
        fpath, _ = QFileDialog.getOpenFileName(self, "Seleccionar Mapa", "", "Imágenes (*.png *.jpg *.jpeg *.webp)")
        if fpath:
            copied_path = get_media_path(self.db_path, fpath)
            self.map_path = copied_path
            self._save_settings()
            self.load_map_and_pins()
            self.status_label.setText("Mapa personalizado cargado.")
            
    def toggle_grid(self, state):
        self.show_grid = (state == 2)
        self._save_settings()
        self.load_map_and_pins()
        
    def load_map_and_pins(self):
        self.scene.clear()
        self.background_item = None
        self.pin_items = []
        
        resolved = resolve_path(self.db_path, self.map_path)
        
        pixmap = QPixmap()
        if resolved and os.path.exists(resolved):
            pixmap.load(resolved)
            
        if pixmap.isNull():
            w, h = 1200, 800
            pixmap = QPixmap(w, h)
            pixmap.fill(QColor("#0d1117"))
            
            painter = QPainter(pixmap)
            painter.setRenderHint(QPainter.RenderHint.Antialiasing)
            
            painter.setPen(QPen(QColor(51, 65, 85, 80), 1))
            for x in range(0, w, 50):
                painter.drawLine(x, 0, x, h)
            for y in range(0, h, 50):
                painter.drawLine(0, y, w, y)
                
            painter.setPen(QPen(QColor("#6366f1"), 2))
            painter.drawEllipse(w - 120, 120, 80, 80)
            painter.drawLine(w - 80, 100, w - 80, 200)
            painter.drawLine(w - 120, 160, w - 40, 160)
            painter.drawText(w - 85, 95, "N")
            
            painter.setPen(QColor("#64748b"))
            painter.drawText(100, 100, "CUADRÍCULA CARTOGRÁFICA BASE")
            painter.drawText(100, 120, "Por favor, carga una imagen para tu mapa interactivo.")
            painter.end()
        else:
            if self.show_grid:
                temp_pix = pixmap.copy()
                painter = QPainter(temp_pix)
                painter.setPen(QPen(QColor(255, 255, 255, 50), 1))
                for x in range(0, temp_pix.width(), 80):
                    painter.drawLine(x, 0, x, temp_pix.height())
                for y in range(0, temp_pix.height(), 80):
                    painter.drawLine(0, y, temp_pix.width(), y)
                painter.end()
                pixmap = temp_pix
                
        self.background_item = self.scene.addPixmap(pixmap)
        self.scene.setSceneRect(0, 0, pixmap.width(), pixmap.height())
        
        self.load_pins_from_db(pixmap.width(), pixmap.height())
        self.load_pins_list()
        
    def load_pins_from_db(self, map_w, map_h):
        try:
            conn = sqlite3.connect(self.db_path)
            c = conn.cursor()
            c.execute(f"SELECT id, x, y, target_tabla, target_id, etiqueta, tipo_icono, color FROM p_{self.planet_id}_map_pins")
            pins = c.fetchall()
            conn.close()
            
            for pid, x_pct, y_pct, tbl, rid, tag, icon, color in pins:
                px = (x_pct / 100.0) * map_w
                py = (y_pct / 100.0) * map_h
                
                pin_item = MapPinItem(pid, tbl, rid, tag, icon, color, x_pct, y_pct, self)
                pin_item.setPos(px, py)
                self.scene.addItem(pin_item)
                self.pin_items.append(pin_item)
        except Exception as e:
            print("Error loading pins from DB:", e)
            
    def load_pins_list(self):
        self.pins_list.clear()
        for pin in self.pin_items:
            item = QListWidgetItem(f"📍 {pin.label} ({pin.target_table})")
            item.setData(Qt.ItemDataRole.UserRole, pin.pin_id)
            self.pins_list.addItem(item)
            
    def on_scene_double_clicked(self, pos):
        if not self.background_item:
            return
        bg_w = self.background_item.pixmap().width()
        bg_h = self.background_item.pixmap().height()
        if pos.x() < 0 or pos.x() > bg_w or pos.y() < 0 or pos.y() > bg_h:
            return
            
        dlg = AddPinDialog(self, self.planet_id, self.db_path)
        if dlg.exec() == QDialog.DialogCode.Accepted:
            if not dlg.selected_row_id:
                return
            label = dlg.label_input.text().strip()
            if not label:
                label = dlg.selected_name
                
            color = dlg.get_color_hex()
            x_pct = (pos.x() / bg_w) * 100
            y_pct = (pos.y() / bg_h) * 100
            
            try:
                conn = sqlite3.connect(self.db_path)
                c = conn.cursor()
                c.execute(f"""
                    INSERT INTO p_{self.planet_id}_map_pins (x, y, target_tabla, target_id, etiqueta, color)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (x_pct, y_pct, dlg.selected_table, dlg.selected_row_id, label, color))
                conn.commit()
                conn.close()
                self.load_map_and_pins()
                self.status_label.setText(f"Pin '{label}' colocado con éxito.")
            except Exception as e:
                QMessageBox.warning(self, "Error", f"No se pudo guardar el pin: {e}")
                
    def update_pin_position(self, pin_item):
        if not self.background_item:
            return
        bg_w = self.background_item.pixmap().width()
        bg_h = self.background_item.pixmap().height()
        if bg_w <= 0 or bg_h <= 0:
            return
            
        pos = pin_item.scenePos()
        x_pct = (pos.x() / bg_w) * 100
        y_pct = (pos.y() / bg_h) * 100
        x_pct = max(0.0, min(100.0, x_pct))
        y_pct = max(0.0, min(100.0, y_pct))
        
        try:
            conn = sqlite3.connect(self.db_path)
            c = conn.cursor()
            c.execute(f"UPDATE p_{self.planet_id}_map_pins SET x=?, y=? WHERE id=?", (x_pct, y_pct, pin_item.pin_id))
            conn.commit()
            conn.close()
            pin_item.x_pct = x_pct
            pin_item.y_pct = y_pct
            self.status_label.setText(f"Pin '{pin_item.label}' movido a {x_pct:.1f}%, {y_pct:.1f}%")
            self.load_pins_list()
        except Exception as e:
            print("Error updating pin position:", e)
            
    def on_pin_clicked(self, pin_item):
        if self.parent():
            self.parent().select_entity(pin_item.target_table, pin_item.target_id)
            self.status_label.setText(f"Mostrando '{pin_item.label}' en el panel principal.")
            
    def focus_pin_item(self, item):
        pin_id = item.data(Qt.ItemDataRole.UserRole)
        pin_item = next((p for p in self.pin_items if p.pin_id == pin_id), None)
        if pin_item:
            self.view.centerOn(pin_item)
            pin_item.setSelected(True)
            
    def delete_selected_pin(self):
        selected = self.pins_list.currentItem()
        if not selected:
            return
        pin_id = selected.data(Qt.ItemDataRole.UserRole)
        try:
            conn = sqlite3.connect(self.db_path)
            c = conn.cursor()
            c.execute(f"DELETE FROM p_{self.planet_id}_map_pins WHERE id=?", (pin_id,))
            conn.commit()
            conn.close()
            self.load_map_and_pins()
            self.status_label.setText("Pin eliminado del mapa.")
        except Exception as e:
            QMessageBox.warning(self, "Error", f"No se pudo eliminar el pin: {e}")


# ──────────────────────────────────────────────
# MAIN WINDOW
# ──────────────────────────────────────────────
class MainWindow(QMainWindow):
    def __init__(self, db_path="encyclopedia.db"):
        super().__init__()
        self.setWindowTitle("Enciclopedia Planetaria Universal 💎")
        self.resize(1380, 860)
        self.current_planet_id = None
        self.db = None
        self.db_path = db_path

        self.init_ui()
        self.setup_shortcuts()
        self.connect_db(self.db_path)
        self.load_planets()

    # ── UI INIT ──────────────────────────────────────────────
    def init_ui(self):
        self.central_widget = QWidget()
        self.setCentralWidget(self.central_widget)
        self.main_layout = QHBoxLayout(self.central_widget)
        self.main_layout.setContentsMargins(0, 0, 0, 0)
        self.main_layout.setSpacing(0)

        self.splitter = QSplitter(Qt.Orientation.Horizontal)
        self.main_layout.addWidget(self.splitter)

        # ── Sidebar ──────────────────────────────────────────
        self.sidebar_widget = QWidget()
        self.sidebar_widget.setObjectName("sidebar_widget")
        self.sidebar_widget.setMinimumWidth(210)
        self.sidebar_widget.setMaximumWidth(300)
        self.sidebar_widget.setObjectName("sidebar_widget")
        sb = QVBoxLayout(self.sidebar_widget)
        sb.setContentsMargins(8, 10, 8, 10)
        sb.setSpacing(6)

        # Título sidebar
        lbl_universe = QLabel("🪐  UNIVERSO")
        lbl_universe.setObjectName("section_title")
        sb.addWidget(lbl_universe)

        sep1 = QFrame(); sep1.setFrameShape(QFrame.Shape.HLine)
        sep1.setObjectName("separator")
        sb.addWidget(sep1)

        # Árbol de planetas
        self.planet_tree = QTreeWidget()
        self.planet_tree.setHeaderHidden(True)
        self.planet_tree.setAnimated(True)
        self.planet_tree.setIndentation(14)
        self.planet_tree.itemClicked.connect(self.on_tree_item_clicked)
        self.planet_tree.setContextMenuPolicy(Qt.ContextMenuPolicy.CustomContextMenu)
        self.planet_tree.customContextMenuRequested.connect(self.show_planet_context_menu)
        sb.addWidget(self.planet_tree, stretch=1)

        sep2 = QFrame(); sep2.setFrameShape(QFrame.Shape.HLine)
        sep2.setObjectName("separator")
        sb.addWidget(sep2)

        # Planeta activo badge
        self.planet_badge = QLabel("Sin planeta seleccionado")
        self.planet_badge.setObjectName("active_planet_badge")
        self.planet_badge.setWordWrap(True)
        self.planet_badge.setAlignment(Qt.AlignmentFlag.AlignCenter)
        sb.addWidget(self.planet_badge)

        # Botones Nuevo / Clonar
        row_btns = QHBoxLayout()
        row_btns.setSpacing(4)
        self.btn_new_planet = QPushButton("Nuevo Planeta")
        self.btn_new_planet.setObjectName("btn_new_planet")
        self.btn_new_planet.clicked.connect(self.new_planet)
        self.btn_clone_planet = QPushButton("Clonar Planeta")
        self.btn_clone_planet.setObjectName("btn_clone_planet")
        self.btn_clone_planet.clicked.connect(self.clone_planet)
        row_btns.addWidget(self.btn_new_planet)
        row_btns.addWidget(self.btn_clone_planet)
        sb.addLayout(row_btns)

        self.btn_export_db = QPushButton("Exportar Base de Datos")
        self.btn_export_db.clicked.connect(self.export_database)
        sb.addWidget(self.btn_export_db)

        self.btn_name_gen = QPushButton("Generador de Nombres")
        self.btn_name_gen.clicked.connect(self.show_name_generator)
        sb.addWidget(self.btn_name_gen)

        self.btn_global_search = QPushButton("Buscador Universal")
        self.btn_global_search.setObjectName("btn_global_search")
        self.btn_global_search.clicked.connect(self.show_global_search)
        sb.addWidget(self.btn_global_search)

        self.btn_schema_mgr = QPushButton("🧩 Gestor de Categorías")
        self.btn_schema_mgr.setObjectName("btn_schema_mgr")
        self.btn_schema_mgr.clicked.connect(self.show_schema_manager)
        self.btn_schema_mgr.setEnabled(False)
        sb.addWidget(self.btn_schema_mgr)

        sep3 = QFrame(); sep3.setFrameShape(QFrame.Shape.HLine)
        sep3.setObjectName("separator")
        sb.addWidget(sep3)

        # Tema
        lbl_theme = QLabel("🎨  TEMA VISUAL")
        lbl_theme.setObjectName("section_title")
        sb.addWidget(lbl_theme)
        self.theme_combo = QComboBox()
        self.theme_combo.addItems(["Clásico (Oscuro)", "Hollow Knight", "Warhammer 40k", "D&D"])
        self.theme_combo.currentTextChanged.connect(self.change_theme)
        sb.addWidget(self.theme_combo)

        self.splitter.addWidget(self.sidebar_widget)

        # ── Área de contenido ─────────────────────────────────
        self.content_widget = QWidget()
        self.content_layout = QVBoxLayout(self.content_widget)
        self.content_layout.setContentsMargins(16, 16, 16, 12)
        self.content_layout.setSpacing(12)

        # Barra superior (búsqueda + Modo Lore)
        self.header_layout = QHBoxLayout()
        self.search_bar = QLineEdit()
        self.search_bar.setPlaceholderText("🔍 Buscar en todo el Planeta...")
        self.search_bar.setEnabled(False)
        self.header_layout.addWidget(self.search_bar)
        # ⚡ Debounce: espera 300ms después del último teclazo antes de filtrar
        self._search_timer = QTimer(self)
        self._search_timer.setSingleShot(True)
        self._search_timer.setInterval(300)
        self._search_timer.timeout.connect(self._do_filter)
        self.search_bar.textChanged.connect(lambda _: self._search_timer.start())

        self.btn_lore_mode = QPushButton("Vista Lore")
        self.btn_lore_mode.clicked.connect(self.show_lore_mode)
        self.btn_lore_mode.setEnabled(False)
        self.btn_lore_mode.setFixedWidth(120)
        self.header_layout.addWidget(self.btn_lore_mode)
        
        self.btn_stats = QPushButton("Estadísticas")
        self.btn_stats.clicked.connect(self.show_statistics)
        self.btn_stats.setEnabled(False)
        self.header_layout.addWidget(self.btn_stats)

        self.btn_timeline = QPushButton("Cronología")
        self.btn_timeline.clicked.connect(self.show_timeline)
        self.btn_timeline.setEnabled(False)
        self.header_layout.addWidget(self.btn_timeline)

        self.btn_lore_book = QPushButton("Libro de Lore")
        self.btn_lore_book.clicked.connect(self.generate_lore_book)
        self.btn_lore_book.setEnabled(False)
        self.header_layout.addWidget(self.btn_lore_book)

        self.btn_rpg_sim = QPushButton("⚡ Simulador RPG")
        self.btn_rpg_sim.clicked.connect(self.show_rpg_simulator)
        self.btn_rpg_sim.setEnabled(False)
        self.header_layout.addWidget(self.btn_rpg_sim)

        self.btn_map = QPushButton("🗺️ Cartografía")
        self.btn_map.clicked.connect(self.show_cartography)
        self.btn_map.setEnabled(False)
        self.header_layout.addWidget(self.btn_map)
        
        self.content_layout.addLayout(self.header_layout)

        # Tabs
        self.tabs = QTabWidget()
        self.tabs.setUsesScrollButtons(True)
        self.tabs.currentChanged.connect(self.on_tab_changed)
        self.content_layout.addWidget(self.tabs)

        # Barra de acciones inferior (Dividida en 2 filas para mejor organización)
        self.actions_container = QVBoxLayout()
        self.actions_container.setSpacing(6)
        
        self.row1_layout = QHBoxLayout()
        self.row1_layout.setSpacing(6)
        self.row2_layout = QHBoxLayout()
        self.row2_layout.setSpacing(6)

        self.btn_add_row = QPushButton("Añadir Registro")
        self.btn_add_row.setObjectName("btn_add_row")
        self.btn_add_row.clicked.connect(self.add_row)

        self.btn_edit_row = QPushButton("Editar")
        self.btn_edit_row.clicked.connect(self.edit_row)

        self.btn_duplicate = QPushButton("Duplicar")
        self.btn_duplicate.clicked.connect(self.duplicate_row)

        self.btn_del_row = QPushButton("Eliminar")
        self.btn_del_row.setObjectName("btn_del_row")
        self.btn_del_row.clicked.connect(self.del_row)

        self.btn_tree_view = QPushButton("Ver Jerarquía")
        self.btn_tree_view.clicked.connect(self.show_tree_mode)

        self.btn_import_csv = QPushButton("Importar CSV")
        self.btn_import_csv.clicked.connect(self.import_csv)

        self.btn_export_planet = QPushButton("Exportar a CSV")
        self.btn_export_planet.clicked.connect(self.export_current_planet)

        self.btn_truncate = QPushButton("Vaciar Categoría")
        self.btn_truncate.setObjectName("btn_truncate")
        self.btn_truncate.clicked.connect(self.truncate_table)

        # Fila 1: CRUD básico
        for btn in [self.btn_add_row, self.btn_edit_row, self.btn_duplicate, self.btn_del_row]:
            btn.setEnabled(False)
            self.row1_layout.addWidget(btn)
            
        # Fila 2: Utilidades de tabla
        for btn in [self.btn_tree_view, self.btn_import_csv, self.btn_export_planet, self.btn_truncate]:
            btn.setEnabled(False)
            self.row2_layout.addWidget(btn)

        self.actions_container.addLayout(self.row1_layout)
        self.actions_container.addLayout(self.row2_layout)
        self.content_layout.addLayout(self.actions_container)
        self.splitter.addWidget(self.content_widget)
        self.splitter.setSizes([235, 1145])

        # Status bar
        self.status_bar = QStatusBar()
        self.setStatusBar(self.status_bar)
        self.status_bar.showMessage("💎 Listo. Seleccione un Planeta para comenzar.")

    def setup_shortcuts(self):
        QShortcut(QKeySequence("Ctrl+I"), self).activated.connect(self.import_csv)
        QShortcut(QKeySequence("Ctrl+D"), self).activated.connect(self.duplicate_row)
        QShortcut(QKeySequence("Del"), self).activated.connect(self.del_row)
        QShortcut(QKeySequence("Ctrl+N"), self).activated.connect(self.add_row)
        QShortcut(QKeySequence("Ctrl+E"), self).activated.connect(self.edit_row)

    # ── DB ───────────────────────────────────────────────────
    def connect_db(self, db_path="encyclopedia.db"):
        database.backup_database(db_path)
        database.init_db(db_path)
        self.db = QSqlDatabase.addDatabase("QSQLITE")
        self.db.setDatabaseName(db_path)
        if not self.db.open():
            QMessageBox.critical(self, "Error", "No se pudo conectar a la base de datos.")
            sys.exit(1)
        # ⚡ Aplicar PRAGMAs de rendimiento al abrir
        from PyQt6.QtSql import QSqlQuery
        for pragma in [
            "PRAGMA journal_mode=WAL",
            "PRAGMA synchronous=NORMAL",
            "PRAGMA cache_size=-65536",   # 64 MB
            "PRAGMA temp_store=MEMORY",
            "PRAGMA mmap_size=268435456", # 256 MB
        ]:
            QSqlQuery(pragma, self.db)

    # ── ÁRBOL ────────────────────────────────────────────────
    def load_planets(self):
        self.planet_tree.clear()
        planets = database.get_planets(self.db_path)
        self._planet_names = {p_id: p_name for p_id, p_name in planets}
        
        geo_cats = ["Hemisferios", "Macrorregiones", "Supercontinentes", "Continentes",
                    "Naciones", "Provincias", "Ciudades", "Villas", "Aldeas"]
        bio_cats = ["Criaturas", "Plantas", "Minerales"]
        lore_cats = ["Facciones", "Mitos y Deidades", "Eventos Históricos", "Diario de Aventuras", "Artefactos y Reliquias", "NPCs Notables", "Clases", "Subespecies", "Conceptos", "Especialidades"]
        all_std_cats = geo_cats + bio_cats + lore_cats

        self._cat_tree_items = {} # Maps (p_id, cat_name) -> QTreeWidgetItem
        
        for p_id, p_name in planets:
            db_cats = database.get_planet_categories(p_id, self.db_path)
            all_cat_names = [c[1] for c in db_cats]
            custom_cats = [c for c in all_cat_names if c not in all_std_cats]

            planet_item = QTreeWidgetItem(self.planet_tree, [f"🌍  {p_name}"])
            planet_item.setData(0, Qt.ItemDataRole.UserRole, ("planet", p_id, p_name, None))
            planet_item.setForeground(0, QColor("#fbbf24"))
            planet_item.setExpanded(True)

            geo_node = QTreeWidgetItem(planet_item, ["🗺️  Geografía"])
            geo_node.setData(0, Qt.ItemDataRole.UserRole, ("branch", p_id, p_name, "geo"))
            geo_node.setForeground(0, QColor("#34d399"))
            for cat in geo_cats:
                child = QTreeWidgetItem(geo_node, [f"  {cat}"])
                child.setData(0, Qt.ItemDataRole.UserRole, ("category", p_id, p_name, cat))
                child.setForeground(0, QColor("#6ee7b7"))
                self._cat_tree_items[(p_id, cat)] = child

            bio_node = QTreeWidgetItem(planet_item, ["🐉  Bestiario & Flora"])
            bio_node.setData(0, Qt.ItemDataRole.UserRole, ("branch", p_id, p_name, "bio"))
            bio_node.setForeground(0, QColor("#fb923c"))
            for cat in bio_cats:
                cat_node = QTreeWidgetItem(bio_node, [f"  {cat}"])
                cat_node.setData(0, Qt.ItemDataRole.UserRole, ("category", p_id, p_name, cat))
                cat_node.setForeground(0, QColor("#fdba74"))
                self._cat_tree_items[(p_id, cat)] = cat_node

            lore_node = QTreeWidgetItem(planet_item, ["📜  Lore & Clases"])
            lore_node.setData(0, Qt.ItemDataRole.UserRole, ("branch", p_id, p_name, "lore"))
            lore_node.setForeground(0, QColor("#a78bfa"))
            for cat in lore_cats:
                child = QTreeWidgetItem(lore_node, [f"  {cat}"])
                child.setData(0, Qt.ItemDataRole.UserRole, ("category", p_id, p_name, cat))
                child.setForeground(0, QColor("#c4b5fd"))
                self._cat_tree_items[(p_id, cat)] = child

            # Categorías personalizadas
            if custom_cats:
                custom_node = QTreeWidgetItem(planet_item, ["🧩  Categorías Personalizadas"])
                custom_node.setData(0, Qt.ItemDataRole.UserRole, ("branch", p_id, p_name, "custom"))
                custom_node.setForeground(0, QColor("#e879f9"))
                for cat in custom_cats:
                    child = QTreeWidgetItem(custom_node, [f"  {cat}"])
                    child.setData(0, Qt.ItemDataRole.UserRole, ("category", p_id, p_name, cat))
                    child.setForeground(0, QColor("#d946ef"))
                    self._cat_tree_items[(p_id, cat)] = child

            # Nueva categoría
            btn_new_cat = QTreeWidgetItem(planet_item, ["➕ Nueva Categoría Libre"])
            btn_new_cat.setData(0, Qt.ItemDataRole.UserRole, ("new_cat", p_id, p_name))
            btn_new_cat.setForeground(0, QColor("#9ca3af"))
            font = QFont(); font.setItalic(True)
            btn_new_cat.setFont(0, font)

        # Iniciar la carga asíncrona de conteos y niveles en un QThread
        flat_cats = all_std_cats + [c for p_i, p_n in planets for c in [x[1] for x in database.get_planet_categories(p_i, self.db_path)] if x[1] not in all_std_cats]
        self.planet_loader = PlanetLoaderThread(self.db_path, planets, list(set(flat_cats)))
        self.planet_loader.planet_loaded.connect(self._on_planet_info_loaded)
        self.planet_loader.start()

    def _on_planet_info_loaded(self, p_id, counts, levels):
        p_name = self._planet_names.get(p_id, "")
        bio_cats = ["Criaturas", "Plantas", "Minerales"]
        
        for (cat_p_id, cat_name), item in self._cat_tree_items.items():
            if cat_p_id == p_id:
                count = counts.get(cat_name, 0)
                lbl = f"  {cat_name}" + (f"  [{count:,}]" if count else "")
                item.setText(0, lbl)
                
                if cat_name in bio_cats:
                    # Clear child items
                    for i in range(item.childCount()):
                        item.removeChild(item.child(0))
                    # Add distinct levels
                    for lvl_label in levels.get(cat_name, []):
                        lvl_item = QTreeWidgetItem(item, [f"    ✦ {lvl_label}"])
                        lvl_item.setData(0, Qt.ItemDataRole.UserRole, ("level_filter", p_id, p_name, cat_name, lvl_label))
                        lvl_item.setForeground(0, QColor("#fcd34d"))

    def _bulk_cat_info(self, planet_id, cat_names):
        """Retorna {cat_name: count} y {cat_name: [levels]} en UNA sola conexión."""
        counts = {}
        levels = {}
        level_col_map = {"criaturas": "Rareza Nivel", "plantas": "Utilidad Nivel", "minerales": "Poder Nivel"}
        try:
            con = sqlite3.connect(self.db_path)
            cur = con.cursor()
            # Obtener todos los table_name de una vez
            placeholders = ",".join("?" * len(cat_names))
            cur.execute(
                f"SELECT name, table_name FROM categories WHERE planet_id=? AND name IN ({placeholders})",
                [planet_id] + list(cat_names)
            )
            table_map = {row[0]: row[1] for row in cur.fetchall()}
            for cat in cat_names:
                table = table_map.get(cat, f"p_{planet_id}_{cat.replace(' ', '_').lower()}")
                try:
                    cur.execute(f'SELECT COUNT(*) FROM "{table}"')
                    counts[cat] = cur.fetchone()[0]
                except:
                    counts[cat] = 0
                lvl_col = level_col_map.get(cat.lower())
                if lvl_col:
                    try:
                        cur.execute(f'SELECT DISTINCT "{lvl_col}" FROM "{table}" WHERE "{lvl_col}" IS NOT NULL ORDER BY "{lvl_col}"')
                        levels[cat] = [r[0] for r in cur.fetchall() if r[0]]
                    except:
                        levels[cat] = []
                else:
                    levels[cat] = []
            con.close()
        except:
            pass
        return counts, levels

    def _get_cat_count(self, planet_id, cat_name):
        counts, _ = self._bulk_cat_info(planet_id, [cat_name])
        return counts.get(cat_name, 0)

    def _get_cat_levels(self, planet_id, cat_name):
        _, levels = self._bulk_cat_info(planet_id, [cat_name])
        return levels.get(cat_name, [])

    def get_selected_planet_id(self):
        item = self.planet_tree.currentItem()
        if not item: return None
        data = item.data(0, Qt.ItemDataRole.UserRole)
        return data[1] if data and len(data) >= 2 else None

    def get_selected_planet_name(self):
        item = self.planet_tree.currentItem()
        if not item: return None
        data = item.data(0, Qt.ItemDataRole.UserRole)
        return data[2] if data and len(data) >= 3 else None

    def on_tree_item_clicked(self, item, column):
        data = item.data(0, Qt.ItemDataRole.UserRole)
        if not data: return
        kind, p_id = data[0], data[1]

        if kind == "planet":
            self.current_planet_id = p_id
            self.load_planet_data(p_id)
            self._enable_planet_buttons(True)
            self.planet_badge.setText(f"🌍  {data[2]}")

        elif kind == "category":
            cat_name = data[3]
            if self.current_planet_id != p_id:
                self.current_planet_id = p_id
                self.load_planet_data(p_id)
                self._enable_planet_buttons(True)
            self.planet_badge.setText(f"🌍  {data[2]}")
            self._switch_to_tab(cat_name)
            self._apply_table_filter(None)

        elif kind == "level_filter":
            cat_name, lvl_label = data[3], data[4]
            if self.current_planet_id != p_id:
                self.current_planet_id = p_id
                self.load_planet_data(p_id)
                self._enable_planet_buttons(True)
            self.planet_badge.setText(f"🌍  {data[2]}")
            self._switch_to_tab(cat_name)
            self._apply_table_filter(lvl_label)

        elif kind == "new_cat":
            name, ok = QInputDialog.getText(self, "Libertad Creadora", "Nombra tu nueva categoría (Ej: Constelaciones):")
            if ok and name.strip():
                safe_name = name.strip()
                table_str = f"p_{self.current_planet_id}_{safe_name.replace(' ', '_').lower()}"
                try:
                    conn = database.get_connection(self.db_path)
                    cur = conn.cursor()
                    cur.execute(f'''CREATE TABLE IF NOT EXISTS "{table_str}" (
                        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
                        "Nombre" TEXT,
                        "parent_id" INTEGER DEFAULT 0,
                        "image_path" TEXT DEFAULT "",
                        "is_favorite" INTEGER DEFAULT 0
                    )''')
                    # Register the category so it appears in the tree
                    cur.execute("SELECT 1 FROM categories WHERE planet_id=? AND table_name=?", (self.current_planet_id, table_str))
                    if not cur.fetchone():
                        cur.execute("INSERT INTO categories (planet_id, name, table_name) VALUES (?, ?, ?)", (self.current_planet_id, safe_name, table_str))
                    conn.commit()
                    conn.close()
                    
                    # Registrarla ofialmente en el catálogo
                    self.load_planets()
                    self.load_planet_data(self.current_planet_id)
                    self._switch_to_tab(safe_name)
                except Exception as e:
                    QMessageBox.warning(self, "Error al Falsificar Rama", f"Ocurrió un error: {e}")

    def show_planet_context_menu(self, pos):
        item = self.planet_tree.itemAt(pos)
        if not item: return
        data = item.data(0, Qt.ItemDataRole.UserRole)
        if not data or data[0] != "planet": return
        menu = QMenu(self)
        act_del = menu.addAction("🗑️  Eliminar Planeta")
        action = menu.exec(self.planet_tree.mapToGlobal(pos))
        if action == act_del:
            p_id, p_name = data[1], data[2]
            msg = QMessageBox(self)
            msg.setWindowTitle("Purga Planetaria")
            msg.setIcon(QMessageBox.Icon.Warning)
            msg.setText(f"¿Estás seguro de querer destruir por completo a '{p_name}'?")
            msg.setInformativeText("⚠️ NINGÚN archivo CSV original de tu disco duro ni tus imágenes locales serán tocadas o eliminadas. Esto solo desconecta al planeta del software.")
            msg.setStandardButtons(QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.Cancel)
            if msg.exec() == QMessageBox.StandardButton.Yes:
                database.delete_planet(p_id, self.db_path)
                self.planet_badge.setText("Sin planeta seleccionado")
                self.load_planets()

    def _enable_planet_buttons(self, state):
        for btn in [self.btn_add_row, self.btn_edit_row, self.btn_del_row, self.btn_duplicate,
                    self.btn_tree_view, self.btn_import_csv, self.btn_export_planet,
                    self.btn_truncate, self.btn_lore_mode, self.btn_stats, self.btn_timeline, self.btn_lore_book,
                    self.btn_schema_mgr, self.btn_rpg_sim, self.btn_map]:
            btn.setEnabled(state)
        self.search_bar.setEnabled(state)

    def _switch_to_tab(self, cat_name):
        for i in range(self.tabs.count()):
            if self.tabs.tabText(i).strip() == cat_name.strip():
                self.tabs.setCurrentIndex(i)
                return

    def _apply_table_filter(self, level_value):
        current_tab = self.tabs.currentWidget()
        if not current_tab: return
        view = current_tab.property("view")
        if not view: return
        model = view.model()
        sql_model = model.sourceModel() if hasattr(model, "sourceModel") else model
        
        level_col_map = {"criaturas": "Rareza Nivel", "plantas": "Utilidad Nivel", "minerales": "Poder Nivel"}
        tab_name = current_tab.property("table_name") or ""
        lvl_col = next((v for k, v in level_col_map.items() if k in tab_name.lower()), None)
        if level_value and lvl_col:
            sql_model.setFilter(f'"{lvl_col}" = \'{level_value}\'')
        else:
            sql_model.setFilter("")
        sql_model.select()
        self.update_dashboard()

    # ── CARGA DE DATOS ────────────────────────────────────────
    def get_display_column(self, model):
        sql_model = model.sourceModel() if hasattr(model, "sourceModel") else model
        potential_names = ["Nombre", "Nombre_Completo", "Nombre Común", "Nombre de Clase",
                           "Raza Base", "Especialidad", "Concepto", "Nombre_Corto"]
        for name in potential_names:
            if sql_model.fieldIndex(name) != -1:
                return name
        return "id"

    def _get_sql_model(self, model):
        """Devuelve el QSqlTableModel subyacente, saltando cualquier Proxy intermedio."""
        return model.sourceModel() if hasattr(model, "sourceModel") else model

    def on_tab_changed(self):
        self.search_bar.clear()
        self._search_timer.stop()
        
        # ⚡ Carga Perezosa (Lazy Loading)
        current_tab = self.tabs.currentWidget()
        if current_tab:
            view = current_tab.property("view")
            if view and not view.property("is_loaded"):
                model = view.model()
                sql_model = self._get_sql_model(model)
                if sql_model:
                    # Application hangs if we select 4M rows at once, so we do it here when tab opens
                    sql_model.setFilter("1=1")
                    sql_model.select()
                    sql_model.fetchMore()
                    view.setProperty("is_loaded", True)
                    
        self.update_dashboard()

    def _do_filter(self):
        """Ejecutado por el timer de debounce; filtra solo la pestaña activa."""
        text = self.search_bar.text().strip()
        current_tab = self.tabs.currentWidget()
        if not current_tab:
            return
        view = current_tab.property("view")
        if not view:
            return
        model = view.model()
        sql_model = model.sourceModel() if hasattr(model, "sourceModel") else model
        if not sql_model:
            return
        display_col = self.get_display_column(sql_model)
        if text:
            sql_model.setFilter(f'"{display_col}" LIKE \'%{text}%\'')
        else:
            sql_model.setFilter("")
        sql_model.select()
        self.update_dashboard()

    def load_planet_data(self, planet_id):
        self.tabs.clear()
        self.tabs.setUpdatesEnabled(False)  # Evita repintados intermedios
        categories = database.get_planet_categories(planet_id, self.db_path)
        
        # Obtener los conteos de filas para optimizar la carga
        counts = {}
        try:
            conn = database.get_connection(self.db_path)
            cursor = conn.cursor()
            for _, _, table_name in categories:
                try:
                    cursor.execute(f'SELECT COUNT(*) FROM "{table_name}"')
                    counts[table_name] = cursor.fetchone()[0]
                except:
                    counts[table_name] = 0
            conn.close()
        except:
            pass

        for _, cat_name, table_name in categories:
            tab = QWidget()
            layout = QHBoxLayout(tab)
            layout.setContentsMargins(0, 0, 0, 0)
            layout.setSpacing(0)

            # Tabla izquierda
            view = QTableView()
            view.setAlternatingRowColors(True)
            model = QSqlTableModel(db=self.db)
            model.setTable(table_name)
            display_column = self.get_display_column(model)
            model.setEditStrategy(QSqlTableModel.EditStrategy.OnManualSubmit)
            # ⚡ Carga Perezosa (Lazy Loading): No hacemos select() en el arranque
            # Solo preparamos el modelo y dejamos una bandera para que on_tab_changed lo llene
            view.setProperty("is_loaded", False)

            # Si la tabla tiene más de 5,000 registros, desactivamos ordenamiento por defecto y evitamos el proxy para prevenir Out Of Memory/Congelamiento
            is_large = counts.get(table_name, 0) > 5000
            proxy = None

            if is_large:
                view.setModel(model)
                view.setSortingEnabled(False)
            else:
                # Proxy Oculto para Ordenar Jerárquicamente
                proxy = HierarchyProxyModel(self)
                proxy.setSourceModel(model)

                # Mapa: categoria -> (columna nivel, columna texto para proxy jerarquico)
                level_col_map = {
                    "criaturas":     ("Rareza Nivel",      "Rareza"),
                    "plantas":       ("Utilidad Nivel",    "Utilidad"),
                    "minerales":     ("Poder Nivel",       "Poder"),
                    "clases":        ("Nivel",             "Rareza"),
                    "especialidades":("Nivel_Rareza",      "Nombre_Rareza"),
                    "habilidades":   ("Nivel_Requerido",   "Rareza"),
                    "razas":         ("Nivel",             "Raza"),
                }
                cat_key = next((k for k in level_col_map if k in cat_name.lower()), None)
                if cat_key:
                    lvl_col, target_col = level_col_map[cat_key]
                    idx_lvl    = model.fieldIndex(lvl_col)
                    idx_target = model.fieldIndex(target_col)
                    if idx_lvl != -1 and idx_target != -1:
                        proxy.set_hierarchy_columns(idx_target, idx_lvl)

                view.setModel(proxy)
                view.setSortingEnabled(True)

            view.hideColumn(0)
            img_idx = model.fieldIndex("image_path")
            if img_idx != -1: view.hideColumn(img_idx)

            view.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Interactive)
            view.horizontalHeader().setStretchLastSection(True)
            view.setSelectionBehavior(QTableView.SelectionBehavior.SelectRows)
            view.setEditTriggers(QAbstractItemView.EditTrigger.NoEditTriggers)
            view.setContextMenuPolicy(Qt.ContextMenuPolicy.CustomContextMenu)
            view.customContextMenuRequested.connect(self.show_context_menu)
            view.selectionModel().selectionChanged.connect(self.on_row_selected)
            view.doubleClicked.connect(self.edit_row)
            # Cargar más filas cuando el usuario llega al final del scroll (fetchMore on demand)
            vbar = view.verticalScrollBar()
            vbar.valueChanged.connect(
                lambda val, v=view, m=model: m.fetchMore() if val >= vbar.maximum() - 50 else None
            )

            # Delegate de rareza para las categorias que usan colores
            rarity_col_names = {
                "criaturas": "Rareza", "plantas": "Utilidad",
                "minerales": "Poder",  "clases": "Rareza",
                "especialidades": "Nombre_Rareza", "habilidades": "Rareza",
                "razas": "Nombre_Nivel",
            }
            rc_key = next((k for k in rarity_col_names if k in cat_name.lower()), None)
            if rc_key:
                rc_idx = model.fieldIndex(rarity_col_names[rc_key])
                if rc_idx != -1:
                    view.setItemDelegateForColumn(rc_idx, RarityDelegate(view))

            # Ocultar columnas pesadas en la tabla
            for col in range(model.columnCount()):
                field_name = model.record().fieldName(col)
                if field_name.lower() in ("id", "image_path", "parent_id", "is_favorite"):
                    view.hideColumn(col)
                    continue
                col_name = (model.headerData(col, Qt.Orientation.Horizontal) or "").lower()
                if any(h in col_name for h in HEAVY_KEYWORDS):
                    view.hideColumn(col)

            # Inspector derecho
            inspector_scroll = QScrollArea()
            inspector_scroll.setObjectName("inspector_scroll")
            inspector_scroll.setWidgetResizable(True)
            inspector_scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
            inspector_scroll.setFixedWidth(320)

            inspector_content = QWidget()
            inspector_content.setObjectName("inspector_content")
            inspector_layout = QVBoxLayout(inspector_content)
            inspector_layout.setContentsMargins(16, 16, 16, 16)
            inspector_layout.setSpacing(12)

            # Nombre de ítem seleccionado
            inspector_name = QLabel("— Seleccione una fila —")
            inspector_name.setObjectName("inspector_name")
            inspector_name.setAlignment(Qt.AlignmentFlag.AlignCenter)
            inspector_name.setWordWrap(True)
            inspector_layout.addWidget(inspector_name)

            # Botón Guardar Cambios Manual (Antilag)
            btn_save = QPushButton("💾 Guardar Datos")
            btn_save.setObjectName("btn_save")
            btn_save.clicked.connect(lambda _, m=proxy, m_s=model: self.save_inspector(m, m_s))
            inspector_layout.addWidget(btn_save)

            mapper = QDataWidgetMapper(self)
            mapper.setModel(model if is_large else proxy)
            mapper.setSubmitPolicy(QDataWidgetMapper.SubmitPolicy.ManualSubmit)
            mapper.setItemDelegate(QSqlRelationalDelegate(mapper))
            
            chk_favorite = QCheckBox("⭐ Destacado / Favorito")
            chk_favorite.setObjectName("chk_favorite")
            inspector_layout.addWidget(chk_favorite)
            
            fav_col = model.fieldIndex("is_favorite")
            if fav_col != -1:
                mapper.addMapping(chk_favorite, fav_col, b"checked")

            img_label = DropImageLabel(on_drop=self.handle_inspector_drop)
            img_label.setObjectName("img_placeholder")
            img_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
            img_label.setFixedSize(280, 180)
            img_label.setText("📷\nDrag Foto Aquí")
            img_label.setScaledContents(False)

            btn_set_img = QPushButton("📸 Cambiar Imagen")
            btn_set_img.clicked.connect(self.set_image_for_row)

            inspector_layout.addWidget(img_label)
            inspector_layout.addWidget(btn_set_img)

            sep = QFrame(); sep.setFrameShape(QFrame.Shape.HLine)
            sep.setObjectName("separator")
            inspector_layout.addWidget(sep)

            form_layout = QFormLayout()
            form_layout.setLabelAlignment(Qt.AlignmentFlag.AlignRight)
            form_layout.setSpacing(6)

            for col in range(model.columnCount()):
                field_name = model.record().fieldName(col)
                if field_name.lower() in ("id", "image_path", "parent_id", "is_favorite"):
                    continue
                col_name = model.headerData(col, Qt.Orientation.Horizontal) or field_name
                is_heavy = any(h in col_name.lower() for h in HEAVY_KEYWORDS)
                lbl = QLabel(col_name + ":")
                if is_heavy:
                    widget = QPlainTextEdit()
                    widget.setMaximumHeight(100)
                    form_layout.addRow(lbl, widget)
                    mapper.addMapping(widget, col, b"plainText")
                else:
                    widget = QLineEdit()
                    widget.setReadOnly(True)
                    form_layout.addRow(lbl, widget)
                    mapper.addMapping(widget, col)

            inspector_layout.addLayout(form_layout)
            
            btn_add_col = QPushButton("➕ Nuevo Atributo")
            btn_add_col.setObjectName("btn_add_col")
            btn_add_col.clicked.connect(self.add_new_attribute)
            inspector_layout.addWidget(btn_add_col)
            
            # --- SECCIÓN RELACIONES DE LORE ---
            sep_rel = QFrame()
            sep_rel.setFrameShape(QFrame.Shape.HLine)
            sep_rel.setObjectName("separator")
            inspector_layout.addWidget(sep_rel)

            lbl_rel = QLabel("🔗 Vínculos de Lore")
            lbl_rel.setObjectName("section_title")
            inspector_layout.addWidget(lbl_rel)

            list_rel = QListWidget()
            list_rel.setFixedHeight(120)
            list_rel.setStyleSheet("QListWidget { background-color: #0d0f17; border: 1px solid rgba(255,255,255,0.04); border-radius: 6px; color: #cbd5e1; font-size: 11px; }")
            list_rel.doubleClicked.connect(self.on_relation_double_clicked)
            inspector_layout.addWidget(list_rel)

            row_rel_btns = QHBoxLayout()
            row_rel_btns.setSpacing(4)
            
            btn_add_rel = QPushButton("➕ Enlazar")
            btn_add_rel.clicked.connect(self.add_relationship)
            btn_add_rel.setStyleSheet("font-size: 10px; padding: 4px;")
            
            btn_del_rel = QPushButton("➖ Quitar")
            btn_del_rel.clicked.connect(self.delete_relationship)
            btn_del_rel.setStyleSheet("font-size: 10px; padding: 4px;")
            
            btn_graph_rel = QPushButton("🕸️ Ver Red")
            btn_graph_rel.clicked.connect(self.show_relationship_graph)
            btn_graph_rel.setStyleSheet("font-size: 10px; padding: 4px;")
            
            row_rel_btns.addWidget(btn_add_rel)
            row_rel_btns.addWidget(btn_del_rel)
            row_rel_btns.addWidget(btn_graph_rel)
            inspector_layout.addLayout(row_rel_btns)
            # ----------------------------------
            
            inspector_layout.addStretch()
            inspector_content.setLayout(inspector_layout)
            inspector_scroll.setWidget(inspector_content)

            split = QSplitter(Qt.Orientation.Horizontal)
            split.addWidget(view)
            split.addWidget(inspector_scroll)
            split.setSizes([750, 300])
            layout.addWidget(split)

            tab.setProperty("table_name", table_name)
            tab.setProperty("view", view)
            tab.setProperty("img_label", img_label)
            tab.setProperty("mapper", mapper)
            tab.setProperty("inspector_name", inspector_name)
            tab.setProperty("list_rel", list_rel)

            self.tabs.addTab(tab, cat_name)
        self.tabs.setUpdatesEnabled(True)  # Reactivar repintado cuando todos los tabs están listos
        self.update_dashboard()

    # ── FILTROS ───────────────────────────────────────────────
    def filter_current_table(self, text):
        """Alias para compatibilidad; el debounce ahora lo gestiona _do_filter."""
        self._do_filter()

    def update_dashboard(self):
        current_tab = self.tabs.currentWidget()
        if not current_tab: return
        view = current_tab.property("view")
        total = view.model().rowCount()
        p_name = self.get_selected_planet_name() or "—"
        cat_name = self.tabs.tabText(self.tabs.currentIndex())
        self.status_bar.showMessage(f"🌍 Planeta: {p_name}   |   📑 {cat_name}   |   📊 {total} registros")

    # ── INSPECTOR ─────────────────────────────────────────────
    def on_row_selected(self):
        current_tab = self.tabs.currentWidget()
        if not current_tab: return
        view = current_tab.property("view")
        img_label = current_tab.property("img_label")
        mapper = current_tab.property("mapper")
        inspector_name = current_tab.property("inspector_name")
        model = view.model()
        sql_model = model.sourceModel() if hasattr(model, "sourceModel") else model
        row_indices = view.selectionModel().selectedRows()

        if not row_indices:
            img_label.setPixmap(QPixmap())
            img_label.setText("📷\nSin Imagen")
            if inspector_name: inspector_name.setText("— Seleccione una fila —")
            if mapper: mapper.setCurrentModelIndex(QModelIndex())
            list_rel = current_tab.property("list_rel")
            if list_rel: list_rel.clear()
            return

        row = row_indices[0].row()
        if mapper: mapper.setCurrentModelIndex(row_indices[0])

        # Nombre dinámico en inspector
        display_col = self.get_display_column(model)
        name_idx = sql_model.fieldIndex(display_col)
        if name_idx != -1 and inspector_name:
            val = model.data(model.index(row, name_idx))
            inspector_name.setText(str(val) if val else "Sin Nombre")

        # Imagen
        img_col = sql_model.fieldIndex("image_path")
        if img_col != -1:
            raw_path = model.data(model.index(row, img_col))
            resolved_path = resolve_path(self.db_path, raw_path)
            if resolved_path and os.path.exists(resolved_path):
                try:
                    pix = QPixmap(resolved_path)
                    if not pix.isNull():
                        pix = pix.scaled(270, 180, Qt.AspectRatioMode.KeepAspectRatio, Qt.TransformationMode.SmoothTransformation)
                        img_label.setPixmap(pix)
                        img_label.setText("")
                    else: raise Exception()
                except:
                    img_label.setPixmap(QPixmap())
                    img_label.setText("📷\nError")
            else:
                img_label.setPixmap(QPixmap())
                img_label.setText("📷\nSin Imagen")

        # Cargar relaciones
        list_rel = current_tab.property("list_rel")
        if list_rel:
            list_rel.clear()
            p_id = self.get_selected_planet_id()
            if p_id:
                tab_name = current_tab.property("table_name")
                id_col = sql_model.fieldIndex("id")
                if id_col != -1:
                    row_id = model.data(model.index(row, id_col))
                    self.load_relations_list(list_rel, p_id, tab_name, row_id)

    def load_relations_list(self, list_widget, planet_id, table_name, row_id):
        list_widget.clear()
        try:
            conn = sqlite3.connect(self.db_path)
            c = conn.cursor()
            c.execute(f"""
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
            c.execute(f"""
                SELECT id, origen_tabla, origen_id, destino_tabla, destino_id, tipo_relacion, descripcion
                FROM "p_{planet_id}_relaciones"
                WHERE (origen_tabla = ? AND origen_id = ?) OR (destino_tabla = ? AND destino_id = ?)
            """, (table_name, row_id, table_name, row_id))
            rels = c.fetchall()
            for r_id, orig_tbl, orig_id, dest_tbl, dest_id, r_type, desc in rels:
                is_outgoing = (orig_tbl == table_name and orig_id == row_id)
                target_tbl = dest_tbl if is_outgoing else orig_tbl
                target_id = dest_id if is_outgoing else orig_id
                
                # Obtener nombre de categoría
                c.execute("SELECT name FROM categories WHERE planet_id = ? AND table_name = ?", (planet_id, target_tbl))
                cat_row = c.fetchone()
                target_cat = cat_row[0] if cat_row else target_tbl
                
                # Obtener nombre del registro destino
                target_name = f"ID {target_id}"
                try:
                    c.execute(f'PRAGMA table_info("{target_tbl}")')
                    cols = [col[1] for col in c.fetchall()]
                    name_col = next((col for col in ["Nombre", "Nombre_Completo", "Nombre Común", "Nombre de Clase", "Raza Base", "Especialidad", "Concepto", "Nombre_Corto"] if col in cols), None)
                    if name_col:
                        c.execute(f'SELECT "{name_col}" FROM "{target_tbl}" WHERE id = ?', (target_id,))
                        name_row = c.fetchone()
                        if name_row and name_row[0]:
                            target_name = name_row[0]
                except Exception as ex:
                    print("Error loading target name:", ex)
                    
                arrow = "→" if is_outgoing else "←"
                disp_text = f"{arrow} [{target_cat}] {target_name} ({r_type or 'Vínculo'})"
                item = QListWidgetItem(disp_text)
                item.setData(Qt.ItemDataRole.UserRole, (r_id, target_cat, target_tbl, target_id))
                list_widget.addItem(item)
            conn.close()
        except Exception as e:
            print("Error loading relations list:", e)

    def on_relation_double_clicked(self, item_index):
        current_tab = self.tabs.currentWidget()
        if not current_tab: return
        list_rel = current_tab.property("list_rel")
        if not list_rel: return
        item = list_rel.currentItem()
        if not item: return
        data = item.data(Qt.ItemDataRole.UserRole)
        if data:
            _, target_cat, _, target_id = data
            self.select_entity(target_cat, target_id)

    def select_entity(self, cat_name, row_id):
        # 1. Cambiar a la pestaña
        self._switch_to_tab(cat_name)
        current_tab = self.tabs.currentWidget()
        if not current_tab: return
        view = current_tab.property("view")
        if not view: return
        
        # Si no se ha cargado el modelo (lazy loading), forzar carga
        if not view.property("is_loaded"):
            self.on_tab_changed()
            
        model = view.model()
        sql_model = model.sourceModel() if hasattr(model, "sourceModel") else model
        
        id_col = sql_model.fieldIndex("id")
        if id_col == -1:
            id_col = 0
            
        row_count = model.rowCount()
        found = False
        limit = 0
        while row_count < 10000 and limit < 25:
            for r in range(row_count):
                idx = model.index(r, id_col)
                val = model.data(idx)
                if val == row_id or str(val) == str(row_id):
                    # Encontrado! Seleccionar fila
                    view.selectRow(r)
                    view.scrollTo(model.index(r, 0))
                    found = True
                    break
            if found:
                break
            if hasattr(sql_model, "canFetchMore") and sql_model.canFetchMore():
                sql_model.fetchMore()
                row_count = model.rowCount()
                limit += 1
            else:
                break

    def add_relationship(self):
        current_tab = self.tabs.currentWidget()
        if not current_tab: return
        view = current_tab.property("view")
        model = view.model()
        sql_model = model.sourceModel() if hasattr(model, "sourceModel") else model
        row_indices = view.selectionModel().selectedRows()
        if not row_indices:
            QMessageBox.warning(self, "Aviso", "Selecciona una fila primero.")
            return
        row = row_indices[0].row()
        id_col = sql_model.fieldIndex("id")
        if id_col == -1: return
        source_id = model.data(model.index(row, id_col))
        
        # Obtener nombre legible de origen
        display_col = self.get_display_column(model)
        name_idx = sql_model.fieldIndex(display_col)
        source_name = str(model.data(model.index(row, name_idx))) if name_idx != -1 else f"ID {source_id}"
        
        planet_id = self.get_selected_planet_id()
        source_table = current_tab.property("table_name")
        
        dialog = AddRelationshipDialog(self, planet_id, self.db_path, source_table, source_id, source_name)
        if dialog.exec() == QDialog.DialogCode.Accepted:
            # Recargar relaciones
            self.on_row_selected()

    def delete_relationship(self):
        current_tab = self.tabs.currentWidget()
        if not current_tab: return
        list_rel = current_tab.property("list_rel")
        if not list_rel: return
        item = list_rel.currentItem()
        if not item:
            QMessageBox.warning(self, "Aviso", "Selecciona un vínculo para eliminar.")
            return
        
        data = item.data(Qt.ItemDataRole.UserRole)
        if not data: return
        rel_id, _, _, _ = data
        
        ans = QMessageBox.question(self, "Eliminar Vínculo", "¿Estás seguro de que deseas eliminar este vínculo de lore?", QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No)
        if ans == QMessageBox.StandardButton.Yes:
            planet_id = self.get_selected_planet_id()
            try:
                conn = sqlite3.connect(self.db_path)
                c = conn.cursor()
                c.execute(f'DELETE FROM "p_{planet_id}_relaciones" WHERE id = ?', (rel_id,))
                conn.commit()
                conn.close()
                self.on_row_selected()
            except Exception as e:
                QMessageBox.critical(self, "Error", f"No se pudo eliminar el vínculo: {e}")

    def show_relationship_graph(self):
        current_tab = self.tabs.currentWidget()
        if not current_tab: return
        view = current_tab.property("view")
        model = view.model()
        sql_model = model.sourceModel() if hasattr(model, "sourceModel") else model
        row_indices = view.selectionModel().selectedRows()
        if not row_indices:
            QMessageBox.warning(self, "Aviso", "Selecciona una fila primero.")
            return
        row = row_indices[0].row()
        id_col = sql_model.fieldIndex("id")
        if id_col == -1: return
        entity_id = model.data(model.index(row, id_col))
        
        display_col = self.get_display_column(model)
        name_idx = sql_model.fieldIndex(display_col)
        entity_name = str(model.data(model.index(row, name_idx))) if name_idx != -1 else f"ID {entity_id}"
        
        planet_id = self.get_selected_planet_id()
        table_name = current_tab.property("table_name")
        cat_name = self.tabs.tabText(self.tabs.currentIndex())
        
        dialog = RelationshipGraphDialog(self, planet_id, self.db_path, table_name, entity_id, entity_name, cat_name)
        dialog.exec()

    def handle_inspector_drop(self, path):
        current_tab = self.tabs.currentWidget()
        if not current_tab: return
        view = current_tab.property("view")
        model = view.model()
        sql_model = model.sourceModel() if hasattr(model, "sourceModel") else model
        row_indices = view.selectionModel().selectedRows()
        if not row_indices:
            QMessageBox.warning(self, "Aviso", "Selecciona una fila primero.")
            return
        row = row_indices[0].row()
        img_col = sql_model.fieldIndex("image_path")
        if img_col != -1:
            final_path = get_media_path(self.db_path, path)
            src_idx = model.mapToSource(model.index(row, img_col)) if hasattr(model, "mapToSource") else model.index(row, img_col)
            sql_model.setData(src_idx, final_path)
            sql_model.submitAll()
            self.on_row_selected()

    def set_image_for_row(self):
        current_tab = self.tabs.currentWidget()
        if not current_tab: return
        view = current_tab.property("view")
        model = view.model()
        sql_model = self._get_sql_model(model)
        row_indices = view.selectionModel().selectedRows()
        if not row_indices:
            QMessageBox.warning(self, "Aviso", "Selecciona una fila primero.")
            return
        row = row_indices[0].row()
        img_col = sql_model.fieldIndex("image_path")
        if img_col == -1: return
        file_path, _ = QFileDialog.getOpenFileName(self, "Seleccionar Imagen", "", "Images (*.png *.jpg *.jpeg *.bmp *.gif *.webp)")
        if file_path:
            final_path = get_media_path(self.db_path, file_path)
            src_idx = model.mapToSource(model.index(row, img_col)) if hasattr(model, "mapToSource") else model.index(row, img_col)
            sql_model.setData(src_idx, final_path)
            sql_model.submitAll()
            self.on_row_selected()

    def save_inspector(self, proxy_model, source_model):
        current_tab = self.tabs.currentWidget()
        if not current_tab: return
        mapper = current_tab.property("mapper")
        if mapper:
            mapper.submit()
        if source_model:
            if not source_model.submitAll():
                QMessageBox.warning(self, "Error al guardar", source_model.lastError().text())
            else:
                self.update_dashboard()

    # ── CRUD MEJORADO ─────────────────────────────────────────
    def _get_editable_columns(self, model):
        """Devuelve lista de nombres de columnas editables (sin id/image_path pero SÍ parent_id)."""
        cols = []
        for col in range(model.columnCount()):
            field = model.record().fieldName(col)
            if field.lower() not in ("id", "image_path"):
                header = model.headerData(col, Qt.Orientation.Horizontal) or field
                cols.append(header)
        return cols

    def _get_row_data_dict(self, model, row):
        """Extrae los datos de una fila como dict col_header→valor."""
        data = {}
        for col in range(model.columnCount()):
            field = model.record().fieldName(col)
            header = model.headerData(col, Qt.Orientation.Horizontal) or field
            data[header] = model.data(model.index(row, col))
        return data

    def add_row(self):
        current_tab = self.tabs.currentWidget()
        if not current_tab: return
        view = current_tab.property("view")
        model = view.model()
        sql_model = self._get_sql_model(model)
        table_name = current_tab.property("table_name")
        cols = self._get_editable_columns(sql_model)

        dlg = EditDialog(self, table_name, self.db_path, row_data=None, columns=cols)
        if dlg.exec() == QDialog.DialogCode.Accepted:
            data = dlg.get_data()
            if not data: return
            row = sql_model.rowCount()
            sql_model.insertRow(row)
            for col in range(sql_model.columnCount()):
                field = sql_model.record().fieldName(col)
                header = sql_model.headerData(col, Qt.Orientation.Horizontal) or field
                if header in data:
                    sql_model.setData(sql_model.index(row, col), data[header])
                elif field == "image_path" and "image_path" in data:
                    sql_model.setData(sql_model.index(row, col), data["image_path"])
            if not sql_model.submitAll():
                QMessageBox.warning(self, "Error", f"No se pudo guardar: {sql_model.lastError().text()}")
            else:
                sql_model.select()
                view.selectRow(sql_model.rowCount() - 1)
                self.load_planets()
            self.update_dashboard()

    def edit_row(self):
        current_tab = self.tabs.currentWidget()
        if not current_tab: return
        view = current_tab.property("view")
        model = view.model()
        sql_model = self._get_sql_model(model)
        table_name = current_tab.property("table_name")
        indices = view.selectionModel().selectedRows()
        if not indices:
            QMessageBox.information(self, "Editar", "Selecciona una fila para editar.")
            return

        proxy_row = indices[0].row()
        # Mapear a fila real del sql_model ANTES de leer los datos
        src_row = model.mapToSource(model.index(proxy_row, 0)).row() if hasattr(model, "mapToSource") else proxy_row

        # Leer columnas y datos directamente del sql_model para evitar desfase de índices
        cols = self._get_editable_columns(sql_model)
        row_data = self._get_row_data_dict(sql_model, src_row)

        dlg = EditDialog(self, table_name, self.db_path, row_data=row_data, columns=cols)
        if dlg.exec() == QDialog.DialogCode.Accepted:
            data = dlg.get_data()
            if not data: return
            for col in range(sql_model.columnCount()):
                field = sql_model.record().fieldName(col)
                header = sql_model.headerData(col, Qt.Orientation.Horizontal) or field
                if header in data:
                    sql_model.setData(sql_model.index(src_row, col), data[header])
                elif field == "image_path" and "image_path" in data:
                    sql_model.setData(sql_model.index(src_row, col), data["image_path"])
            if not sql_model.submitAll():
                QMessageBox.warning(self, "Error", f"No se pudo guardar: {sql_model.lastError().text()}")
            else:
                sql_model.select()
                view.selectRow(proxy_row)
                self.on_row_selected()
            self.update_dashboard()

    def del_row(self):
        current_tab = self.tabs.currentWidget()
        if not current_tab: return
        view = current_tab.property("view")
        model = view.model()
        sql_model = self._get_sql_model(model)
        selected = view.selectionModel().selectedRows()
        if not selected: return
        if QMessageBox.question(self, "Confirmar", f"¿Eliminar {len(selected)} fila(s)?") != QMessageBox.StandardButton.Yes:
            return
        for idx in sorted(selected, reverse=True):
            src_row = model.mapToSource(model.index(idx.row(), 0)).row() if hasattr(model, "mapToSource") else idx.row()
            sql_model.removeRow(src_row)
        sql_model.submitAll()
        sql_model.select()
        self.load_planets()
        self.update_dashboard()

    def duplicate_row(self):
        current_tab = self.tabs.currentWidget()
        if not current_tab: return
        view = current_tab.property("view")
        model = view.model()
        sql_model = self._get_sql_model(model)
        indices = view.selectionModel().selectedRows()
        if not indices: return
        row = indices[0].row()
        src_row = model.mapToSource(model.index(row, 0)).row() if hasattr(model, "mapToSource") else row
        new_row = sql_model.rowCount()
        sql_model.insertRow(new_row)
        for col in range(1, sql_model.columnCount()):
            val = sql_model.data(sql_model.index(src_row, col))
            sql_model.setData(sql_model.index(new_row, col), val)
        if not sql_model.submitAll():
            sql_model.revertAll()
        else:
            sql_model.select()
            view.selectRow(model.rowCount() - 1)
            self.load_planets()
        self.update_dashboard()

    # ── MENÚ CONTEXTUAL ───────────────────────────────────────
    def show_context_menu(self, position):
        current_tab = self.tabs.currentWidget()
        if not current_tab: return
        view = current_tab.property("view")
        if not view.selectionModel().selectedRows(): return
        menu = QMenu(self)
        menu.addAction("✏️  Editar Entrada", self.edit_row)
        menu.addAction("👯  Duplicar Fila", self.duplicate_row)
        menu.addSeparator()
        menu.addAction("🗑️  Eliminar Fila", self.del_row)
        menu.addSeparator()
        menu.addAction("📖  Modo Lore", self.show_lore_mode)
        menu.exec(view.mapToGlobal(position))

    # ── MODO LORE ─────────────────────────────────────────────
    def show_lore_mode(self):
        current_tab = self.tabs.currentWidget()
        if not current_tab: return
        view = current_tab.property("view")
        model = view.model()
        sql_model = self._get_sql_model(model)
        indices = view.selectionModel().selectedRows()
        if not indices:
            QMessageBox.warning(self, "Modo Lore", "Selecciona una fila primero.")
            return
        row = indices[0].row()
        display_col = self.get_display_column(model)
        primarios = ""
        secundarios = ""
        
        for col in range(model.columnCount()):
            val = model.data(model.index(row, col))
            name = model.headerData(col, Qt.Orientation.Horizontal)
            if not name or name in ("id", "image_path", "parent_id", "is_favorite"): continue
            v_str = str(val) if val else "—"
            if val:
                v_str = parse_wikilinks(v_str, self.current_planet_id, self.db_path)
            if name == display_col:
                title = v_str
            else:
                prop_html = f"<div style='margin-bottom:8px;'><strong style='color:#818cf8;'>{name}:</strong> <span style='color:#e2e8f0;'>{v_str}</span></div>"
                if len(str(val)) > 80:
                    secundarios += f"<h3 style='color:#818cf8; border-bottom: 1px solid #262b3d; margin-top: 25px; padding-bottom: 8px; font-size:16px;'>{name}</h3><p style='color:#cbd5e1; text-align:justify;'>{v_str}</p>"
                else:
                    primarios += prop_html

        html = f"""<html>
<body style='background-color:#0f111a; color:#cbd5e1; font-family:"Inter", "Segoe UI", sans-serif; padding:20px; line-height: 1.6; margin: 0;'>
    <div style='max-width: 800px; margin: 0 auto; background: #151822; padding: 40px; border-radius: 12px; border: 1px solid #262b3d; border-left: 6px solid #6366f1;'>
        <h1 style='color:#e2e8f0; font-size:36px; margin-bottom: 10px; font-variant: small-caps; letter-spacing: 1px;'>{title}</h1>
        <hr style='border: 0; height: 1px; background: #262b3d; margin-bottom: 30px;' />
        
        <div style='padding: 24px; margin-top: 15px; background-color: #1a1e2b; border-radius: 8px; border: 1px solid #262b3d; border-left: 4px solid #4f46e5;'>
            <h2 style='color:#e2e8f0; margin-top:0; border-bottom: 1px solid #262b3d; padding-bottom: 10px; font-size:18px;'>Atributos Base</h2>
            {primarios}
        </div>
        
        <div style='margin-top: 40px; color: #cbd5e1;'>
            {secundarios}
        </div>
    </div>
</body>
</html>"""

        dlg = QDialog(self)
        dlg.setWindowTitle(f"📖 Modo Lore — {title}")
        dlg.resize(720, 620)
        l = QVBoxLayout(dlg)
        from PyQt6.QtWidgets import QTextBrowser
        tb = QTextBrowser()
        tb.setHtml(html)
        tb.setOpenLinks(False)
        
        def handle_link_click(url):
            url_str = url.toString()
            if url_str.startswith("wikilink://"):
                path = url_str[11:]
                if "/" in path:
                    cat, r_id = path.split("/", 1)
                    try:
                        row_id = int(r_id)
                        self.select_entity(cat, row_id)
                        dlg.accept()
                    except Exception as e:
                        print("Error navigating link:", e)
            else:
                from PyQt6.QtGui import QDesktopServices
                QDesktopServices.openUrl(url)
                
        tb.anchorClicked.connect(handle_link_click)
        tb.setFont(QFont("Georgia", 13))
        img_col = sql_model.fieldIndex("image_path")
        if img_col != -1:
            img_path = model.data(model.index(row, img_col))
            resolved_img = resolve_path(self.db_path, img_path)
            if resolved_img and os.path.exists(resolved_img):
                il = QLabel()
                il.setPixmap(QPixmap(resolved_img).scaled(320, 240, Qt.AspectRatioMode.KeepAspectRatio, Qt.TransformationMode.SmoothTransformation))
                il.setAlignment(Qt.AlignmentFlag.AlignCenter)
                l.addWidget(il)
        l.addWidget(tb)
        export_row = QHBoxLayout()
        btn_h = QPushButton("📄 Guardar HTML")
        btn_h.clicked.connect(lambda: self.export_lore_html(title, tb.toHtml()))
        btn_t = QPushButton("📝 Guardar TXT")
        btn_t.clicked.connect(lambda: self.export_lore_txt(title, tb.toPlainText()))
        export_row.addWidget(btn_h); export_row.addWidget(btn_t)
        l.addLayout(export_row)
        dlg.exec()

    def export_lore_html(self, title, html):
        fpath, _ = QFileDialog.getSaveFileName(self, "Guardar Lore (HTML)", f"{title}.html", "HTML Files (*.html)")
        if fpath:
            with open(fpath, "w", encoding="utf-8") as f:
                f.write(f"<html><head><title>{title}</title><meta charset='UTF-8'></head><body style='font-family:Georgia,serif;padding:20px;color:#333;background:#f9f9f9;'>{html}</body></html>")
            QMessageBox.information(self, "Exportado", "Guardado como HTML.")

    def export_lore_txt(self, title, text):
        fpath, _ = QFileDialog.getSaveFileName(self, "Guardar Lore (TXT)", f"{title}.txt", "Text Files (*.txt)")
        if fpath:
            with open(fpath, "w", encoding="utf-8") as f:
                f.write(f"==== {title.upper()} ====\n\n{text}")
            QMessageBox.information(self, "Exportado", "Guardado como TXT.")

    # ── OPERACIONES DE TABLA ──────────────────────────────────
    def truncate_table(self):
        current_tab = self.tabs.currentWidget()
        if not current_tab: return
        tname = current_tab.property("table_name")
        cname = self.tabs.tabText(self.tabs.currentIndex())
        ans = QMessageBox.warning(self, "⚠️ Peligro", f"¿Purgar COMPLETAMENTE la pestaña «{cname}»?\nSe creará un backup automático.", QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No)
        if ans == QMessageBox.StandardButton.Yes:
            prog = QProgressDialog("Creando copia de seguridad y purgando datos...", None, 0, 0, self)
            prog.setWindowTitle("Operación de Seguridad")
            prog.setWindowModality(Qt.WindowModality.WindowModal)
            prog.setCancelButton(None)
            prog.show()
            QApplication.processEvents()

            self.truncate_thread = BackupAndTruncateThread(tname, self.db_path)
            
            def on_finished(ok, msg):
                prog.close()
                if ok:
                    view = current_tab.property("view")
                    if view:
                        sql_model = self._get_sql_model(view.model())
                        if sql_model:
                            sql_model.select()
                    self.load_planets()
                    self.update_dashboard()
                    QMessageBox.information(self, "Purgado", msg)
                else:
                    QMessageBox.critical(self, "Error", msg)
            
            self.truncate_thread.finished.connect(on_finished)
            self.truncate_thread.start()

    def import_csv(self):
        p_id = self.current_planet_id
        if not p_id: return
        
        # Bloque Antifallos: Pedir categoría exacta de destino
        cats = database.get_planet_categories(p_id, self.db_path)
        cat_names = [c[1] for c in cats]
        current_tab_name = self.tabs.tabText(self.tabs.currentIndex()) if self.tabs.count() > 0 else ""
        default_idx = cat_names.index(current_tab_name) if current_tab_name in cat_names else 0
        
        target_name, ok = QInputDialog.getItem(
            self, 
            "🌍 Seleccionar Destino", 
            "Para evitar errores, confirma en qué tabla vas a inyectar estos archivos:", 
            cat_names, 
            default_idx, 
            False
        )
        if not ok or not target_name: return
        
        table_name = next((c[2] for c in cats if c[1] == target_name), None)
        if not table_name: return
        
        files, _ = QFileDialog.getOpenFileNames(self, "Seleccionar CSV/XLSX", "", "Data Files (*.csv *.xlsx)")
        if not files: return
        
        self.prog = QProgressDialog("Importando batajones de datos...", "Abortar", 0, len(files), self)
        self.prog.setWindowTitle("Carga Masiva")
        self.prog.setWindowModality(Qt.WindowModality.WindowModal)
        self.prog.setAutoClose(True)
        self.prog.show()

        self.import_thread = CsvImportThread(table_name, files, self.db_path)
        self.prog.canceled.connect(self.import_thread.cancel)

        def handle_progress(idx, msg):
            self.prog.setLabelText(msg)
            self.prog.setValue(idx)
        
        def handle_finished(ok, msg):
            if not ok:
                QMessageBox.warning(self, "Importación Detenida", msg)
            else:
                QMessageBox.information(self, "Carga Completa", msg)
            
            # MAGIA: Refrescar y encender la pestaña donde se guardaron los datos
            self._switch_to_tab(target_name)
            if self.tabs.currentWidget():
                view = self.tabs.currentWidget().property("view")
                if view: view.model().select()
            self.load_planets()
            self.update_dashboard()

        self.import_thread.progress.connect(handle_progress)
        self.import_thread.finished.connect(handle_finished)
        self.import_thread.start()

    def export_database(self):
        dir_path = QFileDialog.getExistingDirectory(self, "Carpeta Destino")
        if dir_path:
            ok, msg = database.export_db(dir_path, self.db_path)
            (QMessageBox.information if ok else QMessageBox.warning)(self, "Exportación", msg)

    def export_current_planet(self):
        p_id = self.get_selected_planet_id()
        p_name = self.get_selected_planet_name()
        if not p_id: return
        file_path, _ = QFileDialog.getSaveFileName(self, "Exportar Planeta", f"{p_name}_export.zip", "ZIP (*.zip)")
        if file_path:
            ok, msg = database.export_planet(p_id, p_name, file_path, self.db_path)
            (QMessageBox.information if ok else QMessageBox.warning)(self, "Exportación", msg)

    def new_planet(self):
        name, ok = QInputDialog.getText(self, "✨ Nuevo Planeta", "Nombre del nuevo mundo:")
        if ok and name.strip():
            p_id, err = database.add_new_planet(name.strip(), self.db_path)
            if err: QMessageBox.warning(self, "Error", err)
            else: self.load_planets()

    def clone_planet(self):
        source_id = self.get_selected_planet_id()
        if not source_id:
            QMessageBox.information(self, "Clonar", "Primero selecciona un planeta.")
            return
        name, ok = QInputDialog.getText(self, "🧬 Clonar Planeta", "Nombre del nuevo mundo clon:")
        if ok and name.strip():
            try:
                conn = database.get_connection(self.db_path)
                cursor = conn.cursor()
                cursor.execute("SELECT COUNT(*) FROM categories WHERE planet_id = ?", (source_id,))
                total = cursor.fetchone()[0]
                conn.close()
            except:
                total = 24
                
            prog = QProgressDialog("Clonando planeta...", "Abortar", 0, total, self)
            prog.setWindowTitle("Clonación en Progreso")
            prog.setWindowModality(Qt.WindowModality.WindowModal)
            prog.setAutoClose(True)
            prog.show()

            self.clone_thread = ClonePlanetThread(source_id, name.strip(), self.db_path)
            prog.canceled.connect(self.clone_thread.terminate)

            def handle_progress(idx, msg):
                prog.setLabelText(msg)
                prog.setValue(idx)
                
            def handle_finished(ok, msg):
                prog.close()
                if not ok:
                    QMessageBox.warning(self, "Error al Clonar", msg)
                else:
                    QMessageBox.information(self, "Clonación Completa", msg)
                    self.load_planets()
                    
            self.clone_thread.progress.connect(handle_progress)
            self.clone_thread.finished.connect(handle_finished)
            self.clone_thread.start()

    # ── MÓDULOS DE FASE 2 ─────────────────────────────────────
    def generate_lore_book(self):
        p_id = self.get_selected_planet_id()
        p_name = self.get_selected_planet_name()
        if not p_id: return
        
        # Verificar tamaño de las categorías del planeta
        cats = database.get_planet_categories(p_id, self.db_path)
        conn = database.get_connection(self.db_path)
        cursor = conn.cursor()
        large_cats = []
        for _, cat_name, table_name in cats:
            try:
                cursor.execute(f'SELECT COUNT(*) FROM "{table_name}"')
                cnt = cursor.fetchone()[0]
                if cnt > 5000:
                    large_cats.append((cat_name, table_name, cnt))
            except:
                pass
        conn.close()

        export_limit = None
        excluded_tables = set()

        if large_cats:
            msg_warn = QMessageBox(self)
            msg_warn.setWindowTitle("Advertencia de Rendimiento")
            msg_warn.setIcon(QMessageBox.Icon.Warning)
            
            cats_text = "\n".join([f"• {name} ({count:,} registros)" for name, _, count in large_cats])
            msg_warn.setText(
                f"El planeta '{p_name}' contiene categorías masivas que exceden los 5,000 registros:\n\n"
                f"{cats_text}\n\n"
                "Exportar todos estos datos causará que la aplicación se congele o se quede sin memoria (OOM).\n"
                "¿Cómo desea proceder con la exportación?"
            )
            
            btn_limit = msg_warn.addButton("Limitar a 500 registros", QMessageBox.ButtonRole.AcceptRole)
            btn_exclude = msg_warn.addButton("Excluir estas categorías", QMessageBox.ButtonRole.DestructiveRole)
            btn_cancel = msg_warn.addButton("Cancelar exportación", QMessageBox.ButtonRole.RejectRole)
            
            msg_warn.exec()
            clicked = msg_warn.clickedButton()
            
            if clicked == btn_limit:
                export_limit = 500
            elif clicked == btn_exclude:
                for _, table_name, _ in large_cats:
                    excluded_tables.add(table_name)
            else:
                return

        msg = QMessageBox(self)
        msg.setWindowTitle("Formato de Exportación Premium")
        msg.setText("Elige el formato de exportación para tu Compendio de Lore:")
        btn_html = msg.addButton("🌐 Wiki Web Digital (HTML interactivo + Media)", QMessageBox.ButtonRole.ActionRole)
        btn_obsidian = msg.addButton("📂 Obsidian Markdown Vault (Enlaces y Carpetas)", QMessageBox.ButtonRole.ActionRole)
        btn_pdf = msg.addButton("📄 Documento Estático (PDF de Pergamino)", QMessageBox.ButtonRole.ActionRole)
        msg.addButton("Cancelar", QMessageBox.ButtonRole.RejectRole)
        msg.exec()
        
        clicked_btn = msg.clickedButton()
        if clicked_btn == btn_html:
            export_format = "html"
        elif clicked_btn == btn_obsidian:
            export_format = "obsidian"
        elif clicked_btn == btn_pdf:
            export_format = "pdf"
        else:
            return

        if export_format == "obsidian":
            dest_dir = QFileDialog.getExistingDirectory(self, "Seleccionar Carpeta para crear Obsidian Vault")
            if not dest_dir: return
            vault_path = os.path.join(dest_dir, f"{p_name}_Obsidian_Vault")
            os.makedirs(vault_path, exist_ok=True)
            
            conn = database.get_connection(self.db_path)
            cursor = conn.cursor()
            
            for _, cat_name, table_name in cats:
                if table_name in excluded_tables:
                    continue
                cat_dir = os.path.join(vault_path, cat_name)
                os.makedirs(cat_dir, exist_ok=True)
                
                try:
                    if export_limit:
                        cursor.execute(f'SELECT * FROM "{table_name}" LIMIT ?', (export_limit,))
                    else:
                        cursor.execute(f'SELECT * FROM "{table_name}"')
                    rows = cursor.fetchall()
                except:
                    rows = []
                if not rows: continue
                
                cursor.execute(f'PRAGMA table_info("{table_name}")')
                columns = [info[1] for info in cursor.fetchall()]
                
                for row in rows:
                    name_idx = 1
                    item_name = str(row[name_idx]) if row[name_idx] else f"Entidad_{row[0]}"
                    # Sanitize filename
                    safe_filename = "".join([c for c in item_name if c.isalpha() or c.isdigit() or c in (' ', '_', '-')]).strip()
                    if not safe_filename:
                        safe_filename = f"Entidad_{row[0]}"
                    file_path = os.path.join(cat_dir, f"{safe_filename}.md")
                    
                    md_content = "---\n"
                    md_content += f"categoria: \"{cat_name}\"\n"
                    if "is_favorite" in [c.lower() for c in columns]:
                        fav_val = row[columns.index("is_favorite")]
                        md_content += f"favorito: {bool(fav_val)}\n"
                    
                    parent_val = 0
                    if "parent_id" in [c.lower() for c in columns]:
                        parent_val = row[columns.index("parent_id")]
                        if parent_val and parent_val > 0:
                            try:
                                cursor2 = conn.cursor()
                                cursor2.execute(f'SELECT "{columns[name_idx]}" FROM "{table_name}" WHERE id = ?', (parent_val,))
                                p_res = cursor2.fetchone()
                                if p_res and p_res[0]:
                                    md_content += f"parent: \"[[{p_res[0]}]]\"\n"
                            except:
                                pass
                    md_content += "---\n\n"
                    md_content += f"# {item_name}\n\n"
                    
                    if "image_path" in [c.lower() for c in columns]:
                        img_val = row[columns.index("image_path")]
                        if img_val:
                            resolved_img = resolve_path(self.db_path, img_val)
                            if resolved_img and os.path.exists(resolved_img):
                                vault_media_dir = os.path.join(vault_path, "_media")
                                os.makedirs(vault_media_dir, exist_ok=True)
                                new_img_name = f"{table_name}_{row[0]}_{os.path.basename(resolved_img)}"
                                shutil.copy(resolved_img, os.path.join(vault_media_dir, new_img_name))
                                md_content += f"![[../_media/{new_img_name}]]\n\n"
                    
                    md_content += "## Detalles\n\n"
                    large_texts = []
                    for idx, col_name in enumerate(columns):
                        if col_name.lower() in ("id", "parent_id", "image_path", "nombre", "nombre_completo", "is_favorite"):
                            continue
                        val = row[idx]
                        if val:
                            val_str = str(val).strip()
                            if len(val_str) > 120:
                                large_texts.append((col_name, val_str))
                            else:
                                md_content += f"- **{col_name}**: {val_str}\n"
                    
                    if large_texts:
                        md_content += "\n## Descripciones e Historias\n\n"
                        for title, text in large_texts:
                            md_content += f"### {title}\n\n{text}\n\n"
                    
                    try:
                        cursor2 = conn.cursor()
                        cursor2.execute(f'SELECT "{columns[name_idx]}" FROM "{table_name}" WHERE parent_id = ?', (row[0],))
                        children = cursor2.fetchall()
                        if children:
                            md_content += "\n## Entidades Relacionadas / Hijas\n\n"
                            for child in children:
                                if child[0]:
                                    md_content += f"- [[{child[0]}]]\n"
                    except:
                        pass
                    
                    with open(file_path, "w", encoding="utf-8") as f:
                        f.write(md_content)
            
            conn.close()
            QMessageBox.information(self, "Obsidian Vault Exportado", f"Se ha exportado el vault de Obsidian exitosamente a:\n{vault_path}")
            return

        elif export_format == "html":
            default_name = f"{p_name}_Wiki.html"
            file_path, _ = QFileDialog.getSaveFileName(self, "Exportar Wiki Interactivas", default_name, "HTML Files (*.html)")
            if not file_path: return
            
            import json
            planet_data_dict = {}
            conn = database.get_connection(self.db_path)
            cursor = conn.cursor()
            
            for _, cat_name, table_name in cats:
                if table_name in excluded_tables:
                    continue
                try:
                    if export_limit:
                        cursor.execute(f'SELECT * FROM "{table_name}" LIMIT ?', (export_limit,))
                    else:
                        cursor.execute(f'SELECT * FROM "{table_name}"')
                    rows = cursor.fetchall()
                except:
                    rows = []
                if not rows: continue
                
                cursor.execute(f'PRAGMA table_info("{table_name}")')
                columns = [info[1] for info in cursor.fetchall()]
                
                cat_items = []
                for row in rows:
                    item_data = {}
                    name_idx = 1
                    item_data["Nombre"] = str(row[name_idx]) if row[name_idx] else "Desconocido"
                    item_data["id"] = row[0]
                    
                    img_val = ""
                    if "image_path" in [c.lower() for c in columns]:
                        img_val = row[columns.index("image_path")]
                        if img_val:
                            html_media_dir = os.path.join(os.path.dirname(file_path), f"{p_name}_media")
                            os.makedirs(html_media_dir, exist_ok=True)
                            resolved_img = resolve_path(self.db_path, img_val)
                            if resolved_img and os.path.exists(resolved_img):
                                new_img_name = f"{table_name}_{row[0]}_{os.path.basename(resolved_img)}"
                                shutil.copy(resolved_img, os.path.join(html_media_dir, new_img_name))
                                img_val = f"{p_name}_media/{new_img_name}"
                    item_data["image"] = img_val
                    
                    parent_name = ""
                    if "parent_id" in [c.lower() for c in columns]:
                        parent_val = row[columns.index("parent_id")]
                        if parent_val and parent_val > 0:
                            try:
                                cursor2 = conn.cursor()
                                cursor2.execute(f'SELECT "{columns[name_idx]}" FROM "{table_name}" WHERE id = ?', (parent_val,))
                                p_res = cursor2.fetchone()
                                if p_res and p_res[0]:
                                    parent_name = p_res[0]
                            except:
                                pass
                    item_data["parent_name"] = parent_name
                    
                    fav_val = 0
                    if "is_favorite" in [c.lower() for c in columns]:
                        fav_val = row[columns.index("is_favorite")]
                    item_data["is_favorite"] = bool(fav_val)
                    
                    attrs = {}
                    for idx, col_name in enumerate(columns):
                        if col_name.lower() in ("id", "parent_id", "image_path", "nombre", "nombre_completo", "is_favorite"):
                            continue
                        val = row[idx]
                        if val:
                            attrs[col_name] = str(val)
                    item_data["properties"] = attrs
                    
                    children_names = []
                    try:
                        cursor2 = conn.cursor()
                        cursor2.execute(f'SELECT "{columns[name_idx]}" FROM "{table_name}" WHERE parent_id = ?', (row[0],))
                        for c_row in cursor2.fetchall():
                            if c_row[0]:
                                children_names.append(c_row[0])
                    except:
                        pass
                    item_data["children"] = children_names
                    
                    cat_items.append(item_data)
                    
                planet_data_dict[cat_name] = cat_items
            conn.close()
            
            html_template = """<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Wiki de Mundo: {p_name}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-main: #0f111a;
            --bg-sidebar: #090a0f;
            --bg-card: #151822;
            --border-color: #262b3d;
            --accent-color: #6366f1;
            --accent-hover: #818cf8;
            --text-main: #cbd5e1;
            --text-title: #f8fafc;
            --gold: #fbbf24;
        }
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        body {
            background-color: var(--bg-main);
            color: var(--text-main);
            font-family: 'Inter', sans-serif;
            display: flex;
            height: 100vh;
            overflow: hidden;
        }
        .sidebar {
            width: 300px;
            background-color: var(--bg-sidebar);
            border-right: 1px solid var(--border-color);
            display: flex;
            flex-direction: column;
            height: 100%;
        }
        .sidebar-header {
            padding: 24px;
            border-bottom: 1px solid var(--border-color);
            text-align: center;
        }
        .sidebar-header h1 {
            font-family: 'Outfit', sans-serif;
            font-size: 24px;
            color: var(--text-title);
            font-weight: 800;
            letter-spacing: 0.5px;
        }
        .search-box {
            padding: 16px 20px;
            border-bottom: 1px solid var(--border-color);
        }
        .search-box input {
            width: 100%;
            padding: 10px 14px;
            border-radius: 6px;
            border: 1px solid var(--border-color);
            background-color: #12131a;
            color: var(--text-title);
            font-size: 14px;
            outline: none;
            transition: border-color 0.2s;
        }
        .search-box input:focus {
            border-color: var(--accent-color);
        }
        .category-list {
            flex: 1;
            overflow-y: auto;
            padding: 20px 12px;
        }
        .category-item {
            padding: 10px 14px;
            border-radius: 6px;
            cursor: pointer;
            margin-bottom: 6px;
            font-weight: 500;
            font-size: 14px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: all 0.2s;
        }
        .category-item:hover, .category-item.active {
            background-color: rgba(99, 102, 241, 0.1);
            color: var(--accent-hover);
        }
        .category-item.active {
            font-weight: 600;
            border-left: 3px solid var(--accent-color);
            border-radius: 0 6px 6px 0;
            padding-left: 11px;
        }
        .badge {
            background-color: #1a1b24;
            color: #64748b;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
        }
        .category-item.active .badge {
            background-color: var(--accent-color);
            color: #ffffff;
        }
        .content-area {
            flex: 1;
            display: flex;
            flex-direction: column;
            height: 100%;
            overflow: hidden;
        }
        .content-header {
            padding: 24px 32px;
            border-bottom: 1px solid var(--border-color);
            background-color: rgba(15, 17, 26, 0.8);
            backdrop-filter: blur(10px);
            z-index: 10;
        }
        .content-header h2 {
            font-family: 'Outfit', sans-serif;
            font-size: 28px;
            color: var(--text-title);
        }
        .main-scroll {
            flex: 1;
            overflow-y: auto;
            padding: 32px;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
            gap: 20px;
        }
        .card {
            background-color: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 10px;
            padding: 20px;
            cursor: pointer;
            transition: all 0.25s ease;
            display: flex;
            flex-direction: column;
            position: relative;
            overflow: hidden;
        }
        .card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 4px;
            height: 100%;
            background-color: var(--accent-color);
            opacity: 0.7;
        }
        .card:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 20px -8px rgba(0,0,0,0.6);
            border-color: #3b425c;
        }
        .card.favorite::after {
            content: '⭐';
            position: absolute;
            top: 12px;
            right: 12px;
            font-size: 14px;
        }
        .card h3 {
            color: var(--text-title);
            font-size: 18px;
            margin-bottom: 10px;
            font-family: 'Outfit', sans-serif;
            font-weight: 700;
        }
        .card-desc {
            font-size: 13px;
            color: #94a3b8;
            line-height: 1.5;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        .detail-view {
            display: none;
            flex-direction: column;
            animation: fadeIn 0.3s;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .btn-back {
            background-color: transparent;
            border: 1px solid var(--border-color);
            color: var(--text-main);
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 600;
            align-self: flex-start;
            margin-bottom: 24px;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s;
        }
        .btn-back:hover {
            background-color: #161a24;
            color: var(--text-title);
        }
        .detail-card {
            background-color: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 32px;
            display: flex;
            gap: 32px;
            margin-bottom: 24px;
        }
        .detail-img-container {
            width: 300px;
            height: 200px;
            background-color: #0b0c12;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
        .detail-img-container img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        .detail-img-placeholder {
            color: #475569;
            font-size: 48px;
        }
        .detail-info {
            flex: 1;
        }
        .detail-info h2 {
            font-family: 'Outfit', sans-serif;
            font-size: 32px;
            color: var(--text-title);
            margin-bottom: 6px;
            font-weight: 800;
        }
        .detail-info .meta {
            font-size: 13px;
            color: var(--accent-hover);
            font-weight: 600;
            margin-bottom: 20px;
            display: flex;
            gap: 12px;
        }
        .attributes-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
            gap: 16px;
            margin-top: 20px;
        }
        .attribute-item {
            background-color: #1c202e;
            padding: 12px 16px;
            border-radius: 6px;
            border-left: 3px solid #4f46e5;
        }
        .attr-name {
            font-size: 11px;
            color: #64748b;
            text-transform: uppercase;
            font-weight: 700;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
        }
        .attr-value {
            font-size: 14px;
            color: var(--text-title);
            font-weight: 500;
        }
        .desc-section {
            margin-top: 24px;
            border-top: 1px solid var(--border-color);
            padding-top: 24px;
        }
        .desc-section h3 {
            font-family: 'Outfit', sans-serif;
            font-size: 18px;
            color: var(--text-title);
            margin-bottom: 12px;
        }
        .desc-text {
            line-height: 1.6;
            font-size: 14px;
            color: #94a3b8;
            white-space: pre-wrap;
            text-align: justify;
        }
        .related-section {
            margin-top: 24px;
            background-color: #0b0c12;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid var(--border-color);
        }
        .related-section h3 {
            font-family: 'Outfit', sans-serif;
            font-size: 14px;
            color: var(--text-title);
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .related-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        .related-tag {
            background-color: #1e293b;
            color: var(--text-title);
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        .related-tag:hover {
            background-color: var(--accent-color);
        }
    </style>
</head>
<body>
    <div class="sidebar">
        <div class="sidebar-header">
            <h1>🪐 {p_name}</h1>
        </div>
        <div class="search-box">
            <input type="text" id="search-input" placeholder="Buscar entidad...">
        </div>
        <div class="category-list" id="categories-container"></div>
    </div>
    <div class="content-area">
        <div class="content-header">
            <h2 id="current-category-title">Selecciona una categoría</h2>
        </div>
        <div class="main-scroll">
            <div class="grid" id="items-grid"></div>
            <div class="detail-view" id="detail-panel">
                <button class="btn-back" onclick="showListView()">← Volver a la Lista</button>
                <div class="detail-card">
                    <div class="detail-img-container" id="detail-image-box"></div>
                    <div class="detail-info">
                        <h2 id="detail-title">Nombre</h2>
                        <div class="meta" id="detail-meta"></div>
                        <div class="attributes-grid" id="detail-attributes"></div>
                    </div>
                </div>
                <div class="desc-section" id="detail-desc-box"></div>
                <div class="related-section" id="detail-related-box" style="display:none;">
                    <h3>Entidades Relacionadas</h3>
                    <div class="related-tags" id="detail-related-tags"></div>
                </div>
            </div>
        </div>
    </div>
    <script>
        const planetData = {JSON_DATA_STRING};
        let currentCategory = "";
        function buildCategories() {
            const container = document.getElementById("categories-container");
            container.innerHTML = "";
            let first = true;
            for (const cat in planetData) {
                const item = document.createElement("div");
                item.className = "category-item" + (first ? " active" : "");
                item.innerHTML = `<span>${cat}</span><span class="badge">${planetData[cat].length}</span>`;
                const localCat = cat;
                item.onclick = () => selectCategory(localCat, item);
                container.appendChild(item);
                if (first) {
                    currentCategory = cat;
                    first = false;
                }
            }
            if (currentCategory) {
                renderList();
            }
        }
        function selectCategory(cat, element) {
            document.querySelectorAll(".category-item").forEach(el => el.classList.remove("active"));
            element.classList.add("active");
            currentCategory = cat;
            showListView();
            renderList();
        }
        function renderList() {
            document.getElementById("current-category-title").innerText = currentCategory;
            const grid = document.getElementById("items-grid");
            grid.innerHTML = "";
            const search = document.getElementById("search-input").value.trim().toLowerCase();
            const items = planetData[currentCategory] || [];
            items.forEach(item => {
                if (search && !item.Nombre.toLowerCase().includes(search)) {
                    return;
                }
                const card = document.createElement("div");
                card.className = "card" + (item.is_favorite ? " favorite" : "");
                let desc = "";
                for (const k in item.properties) {
                    if (k.toLowerCase().includes("descrip") || k.toLowerCase().includes("resumen")) {
                        desc = item.properties[k];
                        break;
                    }
                }
                if (!desc && Object.values(item.properties).length > 0) {
                    desc = Object.values(item.properties)[0];
                }
                card.innerHTML = `<h3>${item.Nombre}</h3><div class="card-desc">${desc || "Sin descripción."}</div>`;
                card.onclick = () => showDetail(item);
                grid.appendChild(card);
            });
        }
        function showDetail(item) {
            document.getElementById("items-grid").style.display = "none";
            const panel = document.getElementById("detail-panel");
            panel.style.display = "flex";
            document.getElementById("detail-title").innerText = item.Nombre;
            document.getElementById("detail-meta").innerHTML = `
                <span>Categoría: ${currentCategory}</span>
                ${item.parent_name ? `<span>Pertenece a: ${item.parent_name}</span>` : ""}
                ${item.is_favorite ? `<span>⭐ Destacado</span>` : ""}
            `;
            const imgBox = document.getElementById("detail-image-box");
            if (item.image) {
                imgBox.innerHTML = `<img src="${item.image}" alt="${item.Nombre}">`;
            } else {
                imgBox.innerHTML = `<div class="detail-img-placeholder">📷</div>`;
            }
            const attrGrid = document.getElementById("detail-attributes");
            attrGrid.innerHTML = "";
            const descBox = document.getElementById("detail-desc-box");
            descBox.innerHTML = "";
            for (const k in item.properties) {
                const val = item.properties[k];
                if (val.length > 120) {
                    descBox.innerHTML += `<h3>${k}</h3><div class="desc-text">${val}</div>`;
                } else {
                    const el = document.createElement("div");
                    el.className = "attribute-item";
                    el.innerHTML = `<div class="attr-name">${k}</div><div class="attr-value">${val}</div>`;
                    attrGrid.appendChild(el);
                }
            }
            const relBox = document.getElementById("detail-related-box");
            const tagsBox = document.getElementById("detail-related-tags");
            tagsBox.innerHTML = "";
            if (item.children && item.children.length > 0) {
                relBox.style.display = "block";
                item.children.forEach(name => {
                    const tag = document.createElement("div");
                    tag.className = "related-tag";
                    tag.innerText = name;
                    tag.onclick = () => jumpToItem(name);
                    tagsBox.appendChild(tag);
                });
            } else {
                relBox.style.display = "none";
            }
        }
        function jumpToItem(name) {
            let found = null;
            let foundCat = "";
            for (const cat in planetData) {
                const item = planetData[cat].find(i => i.Nombre === name);
                if (item) {
                    found = item;
                    foundCat = cat;
                    break;
                }
            }
            if (found) {
                if (foundCat !== currentCategory) {
                    const items = document.querySelectorAll(".category-item");
                    items.forEach(item => {
                        if (item.firstChild.innerText === foundCat) {
                            selectCategory(foundCat, item);
                        }
                    });
                }
                showDetail(found);
            }
        }
        function showListView() {
            document.getElementById("items-grid").style.display = "grid";
            document.getElementById("detail-panel").style.display = "none";
        }
        document.getElementById("search-input").oninput = renderList;
        window.onload = buildCategories;
    </script>
</body>
</html>"""
            final_html = html_template.replace("{p_name}", p_name).replace("{JSON_DATA_STRING}", json.dumps(planet_data_dict, ensure_ascii=False))
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(final_html)
            QMessageBox.information(self, "Wiki Web Generada", f"La Wiki interactiva ha sido generada exitosamente en:\n{file_path}")
            return

        elif export_format == "pdf":
            default_name = f"{p_name}_Libro_Parchamiento.pdf"
            file_path, _ = QFileDialog.getSaveFileName(self, "Exportar Libro (PDF)", default_name, "PDF Files (*.pdf)")
            if not file_path: return
            
            pdf_html = f"""<!DOCTYPE html>
            <html>
            <head>
            <meta charset="utf-8">
            <style>
                body {{
                    font-family: 'Georgia', serif;
                    color: #2d1e18;
                    background-color: #f5ebd5;
                    padding: 40px;
                    line-height: 1.5;
                }}
                h1 {{
                    text-align: center;
                    color: #4a2810;
                    font-size: 28px;
                    border-bottom: 3px double #8a6d5c;
                    padding-bottom: 12px;
                    font-variant: small-caps;
                }}
                h2 {{
                    color: #5c3515;
                    font-size: 20px;
                    border-bottom: 1px solid #c2b097;
                    margin-top: 40px;
                    padding-bottom: 6px;
                }}
                .card {{
                    margin-bottom: 25px;
                    page-break-inside: avoid;
                    padding: 15px;
                    border: 1px solid #dfd5c0;
                    background-color: #faf6eb;
                    border-radius: 4px;
                }}
                h3 {{
                    margin-top: 0;
                    color: #4a2810;
                    font-size: 16px;
                    border-bottom: 1px dashed #dcd1bb;
                    padding-bottom: 4px;
                }}
                ul {{
                    list-style-type: none;
                    padding-left: 0;
                }}
                li {{
                    margin-bottom: 6px;
                    font-size: 13px;
                }}
                b {{
                    color: #5c3515;
                }}
                p {{
                    margin-top: 8px;
                    font-size: 13px;
                    text-align: justify;
                }}
            </style>
            </head>
            <body>
            <h1>Libro Planetario: {p_name}</h1>
            """
            
            conn = database.get_connection(self.db_path)
            cursor = conn.cursor()
            for _, cat_name, table_name in cats:
                if table_name in excluded_tables:
                    continue
                try:
                    if export_limit:
                        cursor.execute(f'SELECT * FROM "{table_name}" LIMIT ?', (export_limit,))
                    else:
                        cursor.execute(f'SELECT * FROM "{table_name}"')
                    rows = cursor.fetchall()
                    cursor.execute(f'PRAGMA table_info("{table_name}")')
                    columns = [info[1] for info in cursor.fetchall()]
                except:
                    continue
                if not rows: continue
                
                pdf_html += f"<h2>{cat_name}</h2>"
                for row in rows:
                    name_idx = 1
                    item_name = str(row[name_idx]) if row[name_idx] else "Desconocido"
                    pdf_html += f"<div class='card'><h3>{item_name}</h3><ul>"
                    descriptions = []
                    for idx, col_name in enumerate(columns):
                        if col_name.lower() in ("id", "parent_id", "image_path", "nombre", "nombre_completo", "is_favorite"): continue
                        val = row[idx]
                        if val:
                            val_str = str(val).strip()
                            if len(val_str) > 120:
                                descriptions.append((col_name, val_str))
                            else:
                                pdf_html += f"<li><b>{col_name}:</b> {val_str}</li>"
                    pdf_html += "</ul>"
                    
                    for desc_title, desc_text in descriptions:
                        pdf_html += f"<p><b>{desc_title}:</b> {desc_text}</p>"
                    
                    pdf_html += "</div>"
            pdf_html += "</body></html>"
            conn.close()
            
            printer = QPrinter(QPrinter.PrinterMode.HighResolution)
            printer.setOutputFormat(QPrinter.OutputFormat.PdfFormat)
            printer.setOutputFileName(file_path)
            
            doc = QTextDocument()
            doc.setHtml(pdf_html)
            doc.print(printer)
            
            QMessageBox.information(self, "Libro Generado", f"El Libro Planetario ha sido exportado exitosamente como PDF.")
            return

    def show_timeline(self):
        p_id = self.get_selected_planet_id()
        if not p_id: return
        dlg = TimelineManagerDialog(self, p_id, self.db_path)
        dlg.exec()

    def show_statistics(self):
        p_id = self.get_selected_planet_id()
        if not p_id: return
        dlg = StatsDashboardDialog(self, p_id, self.db_path)
        dlg.exec()

    def show_name_generator(self):
        p_id = self.get_selected_planet_id()
        if not p_id:
            QMessageBox.information(self, "Aviso", "Seleccione un planeta antes de abrir la suite de generación.")
            return
        dlg = NameGeneratorSuiteDialog(self, p_id, self.db_path)
        dlg.exec()

    # ── ESQUEMA EVOLUTIVO (Columnas Dinámicas) ─────────────────
    def add_new_attribute(self):
        current_tab = self.tabs.currentWidget()
        if not current_tab: return
        table_name = current_tab.property("table_name")
        if not table_name: return
        
        name, ok = QInputDialog.getText(self, "Nuevo Atributo", "Nombre de la columna extra (ej: 'Nivel de Humedad'):")
        if ok and name.strip():
            safe_name = name.strip().replace('"', '""')
            try:
                conn = database.get_connection(self.db_path)
                cursor = conn.cursor()
                cursor.execute(f'ALTER TABLE "{table_name}" ADD COLUMN "{safe_name}" TEXT DEFAULT ""')
                conn.commit()
                conn.close()
                QMessageBox.information(self, "Evolución", f"La categoría ha mutado. Se ha grabado '{name.strip()}' en la base de datos.")
                
                # Refrescar la UI silenciosamente para mostrar el nuevo campo
                idx = self.tabs.currentIndex()
                self.load_planet_data(self.current_planet_id)
                self.tabs.setCurrentIndex(idx)
                self._enable_planet_buttons(True)
            except Exception as e:
                QMessageBox.warning(self, "Error Estructural", f"Fallo al inyectar campo: {e}")

    # ── TEMAS ─────────────────────────────────────────────────
    def change_theme(self, theme_name):
        app = QApplication.instance()
        base_dir = os.path.dirname(__file__)
        if theme_name.startswith("Clásico"):
            style_path = os.path.join(base_dir, "styles.qss")
        else:
            fname_map = {"Hollow Knight": "hollow_knight.qss", "Warhammer 40k": "warhammer.qss", "D&D": "dnd.qss"}
            fname = fname_map.get(theme_name, "")
            style_path = os.path.join(base_dir, "themes", fname) if fname else ""
        if style_path and os.path.exists(style_path):
            with open(style_path, "r", encoding="utf-8") as f:
                app.setStyleSheet(f.read())
        else:
            app.setStyleSheet("")

    # ── MODO LINAJE ───────────────────────────────────────────
    def show_tree_mode(self):
        current_tab = self.tabs.currentWidget()
        if not current_tab: return
        table_name = current_tab.property("table_name")
        
        # Consultar conteo rápido para evitar Out Of Memory y congelamiento
        try:
            conn = database.get_connection(self.db_path)
            cursor = conn.cursor()
            cursor.execute(f'SELECT COUNT(*) FROM "{table_name}"')
            count = cursor.fetchone()[0]
            conn.close()
        except:
            count = 0

        if count > 3000:
            cat_name = self.tabs.tabText(self.tabs.currentIndex())
            QMessageBox.warning(
                self, 
                "Estructura Demasiado Grande",
                f"La categoría '{cat_name}' contiene {count:,} registros.\n\n"
                "Construir un árbol jerárquico completo para esta cantidad de elementos causaría "
                "un congelamiento o caída de la aplicación.\n\n"
                "Se recomienda usar el Buscador Universal o los filtros por nivel en la barra lateral."
            )
            return

        view = current_tab.property("view")
        model = view.model()
        display_column = self.get_display_column(model)
        dlg = LineageTreeDialog(self, table_name, self.db_path, display_column)
        dlg.exec()

    def show_schema_manager(self):
        p_id = self.get_selected_planet_id()
        if not p_id: return
        dlg = SchemaManagerDialog(self, p_id, self.db_path)
        dlg.exec()

    def show_rpg_simulator(self):
        p_id = self.get_selected_planet_id()
        if not p_id: return
        dlg = RpgProgressionSimulatorDialog(self, p_id, self.db_path)
        dlg.exec()

    # ── BUSCADOR UNIVERSAL (INTERSOLAR) ────────────────────────
    def show_cartography(self):
        p_id = self.get_selected_planet_id()
        if not p_id: return
        dlg = CartografiaDialog(self, p_id, self.db_path)
        dlg.exec()

    def show_global_search(self):
        dlg = QDialog(self)
        dlg.setWindowTitle("🔍 Buscador Universal Intersolar")
        dlg.resize(800, 500)
        layout = QVBoxLayout(dlg)
        
        search_layout = QHBoxLayout()
        inp_search = QLineEdit()
        inp_search.setPlaceholderText("Ej: Dragon, Athensia, Solaris... (min 2 caracteres)")
        btn_search = QPushButton("Buscar")
        btn_search.setObjectName("btn_save")
        btn_search.setFixedWidth(100)
        search_layout.addWidget(inp_search)
        search_layout.addWidget(btn_search)
        layout.addLayout(search_layout)
        
        tree = QTreeWidget()
        tree.setHeaderLabels(["Nombre / Registro", "Categoría", "Planeta"])
        tree.setColumnWidth(0, 380)
        tree.setColumnWidth(1, 200)
        tree.setColumnWidth(2, 180)
        layout.addWidget(tree)

        lbl_status = QLabel("Escribe un termino (min 2 caracteres) y presiona Enter o espera 350ms.")
        lbl_status.setObjectName("status_text")
        layout.addWidget(lbl_status)

        search_timer = QTimer()
        search_timer.setSingleShot(True)
        search_timer.setInterval(350)

        def execute_search():
            term = inp_search.text().strip()
            if len(term) < 2:
                lbl_status.setText("Escribe al menos 2 caracteres.")
                return
            tree.clear()
            lbl_status.setText("Buscando...")
            QApplication.processEvents()

            pid = self.current_planet_id
            if not pid:
                lbl_status.setText("Selecciona un planeta primero.")
                return

            import time as _time
            t0 = _time.time()

            # 1. FTS5 — sub-milisegundo incluso con millones de filas
            results = database.global_search(term, pid, self.db_path, limit=500)

            # 2. Fallback: LIKE en columna nombre si FTS5 no tiene datos aun
            if not results:
                conn = database.get_connection(self.db_path)
                cur = conn.cursor()
                cur.execute("SELECT name, table_name FROM categories WHERE planet_id=?", (pid,))
                NAME_COLS = ["Nombre", "Nombre_Completo", "Nombre Comun",
                             "Nombre de Clase", "Especialidad", "Raza Base", "Raza"]
                for cat_name, tbl in cur.fetchall():
                    try:
                        cur2 = conn.cursor()
                        cur2.execute(f'PRAGMA table_info("{tbl}")')
                        cols = [r[1] for r in cur2.fetchall()]
                        nc = next((c for c in NAME_COLS if c in cols), None)
                        if not nc:
                            continue
                        cur2.execute(
                            f'SELECT id, "{nc}" FROM "{tbl}" WHERE "{nc}" LIKE ? LIMIT 100',
                            (f"%{term}%",)
                        )
                        for rid, nombre in cur2.fetchall():
                            results.append({"nombre": nombre or "", "categoria": cat_name,
                                            "tabla_origen": cat_name, "row_id": rid})
                    except Exception:
                        pass
                conn.close()

            # Agrupar por categoria en el arbol
            by_cat = {}
            for r in results:
                by_cat.setdefault(r["categoria"], []).append(r)

            p_name = ""
            conn2 = database.get_connection(self.db_path)
            res2 = conn2.execute("SELECT name FROM planets WHERE id=?", (pid,)).fetchone()
            if res2:
                p_name = res2[0]
            conn2.close()

            for cat, items in sorted(by_cat.items()):
                parent = QTreeWidgetItem(tree, [f"[{len(items)}]  {cat}", "", p_name])
                parent.setForeground(0, QColor("#58a6ff"))
                parent.setExpanded(True)
                for r in items[:100]:   # max 100 por categoria en el arbol
                    child = QTreeWidgetItem(parent, [r["nombre"], cat, p_name])
                    child.setData(0, Qt.ItemDataRole.UserRole,
                                  (pid, cat, r["nombre"], r.get("row_id")))
                    parent.addChild(child)

            elapsed = _time.time() - t0
            engine = "FTS5" if results and by_cat else "LIKE"
            lbl_status.setText(
                f"{len(results)} resultado(s) en {elapsed*1000:.0f}ms  [{engine}]"
            )

        btn_search.clicked.connect(execute_search)
        inp_search.returnPressed.connect(execute_search)
        search_timer.timeout.connect(execute_search)
        inp_search.textChanged.connect(lambda _: search_timer.start())

        def on_item_double_clicked(item, column):
            data = item.data(0, Qt.ItemDataRole.UserRole)
            if not data:
                return
            # nodo hoja tiene 4 elementos; nodo padre solo tiene 3 y no tiene row_id
            if len(data) < 4:
                return
            p_id, cat_name, ent_name, row_id = data
            dlg.accept()
            if self.current_planet_id != p_id:
                self.current_planet_id = p_id
                self.load_planet_data(p_id)
                self._enable_planet_buttons(True)
            conn = database.get_connection(self.db_path)
            res = conn.execute("SELECT name FROM planets WHERE id=?", (p_id,)).fetchone()
            conn.close()
            if res:
                self.planet_badge.setText(f"  {res[0]}")
            self._switch_to_tab(cat_name)
            self.search_bar.setText(ent_name)

        tree.itemDoubleClicked.connect(on_item_double_clicked)
        inp_search.setFocus()
        dlg.exec()
