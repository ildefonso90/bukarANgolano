import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Users, 
  Search, 
  Mail, 
  Shield, 
  MoreVertical,
  Calendar,
  Loader2
} from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setUsers(data);
    setLoading(false);
  };

  const filtered = users.filter(u => 
    (u.display_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (u.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between text-angola-black">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Procurar utilizadores por nome ou email..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-angola-red outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden text-angola-black">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 italic">
                <th className="px-6 py-4 font-black text-xs uppercase text-slate-400">Utilizador</th>
                <th className="px-6 py-4 font-black text-xs uppercase text-slate-400">Email</th>
                <th className="px-6 py-4 font-black text-xs uppercase text-slate-400">Role</th>
                <th className="px-6 py-4 font-black text-xs uppercase text-slate-400">Registo</th>
                <th className="px-6 py-4 font-black text-xs uppercase text-slate-400">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-bold">
              {filtered.map((u, idx) => (
                <tr key={`user-${u.id || idx}`} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-black">
                        {u.display_name?.charAt(0) || u.email?.charAt(0) || '?'}
                      </div>
                      <span className="font-black text-slate-900">{u.display_name || 'Sem nome'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                      <Mail className="w-4 h-4" />
                      {u.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {(import.meta.env.VITE_ADMIN_EMAILS || '').includes(u.email) ? (
                      <span className="bg-angola-red/10 text-angola-red px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-tight flex items-center gap-1 w-fit">
                        <Shield className="w-3 h-3" /> Admin
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-tight w-fit">
                        Estudante
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-400 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(u.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loading && (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-8 h-8 text-angola-red animate-spin mx-auto mb-4" />
            <p className="font-bold italic">Buscando utilizadores...</p>
          </div>
        )}
      </div>
    </div>
  );
}
