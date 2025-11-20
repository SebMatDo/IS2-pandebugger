export interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  publishedYear?: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBookDto {
  title: string;
  author: string;
  isbn?: string;
  publishedYear?: number;
  description?: string;
}

export interface UpdateBookDto {
  title?: string;
  author?: string;
  isbn?: string;
  publishedYear?: number;
  description?: string;
}
