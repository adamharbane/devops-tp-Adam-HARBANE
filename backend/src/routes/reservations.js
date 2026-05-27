import { Router } from "express";
import { query } from "../db/pool.js";

const router = Router();

router.get("/reservations", async (req, res, next) => {
  try {
    const { room_id: roomId, date } = req.query;
    const conditions = ["r.status = 'confirmed'"];
    const params = [];

    if (roomId) {
      params.push(roomId);
      conditions.push(`r.room_id = $${params.length}`);
    }

    if (date) {
      params.push(date);
      conditions.push(`DATE(r.start_time) = $${params.length}::date`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await query(
      `SELECT
         r.id,
         r.room_id,
         rm.name AS room_name,
         r.user_name,
         r.title,
         r.start_time,
         r.end_time,
         r.status,
         r.created_at
       FROM reservations r
       JOIN rooms rm ON rm.id = r.room_id
       ${whereClause}
       ORDER BY r.start_time ASC`,
      params
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.post("/reservations", async (req, res, next) => {
  try {
    const { room_id: roomId, user_name: userName, title, start_time: startTime, end_time: endTime } =
      req.body;

    if (!roomId || !userName || !title || !startTime || !endTime) {
      return res.status(400).json({
        error: "room_id, user_name, title, start_time et end_time sont obligatoires.",
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      return res.status(400).json({
        error: "Les dates sont invalides ou end_time doit etre apres start_time.",
      });
    }

    const roomResult = await query("SELECT id FROM rooms WHERE id = $1", [roomId]);
    if (roomResult.rowCount === 0) {
      return res.status(404).json({ error: "Salle introuvable." });
    }

    const conflictResult = await query(
      `SELECT id
       FROM reservations
       WHERE room_id = $1
         AND status = 'confirmed'
         AND start_time < $3
         AND end_time > $2`,
      [roomId, start.toISOString(), end.toISOString()]
    );

    if (conflictResult.rowCount > 0) {
      return res.status(409).json({
        error: "Conflit de reservation : la salle est deja reservee sur ce creneau.",
      });
    }

    const result = await query(
      `INSERT INTO reservations (room_id, user_name, title, start_time, end_time)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, room_id, user_name, title, start_time, end_time, status, created_at`,
      [roomId, userName, title, start.toISOString(), end.toISOString()]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
});

router.delete("/reservations/:id", async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE reservations
       SET status = 'cancelled'
       WHERE id = $1 AND status = 'confirmed'
       RETURNING id, room_id, user_name, title, start_time, end_time, status, created_at`,
      [req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: "Reservation introuvable ou deja annulee.",
      });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
});

export default router;
