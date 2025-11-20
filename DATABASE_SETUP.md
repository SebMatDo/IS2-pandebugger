# Local Database Setup & Testing Guide

## Option 1: Using Docker (Recommended)

### 1. Start PostgreSQL with Docker Compose
```bash
docker compose up -d postgres
```

This starts PostgreSQL on port 5432 with:
- Database: `pandebugger`
- User: `postgres`
- Password: `postgres`

### 2. Initialize the Database
```bash
# Copy the SQL file into the container and run it
docker exec -i pandebugger-postgres psql -U postgres -d pandebugger < database/init.sql
```

Or connect and run manually:
```bash
docker exec -it pandebugger-postgres psql -U postgres -d pandebugger
# Then paste the contents of database/init.sql
```

### 3. Verify Database
```bash
docker exec -it pandebugger-postgres psql -U postgres -d pandebugger -c "\dt"
```

Should show all tables: usuarios, roles, libros, etc.

---

## Option 2: Using Local PostgreSQL Installation

### 1. Install PostgreSQL
**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download from https://www.postgresql.org/download/windows/

### 2. Create Database and User
```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Or on Windows/macOS (if no password set):
psql -U postgres
```

In the PostgreSQL prompt:
```sql
CREATE DATABASE pandebugger;
CREATE USER pandebugger_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE pandebugger TO pandebugger_user;
\q
```

### 3. Initialize the Database
```bash
psql -U postgres -d pandebugger -f database/init.sql
```

Or if using the custom user:
```bash
psql -U pandebugger_user -d pandebugger -f database/init.sql
```

---

## Configure Environment

### 1. Create `.env` file
```bash
cp .env.example .env
```

### 2. Update database credentials in `.env`

**For Docker:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pandebugger
DB_USER=postgres
DB_PASSWORD=postgres
```

**For local PostgreSQL:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pandebugger
DB_USER=pandebugger_user
DB_PASSWORD=your_secure_password
```

### 3. Set JWT secret
```env
JWT_SECRET=your_very_long_random_secret_key_at_least_32_characters_long
JWT_EXPIRES_IN=7d
```

Generate a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Start the API

### Development mode (with hot reload)
```bash
npm run dev
```

### Production mode
```bash
npm run build
npm start
```

The API will start on `http://localhost:3000`

---

## Test the API

### 1. Check Health
```bash
curl http://localhost:3000/api/v1/health
```

Expected response:
```json
{
  "status": "success",
  "data": {
    "uptime": 5.123,
    "message": "OK",
    "timestamp": 1700000000000,
    "environment": "development"
  }
}
```

### 2. Check Database Connection
```bash
curl http://localhost:3000/api/v1/health/readiness
```

Expected response:
```json
{
  "status": "success",
  "data": {
    "database": "connected",
    "cache": "connected",
    "status": "ready"
  }
}
```

### 3. Test Login (CU06)
Using the test user created in `init.sql`:
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@pandebugger.com",
    "password": "Test123!"
  }'
```

Expected response:
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": 1,
      "nombres": "Usuario",
      "apellidos": "Prueba",
      "correo_electronico": "test@pandebugger.com",
      "rol": {
        "id": 2,
        "nombre": "Bibliotecario"
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "7d"
  },
  "message": "Login exitoso"
}
```

### 4. Use the Token
Save the token and use it for authenticated requests:
```bash
# Save token to variable
TOKEN="paste_your_token_here"

# Get current user info
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Change Password (CU20)
```bash
curl -X POST http://localhost:3000/api/v1/auth/change-password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "Test123!",
    "newPassword": "NewPassword456!"
  }'
```

---

## Testing with Postman or Thunder Client

### Import Collection

1. Open Postman or Thunder Client (VS Code extension)
2. Create a new request collection
3. Set base URL: `http://localhost:3000/api/v1`

### Requests to add:

**1. Health Check**
- Method: GET
- URL: `{{baseUrl}}/health`

**2. Login**
- Method: POST
- URL: `{{baseUrl}}/auth/login`
- Headers: `Content-Type: application/json`
- Body:
```json
{
  "email": "test@pandebugger.com",
  "password": "Test123!"
}
```
- Save the `token` from response

**3. Get Current User**
- Method: GET
- URL: `{{baseUrl}}/auth/me`
- Headers: `Authorization: Bearer {{token}}`

**4. Change Password**
- Method: POST
- URL: `{{baseUrl}}/auth/change-password`
- Headers: 
  - `Authorization: Bearer {{token}}`
  - `Content-Type: application/json`
- Body:
```json
{
  "currentPassword": "Test123!",
  "newPassword": "NewPassword456!"
}
```

---

## Verify Data in Database

### Connect to PostgreSQL

**Docker:**
```bash
docker exec -it pandebugger-postgres psql -U postgres -d pandebugger
```

**Local:**
```bash
psql -U postgres -d pandebugger
```

### Useful Queries

```sql
-- List all users
SELECT id, nombres, apellidos, correo_electronico, estado FROM usuarios;

-- Check roles
SELECT * FROM roles;

-- Check book states
SELECT * FROM estados_libro ORDER BY orden;

-- View history/audit log
SELECT h.fecha, u.nombres, u.apellidos, a.nombre as accion, tt.nombre as tipo_target, h.target_id
FROM historial h
JOIN usuarios u ON h.usuario_id = u.id
JOIN accion a ON h.accion_id = a.id
JOIN target_type tt ON h.target_type_id = tt.id
ORDER BY h.fecha DESC
LIMIT 10;

-- Count books by state
SELECT e.nombre, COUNT(l.id) as cantidad
FROM estados_libro e
LEFT JOIN libros l ON l.estado_id = e.id
GROUP BY e.nombre, e.orden
ORDER BY e.orden;
```

---

## Troubleshooting

### Database Connection Failed
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution:** 
- Check PostgreSQL is running: `docker ps` or `sudo systemctl status postgresql`
- Verify port 5432 is not used by another service: `lsof -i :5432`
- Check `.env` credentials match your database

### Login Returns 401
```json
{"status": "error", "message": "❌ Credenciales inválidas o usuario inactivo"}
```
**Solution:**
- Verify test user exists: `SELECT * FROM usuarios WHERE correo_electronico = 'test@pandebugger.com';`
- Try password: `Test123!` (case-sensitive)
- Check user is active: `estado = true`

### Token Invalid Error
```json
{"status": "error", "message": "Token inválido o expirado"}
```
**Solution:**
- Token expired (7 days default), login again
- JWT_SECRET in `.env` changed, restart server
- Check Authorization header format: `Bearer <token>`

### Port 3000 Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Solution:**
- Kill process: `lsof -ti:3000 | xargs kill -9`
- Or change PORT in `.env`: `PORT=3001`

---

## Creating Additional Test Users

### Method 1: Using bcrypt CLI
```bash
# Install bcrypt-cli
npm install -g bcrypt-cli

# Generate hash for password
bcrypt-cli hash "MyPassword123!" 10
```

Then insert into database:
```sql
INSERT INTO usuarios (nombres, apellidos, correo_electronico, hash_contraseña, rol_id, estado)
VALUES ('Juan', 'Pérez', 'juan@test.com', '<paste_hash_here>', 1, TRUE);
```

### Method 2: Using Node.js
```bash
node -e "
const bcrypt = require('bcrypt');
bcrypt.hash('MyPassword123!', 10, (err, hash) => {
  console.log(hash);
});
"
```

### Method 3: Using API (after implementing CU09 - Create User)
```bash
curl -X POST http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombres": "Nuevo",
    "apellidos": "Usuario",
    "correo_electronico": "nuevo@test.com",
    "contraseña": "NewPassword123!",
    "rol_id": 2
  }'
```

---

## Next Steps

✅ Database is running
✅ API is running
✅ Login is working

**You're ready to implement more use cases!**

Would you like to implement:
1. **CU09** - Create User
2. **CU01** - Register Book
3. **CU17** - Search Books

Or any other use case from your Python app!
