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

### Retrieve Data
Fetch records with filtering, sorting, pagination, and column selection.

### Update Data
Modify rows based on specified conditions.

### Soft Delete
Mark rows as deleted using an `is_deleted` flag.

### Hard Delete
Permanently remove rows from the database.

# Usage

### Import the Package

```javascript
const { insertData, getData, updateData, deleteData, hardDeleteData } = require('@hashirrao/postgresql-general-backend');
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
