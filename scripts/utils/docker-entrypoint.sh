#!/bin/sh
set -e

# Fix permissions for data directory (mounted volume might have wrong ownership)
if [ -d "/app/data" ]; then
    chown -R nextjs:nodejs /app/data
fi

# Run migrations if DATABASE_URL is set
if [ -n "$DATABASE_URL" ]; then
    echo "Running Prisma migrations..."
    # Use explicit version matching package.json to avoid fetching latest
    # Run as nextjs user
    gosu nextjs npx prisma@5.22.0 migrate deploy
    
    # Run seed only if not already seeded
    if [ ! -f "/app/data/.seeded" ]; then
        echo "Seeding database..."
        gosu nextjs npx prisma@5.22.0 db seed
        touch /app/data/.seeded
    fi
fi

echo "Starting application..."
exec gosu nextjs "$@"
