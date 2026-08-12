const fs = require('fs');

const file = 'src/pages/admin/AdminWholesaleProductFormPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// Fix step name mismatch
content = content.replace(/activeStep !== 'status' && "hidden"/g, "activeStep !== 'visibility' && \"hidden\"");

const checkboxesUI = `
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-[#3A2418]">Homepage Placement & Badges</h3>
                  
                  <label className="flex items-start space-x-3 cursor-pointer group">
                    <input type="checkbox" className="mt-1 form-checkbox text-[#C65A28] focus:ring-[#C65A28] border-[#E8DCC9] rounded" {...register('is_featured')} />
                    <div>
                      <span className="block text-sm font-medium text-[#3A2418] group-hover:text-[#C65A28] transition-colors">Featured Product</span>
                      <span className="block text-xs text-[#8B857D]">Show in the Featured Products section</span>
                    </div>
                  </label>
                  
                  <label className="flex items-start space-x-3 cursor-pointer group">
                    <input type="checkbox" className="mt-1 form-checkbox text-[#C65A28] focus:ring-[#C65A28] border-[#E8DCC9] rounded" {...register('is_new_arrival')} />
                    <div>
                      <span className="block text-sm font-medium text-[#3A2418] group-hover:text-[#C65A28] transition-colors">New Arrival</span>
                      <span className="block text-xs text-[#8B857D]">Show in the New Arrivals section</span>
                    </div>
                  </label>
                  
                  <label className="flex items-start space-x-3 cursor-pointer group">
                    <input type="checkbox" className="mt-1 form-checkbox text-[#C65A28] focus:ring-[#C65A28] border-[#E8DCC9] rounded" {...register('is_flash_sale')} />
                    <div>
                      <span className="block text-sm font-medium text-[#3A2418] group-hover:text-[#C65A28] transition-colors">Flash Sale</span>
                      <span className="block text-xs text-[#8B857D]">Show in Flash Sales section</span>
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
                      <span className="block text-xs text-[#8B857D]">Show in Lowest Price Everyday</span>
                    </div>
                  </label>
                  
                  <label className="flex items-start space-x-3 cursor-pointer group">
                    <input type="checkbox" className="mt-1 form-checkbox text-[#C65A28] focus:ring-[#C65A28] border-[#E8DCC9] rounded" {...register('is_electronics_zone')} />
                    <div>
                      <span className="block text-sm font-medium text-[#3A2418] group-hover:text-[#C65A28] transition-colors">Electronics Zone</span>
                      <span className="block text-xs text-[#8B857D]">Show in Electronics Zone section</span>
                    </div>
                  </label>
                  
                  <div className="pt-4 border-t border-[#E8DCC9]">
                    <label className="flex items-start space-x-3 cursor-pointer group mb-4">
                      <input type="checkbox" className="mt-1 form-checkbox text-[#C65A28] focus:ring-[#C65A28] border-[#E8DCC9] rounded" {...register('is_wholesale')} />
                      <div>
                        <span className="block text-sm font-medium text-[#3A2418] group-hover:text-[#C65A28] transition-colors">Wholesale Product</span>
                        <span className="block text-xs text-[#8B857D]">Allow bulk purchases</span>
                      </div>
                    </label>
                    
                    {watch('is_wholesale') && (
                      <div className="space-y-4 pl-7">
                        <div>
                          <Label className="text-[#5F5A54] block mb-1.5">Wholesale Price (KSh)</Label>
                          <Input type="number" step="0.01" {...register('wholesale_price')} />
                        </div>
                        <div>
                          <Label className="text-[#5F5A54] block mb-1.5">Minimum Quantity</Label>
                          <Input type="number" {...register('wholesale_min_qty')} />
                        </div>
                        <div>
                          <Label className="text-[#5F5A54] block mb-1.5">Unit (e.g. bags)</Label>
                          <Input {...register('wholesale_unit')} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
`;

content = content.replace(
  /<\/Select>\s*\}\s*\/>\s*<\/div>\s*<\/div>\s*<\/div>/,
  `</Select>
                      )}
                    />
                  </div>
                </div>
                
${checkboxesUI}
              </div>`
);

fs.writeFileSync(file, content);
console.log("Fixed AdminWholesaleProductFormPage visibility UI");
