import { query, execute } from "./db-helpers";
import { Plant } from "../models";
import {
  CreatePlantRequest,
  UpdatePlantRequest,
  DeletePlantRequest,
} from "../requests";

const validateCreatePlantRequest = (req: CreatePlantRequest): void => {
  const missing: string[] = [];
  if (!req.name) missing.push("name");
  if (!req.species) missing.push("species");
  if (!req.watering_frequency_days) missing.push("watering_frequency_days");
  if (!req.user_id) missing.push("user_id");
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(", ")}`);
  }
};

const validateUpdatePlantRequest = (req: UpdatePlantRequest): void => {
  if (!req.id) throw new Error("id is required");
  if (!req.name && !req.species && !req.watering_frequency_days) {
    throw new Error(
      "At least one field (name, species, watering_frequency_days) is required"
    );
  }
};

const validateDeletePlantRequest = (req: DeletePlantRequest): void => {
  if (!req.id) throw new Error("id is required");
};

export const getAllPlants = async (): Promise<Plant[]> => {
  return query<Plant>("SELECT * FROM plants_plant");
};

export const getPlantById = async (id: number): Promise<Plant | null> => {
  const rows = await query<Plant>(
    "SELECT * FROM plants_plant WHERE id = ?",
    [id]
  );
  return rows[0] ?? null;
};

export const getPlantsByUserId = async (userId: number): Promise<Plant[]> => {
  return query<Plant>(
    `SELECT * FROM plants_plant
     JOIN users_to_plants ON users_to_plants.plants_plant_id = plants_plant.id
     WHERE users_to_plants.users_user_id = ?`,
    [userId]
  );
};

export const createPlant = async (
  req: CreatePlantRequest
): Promise<Plant> => {
  validateCreatePlantRequest(req);
  const now = new Date();
  const result = await execute(
    `INSERT INTO plants_plant (date_created, date_deleted, date_updated, name, species, watering_frequency_days)
     VALUES (?, NULL, ?, ?, ?, ?)`,
    [now, now, req.name, req.species, req.watering_frequency_days]
  );

  // Link the plant to the user
  await execute(
    "INSERT INTO users_to_plants (users_user_id, plants_plant_id) VALUES (?, ?)",
    [req.user_id, result.insertId]
  );

  return {
    id: result.insertId,
    name: req.name,
    species: req.species,
    watering_frequency_days: req.watering_frequency_days,
    date_created: now,
    date_deleted: null,
    date_updated: now,
  };
};

export const updatePlant = async (
  req: UpdatePlantRequest
): Promise<boolean> => {
  validateUpdatePlantRequest(req);
  const fields: string[] = [];
  const values: unknown[] = [];

  if (req.name) {
    fields.push("name = ?");
    values.push(req.name);
  }
  if (req.species) {
    fields.push("species = ?");
    values.push(req.species);
  }
  if (req.watering_frequency_days) {
    fields.push("watering_frequency_days = ?");
    values.push(req.watering_frequency_days);
  }

  const now = new Date();
  fields.push("date_updated = ?");
  values.push(now);
  values.push(req.id);

  const result = await execute(
    `UPDATE plants_plant SET ${fields.join(", ")} WHERE id = ?`,
    values
  );

  return result.affectedRows > 0;
};

export const deletePlant = async (req: DeletePlantRequest): Promise<boolean> => {
  validateDeletePlantRequest(req);
  const result = await execute(
    "DELETE FROM plants_plant WHERE id = ?",
    [req.id]
  );
  return result.affectedRows > 0;
};