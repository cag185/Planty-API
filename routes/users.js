require("dotenv").config();
var express = require("express");
var router = express.Router();
const mysql = require("mysql2");
const bcrypt = require("bcrypt");

const SALT_ROUNDS = 10;

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

connection.connect();

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

// Create a new user
router.post("/", function (req, res, next) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email, and password are required" });
  }

  // Check if email and password combination is already in use
  connection.query(
    "SELECT id FROM users_user WHERE email = ?",
    [email],
    function (error, results) {
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      if (results.length > 0) {
        return res.status(409).json({ error: "A user with this email already exists" });
      }

      bcrypt.hash(password, SALT_ROUNDS, function (err, hashedPassword) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        const now = new Date();
        connection.query(
          "INSERT INTO users_user (date_created, date_deleted, date_updated, name, email, password) VALUES (?, NULL, ?, ?, ?, ?)",
          [now, now, name, email, hashedPassword],
          function (error, results) {
            if (error) {
              return res.status(500).json({ error: error.message });
            }
            res.status(201).json({ id: results.insertId, name, email, date_created: now, date_updated: now });
          },
        );
      });
    },
  );
});

// Edit an existing user
router.put("/:id", function (req, res, next) {
  const userId = req.params.id;
  const { name, email, password } = req.body;

  if (!name && !email && !password) {
    return res.status(400).json({ error: "At least one field (name, email, password) is required" });
  }

  const fields = [];
  const values = [];

  if (name) {
    fields.push("name = ?");
    values.push(name);
  }
  if (email) {
    fields.push("email = ?");
    values.push(email);
  }

  const now = new Date();
  fields.push("date_updated = ?");
  values.push(now);

  function executeUpdate(extraFields, extraValues) {
    const allFields = fields.concat(extraFields);
    const allValues = values.concat(extraValues);
    allValues.push(userId);

    connection.query(
      "UPDATE users_user SET " + allFields.join(", ") + " WHERE id = ?",
      allValues,
      function (error, results) {
        if (error) {
          return res.status(500).json({ error: error.message });
        }
        if (results.affectedRows === 0) {
          return res.status(404).json({ error: "User not found" });
        }
        res.json({ message: "User updated successfully" });
      },
    );
  }

  if (password) {
    bcrypt.hash(password, SALT_ROUNDS, function (err, hashedPassword) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      executeUpdate(["password = ?"], [hashedPassword]);
    });
  } else {
    executeUpdate([], []);
  }
});

// Delete a user
router.delete("/:id", function (req, res, next) {
  const userId = req.params.id;
  connection.query(
    "DELETE FROM users_user WHERE id = ?",
    [userId],
    function (error, results) {
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ message: "User deleted successfully" });
    },
  );
});

module.exports = router;
