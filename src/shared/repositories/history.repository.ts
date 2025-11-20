import { db } from '../database/connection';
import { CreateHistoryDto, History } from '../types/database.types';

export class HistoryRepository {
  /**
   * Create a history entry (audit log)
   */
  async create(dto: CreateHistoryDto): Promise<History> {
    const result = await db.query<History>(
      `INSERT INTO historial (fecha, usuario_id, accion_id, target_type_id, target_id)
       VALUES (NOW(), $1, $2, $3, $4)
       RETURNING *`,
      [dto.usuario_id, dto.accion_id, dto.target_type_id, dto.target_id]
    );

    return result.rows[0];
  }

  /**
   * Get history for a specific target
   */
  async getByTarget(targetTypeId: number, targetId: number): Promise<History[]> {
    const result = await db.query<History>(
      `SELECT h.*, 
              u.nombres, u.apellidos, u.correo_electronico,
              a.nombre as accion_nombre, a.descripcion as accion_descripcion,
              tt.nombre as target_type_nombre
       FROM historial h
       LEFT JOIN usuarios u ON h.usuario_id = u.id
       LEFT JOIN accion a ON h.accion_id = a.id
       LEFT JOIN target_type tt ON h.target_type_id = tt.id
       WHERE h.target_type_id = $1 AND h.target_id = $2
       ORDER BY h.fecha DESC`,
      [targetTypeId, targetId]
    );

    return result.rows;
  }

  /**
   * Get history by user
   */
  async getByUser(userId: number, limit: number = 50): Promise<History[]> {
    const result = await db.query<History>(
      `SELECT h.*, 
              a.nombre as accion_nombre, a.descripcion as accion_descripcion,
              tt.nombre as target_type_nombre
       FROM historial h
       LEFT JOIN accion a ON h.accion_id = a.id
       LEFT JOIN target_type tt ON h.target_type_id = tt.id
       WHERE h.usuario_id = $1
       ORDER BY h.fecha DESC
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  }
}

export const historyRepository = new HistoryRepository();

/**
 * Helper function to write to history
 * Matches Python's write_to_historial function
 */
export async function writeToHistorial(
  usuario_id: number,
  accion_id: number,
  target_type_id: number,
  target_id: number
): Promise<void> {
  await historyRepository.create({
    usuario_id,
    accion_id,
    target_type_id,
    target_id,
  });
}
