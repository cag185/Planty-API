"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePlant = exports.updatePlant = exports.createPlant = exports.getPlantsByUserId = exports.getPlantById = exports.getAllPlants = void 0;
const db_helpers_1 = require("./db-helpers");
const validateCreatePlantRequest = (req) => {
    const missing = [];
    if (!req.name)
        missing.push("name");
    if (!req.species)
        missing.push("species");
    if (!req.watering_frequency_days)
        missing.push("watering_frequency_days");
    if (!req.user_id)
        missing.push("user_id");
    if (missing.length > 0) {
        throw new Error(`Missing required fields: ${missing.join(", ")}`);
    }
};
const validateUpdatePlantRequest = (req) => {
    if (!req.id)
        throw new Error("id is required");
    if (!req.name && !req.species && !req.watering_frequency_days) {
        throw new Error("At least one field (name, species, watering_frequency_days) is required");
    }
};
const validateDeletePlantRequest = (req) => {
    if (!req.id)
        throw new Error("id is required");
};
const getAllPlants = async () => {
    return (0, db_helpers_1.query)("SELECT * FROM plants_plant");
};
exports.getAllPlants = getAllPlants;
const getPlantById = async (id) => {
    const rows = await (0, db_helpers_1.query)("SELECT * FROM plants_plant WHERE id = ?", [id]);
    return rows[0] ?? null;
};
exports.getPlantById = getPlantById;
const getPlantsByUserId = async (userId) => {
    return (0, db_helpers_1.query)(`SELECT * FROM plants_plant
     JOIN users_to_plants ON users_to_plants.plants_plant_id = plants_plant.id
     WHERE users_to_plants.users_user_id = ?`, [userId]);
};
exports.getPlantsByUserId = getPlantsByUserId;
const createPlant = async (req) => {
    validateCreatePlantRequest(req);
    const now = new Date();
    const result = await (0, db_helpers_1.execute)(`INSERT INTO plants_plant (date_created, date_deleted, date_updated, name, species, watering_frequency_days)
     VALUES (?, NULL, ?, ?, ?, ?)`, [now, now, req.name, req.species, req.watering_frequency_days]);
    // Link the plant to the user
    await (0, db_helpers_1.execute)("INSERT INTO users_to_plants (users_user_id, plants_plant_id) VALUES (?, ?)", [req.user_id, result.insertId]);
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
exports.createPlant = createPlant;
const updatePlant = async (req) => {
    validateUpdatePlantRequest(req);
    const fields = [];
    const values = [];
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
    const result = await (0, db_helpers_1.execute)(`UPDATE plants_plant SET ${fields.join(", ")} WHERE id = ?`, values);
    return result.affectedRows > 0;
};
exports.updatePlant = updatePlant;
const deletePlant = async (req) => {
    validateDeletePlantRequest(req);
    const result = await (0, db_helpers_1.execute)("DELETE FROM plants_plant WHERE id = ?", [req.id]);
    return result.affectedRows > 0;
};
exports.deletePlant = deletePlant;
