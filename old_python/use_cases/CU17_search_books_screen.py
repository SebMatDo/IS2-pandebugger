from PyQt5.QtWidgets import QWidget, QTableWidgetItem
from sqlalchemy import text
from ui.screens.ui_CU17_search_books_screen import Ui_search_books_screen
from db.database import Database
from db.models import Libro, EstadoLibro


class SearchBooksScreen(QWidget):
    def __init__(self):
        super().__init__()
        self.ui = Ui_search_books_screen()
        self.ui.setupUi(self)

        self.db = Database()
        self.session = self.db.get_session()

        self.ui.search_button.clicked.connect(self.search_books)

        try:
            self._load_combos()
        except Exception as e:
            # Este error ya no debería ocurrir con el código corregido
            print(f"ADVERTENCIA (CU17): No se pudieron cargar los combos. Error: {e}")

    def _load_combos(self):
        """
        Carga las categorías y estados desde la base de datos.
        """
        # Cargar categorías usando una consulta SQL directa para asegurar compatibilidad
        self.ui.categoria_combo.addItem("Todas", 0)

        # CORRECCIÓN: Se usa SQL directo para consultar la tabla 'categoria' (singular)
        sql_query = text("SELECT id, nombre FROM categoria ORDER BY nombre")
        result = self.session.execute(sql_query)
        for row in result:
            self.ui.categoria_combo.addItem(row.nombre, row.id)

        # Cargar estados
        self.ui.estado_combo.addItem("Todos", 0)
        estados = self.session.query(EstadoLibro).order_by(EstadoLibro.orden).all()
        for est in estados:
            self.ui.estado_combo.addItem(est.nombre, est.id)

    def search_books(self):
        """
        Ejecuta la búsqueda de libros.
        """
        self.ui.results_table.setRowCount(0)

        try:
            query = self.session.query(Libro)

            titulo = self.ui.titulo_input.text().strip()
            autor = self.ui.autor_input.text().strip()
            isbn = self.ui.isbn_input.text().strip()
            categoria_id = self.ui.categoria_combo.currentData()
            estado_id = self.ui.estado_combo.currentData()

            if titulo:
                query = query.filter(Libro.titulo.ilike(f"%{titulo}%"))
            if autor:
                query = query.filter(Libro.autor.ilike(f"%{autor}%"))
            if isbn:
                query = query.filter(Libro.isbn.ilike(f"%{isbn}%"))
            if categoria_id and categoria_id != 0:
                query = query.filter(Libro.categoria_id == categoria_id)
            if estado_id and estado_id != 0:
                query = query.filter(Libro.estado_id == estado_id)

            libros_encontrados = query.all()

            for libro in libros_encontrados:
                row_position = self.ui.results_table.rowCount()
                self.ui.results_table.insertRow(row_position)

                categoria_nombre = libro.categoria.nombre if libro.categoria else "N/A"
                estado_nombre = libro.estado.nombre if libro.estado else "N/A"

                self.ui.results_table.setItem(
                    row_position, 0, QTableWidgetItem(str(libro.id))
                )
                self.ui.results_table.setItem(
                    row_position, 1, QTableWidgetItem(libro.titulo)
                )
                self.ui.results_table.setItem(
                    row_position, 2, QTableWidgetItem(libro.autor)
                )
                self.ui.results_table.setItem(
                    row_position, 3, QTableWidgetItem(libro.isbn)
                )
                self.ui.results_table.setItem(
                    row_position, 4, QTableWidgetItem(categoria_nombre)
                )
                self.ui.results_table.setItem(
                    row_position, 5, QTableWidgetItem(estado_nombre)
                )

        except Exception as e:
            print(f"Error durante la búsqueda de libros: {e}")

    def closeEvent(self, event):
        self.session.close()
        super().closeEvent(event)
