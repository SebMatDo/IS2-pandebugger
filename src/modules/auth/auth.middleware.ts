import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { AppError } from '../../shared/middleware/errorHandler';
import { AuthRequest } from './auth.types';

/**
 * Middleware to verify JWT token and attach user to request
 * Usage: Add to routes that require authentication
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Token no proporcionado', 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const payload = authService.verifyToken(token);

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
