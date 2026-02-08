import logging
from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import AbstractAsyncContextManager, asynccontextmanager
from time import perf_counter
from uuid import uuid4

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from .api.router import api_router
from .core.config import get_settings
from .core.logging import reset_request_id, set_request_id, setup_logging


def _build_lifespan(
    logger: logging.Logger,
) -> Callable[[FastAPI], AbstractAsyncContextManager[None]]:
    @asynccontextmanager
    async def lifespan(_: FastAPI) -> AsyncIterator[None]:
        logger.info("app.startup")
        yield
        logger.info("app.shutdown")

    return lifespan


def create_app() -> FastAPI:
    settings = get_settings()
    setup_logging(settings)

    logger = logging.getLogger("backend.app")
    request_logger = logging.getLogger("backend.http")

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        lifespan=_build_lifespan(logger),
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.cors_origins),
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def request_logging_middleware(
        request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        request_id = request.headers.get("X-Request-Id", uuid4().hex)
        token = set_request_id(request_id)
        start_time = perf_counter()

        client_host = request.client.host if request.client is not None else None
        request_logger.debug(
            "http.request.started | method=%s | path=%s | client_ip=%s",
            request.method,
            request.url.path,
            client_host,
        )

        try:
            response = await call_next(request)
            elapsed_ms = round((perf_counter() - start_time) * 1000, 2)
            response.headers["X-Request-Id"] = request_id
            request_logger.info(
                "http.request.completed | method=%s | path=%s | "
                "status_code=%s | duration_ms=%.2f | client_ip=%s",
                request.method,
                request.url.path,
                response.status_code,
                elapsed_ms,
                client_host,
            )
            return response
        except Exception:
            elapsed_ms = round((perf_counter() - start_time) * 1000, 2)
            request_logger.exception(
                "http.request.failed | method=%s | path=%s | "
                "duration_ms=%.2f | client_ip=%s",
                request.method,
                request.url.path,
                elapsed_ms,
                client_host,
            )
            raise
        finally:
            reset_request_id(token)

    app.include_router(api_router)
    logger.info(
        "app.initialized | api_prefix=%s | api_v1_prefix=%s | "
        "log_level=%s | log_file_path=%s",
        settings.api_prefix,
        settings.api_v1_prefix,
        settings.log_level,
        settings.log_file_path,
    )

    return app


app = create_app()
