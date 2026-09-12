import React, { useState } from 'react';
import { Moon, Sparkles, Droplet, Thermometer, Scale, Smile, Baby } from 'lucide-react';
import { StudentPaxData } from '../../types';

interface Props {
  student: StudentPaxData;
}

export default function PaxSaudeHorizontalCards({ student }: Props) {
  const [showWeightHistory, setShowWeightHistory] = useState(false);

  const cards = [
    {
      id: 'sono',
      label: 'SONECA / SONO',
      valor: student.saudeCards.soneca.valor,
      sub: student.saudeCards.soneca.periodo,
      icon: Moon,
      color: 'indigo',
    },
    {
      id: 'fralda',
      label: 'FRALDAS (TROCAS)',
      valor: student.saudeCards.fraldas.valor,
      sub: student.saudeCards.fraldas.periodo,
      icon: Baby,
      color: 'teal',
    },
    {
      id: 'mamadeiras',
      label: 'MAMADEIRAS SERVIDAS',
      valor: student.saudeCards.mamadeiras.valor,
      sub: student.saudeCards.mamadeiras.periodo,
      badge: student.alimentacao.mamadeirasServidas === 0 ? 'Nenhuma hoje' : undefined,
      color: 'amber',
    },
    {
      id: 'agua',
      label: 'HIDRATAÇÃO (ÁGUA)',
      valor: `${student.saudeCards.hidratacao.valor} ${student.saudeCards.hidratacao.copos}`,
      sub: student.saudeCards.hidratacao.periodo,
      icon: Droplet,
      color: 'sky',
    },
    {
      id: 'temp',
      label: 'TEMPERATURA',
      valor: student.saudeCards.temperatura.valor,
      sub: student.saudeCards.temperatura.status,
      icon: Thermometer,
      badgeColor: 'emerald',
      color: 'rose',
    },
    {
      id: 'peso',
      label: 'PESO ESCOLAR',
      valor: student.saudeCards.peso.valor,
      sub: student.saudeCards.peso.status,
      actionLabel: 'VER HISTÓRICO',
      onAction: () => setShowWeightHistory(true),
      icon: Scale,
      color: 'violet',
    },
    {
      id: 'humor',
      label: 'HUMOR / CONDUTA',
      valor: student.saudeCards.humor.valor,
      sub: student.saudeCards.humor.periodo,
      icon: Smile,
      color: 'emerald',
    },
  ];

  return (
    <div className="space-y-3 pt-2">
      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
        DIÁRIO DE SAÚDE, SONO & FRALDA
      </span>

      {/* Grid de 7 Cards Horizontais */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {cards.map((c) => {
          return (
            <div
              key={c.id}
              className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition"
            >
              <div>
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block truncate">
                  {c.label}
                </span>
                <p className="text-sm sm:text-base font-black text-slate-800 tracking-tight mt-1 truncate">
                  {c.valor}
                </p>
              </div>

              <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between">
                <span
                  className={`text-[10px] font-bold ${
                    c.sub === 'Afebril' ? 'text-emerald-600' : 'text-slate-400'
                  }`}
                >
                  {c.sub}
                </span>

                {c.actionLabel && (
                  <button
                    onClick={c.onAction}
                    className="text-[9px] font-black text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded transition cursor-pointer"
                  >
                    {c.actionLabel}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Histórico de Peso */}
      {showWeightHistory && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Scale size={20} className="text-indigo-600" />
                <h3 className="text-base font-black text-slate-800">
                  Histórico Ponderal Escolar — {student.nome}
                </h3>
              </div>
              <button
                onClick={() => setShowWeightHistory(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                <div>
                  <p className="font-bold text-slate-800">Última pesagem (Mês atual)</p>
                  <p className="text-[11px] text-slate-400">Aferido pela enfermeira escolar</p>
                </div>
                <span className="font-black text-base text-indigo-700">{student.saudeCards.peso.valor}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center opacity-70">
                <div>
                  <p className="font-bold text-slate-800">Mês anterior</p>
                  <p className="text-[11px] text-slate-400">Curva de crescimento normal OMS</p>
                </div>
                <span className="font-black text-sm text-slate-600">13,6 kg</span>
              </div>
            </div>

            <button
              onClick={() => setShowWeightHistory(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-black rounded-xl transition cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
