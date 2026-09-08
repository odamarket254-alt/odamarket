const fs = require('fs');
let code = fs.readFileSync('src/utils/generateInvoice.ts', 'utf8');

code = code.replace(/import "jspdf-autotable";/, 'import autoTable from "jspdf-autotable";');
code = code.replace(/\(doc as any\)\.autoTable\(\{/, 'autoTable(doc, {');
code = code.replace(/\(doc as any\)\.lastAutoTable\.finalY/, '(doc as any).lastAutoTable.finalY');

fs.writeFileSync('src/utils/generateInvoice.ts', code);
