import { Request, Response } from 'express';
import { createSuccessResponse } from '../../shared/utils/response';
import { db } from '../../shared/database/connection';

export class HealthController {
  async check(req: Request, res: Response): Promise<void> {
    const healthcheck = {
      uptime: process.uptime(),
      message: 'OK',
      timestamp: Date.now(),
      environment: process.env.NODE_ENV || 'development',
    };

    res.status(200).json(createSuccessResponse(healthcheck));
  }

  async readiness(req: Request, res: Response): Promise<void> {
    try {
      // Check database connectivity
      const dbConnected = await db.testConnection();

      const ready = {
        database: dbConnected ? 'connected' : 'disconnected',
        cache: 'connected',
        status: dbConnected ? 'ready' : 'not ready',
      };

      const statusCode = dbConnected ? 200 : 503;
      res.status(statusCode).json(createSuccessResponse(ready));
    } catch (error) {
      res.status(503).json({
        status: 'error',
        message: 'Service not ready',
      });
    }
  }
}
