import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { formatDistanceToNow, format } from "date-fns";
import { 
  Loader2, Mail, CheckCircle, Search, Filter, 
  Clock, AlertCircle, MessageCircle, Send,
  User, Package, ChevronRight, ArrowLeft
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { toast } from "sonner";
import { useAuthStore } from "../../store/useAuthStore";
import { Link } from "react-router-dom";

export default function AdminSupportPage() {
  const { user, profile } = useAuthStore();
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  
  // Selected Ticket State
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchTickets();
    
    const subscription = supabase
      .channel('admin_support_tickets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, () => {
        fetchTickets();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_ticket_messages' }, payload => {
        if (selectedTicket && payload.new.ticket_id === selectedTicket.id) {
          setMessages(prev => [...prev, payload.new]);
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [selectedTicket?.id]);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error && error.code !== '42P01') throw error;
      setTickets(data || []);
    } catch (error: any) {
      console.error("Error fetching tickets:", error);
      toast.error("Failed to load tickets");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from('support_ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });
        
      if (error && error.code !== '42P01') throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleSelectTicket = (ticket: any) => {
    setSelectedTicket(ticket);
    fetchMessages(ticket.id);
  };

  const handleBackToList = () => {
    setSelectedTicket(null);
    setMessages([]);
    setReplyText("");
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;
    
    setIsReplying(true);
    try {
      const { error } = await supabase.from('support_ticket_messages').insert([
        {
          ticket_id: selectedTicket.id,
          sender_id: user?.id,
          is_admin: true,
          message: replyText.trim()
        }
      ]);
      
      if (error) throw error;
      
      // Update ticket status automatically to 'Waiting for Customer'
      if (selectedTicket.status === 'Open' || selectedTicket.status === 'In Progress') {
        await updateTicketStatus(selectedTicket.id, 'Waiting for Customer');
      } else {
        await supabase.from('support_tickets')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', selectedTicket.id);
      }
      
      setReplyText("");
      toast.success("Reply sent to customer");
    } catch (err: any) {
      toast.error("Failed to send reply. " + err.message);
    } finally {
      setIsReplying(false);
    }
  };

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      const updateData: any = { 
        status: newStatus, 
        updated_at: new Date().toISOString() 
      };
      
      if (newStatus === 'Resolved' || newStatus === 'Closed') {
        updateData.resolved_at = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from('support_tickets')
        .update(updateData)
        .eq('id', ticketId);
        
      if (error) throw error;
      
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, ...updateData });
      }
      
      toast.success(`Ticket marked as ${newStatus}`);
    } catch (err: any) {
      toast.error("Failed to update status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open': return 'bg-yellow-100 text-yellow-800';
      case 'in progress': return 'bg-blue-100 text-blue-800';
      case 'waiting for customer': return 'bg-orange-100 text-orange-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.ticket_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.order_id?.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === "All" || ticket.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    open: tickets.filter(t => t.status === 'Open').length,
    inProgress: tickets.filter(t => t.status === 'In Progress').length,
    waiting: tickets.filter(t => t.status === 'Waiting for Customer').length,
    resolved: tickets.filter(t => t.status === 'Resolved' && new Date(t.resolved_at).toDateString() === new Date().toDateString()).length,
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-[#C65A28] animate-spin" />
      </div>
    );
  }

  // DETAILS VIEW
  if (selectedTicket) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button 
            onClick={handleBackToList}
            className="text-[#8B857D] hover:text-[#C65A28] transition-colors flex items-center gap-2 font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Tickets
          </button>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${getStatusColor(selectedTicket.status)}`}>
              {selectedTicket.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Conversation Area */}
          <div className="lg:col-span-2 space-y-6 flex flex-col h-[calc(100vh-180px)]">
            <Card className="flex-1 flex flex-col overflow-hidden">
              <CardHeader className="bg-gray-50/50 border-b pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{selectedTicket.subject}</CardTitle>
                    <div className="text-sm text-gray-500 mt-1 flex items-center gap-4">
                      <span>{selectedTicket.ticket_number}</span>
                      <span>{format(new Date(selectedTicket.created_at), 'MMM d, yyyy h:mm a')}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30">
                {/* Original Ticket */}
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-blue-700">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-white border p-4 rounded-2xl rounded-tl-sm shadow-sm">
                      <div className="flex justify-between mb-2">
                        <span className="font-bold text-gray-900">{selectedTicket.customer_name}</span>
                        <span className="text-xs text-gray-500">{format(new Date(selectedTicket.created_at), 'h:mm a')}</span>
                      </div>
                      <div className="text-gray-700 whitespace-pre-wrap">{selectedTicket.description}</div>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                {messages.map((msg) => (
                  <div key={msg.id} className="flex gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${msg.is_admin ? 'bg-[#3A2418] text-white' : 'bg-blue-100 text-blue-700'}`}>
                      {msg.is_admin ? <MessageCircle className="w-5 h-5" /> : <User className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <div className={`border p-4 rounded-2xl shadow-sm ${msg.is_admin ? 'bg-[#FAF5EC] border-[#E8DCC9] rounded-tl-sm' : 'bg-white rounded-tl-sm'}`}>
                        <div className="flex justify-between mb-2">
                          <span className="font-bold text-gray-900">{msg.is_admin ? 'ODA Market Support' : selectedTicket.customer_name}</span>
                          <span className="text-xs text-gray-500">{format(new Date(msg.created_at), 'MMM d, h:mm a')}</span>
                        </div>
                        <div className="text-gray-700 whitespace-pre-wrap">{msg.message}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>

              <div className="p-4 border-t bg-white">
                <form onSubmit={handleReply}>
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your response to the customer..."
                    className="min-h-[100px] mb-3"
                    disabled={selectedTicket.status === 'Closed'}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => updateTicketStatus(selectedTicket.id, 'In Progress')}
                        disabled={isUpdatingStatus || selectedTicket.status === 'In Progress' || selectedTicket.status === 'Closed'}
                        className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md font-medium disabled:opacity-50 transition-colors"
                      >
                        In Progress
                      </button>
                      <button
                        type="button"
                        onClick={() => updateTicketStatus(selectedTicket.id, 'Resolved')}
                        disabled={isUpdatingStatus || selectedTicket.status === 'Resolved' || selectedTicket.status === 'Closed'}
                        className="px-3 py-1.5 text-sm bg-green-50 text-green-700 hover:bg-green-100 rounded-md font-medium disabled:opacity-50 transition-colors"
                      >
                        Resolve
                      </button>
                      <button
                        type="button"
                        onClick={() => updateTicketStatus(selectedTicket.id, 'Closed')}
                        disabled={isUpdatingStatus || selectedTicket.status === 'Closed'}
                        className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md font-medium disabled:opacity-50 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                    <button
                      type="submit"
                      disabled={isReplying || !replyText.trim() || selectedTicket.status === 'Closed'}
                      className="bg-[#C65A28] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#A84A1E] transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {isReplying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Send Reply
                    </button>
                  </div>
                </form>
              </div>
            </Card>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm text-gray-500 uppercase tracking-wider">Customer Info</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{selectedTicket.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <a href={`mailto:${selectedTicket.customer_email}`} className="font-medium text-blue-600 hover:underline">{selectedTicket.customer_email}</a>
                </div>
                {selectedTicket.customer_phone && (
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{selectedTicket.customer_phone}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm text-gray-500 uppercase tracking-wider">Ticket Info</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Category</p>
                  <p className="font-medium">{selectedTicket.category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Priority</p>
                  <Badge variant={selectedTicket.priority === 'High' || selectedTicket.priority === 'Urgent' ? 'destructive' : 'secondary'}>
                    {selectedTicket.priority || 'Normal'}
                  </Badge>
                </div>
                {selectedTicket.order_id && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Related Order</p>
                    <Link to="/admin/dashboard/orders" className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
                      <Package className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-sm">{selectedTicket.order_id}</span>
                      <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Support</h1>
          <p className="text-gray-500">Manage customer inquiries and support tickets.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-yellow-50/50 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-yellow-800">Open</h3>
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-3xl font-bold text-yellow-900">{stats.open}</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50/50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-blue-800">In Progress</h3>
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-blue-900">{stats.inProgress}</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-50/50 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-orange-800">Waiting</h3>
              <MessageCircle className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-orange-900">{stats.waiting}</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50/50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-green-800">Resolved Today</h3>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-900">{stats.resolved}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <div className="p-4 border-b flex flex-col sm:flex-row gap-4 items-center justify-between bg-gray-50/50">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search tickets, customers, orders..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border-gray-300 rounded-md bg-white p-2 border focus:ring-[#C65A28] focus:border-[#C65A28]"
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Waiting for Customer">Waiting for Customer</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredTickets.length > 0 ? (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-4 font-medium">Ticket</th>
                  <th className="px-6 py-4 font-medium">Customer</th>
                  <th className="px-6 py-4 font-medium">Subject & Category</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Created</th>
                  <th className="px-6 py-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTickets.map((ticket) => (
                  <tr 
                    key={ticket.id} 
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleSelectTicket(ticket)}
                  >
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{ticket.ticket_number}</span>
                      {ticket.priority === 'High' || ticket.priority === 'Urgent' ? (
                        <div className="text-[10px] text-red-600 font-bold uppercase mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {ticket.priority}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{ticket.customer_name}</div>
                      <div className="text-gray-500">{ticket.customer_email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 line-clamp-1">{ticket.subject}</div>
                      <div className="text-gray-500">{ticket.category}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        className="text-[#C65A28] hover:text-[#A84A1E] font-medium text-sm"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-16 px-4">
              <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No tickets found</h3>
              <p className="text-gray-500 mt-1">There are no support tickets matching your current filters.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
