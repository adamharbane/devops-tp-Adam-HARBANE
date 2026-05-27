import { Router } from "express";
import { query } from "../db/pool.js";

const router = Router();

router.get("/health", async (_req, res, next) => {
  try {
    await query("SELECT 1");
    res.json({
      status: "ok",
      service: "room-reservation-api",
      database: "connected",
    });
  } catch (error) {
    next(error);
  }
});

export default router;
