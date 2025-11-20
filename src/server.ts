import { createApp } from './app';
import config from './config';
import { logger } from './shared/middleware/logger';
import { db } from './shared/database/connection';
import { lookupCache } from './shared/repositories/lookup.cache';

async function startServer() {
  try {
    // Test database connection
    const isConnected = await db.testConnection();
    if (!isConnected) {
      logger.error('Failed to connect to database');
      process.exit(1);
    }

    // Initialize lookup cache
    await lookupCache.initialize();
    logger.info('Lookup cache initialized');

    // Create Express app
    const app = createApp();

    const server = app.listen(config.port, () => {
      logger.info(`🚀 Server running on port ${config.port} in ${config.env} mode`);
      logger.info(`📝 API prefix: ${config.apiPrefix}`);
      logger.info(`🔗 Health check: http://localhost:${config.port}${config.apiPrefix}/health`);
      logger.info(`🔐 Login: http://localhost:${config.port}${config.apiPrefix}/auth/login`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
          await db.close();
          logger.info('Database connections closed');
        } catch (error) {
          logger.error('Error closing database connections', { error });
        }
        
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return server;
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Start the server
startServer();

export default startServer;
