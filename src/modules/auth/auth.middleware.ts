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
 * Usage: requireRole(['Admin', 'Supervisor'])
 * Note: This middleware REQUIRES authenticate middleware to be called first
 * Anonymous users (Lector role or userId=0) are ALWAYS rejected
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      throw new AppError('No autenticado', 401);
    }

    // CRITICAL: Reject ALL anonymous users from protected operations
    // Anonymous users can ONLY read books, nothing else
    if (authReq.user.rolNombre === 'Lector' || authReq.user.userId === 0 || authReq.user.userId === null) {
      throw new AppError('Los usuarios anónimos no tienen permisos para realizar esta acción', 403);
    }

    // Check if user's role is in the allowed list
    if (!allowedRoles.includes(authReq.user.rolNombre)) {
      throw new AppError('No tiene permisos para realizar esta acción', 403);
    }

    next();
  };
};

/**
 * Middleware to require authentication (minimum Lector role)
 * All users must be authenticated, including anonymous users
 * This allows Lector (anonymous) and any other authenticated role
 */
export const optionalAuthenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Se requiere autenticación. Inicie sesión como usuario registrado o como usuario anónimo', 401);
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      throw new AppError('Token vacío. Se requiere autenticación', 401);
    }

    const payload = authService.verifyToken(token);
    (req as AuthRequest).user = payload;
    
    // Allow all authenticated users (including Lector/anonymous)
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Token inválido o expirado', 401));
    }
  }
};
