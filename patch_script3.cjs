const fs = require('fs');
let code = fs.readFileSync('src/components/home/sections/HeroBannerSection.tsx', 'utf8');

code = code.replace(
  'const fetchBanners = async () => {',
  'const fetchBanners = async () => {\n      try {'
);

code = code.replace(
  '      }\n    };\n    fetchBanners();',
  '      }\n      } catch (err) { console.error("hero fetch error"); }\n    };\n    fetchBanners();'
);
fs.writeFileSync('src/components/home/sections/HeroBannerSection.tsx', code);
