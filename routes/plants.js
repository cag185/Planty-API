require("dotenv").config();
var express = require("express");
var router = express.Router();
const authenticateToken = require("../middleware/auth");
import {
  getAllPlants,
  getPlantById,
  getPlantsByUserId,
  createPlant,
  updatePlant,
  deletePlant,
} from "../services/plantService";

// Get all plants
router.get("/", authenticateToken, async (req, res) => {
  try {
    const plants = await getAllPlants();
    res.json(plants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all plants from a specific user.
router.get("/user/", authenticateToken, async (req, res) => {
  try {
    const plants = await getPlantsByUserId(Number(req.query.user_id));
    res.json(plants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific plant by id
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const plant = await getPlantById(Number(req.params.id));
    if (!plant) {
      return res.status(404).json({ error: "Plant not found" });
    }
    res.json(plant);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new plant
router.post("/", authenticateToken, async (req, res) => {
  try {
    const plant = await createPlant({
      name: req.body.name,
      species: req.body.species,
      watering_frequency_days: req.body.watering_frequency_days,
      user_id: req.body.user_id,
    });
    res.status(201).json(plant);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Edit an existing plant
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const updated = await updatePlant({
      id: Number(req.params.id),
      name: req.body.name,
      species: req.body.species,
      watering_frequency_days: req.body.watering_frequency_days,
    });
    if (!updated) {
      return res.status(404).json({ error: "Plant not found" });
    }
    res.json({ message: "Plant updated successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a plant
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const deleted = await deletePlant({ id: Number(req.params.id) });
    if (!deleted) {
      return res.status(404).json({ error: "Plant not found" });
    }
    res.json({ message: "Plant deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
