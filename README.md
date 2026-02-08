# Fullstack Template (HTML + CSS + TypeScript + Python)

Basit bir fullstack template.

- Frontend: HTML + CSS + TypeScript
- Backend: FastAPI (Python)
- Logging: stdlib logging + gunluk rotating `.log`
- Code quality: Ruff + Black + MyPy + pre-commit
- Config: `.env`, `pyproject.toml`, `ruff.toml`, `tsconfig.json`

## Klasor yapisi

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
│  ├─ dist/                   # npm run build ciktisi
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

## Kurulum

Python tarafi:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -e .[dev]
pre-commit install
```

TypeScript derleme:

```bash
cd frontend
npm install
npm run build
```

## Calistirma

Backend API:

```bash
make run
```

Frontend (ayri static server):

```bash
make frontend-build
make frontend-serve
```

Tum projeyi tek komutla ayaga kaldirma (backend + frontend):

```bash
make up
```

Tum projeyi tek komutla kapatma:

```bash
make down
```

`make down`, PID dosyalari disinda 5500 ve 8000 portlarinda dinleyen kalmis surecleri de sonlandirir.

- Backend API: `http://127.0.0.1:8000`
- Frontend UI: `http://127.0.0.1:5500`

Frontend ekraninda API Base URL alanina backend adresi girili gelir (`http://127.0.0.1:8000`).

## Kalite kontrolleri

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

Backend test:

```bash
python -m pytest tests/backend
```

Frontend test:

```bash
cd frontend
npm run test
```

## Frontend serving modeli

- Frontend ve backend tamamen ayridir.
- Frontend kaynaklari ve build ciktilari sadece `frontend/` altindadir.
- Backend sadece API endpointleri sunar (`/api/v1/*`).
- CORS, `http://127.0.0.1:5500` ve `http://localhost:5500` icin aciktir.
- Frontend coklu sayfa yonlendirme ornegi sunar (`index.html`, `pages/health.html`, `pages/echo.html`, `pages/time.html`, `pages/math.html`).
- Her endpoint sayfasinda endpoint'e gonderilen payload ve endpointten donen payload gosterilir.
- Her endpoint sayfasinda isleme dair aciklayici ozet metni gosterilir.
- Ana sayfada "Projeden Cik" butonu vardir; `POST /api/v1/admin/stop-project` ile tum servisleri kapatma akisini tetikler.

## API v1 endpointleri

- `GET /api/v1/health`
- `POST /api/v1/echo`
- `GET /api/v1/time`
- `GET /api/v1/math/add?a=3&b=4`
- `POST /api/v1/logs/frontend`
- `POST /api/v1/admin/stop-project`

Her endpoint icin request/response semalari `backend/app/api/v1/schemas/` altinda ayri dosyalarda tutulur.

## Loglama mimarisi

- Backend loglamasi stdlib `logging` ile yapilir.
- `contextvars` tabanli `request_id` butun kayitlara otomatik eklenir.
- `service`, `version`, `environment` alanlari tum log satirlarina otomatik eklenir.
- Log formati: `timestamp | level | logger | request_id | message`.
- Gunluk dosya acma modeli kullanilir: `backend-YYYY-MM-DD.log`.
- Eski log temizligi retention gunu ile otomatik yapilir (`LOG_RETENTION_DAYS`).
- Varsayilan log seviyesi `DEBUG` olarak ayarlidir.
- Frontend browser eventleri backend'e `POST /api/v1/logs/frontend` ile gonderilir ve ayni gunluk dosyaya yazilir.
- VS Code ayarlarinda `logs/` klasoru gorunur, cache klasorleri gizli kalir.

Ornek log satiri:

```text
2026-02-07 11:58:02 | INFO | backend.http | 8f03c88e74dd4a54b59588e9b5f9a4ea | service=fullstack-template-backend | version=0.1.0 | environment=development | http.request.completed | method=POST | path=/api/v1/logs/frontend | status_code=200
```

## Test stratejisi

- Backend testleri endpoint bazli moduler dosyalara ayrildi.
- `tests/backend/conftest.py` icinde fixture ve mocking katmani bulunur.
- Frontend unit testleri logger davranisini test eder.
- Frontend integration testleri DOM seviyesinde her endpoint sayfasindan API request akisini test eder.

## Pre-commit

- `.pre-commit-config.yaml` icinde backend ve frontend quality gate'leri tanimlidir.
- Hooklar: Ruff, Black, MyPy, Pytest, frontend typecheck ve frontend test.
- Ilk kurulum: `pre-commit install`

## Notlar

- Bu template bilerek database, ORM, migration veya auth yapisi icermez.
- `.env` ile basit environment ayarlari yuklenir.

## Makefile komutlari

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

Tum kontroller:

```bash
make check
```
