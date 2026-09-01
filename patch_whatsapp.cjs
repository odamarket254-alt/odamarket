const fs = require('fs');
let code = fs.readFileSync('src/components/layout/DashboardLayout.tsx', 'utf8');

if (!code.includes('getWhatsAppLink')) {
  code = code.replace(/import \{ Button \} from "\.\.\/ui\/Button";/, 'import { Button } from "../ui/Button";\nimport { getWhatsAppLink } from "../../utils/whatsapp";');
}

// Replace the Link mapping in desktop nav
const desktopNavRegex = /(<Link[\s\S]*?key=\{item\.path\}[\s\S]*?to=\{item\.path\})([\s\S]*?<\/Link>)/;
if (code.match(desktopNavRegex)) {
  const replacement = `
              {item.action === "whatsapp" ? (
                <a
                  key={item.label}
                  href={getWhatsAppLink("Hello ODA Market, I would like to place an order.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:text-[#25D366]"
                  )}
                >
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  {item.label}
                </a>
              ) : (
                $1$2
              )}
  `.trim();
  code = code.replace(desktopNavRegex, replacement);
}

// Replace the Link mapping in mobile drawer nav
const mobileNavRegex = /(<Link[\s\S]*?key=\{item\.path\}[\s\S]*?to=\{item\.path\}[\s\S]*?onClick=\{[\s\S]*?\})([\s\S]*?<\/Link>)/;
if (code.match(mobileNavRegex)) {
  const mobileReplacement = `
                      {item.action === "whatsapp" ? (
                        <a
                          key={item.label}
                          href={getWhatsAppLink("Hello ODA Market, I would like to place an order.")}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-4 px-4 py-3.5 rounded-xl text-base font-medium transition-all focus:outline-none text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:text-[#25D366]"
                          )}
                        >
                          <Icon className="h-6 w-6 text-muted-foreground" />
                          {item.label}
                        </a>
                      ) : (
                        $1$2
                      )}
  `.trim();
  code = code.replace(mobileNavRegex, mobileReplacement);
}

fs.writeFileSync('src/components/layout/DashboardLayout.tsx', code);
console.log("Patched Whatsapp Links!");
