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

  // 1. Draw logo in the top-left corner
  if (store.logoPath) {
    try {
      const logo = await loadImageAsDataUrl(store.logoPath);
      // Fit logo to left-aligned bounding box (e.g. 50mm max width/height)
      const size = fitLogoSize(
        logo.width,
        logo.height,
        50,
        35
      );
      doc.addImage(logo.dataUrl, "JPEG", leftX, lineY, size.width, size.height);
      logoLoaded = true;
    } catch (err) {
      console.warn("[Invoice PDF]", (err as Error).message);
    }
  }

  // 2. Draw "Kothari Ventures" and "GST No." in the top-right corner
  const topRightX = pageW - leftX;
  doc.setFontSize(11);
  doc.setTextColor(50, 50, 50);
  doc.setFont("helvetica", "bold");
  doc.text("Kothari Ventures", topRightX, lineY + 6, { align: "right" });
  
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text("GST No.: 27AMRPS9931K1Z0", topRightX, lineY + 12, { align: "right" });

  // 3. Move lineY down past the top header block (logo is ~35mm tall + margin)
  lineY += 42;

  // 4. Draw Shop Name and Address details centered below the header block
  doc.setFontSize(14);
  doc.setTextColor(52, 60, 47);
  doc.setFont("helvetica", "bold");
  const nameLines = doc.splitTextToSize(store.storeName, contentWidth);
  doc.text(nameLines, pageCenter, lineY, { align: "center" });
  lineY += nameLines.length * 5 + 2;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);

  // Address lines (Filter out the GST / franchise info since we printed Kothari Ventures + GST on top right)
  const filteredAddressLines = store.addressLines.filter(
    (line) => !line.toLowerCase().includes("franchise") && !line.toLowerCase().includes("gst no")
  );

  for (const line of filteredAddressLines) {
    const wrapped = doc.splitTextToSize(line, contentWidth);
    doc.text(wrapped, pageCenter, lineY, { align: "center" });
    lineY += wrapped.length * 4 + 1;
  }
  doc.text(`Phone: ${store.storePhone}`, pageCenter, lineY, { align: "center" });
  lineY += 5;
  if (store.storeEmail) {
    doc.text(store.storeEmail, pageCenter, lineY, { align: "center" });
    lineY += 5;
  }

  lineY += 2;
  // elegant header line separator
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(leftX, lineY, pageW - leftX, lineY);
  lineY += 8;

  const detailsStartY = lineY;

  // Render Invoice metadata (Bill Details Left, Customer Details Right)
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE DETAILS", leftX, detailsStartY);
  doc.setFont("helvetica", "normal");
  doc.text(`Bill No: ${data.billNumber}`, leftX, detailsStartY + 6);
  doc.text(`Date: ${dateStr}`, leftX, detailsStartY + 12);

  const rightColumnX = pageW - 85;
  doc.setFont("helvetica", "bold");
  doc.text("BILL TO", rightColumnX, detailsStartY);
  doc.setFont("helvetica", "normal");
  doc.text(`Name: ${data.customerName}`, rightColumnX, detailsStartY + 6);
  doc.text(`Phone: ${data.customerPhone}`, rightColumnX, detailsStartY + 12);
  doc.text(`Address: NA`, rightColumnX, detailsStartY + 18);
  doc.text(`Place of supply - Maharashtra`, rightColumnX, detailsStartY + 24);
  doc.text(`State Code - 27`, rightColumnX, detailsStartY + 30);

  // Calculate CGST and SGST splits for table and totals
  const totalGstAmount = data.items.reduce((sum, item) => {
    const pct = item.gstPercentage ?? 0;
    if (pct === 0) return sum;
    const base = item.lineTotal / (1 + pct / 100);
    const gst = item.lineTotal - base;
    return sum + gst;
  }, 0);

  const hasGst = data.items.some(item => (item.gstPercentage ?? 0) > 0);

  // If any item has GST, we render a detailed tax invoice table
  // Columns: Item, Subcategory, Qty, HSN, Base Rate, CGST, SGST, Total
  const tableHeaders = hasGst 
    ? ["Item", "Subcategory", "Qty", "HSN", "Base Rate", "CGST", "SGST", "Total"]
    : ["Item", "Subcategory", "Qty", "Price", "Total"];

  const tableBody = data.items.map((item) => {
    const pct = item.gstPercentage ?? 0;
    // Read dynamic item.hsnCode if available, otherwise default to static subcategory fallback
    const hsnCode = item.hsnCode || (item.subcategory.toLowerCase().includes("shoes") ? "6403" : "6109");
    
    if (pct > 0) {
      const baseTotal = item.lineTotal / (1 + pct / 100);
      const baseRate = baseTotal / item.quantity;
      const gstHalf = pct / 2;
      const gstHalfAmt = (item.lineTotal - baseTotal) / 2;
      return [
        item.name,
        item.subcategory,
        String(item.quantity),
        hsnCode,
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
            hsnCode,
            `Rs. ${item.unitPrice.toFixed(2)}`, 
            "0% (Rs. 0.00)", 
            "0% (Rs. 0.00)", 
            `Rs. ${item.lineTotal.toFixed(2)}`
          ]
        : [
            item.name,
            item.subcategory,
            String(item.quantity),
            `Rs. ${item.unitPrice.toFixed(2)}`,
            `Rs. ${item.lineTotal.toFixed(2)}`,
          ];
    }
  });

  autoTable(doc, {
    startY: detailsStartY + 38,
    head: [tableHeaders],
    body: tableBody,
    theme: "striped",
    headStyles: { fillColor: store.brandColorRgb, textColor: [255, 255, 255], fontStyle: "bold" },
    styles: { fontSize: 8.5 },
    columnStyles: hasGst ? {
      0: { fontStyle: "bold", cellWidth: 35 },
      1: { cellWidth: 25 },
      2: { cellWidth: 10 },
      3: { cellWidth: 12 },
      4: { cellWidth: 22 },
      5: { cellWidth: 30 },
      6: { cellWidth: 30 },
      7: { cellWidth: 20 }
    } : {
      0: { fontStyle: "bold" }
    }
  });

  const finalY =
    (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? 120;

  let currentY = finalY + 12;

  // Add subtle border above calculations
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.5);
  doc.line(leftX, currentY - 6, pageW - leftX, currentY - 6);

  if (hasGst) {
    const cgstTotal = totalGstAmount / 2;
    const sgstTotal = totalGstAmount / 2;
    const baseTotalSum = data.grandTotal - totalGstAmount;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    
    doc.text("Tax Summary Breakdown:", leftX, currentY);
    currentY += 5;
    
    // CGST/SGST details columns
    doc.text(`Taxable Amount (Base Price): Rs. ${baseTotalSum.toFixed(2)}`, leftX + 4, currentY);
    currentY += 4.5;
    doc.text(`Total CGST: Rs. ${cgstTotal.toFixed(2)}`, leftX + 4, currentY);
    currentY += 4.5;
    doc.text(`Total SGST: Rs. ${sgstTotal.toFixed(2)}`, leftX + 4, currentY);
    currentY += 10;
  }

  // Draw a highlighted Grand Total Section card
  doc.setFillColor(245, 246, 244);
  doc.rect(leftX, currentY - 6, contentWidth, 14, "F");
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(52, 60, 47);
  doc.text(`GRAND TOTAL: Rs. ${data.grandTotal.toFixed(2)}`, leftX + 4, currentY + 3);

  currentY += 16;
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(50, 50, 50);
  doc.text("Delivery mode: Counter Sale", leftX, currentY);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  const footerLines = doc.splitTextToSize(store.footerMessage, contentWidth);
  doc.text(footerLines, pageCenter, currentY + 12, { align: "center" });

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
