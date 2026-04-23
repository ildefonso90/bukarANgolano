import { useState } from 'react';
import { 
  Youtube, 
  Sparkles, 
  Loader2, 
  Layout, 
  Video, 
  FileText, 
  Database, 
  Plus, 
  CheckCircle,
  AlertCircle,
  PlayCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES } from '../constants';
import { supabase } from '../lib/supabase';
import { GoogleGenAI, Type } from "@google/genai";

interface VideoItem {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnail: string;
  duration?: string;
  order: number;
}

interface Module {
  id: string;
  name: string;
  videos: VideoItem[];
  enrichments: any[];
}

interface CourseStructure {
  title: string;
  description: string;
  main_topic: string;
  category: string;
  thumbnail: string;
  modules: Module[];
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export default function AdminYouTubeCourse() {
  const { user } = useAuth();
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'extracting' | 'structuring' | 'enriching' | 'review' | 'saving' | 'completed'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [course, setCourse] = useState<CourseStructure | null>(null);
  const [progress, setProgress] = useState(0);

  const startAutomatedFlow = async () => {
    if (!url.trim()) return;
    setStatus('extracting');
    setError(null);
    setProgress(10);

    try {
      // 1. Fetch & Extract HTML via Proxy
      const proxyRes = await fetch('/api/proxy-youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      if (!proxyRes.ok) {
        const errorData = await proxyRes.json().catch(() => ({}));
        throw new Error(errorData.message || "Falha ao aceder ao YouTube (Proxy)");
      }
      const { html } = await proxyRes.json();
      
      // OPTIMIZATION: Extract only relevant text parts from HTML before sending to AI
      const titleMatch = html.match(/<title>(.*?)<\/title>/);
      const descMatch = html.match(/<meta name="description" content="(.*?)">/);
      
      // Better regex to catch actual video titles in a playlist/video page
      const videoClues = html.match(/"title":\{"runs":\[\{"text":"(.*?)"\}\]\}/g) || [];
      const junkWords = ["Início", "Explorar", "Shorts", "Subscrições", "Biblioteca", "Histórico", "Os teus vídeos", "Ver mais tarde", "Vídeos de que gostei", "Mix", "YouTube", "Procurar"];
      
      const cleanVideoList = videoClues
        .map((c: string) => c.replace(/"title":\{"runs":\[\{"text":"(.*?)"\}\]\}/, '$1'))
        .filter(t => t.length > 5 && !junkWords.includes(t)) // Filter short or UI text
        .filter((v, i, a) => a.indexOf(v) === i) // Remove duplicates
        .slice(0, 50);

      const metadataContext = `
        TITULO PRINCIPAL: ${titleMatch ? titleMatch[1] : 'Desconhecido'}
        DESCRIÇÃO: ${descMatch ? descMatch[1] : 'Sem descrição'}
        LISTA DE AULAS/VIDEOS DETETADOS:
        ${cleanVideoList.join('\n')}
      `;

      setStatus('structuring');
      setProgress(40);

      // 2. Extract & Structure with Gemini
      const extractionResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            role: 'user',
            parts: [{ text: `Cria um curso completo usando TODOS os vídeos listados aqui:\n\n${metadataContext}` }]
          }
        ],
        config: {
          temperature: 0.7,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              main_topic: { type: Type.STRING, description: "A palavra-chave principal do curso (ex: Excel, Direito Penal, Programação)" },
              thumbnail: { type: Type.STRING },
              category: { type: Type.STRING, description: "Escolha uma destas: Economia, Direito, Medicina, Informatica, Engenharia, Historia, Marketing" },
              modules: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                    videos: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          title: { type: Type.STRING },
                          url: { type: Type.STRING },
                          thumbnail: { type: Type.STRING },
                          order: { type: Type.NUMBER }
                        }
                      }
                    }
                  }
                }
              }
            },
            required: ["title", "description", "modules"]
          }
        }
      });

      let courseData: CourseStructure;
      try {
        const text = extractionResponse.text;
        courseData = JSON.parse(text || "{}") as CourseStructure;
      } catch (parseError: any) {
        console.error("Erro ao processar JSON da IA:", parseError);
        throw new Error("A IA devolveu um formato inválido. Tenta novamente com um link mais curto.");
      }
      
      setStatus('enriching');
      setProgress(70);

      // 3. Enrichment with Internal Supabase (Broad Search + AI Validation)
      console.log(`Iniciando enriquecimento para o tópico principal: ${courseData.main_topic}`);
      
      const cleanSubtitle = (sub: string) => {
        if (!sub) return "";
        try {
          if (sub.startsWith('{')) {
            const parsed = JSON.parse(sub);
            return parsed.description || parsed.resumo || sub;
          }
        } catch (e) {}
        return sub;
      };

      // Step 1: Broad search for all content matching the main topic ONE TIME
      const { data: globalCandidates } = await supabase
        .from('contents')
        .select('id, title, category, type, subtitle, thumbnail')
        .or(`title.ilike.%${courseData.main_topic}%,subtitle.ilike.%${courseData.main_topic}%`)
        .neq('type', 'course')
        .limit(60); // Large pool

      const validateCompatibility = async (moduleName: string, candidates: any[]) => {
        if (candidates.length === 0) return [];
        try {
          const prompt = `Age como um curador de conteúdos educativos.
          O teu objetivo é decidir se os seguintes materiais de apoio (documentos) são realmente úteis para um estudante que está a ver o módulo: "${moduleName}".
          O curso foca em: "${courseData.main_topic}".

          MATERIAIS DISPONÍVEIS PARA ANALISAR:
          ${candidates.map((c, i) => `[${i}] Título: "${c.title}" | Descrição: "${cleanSubtitle(c.subtitle)}"`).join('\n')}

          Responde APENAS com um array JSON contendo os índices (ex: [0, 2]) dos materiais aprovados para este módulo específico. 
          Se nenhum for compatível para este módulo em particular, responde [].`;

          const result = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt
          });
          
          const responseText = result.text || "";
          const indices = JSON.parse(responseText.match(/\[.*\]/s)?.[0] || "[]");
          return indices.map((idx: number) => candidates[idx]).filter(Boolean);
        } catch (e) {
          console.warn("Erro na validação de compatibilidade:", e);
          return [];
        }
      };

      for (const module of courseData.modules) {
        module.enrichments = [];
        if (globalCandidates && globalCandidates.length > 0) {
          console.log(`Módulo "${module.name}": Analisando ${globalCandidates.length} materiais globais...`);
          const validated = await validateCompatibility(module.name, globalCandidates);
          module.enrichments = validated.slice(0, 4);
        }
        console.log(`Módulo "${module.name}": ${module.enrichments.length} materiais finais validados.`);
      }

      setCourse(courseData);
      setStatus('review');
      setProgress(100);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      setStatus('idle');
    }
  };

  const handleSaveCourse = async () => {
    if (!course || !user) return;
    setStatus('saving');
    setError(null);

    try {
      console.log("Tentando salvar curso:", course);
      
      // Since 'metadata' column is missing in the current schema cache, 
      // we store the structure in the 'subtitle' column as a stringified JSON 
      // if the type is 'course'.
      const { data, error: dbError } = await supabase
        .from('contents')
        .insert([{
          title: course.title,
          subtitle: JSON.stringify({
            description: course.description,
            modules: course.modules,
            source_url: url,
            is_ai_generated: true
          }),
          author: 'Auto-IA Builder',
          type: 'course',
          category: course.category || CATEGORIES[0],
          is_free: true,
          thumbnail_url: course.thumbnail,
          user_id: user.uid,
          status: 'approved'
        }])
        .select();

      if (dbError) {
        console.error("Erro Supabase ao salvar:", dbError);
        throw new Error(`Erro ao salvar no banco: ${dbError.message}`);
      }
      
      console.log("Curso salvo com sucesso:", data);
      setStatus('completed');
    } catch (err: any) {
      console.error("Erro fatal no salvamento:", err);
      setError(err.message || "Ocorreu um erro inesperado ao salvar.");
      setStatus('review');
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-20 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <div className="bg-red-600 p-2 rounded-xl text-white">
              <Youtube className="w-8 h-8" />
            </div>
            Criador de Cursos Automático
          </h1>
          <p className="text-slate-500 font-bold mt-1">Transforma qualquer playlist do YouTube num curso estruturado e enriquecido.</p>
        </div>

        {status === 'completed' && (
          <button 
            onClick={() => { setStatus('idle'); setCourse(null); setUrl(''); }}
            className="px-6 py-3 bg-emerald-500 text-white rounded-2xl font-black shadow-lg hover:scale-105 transition-all flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5" /> Criar Outro
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {status === 'completed' ? (
          <motion.div 
            key="completed-step"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-8 md:p-20 rounded-[2.5rem] md:rounded-[3rem] border border-slate-200 shadow-2xl text-center space-y-8"
          >
            <div className="w-16 h-16 md:w-24 md:h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 md:w-12 md:h-12" />
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl md:text-4xl font-black text-slate-900 leading-tight">Curso Publicado com Sucesso!</h2>
              <p className="text-sm md:text-xl text-slate-500 font-medium max-w-xl mx-auto">
                O curso "{course?.title}" já está disponível na biblioteca digital para todos os utilizadores.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => { setStatus('idle'); setCourse(null); setUrl(''); }}
                className="w-full sm:w-auto px-8 py-4 bg-angola-black text-white rounded-2xl font-black hover:scale-105 transition-all"
              >
                Criar Novo Curso
              </button>
              <a 
                href="/catalog?type=course" 
                className="w-full sm:w-auto px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all text-center"
              >
                Ver no Catálogo
              </a>
            </div>
          </motion.div>
        ) : status === 'idle' || status === 'extracting' || status === 'structuring' || status === 'enriching' ? (
          <motion.div 
            key="input-step"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-6 md:p-12 rounded-[2.5rem] border border-slate-200 shadow-xl space-y-8 text-center"
          >
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto text-slate-300">
                <Layout className="w-10 h-10" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-900">Configura o Teu Curso</h2>
                <p className="text-slate-500 font-medium">Insere o link da playlist ou vídeo principal. A nossa IA cuidará da estrutura, módulos e materiais complementares.</p>
              </div>

              <div className="relative group">
                <Youtube className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within:text-red-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="https://www.youtube.com/playlist?list=..." 
                  className="w-full pl-16 pr-6 py-5 bg-slate-50 border-2 border-transparent focus:border-red-500 rounded-[2rem] outline-none transition-all font-bold text-slate-800 placeholder:text-slate-400"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  disabled={status !== 'idle'}
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-500 p-4 rounded-2xl flex items-center gap-3 font-bold text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {error}
                </div>
              )}

              <button 
                onClick={startAutomatedFlow}
                disabled={!url.trim() || status !== 'idle'}
                className="w-full py-5 bg-angola-black text-white rounded-3xl font-black shadow-xl shadow-black/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale"
              >
                {status === 'idle' ? (
                  <>
                    <Sparkles className="w-6 h-6" />
                    Gerar Curso Automaticamente
                  </>
                ) : (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    {status === 'extracting' && 'Extraindo Dados do YouTube...'}
                    {status === 'structuring' && 'Criando Estrutura Pedagógica...'}
                    {status === 'enriching' && 'Enriquecendo com Materiais Internos...'}
                  </>
                )}
              </button>

              <div className="grid grid-cols-3 gap-4 pt-8">
                <div className="space-y-2">
                  <div className={`h-1.5 rounded-full transition-all duration-500 ${status === 'extracting' || status === 'structuring' || status === 'enriching' ? 'bg-red-500' : 'bg-slate-100'}`} />
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Extração</p>
                </div>
                <div className="space-y-2">
                  <div className={`h-1.5 rounded-full transition-all duration-500 ${status === 'structuring' || status === 'enriching' ? 'bg-red-500' : 'bg-slate-100'}`} />
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Estruturação</p>
                </div>
                <div className="space-y-2">
                  <div className={`h-1.5 rounded-full transition-all duration-500 ${status === 'enriching' ? 'bg-red-500' : 'bg-slate-100'}`} />
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Enriquecimento</p>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="review-step"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8"
          >
            {/* Course Summary Dashboard */}
            <div className="space-y-6 lg:sticky lg:top-8 self-start">
              <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                <div className="relative group rounded-2xl md:rounded-3xl overflow-hidden aspect-video border border-slate-100 shadow-inner">
                  <img src={course?.thumbnail} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <PlayCircle className="w-12 h-12 text-white" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">{course?.title}</h3>
                    <p className="text-slate-400 font-bold text-[10px] md:text-xs mt-1 uppercase tracking-widest">{course?.category}</p>
                  </div>
                  
                  <p className="text-slate-600 text-xs md:text-sm font-medium leading-relaxed line-clamp-4 lg:line-clamp-none">
                    {course?.description}
                  </p>

                  <div className="pt-4 grid grid-cols-2 gap-3 md:gap-4">
                    <div className="bg-slate-50 p-3 md:p-4 rounded-2xl text-center">
                      <p className="text-lg md:text-xl font-black text-slate-900">{course?.modules.length}</p>
                      <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Módulos</p>
                    </div>
                    <div className="bg-slate-50 p-3 md:p-4 rounded-2xl text-center">
                      <p className="text-lg md:text-xl font-black text-slate-900">
                        {course?.modules.reduce((acc, m) => acc + m.videos.length, 0)}
                      </p>
                      <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Aulas</p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleSaveCourse}
                  disabled={status === 'saving'}
                  className="w-full py-4 md:py-5 bg-emerald-600 text-white rounded-2xl md:rounded-3xl font-black shadow-xl shadow-emerald-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {status === 'saving' ? (
                    <>
                      <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Database className="w-5 h-5 md:w-6 md:h-6" />
                      Publicar Curso
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Modules and Content */}
            <div className="lg:col-span-1 xl:col-span-2 space-y-6">
              <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                   <h3 className="font-black text-slate-900 flex items-center gap-2 text-sm md:text-base">
                     <Layout className="w-4 h-4 md:w-5 md:h-5 text-slate-400" />
                     Currículo Estruturado por IA
                   </h3>
                </div>

        <div className="p-4 md:p-8 space-y-8 md:space-y-10">
                  {course?.modules.map((module, idx) => (
                    <div key={module.id} className="space-y-4">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-900 text-white rounded-lg md:rounded-xl flex items-center justify-center font-black text-sm md:text-base shrink-0">
                          {idx + 1}
                        </div>
                        <h4 className="text-lg md:text-xl font-black text-slate-900 truncate">{module.name}</h4>
                      </div>

                      <div className="pl-2 sm:pl-10 md:pl-14 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
                          {module.videos.map((v) => (
                            <div key={v.id} className="group p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl flex items-center justify-between border border-transparent hover:border-slate-200 transition-all">
                              <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                                <div className="w-12 h-9 md:w-16 md:h-12 bg-slate-200 rounded-lg overflow-hidden shrink-0">
                                  <img src={v.thumbnail} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs md:text-sm font-black text-slate-800 truncate">{v.title}</p>
                                  <div className="flex items-center gap-2 text-[9px] md:text-[10px] text-slate-400 font-bold uppercase">
                                    <Video className="w-3 h-3" />
                                    Aula
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Enrichments */}
                        {module.enrichments && module.enrichments.length > 0 && (
                          <div className="pt-4 border-t border-slate-100 space-y-3">
                             <p className="text-[9px] md:text-[10px] font-black text-purple-600 uppercase tracking-widest flex items-center gap-2">
                               <Sparkles className="w-3 h-3" />
                               Materiais de Apoio Encontrados ({module.enrichments.length})
                             </p>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                               {module.enrichments.map((e: any) => (
                                 <div key={e.id} className="p-3 bg-purple-50 rounded-xl flex items-center justify-between border border-purple-100">
                                   <div className="flex items-center gap-3 min-w-0">
                                     <div className="w-8 h-8 bg-purple-200 rounded-lg flex items-center justify-center shrink-0">
                                       <FileText className="w-4 h-4 text-purple-600" />
                                     </div>
                                     <div className="min-w-0">
                                       <p className="text-[11px] md:text-xs font-black text-purple-900 truncate">{e.title}</p>
                                       <p className="text-[9px] text-purple-400 font-bold uppercase">{e.category}</p>
                                     </div>
                                   </div>
                                   <CheckCircle className="w-4 h-4 text-purple-400 shrink-0" />
                                 </div>
                               ))}
                             </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
