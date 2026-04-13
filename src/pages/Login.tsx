import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signInWithGoogle } from '../firebase';
import { motion } from 'motion/react';
import { BookOpen, Chrome } from 'lucide-react';

export default function Login() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-12 rounded-[2.5rem] border border-slate-200 shadow-2xl w-full max-w-md text-center space-y-10"
      >
        <div className="space-y-4">
          <div className="bg-indigo-600 w-20 h-20 rounded-3xl flex items-center justify-center text-white mx-auto shadow-xl shadow-indigo-200">
            <BookOpen className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Bem-vindo de volta</h1>
          <p className="text-slate-500">Acesse sua conta para gerenciar seus trabalhos e compras.</p>
        </div>

        <button 
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-4 bg-white border-2 border-slate-200 py-4 rounded-2xl font-bold text-slate-700 hover:border-indigo-600 hover:text-indigo-600 transition-all group"
        >
          <Chrome className="w-6 h-6 text-indigo-600 group-hover:scale-110 transition-transform" />
          Entrar com Google
        </button>

        <p className="text-xs text-slate-400 leading-relaxed">
          Ao entrar, você concorda com nossos <br />
          <span className="underline cursor-pointer">Termos de Serviço</span> e <span className="underline cursor-pointer">Política de Privacidade</span>.
        </p>
      </motion.div>
    </div>
  );
}
