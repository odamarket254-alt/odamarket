import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "../lib/supabase";

export async function generateInvoice(order: any) {
  try {
    // Fetch order items
    const { data: items, error } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", order.id);

    if (error) {
      console.error("Error fetching order items for invoice:", error);
      throw error;
    }

    const doc = new jsPDF();
    
    // Set up basic styling
    const margin = 14;
    let currentY = 20;

    
    // Add Logo
    try {
      const res = await fetch('/images/oda-logo.png.jpeg');
      if (!res.ok) throw new Error('Failed to fetch logo');
      const blob = await res.blob();
      const base64data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      // ODA Market logo is 2115x1153 (approx 1.83:1)
      doc.addImage(base64data, 'PNG', margin, 10, 40, 22, undefined, 'FAST');
      currentY = 35;
    } catch (e) {
      console.warn("Could not load logo for invoice", e);
      // Header Text Fallback
      doc.setFontSize(22);
      doc.setTextColor(198, 90, 40); // ODA Market primary color #C65A28
      doc.text("ODA Market", margin, currentY);
      currentY = 28;
    }

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Your Trusted Local Marketplace", margin, currentY);
    
    // Invoice Title
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.text("INVOICE", 150, 25);
    
    currentY += 20;

    // Order Details
    doc.setFontSize(11);
    doc.text(`Order Number: ${order.order_number || order.id}`, margin, currentY);
    doc.text(`Date: ${new Date(order.created_at).toLocaleDateString()}`, margin, currentY + 6);
    doc.text(`Status: ${order.status.toUpperCase()}`, margin, currentY + 12);
    
    if (order.payment_status) {
      doc.text(`Payment: ${order.payment_status.toUpperCase()}`, margin, currentY + 18);
    }
    
    currentY += 30;

    // Table
    const tableColumn = ["Item", "Quantity", "Unit Price (KSh)", "Total (KSh)"];
    const tableRows: any[] = [];

    let calculatedTotal = 0;
    
    if (items && items.length > 0) {
      items.forEach(item => {
        const itemTotal = item.total_price || item.subtotal || (item.unit_price * item.quantity);
        calculatedTotal += itemTotal;
        tableRows.push([
          item.product_name || "Unknown Product",
          item.quantity.toString(),
          item.unit_price.toLocaleString(),
          itemTotal.toLocaleString()
        ]);
      });
    } else {
      tableRows.push(["No items found", "-", "-", "-"]);
    }

    // Add table to PDF
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: currentY,
      theme: 'grid',
      headStyles: { fillColor: [198, 90, 40] },
      margin: { left: margin },
      styles: { fontSize: 10 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
    
    // Totals
    doc.setFontSize(11);
    
    if (order.subtotal) {
      doc.text(`Subtotal: KSh ${order.subtotal.toLocaleString()}`, 130, currentY);
      currentY += 7;
    }
    
    if (order.delivery_fee) {
      doc.text(`Delivery Fee: KSh ${order.delivery_fee.toLocaleString()}`, 130, currentY);
      currentY += 7;
    }
    
    if (order.discount_amount) {
      doc.text(`Discount: -KSh ${order.discount_amount.toLocaleString()}`, 130, currentY);
      currentY += 7;
    }
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    const finalTotal = order.total || calculatedTotal;
    doc.text(`Total: KSh ${finalTotal.toLocaleString()}`, 130, currentY);

    // Footer
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text("Thank you for shopping with ODA Market!", margin, 280);

    // Save PDF
    doc.save(`Invoice_${order.order_number || order.id}.pdf`);
    return true;
  } catch (err) {
    console.error("Error generating invoice:", err);
    return false;
  }
}
