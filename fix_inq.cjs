const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/InquiriesPage.tsx', 'utf8');
code = code.replace(/fetchMessages\(\);\s+const\s+activeChannelRef\.current = channel;\s+\}, \[selectedInquiry\]\);/g, 'fetchMessages();\n  }, [selectedInquiry]);');
fs.writeFileSync('src/pages/dashboard/InquiriesPage.tsx', code);
