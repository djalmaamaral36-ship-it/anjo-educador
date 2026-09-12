import React from 'react';
import { Utensils, Milk, Clock, Heart } from 'lucide-react';
import { StudentPaxData } from '../../types';

interface Props {
  student: StudentPaxData;
}

interface RefeicaoItem {
  nome: string;
  status: string;
  horario?: string;
  observacao?: string;
}

export default function PaxPainelNutricaoAguaHumor({ student }: Props) {
  const defaultRefeicoes: RefeicaoItem[] = [
    { nome: 'Lanchinho da Manhã', status: 'SEM REGISTRO' },
    { nome: 'Papinha / Almocinho', status: 'SEM REGISTRO' },
    { nome: 'Lanchinho da Tarde', status: 'SEM REGISTRO' },
    { nome: 'Jantinha Escolar', status: 'SEM REGISTRO' },
  ];

  const refeicoesStudent: RefeicaoItem[] = student.alimentacao?.refeicoes || [];

  const listRefeicoes: RefeicaoItem[] = defaultRefeicoes.map((def) => {
    const found = refeicoesStudent.find((r) => {
      const rName = r.nome.toLowerCase().trim();
      const defName = def.nome.toLowerCase().trim();

      if (rName === defName) return true;
      if (defName.includes('manhã') && (rName.includes('manhã') || rName.includes('manha'))) return true;
      if (defName.includes('tarde') && (rName.includes('tarde') || rName.includes('frutinha'))) return true;
      if (defName.includes('almocinho') && (rName.includes('almoço') || rName.includes('almocinho') || rName.includes('papinha'))) return true;
      if (defName.includes('jantinha') && (rName.includes('janta') || rName.includes('jantinha'))) return true;

      return false;
    });
    return found ? { ...found, nome: def.nome } : def;
  });

  const mamadeirasServidas = student.alimentacao?.mamadeirasServidas || 0;
  const mamadeirasMlTotal = student.alimentacao?.mamadeirasMlTotal || 0;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
      {/* CABEÇALHO DA SEÇÃO DE NUTRIÇÃO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Utensils size={20} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider">
              NUTRIÇÃO & ALIMENTAÇÃO
            </span>
            <h3 className="text-lg font-black text-slate-800">
              Controle de Refeições & Mamadeiras
            </h3>
          </div>
        </div>

        <span className="text-xs font-black text-amber-900 bg-amber-100 border border-amber-200 px-3.5 py-1.5 rounded-full self-start sm:self-auto flex items-center gap-1.5">
          <Milk size={14} className="text-amber-800" />
          <span>{mamadeirasServidas} Mamadeira(s) Servida(s)</span>
        </span>
      </div>

      {/* BLOCO 1: MAMADEIRAS DE LEITE / FÓRMULA */}
      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 flex items-center justify-center shrink-0 font-bold text-base">
            🍼
          </div>
          <div>
            <h4 className="font-black text-sm text-slate-800">
              Mamadeiras de Leite / Fórmula
            </h4>
            <p className="text-xs text-slate-600 mt-0.5">
              Controle de mamadeiras diárias e ingestão láctea
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="bg-white border border-amber-300 px-3.5 py-1.5 rounded-xl text-right shadow-2xs">
            <span className="text-xs font-black text-amber-900 block">
              {mamadeirasServidas} servidas
            </span>
            <span className="text-[10px] font-bold text-slate-500 block">
              ({mamadeirasMlTotal} ml)
            </span>
          </div>
        </div>
      </div>

      {/* BLOCO 2: GRADE DE REFEIÇÕES DA CRIANÇA E ACEITAÇÃO */}
      <div className="space-y-2.5">
        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
          REFEIÇÕES DO DIA & ACEITAÇÃO DA CRIANÇA
        </span>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {listRefeicoes.map((ref, idx) => {
            const isPending = !ref.status || ref.status === 'SEM REGISTRO' || ref.status.includes('PREVISTO');
            const isGood =
              ref.status?.toLowerCase().includes('tudo') ||
              ref.status?.toLowerCase().includes('super') ||
              ref.status?.toLowerCase().includes('ótima') ||
              ref.status?.toLowerCase().includes('boa') ||
              ref.status?.toLowerCase().includes('comeu');
            const isPartial = ref.status?.toLowerCase().includes('parcial');
            const isRefused = ref.status?.toLowerCase().includes('recus') || ref.status?.toLowerCase().includes('não') || ref.status?.toLowerCase().includes('rejeit');

            return (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between gap-3 hover:bg-white hover:shadow-2xs transition"
              >
                <div>
                  <h5 className="font-bold text-xs sm:text-sm text-slate-800">
                    {ref.nome}
                  </h5>
                  {ref.horario && (
                    <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                      <Clock size={11} /> Registrado às {ref.horario}
                    </span>
                  )}
                  {ref.observacao && (
                    <p className="text-[11px] text-slate-600 italic mt-1 bg-white px-2 py-0.5 rounded border border-slate-200/60 inline-block">
                      "{ref.observacao}"
                    </p>
                  )}
                </div>

                <span
                  className={`text-[11px] font-black px-3 py-1 rounded-xl shrink-0 border ${
                    isPending
                      ? 'bg-slate-200/80 text-slate-600 border-slate-300/80'
                      : isGood
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : isPartial
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : isRefused
                      ? 'bg-rose-100 text-rose-900 border-rose-300'
                      : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  }`}
                >
                  {ref.status || 'SEM REGISTRO'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-[11px] text-slate-400 border-t border-slate-100 pt-3 flex items-center gap-1.5">
        <Heart size={13} className="text-rose-400 fill-rose-400" />
        <span>Alimentação e mamadeiras acompanhadas em tempo real pela equipe do Anjinho Escolar.</span>
      </p>
    </div>
  );
}
