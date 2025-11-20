# Quick Start Guide

## 🚀 First Time Setup

### Option 1: Local Development (requires Node.js installed)

1. **Install Node.js** (if not already installed):
   - Download from https://nodejs.org/ (LTS version 18 or higher)
   - Verify installation: `node --version` and `npm --version`

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Create your environment file:**
   ```sh
   cp .env.example .env
   ```
   Edit `.env` with your local settings.

4. **Start development server:**
   ```sh
   npm run dev
   ```

5. **Test the API:**
   ```sh
   curl http://localhost:3000/api/v1/health
   ```

### Option 2: Docker Development (requires Docker installed)

1. **Install Docker Desktop:**
   - Download from https://www.docker.com/products/docker-desktop

2. **Create environment file:**
   ```sh
   cp .env.example .env
   ```

3. **Start with Docker Compose:**
   ```sh
   docker compose up --build
   ```

4. **Access the services:**
   - API: http://localhost:3000/api/v1/health
   - PostgreSQL: localhost:5432
   - pgAdmin: http://localhost:5050 (admin@pandebugger.com / admin)

5. **Stop services:**
   ```sh
   docker compose down
   ```

## 📝 Next Steps

1. **Test the Books API:**
   ```sh
   # Create a book
   curl -X POST http://localhost:3000/api/v1/books \
     -H "Content-Type: application/json" \
     -d '{"title":"Test Book","author":"Test Author"}'

   # Get all books
   curl http://localhost:3000/api/v1/books

   # Search books
   curl "http://localhost:3000/api/v1/books/search?q=Test"
   ```

2. **Add database integration:**
   - Install a PostgreSQL client library (e.g., `pg` or use an ORM like Prisma/TypeORM)
   - Update `books.service.ts` to use real database instead of in-memory array
   - Add migrations

3. **Add authentication:**
   - Create an `auth` module with JWT
   - Add authentication middleware
   - Protect routes that need authentication

4. **Add validation:**
   - Install `express-validator` or `joi`
   - Add validation middleware to routes
   - Validate request bodies and params

## 🔍 Project Structure Overview

```
IS2-pandebugger/
├── src/
│   ├── config/           # Configuration (env vars)
│   ├── modules/          # Feature modules
│   │   ├── health/       # Health check endpoints
│   │   └── books/        # Books CRUD (example)
│   ├── shared/           # Shared code
│   │   ├── middleware/   # Express middleware
│   │   └── utils/        # Utility functions
│   ├── app.ts            # Express app setup
│   └── server.ts         # Server entry point
├── Dockerfile            # Production Docker image
├── Dockerfile.dev        # Development Docker image
├── docker-compose.yml    # Dev environment setup
└── tsconfig.json         # TypeScript configuration
```

## 🐛 Troubleshooting

### "npm: command not found"
- Install Node.js from https://nodejs.org/
- Or use Docker (no Node.js installation needed)

### Port 3000 already in use
- Change PORT in `.env` file
- Or stop the other process: `lsof -ti:3000 | xargs kill -9`

### Docker permission denied
- On Linux, add user to docker group: `sudo usermod -aG docker $USER`
- Log out and back in

### TypeScript errors
- Run `npm install` to ensure all dependencies are installed
- Check `tsconfig.json` is in the project root

## 📚 Learn More

- [Express.js Documentation](https://expressjs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
