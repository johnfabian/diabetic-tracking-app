"""Test fixtures: a throwaway PGlite instance + FastAPI TestClient.

Spawns `node db/server.mjs` on its own port with a temp data dir, points
DATABASE_URL at it *before* importing the app, then runs the app's real
lifespan (connect + schema init + recipe seeding) via TestClient.
"""

import os
import shutil
import socket
import subprocess
import sys
import tempfile
import time
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
BACKEND = ROOT / "backend"
TEST_PORT = 55432


def _wait_for_port(port: int, timeout: float = 30.0):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        try:
            with socket.create_connection(("127.0.0.1", port), timeout=0.5):
                return True
        except OSError:
            time.sleep(0.3)
    return False


@pytest.fixture(scope="session")
def pglite():
    # a stale server here means tests would silently run against old data
    try:
        with socket.create_connection(("127.0.0.1", TEST_PORT), timeout=0.5):
            raise RuntimeError(
                f"Port {TEST_PORT} is already in use — kill the stale PGlite "
                "test server (node db/server.mjs) and re-run."
            )
    except OSError:
        pass  # free, as expected

    data_dir = tempfile.mkdtemp(prefix="glucolog-test-db-")
    env = {**os.environ, "PGLITE_PORT": str(TEST_PORT), "PGLITE_DATA_DIR": data_dir}
    node = shutil.which("node") or "node"  # full path: no shell wrapper, so
    proc = subprocess.Popen(              # terminate() reaches node itself
        [node, str(ROOT / "db" / "server.mjs")],
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        cwd=ROOT,
    )
    if not _wait_for_port(TEST_PORT):
        proc.kill()
        out = proc.stdout.read().decode(errors="replace") if proc.stdout else ""
        raise RuntimeError(f"PGlite test server failed to start:\n{out}")
    yield
    proc.terminate()
    try:
        proc.wait(timeout=10)
    except subprocess.TimeoutExpired:
        proc.kill()


@pytest.fixture(scope="session")
def client(pglite):
    os.environ["DATABASE_URL"] = (
        f"postgresql://postgres:postgres@127.0.0.1:{TEST_PORT}/postgres?sslmode=disable"
    )
    os.environ["DB_MAX_CONNECTIONS"] = "1"
    sys.path.insert(0, str(BACKEND))

    import settings
    settings.DATABASE_URL = os.environ["DATABASE_URL"]
    settings.DB_MAX_CONNECTIONS = 1
    settings.ANTHROPIC_API_KEY = ""  # vision must read as unconfigured in tests
    settings.VISION_PROVIDER = "anthropic"

    from fastapi.testclient import TestClient
    from main import app

    with TestClient(app) as c:
        yield c
