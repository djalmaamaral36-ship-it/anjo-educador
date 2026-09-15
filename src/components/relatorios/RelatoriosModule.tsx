import React, { useState } from 'react';
import { FileText, Printer, Download, Mail, Send, CheckCircle2 } from 'lucide-react';

export const RelatoriosModule: React.FC = () => {
  const [imprimindo, setImprimindo] = useState(false);
  const [sucessoExportacao, setSucessoExportacao] = useState(false);

  const handleGerarPdf = () => {
    setImprimindo(true);
    setTimeout(() => {
      setImprimindo(false);
      setSucessoExportacao(true);
      setTimeout(() => setSucessoExportacao(false), 3000);
      window.print();
    }, 800);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
            <Printer className="w-4 h-4" />
            <span>Relatórios Pedagógicos & Impressão</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-800">Exportação de Diários & Fichas em PDF</h2>
          <p className="text-xs text-slate-500">Geração oficial de documentos impressos ou envio digital para os pais</p>
        </div>

        <button
          onClick={handleGerarPdf}
          disabled={imprimindo}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 w-fit"
        >
          <Printer className="w-4 h-4" />
          <span>{imprimindo ? 'Gerando Documento...' : 'Imprimir / Baixar PDF'}</span>
        </button>
      </div>

      {sucessoExportacao && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Documento compilado e enviado para a fila de impressão!</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
          <h4 className="font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>Diário de Aula Completo da Turma</span>
          </h4>
          <p className="text-slate-600">Exporta todos os registros de alimentação, sono, fraldas e o Recadinho da Educadora do dia.</p>
          <button onClick={handleGerarPdf} className="text-indigo-600 font-bold hover:underline">Imprimir Diário da Turma →</button>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
          <h4 className="font-bold text-slate-800 flex items-center gap-2">
            <Mail className="w-4 h-4 text-rose-600" />
            <span>Envio de Boletim Individual aos Pais</span>
          </h4>
          <p className="text-slate-600">Dispara os relatórios individuais por e-mail e notificação no app das famílias.</p>
          <button onClick={() => alert('Relatórios disparados para o e-mail dos pais!')} className="text-rose-600 font-bold hover:underline">Disparar Relatórios Individuais →</button>
        </div>
      </div>
    </div>
  );
};
