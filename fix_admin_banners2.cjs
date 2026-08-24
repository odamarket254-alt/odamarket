const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/AdminBannersManager.tsx', 'utf8');

code = code.replace(
  /if \(data\) \{\s*setSection\(data\);\s*setBanners\(data\.settings\?\.banners\?\.sort\(\(a: any, b: any\) => \(a\.position \|\| 0\) - \(b\.position \|\| 0\)\) \|\| \[\]\);\s*\}/,
  `if (data) {
      const mapped = {
        ...data,
        name: data.name || data.title || '',
        settings: data.settings || data.content || {}
      };
      setSection(mapped);
      setBanners(mapped.settings?.banners?.sort((a: any, b: any) => (a.position || 0) - (b.position || 0)) || []);
    }`
);

code = code.replace(
  /if \(created\) \{\s*setSection\(created\);\s*setBanners\(\[\]\);\s*\}/,
  `if (created) {
        const mappedCreated = {
          ...created,
          name: created.name || created.title || '',
          settings: created.settings || created.content || {}
        };
        setSection(mappedCreated);
        setBanners([]);
      }`
);

fs.writeFileSync('src/pages/admin/AdminBannersManager.tsx', code);
