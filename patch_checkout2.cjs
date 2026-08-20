const fs = require('fs');
let code = fs.readFileSync('routes/checkoutRoutes.ts', 'utf8');

code = code.replace(
  /const \{ error: itemsError \} = await supabase\s*\.from\('order_items'\)\s*\.insert\(orderItems\.map\(item => \(\{ \.\.\.item, order_id: orderData\.id \}\)\)\);/,
  `let { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems.map(item => ({ ...item, order_id: orderData.id })));
      
    if (itemsError && itemsError.code === 'PGRST204') {
      // Fallback for before migration is run
      console.warn('Migration not run. Falling back to old order_items schema.');
      const fallbackItems = orderItems.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        order_id: orderData.id
      }));
      const fallbackRes = await supabase.from('order_items').insert(fallbackItems);
      itemsError = fallbackRes.error;
    }`
);

fs.writeFileSync('routes/checkoutRoutes.ts', code);
