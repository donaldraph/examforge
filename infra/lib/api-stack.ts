import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as path from 'path';

interface ApiStackProps extends cdk.StackProps {
  stage: string;
  table: dynamodb.Table;
}

/**
 * Compute + API. Four Python routes back the engine:
 *
 *   POST /attempts            grade a finished attempt server-side (against the
 *                             bundled answer key) and persist it + update the
 *                             per-domain aggregates. Returns the scored result.
 *   GET  /attempts?userId=    attempt history, newest first
 *   GET  /progress?userId=    per-domain rollup and weak domains
 *   GET  /health              liveness
 *
 * No API key and no login: v1 identifies a user by an opaque anonymous device id,
 * so every write is already "the user writing their own partition". The endpoints
 * are throttled at the stage instead. Grading is server-authoritative so a client
 * cannot simply claim a perfect score; the answer key is bundled into the lambda
 * from the canonical repo-root data/ (see scripts/sync-banks.mjs).
 */
export class ApiStack extends cdk.Stack {
  public readonly api: apigw.RestApi;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);
    const { table } = props;

    const lambdasPath = path.join(__dirname, '..', 'lambdas');
    const commonEnv = { TABLE_NAME: table.tableName };

    const makeFn = (name: string, handler: string) =>
      new lambda.Function(this, name, {
        runtime: lambda.Runtime.PYTHON_3_12,
        code: lambda.Code.fromAsset(lambdasPath),
        handler,
        timeout: cdk.Duration.seconds(10),
        memorySize: 256,
        environment: commonEnv,
        tracing: lambda.Tracing.ACTIVE,
      });

    const submitFn = makeFn('SubmitAttemptFn', 'submit_attempt.handler');
    const getAttemptsFn = makeFn('GetAttemptsFn', 'get_attempts.handler');
    const getProgressFn = makeFn('GetProgressFn', 'get_progress.handler');
    const healthFn = makeFn('HealthFn', 'health.handler');

    table.grantReadWriteData(submitFn);
    table.grantReadData(getAttemptsFn);
    table.grantReadData(getProgressFn);

    this.api = new apigw.RestApi(this, 'Api', {
      restApiName: `ef-${props.stage}`,
      deployOptions: {
        stageName: props.stage,
        tracingEnabled: true,
        throttlingRateLimit: 20,
        throttlingBurstLimit: 40,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS, // TODO: lock to the CloudFront origin at deploy
        allowMethods: apigw.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type'],
      },
    });

    const attempts = this.api.root.addResource('attempts');
    attempts.addMethod('POST', new apigw.LambdaIntegration(submitFn));
    attempts.addMethod('GET', new apigw.LambdaIntegration(getAttemptsFn));

    this.api.root
      .addResource('progress')
      .addMethod('GET', new apigw.LambdaIntegration(getProgressFn));

    this.api.root.addResource('health').addMethod('GET', new apigw.LambdaIntegration(healthFn));

    new cdk.CfnOutput(this, 'ApiUrl', { value: this.api.url });
  }
}
