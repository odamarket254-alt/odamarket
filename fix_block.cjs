const fs = require('fs');

function fixFile(file) {
  let content = fs.readFileSync(file, 'utf8');

  // We want to replace from {/* Status */} to {/* Next/Prev Navigation */}
  const newBlock = `
            {/* Status */}
            <div className={cn("bg-[#FFFDF8] p-5 sm:p-6 rounded-xl border border-[#E8DCC9] shadow-sm space-y-5 sm:space-y-6", activeStep !== 'visibility' && "hidden")}>
              <h2 className="text-lg font-bold text-[#3A2418] flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#C65A28]" /> Status & Visibility
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-5">
                  <div>
                    <Label className="text-[#5F5A54] block mb-1.5">Product Status</Label>
                    <Controller
                      name="status"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">
                              <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"></div> Active</span>
                            </SelectItem>
                            <SelectItem value="draft">
                              <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-yellow-500"></div> Draft</span>
                            </SelectItem>
                            <SelectItem value="inactive">
                              <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-gray-400"></div> Inactive</span>
                            </SelectItem>
                            <SelectItem value="out_of_stock">
                              <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"></div> Out of Stock</span>
                            </SelectItem>
                            <SelectItem value="hidden" className="hidden">
                              <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-400"></div> Hidden</span>
                            </SelectItem>
                            <SelectItem value="archived">
                              <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#B94A48]"></div> Archived</span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>
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

            {/* Next/Prev Navigation */}`;

  // Find everything between {/* Status */} and {/* Next/Prev Navigation */}
  const regex = /\{\/\* Status \*\/\}[\s\S]*?\{\/\* Next\/Prev Navigation \*\/\}/;
  content = content.replace(regex, newBlock.trim());
  
  // Now we need to remove the extra </div> we added at the end of the file in the last step
  content = content.replace(/<\/div>\n    <\/div>\n  \);\n\}/, '  );\n}');

  fs.writeFileSync(file, content);
  console.log("Fixed " + file);
}

fixFile('src/pages/admin/AdminProductFormPage.tsx');
fixFile('src/pages/admin/AdminWholesaleProductFormPage.tsx');
