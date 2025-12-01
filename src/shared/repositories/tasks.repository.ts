import { db } from '../database/connection';
import { Task } from '../types/database.types';

export class TaskRepository {
  /**
   * Find task by ID
   */
  async findById(id: number): Promise<Task | null> {
    const result = await db.query<Task>(
      `SELECT t.*, 
              l.titulo as libro_titulo, 
              l.autor as libro_autor, 
              c.nombre as libro_categoria,
              u.nombres as usuario_nombres, 
              u.apellidos as usuario_apellidos, 
              u.correo_electronico as usuario_correo,
              e.nombre as estado_nombre,
              e.descripcion as estado_descripcion,
              e.orden as estado_orden,
              e.created_at as estado_created_at
       FROM tareas t
       LEFT JOIN libros l ON t.libro_id = l.id
       LEFT JOIN categoria c ON l.categoria_id = c.id
       LEFT JOIN usuarios u ON t.usuario_id = u.id
       LEFT JOIN estados_libro e ON t.estado_nuevo_id = e.id
       WHERE t.id = $1
       LIMIT 1`,
      [id]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      ...row,
      libro: row.libro_id
        ? { id: row.libro_id, titulo: row.libro_titulo, autor: row.libro_autor, categoria: row.libro_categoria }
        : undefined,
      usuario: row.usuario_id
        ? { id: row.usuario_id, nombres: row.usuario_nombres, apellidos: row.usuario_apellidos, correo_electronico: row.usuario_correo }
        : undefined,
      estado: row.estado_nuevo_id
        ? { id: row.estado_nuevo_id, nombre: row.estado_nombre, descripcion: row.estado_descripcion, orden: row.estado_orden, created_at: row.estado_created_at }
        : undefined,
    };
  }

  /**
   * Create a new task
   */
  async create(task: {
    libro_id: number;
    usuario_id?: number;
    estado_nuevo_id?: number;
    fecha_finalizacion?: string;
    observaciones?: string;
  }): Promise<Task> {
    const result = await db.query<Task>(
      `INSERT INTO tareas (libro_id, usuario_id, estado_nuevo_id, fecha_finalizacion, observaciones)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [task.libro_id, task.usuario_id ?? null, task.estado_nuevo_id ?? null, task.fecha_finalizacion ?? null, task.observaciones ?? null]
    );

    return result.rows[0];
  }

  /**
   * Update task
   */
  async update(id: number, updates: Partial<Task>): Promise<Task | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id') {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    const result = await db.query<Task>(
      `UPDATE tareas SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Search tasks with filters
   */
  async search(filters: {
    libro_id?: number;
    usuario_id?: number;
    estado_nuevo_id?: number;
    fecha_asignacion?: string;
    fecha_finalizacion?: string;
  }): Promise<Task[]> {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (filters.libro_id) {
      conditions.push(`t.libro_id = $${paramCount}`);
      values.push(filters.libro_id);
      paramCount++;
    }

    if (filters.usuario_id) {
      conditions.push(`t.usuario_id = $${paramCount}`);
      values.push(filters.usuario_id);
      paramCount++;
    }

    if (filters.estado_nuevo_id) {
      conditions.push(`t.estado_nuevo_id = $${paramCount}`);
      values.push(filters.estado_nuevo_id);
      paramCount++;
    }

    if (filters.fecha_asignacion) {
      conditions.push(`t.fecha_asignacion::date = $${paramCount}`);
      values.push(filters.fecha_asignacion);
      paramCount++;
    }

    if (filters.fecha_finalizacion) {
      conditions.push(`t.fecha_finalizacion::date = $${paramCount}`);
      values.push(filters.fecha_finalizacion);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await db.query<Task>(
      `SELECT t.*, 
              l.titulo as libro_titulo, 
              l.autor as libro_autor, 
              c.nombre as libro_categoria,
              u.nombres as usuario_nombres, 
              u.apellidos as usuario_apellidos, 
              u.correo_electronico as usuario_correo,
              e.nombre as estado_nombre,
              e.descripcion as estado_descripcion,
              e.orden as estado_orden,
              e.created_at as estado_created_at
       FROM tareas t
       LEFT JOIN libros l ON t.libro_id = l.id
       LEFT JOIN categoria c ON l.categoria_id = c.id
       LEFT JOIN usuarios u ON t.usuario_id = u.id
       LEFT JOIN estados_libro e ON t.estado_nuevo_id = e.id
       ${whereClause}
       ORDER BY t.id`,
      values
    );

    return result.rows.map(row => ({
      ...row,
      libro: row.libro_id
        ? { id: row.libro_id, titulo: row.libro_titulo, autor: row.libro_autor, categoria: row.libro_categoria }
        : undefined,
      usuario: row.usuario_id
        ? { id: row.usuario_id, nombres: row.usuario_nombres, apellidos: row.usuario_apellidos, correo_electronico: row.usuario_correo }
        : undefined,
      estado: row.estado_nuevo_id
        ? { id: row.estado_nuevo_id, nombre: row.estado_nombre, descripcion: row.estado_descripcion, orden: row.estado_orden, created_at: row.estado_created_at }
        : undefined,
    }));
  }
}

export const taskRepository = new TaskRepository();
