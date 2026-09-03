import React, { useState, useEffect } from "react";
import { Gift, Star, Award, TrendingUp, History } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/useAuthStore";
import { toast } from "sonner";

interface RewardTransaction {
  id: string;
  points: number;
  transaction_type: string;
  description: string;
  created_at: string;
}

export default function RewardsPage() {
  const { user } = useAuthStore();
  const [points, setPoints] = useState(0);
  const [transactions, setTransactions] = useState<RewardTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRewards();
    }
  }, [user]);

  const fetchRewards = async () => {
    try {
      const { data, error } = await supabase
        .from('reward_points')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error && error.code !== '42P01') {
        throw error;
      }
      
      const history = data || [];
      setTransactions(history);
      
      // Calculate balance
      const balance = history.reduce((acc, curr) => acc + curr.points, 0);
      setPoints(balance);

    } catch (err: any) {
      console.error("Error fetching rewards", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-[#3A2418]">My Rewards</h1>
        <p className="text-[#5F5A54]">Earn points on every purchase and redeem them for discounts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-gradient-to-br from-[#3A2418] to-[#5F5A54] rounded-2xl p-8 text-white relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Award className="w-48 h-48" />
          </div>
          <div className="relative z-10">
            <h2 className="text-xl font-medium text-white/80 mb-2">Available Points Balance</h2>
            <div className="flex items-end gap-3 mb-6">
              <span className="text-6xl font-black">{isLoading ? '...' : points.toLocaleString()}</span>
              <span className="text-xl font-bold text-[#D3C4A5] mb-2">pts</span>
            </div>
            <p className="text-white/70 max-w-sm">
              Use your points at checkout to get discounts. 100 points = Ksh 100 discount.
            </p>
          </div>
        </div>

        <div className="bg-white border border-[#E8DCC9] rounded-2xl p-6 shadow-sm flex flex-col justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-[#FAF5EC] flex items-center justify-center mx-auto mb-4 text-[#C65A28]">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-[#3A2418] text-lg mb-2">How to earn</h3>
          <p className="text-[#5F5A54] text-sm">
            Earn 1 point for every Ksh 1,000 spent on eligible orders. Points are credited upon delivery.
          </p>
        </div>
      </div>

      <div className="bg-white border border-[#E8DCC9] rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#E8DCC9] flex items-center gap-2">
          <History className="w-5 h-5 text-[#C65A28]" />
          <h2 className="text-lg font-bold text-[#3A2418]">Points History</h2>
        </div>
        
        {isLoading ? (
          <div className="text-center py-12 text-[#8B857D]">Loading history...</div>
        ) : transactions.length > 0 ? (
          <div className="divide-y divide-[#E8DCC9]">
            {transactions.map((tx) => (
              <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-[#FAF5EC]/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${tx.points > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                    {tx.points > 0 ? <Gift className="w-5 h-5" /> : <Star className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-[#3A2418]">{tx.transaction_type}</h4>
                    <p className="text-sm text-[#5F5A54]">{tx.description}</p>
                    <p className="text-xs text-[#8B857D] mt-1">{new Date(tx.created_at).toLocaleDateString()} {new Date(tx.created_at).toLocaleTimeString()}</p>
                  </div>
                </div>
                <div className={`font-black text-lg ${tx.points > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {tx.points > 0 ? '+' : ''}{tx.points}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Gift className="w-12 h-12 text-[#D3C4A5] mx-auto mb-4" />
            <h3 className="text-[#3A2418] font-bold text-lg mb-2">No reward points yet</h3>
            <p className="text-[#5F5A54]">Place your first order to start earning points!</p>
          </div>
        )}
      </div>
    </div>
  );
}
