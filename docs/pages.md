# Application Pages (Routing)

Promoty is built using the Next.js App Router. This document outlines the primary page structures found in the `app/` directory.

## Authentication
- **`/(auth)/login`**: User authentication entry point.
- **`/(auth)/change-password`**: Mandatory password change screen for new or expired accounts.
- **`/(auth)/verify-magic-link`**: Handles magic link token validation.

## Dashboard & Core Workflows
- **`/` (Dashboard)**: The main landing page offering a high-level overview of tasks, upcoming events, and system activity.
- **`/projects`**: List of all projects.
  - **`/projects/[id]`**: Detail view of a project, including associated tasks and assets.
  - **`/projects/new`**: Create a new project.
- **`/tasks`**: Kanban board interface for managing global tasks.
- **`/calendar`**: Unified calendar view displaying Events and Promotion Periods.

## Events & Promotions
- **`/events`**: List view of scheduled events.
  - **`/events/[id]`**: Event details, including linked products, contacts, and organizations.
  - **`/events/new`**: Event creation wizard.
- **`/promotions`**: List of Promotion Periods.
  - **`/promotions/[id]` / `/promotions/new`**: Details and creation for campaigns.

## CRM
- **`/organizations`**: List of external brands and companies.
  - **`/organizations/[id]`**: Organization details and related contacts.
- **`/contacts`**: Global contact directory.
  - **`/contacts/[id]`**: Specific contact information and interaction history.

## Media & Publishing
- **`/gallery`**: Cloud photo management interface (powered by Immich API).
- **`/asset-editor`**: Internal canvas-based image editor for creating social media graphics from templates.
- **`/social`**: Social media post management and scheduling (integrates with Postiz).
  - **`/social/new`**: Social post composer.
- **`/email-planner`**: Newsletter campaign planning interface.
  - **`/email-planner/[id]`**: Detailed view for structuring email block items.

## External Products
- **`/products`**: Catalog view of products pulled from the external MSSQL database.
- **`/product/[upc]`**: Dynamic route displaying details for a specific external product.

## System Administration
- **`/admin`**: Admin dashboard.
  - **`/admin/settings`**: System configurations (`.env` variables status for DB, APIs, AI).
  - **`/admin/users`**: User account management and role assignment.
  - **`/admin/activity` / `/admin/logs`**: Audit trails and security logs.
  - **`/admin/data`**: Administrative data hub for backups and bulk operations.
  - **`/admin/locations`**: Management of physical/virtual locations for events.
  - **`/admin/hyperlinks`**: Management of global quick links.

## Assistance
- **`/chat`**: Built-in AI assistant interface to query workspace data.
