const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/BuyerDashboardHome.tsx', 'utf8');

if (!code.includes('import { Button } from')) {
  code = code.replace("import { Card } from '../../components/ui/Card';", "import { Card } from '../../components/ui/Card';\nimport { Button } from '../../components/ui/Button';\nimport { Image as ImageIcon } from 'lucide-react';");
}

fs.writeFileSync('src/pages/dashboard/BuyerDashboardHome.tsx', code);
