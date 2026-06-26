import { transformAI } from "../src/services/aiAnalysis.js";

const fakeAI = {
  clarityScore: 72,
  issues: ["Manque exemples"],
  recommendations: ["Ajouter cas"],
};

describe("transformAI", () => {
  it("transforms AI response", () => {
    const start = performance.now();
    const result = transformAI(fakeAI);

    expect(result.score).toBe(72);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]).toBe("Manque exemples");
    expect(result.recommendations).toEqual(["Ajouter cas"]);
    expect(performance.now() - start).toBeLessThan(100);
  });

  it("fonctionne sans cle API configuree", () => {
    expect(process.env.OPENAI_API_KEY).toBeUndefined();
    expect(process.env.AI_API_KEY).toBeUndefined();

    const result = transformAI(fakeAI);

    expect(result.score).toBe(72);
  });

  it("rejette une reponse IA invalide", () => {
    expect(() => transformAI(null)).toThrow("Reponse IA invalide.");
  });
});
