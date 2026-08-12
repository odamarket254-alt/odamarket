const fs = require('fs');

function fixFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  
  // 1. Fix the schema enum
  content = content.replace(
    /status: z\.enum\(\['active', 'draft', 'archived', 'hidden'\]\)/,
    `status: z.enum(['active', 'draft', 'inactive', 'out_of_stock'])`
  );

  // 2. Fix the initial values
  content = content.replace(/status: 'draft',/, `status: 'draft',`);

  // 3. Fix fetchProduct to map is_active and is_public to status
  content = content.replace(
    /const fetchProduct = async \(\) => \{[\s\S]*?setValue\('is_wholesale', !!data\.is_wholesale\);/,
    `const fetchProduct = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
      
      if (error) throw error;

      if (data) {
        Object.keys(data).forEach((key) => {
          if (key === 'attributes' || key === 'id' || key === 'created_at' || key === 'updated_at' || key === 'is_active' || key === 'is_public' || key === 'status') return;
          if (key === 'price') setValue('regular_price', data[key]);
          else setValue(key as any, data[key] === null ? undefined : data[key]);
        });
        
        let currentStatus: 'active' | 'draft' | 'inactive' | 'out_of_stock' = 'draft';
        if (data.is_active && data.is_public) currentStatus = 'active';
        else if (data.is_active && !data.is_public) currentStatus = 'out_of_stock';
        else if (!data.is_active && data.is_public) currentStatus = 'draft';
        else if (!data.is_active && !data.is_public) currentStatus = 'inactive';
        
        setValue('status', currentStatus);
        setValue('is_wholesale', !!data.is_wholesale);`
  );

  // 4. Fix onSubmit to map status to is_active and is_public, and ensure checkboxes map
  content = content.replace(
    /is_active: data\.status === "active",[\s\S]*?is_public: data\.status !== "hidden" && data\.status !== "archived",/,
    `is_active: data.status === "active" || data.status === "out_of_stock",
        is_public: data.status === "active" || data.status === "draft",
        is_featured: data.is_featured,
        is_new_arrival: data.is_new_arrival,
        is_flash_sale: data.is_flash_sale,
        is_best_deal: data.is_best_deal,
        is_lowest_price: data.is_lowest_price,
        is_electronics_zone: data.is_electronics_zone,`
  );
  
  // Make sure out_of_stock forces stock=0 in the payload
  content = content.replace(
    /stock: data\.stock,/,
    `stock: data.status === 'out_of_stock' ? 0 : data.stock,`
  );

  // 5. Update UI to show the correct status options
  content = content.replace(
    /<SelectItem value="active">[\s\S]*?<SelectItem value="hidden">/,
    `<SelectItem value="active">
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
                            <SelectItem value="hidden" className="hidden">`
  );

  fs.writeFileSync(file, content);
  console.log("Fixed " + file);
}

fixFile('src/pages/admin/AdminProductFormPage.tsx');
fixFile('src/pages/admin/AdminWholesaleProductFormPage.tsx');

