const fs = require('fs');
let code = fs.readFileSync('src/pages/RegisterPage.tsx', 'utf8');

// Container & Structural Colors
code = code.replace(/bg-\[\#0F172A\]/g, 'bg-primary');
code = code.replace(/bg-\[\#F8FAFC\]/g, 'bg-card');
code = code.replace(/border-\[\#E2E8F0\](\/50)?/g, 'border-border');

// Text Colors
code = code.replace(/text-\[\#0F172A\]/g, 'text-foreground');
code = code.replace(/text-\[\#1E293B\]/g, 'text-foreground');
code = code.replace(/text-\[\#64748B\]/g, 'text-muted-foreground');
code = code.replace(/text-\[\#94A3B8\]/g, 'text-muted-foreground');
code = code.replace(/text-\[\#CBD5E1\]/g, 'text-primary-foreground/80');

// Primary Branding Colors
code = code.replace(/bg-\[\#00C389\](\/[0-9.]+)?/g, 'bg-primary$1');
code = code.replace(/text-\[\#00C389\]/g, 'text-primary');
code = code.replace(/border-\[\#00C389\](\/[0-9.]+)?/g, 'border-primary$1');
code = code.replace(/ring-\[\#00C389\]/g, 'ring-ring');
code = code.replace(/hover:text-\[\#00A876\]/g, 'hover:text-primary/80');
code = code.replace(/shadow-\[0_0_15px_rgba\(0,195,137,0\.4\)\]/g, 'shadow-md');
code = code.replace(/shadow-\[0_0_20px_rgba\(0,195,137,0\.4\)\]/g, 'shadow-md');
code = code.replace(/shadow-\[0_0_30px_rgba\(0,195,137,0\.6\)\]/g, 'shadow-lg');
code = code.replace(/shadow-\[0_0_8px_rgba\(0,195,137,0\.6\)\]/g, 'shadow-sm');
code = code.replace(/shadow-\[inset_0_0_10px_rgba\(0,195,137,0\.2\)\]/g, 'shadow-inner');
code = code.replace(/shadow-\[0_0_0_4px_rgba\(0,195,137,0\.1\)\]/g, 'ring-4 ring-primary/10');
code = code.replace(/shadow-\[0_12px_24px_rgba\(0,195,137,0\.25\)\]/g, 'shadow-md');
code = code.replace(/shadow-\[0_16px_32px_rgba\(0,195,137,0\.35\)\]/g, 'shadow-lg');

// Gradients for Button
code = code.replace(/bg-gradient-to-r from-\[\#00C389\] to-\[\#00A876\] hover:from-\[\#00B37E\] hover:to-\[\#009266\]/g, 'bg-primary hover:bg-primary/90');

// Extra specific areas
code = code.replace(/bg-\[\#ffffff\] dark:bg-\[\#ffffff\]/g, 'bg-background');
code = code.replace(/bg-\[\#ffffff\]/g, 'bg-background');
code = code.replace(/dark:text-\[\#0F172A\]/g, '');
code = code.replace(/hover:border-\[\#CBD5E1\]/g, 'hover:border-ring');
code = code.replace(/border-\[\#CBD5E1\]/g, 'border-input');

code = code.replace(/bg-\[\#1E293B\](\/[0-9.]+)?/g, 'bg-background/10');
code = code.replace(/border-\[\#334155\](\/[0-9.]+)?/g, 'border-primary-foreground/20');
code = code.replace(/selection:bg-\[\#00C389\]\/30/g, 'selection:bg-primary/30');

code = code.replace(/focus-within:border-\[\#00C389\]/g, 'focus-within:border-ring');
code = code.replace(/focus-within:ring-\[\#00C389\]/g, 'focus-within:ring-ring');
code = code.replace(/focus-visible:border-\[\#00C389\]/g, 'focus-visible:border-ring');
code = code.replace(/focus-visible:ring-\[\#00C389\]/g, 'focus-visible:ring-ring');
code = code.replace(/group-focus-within\/input:text-\[\#00C389\]/g, 'group-focus-within/input:text-primary');

// Root background adjustments
code = code.replace(/className="min-h-screen w-full bg-primary flex items-center justify-center p-0 md:p-6 lg:p-8 font-sans selection:bg-primary\/30"/, 
                    'className="min-h-screen w-full bg-background flex items-center justify-center p-0 md:p-6 lg:p-8 font-sans selection:bg-primary/30"');
code = code.replace(/text-white/g, 'text-primary-foreground');

fs.writeFileSync('src/pages/RegisterPage.tsx', code);
