import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Video, Lock, CheckCircle2, CreditCard, Loader2, ArrowLeft, Download, User as UserIcon, ShieldCheck } from 'lucide-react';

export default function ContentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkingAccess, setCheckingAccess] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Check if user has access (free content or purchased bundle)
  const hasAccess = content?.isFree || profile?.purchasedBundleIds?.includes(content?.bundleId);

  useEffect(() => {
    const fetchContent = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'contents', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setContent({ id: docSnap.id, ...docSnap.data() });
        } else {
          navigate('/catalog');
        }
      } catch (error) {
        console.error("Error fetching content:", error);
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

      <div className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="bg-angola-red text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                {content.category}
              </span>
              <span className="bg-angola-yellow text-angola-black px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-angola-black/10">
                {content.type}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-angola-black leading-tight">
              {content.title}
            </h1>
            <p className="text-xl text-angola-black/60 font-medium">{content.subtitle}</p>
            
            <div className="flex items-center gap-6 text-angola-black/40 font-bold text-sm">
              <span className="flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                {content.author}
              </span>
              <span>•</span>
              <span>{content.createdAt ? new Date(content.createdAt.seconds * 1000).toLocaleDateString('pt-AO') : 'Recente'}</span>
            </div>
          </div>

          {/* Viewer Section */}
          <div className="space-y-6">
            <div className="bg-white p-2 rounded-[2.5rem] shadow-2xl border border-angola-black/5 overflow-hidden">
              <div className="aspect-video bg-slate-50 rounded-[2rem] overflow-hidden relative group">
                {hasAccess ? (
                  <iframe 
                    src={`https://drive.google.com/file/d/${content.fileIdPrimary}/preview`} 
                    className="w-full h-full border-none"
                    title="Content Viewer"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center space-y-6">
                    <div className="bg-slate-100 p-8 rounded-full">
                      <Lock className="w-16 h-16 text-angola-black/20" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black text-angola-black">Conteúdo Bloqueado</h3>
                      <p className="text-angola-black/40 max-w-sm mx-auto">Este material faz parte de um pacote premium. Desbloqueia para ter acesso completo.</p>
                    </div>
                    <button 
                      onClick={handleUnlock}
                      className="bg-angola-red text-white px-12 py-4 rounded-2xl font-bold shadow-xl shadow-red-900/20 hover:scale-105 transition-all"
                    >
                      Desbloquear Pacote - 2.000 Kz
                    </button>
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
                <a 
                  href={`https://drive.google.com/file/d/${content.fileIdPrimary}/view`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-angola-black text-white py-5 rounded-2xl font-black hover:bg-angola-red transition-all shadow-xl"
                >
                  <Download className="w-5 h-5" />
                  Baixar Ficheiro
                </a>
                <p className="text-[10px] text-center text-angola-black/30 font-bold italic">
                  * Se o link falhar, tenta a réplica de segurança.
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
    </div>
  );
}
