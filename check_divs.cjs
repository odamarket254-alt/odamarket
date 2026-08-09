const fs = require('fs');
const content = fs.readFileSync('src/pages/admin/AdminProductFormPage.tsx', 'utf8');

let divDepth = 0;
let lineNum = 1;
for (const line of content.split('\n')) {
  const openDivs = (line.match(/<div/g) || []).length;
  const closeDivs = (line.match(/<\/div>/g) || []).length;
  divDepth += openDivs - closeDivs;
  if (openDivs !== closeDivs) {
    // console.log(`Line ${lineNum}: ${openDivs - closeDivs} (Depth: ${divDepth})`);
  }
  lineNum++;
}
console.log(`Final div depth: ${divDepth}`);
