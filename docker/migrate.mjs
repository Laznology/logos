import { readdir, readFile } from "node:fs/promises";

import { createClient } from "@libsql/client";

const migrationsDir = "/app/.output/server/db/migrations/sqlite";
const client = createClient({ url: "file:/app/.data/db/sqlite.db" });

await client.execute(`
  CREATE TABLE IF NOT EXISTS _hub_migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  );
`);

const applied = await client.execute(
  "SELECT name FROM _hub_migrations ORDER BY id"
);
const appliedNames = new Set(applied.rows.map((row) => row.name ?? row[0]));
const entries = await readdir(migrationsDir, { withFileTypes: true });
const migrations = entries
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .toSorted();

for (const name of migrations) {
  if (appliedNames.has(name)) {
    continue;
  }

  // eslint-disable-next-line no-await-in-loop
  const sql = await readFile(`${migrationsDir}/${name}/migration.sql`, "utf-8");
  for (const statement of sql
    .split(/-->\s*statement-breakpoint/g)
    .map((query) => query.trim())
    .filter(Boolean)) {
    // eslint-disable-next-line no-await-in-loop
    await client.execute(statement);
  }
  // eslint-disable-next-line no-await-in-loop
  await client.execute({
    sql: "INSERT INTO _hub_migrations (name) VALUES (?)",
    args: [name],
  });
}
