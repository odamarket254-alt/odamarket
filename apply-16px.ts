import fs from 'fs';

const fixFile = (filePath: string) => {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // We want to replace all occurrences of `rounded-xl` and `h-12` etc with `rounded-[16px]` inside inputs.
  content = content.replace(/h-12 rounded-xl bg-\[#ffffff\] dark:bg-\[#ffffff\] border border-\[#E2E8F0\] focus-visible:border-\[#00C389\] focus-visible:ring-4 focus-visible:ring-\[#00C389\]\/10/g, 'h-[56px] rounded-[16px] bg-[#ffffff] dark:bg-[#ffffff] border border-[#E2E8F0] focus-visible:border-[#00C389] focus-visible:ring-2 focus-visible:ring-[#00C389] focus-visible:ring-offset-0');

  // and select inputs
  content = content.replace(/h-12 pl-4 pr-10 rounded-xl bg-\[#ffffff\] dark:bg-\[#ffffff\] border border-\[#E2E8F0\] focus-visible:outline-none focus-visible:border-\[#00C389\] focus-visible:ring-4 focus-visible:ring-\[#00C389\]\/10/g, 'h-[56px] pl-4 pr-10 rounded-[16px] bg-[#ffffff] dark:bg-[#ffffff] border border-[#E2E8F0] focus-visible:outline-none focus-visible:border-[#00C389] focus-visible:ring-2 focus-visible:ring-[#00C389] focus-visible:ring-offset-0');

  // phone inputs
  content = content.replace(/h-12 pl-4 rounded-xl bg-\[#ffffff\] dark:bg-\[#ffffff\] border border-\[#E2E8F0\] focus-within:border-\[#00C389\] focus-within:ring-4 focus-within:ring-\[#00C389\]\/10/g, 'h-[56px] pl-4 rounded-[16px] bg-[#ffffff] dark:bg-[#ffffff] border border-[#E2E8F0] focus-within:border-[#00C389] focus-within:ring-2 focus-within:ring-[#00C389] focus-within:ring-offset-0');

  content = content.replace(/rounded-r-\[16px\]/g, 'rounded-r-[16px]'); // Make sure this isn't lost

  fs.writeFileSync(filePath, content);
  console.log(`Fixed ${filePath}`);
}

fixFile('src/pages/RegisterPage.tsx');
fixFile('src/pages/LoginPage.tsx');
