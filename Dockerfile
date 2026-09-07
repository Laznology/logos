# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS build

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV NITRO_PRESET=node-server

RUN corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
ARG NUXT_SITE_URL
ENV NUXT_SITE_URL=$NUXT_SITE_URL
RUN pnpm build

FROM node:22-bookworm-slim AS runtime

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

WORKDIR /app
COPY --from=build --chown=node:node /app/.output ./.output
COPY --from=build --chown=node:node /app/docker/entrypoint.sh ./docker/entrypoint.sh
COPY --from=build --chown=node:node /app/docker/migrate.mjs ./.output/server/migrate.mjs
RUN chmod 755 ./docker/entrypoint.sh && mkdir -p /app/.data/db /app/.data/blob && chown -R node:node /app/.data

USER node
VOLUME ["/app/.data"]
EXPOSE 3000

ENTRYPOINT ["/app/docker/entrypoint.sh"]
CMD ["node", ".output/server/index.mjs"]
