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
  const leftColumnX = leftX;
  const rightColumnX = pageW - leftX;

  // 1. Draw Store Logo in the Top-Left corner
  let logoHeight = 0;
  if (store.logoPath) {
    try {
      const logo = await loadImageAsDataUrl(store.logoPath);
      // Fit logo inside a bounding box (e.g. 50mm width, 25mm height)
      const size = fitLogoSize(
        logo.width,
        logo.height,
        50,
        25
      );
      doc.addImage(logo.dataUrl, "JPEG", leftColumnX, lineY, size.width, size.height);
      logoHeight = size.height;
    } catch (err) {
      console.warn("[Invoice PDF]", (err as Error).message);
    }
  }

  // 2. Draw Store Details directly below the logo on the left
  let storeDetailsY = lineY + Math.max(logoHeight, 15) + 6;
  doc.setFontSize(13);
  doc.setTextColor(52, 60, 47);
  doc.setFont("helvetica", "bold");
  doc.text(store.storeName, leftColumnX, storeDetailsY);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  storeDetailsY += 4.5;

  const filteredAddressLines = store.addressLines.filter(
    (line) => !line.toLowerCase().includes("franchise") && !line.toLowerCase().includes("gst no")
  );

  for (const line of filteredAddressLines) {
    doc.text(line, leftColumnX, storeDetailsY);
    storeDetailsY += 4;
  }
  doc.text(`Phone: ${store.storePhone}`, leftColumnX, storeDetailsY);
  storeDetailsY += 4;
  if (store.storeEmail) {
    doc.text(store.storeEmail, leftColumnX, storeDetailsY);
    storeDetailsY += 4;
  }

  // 3. Draw Kothari Ventures & GST on the Right side (Top-Right)
  let rightMetaY = lineY + 6;
  doc.setFontSize(11);
  doc.setTextColor(50, 50, 50);
  doc.setFont("helvetica", "bold");
  doc.text("Kothari Ventures", rightColumnX, rightMetaY, { align: "right" });
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text("GST No.: 27AMRPS9931K1Z0", rightColumnX, rightMetaY + 5, { align: "right" });

  // 4. Update lineY past the tallest side block to draw the line divider
  lineY = Math.max(storeDetailsY, rightMetaY + 12) + 2;

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

  // Aggregate items by HSN for the secondary HSN/SAC summary table
  const hsnSummaryMap: Record<string, { taxableValue: number; rate: number; cgstAmount: number; sgstAmount: number }> = {};

  const tableBody = data.items.map((item, index) => {
    const pct = item.gstPercentage ?? 0;
    const hsnCode = item.hsnCode || (item.subcategory.toLowerCase().includes("shoes") ? "6403" : "6109");
    const quantityStr = `${item.quantity.toFixed(2)} pcs`;
    const rateVal = pct > 0 ? (item.lineTotal / (1 + pct / 100)) / item.quantity : item.unitPrice;
    
    // Track stats for secondary HSN tax summary table
    if (pct > 0) {
      const baseTotal = item.lineTotal / (1 + pct / 100);
      const gstAmt = item.lineTotal - baseTotal;
      if (!hsnSummaryMap[hsnCode]) {
        hsnSummaryMap[hsnCode] = { taxableValue: 0, rate: pct, cgstAmount: 0, sgstAmount: 0 };
      }
      hsnSummaryMap[hsnCode].taxableValue += baseTotal;
      hsnSummaryMap[hsnCode].cgstAmount += gstAmt / 2;
      hsnSummaryMap[hsnCode].sgstAmount += gstAmt / 2;
    }

    if (pct > 0) {
      const baseTotal = item.lineTotal / (1 + pct / 100);
      const gstHalfAmt = (item.lineTotal - baseTotal) / 2;
      
      // Inline rows for CGST and SGST inside the item description cell
      const descriptionLines = [
        item.name,
        `  CGST`,
        `  SGST`
      ];

      const amountLines = [
        `Rs. ${item.lineTotal.toFixed(2)}`,
        `Rs. ${gstHalfAmt.toFixed(2)}`,
        `Rs. ${gstHalfAmt.toFixed(2)}`
      ];

      return [
        String(index + 1),
        descriptionLines.join("\n"),
        hsnCode,
        quantityStr,
        `Rs. ${rateVal.toFixed(2)}`,
        "pcs",
        amountLines.join("\n")
      ];
    } else {
      return [
        String(index + 1),
        item.name,
        hsnCode,
        quantityStr,
        `Rs. ${rateVal.toFixed(2)}`,
        "pcs",
        `Rs. ${item.lineTotal.toFixed(2)}`
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

  // Add subtle border above calculations
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(leftX, finalY + 2, pageW - leftX, finalY + 2);
  finalY += 6;

  // Draw Grand Total Section card
  doc.setFillColor(245, 246, 244);
  doc.rect(leftX, finalY, contentWidth, 14, "F");
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(52, 60, 47);
  doc.text(`GRAND TOTAL: Rs. ${data.grandTotal.toFixed(2)}`, leftX + 4, finalY + 9);
  
  finalY += 20;

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
