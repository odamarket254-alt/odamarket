import { OptimizedImage } from "../../components/ui/OptimizedImage";
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, Search, Edit2, Trash2, Tags, Check, X, 
  Image as ImageIcon, MoreVertical, Archive, Globe, MapPin,
  RefreshCw, BarChart3, Star, EyeOff, Eye
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { Brand } from '../../types/brand';
import { getBrands, deleteBrand, updateBrand } from '../../lib/api/brands';
import { BrandFormModal } from '../../components/admin/brands/BrandFormModal';

export default function AdminBrandsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  
  const { data: brands = [], isLoading, refetch } = useQuery({
    queryKey: ['brands'],
    queryFn: getBrands,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBrand,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast.success('Brand deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete brand');
    }
  });

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingBrand(null);
    setIsModalOpen(true);
  };

  const handleDelete = (brand: Brand) => {
    // In a real app we'd check if products are using this brand first
    if (confirm(`Are you sure you want to delete ${brand.name}?`)) {
      deleteMutation.mutate(brand.id);
    }
  };

  const filteredBrands = useMemo(() => {
    if (!search) return brands;
    return brands.filter(b => 
      b.name.toLowerCase().includes(search.toLowerCase()) || 
      b.slug.toLowerCase().includes(search.toLowerCase())
    );
  }, [brands, search]);

  const stats = {
    total: brands.length,
    active: brands.filter(b => b.status === 'active' || (b.is_active && !b.status)).length,
    draft: brands.filter(b => b.status === 'draft').length,
    archived: brands.filter(b => b.status === 'archived').length,
    hidden: brands.filter(b => b.status === 'hidden' || (b.is_active === false && !b.status)).length,
    featured: brands.filter(b => b.featured).length,
    homepage: brands.filter(b => b.homepage_status).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-[#3A2418]">
            <Tags className="h-6 w-6 text-primary" />
            Brands Management
          </h1>
          <p className="text-sm text-[#5F5A54] mt-1">
            Manage product manufacturers, vendors, and brands.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
          <Button onClick={handleCreate} className="bg-primary text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Brand
          </Button>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Brands', value: stats.total, icon: Tags, color: 'text-[#C65A28]', bg: 'bg-blue-100' },
          { label: 'Active', value: stats.active, icon: Check, color: 'text-[#C65A28]', bg: 'bg-[#E8DCC9]' },
          { label: 'Draft', value: stats.draft, icon: Edit2, color: 'text-[#5F5A54]', bg: 'bg-[#E8DCC9]' },
          { label: 'Archived', value: stats.archived, icon: Archive, color: 'text-[#B94A48]', bg: 'bg-[#B94A48]/10' },
          { label: 'Hidden', value: stats.hidden, icon: EyeOff, color: 'text-[#5F5A54]', bg: 'bg-[#E8DCC9]' },
          { label: 'Featured', value: stats.featured, icon: Star, color: 'text-[#6B8E23]', bg: 'bg-purple-100' },
          { label: 'On Homepage', value: stats.homepage, icon: BarChart3, color: 'text-[#D9A62E]', bg: 'bg-[#D9A62E]/10' },
        ].map((stat, i) => (
          <div key={i} className="bg-[#FFFDF8] p-6 rounded-xl border border-[#E8DCC9] shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#5F5A54]">{stat.label}</p>
              <h3 className="text-2xl font-bold text-[#3A2418]">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Filters and List */}
      <div className="bg-[#FFFDF8] border border-[#E8DCC9] rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#E8DCC9] flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#FAF5EC]/50">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B857D]" />
            <Input
              type="text"
              placeholder="Search brands..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-full bg-[#FFFDF8]"
            />
          </div>
        </div>

        <div className="min-h-[400px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 text-[#5F5A54] gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-primary" />
              <p>Loading brands...</p>
            </div>
          ) : filteredBrands.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-[#5F5A54] gap-3">
              <Tags className="w-10 h-10 text-[#8B857D]" />
              <p className="text-lg font-medium text-[#3A2418]">No brands found</p>
              <p className="text-sm">Get started by adding your first brand.</p>
              <Button onClick={handleCreate} className="mt-2" variant="outline">Create Brand</Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredBrands.map((brand) => (
                <div key={brand.id} className="flex flex-col sm:flex-row sm:items-center gap-4 py-4 px-6 hover:bg-[#FAF5EC] group">
                  <div className="w-16 h-16 rounded-xl bg-[#E8DCC9] border border-[#E8DCC9] flex items-center justify-center shrink-0 overflow-hidden">
                    {brand.logo_url ? (
                      <OptimizedImage src={brand.logo_url} alt={brand.name} imgClassName="w-full h-full object-contain p-2" className="w-full h-full flex items-center justify-center bg-transparent" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-[#8B857D]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#3A2418] text-lg truncate">{brand.name}</span>
                      {brand.status === 'active' ? (
                        <Badge className="bg-[#E8DCC9] text-emerald-800">Active</Badge>
                      ) : brand.status === 'hidden' ? (
                        <Badge className="bg-[#E8DCC9] text-[#3A2418]">Hidden</Badge>
                      ) : (
                        <Badge className="bg-[#D9A62E]/10 text-amber-800 capitalize">{brand.status}</Badge>
                      )}
                      {brand.featured && <Badge className="bg-blue-100 text-blue-800">Featured</Badge>}
                    </div>
                    <div className="text-sm text-[#5F5A54] flex flex-wrap items-center gap-4 mt-1">
                      <span>Slug: {brand.slug}</span>
                      {brand.country && <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {brand.country}</span>}
                      {brand.website && <span className="flex items-center gap-1"><Globe className="w-3 h-3"/> <a href={brand.website} target="_blank" rel="noreferrer" className="hover:underline">{brand.website}</a></span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(brand)}>
                      <Edit2 className="w-4 h-4 mr-2" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" className="text-[#B94A48] hover:text-[#B94A48] hover:bg-[#B94A48]/10" onClick={() => handleDelete(brand)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <BrandFormModal 
          brand={editingBrand} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  );
}
