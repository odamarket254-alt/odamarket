import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Search, MapPin, Filter, ShieldCheck, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface MarketplaceProduct {
  id: string;
  name: string;
  category: string;
  price: string;
  stock: string;
  image_url: string;
  seller_id?: string;
  created_at: string;
}

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('category') || searchParams.get('q') || '');
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Update search params when search changes, or clear it if empty
  useEffect(() => {
    if (search) {
      setSearchParams({ q: search }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [search, setSearchParams]);

  useEffect(() => {
    fetchActiveProducts();

    const channel = supabase
      .channel('public-products-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: "status=eq.active",
        },
        () => {
          fetchActiveProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchActiveProducts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching marketplace products:', error);
      } else if (data) {
        setProducts(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = products.filter(p => 
    p.name?.toLowerCase().includes(search.toLowerCase()) || 
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background text-foreground py-8">
      <div className="container mx-auto px-4">
        
        {/* Header / Search */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Browse Market</h1>
            <p className="text-muted-foreground">Discover verified products from suppliers across Africa.</p>
          </div>
          
          <div className="flex w-full md:w-auto gap-2">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search products, categories..." 
                className="pl-9 bg-muted/50 text-foreground border-border text-foreground placeholder:text-zinc-600 focus-visible:ring-emerald-500"
              />
            </div>
            <Button variant="outline" className="shrink-0 bg-muted/50 text-foreground border-border hover:bg-white/10 text-foreground">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>

        {/* Categories Pills */}
        <div className="flex overflow-x-auto pb-4 mb-6 gap-2 hide-scrollbar">
          <Badge 
            variant="secondary" 
            onClick={() => setSearch('')}
            className={`px-4 py-1.5 cursor-pointer hover:bg-emerald-500/20 hover:text-emerald-500 text-sm border border-border ${search === '' ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' : 'bg-muted/50 text-foreground/80'}`}
          >
            All
          </Badge>
          {['Agriculture', 'Construction', 'Gas Supply', 'Manufacturing', 'Livestock', 'Electronics', 'Wholesale Foods', 'Packaging', 'Machinery', 'Textiles'].map((cat) => (
            <Badge 
              key={cat}
              variant="secondary" 
              onClick={() => setSearch(cat)}
              className={`px-4 py-1.5 cursor-pointer hover:bg-emerald-500/20 hover:text-emerald-500 text-sm border border-border ${search === cat ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' : 'bg-muted/50 text-foreground/80'}`}
            >
              {cat}
            </Badge>
          ))}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading ? (
            <div className="col-span-full py-12 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading products from market...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="col-span-full py-12 text-center border border-border/50 rounded-2xl bg-muted/50 text-foreground backdrop-blur-sm">
              <ShoppingBag className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground">No products found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters.</p>
            </div>
          ) : (
            filtered.map(product => (
              <Link key={product.id} to={`/products/${product.id}`} className="group h-full flex mt-auto">
                <Card className="flex flex-col w-full overflow-hidden border-border hover:border-emerald-500/30 hover:shadow-2xl transition-all duration-300 bg-muted/50 text-foreground backdrop-blur-sm">
                  <div className="aspect-[4/3] bg-black overflow-hidden relative">
                    <Badge className="absolute top-3 right-3 z-10 bg-black/60 hover:bg-black/80 backdrop-blur-md border border-border text-foreground/90">
                      {product.category}
                    </Badge>
                    <img 
                      src={product.image_url || 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?w=500&auto=format&fit=crop&q=60'} 
                      alt={product.name}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                    />
                  </div>
                  <CardContent className="p-5 flex-1 flex flex-col">
                    <div className="mb-2">
                      <h3 className="font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-emerald-400 transition-colors">
                        {product.name}
                      </h3>
                    </div>
                    
                    <div className="mt-auto pt-4 space-y-3">
                      <div className="flex items-end justify-between border-b border-border pb-3">
                        <div>
                          <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase mb-0.5">Price</p>
                          <p className="font-semibold text-emerald-400">{product.price}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase mb-0.5">Stock</p>
                          <p className="font-medium text-foreground/90">{product.stock}</p>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                          <span className="truncate group-hover:text-foreground/80 transition-colors">Supplier {product.seller_id?.slice(0,5)}</span>
                          <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          Global Market
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
