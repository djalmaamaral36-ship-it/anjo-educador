import React, { useState } from 'react';
import {
  X,
  Clock,
  UserX,
  LogOut,
  AlertCircle,
  CheckCircle2,
  CalendarX,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { StudentPaxData } from '../../types';

export type TipoDesligamento = 'saida_antecipada' | 'ausencia_temporaria' | 'falta_hoje';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  student: StudentPaxData;
  tempoEmAula: string;
  onConfirmarDesligamento: (dados: {
    tipo: TipoDesligamento;
    motivo: string;
    responsavelRetirada?: string;
    enviarWhatsApp: boolean;
  }) => void;
}

export default function ModalDesligarIndividual({
  isOpen,
  onClose,
  student,
  tempoEmAula,
  onConfirmarDesligamento,
}: Props) {
  if (!isOpen) return null;

  const [tipo, setTipo] = useState<TipoDesligamento>('saida_antecipada');
  const [motivo, setMotivo] = useState<string>('Pais vieram retirar mais cedo para consulta médica');
  const [responsavelRetirada, setResponsavelRetirada] = useState<string>(student.responsavelNome || 'Mãe/Pai');
  const [enviarWhatsApp, setEnviarWhatsApp] = useState<boolean>(false);

  const handleConfirm = () => {
    onConfirmarDesligamento({
      tipo,
      motivo,
      responsavelRetirada,
      enviarWhatsApp,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 space-y-5">
        {/* CABEÇALHO */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-black">
              <UserX size={22} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-rose-600 tracking-wider">
                CONTROLE INDIVIDUAL DE CRONÔMETRO & AUSÊNCIA
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-800">
                Desligar Individual: {student.nome}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* TEMPO REGISTRADO ATÉ AGORA */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-600 font-bold">
            <Clock size={16} className="text-indigo-600" />
            <span>Tempo em sala computado hoje:</span>
          </div>
          <span className="font-mono text-base font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-xl">
            {tempoEmAula}
          </span>
        </div>

        {/* SELEÇÃO DO TIPO DE DESLIGAMENTO */}
        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase text-slate-600 block">
            Selecione a Situação do Aluno:
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setTipo('saida_antecipada');
                setMotivo('Pais vieram retirar mais cedo para consulta/compromisso');
              }}
              className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                tipo === 'saida_antecipada'
                  ? 'bg-rose-50 border-rose-500 text-rose-950 ring-2 ring-rose-500/20'
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <LogOut size={16} className={tipo === 'saida_antecipada' ? 'text-rose-600' : 'text-slate-400'} />
                {tipo === 'saida_antecipada' && <CheckCircle2 size={14} className="text-rose-600" />}
              </div>
              <div>
                <span className="text-xs font-black block">Saída Antecipada</span>
                <span className="text-[10px] text-slate-500 leading-tight">Foi embora mais cedo</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setTipo('ausencia_temporaria');
                setMotivo('Ausência temporária para consulta / atendimento médico externo');
              }}
              className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                tipo === 'ausencia_temporaria'
                  ? 'bg-amber-50 border-amber-500 text-amber-950 ring-2 ring-amber-500/20'
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <Clock size={16} className={tipo === 'ausencia_temporaria' ? 'text-amber-600' : 'text-slate-400'} />
                {tipo === 'ausencia_temporaria' && <CheckCircle2 size={14} className="text-amber-600" />}
              </div>
              <div>
                <span className="text-xs font-black block">Ausência Temporária</span>
                <span className="text-[10px] text-slate-500 leading-tight">Saiu por um tempo</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setTipo('falta_hoje');
                setMotivo('Aluno não compareceu à aula hoje (Falta)');
              }}
              className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                tipo === 'falta_hoje'
                  ? 'bg-slate-100 border-slate-500 text-slate-950 ring-2 ring-slate-500/20'
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <CalendarX size={16} className={tipo === 'falta_hoje' ? 'text-slate-700' : 'text-slate-400'} />
                {tipo === 'falta_hoje' && <CheckCircle2 size={14} className="text-slate-700" />}
              </div>
              <div>
                <span className="text-xs font-black block">Falta / Ausente</span>
                <span className="text-[10px] text-slate-500 leading-tight">Não veio hoje</span>
              </div>
            </button>
          </div>
        </div>

        {/* MOTIVO / JUSTIFICATIVA */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-black uppercase text-slate-600 block">
            Motivo / Observação da Ausência:
          </label>
          <input
            type="text"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-rose-400 focus:bg-white"
            placeholder="Ex: Saiu às 14:15 acompanhado da mãe para consulta"
          />
        </div>

        {tipo === 'saida_antecipada' && (
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase text-slate-600 block">
              Responsável que Retirou a Criança:
            </label>
            <input
              type="text"
              value={responsavelRetirada}
              onChange={(e) => setResponsavelRetirada(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-rose-400 focus:bg-white"
            />
          </div>
        )}

        {/* NOTA DE BLOQUEIO DE COMANDOS */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
          <AlertCircle size={17} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Ao desligar individualmente, <strong>todos os botões de registro de rotina</strong> (alimentação, água, sono, fralda e saúde) ficarão ocultos para <strong>{student.nome}</strong>. O botão de <strong>Religar / Registrar Chegada</strong> ficará visível caso ele chegue ou retorne.
          </p>
        </div>

        {/* OPÇÃO DE WHATSAPP OPCIONAL */}
        <label className="flex items-center gap-2.5 p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl cursor-pointer hover:bg-emerald-50 transition">
          <input
            type="checkbox"
            checked={enviarWhatsApp}
            onChange={(e) => setEnviarWhatsApp(e.target.checked)}
            className="w-4 h-4 text-emerald-600 rounded accent-emerald-600 cursor-pointer"
          />
          <div className="flex-1">
            <span className="font-black text-emerald-950 text-xs block">
              Disparar aviso de saída no WhatsApp dos Pais (Opcional)
            </span>
            <span className="text-[10px] text-emerald-800">
              Notifica <strong>{student.responsavelNome}</strong> sobre a saída antecipada/registro.
            </span>
          </div>
        </label>

        {/* BOTÕES DO MODAL */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white text-xs font-black rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <UserX size={15} />
            <span>Confirmar Desligamento de {student.nome}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
