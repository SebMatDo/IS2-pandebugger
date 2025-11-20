import { Request, Response, NextFunction } from 'express';
import { booksService } from './books.service';
import { createSuccessResponse } from '../../shared/utils/response';
import { CreateBookDto, UpdateBookDto } from './books.types';

export class BooksController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const books = await booksService.findAll();
      res.status(200).json(createSuccessResponse(books));
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const book = await booksService.findById(req.params.id);
      res.status(200).json(createSuccessResponse(book));
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto: CreateBookDto = req.body;
      const book = await booksService.create(dto);
      res.status(201).json(createSuccessResponse(book, 'Book created successfully'));
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto: UpdateBookDto = req.body;
      const book = await booksService.update(req.params.id, dto);
      res.status(200).json(createSuccessResponse(book, 'Book updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await booksService.delete(req.params.id);
      res.status(200).json(createSuccessResponse(null, 'Book deleted successfully'));
    } catch (error) {
      next(error);
    }
  }

  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query.q as string;
      if (!query) {
        res.status(400).json({ status: 'error', message: 'Query parameter "q" is required' });
        return;
      }
      const books = await booksService.search(query);
      res.status(200).json(createSuccessResponse(books));
    } catch (error) {
      next(error);
    }
  }
}
