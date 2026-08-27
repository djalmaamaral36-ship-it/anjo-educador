import React, { useState, useEffect } from 'react';
import { Lock, FileText, Check, ShieldCheck } from 'lucide-react';
import { getFromDB, saveToDB } from '../data';

interface LgpdConsentModalProps {
  onAccept: () => void;
  seniorName: string;
}

export function LgpdConsentModal({ onAccept, seniorName }: LgpdConsentModalProps) {
  const isEscolar = localStorage.getItem('anjo_app_mode') === 'escolar_infantil' || 
    localStorage.getItem('anjo_app_mode') === 'escolar_fundamental' ||
    seniorName.toLowerCase().includes('maternal') || 
    seniorName.toLowerCase().includes('infantil') || 
    seniorName.toLowerCase().includes('berçário') || 
    seniorName.toLowerCase().includes('jardim') ||
    seniorName.toLowerCase().includes('ano') ||
    seniorName.toLowerCase().includes('aluno_fun');

  const [agreedSensivel, setAgreedSensivel] = useState(false);
  const [agreedParentesco, setAgreedParentesco] = useState(false);
  const [agreedTermos, setAgreedTermos] = useState(false);

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(seniorName);

  useEffect(() => {
    setTempName(seniorName);
  }, [seniorName]);

  const handleSaveName = () => {
    if (!tempName.trim()) {
      alert(isEscolar ? 'Favor preencher o nome do aluno/criança.' : 'Favor preencher o nome do idoso.');
      return;
    }
    const allSeniors = getFromDB<any[]>('anjo_idosos', []);
    const activeIdosoId = localStorage.getItem('anjo_simulacao_idoso_id');
    const updated = allSeniors.map(sen => {
      if (activeIdosoId ? sen.id === activeIdosoId : sen.nome === seniorName) {
        return { ...sen, nome: tempName.trim() };
      }
      return sen;
    });

    saveToDB('anjo_idosos', updated);
    setIsEditingName(false);
    
    // Dispatch update event to let App.tsx reload it instantly!
    window.dispatchEvent(new Event('anjo_user_updated'));
  };

  const canAccept = agreedSensivel && agreedParentesco && agreedTermos;

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 z-55 overflow-y-auto animate-fade-in" id="lgpd-consent-modal-overlay">
      <div 
         className="bg-white rounded-3xl max-w-xl w-full p-6 md:p-8 border border-slate-200 shadow-2xl space-y-6 my-8 animate-slide-up"
         id="lgpd-consent-card"
      >
        {/* Header decoration */}
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4" id="lgpd-header">
          <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full tracking-widest">LGPD & Segurança</span>
            <h3 className="text-xl font-black text-slate-800 tracking-tight mt-1">Consentimento de Proteção de Dados</h3>
          </div>
        </div>

        {/* Informative text & scrolling terms document */}
        <div className="space-y-4" id="lgpd-description-block">
          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-3">
            <p className="text-xs text-slate-600 leading-normal">
              Para assegurar a rastreabilidade e integridade das informações de acompanhamento e do boletim diário de cuidados de:
            </p>
            
            {isEditingName ? (
              <div className="flex gap-2 items-center bg-white p-2 border border-emerald-250 rounded-xl shadow-xs">
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs font-bold border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-400/25 rounded-lg bg-slate-50 text-slate-800"
                  placeholder={isEscolar ? "Nome do aluno/criança" : "Nome do idoso"}
                  maxLength={50}
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-lg cursor-pointer transition-colors"
                >
                  Salvar
                </button>
                <button
                  onClick={() => { setIsEditingName(false); setTempName(seniorName); }}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-lg cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-white px-3.5 py-2.5 rounded-xl border border-slate-100 shadow-2xs">
                <span className="text-xs font-bold text-slate-400">
                  {isEscolar ? 'Aluno / Criança:' : 'Idoso:'} <span className="font-extrabold text-slate-800 text-sm ml-1">{isEscolar ? ' ' : ' '} {seniorName}</span>
                </span>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="text-[10px] font-black text-emerald-600 hover:text-emerald-750 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                  title={isEscolar ? "Clique para editar o nome do aluno" : "Clique para editar o nome do idoso"}
                >
                  ✏ Editar Nome
                </button>
              </div>
            )}

            <p className="text-[11px] text-slate-500 leading-normal pt-1">
              Sob os termos da <strong>Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)</strong>, solicitamos o seu consentimento livre e inequívoco antes de liberar o acesso.
            </p>
          </div>

          <div 
            className="border border-slate-200 bg-slate-50 rounded-2xl p-4 text-[11px] text-slate-500 leading-relaxed max-h-40 overflow-y-auto space-y-2 border-dashed font-normal"
            id="lgpd-terms-scroller"
          >
            <p className="font-bold text-slate-700">Artigo 5º, inciso II - Tratamento de Dados Pessoais Sensíveis:</p>
            <p>
              Os dados coletados neste aplicativo (tais como rotinas de medicação, aceitabilidade alimentar, episódios de indisposição, aferimento de sinais vitais e relatos comportamentais) constituem <strong>dados pessoais sensíveis de saúde</strong>. Seu processamento é realizado estritamente para a tutela assistencial de saúde sob governança familiar.
            </p>
            <p className="font-bold text-slate-700">Responsabilidades do Operador e Controladores:</p>
            <p>
              Cada membro (cuidador e família) compromete-se a resguardar o sigilo profissional e familiar dos registros históricos, não compartilhando capturas de tela ou informações confidenciais fora do círculo familiar autorizado. O sistema registra logs automáticos de auditoria digital com endereços IP e carimbo de data/hora a cada acesso por segurança jurídica.
            </p>
            <p className="font-bold text-slate-700">Direito de Revogação de Consentimento:</p>
            <p>
              O titular ou seu tutor pode solicitar o relatório integral de logs, a portabilidade das informações ou a exclusão parcial de dados históricos diretamente aos canais administrativos do {isEscolar ? 'Anjinho Escolar' : 'Anjo Cuidador'} a qualquer momento.
            </p>
          </div>
        </div>

        {/* Checklist checkboxes */}
        <div className="space-y-3.5 pt-1" id="lgpd-consent-checkboxes">
          
          <label className="flex items-start gap-3 cursor-pointer group" id="lgpd-check-sensivel">
            <div className="relative pt-0.5">
              <input 
                type="checkbox"
                checked={agreedSensivel}
                onChange={() => setAgreedSensivel(!agreedSensivel)}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded-md border transition-all flex items-center justify-center ${
                agreedSensivel 
                  ? 'bg-emerald-600 border-emerald-600 shadow-2xs' 
                  : 'bg-slate-50 border-slate-300 group-hover:border-slate-400'
              }`}>
                {agreedSensivel && <Check className="w-3.5 h-3.5 text-white stroke-[3.5]" />}
              </div>
            </div>
            <span className="text-xs text-slate-700 font-medium select-none leading-normal">
              {isEscolar 
                ? `Autorizo o registro e processamento de rotinas e dados comportamentais de ${seniorName} para acompanhamento pedagógico e de cuidados.`
                : `Autorizo o registro e processamento de dados de saúde sensíveis para acompanhamento assistencial de ${seniorName}.`
              }
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer group" id="lgpd-check-parentesco">
            <div className="relative pt-0.5">
              <input 
                type="checkbox"
                checked={agreedParentesco}
                onChange={() => setAgreedParentesco(!agreedParentesco)}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded-md border transition-all flex items-center justify-center ${
                agreedParentesco 
                  ? 'bg-emerald-600 border-emerald-600 shadow-2xs' 
                  : 'bg-slate-50 border-slate-300 group-hover:border-slate-400'
              }`}>
                {agreedParentesco && <Check className="w-3.5 h-3.5 text-white stroke-[3.5]" />}
              </div>
            </div>
            <span className="text-xs text-slate-700 font-medium select-none leading-normal">
              {isEscolar
                ? `Declaro que sou familiar, responsável legal ou tutor autorizado pela família de ${seniorName} para acessar esta rotina escolar.`
                : `Declaro que sou familiar ou cuidador expressamente autorizado pela família de ${seniorName} para acessar este histórico de cuidado.`
              }
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer group" id="lgpd-check-termos">
            <div className="relative pt-0.5">
              <input 
                type="checkbox"
                checked={agreedTermos}
                onChange={() => setAgreedTermos(!agreedTermos)}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded-md border transition-all flex items-center justify-center ${
                agreedTermos 
                  ? 'bg-emerald-600 border-emerald-600 shadow-2xs' 
                  : 'bg-slate-50 border-slate-300 group-hover:border-slate-400'
              }`}>
                {agreedTermos && <Check className="w-3.5 h-3.5 text-white stroke-[3.5]" />}
              </div>
            </div>
            <span className="text-xs text-slate-700 font-medium select-none leading-normal">
              Concordo com os Termos de Uso e Política de Privacidade do {isEscolar ? 'Anjinho Escolar' : 'Anjo Cuidador'} e aceito o registro de auditoria de acessos via WhatsApp.
            </span>
          </label>

        </div>

        {/* Footer & Active Actions */}
        <div className="border-t border-slate-100 pt-5 flex items-center justify-between gap-4" id="lgpd-footer">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Confirmação Digital do Resumo de Turno</span>
          </div>

          <button
            onClick={() => {
              if (canAccept) {
                onAccept();
              }
            }}
            disabled={!canAccept}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
              canAccept
                ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white cursor-pointer shadow-sm'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
            }`}
          >
            ✓ Confirmar Consentimento
          </button>
        </div>
      </div>
    </div>
  );
}
