# Hisaab — Privacy-First Finance Manager

Hisaab is a privacy-first, local-first personal and small-business finance management application built with **React 18**, **TypeScript**, **Vite**, **Dexie (IndexedDB)**, and **PWA** offline capabilities.

All financial transactions, accounts, categories, budgets, and savings goals remain exclusively on your device. There is no remote backend, no telemetry, no tracking analytics, and no external financial API dependencies.

---

## What’s New in This Upgrade

### 1. Subtle Claymorphic Design System
- **Muted, refined palette**: Soft ivory/sage background (`#F5F6F2`), primary surfaces (`#FBFCF9`), forest green accents (`#2D5A46`), soft mint (`#E4F0E8`), pale blue (`#E5EDF5`), warm cream (`#F4EDE0`), and soft coral (`#F4E3DF`).
- **Restrained depth**: Multi-layered soft drop shadows, delicate inner highlights, recessed input fields, and smooth active press states without bloated neumorphism.
- **Responsive Layout**: Desktop fixed sidebar with brand lockup, active claymorphic pills, quick transaction entry, and mobile floating dock with touch targets.
- **Light & Dark Mode**: True native theme support with dark claymorphic tokens.

### 2. Multi-Account & Cash Management
- Track money across **Bank Accounts**, **Cash Wallets**, and other asset accounts.
- Set baseline opening balances in integer paise with opening baseline dates.
- Interactive dashboard summary cards:
  - **Total Balance**: Sum of all active accounts.
  - **Bank Balance**: Sum of active bank accounts.
  - **Cash in Hand**: Sum of cash wallets.
- Account archiving and safe deletion protection (cannot delete accounts with financial history).

### 3. Pure Internal Transfers (Rule 3)
- Transfer funds between accounts (e.g. HDFC Bank to Cash Wallet via ATM withdrawal).
- Invariant total balance: Source account balance decreases, destination account increases.
- Internal transfers are strictly excluded from period income, expenses, and category totals.

### 4. Custom Categories & Safe Deletion
- Create, edit, and manage custom income and expense categories.
- Select from 20 curated icons and muted claymorphic color swatches.
- **Safe Deletion Protection**: Warns if existing transactions use a category and lets you reassign them or mark them as Uncategorised before deleting.
- **Local Vendor Suggestions**: Analyzes local transaction history to suggest categories automatically when typing vendor notes without sending data to the cloud.

### 5. Financial Summary & Period Analysis
- Total Income, Total Expenses, Net Savings Surplus/Deficit, and Savings Rate.
- Period comparisons (vs prior period) with absolute and percentage changes.
- Multi-filter transaction ledger: filter simultaneously by search query, transaction type, account, category, payment method, date range, and scope (Personal / Business / Combined).

### 6. Budgets & Savings Goals
- **Budgets**: Overall monthly spending budget + per-category monthly limits with progress tracks and overspending alerts. Excludes internal transfers.
- **Savings Goals**: Dedicated goals with target amounts, current saved amounts, target completion dates, days remaining, and progress tracking.

### 7. Reports, PDF, CSV, and Backups
- **Pristine PDF / Print Report**: Local in-browser printable statement with Hisaab branding, period summaries, category breakdowns, and transaction tables.
- **Enhanced CSV Export**: Exports date, time, type, category, amount, class, account name, method, and notes. Protected against spreadsheet formula injection (`=`, `+`, `-`, `@`).
- **Versioned JSON Backup & Restore**: Supports legacy v1 and upgraded v2 formats with pre-import validation to prevent partial database corruption.

---

## Financial Calculation Rules

Hisaab strictly enforces 14 fundamental accounting rules:
1. **Expenses**: Reduce selected account balance and increase period expenses.
2. **Income**: Increase selected account balance and increase period income.
3. **Transfers**: Decrease source account and increase destination account. Invariant total balance; never count as income or expense.
4. **Opening Balances**: Baseline starting points; never counted as new income during reporting periods.
5. **Total Balance**: Sum of all active (non-archived) accounts.
6. **Bank Balance**: Combined balance of active bank accounts.
7. **Cash Balance**: Combined balance of active cash wallets.
8. **Category Totals**: Category spend includes qualifying expenses only; transfers excluded.
9. **Net Savings**: `Net Savings = Income - Expenses`. Savings Rate = `(Net Savings / Income) * 100`.
10. **Filtered Reports**: Consistent across account, category, method, and date range filters.
11. **Precision**: Stored and calculated in integer paise (`₹100.50 = 10,050 paise`).
12. **Credit Cards**: Repayments modeled as transfers to prevent double-counting expenses.
13. **Goals**: Contributions tracked distinctly without duplicating income or expenses.
14. **Budgets**: Track spending against qualifying expenses only.

---

## Development & Testing

### Prerequisites
- Node.js 18+ (tested with v20.20.2)
- npm 9+

### Commands

```bash
# Run automated financial calculation test suite
npm test

# Run development server
npm run dev

# Run TypeScript check and production build
npm run build

# Preview production build locally
npm run preview
```

---

## Data Migration & Safety

When opening Hisaab after upgrading from an earlier version:
- Dexie schema version 2 automatically preserves existing `tx` and `kv` tables.
- Historical transactions without account metadata are labeled `unassigned` rather than fabricating historical associations.
- A banner will notify you of unassigned legacy transactions and allow one-click batch assignment to your chosen account.
- Legacy version 1 backups can be imported anytime from **Settings > Restore or import a backup**.

---

## Deployment

Run `npm run build` to generate the `dist/` directory.

Deploy the contents of `dist/` to any static hosting service supporting HTTPS:
- Cloudflare Pages
- Netlify Drop
- GitHub Pages
- Vercel

HTTPS is required by browsers for Service Worker PWA installation and offline caching.
