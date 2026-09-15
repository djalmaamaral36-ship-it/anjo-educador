import React, { useState } from 'react';
import { PlanejamentoSemanal } from '../../types';
import { PLANEJAMENTOS_MOCK } from '../../data/mockData';
import { CheckCircle2, Clock, AlertTriangle, FileText, Check, ShieldCheck, UserCheck } from 'lucide-react';

export const CoordenacaoModule: React.FC = () => {
  const [planejamentos, setPlanejamentos] = useState<PlanejamentoSemanal[]>(PLANEJAMENTOS_MOCK);

  const aprovarPlanejamento = (id: string) => {
    setPlanejamentos(planejamentos.map(p => p.id === id ? { ...p, status: 'Aprovado', observacaoCoordenacao: 'Planejamento aprovado pela coordenação pedagógica!' } : p));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
            <UserCheck className="w-4 h-4" />
            <span>Módulo de Coordenação Pedagógica</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-800">Validação BNCC & Planejamentos da Semana</h2>
          <p className="text-xs text-slate-500">Supervisão pedagógica dos planos de aula enviadas pelas educadoras</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl">
            {planejamentos.filter(p => p.status === 'Aprovado').length} Aprovados
          </span>
          <span className="text-xs font-bold px-3 py-1.5 bg-amber-100 text-amber-800 rounded-xl">
            {planejamentos.filter(p => p.status === 'Pendente').length} Pendentes
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {planejamentos.map((plan) => (
          <div key={plan.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold text-indigo-600">{plan.turma}</span>
                <h3 className="text-base font-bold text-slate-800">{plan.semana}</h3>
              </div>

              <span className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 w-fit ${
                plan.status === 'Aprovado'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {plan.status === 'Aprovado' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                <span>{plan.status}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-700 block">Campos de Experiência (BNCC):</span>
                <p className="text-slate-600">{plan.campoExperienciaBNCC}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-700 block">Objetivos de Aprendizagem:</span>
                <p className="text-slate-600">{plan.objetivosAprendizagem}</p>
              </div>
            </div>

            <div className="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-100 text-xs">
              <span className="font-bold text-indigo-950 block mb-1">Atividades Propostas pela Educadora:</span>
              <p className="text-indigo-900 leading-relaxed">{plan.atividadesPropostas}</p>
            </div>

            {plan.observacaoCoordenacao && (
              <div className="text-xs text-emerald-800 bg-emerald-50 p-3 rounded-xl border border-emerald-200 font-medium">
                <strong>Parecer da Coordenação:</strong> {plan.observacaoCoordenacao}
              </div>
            )}

            {plan.status === 'Pendente' && (
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => aprovarPlanejamento(plan.id)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  <span>Aprovar Planejamento</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
