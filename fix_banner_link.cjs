const fs = require('fs');
let code = fs.readFileSync('src/components/home/sections/HeroBannerSection.tsx', 'utf8');

code = code.replace(
  /<Link to={banner\.button_link} className="absolute inset-0 w-full h-full block z-10" draggable={false}>([\s\S]*?)<\/Link>/g,
  `<a href={banner.button_link} className="absolute inset-0 w-full h-full block z-10" draggable={false}>\n                  $1\n                </a>`
);

fs.writeFileSync('src/components/home/sections/HeroBannerSection.tsx', code);
