/**
 * Normalise une reponse IA brute vers un format interne stable.
 * Fonction pure : aucun appel reseau, aucune variable d'environnement requise.
 */
export function transformAI(aiResponse) {
  if (!aiResponse || typeof aiResponse !== "object") {
    throw new Error("Reponse IA invalide.");
  }

  return {
    score: Number(aiResponse.clarityScore) || 0,
    issues: Array.isArray(aiResponse.issues) ? [...aiResponse.issues] : [],
    recommendations: Array.isArray(aiResponse.recommendations)
      ? [...aiResponse.recommendations]
      : [],
  };
}
