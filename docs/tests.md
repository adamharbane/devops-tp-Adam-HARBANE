# Strategie de tests — Plateforme de reservation de salles

Ce document identifie les **fonctionnalites critiques** du fil rouge et les cas de test associes (unitaire, integration, e2e).  
Objectif : proteger le coeur metier (reservation sans conflit), la consultation des salles et la disponibilite de la plateforme en production.

---

## Synthese

| # | Fonctionnalite critique | Route / composant | Tests identifies |
|---|-------------------------|-------------------|------------------|
| 1 | Creation de reservation avec detection de conflits | `POST /api/reservations` | 3 (unitaire + integration + e2e bonus) |
| 2 | Consultation du catalogue des salles | `GET /api/rooms`, `GET /api/rooms/:id`, frontend `App.jsx` | 3 (unitaire + integration + e2e bonus) |
| 3 | Sante de l'API et connexion PostgreSQL | `GET /health` | 3 (unitaire + integration + e2e bonus) |

**Total : 9 cas de test identifies** (6 minimum requis + 3 e2e bonus).

---

## 1. Creation de reservation avec detection de conflits

### Pourquoi c'est critique

C'est la **fonctionnalite coeur** du projet : sans reservation fiable, la plateforme n'a pas de valeur metier.  
Une erreur sur ce flux peut provoquer un **double booking** (deux groupes dans la meme salle au meme moment), ce qui contredit directement l'objectif du fil rouge : *« Eviter les conflits de planning »* (voir `README.md`).

La route `POST /api/reservations` (`backend/src/routes/reservations.js`) enchaine validation des donnees, verification de l'existence de la salle et requete SQL de detection de chevauchement (`start_time < fin AND end_time > debut`). Toute regression ici impacte immediatement les utilisateurs.

### Cas de test

#### Test unitaire — Validation des dates invalides

| Champ | Valeur |
|-------|--------|
| **Objectif** | Verifier que la couche HTTP rejette une reservation dont `end_time` est anterieure ou egale a `start_time`, sans interroger la base. |
| **Entree** | Corps JSON valide sauf `end_time: "2026-05-28T08:00:00Z"` et `start_time: "2026-05-28T09:00:00Z"`. |
| **Resultat attendu** | HTTP `400`, message `Les dates sont invalides ou end_time doit etre apres start_time.` |
| **Fichier prevu** | `backend/src/routes/reservations.test.js` |
| **Outil** | Jest + Supertest (app Express mockee, pool PostgreSQL mocke) |

#### Test d'integration — Refus d'un chevauchement de creneaux

| Champ | Valeur |
|-------|--------|
| **Objectif** | Verifier que la base de donnees empeche une seconde reservation confirmee sur un creneau deja occupe. |
| **Preconditions** | PostgreSQL demarre (`docker compose up`), salle `id = 1` existante, reservation confirmee de 09h00 a 10h00. |
| **Action** | `POST /api/reservations` avec le meme `room_id` et un creneau 09h30–10h30. |
| **Resultat attendu** | HTTP `409`, message `Conflit de reservation : la salle est deja reservee sur ce creneau.` |
| **Fichier prevu** | `backend/src/routes/reservations.integration.test.js` |
| **Outil** | Jest + Supertest + PostgreSQL (base de test ou conteneur ephemere) |

#### Test e2e (bonus) — Parcours utilisateur : tentative de double reservation

| Champ | Valeur |
|-------|--------|
| **Objectif** | Valider le flux complet API + persistance depuis l'exterieur, comme un client reel (curl ou interface future). |
| **Scenario** | 1) Creer une reservation via l'API. 2) Tenter une seconde reservation sur le meme creneau. 3) Verifier que `GET /api/reservations?room_id=1` ne contient qu'une reservation active sur ce creneau. |
| **Resultat attendu** | Premiere requete `201`, seconde `409`, liste coherente. |
| **Fichier prevu** | `e2e/reservations.spec.js` (ou script `e2e/reservations.sh`) |
| **Outil** | Playwright / Postman Collection / script shell + `docker compose` |

---

## 2. Consultation du catalogue des salles

### Pourquoi c'est critique

Avant de reserver, l'utilisateur doit **connaitre les salles disponibles** (nom, capacite, equipements, emplacement). C'est le premier point de contact avec l'application : le frontend (`frontend/src/App.jsx`) charge `GET /api/rooms` au demarrage et `GET /api/rooms/:id` pour la fiche detail.

Si cette fonctionnalite echoue, l'interface affiche une erreur bloquante et **aucune reservation n'est possible**. Elle centralise aussi l'information metier mentionnee dans les objectifs du projet (*« Centraliser les informations (capacite, equipements, disponibilites) »*).

### Cas de test

#### Test unitaire — Filtrage des salles cote frontend

| Champ | Valeur |
|-------|--------|
| **Objectif** | Verifier que le filtre par capacite minimum exclut correctement les salles trop petites, independamment de l'API. |
| **Entree** | Liste de salles `[{ id: 1, name: "A", capacity: 6 }, { id: 2, name: "B", capacity: 12 }]`, filtre `minCapacity = "10"`. |
| **Resultat attendu** | Seule la salle B est conservee. |
| **Fichier prevu** | `frontend/src/roomFilters.test.js` (logique extraite ou testee via composant) |
| **Outil** | Vitest / Jest + Testing Library |

#### Test d'integration — Liste et detail des salles via l'API

| Champ | Valeur |
|-------|--------|
| **Objectif** | Verifier que l'API retourne le catalogue seede en base et le detail d'une salle existante. |
| **Preconditions** | PostgreSQL demarre, donnees initiales presentes (`backend/src/db/init.js`). |
| **Actions** | `GET /api/rooms` puis `GET /api/rooms/1`. |
| **Resultat attendu** | `200` avec un tableau non vide ; detail avec champs `id`, `name`, `capacity`, `equipment`, `location`. |
| **Fichier prevu** | `backend/src/routes/rooms.integration.test.js` |
| **Outil** | Jest + Supertest + PostgreSQL |

#### Test e2e (bonus) — Affichage du catalogue dans le navigateur

| Champ | Valeur |
|-------|--------|
| **Objectif** | Verifier que l'utilisateur voit la liste des salles et peut ouvrir une fiche detail. |
| **Scenario** | 1) Demarrer `docker compose up`. 2) Ouvrir le frontend. 3) Verifier la presence du titre « Catalogue des salles ». 4) Cliquer sur une salle et verifier l'affichage de sa capacite. |
| **Resultat attendu** | Liste chargee, fiche detail visible, aucun message d'erreur API. |
| **Fichier prevu** | `e2e/rooms-catalog.spec.js` |
| **Outil** | Playwright |

---

## 3. Sante de l'API et connexion PostgreSQL

### Pourquoi c'est critique

Cette fonctionnalite est le **point de controle DevOps** de la plateforme. La route `GET /health` (`backend/src/routes/health.js`) execute `SELECT 1` sur PostgreSQL et retourne le statut du service.

Elle est utilisee pour :

- valider un deploiement (`curl http://localhost:4000/health` dans le `README.md`) ;
- alimenter les healthchecks Docker / orchestrateur ;
- declencher ou bloquer un pipeline CI/CD ;
- detecter une panne base avant que les utilisateurs ne subissent des erreurs 500 sur les reservations.

Sans ce signal fiable, la supervision et l'automatisation du fil rouge perdent leur sens.

### Cas de test

#### Test unitaire — Reponse JSON structuree en cas de succes

| Champ | Valeur |
|-------|--------|
| **Objectif** | Verifier le format de la reponse lorsque la requete SQL reussit. |
| **Entree** | Mock de `query()` retournant `{ rows: [{ "?column?": 1 }] }`. |
| **Resultat attendu** | HTTP `200`, corps `{ status: "ok", service: "room-reservation-api", database: "connected" }`. |
| **Fichier prevu** | `backend/src/routes/health.test.js` |
| **Outil** | Jest + Supertest (pool mocke) |

#### Test d'integration — Healthcheck avec PostgreSQL reel

| Champ | Valeur |
|-------|--------|
| **Objectif** | Verifier que l'API demarree avec Docker peut joindre la base. |
| **Preconditions** | `docker compose up` (services `api` + `db` healthy). |
| **Action** | `GET /health` |
| **Resultat attendu** | HTTP `200`, `status: "ok"`, `database: "connected"`. |
| **Fichier prevu** | `backend/src/routes/health.integration.test.js` |
| **Outil** | Jest + Supertest ou script CI |

#### Test e2e (bonus) — Validation post-deploiement complete

| Champ | Valeur |
|-------|--------|
| **Objectif** | Simuler la verification manuelle decrite dans le README apres clone et demarrage. |
| **Scenario** | 1) `docker compose up --build`. 2) `docker compose ps` → statut `Up`. 3) `curl /health` → `ok`. 4) `curl /api/rooms` → reponse valide. |
| **Resultat attendu** | Plateforme consideree « operationnelle » selon les criteres du README. |
| **Fichier prevu** | `e2e/smoke.spec.js` ou job CI `smoke-test` |
| **Outil** | GitHub Actions + curl / Playwright |

---

## Pyramide de tests cible

```text
        /  E2E (bonus)  \        ← 3 scenarios (reservation, catalogue, smoke)
       /-----------------\
      /  Integration (6)  \      ← routes + PostgreSQL / docker compose
     /---------------------\
    /    Unitaire (6+)     \     ← validation, filtres, format health
   /-------------------------\
```

## Correspondance avec les tests existants

| Fichier | Couverture | Fonctionnalite |
|---------|------------|----------------|
| `backend/tests/sanity.test.js` | Config Jest | Sanity check |
| `backend/tests/app.test.js` | `app.js` | Routes racine et 404 |
| `backend/tests/health.unit.test.js` | `health.js` | Sante API + BDD |
| `backend/tests/rooms.unit.test.js` | `rooms.js` | Validation creation salle |
| `backend/tests/reservations.unit.test.js` | `reservations.js` | Validation dates |
| `backend/tests/routes.unit.test.js` | `rooms.js`, `reservations.js` | CRUD mocke |
| `backend/tests/errorHandler.unit.test.js` | `errorHandler.js` | Gestion des erreurs |
| `backend/tests/ai.unit.test.js` | `aiAnalysis.js` | Transformation IA mockee |

---

## Rapport de couverture (T21)

**Commande :** `cd backend && npm run test:coverage`  
**Rapport HTML :** `backend/coverage/index.html` (dossier ignore par Git via `coverage/` dans `.gitignore`)

**Seuil minimal configure :** 60 % de line coverage (`jest.config.js` → `coverageThreshold.global.lines`)

**Dernier rapport (backend/src) :**

```text
------------------|---------|----------|---------|---------|-------------------
File              | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
------------------|---------|----------|---------|---------|-------------------
All files         |   92.63 |    90.62 |    92.3 |   92.63 |
 src              |     100 |    88.88 |     100 |     100 |
  app.js          |     100 |      100 |     100 |     100 |
  config.js       |     100 |    88.88 |     100 |     100 | 8-9
 src/db           |   66.66 |      100 |       0 |   66.66 |
  pool.js         |   66.66 |      100 |       0 |   66.66 | 15
 src/middleware   |     100 |      100 |     100 |     100 |
  errorHandler.js |     100 |      100 |     100 |     100 |
 src/routes       |   91.17 |    96.87 |     100 |   91.17 |
  health.js       |     100 |      100 |     100 |     100 |
  reservations.js |   92.68 |    95.83 |     100 |   92.68 | 44,98,120
  rooms.js        |   85.71 |      100 |     100 |   85.71 | 15,34,57
 src/services     |     100 |       70 |     100 |     100 |
  aiAnalysis.js   |     100 |       70 |     100 |     100 | 11-13
------------------|---------|----------|---------|---------|-------------------

Test Suites: 8 passed, 8 total
Tests:       25 passed, 25 total
```

**Objectif T21 atteint :** line coverage **92,63 %** (seuil requis : 60 %).

**Lignes non couvertes restantes :** branches `catch` rares dans les routes (`rooms.js`, `reservations.js`) et fonction `query()` de `pool.js` (requiert connexion PostgreSQL reelle — prevue en tests d'integration).

## Commandes utiles

```bash
# Tests unitaires backend
cd backend && npm test

# Couverture
cd backend && npm run test:coverage

# Verification manuelle integration (health)
curl http://localhost:4000/health

# Verification manuelle integration (salles)
curl http://localhost:4000/api/rooms
```
