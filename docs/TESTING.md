# 🧪 Testing Guide - IS2 Pandebugger

## Test Configuration

This project uses **Jest** as testing framework with full TypeScript support via `ts-jest`.

## Test Structure

```
src/
├── __tests__/
│   └── setup.ts                    # Global Jest configuration
└── modules/
    └── auth/
        └── __tests__/
            ├── auth.service.test.ts      # Service unit tests
            └── auth.controller.test.ts   # Controller integration tests
```

## Available Commands

### Run all tests
```bash
npm test
```

### Run tests in watch mode (development)
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run tests with detailed output
```bash
npm run test:verbose
```

### Run only authentication tests
```bash
npm run test:auth
```

### Run only user tests
```bash
npm run test:users
```

## Implemented Test Cases

### 🔐 AuthService (auth.service.test.ts)

#### Password Management
- ✅ `hashPassword()` - Password hashing with bcrypt
- ✅ `verifyPassword()` - Password verification
- ✅ `validatePasswordStrength()` - Strength validation (8+ chars, uppercase, number, symbol)

#### JWT Token Management
- ✅ `generateToken()` - JWT token generation
- ✅ `verifyToken()` - Token verification and decoding
- ✅ Handling invalid and expired tokens

#### CU06 - Login
- ✅ Successful login with valid credentials
- ✅ Error when user doesn't exist
- ✅ Error when user is inactive
- ✅ Error when password is incorrect
- ✅ Response generation with user data and token

#### CU20 - Password Change
- ✅ Successful password change
- ✅ Error when user doesn't exist
- ✅ Error when current password is incorrect
- ✅ Error when new password is weak
- ✅ Strength validation (uppercase, number, symbol)

### 👥 UsersService (users.service.test.ts)

#### CU09 - Create User
- ✅ Create user successfully
- ✅ Error when email already exists
- ✅ Error when password is weak

#### CU18 - Search Users
- ✅ Get all users
- ✅ Filter users by status

#### CU10 - Edit User
- ✅ Update user successfully
- ✅ Error when user doesn't exist
- ✅ Error when email already exists

#### CU11 - Deactivate User
- ✅ Deactivate user successfully
- ✅ Error when user doesn't exist
- ✅ Error when trying to deactivate yourself
- ✅ Error when user is already inactive

#### Additional Features
- ✅ Get user by ID
- ✅ Activate user
- ✅ Get all roles

### 🎮 UsersController (users.controller.test.ts)

#### API Endpoints
- ✅ `POST /api/v1/users` - Create user (CU09)
- ✅ `GET /api/v1/users` - List users (CU18)
- ✅ `GET /api/v1/users/:id` - Get user by ID
- ✅ `PUT /api/v1/users/:id` - Update user (CU10)
- ✅ `DELETE /api/v1/users/:id` - Deactivate user (CU11)
- ✅ `PATCH /api/v1/users/:id/activate` - Activate user
- ✅ `GET /api/v1/users/roles` - Get roles
- ✅ Invalid ID validation
- ✅ Filters by status and role

### 🎮 AuthController (auth.controller.test.ts)

#### API Endpoints
- ✅ `POST /api/v1/auth/login` - User login
- ✅ `POST /api/v1/auth/change-password` - Password change
- ✅ `GET /api/v1/auth/me` - Get current user
- ✅ Required field validation
- ✅ HTTP error handling

## Code Coverage

After running `npm run test:coverage`, you can view the report at:
- **Terminal**: Coverage summary
- **HTML**: `coverage/index.html` (open in your browser)

## Best Practices

### 1. Test Structure
```typescript
describe('NombreDelModulo', () => {
  beforeEach(() => {
    // Cleanup before each test
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
// Mock external modules
jest.mock('../../../shared/repositories/user.repository');

// Mock implementation
(userRepository.findById as jest.Mock).mockResolvedValue(mockUser);
```

### 3. Assertions
```typescript
// Values
expect(value).toBe(expected);
expect(value).toEqual(expected); // Deep equality

// Properties
expect(obj).toHaveProperty('key', 'value');

// Errors
await expect(asyncFn()).rejects.toThrow(Error);
await expect(asyncFn()).rejects.toThrow('mensaje');

// Function calls
expect(mockFn).toHaveBeenCalledWith(arg1, arg2);
expect(mockFn).toHaveBeenCalledTimes(1);
```

## Adding New Tests

### 1. Create test file
```bash
touch src/modules/[modulo]/__tests__/[archivo].test.ts
```

### 2. Basic structure
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

### 3. Run new tests
```bash
npm test -- --testPathPattern=[modulo]
```

## Troubleshooting

### Error: Cannot find module
```bash
# Reinstall dependencies
npm install
```

### Tests not running
```bash
# Clear Jest cache
npx jest --clearCache
```

### TypeScript error
```bash
# Verify tsconfig.json
npm run build
```

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing TypeScript](https://jestjs.io/docs/getting-started#using-typescript)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
