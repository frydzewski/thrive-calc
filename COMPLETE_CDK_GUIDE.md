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
- AWS Cognito user authentication
- DynamoDB data storage

### CDK Infrastructure Components

The AWS CDK configuration deploys a **production-ready, scalable, containerized** web application with:

1. **Networking Layer**
   - VPC with public and isolated subnets in 1 availability zone
   - VPC Endpoints for AWS service access (no NAT Gateway)
   - Security groups with appropriate ingress/egress rules

2. **VPC Endpoints (AWS Service Access)**
   - DynamoDB Gateway Endpoint (FREE)
   - S3 Gateway Endpoint (FREE)
   - ECR API Interface Endpoint
   - ECR Docker Interface Endpoint
   - CloudWatch Logs Interface Endpoint
   - Secrets Manager Interface Endpoint
   - Cognito IDP Interface Endpoint

3. **Compute Layer**
   - ECS Fargate cluster (serverless containers)
   - Auto-scaling from 1 to 10 tasks based on CPU and memory
   - Application Load Balancer for traffic distribution
   - Health checks to ensure application availability

4. **Authentication**
   - AWS Cognito User Pool for user sign-up/sign-in
   - Email verification and password reset
   - OAuth 2.0 authorization code flow

5. **Data Storage**
   - DynamoDB table for user financial data
   - Pay-per-request billing (no provisioned capacity)
   - Global Secondary Index for efficient queries
   - Point-in-time recovery enabled

6. **Monitoring & Logging**
   - CloudWatch Log Group for centralized logging
   - Container Insights enabled on ECS cluster
   - CloudWatch metrics for scaling decisions

7. **Container Configuration**
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
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts          # NextAuth.js Cognito config
│   ├── components/
│   │   ├── Navigation.tsx            # Navigation with auth
│   │   └── SessionProvider.tsx       # Auth session provider
│   ├── lib/
│   │   └── data-store.ts             # DynamoDB data access layer
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
    ├── COGNITO_AUTH_GUIDE.md         # Cognito authentication guide
    ├── DYNAMODB_GUIDE.md             # DynamoDB data storage guide
    ├── VPC_ENDPOINTS_GUIDE.md        # VPC endpoints architecture
    └── COMPLETE_CDK_GUIDE.md         # This file
```

---

## Prerequisites

### Required Tools

Before deploying, ensure you have:

1. **Node.js** (v18 or later)
   ```bash
   node --version  # Should be v18.0.0 or higher
   ```

2. **AWS CLI** (v2)
   ```bash
   aws --version  # Should be aws-cli/2.x.x
   ```

3. **AWS CDK CLI**
   ```bash
   npm install -g aws-cdk
   cdk --version  # Should be 2.x.x
   ```

4. **Docker** (for building container images)
   ```bash
   docker --version  # Should be Docker version 20+
   ```

### AWS Account Setup

1. **AWS Account**: You need an active AWS account

2. **AWS Credentials**: Configure your AWS credentials
   ```bash
   aws configure
   ```

   You'll need:
   - AWS Access Key ID
   - AWS Secret Access Key
   - Default region (e.g., `us-east-1`)
   - Default output format (e.g., `json`)

3. **IAM Permissions**: Your AWS user/role needs permissions for:
   - VPC creation
   - ECS/Fargate
   - Application Load Balancer
   - CloudWatch Logs
   - ECR (Elastic Container Registry)
   - DynamoDB
   - Cognito
   - IAM role creation

### Project Setup

1. **Clone the repository** (if not already done)
   ```bash
   git clone https://github.com/yourusername/claude-test.git
   cd claude-test
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Generate NextAuth secret**
   ```bash
   openssl rand -base64 32
   ```

   Save this for your `.env.local` file.

---

## Understanding the Infrastructure

### VPC Architecture (Single AZ)

```
                    Internet
                        ↓
         ┌─────────────────────────────┐
         │  Application Load Balancer  │  (Public Subnet)
         └─────────────┬───────────────┘
                       ↓
         ┌─────────────────────────────┐
         │   ECS Fargate Tasks (1-10)  │  (Isolated Subnet)
         └─────────────┬───────────────┘
                       ↓
         ┌─────────────────────────────┐
         │      VPC Endpoints          │
         │  - DynamoDB (Gateway)       │
         │  - S3 (Gateway)             │
         │  - ECR API (Interface)      │
         │  - ECR Docker (Interface)   │
         │  - CloudWatch Logs          │
         └─────────────┬───────────────┘
                       ↓
              AWS Services
```

### Key Infrastructure Decisions

1. **Single AZ (1 Availability Zone)**
   - Cost optimization: ~$105/month (1 task, 2 AZs)
   - Suitable for development and small-scale production
   - For high availability, change `maxAzs: 1` to `maxAzs: 2`

2. **No NAT Gateway**
   - Saves $32.40/month (NAT Gateway cost avoided)
   - Uses VPC endpoints instead for AWS service access
   - ECS tasks have no internet access (better security)

3. **VPC Endpoints**
   - Gateway endpoints (DynamoDB, S3): FREE
   - Interface endpoints (5 endpoints): ~$72/month (2 AZs × 5 endpoints × $7.20)
   - Provides AWS service access without internet

4. **ECS Fargate**
   - Serverless containers (no EC2 instances to manage)
   - Pay only for running tasks
   - Auto-scaling based on CPU and memory

5. **Application Load Balancer**
   - Distributes traffic across ECS tasks
   - Health checks ensure only healthy tasks receive traffic
   - SSL termination (if configured)

6. **DynamoDB**
   - Pay-per-request billing (no provisioned capacity)
   - Unlimited scaling
   - Single-digit millisecond performance

7. **Cognito**
   - Managed user authentication
   - Free for up to 50,000 monthly active users
   - Email verification and password reset included

---

## Step-by-Step Deployment

### Step 1: Bootstrap CDK (First Time Only)

CDK needs to create resources in your AWS account to manage deployments.

```bash
npm run cdk:bootstrap
```

Or manually:
```bash
cd cdk
cdk bootstrap
```

This creates:
- S3 bucket for CDK assets
- ECR repository for container images
- IAM roles for deployments

**You only need to do this once per AWS account/region.**

### Step 2: Synthesize CloudFormation Template

Generate the CloudFormation template to see what will be created:

```bash
npm run cdk:synth
```

Or manually:
```bash
cd cdk
cdk synth
```

This shows you the CloudFormation YAML that will be deployed.

### Step 3: Deploy the Stack

Deploy the infrastructure to AWS:

```bash
npm run cdk:deploy
```

Or manually:
```bash
cd cdk
cdk deploy --require-approval never
```

**This will:**
1. Build your Next.js application
2. Build the Docker image
3. Push the image to ECR
4. Create all AWS resources
5. Deploy your application

**Deployment time:** ~10-15 minutes

### Step 4: Note the Outputs

After deployment, CDK will show outputs like:

```
Outputs:
FinPlanStack.LoadBalancerDNS = finpl-FinPl-XXXXX.us-east-1.elb.amazonaws.com
FinPlanStack.ServiceURL = http://finpl-FinPl-XXXXX.us-east-1.elb.amazonaws.com
FinPlanStack.ClusterName = finplan-cluster
FinPlanStack.ServiceName = finplan-service
FinPlanStack.DynamoDBTableName = finplan-user-data
FinPlanStack.UserPoolId = us-east-1_AbCdEfGhI
FinPlanStack.UserPoolClientId = 1a2b3c4d5e6f7g8h9i0j
FinPlanStack.UserPoolDomain = finplan-123456789012
FinPlanStack.CognitoIssuer = https://cognito-idp.us-east-1.amazonaws.com/us-east-1_AbCdEfGhI
```

**Save these values!** You'll need them for:
- Accessing your application
- Local development configuration
- Troubleshooting

### Step 5: Get Cognito Client Secret

The Cognito Client Secret is not shown in the CDK output. Get it with:

```bash
aws cognito-idp describe-user-pool-client \
  --user-pool-id us-east-1_AbCdEfGhI \
  --client-id 1a2b3c4d5e6f7g8h9i0j \
  --query 'UserPoolClient.ClientSecret' \
  --output text
```

Replace `us-east-1_AbCdEfGhI` and `1a2b3c4d5e6f7g8h9i0j` with your actual values.

### Step 6: Update Local Environment

For local development, create `.env.local`:

```bash
cp .env.example .env.local
```

Update `.env.local` with the values from Step 4 and 5:

```env
NEXTAUTH_SECRET=your-generated-secret-from-step-3
NEXTAUTH_URL=http://localhost:3000

COGNITO_CLIENT_ID=1a2b3c4d5e6f7g8h9i0j
COGNITO_CLIENT_SECRET=your-cognito-client-secret
COGNITO_ISSUER=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_AbCdEfGhI

AWS_REGION=us-east-1
DYNAMODB_TABLE_NAME=finplan-user-data
```

### Step 7: Access Your Application

Open the `ServiceURL` from the CDK output in your browser:

```
http://finpl-FinPl-XXXXX.us-east-1.elb.amazonaws.com
```

You should see the FinPlan landing page!

---

## Verifying Your Deployment

### Check ECS Service

```bash
aws ecs list-tasks --cluster finplan-cluster --service-name finplan-service
```

You should see at least 1 running task.

### Check Application Logs

```bash
aws logs tail /ecs/finplan --follow
```

This shows real-time logs from your application.

### Check DynamoDB Table

```bash
aws dynamodb describe-table --table-name finplan-user-data
```

Should show the table status as `ACTIVE`.

### Check Cognito User Pool

```bash
aws cognito-idp describe-user-pool --user-pool-id us-east-1_AbCdEfGhI
```

Should show the user pool configuration.

### Test Authentication

1. Navigate to your ServiceURL
2. Click "Sign In"
3. Click "Sign up" on the Cognito Hosted UI
4. Create an account with your email
5. Check your email for verification code
6. Enter the code and sign in

---

## Managing Your Application

### View Running Tasks

```bash
aws ecs list-tasks \
  --cluster finplan-cluster \
  --service-name finplan-service
```

### View Task Details

```bash
aws ecs describe-tasks \
  --cluster finplan-cluster \
  --tasks <task-arn-from-above>
```

### Restart Service (Force New Deployment)

```bash
aws ecs update-service \
  --cluster finplan-cluster \
  --service finplan-service \
  --force-new-deployment
```

This pulls the latest Docker image and restarts tasks.

### Scale Service Manually

```bash
aws ecs update-service \
  --cluster finplan-cluster \
  --service finplan-service \
  --desired-count 3
```

Changes the number of running tasks to 3.

### View Application Logs

```bash
# Follow logs in real-time
aws logs tail /ecs/finplan --follow

# View last 1 hour of logs
aws logs tail /ecs/finplan --since 1h

# Filter logs
aws logs tail /ecs/finplan --follow --filter-pattern "ERROR"
```

### Update Application Code

1. Make changes to your code
2. Commit to git
3. Run deployment:
   ```bash
   npm run cdk:deploy
   ```

CDK will:
- Build new Docker image
- Push to ECR
- Update ECS service
- Perform rolling deployment (zero downtime)

---

## Cost Management

### Monthly Cost Breakdown (2 AZs, 1 Task)

| Component | Cost/Month | Notes |
|-----------|------------|-------|
| ECS Fargate (1 task) | $12.46 | 0.25 vCPU, 512 MB RAM |
| Application Load Balancer | $18.00 | $0.025/hour |
| VPC Interface Endpoints | $72.00 | 5 endpoints × 2 AZs × $7.20 |
| CloudWatch Logs | ~$1.00 | First 5 GB free |
| DynamoDB | ~$2.00 | Pay-per-request |
| Cognito | FREE | Up to 50,000 MAU |
| S3 (ECR images) | ~$0.50 | Image storage |
| **Total** | **~$105/month** | Current configuration |

### Cost Optimization Tips

1. **Use Spot pricing for ECS** (save 70%)
   ```typescript
   capacityProviderStrategy: [
     { capacityProvider: 'FARGATE_SPOT', weight: 1 },
   ],
   ```

2. **Reduce log retention**
   ```typescript
   retention: logs.RetentionDays.THREE_DAYS,  // Instead of ONE_WEEK
   ```

3. **Use Savings Plans** for consistent usage
   - 1-year term: 40% discount
   - 3-year term: 60% discount

4. **Scale to zero during non-business hours**
   ```bash
   # Stop tasks at night
   aws ecs update-service --cluster finplan-cluster \
     --service finplan-service --desired-count 0

   # Start tasks in morning
   aws ecs update-service --cluster finplan-cluster \
     --service finplan-service --desired-count 1
   ```

5. **Use multi-AZ only for production**
   - Current (2 AZs, 1 task): ~$105/month
   - Production (2 AZs, 2+ tasks): ~$120-150/month

### Cost Monitoring

View your costs in AWS Cost Explorer:
- Go to AWS Console → Billing → Cost Explorer
- Filter by service (ECS, ALB, VPC, etc.)
- Set up budget alerts

### Setting Up Budget Alerts

```bash
aws budgets create-budget \
  --account-id 123456789012 \
  --budget file://budget.json \
  --notifications-with-subscribers file://notifications.json
```

---

## Troubleshooting

### Issue: CDK Bootstrap Fails

**Error:** `Unable to bootstrap: Access Denied`

**Cause:** Missing IAM permissions

**Solution:**
- Ensure your AWS user/role has AdministratorAccess or equivalent
- Check `aws sts get-caller-identity` to verify credentials

### Issue: Docker Build Fails

**Error:** `Cannot connect to the Docker daemon`

**Cause:** Docker is not running

**Solution:**
```bash
# Start Docker Desktop or Docker daemon
sudo systemctl start docker  # Linux
# Or start Docker Desktop app on Mac/Windows
```

### Issue: ECS Tasks Keep Crashing

**Error:** Tasks start but immediately stop

**Cause:** Application error or missing environment variables

**Solution:**
1. Check logs:
   ```bash
   aws logs tail /ecs/finplan --since 30m
   ```

2. Verify environment variables in task definition:
   ```bash
   aws ecs describe-task-definition \
     --task-definition finplan-service
   ```

3. Check health check configuration:
   ```typescript
   fargateService.targetGroup.configureHealthCheck({
     path: '/',  // Ensure this path returns 200 OK
     interval: cdk.Duration.seconds(30),
     timeout: cdk.Duration.seconds(5),
   });
   ```

### Issue: Cannot Pull Docker Image

**Error:** `CannotPullContainerError: pull image manifest has been retried`

**Cause:** Missing VPC endpoints for ECR or S3

**Solution:**
- Ensure ECR API, ECR Docker, and S3 endpoints are created
- Check endpoint security groups allow traffic from ECS tasks

### Issue: Cannot Access DynamoDB

**Error:** `User: arn:aws:sts::xxx:assumed-role/xxx is not authorized to perform: dynamodb:GetItem`

**Cause:** Missing IAM permissions for ECS task role

**Solution:**
- CDK should automatically grant permissions
- Check task role has DynamoDB read/write access:
  ```bash
  aws iam list-attached-role-policies --role-name finplan-task-role
  ```

### Issue: High Costs

**Symptom:** AWS bill is higher than expected

**Solution:**
1. Check running resources:
   ```bash
   aws ecs list-tasks --cluster finplan-cluster
   aws elbv2 describe-load-balancers
   ```

2. Check for multiple deployments:
   ```bash
   aws cloudformation list-stacks
   ```

3. Delete unused stacks:
   ```bash
   npm run cdk:destroy
   ```

### Issue: Cannot Authenticate with Cognito

**Error:** `Invalid redirect_uri`

**Cause:** Callback URL not configured in User Pool Client

**Solution:**
- Update CDK stack with correct callback URL:
  ```typescript
  callbackUrls: [
    'http://localhost:3000/api/auth/callback/cognito',
    `http://${fargateService.loadBalancer.loadBalancerDnsName}/api/auth/callback/cognito`,
  ],
  ```

- Redeploy:
  ```bash
  npm run cdk:deploy
  ```

---

## Advanced Configuration

### Adding a Custom Domain

1. **Register domain in Route 53** or import existing domain

2. **Create SSL certificate in ACM**:
   ```bash
   aws acm request-certificate \
     --domain-name finplan.example.com \
     --validation-method DNS
   ```

3. **Update CDK stack**:
   ```typescript
   import * as acm from 'aws-cdk-lib/aws-certificatemanager';
   import * as route53 from 'aws-cdk-lib/aws-route53';
   import * as targets from 'aws-cdk-lib/aws-route53-targets';

   // Import existing certificate
   const certificate = acm.Certificate.fromCertificateArn(
     this,
     'Certificate',
     'arn:aws:acm:us-east-1:123456789012:certificate/xxx'
   );

   // Add to Fargate service
   const fargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(
     this,
     'FinPlanService',
     {
       // ... existing config
       certificate,
       protocol: elbv2.ApplicationProtocol.HTTPS,
       redirectHTTP: true,
     }
   );

   // Create Route 53 record
   const hostedZone = route53.HostedZone.fromLookup(this, 'Zone', {
     domainName: 'example.com',
   });

   new route53.ARecord(this, 'AliasRecord', {
     zone: hostedZone,
     recordName: 'finplan',
     target: route53.RecordTarget.fromAlias(
       new targets.LoadBalancerTarget(fargateService.loadBalancer)
     ),
   });
   ```

### Enabling HTTPS

Add SSL certificate to the Application Load Balancer:

```typescript
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';

const certificate = acm.Certificate.fromCertificateArn(
  this,
  'Certificate',
  'arn:aws:acm:region:account:certificate/xxx'
);

const fargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(
  this,
  'FinPlanService',
  {
    // ... existing config
    certificate,
    protocol: elbv2.ApplicationProtocol.HTTPS,
    redirectHTTP: true,
  }
);
```

### Multi-AZ Deployment

For high availability, update to 2 or 3 availability zones:

```typescript
const vpc = new ec2.Vpc(this, 'FinPlanVPC', {
  maxAzs: 2,  // or 3
  natGateways: 0,
  // ... rest of config
});
```

**Cost impact (5 interface endpoints):**
- 1 AZ: ~$69/month (5 endpoints × $7.20 + base)
- 2 AZ: ~$105/month (current configuration)
- 3 AZ: ~$141/month (interface endpoints triple)

### Auto-Scaling Configuration

Customize auto-scaling behavior:

```typescript
const scaling = fargateService.service.autoScaleTaskCount({
  minCapacity: 1,
  maxCapacity: 20,  // Increase max capacity
});

// Scale on CPU
scaling.scaleOnCpuUtilization('CpuScaling', {
  targetUtilizationPercent: 50,  // More aggressive scaling
  scaleInCooldown: cdk.Duration.seconds(120),
  scaleOutCooldown: cdk.Duration.seconds(30),
});

// Scale on memory
scaling.scaleOnMemoryUtilization('MemoryScaling', {
  targetUtilizationPercent: 70,
  scaleInCooldown: cdk.Duration.seconds(120),
  scaleOutCooldown: cdk.Duration.seconds(30),
});

// Scale on request count
scaling.scaleOnRequestCount('RequestCountScaling', {
  requestsPerTarget: 1000,
  targetGroup: fargateService.targetGroup,
});
```

### Adding Environment Variables

Add environment variables to ECS tasks:

```typescript
environment: {
  NODE_ENV: 'production',
  PORT: '3000',
  DYNAMODB_TABLE_NAME: userDataTable.tableName,
  AWS_REGION: this.region,
  COGNITO_USER_POOL_ID: userPool.userPoolId,
  COGNITO_CLIENT_ID: userPoolClient.userPoolClientId,
  COGNITO_ISSUER: `https://cognito-idp.${this.region}.amazonaws.com/${userPool.userPoolId}`,
  // Add custom variables
  FEATURE_FLAG_REPORTS: 'true',
  LOG_LEVEL: 'info',
},
```

### Using Secrets Manager

Store sensitive values in Secrets Manager:

```typescript
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as ecs from 'aws-cdk-lib/aws-ecs';

const secret = secretsmanager.Secret.fromSecretNameV2(
  this,
  'NextAuthSecret',
  'finplan/nextauth-secret'
);

// In task definition
secrets: {
  NEXTAUTH_SECRET: ecs.Secret.fromSecretsManager(secret),
},
```

### CI/CD with GitHub Actions

The included `.github/workflows/deploy.yml` provides automated deployment on push to main:

```yaml
name: Deploy to AWS

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

      - name: Install dependencies
        run: npm ci

      - name: Deploy with CDK
        run: npm run cdk:deploy
```

**Setup:**
1. Add AWS credentials to GitHub Secrets:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`

2. Push to main branch:
   ```bash
   git push origin main
   ```

3. GitHub Actions will automatically deploy

---

## Cleanup / Destroy Stack

To delete all AWS resources:

```bash
npm run cdk:destroy
```

Or manually:
```bash
cd cdk
cdk destroy
```

**This will delete:**
- ECS cluster and tasks
- Application Load Balancer
- VPC and subnets
- VPC endpoints
- CloudWatch log groups
- **Note:** DynamoDB table and Cognito User Pool are retained by default

To delete DynamoDB table and Cognito manually:
```bash
aws dynamodb delete-table --table-name finplan-user-data
aws cognito-idp delete-user-pool --user-pool-id us-east-1_AbCdEfGhI
```

**Warning:** This will permanently delete all user data!

---

## Summary

You now have a complete understanding of:
- ✅ What infrastructure was deployed
- ✅ How to deploy your application
- ✅ How to manage and monitor your application
- ✅ How to optimize costs
- ✅ How to troubleshoot common issues
- ✅ How to configure advanced features

**Key Files:**
- `cdk/lib/finplan-stack.ts` - Infrastructure definition
- `Dockerfile` - Container image
- `app/api/auth/[...nextauth]/route.ts` - Authentication config
- `app/lib/data-store.ts` - DynamoDB data access

**Estimated Costs:**
- Current (2 AZ, 1 task): ~$105/month
- Production (2 AZ, 2 tasks): ~$120/month
- Production (2 AZ, 5 tasks): ~$160/month

**Next Steps:**
1. Deploy with `npm run cdk:deploy`
2. Test authentication and data storage
3. Configure custom domain (optional)
4. Set up CI/CD with GitHub Actions
5. Monitor costs in AWS Cost Explorer

Enjoy your fully deployed FinPlan application! 🚀
