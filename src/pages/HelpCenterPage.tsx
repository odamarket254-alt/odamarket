import React, { useState } from "react";
import { Search, ChevronDown, HelpCircle, ShoppingBag, CreditCard, Truck, RefreshCcw, User, MessageCircle, FileText, ArrowRight } from "lucide-react";
import { getWhatsAppLink } from "../utils/whatsapp";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/useAuthStore";
import { toast } from "sonner";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";

export default function HelpCenterPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  
  // Support Form State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.user_metadata?.first_name ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim() : "",
    email: user?.email || "",
    phone: user?.user_metadata?.phone || "",
    order_id: "",
    category: "Order Issue",
    subject: "",
    description: ""
  });

  const categories = [
    { icon: ShoppingBag, title: "Ordering", desc: "How to place & manage orders" },
    { icon: CreditCard, title: "Payment", desc: "M-Pesa, Cards & issues" },
    { icon: Truck, title: "Delivery", desc: "Tracking & shipping costs" },
    { icon: RefreshCcw, title: "Returns", desc: "Refunds & return policies" },
    { icon: User, title: "Account", desc: "Manage profile & settings" },
    { icon: HelpCircle, title: "Other", desc: "General platform inquiries" },
  ];

  const issueCategories = [
    "Order Issue",
    "Payment Issue",
    "Delivery Issue",
    "Product Issue",
    "Return / Refund",
    "Account Issue",
    "Supplier Issue",
    "Technical Issue",
    "Other"
  ];

  const faqs = [
    { q: "Where is my order?", a: "Click on 'Track Order' at the top of the page and enter your Order ID." },
    { q: "How do I make a payment?", a: "We accept M-Pesa and all major credit/debit cards during checkout." },
    { q: "How can I cancel my order?", a: "You can cancel your order within 30 minutes of placing it from your account dashboard, or contact support." },
    { q: "How do I request a refund?", a: "If an item is defective or missing, submit a support request with your order number and we will process a refund." },
    { q: "How do I contact a supplier?", a: "For wholesale orders, you can message verified suppliers directly from their product pages." },
    { q: "Why has my order not been confirmed?", a: "If you paid via M-Pesa, ensure the transaction was completed. If the issue persists, submit a support ticket below." }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Generate a ticket number
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomStr = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const ticketNumber = `ODA-${dateStr}-${randomStr}`;

      const { data, error } = await supabase.from('support_tickets').insert([
        {
          ticket_number: ticketNumber,
          customer_id: user?.id || null,
          customer_name: formData.name,
          customer_email: formData.email,
          customer_phone: formData.phone,
          order_id: formData.order_id || null,
          category: formData.category,
          subject: formData.subject,
          description: formData.description,
          message: formData.description,
          status: 'Open',
          priority: 'Normal'
        }
      ]);

      if (error) {
        // Handle case where table doesn't exist yet
        if (error.code === '42P01') {
           toast.error("Support system is currently undergoing maintenance. Please use WhatsApp.");
           return;
        }
        throw error;
      }

      toast.success("Support request submitted successfully!");
      if (user) {
        navigate(`/help-center/ticket/${ticketNumber}`);
      } else {
        // Guests can't view tickets directly in the portal without auth
        setFormData({ name: '', email: '', phone: '', order_id: '', category: 'General Inquiry', subject: '', description: '' });
      }

    } catch (error: any) {
      console.error('Error submitting ticket:', error);
      toast.error(error.message || "Failed to submit request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col bg-[#FAF5EC]">
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-[#3A2418] mb-4">How can we help you?</h1>
          <p className="text-[#5F5A54] text-lg max-w-2xl mx-auto mb-8">
            Search our knowledge base or browse categories below to find answers to your questions.
          </p>
          
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B857D] w-5 h-5" />
            <input
              type="text"
              placeholder="Search for articles, questions, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-[#E8DCC9] rounded-2xl shadow-sm text-[#3A2418] focus:outline-none focus:border-[#C65A28] focus:ring-1 focus:ring-[#C65A28] text-lg"
            />
          </div>
        </div>

        {/* Support Categories */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-16">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <button 
                key={idx} 
                className="bg-white p-6 rounded-2xl border border-[#E8DCC9] shadow-sm hover:shadow-md hover:border-[#C65A28]/50 transition-all text-left group"
              >
                <div className="w-12 h-12 bg-[#FAF5EC] rounded-xl flex items-center justify-center text-[#C65A28] mb-4 group-hover:bg-[#C65A28] group-hover:text-white transition-colors">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-[#3A2418] mb-1 text-lg">{cat.title}</h3>
                <p className="text-sm text-[#5F5A54]">{cat.desc}</p>
              </button>
            );
          })}
        </div>

        {/* FAQs */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-[#3A2418] mb-6">Frequently Asked Questions</h2>
          <div className="bg-white rounded-2xl border border-[#E8DCC9] shadow-sm overflow-hidden divide-y divide-[#E8DCC9]">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-white">
                <button 
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[#FAF5EC] transition-colors"
                >
                  <span className="font-bold text-[#3A2418]">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-[#8B857D] transition-transform duration-300 ${openFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${openFaq === idx ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
                >
                  <div className="px-6 pb-5 pt-2 text-[#5F5A54] leading-relaxed border-t border-[#E8DCC9]/50">
                    {faq.a}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Support Section */}
        <div className="bg-white rounded-2xl border border-[#E8DCC9] shadow-sm overflow-hidden">
          {!showForm ? (
            <div className="p-8 md:p-12 text-center">
              <div className="w-16 h-16 bg-[#FAF5EC] rounded-full flex items-center justify-center mx-auto mb-6 text-[#C65A28]">
                <MessageCircle className="w-8 h-8" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-[#3A2418] mb-4">Still need help?</h2>
              <p className="text-[#5F5A54] text-lg max-w-xl mx-auto mb-8">
                Tell us what went wrong and our support team will get back to you as soon as possible.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button 
                  onClick={() => {
                    if (user) {
                      setShowForm(true);
                    } else {
                      toast.error("Please log in to submit a support ticket.");
                      navigate("/login");
                    }
                  }}
                  className="bg-[#C65A28] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#A84A1E] transition-colors flex items-center gap-2 w-full sm:w-auto justify-center"
                >
                  <FileText className="w-5 h-5" /> Contact ODA Market Support
                </button>
                <a 
                  href={getWhatsAppLink("Hello ODA Market Support, I need help with my account/order.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#FAF5EC] text-[#C65A28] border border-[#E8DCC9] px-8 py-3 rounded-xl font-bold hover:bg-[#E8DCC9] transition-colors flex items-center gap-2 w-full sm:w-auto justify-center"
                >
                  <MessageCircle className="w-5 h-5" /> Chat on WhatsApp
                </a>
              </div>
            </div>
          ) : (
            <div className="p-6 md:p-10">
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-[#E8DCC9]">
                <div>
                  <h2 className="text-2xl font-bold text-[#3A2418]">Submit a Support Request</h2>
                  <p className="text-[#5F5A54] mt-1">Please fill in the details below so we can assist you better.</p>
                </div>
                <button 
                  onClick={() => setShowForm(false)}
                  className="text-[#8B857D] hover:text-[#3A2418] transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSubmitTicket} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[#3A2418] mb-2">Full Name *</label>
                    <Input 
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#3A2418] mb-2">Email Address *</label>
                    <Input 
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#3A2418] mb-2">Phone Number</label>
                    <Input 
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+254 700 000000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#3A2418] mb-2">Order Number (Optional)</label>
                    <Input 
                      name="order_id"
                      value={formData.order_id}
                      onChange={handleInputChange}
                      placeholder="e.g. ODA-12345"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[#3A2418] mb-2">Issue Category *</label>
                    <select
                      name="category"
                      required
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {issueCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#3A2418] mb-2">Subject *</label>
                    <Input 
                      name="subject"
                      required
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="Brief description of the issue"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#3A2418] mb-2">Describe Your Issue *</label>
                  <Textarea 
                    name="description"
                    required
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Please provide as much detail as possible..."
                    className="min-h-[150px]"
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#C65A28] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#A84A1E] transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : (
                      <>Submit Support Request <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
        
        {/* Track existing ticket link */}
        <div className="mt-8 text-center">
          <Link to="/help-center/track" className="text-[#C65A28] font-semibold hover:underline flex items-center justify-center gap-2">
            Check status of an existing ticket <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}
