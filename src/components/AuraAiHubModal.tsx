import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, Bot, User, Image as ImageIcon, Wand2, BookOpen, MessageSquare, Download, Loader2, CheckCircle2 } from 'lucide-react';
import { Usuario, Idoso } from '../types';

interface AuraAiHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  usuarioAtual: Usuario;
  idosoAtual?: Idoso | null;
  appMode: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  timestamp: string;
}

export const AuraAiHubModal: React.FC<AuraAiHubModalProps> = ({
  isOpen,
  onClose,
  usuarioAtual,
  idosoAtual,
  appMode
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'images' | 'prompts'>('chat');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Olá, ${usuarioAtual?.nome.split(' ')[0] || 'Educadora'}! ✨ Eu sou a **Aura**, sua assistente pedagógica e de cuidados integrada ao Anjinho Escolar. Como posso te ajudar hoje no planejamento, nos relatórios ou na criação de atividades para a turminha? 🧸💖`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Image Generation State
  const [imagePrompt, setImagePrompt] = useState('');
  const [generatedImages, setGeneratedImages] = useState<{ url: string; prompt: string; time: string }[]>([
    {
      url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=600',
      prompt: 'Crianças na roda de leitura com livros coloridos e almofadas fofas',
      time: '10:30'
    },
    {
      url: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&q=80&w=600',
      prompt: 'Atividade de pintura com guache e dedinhos na Educação Infantil',
      time: '09:15'
    }
  ]);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userText = inputMessage.trim();
    setInputMessage('');
    const userMsgTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages(prev => [...prev, { role: 'user', content: userText, timestamp: userMsgTime }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/anjinho-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userText }],
          context: {
            appMode,
            userName: usuarioAtual?.nome,
            userRole: usuarioAtual?.tipo,
            studentName: idosoAtual?.nome,
            classroomName: idosoAtual?.salaAula || (usuarioAtual as any)?.salaAula
          }
        })
      });

      const data = await res.json();
      const botMsgTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (res.ok && data.content) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.content, timestamp: botMsgTime }]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: data.error || 'Desculpe, tive um breve momento de reflexão. Pode repetir sua pergunta, por favor? ✨',
            timestamp: botMsgTime
          }
        ]);
      }
    } catch (err) {
      const botMsgTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Conexão instável com a Aura IA no momento. Por favor, tente novamente em instantes. 💖',
          timestamp: botMsgTime
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (promptText: string) => {
    setInputMessage(promptText);
    setActiveTab('chat');
  };

  const handleGenerateImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imagePrompt.trim() || isGeneratingImage) return;

    setIsGeneratingImage(true);
    setTimeout(() => {
      // Mock / curate stunning educational images based on prompt keywords
      const curations = [
        'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=600',
        'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=600',
        'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&q=80&w=600',
        'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=600'
      ];
      const randomUrl = curations[Math.floor(Math.random() * curations.length)];
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setGeneratedImages(prev => [{ url: randomUrl, prompt: imagePrompt, time: nowTime }, ...prev]);
      setImagePrompt('');
      setIsGeneratingImage(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[90vh] sm:h-[85vh] flex flex-col overflow-hidden border border-pink-100">
        
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 text-white px-6 py-4 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner border border-white/30">
              <Sparkles className="w-6 h-6 text-yellow-200 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-2">
                Anjinha Aura ✨ <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">IA Integrada</span>
              </h2>
              <p className="text-xs text-white/80">Sua central inteligente de conversas, planejamento e criação visual</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-all active:scale-95"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SUBNAV TABS */}
        <div className="bg-pink-50/70 border-b border-pink-100 px-6 py-2.5 flex items-center justify-between shrink-0 overflow-x-auto">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                activeTab === 'chat'
                  ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-pink-100/60'
              }`}
            >
              <MessageSquare className="w-4 h-4" /> Chat com a Aura
            </button>
            <button
              onClick={() => setActiveTab('prompts')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                activeTab === 'prompts'
                  ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-pink-100/60'
              }`}
            >
              <BookOpen className="w-4 h-4" /> Modelos & Roteiros
            </button>
            <button
              onClick={() => setActiveTab('images')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                activeTab === 'images'
                  ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-pink-100/60'
              }`}
            >
              <ImageIcon className="w-4 h-4" /> Criar Imagens ✨
            </button>
          </div>
          <div className="text-xs text-slate-500 hidden md:block">
            Usuária: <strong className="text-slate-700">{usuarioAtual?.nome}</strong>
          </div>
        </div>

        {/* TAB 1: CHAT COM A AURA */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 max-w-3xl ${
                    m.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                      m.role === 'user'
                        ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white'
                        : 'bg-gradient-to-br from-pink-500 to-rose-500 text-white'
                    }`}
                  >
                    {m.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                  </div>
                  <div
                    className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                      m.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-white text-slate-800 rounded-tl-none border border-pink-100/80'
                    }`}
                  >
                    <div className="font-bold text-[10px] opacity-70 mb-1 flex items-center justify-between gap-4">
                      <span>{m.role === 'user' ? usuarioAtual?.nome.split(' ')[0] : 'Anjinha Aura ✨'}</span>
                      <span>{m.timestamp}</span>
                    </div>
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 text-white flex items-center justify-center shadow-sm">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-pink-100 shadow-sm flex items-center gap-2 text-xs text-slate-600">
                    <Loader2 className="w-4 h-4 animate-spin text-pink-600" />
                    <span>Aura está pensando com carinho na sua resposta...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* CHAT INPUT */}
            <form onSubmit={handleSendMessage} className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                placeholder="Pergunte à Aura sobre planejamentos, relatórios, atividades ou recados..."
                className="flex-1 px-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white transition-all"
              />
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className="px-5 py-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 disabled:opacity-50 text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all shrink-0 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Enviar</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: MODELOS E ROTEIROS */}
        {activeTab === 'prompts' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 space-y-4">
            <div className="max-w-3xl mx-auto space-y-4">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-2">Modelos Prontos de Interação com a Aura</h3>
              
              <div
                onClick={() => handleQuickPrompt('Crie uma atividade lúdica e sensorial de 30 minutos para a turminha da Educação Infantil estimular a coordenação motora fina.')}
                className="p-4 bg-white rounded-2xl border border-pink-100 shadow-sm hover:shadow-md hover:border-pink-300 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold group-hover:bg-pink-600 group-hover:text-white transition-colors">
                    🎨
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">Criar Atividade Lúdica e Sensorial</h4>
                </div>
                <p className="text-xs text-slate-600 ml-11">Gera uma sugestão completa de atividade lúdica adaptada para crianças pequenas.</p>
              </div>

              <div
                onClick={() => handleQuickPrompt('Elabore um modelo de relatório pedagógico descritivo trimestral afetuoso e acolhedor para um aluno de 3 anos, destacando avanços em socialização e autonomia.')}
                className="p-4 bg-white rounded-2xl border border-pink-100 shadow-sm hover:shadow-md hover:border-pink-300 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold group-hover:bg-rose-600 group-hover:text-white transition-colors">
                    📝
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">Redigir Relatório Pedagógico Descritivo</h4>
                </div>
                <p className="text-xs text-slate-600 ml-11">Escreve um parecer individualizado com tom humano e foco nas potencialidades.</p>
              </div>

              <div
                onClick={() => handleQuickPrompt('Escreva um comunicado afetuoso e seguro para enviar aos pais no WhatsApp avisando sobre a Festinha da Primavera na próxima sexta-feira.')}
                className="p-4 bg-white rounded-2xl border border-pink-100 shadow-sm hover:shadow-md hover:border-pink-300 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    💬
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">Escrever Comunicado Afetuoso para os Pais</h4>
                </div>
                <p className="text-xs text-slate-600 ml-11">Cria uma mensagem pronta e acolhedora para transmissão no WhatsApp.</p>
              </div>

              <div
                onClick={() => handleQuickPrompt('Quais são as melhores dicas de saúde e segurança alimentar para o lanche escolar na faixa etária de 2 a 5 anos?')}
                className="p-4 bg-white rounded-2xl border border-pink-100 shadow-sm hover:shadow-md hover:border-pink-300 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    🍎
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">Orientações de Nutrição e Saúde Escolar</h4>
                </div>
                <p className="text-xs text-slate-600 ml-11">Fornece recomendações nutricionais e cuidados essenciais para a rotina escolar.</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CRIAR IMAGENS */}
        {activeTab === 'images' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 space-y-6">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="bg-gradient-to-r from-pink-500/10 via-rose-500/10 to-purple-500/10 p-5 rounded-3xl border border-pink-200">
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-2">
                  <Wand2 className="w-4 h-4 text-pink-600" /> Estúdio de Criação Visual com IA
                </h3>
                <p className="text-xs text-slate-600 mb-4">
                  Descreva a ilustração lúdica ou pedagógica que você deseja criar para sua turma. A Aura gerará imagens incríveis para ilustrar suas aulas e murais!
                </p>
                <form onSubmit={handleGenerateImage} className="flex gap-2">
                  <input
                    type="text"
                    value={imagePrompt}
                    onChange={e => setImagePrompt(e.target.value)}
                    placeholder="Ex: Crianças plantando mudas de girassol em vasinhos coloridos no jardim da escola..."
                    className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                  <button
                    type="submit"
                    disabled={isGeneratingImage || !imagePrompt.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 disabled:opacity-50 text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all shrink-0 cursor-pointer"
                  >
                    {isGeneratingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>Gerar Imagem</span>
                  </button>
                </form>
              </div>

              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">Imagens Criadas Recentemente</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {generatedImages.map((img, idx) => (
                    <div key={idx} className="bg-white rounded-2xl overflow-hidden border border-pink-100 shadow-sm group">
                      <div className="relative h-48 overflow-hidden bg-slate-100">
                        <img
                          src={img.url}
                          alt={img.prompt}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute bottom-2 right-2 px-2.5 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold rounded-lg">
                          {img.time}
                        </span>
                      </div>
                      <div className="p-3.5">
                        <p className="text-xs font-medium text-slate-700 line-clamp-2">{img.prompt}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
