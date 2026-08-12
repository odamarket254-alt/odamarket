const fs = require('fs');
let content = fs.readFileSync('src/components/home/DynamicHomepage.tsx', 'utf8');

// Add import
content = content.replace(
  /import \{ CategoryGridSection \} from '.\/sections\/CategoryGridSection';/,
  "import { CategoryGridSection } from './sections/CategoryGridSection';\nimport { WholesaleSection } from './WholesaleSection';"
);

// Add wholesale section wrapper
const replacement = `
      {sections.map((section, index) => {
        const renderContent = () => {
          switch (section.type) {
            case 'hero_banner':
              return <HeroBannerSection key={section.id} section={section} />;
            
            case 'category_grid':
              return <CategoryGridSection key={section.id} section={section} />;
            
            case 'featured_products':
            case 'flash_deals':
            case 'odamarket_choice':
            case 'buy_more_save_more':
            case 'custom_grid':
              const sectionProducts = featuredProducts
                .filter(fp => fp.section_id === section.id)
                .sort((a, b) => a.sort_order - b.sort_order);
              return <div className={index % 2 === 1 ? "w-full bg-[#E8DCC9] py-8" : "w-full"} key={section.id}><ProductGridSection section={section} sectionProducts={sectionProducts} /></div>;
            
            case 'best_sellers':
            case 'new_arrivals':
            case 'top_rated':
            case 'trending':
            case 'organic':
            case 'budget_deals':
            case 'imported':
            case 'recently_restocked':
            case 'limited_stock':
              return <div className={index % 2 === 1 ? "w-full bg-[#E8DCC9] py-8" : "w-full"} key={section.id}><ProductGridSection section={section} /></div>;
              
            default:
              return null;
          }
        };

        // Inject Wholesale Products after index 5 (Promotional Banner)
        const isAfterPromotionalBanner = index === 5 || section.title === 'Promotional Banner' || section.name === 'Promotional Banner';

        return (
          <import_react.Fragment key={section.id}>
            {renderContent()}
            {isAfterPromotionalBanner && <WholesaleSection />}
          </import_react.Fragment>
        );
      })}
`;

content = content.replace(
  /\{sections\.map\(\(section, index\) => \{[\s\S]*?\}\)\}/,
  replacement.replace('import_react', 'React').replace('import_react', 'React')
);

// Make sure React is imported
if (!content.includes("import React")) {
  content = content.replace(/import \{ useState, useEffect \} from 'react';/, "import React, { useState, useEffect } from 'react';");
}

fs.writeFileSync('src/components/home/DynamicHomepage.tsx', content);
