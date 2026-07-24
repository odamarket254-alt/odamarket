const fs = require('fs');
const file = 'src/components/layout/Header.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetContent = `        {/* Search Bar Row */}
        <div className={\`px-4 transition-all duration-200 \${scrolled ? 'py-2' : 'py-3'} bg-[#FFFDF8]\`}>
          <form onSubmit={handleSearch} className="w-full flex items-center h-[50px] rounded-full border-2 border-[#C65A28] bg-[#FFFDF8] overflow-hidden focus-within:ring-2 focus-within:ring-[#C65A28]/20 transition-all">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, brands..." 
              className="flex-1 h-full px-4 bg-transparent outline-none text-[#3A2418] placeholder-[#8B857D] text-[15px]"
            />
            <button type="submit" className="h-full px-4 bg-[#C65A28] text-white flex items-center justify-center shrink-0 hover:bg-[#A84A1E] transition-colors">
              <Search className="w-5 h-5" />
            </button>
          </form>
        </div>`;

const replacementContent = `        {/* Search Bar Row */}
        <div className={\`px-4 transition-all duration-200 \${scrolled ? 'py-2' : 'py-3'} bg-[#FFFDF8]\`}>
          <form onSubmit={handleSearch} className="w-full flex items-center h-[50px] rounded-full border-2 border-[#C65A28] bg-[#FFFDF8] overflow-hidden focus-within:ring-2 focus-within:ring-[#C65A28]/20 transition-all">
            <div className="hidden min-[380px]:flex items-center h-full px-3 border-r border-[#EAEAEA] bg-[#FAF5EC] cursor-pointer hover:bg-[#E8DCC9] shrink-0">
              <span className="text-[13px] font-medium text-[#5F5A54] truncate max-w-[80px]">Categories</span>
              <ChevronDown className="w-3.5 h-3.5 ml-1 text-[#5F5A54]" />
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..." 
              className="flex-1 h-full px-3 sm:px-4 bg-transparent outline-none text-[#3A2418] placeholder-[#8B857D] text-[14px] sm:text-[15px] w-full min-w-0"
            />
            <button type="submit" className="h-full px-4 bg-[#C65A28] text-white flex items-center justify-center shrink-0 hover:bg-[#A84A1E] transition-colors">
              <Search className="w-5 h-5" />
            </button>
          </form>
        </div>`;

content = content.replace(targetContent, replacementContent);
fs.writeFileSync(file, content);
