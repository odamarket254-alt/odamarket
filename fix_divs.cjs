const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/AdminProductFormPage.tsx', 'utf8');

// Find line 612 which is an extra </div> that I left when I removed the Controller.
content = content.replace(
  /                <\/div>\n                   \n                <\/div>\n              <\/div>\n            <\/div>/,
  `                </div>\n              </div>\n            </div>`
);

fs.writeFileSync('src/pages/admin/AdminProductFormPage.tsx', content);
