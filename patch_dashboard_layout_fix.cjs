const fs = require('fs');
let code = fs.readFileSync('src/components/layout/DashboardLayout.tsx', 'utf8');

const regex = /<nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">[\s\S]*?<\/nav>/;
const replacement = `<nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            const isPremium = profile?.role === "seller" && profile?.verified;

            if (item.action === "whatsapp") {
              return (
                <a
                  key={item.label}
                  href={getWhatsAppLink("Hello ODA Market, I would like to place an order.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:text-[#25D366]"
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </a>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? isPremium
                      ? "bg-[#D9A62E]/10 text-[#D9A62E] dark:text-[#D9A62E]"
                      : "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5",
                    isActive
                      ? isPremium
                        ? "text-[#D9A62E] dark:text-[#D9A62E]"
                        : "text-primary"
                      : "text-muted-foreground",
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/components/layout/DashboardLayout.tsx', code);
  console.log("Fixed DashboardLayout navigation mapping");
} else {
  console.log("Could not find nav block");
}
