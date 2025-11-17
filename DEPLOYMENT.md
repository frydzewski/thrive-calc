# Deployment Guide

This guide explains how to deploy the ThriveCalc application to AWS using AWS CDK.

## Prerequisites

1. **AWS Account** - You need an active AWS account
2. **AWS CLI** - Install and configure the AWS CLI with your credentials
   ```bash
   aws configure
   ```
3. **Docker** - Required for building container images
4. **Node.js** - Version 18+ (already installed)

## Architecture

The CDK stack deploys the following infrastructure:

- **VPC** with public and private subnets across 2 availability zones
- **ECS Cluster** with Fargate for serverless container orchestration
- **Application Load Balancer** for distributing traffic
- **Auto Scaling** based on CPU and memory utilization (1-10 tasks)
- **CloudWatch Logs** for application logging
- **Container Image** built from your Next.js application

## Deployment Steps

### 1. Configure AWS Credentials

Ensure your AWS credentials are configured:

```bash
aws configure
```

You'll need:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., `us-east-1`)

### 2. Bootstrap CDK (First Time Only)

If this is your first time using CDK in your AWS account/region:

```bash
npm run cdk:bootstrap
```

This creates necessary resources for CDK deployments.

### 3. Review the Infrastructure

See what will be deployed:

```bash
npm run cdk:synth
```

This generates CloudFormation templates.

### 4. Preview Changes

Check what changes will be made:

```bash
npm run cdk:diff
```

### 5. Deploy to AWS

Deploy the application:

```bash
npm run cdk:deploy
```

This will:
1. Build your Next.js application
2. Create a Docker image
3. Push the image to Amazon ECR
4. Deploy all infrastructure
5. Start your application on ECS Fargate

**Deployment time**: ~10-15 minutes for initial deployment

### 6. Access Your Application

After deployment completes, you'll see outputs including:

```
Outputs:
ThriveCalcStack.LoadBalancerDNS = finpl-FinPl-xxx.us-east-1.elb.amazonaws.com
ThriveCalcStack.ServiceURL = http://finpl-FinPl-xxx.us-east-1.elb.amazonaws.com
```

Visit the ServiceURL in your browser to access your application.

## Managing Your Deployment

### View Logs

```bash
aws logs tail /ecs/thrivecalc --follow
```

### Update the Application

After making code changes:

```bash
npm run cdk:deploy
```

CDK will detect changes and update only what's necessary.

### Scale the Application

Edit `cdk/lib/thrivecalc-stack.ts` and modify:

```typescript
desiredCount: 2,  // Number of tasks
```

Or auto-scaling settings:

```typescript
scaling.scaleOnCpuUtilization('CpuScaling', {
  targetUtilizationPercent: 70,
  // ...
});
```

Then redeploy:

```bash
npm run cdk:deploy
```

### Destroy the Stack

To remove all resources and stop incurring charges:

```bash
npm run cdk:destroy
```

**Warning**: This will delete all resources including data.

## Cost Estimation

Approximate monthly costs for the deployed infrastructure:

- **Application Load Balancer**: ~$16-20/month
- **NAT Gateway**: ~$32/month
- **ECS Fargate** (2 tasks, 0.25 vCPU, 0.5GB each): ~$14-18/month
- **CloudWatch Logs**: ~$0.50-5/month (depends on volume)
- **Data Transfer**: Variable based on usage

**Estimated Total**: ~$65-80/month

To reduce costs:
- Use 1 task instead of 2
- Remove NAT Gateway (tasks must be in public subnet)
- Reduce log retention period

## Monitoring

### CloudWatch Metrics

View metrics in AWS Console:
1. Go to CloudWatch
2. Select Metrics → ECS
3. View CPU, Memory, Request Count, etc.

### Application Logs

Access logs via AWS Console:
1. Go to CloudWatch
2. Select Log groups → `/ecs/thrivecalc`

Or use CLI:
```bash
aws logs tail /ecs/thrivecalc --follow
```

## Custom Domain (Optional)

To add a custom domain:

1. Add Route53 and Certificate Manager to your CDK stack
2. Request an SSL certificate
3. Update the ALB to use HTTPS
4. Point your domain to the ALB

See [CDK Application Load Balanced Fargate Service docs](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ecs_patterns.ApplicationLoadBalancedFargateService.html) for details.

## Troubleshooting

### Container fails to start

Check logs:
```bash
aws logs tail /ecs/thrivecalc --follow
```

### Cannot connect to load balancer

- Wait 2-3 minutes for health checks to pass
- Check security groups allow inbound traffic on port 80
- Verify tasks are running: `aws ecs list-tasks --cluster thrivecalc-cluster`

### CDK deploy fails

- Ensure Docker is running
- Check AWS credentials are valid
- Verify sufficient IAM permissions

## Environment Variables

To add environment variables, edit `cdk/lib/thrivecalc-stack.ts`:

```typescript
environment: {
  NODE_ENV: 'production',
  PORT: '3000',
  // Add your variables here
  API_KEY: 'your-value',
},
```

For sensitive values, use AWS Secrets Manager or Systems Manager Parameter Store.

## CI/CD Integration

For automated deployments, consider:

- **GitHub Actions** with OIDC for AWS authentication
- **AWS CodePipeline** with CodeBuild
- **GitLab CI/CD** with AWS credentials

Example GitHub Actions workflow available on request.

## Support

For issues or questions:
- Check CloudWatch Logs
- Review CDK documentation: https://docs.aws.amazon.com/cdk/
- Review ECS Fargate documentation: https://docs.aws.amazon.com/ecs/
