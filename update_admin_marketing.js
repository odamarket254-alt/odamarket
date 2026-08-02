import fs from 'fs';
const file = 'src/pages/admin/AdminMarketingPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace BannersManager with HomepageBannersManager
content = content.replace(/import \{ BannersManager \} from "\.\.\/\.\.\/components\/admin\/storefront\/BannersManager";/g, '');
content = `import { HomepageBannersManager } from "../../components/admin/storefront/HomepageBannersManager";\n` + content;

const replacement = `  if (activeTab === "banners") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setActiveTab("overview")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Ticket className="h-6 w-6 text-primary" />
            Marketing Center
          </h1>
        </div>
        <HomepageBannersManager />
      </div>
    );
  }`;

// Find the old if (activeTab === "banners") block
const startIdx = content.indexOf('  if (activeTab === "banners") {');
const nextIfIdx = content.indexOf('  // Simplified view', startIdx);

if (startIdx !== -1 && nextIfIdx !== -1) {
    const newContent = content.substring(0, startIdx) + replacement + '\n' + content.substring(nextIfIdx);
    fs.writeFileSync(file, newContent);
    console.log("Updated AdminMarketingPage.tsx successfully");
} else {
    console.log("Could not find blocks");
}

