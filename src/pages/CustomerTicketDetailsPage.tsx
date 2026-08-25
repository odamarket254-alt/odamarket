import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Clock, MessageCircle, FileText, Send, User, AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/useAuthStore";
import { toast } from "sonner";
import { format } from "date-fns";
import { Textarea } from "../components/ui/Textarea";

export default function CustomerTicketDetailsPage() {
  const { id } = useParams(); // id is the ticket_number
  const { user } = useAuthStore();
  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  useEffect(() => {
    fetchTicket();
    
    // Subscribe to new messages for this ticket
    const subscription = supabase
      .channel('public:support_ticket_messages')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'support_ticket_messages' 
      }, payload => {
        // If we have the ticket loaded and the new message belongs to it
        if (ticket && payload.new.ticket_id === ticket.id) {
          setMessages(prev => [...prev, payload.new]);
        } else {
          // If ticket is not fully loaded, just re-fetch
          fetchTicket();
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'support_tickets',
        filter: `ticket_number=eq.${id}`
      }, payload => {
        setTicket(payload.new);
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [id, ticket?.id]); // Re-subscribe if ticket id becomes available

  const fetchTicket = async () => {
    setLoading(true);
    try {
      // 1. Fetch ticket by ticket_number
      const { data: ticketData, error: ticketError } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('ticket_number', id)
        .single();
        
      if (ticketError) {
        if (ticketError.code === 'PGRST116') {
          throw new Error("Ticket not found. Please check the ticket number.");
        }
        throw ticketError;
      }
      
      setTicket(ticketData);

      // 2. Fetch messages
      if (ticketData) {
        const { data: messagesData, error: msgError } = await supabase
          .from('support_ticket_messages')
          .select('*')
          .eq('ticket_id', ticketData.id)
          .order('created_at', { ascending: true });
          
        if (msgError && msgError.code !== '42P01') {
          console.error(msgError);
        } else if (messagesData) {
          setMessages(messagesData);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load ticket.");
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !ticket) return;
    
    setIsReplying(true);
    try {
      const { error } = await supabase.from('support_ticket_messages').insert([
        {
          ticket_id: ticket.id,
          sender_id: user?.id || null,
          is_admin: false,
          message: replyText.trim()
        }
      ]);
      
      if (error) throw error;
      
      // Update ticket status to Open if it was waiting
      if (ticket.status === 'Waiting for Customer' || ticket.status === 'Resolved') {
        await supabase.from('support_tickets')
          .update({ status: 'Open', updated_at: new Date().toISOString() })
          .eq('id', ticket.id);
      } else {
        await supabase.from('support_tickets')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', ticket.id);
      }
      
      setReplyText("");
      toast.success("Reply sent successfully.");
      // Realtime subscription will add it to the UI
    } catch (err: any) {
      toast.error("Failed to send reply. " + err.message);
    } finally {
      setIsReplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 w-full flex items-center justify-center bg-[#FAF5EC] py-20">
        <div className="w-8 h-8 border-4 border-[#C65A28]/30 border-t-[#C65A28] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="flex-1 w-full flex flex-col bg-[#FAF5EC] py-12 md:py-20">
        <div className="max-w-2xl mx-auto px-4 w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-[#3A2418] mb-4">Ticket Not Found</h1>
          <p className="text-[#5F5A54] mb-8">{error || "The ticket you're looking for doesn't exist or you don't have access to it."}</p>
          <Link to="/help-center/track" className="bg-[#C65A28] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#A84A1E] transition-colors inline-flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" /> Go Back
          </Link>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'waiting for customer': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col bg-[#FAF5EC]">
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 md:py-12">
        
        <div className="mb-6">
          <Link to="/help-center" className="text-[#8B857D] hover:text-[#C65A28] transition-colors inline-flex items-center gap-2 font-medium text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Help Center
          </Link>
        </div>

        {/* Ticket Header */}
        <div className="bg-white p-6 md:p-8 rounded-t-2xl border border-[#E8DCC9] shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-2xl md:text-3xl font-bold text-[#3A2418]">{ticket.subject}</h1>
              <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border ${getStatusColor(ticket.status)}`}>
                {ticket.status}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-[#8B857D]">
              <span className="flex items-center gap-1"><FileText className="w-4 h-4" /> {ticket.ticket_number}</span>
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {format(new Date(ticket.created_at), 'MMM d, yyyy h:mm a')}</span>
              {ticket.order_id && (
                <span className="flex items-center gap-1 font-medium text-[#C65A28]">
                  Order: {ticket.order_id}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Conversation Thread */}
        <div className="bg-white border-x border-b border-[#E8DCC9] shadow-sm flex flex-col">
          
          <div className="p-6 md:p-8 space-y-8 flex-1 overflow-y-auto bg-gray-50/50">
            {/* Original Request */}
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-[#E8DCC9] flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-[#8B857D]" />
              </div>
              <div className="flex-1">
                <div className="bg-white border border-[#E8DCC9] p-5 rounded-2xl rounded-tl-sm shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-[#3A2418]">{ticket.customer_name}</span>
                    <span className="text-xs text-[#8B857D]">{format(new Date(ticket.created_at), 'h:mm a')}</span>
                  </div>
                  <div className="text-[#5F5A54] whitespace-pre-wrap">{ticket.description}</div>
                </div>
              </div>
            </div>

            {/* Replies */}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-4 ${msg.is_admin ? '' : ''}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${msg.is_admin ? 'bg-[#3A2418]' : 'bg-[#E8DCC9]'}`}>
                  {msg.is_admin ? (
                    <MessageCircle className="w-5 h-5 text-white" />
                  ) : (
                    <User className="w-5 h-5 text-[#8B857D]" />
                  )}
                </div>
                <div className="flex-1">
                  <div className={`border p-5 rounded-2xl shadow-sm ${msg.is_admin ? 'bg-[#FAF5EC] border-[#E8DCC9] rounded-tl-sm' : 'bg-white border-[#E8DCC9] rounded-tl-sm'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-[#3A2418]">{msg.is_admin ? 'ODA Market Support' : ticket.customer_name}</span>
                      <span className="text-xs text-[#8B857D]">{format(new Date(msg.created_at), 'MMM d, h:mm a')}</span>
                    </div>
                    <div className="text-[#5F5A54] whitespace-pre-wrap">{msg.message}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Reply Box */}
          {ticket.status !== 'Closed' ? (
            <div className="p-6 md:p-8 border-t border-[#E8DCC9] bg-white rounded-b-2xl">
              <form onSubmit={handleReply}>
                <label className="block text-sm font-bold text-[#3A2418] mb-3">Add a reply</label>
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your message here..."
                  className="min-h-[120px] mb-4"
                  required
                />
                <div className="flex justify-end">
                  <button 
                    type="submit"
                    disabled={isReplying || !replyText.trim()}
                    className="bg-[#C65A28] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#A84A1E] transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isReplying ? (
                       <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Send Reply
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="p-6 md:p-8 border-t border-[#E8DCC9] bg-[#FAF5EC] rounded-b-2xl text-center">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="font-medium text-[#3A2418]">This ticket has been closed.</p>
              <p className="text-sm text-[#5F5A54] mt-1">If you need further assistance, please submit a new support request.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
