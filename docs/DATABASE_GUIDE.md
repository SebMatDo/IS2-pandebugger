# 🗄️ Database Guide - Pandebugger

Guía completa para gestionar la base de datos, migraciones y datos de prueba.

---

## 📋 **Tabla de Contenidos**

1. [Arquitectura de la Base de Datos](#arquitectura-de-la-base-de-datos)
2. [Información de Conexión](#información-de-conexión)
3. [Sistema de Migraciones](#sistema-de-migraciones)
4. [Datos de Prueba (Seeds)](#datos-de-prueba-seeds)
5. [Uso de pgAdmin](#uso-de-pgadmin)
6. [Gestión de Base de Datos](#gestión-de-base-de-datos)
7. [Queries Útiles](#queries-útiles)

---

## 🏗️ **Arquitectura de la Base de Datos**

### **Esquema de Tablas**

```
┌─────────────────┐
│     roles       │     ┌──────────────────┐
│                 │────▶│    usuarios      │
│ - id            │     │ - id             │
│ - nombre        │     │ - nombres        │
│ - descripcion   │     │ - apellidos      │
└─────────────────┘     │ - correo_elect..│
                        │ - hash_contraseña│
                        │ - rol_id (FK)    │
                        │ - estado         │
                        └──────────────────┘

┌──────────────────┐    ┌──────────────────┐
│ estados_libro    │───▶│     libros       │
│ - id             │    │ - id             │
│ - nombre         │    │ - isbn           │
│ - descripcion    │    │ - titulo         │
│ - orden          │    │ - autor          │
└──────────────────┘    │ - estado_id (FK) │
                        │ - categoria_id(FK)│
┌──────────────────┐    │ - directorio_pdf │
│   categoria      │───▶└──────────────────┘
│ - id             │
│ - nombre         │    ┌──────────────────┐
│ - descripcion    │    │     tareas       │
└──────────────────┘    │ - id             │
                        │ - libro_id (FK)  │
                        │ - usuario_id (FK)│
                        │ - estado_nuevo..  │
                        └──────────────────┘

┌──────────────────┐
│   historial      │
│ - id             │
│ - fecha          │
│ - usuario_id (FK)│
│ - accion_id (FK) │
│ - target_type..  │
│ - target_id      │
└──────────────────┘
```

### **Relaciones Principales**

- `usuarios` → `roles` (muchos a uno)
- `libros` → `estados_libro` (muchos a uno)
- `libros` → `categoria` (muchos a uno)
- `tareas` → `libros` (muchos a uno)
- `tareas` → `usuarios` (muchos a uno)
- `historial` → `usuarios` (muchos a uno)
- `historial` → `accion` (muchos a uno)

---

## 🔌 **Información de Conexión**

### **Desarrollo Local (Docker)**

```yaml
Host: postgres            # Desde contenedores Docker
      localhost           # Desde tu máquina local
Port: 5432
Database: pandebugger_dev
Username: pandebugger_user
Password: pandebugger_local_pass_2024
```

### **pgAdmin**

```yaml
URL: http://localhost:5050
Email: admin@pandebugger.com
Password: admin
```

### **Conectar desde terminal**

```bash
# Desde tu máquina local
psql -h localhost -p 5432 -U pandebugger_user -d pandebugger_dev

# Desde dentro del contenedor
docker exec -it pandebugger-postgres psql -U pandebugger_user -d pandebugger_dev
```

### **String de conexión**

```
postgresql://pandebugger_user:pandebugger_local_pass_2024@localhost:5432/pandebugger_dev
```

---

## 🔄 **Sistema de Migraciones**

### **¿Qué son las migraciones?**

Las migraciones son archivos SQL que definen cambios en la estructura de la base de datos de forma versionada y ordenada.

### **Ubicación de las migraciones**

```
src/shared/database/migrations/
├── 001_initial_schema.sql          # Crea todas las tablas
└── 002_seed_reference_data.sql     # Inserta datos de referencia
```

### **Convención de nombres**

```
XXX_description.sql

Ejemplos:
001_initial_schema.sql
002_seed_reference_data.sql
003_add_book_reviews.sql
004_add_user_profile_fields.sql
```

### **Ejecución automática**

Las migraciones en `/migrations/` se ejecutan **automáticamente** cuando inicias el contenedor de PostgreSQL por primera vez gracias a esta configuración en `docker-compose.yml`:

```yaml
postgres:
  volumes:
    - ./src/shared/database/migrations:/docker-entrypoint-initdb.d:ro
```

### **Ejecución manual**

Si necesitas ejecutar migraciones manualmente:

```bash
# Ejecutar una migración específica
docker exec -i pandebugger-postgres psql -U pandebugger_user -d pandebugger_dev < src/shared/database/migrations/001_initial_schema.sql

# Ejecutar todas las migraciones en orden
for file in src/shared/database/migrations/*.sql; do
  echo "Executing $file..."
  docker exec -i pandebugger-postgres psql -U pandebugger_user -d pandebugger_dev < "$file"
done
```

### **Crear una nueva migración**

1. **Crea el archivo con el siguiente número:**

```bash
# Ejemplo: Agregar campo 'telefono' a usuarios
touch src/shared/database/migrations/003_add_user_phone.sql
```

2. **Escribe el SQL:**

```sql
-- Migration: 003_add_user_phone.sql
-- Description: Add phone field to usuarios table
-- Date: 2025-11-23

-- Add column
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS telefono VARCHAR(20);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_usuarios_telefono ON usuarios(telefono);

-- Migration complete
```

3. **Ejecuta la migración:**

```bash
docker exec -i pandebugger-postgres psql -U pandebugger_user -d pandebugger_dev < src/shared/database/migrations/003_add_user_phone.sql
```

### **Buenas prácticas para migraciones**

✅ **SÍ hacer:**
- Usar `IF NOT EXISTS` y `IF EXISTS`
- Usar `ON CONFLICT DO NOTHING` en inserts
- Nombrar archivos secuencialmente (001, 002, 003...)
- Incluir comentarios descriptivos
- Hacer migraciones pequeñas y atómicas
- Probar en desarrollo antes de producción

❌ **NO hacer:**
- Modificar migraciones ya ejecutadas en producción
- Hacer cambios destructivos sin respaldo
- Mezclar cambios de esquema con cambios de datos
- Usar comandos específicos de un DBMS

---

## 🌱 **Datos de Prueba (Seeds)**

### **¿Qué son los seeds?**

Los seeds son datos de ejemplo para desarrollo y testing. **Nunca se ejecutan en producción.**

### **Ubicación de los seeds**

```
src/shared/database/seeds/
├── 001_seed_test_users.sql     # 5 usuarios de prueba
├── 002_seed_test_books.sql     # 10 libros de ejemplo
└── 003_seed_test_tasks.sql     # 3 tareas asignadas
```

### **Cargar todos los seeds**

```bash
# Método rápido (ejecutar todos)
docker exec -i pandebugger-postgres psql -U pandebugger_user -d pandebugger_dev < src/shared/database/seeds/001_seed_test_users.sql
docker exec -i pandebugger-postgres psql -U pandebugger_user -d pandebugger_dev < src/shared/database/seeds/002_seed_test_books.sql
docker exec -i pandebugger-postgres psql -U pandebugger_user -d pandebugger_dev < src/shared/database/seeds/003_seed_test_tasks.sql
```

### **Script para cargar seeds**

Crea un archivo `load-seeds.sh`:

```bash
#!/bin/bash
echo "Loading seeds..."
for file in src/shared/database/seeds/*.sql; do
  echo "Executing $file..."
  docker exec -i pandebugger-postgres psql -U pandebugger_user -d pandebugger_dev < "$file"
done
echo "Seeds loaded successfully!"
```

Hazlo ejecutable y úsalo:

```bash
chmod +x load-seeds.sh
./load-seeds.sh
```

### **Usuarios de prueba incluidos**

Todos usan la contraseña: **`Test123!`**

| Email | Rol | Password |
|-------|-----|----------|
| admin@pandebugger.com | Admin | Test123! |
| maria.gonzalez@pandebugger.com | Bibliotecario | Test123! |
| carlos.ramirez@pandebugger.com | Digitalizador | Test123! |
| ana.martinez@pandebugger.com | Revisor | Test123! |
| luis.fernandez@pandebugger.com | Restaurador | Test123! |

### **Libros de ejemplo incluidos**

- Cien años de soledad (Gabriel García Márquez)
- La sombra del viento (Carlos Ruiz Zafón)
- Sapiens (Yuval Noah Harari)
- Una breve historia del tiempo (Stephen Hawking)
- Y 6 libros más...

### **Generar hash de contraseña**

Para crear nuevos usuarios con contraseñas hasheadas:

```bash
npx ts-node scripts/generate-password-hash.ts
```

O usa el script:

```typescript
// scripts/generate-password-hash.ts
import bcrypt from 'bcrypt';

async function generateHash() {
  const password = 'Test123!';
  const hash = await bcrypt.hash(password, 10);
  console.log('Password:', password);
  console.log('Hash:', hash);
}

generateHash();
```

---

## 🎨 **Uso de pgAdmin**

### **Acceso inicial**

1. Abre: http://localhost:5050
2. Login:
   - Email: `admin@pandebugger.com`
   - Password: `admin`

### **Registrar servidor**

Ver instrucciones detalladas en: [GETTING_STARTED.md](./GETTING_STARTED.md#paso-10-registrar-el-servidor-postgresql)

**Configuración rápida:**
- Host: `postgres`
- Port: `5432`
- Database: `pandebugger_dev`
- Username: `pandebugger_user`
- Password: `pandebugger_local_pass_2024`

### **Operaciones comunes en pgAdmin**

#### **Ver datos de una tabla**
1. Navega: Servers → Local Dev → Databases → pandebugger_dev → Schemas → public → Tables
2. Click derecho en tabla → "View/Edit Data" → "All Rows"

#### **Ejecutar query SQL**
1. Click en "Tools" → "Query Tool"
2. Escribe tu query
3. Click en "Execute" (▶️) o presiona F5

#### **Ver estructura de tabla**
1. Click derecho en tabla → "Properties"
2. Pestaña "Columns" para ver columnas
3. Pestaña "Constraints" para ver claves

#### **Exportar datos**
1. Click derecho en tabla → "Import/Export Data"
2. Selecciona formato (CSV, JSON, etc.)
3. Click "OK"

#### **Crear respaldo**
1. Click derecho en database → "Backup"
2. Selecciona ubicación y formato
3. Click "Backup"

---

## 🔧 **Gestión de Base de Datos**

### **Reiniciar la base de datos desde cero**

```bash
# Detener contenedores y eliminar volúmenes
docker compose down -v

# Iniciar contenedores (migraciones se ejecutan automáticamente)
docker compose up -d

# Esperar a que PostgreSQL esté listo
sleep 5

# Cargar seeds
docker exec -i pandebugger-postgres psql -U pandebugger_user -d pandebugger_dev < src/shared/database/seeds/001_seed_test_users.sql
docker exec -i pandebugger-postgres psql -U pandebugger_user -d pandebugger_dev < src/shared/database/seeds/002_seed_test_books.sql
docker exec -i pandebugger-postgres psql -U pandebugger_user -d pandebugger_dev < src/shared/database/seeds/003_seed_test_tasks.sql
```

### **Crear respaldo de la base de datos**

```bash
# Respaldo completo
docker exec pandebugger-postgres pg_dump -U pandebugger_user pandebugger_dev > backup_$(date +%Y%m%d_%H%M%S).sql

# Solo estructura (sin datos)
docker exec pandebugger-postgres pg_dump -U pandebugger_user --schema-only pandebugger_dev > schema.sql

# Solo datos
docker exec pandebugger-postgres pg_dump -U pandebugger_user --data-only pandebugger_dev > data.sql
```

### **Restaurar desde respaldo**

```bash
# Restaurar desde archivo
docker exec -i pandebugger-postgres psql -U pandebugger_user -d pandebugger_dev < backup.sql
```

### **Limpiar datos sin eliminar estructura**

```bash
# Eliminar todos los datos pero mantener tablas
docker exec -it pandebugger-postgres psql -U pandebugger_user -d pandebugger_dev -c "
TRUNCATE usuarios, libros, tareas, historial CASCADE;
"
```

---

## 📊 **Queries Útiles**

### **Ver todas las tablas**

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### **Contar registros de todas las tablas**

```sql
SELECT 
  schemaname,
  tablename,
  n_tup_ins as total_rows
FROM pg_stat_user_tables
ORDER BY tablename;
```

### **Ver usuarios con sus roles**

```sql
SELECT 
  u.id,
  u.nombres,
  u.apellidos,
  u.correo_electronico,
  r.nombre as rol,
  u.estado as activo
FROM usuarios u
LEFT JOIN roles r ON u.rol_id = r.id
ORDER BY u.id;
```

### **Ver libros con categoría y estado**

```sql
SELECT 
  l.id,
  l.titulo,
  l.autor,
  c.nombre as categoria,
  e.nombre as estado,
  l.estanteria,
  l.espacio
FROM libros l
LEFT JOIN categoria c ON l.categoria_id = c.id
LEFT JOIN estados_libro e ON l.estado_id = e.id
ORDER BY l.id;
```

### **Ver tareas pendientes por usuario**

```sql
SELECT 
  u.nombres || ' ' || u.apellidos as usuario,
  l.titulo as libro,
  t.fecha_asignacion,
  e.nombre as estado_objetivo,
  t.observaciones
FROM tareas t
JOIN usuarios u ON t.usuario_id = u.id
JOIN libros l ON t.libro_id = l.id
JOIN estados_libro e ON t.estado_nuevo_id = e.id
WHERE t.fecha_finalizacion IS NULL
ORDER BY t.fecha_asignacion DESC;
```

### **Ver historial de acciones**

```sql
SELECT 
  h.fecha,
  u.nombres || ' ' || u.apellidos as usuario,
  a.nombre as accion,
  tt.nombre as tipo_objetivo,
  h.target_id
FROM historial h
LEFT JOIN usuarios u ON h.usuario_id = u.id
LEFT JOIN accion a ON h.accion_id = a.id
LEFT JOIN target_type tt ON h.target_type_id = tt.id
ORDER BY h.fecha DESC
LIMIT 20;
```

### **Estadísticas por estado de libro**

```sql
SELECT 
  e.nombre as estado,
  COUNT(l.id) as cantidad_libros
FROM estados_libro e
LEFT JOIN libros l ON e.id = l.estado_id
GROUP BY e.id, e.nombre
ORDER BY e.orden;
```

### **Buscar libros por título o autor**

```sql
SELECT 
  titulo,
  autor,
  isbn
FROM libros
WHERE 
  titulo ILIKE '%cien%' 
  OR autor ILIKE '%garcia%'
ORDER BY titulo;
```

---

## 🔐 **Seguridad**

### **Cambiar contraseña de usuario de base de datos**

```sql
ALTER USER pandebugger_user WITH PASSWORD 'nueva_contraseña_segura';
```

### **Ver conexiones activas**

```sql
SELECT 
  pid,
  usename,
  application_name,
  client_addr,
  state,
  query_start
FROM pg_stat_activity
WHERE datname = 'pandebugger_dev';
```

### **Terminar conexión específica**

```sql
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE pid = 12345;  -- Reemplaza con el PID real
```

---

## 📚 **Referencias Adicionales**

- **[Getting Started](./GETTING_STARTED.md)** - Configuración inicial
- **[API Testing](./API_TESTING.md)** - Probar endpoints
- **[PostgreSQL Docs](https://www.postgresql.org/docs/)** - Documentación oficial
- **[pgAdmin Docs](https://www.pgadmin.org/docs/)** - Documentación de pgAdmin

---

¿Necesitas crear nuevas migraciones o modificar el esquema? Consulta esta guía y sigue las convenciones establecidas.
