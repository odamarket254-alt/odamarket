const fs = require('fs');

function fixFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Fix the defaultValues bug
  content = content.replace(
    /is_wholesale: data\.is_wholesale,/,
    'is_wholesale: false,'
  );

  // Fix the submission bug
  content = content.replace(
    /is_wholesale: false,\s*wholesale_price: data\.is_wholesale \? data\.wholesale_price : null,/,
    'is_wholesale: data.is_wholesale,\n        wholesale_price: data.is_wholesale ? data.wholesale_price : null,'
  );
  
  // Add UI controls if missing
  // Look for the pricing tab content
  if (content.includes('value="pricing"')) {
    const wholesaleUI = `
                {/* Wholesale Pricing */}
                <div className="pt-6 border-t border-[#E8DCC9]">
                  <h3 className="text-md font-semibold text-[#3A2418] mb-4">Wholesale Configuration</h3>
                  
                  <div className="mb-4">
                    <label className="flex items-center space-x-3 cursor-pointer group">
                      <input type="checkbox" className="form-checkbox text-[#C65A28] focus:ring-[#C65A28] border-[#E8DCC9] rounded w-5 h-5" {...register('is_wholesale')} />
                      <div>
                        <span className="block text-sm font-medium text-[#3A2418] group-hover:text-[#C65A28] transition-colors">Enable Wholesale</span>
                        <span className="block text-xs text-[#8B857D]">Allow customers to buy this product in bulk at a discounted price</span>
                      </div>
                    </label>
                  </div>
                  
                  {watch('is_wholesale') && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#FAF5EC] p-4 rounded-xl border border-[#E8DCC9]">
                      <div>
                        <Label htmlFor="wholesale_price" className="text-[#5F5A54]">Wholesale Price</Label>
                        <div className="relative mt-1.5">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B857D] text-sm">KSh</span>
                          <Input id="wholesale_price" type="number" step="0.01" {...register('wholesale_price')} className={cn("pl-12", errors.wholesale_price && 'border-rose-500')} />
                        </div>
                        {errors.wholesale_price && <p className="text-sm text-[#B94A48] mt-1.5 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5"/>{errors.wholesale_price.message as string}</p>}
                      </div>
                      
                      <div>
                        <Label htmlFor="wholesale_min_qty" className="text-[#5F5A54]">Minimum Quantity</Label>
                        <Input id="wholesale_min_qty" type="number" {...register('wholesale_min_qty')} className={cn("mt-1.5", errors.wholesale_min_qty && 'border-rose-500')} />
                        {errors.wholesale_min_qty && <p className="text-sm text-[#B94A48] mt-1.5 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5"/>{errors.wholesale_min_qty.message as string}</p>}
                      </div>
                      
                      <div>
                        <Label htmlFor="wholesale_unit" className="text-[#5F5A54]">Unit (e.g., bags, boxes)</Label>
                        <Input id="wholesale_unit" {...register('wholesale_unit')} placeholder="e.g. bags" className={cn("mt-1.5", errors.wholesale_unit && 'border-rose-500')} />
                        {errors.wholesale_unit && <p className="text-sm text-[#B94A48] mt-1.5 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5"/>{errors.wholesale_unit.message as string}</p>}
                      </div>
                    </div>
                  )}
                </div>
    `;

    // Only inject if not already there
    if (!content.includes('Wholesale Configuration')) {
      content = content.replace(
        /<\/TabsContent>\s*\{\/\* Inventory \*\/\}/,
        `${wholesaleUI}\n              </TabsContent>\n\n              {/* Inventory */}`
      );
    }
  }

  fs.writeFileSync(file, content);
}

fixFile('src/pages/admin/AdminProductFormPage.tsx');
fixFile('src/pages/admin/AdminWholesaleProductFormPage.tsx');
console.log("Fixed AdminProductFormPage UI");
