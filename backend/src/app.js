import cors from "cors";
import express from "express";
import { config } from "./config.js";
import { errorHandler } from "./middleware/errorHandler.js";
import healthRouter from "./routes/health.js";
import roomsRouter from "./routes/rooms.js";
import reservationsRouter from "./routes/reservations.js";

export function createApp() {
  const app = express();

  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());

  app.get("/", (_req, res) => {
    res.json({
      message: "API Plateforme de reservation de salles",
      docs: {
        health: "/health",
        rooms: "/api/rooms",
        reservations: "/api/reservations",
      },
    });
  });

  app.use(healthRouter);
  app.use("/api", roomsRouter);
  app.use("/api", reservationsRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: "Route introuvable." });
  });

  app.use(errorHandler);

  return app;
}
