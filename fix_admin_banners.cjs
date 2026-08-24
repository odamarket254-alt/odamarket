const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/AdminBannersManager.tsx', 'utf8');

code = code.replace(
  /const newSection = \{\s*name: 'Hero Banners',\s*type: 'hero_banner',\s*is_active: true,\s*sort_order: 0,\s*settings: \{ banners: \[\] \}\s*\};/,
  `const newSection = {
        title: 'Hero Banners',
        type: 'hero_banner',
        is_active: true,
        sort_order: 0,
        content: { banners: [] }
      };`
);

code = code.replace(
  /const \{ error \} = await supabase\s*\.from\('homepage_sections'\)\s*\.update\(\{\s*settings: \{ \.\.\.section\.settings, banners: positionedBanners \}\s*\}\)\s*\.eq\('id', section\.id\);/,
  `const { error } = await supabase
      .from('homepage_sections')
      .update({
        content: { ...section.settings, banners: positionedBanners }
      })
      .eq('id', section.id);`
);

fs.writeFileSync('src/pages/admin/AdminBannersManager.tsx', code);
