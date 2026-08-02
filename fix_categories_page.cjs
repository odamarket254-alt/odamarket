const fs = require('fs');
const file = 'src/pages/CategoriesPage.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldStr = `<Link
                                  key={child.id}
                                  to={\`/category/\${child.id}\`}
                                  className="group flex flex-col items-center p-4 bg-[#FAF5EC]/30 rounded-2xl border border-[#E8DCC9]/30 hover:bg-[#FFFDF8] hover:border-[#C65A28]/20 hover:shadow-sm transition-all text-center h-full"
                                >
                                  <span className="text-[15px] font-semibold text-[#5F5A54] group-hover:text-[#C65A28] leading-tight transition-colors">
                                    {child.name}
                                  </span>
                                </Link>`;

const newStr = `<Link
                                  key={child.id}
                                  to={\`/category/\${child.id}\`}
                                  className="group flex flex-col items-center p-4 bg-[#FAF5EC]/30 rounded-2xl border border-[#E8DCC9]/30 hover:bg-[#FFFDF8] hover:border-[#C65A28]/20 hover:shadow-sm transition-all text-center h-full"
                                >
                                  {child.image_url ? (
                                    <div className="w-12 h-12 mb-3 rounded-full overflow-hidden bg-white shadow-sm flex items-center justify-center">
                                      <OptimizedImage src={child.image_url} alt={child.name} imgClassName="w-full h-full object-cover" />
                                    </div>
                                  ) : child.icon ? (
                                    <div className="w-12 h-12 mb-3 rounded-full overflow-hidden bg-white shadow-sm flex items-center justify-center text-[#D9A62E] text-xl">
                                      {child.icon.startsWith('http') || child.icon.startsWith('/') ? (
                                        <OptimizedImage src={child.icon} alt={child.name} imgClassName="w-full h-full object-cover p-2" />
                                      ) : child.icon}
                                    </div>
                                  ) : null}
                                  <span className="text-[15px] font-semibold text-[#5F5A54] group-hover:text-[#C65A28] leading-tight transition-colors">
                                    {child.name}
                                  </span>
                                </Link>`;

if (content.includes(oldStr)) {
  content = content.replace(oldStr, newStr);
  fs.writeFileSync(file, content);
  console.log("Updated CategoriesPage.tsx");
} else {
  console.log("Failed to find block in CategoriesPage.tsx");
}
