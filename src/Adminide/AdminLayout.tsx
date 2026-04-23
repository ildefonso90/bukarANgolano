import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  Files, 
  Users, 
  Settings, 
  LogOut, 
  ChevronRight,
  ShieldCheck,
  Globe,
  Lock,
  ArrowRight,
  AlertCircle,
  PlusCircle,
  Sparkles,
  MessageSquare,
  Youtube
} from 'lucide-react';

export default function AdminLayout() {
  const { user, isAdmin, isAdminAuthenticated, verifyAdminPassword, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate('/');
    }
  }, [user, isAdmin, loading, navigate]);

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-angola-red"></div>
      </div>
    );
  }

  if (!isAdmin) return null;

  // Secondary Authentication (Password)
  if (!isAdminAuthenticated) {
    const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      if (verifyAdminPassword(password)) {
        setError(false);
      } else {
        setError(true);
        setPassword('');
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200">
          <div className="p-10 space-y-8">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-angola-red/10 text-angola-red rounded-3xl flex items-center justify-center mx-auto rotate-6">
                <Lock className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-black text-angola-black tracking-tight">Área Restrita</h2>
              <p className="text-slate-400 font-bold">Inicia sessão no painel administrativo</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Senha de Acesso</label>
                <div className="relative">
                  <input 
                    type="password"
                    placeholder="Introduz a senha mestra..."
                    className={`w-full px-6 py-4 bg-slate-50 border-2 rounded-2xl font-bold outline-none transition-all ${
                      error ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-100 focus:border-angola-red focus:ring-angola-red/10'
                    }`}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(false);
                    }}
                    autoFocus
                  />
                  <button 
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-angola-red text-white rounded-xl shadow-lg shadow-angola-red/20 hover:scale-105 transition-transform"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
                {error && (
                  <div className="flex items-center gap-2 text-red-500 text-xs font-bold pl-1 animate-bounce">
                    <AlertCircle className="w-4 h-4" /> Senha incorreta. Tenta novamente.
                  </div>
                )}
              </div>
              
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 italic space-y-1">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Utilizador Activo</p>
                <p className="text-xs font-bold text-slate-600 truncate">{user?.email}</p>
              </div>
            </form>

            <button 
              onClick={() => navigate('/')}
              className="w-full text-slate-400 font-bold text-sm hover:text-angola-red transition-colors"
            >
              Voltar para o site
            </button>
          </div>
        </div>
      </div>
    );
  }

  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Assistente IA', path: '/admin/assistant', icon: MessageSquare },
    { name: 'Conteúdos', path: '/admin/content', icon: Files },
    { name: 'Carregar Ficheiro', path: '/admin/upload', icon: PlusCircle },
    { name: 'IA & Lote', path: '/admin/ia', icon: Sparkles },
    { name: 'Gerador de Cursos', path: '/admin/course-builder', icon: Youtube },
    { name: 'Utilizadores', path: '/admin/users', icon: Users },
    { name: 'Definições', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row overflow-x-hidden">
      {/* Mobile Header */}
      <div className="md:hidden bg-slate-900 border-b border-white/5 h-16 flex items-center justify-between px-6 sticky top-0 z-[60]">
        <Link to="/" className="flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-angola-red" />
          <span className="font-black text-lg text-white">Admin Ide</span>
        </Link>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 bg-white/10 text-white rounded-xl active:scale-90 transition-transform"
        >
          {isSidebarOpen ? <PlusCircle className="w-6 h-6 rotate-45 transition-transform" /> : <PlusCircle className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:sticky top-0 left-0 h-screen w-72 md:w-64 bg-slate-900 text-white shrink-0 z-[80] transition-transform duration-300 transform md:translate-x-0 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6 hidden md:block">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="bg-angola-red p-2 rounded-xl group-hover:rotate-12 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="font-black text-xl tracking-tight">Admin Ide</span>
          </Link>
        </div>

        <nav className="mt-6 px-4 space-y-2 overflow-y-auto max-h-[calc(100vh-250px)] custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all ${
                  isActive 
                  ? 'bg-angola-red text-white shadow-lg shadow-red-900/40' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  <span className="text-sm">{item.name}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4" />}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto p-4 md:p-6 space-y-2">
          {user && (
            <button 
              onClick={() => logout()}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl font-bold transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm">Sair da Conta</span>
            </button>
          )}
          
          <div className="hidden md:block bg-white/5 p-4 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
              <Globe className="w-3 h-3" />
              Sistema Online
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 bg-slate-50">
        <header className="bg-white border-b border-slate-200 h-16 md:h-20 flex items-center justify-between px-4 md:px-8 relative md:relative z-50">
          <div className="flex items-center gap-2 text-slate-400 font-bold overflow-hidden">
            <span className="text-slate-900 capitalize text-sm md:text-base truncate">
              {menuItems.find(i => i.path === location.pathname)?.name || 'Painel'}
            </span>
          </div>

          <div className="flex items-center gap-3 md:gap-4 shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-slate-900 leading-tight">{user?.displayName?.split(' ')[0] || 'Admin'}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user?.email}</p>
            </div>
            <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-100 rounded-lg md:rounded-xl flex items-center justify-center text-slate-400 border border-slate-200">
              <Users className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
        </header>

        <div className={location.pathname === '/admin/assistant' ? 'p-2 md:p-4 h-[calc(100vh-64px)] md:h-[calc(100vh-80px)] overflow-hidden' : 'p-4 md:p-8'}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
