const fs = require('fs');
const file = 'src/components/home/sections/HeroBannerSection.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldStr = `      } catch (err) {
        console.error(err);
      }
    };
    fetchBanners();
  }, []);`;

const newStr = `      } catch (err) {
        console.error(err);
      }
    };
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

if (content.includes(oldStr)) {
  content = content.replace(oldStr, newStr);
  fs.writeFileSync(file, content);
  console.log("Updated HeroBannerSection realtime successfully");
} else {
  console.log("Failed to find block");
}
