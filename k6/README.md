# Tests K6 - RutaFem Backend

Ce dossier contient les tests de charge K6 pour l'API RutaFem.

## 📁 Structure

```
k6/
├── config.js         # Configuration centralisée (SLOs, endpoints)
├── smoke-test.js     # Test de fumée (5 VUs, 1min)
├── stress-test.js    # Test de stress (0-100 VUs, ~5min)
└── README.md         # Ce fichier
```

## 🎯 Objectifs des Tests

### Smoke Test
- **But**: Vérifier que l'application fonctionne sous charge minimale
- **Charge**: 5 utilisateurs virtuels constants
- **Durée**: 1 minute
- **Quand l'utiliser**: Après chaque déploiement, avant les tests plus lourds

### Stress Test
- **But**: Identifier les limites du système et les goulots
- **Charge**: Progressive (0 → 50 → 100 VUs)
- **Durée**: ~5 minutes
- **Quand l'utiliser**: Avant mise en production, pour la baseline

## 📊 SLOs (Service Level Objectives)

Les SLOs définis dans `config.js`:

| Métrique | Objectif | Description |
|----------|----------|-------------|
| p95 | < 300ms | 95% des requêtes doivent répondre en moins de 300ms |
| p99 | < 500ms | 99% des requêtes doivent répondre en moins de 500ms |
| Erreurs 5xx | < 1% | Moins de 1% d'erreurs serveur |
| Disponibilité | > 99% | Service disponible 99% du temps |

## 🚀 Exécution

Les tests K6 s'exécutent via Docker (pas besoin d'installer K6 localement).

### Méthode 1: Makefile (recommandé)

```bash
# Voir toutes les commandes disponibles
make help

# Smoke test
make smoke

# Stress test
make stress

# Établir la baseline (smoke + métriques)
make baseline

# Voir les métriques en temps réel
make metrics

# Nettoyer les résultats
make clean
```

### Méthode 2: Docker Compose manuel

```bash
# Démarrer le backend
docker-compose up -d backend

# Lancer le smoke test
docker-compose run --rm k6 run /scripts/smoke-test.js

# Lancer le stress test
docker-compose run --rm k6 run /scripts/stress-test.js

# Arrêter
docker-compose down
```

## 📈 Résultats

Les résultats sont sauvegardés dans le dossier `results/`:

- `smoke-test-summary.json` - Résumé JSON du smoke test
- `stress-test-summary.json` - Résumé JSON du stress test
- `stress-test-report.txt` - Rapport détaillé du stress test
- `baseline-metrics.json` - Métriques baseline de l'API

## 🔍 Analyser les Résultats

### 1. Vérifier les SLOs

Regardez le rapport en console après l'exécution:
- ✅ = SLO respecté
- ❌ = SLO dépassé (action requise)

### 2. Métriques à surveiller

**Temps de réponse**:
- Si p95 > 300ms → Investiguer les endpoints lents
- Si p99 > 500ms → Problème de performance

**Erreurs**:
- Si taux d'erreur > 1% → Vérifier les logs backend
- Regarder les status codes (4xx vs 5xx)

**Endpoint critique** (`/api/rides`):
- Surveiller spécifiquement sa latence
- C'est l'endpoint le plus sollicité

### 3. Consulter les métriques backend

```bash
# Métriques en temps réel
curl http://localhost:3000/metrics | jq

# Ou via Makefile
make metrics
```

## 🔧 Personnalisation

### Modifier les SLOs

Éditez `k6/config.js`:

```javascript
export const SLO = {
  p95Duration: 300,
  p99Duration: 500,
  errorRate: 0.01,
};
```

### Modifier le scénario de stress

Éditez `k6/stress-test.js`, section `options.stages`:

```javascript
stages: [
  { duration: '1m', target: 50 }, 
  { duration: '2m', target: 50 },
  // ... ajouter/modifier les étapes
]
```

### Ajouter des endpoints à tester

1. Ajouter l'endpoint dans `config.js`
2. Ajouter le test dans `smoke-test.js` ou `stress-test.js`