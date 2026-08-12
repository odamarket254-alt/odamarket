const fs = require('fs');
let formStr = fs.readFileSync('src/pages/admin/AdminWholesaleProductFormPage.tsx', 'utf8');

// The wholesale toggle
formStr = formStr.replace(
  /<div className="flex items-start space-x-3 p-4 bg-\[#FAF5EC\]\/80 rounded-xl border border-\[#E8DCC9\] hover:bg-\[#FAF5EC\] transition-colors mb-4">[\s\S]*?<\/Label>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*\)\}/,
  `<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 bg-[#FAF5EC] p-4 rounded-xl border border-[#E8DCC9] mt-4">
                    <div>
                      <Label htmlFor="wholesale_price" className="text-[#5F5A54] block mb-1.5">Wholesale Price</Label>
                      <Input
                        id="wholesale_price"
                        type="number"
                        placeholder="0.00"
                        {...register('wholesale_price')}
                      />
                    </div>
                    <div>
                      <Label htmlFor="wholesale_min_qty" className="text-[#5F5A54] block mb-1.5">Min. Quantity</Label>
                      <Input
                        id="wholesale_min_qty"
                        type="number"
                        placeholder="e.g. 10"
                        {...register('wholesale_min_qty')}
                      />
                    </div>
                    <div>
                      <Label htmlFor="wholesale_unit" className="text-[#5F5A54] block mb-1.5">Unit (e.g. box, dozen)</Label>
                      <Input
                        id="wholesale_unit"
                        type="text"
                        placeholder="e.g. box"
                        {...register('wholesale_unit')}
                      />
                    </div>
                  </div>`
);

fs.writeFileSync('src/pages/admin/AdminWholesaleProductFormPage.tsx', formStr);
console.log("Wholesale UI fixed in AdminWholesaleProductFormPage.tsx");
