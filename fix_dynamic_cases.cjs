const fs = require('fs');

let content = fs.readFileSync('src/components/home/DynamicHomepage.tsx', 'utf8');

content = content.replace(
  /case 'featured_products':\s*case 'flash_deals':/g,
  ''
);

content = content.replace(
  /case 'best_sellers':/,
  `case 'featured_products':
            case 'flash_deals':
            case 'best_sellers':`
);

fs.writeFileSync('src/components/home/DynamicHomepage.tsx', content);
console.log("Fixed DynamicHomepage cases");
