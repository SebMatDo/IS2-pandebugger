/**
 * History Logging Middleware
 * Automatically log actions to history/audit log
 */

import { Request, Response, NextFunction } from 'express';
import historyService from '../../modules/history/history.service';
import { AuthRequest } from '../../modules/auth/auth.types';
import { logger } from './logger';

/**
 * Extended response to track what was modified
 */
interface HistoryTrackingResponse extends Response {
  locals: {
    historyAction?: string;
    historyTargetType?: string;
    historyTargetId?: number;
    historyDetails?: Record<string, any>;
  };
}

/**
 * Middleware to log actions after response is sent
 * Usage: Add to routes that should be logged
 */
export const logAction = (accion: string, target_type: string) => {
  return (req: AuthRequest, res: HistoryTrackingResponse, next: NextFunction) => {
    // Store action info in response locals
    res.locals.historyAction = accion;
    res.locals.historyTargetType = target_type;

    // Capture the original json method
    const originalJson = res.json.bind(res);

    // Override json method to log after sending response
    res.json = function (body: any) {
      // Extract target_id from params or body
      const target_id = req.params.id 
        ? parseInt(req.params.id) 
        : body?.data?.id || body?.id;

      // Only log if we have a user and the response was successful
      if (req.user && res.statusCode >= 200 && res.statusCode < 300) {
        // Log asynchronously, don't block response
        historyService.logAction({
          usuario_id: (req.user as any).userId,
          accion: res.locals.historyAction || accion,
          target_type: res.locals.historyTargetType || target_type,
          target_id: target_id || res.locals.historyTargetId,
          detalles: res.locals.historyDetails || {
            method: req.method,
            path: req.path,
            status: res.statusCode
          }
        }).catch(error => {
          logger.error('Failed to log action', { error: error.message });
        });
      }

      // Call original json method
      return originalJson(body);
    };

    next();
  };
};

/**
 * Set target ID for history logging
 * Use this in controllers when the target ID is determined dynamically
 */
export const setHistoryTargetId = (req: Request, res: HistoryTrackingResponse, target_id: number) => {
  res.locals.historyTargetId = target_id;
};

/**
 * Set history details
 * Use this in controllers to add custom details to history log
 */
export const setHistoryDetails = (req: Request, res: HistoryTrackingResponse, details: Record<string, any>) => {
  res.locals.historyDetails = {
    ...res.locals.historyDetails,
    ...details
  };
};

/**
 * Automatic logging for common CRUD operations
 * Infers action and target type from HTTP method and route
 */
export const autoLogCrud = (target_type: string) => {
  return (req: AuthRequest, res: HistoryTrackingResponse, next: NextFunction) => {
    const methodToAction: Record<string, string> = {
      'POST': 'crear',
      'PUT': 'modificar',
      'PATCH': 'modificar',
      'DELETE': 'eliminar'
    };

    const accion = methodToAction[req.method] || 'consultar';
    
    return logAction(accion, target_type)(req, res, next);
  };
};
