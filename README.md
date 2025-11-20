# IS2 Pandebugger - Backend API

A modular monolith backend API built with Express.js and TypeScript, containerized with Docker and ready for AWS deployment.

This is an educational project made in Node.js, React and SQL. The aim of this project is to digitalize any physical book into a database that enables lectors to search those books or information.

## 🏗️ Architecture

This project follows a **modular monolith** architecture where code is organized into independent modules, each with its own:
- **Routes**: API endpoint definitions
- **Controllers**: Request/response handling
- **Services**: Business logic
- **Types**: TypeScript interfaces and types

### Project Structure

```
src/
├── config/              # Application configuration
│   └── index.ts         # Environment variables and config loader
├── modules/             # Feature modules
│   ├── health/          # Health check endpoints
│   │   ├── health.controller.ts
│   │   └── health.routes.ts
│   └── books/           # Books module (example)
│       ├── books.controller.ts
│       ├── books.service.ts
│       ├── books.routes.ts
│       └── books.types.ts
├── shared/              # Shared utilities and middleware
│   ├── middleware/      # Express middleware
│   │   ├── errorHandler.ts
│   │   ├── logger.ts
│   │   └── requestLogger.ts
│   └── utils/           # Utility functions
│       └── response.ts  # Standard API response formatters
├── app.ts               # Express app setup
└── server.ts            # Server entry point
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker and Docker Compose (optional, for containerized development)

### Local Development (Without Docker)

1. **Install dependencies:**
   ```sh
   npm install
   ```

2. **Create environment file:**
   ```sh
   cp .env.example .env
   ```

3. **Start development server:**
   ```sh
   npm run dev
   ```

The API will be available at `http://localhost:3000/api/v1`

### Local Development (With Docker)

1. **Create environment file:**
   ```sh
   cp .env.example .env
   ```

2. **Start all services:**
   ```sh
   docker compose up --build
   ```

This starts:
- Express API at `http://localhost:3000`
- PostgreSQL at `localhost:5432`
- pgAdmin at `http://localhost:5050`

3. **View logs:**
   ```sh
   docker compose logs -f app
   ```

4. **Stop services:**
   ```sh
   docker compose down
   ```

## 📦 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run production build
- `npm run lint` - Lint code with ESLint
- `npm run format` - Format code with Prettier

## 🐳 Docker

### Development
- **Dockerfile:** `Dockerfile.dev`
- **Compose:** `docker-compose.yml`
- Hot reloading enabled via volume mounts

### Production
- **Dockerfile:** `Dockerfile` (multi-stage build)
- **Compose:** `docker-compose.prod.yml`
- Optimized image with minimal attack surface

**Build production image:**
```sh
docker build -t pandebugger-api:latest .
```

**Run production container:**
```sh
docker run -p 3000:3000 --env-file .env.production pandebugger-api:latest
```

## 🔌 API Endpoints

### Health Checks
- `GET /api/v1/health` - Basic health check
- `GET /api/v1/health/readiness` - Readiness probe (checks database connectivity)

### Authentication (CU06 Login - ✅ Implemented)
- `POST /api/v1/auth/login` - User login with JWT token
- `GET /api/v1/auth/me` - Get current user (requires authentication)
- `POST /api/v1/auth/change-password` - Change password (CU20 - ✅ Implemented)
- `POST /api/v1/auth/restore-password` - Password reset (CU21 - TODO)

**Login Example:**
```sh
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@ejemplo.com",
    "password": "MiContraseña123!"
  }'
```

### Books (Example Module)
- `GET /api/v1/books` - List all books
- `GET /api/v1/books/:id` - Get book by ID
- `GET /api/v1/books/search?q=query` - Search books
- `POST /api/v1/books` - Create new book
- `PUT /api/v1/books/:id` - Update book
- `DELETE /api/v1/books/:id` - Delete book

**Example Request:**
```sh
curl -X POST http://localhost:3000/api/v1/books \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Clean Code",
    "author": "Robert C. Martin",
    "isbn": "978-0132350884",
    "publishedYear": 2008
  }'
```

## ☁️ AWS Deployment

### Architecture Overview

**Recommended AWS services:**
- **ECS Fargate**: Serverless container orchestration
- **RDS (PostgreSQL)**: Managed database
- **Application Load Balancer (ALB)**: Traffic distribution
- **ECR**: Container registry
- **Secrets Manager**: Secure credential storage
- **CloudWatch**: Logging and monitoring
- **VPC**: Network isolation

### Deployment Steps

#### 1. Build and Push Docker Image to ECR

```sh
# Authenticate Docker to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Create ECR repository
aws ecr create-repository --repository-name pandebugger-api --region us-east-1

# Build and tag image
docker build -t pandebugger-api:latest .
docker tag pandebugger-api:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/pandebugger-api:latest

# Push to ECR
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/pandebugger-api:latest
```

#### 2. Set Up RDS Database

```sh
# Create RDS PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier pandebugger-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password <secure-password> \
  --allocated-storage 20 \
  --vpc-security-group-ids <security-group-id> \
  --db-subnet-group-name <subnet-group> \
  --publicly-accessible false
```

#### 3. Store Secrets in AWS Secrets Manager

```sh
aws secretsmanager create-secret \
  --name pandebugger/db-credentials \
  --secret-string '{
    "host":"<rds-endpoint>",
    "port":5432,
    "username":"admin",
    "password":"<secure-password>",
    "database":"pandebugger"
  }'
```

#### 4. Create ECS Task Definition

Create `task-definition.json` and register with:
```sh
aws ecs register-task-definition --cli-input-json file://task-definition.json
```

#### 5. Deploy to ECS

```sh
aws ecs create-cluster --cluster-name pandebugger-cluster
aws ecs create-service --cluster pandebugger-cluster --service-name pandebugger-api ...
```

See full deployment instructions in the AWS documentation section above.

## 🧪 Testing

The API includes health check endpoints for monitoring:

```sh
# Health check
curl http://localhost:3000/api/v1/health

# Readiness check
curl http://localhost:3000/api/v1/health/readiness
```

## 📝 Adding New Modules

To add a new module (e.g., `users`):

1. Create module directory:
   ```
   src/modules/users/
   ├── users.types.ts
   ├── users.service.ts
   ├── users.controller.ts
   └── users.routes.ts
   ```

2. Register routes in `src/app.ts`:
   ```typescript
   import usersRoutes from './modules/users/users.routes';
   app.use(`${config.apiPrefix}/users`, usersRoutes);
   ```

## 🔧 Configuration

Environment variables are loaded from `.env` file. See `.env.example` for all available options.

## 📄 License

MIT

## 👥 Contributing

This is an educational project for IS2 course at UNAL.

---

**Need help?** Check the [issues page](https://github.com/SebMatDo/IS2-pandebugger/issues) or create a new issue.
