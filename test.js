import { insertBulkData, bulkUpdateData } from './src/index.ts';

// Example database connection object — update with your local DB credentials
const connectionObj = {
  user: 'postgres',
  host: '148.230.118.14',
  database: 'pgacoach_db',
  password: 'vGCb21sFGgkGF9HgBUuUb9Fp4yDMHQ3rWnENUDGymi383AHPzLs0v6rSQqSszOR2',
  port: 5432,
};

// Test bulk insert
const testBulkInsert = async () => {
  const timestamp = Date.now();
  const items = [
    {
      table: 'public.blogs',
      data: {
        en_slug: `blog-slug-${timestamp}`,
        en_title: 'Test Blog',
        en_description: 'Test Description'
      }
    },
    {
      table: 'public.lessons',
      data: {
        en_slug: `lesson-slug-${timestamp}`,
        en_title: 'Test Lesson',
        en_description: 'Lesson Description'
      }
    }
  ];

  try {
    const result = await insertBulkData(connectionObj, items);
    console.log('✓ Bulk Insert Result:', JSON.stringify(result, null, 2));
    return result.data;
  } catch (error) {
    console.error('✗ Bulk Insert Error:', error.message);
    return null;
  }
};

// Test bulk update
const testBulkUpdate = async (insertedData) => {
  if (!insertedData || insertedData.length < 2) {
    console.log('Skipping bulk update test (no data to update)');
    return;
  }

  const updateItems = [
    {
      table: 'public.blogs',
      data: {
        en_title: 'Updated Blog Title',
        en_description: 'Updated Description'
      },
      filters: [
        { column_name: 'id', operation: '=', value: insertedData[0].id }
      ]
    },
    {
      table: 'public.lessons',
      data: {
        en_title: 'Updated Lesson Title'
      },
      filters: [
        { column_name: 'id', operation: '=', value: insertedData[1].id }
      ]
    }
  ];

  try {
    const result = await bulkUpdateData(connectionObj, updateItems);
    console.log('\n✓ Bulk Update Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('\n✗ Bulk Update Error:', error.message);
  }
};

// Run tests
const runTests = async () => {
  console.log('Starting bulk insert and update tests...\n');
  const insertedData = await testBulkInsert();
  await testBulkUpdate(insertedData);
};

runTests();
