import { useState, useRef, useEffect } from 'react';
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
  
  // Advanced State
  const [systemState, setSystemState] = useState({
    totalUsers: 0,
    totalContents: 0,
    pendingApprovals: 0,
    lastUpdate: new Date().toISOString()
  });
  const [pendingAction, setPendingAction] = useState<any>(null);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // Load system stats for context
  useEffect(() => {
    const fetchStats = async () => {
      const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
      const { count: contentCount } = await supabase.from('contents').select('*', { count: 'exact', head: true });
      const { count: pendingCount } = await supabase.from('contents').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      
      setSystemState({
        totalUsers: userCount || 0,
        totalContents: contentCount || 0,
        pendingApprovals: pendingCount || 0,
        lastUpdate: new Date().toISOString()
      });
    };
    fetchStats();
  }, []);

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
          users: ["uid", "email", "display_name", "role", "purchased_bundle_ids", "favorite_ids", "created_at"]
        },
        relationships: "contents.user_id links to users.uid",
        categories: CATEGORIES
      };
    },
    supabase_query: async ({ table, action, filter, data, confirmed }: { table: string, action: 'select' | 'update' | 'delete' | 'insert', filter?: any, data?: any, confirmed?: boolean }) => {
      // Security: Require confirmation for destructive actions
      if ((action === 'delete' || action === 'update') && !confirmed) {
        return { 
          requires_confirmation: true, 
          action, 
          table, 
          filter, 
          data,
          warning: `ATENÇÃO: Estás prestes a ${action === 'delete' ? 'ELIMINAR' : 'ATUALIZAR'} dados na tabela '${table}'.`
        };
      }

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

  const handleSend = async (overrideMessage?: string) => {
    if (!overrideMessage && (!input.trim() || loading)) return;

    const userMessage = overrideMessage || input.trim();
    if (!overrideMessage) setInput('');
    
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // History Optimization: Only send last 10 messages to avoid token bloat
      const recentMessages = messages.slice(-10);
      const chatHistory = recentMessages.map(m => ({ 
        role: m.role, 
        parts: [{ text: m.content }] 
      }));

      const modelConfig = {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        systemInstruction: `És o Administrador Supremo de IA da BukiAngolano.
        Tens autoridade total sobre o banco de dados (Supabase) e o Storage.
        
        ESTADO ATUAL DO SISTEMA:
        - Utilizadores Totais: ${systemState.totalUsers}
        - Documentos Totais: ${systemState.totalContents}
        - Aprovações Pendentes: ${systemState.pendingApprovals}
        - Última Sincronização: ${systemState.lastUpdate}
        
        PRIORIDADES OPERACIONAIS:
        1. Segurança em Primeiro Lugar: Minimizar operações destrutivas acidentais.
        2. Verificação de Dados: Sempre preferir 'SELECT' para confirmar dados antes de aplicar 'UPDATE' ou 'DELETE'.
        3. Integridade: Ao apagar um conteúdo, sempre verificar se existem ficheiros associados no Storage.
        
        COMPORTAMENTO E ÉTICA:
        - Transparência: Explica sempre o impacto de uma ação antes de a executares.
        - Prevenção: Se o utilizador pedir algo perigoso sem filtros claros, pede clarificação.
        - Estrutura: Usa TABELAS para listas e negrito para IDs e valores críticos.
        
        REGRAS DE TOOLS:
        - 'supabase_query': Se a resposta for 'requires_confirmation', deves informar o utilizador sobre o que vais fazer exatamente e pedir que ele confirme carregando no botão que aparecerá (ou dizendo "sim"). NÃO podes forçar a confirmação via código se o tool pedir.
        - 'get_schema': Usa sempre este tool antes de assumires colunas de tabelas.
        
        MEMÓRIA: ID da Conversa: ${currentChatId}.`,
        tools: [{
          functionDeclarations: [
            {
              name: "get_schema",
              description: "Obtém a estrutura das tabelas do banco de dados e categorias permitidas.",
              parameters: { type: Type.OBJECT, properties: {} }
            },
            {
              name: "supabase_query",
              description: "Executa operações de banco de dados (select, update, delete, insert) com filtros.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  table: { type: Type.STRING },
                  action: { type: Type.STRING, enum: ["select", "update", "delete", "insert"] },
                  filter: { type: Type.OBJECT },
                  data: { type: Type.OBJECT },
                  confirmed: { type: Type.BOOLEAN, description: "Deve ser true apenas se o utilizador confirmou explicitamente a ação destrutiva." }
                },
                required: ["table", "action"]
              }
            },
            {
              name: "manage_storage",
              description: "Gere ficheiros no storage.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  action: { type: Type.STRING, enum: ["list", "delete"] },
                  path: { type: Type.STRING }
                },
                required: ["action", "path"]
              }
            }
          ]
        }]
      };

      let currentHistory: any[] = [...chatHistory, { role: 'user', parts: [{ text: userMessage }] }];
      let finalResponse = '';
      let turnLimit = 10; // Robust loop
      let toolCalledInThisTurn = false;

      while (turnLimit > 0) {
        toolCalledInThisTurn = false;
        const response: any = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: currentHistory,
          config: modelConfig
        });

        const candidate = response.candidates[0];
        const assistantContent = candidate.content;
        currentHistory.push(assistantContent);

        const functionCalls = response.functionCalls;
        
        const textParts = assistantContent.parts.filter(p => p.text).map(p => p.text);
        if (textParts.length > 0) {
          finalResponse += (finalResponse ? '\n\n' : '') + textParts.join('\n');
        }

        if (functionCalls && functionCalls.length > 0) {
          toolCalledInThisTurn = true;
          const results = [];
          for (const call of functionCalls) {
            const toolName = call.name as keyof typeof tools;
            try {
              const result: any = await tools[toolName](call.args as any);
              
              // Handle Confirmation Request from Tool
              if (result.requires_confirmation) {
                setPendingAction(call.args);
                finalResponse += "\n\n⚠️ **ESTA AÇÃO REQUER CONFIRMAÇÃO MANUAL.**\nPor favor, verifica os detalhes abaixo e confirma se desejas prosseguir.";
                // We stop the AI loop here because we need user input
                turnLimit = 0;
              }

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
          break;
        }
      }

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: finalResponse || 'Comando processado.',
        type: toolCalledInThisTurn ? 'action' : 'text'
      }]);
    } catch (err: any) {
      console.error('AI Error:', err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Ocorreu um erro ao comunicar com a inteligência artificial. Por favor, tenta novamente.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] flex w-full bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden relative">
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
                  <div 
                    key={chat.id}
                    onClick={() => loadChat(chat)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex group items-center gap-3 cursor-pointer ${
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
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3 md:gap-4">
            <button 
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              className={`p-2.5 rounded-xl transition-all ${isHistoryOpen ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              <History className="w-5 h-5" />
            </button>
            <div className="bg-angola-red p-2.5 rounded-xl text-white shadow-lg shadow-angola-red/20 rotate-3">
              <Bot className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black text-slate-900">IA Manager</h1>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-black text-slate-400 upper tracking-widest">Sistema Ativo</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={createNewChat}
              className="md:hidden p-2.5 bg-slate-100 rounded-xl text-slate-600"
            >
              <PlusCircle className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex p-2 px-4 bg-white border border-slate-200 rounded-xl items-center gap-2">
              <Database className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-600">DB Live</span>
            </div>
          </div>
        </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 scroll-smooth scrollbar-thin scrollbar-thumb-slate-200"
      >
        <div className="max-w-5xl mx-auto space-y-8">
          {messages.map((m, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex items-start gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border ${
                m.role === 'assistant' ? 'bg-slate-900 text-white border-slate-800' : 'bg-angola-red text-white border-red-600'
              }`}>
                {m.role === 'assistant' ? <Bot className="w-5 h-5 md:w-6 md:h-6" /> : <User className="w-5 h-5 md:w-6 md:h-6" />}
              </div>
              
              <div className={`max-w-[85%] md:max-w-[80%] p-4 md:p-6 rounded-[1.8rem] text-sm md:text-base leading-relaxed font-bold relative group shadow-sm ${
                m.role === 'assistant' 
                ? 'bg-slate-50 text-slate-700 rounded-tl-none border border-slate-100' 
                : 'bg-angola-red text-white rounded-tr-none shadow-lg shadow-red-900/10'
              }`}>
              {m.role === 'assistant' && (
                <div className="absolute -right-2 -top-2 flex gap-1">
                  {m.type === 'action' && (
                    <div className="bg-emerald-500 text-white p-1 rounded-full shadow-lg" title="Ação de banco de dados executada">
                      <Database className="w-3 h-3" />
                    </div>
                  )}
                  {m.type === 'status' && (
                    <div className="bg-blue-500 text-white p-1 rounded-full shadow-lg" title="Estado do sistema atualizado">
                      <Sparkles className="w-3 h-3" />
                    </div>
                  )}
                </div>
              )}
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
        
        {/* Pending Action Confirmation UI */}
        {pendingAction && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-amber-50 border-2 border-amber-200 p-6 rounded-[2rem] space-y-4 shadow-xl"
          >
            <div className="flex items-center gap-3 text-amber-700">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="font-black text-lg">Confirmação de Segurança</h3>
            </div>
            
            <div className="bg-white/50 p-4 rounded-2xl font-mono text-xs space-y-2 border border-amber-100">
              <p><span className="font-black text-amber-800">Ação:</span> {pendingAction.action.toUpperCase()}</p>
              <p><span className="font-black text-amber-800">Tabela:</span> {pendingAction.table}</p>
              {pendingAction.filter && (
                <p><span className="font-black text-amber-800">Filtro:</span> {JSON.stringify(pendingAction.filter)}</p>
              )}
              {pendingAction.data && (
                <p><span className="font-black text-amber-800">Dados:</span> {JSON.stringify(pendingAction.data)}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={async () => {
                  const action = { ...pendingAction, confirmed: true };
                  setPendingAction(null);
                  handleSend(`Executa a ação confirmada: ${action.action} em ${action.table} com os dados/filtros previamente discutidos.`); 
                }}
                className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-black shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" /> Confirmar e Executar
              </button>
              <button 
                onClick={() => setPendingAction(null)}
                className="flex-1 bg-white border border-slate-200 text-slate-500 py-3 rounded-xl font-black hover:bg-slate-50 flex items-center justify-center gap-2"
              >
                <XCircle className="w-5 h-5" /> Cancelar
              </button>
            </div>
          </motion.div>
        )}

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
      </div>

      {/* Suggestion Bubbles */}
      {!loading && messages.length < 3 && (
        <div className="px-6 pb-2 flex flex-wrap gap-2">
          {[
            "Resumo das estatísticas",
            "Docs recentes",
            "Procurar utilizador",
            "Docs pendentes"
          ].map((s, i) => (
            <button 
              key={i}
              onClick={() => { setInput(s); }}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-slate-500 hover:border-slate-900 hover:text-slate-900 transition-all shadow-sm"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-4 md:p-6 border-t border-slate-100 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
        <div className="relative group max-w-4xl mx-auto">
          <input 
            type="text" 
            placeholder="Escreve aqui..."
            className="w-full pl-6 pr-16 py-4 bg-slate-50 border-2 border-transparent focus:border-slate-900 rounded-[1.5rem] md:rounded-[2rem] outline-none transition-all font-bold text-slate-800 placeholder:text-slate-400 text-sm md:text-base"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
          />
          <button 
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-slate-900 text-white rounded-[1.2rem] shadow-xl hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-[9px] text-center mt-3 text-slate-400 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
          <ShieldAlert className="w-3 h-3" /> IA Manager Ativo
        </p>
      </div>
    </div>
    </div>
  );
}
