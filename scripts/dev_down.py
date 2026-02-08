from __future__ import annotations

import os
import signal
import subprocess
import sys
import time
from pathlib import Path
from typing import Final

PROJECT_ROOT: Final[Path] = Path(__file__).resolve().parents[1]
RUN_DIR: Final[Path] = PROJECT_ROOT / ".run"


def _service_pid_file(service_name: str) -> Path:
    return RUN_DIR / f"{service_name}.pid"


def _read_pid(path: Path) -> int | None:
    if not path.exists():
        return None
    try:
        return int(path.read_text(encoding="utf-8").strip())
    except ValueError:
        return None


def _is_running(pid: int) -> bool:
    if pid <= 0:
        return False

    if sys.platform == "win32":
        result = subprocess.run(
            ["tasklist", "/FI", f"PID eq {pid}"],
            check=False,
            capture_output=True,
            text=True,
        )
        output = (result.stdout or "").upper()
        return str(pid) in output and "NO TASKS ARE RUNNING" not in output

    try:
        os.kill(pid, 0)
    except Exception:
        return False
    return True


def _terminate_process(pid: int) -> None:
    if sys.platform == "win32":
        commands = (
            ["taskkill", "/PID", str(pid), "/F"],
            ["taskkill", "/PID", str(pid), "/T", "/F"],
            [
                "powershell",
                "-NoProfile",
                "-Command",
                f"Stop-Process -Id {pid} -Force -ErrorAction SilentlyContinue",
            ],
        )

        for command in commands:
            try:
                completed = subprocess.run(
                    command,
                    check=False,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    timeout=2,
                )
            except subprocess.TimeoutExpired:
                continue

            if completed.returncode == 0 and not _is_running(pid):
                return

        # Best-effort fallback for cases where command return codes are unreliable.
        deadline = time.time() + 2
        while time.time() < deadline:
            if not _is_running(pid):
                return
            time.sleep(0.1)

        return

    os.kill(pid, signal.SIGTERM)
    deadline = time.time() + 5
    while time.time() < deadline:
        if not _is_running(pid):
            return
        time.sleep(0.1)

    if _is_running(pid):
        os.kill(pid, signal.SIGKILL)


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
            pid = int(maybe_pid)
            if _is_running(pid):
                pids.add(pid)

    return pids


def _stop_service_by_port(service_name: str, port: int) -> None:
    pids = _listening_pids(port)
    if not pids:
        return

    for pid in sorted(pids):
        _terminate_process(pid)
        if not _is_running(pid):
            print(f"Stopped {service_name} by port {port} (pid={pid}).")


def _stop_service(service_name: str) -> None:
    pid_file = _service_pid_file(service_name)
    pid = _read_pid(pid_file)
    if pid is None:
        return

    if not _is_running(pid):
        print(
            f"{service_name} pid file existed but process was not running (pid={pid})."
        )
    else:
        _terminate_process(pid)
        if not _is_running(pid):
            print(f"Stopped {service_name} (pid={pid}).")
        else:
            print(f"Could not stop {service_name} cleanly (pid={pid}).")

    pid_file.unlink(missing_ok=True)


def main() -> None:
    _stop_service("frontend")
    _stop_service_by_port("frontend", 5500)
    _stop_service("backend")
    _stop_service_by_port("backend", 8000)


if __name__ == "__main__":
    main()
