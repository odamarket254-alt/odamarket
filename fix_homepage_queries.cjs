const fs = require('fs');

function fixQuery(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace missing category select with category name
  content = content.replace(
    /\.select\(`\s*\*,/g,
    ".select(`\n        *,\n        category:categories!left(name),"
  );
  
  content = content.replace(
    /\.select\('\*, brands \(name\)'\)/g,
    ".select('*, brands (name), category:categories!left(name)')"
  );
  
  fs.writeFileSync(filePath, content);
}

// Find all homepage sections and fix queries
const glob = require('glob');
glob.sync('src/components/home/**/*.tsx').forEach(fixQuery);
console.log("Fixed missing category selects");
