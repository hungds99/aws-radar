import {
  CreateAliasCommand,
  CreateKeyCommand,
  DataKeySpec,
  DecryptCommand,
  DescribeKeyCommand,
  EncryptCommand,
  GenerateDataKeyCommand,
  KeySpec,
  KeyUsageType,
  KMSClient,
  ListAliasesCommand,
  ListKeysCommand,
} from '@aws-sdk/client-kms';

const kmsClient = new KMSClient();

export const createKey = async () => {
  console.info('Creating a new key');
  const command = new CreateKeyCommand({
    KeyUsage: KeyUsageType.ENCRYPT_DECRYPT,
    KeySpec: KeySpec.SYMMETRIC_DEFAULT,
    Description: 'Key created from the SDK Kms Client module',
  });
  const response = await kmsClient.send(command);
  console.info('Key created successfully');
  return response;
};

export const generateDataKey = async (keyId: string) => {
  console.info('Generating a new data key');
  const command = new GenerateDataKeyCommand({
    KeyId: keyId,
    KeySpec: DataKeySpec.AES_256,
  });
  const response = kmsClient.send(command);
  console.info('Data key generated successfully');
  return response;
};

export const encryptDataKey = async (keyId: string, plaintext: Uint8Array) => {
  console.info('Encrypting data key');
  const command = new EncryptCommand({
    KeyId: keyId,
    Plaintext: plaintext,
  });
  const response = kmsClient.send(command);
  console.info('Data key encrypted successfully');
  return response;
};

export const decryptDataKey = async (keyId: string, ciphertext: Uint8Array) => {
  console.info('Decrypting data key');
  const command = new DecryptCommand({
    KeyId: keyId,
    CiphertextBlob: ciphertext,
  });
  const response = kmsClient.send(command);
  console.info('Data key decrypted successfully');
  return response;
};

export const getKeyInfo = async (keyId: string) => {
  console.info('Get key info');
  const command = new DescribeKeyCommand({
    KeyId: keyId,
  });
  const response = kmsClient.send(command);
  console.info('Get key info successfully');
  return response;
};

export const getListKeys = async () => {
  console.info('Get keys listed');
  const command = new ListKeysCommand({
    Limit: 20,
  });
  const response = kmsClient.send(command);
  console.info('Get keys listed successfully');
  return response;
};

export const createKeyAlias = async (keyId: string, alias: string) => {
  console.info('Creating a new key alias');
  const command = new CreateAliasCommand({
    AliasName: alias,
    TargetKeyId: keyId,
  });
  const response = kmsClient.send(command);
  console.info('Key alias created successfully');
  return response;
};

export const getListAliases = async () => {
  console.info('Get aliases listed');
  const command = new ListAliasesCommand({
    Limit: 20,
  });
  const response = kmsClient.send(command);
  console.info('Get aliases listed successfully');
  return response;
};
