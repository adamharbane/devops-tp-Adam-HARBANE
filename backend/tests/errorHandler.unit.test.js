import { jest } from "@jest/globals";
import { errorHandler } from "../src/middleware/errorHandler.js";

function createMockRes() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

describe("errorHandler", () => {
  it("utilise err.status quand il est defini", () => {
    const error = new Error("Requete invalide");
    error.status = 400;
    const res = createMockRes();

    errorHandler(error, {}, res, () => {});

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Requete invalide" });
  });

  it("retourne 409 pour une violation de contrainte unique PostgreSQL", () => {
    const error = new Error("duplicate key");
    error.code = "23505";
    const res = createMockRes();

    errorHandler(error, {}, res, () => {});

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: "Ressource deja existante.",
    });
  });

  it("retourne 500 pour une erreur interne", () => {
    const res = createMockRes();

    errorHandler(new Error("erreur inattendue"), {}, res, () => {});

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "Erreur interne du serveur.",
    });
  });
});
