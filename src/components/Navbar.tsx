import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logout } from '../firebase';
import { User, LogOut, LayoutDashboard, Mail, Phone, Grid, ChevronDown, Search, Menu, X } from 'lucide-react';
import Logo from './Logo';

export default function Navbar() {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="w-full sticky top-0 z-50">
      {/* Top Bar - Hidden on very small screens or stacked */}
      <div className="bg-slate-900 text-white py-2 px-4 sm:px-6 lg:px-8 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center text-[10px] font-bold tracking-widest uppercase gap-2 sm:gap-0">
          <div className="flex items-center gap-4 sm:gap-6">
            <a href="mailto:suport.bukar@gmail.com" className="flex items-center gap-2 hover:text-angola-yellow transition-colors">
              <Mail className="w-3 h-3 text-angola-yellow" />
              <span className="hidden xs:inline">Email: suport.bukar@gmail.com</span>
              <span className="xs:inline sm:hidden">Email</span>
            </a>
            <a href="tel:+244946372562" className="flex items-center gap-2 hover:text-angola-yellow transition-colors">
              <Phone className="w-3 h-3 text-angola-yellow" />
              Tel: +244 946 372 562
            </a>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-angola-yellow">Olá, {user.displayName?.split(' ')[0] || user.email?.split('@')[0]}</span>
                <Link to="/dashboard" className="bg-angola-red px-3 py-1 rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-900/20">Painel</Link>
              </div>
            ) : (
              <Link 
                to="/login" 
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-1.5 rounded-lg border border-white/20 transition-all font-black text-[10px]"
              >
                Acessar / Registar
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-8">
              <Link to="/" onClick={() => setIsMenuOpen(false)}>
                <Logo />
              </Link>

              <div className="hidden lg:flex items-center border-l border-slate-200 pl-8 ml-4">
                <button className="flex items-center gap-2 text-slate-700 font-bold hover:text-angola-red transition-colors group">
                  <Grid className="w-5 h-5" />
                  Categoria
                  <ChevronDown className="w-4 h-4 group-hover:rotate-180 transition-transform" />
                </button>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-angola-red font-bold border-b-2 border-angola-red pb-1">Home</Link>
              <Link to="/catalog" className="text-slate-600 hover:text-angola-red font-bold transition-colors">Biblioteca</Link>
              <Link to="/upload" className="text-slate-600 hover:text-angola-red font-bold transition-colors">Partilhar</Link>
              <Link to="/dashboard" className="text-slate-600 hover:text-angola-red font-bold transition-colors">Meus Itens</Link>
              
              <div className="flex items-center gap-4 border-l border-slate-200 pl-8">
                <button className="p-2 text-slate-400 hover:text-angola-red transition-colors">
                  <Search className="w-5 h-5" />
                </button>
                {user && (
                  <button 
                    onClick={logout}
                    className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                    title="Sair"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-4">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-slate-600 hover:text-angola-red transition-colors"
                aria-label="Toggle Menu"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 shadow-2xl absolute top-full left-0 w-full z-50 overflow-hidden animate-in slide-in-from-top duration-300">
            <div className="p-6 space-y-4">
              {user && (
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl mb-6">
                  <div className="bg-angola-red w-10 h-10 rounded-full flex items-center justify-center text-white font-black">
                    {user.displayName?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-bold text-slate-900 leading-none truncate">{user.displayName || 'Estudante'}</p>
                    <p className="text-[10px] text-slate-500 mt-1 truncate">{user.email}</p>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 gap-1">
                {[
                  { name: 'Início', path: '/' },
                  { name: 'Biblioteca Digital', path: '/catalog' },
                  { name: 'Partilhar Material', path: '/upload' },
                  { name: 'Meus Itens', path: '/dashboard' }
                ].map((item) => (
                  <Link 
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className="px-4 py-3 text-slate-700 font-bold hover:bg-slate-50 hover:text-angola-red rounded-xl transition-all flex items-center justify-between group"
                  >
                    {item.name}
                    <ChevronDown className="w-4 h-4 -rotate-90 opacity-40 group-hover:opacity-100 transition-all" />
                  </Link>
                ))}
              </div>

              {user ? (
                <button 
                  onClick={() => { logout(); setIsMenuOpen(false); }}
                  className="w-full flex items-center justify-center gap-2 p-4 text-red-600 font-black border-2 border-red-50 rounded-2xl hover:bg-red-50 mt-4 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  Sair da Conta
                </button>
              ) : (
                <Link 
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 p-4 bg-angola-red text-white font-black rounded-2xl shadow-xl shadow-red-900/20 mt-4"
                >
                  Entrar na Buki
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

