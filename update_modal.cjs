const fs = require('fs');
const file = 'src/components/admin/categories/CategoryFormModal.tsx';
let content = fs.readFileSync(file, 'utf8');

// Remove iconUrl state
content = content.replace(
  /const \[iconUrl, setIconUrl\] = useState<string>\(category\?\.icon \|\| ''\);/g,
  ''
);

// Remove the ImageUpload for iconUrl
// We need to find the label "Category Icon" and remove its block
content = content.replace(
  /<div>\s*<label className="block text-sm font-medium text-\[#5F5A54\] mb-2">Category Icon<\/label>\s*<ImageUpload value=\{iconUrl\} onChange=\{setIconUrl\} folder="categories\/icons" \/>\s*<\/div>/g,
  ''
);

fs.writeFileSync(file, content);
