# Porting Guide — Summit Gear

How to move or deploy this app beyond a single dev laptop.

---

## 1. Another Laptop (Same Setup)

### What to copy

- Entire project folder **or** at minimum:
  - All source code (`app/`, `components/`, `lib/`, `types/`, config files)
  - **`data/`** folder (your live store data)

### Steps

1. Install Node.js 18+ on the new machine.
2. Place the project folder (e.g. `Desktop/billing_proj`).
3. In terminal:
   ```bash
   cd Desktop/billing_proj
   npm install
   npm run dev
   ```
4. Browser: `http://localhost:3000`

### Reconfigure

- Nothing required if paths stay relative and `data/` is at project root.
- Do **not** use absolute paths in code — the app uses `process.cwd()/data`.

---

## 2. Cloud Server (VPS — Railway, Render, DigitalOcean)

### Considerations

- JSON file writes on **ephemeral** filesystems may be lost on redeploy unless you attach persistent volume.
- Prefer **persistent disk** or migrate to SQLite/Postgres before production cloud use.

### What to copy

- Git repository or zip of project (exclude `node_modules`; include `data/` for initial seed or import separately).

### Example: DigitalOcean Droplet (Ubuntu)

```bash
# On server
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git

git clone <your-repo-url> summit-gear
cd summit-gear
npm install
npm run build
```

Run with PM2:

```bash
sudo npm install -g pm2
pm2 start npm --name "summit-gear" -- start
pm2 save
pm2 startup
```

Set `PORT` if host requires it (e.g. `PORT=8080 npm start`).

### Persistent data on server

- Mount volume at `/var/summit-gear/data` and symlink:
  ```bash
  ln -s /var/summit-gear/data ./data
  ```
- Or set future `DATA_DIR` env and update `dataHelpers.ts` once added.

### Railway / Render

1. Connect GitHub repo.
2. Build: `npm run build`
3. Start: `npm start`
4. Add **persistent volume** mounted to `/data` (platform-specific docs).
5. Backup volume regularly — same as copying `/data` locally.

---

## 3. Mobile-First Rebuild (Future)

v1 is laptop-first. For mobile:

- Reuse `types/`, `lib/categories.ts`, API contract from `SCHEMA.md`.
- Replace Next.js pages with React Native / PWA; keep backend API or move to hosted API + DB.
- Billing search and quick-add must stay one-tap fast — prioritize in UX design.

See `docs/FUTURE.md`.

---

## 4. SQLite or Postgres Migration

### When

- Multiple staff/devices, or
- JSON file size or write contention becomes an issue, or
- Cloud deploy without reliable file persistence.

### SQLite (single server)

```bash
npm install better-sqlite3
# or drizzle-orm + better-sqlite3
```

1. Create tables matching `docs/SCHEMA.md`.
2. Import script:
   ```bash
   node scripts/import-json-to-sqlite.js
   ```
3. Replace `readJsonFile` / `writeJsonFile` in `lib/dataHelpers.ts` with DB queries.
4. Keep API route signatures unchanged for minimal UI churn.

### Postgres (multi-user / cloud)

```bash
npm install pg
# Set DATABASE_URL in .env (first env var in project)
```

- Same table design as SQLite with proper indexes on `customers.phone`, `sales.createdAt`.
- Use connection pooling on serverless (e.g. Neon, Supabase).

### What to reconfigure

| Item | Local JSON | Database |
|------|------------|----------|
| Data path | `./data/*.json` | `DATABASE_URL` |
| Backups | Copy `/data` folder | `pg_dump` or SQLite file copy |
| Bill numbers | `lib/billNumber.ts` from sales file | DB sequence or max query |

---

## Checklist Before Go-Live on Server

- [ ] Persistent storage for data
- [ ] Automated backup (cron + copy `data/` or DB dump)
- [ ] HTTPS reverse proxy (nginx/Caddy)
- [ ] Document `PORT` and start command for host
- [ ] Test restore from backup once
