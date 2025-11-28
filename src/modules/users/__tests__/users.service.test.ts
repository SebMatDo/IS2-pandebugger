/**
 * Unit Tests for UsersService
 * Tests for CU09, CU10, CU11, CU18
 */

import { usersService } from '../users.service';
import { authService } from '../../auth/auth.service';
import { userRepository } from '../../../shared/repositories/user.repository';
import { db } from '../../../shared/database/connection';
import { AppError } from '../../../shared/middleware/errorHandler';
import { User } from '../../../shared/types/database.types';

// Mock dependencies
jest.mock('../../auth/auth.service');
jest.mock('../../../shared/repositories/user.repository');
jest.mock('../../../shared/database/connection');

describe('UsersService', () => {
  const mockUser: User = {
    id: 1,
    nombres: 'Juan',
    apellidos: 'Pérez',
    correo_electronico: 'juan@example.com',
    hash_contraseña: '$2b$10$hashedPassword',
    rol_id: 2,
    estado: true,
    rol: {
      id: 2,
      nombre: 'Bibliotecario',
      descripcion: 'Gestiona libros y usuarios',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CU09 - createUser', () => {
    it('should create a new user successfully', async () => {
      const createDto = {
        nombres: 'Carlos',
        apellidos: 'Ruiz',
        correo_electronico: 'carlos@example.com',
        contraseña: 'SecurePass123!',
        rol_id: 3,
      };

      (db.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] }) // Check email doesn't exist
        .mockResolvedValueOnce({ rows: [{ id: 3 }] }); // Check role exists

      (authService.validatePasswordStrength as jest.Mock).mockReturnValue(true);
      (authService.hashPassword as jest.Mock).mockResolvedValue('$2b$10$hashedPassword');

      const newUser = { ...mockUser, id: 5, ...createDto, hash_contraseña: '$2b$10$hashedPassword' };
      (userRepository.create as jest.Mock).mockResolvedValue(newUser);
      (userRepository.findById as jest.Mock).mockResolvedValue(newUser);

      const result = await usersService.createUser(createDto, 1);

      expect(authService.validatePasswordStrength).toHaveBeenCalledWith(createDto.contraseña);
      expect(authService.hashPassword).toHaveBeenCalledWith(createDto.contraseña);
      expect(userRepository.create).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('correo_electronico', 'carlos@example.com');
      expect(result).not.toHaveProperty('hash_contraseña');
    });

    it('should throw error when email already exists', async () => {
      const createDto = {
        nombres: 'Carlos',
        apellidos: 'Ruiz',
        correo_electronico: 'existing@example.com',
        contraseña: 'SecurePass123!',
        rol_id: 3,
      };

      // Mock para verificar que el email existe
      (db.query as jest.Mock).mockResolvedValue({ rows: [{ id: 1 }] });

      await expect(usersService.createUser(createDto, 1)).rejects.toThrow(AppError);
    });

    it('should throw error when password is weak', async () => {
      const createDto = {
        nombres: 'Carlos',
        apellidos: 'Ruiz',
        correo_electronico: 'carlos@example.com',
        contraseña: 'weak',
        rol_id: 3,
      };

      (authService.validatePasswordStrength as jest.Mock).mockReturnValue(false);

      await expect(usersService.createUser(createDto, 1)).rejects.toThrow(AppError);
      await expect(usersService.createUser(createDto, 1)).rejects.toThrow(
        'La contraseña debe tener mínimo 8 caracteres'
      );
    });
  });

  describe('CU18 - getAllUsers', () => {
    it('should return all users', async () => {
      const mockUsers = [
        {
          id: 1,
          nombres: 'Admin',
          apellidos: 'Sistema',
          correo_electronico: 'admin@example.com',
          rol_id: 1,
          rol_nombre: 'Admin',
          rol_descripcion: 'Administrador',
          estado: true,
        },
        {
          id: 2,
          nombres: 'Juan',
          apellidos: 'Pérez',
          correo_electronico: 'juan@example.com',
          rol_id: 2,
          rol_nombre: 'Bibliotecario',
          rol_descripcion: 'Gestiona libros',
          estado: true,
        },
      ];

      (db.query as jest.Mock).mockResolvedValue({ rows: mockUsers });

      const result = await usersService.getAllUsers();

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('correo_electronico', 'admin@example.com');
      expect(result[1]).toHaveProperty('correo_electronico', 'juan@example.com');
    });

    it('should filter users by estado', async () => {
      const activeUsers = [
        {
          id: 1,
          nombres: 'Admin',
          apellidos: 'Sistema',
          correo_electronico: 'admin@example.com',
          rol_id: 1,
          rol_nombre: 'Admin',
          rol_descripcion: 'Administrador',
          estado: true,
        },
      ];

      (db.query as jest.Mock).mockResolvedValue({ rows: activeUsers });

      const result = await usersService.getAllUsers({ estado: true });

      expect(result).toHaveLength(1);
      expect(result[0].estado).toBe(true);
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);

      const result = await usersService.getUserById(1);

      expect(userRepository.findById).toHaveBeenCalledWith(1);
      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('correo_electronico', 'juan@example.com');
    });

    it('should throw error when user not found', async () => {
      (userRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(usersService.getUserById(999)).rejects.toThrow(AppError);
      await expect(usersService.getUserById(999)).rejects.toThrow('Usuario no encontrado');
    });
  });

  describe('CU10 - updateUser', () => {
    it('should update user successfully', async () => {
      const updateDto = {
        nombres: 'Juan Carlos',
        rol_id: 3,
      };

      const updatedUser = { ...mockUser, ...updateDto };

      (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (db.query as jest.Mock).mockResolvedValue({ rows: [{ id: 3 }] }); // Role exists
      (userRepository.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await usersService.updateUser(1, updateDto, 1);

      expect(userRepository.findById).toHaveBeenCalledWith(1);
      expect(userRepository.update).toHaveBeenCalledWith(1, updateDto);
      expect(result).toHaveProperty('nombres', 'Juan Carlos');
    });

    it('should throw error when user not found', async () => {
      (userRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(usersService.updateUser(999, { nombres: 'Test' }, 1)).rejects.toThrow(
        AppError
      );
      await expect(usersService.updateUser(999, { nombres: 'Test' }, 1)).rejects.toThrow(
        'Usuario no encontrado'
      );
    });

    it('should throw error when email already exists', async () => {
      const updateDto = {
        correo_electronico: 'existing@example.com',
      };

      (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (db.query as jest.Mock).mockResolvedValue({ rows: [{ id: 2 }] }); // Email exists for another user

      await expect(usersService.updateUser(1, updateDto, 1)).rejects.toThrow(AppError);
      await expect(usersService.updateUser(1, updateDto, 1)).rejects.toThrow(
        'Ya existe un usuario con ese correo electrónico'
      );
    });
  });

  describe('CU11 - deactivateUser', () => {
    it('should deactivate user successfully', async () => {
      (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (userRepository.update as jest.Mock).mockResolvedValue({ ...mockUser, estado: false });

      await usersService.deactivateUser(2, 1);

      expect(userRepository.findById).toHaveBeenCalledWith(2);
      expect(userRepository.update).toHaveBeenCalledWith(2, { estado: false });
    });

    it('should throw error when user not found', async () => {
      (userRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(usersService.deactivateUser(999, 1)).rejects.toThrow(AppError);
      await expect(usersService.deactivateUser(999, 1)).rejects.toThrow(
        'Usuario no encontrado'
      );
    });

    it('should throw error when trying to deactivate yourself', async () => {
      (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);

      await expect(usersService.deactivateUser(1, 1)).rejects.toThrow(AppError);
      await expect(usersService.deactivateUser(1, 1)).rejects.toThrow(
        'No puedes desactivar tu propio usuario'
      );
    });

    it('should throw error when user is already inactive', async () => {
      const inactiveUser = { ...mockUser, estado: false };
      (userRepository.findById as jest.Mock).mockResolvedValue(inactiveUser);

      await expect(usersService.deactivateUser(2, 1)).rejects.toThrow(AppError);
      await expect(usersService.deactivateUser(2, 1)).rejects.toThrow(
        'El usuario ya está inactivo'
      );
    });
  });

  describe('activateUser', () => {
    it('should activate user successfully', async () => {
      const inactiveUser = { ...mockUser, estado: false };
      (userRepository.findById as jest.Mock).mockResolvedValue(inactiveUser);
      (userRepository.update as jest.Mock).mockResolvedValue({ ...mockUser, estado: true });

      await usersService.activateUser(2, 1);

      expect(userRepository.findById).toHaveBeenCalledWith(2);
      expect(userRepository.update).toHaveBeenCalledWith(2, { estado: true });
    });

    it('should throw error when user is already active', async () => {
      (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);

      await expect(usersService.activateUser(1, 1)).rejects.toThrow(AppError);
      await expect(usersService.activateUser(1, 1)).rejects.toThrow(
        'El usuario ya está activo'
      );
    });
  });

  describe('getAllRoles', () => {
    it('should return all roles', async () => {
      const mockRoles = [
        { id: 1, nombre: 'Admin', descripcion: 'Administrador del sistema' },
        { id: 2, nombre: 'Bibliotecario', descripcion: 'Gestiona libros' },
        { id: 3, nombre: 'Digitalizador', descripcion: 'Digitaliza libros' },
      ];

      (db.query as jest.Mock).mockResolvedValue({ rows: mockRoles });

      const result = await usersService.getAllRoles();

      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty('nombre', 'Admin');
      expect(result[1]).toHaveProperty('nombre', 'Bibliotecario');
      expect(result[2]).toHaveProperty('nombre', 'Digitalizador');
    });
  });
});
