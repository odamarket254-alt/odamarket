const fs = require('fs');

let content = fs.readFileSync('src/pages/admin/AdminProductsPage.tsx', 'utf8');

const importsToAdd = `import { ChevronLeft, ChevronRight } from "lucide-react";\nimport { cn } from "../../lib/utils";`;
if (!content.includes('ChevronLeft')) {
  content = content.replace(/import \{ cn \} from "\.\.\/\.\.\/lib\/utils";/, importsToAdd);
}

// Replace the state and useEffect
const oldStateAndEffect = /const \[products, setProducts\] = useState<any\[\]>\(\[\]\);\n  const \[loading, setLoading\] = useState\(true\);\n  const \[search, setSearch\] = useState\(''\);\n  const \[selectedIds, setSelectedIds\] = useState<string\[\]>\(\[\]\);\n  const \[activeTab, setActiveTab\] = useState<'all' \| 'active' \| 'draft' \| 'archived' \| 'out_of_stock'>\('all'\);\n  const \[stats, setStats\] = useState\(\{ total: 0, active: 0, draft: 0, archived: 0, outOfStock: 0, lowStock: 0 \}\);\n\n  useEffect\(\(\) => \{\n    fetchProducts\(\);\n    \n    \n  \}, \[\]\);/;

const newStateAndEffect = `const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'draft' | 'archived' | 'out_of_stock'>('all');
  const [stats, setStats] = useState({ total: 0, active: 0, draft: 0, archived: 0, outOfStock: 0, lowStock: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchProducts();
    fetchStats();
  }, [currentPage, activeTab]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchProducts();
        fetchStats();
      } else {
        setCurrentPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);
  
  const fetchStats = async () => {
    try {
      // Fetch counts for tabs
      const [totalReq, activeReq, draftReq, archReq, outReq, lowReq] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('status', 'archived'),
        supabase.from('products').select('id', { count: 'exact', head: true }).lte('stock_quantity', 0),
        supabase.from('products').select('id', { count: 'exact', head: true }).lte('stock_quantity', 10).gt('stock_quantity', 0)
      ]);
      setStats({
        total: totalReq.count || 0,
        active: activeReq.count || 0,
        draft: draftReq.count || 0,
        archived: archReq.count || 0,
        outOfStock: outReq.count || 0,
        lowStock: lowReq.count || 0
      });
    } catch (e) {
      console.error(e);
    }
  };`;

content = content.replace(oldStateAndEffect, newStateAndEffect);

const oldFetchProducts = /const fetchProducts = async \(\) => \{[\s\S]*?finally \{\n      setLoading\(false\);\n    \}\n  \};/;

const newFetchProducts = `const fetchProducts = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('products')
        .select('*, product_type:product_types!left(name)', { count: 'exact' });

      if (search) {
        query = query.or(\`name.ilike.%$\{search\}%,sku.ilike.%$\{search\}%,barcode.ilike.%$\{search\}%\`);
      }

      if (activeTab === 'out_of_stock') {
        query = query.lte('stock_quantity', 0);
      } else if (activeTab !== 'all') {
        query = query.eq('status', activeTab);
      }

      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      
      setProducts(data || []);
      setTotalCount(count || 0);
      
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };`;

content = content.replace(oldFetchProducts, newFetchProducts);

// Remove the client-side filteredProducts
content = content.replace(/const filteredProducts = products\.filter\([\s\S]*?\}\);\n/, 'const filteredProducts = products;\n');

// Replace filteredProducts.map in selectAll
content = content.replace(/filteredProducts\.map/g, 'products.map');
content = content.replace(/filteredProducts\.length/g, 'products.length');

// Replace table pagination
const paginationHTML = `
            {/* Pagination */}
            {totalCount > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-[#E8DCC9]">
                <div className="text-sm text-[#5F5A54]">
                  Showing <span className="font-medium text-[#3A2418]">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-[#3A2418]">{Math.min(currentPage * itemsPerPage, totalCount)}</span> of <span className="font-medium text-[#3A2418]">{totalCount}</span> results
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-[#E8DCC9] rounded-lg text-[#5F5A54] hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="text-sm font-medium text-[#3A2418]">Page {currentPage}</div>
                  <button
                    onClick={() => setCurrentPage(p => p + 1)}
                    disabled={currentPage * itemsPerPage >= totalCount}
                    className="p-2 border border-[#E8DCC9] rounded-lg text-[#5F5A54] hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
`;

content = content.replace(/<\/table>\n\s*<\/div>\n\s*<\/div>/, `</table>\n            </div>\n${paginationHTML}\n          </div>`);

fs.writeFileSync('src/pages/admin/AdminProductsPage.tsx', content);
console.log('Done rewriting AdminProductsPage.tsx');
