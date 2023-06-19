#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { BlueGreenDeploymentDemoStack } from '../lib/blue-green-deployment-demo-stack';

const app = new cdk.App();
new BlueGreenDeploymentDemoStack(app, 'BlueGreenDeploymentDemoStack');
