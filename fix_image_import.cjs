const fs = require('fs');
let code = fs.readFileSync('src/components/admin/products/BulkProductUploadModal.tsx', 'utf8');

const imageUploadLogic = `
      // Upload matched images for the batch
      await Promise.all(batch.map(async (item) => {
        if (item._matchedImage) {
          try {
            const fileExt = item._matchedImage.name.split('.').pop();
            const fileName = \`\${Math.random().toString(36).substring(2, 15)}.\${fileExt}\`;
            const filePath = \`products/\${fileName}\`;
            
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
`;

code = code.replace(/const insertData = batch\.map\(item => \{/, imageUploadLogic);

fs.writeFileSync('src/components/admin/products/BulkProductUploadModal.tsx', code);
console.log('Fixed bulk image import');
