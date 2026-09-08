const fs = require('fs');

let code = fs.readFileSync('src/pages/dashboard/BuyerDashboardHome.tsx', 'utf8');

const regex = /      if \(ordersData && ordersData\.length > 0\) \{[\s\S]*?\} else \{[\s\S]*?\/\/ Fallback for demo[\s\S]*?setStats\(s => \(\{ \.\.\.s, activeOrders: 2, pendingDeliveries: 1 \}\)\);\s*\}/;

const replacement = `      if (ordersData) {
        setActiveOrders(ordersData);
        const active = ordersData.filter((o: any) => 
          o.status !== 'delivered' && 
          o.status !== 'cancelled' && 
          o.payment_status !== 'failed' && 
          o.payment_status !== 'abandoned'
        );
        setStats(s => ({ ...s, activeOrders: active.length, pendingDeliveries: active.filter((a: any) => a.status === 'out_for_delivery').length }));
      }`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/pages/dashboard/BuyerDashboardHome.tsx', code);
  console.log('Success');
} else {
  console.log('Regex did not match');
}
