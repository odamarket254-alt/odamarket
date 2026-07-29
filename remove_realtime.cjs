const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/**/*.{ts,tsx}');
let modifiedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Pattern 1:
  // const channel = supabase.channel('...')
  //   .on('postgres_changes', ...)
  //   .subscribe();
  // return () => { supabase.removeChannel(channel); };
  
  // This regex tries to match the channel creation and the cleanup in useEffect
  content = content.replace(/const\s+\w+\s*=\s*supabase\.channel\([^)]+\)\s*\.on\(\s*['"]postgres_changes['"][\s\S]*?\.subscribe\(\);/g, '');
  content = content.replace(/let\s+\w+\s*=\s*supabase\.channel\([^)]+\)\s*\.on\(\s*['"]postgres_changes['"][\s\S]*?\.subscribe\(\);/g, '');
  
  // Also remove lines like `supabase.removeChannel(channel);`
  content = content.replace(/supabase\.removeChannel\([^)]+\);?/g, '');
  
  // DashboardHome pattern:
  // pChannel = supabase.channel...
  content = content.replace(/[a-zA-Z0-9_]+\s*=\s*supabase\s*\.channel\([^)]+\)[\s\S]*?\.subscribe\(\);/g, '');
  
  // return () => { if (pChannel) ... }
  content = content.replace(/return\s*\(\)\s*=>\s*\{[^}]*if\s*\([^)]+\)\s*[^}]*\};/g, '');
  content = content.replace(/return\s*\(\)\s*=>\s*\{\s*\};/g, '');

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log(`Modified ${file}`);
    modifiedCount++;
  }
});

console.log(`Modified ${modifiedCount} files`);
