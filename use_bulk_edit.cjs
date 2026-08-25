const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/AdminProductsPage.tsx', 'utf8');

code = code.replace(/import \{ BulkProductUploadModal \} from '\.\.\/\.\.\/components\/admin\/products\/BulkProductUploadModal';/, `import { BulkProductUploadModal } from '../../components/admin/products/BulkProductUploadModal';\nimport { BulkProductEditModal } from '../../components/admin/products/BulkProductEditModal';`);

const bulkEditModalHtml = `
      <BulkProductEditModal
        isOpen={isBulkEditOpen}
        onClose={() => setIsBulkEditOpen(false)}
        selectedIds={selectedIds}
        onComplete={() => {
          setIsBulkEditOpen(false);
          setSelectedIds([]);
          fetchProducts();
        }}
      />
    </div>
  );
}`;

code = code.replace(/<\/div>\n  \);\n\}/, bulkEditModalHtml);

fs.writeFileSync('src/pages/admin/AdminProductsPage.tsx', code);
console.log('Fixed bulk edit modal usage');
