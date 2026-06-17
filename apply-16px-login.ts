import fs from 'fs';

const fixFile = (filePath: string) => {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  content = content.replace(/pl-11 h-12 bg-\[#ffffff\] dark:bg-\[#ffffff\] border-\[#E7DED4\] rounded-xl text-\[#1F2937\] dark:text-\[#1F2937\] placeholder:text-\[#1F2937\]\/40 focus-visible:ring-\[#059669\] focus-visible:border-\[#059669\] focus-visible:ring-2 transition-all shadow-sm focus-visible:bg-\[#ffffff\]/g, 'pl-11 h-[56px] rounded-[16px] bg-[#ffffff] dark:bg-[#ffffff] border border-[#E2E8F0] focus-visible:border-[#00C389] focus-visible:ring-2 focus-visible:ring-[#00C389] focus-visible:ring-offset-0 text-[15px] text-[#0F172A] dark:text-[#0F172A] placeholder:text-[#94A3B8] transition-all shadow-[0_2px_4px_rgba(0,0,0,0.01)] hover:border-[#CBD5E1]');


  fs.writeFileSync(filePath, content);
  console.log(`Fixed ${filePath}`);
}

fixFile('src/pages/LoginPage.tsx');
