import { CfnOutput, Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import {
  Deployment,
  GatewayResponse,
  IResource,
  LambdaIntegration,
  LogGroupLogDestination,
  ResponseType,
  RestApi,
  Stage,
  TokenAuthorizer,
} from 'aws-cdk-lib/aws-apigateway';
import { Architecture } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { LogGroup } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export class ApigwLambdaCdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create RestAPI
    const labTodosManagementAPI = new RestApi(this, 'lab-todos-management-api', {
      restApiName: 'lab-todos-management-api',
      description: 'This is a lab API for todos management',
      deploy: true,
      retainDeployments: true,
      deployOptions: {
        stageName: 'prod',
        description: 'Deployment for prod stage',
        accessLogDestination: new LogGroupLogDestination(
          new LogGroup(this, 'lab-api-prod-access-log', {
            retention: 7,
            removalPolicy: RemovalPolicy.DESTROY,
          }),
        ),
      },
    });

    // Create dev stage
    const labTodosManagementAPIDevDeployment = new Deployment(
      this,
      'lab-todos-management-api-dev-deployment',
      {
        api: labTodosManagementAPI,
        description: 'Deployment for dev stage',
        retainDeployments: true,
      },
    );
    const labTodosManagementAPIDevStage = new Stage(this, 'lab-todos-management-api-dev-stage', {
      deployment: labTodosManagementAPIDevDeployment,
      stageName: 'dev',
      accessLogDestination: new LogGroupLogDestination(
        new LogGroup(this, 'lab-api-dev-access-log', {
          retention: 7,
          removalPolicy: RemovalPolicy.DESTROY,
        }),
      ),
    });

    // Custom gateway response
    new GatewayResponse(this, 'lab-todos-management-api-gateway-403-response', {
      restApi: labTodosManagementAPI,
      type: ResponseType.DEFAULT_4XX,
      statusCode: '403',
      templates: {
        'application/json': `{
          "message": "$context.authorizer.errorMessage"
        }`,
      },
    });

    // Function to create lambda and its integration
    const createLambdaAndIntegration = (id: string, handler: string) => {
      const lambda = new NodejsFunction(this, `lab-${id}-lambda`, {
        entry: 'src/index.ts',
        handler: handler,
        bundling: { minify: false },
        architecture: Architecture.ARM_64,
        logGroup: new LogGroup(this, `lab-${id}-lambda-log-group`, {
          retention: 7,
          removalPolicy: RemovalPolicy.DESTROY,
        }),
      });
      return new LambdaIntegration(lambda, {});
    };

    const createTokenAuthorizerLambda = (id: string, handler: string) => {
      const lambda = new NodejsFunction(this, `lab-${id}-lambda`, {
        entry: 'src/auth/index.ts',
        handler: handler,
        bundling: { minify: false },
        architecture: Architecture.ARM_64,
        logGroup: new LogGroup(this, `lab-${id}-lambda-log-group`, {
          retention: 7,
          removalPolicy: RemovalPolicy.DESTROY,
        }),
      });
      return new TokenAuthorizer(this, `lab-${id}-authorizer`, {
        handler: lambda,
        authorizerName: 'lab-jwt-token-authorizer',
        resultsCacheTtl: Duration.seconds(0),
      });
    };
    const jwtTokenAuthorizer = createTokenAuthorizerLambda('jwt-token-authorizer', 'handler');

    // Define all your lambdas and their integrations
    const lambdas = {
      helloWorld: createLambdaAndIntegration('hello-world', 'handler'),
      todos: createLambdaAndIntegration('todos', 'todos'),
      todoById: createLambdaAndIntegration('todo-by-id', 'todoById'),
      createTodo: createLambdaAndIntegration('create-todo', 'createTodo'),
      updateTodo: createLambdaAndIntegration('update-todo', 'updateTodo'),
      deleteTodo: createLambdaAndIntegration('delete-todo', 'deleteTodo'),
    };

    // Define your resources and their methods
    const resources = [
      {
        path: '/',
        integrations: [{ method: 'GET', lambda: lambdas.helloWorld }],
      },
      {
        path: '/todos',
        integrations: [
          {
            method: 'GET',
            lambda: lambdas.todos,
            options: { authorizer: jwtTokenAuthorizer },
          },
          {
            method: 'POST',
            lambda: lambdas.createTodo,
            options: { authorizer: jwtTokenAuthorizer },
          },
        ],
      },
      {
        path: '/todos/{id}',
        integrations: [
          { method: 'GET', lambda: lambdas.todoById, options: { authorizer: jwtTokenAuthorizer } },
          {
            method: 'PUT',
            lambda: lambdas.updateTodo,
            options: { authorizer: jwtTokenAuthorizer },
          },
          {
            method: 'DELETE',
            lambda: lambdas.deleteTodo,
            options: { authorizer: jwtTokenAuthorizer },
          },
        ],
      },
    ];

    // Add methods to resources
    resources.forEach(({ path, integrations }) => {
      let integrationResource: IResource = labTodosManagementAPI.root.resourceForPath(path);
      integrations.forEach(({ method, lambda, options }: any) => {
        integrationResource.addMethod(method, lambda, {
          authorizer: options?.authorizer,
        });
      });
    });

    // Output the API Gateway URL
    new CfnOutput(this, 'lab-api-gateway-prod-url', {
      key: 'apigwUrlProd',
      value: labTodosManagementAPI.urlForPath(),
      description: 'API Gateway Production URL',
    });
    new CfnOutput(this, 'lab-api-gateway-dev-url', {
      key: 'apigwUrlDev',
      value: labTodosManagementAPIDevStage.urlForPath(),
      description: 'API Gateway Development URL',
    });
    new CfnOutput(this, 'lab-api-gateway-latest-deployment-id', {
      key: 'apigwLatestDeploymentId',
      value: labTodosManagementAPI.latestDeployment?.deploymentId || '',
      description: 'API Gateway Latest Deployment ID',
    });
    new CfnOutput(this, 'lab-api-gateway-dev-deployment-id', {
      key: 'apigwDevDeploymentId',
      value: labTodosManagementAPIDevDeployment.deploymentId,
      description: 'API Gateway Development Deployment ID',
    });
  }
}
