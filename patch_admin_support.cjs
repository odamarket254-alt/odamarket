const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/AdminSupportPage.tsx', 'utf8');

// Remove resolved_at assignment
code = code.replace(/if \(\s*newStatus === 'Resolved' \|\| newStatus === 'Closed'\s*\) \{\s*updateData\.resolved_at = new Date\(\)\.toISOString\(\);\s*\}/, 
  `// Removed resolved_at since column doesn't exist`);

// Fix the statistics calculation
code = code.replace(/resolved: tickets\.filter\(t => t\.status === 'Resolved' && new Date\(t\.resolved_at\)\.toDateString\(\) === new Date\(\)\.toDateString\(\)\)\.length/,
  `resolved: tickets.filter(t => (t.status === 'Resolved' || t.status === 'Closed') && new Date(t.updated_at).toDateString() === new Date().toDateString()).length`);

fs.writeFileSync('src/pages/dashboard/AdminSupportPage.tsx', code);
