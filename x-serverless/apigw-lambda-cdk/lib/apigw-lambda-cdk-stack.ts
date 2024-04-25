import { CfnOutput, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import {
  Deployment,
  IResource,
  LambdaIntegration,
  LogGroupLogDestination,
  MethodLoggingLevel,
  RestApi,
  Stage,
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
      deployOptions: {
        stageName: 'prod',
        description: 'Deployment for prod stage',
        accessLogDestination: new LogGroupLogDestination(
          new LogGroup(this, 'lab-api-prod-access-log', {
            retention: 7,
            removalPolicy: RemovalPolicy.DESTROY,
          }),
        ),
        loggingLevel: MethodLoggingLevel.INFO,
      },
    });

    // Create dev stage
    const labTodosManagementAPIDevDeployment = new Deployment(
      this,
      'lab-todos-management-api-dev-deployment',
      {
        api: labTodosManagementAPI,
        description: 'Deployment for dev stage',
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
      loggingLevel: MethodLoggingLevel.INFO,
    });

    // Function to create lambda and its integration
    const createLambdaAndIntegration = (id: string, handler: string) => {
      const lambda = new NodejsFunction(this, `lab-${id}-lambda`, {
        entry: 'src/index.ts',
        handler: handler,
        bundling: {
          minify: true,
        },
        architecture: Architecture.ARM_64,
        logGroup: new LogGroup(this, `lab-${id}-lambda-log-group`, {
          retention: 7,
          removalPolicy: RemovalPolicy.DESTROY,
        }),
      });
      return new LambdaIntegration(lambda, {});
    };

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
          { method: 'GET', lambda: lambdas.todos },
          { method: 'POST', lambda: lambdas.createTodo },
        ],
      },
      {
        path: '/todos/{id}',
        integrations: [
          { method: 'GET', lambda: lambdas.todoById },
          { method: 'PUT', lambda: lambdas.updateTodo },
          { method: 'DELETE', lambda: lambdas.deleteTodo },
        ],
      },
    ];

    // Add methods to resources
    resources.forEach(({ path, integrations }) => {
      let integrationResource: IResource = labTodosManagementAPI.root.resourceForPath(path);
      integrations.forEach(({ method, lambda }) => {
        integrationResource.addMethod(method, lambda);
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
