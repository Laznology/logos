# Deploy Logos on a VPS with Docker

This is the boring path: one Node image, one Compose service, one persistent volume.

## What persists

- SQLite database: `logos-data:/app/.data`
- Uploaded files: same volume, under `.data/blob`
- Migrations run automatically when the container starts.

Do not run `docker compose down -v` unless you intentionally want to delete the database and uploads.

## Requirements

- VPS with Docker Engine and the Compose plugin
- At least 1 GB RAM during the first image build
- A domain is optional; the app is available on port `3000` by default

## 1. Prepare the server

```bash
git clone <your-repository-url> logos
cd logos
```

Create `.env` next to `docker-compose.yml`:

```dotenv
APP_PORT=3000
NUXT_SITE_URL=https://example.com
NUXT_SESSION_PASSWORD=replace-with-a-random-string-at-least-32-characters
NUXT_OG_IMAGE_SECRET=replace-with-another-random-secret
AI_GATEWAY_API_KEY=
```

Generate secrets instead of inventing them:

```bash
openssl rand -base64 48
```

`.env` is ignored by Git. Never commit it.

## 2. Build and start

```bash
docker compose up -d --build
```

Check the service:

```bash
docker compose ps
docker compose logs -f logos
```

Open `http://<VPS-IP>:3000`.

The container starts as the unprivileged `node` user. The first start creates the SQLite schema in the named volume.

## 3. Create the first admin

1. Keep registration enabled.
2. Open `/register` and create the first account.
3. Promote that account to admin from the running container:

```bash
docker compose exec logos node --input-type=module -e '
import { createClient } from "./.output/server/node_modules/@libsql/client/lib-esm/node.js";
const db = createClient({ url: "file:/app/.data/db/sqlite.db" });
await db.execute({
  sql: "UPDATE users SET role = ?, updated_at = unixepoch() WHERE email = ?",
  args: ["admin", "admin@example.com"]
});
console.log((await db.execute({
  sql: "SELECT email, role FROM users WHERE email = ?",
  args: ["admin@example.com"]
})).rows);
'
```

Replace `admin@example.com` in both places with the registered email. Log out and log in again so the new role is loaded.

After logging in, open **Account Settings → Preferences → Workspace settings** and disable **Allow public registration**.

## 4. Put it behind a domain

The app listens on `0.0.0.0:3000`. Use an existing reverse proxy (Caddy, Nginx Proxy Manager, Traefik, or Cloudflare Tunnel) and forward the domain to:

```text
http://127.0.0.1:3000
```

Set `NUXT_SITE_URL` to the final HTTPS URL and redeploy:

```bash
docker compose up -d --build
```

## Updates

```bash
git pull
docker compose up -d --build
docker image prune -f
```

The named volume is reused, so the database and uploads survive image replacement. The entrypoint applies any new SQLite migrations before starting Nuxt.

## Backup and restore

Create a compressed backup of the persistent volume:

```bash
docker run --rm \
  -v logos_logos-data:/data:ro \
  -v "$PWD":/backup \
  alpine tar czf /backup/logos-data-$(date +%F).tar.gz -C /data .
```

The volume name is normally `logos_logos-data`. Confirm it with:

```bash
docker volume ls | grep logos
```

Restore into a stopped stack only:

```bash
docker compose down

docker run --rm \
  -v logos_logos-data:/data \
  -v "$PWD":/backup \
  alpine sh -c 'rm -rf /data/* && tar xzf /backup/logos-data-YYYY-MM-DD.tar.gz -C /data'

docker compose up -d
```

## Portainer Stack

1. Portainer → **Stacks** → **Add stack**.
2. Choose **Git repository**.
3. Set the repository URL and compose path to `docker-compose.yml`.
4. Add these stack environment variables in Portainer:
   - `APP_PORT`
   - `NUXT_SITE_URL`
   - `NUXT_SESSION_PASSWORD`
   - `NUXT_OG_IMAGE_SECRET`
5. Deploy the stack.

Portainer builds the image from the repository and starts the same Compose service. For updates, use **Pull and redeploy**.

Do not use `docker compose down -v` for updates; it removes the persistent data volume.

## Design choices

- `node:22-bookworm-slim`: safer for native Node packages than Alpine, without shipping a full Debian image.
- Multi-stage build: the final image contains `.output` and the tiny migration runner, not the source tree or development dependencies.
- `.dockerignore`: keeps Git history, tests, local databases, and dependencies out of the build context.
- Named volume: the only stateful part of the deployment.
