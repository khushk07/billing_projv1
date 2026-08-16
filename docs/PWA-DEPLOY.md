# PWA & Hosting Guide

Your app is **PWA-ready**: installable on phones/tablets, mobile navigation, and stock auto-sync for multiple billing devices.

---

## Install on a phone (after hosting on HTTPS)

### Android (Chrome)

1. Open your hosted shop URL.
2. Tap **Install** in the banner, or menu → **Install app** / **Add to Home screen**.
3. Open from the home screen icon — works like an app.

### iPhone (Safari only)

1. Open the URL in **Safari** (not Chrome).
2. Tap **Share** → **Add to Home Screen**.
3. Confirm the name → **Add**.

> iOS does not show an automatic install button; use Share → Add to Home Screen.

### Local testing (same Wi‑Fi only)

`localhost` cannot be installed as a PWA. Use hosted HTTPS or tunnel (see below).

---

## What still works in the PWA

- PDF bills (download / open on device)
- WhatsApp (`wa.me` link — attach PDF manually)
- CSV export (customers, sales)
- Shared inventory & sales when all devices use the **same hosted URL**

---

## Hosting options (pick one)

### A. Railway / Render / VPS (recommended for JSON data)

JSON files in `/data` must persist on disk.

1. Push code to GitHub.
2. Connect Railway or Render.
3. Build: `npm run build` · Start: `npm start`
4. Attach a **persistent volume** mounted to `/data` (or project root `data/`).
5. Set custom domain + HTTPS (platform provides SSL).

**Cost:** about $5–15/month.

### B. Vercel (easy deploy, data caveat)

Vercel serverless **does not keep `/data` between deploys** unless you use external storage.

- OK for demos.
- For production with JSON, prefer Railway/VPS or add cloud storage later.

### C. Shop PC + Cloudflare Tunnel (free URL)

1. PC runs `npm run build && npm start` (port 3000).
2. Install [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/).
3. Point a subdomain to `localhost:3000` → free HTTPS.
4. All shop devices use that URL.

**Requires:** PC on during shop hours.

---

## Multiple billing devices (3 counters)

1. **One URL** for every device — same hosted app.
2. Stock on **New Sale** refreshes every **12 seconds** and when you return to the tab.
3. Tap **Refresh stock** before selling a low-stock item if another counter just sold it.
4. Do **not** run separate copies of the app with separate `/data` folders.

---

## Customize install name & colours

Edit `lib/storeConfig.ts`:

- `appShortName` — home screen label
- `themeColor` — status bar / browser chrome

Icons: `public/icons/icon.svg` and `public/store-logo.png` (see `app/manifest.ts`).

---

## Commands

```bash
npm install
npm run build
npm start
```

Development:

```bash
npm run dev
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| No install prompt | Need **HTTPS**; not `http://localhost` on phone |
| iOS won’t install | Use **Safari**, Share → Add to Home Screen |
| Devices show different stock | All must use **same hosted URL**, not separate laptops |
| Data lost after deploy | Use persistent disk (Railway/VPS), not serverless without storage |
