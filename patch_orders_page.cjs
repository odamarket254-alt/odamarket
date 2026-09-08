const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/OrdersPage.tsx', 'utf8');

// 1. Add Star, X and useCartStore imports
code = code.replace(
  /import { Package, /,
  `import { Package, Star, X, `
);
code = code.replace(
  /import { useAuthStore } from "\.\.\/\.\.\/store\/useAuthStore";/,
  `import { useAuthStore } from "../../store/useAuthStore";\nimport { useCartStore } from "../../store/useCartStore";\nimport { useNavigate } from "react-router-dom";`
);

// 2. Add state and hooks for Buy Again & Rate Products
const hooksAndState = `
  const { addItem } = useCartStore();
  const navigate = useNavigate();
  
  // Rate Products State
  const [ratingOrder, setRatingOrder] = useState<any | null>(null);
  const [ratingItems, setRatingItems] = useState<any[]>([]);
  const [isLoadingRatingItems, setIsLoadingRatingItems] = useState(false);
  const [ratings, setRatings] = useState<Record<string, { rating: number, comment: string }>>({});
  const [isSubmittingRatings, setIsSubmittingRatings] = useState(false);
  const [buyingAgainId, setBuyingAgainId] = useState<string | null>(null);
`;
code = code.replace(
  /const \[downloadingOrderId, setDownloadingOrderId\] = useState<string \| null>\(null\);/,
  `const [downloadingOrderId, setDownloadingOrderId] = useState<string | null>(null);${hooksAndState}`
);

// 3. Add handler functions
const handlers = `
  const handleBuyAgain = async (order: any) => {
    setBuyingAgainId(order.id);
    toast.loading("Adding items to cart...", { id: 'buy-again' });
    try {
      const { data: items, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.id);
        
      if (error) throw error;
      
      if (items && items.length > 0) {
        items.forEach(item => {
          addItem({
            id: item.product_id,
            name: item.product_name || "Unknown Product",
            price: item.unit_price?.toString() || "0",
            image_url: item.product_image || ""
          }, item.quantity || 1);
        });
        toast.success("Items added to your cart!", { id: 'buy-again' });
        navigate('/cart');
      } else {
         toast.error("No items found to buy again.", { id: 'buy-again' });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to add items to cart", { id: 'buy-again' });
    } finally {
      setBuyingAgainId(null);
    }
  };

  const handleOpenRateModal = async (order: any) => {
    setRatingOrder(order);
    setIsLoadingRatingItems(true);
    setRatings({});
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.id);
      if (error) throw error;
      setRatingItems(data || []);
    } catch (err) {
      toast.error("Failed to load items");
      setRatingOrder(null);
    } finally {
      setIsLoadingRatingItems(false);
    }
  };

  const handleRatingChange = (productId: string, rating: number) => {
    setRatings(prev => ({ ...prev, [productId]: { ...prev[productId], rating } }));
  };

  const handleCommentChange = (productId: string, comment: string) => {
    setRatings(prev => ({ ...prev, [productId]: { ...prev[productId], comment } }));
  };

  const handleSubmitRatings = async () => {
    const reviewsToSubmit = Object.keys(ratings).filter(pid => ratings[pid]?.rating > 0).map(pid => ({
      product_id: pid,
      user_id: user?.id,
      order_id: ratingOrder?.id,
      rating: ratings[pid].rating,
      comment: ratings[pid].comment || "",
      is_approved: true
    }));

    if (reviewsToSubmit.length === 0) {
      toast.error("Please provide at least one rating to submit.");
      return;
    }

    setIsSubmittingRatings(true);
    try {
      const { error } = await supabase.from('reviews').insert(reviewsToSubmit);
      if (error) throw error;
      toast.success("Thank you for your reviews!");
      setRatingOrder(null);
    } catch (err: any) {
      console.error(err);
      if (err.code === '23503') {
        toast.error("One of the products no longer exists in our catalog.");
      } else {
        toast.error("Failed to submit reviews. Please try again.");
      }
    } finally {
      setIsSubmittingRatings(false);
    }
  };
`;
code = code.replace(
  /const handleDownloadInvoice = async \(order: any\) => \{/,
  `${handlers}\n  const handleDownloadInvoice = async (order: any) => {`
);

// 4. Update the Buttons in UI
code = code.replace(
  /<Button variant="outline" className="w-full sm:w-auto text-primary border-primary hover:bg-primary\/5">/,
  `<Button variant="outline" onClick={() => handleBuyAgain(order)} disabled={buyingAgainId === order.id} className="w-full sm:w-auto text-primary border-primary hover:bg-primary/5">`
);

code = code.replace(
  /<Button variant="outline" className="w-full sm:w-auto">(\s*)Rate Products(\s*)<\/Button>/,
  `<Button variant="outline" onClick={() => handleOpenRateModal(order)} className="w-full sm:w-auto">\n                    Rate Products\n                  </Button>`
);

// 5. Add the Rate Products Modal at the very end before the last closing div/wrapper
const modalCode = `
      {/* Rate Products Modal */}
      {ratingOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h2 className="font-bold text-lg">Rate Your Items</h2>
              <button onClick={() => setRatingOrder(null)} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1">
              {isLoadingRatingItems ? (
                <div className="flex justify-center py-8"><span className="animate-spin text-primary">⏳</span> Loading items...</div>
              ) : ratingItems.length > 0 ? (
                <div className="space-y-6">
                  {ratingItems.map(item => (
                    <div key={item.product_id} className="border border-gray-100 rounded-lg p-4 shadow-sm">
                      <div className="flex gap-3 mb-3">
                        <div className="w-16 h-16 rounded-md bg-gray-100 overflow-hidden flex-shrink-0">
                          {item.product_image ? (
                            <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-8 h-8 text-gray-400 m-auto mt-4" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{item.product_name}</h4>
                          <p className="text-xs text-muted-foreground mt-1">KSh {item.unit_price?.toLocaleString()}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-1 mb-3">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button 
                            key={star} 
                            onClick={() => handleRatingChange(item.product_id, star)}
                            className="focus:outline-none"
                          >
                            <Star 
                              className={\`w-6 h-6 \${(ratings[item.product_id]?.rating || 0) >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}\`} 
                            />
                          </button>
                        ))}
                      </div>
                      
                      <textarea
                        placeholder="What did you think of this product?"
                        className="w-full p-2 text-sm border rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                        rows={2}
                        value={ratings[item.product_id]?.comment || ""}
                        onChange={(e) => handleCommentChange(item.product_id, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No items found for this order.</p>
              )}
            </div>
            
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setRatingOrder(null)}>Cancel</Button>
              <Button 
                onClick={handleSubmitRatings} 
                disabled={isSubmittingRatings || isLoadingRatingItems || ratingItems.length === 0}
              >
                {isSubmittingRatings ? "Submitting..." : "Submit Ratings"}
              </Button>
            </div>
          </div>
        </div>
      )}
`;

code = code.replace(/<\/div>\s*<\/div>\s*\);\s*\}\s*$/, `${modalCode}\n    </div>\n  );\n}\n`);

fs.writeFileSync('src/pages/dashboard/OrdersPage.tsx', code);
