from PyQt5.QtWidgets import QWidget
from ui.screens.ui_CU19_assign_task_screen import Ui_assign_task_screen


class AssignTaskScreen(QWidget):
    def __init__(self):
        super().__init__()
        self.ui = Ui_assign_task_screen()
        self.ui.setupUi(self)

        self.ui.saveButton.clicked.connect(self.save_entry)

    def save_entry(self):
        value = self.ui.titleInput.text()
        print(f"✅ Saving assign task screen: {value}")
