const fs = require('fs');

let code = fs.readFileSync('src/pages/ProductDetailsPage.tsx', 'utf8');

// Add imports
code = code.replace(
  'import { useCartStore } from "../store/useCartStore";',
  'import { useCartStore } from "../store/useCartStore";\nimport { useWishlistStore } from "../store/useWishlistStore";\nimport { useAuthStore } from "../store/useAuthStore";\nimport { cn } from "../lib/utils";'
);

// Add hooks
code = code.replace(
  'const addItem = useCartStore(state => state.addItem);',
  `const addItem = useCartStore(state => state.addItem);
  const { user } = useAuthStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const isWished = product ? isInWishlist(product.id) : false;

  const handleWishlist = (e: any) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to manage your wishlist");
      return;
    }
    if (product) {
      toggleWishlist(user.id, product.id);
    }
  };`
);

// Modify the Heart button
code = code.replace(
  '<Button size="icon" variant="ghost" className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-[#FFFDF8] shadow-sm hover:bg-[#E8DCC9] hover:text-[#B94A48] transition-colors">',
  '<Button onClick={handleWishlist} size="icon" variant="ghost" className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-[#FFFDF8] shadow-sm hover:bg-[#E8DCC9] hover:text-[#B94A48] transition-colors">'
);

code = code.replace(
  '<Heart className="h-4 w-4 sm:h-5 sm:w-5" />',
  '<Heart className={cn("h-4 w-4 sm:h-5 sm:w-5", isWished ? "fill-[#C65A28] text-[#C65A28]" : "")} />'
);

fs.writeFileSync('src/pages/ProductDetailsPage.tsx', code);
console.log("Patched ProductDetailsPage");
