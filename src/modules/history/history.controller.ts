/**
 * History Controller
 * Handle HTTP requests for history/audit logs
 */

import { Request, Response, NextFunction } from 'express';
import historyService from './history.service';
import { HistoryFilters } from './history.types';
import { createSuccessResponse, createErrorResponse } from '../../shared/utils/response';

export class HistoryController {
  /**
   * Get history records with filters
   * GET /api/v1/history
   */
  async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters: HistoryFilters = {
        usuario_id: req.query.usuario_id ? parseInt(req.query.usuario_id as string) : undefined,
        accion_id: req.query.accion_id ? parseInt(req.query.accion_id as string) : undefined,
        target_type_id: req.query.target_type_id ? parseInt(req.query.target_type_id as string) : undefined,
        target_id: req.query.target_id ? parseInt(req.query.target_id as string) : undefined,
        fecha_inicio: req.query.fecha_inicio as string,
        fecha_fin: req.query.fecha_fin as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0
      };

      const result = await historyService.getHistory(filters);

      res.json(createSuccessResponse(result, 'Historial obtenido exitosamente'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get history record by ID
   * GET /api/v1/history/:id
   */
  async getHistoryById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json(createErrorResponse('ID inválido'));
        return;
      }

      const record = await historyService.getHistoryById(id);

      if (!record) {
        res.status(404).json(createErrorResponse('Registro de historial no encontrado'));
        return;
      }

      res.json(createSuccessResponse(record, 'Registro obtenido exitosamente'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get history for a specific target
   * GET /api/v1/history/target/:type/:id
   */
  async getTargetHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const target_type = req.params.type;
      const target_id = parseInt(req.params.id);

      if (isNaN(target_id)) {
        res.status(400).json(createErrorResponse('ID inválido'));
        return;
      }

      const records = await historyService.getTargetHistory(target_type, target_id);

      res.json(createSuccessResponse({
        target_type,
        target_id,
        records,
        total: records.length
      }, 'Historial del objetivo obtenido exitosamente'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get recent activity in the system
   * GET /api/v1/history/recent
   */
  async getRecentActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      const records = await historyService.getRecentActivity(limit);

      res.json(createSuccessResponse({
        records,
        total: records.length
      }, 'Actividad reciente obtenida exitosamente'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user activity
   * GET /api/v1/history/user/:id
   */
  async getUserActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const usuario_id = parseInt(req.params.id);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

      if (isNaN(usuario_id)) {
        res.status(400).json(createErrorResponse('ID de usuario inválido'));
        return;
      }

      const records = await historyService.getUserActivity(usuario_id, limit);

      res.json(createSuccessResponse({
        usuario_id,
        records,
        total: records.length
      }, 'Actividad del usuario obtenida exitosamente'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all available actions
   * GET /api/v1/history/acciones
   */
  async getAcciones(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const acciones = await historyService.getAllAcciones();

      res.json(createSuccessResponse(acciones, 'Acciones obtenidas exitosamente'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all available target types
   * GET /api/v1/history/target-types
   */
  async getTargetTypes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const targetTypes = await historyService.getAllTargetTypes();

      res.json(createSuccessResponse(targetTypes, 'Tipos de objetivo obtenidos exitosamente'));
    } catch (error) {
      next(error);
    }
  }
}

export default new HistoryController();
