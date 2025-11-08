# FinPlan - Financial Planning & Retirement App

A comprehensive financial planning and retirement web application built with Next.js, TypeScript, and Tailwind CSS. Plan your financial future with tools for retirement planning, savings goals tracking, portfolio management, and financial reporting.

## Features

- **AWS Cognito Authentication** - Secure sign-in with email/password
- **User Data Storage** - DynamoDB for fast, scalable data storage
- **Dashboard** - Overview of your financial health with key metrics and insights
- **Retirement Calculator** - Interactive calculator to project your retirement savings and income
- **Savings Goals** - Create and track multiple savings goals with progress monitoring
- **Portfolio Management** - Track your investment holdings, performance, and asset allocation
- **Financial Reports** - Comprehensive reports on savings rate, financial health, and personalized recommendations

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Authentication**: NextAuth.js with AWS Cognito
- **Data Storage**: Amazon DynamoDB
- **Infrastructure**: AWS CDK (ECS Fargate, DynamoDB)
- **Font**: Geist Sans & Geist Mono

## Getting Started

### Quick Start (Local Development)

1. **Install dependencies:**

```bash
npm install
```

2. **Set up environment variables:**

```bash
cp .env.example .env.local
```

For local development, you'll need to deploy the infrastructure first to get Cognito credentials:
```bash
npm run cdk:deploy
```

Then copy the Cognito values from the CDK output to your `.env.local` file.

3. **Run the development server:**

```bash
npm run dev
```

4. **Open the app:**

http://localhost:3000

You should see "Sign In" in the navigation!

## Project Structure

```
app/
├── components/
│   └── Navigation.tsx      # Main navigation component
├── dashboard/              # Dashboard page
├── retirement-calculator/  # Retirement calculator with interactive sliders
├── savings-goals/          # Savings goals tracker
├── portfolio/              # Investment portfolio tracker
├── reports/                # Financial reports and recommendations
├── layout.tsx              # Root layout with navigation
└── page.tsx                # Landing page
```

## Deployment

### Deploy to AWS with CDK

This application includes AWS CDK infrastructure as code for automated deployment to AWS ECS Fargate.

**Quick Start:**

```bash
# Automated deployment (recommended)
./scripts/deploy.sh

# Or manual deployment
npm run cdk:bootstrap  # First time only
npm run cdk:deploy
```

**What gets deployed:**
- VPC with public and private subnets
- ECS Fargate cluster with auto-scaling
- Application Load Balancer
- CloudWatch logging
- Container image from your Next.js app
- AWS Cognito User Pool for authentication
- DynamoDB table for user data

**Deployment time:** ~10-15 minutes

**Estimated cost:** ~$65-80/month

For detailed deployment instructions, see:
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Complete deployment guide
- [CDK_QUICK_REFERENCE.md](./CDK_QUICK_REFERENCE.md) - Quick command reference

### Alternative Deployment Options

You can also deploy using:
- AWS Amplify
- AWS Elastic Beanstalk
- Vercel (easiest for Next.js)
- Custom EC2 setup

## Authentication & Data Storage

This application includes:
- **AWS Cognito Authentication** - Secure user sign-in with email/password
- **Amazon DynamoDB** - Fast, scalable NoSQL database for user data
- **Automatic Scaling** - Pay-per-request billing with unlimited throughput

### Documentation

- **[COGNITO_AUTH_GUIDE.md](./COGNITO_AUTH_GUIDE.md)** - Complete Cognito authentication guide
- **[DYNAMODB_GUIDE.md](./DYNAMODB_GUIDE.md)** - DynamoDB data storage guide

### Key Features

- User-specific data isolation
- Single-digit millisecond performance
- Encrypted at rest with AWS-managed keys
- Point-in-time recovery enabled
- Very low cost (~$2-20/month for 1,000-10,000 users)

## License

MIT
