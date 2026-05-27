import { Router } from "express";
import { query } from "../db/pool.js";

const router = Router();

router.get("/rooms", async (_req, res, next) => {
  try {
    const result = await query(
      `SELECT id, name, capacity, equipment, location, created_at
       FROM rooms
       ORDER BY name ASC`
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.get("/rooms/:id", async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, name, capacity, equipment, location, created_at
       FROM rooms
       WHERE id = $1`,
      [req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Salle introuvable." });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
});

router.post("/rooms", async (req, res, next) => {
  try {
    const { name, capacity, equipment = [], location = null } = req.body;

    if (!name || !capacity) {
      return res.status(400).json({
        error: "Les champs name et capacity sont obligatoires.",
      });
    }

    const result = await query(
      `INSERT INTO rooms (name, capacity, equipment, location)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, capacity, equipment, location, created_at`,
      [name, capacity, equipment, location]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
});

export default router;
