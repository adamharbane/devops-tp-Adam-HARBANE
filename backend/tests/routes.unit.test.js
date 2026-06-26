import { jest } from "@jest/globals";

const mockQuery = jest.fn();

jest.unstable_mockModule("../src/db/pool.js", () => ({
  query: mockQuery,
  pool: {},
}));

const { default: request } = await import("supertest");
const { createApp } = await import("../src/app.js");

const validReservation = {
  room_id: 1,
  user_name: "Adam",
  title: "Reunion",
  start_time: "2026-05-28T09:00:00Z",
  end_time: "2026-05-28T10:00:00Z",
};

describe("routes API avec pool mocke", () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  describe("GET /api/rooms", () => {
    it("retourne la liste des salles", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, name: "War Room", capacity: 12 }],
      });

      const response = await request(createApp()).get("/api/rooms");

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe("War Room");
    });
  });

  describe("GET /api/rooms/:id", () => {
    it("retourne le detail d'une salle", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, name: "War Room", capacity: 12 }],
        rowCount: 1,
      });

      const response = await request(createApp()).get("/api/rooms/1");

      expect(response.status).toBe(200);
      expect(response.body.name).toBe("War Room");
    });

    it("retourne 404 si la salle est introuvable", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const response = await request(createApp()).get("/api/rooms/999");

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Salle introuvable.");
    });
  });

  describe("POST /api/rooms", () => {
    it("cree une salle valide", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 2,
            name: "Atelier",
            capacity: 8,
            equipment: [],
            location: "Etage 2",
          },
        ],
      });

      const response = await request(createApp())
        .post("/api/rooms")
        .send({ name: "Atelier", capacity: 8, location: "Etage 2" });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe("Atelier");
    });
  });

  describe("GET /api/reservations", () => {
    it("retourne les reservations confirmees", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const response = await request(createApp()).get("/api/reservations");

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it("applique les filtres room_id et date", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const response = await request(createApp()).get(
        "/api/reservations?room_id=1&date=2026-05-28",
      );

      expect(response.status).toBe(200);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("WHERE"),
        expect.arrayContaining(["1", "2026-05-28"]),
      );
    });
  });

  describe("POST /api/reservations", () => {
    it("rejette une reservation sans champs obligatoires", async () => {
      const response = await request(createApp())
        .post("/api/reservations")
        .send({ room_id: 1 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(
        "room_id, user_name, title, start_time et end_time sont obligatoires.",
      );
    });

    it("retourne 404 si la salle n'existe pas", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const response = await request(createApp())
        .post("/api/reservations")
        .send(validReservation);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Salle introuvable.");
    });

    it("retourne 409 en cas de conflit de creneau", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [{ id: 99 }], rowCount: 1 });

      const response = await request(createApp())
        .post("/api/reservations")
        .send(validReservation);

      expect(response.status).toBe(409);
      expect(response.body.error).toBe(
        "Conflit de reservation : la salle est deja reservee sur ce creneau.",
      );
    });

    it("cree une reservation valide", async () => {
      const created = {
        id: 10,
        ...validReservation,
        status: "confirmed",
        created_at: "2026-05-28T08:00:00.000Z",
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [created] });

      const response = await request(createApp())
        .post("/api/reservations")
        .send(validReservation);

      expect(response.status).toBe(201);
      expect(response.body.id).toBe(10);
      expect(response.body.status).toBe("confirmed");
    });
  });

  describe("DELETE /api/reservations/:id", () => {
    it("annule une reservation existante", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 10, status: "cancelled" }],
        rowCount: 1,
      });

      const response = await request(createApp()).delete(
        "/api/reservations/10",
      );

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("cancelled");
    });

    it("retourne 404 si la reservation est introuvable", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const response = await request(createApp()).delete(
        "/api/reservations/999",
      );

      expect(response.status).toBe(404);
      expect(response.body.error).toBe(
        "Reservation introuvable ou deja annulee.",
      );
    });
  });
});
