const fs = require('fs');
let code = fs.readFileSync('src/components/layout/DashboardLayout.tsx', 'utf8');

if (!code.includes('useMobileMenuStore')) {
  code = code.replace(/import \{ useAuthStore \} from "\.\.\/\.\.\/store\/useAuthStore";/, 'import { useAuthStore } from "../../store/useAuthStore";\nimport { useMobileMenuStore } from "../../store/useMobileMenuStore";');
}

const stateRegex = /const \[isMobileMenuOpen, setIsMobileMenuOpen\] = useState\(false\);/;
if (code.match(stateRegex)) {
  code = code.replace(stateRegex, 'const { isOpen: isMobileMenuOpen, setIsOpen: setIsMobileMenuOpen } = useMobileMenuStore();');
  fs.writeFileSync('src/components/layout/DashboardLayout.tsx', code);
  console.log("Patched layout state");
} else {
  console.log("Could not find state definition");
}
