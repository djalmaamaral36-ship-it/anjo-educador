import React from 'react';
import { DADOS_DIFECOES_MOCK, CONTATO_SUPORTE } from '../../data/mockData';
import { Building2, Users, DollarSign, ShieldCheck, Mail, Phone, FileText, CheckCircle, Scale, LifeBuoy } from 'lucide-react';

export const DirecaoModule: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header Direção */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block mb-1">
            Gestão Executiva Escolar
          </span>
          <h2 className="text-2xl font-extrabold tracking-tight">Painel da Direção & Mantenedores</h2>
          <p className="text-xs text-slate-300 mt-1">
            Visão financeira, matrículas ativas, módulo PAX e Central Jurídica de Apoio à Escola.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-800 p-3 rounded-2xl border border-slate-700">
          <Building2 className="w-8 h-8 text-amber-400" />
          <div>
            <div className="text-xs font-bold text-slate-200">Escola Anjinho Educador</div>
            <div className="text-[11px] text-amber-300 font-semibold">Unidade Principal</div>
          </div>
        </div>
      </div>

      {/* Cards Indicadores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Matrículas Ativas</span>
            <Users className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{DADOS_DIFECOES_MOCK.totalAlunosMatriculados} Alunos</div>
          <div className="text-[11px] text-emerald-600 font-semibold">100% de capacidade ocupada</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Mensalidades em Dia</span>
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{DADOS_DIFECOES_MOCK.mensalidadesEmDia} Famílias</div>
          <div className="text-[11px] text-slate-500">Apenas {DADOS_DIFECOES_MOCK.mensalidadesPendentes} pendentes</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Receita Estimada</span>
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700">{DADOS_DIFECOES_MOCK.receitaMensalEstimada}</div>
          <div className="text-[11px] text-slate-500">Faturamento mensal bruto</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Proteção PAX Escolar</span>
            <ShieldCheck className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-lg font-extrabold text-slate-900">Ativa & Protegida</div>
          <div className="text-[11px] text-amber-600 font-semibold">Seguro de Acidentes Integrado</div>
        </div>
      </div>

      {/* Central Jurídica & Suporte com Djalma Amaral */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 text-amber-800 rounded-xl flex items-center justify-center font-bold">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Central Jurídica & Suporte Direto à Mantenedora</h3>
              <p className="text-xs text-slate-500">Modelos de contrato, suporte regulatório e atendimento de diretoria</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <LifeBuoy className="w-4 h-4 text-emerald-600" />
              <span>Contato Direto com a Administração</span>
            </h4>
            <div className="text-xs text-slate-600 space-y-1">
              <p><strong>Responsável:</strong> {CONTATO_SUPORTE.nome}</p>
              <p><strong>E-mail:</strong> {CONTATO_SUPORTE.email}</p>
              <p><strong>WhatsApp:</strong> {CONTATO_SUPORTE.telefone}</p>
              <p className="text-[11px] text-slate-400 italic pt-1">{CONTATO_SUPORTE.suporteAtendimento}</p>
            </div>

            <a
              href="https://wa.me/5514997519181?text=Olá%20Djalma,%20preciso%20de%20atendimento%20da%20Direção!"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Chamar Suporte no WhatsApp</span>
            </a>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Documentação Regulatória & Contratos</span>
            </h4>
            <ul className="text-xs text-slate-600 space-y-2">
              <li className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Contrato de Prestação de Serviços Educacionais 2026</span>
              </li>
              <li className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Termo de Consentimento LGPD & Uso de Imagem Infantil</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
