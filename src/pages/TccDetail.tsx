import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Lock, CheckCircle2, CreditCard, Loader2, ArrowLeft, Download, User as UserIcon } from 'lucide-react';

export default function TccDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [tcc, setTcc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkingAccess, setCheckingAccess] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const hasAccess = profile?.purchasedTccs?.includes(id);

  useEffect(() => {
    const fetchTcc = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'tccs', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setTcc({ id: docSnap.id, ...docSnap.data() });
        } else {
          navigate('/catalog');
        }
      } catch (error) {
        console.error("Error fetching TCC:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTcc();
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
      const response = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.uid, tccId: tcc.id })
      });
      const session = await response.json();
      
      // Redirect to the mock checkout URL provided by the backend
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
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para o catálogo
      </button>

      <div className="grid md:grid-cols-3 gap-12">
        {/* Left: Info */}
        <div className="md:col-span-2 space-y-8">
          <div className="space-y-4">
            <span className="bg-angola-red/10 text-angola-red px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              {tcc.category}
            </span>
            <h1 className="text-4xl font-black text-angola-black leading-tight">
              {tcc.title}
            </h1>
            <div className="flex items-center gap-4 text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <UserIcon className="w-4 h-4" />
                {tcc.author}
              </span>
              <span>•</span>
              <span>{new Date(tcc.createdAt).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Resumo do Trabalho</h2>
            <p className="text-slate-600 leading-relaxed whitespace-pre-line">
              {tcc.description}
            </p>
          </div>

          {/* Preview Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Amostra Grátis</h2>
              <span className="text-slate-400 text-sm font-medium">Páginas 1-5 de 45</span>
            </div>
            
            <div className="relative aspect-[3/4] bg-slate-200 rounded-3xl overflow-hidden border border-slate-300 shadow-inner group">
              <iframe 
                src={tcc.previewLink} 
                className="w-full h-full border-none"
                title="Preview TCC"
              />
              
              {!hasAccess && (
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-900/90 via-slate-900/60 to-transparent flex flex-col items-center justify-end pb-12 px-8 text-center space-y-6">
                  <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
                    <Lock className="w-8 h-8 text-white mb-2 mx-auto" />
                    <p className="text-white font-bold text-lg">Conteúdo Completo Bloqueado</p>
                    <p className="text-white/70 text-sm">Adquira este trabalho para ter acesso aos arquivos completos no Google Drive.</p>
                  </div>
                  <button 
                    onClick={handleUnlock}
                    className="bg-angola-red text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-red-700 transition-all shadow-xl shadow-red-900/20 w-full max-w-xs"
                  >
                    Desbloquear Agora - {tcc.price.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 sticky top-24">
            <div className="space-y-2">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Preço do Trabalho</p>
              <p className="text-4xl font-black text-angola-black">{tcc.price.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3 text-sm text-slate-600">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>Acesso vitalício ao PDF completo</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-slate-600">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>Link direto via Google Drive</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-slate-600">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>Suporte via e-mail</span>
              </div>
            </div>

            {hasAccess ? (
              <a 
                href={`https://drive.google.com/open?id=${tcc.driveFileId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-emerald-700 text-white py-4 rounded-2xl font-bold hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-900/10"
              >
                <Download className="w-5 h-5" />
                Baixar Completo
              </a>
            ) : (
              <button 
                onClick={handleUnlock}
                className="w-full flex items-center justify-center gap-2 bg-angola-red text-white py-4 rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-900/10"
              >
                <CreditCard className="w-5 h-5" />
                Comprar Agora
              </button>
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
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 space-y-6">
                <div className="text-center space-y-2">
                  <div className="bg-indigo-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="w-8 h-8 text-indigo-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Finalizar Compra</h3>
                  <p className="text-slate-500">Você está prestes a desbloquear o conteúdo completo.</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Trabalho:</span>
                    <span className="font-bold text-slate-900 truncate max-w-[200px]">{tcc.title}</span>
                  </div>
                  <div className="flex justify-between text-lg font-black border-t border-slate-200 pt-3">
                    <span className="text-slate-900">Total:</span>
                    <span className="text-indigo-600">R$ {tcc.price.toFixed(2)}</span>
                  </div>
                </div>

                <button 
                  onClick={processPayment}
                  disabled={checkingAccess}
                  className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checkingAccess ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>Confirmar Pagamento</>
                  )}
                </button>
                
                {!checkingAccess && (
                  <button 
                    onClick={() => setShowPaymentModal(false)}
                    className="w-full text-slate-400 font-bold hover:text-slate-600 transition-colors"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
