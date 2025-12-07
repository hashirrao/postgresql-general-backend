# PostgreSQL Query Utility: `@hashirrao/postgresql-general-backend`

A simple and efficient Node.js utility for performing CRUD operations on PostgreSQL databases. This package simplifies database interaction by abstracting common query patterns, making development faster and cleaner.

---

## Installation

```bash
npm install @hashirrao/postgresql-general-backend
```

or

```bash
yarn add @hashirrao/postgresql-general-backend
```

### Insert Data
Quickly add new rows to a table.

### Bulk Insert Data
Insert multiple rows across multiple tables in a single transaction.

### Retrieve Data
Fetch records with filtering, sorting, pagination, and column selection.

### Update Data
Modify rows based on specified conditions.

### Bulk Update Data
Update multiple rows across multiple tables with different filters in a single transaction.

### Hard Delete
Remove rows from the database.

# Usage

### Import the Package

```javascript
const { insertData, insertBulkData, getData, updateData, bulkUpdateData, deleteData } = require('@hashirrao/postgresql-general-backend');
```

### Set Up Connection

```javascript
const connectionObj = {
    user: 'your-username',
    host: 'your-host',
    database: 'your-database',
    password: 'your-password',
    port: 5432,
};
```

# Examlples

### Insert Data

```javascript
const tableName = 'users';
const data = { name: 'John Doe', email: 'john.doe@example.com' };

insertData(connectionObj, tableName, data)
    .then(response => console.log(response))
    .catch(error => console.error(error));
```

### Bulk Insert Data

Insert multiple rows across one or more tables in a single transaction.

```javascript
const items = [
    {
        table: 'public.blogs',
        data: {
            en_slug: 'blog-slug-001',
            en_title: 'Amazing Blog Post',
            en_description: 'This is an amazing blog post'
        }
    },
    {
        table: 'public.lessons',
        data: {
            en_slug: 'lesson-slug-001',
            en_title: 'Learning JavaScript',
            en_description: 'Learn JavaScript fundamentals'
        }
    },
    {
        table: 'public.blogs',
        data: {
            en_slug: 'blog-slug-002',
            en_title: 'Another Great Post',
            en_description: 'More awesome content'
        }
    }
];

insertBulkData(connectionObj, items)
    .then(response => console.log(response))
    .catch(error => console.error(error));
```

**Response:**
```json
{
    "success": true,
    "message": "Bulk insert successful",
    "data": [
        { "id": 1, "en_slug": "blog-slug-001", "en_title": "Amazing Blog Post", ... },
        { "id": 1, "en_slug": "lesson-slug-001", "en_title": "Learning JavaScript", ... },
        { "id": 2, "en_slug": "blog-slug-002", "en_title": "Another Great Post", ... }
    ]
}
```

### Bulk Update Data

Update multiple rows across multiple tables with different filters in a single transaction.

```javascript
const updateItems = [
    {
        table: 'public.blogs',
        data: {
            en_title: 'Updated Blog Title',
            en_description: 'Updated description'
        },
        filters: [
            { column_name: 'id', operation: '=', value: 1 }
        ]
    },
    {
        table: 'public.lessons',
        data: {
            en_title: 'Updated Lesson Title'
        },
        filters: [
            { column_name: 'id', operation: '=', value: 2 }
        ]
    },
    {
        table: 'public.blogs',
        data: {
            is_published: true
        },
        filters: [
            { column_name: 'category_id', operation: '=', value: 5 }
        ]
    }
];

bulkUpdateData(connectionObj, updateItems)
    .then(response => console.log(response))
    .catch(error => console.error(error));
```

**Response:**
```json
{
    "success": true,
    "message": "Bulk update successful",
    "data": [
        { "id": 1, "en_title": "Updated Blog Title", "en_description": "Updated description", ... },
        { "id": 2, "en_title": "Updated Lesson Title", ... },
        { "id": 3, "is_published": true, ... }
    ]
}
```

### Retrieve Data

```javascript
getData(connectionObj, 'users', ['id', 'name'], [{ column_name: 'is_deleted', operation: '=', value: false }], 'name', 10, 0)
    .then(response => console.log(response))
    .catch(error => console.error(error));
```

### Update Data

```javascript
updateData(connectionObj, 'users', { name: 'Jane Doe' }, [{ column_name: 'id', operation: '=', value: 1 }])
    .then(response => console.log(response))
    .catch(error => console.error(error));
```

### Delete

```javascript
deleteData(connectionObj, 'users', [{ column_name: 'id', operation: '=', value: 1 }])
    .then(response => console.log(response))
    .catch(error => console.error(error));
```

### Bulk Insert Data Features

- **Transaction Safe**: All inserts run in a single transaction; if any fail, all are rolled back
- **Multi-Table Support**: Insert rows into different tables in one operation
- **Auto-Union Columns**: Handles rows with different columns (missing columns default to NULL)
- **Parameterized Queries**: Safe from SQL injection attacks
- **Returns All Data**: Returns all inserted rows with generated IDs and defaults

### Bulk Update Data Features

- **Transaction Safe**: All updates run in a single transaction; if any fail, all are rolled back
- **Multi-Table Support**: Update rows in different tables with different filters in one operation
- **Flexible Filtering**: Each update can have independent filter conditions
- **Parameterized Queries**: Safe from SQL injection attacks
- **Returns All Data**: Returns all updated rows with new values

---

### Github

Visit [GitHub][gh] for the source code.

[gh]: https://github.com/hashirrao/postgresql-general-backend "GitHub Repository"