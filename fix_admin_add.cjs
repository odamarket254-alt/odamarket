const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/AdminHomepageManagerPage.tsx', 'utf8');

// Replace addSection
code = code.replace(
  /const addSection = async \(type: SectionType\) => \{[\s\S]*?setSections\(\[\.\.\.sections, data\]\);\s*\}\s*\};/,
  `const addSection = async (type: SectionType) => {
    const newSection = {
      title: \`New \${type.replace('_', ' ')}\`,
      type,
      is_active: true,
      sort_order: sections.length,
      content: {
        layout: 'carousel',
        max_products: 10,
        products_per_row_desktop: 5,
        products_per_row_tablet: 4,
        products_per_row_mobile: 2,
        show_view_all: true
      }
    };
    const { data, error } = await supabase
      .from('homepage_sections')
      .insert([newSection])
      .select()
      .single();

    if (error) {
      toast.error('Failed to add section');
    } else {
      toast.success('Section added');
      const mapped = {
        ...data,
        name: data.name || data.title || '',
        settings: data.settings || data.content || {}
      };
      setSections([...sections, mapped as any]);
    }
  };`
);
fs.writeFileSync('src/pages/admin/AdminHomepageManagerPage.tsx', code);
