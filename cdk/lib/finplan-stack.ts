import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as ecr_assets from 'aws-cdk-lib/aws-ecr-assets';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';
import * as path from 'path';

export class FinPlanStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create VPC with public and isolated subnets (no NAT Gateway)
    const vpc = new ec2.Vpc(this, 'FinPlanVPC', {
      maxAzs: 2,  // 2 AZs required for Application Load Balancer
      natGateways: 0,  // No NAT Gateway - use VPC endpoints instead
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Add VPC Endpoints for AWS services
    // DynamoDB Gateway Endpoint (free)
    vpc.addGatewayEndpoint('DynamoDBEndpoint', {
      service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
    });

    // S3 Gateway Endpoint (free) - needed for ECR image layers
    vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });

    // ECR API Interface Endpoint - for pulling images
    vpc.addInterfaceEndpoint('EcrApiEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.ECR,
      privateDnsEnabled: true,
    });

    // ECR Docker Interface Endpoint - for pulling image layers
    vpc.addInterfaceEndpoint('EcrDkrEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER,
      privateDnsEnabled: true,
    });

    // CloudWatch Logs Interface Endpoint - for logging
    vpc.addInterfaceEndpoint('CloudWatchLogsEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
      privateDnsEnabled: true,
    });

    // Secrets Manager Interface Endpoint - for accessing secrets
    vpc.addInterfaceEndpoint('SecretsManagerEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
      privateDnsEnabled: true,
    });

    // Cognito Identity Provider Interface Endpoint - for authentication
    vpc.addInterfaceEndpoint('CognitoIdpEndpoint', {
      service: new ec2.InterfaceVpcEndpointService(`com.amazonaws.${this.region}.cognito-idp`),
      privateDnsEnabled: true,
    });

    // Create ECS Cluster
    const cluster = new ecs.Cluster(this, 'FinPlanCluster', {
      vpc,
      clusterName: 'finplan-cluster',
      containerInsights: true,
    });

    // Create CloudWatch Log Group
    const logGroup = new logs.LogGroup(this, 'FinPlanLogGroup', {
      logGroupName: '/ecs/finplan',
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create DynamoDB table for user data
    const userDataTable = new dynamodb.Table(this, 'FinPlanUserData', {
      tableName: 'finplan-user-data',
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'recordKey',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Changed to DESTROY for easier development cleanup
      timeToLiveAttribute: 'ttl',
    });

    // Add GSI for querying by data type
    userDataTable.addGlobalSecondaryIndex({
      indexName: 'DataTypeIndex',
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'dataType',
        type: dynamodb.AttributeType.STRING,
      },
    });

    // Create secret for NextAuth
    const nextAuthSecret = new secretsmanager.Secret(this, 'NextAuthSecret', {
      secretName: 'finplan-nextauth-secret',
      description: 'NextAuth.js secret for session encryption',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({}),
        generateStringKey: 'secret',
        excludePunctuation: true,
        includeSpace: false,
        passwordLength: 32,
      },
    });

    // Import existing Cognito client secret from Secrets Manager
    const cognitoClientSecret = secretsmanager.Secret.fromSecretCompleteArn(
      this,
      'CognitoClientSecret',
      'arn:aws:secretsmanager:us-east-1:398106244340:secret:finplan-cognito-client-secret-pfdqpY'
    );

    // Create Cognito User Pool
    const userPool = new cognito.UserPool(this, 'FinPlanUserPool', {
      userPoolName: 'finplan-users',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
        username: false,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: false,
        },
        givenName: {
          required: false,
          mutable: true,
        },
        familyName: {
          required: false,
          mutable: true,
        },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Changed to DESTROY for easier development cleanup
    });

    // Create Cognito User Pool Client (initially with localhost only)
    const userPoolClient = new cognito.UserPoolClient(this, 'FinPlanUserPoolClient', {
      userPool,
      userPoolClientName: 'finplan-web-client',
      generateSecret: true,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: [
          'http://localhost:3000/api/auth/callback/cognito',
        ],
        logoutUrls: [
          'http://localhost:3000',
        ],
      },
      preventUserExistenceErrors: true,
    });

    // Create Cognito User Pool Domain
    const userPoolDomain = userPool.addDomain('FinPlanUserPoolDomain', {
      cognitoDomain: {
        domainPrefix: `finplan-${this.account}`,
      },
    });

    // Import existing Route53 Hosted Zone for thrivecalc.com
    const hostedZone = route53.HostedZone.fromLookup(this, 'ThriveCalcHostedZone', {
      domainName: 'thrivecalc.com',
    });

    // Create ACM Certificate with automatic DNS validation
    const certificate = new certificatemanager.Certificate(this, 'ThriveCalcCertificate', {
      domainName: 'thrivecalc.com',
      subjectAlternativeNames: ['www.thrivecalc.com'],
      validation: certificatemanager.CertificateValidation.fromDns(hostedZone),
    });

    // Create Fargate Service with Application Load Balancer
    const fargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(
      this,
      'FinPlanService',
      {
        cluster,
        serviceName: 'finplan-service',
        memoryLimitMiB: 512,
        cpu: 256,
        desiredCount: 1,
        certificate: certificate,
        domainName: 'thrivecalc.com',
        domainZone: hostedZone,
        redirectHTTP: true,
        protocol: elbv2.ApplicationProtocol.HTTPS,
        taskImageOptions: {
          image: ecs.ContainerImage.fromAsset(path.resolve(__dirname, '../..'), {
            platform: ecr_assets.Platform.LINUX_AMD64, // Ensure x86_64 for ECS Fargate
          }),
          containerName: 'finplan-app',
          containerPort: 3000,
          logDriver: ecs.LogDrivers.awsLogs({
            streamPrefix: 'finplan',
            logGroup: logGroup,
          }),
          environment: {
            NODE_ENV: 'production',
            PORT: '3000',
            DYNAMODB_TABLE_NAME: userDataTable.tableName,
            AWS_REGION: this.region,
            COGNITO_USER_POOL_ID: userPool.userPoolId,
            COGNITO_CLIENT_ID: userPoolClient.userPoolClientId,
            COGNITO_ISSUER: `https://cognito-idp.${this.region}.amazonaws.com/${userPool.userPoolId}`,
            // NEXTAUTH_URL will be added via escape hatch below
          },
          secrets: {
            NEXTAUTH_SECRET: ecs.Secret.fromSecretsManager(nextAuthSecret, 'secret'),
            COGNITO_CLIENT_SECRET: ecs.Secret.fromSecretsManager(cognitoClientSecret),
          },
        },
        publicLoadBalancer: true,
        assignPublicIp: true,
        taskSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
      }
    );

    // Add www subdomain pointing to ALB
    new route53.ARecord(this, 'WwwARecord', {
      zone: hostedZone,
      recordName: 'www',
      target: route53.RecordTarget.fromAlias(
        new targets.LoadBalancerTarget(fargateService.loadBalancer)
      ),
    });

    // Add NEXTAUTH_URL with HTTPS and domain name
    const container = fargateService.taskDefinition.defaultContainer!;
    container.addEnvironment(
      'NEXTAUTH_URL',
      'https://thrivecalc.com'
    );

    // Update Cognito User Pool Client with HTTPS callback URLs
    const cfnUserPoolClient = userPoolClient.node.defaultChild as cognito.CfnUserPoolClient;
    cfnUserPoolClient.callbackUrLs = [
      'http://localhost:3000/api/auth/callback/cognito',
      'https://thrivecalc.com/api/auth/callback/cognito'
    ];
    cfnUserPoolClient.logoutUrLs = [
      'http://localhost:3000',
      'https://thrivecalc.com'
    ];

    // Configure health check
    fargateService.targetGroup.configureHealthCheck({
      path: '/',
      interval: cdk.Duration.seconds(30),
      timeout: cdk.Duration.seconds(5),
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 3,
    });

    // Configure auto scaling
    const scaling = fargateService.service.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 10,
    });

    // Scale based on CPU utilization
    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    // Scale based on memory utilization
    scaling.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: 80,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    // Grant DynamoDB permissions to ECS task role
    userDataTable.grantReadWriteData(fargateService.taskDefinition.taskRole);

    // Grant Secrets Manager permissions to ECS task role (for runtime access)
    nextAuthSecret.grantRead(fargateService.taskDefinition.taskRole);
    cognitoClientSecret.grantRead(fargateService.taskDefinition.taskRole);

    // Grant Secrets Manager permissions to ECS execution role (for container startup)
    nextAuthSecret.grantRead(fargateService.taskDefinition.executionRole!);
    cognitoClientSecret.grantRead(fargateService.taskDefinition.executionRole!);

    // Outputs
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: fargateService.loadBalancer.loadBalancerDnsName,
      description: 'DNS name of the load balancer',
      exportName: 'FinPlanLoadBalancerDNS',
    });

    new cdk.CfnOutput(this, 'ServiceURL', {
      value: 'https://thrivecalc.com',
      description: 'URL of the FinPlan application',
      exportName: 'FinPlanServiceURL',
    });

    new cdk.CfnOutput(this, 'CertificateArn', {
      value: certificate.certificateArn,
      description: 'ACM Certificate ARN',
      exportName: 'FinPlanCertificateArn',
    });

    new cdk.CfnOutput(this, 'HostedZoneId', {
      value: hostedZone.hostedZoneId,
      description: 'Route53 Hosted Zone ID (existing zone imported)',
      exportName: 'FinPlanHostedZoneId',
    });

    new cdk.CfnOutput(this, 'ClusterName', {
      value: cluster.clusterName,
      description: 'Name of the ECS cluster',
      exportName: 'FinPlanClusterName',
    });

    new cdk.CfnOutput(this, 'ServiceName', {
      value: fargateService.service.serviceName,
      description: 'Name of the ECS service',
      exportName: 'FinPlanServiceName',
    });

    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: userDataTable.tableName,
      description: 'DynamoDB table for user data',
      exportName: 'FinPlanDynamoDBTableName',
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
      exportName: 'FinPlanUserPoolId',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
      exportName: 'FinPlanUserPoolClientId',
    });

    new cdk.CfnOutput(this, 'UserPoolDomain', {
      value: userPoolDomain.domainName,
      description: 'Cognito User Pool Domain',
      exportName: 'FinPlanUserPoolDomain',
    });

    new cdk.CfnOutput(this, 'CognitoIssuer', {
      value: `https://cognito-idp.${this.region}.amazonaws.com/${userPool.userPoolId}`,
      description: 'Cognito Issuer URL for NextAuth',
      exportName: 'FinPlanCognitoIssuer',
    });

    new cdk.CfnOutput(this, 'PostDeploymentInstructions', {
      value: [
        'IMPORTANT: Complete these post-deployment steps:',
        '1. Retrieve Cognito Client Secret:',
        `   aws cognito-idp describe-user-pool-client --user-pool-id ${userPool.userPoolId} --client-id ${userPoolClient.userPoolClientId} --query UserPoolClient.ClientSecret --output text`,
        '2. Store it in AWS Secrets Manager:',
        '   aws secretsmanager create-secret --name finplan-cognito-client-secret --secret-string "<secret-from-step-1>"',
        '3. Update ECS task definition to include COGNITO_CLIENT_SECRET from Secrets Manager',
        'Note: NEXTAUTH_URL and Cognito callback URLs are now automatically configured with the load balancer DNS',
      ].join('\n   '),
      description: 'Post-deployment configuration steps',
    });
  }
}
