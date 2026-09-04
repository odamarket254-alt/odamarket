const fs = require('fs');

let content = fs.readFileSync('src/pages/dashboard/BuyerDashboardHome.tsx', 'utf8');

// Add state for categories
content = content.replace(
  'const [savingsData, setSavingsData] = useState<any[]>([]);',
  'const [savingsData, setSavingsData] = useState<any[]>([]);\n  const [popularCategories, setPopularCategories] = useState<any[]>([]);'
);

// Add fetch logic
content = content.replace(
  '// 6. Mock Savings Chart Data',
  `// 5.8 Fetch Categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('id, name, slug, image_url, sort_order')
        .is('parent_id', null)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .limit(6);
      if (categoriesData) {
        setPopularCategories(categoriesData);
      }

      // 6. Mock Savings Chart Data`
);

// Update Popular Categories UI
const oldCategoriesUI = `            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
              <CategoryCard title="Fruits" icon="🍎" />
              <CategoryCard title="Vegetables" icon="🥬" />
              <CategoryCard title="Dairy" icon="🥛" />
              <CategoryCard title="Bakery" icon="🥖" />
              <CategoryCard title="Meat" icon="🥩" />
              <CategoryCard title="Snacks" icon="🍿" />
            </div>`;

const newCategoriesUI = `            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {popularCategories.length > 0 ? (
                popularCategories.map((category) => (
                  <CategoryCard key={category.id} category={category} />
                ))
              ) : (
                <div className="col-span-full py-4 text-center text-sm text-muted-foreground border border-dashed rounded-xl">
                  No popular categories found.
                </div>
              )}
            </div>`;

content = content.replace(oldCategoriesUI, newCategoriesUI);

// Update CategoryCard component
const oldCategoryCard = `function CategoryCard({ title, icon }: { title: string, icon: string }) {
  return (
    <Link to={\`/products?category=\${title.toLowerCase()}\`}>
      <div className="bg-muted/50 hover:bg-primary/5 border border-transparent hover:border-primary/20 p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer h-full text-center">
        <span className="text-3xl mb-1">{icon}</span>
        <span className="text-xs font-medium text-foreground">{title}</span>
      </div>
    </Link>
  );
}`;

const newCategoryCard = `function CategoryCard({ category }: { category: any }) {
  return (
    <Link to={\`/category/\${category.slug || category.id}\`}>
      <div className="bg-white hover:bg-primary/5 border border-gray-100 shadow-sm hover:border-primary/20 p-3 md:p-4 rounded-[14px] md:rounded-xl flex flex-col items-center justify-center gap-3 transition-all hover:-translate-y-1 cursor-pointer h-full text-center overflow-hidden">
        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-muted/30 flex items-center justify-center overflow-hidden border border-gray-50">
          {category.image_url ? (
            <OptimizedImage 
              src={category.image_url} 
              alt={category.name}
              className="w-full h-full object-cover"
              imageType="category"
            />
          ) : (
            <span className="text-2xl text-muted-foreground/50">🛍️</span>
          )}
        </div>
        <span className="text-xs md:text-sm font-semibold text-foreground line-clamp-1">{category.name}</span>
      </div>
    </Link>
  );
}`;

content = content.replace(oldCategoryCard, newCategoryCard);

fs.writeFileSync('src/pages/dashboard/BuyerDashboardHome.tsx', content);
console.log('Successfully updated BuyerDashboardHome.tsx');
