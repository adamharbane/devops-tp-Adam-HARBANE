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

- **Frontend** : interface web (a venir).
- **Backend** : API REST Node.js / Express (`http://localhost:4000`).
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

- Git
- Docker et Docker Compose (recommande)
- Node.js 20+ et npm (si execution locale sans conteneur)
- Un SGBD (si execution hors Docker)

## Installation et demarrage

1. Cloner le depot :

```bash
git clone https://github.com/adamharbane/devops-tp-Adam-HARBANE.git
cd devops-tp-Adam-HARBANE
```

2. Configurer les variables d'environnement :

- Copier les fichiers d'exemple (si presents), par exemple :
  - `.env.example` -> `.env`
- Renseigner les informations de connexion (BDD, ports, secrets, etc.).

3. Lancer l'application :

```bash
docker compose up --build
```

4. Verifier que les services sont en ligne :

```bash
docker compose ps
```

## Utilisation

### Verifier l'API

```bash
curl http://localhost:4000/health
curl http://localhost:4000/api/rooms
```

### Exemples d'appels

Lister les salles :

```bash
curl http://localhost:4000/api/rooms
```

Creer une reservation :

```cmd
curl -X POST http://localhost:4000/api/reservations -H "Content-Type: application/json" -d "{\"room_id\":1,\"user_name\":\"Adam\",\"title\":\"Reunion\",\"start_time\":\"2026-05-28T09:00:00Z\",\"end_time\":\"2026-05-28T10:00:00Z\"}"
```

Annuler une reservation :

```bash
curl -X DELETE http://localhost:4000/api/reservations/1
```

## Qualite et automatisation (DevOps)

- Lint et tests automatises.
- Build et verification en CI a chaque push/pull request.
- Deploiement automatise selon l'environnement (dev, staging, prod).
- Observabilite : collecte des logs et indicateurs de performance.

## Validation du lancement

Apres le clone et le demarrage, la plateforme est consideree operationnelle si :

- Les conteneurs sont au statut `Up` via `docker compose ps`.
- L'API repond sur `http://localhost:4000/health` avec `{"status":"ok"}`.
- Les routes `/api/rooms` et `/api/reservations` repondent correctement.

## Contribution

Les contributions sont les bienvenues :

1. Creer une branche : `feature/nom-fonctionnalite`
2. Committer les changements.
3. Ouvrir une Pull Request.

## Auteur

Projet realise par **Adam HARBANE**.