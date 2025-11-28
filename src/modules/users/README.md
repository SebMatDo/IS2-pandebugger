# 👥 Users Module

Gestión completa de usuarios del sistema con roles y permisos.

## 📋 Casos de Uso Implementados

### ✅ CU09 - Crear Usuario
- **Endpoint**: `POST /api/v1/users`
- **Auth**: Requerida (Admin o Bibliotecario)
- **Descripción**: Crear un nuevo usuario en el sistema

**Request Body:**
```json
{
  "nombres": "Juan",
  "apellidos": "Pérez",
  "correo_electronico": "juan.perez@example.com",
  "contraseña": "SecurePass123!",
  "rol_id": 2
}
```

**Validaciones:**
- Todos los campos son obligatorios
- Email debe tener formato válido
- Contraseña debe tener mínimo 8 caracteres, 1 mayúscula, 1 número, 1 símbolo
- Email no debe estar registrado previamente
- El rol debe existir

**Response (201):**
```json
{
  "status": "success",
  "message": "Usuario creado exitosamente",
  "data": {
    "id": 5,
    "nombres": "Juan",
    "apellidos": "Pérez",
    "correo_electronico": "juan.perez@example.com",
    "rol": {
      "id": 2,
      "nombre": "Bibliotecario",
      "descripcion": "Gestiona libros y usuarios"
    },
    "estado": true
  }
}
```

---

### ✅ CU10 - Editar Usuario
- **Endpoint**: `PUT /api/v1/users/:id`
- **Auth**: Requerida (Admin o Bibliotecario)
- **Descripción**: Actualizar información de un usuario

**Request Body (campos opcionales):**
```json
{
  "nombres": "Juan Carlos",
  "apellidos": "Pérez García",
  "correo_electronico": "juan.perez.nuevo@example.com",
  "rol_id": 3,
  "estado": true
}
```

---

### ✅ CU11 - Desactivar Usuario
- **Endpoint**: `DELETE /api/v1/users/:id`
- **Auth**: Requerida (Admin o Bibliotecario)
- **Descripción**: Desactivar un usuario (soft delete)

**Validaciones:**
- No puedes desactivar tu propio usuario
- El usuario debe estar activo

**Response (200):**
```json
{
  "status": "success",
  "message": "Usuario desactivado exitosamente",
  "data": null
}
```

---

### ✅ CU18 - Buscar Usuarios
- **Endpoint**: `GET /api/v1/users`
- **Auth**: Requerida
- **Descripción**: Listar todos los usuarios con filtros opcionales

**Query Parameters:**
- `estado`: `true` (activos) | `false` (inactivos)
- `rol_id`: Filtrar por rol

**Ejemplos:**
```bash
# Todos los usuarios
GET /api/v1/users

# Solo usuarios activos
GET /api/v1/users?estado=true

# Solo bibliotecarios
GET /api/v1/users?rol_id=2

# Bibliotecarios activos
GET /api/v1/users?estado=true&rol_id=2
```

**Response (200):**
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "nombres": "Admin",
      "apellidos": "Sistema",
      "correo_electronico": "admin@pandebugger.com",
      "rol": {
        "id": 1,
        "nombre": "Admin",
        "descripcion": "Administrador del sistema"
      },
      "estado": true
    }
  ]
}
```

---

## 🔐 Endpoints Adicionales

### Obtener Usuario por ID
```
GET /api/v1/users/:id
Auth: Requerida
```

### Activar Usuario
```
PATCH /api/v1/users/:id/activate
Auth: Requerida (Admin o Bibliotecario)
```

### Obtener Roles Disponibles
```
GET /api/v1/users/roles
Auth: Requerida
```

**Response:**
```json
{
  "status": "success",
  "data": [
    { "id": 1, "nombre": "Admin", "descripcion": "Administrador del sistema" },
    { "id": 2, "nombre": "Bibliotecario", "descripcion": "Gestiona libros y usuarios" },
    { "id": 3, "nombre": "Digitalizador", "descripcion": "Digitaliza libros físicos" },
    { "id": 4, "nombre": "Revisor", "descripcion": "Revisa calidad de digitalizaciones" },
    { "id": 5, "nombre": "Restaurador", "descripcion": "Restaura libros dañados" }
  ]
}
```

---

## 🧪 Testing con cURL

### 1. Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@pandebugger.com",
    "password": "Test123!"
  }'
```

### 2. Crear Usuario
```bash
TOKEN="your_jwt_token_here"

curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "nombres": "Carlos",
    "apellidos": "Ruiz",
    "correo_electronico": "carlos.ruiz@example.com",
    "contraseña": "SecurePass123!",
    "rol_id": 3
  }'
```

### 3. Listar Usuarios
```bash
curl -X GET http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Obtener Usuario
```bash
curl -X GET http://localhost:3000/api/v1/users/5 \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Actualizar Usuario
```bash
curl -X PUT http://localhost:3000/api/v1/users/5 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "nombres": "Carlos Alberto",
    "rol_id": 4
  }'
```

### 6. Desactivar Usuario
```bash
curl -X DELETE http://localhost:3000/api/v1/users/5 \
  -H "Authorization: Bearer $TOKEN"
```

### 7. Activar Usuario
```bash
curl -X PATCH http://localhost:3000/api/v1/users/5/activate \
  -H "Authorization: Bearer $TOKEN"
```

### 8. Obtener Roles
```bash
curl -X GET http://localhost:3000/api/v1/users/roles \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🏗️ Arquitectura

```
users/
├── users.types.ts       # Interfaces y tipos TypeScript
├── users.service.ts     # Lógica de negocio
├── users.controller.ts  # Controladores HTTP
├── users.routes.ts      # Definición de rutas
└── README.md           # Esta documentación
```

---

## 🔒 Permisos por Rol

| Endpoint | Admin | Bibliotecario | Otros |
|----------|-------|---------------|-------|
| GET /users | ✅ | ✅ | ✅ |
| GET /users/:id | ✅ | ✅ | ✅ |
| POST /users | ✅ | ✅ | ❌ |
| PUT /users/:id | ✅ | ✅ | ❌ |
| DELETE /users/:id | ✅ | ✅ | ❌ |
| PATCH /users/:id/activate | ✅ | ✅ | ❌ |
| GET /users/roles | ✅ | ✅ | ✅ |

> **Nota**: Actualmente todos los endpoints autenticados están disponibles. Se debe implementar middleware de autorización por roles.

---

## 🧪 Testing

El módulo de usuarios cuenta con pruebas unitarias completas:

```bash
# Ejecutar solo pruebas de usuarios
npm run test:users

# Ejecutar con cobertura
npm run test:coverage
```

### Cobertura de Tests

- **UsersService**: 17 pruebas
  - CU09 (Crear Usuario): 3 tests
  - CU10 (Editar Usuario): 3 tests
  - CU11 (Desactivar Usuario): 4 tests
  - CU18 (Buscar Usuarios): 2 tests
  - Funcionalidades adicionales: 5 tests

- **UsersController**: 9 pruebas
  - Endpoints de API
  - Validación de parámetros
  - Manejo de errores

**Total: 26 pruebas pasando** ✅

---

## 📝 TODO

- [ ] Implementar middleware de autorización por roles
- [ ] Agregar logging al historial (write_to_historial)
- [ ] Implementar tests unitarios
- [ ] Agregar paginación a GET /users
- [ ] Implementar búsqueda por nombre/email
- [ ] Agregar validación de permisos más granular

---

## 🐛 Errores Comunes

### 400 - Bad Request
- Campos obligatorios faltantes
- Formato de email inválido
- Contraseña débil
- Rol no existe

### 401 - Unauthorized
- Token JWT inválido o expirado
- Sin token de autenticación

### 404 - Not Found
- Usuario no encontrado

### 409 - Conflict
- Email ya registrado

---

## 📚 Referencias

- [CU09 - Python Implementation](../../old_python/use_cases/CU09_create_user_screen.py)
- [CU10 - Python Implementation](../../old_python/use_cases/CU10_edit_user_screen.py)
- [CU11 - Python Implementation](../../old_python/use_cases/CU11_deactivate_user_screen.py)
- [CU18 - Python Implementation](../../old_python/use_cases/CU18_search_users_screen.py)
