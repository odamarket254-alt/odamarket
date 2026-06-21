import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { VerifiedBadge } from "../../components/ui/VerifiedBadge";
import { Timestamp } from "../../components/ui/Timestamp";
import { 
  Mail, Clock, CheckCircle, Search, Filter, Send, ArrowLeft, 
  Calendar, Building2, Paperclip, Smile, Loader2, FileText, 
  Download, MapPin, MessageSquare, Phone, MoreVertical, Image as ImageIcon, Check, CheckCheck, ChevronDown
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
  buyer_unread_count?: number;
  seller_unread_count?: number;
  last_message_text?: string;
  last_message_time?: string;
  last_message_sender_id?: string;
  created_at: string;
  updated_at?: string;
  expires_at?: string | null;
  products?: {
    name: string;
  };
  seller?: {
    business_name?: string;
    verified?: boolean;
  };
  buyer?: {
    business_name?: string;
    verified?: boolean;
  };
}

interface InquiryMessage {
  id: string;
  inquiry_id: string;
  sender_id: string;
  message: string;
  is_read?: boolean;
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
    <div className={`my-2 flex flex-col w-[280px] sm:w-[320px] rounded-2xl overflow-hidden shadow-sm ${isOwn ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-950 dark:text-blue-50 border border-blue-200 dark:border-blue-800' : 'bg-card border border-border dark:bg-zinc-800 dark:border-zinc-700 text-foreground'}`}>
      <div className={`px-4 py-3 border-b flex items-center justify-between ${isOwn ? 'bg-blue-100/80 border-blue-200/50 dark:bg-blue-800/50 dark:border-blue-700/50' : 'bg-muted/50 border-border dark:bg-zinc-900/50'}`}>
        <div className="flex items-center gap-2">
          <FileText className={`h-4 w-4 ${isOwn ? 'text-blue-700 dark:text-blue-400' : 'text-primary'}`} />
          <span className={`font-semibold text-sm ${isOwn ? 'text-blue-900 dark:text-blue-300' : 'text-foreground'}`}>Quotation</span>
        </div>
        {totalAmount && <span className={`font-bold text-sm ${isOwn ? 'text-blue-700 dark:text-blue-400' : 'text-primary'}`}>{totalAmount}</span>}
      </div>
      
      <div className="p-4 flex flex-col gap-3">
        <div>
          <h4 className={`font-semibold text-[15px] leading-tight mb-1 ${isOwn ? 'text-blue-950 dark:text-blue-100' : 'text-foreground'}`}>{product}</h4>
          {seller && <p className={`text-[13px] ${isOwn ? 'text-blue-800/80 dark:text-blue-200/80' : 'text-muted-foreground'}`}>From: {seller}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-1">
          {quantity && (
            <div className="flex flex-col">
              <span className={`text-[10px] uppercase font-bold tracking-wider ${isOwn ? 'text-blue-700/70 dark:text-blue-400/70' : 'text-muted-foreground'}`}>Quantity</span>
              <span className={`text-[14px] font-medium leading-snug ${isOwn ? 'text-blue-950 dark:text-blue-200' : 'text-foreground'}`}>{quantity}</span>
            </div>
          )}
          {unitPrice && (
            <div className="flex flex-col">
              <span className={`text-[10px] uppercase font-bold tracking-wider ${isOwn ? 'text-blue-700/70 dark:text-blue-400/70' : 'text-muted-foreground'}`}>Unit Price</span>
              <span className={`text-[14px] font-medium leading-snug ${isOwn ? 'text-blue-950 dark:text-blue-200' : 'text-foreground'}`}>{unitPrice}</span>
            </div>
          )}
          {deliveryFee && (
            <div className="flex flex-col">
              <span className={`text-[10px] uppercase font-bold tracking-wider ${isOwn ? 'text-blue-700/70 dark:text-blue-400/70' : 'text-muted-foreground'}`}>Delivery Fee</span>
              <span className={`text-[14px] font-medium leading-snug ${isOwn ? 'text-blue-950 dark:text-blue-200' : 'text-foreground'}`}>{deliveryFee}</span>
            </div>
          )}
          {timeline && (
            <div className="flex flex-col">
              <span className={`text-[10px] uppercase font-bold tracking-wider ${isOwn ? 'text-blue-700/70 dark:text-blue-400/70' : 'text-muted-foreground'}`}>Timeline</span>
              <span className={`text-[14px] font-medium leading-snug ${isOwn ? 'text-blue-950 dark:text-blue-200' : 'text-foreground'}`}>{timeline}</span>
            </div>
          )}
        </div>
        
        {coverage && (
          <div className={`flex items-center gap-1.5 mt-1 border-t pt-2 ${isOwn ? 'border-blue-200/50 dark:border-blue-700/50' : 'border-border/50'}`}>
            <MapPin className={`h-3.5 w-3.5 ${isOwn ? 'text-blue-700 dark:text-blue-400' : 'text-muted-foreground'}`} />
            <span className={`text-[13px] truncate ${isOwn ? 'text-blue-800 dark:text-blue-300' : 'text-muted-foreground'}`}>{coverage}</span>
          </div>
        )}
      </div>

      {!isOwn && (
        <div className="p-3 bg-muted/30 border-t border-border flex flex-col gap-2">
          <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
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
  const [filterTab, setFilterTab] = useState<"all" | "unread" | "active" | "archived">("all");
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const myTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeChannelRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    fetchInquiries();
    const channel = supabase
      .channel(`inquiries-changes-${Math.random()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "inquiries" },
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

  const markAsRead = async (inquiry: Inquiry) => {
    if (!user) return;
    try {
      const isBuyer = user.id === inquiry.buyer_id;
      const unreadCount = isBuyer ? inquiry.buyer_unread_count : inquiry.seller_unread_count;
      
      if (unreadCount && unreadCount > 0) {
        // Optimistically update local state
        setInquiries(prev => prev.map(q => {
          if (q.id === inquiry.id) {
            return isBuyer 
              ? { ...q, buyer_unread_count: 0 } 
              : { ...q, seller_unread_count: 0 };
          }
          return q;
        }));

        const updatePayload = isBuyer ? { buyer_unread_count: 0 } : { seller_unread_count: 0 };
        await supabase.from("inquiries").update(updatePayload).eq("id", inquiry.id);
      }
      
      // Update the unread status on the messages
      await supabase
        .from("inquiry_messages")
        .update({ is_read: true })
        .eq("inquiry_id", inquiry.id)
        .neq("sender_id", user.id)
        .eq("is_read", false);
        
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  useEffect(() => {
    if (!selectedInquiry) {
      setInquiryMessages([]);
      return;
    }
    
    setIsTyping(false);
    markAsRead(selectedInquiry);
    
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
      .channel(`inquiries-messages-${selectedInquiry.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "inquiry_messages", filter: `inquiry_id=eq.${selectedInquiry.id}` },
        (payload) => { 
          const newMessage = payload.new as InquiryMessage;
          setInquiryMessages((prev) => [...prev, newMessage]); 
          
          if (user && newMessage.sender_id !== user.id) {
            setIsTyping(false);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            markAsRead(selectedInquiry);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "inquiry_messages", filter: `inquiry_id=eq.${selectedInquiry.id}` },
        (payload) => { 
          const updatedMessage = payload.new as InquiryMessage;
          setInquiryMessages((prev) => prev.map(msg => msg.id === updatedMessage.id ? updatedMessage : msg)); 
        }
      )
      .on(
        "broadcast",
        { event: "typing" },
        (payload) => {
          if (user && payload.payload.sender_id !== user.id) {
            setIsTyping(payload.payload.isTyping);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            if (payload.payload.isTyping) {
              typingTimeoutRef.current = setTimeout(() => {
                setIsTyping(false);
              }, 3000);
            }
          }
        }
      )
      .subscribe();
      
    activeChannelRef.current = channel;

    return () => { 
      supabase.removeChannel(channel); 
      activeChannelRef.current = null;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (myTypingTimeoutRef.current) clearTimeout(myTypingTimeoutRef.current);
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
        .select("*, products(name), seller:profiles!seller_id(business_name, verified), buyer:profiles!buyer_id(business_name, verified)")
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
    
    if (activeChannelRef.current) {
      if (myTypingTimeoutRef.current) clearTimeout(myTypingTimeoutRef.current);
      activeChannelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { sender_id: user.id, isTyping: false }
      }).catch(console.warn);
    }

    try {
      const messageText = newMessage.trim();
      
      const { error } = await supabase.from("inquiry_messages").insert({
        inquiry_id: selectedInquiry.id,
        sender_id: user.id,
        message: messageText,
        is_read: false
      });
      if (error) throw error;
      
      // Update the inquiry last message & unread count
      const isBuyer = user.id === selectedInquiry.buyer_id;
      
      // Local state update immediately
      setNewMessage("");
      
      const updatePayload: any = {
        last_message_text: messageText,
        last_message_time: new Date().toISOString(),
        last_message_sender_id: user.id
      };
      
      if (isBuyer) {
        updatePayload.seller_unread_count = (selectedInquiry.seller_unread_count || 0) + 1;
      } else {
        updatePayload.buyer_unread_count = (selectedInquiry.buyer_unread_count || 0) + 1;
      }

      await supabase
        .from("inquiries")
        .update(updatePayload)
        .eq("id", selectedInquiry.id);
        
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
        return <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">New</Badge>;
      case "contacted":
        return <Badge className="bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/20">Contacted</Badge>;
      case "closed":
        return <Badge className="bg-muted text-foreground/80 border border-border">Closed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getOtherParty = (inquiry: Inquiry) => {
    const isSeller = inquiry.seller_id === user?.id;
    if (isSeller) {
      return {
        name: inquiry.company || inquiry.name || "Unknown Buyer",
        verified: inquiry.buyer?.verified || false
      };
    } else {
      return {
        name: inquiry.seller?.business_name || "Unknown Seller",
        verified: inquiry.seller?.verified || false
      };
    }
  };

  const filteredInquiries = inquiries.filter((i) => {
    const matchesSearch = 
      i.company?.toLowerCase().includes(search.toLowerCase()) ||
      i.name?.toLowerCase().includes(search.toLowerCase()) ||
      i.products?.name?.toLowerCase().includes(search.toLowerCase());
    
    if (!matchesSearch) return false;

    // Simulate filters based on status since we might not have a dedicated unread/archived column
    if (filterTab === "unread") return i.status === "new" || i.status === "pending";
    if (filterTab === "active") return i.status !== "closed";
    if (filterTab === "archived") return i.status === "closed";
    
    return true; // "all"
  });

  return (
    <div className="flex flex-col h-[calc(100dvh-64px)] lg:h-[calc(100dvh-64px)] -mx-4 sm:mx-0 sm:h-full lg:flex-row overflow-hidden bg-background">
      {/* Sidebar List */}
      <AnimatePresence initial={false}>
        {(!selectedInquiry || window.innerWidth >= 1024) && (
          <motion.div 
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className={`w-full lg:w-[350px] xl:w-[400px] flex-col border-r border-border bg-card z-10 flex`}
          >
            <div className="p-4 border-b border-border bg-card shrink-0">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold tracking-tight text-foreground">Messages</h1>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
              <div className="relative w-full mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search conversations..."
                  className="pl-9 bg-muted/50 border-border h-10 w-full rounded-xl"
                />
              </div>
              <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
                {(["all", "unread", "active", "archived"] as const).map((tab) => (
                  <Badge 
                    key={tab} 
                    variant={filterTab === tab ? "default" : "secondary"}
                    className={`cursor-pointer rounded-full px-4 text-xs tracking-wide capitalize ${filterTab === tab ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm" : "bg-muted/60 text-muted-foreground hover:bg-muted font-medium border border-border/50"}`}
                    onClick={() => setFilterTab(tab)}
                  >
                    {tab}
                  </Badge>
                ))}
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
              {filteredInquiries.map((inquiry) => {
                const isOnline = Math.random() > 0.5; // Mock online status, can be real if built
                const unreadCount = user?.id === inquiry.buyer_id ? inquiry.buyer_unread_count || 0 : inquiry.seller_unread_count || 0;
                const lastMessageText = inquiry.last_message_text || inquiry.message || `${inquiry.quantity} Units requested`;
                const displayTime = inquiry.last_message_time || inquiry.created_at;

                return (
                  <div
                    key={inquiry.id}
                    onClick={() => setSelectedInquiry(inquiry)}
                    className={`p-4 cursor-pointer transition-all flex gap-3 relative ${selectedInquiry?.id === inquiry.id ? "bg-blue-50 dark:bg-blue-900/20" : "hover:bg-muted/50"}`}
                  >
                    <div className="relative shrink-0">
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg border ${selectedInquiry?.id === inquiry.id ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/50" : "bg-muted text-muted-foreground border-border"}`}>
                        {getOtherParty(inquiry).name.charAt(0).toUpperCase()}
                      </div>
                      {isOnline && (
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-card rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <div className="flex items-center gap-1.5 truncate pr-2">
                          <span className={`font-semibold text-[15px] truncate ${unreadCount > 0 && selectedInquiry?.id !== inquiry.id ? "text-foreground" : "text-foreground/90"}`}>
                            {getOtherParty(inquiry).name}
                          </span>
                          {getOtherParty(inquiry).verified && <VerifiedBadge showText={false} className="shrink-0 px-1 py-1" iconClassName="w-3 h-3 ml-[2px] mr-[2px]" />}
                        </div>
                        <Timestamp 
                          date={displayTime} 
                          className="shrink-0 items-end"
                          relativeClassName={`text-xs whitespace-nowrap ${unreadCount > 0 && selectedInquiry?.id !== inquiry.id ? "text-blue-600 dark:text-blue-400 font-semibold" : "text-muted-foreground"}`}
                          showFull={false}
                        />
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <p className={`text-[13px] truncate pr-2 ${unreadCount > 0 && selectedInquiry?.id !== inquiry.id ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                          {(inquiry.last_message_sender_id === user?.id || (!inquiry.last_message_sender_id && inquiry.buyer_id === user?.id)) && (
                            <CheckCheck className={`inline-block w-3.5 h-3.5 mr-1 ${unreadCount === 0 ? "text-blue-500" : "text-muted-foreground/50"}`} />
                          )}
                          {lastMessageText}
                        </p>
                        {unreadCount > 0 && selectedInquiry?.id !== inquiry.id && (
                          <span className="h-5 min-w-5 shrink-0 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center px-1.5">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 relative ${!selectedInquiry ? 'hidden lg:flex' : 'flex'}`}>
        {!selectedInquiry ? (
           <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-card border-l border-border h-full relative z-10 w-full">
              <div className="w-24 h-24 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-6 border border-blue-100 dark:border-blue-800/30">
                 <MessageSquare className="h-10 w-10 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">OdaMarket Messages</h2>
              <p className="text-muted-foreground max-w-md">
                 Connect with trusted B2B suppliers and buyers. Select a conversation to start messaging.
              </p>
           </div>
        ) : (
          <div className="flex flex-col h-full w-full">
            {/* Chat Header */}
            <div className="h-16 px-4 bg-card border-b border-border flex items-center justify-between shrink-0 z-20 shadow-sm relative">
              <div className="flex items-center gap-3 min-w-0">
                <Button variant="ghost" size="icon" className="lg:hidden shrink-0 -ml-2 text-foreground" onClick={() => setSelectedInquiry(null)}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold shrink-0 border border-blue-200 dark:border-blue-800/50">
                  {getOtherParty(selectedInquiry).name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h3 className="font-semibold text-[16px] text-foreground truncate leading-tight">{getOtherParty(selectedInquiry).name}</h3>
                    {getOtherParty(selectedInquiry).verified && <VerifiedBadge showText={false} className="shrink-0 px-1 py-1" iconClassName="w-3.5 h-3.5 ml-[2px] mr-[2px]" />}
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-500 font-medium truncate leading-tight">
                    {Math.random() > 0.5 ? "Online" : "Last seen recently"}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-blue-600">
                  <Phone className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                  <Search className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hidden sm:inline-flex">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Business Features Sticky Area */}
            <div className="bg-card/95 backdrop-blur-md border-b border-border px-4 py-3 shrink-0 z-10 text-sm shadow-sm relative sticky top-0">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 w-full">
                 <div className="flex items-center gap-3 font-medium flex-wrap">
                    <span className="text-muted-foreground">Inquiry:</span>
                    <span className="text-foreground">#{selectedInquiry.id.split('-').shift()?.toUpperCase() || "INQ-0001"}</span>
                    <span className="text-border mx-1">|</span>
                    <span className="text-muted-foreground">Status:</span>
                    <span className="text-foreground capitalize">{selectedInquiry.status}</span>
                 </div>
                 <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] bg-muted/40 px-3 py-1.5 rounded-lg border border-border/50">
                   <p className="flex items-center gap-1.5"><span className="text-muted-foreground"><FileText className="w-3.5 h-3.5"/></span> <span className="font-medium text-foreground truncate max-w-[150px]">{selectedInquiry.products?.name}</span></p>
                   <p className="flex items-center gap-1.5"><span className="text-muted-foreground">Qty:</span> <span className="font-medium text-foreground">{selectedInquiry.quantity}</span></p>
                 </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 z-0" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')", backgroundBlendMode: "overlay" }}>
               {/* Initial Inquiry Card */}
               <div className="flex justify-center mb-8 relative">
                 <div className="absolute inset-0 flex items-center" aria-hidden="true">
                   <div className="w-full border-t border-border/60"></div>
                 </div>
                 <div className="max-w-[90%] sm:max-w-md bg-white dark:bg-zinc-900 border border-border rounded-xl p-5 shadow-sm text-center relative z-10">
                    <span className="inline-flex items-center justify-center bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-3 border border-blue-200 dark:border-blue-800/50">
                       Initial Request
                    </span>
                    <h4 className="font-semibold text-lg text-foreground mb-1 leading-snug">{selectedInquiry.products?.name}</h4>
                    <p className="text-sm font-medium text-muted-foreground mb-4">{selectedInquiry.quantity} Units requested</p>
                    
                    <div className="bg-muted/30 p-3.5 rounded-lg text-left inline-block w-full border border-border/50 mt-2">
                       <p className="text-[14px] text-foreground/90 whitespace-pre-wrap italic">"{selectedInquiry.message}"</p>
                    </div>
                    <div className="mt-4 flex justify-center">
                      <Timestamp 
                        date={selectedInquiry.created_at} 
                        className="items-center"
                        relativeClassName="text-sm text-muted-foreground"
                        fullClassName="text-xs text-muted-foreground/60 mt-0.5"
                      />
                    </div>
                 </div>
               </div>

               {/* Messages Loop */}
               {inquiryMessages.map((msg, idx) => {
                  const isOwn = msg.sender_id === user?.id;
                  const prevMsg = idx > 0 ? inquiryMessages[idx - 1] : null;
                  const isConsecutive = prevMsg?.sender_id === msg.sender_id;
                  const isRead = msg.is_read;
                  
                  const parsed = parseMessage(msg.message);

                  return (
                    <div key={msg.id} className={`flex flex-col ${isOwn ? "items-end" : "items-start"} ${isConsecutive ? "mt-1" : "mt-3"}`}>
                      {parsed.type === 'quotation' ? (
                         <>
                            {parsed.before?.trim() && (
                               <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm text-[15px] leading-relaxed mb-1 ${isOwn ? "bg-blue-600 text-white rounded-tr-sm" : "bg-white dark:bg-zinc-800 border border-border/50 text-foreground rounded-tl-sm"}`}>
                                  {parsed.before.trim()}
                               </div>
                            )}
                            <QuotationCard data={parsed.data} isOwn={isOwn} />
                            {parsed.after?.trim() && (
                               <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm text-[15px] leading-relaxed mt-1 ${isOwn ? "bg-blue-600 text-white rounded-tr-sm" : "bg-white dark:bg-zinc-800 border border-border/50 text-foreground rounded-tl-sm"}`}>
                                  {parsed.after.trim().split('\n').map((line, i) => (
                                     <span key={i}>{line}<br /></span>
                                  ))}
                               </div>
                            )}
                         </>
                      ) : (
                        <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm text-[15px] leading-relaxed ${isOwn ? "bg-blue-600 text-white rounded-tr-sm" : "bg-white dark:bg-zinc-800 border border-border/50 text-foreground rounded-tl-sm"}`}>
                           <p className="whitespace-pre-wrap">{msg.message}</p>
                        </div>
                      )}
                      
                      {!isConsecutive && (
                         <div className={`mt-1.5 px-1 flex items-center gap-1.5 ${isOwn ? "justify-end" : "justify-start"}`}>
                           <Timestamp 
                             date={msg.created_at} 
                             className="inline-flex"
                             relativeClassName="text-[11px] text-muted-foreground/80 dark:text-muted-foreground/60 font-medium select-none"
                             fullClassName="hidden"
                           />
                           {isOwn && (
                             <CheckCheck className={`w-3.5 h-3.5 ${isRead ? "text-blue-500" : "text-muted-foreground/50"}`} />
                           )}
                         </div>
                      )}
                    </div>
                  );
               })}

               {/* Typing Indicator */}
               {isTyping && (
                  <div className="flex flex-col items-start mt-3">
                     <div className="bg-white dark:bg-zinc-800 border border-border/50 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm w-fit">
                        <div className="flex gap-1 animate-pulse">
                           <div className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                           <div className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                           <div className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce"></div>
                        </div>
                     </div>
                  </div>
               )}

               <div ref={messagesEndRef} className="h-4" />
            </div>

            {/* Chat Input */}
            <div className="bg-card px-3 sm:px-4 auto-rows-min py-3 flex items-end gap-2 border-t border-border z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
               <Button variant="ghost" size="icon" className="h-[44px] w-[44px] rounded-full shrink-0 text-muted-foreground hover:bg-muted hover:text-foreground">
                  <Paperclip className="h-[22px] w-[22px]" />
               </Button>
               <Button variant="ghost" size="icon" className="h-[44px] w-[44px] rounded-full shrink-0 text-muted-foreground hover:bg-muted hover:text-foreground hidden sm:flex">
                  <ImageIcon className="h-[22px] w-[22px]" />
               </Button>
               <div className="flex-1 bg-muted/50 dark:bg-zinc-900/50 border border-border rounded-[22px] flex items-end overflow-hidden focus-within:ring-1 focus-within:ring-blue-500/50 transition-shadow">
                  <Button variant="ghost" size="icon" className="h-[44px] w-[44px] shrink-0 text-muted-foreground hover:text-foreground">
                     <Smile className="h-[22px] w-[22px]" />
                  </Button>
                  <TextareaAutosize
                    value={newMessage}
                    onChange={(e) => {
                      const text = e.target.value;
                      setNewMessage(text);
                      
                      if (activeChannelRef.current && user) {
                        activeChannelRef.current.send({
                          type: 'broadcast',
                          event: 'typing',
                          payload: { sender_id: user.id, isTyping: text.length > 0 }
                        }).catch(console.warn);
                        
                        if (myTypingTimeoutRef.current) clearTimeout(myTypingTimeoutRef.current);
                        if (text.length > 0) {
                          myTypingTimeoutRef.current = setTimeout(() => {
                            if (activeChannelRef.current) {
                              activeChannelRef.current.send({
                                type: 'broadcast',
                                event: 'typing',
                                payload: { sender_id: user.id, isTyping: false }
                              }).catch(console.warn);
                            }
                          }, 2000);
                        }
                      }
                    }}
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
                 onClick={() => {
                   handleSendMessage();
                 }}
                 disabled={!newMessage.trim() || isSending}
                 size="icon"
                 className="h-[44px] w-[44px] rounded-full shrink-0 bg-blue-600 hover:bg-blue-700 text-white shadow-md active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
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
