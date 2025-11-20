import config from '../../config';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private level: string;

  constructor() {
    this.level = config.logging.level;
  }

  private log(level: LogLevel, message: string, meta?: any): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(meta && { meta }),
    };

    // In production, you might want to use a proper logging library like Winston or Pino
    // and send logs to CloudWatch
    if (config.env === 'production') {
      console.log(JSON.stringify(logEntry));
    } else {
      console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`, meta || '');
    }
  }

  debug(message: string, meta?: any): void {
    this.log('debug', message, meta);
  }

  info(message: string, meta?: any): void {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: any): void {
    this.log('warn', message, meta);
  }

  error(message: string, meta?: any): void {
    this.log('error', message, meta);
  }
}

export const logger = new Logger();
