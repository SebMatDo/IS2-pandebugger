# Authentication Module

## Overview
JWT-based authentication system matching the Python application's CU06 login functionality.

## Features
- ✅ Password hashing with bcrypt (10 salt rounds)
- ✅ JWT token generation and verification
- ✅ Password strength validation (8+ chars, uppercase, number, symbol)
- ✅ Authentication middleware for protected routes
- ✅ Role-based access control (RBAC)

## API Endpoints

### POST /api/v1/auth/login
Authenticate user and receive JWT token.

**Request:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "MiContraseña123!"
}
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": 1,
      "nombres": "Juan",
      "apellidos": "Pérez",
      "correo_electronico": "usuario@ejemplo.com",
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

**Error (401):**
```json
{
  "status": "error",
  "message": "❌ Credenciales inválidas o usuario inactivo"
}
```

### POST /api/v1/auth/change-password
Change password for authenticated user (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword456!"
}
```

### POST /api/v1/auth/restore-password
Restore password with reset token.

### GET /api/v1/auth/me
Get current authenticated user information (requires authentication).

## Using Authentication in Routes

### Protect a route (require login)
```typescript
import { authenticate } from '../auth/auth.middleware';

router.get('/protected', authenticate, (req, res) => {
  const user = (req as AuthRequest).user;
  // user.userId, user.email, user.rolId, user.rolNombre
});
```

### Require specific role
```typescript
import { authenticate, requireRole } from '../auth/auth.middleware';

router.post('/admin-only', 
  authenticate, 
  requireRole(['Admin', 'Supervisor']),
  (req, res) => {
    // Only Admin or Supervisor can access
  }
);
```

### Optional authentication
```typescript
import { optionalAuthenticate } from '../auth/auth.middleware';

router.get('/optional', optionalAuthenticate, (req, res) => {
  const user = (req as AuthRequest).user;
  if (user) {
    // User is authenticated
  } else {
    // Anonymous access
  }
});
```

## Password Validation

Password must meet these requirements:
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 number
- At least 1 special symbol

Regex: `/^(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/`

## JWT Token Structure

```json
{
  "userId": 1,
  "email": "usuario@ejemplo.com",
  "rolId": 2,
  "rolNombre": "Bibliotecario",
  "iat": 1700000000,
  "exp": 1700604800
}
```

## Testing with curl

### Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

### Use token in subsequent requests
```bash
TOKEN="your_jwt_token_here"

curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

## Environment Variables

```env
JWT_SECRET=your_secret_key_minimum_32_characters_long
JWT_EXPIRES_IN=7d
```

## Next Steps (Database Integration Needed)

The auth service currently has placeholders for database queries. You need to:

1. **Implement database connection** (PostgreSQL with pg, Prisma, or TypeORM)
2. **Update `auth.service.ts`** login method to query users table
3. **Implement history logging** for login events
4. **Add password change and restore** functionality

See comments marked with `TODO` in the code.
