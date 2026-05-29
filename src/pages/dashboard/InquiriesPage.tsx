import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Mail, Clock, CheckCircle, Search, Filter, Send, ArrowLeft, Calendar, Building2, Sparkles } from "lucide-react";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/useAuthStore";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Inquiry {
  id: string;
  product_id: string;
  seller_id: string;
  buyer_id: string | null;
  name: string;
  email: string;
  company: string;
  quantity: string;
  message: string;
  status: string;
  created_at: string;
  products?: {
    name: string;
  };
}

interface InquiryMessage {
  id: string;
  inquiry_id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

export default function InquiriesPage() {
  const { user, profile } = useAuthStore();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [inquiryMessages, setInquiryMessages] = useState<InquiryMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    fetchInquiries();

    const channel = supabase
      .channel(`inquiries-changes-${Math.random()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "inquiries",
          filter: `seller_id=eq.${user.id}`,
        },
        () => {
          fetchInquiries();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    if (!selectedInquiry) {
      setInquiryMessages([]);
      return;
    }

    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from("inquiry_messages")
          .select("*")
          .eq("inquiry_id", selectedInquiry.id)
          .order("created_at", { ascending: true });

        if (error) console.error(error);
        if (data) setInquiryMessages(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchMessages();

    const channel = supabase
      .channel(`messages-${selectedInquiry.id}-${Math.random()}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "inquiry_messages",
          filter: `inquiry_id=eq.${selectedInquiry.id}`,
        },
        (payload) => {
          setInquiryMessages((prev) => [
            ...prev,
            payload.new as InquiryMessage,
          ]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedInquiry]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [inquiryMessages, selectedInquiry]);

  const fetchInquiries = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("inquiries")
        .select("*, products(name)")
        .or(`seller_id.eq.${user?.id},buyer_id.eq.${user?.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) setInquiries(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedInquiry || !user) return;
    setIsSending(true);
    try {
      const { error } = await supabase.from("inquiry_messages").insert({
        inquiry_id: selectedInquiry.id,
        sender_id: user.id,
        message: newMessage.trim(),
      });

      if (error) throw error;
      setNewMessage("");
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
      case "pending":
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30">
            New
          </Badge>
        );
      case "contacted":
        return (
          <Badge className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30">
            Contacted
          </Badge>
        );
      case "closed":
        return (
          <Badge className="bg-white/10 text-foreground/80 hover:bg-white/10 border border-white/20">
            Closed
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "new":
      case "pending":
        return <Mail className="h-5 w-5 text-emerald-500" />;
      case "contacted":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "closed":
        return <CheckCircle className="h-5 w-5 text-muted-foreground" />;
      default:
        return <Mail className="h-5 w-5" />;
    }
  };

  const filteredInquiries = inquiries.filter(
    (i) =>
      i.company.toLowerCase().includes(search.toLowerCase()) ||
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.products?.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6 flex flex-col min-h-[calc(100dvh-8rem)] lg:h-[calc(100dvh-8rem)]">
      <div className="shrink-0 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Inquiries Inbox
          </h1>
          <p className="text-muted-foreground">
            Manage buyer requests and quotes.
          </p>
        </div>
      </div>

      <div className="flex gap-4 shrink-0">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search inquiries..."
            className="pl-9 bg-muted/50 text-foreground border-border text-foreground placeholder:text-zinc-600 focus-visible:ring-emerald-500"
          />
        </div>
        <Button
          variant="outline"
          className="bg-muted/50 text-foreground border-border text-foreground hover:bg-white/10"
        >
          <Filter className="h-4 w-4 mr-2" /> Filter
        </Button>
      </div>

      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-3 gap-6 min-h-0">
        {/* Inbox List */}
        <div className={`lg:col-span-1 border border-border bg-muted/50 text-foreground backdrop-blur-sm rounded-lg overflow-y-auto flex-1 lg:h-full ${selectedInquiry ? 'hidden lg:block' : 'block'}`}>
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading...
            </div>
          ) : filteredInquiries.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No inquiries found.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filteredInquiries.map((inquiry) => (
                <div
                  key={inquiry.id}
                  onClick={() => setSelectedInquiry(inquiry)}
                  className={`p-4 hover:bg-emerald-500/10 cursor-pointer transition-colors border-l-4 ${selectedInquiry?.id === inquiry.id ? "border-emerald-500 bg-muted/50 text-foreground" : "border-transparent"}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(inquiry.status)}
                      <span className="font-semibold text-foreground text-sm">
                        {inquiry.company}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(inquiry.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate mb-2">
                    {inquiry.products?.name}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs bg-black/40 text-muted-foreground border border-border/50 px-2 py-1 rounded">
                      Qty: {inquiry.quantity}
                    </span>
                    {getStatusBadge(inquiry.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Inquiry Detail */}
        <div className={`lg:col-span-2 flex flex-col flex-1 lg:h-full ${selectedInquiry ? 'flex' : 'hidden lg:flex'}`}>
          {selectedInquiry ? (
            <Card className="flex flex-col flex-1 border-border bg-muted/50 text-foreground backdrop-blur-sm overflow-hidden">
              <CardContent className="flex flex-col flex-1 p-4 sm:p-8 overflow-hidden">
                {/* Header Section */}
                <div className="flex justify-between items-start mb-6 shrink-0">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                       <Button variant="ghost" size="sm" className="lg:hidden p-0 h-6 w-6 mr-2 text-muted-foreground" onClick={() => setSelectedInquiry(null)}>
                         <ArrowLeft className="h-4 w-4" />
                       </Button>
                       <h2 className="text-lg sm:text-2xl font-bold text-foreground">
                         {selectedInquiry.products?.name}
                       </h2>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {new Date(selectedInquiry.created_at).toLocaleDateString()}</span>
                      <span className="w-1 h-1 rounded-full bg-border" />
                      <span className="flex items-center gap-1.5 font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">Qty: {selectedInquiry.quantity} Units</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="mb-2">
                      {getStatusBadge(selectedInquiry.status)}
                    </div>
                  </div>
                </div>

                {/* Sender Info & Initial Message */}
                <div className="bg-muted/30 border border-border rounded-xl p-4 sm:p-5 mb-6 shrink-0 flex flex-col gap-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-border/50 pb-4">
                    <div className="flex items-start gap-4">
                       <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
                         <span className="text-emerald-500 font-bold text-base sm:text-lg">{selectedInquiry.name.charAt(0).toUpperCase()}</span>
                       </div>
                       <div>
                         <p className="text-sm sm:text-base font-semibold text-foreground tracking-tight">{selectedInquiry.name}</p>
                         <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                           <Building2 className="h-3.5 w-3.5" /> {selectedInquiry.company}
                         </p>
                         <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                           <Mail className="h-3.5 w-3.5" /> {selectedInquiry.email}
                         </p>
                       </div>
                    </div>
                    <div className="hidden sm:flex flex-col items-end pt-1">
                       <span className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground mb-1.5">Inquiry Type</span>
                       <span className="text-xs bg-black/40 px-2.5 py-1 rounded-md border border-border text-foreground/90 font-medium tracking-wide">Product Request</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] sm:text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                      Message Content
                    </h4>
                    <p className="text-foreground/90 whitespace-pre-line text-sm leading-relaxed max-h-[120px] overflow-y-auto hide-scrollbar pl-3 sm:pl-4 border-l-2 border-emerald-500/50 italic bg-black/20 p-3 sm:p-4 rounded-r-xl shadow-inner">
                      "{selectedInquiry.message}"
                    </p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto mb-4 pr-2 pb-2 space-y-4 hide-scrollbar">
                  {inquiryMessages.map((msg) => {
                    const isOwn = msg.sender_id === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[80%] rounded-xl px-3 py-2 sm:px-4 sm:py-3 ${isOwn ? "bg-emerald-600/20 border border-emerald-500/30 text-emerald-50" : "bg-muted/50 border border-border text-foreground"}`}
                        >
                          <p className="whitespace-pre-line text-sm">
                            {msg.message}
                          </p>
                        </div>
                        <span className="text-[10px] sm:text-xs text-muted-foreground mt-1 px-1">
                          {formatDistanceToNow(new Date(msg.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <div className="flex gap-2 shrink-0 pt-2 border-t border-border/50">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={profile?.role === "seller" ? "Reply or just chat..." : "Reply or just chat..."}
                    className="flex-1 bg-black/40 border-border text-foreground focus-visible:ring-emerald-500 h-10 sm:h-12"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || isSending}
                    className="bg-emerald-600 hover:bg-emerald-500 text-foreground px-4 sm:px-6 h-10 sm:h-12"
                  >
                    {isSending ? (
                       <span className="text-sm">Sending...</span>
                    ) : (
                       <>
                         <Send className="h-4 w-4 sm:hidden" />
                         <span className="hidden sm:inline">Send</span>
                       </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="flex flex-col flex-1 border-border bg-muted/50 text-foreground backdrop-blur-sm items-center justify-center">
              <CardContent className="text-center p-8">
                <div className="w-20 h-20 rounded-full bg-muted/50 text-foreground border border-border flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-10 w-10 text-zinc-600" />
                </div>
                <h3 className="text-lg font-medium text-foreground">
                  Select an inquiry
                </h3>
                <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                  Choose an inquiry from the list to view details, buyer
                  information, and respond.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
