import React, { useState } from 'react';
import {
  X,
  Check,
  Clock,
  MessageSquare,
  Sparkles,
  Users,
  Bell,
  Baby,
  Droplet,
  Send,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { StudentPaxData } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  student: StudentPaxData;
  tempoEmAula: string;
  aguaMl: number;
  mamadeirasContador: number;
  refeicaoTipo: string;
  aceitacao: string;
  humor: string;
  humorObs: string;
  soneca: string;
  fralda: string;
  temperatura: string;
  checklistCount: number;
  onConfirmar: (opcoes: { enviarWhatsApp: boolean; publicarMural: boolean }) => void;
}

export default function ModalConfirmarEncerramentoColetivo({
  isOpen,
  onClose,
  student,
  tempoEmAula,
  aguaMl,
  mamadeirasContador,
  refeicaoTipo,
  aceitacao,
  humor,
  humorObs,
  soneca,
  fralda,
  temperatura,
  checklistCount,
  onConfirmar,
}: Props) {
  if (!isOpen) return null;

  const [enviarWhatsApp, setEnviarWhatsApp] = useState(false);
  const [publicarMural, setPublicarMural] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = () => {
    setIsProcessing(true);
    setTimeout(() => {
      onConfirmar({ enviarWhatsApp, publicarMural });
      setIsProcessing(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CABEÇALHO */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
              <Clock size={22} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-400/10 px-2.5 py-0.5 rounded-md">
                CONFIRMAÇÃO DE ENCERRAMENTO COLETIVO
              </span>
              <h3 className="text-lg font-black text-white leading-tight mt-0.5">
                Encerrar Período de Aulas da Turma?
              </h3>
              <p className="text-xs text-slate-300">
                {student.turma} • Professora {student.professoraTitular}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* CORPO */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs text-slate-700 flex-1">
          {/* AVISO PRINCIPAL */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={18} />
            <div>
              <p className="font-black text-amber-950 text-xs">
                Você está desligando o cronômetro coletivo da sala.
              </p>
              <p className="text-amber-800 text-[11px] mt-0.5 leading-relaxed">
                Ao confirmar, as aulas de hoje serão marcadas como concluídas e o relatório consolidado da rotina será enviado automaticamente para a família e para a escola.
              </p>
            </div>
          </div>

          {/* RESUMO RÁPIDO DO DIÁRIO CONSOLIDADO */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                RESUMO CONSOLIDADO DE HOJE ({student.nome})
              </span>
              <span className="font-mono font-black text-xs text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                ⏱️ {tempoEmAula}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 bg-white rounded-xl border border-slate-100 flex items-center gap-2">
                <span className="text-sm">💧</span>
                <div>
                  <span className="text-slate-400 block text-[9px] font-bold">ÁGUA</span>
                  <strong className="text-slate-800">{aguaMl}ml ingeridos</strong>
                </div>
              </div>

              <div className="p-2 bg-white rounded-xl border border-slate-100 flex items-center gap-2">
                <span className="text-sm">🍼</span>
                <div>
                  <span className="text-slate-400 block text-[9px] font-bold">REFEIÇÕES</span>
                  <strong className="text-slate-800">{mamadeirasContador} mamadeiras</strong>
                </div>
              </div>

              <div className="p-2 bg-white rounded-xl border border-slate-100 flex items-center gap-2">
                <span className="text-sm">💤</span>
                <div>
                  <span className="text-slate-400 block text-[9px] font-bold">SONO</span>
                  <span className="text-slate-800 font-semibold truncate block max-w-[130px]" title={soneca}>
                    {soneca}
                  </span>
                </div>
              </div>

              <div className="p-2 bg-white rounded-xl border border-slate-100 flex items-center gap-2">
                <span className="text-sm">🧷</span>
                <div>
                  <span className="text-slate-400 block text-[9px] font-bold">FRALDA / HIGIENE</span>
                  <span className="text-slate-800 font-semibold truncate block max-w-[130px]" title={fralda}>
                    {fralda}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* DESTINOS DO DISPARO */}
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
              AÇÕES DE REGISTRO & COMUNICAÇÃO:
            </span>

            <label className="flex items-start gap-3 p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl cursor-pointer hover:bg-indigo-50 transition">
              <input
                type="checkbox"
                checked={publicarMural}
                onChange={(e) => setPublicarMural(e.target.checked)}
                className="mt-1 w-4 h-4 text-indigo-600 rounded cursor-pointer accent-indigo-600"
              />
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <Bell size={14} className="text-indigo-700" />
                  <span className="font-black text-indigo-950 text-xs">
                    Gravar e Publicar no Mural de Avisos da Turma & App
                  </span>
                </div>
                <p className="text-[11px] text-indigo-800 mt-0.5">
                  Salva o boletim consolidado internamente no aplicativo para consulta oficial da escola e da família.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl cursor-pointer hover:bg-emerald-50 transition">
              <input
                type="checkbox"
                checked={enviarWhatsApp}
                onChange={(e) => setEnviarWhatsApp(e.target.checked)}
                className="mt-1 w-4 h-4 text-emerald-600 rounded cursor-pointer accent-emerald-600"
              />
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <MessageSquare size={14} className="text-emerald-700" />
                  <span className="font-black text-emerald-950 text-xs">
                    Disparar também para o WhatsApp Externo (Opcional)
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  Envia uma via do relatório diretamente para o número de <strong>{student.responsavelNome}</strong> ({student.responsavelTelefone}) apenas se julgar necessário.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* RODAPÉ DE AÇÃO */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-200 transition cursor-pointer order-2 sm:order-1"
          >
            Continuar Aula (Cancelar)
          </button>

          <button
            onClick={handleConfirm}
            disabled={isProcessing}
            className="px-5 py-2.5 rounded-xl font-black text-xs text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 shadow-sm transition flex items-center justify-center gap-2 cursor-pointer order-1 sm:order-2 disabled:opacity-50"
          >
            {isProcessing ? (
              <span>Processando Encerramento...</span>
            ) : (
              <>
                <Check size={16} />
                <span>Sim, Encerrar e Enviar Diários</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
