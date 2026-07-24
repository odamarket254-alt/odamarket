const fs = require('fs');

const file = 'src/components/layout/Header.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetContent = `<div className="md:hidden flex flex-col bg-[#FFFDF8] w-full">
        {/* Top Header Row (60-64px height) */}
        <div className="flex items-center justify-between h-[70px] px-4 sm:px-6 border-b border-gray-200 bg-[#FFFDF8] shadow-sm">
          <div className="flex items-center gap-3">
            <button className="w-8 h-8 flex items-center justify-center text-[#3A2418]">
              <Menu className="w-[22px] h-[22px]" />
            </button>
            <Link to="/" className="flex items-center shrink-0">
              <Logo className="h-[45px] sm:h-[55px] lg:h-[70px]" />
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <Link to={user ? (profile?.role === 'admin' ? '/admin/dashboard' : \`/\${profile?.role || 'buyer'}/dashboard\`) : '/login'} className="text-[#5F5A54]">
              <User className="w-[22px] h-[22px]" />
            </Link>
            <Link to="/wishlist" className="text-[#5F5A54]">
              <Heart className="w-[22px] h-[22px]" />
            </Link>
            <Link to="/cart" className="relative text-[#3A2418]">
              <ShoppingCart className="w-[24px] h-[24px]" />
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#C65A28] text-white text-[11px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                {cartCount}
              </span>
            </Link>
          </div>
        </div>

        {/* Search Bar Row */}
        <div className={\`px-4 transition-all duration-200 \${scrolled ? 'py-2' : 'pt-2 pb-0'}\`}>
          <form onSubmit={handleSearch} className="w-full flex items-center h-[48px] rounded-[24px] border border-gray-200 bg-[#FFFDF8] overflow-hidden shadow-sm">
            <div className="pl-4 text-[#8B857D]">
              <Search className="w-[18px] h-[18px]" />
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, brands..." 
              className="flex-1 h-full px-3 bg-transparent outline-none text-[#3A2418] placeholder-[#8B857D] text-[14px]"
            />
            <button type="submit" className="h-full px-5 bg-[#C65A28] text-white flex items-center justify-center font-medium text-sm">
              Search
            </button>
          </form>
        </div>`;

const replacementContent = `<div className="md:hidden flex flex-col bg-[#FFFDF8] w-full">
        {/* Top Header Row */}
        <div className="flex items-center justify-between h-[72px] px-4 sm:px-6 border-b border-gray-200 bg-[#FFFDF8] shadow-sm">
          <div className="flex items-center gap-2">
            <button className="w-11 h-11 flex items-center justify-center text-[#3A2418] hover:bg-gray-100 rounded-full transition-colors shrink-0">
              <Menu className="w-6 h-6" />
            </button>
            <Link to="/" className="flex items-center shrink-0 ml-1 py-1">
              <Logo className="h-[44px] sm:h-[48px]" />
            </Link>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2">
            <Link to={user ? (profile?.role === 'admin' ? '/admin/dashboard' : \`/\${profile?.role || 'buyer'}/dashboard\`) : '/login'} className="w-11 h-11 flex items-center justify-center text-[#5F5A54] hover:bg-gray-100 rounded-full transition-colors shrink-0">
              <User className="w-[22px] h-[22px]" />
            </Link>
            <Link to="/wishlist" className="w-11 h-11 flex items-center justify-center text-[#5F5A54] hover:bg-gray-100 rounded-full transition-colors shrink-0">
              <Heart className="w-[22px] h-[22px]" />
            </Link>
            <Link to="/cart" className="w-11 h-11 flex items-center justify-center relative text-[#3A2418] hover:bg-gray-100 rounded-full transition-colors shrink-0">
              <ShoppingCart className="w-[24px] h-[24px]" />
              <span className="absolute top-1 right-1 w-[18px] h-[18px] bg-[#C65A28] text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-[#FFFDF8]">
                {cartCount}
              </span>
            </Link>
          </div>
        </div>

        {/* Search Bar Row */}
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

content = content.replace(targetContent, replacementContent);
fs.writeFileSync(file, content);

