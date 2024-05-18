import { decryptDataKey, encryptDataKey, generateDataKey } from './utils';

const KEY_ID = 'e66a5ff2-0390-4dd9-ab97-9718db6b80f4';

const main = async () => {
  //   const key = await createKey();
  //   console.log(key);

  const dataKey = await generateDataKey(KEY_ID);
  console.log(dataKey);

  const myData = Buffer.from('Hello world !!!');
  const encryptedDataKey = await encryptDataKey(KEY_ID, myData);
  console.log(encryptedDataKey);

  const decryptedDataKey = await decryptDataKey(KEY_ID, dataKey.CiphertextBlob!);
  console.log(decryptedDataKey);

  //   const keyInfo = await getKeyInfo(KEY_ID);
  //   console.log(keyInfo);

  //   const listKeys = await getListKeys();
  //   console.log(listKeys);

  //   const keyAlias = await createKeyAlias(
  //     KEY_ID,
  //     'alias/my-test-key-sdk',
  //   );
  //   console.log(keyAlias);

  //   const listAliases = await getListAliases();
  //   console.log(listAliases);
};

main();
