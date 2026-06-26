# Securite du depot — Dependabot et Secret Scanning

Configuration GitHub pour le depot [adamharbane/devops-tp-Adam-HARBANE](https://github.com/adamharbane/devops-tp-Adam-HARBANE).

**Chemin interface :** `Settings` → `Code security and analysis`  
**URL directe :** https://github.com/adamharbane/devops-tp-Adam-HARBANE/settings/security_analysis

---

## Toggles actives (T31)

| Fonctionnalite | Statut | Role |
|----------------|--------|------|
| **Dependabot alerts** | Active | Alertes sur les vulnerabilites des dependances (`npm`, Docker, etc.) |
| **Dependabot security updates** | Active | PR automatiques pour corriger les failles de securite |
| **Secret scanning** | Active | Detection des cles API / tokens commites (actif sur depot public) |

---

## Capture de configuration (API GitHub — 2026-06-26)

Verification via `gh api` apres activation :

```bash
gh api repos/adamharbane/devops-tp-Adam-HARBANE --jq '.security_and_analysis'
```

```json
{
  "dependabot_security_updates": { "status": "enabled" },
  "secret_scanning": { "status": "enabled" },
  "secret_scanning_push_protection": { "status": "enabled" }
}
```

```bash
gh api repos/adamharbane/devops-tp-Adam-HARBANE/vulnerability-alerts -i
# → HTTP 204 (Dependabot alerts actif)
```

---

## Activation manuelle (si besoin)

1. Ouvrir **Settings** → **Code security and analysis**
2. Activer **Dependabot alerts**
3. Activer **Dependabot security updates**
4. Verifier **Secret scanning** (active automatiquement sur les depots publics)

Activation en ligne de commande (proprietaire du depot) :

```bash
gh api -X PUT repos/adamharbane/devops-tp-Adam-HARBANE/vulnerability-alerts
gh api -X PATCH repos/adamharbane/devops-tp-Adam-HARBANE \
  -f "security_and_analysis[dependabot_security_updates][status]=enabled"
```

---

## GitHub Secrets (T32)

**Chemin :** `Settings` → `Secrets and variables` → `Actions`  
**URL :** https://github.com/adamharbane/devops-tp-Adam-HARBANE/settings/secrets/actions

| Secret | Usage |
|--------|-------|
| `OPENAI_API_KEY` | Cle API OpenAI pour l'integration IA future (hors code source) |

Reference dans `.github/workflows/ci.yml` :

```yaml
env:
  OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

Le secret est verifie dans l'etape **Verify OpenAI secret** sans etre injecte dans `npm test` (les tests unitaires IA restent mockees et independants de la cle).

Configuration en ligne de commande :

```bash
gh secret set OPENAI_API_KEY
gh secret list
```

---

## Bonnes pratiques associees

- Ne jamais committer `.env` (voir audit T30 dans le README / `git ls-files | grep .env`)
- Revoquer immediatement toute cle exposee chez le provider (OpenAI, etc.)
- Traiter les alertes Dependabot et Secret scanning dans l'onglet **Security** du depot

---

## Risques DevOps

### R1 — Cle OpenAI exposee

- **Probabilite :** Moyenne
- **Impact :** Critique (facturation abusive, fuite de donnees envoyees a l'API)
- **Action :** Stocker la cle uniquement dans `.env` (ignore par Git) et GitHub Secrets ; activer Secret scanning ; revoquer et regenerer la cle en cas de fuite

### R2 — IA externe indisponible en demonstration

- **Probabilite :** Moyenne
- **Impact :** Eleve (fonctionnalite IA hors service, demo degradee)
- **Action :** Mocker l'IA dans les tests (`transformAI`) ; prevoir un mode degrade local ; monitorer la latence et les erreurs HTTP vers le provider

### R3 — Vulnerabilites dans les dependances npm

- **Probabilite :** Elevee
- **Impact :** Eleve (RCE, vol de donnees, compromission du conteneur backend)
- **Action :** Activer Dependabot alerts et security updates ; executer `npm audit` en CI ; appliquer les PR de correctifs rapidement

### R4 — Fuite des identifiants PostgreSQL

- **Probabilite :** Faible a moyenne
- **Impact :** Critique (acces direct aux reservations et donnees utilisateurs)
- **Action :** Mots de passe forts dans `.env` ; ne jamais committer `.env` ; secrets Docker/CI via GitHub Secrets ; rotation periodique de `DB_PASSWORD`

### R5 — Pipeline CI rouge ou contourne

- **Probabilite :** Moyenne
- **Impact :** Eleve (code defectueux merge, regression en production, perte de confiance)
- **Action :** Proteger `main` / `develop` (PR obligatoire + statut CI vert) ; corriger immediatement les runs rouges ; badge CI visible dans le README
