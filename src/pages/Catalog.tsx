import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import ContentCard from '../components/ContentCard';
import { Search, Filter, Loader2 } from 'lucide-react';

export default function Catalog() {
  const [contents, setContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');

  useEffect(() => {
    const fetchContents = async () => {
      try {
        const { data, error } = await supabase
          .from('contents')
          .select('*')
          .eq('status', 'approved');
        
        if (error) throw error;
        setContents(data || []);
      } catch (error) {
        console.error("Error fetching contents from Supabase:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchContents();
  }, []);

  const categories = ['Todas', ...new Set(contents.map(t => t.category))];

  const filteredContents = contents.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (t.subtitle && t.subtitle.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'Todas' || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 md:space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2 text-center md:text-left">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-black text-angola-black">Biblioteca Digital</h1>
          <p className="text-angola-black/50 font-medium text-sm md:text-base">Encontre o material perfeito para os teus estudos.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-angola-black/30" />
            <input 
              type="text"
              placeholder="Buscar materiais..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 md:py-3.5 bg-white border border-angola-black/10 rounded-2xl focus:ring-2 focus:ring-angola-red focus:border-transparent transition-all outline-none shadow-sm text-sm"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-angola-black/30" />
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-12 pr-10 py-3 md:py-3.5 bg-white border border-angola-black/10 rounded-2xl focus:ring-2 focus:ring-angola-red focus:border-transparent transition-all outline-none appearance-none cursor-pointer shadow-sm text-sm"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {filteredContents.map((content: any) => (
            <ContentCard key={content.id} content={content} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-angola-black/10">
          <p className="text-angola-black/50 text-lg">Nenhum conteúdo encontrado para a tua busca.</p>
        </div>
      )}
    </div>
  );
}
