# 🗄️ Database Guide - Pandebugger

Complete guide to manage database, migrations, and test data.

---

## 📋 **Table of Contents**

1. [Database Architecture](#database-architecture)
2. [Connection Information](#connection-information)
3. [Migration System](#migration-system)
4. [Test Data (Seeds)](#test-data-seeds)
5. [Using pgAdmin](#using-pgadmin)
6. [Database Management](#database-management)
7. [Useful Queries](#useful-queries)

---

## 🏗️ **Database Architecture**

### **Table Schema**

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

### **Main Relationships**

- `usuarios` → `roles` (many-to-one)
- `libros` → `estados_libro` (many-to-one)
- `libros` → `categoria` (many-to-one)
- `tareas` → `libros` (many-to-one)
- `tareas` → `usuarios` (many-to-one)
- `historial` → `usuarios` (many-to-one)
- `historial` → `accion` (many-to-one)

---

## 🔌 **Connection Information**

### **Local Development (Docker)**

```yaml
Host: postgres            # From Docker containers
      localhost           # From your local machine
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

### **Connect from Terminal**

```bash
# From your local machine
psql -h localhost -p 5432 -U pandebugger_user -d pandebugger_dev

# From inside the container
docker exec -it pandebugger-postgres psql -U pandebugger_user -d pandebugger_dev
```

### **Connection String**

```
postgresql://pandebugger_user:pandebugger_local_pass_2024@localhost:5432/pandebugger_dev
```

---

## 🔄 **Migration System**

### **What are Migrations?**

Migrations are SQL files that define changes to the database structure in a versioned and ordered way.

### **Migration Location**

```
src/shared/database/migrations/
├── 001_initial_schema.sql          # Creates all tables
└── 002_seed_reference_data.sql     # Inserts reference data
```

### **Naming Convention**

```
XXX_description.sql

Examples:
001_initial_schema.sql
002_seed_reference_data.sql
003_add_book_reviews.sql
004_add_user_profile_fields.sql
```

### **Automatic Execution**

Migrations in `/migrations/` run **automatically** when you start the PostgreSQL container for the first time thanks to this configuration in `docker-compose.yml`:

```yaml
postgres:
  volumes:
    - ./src/shared/database/migrations:/docker-entrypoint-initdb.d:ro
```

### **Manual Execution**

If you need to run migrations manually:

```bash
# Execute a specific migration
docker exec -i pandebugger-postgres psql -U pandebugger_user -d pandebugger_dev < src/shared/database/migrations/001_initial_schema.sql

# Execute all migrations in order
for file in src/shared/database/migrations/*.sql; do
  echo "Executing $file..."
  docker exec -i pandebugger-postgres psql -U pandebugger_user -d pandebugger_dev < "$file"
done
```

2. **Execute the migration:**

```bash
docker exec -i pandebugger-postgres psql -U pandebugger_user -d pandebugger_dev < src/shared/database/migrations/003_add_user_phone.sql
```


## 🌱 **Test Data (Seeds)**

### **What are Seeds?**

Seeds are sample data for development and testing. **Never executed in production.**

### **Seed Location**

```
src/shared/database/seeds/
├── 001_seed_test_users.sql     # 5 test users
├── 002_seed_test_books.sql     # 10 sample books
├── 003_seed_test_tasks.sql     # 3 assigned tasks
└── 004_seed_history_logs.sql   # Audit logs for seeded data
```

### **Load All Seeds**

```bash
# Quick method (execute all)
docker exec -i pandebugger-postgres psql -U pandebugger_user -d pandebugger_dev < src/shared/database/seeds/001_seed_test_users.sql
docker exec -i pandebugger-postgres psql -U pandebugger_user -d pandebugger_dev < src/shared/database/seeds/002_seed_test_books.sql
docker exec -i pandebugger-postgres psql -U pandebugger_user -d pandebugger_dev < src/shared/database/seeds/003_seed_test_tasks.sql
docker exec -i pandebugger-postgres psql -U pandebugger_user -d pandebugger_dev < src/shared/database/seeds/004_seed_history_logs.sql
```

### **Script to Load Seeds**

Create a file `load-seeds.sh`:

```bash
#!/bin/bash
echo "Loading seeds..."
for file in src/shared/database/seeds/*.sql; do
  echo "Executing $file..."
  docker exec -i pandebugger-postgres psql -U pandebugger_user -d pandebugger_dev < "$file"
done
echo "Seeds loaded successfully!"
```

Make it executable and use it:

```bash
chmod +x load-seeds.sh
./load-seeds.sh
```

### **Included Test Users**

All use password: **`Test123!`**

| Email | Role | Password |
|-------|------|----------|
| admin@pandebugger.com | Admin | Test123! |
| maria.gonzalez@pandebugger.com | Bibliotecario | Test123! |
| carlos.ramirez@pandebugger.com | Digitalizador | Test123! |
| ana.martinez@pandebugger.com | Revisor | Test123! |
| luis.fernandez@pandebugger.com | Restaurador | Test123! |

### **Included Sample Books**

- Cien años de soledad (Gabriel García Márquez)
- La sombra del viento (Carlos Ruiz Zafón)
- Sapiens (Yuval Noah Harari)
- Una breve historia del tiempo (Stephen Hawking)
- And 6 more books...

### **Generate Password Hash**

To create new users with hashed passwords:

```bash
npx ts-node scripts/generate-password-hash.ts
```

Or use the script:

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

## 🎨 **Using pgAdmin**

### **Initial Access**

1. Open: http://localhost:5050
2. Login:
   - Email: `admin@pandebugger.com`
   - Password: `admin`

### **Register Server**

See detailed instructions in: [GETTING_STARTED.md](./GETTING_STARTED.md#step-10-register-postgresql-server)

**Quick Configuration:**
- Host: `postgres`
- Port: `5432`
- Database: `pandebugger_dev`
- Username: `pandebugger_user`
- Password: `pandebugger_local_pass_2024`

## 🔧 **Database Management**

### **Reset Database from Scratch**

```bash
# Stop containers and remove volumes
docker compose down -v

# Start containers (migrations run automatically)
docker compose up -d

# Wait for PostgreSQL to be ready
sleep 5

# Load seeds
docker exec -i pandebugger-postgres psql -U pandebugger_user -d pandebugger_dev < src/shared/database/seeds/001_seed_test_users.sql
docker exec -i pandebugger-postgres psql -U pandebugger_user -d pandebugger_dev < src/shared/database/seeds/002_seed_test_books.sql
docker exec -i pandebugger-postgres psql -U pandebugger_user -d pandebugger_dev < src/shared/database/seeds/003_seed_test_tasks.sql
docker exec -i pandebugger-postgres psql -U pandebugger_user -d pandebugger_dev < src/shared/database/seeds/004_seed_history_logs.sql
```

### **Clean Data Without Deleting Structure**

```bash
# Delete all data but keep tables
docker exec -it pandebugger-postgres psql -U pandebugger_user -d pandebugger_dev -c "
TRUNCATE usuarios, libros, tareas, historial CASCADE;
"
```

## 📚 **Additional References**

- **[Getting Started](./GETTING_STARTED.md)** - Initial setup
- **[API Testing](./API_TESTING.md)** - Test endpoints
- **[PostgreSQL Docs](https://www.postgresql.org/docs/)** - Official documentation
- **[pgAdmin Docs](https://www.pgadmin.org/docs/)** - pgAdmin documentation
