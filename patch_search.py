"""Script para reemplazar la funcion show_global_search en ui.py"""
import re

with open('ui.py', encoding='utf-8') as f:
    content = f.read()

# Encontrar el inicio y fin de show_global_search
start_marker = '    def show_global_search(self):'
# Encontrar la siguiente funcion al mismo nivel de indentacion
# El metodo termina justo antes de la siguiente linea "    def " al mismo nivel
idx_start = content.find(start_marker)
if idx_start == -1:
    print("ERROR: No se encontro show_global_search")
    exit(1)

# Buscar el fin: siguiente "    def " despues del inicio
idx_next = content.find('\n    def ', idx_start + len(start_marker))
if idx_next == -1:
    idx_end = len(content)
else:
    idx_end = idx_next + 1  # incluir el newline

print(f"Funcion encontrada: lineas {content[:idx_start].count(chr(10))+1} a {content[:idx_end].count(chr(10))}")
print(f"Primeros 100 chars: {repr(content[idx_start:idx_start+100])}")
print(f"Ultimos 100 chars: {repr(content[idx_end-100:idx_end])}")

NEW_FUNC = '''    def show_global_search(self):
        dlg = QDialog(self)
        dlg.setWindowTitle("Buscador Universal Intersolar")
        dlg.resize(860, 560)
        dlg.setStyleSheet("background:#0d1117; color:#c9d1d9;")
        layout = QVBoxLayout(dlg)
        layout.setSpacing(10)
        layout.setContentsMargins(14, 14, 14, 14)

        hdr = QLabel("Buscador Universal (FTS5 + Prefix Search)")
        hdr.setStyleSheet("font-size:15px; font-weight:bold; color:#58a6ff;")
        layout.addWidget(hdr)

        search_layout = QHBoxLayout()
        inp_search = QLineEdit()
        inp_search.setPlaceholderText("Ej: Dragon, Athensia, Solaris... (min 2 caracteres)")
        inp_search.setStyleSheet(
            "background:#161b22; border:1px solid #30363d; border-radius:6px;"
            "padding:7px 12px; font-size:13px; color:#c9d1d9;"
        )
        btn_search = QPushButton("Buscar")
        btn_search.setStyleSheet(
            "background:#1f6feb; border:none; border-radius:6px; color:white;"
            "padding:7px 20px; font-size:13px; font-weight:bold;"
        )
        btn_search.setFixedWidth(100)
        search_layout.addWidget(inp_search)
        search_layout.addWidget(btn_search)
        layout.addLayout(search_layout)

        tree = QTreeWidget()
        tree.setHeaderLabels(["Nombre / Registro", "Categoria", "Planeta"])
        tree.setColumnWidth(0, 400)
        tree.setColumnWidth(1, 220)
        tree.setColumnWidth(2, 180)
        tree.setAlternatingRowColors(True)
        tree.setStyleSheet(
            "QTreeWidget{background:#161b22;border:1px solid #30363d;border-radius:6px;}"
            "QTreeWidget::item{padding:4px;}"
            "QTreeWidget::item:selected{background:#1f6feb;}"
        )
        layout.addWidget(tree)

        lbl_status = QLabel("Escribe un termino (min 2 caracteres) y presiona Enter.")
        lbl_status.setStyleSheet("color:#8b949e; font-size:11px;")
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

            # 1. FTS5 (instantaneo: <10ms para millones de registros)
            results = database.global_search(term, pid, self.db_path, limit=500)

            # 2. Fallback LIKE en columna nombre si FTS5 no tiene datos aun
            if not results:
                conn = database.get_connection(self.db_path)
                cur = conn.cursor()
                cur.execute("SELECT name, table_name FROM categories WHERE planet_id=?", (pid,))
                NAME_COLS = ["Nombre", "Nombre_Completo", "Nombre Comun",
                             "Nombre de Clase", "Especialidad", "Raza Base", "Raza"]
                for cat_name, tbl in cur.fetchall():
                    try:
                        cur2 = conn.cursor()
                        cur2.execute(f\'PRAGMA table_info("{tbl}")\')
                        cols = [r[1] for r in cur2.fetchall()]
                        nc = next((c for c in NAME_COLS if c in cols), None)
                        if not nc:
                            continue
                        cur2.execute(
                            f\'SELECT id, "{nc}" FROM "{tbl}" WHERE "{nc}" LIKE ? LIMIT 50\',
                            (f"%{term}%",)
                        )
                        for rid, nombre in cur2.fetchall():
                            results.append({"nombre": nombre or "", "categoria": cat_name,
                                            "tabla_origen": cat_name, "row_id": rid})
                    except Exception:
                        pass
                conn.close()

            # Agrupar por categoria
            by_cat = {}
            for r in results:
                by_cat.setdefault(r["categoria"], []).append(r)

            p_name = ""
            conn2 = database.get_connection(self.db_path)
            res2 = conn2.execute("SELECT name FROM planets WHERE id=?", (pid,)).fetchone()
            if res2:
                p_name = res2[0]
            conn2.close()

            tree.clear()
            for cat, items in sorted(by_cat.items()):
                parent = QTreeWidgetItem(tree, [f"[{len(items)}]  {cat}", "", p_name])
                parent.setForeground(0, QColor("#58a6ff"))
                parent.setExpanded(True)
                for r in items[:100]:
                    child = QTreeWidgetItem(parent, [r["nombre"], cat, p_name])
                    child.setData(0, Qt.ItemDataRole.UserRole,
                                  (pid, cat, r["nombre"], r.get("row_id")))
                    parent.addChild(child)

            elapsed = _time.time() - t0
            mode = "FTS5" if results else "LIKE"
            lbl_status.setText(f"{len(results)} resultado(s) en {elapsed*1000:.0f}ms  [{mode}]")

        btn_search.clicked.connect(execute_search)
        inp_search.returnPressed.connect(execute_search)
        search_timer.timeout.connect(execute_search)
        inp_search.textChanged.connect(lambda _: search_timer.start())

        def on_item_double_clicked(item, column):
            data = item.data(0, Qt.ItemDataRole.UserRole)
            if not data:
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

'''

new_content = content[:idx_start] + NEW_FUNC + content[idx_end:]
with open('ui.py', 'w', encoding='utf-8') as f:
    f.write(new_content)
print("OK - show_global_search reemplazado exitosamente")

# Validar sintaxis
import ast
ast.parse(new_content)
print("OK - Sintaxis validada")
