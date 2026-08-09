const fs = require('fs');
const file = 'src/pages/admin/AdminProductFormPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace the block
content = content.replace(
  /<div className="border-t md:border-t-0 md:border-l border-\[\#E8DCC9\] pt-5 md:pt-0 md:pl-6">[\s\S]*?<\/div>\n\s*<\/div>\n\s*<\/div>\n\s*<\/div>\n\s*<\/div>/,
  `</div>\n              </div>\n            </div>`
);

fs.writeFileSync(file, content);
