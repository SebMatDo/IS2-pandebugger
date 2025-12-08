# History Module (Audit Logging)

## 📚 **Overview**

El módulo de **History** proporciona un sistema completo de auditoría para registrar todas las acciones realizadas en el sistema. Cada acción queda almacenada en la tabla `historial` con información sobre:

- **Quién** realizó la acción (usuario_id)
- **Qué** acción se realizó (accion_id)
- **Sobre qué** se realizó (target_type_id y target_id)
- **Cuándo** se realizó (fecha)
- **Detalles** adicionales en formato JSON

## 🗄️ **Estructura de la Base de Datos**

### Tabla `historial`

```sql
CREATE TABLE historial (
    id SERIAL PRIMARY KEY,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_id INTEGER REFERENCES usuarios(id),
    accion_id INTEGER REFERENCES accion(id),
    target_type_id INTEGER REFERENCES target_type(id),
    target_id INTEGER,
    detalles JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla `accion` (Tipos de acciones)

Contiene los tipos de acciones disponibles:
- `crear` - Creación de entidades
- `modificar` - Modificación de entidades
- `eliminar` - Eliminación de entidades
- `login` - Inicio de sesión
- `logout` - Cierre de sesión
- `cambiar_contraseña` - Cambio de contraseña
- `asignar_tarea` - Asignación de tarea
- `completar_tarea` - Completar tarea
- `digitalizar` - Digitalización de libro
- `restaurar` - Restauración de libro
- `clasificar` - Clasificación de libro
- `revisar_calidad` - Revisión de calidad

### Tabla `target_type` (Tipos de objetivos)

Contiene los tipos de entidades sobre las que se pueden realizar acciones:
- `usuario` - Usuarios del sistema
- `libro` - Libros
- `tarea` - Tareas
- `categoria` - Categorías
- `sistema` - Acciones a nivel de sistema

## 🚀 **API Endpoints**

### 1. Get History Records (with filters)

```http
GET /api/v1/history?usuario_id=1&limit=50&offset=0
Authorization: Bearer <token>
```

**Query Parameters:**
- `usuario_id` - Filtrar por usuario
- `accion_id` - Filtrar por tipo de acción
- `target_type_id` - Filtrar por tipo de objetivo
- `target_id` - Filtrar por ID del objetivo
- `fecha_inicio` - Fecha de inicio (YYYY-MM-DD)
- `fecha_fin` - Fecha de fin (YYYY-MM-DD)
- `limit` - Número de registros (default: 50)
- `offset` - Offset para paginación (default: 0)

**Response:**
```json
{
  "status": "success",
  "data": {
    "records": [
      {
        "id": 1,
        "fecha": "2025-12-08T10:30:00Z",
        "usuario_id": 1,
        "accion_id": 1,
        "target_type_id": 2,
        "target_id": 5,
        "detalles": {"method": "POST", "path": "/api/v1/books"},
        "usuario_nombre": "Admin User",
        "usuario_email": "admin@pandebugger.com",
        "accion_nombre": "crear",
        "target_type_nombre": "libro"
      }
    ],
    "total": 150,
    "page": 1,
    "pageSize": 50
  }
}
```

### 2. Get History by ID

```http
GET /api/v1/history/1
Authorization: Bearer <token>
```

### 3. Get History for a Specific Target

```http
GET /api/v1/history/target/libro/5
Authorization: Bearer <token>
```

Obtiene todas las acciones realizadas sobre un libro específico.

### 4. Get Recent Activity

```http
GET /api/v1/history/recent?limit=20
Authorization: Bearer <token>
```

Obtiene la actividad reciente del sistema.

### 5. Get User Activity

```http
GET /api/v1/history/user/1?limit=50
Authorization: Bearer <token>
```

Obtiene todas las acciones realizadas por un usuario específico.

### 6. Get All Actions

```http
GET /api/v1/history/acciones
Authorization: Bearer <token>
```

### 7. Get All Target Types

```http
GET /api/v1/history/target-types
Authorization: Bearer <token>
```

## 💻 **Uso en el Código**
### Usar middleware para logging automático

```typescript
import { logAction, autoLogCrud } from '../../shared/middleware/historyLogger';

// Registrar una acción específica
router.post('/books', 
  authenticate, 
  logAction('crear', 'libro'),
  booksController.create
);

// Registrar automáticamente según el método HTTP
router.use('/books', authenticate, autoLogCrud('libro'));
```

## 🔧 **Middleware de Logging Automático**

El middleware `logAction` y `autoLogCrud` registran automáticamente las acciones exitosas:

```typescript
// En books.routes.ts
import { autoLogCrud } from '../../shared/middleware/historyLogger';

router.use(authenticate, autoLogCrud('libro'));
router.post('/', booksController.create);    // Se registra como 'crear'
router.put('/:id', booksController.update);  // Se registra como 'modificar'
router.delete('/:id', booksController.delete); // Se registra como 'eliminar'
```

###  Añadir detalles extras al log

```typescript
import { setHistoryDetails } from '../../shared/middleware/historyLogger';

async create(req: Request, res: Response) {
  const libro = await booksService.create(req.body);
  
  // Añadir detalles personalizados al log
  setHistoryDetails(req, res, {
    titulo: libro.titulo,
    autor: libro.autor,
    isbn: libro.isbn
  });
  
  res.json(createSuccessResponse(libro));
}
```

## 📊 **Ejemplos de Consulta**

### Obtener historial de un libro específico

```bash
curl -X GET "http://localhost:3000/api/v1/history/target/libro/5" \
  -H "Authorization: Bearer <token>"
```

### Obtener acciones de un usuario en un rango de fechas

```bash
curl -X GET "http://localhost:3000/api/v1/history?usuario_id=1&fecha_inicio=2025-12-01&fecha_fin=2025-12-08" \
  -H "Authorization: Bearer <token>"
```

### Obtener todas las eliminaciones

```bash
# Primero obtener el ID de la acción 'eliminar'
curl -X GET "http://localhost:3000/api/v1/history/acciones" \
  -H "Authorization: Bearer <token>"

# Luego filtrar por ese ID (ejemplo: accion_id=3)
curl -X GET "http://localhost:3000/api/v1/history?accion_id=3" \
  -H "Authorization: Bearer <token>"
```
### Ejemplo para obtener todas las creaciones
/history?accion_id=1

### Ejemplo para obtener todos los logs sobre los libros
/history?target_type_id=1

y asi para cada modulo, se pueden mezcar los parametros segun lo que pida el front.


## 🔐 **Seguridad**

- Todos los endpoints requieren autenticación (JWT token)
- El logging de acciones **no debe bloquear** la operación principal (se ejecuta de forma asíncrona)
- Los errores en el logging se registran en los logs pero no se propagan al usuario

## 📝 **Notas Importantes**

1. **Logging asíncrono**: El logging se realiza después de enviar la respuesta al cliente para no afectar el rendimiento
2. **Solo registra operaciones exitosas**: Solo se registran las acciones con status code 200-299
3. **Detalles en JSON**: El campo `detalles` permite almacenar información adicional en formato JSON
4. **target_id opcional**: Algunas acciones (como login/logout) no tienen un target_id específico

## 🛠️ **Módulo Structure**

```
src/modules/history/
├── history.types.ts          # TypeScript interfaces
├── history.repository.ts     # Database operations
├── history.service.ts        # Business logic
├── history.controller.ts     # HTTP request handlers
├── history.routes.ts         # API routes
└── README.md                # This file
```

---

Para más información sobre la base de datos, ver [Database Guide](../../../docs/DATABASE_GUIDE.md).
