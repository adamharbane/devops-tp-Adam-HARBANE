import { jest } from "@jest/globals";

const mockQuery = jest.fn();

jest.unstable_mockModule("../src/db/pool.js", () => ({
  query: mockQuery,
  pool: {},
}));

const { default: request } = await import("supertest");
const { createApp } = await import("../src/app.js");

describe("GET /health", () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it("retourne le statut ok lorsque la base repond", async () => {
    mockQuery.mockResolvedValue({ rows: [{ "?column?": 1 }] });

    const app = createApp();
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "ok",
      service: "room-reservation-api",
      database: "connected",
    });
    expect(mockQuery).toHaveBeenCalledWith("SELECT 1");
  });

  it("retourne 500 lorsque la base est indisponible", async () => {
    mockQuery.mockRejectedValueOnce(new Error("connexion refusee"));

    const app = createApp();
    const response = await request(app).get("/health");

    expect(response.status).toBe(500);
    expect(response.body.error).toBe("Erreur interne du serveur.");
  });
});
