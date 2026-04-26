require("dotenv").config();
var express = require("express");
var router = express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authenticateToken = require("../middleware/auth");

const SALT_ROUNDS = 10;

// Get all users
router.get("/", authenticateToken, function (req, res, next) {
  db.connection.query("SELECT * FROM users_user", function (error, results) {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json(results);
  });
});

// Get a specific user by id
router.get("/:id", authenticateToken, function (req, res, next) {
  const userId = req.params.id;
  db.connection.query(
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

// Login
router.post("/login", function (req, res, next) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  db.connection.query(
    "SELECT * FROM users_user WHERE email = ?",
    [email],
    function (error, results) {
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      if (results.length === 0) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const user = results[0];

      bcrypt.compare(password, user.password, function (err, match) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        if (!match) {
          return res.status(401).json({ error: "Invalid email or password" });
        }

        const token = jwt.sign(
          { id: user.id, email: user.email },
          process.env.JWT_SECRET,
          { expiresIn: "1h" },
        );

        const { password: _removed, ...userInfo } = user;
        res.json({ token, user: userInfo });
      });
    },
  );
});

// Create a new user (signup)
router.post("/", function (req, res, next) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ error: "name, email, and password are required" });
  }

  // Check if email and password combination is already in use
  db.connection.query(
    "SELECT id FROM users_user WHERE email = ?",
    [email],
    function (error, results) {
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      if (results.length > 0) {
        return res
          .status(409)
          .json({ error: "A user with this email already exists" });
      }

      bcrypt.hash(password, SALT_ROUNDS, function (err, hashedPassword) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        const now = new Date();
        db.connection.query(
          "INSERT INTO users_user (date_created, date_deleted, date_updated, name, email, password) VALUES (?, NULL, ?, ?, ?, ?)",
          [now, now, name, email, hashedPassword],
          function (error, results) {
            if (error) {
              return res.status(500).json({ error: error.message });
            }
            res.status(201).json({
              id: results.insertId,
              name,
              email,
              date_created: now,
              date_updated: now,
            });
          },
        );
      });
    },
  );
});

// Edit an existing user
router.put("/:id", authenticateToken, function (req, res, next) {
  const userId = req.params.id;
  const { name, email, password } = req.body;

  if (!name && !email && !password) {
    return res.status(400).json({
      error: "At least one field (name, email, password) is required",
    });
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

    db.connection.query(
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
router.delete("/:id", authenticateToken, function (req, res, next) {
  const userId = req.params.id;
  db.connection.query(
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
