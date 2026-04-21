import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import ContentCard from '../components/ContentCard';
import { Loader2, BookOpen, Settings, ShieldCheck, Package, Upload as UploadIcon, Heart, History } from 'lucide-react';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [purchasedContents, setPurchasedContents] = useState<any[]>([]);
  const [myUploads, setMyUploads] = useState<any[]>([]);
  const [favoriteContents, setFavoriteContents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'purchased' | 'uploads' | 'favorites'>('purchased');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // 1. Fetch Purchased
        if (profile?.purchased_bundle_ids?.length) {
          const { data: purchased } = await supabase
            .from('contents')
            .select('*')
            .in('bundle_id', profile.purchased_bundle_ids)
            .eq('status', 'approved');
          setPurchasedContents(purchased || []);
        }

        // 2. Fetch My Uploads
        const { data: uploads } = await supabase
          .from('contents')
          .select('*')
          .eq('user_id', user.uid);
        setMyUploads(uploads || []);

        // 3. Fetch Favorites
        if (profile?.favorite_ids?.length) {
          const { data: favs } = await supabase
            .from('contents')
            .select('*')
            .in('id', profile.favorite_ids);
          setFavoriteContents(favs || []);
        }

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user, profile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <Loader2 className="w-10 h-10 text-angola-red animate-spin" />
      </div>
    );
  }

  const currentItems = 
    activeTab === 'purchased' ? purchasedContents : 
    activeTab === 'uploads' ? myUploads : 
    favoriteContents;

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6 text-center sm:text-left">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-angola-red rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center text-white text-2xl md:text-3xl font-black shadow-xl shadow-red-900/20 rotate-3 shrink-0">
            {profile?.display_name?.charAt(0) || user?.email?.charAt(0)}
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-angola-black">Olá, {profile?.display_name || 'Estudante'}</h1>
            <p className="text-angola-black/40 font-bold text-sm md:text-base">Bem-vindo à tua biblioteca pessoal do BukiAngolano.</p>
          </div>
        </div>

        <div className="flex items-center justify-center sm:justify-start gap-3 bg-angola-yellow/20 px-6 py-3 rounded-2xl border border-angola-yellow/30 self-center md:self-auto">
          <ShieldCheck className="w-5 h-5 text-angola-black" />
          <span className="text-angola-black font-black uppercase text-[10px] md:text-xs tracking-widest">Conta Verificada</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
        <div className="lg:col-span-2 space-y-10">
          {/* Tabs Navigation */}
          <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 md:gap-4 bg-slate-50 p-2 rounded-2xl md:rounded-3xl border border-angola-black/5">
            <button
              onClick={() => setActiveTab('purchased')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl font-black transition-all text-xs md:text-base ${
                activeTab === 'purchased' ? 'bg-angola-black text-white shadow-xl px-6' : 'text-angola-black/40 hover:text-angola-black'
              }`}
            >
              <Package className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">Comprados</span>
              <span className="sm:hidden">Premium</span>
              <span className="ml-1 md:ml-2 text-[9px] md:text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">{purchasedContents.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('uploads')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl font-black transition-all text-xs md:text-base ${
                activeTab === 'uploads' ? 'bg-angola-red text-white shadow-xl px-6' : 'text-angola-black/40 hover:text-angola-red'
              }`}
            >
              <UploadIcon className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">Meus Envios</span>
              <span className="sm:hidden">Envios</span>
              <span className="ml-1 md:ml-2 text-[9px] md:text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">{myUploads.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl font-black transition-all text-xs md:text-base ${
                activeTab === 'favorites' ? 'bg-angola-yellow text-angola-black shadow-xl px-6' : 'text-angola-black/40 hover:text-angola-yellow'
              }`}
            >
              <Heart className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">Favoritos</span>
              <span className="sm:hidden">Favs</span>
              <span className="ml-1 md:ml-2 text-[9px] md:text-[10px] bg-black/10 px-1.5 py-0.5 rounded-full">{favoriteContents.length}</span>
            </button>
          </div>

          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-angola-black flex items-center gap-3">
                {activeTab === 'purchased' && <BookOpen className="w-7 h-7 text-angola-red" />}
                {activeTab === 'uploads' && <UploadIcon className="w-7 h-7 text-angola-red" />}
                {activeTab === 'favorites' && <Heart className="w-7 h-7 text-angola-red" />}
                {activeTab === 'purchased' ? 'Biblioteca Premium' : activeTab === 'uploads' ? 'Meus Manuais Enviados' : 'Meus Favoritos'}
              </h2>
            </div>

            {currentItems.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 md:gap-8">
                {currentItems.map((content: any) => (
                  <ContentCard key={content.id} content={content} />
                ))}
              </div>
            ) : (
              <div className="bg-white p-16 rounded-[3rem] border-2 border-dashed border-angola-black/10 text-center space-y-6">
                <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                  {activeTab === 'purchased' && <BookOpen className="w-10 h-10 text-angola-black/10" />}
                  {activeTab === 'uploads' && <UploadIcon className="w-10 h-10 text-angola-black/10" />}
                  {activeTab === 'favorites' && <Heart className="w-10 h-10 text-angola-black/10" />}
                </div>
                <div className="space-y-2">
                  <p className="text-angola-black/60 font-black text-xl">
                    {activeTab === 'purchased' ? 'A tua biblioteca está vazia.' : 
                     activeTab === 'uploads' ? 'Não encontrámos manuais enviados por ti.' : 
                     'Ainda não guardaste nenhum manual como favorito.'}
                  </p>
                  <p className="text-angola-black/30 font-bold">
                    {activeTab === 'purchased' ? 'Explora o catálogo e desbloqueia pacotes de conhecimento.' : 
                     activeTab === 'uploads' ? 'Partilha os teus trabalhos com a comunidade.' : 
                     'Marca conteúdos com um coração para os guardares aqui.'}
                  </p>
                </div>
                <button 
                  onClick={() => window.location.href = activeTab === 'uploads' ? '/upload' : '/catalog'}
                  className="bg-angola-black text-white px-8 py-4 rounded-2xl font-black hover:bg-angola-red transition-all shadow-xl"
                >
                  {activeTab === 'uploads' ? 'Enviar Conteúdo' : 'Explorar Catálogo'}
                </button>
              </div>
            )}
          </div>
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
                    <p className="text-2xl font-black text-angola-black">{myUploads.length}</p>
                    <p className="text-[10px] font-black text-angola-black/40 uppercase">Meus Envios</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl text-center">
                    <p className="text-2xl font-black text-angola-black">{profile?.purchased_bundle_ids?.length || 0}</p>
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
