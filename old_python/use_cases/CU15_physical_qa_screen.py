from PyQt5.QtWidgets import QWidget
from ui.screens.ui_CU15_physical_qa_screen import Ui_physical_qa_screen


class PhysicalQaScreen(QWidget):
    def __init__(self):
        super().__init__()
        self.ui = Ui_physical_qa_screen()
        self.ui.setupUi(self)

        self.ui.saveButton.clicked.connect(self.save_entry)

    def save_entry(self):
        value = self.ui.titleInput.text()
        print(f"✅ Saving physical qa screen: {value}")
