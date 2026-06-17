import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/useAuthStore";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { PackageSearch, Search, Filter, History, ChevronRight } from "lucide-react";
import { Input } from "../../components/ui/Input";
import { RFQ } from "../../types/rfq";
import { format } from "date-fns";
import { ViewRFQResponsesModal } from "../../components/rfq/ViewRFQResponsesModal";

export function BuyerRFQsPage() {
  const { user } = useAuthStore();
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRfq, setSelectedRfq] = useState<RFQ | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadRFQs();
    }
  }, [user]);

  const loadRFQs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("rfqs")
        .select(`
          *,
          responses:rfq_responses (count)
        `)
        .eq("buyer_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRfqs(data as any);
    } catch (error) {
      console.error("Error loading RFQs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      quoted: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      negotiating: "bg-purple-500/10 text-purple-600 border-purple-500/20",
      accepted: "bg-green-500/10 text-green-600 border-green-500/20",
      rejected: "bg-red-500/10 text-red-600 border-red-500/20",
      closed: "bg-gray-500/10 text-gray-600 border-gray-500/20",
    };
    return variants[status] || variants.pending;
  };

  const stats = {
    total: rfqs.length,
    pending: rfqs.filter((r) => r.status === "pending").length,
    quoted: rfqs.filter((r) => r.status === "quoted").length,
    accepted: rfqs.filter((r) => r.status === "accepted").length,
  };

  const filteredRfqs = rfqs.filter(
    (rfq) =>
      rfq.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (statusFilter === "all" || rfq.status === statusFilter)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">RFQ Management</h1>
          <p className="text-muted-foreground">Manage your requests for quotation</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total RFQs</p>
                <h3 className="text-3xl font-bold mt-1">{stats.total}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <PackageSearch className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Quotes</p>
                <h3 className="text-3xl font-bold mt-1">{stats.pending}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
                <History className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Quoted</p>
                <h3 className="text-3xl font-bold mt-1">{stats.quoted}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600">
                <PackageSearch className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Accepted</p>
                <h3 className="text-3xl font-bold mt-1">{stats.accepted}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-600">
                <PackageSearch className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="border-b border-border bg-muted/20">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <CardTitle>My RFQs</CardTitle>
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
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="quoted">Quoted</option>
                <option value="accepted">Accepted</option>
                <option value="closed">Closed</option>
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
                No RFQs found.
              </div>
            ) : (
              filteredRfqs.map((rfq) => (
                <div key={rfq.id} className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-muted/30 transition-colors">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg">{rfq.title}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span>{rfq.quantity} {rfq.unit}</span>
                      <span>•</span>
                      <span>Target: {rfq.target_price ? `$${rfq.target_price}` : "N/A"}</span>
                      <span>•</span>
                      <span>Created: {format(new Date(rfq.created_at), "MMM d, yyyy")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                    <Badge variant="outline" className={getStatusBadge(rfq.status)}>
                      {rfq.status.charAt(0).toUpperCase() + rfq.status.slice(1)}
                    </Badge>
                    <div className="px-3 py-1 bg-secondary rounded-full text-xs font-medium">
                      {(rfq as any).responses?.[0]?.count || 0} Quotes
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="ml-2 font-medium"
                      onClick={() => {
                        setSelectedRfq(rfq);
                        setIsViewModalOpen(true);
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <ViewRFQResponsesModal 
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        rfq={selectedRfq}
        onStatusChange={loadRFQs}
      />
    </div>
  );
}
