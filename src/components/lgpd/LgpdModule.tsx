import React from 'react';
import { ShieldCheck, Lock, Eye, FileText, CheckCircle } from 'lucide-react';

export const LgpdModule: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
            <Lock className="w-4 h-4" />
            <span>Privacidade & Proteção de Dados Infantis</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-800">LGPD Escolar & Termos de Uso</h2>
          <p className="text-xs text-slate-500">Conformidade total com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018)</p>
        </div>

        <span className="text-xs font-bold px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl w-fit flex items-center gap-1">
          <ShieldCheck className="w-4 h-4" />
          <span>100% Em Conformidade</span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>Criptografia de Dados</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            As informações de diários, fotos e prontuários médicos são criptografadas e restritas unicamente aos pais e à equipe pedagógica autorizada.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <Eye className="w-4 h-4 text-indigo-600" />
            <span>Consentimento de Imagem</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Todas as fotos publicadas no diário de aula possuem autorização prévia assinada pelos pais no ato da matrícula.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <FileText className="w-4 h-4 text-amber-600" />
            <span>Direito do Titular</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Os responsáveis podem solicitar a exportação ou exclusão dos registros a qualquer momento junto ao encarregado de dados da escola.
          </p>
        </div>
      </div>
    </div>
  );
};
