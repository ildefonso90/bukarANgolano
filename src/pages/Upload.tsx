import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';
import { Upload as UploadIcon, FileText, Video, Book, GraduationCap, CheckCircle, Loader2 } from 'lucide-react';

const CATEGORIES = ['Marketing', 'Inteligência Artificial', 'Direito', 'Engenharia', 'Medicina', 'Economia', 'Artes'];
const TYPES = [
  { id: 'pdf', label: 'PDF / Documento', icon: FileText, disabled: false },
  { id: 'video', label: 'Videoaula', icon: Video, disabled: true },
  { id: 'course', label: 'Curso Completo', icon: Book, disabled: true },
  { id: 'lesson', label: 'Aula Avulsa', icon: GraduationCap, disabled: true },
  { id: 'manual', label: 'Manual / Guia', icon: FileText, disabled: false },
  { id: 'book', label: 'Livro Digital', icon: Book, disabled: false },
];

export default function Upload() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    type: 'pdf',
    author: '',
    category: CATEGORIES[0],
    isFree: true,
  });
  
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !file) return;

    // 1. Validações de Tipo e Tamanho
    const allowedTypes = ['pdf', 'manual', 'book'];
    const isAllowedType = allowedTypes.includes(formData.type);
    
    // Supabase permite ficheiros maiores, mas vamos manter um limite razoável (20MB)
    const isUnderLimit = file.size <= 20 * 1024 * 1024; 

    if (!isAllowedType) {
      alert('Este tipo de conteúdo (Vídeos/Cursos) está em desenvolvimento. Por agora, apenas aceitamos documentos.');
      return;
    }

    if (!isUnderLimit) {
      alert('O ficheiro é demasiado grande. O limite para documentos no plano gratuito é de 20MB.');
      return;
    }

    setLoading(true);
    try {
      // 2. Upload para Supabase Storage
      const storagePath = `${user.uid}/${Date.now()}_${file.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(storagePath, file);

      if (uploadError) throw uploadError;

      // 3. Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(storagePath);

      // 4. Salvar metadados no Supabase
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
          storage_path: storagePath,
          storage_type: 'supabase',
          user_id: user.uid,
          status: 'approved',
        }]);

      if (dbError) throw dbError;

      setStep(3); // Sucesso
    } catch (error: any) {
      console.error('Erro no upload Supabase:', error);
      alert('Erro ao enviar conteúdo: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-angola-black mb-4">Inicia sessão para partilhar conteúdo</h2>
        <button onClick={() => navigate('/login')} className="bg-angola-red text-white px-6 py-2 rounded-lg font-bold">
          Ir para Login
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-angola-black/5">
        <div className="bg-angola-red p-8 text-white">
          <h1 className="text-3xl font-black">Partilha o Teu Conhecimento</h1>
          <p className="opacity-80">Ajuda a construir o maior ecossistema estudantil de Angola.</p>
        </div>

        <div className="p-8">
          {step === 1 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="bg-angola-yellow text-angola-black w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
                Detalhes do Conteúdo
              </h2>
              
              <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-angola-black/60">Título do Trabalho</label>
                  <input 
                    type="text" 
                    required
                    className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-angola-red rounded-2xl outline-none transition-all"
                    placeholder="Ex: Introdução à Macroeconomia"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-angola-black/60">Autor / Instituição</label>
                  <input 
                    type="text" 
                    required
                    className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-angola-red rounded-2xl outline-none transition-all"
                    placeholder="Teu nome ou da tua faculdade"
                    value={formData.author}
                    onChange={e => setFormData({...formData, author: e.target.value})}
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-bold text-angola-black/60">Subtítulo / Descrição Curta</label>
                  <input 
                    type="text" 
                    className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-angola-red rounded-2xl outline-none transition-all"
                    placeholder="Breve resumo do que o aluno vai encontrar"
                    value={formData.subtitle}
                    onChange={e => setFormData({...formData, subtitle: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-angola-black/60">Categoria</label>
                  <select 
                    className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-angola-red rounded-2xl outline-none transition-all appearance-none"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-angola-black/60">Tipo de Conteúdo</label>
                  <div className="grid grid-cols-2 gap-2">
                    {TYPES.map(t => (
                      <button
                        key={t.id}
                        type="button"
                        disabled={t.disabled}
                        onClick={() => !t.disabled && setFormData({...formData, type: t.id})}
                        className={`p-3 rounded-xl border-2 flex flex-col items-start gap-1 text-xs font-bold transition-all relative ${
                          t.disabled 
                          ? 'opacity-50 cursor-not-allowed bg-slate-100 border-transparent text-slate-400'
                          : formData.type === t.id 
                            ? 'border-angola-red bg-angola-red/5 text-angola-red' 
                            : 'border-transparent bg-slate-50 text-angola-black/60 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <t.icon className="w-4 h-4" />
                          {t.label}
                        </div>
                        {t.disabled && (
                          <span className="text-[8px] uppercase bg-slate-200 px-2 py-0.5 rounded-full">
                            Brevemente
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2 p-6 bg-angola-yellow/10 rounded-3xl border-2 border-angola-yellow/20">
                  <h3 className="font-bold text-angola-black mb-4">Modelo de Acesso</h3>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, isFree: true})}
                      className={`flex-1 p-4 rounded-2xl border-2 font-bold transition-all ${
                        formData.isFree 
                        ? 'border-angola-red bg-white text-angola-red shadow-lg' 
                        : 'border-transparent bg-white/50 text-angola-black/40'
                      }`}
                    >
                      Grátis para Todos
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, isFree: false})}
                      className={`flex-1 p-4 rounded-2xl border-2 font-bold transition-all ${
                        !formData.isFree 
                        ? 'border-angola-red bg-white text-angola-red shadow-lg' 
                        : 'border-transparent bg-white/50 text-angola-black/40'
                      }`}
                    >
                      Conteúdo Pago (2000 Kz)
                    </button>
                  </div>
                  <p className="mt-4 text-xs text-angola-black/60 italic">
                    {formData.isFree 
                      ? "* Conteúdo gratuito ajuda a aumentar a tua reputação na plataforma." 
                      : "* Conteúdos pagos são agrupados em pacotes especiais de 2000 Kz."}
                  </p>
                </div>

                <div className="md:col-span-2 flex justify-end mt-4">
                  <button 
                    type="button"
                    onClick={() => setStep(2)}
                    className="bg-angola-red text-white px-12 py-4 rounded-2xl font-bold shadow-xl hover:scale-105 transition-all"
                  >
                    Próximo Passo
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="bg-angola-yellow text-angola-black w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
                Upload do Ficheiro
              </h2>

              <div 
                className={`border-4 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center transition-all ${
                  file ? 'border-angola-red bg-angola-red/5' : 'border-slate-200 bg-slate-50'
                }`}
              >
                <UploadIcon className={`w-16 h-16 mb-4 ${file ? 'text-angola-red' : 'text-angola-black/20'}`} />
                {file ? (
                  <div className="text-center">
                    <p className="font-bold text-angola-black">{file.name}</p>
                    <p className="text-sm text-angola-black/40">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    <button onClick={() => setFile(null)} className="mt-4 text-angola-red font-bold text-sm">Remover</button>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="font-bold text-angola-black">Arrasta o ficheiro ou clica para selecionar</p>
                    <p className="text-sm text-angola-black/40">PDF, MP4, ZIP (Máx 50MB)</p>
                    <input 
                      type="file" 
                      className="hidden" 
                      id="file-upload" 
                      onChange={e => setFile(e.target.files?.[0] || null)}
                    />
                    <label 
                      htmlFor="file-upload"
                      className="mt-6 inline-block bg-angola-black text-white px-8 py-3 rounded-xl font-bold cursor-pointer hover:bg-angola-red transition-all"
                    >
                      Selecionar Ficheiro
                    </label>
                  </div>
                )}
              </div>

              <div className="flex justify-between mt-12">
                <button 
                  onClick={() => setStep(1)}
                  className="text-angola-black/60 font-bold px-8 py-4"
                >
                  Voltar
                </button>
                <button 
                  onClick={handleUpload}
                  disabled={!file || loading}
                  className="bg-angola-red text-white px-12 py-4 rounded-2xl font-bold shadow-xl disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                  {loading ? 'A Enviar...' : 'Finalizar e Enviar'}
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-12">
              <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12" />
              </div>
              <h2 className="text-3xl font-black text-angola-black mb-4">Enviado com Sucesso!</h2>
              <p className="text-angola-black/60 max-w-md mx-auto mb-8">
                O teu conteúdo foi enviado para análise. Assim que for aprovado pelos nossos moderadores, ficará disponível para toda a comunidade.
              </p>
              <button 
                onClick={() => navigate('/')}
                className="bg-angola-black text-white px-12 py-4 rounded-2xl font-bold shadow-xl"
              >
                Voltar à Homepage
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
