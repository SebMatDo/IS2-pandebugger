from PyQt5.QtWidgets import QWidget
from ui.screens.ui_CU16_filter_books_by_state_screen import (
    Ui_filter_books_by_state_screen,
)


class FilterBooksByStateScreen(QWidget):
    def __init__(self):
        super().__init__()
        self.ui = Ui_filter_books_by_state_screen()
        self.ui.setupUi(self)

        self.ui.saveButton.clicked.connect(self.save_entry)

    def save_entry(self):
        value = self.ui.titleInput.text()
        print(f"✅ Saving filter books by state screen: {value}")
