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
