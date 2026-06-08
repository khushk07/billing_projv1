import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { STORE_CONFIG } from "@/lib/storeConfig";
import type { BillItem, Sale } from "@/types";
import { format } from "date-fns";

export interface PdfBillData {
  billNumber: string;
  customerName: string;
  customerPhone: string;
  items: BillItem[];
  grandTotal: number;
  createdAt: string;
}

interface LoadedImage {
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Loads an image from /public as base64 for jsPDF.
 * @param url - Public path e.g. /store-logo.png
 */
function loadImageAsDataUrl(url: string): Promise<LoadedImage> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not draw logo"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve({
        dataUrl: canvas.toDataURL("image/png"),
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.onerror = () =>
      reject(
        new Error(
          `Logo not found at ${url}. Check public/store-logo.png and logoPath in lib/storeConfig.ts`
        )
      );
    img.src = url;
  });
}

/**
 * Fits logo inside max box while keeping aspect ratio.
 */
function fitLogoSize(
  naturalW: number,
  naturalH: number,
  maxW: number,
  maxH: number
): { width: number; height: number } {
  const aspect = naturalW / naturalH;
  let width = maxW;
  let height = width / aspect;
  if (height > maxH) {
    height = maxH;
    width = height * aspect;
  }
  return { width, height };
}

/**
 * Generates and downloads a PDF bill using STORE_CONFIG for header/footer/logo.
 * @param data - Bill details for PDF
 */
export async function generateAndDownloadBill(
  data: PdfBillData
): Promise<void> {
  const store = STORE_CONFIG;
  const doc = new jsPDF();
  const dateStr = format(new Date(data.createdAt), "dd MMM yyyy, hh:mm a");
  const pageW = doc.internal.pageSize.getWidth();
  const pageCenter = pageW / 2;
  const leftX = 14;
  const contentWidth = pageW - 28;

  let lineY = 12;
  let logoLoaded = false;

  if (store.logoPath) {
    try {
      const logo = await loadImageAsDataUrl(store.logoPath);
      const size = fitLogoSize(
        logo.width,
        logo.height,
        store.logoSizeMm.width,
        store.logoSizeMm.height
      );
      const logoX = (pageW - size.width) / 2;
      doc.addImage(logo.dataUrl, "PNG", logoX, lineY, size.width, size.height);
      lineY += size.height + 6;
      logoLoaded = true;
    } catch (err) {
      console.warn("[Invoice PDF]", (err as Error).message);
    }
  }

  doc.setFontSize(logoLoaded ? 11 : 18);
  doc.setTextColor(52, 60, 47);
  doc.setFont("helvetica", "bold");
  const nameLines = doc.splitTextToSize(store.storeName, contentWidth);
  doc.text(nameLines, pageCenter, lineY, { align: "center" });
  lineY += nameLines.length * 5 + 2;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);

  for (const line of store.addressLines) {
    const wrapped = doc.splitTextToSize(line, contentWidth);
    doc.text(wrapped, pageCenter, lineY, { align: "center" });
    lineY += wrapped.length * 4 + 1;
  }
  doc.text(store.storePhone, pageCenter, lineY, { align: "center" });
  lineY += 5;
  if (store.storeEmail) {
    doc.text(store.storeEmail, pageCenter, lineY, { align: "center" });
    lineY += 5;
  }

  lineY += 4;
  const detailsStartY = lineY;

  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(`Bill No: ${data.billNumber}`, leftX, detailsStartY);
  doc.text(`Date: ${dateStr}`, leftX, detailsStartY + 7);
  doc.text(`Customer: ${data.customerName}`, leftX, detailsStartY + 14);
  doc.text(`Phone: ${data.customerPhone}`, leftX, detailsStartY + 21);

  autoTable(doc, {
    startY: detailsStartY + 28,
    head: [["Item", "Subcategory", "Qty", "Price", "Total"]],
    body: data.items.map((item) => [
      item.name,
      item.subcategory,
      String(item.quantity),
      `₹${item.unitPrice}`,
      `₹${item.lineTotal}`,
    ]),
    theme: "striped",
    headStyles: { fillColor: store.brandColorRgb },
  });

  const finalY =
    (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? 120;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`Grand Total: ₹${data.grandTotal}`, leftX, finalY + 15);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  const footerLines = doc.splitTextToSize(store.footerMessage, contentWidth);
  doc.text(footerLines, pageCenter, finalY + 30, { align: "center" });

  doc.save(`${data.billNumber}.pdf`);
}

/**
 * Converts a Sale record to PDF bill data shape.
 * @param sale - Completed sale
 * @returns PdfBillData
 */
export function saleToPdfData(sale: Sale): PdfBillData {
  return {
    billNumber: sale.billNumber,
    customerName: sale.customerName,
    customerPhone: sale.customerPhone,
    items: sale.items,
    grandTotal: sale.grandTotal,
    createdAt: sale.createdAt,
  };
}
