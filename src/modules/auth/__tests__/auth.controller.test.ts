/**
 * Integration Tests for Auth Controller
 * Tests for API endpoints: login, change password, current user
 */

import { authService } from '../auth.service';
import { AuthController } from '../auth.controller';
import { userRepository } from '../../../shared/repositories/user.repository';
import { User } from '../../../shared/types/database.types';
import { Request, Response, NextFunction } from 'express';

// Mock dependencies
jest.mock('../auth.service');
jest.mock('../../../shared/repositories/user.repository');

describe('Auth Controller', () => {
  let authController: AuthController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeAll(() => {
    authController = new AuthController();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      body: {},
      headers: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('login', () => {
    const mockLoginResponse = {
      user: {
        id: 1,
        nombres: 'Juan',
        apellidos: 'Pérez',
        correo_electronico: 'juan@example.com',
        rol: {
          id: 2,
          nombre: 'Bibliotecario',
        },
      },
      token: 'mock.jwt.token',
      expiresIn: '7d',
    };

    it('should login successfully with valid credentials', async () => {
      mockRequest.body = {
        email: 'juan@example.com',
        password: 'Test@123',
      };

      (authService.login as jest.Mock).mockResolvedValue(mockLoginResponse);

      await authController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(authService.login).toHaveBeenCalledWith(mockRequest.body);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: mockLoginResponse,
        })
      );
    });

    it('should return 400 when email is missing', async () => {
      mockRequest.body = {
        password: 'Test@123',
      };

      await authController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: '⚠️ Todos los campos son obligatorios',
      });
      expect(authService.login).not.toHaveBeenCalled();
    });

    it('should return 400 when password is missing', async () => {
      mockRequest.body = {
        email: 'juan@example.com',
      };

      await authController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: '⚠️ Todos los campos son obligatorios',
      });
    });

    it('should call next with error when service throws', async () => {
      mockRequest.body = {
        email: 'juan@example.com',
        password: 'WrongPassword',
      };

      const error = new Error('Invalid credentials');
      (authService.login as jest.Mock).mockRejectedValue(error);

      await authController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      mockRequest.body = {
        currentPassword: 'OldPass@123',
        newPassword: 'NewPass@456',
      };
      (mockRequest as any).user = { userId: 1 };

      (authService.changePassword as jest.Mock).mockResolvedValue(undefined);

      await authController.changePassword(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(authService.changePassword).toHaveBeenCalledWith(
        1,
        'OldPass@123',
        'NewPass@456'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          message: 'Contraseña actualizada exitosamente',
        })
      );
    });

    it('should return 400 when current password is missing', async () => {
      mockRequest.body = {
        newPassword: 'NewPass@456',
      };
      (mockRequest as any).user = { userId: 1 };

      await authController.changePassword(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Se requiere la contraseña actual y la nueva contraseña',
      });
    });

    it('should return 400 when new password is missing', async () => {
      mockRequest.body = {
        currentPassword: 'OldPass@123',
      };
      (mockRequest as any).user = { userId: 1 };

      await authController.changePassword(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Se requiere la contraseña actual y la nueva contraseña',
      });
    });

    it('should call next with error when service throws', async () => {
      mockRequest.body = {
        currentPassword: 'OldPass@123',
        newPassword: 'NewPass@456',
      };
      (mockRequest as any).user = { userId: 1 };

      const error = new Error('Invalid current password');
      (authService.changePassword as jest.Mock).mockRejectedValue(error);

      await authController.changePassword(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getCurrentUser', () => {
    const mockUser: Partial<User> = {
      id: 1,
      nombres: 'Juan',
      apellidos: 'Pérez',
      correo_electronico: 'juan@example.com',
      rol_id: 2,
      estado: true,
      rol: {
        id: 2,
        nombre: 'Bibliotecario',
        descripcion: 'Gestiona libros',
      },
    };

    it('should return current user info', async () => {
      (mockRequest as any).user = { userId: 1 };
      (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);

      await authController.getCurrentUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(userRepository.findById).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: expect.not.objectContaining({ hash_contraseña: expect.anything() }),
        })
      );
    });

    it('should return 404 when user not found', async () => {
      (mockRequest as any).user = { userId: 999 };
      (userRepository.findById as jest.Mock).mockResolvedValue(null);

      await authController.getCurrentUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Usuario no encontrado',
      });
    });
  });
});
