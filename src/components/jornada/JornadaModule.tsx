import React, { useState } from 'react';
import { TreePine, BookOpen, Award, Share2, Image, Sparkles, Heart, Check } from 'lucide-react';

export const JornadaModule: React.FC = () => {
  const [modalMetodoAberto, setModalMetodoAberto] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const marcosInfancia = [
    { etapa: 'Sementinha (0 a 6 meses)', foco: 'Percepção tátil, vínculo afetivo, acompanhamento visual e estímulo motor passivo.' },
    { etapa: 'Brotinho (6 a 12 meses)', foco: 'Sentar sem apoio, primeiras palavrinhas, introdução alimentar e descoberta da pinça fina.' },
    { etapa: 'Ramagem (1 a 2 anos)', foco: 'Primeiros passos firmes, expressão de desejos, rabisco espontâneo e imitação de sons.' },
    { etapa: 'Copa Florida (2 a 3 anos)', foco: 'Linguagem expandida, controle de esfíncteres/desfralde, autonomia nas refeições e artes.' }
  ];

  const handleCopiarCardSocial = () => {
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Banner da Jornada da Primeira Infância */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-green-800 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold w-fit mb-2">
            <TreePine className="w-3.5 h-3.5 text-emerald-200" />
            <span>Método Árvore da Infância & Floresta do Saber</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">Jornada da Primeira Infância</h2>
          <p className="text-xs text-emerald-100 mt-1 max-w-xl">
            Acompanhamento contínuo dos marcos do desenvolvimento infantil, registro de memórias inesquecíveis e criação do Álbum da Primeira Infância.
          </p>
        </div>

        <button
          onClick={() => setModalMetodoAberto(true)}
          className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold text-xs rounded-xl shadow-md transition whitespace-nowrap"
        >
          Conhecer Método Árvore da Infância
        </button>
      </div>

      {/* Marcos da Infância (Método Árvore) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center font-bold">
            <TreePine className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Marcos de Crescimento Pedagógico</h3>
            <p className="text-xs text-slate-500">As 4 fases da árvore do desenvolvimento infantil</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {marcosInfancia.map((m, idx) => (
            <div key={idx} className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-2">
              <span className="text-xs font-extrabold text-emerald-800 block">{m.etapa}</span>
              <p className="text-xs text-slate-600 leading-relaxed">{m.foco}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Gerador de Cards para Redes Sociais da Escola */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center font-bold">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Card de Divulgação para Redes Sociais</h3>
              <p className="text-xs text-slate-500">Gere um card comemorativo do dia para compartilhar com as famílias</p>
            </div>
          </div>

          <button
            onClick={handleCopiarCardSocial}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            {copiado ? <Check className="w-4 h-4 text-emerald-300" /> : <Share2 className="w-4 h-4" />}
            <span>{copiado ? 'Card Gerado & Copiado!' : 'Gerar Card Instagram'}</span>
          </button>
        </div>

        <div className="bg-gradient-to-tr from-emerald-600 to-teal-800 text-white p-6 rounded-2xl max-w-md mx-auto shadow-lg text-center space-y-3">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center text-2xl">
            👼
          </div>
          <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-widest block">Anjinho Educador</span>
          <h4 className="text-lg font-extrabold">"Aprender com afeto é crescer feliz!"</h4>
          <p className="text-xs text-emerald-100 italic">
            Hoje nossa turma do Berçário vivenciou momentos mágicos na Floresta do Saber! 🌱✨
          </p>
        </div>
      </div>

      {/* Modal Método Árvore */}
      {modalMetodoAberto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <TreePine className="w-5 h-5 text-emerald-600" />
                <span>Método Árvore da Infância</span>
              </h3>
              <button onClick={() => setModalMetodoAberto(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              O <strong>Método Árvore da Infância</strong> é a metodologia exclusiva do Anjinho Educador que estrutura o desenvolvimento da criança em 4 raízes fundamentais: <em>Afeto</em>, <em>Autonomia</em>, <em>Estímulo Cognitivo/BNCC</em> e <em>Vínculo Familiar</em>.
            </p>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setModalMetodoAberto(false)}
                className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
