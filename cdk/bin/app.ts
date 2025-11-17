#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ThriveCalcStack } from '../lib/thrivecalc-stack';

const app = new cdk.App();

new ThriveCalcStack(app, 'ThriveCalcStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'ThriveCalc - Financial Planning & Retirement Application',
});

app.synth();
