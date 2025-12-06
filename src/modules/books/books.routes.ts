import { Router } from 'express';
import { asyncHandler } from '../../shared/middleware/errorHandler';
import { authenticate, requireRole, optionalAuthenticate } from '../auth/auth.middleware';
import { booksController } from './books.controller';

const router = Router();

/**
 * IMPORTANT: Specific routes must come BEFORE parameterized routes
 * Order matters in Express routing!
 */

// GET /api/v1/books/states - Get all book states
router.get(
  '/states',
  asyncHandler(booksController.getAllStates.bind(booksController))
);

// GET /api/v1/books/categories - Get all categories
router.get(
  '/categories',
  asyncHandler(booksController.getAllCategories.bind(booksController))
);

// POST /api/v1/books/categories - Create category (CU25)
// Only Admin and Bibliotecario can create categories
router.post(
  '/categories',
  authenticate,
  requireRole(['Admin', 'Bibliotecario']),
  asyncHandler(booksController.createCategory.bind(booksController))
);

/**
 * PUT /api/v1/books/categories/:id - Update category
 * Only Admin and Bibliotecario can modify categories
 */
router.put(
  '/categories/:id',
  authenticate,
  requireRole(['Admin', 'Bibliotecario']),
  asyncHandler(booksController.updateCategory.bind(booksController))
);

/**
 * Protected routes
 * Only authenticated users with specific roles can access
 */

// POST /api/v1/books - Create book (CU01)
// Only Admin and Bibliotecario can create books
router.post(
  '/',
  authenticate,
  requireRole(['Admin', 'Bibliotecario']),
  asyncHandler(booksController.createBook.bind(booksController))
);

/**
 * Public routes (with optional authentication)
 * Anyone can access published books
 * Authenticated users with roles can access all books
 */

// GET /api/v1/books - List/search books (CU17)
router.get(
  '/',
  optionalAuthenticate,
  asyncHandler(booksController.getAllBooks.bind(booksController))
);

// GET /api/v1/books/:id - Get book by ID (CU22)
router.get(
  '/:id',
  optionalAuthenticate,
  asyncHandler(booksController.getBookById.bind(booksController))
);

// PUT /api/v1/books/:id - Update book (CU12)
// Only Admin and Bibliotecario can update books
router.put(
  '/:id',
  authenticate,
  requireRole(['Admin', 'Bibliotecario']),
  asyncHandler(booksController.updateBook.bind(booksController))
);

// DELETE /api/v1/books/:id - Deactivate book (CU13)
// Only Admin and Bibliotecario can deactivate books
router.delete(
  '/:id',
  authenticate,
  requireRole(['Admin', 'Bibliotecario']),
  asyncHandler(booksController.deactivateBook.bind(booksController))
);

/**
 * GET /api/v1/books/:id/cover
 * Serves the book cover image file.
 */
router.get(
    '/:id/cover', // Path: /api/v1/books/:id/cover
    authenticate,
    asyncHandler(booksController.getBookCover.bind(booksController))
);

export default router;
