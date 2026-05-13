const db = require( "../db");

/**
 * Promise wrapper around the existing db.connection.query callback API.
 * Returns typed rows from SELECT queries.
 */
export const query = <T>(sql: string, params?: unknown[]): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    db.connection.query(sql, params, (error: Error | null, results: T[]) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
};

interface MutationResult {
  insertId: number;
  affectedRows: number;
}

/**
 * Promise wrapper for INSERT/UPDATE/DELETE queries.
 */
export const execute = (
  sql: string,
  params?: unknown[]
): Promise<MutationResult> => {
  return new Promise((resolve, reject) => {
    db.connection.query(
      sql,
      params,
      (error: Error | null, results: MutationResult) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      }
    );
  });
};
