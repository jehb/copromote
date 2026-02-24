
# Co+promote

Co+promote is a comprehensive promotion management system designed to streamline the organization of projects, tasks, contacts, and events.

## Features

- **Project Management**: Track projects, assets, and timelines.
- **Task Management**: Kanban-style task board with efficient task creation and assignment.
- **Contact Management**: CRM-like features to manage professional contacts and organizations.
- **Event Planning**: Schedule and manage events with integrated calendar views.
- **Media Assets**: Native Immich integration for cloud-based photo organization and tagging.
- **Activity Logging**: Comprehensive audit trail for all system actions.
- **User Management**: Dynamic custom roles with granular permission control and secure authentication.

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/yourusername/copromote.git
    cd copromote
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Set up the database:
    ```bash
    npx prisma generate
    npx prisma migrate dev
    ```

4.  Run the development server:
    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Docker Support

To run the application using Docker (simulation of production environment):

1.  Configure your `.env` file with `DISABLE_SECURE_COOKIES=true` if running locally over HTTP.
2.  Set `NEXTAUTH_URL` to your local hostname (e.g., `http://localhost:3000` or `http://pluto`).
3.  Run:
    ```bash
    docker compose up -d --build
    ```

## Testing

Co+promote maintains high test coverage using Jest and React Testing Library.

To run the test suite:

```bash
# Run all tests
npm run test

# Run specific test file
npm run test -- dashboard
```

## Documentation

Refer to the included `docs/` folder for comprehensive structural documentation:
- [Application Pages](docs/pages.md): Documentation on routing and interfaces.
- [Database Models](docs/models.md): Documentation on Prisma models and schema relationships.

## Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Database**: MariaDB/MySQL (via Prisma ORM)
- **UI Components**: Shadcn UI (Radix Primitives + Tailwind CSS)
- **State Management**: React Query
- **Testing**: Jest, React Testing Library
