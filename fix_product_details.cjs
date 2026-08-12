const fs = require('fs');
let content = fs.readFileSync('src/pages/ProductDetailsPage.tsx', 'utf8');

// Fix regular_price to price
content = content.replace(/product\.regular_price/g, 'product.price');

const wholesaleOption = `
              {product.is_wholesale && (
                <div className="mb-6 p-4 bg-[#FAF5EC] border border-[#D9A62E]/30 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-[#B94A48] text-white text-xs font-bold uppercase tracking-wider py-1 px-2 rounded-md">Wholesale</span>
                    <span className="text-[#3A2418] font-bold text-sm">Available for bulk orders</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                    <div>
                      <span className="block text-[#8B857D] mb-1">Wholesale Price</span>
                      <strong className="text-[#C65A28] text-lg">Ksh {product.wholesale_price}</strong>
                    </div>
                    <div>
                      <span className="block text-[#8B857D] mb-1">Min. Quantity</span>
                      <strong className="text-[#3A2418] text-lg">{product.wholesale_min_qty} {product.wholesale_unit || 'items'}</strong>
                    </div>
                  </div>
                  <Button 
                    onClick={() => {
                      for (let i = 0; i < (product.wholesale_min_qty || 1); i++) {
                        addItem({
                          id: product.id + '_wholesale',
                          name: product.name + ' (Wholesale)',
                          price: product.wholesale_price,
                          image_url: product.image_url,
                          seller_id: product.seller_id
                        });
                      }
                      toast.success(\`Added \${product.wholesale_min_qty} wholesale items to cart\`);
                    }}
                    className="w-full mt-4 bg-[#3A2418] hover:bg-[#3A2418]/90 text-white border-none h-12"
                  >
                    Buy Wholesale (Min {product.wholesale_min_qty})
                  </Button>
                </div>
              )}
`;

content = content.replace(
  /<div className="space-y-6 sm:space-y-8 mb-8 sm:mb-10">/,
  wholesaleOption + `\n            <div className="space-y-6 sm:space-y-8 mb-8 sm:mb-10">`
);

fs.writeFileSync('src/pages/ProductDetailsPage.tsx', content);
