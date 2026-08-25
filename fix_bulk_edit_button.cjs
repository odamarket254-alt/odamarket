const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/AdminProductsPage.tsx', 'utf8');

const bulkEditHtml = `
                <button onClick={() => setIsBulkEditOpen(true)} className="text-sm font-medium text-[#5F5A54] hover:text-[#3A2418] transition-colors flex items-center gap-1"><Edit2 className="w-3.5 h-3.5"/> Bulk Edit</button>
                <button onClick={() => handleBulkAction('active')} className="text-sm font-medium text-[#5F5A54] hover:text-[#3A2418] transition-colors">Set Active</button>
`;

code = code.replace(/<button onClick=\{\(\) => handleBulkAction\('active'\)\} className="text-sm font-medium text-\[#5F5A54\] hover:text-\[#3A2418\] transition-colors">Set Active<\/button>/, bulkEditHtml);
code = code.replace(/const \[isBulkUploadOpen, setIsBulkUploadOpen\] = useState\(false\);/, `const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);\n  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);`);

fs.writeFileSync('src/pages/admin/AdminProductsPage.tsx', code);
console.log('Fixed bulk edit button');
