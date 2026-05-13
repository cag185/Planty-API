require("dotenv").config();
var express = require("express");
var router = express.Router();
const authenticateToken = require("../middleware/auth");
import { userService } from "../services/userService.ts";

// Get all users
router.get("/", authenticateToken, async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific user by id
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const user = await userService.getUserById(Number(req.params.id));
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const result = await userService.loginUser({
      email: req.body.email,
      password: req.body.password,
    });
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// Create a new user (signup)
router.post("/", async (req, res) => {
  try {
    const user = await userService.createUser({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
    });
    res.status(201).json(user);
  } catch (error) {
    if (error.message.includes("already exists")) {
      return res.status(409).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
});

// Edit an existing user
router.put("/:id", authenticateToken, async (req, res) => {
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
    res.status(400).json({ error: error.message });
  }
});

// Delete a user
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const deleted = await userService.deleteUser({ id: Number(req.params.id) });
    if (!deleted) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
