"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = exports.query = void 0;
const db = require("../db");
/**
 * Promise wrapper around the existing db.connection.query callback API.
 * Returns typed rows from SELECT queries.
 */
const query = (sql, params) => {
    return new Promise((resolve, reject) => {
        db.connection.query(sql, params, (error, results) => {
            if (error) {
                reject(error);
            }
            else {
                resolve(results);
            }
        });
    });
};
exports.query = query;
/**
 * Promise wrapper for INSERT/UPDATE/DELETE queries.
 */
const execute = (sql, params) => {
    return new Promise((resolve, reject) => {
        db.connection.query(sql, params, (error, results) => {
            if (error) {
                reject(error);
            }
            else {
                resolve(results);
            }
        });
    });
};
exports.execute = execute;
