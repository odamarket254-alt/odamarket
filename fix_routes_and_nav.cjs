const fs = require('fs');

// Add routes to App.tsx
let appStr = fs.readFileSync('src/App.tsx', 'utf8');
if (!appStr.includes('AdminWholesaleProductsPage')) {
  appStr = appStr.replace(
    /const AdminProductFormPage = lazy\(\(\) => import\("\.\/pages\/admin\/AdminProductFormPage"\)\);/,
    `const AdminProductFormPage = lazy(() => import("./pages/admin/AdminProductFormPage"));\nconst AdminWholesaleProductsPage = lazy(() => import("./pages/admin/AdminWholesaleProductsPage"));\nconst AdminWholesaleProductFormPage = lazy(() => import("./pages/admin/AdminWholesaleProductFormPage"));`
  );
  
  appStr = appStr.replace(
    /<Route path="products\/:id" element=\{<AdminProductFormPage \/>\} \/>/,
    `<Route path="products/:id" element={<AdminProductFormPage />} />
                <Route path="wholesale" element={<AdminWholesaleProductsPage />} />
                <Route path="wholesale/:id" element={<AdminWholesaleProductFormPage />} />`
  );
  fs.writeFileSync('src/App.tsx', appStr);
  console.log("Updated App.tsx");
}

// Add navigation link
let navStr = fs.readFileSync('src/components/layout/admin/navigation.ts', 'utf8');
if (!navStr.includes('Wholesale Products')) {
  navStr = navStr.replace(
    /\{ label: "Products", path: "\/admin\/dashboard\/products" \},/,
    `{ label: "Products", path: "/admin/dashboard/products" },
      { label: "Wholesale Products", path: "/admin/dashboard/wholesale" },`
  );
  fs.writeFileSync('src/components/layout/admin/navigation.ts', navStr);
  console.log("Updated navigation.ts");
}
