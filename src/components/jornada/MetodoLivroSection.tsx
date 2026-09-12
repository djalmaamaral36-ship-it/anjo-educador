import React, { useState } from 'react';
import { METODO_LIVRO, THREE_PILLARS } from '../../utils/constants';
import { ChevronDown, ChevronUp, Gift, Sparkles, BookOpen } from 'lucide-react';
import LogoAnjinhoEducador from '../comum/LogoAnjinhoEducador';

export default function MetodoLivroSection() {
  const [expandedLetter, setExpandedLetter] = useState<'L' | 'I' | 'V' | 'R' | 'O'>('L');
  const [cartaAberta, setCartaAberta] = useState(false);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Column 1: Os 3 Pilares da Nossa Marca */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 px-3 py-1 rounded-full">
              NOSSO POSICIONAMENTO
            </span>
            <div className="flex items-center gap-1.5">
              <LogoAnjinhoEducador variant="symbol" size="xs" />
              <span className="text-xs font-bold text-slate-700">Anjinho Escolar</span>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <span>😊</span> Os 3 Pilares da Nossa Marca
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Não somos uma simples agenda digital. Nosso propósito diário se apoia em três pilares integrados que preservam a magia da infância:
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            {THREE_PILLARS.map((pilar) => (
              <div
                key={pilar.id}
                className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1"
              >
                <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  {pilar.titulo}
                </h4>
                <p className="text-[11px] text-slate-600 leading-relaxed pl-3.5">
                  {pilar.descricao}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Column 2: O Método L.I.V.R.O. */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-900 px-3 py-1 rounded-full">
            FILOSOFIA EXCLUSIVA
          </span>
          <span className="text-xs font-bold text-indigo-700">Método L.I.V.R.O.</span>
        </div>

        <div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <span>📖</span> O Método L.I.V.R.O.
          </h3>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Nossa metodologia autoral de preservação da infância. Toque nas letras para ver a aplicação prática:
          </p>
        </div>

        <div className="space-y-2 pt-1">
          {METODO_LIVRO.map((item) => {
            const isExpanded = expandedLetter === item.letra;
            return (
              <div
                key={item.letra}
                onClick={() => setExpandedLetter(item.letra)}
                className={`rounded-2xl transition-all cursor-pointer overflow-hidden border ${
                  isExpanded
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                    : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 font-black text-xs sm:text-sm">
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs ${
                        isExpanded ? 'bg-amber-400 text-amber-950' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {item.letra}
                    </span>
                    <span>{item.palavra}</span>
                  </div>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
                {isExpanded && (
                  <div className="px-4 pb-3 text-xs text-indigo-100 leading-relaxed border-t border-indigo-500/50 pt-2">
                    {item.descricao}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Column 3: A Carta para o Futuro */}
      <div className="bg-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-md flex flex-col justify-between space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-amber-950 px-3 py-1 rounded-full">
              MEMÓRIA ETERNA
            </span>
            <span className="text-xs text-slate-400 font-bold">Geração Inteligente</span>
          </div>

          <div>
            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <Gift size={20} className="text-amber-400" /> A Carta para o Futuro
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Ao concluir a primeira infância na escola, geramos uma linda carta de despedida e gratidão para ser lida e revivida no futuro!
            </p>
          </div>

          {/* Special Letter Preview */}
          <div className="bg-slate-800/80 rounded-2xl p-4 border border-dashed border-indigo-400/50 space-y-2 relative">
            <p className="text-xs text-indigo-100 leading-relaxed italic">
              "Hoje você encerra este capítulo lindo na Educação Infantil. Que você guarde sempre no coração as risadas, os desenhos e a magia que viveu aqui com tanto afeto e descoberta..."
            </p>
            {cartaAberta && (
              <p className="text-xs text-amber-200 leading-relaxed pt-2 border-t border-slate-700">
                ✨ "Com amor, de todas as suas professoras, educadoras e da equipe Anjinho Educador."
              </p>
            )}
          </div>
        </div>

        <button
          onClick={() => setCartaAberta(!cartaAberta)}
          className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-2 cursor-pointer active:scale-98 shadow-sm"
        >
          <Sparkles size={16} /> {cartaAberta ? 'Fechar Carta' : 'Abrir Carta'}
        </button>
      </div>
    </div>
  );
}
