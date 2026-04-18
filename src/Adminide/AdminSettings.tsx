import { useState } from 'react';
import { 
  Save, 
  Bell, 
  Shield, 
  Database, 
  Eye, 
  Lock,
  Globe,
  CircleSlash,
  Smartphone,
  CheckCircle2
} from 'lucide-react';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('geral');
  const [isSaving, setIsSaving] = useState(false);

  const tabs = [
    { id: 'geral', name: 'Geral', icon: Globe },
    { id: 'seguranca', name: 'Segurança', icon: Shield },
    { id: 'notificacoes', name: 'Notificações', icon: Bell },
    { id: 'banco', name: 'Base de Dados', icon: Database },
  ];

  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1500);
  };

  return (
    <div className="max-w-4xl space-y-8 text-angola-black relative">
      {showSuccess && (
        <div className="fixed top-8 right-8 z-[100] bg-emerald-500 text-white px-6 py-4 rounded-2xl font-black shadow-2xl flex items-center gap-3 animate-in slide-in-from-right duration-300">
          <CheckCircle2 className="w-6 h-6" /> Configurações guardadas!
        </div>
      )}
      {/* Tab Header */}
      <div className="flex gap-2 bg-white p-2 rounded-2xl border border-slate-200 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-sm transition-all ${
              activeTab === tab.id 
              ? 'bg-angola-red text-white shadow-lg shadow-angola-red/20' 
              : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.name}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-8">
        {activeTab === 'geral' && (
          <div className="space-y-8">
            <section className="space-y-6">
              <h4 className="font-black text-lg flex items-center gap-2">
                <Globe className="w-5 h-5 text-angola-red" /> Configurações do Site
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Nome da Plataforma</label>
                  <input type="text" defaultValue="BukiAngolano" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-angola-red" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">URL Base</label>
                  <input type="text" defaultValue="https://bukiangolano.com" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-angola-red" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Idioma Padrão</label>
                  <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-angola-red">
                    <option>Português (AO)</option>
                    <option>Inglês (US)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Moeda Ativa</label>
                  <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-angola-red">
                    <option>Kwanza (AKZ)</option>
                    <option>Dólar (USD)</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="space-y-6 pt-8 border-t border-slate-100">
              <h4 className="font-black text-lg flex items-center gap-2">
                <Lock className="w-5 h-5 text-angola-red" /> Acesso e Registo
              </h4>
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer group">
                  <div>
                    <p className="font-black">Permitir novos registos</p>
                    <p className="text-xs text-slate-400 font-bold italic tracking-tight">Qualquer pessoa pode criar uma conta no sistema</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-6 h-6 rounded-md accent-angola-red" />
                </label>
                <label className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer group">
                  <div>
                    <p className="font-black">Verificação por email obrigatória</p>
                    <p className="text-xs text-slate-400 font-bold italic tracking-tight">Utilizadores devem verificar o email antes de interagir</p>
                  </div>
                  <input type="checkbox" className="w-6 h-6 rounded-md accent-angola-red" />
                </label>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'seguranca' && (
          <div className="p-12 text-center text-slate-400">
            <Shield className="w-16 h-16 mx-auto mb-4 opacity-10" />
            <p className="font-bold italic">Configurações de segurança avançada estão bloqueadas pelo arquivo .env</p>
          </div>
        )}

        <div className="mt-12 flex justify-end gap-3 pt-8 border-t border-slate-100">
          <button className="px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-colors">
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-8 py-3 bg-angola-red text-white rounded-2xl font-black hover:bg-angola-red/90 transition-colors shadow-lg shadow-angola-red/20 flex items-center gap-2 min-w-[140px] justify-center"
          >
            {isSaving ? (
              <CircleSlash className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" /> Guardar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
