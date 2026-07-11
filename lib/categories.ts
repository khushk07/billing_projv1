/**
 * Single source of truth for all product categories and subcategories.
 * Never hardcode categories elsewhere — import from this file.
 */

export interface CategoryConfig {
  name: string;
  subcategories: string[];
}

export const CATEGORIES: CategoryConfig[] = [
  {
    name: "Trekking Gear",
    subcategories: [
      "Hiking Pants",
      "Winter Jackets",
      "Hiking Shoes",
      "Accessories",
      "Hiking Bags",
    ],
  },
  {
    name: "Rainwear",
    subcategories: [
      "Rainsuits",
      "Ponchos",
      "Longcoat",
      "Kids Longcoat",
      "Skirt-Top",
    ],
  },
  {
    name: "Umbrellas",
    subcategories: [
      "Umbrella",
      "X1",
      "X2",
      "X3",
      "X4",
      "X5",
      "X6",
      "X7",
      "X8",
    ],
  },
];

export const CATEGORY_NAMES = CATEGORIES.map((c) => c.name);

/**
 * Returns subcategories for a given category name.
 * @param category - Top-level category name
 * @returns Array of subcategory strings, or empty if not found
 */
export function getSubcategories(category: string): string[] {
  const found = CATEGORIES.find((c) => c.name === category);
  return found?.subcategories ?? [];
}

/**
 * Returns the auto-suggested HSN code for a given category/subcategory/price.
 * Returns undefined for categories that require manual entry (e.g. Accessories).
 *
 * Rules:
 *  - Umbrellas (any subcategory)          → 66019900
 *  - Trekking Gear › Hiking Bags          → 4202
 *  - Trekking Gear › Hiking Shoes         → ≤₹2000 → "6404" | >₹2000 → "6403"
 *  - Trekking Gear › Accessories          → undefined  (manual)
 *  - Everything else                      → undefined  (use value saved in DB)
 */
export function getAutoHsn(
  category: string,
  subcategory: string,
  unitPrice: number
): string | undefined {
  const cat = category.toLowerCase();
  const sub = subcategory.toLowerCase();

  // ── Umbrellas ────────────────────────────────────────────────
  if (cat === "umbrellas") return "66019900";

  // ── Trekking Gear ────────────────────────────────────────────
  if (cat === "trekking gear") {
    if (sub === "hiking bags")   return "4202";
    if (sub === "winter jackets") return "62019300";
    if (sub === "hiking pants")  return "620319";
    if (sub === "hiking shoes")  return unitPrice <= 2000 ? "64041900" : "6403";
    if (sub === "shirt" || sub === "t-shirt" || sub === "shirt/t-shirt") return "6105";
    if (sub === "accessories")   return undefined; // manual entry
  }

  // ── Rainwear ─────────────────────────────────────────────────
  if (cat === "rainwear") return "62014000";

  return undefined;
}

