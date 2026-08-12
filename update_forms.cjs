const fs = require('fs');

function updateForm(file) {
  let content = fs.readFileSync(file, 'utf8');

  // Add zod fields
  content = content.replace(
    /is_featured: z\.boolean\(\)\.default\(false\),/,
    `is_featured: z.boolean().default(false),
  is_new_arrival: z.boolean().default(false),
  is_flash_sale: z.boolean().default(false),
  is_best_deal: z.boolean().default(false),
  is_lowest_price: z.boolean().default(false),
  is_electronics_zone: z.boolean().default(false),`
  );

  // Add default values
  content = content.replace(
    /is_featured: false,/,
    `is_featured: false,
      is_new_arrival: false,
      is_flash_sale: false,
      is_best_deal: false,
      is_lowest_price: false,
      is_electronics_zone: false,`
  );

  // Update submission mapping
  content = content.replace(
    /is_active: data\.status === "active",/,
    `is_active: data.status === "active",
        is_featured: data.is_featured,
        is_new_arrival: data.is_new_arrival,
        is_flash_sale: data.is_flash_sale,
        is_best_deal: data.is_best_deal,
        is_lowest_price: data.is_lowest_price,
        is_electronics_zone: data.is_electronics_zone,`
  );

  // Add the UI section
  // Let's find a good place for the Homepage Visibility section.
  // We can add a new Tab for 'visibility' or add it to 'basic' or 'pricing'.
  // We have tabs: 'basic', 'pricing', 'inventory', 'seo'
  
  if (content.includes("value='basic'")) {
    const visibilityTabStr = `<TabsContent value="visibility" className="space-y-6 mt-4">
                  <div className="bg-white p-6 rounded-2xl border border-[#E8DCC9] shadow-sm">
                    <h3 className="text-lg font-semibold text-[#3A2418] mb-4">Homepage Visibility</h3>
                    <p className="text-sm text-[#5F5A54] mb-6">Where should this product appear?</p>
                    
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <input type="checkbox" id="is_new_arrival" className="w-4 h-4 text-[#C65A28] border-[#E8DCC9] rounded focus:ring-[#C65A28]" {...register('is_new_arrival')} />
                        <Label htmlFor="is_new_arrival" className="text-[#3A2418] font-medium">New Arrivals</Label>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <input type="checkbox" id="is_featured" className="w-4 h-4 text-[#C65A28] border-[#E8DCC9] rounded focus:ring-[#C65A28]" {...register('is_featured')} />
                        <Label htmlFor="is_featured" className="text-[#3A2418] font-medium">Featured Products</Label>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <input type="checkbox" id="is_flash_sale" className="w-4 h-4 text-[#C65A28] border-[#E8DCC9] rounded focus:ring-[#C65A28]" {...register('is_flash_sale')} />
                        <Label htmlFor="is_flash_sale" className="text-[#3A2418] font-medium">Flash Sales</Label>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <input type="checkbox" id="is_best_deal" className="w-4 h-4 text-[#C65A28] border-[#E8DCC9] rounded focus:ring-[#C65A28]" {...register('is_best_deal')} />
                        <Label htmlFor="is_best_deal" className="text-[#3A2418] font-medium">Best Deals of the Week</Label>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <input type="checkbox" id="is_lowest_price" className="w-4 h-4 text-[#C65A28] border-[#E8DCC9] rounded focus:ring-[#C65A28]" {...register('is_lowest_price')} />
                        <Label htmlFor="is_lowest_price" className="text-[#3A2418] font-medium">Lowest Price Everyday</Label>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <input type="checkbox" id="is_electronics_zone" className="w-4 h-4 text-[#C65A28] border-[#E8DCC9] rounded focus:ring-[#C65A28]" {...register('is_electronics_zone')} />
                        <Label htmlFor="is_electronics_zone" className="text-[#3A2418] font-medium">Electronics Zone</Label>
                      </div>
                    </div>
                  </div>
                </TabsContent>`;

    content = content.replace(
      /<TabsList className="bg-\[#FAF5EC\] border border-\[#E8DCC9\]">([\s\S]*?)<\/TabsList>/,
      `<TabsList className="bg-[#FAF5EC] border border-[#E8DCC9]">
                  $1
                  <TabsTrigger value="visibility" className="data-[state=active]:bg-white data-[state=active]:text-[#C65A28]">Visibility</TabsTrigger>
                </TabsList>`
    );
    
    // Add the tab content just before </Tabs>
    content = content.replace(
      /<\/Tabs>\s*<\/div>\s*<div className="lg:col-span-1">/,
      `${visibilityTabStr}\n              </Tabs>\n            </div>\n            <div className="lg:col-span-1">`
    );
    
    // update error field list in onSubmit
    content = content.replace(
      /const tabFields = \{[\s\S]*?\};/,
      `const tabFields = {
        basic: ['name', 'slug', 'description', 'category_id', 'brand_id'],
        pricing: ['regular_price', 'price', 'tax_class'],
        inventory: ['sku', 'barcode', 'stock', 'low_stock_threshold'],
        seo: ['seo_title', 'seo_description'],
        visibility: ['is_featured', 'is_new_arrival', 'is_flash_sale', 'is_best_deal', 'is_lowest_price', 'is_electronics_zone']
      };`
    );
  }

  fs.writeFileSync(file, content);
}

updateForm('src/pages/admin/AdminProductFormPage.tsx');
updateForm('src/pages/admin/AdminWholesaleProductFormPage.tsx');
console.log("Updated forms");
