import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logout } from '../firebase';
import { User, LogOut, LayoutDashboard, Mail, Phone, Grid, ChevronDown, Search } from 'lucide-react';
import Logo from './Logo';

export default function Navbar() {
  const { user } = useAuth();

  return (
    <header className="w-full sticky top-0 z-50">
      {/* Top Bar */}
      <div className="bg-slate-900 text-white py-2 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center text-[11px] font-medium tracking-wider uppercase">
          <div className="flex items-center gap-6">
            <a href="mailto:suport.bukar@gmail.com" className="flex items-center gap-2 hover:text-angola-yellow transition-colors">
              <Mail className="w-3 h-3 text-angola-yellow" />
              Email: suport.bukar@gmail.com
            </a>
            <a href="tel:+244947098616" className="flex items-center gap-2 hover:text-angola-yellow transition-colors">
              <Phone className="w-3 h-3 text-angola-yellow" />
              Tel: +244 947 098 616
            </a>
          </div>
          <div className="flex items-center gap-4 mt-2 sm:mt-0">
            {user ? (
              <span className="text-angola-yellow">Olá, {user.displayName || user.email}</span>
            ) : (
              <Link to="/login" className="hover:text-angola-yellow transition-colors">Acessar / Registar</Link>
            )}
            <Link to="/dashboard" className="bg-angola-red px-3 py-1 rounded hover:bg-red-700 transition-colors">Painel</Link>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-8">
              <Link to="/">
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
            
            <div className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-angola-red font-bold border-b-2 border-angola-red pb-1">Home</Link>
              <Link to="/catalog" className="text-slate-600 hover:text-angola-red font-bold transition-colors">Biblioteca</Link>
              <Link to="/upload" className="text-slate-600 hover:text-angola-red font-bold transition-colors">Partilhar</Link>
              <Link to="/dashboard" className="text-slate-600 hover:text-angola-red font-bold transition-colors">Meus Itens</Link>
              
              <div className="relative group">
                <button className="flex items-center gap-1 text-slate-600 hover:text-angola-red font-bold transition-colors">
                  Páginas
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-4 border-l border-slate-200 pl-8">
                <button className="p-2 text-slate-400 hover:text-angola-red transition-colors">
                  <Search className="w-5 h-5" />
                </button>
                {user && (
                  <button 
                    onClick={logout}
                    className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}

