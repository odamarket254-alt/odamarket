import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/useAuthStore";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { FileText, Search, ChevronRight } from "lucide-react";
import { Input } from "../../components/ui/Input";
import { RFQ, RFQResponse } from "../../types/rfq";
import { format } from "date-fns";
import { CreateQuotationModal } from "../../components/rfq/CreateQuotationModal";

export function SellerRFQsPage() {
  const { user } = useAuthStore();
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRfq, setSelectedRfq] = useState<RFQ | null>(null);
  const [isQuoting, setIsQuoting] = useState(false);

  useEffect(() => {
    if (user) {
      loadRFQs();
    }
  }, [user]);

  const loadRFQs = async () => {
    setLoading(true);
    try {
      // Sellers can see their own responses and public active RFQs
      // For a real platform, you might filter by seller's category
      
      const { data: activeRfqs, error: rfqError } = await supabase
        .from("rfqs")
        .select(`
          *,
          responses:rfq_responses (id, supplier_id, status)
        `)
        .in("status", ["pending", "quoted", "negotiating"])
        .order("created_at", { ascending: false });

      if (rfqError) throw rfqError;
      
      setRfqs(activeRfqs as any);
    } catch (error) {
      console.error("Error loading RFQs:", error);
    } finally {
      setLoading(false);
    }
  };

  const hasResponded = (rfq: any) => {
    return rfq.responses?.some((r: any) => r.supplier_id === user?.id);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      quoted: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      negotiating: "bg-purple-500/10 text-purple-600 border-purple-500/20",
      accepted: "bg-green-500/10 text-green-600 border-green-500/20",
      rejected: "bg-red-500/10 text-red-600 border-red-500/20",
      closed: "bg-gray-500/10 text-gray-600 border-gray-500/20"
    };
    return variants[status] || variants.pending;
  };

  const filteredRfqs = rfqs.filter(
    (rfq) =>
      rfq.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (statusFilter === "all" || 
       (statusFilter === "responded" && hasResponded(rfq)) ||
       (statusFilter === "new" && !hasResponded(rfq)))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">RFQ Center</h1>
          <p className="text-muted-foreground">Find and quote on buyer requests</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">New RFQs</p>
                <h3 className="text-3xl font-bold mt-1">{rfqs.filter(r => !hasResponded(r)).length}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
                <FileText className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Quoted</p>
                <h3 className="text-3xl font-bold mt-1">{rfqs.filter(r => hasResponded(r)).length}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600">
                <FileText className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Won RFQs</p>
                <h3 className="text-3xl font-bold mt-1">
                  {rfqs.filter(r => r.responses?.some((res: any) => res.supplier_id === user?.id && res.status === "accepted")).length}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-600">
                <FileText className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="border-b border-border bg-muted/20">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <CardTitle>Marketplace RFQs</CardTitle>
            <div className="flex w-full sm:w-auto gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9 w-full"
                  placeholder="Search RFQs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="new">New</option>
                <option value="responded">My Quotes</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading RFQs...</div>
            ) : filteredRfqs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No active RFQs found.
              </div>
            ) : (
              filteredRfqs.map((rfq) => (
                <div key={rfq.id} className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-muted/30 transition-colors">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg">{rfq.title}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span>{rfq.quantity} {rfq.unit}</span>
                      <span>•</span>
                      <span>Location: {rfq.delivery_location}</span>
                      <span>•</span>
                      <span>Posted: {format(new Date(rfq.created_at), "MMM d, yyyy")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                    <Badge variant="outline" className={getStatusBadge(rfq.status)}>
                      {rfq.status.charAt(0).toUpperCase() + rfq.status.slice(1)}
                    </Badge>
                    {hasResponded(rfq) ? (
                       <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                         Quoted
                       </Badge>
                    ) : (
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setSelectedRfq(rfq);
                          setIsQuoting(true);
                        }}
                        className="ml-2 bg-[#00B074] hover:bg-[#009260] text-white border-transparent"
                      >
                        Quote Now
                      </Button>
                    )}
                    <Button variant="outline" size="icon" className="ml-2">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <CreateQuotationModal 
        isOpen={isQuoting} 
        onClose={() => setIsQuoting(false)} 
        rfq={selectedRfq} 
        onSuccess={loadRFQs} 
      />
    </div>
  );
}
