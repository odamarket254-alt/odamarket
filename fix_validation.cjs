const fs = require('fs');
let code = fs.readFileSync('src/components/admin/products/BulkProductUploadModal.tsx', 'utf8');

// Replace processFile and validateData with async versions
code = code.replace(/const processFile = \(selectedFile: File\) => \{[\s\S]*?const validateData = \(data: any\[\]\) => \{[\s\S]*?setStep\(2\);\n  \};/g, `
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
        else errors.push(\`Category "\${catName}" not found\`);
      } else {
        errors.push("Category is missing");
      }

      if (!name) errors.push("Product Name is missing");
      if (!price || price <= 0 || isNaN(price)) errors.push("Invalid Selling Price");
      if (isNaN(stock) || stock < 0) errors.push("Invalid Stock Quantity");
      
      if (sku) {
        if (existingSkus.has(sku)) {
          errors.push(\`SKU "\${sku}" already exists in database\`);
        }
        if (seenSkus.has(sku)) {
          errors.push(\`Duplicate SKU "\${sku}" in file\`);
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
`);

fs.writeFileSync('src/components/admin/products/BulkProductUploadModal.tsx', code);
console.log('Fixed Validation');
