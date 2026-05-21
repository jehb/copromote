## 2024-05-18 - Added Accessible Labels to Icon-Only Buttons
**Learning:** Found several icon-only buttons in the task board component that were missing `aria-label` attributes. Without text or `aria-label`, screen readers just announce 'button', which is confusing.
**Action:** When adding icon-only buttons, always include an `aria-label` to ensure accessibility.
## 2024-05-15 - Added ARIA labels to Asset Editor template and saved asset load and delete buttons
**Learning:** Found an accessibility issue pattern where visual previews were acting as buttons but lacked aria labels for screen readers. Deleting items also lacked aria labels, relying only on title.
**Action:** Always ensure any icon-only button or purely visual button (such as a preview image acting as a load button) explicitly has an `aria-label` providing full context (e.g. `aria-label="Load template ${template.name}"`).

## 2024-05-16 - Added ARIA label to Event Card delete button
**Learning:** The project heavily uses `Button size="icon"` from Shadcn UI containing only lucide-react icons, particularly for common actions like delete or edit. These are invisible to screen readers without explicit `aria-label` attributes.
**Action:** When adding or modifying any icon-only buttons (especially common actions like delete or edit), ensure they have an explicit and descriptive `aria-label` attribute (e.g., `aria-label="Delete Event"`).
## 2024-05-17 - Added Accessible Labels to Icon-Only Buttons in Gallery Component
**Learning:** Found several icon-only buttons (like Grid View, Table View, View Photo Details, Delete Photo, Edit Metadata) in the gallery component that were missing `aria-label` attributes. Without text or `aria-label`, screen readers just announce 'button', which is confusing.
**Action:** When adding icon-only buttons, always include an `aria-label` to ensure accessibility.
## 2024-05-19 - Added Accessible Labels to Icon-Only Buttons in Social Component
**Learning:** Found several icon-only buttons (like View Post, Delete Post) in the social component that were missing `aria-label` attributes.
**Action:** Always ensure any icon-only button explicitly has an `aria-label` providing full context.
