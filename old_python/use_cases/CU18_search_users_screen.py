from PyQt5.QtWidgets import QWidget, QTableWidgetItem
from ui.screens.ui_CU18_search_users_screen import Ui_search_users_screen
from db.database import Database
from db.models import Usuario, Rol


class SearchUsersScreen(QWidget):
    def __init__(self):
        super().__init__()
        self.ui = Ui_search_users_screen()
        self.ui.setupUi(self)

        self.db = Database()
        self.session = self.db.get_session()

        self.ui.search_button.clicked.connect(self.search_users)
        self._load_combos()

    def _load_combos(self):
        """
        Carga los roles y los estados de usuario en los QComboBox.
        """
        try:
            # Cargar roles
            self.ui.rol_combo.addItem("Todos", 0)  # Opción para no filtrar por rol
            roles = self.session.query(Rol).order_by(Rol.nombre).all()
            for rol in roles:
                self.ui.rol_combo.addItem(rol.nombre, rol.id)

            # Cargar estados (Activo/Inactivo)
            self.ui.estado_combo.addItem("Todos", "all")
            self.ui.estado_combo.addItem("Activo", True)
            self.ui.estado_combo.addItem("Inactivo", False)

        except Exception as e:
            print(f"Error al cargar combos de búsqueda de usuarios: {e}")

    def search_users(self):
        """
        Busca usuarios en la base de datos según los filtros
        y muestra los resultados en la tabla.
        """
        self.ui.results_table.setRowCount(0)

        try:
            query = self.session.query(Usuario)

            # Obtener criterios de la UI
            nombres = self.ui.nombres_input.text().strip()
            apellidos = self.ui.apellidos_input.text().strip()
            correo = self.ui.correo_input.text().strip()
            rol_id = self.ui.rol_combo.currentData()
            estado = self.ui.estado_combo.currentData()

            # Aplicar filtros dinámicos
            if nombres:
                query = query.filter(Usuario.nombres.ilike(f"%{nombres}%"))
            if apellidos:
                query = query.filter(Usuario.apellidos.ilike(f"%{apellidos}%"))
            if correo:
                query = query.filter(Usuario.correo_electronico.ilike(f"%{correo}%"))
            if rol_id != 0:
                query = query.filter(Usuario.rol_id == rol_id)
            if estado != "all":
                query = query.filter(Usuario.estado == estado)

            # Ejecutar consulta
            usuarios_encontrados = query.all()

            # Poblar la tabla
            for usuario in usuarios_encontrados:
                row_position = self.ui.results_table.rowCount()
                self.ui.results_table.insertRow(row_position)

                rol_nombre = usuario.rol.nombre if usuario.rol else "N/A"
                estado_texto = "Activo" if usuario.estado else "Inactivo"

                self.ui.results_table.setItem(
                    row_position, 0, QTableWidgetItem(usuario.nombres)
                )
                self.ui.results_table.setItem(
                    row_position, 1, QTableWidgetItem(usuario.apellidos)
                )
                self.ui.results_table.setItem(
                    row_position, 2, QTableWidgetItem(usuario.correo_electronico)
                )
                self.ui.results_table.setItem(
                    row_position, 3, QTableWidgetItem(rol_nombre)
                )
                self.ui.results_table.setItem(
                    row_position, 4, QTableWidgetItem(estado_texto)
                )

        except Exception as e:
            print(f"Error durante la búsqueda de usuarios: {e}")

    def closeEvent(self, event):
        self.session.close()
        super().closeEvent(event)
