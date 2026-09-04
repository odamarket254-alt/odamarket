const fs = require('fs');

let code = fs.readFileSync('src/pages/WishlistPage.tsx', 'utf8');

// Replace colors
code = code.replaceAll('bg-[#F8FAFC]', 'bg-[#FAF5EC]');
code = code.replaceAll('text-[#22C55E]', 'text-[#C65A28]');
code = code.replaceAll('text-[#94A3B8]', 'text-[#8B857D]');
code = code.replaceAll('text-[#0B2346]', 'text-[#3A2418]');
code = code.replaceAll('text-[#6B7280]', 'text-[#5F5A54]');
code = code.replaceAll('bg-[#22C55E]', 'bg-[#C65A28]');
code = code.replaceAll('hover:bg-[#16A34A]', 'hover:bg-[#a64a20]');
code = code.replaceAll('border-[#E5E7EB]', 'border-[#E8DCC9]');

// Specific stock colors
code = code.replaceAll('bg-[#22C55E]/10 text-[#16A34A]', 'bg-emerald-100 text-emerald-700');
code = code.replaceAll('bg-[#EF4444]/10 text-[#EF4444]', 'bg-[#B94A48]/10 text-[#B94A48]');

// Specific action colors
code = code.replaceAll('hover:text-[#EF4444]', 'hover:text-[#B94A48]');
code = code.replaceAll('bg-[#EF4444]', 'bg-[#B94A48]'); // Sale badge
code = code.replaceAll('hover:bg-[#EF4444]/10', 'hover:bg-[#B94A48]/10'); 

// Button disabled state
code = code.replaceAll('disabled:bg-[#94A3B8]', 'disabled:bg-[#8B857D]');

// "Continue Shopping" border hover
code = code.replaceAll('hover:border-[#0B2346]', 'hover:border-[#C65A28] hover:text-[#C65A28]');

// Add price and regular_price correctly to addItem
code = code.replace(
  'price: String(product.regular_price),',
  'price: String(product.regular_price || product.price || 0),'
);

fs.writeFileSync('src/pages/WishlistPage.tsx', code);
console.log('Wishlist page updated successfully');
