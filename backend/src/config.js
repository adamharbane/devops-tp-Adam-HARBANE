import dotenv from "dotenv";

dotenv.config();

const port = Number(process.env.API_PORT || 4000);

export const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number.isNaN(port) ? 4000 : port,
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
  database: {
    host: process.env.POSTGRES_HOST || "localhost",
    port: Number(process.env.POSTGRES_PORT || 5432),
    user: process.env.POSTGRES_USER || "reservation_app",
    password: process.env.POSTGRES_PASSWORD || "reservation_secret",
    database: process.env.POSTGRES_DB || "room_reservations",
  },
};
