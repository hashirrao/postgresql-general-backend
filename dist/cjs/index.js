"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertData = insertData;
exports.getData = getData;
exports.updateData = updateData;
exports.deleteData = deleteData;
const pg_1 = __importDefault(require("pg"));
const { Pool } = pg_1.default;
function insertData(connectionObj, tableName, data) {
    return new Promise(async (resolve, reject) => {
        const pool = new Pool(connectionObj);
        let columns = "";
        let values = [];
        let values_string = "";
        Object.keys(data).map((key, i) => {
            columns += key + ',';
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
async function getData(connectionObj, tableName, columnNames, filters, order_by, limit, offset) {
    return new Promise(async (resolve, reject) => {
        const pool = new Pool(connectionObj);
        let values = [];
        let query = `SELECT `;
        if (columnNames && columnNames.length > 0) {
            query += `${columnNames.join(', ')} FROM ${tableName}`;
        }
        else {
            query += `* FROM ${tableName}`;
        }
        if (filters && filters.length) {
            query += ' WHERE ';
            for (let i = 0; i < filters.length; i++) {
                const element = filters[i];
                if (element.operation === "IN") {
                    if (i === 0) {
                        query += `${element.column_name} ${element.operation} ${element.value}`;
                    }
                    else {
                        query += ` AND ${element.column_name} ${element.operation} ${element.value}`;
                    }
                }
                else {
                    if (i === 0) {
                        query += `${element.column_name} ${element.operation} $${i + 1}`;
                    }
                    else {
                        query += ` AND ${element.column_name} ${element.operation} $${i + 1}`;
                    }
                    if (element.operation.toLowerCase() === 'like') {
                        values.push(`%${element.value}%`);
                    }
                    else {
                        values.push(element.value);
                    }
                }
            }
        }
        if (order_by) {
            query += ` ORDER BY ${order_by} ASC`;
        }
        if (limit) {
            query += ` LIMIT ${limit}`;
        }
        if (offset) {
            query += ` OFFSET ${offset}`;
        }
        // Execute the query
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            let count_values = [];
            let count_query = `SELECT COUNT(*) as total_rows FROM ${tableName}`;
            if (filters && filters.length > 0) {
                count_query += ' WHERE ';
                for (let i = 0; i < filters.length; i++) {
                    const element = filters[i];
                    if (element.operation === "IN") {
                        if (i === 0) {
                            count_query += `${element.column_name} ${element.operation} ${element.value}`;
                        }
                        else {
                            count_query += ` AND ${element.column_name} ${element.operation} ${element.value}`;
                        }
                    }
                    else {
                        if (i === 0) {
                            count_query += `${element.column_name} ${element.operation} $${i + 1}`;
                        }
                        else {
                            count_query += ` AND ${element.column_name} ${element.operation} $${i + 1}`;
                        }
                        count_values.push(element.value);
                    }
                }
            }
            const count_response = await client.query(count_query, count_values);
            let response = await client.query(query, values);
            await client.query('COMMIT');
            const resp = {
                success: true,
                message: "Data found successfully...!",
                data: response.rows,
                total_rows: count_response.rows[0].total_rows
            };
            resolve(resp);
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
        const pool = new Pool(connectionObj);
        if (!filters || filters.length == 0) {
            reject("At least one filter must be there");
        }
        // Define the SQL query to inserting data
        let set_values = "";
        let values = [];
        Object.keys(data).map((key, i) => {
            set_values += `${key} = $${i + 1},`;
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
                if (i == 0) {
                    query = query + element.column_name + ' ' + element.operation + ' ' + `$${data_length.length + i + 1}`;
                }
                else {
                    query = query + ' AND ' + element.column_name + ' ' + element.operation + ' ' + ` $${data_length.length + i + 1} `;
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
function deleteData(connectionObj, tableName, filters) {
    return new Promise(async (resolve, reject) => {
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
                if (i == 0) {
                    query = query + element.column_name + ' ' + element.operation + ' ' + `$${i + 1}`;
                }
                else {
                    query = query + ' AND ' + element.column_name + ' ' + element.operation + ' ' + ` $${i + 1} `;
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
