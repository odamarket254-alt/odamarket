const fs = require('fs');

let content = fs.readFileSync('src/pages/admin/AdminProductFormPage.tsx', 'utf8');

const visibilityHtml = `

              {/* Homepage Visibility */}
              <div className="pt-6 border-t border-[#E8DCC9]">
                <h3 className="text-md font-semibold text-[#3A2418] mb-3">Homepage Visibility</h3>
                <p className="text-sm text-[#5F5A54] mb-4">Select where this product should appear on the homepage sections.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <label className="flex items-start space-x-3 cursor-pointer group">
                    <input type="checkbox" className="mt-1 form-checkbox text-[#C65A28] focus:ring-[#C65A28] border-[#E8DCC9] rounded" {...register('is_new_arrival')} />
                    <div>
                      <span className="block text-sm font-medium text-[#3A2418] group-hover:text-[#C65A28] transition-colors">New Arrival</span>
                      <span className="block text-xs text-[#8B857D]">Show in New Arrivals section</span>
                    </div>
                  </label>
                  
                  <label className="flex items-start space-x-3 cursor-pointer group">
                    <input type="checkbox" className="mt-1 form-checkbox text-[#C65A28] focus:ring-[#C65A28] border-[#E8DCC9] rounded" {...register('is_featured')} />
                    <div>
                      <span className="block text-sm font-medium text-[#3A2418] group-hover:text-[#C65A28] transition-colors">Featured Product</span>
                      <span className="block text-xs text-[#8B857D]">Show in Featured section</span>
                    </div>
                  </label>
                  
                  <label className="flex items-start space-x-3 cursor-pointer group">
                    <input type="checkbox" className="mt-1 form-checkbox text-[#C65A28] focus:ring-[#C65A28] border-[#E8DCC9] rounded" {...register('is_flash_sale')} />
                    <div>
                      <span className="block text-sm font-medium text-[#3A2418] group-hover:text-[#C65A28] transition-colors">Flash Sale</span>
                      <span className="block text-xs text-[#8B857D]">Include in Flash Sales</span>
                    </div>
                  </label>
                  
                  <label className="flex items-start space-x-3 cursor-pointer group">
                    <input type="checkbox" className="mt-1 form-checkbox text-[#C65A28] focus:ring-[#C65A28] border-[#E8DCC9] rounded" {...register('is_best_deal')} />
                    <div>
                      <span className="block text-sm font-medium text-[#3A2418] group-hover:text-[#C65A28] transition-colors">Best Deal</span>
                      <span className="block text-xs text-[#8B857D]">Show in Best Deals section</span>
                    </div>
                  </label>
                  
                  <label className="flex items-start space-x-3 cursor-pointer group">
                    <input type="checkbox" className="mt-1 form-checkbox text-[#C65A28] focus:ring-[#C65A28] border-[#E8DCC9] rounded" {...register('is_lowest_price')} />
                    <div>
                      <span className="block text-sm font-medium text-[#3A2418] group-hover:text-[#C65A28] transition-colors">Lowest Price</span>
                      <span className="block text-xs text-[#8B857D]">Highlight in Lowest Price</span>
                    </div>
                  </label>

                  <label className="flex items-start space-x-3 cursor-pointer group">
                    <input type="checkbox" className="mt-1 form-checkbox text-[#C65A28] focus:ring-[#C65A28] border-[#E8DCC9] rounded" {...register('is_electronics_zone')} />
                    <div>
                      <span className="block text-sm font-medium text-[#3A2418] group-hover:text-[#C65A28] transition-colors">Electronics Zone</span>
                      <span className="block text-xs text-[#8B857D]">Show in Electronics section</span>
                    </div>
                  </label>
                </div>
              </div>
`;

content = content.replace(
  /\{\/\* Description \*\/\}/,
  `${visibilityHtml}\n              {/* Description */}`
);

fs.writeFileSync('src/pages/admin/AdminProductFormPage.tsx', content);

// Also for AdminWholesaleProductFormPage.tsx
let content2 = fs.readFileSync('src/pages/admin/AdminWholesaleProductFormPage.tsx', 'utf8');
content2 = content2.replace(
  /\{\/\* Description \*\/\}/,
  `${visibilityHtml}\n              {/* Description */}`
);
fs.writeFileSync('src/pages/admin/AdminWholesaleProductFormPage.tsx', content2);

console.log("Added visibility HTML to form");
