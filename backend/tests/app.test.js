import request from "supertest";
import { createApp } from "../src/app.js";

describe("createApp", () => {
  it("repond sur la route racine", async () => {
    const app = createApp();

    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe(
      "API Plateforme de reservation de salles",
    );
  });

  it("retourne 404 pour une route inconnue", async () => {
    const app = createApp();

    const response = await request(app).get("/route-inexistante");

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Route introuvable.");
  });
});
