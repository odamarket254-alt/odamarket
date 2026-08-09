const fs = require('fs');
const file = 'src/components/admin/categories/CategoryFormModal.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /const payload = \{\n\s*\.\.\.data,\n\s*parent_id: data\.parent_id \|\| null, \/\/ Convert empty string to null\n\s*image_url: imageUrl,\n\s*\};\n/,
  `const payload = {
        name: data.name,
        slug: data.slug,
        description: data.description,
        parent_id: data.parent_id || null, // Convert empty string to null
        sort_order: data.sort_order,
        is_active: data.is_active,
        image_url: imageUrl,
      };\n`
);

fs.writeFileSync(file, content);
