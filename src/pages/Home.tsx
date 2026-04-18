import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Search, BookOpen, ShieldCheck, CreditCard, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ContentCard from '../components/ContentCard';

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1522202222206-91f6f0b8e0e4?auto=format&fit=crop&q=80&w=800"
];

export default function Home() {
  const [contents, setContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchContents = async () => {
      try {
        const { data, error } = await supabase
          .from('contents')
          .select('*')
          .eq('status', 'approved')
          .limit(4);
        
        if (error) throw error;
        setContents(data || []);
      } catch (error) {
        console.error("Error fetching contents from Supabase:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchContents();
  }, []);

  return (
    <div className="pb-20">
      {/* Hero Section */}
      <section className="relative min-h-[500px] md:min-h-[600px] flex items-center bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full grid lg:grid-cols-2 gap-12 items-center py-12 md:py-20 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8 z-10 flex flex-col items-center lg:items-start"
          >
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-angola-red/10 text-angola-red px-4 py-2 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest mb-2 md:mb-4">
                <BookOpen className="w-3 h-3" />
                <span>Impacto Nacional</span>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-slate-900 leading-[1.05] tracking-tight">
                A maior <span className="text-angola-red">biblioteca digital</span> Angolana
              </h1>
              <p className="text-lg md:text-xl text-slate-600 max-w-lg leading-relaxed font-medium">
                Explora livros, cursos, aulas, vídeos e materiais organizados e partilhados de estudantes para estudantes para facilitar os teus estudos.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full sm:w-auto">
              <Link 
                to="/catalog" 
                className="w-full sm:w-auto bg-[#00BFA5] text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-[#00A892] transition-all flex items-center justify-center gap-2 group shadow-lg shadow-[#00BFA5]/20"
              >
                Encontre Trabalhos
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link 
                to="/upload" 
                className="w-full sm:w-auto bg-angola-black text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group shadow-lg shadow-black/10"
              >
                Partilha também.
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative hidden lg:block h-[500px]"
          >
            <div className="relative z-10 rounded-[2rem] overflow-hidden shadow-2xl border-8 border-white h-full w-full">
              <AnimatePresence mode="wait">
                <motion.img 
                  key={currentSlide}
                  src={HERO_IMAGES[currentSlide]} 
                  alt={`Estudante Angolana ${currentSlide + 1}`} 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </AnimatePresence>
              
              {/* Slider indicators */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {HERO_IMAGES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      currentSlide === i ? 'bg-white w-6' : 'bg-white/40'
                    }`}
                  />
                ))}
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-angola-yellow/20 rounded-full blur-3xl -z-10" />
            <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-angola-red/10 rounded-full blur-3xl -z-10" />
            <div className="absolute top-1/2 -right-4 w-12 h-12 border-4 border-indigo-500 rounded-full animate-bounce z-20" />
          </motion.div>
        </div>
      </section>

      {/* Search Bar Section */}
      <section className="max-w-4xl mx-auto -mt-6 md:-mt-10 relative z-20 px-4">
        <div className="bg-white p-3 md:p-4 rounded-2xl shadow-2xl border border-slate-100 flex flex-col md:flex-row gap-3 md:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 md:w-6 md:h-6 text-slate-400" />
            <input 
              type="text"
              placeholder="Pesquisar materiais..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 md:pl-14 pr-4 py-4 md:py-5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-angola-red outline-none text-base md:text-lg font-medium"
            />
          </div>
          <button className="bg-angola-red text-white px-8 md:px-10 py-4 md:py-5 rounded-xl font-bold md:text-lg hover:bg-red-700 transition-all shadow-lg shadow-red-900/20">
            Pesquisar
          </button>
        </div>
      </section>

      {/* Catalog Preview Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 md:mt-24 space-y-8 md:space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Trabalhos em Destaque</h2>
            <p className="text-slate-500 font-medium text-sm md:text-base">Os materiais mais procurados pelos estudantes angolanos.</p>
          </div>
          <Link to="/catalog" className="text-angola-red font-bold flex items-center justify-center gap-2 hover:underline">
            Ver catálogo completo
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse space-y-4">
                <div className="h-48 bg-slate-100 rounded-3xl" />
                <div className="h-4 w-24 bg-slate-100 rounded" />
                <div className="h-6 w-full bg-slate-100 rounded" />
                <div className="h-12 w-full bg-slate-100 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : contents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {contents.map(content => (
              <ContentCard key={content.id} content={content} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
            <p className="text-slate-500 text-lg">Nenhum conteúdo disponível no momento.</p>
          </div>
        )}
      </section>

      {/* Trust Badges */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24 md:mt-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {[
            {
              icon: <BookOpen className="w-8 h-8 text-angola-red" />,
              title: "Qualidade Académica",
              desc: "Trabalhos revisados e aprovados pelas melhores instituições de Angola."
            },
            {
              icon: <ShieldCheck className="w-8 h-8 text-emerald-600" />,
              title: "Compra Segura",
              desc: "Sistema de pagamento via Multicaixa e transferência com confirmação rápida."
            },
            {
              icon: <CreditCard className="w-8 h-8 text-angola-yellow" />,
              title: "Acesso Imediato",
              desc: "Desbloqueia o conteúdo e acede diretamente após a confirmação."
            }
          ].map((feature, i) => (
            <div key={i} className="flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 shrink-0">
                {feature.icon}
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed text-sm md:text-base">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}

