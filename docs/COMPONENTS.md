# Components Reference

Documentation for every React component in Summit Gear. Update when adding new components.

---

## PWA (`/components/pwa`)

### InstallPrompt
- **Purpose:** Android install banner + iOS “Add to Home Screen” hint.
- **Props:** None.
- **Used on:** All pages via `AppShell`.

## Layout (`/components/layout`)

### AppShell
- **Purpose:** Wraps app with desktop sidebar + mobile header/drawer + install prompt.
- **Props:** `children`
- **Used on:** Root layout.

### MobileHeader / MobileDrawer
- **Purpose:** Top bar and slide-out nav on phones.
- **Used on:** Mobile only (`lg:hidden`).

### Sidebar
- **Purpose:** Fixed left navigation — Dashboard, New Sale, Inventory, Customers, Sales History.
- **Props:** None.
- **Emits:** None.
- **Used on:** All pages via root layout.

### PageHeader
- **Purpose:** Page title and optional action slot.
- **Props:** `title: string`, `subtitle?: string`, `action?: React.ReactNode`
- **Emits:** None.
- **Used on:** Dashboard, Inventory, New Sale, Customers, Sales History, Customer detail.

### NavLink
- **Purpose:** Active-styled sidebar link.
- **Props:** `href: string`, `label: string`, `icon?: React.ReactNode`
- **Emits:** None.
- **Used on:** Sidebar.

---

## UI (`/components/ui`)

### Button
- **Props:** `variant?: 'primary' | 'secondary' | 'danger' | 'ghost'`, `size?: 'sm' | 'md' | 'lg'`, standard button HTML attrs.
- **Used on:** All feature pages.

### Input
- **Props:** `label?: string`, `error?: string`, standard input attrs.
- **Used on:** Forms across app.

### Select
- **Props:** `label?: string`, `options: { value: string; label: string }[]`, `error?: string`, select attrs.
- **Used on:** Category/subcategory forms.

### Badge
- **Props:** `variant?: 'default' | 'catalogue' | 'stocklog' | 'warning' | 'danger' | 'success'`
- **Used on:** Search results, stock status, customer badges.

### Modal
- **Props:** `isOpen: boolean`, `onClose: () => void`, `title: string`, `children: React.ReactNode`
- **Used on:** Edit product, promote to catalogue, confirm delete.

### Table
- **Props:** `columns`, `data`, `onRowClick?`, `emptyMessage?`
- **Used on:** Inventory, customers, sales history.

### Tabs
- **Props:** `tabs: { id: string; label: string }[]`, `activeTab: string`, `onChange: (id: string) => void`
- **Used on:** Inventory page.

---

## Inventory (`/components/inventory`)

### ProductForm
- **Purpose:** Add/edit catalogue product.
- **Props:** `initialData?: Partial<Product>`, `onSubmit: (data) => void`, `onCancel?: () => void`, `submitLabel?: string`
- **Used on:** Inventory — Catalogue tab, PromoteModal.

### ProductTable
- **Purpose:** Filterable product list with edit/restock/delete.
- **Props:** `products: Product[]`, `onEdit`, `onRestock`, `onDelete`, `onRefresh`
- **Used on:** Inventory — Catalogue tab.

### StockLogForm
- **Purpose:** Quick-add stock log entry.
- **Props:** `onSubmit`, `onSuccess?`
- **Used on:** Inventory — Stock Log tab.

### StockLogTable
- **Purpose:** Active stock log entries with promote action.
- **Props:** `entries: StockLogItem[]`, `onPromote`, `onRefresh`
- **Used on:** Inventory — Stock Log tab.

### BulkImport
- **Purpose:** Paste lines `Name, Price, Quantity` for bulk stock log import.
- **Props:** `onImport: (entries) => void`
- **Used on:** Inventory — Stock Log tab.

### PromoteModal
- **Purpose:** Pre-filled catalogue form from stock log entry.
- **Props:** `entry: StockLogItem`, `isOpen`, `onClose`, `onPromoted`
- **Used on:** Inventory — Stock Log tab.

---

## Billing (`/components/billing`)

### CustomerLookup
- **Purpose:** Name + phone with returning-customer detection.
- **Props:** `name`, `phone`, `onNameChange`, `onPhoneChange`, `isReturning?: boolean`
- **Used on:** New Sale.

### ProductSearch
- **Purpose:** Unified search across catalogue + stock log; quick-add when no results.
- **Props:** `catalogue: Product[]`, `stockLog: StockLogItem[]`, `onAddItem: (item, qty) => void`
- **Used on:** New Sale.

### QuickAddForm
- **Purpose:** Inline ad-hoc item when search has no match.
- **Props:** `searchQuery: string`, `onAdd`, `onCancel`
- **Used on:** ProductSearch (inline).

### BillTable
- **Purpose:** Itemised bill with qty edit and remove.
- **Props:** `items: BillLine[]`, `onUpdateQty`, `onRemove`
- **Used on:** New Sale.

### BillSummary
- **Purpose:** Grand total and complete sale button.
- **Props:** `items`, `onComplete`, `isSubmitting?`
- **Used on:** New Sale.

---

## Customers (`/components/customers`)

### CustomerTable
- **Purpose:** Searchable customer list with CSV export.
- **Props:** `customers: Customer[]`, `onRowClick`, `onExport`
- **Used on:** Customers list page.

### PurchaseHistory
- **Purpose:** List of sales for one customer.
- **Props:** `sales: Sale[]`
- **Used on:** Customer detail page.

---

## Dashboard (`/components/dashboard`)

### StatCard
- **Purpose:** Single metric display.
- **Props:** `title`, `value`, `subtitle?`
- **Used on:** Dashboard.

### LowStockAlert
- **Purpose:** List of low-stock products with link to inventory.
- **Props:** `products: Product[]`
- **Used on:** Dashboard.

### RecentSales
- **Purpose:** Last N sales feed.
- **Props:** `sales: Sale[]`
- **Used on:** Dashboard.

---

*Update this file when adding or changing component APIs.*
