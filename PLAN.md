# Future Feature Proposals for Co+promote

This document outlines potential features and enhancements that could be added to the Co+promote platform to further streamline promotion management, expand its capabilities, and increase overall user value.

## A. Core Co-op & Member Engagement
*(Features focused on the cooperative model, member events, and governance)*

### 1. Owner/Member Engagement & Event Tiers
**Description:** Differentiate `Event` attendance and promotional offerings between standard shoppers and Co-op Owners.
**Benefits:**
- **Exclusive Tiers:** Allow marketers to check a box for "Owner Exclusive" or "Owner Early Access."
- **Co-op Ad Funds Tracker:** Track cooperative advertising funds (MDF) to ensure marketing budget utilization.
**Deep Dive integration & Architecture:**
- **Auth Layer:** Integrate with the POS/Membership database (via an API or nightly CSV dump) to sync "Owner Status" to the `User` or `Contact` model in Prisma.
- **Event Gating Module:** In the frontend (`components/events/event-form.tsx`), add a role-based access control (RBAC) toggle. If an event is "Owner Exclusive," the public page will require a validated member login to RSVP or purchase tickets.
**UI/UX & User Flow:**
- **Marketer Flow:** When creating an Event, a specialized "Audience" toggle switch appears. Selecting "Owners Only" dynamically renders a sub-menu to define exactly what happens if a non-owner tries to click the link (e.g., redirect to the "Become an Owner" page or show a customized "Access Denied" modal).
- **Shopper Flow:** An Owner clicks the RSVP link in their email. NextAuth silently verifies their session cookie against the `MembershipStatus` flag in Prisma. The page renders instantly with a personalized "Welcome back, [Name]! Claim your owner ticket below." message.
**Database Schema & API:**
- **Schema Additions:** Add `isOwner: Boolean @default(false)` and `ownerId: String? @unique` to the `Contact` model. Add `visibilityTier: EventTier @default(PUBLIC)` enum (`PUBLIC`, `OWNERS_ONLY`, `BOARD_ONLY`) to the `Event` model.
- **API Endpoints:** `GET /api/events/:id` checks the `visibilityTier` against the `req.user.isOwner` token before returning ticket checkout data.

### 2. Digital "Round Up" Tracking for Community Non-Profits
**Description:** A dashboard and reporting module to track real-time "Round Up" donation metrics tied to specific `PromotionPeriods`.
**Benefits:**
- **Community Impact Visualization:** Pull metric data from the Point of Sale and visualize it next to current marketing campaigns allowing instant "We hit our goal!" social posts.
- **Non-Profit CRM Integration:** Link these donation drives directly to the local non-profit's `Organization`.
**Deep Dive integration & Architecture:**
- **Widget Creation:** Build a new Next.js server component (`<RoundUpWidget />`) that fetches aggregated POS API data mapped to the current `PromotionPeriod` date range.
- **Automated Milestone Alerts:** Use Inngest/Trigger.dev (from Feature #38) to dispatch a Slack notification to the marketing team the moment a donation goal (e.g., $10,000) is reached, prompting an immediate social media celebration post.
**UI/UX & User Flow:**
- **Dashboard Widget:** A prominent, animated progress bar (using `framer-motion`) sits on the main `/dashboard`. It visually fills up as the POS registers donations throughout the day. Hovering over the bar reveals a tooltip predicting the exact date the goal will be reached based on the current 7-day velocity.
- **One-Click Share:** Next to the progress bar is a "Share to Social" button. Clicking this instantly generates an asset (via Image/Remotion) featuring the current progress percentage and drafts a post in the Social Scheduling module (Feature #22).
**Database Schema & API:**
- **Schema Additions:** Create a `RoundUpCampaign` model linked to an `Organization` with fields `goalAmount: Float`, `currentAmount: Float`, `startDate: DateTime`, `endDate: DateTime`.
- **API Endpoints:** `POST /api/webhooks/pos/round-up` receives JSON `{ campaignId, amountAdded }` and atomically increments the `currentAmount` using Prisma's `update({ data: { currentAmount: { increment: amountAdded } } })`.

### 3. "Working Member" Shift Scheduling & Marketing Rewards
**Description:** A sub-module of the `Task` and `Contact` system designed specifically for Cooperative Working Members (owners who volunteer for a discount).
**Benefits:**
- **Shift Board:** Marketers can post specific `Tasks` that Working Members can claim.
- **Automated Point Tracking:** Automatically log hours to the CRM `Contact` profile, exportable to POS for discounts.
**Deep Dive integration & Architecture:**
- **Kanban Extension:** Modify `components/tasks/task-board.tsx` to include a boolean flag `isVolunteerShift`.
- **Claim System:** Create a new self-service portal route (`/volunteer`) where authenticated owners can browse and "claim" these specific tasks. Upon completion, a webhook fires to the POS system to credit the owner's account with the corresponding discount percentage for the coming month.
**UI/UX & User Flow:**
- **Volunteer Portal:** A minimalist, mobile-first list view showing available shifts (e.g., "Assemble 500 Promo Bags" or "Guide Farm Tour"). Each card displays the required hours and the corresponding POS discount reward.
- **Check-in/Check-out:** When a member arrives, they tap a "Start Shift" button on their phone. A geolocation check confirms they are at the Weaver Street store. When finished, they tap "End Shift," which triggers a confetti animation and logs the hours directly to their Owner profile.
**Database Schema & API:**
- **Schema Additions:** Expand `Task` with `isVolunteerShift: Boolean`, `rewardValue: Float`, and `volunteerContactId: String?`. Create `ShiftLog` model: `contactId`, `startTime`, `endTime`, `verifiedBy`.
- **API Endpoints:** `POST /api/volunteer/shifts/claim` assigns the current session user to the `Task`. `POST /api/volunteer/shifts/checkout` validates location and creates the `ShiftLog`.

### 4. Board of Directors Analytics Portal
**Description:** A simplified dashboard view specific to board members.
**Benefits:** Focuses on high-level member growth, equity, and community impact metrics rather than operational daily marketing stats.
**Deep Dive integration & Architecture:**
- **Role-Based Routing:** Create a new layout group (`app/(board)/layout.tsx`) protected by a specific `RolePermission` tied to the Board.
- **KPI Aggregation:** This dashboard uses the Graphic Walker PureRenderer (#37) to distinctly visualize macro-trends: Year-over-Year member equity growth, Game Changer sales percentages, and total community donations, stripping away the granular task/event data used by staff.
**UI/UX & User Flow:**
- **Macro View Layout:** Unlike the dense, operational marketing dashboard, this view uses large, spacious typographic KPI cards. The color palette adopts a more subdued, executive "dark mode" feel.
- **Report Generation:** A prominent "Export PDF Packet" button compiles the current quarter's macro charts into a highly formatted, printable document specifically designed for standardized monthly board meetings.
**Database Schema & API:**
- **Schema Additions:** Add a `BOARD_MEMBER` role to the existing enum used in the `User` model. Create a `MacroMetricSnapshot` model that runs monthly to lock in historical KPI data for year-over-year querying without heavy on-the-fly math.
- **API Endpoints:** `GET /api/board/kpis/yoy-equity` returns an aggregated cached JSON payload specifically pruned of PII or daily operational noise.

### 5. Membership Renewal Automation
**Description:** Workflows to automatically email and text members when their co-op share or annual fee needs renewal.
**Benefits:** Frees up customer service time and ensures steady equity inflow.
**Deep Dive integration & Architecture:**
- **Cron Jobs:** Set up an Inngest cron job running daily at 9:00 AM that queries the database for `Contacts` whose `membershipExpiryDate` is exactly 30, 7, and 1 day out.
- **Dynamic Messaging:** Trigger a corresponding Next.js API route that utilizes an `EmailPlan` template, injecting the user's specific renewal link and sending it via the configured ESP (e.g., SendGrid).
**UI/UX & User Flow:**
- **Marketer Configuration:** Within the Workflow Editor (Feature #38), marketers can view the multi-stage "Renewal Nurture Campaign" visually. They can click on the "Day 30" email node to instantly edit the copy directly within the visual canvas.
- **Member Checkout:** The dynamic link in the email routes the member to a highly-optimized, one-page server-side rendered checkout portal. Since the UUID is in the link, their fields (Name, Owner Number) are pre-filled, requiring only a Stripe Apple Pay/Credit Card confirmation to complete the renewal in under 10 seconds.
**Database Schema & API:**
- **Schema Additions:** Add `membershipExpiryDate: DateTime?` and `renewalStatus: Enum(ACTIVE, GRACE_PERIOD, LAPSED)` to the `Contact` model.
- **API Endpoints:** A secure Stripe webhook receiver `POST /api/webhooks/stripe/renewal` that listens for `checkout.session.completed`, instantly advancing the `membershipExpiryDate` by exactly 1 year and firing a welcome-back email.

### 6. Co-op Member Suggestion Portal
**Description:** A portal where members can suggest and upvote new local products to carry.
**Benefits:** Direct democratic input into the merchandising strategy, highly specific to cooperative values.
**Deep Dive integration & Architecture:**
- **Community Voting Engine:** Use a headless CMS approach or a dedicated Prisma model `ProductSuggestion` linked to the submitting `User`.
- **Merchandising Dashboard Integration:** The buying team views a sorted list of suggestions by "Demand Score" (upvotes). When a suggested product is officially stocked, the system automatically emails all members who upvoted it: "Thanks to you, it's here!"
**UI/UX & User Flow:**
- **Member Submission Flow:** The user lands on `/suggest`. A clean, large input box asks "What local product are we missing?". As they type, fuzzy search (via Fuse.js) checks against existing suggestions to prevent duplicates. If none exist, they provide a link and a short pitch.
- **Buyer Dashboard View:** Merchandisers see a Kanban board of suggestions. The "Under Review" column features cards displaying the product image, the number of member upvotes (highlighted in prominent green text), and a quick-action "Request Sample" button.
**Database Schema & API:**
- **Schema Additions:** Create `ProductSuggestion` (`title`, `description`, `externalLink`, `status`) and `SuggestionVote` (`suggestionId`, `contactId`) to ensure 1 vote per member.
- **API Endpoints:** `POST /api/suggestions/:id/vote` creates a `SuggestionVote` record. `GET /api/suggestions/trending` returns suggestions sorted by `votes._count` descending.

### 7. Community Partner Event Portal
**Description:** A public-facing form for non-profits to submit requests to host events or tabling sessions at the co-op.
**Benefits:** Integrates directly into the Co+promote Event pipeline pending marketer approval.
**Deep Dive integration & Architecture:**
- **External Form Generation:** Create a dynamic Next.js API route that serves an embedded iframe `<iframe>` or a standalone React component meant to be hosted on Weaver Street's main WordPress site.
- **Draft Pipeline:** Submissions populate the Co+promote database as an `Event` with the status `PENDING_PARTNER`. The pipeline utilizes React Flow (#38) to visually route approvals through the Store Manager before notifying the Marketing Editor.
**UI/UX & User Flow:**
- **External User Flow:** The non-profit visits `weaverstreetmarket.coop/host-an-event`. They fill out a multi-step React Hook Form (using Zod validation) detailing their mission, requested dates, and required table space.
- **Internal Approval Flow:** The Community Manager logs into Co+promote. The 'Pending Partner Events' widget shows the request. Clicking it opens a split view: the left side shows the partner's answers, the right side shows the Co-op's internal calendar to quickly check for date collisions before hitting 'Approve'.
**Database Schema & API:**
- **Schema Additions:** Expand `Event` with `partnerOrganizationId: String?`, `isRequested: Boolean @default(false)`, and `requestedDates: Json?`.
- **API Endpoints:** `POST /api/public/events/request` (no auth required, but rate-limited) generates the draft `Event`. `PUT /api/events/:id/approve` flips `isRequested` to false and transitions `EventStatus` to `DRAFT`.

### 8. Co-op Patronage Dividend Estimator
**Description:** Help owners estimate their yearly dividend based on their purchase tracking.
**Benefits:** Gamifies the co-op experience, encouraging members to shift more of their grocery budget to Weaver Street Market.
**Deep Dive integration & Architecture:**
- **Data Synchronization:** Requires a secure, read-only sync from the POS system's transaction ledger down to the individual `Contact` UUID.
- **Client-Side Calculation Widget:** A React component on the user dashboard that takes the Year-to-Date spend and multiplies it by the Board's projected dividend percentage, rendering a visually encouraging "Your estimated return: $45.12" graphic.
**UI/UX & User Flow:**
- **Owner Dashboard Interactive Element:** A stylized 'piggy bank' or 'growing plant' SVG animation responds to the user sliding a "Monthly Spend Goal" range slider. As they slide the bar up, the estimated yearly dividend dynamically updates in real-time.
- **Gamified Nudges:** If the user is $50 away from the next "tier" of dividend return, a small banner appears: "Spend just $50 more this month to break $100 in estimated dividends!"
**Database Schema & API:**
- **Schema Additions:** Create `DividendConfig` (singleton table) holding `currentFiscalYear`, `estimatedReturnRate%`. Expand `Contact` with `ytdSpend: Float`.
- **API Endpoints:** `GET /api/pos/sync-spend` (Internal Cron) iterates POS CSV dumps to upsert `ytdSpend` for all contacts. `GET /api/me/dividend-estimate` returns the math directly to the client.

### 9. Co-op Membership Agreement E-Signing
**Description:** Fully digitize the process of becoming an owner.
**Benefits:** Reduces paper waste and instantly creates a `Contact` profile in Co+promote.
**Deep Dive integration & Architecture:**
- **DocuSign/PandaDoc Integration:** Trigger an API call to generate a binding PDF agreement populated with the user's web-form data.
- **Webhook Fulfillment:** Listen for the `envelope_signed` webhook from the e-signature provider. Once received, automatically update the Prisma `Contact` record `isOwner` boolean to `true` and trigger the "Welcome to the Co-op" email sequence.
**UI/UX & User Flow:**
- **Seamless Modal Experience:** Rather than bouncing the user to a third-party DocuSign tab, utilize the DocuSign Embedded Signing API to render the signature pad directly within a Co+promote modal over the checkout screen.
- **Success State:** Upon drawing their signature and clicking "Agree," the modal closes, triggering a full-screen, branded CSS confetti overlay and a "Welcome to the Ownership Family" message.
**Database Schema & API:**
- **Schema Additions:** Add `signatureEnvelopeId: String?` and `signatureStatus: Enum(PENDING, SIGNED, DECLINED)` to the `Contact` or `Organization` model.
- **API Endpoints:** `POST /api/contracts/generate-membership` hits PandaDoc with the user ID, returning an embed URL. `POST /api/webhooks/pandadoc` catches the completed event and updates Prisma.

### 10. Digital Co-op Ownership Card
**Description:** A mobile wallet integration (Apple Wallet/Google Pay) for scanning at the register.
**Benefits:** Modernizes the checkout process and removes the need for physical plastic cards.
**Deep Dive integration & Architecture:**
- **Pass Generation API:** Utilize a library like `passkit-generator` on the Next.js Node.js server to dynamically generate a `.pkpass` file containing the user's specific Owner ID barcode and the current "Game Changer" promotional artwork.
- **Dynamic Updates:** Push notifications can be sent directly to the Wallet pass when the member's annual equity payment is due, changing the pass color to red until resolved.
**UI/UX & User Flow:**
- **One-Tap Addition:** In the "Welcome" email or on the user's dashboard, prominently display standard "Add to Apple Wallet" and "Save to Google Pay" badge buttons.
- **Scanning Context:** At the POS register, the user double-clicks their physical phone button to bring up Apple Wallet. The pass displays a high-contrast QR code or barcode (depending on Weaver Street's POS scanner hardware) for instantaneous scanning.
**Database Schema & API:**
- **Schema Additions:** Expand `Contact` with `appleWalletPassId: String?` and `googlePayPassId: String?`. Add `walletPassLastUpdated: DateTime?`.
- **API Endpoints:** `GET /api/wallet/apple/:contactId/pass.pkpass` strictly generates the binary blob payload utilizing the Contact's UUID and dynamic data. Apple APNs certs will be required as Env Vars.

## B. Merchandising & Local Sourcing
*(Features focused on products, vendors, and supply chain marketing)*

### 11. The "Game Changer" Vendor Pipeline & DEI Dashboard
**Description:** A CRM pipeline specifically for scouting and onboarding products from BIPOC-owned, women-owned, and cooperatively governed businesses.
**Benefits:**
- **Goal Tracking:** Visually tracks the percentage of total merchandising budget allocated to these vendors.
- **Asset Badging:** Automatically overlay the "Game Changer" logo onto `EventProduct` images.
**Deep Dive integration & Architecture:**
- **Pipeline UI:** Implement a Kanban board specifically for the `Organization` model using `@xyflow/react`. Stages include: "Identified", "Sample Requested", "Compliance Review", "First Order Placed".
- **Dynamic Image Processing:** When an `EventProduct` linked to a "Game Changer" organization is pulled into the Asset Editor, use the Canvas API to automatically composite a small vector SVG badge in the top-right corner of the product shot before exporting.
**UI/UX & User Flow:**
- **Buyer Dashboard:** A prominent pie chart at the top of the `/vendors` page shows current "Game Changer" spend velocity versus the Board-mandated 15% goal.
- **Visual Kanban:** Dragging a vendor card from "Sample Requested" to "Compliance Review" triggers a slide-out drawer on the right side of the screen, prompting the buyer to upload the vendor's required organic/health certifications.
**Database Schema & API:**
- **Schema Additions:** Expand `Organization` with `isDEI: Boolean`, `deiTags: String[]` (e.g., `["BIPOC", "WOMEN_OWNED", "COOP"]`), and `pipelineStage: Enum`.
- **API Endpoints:** `PUT /api/organizations/:id/pipeline` updates the stage. `GET /api/reports/dei-spend` aggregates POS purchase order data joined against `Organization.isDEI`.

### 12. Local Producer "Food Mile" Calculator
**Description:** Calculate and display the literal distance between the producer and the specific Weaver Street store.
**Benefits:** Enables sorting products by "Food Miles" to easily highlight the absolute freshest local products in flyers.
**Deep Dive integration & Architecture:**
- **Geocoding API:** When a local `Organization` is created, hit the Google Maps Geocoding API to convert their address string into standard long/lat coordinates.
- **Query Optimization:** In the Prisma schema, use raw PostgreSQL/MySQL geospatial extensions (if available) or the Haversine formula in the Next.js API route to calculate the distance between the Organization's coordinates and the target `Location` coordinates on the fly.
**UI/UX & User Flow:**
- **Product Table View:** In the list of `EventProducts`, a dedicated column displays a badge: "12 Miles to Carrboro" with a small green leaf icon. Clicking the headers sorts the entire product catalog by proximity to the currently selected store location.
- **Asset Generation:** When dragging a product onto a generic social media template, an automated text node pops up near the bottom of the image reading "Grown just [X] miles away!" utilizing the pre-calculated data.
**Database Schema & API:**
- **Schema Additions:** Expand `Location` and `Organization` with `latitude: Float?` and `longitude: Float?`. Add `calculatedMiles: Float?` as an optional cache layer to `EventProduct`.
- **API Endpoints:** `POST /api/geocoding/sync` loops through updated addresses and pulls coordinates. `GET /api/products?sortBy=distance&storeId=123` executes the runtime Haversine formula calculation.

### 13. Hyper-Local Seasonal Recipe Engine
**Description:** An AI-assisted content generator that creates recipes utilizing in-stock, local produce.
**Benefits:** Instantly generates recipe cards to move surplus inventory (e.g., local sweet potatoes).
**Deep Dive integration & Architecture:**
- **LLM Integration:** Connect via `@google/genai` to a model like Gemini 1.5 Pro. The prompt context includes the specific surplus `EventProduct` data (e.g., "NC Heirloom Tomatoes") and the co-op's target health demographics.
- **Structured Output:** Force the LLM to return JSON (Title, Ingredients Array, Instructions Array). This JSON is directly hydrated into a pre-styled `EmailItem` React component for the weekly newsletter.
**UI/UX & User Flow:**
- **Trigger from Product:** The merchandiser clicks a "Generate Recipe" button directly on the "NC Heirloom Tomatoes" product page.
- **AI Sidebar:** A sidebar slides open showing a loading skeleton. Three distinct recipe titles appear (e.g., "5-Minute Caprese," "Southern Tomato Pie," "Fire-Roasted Salsa"). The user clicks one, and a formatted, printable 4x6 recipe card PDF is instantly generated and downloaded.
**Database Schema & API:**
- **Schema Additions:** Create `Recipe` model (`title`, `ingredients: Json`, `instructions: Json`, `prepTime`, `cookTime`). Add a many-to-many implicit `RecipeToEventProduct` relation.
- **API Endpoints:** `POST /api/ai/recipes/generate` accepts `productId[]` and calls Gemini 1.5. Returns un-saved JSON. `POST /api/recipes` saves the approved output to the database.

### 14. Inventory-Triggered Marketing
**Description:** If a highly perishable local farm delivery is overstocked, trigger an automated flash sale campaign.
**Benefits:** Dramatically reduces food waste (shrink) and passes savings to members.
**Deep Dive integration & Architecture:**
- **POS Webhook Receiver:** Expose a secure Next.js API route that the grocery POS inventory system pings when an item's "Days to Expiration" metric drops below a threshold *and* stock is high.
- **Automated Execution:** The webhook triggers an Inngest workflow that drafts an SMS warning (Feature #26) or a specialized "Flash Sale" block in the upcoming `EmailPlan` for marketers to instantly approve.
**UI/UX & User Flow:**
- **Push Notification:** The Marketing Director receives an urgent push notification (via the mobile PWA): "ALERT: 50lbs of Local Strawberries expiring in 48hrs. Draft SMS campaign ready."
- **One-Click Execution:** Tapping the notification opens a modal with a pre-written SMS preview: "Flash Sale! 50% off Local Strawberries today only." A single, prominent "Approve & Send" button executes the sequence via Twilio.
**Database Schema & API:**
- **Schema Additions:** Expand `EventProduct` with `stockLevel: Int @default(0)` and `expirationAlertThreshold: Int?`.
- **API Endpoints:** `POST /api/webhooks/pos/inventory-update` strictly typed expecting `{ upc, newStockCount, daysToExpiration }`. If conditions match threshold, uses `inngest.send()` to queue the `marketing/flash-sale.drafted` event.

### 15. Supplier Onboarding Workflows
**Description:** Automate the document collection and approval process for local farmers.
**Benefits:** Ensures all organic certifications, health documents, and W-9s are seamlessly collected before marketing.
**Deep Dive integration & Architecture:**
- **Portal & Storage:** Create a secure upload portal (`/vendor-onboarding`). Uploaded PDFs are sent to a secure S3 bucket.
- **OCR Validation:** Integrate a basic OCR service (like AWS Textract or a Vision model) to verify the documents visually match required forms (e.g., ensuring a W-9 actually looks like a W-9) before flagging the `Organization` as "Approved for Purchasing" in Prisma.
**UI/UX & User Flow:**
- **Farmer Experience:** The farmer receives a magic link via email. Clicking it opens a clean, mobile-friendly multi-step wizard. Step 1: Upload W-9. Step 2: Upload Organic Cert. Step 3: Enter Bank Routing details.
- **Internal Verification:** Once submitted, the Co-op's buying team sees a green checkmark next to the vendor's name in their dashboard, indicating that the intelligent OCR system has verified the legibility and signature presence on all documents.
**Database Schema & API:**
- **Schema Additions:** Add `onboardingStatus: Enum(PENDING_DOCS, REVIEW, APPROVED, REJECTED)` to `Organization`. Create `DocumentUpload` model: `s3Key`, `documentType`, `ocrVerified: Boolean`.
- **API Endpoints:** `POST /api/upload/vendor-doc` processes multipart form hitting AWS S3 `PutObjectCommand`. `POST /api/ai/ocr-validate` triggers the AWS Textract async job utilizing the resulting S3 Key.

### 16. Local Farmer Self-Service Portal
**Description:** A secure hub where producers can upload their own product photos and farm stories.
**Benefits:** Offloads data-entry from the Co-op marketing team and ensures authentic "meet the maker" content.
**Deep Dive integration & Architecture:**
- **Scoped User Access:** The vendor logs in via email OTP. Next.js App Router enforces layout-level checks ensuring `req.user.organizationId` matches the requested edit page.
- **Direct S3 Uploads:** Implement pre-signed URLs from the Next.js API to allow the farmer's browser to upload 20MB raw `.NEF` or `.JPG` files directly to AWS S3, bypassing the Vercel serverless function payload limit.
**UI/UX & User Flow:**
- **Card-Based Interface:** The portal is simple, unlike the dense internal tool. The farmer sees three large cards: "Update Profile," "Upload New Photos," and "Submit Upcoming Harvests."
- **Story Prompting:** Under "Update Profile," the text areas aren't just empty boxes. They have placeholder prompts: "Tell us about how your family started farming..." to encourage better narrative content for the Co-op's newsletter.
**Database Schema & API:**
- **Schema Additions:** Expand `Organization` with `bio: String?`, `foundingYear: Int?`, `websiteUrl: String?`. Add a `VendorAsset` model linking `Organization` to `s3Url`.
- **API Endpoints:** `GET /api/vendor-portal/pre-signed-url` returns temporal S3 credentials. `PATCH /api/vendor-portal/profile` updates the linked `Organization` row.

### 17. Fair Trade & Organic Certification Tracking
**Description:** A database view to track current and expiring certifications.
**Benefits:** Ensures marketing claims (e.g., "100% Organic Local Tomatoes") are legally accurate and backed by current documentation.
**Deep Dive integration & Architecture:**
- **Data Model:** A one-to-many relationship between `Organization` and `Certification`. Each certification has a `validUntil` DateTime field.
- **Automated Validation:** If a marketer attempts to drag an `EventProduct` onto the "Weekly Organic Highlights" flyer template, a pre-flight check queries `product.organization.certifications`. If the organic cert expired two days ago, the drag-and-drop action is rejected with a toast error preventing a false marketing claim.
**UI/UX & User Flow:**
- **Traffic Light Indicators:** In the primary `/vendors` table view, a small dot sits next to every farm name. Green = All certs valid. Yellow = A cert expires in <30 days. Red = Missing or expired vital cert.
- **Hover Context:** Hovering over a Yellow dot brings up a tooltip: "USDA Organic cert expires Oct 15th. [Click to email vendor request]."
**Database Schema & API:**
- **Schema Additions:** Create `Certification` model: `organizationId`, `type: Enum(ORGANIC, FAIR_TRADE, NON_GMO)`, `issuedDate: DateTime`, `expirationDate: DateTime`, `documentS3Key: String`.
- **API Endpoints:** `GET /api/certifications/expiring` (Internal Cron) fetches records `expirationDate < NOW() + 30 days` to queue warning emails via Inngest.

### 18. "Meet the Maker" Content Syndication
**Description:** A button that pushes a local farm's profile to the Co-op's main WordPress website.
**Benefits:** Eliminates double data entry (entering data in Co+promote, then again in the WordPress CMS).
**Deep Dive integration & Architecture:**
- **WordPress REST API:** Co+promote acts as the "source of truth". When a marketer clicks "Publish to Web", a Next.js Server Action compiles the `Organization.bio` and latest `EventProduct` imagery into a JSON payload and POSTs it to the `wp-json/wp/v2/posts` endpoint of the main Weaver Street site.
- **Webhooks:** If the farmer updates their bio in the Self-Service Portal (#16), Co+promote automatically fires a `PUT` request to WordPress to keep the public site synced.
**UI/UX & User Flow:**
- **CMS Publishing Toggle:** On the internal view of a Vendor profile, there is a prominent "Web Status" toggle switch. It reads "Draft".
- **Publish Modal:** Clicking the toggle triggers a modal: "You are about to publish Firsthand Foods to the public website. Review content below." After reviewing the bio layout, the user clicks "Confirm & Publish," turning the toggle green.
**Database Schema & API:**
- **Schema Additions:** Expand `Organization` with `wpPostId: Int?` and `isPublishedToWeb: Boolean @default(false)`.
- **API Endpoints:** `POST /api/integrations/wordpress/sync-vendor/:id` formats Prisma data into WP REST schema. Uses application password auth. Up-serts based on presence of `wpPostId`.

### 19. Mobile Inventory Stock Checker for Staff
**Description:** Staff can quickly check stock levels while on the floor building a display.
**Benefits:** Ensures promotions aren't driving customers to empty endcaps.
**Deep Dive integration & Architecture:**
- **PWA Implementation:** Utilize `next-pwa` to cache core application shells for offline use.
- **Barcode Scanner Integration:** Use a browser-based library like `html5-qrcode` to access the mobile device's camera. Staff scan a product UPC on the floor, which queries the POS API via a Next.js Server Action to instantly return current inventory counts and the next expected delivery date.
**UI/UX & User Flow:**
- **Camera First UI:** When opening the "Stock Check" PWA module, the screen immediately defaults to the camera viewfinder with a scanning reticle.
- **Haptic Feedback:** When a UPC is recognized, the phone vibrates. The view instantly slides up a bottom-sheet modal detailing: Current On-Hand (e.g., "12 Units"), Back-room stock (e.g., "3 Cases"), and the current active Co+promote discount.
**Database Schema & API:**
- **Schema Additions:** No direct schema additions to Co+promote. This feature primarily queries external POS data.
- **API Endpoints:** `GET /api/pos/inventory/:upc` (Internal API) acts as a proxy to the external POS system, returning `{ onHand: Int, backroom: Int, nextDelivery: DateTime? }`.

### 20. AI-Generated Weekly Meal Plans
**Description:** Generate a full week of meals based on what local items are in season and heavily discounted.
**Benefits:** Adds enormous value to the weekly newsletter, driving basket size increases.
**Deep Dive integration & Architecture:**
- **Data Aggregation:** A weekly cron job aggregates the top 10 most discounted `EventProducts` and the top 5 highest-margin local produce items.
- **Generative Assembly:** This array of products is sent to the LLM. The prompt mandates the creation of a 5-day meal plan prioritizing these specific items to minimize grocery bills while supporting local farmers. The output is structured JSON that hydrates a massive `EmailPlan` block.
**UI/UX & User Flow:**
- **Email Consumption:** The member opens the weekly newsletter. They see a beautifully formatted "Meal Plan" section. Beside "Tuesday: Heirloom Tomato Galette" is a one-click "Add items to curbside cart" button, linking heavily discounted items directly to the e-commerce checkout.
**Database Schema & API:**
- **Schema Additions:** Create `MealPlan` model: `title`, `description`, `generatedByAI: Boolean`, `products: Json`, `publishDate: DateTime`.
- **API Endpoints:** `POST /api/ai/meal-plan/generate` accepts `productIds[]` and `discountThreshold` and returns a structured JSON meal plan. `GET /api/meal-plans/weekly` returns the latest published meal plan.

## C. Marketing, Content & Social Media
*(Features focused on campaigns, outreach, and multi-channel promotion)*

### 21. Integrated Email & Communications (CRM Expansion)
**Description:** Connect to Google Workspace or Microsoft 365 APIs to sync emails and calendar events.
**Benefits:** Log email threads directly to Contact and Project records, acting as a true CRM.
**Deep Dive integration & Architecture:**
- **OAuth 2.0 Flow:** Utilize `next-auth` to securely request offline access to the user's Gmail/Outlook scopes.
- **Webhook Subscriptions:** Set up Google Cloud Pub/Sub or Microsoft Graph Webhooks to listen for incoming emails from specific `Contact` email addresses. When a match is found, extract the email body and append it to the `Project` timeline UI for context visibility across the marketing team.
**UI/UX & User Flow:**
- **Project Timeline Feed:** Within a `Project` view (e.g., "Spring Produce Promo"), the right-hand column features a Facebook-style chronological feed. Emails sent to/from involved vendors automatically populate here alongside internal comments.
- **In-Line Reply:** Hovering over an synced email in the feed reveals a "Reply" button, popping open a rich-text Next.js modal that sends the email out via the user's connected Gmail account without them ever leaving Co+promote.
**Database Schema & API:**
- **Schema Additions:** Create `CommunicationLog` model: `contactId`, `userId`, `direction: Enum(INBOUND, OUTBOUND)`, `subject: String`, `bodyHtml: Text`, `messageId: String @unique` (for threading).
- **API Endpoints:** `POST /api/webhooks/nylas` receives incoming webhook from Nylas when an email is sent/received on a tracked Workspace account, dropping the raw payload into the `CommunicationLog`.

### 22. Social Media Scheduling & Tracking
**Description:** Connect to social media APIs (X/Twitter, LinkedIn, Meta, etc.) directly.
**Benefits:** Plan out campaign posts on a unified calendar view.
**Deep Dive integration & Architecture:**
- **Third-Party Integrator:** Instead of maintaining 4 different API versions, integrate a unified service like Ayrshare directly into the Next.js routes.
- **Calendar UI:** Extend the `components/calendar/calendar-view.tsx` to handle a new `SocialPost` model. Dragging a post from Tuesday to Wednesday triggers an API PUT request to Ayrshare to reschedule the actual queued asset.
**UI/UX & User Flow:**
- **Unified Drag-and-Drop Calendar:** The primary `/calendar` route shows `EmailPlans`, `Events`, and `SocialPosts` color-coded. A marketer drags a drafted Instagram post from the "Unscheduled Sidebar" onto Thursday at 10 AM.
- **Platform-Specific Previews:** Clicking the scheduled post opens a modal with a toggle tab: [Instagram] | [Facebook] | [X]. Clicking each tab renders an exact CSS-replica of how the post will look on that specific platform (including character counts and image cropping).
**Database Schema & API:**
- **Schema Additions:** Create `SocialPost` model: `projectId`, `text: String`, `mediaUrls: String[]`, `platforms: Json` (`['INSTAGRAM', 'FACEBOOK']`), `scheduledFor: DateTime`, `ayrshareId: String?`.
- **API Endpoints:** `POST /api/social/schedule` validates character counts and queue limits before saving to DB. `GET /api/webhooks/ayrshare/status` updates the DB record with likes/comments telemetry.

### 23. AI-Powered Asset Tagging & Content Generation
**Description:** A contextual AI assistant embedded directly within the project, task, and asset workflows.
**Benefits:** Auto-tag Immich photos and generate on-brand copy variations for different demographics (RAG strategy).
**Deep Dive integration & Architecture:**
- **Immich Webhook + Vision Model:** When an image is uploaded to Immich, a webhook hits Co+promote. Co+promote downloads the image buffer and streams it to Claude 3.5 Sonnet Vision with the prompt: "List 5 tags for this grocery product. Output only the tags." The response is then pushed back to the Immich API via `updateAsset`.
- **RAG Implementation:** When generating copy, fetch the parent `Project` brief and append it to the system prompt so the LLM output inherently matches the campaign's specific voice guidelines.
**UI/UX & User Flow:**
- **"Magic Sparkle" Button:** Whenever a user is typing a caption within the Social Scheduling modal, a small floating "✨ Optimize Copy" button appears. 
- **Contextual Output:** Clicking it presents a dropdown: [Make it Shorter], [Make it Gen-Z], [Highlight Local Farmer]. The Next.js Server Action runs the RAG pipeline, and the text box gracefully cross-fades into the new AI-generated suggestion.
**Database Schema & API:**
- **Schema Additions:** Expand `Asset` (or mirror Immich asset schema locally) with `aiTags: String[]` and `transcription: Text?`. Add `PromptTemplate` model allowing the Marketing Director to lock in brand voices.
- **API Endpoints:** `POST /api/ai/optimize-copy` heavily utilizes Next.js streaming `ai` SDK to smoothly render words into the text box character by character.

### 24. Advanced Drag-and-Drop Email Campaign Builder
**Description:** Visual email builder leveraging the existing Asset Editor as a component factory.
**Benefits:** Visually arrange products, bypassing strict HTML email constraints using server-rendered blocks.
**Deep Dive integration & Architecture:**
- **Virtual DOM to HTML Tables:** Use a specialized rendering library like `mjml-react`. The drag-and-drop React Flow state maps to an array of objects. When "Export" is clicked, this array is translated first into MJML markup on the server, then compiled into rock-solid, Outlook-compatible HTML tables. 
- **Preview Emulation:** Utilize an API service like Email on Acid to programmatically generate screenshots of how the compiled HTML will look across 40 different mobile and desktop email clients directly within the editor UI.
**UI/UX & User Flow:**
- **Block-Based Canvas:** The editor features a central canvas and a left sidebar of pre-styled Co-op components (e.g., "Product Feature Block", "Local Farmer Spotlight Block", "Event RSVP Block").
- **Product Integration:** The user drags a "Product Feature Block" onto the canvas. It is initially empty. They click the block, which opens a searchable modal of the `EventProduct` database. Clicking "Local Strawberries" instantly populates the email block with the product image, price, and description.
**Database Schema & API:**
- **Schema Additions:** Expand `EmailPlan` with `layoutJson: Json` (stores the raw React layout state) and `compiledHtml: Text?`. Create `EmailTemplate` model for reusable skeleton layouts.
- **API Endpoints:** `POST /api/emails/compile-mjml` processes the heavily nested JSON tree and returns standard inline-CSS HTML. `POST /api/emails/test-send` fires off a preview to the logged-in user via SendGrid.

### 25. Programmatic Video Generation for Social Media (Powered by Remotion)
**Description:** Integrate Remotion to automatically generate branded MP4 videos for Instagram Reels/TikTok directly from Co+promote data.
**Benefits:** Highly dynamic video assets generated instantly without Premiere Pro.
**Deep Dive integration & Architecture:**
- **Remotion Lambda Pipeline:** Create an AWS Lambda function running `remotion-lambda`. When a marketer clicks "Generate Brand Video," a Next.js Server Action sends an array of `EventProduct` data (images, prices, local farmer names) as input props to the Lambda.
- **Dynamic Compositions:** The Remotion React composition iterates over the array, applying Weaver Street Market's specific font (e.g., Brandon Grotesque) and green brand colors over a 15-second fluid motion timeline, dropping the final MP4 back into the Immich instance.
**UI/UX & User Flow:**
- **Template Selection:** The marketer clicks "New Video." They are presented with 3 motion templates (e.g., "Weekend Sale Splash," "Farmer Spotlight," "New Item Drop"). 
- **Data Hookup:** After selecting "Weekend Sale Splash," they are asked to select 4 products. They click "Render Video." A loading bar appears as the Lambda function processes the frames, and within 30 seconds, an `<video>` tag appears playing the final, rendered 1080x1920 MP4 ready for TikTok.
**Database Schema & API:**
- **Schema Additions:** Create `VideoAsset` tracking `remotionRenderId`, `s3Url`, `compositionIdentifier`, and `inputProps: Json`.
- **API Endpoints:** `POST /api/remotion/render` invokes AWS Lambda with the specific `EventProduct` props payload. Webhook catches the AWS Lambda completion and writes the URL back to Prisma.

### 26. SMS/Text Message Campaign Manager
**Description:** Direct integration with Twilio for flash sales or event reminders to members.
**Benefits:** Extremely high open-rates compared to traditional email, perfect for urgent perishable sales.
**Deep Dive integration & Architecture:**
- **Twilio Segmenting:** Build a `SMSSegment` model that queries the `Contact` database for actively opted-in phone numbers based on recent purchase behavior (e.g., "Members who bought bulk chicken in the last 30 days").
- **Cost-Control UI:** Because SMS carries a hard per-message cost, the UI must display a real-time "Estimated Campaign Cost: $45.20" before the marketer can hit "Send."
**UI/UX & User Flow:**
- **Character Count Visualizer:** A strictly enforced 160-character input box (acting like an old Twitter box). An iOS/Android phone mockup sits to the right, live-updating to show exactly how the blue/green chat bubbles will render on a real device.
- **Segment Warning:** If a marketer accidentally selects the "All Contacts" segment for an SMS, a warning modal triggers: "You are about to text 15,000 people. This will cost approximately $150. Are you sure?"

### 27. Direct Mail Postcard Generator
**Description:** Export customer segments directly to a direct mail service (like Lob) for seasonal mailers.
**Benefits:** Reconnects with members who have unsubscribed from emails but still live locally.
**Deep Dive integration & Architecture:**
- **Lob Print API:** Convert the React-based Asset Editor canvas (Feature #10) into a high-resolution 300dpi PDF designed for standard 4x6" postcard bleeds. 
- **Automated CSV Sync:** Create a Next.js Server Action that takes a filtered list of `Contacts` (no email interaction in 6 months) and POSTs their physical addresses and the PDF asset directly to the Lob API for physical printing and mailing.
**UI/UX & User Flow:**
- **Print Bleed Guides:** When designing an asset in the Editor marked for "Direct Mail," the canvas automatically adds a semi-transparent red border indicating the 0.125" print bleed area, warning the designer if vital text is too close to the edge.
- **Proof Approval:** Before API submission, Lob returns a digital proof. The marketer must type their initials into a digital "I approve this physical print run" input box.

### 28. In-Store Audio Ad Scheduler
**Description:** Manage and schedule the in-store radio/audio promotions directly from the CRM.
**Benefits:** Unifies the digital marketing strategy with the physical in-store shopper experience.
**Deep Dive integration & Architecture:**
- **Audio Asset Management:** Expand the `@immich/sdk` implementation (which natively handles video) to accept `.mp3` or `.wav` voiceover files uploaded by the marketing team.
- **Store-Level Playback:** Expose a secure, long-poll API endpoint (`/api/locations/audio-queue`). Each physical Weaver Street location runs a lightweight Raspberry Pi or background browser connected to the PA system that constantly fetches and plays the active `PromotionPeriod` audio assets.
**UI/UX & User Flow:**
- **Audio Waveform Editor:** A simple UI (using `wavesurfer.js`) allows marketers to listen to the uploaded `.mp3` voiceover and visually trim dead air from the beginning or end of the track.
- **Location Toggles:** A grid of checkboxes allows the marketer to select which specific locations (e.g., Carrboro, Southern Village) should play the audio asset between specific hours (e.g., 9 AM - 11 AM only).

### 29. Social Listening & Sentiment Analysis
**Description:** Monitor local community Facebook groups and Nextdoor for mentions of Weaver Street Market.
**Benefits:** Allows community managers to proactively respond to localized praise or complaints.
**Deep Dive integration & Architecture:**
- **Scraping Infrastructure:** This requires the Puppeteer/Playwright implementation (Feature #40) running on a scheduled cron job (via Inngest) to scrape specific, public Nextdoor neighborhood pages or public Facebook groups using a dedicated "listener" account.
- **Sentiment Flagging:** Stream the scraped text through an LLM (Claude 3.5 Haiku) with a simple prompt: "Rate sentiment 1-10 and summarize complaint." If the score is < 4, it instantly opens a high-priority `Task` for the Community Manager.
**UI/UX & User Flow:**
- **Sentiment Thermometer:** The Community Manager dashboard features a gauge graph (Red to Green) indicating the aggregate community sentiment over the last 24 hours.
- **Triage Inbox:** Flagged negative comments appear in a specialized "Triage List." Clicking a comment opens a quick-reply modal that copies a professionally worded, de-escalating response to the clipboard for the manager to paste back into Nextdoor.

### 30. User-Generated Content (UGC) Aggregator
**Description:** Automatically pull in Instagram posts where the co-op is tagged and request permission to use.
**Benefits:** Authentically showcases the community engaging with co-op products.
**Deep Dive integration & Architecture:**
- **Instagram Graph API:** Register a Meta App to subscribe to the `mentions` webhook. When @weaverstreetmarket is tagged, the webhook delivers the post ID to Co+promote.
- **Rights Management Workflow:** The `components/tasks/task-board.tsx` populates a "Pending UGC" column. A marketer clicks a button which auto-comments on the Instagram post: "We love this! Reply #YesWeaver to let us use this photo." A secondary webhook listens for that hashtag reply and automatically imports the high-res image to Immich.
**UI/UX & User Flow:**
- **Masonry Gallery View:** The `Pending UGC` dashboard renders an attractive masonry layout of community photos. 
- **One-Click Authorization:** Hovering over a photo reveals a central "Request Permission" button. Clicking it turns the button into a spinning loader while the API posts the comment. Once the user replies with `#YesWeaver`, the image animates with a green checkmark and flies into the Immich "Approved Assets" folder.

### 31. Influencer/Ambassador Management Module
**Description:** Track local food bloggers, their reach, and the ROI of comped products.
**Benefits:** Professionalizes influencer outreach in the competitive Triangle food scene.
**Deep Dive integration & Architecture:**
- **Custom Contact Tags:** Extend the `Contact` model with a `socialFollowing` integer and an `isAmbassador` boolean. 
- **Promo Code Attribution:** Generate unique, single-use Shopify/POS promo codes via API (e.g., `FOODIE_RDU_15`) tied directly to that `Contact` UUID. The dashboard then visualizes total revenue generated vs. the cost of goods given to the influencer.
**UI/UX & User Flow:**
- **Ambassador Profile View:** Clicking on a `Contact` flagged as an Ambassador opens a specialized CRM view. Instead of standard charts, it highlights their Instagram Handle, Total Reach, and a grid of `Immich` assets they've generated for the brand.
- **ROI Calculator Widget:** A simple input box allows the community manager to type in the value of the gift card given to the influencer (e.g., "$100"). The widget instantly compares that against the revenue generated from their unique promo code, displaying a green or red ROI percentage.

### 32. In-Store Augmented Reality (AR) Product Scanner
**Description:** Customers scan a local product via a PWA to see a video of the farmer.
**Benefits:** Deeply connects the consumer to the cooperative's local mission at the point of decision.
**Deep Dive integration & Architecture:**
- **WebAR Implementation:** Build a specific Next.js route (`/scan`) utilizing `MindAR` or `8thWall` for browser-based image tracking.
- **Dynamic Asset Loading:** When the camera recognizes the specific local `EventProduct` label, it queries the Immich API for the associated "Farmer Story" video (Feature #16) and overlays it playing seamlessly onto the physical product packaging in the user's viewport.
**UI/UX & User Flow:**
- **In-Store Prompt:** A small shelf-talker reads, "Meet the Farmer! Scan with your phone." containing a QR code.
- **Seamless AR Experience:** Scanning the QR code opens the phone's native browser to `/scan`. No app download is required. A pulsing UI overlay guides the user to center the physical product in their camera view, triggering the immersive video playback anchored to the real-world item.

### 33. Translation Engine for Diverse Communities
**Description:** Automatically translate marketing materials into Spanish and other prominent local languages.
**Benefits:** Increases accessibility and fulfills the DEI mandate of serving the entire community.
**Deep Dive integration & Architecture:**
- **Translation API Pipeline:** When an `EmailPlan` or `SocialPost` draft is marked 'Approved', trigger an Inngest background job that sends the text payloads to Google Cloud Translation API.
- **Multilingual Variants:** The database stores `translations: { es: "..." }` on the model. The frontend UI provides a toggle to flip the Asset Editor context into Spanish so designers can adjust font sizing for longer translated words before final export.
**UI/UX & User Flow:**
- **Canvas Language Toggle:** Inside the Asset Editor and Email Builder, a highly visible floating toggle switch (🇺🇸 EN / 🇲🇽 ES) sits in the top right. 
- **Non-Destructive Editing:** Switching to Spanish instantly swaps all text nodes on the canvas. If a translated word breaks a layout container, the designer can drag the bounding box to fix it—this layout change is saved *only* for the Spanish variant.

### 34. "A/B Testing" Email Module
**Description:** Automatically send two versions of an email to a subset, and send the winner to the rest.
**Benefits:** Iteratively improves open and click-through rates.
**Deep Dive integration & Architecture:**
- **ESP Webhook Processing:** Co+promote sends Variant A (10% of list) and Variant B (10% of list). Next.js exposes a `/api/webhooks/esp-metrics` route to catch open/click events from SendGrid/Mailchimp.
- **Automated Winner Selection:** A cron job runs 4 hours after the initial send. It queries the webhook metrics database table. Whichever `EmailPlanVariationId` has a higher CTR triggers the dispatch of the remaining 80%.
**UI/UX & User Flow:**
- **Split Testing Canvas:** When creating an Email Campaign, clicking "Add A/B Test" physically splits the editor screen down the middle. The user can alter the subject line or hero image on the right side while keeping the left side static.
- **Results Dashboard:** Moving back to the `/campaigns` view, the A/B test shows a live tug-of-war graphic. As webhooks fire, the graphic pulls toward the winning variant until the timer expires and the remaining 80% deployment is visually confirmed.

### 35. Dynamic Weather-Based Email Content
**Description:** Modify email content blocks based on the local Triangle weather forecast.
**Benefits:** If a storm is forecasted, automatically promote local staples and comfort foods.
**Deep Dive integration & Architecture:**
- **OpenWeatherMap Integration:** 24 hours before a scheduled `EmailPlan` dispatch, query the weather API for the Triangle bounding box.
- **Conditional Rendering Blocks:** In the Email Builder JSON (Feature #24), marketers can set a block's `renderCondition` to `weather.temp < 40`. The server-side HTML renderer evaluates this condition at dispatch time, ensuring the final email features the hot soup promotion instead of iced coffee.
**UI/UX & User Flow:**
- **Rules Engine Modal:** Clicking on a specific row in the Email Builder reveals a new 'Conditional Logic' tab. The UI provides a simple "If [Condition] then [Show/Hide] this block." 
- **Weather Simulator:** To test the email before sending, a "Simulate Environment" dropdown lets the marketer preview exactly what the email will look like if it's currently Sunny, Raining, or Snowing, instantly adding or removing the conditionally programmed blocks from the canvas preview.

### 36. Personalized Product Recommendations in Emails
**Description:** Inject personalized product blocks based on the member's past purchase history.
**Benefits:** Massive increases to conversion rates by tailoring the flyer to vegan vs. omnivore shoppers.
**Deep Dive integration & Architecture:**
- **Vector Embeddings for Products:** Run all `EventProducts` through an embedding model and store them in a vector database (like Pinecone or pgvector).
- **At-Dispatch Personalization:** When dispatching the email via the ESP, use Liquid templating or exact-time API calls. For each `Contact`, calculate the cosine similarity between their past purchase vectors and the current weekly sale items, injecting the top 3 matches directly into their unique HTML email payload.
**UI/UX & User Flow:**
- **Drag-and-Drop Variable:** In the Email Builder UI, instead of dragging a specific product onto the canvas, the marketer drags a generic "Personalized "For You" Block." 
- **Fallback Configuration:** A side-panel requires the marketer to select 3 'Fallback Products' just in case the system is emailing a brand new `Contact` with absolutely no purchase history, ensuring the layout never breaks.

## D. Data, Analytics & Automation
*(Features focused on workflows, scrapers, and reporting)*

### 37. Advanced Analytics & Reporting Dashboard (Powered by Graphic Walker)
**Description:** Introduce a robust, Tableau-like reporting module leveraging Graphic Walker.
**Benefits:** Exploratory Data Analysis (EDA) of event revenues and custom React dashboards that process client-side.
**Deep Dive integration & Architecture:**
- **Data Export Pipeline:** Create a Next.js Server Action that dumps a flattened, sanitized Array of Objects combining `Event`, `EventProduct`, and `User` data.
- **Client-Side Rendering:** Pass this JSON array directly into the `<GraphicWalker />` React component. Because Graphic Walker uses Web Workers for client-side aggregation, the Co+promote server experiences zero computational load when a marketer builds a complex pivot table.
**UI/UX & User Flow:**
- **Graphic Walker Integration:** The `/analytics/explorer` route renders the pure Graphic Walker UI. The user drags the `Department` pill onto the X-axis and the `Revenue` pill onto the Y-axis.
- **Save to Dashboard:** Once the marketer builds a useful visualization (e.g., "MDF Spend vs. Revenue by Department"), they click "Pin to Dashboard." The specific JSON config is saved to Prisma, rendering that exact view as a static `<PureRenderer>` widget on their personalized home screen.

### 38. Automated Workflows & Triggers
**Description:** A rule-based automation engine using React Flow UI and Inngest/Trigger.dev backend.
**Benefits:** Drag-and-drop automation of tasks, statuses, and notifications.
**Deep Dive integration & Architecture:**
- **Visual Node Editor:** Implement `@xyflow/react` where nodes represent Next.js Server Actions (e.g., "Send Email", "Update Status"). 
- **Inngest Engine:** When a workflow is saved, the JSON structure maps to an Inngest Step Function. If the workflow has a "Wait 2 Days" node, Inngest natively handles the durable sleep state without requiring complex Redis queues.
**UI/UX & User Flow:**
- **Node Graph Interface:** An infinitely pannable canvas with dot-grid styling. The user drags a "Trigger: New Event Created" node and connects it with a bezier curve to an "Action: Create 3 Social Media Task" node. 
- **Live Execution Path:** When a workflow is actively running for a specific event, the UI highlights the currently executing node in a pulsing neon green, mapping exactly where the automation is in real-time.

### 39. Geo-Spatial Event Analytics & Attendance Tracking
**Description:** Enhance Event/Location models with map-based visualizers.
**Benefits:** Scan QR codes at physical locations to automatically log attendance into the CRM.
**Deep Dive integration & Architecture:**
- **Mapbox GL JS:** Integrate `react-map-gl` to render a clustered map of `Events`. The circle size represents total RSVPs.
- **Dynamic QR Generation:** The `Event` page automatically generates a unique QR code utilizing the `qrcode.react` library. When scanned by a member's mobile phone, a Next.js API route validates their session and creates an `EventAttendance` record.
**UI/UX & User Flow:**
- **Heatmap View:** In the Analytics tab, a toggle switches the traditional bar charts to a Mapbox overlay of the Triangle area. Event attendance is represented as a thermal heatmap, quickly showing if marketing efforts are successfully drawing people from neighboring counties.
- **At-Door Kiosk:** A basic iPad displaying the `Event` QR code sits on the welcome table. As members walk in and scan it with their native camera app, a small toast notification pops up on the iPad: "Welcome, Jane! Check-in successful."

### 40. Automated Web Scraping & Data Entry (Powered by Puppeteer)
**Description:** Utilize Puppeteer as a headless browser worker triggered by API routes.
**Benefits:** Competitor intelligence (scraping Wegmans/Publix prices), automated form syndications, and asset visual regressions.
**Deep Dive integration & Architecture:**
- **Serverless Browser Provisioning:** Deploy alongside a service like Browserless.io or use `@sparticuz/chromium` if deploying to Vercel/AWS Lambda to avoid binary size limits.
- ** DOM Parsing:** Write targeted Puppeteer scripts that locate specific CSS selectors on competitor domains (e.g., `#price-tag`), returning the innerText value back to the `EventProduct` price tracking table in Prisma.
**UI/UX & User Flow:**
- **Competitor Matrix Table:** A dedicated dashboard view shows Weaver Street's price for organic milk next to automated, constantly updated columns scraping local competitors. 
- **Price Alerting:** If a scraper detects a competitor dropped their price by more than 10%, that specific table cell turns red, and an automated task is assigned to the pricing coordinator to review the margin.

### 41. Prescriptive Analytics Engine
**Description:** AI that doesn't just show data, but tells the marketer *what* to do next.
**Benefits:** Example: "Produce sales dropping at Carrboro location. Recommend 15% discount on local apples."
**Deep Dive integration & Architecture:**
- **Anomaly Detection:** An Inngest cron job pulls daily sales aggregates from the POS and compares them against a 30-day moving average.
- **LLM Synthesis:** If a standard deviation is breached, the data is sent to an LLM with the prompt: "Sales have dropped 20% in category X. Give 3 actionable marketing interventions." The resulting text is formatted as an 'Alert' on the main `/dashboard`.
**UI/UX & User Flow:**
- **"Genius" Recommendations Sidebar:** A persistent right-hand drawer that populates with actionable insights. Instead of just static text, the LLM output is structured to render UI elements.
- **One-Click Action:** Underneath the recommendation ("Demand for local honey is up 40% but we have excess inventory. Draft a flash sale email?"), there is a button: "Draft Campaign". Clicking it instantly pre-populates the Email Builder (Feature #24) with honey products.

### 42. Real-Time Foot Traffic Integration
**Description:** Integrate store foot traffic sensors into the analytics dashboard.
**Benefits:** Correlate online promotion spikes directly with physical visits to the stores.
**Deep Dive integration & Architecture:**
- **Hardware API Intake:** Expose a secure Next.js webhook (e.g., `/api/webhooks/dor-sensor`) to receive hourly POST requests from physical door sensors (like Dor or RetailNext) at the Weaver Street locations.
- **Overlay Charting:** Using a charting library like Recharts or Graphic Walker, overlay the physical foot traffic line graph onto the digital Email Open Rate line graph to visually track in-store conversion rates.
**UI/UX & User Flow:**
- **Correlation Charting:** In the main dashboard, the marketer views the "Weekend Promotion Performance" chart. A blue line graph tracks total email clicks over 48 hours. A grey bar chart overlaid underneath shows the physical door swings in the Carrboro store, making the attribution immediately blindingly obvious.

### 43. Marketing Budget Allocation Tracker
**Description:** Track marketing spend and MDF per department (e.g., Deli, Produce, Wellness).
**Benefits:** Identifies which departments are under-supported by marketing efforts.
**Deep Dive integration & Architecture:**
- **Budget Schemas:** Add `LedgerEntry` models tied to `Project` and `Department`. When an `EmailPlan` is sent via SendGrid, the fractional cost of that email is automatically debited from the chosen Department's monthly marketing budget logic.
**UI/UX & User Flow:**
- **Visual Budget "Buckets":** Navigate to the `/budgets` view to see CSS-animated bar graphs representing the Deli, Produce, and GM departments. As campaigns are executed, the "Funds Remaining" section of the bar visually depletes in real-time, preventing the classic end-of-quarter budget scramble.

### 44. External Advertising ROI Calculator
**Description:** Input costs for local magazine, newspaper, or NPR radio sponsorships.
**Benefits:** Calculates Cost-Per-Acquisition based on matched promo codes.
**Deep Dive integration & Architecture:**
- **Attribution Modeling:** When setting up a non-digital `Project` (e.g., a print ad in Indy Week), the marketer enters the hard cost ($1,500). They also input the specific promo code printed in the ad (`INDY15`). The dashboard queries the POS for all receipts utilizing `INDY15` and calculates the explicit ROI of the print campaign.
**UI/UX & User Flow:**
- **Campaign Cost-Basis Input:** When creating a new `Project`, checking the "External Media" box opens a sub-form to log the hard invoice cost, the vendor, and the designated attribution code. 
- **ROI Table:** The `/campaigns` index view includes a prominent "Net Profit/Loss" column. Campaigns running at a loss are highlighted in a subtle warning red, while profitable campaigns appear in success green.

### 45. Automated Alt-Text & Accessibility Checker
**Description:** Ensure all generated assets meet ADA compliance automatically.
**Benefits:** Mitigates legal risks and stays true to the co-op value of inclusivity.
**Deep Dive integration & Architecture:**
- **Vision Model Pass:** Before any `EmailPlan` is allowed to be dispatched, a pre-flight hook runs all `EmailItemPhoto` URLs through a vision model (e.g., Claude V) demanding concise, descriptive alt-text.
- **HTML DOM Validation:** The server-rendered email HTML (from Feature #24) is parsed by axe-core before export to ensure color contrast ratios and table structures meet WCAG AA standards.
**UI/UX & User Flow:**
- **Pre-Flight Checklist UI:** When a marketer clicks "Deploy Campaign," a modal pops up running a visual checklist (similar to Vercel deployments). 
- **Auto-Fix Prompts:** If `axe-core` detects low contrast text over a background image, that specific checklist item fails. Clicking the "Fix" button auto-selects the text in the editor and pops open the color-picker tool suggesting a WCAG AA compliant alternative hue.

## E. Internal Operations & Productivity
*(Features focused on time tracking, forms, and task management)*

### 46. Client & External Collaborator Portals
**Description:** Secure, restricted access views for marketing agencies or external designers.
**Benefits:** Centralizes feedback and asset approval without exposing internal data.
**Deep Dive integration & Architecture:**
- **Magic Link Auth:** External vendors receive a secure, expiring JWT link to view a specific `Project` (e.g., `promoty.coop/guest/p/123xyz`).
- **Scoped Permissions:** The Next.js layout checks the session role. `Guest` roles are stripped of all navigation except the `Asset` approval board and stripped of access to any API routes not strictly related to `ProjectComment` creation.
**UI/UX & User Flow:**
- **Annotated Feedback UI:** When a guest views an `Immich` asset, their cursor turns into a crosshair. Clicking anywhere on the image leaves a numbered pin. A sidebar allows them to type a comment linked to that specific pin (e.g., "Pin 1: Make this logo bigger").
- **Version Control Stack:** Upgraded assets stack vertically in the UI. The guest can grab a slider to visually wipe between "Version 1" and "Version 2" of the same flyer to ensure their changes were addressed before clicking "Approve."

### 47. Time Tracking & Invoicing
**Description:** Add timers to tasks and a billing module.
**Benefits:** Track billable hours for project profitability (especially useful if offering services to other co-ops).
**Deep Dive integration & Architecture:**
- **Zustand Timer State:** Use a global state manager so a marketer can start a timer on a `Task`, navigate away to build an email, and stop it later without losing the running count.
- **Stripe Integration:** When a `Project` is finished, aggregate all `TaskTimeLogs` into a Next.js Server Action that generates a Stripe Invoice and emails it directly to the external client `Contact`.
**UI/UX & User Flow:**
- **Persistent Global Timer:** When a timer is active on a task, a subtle, pulsing "00:15:23 [Task Name]" pill always visible in the top-right global navigation bar, regardless of which page the user navigates to.
- **One-Click Invoice Generation:** In the Project wrap-up view, clicking "Generate Invoice" builds a beautiful HTML preview of the bill, cleanly itemizing the tracked hours by user and department. Clicking submit instantly dispatches the Stripe payment link.

### 48. Document Templates & E-Signatures
**Description:** A module to handle organizational contracts, proposals, and NDAs.
**Benefits:** Generate standard contracts pre-filled with Contact and Project data.
**Deep Dive integration & Architecture:**
- **React-PDF Generation:** Utilize `@react-pdf/renderer` to build exact replica templates of Weaver Street's legal NDAs within the React codebase. 
- **Variable Hydration:** When a contract is initiated, the system passes the `Organization` data into the React-PDF component props, exporting a locked, finalized PDF to the e-signature API (Feature #9).
**UI/UX & User Flow:**
- **Template Library:** A slick, grid-based `/templates` view shows thumbnails of available legal docs. Hovering over a document shows a "Quick Fill" button.
- **Variable Mapping Modal:** Clicking "Quick Fill" opens a modal asking the user to select an existing `Organization` from a combobox. The system then displays a two-column comparison: "Data required by Template" vs. "Data found in CRM". If the CRM is missing the vendor's Tax ID, the input box is highlighted red, preventing generation until filled.

### 49. Mobile PWA (Progressive Web App) Enhancements
**Description:** Optimize the Next.js application for seamless offline or mobile-native usage.
**Benefits:** Real-time on-site task checking and event management for staff who are not at a desk.
**Deep Dive integration & Architecture:**
- **Service Worker Caching:** Configure `next-pwa` strategies: `NetworkFirst` for HTML pages to ensure fresh data, but `CacheFirst` for static JS/CSS assets and `StaleWhileRevalidate` for Immich image thumbnails to make the mobile dashboard feel instantly responsive.
- **Background Sync API:** If a staff member marks an `Event` task complete while in the store's walk-in cooler (no WiFi), the Service Worker queues the GraphQL mutation and automatically executes it when a connection is restored.
**UI/UX & User Flow:**
- **Native-Feel App Icon:** Members are prompted to "Install App" upon logging in on iOS Safari. Once installed, Co+promote launches without a browser URL bar, feeling exactly like a native Swift app.
- **Offline Indicator:** If connection drops, a subtle orange banner appears at the top: "Offline Mode: Changes will sync when reconnected." The user can continue to check off inventory tasks without any UI freezing or error modals.

### 50. Enhanced Task Dependencies & Sub-tasks
**Description:** Blockers and dependencies for the Kanban task board.
**Benefits:** Granular control (e.g., Asset Creation must finish before Printing can begin).
**Deep Dive integration & Architecture:**
- **Prisma Relational Trees:** Update the `Task` model to have a self-relation: `dependsOn Task[]` and `blocking Task[]`. 
- **Graph UI Logic:** In the `task-board` component, grey out and disable the drag-and-drop capability for any `Task` if its `dependsOn` array contains any tasks where `status !== 'completed'`. Use `framer-motion` to draw visual lines between dependent tasks if the user specifically toggles a "Show Dependencies" view.
**UI/UX & User Flow:**
- **Visual "String" Dependencies:** On the Kanban board, a user toggles "Dependency View." Smooth, curved SVG SVG lines (like in Jira or Miro) instantly animate onto the screen, physically connecting blocked cards to their blockers in visually distinct colors.
- **Auto-Unblock Notifications:** When a copywriter drags the "Finalize Newsletter Copy" task into the "Done" column, a confetti micro-animation plays. Simultaneously, the connected "Design Newsletter Layout" task instantly un-greys, and the assigned designer receives a push notification: "Copy is ready. You are unblocked."

