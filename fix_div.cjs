const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/AdminProductFormPage.tsx', 'utf8');

content = content.replace(
  /                <\/div>\n              <\/div>\n            <\/div>\n\n            \{\/\* Next\/Prev Navigation \*\/\}/,
  `              </div>\n            </div>\n\n            {/* Next/Prev Navigation */}`
);

fs.writeFileSync('src/pages/admin/AdminProductFormPage.tsx', content);
