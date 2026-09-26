import React from 'react';
import { StudentPaxData } from '../../types';
import { ShieldCheck, CheckCircle2, Award, Clock } from 'lucide-react';

interface Props {
  student: StudentPaxData;
  userRole?: string;
  onUpdateStudent?: (updatedFields: Partial<StudentPaxData>) => void;
}

export default function PaxPresencaGovernanca({
  student,
  userRole = 'professor'
}: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* 1. Métricas de Governança Card (%100 Conformidade) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between text-center space-y-3">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
            MÉTRICAS DE GOVERNANÇA
          </span>
          <div className="relative w-24 h-24 mx-auto my-2 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="#E2E8F0"
                strokeWidth="10"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="#5B46EB"
                strokeWidth="10"
                fill="none"
                strokeDasharray="251.2"
                strokeDashoffset="0"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex items-baseline justify-center">
              <span className="text-xl font-black text-[#5B46EB] tracking-tight">100%</span>
            </div>
          </div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 block">
            CONFORMIDADE
          </span>
          <p className="text-[11px] text-slate-500 mt-1">
            Rotinas e vivências pedagógicas com registro auditado.
          </p>
        </div>
      </div>

      {/* 2. Status da Rotina Hoje */}
      <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              SEGURANÇA DA ROTINA
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold border bg-emerald-50 text-emerald-700 border-emerald-200">
              AUDITADO AO VIVO
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
            Tudo Sob Controle na Escola
          </h3>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            O período de aula e os registros dos alunos são transmitidos com integridade para os responsáveis.
          </p>
        </div>
        <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 space-y-1">
          <div>
            Responsável: <strong>{student?.professoraTitular || 'Professora Titular'}</strong>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>Status: <strong className="text-emerald-600">Conforme</strong></span>
            <span className="text-[10px] text-slate-400">Tempo Real</span>
          </div>
        </div>
      </div>

      {/* 3. Trava de Segurança Pedagógica */}
      <div className="bg-white rounded-3xl p-6 border border-indigo-100 shadow-sm flex flex-col justify-between space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#5B46EB] text-white flex items-center justify-center shrink-0 shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="text-xs text-slate-600 leading-relaxed">
            <h5 className="font-black text-slate-800 text-xs mb-0.5">
              Trava de Segurança Pedagógica
            </h5>
            <span>
              Acompanhamento oficial de <strong>{student?.nome || 'Mariana Souza'}</strong> com integridade de dados e proteção LGPD.
            </span>
          </div>
        </div>
        <div className="p-2.5 rounded-2xl border text-[11px] font-medium bg-indigo-50/70 border-indigo-100 text-indigo-900">
          🔒 Acesso seguro e auditável pelo responsável legal.
        </div>
      </div>
    </div>
  );
}
