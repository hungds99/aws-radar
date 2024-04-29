import { seedCustomers } from './dynamodb-seed';
import { generateCustomersCSVData } from './generate-csv-data';

const main = async () => {
  // const count = 40000;
  // generateCustomersCSVData(count);

  const seedCustomerCount = 100;
  await seedCustomers(seedCustomerCount);
};

main();
