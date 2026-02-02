#!/bin/bash

set -e

mkdir -p /app/static /app/media
chown -R django-user:django-user /app/static /app/media

exec gosu django-user "$@"