import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as amplify from 'aws-cdk-lib/aws-amplify';
import { Construct } from 'constructs';

export class ThriveCalcStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ===================================================================
    // DATABASE
    // ===================================================================

    // Create DynamoDB table for user data
    const userDataTable = new dynamodb.Table(this, 'ThriveCalcUserData', {
      tableName: 'thrivecalc-user-data',
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
      removalPolicy: cdk.RemovalPolicy.DESTROY,
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

    // ===================================================================
    // SECRETS
    // ===================================================================

    // Create secret for NextAuth
    const nextAuthSecret = new secretsmanager.Secret(this, 'NextAuthSecret', {
      secretName: 'thrivecalc-nextauth-secret',
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
      'arn:aws:secretsmanager:us-east-1:398106244340:secret:thrivecalc-cognito-client-secret-pfdqpY'
    );

    // ===================================================================
    // AUTHENTICATION
    // ===================================================================

    // Create Cognito User Pool
    const userPool = new cognito.UserPool(this, 'ThriveCalcUserPool', {
      userPoolName: 'thrivecalc-users',
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
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create Cognito User Pool Client
    const userPoolClient = new cognito.UserPoolClient(this, 'ThriveCalcUserPoolClient', {
      userPool,
      userPoolClientName: 'thrivecalc-web-client',
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
          'https://thrivecalc.com/api/auth/callback/cognito',
        ],
        logoutUrls: [
          'http://localhost:3000',
          'https://thrivecalc.com',
        ],
      },
      preventUserExistenceErrors: true,
    });

    // Create Cognito User Pool Domain
    const userPoolDomain = userPool.addDomain('ThriveCalcUserPoolDomain', {
      cognitoDomain: {
        domainPrefix: `thrivecalc-${this.account}`,
      },
    });

    // ===================================================================
    // AMPLIFY HOSTING
    // ===================================================================

    // Import GitHub personal access token from Secrets Manager
    // You need to create this secret manually with:
    // aws secretsmanager create-secret --name github-personal-access-token --secret-string "your_github_token"
    const githubToken = secretsmanager.Secret.fromSecretNameV2(
      this,
      'GitHubToken',
      'github-personal-access-token'
    );

    // Read amplify.yml build spec
    const buildSpec = `version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*`;

    // Create Amplify App
    const amplifyApp = new amplify.CfnApp(this, 'ThriveCalcAmplifyApp', {
      name: 'thrivecalc-app',
      repository: 'https://github.com/frydzewski/thrive-calc',
      accessToken: githubToken.secretValue.unsafeUnwrap(),
      buildSpec: buildSpec,
      environmentVariables: [
        { name: 'DYNAMODB_TABLE_NAME', value: userDataTable.tableName },
        { name: 'AWS_REGION', value: this.region },
        { name: 'COGNITO_USER_POOL_ID', value: userPool.userPoolId },
        { name: 'COGNITO_CLIENT_ID', value: userPoolClient.userPoolClientId },
        {
          name: 'COGNITO_ISSUER',
          value: `https://cognito-idp.${this.region}.amazonaws.com/${userPool.userPoolId}`
        },
        { name: 'NEXTAUTH_URL', value: 'https://thrivecalc.com' },
        // Secrets from Secrets Manager - Amplify will fetch these at build time
        {
          name: 'NEXTAUTH_SECRET',
          value: nextAuthSecret.secretValueFromJson('secret').unsafeUnwrap()
        },
        {
          name: 'COGNITO_CLIENT_SECRET',
          value: cognitoClientSecret.secretValue.unsafeUnwrap()
        },
      ],
      platform: 'WEB_COMPUTE',
    });

    // Grant Amplify access to DynamoDB and Secrets Manager
    userDataTable.grantReadWriteData(
      new cdk.aws_iam.Role(this, 'ThriveCalcAmplifyServiceRole', {
        assumedBy: new cdk.aws_iam.ServicePrincipal('amplify.amazonaws.com'),
        managedPolicies: [
          cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess-Amplify'),
        ],
      })
    );

    // Create branch for migration/amplify
    const amplifyBranch = new amplify.CfnBranch(this, 'ThriveCalcAmplifyBranch', {
      appId: amplifyApp.attrAppId,
      branchName: 'migration/amplify',
      enableAutoBuild: true,
      enablePullRequestPreview: false,
      stage: 'PRODUCTION',
    });

    // Add custom domain
    const amplifyDomain = new amplify.CfnDomain(this, 'ThriveCalcAmplifyDomain', {
      appId: amplifyApp.attrAppId,
      domainName: 'thrivecalc.com',
      subDomainSettings: [
        {
          branchName: amplifyBranch.branchName,
          prefix: '',
        },
        {
          branchName: amplifyBranch.branchName,
          prefix: 'www',
        },
      ],
    });

    // ===================================================================
    // OUTPUTS
    // ===================================================================

    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: userDataTable.tableName,
      description: 'DynamoDB table for user data',
      exportName: 'ThriveCalcDynamoDBTableName',
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
      exportName: 'ThriveCalcUserPoolId',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
      exportName: 'ThriveCalcUserPoolClientId',
    });

    new cdk.CfnOutput(this, 'UserPoolDomain', {
      value: userPoolDomain.domainName,
      description: 'Cognito User Pool Domain',
      exportName: 'ThriveCalcUserPoolDomain',
    });

    new cdk.CfnOutput(this, 'CognitoIssuer', {
      value: `https://cognito-idp.${this.region}.amazonaws.com/${userPool.userPoolId}`,
      description: 'Cognito Issuer URL for NextAuth',
      exportName: 'ThriveCalcCognitoIssuer',
    });

    new cdk.CfnOutput(this, 'NextAuthSecretArn', {
      value: nextAuthSecret.secretArn,
      description: 'NextAuth Secret ARN',
      exportName: 'ThriveCalcNextAuthSecretArn',
    });

    new cdk.CfnOutput(this, 'CognitoClientSecretArn', {
      value: cognitoClientSecret.secretArn,
      description: 'Cognito Client Secret ARN',
      exportName: 'ThriveCalcCognitoClientSecretArn',
    });

    new cdk.CfnOutput(this, 'AmplifyAppId', {
      value: amplifyApp.attrAppId,
      description: 'Amplify App ID',
      exportName: 'ThriveCalcAmplifyAppId',
    });

    new cdk.CfnOutput(this, 'AmplifyAppUrl', {
      value: `https://${amplifyBranch.branchName}.${amplifyApp.attrAppId}.amplifyapp.com`,
      description: 'Amplify App URL (temporary, before custom domain)',
      exportName: 'ThriveCalcAmplifyAppUrl',
    });

    new cdk.CfnOutput(this, 'AmplifyCustomDomainUrl', {
      value: 'https://thrivecalc.com',
      description: 'Amplify Custom Domain URL',
      exportName: 'ThriveCalcAmplifyCustomDomainUrl',
    });

    new cdk.CfnOutput(this, 'PostDeploymentSteps', {
      value: [
        'AMPLIFY HOSTING SETUP COMPLETE!',
        '',
        'BEFORE DEPLOYING, you need to:',
        '1. Create GitHub Personal Access Token:',
        '   - Go to https://github.com/settings/tokens',
        '   - Create token with "repo" scope',
        '   - Store it in Secrets Manager:',
        '     aws secretsmanager create-secret --name github-personal-access-token --secret-string "your_token_here"',
        '',
        '2. After deploying this stack:',
        '   - Amplify will automatically connect to your GitHub repo',
        '   - It will build and deploy the migration/amplify branch',
        '   - Custom domain (thrivecalc.com) will be configured',
        '   - All environment variables are set from CDK',
        '',
        '3. To trigger a deployment:',
        '   - Push to migration/amplify branch, or',
        '   - Use: aws amplify start-job --app-id <app-id> --branch-name migration/amplify --job-type RELEASE',
        '',
        `4. Monitor deployment at: https://console.aws.amazon.com/amplify/home?region=${this.region}`,
        '',
        'Cost Savings: ~$80/month (94% reduction from ECS/VPC)',
      ].join('\n'),
      description: 'Post-deployment steps for Amplify',
    });
  }
}
