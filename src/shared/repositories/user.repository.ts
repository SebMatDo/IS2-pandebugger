import { db } from '../database/connection';
import { User } from '../types/database.types';

export class UserRepository {
  /**
   * Find user by email (active users only)
   */
  async findByEmail(email: string): Promise<User | null> {
    const result = await db.query<User>(
      `SELECT u.*, r.nombre as rol_nombre, r.descripcion as rol_descripcion
       FROM usuarios u
       LEFT JOIN roles r ON u.rol_id = r.id
       WHERE u.correo_electronico = $1 AND u.estado = true
       LIMIT 1`,
      [email]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      nombres: row.nombres,
      apellidos: row.apellidos,
      correo_electronico: row.correo_electronico,
      hash_contraseña: row.hash_contraseña,
      rol_id: row.rol_id,
      estado: row.estado,
      rol: {
        id: row.rol_id,
        nombre: (row as any).rol_nombre,
        descripcion: (row as any).rol_descripcion,
      },
    };
  }

  /**
   * Find user by ID
   */
  async findById(id: number): Promise<User | null> {
    const result = await db.query<User>(
      `SELECT u.*, r.nombre as rol_nombre, r.descripcion as rol_descripcion
       FROM usuarios u
       LEFT JOIN roles r ON u.rol_id = r.id
       WHERE u.id = $1
       LIMIT 1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      nombres: row.nombres,
      apellidos: row.apellidos,
      correo_electronico: row.correo_electronico,
      hash_contraseña: row.hash_contraseña,
      rol_id: row.rol_id,
      estado: row.estado,
      rol: {
        id: row.rol_id,
        nombre: (row as any).rol_nombre,
        descripcion: (row as any).rol_descripcion,
      },
    };
  }

  /**
   * Create a new user
   */
  async create(user: {
    nombres: string;
    apellidos: string;
    correo_electronico: string;
    hash_contraseña: string;
    rol_id: number;
  }): Promise<User> {
    const result = await db.query<User>(
      `INSERT INTO usuarios (nombres, apellidos, correo_electronico, hash_contraseña, rol_id, estado)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING *`,
      [user.nombres, user.apellidos, user.correo_electronico, user.hash_contraseña, user.rol_id]
    );

    return result.rows[0];
  }

  /**
   * Update user
   */
  async update(id: number, updates: Partial<User>): Promise<User | null> {
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

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const result = await db.query<User>(
      `UPDATE usuarios SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Deactivate user (soft delete)
   */
  async deactivate(id: number): Promise<boolean> {
    const result = await db.query(
      'UPDATE usuarios SET estado = false WHERE id = $1',
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Search users with filters
   */
  async search(filters: {
    nombres?: string;
    apellidos?: string;
    correo_electronico?: string;
    rol_id?: number;
    estado?: boolean;
  }): Promise<User[]> {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (filters.nombres) {
      conditions.push(`u.nombres ILIKE $${paramCount}`);
      values.push(`%${filters.nombres}%`);
      paramCount++;
    }

    if (filters.apellidos) {
      conditions.push(`u.apellidos ILIKE $${paramCount}`);
      values.push(`%${filters.apellidos}%`);
      paramCount++;
    }

    if (filters.correo_electronico) {
      conditions.push(`u.correo_electronico ILIKE $${paramCount}`);
      values.push(`%${filters.correo_electronico}%`);
      paramCount++;
    }

    if (filters.rol_id) {
      conditions.push(`u.rol_id = $${paramCount}`);
      values.push(filters.rol_id);
      paramCount++;
    }

    if (filters.estado !== undefined) {
      conditions.push(`u.estado = $${paramCount}`);
      values.push(filters.estado);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await db.query<User>(
      `SELECT u.*, r.nombre as rol_nombre, r.descripcion as rol_descripcion
       FROM usuarios u
       LEFT JOIN roles r ON u.rol_id = r.id
       ${whereClause}
       ORDER BY u.id`,
      values
    );

    return result.rows.map(row => ({
      id: row.id,
      nombres: row.nombres,
      apellidos: row.apellidos,
      correo_electronico: row.correo_electronico,
      hash_contraseña: row.hash_contraseña,
      rol_id: row.rol_id,
      estado: row.estado,
      rol: {
        id: row.rol_id,
        nombre: (row as any).rol_nombre,
        descripcion: (row as any).rol_descripcion,
      },
    }));
  }
}

export const userRepository = new UserRepository();
