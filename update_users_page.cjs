const fs = require('fs');

let content = fs.readFileSync('src/pages/dashboard/UsersPage.tsx', 'utf8');

const importsToAdd = `import { ChevronLeft, ChevronRight } from "lucide-react";\nimport { cn } from "../../lib/utils";`;
if (!content.includes('ChevronLeft')) {
  content = content.replace(/import \{ cn \} from "\.\.\/\.\.\/lib\/utils";/, importsToAdd);
}

const oldStateAndEffect = /const \[users, setUsers\] = useState<any\[\]>\(\[\]\);\n  const \[isLoading, setIsLoading\] = useState\(true\);\n  const \[search, setSearch\] = useState\(""\);\n\n  const fetchUsers = async \(\) => \{[\s\S]*?finally \{\n      setIsLoading\(false\);\n    \}\n  \};\n\n  useEffect\(\(\) => \{\n    fetchUsers\(\);\n    \n    \/\/ Listen to real-time profile updates for verification requests\n    \}, \[\]\);/;

const newStateAndEffect = `const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchUsers();
  }, [currentPage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchUsers();
      } else {
        setCurrentPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      
      let query = supabase
        .from("profiles")
        .select("*", { count: 'exact' });

      if (search) {
        query = query.or(\`full_name.ilike.%\${search}%,email.ilike.%\${search}%,business_name.ilike.%\${search}%\`);
      }

      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      setUsers(data || []);
      setTotalCount(count || 0);
    } catch (err: any) {
      toast.error(err.message || "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };`;

content = content.replace(oldStateAndEffect, newStateAndEffect);

content = content.replace(/const filtered = users\.filter\([\s\S]*?\}\);\n/, 'const filtered = users;\n');
content = content.replace(/filtered\.map/g, 'users.map');
content = content.replace(/filtered\.length/g, 'totalCount');

const paginationHTML = `
        {/* Pagination */}
        {totalCount > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#E8DCC9] bg-[#FFFDF8] rounded-b-2xl">
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

content = content.replace(/<\/table>\n\s*<\/div>\n\s*<\/div>/, `</table>\n        </div>\n${paginationHTML}\n      </div>`);

fs.writeFileSync('src/pages/dashboard/UsersPage.tsx', content);
