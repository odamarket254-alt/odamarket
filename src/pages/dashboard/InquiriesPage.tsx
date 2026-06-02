import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { 
  Mail, Clock, CheckCircle, Search, Filter, Send, ArrowLeft, 
  Calendar, Building2, Paperclip, Smile, Loader2, FileText, 
  Download, MapPin, MessageSquare
} from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/useAuthStore";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";

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

const parseMessage = (text: string) => {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.Product || parsed["Total Amount"] || parsed["Unit Price"]) {
         return { type: 'quotation', data: parsed, original: text, before: text.substring(0, jsonMatch.index), after: text.substring(jsonMatch.index! + jsonMatch[0].length) };
      }
    }
  } catch (e) {}

  const isQuotation = /product/i.test(text) && (/amount/i.test(text) || /price/i.test(text) || /fee/i.test(text));
  if (isQuotation) {
      const rawLines = text.split(/\r?\n/);
      const quoteData: Record<string, string> = {};
      
      const textLines: string[] = [];
      
      rawLines.forEach(line => {
        const match = line.match(/^[\*\-]?\s*([^:]+)\s*:\s*(.+)$/);
        if (match) {
          const key = match[1].trim().replace(/\*/g, '');
          const value = match[2].trim().replace(/\*/g, '');
          if (key.split(' ').length <= 4) { 
            quoteData[key] = value;
          } else {
             textLines.push(line);
          }
        } else {
           textLines.push(line);
        }
      });
      if (Object.keys(quoteData).length >= 3) {
        return { type: 'quotation', data: quoteData, original: text, before: '', after: textLines.join('\n') };
      }
  }

  return { type: 'text', original: text };
};

const QuotationCard = ({ data, isOwn }: { data: Record<string, string>, isOwn: boolean }) => {
  const getValue = (keys: string[]) => {
    const key = Object.keys(data).find(k => keys.some(searchKey => k.toLowerCase().includes(searchKey.toLowerCase())));
    return key ? data[key] : null;
  };

  const product = getValue(['Product', 'Item', 'Name']) || "Custom Quotation";
  const quantity = getValue(['Quantity', 'Qty']);
  const unitPrice = getValue(['Unit Price', 'Price']);
  const deliveryFee = getValue(['Delivery Fee', 'Shipping']);
  const totalAmount = getValue(['Total', 'Amount']);
  const coverage = getValue(['Coverage', 'Location', 'Deliver ']);
  const timeline = getValue(['Timeline', 'Time', 'Duration', 'ETA']);
  const seller = getValue(['Seller', 'Vendor', 'Company']);

  return (
    <div className={`my-2 flex flex-col w-[280px] sm:w-[320px] rounded-2xl overflow-hidden shadow-sm ${isOwn ? 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-950 dark:text-emerald-50 border border-emerald-200 dark:border-emerald-800' : 'bg-card border border-border dark:bg-zinc-800 dark:border-zinc-700 text-foreground'}`}>
      <div className={`px-4 py-3 border-b flex items-center justify-between ${isOwn ? 'bg-emerald-100/80 border-emerald-200/50 dark:bg-emerald-800/50 dark:border-emerald-700/50' : 'bg-muted/50 border-border dark:bg-zinc-900/50'}`}>
        <div className="flex items-center gap-2">
          <FileText className={`h-4 w-4 ${isOwn ? 'text-emerald-700 dark:text-emerald-400' : 'text-primary'}`} />
          <span className={`font-semibold text-sm ${isOwn ? 'text-emerald-900 dark:text-emerald-300' : 'text-foreground'}`}>Quotation</span>
        </div>
        {totalAmount && <span className={`font-bold text-sm ${isOwn ? 'text-emerald-700 dark:text-emerald-400' : 'text-primary'}`}>{totalAmount}</span>}
      </div>
      
      <div className="p-4 flex flex-col gap-3">
        <div>
          <h4 className={`font-semibold text-[15px] leading-tight mb-1 ${isOwn ? 'text-emerald-950 dark:text-emerald-100' : 'text-foreground'}`}>{product}</h4>
          {seller && <p className={`text-[13px] ${isOwn ? 'text-emerald-800/80 dark:text-emerald-200/80' : 'text-muted-foreground'}`}>From: {seller}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-1">
          {quantity && (
            <div className="flex flex-col">
              <span className={`text-[10px] uppercase font-bold tracking-wider ${isOwn ? 'text-emerald-700/70 dark:text-emerald-400/70' : 'text-muted-foreground'}`}>Quantity</span>
              <span className={`text-[14px] font-medium leading-snug ${isOwn ? 'text-emerald-950 dark:text-emerald-200' : 'text-foreground'}`}>{quantity}</span>
            </div>
          )}
          {unitPrice && (
            <div className="flex flex-col">
              <span className={`text-[10px] uppercase font-bold tracking-wider ${isOwn ? 'text-emerald-700/70 dark:text-emerald-400/70' : 'text-muted-foreground'}`}>Unit Price</span>
              <span className={`text-[14px] font-medium leading-snug ${isOwn ? 'text-emerald-950 dark:text-emerald-200' : 'text-foreground'}`}>{unitPrice}</span>
            </div>
          )}
          {deliveryFee && (
            <div className="flex flex-col">
              <span className={`text-[10px] uppercase font-bold tracking-wider ${isOwn ? 'text-emerald-700/70 dark:text-emerald-400/70' : 'text-muted-foreground'}`}>Delivery Fee</span>
              <span className={`text-[14px] font-medium leading-snug ${isOwn ? 'text-emerald-950 dark:text-emerald-200' : 'text-foreground'}`}>{deliveryFee}</span>
            </div>
          )}
          {timeline && (
            <div className="flex flex-col">
              <span className={`text-[10px] uppercase font-bold tracking-wider ${isOwn ? 'text-emerald-700/70 dark:text-emerald-400/70' : 'text-muted-foreground'}`}>Timeline</span>
              <span className={`text-[14px] font-medium leading-snug ${isOwn ? 'text-emerald-950 dark:text-emerald-200' : 'text-foreground'}`}>{timeline}</span>
            </div>
          )}
        </div>
        
        {coverage && (
          <div className={`flex items-center gap-1.5 mt-1 border-t pt-2 ${isOwn ? 'border-emerald-200/50 dark:border-emerald-700/50' : 'border-border/50'}`}>
            <MapPin className={`h-3.5 w-3.5 ${isOwn ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground'}`} />
            <span className={`text-[13px] truncate ${isOwn ? 'text-emerald-800 dark:text-emerald-300' : 'text-muted-foreground'}`}>{coverage}</span>
          </div>
        )}
      </div>

      {!isOwn && (
        <div className="p-3 bg-muted/30 border-t border-border flex flex-col gap-2">
          <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
             Accept Quote
          </Button>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1 text-xs bg-card hover:bg-muted font-semibold text-foreground">
              Negotiate
            </Button>
            <Button size="sm" variant="outline" className="flex-1 text-xs bg-card hover:bg-muted font-semibold text-foreground">
              Contact Seller
            </Button>
            <Button size="sm" variant="outline" className="flex flex-col items-center justify-center px-3 bg-card hover:bg-muted" title="Download PDF">
              <Download className="h-4 w-4 text-foreground" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}


export default function InquiriesPage() {
  const { user, profile } = useAuthStore();
  const [searchParams] = useSearchParams();
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
        { event: "*", schema: "public", table: "inquiries", filter: `seller_id=eq.${user.id}` },
        () => { fetchInquiries(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    const sellerId = searchParams.get("seller");
    if (sellerId && inquiries.length > 0 && !selectedInquiry) {
      const existingInquiry = inquiries.find(inq => inq.seller_id === sellerId);
      if (existingInquiry) { setSelectedInquiry(existingInquiry); }
    }
  }, [searchParams, inquiries, selectedInquiry]);

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
        { event: "INSERT", schema: "public", table: "inquiry_messages", filter: `inquiry_id=eq.${selectedInquiry.id}` },
        (payload) => { setInquiryMessages((prev) => [...prev, payload.new as InquiryMessage]); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
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
        return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">New</Badge>;
      case "contacted":
        return <Badge className="bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/20">Contacted</Badge>;
      case "closed":
        return <Badge className="bg-muted text-foreground/80 border border-border">Closed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filteredInquiries = inquiries.filter(
    (i) =>
      i.company?.toLowerCase().includes(search.toLowerCase()) ||
      i.name?.toLowerCase().includes(search.toLowerCase()) ||
      i.products?.name?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-[calc(100dvh-64px)] lg:h-[calc(100dvh-64px)] -mx-4 sm:mx-0 sm:h-full lg:flex-row overflow-hidden bg-background">
      {/* Sidebar List */}
      <div className={`w-full lg:w-[350px] xl:w-[400px] flex flex-col border-r border-border bg-card z-10 ${selectedInquiry ? 'hidden lg:flex' : 'flex'}`}>
        <div className="p-4 border-b border-border bg-card shrink-0">
          <h1 className="text-xl font-bold tracking-tight text-foreground mb-4">Messages</h1>
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search messages..."
              className="pl-9 bg-muted/50 border-border h-10 w-full"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 bg-background/50 hide-scrollbar">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredInquiries.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
               <MessageSquare className="h-8 w-8 mb-3 opacity-20" />
               <p>No messages found</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {filteredInquiries.map((inquiry) => (
                <div
                  key={inquiry.id}
                  onClick={() => setSelectedInquiry(inquiry)}
                  className={`p-4 cursor-pointer transition-all hover:bg-muted/50 flex gap-3 ${selectedInquiry?.id === inquiry.id ? "bg-muted dark:bg-zinc-800/50" : ""}`}
                >
                  <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-lg shrink-0 border border-emerald-200 dark:border-emerald-800/50">
                    {inquiry.company.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className="font-semibold text-foreground text-[15px] truncate pr-2">
                        {inquiry.company}
                      </span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(inquiry.created_at), { addSuffix: false })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/80 truncate font-medium mb-1">
                      {inquiry.products?.name}
                    </p>
                    <div className="flex justify-between items-center mt-1.5">
                      <p className="text-[13px] text-muted-foreground truncate w-full">
                         {inquiry.quantity} Units requested
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col h-full bg-[#E5DDD5] dark:bg-[#0b141a] relative ${!selectedInquiry ? 'hidden lg:flex' : 'flex'}`}>
        {!selectedInquiry ? (
           <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-card border-l border-border h-full relative z-10">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
                 <MessageSquare className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">OdaMarket Messages</h2>
              <p className="text-muted-foreground max-w-md">
                 Select a conversation on the left to view messages and quotations.
              </p>
           </div>
        ) : (
          <div className="flex flex-col h-full w-full">
            {/* Chat Header */}
            <div className="h-16 px-4 bg-card border-b border-border flex items-center justify-between shrink-0 z-10 shadow-sm relative">
              <div className="flex items-center gap-3 min-w-0">
                <Button variant="ghost" size="icon" className="lg:hidden shrink-0 -ml-2 text-foreground" onClick={() => setSelectedInquiry(null)}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold shrink-0 border border-emerald-200 dark:border-emerald-800/50">
                  {selectedInquiry.company.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0">
                  <h3 className="font-semibold text-[16px] text-foreground truncate leading-tight mb-0.5">{selectedInquiry.company}</h3>
                  <p className="text-[13px] text-muted-foreground truncate leading-tight">{selectedInquiry.name} • {selectedInquiry.products?.name}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <div className="hidden sm:block">
                  {getStatusBadge(selectedInquiry.status)}
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 z-0" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')", backgroundBlendMode: "overlay" }}>
               {/* Initial Inquiry Card */}
               <div className="flex justify-center mb-6">
                 <div className="max-w-[90%] sm:max-w-md bg-white dark:bg-zinc-800/95 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 shadow-sm text-center">
                    <span className="inline-flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-3 border border-emerald-200 dark:border-emerald-800/50">
                       Initial Request
                    </span>
                    <h4 className="font-semibold text-lg text-foreground mb-1 leading-snug">{selectedInquiry.products?.name}</h4>
                    <p className="text-sm font-medium text-muted-foreground mb-4">{selectedInquiry.quantity} Units requested</p>
                    
                    <div className="bg-muted/40 p-3 rounded-lg text-left inline-block w-full border border-border">
                       <p className="text-[14px] text-foreground/90 whitespace-pre-wrap italic">"{selectedInquiry.message}"</p>
                    </div>
                 </div>
               </div>

               {/* Messages Loop */}
               {inquiryMessages.map((msg, idx) => {
                  const isOwn = msg.sender_id === user?.id;
                  const prevMsg = idx > 0 ? inquiryMessages[idx - 1] : null;
                  const isConsecutive = prevMsg?.sender_id === msg.sender_id;
                  
                  const parsed = parseMessage(msg.message);

                  return (
                    <div key={msg.id} className={`flex flex-col ${isOwn ? "items-end" : "items-start"} ${isConsecutive ? "mt-1" : "mt-3"}`}>
                      {parsed.type === 'quotation' ? (
                         <>
                            {parsed.before?.trim() && (
                               <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 shadow-sm text-[15px] leading-relaxed mb-1 ${isOwn ? "bg-[#005c4b] text-[#e9edef] rounded-tr-sm" : "bg-white dark:bg-[#202c33] border-none text-[#111b21] dark:text-[#e9edef] rounded-tl-sm"}`}>
                                  {parsed.before.trim()}
                               </div>
                            )}
                            <QuotationCard data={parsed.data} isOwn={isOwn} />
                            {parsed.after?.trim() && (
                               <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 shadow-sm text-[15px] leading-relaxed mt-1 ${isOwn ? "bg-[#005c4b] text-[#e9edef] rounded-tr-sm" : "bg-white dark:bg-[#202c33] border-none text-[#111b21] dark:text-[#e9edef] rounded-tl-sm"}`}>
                                  {parsed.after.trim().split('\n').map((line, i) => (
                                     <span key={i}>{line}<br /></span>
                                  ))}
                               </div>
                            )}
                         </>
                      ) : (
                        <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 shadow-sm text-[15px] leading-relaxed ${isOwn ? "bg-[#005c4b] text-[#e9edef] rounded-tr-sm" : "bg-white dark:bg-[#202c33] border-none text-[#111b21] dark:text-[#e9edef] rounded-tl-sm"}`}>
                           <p className="whitespace-pre-wrap">{msg.message}</p>
                        </div>
                      )}
                      
                      {!isConsecutive && (
                         <span className="text-[11px] text-muted-foreground/80 dark:text-muted-foreground/60 mt-1 px-1 font-medium select-none">
                            {format(new Date(msg.created_at), 'HH:mm')}
                         </span>
                      )}
                    </div>
                  );
               })}
               <div ref={messagesEndRef} className="h-2" />
            </div>

            {/* Chat Input */}
            <div className="bg-card px-3 sm:px-4 auto-rows-min py-3 flex items-end gap-2 border-t border-border z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
               <Button variant="ghost" size="icon" className="h-[44px] w-[44px] rounded-full shrink-0 text-muted-foreground hover:bg-muted/80 hover:text-foreground">
                  <Paperclip className="h-[22px] w-[22px]" />
               </Button>
               <div className="flex-1 bg-muted/60 dark:bg-zinc-900 border border-border/50 rounded-[22px] flex items-end overflow-hidden focus-within:ring-1 focus-within:ring-emerald-500/50 transition-shadow">
                  <Button variant="ghost" size="icon" className="h-[44px] w-[44px] shrink-0 text-muted-foreground hover:text-foreground">
                     <Smile className="h-[22px] w-[22px]" />
                  </Button>
                  <TextareaAutosize
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    minRows={1}
                    maxRows={6}
                    className="flex-1 min-w-0 bg-transparent border-0 ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-2 py-[11px] resize-none text-[15px] text-foreground placeholder:text-muted-foreground shadow-none outline-none leading-snug"
                  />
               </div>
               <Button
                 onClick={handleSendMessage}
                 disabled={!newMessage.trim() || isSending}
                 size="icon"
                 className="h-[44px] w-[44px] rounded-full shrink-0 bg-[#00a884] hover:bg-[#008f6f] text-white shadow-md active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
               >
                 {isSending ? (
                   <Loader2 className="h-5 w-5 animate-spin" />
                 ) : (
                   <Send className="h-[20px] w-[20px] ml-0.5" />
                 )}
               </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
