import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Search, 
  Trash2, 
  ExternalLink, 
  Filter,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Loader2,
  Pencil,
  X,
  Save
} from 'lucide-react';

export default function ContentManagement() {
  const [contents, setContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Edit Modal State
  const [editingContent, setEditingContent] = useState<any>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  
  // Deletion Modal State
  const [deletingContent, setDeletingContent] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [editForm, setEditForm] = useState({
    title: '',
    author: '',
    subtitle: '',
    category: '',
    type: '',
    status: '',
    is_free: true
  });

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('contents')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setContents(data);
    setLoading(false);
  };

  const handleEdit = (content: any) => {
    setEditingContent(content);
    setEditForm({
      title: content.title || '',
      author: content.author || '',
      subtitle: content.subtitle || '',
      category: content.category || '',
      type: content.type || '',
      status: content.status || 'approved',
      is_free: content.is_free ?? true
    });
  };

  const saveEdit = async () => {
    if (!editingContent) return;
    setSavingEdit(true);
    try {
      const { error } = await supabase
        .from('contents')
        .update({
          title: editForm.title,
          author: editForm.author,
          subtitle: editForm.subtitle,
          category: editForm.category,
          type: editForm.type,
          status: editForm.status,
          is_free: editForm.is_free
        })
        .eq('id', editingContent.id);

      if (error) throw error;

      setContents(contents.map(c => c.id === editingContent.id ? { ...c, ...editForm } : c));
      setEditingContent(null);
    } catch (error: any) {
      console.error('Erro ao editar:', error);
    } finally {
      setSavingEdit(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingContent) return;
    setIsDeleting(true);
    
    try {
      // 1. Remover do Supabase Storage
      const filesToRemove = [];
      if (deletingContent.storage_path) filesToRemove.push(deletingContent.storage_path);
      if (deletingContent.thumbnail_path) filesToRemove.push(deletingContent.thumbnail_path);
      
      if (filesToRemove.length > 0) {
        await supabase.storage.from('uploads').remove(filesToRemove);
      }

      // 2. Remover da Base de Dados
      const { error: dbError } = await supabase
        .from('contents')
        .delete()
        .eq('id', deletingContent.id);
      
      if (dbError) throw dbError;

      // 3. Atualizar Estado Local
      setContents(contents.filter(c => c.id !== deletingContent.id));
      setDeletingContent(null);
    } catch (error: any) {
      console.error('Falha crítica na eliminação:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = contents.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between text-angola-black">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Procurar documentos ou autores..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-angola-red outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-colors">
            <Filter className="w-5 h-5" /> Filtros
          </button>
          <button 
            onClick={fetchContents}
            className="flex-1 md:flex-none px-6 py-3 bg-angola-red text-white rounded-2xl font-black hover:bg-angola-red/90 transition-colors shadow-lg shadow-angola-red/20"
          >
            Sincronizar
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden text-angola-black">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 italic">
                <th className="px-6 py-4 font-black text-xs uppercase text-slate-400">Título / Autor</th>
                <th className="px-6 py-4 font-black text-xs uppercase text-slate-400">Categoria</th>
                <th className="px-6 py-4 font-black text-xs uppercase text-slate-400">Acesso</th>
                <th className="px-6 py-4 font-black text-xs uppercase text-slate-400">Data</th>
                <th className="px-6 py-4 font-black text-xs uppercase text-slate-400">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-bold">
              {filtered.map((c, idx) => (
                <tr key={`content-${c.id || idx}`} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-black text-slate-900 group-hover:text-angola-red transition-colors">{c.title}</p>
                    <p className="text-xs text-slate-400">{c.author}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-tight">
                      {c.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {c.is_free ? (
                      <span className="text-emerald-500 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Gratuito
                      </span>
                    ) : (
                      <span className="text-amber-500 flex items-center gap-1">
                        <Loader2 className="w-4 h-4" /> Pago (2000 Kz)
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-400 text-sm">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleEdit(c)}
                        className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                        title="Editar Detalhes"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                      <a 
                        href={`/content/${c.id}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-2 text-slate-400 hover:text-angola-red hover:bg-angola-red/5 rounded-lg transition-all"
                        title="Ver Online"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                      <button 
                        onClick={() => setDeletingContent(c)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Eliminar"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loading && (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-angola-red animate-spin mx-auto mb-4" />
            <p className="font-bold text-slate-400 italic">Carregando conteúdos...</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="p-12 text-center text-slate-400">
            <XCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="font-bold italic">Nenhum conteúdo encontrado.</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-angola-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-angola-black">Editar Conteúdo</h3>
              <button 
                onClick={() => setEditingContent(null)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 uppercase">Título</label>
                <input 
                  type="text" 
                  className="w-full p-3 bg-slate-50 border border-transparent focus:border-angola-red rounded-xl outline-none font-bold"
                  value={editForm.title}
                  onChange={e => setEditForm({...editForm, title: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 uppercase">Autor</label>
                <input 
                  type="text" 
                  className="w-full p-3 bg-slate-50 border border-transparent focus:border-angola-red rounded-xl outline-none font-bold"
                  value={editForm.author}
                  onChange={e => setEditForm({...editForm, author: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 uppercase">Resumo (Subtítulo)</label>
                <textarea 
                  className="w-full p-3 bg-slate-50 border border-transparent focus:border-angola-red rounded-xl outline-none font-bold h-24 resize-none"
                  value={editForm.subtitle}
                  onChange={e => setEditForm({...editForm, subtitle: e.target.value})}
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-black text-slate-400 uppercase">Categoria</label>
                  <input 
                    type="text" 
                    className="w-full p-3 bg-slate-50 border border-transparent focus:border-angola-red rounded-xl outline-none font-bold"
                    value={editForm.category}
                    onChange={e => setEditForm({...editForm, category: e.target.value})}
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-black text-slate-400 uppercase">Tipo</label>
                  <select 
                    className="w-full p-3 bg-slate-50 border border-transparent focus:border-angola-red rounded-xl outline-none font-bold appearance-none cursor-pointer"
                    value={editForm.type}
                    onChange={e => setEditForm({...editForm, type: e.target.value})}
                  >
                    <option value="pdf">PDF</option>
                    <option value="manual">Manual</option>
                    <option value="book">Livro</option>
                    <option value="video">Vídeo</option>
                    <option value="course">Curso</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-black text-slate-400 uppercase">Estado (Moderação)</label>
                  <select 
                    className="w-full p-3 bg-slate-50 border border-transparent focus:border-angola-red rounded-xl outline-none font-bold appearance-none cursor-pointer"
                    value={editForm.status}
                    onChange={e => setEditForm({...editForm, status: e.target.value})}
                  >
                    <option value="approved">Aprovado</option>
                    <option value="pending">Pendente</option>
                    <option value="rejected">Rejeitado</option>
                    <option value="hidden">Oculto</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-400 uppercase text-center block">Acesso</label>
                  <div className="flex items-center gap-2 pt-2 justify-center">
                    <button 
                      onClick={() => setEditForm({...editForm, is_free: !editForm.is_free})}
                      className={`relative w-12 h-6 rounded-full transition-colors ${editForm.is_free ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${editForm.is_free ? 'left-7' : 'left-1'}`} />
                    </button>
                    <span className="text-xs font-black uppercase text-slate-600">
                      {editForm.is_free ? 'Grátis' : 'Pago'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 flex gap-3">
              <button 
                onClick={() => setEditingContent(null)}
                className="flex-1 px-6 py-3 bg-white border border-slate-200 rounded-xl font-black text-slate-400 hover:bg-slate-100 transition-colors"
                disabled={savingEdit}
              >
                Cancelar
              </button>
              <button 
                onClick={saveEdit}
                disabled={savingEdit}
                className="flex-1 px-6 py-3 bg-angola-red text-white rounded-xl font-black shadow-lg shadow-angola-red/20 hover:bg-angola-red/90 transition-colors flex items-center justify-center gap-2"
              >
                {savingEdit ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {savingEdit ? 'Guardando...' : 'Guardar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-angola-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto rotate-3">
                <Trash2 className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-angola-black">Tens a certeza?</h3>
                <p className="text-slate-400 font-bold leading-relaxed">
                  Estás prestes a eliminar <span className="text-angola-black">"{deletingContent.title}"</span>. Esta ação é irreversível e apagará os ficheiros do storage.
                </p>
              </div>
              <div className="flex flex-col gap-3 pt-4">
                <button 
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="w-full py-4 bg-red-500 text-white rounded-2xl font-black shadow-xl shadow-red-500/20 hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                >
                  {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sim, eliminar tudo'}
                </button>
                <button 
                  onClick={() => setDeletingContent(null)}
                  disabled={isDeleting}
                  className="w-full py-4 bg-slate-100 text-slate-400 rounded-2xl font-black hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
