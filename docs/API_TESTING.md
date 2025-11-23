# 🧪 API Testing Guide - Postman

Guía completa para probar la API de Pandebugger usando Postman.

---

## 📋 **Tabla de Contenidos**

1. [Instalación de Postman](#instalación-de-postman)
2. [Configuración Inicial](#configuración-inicial)
3. [Testing de Autenticación](#testing-de-autenticación)
4. [Testing de Endpoints Protegidos](#testing-de-endpoints-protegidos)
5. [Colección Completa de Endpoints](#colección-completa-de-endpoints)
6. [Automatización de Tests](#automatización-de-tests)
7. [Troubleshooting](#troubleshooting)

---

## 📥 **Instalación de Postman**

### **Descargar e instalar**

**Opción 1: Aplicación de escritorio (Recomendado)**
- Descarga desde: https://www.postman.com/downloads/
- Disponible para Windows, macOS y Linux

**Opción 2: Linux (Snap)**
```bash
sudo snap install postman
```

**Opción 3: Web (sin instalación)**
- Ve a: https://web.postman.co/

### **Crear cuenta (opcional)**

Crear una cuenta te permite:
- Sincronizar colecciones entre dispositivos
- Compartir colecciones con tu equipo
- Usar funciones avanzadas

---

## ⚙️ **Configuración Inicial**

### **Paso 1: Crear Workspace**

1. Abre Postman
2. Click en "Workspaces" (esquina superior izquierda)
3. Click "Create Workspace"
4. Nombre: `Pandebugger Development`
5. Visibility: `Personal` (o `Team` si trabajas en equipo)
6. Click "Create"

### **Paso 2: Crear Colección**

1. En el panel izquierdo, click en "Collections"
2. Click "+" o "Create Collection"
3. Nombre: `Pandebugger API`
4. Description: `API endpoints for Pandebugger book digitalization system`

### **Paso 3: Configurar Ambiente (Environment)**

Los ambientes te permiten cambiar fácilmente entre desarrollo, testing y producción.

1. Click en el ícono de **⚙️ (Settings)** → "Environments"
2. Click "+" para crear nuevo ambiente
3. Nombre: `Local Development`

4. **Agregar variables:**

| Variable | Initial Value | Current Value | Type |
|----------|---------------|---------------|------|
| `base_url` | `http://localhost:3000/api/v1` | `http://localhost:3000/api/v1` | default |
| `auth_token` | (dejar vacío) | (dejar vacío) | secret |

5. Click "Save"
6. **Selecciona el ambiente** "Local Development" en el dropdown (esquina superior derecha)

### **Verificar configuración**

Deberías ver en la esquina superior derecha:
```
Environment: Local Development
```

---

## 🔐 **Testing de Autenticación**

### **Paso 4: Request de Login**

Este es el endpoint más importante, ya que obtienes el token JWT necesario para acceder a endpoints protegidos.

#### **Crear el request**

1. En tu colección "Pandebugger API", click **"Add request"**
2. Nombre: `Auth - Login`
3. Configura:

**Method:** `POST`

**URL:** `{{base_url}}/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Body:** (selecciona "raw" y "JSON")
```json
{
  "email": "admin@pandebugger.com",
  "password": "Test123!"
}
```

#### **Script para guardar token automáticamente**

En la pestaña **"Tests"** del request, pega este código:

```javascript
// Guardar token si el login es exitoso
if (pm.response.code === 200) {
    const response = pm.response.json();
    
    // Guardar token en variable de ambiente
    pm.environment.set("auth_token", response.data.token);
    
    // Logs para debugging
    console.log("✅ Login exitoso");
    console.log("Token guardado:", response.data.token.substring(0, 20) + "...");
    console.log("Usuario:", response.data.user.email);
    console.log("Rol:", response.data.user.rol_nombre);
    
    // Test de validación
    pm.test("Status code is 200", function () {
        pm.response.to.have.status(200);
    });
    
    pm.test("Response has token", function () {
        pm.expect(response.data.token).to.be.a('string');
        pm.expect(response.data.token.length).to.be.above(50);
    });
    
    pm.test("Response has user data", function () {
        pm.expect(response.data.user).to.have.property('email');
        pm.expect(response.data.user).to.have.property('rol_nombre');
    });
} else {
    console.log("❌ Login fallido");
    console.log("Status:", pm.response.code);
    console.log("Response:", pm.response.json());
}
```

#### **Ejecutar el request**

1. Click en **"Send"**
2. Verifica la respuesta

**Respuesta esperada (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjYsImVtYWlsIjoiYWRtaW5AcGFuZGVidWdnZXIuY29tIiwicm9sSWQiOjEsInJvbE5vbWJyZSI6IkFkbWluIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjE3MDA2MDQ4MDB9.abc123def456...",
    "user": {
      "id": 6,
      "nombres": "Admin",
      "apellidos": "Sistema",
      "correo_electronico": "admin@pandebugger.com",
      "rol_id": 1,
      "rol_nombre": "Admin",
      "estado": true
    }
  },
  "message": "Login exitoso"
}
```

#### **Verificar que el token se guardó**

1. Click en el ícono **👁️ (eye)** en la esquina superior derecha
2. Busca la variable `auth_token`
3. Deberías ver el token JWT guardado

---

## 🔒 **Testing de Endpoints Protegidos**

Los endpoints protegidos requieren el token JWT en el header `Authorization`.

### **Paso 5: Get Current User (GET /auth/me)**

Este endpoint retorna la información del usuario autenticado.

#### **Crear el request**

1. En tu colección, click **"Add request"**
2. Nombre: `Auth - Get Me`
3. Configura:

**Method:** `GET`

**URL:** `{{base_url}}/auth/me`

**Headers:**
```
Authorization: Bearer {{auth_token}}
Content-Type: application/json
```

> **Nota:** Postman reemplazará automáticamente `{{auth_token}}` con el valor guardado.

**Tests:**
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    
    console.log("✅ Usuario obtenido");
    console.log("Nombre:", response.data.nombres, response.data.apellidos);
    console.log("Email:", response.data.correo_electronico);
    console.log("Rol:", response.data.rol_nombre);
    
    pm.test("Status code is 200", function () {
        pm.response.to.have.status(200);
    });
    
    pm.test("User data is complete", function () {
        pm.expect(response.data).to.have.property('id');
        pm.expect(response.data).to.have.property('correo_electronico');
        pm.expect(response.data).to.have.property('rol_nombre');
    });
} else if (pm.response.code === 401) {
    console.log("❌ No autenticado - Ejecuta el request de Login primero");
} else {
    console.log("❌ Error:", pm.response.code);
}
```

**Respuesta esperada (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 6,
    "nombres": "Admin",
    "apellidos": "Sistema",
    "correo_electronico": "admin@pandebugger.com",
    "rol_id": 1,
    "rol_nombre": "Admin",
    "rol_descripcion": "Administrador del sistema con acceso completo",
    "estado": true,
    "created_at": "2025-11-23T17:00:00.000Z",
    "updated_at": "2025-11-23T17:00:00.000Z"
  }
}
```

### **Paso 6: Change Password (POST /auth/change-password)**

Permite cambiar la contraseña del usuario autenticado.

**Method:** `POST`

**URL:** `{{base_url}}/auth/change-password`

**Headers:**
```
Authorization: Bearer {{auth_token}}
Content-Type: application/json
```

**Body:**
```json
{
  "currentPassword": "Test123!",
  "newPassword": "NewPass456!"
}
```

> ⚠️ **Nota:** Si cambias la contraseña, necesitarás hacer login nuevamente con la nueva contraseña.

---

## 📚 **Colección Completa de Endpoints**

### **Authentication Module**

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/auth/login` | POST | ❌ No | Login y obtener token JWT |
| `/auth/me` | GET | ✅ Sí | Obtener información del usuario actual |
| `/auth/change-password` | POST | ✅ Sí | Cambiar contraseña |
| `/auth/restore-password` | POST | ❌ No | Restaurar contraseña (TODO) |

### **Health Check**

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/health` | GET | ❌ No | Health check básico |
| `/health/readiness` | GET | ❌ No | Readiness probe (DB check) |

### **Books Module** (si está implementado)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/books` | GET | ✅ Sí | Listar libros |
| `/books/:id` | GET | ✅ Sí | Obtener libro por ID |
| `/books` | POST | ✅ Sí | Crear nuevo libro |
| `/books/:id` | PUT | ✅ Sí | Actualizar libro |
| `/books/:id` | DELETE | ✅ Sí | Eliminar libro |

---

## 🔄 **Flujo de Testing Recomendado**

### **Orden de ejecución**

1. **Health Check** → Verificar que el servidor está corriendo
2. **Login** → Obtener token JWT
3. **Get Me** → Verificar autenticación
4. **Otros endpoints protegidos** → Probar funcionalidad específica

### **Ejemplo de sesión completa**

```
1. GET  /health                    → 200 OK (servidor funcionando)
2. POST /auth/login                → 200 OK (token guardado automáticamente)
3. GET  /auth/me                   → 200 OK (autenticación exitosa)
4. GET  /books                     → 200 OK (lista de libros)
5. POST /books                     → 201 Created (libro creado)
6. GET  /books/11                  → 200 OK (libro recién creado)
7. PUT  /books/11                  → 200 OK (libro actualizado)
8. POST /auth/change-password      → 200 OK (contraseña cambiada)
```

---

## 🤖 **Automatización de Tests**

### **Crear Test Suite**

Postman permite ejecutar todas las requests en secuencia automáticamente.

#### **Collection Runner**

1. Click derecho en tu colección "Pandebugger API"
2. Selecciona "Run collection"
3. Selecciona el ambiente "Local Development"
4. Click "Run Pandebugger API"

Postman ejecutará todos los requests en orden y mostrará los resultados.

#### **Scripts Pre-request**

Para ejecutar código antes de cada request:

```javascript
// Pre-request Script (nivel de colección)
console.log("🚀 Ejecutando:", pm.info.requestName);
console.log("📍 URL:", pm.request.url);
console.log("🕐 Timestamp:", new Date().toISOString());
```

#### **Tests globales**

En el nivel de colección, puedes agregar tests que se ejecuten en todos los requests:

```javascript
// Tests (nivel de colección)
pm.test("Response time is acceptable", function () {
    pm.expect(pm.response.responseTime).to.be.below(500);
});

pm.test("Response has correct content-type", function () {
    pm.expect(pm.response.headers.get("Content-Type")).to.include("application/json");
});
```

---

## 🧑‍🤝‍🧑 **Testing con Diferentes Usuarios**

### **Usuarios de prueba disponibles**

Todos usan la contraseña: **`Test123!`**

| Email | Rol | Permisos |
|-------|-----|----------|
| admin@pandebugger.com | Admin | Todos los permisos |
| maria.gonzalez@pandebugger.com | Bibliotecario | Gestión de libros y usuarios |
| carlos.ramirez@pandebugger.com | Digitalizador | Digitalizar y subir archivos |
| ana.martinez@pandebugger.com | Revisor | Revisar calidad |
| luis.fernandez@pandebugger.com | Restaurador | Restauración física |

### **Probar permisos por rol**

1. **Duplica el request de Login** (click derecho → Duplicate)
2. Renombra: "Auth - Login (Bibliotecario)"
3. Cambia el email a `maria.gonzalez@pandebugger.com`
4. Ejecuta y verifica que obtienes un token diferente
5. Usa ese token para probar endpoints específicos del rol

---

## 🐛 **Troubleshooting**

### **Error: "Token no proporcionado"**

**Causa:** El header `Authorization` no está configurado correctamente.

**Solución:**
1. Verifica que el header sea: `Authorization: Bearer {{auth_token}}`
2. Asegúrate de incluir la palabra `Bearer` con espacio
3. Verifica que la variable `{{auth_token}}` tenga valor (ícono 👁️)

### **Error: "Token inválido"**

**Causa:** El token expiró o es incorrecto.

**Solución:**
1. Ejecuta nuevamente el request de Login
2. El token tiene una validez de 7 días por defecto

### **Error: "ECONNREFUSED"**

**Causa:** El servidor no está corriendo.

**Solución:**
```bash
# Verificar que los contenedores estén activos
docker compose ps

# Si no están corriendo, iniciarlos
docker compose up -d

# Ver logs
docker compose logs -f app
```

### **Variables no se reemplazan**

**Causa:** El ambiente no está seleccionado.

**Solución:**
1. Verifica que "Local Development" esté seleccionado (esquina superior derecha)
2. Las variables deben estar en formato `{{variable_name}}`

### **Tests fallan**

**Causa:** La respuesta no es la esperada.

**Solución:**
1. Revisa la pestaña "Console" (abajo) para ver logs detallados
2. Verifica el código de estado HTTP
3. Revisa el body de la respuesta

---

## 📤 **Exportar e Importar Colección**

### **Exportar colección**

Para compartir con tu equipo:

1. Click derecho en "Pandebugger API"
2. Selecciona "Export"
3. Formato: "Collection v2.1"
4. Click "Export"
5. Guarda como: `Pandebugger_API.postman_collection.json`

### **Importar colección**

1. Click en "Import" (esquina superior izquierda)
2. Selecciona el archivo `.json`
3. Click "Import"

### **Exportar ambiente**

1. Click en ⚙️ → "Environments"
2. Click en los tres puntos junto a "Local Development"
3. "Export"
4. Guarda como: `Local_Development.postman_environment.json`

---

## 📊 **Monitoreo y Reportes**

### **Ver historial de requests**

1. Click en "History" (panel izquierdo)
2. Verás todos los requests ejecutados
3. Click en cualquiera para ver detalles

### **Generar documentación**

Postman puede generar documentación automática:

1. En tu colección, click en "..." → "View documentation"
2. Click "Publish" para generar URL pública
3. Comparte la URL con tu equipo

---

## 🎯 **Ejemplo Completo: Testing de Flujo**

### **Escenario: Crear un libro nuevo**

1. **Login como Admin:**
```
POST {{base_url}}/auth/login
Body: { "email": "admin@pandebugger.com", "password": "Test123!" }
```

2. **Verificar autenticación:**
```
GET {{base_url}}/auth/me
Headers: Authorization: Bearer {{auth_token}}
```

3. **Crear libro:**
```
POST {{base_url}}/books
Headers: Authorization: Bearer {{auth_token}}
Body: {
  "titulo": "Nuevo Libro de Prueba",
  "autor": "Autor Test",
  "isbn": "978-1234567890",
  "categoria_id": 1,
  "estado_id": 1
}
```

4. **Verificar libro creado:**
```
GET {{base_url}}/books/11
Headers: Authorization: Bearer {{auth_token}}
```

---

## 📚 **Recursos Adicionales**

- **[Getting Started](./GETTING_STARTED.md)** - Configuración inicial del proyecto
- **[Database Guide](./DATABASE_GUIDE.md)** - Gestión de base de datos
- **[Postman Documentation](https://learning.postman.com/docs/)** - Documentación oficial
- **[JWT.io](https://jwt.io/)** - Decodificar tokens JWT

---

¡Ahora estás listo para probar toda la API! 🚀

Si encuentras algún problema, revisa la sección de Troubleshooting o consulta los logs del servidor con `docker compose logs -f app`.
