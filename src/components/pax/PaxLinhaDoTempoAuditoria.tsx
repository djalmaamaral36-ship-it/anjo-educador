import React from 'react';
import { Layers, ShieldCheck, Clock, CheckCircle2, HeartHandshake } from 'lucide-react';
import { StudentPaxData } from '../../types';

interface Props {
  student: StudentPaxData;
}

export default function PaxLinhaDoTempoAuditoria({ student }: Props) {
  // Deduplica apenas itens 100% idênticos para não ocultar atividades legítimas do mesmo horário
  const filteredTimeline = (student.auditoriaLinhaDoTempo || []).reduce(
    (acc: typeof student.auditoriaLinhaDoTempo, current) => {
      const isDuplicate = acc.some(
        (item) => item.id === current.id || (item.hora === current.hora && item.titulo === current.titulo && item.descricao === current.descricao)
      );
      if (!isDuplicate) {
        acc.push(current);
      }
      return acc;
    },
    []
  );

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Layers size={22} className="text-emerald-600" />
          <h4 className="text-lg font-black text-slate-800 tracking-tight">
            Linha do Tempo e Auditoria de Saúde
          </h4>
        </div>
        <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1">
          <ShieldCheck size={13} className="text-emerald-600" />
          <span>Auditado e Criptografado</span>
        </span>
      </div>

      <p className="text-xs text-slate-500">
        Cada ação de cuidado, refeição, higiene e bem-estar é registrada com carimbo de hora e assinatura do profissional da sala, garantindo total transparência para a família.
      </p>

      {/* Lista da Linha do Tempo */}
      <div className="relative pl-6 sm:pl-8 space-y-4 pt-2 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
        {filteredTimeline.map((item) => (
          <div key={item.id} className="relative group">
            {/* Dot on line */}
            <div className="absolute -left-6 sm:-left-8 top-1.5 w-5 h-5 rounded-full bg-white border-2 border-emerald-500 flex items-center justify-center text-emerald-600 shadow-2xs">
              <CheckCircle2 size={12} />
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 hover:border-slate-200 transition">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-800">{item.titulo}</span>
                  <span className="text-[10px] font-mono font-bold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                    {item.hora}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">
                  Responsável: <strong className="text-slate-700">{item.responsavel}</strong>
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-2 whitespace-pre-wrap leading-relaxed bg-white p-2.5 rounded-xl border border-slate-100">{item.descricao}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
