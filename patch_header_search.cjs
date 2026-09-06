const fs = require('fs');

let code = fs.readFileSync('src/components/layout/Header.tsx', 'utf8');

// 1. Replace the fetchSearchResults logic
const fetchReplacement = `const fetchSearchResults = async () => {
      const query = searchQuery.trim();
      if (query.length < 1) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      
      setIsSearching(true);
      setShowDropdown(true);
      
      try {
        const { data: rpcData, error: rpcError } = await supabase
          .rpc("search_products_autocomplete", { search_term: query });
          
        if (!rpcError && rpcData) {
          setSearchResults(rpcData);
        } else {
          // Fallback if migration hasn't been run
          const { data, error } = await supabase
            .from("products")
            .select("id, name, slug, image_url, price, sale_price, stock")
            .eq("is_active", true)
            .ilike("name", \`%\${query}%\`)
            .limit(8);
            
          if (!error && data) {
             const sorted = data.sort((a, b) => {
               const aStarts = a.name.toLowerCase().startsWith(query.toLowerCase()) ? 1 : 0;
               const bStarts = b.name.toLowerCase().startsWith(query.toLowerCase()) ? 1 : 0;
               return bStarts - aStarts; 
             });
             setSearchResults(sorted);
          }
        }
      } catch (err) {
        console.error("Predictive search error:", err);
      } finally {
        setIsSearching(false);
      }
    };`;

code = code.replace(/const fetchSearchResults = async \(\) => \{[\s\S]*?finally \{\s*setIsSearching\(false\);\s*\}\s*\};\s*const debounceTimer = setTimeout\(fetchSearchResults, 300\);/, 
  fetchReplacement + '\n\n    const debounceTimer = setTimeout(fetchSearchResults, 300);');

// 2. Replace the dropdown UI
const dropdownUIReplacement = `<ul>
            {searchResults.map((product) => {
              const actualPrice = product.sale_price || product.price || 0;
              const isOutOfStock = typeof product.stock === 'number' && product.stock <= 0;
              return (
              <li key={product.id}>
                <Link
                  to={\`/products/\${product.id}\`}
                  onClick={() => {
                    setShowDropdown(false);
                    setSearchQuery("");
                  }}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 relative"
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 relative">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className={\`w-full h-full object-cover \${isOutOfStock ? 'opacity-50' : ''}\`} />
                    ) : (
                      <Package className="w-6 h-6 text-gray-400 m-auto mt-3" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={\`text-sm font-medium truncate \${isOutOfStock ? 'text-gray-500' : 'text-gray-900'}\`}>{product.name}</h4>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className={\`text-sm font-bold \${isOutOfStock ? 'text-gray-400' : 'text-[#C65A28]'}\`}>
                        KSh {actualPrice.toLocaleString()}
                      </span>
                      {isOutOfStock && (
                        <span className="text-[10px] font-bold text-white bg-red-500 px-2 py-0.5 rounded-sm uppercase tracking-wider">
                          Out of Stock
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            )})}
            <li>
              <button 
                onClick={handleSearch}
                className="w-full p-3 text-center text-sm text-[#C65A28] font-medium hover:bg-[#C65A28]/5 transition-colors flex items-center justify-center gap-1"
              >
                View all results for "{searchQuery}" <ChevronRight className="w-4 h-4" />
              </button>
            </li>
          </ul>`;

code = code.replace(/<ul>[\s\S]*?<\/ul>/, dropdownUIReplacement);

// 3. Replace the "No products found" text
code = code.replace(/<div className="p-4 text-center text-sm text-gray-500">No products found.<\/div>/, 
  `<div className="p-6 text-center">
            <div className="text-sm font-medium text-gray-900 mb-1">No products found for "{searchQuery}"</div>
            <div className="text-xs text-gray-500">Try checking your spelling or use more general terms.</div>
          </div>`);

fs.writeFileSync('src/components/layout/Header.tsx', code);
