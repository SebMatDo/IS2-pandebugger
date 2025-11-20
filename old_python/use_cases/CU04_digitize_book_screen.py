import os
from PyQt5.QtWidgets import QWidget, QMessageBox
from ui.screens.ui_CU04_digitize_book_screen import Ui_digitize_book_screen
from db.database import Database
from db.models import Libro, EstadoLibro, Accion, TargetType
from utils.history_logger import write_to_historial
from utils.path_utils import get_books_path


class DigitizeBookScreen(QWidget):
    def __init__(self, user):
        super().__init__()
        self.ui = Ui_digitize_book_screen()
        self.ui.setupUi(self)

        self.user = user
        self.db = Database()
        self.session = self.db.get_session()

        self.ui.save_button.clicked.connect(self.save_digitization)
        self.ui.book_combo.currentIndexChanged.connect(self.update_book_info)

        self._load_eligible_books()

    def _load_eligible_books(self):
        self.ui.book_combo.clear()
        self.ui.book_combo.addItem("Seleccione un libro...", -1)

        try:
            eligible_states = (
                self.session.query(EstadoLibro)
                .filter(EstadoLibro.nombre.in_(["En digitalización", "Restaurado"]))
                .all()
            )

            if not eligible_states:
                return

            eligible_state_ids = [state.id for state in eligible_states]
            books = (
                self.session.query(Libro)
                .filter(Libro.estado_id.in_(eligible_state_ids))
                .order_by(Libro.titulo)
                .all()
            )

            for book in books:
                self.ui.book_combo.addItem(
                    f"{book.titulo} (ISBN: {book.isbn})", book.id
                )
        except Exception as e:
            print(f"Error al cargar libros para digitalizar: {e}")

    def update_book_info(self):
        book_id = self.ui.book_combo.currentData()
        if book_id != -1:
            book = self.session.query(Libro).get(book_id)
            if book:
                self.ui.title_display.setText(book.titulo)
                self.ui.author_display.setText(book.autor)
            else:
                self.ui.title_display.clear()
                self.ui.author_display.clear()
        else:
            self.ui.title_display.clear()
            self.ui.author_display.clear()

    def save_digitization(self):
        book_id = self.ui.book_combo.currentData()
        if book_id == -1:
            QMessageBox.warning(
                self, "Selección Requerida", "Por favor, seleccione un libro."
            )
            return

        pdf_filename = self.ui.pdf_filename_input.text().strip()
        if not pdf_filename:
            QMessageBox.warning(
                self,
                "Archivo Requerido",
                "Por favor, ingrese el nombre del archivo PDF.",
            )
            return

        try:
            pdf_path = get_books_path(pdf_filename)

            if not os.path.exists(pdf_path):
                QMessageBox.critical(
                    self,
                    "Archivo no Encontrado",
                    f"No se encontró el archivo '{pdf_filename}' en la carpeta 'assets/books'.\n\n"
                    f"Ruta verificada: {pdf_path}",
                )
                return

            book = self.session.query(Libro).get(book_id)
            new_state = (
                self.session.query(EstadoLibro).filter_by(nombre="Digitalizado").one()
            )

            book.directorio_pdf = pdf_filename
            book.estado_id = new_state.id

            action = (
                self.session.query(Accion).filter_by(nombre="completar tarea").first()
            )
            target_type = (
                self.session.query(TargetType).filter_by(nombre="libro").first()
            )

            if action and target_type:
                write_to_historial(self.user.id, action.id, target_type.id, book.id)
            else:
                print("ADVERTENCIA: No se pudo registrar en el historial.")

            self.session.commit()

            QMessageBox.information(
                self,
                "Éxito",
                f"El libro '{book.titulo}' ha sido marcado como digitalizado exitosamente.",
            )

            self.ui.pdf_filename_input.clear()
            self._load_eligible_books()

        except Exception as e:
            self.session.rollback()
            QMessageBox.critical(
                self, "Error", f"Ocurrió un error al guardar la digitalización:\n{e}"
            )

    def closeEvent(self, event):
        self.session.close()
        super().closeEvent(event)
