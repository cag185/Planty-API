"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.createUser = exports.loginUser = exports.getUserByEmail = exports.getUserById = exports.getAllUsers = void 0;
const db_helpers_1 = require("./db-helpers");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const SALT_ROUNDS = 10;
const validateCreateUserRequest = (req) => {
    const missing = [];
    if (!req.name)
        missing.push("name");
    if (!req.email)
        missing.push("email");
    if (!req.password)
        missing.push("password");
    if (missing.length > 0) {
        throw new Error(`Missing required fields: ${missing.join(", ")}`);
    }
};
const validateUpdateUserRequest = (req) => {
    if (!req.id)
        throw new Error("id is required");
    if (!req.name && !req.email && !req.password) {
        throw new Error("At least one field (name, email, password) is required");
    }
};
const validateDeleteUserRequest = (req) => {
    if (!req.id)
        throw new Error("id is required");
};
const validateLoginUserRequest = (req) => {
    const missing = [];
    if (!req.email)
        missing.push("email");
    if (!req.password)
        missing.push("password");
    if (missing.length > 0) {
        throw new Error(`Missing required fields: ${missing.join(", ")}`);
    }
};
const getAllUsers = async () => {
    return (0, db_helpers_1.query)("SELECT * FROM users_user");
};
exports.getAllUsers = getAllUsers;
const getUserById = async (id) => {
    const rows = await (0, db_helpers_1.query)("SELECT * FROM users_user WHERE id = ?", [id]);
    return rows[0] ?? null;
};
exports.getUserById = getUserById;
const getUserByEmail = async (email) => {
    const rows = await (0, db_helpers_1.query)("SELECT * FROM users_user WHERE email = ?", [email]);
    return rows[0] ?? null;
};
exports.getUserByEmail = getUserByEmail;
const loginUser = async (req) => {
    validateLoginUserRequest(req);
    const user = await (0, exports.getUserByEmail)(req.email);
    if (!user) {
        throw new Error("Invalid email or password");
    }
    const match = await bcrypt_1.default.compare(req.password, user.password);
    if (!match) {
        throw new Error("Invalid email or password");
    }
    const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });
    const { password: _removed, ...userInfo } = user;
    return { token, user: userInfo };
};
exports.loginUser = loginUser;
const createUser = async (req) => {
    validateCreateUserRequest(req);
    const existing = await (0, exports.getUserByEmail)(req.email);
    if (existing) {
        throw new Error("A user with this email already exists");
    }
    const hashedPassword = await bcrypt_1.default.hash(req.password, SALT_ROUNDS);
    const now = new Date();
    const result = await (0, db_helpers_1.execute)(`INSERT INTO users_user (date_created, date_deleted, date_updated, name, email, password)
     VALUES (?, NULL, ?, ?, ?, ?)`, [now, now, req.name, req.email, hashedPassword]);
    return {
        id: result.insertId,
        name: req.name,
        email: req.email,
        date_created: now,
        date_deleted: null,
        date_updated: now,
    };
};
exports.createUser = createUser;
const updateUser = async (req) => {
    validateUpdateUserRequest(req);
    const fields = [];
    const values = [];
    if (req.name) {
        fields.push("name = ?");
        values.push(req.name);
    }
    if (req.email) {
        fields.push("email = ?");
        values.push(req.email);
    }
    if (req.password) {
        const hashedPassword = await bcrypt_1.default.hash(req.password, SALT_ROUNDS);
        fields.push("password = ?");
        values.push(hashedPassword);
    }
    const now = new Date();
    fields.push("date_updated = ?");
    values.push(now);
    values.push(req.id);
    const result = await (0, db_helpers_1.execute)(`UPDATE users_user SET ${fields.join(", ")} WHERE id = ?`, values);
    return result.affectedRows > 0;
};
exports.updateUser = updateUser;
const deleteUser = async (req) => {
    validateDeleteUserRequest(req);
    const result = await (0, db_helpers_1.execute)("DELETE FROM users_user WHERE id = ?", [req.id]);
    return result.affectedRows > 0;
};
exports.deleteUser = deleteUser;
