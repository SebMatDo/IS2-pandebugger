import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { createSuccessResponse } from '../../shared/utils/response';
import { AuthRequest, LoginDto } from './auth.types';
import { userRepository } from '../../shared/repositories/user.repository';

export class AuthController {
  /**
   * POST /api/v1/auth/login
   * Authenticate user and return JWT token (CU06)
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto: LoginDto = req.body;

      // Validation
      if (!dto.email || !dto.password) {
        res.status(400).json({
          status: 'error',
          message: '⚠️ Todos los campos son obligatorios',
        });
        return;
      }

      const result = await authService.login(dto);
      res.status(200).json(createSuccessResponse(result, 'Login exitoso'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/change-password
   * Change password for authenticated user (CU20)
   */
  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthRequest;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        res.status(400).json({
          status: 'error',
          message: 'Se requiere la contraseña actual y la nueva contraseña',
        });
        return;
      }

      await authService.changePassword(authReq.user!.userId, currentPassword, newPassword);

      res.status(200).json(createSuccessResponse(null, 'Contraseña actualizada exitosamente'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/restore-password
   * Restore password with reset token (CU21)
   */
  async restorePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // TODO: Implement password restoration with token
      res.status(501).json({
        status: 'error',
        message: 'Not implemented yet',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/auth/me
   * Get current authenticated user info
   */
  async getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthRequest;
      const user = await userRepository.findById(authReq.user!.userId);

      if (!user) {
        res.status(404).json({
          status: 'error',
          message: 'Usuario no encontrado',
        });
        return;
      }

      // Don't send password hash
      const { hash_contraseña, ...userWithoutPassword } = user;

      res.status(200).json(createSuccessResponse(userWithoutPassword));
    } catch (error) {
      next(error);
    }
  }
}
