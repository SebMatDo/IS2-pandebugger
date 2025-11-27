/**
 * Unit Tests for AuthService
 * Tests for CU06 (Login) and CU20 (Change Password)
 */

import { authService } from '../auth.service';
import { userRepository } from '../../../shared/repositories/user.repository';
import { AppError } from '../../../shared/middleware/errorHandler';
import { User } from '../../../shared/types/database.types';
import bcrypt from 'bcrypt';

// Mock dependencies
jest.mock('../../../shared/repositories/user.repository');
jest.mock('bcrypt');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash a password successfully', async () => {
      const password = 'Test@123';
      const hashedPassword = '$2b$10$hashedPasswordExample';

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const result = await authService.hashPassword(password);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(result).toBe(hashedPassword);
    });
  });

  describe('verifyPassword', () => {
    it('should return true for valid password', async () => {
      const password = 'Test@123';
      const hash = '$2b$10$hashedPasswordExample';

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.verifyPassword(password, hash);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(true);
    });

    it('should return false for invalid password', async () => {
      const password = 'WrongPassword';
      const hash = '$2b$10$hashedPasswordExample';

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await authService.verifyPassword(password, hash);

      expect(result).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should return true for valid strong password', () => {
      const validPasswords = [
        'Test@123',
        'SecurePass1!',
        'MyP@ssw0rd',
        'Abcd1234#',
      ];

      validPasswords.forEach((password) => {
        expect(authService.validatePasswordStrength(password)).toBe(true);
      });
    });

    it('should return false for weak passwords', () => {
      const weakPasswords = [
        'short1!',           // Too short
        'nouppercase1!',     // No uppercase
        'NOLOWERCASE1!',     // No lowercase
        'NoNumber!',         // No number
        'NoSymbol123',       // No symbol
        'password',          // Too weak
      ];

      weakPasswords.forEach((password) => {
        expect(authService.validatePasswordStrength(password)).toBe(false);
      });
    });
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const mockUser: User = {
        id: 1,
        nombres: 'Juan',
        apellidos: 'Pérez',
        correo_electronico: 'juan@example.com',
        hash_contraseña: 'hashedPassword',
        rol_id: 2,
        estado: true,
        rol: {
          id: 2,
          nombre: 'Bibliotecario',
          descripcion: 'Gestiona libros',
        },
      };

      const token = authService.generateToken(mockUser);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });
  });

  describe('verifyToken', () => {
    it('should verify and decode a valid token', () => {
      const mockUser: User = {
        id: 1,
        nombres: 'Juan',
        apellidos: 'Pérez',
        correo_electronico: 'juan@example.com',
        hash_contraseña: 'hashedPassword',
        rol_id: 2,
        estado: true,
        rol: {
          id: 2,
          nombre: 'Bibliotecario',
          descripcion: 'Gestiona libros',
        },
      };

      const token = authService.generateToken(mockUser);
      const decoded = authService.verifyToken(token);

      expect(decoded).toHaveProperty('userId', mockUser.id);
      expect(decoded).toHaveProperty('email', mockUser.correo_electronico);
      expect(decoded).toHaveProperty('rolId', mockUser.rol_id);
      expect(decoded).toHaveProperty('rolNombre', 'Bibliotecario');
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => authService.verifyToken(invalidToken)).toThrow(AppError);
      expect(() => authService.verifyToken(invalidToken)).toThrow('Token inválido o expirado');
    });

    it('should throw error for expired token', () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjB9.invalid';

      expect(() => authService.verifyToken(expiredToken)).toThrow(AppError);
    });
  });

  describe('createLoginResponse', () => {
    it('should create proper login response structure', () => {
      const mockUser: User = {
        id: 1,
        nombres: 'Juan',
        apellidos: 'Pérez',
        correo_electronico: 'juan@example.com',
        hash_contraseña: 'hashedPassword',
        rol_id: 2,
        estado: true,
        rol: {
          id: 2,
          nombre: 'Bibliotecario',
          descripcion: 'Gestiona libros',
        },
      };
      const token = 'mock.jwt.token';

      const response = authService.createLoginResponse(mockUser, token);

      expect(response).toHaveProperty('user');
      expect(response).toHaveProperty('token', token);
      expect(response).toHaveProperty('expiresIn');
      expect(response.user).toEqual({
        id: 1,
        nombres: 'Juan',
        apellidos: 'Pérez',
        correo_electronico: 'juan@example.com',
        rol: {
          id: 2,
          nombre: 'Bibliotecario',
        },
      });
    });
  });

  describe('login (CU06)', () => {
    const mockUser: User = {
      id: 1,
      nombres: 'Juan',
      apellidos: 'Pérez',
      correo_electronico: 'juan@example.com',
      hash_contraseña: '$2b$10$hashedPasswordExample',
      rol_id: 2,
      estado: true,
      rol: {
        id: 2,
        nombre: 'Bibliotecario',
        descripcion: 'Gestiona libros',
      },
    };

    it('should login successfully with valid credentials', async () => {
      (userRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const loginDto = {
        email: 'juan@example.com',
        password: 'Test@123',
      };

      const result = await authService.login(loginDto);

      expect(userRepository.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(loginDto.password, mockUser.hash_contraseña);
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('expiresIn');
      expect(result.user.id).toBe(mockUser.id);
      expect(result.user.correo_electronico).toBe(mockUser.correo_electronico);
    });

    it('should throw error when user not found', async () => {
      (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);

      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'Test@123',
      };

      await expect(authService.login(loginDto)).rejects.toThrow(AppError);
      await expect(authService.login(loginDto)).rejects.toThrow(
        '❌ Credenciales inválidas o usuario inactivo'
      );
    });

    it('should throw error when user is inactive', async () => {
      const inactiveUser = { ...mockUser, estado: false };
      (userRepository.findByEmail as jest.Mock).mockResolvedValue(inactiveUser);

      const loginDto = {
        email: 'juan@example.com',
        password: 'Test@123',
      };

      await expect(authService.login(loginDto)).rejects.toThrow(AppError);
      await expect(authService.login(loginDto)).rejects.toThrow(
        '❌ Credenciales inválidas o usuario inactivo'
      );
    });

    it('should throw error when password is incorrect', async () => {
      (userRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const loginDto = {
        email: 'juan@example.com',
        password: 'WrongPassword',
      };

      await expect(authService.login(loginDto)).rejects.toThrow(AppError);
      await expect(authService.login(loginDto)).rejects.toThrow(
        '❌ Credenciales inválidas o usuario inactivo'
      );
    });
  });

  describe('changePassword (CU20)', () => {
    const mockUser: User = {
      id: 1,
      nombres: 'Juan',
      apellidos: 'Pérez',
      correo_electronico: 'juan@example.com',
      hash_contraseña: '$2b$10$oldHashedPassword',
      rol_id: 2,
      estado: true,
      rol: {
        id: 2,
        nombre: 'Bibliotecario',
        descripcion: 'Gestiona libros',
      },
    };

    it('should change password successfully', async () => {
      const newHashedPassword = '$2b$10$newHashedPassword';

      (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue(newHashedPassword);
      (userRepository.update as jest.Mock).mockResolvedValue(undefined);

      await authService.changePassword(1, 'OldPass@123', 'NewPass@456');

      expect(userRepository.findById).toHaveBeenCalledWith(1);
      expect(bcrypt.compare).toHaveBeenCalledWith('OldPass@123', mockUser.hash_contraseña);
      expect(bcrypt.hash).toHaveBeenCalledWith('NewPass@456', 10);
      expect(userRepository.update).toHaveBeenCalledWith(1, {
        hash_contraseña: newHashedPassword,
      });
    });

    it('should throw error when user not found', async () => {
      (userRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        authService.changePassword(999, 'OldPass@123', 'NewPass@456')
      ).rejects.toThrow(AppError);
      await expect(
        authService.changePassword(999, 'OldPass@123', 'NewPass@456')
      ).rejects.toThrow('Usuario no encontrado');
    });

    it('should throw error when current password is incorrect', async () => {
      (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.changePassword(1, 'WrongPassword', 'NewPass@456')
      ).rejects.toThrow(AppError);
      await expect(
        authService.changePassword(1, 'WrongPassword', 'NewPass@456')
      ).rejects.toThrow('Contraseña actual incorrecta');
    });

    it('should throw error when new password is weak', async () => {
      (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        authService.changePassword(1, 'OldPass@123', 'weak')
      ).rejects.toThrow(AppError);
      await expect(
        authService.changePassword(1, 'OldPass@123', 'weak')
      ).rejects.toThrow(
        'La contraseña debe tener mínimo 8 caracteres, una mayúscula, un número y un símbolo.'
      );
    });

    it('should reject weak passwords without uppercase', async () => {
      (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        authService.changePassword(1, 'OldPass@123', 'newpass@123')
      ).rejects.toThrow(AppError);
    });

    it('should reject weak passwords without number', async () => {
      (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        authService.changePassword(1, 'OldPass@123', 'NewPass@abc')
      ).rejects.toThrow(AppError);
    });

    it('should reject weak passwords without symbol', async () => {
      (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        authService.changePassword(1, 'OldPass@123', 'NewPass123')
      ).rejects.toThrow(AppError);
    });
  });
});
