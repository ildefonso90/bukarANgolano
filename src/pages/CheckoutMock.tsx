import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { CreditCard, ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react';

export default function CheckoutMock() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  
  const userId = searchParams.get('userId');
  const tccId = searchParams.get('tccId');

  const handlePayment = async () => {
    setStatus('processing');
    
    try {
      // Simulate calling the webhook/confirmation endpoint
      const response = await fetch('/api/payments/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, tccId })
      });
      
      if (response.ok) {
        setTimeout(() => {
          setStatus('success');
        }, 2000);
      }
    } catch (error) {
      console.error("Payment confirmation error:", error);
      setStatus('idle');
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-2xl w-full max-w-md space-y-8"
      >
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-black text-slate-900">Checkout Seguro</h1>
          <p className="text-slate-500 text-sm">Ambiente de teste simulado</p>
        </div>

        {status === 'success' ? (
          <div className="text-center space-y-6 py-4">
            <div className="bg-emerald-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900">Pagamento Confirmado!</h2>
              <p className="text-slate-500">O conteúdo foi desbloqueado na sua conta.</p>
            </div>
            <button 
              onClick={() => navigate(`/tcc/${tccId}`)}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-indigo-600 transition-all"
            >
              Voltar para o Trabalho
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">ID do Usuário:</span>
                  <span className="font-mono text-[10px] text-slate-400">{userId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">ID do TCC:</span>
                  <span className="font-mono text-[10px] text-slate-400">{tccId}</span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Número do Cartão (Simulado)</label>
                <div className="relative">
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    disabled
                    value="**** **** **** 4242"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-400 font-mono"
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={handlePayment}
              disabled={status === 'processing'}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-100 disabled:opacity-50"
            >
              {status === 'processing' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processando...
                </>
              ) : (
                <>Pagar Agora</>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-slate-400 text-xs font-medium">
              <ShieldCheck className="w-4 h-4" />
              Pagamento 100% Seguro & Criptografado
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
