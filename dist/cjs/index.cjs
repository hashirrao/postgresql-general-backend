"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertData = insertData;
exports.insertBulkData = insertBulkData;
exports.getData = getData;
exports.updateData = updateData;
exports.bulkUpdateData = bulkUpdateData;
exports.deleteData = deleteData;
const pg_1 = __importDefault(require("pg"));
const { Pool } = pg_1.default;
function insertData(connectionObj, tableName, data) {
    return new Promise(async (resolve, reject) => {
        tableName = safeSqlString(tableName);
        const pool = new Pool(connectionObj);
        let columns = "";
        let values = [];
        let values_string = "";
        Object.keys(data).map((key, i) => {
            const safeKey = safeSqlString(key);
            columns += safeKey + ',';
            values_string += `$${i + 1},`;
            values.push(data[key]);
        });
        columns = columns.replace(/,(?=[^,]*$)/, '');
        values_string = values_string.replace(/,(?=[^,]*$)/, '');
        const query = 'INSERT INTO ' + tableName + '(' + columns + ') VALUES (' + values_string + ') RETURNING *;';
        // console.log(query, values)
        // Execute the query
        const client = await pool.connect();
        try {
            const response = await client.query(query, values);
            const resp = {
                success: true,
                message: "Data inserted successfully...!",
                data: response.rows[0],
            };
            resolve(resp);
        }
        catch (error) {
            console.error('Error:', error.message);
            reject(error);
        }
        finally {
            client.release();
        }
    });
}
function insertBulkData(connectionObj, items) {
    return new Promise(async (resolve, reject) => {
        const pool = new Pool(connectionObj);
        if (!items || items.length === 0) {
            return reject(new Error('No items provided for bulk insert'));
        }
        // Group items by table name for efficient multi-row inserts
        const groups = {};
        for (const it of items) {
            if (!it || !it.table || !it.data)
                continue;
            const safeTableName = safeSqlString(it.table);
            if (!groups[safeTableName])
                groups[safeTableName] = [];
            groups[safeTableName].push(it.data);
        }
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            let allInserted = [];
            for (const tableName of Object.keys(groups)) {
                const rows = groups[tableName];
                if (!rows || rows.length === 0)
                    continue;
                // Create a union of all columns present in the rows
                const colSet = new Set();
                rows.forEach(r => Object.keys(r).forEach(k => colSet.add(safeSqlString(k))));
                const columns = Array.from(colSet);
                if (columns.length === 0)
                    continue;
                // Build parameterized value placeholders and values array
                const values = [];
                const valuePlaceholders = [];
                for (let i = 0; i < rows.length; i++) {
                    const row = rows[i];
                    const rowPlaceholders = [];
                    for (let j = 0; j < columns.length; j++) {
                        const col = columns[j];
                        values.push(Object.prototype.hasOwnProperty.call(row, col) ? row[col] : null);
                        rowPlaceholders.push(`$${values.length}`);
                    }
                    valuePlaceholders.push(`(${rowPlaceholders.join(',')})`);
                }
                const query = `INSERT INTO ${tableName} (${columns.join(',')}) VALUES ${valuePlaceholders.join(',')} RETURNING *;`;
                const response = await client.query(query, values);
                allInserted = allInserted.concat(response.rows);
            }
            await client.query('COMMIT');
            resolve({ success: true, message: 'Bulk insert successful', data: allInserted });
        }
        catch (error) {
            await client.query('ROLLBACK');
            reject(error);
        }
        finally {
            client.release();
        }
    });
}
async function getData(connectionObj, tableName, columnNames, filters, order_by, limit, offset) {
    return new Promise(async (resolve, reject) => {
        const pool = new Pool(connectionObj);
        let values = [];
        let query = `SELECT `;
        // Columns
        if (columnNames?.length > 0) {
            query += `${columnNames.join(', ')} FROM ${tableName}`;
        }
        else {
            query += `* FROM ${tableName}`;
        }
        // WHERE for main query
        if (filters?.length > 0) {
            query += ' WHERE ';
            for (let i = 0; i < filters.length; i++) {
                const element = filters[i];
                if (element.operation === "IN") {
                    query += `${i === 0 ? '' : ' AND '}${element.column_name} IN ${element.value}`;
                }
                else {
                    const placeholder = `$${values.length + 1}`;
                    query += `${i === 0 ? '' : ' AND '}${element.column_name} ${element.operation} ${placeholder}`;
                    values.push(element.operation.toLowerCase() === "like"
                        ? `%${element.value}%`
                        : element.value);
                }
            }
        }
        if (order_by)
            query += ` ORDER BY ${order_by} ASC`;
        if (limit)
            query += ` LIMIT ${limit}`;
        if (offset)
            query += ` OFFSET ${offset}`;
        // COUNT QUERY
        let count_values = [];
        let count_query = `SELECT COUNT(*) AS total_rows FROM ${tableName}`;
        if (filters?.length > 0) {
            count_query += ' WHERE ';
            for (let i = 0; i < filters.length; i++) {
                const element = filters[i];
                if (element.operation === "IN") {
                    count_query += `${i === 0 ? '' : ' AND '}${element.column_name} IN ${element.value}`;
                }
                else {
                    const placeholder = `$${count_values.length + 1}`;
                    count_query += `${i === 0 ? '' : ' AND '}${element.column_name} ${element.operation} ${placeholder}`;
                    count_values.push(element.value);
                }
            }
        }
        // EXECUTE
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const count_response = await client.query(count_query, count_values);
            const response = await client.query(query, values);
            await client.query('COMMIT');
            resolve({
                success: true,
                message: "Data found successfully...!",
                data: response.rows,
                total_rows: count_response.rows[0].total_rows
            });
        }
        catch (error) {
            await client.query('ROLLBACK');
            reject(error);
        }
        finally {
            client.release();
        }
    });
}
function updateData(connectionObj, tableName, data, filters) {
    return new Promise(async (resolve, reject) => {
        tableName = safeSqlString(tableName);
        const pool = new Pool(connectionObj);
        if (!filters || filters.length == 0) {
            reject("At least one filter must be there");
        }
        // Define the SQL query to inserting data
        let set_values = "";
        let values = [];
        Object.keys(data).map((key, i) => {
            const safeKey = safeSqlString(key);
            set_values += `${safeKey} = $${i + 1},`;
            // values_string += `$${i + 1},`
            values.push(data[key]);
        });
        const data_length = Object.keys(data);
        set_values = set_values.replace(/,(?=[^,]*$)/, '');
        let query = `UPDATE ${tableName} SET ${set_values}`;
        if (filters && filters.length) {
            query = query + ' WHERE ';
            for (let i = 0; i < filters.length; i++) {
                const element = filters[i];
                const safeColName = safeSqlString(element.column_name);
                if (i == 0) {
                    query = query + safeColName + ' ' + element.operation + ' ' + `$${data_length.length + i + 1}`;
                }
                else {
                    query = query + ' AND ' + safeColName + ' ' + element.operation + ' ' + ` $${data_length.length + i + 1} `;
                }
                values.push(element.value);
            }
        }
        query = query + ' RETURNING *';
        // console.log(query, values)
        // Execute the query
        const client = await pool.connect();
        try {
            const response = await client.query(query, values);
            const resp = {
                success: true,
                message: "Data updated successfully...!",
                data: response.rows,
            };
            resolve(resp);
        }
        catch (error) {
            console.error('Error:', error.message);
            reject(error);
        }
        finally {
            client.release();
        }
    });
}
function bulkUpdateData(connectionObj, items) {
    return new Promise(async (resolve, reject) => {
        const pool = new Pool(connectionObj);
        if (!items || items.length === 0) {
            return reject(new Error('No items provided for bulk update'));
        }
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            let allUpdated = [];
            for (const item of items) {
                if (!item || !item.table || !item.data || !item.filters || item.filters.length === 0)
                    continue;
                const tableName = safeSqlString(item.table);
                const data = item.data;
                const filters = item.filters;
                // Build SET clause
                let set_values = "";
                let values = [];
                Object.keys(data).map((key, i) => {
                    const safeKey = safeSqlString(key);
                    set_values += `${safeKey} = $${i + 1},`;
                    values.push(data[key]);
                });
                set_values = set_values.replace(/,(?=[^,]*$)/, '');
                // Build WHERE clause
                let query = `UPDATE ${tableName} SET ${set_values}`;
                const data_length = Object.keys(data).length;
                if (filters && filters.length) {
                    query = query + ' WHERE ';
                    for (let i = 0; i < filters.length; i++) {
                        const element = filters[i];
                        const safeColName = safeSqlString(element.column_name);
                        if (i == 0) {
                            query = query + safeColName + ' ' + element.operation + ' ' + `$${data_length + i + 1}`;
                        }
                        else {
                            query = query + ' AND ' + safeColName + ' ' + element.operation + ' ' + ` $${data_length + i + 1} `;
                        }
                        values.push(element.value);
                    }
                }
                query = query + ' RETURNING *';
                const response = await client.query(query, values);
                allUpdated = allUpdated.concat(response.rows);
            }
            await client.query('COMMIT');
            resolve({ success: true, message: 'Bulk update successful', data: allUpdated });
        }
        catch (error) {
            await client.query('ROLLBACK');
            reject(error);
        }
        finally {
            client.release();
        }
    });
}
function deleteData(connectionObj, tableName, filters) {
    return new Promise(async (resolve, reject) => {
        tableName = safeSqlString(tableName);
        const pool = new Pool(connectionObj);
        if (!filters || filters.length == 0) {
            reject("At least one filter must be there");
        }
        // Define the SQL query to inserting data
        let values = [];
        let query = `DELETE FROM ${tableName}`;
        query = query + ' WHERE ';
        if (filters && filters.length) {
            for (let i = 0; i < filters.length; i++) {
                const element = filters[i];
                const safeColName = safeSqlString(element.column_name);
                if (i == 0) {
                    query = query + safeColName + ' ' + element.operation + ' ' + `$${i + 1}`;
                }
                else {
                    query = query + ' AND ' + safeColName + ' ' + element.operation + ' ' + ` $${i + 1} `;
                }
                values.push(element.value);
            }
        }
        query = query + ' RETURNING *';
        // console.log(query, values)
        // Execute the query
        const client = await pool.connect();
        try {
            const response = await client.query(query, values);
            resolve(response);
        }
        catch (error) {
            console.error('Error:', error.message);
            reject(error);
        }
        finally {
            client.release();
        }
    });
}
function safeSqlString(value) {
    if (!value)
        return value;
    return value
        .replace(/["']/g, "")
        .replace(/[:;]/g, "")
        .replace(/\s+/g, "") // Remove spaces
        .replace(/\b(UNION|INSERT|UPDATE|DELETE|DROP|JOIN|TRUNCATE|SELECT)\b/gi, "");
}
