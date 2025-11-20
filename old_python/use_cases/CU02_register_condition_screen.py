from PyQt5.QtWidgets import QWidget, QMessageBox
from PyQt5.QtCore import pyqtSlot, QDate
from ui.screens.ui_CU02_register_condition_screen import Ui_register_condition_screen
from db.database import Database
from db.models import Libro, EstadoLibro, Tarea
from utils.history_logger import write_to_historial
import db.lookup_cache as lookup

session = Database().get_session()


class RegisterConditionScreen(QWidget):
    def __init__(self, user=None):
        super().__init__()
        self.ui = Ui_register_condition_screen()
        self.ui.setupUi(self)
        self.user = user

        # Configurar fechas por defecto
        today = QDate.currentDate()
        self.ui.fechaInicioEdit.setDate(today)
        self.ui.fechaFinEdit.setDate(today)

        # Configurar opciones de condición física
        self.ui.condicionComboBox.addItem(
            "Buen estado - Listo para digitalización", "bueno"
        )
        self.ui.condicionComboBox.addItem("Requiere restauración", "restauracion")

        self.ui.guardarButton.clicked.connect(self.registrar_revision)

    @pyqtSlot()
    def registrar_revision(self):
        """Registra la revisión física del libro"""
        # Obtener datos del formulario
        libro_id = self.ui.libroIdInput.text().strip()
        condicion = self.ui.condicionComboBox.currentData()
        fecha_inicio = self.ui.fechaInicioEdit.date().toPyDate()
        fecha_fin = self.ui.fechaFinEdit.date().toPyDate()

        # Validaciones básicas
        if not libro_id:
            self.ui.mensajeLabel.setText("Por favor ingrese el ID del libro.")
            return

        try:
            libro_id = int(libro_id)
        except ValueError:
            self.ui.mensajeLabel.setText("El ID del libro debe ser un número.")
            return

        if fecha_fin < fecha_inicio:
            self.ui.mensajeLabel.setText(
                "La fecha de finalización no puede ser anterior a la de inicio."
            )
            return

        # Verificar libro y su estado
        libro = session.query(Libro).get(libro_id)
        if not libro:
            self.ui.mensajeLabel.setText("No se encontró un libro con ese ID.")
            return

        estado_actual = session.query(EstadoLibro).filter_by(id=libro.estado_id).first()
        if estado_actual.nombre != "Registrado":
            self.ui.mensajeLabel.setText(
                f"El libro no está en estado 'Registrado'. Estado actual: {estado_actual.nombre}"
            )
            return

        # Determinar nuevo estado según condición
        if condicion == "bueno":
            nuevo_estado = (
                session.query(EstadoLibro).filter_by(nombre="En digitalización").first()
            )
        else:
            nuevo_estado = (
                session.query(EstadoLibro).filter_by(nombre="En restauración").first()
            )

        if not nuevo_estado:
            self.ui.mensajeLabel.setText("No se encontró el estado correspondiente.")
            return

        # Actualizar estado del libro
        libro.estado_id = nuevo_estado.id

        # Registrar tarea de revisión
        nueva_tarea = Tarea(
            libro_id=libro.id,
            usuario_id=self.user.id,
            fecha_asignacion=fecha_inicio,
            fecha_finalizacion=fecha_fin,
            estado_nuevo_id=nuevo_estado.id,
            observaciones=f"Revisión física: {condicion}",
        )

        session.add(nueva_tarea)
        session.commit()

        QMessageBox.information(
            self, "✅ Éxito", "Revisión física registrada exitosamente."
        )

        write_to_historial(
            inserted_usuario_id=self.user.id,
            inserted_accion_id=lookup.accion_modificar.id,
            inserted_target_type_id=lookup.tt_libro.id,
            inserted_target_id=libro.id,
        )

        self._clear_form()

    def _clear_form(self):
        """Limpia el formulario"""
        self.ui.libroIdInput.clear()
        self.ui.condicionComboBox.setCurrentIndex(0)
        today = QDate.currentDate()
        self.ui.fechaInicioEdit.setDate(today)
        self.ui.fechaFinEdit.setDate(today)
        self.ui.mensajeLabel.setText("")
