import request from "supertest";
import { createApp } from "../src/app.js";

describe("POST /api/rooms", () => {
  it("rejette une creation de salle sans capacite", async () => {
    const app = createApp();

    const response = await request(app)
      .post("/api/rooms")
      .send({ name: "Salle Neptune" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "Les champs name et capacity sont obligatoires.",
    );
  });
});
