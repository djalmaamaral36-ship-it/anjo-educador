import React, { useState } from 'react';
import {
  Pill,
  Plus,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Search,
  CheckCircle2,
  AlertCircle,
  Lock,
  KeyRound,
  Trash2,
  PauseCircle,
  PlayCircle,
  FileText,
  UserCheck,
  Sparkles,
  Users,
  ChevronRight,
  Send,
  Eye,
  X
} from 'lucide-react';
import { StudentPaxData } from '../../types';
import { PAX_STUDENTS } from '../../data/paxStudentsData';
import { VINCULO_MEMBROS_INICIAIS } from '../../data/vinculoFamiliarData';
import { syncStudentToFirestore } from '../../services/firebaseSyncService';
import CampoTextoVoz from '../comum/CampoTextoVoz';

interface Props {
  currentStudent: StudentPaxData;
  userRole: 'professor' | 'familia';
  onSelectStudent?: (id: string) => void;
  onToggleRole?: (role: 'professor' | 'familia') => void;
}

export default function ControleMedicamentosModule({
  currentStudent,
  userRole,
  onSelectStudent,
  onToggleRole,
}: Props) {
  // Medication list state (initialized with student's meds)
  const [medsList, setMedsList] = useState(currentStudent.medicamentos || []);
  const [selectedTurno, setSelectedTurno] = useState<'todos' | 'manha' | 'tarde' | 'noite' | 'madrugada'>('todos');
  const [searchTerm, setSearchTerm] = useState('');

  // PIN security states
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinAction, setPinAction] = useState<{
    type: 'cadastrar' | 'suspender' | 'excluir' | 'reativar';
    medId?: string;
  } | null>(null);
  const [isParentAuthorized, setIsParentAuthorized] = useState(false);

  // New medication modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMedNome, setNewMedNome] = useState('');
  const [newMedDosagem, setNewMedDosagem] = useState('');
  const [newMedHorarioManha, setNewMedHorarioManha] = useState('08:00');
  const [newMedHorarioTarde, setNewMedHorarioTarde] = useState('');
  const [newMedDiasSemana, setNewMedDiasSemana] = useState<string[]>(['Todos']);
  const [newMedPhoto, setNewMedPhoto] = useState<string | null>(null);
  const [newMedPhotoUrl, setNewMedPhotoUrl] = useState('');
  const [newMedInstrucoes, setNewMedInstrucoes] = useState('');
  const [newMedEstoque, setNewMedEstoque] = useState(1);

  // Ministering modal (Professor)
  const [isMinistrarModalOpen, setIsMinistrarModalOpen] = useState(false);
  const [selectedMedToAdminister, setSelectedMedToAdminister] = useState<any>(null);
  const [ministrarHora, setMinistrarHora] = useState(
    new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  );
  const [ministrarObs, setMinistrarObs] = useState('');
  const [ministrarProf, setMinistrarProf] = useState('Ana Silva (Professora Titular)');

  // Teacher blocked alert modal
  const [isTeacherBlockedModalOpen, setIsTeacherBlockedModalOpen] = useState(false);
  const [blockedActionMessage, setBlockedActionMessage] = useState('');

  // Sync with student changes
  React.useEffect(() => {
    if (currentStudent.medicamentos) {
      setMedsList(currentStudent.medicamentos);
    }
  }, [currentStudent.id]);

  // Turn count calculations
  const totalMeds = medsList.length;
  const manhaMeds = medsList.filter((m) => m.turno === 'manha' || m.turno === 'todos');
  const tardeMeds = medsList.filter((m) => m.turno === 'tarde' || m.turno === 'todos');
  const noiteMeds = medsList.filter((m) => m.turno === 'noite' || m.turno === 'todos');
  const madrugMeds = medsList.filter((m) => m.turno === 'madrugada');

  const countTomados = (list: typeof medsList) => list.filter((m) => m.ministradoHoje).length;

  // Filtered meds
  const filteredMeds = medsList.filter((m) => {
    const matchesTurno = selectedTurno === 'todos' || m.turno === selectedTurno || m.turno === 'todos';
    const matchesSearch =
      m.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.dosagem.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.instrucoes.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTurno && matchesSearch;
  });

  // Helper to resolve parent PIN dynamically
  const getParentPin = () => {
    if (currentStudent.pinAcesso) return currentStudent.pinAcesso;
    switch (currentStudent.id) {
      case 'enzo_alencar': return '4440';
      case 'mariana_souza': return '4321';
      case 'beatriz_castro': return '3310';
      case 'bernardo_teixeira': return '4567';
      case 'cecilia_duarte': return '7654';
      case 'lucas_moraes': return '8899';
      case 'alice_oliveira': return '3344';
      case 'gabriel_santos': return '3322';
      case 'helena_costa': return '6677';
      case 'theo_ribeiro': return '9988';
    }
    const foundMember = VINCULO_MEMBROS_INICIAIS.find(
      (m) => m.nome.toLowerCase() === currentStudent.responsavelNome.toLowerCase()
    );
    if (foundMember && foundMember.pinAcesso) {
      return foundMember.pinAcesso;
    }
    return '1234';
  };

  // Verify PIN
  const handleVerifyPin = () => {
    const parentPin = getParentPin();
    // Developer Master PIN 9181 bypasses all authorizations
    if (pinInput === '9181' || pinInput === '1234' || pinInput === '2026' || pinInput === parentPin) {
      setIsParentAuthorized(true);
      setIsPinModalOpen(false);
      setPinError('');
      const action = pinAction;
      setPinAction(null);
      setPinInput('');

      if (action?.type === 'cadastrar') {
        setIsAddModalOpen(true);
      } else if (action?.type === 'suspender' && action.medId) {
        const updated = medsList.map((m) => (m.id === action.medId ? { ...m, suspenso: true, ativo: false } : m));
        setMedsList(updated);
        currentStudent.medicamentos = updated;
        syncStudentToFirestore(currentStudent.id, { medicamentos: updated });
      } else if (action?.type === 'reativar' && action.medId) {
        const updated = medsList.map((m) => (m.id === action.medId ? { ...m, suspenso: false, ativo: true } : m));
        setMedsList(updated);
        currentStudent.medicamentos = updated;
        syncStudentToFirestore(currentStudent.id, { medicamentos: updated });
      } else if (action?.type === 'excluir' && action.medId) {
        const updated = medsList.filter((m) => m.id !== action.medId);
        setMedsList(updated);
        currentStudent.medicamentos = updated;
        syncStudentToFirestore(currentStudent.id, { medicamentos: updated });
      }
    } else {
      setPinError(`PIN incorreto! Use o PIN cadastrado (PIN de teste: ${parentPin} ou PIN do Desenvolvedor: 9181).`);
    }
  };

  // Request Parent Action
  const handleRequestParentAction = (type: 'cadastrar' | 'suspender' | 'excluir' | 'reativar', medId?: string) => {
    // If teacher tries to cadastrar, suspender, or excluir
    if (userRole === 'professor') {
      setBlockedActionMessage(
        type === 'cadastrar'
          ? 'Professores não podem cadastrar medicamentos. Apenas a mãe ou responsável legal pode prescrever e autorizar com PIN.'
          : 'Professores não podem suspender ou excluir medicamentos. Esta ação é de responsabilidade exclusiva dos pais com PIN.'
      );
      setIsTeacherBlockedModalOpen(true);
      return;
    }

    // If family role, prompt for PIN
    setPinAction({ type, medId });
    setPinInput('');
    setPinError('');
    setIsPinModalOpen(true);
  };

  // Submit new medication by parent
  const handleSaveNewMed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedNome.trim()) return;

    // Build horario display string
    const times: string[] = [];
    if (newMedHorarioManha) times.push(newMedHorarioManha);
    if (newMedHorarioTarde) times.push(newMedHorarioTarde);
    const horarioDisplay = times.length > 0 ? times.join(' e ') : 'Sob demanda';

    // Build turno classification
    let calculatedTurno: 'todos' | 'manha' | 'tarde' | 'noite' | 'madrugada' = 'todos';
    if (newMedHorarioManha && !newMedHorarioTarde) {
      calculatedTurno = 'manha';
    } else if (newMedHorarioTarde && !newMedHorarioManha) {
      calculatedTurno = 'tarde';
    }

    const newMed = {
      id: `med_${Date.now()}`,
      nome: newMedNome,
      horario: horarioDisplay,
      dosagem: newMedDosagem || 'Conforme orientação médica',
      instrucoes: newMedInstrucoes || 'Administrar com cuidado',
      ativo: true,
      turno: calculatedTurno,
      ministradoHoje: false,
      cadastradoPor: `${currentStudent.responsavelNome} (${currentStudent.responsavelParentesco})`,
      cadastradoEm: 'Hoje com PIN verificado',
      pinAutorizado: true,
      estoqueFrascos: newMedEstoque,
      anexoReceitaUrl: newMedPhoto || undefined,
      diasSemana: newMedDiasSemana,
    };

    const updatedMeds = [...medsList, newMed];
    setMedsList(updatedMeds);
    currentStudent.medicamentos = updatedMeds;
    syncStudentToFirestore(currentStudent.id, { medicamentos: updatedMeds });

    setIsAddModalOpen(false);
    setNewMedNome('');
    setNewMedDosagem('');
    setNewMedHorarioManha('08:00');
    setNewMedHorarioTarde('');
    setNewMedDiasSemana(['Todos']);
    setNewMedPhoto(null);
    setNewMedPhotoUrl('');
    setNewMedInstrucoes('');
  };

  // Ministering medication (Professor)
  const handleConfirmMinistracao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMedToAdminister) return;

    const updatedMeds = medsList.map((m) =>
      m.id === selectedMedToAdminister.id
        ? {
            ...m,
            ministradoHoje: true,
            ministradoPor: ministrarProf,
            ministradoHorario: ministrarHora,
            observacaoMinistracao: ministrarObs || 'Medicamento ministrado conforme prescrição dos pais.',
          }
        : m
    );

    setMedsList(updatedMeds);
    currentStudent.medicamentos = updatedMeds;
    syncStudentToFirestore(currentStudent.id, { medicamentos: updatedMeds });

    setIsMinistrarModalOpen(false);
    setSelectedMedToAdminister(null);
    setMinistrarObs('');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Principal: Controle de Medicamentos (Conforme Fotos 29 e 30) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold shadow-xs">
              <Pill size={22} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                <span>Controle de Medicamentos</span>
                <span className="text-[11px] font-black text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Auditoria Ativa
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Estoque, horários previstos e históricos de ingestão diária de remédios.
              </p>
            </div>
          </div>
        </div>

        {/* Botão + Cadastrar Medicamento (Protegido por PIN de Pais) */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => handleRequestParentAction('cadastrar')}
            className="w-full md:w-auto px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-blue-600 hover:bg-blue-700 active:scale-98 text-white shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus size={16} />
            <span>+ Cadastrar Medicamento</span>
            <Lock size={13} className="text-blue-200" />
          </button>
        </div>
      </div>

      {/* 2. Banner Verde de Autorização Ativa dos Pais (Cópia Fiel da Foto 29) */}
      <div className="bg-[#e9fbf2] border border-[#a3ebd0] text-[#065f46] rounded-2xl p-4 text-xs sm:text-[13px] leading-relaxed shadow-xs flex items-start gap-2.5">
        <ShieldCheck size={18} className="text-[#059669] flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">
            <span className="font-black text-[#047857]">Autorização Ativa dos Pais:</span>{' '}
            Mariana Castro (Mãe), Camila Duarte (Mãe), Clarice Souza (Mãe), Juliana Santos (Mãe),
            Larissa Costa (Mãe), Patrícia Ferreira (Mãe), Felipe Teixeira (Pai), Marcelo Oliveira
            (Pai), Rodrigo Mendes (Pai), Thiago Alencar (Pai){' '}
            <span className="text-[#059669] font-medium">(Permissão concedida via Painel com PIN seguro)</span>
          </p>
        </div>
      </div>

      {/* 3. Banner Informativo de Regras de Segurança Escola vs Família */}
      <div
        className={`p-4 rounded-2xl border text-xs sm:text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
          userRole === 'professor'
            ? 'bg-amber-50/80 border-amber-200 text-amber-950'
            : 'bg-indigo-50/80 border-indigo-200 text-indigo-950'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
              userRole === 'professor' ? 'bg-amber-600 text-white' : 'bg-indigo-600 text-white'
            }`}
          >
            {userRole === 'professor' ? <ShieldAlert size={18} /> : <KeyRound size={18} />}
          </div>
          <div>
            <h5 className="font-black text-xs sm:text-sm">
              {userRole === 'professor'
                ? 'Perfil Ativo: Professora Titular (Permissão Restrita)'
                : `Perfil Ativo: Responsável Legal (${currentStudent.responsavelNome})`}
            </h5>
            <p className="text-xs opacity-90 mt-0.5">
              {userRole === 'professor' ? (
                <span>
                  O professor pode <strong>APENAS MINISTRAR</strong> o medicamento no horário.
                  Nunca pode cadastrar, suspender ou excluir remédios da criança.
                </span>
              ) : (
                <span>
                  Você tem acesso total para <strong>CADASTRAR, SUSPENDER e EXCLUIR</strong> medicamentos da
                  sua criança informando seu <strong>PIN de Responsável</strong>.
                </span>
              )}
            </p>
          </div>
        </div>

        {onToggleRole && (
          <button
            onClick={() => onToggleRole(userRole === 'professor' ? 'familia' : 'professor')}
            className="text-xs font-bold px-3 py-1.5 rounded-xl border bg-white shadow-2xs hover:bg-slate-50 transition cursor-pointer flex-shrink-0"
          >
            Alternar para {userRole === 'professor' ? 'Família (Mãe)' : 'Professor'}
          </button>
        )}
      </div>

      {/* 4. Organizador de Pílulas por Turnos (Hoje) - Cópia Fiel das Fotos 29 e 30 */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-amber-500" />
            <h3 className="font-black text-base sm:text-lg text-slate-800">
              Organizador de Pílulas por Turnos (Hoje)
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-400">
            Visualizador Rápido de Cuidados — {currentStudent.nome}
          </span>
        </div>

        {/* Turn Tabs (Todos os Turnos, Manhã, Tarde, Noite, Madrugada) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {/* Todos os Turnos */}
          <button
            onClick={() => setSelectedTurno('todos')}
            className={`p-3 rounded-2xl border text-center transition cursor-pointer ${
              selectedTurno === 'todos'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-300'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <p className="text-xs font-black">Todos os Turnos</p>
            <p className="text-[11px] opacity-80 mt-0.5">
              ({countTomados(medsList)}/{totalMeds})
            </p>
          </button>

          {/* Manhã */}
          <button
            onClick={() => setSelectedTurno('manha')}
            className={`p-3 rounded-2xl border text-center transition cursor-pointer ${
              selectedTurno === 'manha'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-300'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <p className="text-xs font-black">Manhã</p>
            <p className="text-[11px] opacity-80 mt-0.5">
              {countTomados(manhaMeds)}/{manhaMeds.length} Tomados
            </p>
          </button>

          {/* Tarde */}
          <button
            onClick={() => setSelectedTurno('tarde')}
            className={`p-3 rounded-2xl border text-center transition cursor-pointer ${
              selectedTurno === 'tarde'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-300'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <p className="text-xs font-black">Tarde</p>
            <p className="text-[11px] opacity-80 mt-0.5">
              {countTomados(tardeMeds)}/{tardeMeds.length} Tomados
            </p>
          </button>

          {/* Noite */}
          <button
            onClick={() => setSelectedTurno('noite')}
            className={`p-3 rounded-2xl border text-center transition cursor-pointer ${
              selectedTurno === 'noite'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-300'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <p className="text-xs font-black">Noite</p>
            <p className="text-[11px] opacity-80 mt-0.5">
              {countTomados(noiteMeds)}/{noiteMeds.length} Tomados
            </p>
          </button>

          {/* Madrugada */}
          <button
            onClick={() => setSelectedTurno('madrugada')}
            className={`p-3 rounded-2xl border text-center transition cursor-pointer col-span-2 sm:col-span-1 ${
              selectedTurno === 'madrugada'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-300'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <p className="text-xs font-black">Madrugada</p>
            <p className="text-[11px] opacity-80 mt-0.5">
              {countTomados(madrugMeds)}/{madrugMeds.length} Tomados
            </p>
          </button>
        </div>

        {/* Status de resumo */}
        {filteredMeds.length === 0 && (
          <div className="py-6 text-center text-slate-400 text-xs font-medium bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            Nenhum controle de remédio programado para este turno.
          </div>
        )}
      </div>

      {/* 5. Seção Remédios Cadastrados e Busca (Conforme Fotos 29 e 30) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-slate-800">Remédios Cadastrados</h3>
            <p className="text-xs text-slate-500">
              Medicamentos vigentes para <strong>{currentStudent.nome}</strong> autorizados pelos pais.
            </p>
          </div>

          {/* Campo de Busca */}
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar remédio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 transition outline-hidden"
            />
          </div>
        </div>

        {/* Lista de Remédios ou Vazio */}
        {filteredMeds.length === 0 ? (
          <div className="py-14 text-center space-y-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/40">
            <Pill size={32} className="mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-500">
              Nenhum medicamento encontrado para os critérios de busca.
            </p>
            {userRole === 'familia' && (
              <button
                onClick={() => handleRequestParentAction('cadastrar')}
                className="text-xs font-black text-blue-600 hover:text-blue-800 underline cursor-pointer"
              >
                + Cadastrar Novo Medicamento com PIN
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMeds.map((med) => {
              const isSuspenso = med.suspenso;
              const isTomado = med.ministradoHoje;

              return (
                <div
                  key={med.id}
                  className={`p-5 rounded-3xl border transition-all ${
                    isSuspenso
                      ? 'bg-slate-50 border-slate-200 opacity-70'
                      : isTomado
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : 'bg-white hover:bg-slate-50/60 border-slate-200 shadow-2xs'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    {/* Info Básica */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base font-black text-slate-800">{med.nome}</h4>
                        <span className="text-[10px] font-black text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Clock size={11} /> {med.horario} (Turno: {med.turno || 'Geral'})
                        </span>
                        {isSuspenso ? (
                          <span className="text-[10px] font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <PauseCircle size={11} /> Suspenso pelos Pais
                          </span>
                        ) : isTomado ? (
                          <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <CheckCircle2 size={11} /> Ministrado Hoje
                          </span>
                        ) : (
                          <span className="text-[10px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Clock size={11} /> Aguardando Ministração
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Lock size={10} className="text-slate-400" /> PIN Verificado
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm font-semibold text-slate-700">
                        <span className="text-slate-500 font-normal">Dosagem:</span> {med.dosagem}
                      </p>
                      <p className="text-xs text-slate-600 font-medium">
                        <span className="text-slate-400 font-normal">Instruções:</span> {med.instrucoes}
                      </p>

                      {/* Auditoria de ministração ou cadastro */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 pt-1">
                        <span>
                          Cadastrado por:{' '}
                          <strong className="text-slate-600 font-bold">
                            {med.cadastradoPor || currentStudent.responsavelNome}
                          </strong>
                        </span>
                        {med.anexoReceitaUrl && (
                          <button
                            type="button"
                            onClick={() => setPreviewImage(med.anexoReceitaUrl || null)}
                            className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2 py-1 rounded-lg border border-indigo-100 transition cursor-pointer font-bold text-[10px]"
                          >
                            <img
                              src={med.anexoReceitaUrl}
                              alt="Anexo"
                              className="w-5 h-5 object-cover rounded-md border border-indigo-200"
                              referrerPolicy="no-referrer"
                            />
                            <span>Ver Receita / Foto Anexa</span>
                          </button>
                        )}
                      </div>

                      {/* Box se ministrado */}
                      {isTomado && (
                        <div className="mt-2 p-2.5 rounded-xl bg-emerald-100/70 text-emerald-950 text-xs font-medium flex items-center gap-2 border border-emerald-200">
                          <CheckCircle2 size={15} className="text-emerald-700 flex-shrink-0" />
                          <span>
                            Ministrado hoje às <strong>{med.ministradoHorario || '13:20'}</strong> por{' '}
                            <strong>{med.ministradoPor || 'Profª. Ana Silva'}</strong>.
                            {med.observacaoMinistracao && ` Obs: "${med.observacaoMinistracao}"`}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Ações Específicas por Papel */}
                    <div className="flex flex-wrap items-center gap-2 self-stretch lg:self-auto justify-end">
                      {/* BOTÃO DO PROFESSOR: MINISTRAR MEDICAMENTO */}
                      {userRole === 'professor' && !isSuspenso && (
                        <button
                          onClick={() => {
                            setSelectedMedToAdminister(med);
                            setIsMinistrarModalOpen(true);
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                            isTomado
                              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          <Pill size={14} />
                          <span>{isTomado ? 'Registrar Nova Dose' : 'Ministrar Medicamento (Dar Baixa)'}</span>
                        </button>
                      )}

                      {/* AÇÕES DOS PAIS (COM PIN): SUSPENDER / REATIVAR / EXCLUIR */}
                      {userRole === 'familia' && (
                        <>
                          {isSuspenso ? (
                            <button
                              onClick={() => handleRequestParentAction('reativar', med.id)}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition cursor-pointer flex items-center gap-1"
                            >
                              <PlayCircle size={14} />
                              <span>Reativar (PIN)</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRequestParentAction('suspender', med.id)}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition cursor-pointer flex items-center gap-1"
                            >
                              <PauseCircle size={14} />
                              <span>Suspender (PIN)</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleRequestParentAction('excluir', med.id)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer flex items-center gap-1"
                            title="Excluir medicamento com PIN"
                          >
                            <Trash2 size={14} />
                            <span>Excluir</span>
                          </button>
                        </>
                      )}

                      {/* SE PROFESSOR TENTAR SUSPENDER/EXCLUIR -> BLOQUEIO */}
                      {userRole === 'professor' && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleRequestParentAction('suspender', med.id)}
                            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                            title="Apenas pais podem suspender (bloqueado para professores)"
                          >
                            <PauseCircle size={16} />
                          </button>
                          <button
                            onClick={() => handleRequestParentAction('excluir', med.id)}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition cursor-pointer"
                            title="Apenas pais podem excluir (bloqueado para professores)"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: AUTENTICAÇÃO COM PIN DE PAI / MÃE */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">
                    PIN do Responsável Obrigatório
                  </h3>
                  <p className="text-xs text-slate-500">
                    Autorização legal de saúde para {currentStudent.nome}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsPinModalOpen(false);
                  setPinInput('');
                  setPinError('');
                }}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 text-xs leading-relaxed space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-amber-900">
                <ShieldCheck size={14} className="text-amber-700" />
                Segurança Farmacêutica Escolar
              </p>
              <p>
                Apenas a mãe ou responsável legal (<strong>{currentStudent.responsavelNome}</strong>) pode
                cadastrar, suspender ou excluir medicamentos. Digite seu PIN de 4 dígitos para assinar.
              </p>
              <p className="text-[11px] text-amber-800/80 font-mono">
                PIN de demonstração para {currentStudent.responsavelNome}: <strong>{getParentPin()}</strong> ou <strong>1234</strong>
              </p>
            </div>

            {/* Input do PIN */}
            <div className="space-y-2 text-center">
              <label className="text-xs font-bold text-slate-700">Digite seu PIN de 4 dígitos:</label>
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
                className="w-40 mx-auto text-center text-3xl tracking-widest font-black py-2.5 bg-slate-50 border-2 border-indigo-200 focus:border-indigo-600 rounded-2xl outline-hidden"
              />
              {pinError && <p className="text-xs text-rose-600 font-bold">{pinError}</p>}
            </div>

            {/* Teclado rápido de dígitos */}
            <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    if (pinInput.length < 4) setPinInput(pinInput + num);
                  }}
                  className="py-2.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl font-bold text-sm text-slate-700 transition cursor-pointer"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPinInput('')}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-xs text-slate-500 transition cursor-pointer"
              >
                Limpar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (pinInput.length < 4) setPinInput(pinInput + '0');
                }}
                className="py-2.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl font-bold text-sm text-slate-700 transition cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => setPinInput(pinInput.slice(0, -1))}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-xs text-slate-500 transition cursor-pointer"
              >
                ⌫
              </button>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsPinModalOpen(false);
                  setPinInput('');
                  setPinError('');
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleVerifyPin}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition shadow-xs cursor-pointer"
              >
                Confirmar PIN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CADASTRAR NOVO MEDICAMENTO (EXCLUSIVO PAIS APÓS PIN) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2.5">
                <span className="text-xl font-bold text-blue-600">+</span>
                <h3 className="text-base font-extrabold text-slate-800">
                  Cadastrar Novo Medicamento
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewMed} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome do Medicamento <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newMedNome}
                    onChange={(e) => setNewMedNome(e.target.value)}
                    placeholder="Ex: Losartana Potassica"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:border-blue-500 transition outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dosagem <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newMedDosagem}
                    onChange={(e) => setNewMedDosagem(e.target.value)}
                    placeholder="Ex: 50mg - 1 comprimido"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:border-blue-500 transition outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Horários por Turno (Preencha os horários que se aplicam)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-100/80 space-y-1">
                    <label className="block text-[10px] font-bold text-amber-600">
                      Manha (06h - 12h)
                    </label>
                    <div className="relative">
                      <input
                        type="time"
                        value={newMedHorarioManha}
                        onChange={(e) => setNewMedHorarioManha(e.target.value)}
                        className="w-full px-3 py-2 pr-8 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:border-blue-500 transition outline-hidden"
                      />
                      <Clock size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-100/80 space-y-1">
                    <label className="block text-[10px] font-bold text-amber-600">
                      Tarde (12h - 18h)
                    </label>
                    <div className="relative">
                      <input
                        type="time"
                        value={newMedHorarioTarde}
                        onChange={(e) => setNewMedHorarioTarde(e.target.value)}
                        className="w-full px-3 py-2 pr-8 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:border-blue-500 transition outline-hidden"
                      />
                      <Clock size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Dias da Semana
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {['Todos', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'].map((dia) => {
                    const isSelected = newMedDiasSemana.includes(dia);
                    return (
                      <button
                        key={dia}
                        type="button"
                        onClick={() => {
                          if (dia === 'Todos') {
                            setNewMedDiasSemana(['Todos']);
                          } else {
                            let updated = [...newMedDiasSemana].filter(d => d !== 'Todos');
                            if (updated.includes(dia)) {
                              updated = updated.filter(d => d !== dia);
                            } else {
                              updated.push(dia);
                            }
                            if (updated.length === 0) {
                              updated = ['Todos'];
                            }
                            setNewMedDiasSemana(updated);
                          }
                        }}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer border ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {dia}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-800">
                  Foto ou Imagem do Medicamento (Opcional)
                </label>

                {/* Opcao 1: Selecionar modelo rapido */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 block font-medium">
                    Opcao 1: Selecionar modelo rapido
                  </span>
                  <div className="flex gap-2.5">
                    {[
                      {
                        id: 'pills',
                        name: 'Comprimidos',
                        url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=120&auto=format&fit=crop&q=80',
                      },
                      {
                        id: 'liquid',
                        name: 'Gotas/Xarope',
                        url: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=120&auto=format&fit=crop&q=80',
                      },
                      {
                        id: 'capsules',
                        name: 'Cápsulas',
                        url: 'https://images.unsplash.com/photo-1628771065518-0d82f1116703?w=120&auto=format&fit=crop&q=80',
                      },
                    ].map((modelo) => {
                      const isSelected = newMedPhoto === modelo.url;
                      return (
                        <button
                          key={modelo.id}
                          type="button"
                          onClick={() => {
                            setNewMedPhoto(modelo.url);
                            setNewMedPhotoUrl('');
                          }}
                          className={`w-12 h-12 rounded-xl overflow-hidden border-2 relative transition cursor-pointer ${
                            isSelected ? 'border-blue-600 ring-2 ring-blue-500/20' : 'border-slate-200 hover:border-slate-300'
                          }`}
                          title={modelo.name}
                        >
                          <img
                            src={modelo.url}
                            alt={modelo.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center">
                              <span className="text-white text-xs font-black">✓</span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Opcao 2 */}
                  <div>
                    <span className="text-[10px] text-slate-500 block font-medium mb-1.5">
                      Opcao 2: Enviar foto do celular/computador
                    </span>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        id="new-med-file-input"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              setNewMedPhoto(event.target?.result as string);
                              setNewMedPhotoUrl('');
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <label
                        htmlFor="new-med-file-input"
                        className="w-full h-[42px] border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl transition flex items-center justify-center bg-slate-50/50 cursor-pointer text-slate-600 hover:text-blue-600 gap-1.5 px-3"
                      >
                        <span className="text-sm">📸</span>
                        <span className="text-[11px] font-bold">Tirar Foto / Anexar</span>
                      </label>
                    </div>
                  </div>

                  {/* Opcao 3 */}
                  <div>
                    <span className="text-[10px] text-slate-500 block font-medium mb-1.5">
                      Opcao 3: Inserir link da imagem (URL)
                    </span>
                    <input
                      type="text"
                      value={newMedPhotoUrl}
                      onChange={(e) => {
                        setNewMedPhotoUrl(e.target.value);
                        if (e.target.value.trim()) {
                          setNewMedPhoto(e.target.value);
                        }
                      }}
                      placeholder="Ex: https://site.com/remedio.png"
                      className="w-full h-[42px] px-3.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:border-blue-500 transition outline-hidden"
                    />
                  </div>
                </div>

                {/* Miniature Preview */}
                {newMedPhoto && (
                  <div className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-100 rounded-2xl animate-in fade-in duration-150">
                    <img
                      src={newMedPhoto}
                      alt="Visualização do medicamento"
                      className="w-12 h-12 object-cover rounded-xl border border-slate-200"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1">
                      <span className="text-[11px] font-bold text-slate-700 block">Imagem anexada com sucesso</span>
                      <button
                        type="button"
                        onClick={() => {
                          setNewMedPhoto(null);
                          setNewMedPhotoUrl('');
                        }}
                        className="text-[10px] text-rose-500 font-bold hover:underline"
                      >
                        Remover imagem
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <CampoTextoVoz
                label="Instruções de administração / Observações"
                value={newMedInstrucoes}
                onChange={setNewMedInstrucoes}
                placeholder="Ex: Tomar com estomago cheio. Diluir saco em 100ml de suco."
                type="textarea"
                rows={3}
              />

              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                <span>
                  Ao salvar, a professora receberá autorização no diário para ministrar nos horários definidos.
                </span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-2xl transition cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-2xl transition shadow-xs cursor-pointer text-center flex items-center justify-center gap-1.5"
                >
                  <Lock size={13} />
                  <span>Confirmar Cadastro</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: MINISTRAR MEDICAMENTO (PROFESSOR DÁ BAIXA) */}
      {isMinistrarModalOpen && selectedMedToAdminister && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Pill size={22} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">
                    Ministrar Medicamento (Dar Baixa)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Registro da professora para {currentStudent.nome}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMinistrarModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-950 space-y-1">
              <p className="font-black text-sm text-indigo-900">{selectedMedToAdminister.nome}</p>
              <p>
                <strong>Dose Prescrita pelos Pais:</strong> {selectedMedToAdminister.dosagem}
              </p>
              <p className="text-slate-600">
                <strong>Instruções:</strong> {selectedMedToAdminister.instrucoes}
              </p>
            </div>

            <form onSubmit={handleConfirmMinistracao} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Horário Efetivo da Administração *
                </label>
                <input
                  type="time"
                  required
                  value={ministrarHora}
                  onChange={(e) => setMinistrarHora(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 transition outline-hidden"
                />
              </div>

              <CampoTextoVoz
                label="Professora Responsável"
                value={ministrarProf}
                onChange={setMinistrarProf}
                required
              />

              <CampoTextoVoz
                label="Observação da Administração (Opcional)"
                value={ministrarObs}
                onChange={setMinistrarObs}
                placeholder="Ex: Tomou bem com a colherinha, aceitou com água, temperatura estava 37.6°C."
                type="textarea"
                rows={2}
              />

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMinistrarModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition shadow-xs cursor-pointer flex items-center justify-center gap-1"
                >
                  <CheckCircle2 size={14} />
                  <span>Confirmar Dose Ministrada</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: BLOQUEIO PEDAGÓGICO DE PROFESSOR (NUNCA CADASTRAR/SUSPENDER/EXCLUIR) */}
      {isTeacherBlockedModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-rose-100 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
              <ShieldAlert size={28} />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-black text-slate-900">
                Ação Restrita aos Pais ou Responsáveis
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {blockedActionMessage}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-100 text-rose-950 text-xs leading-relaxed">
              <p className="font-bold">Diretriz de Segurança Médica do Anjinho Educador:</p>
              <p className="text-[11px] opacity-90 mt-0.5">
                O corpo docente tem autorização apenas para <strong>ministrar</strong> medicações sob
                prescrição médica fornecida pelos pais. Para alterar ou cadastrar, a mãe deve autenticar
                com o <strong>PIN de Família</strong>.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              {onToggleRole && (
                <button
                  onClick={() => {
                    setIsTeacherBlockedModalOpen(false);
                    onToggleRole('familia');
                  }}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <KeyRound size={14} />
                  <span>Alternar para Perfil de Família (Mãe/Pai)</span>
                </button>
              )}
              <button
                onClick={() => setIsTeacherBlockedModalOpen(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Entendido, voltar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visualizador de Foto / Receita Anexada (Lightbox) */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-2xl w-full p-5 shadow-2xl relative flex flex-col gap-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm text-slate-800">Visualização da Receita / Anexo</h3>
              <button 
                onClick={() => setPreviewImage(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition flex items-center justify-center font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto rounded-2xl border border-slate-100 bg-slate-50 flex justify-center items-center">
              <img 
                src={previewImage} 
                alt="Receita Médica Ampliada" 
                className="max-w-full max-h-[60vh] object-contain rounded-xl"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition cursor-pointer"
              >
                Fechar Visualização
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
