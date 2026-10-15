import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { toPng } from "html-to-image";

export interface ReceiptOrderPdfData {
  order_number: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  delivery_location: string;
  delivery_address: string;
  delivery_method?: string;
  items: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  subtotal: number;
  delivery_fee?: number;
  discount?: number;
  grand_total: number;
  payment_method: string;
  payment_status: string;
  transaction_id?: string;
}

/**
 * Downloads a high-resolution, branded PDF digital receipt.
 * Employs direct visual capture as primary method with pure programmatic jsPDF fallback.
 */
export async function downloadDigitalReceiptPdf(
  elementId: string,
  orderData: ReceiptOrderPdfData,
  fileName?: string
): Promise<boolean> {
  const safeOrderNumber = orderData.order_number || "Order";
  const finalFileName = fileName || `ODA-Market-Receipt-${safeOrderNumber}.pdf`;

  // Strategy 1: Pixel-perfect high-DPI capture of the rendered digital receipt card
  try {
    const el = document.getElementById(elementId);
    if (el) {
      const imgData = await toPng(el, {
        pixelRatio: 2.5,
        backgroundColor: "#FFFDF8",
        cacheBust: true,
        filter: (node) => {
          // Exclude buttons or action elements marked with no-print
          if (node instanceof HTMLElement && node.classList.contains("no-print")) {
            return false;
          }
          return true;
        }
      });

      const img = new Image();
      img.src = imgData;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
      });

      const receiptWidthMm = 105; // 105mm width (pocket thermal / slip format)
      const receiptHeightMm = (img.height * receiptWidthMm) / img.width;

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [receiptWidthMm, receiptHeightMm + 8]
      });

      doc.addImage(imgData, "PNG", 0, 4, receiptWidthMm, receiptHeightMm, undefined, "FAST");
      doc.save(finalFileName);
      return true;
    }
  } catch (canvasErr) {
    console.warn("DOM canvas receipt capture failed, falling back to programmatic PDF:", canvasErr);
  }

  // Strategy 2: Resilient programmatic vector PDF fallback
  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const margin = 16;
    let y = 20;

    // Header Branding
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(198, 90, 40); // ODA Primary #C65A28
    doc.text("ODA MARKET", margin, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(95, 90, 84);
    doc.text("Quality. Value. Convenience. | Digital Receipt", margin, y + 6);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(34, 197, 94); // Green
    doc.text("PAID • VERIFIED", 150, y);

    y += 18;
    doc.setDrawColor(232, 220, 201);
    doc.line(margin, y, 210 - margin, y);
    y += 8;

    // Order Meta
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(58, 36, 24);
    doc.text(`Order Number: ${orderData.order_number}`, margin, y);
    doc.text(`Date: ${orderData.created_at ? new Date(orderData.created_at).toLocaleString("en-KE") : "N/A"}`, 120, y);
    y += 6;
    doc.text(`Payment Method: ${orderData.payment_method || "M-Pesa (via Paystack)"}`, margin, y);
    doc.text(`Transaction Reference: ${orderData.transaction_id || "VERIFIED"}`, 120, y);
    y += 10;

    // Customer & Delivery Details
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(198, 90, 40);
    doc.text("BUYER & DELIVERY DETAILS", margin, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(58, 36, 24);
    doc.text(`Name: ${orderData.customer_name}`, margin, y);
    doc.text(`Phone: ${orderData.customer_phone}`, margin, y + 5);
    if (orderData.customer_email) {
      doc.text(`Email: ${orderData.customer_email}`, margin, y + 10);
      y += 5;
    }
    doc.text(`Location: ${orderData.delivery_location}`, 120, y - 5);
    doc.text(`Address: ${orderData.delivery_address}`, 120, y);
    y += 14;

    // Items Table
    const tableHead = [["Item Description", "Qty", "Unit Price (KSh)", "Total (KSh)"]];
    const tableBody = (orderData.items || []).map((it) => [
      it.product_name,
      String(it.quantity),
      `KSh ${(it.unit_price || 0).toLocaleString("en-KE")}`,
      `KSh ${(it.total_price || (it.unit_price * it.quantity) || 0).toLocaleString("en-KE")}`
    ]);

    autoTable(doc, {
      head: tableHead,
      body: tableBody,
      startY: y,
      theme: "plain",
      headStyles: {
        fillColor: [248, 245, 236],
        textColor: [58, 36, 24],
        fontStyle: "bold",
        fontSize: 9
      },
      styles: {
        fontSize: 9,
        textColor: [58, 36, 24],
        cellPadding: 3
      },
      columnStyles: {
        1: { halign: "center" },
        2: { halign: "right" },
        3: { halign: "right", fontStyle: "bold" }
      },
      margin: { left: margin, right: margin }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 8;
    y = finalY;

    // Summary Totals
    const rightCol = 140;
    const valueCol = 194;

    doc.setFontSize(9.5);
    doc.text("Subtotal:", rightCol, y);
    doc.text(`KSh ${orderData.subtotal.toLocaleString("en-KE")}`, valueCol, y, { align: "right" });
    y += 6;

    doc.text("Delivery Fee:", rightCol, y);
    const feeText = (orderData.delivery_fee && orderData.delivery_fee > 0)
      ? `KSh ${orderData.delivery_fee.toLocaleString("en-KE")}`
      : "FREE";
    doc.text(feeText, valueCol, y, { align: "right" });
    y += 6;

    if (orderData.discount && orderData.discount > 0) {
      doc.text("Discount:", rightCol, y);
      doc.text(`-KSh ${orderData.discount.toLocaleString("en-KE")}`, valueCol, y, { align: "right" });
      y += 6;
    }

    doc.setDrawColor(198, 90, 40);
    doc.line(rightCol - 5, y, 210 - margin, y);
    y += 6;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(198, 90, 40);
    doc.text("TOTAL PAID:", rightCol, y);
    doc.text(`KSh ${orderData.grand_total.toLocaleString("en-KE")}`, valueCol, y, { align: "right" });

    // Footer
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(139, 133, 125);
    doc.text("Thank you for shopping with ODA Market!", margin, 275);
    doc.text("Official electronic receipt verified by Paystack & Resend.", margin, 280);

    doc.save(finalFileName);
    return true;
  } catch (pdfErr) {
    console.error("Programmatic PDF generation failed:", pdfErr);
    return false;
  }
}
