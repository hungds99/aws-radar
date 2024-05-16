import { decryptDataKey, encryptDataKey, generateDataKey } from './utils';

const main = async () => {
  //   const key = await createKey();
  //   console.log(key);

  const dataKey = await generateDataKey('e66a5ff2-0390-4dd9-ab97-9718db6b80f4');
  console.log(dataKey);
  const myData = Buffer.from('Hello world !!!');
  const encryptedDataKey = await encryptDataKey('e66a5ff2-0390-4dd9-ab97-9718db6b80f4', myData);
  console.log(encryptedDataKey);
  const decryptedDataKey = await decryptDataKey(
    'e66a5ff2-0390-4dd9-ab97-9718db6b80f4',
    dataKey.CiphertextBlob!,
  );
  console.log(decryptedDataKey);

  //   const keyInfo = await getKeyInfo('e66a5ff2-0390-4dd9-ab97-9718db6b80f4');
  //   console.log(keyInfo);

  //   const listKeys = await getListKeys();
  //   console.log(listKeys);

  //   const keyAlias = await createKeyAlias(
  //     'e66a5ff2-0390-4dd9-ab97-9718db6b80f4',
  //     'alias/my-test-key-sdk',
  //   );
  //   console.log(keyAlias);

  //   const listAliases = await getListAliases();
  //   console.log(listAliases);
};

main();
