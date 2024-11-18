import { getData } from './dist/cjs/index.cjs';
// const { getData } = require('./src/index');

// Example database connection object
const connectionObj = {
  user: 'postgres',
  host: 'localhost',
  database: 'ems_saas',
  password: 'icanaccessroot',
  port: 5432, // Default PostgreSQL port
};

// Test the function
const runTest = async () => {
  try {
    const result = await getData(
      connectionObj,
      'public.packing',          // Replace with your table name
    //   ['column1', 'column2'],     // Replace with your column names or use null for all columns
    //   [{ column_name: 'id', operation: '=', value: 1 }], // Example filter
    //   'id',                       // Order by column
    //   10,                         // Limit
    //   0                           // Offset
    );

    console.log('Query Result:', result);
  } catch (error) {
    console.error('Error:', error);
  }
};

runTest();
