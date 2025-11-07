.PHONY: help start start-all stop smoke stress smoke-local stress-local baseline metrics logs clean install-deps

# Couleurs pour l'affichage
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

help: ## Afficher l'aide
	@echo "$(BLUE)═══════════════════════════════════════════════$(NC)"
	@echo "$(BLUE)  RutaFem Backend - Tests K6$(NC)"
	@echo "$(BLUE)═══════════════════════════════════════════════$(NC)"
	@echo ""
	@echo "$(GREEN)Commandes disponibles:$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-15s$(NC) %s\n", $$1, $$2}'
	@echo ""

start: ## Démarrer le backend
	@echo "$(GREEN)🚀 Démarrage du backend...$(NC)"
	docker-compose up -d backend
	@echo "$(GREEN)✅ Backend démarré sur http://localhost:3000$(NC)"

start-all: ## Démarrer toute la stack (backend + monitoring)
	@echo "$(GREEN)🚀 Démarrage de toute la stack...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)✅ Stack démarrée$(NC)"
	@echo "$(BLUE)📊 Services disponibles:$(NC)"
	@echo "  - Backend: http://localhost:3000"
	@echo "  - Grafana: http://localhost:3001 (admin/admin)"
	@echo "  - Prometheus: http://localhost:9090"

stop: ## Arrêter tous les services
	@echo "$(RED)🛑 Arrêt des services...$(NC)"
	docker-compose down
	@echo "$(GREEN)✅ Services arrêtés$(NC)"

smoke: ## Exécuter le smoke test (5 VUs, 1min) avec export Prometheus
	@echo "$(BLUE)🧪 Lancement du smoke test...$(NC)"
	@mkdir -p k6/results
	@echo "$(YELLOW)⏳ Démarrage du backend...$(NC)"
	@DISABLE_RATE_LIMIT=true docker-compose up -d backend
	@echo "$(YELLOW)⏳ Attente du backend...$(NC)"
	@sleep 5
	@echo "$(BLUE)📊 Lancement du test avec export Prometheus...$(NC)"
	@DISABLE_RATE_LIMIT=true docker-compose run --rm k6 run --out experimental-prometheus-rw /scripts/smoke-test.js
	@echo "$(GREEN)✅ Smoke test terminé$(NC)"
	@echo "$(BLUE)📊 Résultats dans: k6/results/smoke-test-summary.json$(NC)"
	@echo "$(BLUE)📈 Visualiser dans Grafana: http://localhost:3001$(NC)"

stress: ## Exécuter le stress test (0->100 VUs, ~5min) avec export Prometheus
	@echo "$(BLUE)💪 Lancement du stress test...$(NC)"
	@mkdir -p k6/results
	@echo "$(YELLOW)⏳ Démarrage du backend...$(NC)"
	@DISABLE_RATE_LIMIT=true docker-compose up -d backend
	@echo "$(YELLOW)⏳ Attente du backend...$(NC)"
	@sleep 5
	@echo "$(BLUE)📊 Lancement du test avec export Prometheus...$(NC)"
	@echo "$(YELLOW)⚠️  Ce test va durer ~5 minutes$(NC)"
	@echo "$(BLUE)📈 Ouvrez Grafana pendant le test: http://localhost:3001$(NC)"
	@DISABLE_RATE_LIMIT=true docker-compose run --rm k6 run --out experimental-prometheus-rw /scripts/stress-test.js
	@echo "$(GREEN)✅ Stress test terminé$(NC)"
	@echo "$(BLUE)📊 Résultats dans: k6/results/stress-test-summary.json$(NC)"
	@echo "$(BLUE)📄 Rapport dans: k6/results/stress-test-report.txt$(NC)"
	@echo "$(BLUE)📈 Visualiser dans Grafana: http://localhost:3001$(NC)"

smoke-local: ## Exécuter le smoke test sans export Prometheus (console uniquement)
	@echo "$(BLUE)🧪 Lancement du smoke test (local)...$(NC)"
	@mkdir -p k6/results
	@echo "$(YELLOW)⏳ Démarrage du backend...$(NC)"
	@DISABLE_RATE_LIMIT=true docker-compose up -d backend
	@echo "$(YELLOW)⏳ Attente du backend...$(NC)"
	@sleep 5
	@DISABLE_RATE_LIMIT=true docker-compose run --rm k6 run /scripts/smoke-test.js
	@echo "$(GREEN)✅ Smoke test terminé$(NC)"
	@echo "$(BLUE)📊 Résultats dans: k6/results/smoke-test-summary.json$(NC)"

stress-local: ## Exécuter le stress test sans export Prometheus (console uniquement)
	@echo "$(BLUE)💪 Lancement du stress test (local)...$(NC)"
	@mkdir -p k6/results
	@echo "$(YELLOW)⏳ Démarrage du backend...$(NC)"
	@DISABLE_RATE_LIMIT=true docker-compose up -d backend
	@echo "$(YELLOW)⏳ Attente du backend...$(NC)"
	@sleep 5
	@echo "$(YELLOW)⚠️  Ce test va durer ~5 minutes$(NC)"
	@DISABLE_RATE_LIMIT=true docker-compose run --rm k6 run /scripts/stress-test.js
	@echo "$(GREEN)✅ Stress test terminé$(NC)"
	@echo "$(BLUE)📊 Résultats dans: k6/results/stress-test-summary.json$(NC)"
	@echo "$(BLUE)📄 Rapport dans: k6/results/stress-test-report.txt$(NC)"

baseline: smoke ## Établir la baseline (smoke test + métriques)
	@echo "$(BLUE)📏 Collecte des métriques baseline...$(NC)"
	@mkdir -p k6/results
	@curl -s http://localhost:3000/metrics | jq '.' > k6/results/baseline-metrics.json || echo "⚠️  Impossible de récupérer les métriques (backend arrêté?)"
	@echo "$(GREEN)✅ Baseline établie$(NC)"
	@echo ""
	@echo "$(YELLOW)📊 Métriques sauvegardées dans:$(NC)"
	@echo "  - k6/results/smoke-test-summary.json"
	@echo "  - k6/results/baseline-metrics.json"

metrics: ## Afficher les métriques actuelles
	@echo "$(BLUE)📊 Métriques actuelles:$(NC)"
	@echo ""
	@curl -s http://localhost:3000/metrics | jq '.' || echo "$(RED)❌ Backend non accessible$(NC)"

logs: ## Afficher les logs du backend
	@docker-compose logs -f backend

clean: ## Nettoyer les résultats et arrêter les services
	@echo "$(RED)🧹 Nettoyage...$(NC)"
	@rm -rf k6/results/*.json k6/results/*.txt
	@docker-compose down -v
	@echo "$(GREEN)✅ Nettoyage terminé$(NC)"

install-deps: ## Installer les dépendances nécessaires (jq pour les rapports)
	@echo "$(BLUE)📦 Vérification des dépendances...$(NC)"
	@command -v jq >/dev/null 2>&1 || { echo "$(YELLOW)⚠️  jq n'est pas installé. Installation recommandée: brew install jq$(NC)"; }
	@command -v docker >/dev/null 2>&1 || { echo "$(RED)❌ Docker n'est pas installé$(NC)"; exit 1; }
	@command -v docker-compose >/dev/null 2>&1 || { echo "$(RED)❌ Docker Compose n'est pas installé$(NC)"; exit 1; }
	@echo "$(GREEN)✅ Toutes les dépendances sont présentes$(NC)"
