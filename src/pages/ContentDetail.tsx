import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore'; // Note: Keeping for reference if needed but logic is migrated
import { auth } from '../firebase';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import Logo from '../components/Logo';
import SEO from '../components/SEO';
import ContentCard from '../components/ContentCard';
import { FileText, Video, Lock, CheckCircle2, CreditCard, Loader2, ArrowLeft, Download, User as UserIcon, ShieldCheck, Heart, Eye, Mail, History, X, Sparkles, MessageSquareHeart, PlayCircle, LayoutDashboard, Copy } from 'lucide-react';

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
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [relatedContent, setRelatedContent] = useState<any[]>([]);
  const [authorContent, setAuthorContent] = useState<any[]>([]);

  // Render clean description from JSON subtitle
  const displayDescription = (() => {
    const raw = content?.subtitle || content?.author;
    if (!raw) return '';
    try {
      if (typeof raw === 'string' && raw.trim().startsWith('{')) {
        const parsed = JSON.parse(raw);
        return parsed.description || raw;
      }
    } catch {
      // ignore
    }
    return raw;
  })();

  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
      
      // First show after 30 seconds, then every 2 minutes
      const firstTimeout = setTimeout(() => {
        setShowSupportPopup(true);
        setTimeout(() => setShowSupportPopup(false), 15000);
      }, 30000);

      const interval = setInterval(() => {
        setShowSupportPopup(true);
        setTimeout(() => setShowSupportPopup(false), 15000);
      }, 120000);

      return () => {
        document.body.style.overflow = 'unset';
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

  const copyIban = () => {
    const iban = "004000007161872610283";
    navigator.clipboard.writeText(iban);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

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
          if (simpleData) {
            let processedData = { ...simpleData };
            // FIX: If it's a course and metadata column is missing/empty, 
            // check if structure is stored in subtitle as stringified JSON
            if (processedData.type === 'course' && !processedData.metadata) {
              try {
                const parsed = JSON.parse(processedData.subtitle);
                processedData.metadata = parsed;
                // Update subtitle to be just the description for UI display
                processedData.subtitle = parsed.description || ""; 
                
                // Set first video as active by default
                if (parsed.modules?.[0]?.videos?.[0]) {
                  processedData.metadata.activeVideo = parsed.modules[0].videos[0];
                }
              } catch (e) {
                console.warn("Subtitle is not a JSON curso", e);
              }
            } else if (processedData.type === 'course' && processedData.metadata) {
               // Ensure at least one video is active if not already
               if (!processedData.metadata.activeVideo && processedData.metadata.modules?.[0]?.videos?.[0]) {
                 processedData.metadata.activeVideo = processedData.metadata.modules[0].videos[0];
               }
            }
            setContent(processedData);
            fetchRelated(processedData);
          }
        } else {
          let processedData = { ...data };
          if (processedData.type === 'course' && !processedData.metadata) {
            try {
              const parsed = JSON.parse(processedData.subtitle);
              processedData.metadata = parsed;
              processedData.subtitle = parsed.description || "";
              
              // Set first video as active by default
              if (parsed.modules?.[0]?.videos?.[0]) {
                processedData.metadata.activeVideo = parsed.modules[0].videos[0];
              }
            } catch (e) {
              console.warn("Subtitle is not a JSON curso", e);
            }
          } else if (processedData.type === 'course' && processedData.metadata) {
             // Ensure at least one video is active if not already
             if (!processedData.metadata.activeVideo && processedData.metadata.modules?.[0]?.videos?.[0]) {
               processedData.metadata.activeVideo = processedData.metadata.modules[0].videos[0];
             }
          }
          setContent(processedData);
          fetchRelated(processedData);
        }
      } catch (error) {
        console.error("Error fetching content from Supabase:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchRelated = async (data: any) => {
      try {
        const [relatedResponse, authorResponse] = await Promise.all([
          supabase
            .from('contents')
            .select('*')
            .eq('category', data.category)
            .eq('status', 'approved')
            .neq('id', data.id)
            .limit(4),
          supabase
            .from('contents')
            .select('*')
            .eq('profiles_id', data.profiles_id || data.user_id)
            .eq('status', 'approved')
            .neq('id', data.id)
            .limit(4)
        ]);

        if (relatedResponse.data) setRelatedContent(relatedResponse.data);
        if (authorResponse.data) setAuthorContent(authorResponse.data);
      } catch (err) {
        console.error("Error fetching related content:", err);
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
      <SEO 
        title={content.title}
        description={content.subtitle || `Trabalho académico sobre ${content.category} partilhado na Buki Angolano.`}
        image={content.thumbnail_url}
        url={window.location.href}
        type="book"
        category={content.category}
        categoryUrl={`/catalog?category=${encodeURIComponent(content.category)}`}
        author={content.profiles?.display_name || content.author}
      />
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-angola-black/40 hover:text-angola-red transition-colors font-bold"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar à Biblioteca
      </button>

      <div className="grid lg:grid-cols-3 gap-6 md:gap-12">
        <div className="lg:col-span-2 space-y-6 md:space-y-10">
          <div className="space-y-4 md:space-y-8">
            <div className="flex items-center gap-2 md:gap-3">
              <span className="bg-angola-red text-white px-2.5 py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest shrink-0">
                {content.category}
              </span>
              <span className="bg-angola-yellow text-angola-black px-2.5 py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest border border-angola-black/10 shrink-0">
                {content.type}
              </span>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-angola-black leading-tight">
                  {content.title}
                </h1>
                <button
                  onClick={toggleFavorite}
                  disabled={favoriting}
                  className={`p-3 md:p-4 rounded-xl md:rounded-2xl border transition-all shrink-0 ${
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
            </div>
            <p className="text-sm md:text-xl text-angola-black/60 font-medium leading-relaxed">
              {displayDescription}
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap items-center gap-3 pt-6 text-angola-black/50 font-medium text-xs md:text-sm border-t border-angola-black/5">
              <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl md:rounded-2xl border border-angola-black/5">
                <div className="bg-angola-red/10 p-1.5 md:p-2 rounded-lg md:rounded-xl">
                  <UserIcon className="w-3.5 h-3.5 md:w-4 md:h-4 text-angola-red" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[8px] md:text-[10px] uppercase font-black text-angola-black/30 leading-none mb-1">Partilhado por</span>
                  <span className="font-black text-angola-black text-xs md:text-sm truncate">{content.profiles?.display_name || content.author}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl md:rounded-2xl border border-angola-black/5">
                <div className="bg-angola-red/10 p-1.5 md:p-2 rounded-lg md:rounded-xl">
                  <Mail className="w-3.5 h-3.5 md:w-4 md:h-4 text-angola-red" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[8px] md:text-[10px] uppercase font-black text-angola-black/30 leading-none mb-1">E-mail</span>
                  <span className="font-black text-angola-black text-xs md:text-sm truncate">{content.profiles?.email || 'estudante@bukiangolano.com'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl md:rounded-2xl border border-angola-black/5">
                <div className="bg-angola-red/10 p-1.5 md:p-2 rounded-lg md:rounded-xl">
                  <History className="w-3.5 h-3.5 md:w-4 md:h-4 text-angola-red" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[8px] md:text-[10px] uppercase font-black text-angola-black/30 leading-none mb-1">Publicado em</span>
                  <span className="font-black text-angola-black text-xs md:text-sm truncate">{content.created_at ? new Date(content.created_at).toLocaleDateString('pt-AO') : 'Recentemente'}</span>
                </div>
              </div>

              {content.type === 'course' && content.metadata?.modules && (
                <>
                  <div className="flex items-center gap-3 bg-emerald-50 px-4 py-2.5 rounded-2xl border border-emerald-100">
                    <div className="bg-emerald-500/10 p-2 rounded-xl">
                      <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-black text-emerald-600/40 leading-none mb-1">Módulos</span>
                      <span className="font-black text-emerald-700">{content.metadata.modules.length} Estruturas</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-blue-50 px-4 py-2.5 rounded-2xl border border-blue-100">
                    <div className="bg-blue-500/10 p-2 rounded-xl">
                      <Video className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-black text-blue-600/40 leading-none mb-1">Carga Horária</span>
                      <span className="font-black text-blue-700">
                        {content.metadata.modules.reduce((acc: number, m: any) => acc + (m.videos?.length || 0), 0)} Vídeo-Aulas
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-purple-50 px-4 py-2.5 rounded-2xl border border-purple-100">
                    <div className="bg-purple-500/10 p-2 rounded-xl">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-black text-purple-600/40 leading-none mb-1">Materiais Extra</span>
                      <span className="font-black text-purple-700">
                        {content.metadata.modules.reduce((acc: number, m: any) => acc + (m.enrichments?.length || 0), 0)} Conteúdos da App
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {content.type === 'course' && content.metadata?.modules && (
              <div className="space-y-6 bg-slate-50 p-6 md:p-8 rounded-[2rem] border border-angola-black/5">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-lg md:text-xl font-black text-angola-black tracking-tight flex items-center gap-2 leading-tight">
                       <Video className="w-5 h-5 text-angola-red" />
                       Conteúdo do Curso
                    </h3>
                    <p className="text-[10px] font-bold text-angola-black/40 uppercase tracking-widest">Currículo Completo</p>
                  </div>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
                   {content.metadata.modules.slice(0, 4).map((module: any, idx: number) => (
                     <div key={idx} className="space-y-3">
                        <h4 className="text-[10px] font-black text-angola-red uppercase tracking-widest flex items-start gap-2 leading-tight">
                          <span className="w-5 h-5 bg-angola-red/10 flex items-center justify-center rounded-md shrink-0">{idx+1}</span>
                          <span className="pt-0.5">{module.name}</span>
                        </h4>
                        <ul className="space-y-2 pl-2">
                          {module.videos?.slice(0, 3).map((v: any, vIdx: number) => (
                            <li key={vIdx} className="flex items-start gap-3 text-xs font-bold text-angola-black/60">
                              <div className="w-1 h-1 bg-angola-black/20 rounded-full mt-1.5 shrink-0" />
                              <span className="leading-snug">{v.title}</span>
                            </li>
                          ))}
                          {(module.videos?.length || 0) > 3 && (
                            <li className="text-[10px] font-black text-angola-black/30 italic pl-4">+ {module.videos.length - 3} aulas</li>
                          )}
                          
                          {/* Enrichment Preview */}
                          {module.enrichments && module.enrichments.length > 0 && (
                            <li className="flex items-center gap-2 text-[9px] font-black text-purple-600 bg-purple-50 px-2 py-1 rounded-md w-fit mt-1">
                              <Sparkles className="w-3 h-3" />
                              {module.enrichments.length} Material de Apoio
                            </li>
                          )}
                        </ul>
                     </div>
                   ))}
                </div>
                
                {content.metadata.modules.length > 4 && (
                  <p className="text-center text-[10px] font-black text-angola-black/20 uppercase tracking-widest pt-4 border-t border-angola-black/5">
                    E mais {content.metadata.modules.length - 4} módulos completos...
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Viewer Section */}
          <div className="space-y-6">
            <div className="bg-white p-1.5 md:p-2 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl border border-angola-black/5 overflow-hidden">
              <div className="aspect-[3/4] sm:aspect-video bg-slate-100 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden relative group">
                {isReading && hasAccess ? (
                  // Course Viewer Mode
                  content.type === 'course' ? (
                    <div className="w-full h-full flex flex-col bg-slate-900 overflow-hidden">
                      {/* Course Header/Video Player */}
                      <div className="aspect-video bg-black shrink-0 relative">
                        {content.metadata?.activeVideo ? (
                          <iframe 
                            src={`https://www.youtube.com/embed/${content.metadata.activeVideo.id}?autoplay=1&modestbranding=1&rel=0&iv_load_policy=3`}
                            className="w-full h-full border-none"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center space-y-4">
                            <PlayCircle className="w-16 h-16 text-red-500 animate-pulse" />
                            <p className="text-white font-bold">Seleciona uma aula para começar</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Modules List in Reader */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {content.metadata?.modules?.map((module: any, mIdx: number) => (
                          <div key={mIdx} className="space-y-2">
                             <h4 className="text-white/40 text-[10px] font-black uppercase tracking-widest px-2">{module.name}</h4>
                             <div className="space-y-1">
                               {module.videos.map((v: any, vIdx: number) => (
                                 <button 
                                   key={vIdx}
                                   onClick={() => setContent({
                                     ...content,
                                     metadata: { ...content.metadata, activeVideo: v }
                                   })}
                                   className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 ${
                                     content.metadata.activeVideo?.id === v.id 
                                     ? 'bg-angola-red text-white' 
                                     : 'bg-white/5 text-white/60 hover:bg-white/10'
                                   }`}
                                 >
                                   <Video className="w-4 h-4 shrink-0" />
                                   <span className="text-xs font-bold truncate">{v.title}</span>
                                 </button>
                               ))}
                             </div>

                             {/* Enrichment Materials in Sidebar */}
                             {module.enrichments && module.enrichments.length > 0 && (
                               <div className="mt-3 px-2 space-y-2">
                                 <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest pl-2 flex items-center gap-2">
                                   <Sparkles className="w-3 h-3" />
                                   Materiais de Apoio
                                 </p>
                                 <div className="space-y-2">
                                   {module.enrichments.map((e: any) => (
                                     <Link 
                                       key={e.id}
                                       to={`/content/${e.id}`}
                                       target="_blank"
                                       className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all border border-angola-black/5 group"
                                     >
                                        <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center shrink-0">
                                          <FileText className="w-4 h-4 text-purple-600" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <p className="text-[11px] font-bold text-angola-black/70 truncate group-hover:text-angola-black transition-colors">{e.title}</p>
                                          <p className="text-[9px] font-black text-purple-400/50 uppercase">{e.type}</p>
                                        </div>
                                     </Link>
                                   ))}
                                 </div>
                               </div>
                             )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) :
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
                        width={600}
                        height={800}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="w-20 h-20 text-angola-black/5" />
                      </div>
                    )}

                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-angola-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 md:p-8 space-y-6">
                      {hasAccess ? (
                        <>
                          <div className="bg-white/20 p-4 md:p-6 rounded-full rotate-3 mb-2 shrink-0">
                            {content.type === 'course' ? (
                              <Video className="w-8 h-8 md:w-12 md:h-12 text-angola-yellow" />
                            ) : (
                              <Eye className="w-8 h-8 md:w-12 md:h-12 text-angola-yellow" />
                            )}
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-xl md:text-2xl font-black text-white leading-tight">
                              {content.type === 'course' ? 'Pronto para Assistir' : 'Pronto para Ler'}
                            </h3>
                            <p className="text-sm md:text-base text-white/60 font-medium max-w-[200px] md:max-w-xs mx-auto leading-tight">
                              {content.type === 'course' 
                                ? 'Clica no botão abaixo para carregar as vídeo-aulas.' 
                                : 'Clica no botão abaixo para abrir o documento.'}
                            </p>
                          </div>
                          <button 
                            onClick={() => {
                              setIsReading(true);
                              setIsFullscreen(true);
                            }}
                            className="w-[80%] sm:w-auto bg-angola-yellow text-angola-black px-8 md:px-12 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-base md:text-lg hover:scale-105 transition-all shadow-xl shadow-yellow-900/20"
                          >
                            {content.type === 'course' ? 'Assistir Agora' : 'Ler Agora'}
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
              <p className="text-angola-black/40 text-[10px] font-black uppercase tracking-widest">
                {content.type === 'course' ? 'Estado da Inscrição' : 'Estado do Acesso'}
              </p>
              {hasAccess ? (
                <div className="flex items-center gap-2 text-green-600 font-black text-xl">
                  <ShieldCheck className="w-6 h-6" />
                  {content.type === 'course' ? 'Inscrito / Ativo' : 'Acesso Total'}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-angola-red font-black text-xl">
                  <Lock className="w-6 h-6" />
                  Bloqueado
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h4 className="font-black text-angola-black text-sm uppercase tracking-wider">
                {content.type === 'course' ? 'O que vais aprender:' : 'O que inclui:'}
              </h4>
              <div className="space-y-3">
                {(content.type === 'course' ? [
                  'Acesso vitalício às vídeo-aulas',
                  'Certificado de participação Buki',
                  'Materiais e scripts de apoio',
                  'Mentoria via comunidade'
                ] : [
                  'Acesso vitalício ao material',
                  'Visualização em qualquer dispositivo',
                  'Atualizações do conteúdo',
                  'Suporte da comunidade'
                ]).map((item, i) => (
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
                  {content.type === 'course' ? (
                    <>
                      <Video className="w-5 h-5" />
                      Assistir Agora
                    </>
                  ) : (
                    <>
                      <Eye className="w-5 h-5" />
                      Ler Agora
                    </>
                  )}
                </button>
                {content.type !== 'course' && (
                  <a 
                    href={content.storage_type === 'supabase' ? content.file_url : content.fileUrl || `https://drive.google.com/file/d/${content.file_id_primary || content.fileIdPrimary}/view`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-angola-black text-white py-5 rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl"
                  >
                    <Download className="w-5 h-5" />
                    Baixar Ficheiro
                  </a>
                )}
                <p className="text-[10px] text-center text-angola-black/30 font-bold italic">
                  {content.type === 'course' 
                    ? '* Transmissão via Youtube Player Seguro.'
                    : content.storage_type === 'supabase' 
                      ? '* Ficheiro armazenado de forma segura no Supabase.' 
                      : '* Link de segurança do Firebase/Drive.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related Content Sections */}
      <div className="space-y-16 border-t border-angola-black/5 pt-16">
        {relatedContent.length > 0 && (
          <section className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl md:text-3xl font-black text-angola-black tracking-tight">Conteúdos Relacionados</h2>
                <p className="text-angola-black/40 font-medium text-sm">Outros trabalhos na categoria de <span className="text-angola-red font-bold">{content.category}</span></p>
              </div>
              <Link to={`/catalog?category=${content.category}`} className="text-angola-red font-black text-xs uppercase tracking-widest hover:underline underline-offset-4">Ver todos</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
              {relatedContent.map(item => (
                <ContentCard key={item.id} content={item} />
              ))}
            </div>
          </section>
        )}

        {authorContent.length > 0 && (
          <section className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl md:text-3xl font-black text-angola-black tracking-tight">Mais de {content.profiles?.display_name || content.author}</h2>
                <p className="text-angola-black/40 font-medium text-sm">Explora outros trabalhos partilhados por este autor.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
              {authorContent.map(item => (
                <ContentCard key={item.id} content={item} />
              ))}
            </div>
          </section>
        )}
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
            {/* Improved Header with Logo */}
            <div className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 shadow-sm">
              <div className="flex items-center gap-6">
                <div className="hidden sm:block scale-90 origin-left">
                  <Logo />
                </div>
                <div className="h-10 w-px bg-slate-100 hidden sm:block"></div>
                <div>
                  <h3 className="font-black text-angola-black leading-none truncate max-w-[150px] sm:max-w-md text-sm md:text-base">
                    {content.title}
                  </h3>
                  <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mt-1">
                    Visualização de Leitura • {content.author}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsFullscreen(false)}
                  className="bg-angola-red text-white p-2 rounded-2xl hover:bg-red-700 transition-all flex items-center gap-2 font-black text-xs px-5 shadow-lg shadow-red-900/20"
                >
                  <X className="w-4 h-4" />
                  Sair do Leitor
                </button>
              </div>
            </div>

            {/* Support Popup Overlay - Beautified and Mobile Fixed */}
            <AnimatePresence>
              {showSupportPopup && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 50 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 50 }}
                  className="fixed bottom-4 sm:bottom-10 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 z-[210] w-auto sm:w-full sm:max-w-xl"
                >
                  <div className="relative bg-white rounded-[2rem] md:rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.4)] border border-angola-black/5 p-6 md:p-10 overflow-hidden text-angola-black">
                    {/* Background decorative elements */}
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                      <Sparkles className="w-16 h-16 md:w-24 md:h-24 text-angola-yellow" />
                    </div>
                    
                    <div className="relative flex flex-col sm:flex-row items-center gap-4 md:gap-8 text-center sm:text-left">
                      <div className="relative shrink-0">
                        <div className="w-16 h-16 md:w-24 md:h-24 bg-angola-red/10 text-angola-red rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center rotate-3 shadow-xl shadow-red-900/10">
                          <MessageSquareHeart className="w-8 h-8 md:w-12 md:h-12" />
                        </div>
                        <div className="absolute -top-1 -right-1 bg-angola-yellow text-angola-black w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center font-black text-[10px] md:text-sm border-2 md:border-4 border-white">
                          🇦🇴
                        </div>
                      </div>

                      <div className="space-y-3 md:space-y-4 flex-1 w-full">
                        <div className="space-y-1">
                          <h4 className="text-lg md:text-2xl font-black text-angola-black tracking-tight leading-tight">Apoia o Projeto?</h4>
                          <p className="text-slate-500 font-bold leading-relaxed text-[10px] md:text-sm">
                            O <span className="text-angola-red">BukiAngolano</span> dá acesso gratuito a conteúdos. Para manter o projeto ativo (tecnologia e IA), precisamos de apoio.
                          </p>
                        </div>
                        
                        <div className="bg-slate-50 p-3 md:p-6 rounded-xl md:rounded-[1.5rem] border border-slate-100 shadow-inner group relative">
                          <p className="text-[9px] md:text-[10px] uppercase font-black text-slate-400 mb-2 tracking-widest flex items-center gap-2 justify-center sm:justify-start">
                            <CreditCard className="w-3 h-3" /> Titular: Joaquim Ildefonso
                          </p>
                          <div className="flex flex-col gap-3">
                            <p className="font-black text-angola-black text-xs md:text-base select-all tracking-wider font-mono break-all text-center sm:text-left bg-white/50 p-2 rounded-lg border border-slate-100">
                              0040.0000.7161.8726.1028.3
                            </p>
                            <button 
                              onClick={copyIban}
                              className={`w-full p-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-[10px] md:text-xs font-black shadow-sm ${
                                copyFeedback ? 'bg-green-500 text-white shadow-green-900/10' : 'bg-angola-black text-white hover:bg-angola-red shadow-black/10'
                              }`}
                            >
                              {copyFeedback ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                              {copyFeedback ? 'IBAN Copiado com Sucesso' : 'Copiar IBAN (Sem Pontos)'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => setShowSupportPopup(false)}
                      className="absolute top-4 right-4 p-2 text-slate-300 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all"
                    >
                      <X className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Reader Content */}
            <div className="flex-1 overflow-hidden bg-[#1A1A1A] relative">
              {content.type === 'course' ? (
                <div className="w-full h-full flex flex-col md:flex-row bg-[#0A0A0A] overflow-hidden">
                   {/* Main Video Stage */}
                   <div className="flex-none md:flex-1 flex flex-col min-w-0">
                      <div className="aspect-video md:flex-1 bg-black relative">
                        {content.metadata?.activeVideo ? (
                          <iframe 
                            src={`https://www.youtube.com/embed/${content.metadata.activeVideo.id}?autoplay=1&modestbranding=1&rel=0&iv_load_policy=3`}
                            className="w-full h-full border-none"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
                            <PlayCircle className="w-12 h-12 text-white/20 animate-pulse" />
                            <p className="text-white/40 font-bold text-sm">Aula em carregamento...</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Active Video Title Bar */}
                      <div className="bg-white/5 p-4 md:p-6 border-t border-white/5 shrink-0 flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-white font-black text-sm md:text-lg truncate">{content.metadata?.activeVideo?.title || "Aula em carregamento..."}</h4>
                          <p className="text-white/40 text-[9px] md:text-xs font-bold uppercase tracking-widest mt-0.5">Sessão Activa • Buki Academy</p>
                        </div>
                        <div className="hidden sm:flex items-center gap-2 bg-emerald-500/10 text-emerald-500 px-4 py-2 rounded-xl text-xs font-black">
                          <CheckCircle2 className="w-4 h-4" /> EM PROGRESSO
                        </div>
                      </div>
                   </div>

                   {/* Sidebar - Course Index */}
                   <div className="w-full md:w-80 flex-1 md:flex-none bg-[#141414] md:border-l border-white/5 flex flex-col shrink-0 min-h-0 overflow-hidden">
                      <div className="p-4 md:p-6 border-b border-white/5 bg-white/2 flex items-center gap-3 shrink-0">
                        <div className="bg-red-600/10 p-2 rounded-lg">
                          <Video className="w-4 h-4 text-red-500" />
                        </div>
                        <h4 className="text-white font-black text-xs md:text-sm uppercase tracking-wider">Currículo do Curso</h4>
                      </div>

                      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar touch-pan-y">
                        {content.metadata?.modules?.map((module: any, mIdx: number) => (
                          <div key={mIdx} className="space-y-3">
                            <div className="flex items-center gap-2 px-2">
                              <span className="w-6 h-6 bg-white/5 rounded-full flex items-center justify-center text-[10px] font-black text-white/30 border border-white/10">
                                {mIdx + 1}
                              </span>
                              <h5 className="text-white/50 text-[10px] font-black uppercase tracking-widest leading-none">{module.name}</h5>
                            </div>

                            <div className="space-y-1">
                              {module.videos.map((v: any, vIdx: number) => (
                                <button 
                                  key={vIdx}
                                  onClick={() => setContent({
                                    ...content,
                                    metadata: { ...content.metadata, activeVideo: v }
                                  }) }
                                  className={`w-full text-left p-4 rounded-2xl transition-all flex items-center gap-4 group ${
                                    content.metadata.activeVideo?.id === v.id 
                                    ? 'bg-angola-red text-white shadow-lg shadow-red-900/20' 
                                    : 'bg-white/5 text-white/60 hover:bg-white/10 border border-transparent'
                                  }`}
                                >
                                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                    content.metadata.activeVideo?.id === v.id ? 'bg-white/20' : 'bg-white/5 group-hover:bg-red-500/20'
                                  }`}>
                                    <Video className="w-3 h-3" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-black truncate leading-tight">{v.title}</p>
                                    <p className="text-[9px] font-bold opacity-40 uppercase mt-0.5">Aula {vIdx + 1}</p>
                                  </div>
                                  {content.metadata.activeVideo?.id === v.id && (
                                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                                  )}
                                </button>
                              ))}
                            </div>

                            {/* Enrichment Materials in Reader Sidebar */}
                            {module.enrichments && module.enrichments.length > 0 && (
                              <div className="mt-3 px-2 space-y-2">
                                <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest pl-2 flex items-center gap-2">
                                  <Sparkles className="w-3 h-3 animate-pulse" />
                                  Materiais de Apoio
                                </p>
                                <div className="space-y-2">
                                  {module.enrichments.map((e: any) => (
                                    <Link 
                                      key={e.id}
                                      to={`/content/${e.id}`}
                                      target="_blank"
                                      className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 group"
                                    >
                                       <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center shrink-0">
                                         <FileText className="w-4 h-4 text-purple-400" />
                                       </div>
                                       <div className="min-w-0 flex-1">
                                         <p className="text-[11px] font-bold text-white/70 truncate group-hover:text-white transition-colors">{e.title}</p>
                                         <p className="text-[9px] font-black text-purple-400/50 uppercase">{e.type}</p>
                                       </div>
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                   </div>
                </div>
              ) : (content.storage_type === 'supabase' || content.storageType === 'firebase') ? (
                (content.type === 'pdf' || content.type === 'manual' || content.type === 'book') ? (
                  <iframe 
                    src={content.file_url || content.fileUrl} 
                    className="w-full h-full border-none shadow-2xl"
                    title="Content Viewer Fullscreen"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center space-y-6">
                    <div className="w-32 h-32 bg-white/5 rounded-[2.5rem] flex items-center justify-center animate-pulse">
                      <FileText className="w-16 h-16 text-angola-red opacity-50" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-3xl font-black text-white">Documento pronto para consulta</h3>
                      <p className="text-white/40 font-medium max-w-sm mx-auto">Este tipo de ficheiro requer visualização externa no teu dispositivo.</p>
                    </div>
                    <a href={content.file_url || content.fileUrl} target="_blank" rel="noopener noreferrer" className="bg-angola-red text-white px-10 py-5 rounded-2xl font-black text-lg hover:scale-105 transition-all shadow-2xl shadow-red-900/40 flex items-center gap-3">
                      <Download className="w-6 h-6" />
                      Baixar Ficheiro
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
              
              {/* Subtle watermark/branding overlay at bottom in reader */}
              <div className="absolute bottom-4 right-6 pointer-events-none opacity-20 filter invert font-black text-xs uppercase tracking-widest text-white flex items-center gap-2 select-none">
                <ShieldCheck className="w-3 h-3" />
                Protegido por BukiAngolano
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
