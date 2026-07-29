import { OptimizedImage } from "../../components/ui/OptimizedImage";
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, Search, Edit2, Trash2, FolderTree, GripVertical, Check, X, 
  Image as ImageIcon, MoreVertical, Archive, Eye, EyeOff, Navigation,
  ChevronRight, ChevronDown, BarChart3, Upload, RefreshCw
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { Category, CategoryTreeItem } from '../../types/category';
import { getCategories, deleteCategory, updateCategory } from '../../lib/api/categories';
import { getBrands } from '../../lib/api/brands';
import { Tags } from 'lucide-react';
import { CategoryFormModal } from '../../components/admin/categories/CategoryFormModal';

// Helper to build tree
function buildCategoryTree(categories: Category[], parentId: string | null = null): CategoryTreeItem[] {
  return categories
    .filter(c => c.parent_id === parentId)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(c => ({
      ...c,
      children: buildCategoryTree(categories, c.id)
    }));
}

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree');
  
  // Drag and drop state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<'before' | 'after' | 'inside' | null>(null);
  
  const { data: categories = [], isLoading, refetch } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: getBrands,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete category');
    }
  });
  
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Category> }) => updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
  });

  const moveMutation = useMutation({
    mutationFn: async ({ id, parent_id, sort_order }: { id: string; parent_id: string | null; sort_order: number }) => {
      // First update the dragged category
      await updateCategory(id, { parent_id, sort_order });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category moved successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to move category');
    }
  });

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.effectAllowed = 'move';
    setDraggedId(id);
    // Needed for Firefox
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (id === draggedId) return;

    setDragOverId(id);

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const y = e.clientY - rect.top;
    
    // Determine position
    if (y < rect.height * 0.25) {
      setDragPosition('before');
    } else if (y > rect.height * 0.75) {
      setDragPosition('after');
    } else {
      setDragPosition('inside');
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    setDragOverId(null);
    setDragPosition(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDragOverId(null);
      setDragPosition(null);
      return;
    }

    const draggedCat = categories.find(c => c.id === draggedId);
    const targetCat = categories.find(c => c.id === targetId);

    if (draggedCat && targetCat) {
      // Basic prevent dragging into own children (recursive check ideally, but we'll do simple check here)
      if (targetCat.parent_id === draggedCat.id) {
        toast.error("Cannot move a category inside its own child");
        setDragOverId(null);
        setDragPosition(null);
        return;
      }

      let newParentId = targetCat.parent_id;
      let newSortOrder = targetCat.sort_order;

      if (dragPosition === 'inside') {
        newParentId = targetCat.id;
        // Put at the end of children
        const children = categories.filter(c => c.parent_id === targetCat.id);
        newSortOrder = children.length > 0 ? Math.max(...children.map(c => c.sort_order)) + 10 : 0;
      } else if (dragPosition === 'after') {
        newSortOrder += 5; // Simple insert between
      } else if (dragPosition === 'before') {
        newSortOrder -= 5;
      }

      moveMutation.mutate({ id: draggedId, parent_id: newParentId, sort_order: newSortOrder });
    }

    setDragOverId(null);
    setDragPosition(null);
    setDraggedId(null);
  };

  const toggleExpand = (id: string) => {
    const next = new Set(expandedNodes);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedNodes(next);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleDelete = (category: Category) => {
    if (categories.some(c => c.parent_id === category.id)) {
      toast.error('Cannot delete category with subcategories. Delete or move them first.');
      return;
    }
    if (confirm(`Are you sure you want to delete ${category.name}?`)) {
      deleteMutation.mutate(category.id);
    }
  };

  const filteredCategories = useMemo(() => {
    if (!search) return categories;
    return categories.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      c.slug.toLowerCase().includes(search.toLowerCase())
    );
  }, [categories, search]);

  const treeData = useMemo(() => {
    if (search) {
      // Flat list for search results
      return filteredCategories.map(c => ({ ...c, children: [] }));
    }
    return buildCategoryTree(categories);
  }, [categories, filteredCategories, search]);

  const stats = {
    total: categories.length,
    parent: categories.filter(c => !c.parent_id).length,
    sub: categories.filter(c => c.parent_id).length,
    active: categories.filter(c => c.status === 'active').length,
    draft: categories.filter(c => c.status === 'draft').length,
    archived: categories.filter(c => c.status === 'archived').length,
    hidden: categories.filter(c => c.status === 'hidden').length,
    featured: categories.filter(c => c.featured).length,
    homepage: categories.filter(c => c.homepage_status).length,
    brands: brands.length,
  };

  const renderTree = (items: CategoryTreeItem[], level = 0) => {
    return items.map((item) => {
      const hasChildren = item.children && item.children.length > 0;
      const isExpanded = expandedNodes.has(item.id) || !!search;
      const isDragOver = dragOverId === item.id;
      
      return (
        <div key={item.id} className="relative">
          {isDragOver && dragPosition === 'before' && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary z-10" />
          )}
          <div 
            draggable
            onDragStart={(e) => handleDragStart(e, item.id)}
            onDragOver={(e) => handleDragOver(e, item.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, item.id)}
            className={cn(
              "flex items-center gap-4 py-3 px-4 border-b border-[#E8DCC9] hover:bg-[#FAF5EC] group cursor-move",
              level > 0 && "bg-[#FAF5EC]/50",
              isDragOver && dragPosition === 'inside' && "bg-primary/5 ring-1 ring-inset ring-primary",
              draggedId === item.id && "opacity-50"
            )}
            style={{ paddingLeft: `${level * 2 + 1}rem` }}
          >
            <div className="flex items-center gap-2 w-8 shrink-0">
              <GripVertical className="w-4 h-4 text-[#8B857D] group-hover:text-[#5F5A54] cursor-grab shrink-0 hidden md:block" />
              {hasChildren ? (
                <button onClick={() => toggleExpand(item.id)} className="p-1 hover:bg-[#E8DCC9] rounded text-[#5F5A54] shrink-0">
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              ) : <div className="w-6 hidden md:block" />}
            </div>
            
            <div className="w-10 h-10 rounded-lg bg-[#E8DCC9] border border-[#E8DCC9] flex items-center justify-center shrink-0 overflow-hidden">
              {item.image_url ? (
                <OptimizedImage src={item.image_url} alt={item.name} imgClassName="w-full h-full object-cover" className="w-full h-full flex items-center justify-center bg-transparent" />
              ) : (
                <FolderTree className="w-4 h-4 text-[#8B857D]" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#3A2418] truncate">{item.name}</span>
                {item.status === 'active' ? (
                  <Badge className="bg-[#E8DCC9] text-emerald-800">Active</Badge>
                ) : item.status === 'hidden' ? (
                   <Badge className="bg-[#E8DCC9] text-[#3A2418]">Hidden</Badge>
                ) : (
                  <Badge className="bg-[#D9A62E]/10 text-amber-800 capitalize">{item.status}</Badge>
                )}
                {item.featured && <Badge className="bg-blue-100 text-blue-800">Featured</Badge>}
              </div>
              <div className="text-sm text-[#5F5A54] flex items-center gap-4 mt-0.5">
                <span>/{item.slug}</span>
                {item.homepage_status && <span className="flex items-center gap-1"><Check className="w-3 h-3"/> Homepage</span>}
                {item.navigation_status && <span className="flex items-center gap-1"><Navigation className="w-3 h-3"/> Nav</span>}
              </div>
            </div>

            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" className="text-[#B94A48] hover:text-[#B94A48] hover:bg-[#B94A48]/10" onClick={() => handleDelete(item)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {isDragOver && dragPosition === 'after' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary z-10" />
          )}

          {hasChildren && isExpanded && (
            <div className="border-l-2 border-[#E8DCC9] ml-[1.75rem]">
              {renderTree(item.children!, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-[#3A2418]">
            <FolderTree className="h-6 w-6 text-primary" />
            Categories Management
          </h1>
          <p className="text-sm text-[#5F5A54] mt-1">
            Organize products with unlimited category hierarchies.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
          <Button onClick={handleCreate} className="bg-primary text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Categories', value: stats.total, icon: FolderTree, color: 'text-[#C65A28]', bg: 'bg-blue-100' },
          { label: 'Subcategories', value: stats.sub, icon: FolderTree, color: 'text-[#C65A28]', bg: 'bg-indigo-100' },
          { label: 'Active', value: stats.active, icon: Check, color: 'text-[#C65A28]', bg: 'bg-[#E8DCC9]' },
          { label: 'Draft', value: stats.draft, icon: Edit2, color: 'text-[#5F5A54]', bg: 'bg-[#E8DCC9]' },
          { label: 'Archived', value: stats.archived, icon: Archive, color: 'text-[#B94A48]', bg: 'bg-[#B94A48]/10' },
          { label: 'Hidden', value: stats.hidden, icon: EyeOff, color: 'text-[#5F5A54]', bg: 'bg-[#E8DCC9]' },
          { label: 'Featured', value: stats.featured, icon: BarChart3, color: 'text-[#6B8E23]', bg: 'bg-purple-100' },
          { label: 'Total Brands', value: stats.brands, icon: Tags, color: 'text-pink-600', bg: 'bg-pink-100' },
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
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-full bg-[#FFFDF8]"
            />
          </div>
          
          <div className="flex items-center gap-2 bg-[#E8DCC9] p-1 rounded-lg">
            <button 
              className={cn("px-3 py-1.5 rounded-md text-sm font-medium transition-colors", viewMode === 'tree' ? 'bg-[#FFFDF8] text-[#3A2418] shadow-sm' : 'text-[#5F5A54]')}
              onClick={() => setViewMode('tree')}
            >
              Tree View
            </button>
            <button 
              className={cn("px-3 py-1.5 rounded-md text-sm font-medium transition-colors", viewMode === 'list' ? 'bg-[#FFFDF8] text-[#3A2418] shadow-sm' : 'text-[#5F5A54]')}
              onClick={() => setViewMode('list')}
            >
              Flat List
            </button>
          </div>
        </div>

        <div className="min-h-[400px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 text-[#5F5A54] gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-primary" />
              <p>Loading category hierarchy...</p>
            </div>
          ) : treeData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-[#5F5A54] gap-3">
              <FolderTree className="w-10 h-10 text-[#8B857D]" />
              <p className="text-lg font-medium text-[#3A2418]">No categories found</p>
              <p className="text-sm">Get started by creating your first category.</p>
              <Button onClick={handleCreate} className="mt-2" variant="outline">Create Category</Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {viewMode === 'tree' ? renderTree(treeData) : renderTree(categories.map(c => ({...c, children: []})))}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <CategoryFormModal 
          category={editingCategory} 
          categories={categories}
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  );
}
