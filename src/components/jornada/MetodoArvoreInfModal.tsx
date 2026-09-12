import React, { useState } from 'react';
import { X, Sparkles, Heart, ShieldCheck, Scale, History, UserCheck, Lock } from 'lucide-react';
import { MULTIPLICADORES_CAMADA_OCULTA } from '../../services/metodoArvoreEngine';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function MetodoArvoreInfModal({ isOpen, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'geral' | 'multiplicadores'>('geral');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-100 overflow-hidden relative animate-in zoom-in-95 duration-200">
        {/* Header com Botão de Fechar */}
        <div className="bg-gradient-to-b from-slate-50 to-white p-6 pb-4 border-b border-slate-100 relative text-center">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            title="Fechar"
          >
            <X size={20} />
          </button>

          <div className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 text-indigo-900 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-2">
            <Sparkles size={12} className="text-indigo-600" />
            <span>Método Árvore da Infância®</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Especificação Oficial da Metodologia
          </h2>
          <p className="text-[11px] font-black uppercase text-slate-500 tracking-wider mt-0.5">
            ARQUITETURA DA CAMADA VISÍVEL & CAMADA OCULTA DE INTELIGÊNCIA
          </p>

          {/* Abas Internas de Navegação */}
          <div className="flex justify-center gap-2 mt-4">
            <button
              onClick={() => setActiveTab('geral')}
              className={`px-4 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                activeTab === 'geral'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              📖 Visão Geral & Regras
            </button>
            <button
              onClick={() => setActiveTab('multiplicadores')}
              className={`px-4 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                activeTab === 'multiplicadores'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ⚙️ Multiplicadores da Camada Oculta
            </button>
          </div>
        </div>

        {/* Conteúdo do Modal (com scroll) */}
        <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
          {activeTab === 'geral' ? (
            <>
              {/* Parágrafo Introdutório */}
              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                O <strong className="text-slate-900 font-bold">Método Árvore da Infância®</strong> possui duas camadas totalmente integradas para garantir afetividade na apresentação e inteligência precisa no acompanhamento:
              </p>

              {/* Camada 1: CAMADA VISÍVEL */}
              <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 sm:p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-200/60 px-2.5 py-1 rounded-md inline-block">
                    1. CAMADA VISÍVEL (AFETIVA & NARRATIVA)
                  </span>
                  <span className="text-[11px] font-bold text-amber-800">Sem notas • Sem rankings</span>
                </div>
                <p className="text-xs sm:text-sm text-amber-950 font-medium leading-relaxed">
                  Totalmente livre de rankings, notas frias ou tabelas competitivas. Pais e educadores contemplam o amadurecimento natural da árvore nas <strong className="font-bold">Estações da Vida</strong>, marcos de conquistas e narrativas poéticas que valorizam a história única de cada criança.
                </p>
              </div>

              {/* Camada 2: CAMADA OCULTA */}
              <div className="bg-indigo-50/80 border border-indigo-200/80 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-900 bg-indigo-200/60 px-2.5 py-1 rounded-md inline-block">
                    2. CAMADA OCULTA (INTELIGÊNCIA & EQUIDADE)
                  </span>
                  <span className="text-[11px] font-bold text-indigo-800 flex items-center gap-1">
                    <Lock size={12} /> Motor Silencioso
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-indigo-950 font-medium leading-relaxed">
                  Interpreta os registros cotidianos considerando a faixa etária, frequência, recorrência e histórico individual:
                </p>

                <ul className="space-y-2 text-xs sm:text-sm text-indigo-900/90 font-medium leading-relaxed pl-1">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span>
                      <strong className="text-indigo-950 font-bold">Berçário & Maternal:</strong> O cuidado essencial (sono, alimentação, higiene, hidratação) possui prioridade máxima para consagrar a rotina vital.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span>
                      <strong className="text-indigo-950 font-bold">Pré-Escola & Jardim:</strong> Os marcos socioemocionais (gentileza, cooperação, autonomia) tornam-se o vetor central de maturidade.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span>
                      <strong className="text-indigo-950 font-bold">Preservação Permanente:</strong> A árvore NUNCA reseta no novo ano letivo. As conquistas acumulam-se continuamente (Ano 1 → Ano 2 → Ano 3).
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span>
                      <strong className="text-indigo-950 font-bold">Regra da Individualidade:</strong> A referência é sempre a própria trajetória da criança, nunca a comparação com colegas.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Regra de Ouro */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-950 space-y-1">
                <span className="font-black uppercase tracking-wider text-emerald-800 block text-[10px]">
                  ⭐ REGRA DE OURO
                </span>
                <p className="leading-relaxed">
                  A pontuação interna existe unicamente para orientar a inteligência do sistema. Ela <strong>NÃO</strong> representa uma nota, <strong>NÃO</strong> é divulgada para a família e <strong>NUNCA</strong> cria classificações competitivas.
                </p>
              </div>
            </>
          ) : (
            /* Aba de Multiplicadores */
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Scale size={16} className="text-indigo-600" />
                  Tabela de Multiplicadores Base por Faixa Etária
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Multiplicadores aplicados internamente pelo motor para equilibrar o desenvolvimento com equidade pedagógica:
                </p>
              </div>

              {/* Tabela Berçário & Maternal */}
              <div className="border border-amber-200 rounded-2xl p-4 bg-amber-50/40 space-y-2">
                <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                  <span className="text-xs font-black text-amber-950 uppercase tracking-wider">
                    🍼 BERÇÁRIO & MATERNAL (Foco: Cuidado Essencial)
                  </span>
                  <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                    Pesos Máximos em Rotina
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1 font-medium text-slate-700">
                  <div className="bg-white p-2 rounded-xl border border-amber-100 flex justify-between">
                    <span>Sono:</span> <strong className="text-amber-900">x5.0</strong>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-amber-100 flex justify-between">
                    <span>Alimentação:</span> <strong className="text-amber-900">x5.0</strong>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-amber-100 flex justify-between">
                    <span>Higiene:</span> <strong className="text-amber-900">x5.0</strong>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-amber-100 flex justify-between">
                    <span>Hidratação:</span> <strong className="text-amber-900">x4.5</strong>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-amber-100 flex justify-between">
                    <span>Movimento:</span> <strong className="text-slate-700">x3.5</strong>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-amber-100 flex justify-between">
                    <span>Autonomia:</span> <strong className="text-slate-700">x2.5</strong>
                  </div>
                </div>
              </div>

              {/* Tabela Pré-Escola & Jardim */}
              <div className="border border-indigo-200 rounded-2xl p-4 bg-indigo-50/40 space-y-2">
                <div className="flex items-center justify-between border-b border-indigo-200 pb-2">
                  <span className="text-xs font-black text-indigo-950 uppercase tracking-wider">
                    🎨 PRÉ-ESCOLA & JARDIM (Foco: Socioemocional)
                  </span>
                  <span className="text-[10px] font-bold bg-indigo-200 text-indigo-900 px-2 py-0.5 rounded">
                    Pesos Máximos em Autonomia
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1 font-medium text-slate-700">
                  <div className="bg-white p-2 rounded-xl border border-indigo-100 flex justify-between">
                    <span>Gentileza:</span> <strong className="text-indigo-900">x5.0</strong>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-indigo-100 flex justify-between">
                    <span>Cooperação:</span> <strong className="text-indigo-900">x5.0</strong>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-indigo-100 flex justify-between">
                    <span>Autonomia:</span> <strong className="text-indigo-900">x5.0</strong>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-indigo-100 flex justify-between">
                    <span>Linguagem:</span> <strong className="text-indigo-900">x4.0</strong>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-indigo-100 flex justify-between">
                    <span>Movimento:</span> <strong className="text-slate-700">x3.5</strong>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-indigo-100 flex justify-between">
                    <span>Cuidados:</span> <strong className="text-slate-700">x2.5</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Citação Poética Final */}
          <div className="pt-2 text-center">
            <p className="text-xs italic font-semibold text-slate-500 leading-relaxed max-w-md mx-auto">
              "Toda criança é uma semente única. A família planta, a escola cultiva e o Anjinho Escolar preserva essa história."
            </p>
          </div>

          {/* Botão de Entendido */}
          <div className="pt-1">
            <button
              onClick={onClose}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md transition transform active:scale-98 cursor-pointer text-center"
            >
              Entendi e Quero Cultivar!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
