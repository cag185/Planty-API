/**
 * Promise wrapper around the existing db.connection.query callback API.
 * Returns typed rows from SELECT queries.
 */
export declare const query: <T>(sql: string, params?: unknown[]) => Promise<T[]>;
interface MutationResult {
    insertId: number;
    affectedRows: number;
}
/**
 * Promise wrapper for INSERT/UPDATE/DELETE queries.
 */
export declare const execute: (sql: string, params?: unknown[]) => Promise<MutationResult>;
export {};
