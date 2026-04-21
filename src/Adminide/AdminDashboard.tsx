import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Users, 
  Files, 
  TrendingUp, 
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    users: 0,
    contents: 0,
    pending: 0,
    totalSales: 0
  });
  const [latestActions, setLatestActions] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      // Fetch users count
      const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
      // Fetch content count
      const { count: contentCount } = await supabase.from('contents').select('*', { count: 'exact', head: true });
      
      setStats({
        users: userCount || 0,
        contents: contentCount || 0,
        pending: 0, // Injected logic for pending approvals if implemented
        totalSales: 0
      });

      // Latest content
      const { data: recentContent } = await supabase
        .from('contents')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      setLatestActions(recentContent || []);
    };

    fetchStats();
  }, []);

  const cards = [
    { label: 'Utilizadores', value: stats.users, icon: Users, color: 'bg-indigo-500' },
    { label: 'Documentos', value: stats.contents, icon: Files, color: 'bg-emerald-500' },
    { label: 'Aguardando', value: stats.pending, icon: Clock, color: 'bg-amber-500' },
    { label: 'Vendas Totais', value: `${stats.totalSales} Kz`, icon: TrendingUp, color: 'bg-rose-500' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Painel de Controlo</h1>
          <p className="text-slate-400 font-bold">Gerencia a atividade global da BukiAngolano</p>
        </div>
        <button 
          onClick={() => navigate('/admin/upload')}
          className="px-6 py-3 bg-angola-black text-white rounded-2xl font-black shadow-lg shadow-black/10 hover:scale-105 transition-transform flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Subir Conteúdo
        </button>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">{card.label}</p>
              <h3 className="text-3xl font-black text-slate-900">{card.value}</h3>
            </div>
            <div className={`${card.color} p-4 rounded-2xl text-white`}>
              <card.icon className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden text-angola-black">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-black text-xl">Uploads Recentes</h3>
            <button className="text-angola-red font-black text-sm flex items-center gap-1">
              Ver Todos <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {latestActions.map((content, idx) => (
              <div key={content.id || idx} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                    <Files className="w-6 h-6 text-slate-400" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900">{content.title}</h4>
                    <p className="text-sm text-slate-400 font-bold">{content.author} • {content.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                    Aprovado
                  </span>
                  <p className="text-xs text-slate-400 font-bold">
                    {new Date(content.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
            {latestActions.length === 0 && (
              <div className="p-12 text-center text-slate-400 font-bold">
                Nenhuma atividade recente.
              </div>
            )}
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 text-angola-black">
          <h3 className="font-black text-xl mb-6">Estado Real-time</h3>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="font-black text-sm">Base de dados Supabase</p>
                <p className="text-xs text-slate-400 font-bold">Conectado e Operacional</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="font-black text-sm">Firebase Auth</p>
                <p className="text-xs text-slate-400 font-bold">Autenticação Ativa</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="font-black text-sm">Storage do Drive</p>
                <p className="text-xs text-slate-400 font-bold">85% em uso</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
