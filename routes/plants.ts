import "dotenv/config";
import express, { Request, Response } from "express";
const authenticateToken = require("../middleware/auth") as (req: Request, res: Response, next: () => void) => void;
import * as plantService from "../services/plantService";

const router = express.Router();

// Get all plants
router.get("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const plants = await plantService.getAllPlants();
    res.json(plants);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get all plants from a specific user
router.get("/user/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const plants = await plantService.getPlantsByUserId(
      Number(req.query.user_id),
    );
    res.json(plants);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get a specific plant by id
router.get("/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const plant = await plantService.getPlantById(Number(req.params.id));
    if (!plant) {
      return res.status(404).json({ error: "Plant not found" });
    }
    res.json(plant);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Create a new plant
router.post("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const plant = await plantService.createPlant({
      name: req.body.name,
      species: req.body.species,
      watering_frequency_days: req.body.watering_frequency_days,
      user_id: req.body.user_id,
    });
    res.status(201).json(plant);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Edit an existing plant
router.put("/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const updated = await plantService.updatePlant({
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
    res.status(400).json({ error: (error as Error).message });
  }
});

// Delete a plant
router.delete("/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const deleted = await plantService.deletePlant({
      id: Number(req.params.id),
    });
    if (!deleted) {
      return res.status(404).json({ error: "Plant not found" });
    }
    res.json({ message: "Plant deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

export = router;
