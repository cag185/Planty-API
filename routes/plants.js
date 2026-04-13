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

// Get all plants
router.get("/", function (req, res, next) {
  connection.query("SELECT * FROM plants_plant", function (error, results) {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json(results);
  });
});

// Get a specific plant by id
router.get("/:id", function (req, res, next) {
  const plantId = req.params.id;
  connection.query(
    "SELECT * FROM plants_plant WHERE id = ?",
    [plantId],
    function (error, results) {
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      if (results.length === 0) {
        return res.status(404).json({ error: "Plant not found" });
      }
      res.json(results[0]);
    },
  );
});

// Get all plants from a specific user.
router.get("/plants/:userId", function (req, res, next) {
  const userId = req.params.userId;
  connection.query(
    `SELECT * FROM plants_plant JOIN users_to_plants
     ON users_to_plants.plants_plant_id = plants_plant.id 
     WHERE users_to_plants.users_user_id = ?`,
    [userId],
    function (error, results) {
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      res.json(results);
    },
  );
});

// Create a new plant
router.post("/", function (req, res, next) {
  const { name, species, watering_frequency_days, user_id } = req.body;

  if (!name || !species || !watering_frequency_days || !user_id) {
    return res.status(400).json({
      error: "name, species, watering_frequency_days, and user_id are required",
    });
  }

  const now = new Date();
  connection.query(
    "INSERT INTO plants_plant (date_created, date_deleted, date_updated, name, species, watering_frequency_days) VALUES (?, NULL, ?, ?, ?, ?)",
    [now, now, name, species, watering_frequency_days],
    function (error, results) {
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      const plantId = results.insertId;
      // Now insert into users_to_plants
      connection.query(
        "INSERT INTO users_to_plants (users_user_id, plants_plant_id) VALUES (?, ?)",
        [user_id, plantId],
        function (linkError) {
          if (linkError) {
            return res.status(500).json({ error: linkError.message });
          }
          res.status(201).json({
            id: plantId,
            name,
            species,
            watering_frequency_days,
            date_created: now,
            date_updated: now,
            user_id,
          });
        },
      );
    },
  );
});

// Edit an existing plant
router.put("/:id", function (req, res, next) {
  const plantId = req.params.id;
  const { name, species, watering_frequency_days } = req.body;

  if (!name && !species && !watering_frequency_days) {
    return res.status(400).json({
      error:
        "At least one field (name, species, watering_frequency_days) is required",
    });
  }

  const fields = [];
  const values = [];

  if (name) {
    fields.push("name = ?");
    values.push(name);
  }
  if (species) {
    fields.push("species = ?");
    values.push(species);
  }
  if (watering_frequency_days) {
    fields.push("watering_frequency_days = ?");
    values.push(watering_frequency_days);
  }

  const now = new Date();
  fields.push("date_updated = ?");
  values.push(now);
  values.push(plantId);

  connection.query(
    "UPDATE plants_plant SET " + fields.join(", ") + " WHERE id = ?",
    values,
    function (error, results) {
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ error: "Plant not found" });
      }
      res.status(201).json({
        message: "Plant updated successfully",
        id: plantId,
        name,
        species,
        watering_frequency_days,
        date_created: now,
        date_updated: now,
      });
    },
  );
});

// Delete a plant
router.delete("/:id", function (req, res, next) {
  const plantId = req.params.id;
  connection.query(
    "DELETE FROM plants_plant WHERE id = ?",
    [plantId],
    function (error, results) {
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ error: "Plant not found" });
      }
      res.json({ message: "Plant deleted successfully" });
    },
  );
});

module.exports = router;
