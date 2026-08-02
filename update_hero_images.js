import fs from 'fs';
const file = 'src/components/home/sections/HeroBannerSection.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `<OptimizedImage src={banner.desktop_image_url} alt={banner.title} imgClassName="absolute right-0 top-0 w-[65%] sm:w-2/3 h-full object-cover rounded-none md:rounded-bl-[100px] opacity-90" className="absolute right-0 top-0 w-[65%] sm:w-2/3 h-full rounded-none md:rounded-bl-[100px] overflow-hidden" />`;

const replacement = `<>
                <OptimizedImage src={banner.desktop_image_url} alt={banner.title} imgClassName="absolute right-0 top-0 w-full md:w-[65%] lg:w-2/3 h-full object-cover rounded-none md:rounded-bl-[100px] opacity-90" className={\`absolute right-0 top-0 w-[65%] sm:w-2/3 h-full rounded-none md:rounded-bl-[100px] overflow-hidden \${banner.mobile_image_url ? 'hidden md:block' : ''}\`} />
                {banner.mobile_image_url && (
                  <OptimizedImage src={banner.mobile_image_url} alt={banner.title} imgClassName="absolute right-0 top-0 w-[65%] sm:w-2/3 h-full object-cover rounded-none opacity-90" className="absolute right-0 top-0 w-[65%] sm:w-2/3 h-full rounded-none overflow-hidden block md:hidden" />
                )}
              </>`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacement);
  fs.writeFileSync(file, content);
  console.log("Updated HeroBannerSection images");
} else {
  console.log("Could not find image tag to replace");
}
