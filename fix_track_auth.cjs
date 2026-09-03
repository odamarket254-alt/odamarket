const fs = require('fs');
let code = fs.readFileSync('src/pages/CustomerTicketTrackingPage.tsx', 'utf8');

code = code.replace(
  '  const handleTrack = (e: React.FormEvent) => {\n    e.preventDefault();\n    if (ticketNumber.trim()) {\n      navigate(`/help-center/ticket/${ticketNumber.trim()}`);\n    }\n  };',
  `  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please log in to track your support ticket.");
      navigate("/login");
      return;
    }
    if (ticketNumber.trim()) {
      navigate(\`/help-center/ticket/\${ticketNumber.trim()}\`);
    }
  };`
);

fs.writeFileSync('src/pages/CustomerTicketTrackingPage.tsx', code);
console.log("Fixed tracking auth");
