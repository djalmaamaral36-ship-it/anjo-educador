import React, { useState } from 'react';
import { TreeStatus } from '../../types';
import { Heart, Sparkles, Droplets, Info } from 'lucide-react';
import MetodoArvoreInfModal from './MetodoArvoreInfModal';

interface Props {
  treeStatus: TreeStatus;
  childName: string;
  onWaterTree?: () => void;
}

export default function ArvoreCultivoCard({ treeStatus, childName, onWaterTree }: Props) {
  const [isWatering, setIsWatering] = useState(false);
  const [gestosCount, setGestosCount] = useState(treeStatus.gestosDeAfeto);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [isMetodoModalOpen, setIsMetodoModalOpen] = useState(false);

  const handleWater = () => {
    setIsWatering(true);
    setShowHeartAnim(true);
    setGestosCount((prev) => prev + 1);
    if (onWaterTree) onWaterTree();
    setTimeout(() => {
      setIsWatering(false);
      setShowHeartAnim(false);
    }, 1500);
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 border border-amber-100/80 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
      {/* Left Column: Visual Tree & Speech Bubble */}
      <div className="lg:col-span-5 flex flex-col items-center bg-gradient-to-b from-teal-50/50 to-emerald-50/40 p-6 rounded-2xl border border-teal-100/60 relative">
        {showHeartAnim && (
          <div className="absolute top-10 flex gap-2 animate-bounce z-20">
            <span className="text-2xl">💧</span>
            <span className="text-2xl">💖</span>
            <span className="text-2xl">🌱</span>
          </div>
        )}

        {/* Tree SVG Illustration */}
        <div className="w-48 h-48 sm:w-56 sm:h-56 relative flex items-center justify-center">
          <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-sm">
            {/* Soft background glow */}
            <circle cx="100" cy="90" r="70" fill="#e6f7f2" opacity="0.6" />
            {/* Tree trunk */}
            <path
              d="M95 180 L97 120 Q90 100 80 85 L90 85 Q98 105 102 120 L105 180 Z"
              fill="#8d5b4c"
            />
            {/* Roots */}
            <path
              d="M96 180 Q85 190 70 195 M104 180 Q115 190 130 195"
              stroke="#8d5b4c"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
            {/* Soil baseline */}
            <path
              d="M30 185 Q100 175 170 185"
              stroke="#82c99b"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Canopy clusters */}
            <circle cx="100" cy="75" r="42" fill="#2d9d68" />
            <circle cx="78" cy="85" r="32" fill="#38b277" />
            <circle cx="122" cy="85" r="32" fill="#248a58" />
            <circle cx="100" cy="50" r="30" fill="#48c78e" />
            {/* Leaf highlights & blossoms */}
            <circle cx="90" cy="65" r="4" fill="#a7f3d0" />
            <circle cx="115" cy="70" r="3.5" fill="#a7f3d0" />
            <circle cx="75" cy="90" r="3" fill="#fde047" />
            <circle cx="125" cy="90" r="3" fill="#fde047" />
            <circle cx="100" cy="95" r="4" fill="#fb7185" />
          </svg>
        </div>

        {/* Action Button: Regar com Amor */}
        <button
          onClick={handleWater}
          disabled={isWatering}
          className="mt-2 px-6 py-2.5 bg-white hover:bg-teal-50 text-teal-800 rounded-full font-black text-xs sm:text-sm border border-teal-200 shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95"
        >
          <Droplets size={16} className="text-teal-600" />
          {isWatering ? 'Cultivando com carinho...' : 'Regar com Amor'}
        </button>

        {/* Tree Speech Bubble */}
        <div className="mt-5 bg-white/95 rounded-2xl p-4 border border-teal-100 shadow-sm text-xs leading-relaxed text-slate-700 relative">
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-t border-l border-teal-100 rotate-45" />
          <p className="italic text-center">
            "{treeStatus.falaArvore}"
          </p>
        </div>
      </div>

      {/* Right Column: Pedagogical Method & Vitality */}
      <div className="lg:col-span-7 space-y-4">
        <div className="flex items-center justify-between">
          <span
            onClick={() => setIsMetodoModalOpen(true)}
            className="text-[11px] font-black uppercase tracking-wider bg-teal-50 text-teal-800 border border-teal-200 px-3 py-1 rounded-full cursor-pointer hover:bg-teal-100 transition"
          >
            MÉTODO ÁRVORE DA INF
          </span>
          <button
            onClick={() => setIsMetodoModalOpen(true)}
            className="text-xs font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1 cursor-pointer transition"
          >
            <Info size={14} /> Entenda o Método
          </button>
        </div>

        {/* Modal do Método Árvore da Inf */}
        <MetodoArvoreInfModal
          isOpen={isMetodoModalOpen}
          onClose={() => setIsMetodoModalOpen(false)}
        />

        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            A Árvore da Inf de {childName}
          </h2>
          <span className="text-[10px] sm:text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full inline-block mt-1">
            {treeStatus.estacaoSubtitulo}
          </span>
        </div>

        <div className="space-y-1">
          <p className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
            ESTAÇÃO DO DESENVOLVIMENTO
          </p>
          <h3 className="text-xl font-black text-slate-800">{treeStatus.estacao}</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Toda grande árvore começa como uma semente. Nesta fase, cada cuidado é uma raiz que fortalece o futuro.
          </p>
          <p className="text-xs italic text-teal-800 font-medium">
            “Acolhimento, afeto e as primeiras conexões vitais com o mundo.”
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-[11px] font-bold text-slate-500">
            <span>Raízes do Ciclo</span>
            <span className="text-teal-700 font-black">{treeStatus.porcentagemCultivo}% Cultivada neste Ciclo</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
            <div
              className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${treeStatus.porcentagemCultivo}%` }}
            />
          </div>
        </div>

        {/* Vitality & Soil Card */}
        <div className="bg-gradient-to-r from-emerald-50/60 to-teal-50/60 rounded-2xl p-4 border border-emerald-200/70 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
              {treeStatus.vitalidadeTexto}
            </p>
            <p className="text-sm font-black text-emerald-950">
              {treeStatus.vitalidadeStatus}
            </p>
          </div>
          <span className="text-xs font-black bg-emerald-600 text-white px-3 py-1 rounded-full shadow-sm">
            {treeStatus.soloStatus}
          </span>
        </div>

        {/* 4 Metric Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-center">
            <p className="text-2xl font-black text-teal-700">{treeStatus.folhasCultivadas}</p>
            <p className="text-[10px] font-bold uppercase text-slate-500 mt-0.5">FOLHAS CULTIVADAS</p>
          </div>
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-center">
            <p className="text-2xl font-black text-amber-600">{treeStatus.valoresDesabrochados}</p>
            <p className="text-[10px] font-bold uppercase text-slate-500 mt-0.5">VALORES DESABROCHADOS</p>
          </div>
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-center">
            <p className="text-2xl font-black text-rose-600">{treeStatus.frutosColhidos}</p>
            <p className="text-[10px] font-bold uppercase text-slate-500 mt-0.5">FRUTOS COLHIDOS</p>
          </div>
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-center">
            <p className="text-2xl font-black text-indigo-700">{gestosCount}</p>
            <p className="text-[10px] font-bold uppercase text-slate-500 mt-0.5">GESTOS DE AFETO</p>
          </div>
        </div>
      </div>
    </div>
  );
}
