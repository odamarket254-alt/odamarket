const fs = require('fs');
let code = fs.readFileSync('src/components/admin/products/BulkProductUploadModal.tsx', 'utf8');

const errorReportHtml = `
                <div className="flex items-center gap-3 w-full md:w-auto">
                  {parsedData.filter(d => d._status === 'error').length > 0 && (
                    <button 
                      onClick={() => {
                        const errorData = parsedData.filter(d => d._status === 'error').map(d => ({
                          ...d._raw,
                          'Errors': d._errors.join(', ')
                        }));
                        const ws = XLSX.utils.json_to_sheet(errorData);
                        const wb = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(wb, ws, "Errors");
                        XLSX.writeFile(wb, "ODAMarket_Bulk_Upload_Errors.xlsx");
                      }}
                      className="flex-1 md:flex-none px-4 py-2 border border-[#B94A48] text-[#B94A48] rounded-lg hover:bg-[#B94A48]/10 font-medium text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" /> Download Error Report
                    </button>
                  )}
                  <button 
                    onClick={resetState}
`;

code = code.replace(/<div className="flex items-center gap-3 w-full md:w-auto">\s*<button\s*onClick=\{resetState\}/, errorReportHtml);
fs.writeFileSync('src/components/admin/products/BulkProductUploadModal.tsx', code);
console.log('Fixed error report');
