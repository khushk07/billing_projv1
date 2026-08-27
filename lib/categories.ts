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
      "Tshirt",
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

  return undefined;
}

export interface SizePriceRule {
  minSize?: number;
  maxSize?: number;
  sizes?: string[];
  price: number;
}

export interface ModelPricingRule {
  category: string;
  subcategory: string;
  models: string[];
  rules: SizePriceRule[];
}

export const MODEL_PRICING_RULES: ModelPricingRule[] = [
  {
    category: "Hiking Gears",
    subcategory: "Hiking Pants",
    models: ["Discovery (Convertible)", "Phantom"],
    rules: [
      { maxSize: 38, price: 1600 },
      { minSize: 40, price: 1800 },
    ],
  },
  {
    category: "Hiking Gears",
    subcategory: "Hiking Pants",
    models: ["Tactical", "Terra Trek (Convertible)"],
    rules: [{ price: 1500 }],
  },
  {
    category: "Hiking Gears",
    subcategory: "Hiking Pants",
    models: ["Sprint", "Cargo (Convertible)"],
    rules: [{ price: 1300 }],
  },
  {
    category: "Hiking Gears",
    subcategory: "Hiking Pants",
    models: ["Aqua Pro (Waterproof)"],
    rules: [{ price: 1900 }],
  },
  {
    category: "Hiking Gears",
    subcategory: "Hiking Pants",
    models: ["Nomad (Cargo)", "Delta (Convertible)"],
    rules: [{ price: 1700 }],
  },
  {
    category: "Hiking Gears",
    subcategory: "Hiking Pants",
    models: ["Aerofit (Convertible)"],
    rules: [{ price: 1800 }],
  },
  {
    category: "Hiking Gears",
    subcategory: "Hiking Pants",
    models: ["Mt. Kailash (Snow Pants)", "Mt. Trishul (Snow Pants)"],
    rules: [
      { maxSize: 38, price: 2100 },
      { minSize: 40, price: 2300 },
    ],
  },
];

/**
 * Dynamically evaluates pricing for a category, subcategory, model, and size using MODEL_PRICING_RULES.
 */
export function getAutoPrice(
  category: string,
  subcategory: string,
  model?: string,
  size?: string
): number | undefined {
  if (!category || !subcategory || !model) return undefined;

  const cat = category.toLowerCase().trim();
  const sub = subcategory.toLowerCase().trim();
  const mod = model.toLowerCase().trim();
  const sizeNum = size ? parseInt(size.replace(/\D/g, ""), 10) : NaN;

  const ruleGroup = MODEL_PRICING_RULES.find((group) => {
    const isCatMatch = group.category.toLowerCase().trim() === cat || (cat.includes("trekking") && group.category.includes("hiking"));
    const isSubMatch = group.subcategory.toLowerCase().trim() === sub;
    const isModelMatch = group.models.some(
      (m) => m.toLowerCase().trim() === mod || mod.includes(m.toLowerCase().trim()) || m.toLowerCase().trim().includes(mod)
    );
    return isCatMatch && isSubMatch && isModelMatch;
  });

  if (!ruleGroup) return undefined;

  for (const rule of ruleGroup.rules) {
    if (rule.sizes && size && !rule.sizes.includes(size)) continue;
    if (rule.maxSize !== undefined && !isNaN(sizeNum) && sizeNum > rule.maxSize) continue;
    if (rule.minSize !== undefined && !isNaN(sizeNum) && sizeNum < rule.minSize) continue;
    return rule.price;
  }

  return undefined;
}

export function getHikingPantsPrice(model: string, size: string): number | undefined {
  return getAutoPrice("Hiking Gears", "Hiking Pants", model, size);
}




