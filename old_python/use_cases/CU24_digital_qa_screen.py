from PyQt5.QtWidgets import QWidget
from ui.screens.ui_CU24_digital_qa_screen import Ui_digital_qa_screen


class DigitalQaScreen(QWidget):
    def __init__(self):
        super().__init__()
        self.ui = Ui_digital_qa_screen()
        self.ui.setupUi(self)

        self.ui.saveButton.clicked.connect(self.save_entry)

    def save_entry(self):
        value = self.ui.titleInput.text()
        print(f"✅ Saving digital qa screen: {value}")
