import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as glue from 'aws-cdk-lib/aws-glue';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';

export class FinPlanStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create VPC with public and private subnets
    const vpc = new ec2.Vpc(this, 'FinPlanVPC', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
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

    // Create S3 bucket for user data (Parquet/Iceberg)
    const dataBucket = new s3.Bucket(this, 'FinPlanDataBucket', {
      bucketName: `finplan-data-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          // Archive old versions to Glacier after 90 days
          noncurrentVersionTransitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
          // Delete old versions after 1 year
          noncurrentVersionExpiration: cdk.Duration.days(365),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });

    // Create Glue Database for Iceberg tables
    const glueDatabase = new glue.CfnDatabase(this, 'FinPlanGlueDatabase', {
      catalogId: this.account,
      databaseInput: {
        name: 'finplan_db',
        description: 'FinPlan user data database',
        locationUri: `s3://${dataBucket.bucketName}/warehouse`,
      },
    });

    // Create Glue Table for user financial data (Iceberg format)
    new glue.CfnTable(this, 'UserFinancialDataTable', {
      catalogId: this.account,
      databaseName: glueDatabase.ref,
      tableInput: {
        name: 'user_financial_data',
        description: 'User financial data stored in Iceberg format',
        tableType: 'EXTERNAL_TABLE',
        parameters: {
          'table_type': 'ICEBERG',
          'format': 'parquet',
          'write.format.default': 'parquet',
        },
        storageDescriptor: {
          location: `s3://${dataBucket.bucketName}/warehouse/user_financial_data`,
          inputFormat: 'org.apache.iceberg.mr.hive.HiveIcebergInputFormat',
          outputFormat: 'org.apache.iceberg.mr.hive.HiveIcebergOutputFormat',
          serdeInfo: {
            serializationLibrary: 'org.apache.iceberg.mr.hive.HiveIcebergSerDe',
          },
          columns: [
            { name: 'user_id', type: 'string', comment: 'Google user ID' },
            { name: 'data_type', type: 'string', comment: 'Type of data: goal, portfolio_holding, etc.' },
            { name: 'record_id', type: 'string', comment: 'Unique record identifier' },
            { name: 'data', type: 'string', comment: 'JSON data payload' },
            { name: 'created_at', type: 'timestamp', comment: 'Record creation timestamp' },
            { name: 'updated_at', type: 'timestamp', comment: 'Record update timestamp' },
          ],
        },
      },
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
        desiredCount: 2,
        taskImageOptions: {
          image: ecs.ContainerImage.fromAsset(path.resolve(__dirname, '../..')),
          containerName: 'finplan-app',
          containerPort: 3000,
          logDriver: ecs.LogDrivers.awsLogs({
            streamPrefix: 'finplan',
            logGroup: logGroup,
          }),
          environment: {
            NODE_ENV: 'production',
            PORT: '3000',
            DATA_BUCKET_NAME: dataBucket.bucketName,
            GLUE_DATABASE_NAME: 'finplan_db',
            GLUE_TABLE_NAME: 'user_financial_data',
            AWS_REGION: this.region,
          },
        },
        publicLoadBalancer: true,
        assignPublicIp: false,
        taskSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      }
    );

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

    // Grant S3 and Glue permissions to ECS task role
    dataBucket.grantReadWrite(fargateService.taskDefinition.taskRole);

    fargateService.taskDefinition.taskRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'glue:GetDatabase',
          'glue:GetTable',
          'glue:GetTables',
          'glue:GetPartition',
          'glue:GetPartitions',
          'glue:BatchGetPartition',
        ],
        resources: [
          `arn:aws:glue:${this.region}:${this.account}:catalog`,
          `arn:aws:glue:${this.region}:${this.account}:database/${glueDatabase.ref}`,
          `arn:aws:glue:${this.region}:${this.account}:table/${glueDatabase.ref}/*`,
        ],
      })
    );

    // Outputs
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: fargateService.loadBalancer.loadBalancerDnsName,
      description: 'DNS name of the load balancer',
      exportName: 'FinPlanLoadBalancerDNS',
    });

    new cdk.CfnOutput(this, 'ServiceURL', {
      value: `http://${fargateService.loadBalancer.loadBalancerDnsName}`,
      description: 'URL of the FinPlan application',
      exportName: 'FinPlanServiceURL',
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

    new cdk.CfnOutput(this, 'DataBucketName', {
      value: dataBucket.bucketName,
      description: 'S3 bucket for user data',
      exportName: 'FinPlanDataBucketName',
    });

    new cdk.CfnOutput(this, 'GlueDatabase', {
      value: glueDatabase.ref,
      description: 'Glue database name',
      exportName: 'FinPlanGlueDatabase',
    });
  }
}
