import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, "data");

const PORT = Number(process.env.PGLITE_PORT ?? 5332);
const HOST = process.env.PGLITE_HOST ?? "127.0.0.1";

const db = await PGlite.create(dataDir);
const server = new PGLiteSocketServer({ db, port: PORT, host: HOST });

await server.start();
console.log(`[pglite] postgres wire protocol listening on ${HOST}:${PORT}`);
console.log(`[pglite] data persisted to ${dataDir}`);

// A client dropping mid-connection (e.g. the backend restarting) raises
// ECONNRESET on the raw socket; without this guard it kills the whole server.
process.on("uncaughtException", (err) => {
  if (err?.code === "ECONNRESET" || err?.code === "EPIPE") {
    console.warn(`[pglite] client disconnected abruptly (${err.code}) — still serving`);
    return;
  }
  console.error(err);
  process.exit(1);
});

// PGlite accepts a single client at a time — the FastAPI backend holds one
// connection guarded by a lock, so this is fine for a personal app.
for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, async () => {
    await server.stop();
    await db.close();
    process.exit(0);
  });
}
