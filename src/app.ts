import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import config from './config';
import { requestLogger } from './shared/middleware/requestLogger';
import { errorHandler, notFoundHandler } from './shared/middleware/errorHandler';
import healthRoutes from './modules/health/health.routes';
import booksRoutes from './modules/books/books.routes';
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';

export const createApp = (): Application => {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors({ origin: config.cors.origin }));

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Compression middleware
  app.use(compression());

  // Request logging
  app.use(requestLogger);

  // Routes
  app.use(config.apiPrefix, healthRoutes);
  app.use(`${config.apiPrefix}/books`, booksRoutes);
  app.use(`${config.apiPrefix}/auth`, authRoutes);
  app.use(`${config.apiPrefix}/users`, usersRoutes);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
