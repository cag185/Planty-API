import { query, execute } from "./db-helpers";
import { User } from "../models";
import {
  CreateUserRequest,
  UpdateUserRequest,
  DeleteUserRequest,
  LoginUserRequest,
} from "../requests";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const SALT_ROUNDS = 10;

const validateCreateUserRequest = (req: CreateUserRequest): void => {
  const missing: string[] = [];
  if (!req.name) missing.push("name");
  if (!req.email) missing.push("email");
  if (!req.password) missing.push("password");
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(", ")}`);
  }
};

const validateUpdateUserRequest = (req: UpdateUserRequest): void => {
  if (!req.id) throw new Error("id is required");
  if (!req.name && !req.email && !req.password) {
    throw new Error("At least one field (name, email, password) is required");
  }
};

const validateDeleteUserRequest = (req: DeleteUserRequest): void => {
  if (!req.id) throw new Error("id is required");
};

const validateLoginUserRequest = (req: LoginUserRequest): void => {
  const missing: string[] = [];
  if (!req.email) missing.push("email");
  if (!req.password) missing.push("password");
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(", ")}`);
  }
};

export interface LoginResult {
  token: string;
  user: Omit<User, "password">;
}

export const getAllUsers = async (): Promise<User[]> => {
  return query<User>("SELECT * FROM users_user");
};

export const getUserById = async (id: number): Promise<User | null> => {
  const rows = await query<User>(
    "SELECT * FROM users_user WHERE id = ?",
    [id]
  );
  return rows[0] ?? null;
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const rows = await query<User>(
    "SELECT * FROM users_user WHERE email = ?",
    [email]
  );
  return rows[0] ?? null;
};

export const getUserByPlantId = async (plantId: number): Promise<User | null> => {
  const rows = await query<User>(
    `SELECT users_user.* FROM users_user
     JOIN users_to_plants ON users_to_plants.users_user_id = users_user.id
     WHERE users_to_plants.plants_plant_id = ?`,
    [plantId]
  );
  return rows[0] ?? null;
};

export const loginUser = async (
  req: LoginUserRequest
): Promise<LoginResult> => {
  validateLoginUserRequest(req);
  const user = await getUserByEmail(req.email);
  if (!user) {
    throw new Error("Invalid email or password");
  }

  const match = await bcrypt.compare(req.password, user.password);
  if (!match) {
    throw new Error("Invalid email or password");
  }

  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET as string,
    { expiresIn: "1h" }
  );

  const { password: _removed, ...userInfo } = user;
  return { token, user: userInfo };
};

export const createUser = async (
  req: CreateUserRequest
): Promise<Omit<User, "password">> => {
  validateCreateUserRequest(req);
  const existing = await getUserByEmail(req.email);
  if (existing) {
    throw new Error("A user with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(req.password, SALT_ROUNDS);
  const now = new Date();

  const result = await execute(
    `INSERT INTO users_user (date_created, date_deleted, date_updated, name, email, password)
     VALUES (?, NULL, ?, ?, ?, ?)`,
    [now, now, req.name, req.email, hashedPassword]
  );

  return {
    id: result.insertId,
    name: req.name,
    email: req.email,
    date_created: now,
    date_deleted: null,
    date_updated: now,
  };
};

export const updateUser = async (
  req: UpdateUserRequest
): Promise<boolean> => {
  validateUpdateUserRequest(req);
  const fields: string[] = [];
  const values: unknown[] = [];

  if (req.name) {
    fields.push("name = ?");
    values.push(req.name);
  }
  if (req.email) {
    fields.push("email = ?");
    values.push(req.email);
  }
  if (req.password) {
    const hashedPassword = await bcrypt.hash(req.password, SALT_ROUNDS);
    fields.push("password = ?");
    values.push(hashedPassword);
  }

  const now = new Date();
  fields.push("date_updated = ?");
  values.push(now);
  values.push(req.id);

  const result = await execute(
    `UPDATE users_user SET ${fields.join(", ")} WHERE id = ?`,
    values
  );

  return result.affectedRows > 0;
};

export const deleteUser = async (req: DeleteUserRequest): Promise<boolean> => {
  validateDeleteUserRequest(req);
  const result = await execute(
    "DELETE FROM users_user WHERE id = ?",
    [req.id]
  );
  return result.affectedRows > 0;
};
