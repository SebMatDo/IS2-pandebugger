from PyQt5.QtWidgets import QWidget, QMessageBox
from PyQt5.QtCore import pyqtSlot
from ui.screens.ui_CU09_create_user_screen import Ui_create_user_screen
from db.database import Database
from db.models import Usuario, Rol
from utils.password_hashing import hash_password
from utils.history_logger import write_to_historial
import db.lookup_cache as lookup
import re

session = Database().get_session()


class CreateUserScreen(QWidget):
    def __init__(self, user=None):
        super().__init__()
        self.user = user
        self.ui = Ui_create_user_screen()
        self.ui.setupUi(self)

        self._load_roles()
        self.ui.saveButton.clicked.connect(self.create_user)

    def _load_roles(self):
        self.roles = session.query(Rol).all()
        self.ui.rolComboBox.clear()
        for rol in self.roles:
            self.ui.rolComboBox.addItem(rol.nombre, rol.id)

    @pyqtSlot()
    def create_user(self):
        nombres = self.ui.nombresInput.text().strip()
        apellidos = self.ui.apellidosInput.text().strip()
        correo = self.ui.emailInput.text().strip()
        contraseña = self.ui.passwordInput.text()
        rol_index = self.ui.rolComboBox.currentIndex()
        rol_id = self.ui.rolComboBox.itemData(rol_index)

        # Validations
        if not all([nombres, apellidos, correo, contraseña]):
            self._show_error("Por favor complete todos los campos.")

            print(f"✍️ Logging creation by user {self.user.id}")
            return

        if not self._validate_password(contraseña):
            self._show_error(
                "La contraseña debe tener mínimo 8 caracteres, una mayúscula, un número y un símbolo."
            )
            return

        if session.query(Usuario).filter_by(correo_electronico=correo).first():
            self._show_error("Ya existe un usuario con ese correo electrónico.")
            return

        # Insert user
        nuevo_usuario = Usuario(
            nombres=nombres,
            apellidos=apellidos,
            correo_electronico=correo,
            hash_contraseña=hash_password(contraseña),
            rol_id=rol_id,
            estado=True,
        )

        session.add(nuevo_usuario)
        session.commit()

        print("Usuario creado exitosamente.")

        new_user = (
            session.query(Usuario)
            .filter_by(correo_electronico=correo, estado=True)
            .first()
        )
        write_to_historial(
            inserted_usuario_id=self.user.id,
            inserted_accion_id=lookup.accion_crear.id,
            inserted_target_type_id=lookup.tt_usuario.id,
            inserted_target_id=new_user.id,
        )

        QMessageBox.information(self, "Éxito", "Usuario creado exitosamente")
        self._clear_form()

    def _validate_password(self, password):
        pattern = r"^(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$"
        return re.match(pattern, password)

    def _clear_form(self):
        self.ui.nombresInput.clear()
        self.ui.apellidosInput.clear()
        self.ui.emailInput.clear()
        self.ui.passwordInput.clear()
        self.ui.rolComboBox.setCurrentIndex(0)
        self.ui.errorLabel.setText("")

    def _show_error(self, message):
        self.ui.errorLabel.setText(message)
