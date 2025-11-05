# 🚗 RutaFem API Backend

API REST pour l'application de covoiturage entre femmes RutaFem.

## 🚀 Démarrage rapide

### Installation

```bash
npm install
```

### Variables d'environnement

Créez un fichier `.env` à la racine du projet :

```env
DATABASE_URL="postgresql://user:password@localhost:5432/rutafem"
BETTER_AUTH_SECRET="your-secret-key-here"
BASE_URL="http://localhost:3000"
FRONTEND_URL="http://localhost:3001"
PORT=3000
LOG_LEVEL="info"
```

### Lancer la base de données

```bash
docker-compose up -d
```

### Migrations Prisma

```bash
npx prisma migrate dev
```

### Lancer le serveur

```bash
npm run dev
```

Le serveur démarre sur `http://localhost:3000`

## 📚 Documentation API

### Accès à la documentation Swagger

Une fois le serveur démarré, accédez à la documentation interactive Swagger UI :

**🔗 [http://localhost:3000/api-docs](http://localhost:3000/api-docs)**

La documentation Swagger est **accessible** et vous permet de :

-   ✅ Voir tous les endpoints disponibles
-   ✅ Consulter les schémas de données
-   ✅ Tester directement les requêtes depuis le navigateur
-   ✅ Voir les exemples de requêtes/réponses

### Spécification OpenAPI JSON

Vous pouvez également accéder à la spécification OpenAPI 3.0 au format JSON :

**🔗 [http://localhost:3000/api-docs.json](http://localhost:3000/api-docs.json)**

Utile pour importer dans Postman, Insomnia, Bruno, etc.

## 🔐 Tester les endpoints protégés

### Étape 1 : Créer un compte

1. Allez sur `/api/auth/register` dans Swagger
2. Cliquez sur **"Try it out"**
3. Remplissez les champs requis :

```json
{
    "email": "marie@example.com",
    "password": "Password123!",
    "firstname": "Marie",
    "lastname": "Dupont",
    "username": "marie_d",
    "phoneNumber": "+33612345678",
    "birthDate": "1995-05-15T00:00:00Z"
}
```

4. Cliquez sur **"Execute"**
5. Dans la réponse, copiez le **token** (dans `data.token`)

### Étape 2 : Authentifier vos requêtes

1. En haut à droite de la page Swagger, cliquez sur le bouton **"Authorize"** 🔓
2. Collez votre token dans le champ (sans ajouter "Bearer ")
3. Cliquez sur **"Authorize"** puis **"Close"**
4. Le cadenas 🔒 devient vert, vous pouvez maintenant tester tous les endpoints protégés !

## 📋 Endpoints disponibles

### 🔑 Authentification (`/api/auth`)

-   `POST /api/auth/register` - Créer un compte
-   `POST /api/auth/login` - Se connecter
-   `POST /api/auth/logout` - Se déconnecter
-   `GET /api/auth/session` - Récupérer la session actuelle

### 👤 Profils (`/api/profiles`)

**Protégés** 🔒 (requiert authentification) :

-   `GET /api/profiles/profile` - Mon profil
-   `PATCH /api/profiles/profile` - Modifier mon profil
-   `DELETE /api/profiles/profile` - Supprimer mon compte
-   `POST /api/profiles/change-password` - Changer mon mot de passe

**Publics** :

-   `GET /api/profiles` - Liste de tous les profils
-   `GET /api/profiles/:id` - Détails d'un profil

### 🚘 Trajets (`/api/rides`)

**Protégés** 🔒 (requiert authentification) :

-   `POST /api/rides` - Créer un trajet
-   `PATCH /api/rides/:id` - Modifier un trajet
-   `DELETE /api/rides/:id` - Supprimer un trajet

**Publics** :

-   `GET /api/rides` - Liste de tous les trajets
-   `GET /api/rides/:id` - Détails d'un trajet

## 🛠️ Technologies

### Backend

-   **Node.js** + **Express** - Backend framework
-   **TypeScript** - Type safety
-   **Prisma** - ORM pour PostgreSQL
-   **Better Auth** - Authentification
-   **Zod** - Validation des schémas
-   **Swagger** - Documentation API

### Monitoring & Observabilité

-   **Pino** - Logging structuré JSON
-   **Prometheus** - Collecte de métriques
-   **Grafana** - Visualisation de métriques et logs
-   **Loki** - Agrégation de logs
-   **prom-client** - Instrumentation des métriques HTTP

## 📝 Format des réponses

Toutes les réponses suivent le format :

**Succès :**

```json
{
  "success": true,
  "message": "Message optionnel",
  "data": { ... }
}
```

**Erreur :**

```json
{
    "success": false,
    "message": "Description de l'erreur"
}
```

## ⚙️ Configuration

### Authentification

-   Les tokens de session sont valides **7 jours**
-   Les sessions sont mises à jour si > 24h
-   Support des tokens Bearer (mobile) et cookies (web)

## 🐳 Docker

Lancer la stack complète (backend + monitoring) :

```bash
docker-compose up -d
```

Cela démarre :

-   **Backend API** (port 3000)
-   **Prometheus** (port 9090) - Collecte des métriques
-   **Grafana** (port 3001) - Visualisation
-   **Loki** (port 3100) - Agrégation des logs
-   **Promtail** - Collecteur de logs

## 📊 Monitoring & Observabilité

### Accès aux outils

| Service        | URL                           | Identifiants  |
| -------------- | ----------------------------- | ------------- |
| **Grafana**    | http://localhost:3001         | admin / admin |
| **Prometheus** | http://localhost:9090         | -             |
| **Métriques**  | http://localhost:3000/metrics | -             |

### Dashboards Grafana

**1. RutaFem Backend Monitoring** (Métriques)

-   📈 Latence HTTP (p50, p95, p99) par route
-   🔄 Requests Per Second (RPS) par route
-   ❌ Taux d'erreurs 5xx
-   📊 Distribution des status codes

**2. RutaFem Logs & Errors** (Logs)

-   📜 Logs en temps réel (JSON structuré)
-   ❌ Filtrage des erreurs uniquement
-   🐌 Détection des requêtes lentes (>500ms)
-   🔍 Recherche par `request_id` pour tracer les requêtes

### Tests de charge (k6)

Pour désactiver le rate limiting pendant les tests :

```bash
DISABLE_RATE_LIMIT=true docker-compose up
```

Ou dans votre fichier `.env` :

```env
DISABLE_RATE_LIMIT=true
```

### Corrélation des logs

Chaque requête possède un `request_id` unique UUID pour tracer son parcours complet :

```json
{
    "level": "info",
    "request_id": "550e8400-e29b-41d4-a716-446655440000",
    "method": "GET",
    "path": "/api/rides",
    "status_code": 200,
    "duration_ms": 45,
    "msg": "Request completed"
}
```

## 📦 Scripts disponibles

```bash
npm run dev          # Mode développement avec logs pretty (local)
npm run dev:docker   # Mode développement avec logs JSON (Docker)
npm run build        # Compilation TypeScript
npm run start        # Lancer en production
```
