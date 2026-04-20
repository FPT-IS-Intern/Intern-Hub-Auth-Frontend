#!/bin/sh
set -e

export NODE_ENV="${NODE_ENV:-production}"

if [ -f /usr/share/nginx/html/env.js.template ]; then
  envsubst < /usr/share/nginx/html/env.js.template > /usr/share/nginx/html/env.js
  echo "✅ Generated env.js"
else
  echo "⚠️  env.js.template not found, skipping"
fi

exec nginx -g 'daemon off;'
