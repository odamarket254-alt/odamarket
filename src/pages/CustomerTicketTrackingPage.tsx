import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowRight, Ticket, AlertCircle } from "lucide-react";
import { Input } from "../components/ui/Input";

export default function CustomerTicketTrackingPage() {
  const [ticketNumber, setTicketNumber] = useState("");
  const navigate = useNavigate();

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticketNumber.trim()) {
      navigate(`/help-center/ticket/${ticketNumber.trim()}`);
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col bg-[#FAF5EC]">
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-12 md:py-20">
        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-[#E8DCC9] text-center">
          <div className="w-16 h-16 bg-[#FAF5EC] rounded-full flex items-center justify-center mx-auto mb-6 text-[#C65A28]">
            <Ticket className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-[#3A2418] mb-4">Track Your Support Ticket</h1>
          <p className="text-[#5F5A54] text-lg mb-8 max-w-lg mx-auto">
            Enter your ticket number below to check its status or reply to our support team.
          </p>

          <form onSubmit={handleTrack} className="max-w-md mx-auto space-y-4">
            <div className="relative text-left">
              <label className="block text-sm font-medium text-[#3A2418] mb-2">Ticket Number</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B857D] w-5 h-5" />
                <Input 
                  value={ticketNumber}
                  onChange={(e) => setTicketNumber(e.target.value)}
                  placeholder="e.g. ODA-20260825-001"
                  className="pl-10 py-6"
                  required
                />
              </div>
            </div>
            <button 
              type="submit"
              disabled={!ticketNumber.trim()}
              className="w-full bg-[#C65A28] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#A84A1E] transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              Track Ticket <ArrowRight className="w-4 h-4" />
            </button>
          </form>
          
          <div className="mt-8 pt-8 border-t border-[#E8DCC9]">
            <div className="flex items-start gap-3 p-4 bg-[#FAF5EC] rounded-xl text-left">
              <AlertCircle className="w-5 h-5 text-[#8B857D] shrink-0 mt-0.5" />
              <p className="text-sm text-[#5F5A54]">
                You can find your ticket number on the confirmation page after submitting your request, or in the email we sent you.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
