import { useState } from 'react';
import { Youtube, Plus, CheckCircle, AlertCircle, Video } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES } from '../constants';
import { supabase } from '../lib/supabase';

export default function AdminYouTubeCourse() {
  const { user } = useAuth();
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [status, setStatus] = useState<'idle' | 'saving' | 'completed'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleSaveCourse = async () => {
    if (!url.trim() || !title.trim() || !user) return;
    
    setStatus('saving');
    setError(null);

    try {
      const { data, error: dbError } = await supabase
        .from('contents')
        .insert([{
          title,
          subtitle: description,
          author: 'Admin',
          type: 'course',
          category,
          is_free: true,
          thumbnail_url: `https://img.youtube.com/vi/${getYouTubeId(url)}/maxresdefault.jpg`,
          user_id: user.uid,
          status: 'approved',
          metadata: {
            youtube_url: url,
            is_youtube_course: true
          }
        }])
        .select();

      if (dbError) {
        throw new Error(`Erro ao salvar: ${dbError.message}`);
      }
      
      setStatus('completed');
      // Reset form
      setUrl('');
      setTitle('');
      setDescription('');
      setCategory(CATEGORIES[0]);
    } catch (err: any) {
      setError(err.message);
      setStatus('idle');
    }
  };

  const getYouTubeId = (url: string) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length == 11) ? match[7] : '';
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <div className="bg-red-600 p-2 rounded-xl text-white">
              <Youtube className="w-8 h-8" />
            </div>
            Criador de Cursos YouTube
          </h1>
          <p className="text-slate-500 font-bold mt-1">Adiciona cursos do YouTube de forma simples e rápida.</p>
        </div>

        {status === 'completed' && (
          <button 
            onClick={() => setStatus('idle')}
            className="px-6 py-3 bg-emerald-500 text-white rounded-2xl font-black shadow-lg hover:scale-105 transition-all flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5" /> Criar Outro
          </button>
        )}
      </div>

      {status === 'completed' ? (
        <div className="bg-white p-20 rounded-[3rem] border border-slate-200 shadow-2xl text-center space-y-8">
          <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12" />
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-slate-900">Curso Publicado com Sucesso!</h2>
            <p className="text-xl text-slate-500 font-medium max-w-xl mx-auto">
              O curso "{title}" já está disponível na biblioteca digital.
            </p>
          </div>
          <button 
            onClick={() => setStatus('idle')}
            className="px-8 py-4 bg-angola-black text-white rounded-2xl font-black hover:scale-105 transition-all"
          >
            Criar Novo Curso
          </button>
        </div>
      ) : (
        <div className="bg-white p-12 rounded-[2.5rem] border border-slate-200 shadow-xl space-y-8">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900">Configura o Teu Curso</h2>
              <p className="text-slate-500 font-medium">Preenche os detalhes do curso do YouTube.</p>
            </div>

            {/* YouTube URL */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">URL do YouTube</label>
              <div className="relative group">
                <Youtube className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within:text-red-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="https://www.youtube.com/watch?v=..." 
                  className="w-full pl-16 pr-6 py-5 bg-slate-50 border-2 border-transparent focus:border-red-500 rounded-[2rem] outline-none transition-all font-bold text-slate-800 placeholder:text-slate-400"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  disabled={status !== 'idle'}
                />
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Título do Curso</label>
              <input 
                type="text" 
                placeholder="Ex: Curso Completo de Python" 
                className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent focus:border-red-500 rounded-[2rem] outline-none transition-all font-bold text-slate-800 placeholder:text-slate-400"
                value={title}
                onChange={e => setTitle(e.target.value)}
                disabled={status !== 'idle'}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Descrição</label>
              <textarea 
                placeholder="Descreve o conteúdo do curso..." 
                className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent focus:border-red-500 rounded-[2rem] outline-none transition-all font-bold text-slate-800 placeholder:text-slate-400 min-h-[120px]"
                value={description}
                onChange={e => setDescription(e.target.value)}
                disabled={status !== 'idle'}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Categoria</label>
              <select 
                className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent focus:border-red-500 rounded-[2rem] outline-none transition-all font-bold text-slate-800"
                value={category}
                onChange={e => setCategory(e.target.value)}
                disabled={status !== 'idle'}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {error && (
              <div className="bg-red-50 text-red-500 p-4 rounded-2xl flex items-center gap-3 font-bold text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}

            <button 
              onClick={handleSaveCourse}
              disabled={!url.trim() || !title.trim() || status !== 'idle'}
              className="w-full py-5 bg-angola-black text-white rounded-3xl font-black shadow-xl shadow-black/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale"
            >
              {status === 'saving' ? (
                <>
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Video className="w-6 h-6" />
                  Publicar Curso
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
