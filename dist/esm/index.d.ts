export interface Filters {
    column_name: string;
    operation: "=" | "!=" | "LIKE";
    value: any;
}
export declare function insertData(connectionObj: any, tableName: string, data: any): Promise<any>;
export declare function getData(connectionObj: any, tableName: string, columnNames: string[], filters: Array<any>, order_by: string, limit: number, offset: number): Promise<unknown>;
export declare function updateData(connectionObj: any, tableName: string, data: any, filters: Filters[]): Promise<any>;
export declare function deleteData(connectionObj: any, tableName: string, filters: Filters[]): Promise<any>;
