import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { cacheService } from '../lib/cache';
import ContentCard from '../components/ContentCard';
import { Search, Filter, Loader2, Tag, Book, DollarSign, ArrowUpDown } from 'lucide-react';

export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get('category') || 'Todas';
  const searchTermFromUrl = searchParams.get('search') || '';
  
  const [contents, setContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchTermFromUrl);
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState(categoryFromUrl);

  useEffect(() => {
    setSearchTerm(searchTermFromUrl);
  }, [searchTermFromUrl]);
  const [selectedType, setSelectedType] = useState('Todos');
  const [selectedPrice, setSelectedPrice] = useState('Todos');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    setSelectedCategory(categoryFromUrl);
  }, [categoryFromUrl]);

  useEffect(() => {
    const fetchContents = async () => {
      // Try to get from session cache first to speed up navigation
      const cached = cacheService.get<any[]>('all_contents', true);
      if (cached) {
        setContents(cached);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('contents')
          .select('*')
          .eq('status', 'approved');
        
        if (error) throw error;
        
        if (data) {
          setContents(data);
          cacheService.set('all_contents', data, true);
        }
      } catch (error) {
        console.error("Error fetching contents from Supabase:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchContents();
  }, []);

  const categories = ['Todas', ...new Set(contents.map(t => t.category))];
  const types = ['Todos', ...new Set(contents.map(t => t.type))];

  const filteredContents = contents
    .filter(t => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        t.title.toLowerCase().includes(searchLower) || 
        (t.subtitle && t.subtitle.toLowerCase().includes(searchLower)) ||
        (t.author && t.author.toLowerCase().includes(searchLower));
      
      const matchesCategory = selectedCategory === 'Todas' || t.category === selectedCategory;
      const matchesType = selectedType === 'Todos' || t.type === selectedType;
      
      let matchesPrice = true;
      if (selectedPrice === 'Gratis') matchesPrice = t.is_free === true;
      if (selectedPrice === 'Pago') matchesPrice = t.is_free === false;

      return matchesSearch && matchesCategory && matchesType && matchesPrice;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return 0;
    });

  return (
    <div className="space-y-8 md:space-y-12">
      <div className="space-y-6">
        <div className="text-center md:text-left space-y-2">
          <h1 className="text-3xl md:text-4xl font-black text-angola-black">Biblioteca Digital</h1>
          <p className="text-angola-black/50 font-medium text-sm md:text-base">Explore milhares de recursos educativos angolanos.</p>
        </div>
        
        {/* Search and Advanced Filters */}
        <div className="bg-white p-4 md:p-6 rounded-[2rem] border border-angola-black/5 shadow-xl shadow-black/5 space-y-6">
          {/* Main Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-angola-black/20" />
            <input 
              type="text"
              placeholder="Pesquisar por título, autor, descrição ou palavras-chave..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-angola-red outline-none text-base font-medium transition-all"
            />
          </div>

          {/* Filter Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Category */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-angola-black/40 ml-1">
                <Tag className="w-3 h-3" /> Categoria
              </label>
              <select 
                value={selectedCategory}
                onChange={(e) => {
                  const newCat = e.target.value;
                  setSelectedCategory(newCat);
                  if (newCat === 'Todas') searchParams.delete('category');
                  else searchParams.set('category', newCat);
                  setSearchParams(searchParams);
                }}
                className="w-full bg-white border border-slate-100 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-angola-red transition-all cursor-pointer font-bold text-sm h-12"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Type */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-angola-black/40 ml-1">
                <Book className="w-3 h-3" /> Formato
              </label>
              <select 
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full bg-white border border-slate-100 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-angola-red transition-all cursor-pointer font-bold text-sm h-12"
              >
                {types.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-angola-black/40 ml-1">
                <DollarSign className="w-3 h-3" /> Acesso
              </label>
              <select 
                value={selectedPrice}
                onChange={(e) => setSelectedPrice(e.target.value)}
                className="w-full bg-white border border-slate-100 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-angola-red transition-all cursor-pointer font-bold text-sm h-12"
              >
                <option value="Todos">Todos</option>
                <option value="Gratis">Grátis</option>
                <option value="Pago">Premium (Pago)</option>
              </select>
            </div>

            {/* Order */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-angola-black/40 ml-1">
                <ArrowUpDown className="w-3 h-3" /> Ordenar por
              </label>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-white border border-slate-100 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-angola-red transition-all cursor-pointer font-bold text-sm h-12"
              >
                <option value="newest">Mais recentes</option>
                <option value="oldest">Mais antigos</option>
                <option value="title">Título (A-Z)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="animate-pulse space-y-4">
              <div className="h-48 bg-slate-100 rounded-3xl" />
              <div className="h-4 w-24 bg-slate-100 rounded" />
              <div className="h-6 w-full bg-slate-100 rounded" />
              <div className="h-12 w-full bg-slate-100 rounded-2xl" />
            </div>
          ))}
        </div>
      ) : filteredContents.length > 0 ? (
        <div className="space-y-6">
          <p className="text-angola-black/40 text-xs font-black uppercase tracking-widest ml-2">
            Mostrando {filteredContents.length} resultados
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
            {filteredContents.map((content: any) => (
              <ContentCard key={content.id} content={content} />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-angola-black/10">
          <div className="space-y-4">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
              <Search className="w-8 h-8 text-angola-black/10" />
            </div>
            <div className="space-y-2">
              <p className="text-angola-black/60 font-black text-xl">Nenhum conteúdo encontrado.</p>
              <p className="text-angola-black/30 font-bold max-w-sm mx-auto">Tenta ajustar os filtros ou pesquisar por palavras mais genéricas.</p>
            </div>
            <button 
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('Todas');
                setSelectedType('Todos');
                setSelectedPrice('Todos');
                setSortBy('newest');
              }}
              className="text-angola-red font-black underline underline-offset-4"
            >
              Limpar filtros
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
