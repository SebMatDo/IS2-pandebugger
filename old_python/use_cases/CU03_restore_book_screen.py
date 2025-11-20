from PyQt5.QtWidgets import QWidget, QMessageBox
from PyQt5.QtCore import pyqtSlot, QDate
from ui.screens.ui_CU03_restore_book_screen import Ui_restore_book_screen
from db.database import Database
from db.models import Libro, EstadoLibro, Tarea
from utils.history_logger import write_to_historial
import db.lookup_cache as lookup

session = Database().get_session()


class RestoreBookScreen(QWidget):
    def __init__(self, user=None):
        super().__init__()
        self.ui = Ui_restore_book_screen()
        self.ui.setupUi(self)
        self.user = user

        # Configurar fechas por defecto
        today = QDate.currentDate()
        self.ui.fechaInicioEdit.setDate(today)
        self.ui.fechaFinEdit.setDate(today)

        # Configurar opciones de condición física

        # Add book restoration conditions (all marked as "bueno")
        self.ui.condicionComboBox.addItem(
            "Empastado nuevo - listo para digitalización", "bueno"
        )
        self.ui.condicionComboBox.addItem(
            "Limpieza profunda realizada - listo para digitalización", "bueno"
        )
        self.ui.condicionComboBox.addItem(
            "Reparación de lomos - listo para digitalización", "bueno"
        )
        self.ui.condicionComboBox.addItem(
            "Reparación de esquinas - listo para digitalización", "bueno"
        )
        self.ui.condicionComboBox.addItem(
            "Páginas reinsertadas - listo para digitalización", "bueno"
        )
        self.ui.condicionComboBox.addItem(
            "Portada restaurada - listo para digitalización", "bueno"
        )
        self.ui.condicionComboBox.addItem(
            "Desinfección completada - listo para digitalización", "bueno"
        )
        self.ui.condicionComboBox.addItem(
            "Reencuadernado parcial - listo para digitalización", "bueno"
        )
        self.ui.condicionComboBox.addItem(
            "Reforzado con cinta japonesa - listo para digitalización", "bueno"
        )
        self.ui.condicionComboBox.addItem(
            "Consolidación de papel frágil - listo para digitalización", "bueno"
        )

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
        if estado_actual.nombre != lookup.estado_restauracion.nombre:
            self.ui.mensajeLabel.setText(
                f"El libro no está en estado 'Restauración'. Estado actual: {estado_actual.nombre}"
            )
            return

        # Determinar nuevo estado según condición
        nuevo_estado = (
            session.query(EstadoLibro).filter_by(nombre="En digitalización").first()
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
            observaciones=f"Restauración: {condicion}",
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
