const fs = require('fs');
let content = fs.readFileSync('src/pages/ProductDetailsPage.tsx', 'utf-8');
content = content.replace(
  /const \{ data \} = await supabase\s*\.from\("products"\)\s*\.select\([^;]+;\s*setProduct\(data\);/s,
  `const { data, error } = await supabase
        .from("products")
        .select('*, profiles(business_name, verified), category:categories(name), brand:brands(name)')
        .eq("id", id)
        .single();
      
      if (error) console.error("Supabase error fetching product:", error);
      setProduct(data);`
);
fs.writeFileSync('src/pages/ProductDetailsPage.tsx', content);
