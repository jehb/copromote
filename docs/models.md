# Database Models

This document outlines the core data structures used in Promoty, defined via Prisma ORM (`prisma/schema.prisma`).

## Core Entities
- **Project**: The top-level container for organizing work, assets, and tasks.
- **Task**: Kanban-style action items assigned to users, optionally linked to Projects.
- **Event**: Detailed calendar events featuring locations, times, and relationships to associated products, organizations, and contacts.
- **EventSeries**: A logical grouping for related or recurring events.
- **Location**: Physical or virtual spaces where Events occur.

## CRM & Contacts
- **Organization**: External brands, companies, or partners managed within Promoty.
- **Contact**: Individual people linked to Organizations or managed independently.

## Media & Social
- **Asset**: Media files (images, videos, etc.) uploaded to the system, linked to Projects or Social Posts. Managed via Immich integration.
- **AssetTemplate**: JSON-based canvas templates used in the internal Asset Editor.
- **SocialPost**: Drafted or scheduled social media posts. Integrates with Postiz for publishing.
- **PromotionPeriod**: Time-bound organizational periods tying together Assets and Social Posts for campaigns.

## Email Marketing
- **EmailPlan**: A scheduled newsletter or email campaign.
- **EmailItem**: Specific content blocks within an Email Plan, which can be linked to Events and Products.
- **EmailItemProduct**: A bridge table linking specific UPCs (products) to an Email Item.

## External Data
- **EventProduct**: A bridge linking external catalog products (via UPC) to Promoty Events.

## System & Auth
- **User**: System accounts with role-based access control (Admin, User).
- **ActivityLog**: Detailed audit trail tracking user actions across entities.
- **SecurityLog**: Audit trail for authentication and security-related events.
- **Config**: Key-value configurations (Legacy: being migrated to environment variables).
- **Hyperlink**: Global quick links for users.
- **MagicLink**: Tokens used for passwordless login or account verification.
