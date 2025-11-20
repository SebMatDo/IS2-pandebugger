from PyQt5.QtWidgets import QWidget
from ui.screens.ui_CU11_deactivate_user_screen import Ui_deactivate_user_screen


class DeactivateUserScreen(QWidget):
    def __init__(self):
        super().__init__()
        self.ui = Ui_deactivate_user_screen()
        self.ui.setupUi(self)

        self.ui.saveButton.clicked.connect(self.save_entry)

    def save_entry(self):
        value = self.ui.titleInput.text()
        print(f"✅ Saving deactivate user screen: {value}")
