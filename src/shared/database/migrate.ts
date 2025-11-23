import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import config from '../../config';
import { logger } from '../middleware/logger';

/**
 * Database Migration Runner
 * Runs SQL migration files in order
 * Tracks executed migrations in a migrations table
 */

interface MigrationRecord {
  id: number;
  name: string;
  executed_at: Date;
}

class MigrationRunner {
  private pool: Pool;
  private migrationsPath: string;
  private seedsPath: string;

  constructor() {
    this.pool = new Pool({
      host: config.db.host,
      port: config.db.port,
      database: config.db.name,
      user: config.db.user,
      password: config.db.password,
    });

    this.migrationsPath = path.join(__dirname, 'migrations');
    this.seedsPath = path.join(__dirname, 'seeds');
  }

  /**
   * Create migrations tracking table if it doesn't exist
   */
  private async ensureMigrationsTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await this.pool.query(query);
    logger.info('Migrations tracking table ready');
  }

  /**
   * Get list of already executed migrations
   */
  private async getExecutedMigrations(): Promise<string[]> {
    const result = await this.pool.query<MigrationRecord>(
      'SELECT name FROM schema_migrations ORDER BY id'
    );
    return result.rows.map(row => row.name);
  }

  /**
   * Get list of migration files from filesystem
   */
  private getMigrationFiles(): string[] {
    if (!fs.existsSync(this.migrationsPath)) {
      logger.warn(`Migrations directory not found: ${this.migrationsPath}`);
      return [];
    }

    return fs.readdirSync(this.migrationsPath)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Ensures migrations run in order (001_, 002_, etc.)
  }

  /**
   * Get list of seed files from filesystem
   */
  private getSeedFiles(): string[] {
    if (!fs.existsSync(this.seedsPath)) {
      logger.warn(`Seeds directory not found: ${this.seedsPath}`);
      return [];
    }

    return fs.readdirSync(this.seedsPath)
      .filter(file => file.endsWith('.sql'))
      .sort();
  }

  /**
   * Execute a single migration file
   */
  private async executeMigration(filename: string): Promise<void> {
    const filePath = path.join(this.migrationsPath, filename);
    const sql = fs.readFileSync(filePath, 'utf-8');

    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Execute migration SQL
      await client.query(sql);
      
      // Record migration as executed
      await client.query(
        'INSERT INTO schema_migrations (name) VALUES ($1)',
        [filename]
      );
      
      await client.query('COMMIT');
      logger.info(`✓ Migration executed: ${filename}`);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`✗ Migration failed: ${filename}`, { error });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Execute a single seed file
   */
  private async executeSeed(filename: string): Promise<void> {
    const filePath = path.join(this.seedsPath, filename);
    const sql = fs.readFileSync(filePath, 'utf-8');

    try {
      await this.pool.query(sql);
      logger.info(`✓ Seed executed: ${filename}`);
    } catch (error) {
      logger.error(`✗ Seed failed: ${filename}`, { error });
      throw error;
    }
  }

  /**
   * Run all pending migrations
   */
  async runMigrations(): Promise<void> {
    try {
      logger.info('Starting database migrations...');
      
      await this.ensureMigrationsTable();
      
      const executedMigrations = await this.getExecutedMigrations();
      const migrationFiles = this.getMigrationFiles();
      
      const pendingMigrations = migrationFiles.filter(
        file => !executedMigrations.includes(file)
      );

      if (pendingMigrations.length === 0) {
        logger.info('No pending migrations');
        return;
      }

      logger.info(`Found ${pendingMigrations.length} pending migration(s)`);

      for (const migration of pendingMigrations) {
        await this.executeMigration(migration);
      }

      logger.info('All migrations completed successfully');
    } catch (error) {
      logger.error('Migration process failed', { error });
      throw error;
    }
  }

  /**
   * Run all seed files (for development/testing)
   */
  async runSeeds(): Promise<void> {
    try {
      logger.info('Starting database seeding...');
      
      const seedFiles = this.getSeedFiles();

      if (seedFiles.length === 0) {
        logger.info('No seed files found');
        return;
      }

      logger.info(`Found ${seedFiles.length} seed file(s)`);

      for (const seed of seedFiles) {
        await this.executeSeed(seed);
      }

      logger.info('All seeds completed successfully');
    } catch (error) {
      logger.error('Seeding process failed', { error });
      throw error;
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

// CLI execution
if (require.main === module) {
  const runner = new MigrationRunner();
  const command = process.argv[2];

  (async () => {
    try {
      if (command === 'migrate') {
        await runner.runMigrations();
      } else if (command === 'seed') {
        await runner.runSeeds();
      } else if (command === 'reset') {
        // Run migrations then seeds
        await runner.runMigrations();
        await runner.runSeeds();
      } else {
        console.log('Usage: ts-node migrate.ts [migrate|seed|reset]');
        process.exit(1);
      }
      
      await runner.close();
      process.exit(0);
    } catch (error) {
      console.error('Migration runner failed:', error);
      await runner.close();
      process.exit(1);
    }
  })();
}

export default MigrationRunner;
