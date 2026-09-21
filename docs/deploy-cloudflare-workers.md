# Deploy Logos to Cloudflare Workers

This repository uses NuxtHub for D1, R2, and database migrations. The Worker build uses Nitro's `cloudflare_module` preset. NuxtHub writes the generated Wrangler configuration to `.output/server/wrangler.json`.

## Requirements

Create these resources in the same Cloudflare account:

- A Cloudflare Workers project
- A D1 database
- An R2 bucket for uploaded images and avatars
- A Workers Builds connection to this repository, or a local Wrangler login

Install dependencies before a local deploy:

```bash
pnpm install
```

The commands below use `pnpm dlx wrangler`, so Wrangler does not need to be added to `package.json`.

## Configure the build

Set these variables in the Cloudflare Workers build environment:

```dotenv
NITRO_PRESET=cloudflare_module
NUXT_HUB_CLOUDFLARE_DATABASE_ID=<d1-database-id>
NUXT_HUB_CLOUDFLARE_R2_BUCKET_NAME=<r2-bucket-name>
NUXT_SITE_URL=https://example.com
```

Set these values as Worker secrets or protected environment variables:

```dotenv
NUXT_SESSION_PASSWORD=<random-string-at-least-32-characters>
NUXT_OG_IMAGE_SECRET=<random-secret>
```

`NUXT_HUB_CLOUDFLARE_DATABASE_ID` and `NUXT_HUB_CLOUDFLARE_R2_BUCKET_NAME` are read while Nuxt builds. Changing either value requires a new build.

The generated bindings use these names:

- D1: `DB`
- R2: `BLOB`
- Static assets: `ASSETS`

Do not add a manual `wrangler.jsonc` for this setup. NuxtHub generates the Worker configuration and points D1 at the SQLite migrations bundled in `.output/server/db/migrations/sqlite/`.

Migrations are applied through `wrangler.migrations.jsonc`, which points at `server/db/migrations/sqlite/` in the repository, so no build is required to apply them. The generated Worker config cannot be used for this: Wrangler 4.130+ requires an explicit `migrations_pattern` for Drizzle-style `<timestamp>_<name>/migration.sql` folders and NuxtHub 0.10.x does not generate it, so `wrangler d1 migrations apply --cwd .output/server` silently finds no migrations.

## Deploy with Workers Builds

This is the shortest repeatable setup:

1. Create a Workers project in Cloudflare and connect the repository.
2. Set the build variables and secrets above.
3. Set the build command to:

   ```text
   pnpm build
   ```

4. Set the deploy command to:

   ```bash
   pnpm dlx wrangler d1 migrations apply DB --remote -c wrangler.migrations.jsonc && pnpm dlx wrangler --cwd .output deploy --keep-vars
   ```

5. Set the project root to `.`.

The migration command must run before `wrangler deploy`. Cloudflare does not apply D1 migrations automatically during a Worker deploy.

## Deploy locally

Authenticate Wrangler once:

```bash
pnpm dlx wrangler login
```

Build with the same preset and resource IDs used by Workers Builds:

```bash
NITRO_PRESET=cloudflare_module \
NUXT_HUB_CLOUDFLARE_DATABASE_ID=<d1-database-id> \
NUXT_HUB_CLOUDFLARE_R2_BUCKET_NAME=<r2-bucket-name> \
pnpm build
```

Check and apply pending D1 migrations, then deploy the Worker:

```bash
pnpm dlx wrangler d1 migrations list DB --remote -c wrangler.migrations.jsonc
pnpm dlx wrangler d1 migrations apply DB --remote -c wrangler.migrations.jsonc
pnpm dlx wrangler --cwd .output deploy --keep-vars
```

Set Worker secrets from the Cloudflare dashboard or with `wrangler secret put`. Keep secret values out of Git.

## Change the database schema

Use this order for every schema change:

1. Update `server/db/schema.ts`.
2. Generate a named migration.
3. Review the generated SQL.
4. Apply it locally.
5. Commit the migration with the schema change.
6. Build the Cloudflare Worker.
7. Apply the pending D1 migrations.
8. Deploy the Worker.

```bash
pnpm exec nuxt db generate --name add_profile_field
pnpm db:migrate
pnpm dlx wrangler d1 migrations apply DB --remote -c wrangler.migrations.jsonc
```

Generated migrations belong in `server/db/migrations/sqlite/`. Keep one schema change per generated migration. For a migration that needs hand-written SQL, generate an empty custom migration and edit that file:

```bash
pnpm exec nuxt db generate --custom --name backfill_profile_field
```

Do not put a consolidated SQL dump or a manually maintained `init-d1.sql` in `server/db/migrations`. NuxtHub scans every SQL file in that directory and may run the same schema twice.

## Existing D1 databases

If the D1 database was migrated with an older NuxtHub release, inspect the migration table before the first Wrangler deploy:

```bash
pnpm dlx wrangler d1 execute DB --remote --command "SELECT id, name FROM _hub_migrations ORDER BY id"
```

Older rows use bare folder names (e.g. `20260810082129_nosy_venus`). Wrangler only recognizes rows in its own format — `<folder>/migration.sql` — and otherwise re-applies every migration. Rename the old rows once, after confirming they correspond to existing migration folders:

```bash
pnpm dlx wrangler d1 execute DB --remote --command "UPDATE _hub_migrations SET name = name || '/migration.sql' WHERE name NOT LIKE '%/migration.sql'"
```

Take a backup first. This database contains FTS5 virtual tables, so `wrangler d1 export` fails with `cannot export databases with Virtual Tables (fts5)`; use Time Travel instead:

```bash
pnpm dlx wrangler d1 time-travel info DB
# restore if needed:
pnpm dlx wrangler d1 time-travel restore DB --bookmark=<bookmark>
```

Once renamed, keep using Wrangler for remote migrations. Do not switch this database to `nuxt db migrate` with D1 HTTP credentials: that path expects the bare folder names and would try to re-apply every migration.

## Troubleshooting

### `table users already exists`

A duplicate SQL file is being scanned as a migration. Keep migrations under `server/db/migrations/sqlite/` and remove consolidated SQL files from `server/db/migrations`.

### `No migrations to apply` but migrations are pending

The generated `.output/server/wrangler.json` has no `migrations_pattern`, so Wrangler cannot see Drizzle-style `<timestamp>_<name>/migration.sql` folders. Always apply migrations with `-c wrangler.migrations.jsonc`, which sets the pattern.

### `BLOB binding not found`

Check `NUXT_HUB_CLOUDFLARE_R2_BUCKET_NAME`, rebuild with `NITRO_PRESET=cloudflare_module`, and confirm that the generated `.output/server/wrangler.json` contains an R2 binding named `BLOB`.

### No `.output/server/wrangler.json`

The build did not use a Cloudflare preset. Set `NITRO_PRESET=cloudflare_module` and build again.

## References

- [NuxtHub Cloudflare deployment](https://hub.nuxt.com/docs/getting-started/deploy#cloudflare)
- [NuxtHub database migrations](https://hub.nuxt.com/docs/database/migrations)
- [NuxtHub database CLI](https://hub.nuxt.com/docs/database/cli)
- [NuxtHub CI/CD and D1 migrations](https://hub.nuxt.com/docs/guides/ci-cd#d1-migrations-in-cicd)
- [Cloudflare Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/)
