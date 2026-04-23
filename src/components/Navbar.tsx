import { useState, useRef, useEffect, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logout } from '../firebase';
import { User, LogOut, LayoutDashboard, Mail, Phone, Grid, ChevronDown, Search, Menu, X, ArrowRight, Loader2, Book } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cacheService } from '../lib/cache';
import Logo from './Logo';

const CATEGORIES = [
  'Marketing', 
  'Inteligência Artificial', 
  'Direito', 
  'Engenharia', 
  'Medicina', 
  'Economia', 
  'Artes',
  'Psicologia',
  'História',
  'Biologia',
  'Arquitetura',
  'Informática',
  'Sociologia',
  'Geografia',
  'Matemática',
  'Física',
  'Química'
];

export default function Navbar() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  
  // Search State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      const trimmedTerm = searchTerm.trim().toLowerCase();
      if (trimmedTerm.length >= 2) {
        // Try to get from cache first
        const cached = cacheService.get<any[]>(`search_${trimmedTerm}`);
        if (cached) {
          setSearchResults(cached);
          return;
        }

        setIsSearching(true);
        try {
          const { data } = await supabase
            .from('contents')
            .select('id, title, subtitle, thumbnail_url, type')
            .eq('status', 'approved')
            .or(`title.ilike.%${searchTerm}%,subtitle.ilike.%${searchTerm}%`)
            .limit(5);
          
          if (data) {
            setSearchResults(data);
            cacheService.set(`search_${trimmedTerm}`, data);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(searchTerm)}`);
      setIsSearchOpen(false);
      setSearchTerm('');
    }
  };

  return (
    <header className="w-full sticky top-0 z-50">
      {/* Top Bar */}
      <div className="bg-slate-900 text-white py-1.5 md:py-2 px-4 sm:px-6 lg:px-8 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex flex-row justify-between items-center text-[10px] font-bold tracking-widest uppercase">
          <div className="flex items-center gap-3 sm:gap-6">
            <a href="mailto:suport.bukar@gmail.com" className="flex items-center gap-2 hover:text-angola-yellow transition-colors">
              <Mail className="w-3 h-3 text-angola-yellow" />
              <span className="hidden sm:inline">suport.bukar@gmail.com</span>
              <span className="sm:hidden">Email</span>
            </a>
            <a href="tel:+244946372562" className="flex items-center gap-2 hover:text-angola-yellow transition-colors shrink-0">
              <Phone className="w-3 h-3 text-angola-yellow" />
              <span className="hidden sm:inline">+244 946 372 562</span>
              <span className="sm:hidden">Ligar</span>
            </a>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {user ? (
              <div className="flex items-center gap-2 sm:gap-4">
                <span className="text-angola-yellow hidden xs:inline">{user.displayName?.split(' ')[0] || 'Olá'}</span>
                {isAdmin && (
                  <Link to="/admin" className="bg-white/10 px-2 py-0.5 rounded text-[9px] hover:bg-white/20 transition-colors border border-white/10">Admin</Link>
                )}
                <Link to="/dashboard" className="bg-angola-red px-2 py-0.5 rounded text-[9px] hover:bg-red-700 transition-colors shadow-lg">Painel</Link>
              </div>
            ) : (
              <Link 
                to="/login" 
                className="bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-[4px] border border-white/20 transition-all font-black text-[9px]"
              >
                Entrar
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

              <div 
                className="hidden lg:flex items-center border-l border-slate-200 pl-8 ml-4 relative"
                onMouseEnter={() => setIsCategoriesOpen(true)}
                onMouseLeave={() => setIsCategoriesOpen(false)}
              >
                <button className="flex items-center gap-2 text-slate-700 font-bold hover:text-angola-red transition-colors group py-4">
                  <Grid className="w-5 h-5" />
                  Categoria
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isCategoriesOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Categories Dropdown Menu (Desktop) */}
                {isCategoriesOpen && (
                  <div className="absolute top-full left-0 w-[600px] bg-white shadow-2xl rounded-b-[2.5rem] border-x border-b border-slate-100 p-8 grid grid-cols-3 gap-x-8 gap-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    {CATEGORIES.map(category => (
                      <Link 
                        key={category}
                        to={`/catalog?category=${category}`}
                        className="text-sm font-bold text-slate-600 hover:text-angola-red transition-colors flex items-center gap-2 group"
                        onClick={() => setIsCategoriesOpen(false)}
                      >
                        <div className="w-1.5 h-1.5 bg-slate-200 rounded-full group-hover:bg-angola-red transition-colors"></div>
                        {category}
                      </Link>
                    ))}
                    <div className="col-span-3 pt-4 border-t border-slate-50 mt-4">
                      <Link 
                        to="/catalog" 
                        className="text-xs font-black text-angola-red uppercase tracking-widest hover:underline"
                        onClick={() => setIsCategoriesOpen(false)}
                      >
                        Ver Todas as Disciplinas →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-angola-red font-bold border-b-2 border-angola-red pb-1">Home</Link>
              <Link to="/catalog" className="text-slate-600 hover:text-angola-red font-bold transition-colors">Biblioteca</Link>
              <Link to="/upload" className="text-slate-600 hover:text-angola-red font-bold transition-colors">Partilhar</Link>
              <Link to="/dashboard" className="text-slate-600 hover:text-angola-red font-bold transition-colors">Meus Itens</Link>
              
              <div className="flex items-center gap-4 border-l border-slate-200 pl-8">
                <button 
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2 text-slate-400 hover:text-angola-red transition-colors"
                >
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
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-slate-400 hover:text-angola-red transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
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
          <div className="md:hidden bg-white border-t border-slate-100 shadow-2xl absolute top-full left-0 w-full z-50 overflow-y-auto max-h-[calc(100vh-110px)] animate-in slide-in-from-top duration-300">
            <div className="p-6 space-y-4 pb-12">
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
                {isAdmin && (
                  <Link 
                    to="/admin"
                    onClick={() => setIsMenuOpen(false)}
                    className="px-4 py-3 bg-red-50 text-angola-red font-black rounded-xl transition-all flex items-center justify-between border border-red-100"
                  >
                    Painel Administrativo
                    <ChevronDown className="w-4 h-4 -rotate-90" />
                  </Link>
                )}
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

                {/* Mobile Categories Section */}
                <div className="pt-4 border-t border-slate-50 mt-2">
                  <p className="px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Categorias</p>
                  <div className="flex overflow-x-auto pb-4 gap-2 px-4 no-scrollbar">
                    {CATEGORIES.map(category => (
                      <Link 
                        key={category}
                        to={`/catalog?category=${category}`}
                        onClick={() => setIsMenuOpen(false)}
                        className="whitespace-nowrap p-3 bg-slate-50 text-[11px] font-bold text-slate-600 rounded-xl hover:text-angola-red transition-colors shrink-0"
                      >
                        {category}
                      </Link>
                    ))}
                  </div>
                </div>
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

      {/* Global Search Overlay - Robust Full Screen Implementation */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/98 backdrop-blur-xl animate-in fade-in duration-300 flex flex-col items-center pt-6 md:pt-20 px-4">
          <div className="w-full max-w-4xl">
            <div className="flex justify-between items-center mb-6 md:mb-12">
              <Logo />
              <button 
                onClick={() => setIsSearchOpen(false)}
                className="p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all active:scale-90"
              >
                <X className="w-6 h-6 md:w-8 md:h-8" />
              </button>
            </div>

            <form onSubmit={handleSearchSubmit} className="relative mb-6 md:mb-10">
              <Search className="absolute left-6 md:left-8 top-1/2 -translate-y-1/2 w-6 h-6 md:w-10 md:h-10 text-white/20" />
              <input 
                ref={searchInputRef}
                type="text"
                placeholder="Pesquisar manuais, autores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border-2 border-white/10 rounded-2xl md:rounded-[2.5rem] py-5 md:py-8 pl-14 md:pl-24 pr-8 text-white text-base md:text-3xl outline-none focus:border-angola-red focus:bg-white/10 transition-all font-medium placeholder:text-white/10 shadow-2xl"
              />
              {isSearching && (
                <div className="absolute right-6 md:right-8 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-6 h-6 md:w-8 md:h-8 text-angola-red animate-spin" />
                </div>
              )}
            </form>

            <div className="max-h-[65vh] overflow-y-auto custom-scrollbar pb-10">
              {searchResults.length > 0 ? (
                <div className="animate-in slide-in-from-bottom-4 duration-500">
                  <p className="text-white/20 text-[10px] font-black uppercase tracking-widest ml-4 mb-4">Resultados Encontrados</p>
                  <div className="bg-white/5 rounded-[2rem] md:rounded-[3rem] p-2 md:p-4 border border-white/5 backdrop-blur-2xl">
                    {searchResults.map((item) => (
                      <Link 
                        key={item.id}
                        to={`/content/${item.id}`}
                        onClick={() => setIsSearchOpen(false)}
                        className="flex items-center gap-3 md:gap-5 p-3 md:p-5 hover:bg-white/10 rounded-2xl md:rounded-[2rem] transition-all group"
                      >
                        <div className="w-12 h-12 md:w-20 md:h-20 bg-slate-800 rounded-xl md:rounded-2xl overflow-hidden shrink-0 border border-white/5">
                          {item.thumbnail_url ? (
                            <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/10">
                              <Book className="w-6 h-6 md:w-10 md:h-10" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-bold text-sm md:text-xl truncate group-hover:text-angola-red transition-colors">{item.title}</h4>
                          <p className="text-white/40 text-[8px] md:text-sm truncate uppercase font-black tracking-widest mt-1">{item.subtitle || item.type}</p>
                        </div>
                        <ArrowRight className="w-5 h-5 md:w-8 md:h-8 text-white/0 group-hover:text-angola-red group-hover:translate-x-1 transition-all" />
                      </Link>
                    ))}
                    <button 
                      onClick={handleSearchSubmit}
                      className="w-full mt-2 p-5 text-center text-angola-red font-black text-[10px] md:text-sm hover:underline tracking-widest uppercase"
                    >
                      Ver todos os resultados →
                    </button>
                  </div>
                </div>
              ) : searchTerm.length >= 2 && !isSearching ? (
                <div className="p-10 md:p-24 text-center bg-white/5 rounded-[2.5rem] md:rounded-[4rem] border border-white/5 animate-in zoom-in-95 duration-300">
                  <div className="bg-white/10 w-14 h-14 md:w-28 md:h-28 rounded-full flex items-center justify-center mx-auto mb-8">
                    <Search className="w-8 h-8 md:w-14 md:h-14 text-white/20" />
                  </div>
                  <p className="text-white font-black text-xl md:text-3xl mb-3">Sem resultados diretos</p>
                  <p className="text-white/30 text-xs md:text-lg max-w-sm mx-auto font-medium">Tenta pesquisar por termos mais genéricos ou consulta as categorias sugeridas.</p>
                </div>
              ) : searchTerm.length === 0 ? (
                <div className="animate-in slide-in-from-top-4 duration-500">
                  <p className="text-white/20 text-[10px] font-black uppercase tracking-widest ml-4 mb-6">Disciplinas Populares</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    {CATEGORIES.slice(0, 12).map(cat => (
                      <Link
                        key={cat}
                        to={`/catalog?category=${cat}`}
                        onClick={() => setIsSearchOpen(false)}
                        className="p-4 md:p-8 bg-white/5 border border-white/5 rounded-2xl md:rounded-[2.5rem] text-white/50 hover:text-white hover:bg-angola-red hover:border-angola-red transition-all text-center text-[10px] md:text-xs font-black uppercase tracking-widest group shadow-lg shadow-black/20"
                      >
                        <span className="group-hover:scale-110 block transition-transform">{cat}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

