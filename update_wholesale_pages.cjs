const fs = require('fs');

// Update Wholesale Products Page
let productsPage = fs.readFileSync('src/pages/admin/AdminWholesaleProductsPage.tsx', 'utf8');
productsPage = productsPage.replace(/AdminProductsPage/g, 'AdminWholesaleProductsPage');
productsPage = productsPage.replace(/Products/g, 'Wholesale Products');
productsPage = productsPage.replace(/products\//g, 'wholesale/');
productsPage = productsPage.replace(/\/admin\/products\/new/g, '/admin/dashboard/wholesale/new');
productsPage = productsPage.replace(/\/admin\/products\//g, '/admin/dashboard/wholesale/');

// Add is_wholesale filter to query
productsPage = productsPage.replace(
  /let query = supabase\n\s*\.from\('products'\)/,
  `let query = supabase\n        .from('products')\n        .eq('is_wholesale', true)`
);

// Update stats fetch to also only count wholesale products, or just don't touch stats for now, just the main query
// Actually, let's just make the stats count only wholesale too.
productsPage = productsPage.replace(
  /const \{ count: totalCount \} = await supabase\.from\('products'\)\.select\('\*', \{ count: 'exact', head: true \}\);/,
  `const { count: totalCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_wholesale', true);`
);
productsPage = productsPage.replace(
  /const \{ count: activeCount \} = await supabase\.from\('products'\)\.select\('\*', \{ count: 'exact', head: true \}\)\.eq\('status', 'active'\);/,
  `const { count: activeCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'active').eq('is_wholesale', true);`
);

fs.writeFileSync('src/pages/admin/AdminWholesaleProductsPage.tsx', productsPage);

// Update Wholesale Product Form Page
let formPage = fs.readFileSync('src/pages/admin/AdminWholesaleProductFormPage.tsx', 'utf8');
formPage = formPage.replace(/AdminProductFormPage/g, 'AdminWholesaleProductFormPage');
formPage = formPage.replace(/navigate\('\/admin\/products'\);/g, "navigate('/admin/dashboard/wholesale');");
formPage = formPage.replace(/'Product /g, "'Wholesale Product ");

// Make is_wholesale always true
formPage = formPage.replace(
  /is_wholesale: data\.is_wholesale,/,
  "is_wholesale: true,"
);
// Wholesale price shouldn't depend on is_wholesale from data because we removed it from being watched, well, actually, let's keep data.is_wholesale as default true in schema
formPage = formPage.replace(
  /is_wholesale: z\.boolean\(\)\.default\(false\),/,
  "is_wholesale: z.boolean().default(true),"
);
formPage = formPage.replace(
  /is_wholesale: false,/,
  "is_wholesale: true,"
);
formPage = formPage.replace(
  /is_wholesale: z\.boolean\(\)\.default\(true\),/, // Wait, didn't I just replace it? Yes. Let's make sure it's valid
  "is_wholesale: z.boolean().default(true),"
);

fs.writeFileSync('src/pages/admin/AdminWholesaleProductFormPage.tsx', formPage);

console.log("Updated wholesale pages.");
