import { useState } from 'react';
import { UploadCloud, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  bucket?: string;
  folder?: string;
}

export function ImageUpload({ value, onChange, bucket = 'products', folder = 'media' }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/avif", "application/pdf", "image/svg+xml"];
      const allowedExtensions = /\.(jpg|jpeg|png|webp|avif|pdf|svg)$/i;
      
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      
      if (!allowedMimeTypes.includes(file.type) || !allowedExtensions.test(file.name)) {
        toast.error("Invalid file type. Only JPEG, PNG, WebP, AVIF, SVG, and PDF are allowed.");
        return;
      }

      setIsUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${folder ? folder + '/' : ''}${fileName}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (error) {
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      onChange(publicUrl);
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      toast.error(error.message || 'Error uploading image');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full">
      {value ? (
        <div className="relative rounded-lg border border-[#E8DCC9] overflow-hidden bg-[#FAF5EC] flex items-center justify-center min-h-[120px]">
          <img src={value} alt="Uploaded" className="w-full h-auto max-h-[200px] object-contain" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 bg-[#FFFDF8]/90 text-[#B94A48] p-1.5 rounded-full shadow-sm hover:bg-[#B94A48]/10 hover:scale-105 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-[120px] border-2 border-[#E8DCC9] border-dashed rounded-lg cursor-pointer bg-[#FAF5EC] hover:bg-[#E8DCC9] transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {isUploading ? (
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
            ) : (
              <UploadCloud className="w-8 h-8 text-[#8B857D] mb-2" />
            )}
            <p className="text-sm text-[#5F5A54]">
              <span className="font-semibold text-primary">Click to upload</span> or drag and drop
            </p>
          </div>
          <input 
            type="file" 
            className="hidden text-[#3A2418] dark:text-[#3A2418] placeholder:text-[#8B857D] caret-slate-900" 
            accept="image/jpeg, image/png, image/webp, image/avif, image/svg+xml, application/pdf" 
            onChange={handleUpload}
            disabled={isUploading}
          />
        </label>
      )}
    </div>
  );
}
