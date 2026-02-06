# Authentication Guide

Promoty uses a secure session-based authentication system.

## Features
- **Stateless Sessions**: JWT-based sessions stored in HTTP-only cookies
- **Password Hashing**: Strong bcrypt hashing for stored passwords
- **Default Security**: Users created via seed/migration have a default password (`admin` -> `admin`) but are forced to change it on first login.
- **Route Protection**: Middleware ensures only authenticated users can access the app.

## Accounts
- **Default Admin**:
  - Username: `admin`
  - Password: `admin` (You will be prompted to change this immediately)

## Adding Users
To add new users, you currently need to use the database seed script or database UI tools, as there is no public registration page.

```bash
# Run seed script to reset admin user
npx tsx scripts/seed-auth.ts
```

## Security Implementation
- **Middleware** (`middleware.ts`): Intercepts requests.
- **Lib** (`lib/auth.ts`): Handles encryption/decryption (JOSE).
- **Actions** (`app/actions/auth.ts`): Logical flow for Login/Change Password.
