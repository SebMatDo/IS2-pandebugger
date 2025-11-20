import { Book, CreateBookDto, UpdateBookDto } from './books.types';
import { AppError } from '../../shared/middleware/errorHandler';

// Mock data store (replace with actual database layer)
class BooksService {
  private books: Book[] = [];

  async findAll(): Promise<Book[]> {
    return this.books;
  }

  async findById(id: string): Promise<Book> {
    const book = this.books.find((b) => b.id === id);
    if (!book) {
      throw new AppError('Book not found', 404);
    }
    return book;
  }

  async create(dto: CreateBookDto): Promise<Book> {
    const newBook: Book = {
      id: Date.now().toString(), // Simple ID generation, use UUID in production
      ...dto,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.books.push(newBook);
    return newBook;
  }

  async update(id: string, dto: UpdateBookDto): Promise<Book> {
    const index = this.books.findIndex((b) => b.id === id);
    if (index === -1) {
      throw new AppError('Book not found', 404);
    }

    this.books[index] = {
      ...this.books[index],
      ...dto,
      updatedAt: new Date(),
    };

    return this.books[index];
  }

  async delete(id: string): Promise<void> {
    const index = this.books.findIndex((b) => b.id === id);
    if (index === -1) {
      throw new AppError('Book not found', 404);
    }
    this.books.splice(index, 1);
  }

  async search(query: string): Promise<Book[]> {
    const lowerQuery = query.toLowerCase();
    return this.books.filter(
      (book) =>
        book.title.toLowerCase().includes(lowerQuery) ||
        book.author.toLowerCase().includes(lowerQuery) ||
        book.description?.toLowerCase().includes(lowerQuery)
    );
  }
}

export const booksService = new BooksService();
