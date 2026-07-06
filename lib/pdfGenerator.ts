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
      // Convert to JPEG with quality 0.75 for small PDF size
      resolve({
        dataUrl: canvas.toDataURL("image/jpeg", 0.75),
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
  // Initialize with compression enabled
  const doc = new jsPDF({
    compress: true,
  });
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
      doc.addImage(logo.dataUrl, "JPEG", logoX, lineY, size.width, size.height);
      lineY += size.height + 6;
      logoLoaded = true;
    } catch (err) {
      console.warn("[Invoice PDF]", (err as Error).message);
    }
  }

  // Adjust header sizes - Shop Name clean and prominent
  doc.setFontSize(16);
  doc.setTextColor(52, 60, 47);
  doc.setFont("helvetica", "bold");
  const nameLines = doc.splitTextToSize(store.storeName, contentWidth);
  doc.text(nameLines, pageCenter, lineY, { align: "center" });
  lineY += nameLines.length * 6 + 2;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);

  for (const line of store.addressLines) {
    const wrapped = doc.splitTextToSize(line, contentWidth);
    // Highlight franchise owner specifically if it is the first line
    if (line.startsWith("Franchise")) {
      doc.setFont("helvetica", "italic");
      doc.text(wrapped, pageCenter, lineY, { align: "center" });
      doc.setFont("helvetica", "normal");
    } else {
      doc.text(wrapped, pageCenter, lineY, { align: "center" });
    }
    lineY += wrapped.length * 4 + 1;
  }
  doc.text(`Phone: ${store.storePhone}`, pageCenter, lineY, { align: "center" });
  lineY += 5;
  if (store.storeEmail) {
    doc.text(store.storeEmail, pageCenter, lineY, { align: "center" });
    lineY += 5;
  }

  lineY += 4;
  const detailsStartY = lineY;

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`Bill No: ${data.billNumber}`, leftX, detailsStartY);
  doc.text(`Date: ${dateStr}`, leftX, detailsStartY + 6);
  doc.text(`Customer: ${data.customerName}`, leftX, detailsStartY + 12);
  doc.text(`Phone: ${data.customerPhone}`, leftX, detailsStartY + 18);

  // Calculate CGST and SGST splits for table and totals
  const totalGstAmount = data.items.reduce((sum, item) => {
    const pct = item.gstPercentage ?? 0;
    if (pct === 0) return sum;
    // item.lineTotal is the final selling price.
    // basePrice + gstAmount = lineTotal -> basePrice + basePrice*(pct/100) = lineTotal -> basePrice = lineTotal / (1 + pct/100)
    const base = item.lineTotal / (1 + pct / 100);
    const gst = item.lineTotal - base;
    return sum + gst;
  }, 0);

  const hasGst = data.items.some(item => (item.gstPercentage ?? 0) > 0);

  // If any item has GST, we render a detailed tax invoice table
  const tableHeaders = hasGst 
    ? ["Item", "Subcategory", "Qty", "Base Rate", "CGST", "SGST", "Total"]
    : ["Item", "Subcategory", "Qty", "Price", "Total"];

  const tableBody = data.items.map((item) => {
    const pct = item.gstPercentage ?? 0;
    if (pct > 0) {
      const baseTotal = item.lineTotal / (1 + pct / 100);
      const baseRate = baseTotal / item.quantity;
      const gstHalf = pct / 2;
      const gstHalfAmt = (item.lineTotal - baseTotal) / 2;
      return [
        item.name,
        item.subcategory,
        String(item.quantity),
        `Rs. ${baseRate.toFixed(2)}`,
        `${gstHalf}% (Rs. ${gstHalfAmt.toFixed(2)})`,
        `${gstHalf}% (Rs. ${gstHalfAmt.toFixed(2)})`,
        `Rs. ${item.lineTotal.toFixed(2)}`
      ];
    } else {
      return hasGst 
        ? [
            item.name, 
            item.subcategory, 
            String(item.quantity), 
            `Rs. ${item.unitPrice.toFixed(2)}`, 
            "0% (Rs. 0.00)", 
            "0% (Rs. 0.00)", 
            `Rs. ${item.lineTotal.toFixed(2)}`
          ]
        : [
            item.name,
            item.subcategory,
            String(item.quantity),
            `Rs. ${item.unitPrice}`,
            `Rs. ${item.lineTotal}`,
          ];
    }
  });

  autoTable(doc, {
    startY: detailsStartY + 24,
    head: [tableHeaders],
    body: tableBody,
    theme: "striped",
    headStyles: { fillColor: store.brandColorRgb },
  });

  const finalY =
    (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? 120;

  let currentY = finalY + 12;

  if (hasGst) {
    const cgstTotal = totalGstAmount / 2;
    const sgstTotal = totalGstAmount / 2;
    const baseTotalSum = data.grandTotal - totalGstAmount;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Taxable Value (Base Price): Rs. ${baseTotalSum.toFixed(2)}`, leftX, currentY);
    currentY += 5;
    doc.text(`Total CGST Amount: Rs. ${cgstTotal.toFixed(2)}`, leftX, currentY);
    currentY += 5;
    doc.text(`Total SGST Amount: Rs. ${sgstTotal.toFixed(2)}`, leftX, currentY);
    currentY += 8;
  }

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(`Grand Total: Rs. ${data.grandTotal}`, leftX, currentY);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  const footerLines = doc.splitTextToSize(store.footerMessage, contentWidth);
  doc.text(footerLines, pageCenter, currentY + 15, { align: "center" });

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
