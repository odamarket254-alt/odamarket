const fs = require('fs');

function refactorLoginPage() {
    let code = fs.readFileSync('src/pages/LoginPage.tsx', 'utf8');

    code = code.replace(/bg-\[\#F5F1EB\]/g, 'bg-background');
    code = code.replace(/text-\[\#1F2937\]/g, 'text-foreground');
    code = code.replace(/border-\[\#E7DED4\](\/50)?/g, 'border-border');
    code = code.replace(/text-\[\#059669\]/g, 'text-primary');
    code = code.replace(/focus:ring-\[\#059669\]/g, 'focus:ring-ring');
    code = code.replace(/selection:bg-\[\#059669\]\/20/g, 'selection:bg-primary/20');
    code = code.replace(/selection:text-\[\#059669\]/g, 'selection:text-primary');
    code = code.replace(/bg-gradient-to-r from-\[\#059669\] to-emerald-500 hover:from-emerald-600 hover:to-emerald-400/g, 'bg-primary hover:bg-primary/90');
    code = code.replace(/shadow-\[0_4px_14px_0_rgba\(5,150,105,0\.39\)\]/g, 'shadow-md');
    code = code.replace(/shadow-\[0_6px_20px_rgba\(5,150,105,0\.23\)\]/g, 'shadow-lg');
    code = code.replace(/text-emerald-700/g, 'text-primary/80');

    // the copy/pasted input classes
    code = code.replace(/bg-\[\#ffffff\] dark:bg-\[\#ffffff\]/g, 'bg-background');
    code = code.replace(/bg-\[\#ffffff\]/g, 'bg-background');
    code = code.replace(/dark:text-\[\#0F172A\]/g, '');
    code = code.replace(/border-\[\#E2E8F0\]/g, 'border-input');
    code = code.replace(/border-\[\#CBD5E1\]/g, 'border-input');
    code = code.replace(/hover:border-\[\#CBD5E1\]/g, 'hover:border-ring');
    code = code.replace(/focus-visible:border-\[\#00C389\]/g, 'focus-visible:border-ring');
    code = code.replace(/focus-visible:ring-\[\#00C389\]/g, 'focus-visible:ring-ring');
    code = code.replace(/text-\[\#0F172A\]/g, 'text-foreground');
    code = code.replace(/text-\[\#94A3B8\]/g, 'text-muted-foreground');

    fs.writeFileSync('src/pages/LoginPage.tsx', code);
}
refactorLoginPage();
