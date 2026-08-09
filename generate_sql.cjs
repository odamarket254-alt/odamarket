const fs = require('fs');
const categories = {
  "Groceries": ["Rice & Pasta", "Cooking Oil & Ghee", "Flour & Baking", "Sugar & Sweeteners", "Spices & Seasoning", "Canned & Preserved Foods", "Sauces & Condiments"],
  "Fresh Food": ["Fresh Vegetables", "Fresh Fruits", "Herbs & Spices", "Salads"],
  "Meat & Seafood": ["Beef", "Chicken", "Pork", "Mutton & Lamb", "Fish & Seafood", "Sausages & Processed Meat"],
  "Dairy & Eggs": ["Milk", "Eggs", "Cheese", "Butter & Margarine", "Yogurt", "Cream"],
  "Bakery": ["Bread", "Cakes & Pastries", "Biscuits & Cookies", "Buns & Rolls"],
  "Beverages": ["Water", "Sodas & Carbonated Drinks", "Juices", "Coffee", "Tea", "Energy & Sports Drinks"],
  "Snacks & Confectionery": ["Crisps & Chips", "Chocolates", "Sweets & Candies", "Nuts & Seeds", "Popcorn"],
  "Household & Cleaning": ["Laundry Detergents", "Dishwashing", "Surface Cleaners", "Air Fresheners", "Paper Products", "Trash Bags", "Pest Control"],
  "Personal Care": ["Bath & Body", "Hair Care", "Oral Care", "Deodorants & Antiperspirants", "Feminine Care", "Shaving & Grooming", "Hand Wash & Sanitizers"],
  "Beauty & Cosmetics": ["Makeup", "Skincare", "Fragrances", "Nail Care"],
  "Baby & Kids": ["Diapers & Wipes", "Baby Food & Formula", "Baby Bath & Skincare", "Baby Accessories"],
  "Health & Wellness": ["Vitamins & Supplements", "First Aid", "Pain Relievers", "Digestive Health", "Cold & Flu"],
  "Home & Kitchen": ["Cookware", "Tableware & Cutlery", "Food Storage", "Kitchen Towels & Aprons", "Bedding", "Bath Towels", "Home Decor"],
  "Electronics": ["Televisions", "Home Audio", "Small Appliances", "Large Appliances"],
  "Phones & Accessories": ["Smartphones", "Feature Phones", "Phone Cases", "Chargers & Cables", "Power Banks", "Earphones & Headphones"],
  "Fashion": ["Men's Clothing", "Women's Clothing", "Kids' Clothing", "Underwear & Socks", "Bags & Wallets", "Watches & Jewelry"],
  "Footwear": ["Men's Shoes", "Women's Shoes", "Kids' Shoes", "Slippers & Sandals"],
  "Stationery & Office": ["Notebooks & Paper", "Pens & Pencils", "Files & Folders", "School Supplies"],
  "Pet Care": ["Dog Food", "Cat Food", "Pet Accessories", "Pet Grooming"],
  "Automotive": ["Car Care & Cleaning", "Motor Oils & Fluids", "Car Accessories"],
  "Hardware & DIY": ["Tools", "Electricals", "Plumbing", "Paints & Adhesives"],
  "Sports & Fitness": ["Fitness Equipment", "Sports Gear", "Activewear"],
  "Garden & Outdoor": ["Gardening Tools", "Outdoor Seating", "BBQ & Grills"],
  "Toys & Games": ["Action Figures", "Dolls", "Board Games", "Educational Toys", "Outdoor Play"],
  "Party & Events": ["Party Decorations", "Disposable Tableware", "Gift Wrap & Cards"],
  "Seasonal & Special Offers": ["Holiday Specials", "Clearance", "Bundles & Offers"]
};

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

let sql = `-- Odamarket Supermarket Categories Seed SQL\n\n`;

// Clear existing categories (optional, but requested just to seed categories and subcategories so better to be safe)
// Or just TRUNCATE categories CASCADE;
sql += `DO $$\nDECLARE\n`;
let varDecls = [];
let inserts = [];
let idx = 1;

for (const [parent, children] of Object.entries(categories)) {
  const pSlug = slugify(parent);
  const pVar = `p_${pSlug.replace(/-/g, '_')}`;
  varDecls.push(`  ${pVar} UUID;`);
  
  inserts.push(`  -- ${parent}`);
  inserts.push(`  INSERT INTO public.categories (name, slug, is_active, sort_order)`);
  inserts.push(`  VALUES ('${parent}', '${pSlug}', true, ${idx * 10})`);
  inserts.push(`  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name`);
  inserts.push(`  RETURNING id INTO ${pVar};`);
  
  for (const child of children) {
    const cSlug = slugify(child);
    inserts.push(`  INSERT INTO public.categories (name, slug, parent_id, is_active)`);
    inserts.push(`  VALUES ('${child}', '${cSlug}', ${pVar}, true)`);
    inserts.push(`  ON CONFLICT (slug) DO UPDATE SET parent_id = EXCLUDED.parent_id, name = EXCLUDED.name;`);
  }
  inserts.push(``);
  idx++;
}

sql += varDecls.join('\n') + `\nBEGIN\n\n` + inserts.join('\n') + `\nEND $$;\n`;

fs.writeFileSync('supermarket_categories.sql', sql);
console.log("SQL generated");
