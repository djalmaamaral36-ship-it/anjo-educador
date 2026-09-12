import React from 'react';
import { AlertTriangle, BellRing } from 'lucide-react';

interface Props {
  onClick: () => void;
  countOcorrencias?: number;
}

export default function BotaoFlutuanteOcorrencia({ onClick, countOcorrencias = 0 }: Props) {
  return (
    <button
      onClick={onClick}
      title="Ocorrência do Dia & Intercorrência Urgente"
      className="fixed bottom-5 right-5 z-40 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-95 text-white font-black text-xs sm:text-sm px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl shadow-xl shadow-orange-500/25 border border-amber-300/40 flex items-center gap-2.5 transition-all duration-200 cursor-pointer group animate-in fade-in"
    >
      <div className="w-6 h-6 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:rotate-12 transition-transform">
        <AlertTriangle size={15} />
      </div>
      <span className="tracking-tight">Ocorrência do Dia</span>

      {countOcorrencias > 0 && (
        <span className="bg-white text-orange-600 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
          {countOcorrencias}
        </span>
      )}
    </button>
  );
}
