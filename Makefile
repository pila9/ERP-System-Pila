SHELL := /bin/bash
COMPOSE := docker compose

.DEFAULT_GOAL := help

.PHONY: help
help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

.PHONY: up
up: ## Build images and start the whole stack (db + api + web)
	$(COMPOSE) up -d --build
	@echo ""
	@echo "  App  -> http://localhost:$${WEB_PORT:-8080}"
	@echo "  Mail -> admin@erp.test / password"

.PHONY: dev
dev: ## Start stack with Vite dev server + HMR (http://localhost:5173)
	$(COMPOSE) --profile dev up -d --build
	@echo ""
	@echo "  Dev  -> http://localhost:$${VITE_PORT:-5173}"

.PHONY: down
down: ## Stop containers (keep data)
	$(COMPOSE) down

.PHONY: destroy
destroy: ## Stop containers and DELETE the database volume
	$(COMPOSE) down -v

.PHONY: logs
logs: ## Tail logs from all services
	$(COMPOSE) logs -f

.PHONY: api-logs
api-logs: ## Tail API (php-fpm) logs
	$(COMPOSE) logs -f api

.PHONY: ps
ps: ## Show container status
	$(COMPOSE) ps

.PHONY: shell
shell: ## Open a bash shell inside the API container
	$(COMPOSE) --profile tools run --rm shell

.PHONY: artisan
artisan: ## Run artisan in the API container (make artisan migrate)
	$(COMPOSE) exec api php artisan $(ARGS)

.PHONY: migrate
migrate: ## Run database migrations
	$(COMPOSE) exec api php artisan migrate --force

.PHONY: migrate-fresh
migrate-fresh: ## Drop all tables, re-migrate and re-seed demo data
	$(COMPOSE) exec api php artisan migrate:fresh --seed --force

.PHONY: seed
seed: ## Seed demo data
	$(COMPOSE) exec api php artisan db:seed --force

.PHONY: assets
assets: ## Force rebuild of the React production bundle
	$(COMPOSE) run --rm -e FORCE_BUILD=1 assets

.PHONY: test-api
test-api: ## Run backend test suite
	$(COMPOSE) exec api php artisan test

.PHONY: build-assets
build-assets: ## Build React locally with node (no Docker)
	cd frontend && npm install && npm run build

.PHONY: clean
clean: ## Remove local node_modules and frontend dist
	rm -rf frontend/node_modules frontend/dist

.PHONY: smoke
smoke: ## End-to-end API smoke test (stack must be running)
	@./scripts/smoke-test.sh http://localhost:$${WEB_PORT:-8080}