"""Postgres access — works against PGlite or any real Postgres.

Configured via DATABASE_URL / DB_MAX_CONNECTIONS (see settings.py and
.env.example).

- DB_MAX_CONNECTIONS = 1 (default): one shared connection behind a lock.
  Required for the PGlite sidecar, which accepts a single client.
- DB_MAX_CONNECTIONS > 1: a real psycopg connection pool for real Postgres.

All driver work runs in threads (sync psycopg) — async psycopg can't run on
Windows' default Proactor event loop.
"""

import asyncio
import threading
import time

import psycopg
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

import settings


class Database:
    def __init__(self):
        self._conn: psycopg.Connection | None = None
        self._pool: ConnectionPool | None = None
        self._lock = threading.Lock()
        self._pooled = settings.DB_MAX_CONNECTIONS > 1

    # ── lifecycle ────────────────────────────────────────────────

    def _connect_sync(self, retries: int = 30, delay: float = 1.0):
        last_err = None
        for _ in range(retries):
            try:
                if self._pooled:
                    self._pool = ConnectionPool(
                        settings.DATABASE_URL,
                        min_size=1,
                        max_size=settings.DB_MAX_CONNECTIONS,
                        kwargs={"autocommit": True, "row_factory": dict_row},
                    )
                    self._pool.wait(timeout=delay * 5)
                else:
                    self._conn = psycopg.connect(
                        settings.DATABASE_URL, autocommit=True, row_factory=dict_row
                    )
                return
            except Exception as e:  # db may still be booting
                last_err = e
                if self._pool:
                    self._pool.close()
                    self._pool = None
                time.sleep(delay)
        raise RuntimeError(
            f"Could not reach database at {settings.DATABASE_URL}: {last_err}"
        )

    async def connect(self):
        await asyncio.to_thread(self._connect_sync)

    async def close(self):
        if self._pool:
            await asyncio.to_thread(self._pool.close)
        if self._conn:
            await asyncio.to_thread(self._conn.close)

    # ── queries ──────────────────────────────────────────────────

    def _run_sync(self, sql: str, params, fetch: bool):
        if self._pooled:
            with self._pool.connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(sql, params)
                    return cur.fetchall() if fetch else None
        with self._lock:
            with self._conn.cursor() as cur:
                cur.execute(sql, params)
                return cur.fetchall() if fetch else None

    async def execute(self, sql: str, params=None):
        await asyncio.to_thread(self._run_sync, sql, params, False)

    async def fetch(self, sql: str, params=None) -> list[dict]:
        return await asyncio.to_thread(self._run_sync, sql, params, True)

    async def fetchone(self, sql: str, params=None) -> dict | None:
        rows = await self.fetch(sql, params)
        return rows[0] if rows else None


db = Database()
