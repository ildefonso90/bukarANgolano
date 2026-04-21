import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { 
  Upload as UploadIcon, 
  FileText, 
  Book, 
  GraduationCap, 
  CheckCircle, 
  Loader2,
  AlertCircle,
  X,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

const TYPES = [
  { id: 'pdf', label: 'PDF / Documento', icon: FileText, disabled: false },
  { id: 'manual', label: 'Manual / Guia', icon: FileText, disabled: false },
  { id: 'book', label: 'Livro Digital', icon: Book, disabled: false },
];

export default function AdminUpload() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    type: 'pdf',
    author: '',
    category: CATEGORIES[0],
    isFree: true,
  });
  
  const [file, setFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !file || !coverFile) {
      setError('Por favor, seleciona tanto o ficheiro como a capa obrigatória.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const sanitizeFileName = (name: string) => {
        return name
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^\w.-]/g, '_')
          .replace(/_{2,}/g, '_');
      };

      // 1. Upload da Capa
      const sanitizedCoverName = sanitizeFileName(coverFile.name);
      const coverPath = `admin_uploads/${user.uid}/covers/${Date.now()}_${sanitizedCoverName}`;
      const { error: coverError } = await supabase.storage
        .from('uploads')
        .upload(coverPath, coverFile);

      if (coverError) throw coverError;

      const { data: { publicUrl: thumbnailUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(coverPath);

      // 2. Upload do Ficheiro Principal
      const sanitizedFileName = sanitizeFileName(file.name);
      const storagePath = `admin_uploads/${user.uid}/${Date.now()}_${sanitizedFileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(storagePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(storagePath);

      // 3. Salvar metadados
      const { error: dbError } = await supabase
        .from('contents')
        .insert([{
          title: formData.title,
          subtitle: formData.subtitle,
          author: formData.author,
          type: formData.type,
          category: formData.category,
          is_free: formData.isFree,
          file_url: publicUrl,
          thumbnail_url: thumbnailUrl,
          storage_path: storagePath,
          thumbnail_path: coverPath,
          storage_type: 'supabase',
          user_id: user.uid,
          status: 'approved', // Admin uploads are auto-approved
        }]);

      if (dbError) throw dbError;

      setStep(3); // Sucesso
    } catch (err: any) {
      console.error('Erro no upload Admin:', err);
      setError('Erro ao enviar conteúdo: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin/content')}
            className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors text-slate-400"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-angola-black">Novo Conteúdo</h1>
            <p className="text-slate-400 font-bold">Carregar novo documento diretamente para a plataforma</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        {error && (
          <div className="p-6 bg-red-50 border-b border-red-100 flex items-center gap-3 text-red-600 text-sm font-bold">
            <AlertCircle className="w-5 h-5" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-red-100 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="p-8 md:p-12">
          {step === 1 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Título do Documento</label>
                  <input 
                    type="text" 
                    className="w-full p-4 bg-slate-50 border border-transparent focus:border-angola-red rounded-2xl outline-none transition-all font-bold"
                    placeholder="Ex: Guia Completo de TCC"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Autor / Instituição</label>
                  <input 
                    type="text" 
                    className="w-full p-4 bg-slate-50 border border-transparent focus:border-angola-red rounded-2xl outline-none transition-all font-bold"
                    placeholder="Nome do autor original"
                    value={formData.author}
                    onChange={e => setFormData({...formData, author: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Resumo / Subtítulo</label>
                  <textarea 
                    className="w-full p-4 bg-slate-50 border border-transparent focus:border-angola-red rounded-2xl outline-none transition-all font-bold h-24 resize-none"
                    placeholder="Breve descrição do conteúdo..."
                    value={formData.subtitle}
                    onChange={e => setFormData({...formData, subtitle: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Categoria</label>
                  <select 
                    className="w-full p-4 bg-slate-50 border border-transparent focus:border-angola-red rounded-2xl outline-none transition-all font-bold appearance-none cursor-pointer"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Acesso</label>
                  <div className="flex bg-slate-50 p-1 rounded-2xl">
                    <button 
                      onClick={() => setFormData({...formData, isFree: true})}
                      className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${formData.isFree ? 'bg-white shadow text-emerald-600' : 'text-slate-400'}`}
                    >
                      Gratuito
                    </button>
                    <button 
                      onClick={() => setFormData({...formData, isFree: false})}
                      className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${!formData.isFree ? 'bg-white shadow text-amber-600' : 'text-slate-400'}`}
                    >
                      Pago (2000 Kz)
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button 
                  onClick={() => setStep(2)}
                  className="px-12 py-4 bg-angola-red text-white rounded-2xl font-black shadow-lg shadow-angola-red/20 hover:scale-105 transition-transform flex items-center gap-2"
                >
                  Continuar para Ficheiros <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-4">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Documento Principal (PDF)</label>
                  <div className={`border-2 border-dashed rounded-[2.5rem] p-10 flex flex-col items-center justify-center transition-all ${file ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-200 bg-slate-50'}`}>
                    <FileText className={`w-12 h-12 mb-4 ${file ? 'text-emerald-500' : 'text-slate-300'}`} />
                    {file ? (
                      <div className="text-center">
                        <p className="font-bold text-slate-900 truncate max-w-[200px]">{file.name}</p>
                        <p className="text-[10px] text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        <button onClick={() => setFile(null)} className="mt-4 text-red-500 font-bold text-xs underline">Remover</button>
                      </div>
                    ) : (
                      <div className="text-center space-y-4">
                        <input type="file" id="admin-file" className="hidden" accept=".pdf" onChange={e => setFile(e.target.files?.[0] || null)} />
                        <label htmlFor="admin-file" className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs cursor-pointer hover:bg-black transition-colors block">Selecionar PDF</label>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Capa (Imagem)</label>
                  <div className={`border-2 border-dashed rounded-[2.5rem] p-10 flex flex-col items-center justify-center transition-all ${coverFile ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-200 bg-slate-50'}`}>
                    {coverFile ? (
                      <div className="text-center space-y-4">
                         <div className="w-24 h-32 mx-auto rounded-lg overflow-hidden shadow-lg border-2 border-white">
                          <img src={URL.createObjectURL(coverFile)} alt="Capa" className="w-full h-full object-cover" />
                        </div>
                        <button onClick={() => setCoverFile(null)} className="text-red-500 font-bold text-xs underline">Mudar Capa</button>
                      </div>
                    ) : (
                      <div className="text-center space-y-4">
                        <UploadIcon className="w-12 h-12 mb-4 text-slate-300 mx-auto" />
                        <input type="file" id="admin-cover" className="hidden" accept="image/*" onChange={e => setCoverFile(e.target.files?.[0] || null)} />
                        <label htmlFor="admin-cover" className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs cursor-pointer hover:bg-black transition-colors block">Selecionar Capa</label>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-8 border-t border-slate-100">
                <button onClick={() => setStep(1)} className="text-slate-400 font-bold hover:text-angola-black transition-colors">Voltar atrás</button>
                <button 
                  onClick={handleUpload}
                  disabled={loading || !file || !coverFile}
                  className="px-12 py-5 bg-angola-black text-white rounded-2xl font-black shadow-xl hover:scale-105 transition-transform flex items-center gap-3 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle className="w-6 h-6" />}
                  {loading ? 'A Carregar...' : 'Publicar Conteúdo'}
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-20 space-y-8">
              <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto rotate-12">
                <CheckCircle className="w-12 h-12" />
              </div>
              <div className="space-y-2">
                <h2 className="text-4xl font-black text-angola-black">Publicado com Sucesso!</h2>
                <p className="text-slate-400 font-bold max-w-md mx-auto">O documento já está disponível no catálogo e aprovado automaticamente.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                <button onClick={() => navigate('/admin/content')} className="px-8 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black hover:bg-slate-200 transition-colors">Ver na Gestão</button>
                <button onClick={() => { setStep(1); setFormData({ ...formData, title: '', subtitle: '', author: '' }); setFile(null); setCoverFile(null); }} className="px-8 py-4 bg-angola-red text-white rounded-2xl font-black shadow-lg shadow-angola-red/20">Carregar Outro</button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
