import { db } from '../../shared/database/connection';
import { AppError } from '../../shared/middleware/errorHandler';
import { CreateBookDto, UpdateBookDto, BookResponse, BookFilters } from './books.types';

export class BooksService {
  /**
   * Convert database row to BookResponse
   */
  private toBookResponse(row: any): BookResponse {
    return {
      id: row.id,
      isbn: row.isbn || '',
      titulo: row.titulo,
      autor: row.autor,
      fecha: row.fecha,
      numero_paginas: row.numero_paginas,
      estanteria: row.estanteria,
      espacio: row.espacio,
      categoria: row.categoria_id ? {
        id: row.categoria_id,
        nombre: row.categoria_nombre,
        descripcion: row.categoria_descripcion,
      } : undefined,
      estado: {
        id: row.estado_id,
        nombre: row.estado_nombre,
        descripcion: row.estado_descripcion,
        orden: row.estado_orden,
      },
      directorio_pdf: row.directorio_pdf || null,
      directorio_img: row.directorio_img || null,
    };
  }

  /**
   * Get default "Registrado" state ID
   */
  private async getDefaultStateId(): Promise<number> {
    const result = await db.query<{ id: number }>(
      'SELECT id FROM estados_libro WHERE nombre = $1',
      ['Registrado']
    );

    if (result.rows.length === 0) {
      throw new AppError('Estado inicial "Registrado" no encontrado', 500);
    }

    return result.rows[0].id;
  }

  /**
   * Check if category exists
   */
  private async categoryExists(categoryId: number): Promise<boolean> {
    const result = await db.query('SELECT id FROM categoria WHERE id = $1', [categoryId]);
    return result.rows.length > 0;
  }

  /**
   * Check if state exists
   */
  private async stateExists(stateId: number): Promise<boolean> {
    const result = await db.query('SELECT id FROM estados_libro WHERE id = $1', [stateId]);
    return result.rows.length > 0;
  }

  /**
   * CU01 - Register Book (Registrar Libro)
   * Creates a new book with estado "Registrado"
   */
  async createBook(dto: CreateBookDto, creatorUserId: number): Promise<BookResponse> {
    // Validate required fields
    if (!dto.titulo || !dto.autor || !dto.numero_paginas || !dto.estanteria || !dto.espacio) {
      throw new AppError('Por favor complete todos los campos obligatorios.', 400);
    }

    // Validate numero_paginas
    if (dto.numero_paginas <= 0) {
      throw new AppError('El número de páginas debe ser un número entero positivo.', 400);
    }

    // Validate category if provided
    if (dto.categoria_id && !(await this.categoryExists(dto.categoria_id))) {
      throw new AppError('La categoría seleccionada no existe.', 400);
    }

    // Get default state "Registrado"
    const estadoId = await this.getDefaultStateId();

    // Insert book
    const result = await db.query<any>(
      `INSERT INTO libros (
        isbn, titulo, autor, fecha, numero_paginas, 
        estanteria, espacio, categoria_id, estado_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        dto.isbn || '',
        dto.titulo,
        dto.autor,
        dto.fecha,
        dto.numero_paginas,
        dto.estanteria,
        dto.espacio,
        dto.categoria_id || null,
        estadoId,
      ]
    );

    const newBook = result.rows[0];

    // TODO: Log to historial
    // await writeToHistorial(creatorUserId, accionCrear.id, ttLibro.id, newBook.id);

    // Fetch complete book data with relations (skip permission check for internal call)
    return this.getBookById(newBook.id, undefined, true);
  }

  /**
   * CU17 - Search/List Books (Buscar Libros)
   * Get all books with optional filters
   * Public books (estado="Publicado") can be accessed by anyone
   */
  async getAllBooks(filters?: BookFilters, userRole?: string): Promise<BookResponse[]> {
    let query = `
      SELECT 
        l.*,
        e.nombre as estado_nombre,
        e.descripcion as estado_descripcion,
        e.orden as estado_orden,
        c.nombre as categoria_nombre,
        c.descripcion as categoria_descripcion
      FROM libros l
      LEFT JOIN estados_libro e ON l.estado_id = e.id
      LEFT JOIN categoria c ON l.categoria_id = c.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 1;

    // Non-authenticated users or users without special roles can only see available books
    const canSeeAll = userRole && ['Admin', 'Bibliotecario', 'Digitalizador', 'Revisor', 'Restaurador'].includes(userRole);
    
    if (!canSeeAll) {
      query += ` AND e.nombre = 'Disponible'`;
    }

    // Apply filters
    if (filters?.estado_id) {
      query += ` AND l.estado_id = $${paramCount}`;
      params.push(filters.estado_id);
      paramCount++;
    }

    if (filters?.categoria_id) {
      query += ` AND l.categoria_id = $${paramCount}`;
      params.push(filters.categoria_id);
      paramCount++;
    }

    if (filters?.titulo) {
      query += ` AND l.titulo ILIKE $${paramCount}`;
      params.push(`%${filters.titulo}%`);
      paramCount++;
    }

    if (filters?.autor) {
      query += ` AND l.autor ILIKE $${paramCount}`;
      params.push(`%${filters.autor}%`);
      paramCount++;
    }

    if (filters?.isbn) {
      query += ` AND l.isbn ILIKE $${paramCount}`;
      params.push(`%${filters.isbn}%`);
      paramCount++;
    }

    query += ' ORDER BY l.id DESC';

    const result = await db.query<any>(query, params);

    return result.rows.map((row) => this.toBookResponse(row));
  }

  /**
   * CU22 - Query Book (Consultar Libro)
   * Get book by ID
   * Public books can be accessed by anyone
   */
  async getBookById(id: number, userRole?: string, skipPermissionCheck: boolean = false): Promise<BookResponse> {
    const result = await db.query<any>(
      `SELECT 
        l.*,
        e.nombre as estado_nombre,
        e.descripcion as estado_descripcion,
        e.orden as estado_orden,
        c.nombre as categoria_nombre,
        c.descripcion as categoria_descripcion
      FROM libros l
      LEFT JOIN estados_libro e ON l.estado_id = e.id
      LEFT JOIN categoria c ON l.categoria_id = c.id
      WHERE l.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Libro no encontrado.', 404);
    }

    const book = result.rows[0];

    // Check if user can access this book (skip for internal calls)
    if (!skipPermissionCheck) {
      const canSeeAll = userRole && ['Admin', 'Bibliotecario', 'Digitalizador', 'Revisor', 'Restaurador'].includes(userRole);
      
      if (!canSeeAll && book.estado_nombre !== 'Disponible') {
        throw new AppError('No tiene permisos para ver este libro.', 403);
      }
    }

    return this.toBookResponse(book);
  }

  /**
   * CU12 - Modify Book (Modificar Libro)
   * Update book information
   * Only Admin and Bibliotecario can modify
   */
  async updateBook(id: number, dto: UpdateBookDto, editorUserId: number): Promise<BookResponse> {
    // Check if book exists and get current state
    const currentBook = await db.query<{ 
      id: number; 
      titulo: string; 
      autor: string;
      isbn: string;
      fecha: Date;
      numero_paginas: number;
      estanteria: string;
      espacio: string;
      categoria_id: number;
      estado_id: number; 
      estado_nombre: string;
      directorio_pdf: string | null;
      directorio_img: string | null;
    }>(
      `SELECT l.*, e.nombre as estado_nombre 
       FROM libros l 
       LEFT JOIN estados_libro e ON l.estado_id = e.id 
       WHERE l.id = $1`,
      [id]
    );
    
    if (currentBook.rows.length === 0) {
      throw new AppError('Libro no encontrado.', 404);
    }

    const oldBook = currentBook.rows[0];

    // Validate numero_paginas if provided
    if (dto.numero_paginas !== undefined && dto.numero_paginas <= 0) {
      throw new AppError('El número de páginas debe ser un número entero positivo.', 400);
    }

    // Validate category if provided
    if (dto.categoria_id && !(await this.categoryExists(dto.categoria_id))) {
      throw new AppError('La categoría seleccionada no existe.', 400);
    }

    // Validate state if provided and capture new state name
    let newStateName: string | undefined;
    if (dto.estado_id && !(await this.stateExists(dto.estado_id))) {
      throw new AppError('El estado seleccionado no existe.', 400);
    }
    
    if (dto.estado_id && dto.estado_id !== oldBook.estado_id) {
      const stateResult = await db.query<{ nombre: string }>('SELECT nombre FROM estados_libro WHERE id = $1', [dto.estado_id]);
      newStateName = stateResult.rows[0]?.nombre;
    }

    // Track field changes for logging
    const fieldChanges: Array<{ campo: string; valor_anterior: any; valor_nuevo: any }> = [];
    
    // Build update query dynamically and track changes
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (dto.isbn !== undefined && dto.isbn !== oldBook.isbn) {
      fields.push(`isbn = $${paramCount}`);
      values.push(dto.isbn);
      fieldChanges.push({ campo: 'isbn', valor_anterior: oldBook.isbn, valor_nuevo: dto.isbn });
      paramCount++;
    }

    if (dto.titulo !== undefined && dto.titulo !== oldBook.titulo) {
      fields.push(`titulo = $${paramCount}`);
      values.push(dto.titulo);
      fieldChanges.push({ campo: 'titulo', valor_anterior: oldBook.titulo, valor_nuevo: dto.titulo });
      paramCount++;
    }

    if (dto.autor !== undefined && dto.autor !== oldBook.autor) {
      fields.push(`autor = $${paramCount}`);
      values.push(dto.autor);
      fieldChanges.push({ campo: 'autor', valor_anterior: oldBook.autor, valor_nuevo: dto.autor });
      paramCount++;
    }

    if (dto.fecha !== undefined) {
      const oldDate = oldBook.fecha?.toISOString().split('T')[0];
      const newDate = new Date(dto.fecha).toISOString().split('T')[0];
      if (oldDate !== newDate) {
        fields.push(`fecha = $${paramCount}`);
        values.push(dto.fecha);
        fieldChanges.push({ campo: 'fecha', valor_anterior: oldDate, valor_nuevo: newDate });
        paramCount++;
      }
    }

    if (dto.numero_paginas !== undefined && dto.numero_paginas !== oldBook.numero_paginas) {
      fields.push(`numero_paginas = $${paramCount}`);
      values.push(dto.numero_paginas);
      fieldChanges.push({ campo: 'numero_paginas', valor_anterior: oldBook.numero_paginas, valor_nuevo: dto.numero_paginas });
      paramCount++;
    }

    if (dto.estanteria !== undefined && dto.estanteria !== oldBook.estanteria) {
      fields.push(`estanteria = $${paramCount}`);
      values.push(dto.estanteria);
      fieldChanges.push({ campo: 'estanteria', valor_anterior: oldBook.estanteria, valor_nuevo: dto.estanteria });
      paramCount++;
    }

    if (dto.espacio !== undefined && dto.espacio !== oldBook.espacio) {
      fields.push(`espacio = $${paramCount}`);
      values.push(dto.espacio);
      fieldChanges.push({ campo: 'espacio', valor_anterior: oldBook.espacio, valor_nuevo: dto.espacio });
      paramCount++;
    }

    if (dto.categoria_id !== undefined && dto.categoria_id !== oldBook.categoria_id) {
      fields.push(`categoria_id = $${paramCount}`);
      values.push(dto.categoria_id);
      fieldChanges.push({ campo: 'categoria_id', valor_anterior: oldBook.categoria_id, valor_nuevo: dto.categoria_id });
      paramCount++;
    }

    if (dto.estado_id !== undefined) {
      fields.push(`estado_id = $${paramCount}`);
      values.push(dto.estado_id);
      paramCount++;
    }

    if (dto.directorio_pdf !== undefined && dto.directorio_pdf !== oldBook.directorio_pdf) {
      fields.push(`directorio_pdf = $${paramCount}`);
      values.push(dto.directorio_pdf);
      fieldChanges.push({ campo: 'directorio_pdf', valor_anterior: oldBook.directorio_pdf, valor_nuevo: dto.directorio_pdf });
      paramCount++;
    }

    if (dto.directorio_img !== undefined && dto.directorio_img !== oldBook.directorio_img) {
      fields.push(`directorio_img = $${paramCount}`);
      values.push(dto.directorio_img);
      fieldChanges.push({ campo: 'directorio_img', valor_anterior: oldBook.directorio_img, valor_nuevo: dto.directorio_img });
      paramCount++;
    }

    if (fields.length === 0) {
      throw new AppError('No se proporcionaron campos para actualizar.', 400);
    }

    // Add ID to values
    values.push(id);

    const query = `UPDATE libros SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING id`;
    await db.query(query, values);

    // Return updated book with metadata for history logging
    const updatedBook = await this.getBookById(id, undefined, true);
    
    // Return with metadata about changes
    // Priority: state change > field changes
    if (newStateName) {
      return {
        ...updatedBook,
        _stateChanged: {
          libro_id: id,
          libro_titulo: oldBook.titulo,
          estado_anterior: oldBook.estado_nombre,
          estado_nuevo: newStateName
        }
      } as BookResponse;
    } else if (fieldChanges.length > 0) {
      return {
        ...updatedBook,
        _fieldsChanged: {
          libro_id: id,
          libro_titulo: oldBook.titulo,
          cambios: fieldChanges
        }
      } as BookResponse;
    }
    
    return updatedBook;
  }

  /**
   * CU13 - Deactivate Book (Desactivar Libro)
   * Soft delete - changes state to inactive or removes from catalog
   * Only Admin and Bibliotecario can deactivate
   */
  async deactivateBook(id: number, deactivatorUserId: number): Promise<void> {
    // Check if book exists
    const bookCheck = await db.query('SELECT id FROM libros WHERE id = $1', [id]);
    if (bookCheck.rows.length === 0) {
      throw new AppError('Libro no encontrado.', 404);
    }

    // For now, we'll just delete the book (can implement soft delete later)
    await db.query('DELETE FROM libros WHERE id = $1', [id]);

    // TODO: Log to historial
    // await writeToHistorial(deactivatorUserId, accionDesactivar.id, ttLibro.id, id);
  }

  /**
   * Get all book states
   */
  async getAllStates(): Promise<Array<{ id: number; nombre: string; descripcion: string; orden: number }>> {
    const result = await db.query<{ id: number; nombre: string; descripcion: string; orden: number }>(
      'SELECT id, nombre, descripcion, orden FROM estados_libro ORDER BY orden ASC'
    );
    return result.rows;
  }

  /**
   * Get all categories
   */
  async getAllCategories(): Promise<Array<{ id: number; nombre: string; descripcion: string }>> {
    const result = await db.query<{ id: number; nombre: string; descripcion: string }>(
      'SELECT id, nombre, descripcion FROM categoria ORDER BY nombre ASC'
    );
    return result.rows;
  }

  /**
   * CU25 - Create Category
   */
  async createCategory(nombre: string, descripcion: string, creatorUserId: number): Promise<{ id: number; nombre: string; descripcion: string }> {
    if (!nombre) {
      throw new AppError('El nombre de la categoría es obligatorio.', 400);
    }

    // Check if category already exists
    const existing = await db.query('SELECT id FROM categoria WHERE nombre = $1', [nombre]);
    if (existing.rows.length > 0) {
      throw new AppError('Ya existe una categoría con ese nombre.', 409);
    }

    const result = await db.query<{ id: number; nombre: string; descripcion: string }>(
      'INSERT INTO categoria (nombre, descripcion) VALUES ($1, $2) RETURNING *',
      [nombre, descripcion || '']
    );

    // TODO: Log to historial

    return result.rows[0];
  }

// Assuming this is inside your service class (e.g., CategoriesService)

// ... imports (AppError, db, etc.)

/**
 Update Category
 */
async updateCategory(
  id: number,
  nombre?: string, 
  descripcion?: string, 

): Promise<{ id: number; nombre: string; descripcion: string }> {
  // 1. Validation and Existence Check
  if (!id) {
    throw new AppError('El ID de la categoría es obligatorio para la actualización.', 400);
  }

  // Fetch existing category to ensure it exists and get current values
  const existing = await db.query<{ id: number; nombre: string; descripcion: string }>(
    'SELECT id, nombre, descripcion FROM categoria WHERE id = $1', 
    [id]
  );
  
  if (existing.rows.length === 0) {
    throw new AppError('Categoría no encontrada.', 404);
  }
  
  const currentCategory = existing.rows[0];

  // Determine which values to use: new value if provided, otherwise the current value
  const newNombre = nombre !== undefined ? nombre.trim() : currentCategory.nombre;
  const newDescripcion = descripcion !== undefined ? descripcion.trim() : currentCategory.descripcion;

  // 2. Check for Duplicate Name (if name is being updated)
  if (newNombre && newNombre !== currentCategory.nombre) {
    const nameCheck = await db.query('SELECT id FROM categoria WHERE nombre = $1 AND id <> $2', [newNombre, id]);
    if (nameCheck.rows.length > 0) {
      throw new AppError('Ya existe otra categoría con el nombre proporcionado.', 409);
    }
  }

  // 3. Database Update
  const result = await db.query<{ id: number; nombre: string; descripcion: string }>(
    'UPDATE categoria SET nombre = $1, descripcion = $2 WHERE id = $3 RETURNING *',
    [newNombre, newDescripcion || '', id] // Use the new/current values
  );

  if (result.rows.length === 0) {
    // Should not happen if the existence check passed, but good for safety
    throw new AppError('Error al actualizar la categoría. La categoría podría no existir.', 500);
  }

  // TODO: Log to historial using modifierUserId

  return result.rows[0];
}
async getBookCoverPath(id: number): Promise<string> {
    const result = await db.query<{ directorio_img: string }>(
        'SELECT directorio_img FROM libros WHERE id = $1',
        [id]
    );

    if (result.rows.length === 0) {
        throw new AppError('Libro no encontrado.', 404);
    }
    
    const coverPath = result.rows[0].directorio_img;
    
    if (!coverPath) {
        // If the book exists but the path is NULL/empty in the DB
        throw new AppError('Portada no disponible para este libro.', 404);
    }
    
    return coverPath;
}
}


export const booksService = new BooksService();
