const fs = require('fs');
const file = 'src/pages/CategoriesPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// replace the entire useEffect
const newUseEffect = `useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("categories")
          .select('*')
          .eq('status', 'active')
          .order('name', { ascending: true });
          
        if (error) throw error;
        
        if (data) {
          const categoryIds = data.map(c => c.id);
          let productsData = null;
          if (categoryIds.length > 0) {
            const { data: pData } = await supabase
              .from("products")
              .select("category_id")
              .eq("status", "active")
              .in("category_id", categoryIds);
            productsData = pData;
          }
            
          const productCounts: Record<string, number> = {};
          if (productsData) {
            productsData.forEach(p => {
              productCounts[p.category_id] = (productCounts[p.category_id] || 0) + 1;
            });
          }

          const categoriesWithCounts = data.map(c => ({
            ...c,
            product_count: productCounts[c.id] || 0
          }));

          setCategories(categoriesWithCounts);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, []);`;

content = content.replace(/useEffect\(\(\) => \{\s*async function fetchCategories\(\) \{[\s\S]*?fetchCategories\(\);\s*\}, \[\]\);/, newUseEffect);

fs.writeFileSync(file, content);
console.log("Fixed fetchCategories");
