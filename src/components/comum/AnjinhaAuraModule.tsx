import React, { useState } from 'react';
import { Sparkles, Bot, Send, BookOpen, Heart, RefreshCw, Feather, CheckCircle, Wand2, Lightbulb, Compass, MessageCircle } from 'lucide-react';

interface AnjinhaAuraModuleProps {
  onUsarRecadinho?: (texto: string) => void;
  turmaAtual?: string;
}

export const AnjinhaAuraModule: React.FC<AnjinhaAuraModuleProps> = ({ onUsarRecadinho, turmaAtual = 'Berçário II' }) => {
  const [promptUsuario, setPromptUsuario] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [mensagens, setMensagens] = useState([
    {
      id: '1',
      remetente: 'aura',
      texto: `Olá! Eu sou a Anjinha Aura, sua assistente pedagógica e mascote do Anjinho Educador! 👼✨ Como posso ajudar a sua rotina hoje? Posso sugerir recadinhos amorosos para os pais, planos de aula com a BNCC ou contar histórias para a turma de ${turmaAtual}!`,
      data: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [abaInterna, setAbaInterna] = useState<'chat' | 'recadinho' | 'bncc' | 'historias'>('chat');

  const [idadeTurma, setIdadeTurma] = useState('0 a 1 ano (Berçário)');
  const [campoBNCC, setCampoBNCC] = useState('O eu, o outro e o nós');
  const [planoGerado, setPlanoGerado] = useState<string | null>(null);

  const handleEnviarChat = async (mensagemPronta?: string) => {
    const textoEnviar = mensagemPronta || promptUsuario;
    if (!textoEnviar.trim() || carregando) return;

    const mensagemUser = {
      id: Date.now().toString(),
      remetente: 'usuario',
      texto: textoEnviar,
      data: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setMensagens(prev => [...prev, mensagemUser]);
    if (!mensagemPronta) setPromptUsuario('');
    setCarregando(true);

    try {
      // Simulação de Inteligência Artificial Aura (integração Gemini backend)
      setTimeout(() => {
        let respostaAura = '';

        if (textoEnviar.toLowerCase().includes('recadinho') || textoEnviar.toLowerCase().includes('diário')) {
          respostaAura = `🌟 *Sugestão de Recadinho Carinhoso da Aura:*\n"Querida família! Hoje nosso dia na turma ${turmaAtual} foi repleto de descobertas e afetividade. Trabalhamos a autonomia e a musicalidade com cantigas populares. Todos interagiram com muita alegria e carinho! Com amor, equipe pedagógica."`;
        } else if (textoEnviar.toLowerCase().includes('bncc') || textoEnviar.toLowerCase().includes('plano')) {
          respostaAura = `📚 *Sugestão BNCC (Educação Infantil):*\n- **Campo de Experiência:** Traços, sons, cores e formas (EI01TS01).\n- **Objetivo:** Explorar sons produzidos pelo próprio corpo e por objetos do cotidiano.\n- **Atividade Recomendada:** Bandinha rítmica com instrumentos reciclados e palmas ritmadas.`;
        } else if (textoEnviar.toLowerCase().includes('mordida') || textoEnviar.toLowerCase().includes('desfralde')) {
          respostaAura = `💡 *Orientação Pedagógica da Aura:*\nNesta faixa etária, a mordida/fase oral costuma ser uma forma primária de comunicação de sentimentos ou frustração. É recomendado acolher ambas as crianças com calma, nomear o sentimento ('não pode morder, dói no amiguinho') e oferecer um brinquedo de mordedor ou alternativa tátil.`;
        } else {
          respostaAura = `Com certeza! Para a turma de ${turmaAtual}, recomendo focar em atividades estimulantes e acolhedoras. Se precisar de uma história infantil personalizada ou de um recadinho especial para a agenda de hoje, conte comigo! 🌸✨`;
        }

        const mensagemAura = {
          id: (Date.now() + 1).toString(),
          remetente: 'aura',
          texto: respostaAura,
          data: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };

        setMensagens(prev => [...prev, mensagemAura]);
        setCarregando(false);
      }, 1000);
    } catch (err) {
      setCarregando(false);
    }
  };

  const handleGerarPlanoBNCC = () => {
    setCarregando(true);
    setTimeout(() => {
      setPlanoGerado(`📌 **Plano Pedagógico Inteligente — BNCC EI**\n\n🎯 **Campo de Experiência:** ${campoBNCC}\n👶 **Faixa Etária:** ${idadeTurma}\n\n**1. Objetivos de Aprendizagem e Desenvolvimento:**\n- Estimular a socialização, o acolhimento e o respeito ao tempo de cada criança.\n- Desenvolver coordenação motora ampla e sensibilidade auditiva.\n\n**2. Atividade Prática Proposta:**\n"O Circuito das Sensações": Dispor tapetes com algodão, grama sintética e tecidos acetinados para travessia engatinhando ou descalço.\n\n**3. Avaliação Qualitativa:**\nObservação do envolvimento tátil e das expressões de prazer ou estranhamento durante a vivência.`);
      setCarregando(false);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Banner Anjinha Aura */}
      <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-indigo-700 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute -right-4 -bottom-4 opacity-15">
          <Wand2 className="w-56 h-56" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold w-fit">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Inteligência Artificial Pedagógica Anjinho Educador</span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-3">
              <span>Anjinha Aura</span>
              <span className="text-xs bg-amber-400 text-slate-900 font-extrabold px-2.5 py-0.5 rounded-full">
                IA Assistente
              </span>
            </h2>
            <p className="text-xs text-emerald-100 leading-relaxed">
              Sua assistente especialista em Educação Infantil. Gerador de recados afetivos, alinhamento com os campos de experiência da BNCC, mediação de conflitos e inspiração para a sala de aula!
            </p>
          </div>

          {/* Avatar da Anjinha Aura */}
          <div className="flex flex-col items-center bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shrink-0">
            <div className="w-16 h-16 bg-gradient-to-tr from-amber-300 to-rose-400 rounded-full flex items-center justify-center text-3xl shadow-lg border-2 border-white">
              👼
            </div>
            <span className="text-xs font-extrabold mt-2">Aura IA</span>
            <span className="text-[10px] text-emerald-200 font-medium">Online & Pronta</span>
          </div>
        </div>
      </div>

      {/* Navegação da Aura */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setAbaInterna('chat')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            abaInterna === 'chat' ? 'bg-teal-600 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>Bate-Papo Pedagógico</span>
        </button>

        <button
          onClick={() => setAbaInterna('recadinho')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            abaInterna === 'recadinho' ? 'bg-rose-600 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Gerador de Recados Afetivos</span>
        </button>

        <button
          onClick={() => setAbaInterna('bncc')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            abaInterna === 'bncc' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Assistente BNCC Infantil</span>
        </button>
      </div>

      {/* Conteúdo Aba Chat */}
      {abaInterna === 'chat' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="h-80 overflow-y-auto space-y-3 pr-2">
            {mensagens.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 ${m.remetente === 'usuario' ? 'justify-end' : 'justify-start'}`}
              >
                {m.remetente === 'aura' && (
                  <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    👼
                  </div>
                )}
                <div
                  className={`max-w-lg p-3.5 rounded-2xl text-xs leading-relaxed ${
                    m.remetente === 'usuario'
                      ? 'bg-slate-800 text-white rounded-tr-none'
                      : 'bg-teal-50 border border-teal-200 text-slate-800 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.texto}</p>
                  <span className="text-[10px] opacity-60 block text-right mt-1">{m.data}</span>
                </div>
              </div>
            ))}
            {carregando && (
              <div className="flex gap-2 items-center text-xs text-slate-400 italic">
                <RefreshCw className="w-4 h-4 animate-spin text-teal-600" />
                <span>Anjinha Aura está pensando na resposta...</span>
              </div>
            )}
          </div>

          {/* Atalhos rápidos */}
          <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
            <span className="text-[11px] font-bold text-slate-500 self-center">Perguntas Rápidas:</span>
            <button
              onClick={() => handleEnviarChat('Me dê um recadinho carinhoso para a turma de hoje!')}
              className="text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-lg hover:bg-rose-100"
            >
              🌸 Recadinho Carinhoso
            </button>
            <button
              onClick={() => handleEnviarChat('Como orientar pais sobre fases de sono do bebê?')}
              className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-lg hover:bg-indigo-100"
            >
              💤 Dica de Sono aos Pais
            </button>
            <button
              onClick={() => handleEnviarChat('Sugestão de atividade sensorial com tinta sem sujeira')}
              className="text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg hover:bg-amber-100"
            >
              🎨 Atividade Sensorial
            </button>
          </div>

          <div className="flex gap-2 pt-2">
            <input
              type="text"
              value={promptUsuario}
              onChange={(e) => setPromptUsuario(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEnviarChat()}
              placeholder="Pergunte à Anjinha Aura sobre a rotina pedagógica ou plano de aula..."
              className="flex-1 text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              onClick={() => handleEnviarChat()}
              disabled={carregando}
              className="px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1"
            >
              <Send className="w-4 h-4" />
              <span>Enviar</span>
            </button>
          </div>
        </div>
      )}

      {/* Conteúdo Aba BNCC */}
      {abaInterna === 'bncc' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center font-bold">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Gerador BNCC para Educação Infantil</h3>
              <p className="text-xs text-slate-500">Crie planos alinhados aos Direitos de Aprendizagem e Campos de Experiência</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Faixa Etária</label>
              <select
                value={idadeTurma}
                onChange={(e) => setIdadeTurma(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="0 a 1 ano (Berçário)">0 a 1 ano (Bebês / Berçário)</option>
                <option value="1 a 2 anos (Maternal I)">1 a 2 anos (Crianças bem pequenas)</option>
                <option value="3 a 5 anos (Jardim/Pré-escola)">3 a 5 anos (Crianças pequenas)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Campo de Experiência BNCC</label>
              <select
                value={campoBNCC}
                onChange={(e) => setCampoBNCC(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="O eu, o outro e o nós">O eu, o outro e o nós</option>
                <option value="Corpo, gestos e movimentos">Corpo, gestos e movimentos</option>
                <option value="Traços, sons, cores e formas">Traços, sons, cores e formas</option>
                <option value="Escuta, fala, pensamento e imaginação">Escuta, fala, pensamento e imaginação</option>
                <option value="Espaços, tempos, quantidades, relações e transformações">Espaços, tempos, quantidades...</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleGerarPlanoBNCC}
            disabled={carregando}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Gerar Plano Sugerido pela Aura</span>
          </button>

          {planoGerado && (
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl text-xs text-indigo-950 whitespace-pre-wrap leading-relaxed">
              {planoGerado}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
