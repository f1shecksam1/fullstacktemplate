from __future__ import annotations

import os
from pathlib import Path
import subprocess
import sys
from typing import Final

PROJECT_ROOT: Final[Path] = Path(__file__).resolve().parents[1]
RUN_DIR: Final[Path] = PROJECT_ROOT / ".run"
LOG_DIR: Final[Path] = PROJECT_ROOT / "logs"


def _is_running(pid: int) -> bool:
    try:
        os.kill(pid, 0)
    except Exception:
        return False
    return True


def _read_pid_file(path: Path) -> int | None:
    if not path.exists():
        return None

    try:
        return int(path.read_text(encoding="utf-8").strip())
    except ValueError:
        return None


def _service_pid_file(service_name: str) -> Path:
    return RUN_DIR / f"{service_name}.pid"


def _start_service(service_name: str, command: list[str], log_file: Path) -> int:
    creationflags = 0
    popen_kwargs: dict[str, object] = {}
    if sys.platform == "win32":
        creationflags = subprocess.CREATE_NEW_PROCESS_GROUP
    else:
        popen_kwargs["start_new_session"] = True

    with log_file.open("a", encoding="utf-8") as log_handle:
        process = subprocess.Popen(
            command,
            cwd=str(PROJECT_ROOT),
            stdout=log_handle,
            stderr=subprocess.STDOUT,
            creationflags=creationflags,
            **popen_kwargs,
        )

    pid = process.pid
    _service_pid_file(service_name).write_text(str(pid), encoding="utf-8")
    return pid


def _listening_pids(port: int) -> set[int]:
    result = subprocess.run(
        ["netstat", "-ano"],
        check=False,
        capture_output=True,
        text=True,
    )
    pids: set[int] = set()
    target = f":{port}"

    for raw_line in result.stdout.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        upper_line = line.upper()
        if "LISTENING" not in upper_line:
            continue
        if target not in line:
            continue

        parts = line.split()
        if not parts:
            continue
        maybe_pid = parts[-1]
        if maybe_pid.isdigit():
            pids.add(int(maybe_pid))

    return pids


def _ensure_clean_state() -> None:
    RUN_DIR.mkdir(parents=True, exist_ok=True)
    LOG_DIR.mkdir(parents=True, exist_ok=True)

    for service_name in ("backend", "frontend"):
        pid_file = _service_pid_file(service_name)
        pid = _read_pid_file(pid_file)
        if pid is None:
            continue
        if _is_running(pid):
            raise SystemExit(
                f"{service_name} already running (pid={pid}). Run `make down` before `make up`."
            )
        pid_file.unlink(missing_ok=True)

    busy_frontend = _listening_pids(5500)
    busy_backend = _listening_pids(8000)
    if busy_frontend or busy_backend:
        raise SystemExit(
            "Ports are busy. Run `make down` first. "
            f"5500 pids={sorted(busy_frontend)} 8000 pids={sorted(busy_backend)}"
        )


def main() -> None:
    _ensure_clean_state()

    backend_pid = _start_service(
        service_name="backend",
        command=[
            sys.executable,
            "-m",
            "uvicorn",
            "backend.app.main:app",
            "--reload",
            "--host",
            "127.0.0.1",
            "--port",
            "8000",
        ],
        log_file=LOG_DIR / "dev-backend.out.log",
    )

    frontend_pid = _start_service(
        service_name="frontend",
        command=[
            sys.executable,
            "-m",
            "http.server",
            "5500",
            "--directory",
            "frontend",
        ],
        log_file=LOG_DIR / "dev-frontend.out.log",
    )

    print(f"Started backend (pid={backend_pid}) and frontend (pid={frontend_pid}).")
    print("Backend:  http://127.0.0.1:8000")
    print("Frontend: http://127.0.0.1:5500")
    print("Stop all: make down")


if __name__ == "__main__":
    main()
