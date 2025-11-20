from PyQt5.QtWidgets import QWidget, QMessageBox
from ui.screens.ui_CU05_classify_book_screen import Ui_classify_book_screen
from db.database import Database
from db.models import Libro, EstadoLibro, Categoria
from utils.history_logger import write_to_historial
import db.lookup_cache as lookup


class ClassifyBookScreen(QWidget):
    def __init__(self, user):
        super().__init__()
        self.ui = Ui_classify_book_screen()
        self.ui.setupUi(self)

        self.user = user
        self.db = Database()
        self.session = self.db.get_session()

        self.ui.save_button.clicked.connect(self.save_classification)
        self.ui.book_combo.currentIndexChanged.connect(self.update_book_info)

        self._load_eligible_books()
        self._load_categories()

    def _load_eligible_books(self):
        """Carga libros que están listos para clasificación"""
        self.ui.book_combo.clear()
        self.ui.book_combo.addItem("Seleccione un libro...", -1)

        try:
            # Libros en estado "Aprobado por control de calidad" o "Digitalizado"
            eligible_states = (
                self.session.query(EstadoLibro)
                .filter(
                    EstadoLibro.nombre.in_(
                        ["Aprobado por control de calidad", "Digitalizado"]
                    )
                )
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
                self.ui.book_combo.addItem(f"{book.titulo} (ID: {book.id})", book.id)
        except Exception as e:
            print(f"Error al cargar libros para clasificar: {e}")
            QMessageBox.warning(
                self, "Error", f"No se pudieron cargar los libros: {str(e)}"
            )

    def _load_categories(self):
        """Carga todas las categorías disponibles"""
        self.ui.category_combo.clear()
        self.ui.category_combo.addItem("Seleccione una categoría...", -1)

        try:
            categories = self.session.query(Categoria).order_by(Categoria.nombre).all()
            for category in categories:
                self.ui.category_combo.addItem(category.nombre, category.id)
        except Exception as e:
            print(f"Error al cargar categorías: {e}")
            QMessageBox.warning(
                self, "Error", f"No se pudieron cargar las categorías: {str(e)}"
            )

    def update_book_info(self):
        """Actualiza la información mostrada cuando se selecciona un libro"""
        book_id = self.ui.book_combo.currentData()
        if book_id != -1:
            book = self.session.query(Libro).get(book_id)
            if book:
                self.ui.title_display.setText(book.titulo)
                self.ui.author_display.setText(book.autor)
                # Mostrar categoría actual si existe
                if book.categoria_id:
                    category = self.session.query(Categoria).get(book.categoria_id)
                    self.ui.current_category_display.setText(
                        category.nombre if category else "Ninguna"
                    )
                else:
                    self.ui.current_category_display.setText("Ninguna")
            else:
                self.clear_book_info()
        else:
            self.clear_book_info()

    def clear_book_info(self):
        """Limpia los campos de información del libro"""
        self.ui.title_display.clear()
        self.ui.author_display.clear()
        self.ui.current_category_display.clear()

    def save_classification(self):
        """Guarda la clasificación del libro"""
        book_id = self.ui.book_combo.currentData()
        category_id = self.ui.category_combo.currentData()

        # Validaciones
        if book_id == -1:
            QMessageBox.warning(
                self, "Selección Requerida", "Por favor, seleccione un libro."
            )
            return

        if category_id == -1:
            QMessageBox.warning(
                self, "Selección Requerida", "Por favor, seleccione una categoría."
            )
            return

        try:
            book = self.session.query(Libro).get(book_id)
            if not book:
                QMessageBox.warning(self, "Error", "El libro seleccionado no existe.")
                return

            # Actualizar categoría del libro
            book.categoria_id = category_id

            # Cambiar estado a "Clasificado" si no lo está
            if book.estado.nombre != "Clasificado":
                new_state = (
                    self.session.query(EstadoLibro)
                    .filter_by(nombre="Clasificado")
                    .first()
                )
                if new_state:
                    book.estado_id = new_state.id

            # Registrar en el historial
            write_to_historial(
                inserted_usuario_id=self.user.id,
                inserted_accion_id=lookup.accion_modificar.id,
                inserted_target_type_id=lookup.tt_libro.id,
                inserted_target_id=book.id,
            )

            self.session.commit()

            QMessageBox.information(
                self,
                "Éxito",
                f"El libro '{book.titulo}' ha sido clasificado exitosamente.",
            )

            # Actualizar la lista de libros
            self._load_eligible_books()
            self.update_book_info()

        except Exception as e:
            self.session.rollback()
            QMessageBox.critical(
                self,
                "Error",
                f"Ocurrió un error al guardar la clasificación:\n{str(e)}",
            )

    def closeEvent(self, event):
        """Cierra la sesión de base de datos al cerrar la ventana"""
        self.session.close()
        super().closeEvent(event)
