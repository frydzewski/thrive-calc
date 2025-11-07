# Complete AWS CDK Deployment Guide for FinPlan

This comprehensive guide explains everything that was set up with AWS CDK and provides step-by-step instructions for deploying the FinPlan financial planning application to AWS.

## Table of Contents

1. [What Was Built](#what-was-built)
2. [Project Structure](#project-structure)
3. [Prerequisites](#prerequisites)
4. [Understanding the Infrastructure](#understanding-the-infrastructure)
5. [Step-by-Step Deployment](#step-by-step-deployment)
6. [Verifying Your Deployment](#verifying-your-deployment)
7. [Managing Your Application](#managing-your-application)
8. [Cost Management](#cost-management)
9. [Troubleshooting](#troubleshooting)
10. [Advanced Configuration](#advanced-configuration)

---

## What Was Built

### Application Overview

**FinPlan** is a Next.js financial planning web application with the following features:
- Dashboard with financial overview
- Retirement calculator with interactive projections
- Savings goals tracker
- Investment portfolio manager
- Financial reports and recommendations

### CDK Infrastructure Components

The AWS CDK configuration deploys a **production-ready, scalable, containerized** web application with:

1. **Networking Layer**
   - VPC with public and private subnets across 2 availability zones
   - NAT Gateway for private subnet internet access
   - Security groups with appropriate ingress/egress rules

2. **Compute Layer**
   - ECS Fargate cluster (serverless containers)
   - Auto-scaling from 1 to 10 tasks based on CPU and memory
   - Application Load Balancer for traffic distribution
   - Health checks to ensure application availability

3. **Monitoring & Logging**
   - CloudWatch Log Group for centralized logging
   - Container Insights enabled on ECS cluster
   - CloudWatch metrics for scaling decisions

4. **Container Configuration**
   - Multi-stage Docker build for optimized image size
   - Next.js standalone output mode for minimal footprint
   - Automatic image building and pushing to ECR (Elastic Container Registry)

---

## Project Structure

Here's what was created in your project:

```
claude-test/
│
├── cdk/                              # CDK infrastructure code
│   ├── bin/
│   │   └── app.ts                    # CDK app entry point
│   └── lib/
│       └── finplan-stack.ts          # Main infrastructure stack
│
├── app/                              # Next.js application code
│   ├── components/
│   ├── dashboard/
│   ├── retirement-calculator/
│   ├── savings-goals/
│   ├── portfolio/
│   └── reports/
│
├── scripts/
│   └── deploy.sh                     # Automated deployment script
│
├── .github/
│   └── workflows/
│       └── deploy.yml                # GitHub Actions CI/CD workflow
│
├── Dockerfile                        # Container image definition
├── .dockerignore                     # Files excluded from Docker build
├── cdk.json                          # CDK configuration
├── tsconfig.cdk.json                 # TypeScript config for CDK
├── next.config.ts                    # Next.js configuration (with standalone)
│
└── Documentation/
    ├── DEPLOYMENT.md                 # Detailed deployment guide
    ├── CDK_QUICK_REFERENCE.md        # Quick command reference
    ├── AWS_CDK_SETUP.md              # Setup summary
    └── COMPLETE_CDK_GUIDE.md         # This file
```

---

## Prerequisites

Before deploying, ensure you have the following:

### 1. AWS Account

You need an active AWS account. If you don't have one:
- Go to https://aws.amazon.com
- Click "Create an AWS Account"
- Follow the signup process

### 2. AWS CLI

Install the AWS Command Line Interface:

**macOS (using Homebrew):**
```bash
brew install awscli
```

**Linux:**
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

**Windows:**
Download from: https://aws.amazon.com/cli/

**Verify installation:**
```bash
aws --version
# Should output: aws-cli/2.x.x ...
```

### 3. AWS Credentials

Configure your AWS credentials:

```bash
aws configure
```

You'll be prompted for:
- **AWS Access Key ID**: Get from AWS Console → IAM → Users → Security Credentials
- **AWS Secret Access Key**: Provided when you create the access key
- **Default region**: e.g., `us-east-1`, `us-west-2`, `eu-west-1`
- **Default output format**: `json`

**Verify credentials work:**
```bash
aws sts get-caller-identity
```

This should return your AWS account details.

### 4. Docker

Docker is required to build container images.

**macOS:**
- Download Docker Desktop from https://www.docker.com/products/docker-desktop
- Install and start Docker Desktop

**Linux:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo systemctl start docker
sudo usermod -aG docker $USER
```

**Windows:**
- Download Docker Desktop from https://www.docker.com/products/docker-desktop
- Install and start Docker Desktop

**Verify Docker is running:**
```bash
docker --version
docker info
```

### 5. Node.js & npm

Already installed in your project (v25.1.0). Verify:
```bash
node --version
npm --version
```

### 6. Project Dependencies

All dependencies should already be installed, but if needed:
```bash
npm install
```

---

## Understanding the Infrastructure

### What Gets Created in AWS

When you deploy with CDK, the following AWS resources are created:

#### 1. VPC (Virtual Private Cloud)
- **CIDR Block**: 10.0.0.0/16
- **Public Subnets**: 2 subnets across different availability zones
  - Used for the Application Load Balancer
  - Have internet gateway access
- **Private Subnets**: 2 subnets across different availability zones
  - Used for ECS tasks (your containers)
  - Access internet through NAT Gateway

#### 2. ECS (Elastic Container Service)
- **Cluster**: Named `finplan-cluster`
- **Service**: Named `finplan-service`
  - Launch Type: Fargate (serverless)
  - Initial task count: 2
  - CPU: 256 units (0.25 vCPU)
  - Memory: 512 MB
  - Container runs on port 3000

#### 3. Application Load Balancer
- **Type**: Public-facing (internet-facing)
- **Listeners**: HTTP on port 80
- **Target Group**: Routes to ECS tasks on port 3000
- **Health Check**:
  - Path: `/`
  - Interval: 30 seconds
  - Healthy threshold: 2 consecutive successes
  - Unhealthy threshold: 3 consecutive failures

#### 4. Auto Scaling
- **Minimum capacity**: 1 task
- **Maximum capacity**: 10 tasks
- **CPU-based scaling**: Triggers at 70% CPU utilization
- **Memory-based scaling**: Triggers at 80% memory utilization
- **Cooldown periods**: 60 seconds for scale in/out

#### 5. CloudWatch Logs
- **Log Group**: `/ecs/finplan`
- **Retention**: 7 days
- **Streams**: One per task

#### 6. ECR (Elastic Container Registry)
- Automatically created by CDK
- Stores your Docker images
- Images are automatically tagged and pushed during deployment

### Architecture Diagram

```
                          Internet
                             │
                             │
                    ┌────────▼────────┐
                    │   Route 53      │ (Optional - for custom domain)
                    └────────┬────────┘
                             │
                    ┌────────▼─────────────────────┐
                    │  Application Load Balancer   │
                    │  (Public Subnets)             │
                    │  - Health Checks              │
                    │  - SSL/TLS (optional)         │
                    └────────┬─────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
         ┌────▼────┐    ┌────▼────┐   ┌────▼────┐
         │ ECS Task│    │ ECS Task│   │ ECS Task│
         │   #1    │    │   #2    │   │   #n    │
         │         │    │         │   │         │
         │ Next.js │    │ Next.js │   │ Next.js │
         │Container│    │Container│   │Container│
         │         │    │         │   │         │
         │ Port    │    │ Port    │   │ Port    │
         │ 3000    │    │ 3000    │   │ 3000    │
         └────┬────┘    └────┬────┘   └────┬────┘
              │              │              │
              │   (Private Subnets)         │
              │                             │
              └──────────────┬──────────────┘
                             │
                    ┌────────▼─────────┐
                    │  NAT Gateway     │
                    │  (Public Subnet) │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │ Internet Gateway │
                    └──────────────────┘

              Logs sent to CloudWatch
              ┌──────────────────┐
              │  CloudWatch      │
              │  Logs            │
              │  /ecs/finplan    │
              └──────────────────┘
```

### How Traffic Flows

1. **User Request** → Internet
2. **Load Balancer** receives request on port 80
3. **Target Group** routes to healthy ECS task
4. **ECS Task** (container) processes request
5. **Response** travels back through load balancer to user

### Auto Scaling Behavior

**Scale Out (Add tasks):**
- When CPU > 70% for 60 seconds
- Or memory > 80% for 60 seconds
- Adds 1 task at a time
- Maximum 10 tasks

**Scale In (Remove tasks):**
- When CPU < 70% for 60 seconds
- And memory < 80% for 60 seconds
- Removes 1 task at a time
- Minimum 1 task

---

## Step-by-Step Deployment

### Method 1: Automated Deployment (Recommended)

The easiest way to deploy is using the provided automation script:

```bash
# Navigate to your project directory
cd /Users/frankrydzewski/claude/sample/claude-test

# Run the deployment script
./scripts/deploy.sh
```

**What the script does:**
1. ✅ Checks AWS CLI is installed
2. ✅ Verifies Docker is running
3. ✅ Validates AWS credentials
4. ✅ Checks if CDK is bootstrapped (bootstraps if needed)
5. 🚀 Deploys the application

**Follow the prompts:**
- Confirm your AWS account and region
- Type `y` to proceed with deployment
- If CDK isn't bootstrapped, confirm bootstrap (first time only)

### Method 2: Manual Deployment

If you prefer to run commands manually:

#### Step 1: Bootstrap CDK (First Time Only)

CDK needs to create resources in your AWS account for deployments:

```bash
npm run cdk:bootstrap
```

**What this does:**
- Creates an S3 bucket for CDK assets
- Creates ECR repository for Docker images
- Creates IAM roles for deployments
- Sets up necessary permissions

**Output:**
```
 ✅  Environment aws://123456789012/us-east-1 bootstrapped
```

**Note:** You only need to do this once per AWS account/region combination.

#### Step 2: Preview the Infrastructure

See what will be created:

```bash
npm run cdk:synth
```

This generates CloudFormation templates. Review the output to understand what resources will be created.

#### Step 3: Preview Changes

Before deploying, see what changes will be made:

```bash
npm run cdk:diff
```

**Output shows:**
- Resources to be created (green +)
- Resources to be modified (yellow ~)
- Resources to be deleted (red -)

#### Step 4: Deploy to AWS

Deploy the application:

```bash
npm run cdk:deploy
```

**What happens during deployment:**

1. **Building Docker Image** (2-3 minutes)
   - Installs Node.js dependencies
   - Builds Next.js application
   - Creates optimized production image

2. **Pushing to ECR** (1-2 minutes)
   - Creates ECR repository if needed
   - Pushes Docker image to registry

3. **Creating Infrastructure** (8-12 minutes)
   - Creates VPC and networking
   - Creates ECS cluster
   - Creates load balancer
   - Configures security groups
   - Sets up auto scaling
   - Creates CloudWatch logs

4. **Starting Tasks** (1-2 minutes)
   - Pulls Docker image
   - Starts ECS tasks
   - Waits for health checks to pass

**Total Time:** ~10-15 minutes

#### Step 5: Get Your Application URL

After deployment completes, you'll see outputs:

```
Outputs:
FinPlanStack.LoadBalancerDNS = finpl-FinPl-XXXXX.us-east-1.elb.amazonaws.com
FinPlanStack.ServiceURL = http://finpl-FinPl-XXXXX.us-east-1.elb.amazonaws.com
FinPlanStack.ClusterName = finplan-cluster
FinPlanStack.ServiceName = finplan-service
```

**Important:** Copy the `ServiceURL` - this is your application's public address.

---

## Verifying Your Deployment

### 1. Wait for Health Checks

After deployment completes, wait 2-3 minutes for:
- Load balancer to register targets
- Health checks to pass
- Tasks to become healthy

### 2. Check Application Status

```bash
# View running tasks
aws ecs list-tasks --cluster finplan-cluster

# Should return task ARNs like:
# "taskArns": [
#     "arn:aws:ecs:us-east-1:123456789012:task/finplan-cluster/abc123..."
# ]
```

### 3. Check Target Health

```bash
# Get target group ARN from AWS Console or:
aws elbv2 describe-target-groups \
  --names FinPlanStack-FinPlanServiceLBPublicListenerECSGroup* \
  --query 'TargetGroups[0].TargetGroupArn'

# Then check health (replace with your ARN):
aws elbv2 describe-target-health \
  --target-group-arn <your-target-group-arn>
```

**Healthy targets show:**
```json
{
    "TargetHealthDescriptions": [
        {
            "Target": {
                "Id": "10.0.x.x",
                "Port": 3000
            },
            "HealthCheckPort": "3000",
            "TargetHealth": {
                "State": "healthy"
            }
        }
    ]
}
```

### 4. Access Your Application

Open your browser and navigate to the ServiceURL:

```
http://finpl-FinPl-XXXXX.us-east-1.elb.amazonaws.com
```

You should see the FinPlan home page with:
- "Plan Your Financial Future" header
- Three feature cards
- "Get Started" and "Try Calculator" buttons

### 5. Test the Features

Navigate through the application:
- **Dashboard** - View financial overview
- **Retirement Calculator** - Use sliders to project retirement
- **Savings Goals** - Add and track goals
- **Portfolio** - View investment holdings
- **Reports** - See financial health score

### 6. View Logs

Check application logs in real-time:

```bash
aws logs tail /ecs/finplan --follow
```

**You should see:**
- Next.js startup messages
- HTTP request logs
- Any application output

---

## Managing Your Application

### Updating the Application

After making code changes:

#### 1. Edit Your Code

Make changes to any files in the `app/` directory.

#### 2. Test Locally

```bash
npm run dev
# Visit http://localhost:3000
```

#### 3. Deploy Changes

```bash
npm run cdk:deploy
```

**What happens:**
- New Docker image is built with your changes
- Image is pushed to ECR
- ECS performs rolling update
- Old tasks are replaced with new ones
- Zero-downtime deployment

**Deployment time:** ~5-8 minutes (faster than initial deploy)

### Viewing Logs

**Real-time logs:**
```bash
aws logs tail /ecs/finplan --follow
```

**Last hour:**
```bash
aws logs tail /ecs/finplan --since 1h
```

**Last 100 lines:**
```bash
aws logs tail /ecs/finplan -n 100
```

**Filter for errors:**
```bash
aws logs tail /ecs/finplan --follow --filter-pattern "ERROR"
```

### Scaling Manually

Change the number of running tasks:

```bash
# Scale to 5 tasks
aws ecs update-service \
  --cluster finplan-cluster \
  --service finplan-service \
  --desired-count 5
```

**Note:** Auto scaling will still adjust based on CPU/memory.

### Viewing Metrics

**In AWS Console:**
1. Navigate to CloudWatch
2. Select "Metrics" → "ECS"
3. Choose your cluster and service
4. View CPU, memory, request count, etc.

**Via CLI:**
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=finplan-service \
               Name=ClusterName,Value=finplan-cluster \
  --start-time 2025-01-01T00:00:00Z \
  --end-time 2025-01-01T23:59:59Z \
  --period 3600 \
  --statistics Average
```

### Destroying Resources

When you want to remove everything:

```bash
npm run cdk:destroy
```

**Confirm deletion:**
```
Are you sure you want to delete: FinPlanStack (y/n)? y
```

**What gets deleted:**
- All ECS tasks
- Load balancer
- VPC and subnets
- Log groups
- ECR images
- All created resources

**Time:** ~5-10 minutes

**⚠️ Warning:** This is permanent and cannot be undone.

---

## Cost Management

### Monthly Cost Breakdown

| Resource | Configuration | Monthly Cost (USD) |
|----------|--------------|-------------------|
| **Application Load Balancer** | 1 ALB, 730 hours | $16.20 |
| **Load Balancer Data** | Minimal traffic | $1-3 |
| **NAT Gateway** | 1 NAT, 730 hours | $32.85 |
| **NAT Gateway Data** | 10 GB processed | $0.45 |
| **ECS Fargate - CPU** | 2 tasks × 0.25 vCPU × 730 hours | $7.30 |
| **ECS Fargate - Memory** | 2 tasks × 0.5 GB × 730 hours | $3.65 |
| **CloudWatch Logs** | 1 GB ingested, 7-day retention | $0.50 |
| **ECR Storage** | 1 GB | $0.10 |
| **Data Transfer** | Minimal outbound | $1-5 |
| **Total Estimated** | | **$63-70/month** |

### Cost Optimization Tips

#### 1. Reduce Task Count

Edit `cdk/lib/finplan-stack.ts`:

```typescript
desiredCount: 1,  // Change from 2 to 1
```

Redeploy:
```bash
npm run cdk:deploy
```

**Savings:** ~$5-6/month

#### 2. Use Public Subnets (Remove NAT Gateway)

⚠️ **Security consideration:** Tasks will have public IPs

Edit `cdk/lib/finplan-stack.ts`:

```typescript
assignPublicIp: true,  // Change from false
taskSubnets: {
  subnetType: ec2.SubnetType.PUBLIC,  // Change from PRIVATE_WITH_EGRESS
},
```

Remove NAT Gateway from VPC:
```typescript
natGateways: 0,  // Change from 1
```

**Savings:** ~$33/month

#### 3. Reduce Log Retention

Edit `cdk/lib/finplan-stack.ts`:

```typescript
retention: logs.RetentionDays.ONE_DAY,  // Change from ONE_WEEK
```

**Savings:** Minimal (~$0.20/month)

#### 4. Use Spot Capacity (Advanced)

For non-production workloads, consider Fargate Spot:

```typescript
capacityProviderStrategies: [
  {
    capacityProvider: 'FARGATE_SPOT',
    weight: 1,
  },
],
```

**Savings:** ~70% on compute costs

### Monitoring Costs

**In AWS Console:**
1. Navigate to AWS Cost Explorer
2. View current month spend
3. Filter by service: ECS, EC2 (for NAT), ELB

**Set up billing alerts:**
```bash
# Create SNS topic for alerts
aws sns create-topic --name billing-alerts

# Subscribe to email
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:123456789012:billing-alerts \
  --protocol email \
  --notification-endpoint your-email@example.com

# Create billing alarm (via CloudWatch)
```

---

## Troubleshooting

### Issue: CDK Deploy Fails

#### Symptom
```
Error: Need to perform AWS calls for account 123456789012, but no credentials configured
```

**Solution:**
```bash
# Configure AWS credentials
aws configure

# Verify
aws sts get-caller-identity
```

---

#### Symptom
```
Error: Docker is not running
```

**Solution:**
```bash
# Start Docker Desktop (macOS/Windows)
# Or on Linux:
sudo systemctl start docker

# Verify
docker info
```

---

#### Symptom
```
Error: This stack uses assets, so the toolkit stack must be deployed
```

**Solution:**
```bash
npm run cdk:bootstrap
```

---

### Issue: Cannot Access Application

#### Symptom
Browser shows "Connection refused" or timeout

**Solutions:**

1. **Wait for health checks** (2-3 minutes after deploy)

2. **Check task status:**
```bash
aws ecs describe-services \
  --cluster finplan-cluster \
  --services finplan-service \
  --query 'services[0].deployments'
```

Look for `runningCount` = `desiredCount`

3. **Check target health:**
```bash
# Get load balancer target groups
aws elbv2 describe-target-groups \
  --query 'TargetGroups[?contains(TargetGroupName, `FinPlan`)].TargetGroupArn'

# Check health
aws elbv2 describe-target-health \
  --target-group-arn <your-arn>
```

Ensure state is "healthy"

4. **Check security groups:**
```bash
# Get load balancer security group
aws elbv2 describe-load-balancers \
  --query 'LoadBalancers[?contains(LoadBalancerName, `FinPl`)].SecurityGroups'
```

Verify inbound rule allows port 80 from 0.0.0.0/0

---

### Issue: Container Keeps Restarting

#### Symptom
Tasks start but immediately stop

**Solutions:**

1. **Check logs:**
```bash
aws logs tail /ecs/finplan --since 10m
```

Look for error messages

2. **Test Docker image locally:**
```bash
# Build
npm run docker:build

# Run
npm run docker:run

# Visit http://localhost:3000
# Check for errors
```

3. **Common issues:**
   - Missing environment variables
   - Incorrect port configuration
   - Application crash on startup

4. **Verify Next.js build:**
```bash
npm run build
# Ensure build succeeds locally
```

---

### Issue: High Costs

#### Symptom
AWS bill is higher than expected

**Solutions:**

1. **Check current resources:**
```bash
# Count running tasks
aws ecs list-tasks --cluster finplan-cluster

# Should match your desired count (usually 2)
```

2. **Check auto scaling:**
```bash
aws ecs describe-services \
  --cluster finplan-cluster \
  --services finplan-service \
  --query 'services[0].desiredCount'
```

3. **Review NAT Gateway usage:**
   - NAT Gateway costs $0.045/hour + $0.045/GB
   - Consider moving to public subnets for dev/test

4. **Destroy when not needed:**
```bash
npm run cdk:destroy
# Redeploy when needed with: npm run cdk:deploy
```

---

### Issue: Deployment is Slow

#### Symptom
Deployment takes longer than 15 minutes

**Solutions:**

1. **Normal for first deploy** - Subsequent deploys are faster

2. **Check Docker build cache:**
```bash
# If too slow, clear cache
docker system prune -a
```

3. **Increase timeout if needed:**
Edit `cdk/lib/finplan-stack.ts` health check:
```typescript
timeout: cdk.Duration.seconds(10),  // Increase from 5
```

---

### Issue: Can't Delete Stack

#### Symptom
```
Error: Stack has resources that must be manually deleted
```

**Solution:**

1. **Empty S3 buckets:**
```bash
# Find CDK staging bucket
aws s3 ls | grep cdktoolkit

# Empty it
aws s3 rm s3://cdktoolkit-stagingbucket-xxxxx --recursive
```

2. **Delete ECR images:**
```bash
# List repositories
aws ecr describe-repositories

# Delete images
aws ecr batch-delete-image \
  --repository-name finplanstack-xxx \
  --image-ids imageTag=latest
```

3. **Retry destroy:**
```bash
npm run cdk:destroy
```

---

## Advanced Configuration

### Adding Environment Variables

Edit `cdk/lib/finplan-stack.ts`:

```typescript
taskImageOptions: {
  // ... existing config ...
  environment: {
    NODE_ENV: 'production',
    PORT: '3000',
    // Add your variables:
    DATABASE_URL: 'postgresql://...',
    API_KEY: 'your-api-key',
    NEXT_PUBLIC_API_URL: 'https://api.example.com',
  },
},
```

**For sensitive values, use Secrets Manager:**

1. **Create secret:**
```bash
aws secretsmanager create-secret \
  --name finplan/database-url \
  --secret-string "postgresql://..."
```

2. **Reference in CDK:**
```typescript
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

// In your stack:
const dbSecret = secretsmanager.Secret.fromSecretNameV2(
  this,
  'DBSecret',
  'finplan/database-url'
);

// In task definition:
secrets: {
  DATABASE_URL: ecs.Secret.fromSecretsManager(dbSecret),
},
```

3. **Redeploy:**
```bash
npm run cdk:deploy
```

### Adding a Custom Domain

#### Prerequisites
- Domain registered in Route53 (or transfer DNS to Route53)
- SSL certificate from ACM

#### Steps

1. **Request certificate:**
```bash
aws acm request-certificate \
  --domain-name finplan.yourdomain.com \
  --validation-method DNS
```

2. **Add to CDK stack:**

```typescript
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';

// Get hosted zone
const zone = route53.HostedZone.fromLookup(this, 'Zone', {
  domainName: 'yourdomain.com',
});

// Get certificate
const certificate = acm.Certificate.fromCertificateArn(
  this,
  'Certificate',
  'arn:aws:acm:us-east-1:123456789012:certificate/xxx'
);

// Update Fargate service:
const fargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(
  this,
  'FinPlanService',
  {
    // ... existing config ...
    domainName: 'finplan.yourdomain.com',
    domainZone: zone,
    certificate: certificate,
    redirectHTTP: true,  // Redirect HTTP to HTTPS
  }
);
```

3. **Deploy:**
```bash
npm run cdk:deploy
```

4. **Access:**
```
https://finplan.yourdomain.com
```

### Adding a Database

#### Option 1: RDS PostgreSQL

```typescript
import * as rds from 'aws-cdk-lib/aws-rds';

// Add to stack:
const database = new rds.DatabaseInstance(this, 'Database', {
  engine: rds.DatabaseInstanceEngine.postgres({
    version: rds.PostgresEngineVersion.VER_15,
  }),
  instanceType: ec2.InstanceType.of(
    ec2.InstanceClass.T3,
    ec2.InstanceSize.MICRO
  ),
  vpc,
  vpcSubnets: {
    subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
  },
  allocatedStorage: 20,
  maxAllocatedStorage: 100,
  databaseName: 'finplan',
  credentials: rds.Credentials.fromGeneratedSecret('postgres'),
});

// Allow ECS tasks to access database
database.connections.allowFrom(
  fargateService.service,
  ec2.Port.tcp(5432)
);

// Add connection string to task environment
const dbSecret = database.secret!;
// Use in task definition secrets (see environment variables section)
```

#### Option 2: DynamoDB

```typescript
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

const table = new dynamodb.Table(this, 'Table', {
  partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'goalId', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  encryption: dynamodb.TableEncryption.AWS_MANAGED,
});

// Grant access to ECS tasks
table.grantReadWriteData(fargateService.taskDefinition.taskRole);

// Add table name to environment
environment: {
  DYNAMODB_TABLE_NAME: table.tableName,
}
```

### Enabling HTTPS/SSL

1. **Request ACM certificate** (see Custom Domain section)

2. **Update load balancer:**

```typescript
const fargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(
  this,
  'FinPlanService',
  {
    // ... existing config ...
    protocol: ecs_patterns.ApplicationProtocol.HTTPS,
    certificate: certificate,
    redirectHTTP: true,
  }
);
```

3. **Deploy:**
```bash
npm run cdk:deploy
```

### Setting Up CI/CD with GitHub Actions

The project includes a GitHub Actions workflow at `.github/workflows/deploy.yml`.

#### Setup Steps

1. **Create IAM OIDC Provider:**

```bash
# In AWS Console: IAM → Identity Providers → Add Provider
# Provider type: OpenID Connect
# Provider URL: https://token.actions.githubusercontent.com
# Audience: sts.amazonaws.com
```

2. **Create IAM Role:**

Create role with this trust policy:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:yourusername/claude-test:*"
        }
      }
    }
  ]
}
```

Attach policies:
- `PowerUserAccess` (or more restricted CDK deployment policy)

3. **Add GitHub Secret:**

In your repository:
- Go to Settings → Secrets and variables → Actions
- Add secret: `AWS_ROLE_ARN`
- Value: `arn:aws:iam::123456789012:role/GitHubActionsRole`

4. **Push to main:**

```bash
git add .
git commit -m "Deploy to AWS"
git push origin main
```

GitHub Actions will automatically deploy on every push to `main`.

---

## Best Practices

### Security

1. **Use secrets for sensitive data:**
   - AWS Secrets Manager for credentials
   - Never hardcode secrets in code

2. **Enable encryption:**
   - RDS encryption at rest
   - S3 bucket encryption
   - ECS task encryption

3. **Restrict security groups:**
   - Only allow necessary ports
   - Use least privilege access

4. **Enable CloudTrail:**
   - Audit all API calls
   - Monitor for suspicious activity

### Performance

1. **Use CloudFront CDN** (for global users):
   ```typescript
   import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';

   new cloudfront.Distribution(this, 'CDN', {
     defaultBehavior: {
       origin: new origins.LoadBalancerV2Origin(fargateService.loadBalancer),
     },
   });
   ```

2. **Enable caching:**
   - Cache static assets in Next.js
   - Use CDN for images and CSS

3. **Optimize container:**
   - Multi-stage Docker build (already implemented)
   - Minimize image size

### Monitoring

1. **Set up alarms:**
   ```typescript
   import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
   import * as sns from 'aws-cdk-lib/aws-sns';

   const topic = new sns.Topic(this, 'AlarmTopic');

   new cloudwatch.Alarm(this, 'HighCPU', {
     metric: fargateService.service.metricCpuUtilization(),
     threshold: 90,
     evaluationPeriods: 2,
   }).addAlarmAction(new cloudwatch_actions.SnsAction(topic));
   ```

2. **Enable X-Ray tracing:**
   - Trace requests through your application
   - Identify performance bottlenecks

3. **Set up dashboards:**
   - CloudWatch dashboard for key metrics
   - Monitor errors, latency, and throughput

### Cost Optimization

1. **Use Fargate Spot** for dev/test
2. **Right-size your tasks** (CPU and memory)
3. **Remove NAT Gateway** for non-production
4. **Set up auto-shutdown** for dev environments
5. **Use Reserved Capacity** for predictable workloads

---

## Summary

You now have a complete understanding of:

✅ **What was built** - Production-ready Next.js app with AWS CDK infrastructure
✅ **How to deploy** - Automated or manual deployment process
✅ **How to manage** - Updating, scaling, and monitoring your application
✅ **How to optimize** - Reducing costs and improving performance
✅ **How to troubleshoot** - Common issues and solutions
✅ **How to extend** - Adding databases, custom domains, and CI/CD

## Quick Reference Commands

```bash
# Deploy
./scripts/deploy.sh                  # Automated
npm run cdk:deploy                   # Manual

# Monitor
aws logs tail /ecs/finplan --follow  # View logs
aws ecs list-tasks --cluster finplan-cluster  # List tasks

# Update
# (Make code changes, then:)
npm run cdk:deploy

# Cleanup
npm run cdk:destroy
```

## Next Steps

1. **Deploy the application:**
   ```bash
   ./scripts/deploy.sh
   ```

2. **Test all features** in your deployed application

3. **Set up monitoring and alarms**

4. **Consider adding:**
   - Database (RDS or DynamoDB)
   - Authentication (Cognito or Auth0)
   - Custom domain with SSL
   - CI/CD pipeline

5. **Optimize for production:**
   - Review security settings
   - Set up backups
   - Configure monitoring
   - Implement cost controls

---

**You're ready to deploy!** 🚀

If you have questions or run into issues, refer to the troubleshooting section or AWS documentation.
