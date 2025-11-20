from PyQt5.QtWidgets import QWidget, QMessageBox
from ui.screens.ui_CU20_change_password_screen import Ui_change_password_screen
from db.database import Database
from utils.password_hashing import hash_password
from utils.history_logger import write_to_historial
from db.models import Usuario
import db.lookup_cache as lookup

session = Database().get_session()


class ChangePasswordScreen(QWidget):
    def __init__(self, user=None):
        super().__init__()
        self.ui = Ui_change_password_screen()
        self.ui.setupUi(self)
        self.user = user  # Logged-in user object

        # Connect toggle visibility buttons
        self.ui.toggleCurrentPassword.clicked.connect(
            lambda: self._toggle_echo(self.ui.currentPasswordInput)
        )
        self.ui.toggleNewPassword.clicked.connect(
            lambda: self._toggle_echo(self.ui.newPasswordInput)
        )
        self.ui.toggleConfirmPassword.clicked.connect(
            lambda: self._toggle_echo(self.ui.confirmPasswordInput)
        )

        # Connect confirm button
        self.ui.saveButton.clicked.connect(self._handle_password_change)

        # Optional: Connect strength bar to new password input
        self.ui.newPasswordInput.textChanged.connect(self._update_strength_bar)

    def _toggle_echo(self, line_edit):
        """Toggle password visibility."""
        if line_edit.echoMode() == line_edit.Password:
            line_edit.setEchoMode(line_edit.Normal)
        else:
            line_edit.setEchoMode(line_edit.Password)

    def _update_strength_bar(self, text):
        """Update password strength meter."""
        strength = self._evaluate_strength(text)
        self.ui.strengthBar.setValue(strength)
        self.ui.strengthBar.setVisible(bool(text))

    def _evaluate_strength(self, password):
        """Return strength score (0–100)."""
        score = 0
        if len(password) >= 8:
            score += 30
        if any(c.isupper() for c in password):
            score += 20
        if any(c.isdigit() for c in password):
            score += 20
        if any(not c.isalnum() for c in password):
            score += 30
        return min(score, 100)

    def _handle_password_change(self):
        """Validate and update the password."""
        current = self.ui.currentPasswordInput.text()
        new = self.ui.newPasswordInput.text()
        confirm = self.ui.confirmPasswordInput.text()

        if not current or not new or not confirm:
            self._show_error("Todos los campos son obligatorios.")
            return

        if not self.user.verify_password(current):
            self._show_error("La contraseña actual es incorrecta.")
            return

        if new != confirm:
            self._show_error("Las nuevas contraseñas no coinciden.")
            return

        if not self._validate_password(new):
            self._show_error("La nueva contraseña no cumple con los requisitos.")
            return

        # All good — update password
        usuario_db = (
            session.query(Usuario).filter_by(id=self.user.id, estado=True).first()
        )
        if usuario_db:
            usuario_db.hash_contraseña = hash_password(new)
            session.commit()

            # Write to historial
            write_to_historial(
                inserted_usuario_id=self.user.id,
                inserted_accion_id=lookup.accion_modificar.id,
                inserted_target_type_id=lookup.tt_usuario.id,
                inserted_target_id=self.user.id,
            )

            QMessageBox.information(
                self, "Éxito", "Contraseña actualizada correctamente."
            )
            self._clear_inputs()
        else:
            self._show_error("No se pudo actualizar la contraseña.")

        self._clear_inputs()

    def _validate_password(self, password):
        """Password must have: min 8 chars, 1 uppercase, 1 number, 1 special char."""
        import re

        pattern = r"^(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$"
        return re.match(pattern, password)

    def _show_error(self, message):
        self.ui.errorLabel.setText(message)

    def _clear_inputs(self):
        self.ui.currentPasswordInput.clear()
        self.ui.newPasswordInput.clear()
        self.ui.confirmPasswordInput.clear()
        self.ui.errorLabel.clear()
        self.ui.strengthBar.setVisible(False)
