import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { CATEGORIES } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Sparkles, 
  Database, 
  Trash2, 
  CheckCircle, 
  XCircle,
  BarChart3,
  Search,
  MessageSquare,
  ChevronRight,
  ShieldAlert,
  History,
  PlusCircle,
  Clock
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'action' | 'status';
  actions?: any[];
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  timestamp: number;
}

export default function AdminAssistant() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: 'Olá! Sou o assistente inteligente da BukiAngolano. Tenho acesso ao sistema para te ajudar a gerir conteúdos, utilizadores e estatísticas. Como posso ajudar hoje?' 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [chatHistoryList, setChatHistoryList] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>(Math.random().toString(36).substring(7));
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem('buki_admin_chats');
    if (saved) {
      try {
        setChatHistoryList(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading chats:', e);
      }
    }
  }, []);

  // Sync current chat to history
  useEffect(() => {
    if (messages.length > 1) {
      const updatedHistory = [...chatHistoryList];
      const existingIdx = updatedHistory.findIndex(c => c.id === currentChatId);
      
      const session: ChatSession = {
        id: currentChatId,
        title: messages[1]?.content.substring(0, 40) + '...' || 'Nova Conversa',
        messages,
        timestamp: Date.now()
      };

      if (existingIdx >= 0) {
        updatedHistory[existingIdx] = session;
      } else {
        updatedHistory.unshift(session);
      }

      setChatHistoryList(updatedHistory);
      localStorage.setItem('buki_admin_chats', JSON.stringify(updatedHistory.slice(0, 50))); // Keep last 50
    }
  }, [messages, currentChatId]);

  const createNewChat = () => {
    setCurrentChatId(Math.random().toString(36).substring(7));
    setMessages([
      { 
        role: 'assistant', 
        content: 'Olá! Iniciei uma nova sessão. Como posso ajudar agora?' 
      }
    ]);
    setIsHistoryOpen(false);
  };

  const loadChat = (chat: ChatSession) => {
    setCurrentChatId(chat.id);
    setMessages(chat.messages);
    setIsHistoryOpen(false);
  };

  const deleteChat = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const filtered = chatHistoryList.filter(c => c.id !== id);
    setChatHistoryList(filtered);
    localStorage.setItem('buki_admin_chats', JSON.stringify(filtered));
    if (currentChatId === id) {
      createNewChat();
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Tools Implementation
  const tools = {
    get_schema: async () => {
      return {
        tables: {
          contents: ["id", "title", "subtitle", "category", "type", "author", "is_free", "bundle_id", "file_id_primary", "file_id_backup", "preview_id", "user_id", "status", "created_at"],
          users: ["uid", "email", "display_name", "role", "purchased_bundle_ids", "favorite_ids", "created_at"],
          bundles: ["id", "name", "price", "description", "content_ids"]
        },
        relationships: "contents.user_id links to users.uid",
        categories: CATEGORIES
      };
    },
    supabase_query: async ({ table, action, filter, data }: { table: string, action: 'select' | 'update' | 'delete' | 'insert', filter?: any, data?: any }) => {
      try {
        let query: any = supabase.from(table);
        
        if (action === 'select') {
          query = query.select('*');
        } else if (action === 'update' && data) {
          query = query.update(data);
        } else if (action === 'delete') {
          query = query.delete();
        } else if (action === 'insert' && data) {
          query = query.insert(data);
        }

        if (filter && action !== 'insert') {
          Object.entries(filter).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }

        if (action === 'select') query = query.limit(50);

        const { data: result, error } = await query;
        if (error) {
          console.error(`DB Error (${action} on ${table}):`, error);
          return { success: false, error: error.message, hint: error.hint };
        }
        return { success: true, count: Array.isArray(result) ? result.length : (result ? 1 : 0), data: result };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },
    manage_storage: async ({ action, path }: { action: 'list' | 'delete', path: string }) => {
      if (action === 'list') {
        const { data } = await supabase.storage.from('uploads').list(path);
        return data || [];
      } else {
        const { error } = await supabase.storage.from('uploads').remove([path]);
        return error ? { success: false, error: error.message } : { success: true };
      }
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const chatHistory = messages.map(m => ({ 
        role: m.role, 
        parts: [{ text: m.content }] 
      }));

      const modelConfig = {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        systemInstruction: `És o Administrador Supremo de IA da BukiAngolano.
        Tens autoridade total sobre o banco de dados (Supabase) e o Storage.
        O gerente confia plenamente em ti para operar o sistema.
        
        MISSÃO:
        - Auditoria e Limpeza: Manter o sistema livre de dados inúteis ou ficheiros órfãos no storage.
        - Gestão de Utilizadores: Modificar permissões ou dados de perfis se solicitado.
        - Gestão de Conteúdos: Podes criar (insert), atualizar (update) ou eliminar (delete) qualquer registo nas tabelas permitidas.
        - Proatividade: Não esperes apenas ordens. Analisa o sistema com 'get_schema' e 'supabase_query' e sugere melhorias baseadas em dados reais.
        
        REGRAS DE FORMATAÇÃO (CRÍTICAS):
        - Usa SEMPRE Markdown profissional para as tuas respostas.
        - Para distribuições de dados ou listas de documentos, usa TABELAS Markdown.
        - Usa negrito para destacar valores importantes.
        - Estrutura as tuas análises com títulos (###) e listas de pontos.
        - Torna a tua saída visualmente organizada e fácil de ler no painel de administração.
        
        MEMÓRIA E CONTEXTO:
        - Estás numa sessão contínua. Podes referir-te a conversas anteriores se o utilizador mencionar "aquilo que fizemos antes".
        - O ID desta conversa é ${currentChatId}.
        
        REGRAS DO SISTEMA:
        1. NUNCA adivinhes nomes de tabelas (ex: profiles, favorites). Usa sempre 'get_schema' para saber quais as tabelas e colunas que REALMENTE existem.
        2. Se uma tabela não estiver no schema, ela não existe ou não tens permissão.
        3. Para utilizadores, o campo identificador é 'uid', não 'id'.
        
        TEU FLUXO DE TRABALHO:
        1. Exploração: Se precisares de saber o que existe, consulta o schema com 'get_schema'.
        2. Ação: Modifica os dados conforme solicitado usando as ferramentas. Se precisares apagar um documento, lembra-te de apagar também o ficheiro físico no Storage usando 'manage_storage'.
        3. Confirmação: Reporta as mudanças realizadas com detalhes estruturados.`,
        tools: [{
          functionDeclarations: [
            {
              name: "get_schema",
              description: "Obtém a estrutura das tabelas do banco de dados e categorias permitidas.",
              parameters: { type: Type.OBJECT, properties: {} }
            },
            {
              name: "supabase_query",
              description: "Executa operações de banco de dados (select, update, delete, insert) com filtros. Age como o motor principal de acesso aos dados.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  table: { type: Type.STRING, description: "Nome da tabela (exemplos: contents, users, profiles, etc.)" },
                  action: { type: Type.STRING, enum: ["select", "update", "delete", "insert"], description: "Operação a realizar" },
                  filter: { type: Type.OBJECT, description: "Objecto de chave-valor para filtro .eq(). Exemplo: {'id': '123'}" },
                  data: { type: Type.OBJECT, description: "Dados para inserção ou atualização" }
                },
                required: ["table", "action"]
              }
            },
            {
              name: "manage_storage",
              description: "Lista ou elimina ficheiros do Supabase Storage.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  action: { type: Type.STRING, enum: ["list", "delete"] },
                  path: { type: Type.STRING, description: "Caminho do ficheiro ou pasta" }
                },
                required: ["action", "path"]
              }
            }
          ]
        }]
      };

      let currentHistory: any[] = [...chatHistory, { role: 'user', parts: [{ text: userMessage }] }];
      let finalResponse = '';
      let turnLimit = 5;

      while (turnLimit > 0) {
        const response: any = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: currentHistory,
          config: modelConfig
        });

        const candidate = response.candidates[0];
        const assistantContent = candidate.content;
        currentHistory.push(assistantContent);

        const functionCalls = response.functionCalls;
        
        // Extract text if present
        const textParts = assistantContent.parts.filter(p => p.text).map(p => p.text);
        if (textParts.length > 0) {
          finalResponse += textParts.join('\n');
        }

        if (functionCalls && functionCalls.length > 0) {
          const results = [];
          for (const call of functionCalls) {
            const toolName = call.name as keyof typeof tools;
            try {
              const result = await tools[toolName](call.args as any);
              results.push({ name: call.name, response: result, id: call.id });
            } catch (err: any) {
              results.push({ name: call.name, response: { error: err.message }, id: call.id });
            }
          }

          currentHistory.push({
            role: 'user',
            parts: results.map(r => ({ functionResponse: r }))
          });
          
          turnLimit--;
        } else {
          // No more tools to call, we are done
          if (!finalResponse && textParts.length === 0) {
            finalResponse = response.text || 'Operação concluída.';
          }
          break;
        }
      }

      setMessages(prev => [...prev, { role: 'assistant', content: finalResponse || 'Comando processado com sucesso.' }]);
    } catch (err: any) {
      console.error('AI Error:', err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Ocorreu um erro ao comunicar com a inteligência artificial. Por favor, tenta novamente.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-160px)] flex max-w-6xl mx-auto bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden relative">
      {/* History Sidebar */}
      <AnimatePresence>
        {isHistoryOpen && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-r border-slate-100 bg-slate-50/30 flex flex-col overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-black text-slate-900 text-sm uppercase tracking-widest">Histórico</h2>
              <button 
                onClick={createNewChat}
                className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 transition-all"
                title="Novo Chat"
              >
                <PlusCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {chatHistoryList.length === 0 ? (
                <div className="text-center py-10">
                  <Clock className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-[10px] font-bold text-slate-400">Sem conversas guardadas.</p>
                </div>
              ) : (
                chatHistoryList.map(chat => (
                  <button 
                    key={chat.id}
                    onClick={() => loadChat(chat)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex group items-center gap-3 ${
                      currentChatId === chat.id 
                      ? 'border-angola-red bg-white shadow-md' 
                      : 'border-transparent hover:bg-white hover:border-slate-200'
                    }`}
                  >
                    <MessageSquare className={`w-4 h-4 shrink-0 ${currentChatId === chat.id ? 'text-angola-red' : 'text-slate-300'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold truncate ${currentChatId === chat.id ? 'text-slate-900' : 'text-slate-500'}`}>
                        {chat.title}
                      </p>
                      <p className="text-[8px] font-black text-slate-300 uppercase mt-1">
                        {new Date(chat.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <button 
                      onClick={(e) => deleteChat(e, chat.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              className={`p-3 rounded-2xl transition-all ${isHistoryOpen ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              <History className="w-5 h-5" />
            </button>
            <div className="bg-angola-red p-3 rounded-2xl text-white shadow-lg shadow-angola-red/20 rotate-3">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">IA Manager</h1>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Acesso de Administrador Ativo</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <div className="p-2 px-4 bg-slate-100 rounded-xl flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-600">DB Live</span>
            </div>
          </div>
        </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth scrollbar-thin scrollbar-thumb-slate-200"
      >
        {messages.map((m, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`flex items-start gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
              m.role === 'assistant' ? 'bg-slate-900 text-white' : 'bg-angola-red text-white'
            }`}>
              {m.role === 'assistant' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
            </div>
            
            <div className={`max-w-[80%] p-4 rounded-[1.5rem] text-sm leading-relaxed font-bold ${
              m.role === 'assistant' 
              ? 'bg-slate-100 text-slate-700 rounded-tl-none' 
              : 'bg-angola-red text-white rounded-tr-none'
            }`}>
              {m.role === 'assistant' ? (
                <div className="prose prose-slate prose-sm max-w-none">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              ) : (
                m.content
              )}
            </div>
          </motion.div>
        ))}
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
            <div className="bg-slate-100 p-4 rounded-[1.5rem] rounded-tl-none">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Suggestion Bubbles */}
      {!loading && messages.length < 5 && (
        <div className="px-6 pb-4 flex flex-wrap gap-2">
          {[
            "Faz um resumo completo das estatísticas do sistema",
            "Lista os 5 documentos mais recentes e o seu estado",
            "Procura o utilizador com email 'exempl@gmail.com'",
            "Quais categorias têm menos documentos?",
            "Verifica se há documentos pendentes para aprovar"
          ].map((s, i) => (
            <button 
              key={i}
              onClick={() => { setInput(s); }}
              className="px-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-500 hover:border-slate-900 hover:text-slate-900 transition-all shadow-sm"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-6 border-t border-slate-100 bg-white">
        <div className="relative group">
          <input 
            type="text" 
            placeholder="Escreve aqui o que precisas que eu faça..."
            className="w-full pl-6 pr-16 py-5 bg-slate-50 border-2 border-transparent focus:border-slate-900 rounded-[2rem] outline-none transition-all font-bold text-slate-800 placeholder:text-slate-400"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-4 bg-slate-900 text-white rounded-[1.5rem] shadow-xl hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-[10px] text-center mt-4 text-slate-400 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
          <ShieldAlert className="w-3 h-3" /> Assistente com acesso total. Tem cuidado ao solicitar eliminações.
        </p>
      </div>
    </div>
    </div>
  );
}
