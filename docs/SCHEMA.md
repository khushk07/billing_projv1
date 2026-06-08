# Data Schema Reference

All JSON files are arrays of records unless noted. Field types use TypeScript notation.

---

## inventory.json — Product Catalogue

Each entry is a fully defined product used for regular stock.

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Himalaya Rain Jacket",
  "category": "Rainwear",
  "subcategory": "Rainsuits",
  "variant": "L / Navy",
  "sellingPrice": 2499,
  "stockQuantity": 12,
  "lowStockThreshold": 5,
  "createdAt": "2026-05-19T10:30:00.000Z",
  "updatedAt": "2026-05-19T10:30:00.000Z"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (uuid) | Unique product identifier |
| `name` | string | Display name |
| `category` | string | Top-level category (from `lib/categories.ts`) |
| `subcategory` | string | Subcategory under category |
| `variant` | string? | Optional size/color/free text |
| `sellingPrice` | number | Price per unit in INR |
| `stockQuantity` | number | Current units in stock |
| `lowStockThreshold` | number | Alert when stock ≤ this (default 5) |
| `createdAt` | string (ISO 8601) | Record creation time |
| `updatedAt` | string (ISO 8601) | Last modification time |

**File shape:** `Product[]`

---

## stocklog.json — Quick Stock Log

Loose entries for items not fully catalogued. Minimal validation.

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "name": "Cheap poncho pack",
  "category": "Rainwear",
  "subcategory": "Ponchos",
  "approxPrice": 150,
  "quantity": 20,
  "source": "billing",
  "lastUsedPrice": 180,
  "timesUsed": 7,
  "createdAt": "2026-05-18T09:00:00.000Z",
  "updatedAt": "2026-05-19T14:00:00.000Z",
  "promotedToCatalogue": false
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (uuid) | Unique entry identifier |
| `name` | string | Item name |
| `category` | string | Category |
| `subcategory` | string | Subcategory |
| `approxPrice` | number | Approximate/reference price |
| `quantity` | number | Estimated stock (loose) |
| `source` | `"manual"` \| `"billing"` \| `"bulk-import"` | How entry was created |
| `lastUsedPrice` | number | Price from most recent sale using this item |
| `timesUsed` | number | Count of appearances in completed sales |
| `createdAt` | string (ISO 8601) | Creation time |
| `updatedAt` | string (ISO 8601) | Last update |
| `promotedToCatalogue` | boolean | If true, hidden from active log (kept for history) |

**File shape:** `StockLogItem[]`

---

## sales.json — Completed Sales

```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "billNumber": "SG-0042",
  "customerId": "880e8400-e29b-41d4-a716-446655440003",
  "customerName": "Rahul Sharma",
  "customerPhone": "9876543210",
  "items": [
    {
      "id": "line-1",
      "name": "Himalaya Rain Jacket",
      "subcategory": "Rainsuits",
      "category": "Rainwear",
      "quantity": 1,
      "unitPrice": 2499,
      "lineTotal": 2499,
      "source": "catalogue",
      "sourceId": "550e8400-e29b-41d4-a716-446655440000"
    }
  ],
  "grandTotal": 2499,
  "createdAt": "2026-05-19T15:45:00.000Z"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (uuid) | Sale record id |
| `billNumber` | string | Human-readable bill id (e.g. `SG-0001`) |
| `customerId` | string (uuid) | Link to customers.json |
| `customerName` | string | Snapshot at time of sale |
| `customerPhone` | string | 10-digit Indian mobile |
| `items` | BillItem[] | Line items (see below) |
| `grandTotal` | number | Sum of line totals |
| `createdAt` | string (ISO 8601) | Sale completion time |

### BillItem (nested in `items`)

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Line id (uuid) |
| `name` | string | Item name |
| `subcategory` | string | Subcategory label |
| `category` | string | Category label |
| `quantity` | number | Units sold |
| `unitPrice` | number | Price per unit |
| `lineTotal` | number | quantity × unitPrice |
| `source` | `"catalogue"` \| `"stocklog"` \| `"quick"` | Origin of line |
| `sourceId` | string? | Product or stock log id if applicable |

**File shape:** `Sale[]`

---

## customers.json — Customer Profiles

Auto-maintained from sales; deduplicated by phone.

```json
{
  "id": "880e8400-e29b-41d4-a716-446655440003",
  "name": "Rahul Sharma",
  "phone": "9876543210",
  "totalVisits": 3,
  "totalSpent": 7500,
  "lastPurchaseDate": "2026-05-19T15:45:00.000Z",
  "categoriesBought": ["Rainwear", "Trekking Gear"],
  "salesIds": ["770e8400-e29b-41d4-a716-446655440002"],
  "createdAt": "2026-04-01T10:00:00.000Z",
  "updatedAt": "2026-05-19T15:45:00.000Z"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (uuid) | Customer id |
| `name` | string | Customer name |
| `phone` | string | 10 digits, unique key |
| `totalVisits` | number | Number of completed sales |
| `totalSpent` | number | Lifetime spend in INR |
| `lastPurchaseDate` | string (ISO 8601) | Most recent sale date |
| `categoriesBought` | string[] | Distinct categories purchased |
| `salesIds` | string[] | Linked sale ids |
| `createdAt` | string (ISO 8601) | First seen |
| `updatedAt` | string (ISO 8601) | Last profile update |

**File shape:** `Customer[]`

---

## API Response Shape (all routes)

```json
{
  "success": true,
  "data": {},
  "error": "optional message when success is false"
}
```
