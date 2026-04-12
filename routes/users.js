require("dotenv").config();
var express = require("express");
var router = express.Router();
const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

connection.connect();

/* GET users listing. */

// Get all users
router.get("/", function (req, res, next) {
  connection.query("SELECT * FROM users_user", function (error, results) {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json(results);
  });
});

// Get a specific user by id
router.get("/:id", function (req, res, next) {
  const userId = req.params.id;
  connection.query(
    "SELECT * FROM users_user WHERE id = ?",
    [userId],
    function (error, results) {
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      if (results.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(results[0]);
    },
  );
});

module.exports = router;
