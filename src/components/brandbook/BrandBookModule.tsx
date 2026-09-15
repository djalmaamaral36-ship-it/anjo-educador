import React from 'react';
import { Palette, Award, ShieldCheck, Heart, Sparkles } from 'lucide-react';

export const BrandBookModule: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">
            <Palette className="w-4 h-4" />
            <span>Guia de Marca & Identidade Visual</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-800">BrandBook Anjinho Educador</h2>
          <p className="text-xs text-slate-500">Padrões de cores, logotipos e selos institucionais</p>
        </div>

        <span className="text-xs font-bold px-3 py-1.5 bg-rose-100 text-rose-800 rounded-xl w-fit">
          Versão Oficial 2026
        </span>
      </div>

      {/* Amostras de Cores da Marca */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800">Paleta Primária da Marca</h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-white text-xs font-bold">
          <div className="bg-emerald-600 p-4 rounded-xl shadow-sm space-y-1">
            <div>Verde Afeto</div>
            <div className="text-[10px] opacity-80">#16a34a</div>
          </div>

          <div className="bg-rose-500 p-4 rounded-xl shadow-sm space-y-1">
            <div>Rosa Carinho</div>
            <div className="text-[10px] opacity-80">#f43f5e</div>
          </div>

          <div className="bg-amber-400 text-slate-900 p-4 rounded-xl shadow-sm space-y-1">
            <div>Amarelo Luz</div>
            <div className="text-[10px] opacity-80">#f59e0b</div>
          </div>

          <div className="bg-indigo-600 p-4 rounded-xl shadow-sm space-y-1">
            <div>Azul Saber</div>
            <div className="text-[10px] opacity-80">#4f46e5</div>
          </div>
        </div>
      </div>

      {/* Selo de Qualidade */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-amber-400 text-slate-900 rounded-full flex items-center justify-center font-extrabold text-xl shadow-md border-2 border-white">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-base font-extrabold text-amber-950">Selo de Excelência Anjinho Educador</h4>
            <p className="text-xs text-amber-800">Certificação de diário escolar afetivo e seguro para a educação infantil.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
