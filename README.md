# Cafe QR — Founder Operations & Sales CRM Dashboard

An isolated, lightweight, full-featured Founder Dashboard and Sales CRM built for **Cafe QR**.

---

## 🌟 Key Features

### 1. 🚀 Automated Sales CRM & Pipeline
- **8-Stage Pipeline**:
  1. `YET_TO_REACH_OUT` (Cold Calling Pool)
  2. `NEW_INQUIRY` (Inbound WhatsApp/Social/Web)
  3. `IN_DISCUSSION`
  4. `DEMO_SCHEDULED`
  5. `ONBOARDED_TRIAL`
  6. `PAID_ACTIVE`
  7. `COLD_FOLLOW_UP`
  8. `LOST`
- **Sub-View Switcher**:
  - **Kanban Board**: Drag-and-drop / 1-click stage progression, search, tag filters, overdue follow-up tags.
  - **Rapid Cold Caller**: Dedicated phone-bank dialer mode for `YET_TO_REACH_OUT` leads with 1-tap `tel:` and instant outcome buttons (*Interested*, *Booked Demo*, *No Answer / Retry Tomorrow*, *Not Interested*).
- **Action Queue Shelf**: Instant alerts for overdue follow-ups and calls scheduled for today with direct 1-tap call and WhatsApp links.
- **Activity & Note History**: Complete chronological log of calls, WhatsApp notes, demos, objections, and deal values.

### 2. ⚡ Branch-First Data Resolution & 1-Click Activation
- **Branch-First Fallback**: Resolves merchant profiles, phones, and subscription status from `Organization` (Branch) first, falling back to `Client` (Parent Legal Entity), then `User`.
- **Accurate Expiry & Module Detection**: Detects active subscription state based on branch expiry date (`subscription_expiry_date > NOW()`) and active modules in `client_subscription_modules`.
- **1-Click Branch & Module Activation Modal**:
  - Quick extensions: `+30 Days`, `+90 Days`, `+180 Days`, `+365 Days` or custom date picker.
  - Instant module toggles: KOT, Inventory, Table QR Ordering, CRM, Credit Ledger, Barcode Scanner, Menu Images, Online Delivery.
  - Eliminates manual database/SQL manipulation.

### 3. 🤖 Inbound WhatsApp Lead Auto-Capture
- Integrates with the existing companion Baileys WhatsApp Gateway (`sessionId: 'cafeqr_official'`).
- Inbound prospect inquiries are automatically captured into the CRM under `NEW_INQUIRY` with lead source `WHATSAPP_INBOUND`.

### 4. 📱 Universal Responsive UI (320px to 4K)
- Zero horizontal-scroll traps on mobile devices.
- Swipeable horizontal stage pill selectors on mobile viewports.
- Responsive modals formatted as native mobile bottom-sheets.

---

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+ or 20+
- Backend running on `http://localhost:8080`
- WhatsApp Gateway running on `http://localhost:3005` (optional, for auto-capture & QR pairing)

### Installation
```bash
# Install dependencies
npm install

# Start development server on port 3001 (isolated from merchant frontend on port 3000)
npm run dev

# Build for production
npm run build
```

---

## ⚙️ Environment Variables (`.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_FOUNDER_KEY=cafeqr-founder-2024-secret
NEXT_PUBLIC_MERCHANT_PORTAL_URL=https://app.cafeqr.in
```
