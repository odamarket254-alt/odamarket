const fs = require('fs');

function fixChannel(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/supabase\.channel\("([^"]+)"\)/g, 'supabase.channel("$1_" + Math.random().toString(36).substring(7))');
  fs.writeFileSync(file, content);
}

fixChannel('src/components/home/WholesaleSection.tsx');
fixChannel('src/components/home/DynamicHomepage.tsx');
console.log("Fixed channels");
