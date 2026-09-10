# Logos

Logos is a distraction-free publishing workspace for essays, stories, and ideas. It includes a rich text editor, drafts, publishing, image uploads,authentication, and optional real-time collaboration.

Built with [Nuxt](https://nuxt.com), [Nuxt UI](https://ui.nuxt.com), [TipTap](https://tiptap.dev), and the [NuxtHub](https://hub.nuxt.com).

## Features

- Rich text editing with headings, lists, quotes, code blocks, tables, links, highlights, and markdown serialization
- Draft and published post management
- Image uploads through NuxtHub Blob
- User accounts and workspace settings
- Public post pages with Open Graph images and sitemap support
- Optional real-time collaboration through PartyKit
- Graph view for exploring published content

## Requirements

- Node.js 22 or newer
- pnpm 11
- SQLite for local development, provided through NuxtHub

## Local setup

Install dependencies:

```bash
pnpm install
```

Copy the environment template and fill in the values you need:

```bash
cp .env.example .env
```

Start the development server at `http://localhost:3000`:

```bash
pnpm dev
```

Create an account at `/register`, then sign in at `/login`.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NUXT_SITE_URL` | Production | Canonical URL used by SEO and sitemap generation |
| `NUXT_SESSION_PASSWORD` | Yes | Session encryption password, at least 32 characters |
| `NUXT_OG_IMAGE_SECRET` | Production | Secret used by the Open Graph image endpoint |
| `NUXT_PUBLIC_PARTYKIT_HOST` | Optional | Enables real-time collaboration |
| `NUXT_HUB_CLOUDFLARE_DATABASE_ID` | Cloudflare only | D1 database ID read during the Worker build |
| `NUXT_HUB_CLOUDFLARE_R2_BUCKET_NAME` | Cloudflare only | R2 bucket name read during the Worker build |

Keep `.env` out of Git. Use Worker secrets or protected environment variables for production secrets.

## Database migrations

Keep the schema in `server/db/schema.ts` and generate one migration for each schema change:

```bash
pnpm exec nuxt db generate --name add_profile_field
pnpm db:migrate
```

Generated SQLite migrations belong in `server/db/migrations/sqlite/`. NuxtHub applies pending migrations automatically during development.

Do not place a consolidated SQL dump or another manually maintained SQL file in `server/db/migrations`. NuxtHub scans every `.sql` file in that directory as a migration, so duplicate schema files can produce errors such as `table users already exists`.

For custom SQL, generate an empty migration and edit the generated file:

```bash
pnpm exec nuxt db generate --custom --name backfill_profile_field
```

## Deploy to Cloudflare Workers

The recommended production setup uses Cloudflare Workers, D1, and R2. The Workers build must use the `cloudflare_module` preset. D1 migrations must run before the Worker deploys.

Set the build command to:

```bash
pnpm build
```

Set the deploy command to:

```bash
pnpm dlx wrangler --cwd .output/server d1 migrations apply DB --remote && pnpm dlx wrangler --cwd .output deploy --keep-vars
```

Use the full [Cloudflare Workers deployment guide](docs/deploy-cloudflare-workers.md) for Cloudflare resource setup, environment variables, local deploys, migration changes, and troubleshooting.

## Deploy with Docker

For a single VPS with persistent local SQLite storage, use the [Docker and VPS deployment guide](docs/deploy-docker-vps.md).

## Useful commands

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm preview      # Preview the production build
pnpm db:generate  # Generate a database migration
pnpm db:migrate   # Apply local database migrations
pnpm check        # Check formatting
pnpm lint         # Run Oxlint
pnpm typecheck    # Run Nuxt type checking
```

## Project structure

```text
app/       Nuxt pages, components, composables, and styles
server/    API routes, services, database schema, and migrations
public/    Static assets
scripts/   Build and deployment helpers
docs/      Deployment guides
```
