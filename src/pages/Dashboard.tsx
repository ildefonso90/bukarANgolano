import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import TccCard from '../components/TccCard';
import { Loader2, BookOpen, Settings, Plus, Database } from 'lucide-react';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [purchasedTccs, setPurchasedTccs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    const fetchPurchases = async () => {
      if (!profile?.purchasedTccs?.length) {
        setLoading(false);
        return;
      }
      try {
        const q = query(collection(db, 'tccs'), where('__name__', 'in', profile.purchasedTccs));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPurchasedTccs(data);
      } catch (error) {
        console.error("Error fetching purchases:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPurchases();
  }, [profile]);

  const seedData = async () => {
    setSeeding(true);
    try {
      const mockTccs = [
        {
          title: "Inteligência Artificial na Educação: Impactos e Desafios",
          author: "Ana Silva",
          category: "Tecnologia",
          description: "Este trabalho analisa como a IA está transformando o ambiente escolar, focando em ferramentas de personalização do ensino e os dilemas éticos envolvidos.",
          previewLink: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
          driveFileId: "1-mock-id-1",
          price: 49.90,
          createdAt: new Date().toISOString()
        },
        {
          title: "Sustentabilidade Urbana: O Caso das Cidades Inteligentes",
          author: "Carlos Oliveira",
          category: "Arquitetura",
          description: "Uma investigação sobre o papel da tecnologia na criação de espaços urbanos mais sustentáveis e eficientes, com foco em mobilidade e energia.",
          previewLink: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
          driveFileId: "1-mock-id-2",
          price: 59.90,
          createdAt: new Date().toISOString()
        },
        {
          title: "Marketing Digital para Pequenas Empresas no Pós-Pandemia",
          author: "Mariana Costa",
          category: "Administração",
          description: "Estratégias práticas de marketing digital que ajudaram pequenos negócios a sobreviver e prosperar durante a crise sanitária global.",
          previewLink: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
          driveFileId: "1-mock-id-3",
          price: 39.90,
          createdAt: new Date().toISOString()
        }
      ];

      for (const tcc of mockTccs) {
        const id = Math.random().toString(36).substr(2, 9);
        await setDoc(doc(db, 'tccs', id), tcc);
      }
      alert("Dados semeados com sucesso! Recarregue a página.");
    } catch (error) {
      console.error("Error seeding data:", error);
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
            {profile?.displayName?.charAt(0) || user?.email?.charAt(0)}
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900">Olá, {profile?.displayName || 'Usuário'}</h1>
            <p className="text-slate-500">Bem-vindo à sua biblioteca pessoal.</p>
          </div>
        </div>

        {profile?.role === 'admin' && (
          <button 
            onClick={seedData}
            disabled={seeding}
            className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            Semear Dados (Admin)
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              Meus Trabalhos Adquiridos
            </h2>
            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">
              {purchasedTccs.length} itens
            </span>
          </div>

          {purchasedTccs.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-6">
              {purchasedTccs.map((tcc: any) => (
                <TccCard key={tcc.id} tcc={tcc} />
              ))}
            </div>
          ) : (
            <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-300 text-center space-y-4">
              <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                <Plus className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium">Você ainda não adquiriu nenhum trabalho.</p>
              <button className="text-indigo-600 font-bold hover:underline">Explorar catálogo agora</button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-slate-400" />
              Configurações
            </h2>
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">E-mail</p>
                <p className="text-slate-700 font-medium">{user?.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tipo de Conta</p>
                <p className="text-slate-700 font-medium capitalize">{profile?.role}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
