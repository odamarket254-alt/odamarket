import { useState, useEffect } from "react";
import { StarHalf, CheckCircle, XCircle, Search, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
    
    

    
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reviews')
        .select('*, buyer:profiles!user_id(first_name, last_name), product:products(name)')
        .order('created_at', { ascending: false });
        
      if (data) {
        setReviews(data);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase.from('reviews').update({ is_approved: status === 'approved' }).eq('id', id);
      if (error) throw error;
      toast.success(`Review ${status}`);
    } catch (error: any) {
      // Mock if table is missing
      if (error.code === '42P01') {
        toast.error("Reviews table not found in database.");
      } else {
        toast.error("Failed to update review.");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <StarHalf className="h-6 w-6 text-primary" />
            Reviews & Moderation
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Approve, reject, or reply to customer reviews.
          </p>
        </div>
      </div>

      <div className="glass-card p-4 sm:p-6 rounded-2xl space-y-6">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search reviews by product or customer..." className="pl-9" />
        </div>
        
        <div className="space-y-4">
           {reviews.length === 0 && !loading && (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border/50 rounded-xl">
                 No reviews found. (Or table missing).
              </div>
           )}
           {loading && reviews.length === 0 && (
             <div className="text-center py-8 text-muted-foreground">Loading...</div>
           )}
           {reviews.map((review) => (
             <div key={review.id} className="border border-border/50 rounded-xl p-4 flex flex-col sm:flex-row gap-4 bg-background/50">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground">{review.buyer?.first_name || "Anonymous"}</h4>
                      <p className="text-xs text-muted-foreground">Product: {review.product?.name || "Unknown Product"}</p>
                    </div>
                    <div className="flex items-center gap-1 text-[#D9A62E]">
                      {'★'.repeat(review.rating || 5)}{'☆'.repeat(5 - (review.rating || 5))}
                    </div>
                  </div>
                  <p className="text-sm text-foreground">"{review.comment}"</p>
                  <div className="flex items-center gap-2 pt-2">
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded capitalize">{review.status || 'pending'}</span>
                  </div>
                </div>
                <div className="flex sm:flex-col gap-2 justify-end sm:justify-start">
                   <Button size="sm" onClick={() => updateStatus(review.id, 'approved')} className="bg-green-500 hover:bg-green-600 text-white"><CheckCircle className="h-4 w-4 mr-2"/> Approve</Button>
                   <Button size="sm" onClick={() => updateStatus(review.id, 'rejected')} variant="outline" className="text-[#B94A48] hover:text-[#C65A28] hover:bg-[#B94A48]/100/10"><XCircle className="h-4 w-4 mr-2"/> Reject</Button>
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}
