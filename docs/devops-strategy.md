# Strategie DevOps — Plateforme de reservation de salles

Document de reference du fil rouge realise par **Adam HARBANE**.  
Depot : [github.com/adamharbane/devops-tp-Adam-HARBANE](https://github.com/adamharbane/devops-tp-Adam-HARBANE)

---

## 1. Architecture technique cible

La plateforme vise une architecture **modulaire et conteneurisee** : un frontend React (Vite) pour le catalogue des salles, une API REST Node.js / Express pour la logique metier, et PostgreSQL 16 pour la persistance des salles et reservations.

```text
┌─────────────────┐     HTTP      ┌──────────────────────┐     SQL      ┌─────────────┐
│  Frontend React │ ────────────► │  Backend Express     │ ───────────► │ PostgreSQL  │
│  (port 5173)    │  /api/rooms   │  (port 3000)         │              │  (service   │
│  filtres salles │  /api/reserv. │  /health             │              │   db)       │
└─────────────────┘               └──────────────────────┘              └─────────────┘
         │                                    │
         │                                    └── Service IA (futur) via transformAI()
         └── VITE_API_URL → http://localhost:3000
```

Le backend expose les routes critiques : `GET /health` (supervision), `GET/POST /api/rooms`, `GET/POST/DELETE /api/reservations` avec detection de conflits de creneaux. Le demarrage (`src/server.js`) initialise le schema et le seed via `src/db/init.js` avant d'ecouter le port configure.

L'objectif DevOps est de livrer cette stack de maniere **reproductible** (Docker Compose), **verifiable** (CI GitHub Actions) et **securisee** (secrets hors Git, Dependabot, Secret scanning).

---

## 2. Structure du repository

Le depot est organise en **monorepo leger** : backend et frontend separes, documentation et outillage a la racine.

```text
devops-tp-Adam-HARBANE/
├── .github/workflows/ci.yml    # Pipeline CI backend
├── .husky/pre-commit           # Hook Husky → lint-staged
├── backend/
│   ├── Dockerfile              # Image Node 20 Alpine
│   ├── src/
│   │   ├── server.js           # Point d'entree
│   │   ├── routes/             # rooms, reservations, health
│   │   ├── services/aiAnalysis.js
│   │   └── db/                 # pool, init schema + seed
│   └── tests/                  # Suite Jest (25 tests)
├── frontend/                   # React + Vite (catalogue salles)
├── docs/
│   ├── devops-strategy.md      # Ce document
│   ├── tests.md                # Fonctionnalites critiques et couverture
│   └── security.md             # Dependabot, risques, secrets
├── docker-compose.yml          # backend + db
├── .env.example                # Variables d'environnement documentees
├── lint-staged.config.js       # Lint/format pre-commit
└── package.json                # Husky + lint-staged (racine)
```

Cette structure separe clairement le **code applicatif**, l'**infrastructure locale** (Compose) et la **documentation DevOps**, ce qui facilite l'onboarding et la notation du TP.

---

## 3. Workflow Git

Le workflow suit un modele **Git Flow simplifie** adapte au TP :

| Branche | Role |
|---------|------|
| `main` | Version stable, deployable |
| `develop` | Integration des features |
| `feature/*` | Developpement isole (ex. `feature/front-filtres-recherche-salles`) |
| `fix/*` | Corrections ciblees (ex. `fix/backend-cors-et-salles`) |

**Regles appliquees :**

1. Travailler sur une branche `feature/` ou `fix/` depuis `develop`.
2. Ouvrir une **Pull Request** vers `develop` ou `main`.
3. Le pipeline **CI doit etre vert** avant merge (3 runs consecutifs valides sur la PR #3).
4. **Husky + lint-staged** executent ESLint et Prettier sur les fichiers stagés avant chaque commit.
5. Ne jamais committer `.env` — seuls `.env.example` sont versionnes (audit T30).

**Protection de la branche `main` (T12) :**

| Regle | Active |
|-------|--------|
| Require a pull request before merging | Oui |
| Require status checks to pass | Oui (`test` — job CI) |
| Require branches to be up to date | Oui (`strict: true`) |
| Include administrators | Oui (`enforce_admins`) |

**Configuration :** `Settings` → `Branches` → `Branch protection rules` → `main`  
**URL :** https://github.com/adamharbane/devops-tp-Adam-HARBANE/settings/branches

**Capture de configuration (API GitHub — 2026-06-26) :**

```json
{
  "required_pull_request_reviews": { "required_approving_review_count": 0 },
  "required_status_checks": { "strict": true, "contexts": ["test"] },
  "enforce_admins": { "enabled": true },
  "allow_force_pushes": { "enabled": false }
}
```

**Verification — push direct refuse :**

```text
$ git push origin HEAD:main
remote: error: GH006: Protected branch update failed for refs/heads/main.
remote: - Changes must be made through a pull request.
! [remote rejected] HEAD -> main (protected branch hook declined)
```

Les messages de commit suivent le format conventionnel : `feat(frontend):`, `ci:`, `test(backend):`, `chore:`, `docs:`.

---

## 4. Services Docker prevus

Le fichier `docker-compose.yml` orchestre **deux services** :

| Service | Image / build | Port | Role |
|---------|---------------|------|------|
| `backend` | Build `./backend` (Dockerfile Node 20 Alpine) | `3000:3000` | API REST Express |
| `db` | `postgres:16` | interne `5432` | Persistance salles et reservations |

**Points cles :**

- Volume nomme `db_data` pour persister les donnees PostgreSQL entre les redemarrages.
- Healthcheck `pg_isready` sur `db` avant le demarrage du `backend` (`depends_on: condition: service_healthy`).
- Le backend charge les variables via `env_file: .env` et mappe `DB_*` vers `POSTGRES_*`.
- Image backend optimisee : `npm ci --omit=dev`, `.dockerignore` excluant `tests/` et `coverage/`.

**Service non conteneurise a ce stade :** le frontend Vite est lance en local (`npm run dev` dans `frontend/`) ; une future evolution integrera un service `frontend` dans le Compose.

---

## 5. Variables d'environnement

Les secrets et la configuration sont centralises dans `.env` (copie de `.env.example`), **ignore par Git**.

| Variable | Exemple | Usage |
|----------|---------|-------|
| `API_PORT` | `3000` | Port d'ecoute du backend |
| `NODE_ENV` | `development` | Environnement Node.js |
| `CORS_ORIGIN` | `http://localhost:5173` | Origine autorisee pour le frontend |
| `DB_NAME` | `room_reservations` | Nom de la base (service `db`) |
| `DB_USER` | `reservation_app` | Utilisateur PostgreSQL |
| `DB_PASSWORD` | `reservation_secret` | Mot de passe (a changer en prod) |
| `POSTGRES_HOST` | `db` | Hote BDD dans Docker |
| `POSTGRES_PORT` | `5432` | Port PostgreSQL |
| `DATABASE_URL` | `postgresql://...` | Connexion pour outils externes |
| `OPENAI_API_KEY` | *(non versionne)* | Cle IA externe (futur, hors Git) |
| `VITE_API_URL` | `http://localhost:3000` | URL API pour le frontend (`frontend/.env`) |

En production, `DB_PASSWORD` et `OPENAI_API_KEY` seront injectes via **GitHub Secrets** ou le gestionnaire de secrets de l'hebergeur, jamais en clair dans le depot.

---

## 6. Strategie de tests

La strategie suit une **pyramide de tests** documentee dans `docs/tests.md` :

```text
        /  E2E (bonus)  \        ← smoke Docker, parcours reservation
       /-----------------\
      /  Integration      \      ← API + PostgreSQL reel
     /---------------------\
    /    Unitaire (Jest)    \    ← routes mockees, transformAI, errorHandler
   /-------------------------\
```

**Outils :** Jest 29 + Supertest, execution en ESM (`--experimental-vm-modules`).

**Fonctionnalites critiques couvertes :**

1. Creation de reservation avec detection de conflits (`POST /api/reservations`)
2. Consultation du catalogue des salles (`GET /api/rooms`)
3. Sante API + connexion PostgreSQL (`GET /health`)

**Etat actuel :** 25 tests unitaires dans `backend/tests/`, **92,63 % de line coverage** (seuil minimal 60 % configure dans `jest.config.js`). Tests IA mockees sans appel reseau ni cle API (`tests/ai.unit.test.js`).

**Qualite locale :** Husky declenche lint-staged (ESLint + Prettier) sur `backend/**/*.js` et `frontend/**/*.{js,jsx}` avant chaque commit.

---

## 7. Pipeline CI prevu

Le workflow `.github/workflows/ci.yml` s'execute sur **push** (`main`, `develop`) et sur **pull_request** :

| Etape | Commande | Objectif |
|-------|----------|----------|
| Install | `npm ci` (dossier `backend/`) | Dependances verrouillees |
| Lint | `npm run lint` | Qualite du code (`eslint src/`) |
| Test | `npm test` | 25 tests Jest |
| Build | `npm run build` | Validation syntaxe `node --check src/server.js` |

**Environnement :** `ubuntu-latest`, Node.js 20.

**Badge :** visible dans le README (`![CI](...actions/workflows/ci.yml/badge.svg)`).

**Historique valide :** 3 runs CI verts consecutifs sur la PR `feature/front-filtres-recherche-salles` (commits `0af11cd`, `43f73b6`, `0d6cb33`, `1a71c9b`).

**Evolution prevue :** ajouter le lint/test frontend, `npm run test:coverage` avec seuil, et un job `docker compose` de smoke test.

---

## 8. Securite et secrets

Les mesures en place sont documentees dans `docs/security.md` :

| Mesure | Statut |
|--------|--------|
| Dependabot alerts | Active |
| Dependabot security updates | Active |
| Secret scanning | Active (depot public) |
| Secret scanning push protection | Active |
| `.env` hors Git | Verifie (T30) |
| `.gitignore` | `.env`, `.env.*`, `coverage/` |

**Principes :**

- Aucune cle API dans l'historique Git ; rotation immediate en cas de fuite.
- Mots de passe BDD distincts entre dev et production.
- Service `transformAI()` teste sans dependance a une cle externe.
- Alertes Dependabot traitees via l'onglet **Security** du depot.

---

## 9. Logs prevus

**Phase actuelle (developpement) :**

- **Backend :** `console.log` au demarrage (`API demarree sur le port …`), `console.error` dans `errorHandler` pour les erreurs HTTP 4xx/5xx.
- **Docker :** `docker compose logs backend` et `docker compose logs db` pour le debug local.
- **CI :** logs GitHub Actions consultables par run (onglet Actions).

**Phase cible (supervision) :**

- Format **JSON structure** pour chaque requete (methode, route, status, duree).
- Centralisation via **Docker logging driver** ou outil type Loki / ELK.
- Alertes sur echec repete de `GET /health` ou erreurs PostgreSQL.
- Correlation des logs frontend (erreurs fetch API) et backend.

L'endpoint `/health` sert de **sonde de supervision** : il execute `SELECT 1` et retourne `{ status: "ok", database: "connected" }` si la stack est operationnelle.

---

## 10. Risques DevOps

Les cinq risques identifies sont detailles dans `docs/security.md`. Synthese :

| ID | Risque | Probabilite | Impact |
|----|--------|-------------|--------|
| R1 | Cle OpenAI exposee | Moyenne | Critique |
| R2 | IA externe indisponible en demo | Moyenne | Eleve |
| R3 | Vulnerabilites dependances npm | Elevee | Eleve |
| R4 | Fuite identifiants PostgreSQL | Faible–moyenne | Critique |
| R5 | Pipeline CI rouge ou contourne | Moyenne | Eleve |

Chaque risque dispose d'un plan d'action concret (secrets, mocks, Dependabot, protection des branches, healthchecks).

---

## 11. Commandes de lancement

**Demarrage complet (Docker) :**

```bash
git clone https://github.com/adamharbane/devops-tp-Adam-HARBANE.git
cd devops-tp-Adam-HARBANE
cp .env.example .env
docker compose up
```

**Verification :**

```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/rooms
docker compose ps
```

**Developpement backend (hors Docker) :**

```bash
cd backend
npm install
npm run dev
```

**Tests et qualite :**

```bash
cd backend
npm test
npm run test:coverage
npm run lint
```

**Frontend (catalogue salles) :**

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173 (VITE_API_URL=http://localhost:3000)
```

---

## 12. Prochaines actions

| Priorite | Action | Objectif |
|----------|--------|----------|
| Haute | Fusionner la PR CI/DevOps vers `develop` puis `main` | Badge CI vert sur la branche par defaut |
| Haute | Ajouter le frontend au `docker-compose.yml` | Stack 100 % conteneurisee pour la demo |
| Haute | Tests d'integration avec PostgreSQL (reservations, conflits) | Couvrir les cas identifies dans `docs/tests.md` |
| Moyenne | Etendre la CI au frontend (`lint` + `build` Vite) | Qualite bout-en-bout |
| Moyenne | Proteger `develop` (meme regles que `main`) | Etendre la protection aux merges sur `develop` |
| Moyenne | Integrer l'API OpenAI reelle avec fallback `transformAI` | Fonctionnalite IA en production |
| Basse | Logs JSON + dashboard (Grafana ou equivalent) | Supervision alignee avec l'objectif fil rouge |
| Basse | Deploiement staging (Railway, Render ou VPS + Compose) | CI/CD complet jusqu'a la production |

Ces actions prolongent le fil rouge vers une plateforme **deployable en continu**, tout en conservant la detection de conflits de reservation comme coeur metier.
