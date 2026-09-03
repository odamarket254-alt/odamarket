const fs = require('fs');
let code = fs.readFileSync('src/pages/HelpCenterPage.tsx', 'utf8');

code = code.replace(
  'onClick={() => setShowForm(true)}',
  `onClick={() => {
                    if (user) {
                      setShowForm(true);
                    } else {
                      toast.error("Please log in to submit a support ticket.");
                      navigate("/login");
                    }
                  }}`
);

fs.writeFileSync('src/pages/HelpCenterPage.tsx', code);
console.log("Fixed HelpCenterPage.tsx auth requirement");
