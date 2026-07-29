const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/**/*.{ts,tsx}');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content.replace(/const\s+\},\s*\[/g, '}, [');
  newContent = newContent.replace(/let\s+\},\s*\[/g, '}, [');
  if (content !== newContent) {
    fs.writeFileSync(file, newContent);
    console.log(`Fixed ${file}`);
  }
});
