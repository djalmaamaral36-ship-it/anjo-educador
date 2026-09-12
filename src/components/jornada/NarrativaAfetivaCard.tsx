import React, { useState } from 'react';
import { Download, Sparkles, Share2, Heart } from 'lucide-react';

interface Props {
  childName: string;
}

export default function NarrativaAfetivaCard({ childName }: Props) {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    navigator.clipboard?.writeText(
      `Diário Afetivo de ${childName}\nHoje o dia por aqui foi preenchido com muito aconchego, sorrisos serenos e momentos especiais de cuidado e desenvolvimento!`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column: Diário de Crescimento do Anjinho */}
      <div className="lg:col-span-7 bg-amber-50/40 rounded-3xl p-5 sm:p-7 border border-amber-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider bg-amber-200/80 text-amber-950 px-3 py-1 rounded-full">
            EXCLUSIVO NARRATIVA AFETIVA
          </span>
          <span className="text-xs font-bold text-amber-800 flex items-center gap-1">
            <Sparkles size={14} /> Mensagem de Hoje
          </span>
        </div>

        <div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            O Diário de Crescimento do Anjinho
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
            Com base no histórico real de conquistas do seu filho, criamos uma narrativa aconchegante para ler em família ou compartilhar no grupo com os avós.
          </p>
        </div>

        {/* Narrative Box */}
        <div className="bg-white rounded-2xl p-5 border border-amber-100 shadow-sm space-y-3 relative">
          <div className="border-l-4 border-amber-400 pl-4 space-y-2">
            <div>
              <h4 className="font-black text-slate-800 text-sm">
                Diário Afetivo de {childName}
              </h4>
              <p className="text-[11px] font-bold text-slate-400">2 de julho de 2026</p>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
              "Olá, família querida! Hoje o dia por aqui foi preenchido com muito aconchego, sorrisos serenos e momentos especiais de cuidado e desenvolvimento."
            </p>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              <strong className="text-indigo-800 font-bold">*Vivências e Descobertas:*</strong> Na atividade <em className="text-indigo-900 font-semibold">Pintura de Dedos Sensorial e Cores Quentes</em>, demonstrou olhinhos brilhantes, curiosidade e grande delicadeza ao interagir com materiais e colegas, vivenciando um momento muito rico de estímulo e afeto.
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleShare}
              className="text-xs font-bold text-amber-900 hover:text-amber-700 flex items-center gap-1.5 bg-amber-100/60 hover:bg-amber-100 px-3 py-1.5 rounded-xl transition cursor-pointer"
            >
              <Share2 size={14} /> {copied ? 'Copiado com carinho!' : 'Compartilhar com a Família'}
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: O Legado da Primeira Infância */}
      <div className="lg:col-span-5 bg-gradient-to-b from-blue-50/60 to-indigo-50/50 rounded-3xl p-5 sm:p-7 border border-blue-200/80 shadow-sm flex flex-col justify-between space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider bg-blue-200/80 text-blue-950 px-3 py-1 rounded-full">
              PARA SEMPRE RECORDAÇÃO ETERNA
            </span>
            <span className="text-xs font-bold text-blue-800">Autobiografia Escolar</span>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              O Legado da Primeira Inf
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
              Parabéns! Durante estes anos de Educação Infantil, registramos e organizamos cada traço da linda jornada de {childName} para que fiquem guardados para sempre na história da família:
            </p>
          </div>

          {/* 4 Stats Grid */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div className="bg-white rounded-2xl p-3 border border-blue-100 text-center shadow-xs">
              <p className="text-2xl font-black text-blue-700">3</p>
              <p className="text-[10px] font-bold uppercase text-slate-500 mt-0.5">MOMENTOS SALVOS</p>
            </div>
            <div className="bg-white rounded-2xl p-3 border border-blue-100 text-center shadow-xs">
              <p className="text-2xl font-black text-indigo-700">1</p>
              <p className="text-[10px] font-bold uppercase text-slate-500 mt-0.5">FOTOGRAFIAS</p>
            </div>
            <div className="bg-white rounded-2xl p-3 border border-blue-100 text-center shadow-xs">
              <p className="text-2xl font-black text-purple-700">1</p>
              <p className="text-[10px] font-bold uppercase text-slate-500 mt-0.5">ATIVIDADES DE ARTE</p>
            </div>
            <div className="bg-white rounded-2xl p-3 border border-blue-100 text-center shadow-xs">
              <p className="text-2xl font-black text-teal-700">1</p>
              <p className="text-[10px] font-bold uppercase text-slate-500 mt-0.5">DIAS DE DESCOBERTA</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <p className="text-xs text-slate-500 italic text-center">
            Muito mais que comunicação. Um patrimônio digital seguro e inesquecível da sua família.
          </p>
          <button
            onClick={() => alert('Download do Álbum em PDF em alta resolução iniciado!')}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <Download size={16} /> Baixar Álbum da Primeira Inf (Gratuito)
          </button>
        </div>
      </div>
    </div>
  );
}
