const fs = require('fs');

let content = fs.readFileSync('src/components/home/DynamicHomepage.tsx', 'utf8');

content = content.replace(
  /case 'best_sellers':\s*case 'new_arrivals':/g,
  `case 'best_sellers':
            case 'new_arrivals':
            case 'best_deals':
            case 'lowest_price':
            case 'electronics_zone':`
);

content = content.replace(
  /case 'category_grid':/g,
  `case 'promotional_banner':
              return null; // Ignore placeholder for now, or render if there is a component
            case 'wholesale_products':
              return <div className={index % 2 === 1 ? "w-full bg-[#E8DCC9] py-8" : "w-full"} key={section.id}><WholesaleSection /></div>;
            case 'category_grid':`
);

fs.writeFileSync('src/components/home/DynamicHomepage.tsx', content);
console.log("Fixed DynamicHomepage switch statement");
