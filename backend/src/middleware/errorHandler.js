export function errorHandler(err, _req, res, _next) {
  console.error(err);

  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }

  if (err.code === "23505") {
    return res.status(409).json({ error: "Ressource deja existante." });
  }

  return res.status(500).json({ error: "Erreur interne du serveur." });
}
