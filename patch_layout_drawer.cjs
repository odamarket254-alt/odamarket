const fs = require('fs');
let code = fs.readFileSync('src/components/layout/DashboardLayout.tsx', 'utf8');

// replace getNavItems definition with import
code = code.replace(/import \{ Logo \} from "\.\.\/ui\/Logo";/, 'import { Logo } from "../ui/Logo";\nimport { getNavItems } from "../../utils/navigation";');

const getNavItemsRegex = /const getNavItems = \(\) => \{[\s\S]*?\};\n\n  const navItems = getNavItems\(\);/;
if (code.match(getNavItemsRegex)) {
  code = code.replace(getNavItemsRegex, 'const navItems = getNavItems(profile?.role, profile?.verified);');
  console.log("Replaced getNavItems");
}

// remove the <AnimatePresence> ... </AnimatePresence> entirely
const drawerRegex = /<AnimatePresence>[\s\S]*?<\/AnimatePresence>/;
if (code.match(drawerRegex)) {
  code = code.replace(drawerRegex, '{/* Drawer is now handled globally by MobileBottomNav */}');
  console.log("Removed local drawer");
}

fs.writeFileSync('src/components/layout/DashboardLayout.tsx', code);
