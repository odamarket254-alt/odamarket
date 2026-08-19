const fs = require('fs');
const file = 'src/components/home/WholesaleSection.tsx';
let content = fs.readFileSync(file, 'utf8');

const replaceRegex = /\s*\{\/\* Mobile Grid \(2 cols\) \*\/\}[\s\S]*?\{\/\* Desktop Carousel \*\/\}\s*<div className="hidden md:flex overflow-x-auto pb-6 -mx-4 px-4 snap-x snap-mandatory gap-4 lg:gap-6 hide-scrollbar">/m;

const replacement = `
        {/* Horizontal Carousel (All Devices) */}
        <div className="flex overflow-x-auto pb-6 -mx-4 px-4 snap-x snap-mandatory gap-3 sm:gap-4 lg:gap-6 scrollbar-hide">`;

content = content.replace(replaceRegex, replacement);

fs.writeFileSync(file, content);
console.log('Fixed WholesaleSection layout');
