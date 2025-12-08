/**
 * History Repository
 * Database operations for audit logging
 */

import { db } from '../../shared/database/connection';
import {
  HistoryRecord,
  HistoryRecordWithDetails,
  CreateHistoryRequest,
  HistoryFilters,
  Accion,
  TargetType,
  LogActionParams
} from './history.types';

export class HistoryRepository {
  /**
   * Create a new history record
   */
  async create(data: CreateHistoryRequest): Promise<HistoryRecord> {
    const query = `
      INSERT INTO historial (usuario_id, accion_id, target_type_id, target_id, detalles)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      data.usuario_id,
      data.accion_id,
      data.target_type_id,
      data.target_id,
      data.detalles ? JSON.stringify(data.detalles) : null
    ];

    const result = await db.query<HistoryRecord>(query, values);
    return result.rows[0];
  }

  /**
   * Log an action (simplified interface)
   */
  async logAction(params: LogActionParams): Promise<HistoryRecord> {
    // Get accion_id from nombre
    const accionQuery = 'SELECT id FROM accion WHERE nombre = $1';
    const accionResult = await db.query<{ id: number }>(accionQuery, [params.accion]);
    
    if (accionResult.rows.length === 0) {
      throw new Error(`Acción '${params.accion}' no encontrada en la base de datos`);
    }
    
    const accion_id = accionResult.rows[0].id;

    // Get target_type_id from nombre
    const targetTypeQuery = 'SELECT id FROM target_type WHERE nombre = $1';
    const targetTypeResult = await db.query<{ id: number }>(targetTypeQuery, [params.target_type]);
    
    if (targetTypeResult.rows.length === 0) {
      throw new Error(`Target type '${params.target_type}' no encontrado en la base de datos`);
    }
    
    const target_type_id = targetTypeResult.rows[0].id;

    // Create history record
    return this.create({
      usuario_id: params.usuario_id,
      accion_id,
      target_type_id,
      target_id: params.target_id || null,
      detalles: params.detalles
    });
  }

  /**
   * Find history records with filters and pagination
   */
  async findAll(filters: HistoryFilters): Promise<{ records: HistoryRecordWithDetails[]; total: number }> {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    // Build WHERE clause
    if (filters.usuario_id) {
      conditions.push(`h.usuario_id = $${paramCount}`);
      values.push(filters.usuario_id);
      paramCount++;
    }

    if (filters.accion_id) {
      conditions.push(`h.accion_id = $${paramCount}`);
      values.push(filters.accion_id);
      paramCount++;
    }

    if (filters.target_type_id) {
      conditions.push(`h.target_type_id = $${paramCount}`);
      values.push(filters.target_type_id);
      paramCount++;
    }

    if (filters.target_id) {
      conditions.push(`h.target_id = $${paramCount}`);
      values.push(filters.target_id);
      paramCount++;
    }

    if (filters.fecha_inicio) {
      conditions.push(`h.fecha >= $${paramCount}`);
      values.push(filters.fecha_inicio);
      paramCount++;
    }

    if (filters.fecha_fin) {
      conditions.push(`h.fecha <= $${paramCount}`);
      values.push(filters.fecha_fin);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM historial h
      ${whereClause}
    `;
    const countResult = await db.query<{ total: string }>(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    // Get records with joins
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const query = `
      SELECT 
        h.*,
        u.nombres || ' ' || u.apellidos as usuario_nombre,
        u.correo_electronico as usuario_email,
        a.nombre as accion_nombre,
        a.descripcion as accion_descripcion,
        tt.nombre as target_type_nombre,
        -- Target details based on type
        CASE 
          WHEN tt.nombre = 'libro' THEN l.titulo
          WHEN tt.nombre = 'usuario' THEN tu.nombres || ' ' || tu.apellidos
          WHEN tt.nombre = 'categoria' THEN c.nombre
          WHEN tt.nombre = 'tarea' THEN 'Tarea #' || t.id || ' - ' || tl.titulo
          ELSE NULL
        END as target_nombre
      FROM historial h
      LEFT JOIN usuarios u ON h.usuario_id = u.id
      LEFT JOIN accion a ON h.accion_id = a.id
      LEFT JOIN target_type tt ON h.target_type_id = tt.id
      -- Join with target tables
      LEFT JOIN libros l ON tt.nombre = 'libro' AND h.target_id = l.id
      LEFT JOIN usuarios tu ON tt.nombre = 'usuario' AND h.target_id = tu.id
      LEFT JOIN categoria c ON tt.nombre = 'categoria' AND h.target_id = c.id
      LEFT JOIN tareas t ON tt.nombre = 'tarea' AND h.target_id = t.id
      LEFT JOIN libros tl ON t.libro_id = tl.id
      ${whereClause}
      ORDER BY h.fecha DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    values.push(limit, offset);

    const result = await db.query<HistoryRecordWithDetails>(query, values);

    return {
      records: result.rows,
      total
    };
  }

  /**
   * Find history by ID
   */
  async findById(id: number): Promise<HistoryRecordWithDetails | null> {
    const query = `
      SELECT 
        h.*,
        u.nombres || ' ' || u.apellidos as usuario_nombre,
        u.correo_electronico as usuario_email,
        a.nombre as accion_nombre,
        a.descripcion as accion_descripcion,
        tt.nombre as target_type_nombre,
        -- Target details based on type
        CASE 
          WHEN tt.nombre = 'libro' THEN l.titulo
          WHEN tt.nombre = 'usuario' THEN tu.nombres || ' ' || tu.apellidos
          WHEN tt.nombre = 'categoria' THEN c.nombre
          WHEN tt.nombre = 'tarea' THEN 'Tarea #' || t.id || ' - ' || tl.titulo
          ELSE NULL
        END as target_nombre
      FROM historial h
      LEFT JOIN usuarios u ON h.usuario_id = u.id
      LEFT JOIN accion a ON h.accion_id = a.id
      LEFT JOIN target_type tt ON h.target_type_id = tt.id
      -- Join with target tables
      LEFT JOIN libros l ON tt.nombre = 'libro' AND h.target_id = l.id
      LEFT JOIN usuarios tu ON tt.nombre = 'usuario' AND h.target_id = tu.id
      LEFT JOIN categoria c ON tt.nombre = 'categoria' AND h.target_id = c.id
      LEFT JOIN tareas t ON tt.nombre = 'tarea' AND h.target_id = t.id
      LEFT JOIN libros tl ON t.libro_id = tl.id
      WHERE h.id = $1
    `;

    const result = await db.query<HistoryRecordWithDetails>(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Get history for a specific target
   */
  async findByTarget(target_type: string, target_id: number): Promise<HistoryRecordWithDetails[]> {
    const query = `
      SELECT 
        h.*,
        u.nombres || ' ' || u.apellidos as usuario_nombre,
        u.correo_electronico as usuario_email,
        a.nombre as accion_nombre,
        a.descripcion as accion_descripcion,
        tt.nombre as target_type_nombre,
        -- Target details based on type
        CASE 
          WHEN tt.nombre = 'libro' THEN l.titulo
          WHEN tt.nombre = 'usuario' THEN tu.nombres || ' ' || tu.apellidos
          WHEN tt.nombre = 'categoria' THEN c.nombre
          WHEN tt.nombre = 'tarea' THEN 'Tarea #' || t.id || ' - ' || tl.titulo
          ELSE NULL
        END as target_nombre
      FROM historial h
      LEFT JOIN usuarios u ON h.usuario_id = u.id
      LEFT JOIN accion a ON h.accion_id = a.id
      LEFT JOIN target_type tt ON h.target_type_id = tt.id
      -- Join with target tables
      LEFT JOIN libros l ON tt.nombre = 'libro' AND h.target_id = l.id
      LEFT JOIN usuarios tu ON tt.nombre = 'usuario' AND h.target_id = tu.id
      LEFT JOIN categoria c ON tt.nombre = 'categoria' AND h.target_id = c.id
      LEFT JOIN tareas t ON tt.nombre = 'tarea' AND h.target_id = t.id
      LEFT JOIN libros tl ON t.libro_id = tl.id
      WHERE tt.nombre = $1 AND h.target_id = $2
      ORDER BY h.fecha DESC
    `;

    const result = await db.query<HistoryRecordWithDetails>(query, [target_type, target_id]);
    return result.rows;
  }

  /**
   * Get all available actions
   */
  async getAllAcciones(): Promise<Accion[]> {
    const query = 'SELECT * FROM accion ORDER BY nombre';
    const result = await db.query<Accion>(query);
    return result.rows;
  }

  /**
   * Get all available target types
   */
  async getAllTargetTypes(): Promise<TargetType[]> {
    const query = 'SELECT * FROM target_type ORDER BY nombre';
    const result = await db.query<TargetType>(query);
    return result.rows;
  }

  /**
   * Get action ID by name
   */
  async getAccionIdByNombre(nombre: string): Promise<number | null> {
    const query = 'SELECT id FROM accion WHERE nombre = $1';
    const result = await db.query<{ id: number }>(query, [nombre]);
    return result.rows[0]?.id || null;
  }

  /**
   * Get target type ID by name
   */
  async getTargetTypeIdByNombre(nombre: string): Promise<number | null> {
    const query = 'SELECT id FROM target_type WHERE nombre = $1';
    const result = await db.query<{ id: number }>(query, [nombre]);
    return result.rows[0]?.id || null;
  }

  /**
   * Get recent activity (last N records)
   */
  async getRecentActivity(limit: number = 20): Promise<HistoryRecordWithDetails[]> {
    const query = `
      SELECT 
        h.*,
        u.nombres || ' ' || u.apellidos as usuario_nombre,
        u.correo_electronico as usuario_email,
        a.nombre as accion_nombre,
        a.descripcion as accion_descripcion,
        tt.nombre as target_type_nombre,
        -- Target details based on type
        CASE 
          WHEN tt.nombre = 'libro' THEN l.titulo
          WHEN tt.nombre = 'usuario' THEN tu.nombres || ' ' || tu.apellidos
          WHEN tt.nombre = 'categoria' THEN c.nombre
          WHEN tt.nombre = 'tarea' THEN 'Tarea #' || t.id || ' - ' || tl.titulo
          ELSE NULL
        END as target_nombre
      FROM historial h
      LEFT JOIN usuarios u ON h.usuario_id = u.id
      LEFT JOIN accion a ON h.accion_id = a.id
      LEFT JOIN target_type tt ON h.target_type_id = tt.id
      -- Join with target tables
      LEFT JOIN libros l ON tt.nombre = 'libro' AND h.target_id = l.id
      LEFT JOIN usuarios tu ON tt.nombre = 'usuario' AND h.target_id = tu.id
      LEFT JOIN categoria c ON tt.nombre = 'categoria' AND h.target_id = c.id
      LEFT JOIN tareas t ON tt.nombre = 'tarea' AND h.target_id = t.id
      LEFT JOIN libros tl ON t.libro_id = tl.id
      ORDER BY h.fecha DESC
      LIMIT $1
    `;

    const result = await db.query<HistoryRecordWithDetails>(query, [limit]);
    return result.rows;
  }

  /**
   * Get user activity
   */
  async getUserActivity(usuario_id: number, limit: number = 50): Promise<HistoryRecordWithDetails[]> {
    const query = `
      SELECT 
        h.*,
        u.nombres || ' ' || u.apellidos as usuario_nombre,
        u.correo_electronico as usuario_email,
        a.nombre as accion_nombre,
        a.descripcion as accion_descripcion,
        tt.nombre as target_type_nombre,
        -- Target details based on type
        CASE 
          WHEN tt.nombre = 'libro' THEN l.titulo
          WHEN tt.nombre = 'usuario' THEN tu.nombres || ' ' || tu.apellidos
          WHEN tt.nombre = 'categoria' THEN c.nombre
          WHEN tt.nombre = 'tarea' THEN 'Tarea #' || t.id || ' - ' || tl.titulo
          ELSE NULL
        END as target_nombre
      FROM historial h
      LEFT JOIN usuarios u ON h.usuario_id = u.id
      LEFT JOIN accion a ON h.accion_id = a.id
      LEFT JOIN target_type tt ON h.target_type_id = tt.id
      -- Join with target tables
      LEFT JOIN libros l ON tt.nombre = 'libro' AND h.target_id = l.id
      LEFT JOIN usuarios tu ON tt.nombre = 'usuario' AND h.target_id = tu.id
      LEFT JOIN categoria c ON tt.nombre = 'categoria' AND h.target_id = c.id
      LEFT JOIN tareas t ON tt.nombre = 'tarea' AND h.target_id = t.id
      LEFT JOIN libros tl ON t.libro_id = tl.id
      WHERE h.usuario_id = $1
      ORDER BY h.fecha DESC
      LIMIT $2
    `;

    const result = await db.query<HistoryRecordWithDetails>(query, [usuario_id, limit]);
    return result.rows;
  }
}

export default new HistoryRepository();
