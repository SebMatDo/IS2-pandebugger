/**
 * Unit Tests for UsersController
 * Tests for API endpoints
 */

import { usersService } from '../users.service';
import { UsersController } from '../users.controller';
import { Request, Response, NextFunction } from 'express';

// Mock dependencies
jest.mock('../users.service');

describe('UsersController', () => {
  let usersController: UsersController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeAll(() => {
    usersController = new UsersController();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      body: {},
      params: {},
      query: {},
      headers: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('POST /users - createUser (CU09)', () => {
    it('should create user successfully', async () => {
      const createDto = {
        nombres: 'Carlos',
        apellidos: 'Ruiz',
        correo_electronico: 'carlos@example.com',
        contraseña: 'SecurePass123!',
        rol_id: 3,
      };

      mockRequest.body = createDto;
      (mockRequest as any).user = { userId: 1 };

      const mockUserResponse = {
        id: 5,
        nombres: 'Carlos',
        apellidos: 'Ruiz',
        correo_electronico: 'carlos@example.com',
        rol: { id: 3, nombre: 'Digitalizador' },
        estado: true,
      };

      (usersService.createUser as jest.Mock).mockResolvedValue(mockUserResponse);

      await usersController.createUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(usersService.createUser).toHaveBeenCalledWith(createDto, 1);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          message: 'Usuario creado exitosamente',
        })
      );
    });
  });

  describe('GET /users - getAllUsers (CU18)', () => {
    it('should return all users', async () => {
      const mockUsers = [
        {
          id: 1,
          nombres: 'Admin',
          apellidos: 'Sistema',
          correo_electronico: 'admin@example.com',
          rol: { id: 1, nombre: 'Admin' },
          estado: true,
        },
      ];

      (usersService.getAllUsers as jest.Mock).mockResolvedValue(mockUsers);

      await usersController.getAllUsers(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(usersService.getAllUsers).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should filter users by estado', async () => {
      mockRequest.query = { estado: 'true' };

      (usersService.getAllUsers as jest.Mock).mockResolvedValue([]);

      await usersController.getAllUsers(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(usersService.getAllUsers).toHaveBeenCalledWith({ estado: true, rol_id: undefined });
    });
  });

  describe('GET /users/:id - getUserById', () => {
    it('should return user by id', async () => {
      mockRequest.params = { id: '1' };

      const mockUser = {
        id: 1,
        nombres: 'Juan',
        apellidos: 'Pérez',
        correo_electronico: 'juan@example.com',
        rol: { id: 2, nombre: 'Bibliotecario' },
        estado: true,
      };

      (usersService.getUserById as jest.Mock).mockResolvedValue(mockUser);

      await usersController.getUserById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(usersService.getUserById).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 for invalid id', async () => {
      mockRequest.params = { id: 'invalid' };

      await usersController.getUserById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'ID de usuario inválido',
      });
    });
  });

  describe('PUT /users/:id - updateUser (CU10)', () => {
    it('should update user successfully', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { nombres: 'Juan Carlos' };
      (mockRequest as any).user = { userId: 1 };

      const mockUpdatedUser = {
        id: 1,
        nombres: 'Juan Carlos',
        apellidos: 'Pérez',
        correo_electronico: 'juan@example.com',
        rol: { id: 2, nombre: 'Bibliotecario' },
        estado: true,
      };

      (usersService.updateUser as jest.Mock).mockResolvedValue(mockUpdatedUser);

      await usersController.updateUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(usersService.updateUser).toHaveBeenCalledWith(1, { nombres: 'Juan Carlos' }, 1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe('DELETE /users/:id - deactivateUser (CU11)', () => {
    it('should deactivate user successfully', async () => {
      mockRequest.params = { id: '2' };
      (mockRequest as any).user = { userId: 1 };

      (usersService.deactivateUser as jest.Mock).mockResolvedValue(undefined);

      await usersController.deactivateUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(usersService.deactivateUser).toHaveBeenCalledWith(2, 1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          message: 'Usuario desactivado exitosamente',
        })
      );
    });
  });

  describe('PATCH /users/:id/activate - activateUser', () => {
    it('should activate user successfully', async () => {
      mockRequest.params = { id: '2' };
      (mockRequest as any).user = { userId: 1 };

      (usersService.activateUser as jest.Mock).mockResolvedValue(undefined);

      await usersController.activateUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(usersService.activateUser).toHaveBeenCalledWith(2, 1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe('GET /users/roles - getRoles', () => {
    it('should return all roles', async () => {
      const mockRoles = [
        { id: 1, nombre: 'Admin', descripcion: 'Administrador' },
        { id: 2, nombre: 'Bibliotecario', descripcion: 'Gestiona libros' },
      ];

      (usersService.getAllRoles as jest.Mock).mockResolvedValue(mockRoles);

      await usersController.getRoles(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(usersService.getAllRoles).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });
});
