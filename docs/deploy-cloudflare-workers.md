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
   pnpm dlx wrangler --cwd .output/server d1 migrations apply DB --remote && pnpm dlx wrangler --cwd .output deploy --keep-vars
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
pnpm dlx wrangler --cwd .output/server d1 migrations list DB --remote
pnpm dlx wrangler --cwd .output/server d1 migrations apply DB --remote
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
```

Generated migrations belong in `server/db/migrations/sqlite/`. Keep one schema change per generated migration. For a migration that needs hand-written SQL, generate an empty custom migration and edit that file:

```bash
pnpm exec nuxt db generate --custom --name backfill_profile_field
```

Do not put a consolidated SQL dump or a manually maintained `init-d1.sql` in `server/db/migrations`. NuxtHub scans every SQL file in that directory and may run the same schema twice.

## Existing D1 databases

If the D1 database was migrated with an older NuxtHub release, inspect the migration table before the first Wrangler deploy:

```bash
pnpm dlx wrangler --cwd .output/server d1 execute DB --remote --command "SELECT id, name FROM _hub_migrations ORDER BY id"
```

NuxtHub documents a one-time `.sql` suffix update for migration rows created before v0.10. Apply that update only after confirming the rows belong to the old NuxtHub migration format and after taking a database backup.

## Troubleshooting

### `table users already exists`

A duplicate SQL file is being scanned as a migration. Keep migrations under `server/db/migrations/sqlite/` and remove consolidated SQL files from `server/db/migrations`.

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
