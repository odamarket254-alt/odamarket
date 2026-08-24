const fs = require('fs');
const content = fs.readFileSync('src/components/home/sections/HeroBannerSection.tsx', 'utf8');

const effectBlock = `  useEffect(() => {
    if (currentIndex >= displayBanners.length) {
      setCurrentIndex(0);
    }
  }, [displayBanners.length, currentIndex]);`;

const newContent = content.replace(effectBlock, '');
const displayBannersEnd = `  }] as HomepageBanner[];`;

const finalContent = newContent.replace(displayBannersEnd, displayBannersEnd + "\n\n" + effectBlock);
fs.writeFileSync('src/components/home/sections/HeroBannerSection.tsx', finalContent);
