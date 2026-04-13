import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import ContentCard from '../components/ContentCard';
import { Loader2, BookOpen, Settings, ShieldCheck, Package } from 'lucide-react';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [purchasedContents, setPurchasedContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPurchases = async () => {
      if (!profile?.purchasedBundleIds?.length) {
        setLoading(false);
        return;
      }
      try {
        // Fetch contents that belong to the purchased bundles
        const q = query(
          collection(db, 'contents'), 
          where('bundleId', 'in', profile.purchasedBundleIds),
          where('status', '==', 'approved')
        );
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPurchasedContents(data);
      } catch (error) {
        console.error("Error fetching purchases:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPurchases();
  }, [profile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <Loader2 className="w-10 h-10 text-angola-red animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-angola-red rounded-[2rem] flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-red-900/20 rotate-3">
            {profile?.displayName?.charAt(0) || user?.email?.charAt(0)}
          </div>
          <div>
            <h1 className="text-4xl font-black text-angola-black">Olá, {profile?.displayName || 'Estudante'}</h1>
            <p className="text-angola-black/40 font-bold">Bem-vindo à tua biblioteca pessoal do BukiAngolano.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-angola-yellow/20 px-6 py-3 rounded-2xl border border-angola-yellow/30">
          <ShieldCheck className="w-5 h-5 text-angola-black" />
          <span className="text-angola-black font-black uppercase text-xs tracking-widest">Conta Verificada</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-angola-black flex items-center gap-3">
              <BookOpen className="w-7 h-7 text-angola-red" />
              Conteúdos Desbloqueados
            </h2>
            <div className="flex items-center gap-2 bg-angola-black text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
              <Package className="w-3 h-3" />
              {profile?.purchasedBundleIds?.length || 0} Pacotes
            </div>
          </div>

          {purchasedContents.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-8">
              {purchasedContents.map((content: any) => (
                <ContentCard key={content.id} content={content} />
              ))}
            </div>
          ) : (
            <div className="bg-white p-16 rounded-[3rem] border-2 border-dashed border-angola-black/10 text-center space-y-6">
              <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                <BookOpen className="w-10 h-10 text-angola-black/10" />
              </div>
              <div className="space-y-2">
                <p className="text-angola-black/60 font-black text-xl">A tua biblioteca está vazia.</p>
                <p className="text-angola-black/30 font-bold">Explora o catálogo e desbloqueia pacotes de conhecimento.</p>
              </div>
              <button 
                onClick={() => window.location.href = '/catalog'}
                className="bg-angola-black text-white px-8 py-4 rounded-2xl font-black hover:bg-angola-red transition-all shadow-xl"
              >
                Explorar Catálogo
              </button>
            </div>
          )}
        </div>

        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-angola-black/5 shadow-xl space-y-8">
            <h2 className="text-xl font-black text-angola-black flex items-center gap-3">
              <Settings className="w-6 h-6 text-angola-black/20" />
              Definições
            </h2>
            <div className="space-y-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-angola-black/30 uppercase tracking-widest">E-mail de Acesso</p>
                <p className="text-angola-black font-bold truncate">{user?.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-angola-black/30 uppercase tracking-widest">Tipo de Utilizador</p>
                <div className="flex items-center gap-2">
                  <span className="bg-angola-black text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                    {profile?.role || 'Estudante'}
                  </span>
                </div>
              </div>
              <div className="pt-4 border-t border-angola-black/5">
                <p className="text-[10px] font-black text-angola-black/30 uppercase tracking-widest mb-4">Estatísticas</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl text-center">
                    <p className="text-2xl font-black text-angola-black">{purchasedContents.length}</p>
                    <p className="text-[10px] font-black text-angola-black/40 uppercase">Ficheiros</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl text-center">
                    <p className="text-2xl font-black text-angola-black">{profile?.purchasedBundleIds?.length || 0}</p>
                    <p className="text-[10px] font-black text-angola-black/40 uppercase">Pacotes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
