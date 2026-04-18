import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore'; // Note: Keeping for reference if needed but logic is migrated
import { auth } from '../firebase';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Video, Lock, CheckCircle2, CreditCard, Loader2, ArrowLeft, Download, User as UserIcon, ShieldCheck, Heart, Eye, Mail, History, X } from 'lucide-react';

export default function ContentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkingAccess, setCheckingAccess] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriting, setFavoriting] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSupportPopup, setShowSupportPopup] = useState(false);

  useEffect(() => {
    let interval: any;
    if (isFullscreen) {
      // First show after 30 seconds, then every 2 minutes
      const firstTimeout = setTimeout(() => {
        setShowSupportPopup(true);
        setTimeout(() => setShowSupportPopup(false), 15000);
      }, 30000);

      interval = setInterval(() => {
        setShowSupportPopup(true);
        setTimeout(() => setShowSupportPopup(false), 15000);
      }, 120000);

      return () => {
        clearTimeout(firstTimeout);
        clearInterval(interval);
      };
    }
  }, [isFullscreen]);

  useEffect(() => {
    if (profile && content) {
      setIsFavorited(profile.favorite_ids?.includes(content.id));
    }
  }, [profile, content]);

  // Check if user has access (free content or purchased bundle)
  const hasAccess = content?.is_free || profile?.purchased_bundle_ids?.includes(content?.bundle_id);

  useEffect(() => {
    const fetchContent = async () => {
      if (!id) return;
      try {
        // Fetch content and join with users table to get uploader details
        const { data, error } = await supabase
          .from('contents')
          .select('*, profiles:users!contents_user_id_fkey(display_name, email)')
          .eq('id', id)
          .single();

        if (error) {
          // Fallback if join fails (might happen if foreign keys aren't set up yet)
          const { data: simpleData, error: simpleError } = await supabase
            .from('contents')
            .select('*')
            .eq('id', id)
            .single();
          
          if (simpleError) throw simpleError;
          setContent(simpleData);
        } else {
          setContent(data);
        }
      } catch (error) {
        console.error("Error fetching content from Supabase:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [id, navigate]);

  const handleUnlock = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setShowPaymentModal(true);
  };

  const toggleFavorite = async () => {
    if (!user || !profile || !content) {
      if (!user) navigate('/login');
      return;
    }

    setFavoriting(true);
    try {
      const currentFavs = profile.favorite_ids || [];
      let newFavs;
      
      if (isFavorited) {
        newFavs = currentFavs.filter((id: string) => id !== content.id);
      } else {
        newFavs = [...currentFavs, content.id];
      }

      const { error } = await supabase
        .from('users')
        .update({ favorite_ids: newFavs })
        .eq('uid', user.uid);

      if (error) throw error;
      
      setIsFavorited(!isFavorited);
    } catch (error) {
      console.error("Error toggling favorite:", error);
    } finally {
      setFavoriting(false);
    }
  };

  const processPayment = async () => {
    setCheckingAccess(true);
    try {
      const response = await fetch('/api/payments/checkout-bundle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.uid, bundleId: content.bundleId || 'default_bundle' })
      });
      const session = await response.json();
      if (session.url) {
        navigate(session.url);
      }
    } catch (error) {
      console.error("Payment error:", error);
      setCheckingAccess(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="w-10 h-10 text-angola-red animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-angola-black/40 hover:text-angola-red transition-colors font-bold"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar à Biblioteca
      </button>

      <div className="grid lg:grid-cols-3 gap-8 md:gap-12">
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          <div className="space-y-4 md:space-y-6">
            <div className="flex items-center gap-3">
              <span className="bg-angola-red text-white px-3 py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest">
                {content.category}
              </span>
              <span className="bg-angola-yellow text-angola-black px-3 py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border border-angola-black/10">
                {content.type}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-angola-black leading-tight">
                {content.title}
              </h1>
              <button
                onClick={toggleFavorite}
                disabled={favoriting}
                className={`p-3 md:p-4 rounded-2xl border transition-all self-start sm:self-center shrink-0 ${
                  isFavorited 
                    ? 'bg-angola-red border-angola-red text-white shadow-xl shadow-red-900/20' 
                    : 'bg-white border-angola-black/5 text-angola-black/20 hover:text-angola-red hover:border-angola-red/20'
                }`}
                title={isFavorited ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
              >
                {favoriting ? (
                  <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" />
                ) : (
                  <Heart className={`w-5 h-5 md:w-6 md:h-6 ${isFavorited ? 'fill-current' : ''}`} />
                )}
              </button>
            </div>
            <p className="text-lg md:text-xl text-angola-black/60 font-medium">{content.subtitle}</p>
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3 pt-6 text-angola-black/50 font-medium text-xs md:text-sm border-t border-angola-black/5">
              <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-2xl border border-angola-black/5">
                <div className="bg-angola-red/10 p-2 rounded-xl">
                  <UserIcon className="w-4 h-4 text-angola-red" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-black text-angola-black/30 leading-none mb-1">Partilhado por</span>
                  <span className="font-black text-angola-black">{content.profiles?.display_name || content.author}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-2xl border border-angola-black/5">
                <div className="bg-angola-red/10 p-2 rounded-xl">
                  <Mail className="w-4 h-4 text-angola-red" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-black text-angola-black/30 leading-none mb-1">E-mail</span>
                  <span className="font-black text-angola-black">{content.profiles?.email || 'estudante@bukiangolano.com'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-2xl border border-angola-black/5">
                <div className="bg-angola-red/10 p-2 rounded-xl">
                  <History className="w-4 h-4 text-angola-red" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-black text-angola-black/30 leading-none mb-1">Publicado em</span>
                  <span className="font-black text-angola-black">{content.created_at ? new Date(content.created_at).toLocaleDateString('pt-AO') : 'Recentemente'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Viewer Section */}
          <div className="space-y-6">
            <div className="bg-white p-1.5 md:p-2 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl border border-angola-black/5 overflow-hidden">
              <div className="aspect-[3/4] sm:aspect-video bg-slate-100 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden relative group">
                {isReading && hasAccess ? (
                  // Document Viewer Mode
                  (content.storage_type === 'supabase' || content.storageType === 'firebase') ? (
                    (content.type === 'pdf' || content.type === 'manual' || content.type === 'book') ? (
                      <iframe 
                        src={content.file_url || content.fileUrl} 
                        className="w-full h-full border-none"
                        title="Content Viewer"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 md:p-12 text-center space-y-4">
                        <FileText className="w-12 h-12 md:w-16 md:h-16 text-angola-red" />
                        <h3 className="text-lg md:text-xl font-bold">Ficheiro Pronto</h3>
                        <a href={content.file_url || content.fileUrl} target="_blank" rel="noopener noreferrer" className="bg-angola-black text-white px-6 md:px-8 py-3 rounded-xl font-bold">
                          Abrir Ficheiro
                        </a>
                      </div>
                    )
                  ) : (
                    <iframe 
                      src={`https://drive.google.com/file/d/${content.file_id_primary || content.fileIdPrimary}/preview`} 
                      className="w-full h-full border-none"
                      title="Content Viewer"
                    />
                  )
                ) : (
                  // Cover Image Mode (Default or Locked)
                  <div className="relative w-full h-full">
                    {content.thumbnail_url ? (
                      <img 
                        src={content.thumbnail_url} 
                        alt="Capa do Trabalho" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="w-20 h-20 text-angola-black/5" />
                      </div>
                    )}

                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-angola-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8 space-y-6">
                      {hasAccess ? (
                        <>
                          <div className="bg-white/20 p-6 rounded-full rotate-3 mb-2">
                            <Eye className="w-12 h-12 text-angola-yellow" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-2xl font-black text-white">Pronto para Ler</h3>
                            <p className="text-white/60 font-medium">Clica no botão abaixo para abrir o documento completo.</p>
                          </div>
                          <button 
                            onClick={() => {
                              setIsReading(true);
                              setIsFullscreen(true);
                            }}
                            className="bg-angola-yellow text-angola-black px-12 py-4 rounded-2xl font-black text-lg hover:scale-105 transition-all shadow-xl shadow-yellow-900/20"
                          >
                            Ler Agora
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="bg-white/10 p-6 rounded-full">
                            <Lock className="w-12 h-12 text-white/50" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-2xl font-black text-white">Conteúdo Bloqueado</h3>
                            <p className="text-white/60 font-medium max-w-xs">Adquire este pacote para desbloquear o acesso completo a este material.</p>
                          </div>
                          <button 
                            onClick={handleUnlock}
                            className="bg-angola-red text-white px-12 py-4 rounded-2xl font-black text-lg hover:scale-105 transition-all shadow-xl shadow-red-900/20"
                          >
                            Desbloquear - 2.000 Kz
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>


        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-angola-black/5 space-y-8 sticky top-24">
            <div className="space-y-2">
              <p className="text-angola-black/40 text-[10px] font-black uppercase tracking-widest">Estado do Acesso</p>
              {hasAccess ? (
                <div className="flex items-center gap-2 text-green-600 font-black text-xl">
                  <ShieldCheck className="w-6 h-6" />
                  Acesso Total
                </div>
              ) : (
                <div className="flex items-center gap-2 text-angola-red font-black text-xl">
                  <Lock className="w-6 h-6" />
                  Bloqueado
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h4 className="font-black text-angola-black text-sm uppercase tracking-wider">O que inclui:</h4>
              <div className="space-y-3">
                {[
                  'Acesso vitalício ao material',
                  'Visualização em qualquer dispositivo',
                  'Atualizações do conteúdo',
                  'Suporte da comunidade'
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm font-bold text-angola-black/60">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {!hasAccess && (
              <button 
                onClick={handleUnlock}
                className="w-full bg-angola-yellow text-angola-black py-5 rounded-2xl font-black text-lg hover:bg-yellow-400 transition-all shadow-xl shadow-yellow-900/10 border-b-4 border-yellow-600"
              >
                Desbloquear Agora
              </button>
            )}

            {hasAccess && (
              <div className="space-y-3">
                <button 
                  onClick={() => setIsFullscreen(true)}
                  className={`w-full flex items-center justify-center gap-2 py-5 rounded-2xl font-black transition-all shadow-xl bg-angola-yellow text-angola-black`}
                >
                  <Eye className="w-5 h-5" />
                  Ler Agora
                </button>
                <a 
                  href={content.storage_type === 'supabase' ? content.file_url : content.fileUrl || `https://drive.google.com/file/d/${content.file_id_primary || content.fileIdPrimary}/view`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-angola-black text-white py-5 rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl"
                >
                  <Download className="w-5 h-5" />
                  Baixar Ficheiro
                </a>
                <p className="text-[10px] text-center text-angola-black/30 font-bold italic">
                  {content.storage_type === 'supabase' ? '* Ficheiro armazenado de forma segura no Supabase.' : '* Link de segurança do Firebase/Drive.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !checkingAccess && setShowPaymentModal(false)}
              className="absolute inset-0 bg-angola-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <div className="p-10 space-y-8">
                <div className="text-center space-y-4">
                  <div className="bg-angola-yellow/20 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 rotate-3">
                    <CreditCard className="w-10 h-10 text-angola-black" />
                  </div>
                  <h3 className="text-3xl font-black text-angola-black">Acesso Premium</h3>
                  <p className="text-angola-black/50 font-medium">Estás a um passo de desbloquear este pacote de conhecimento.</p>
                </div>

                <div className="bg-slate-50 p-6 rounded-3xl space-y-4 border border-angola-black/5">
                  <div className="flex justify-between items-center">
                    <span className="text-angola-black/40 font-bold text-xs uppercase">Pacote:</span>
                    <span className="font-black text-angola-black truncate max-w-[180px]">Estudos Avançados</span>
                  </div>
                  <div className="flex justify-between items-center text-2xl font-black border-t border-angola-black/5 pt-4">
                    <span className="text-angola-black">Total:</span>
                    <span className="text-angola-red">2.000 Kz</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={processPayment}
                    disabled={checkingAccess}
                    className="w-full bg-angola-red text-white py-5 rounded-2xl font-black text-xl hover:bg-red-700 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-red-900/20 disabled:opacity-50"
                  >
                    {checkingAccess ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      'Confirmar Pagamento'
                    )}
                  </button>
                  <button 
                    onClick={() => setShowPaymentModal(false)}
                    className="w-full text-angola-black/40 font-black py-2 hover:text-angola-black transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Fullscreen Reader */}
      <AnimatePresence>
        {isFullscreen && hasAccess && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-angola-black flex flex-col"
          >
            {/* Header */}
            <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
              <div className="flex items-center gap-4">
                <div className="bg-angola-red/10 p-2 rounded-xl">
                  <FileText className="w-5 h-5 text-angola-red" />
                </div>
                <div>
                  <h3 className="font-black text-angola-black leading-none truncate max-w-[200px] sm:max-w-md">{content.title}</h3>
                  <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mt-1">{content.author}</p>
                </div>
              </div>
              
              <button 
                onClick={() => setIsFullscreen(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-500 p-2 rounded-xl transition-colors flex items-center gap-2 font-bold text-sm px-4"
              >
                <X className="w-5 h-5" />
                <span className="hidden sm:inline">Fechar</span>
              </button>
            </div>

            {/* Support Popup Overlay */}
            <AnimatePresence>
              {showSupportPopup && (
                <motion.div 
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 50, scale: 0.9 }}
                  className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[210] w-full max-w-lg px-6"
                >
                  <div className="relative bg-white rounded-[2.5rem] shadow-2xl border border-angola-black/5 p-8 flex items-center gap-6">
                    <div className="bg-angola-yellow/20 p-5 rounded-3xl shrink-0 rotate-3">
                      <Heart className="w-8 h-8 text-angola-red fill-current" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-angola-black font-bold text-sm leading-relaxed">
                        Apoie o projecto que passe de vez em quando
                      </p>
                      <div className="bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200">
                        <p className="text-[10px] uppercase font-black text-slate-400 mb-1">IBAN de Joaquim Ildefonso</p>
                        <p className="font-black text-angola-black text-xs select-all">0040.0000.7161.8726.1028.3</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowSupportPopup(false)}
                      className="absolute top-4 right-4 text-slate-300 hover:text-slate-500 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Reader Content */}
            <div className="flex-1 overflow-hidden bg-slate-100">
              {(content.storage_type === 'supabase' || content.storageType === 'firebase') ? (
                (content.type === 'pdf' || content.type === 'manual' || content.type === 'book') ? (
                  <iframe 
                    src={content.file_url || content.fileUrl} 
                    className="w-full h-full border-none"
                    title="Content Viewer Fullscreen"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center space-y-4">
                    <FileText className="w-24 h-24 text-angola-red" />
                    <h3 className="text-2xl font-black">Ficheiro Pronto</h3>
                    <a href={content.file_url || content.fileUrl} target="_blank" rel="noopener noreferrer" className="bg-angola-black text-white px-10 py-5 rounded-2xl font-black text-lg">
                      Abrir Ficheiro Externamente
                    </a>
                  </div>
                )
              ) : (
                <iframe 
                  src={`https://drive.google.com/file/d/${content.file_id_primary || content.fileIdPrimary}/preview`} 
                  className="w-full h-full border-none"
                  title="Content Viewer Fullscreen"
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
