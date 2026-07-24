import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { supabase } from "@/lib/supabase";
import { RFQ } from "@/types/rfq";
import { format } from "date-fns";
import { Badge } from "@/components/ui/Badge";
import { Loader2 } from "lucide-react";

export default function AdminRFQsPage() {
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRfqs = async () => {
      const { data } = await supabase
        .from("rfqs")
        .select(`
          *,
          buyer:profiles!rfqs_buyer_id_fkey(business_name, country),
          product:products(name)
        `)
        .order("created_at", { ascending: false });
      
      if (data) setRfqs(data);
      setIsLoading(false);
    };
    fetchRfqs();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">RFQ Management</h1>
        <p className="text-muted-foreground">Manage Request for Quotations</p>
      </div>
      <Card className="border-border bg-muted/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 font-medium border-b border-border/50">
                <tr>
                  <th className="px-6 py-4">Title / ID</th>
                  <th className="px-6 py-4">Buyer</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#C65A28]" />
                    </td>
                  </tr>
                ) : rfqs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      No RFQs found.
                    </td>
                  </tr>
                ) : (
                  rfqs.map(rfq => (
                    <tr key={rfq.id} className="hover:bg-muted/30">
                      <td className="px-6 py-4 font-medium">{rfq.title}</td>
                      <td className="px-6 py-4">{(rfq.buyer as any)?.business_name || "Unknown"}</td>
                      <td className="px-6 py-4">
                        <select
                          className="bg-background border border-border/50 text-sm rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-primary/50 capitalize text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900"
                          value={rfq.status}
                          onChange={async (e) => {
                            const newStatus = e.target.value as import("@/types/rfq").RFQStatus;
                            await supabase.from("rfqs").update({ status: newStatus }).eq("id", rfq.id);
                            setRfqs(rfqs.map(r => r.id === rfq.id ? { ...r, status: newStatus } : r));
                          }}
                        >
                          <option value="open">Open</option>
                          <option value="reviewing">Reviewing</option>
                          <option value="closed">Closed</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {format(new Date(rfq.created_at), "MMM d, yyyy")}
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          className="text-[#B94A48] hover:text-[#C65A28] text-sm font-medium"
                          onClick={async () => {
                            if(window.confirm("Are you sure you want to delete this RFQ?")) {
                              await supabase.from("rfqs").delete().eq("id", rfq.id);
                              setRfqs(rfqs.filter(r => r.id !== rfq.id));
                            }
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
