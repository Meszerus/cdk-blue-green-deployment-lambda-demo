#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { BlueGreenDeploymentDemoStack } from '../lib/blue-green-deployment-demo-stack';

const app = new cdk.App();

const environmentType = app.node.tryGetContext("environmentType");
const environmentContext = app.node.tryGetContext(environmentType);
const region = environmentContext["region"];
const account = app.node.tryGetContext("account");
const tags = environmentContext["tags"];
const stackName = `${app.node.tryGetContext("prefix")}-${environmentType}`;

new BlueGreenDeploymentDemoStack(app, stackName, {
    env: { account, region },
    tags
});

app.synth();