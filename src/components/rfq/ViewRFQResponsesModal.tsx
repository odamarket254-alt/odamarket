import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/Dialog";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";
import { RFQ, RFQResponse } from "../../types/rfq";
import { format } from "date-fns";
import { FileText, CheckCircle2, XCircle } from "lucide-react";

interface ViewRFQResponsesModalProps {
  isOpen: boolean;
  onClose: () => void;
  rfq: RFQ | null;
  onStatusChange?: () => void;
}

export function ViewRFQResponsesModal({ isOpen, onClose, rfq, onStatusChange }: ViewRFQResponsesModalProps) {
  const [responses, setResponses] = useState<RFQResponse[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && rfq) {
      loadResponses();
    }
  }, [isOpen, rfq]);

  const loadResponses = async () => {
    if (!rfq) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("rfq_responses")
        .select(`
          *,
          supplier:profiles!rfq_responses_supplier_id_fkey(business_name, country)
        `)
        .eq("rfq_id", rfq.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setResponses(data as any);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load responses");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (responseId: string) => {
    if (!rfq) return;
    try {
      // Set the response to accepted
      const { error } = await supabase
        .from("rfq_responses")
        .update({ status: "accepted" })
        .eq("id", responseId);
      
      if (error) throw error;

      // Automatically reject others and set RFQ to accepted
      await supabase
        .from("rfq_responses")
        .update({ status: "rejected" })
        .eq("rfq_id", rfq.id)
        .neq("id", responseId);

      await supabase
        .from("rfqs")
        .update({ status: "accepted" })
        .eq("id", rfq.id);

      toast.success("Quotation accepted!");
      if (onStatusChange) onStatusChange();
      loadResponses();
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to accept quotation");
    }
  };

  const handleReject = async (responseId: string) => {
    try {
      const { error } = await supabase
        .from("rfq_responses")
        .update({ status: "rejected" })
        .eq("id", responseId);
      
      if (error) throw error;
      toast.success("Quotation rejected!");
      loadResponses();
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to reject quotation");
    }
  };

  if (!rfq) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto bg-card rounded-xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">{rfq.title}</DialogTitle>
              <DialogDescription>
                Review quotations for your request
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-6">
          <h3 className="font-semibold text-lg mb-4">Supplier Quotations</h3>
          
          {loading ? (
             <div className="text-center py-8 text-muted-foreground">Loading quotations...</div>
          ) : responses.length === 0 ? (
             <div className="text-center py-8 bg-muted/50 rounded-lg border border-dashed border-border text-muted-foreground">
               No quotations received yet.
             </div>
          ) : (
            <div className="space-y-4">
              {responses.map((resp) => (
                <div key={resp.id} className={`p-5 rounded-xl border ${resp.status === 'accepted' ? 'border-green-500 bg-green-500/5' : 'border-border bg-card'} shadow-sm`}>
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">{(resp as any).supplier?.business_name || "Unknown Supplier"}</span>
                        <Badge variant="outline" className="text-xs">{(resp as any).supplier?.country || "Global"}</Badge>
                        {resp.status === 'accepted' && (
                          <Badge className="bg-green-500 hover:bg-green-600 text-white border-transparent flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Accepted
                          </Badge>
                        )}
                        {resp.status === 'rejected' && (
                          <Badge variant="outline" className="text-red-500 border-red-500/30 bg-red-500/10">
                            Rejected
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mt-3">
                        <div>
                          <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Unit Price</p>
                          <p className="font-semibold text-primary text-base">${resp.quoted_price}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">MOQ</p>
                          <p className="font-medium">{resp.moq} {rfq.unit}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Lead Time</p>
                          <p className="font-medium">{resp.lead_time_days} days</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Status</p>
                          <p className="font-medium capitalize">{resp.status}</p>
                        </div>
                      </div>

                      {(resp.delivery_terms || resp.payment_terms) && (
                        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2 text-sm">
                          {resp.delivery_terms && <p><span className="text-muted-foreground">Delivery:</span> {resp.delivery_terms}</p>}
                          {resp.payment_terms && <p><span className="text-muted-foreground">Payment:</span> {resp.payment_terms}</p>}
                        </div>
                      )}

                      {resp.message && (
                        <div className="mt-3 p-3 bg-muted rounded-lg text-sm text-foreground/90 border border-border/50">
                          {resp.message}
                        </div>
                      )}
                    </div>
                    
                    {resp.status === 'pending' && rfq.status !== 'accepted' && rfq.status !== 'closed' && (
                      <div className="flex flex-row md:flex-col gap-2 shrink-0 md:min-w-[120px]">
                        <Button 
                          onClick={() => handleAccept(resp.id)} 
                          className="flex-1 bg-[#00B074] hover:bg-[#009260] text-white shadow-md font-semibold"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" /> Accept
                        </Button>
                        <Button 
                          onClick={() => handleReject(resp.id)} 
                          variant="outline" 
                          className="flex-1 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
                        >
                          <XCircle className="w-4 h-4 mr-2" /> Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
