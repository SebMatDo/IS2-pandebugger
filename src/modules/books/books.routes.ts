import { Router } from 'express';
import { BooksController } from './books.controller';

const router = Router();
const booksController = new BooksController();

router.get('/', (req, res, next) => booksController.getAll(req, res, next));
router.get('/search', (req, res, next) => booksController.search(req, res, next));
router.get('/:id', (req, res, next) => booksController.getById(req, res, next));
router.post('/', (req, res, next) => booksController.create(req, res, next));
router.put('/:id', (req, res, next) => booksController.update(req, res, next));
router.delete('/:id', (req, res, next) => booksController.delete(req, res, next));

export default router;
