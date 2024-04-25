export const handler = async (event: any, context: any, callback: any) => {
  console.log('AUTH_EVENT: ', event);
  console.log('AUTH_CONTEXT: ', context);

  const token = event?.authorizationToken?.split(' ')[1];

  switch (token) {
    case 'allow':
      return generatePolicy('user', 'Allow', event.methodArn);
    case 'deny':
      return generatePolicy('user', 'Deny', event.methodArn);
    case 'unauthorized':
      callback('Unauthorized'); // Return a 401 Unauthorized response
      break;
    default:
      callback('Error: Invalid token'); // Return a 500 Invalid token response
  }
};

// Help function to generate an IAM policy
var generatePolicy = function (principalId: any, effect: any, resource: any) {
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
    errorMessage: 'Unauthorized',
    stringKey: 'stringval',
    numberKey: 123,
    booleanKey: true,
  };
  return authResponse;
};
