const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/AdminOrdersPage.tsx', 'utf8');

// Imports
code = code.replace(
  /import \{ format \} from 'date-fns';/,
  "import { format } from 'date-fns';\nimport { OrderDetailsModal } from '../../components/admin/orders/OrderDetailsModal';"
);

// State
code = code.replace(
  /const \[statusFilter, setStatusFilter\] = useState\('all'\);/,
  `const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);`
);

// Realtime
code = code.replace(
  /useEffect\(\(\) => \{\s*fetchOrders\(\);\s*\}, \[\]\);/,
  `useEffect(() => {
    fetchOrders();
    
    // Realtime subscription for new orders
    const subscription = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        toast.info('New order received: #' + payload.new.id.split('-')[0].toUpperCase());
        fetchOrders();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
        fetchOrders();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);
  
  const handleViewOrder = async (order: any) => {
    setSelectedOrder(order);
    setLoadingItems(true);
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.id);
      
      if (error && error.code !== '42P01') throw error;
      setOrderItems(data || []);
    } catch (err) {
      console.error("Error fetching order items:", err);
      toast.error("Failed to load ordered products");
    } finally {
      setLoadingItems(false);
    }
  };`
);

// Eye button onClick
code = code.replace(
  /<button className="p-1\.5 rounded-md hover:bg-\[#E8DCC9\] dark:hover:bg-slate-700 text-\[#5F5A54\] transition-colors" title="View Details">/g,
  '<button onClick={() => handleViewOrder(order)} className="p-1.5 rounded-md hover:bg-[#E8DCC9] dark:hover:bg-slate-700 text-[#5F5A54] transition-colors" title="View Details">'
);

// Include Modal
code = code.replace(
  /<\/div>\s*<\/div>\s*\);\s*\}\s*$/g,
  `    </div>
        <OrderDetailsModal 
          isOpen={!!selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
          order={selectedOrder} 
          orderItems={orderItems} 
          loadingItems={loadingItems} 
        />
      </div>
    );
  }
  `
);

fs.writeFileSync('src/pages/dashboard/AdminOrdersPage.tsx', code);
