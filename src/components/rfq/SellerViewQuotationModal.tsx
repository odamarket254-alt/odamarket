import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/Dialog";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/useAuthStore";
import { toast } from "sonner";
import { FileText, Calendar, CheckCircle2 } from "lucide-react";
import { RFQ, RFQResponse } from "../../types/rfq";
import { format } from "date-fns";

interface SellerViewQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  rfq: RFQ | null;
}

export function SellerViewQuotationModal({ isOpen, onClose, rfq }: SellerViewQuotationModalProps) {
  const { user } = useAuthStore();
  const [response, setResponse] = useState<RFQResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && rfq && user) {
      loadResponse();
    }
  }, [isOpen, rfq, user]);

  const loadResponse = async () => {
    if (!rfq || !user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("rfq_responses")
        .select("*")
        .eq("rfq_id", rfq.id)
        .eq("supplier_id", user.id)
        .single();

      if (error) {
        if (error.code !== "PGRST116") { // Not found error
          throw error;
        }
      } else {
        setResponse(data as any);
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load your quotation");
    } finally {
      setLoading(false);
    }
  };

  if (!rfq) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-card rounded-xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">RFQ Details & Your Quote</DialogTitle>
              <DialogDescription>
                {rfq.title}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* RFQ Details */}
          <div className="bg-muted p-5 rounded-lg border border-border">
            <h3 className="font-semibold text-base mb-3 border-b border-border pb-2">Buyer's Requirements</h3>
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <span className="text-muted-foreground block mb-1">Required Quantity</span>
                <span className="font-medium">{rfq.quantity} {rfq.unit}</span>
              </div>
              {rfq.target_price && (
                <div>
                  <span className="text-muted-foreground block mb-1">Target Price</span>
                  <span className="font-medium">${rfq.target_price} / unit</span>
                </div>
              )}
              <div>
                <span className="text-muted-foreground block mb-1">Delivery Location</span>
                <span className="font-medium">{rfq.delivery_location}</span>
              </div>
              {rfq.delivery_date && (
                <div>
                  <span className="text-muted-foreground block mb-1">Target Delivery</span>
                  <span className="font-medium">{format(new Date(rfq.delivery_date), "MMM d, yyyy")}</span>
                </div>
              )}
            </div>
            
            {rfq.description && (
              <div className="mt-4 pt-3 border-t border-border/50">
                <span className="text-muted-foreground block mb-1 text-sm">Additional Message / Requirements</span>
                <p className="text-sm font-medium whitespace-pre-wrap">{rfq.description}</p>
              </div>
            )}
          </div>

          {/* Seller's Response */}
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading your quote...
            </div>
          ) : response ? (
            <div className="border border-emerald-500/20 bg-emerald-500/5 p-5 rounded-lg">
              <div className="flex items-center justify-between mb-3 border-b border-emerald-500/20 pb-2">
                <h3 className="font-semibold text-emerald-700 dark:text-emerald-400">Your Quotation</h3>
                <Badge variant={response.status === 'accepted' ? 'default' : response.status === 'rejected' ? 'destructive' : 'secondary'}>
                  {response.status.toUpperCase()}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground block mb-1">Quoted Price</span>
                  <span className="font-medium text-lg">${response.quoted_price} / unit</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Minimum Order Qty (MOQ)</span>
                  <span className="font-medium">{response.moq} {rfq.unit}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Lead Time</span>
                  <span className="font-medium">{response.lead_time_days} days</span>
                </div>
                {response.delivery_terms && (
                  <div>
                    <span className="text-muted-foreground block mb-1">Delivery Terms</span>
                    <span className="font-medium">{response.delivery_terms}</span>
                  </div>
                )}
                {response.payment_terms && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground block mb-1">Payment Terms</span>
                    <span className="font-medium">{response.payment_terms}</span>
                  </div>
                )}
                {response.message && (
                  <div className="col-span-2 mt-2 pt-2 border-t border-emerald-500/20">
                    <span className="text-muted-foreground block mb-1">Your Message</span>
                    <p className="font-medium whitespace-pre-wrap">{response.message}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center p-4 text-muted-foreground">
              No quotation found for this RFQ.
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
