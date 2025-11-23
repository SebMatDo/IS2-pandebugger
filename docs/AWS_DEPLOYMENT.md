# AWS Deployment Guide

Complete guide for deploying the Pandebugger backend to AWS using ECS + RDS.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         AWS Cloud                            │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   ECS Cluster                        │  │
│  │                                                      │  │
│  │  ┌────────────────────────────────────────────┐    │  │
│  │  │         ECS Service (Fargate)              │    │  │
│  │  │                                            │    │  │
│  │  │  ┌──────────────┐  ┌──────────────┐      │    │  │
│  │  │  │   Task 1     │  │   Task 2     │      │    │  │
│  │  │  │ (Container)  │  │ (Container)  │      │    │  │
│  │  │  │  Backend API │  │  Backend API │      │    │  │
│  │  │  └──────┬───────┘  └──────┬───────┘      │    │  │
│  │  │         │                  │              │    │  │
│  │  └─────────┼──────────────────┼──────────────┘    │  │
│  │            │                  │                   │  │
│  └────────────┼──────────────────┼───────────────────┘  │
│               │                  │                      │
│  ┌────────────┼──────────────────┼───────────────────┐  │
│  │            │   Load Balancer  │                   │  │
│  │            └──────────┬───────┘                   │  │
│  │                       │                           │  │
│  └───────────────────────┼───────────────────────────┘  │
│                          │                              │
│  ┌───────────────────────┼───────────────────────────┐  │
│  │                       ▼                           │  │
│  │              AWS RDS PostgreSQL                   │  │
│  │         (Production Database)                     │  │
│  │  - Multi-AZ for high availability                 │  │
│  │  - Automated backups                              │  │
│  │  - Encryption at rest                             │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │              ECR (Container Registry)             │  │
│  │  - Stores Docker images                           │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** installed and configured
3. **Docker** installed locally
4. **Domain name** (optional, for custom domain)

## Step-by-Step Deployment

### Step 1: Create RDS PostgreSQL Database

```bash
# 1. Create RDS instance via AWS Console or CLI
aws rds create-db-instance \
  --db-instance-identifier pandebugger-prod \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.5 \
  --master-username admin \
  --master-user-password YOUR_STRONG_PASSWORD \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxx \
  --db-subnet-group-name your-subnet-group \
  --backup-retention-period 7 \
  --publicly-accessible false \
  --storage-encrypted \
  --enable-cloudwatch-logs-exports '["postgresql"]'

# 2. Wait for RDS to be available
aws rds wait db-instance-available --db-instance-identifier pandebugger-prod

# 3. Get RDS endpoint
aws rds describe-db-instances \
  --db-instance-identifier pandebugger-prod \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text
```

**Important RDS Settings:**
- Instance Class: `db.t3.micro` (free tier) or `db.t3.small` (production)
- Storage: Start with 20GB, enable autoscaling
- Multi-AZ: Enable for production high availability
- Backup: Enable automated backups (7-30 days retention)
- Encryption: Always enable
- Public Access: Disable (use VPC only)

### Step 2: Create ECR Repository

```bash
# 1. Create ECR repository
aws ecr create-repository \
  --repository-name pandebugger-api \
  --region us-east-1

# 2. Get repository URI
export ECR_REPO=$(aws ecr describe-repositories \
  --repository-names pandebugger-api \
  --query 'repositories[0].repositoryUri' \
  --output text)

echo "ECR Repository: $ECR_REPO"

# 3. Authenticate Docker to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin $ECR_REPO
```

### Step 3: Build and Push Docker Image

```bash
# 1. Build production Docker image
docker build -t pandebugger-api:latest -f Dockerfile .

# 2. Tag image for ECR
docker tag pandebugger-api:latest $ECR_REPO:latest
docker tag pandebugger-api:latest $ECR_REPO:v1.0.0

# 3. Push to ECR
docker push $ECR_REPO:latest
docker push $ECR_REPO:v1.0.0
```

### Step 4: Store Secrets in AWS Secrets Manager

```bash
# Create secret for database credentials
aws secretsmanager create-secret \
  --name pandebugger/prod/db \
  --description "Production database credentials" \
  --secret-string '{
    "DB_HOST":"pandebugger-prod.xxxxx.us-east-1.rds.amazonaws.com",
    "DB_PORT":"5432",
    "DB_NAME":"pandebugger_prod",
    "DB_USER":"admin",
    "DB_PASSWORD":"YOUR_STRONG_PASSWORD"
  }'

# Create secret for JWT
aws secretsmanager create-secret \
  --name pandebugger/prod/jwt \
  --description "JWT secret for authentication" \
  --secret-string '{
    "JWT_SECRET":"GENERATE_A_LONG_RANDOM_STRING_HERE"
  }'
```

### Step 5: Create ECS Cluster

```bash
# Create ECS cluster (Fargate)
aws ecs create-cluster \
  --cluster-name pandebugger-prod \
  --capacity-providers FARGATE FARGATE_SPOT \
  --region us-east-1
```

### Step 6: Create Task Definition

Create `ecs-task-definition.json`:

```json
{
  "family": "pandebugger-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::YOUR_ACCOUNT_ID:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::YOUR_ACCOUNT_ID:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "pandebugger-api",
      "image": "YOUR_ECR_REPO:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "essential": true,
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "3000"
        },
        {
          "name": "API_PREFIX",
          "value": "/api/v1"
        },
        {
          "name": "LOG_LEVEL",
          "value": "info"
        }
      ],
      "secrets": [
        {
          "name": "DB_HOST",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:pandebugger/prod/db:DB_HOST::"
        },
        {
          "name": "DB_PORT",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:pandebugger/prod/db:DB_PORT::"
        },
        {
          "name": "DB_NAME",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:pandebugger/prod/db:DB_NAME::"
        },
        {
          "name": "DB_USER",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:pandebugger/prod/db:DB_USER::"
        },
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:pandebugger/prod/db:DB_PASSWORD::"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:pandebugger/prod/jwt:JWT_SECRET::"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/pandebugger-api",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

Register the task definition:

```bash
aws ecs register-task-definition --cli-input-json file://ecs-task-definition.json
```

### Step 7: Run Database Migrations

Before deploying the service, run migrations on RDS:

```bash
# Set production environment variables temporarily
export DB_HOST=pandebugger-prod.xxxxx.us-east-1.rds.amazonaws.com
export DB_PORT=5432
export DB_NAME=pandebugger_prod
export DB_USER=admin
export DB_PASSWORD=YOUR_STRONG_PASSWORD

# Run migrations (DO NOT run seeds in production!)
npm run db:migrate

# Verify connection
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT * FROM schema_migrations;"
```

### Step 8: Create Application Load Balancer

```bash
# 1. Create ALB
aws elbv2 create-load-balancer \
  --name pandebugger-alb \
  --subnets subnet-xxxxx subnet-yyyyy \
  --security-groups sg-xxxxx \
  --scheme internet-facing \
  --type application

# 2. Create target group
aws elbv2 create-target-group \
  --name pandebugger-tg \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-xxxxx \
  --target-type ip \
  --health-check-path /api/v1/health \
  --health-check-interval-seconds 30 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3

# 3. Create listener
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...
```

### Step 9: Create ECS Service

```bash
aws ecs create-service \
  --cluster pandebugger-prod \
  --service-name pandebugger-api-service \
  --task-definition pandebugger-api:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --platform-version LATEST \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx,subnet-yyyyy],securityGroups=[sg-xxxxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=pandebugger-api,containerPort=3000" \
  --health-check-grace-period-seconds 60
```

### Step 10: Enable Auto Scaling (Optional)

```bash
# Register scalable target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/pandebugger-prod/pandebugger-api-service \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10

# Create scaling policy (CPU-based)
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --resource-id service/pandebugger-prod/pandebugger-api-service \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-name cpu-scaling \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://scaling-policy.json
```

## Continuous Deployment

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS ECS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build and push Docker image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: pandebugger-api
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
      
      - name: Update ECS service
        run: |
          aws ecs update-service \
            --cluster pandebugger-prod \
            --service pandebugger-api-service \
            --force-new-deployment
```

## Monitoring and Logs

### CloudWatch Logs

```bash
# View logs
aws logs tail /ecs/pandebugger-api --follow

# Filter errors
aws logs filter-log-events \
  --log-group-name /ecs/pandebugger-api \
  --filter-pattern "ERROR"
```

### Metrics

Monitor in CloudWatch:
- CPU Utilization
- Memory Utilization
- Request Count
- Response Time
- Database Connections

## Cost Estimation (Monthly)

- **ECS Fargate**: ~$30-50 (2 tasks, 0.5 vCPU, 1GB RAM)
- **RDS PostgreSQL**: ~$15-30 (db.t3.micro, 20GB storage)
- **ALB**: ~$16-20
- **Data Transfer**: Variable
- **Total**: ~$60-100/month

## Security Best Practices

1. ✅ Use Secrets Manager for all credentials
2. ✅ Enable RDS encryption at rest
3. ✅ Use VPC with private subnets for RDS
4. ✅ Enable SSL/TLS for database connections
5. ✅ Use IAM roles instead of access keys
6. ✅ Enable CloudWatch logging
7. ✅ Regular security updates for containers
8. ✅ Use WAF for API protection (optional)

## Rollback Strategy

If deployment fails:

```bash
# List task definitions
aws ecs list-task-definitions --family-prefix pandebugger-api

# Rollback to previous version
aws ecs update-service \
  --cluster pandebugger-prod \
  --service pandebugger-api-service \
  --task-definition pandebugger-api:PREVIOUS_VERSION
```

## Troubleshooting

### Service won't start
- Check CloudWatch logs for errors
- Verify security group allows outbound to RDS
- Ensure secrets are correctly configured
- Check task definition CPU/memory limits

### Database connection issues
- Verify RDS security group allows inbound from ECS
- Check RDS endpoint and credentials
- Ensure VPC configuration is correct

### High costs
- Review CloudWatch metrics for unused resources
- Consider using Fargate Spot for non-critical tasks
- Enable RDS autoscaling
- Use CloudWatch alarms for budget monitoring

## Next Steps

1. Set up custom domain with Route 53
2. Configure HTTPS with ACM certificate
3. Implement CI/CD pipeline
4. Set up monitoring dashboards
5. Configure backup strategy
6. Implement disaster recovery plan
