import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as codedeploy from "aws-cdk-lib/aws-codedeploy";
import { Construct } from 'constructs';

export class BlueGreenDeploymentDemoStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const environmentType = this.node.tryGetContext("environmentType");
    const context = this.node.tryGetContext(environmentType);
    const aliasName = context["lambda"]["alias"];
    const stageName = context["lambda"]["stage"];

    const myLambda = new lambda.Function(this, "BgdFunction", {
      functionName: context["lambda"]["name"],
      handler: "handler.lambda_handler",
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset("src"),
      currentVersionOptions: {
        description: `Version deployed on ${new Date().toString()}`,
        removalPolicy: RemovalPolicy.RETAIN,
        retryAttempts: 1
      }
    });

    const newVersion = myLambda.currentVersion;
    newVersion.applyRemovalPolicy(RemovalPolicy.RETAIN);

    const alias = new lambda.Alias(this, "BgdAlias", {
      aliasName,
      version: newVersion
    });

    const lambdaRestApi = new apigateway.LambdaRestApi(this, "BgdLambdaRestAPI", {
      handler: alias,
      deployOptions: { stageName },
      description: "Gateway for blue-green deployment demo"
    });

    const errorAlarm = new cloudwatch.Alarm(this, 'BgdErrorAlarm', {
      alarmName: `${this.stackName}-canary-alarm`,
      alarmDescription: "The latest deployment errors > 0",
      metric: alias.metricErrors(),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD
    });

    const deploymentGroup = new codedeploy.LambdaDeploymentGroup(this, "BgdLambdaDeploymentGroup", {
      alias,
      deploymentConfig: codedeploy.LambdaDeploymentConfig.CANARY_10PERCENT_5MINUTES,
      alarms: [ errorAlarm ]
    });


  }
}
