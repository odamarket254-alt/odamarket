const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/**/*.{ts,tsx}');
let count = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // Avoid replacing .select('*', { count: ... })
  // Avoid replacing if .single() or .maybeSingle() or .limit() follows
  
  let newContent = content.replace(/\.select\(['"]\*['"]\)(?![\s\S]{0,30}(\.single|\.maybeSingle|\.limit|\.range|,\s*\{))/g, ".select('*').limit(100)");
  newContent = newContent.replace(/\.select\(['"](.*?)['"]\)(?![\s\S]{0,30}(\.single|\.maybeSingle|\.limit|\.range|,\s*\{))/g, (match, p1) => {
    if (p1.includes('exact') || p1.includes('count')) return match;
    return `.select('${p1}').limit(100)`;
  });

  if (content !== newContent) {
    fs.writeFileSync(file, newContent);
    console.log(`Updated selects in ${file}`);
    count++;
  }
});
console.log(`Updated ${count} files.`);
