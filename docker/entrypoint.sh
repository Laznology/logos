#!/bin/sh
set -eu

node /app/.output/server/migrate.mjs
exec node /app/.output/server/index.mjs
