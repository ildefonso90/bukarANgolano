import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';
import { Upload as UploadIcon, FileText, Video, Book, GraduationCap, CheckCircle, Loader2 } from 'lucide-react';

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
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !file || !coverFile) {
      alert('Por favor, seleciona tanto o ficheiro como a capa obrigatória.');
      return;
    }

    // 1. Validações de Tipo e Tamanho
    const allowedTypes = ['pdf', 'manual', 'book'];
    const isAllowedType = allowedTypes.includes(formData.type);
    
    const isUnderLimit = file.size <= 20 * 1024 * 1024; 
    const isCoverUnderLimit = coverFile.size <= 5 * 1024 * 1024; // 5MB limit for covers

    if (!isAllowedType) {
      alert('Este tipo de conteúdo (Vídeos/Cursos) está em desenvolvimento. Por agora, apenas aceitamos documentos.');
      return;
    }

    if (!isUnderLimit) {
      alert('O ficheiro é demasiado grande. O limite para documentos no plano gratuito é de 20MB.');
      return;
    }

    if (!isCoverUnderLimit) {
      alert('A capa é demasiado grande. O limite para imagens é de 5MB.');
      return;
    }

    if (!coverFile.type.startsWith('image/')) {
      alert('A capa deve ser uma imagem (JPG, PNG, etc.).');
      return;
    }

    setLoading(true);
    try {
      const sanitizeFileName = (name: string) => {
        return name
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Remove accents
          .replace(/[^\w.-]/g, '_') // Replace non-alphanumeric (except . and -) with _
          .replace(/_{2,}/g, '_'); // Replace multiple underscores with one
      };

      // 2. Upload da Capa para Supabase Storage
      const sanitizedCoverName = sanitizeFileName(coverFile.name);
      const coverPath = `${user.uid}/covers/${Date.now()}_${sanitizedCoverName}`;
      const { data: coverUploadData, error: coverError } = await supabase.storage
        .from('uploads')
        .upload(coverPath, coverFile);

      if (coverError) throw coverError;

      const { data: { publicUrl: thumbnailUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(coverPath);

      // 3. Upload do Ficheiro Principal para Supabase Storage
      const sanitizedFileName = sanitizeFileName(file.name);
      const storagePath = `${user.uid}/${Date.now()}_${sanitizedFileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(storagePath, file);

      if (uploadError) throw uploadError;

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
          thumbnail_url: thumbnailUrl,
          storage_path: storagePath,
          thumbnail_path: coverPath,
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
    <div className="max-w-4xl mx-auto py-8 md:py-12 px-4">
      <div className="bg-white rounded-[2rem] md:rounded-3xl shadow-xl overflow-hidden border border-angola-black/5">
        <div className="bg-angola-red p-6 md:p-8 text-white text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-black">Partilha o Teu Conhecimento</h1>
          <p className="opacity-80 text-sm md:text-base">Ajuda a construir o maior ecossistema estudantil de Angola.</p>
        </div>

        <div className="p-6 md:p-8">
          {step === 1 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-lg md:text-xl font-bold mb-6 flex items-center gap-2">
                <span className="bg-angola-yellow text-angola-black w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm shrink-0">1</span>
                Detalhes do Conteúdo
              </h2>
              
              <form className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-1.5 md:space-y-2">
                  <label className="text-xs md:text-sm font-bold text-angola-black/60">Título do Trabalho</label>
                  <input 
                    type="text" 
                    required
                    className="w-full p-3 md:p-4 bg-slate-50 border-2 border-transparent focus:border-angola-red rounded-xl md:rounded-2xl outline-none transition-all text-sm md:text-base"
                    placeholder="Ex: Introdução à Macroeconomia"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5 md:space-y-2">
                  <label className="text-xs md:text-sm font-bold text-angola-black/60">Autor / Instituição</label>
                  <input 
                    type="text" 
                    required
                    className="w-full p-3 md:p-4 bg-slate-50 border-2 border-transparent focus:border-angola-red rounded-xl md:rounded-2xl outline-none transition-all text-sm md:text-base"
                    placeholder="Teu nome ou da tua faculdade"
                    value={formData.author}
                    onChange={e => setFormData({...formData, author: e.target.value})}
                  />
                </div>

                <div className="md:col-span-2 space-y-1.5 md:space-y-2">
                  <label className="text-xs md:text-sm font-bold text-angola-black/60">Subtítulo / Descrição Curta</label>
                  <input 
                    type="text" 
                    className="w-full p-3 md:p-4 bg-slate-50 border-2 border-transparent focus:border-angola-red rounded-xl md:rounded-2xl outline-none transition-all text-sm md:text-base"
                    placeholder="Breve resumo do que o aluno vai encontrar"
                    value={formData.subtitle}
                    onChange={e => setFormData({...formData, subtitle: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5 md:space-y-2">
                  <label className="text-xs md:text-sm font-bold text-angola-black/60">Categoria</label>
                  <select 
                    className="w-full p-3 md:p-4 bg-slate-50 border-2 border-transparent focus:border-angola-red rounded-xl md:rounded-2xl outline-none transition-all appearance-none text-sm md:text-base"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5 md:space-y-2">
                  <label className="text-xs md:text-sm font-bold text-angola-black/60">Tipo de Conteúdo</label>
                  <div className="grid grid-cols-2 gap-2">
                    {TYPES.map(t => (
                      <button
                        key={t.id}
                        type="button"
                        disabled={t.disabled}
                        onClick={() => !t.disabled && setFormData({...formData, type: t.id})}
                        className={`p-2.5 md:p-3 rounded-xl border-2 flex flex-col items-start gap-1 text-[10px] md:text-xs font-bold transition-all relative ${
                          t.disabled 
                          ? 'opacity-50 cursor-not-allowed bg-slate-100 border-transparent text-slate-400'
                          : formData.type === t.id 
                            ? 'border-angola-red bg-angola-red/5 text-angola-red' 
                            : 'border-transparent bg-slate-50 text-angola-black/60 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 md:gap-2">
                          <t.icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          <span className="truncate">{t.label}</span>
                        </div>
                        {t.disabled && (
                          <span className="text-[7px] md:text-[8px] uppercase bg-slate-200 px-1.5 py-0.5 rounded-full">
                            Brevemente
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2 p-5 md:p-6 bg-angola-yellow/10 rounded-2xl md:rounded-3xl border-2 border-angola-yellow/20">
                  <h3 className="font-bold text-angola-black mb-4">Modelo de Acesso</h3>
                  <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, isFree: true})}
                      className={`flex-1 p-3 md:p-4 rounded-xl md:rounded-2xl border-2 font-bold transition-all text-sm md:text-base ${
                        formData.isFree 
                        ? 'border-angola-red bg-white text-angola-red shadow-lg' 
                        : 'border-transparent bg-white/50 text-angola-black/40'
                      }`}
                    >
                      Grátis para Todos
                    </button>
                    <button
                      type="button"
                      disabled
                      className="flex-1 p-3 md:p-4 rounded-xl md:rounded-2xl border-2 border-transparent bg-slate-100 text-angola-black/20 font-bold transition-all text-sm md:text-base cursor-not-allowed flex flex-col items-center justify-center gap-1"
                    >
                      Conteúdo Pago (2000 Kz)
                      <span className="text-[8px] uppercase bg-slate-200 px-2 py-0.5 rounded-full text-slate-400">Brevemente</span>
                    </button>
                  </div>
                  <p className="mt-4 text-[10px] md:text-xs text-angola-black/60 italic text-center sm:text-left">
                    {formData.isFree 
                      ? "* Conteúdo gratuito ajuda a aumentar a tua reputação na plataforma." 
                      : "* Conteúdos pagos são agrupados em pacotes especiais de 2000 Kz."}
                  </p>
                </div>

                <div className="md:col-span-2 flex justify-center sm:justify-end mt-4">
                  <button 
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full sm:w-auto bg-angola-red text-white px-12 py-4 rounded-2xl font-bold shadow-xl hover:scale-105 transition-all"
                  >
                    Próximo Passo
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="bg-angola-yellow text-angola-black w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
                Upload dos Ficheiros
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Main File Upload */}
                <div className="space-y-4">
                  <label className="text-sm font-black text-angola-black/40 uppercase tracking-widest">Ficheiro Académico *</label>
                  <div 
                    className={`border-4 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center transition-all min-h-[250px] ${
                      file ? 'border-angola-red bg-angola-red/5' : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <UploadIcon className={`w-12 h-12 mb-4 ${file ? 'text-angola-red' : 'text-angola-black/20'}`} />
                    {file ? (
                      <div className="text-center">
                        <p className="font-bold text-angola-black text-sm truncate max-w-[200px]">{file.name}</p>
                        <p className="text-[10px] text-angola-black/40">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        <button onClick={() => setFile(null)} className="mt-4 text-angola-red font-bold text-xs">Remover</button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="font-bold text-angola-black text-sm">Ficheiro principal</p>
                        <p className="text-[10px] text-angola-black/40 mb-4">PDF, Manual, Livro (Máx 20MB)</p>
                        <input 
                          type="file" 
                          className="hidden" 
                          id="file-upload" 
                          accept=".pdf,.doc,.docx"
                          onChange={e => setFile(e.target.files?.[0] || null)}
                        />
                        <label 
                          htmlFor="file-upload"
                          className="inline-block bg-angola-black text-white px-6 py-2.5 rounded-xl font-bold cursor-pointer hover:bg-angola-red transition-all text-xs"
                        >
                          Selecionar PDF
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cover Image Upload */}
                <div className="space-y-4">
                  <label className="text-sm font-black text-angola-black/40 uppercase tracking-widest">Capa do Trabalho *</label>
                  <div 
                    className={`border-4 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center transition-all min-h-[250px] overflow-hidden ${
                      coverFile ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    {coverFile ? (
                      <div className="text-center space-y-4">
                        <div className="w-24 h-32 mx-auto rounded-lg overflow-hidden shadow-lg border-2 border-white">
                          <img 
                            src={URL.createObjectURL(coverFile)} 
                            alt="Capa Pre-visualização" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-angola-black text-sm truncate max-w-[200px]">{coverFile.name}</p>
                          <button onClick={() => setCoverFile(null)} className="mt-2 text-red-500 font-bold text-xs underline">Trocar Capa</button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <UploadIcon className="w-12 h-12 mb-4 text-angola-black/20 mx-auto" />
                        <p className="font-bold text-angola-black text-sm">Imagem da Capa</p>
                        <p className="text-[10px] text-angola-black/40 mb-4">Será a imagem de prévia (Máx 5MB)</p>
                        <input 
                          type="file" 
                          className="hidden" 
                          id="cover-upload" 
                          accept="image/*"
                          onChange={e => setCoverFile(e.target.files?.[0] || null)}
                        />
                        <label 
                          htmlFor="cover-upload"
                          className="inline-block bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold cursor-pointer hover:bg-emerald-600 transition-all text-xs"
                        >
                          Selecionar Imagem
                        </label>
                      </div>
                    )}
                  </div>
                </div>
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
                  disabled={!file || !coverFile || loading}
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
