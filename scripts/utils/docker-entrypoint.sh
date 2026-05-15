#!/bin/sh
set -e

# Default UID/GID if not provided
USER_ID=${PUID:-1001}
GROUP_ID=${PGID:-1001}

echo "Starting with UID: $USER_ID, GID: $GROUP_ID"

# Adjust nextjs user and nodejs group to match PUID/PGID
if [ "$(id -u nextjs)" -ne "$USER_ID" ]; then
    usermod -o -u "$USER_ID" nextjs
fi
if [ "$(id -g nextjs)" -ne "$GROUP_ID" ]; then
    groupmod -o -g "$GROUP_ID" nodejs
fi

# Fix permissions for data directory (mounted volume might have wrong ownership)
# Only chown if necessary to speed up startup
if [ -d "/app/data" ]; then
    echo "Checking permissions for /app/data..."
    find /app/data ! -user nextjs -o ! -group nodejs -exec chown nextjs:nodejs {} +
fi

# Ensure /app is owned by nextjs (especially for .npm cache)
if [ "$(stat -c '%u:%g' /app)" != "$USER_ID:$GROUP_ID" ]; then
    chown nextjs:nodejs /app
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
        # Create seeded marker as nextjs user
        gosu nextjs touch /app/data/.seeded
    fi
fi

echo "Starting application..."
exec gosu nextjs "$@"
