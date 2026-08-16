# Future Features — Not in v1

Living document of capabilities **anticipated in structure** but not built yet. Update as priorities change.

---

## Mobile Version

- ~~Touch-optimized billing and inventory~~ **Done (PWA v1)**
- ~~PWA install + mobile nav~~ **Done** — see `docs/PWA-DEPLOY.md`
- Offline queue with sync when back online (not yet)
- Native APK wrapper (Capacitor) if needed later

---

## Multi-Device Access

- Central API + database instead of local JSON
- Real-time or periodic sync between counter tablet and back-office PC
- Conflict resolution for stock updates

---

## Proper Database

- SQLite for single-store server
- Postgres for cloud / multi-branch
- Migration path documented in `PORTING.md`

---

## WhatsApp API Integration

- v1: manual — PDF download + `wa.me` link
- Future: Business API to send bill PDF automatically (budget-dependent)
- Template messages for thank-you / promotions

---

## Barcode Scanning

- USB/Bluetooth scanner on billing page
- SKU field on catalogue products
- Lookup by barcode in unified search

---

## Supplier Management

- Supplier contacts, lead times
- Link products to preferred supplier

---

## Restock Purchase Orders

- PO creation from low-stock alerts
- Receive stock → auto-increment catalogue quantities
- PO history and status (draft, ordered, received)

---

## Other Ideas

- GST / tax lines (India compliance)
- Staff accounts and roles
- Discounts and loyalty points
- Reports: monthly revenue, category mix
- Email receipts
- Multi-store (branch id on records)

---

*Last updated: v1 initial release*
