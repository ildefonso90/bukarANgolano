import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, dataConnect } from '../firebase';
import { executeQuery, queryRef } from 'firebase/data-connect';
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
        const result = await executeQuery(queryRef(dataConnect, 'ListApprovedContents'));
        const data = result.data as { contents: any[] };
        setContents(data.contents);
      } catch (error) {
        console.error("Error fetching contents from Data Connect:", error);
        // Fallback para Firestore
        try {
          const q = query(collection(db, 'contents'), where('status', '==', 'approved'));
          const querySnapshot = await getDocs(q);
          const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setContents(data);
        } catch (fsError) {
          console.error("Firestore fallback failed:", fsError);
        }
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
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-angola-black">Biblioteca Digital</h1>
          <p className="text-angola-black/50 font-medium">Encontre o material perfeito para os teus estudos.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-angola-black/30" />
            <input 
              type="text"
              placeholder="Buscar por título ou tema..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-angola-black/10 rounded-2xl focus:ring-2 focus:ring-angola-red focus:border-transparent transition-all outline-none shadow-sm"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-angola-black/30" />
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-12 pr-10 py-3 bg-white border border-angola-black/10 rounded-2xl focus:ring-2 focus:ring-angola-red focus:border-transparent transition-all outline-none appearance-none cursor-pointer shadow-sm"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-angola-red animate-spin" />
          <p className="text-angola-black/50 font-medium">Carregando biblioteca...</p>
        </div>
      ) : filteredContents.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
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
