import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  signInWithGoogle, 
  auth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile
} from '../firebase';
import { 
  ConfirmationResult
} from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Chrome, 
  AlertCircle, 
  Loader2, 
  Mail, 
  Phone, 
  Lock, 
  ArrowRight,
  ChevronLeft,
  User as UserIcon,
  Smartphone
} from 'lucide-react';

type AuthMethod = 'google' | 'email' | 'phone';
type EmailMode = 'signin' | 'signup';

export default function Login() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState<AuthMethod>('google');
  
  // Email state
  const [emailMode, setEmailMode] = useState<EmailMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // Phone state
  const [phoneNumber, setPhoneNumber] = useState('+244');
  const [verificationCode, setVerificationCode] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (emailMode === 'signin') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
      }
    } catch (error: any) {
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setError(null);
    setLoading(true);
    
    try {
      // Clear previous verifier if any, to avoid "already rendered" errors
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }

      const container = document.getElementById('recaptcha-container');
      if (!container) throw new Error("Recaptcha container not found");

      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, container, {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved, proceeding...
        }
      });

      const result = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifierRef.current);
      setConfirmationResult(result);
      setShowOtp(true);
    } catch (error: any) {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult || loading) return;
    
    setError(null);
    setLoading(true);
    try {
      await confirmationResult.confirm(verificationCode);
    } catch (error: any) {
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthError = (error: any) => {
    console.error("Auth error:", error);
    let message = "Ocorreu um erro na autenticação.";
    
    switch (error.code) {
      case 'auth/popup-blocked':
        message = "O popup de login foi bloqueado. Por favor, permita popups.";
        break;
      case 'auth/unauthorized-domain':
        message = `Domínio (${window.location.hostname}) não autorizado no Firebase. Adicione este domínio em 'Autenticação' -> 'Configurações' -> 'Domínios autorizados' no Console do Firebase.`;
        break;
      case 'auth/invalid-email':
        message = "E-mail inválido.";
        break;
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        message = "E-mail ou palavra-passe incorretos.";
        break;
      case 'auth/email-already-in-use':
        message = "Este e-mail já está em uso.";
        break;
      case 'auth/weak-password':
        message = "A palavra-passe deve ter pelo menos 6 caracteres.";
        break;
      case 'auth/invalid-phone-number':
        message = "Número de telefone inválido. Use o formato internacional (ex: +244900000000).";
        break;
      case 'auth/too-many-requests':
        message = "Bloqueado por excesso de tentativas. IMPORTANTE: Verifique se a 'SMS Region Policy' no Console do Firebase permite envios para Angola (por padrão novas contas bloqueiam todas as regiões).";
        break;
      case 'auth/code-expired':
        message = "O código SMS expirou. Tente novamente.";
        break;
      case 'auth/invalid-verification-code':
        message = "Código de verificação incorreto.";
        break;
      case 'auth/captcha-check-failed':
        message = "Falha na verificação do reCAPTCHA. Tente novamente.";
        break;
      case 'auth/billing-not-enabled-for-sms':
        message = "O envio de SMS requer que o faturamento esteja habilitado ou que você use números de teste no Console do Firebase.";
        break;
      default:
        message = `Erro (${error.code || 'unknown'}): ${error.message}`;
    }
    setError(message);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-slate-200 shadow-2xl w-full max-w-xl space-y-8"
      >
        <div className="text-center space-y-4">
          <div className="bg-angola-red w-16 h-16 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg shadow-red-200">
            <BookOpen className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            {method === 'google' ? 'Bem-vindo à Buki' : method === 'email' ? 'Acesso via E-mail' : 'Acesso via Telemóvel'}
          </h1>
          <p className="text-slate-500 max-w-sm mx-auto">
            Escolha o método mais conveniente para acessar sua conta estudantil.
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 text-sm"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </motion.div>
        )}

        <div className="space-y-6">
          {/* Method Selector */}
          {method === 'google' && (
            <div className="grid gap-4">
              <button 
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full h-16 flex items-center justify-center gap-4 bg-white border-2 border-slate-200 rounded-2xl font-bold text-slate-700 hover:border-angola-red hover:text-angola-red transition-all group disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Chrome className="w-6 h-6" />}
                Entrar com Google
              </button>

              <div className="flex items-center gap-4 py-2">
                <div className="h-px bg-slate-200 flex-1" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ou use</span>
                <div className="h-px bg-slate-200 flex-1" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setMethod('email')}
                  className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-slate-100 rounded-2xl hover:border-slate-300 transition-all font-bold text-slate-600 text-sm"
                >
                  <Mail className="w-5 h-5" />
                  E-mail
                </button>
                <button 
                  onClick={() => setMethod('phone')}
                  className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-slate-100 rounded-2xl hover:border-slate-300 transition-all font-bold text-slate-600 text-sm"
                >
                  <Smartphone className="w-5 h-5" />
                  Telemóvel
                </button>
              </div>
            </div>
          )}

          {/* Email Auth Form */}
          {method === 'email' && (
            <motion.form 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleEmailAuth}
              className="space-y-4"
            >
              <button 
                type="button"
                onClick={() => setMethod('google')}
                className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors text-sm font-bold mb-4"
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar
              </button>

              <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
                <button 
                  type="button"
                  onClick={() => setEmailMode('signin')}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${emailMode === 'signin' ? 'bg-white shadow text-angola-red' : 'text-slate-500'}`}
                >
                  Entrar
                </button>
                <button 
                  type="button"
                  onClick={() => setEmailMode('signup')}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${emailMode === 'signup' ? 'bg-white shadow text-angola-red' : 'text-slate-500'}`}
                >
                  Criar Conta
                </button>
              </div>

              {emailMode === 'signup' && (
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Nome Completo"
                    required
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-angola-red transition-all border-none"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="email"
                  placeholder="E-mail acadêmico"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-angola-red transition-all border-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="password"
                  placeholder="Sua palavra-passe"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-angola-red transition-all border-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-angola-red text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-red-900/10 hover:bg-red-700 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : emailMode === 'signin' ? 'Acessar Conta' : 'Registrar Agora'}
                {!loading && <ArrowRight className="w-5 h-5" />}
              </button>
            </motion.form>
          )}

          {/* Phone Auth Form */}
          {method === 'phone' && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <button 
                type="button"
                onClick={() => {
                  if (showOtp) setShowOtp(false);
                  else setMethod('google');
                }}
                className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors text-sm font-bold mb-4"
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar
              </button>

              {!showOtp ? (
                <form onSubmit={handlePhoneSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Número de Angola</label>
                    <div className="relative">
                      <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type="tel"
                        placeholder="+244 9XX XXX XXX"
                        required
                        className="w-full pl-12 pr-4 py-5 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-angola-red transition-all border-none text-xl font-bold tracking-wider"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                      />
                    </div>
                  </div>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xl disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Enviar Código SMS'}
                    {!loading && <ArrowRight className="w-5 h-5" />}
                  </button>
                  <div id="recaptcha-container"></div>
                  <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100">
                    <p className="text-[10px] text-slate-500 text-center leading-tight">
                      <b>Nota importante:</b> Certifique-se de que a "SMS Region Policy" no Console do Firebase permite envios para Angola.
                    </p>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div className="text-center space-y-2">
                    <p className="font-bold text-slate-700">Verificação Enviada</p>
                    <p className="text-sm text-slate-500">Introduza o código de 6 dígitos enviado para {phoneNumber}</p>
                  </div>
                  <input 
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    required
                    className="w-full tracking-[1.5em] text-center py-5 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-angola-red border-none text-2xl font-black placeholder:tracking-normal placeholder:text-slate-200"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                  />
                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-xl disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Confirmar e Entrar'}
                  </button>
                  
                  <div className="text-center">
                    <button 
                      type="button"
                      onClick={() => setShowOtp(false)}
                      className="text-xs font-bold text-slate-400 hover:text-angola-red transition-colors"
                      disabled={loading}
                    >
                      Não recebeu o código? Reenviar SMS
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          )}
        </div>

        <p className="text-xs text-slate-400 leading-relaxed text-center">
          Ao entrar, você concorda com nossos <br />
          <span className="underline cursor-pointer">Termos de Serviço</span> e <span className="underline cursor-pointer">Política de Privacidade</span>.
        </p>
      </motion.div>
    </div>
  );
}
