import request from "supertest";
import { createApp } from "../src/app.js";

describe("POST /api/reservations", () => {
  it("rejette une reservation dont end_time est anterieure a start_time", async () => {
    const app = createApp();

    const response = await request(app).post("/api/reservations").send({
      room_id: 1,
      user_name: "Adam",
      title: "Reunion",
      start_time: "2026-05-28T09:00:00Z",
      end_time: "2026-05-28T08:00:00Z",
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "Les dates sont invalides ou end_time doit etre apres start_time.",
    );
  });
});
