# Authentication Module

## 📚 **Full Documentation**

For complete authentication and API testing documentation, see:

👉 **[API Testing Guide](../../../docs/API_TESTING.md)**

## Overview

JWT-based authentication system with bcrypt password hashing, role-based access control, and comprehensive audit logging.

## Features

- ✅ Password hashing with bcrypt (10 rounds)
- ✅ JWT token generation and verification (7-day expiration)
- ✅ Password strength validation (8+ chars, uppercase, number, symbol)
- ✅ Authentication middleware for protected routes
- ✅ Role-based access control (RBAC)
- ✅ Audit logging for authentication events

## Test Credentials

**All test users use password:** `Test123!`

| Email | Role | Permissions |
|-------|------|-------------|
| admin@pandebugger.com | Admin | Full system access |
| maria.gonzalez@pandebugger.com | Bibliotecario | Manage books and users |
| carlos.ramirez@pandebugger.com | Digitalizador | Digitize books |
| ana.martinez@pandebugger.com | Revisor | Quality review |
| luis.fernandez@pandebugger.com | Restaurador | Physical restoration |

## Quick Start

### Login Request

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pandebugger.com","password":"Test123!"}'
```

### Using the Token

```bash
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Endpoints

- `POST /api/v1/auth/login` - Login (get JWT token)
- `GET /api/v1/auth/me` - Get current user (requires auth)
- `POST /api/v1/auth/change-password` - Change password (requires auth)

## Module Structure

```
src/modules/auth/
├── auth.controller.ts    # Request handlers
├── auth.service.ts       # Business logic
├── auth.middleware.ts    # JWT verification & RBAC
├── auth.routes.ts        # Route definitions
├── auth.types.ts         # TypeScript interfaces
└── README.md            # This file
```

---

For complete API documentation, request/response examples, Postman setup, and troubleshooting, see the **[API Testing Guide](../../../docs/API_TESTING.md)**.
```json
{
  "email": "admin@pandebugger.com",
  "password": "Test123!"
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
