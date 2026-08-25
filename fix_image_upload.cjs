const fs = require('fs');
let code = fs.readFileSync('src/components/admin/products/BulkProductUploadModal.tsx', 'utf8');

// Add states for image mapping
code = code.replace(/const \[file, setFile\] = useState<File \| null>\(null\);/, `const [file, setFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);`);

// Reset state
code = code.replace(/setFile\(null\);/, `setFile(null);
    setImageFiles([]);`);

// Add Image Selection UI in Step 2
const imageHtml = `
              </div>

              <div className="bg-[#FAF5EC] p-4 rounded-xl border border-[#E8DCC9]">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-[#3A2418]">Bulk Image Upload (Optional)</h3>
                    <p className="text-sm text-[#5F5A54]">Select multiple images. We will automatically match the image filename to the product SKU (e.g. SKU-123.jpg).</p>
                    {imageFiles.length > 0 && (
                      <p className="text-sm font-medium text-[#C65A28] mt-2">
                        {imageFiles.length} images selected.
                      </p>
                    )}
                  </div>
                  <button 
                    onClick={() => imageInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-[#C65A28] text-[#C65A28] rounded-lg hover:bg-[#FAF5EC] transition-colors text-sm font-medium shrink-0"
                  >
                    <Upload className="w-4 h-4" /> Select Images
                  </button>
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*"
                    ref={imageInputRef} 
                    className="hidden" 
                    onChange={(e) => {
                      if (e.target.files) {
                        setImageFiles(Array.from(e.target.files));
                        
                        // Try to auto-match right away to show preview
                        const files = Array.from(e.target.files);
                        setParsedData(prev => prev.map(row => {
                          if (row.sku) {
                            const matchedFile = files.find(f => {
                              const nameWithoutExt = f.name.split('.').slice(0, -1).join('.');
                              return nameWithoutExt === row.sku || nameWithoutExt === row.sku.toLowerCase() || f.name === row.sku;
                            });
                            if (matchedFile) {
                              return { ...row, _matchedImage: matchedFile };
                            }
                          }
                          return row;
                        }));
                        toast.success(\`Selected \${files.length} images for matching\`);
                      }
                    }}
                  />
                </div>
              </div>

              <div className="bg-white border border-[#E8DCC9] rounded-xl overflow-hidden">
`;

code = code.replace(/<\/div>\s*<div className="bg-white border border-\[#E8DCC9\] rounded-xl overflow-hidden">/, imageHtml);

// Add Matched Image column
code = code.replace(/<th className="px-4 py-3 text-xs font-semibold text-\[#5F5A54\] uppercase">Status<\/th>/, `<th className="px-4 py-3 text-xs font-semibold text-[#5F5A54] uppercase">Image</th>\n                        <th className="px-4 py-3 text-xs font-semibold text-[#5F5A54] uppercase">Status</th>`);

code = code.replace(/<td className="px-4 py-3">\s*\{row\._status === 'ready' \? \(/, `<td className="px-4 py-3 text-sm text-[#5F5A54] truncate max-w-[100px]">
                            {row._matchedImage ? (
                              <span className="text-emerald-600 text-xs font-medium flex items-center gap-1"><Check className="w-3 h-3"/> Matched</span>
                            ) : row.image_url ? (
                              <span className="text-xs">URL</span>
                            ) : (
                              <span className="text-xs text-gray-400">None</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {row._status === 'ready' ? (`);

fs.writeFileSync('src/components/admin/products/BulkProductUploadModal.tsx', code);
console.log('Fixed bulk image UI');
