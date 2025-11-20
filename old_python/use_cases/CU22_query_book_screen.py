from PyQt5.QtWidgets import QWidget
from ui.screens.ui_CU22_query_book_screen import Ui_query_book_screen


class QueryBookScreen(QWidget):
    def __init__(self):
        super().__init__()
        self.ui = Ui_query_book_screen()
        self.ui.setupUi(self)

        self.ui.saveButton.clicked.connect(self.save_entry)

    def save_entry(self):
        value = self.ui.titleInput.text()
        print(f"✅ Saving query book screen: {value}")
