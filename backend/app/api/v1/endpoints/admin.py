import logging
import subprocess
import sys
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, HTTPException

from ....core.config import PROJECT_ROOT, get_settings
from ..schemas.admin import StopProjectResponse

router = APIRouter(tags=["admin"])
logger = logging.getLogger("backend.api.admin")


def _shutdown_script_path() -> Path:
    return PROJECT_ROOT / "scripts" / "dev_down.py"


def _request_project_shutdown() -> None:
    script_path = _shutdown_script_path()
    if not script_path.exists():
        logger.error("admin.stop_project.script_missing | script_path=%s", script_path)
        return

    creationflags = 0
    if sys.platform == "win32":
        creationflags = (
            subprocess.CREATE_NO_WINDOW
            | subprocess.CREATE_NEW_PROCESS_GROUP
            | getattr(subprocess, "DETACHED_PROCESS", 0)
        )

    subprocess.Popen(
        [sys.executable, str(script_path)],
        cwd=str(PROJECT_ROOT),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        creationflags=creationflags,
    )


@router.post("/admin/stop-project", response_model=StopProjectResponse)
async def stop_project(background_tasks: BackgroundTasks) -> StopProjectResponse:
    settings = get_settings()
    logger.debug(
        "admin.stop_project.request.received | environment=%s", settings.app_env
    )

    if settings.app_env.lower() != "development":
        logger.warning("admin.stop_project.blocked | environment=%s", settings.app_env)
        raise HTTPException(
            status_code=403, detail="Project shutdown is allowed only in development"
        )

    background_tasks.add_task(_request_project_shutdown)
    logger.warning("admin.stop_project.requested | environment=%s", settings.app_env)
    return StopProjectResponse(
        status="stopping",
        message="Stop command accepted. Backend and frontend shutdown requested.",
    )
