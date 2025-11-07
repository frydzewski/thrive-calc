#!/bin/bash

set -e

echo "🚀 FinPlan Deployment Script"
echo "=============================="
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed"
    echo "   Please install it from: https://aws.amazon.com/cli/"
    exit 1
fi
echo "✅ AWS CLI is installed"

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running"
    echo "   Please start Docker Desktop or Docker daemon"
    exit 1
fi
echo "✅ Docker is running"

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials are not configured"
    echo "   Run: aws configure"
    exit 1
fi
echo "✅ AWS credentials are configured"

# Get AWS account and region info
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=$(aws configure get region || echo "us-east-1")

echo ""
echo "📋 Deployment Information:"
echo "   AWS Account: $ACCOUNT_ID"
echo "   Region: $REGION"
echo ""

# Ask for confirmation
read -p "Do you want to proceed with deployment? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled"
    exit 0
fi

echo ""
echo "🔍 Checking if CDK is bootstrapped..."

# Check if CDK is bootstrapped
if ! aws cloudformation describe-stacks --stack-name CDKToolkit --region $REGION &> /dev/null; then
    echo "⚠️  CDK is not bootstrapped in this region"
    read -p "   Bootstrap CDK now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "   Bootstrapping CDK..."
        npm run cdk:bootstrap
        echo "✅ CDK bootstrapped successfully"
    else
        echo "❌ CDK bootstrap is required for deployment"
        exit 1
    fi
else
    echo "✅ CDK is already bootstrapped"
fi

echo ""
echo "🏗️  Building and deploying application..."
echo ""

# Deploy the stack
npm run cdk:deploy

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Wait 2-3 minutes for the load balancer health checks"
echo "   2. Visit the ServiceURL shown in the outputs above"
echo "   3. Monitor logs: aws logs tail /ecs/finplan --follow"
echo ""
