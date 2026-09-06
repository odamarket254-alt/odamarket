const fs = require('fs');

let code = fs.readFileSync('src/pages/ProductsPage.tsx', 'utf8');

// Insert after `const priceBounds = ...`
const insertString = `
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [localMinPrice, setLocalMinPrice] = useState(minPriceParam);
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPriceParam);
  const [brandSearchQuery, setBrandSearchQuery] = useState("");

  // Update local inputs when params change or metadata loads
  useEffect(() => {
    setLocalMinPrice(minPriceParam || priceBounds.min.toString());
    setLocalMaxPrice(maxPriceParam || priceBounds.max.toString());
  }, [minPriceParam, maxPriceParam, priceBounds.min, priceBounds.max]);
`;

code = code.replace(/const priceBounds = metadata\?\.priceBounds \|\| \{ min: 0, max: 10000 \};\s*/, 
  `const priceBounds = metadata?.priceBounds || { min: 0, max: 10000 };\n${insertString}\n`);

fs.writeFileSync('src/pages/ProductsPage.tsx', code);
