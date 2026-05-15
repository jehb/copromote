## 2024-05-15 - Added ARIA labels to Asset Editor template and saved asset load and delete buttons
**Learning:** Found an accessibility issue pattern where visual previews were acting as buttons but lacked aria labels for screen readers. Deleting items also lacked aria labels, relying only on title.
**Action:** Always ensure any icon-only button or purely visual button (such as a preview image acting as a load button) explicitly has an `aria-label` providing full context (e.g. `aria-label="Load template ${template.name}"`).
