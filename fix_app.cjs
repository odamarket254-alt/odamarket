const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('BuyerDashboardHome')) {
  code = code.replace(
    'const DashboardHome = lazy(() => import("./pages/dashboard/DashboardHome"));',
    'const DashboardHome = lazy(() => import("./pages/dashboard/DashboardHome"));\nconst BuyerDashboardHome = lazy(() => import("./pages/dashboard/BuyerDashboardHome").then(m => ({ default: m.BuyerDashboardHome })));'
  );
}

// update route
const buyerRouteTarget = '<Route index element={<DashboardHome />} />';
if (code.includes(buyerRouteTarget) && code.indexOf('buyer/dashboard') !== -1) {
  // we want to replace the index route ONLY inside buyer layout.
  // Let's use a regex carefully.
  code = code.replace(
    /<Route path="\/buyer\/dashboard" element={<DashboardLayout \/>}>\s*<Route index element={<DashboardHome \/>} \/>/,
    '<Route path="/buyer/dashboard" element={<DashboardLayout />}>\n                <Route index element={<BuyerDashboardHome />} />'
  );
}

fs.writeFileSync('src/App.tsx', code);
