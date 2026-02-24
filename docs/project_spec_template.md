
# Project Specification: [App Name]

This document serves as a blueprint for building **[App Name]**, a self-management application based on the architecture of Co+promote. Use this template to define the scope, features, and data model of your new project.

## 1. Project Overview
**[App Name]** is a [Brief Description of App Type, e.g., Personal CRM, Habit Tracker, Learning Management System] designed to [Core Value Proposition]. It unifies [Key Feature 1], [Key Feature 2], and [Key Feature 3] into a single platform.

## 2. Technology Stack

### Core Frameworks
- **Frontend/Backend:** [Next.js 15 (App Router)](https://nextjs.org/) for server-side rendering and API routes.
- **Language:** TypeScript for type safety across the entire stack.
- **Database ORM:** [Prisma](https://www.prisma.io/) for type-safe database access.
- **Database:** MariaDB/MySQL.
- **Authentication:** Custom implementation using `jose` (JWT) and `bcryptjs` (or NextAuth.js).

### UI & Styling
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) for utility-first styling.
- **Components:** [Radix UI](https://www.radix-ui.com/) primitives.
- **Icons:** [Lucide React](https://lucide.dev/).
- **Animations:** `framer-motion`.

### Integrations
- **AI Integration:** Google Generative AI / OpenAI for [AI Use Case, e.g., content generation, data analysis].
- **Data Imports:** `xlsx` for Excel/CSV data.

## 3. Core Modules & Architecture

Define the key functional areas of your application.

### A. [Core Module 1, e.g., Project Management]
- **Entities:** `[Entity Name]`, `[Entity Name]`.
- **Functionality:** [Description of what this module does].
- **Workflow:** [Step 1] -> [Step 2] -> [Step 3].

### B. [Core Module 2, e.g., Contact Management]
- **Entities:** `[Entity Name]`.
- **Functionality:** [Description of relationships and data managed here].

### C. [Core Module 3, e.g., Analytics/Dashboard]
- **Entities:** N/A (Aggregates data).
- **Functionality:** Visual overview of [Metrics to track].

## 4. Data Model Relationships

Map out how your entities interact.
- **[Entity A]** relates to **[Entity B]** via [Relationship Type, e.g., One-to-Many].
- **[Entity C]** acts as a central hub for [Related Entities].

## 5. Key Workflows

Describe the primary user journeys.
1.  **[Workflow Name]:** [Step-by-step description].
2.  **[Workflow Name]:** [Step-by-step description].

## 6. Directory Structure (Standard)
```
/app
  /(auth)       # Login/Register routes
  /actions      # Server Actions (Business Logic)
  /admin        # Settings & User Management
  /api          # API Routes
  /[module-1]   # Routes for Module 1
  /[module-2]   # Routes for Module 2
  /components   # Reusable UI Components
  /lib          # Utilities
  /prisma       # Database Schema
```
