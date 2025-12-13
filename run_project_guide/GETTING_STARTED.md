# 🚀 Getting Started - Pandebugger Backend

Complete step-by-step guide to setup, run, and test the project from scratch.

---

## 📋 **Table of Contents**

1. [Prerequisites](#prerequisites)
2. [Initial Installation](#initial-installation)
3. [Database Configuration](#database-configuration)
4. [pgAdmin Access](#pgadmin-access)
5. [System Verification](#system-verification)
6. [Testing with Postman](#testing-with-postman)
7. [Troubleshooting](#troubleshooting)

---

## 📦 **Prerequisites**

Before starting, make sure you have installed:

- **Node.js** >= 18.0.0 ([Download](https://nodejs.org/))
- **npm** >= 9.0.0 (comes with Node.js)
- **Docker** and **Docker Compose** ([Download](https://www.docker.com/))
- **Git** ([Download](https://git-scm.com/))
- **Postman** (optional, for testing) ([Download](https://www.postman.com/downloads/))

### Verify Installations:

## 🔧 **Initial Installation**

### **Step 1: Clone the Repository**

```bash
git clone https://github.com/SebMatDo/IS2-pandebugger.git
cd IS2-pandebugger
```

### **Step 2: Install Dependencies**

```bash
npm install
```

This will install all necessary project dependencies.

### **Step 3: Configure Environment Variables**

Copy the example file and configure it:

```bash
cp .env.local .env
```

The `.env` file comes pre-configured for local development. You don't need to modify it.

**Contents of `.env` (already configured):**
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

## 🐳 **Database Configuration**

### **Step 4: Start Docker Containers**

This command will start:
- Backend API (port 3000)
- PostgreSQL (port 5432)
- pgAdmin (port 5050)

```bash
docker compose up -d
```

Wait a few seconds for all services to be ready.

### **Step 5: Verify Containers are Running**

```bash
docker compose ps
```

You should see something like:

```
NAME                   STATUS
pandebugger-dev        Up (healthy)
pandebugger-postgres   Up (healthy)
pandebugger-pgadmin    Up
```

### **Step 6: Verify Migrations**

Migrations run automatically when starting the PostgreSQL container. Verify that tables were created:

```bash
docker exec -it pandebugger-postgres psql -U pandebugger_user -d pandebugger_dev -c "\dt"
```

**Expected Output:**
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

### **Step 7: Load Test Data (Seeds)**

Execute these commands to load sample users, books, and tasks:

```bash
# Load test users
docker exec -i pandebugger-postgres psql -U pandebugger_user -d pandebugger_dev < src/shared/database/seeds/001_seed_test_users.sql

# Load sample books
docker exec -i pandebugger-postgres psql -U pandebugger_user -d pandebugger_dev < src/shared/database/seeds/002_seed_test_books.sql

# Load sample tasks
docker exec -i pandebugger-postgres psql -U pandebugger_user -d pandebugger_dev < src/shared/database/seeds/003_seed_test_tasks.sql
```

**Expected Output:**
```
INSERT 0 5
INSERT 0 10
INSERT 0 3
```

### **Step 8: Verify Loaded Data**

```bash
docker exec -it pandebugger-postgres psql -U pandebugger_user -d pandebugger_dev -c "SELECT COUNT(*) as total_usuarios FROM usuarios; SELECT COUNT(*) as total_libros FROM libros;"
```

**Expected Output:**
```
 total_usuarios 
----------------
              5

 total_libros 
--------------
           10
```

---

## 🎨 **pgAdmin Access**

pgAdmin is a graphical interface to manage PostgreSQL.

### **Step 9: Open pgAdmin**

1. Open your browser and go to: **http://localhost:5050**

2. **pgAdmin Login:**
   - Email: `admin@pandebugger.com`
   - Password: `admin`

### **Step 10: Register PostgreSQL Server**

Once inside pgAdmin:

1. Right-click on **"Servers"** (left panel)
2. Select **"Register" → "Server"**

3. **"General" tab:**
   - Name: `Local Dev`

4. **"Connection" tab:**
   - Host name/address: `postgres`
   - Port: `5432`
   - Maintenance database: `pandebugger_dev`
   - Username: `pandebugger_user`
   - Password: `pandebugger_local_pass_2024`
   - ✅ Check **"Save password"**

5. **"SSL" tab:**
   - SSL mode: `Disable`

6. Click **"Save"****

## ✅ **System Verification**

### **Step 11: Test the API**

Verify that the backend is working correctly:

```bash
# Basic health check
curl http://localhost:3000/api/v1/health

# Expected response:
# {
#   "status": "healthy",
#   "timestamp": "2025-11-23T17:00:00.000Z",
#   "uptime": 123.45
# }
```

### **Step 12: View Backend Logs**

To view logs in real-time:

```bash
docker compose logs -f app
```

Press `Ctrl+C` to exit.

---

## 🧪 **Testing with Postman**

### **Step 13: Configure Postman**

See complete guide: **[docs/API_TESTING.md](./API_TESTING.md)**

**Quick summary:**

1. **Create collection:** "Pandebugger API"
2. **Configure environment:** Base URL = `http://localhost:3000/api/v1`
3. **Test login:**

```http
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@pandebugger.com",
  "password": "Test123!"
}
```

4. **Use the token** in protected endpoints:

```http
GET http://localhost:3000/api/v1/auth/me
Authorization: Bearer <tu_token_aqui>
```

### **Available Test Users:**

All use password: **`Test123!`**

| Email | Role |
|-------|-----|
| admin@pandebugger.com | Admin |
| maria.gonzalez@pandebugger.com | Bibliotecario |
| carlos.ramirez@pandebugger.com | Digitalizador |
| ana.martinez@pandebugger.com | Revisor |
| luis.fernandez@pandebugger.com | Restaurador |

---

## 🔧 **Troubleshooting**

### **Problem: Containers won't start**

```bash
# Stop everything and clean
docker compose down -v

# Start again
docker compose up -d
```

### **Problem: "Port 5432 already in use"**

You have another PostgreSQL running on your machine.

**Solution 1:** Stop local PostgreSQL:
```bash
sudo systemctl stop postgresql  # Linux
brew services stop postgresql   # macOS
```

**Solution 2:** Change port in `docker-compose.yml`:
```yaml
postgres:
  ports:
    - "5433:5432"  # Change to 5433
```

### **Problem: "Cannot connect to database" in pgAdmin**

1. Make sure to use `postgres` as host (not `localhost`)
2. Verify container is running: `docker compose ps`
3. Try restarting pgAdmin: `docker compose restart pgadmin`

### **Problem: Migrations didn't execute**

```bash
# Run them manually
docker exec -i pandebugger-postgres psql -U pandebugger_user -d pandebugger_dev < src/shared/database/migrations/001_initial_schema.sql
docker exec -i pandebugger-postgres psql -U pandebugger_user -d pandebugger_dev < src/shared/database/migrations/002_seed_reference_data.sql
```

### **Problem: "Token no proporcionado" in Postman**

1. Verify the header is: `Authorization: Bearer <token>`
2. Make sure to include the word `Bearer` before the token
3. Verify there are no extra spaces or quotes

### **View all logs:**

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

## 🎯 **Useful Commands**

```bash
# Start containers
docker compose up -d

# Stop containers
docker compose down

# Stop and remove volumes (DELETES DATA)
docker compose down -v

# View container status
docker compose ps

# View logs
docker compose logs -f app

# Restart specific service
docker compose restart app

# Access PostgreSQL shell
docker exec -it pandebugger-postgres psql -U pandebugger_user -d pandebugger_dev

# Run seeds manually
docker exec -i pandebugger-postgres psql -U pandebugger_user -d pandebugger_dev < src/shared/database/seeds/001_seed_test_users.sql

# Reload everything from scratch
docker compose down -v && docker compose up -d
```

---

## 📚 **Next Steps**

Once everything is working:

1. ✅ **[API Testing Guide](./API_TESTING.md)** - Complete testing with Postman
2. ✅ **[Database Guide](./DATABASE_GUIDE.md)** - Migration and seed management
3. ✅ **[AWS Deployment](./AWS_DEPLOYMENT.md)** - Production deployment
4. ✅ **[Development Guide](./DEVELOPMENT.md)** - Adding new modules
