import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

interface DataStackProps extends cdk.StackProps {
  stage: string;
}

/**
 * Storage layer — one DynamoDB table, single-table design, keyed per user.
 *
 * The user id is an anonymous device id the browser generates and keeps in
 * localStorage (v1 has no login). It is opaque, so the same key shape works
 * unchanged if a real account system later fills it with, say, a Cognito subject.
 *
 *   PK                SK                            what it is
 *   ---------------   ---------------------------   ----------------------------------
 *   USER#<uuid>       PROFILE                       first-seen / last-seen metadata
 *   USER#<uuid>       ATTEMPT#<iso8601>#<exam>      one finished attempt: score, percent,
 *                                                   per-domain breakdown, weak domains
 *   USER#<uuid>       DOMAIN#<exam>#<domain>        rolling per-domain aggregate:
 *                                                   attempts, questionsSeen, questionsCorrect
 *
 * Reads the API needs:
 *   attempt history for a user -> Query(PK=USER#<uuid>, SK begins_with ATTEMPT#)
 *                                 newest first (ISO timestamps sort lexically)
 *   per-domain progress        -> Query(PK=USER#<uuid>, SK begins_with DOMAIN#)
 *
 * Everything a single user touches is one partition, so every read is a single
 * Query. PAY_PER_REQUEST: a practice app's traffic is spiky and low, and this
 * avoids capacity planning.
 */
export class DataStack extends cdk.Stack {
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string, props: DataStackProps) {
    super(scope, id, props);
    const isProd = props.stage === 'prod';

    this.table = new dynamodb.Table(this, 'Attempts', {
      tableName: `ef-attempts-${props.stage}`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: isProd },
      removalPolicy: isProd ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    new cdk.CfnOutput(this, 'TableName', { value: this.table.tableName });
  }
}
