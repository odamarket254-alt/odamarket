const fs = require('fs');

function fixFile(file) {
  let content = fs.readFileSync(file, 'utf8');

  // Fix the STEPS array
  content = content.replace(
    /\{ id: 'status', label: 'Status'/,
    `{ id: 'visibility', label: 'Status & Visibility'`
  );
  
  // Add Homepage Visibility checkboxes
  const checkboxes = `
                </div>
                
                {/* Homepage Visibility */}
                <div className="space-y-4 pt-6 border-t border-[#E8DCC9]">
                  <h3 className="text-md font-semibold text-[#3A2418]">Homepage Visibility</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Controller name="is_featured" control={control} render={({ field }) => (
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-[#C65A28] focus:ring-[#C65A28]" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
                        <span className="text-sm font-medium text-[#5F5A54]">Featured Products</span>
                      </label>
                    )} />
                    <Controller name="is_new_arrival" control={control} render={({ field }) => (
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-[#C65A28] focus:ring-[#C65A28]" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
                        <span className="text-sm font-medium text-[#5F5A54]">New Arrivals</span>
                      </label>
                    )} />
                    <Controller name="is_flash_sale" control={control} render={({ field }) => (
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-[#C65A28] focus:ring-[#C65A28]" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
                        <span className="text-sm font-medium text-[#5F5A54]">Flash Sales</span>
                      </label>
                    )} />
                    <Controller name="is_best_deal" control={control} render={({ field }) => (
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-[#C65A28] focus:ring-[#C65A28]" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
                        <span className="text-sm font-medium text-[#5F5A54]">Best Deals of the Week</span>
                      </label>
                    )} />
                    <Controller name="is_wholesale" control={control} render={({ field }) => (
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-[#C65A28] focus:ring-[#C65A28]" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
                        <span className="text-sm font-medium text-[#5F5A54]">Wholesale Products</span>
                      </label>
                    )} />
                    <Controller name="is_lowest_price" control={control} render={({ field }) => (
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-[#C65A28] focus:ring-[#C65A28]" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
                        <span className="text-sm font-medium text-[#5F5A54]">Lowest Price Everyday</span>
                      </label>
                    )} />
                    <Controller name="is_electronics_zone" control={control} render={({ field }) => (
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-[#C65A28] focus:ring-[#C65A28]" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
                        <span className="text-sm font-medium text-[#5F5A54]">Electronics Zone</span>
                      </label>
                    )} />
                  </div>
                </div>
              </div>
            </div>
`;

  content = content.replace(
    /<\/SelectContent>[\s\S]*?<\/Select>[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<\/div>/,
    `</SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>`
  );

  content = content.replace(
    /<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*\{\/\* Next\/Prev Navigation \*\/\}/,
    checkboxes + `\n            {/* Next/Prev Navigation */}`
  );

  fs.writeFileSync(file, content);
  console.log("Fixed " + file);
}

fixFile('src/pages/admin/AdminProductFormPage.tsx');
fixFile('src/pages/admin/AdminWholesaleProductFormPage.tsx');
