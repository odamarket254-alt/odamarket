const fs = require('fs');
const file = 'src/components/home/sections/ProductGridSection.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace isCarousel = section.settings?.layout === 'carousel';
// with isCarousel = true; so it always shows the carousel
content = content.replace(/const isCarousel = section\.settings\?\.layout === 'carousel';/g, 'const isCarousel = true;');

// Fix hide-scrollbar -> scrollbar-hide
content = content.replace(/hide-scrollbar/g, 'scrollbar-hide');

// Update width of cards to match EXACTLY 2 on mobile and 5-6 on desktop.
// "w-[calc(50vw-22px)] sm:w-[calc(33.333vw-22px)] md:w-[calc(25%-18px)] xl:w-[calc(20%-19px)]"
// This is already exactly 2 on mobile: calc(50vw - margins/gaps). Let's refine the sizing to ensure it's exact.
// Container px-4 (-mx-4 padding adjustments for scroll)
// Gap is 12px mobile, 16px tablet, 20px desktop.
// If mobile gap is 12px, container padding is 16px (px-4).
// Let's use simpler widths: w-[calc(50vw-24px)] on mobile, sm:w-[calc(33.333%-16px)] md:w-[calc(25%-16px)] xl:w-[calc(20%-16px)] etc.

// Let's write out exactly what we need
content = content.replace(
  /className="snap-start shrink-0[^"]+"/g,
  'className="snap-start shrink-0 w-[calc(50vw-22px)] sm:w-[calc(33.333%-16px)] md:w-[calc(25%-16px)] lg:w-[calc(20%-16px)] xl:w-[calc(16.666%-17px)]"'
);

fs.writeFileSync(file, content);
console.log('Fixed ProductGridSection.tsx');
