import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/Dialog";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
import { Label } from "../ui/Label";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/useAuthStore";
import { toast } from "sonner";
import { FileText } from "lucide-react";
import { RFQ } from "../../types/rfq";

interface CreateQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  rfq: RFQ | null;
  onSuccess?: () => void;
}

export function CreateQuotationModal({ isOpen, onClose, rfq, onSuccess }: CreateQuotationModalProps) {
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    quoted_price: "",
    moq: "",
    lead_time_days: "",
    delivery_terms: "",
    payment_terms: "",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !rfq) return;

    if (!formData.quoted_price || !formData.moq || !formData.lead_time_days) {
      return toast.error("Please fill in price, MOQ, and lead time.");
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("rfq_responses").insert({
        rfq_id: rfq.id,
        supplier_id: user.id,
        quoted_price: parseFloat(formData.quoted_price),
        moq: parseFloat(formData.moq),
        lead_time_days: parseInt(formData.lead_time_days),
        delivery_terms: formData.delivery_terms,
        payment_terms: formData.payment_terms,
        message: formData.message,
        status: "pending"
      });

      if (error) throw error;
      
      // Update RFQ status
      await supabase.from("rfqs").update({ status: "quoted" }).eq("id", rfq.id);

      toast.success("Quotation submitted successfully!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to submit quotation");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!rfq) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-card rounded-xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Submit Quotation</DialogTitle>
              <DialogDescription>
                Provide your best offer for: {rfq.title}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="bg-muted p-4 rounded-lg my-4 text-sm space-y-3 border border-border">
          <div className="grid grid-cols-2 gap-2">
            <p><strong>Required Quantity:</strong> {rfq.quantity} {rfq.unit}</p>
            {rfq.target_price && <p><strong>Target Price:</strong> ${rfq.target_price} / unit</p>}
            <p><strong>Delivery Location:</strong> {rfq.delivery_location}</p>
          </div>
          {rfq.description && (
            <div className="mt-2 pt-2 border-t border-border/50">
              <p><strong>Additional Message / Requirements:</strong></p>
              <p className="mt-1 whitespace-pre-wrap">{rfq.description}</p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="quoted_price" className="text-sm font-semibold">Unit Price ($) <span className="text-red-500">*</span></Label>
                <Input
                  id="quoted_price"
                  name="quoted_price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 45.00"
                  value={formData.quoted_price}
                  onChange={handleChange}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="moq" className="text-sm font-semibold">MOQ <span className="text-red-500">*</span></Label>
                <Input
                  id="moq"
                  name="moq"
                  type="number"
                  min="1"
                  placeholder={`Min. ${rfq.unit}`}
                  value={formData.moq}
                  onChange={handleChange}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="lead_time_days" className="text-sm font-semibold">Lead Time (Days) <span className="text-red-500">*</span></Label>
                <Input
                  id="lead_time_days"
                  name="lead_time_days"
                  type="number"
                  min="1"
                  placeholder="e.g. 14"
                  value={formData.lead_time_days}
                  onChange={handleChange}
                  required
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="delivery_terms" className="text-sm font-semibold">Delivery Terms</Label>
                <Input
                  id="delivery_terms"
                  name="delivery_terms"
                  placeholder="e.g., FOB, Ex-Works"
                  value={formData.delivery_terms}
                  onChange={handleChange}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="payment_terms" className="text-sm font-semibold">Payment Terms</Label>
                <Input
                  id="payment_terms"
                  name="payment_terms"
                  placeholder="e.g., 30% advance, 70% LC"
                  value={formData.payment_terms}
                  onChange={handleChange}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="message" className="text-sm font-semibold">Message & Additional Notes</Label>
              <Textarea
                id="message"
                name="message"
                placeholder="Any special conditions or counter-offers?"
                value={formData.message}
                onChange={handleChange}
                rows={3}
                className="mt-1 resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
              {isSubmitting ? "Submitting..." : "Submit Quotation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
