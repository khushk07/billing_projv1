/**
 * Store details shown on PDF invoices (and can be reused elsewhere).
 * Edit this file to customize your bills — no need to touch pdfGenerator.ts.
 */

export interface StoreConfig {
  /** Short name for app icon / home screen (max ~12 chars works best) */
  appShortName: string;
  /** PWA / browser theme colour (hex) */
  themeColor: string;
  /** Shop name on the bill header */
  storeName: string;
  /** Lines under the name (address, city, landmark, etc.) */
  addressLines: string[];
  /** Store phone shown on the bill (with country code if you want) */
  storePhone: string;
  /** Optional: email or GST note — set to "" to hide */
  storeEmail: string;
  /** Footer message at the bottom of every bill */
  footerMessage: string;
  /**
   * Logo file in /public folder, e.g. "/store-logo.png"
   * Set to "" to hide logo. Use PNG or JPG. Square-ish works best (~200×200px).
   */
  logoPath: string;
  /** Logo width & height on PDF in mm */
  logoSizeMm: { width: number; height: number };
  /** Table header colour [R, G, B] — matches app green by default */
  brandColorRgb: [number, number, number];
}

export const STORE_CONFIG: StoreConfig = {
  appShortName: "Jainsons",
  themeColor: "#343c2f",
  storeName: "Jainsons Adventure Gears and Rainwear",
  addressLines: [
    "Franchise Owner: Kothari Ventures | GST No.: 27AMRPS9931K1Z0",
    "Shop No. 16, Raj Shivam CHSL, Shiv Vallab Cross Road, Ashok Van",
    "Dahisar East, Mumbai, Maharashtra 400068",
  ],
  storePhone: "+91 8655493340 / 8369132898",
  storeEmail: "", // e.g. "hello@summitgear.in" or leave empty
  footerMessage:
    "Thank you for shopping with Jainsons Adventure Gears and Rainwear. See you on the trails!",
  logoPath: "/store-logo.png", // file: public/store-logo.png → served at /store-logo.png
  /** Max logo box on PDF (wide banners: use ~75×22; square logos: ~28×28; enlarged: ~190x120) */
  logoSizeMm: { width: 114, height: 72 },
  brandColorRgb: [92, 109, 78],
};
