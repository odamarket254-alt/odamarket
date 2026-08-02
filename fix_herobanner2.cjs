const fs = require('fs');
const file = 'src/components/home/sections/HeroBannerSection.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /fetchBanners\(\);\s*\}, \[\]\);/g;

const newStr = `fetchBanners();

    const channel = supabase.channel('public:homepage_banners')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'homepage_banners' }, () => {
        fetchBanners();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);`;

content = content.replace(regex, newStr);
fs.writeFileSync(file, content);
console.log("Updated HeroBannerSection realtime successfully");
