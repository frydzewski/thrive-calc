# CDK Quick Reference

Quick reference for common CDK commands and operations.

## Initial Setup

```bash
# Install dependencies
npm install

# Configure AWS credentials (if not already done)
aws configure

# Bootstrap CDK (first time only, per account/region)
npm run cdk:bootstrap
```

## Deployment Commands

```bash
# Deploy the application to AWS
npm run cdk:deploy

# Deploy with approval for security changes
npm run cdk deploy

# Destroy all resources (cleanup)
npm run cdk:destroy

# View what will change (before deploying)
npm run cdk:diff

# Generate CloudFormation template
npm run cdk:synth
```

## Using the Helper Script

```bash
# Automated deployment with checks
./scripts/deploy.sh
```

This script:
- ✅ Checks AWS CLI is installed
- ✅ Checks Docker is running
- ✅ Validates AWS credentials
- ✅ Bootstraps CDK if needed
- 🚀 Deploys the application

## Docker Commands

```bash
# Build Docker image locally
npm run docker:build

# Run container locally
npm run docker:run

# Then visit http://localhost:3000
```

## AWS CLI Commands

### View Application Logs

```bash
# Tail logs in real-time
aws logs tail /ecs/thrivecalc --follow

# Get last 100 log lines
aws logs tail /ecs/thrivecalc --since 1h
```

### Check Service Status

```bash
# List running tasks
aws ecs list-tasks --cluster thrivecalc-cluster

# Describe service
aws ecs describe-services \
  --cluster thrivecalc-cluster \
  --services thrivecalc-service
```

### View Load Balancer

```bash
# Get load balancer DNS
aws cloudformation describe-stacks \
  --stack-name ThriveCalcStack \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
  --output text
```

### Update Task Count (Manual Scaling)

```bash
# Scale to 3 tasks
aws ecs update-service \
  --cluster thrivecalc-cluster \
  --service thrivecalc-service \
  --desired-count 3
```

## Common Workflows

### Deploy New Code

```bash
# 1. Make code changes
# 2. Test locally
npm run dev

# 3. Deploy to AWS
npm run cdk:deploy
```

### Check What Changed

```bash
# View differences before deploying
npm run cdk:diff
```

### Rollback Changes

```bash
# Option 1: Redeploy previous code
git checkout <previous-commit>
npm run cdk:deploy

# Option 2: Destroy and recreate (loses data)
npm run cdk:destroy
npm run cdk:deploy
```

### Update Environment Variables

```bash
# 1. Edit cdk/lib/thrivecalc-stack.ts
# 2. Update the environment section
# 3. Redeploy
npm run cdk:deploy
```

### View Costs

```bash
# Use AWS Cost Explorer in Console
# Or CLI:
aws ce get-cost-and-usage \
  --time-period Start=2025-01-01,End=2025-02-01 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --filter file://filter.json
```

## Stack Outputs

After deployment, get outputs:

```bash
aws cloudformation describe-stacks \
  --stack-name ThriveCalcStack \
  --query 'Stacks[0].Outputs'
```

## Troubleshooting

### CDK Deploy Fails

```bash
# Check CDK version
npx cdk --version

# Clear CDK cache
rm -rf cdk.out

# Try again
npm run cdk:deploy
```

### Container Won't Start

```bash
# Check logs
aws logs tail /ecs/thrivecalc --follow

# Test Docker image locally
npm run docker:build
npm run docker:run
```

### Can't Access Load Balancer

```bash
# Get load balancer DNS
aws cloudformation describe-stacks \
  --stack-name ThriveCalcStack \
  --query 'Stacks[0].Outputs'

# Wait 2-3 minutes for health checks
# Check target health
aws elbv2 describe-target-health \
  --target-group-arn <your-target-group-arn>
```

## Resource Names

Default resource names created by CDK:

- **Stack**: `ThriveCalcStack`
- **Cluster**: `thrivecalc-cluster`
- **Service**: `thrivecalc-service`
- **Log Group**: `/ecs/thrivecalc`
- **VPC**: `ThriveCalcStack/ThriveCalcVPC`

## Cost Optimization Tips

```bash
# Reduce to 1 task (from 2)
# Edit cdk/lib/thrivecalc-stack.ts:
desiredCount: 1

# Then redeploy
npm run cdk:deploy
```

## Clean Up

```bash
# Remove all resources
npm run cdk:destroy

# Confirm deletion
# Type 'y' when prompted
```

**Warning**: This deletes all resources and data.

## Further Reading

- [CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [CDK API Reference](https://docs.aws.amazon.com/cdk/api/v2/)
- [ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/)
