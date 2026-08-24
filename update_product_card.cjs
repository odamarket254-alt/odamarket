const fs = require('fs');
let code = fs.readFileSync('src/components/products/ProductCard.tsx', 'utf8');

const infoRegex = /<div className=\{cn\("flex flex-col text-left flex-1", isList \? "p-3" : "py-1"\)\}>([\s\S]*?)<\/div>\s*<\/div>\s*\);/g;

const newInfo = `<div className={cn("flex flex-col text-left flex-1", isList ? "p-3" : "py-1")}>
        <Link to={\`/products/\${product.id}\`} className="block">
          <h3 className="text-[#111827] text-sm md:text-[15px] font-semibold leading-tight line-clamp-2 hover:text-[#C65A28] transition-colors">
            {product.name}
          </h3>
        </Link>
        
        <p className="text-xs text-[#6B7280] mt-1">
          {variantText}
        </p>
        
        <div className="flex items-baseline gap-1 mt-auto pt-2">
          <span className="text-[11px] md:text-xs font-bold text-[#C65A28]">KES</span>
          <div className="flex items-baseline">
            <span className="text-lg md:text-xl font-extrabold text-black tracking-tight">
              {Number(whole).toLocaleString('en-US')}
            </span>
            <span className="text-xs md:text-sm font-bold text-black">
              .{fraction}
            </span>
          </div>
        </div>
        
        {isList && (
          <button 
            onClick={handleAdd} 
            className="mt-auto self-end w-[32px] h-[32px] rounded-full bg-[#C65A28] text-white flex items-center justify-center border-[1.5px] border-white shadow-sm hover:scale-105 active:scale-95 transition-transform"
            aria-label="Add to cart"
          >
            <Plus className="w-[18px] h-[18px] stroke-[2.5px]" />
          </button>
        )}
      </div>
    </div>
  );`;

code = code.replace(infoRegex, newInfo);

// Increase image size slightly inside container by reducing padding, or centering
code = code.replace(/"w-full aspect-\[158\/151\] p-\[8px\]"/, '"w-full aspect-square p-2 md:p-3"');
code = code.replace(/className="absolute bottom-\[6px\] right-\[6px\]/g, 'className="absolute bottom-2 right-2');

fs.writeFileSync('src/components/products/ProductCard.tsx', code);
