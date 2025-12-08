import { db } from '../database/connection';
import { Task } from '../types/database.types';

// Define a TaskRow interface to represent the flat result of the SQL query with joins
interface TaskRow extends Task {
  // Joined Libro fields (Aliased)
  libro_titulo: string;
  libro_autor: string | null;
  libro_categoria: string | null;

  // Joined Usuario fields (Aliased)
  usuario_nombres: string;
  usuario_apellidos: string;
  usuario_correo: string;

  // Joined Estado fields (Aliased)
  estado_nombre: string;
  estado_descripcion: string | null;
  estado_orden: number;
  estado_created_at: Date | null;
}


export class TaskRepository {

  /**
   * Helper function to map a flat TaskRow result into the nested Task object structure.
   */
  private mapTaskRowToTask(row: TaskRow): Task {
    // 🎯 Explicitly map all base and nested properties, similar to UserRepository
    return {
      id: row.id,
      libro_id: row.libro_id,
      usuario_id: row.usuario_id,
      fecha_asignacion: row.fecha_asignacion,
      fecha_finalizacion: row.fecha_finalizacion,
      estado_nuevo_id: row.estado_nuevo_id,
      observaciones: row.observaciones,
      created_at: row.created_at,
      updated_at: row.updated_at,
      
      // Nested Libro Object
      libro: row.libro_id
        ? ({ 
            id: row.libro_id, 
            titulo: row.libro_titulo, 
            autor: row.libro_autor, 
            categoria: { nombre: row.libro_categoria } // Note: You might need the full Category type here if used elsewhere
          } as any) // Use 'as any' for the partial object since we only select a few columns
        : undefined,
        
      // Nested Usuario Object
      usuario: row.usuario_id
        ? ({ 
            id: row.usuario_id, 
            nombres: row.usuario_nombres, 
            apellidos: row.usuario_apellidos, 
            correo_electronico: row.usuario_correo 
          } as any)
        : undefined,
        
      // Nested Estado Object
      estado: row.estado_nuevo_id
        ? ({ 
            id: row.estado_nuevo_id, 
            nombre: row.estado_nombre, 
            descripcion: row.estado_descripcion, 
            orden: row.estado_orden, 
            created_at: row.estado_created_at 
          } as any)
        : undefined,
    } as Task; // Final assertion to Task
  }


  /**
   * Find task by ID
   */
  async findById(id: number): Promise<Task | null> {
    // Use TaskRow to tell TypeScript the shape of the query result
    const result = await db.query<TaskRow>(
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

    return this.mapTaskRowToTask(result.rows[0]);
  }

  /**
   * Create a new task
   */
  async create(task: {
    libro_id: number;
    usuario_id?: number;
    estado_nuevo_id?: number;
    fecha_finalizacion?: Date; // 🎯 FIX: Changed to Date to align with DB/service logic
    observaciones?: string;
  }): Promise<Task> {
    const result = await db.query<Task>(
      `INSERT INTO tareas (libro_id, usuario_id, estado_nuevo_id, fecha_finalizacion, observaciones, fecha_asignacion)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
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
      // Exclude nested objects like 'libro' and 'usuario' from update query
      if (value !== undefined && key !== 'id' && key !== 'libro' && key !== 'usuario' && key !== 'estado') {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    const result = await db.query<Task>(
      // 🎯 NOTE: Ensure 'updated_at' is updated correctly in your update clause
      `UPDATE tareas SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`,
      values
    );

    // After updating, we need to fetch the full task with all joins for the service layer
    return result.rows.length > 0 ? this.findById(result.rows[0].id) : null;
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

    // ... (Your filter building logic remains the same) ...
    // Note: The logic for building the WHERE clause is fine.

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

    // Use TaskRow to tell TypeScript the shape of the query result
    const result = await db.query<TaskRow>(
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

    // Map all resulting TaskRows to the final Task structure
    return result.rows.map(this.mapTaskRowToTask);
  }
}

export const taskRepository = new TaskRepository();