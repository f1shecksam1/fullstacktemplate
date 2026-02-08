.PHONY: help install install-dev frontend-install frontend-build frontend-serve up down run lint format typecheck check test test-backend test-frontend precommit clean

help:
	@python -c "print('Targets: install, install-dev, frontend-install, frontend-build, frontend-serve, up, down, run, lint, format, typecheck, check, test, test-backend, test-frontend, precommit, clean')"

install:
	python -m pip install -e .

install-dev:
	python -m pip install -e .[dev]

frontend-install:
	cd frontend && npm install

frontend-build:
	cd frontend && npm run build

frontend-serve:
	python -m http.server 5500 --directory frontend

up: frontend-build
	python scripts/dev_up.py

down:
	python scripts/dev_down.py

run:
	uvicorn backend.app.main:app --reload

lint:
	python -m ruff check backend
	python -m black --check backend

format:
	python -m ruff check backend --fix
	python -m black backend

typecheck:
	python -m mypy
	cd frontend && npm run check

check: lint typecheck

test: test-backend test-frontend

test-backend:
	python -m pytest tests/backend

test-frontend:
	cd frontend && npm run test

precommit:
	python -m pre_commit run --all-files

clean:
	python -c "import shutil; shutil.rmtree('frontend/node_modules', ignore_errors=True)"
	python -c "import shutil; shutil.rmtree('frontend/dist', ignore_errors=True)"
	python -c "import shutil; shutil.rmtree('logs', ignore_errors=True)"
	python -c "import shutil; shutil.rmtree('.pytest_cache', ignore_errors=True)"
	python -c "import shutil; shutil.rmtree('.mypy_cache', ignore_errors=True)"
	python -c "import shutil; shutil.rmtree('.ruff_cache', ignore_errors=True)"
	python -c "import shutil; shutil.rmtree('frontend/.vitest', ignore_errors=True)"
	python -c "import shutil; shutil.rmtree('backend/app/__pycache__', ignore_errors=True)"
	python -c "import shutil; shutil.rmtree('.run', ignore_errors=True)"
