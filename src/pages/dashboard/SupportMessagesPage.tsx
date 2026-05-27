import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Mail, CheckCircle, Search } from "lucide-react";
import { Card, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { toast } from "sonner";

interface SupportMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "unread" | "read" | "resolved";
  created_at: string;
}

export default function SupportMessagesPage() {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      // Create table if it doesn't exist to avoid crashing
      const { data, error } = await supabase
        .from("support_messages")
        .select("*")
        .order("created_at", { ascending: false });

      // Handle table not existing gracefully
      if (error && error.code !== '42P01') {
        throw error;
      }
      
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching support messages", error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string, currentStatus: string) => {
    if (currentStatus !== 'unread') return;
    
    try {
      const { error } = await supabase
        .from("support_messages")
        .update({ status: 'read' })
        .eq('id', id);

      if (error) throw error;
      
      setMessages(messages.map(msg => 
        msg.id === id ? { ...msg, status: 'read' } : msg
      ));
    } catch(err) {
      console.error("Error updating status", err);
    }
  };

  const markAsResolved = async (id: string) => {
    try {
      const { error } = await supabase
        .from("support_messages")
        .update({ status: 'resolved' })
        .eq('id', id);

      if (error) throw error;
      
      setMessages(messages.map(msg => 
        msg.id === id ? { ...msg, status: 'resolved' } : msg
      ));
      if (selectedMessage?.id === id) {
        setSelectedMessage({ ...selectedMessage, status: 'resolved' });
      }
      toast.success("Message marked as resolved");
    } catch(err) {
      console.error("Error resolving", err);
      toast.error("Failed to update status");
    }
  };

  const filteredMessages = messages.filter(
    (msg) =>
      msg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Support Messages</h1>
          <p className="text-muted-foreground">Manage messages sent from the Contact Us page.</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-3 gap-6 min-h-0">
        {/* Messages List */}
        <div className={`lg:col-span-1 border border-border bg-muted/50 text-foreground backdrop-blur-sm rounded-lg overflow-y-auto flex-1 lg:h-full ${selectedMessage ? 'hidden lg:block' : 'block'}`}>
          <div className="p-4 border-b border-border/50 sticky top-0 bg-muted/90 backdrop-blur-md z-10 space-y-4">
             <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
               <Input 
                 placeholder="Search messages..." 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="pl-9 bg-background/50 border-border"
               />
             </div>
          </div>
          
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No messages found.
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {filteredMessages.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => {
                    setSelectedMessage(msg);
                    markAsRead(msg.id, msg.status);
                  }}
                  className={`p-4 cursor-pointer hover:bg-muted/80 transition-colors ${
                    selectedMessage?.id === msg.id ? "bg-muted border-l-2 border-emerald-500" : ""
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={`font-medium text-sm truncate pr-2 ${msg.status === 'unread' ? 'text-foreground font-semibold' : 'text-foreground/80'}`}>
                      {msg.subject || "No Subject"}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mb-2">{msg.email}</p>
                  <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      {msg.status === 'unread' && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                      {msg.status === 'resolved' && <CheckCircle className="h-3 w-3 text-emerald-500" />}
                      {msg.status.toUpperCase()}
                    </span>
                    <span>{formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Message Detail */}
        <div className={`lg:col-span-2 flex flex-col flex-1 lg:h-full ${selectedMessage ? 'flex' : 'hidden lg:flex'}`}>
          {selectedMessage ? (
            <Card className="flex flex-col flex-1 border-border bg-muted/50 text-foreground backdrop-blur-sm overflow-hidden">
              <CardContent className="flex flex-col flex-1 p-4 sm:p-8 overflow-hidden">
                <div className="flex justify-between items-start mb-6 shrink-0">
                  <div className="flex-1">
                     <div className="flex items-center gap-4 mb-4">
                       <Button variant="ghost" size="sm" className="lg:hidden p-0 h-8 w-8 text-muted-foreground" onClick={() => setSelectedMessage(null)}>
                         <span className="font-bold text-lg">&larr;</span>
                       </Button>
                       <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                         {selectedMessage.subject || "No Subject"}
                       </h2>
                     </div>
                     <div className="flex items-center gap-3">
                       <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
                         <span className="text-blue-500 font-bold text-lg">{selectedMessage.name.charAt(0).toUpperCase()}</span>
                       </div>
                       <div>
                         <p className="text-sm font-semibold text-foreground">{selectedMessage.name}</p>
                         <p className="text-xs text-muted-foreground">
                            <a href={`mailto:${selectedMessage.email}`} className="hover:text-emerald-500 hover:underline">
                              {selectedMessage.email}
                            </a>
                         </p>
                       </div>
                     </div>
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end gap-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(selectedMessage.created_at).toLocaleString()}
                    </span>
                    <Badge variant={selectedMessage.status === 'resolved' ? "secondary" : selectedMessage.status === 'unread' ? "default" : "outline"}>
                      {selectedMessage.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <div className="bg-black/20 border border-border/50 rounded-xl p-5 mb-6 flex-1 overflow-y-auto">
                  <p className="text-foreground/90 whitespace-pre-line leading-relaxed text-sm">
                    {selectedMessage.message}
                  </p>
                </div>
                
                <div className="pt-4 border-t border-border/50 flex justify-end gap-3 shrink-0">
                   <Button 
                     variant="outline" 
                     className="bg-transparent border-border"
                     render={<a href={`mailto:${selectedMessage.email}?subject=RE: ${selectedMessage.subject}`} target="_top" rel="noopener noreferrer" />}
                   >
                     Reply via Email
                   </Button>
                   <Button
                     className="bg-emerald-600 hover:bg-emerald-500 text-white"
                     disabled={selectedMessage.status === 'resolved'}
                     onClick={() => markAsResolved(selectedMessage.id)}
                   >
                     <CheckCircle className="h-4 w-4 mr-2" />
                     {selectedMessage.status === 'resolved' ? 'Resolved' : 'Mark as Resolved'}
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
                <h3 className="text-lg font-semibold text-foreground">
                  Select a message
                </h3>
                <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                  Choose a message from the list to view details and respond.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
