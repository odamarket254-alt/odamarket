import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { 
  Upload, X, FileSpreadsheet, Download, AlertCircle, CheckCircle2, 
  ChevronRight, Trash2, Edit2, Check, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export function BulkProductUploadModal({ isOpen, onClose, onComplete }: { isOpen: boolean, onClose: () => void, onComplete: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Upload, 2: Preview/Validate, 3: Importing
  const [file, setFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 });
  const [importErrors, setImportErrors] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      resetState();
    }
  }, [isOpen]);

  const resetState = () => {
    setStep(1);
    setFile(null);
    setImageFiles([]);
    setParsedData([]);
    setIsProcessing(false);
    setImportProgress({ current: 0, total: 0, success: 0, failed: 0 });
    setImportErrors([]);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('id, name, slug');
    if (data) setCategories(data);
  };

  const handleDownloadTemplate = () => {
    const templateData = [{
      "Product Name": "Example Rice 25kg",
      "SKU": "RICE-25KG-001",
      "Category": "Groceries",
      "Description": "Premium quality rice",
      "Selling Price": 2500,
      "Wholesale Price": 2300,
      "Stock Quantity": 100,
      "Minimum Order Quantity": 5,
      "Unit": "bag",
      "Product Image URL": "https://example.com/image.jpg",
      "Status": "active"
    }];
    
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "ODAMarket_Bulk_Upload_Template.xlsx");
  };

  
  const processFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = e.target?.result;
      if (!data) return;

      let jsonData: any[] = [];
      if (selectedFile.name.endsWith('.csv')) {
        const results = Papa.parse(data as string, { header: true, skipEmptyLines: true });
        jsonData = results.data;
      } else {
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        jsonData = XLSX.utils.sheet_to_json(sheet);
      }
      await validateData(jsonData);
    };
    
    if (selectedFile.name.endsWith('.csv')) {
      reader.readAsText(selectedFile);
    } else {
      reader.readAsBinaryString(selectedFile);
    }
  };

  const validateData = async (data: any[]) => {
    // Check existing SKUs
    const skus = data.map(r => r['SKU'] || r['sku']).filter(Boolean);
    let existingSkus = new Set<string>();
    
    if (skus.length > 0) {
      // Chunk the array to prevent URL too long errors
      const chunkSize = 100;
      for (let i = 0; i < skus.length; i += chunkSize) {
        const chunk = skus.slice(i, i + chunkSize);
        const { data: existing } = await supabase.from('products').select('sku').in('sku', chunk);
        if (existing) {
          existing.forEach(e => existingSkus.add(e.sku));
        }
      }
    }

    const seenSkus = new Set<string>();

    const validatedData = data.map((row: any, index: number) => {
      const errors: string[] = [];
      const name = row['Product Name'] || row['name'] || '';
      const sku = String(row['SKU'] || row['sku'] || '').trim();
      const price = parseFloat(row['Selling Price'] || row['price'] || '0');
      const stock = parseInt(row['Stock Quantity'] || row['stock'] || '0', 10);
      const catName = row['Category'] || row['category'] || '';
      const status = (row['Status'] || row['status'] || 'draft').toLowerCase();
      
      let categoryId = null;
      if (catName) {
        const cat = categories.find(c => c.name.toLowerCase() === catName.toLowerCase());
        if (cat) categoryId = cat.id;
        else errors.push(`Category "${catName}" not found`);
      } else {
        errors.push("Category is missing");
      }

      if (!name) errors.push("Product Name is missing");
      if (!price || price <= 0 || isNaN(price)) errors.push("Invalid Selling Price");
      if (isNaN(stock) || stock < 0) errors.push("Invalid Stock Quantity");
      
      if (sku) {
        if (existingSkus.has(sku)) {
          errors.push(`SKU "${sku}" already exists in database`);
        }
        if (seenSkus.has(sku)) {
          errors.push(`Duplicate SKU "${sku}" in file`);
        }
        seenSkus.add(sku);
      }

      return {
        _raw: row,
        _rowIndex: index + 1,
        _errors: errors,
        _status: errors.length === 0 ? 'ready' : 'error',
        name,
        sku,
        description: row['Description'] || row['description'] || '',
        price,
        wholesale_price: parseFloat(row['Wholesale Price'] || row['wholesale_price']) || null,
        stock,
        wholesale_min_qty: parseInt(row['Minimum Order Quantity'] || row['wholesale_min_qty']) || null,
        wholesale_unit: row['Unit'] || row['unit'] || '',
        image_url: row['Product Image URL'] || row['image_url'] || '',
        is_active: status === 'active',
        is_public: status === 'active' || status === 'draft',
        is_wholesale: !!(row['Wholesale Price'] || row['wholesale_price']),
        category_id: categoryId,
      };
    });

    setParsedData(validatedData);
    setIsProcessing(false);
    setStep(2);
  };


  const handleImport = async () => {
    const readyToImport = parsedData.filter(d => d._status === 'ready');
    if (readyToImport.length === 0) return;

    setStep(3);
    setImportProgress({ current: 0, total: readyToImport.length, success: 0, failed: 0 });
    
    let successCount = 0;
    let failedCount = 0;
    const errors: any[] = [];
    
    // Process in batches of 50
    const batchSize = 50;
    for (let i = 0; i < readyToImport.length; i += batchSize) {
      const batch = readyToImport.slice(i, i + batchSize);
      
      
      // Upload matched images for the batch
      await Promise.all(batch.map(async (item) => {
        if (item._matchedImage) {
          try {
            const fileExt = item._matchedImage.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
            const filePath = `products/${fileName}`;
            
            const { error: uploadError } = await supabase.storage
              .from('products')
              .upload(filePath, item._matchedImage);
              
            if (!uploadError) {
              const { data: { publicUrl } } = supabase.storage
                .from('products')
                .getPublicUrl(filePath);
              item.image_url = publicUrl;
            }
          } catch (e) {
            console.warn('Image upload failed', e);
          }
        }
      }));

      const insertData = batch.map(item => {

        return {
          name: item.name,
          slug: item.slug || (item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 8)),
          description: item.description,
          price: item.price,
          stock: item.stock,
          category_id: item.category_id,
          sku: item.sku,
          is_active: item.is_active,
          is_public: item.is_public,
          is_wholesale: item.is_wholesale,
          wholesale_price: item.wholesale_price,
          wholesale_min_qty: item.wholesale_min_qty,
          wholesale_unit: item.wholesale_unit,
          image_url: item.image_url || null,
        };
      });

      try {
        const { error } = await supabase.from('products').insert(insertData);
        if (error) {
          failedCount += batch.length;
          errors.push({ batch: i, error: error.message });
        } else {
          successCount += batch.length;
        }
      } catch (e: any) {
        failedCount += batch.length;
        errors.push({ batch: i, error: e.message });
      }
      
      setImportProgress({ 
        current: Math.min(i + batchSize, readyToImport.length), 
        total: readyToImport.length, 
        success: successCount, 
        failed: failedCount 
      });
    }

    setImportErrors(errors);
    toast.success(`Import completed: ${successCount} imported, ${failedCount} failed`);
    onComplete();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[#FFFDF8] w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8DCC9] shrink-0">
          <h2 className="text-xl font-bold text-[#3A2418]">Bulk Product Upload</h2>
          <button onClick={onClose} className="p-2 text-[#5F5A54] hover:bg-[#FAF5EC] rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-[#FAF5EC] p-4 rounded-xl border border-[#E8DCC9]">
                <div>
                  <h3 className="font-semibold text-[#3A2418]">Download Template</h3>
                  <p className="text-sm text-[#5F5A54]">Use our standardized template to ensure your data is formatted correctly.</p>
                </div>
                <button 
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-[#C65A28] text-[#C65A28] rounded-lg hover:bg-[#FAF5EC] transition-colors text-sm font-medium shrink-0"
                >
                  <Download className="w-4 h-4" /> Download Template
                </button>
              </div>

              <div 
                className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${isProcessing ? 'border-[#E8DCC9] bg-[#FAF5EC]' : 'border-[#C65A28]/30 hover:bg-[#FAF5EC] hover:border-[#C65A28]'}`}
                onClick={() => !isProcessing && fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (!isProcessing && e.dataTransfer.files?.[0]) {
                    processFile(e.dataTransfer.files[0]);
                  }
                }}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
                />
                
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-12 h-12 text-[#C65A28] animate-spin mb-4" />
                    <h3 className="text-lg font-semibold text-[#3A2418]">Processing File...</h3>
                    <p className="text-sm text-[#5F5A54] mt-1">Please wait while we validate your products.</p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-[#C65A28]/10 text-[#C65A28] rounded-full flex items-center justify-center mb-4">
                      <FileSpreadsheet className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#3A2418]">Drag & Drop your Excel/CSV file here</h3>
                    <p className="text-sm text-[#5F5A54] mt-2 mb-4">or click to browse files (max 10MB)</p>
                    <span className="text-xs text-[#8B857D] bg-white px-3 py-1 rounded-full border border-[#E8DCC9]">
                      Supported formats: .xlsx, .xls, .csv
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#3A2418]">{parsedData.length} products detected</h3>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1.5 text-sm text-green-700 bg-green-50 px-2.5 py-1 rounded-md border border-green-200">
                      <CheckCircle2 className="w-4 h-4" /> {parsedData.filter(d => d._status === 'ready').length} ready
                    </span>
                    <span className="flex items-center gap-1.5 text-sm text-[#B94A48] bg-[#B94A48]/10 px-2.5 py-1 rounded-md border border-[#B94A48]/20">
                      <AlertCircle className="w-4 h-4" /> {parsedData.filter(d => d._status === 'error').length} need attention
                    </span>
                  </div>
                </div>
                
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

                    className="flex-1 md:flex-none px-4 py-2 border border-[#E8DCC9] text-[#5F5A54] rounded-lg hover:bg-[#FAF5EC] font-medium text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleImport}
                    disabled={parsedData.filter(d => d._status === 'ready').length === 0}
                    className="flex-1 md:flex-none px-6 py-2 bg-[#C65A28] text-white rounded-lg hover:bg-[#C65A28]/90 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Import {parsedData.filter(d => d._status === 'ready').length} Products
                  </button>
                </div>
              
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
                        toast.success(`Selected ${files.length} images for matching`);
                      }
                    }}
                  />
                </div>
              </div>

              <div className="bg-white border border-[#E8DCC9] rounded-xl overflow-hidden">

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-[#FAF5EC] border-b border-[#E8DCC9]">
                        <th className="px-4 py-3 text-xs font-semibold text-[#5F5A54] uppercase w-[60px]">Row</th>
                        <th className="px-4 py-3 text-xs font-semibold text-[#5F5A54] uppercase">Product Name</th>
                        <th className="px-4 py-3 text-xs font-semibold text-[#5F5A54] uppercase">SKU</th>
                        <th className="px-4 py-3 text-xs font-semibold text-[#5F5A54] uppercase">Price</th>
                        <th className="px-4 py-3 text-xs font-semibold text-[#5F5A54] uppercase">Category</th>
                        <th className="px-4 py-3 text-xs font-semibold text-[#5F5A54] uppercase">Image</th>
                        <th className="px-4 py-3 text-xs font-semibold text-[#5F5A54] uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8DCC9]">
                      {parsedData.slice(0, 100).map((row, i) => (
                        <tr key={i} className={`hover:bg-[#FAF5EC]/50 ${row._status === 'error' ? 'bg-[#B94A48]/5' : ''}`}>
                          <td className="px-4 py-3 text-sm text-[#5F5A54]">{row._rowIndex}</td>
                          <td className="px-4 py-3 text-sm font-medium text-[#3A2418] truncate max-w-[200px]" title={row.name}>{row.name || '-'}</td>
                          <td className="px-4 py-3 text-sm text-[#5F5A54]">{row.sku || '-'}</td>
                          <td className="px-4 py-3 text-sm text-[#3A2418]">KSh {row.price}</td>
                          <td className="px-4 py-3 text-sm text-[#5F5A54] truncate max-w-[150px]">{row._raw['Category'] || row._raw['category'] || '-'}</td>
                          <td className="px-4 py-3 text-sm text-[#5F5A54] truncate max-w-[100px]">
                            {row._matchedImage ? (
                              <span className="text-emerald-600 text-xs font-medium flex items-center gap-1"><Check className="w-3 h-3"/> Matched</span>
                            ) : row.image_url ? (
                              <span className="text-xs">URL</span>
                            ) : (
                              <span className="text-xs text-gray-400">None</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {row._status === 'ready' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded border border-green-200">
                                <Check className="w-3 h-3" /> Ready
                              </span>
                            ) : (
                              <div className="flex flex-col gap-1">
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#B94A48]/10 text-[#B94A48] text-xs font-medium rounded border border-[#B94A48]/20 w-fit">
                                  <AlertCircle className="w-3 h-3" /> Error
                                </span>
                                <span className="text-[11px] text-[#B94A48]">{row._errors[0]} {row._errors.length > 1 && `(+${row._errors.length - 1} more)`}</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedData.length > 100 && (
                    <div className="p-4 text-center text-sm text-[#5F5A54] bg-[#FAF5EC] border-t border-[#E8DCC9]">
                      Showing first 100 rows. {parsedData.length - 100} more rows hidden.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-6">
              {importProgress.current < importProgress.total ? (
                <>
                  <div className="w-16 h-16 border-4 border-[#C65A28]/20 border-t-[#C65A28] rounded-full animate-spin mb-2"></div>
                  <div>
                    <h3 className="text-xl font-bold text-[#3A2418] mb-2">Importing Products...</h3>
                    <p className="text-[#5F5A54]">{importProgress.current} / {importProgress.total} products processed</p>
                  </div>
                  <div className="w-full max-w-md bg-[#E8DCC9] rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-[#C65A28] h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                    ></div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-2">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-[#3A2418] mb-2">Import Complete</h3>
                    <div className="flex flex-col gap-2 items-center text-[#5F5A54]">
                      <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" /> {importProgress.success} successfully imported</span>
                      {importProgress.failed > 0 && (
                        <span className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-[#B94A48]" /> {importProgress.failed} failed</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-4 mt-6">
                    <button 
                      onClick={() => {
                        resetState();
                        onClose();
                      }}
                      className="px-6 py-2.5 bg-white border border-[#E8DCC9] text-[#3A2418] rounded-lg hover:bg-[#FAF5EC] font-medium transition-colors"
                    >
                      View Products
                    </button>
                    <button 
                      onClick={resetState}
                      className="px-6 py-2.5 bg-[#C65A28] text-white rounded-lg hover:bg-[#C65A28]/90 font-medium transition-colors"
                    >
                      Upload Another File
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
