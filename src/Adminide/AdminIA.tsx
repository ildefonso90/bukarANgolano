import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { GoogleGenAI, Type } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Upload as UploadIcon, 
  FileText, 
  CheckCircle, 
  Loader2, 
  AlertCircle, 
  X, 
  Brain, 
  Database, 
  CloudUpload,
  ArrowRight,
  ListRestart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist';
// Import the worker using Vite's ?url suffix for reliable loading
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { CATEGORIES } from '../constants';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface BatchFile {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'extracting_text' | 'ai_analyzing' | 'uploading' | 'saving' | 'completed' | 'error';
  progress: number;
  error?: string;
  metadata?: {
    title: string;
    category: string;
    author: string;
  };
  fileUrl?: string;
  thumbnailUrl?: string;
}

export default function AdminIA() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [files, setFiles] = useState<BatchFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentProcessIndex, setCurrentProcessIndex] = useState(-1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    const newBatchFiles: BatchFile[] = selectedFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file: file as File,
      status: 'pending' as const,
      progress: 0,
    }));

    setFiles(prev => [...prev, ...newBatchFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (id: string) => {
    if (isProcessing) return;
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const clearCompleted = () => {
    setFiles(prev => prev.filter(f => f.status !== 'completed'));
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      // Extract text from the first 2 pages (or just the 1st if only 1 exists)
      let fullText = "";
      const numPages = Math.min(pdf.numPages, 2);
      
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + " ";
      }
      
      return fullText.slice(0, 3000); // Return first 3000 chars for AI
    } catch (err) {
      console.error("PDF Extraction error:", err);
      return "";
    }
  };

  const analyzeWithAI = async (text: string, filename: string) => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Nome do ficheiro: ${filename}\n\nTexto extraído: ${text}`,
        config: {
          systemInstruction: `És um catalogador de documentos académicos angolanos. 
          Analisa o texto extraído do PDF e o nome do ficheiro para sugerir metadados profissionais.
          CATEGORIAS PERMITIDAS: ${CATEGORIES.join(', ')}.
          
          TAREFAS:
          1. Sugere um título claro e académico.
          2. Identifica o autor ou instituição (se não encontrares, usa 'Comunidade Académica').
          3. Escolhe a categoria mais adequada da lista.
          4. Cria uma descrição breve (máximo 150 caracteres) que resuma o conteúdo.
          
          Responde APENAS em formato JSON.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Título claro e profissional" },
              category: { type: Type.STRING, description: "Uma das categorias da lista" },
              author: { type: Type.STRING, description: "Nome do autor ou instituição" },
              description: { type: Type.STRING, description: "Resumo breve do conteúdo (máx 150 chars)" }
            },
            required: ["title", "category", "author", "description"]
          }
        }
      });

      const result = JSON.parse(response.text || "{}");
      // Double check category is valid
      if (!CATEGORIES.includes(result.category)) {
          result.category = CATEGORIES[0]; // Default to first if hallucinated
      }
      return result;
    } catch (err) {
      console.error("AI Analysis error:", err);
      return { title: filename.replace('.pdf', ''), category: CATEGORIES[0], author: 'Comunidade' };
    }
  };

  const processBatch = async () => {
    if (files.length === 0 || isProcessing) return;
    
    setIsProcessing(true);
    const pendingFiles = files.filter(f => f.status === 'pending');
    
    for (let i = 0; i < pendingFiles.length; i++) {
      const currentFile = pendingFiles[i];
      const flatIndex = files.findIndex(f => f.id === currentFile.id);
      setCurrentProcessIndex(flatIndex);

      const updateStatus = (status: BatchFile['status'], progress: number, metadata?: any) => {
        setFiles(prev => prev.map(f => f.id === currentFile.id ? { ...f, status, progress, metadata: metadata || f.metadata } : f));
      };

      try {
        // Step 1: Text Extraction
        updateStatus('extracting_text', 10);
        const text = await extractTextFromPDF(currentFile.file);
        
        // Step 2: AI Analysis
        updateStatus('ai_analyzing', 30);
        const metadata = await analyzeWithAI(text, currentFile.file.name);
        updateStatus('ai_analyzing', 50, metadata);

        // Step 3: Upload to Storage
        updateStatus('uploading', 60);
        const sanitizeFileName = (name: string) => name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w.-]/g, '_');
        
        const timestamp = Date.now();
        const storagePath = `batch_uploads/${user?.uid}/${timestamp}_${sanitizeFileName(currentFile.file.name)}`;
        
        const { error: uploadError } = await supabase.storage
          .from('uploads')
          .upload(storagePath, currentFile.file);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(storagePath);

        // Step 4: Save to Database
        updateStatus('saving', 90);
        const { error: dbError } = await supabase
          .from('contents')
          .insert([{
            title: metadata.title,
            subtitle: metadata.description,
            author: metadata.author,
            type: 'pdf',
            category: metadata.category,
            is_free: true,
            file_url: publicUrl,
            thumbnail_url: 'https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?q=80&w=200&auto=format&fit=crop', // Default placeholder for batch
            storage_path: storagePath,
            storage_type: 'supabase',
            user_id: user?.uid,
            status: 'approved'
          }]);

        if (dbError) throw dbError;

        updateStatus('completed', 100);
      } catch (err: any) {
        setFiles(prev => prev.map(f => f.id === currentFile.id ? { ...f, status: 'error', error: err.message } : f));
      }
    }

    setIsProcessing(false);
    setCurrentProcessIndex(-1);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <div className="bg-purple-600 p-2 rounded-xl text-white">
              <Brain className="w-8 h-8" />
            </div>
            IA & Upload em Lote
          </h1>
          <p className="text-slate-500 font-bold mt-1">Sobe 100+ ficheiros e deixa o Gemini organizar tudo por ti.</p>
        </div>

        <div className="flex gap-3">
           <button 
            onClick={clearCompleted}
            className="px-6 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-slate-400 hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <ListRestart className="w-5 h-5" /> Limpar Concluídos
          </button>
          <input 
            type="file" 
            multiple 
            accept=".pdf" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileSelection} 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="px-8 py-3 bg-angola-black text-white rounded-2xl font-black shadow-xl hover:scale-105 transition-transform flex items-center gap-2 disabled:opacity-50"
          >
            <UploadIcon className="w-5 h-5" /> Selecionar PDFs
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Stats & Actions */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Database className="w-6 h-6 text-slate-300" />
              Resumo do Lote
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl">
                <p className="text-2xl font-black text-slate-900">{files.length}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total</p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-2xl">
                <p className="text-2xl font-black text-emerald-600">{files.filter(f => f.status === 'completed').length}</p>
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none">Concluídos</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-2xl">
                <p className="text-2xl font-black text-blue-600">{files.filter(f => f.status === 'pending').length}</p>
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none">Pendentes</p>
              </div>
              <div className="bg-red-50 p-4 rounded-2xl">
                <p className="text-2xl font-black text-red-600">{files.filter(f => f.status === 'error').length}</p>
                <p className="text-[10px] font-black text-red-400 uppercase tracking-widest leading-none">Erros</p>
              </div>
            </div>

            <button 
              onClick={processBatch}
              disabled={isProcessing || files.filter(f => f.status === 'pending').length === 0}
              className="w-full py-5 bg-purple-600 text-white rounded-3xl font-black shadow-xl shadow-purple-600/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale"
            >
              {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
              {isProcessing ? 'Processando Lote...' : 'Começar Automação IA'}
            </button>
            
            <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 italic">
               <p className="text-[10px] text-purple-600 font-bold leading-relaxed">
                * A IA irá ler os primeiros parágrafos de cada PDF para extrair o título e sugerir a categoria correta.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: File List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
             <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
               <h3 className="font-black text-slate-900">Fila de Processamento</h3>
               <span className="text-xs font-bold text-slate-400 italic">Máximo sugerido: 200 PDFs</span>
             </div>

             <div className="flex-1 overflow-y-auto max-h-[600px] p-2 space-y-2">
               {files.length === 0 && (
                 <div className="flex flex-col items-center justify-center h-full py-20 text-center space-y-4">
                   <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center text-slate-200">
                     <CloudUpload className="w-10 h-10" />
                   </div>
                   <p className="text-slate-400 font-bold italic">Nenhum ficheiro selecionado.</p>
                 </div>
               )}

               <AnimatePresence>
                 {files.map((f, idx) => (
                   <motion.div 
                    key={f.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`p-4 rounded-3xl border transition-all flex items-center gap-4 ${
                      idx === currentProcessIndex ? 'border-purple-500 bg-purple-50 shadow-md ring-4 ring-purple-500/5' : 
                      f.status === 'completed' ? 'border-emerald-200 bg-emerald-50/20' :
                      f.status === 'error' ? 'border-red-200 bg-red-50/20' :
                      'border-slate-100 bg-white hover:bg-slate-50'
                    }`}
                   >
                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                       f.status === 'completed' ? 'bg-emerald-500 text-white' :
                       f.status === 'error' ? 'bg-red-500 text-white' :
                       'bg-slate-100 text-slate-400'
                     }`}>
                       {f.status === 'completed' ? <CheckCircle className="w-6 h-6" /> : 
                        f.status === 'error' ? <AlertCircle className="w-6 h-6" /> :
                        <FileText className="w-6 h-6" />}
                     </div>

                     <div className="flex-1 min-w-0">
                       <div className="flex items-center justify-between gap-4">
                         <h4 className="font-black text-slate-900 truncate text-sm">
                           {f.metadata?.title || f.file.name}
                         </h4>
                         <span className="text-[10px] font-black uppercase text-slate-400 shrink-0">
                           {f.status.replace('_', ' ')}
                         </span>
                       </div>
                       
                       <div className="flex items-center gap-3 mt-1">
                          {f.metadata && (
                            <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase">
                              {f.metadata.category}
                            </span>
                          )}
                          <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                             <motion.div 
                              className={`h-full ${f.status === 'error' ? 'bg-red-500' : 'bg-purple-600'}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${f.progress}%` }}
                             />
                          </div>
                          <span className="text-[10px] font-bold text-slate-400">{f.progress}%</span>
                       </div>

                       {f.error && (
                         <p className="text-[10px] text-red-500 font-bold mt-1 truncate">{f.error}</p>
                       )}
                     </div>

                     {!isProcessing && f.status !== 'completed' && (
                       <button 
                        onClick={() => removeFile(f.id)}
                        className="p-2 text-slate-300 hover:text-red-500 rounded-xl transition-colors"
                       >
                         <X className="w-5 h-5" />
                       </button>
                     )}
                   </motion.div>
                 ))}
               </AnimatePresence>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
