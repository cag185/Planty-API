import { pool } from "../db";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export const query = async <T>(sql: string, params?: unknown[]): Promise<T[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(sql, params as unknown[]);
  return rows as unknown as T[];
};

interface MutationResult {
  insertId: number;
  affectedRows: number;
}

export const execute = async (
  sql: string,
  params?: unknown[]
): Promise<MutationResult> => {
  const [result] = await pool.query<ResultSetHeader>(sql, params as unknown[]);
  return { insertId: result.insertId, affectedRows: result.affectedRows };
};
