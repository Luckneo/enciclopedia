import sys

import traceback
def global_excepthook(exc_type, exc_value, exc_traceback):
    with open('crash.log', 'w', encoding='utf-8') as f:
        traceback.print_exception(exc_type, exc_value, exc_traceback, file=f)
    sys.__excepthook__(exc_type, exc_value, exc_traceback)
sys.excepthook = global_excepthook
import os
from PyQt6.QtWidgets import QApplication
from ui import MainWindow

def main():
    app = QApplication(sys.argv)
    
    # Set global application aesthetics
    app.setStyle("Fusion")
    
    # Load separate styling
    style_path = os.path.join(os.path.dirname(__file__), "styles.qss")
    if os.path.exists(style_path):
        with open(style_path, "r", encoding="utf-8") as f:
            app.setStyleSheet(f.read())
            
    # Load database from app directory to make standalone exe portable
    db_path = os.path.join(os.path.dirname(__file__), "encyclopedia.db")
    
    window = MainWindow(db_path)
    window.show()
    
    sys.exit(app.exec())

if __name__ == "__main__":
    main()
