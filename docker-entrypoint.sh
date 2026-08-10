#!/bin/sh
set -e

mkdir -p /data
node node_modules/prisma/build/index.js migrate deploy

exec "$@"
