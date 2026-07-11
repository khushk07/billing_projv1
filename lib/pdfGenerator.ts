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

      // ── Auto-crop whitespace / transparent padding ──
      const { width, height } = canvas;
      const pixels = ctx.getImageData(0, 0, width, height);
      const d = pixels.data;

      let minX = width, minY = height, maxX = 0, maxY = 0;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const r = d[idx], g = d[idx + 1], b = d[idx + 2], a = d[idx + 3];
          // Consider a pixel "content" if it is not fully transparent and not near-white
          const isContent = a > 30 && !(r > 240 && g > 240 && b > 240);
          if (isContent) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      // Add a small padding around the detected content
      const pad = 4;
      minX = Math.max(0, minX - pad);
      minY = Math.max(0, minY - pad);
      maxX = Math.min(width - 1, maxX + pad);
      maxY = Math.min(height - 1, maxY + pad);

      const cropW = maxX - minX + 1;
      const cropH = maxY - minY + 1;

      // Draw just the cropped region onto a new smaller canvas
      const cropped = document.createElement("canvas");
      cropped.width = cropW;
      cropped.height = cropH;
      const cCtx = cropped.getContext("2d");
      if (!cCtx) {
        reject(new Error("Could not crop logo"));
        return;
      }
      cCtx.drawImage(canvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);

      resolve({
        dataUrl: cropped.toDataURL("image/png"),
        width: cropW,
        height: cropH,
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

  let lineY = 8;
  const leftColumnX = leftX;
  const rightColumnX = pageW - leftX;

  // 1. Draw Store Logo in the Top-Left corner — inline with store name
  let logoW = 0;
  if (store.logoPath) {
    try {
      const logo = await loadImageAsDataUrl(store.logoPath);
      // Whitespace is auto-cropped, so 16mm height = actual logo artwork height
      const aspect = logo.width / logo.height;
      const logoH = 16;
      const rawW = logoH * aspect;
      // Cap max width at 40mm
      const finalW = Math.min(rawW, 40);
      const finalH = finalW / aspect;
      doc.addImage(logo.dataUrl, "PNG", leftColumnX, lineY, finalW, finalH);
      logoW = finalW;
    } catch (err) {
      console.warn("[Invoice PDF]", (err as Error).message);
      logoW = 0;
    }
  }


  // 2. Draw store name to the RIGHT of the logo on the SAME line
  const storeTextX = leftColumnX + logoW + (logoW > 0 ? 3 : 0);
  doc.setFontSize(11);
  doc.setTextColor(52, 60, 47);
  doc.setFont("helvetica", "bold");
  doc.text(store.storeName, storeTextX, lineY + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);

  const filteredAddressLines = store.addressLines.filter(
    (line) => !line.toLowerCase().includes("franchise") && !line.toLowerCase().includes("gst no")
  );

  let storeDetailsY = lineY + 9;
  for (const line of filteredAddressLines) {
    doc.text(line, storeTextX, storeDetailsY);
    storeDetailsY += 3.5;
  }
  doc.text(`Phone: ${store.storePhone}`, storeTextX, storeDetailsY);
  storeDetailsY += 3.5;
  if (store.storeEmail) {
    doc.text(store.storeEmail, storeTextX, storeDetailsY);
    storeDetailsY += 3.5;
  }

  // 3. Draw Kothari Ventures & GST on the Right side (Top-Right)
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  doc.setFont("helvetica", "bold");
  doc.text("Kothari Ventures", rightColumnX, lineY + 2, { align: "right" });
  
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text("GST No.: 27AMRPS9931K1Z0", rightColumnX, lineY + 6.5, { align: "right" });

  // 4. Update lineY past the header block
  lineY = storeDetailsY + 3;

  // Header line separator
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(leftX, lineY, pageW - leftX, lineY);
  lineY += 5;

  const detailsStartY = lineY;

  // Render Invoice metadata (Bill Details Left, Customer Details Right)
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE DETAILS", leftX, detailsStartY);
  doc.setFont("helvetica", "normal");
  doc.text(`Bill No: ${data.billNumber}`, leftX, detailsStartY + 6);
  doc.text(`Date: ${dateStr}`, leftX, detailsStartY + 12);

  const rightMetadataX = pageW - 85;
  doc.setFont("helvetica", "bold");
  doc.text("BILL TO", rightMetadataX, detailsStartY);
  doc.setFont("helvetica", "normal");
  doc.text(`Name: ${data.customerName}`, rightMetadataX, detailsStartY + 6);
  doc.text(`Phone: ${data.customerPhone}`, rightMetadataX, detailsStartY + 12);
  doc.text(`Address: NA`, rightMetadataX, detailsStartY + 18);
  doc.text(`Place of supply - Maharashtra`, rightMetadataX, detailsStartY + 24);
  doc.text(`State Code - 27`, rightMetadataX, detailsStartY + 30);

  // Calculate CGST and SGST splits for table and totals
  const totalGstAmount = data.items.reduce((sum, item) => {
    const pct = item.gstPercentage ?? 0;
    if (pct === 0) return sum;
    const base = item.lineTotal / (1 + pct / 100);
    const gst = item.lineTotal - base;
    return sum + gst;
  }, 0);

  const hasGst = data.items.some(item => (item.gstPercentage ?? 0) > 0);

  // Main items table: columns as per reference invoice format
  const tableHeaders = ["SI\nNo.", "Description of Goods", "HSN/SAC", "Quantity", "Rate", "per", "Amount"];

  // Calculate overall calculations
  const baseTotalSum = data.items.reduce((sum, item) => {
    const pct = item.gstPercentage ?? 0;
    const base = pct > 0 ? (item.lineTotal / (1 + pct / 100)) : item.lineTotal;
    return sum + base;
  }, 0);

  const totalCgst = totalGstAmount / 2;
  const totalSgst = totalGstAmount / 2;
  
  // Calculate rounding offset
  const rawGrandTotal = baseTotalSum + totalGstAmount;
  const roundedGrandTotal = Math.round(rawGrandTotal);
  const roundingOffset = roundedGrandTotal - rawGrandTotal;

  // Aggregate items by HSN for the secondary HSN/SAC summary table
  const hsnSummaryMap: Record<string, { taxableValue: number; rate: number; cgstAmount: number; sgstAmount: number }> = {};

  // Formulate rows
  const tableBody: any[] = [];
  
  data.items.forEach((item, index) => {
    const pct = item.gstPercentage ?? 0;
    const hsnCode = item.hsnCode || (item.subcategory.toLowerCase().includes("shoes") ? "6403" : "6109");
    const quantityStr = `${item.quantity.toFixed(2)} pcs`;
    const baseRate = pct > 0 ? (item.lineTotal / (1 + pct / 100)) / item.quantity : item.unitPrice;
    const baseLineTotal = pct > 0 ? (item.lineTotal / (1 + pct / 100)) : item.lineTotal;

    // Track stats for secondary HSN tax summary table
    if (pct > 0) {
      const gstAmt = item.lineTotal - baseLineTotal;
      if (!hsnSummaryMap[hsnCode]) {
        hsnSummaryMap[hsnCode] = { taxableValue: 0, rate: pct, cgstAmount: 0, sgstAmount: 0 };
      }
      hsnSummaryMap[hsnCode].taxableValue += baseLineTotal;
      hsnSummaryMap[hsnCode].cgstAmount += gstAmt / 2;
      hsnSummaryMap[hsnCode].sgstAmount += gstAmt / 2;
    }

    // Main item row (shows HSN, Qty, Rate, per, Base Amount)
    tableBody.push([
      String(index + 1),
      item.name,
      hsnCode,
      quantityStr,
      baseRate.toFixed(2),
      "pcs",
      baseLineTotal.toFixed(2)
    ]);
  });

  // Append empty spacer row or rows for CGST / SGST / Rounding details matching reference layout
  if (hasGst) {
    tableBody.push([
      "",
      "\n\n\n\n                       CGST\n                       SGST\nLess :             Rounding Off",
      "",
      "",
      "",
      "",
      `\n\n\n\n${totalCgst.toFixed(2)}\n${totalSgst.toFixed(2)}\n${roundingOffset < 0 ? "(-)" : "(+)"}${Math.abs(roundingOffset).toFixed(2)}`
    ]);
  } else if (Math.abs(roundingOffset) > 0.001) {
    tableBody.push([
      "",
      "\nLess :             Rounding Off",
      "",
      "",
      "",
      "",
      `\n${roundingOffset < 0 ? "(-)" : "(+)"}${Math.abs(roundingOffset).toFixed(2)}`
    ]);
  }

  // Append final total row inside the table
  const totalQuantity = data.items.reduce((sum, item) => sum + item.quantity, 0);
  tableBody.push([
    "",
    "Total",
    "",
    `${totalQuantity.toFixed(2)} pcs`,
    "",
    "",
    `Rs. ${roundedGrandTotal.toFixed(2)}`
  ]);

  autoTable(doc, {
    startY: detailsStartY + 38,
    head: [tableHeaders],
    body: tableBody,
    theme: "striped",
    headStyles: { fillColor: store.brandColorRgb, textColor: [255, 255, 255], fontStyle: "bold" },
    styles: { fontSize: 8.5 },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { fontStyle: "bold", cellWidth: 70 },
      2: { cellWidth: 20 },
      3: { cellWidth: 20 },
      4: { cellWidth: 22 },
      5: { cellWidth: 12 },
      6: { cellWidth: 28 }
    }
  });

  let finalY =
    (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? 120;

  finalY += 10;

  // 5. Draw HSN/SAC Tax Summary Table at the bottom if hasGst
  if (hasGst && Object.keys(hsnSummaryMap).length > 0) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(50, 50, 50);
    doc.text("Tax Summary Breakdown (HSN/SAC summary):", leftX, finalY);
    finalY += 4;

    const summaryHeaders = ["HSN/SAC", "Taxable Value", "CGST Rate", "CGST Amount", "SGST Rate", "SGST Amount", "Total Tax"];
    const summaryBody = Object.entries(hsnSummaryMap).map(([hsn, data]) => {
      const totalTax = data.cgstAmount + data.sgstAmount;
      const cgstRate = `${(data.rate / 2)}%`;
      const sgstRate = `${(data.rate / 2)}%`;
      return [
        hsn,
        `Rs. ${data.taxableValue.toFixed(2)}`,
        cgstRate,
        `Rs. ${data.cgstAmount.toFixed(2)}`,
        sgstRate,
        `Rs. ${data.sgstAmount.toFixed(2)}`,
        `Rs. ${totalTax.toFixed(2)}`
      ];
    });

    // Calculate totals for HSN table footer
    const totalsRow = [
      "Total",
      `Rs. ${Object.values(hsnSummaryMap).reduce((sum, d) => sum + d.taxableValue, 0).toFixed(2)}`,
      "",
      `Rs. ${Object.values(hsnSummaryMap).reduce((sum, d) => sum + d.cgstAmount, 0).toFixed(2)}`,
      "",
      `Rs. ${Object.values(hsnSummaryMap).reduce((sum, d) => sum + d.sgstAmount, 0).toFixed(2)}`,
      `Rs. ${Object.values(hsnSummaryMap).reduce((sum, d) => sum + d.cgstAmount + d.sgstAmount, 0).toFixed(2)}`
    ];

    summaryBody.push(totalsRow);

    autoTable(doc, {
      startY: finalY,
      head: [summaryHeaders],
      body: summaryBody,
      theme: "striped",
      headStyles: { fillColor: [110, 110, 110], textColor: [255, 255, 255] },
      styles: { fontSize: 7.5 },
    });

    finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? (finalY + 30);
    finalY += 10;
  }

  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(50, 50, 50);
  doc.text("Delivery mode: Counter Sale", leftX, finalY);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  const footerLines = doc.splitTextToSize(store.footerMessage, contentWidth);
  doc.text(footerLines, pageCenter, finalY + 12, { align: "center" });

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
