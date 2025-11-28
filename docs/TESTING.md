# 🧪 Testing Guide - IS2 Pandebugger

## Configuración de Pruebas

Este proyecto utiliza **Jest** como framework de testing con soporte completo para TypeScript mediante `ts-jest`.

## Estructura de Pruebas

```
src/
├── __tests__/
│   └── setup.ts                    # Configuración global de Jest
└── modules/
    └── auth/
        └── __tests__/
            ├── auth.service.test.ts      # Tests unitarios del servicio
            └── auth.controller.test.ts   # Tests de integración del controlador
```

## Comandos Disponibles

### Ejecutar todas las pruebas
```bash
npm test
```

### Ejecutar pruebas en modo watch (desarrollo)
```bash
npm run test:watch
```

### Ejecutar pruebas con cobertura
```bash
npm run test:coverage
```

### Ejecutar pruebas con salida detallada
```bash
npm run test:verbose
```

### Ejecutar solo pruebas de autenticación
```bash
npm run test:auth
```

### Ejecutar solo pruebas de usuarios
```bash
npm run test:users
```

## Casos de Prueba Implementados

### 🔐 AuthService (auth.service.test.ts)

#### Gestión de Contraseñas
- ✅ `hashPassword()` - Hash de contraseñas con bcrypt
- ✅ `verifyPassword()` - Verificación de contraseñas
- ✅ `validatePasswordStrength()` - Validación de fortaleza (8+ chars, mayúscula, número, símbolo)

#### Gestión de Tokens JWT
- ✅ `generateToken()` - Generación de tokens JWT
- ✅ `verifyToken()` - Verificación y decodificación de tokens
- ✅ Manejo de tokens inválidos y expirados

#### CU06 - Login
- ✅ Login exitoso con credenciales válidas
- ✅ Error cuando usuario no existe
- ✅ Error cuando usuario está inactivo
- ✅ Error cuando contraseña es incorrecta
- ✅ Generación de respuesta con datos de usuario y token

#### CU20 - Cambio de Contraseña
- ✅ Cambio exitoso de contraseña
- ✅ Error cuando usuario no existe
- ✅ Error cuando contraseña actual es incorrecta
- ✅ Error cuando nueva contraseña es débil
- ✅ Validación de fortaleza (mayúscula, número, símbolo)

### 👥 UsersService (users.service.test.ts)

#### CU09 - Crear Usuario
- ✅ Crear usuario exitosamente
- ✅ Error cuando email ya existe
- ✅ Error cuando contraseña es débil

#### CU18 - Buscar Usuarios
- ✅ Obtener todos los usuarios
- ✅ Filtrar usuarios por estado

#### CU10 - Editar Usuario
- ✅ Actualizar usuario exitosamente
- ✅ Error cuando usuario no existe
- ✅ Error cuando email ya existe

#### CU11 - Desactivar Usuario
- ✅ Desactivar usuario exitosamente
- ✅ Error cuando usuario no existe
- ✅ Error cuando intentas desactivarte a ti mismo
- ✅ Error cuando usuario ya está inactivo

#### Funcionalidades Adicionales
- ✅ Obtener usuario por ID
- ✅ Activar usuario
- ✅ Obtener todos los roles

### 🎮 UsersController (users.controller.test.ts)

#### Endpoints de API
- ✅ `POST /api/v1/users` - Crear usuario (CU09)
- ✅ `GET /api/v1/users` - Listar usuarios (CU18)
- ✅ `GET /api/v1/users/:id` - Obtener usuario por ID
- ✅ `PUT /api/v1/users/:id` - Actualizar usuario (CU10)
- ✅ `DELETE /api/v1/users/:id` - Desactivar usuario (CU11)
- ✅ `PATCH /api/v1/users/:id/activate` - Activar usuario
- ✅ `GET /api/v1/users/roles` - Obtener roles
- ✅ Validación de ID inválido
- ✅ Filtros por estado y rol

### 🎮 AuthController (auth.controller.test.ts)

#### Endpoints de API
- ✅ `POST /api/v1/auth/login` - Login de usuario
- ✅ `POST /api/v1/auth/change-password` - Cambio de contraseña
- ✅ `GET /api/v1/auth/me` - Obtener usuario actual
- ✅ Validación de campos requeridos
- ✅ Manejo de errores HTTP

## Cobertura de Código

Después de ejecutar `npm run test:coverage`, puedes ver el reporte en:
- **Terminal**: Resumen de cobertura
- **HTML**: `coverage/index.html` (abre en tu navegador)

### Objetivos de Cobertura
- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

## Mejores Prácticas

### 1. Estructura de Tests
```typescript
describe('NombreDelModulo', () => {
  beforeEach(() => {
    // Limpieza antes de cada test
    jest.clearAllMocks();
  });

  describe('nombreDelMetodo', () => {
    it('should do something when condition', async () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = await method(input);
      
      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### 2. Mocking
```typescript
// Mock de módulos externos
jest.mock('../../../shared/repositories/user.repository');

// Mock de implementación
(userRepository.findById as jest.Mock).mockResolvedValue(mockUser);
```

### 3. Assertions
```typescript
// Valores
expect(value).toBe(expected);
expect(value).toEqual(expected); // Deep equality

// Propiedades
expect(obj).toHaveProperty('key', 'value');

// Errores
await expect(asyncFn()).rejects.toThrow(Error);
await expect(asyncFn()).rejects.toThrow('mensaje');

// Llamadas a funciones
expect(mockFn).toHaveBeenCalledWith(arg1, arg2);
expect(mockFn).toHaveBeenCalledTimes(1);
```

## Agregar Nuevas Pruebas

### 1. Crear archivo de prueba
```bash
touch src/modules/[modulo]/__tests__/[archivo].test.ts
```

### 2. Estructura básica
```typescript
import { serviceToTest } from '../service';

jest.mock('../dependencies');

describe('ServiceToTest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('method', () => {
    it('should do something', () => {
      // Test implementation
    });
  });
});
```

### 3. Ejecutar las nuevas pruebas
```bash
npm test -- --testPathPattern=[modulo]
```

## Troubleshooting

### Error: Cannot find module
```bash
# Reinstalar dependencias
npm install
```

### Tests no se ejecutan
```bash
# Limpiar cache de Jest
npx jest --clearCache
```

### Error de TypeScript
```bash
# Verificar tsconfig.json
npm run build
```

## Próximos Pasos

- [ ] Tests para módulo de libros (CU01-CU05)
- [ ] Tests de integración E2E con base de datos de prueba
- [ ] Tests para middleware de autenticación y autorización
- [ ] Tests para repositorios
- [ ] CI/CD con GitHub Actions
- [ ] Aumentar cobertura de código > 90%

## Recursos

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing TypeScript](https://jestjs.io/docs/getting-started#using-typescript)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
