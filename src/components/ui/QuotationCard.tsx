import React, { useState, useEffect } from "react";
import { Button } from "./Button";
import { Input } from "./Input";
import { Download, Send, Check, Plus, Trash2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface QuotationProps {
  initialContent: string;
  onSend?: (quotationHtml: string) => void;
}

export function QuotationCard({ initialContent, onSend }: QuotationProps) {
  // Simple parser for the markdown quotation
  const [supplier, setSupplier] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [quotationNo, setQuotationNo] = useState(`QT-${Math.floor(Math.random() * 10000)}`);
  const [date, setDate] = useState(new Date().toLocaleDateString());
  const [buyer, setBuyer] = useState("");
  const [rfqRef, setRfqRef] = useState("");
  
  const [deliveryTerms, setDeliveryTerms] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [validity, setValidity] = useState("");
  const [warranty, setWarranty] = useState("");
  const [notes, setNotes] = useState("");
  
  const [subtotal, setSubtotal] = useState("");
  const [vat, setVat] = useState("");
  const [deliveryCharges, setDeliveryCharges] = useState("");
  const [grandTotal, setGrandTotal] = useState("");

  const [items, setItems] = useState<{no: string, product: string, desc: string, qty: string, unit: string, price: string, total: string}[]>([]);
  const [isSent, setIsSent] = useState(false);

  // Derived totals instead of useEffect
  const calculatedSubtotal = items.reduce((acc, it) => acc + (parseFloat(it.total) || 0), 0);
  const vatAmount = vat.includes('%') 
    ? calculatedSubtotal * ((parseFloat(vat) || 0) / 100) 
    : (parseFloat(vat) || 0);
  const calculatedGrandTotal = calculatedSubtotal + vatAmount + (parseFloat(deliveryCharges) || 0);

  // Sync derived totals with manual input if needed, or simply use them for display
  // We'll update the values on render if they are strictly derived. 
  // However, since they were state variables before, let's keep the manual inputs but overwrite them when initialContent changes.
  
  useEffect(() => {
    // Parse the markdown
    const lines = initialContent.split("\n");
    let inItems = false;
    const parsedItems = [];

    for (const line of lines) {
      if (line.startsWith("**Supplier:**")) setSupplier(line.replace("**Supplier:**", "").trim());
      if (line.startsWith("**Address:**")) setAddress(line.replace("**Address:**", "").replace("To be confirmed", "").trim());
      if (line.startsWith("**Phone:**")) setPhone(line.replace("**Phone:**", "").replace("To be confirmed", "").trim());
      if (line.startsWith("**Email:**")) setEmail(line.replace("**Email:**", "").replace("To be confirmed", "").trim());
      if (line.startsWith("**Website:**")) setWebsite(line.replace("**Website:**", "").replace("To be confirmed", "").trim());
      
      if (line.startsWith("**Quotation No.:**")) {
        const no = line.replace("**Quotation No.:**", "").trim();
        if (no && no !== "Auto Generate") setQuotationNo(no);
      }
      if (line.startsWith("**Date:**")) {
        const d = line.replace("**Date:**", "").trim();
        if (d && d !== "Today's Date") setDate(d);
      }
      if (line.startsWith("**Buyer:**")) setBuyer(line.replace("**Buyer:**", "").replace("[If available]", "").trim());
      if (line.startsWith("**RFQ Reference:**")) setRfqRef(line.replace("**RFQ Reference:**", "").replace("[If available]", "").trim());
      
      if (line.startsWith("**Subtotal:**")) setSubtotal(line.replace("**Subtotal:**", "").replace(/[_]/g, "").trim());
      if (line.startsWith("**VAT:**")) setVat(line.replace("**VAT:**", "").replace(/[_]/g, "").trim());
      if (line.startsWith("**Delivery Charges:**")) setDeliveryCharges(line.replace("**Delivery Charges:**", "").replace(/[_]/g, "").trim());
      if (line.startsWith("**Grand Total:**")) setGrandTotal(line.replace("**Grand Total:**", "").replace(/[_]/g, "").trim());
      
      if (line.startsWith("**Delivery Terms:**")) setDeliveryTerms(line.replace("**Delivery Terms:**", "").replace("To be confirmed", "").trim());
      if (line.startsWith("**Payment Terms:**")) setPaymentTerms(line.replace("**Payment Terms:**", "").replace(/[_]/g, "").trim());
      if (line.startsWith("**Validity:**")) setValidity(line.replace("**Validity:**", "").trim());
      if (line.startsWith("**Warranty:**")) setWarranty(line.replace("**Warranty:**", "").trim());
      if (line.startsWith("**Notes:**")) setNotes(line.replace("**Notes:**", "").trim());

      if (line.startsWith("## Items")) {
        inItems = true;
        continue;
      }
      if (inItems && (line.startsWith("## ") || line.startsWith("**Subtotal"))) {
        inItems = false;
      }

      if (inItems && line.startsWith("|") && !line.includes("No. | Product") && !line.includes("---|---")) {
        const parts = line.split("|").map(p => p.trim());
        if (parts.length >= 8) {
          parsedItems.push({
            no: parts[1],
            product: parts[2],
            desc: parts[3],
            qty: parts[4].replace("To be confirmed", "").trim() || "",
            unit: parts[5],
            price: parts[6].replace(/[_]/g, "").trim() || "",
            total: parts[7].replace(/[_]/g, "").trim() || "",
          });
        }
      }
    }

    if (parsedItems.length > 0) {
      setItems(parsedItems);
    } else {
      setItems([{no: "1", product: "", desc: "", qty: "", unit: "pcs", price: "", total: ""}]);
    }
  }, [initialContent]);

  const handleExportPDF = async () => {
    const element = document.getElementById("quotation-export-area");
    if (!element) return;
    
    const buttonsToHide = element.querySelectorAll('.no-export');
    buttonsToHide.forEach(el => (el as HTMLElement).style.display = 'none');
    
    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Quotation_${quotationNo || "Draft"}.pdf`);
    } catch (e) {
      console.error("PDF export failed", e);
    } finally {
      buttonsToHide.forEach(el => (el as HTMLElement).style.display = '');
    }
  };

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'price' || field === 'qty') {
      const q = parseFloat(newItems[index].qty);
      const p = parseFloat(newItems[index].price);
      if (!isNaN(q) && !isNaN(p)) {
        newItems[index].total = (q * p).toFixed(2);
      }
    }
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, {no: String(items.length + 1), product: "", desc: "", qty: "", unit: "pcs", price: "", total: ""}]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = [...items];
      newItems.splice(index, 1);
      // Update numbers
      newItems.forEach((it, idx) => it.no = String(idx + 1));
      setItems(newItems);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-950 border border-border rounded-xl shadow-sm overflow-hidden my-4 max-w-full font-sans">
      <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center">
        <h3 className="font-semibold text-lg">Interactive Quotation</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-1">
            <Download className="w-4 h-4" /> Export PDF
          </Button>
          <Button size="sm" onClick={() => setIsSent(true)} disabled={isSent} className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white">
            {isSent ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
            {isSent ? "Sent" : "Send Quotation"}
          </Button>
        </div>
      </div>
      
      <div className="p-6 md:p-8 overflow-x-auto" id="quotation-export-area">
        <div className="min-w-[800px] max-w-4xl mx-auto bg-white dark:bg-zinc-950">
          
          {/* Header Row: Company vs Quote Info */}
          <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-gray-800 dark:border-gray-200">
            <div className="w-1/2 pr-4 space-y-2">
              <Input 
                value={supplier} 
                onChange={e => setSupplier(e.target.value)} 
                placeholder="Supplier Company Name"
                className="h-10 text-xl font-bold bg-transparent border-dashed"
              />
              <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Company Address" className="h-8 text-sm bg-transparent border-dashed" />
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone Number" className="h-8 text-sm bg-transparent border-dashed" />
              <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email Address" className="h-8 text-sm bg-transparent border-dashed" />
              <Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="Website" className="h-8 text-sm bg-transparent border-dashed" />
            </div>
            
            <div className="w-1/3 space-y-2 text-right">
              <h1 className="text-4xl font-black text-gray-900 dark:text-gray-100 tracking-tight uppercase mb-4">QUOTATION</h1>
              <div className="flex justify-end items-center gap-2">
                <span className="text-sm font-semibold text-gray-500 w-24">Quote No:</span>
                <Input value={quotationNo} onChange={e => setQuotationNo(e.target.value)} className="h-8 text-sm text-right bg-transparent border-dashed w-32 font-medium" />
              </div>
              <div className="flex justify-end items-center gap-2">
                <span className="text-sm font-semibold text-gray-500 w-24">Date:</span>
                <Input value={date} onChange={e => setDate(e.target.value)} className="h-8 text-sm text-right bg-transparent border-dashed w-32 font-medium" />
              </div>
            </div>
          </div>

          {/* Client Info */}
          <div className="mb-8 grid grid-cols-2 gap-8">
            <div>
              <div className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2 uppercase tracking-wide">Quotation For:</div>
              <Input 
                value={buyer} 
                onChange={e => setBuyer(e.target.value)} 
                placeholder="Buyer Name / Company"
                className="h-10 text-base font-medium bg-transparent border-dashed max-w-full"
              />
            </div>
            <div>
              <div className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2 uppercase tracking-wide">Reference:</div>
              <Input 
                value={rfqRef} 
                onChange={e => setRfqRef(e.target.value)} 
                placeholder="RFQ Reference Number"
                className="h-10 text-base bg-transparent border-dashed max-w-full"
              />
            </div>
          </div>

          {/* Table */}
          <div className="mb-6">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-zinc-900">
                  <th className="text-left py-3 px-2 font-bold text-gray-800 dark:text-gray-200 w-[5%] border border-gray-300 dark:border-zinc-700">No.</th>
                  <th className="text-left py-3 px-2 font-bold text-gray-800 dark:text-gray-200 w-[20%] border border-gray-300 dark:border-zinc-700">Product</th>
                  <th className="text-left py-3 px-2 font-bold text-gray-800 dark:text-gray-200 w-[25%] border border-gray-300 dark:border-zinc-700">Description</th>
                  <th className="text-center py-3 px-2 font-bold text-gray-800 dark:text-gray-200 w-[10%] border border-gray-300 dark:border-zinc-700">Qty</th>
                  <th className="text-center py-3 px-2 font-bold text-gray-800 dark:text-gray-200 w-[10%] border border-gray-300 dark:border-zinc-700">Unit</th>
                  <th className="text-right py-3 px-2 font-bold text-gray-800 dark:text-gray-200 w-[15%] border border-gray-300 dark:border-zinc-700">Unit Price</th>
                  <th className="text-right py-3 px-2 font-bold text-gray-800 dark:text-gray-200 w-[15%] border border-gray-300 dark:border-zinc-700">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="py-2 px-1 border border-gray-300 dark:border-zinc-700 text-center font-medium">{it.no}</td>
                    <td className="py-1 px-1 border border-gray-300 dark:border-zinc-700">
                      <Input value={it.product} onChange={e => updateItem(idx, 'product', e.target.value)} className="h-8 text-sm bg-transparent border-dashed rounded-none focus-visible:ring-0 px-1" placeholder="Product name" />
                    </td>
                    <td className="py-1 px-1 border border-gray-300 dark:border-zinc-700">
                      <Input value={it.desc} onChange={e => updateItem(idx, 'desc', e.target.value)} className="h-8 text-sm bg-transparent border-dashed rounded-none focus-visible:ring-0 px-1" placeholder="Specs/Description" />
                    </td>
                    <td className="py-1 px-1 border border-gray-300 dark:border-zinc-700">
                      <Input value={it.qty} onChange={e => updateItem(idx, 'qty', e.target.value)} className="h-8 text-sm text-center bg-transparent border-dashed rounded-none focus-visible:ring-0 px-1" placeholder="0" />
                    </td>
                    <td className="py-1 px-1 border border-gray-300 dark:border-zinc-700">
                      <Input value={it.unit} onChange={e => updateItem(idx, 'unit', e.target.value)} className="h-8 text-sm text-center bg-transparent border-dashed rounded-none focus-visible:ring-0 px-1" placeholder="pcs" />
                    </td>
                    <td className="py-1 px-1 border border-gray-300 dark:border-zinc-700">
                      <Input value={it.price} onChange={e => updateItem(idx, 'price', e.target.value)} className="h-8 text-sm text-right bg-transparent border-dashed rounded-none focus-visible:ring-0 px-1" placeholder="0.00" />
                    </td>
                    <td className="py-1 px-1 border border-gray-300 dark:border-zinc-700 relative">
                      <div className="flex items-center gap-1">
                        <Input value={it.total} onChange={e => updateItem(idx, 'total', e.target.value)} className="h-8 text-sm text-right bg-transparent border-dashed font-semibold rounded-none focus-visible:ring-0 px-1" placeholder="0.00" />
                        <button onClick={() => removeItem(idx)} className="no-export text-gray-400 hover:text-red-500 absolute -right-6" title="Remove item">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-start mt-3 no-export">
              <Button variant="ghost" size="sm" onClick={addItem} className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                <Plus className="w-4 h-4 mr-1" /> Add Row
              </Button>
            </div>
          </div>

          {/* Totals Section */}
          <div className="flex justify-end mb-10">
            <div className="w-1/3">
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-zinc-800">
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Subtotal</span>
                <Input value={subtotal || calculatedSubtotal.toFixed(2)} onChange={e => setSubtotal(e.target.value)} className="h-8 text-sm text-right w-[150px] bg-transparent border-dashed font-medium" placeholder="0.00" />
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-zinc-800">
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">VAT / Tax</span>
                <Input value={vat} onChange={e => setVat(e.target.value)} className="h-8 text-sm text-right w-[150px] bg-transparent border-dashed font-medium" placeholder="0.00" />
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-zinc-800">
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Delivery</span>
                <Input value={deliveryCharges} onChange={e => setDeliveryCharges(e.target.value)} className="h-8 text-sm text-right w-[150px] bg-transparent border-dashed font-medium" placeholder="0.00" />
              </div>
              <div className="flex justify-between items-center py-3 border-b-2 border-gray-800 dark:border-gray-200 mt-1">
                <span className="text-base font-bold text-gray-900 dark:text-gray-100">GRAND TOTAL</span>
                <Input value={grandTotal || calculatedGrandTotal.toFixed(2)} onChange={e => setGrandTotal(e.target.value)} className="h-10 text-lg text-right w-[160px] bg-transparent border-dashed font-black text-emerald-600 dark:text-emerald-500" placeholder="0.00" />
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="grid grid-cols-2 gap-8 mb-12">
            <div>
              <h4 className="font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide border-b border-gray-300 dark:border-zinc-700 pb-2 mb-4">Terms & Conditions</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 w-32 shrink-0 pt-2">Delivery Terms:</span>
                  <Input value={deliveryTerms} onChange={e => setDeliveryTerms(e.target.value)} className="h-8 text-sm bg-transparent border-dashed flex-1" placeholder="e.g. 14 Days from Order" />
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 w-32 shrink-0 pt-2">Payment Terms:</span>
                  <Input value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} className="h-8 text-sm bg-transparent border-dashed flex-1" placeholder="e.g. 50% Advance, 50% on Delivery" />
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 w-32 shrink-0 pt-2">Validity:</span>
                  <Input value={validity} onChange={e => setValidity(e.target.value)} className="h-8 text-sm bg-transparent border-dashed flex-1" placeholder="e.g. 30 Days" />
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 w-32 shrink-0 pt-2">Warranty:</span>
                  <Input value={warranty} onChange={e => setWarranty(e.target.value)} className="h-8 text-sm bg-transparent border-dashed flex-1" placeholder="e.g. 1 Year Standard" />
                </div>
              </div>
            </div>
            
            <div className="flex flex-col h-full">
              <h4 className="font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide border-b border-gray-300 dark:border-zinc-700 pb-2 mb-4">Notes</h4>
              <textarea 
                value={notes} 
                onChange={e => setNotes(e.target.value)} 
                className="w-full flex-1 min-h-[100px] text-sm bg-transparent border-dashed border border-gray-300 dark:border-zinc-700 rounded-md p-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none" 
                placeholder="Additional notes or terms..."
              />
            </div>
          </div>

          {/* Signatures */}
          <div className="flex justify-between items-end mt-16 pt-8 border-t border-gray-200 dark:border-zinc-800">
            <div className="w-1/3">
              <div className="border-b border-gray-400 dark:border-gray-600 h-10 mb-2"></div>
              <p className="text-sm text-center font-medium text-gray-600 dark:text-gray-400">Authorized Signature</p>
            </div>
            <div className="w-1/3">
              <div className="border-b border-gray-400 dark:border-gray-600 h-10 mb-2"></div>
              <p className="text-sm text-center font-medium text-gray-600 dark:text-gray-400">Buyer Acceptance & Date</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

