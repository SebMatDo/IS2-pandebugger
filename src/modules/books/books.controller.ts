import { Response } from 'express';
import { booksService } from './books.service';
import { BookRequest, CreateBookDto, UpdateBookDto } from './books.types';
import { AppError } from '../../shared/middleware/errorHandler';

export class BooksController {
  /**
   * POST /api/v1/books - Create book (CU01)
   */
  async createBook(req: BookRequest, res: Response): Promise<void> {
    const dto: CreateBookDto = req.body;
    const userId = req.user!.userId;

    const book = await booksService.createBook(dto, userId);

    res.status(201).json({
      success: true,
      message: 'Libro registrado exitosamente.',
      data: book,
    });
  }

  /**
   * GET /api/v1/books - List/search books (CU17)
   * Public endpoint with optional authentication
   */
  async getAllBooks(req: BookRequest, res: Response): Promise<void> {
    const filters = {
      estado_id: req.query.estado_id ? Number(req.query.estado_id) : undefined,
      categoria_id: req.query.categoria_id ? Number(req.query.categoria_id) : undefined,
      titulo: req.query.titulo as string | undefined,
      autor: req.query.autor as string | undefined,
      isbn: req.query.isbn as string | undefined,
    };

    const userRole = req.user?.rolNombre;

    const books = await booksService.getAllBooks(filters, userRole);

    res.status(200).json({
      success: true,
      data: books,
      count: books.length,
    });
  }

  /**
   * GET /api/v1/books/:id - Get book by ID (CU22)
   * Public endpoint with optional authentication
   */
  async getBookById(req: BookRequest, res: Response): Promise<void> {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      throw new AppError('ID de libro inválido.', 400);
    }

    const userRole = req.user?.rolNombre;

    const book = await booksService.getBookById(id, userRole);

    res.status(200).json({
      success: true,
      data: book,
    });
  }

  /**
   * PUT /api/v1/books/:id - Update book (CU12)
   */
  async updateBook(req: BookRequest, res: Response): Promise<void> {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      throw new AppError('ID de libro inválido.', 400);
    }

    const dto: UpdateBookDto = req.body;
    const userId = req.user!.userId;

    const book = await booksService.updateBook(id, dto, userId);

    res.status(200).json({
      success: true,
      message: 'Libro actualizado exitosamente.',
      data: book,
    });
  }

  /**
   * DELETE /api/v1/books/:id - Deactivate book (CU13)
   */
  async deactivateBook(req: BookRequest, res: Response): Promise<void> {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      throw new AppError('ID de libro inválido.', 400);
    }

    const userId = req.user!.userId;

    await booksService.deactivateBook(id, userId);

    res.status(200).json({
      success: true,
      message: 'Libro desactivado exitosamente.',
    });
  }

  /**
   * GET /api/v1/books/states - Get all book states
   */
  async getAllStates(req: BookRequest, res: Response): Promise<void> {
    const states = await booksService.getAllStates();

    res.status(200).json({
      success: true,
      data: states,
    });
  }

  /**
   * GET /api/v1/books/categories - Get all categories
   */
  async getAllCategories(req: BookRequest, res: Response): Promise<void> {
    const categories = await booksService.getAllCategories();

    res.status(200).json({
      success: true,
      data: categories,
    });
  }

  /**
   * POST /api/v1/books/categories - Create category (CU25)
   */
  async createCategory(req: BookRequest, res: Response): Promise<void> {
    const { nombre, descripcion } = req.body;
    const userId = req.user!.userId;

    const category = await booksService.createCategory(nombre, descripcion, userId);

    res.status(201).json({
      success: true,
      message: 'Categoría creada exitosamente.',
      data: category,
    });
  }
}

export const booksController = new BooksController();
