.PHONY: help start stop smoke stress baseline metrics clean

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

stop: ## Arrêter tous les services
	@echo "$(RED)🛑 Arrêt des services...$(NC)"
	docker-compose down
	@echo "$(GREEN)✅ Services arrêtés$(NC)"

smoke: ## Exécuter le smoke test (5 VUs, 1min)
	@echo "$(BLUE)🧪 Lancement du smoke test...$(NC)"
	@mkdir -p results
	docker-compose up -d backend
	@echo "$(YELLOW)⏳ Attente du backend...$(NC)"
	@sleep 5
	docker-compose run --rm k6 run /scripts/smoke-test.js
	@echo "$(GREEN)✅ Smoke test terminé$(NC)"
	@echo "$(BLUE)📊 Résultats dans: results/smoke-test-summary.json$(NC)"

stress: ## Exécuter le stress test (0->100 VUs, ~5min)
	@echo "$(BLUE)💪 Lancement du stress test...$(NC)"
	@mkdir -p results
	docker-compose up -d backend
	@echo "$(YELLOW)⏳ Attente du backend...$(NC)"
	@sleep 5
	docker-compose run --rm k6 run /scripts/stress-test.js
	@echo "$(GREEN)✅ Stress test terminé$(NC)"
	@echo "$(BLUE)📊 Résultats dans: results/stress-test-summary.json$(NC)"
	@echo "$(BLUE)📄 Rapport dans: results/stress-test-report.txt$(NC)"

baseline: smoke ## Établir la baseline (smoke test + métriques)
	@echo "$(BLUE)📏 Collecte des métriques baseline...$(NC)"
	@curl -s http://localhost:3000/metrics | jq '.' > results/baseline-metrics.json || echo "⚠️  Impossible de récupérer les métriques (backend arrêté?)"
	@echo "$(GREEN)✅ Baseline établie$(NC)"
	@echo ""
	@echo "$(YELLOW)📊 Métriques sauvegardées dans:$(NC)"
	@echo "  - results/smoke-test-summary.json"
	@echo "  - results/baseline-metrics.json"

metrics: ## Afficher les métriques actuelles
	@echo "$(BLUE)📊 Métriques actuelles:$(NC)"
	@echo ""
	@curl -s http://localhost:3000/metrics | jq '.' || echo "$(RED)❌ Backend non accessible$(NC)"

logs: ## Afficher les logs du backend
	@docker-compose logs -f backend

clean: ## Nettoyer les résultats et arrêter les services
	@echo "$(RED)🧹 Nettoyage...$(NC)"
	@rm -rf results/*.json results/*.txt
	@docker-compose down -v
	@echo "$(GREEN)✅ Nettoyage terminé$(NC)"

install-deps: ## Installer les dépendances nécessaires (jq pour les rapports)
	@echo "$(BLUE)📦 Vérification des dépendances...$(NC)"
	@command -v jq >/dev/null 2>&1 || { echo "$(YELLOW)⚠️  jq n'est pas installé. Installation recommandée: brew install jq$(NC)"; }
	@command -v docker >/dev/null 2>&1 || { echo "$(RED)❌ Docker n'est pas installé$(NC)"; exit 1; }
	@command -v docker-compose >/dev/null 2>&1 || { echo "$(RED)❌ Docker Compose n'est pas installé$(NC)"; exit 1; }
	@echo "$(GREEN)✅ Toutes les dépendances sont présentes$(NC)"
