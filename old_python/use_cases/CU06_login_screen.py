from PyQt5.QtWidgets import QWidget
from ui.screens.ui_CU06_login_screen import Ui_login_screen
from PyQt5.QtGui import QPixmap
from db.database import Database
from db.models import Usuario
from utils.path_utils import get_asset_path
from PyQt5.QtGui import QIcon


class LoginScreen(QWidget):
    def __init__(self, on_login_success):
        super().__init__()
        self.ui = Ui_login_screen()
        self.ui.setupUi(self)

        self.ui.access.clicked.connect(self.handle_login)
        self.on_login_success = on_login_success  # callback to launch main window

        self.setWindowIcon(
            QIcon(get_asset_path("ArchiBox_alpha_icon.png"))
        )  # or "app_icon.ico"
        self._load_banner()

    def handle_login(self):
        email = self.ui.email_in.text()
        password = self.ui.password_in.text()

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

    def center_on_screen(self):
        screen = self.screen().availableGeometry()
        size = self.geometry()
        self.move(
            screen.center().x() - size.width() // 2,
            screen.center().y() - size.height() // 2,
        )

    def _load_banner(self):
        # pixmap = QPixmap("assets/ArchiBox_login_Banner.png")
        pixmap = QPixmap(get_asset_path("ArchiBox_login_Banner.png"))
        self.ui.bannerLabel.setPixmap(pixmap)
        self.ui.bannerLabel.setScaledContents(
            True
        )  # Optional: scales pixmap to fit label
