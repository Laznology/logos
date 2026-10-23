#!/bin/sh
set -eu

remote_image="${GHCR_IMAGE:-ghcr.io/laznology/logos}"
tag="${GHCR_TAG:-pisahin}"
local_image="${LOCAL_IMAGE:-logos:$tag}"

if [ "${GHCR_SKIP_LOGIN:-0}" != "1" ]; then
  if [ -z "${GHCR_TOKEN:-}" ]; then
    echo "Set GHCR_TOKEN or GHCR_SKIP_LOGIN=1." >&2
    exit 1
  fi
  printf '%s' "$GHCR_TOKEN" |
    docker login ghcr.io --username "${GHCR_USER:-laznology}" --password-stdin
fi

docker build --tag "$local_image" --tag "$remote_image:$tag" "$@" .
docker push "$remote_image:$tag"
