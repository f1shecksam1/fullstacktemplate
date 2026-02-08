# Fullstack Template (HTML + CSS + TypeScript + Python)

A simple fullstack template.

- Frontend: HTML + CSS + TypeScript
- Backend: FastAPI (Python)
- Logging: stdlib logging + daily rotating `.log`
- Code quality: Ruff + Black + MyPy + pre-commit
- Config: `.env`, `pyproject.toml`, `ruff.toml`, `tsconfig.json`

## Backend technologies and libraries

- Runtime: Python 3.12 (`requires-python` in `pyproject.toml`)
- API framework: FastAPI
- ASGI server: Uvicorn (`uvicorn[standard]`)
- Data validation and schemas: Pydantic models
- Environment/config loading: `python-dotenv` + typed dataclass settings
- Logging: Python stdlib `logging` with `contextvars`-based request ID enrichment
- Backend testing: `pytest` + FastAPI `TestClient` (HTTPX transport)
- Backend quality tools: Ruff, Black, MyPy, pre-commit hooks

## Frontend technologies and libraries

- UI architecture: multi-page static HTML (`index.html` + `pages/*.html`)
- Styling: plain CSS (`frontend/styles.css`)
- Client language/runtime: TypeScript compiled to ES2020 modules (`frontend/tsconfig.json`)
- Browser APIs used in source: Fetch API, DOM APIs, `FormData`, `URLSearchParams`
- Build/type-check tooling: TypeScript compiler (`tsc`)
- Frontend testing: Vitest + JSDOM (`frontend/vitest.config.ts`)
- Package/dependency management: npm (`frontend/package.json`, `frontend/package-lock.json`)
- Frontend app style: framework-free (no React/Vue/Angular dependency in frontend package manifest)

## Folder structure

```
.
├─ backend/
│  └─ app/
│     ├─ main.py
│     ├─ core/
│     │  ├─ config.py
│     │  └─ logging.py
│     └─ api/
│        ├─ router.py
│        └─ v1/
│           ├─ router.py
│           ├─ endpoints/
│           │  ├─ admin.py
│           │  ├─ health.py
│           │  ├─ echo.py
│           │  ├─ time.py
│           │  ├─ math.py
│           │  └─ logs.py
│           └─ schemas/
│              ├─ admin.py
│              ├─ health.py
│              ├─ echo.py
│              ├─ time.py
│              ├─ math.py
│              └─ logs.py
├─ frontend/
│  ├─ index.html
│  ├─ pages/
│  │  ├─ health.html
│  │  ├─ echo.html
│  │  ├─ time.html
│  │  └─ math.html
│  ├─ styles.css
│  ├─ src/
│  │  ├─ logger.ts
│  │  └─ pages/
│  │     ├─ shared.ts
│  │     ├─ home-page.ts
│  │     ├─ health-page.ts
│  │     ├─ echo-page.ts
│  │     ├─ time-page.ts
│  │     ├─ math-page.ts
│  │     ├─ home.ts
│  │     ├─ health.ts
│  │     ├─ echo.ts
│  │     ├─ time.ts
│  │     └─ math.ts
│  │  ├─ services/
│  │  │  ├─ api-client.ts
│  │  │  └─ operation-summary.ts
│  │  └─ ui/
│  │     └─ result-panel.ts
│  ├─ tests/
│  │  ├─ logger.test.ts
│  │  └─ pages.integration.test.ts
│  ├─ dist/                   # output of npm run build
│  ├─ package.json
│  ├─ tsconfig.json
│  └─ vitest.config.ts
├─ tests/backend/
│  ├─ conftest.py
│  ├─ test_health.py
│  ├─ test_echo.py
│  ├─ test_time.py
│  ├─ test_math.py
│  ├─ test_admin.py
│  └─ test_logs.py
├─ .pre-commit-config.yaml
├─ scripts/
│  ├─ dev_up.py
│  └─ dev_down.py
├─ .vscode/settings.json
├─ logs/
├─ .env
├─ .env.example
├─ pyproject.toml
└─ ruff.toml
```

## Setup

Python setup:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -e .[dev]
pre-commit install
```

TypeScript build:

```bash
cd frontend
npm install
npm run build
```

## Run

Backend API:

```bash
make run
```

Frontend (separate static server):

```bash
make frontend-build
make frontend-serve
```

Start the full project with one command (backend + frontend):

```bash
make up
```

Stop the full project with one command:

```bash
make down
```

`make down` also terminates remaining processes listening on ports 5500 and 8000, beyond PID-file based shutdown.

- Backend API: `http://127.0.0.1:8000`
- Frontend UI: `http://127.0.0.1:5500`

The API Base URL field in the frontend is prefilled with the backend address (`http://127.0.0.1:8000`).

## Quality checks

```bash
python -m ruff check backend
python -m black --check backend
python -m mypy
```

TypeScript type-check:

```bash
cd frontend
npm run check
```

Backend tests:

```bash
python -m pytest tests/backend
```

Frontend test:

```bash
cd frontend
npm run test
```

## Frontend serving model

- Frontend and backend are fully separated.
- Frontend source files and build outputs live only under `frontend/`.
- Backend serves API endpoints only (`/api/v1/*`).
- CORS is enabled for `http://127.0.0.1:5500` and `http://localhost:5500`.
- Frontend provides multi-page navigation (`index.html`, `pages/health.html`, `pages/echo.html`, `pages/time.html`, `pages/math.html`).
- Each endpoint page shows request payload sent to the endpoint and payload returned from the endpoint.
- Each endpoint page shows an explanatory operation summary text.
- The home page includes an "Exit Project" button; it triggers the full-service shutdown flow via `POST /api/v1/admin/stop-project`.

## API v1 endpoints

- `GET /api/v1/health`
- `POST /api/v1/echo`
- `GET /api/v1/time`
- `GET /api/v1/math/add?a=3&b=4`
- `POST /api/v1/logs/frontend`
- `POST /api/v1/admin/stop-project`

Request/response schemas for each endpoint are kept in separate files under `backend/app/api/v1/schemas/`.

## Logging architecture

- Backend logging uses stdlib `logging`.
- A `contextvars`-based `request_id` is automatically added to all records.
- `service`, `version`, and `environment` fields are automatically included in every log line.
- Log format: `timestamp | level | logger | request_id | message`.
- Daily file naming is used: `backend-YYYY-MM-DD.log`.
- Old log cleanup runs automatically using retention days (`LOG_RETENTION_DAYS`).
- The default log level is `DEBUG`.
- Frontend browser events are sent to the backend via `POST /api/v1/logs/frontend` and written to the same daily file.
- In VS Code settings, the `logs/` directory is visible while cache directories remain hidden.

Example log line:

```text
2026-02-07 11:58:02 | INFO | backend.http | 8f03c88e74dd4a54b59588e9b5f9a4ea | service=fullstack-template-backend | version=0.1.0 | environment=development | http.request.completed | method=POST | path=/api/v1/logs/frontend | status_code=200
```

## Test strategy

- Backend tests are split into endpoint-based modular files.
- `tests/backend/conftest.py` contains shared fixtures and the mocking layer.
- Frontend unit tests verify logger behavior.
- Frontend integration tests validate API request flows for each endpoint page at DOM level.

## Pre-commit

- `.pre-commit-config.yaml` defines backend and frontend quality gates.
- Hooks: Ruff, Black, MyPy, Pytest, frontend type-check, and frontend tests.
- Initial setup: `pre-commit install`

## Notes

- This template intentionally does not include a database, ORM, migrations, or auth.
- Basic environment settings are loaded via `.env`.

## Makefile commands

```bash
make install-dev
make frontend-install
make frontend-build
make frontend-serve
make up
make down
make run
make test
```

All checks:

```bash
make check
```
