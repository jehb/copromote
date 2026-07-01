#!/bin/bash

# Update events-client-page.tsx
sed -i 's/<button/<button aria-label="List view"/g' components/events/events-client-page.tsx
sed -i '0,/<button aria-label="List view"/s//<button aria-label="List view"/' components/events/events-client-page.tsx
