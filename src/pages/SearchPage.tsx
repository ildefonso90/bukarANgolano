
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import ContentCard from '../components/ContentCard';
import SEO from '../components/SEO';
import { Search, Loader2, ArrowLeft, Sparkles } from 'lucide-react';

export default function SearchPage() {
  const { query } = useParams<{ query: string }>();
  const decodedQuery = decodeURIComponent(query || '');
  
  const [contents, setContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContents = async () => {
      setLoading(true);
      try {
        // We fetch all and filter client-side for consistency with Catalog, 
        // or we could do a more specific query
        const { data, error } = await supabase
          .from('contents')
          .select('*')
          .eq('status', 'approved');
        
        if (error) throw error;
        
        if (data) {
          const searchLower = decodedQuery.toLowerCase();
          const filtered = data.filter(t => 
            t.title.toLowerCase().includes(searchLower) || 
            (t.subtitle && t.subtitle.toLowerCase().includes(searchLower)) ||
            (t.category && t.category.toLowerCase().includes(searchLower)) ||
            (t.author && t.author.toLowerCase().includes(searchLower))
          );
          setContents(filtered);
        }
      } catch (error) {
        console.error("Error searching contents:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchContents();
  }, [decodedQuery]);

  return (
    <div className="space-y-12 pb-20">
      <SEO 
        title={`Resultados para "${decodedQuery}"`}
        description={`Explora os melhores documentos, manuais e resumos relacionados com ${decodedQuery} na Buki Angolano.`}
        canonical={`https://bukiangolano.com/busca/${encodeURIComponent(decodedQuery)}`}
      />

      <div className="space-y-8">
        <Link 
          to="/catalog"
          className="inline-flex items-center gap-2 text-angola-black/40 hover:text-angola-red transition-all font-bold group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Voltar à Biblioteca
        </Link>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-angola-red font-black text-xs uppercase tracking-widest">
              <Sparkles className="w-4 h-4" /> Busca Indexada
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-angola-black tracking-tight">
              {decodedQuery}
            </h1>
            <p className="text-angola-black/40 font-medium">
              Encontrámos {contents.length} resultados para a tua pesquisa.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse space-y-4">
              <div className="aspect-[3/4] bg-slate-100 rounded-3xl" />
              <div className="h-4 w-24 bg-slate-100 rounded" />
              <div className="h-6 w-full bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : contents.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-8">
          {contents.map((content: any) => (
            <ContentCard key={content.id} content={content} />
          ))}
        </div>
      ) : (
        <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-angola-black/10">
          <div className="space-y-4">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
              <Search className="w-8 h-8 text-angola-black/10" />
            </div>
            <p className="text-angola-black/60 font-black text-xl">Nada encontrado para "{decodedQuery}".</p>
            <Link to="/catalog" className="inline-block bg-angola-black text-white px-8 py-4 rounded-2xl font-black">
              Explorar todo o catálogo
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
