# Database Module

This module contains database connection, migration, and seed management.

## 📚 **Full Documentation**

For comprehensive database documentation including schema, migrations, seeds, pgAdmin usage, and SQL queries, see:

👉 **[Database Guide](../../../docs/DATABASE_GUIDE.md)**

## Quick Reference

### Directory Structure

```
src/shared/database/
├── connection.ts          # PostgreSQL connection pool
├── migrate.ts             # Migration runner (TypeScript)
├── migrations/            # SQL schema migrations
│   ├── 001_initial_schema.sql
│   └── 002_seed_reference_data.sql
└── seeds/                 # Test/development data
    ├── 001_seed_test_users.sql
    ├── 002_seed_test_books.sql
    └── 003_seed_test_tasks.sql
```

### Running Migrations

```bash
# Run all migrations
npm run db:migrate

# Load test data
npm run db:seed

# Reset database (migrate + seed)
npm run db:reset
```

### Manual Execution

```bash
# Execute migration directly in Docker container
docker exec -i pandebugger-postgres psql -U pandebugger_user -d pandebugger_dev \
  < src/shared/database/migrations/001_initial_schema.sql

# Execute seed file
docker exec -i pandebugger-postgres psql -U pandebugger_user -d pandebugger_dev \
  < src/shared/database/seeds/001_seed_test_users.sql
```

## Database Schema

9 tables:
- `usuarios` - System users
- `roles` - User roles
- `libros` - Books catalog
- `estados_libro` - Book workflow states
- `categoria` - Book categories
- `tareas` - Assigned tasks
- `historial` - Audit log
- `accion` - Action types
- `target_type` - Audit target types

**For detailed schema diagrams and relationships**, see [Database Guide](../../../docs/DATABASE_GUIDE.md).

## Connection Info

**Local Development:**
- Host: `localhost` (from host) or `postgres` (from container)
- Port: `5432`
- Database: `pandebugger_dev`
- User: `pandebugger_user`
- Password: `pandebugger_local_pass_2024`

**pgAdmin Access:**
- URL: http://localhost:5050
- Email: `admin@pandebugger.com`
- Password: `admin`

---

For complete documentation including troubleshooting, backup/restore, and advanced queries, see the **[Database Guide](../../../docs/DATABASE_GUIDE.md)**.

- **Naming**: Use format `NNN_description.sql` (e.g., `001_create_users.sql`)
- **Order**: Files execute alphabetically by filename
- **Tracking**: Executed migrations are recorded in `schema_migrations` table
- **Idempotency**: Use `IF NOT EXISTS` and `ON CONFLICT DO NOTHING` clauses

## Seed Files

- **Purpose**: Populate database with test/development data
- **Environment**: Only run in local/test environments, NEVER in production
- **Content**: Sample users, books, categories, etc.

## Creating New Migrations

1. Create a new file: `003_add_new_table.sql`
2. Write your SQL with proper checks:
   ```sql
   CREATE TABLE IF NOT EXISTS my_table (
       id SERIAL PRIMARY KEY,
       -- ...
   );
   ```
3. Run: `npm run db:migrate`

## Best Practices

- Always use transactions (handled by migration runner)
- Make migrations reversible when possible
- Test migrations on local database first
- Never modify executed migration files
- Keep migrations focused and atomic
- Document complex changes in comments

## Production Deployment

In production (AWS RDS):
1. Run migrations as part of deployment process
2. DO NOT run seed files
3. Use environment-specific credentials
4. Monitor migration execution logs
5. Have rollback plan ready
