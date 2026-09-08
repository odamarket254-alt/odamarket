const fs = require('fs');

let code = fs.readFileSync('src/pages/dashboard/BuyerDashboardHome.tsx', 'utf8');

// 1. Add state for flash deals and time remaining
const stateInsert = `
  const [flashDeals, setFlashDeals] = useState<any[]>([]);
  const [flashDealTime, setFlashDealTime] = useState("");
  const { addItem: addCartItem } = useCartStore(); // Ensure we can add items
`;
code = code.replace(
  /const \[popularCategories, setPopularCategories\] = useState<any\[\]>\(\[\]\);/,
  `const [popularCategories, setPopularCategories] = useState<any[]>([]);\n${stateInsert}`
);

// 2. Add fetch logic for flash deals
const fetchLogic = `
      // 7. Fetch Flash Deals
      const { data: flashData } = await supabase
        .from('products')
        .select('*')
        .eq('is_flash_sale', true)
        .eq('is_public', true)
        .eq('is_active', true)
        .limit(3);
        
      if (flashData) {
        setFlashDeals(flashData);
      }
`;
code = code.replace(
  /\/\/ 6\. Savings \(Coming Soon\)/,
  `${fetchLogic}\n      // 6. Savings (Coming Soon)`
);

// 3. Add Timer Effect
const timerEffect = `
  useEffect(() => {
    // Generate a fixed end time for today at midnight
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    const updateTimer = () => {
      const now = new Date();
      const diff = endOfDay.getTime() - now.getTime();
      
      if (diff <= 0) {
        setFlashDealTime("Ended");
        return;
      }
      
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setFlashDealTime(\`\${hours}h \${minutes}m \${seconds}s\`);
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);
`;
code = code.replace(
  /const getGreeting = \(\) => \{/,
  `${timerEffect}\n\n  const getGreeting = () => {`
);


// 4. Update the Flash Deals UI
const flashUI = `
          {/* 8. FLASH SALES / DEALS */}
          <Card className="p-6 bg-gradient-to-br from-red-50 to-orange-50 border-orange-100 dark:from-red-950/20 dark:to-orange-950/20 dark:border-orange-900/30">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                🔥 Flash Deals
              </h2>
              <div className="text-xs font-bold bg-red-100 text-red-600 px-2 py-1 rounded-md">
                {flashDealTime === "Ended" ? "Sale Ended" : \`Ends in \${flashDealTime}\`}
              </div>
            </div>
            
            {flashDeals.length > 0 ? (
              <div className="space-y-4">
                {flashDeals.map(deal => (
                  <div key={deal.id} className="flex gap-4 items-center bg-white dark:bg-card p-3 rounded-xl shadow-sm border border-border">
                    <div className="w-16 h-16 bg-muted rounded-lg shrink-0 overflow-hidden">
                      {deal.image_url ? (
                        <OptimizedImage src={deal.image_url} alt={deal.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-6 h-6 m-auto mt-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <Link to={\`/product/\${deal.slug || deal.id}\`} className="hover:underline">
                        <h4 className="font-semibold text-sm line-clamp-1 truncate">{deal.name}</h4>
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-red-600 font-bold">Ksh {(deal.sale_price || deal.price).toLocaleString()}</span>
                        {deal.sale_price && (
                          <span className="text-xs text-muted-foreground line-through">Ksh {deal.price?.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => addCartItem({ id: deal.id, name: deal.name, price: (deal.sale_price || deal.price).toString(), image_url: deal.image_url || "" }, 1)}
                      className="shrink-0 h-8 w-8 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <span className="text-sm text-gray-500">No active flash deals right now. Check back soon!</span>
              </div>
            )}
          </Card>
`;

code = code.replace(
  /\{\/\* 8\. FLASH SALES \/ DEALS \*\/\}[\s\S]*?<\/Card>/,
  flashUI
);

// Note: Ensure useCartStore is imported
if (!code.includes('import { useCartStore } from')) {
  code = code.replace(
    /import \{ useAuthStore \} from '\.\.\/\.\.\/store\/useAuthStore';/,
    `import { useAuthStore } from '../../store/useAuthStore';\nimport { useCartStore } from '../../store/useCartStore';`
  );
}

fs.writeFileSync('src/pages/dashboard/BuyerDashboardHome.tsx', code);
