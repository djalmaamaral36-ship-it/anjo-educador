import React, { useState } from 'react';
import {
  Pill,
  Plus,
  ShieldCheck,
  ShieldAlert,
  Clock,
  FileText,
  Lock,
  KeyRound,
  CheckCircle2,
  Trash2,
  PauseCircle,
  ExternalLink
} from 'lucide-react';
import { StudentPaxData } from '../../types';

interface Props {
  student: StudentPaxData;
  userRole: 'professor' | 'familia';
  onOpenFullMedicationsTab?: () => void;
}

export default function PaxMedicacoes({ student, userRole, onOpenFullMedicationsTab }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [medsList, setMedsList] = useState(student.medicamentos || []);
  const [nomeMed, setNomeMed] = useState('');
  const [horarioMed, setHorarioMed] = useState('14:00');
  const [doseMed, setDoseMed] = useState('');
  const [instrucaoMed, setInstrucaoMed] = useState('');

  // PIN modal state
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [blockedTeacherModal, setBlockedTeacherModal] = useState(false);

  // Ministrar modal for teacher
  const [ministrarModalMed, setMinistrarModalMed] = useState<any>(null);
  const [ministrarHora, setMinistrarHora] = useState(
    new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  );
  const [ministrarObs, setMinistrarObs] = useState('');

  // Update meds when student changes
  React.useEffect(() => {
    if (student.medicamentos) {
      setMedsList(student.medicamentos);
    }
  }, [student.id]);

  const handleRequestAdd = () => {
    if (userRole === 'professor') {
      setBlockedTeacherModal(true);
      return;
    }
    // If family, ask for PIN
    setPinInput('');
    setPinError('');
    setShowPinModal(true);
  };

  const handleVerifyPin = () => {
    if (pinInput === '1234' || pinInput === '2026') {
      setShowPinModal(false);
      setPinInput('');
      setPinError('');
      setShowModal(true);
    } else {
      setPinError('PIN incorreto! Use o PIN cadastrado pelos pais (PIN de teste: 1234).');
    }
  };

  const handleAddMed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeMed.trim()) return;

    const newMed = {
      id: `med_${Date.now()}`,
      nome: nomeMed,
      horario: horarioMed,
      dosagem: doseMed || 'Conforme receita médica',
      instrucoes: instrucaoMed || 'Administrar com cuidado',
      ativo: true,
      turno: 'tarde' as const,
      ministradoHoje: false,
      cadastradoPor: `${student.responsavelNome} (${student.responsavelParentesco})`,
      cadastradoEm: 'Hoje com PIN verificado',
      pinAutorizado: true,
    };

    setMedsList([...medsList, newMed]);
    setNomeMed('');
    setDoseMed('');
    setInstrucaoMed('');
    setShowModal(false);
  };

  const handleConfirmMinistracao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ministrarModalMed) return;

    setMedsList((prev) =>
      prev.map((m) =>
        m.id === ministrarModalMed.id
          ? {
              ...m,
              ministradoHoje: true,
              ministradoPor: 'Ana Silva (Professora Titular)',
              ministradoHorario: ministrarHora,
              observacaoMinistracao: ministrarObs || 'Dose administrada no horário estipulado.',
            }
          : m
      )
    );

    setMinistrarModalMed(null);
    setMinistrarObs('');
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center flex-shrink-0">
            <Pill size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base sm:text-lg font-black text-slate-800">
                Medicações & Autorizações de {student.nome.split(' ')[0]}
              </h4>
              <span className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                {userRole === 'professor' ? 'Apenas Ministrar' : 'Acesso Total com PIN'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {userRole === 'professor'
                ? 'Professores apenas ministram remédios autorizados. Cadastro e suspensão são restritos aos pais com PIN.'
                : 'Você pode cadastrar ou suspender remédios com seu PIN de responsável.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          {onOpenFullMedicationsTab && (
            <button
              onClick={onOpenFullMedicationsTab}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/70 transition flex items-center gap-1.5 cursor-pointer"
            >
              <ExternalLink size={13} />
              <span>Ver Controle Geral</span>
            </button>
          )}

          <button
            onClick={handleRequestAdd}
            className="px-4 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition flex items-center gap-1.5 cursor-pointer justify-center flex-1 sm:flex-none"
          >
            <Plus size={14} />
            <span>+ Cadastrar com PIN</span>
            <Lock size={12} className="text-indigo-200" />
          </button>
        </div>
      </div>

      {/* Lista de Medicamentos ou Estado Vazio */}
      {medsList.length === 0 ? (
        <div className="py-8 px-4 rounded-2xl bg-slate-50/70 border border-dashed border-slate-200 text-center space-y-3">
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Nenhum medicamento registrado para <strong>{student.nome}</strong>.
          </p>
          <button
            onClick={handleRequestAdd}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <Lock size={12} className="text-slate-400" />
            <span>+ Cadastrar Primeiro Medicamento (PIN de Mãe/Pai)</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {medsList.map((med) => (
            <div
              key={med.id}
              className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 transition ${
                med.suspenso
                  ? 'bg-slate-50 border-slate-200 opacity-60'
                  : med.ministradoHoje
                  ? 'bg-emerald-50/50 border-emerald-200'
                  : 'bg-indigo-50/40 border-indigo-100'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-black text-xs sm:text-sm text-slate-800">{med.nome}</span>
                  <span className="text-[10px] font-black text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Clock size={10} /> {med.horario}
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium">Dose: {med.dosagem}</p>
                <p className="text-[11px] text-slate-500">{med.instrucoes}</p>
                <p className="text-[10px] text-slate-400 pt-1">
                  Autorizado por: <strong>{med.cadastradoPor || student.responsavelNome}</strong> (PIN Verificado)
                </p>

                {med.ministradoHoje && (
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-900 text-[11px] font-bold flex items-center gap-1.5 mt-2">
                    <CheckCircle2 size={13} className="text-emerald-700" />
                    <span>Ministrado hoje às {med.ministradoHorario || '13:20'} por {med.ministradoPor || 'Profª Ana'}</span>
                  </div>
                )}
              </div>

              {/* Ação do Professor: Ministrar Medicamento (Dar Baixa) */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                {userRole === 'professor' && !med.suspenso && (
                  <button
                    onClick={() => {
                      setMinistrarModalMed(med);
                    }}
                    className={`w-full py-1.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs ${
                      med.ministradoHoje
                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    <Pill size={13} />
                    <span>{med.ministradoHoje ? 'Nova Dose Hoje' : 'Ministrar Medicamento (1-Clique)'}</span>
                  </button>
                )}

                {userRole === 'familia' && (
                  <div className="w-full flex items-center justify-between text-xs text-slate-500">
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Prescrição Ativa
                    </span>
                    <span className="text-[11px] font-bold text-indigo-600">
                      {med.ministradoHoje ? '✅ Tomado Hoje' : '⏳ Aguardando Horário'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de PIN de Mãe/Pai */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound size={18} className="text-indigo-600" />
                <h3 className="text-sm font-black text-slate-800">
                  PIN de Responsável Obrigatório
                </h3>
              </div>
              <button
                onClick={() => setShowPinModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Digite o PIN de 4 dígitos da mãe ou responsável legal para autorizar a medicação:
            </p>

            <div className="space-y-2 text-center">
              <input
                type="password"
                maxLength={4}
                autoFocus
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleVerifyPin();
                }}
                placeholder="••••"
                className="w-32 mx-auto text-center text-2xl font-black py-2 bg-slate-50 border-2 border-indigo-200 focus:border-indigo-600 rounded-xl outline-hidden tracking-widest"
              />
              {pinError && <p className="text-xs text-rose-600 font-bold">{pinError}</p>}
              <p className="text-[10px] text-slate-400 font-mono">PIN de teste: 1234</p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowPinModal(false)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleVerifyPin}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-xs"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Bloqueio para Professores */}
      {blockedTeacherModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-rose-100 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert size={22} />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-sm font-black text-slate-800">
                Ação Restrita aos Pais / Responsáveis
              </h3>
              <p className="text-xs text-slate-600">
                Professores têm permissão <strong>apenas para ministrar</strong> o medicamento. O cadastro,
                alteração ou suspensão são de responsabilidade exclusiva dos pais com PIN.
              </p>
            </div>
            <button
              onClick={() => setBlockedTeacherModal(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-black rounded-xl cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Modal de Cadastro de Medicação (Após PIN) */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Pill size={20} className="text-indigo-600" />
                <h3 className="text-base font-black text-slate-800">
                  Cadastrar Medicamento / Autorização Escolar
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMed} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Nome do Medicamento ou Procedimento *
                </label>
                <input
                  type="text"
                  required
                  value={nomeMed}
                  onChange={(e) => setNomeMed(e.target.value)}
                  placeholder="Ex: Paracetamol gotas, Soro nasal, Pomada..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Horário de Aplicação</label>
                  <input
                    type="time"
                    required
                    value={horarioMed}
                    onChange={(e) => setHorarioMed(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Dosagem Prescrita</label>
                  <input
                    type="text"
                    required
                    value={doseMed}
                    onChange={(e) => setDoseMed(e.target.value)}
                    placeholder="Ex: 10 gotas, 5 ml, 1 colher"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Observações ou Recomendações
                </label>
                <textarea
                  rows={2}
                  value={instrucaoMed}
                  onChange={(e) => setInstrucaoMed(e.target.value)}
                  placeholder="Ex: Diluir em pouca água; apenas se a febre passar de 37.8ºC..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:bg-white focus:border-indigo-500"
                ></textarea>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] flex items-center gap-2">
                <FileText size={16} className="text-emerald-700 flex-shrink-0" />
                <span>
                  Autorização validada com o PIN do responsável legal. O professor receberá notificação no diário.
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl transition shadow-xs cursor-pointer flex items-center justify-center gap-1"
                >
                  <Lock size={12} />
                  <span>Salvar com Assinatura PIN</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Ministrar Medicamento pelo Professor */}
      {ministrarModalMed && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Pill size={20} className="text-emerald-600" />
                <h3 className="text-base font-black text-slate-800">
                  Ministrar Medicamento
                </h3>
              </div>
              <button
                onClick={() => setMinistrarModalMed(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-950 text-xs space-y-1">
              <p className="font-bold text-sm">{ministrarModalMed.nome}</p>
              <p>Dose: <strong>{ministrarModalMed.dosagem}</strong></p>
              <p className="text-slate-500">Instruções: {ministrarModalMed.instrucoes}</p>
            </div>

            <form onSubmit={handleConfirmMinistracao} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Horário da Aplicação</label>
                <input
                  type="time"
                  required
                  value={ministrarHora}
                  onChange={(e) => setMinistrarHora(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Observação do Professor</label>
                <textarea
                  rows={2}
                  value={ministrarObs}
                  onChange={(e) => setMinistrarObs(e.target.value)}
                  placeholder="Ex: Tomou sem resistência, temperatura 37.5°C..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none"
                ></textarea>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMinistrarModalMed(null)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-xs"
                >
                  Confirmar Baixa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
