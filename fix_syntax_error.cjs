const fs = require('fs');

let productsPage = fs.readFileSync('src/pages/admin/AdminWholesaleProductsPage.tsx', 'utf8');

productsPage = productsPage.replace(/AdminWholesaleWholesale ProductsPage/g, 'AdminWholesaleProductsPage');
productsPage = productsPage.replace(/setWholesale Products/g, 'setProducts');
productsPage = productsPage.replace(/fetchWholesale Products/g, 'fetchProducts');
productsPage = productsPage.replace(/filteredWholesale Products/g, 'filteredProducts');
productsPage = productsPage.replace(/Total Wholesale Products/g, 'Total Products');

// just to be safe, search for any invalid function or variable names:
productsPage = productsPage.replace(/Wholesale ProductsPage/g, 'ProductsPage');

fs.writeFileSync('src/pages/admin/AdminWholesaleProductsPage.tsx', productsPage);

console.log("Fixed AdminWholesaleProductsPage.tsx");
