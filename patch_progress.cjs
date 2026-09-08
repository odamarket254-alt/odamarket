const fs = require('fs');

const lines = fs.readFileSync('src/pages/RegisterPage.tsx', 'utf8').split('\n');
let newLines = [];
let skip = false;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('{/* Progress Indicator */}')) {
    skip = true;
    newLines.push(`      {/* Progress Indicator */}
      {step < 4 && (
        <div className="w-full max-w-[400px] flex justify-between items-center mb-8 relative px-2 mx-auto">
          {/* Connecting line */}
          <div className="absolute top-1/2 left-6 right-6 h-[2px] bg-[#E8DCC9] -z-10 -translate-y-1/2"></div>
          
          <div className="flex flex-col items-center gap-2 bg-[#F8F3EB] px-2">
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors", step >= 1 ? "bg-[#D96A27] text-white shadow-md" : "bg-white border-2 border-[#E8DCC9] text-[#9CA3AF]")}>
              {step > 1 ? <Check className="w-5 h-5" /> : "1"}
            </div>
            <span className={cn("text-[11px] font-bold uppercase tracking-wider", step >= 1 ? "text-[#D96A27]" : "text-[#9CA3AF]")}>Account</span>
          </div>
          
          <div className="flex flex-col items-center gap-2 bg-[#F8F3EB] px-2">
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors", step >= 3 ? "bg-[#D96A27] text-white shadow-md" : "bg-white border-2 border-[#E8DCC9] text-[#9CA3AF]")}>
              2
            </div>
            <span className={cn("text-[11px] font-bold uppercase tracking-wider", step >= 3 ? "text-[#D96A27]" : "text-[#9CA3AF]")}>Address</span>
          </div>
        </div>
      )}`);
  }
  
  if (skip && lines[i].includes('      {/* Main Card */}')) {
    skip = false;
  }
  
  if (!skip) {
    newLines.push(lines[i]);
  }
}

fs.writeFileSync('src/pages/RegisterPage.tsx', newLines.join('\n'));
console.log('Success');
