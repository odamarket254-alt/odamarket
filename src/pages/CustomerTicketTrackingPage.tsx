import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowRight, Ticket, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { Input } from "../components/ui/Input";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/useAuthStore";
import { toast } from "sonner";

export default function CustomerTicketTrackingPage() {
  const [ticketNumber, setTicketNumber] = useState("");
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [myTickets, setMyTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMyTickets();
    }
  }, [user]);

  const fetchMyTickets = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('customer_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code !== '42P01') throw error;
      } else {
        setMyTickets(data || []);
      }
    } catch (err: any) {
      console.error('Error fetching tickets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please log in to track your support ticket.");
      navigate("/login");
      return;
    }
    if (ticketNumber.trim()) {
      navigate(`/help-center/ticket/${ticketNumber.trim()}`);
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col bg-[#FAF5EC]">
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-12 md:py-20 space-y-12">
        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-[#E8DCC9] text-center max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-[#FAF5EC] rounded-full flex items-center justify-center mx-auto mb-6 text-[#C65A28]">
            <Search className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-[#3A2418] mb-4">Track Your Support Ticket</h1>
          <p className="text-[#5F5A54] text-lg mb-8">
            Enter your ticket number below to check its status or reply to our support team.
          </p>
          <form onSubmit={handleTrack} className="max-w-md mx-auto space-y-4">
            <div className="relative text-left">
              <label className="block text-sm font-medium text-[#3A2418] mb-2">Ticket Number</label>
              <div className="relative">
                <Input
                  value={ticketNumber}
                  onChange={(e) => setTicketNumber(e.target.value)}
                  placeholder="e.g. ODA-20231120-123"
                  className="pl-11 h-[52px]"
                  required
                />
                <Ticket className="w-5 h-5 text-[#8B857D] absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>
            <button
              type="submit"
              className="w-full h-[52px] bg-[#3A2418] hover:bg-[#3A2418]/90 text-white rounded-[12px] font-bold text-lg flex items-center justify-center gap-2 transition-colors"
            >
              Track Ticket <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </div>

        {user && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#E8DCC9]">
            <h2 className="text-2xl font-bold text-[#3A2418] mb-6 flex items-center gap-2">
              <Ticket className="w-6 h-6 text-[#C65A28]" /> My Tickets
            </h2>
            
            {isLoading ? (
              <div className="text-center py-8 text-[#8B857D]">Loading your tickets...</div>
            ) : myTickets.length > 0 ? (
              <div className="space-y-4">
                {myTickets.map((ticket) => (
                  <div 
                    key={ticket.id} 
                    onClick={() => navigate(`/help-center/ticket/${ticket.ticket_number}`)}
                    className="border border-[#E8DCC9] rounded-xl p-5 hover:bg-[#FAF5EC] cursor-pointer transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold text-[#3A2418]">{ticket.ticket_number}</span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize flex items-center gap-1
                          ${ticket.status === 'Open' ? 'bg-amber-100 text-amber-800' : 
                            ticket.status === 'Resolved' || ticket.status === 'Closed' ? 'bg-emerald-100 text-emerald-800' : 
                            'bg-blue-100 text-blue-800'}`}
                        >
                          {ticket.status === 'Resolved' || ticket.status === 'Closed' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {ticket.status}
                        </span>
                      </div>
                      <h3 className="font-bold text-[16px] text-[#3A2418] mb-1">{ticket.subject}</h3>
                      <p className="text-sm text-[#5F5A54] line-clamp-1">{ticket.description}</p>
                    </div>
                    <div className="flex items-center justify-between md:flex-col md:items-end gap-2 text-sm text-[#8B857D] whitespace-nowrap">
                      <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-[#E8DCC9] rounded-xl bg-[#FAF5EC]/50">
                <Ticket className="w-12 h-12 text-[#D3C4A5] mx-auto mb-4" />
                <h3 className="text-[#3A2418] font-bold text-lg mb-2">No tickets found</h3>
                <p className="text-[#5F5A54] mb-6">You haven't submitted any support tickets yet.</p>
                <button 
                  onClick={() => navigate('/help-center')}
                  className="bg-[#C65A28] text-white px-6 py-2.5 rounded-lg font-bold hover:bg-[#b04f23] transition-colors"
                >
                  Create Ticket
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
