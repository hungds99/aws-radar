export const handler = async (event: any, context: any) => {
  console.log('AUTH_EVENT: ', event);
  console.log('AUTH_CONTEXT: ', context);

  const token = event?.authorizationToken?.split(' ')[1];

  let authResponse = null;

  switch (token) {
    case 'allow':
      authResponse = generatePolicy('user', 'Allow', event.methodArn);
      break;
    case 'deny':
      authResponse = generatePolicy('user', 'Deny', event.methodArn);
      break;
  }

  console.log('AUTH_RESPONSE: ', authResponse);

  return authResponse;
};

// Help function to generate an IAM policy
const generatePolicy = function (principalId: any, effect: any, resource: any) {
  const authResponse: any = {};

  authResponse.principalId = principalId;
  if (effect && resource) {
    const policyDocument: any = {};
    policyDocument.Version = '2012-10-17';
    policyDocument.Statement = [];
    const statementOne: any = {};
    statementOne.Action = 'execute-api:Invoke';
    statementOne.Effect = effect;
    statementOne.Resource = resource;
    policyDocument.Statement[0] = statementOne;
    authResponse.policyDocument = policyDocument;
  }

  // Optional output with custom properties of the String, Number or Boolean type.
  authResponse.context = {
    errorMessage: 'You are not authorized to access this resource',
  };
  return authResponse;
};
