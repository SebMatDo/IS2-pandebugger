from PyQt5.QtWidgets import QWidget
from ui.screens.ui_CU12_modify_book_screen import Ui_modify_book_screen


class ModifyBookScreen(QWidget):
    def __init__(self):
        super().__init__()
        self.ui = Ui_modify_book_screen()
        self.ui.setupUi(self)

        self.ui.saveButton.clicked.connect(self.save_entry)

    def save_entry(self):
        value = self.ui.titleInput.text()
        print(f"✅ Saving modify book screen: {value}")
