const fs = require('fs');

function removeRealtime(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  code = code.replace(/const channel = supabase\s*\.channel\([^)]+\)\s*\.on\('postgres_changes'[\s\S]*?\.subscribe\(\);\s*return \(\) => {\s*supabase\.removeChannel\(channel\);\s*};\s*/g, '');
  // Also handle cases without channel variable
  code = code.replace(/supabase\s*\.channel\([^)]+\)\s*\.on\('postgres_changes'[\s\S]*?\.subscribe\(\);\s*/g, '');
  fs.writeFileSync(filePath, code);
}

removeRealtime('src/components/layout/Header.tsx');
removeRealtime('src/components/home/sections/CategoryGridSection.tsx');
removeRealtime('src/components/cart/FreeDeliveryRecommendations.tsx');
