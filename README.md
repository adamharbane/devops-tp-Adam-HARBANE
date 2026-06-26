# Plateforme de reservation de salles

![CI](https://github.com/adamharbane/devops-tp-Adam-HARBANE/actions/workflows/ci.yml/badge.svg)

## Description

Ce projet vise a concevoir et deployer une plateforme web de reservation de salles (reunion, formation, evenement).  
L'objectif est de permettre aux utilisateurs de consulter les disponibilites, reserver un creneau et gerer leurs reservations facilement, tout en offrant aux administrateurs des outils de pilotage.

## Objectifs du projet

- Simplifier la gestion des reservations de salles.
- Eviter les conflits de planning.
- Centraliser les informations (capacite, equipements, disponibilites).
- Mettre en place une architecture DevOps complete (CI/CD, conteneurisation, supervision).

## Architecture technique

- **Frontend** : interface React / Vite (`http://localhost:5173`).
- **Backend** : API REST Node.js / Express (`http://localhost:3000`).
- **Base de donnees** : PostgreSQL 16.
- **Conteneurisation** : Docker / Docker Compose.
- **CI/CD** : pipeline d'integration et de deploiement automatise.
- **Supervision** : logs, metriques et alertes.

## Structure du projet

```text
.
|-- README.md
|-- docker-compose.yml
|-- .env.example
|-- backend/
|   |-- Dockerfile
|   |-- package.json
|   `-- src/
|-- frontend/
`-- docs/
```

## Prerequis

- **Git**
- **Docker** et **Docker Compose** (methode recommandee)
- **Node.js 20+** et **npm** (developpement local ou tests sans conteneur)

## Lancer le projet

### Commandes npm

| Dossier | Commande | Role |
|---------|----------|------|
| `backend/` | `npm install` | Installer les dependances API |
| `backend/` | `npm run dev` | Lancer l'API en developpement (port 3000) |
| `backend/` | `npm start` | Lancer l'API en production |
| `frontend/` | `npm install` | Installer les dependances React |
| `frontend/` | `npm run dev` | Lancer l'interface Vite (port 5173) |
| `frontend/` | `npm run build` | Builder le frontend pour la production |

**Lancement complet (2 terminaux) :**

```bash
# Terminal 1 — API + base de donnees
docker compose up

# Terminal 2 — Frontend
cd frontend && npm install && npm run dev
```

**Lancement 100 % npm (sans Docker) :**

```bash
# Terminal 1 — Backend
cd backend && npm install && npm run dev

# Terminal 2 — Frontend
cd frontend && npm install && npm run dev
```

### Methode rapide (Docker + frontend local)

```bash
git clone https://github.com/adamharbane/devops-tp-Adam-HARBANE.git
cd devops-tp-Adam-HARBANE
cp .env.example .env
docker compose up
```

Dans un **second terminal**, lancer le frontend :

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

| Service | URL |
|---------|-----|
| API (backend) | http://localhost:3000 |
| Interface (frontend) | http://localhost:5173 |
| Sante API | http://localhost:3000/health |

### Backend seul (Docker)

Le `docker compose up` demarre l'API et PostgreSQL. Aucune installation Node locale requise.

```bash
cp .env.example .env
docker compose up
```

Verification :

```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/rooms
```

### Backend en local (sans Docker)

Necessite PostgreSQL accessible (local ou conteneur `db` seul).

```bash
cd backend
npm install
cp ../.env.example ../.env
# Adapter POSTGRES_HOST=localhost dans .env
npm run dev
```

L'API ecoute sur le port defini par `API_PORT` (3000 par defaut).

### Frontend seul (developpement)

Le frontend appelle l'API via `VITE_API_URL` (fichier `frontend/.env`).

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Ouvrir **http://localhost:5173**. L'API doit deja tourner sur **http://localhost:3000** (`docker compose up` ou `npm run dev` dans `backend/`).

Variables utiles :

- Racine `.env` : `API_PORT`, `CORS_ORIGIN=http://localhost:5173`, identifiants PostgreSQL
- `frontend/.env` : `VITE_API_URL=http://localhost:3000`

## Utilisation

### Verifier l'API

```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/rooms
```

### Exemples d'appels

Lister les salles :

```bash
curl http://localhost:3000/api/rooms
```

Creer une reservation :

```cmd
curl -X POST http://localhost:3000/api/reservations -H "Content-Type: application/json" -d "{\"room_id\":1,\"user_name\":\"Adam\",\"title\":\"Reunion\",\"start_time\":\"2026-05-28T09:00:00Z\",\"end_time\":\"2026-05-28T10:00:00Z\"}"
```

Annuler une reservation :

```bash
curl -X DELETE http://localhost:3000/api/reservations/1
```

## Qualite et automatisation (DevOps)

- Lint et tests automatises.
- Build et verification en CI a chaque push/pull request.
- Deploiement automatise selon l'environnement (dev, staging, prod).
- Observabilite : collecte des logs et indicateurs de performance.

## Validation du lancement

Apres le clone et le demarrage, la plateforme est consideree operationnelle si :

- Les conteneurs sont au statut `Up` via `docker compose ps`.
- L'API repond sur `http://localhost:3000/health` avec `{"status":"ok"}`.
- Le frontend affiche le catalogue des salles sur `http://localhost:5173`.
- Les routes `/api/rooms` et `/api/reservations` repondent correctement.

## Contribution

Les contributions sont les bienvenues :

1. Creer une branche : `feature/nom-fonctionnalite`
2. Committer les changements.
3. Ouvrir une Pull Request.

## Auteur

Projet realise par **Adam HARBANE**.