import "dotenv/config";
import express, { Request, Response } from "express";
const authenticateToken = require("../middleware/auth") as (req: Request, res: Response, next: () => void) => void;
import * as userService from "../services/userService";

const router = express.Router();

// Get all users
router.get("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const users = await userService.getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get a specific user by id
router.get("/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = await userService.getUserById(Number(req.params.id));
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Login
router.post("/login", async (req: Request, res: Response) => {
  try {
    console.log("Login attempt for email:", req.body);
    const result = await userService.loginUser({
      email: req.body.email,
      password: req.body.password,
    });
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: (error as Error).message });
  }
});

// Create a new user (signup)
router.post("/", async (req: Request, res: Response) => {
  try {
    const user = await userService.createUser({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
    });
    res.status(201).json(user);
  } catch (error) {
    if ((error as Error).message.includes("already exists")) {
      return res.status(409).json({ error: (error as Error).message });
    }
    res.status(400).json({ error: (error as Error).message });
  }
});

// Edit an existing user
router.put("/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const updated = await userService.updateUser({
      id: Number(req.params.id),
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
    });
    if (!updated) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: "User updated successfully" });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Delete a user
router.delete("/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const deleted = await userService.deleteUser({ id: Number(req.params.id) });
    if (!deleted) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

export = router;
