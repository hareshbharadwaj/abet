# Third-Party Notices

A2ZEE Microgreenz bundles open-source dependencies. This file records the licence
of every runtime package shipped in the production bundle, so redistributed
builds carry the required attribution.

> The application source itself is proprietary to A2ZEE Microgreenz Pvt. Ltd.
> This notice covers third-party components only. Regenerate the inventory with
> `npm ls --omit=dev --all` after dependency changes.

## Runtime dependencies

| Package | Licence | Purpose |
| --- | --- | --- |
| `react`, `react-dom` | MIT | UI runtime |
| `react-router-dom` | MIT | Hash-based client routing |
| `firebase` | Apache-2.0 | Authentication, Firestore, hosting SDK |
| `lucide-react` | ISC | Icon set |
| `sonner` | MIT | Toast notifications |
| `framer-motion` | MIT | Animation primitives |
| `recharts` | MIT | Dashboard charts |
| `date-fns` | MIT | Date formatting |
| `clsx`, `class-variance-authority`, `tailwind-merge` | MIT | Styling utilities |
| `@radix-ui/*` | MIT | Accessible headless UI primitives |
| `@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled` | MIT | Material UI components |
| `embla-carousel-react` | MIT | Product carousels |
| `cmdk` | MIT | Command palette |
| `canvas-confetti` | ISC | Checkout celebration effect |
| `file-saver` | MIT | Client-side report downloads |
| `input-otp` | MIT | OTP input primitive |
| `next-themes` | MIT | Theme switching helper |
| `react-day-picker` | MIT | Calendar picker |
| `react-hook-form` | MIT | Form state management |
| `react-resizable-panels` | MIT | Split-pane layouts |
| `vaul` | MIT | Drawer primitive |
| `zod` | MIT | Runtime schema validation |

## Build-time dependencies

| Package | Licence |
| --- | --- |
| `vite`, `@vitejs/plugin-react` | MIT |
| `typescript` | Apache-2.0 |
| `tailwindcss`, `@tailwindcss/vite` | MIT |
| `xlsx-js-style`, `xlsx` | Apache-2.0 |
| `selenium-webdriver` | Apache-2.0 |
| `@sparticuz/chromium` | MIT |

## Fonts and imagery

Product photography and the A2ZEE logo/seal artwork are owned by A2ZEE
Microgreenz Pvt. Ltd. No third-party font files are bundled — the UI uses the
system font stack.

## Reporting a licensing concern

Open an issue or contact the maintainer listed in `.github/CODEOWNERS`.
