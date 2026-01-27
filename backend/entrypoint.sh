#!/bin/bash

set -e

if [ "$DB" = "postgres" ]; then
    until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER"
    do
        sleep 1
    done
fi

mkdir -p /app/static /app/media
chown -R django-user:django-user /app/static /app/media

exec gosu django-user "$@"