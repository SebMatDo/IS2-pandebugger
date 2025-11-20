from PyQt5.QtWidgets import QWidget, QMessageBox
from PyQt5.QtCore import pyqtSlot
from ui.screens.ui_CU01_register_book_screen import Ui_register_book_screen
from db.database import Database
from db.models import Libro, EstadoLibro
from datetime import datetime
from utils.history_logger import write_to_historial
import db.lookup_cache as lookup

session = Database().get_session()


class RegisterBookScreen(QWidget):
    def __init__(self, user=None):
        super().__init__()
        self.ui = Ui_register_book_screen()
        self.ui.setupUi(self)
        self.ui.saveButton.clicked.connect(self.registrar_libro)
        self.user = user

    @pyqtSlot()
    def registrar_libro(self):
        titulo = self.ui.tituloInput.text().strip()
        autor = self.ui.autorInput.text().strip()
        fecha = self.ui.fechaInput.date().toPyDate()
        paginas = self.ui.paginasInput.text().strip()
        estanteria = self.ui.estanteriaInput.text().strip()
        espacio = self.ui.espacioInput.text().strip()

        # Validación de campos vacíos
        if not all([titulo, autor, paginas, estanteria, espacio]):
            self._show_error("Por favor complete todos los campos.")
            return

        # Validación de número de páginas
        try:
            paginas = int(paginas)
            if paginas <= 0:
                raise ValueError
        except ValueError:
            self._show_error("El número de páginas debe ser un número entero positivo.")
            return

        # Buscar estado inicial
        estado_inicial = (
            session.query(EstadoLibro).filter_by(nombre="Registrado").first()
        )
        if not estado_inicial:
            self._show_error("No se encontró el estado 'Registrado'.")
            return

        # Crear libro
        nuevo_libro = Libro(
            titulo=titulo,
            autor=autor,
            fecha=fecha,
            numero_paginas=paginas,
            estanteria=estanteria,
            espacio=espacio,
            estado_id=estado_inicial.id,
        )

        session.add(nuevo_libro)
        session.commit()
        new_book = session.query(Libro).filter_by(titulo=titulo).first()
        write_to_historial(
            inserted_usuario_id=self.user.id,
            inserted_accion_id=lookup.accion_crear.id,
            inserted_target_type_id=lookup.tt_libro.id,
            inserted_target_id=new_book.id,
        )

        QMessageBox.information(self, "✅ Éxito", "Libro registrado exitosamente.")
        self._clear_form()

    def _clear_form(self):
        self.ui.tituloInput.clear()
        self.ui.autorInput.clear()
        self.ui.fechaInput.setDate(datetime.now())
        self.ui.paginasInput.clear()
        self.ui.estanteriaInput.clear()
        self.ui.espacioInput.clear()
        self.ui.errorLabel.setText("")

    def _show_error(self, message):
        self.ui.errorLabel.setText(message)
