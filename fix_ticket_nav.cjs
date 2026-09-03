const fs = require('fs');
let code = fs.readFileSync('src/pages/HelpCenterPage.tsx', 'utf8');

code = code.replace(
  'toast.success("Support request submitted successfully!");\n      navigate(`/help-center/ticket/${ticketNumber}`);',
  `toast.success("Support request submitted successfully!");
      if (user) {
        navigate(\`/help-center/ticket/\${ticketNumber}\`);
      } else {
        // Guests can't view tickets directly in the portal without auth
        setFormData({ name: '', email: '', phone: '', order_id: '', category: 'General Inquiry', subject: '', description: '' });
      }`
);

fs.writeFileSync('src/pages/HelpCenterPage.tsx', code);
console.log("Fixed navigation for unauthenticated users");
