# 🚀 Getting Started - Pandebugger Backend

Guía completa paso a paso para configurar, ejecutar y probar el proyecto desde cero.

---

## 📋 **Tabla de Contenidos**

1. [Requisitos Previos](#requisitos-previos)
2. [Instalación Inicial](#instalación-inicial)
3. [Configuración de Base de Datos](#configuración-de-base-de-datos)
4. [Acceso a pgAdmin](#acceso-a-pgadmin)
5. [Verificación del Sistema](#verificación-del-sistema)
6. [Testing con Postman](#testing-con-postman)
7. [Solución de Problemas](#solución-de-problemas)

---

## 📦 **Requisitos Previos**

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** >= 18.0.0 ([Descargar](https://nodejs.org/))
- **npm** >= 9.0.0 (viene con Node.js)
- **Docker** y **Docker Compose** ([Descargar](https://www.docker.com/))
- **Git** ([Descargar](https://git-scm.com/))
- **Postman** (opcional, para testing) ([Descargar](https://www.postman.com/downloads/))

### Verificar instalaciones:

```bash
node --version    # Debe ser >= 18
npm --version     # Debe ser >= 9
docker --version
docker compose version
```

---

## 🔧 **Instalación Inicial**

### **Paso 1: Clonar el repositorio**

```bash
git clone https://github.com/SebMatDo/IS2-pandebugger.git
cd IS2-pandebugger
```

### **Paso 2: Instalar dependencias**

```bash
npm install
```

Esto instalará todas las dependencias necesarias del proyecto.

### **Paso 3: Configurar variables de entorno**

Copia el archivo de ejemplo y configúralo:

```bash
cp .env.local .env
```

El archivo `.env` ya viene pre-configurado para desarrollo local. No necesitas modificarlo.

**Contenido de `.env` (ya configurado):**
```env
NODE_ENV=development
PORT=3000
API_PREFIX=/api/v1

# Database - Docker Postgres (local)
DB_HOST=postgres
DB_PORT=5432
DB_NAME=pandebugger_dev
DB_USER=pandebugger_user
DB_PASSWORD=pandebugger_local_pass_2024

# JWT
JWT_SECRET=local_dev_jwt_secret_change_in_production_12345
JWT_EXPIRES_IN=7d

# Logging
LOG_LEVEL=debug
```

---

## 🐳 **Configuración de Base de Datos**

### **Paso 4: Iniciar los contenedores Docker**

Este comando levantará:
- Backend API (puerto 3000)
- PostgreSQL (puerto 5432)
- pgAdmin (puerto 5050)

```bash
docker compose up -d
```

Espera unos segundos a que todos los servicios estén listos.

### **Paso 5: Verificar que los contenedores estén corriendo**

```bash
docker compose ps
```

Deberías ver algo como:

```
NAME                   STATUS
pandebugger-dev        Up (healthy)
pandebugger-postgres   Up (healthy)
pandebugger-pgadmin    Up
```

### **Paso 6: Verificar las migraciones**

Las migraciones se ejecutan automáticamente al iniciar el contenedor de PostgreSQL. Verifica que las tablas fueron creadas:

```bash
docker exec -it pandebugger-postgres psql -U pandebugger_user -d pandebugger_dev -c "\dt"
```

**Salida esperada:**
```
              List of relations
 Schema |      Name       | Type  |      Owner       
--------+-----------------+-------+------------------
 public | accion          | table | pandebugger_user
 public | categoria       | table | pandebugger_user
 public | estados_libro   | table | pandebugger_user
 public | historial       | table | pandebugger_user
 public | libros          | table | pandebugger_user
 public | roles           | table | pandebugger_user
 public | tareas          | table | pandebugger_user
 public | target_type     | table | pandebugger_user
 public | usuarios        | table | pandebugger_user
```

### **Paso 7: Cargar datos de prueba (seeds)**

Ejecuta estos comandos para cargar usuarios, libros y tareas de ejemplo:

```bash
# Cargar usuarios de prueba
docker exec -i pandebugger-postgres psql -U pandebugger_user -d pandebugger_dev < src/shared/database/seeds/001_seed_test_users.sql

# Cargar libros de ejemplo
docker exec -i pandebugger-postgres psql -U pandebugger_user -d pandebugger_dev < src/shared/database/seeds/002_seed_test_books.sql

# Cargar tareas de ejemplo
docker exec -i pandebugger-postgres psql -U pandebugger_user -d pandebugger_dev < src/shared/database/seeds/003_seed_test_tasks.sql
```

**Salida esperada:**
```
INSERT 0 5
INSERT 0 10
INSERT 0 3
```

### **Paso 8: Verificar los datos cargados**

```bash
docker exec -it pandebugger-postgres psql -U pandebugger_user -d pandebugger_dev -c "SELECT COUNT(*) as total_usuarios FROM usuarios; SELECT COUNT(*) as total_libros FROM libros;"
```

**Salida esperada:**
```
 total_usuarios 
----------------
              5

 total_libros 
--------------
           10
```

---

## 🎨 **Acceso a pgAdmin**

pgAdmin es una interfaz gráfica para administrar PostgreSQL.

### **Paso 9: Abrir pgAdmin**

1. Abre tu navegador y ve a: **http://localhost:5050**

2. **Login en pgAdmin:**
   - Email: `admin@pandebugger.com`
   - Password: `admin`

### **Paso 10: Registrar el servidor PostgreSQL**

Una vez dentro de pgAdmin:

1. Click derecho en **"Servers"** (panel izquierdo)
2. Selecciona **"Register" → "Server"**

3. **Pestaña "General":**
   - Name: `Local Dev`

4. **Pestaña "Connection":**
   - Host name/address: `postgres`
   - Port: `5432`
   - Maintenance database: `pandebugger_dev`
   - Username: `pandebugger_user`
   - Password: `pandebugger_local_pass_2024`
   - ✅ Marca **"Save password"**

5. **Pestaña "SSL":**
   - SSL mode: `Disable`

6. Click **"Save"**

### **Paso 11: Explorar los datos**

Navega por la estructura:

```
Servers
└── Local Dev
    └── Databases
        └── pandebugger_dev
            └── Schemas
                └── public
                    └── Tables
                        ├── usuarios      (5 registros)
                        ├── libros        (10 registros)
                        ├── roles         (5 registros)
                        ├── categoria     (15 registros)
                        └── ...
```

Para ver datos de una tabla:
- Click derecho en la tabla → **"View/Edit Data"** → **"All Rows"**

---

## ✅ **Verificación del Sistema**

### **Paso 12: Probar el API**

Verifica que el backend esté funcionando correctamente:

```bash
# Health check básico
curl http://localhost:3000/api/v1/health

# Respuesta esperada:
# {
#   "status": "healthy",
#   "timestamp": "2025-11-23T17:00:00.000Z",
#   "uptime": 123.45
# }
```

### **Paso 13: Ver logs del backend**

Para ver los logs en tiempo real:

```bash
docker compose logs -f app
```

Presiona `Ctrl+C` para salir.

---

## 🧪 **Testing con Postman**

### **Paso 14: Configurar Postman**

Ver la guía completa: **[docs/API_TESTING.md](./API_TESTING.md)**

**Resumen rápido:**

1. **Crear colección:** "Pandebugger API"
2. **Configurar ambiente:** Base URL = `http://localhost:3000/api/v1`
3. **Probar login:**

```http
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@pandebugger.com",
  "password": "Test123!"
}
```

4. **Usar el token** en endpoints protegidos:

```http
GET http://localhost:3000/api/v1/auth/me
Authorization: Bearer <tu_token_aqui>
```

### **Usuarios de prueba disponibles:**

Todos usan la contraseña: **`Test123!`**

| Email | Rol |
|-------|-----|
| admin@pandebugger.com | Admin |
| maria.gonzalez@pandebugger.com | Bibliotecario |
| carlos.ramirez@pandebugger.com | Digitalizador |
| ana.martinez@pandebugger.com | Revisor |
| luis.fernandez@pandebugger.com | Restaurador |

---

## 🔧 **Solución de Problemas**

### **Problema: Los contenedores no inician**

```bash
# Detener todo y limpiar
docker compose down -v

# Volver a iniciar
docker compose up -d
```

### **Problema: "Port 5432 already in use"**

Tienes otro PostgreSQL corriendo en tu máquina.

**Solución 1:** Detén el PostgreSQL local:
```bash
sudo systemctl stop postgresql  # Linux
brew services stop postgresql   # macOS
```

**Solución 2:** Cambia el puerto en `docker-compose.yml`:
```yaml
postgres:
  ports:
    - "5433:5432"  # Cambiar a 5433
```

### **Problema: "Cannot connect to database" en pgAdmin**

1. Asegúrate de usar `postgres` como host (no `localhost`)
2. Verifica que el contenedor esté corriendo: `docker compose ps`
3. Intenta reiniciar pgAdmin: `docker compose restart pgadmin`

### **Problema: Las migraciones no se ejecutaron**

```bash
# Ejecutarlas manualmente
docker exec -i pandebugger-postgres psql -U pandebugger_user -d pandebugger_dev < src/shared/database/migrations/001_initial_schema.sql
docker exec -i pandebugger-postgres psql -U pandebugger_user -d pandebugger_dev < src/shared/database/migrations/002_seed_reference_data.sql
```

### **Problema: "Token no proporcionado" en Postman**

1. Verifica que el header sea: `Authorization: Bearer <token>`
2. Asegúrate de incluir la palabra `Bearer` antes del token
3. Verifica que no haya espacios extra o comillas

### **Ver todos los logs:**

```bash
# Backend
docker compose logs -f app

# PostgreSQL
docker compose logs -f postgres

# pgAdmin
docker compose logs -f pgadmin

# Todos
docker compose logs -f
```

---

## 🎯 **Comandos Útiles**

```bash
# Iniciar contenedores
docker compose up -d

# Detener contenedores
docker compose down

# Detener y eliminar volúmenes (BORRA DATOS)
docker compose down -v

# Ver estado de contenedores
docker compose ps

# Ver logs
docker compose logs -f app

# Reiniciar un servicio específico
docker compose restart app

# Acceder a la shell de PostgreSQL
docker exec -it pandebugger-postgres psql -U pandebugger_user -d pandebugger_dev

# Ejecutar seeds manualmente
docker exec -i pandebugger-postgres psql -U pandebugger_user -d pandebugger_dev < src/shared/database/seeds/001_seed_test_users.sql

# Recargar todo desde cero
docker compose down -v && docker compose up -d
```

---

## 📚 **Próximos Pasos**

Una vez que todo esté funcionando:

1. ✅ **[API Testing Guide](./API_TESTING.md)** - Pruebas completas con Postman
2. ✅ **[Database Guide](./DATABASE_GUIDE.md)** - Gestión de migraciones y seeds
3. ✅ **[AWS Deployment](./AWS_DEPLOYMENT.md)** - Despliegue en producción
4. ✅ **[Development Guide](./DEVELOPMENT.md)** - Agregar nuevos módulos

---

## 🆘 **¿Necesitas ayuda?**

- **Documentación adicional:** Ver carpeta `docs/`
- **Issues del proyecto:** https://github.com/SebMatDo/IS2-pandebugger/issues
- **Revisar logs:** `docker compose logs -f`

---

**¡Felicidades! 🎉 Tu ambiente de desarrollo está listo.**

Continúa con la [Guía de Testing de API](./API_TESTING.md) para aprender a probar todos los endpoints.
