# Summit Gear — Store Management System

## What This Project Is

Summit Gear is a **local store management web app** for a trekking gear and rainwear shop based in Mumbai. It runs on a laptop via `localhost` and handles:

- **Billing** — create sales, generate PDF bills, open WhatsApp to share bills
- **Inventory** — product catalogue and quick stock log (two-layer system)
- **Customer tracking** — auto-built from every sale
- **Sales history** — search, filter, and export

**Who it's for:** Shop staff at the counter — laptop, tablet, or phone. No GST, no login, no cloud database in v1.

---

## PWA (mobile app on your phone)

The app is **installable** as a Progressive Web App after you host it on **HTTPS**:

- Mobile menu, large billing buttons, sticky **Complete Sale** bar
- Stock **auto-syncs every 12s** on New Sale (for multiple billing devices)
- WhatsApp + PDF bills + CSV export unchanged

**Full guide:** see [`docs/PWA-DEPLOY.md`](PWA-DEPLOY.md)

**Branding on home screen:** edit `appShortName` and `themeColor` in `lib/storeConfig.ts`.

---

## How to Install and Run Locally

**Prerequisites:** [Node.js](https://nodejs.org/) 18 or newer (includes `npm`).

1. **Get the project** — copy the `billing_proj` folder to your laptop, or clone/unzip it.

2. **Open a terminal** in the project folder:
   ```bash
   cd path/to/billing_proj
   ```

3. **Install dependencies** (first time only):
   ```bash
   npm install
   ```

4. **Start the dev server:**
   ```bash
   npm run dev
   ```

5. **Open the app** in your browser: [http://localhost:3000](http://localhost:3000)

6. **Stop the server:** Press `Ctrl+C` in the terminal.

For production-like local use:
```bash
npm run build
npm start
```

---

## Folder Structure

```
billing_proj/
├── app/                    # Next.js App Router pages and API routes
│   ├── dashboard/          # Home — stats, low stock, recent sales
│   ├── inventory/          # Product catalogue + stock log tabs
│   ├── new-sale/           # Billing flow
│   ├── customers/          # Customer list
│   │   └── [id]/           # Individual customer detail
│   ├── sales-history/      # Past sales with filters
│   └── api/                # REST API for JSON data
├── components/             # React UI components by feature
├── data/                   # JSON data files (your store data lives here)
├── docs/                   # This documentation
├── lib/                    # Business logic, helpers, PDF, CSV
├── types/                  # TypeScript interfaces
└── public/                 # Static assets (if any)
```

---

## How Data Is Stored

All store data lives in **`/data`** as JSON files:

| File | Contents |
|------|----------|
| `inventory.json` | Full product catalogue (name, price, stock, categories) |
| `stocklog.json` | Quick/ad-hoc stock entries (loose items, billing learnings) |
| `sales.json` | Completed sales/invoices |
| `customers.json` | Customer profiles (deduplicated by phone) |

- **Reads/writes** go only through **API routes** (`/api/*`), never directly from the browser to files.
- **Server-side** code uses `lib/dataHelpers.ts` for atomic read/write.
- New installs start with empty arrays `[]` in each file.

---

## How to Back Up Data

1. **Stop the app** (optional but safer while copying).
2. **Copy the entire `/data` folder** to a USB drive, Google Drive, or another folder.
3. That's it — all customers, sales, inventory, and stock log are in those 4 files.

**To restore:** Replace the `/data` folder with your backup and restart the app (`npm run dev`).

---

## How to Move the Project to Another Laptop

1. Copy the **whole project folder** (including `/data` if you want existing records).
2. On the new laptop, install [Node.js](https://nodejs.org/) 18+.
3. Open terminal in the project folder:
   ```bash
   npm install
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000).

If you only copy `/data` onto a fresh install of the app, paste it into the project root so paths match `data/inventory.json`, etc.

See **`docs/PORTING.md`** for cloud deployment and database migration.

---

## Migrating from JSON to a Real Database

v1 is intentionally JSON-based for simplicity. When you outgrow it:

1. Choose **SQLite** (single file, easy) or **Postgres** (multi-user, cloud).
2. Map types in `types/index.ts` to tables (see `docs/SCHEMA.md`).
3. Replace `lib/dataHelpers.ts` with a DB client; keep the same function signatures where possible.
4. Keep API routes as thin wrappers — business logic stays in `/lib`.
5. Run a one-time import script reading the 4 JSON files into tables.

Details: **`docs/PORTING.md`** and **`docs/FUTURE.md`**.

---

## Environment Variables

**None required for v1.** The app uses local JSON only. No API keys, no database URL.

If you deploy to a server later, you may add `PORT` or `DATA_DIR` — document those in `PORTING.md` when introduced.

---

## Known Limitations (v1)

- **Single machine** — one laptop; no multi-device sync
- **No authentication** — anyone on the machine can use the app
- **No GST** — totals are simple sums
- **JSON storage** — not ideal for very high transaction volume or concurrent writes from multiple users
- **Client-side PDF** — bills generated in the browser via jsPDF
- **WhatsApp** — opens `wa.me` link; user attaches PDF manually
- **No barcode scanning, suppliers, or purchase orders** (see `docs/FUTURE.md`)

---

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- jsPDF, uuid, date-fns
- Local JSON via API routes
