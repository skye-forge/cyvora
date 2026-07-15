.PHONY: help build up down restart logs shell migrate makemigrations \
        superuser test lint format backup clean

help:
	@echo "Available targets:"
	@echo "  build          Build all docker images"
	@echo "  up             Start the dev stack (db, redis, web, celery)"
	@echo "  down           Stop the dev stack"
	@echo "  restart        Restart the dev stack"
	@echo "  logs           Tail logs from all services"
	@echo "  shell          Open a Django shell inside the web container"
	@echo "  migrate        Apply database migrations"
	@echo "  makemigrations Generate new migrations"
	@echo "  superuser      Create a Django superuser"
	@echo "  test           Run the test suite"
	@echo "  lint           Run flake8"
	@echo "  format         Run black"
	@echo "  backup         Dump the database (scripts/backup.sh)"
	@echo "  clean          Remove containers, volumes, and caches"

build:
	docker compose build

up:
	docker compose up

down:
	docker compose down

restart: down up

logs:
	docker compose logs -f

shell:
	docker compose exec web python manage.py shell

migrate:
	docker compose exec web python manage.py migrate

makemigrations:
	docker compose exec web python manage.py makemigrations

superuser:
	docker compose exec web python manage.py createsuperuser

test:
	docker compose exec web pytest -q

lint:
	docker compose exec web flake8 apps core api shared integrations services tests --max-line-length=120

format:
	docker compose exec web black apps core api shared integrations services tests

backup:
	docker compose exec web ./scripts/backup.sh

clean:
	docker compose down -v --remove-orphans
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +