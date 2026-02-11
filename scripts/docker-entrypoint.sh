#!/bin/sh
set -e

# Run migrations
echo "Running Prisma migrations..."
npx prisma migrate deploy

# Seed if needed (optional, typically controlled by an env var)
if [ "$SEED_DB" = "true" ]; then
  echo "Seeding database..."
  npx prisma db seed
fi

# Execute the main container command
echo "Starting application..."
exec "$@"
