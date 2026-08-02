const fs = require('fs');
const file = 'src/components/home/sections/CategoryGridSection.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /: 'flex'}`/g,
  ": 'flex'}`}"
);

fs.writeFileSync(file, content);
console.log("Updated CategoryGridSection again");
