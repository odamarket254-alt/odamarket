import fs from 'fs';
const file = 'src/components/home/sections/HeroBannerSection.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `      const { data, error } = await supabase
        .from('banners')
        .select('*').limit(100)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });`;

const replacement = `      const { data, error } = await supabase
        .from('homepage_banners')
        .select('*').limit(100)
        .eq('is_active', true)
        .order('position', { ascending: true });`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacement);
  
  // also need to change image_url to desktop_image_url and link_url to button_link
  // Let's replace banner.image_url -> banner.desktop_image_url
  content = content.replace(/banner\.image_url/g, "banner.desktop_image_url");
  content = content.replace(/banner\.link_url/g, "banner.button_link");
  content = content.replace(/Shop Collection/g, "{banner.button_text || 'Shop Now'}");

  // add realtime logic:
  const realtimeStr = `    };
    fetchBanners();
  }, []);`;
  
  const newRealtimeStr = `    };
    fetchBanners();
    
    const channel = supabase.channel('public:homepage_banners')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'homepage_banners' }, () => {
        fetchBanners();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);`;
  
  content = content.replace(realtimeStr, newRealtimeStr);
  
  fs.writeFileSync(file, content);
  console.log("Updated HeroBannerSection.tsx");
} else {
  console.log("Could not find fetchBanners query block");
}
