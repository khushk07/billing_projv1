/**
 * Single source of truth for all product categories, subcategories, models, sizes, GST, and HSN rules.
 * Never hardcode categories elsewhere — import from this file.
 */

export interface CategoryConfig {
  name: string;
  subcategories: string[];
}

export interface SubcategoryModelRules {
  models?: string[];
  sizes?: string[];
  fixedGstPercentage?: number;
  fixedHsnCode?: string;
}

export const HIKING_PANTS_MODELS = [
  "Discovery (Convertible)",
  "Phantom",
  "Tactical",
  "Mt. Kailash (Snow Pants)",
  "Mt. Trishul (Snow Pants)",
  "Aqua Pro (Waterproof)",
  "Terra Trek (Convertible)",
  "Nomad (Cargo)",
  "Cargo (Convertible)",
  "Sprint",
  "Delta (Convertible)",
  "Aerofit (Convertible)",
];

export const HIKING_PANTS_SIZES = [
  '24"',
  '26"',
  '28"',
  '30"',
  '32"',
  '34"',
  '36"',
  '38"',
  '40"',
  '42"',
  '44"',
];

export const CATEGORIES: CategoryConfig[] = [
  {
    name: "Hiking Gears",
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
  const catLower = category.toLowerCase().trim();
  const found = CATEGORIES.find((c) => c.name.toLowerCase().trim() === catLower);
  return found?.subcategories ?? [];
}

/**
 * Returns rules (models, sizes, GST, HSN) for a given category/subcategory combination.
 */
export function getSubcategoryRules(category: string, subcategory: string): SubcategoryModelRules {
  const cat = category.toLowerCase().trim();
  const sub = subcategory.toLowerCase().trim();

  if ((cat === "hiking gears" || cat === "trekking gear") && sub === "hiking pants") {
    return {
      models: HIKING_PANTS_MODELS,
      sizes: HIKING_PANTS_SIZES,
      fixedGstPercentage: 5,
      fixedHsnCode: "620319",
    };
  }

  return {};
}

/**
 * Returns the auto-suggested GST Percentage for a given category & subcategory.
 */
export function getAutoGst(category: string, subcategory: string): number | undefined {
  const rules = getSubcategoryRules(category, subcategory);
  return rules.fixedGstPercentage;
}

/**
 * Returns the auto-suggested HSN code for a given category/subcategory/price.
 * Returns undefined for categories that require manual entry (e.g. Accessories).
 */
export function getAutoHsn(
  category: string,
  subcategory: string,
  unitPrice: number
): string | undefined {
  const cat = category.toLowerCase().trim();
  const sub = subcategory.toLowerCase().trim();

  const rules = getSubcategoryRules(category, subcategory);
  if (rules.fixedHsnCode) return rules.fixedHsnCode;

  // ── Umbrellas ────────────────────────────────────────────────
  if (cat === "umbrellas") return "66019900";

  // ── Hiking / Trekking Gear Defaults ──────────────────────────
  if (cat === "hiking gears" || cat === "trekking gear") {
    if (sub === "hiking bags")   return "4202";
    if (sub === "winter jackets") return "62019300";
    if (sub === "hiking pants")  return "620319";
    if (sub === "hiking shoes")  return unitPrice <= 2000 ? "64041900" : "6403";
    if (sub === "shirt" || sub === "t-shirt" || sub === "shirt/t-shirt") return "6105";
    if (sub === "accessories")   return undefined; // manual entry
  }

  // ── Rainwear ─────────────────────────────────────────────────
  if (cat === "rainwear") return "62014000";

/**
 * Calculates price for Hiking Pants based on model and size rules.
 *
 * Rules:
 *  - Discovery (Convertible) & Phantom: 24"-38" → ₹1,600 | 40"-44" → ₹1,800
 *  - Tactical: All sizes → ₹1,500
 *  - Sprint: All sizes → ₹1,300
 *  - Cargo (Convertible): All sizes → ₹1,300
 *  - Aqua Pro (Waterproof): All sizes → ₹1,900
 *  - Terra Trek (Convertible): All sizes → ₹1,500
 *  - Nomad (Cargo) & Delta (Convertible): All sizes → ₹1,700
 *  - Aerofit (Convertible): All sizes → ₹1,800
 *  - Mt. Kailash (Snow Pants) & Mt. Trishul (Snow Pants): 28"-38" → ₹2,100 | 40"-44" → ₹2,300
 */
export function getHikingPantsPrice(model: string, size: string): number | undefined {
  const m = model.toLowerCase().trim();
  const sizeNum = parseInt(size.replace(/\D/g, ""), 10);

  if (m.includes("discovery") || m.includes("phantom")) {
    if (isNaN(sizeNum) || sizeNum <= 38) return 1600;
    return 1800;
  }

  if (m.includes("tactical")) return 1500;
  if (m.includes("sprint")) return 1300;
  if (m.includes("cargo (convertible)") || (m.includes("cargo") && m.includes("convertible"))) return 1300;
  if (m.includes("aqua pro")) return 1900;
  if (m.includes("terra trek")) return 1500;
  if (m.includes("nomad") || m.includes("delta")) return 1700;
  if (m.includes("aerofit")) return 1800;

  if (m.includes("kailash") || m.includes("trishul")) {
    if (isNaN(sizeNum) || sizeNum <= 38) return 2100;
    return 2300;
  }

  return undefined;
}

/**
 * Returns auto-calculated price for a category, subcategory, model, and size if matching rules exist.
 */
export function getAutoPrice(
  category: string,
  subcategory: string,
  model?: string,
  size?: string
): number | undefined {
  const cat = category.toLowerCase().trim();
  const sub = subcategory.toLowerCase().trim();

  if ((cat === "hiking gears" || cat === "trekking gear") && sub === "hiking pants" && model && size) {
    return getHikingPantsPrice(model, size);
  }

  return undefined;
}



