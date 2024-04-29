import { faker } from '@faker-js/faker';
import { createWriteStream } from 'fs';

export const generateCustomer = () => {
  return {
    id: faker.string.uuid(),
    name: faker.internet.userName(),
    email: faker.internet.email(),
    password: faker.internet.password(),
    avatar: faker.image.avatar(),
    bio: faker.lorem.words({ min: 5, max: 255 }),
    birthdate: faker.date.birthdate().toISOString(),
    phone: faker.phone.number(),
    address: faker.location.streetAddress({ useFullAddress: true }),
    flowersCount: faker.number.int(10000),
    groupId: faker.string.uuid(),
    joinedAt: faker.date.past().toISOString(),
    threadId: faker.string.uuid(),
    postedAt: faker.date.past().toISOString(),
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
  };
};

export const generateCustomersCSVData = (count: number) => {
  console.info('Generating customers data...');
  const path = __dirname + '/customers.csv';
  const writeCustomersCSVStream = createWriteStream(path);

  writeCustomersCSVStream.write(
    'id,name,email,password,avatar,bio,birthdate,phone,address,flowersCount,groupId,joinedAt,threadId,postedAt,createdAt,updatedAt\n',
  );

  for (let i = 0; i < count; i++) {
    const customer = generateCustomer();
    writeCustomersCSVStream.write(
      `${customer.id},${customer.name},${customer.email},${customer.password},${customer.avatar},${customer.bio},${customer.birthdate},${customer.phone},${customer.address},${customer.flowersCount},${customer.groupId},${customer.joinedAt},${customer.threadId},${customer.postedAt},${customer.createdAt},${customer.updatedAt}\n`,
    );
  }

  // Handle errors
  writeCustomersCSVStream.on('error', (err) => {
    console.error('Error writing to file: ', err);
    process.exit(1);
  });

  writeCustomersCSVStream.on('finish', () => {
    console.info('File written successfully');
  });

  // Close the write stream
  writeCustomersCSVStream.end();
};
