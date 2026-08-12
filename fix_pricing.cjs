const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/AdminProductFormPage.tsx', 'utf8');

const wholesaleUI = `
              </div>

              <div className="pt-6 mt-6 border-t border-[#E8DCC9]">
                <div className="flex items-start space-x-3 p-4 bg-[#FAF5EC]/80 rounded-xl border border-[#E8DCC9] hover:bg-[#FAF5EC] transition-colors mb-4">
                  <Controller
                    control={control}
                    name="is_wholesale"
                    render={({ field }) => (
                      <input
                        id="is_wholesale"
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-[#C65A28] focus:ring-[#C65A28]"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                    )}
                  />
                  <div className="flex-1">
                    <Label htmlFor="is_wholesale" className="text-[#3A2418] font-bold cursor-pointer">Wholesale Product</Label>
                    <p className="text-sm text-[#5F5A54] mt-1 leading-relaxed">Enable this product to be available for wholesale orders on the homepage.</p>
                  </div>
                </div>

                {watch('is_wholesale') && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 bg-[#FAF5EC] p-4 rounded-xl border border-[#E8DCC9]">
                    <div>
                      <Label htmlFor="wholesale_price" className="text-[#5F5A54] block mb-1.5">Wholesale Price</Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-[#5F5A54] sm:text-sm font-medium">KSh</span>
                        </div>
                        <Input id="wholesale_price" type="number" step="0.01" {...register('wholesale_price')} className="pl-12" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="wholesale_min_qty" className="text-[#5F5A54] block mb-1.5">Min. Quantity</Label>
                      <Input id="wholesale_min_qty" type="number" {...register('wholesale_min_qty')} placeholder="e.g. 10" />
                    </div>
                    <div>
                      <Label htmlFor="wholesale_unit" className="text-[#5F5A54] block mb-1.5">Unit Description</Label>
                      <Input id="wholesale_unit" {...register('wholesale_unit')} placeholder="e.g. Carton, Dozen" />
                    </div>
                  </div>
                )}
              </div>
`;

content = content.replace(
  /                  <\/div>\n                <\/div>\n              <\/div>\n            <\/div>/,
  `                  </div>\n                </div>` + wholesaleUI + `\n            </div>`
);

fs.writeFileSync('src/pages/admin/AdminProductFormPage.tsx', content);
