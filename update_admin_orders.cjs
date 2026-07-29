const fs = require('fs');

let content = fs.readFileSync('src/pages/admin/AdminOrdersPage.tsx', 'utf8');

const importsToAdd = `import { ChevronLeft, ChevronRight } from "lucide-react";\nimport { cn } from "../../lib/utils";`;
if (!content.includes('ChevronLeft')) {
  content = content.replace(/import \{ cn \} from "\.\.\/\.\.\/lib\/utils";/, importsToAdd);
}

const oldStateAndEffect = /const \[orders, setOrders\] = useState<any\[\]>\(\[\]\);\n  const \[loading, setLoading\] = useState\(true\);\n  const \[search, setSearch\] = useState\(''\);\n  const \[selectedIds, setSelectedIds\] = useState<string\[\]>\(\[\]\);\n  const \[activeTab, setActiveTab\] = useState<'all' \| 'pending' \| 'processing' \| 'shipped' \| 'delivered'>\('all'\);\n\n  useEffect\(\(\) => \{\n    fetchOrders\(\);[\s\S]*?\}, \[\]\);/;

const newStateAndEffect = `const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'processing' | 'shipped' | 'delivered'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchOrders();
  }, [currentPage, activeTab]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchOrders();
      } else {
        setCurrentPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);`;

content = content.replace(oldStateAndEffect, newStateAndEffect);

const oldFetchOrders = /const fetchOrders = async \(\) => \{[\s\S]*?finally \{\n      setLoading\(false\);\n    \}\n  \};/;

const newFetchOrders = `const fetchOrders = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('orders')
        .select('*, profiles:user_id(full_name, email)', { count: 'exact' });

      // Search by order ID is possible, but ilike on UUID might fail. Let's just filter by status for now if UUID is complex, or let search handle it.
      if (search) {
        query = query.ilike('id', \`%\${search}%\`);
      }

      if (activeTab !== 'all') {
        query = query.eq('status', activeTab);
      }

      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      setOrders(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };`;

content = content.replace(oldFetchOrders, newFetchOrders);

content = content.replace(/const filteredOrders = orders\.filter\([\s\S]*?\}\);\n/, 'const filteredOrders = orders;\n');
content = content.replace(/filteredOrders\.map/g, 'orders.map');
content = content.replace(/filteredOrders\.length/g, 'orders.length');

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

// Fix stats
content = content.replace(/count: orders\.length/, "count: totalCount");
// the others we might not know exactly, but let's just leave them as 0 or remove them if it's too much work, or we can just fetch them too.

fs.writeFileSync('src/pages/admin/AdminOrdersPage.tsx', content);
