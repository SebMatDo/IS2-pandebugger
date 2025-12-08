/**
 * History Service
 * Business logic for audit logging
 */

import historyRepository from './history.repository';
import {
  HistoryFilters,
  HistoryResponse,
  HistoryRecordWithDetails,
  LogActionParams,
  Accion,
  TargetType
} from './history.types';
import { logger } from '../../shared/middleware/logger';

export class HistoryService {
  /**
   * Log an action in the system
   */
  async logAction(params: LogActionParams): Promise<void> {
    try {
      await historyRepository.logAction(params);
      logger.debug('Action logged', {
        usuario_id: params.usuario_id,
        accion: params.accion,
        target_type: params.target_type,
        target_id: params.target_id
      });
    } catch (error: any) {
      logger.error('Error logging action', {
        error: error.message,
        params
      });
      // Don't throw - logging should not break the main operation
    }
  }

  /**
   * Get history records with filters and pagination
   */
  async getHistory(filters: HistoryFilters): Promise<HistoryResponse> {
    const page = Math.floor((filters.offset || 0) / (filters.limit || 50)) + 1;
    const pageSize = filters.limit || 50;

    const { records, total } = await historyRepository.findAll(filters);

    return {
      records,
      total,
      page,
      pageSize
    };
  }

  /**
   * Get history by ID
   */
  async getHistoryById(id: number): Promise<HistoryRecordWithDetails | null> {
    return historyRepository.findById(id);
  }

  /**
   * Get history for a specific target (e.g., all actions on a book)
   */
  async getTargetHistory(target_type: string, target_id: number): Promise<HistoryRecordWithDetails[]> {
    return historyRepository.findByTarget(target_type, target_id);
  }

  /**
   * Get recent activity in the system
   */
  async getRecentActivity(limit: number = 20): Promise<HistoryRecordWithDetails[]> {
    return historyRepository.getRecentActivity(limit);
  }

  /**
   * Get user activity
   */
  async getUserActivity(usuario_id: number, limit: number = 50): Promise<HistoryRecordWithDetails[]> {
    return historyRepository.getUserActivity(usuario_id, limit);
  }

  /**
   * Get all available actions
   */
  async getAllAcciones(): Promise<Accion[]> {
    return historyRepository.getAllAcciones();
  }

  /**
   * Get all available target types
   */
  async getAllTargetTypes(): Promise<TargetType[]> {
    return historyRepository.getAllTargetTypes();
  }

  /**
   * Helper: Log user login
   */
  async logLogin(usuario_id: number): Promise<void> {
    await this.logAction({
      usuario_id,
      accion: 'login',
      target_type: 'sistema',
      detalles: { timestamp: new Date().toISOString() }
    });
  }

  /**
   * Helper: Log user logout
   */
  async logLogout(usuario_id: number): Promise<void> {
    await this.logAction({
      usuario_id,
      accion: 'logout',
      target_type: 'sistema',
      detalles: { timestamp: new Date().toISOString() }
    });
  }

  /**
   * Helper: Log password change
   */
  async logPasswordChange(usuario_id: number): Promise<void> {
    await this.logAction({
      usuario_id,
      accion: 'cambiar_contraseña',
      target_type: 'usuario',
      target_id: usuario_id,
      detalles: { timestamp: new Date().toISOString() }
    });
  }

  /**
   * Helper: Log entity creation
   */
  async logCreate(usuario_id: number, target_type: string, target_id: number, detalles?: any): Promise<void> {
    await this.logAction({
      usuario_id,
      accion: 'crear',
      target_type,
      target_id,
      detalles
    });
  }

  /**
   * Helper: Log entity modification
   */
  async logUpdate(usuario_id: number, target_type: string, target_id: number, detalles?: any): Promise<void> {
    await this.logAction({
      usuario_id,
      accion: 'modificar',
      target_type,
      target_id,
      detalles
    });
  }

  /**
   * Helper: Log entity deletion
   */
  async logDelete(usuario_id: number, target_type: string, target_id: number, detalles?: any): Promise<void> {
    await this.logAction({
      usuario_id,
      accion: 'eliminar',
      target_type,
      target_id,
      detalles
    });
  }
}

export default new HistoryService();
