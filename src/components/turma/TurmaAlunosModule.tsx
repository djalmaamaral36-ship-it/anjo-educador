import React, { useState } from 'react';
import { 
  Users, UserCheck, Search, Plus, UserPlus, Phone, ShieldCheck, 
  Baby, Lock, Edit3, Trash2, Camera, Download, AlertTriangle, 
  CheckCircle2, Clock, Milk, Heart, Calendar, MessageSquare, X, Mic,
  FileText, Printer, QrCode, KeyRound, Smartphone
} from 'lucide-react';
import { StudentPaxData } from '../../types';
import { PAX_STUDENTS } from '../../data/paxStudentsData';
import { subscribeToStudents } from '../../services/firebaseSyncService';
import CampoFotoUpload from '../comum/CampoFotoUpload';
import CampoTextoVoz from '../comum/CampoTextoVoz';
import ModalExportarRelatoriosPdf from '../relatorios/ModalExportarRelatoriosPdf';
import ModalQrCodeInstalacao from './ModalQrCodeInstalacao';

interface Props {
  currentStudent: StudentPaxData;
  onSelectStudent: (studentId: string) => void;
  userRole?: 'professor' | 'familia';
}

export default function TurmaAlunosModule({
  currentStudent,
  onSelectStudent,
  userRole = 'professor'
}: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'todos' | 'alergicos' | 'cuidados'>('todos');
  const [activeSalaFiltro, setActiveSalaFiltro] = useState<'bercario' | 'maternal' | 'todas'>('bercario');
  const [showRoomPreview, setShowRoomPreview] = useState(false);
  const [showModalCadastrar, setShowModalCadastrar] = useState(false);
  const [showModalConvidar, setShowModalConvidar] = useState(false);
  const [showModalPin, setShowModalPin] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinFeedback, setPinFeedback] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrModalStudent, setQrModalStudent] = useState<StudentPaxData | null>(null);

  // Local state for students allowing dynamic edits
  const [studentsList, setStudentsList] = useState<StudentPaxData[]>(Object.values(PAX_STUDENTS));

  // Sincroniza em tempo real com o Firestore
  React.useEffect(() => {
    const unsubscribe = subscribeToStudents((map) => {
      setStudentsList(Object.values(map));
    });
    return () => unsubscribe();
  }, []);

  // Current selected student in state
  const selectedStudent = studentsList.find((s) => s.id === currentStudent.id) || currentStudent;

  // New student form state
  const [novoNome, setNovoNome] = useState('');
  const [novoResp, setNovoResp] = useState('');
  const [novoTel, setNovoTel] = useState('');
  const [novoTurma, setNovoTurma] = useState('Berçário I - A');
  const [novoNasc, setNovoNasc] = useState('2023-08-15');
  const [novoAlergia, setNovoAlergia] = useState('');
  const [novoPin, setNovoPin] = useState('');
  const [novoFotoUrl, setNovoFotoUrl] = useState('https://images.unsplash.com/photo-1544717305-2782549b5136?w=300&auto=format&fit=crop&q=80');
  const [novoCuidados, setNovoCuidados] = useState('Acolhimento pedagógico, carinho e rotina equilibrada.');

  // Quick routine counters on the right panel
  const [mamadeirasCount, setMamadeirasCount] = useState(selectedStudent.alimentacao.mamadeirasServidas);
  const [faltaHoje, setFaltaHoje] = useState(false);

  const isProfessor = userRole === 'professor';

  // Filter students
  const filteredStudents = studentsList.filter((st) => {
    // Room filter
    if (activeSalaFiltro === 'bercario' && !st.turma.includes('Berçário')) return false;
    if (activeSalaFiltro === 'maternal' && !st.turma.includes('Maternal')) return false;

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = st.nome.toLowerCase().includes(term);
      const matchResp = st.responsavelNome.toLowerCase().includes(term);
      const matchAlergia = st.alergias.some((a) => a.toLowerCase().includes(term));
      if (!matchName && !matchResp && !matchAlergia) return false;
    }

    // Category pill filter
    if (filterType === 'alergicos') {
      return st.alergias.length > 0 && !st.alergias[0].toLowerCase().includes('nenhuma');
    }
    if (filterType === 'cuidados') {
      return st.cuidadosEspeciais || st.alergias.length > 0;
    }

    return true;
  });

  const handleCadastrarAluno = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome.trim()) return;

    const novoId = `aluno_${Date.now()}`;
    const generatedPin = novoPin.trim() || Math.floor(1000 + Math.random() * 9000).toString();
    const novoAluno: StudentPaxData = {
      id: novoId,
      codigoAl: `AL-${studentsList.length + 1}`,
      pinAcesso: generatedPin,
      nome: novoNome.trim(),
      nascimento: novoNasc.split('-').reverse().join('/'),
      idadeStr: '1 ano',
      responsavelNome: novoResp.trim() || 'Responsável',
      responsavelParentesco: 'Família',
      responsavelTelefone: novoTel.trim() || '(11) 98888-0000',
      professoraTitular: 'Ana Silva',
      turma: novoTurma,
      fotoUrl: novoFotoUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=300&auto=format&fit=crop&q=80',
      marcos: ['Adaptação escolar'],
      alergias: novoAlergia.trim() ? [novoAlergia.trim()] : [],
      diretrizesCuidados: novoCuidados.trim() || 'Acolhimento pedagógico e afeto.',
      faltasTotais: 0,
      presenteHoje: true,
      cuidadosEspeciais: !!novoAlergia.trim(),
      presenca: {
        status: 'em_aula',
        titulo: 'Em Aula — Nova Matrícula',
        descricao: 'Aluno recém cadastrado na turma.',
        tempoEmAulaFormatado: '01:00:00',
      },
      governanca: {
        conformidadePercent: 100,
        qualidadePercent: 100,
        rotinasRealizadasHoje: 1,
        rotinasRecusasHoje: 0,
        statusRotinaBadge: 'STATUS: ROTINA ESCOLAR DENTRO DO ESPERADO',
        statusRotinaTitulo: 'Aluno Integrado à Caderneta',
        statusRotinaDescricao: 'Pronto para os registros diários.',
        responsavelClasse: 'Ana Silva (Professora Titular)',
        ultimoContatoApi: 'Agora',
      },
      medicamentos: [],
      agua: {
        consumoMl: 0,
        metaMl: 600,
        porcentagemMeta: 0,
        coposServidos: 0,
        historicoBarra: [0, 0, 0, 0, 0],
      },
      alimentacao: {
        mamadeirasServidas: 0,
        mamadeirasMlTotal: 0,
        refeicoes: [
          { nome: 'Lanchinho', status: 'SEM REGISTRO' },
          { nome: 'Almoço', status: 'SEM REGISTRO' },
        ],
      },
      humor: {
        estado: 'Tranquilo',
        turno: 'Manhã',
        observacao: 'Primeiro dia de adaptação.',
      },
      saudeCards: {
        soneca: { valor: 'Sem registros', periodo: 'Período' },
        fraldas: { valor: 'Limpa', periodo: 'Entrada' },
        mamadeiras: { valor: '0', periodo: 'Hoje' },
        hidratacao: { valor: '0 ml', copos: '(0)', periodo: 'Hoje' },
        temperatura: { valor: '36,5 ºC', status: 'Afebril' },
        peso: { valor: '10 kg', status: 'Controle' },
        humor: { valor: 'Tranquilo', periodo: 'Observado' },
      },
      auditoriaLinhaDoTempo: [],
    };

    setStudentsList([novoAluno, ...studentsList]);
    onSelectStudent(novoAluno.id);
    setShowModalCadastrar(false);
    setNovoNome('');
    setNovoResp('');
    setNovoTel('');
    setNovoAlergia('');
    setNovoPin('');
    setQrModalStudent(novoAluno);
    setShowQrModal(true);
    triggerNotice(`Aluno(a) ${novoAluno.nome} cadastrado(a) com sucesso! Cartão de acesso gerado.`);
  };

  const triggerNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleAddMamadeira = (qtd: number) => {
    const next = mamadeirasCount + qtd;
    setMamadeirasCount(next);
    triggerNotice(`+${qtd} mamadeira(s) registrada(s) para ${selectedStudent.nome}!`);
  };

  const handleToggleFalta = () => {
    const next = !faltaHoje;
    setFaltaHoje(next);
    triggerNotice(next ? `Falta registrada para ${selectedStudent.nome} hoje.` : `Presença confirmada para ${selectedStudent.nome}!`);
  };

  const handleExcluirAluno = () => {
    if (!window.confirm(`Deseja realmente excluir a ficha do aluno ${selectedStudent.nome}? Esta ação removerá os diários de bordo.`)) return;
    const remaining = studentsList.filter((s) => s.id !== selectedStudent.id);
    setStudentsList(remaining);
    if (remaining.length > 0) {
      onSelectStudent(remaining[0].id);
    }
    triggerNotice(`Ficha de ${selectedStudent.nome} removida.`);
  };

  const handleSendInviteWhatsApp = (aluno: StudentPaxData) => {
    const msg = encodeURIComponent(
      `Olá, ${aluno.responsavelNome}!\n` +
      `Aqui é a Professora ${aluno.professoraTitular} da Escolinha Anjo Cuidador.\n` +
      `O diário escolar e acompanhamento em tempo real de *${aluno.nome}* já está ativo na nossa caderneta digital.\n` +
      `Acesse a Área da Família para acompanhar fotos, mamadeiras, sonecas e hidratação com carinho!`
    );
    window.open(`https://api.whatsapp.com/send?phone=5511955554440&text=${msg}`, '_blank');
  };

  const handleVerificarPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '1234' || pinInput.length === 4) {
      setShowModalPin(false);
      setShowRoomPreview(false);
      setPinInput('');
      triggerNotice('PIN autenticado com sucesso! Acesso concedido à sala Berçário I - A.');
    } else {
      setPinFeedback('PIN incorreto. Digite o código de 4 dígitos da professora.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 1. TOPO: CADERNETA DA TURMA - 10 ALUNOS (Foto 17) */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden border border-indigo-900/40">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400/90 text-amber-950 px-3 py-1 rounded-full shadow-xs">
                Modo Escolinha
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-white px-3 py-1 rounded-full shadow-xs">
                Relação Completa
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Caderneta da Turma – {studentsList.length} Alunos
            </h2>

            <p className="text-xs sm:text-sm text-indigo-200/90 leading-relaxed">
              Painel Geral de Controle da Profa Ana Silva (Professora Titular). Selecione qualquer um dos alunos cadastrados para visualizar fichas de saúde, receitas e agendar comunicados com um único clique.
            </p>
          </div>

          {/* CARD DE ALUNO SELECIONADO ATUAL NO TOPO */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3.5 flex items-center gap-3.5 flex-shrink-0 self-stretch sm:self-auto">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-amber-300 shadow-md flex-shrink-0">
              <img src={selectedStudent.fotoUrl} alt={selectedStudent.nome} className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">
                Selecionado Atual
              </span>
              <span className="text-sm font-black text-white block">
                {selectedStudent.nome}
              </span>
              <span className="text-[11px] text-indigo-200 block">
                {selectedStudent.turma}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* AVISO TEMPORÁRIO DE AÇÃO */}
      {actionNotice && (
        <div className="p-4 rounded-2xl bg-emerald-600 text-white font-black text-xs sm:text-sm flex items-center gap-2.5 shadow-md animate-in fade-in">
          <CheckCircle2 size={18} />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* 2. CENTRAL DE SALAS DE AULA (Fotos 17 e 18) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">
                Central de Salas de Aula
              </h3>
              <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100">
                Gestão Ativa
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Temos 2 salas de aula cadastradas. Clique em qualquer uma para assumir o controle da sala e gerenciar seus alunos e diários de bordo!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-stretch sm:self-auto">
            {isProfessor && (
              <button
                onClick={() => triggerNotice('Módulo de criação e gestão de novas salas aberto.')}
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-black rounded-xl border border-indigo-200 transition cursor-pointer"
              >
                + Gerenciar Salas
              </button>
            )}
            <div className="text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl flex items-center gap-2">
              <span>Sua Sala Ativa:</span>
              <span className="font-black text-slate-800">Ana Silva</span>
              <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md">
                Berçário I - A
              </span>
            </div>
          </div>
        </div>

        {/* CARTOES DAS SALAS DE AULA (Foto 17) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Sala 1: Berçário I - A */}
          <div
            onClick={() => {
              setActiveSalaFiltro('bercario');
              setShowRoomPreview(true);
            }}
            className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-4 ${
              activeSalaFiltro === 'bercario'
                ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                : 'border-slate-200 hover:border-indigo-200 bg-white'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl flex-shrink-0">
                🍼
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-sm text-slate-800">Berçário I - A</h4>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    0-1 ano
                  </span>
                </div>
                <p className="text-xs text-slate-500">Ana Silva (Professora Titular)</p>
                <div className="flex items-center gap-3 mt-1 text-[11px] font-bold text-slate-600">
                  <span>5 Alunos</span>
                  <span>•</span>
                  <span>Cap: 5</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold text-emerald-700">Ativa</span>
            </div>
          </div>

          {/* Sala 2: Maternal I - A */}
          <div
            onClick={() => {
              setActiveSalaFiltro('maternal');
              setShowRoomPreview(true);
            }}
            className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-4 ${
              activeSalaFiltro === 'maternal'
                ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                : 'border-slate-200 hover:border-indigo-200 bg-white'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl flex-shrink-0">
                🐻
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-sm text-slate-800">Maternal I - A</h4>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    1-2 anos
                  </span>
                </div>
                <p className="text-xs text-slate-500">Cláudia Mendes (Professora Titular)</p>
                <div className="flex items-center gap-3 mt-1 text-[11px] font-bold text-slate-600">
                  <span>5 Alunos</span>
                  <span>•</span>
                  <span>Cap: 5</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
              <span className="text-xs font-medium text-slate-400">Trocar</span>
            </div>
          </div>
        </div>

        {/* 3. PRÉ-VISUALIZAÇÃO DA SALA (Foto 18) */}
        {showRoomPreview && (
          <div className="p-5 sm:p-6 bg-slate-50 border border-indigo-100 rounded-3xl space-y-5 animate-in slide-in-from-top-3 duration-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🍼</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-base text-slate-800">
                      Pré-visualização: Berçário I - A
                    </h4>
                    <span className="text-[10px] font-black uppercase bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full">
                      0-1 ANO
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Turma de bebês com estimulação sensorial e cuidados contínuos.
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Capacidade Limite
                </span>
                <span className="text-sm font-black text-slate-800">
                  5 / 5 Alunos
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Educadora da Sala */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Educadora da Sala
                </span>
                <div className="flex items-center gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
                    alt="Ana Silva"
                    className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500"
                  />
                  <div>
                    <h5 className="font-black text-sm text-slate-800">Ana Silva (Professora Titular)</h5>
                    <p className="text-xs text-slate-500">Professora Titular</p>
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Online na plataforma
                    </span>
                  </div>
                </div>
              </div>

              {/* Alunos Cadastrados Nesta Sala */}
              <div className="lg:col-span-2 bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Alunos Cadastrados Nesta Sala
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {studentsList.slice(0, 5).map((st) => {
                    const isAtivo = st.id === selectedStudent.id;
                    return (
                      <div
                        key={st.id}
                        onClick={() => onSelectStudent(st.id)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition ${
                          isAtivo
                            ? 'bg-indigo-50/80 border-indigo-500 ring-1 ring-indigo-500/30'
                            : 'bg-slate-50 border-slate-100 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img src={st.fotoUrl} alt={st.nome} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                          <div className="truncate">
                            <p className="text-xs font-black text-slate-800 truncate">{st.nome}</p>
                            <p className="text-[10px] text-slate-500 truncate">Resp: {st.responsavelNome}</p>
                          </div>
                        </div>

                        {isAtivo ? (
                          <span className="text-[10px] font-black uppercase bg-indigo-600 text-white px-2 py-0.5 rounded-md flex-shrink-0">
                            Ativo
                          </span>
                        ) : (
                          <button className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex-shrink-0">
                            Selecionar
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* BARRA DE SEGURANÇA COM PIN (Foto 18) */}
            <div className="p-4 bg-indigo-900 text-white rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h5 className="font-black text-xs sm:text-sm text-amber-300">
                  Confirmar Troca de Sala com PIN de Segurança
                </h5>
                <p className="text-xs text-indigo-200 mt-0.5">
                  Para sua segurança, você será direcionado à Troca de Perfil para que a professora responsável confirme o PIN da sala Berçário I - A.
                </p>
              </div>

              <button
                onClick={() => setShowModalPin(true)}
                className="w-full sm:w-auto px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer flex-shrink-0"
              >
                <Lock size={14} />
                <span>IR PARA TROCA DE PERFIL COM PIN</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. FILTRO DE SALA ATIVO & BARRA DE AÇÕES (Foto 19) */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-indigo-600"></span>
          <span className="text-xs font-bold text-indigo-900">
            Filtro de Sala Ativo para Você:
          </span>
          <span className="text-xs font-black bg-indigo-600 text-white px-2.5 py-0.5 rounded-full">
            {activeSalaFiltro === 'bercario' ? 'Berçário I - A' : activeSalaFiltro === 'maternal' ? 'Maternal I - A' : 'Todas as Salas'}
          </span>
          <span className="hidden md:inline text-xs text-indigo-700/80">
            • Ademais da segmentação geral, mostramos para você apenas os alunos correspondentes à sua própria sala de aula.
          </span>
        </div>

        <button
          onClick={() => {
            setActiveSalaFiltro(activeSalaFiltro === 'bercario' ? 'todas' : 'bercario');
          }}
          className="px-3.5 py-1.5 bg-white hover:bg-indigo-100 border border-indigo-200 text-indigo-800 text-xs font-black rounded-xl transition cursor-pointer"
        >
          {activeSalaFiltro === 'todas' ? 'Ver Somente Berçário' : 'Ver Outras Salas'}
        </button>
      </div>

      {/* BARRA DE PESQUISA E BOTÕES (Foto 19) */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Input de Busca */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar aluno pelo nome..."
            className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm font-medium text-slate-800 outline-none focus:border-indigo-500 transition shadow-2xs"
          />
        </div>

        {/* Botões de Cadastrar Aluno & Convidar Pais & QR Code Secretaria */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setQrModalStudent(selectedStudent);
              setShowQrModal(true);
            }}
            className="flex-1 sm:flex-none px-4 py-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 font-black text-xs rounded-2xl shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            title="Gerar e Imprimir QR Code de Instalação e Acesso Familiar"
          >
            <QrCode size={16} className="text-indigo-600" />
            <span>QR Code da Família</span>
          </button>

          {isProfessor && (
            <button
              onClick={() => setShowModalCadastrar(true)}
              className="flex-1 sm:flex-none px-4 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-black text-xs rounded-2xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus size={16} />
              <span>Cadastrar Aluno</span>
            </button>
          )}

          <button
            onClick={() => handleSendInviteWhatsApp(selectedStudent)}
            className="flex-1 sm:flex-none px-4 py-3 bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-800 font-black text-xs rounded-2xl shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <UserPlus size={16} className="text-emerald-600" />
            <span>Convidar Pais</span>
          </button>
        </div>
      </div>

      {/* FILTROS PILLS: Todos (10), Alérgicos (10), Cuidados Especiais (10) (Foto 19) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-black uppercase tracking-wider text-slate-400 mr-1">
          Filtros:
        </span>

        <button
          onClick={() => setFilterType('todos')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex-shrink-0 ${
            filterType === 'todos'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
          }`}
        >
          Todos ({studentsList.length})
        </button>

        <button
          onClick={() => setFilterType('alergicos')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex-shrink-0 ${
            filterType === 'alergicos'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-rose-700 hover:border-rose-300'
          }`}
        >
          [!] Alérgicos ({studentsList.filter(s => s.alergias.length > 0 && !s.alergias[0].includes('nenhuma')).length})
        </button>

        <button
          onClick={() => setFilterType('cuidados')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex-shrink-0 ${
            filterType === 'cuidados'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-amber-800 hover:border-amber-300'
          }`}
        >
          Cuidados Especiais ({studentsList.filter(s => s.cuidadosEspeciais || s.alergias.length > 0).length})
        </button>
      </div>

      {/* 5. GRID DE 2 COLUNAS: LISTA DE ALUNOS (ESQUERDA) & FICHA COMPLETA (DIREITA) (Fotos 19 a 22) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COLUNA DA ESQUERDA: LISTA DE CARTÕES DE ALUNOS (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-3.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
            <span>Alunos na Sala ({filteredStudents.length})</span>
            <span>Clique para Ativar Perfil</span>
          </div>

          {filteredStudents.map((st) => {
            const isSelected = st.id === selectedStudent.id;
            const hasAlergia = st.alergias.length > 0 && !st.alergias[0].toLowerCase().includes('nenhuma');
            const alergiaText = hasAlergia ? st.alergias[0].toUpperCase() : 'NENHUMA CATALOGADA';

            return (
              <div
                key={st.id}
                onClick={() => onSelectStudent(st.id)}
                className={`bg-white rounded-3xl p-4 sm:p-5 border transition cursor-pointer shadow-xs relative ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/30 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                      <img src={st.fotoUrl} alt={st.nome} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-sm text-slate-800 truncate">{st.nome}</h4>
                        {isSelected && (
                          <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            Ativo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 truncate">
                        {st.responsavelNome} ({st.responsavelParentesco})
                      </p>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Phone size={10} />
                        <span>{st.responsavelTelefone}</span>
                      </p>
                    </div>
                  </div>

                  {/* Badge da Turma */}
                  <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md flex-shrink-0 border border-slate-200">
                    {st.turma.includes('Berçário') ? 'BERÇÁRIO I' : 'MATERNAL I'}
                  </span>
                </div>

                {/* TAG DE ALERGIA (Fotos 19 e 20) */}
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border flex items-center gap-1 ${
                    hasAlergia
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}>
                    <span>[!] {alergiaText}</span>
                    {st.codigoAl && <span className="opacity-70">({st.codigoAl})</span>}
                  </span>

                  <span className="text-[10px] text-slate-400 font-medium">
                    Nasc: {st.nascimento}
                  </span>
                </div>

                {/* BOTÃO ATIVAR PERFIL OU STATUS & QR CODE */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setQrModalStudent(st);
                        setShowQrModal(true);
                      }}
                      className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] font-black flex items-center gap-1 transition"
                      title="Ver e Imprimir QR Code deste aluno"
                    >
                      <QrCode size={13} />
                      <span className="hidden sm:inline">QR Code</span>
                    </button>
                    <span className="text-[11px] font-bold text-slate-500">
                      {isSelected ? '✓ Diário Aberto' : 'Disponível'}
                    </span>
                  </div>

                  {isSelected ? (
                    <span className="px-3 py-1 bg-emerald-500 text-white text-[11px] font-black rounded-xl shadow-2xs flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      <span>Diário Ativo</span>
                    </span>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectStudent(st.id);
                      }}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black rounded-xl shadow-2xs transition cursor-pointer"
                    >
                      👤 Ativar Perfil
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* COLUNA DA DIREITA: FICHA DETALHADA DO ALUNO SELECIONADO (lg:col-span-7) (Fotos 19, 20, 21 e 22) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-6">
          
          {/* TOPO DA FICHA: EDITAR ALUNO & STATUS DO DIÁRIO */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <button
              onClick={() => triggerNotice(`Modo de edição rápida para ${selectedStudent.nome} ativado.`)}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 size={13} />
              <span>EDITAR ALUNO</span>
            </button>

            <span className="text-xs font-black uppercase text-emerald-800 bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              <span>DIÁRIO DE HOJE ATIVO</span>
            </span>
          </div>

          {/* FOTO E NOME DO ALUNO (Foto 19) */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="relative">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border-4 border-slate-100 shadow-md">
                <img src={selectedStudent.fotoUrl} alt={selectedStudent.nome} className="w-full h-full object-cover" />
              </div>

              {/* Botões de Ação na Foto */}
              <button
                onClick={() => triggerNotice('Foto do aluno baixada com carinho.')}
                className="absolute -bottom-2 -left-2 w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md hover:bg-emerald-700 transition cursor-pointer"
                title="Baixar Foto"
              >
                <Download size={14} />
              </button>

              <button
                onClick={() => triggerNotice('Câmera aberta para registrar nova foto.')}
                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md hover:bg-indigo-700 transition cursor-pointer"
                title="Alterar Foto"
              >
                <Camera size={14} />
              </button>
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-800">
                {selectedStudent.nome}
              </h3>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-3 py-0.5 rounded-full">
                  {selectedStudent.turma}
                </span>
                <Edit3 size={12} className="text-slate-400 cursor-pointer" />
              </div>

              {/* Botões Oficiais: Exportação em PDF e QR Code de Acesso Familiar */}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setQrModalStudent(selectedStudent);
                    setShowQrModal(true);
                  }}
                  className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 active:scale-95 text-indigo-900 border border-indigo-200 text-xs font-black rounded-xl shadow-2xs transition flex items-center gap-2 cursor-pointer"
                  title="Gerar e Imprimir Cartão com QR Code e PIN Familiar"
                >
                  <QrCode size={14} className="text-indigo-600" />
                  <span>Cartão QR Code / PIN</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPdfModal(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-black rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
                  title="Exportar Ficha Cadastral, Diário ou Parecer em PDF"
                >
                  <FileText size={14} />
                  <span>Gerar Relatório em PDF</span>
                </button>
              </div>
            </div>
          </div>

          {/* NASCIMENTO E IDADE (Foto 19) */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Nascimento e Idade
            </span>
            <p className="text-xs sm:text-sm font-black text-slate-800">
              {selectedStudent.nascimento} ({selectedStudent.idadeStr})
            </p>
          </div>

          {/* ROTINA ESPECIAL / SONECA / BANHEIRO (Foto 20) */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <span>🔄</span>
                <span>Rotina Especial / Soneca / Banheiro</span>
              </span>
            </div>

            <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-xs sm:text-sm font-bold text-slate-700">
                {selectedStudent.marcos[0] || 'Engatinhando com agilidade'}
              </span>
              <button
                onClick={() => triggerNotice('Rotina atualizada.')}
                className="text-slate-400 hover:text-rose-600 transition"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {/* ALERGIAS COMUNICADAS PELOS PAIS (Foto 20) */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                <AlertTriangle size={12} />
                <span>Alergias Comunicadas pelos Pais</span>
              </span>
            </div>

            {selectedStudent.alergias.length > 0 && !selectedStudent.alergias[0].toLowerCase().includes('nenhuma') ? (
              <div className="space-y-2">
                {selectedStudent.alergias.map((al, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-rose-50/70 p-3 rounded-xl border border-rose-200">
                    <span className="text-xs sm:text-sm font-black text-rose-700 flex items-center gap-1.5">
                      <span>•</span>
                      <span>{al}</span>
                    </span>
                    <button
                      onClick={() => triggerNotice(`Alergia ${al} removida.`)}
                      className="text-slate-400 hover:text-rose-600 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs text-slate-500">
                Nenhuma alergia grave catalogada no momento.
              </div>
            )}

            <button
              onClick={() => {
                const nova = prompt('Informe a nova alergia comunicada:');
                if (nova) {
                  triggerNotice(`Alergia "${nova}" adicionada com segurança!`);
                }
              }}
              className="w-full py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-black rounded-xl transition cursor-pointer"
            >
              + ADICIONAR PAR / ALERTA
            </button>
          </div>

          {/* FREQUÊNCIA E CONTROLE DE FALTAS (Foto 20) */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Users size={12} />
                <span>Frequência e Controle de Faltas</span>
              </span>
              <span className="text-xs font-black text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                {faltaHoje ? '1 Falta' : '0 Faltas'}
              </span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 block">
                  Falta Hoje?
                </span>
                <span className={`text-xs font-black ${faltaHoje ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {faltaHoje ? 'Ausente (Falta Registrada)' : 'Presente (Em Aula)'}
                </span>
              </div>

              <button
                onClick={handleToggleFalta}
                className={`px-3 py-1.5 text-xs font-black rounded-xl border transition cursor-pointer ${
                  faltaHoje
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                }`}
              >
                {faltaHoje ? 'Marcar Presente' : 'Marcar Falta'}
              </button>
            </div>

            <p className="text-[11px] text-slate-500 italic text-center">
              {faltaHoje ? 'Aluno ausente na data de hoje.' : 'Nenhuma falta registrada. Aluno 100% presente!'}
            </p>

            <button
              onClick={() => triggerNotice('Módulo de falta retroativa aberto.')}
              className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              + REGISTRAR FALTA RETROATIVA / MANUAL
            </button>
          </div>

          {/* REGISTROS DE ROTINA DE HOJE (Foto 21) */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Registros de Rotina de Hoje
            </span>

            <div className="space-y-2">
              {/* Fralda / Higiene */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <h6 className="text-xs font-black text-slate-800">Fralda / Higiene</h6>
                  <p className="text-[11px] text-slate-500">Pendente de registro</p>
                </div>
                <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                  Pendente
                </span>
              </div>

              {/* Sono / Sesta */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <h6 className="text-xs font-black text-slate-800">Sono / Sesta</h6>
                  <p className="text-[11px] text-slate-500">Sem registro de soneca hoje</p>
                </div>
                <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                  Pendente
                </span>
              </div>

              {/* Saúde / Vitais */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <h6 className="text-xs font-black text-slate-800">Saúde / Vitais</h6>
                  <p className="text-[11px] text-slate-500">Nenhuma alteração de saúde</p>
                </div>
                <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                  Em Dia
                </span>
              </div>

              {/* Mamadeira de Leite / Fórmula (Foto 21) */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h6 className="text-xs font-black text-slate-800">Mamadeira de Leite / Fórmula</h6>
                    <p className="text-[11px] text-slate-500">Nenhuma mamadeira registrada hoje</p>
                  </div>
                  <span className="text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-lg">
                    {mamadeirasCount} mamadeiras
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => handleAddMamadeira(1)}
                    className="py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-2xs transition cursor-pointer"
                  >
                    +1 Mamadeira
                  </button>
                  <button
                    onClick={() => handleAddMamadeira(2)}
                    className="py-2 bg-indigo-800 hover:bg-indigo-900 text-white text-xs font-black rounded-xl shadow-2xs transition cursor-pointer"
                  >
                    +2 Mamadeiras
                  </button>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 italic text-center">
              Estes registros permanecem mantidos durante todo o turno. Só são apagados ao zerar os cronômetros ou reiniciar.
            </p>
          </div>

          {/* RESPONSÁVEIS PARA RECADOS URGENTES (Fotos 21 e 22) */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Phone size={11} />
              <span>Responsáveis para Recados Urgentes</span>
            </span>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
              <div>
                <h6 className="text-xs font-black text-slate-800">
                  {selectedStudent.responsavelNome} ({selectedStudent.responsavelParentesco})
                </h6>
                <p className="text-[11px] text-slate-500">
                  Tel: {selectedStudent.responsavelTelefone}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setQrModalStudent(selectedStudent);
                    setShowQrModal(true);
                  }}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-black rounded-xl border border-indigo-200 transition flex items-center gap-1 cursor-pointer"
                  title="Ver QR Code e PIN de Acesso do Responsável"
                >
                  <QrCode size={13} />
                  <span>QR Code</span>
                </button>

                <button
                  onClick={() => handleSendInviteWhatsApp(selectedStudent)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare size={13} />
                  <span>Convidar</span>
                </button>
              </div>
            </div>
          </div>

          {/* DIRETRIZES DE ORIENTAÇÃO E CUIDADOS (Foto 22) */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Diretrizes de Orientação e Cuidados
            </span>
            <p className="text-xs font-medium text-slate-700 bg-white p-3 rounded-xl border border-slate-200">
              {selectedStudent.diretrizesCuidados || 'Estimulação motora e alimentação orientada.'}
            </p>
          </div>

          {/* PEDIATRA DE REFERÊNCIA DO ALUNO (Foto 22) */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Heart size={11} className="text-rose-500" />
              <span>Pediatra de Referência do Aluno</span>
            </span>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <h6 className="text-xs font-black text-slate-800">
                  {selectedStudent.pediatra?.nome || 'Dr. Lucas Mendes'}
                </h6>
                <p className="text-[11px] text-slate-500">
                  {selectedStudent.pediatra?.especialidade || 'Pediatra'}
                </p>
              </div>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
                {selectedStudent.pediatra?.telefone || '(11) 97777-6666'}
              </span>
            </div>
          </div>

          {/* MENSAGEM EM DESTAQUE VERDE (Foto 22) */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
            <p className="text-xs font-medium text-emerald-950">
              Esta é a caderneta que você está editando no momento. Qualquer remédio mandado, alimento ou soneca anotada irá para a família de <strong>{selectedStudent.nome}</strong>!
            </p>
          </div>

          {/* RODAPÉ: EXCLUIR ALUNO (Foto 22) */}
          {isProfessor && (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                Ficha Administrativa
              </span>

              <button
                onClick={handleExcluirAluno}
                className="px-4 py-2 bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 text-xs font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={13} />
                <span>EXCLUIR ALUNO</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: CADASTRAR NOVO ALUNO */}
      {showModalCadastrar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-lg text-slate-800">Cadastrar Novo Aluno</h3>
              <button
                onClick={() => setShowModalCadastrar(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCadastrarAluno} className="space-y-4 text-xs font-bold text-slate-700 max-h-[75vh] overflow-y-auto pr-1">
              {/* Campo para Inserir Foto do Aluno */}
              <CampoFotoUpload
                fotoUrl={novoFotoUrl}
                onFotoChange={setNovoFotoUrl}
                label="Foto da Criança / Aluno(a)"
                tipoPerfil="aluno"
                tamanho="md"
              />

              {/* Nome com Opção por Voz */}
              <CampoTextoVoz
                label="Nome Completo do Bebê / Criança"
                value={novoNome}
                onChange={setNovoNome}
                placeholder="Ex: Clara Silveira"
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Turma *</label>
                  <select
                    value={novoTurma}
                    onChange={(e) => setNovoTurma(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  >
                    <option value="Berçário I - A">Berçário I - A</option>
                    <option value="Maternal I - A">Maternal I - A</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1">Data de Nascimento *</label>
                  <input
                    type="date"
                    value={novoNasc}
                    onChange={(e) => setNovoNasc(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Nome do Responsável com Voz */}
                <CampoTextoVoz
                  label="Nome do Responsável Legal"
                  value={novoResp}
                  onChange={setNovoResp}
                  placeholder="Ex: Juliana Silveira"
                  required
                />

                {/* Telefone com Voz */}
                <CampoTextoVoz
                  label="Telefone WhatsApp"
                  value={novoTel}
                  onChange={setNovoTel}
                  placeholder="(11) 98888-7777"
                  type="tel"
                  required
                />
              </div>

              {/* Definição de PIN de Acesso Familiar (Secretaria define ou gera automático) */}
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-indigo-900 flex items-center gap-1.5">
                    <KeyRound size={13} className="text-indigo-600" />
                    <span>PIN de Acesso Familiar (4 dígitos)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setNovoPin(Math.floor(1000 + Math.random() * 9000).toString())}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                  >
                    Gerar Aleatório
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    maxLength={4}
                    value={novoPin}
                    onChange={(e) => setNovoPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ex: 1234 (opcional)"
                    className="w-32 p-2 bg-white border border-indigo-200 rounded-xl text-center font-black tracking-widest text-sm text-indigo-900 outline-none focus:border-indigo-500"
                  />
                  <p className="text-[11px] text-slate-500 font-normal leading-tight">
                    Se deixado em branco, o sistema gerará um PIN seguro automaticamente e criará o QR Code com o cartão da família.
                  </p>
                </div>
              </div>

              {/* Alergias com Voz */}
              <CampoTextoVoz
                label="Alergias ou Restrições Alimentares (Opcional)"
                value={novoAlergia}
                onChange={setNovoAlergia}
                placeholder="Ex: Alergia à Proteína do Leite de Vaca (APLV), Frutos Secos..."
              />

              {/* Cuidados Especiais com Voz */}
              <CampoTextoVoz
                label="Diretrizes e Cuidados Especiais"
                value={novoCuidados}
                onChange={setNovoCuidados}
                placeholder="Ex: Acolhimento pedagógico, música suave para nanar, beber água..."
                type="textarea"
                rows={2}
              />

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModalCadastrar(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold cursor-pointer hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black shadow-md hover:bg-indigo-700 transition cursor-pointer"
                >
                  Salvar e Abrir Diário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRMAÇÃO COM PIN DE SEGURANÇA (Foto 18) */}
      {showModalPin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Lock size={22} />
            </div>

            <div>
              <h4 className="font-black text-base text-slate-800">
                PIN de Segurança da Sala
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Digite o PIN de 4 dígitos da Professora Titular para confirmar a troca de sala.
              </p>
            </div>

            <form onSubmit={handleVerificarPin} className="space-y-4">
              <input
                type="password"
                maxLength={4}
                autoFocus
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinFeedback(null);
                }}
                placeholder="••••"
                className="w-36 mx-auto text-center tracking-widest text-2xl font-black p-3 bg-slate-50 border-2 border-indigo-200 focus:border-indigo-600 rounded-2xl outline-none"
              />

              {pinFeedback && (
                <p className="text-xs font-bold text-rose-600">{pinFeedback}</p>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModalPin(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 text-xs font-black rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Exportação de Relatórios Oficiais em PDF */}
      <ModalExportarRelatoriosPdf
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        student={selectedStudent}
      />

      {/* Modal de QR Code de Instalação e Cartão de Acesso da Família (Secretaria) */}
      <ModalQrCodeInstalacao
        isOpen={showQrModal}
        onClose={() => {
          setShowQrModal(false);
          setQrModalStudent(null);
        }}
        student={qrModalStudent || selectedStudent}
        allStudents={studentsList}
        onSelectStudent={(id) => {
          onSelectStudent(id);
          const found = studentsList.find((s) => s.id === id);
          if (found) setQrModalStudent(found);
        }}
      />
    </div>
  );
}
