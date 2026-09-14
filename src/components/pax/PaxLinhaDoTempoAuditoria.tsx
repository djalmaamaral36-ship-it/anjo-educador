import React, { useState } from 'react';
import { Layers, ShieldCheck, Clock, CheckCircle2, HeartHandshake, Trash2, AlertTriangle, X, Check } from 'lucide-react';
import { StudentPaxData } from '../../types';

interface Props {
  student: StudentPaxData;
  userRole?: 'professor' | 'familia';
  onDeleteItem?: (itemId: string) => void;
}

export default function PaxLinhaDoTempoAuditoria({ student, userRole = 'familia', onDeleteItem }: Props) {
  const [itemParaExcluir, setItemParaExcluir] = useState<{ id: string; titulo: string } | null>(null);

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

  const handleConfirmarExclusao = () => {
    if (itemParaExcluir && onDeleteItem) {
      onDeleteItem(itemParaExcluir.id);
      setItemParaExcluir(null);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Layers size={22} className="text-emerald-600" />
          <h4 className="text-lg font-black text-slate-800 tracking-tight">
            Linha do Tempo e Auditoria de Saúde & Atividades
          </h4>
        </div>
        <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1">
          <ShieldCheck size={13} className="text-emerald-600" />
          <span>Auditado e Criptografado</span>
        </span>
      </div>

      <p className="text-xs text-slate-500">
        Cada ação de cuidado, refeição, atividade pedagógica e bem-estar é registrada com carimbo de hora e assinatura do profissional da sala, garantindo total transparência para a família.
      </p>

      {/* Lista da Linha do Tempo */}
      {filteredTimeline.length === 0 ? (
        <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-500 font-medium">
          Nenhuma atividade ou rotina registrada na linha do tempo ainda.
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 space-y-4 pt-2 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
          {filteredTimeline.map((item) => (
            <div key={item.id} className="relative group">
              {/* Dot on line */}
              <div className="absolute -left-6 sm:-left-8 top-1.5 w-5 h-5 rounded-full bg-white border-2 border-emerald-500 flex items-center justify-center text-emerald-600 shadow-2xs">
                <CheckCircle2 size={12} />
              </div>

              <div className={`p-4 rounded-2xl border transition ${
                item.tipo === 'pedagogico'
                  ? 'bg-indigo-50/50 border-indigo-100 hover:border-indigo-200'
                  : 'bg-slate-50/80 border-slate-100 hover:border-slate-200'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-slate-800">{item.titulo}</span>
                    {item.tipo === 'pedagogico' && (
                      <span className="text-[9px] font-black uppercase text-indigo-700 bg-indigo-100/80 px-1.5 py-0.5 rounded">
                        🎨 BNCC
                      </span>
                    )}
                    <span className="text-[10px] font-mono font-bold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                      {item.hora}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-500 font-medium">
                      Responsável: <strong className="text-slate-700">{item.responsavel}</strong>
                    </span>

                    {/* Botão de Excluir para Professores */}
                    {userRole === 'professor' && onDeleteItem && (
                      <button
                        type="button"
                        onClick={() => setItemParaExcluir({ id: item.id, titulo: item.titulo })}
                        title="Excluir este lançamento por engano"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-600 mt-2 whitespace-pre-wrap leading-relaxed bg-white p-2.5 rounded-xl border border-slate-100">{item.descricao}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {itemParaExcluir && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800">
                  Excluir Registro da Linha do Tempo?
                </h3>
                <p className="text-xs text-slate-500">
                  Ação com efeito imediato
                </p>
              </div>
            </div>

            <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-3.5 text-xs text-rose-900 leading-relaxed">
              Você está prestes a remover o registro: <br />
              <strong className="font-black text-rose-950">"{itemParaExcluir.titulo}"</strong>.
              <p className="mt-1.5 text-[11px] text-rose-700">
                Ao confirmar, este item será removido <strong>tanto do seu painel de professora quanto da área dos pais em tempo real</strong>.
              </p>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setItemParaExcluir(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                <X size={14} />
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarExclusao}
                className="px-4 py-2 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 size={14} />
                Sim, Excluir Agora
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
