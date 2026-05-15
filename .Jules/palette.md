## 2024-05-18 - Added Accessible Labels to Icon-Only Buttons
**Learning:** Found several icon-only buttons in the task board component that were missing `aria-label` attributes. Without text or `aria-label`, screen readers just announce 'button', which is confusing.
**Action:** When adding icon-only buttons, always include an `aria-label` to ensure accessibility.
