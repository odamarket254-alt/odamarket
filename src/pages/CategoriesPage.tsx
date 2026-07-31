import { OptimizedImage } from "../components/ui/OptimizedImage";
import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Breadcrumbs } from "../components/ui/Breadcrumbs";
import { cn } from "../lib/utils";
import { Package, Loader2, Search, ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data, error } = await supabase
          .from("categories")
          .select('*')
          .eq('status', 'active')
          .order('name', { ascending: true }); // Alphabetical sorting
        
        if (error) {
          console.error("Error fetching categories:", error);
        } else if (data) {
          setCategories(data);
          
          // Expand all parents by default initially or if search is active
          const parents = data.filter(c => c.parent_id === null).map(c => c.id);
          setExpandedParents(new Set(parents));
        }
      } catch (err) {
        console.error("Unexpected error fetching categories:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, []);

  const toggleParent = (parentId: string) => {
    setExpandedParents(prev => {
      const next = new Set(prev);
      if (next.has(parentId)) {
        next.delete(parentId);
      } else {
        next.add(parentId);
      }
      return next;
    });
  };

  const filteredHierarchy = useMemo(() => {
    if (!categories) return [];
    
    const query = searchQuery.toLowerCase();
    
    // Create map for easy lookup
    const catMap = new Map(categories.map(c => [c.id, { ...c, children: [] }]));
    
    // Build tree
    const roots: any[] = [];
    categories.forEach(c => {
      const node = catMap.get(c.id);
      if (c.parent_id && catMap.has(c.parent_id)) {
        catMap.get(c.parent_id).children.push(node);
      } else if (!c.parent_id) {
        roots.push(node);
      }
    });
    
    if (!query) {
      // Sort roots alphabetically
      roots.sort((a, b) => a.name.localeCompare(b.name));
      // Sort children alphabetically
      roots.forEach(r => r.children.sort((a: any, b: any) => a.name.localeCompare(b.name)));
      return roots;
    }
    
    // Filter based on search query
    const filteredRoots = roots.map(root => {
      const rootMatches = root.name.toLowerCase().includes(query);
      const matchingChildren = root.children.filter((child: any) => child.name.toLowerCase().includes(query));
      
      if (rootMatches || matchingChildren.length > 0) {
        return {
          ...root,
          children: matchingChildren.length > 0 ? matchingChildren : root.children,
          isMatch: rootMatches
        };
      }
      return null;
    }).filter(Boolean);
    
    // Sort filtered alphabetically
    filteredRoots.sort((a, b) => a.name.localeCompare(b.name));
    filteredRoots.forEach(r => r.children.sort((a: any, b: any) => a.name.localeCompare(b.name)));
    
    return filteredRoots;
  }, [categories, searchQuery]);
  
  // Ensure search expands all matching parents
  useEffect(() => {
    if (searchQuery) {
      const parentsToExpand = filteredHierarchy.map((h: any) => h.id);
      setExpandedParents(new Set(parentsToExpand));
    }
  }, [searchQuery, filteredHierarchy]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#C65A28]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF5EC] pt-20 md:pt-28 pb-16 md:pb-24 font-poppins overflow-x-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <Breadcrumbs items={[{ label: "Categories" }]} />
        <div className="max-w-3xl mb-10 mt-6 sm:mt-8">
          <h1 className="text-[clamp(32px,5vw,56px)] font-black tracking-tight text-[#3A2418] mb-4 sm:mb-6 leading-none">
            Explore <span className="text-[#C65A28]">Categories</span>
          </h1>
          <p className="text-[clamp(16px,2vw,20px)] text-[#5F5A54] mb-8">
            Browse our comprehensive selection of premium products, categorized for your shopping convenience.
          </p>
          
          {/* Search Bar */}
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B857D] w-5 h-5" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-[#E8DCC9] rounded-2xl shadow-sm focus:ring-2 focus:ring-[#C65A28]/20 focus:border-[#C65A28] outline-none transition-all placeholder:text-[#8B857D] text-[#3A2418]"
            />
          </div>
        </div>
        
        {filteredHierarchy.length === 0 ? (
          <div className="w-full flex items-center justify-center p-12 bg-[#FFFDF8] rounded-2xl border border-[#E8DCC9] border-dashed">
            <p className="text-[#5F5A54]">No categories found matching "{searchQuery}".</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredHierarchy.map((parent, i) => {
              const isExpanded = expandedParents.has(parent.id);
              return (
                <motion.div
                  key={parent.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-3xl border border-[#E8DCC9]/50 shadow-[0_4px_20px_rgba(45,45,45,0.02)] overflow-hidden"
                >
                  <button 
                    onClick={() => toggleParent(parent.id)}
                    className="w-full flex items-center justify-between p-4 sm:p-6 text-left hover:bg-[#FAF5EC]/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#FAF5EC] to-[#E8DCC9]/30 flex items-center justify-center p-2 sm:p-3 overflow-hidden relative shadow-inner shrink-0">
                        {parent.image_url ? (
                          <OptimizedImage 
                            src={parent.image_url} 
                            alt={parent.name} 
                            className="w-full h-full"
                            imgClassName="w-full h-full object-contain mix-blend-multiply" 
                          />
                        ) : (
                          <Package className="w-8 h-8 sm:w-10 sm:h-10 text-[#D9A62E]" />
                        )}
                      </div>
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-[#3A2418]">{parent.name}</h2>
                        {parent.children.length > 0 && (
                          <p className="text-sm text-[#8B857D] mt-1">{parent.children.length} subcategories</p>
                        )}
                      </div>
                    </div>
                    <div className="p-2 sm:p-3 bg-[#FAF5EC] rounded-full text-[#5F5A54]">
                      <ChevronDown className={cn("w-5 h-5 transition-transform duration-300", isExpanded && "rotate-180")} />
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <div className="p-4 sm:p-6 pt-0 sm:pt-0 border-t border-[#E8DCC9]/30">
                          {parent.children.length === 0 ? (
                            <p className="text-[#8B857D] text-sm py-4">No subcategories available.</p>
                          ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 mt-4">
                              {parent.children.map((child: any) => (
                                <Link
                                  key={child.id}
                                  to={`/category/${child.id}`}
                                  className="group flex flex-col items-center p-4 bg-[#FAF5EC]/30 rounded-2xl border border-[#E8DCC9]/30 hover:bg-[#FFFDF8] hover:border-[#C65A28]/20 hover:shadow-sm transition-all text-center h-full"
                                >
                                  <span className="text-[15px] font-semibold text-[#5F5A54] group-hover:text-[#C65A28] leading-tight transition-colors">
                                    {child.name}
                                  </span>
                                </Link>
                              ))}
                            </div>
                          )}
                          <div className="mt-6 text-center sm:text-right">
                             <Link
                                to={`/category/${parent.id}`}
                                className="inline-flex items-center text-sm font-semibold text-[#C65A28] hover:text-[#A0451C] transition-colors"
                              >
                                View all in {parent.name}
                                <ChevronRight className="w-4 h-4 ml-1" />
                              </Link>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
