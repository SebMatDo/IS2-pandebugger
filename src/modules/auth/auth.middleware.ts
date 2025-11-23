import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { AppError } from '../../shared/middleware/errorHandler';
import { AuthRequest } from './auth.types';
import { logger } from '../../shared/middleware/logger';

/**
 * Middleware to verify JWT token and attach user to request
 * Usage: Add to routes that require authentication
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    logger.debug('Request headers:', req.headers);
    const authHeader = req.headers.authorization;
    logger.debug('Authorization header:', authHeader);
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Token no proporcionado', 401);
    }
    if (!authHeader.startsWith('Bearer ')) {
      logger.warn('Invalid authorization format:', authHeader);
      res.status(401).json({
        success: false,
        message: 'Formato de token inválido. Use: Bearer <token>'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer '
    logger.debug('Extracted token:', token.substring(0, 20) + '...');

    if (!token) {
      logger.warn('Token is empty after extraction');
      res.status(401).json({
        success: false,
        message: 'Token vacío'
      });
      return;
    }

    const payload = authService.verifyToken(token);
    logger.debug('Token payload:', payload);

    // Attach user info to request
    (req as AuthRequest).user = payload;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Token inválido o expirado', 401));
    }
  }
};

/**
 * Middleware to check if user has specific role
 * Usage: authenticate, requireRole(['Admin', 'Supervisor'])
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      throw new AppError('No autenticado', 401);
    }

    if (!allowedRoles.includes(authReq.user.rolNombre)) {
      throw new AppError('No tiene permisos para realizar esta acción', 403);
    }

    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token provided
 * Useful for endpoints that work differently for authenticated users
 */
export const optionalAuthenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = authService.verifyToken(token);
      (req as AuthRequest).user = payload;
    }
  } catch (error) {
    // Silently fail - this is optional auth
  }
  next();
};
