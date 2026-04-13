import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Search, BookOpen, ShieldCheck, CreditCard, ArrowRight, Loader2 } from 'lucide-react';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '../firebase';
import TccCard from '../components/TccCard';

export default function Home() {
  const [tccs, setTccs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchTccs = async () => {
      try {
        const q = query(collection(db, 'tccs'), limit(4));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTccs(data);
      } catch (error) {
        console.error("Error fetching TCCs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTccs();
  }, []);

  return (
    <div className="pb-20">
      {/* Hero Section */}
      <section className="relative min-h-[600px] flex items-center bg-[#F8F9FA] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full grid lg:grid-cols-2 gap-12 items-center py-20">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8 z-10"
          >
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.1] tracking-tight">
                Faz <span className="text-angola-red">trabalhos</span> com qualidade na <span className="text-angola-black">Buki</span>
              </h1>
              <p className="text-xl text-slate-600 max-w-lg leading-relaxed">
                Eleva a tua carreira de forma imaginável sem sair do mesmo lugar! Acede aos melhores TCCs e monografias de Angola.
              </p>
            </div>
            
            <div className="flex items-center gap-6">
              <Link 
                to="/catalog" 
                className="bg-[#00BFA5] text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-[#00A892] transition-all flex items-center gap-2 group shadow-lg shadow-[#00BFA5]/20"
              >
                Encontre Trabalhos
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <div className="hidden sm:flex flex-col border-l-2 border-slate-200 pl-6">
                <span className="text-slate-900 font-bold text-lg">Formadores</span>
                <span className="text-angola-red font-medium text-sm">Práticos & Disciplinados</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative hidden lg:block"
          >
            <div className="relative z-10 rounded-[2rem] overflow-hidden shadow-2xl border-8 border-white">
              <img 
                src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=800" 
                alt="Estudante Angolana" 
                className="w-full h-[500px] object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            {/* Decorative elements */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-angola-yellow/20 rounded-full blur-3xl -z-10" />
            <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-angola-red/10 rounded-full blur-3xl -z-10" />
            <div className="absolute top-1/2 -right-4 w-12 h-12 border-4 border-indigo-500 rounded-full animate-bounce" />
          </motion.div>
        </div>
      </section>

      {/* Search Bar Section */}
      <section className="max-w-4xl mx-auto -mt-10 relative z-20 px-4">
        <div className="bg-white p-4 rounded-2xl shadow-2xl border border-slate-100 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
            <input 
              type="text"
              placeholder="O que desejas pesquisar hoje? (Ex: Marketing, IA, Direito...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-4 py-5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-angola-red outline-none text-lg font-medium"
            />
          </div>
          <button className="bg-angola-red text-white px-10 py-5 rounded-xl font-bold text-lg hover:bg-red-700 transition-all shadow-lg shadow-red-900/20">
            Pesquisar
          </button>
        </div>
      </section>

      {/* Catalog Preview Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24 space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Trabalhos em Destaque</h2>
            <p className="text-slate-500 font-medium">Os materiais mais procurados pelos estudantes angolanos.</p>
          </div>
          <Link to="/catalog" className="text-angola-red font-bold flex items-center gap-2 hover:underline">
            Ver catálogo completo
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-angola-red animate-spin" />
            <p className="text-slate-500 font-medium">Carregando catálogo...</p>
          </div>
        ) : tccs.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {tccs.map(tcc => (
              <TccCard key={tcc.id} tcc={tcc} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
            <p className="text-slate-500 text-lg">Nenhum trabalho disponível no momento.</p>
          </div>
        )}
      </section>

      {/* Trust Badges */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-32 grid md:grid-cols-3 gap-12">
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
            desc: "Desbloqueia o conteúdo e acede diretamente no Google Drive."
          }
        ].map((feature, i) => (
          <div key={i} className="flex gap-6 items-start">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 shrink-0">
              {feature.icon}
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900">{feature.title}</h3>
              <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

