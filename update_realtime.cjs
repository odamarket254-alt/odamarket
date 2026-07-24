const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/BuyerDashboardHome.tsx', 'utf8');

const replacement = `  useEffect(() => {
    fetchDashboardData();

    // Setup real-time subscription for inquiries (acting as orders)
    const inquiriesSubscription = supabase
      .channel('public:inquiries')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inquiries' }, payload => {
        fetchDashboardData(); // Refresh data on change
      })
      .subscribe();
      
    // Setup real-time subscription for products (for recommendations)
    const productsSubscription = supabase
      .channel('public:products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, payload => {
        fetchDashboardData(); // Refresh data on change
      })
      .subscribe();

    return () => {
      supabase.removeChannel(inquiriesSubscription);
      supabase.removeChannel(productsSubscription);
    };
  }, [user]);`;

code = code.replace(/  useEffect\(\(\) => \{\n    fetchDashboardData\(\);\n\n    \/\/ Setup real-time subscription for orders\n    const ordersSubscription = supabase\n      \.channel\('public:orders'\)\n      \.on\('postgres_changes', \{ event: '\*', schema: 'public', table: 'inquiries' \}, payload => \{\n        fetchDashboardData\(\); \/\/ Refresh data on change\n      \}\)\n      \.subscribe\(\);\n\n    return \(\) => \{\n      supabase\.removeChannel\(ordersSubscription\);\n    \};\n  \}, \[user\]\);/g, replacement);

fs.writeFileSync('src/pages/dashboard/BuyerDashboardHome.tsx', code);
