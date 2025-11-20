from PyQt5.QtWidgets import QWidget
from ui.screens.ui_login_screen import Ui_login_screen
from db.database import Database
from db.models import Usuario


class LoginScreen(QWidget):
    def __init__(self, on_login_success):
        super().__init__()
        self.ui = Ui_login_screen()
        self.ui.setupUi(self)

        self.ui.access.clicked.connect(self.handle_login)
        self.on_login_success = on_login_success  # callback to launch main window

    def handle_login(self):
        email = self.ui.email_in.text()
        password = self.ui.password_in.text()

        print(email)
        print(password)

        if not email or not password:
            self.ui.err_display.setText("⚠️ Todos los campos son obligatorios")
            return

        session = Database().get_session()
        user = (
            session.query(Usuario)
            .filter_by(correo_electronico=email, estado=True)
            .first()
        )

        if user and user.verify_password(password):
            self.ui.err_display.setText("")
            self.on_login_success(user)
        else:
            self.ui.err_display.setText("❌ Credenciales inválidas o usuario inactivo")
