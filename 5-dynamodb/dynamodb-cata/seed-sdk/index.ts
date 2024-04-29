import { faker } from '@faker-js/faker';
import { createWriteStream } from 'fs';

const generateCustomersCSVData = (count: number) => {
  console.info('Generating customers data...');
  const path = __dirname + '/customers.csv';
  const writeCustomersCSVStream = createWriteStream(path);

  writeCustomersCSVStream.write(
    'id,name,email,password,avatar,bio,birthdate,phone,address,flowersCount,groupId,joinedAt,threadId,postedAt,createdAt,updatedAt\n',
  );

  for (let i = 0; i < count; i++) {
    const customer = {
      id: faker.string.uuid(),
      name: faker.internet.userName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
      avatar: faker.image.avatar(),
      bio: faker.lorem.words({ min: 5, max: 255 }),
      birthdate: faker.date.birthdate(),
      phone: faker.phone.number(),
      address: faker.location.streetAddress({ useFullAddress: true }),
      flowersCount: faker.number.int(10000),
      groupId: faker.string.uuid(),
      joinedAt: faker.date.past(),
      threadId: faker.string.uuid(),
      postedAt: faker.date.past(),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
    };

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

const main = async () => {
  const count = 40000;
  generateCustomersCSVData(count);
};

main();
