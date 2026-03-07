# Future Feature Proposals for Co+promote

This document outlines potential features and enhancements that could be added to the Co+promote platform to further streamline promotion management, expand its capabilities, and increase overall user value.

## 1. Advanced Analytics & Reporting Dashboard
**Description:** Introduce a robust reporting module with customizable dashboards.
**Benefits:** 
- Visualize project progress, task completion rates, and event ROI.
- Track team productivity and resource allocation.
- Export reports to PDF/CSV for client or stakeholder presentations.

## 2. Automated Workflows & Triggers
**Description:** A rule-based automation engine (e.g., "If X happens, do Y").
**Benefits:**
- **Automated task assignments:** Automatically assign tasks based on project type.
- **Status updates:** Automatically move a project's status when all underlying tasks are completed.
- **Notifications:** Send email or Slack/Discord alerts when critical events approach or are modified.

## 3. Client & External Collaborator Portals
**Description:** Secure, restricted access views for people outside the core organization.
**Benefits:**
- Allow clients to view project milestones, approve media assets, or submit feedback directly.
- Allow vendors/contractors to view their assigned tasks and upload deliverables without seeing internal discussions or sensitive data.

## 4. Integrated Email & Communications (CRM Expansion)
**Description:** Connect to Google Workspace or Microsoft 365 APIs to sync emails and calendar events.
**Benefits:**
- Log email threads directly to Contact and Project records.
- Send promotional emails, newsletters, or event invitations directly from the platform.
- Centralize all communication history for a contact in one place.

## 5. Social Media Scheduling & Tracking
**Description:** Connect to social media APIs (X/Twitter, LinkedIn, Meta, etc.) directly.
**Benefits:**
- Plan out campaign posts on a unified calendar view.
- Schedule posts to go live automatically.
- Pull in basic engagement metrics (views, clicks, likes) to evaluate the success of a promotion.

## 6. Time Tracking & Invoicing
**Description:** Add timers to tasks and a billing module.
**Benefits:**
- Track billable hours spent on specific client promotions.
- Generate invoices automatically from logged time.
- Track project budgets vs. actuals to ensure profitability.

## 7. Document Templates & E-Signatures
**Description:** A module to handle contracts, proposals, and NDAs.
**Benefits:**
- Generate standard contracts pre-filled with Contact and Project data.
- Send documents out for legally binding e-signatures (integrating with DocuSign, HelloSign, etc.).
- Track document status (Sent, Viewed, Signed) alongside the project.

## 8. Mobile PWA (Progressive Web App) Enhancements
**Description:** Optimize the Next.js application for seamless offline or mobile-native usage.
**Benefits:**
- Crucial for on-site "Event Planning" and real-time task checking.
- Push notifications for immediate task or event alerts.
- On-the-go photo uploads directly to the Immich integration.

## 9. AI-Powered Asset Tagging & Content Generation
**Description:** A contextual AI assistant embedded directly within the project, task, and asset workflows to synthesize data, generate copy, and intelligently manage media.

### Architectural Perspective
- **Data Context Engine:** Instead of isolated prompts, the AI has read-access to the current Project's metadata (briefs, target audience, brand voice guidelines), Contacts involved, and Historical Events. This context is injected into every prompt (RAG - Retrieval Augmented Generation).
- **Immich Webhook Integration:** When Immich processes a new image, a webhook triggers a vision model (e.g., GPT-4o, Claude 3.5 Sonnet) to analyze the image *in the context of the Project*. It automatically suggests structured tags (e.g., "Campaign: Summer24", "AssetType: ProductShot").
- **Agentic Workflows:** The AI operates as a background worker. For instance, when a "Brainstorming" meeting event concludes, the AI automatically fetches the transcript, summarizes action items, and drafts Task cards in the Kanban board for user approval.

### Digital Marketer Perspective
- **On-Brand Copy Generation:** Marketers can generate variations of social media captions, email newsletters, and ad copy directly within a Campaign Project. Because the AI knows the project context, the initial drafts require significantly less editing.
- **Micro-Targeting Angles:** A marketer can ask the AI, "Take this asset and generate three different caption angles: one for Gen-Z on TikTok, one for B2B professionals on LinkedIn, and one for a general audience on Instagram."
- **Content Repurposing:** Feed a long-form blog post or event summary into the system and have it automatically slice the content into 5 tweets, 2 LinkedIn posts, and an email blast template.
- **A/B Testing Ideation:** The AI suggests A/B test variations for subject lines or call-to-actions based on historical engagement data (if integrated with the Analytics module).

## Data-Driven Feature Propositions
*These propositions are based on analysis of current database usage, which indicates strong adoption of Email Planning (17 items, 11 photos), Events (10 items), and User/Location management.*

### 10. Advanced Drag-and-Drop Email Campaign Builder
**Description:** Expand the heavily used `EmailPlan` and `EmailItem` models into a full-fledged visual email builder that leverages the existing Asset Editor as a component factory.
**Benefits:**
- Marketers can visually arrange `EmailItemPhoto` and `EmailItemProduct` content without writing code.
- Direct integration to sync the finalized HTML email directly to ESPs like Mailchimp, SendGrid, or Postmark.
- Include built-in spam scoring and rendering previews across different email clients.

#### Architectural Considerations
- **Component Factory Pipeline:** The existing canvas-based Asset Editor (capable of parsing `elements`, `canvasBg`, and `canvasSize` to Prisma) serves to generate isolated "Email Blocks" (e.g., Hero Image, Footer, Product Card).
- **Headless Server-Side Rendering:** Since HTML emails have strict, outdated constraints (like avoiding modern CSS Grid/Flexbox), the system needs a reliable exporter. A server-side service can ingest the `SavedAsset` JSON payload and systematically render the canvas shapes out as either optimized sliced images (guaranteeing exact visual fidelity across Outlook and Gmail) or a hybrid of basic `<table>` HTML and image tags.
- **Dynamic Variable Injection:** Assets can be constructed with database variables in mind. The builder must dynamically inject the `EventProduct` data (Price, UPC photo, Name) into placeholder text elements stored in the asset's JSON structure before the final render.
- **Relational Integrity:** Dragging and dropping blocks simply updates the `order` integer on `EmailItem` rows linked to the parent `EmailPlan`. This ensures the structure is perfectly preserved across browser sessions.

#### UI & UX Implementation
- **The Split View Layout:**
  - *Left Sidebar (Library):* A tabbed pane featuring pre-built `SavedAssets` blocks, recent `EmailItemPhoto` pulls from the Immich integration, and a searchable grid of `EventProducts`.
  - *Center Stage (The Stack):* A strict vertical drop-zone. No free-form positioning. Users drag blocks from the left and drop them between existing blocks. The UI snaps them into a fluid column mimicking mobile and desktop email flow.
  - *Right Sidebar (Inspector Context):* Contextually changes based on the block clicked. If a user clicks an image block, it presents a field for the hyper-important `alt` tag and a hyperlink `url`. If a text block is clicked, it offers basic rich-text controls.
- **Inline Editing Mode:** A double-click on an `EmailItem` block on the center stage temporarily "breaks out" the component back into the isolated Asset Editor modal. The user tweaks the design of that specific block, saves it, and the center stage seamlessly updates the stack.

### 11. Geo-Spatial Event Analytics & Attendance Tracking
**Description:** Enhance the `Event` and `Location` models (currently showing a healthy ratio of 10 events across 7 locations) with map-based visualizers.
**Benefits:**
- Visualize which geographic areas have the highest density/frequency of promotional events.
- Allow primary contacts or attendees to scan a QR code at the physical `Location` to automatically log attendance into the CRM.

### 12. Enhanced Task Dependencies & Sub-tasks
**Description:** Upgrade the Kanban-style task board since users are actively transitioning Tasks through `todo` and `in-progress` statuses.
**Benefits:**
- Add blockers/dependencies (Task B cannot start until Task A is `completed`).
- Introduce checklists within single task cards to track granular progress without cluttering the main project board.
