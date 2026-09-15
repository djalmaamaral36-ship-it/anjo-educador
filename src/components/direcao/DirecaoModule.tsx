import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  TreeDeciduous,
  Activity,
  Heart,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Phone,
  MessageCircle,
  Plus,
  Edit,
  Trash2,
  Save,
  Image as ImageIcon,
  Mic,
  Smile,
  Baby,
  Clock,
  Pill,
  BookOpen,
  GraduationCap,
  ChevronRight,
  ExternalLink,
  Lock,
  Eye,
  Check,
  Award,
  Sparkle,
  Info,
  FileCheck,
  X
} from 'lucide-react';
import {
  DocenteMembro,
  TurmaEscolar,
  ReacaoFamiliar,
  INITIAL_DOCENTES,
  INITIAL_TURMAS,
  INITIAL_REACOES
} from '../../data/direcaoData';
import { PAX_STUDENTS } from '../../data/paxStudentsData';
import { VoiceInput } from '../VoiceInput';
import CampoFotoUpload from '../comum/CampoFotoUpload';
import CampoTextoVoz from '../comum/CampoTextoVoz';
import LogoAnjinhoEducador from '../comum/LogoAnjinhoEducador';

interface Props {
  userRole?: 'professor' | 'familia';
  onNavigateTab?: (tab: string) => void;
}

export default function DirecaoModule({ userRole = 'professor', onNavigateTab }: Props) {
  const [activeSubTab, setActiveSubTab] = useState<'geral' | 'turmas' | 'desempenho' | 'docentes'>('geral');
  
  // Tab 3 Sub-modes
  const [viewModeTree, setViewModeTree] = useState<'arvores' | 'graficos'>('arvores');
  const [treeScope, setTreeScope] = useState<'aluno' | 'turma' | 'geral'>('aluno');
  const [selectedBosqueTurma, setSelectedBosqueTurma] = useState<string>('Berçário I - A');
  const [desempenhoSubTab, setDesempenhoSubTab] = useState<'cuidados' | 'estrategicos'>('cuidados');
  const [selectedTreeStudentId, setSelectedTreeStudentId] = useState<string>('mariana_souza');
  const [treeAfetoCount, setTreeAfetoCount] = useState<number>(0);

  // Filter 360
  const [filter360, setFilter360] = useState<'todos' | 'alertas'>('todos');

  // School Identity state
  const [schoolName, setSchoolName] = useState<string>(() => localStorage.getItem('anjo_school_name') || 'Anjinho Educador');
  const [schoolLogoUrl, setSchoolLogoUrl] = useState<string>(() => localStorage.getItem('anjo_school_logo') || '/logo.png');
  const [schoolSlogan, setSchoolSlogan] = useState<string>(() => localStorage.getItem('anjo_school_slogan') || 'Onde a infância é registrada para sempre');
  const [savedIdentityToast, setSavedIdentityToast] = useState<boolean>(false);

  // Docentes state
  const [docentes, setDocentes] = useState<DocenteMembro[]>(() => {
    const saved = localStorage.getItem('anjo_docentes');
    return saved ? JSON.parse(saved) : INITIAL_DOCENTES;
  });
  const [editingDocente, setEditingDocente] = useState<DocenteMembro | null>(null);
  const [isNewDocenteModalOpen, setIsNewDocenteModalOpen] = useState<boolean>(false);
  const [docenteFormData, setDocenteFormData] = useState<Partial<DocenteMembro>>({
    nome: '',
    cargo: 'CUIDADOR',
    cargoDescricao: 'Educador(a) Titular',
    pin: '1234',
    telefone: '',
    fotoUrl: '',
    turmasAtivas: 'Berçário I - A',
    descricao: '',
  });

  const handleOpenNewDocente = () => {
    setDocenteFormData({
      id: String(Date.now()),
      nome: '',
      cargo: 'CUIDADOR',
      cargoDescricao: 'Educador(a) / Cuidador(a)',
      pin: Math.floor(1000 + Math.random() * 9000).toString(),
      telefone: '(11) 9',
      fotoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      turmasAtivas: 'Berçário I - A',
      descricao: 'Dedicação diária aos cuidados, acolhimento e estímulo dos alunos.',
    });
    setEditingDocente(null);
    setIsNewDocenteModalOpen(true);
  };

  const handleOpenEditDocente = (d: DocenteMembro) => {
    setDocenteFormData({ ...d });
    setEditingDocente(d);
    setIsNewDocenteModalOpen(true);
  };

  const handleSaveDocente = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docenteFormData.nome) return;

    if (editingDocente) {
      const updated = docentes.map((d) =>
        d.id === editingDocente.id ? ({ ...d, ...docenteFormData } as DocenteMembro) : d
      );
      setDocentes(updated);
      localStorage.setItem('anjo_docentes', JSON.stringify(updated));
      setEditingDocente(null);
      setIsNewDocenteModalOpen(false);
    } else {
      const novo: DocenteMembro = {
        id: docenteFormData.id || String(Date.now()),
        nome: docenteFormData.nome || '',
        cargo: docenteFormData.cargo || 'CUIDADOR',
        cargoDescricao:
          docenteFormData.cargoDescricao ||
          (docenteFormData.cargo === 'DIRETOR'
            ? 'Diretor(a) Geral'
            : docenteFormData.cargo === 'COORDENADOR'
            ? 'Coordenador(a)'
            : docenteFormData.cargo === 'DESENVOLVEDOR'
            ? 'Desenvolvedor do Sistema'
            : 'Educador(a) Titular'),
        pin: docenteFormData.pin || '1234',
        telefone: docenteFormData.telefone || '',
        fotoUrl:
          docenteFormData.fotoUrl ||
          'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
        turmasAtivas: docenteFormData.turmasAtivas || 'Berçário I - A',
        descricao: docenteFormData.descricao || 'Atuação na equipe escolar.',
      };
      const updated = [...docentes, novo];
      setDocentes(updated);
      localStorage.setItem('anjo_docentes', JSON.stringify(updated));
      setIsNewDocenteModalOpen(false);
    }
  };

  const handleDeleteDocente = (id: string) => {
    const updated = docentes.filter((d) => d.id !== id);
    setDocentes(updated);
    localStorage.setItem('anjo_docentes', JSON.stringify(updated));
    setEditingDocente(null);
    setIsNewDocenteModalOpen(false);
  };

  // Turmas state
  const [turmas, setTurmas] = useState<TurmaEscolar[]>(() => {
    const saved = localStorage.getItem('anjo_turmas');
    return saved ? JSON.parse(saved) : INITIAL_TURMAS;
  });
  const [isNewTurmaModalOpen, setIsNewTurmaModalOpen] = useState<boolean>(false);
  const [novaTurmaNome, setNovaTurmaNome] = useState('');
  const [novaTurmaFaixa, setNovaTurmaFaixa] = useState('');
  const [novaTurmaProf, setNovaTurmaProf] = useState('');

  // Reações dos pais
  const [reacoes, setReacoes] = useState<ReacaoFamiliar[]>(INITIAL_REACOES);

  // Modais de ação rápida
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<any>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState<boolean>(false);
  const [directoriaNote, setDirectoriaNote] = useState<string>('');
  const [isInviteWhatsappOpen, setIsInviteWhatsappOpen] = useState<boolean>(false);
  const [isPlanoMediacaoOpen, setIsPlanoMediacaoOpen] = useState<boolean>(false);

  // Save changes to localStorage
  const handleSaveIdentity = () => {
    localStorage.setItem('anjo_school_name', schoolName);
    localStorage.setItem('anjo_school_logo', schoolLogoUrl);
    localStorage.setItem('anjo_school_slogan', schoolSlogan);
    setSavedIdentityToast(true);
    setTimeout(() => setSavedIdentityToast(false), 3000);
  };

  const handleApplyPreset = (name: string, slogan: string, logoUrl?: string) => {
    setSchoolName(name);
    setSchoolSlogan(slogan);
    if (logoUrl) {
      setSchoolLogoUrl(logoUrl);
    }
  };

  // Image compression for logo or teachers
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const maxDim = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
        setSchoolLogoUrl(compressedBase64);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const studentsList = Object.values(PAX_STUDENTS);
  const filteredStudents360 = filter360 === 'alertas' 
    ? studentsList.filter(s => s.id === 'mariana_souza' || s.cuidadosEspeciais || s.faltasTotais > 0)
    : studentsList;

  const currentTreeStudent = PAX_STUDENTS[selectedTreeStudentId] || PAX_STUDENTS['mariana_souza'];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Badge & Title */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-black uppercase tracking-wider">
            <Shield size={14} className="text-indigo-600" />
            DIREÇÃO GERAL & GESTÃO PEDAGÓGICA
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
            Painel da Direção Escolar
          </h1>
          <p className="text-sm text-slate-500 max-w-3xl leading-relaxed">
            Portal exclusivo para controle de desempenho das turmas, capacitação de educadores, monitoramento de rotina e customização visual da marca da escola.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('central_juridica')}
              className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition active:scale-95 cursor-pointer"
            >
              <FileCheck size={15} />
              <span>Central Jurídica & Suporte</span>
            </button>
          )}
          <span className="text-xs font-bold text-slate-400">Filtrando:</span>
          <span className="px-3.5 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-black border border-indigo-100 shadow-xs">
            {schoolName}
          </span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveSubTab('geral')}
          className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black whitespace-nowrap transition cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'geral'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Activity size={16} />
          Visão Geral Escolar
        </button>

        <button
          onClick={() => setActiveSubTab('turmas')}
          className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black whitespace-nowrap transition cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'turmas'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users size={16} />
          Grade de Turmas ({turmas.length})
        </button>

        <button
          onClick={() => setActiveSubTab('desempenho')}
          className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black whitespace-nowrap transition cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'desempenho'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <TreeDeciduous size={16} />
          Desempenho & Saúde Geral
        </button>

        <button
          onClick={() => setActiveSubTab('docentes')}
          className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black whitespace-nowrap transition cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'docentes'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <GraduationCap size={16} />
          Corpo Docente ({docentes.length})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* ABA 1: VISÃO GERAL ESCOLAR */}
      {/* ========================================================================= */}
      {activeSubTab === 'geral' && (
        <div className="space-y-6">
          {/* Card Noturno: Monitoramento em Tempo Real - Visão 360º da Escola */}
          <div className="bg-[#111936] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/40 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-900/50 pb-5">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-black uppercase tracking-wider mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  MONITORAMENTO EM TEMPO REAL
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  Visão 360º da Escola
                </h2>
                <p className="text-xs text-indigo-200/80 mt-1">
                  Indicadores unificados de gestão operacional, pedagógica, saúde e engajamento da comunidade escolar.
                </p>
              </div>

              <div className="px-4 py-2 rounded-2xl bg-white/10 border border-white/15 text-xs text-indigo-100 font-bold self-start sm:self-auto">
                Diretora: <span className="text-white font-black">Nilva Amaral (Diretora)</span>
              </div>
            </div>

            {/* 7 Metric Blocks Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              {/* 1. OPERAÇÃO */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-indigo-200 uppercase tracking-wider">OPERAÇÃO</span>
                  <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                    Em conformidade
                  </span>
                </div>
                <div className="text-2xl font-black text-white">94% <span className="text-xs font-normal text-indigo-200">Compliance Rate</span></div>
                <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-emerald-400 h-full rounded-full" style={{ width: '94%' }}></div>
                </div>
                <p className="text-[11px] text-indigo-200/70 mt-2">Audit de rotinas e segurança LGPD/normativas</p>
              </div>

              {/* 2. CUIDADO */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-indigo-200 uppercase tracking-wider">CUIDADO</span>
                  <span className="text-[10px] font-black bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full">
                    Excelente
                  </span>
                </div>
                <div className="text-2xl font-black text-white">96% <span className="text-xs font-normal text-indigo-200">das rotinas</span></div>
                <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-sky-400 h-full rounded-full" style={{ width: '96%' }}></div>
                </div>
                <p className="text-[11px] text-indigo-200/70 mt-2">Sono, alimentação, fralda e hidratação do dia</p>
              </div>

              {/* 3. ATENÇÃO */}
              <div 
                onClick={() => setIsPlanoMediacaoOpen(true)}
                className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 transition cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-rose-300 uppercase tracking-wider">ATENÇÃO</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPlanoMediacaoOpen(true);
                    }}
                    className="text-[10px] font-black bg-rose-500/30 text-rose-200 px-2 py-0.5 rounded-full hover:bg-rose-500/50 transition cursor-pointer"
                  >
                    Ação Imediata
                  </button>
                </div>
                <div className="text-2xl font-black text-rose-300">1 <span className="text-xs font-normal text-rose-200">ocorrência prioritária</span></div>
                <p className="text-[11px] text-rose-200/80 mt-2">Acompanhamento de febre/recusa alimentar em análise</p>
              </div>

              {/* 4. TURMAS */}
              <div 
                onClick={() => setActiveSubTab('turmas')}
                className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-indigo-200 uppercase tracking-wider">TURMAS</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveSubTab('turmas');
                    }}
                    className="text-[10px] font-black bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full hover:bg-amber-500/30 transition cursor-pointer"
                  >
                    Ver Salas
                  </button>
                </div>
                <div className="text-2xl font-black text-white">2 <span className="text-xs font-normal text-indigo-200">turmas sob observação</span></div>
                <p className="text-[11px] text-indigo-200/70 mt-2">Maternal I e Jardim II com variação de intercorrências</p>
              </div>

              {/* 5. EQUIPE */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-indigo-200 uppercase tracking-wider">EQUIPE</span>
                  <span className="text-[10px] font-black bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full">
                    Engajada
                  </span>
                </div>
                <div className="text-2xl font-black text-white">93% <span className="text-xs font-normal text-indigo-200">de adesão</span></div>
                <p className="text-[11px] text-indigo-200/70 mt-2">Professores e cuidadoras preenchendo diários via PIN</p>
              </div>

              {/* 6. FAMILIAS */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-indigo-200 uppercase tracking-wider">FAMÍLIAS</span>
                  <span className="text-[10px] font-black bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded-full">
                    Ativas
                  </span>
                </div>
                <div className="text-2xl font-black text-white">91% <span className="text-xs font-normal text-indigo-200">de visualização</span></div>
                <p className="text-[11px] text-indigo-200/70 mt-2">Visualização de recados, fotos e autorizações no app</p>
              </div>

              {/* 7. PEDAGOGICO */}
              <div 
                onClick={() => setActiveSubTab('desempenho')}
                className="p-4 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 hover:bg-indigo-500/20 transition sm:col-span-2 cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-indigo-200 uppercase tracking-wider">PEDAGÓGICO</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveSubTab('desempenho');
                    }}
                    className="text-[10px] font-black bg-indigo-500/30 text-indigo-200 px-2.5 py-0.5 rounded-full hover:bg-indigo-500/50 transition cursor-pointer flex items-center gap-1"
                  >
                    Ver Acompanhamento Pedagógico <ChevronRight size={12} />
                  </button>
                </div>
                <div className="text-xl font-black text-white">3 <span className="text-xs font-normal text-indigo-200">crianças com evolução que merece acompanhamento</span></div>
                <p className="text-[11px] text-indigo-200/80 mt-1">Encaminhamentos ativos para fonoaudiologia, psicologia e desenvolvimento cognitivo</p>
              </div>
            </div>
          </div>

          {/* Row of 4 Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs hover:shadow-md transition">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">TOTAL DE ALUNOS</span>
              <div className="text-3xl font-black text-slate-800 mt-1">10 <span className="text-xs font-medium text-slate-500">matriculados</span></div>
              <p className="text-xs text-slate-500 mt-2">Distribuição em 2 turmas ativas</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs hover:shadow-md transition">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">EDUCADORES TITULARES</span>
              <div className="text-3xl font-black text-slate-800 mt-1">6 <span className="text-xs font-medium text-slate-500">professores</span></div>
              <p className="text-xs text-slate-500 mt-2">Alocação com segurança por PIN individual</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs hover:shadow-md transition">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">PARCERIA COM FAMÍLIAS</span>
              <div className="text-3xl font-black text-slate-800 mt-1">{treeAfetoCount} <span className="text-xs font-medium text-slate-500">gestos de afeto</span></div>
              <p className="text-xs text-slate-500 mt-2">Regadas de afeto enviadas do app da família</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">ALERTAS DE SAÚDE</span>
                <span className="text-amber-500 text-xs font-bold">[!]</span>
              </div>
              <div className="text-3xl font-black text-emerald-600 mt-1">0 <span className="text-xs font-medium text-slate-500">casos graves</span></div>
              <p className="text-xs text-slate-500 mt-2">[OK] Rotinas saudáveis estáveis</p>
            </div>
          </div>

          {/* Row of 2 Strategic Management Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card Left: Identidade e Logomarca da Escola */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-100 shadow-xs space-y-4">
              <div>
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">IDENTIDADE INSTITUCIONAL</span>
                <h3 className="text-lg font-black text-slate-800">Identidade e Logomarca da Escola</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Personalize o aplicativo com o nome da sua escola e a imagem da sua marca. Ele será exibido de forma harmônica no topo de todas as telas.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">NOME DA ESCOLA</label>
                  <input
                    type="text"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="Ex: Colégio Mater Dei / Escola Arco-Íris"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">LOGOMARCA DA ESCOLA (OFICIAL / PERSONALIZADA)</label>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl mb-2">
                    <div className="w-12 h-12 rounded-xl bg-white p-0.5 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-xs">
                      {schoolLogoUrl && schoolLogoUrl !== '/logo.png' ? (
                        <img src={schoolLogoUrl} alt="Logo da Escola" className="w-full h-full object-contain" />
                      ) : (
                        <LogoAnjinhoEducador variant="symbol" size="full" className="w-full h-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-slate-800 truncate">
                        {schoolName || 'Anjinho Escolar'}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {schoolLogoUrl === '/logo.png' ? 'Símbolo Oficial da Árvore da Infância' : 'Logo personalizada ativa'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSchoolLogoUrl('/logo.png')}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-black transition cursor-pointer border border-indigo-200 whitespace-nowrap"
                      title="Restaurar logotipo oficial do Anjinho Escolar"
                    >
                      Usar Logo Oficial
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={schoolLogoUrl}
                      onChange={(e) => setSchoolLogoUrl(e.target.value)}
                      placeholder="/logo.png ou https://exemplo.com/logo-escola.png"
                      className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <label className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-slate-200 transition">
                      <ImageIcon size={14} />
                      <span>Foto</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">FRASE DO BANNER / SLOGAN OFICIAL</label>
                  <input
                    type="text"
                    value={schoolSlogan}
                    onChange={(e) => setSchoolSlogan(e.target.value)}
                    placeholder="Ex: Onde a infância é registrada para sempre"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    onClick={handleSaveIdentity}
                    className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md shadow-indigo-600/20 transition cursor-pointer flex items-center gap-2"
                  >
                    <Save size={14} />
                    Salvar Identidade da Escola
                  </button>

                  {savedIdentityToast && (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <Check size={14} /> Marca salva com sucesso!
                    </span>
                  )}
                </div>

                {/* Modelos rápidos */}
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">
                    MODELOS DE MARCA ESCOLARES:
                  </span>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => handleApplyPreset('Anjinho Educador', 'Onde a infância é registrada para sempre', '/logo.png')}
                      className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-[11px] font-black text-white transition cursor-pointer shadow-xs flex items-center gap-1.5"
                    >
                      <span>✨ Anjinho Educador (Oficial)</span>
                    </button>
                    <button
                      onClick={() => handleApplyPreset('Doce Saber', 'Educar com Amor e Criatividade')}
                      className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-700 transition cursor-pointer border border-slate-200"
                    >
                      Doce Saber (Colorido)
                    </button>
                    <button
                      onClick={() => handleApplyPreset('Montessori Infantil', 'Autonomia, Afeto e Aprendizagem Viva')}
                      className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-700 transition cursor-pointer border border-slate-200"
                    >
                      Montessori (Tradicional)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Right: Linha de Afeto (Reações dos Pais) */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider">FAMÍLIA ATIVA</span>
                  <h3 className="text-lg font-black text-slate-800">Linha de Afeto (Reações dos Pais)</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Log em tempo real de curtidas, regadas e interações que os pais enviaram aos diários da escola.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const newReacao: ReacaoFamiliar = {
                      id: String(Date.now()),
                      autor: 'Mãe de Laura Costa',
                      aluno: 'Laura Costa',
                      tipo: 'regada',
                      mensagem: 'Mãe de Laura Costa enviou uma Regada de Afeto parabenizando o almoço comilão!',
                      tempoAtras: 'Agora mesmo',
                      origem: 'App do Familiar'
                    };
                    setReacoes([newReacao, ...reacoes]);
                    setTreeAfetoCount(prev => prev + 1);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-black border border-rose-100 transition cursor-pointer flex items-center gap-1"
                >
                  <Heart size={14} className="fill-rose-500 text-rose-500" />
                  <span>+ Simular Afeto</span>
                </button>
              </div>

              <div className="space-y-3 max-h-[290px] overflow-y-auto pr-1">
                {reacoes.map((reacao) => (
                  <div key={reacao.id} className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 hover:bg-slate-100/80 transition space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-black text-slate-700 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                        {reacao.autor}
                      </span>
                      <span className="text-slate-400 font-medium">{reacao.tempoAtras}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {reacao.mensagem}
                    </p>
                    <div className="text-[10px] text-indigo-600 font-bold">
                      {reacao.origem}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: GRADE DE TURMAS */}
      {/* ========================================================================= */}
      {activeSubTab === 'turmas' && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-800">Lista de Salas & Taxa de Ocupação</h2>
              <p className="text-xs text-slate-500 mt-1">
                Gerencie as capacidades de cada turma do maternal e berçário, veja as crianças ativas e faça a alocação do educador titular.
              </p>
            </div>

            <button
              onClick={() => setIsNewTurmaModalOpen(true)}
              className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md shadow-indigo-600/20 transition cursor-pointer flex items-center gap-2 self-start sm:self-auto"
            >
              <Plus size={16} />
              Criar Nova Turma
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {turmas.map((turma) => (
              <div key={turma.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4 hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center text-2xl shadow-xs border border-indigo-100">
                      {turma.icone}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-800">{turma.nome}</h3>
                      <p className="text-xs text-slate-500">{turma.descricao}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase">
                      {turma.faixaEtaria}
                    </span>
                    <button
                      onClick={() => {
                        if (confirm(`Deseja excluir a turma ${turma.nome}?`)) {
                          setTurmas(turmas.filter(t => t.id !== turma.id));
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                      title="Excluir Turma"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Taxa de Lotação */}
                <div>
                  <div className="flex items-center justify-between text-xs font-black mb-1.5">
                    <span className="text-slate-500 uppercase tracking-wider text-[10px]">LOTAÇÃO: {turma.lotacao}/{turma.capacidade}</span>
                    <span className="text-rose-600 font-bold">100%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>

                {/* Educador Titular */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Educador Titular:</span>
                  <span className="font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-xl">
                    👩‍🏫 {turma.educadorTitular}
                  </span>
                </div>

                {/* Lista de Alunos */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    ALUNOS MATRICULADOS ({turma.alunos.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {turma.alunos.map((aluno, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-xl bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200">
                        {aluno}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 3: DESEMPENHO & SAÚDE GERAL */}
      {/* ========================================================================= */}
      {activeSubTab === 'desempenho' && (
        <div className="space-y-6">
          {/* Top Control Bar */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-800">Monitor de Desempenho e Rotinas Coletivas</h2>
              <p className="text-xs text-slate-500 mt-1">
                Análise pedagógica da rotina escolar, saúde e engajamento das famílias por meio de metáforas da natureza ou relatórios convencionais.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewModeTree('arvores')}
                className={`px-4 py-2 rounded-2xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                  viewModeTree === 'arvores'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <TreeDeciduous size={14} />
                Árvores em Evolução
              </button>

              <button
                onClick={() => setViewModeTree('graficos')}
                className={`px-4 py-2 rounded-2xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                  viewModeTree === 'graficos'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <TrendingUp size={14} />
                Gráficos Convencionais
              </button>
            </div>
          </div>

          {/* Sub-tabs buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setDesempenhoSubTab('cuidados')}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition cursor-pointer ${
                desempenhoSubTab === 'cuidados'
                  ? 'bg-slate-800 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Monitor de Cuidados & Saúde Diária
            </button>
            <button
              onClick={() => setDesempenhoSubTab('estrategicos')}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                desempenhoSubTab === 'estrategicos'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Indicadores Estratégicos & Evasão
              <span className="text-[9px] font-black uppercase bg-rose-500 text-white px-1.5 py-0.2 rounded-full">
                Novo
              </span>
            </button>
          </div>

          {/* VIEW: ÁRVORES EM EVOLUÇÃO (Lúdica BNCC) */}
          {viewModeTree === 'arvores' && (
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <button 
                  onClick={() => setTreeScope('aluno')}
                  className={`px-4 py-2 rounded-2xl text-xs font-black transition cursor-pointer ${
                    treeScope === 'aluno'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Árvore Individual (Aluno)
                </button>
                <button 
                  onClick={() => setTreeScope('turma')}
                  className={`px-4 py-2 rounded-2xl text-xs font-black transition cursor-pointer ${
                    treeScope === 'turma'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Bosque da Classe (Turma)
                </button>
                <button 
                  onClick={() => setTreeScope('geral')}
                  className={`px-4 py-2 rounded-2xl text-xs font-black transition cursor-pointer ${
                    treeScope === 'geral'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Floresta Escolar (Geral)
                </button>
              </div>

              {/* NÍVEL 1: ÁRVORE INDIVIDUAL (ALUNO) */}
              {treeScope === 'aluno' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
                  {/* Left Tree Card */}
                  <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs flex flex-col items-center justify-between text-center space-y-6">
                    <div className="w-full text-left">
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider block">PLANTAÇÃO PEDAGÓGICA</span>
                      <label className="text-xs font-bold text-slate-700 block mt-1">SELECIONE O ALUNO PARA VER SUA ÁRVORE:</label>
                      <select
                        value={selectedTreeStudentId}
                        onChange={(e) => setSelectedTreeStudentId(e.target.value)}
                        className="w-full mt-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white"
                      >
                        {studentsList.map((s) => (
                          <option key={s.id} value={s.id}>{s.nome} ({s.turma})</option>
                        ))}
                      </select>
                    </div>

                    {/* Visual Tree */}
                    <div className="relative py-4">
                      <div className="w-44 h-44 rounded-full bg-emerald-50 border-4 border-emerald-200 flex flex-col items-center justify-center relative shadow-inner">
                        <span className="text-7xl animate-bounce">🌳</span>
                        {treeAfetoCount > 0 && (
                          <div className="absolute top-2 right-4 text-xl animate-pulse">
                            🍎
                          </div>
                        )}
                      </div>
                      <div className="w-56 h-3 bg-emerald-600/30 rounded-full mx-auto mt-2"></div>
                    </div>

                    <div className="w-full space-y-2">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">ESTÁGIO DE VIDA</span>
                      <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                        Árvore Frondosa (Saudável e Forte)
                      </span>
                      <button
                        onClick={() => setTreeAfetoCount(prev => prev + 1)}
                        className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-black shadow-md shadow-emerald-600/20 transition cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Heart size={14} className="fill-white" />
                        Regar de Afeto (+1 Fruto)
                      </button>
                    </div>
                  </div>

                  {/* Right Details Card */}
                  <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                      <img
                        src={currentTreeStudent.fotoUrl}
                        alt={currentTreeStudent.nome}
                        className="w-12 h-12 rounded-2xl object-cover border border-slate-200"
                      />
                      <div>
                        <h3 className="text-lg font-black text-slate-800">{currentTreeStudent.nome}</h3>
                        <p className="text-xs text-slate-400 font-bold uppercase">{currentTreeStudent.turma}</p>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">DIAGNÓSTICO ECOLÓGICO</span>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        A Árvore de Desenvolvimento de {currentTreeStudent.nome} é uma representação lúdica de sua rotina. Ela responde de forma viva aos registros das professoras e à proximidade dos familiares.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase">GRAU DE CRESCIMENTO (ROTINA)</span>
                        <div className="text-xl font-black text-slate-800 mt-0.5">78%</div>
                        <p className="text-[10px] text-slate-500 mt-1">Alimentação saudável e soneca regulada fortalecem o tronco.</p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase">NUTRIÇÃO AFETIVA (FAMILIAR)</span>
                        <div className="text-xl font-black text-rose-600 mt-0.5">{treeAfetoCount} regas</div>
                        <p className="text-[10px] text-slate-500 mt-1">Curtidas de fotos e regadas dos pais geram frutos vermelhos e flores.</p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase">FOTOSSÍNTESE DE SAÚDE</span>
                        <div className="text-xl font-black text-slate-800 mt-0.5">{(currentTreeStudent as any).temperatura || (currentTreeStudent.id === 'mariana_souza' ? '38.2ºC' : '36.5ºC')}</div>
                        <p className="text-[10px] text-slate-500 mt-1">Temperatura corporal ideal. Clima ameno.</p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase">ENERGIA VITAL</span>
                        <div className="text-xl font-black text-emerald-600 mt-0.5">90%</div>
                        <p className="text-[10px] text-slate-500 mt-1">Excelente aceitação de nutrientes.</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/60 text-xs text-amber-900 leading-relaxed font-medium">
                      <span className="font-bold">Dica da Coordenação:</span> A folhagem de {currentTreeStudent.nome} está verde e vibrante! Estimule os pais a mandarem "Regadas de Amor" pelo app para continuarem preenchendo o diário com interações afetivas.
                    </div>
                  </div>
                </div>
              )}

              {/* NÍVEL 2: BOSQUE DA CLASSE (TURMA / SALA) */}
              {treeScope === 'turma' && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Header / Selector */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider block">BOSQUE DA CLASSE</span>
                        <h3 className="text-lg font-black text-slate-800">
                          Visão Integrada das Árvores da Sala
                        </h3>
                        <p className="text-xs text-slate-500">
                          Acompanhe a saúde pedagógica, nutricional e afetiva de cada criança no grupo.
                        </p>
                      </div>

                      {/* Selector de Turma */}
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-600 shrink-0">SALA / TURMA:</label>
                        <select
                          value={selectedBosqueTurma}
                          onChange={(e) => setSelectedBosqueTurma(e.target.value)}
                          className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white shadow-2xs"
                        >
                          <option value="Berçário I - A">Berçário I - A</option>
                          <option value="Maternal I - A">Maternal I - A</option>
                          <option value="Maternal II - A">Maternal II - A</option>
                          <option value="Jardim II">Jardim II</option>
                        </select>
                      </div>
                    </div>

                    {/* Indicators bar */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                      <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-100 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black text-sm">
                          🌳
                        </div>
                        <div>
                          <div className="text-xs font-black text-slate-800">
                            {studentsList.filter(s => s.turma === selectedBosqueTurma || (!['Berçário I - A', 'Maternal I - A'].includes(selectedBosqueTurma) && s.turma.includes(selectedBosqueTurma.split(' ')[0]))).length || 3} Árvores No Bosque
                          </div>
                          <span className="text-[10px] font-bold text-emerald-700 uppercase">Crianças Ativas na Sala</span>
                        </div>
                      </div>

                      <div className="p-3 rounded-2xl bg-teal-50/80 border border-teal-100 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-teal-500 text-white flex items-center justify-center font-black text-sm">
                          🍎
                        </div>
                        <div>
                          <div className="text-xs font-black text-slate-800">18 Nutrições Afetivas</div>
                          <span className="text-[10px] font-bold text-teal-700 uppercase">Regas de Pais & Professoras Hoje</span>
                        </div>
                      </div>

                      <div className="p-3 rounded-2xl bg-indigo-50/80 border border-indigo-100 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-500 text-white flex items-center justify-center font-black text-xs">
                          98%
                        </div>
                        <div>
                          <div className="text-xs font-black text-slate-800">Clima Favorável</div>
                          <span className="text-[10px] font-bold text-indigo-700 uppercase">Média de Vitalidade da Turma</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Student Trees Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {studentsList
                      .filter(s => s.turma === selectedBosqueTurma || (selectedBosqueTurma === 'Berçário I - A' && s.turma === 'Berçário I - A') || (selectedBosqueTurma === 'Maternal I - A' && s.turma === 'Maternal I - A'))
                      .concat(
                        studentsList.filter(s => s.turma !== selectedBosqueTurma).slice(0, 2)
                      )
                      .slice(0, 6)
                      .map((st, idx) => {
                        const isFebril = st.id === 'mariana_souza';
                        return (
                          <div 
                            key={st.id + idx}
                            className="bg-white p-5 rounded-3xl border border-slate-100 shadow-2xs space-y-4 hover:shadow-md transition flex flex-col justify-between"
                          >
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                              <div className="flex items-center gap-3">
                                <img
                                  src={st.fotoUrl}
                                  alt={st.nome}
                                  className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                                />
                                <div>
                                  <h4 className="text-sm font-black text-slate-800">{st.nome}</h4>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase">{st.idadeStr} • {st.turma}</p>
                                </div>
                              </div>
                              <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                                isFebril ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {isFebril ? '⚠️ Atenção' : '🌳 Frondosa'}
                              </span>
                            </div>

                            {/* Tree Visual Mini */}
                            <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-center gap-4 relative">
                              <div className="w-16 h-16 rounded-full bg-emerald-100/70 border-2 border-emerald-300 flex items-center justify-center text-3xl shadow-inner">
                                🌳
                              </div>
                              <div className="space-y-1 text-left">
                                <span className="text-[10px] font-black text-slate-400 uppercase block">VITALIDADE</span>
                                <div className="text-xs font-black text-slate-800">
                                  {isFebril ? '38.2ºC (Monitorado)' : '36.5ºC (Afebril)'}
                                </div>
                                <div className="text-[10px] font-bold text-emerald-700">
                                  {isFebril ? 'Acompanhamento Ativo' : 'Saúde & Rotina 100%'}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-1">
                              <button
                                onClick={() => {
                                  setSelectedTreeStudentId(st.id);
                                  setTreeScope('aluno');
                                }}
                                className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black transition cursor-pointer text-center"
                              >
                                Ver Árvore
                              </button>
                              <button
                                onClick={() => setTreeAfetoCount(prev => prev + 1)}
                                className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition cursor-pointer flex items-center gap-1 shrink-0"
                              >
                                <Heart size={12} className="fill-white" /> +1 Rega
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* NÍVEL 3: FLORESTA ESCOLAR (GERAL / TODA A ESCOLA) */}
              {treeScope === 'geral' && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Header Floresta */}
                  <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-md space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 text-9xl pointer-events-none select-none">
                      🌲
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-emerald-300 uppercase tracking-widest block">
                        ECOSSISTEMA COMPLETO • FLORESTA ESCOLAR
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black text-white">
                        Visão Geral de Todas as Turmas & Bosques
                      </h3>
                      <p className="text-xs text-emerald-100/80 max-w-2xl leading-relaxed">
                        A Floresta Escolar representa o desenvolvimento integrado de toda a instituição. Cada sala compõe um bosque sustentado por afeto, segurança e pedagogia de excelência.
                      </p>
                    </div>

                    {/* Macro Metrics Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs">
                        <span className="text-[10px] font-bold text-emerald-300 uppercase block">ÁRVORES NA FLORESTA</span>
                        <div className="text-xl font-black text-white mt-0.5">12 Crianças</div>
                        <p className="text-[10px] text-emerald-100/70 mt-0.5">Ativas em 4 Salas</p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs">
                        <span className="text-[10px] font-bold text-teal-300 uppercase block">VITALIDADE GLOBAL</span>
                        <div className="text-xl font-black text-white mt-0.5">96%</div>
                        <p className="text-[10px] text-teal-100/70 mt-0.5">Conformidade e Saúde</p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs">
                        <span className="text-[10px] font-bold text-amber-300 uppercase block">REGAS DA COMUNIDADE</span>
                        <div className="text-xl font-black text-white mt-0.5">42 Interações</div>
                        <p className="text-[10px] text-amber-100/70 mt-0.5">Fotos & Recados Hoje</p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs">
                        <span className="text-[10px] font-bold text-indigo-300 uppercase block">CLIMA INSTITUCIONAL</span>
                        <div className="text-xl font-black text-white mt-0.5">Harmônico</div>
                        <p className="text-[10px] text-indigo-100/70 mt-0.5">Sem Ocorrências Críticas</p>
                      </div>
                    </div>
                  </div>

                  {/* List of Class Groves (Bosques) */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                      Bosques por Turma / Sala de Aula
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {INITIAL_TURMAS.map((tm) => (
                        <div 
                          key={tm.id}
                          className="bg-white p-5 rounded-3xl border border-slate-100 shadow-2xs space-y-4 hover:shadow-md transition flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xl shrink-0">
                                🌲
                              </div>
                              <div>
                                <h5 className="text-sm font-black text-slate-800">{tm.nome}</h5>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">{tm.faixaEtaria}</p>
                              </div>
                            </div>
                            <span className="text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                              {tm.lotacao}/{tm.capacidade} Alunos
                            </span>
                          </div>

                          <div className="space-y-2 text-xs">
                            <div className="flex items-center justify-between text-slate-600">
                              <span className="font-medium">Educador(a) Titular:</span>
                              <span className="font-bold text-slate-800">{tm.educadorTitular}</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-600">
                              <span className="font-medium">Saúde Geral do Bosque:</span>
                              <span className="font-bold text-emerald-600">100% Saudável</span>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedBosqueTurma(tm.nome);
                              setTreeScope('turma');
                            }}
                            className="w-full py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-black transition cursor-pointer flex items-center justify-center gap-1"
                          >
                            Ver Bosque desta Sala <ChevronRight size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SUB-TAB: MONITOR DE CUIDADOS & SAÚDE DIÁRIA */}
          {desempenhoSubTab === 'cuidados' && (
            <div className="space-y-6">
              {/* Row: Indicadores Médios + Ranking */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Cols: Medias */}
                <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                    Indicadores Médios dos Alunos
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-500">Aproveitamento Alimentar</span>
                      <div className="text-2xl font-black text-emerald-600 mt-1">86%</div>
                      <p className="text-[10px] text-slate-400 mt-1">Média de papinhas e lanches aceitos</p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-500">Média de Soneca Diária</span>
                      <div className="text-2xl font-black text-indigo-600 mt-1">2,1h</div>
                      <p className="text-[10px] text-slate-400 mt-1">Duração média de repouso vespertino</p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-500">Adesão a Remédios</span>
                      <div className="text-2xl font-black text-teal-600 mt-1">100%</div>
                      <p className="text-[10px] text-slate-400 mt-1">Administrações conforme receita</p>
                    </div>
                  </div>
                </div>

                {/* Right Col: Ranking Pais */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-3">
                  <div>
                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider">ENGAJAMENTO DE AFETO</span>
                    <h3 className="text-sm font-black text-slate-800">Ranking de Participação dos Pais</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      As salas onde os familiares mais interagem com curtidas e regadas.
                    </p>
                  </div>

                  <div className="space-y-2 pt-1">
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span>🍼 Berçário I - A</span>
                        <span className="text-indigo-600">84 pts</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full" style={{ width: '84%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span>🧸 Maternal I - A</span>
                        <span className="text-indigo-600">62 pts</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full" style={{ width: '62%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rastreamento 360º de Atenção Individual (6 Pilares) */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-black uppercase">
                      6 PILARES DE CUIDADO
                    </div>
                    <h3 className="text-lg font-black text-slate-800 mt-1">
                      RASTREAMENTO 360º DE ATENÇÃO INDIVIDUAL
                    </h3>
                    <p className="text-xs text-slate-500">
                      Painel completo do diretor: temperatura, nutrição, sono, higiene/fraldas, medicação prescrita e desenvolvimento socioemocional.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setFilter360('todos')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        filter360 === 'todos'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Todos ({studentsList.length})
                    </button>
                    <button
                      onClick={() => setFilter360('alertas')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        filter360 === 'alertas'
                          ? 'bg-rose-600 text-white'
                          : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                      }`}
                    >
                      Apenas Alertas / Observação
                    </button>
                  </div>
                </div>

                {/* Grid of Student 360 cards */}
                <div className="space-y-4">
                  {filteredStudents360.map((aluno) => {
                    const isPriority = aluno.id === 'mariana_souza' || aluno.cuidadosEspeciais || aluno.faltasTotais > 0;
                    return (
                      <div
                        key={aluno.id}
                        className={`p-5 rounded-3xl border transition space-y-4 ${
                          isPriority ? 'bg-rose-50/40 border-rose-200' : 'bg-slate-50/50 border-slate-100'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={aluno.fotoUrl}
                              alt={aluno.nome}
                              className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-xs"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-base font-black text-slate-800">{aluno.nome}</h4>
                                <span className="text-[10px] font-black uppercase bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md">
                                  {aluno.turma}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500">
                                Responsável: <span className="font-semibold text-slate-700">{aluno.responsavelNome}</span> • {aluno.responsavelTelefone}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider self-start sm:self-auto ${
                              isPriority
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {isPriority ? 'ATENÇÃO PRIORITÁRIA' : 'ROTINA REGISTRADA EM DIA'}
                          </span>
                        </div>

                        {/* 6 Mini Pillars */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                          <div className="p-2.5 rounded-xl bg-white border border-slate-100">
                            <span className="text-[9px] font-black text-slate-400 block uppercase">TEMPERATURA</span>
                            <span className={`text-xs font-black block mt-0.5 ${aluno.id === 'mariana_souza' ? 'text-rose-600' : 'text-slate-800'}`}>
                              {aluno.id === 'mariana_souza' ? '38.2ºC' : ((aluno as any).temperatura || '36.5ºC')}
                            </span>
                            <span className="text-[9px] text-slate-400 block">{aluno.id === 'mariana_souza' ? 'Febril (Medição 10:15)' : 'Estável'}</span>
                          </div>

                          <div className="p-2.5 rounded-xl bg-white border border-slate-100">
                            <span className="text-[9px] font-black text-slate-400 block uppercase">NUTRIÇÃO / ALMOÇO</span>
                            <span className={`text-xs font-black block mt-0.5 ${aluno.id === 'mariana_souza' ? 'text-amber-600' : 'text-slate-800'}`}>
                              {aluno.id === 'mariana_souza' ? '30%' : '90%'}
                            </span>
                            <span className="text-[9px] text-slate-400 block">{aluno.id === 'mariana_souza' ? 'Recusa Alimentar' : 'Ótima Aceitação'}</span>
                          </div>

                          <div className="p-2.5 rounded-xl bg-white border border-slate-100">
                            <span className="text-[9px] font-black text-slate-400 block uppercase">SONO / REPOUSO</span>
                            <span className="text-xs font-black text-slate-800 block mt-0.5">2h</span>
                            <span className="text-[9px] text-slate-400 block">Sono Tranquilo</span>
                          </div>

                          <div className="p-2.5 rounded-xl bg-white border border-slate-100">
                            <span className="text-[9px] font-black text-slate-400 block uppercase">HIGIENE / TROCAS</span>
                            <span className="text-xs font-black text-slate-800 block mt-0.5">3 trocas</span>
                            <span className="text-[9px] text-slate-400 block">{aluno.id === 'mariana_souza' ? 'Fezes pastosas' : 'Aspecto normal'}</span>
                          </div>

                          <div className="p-2.5 rounded-xl bg-white border border-slate-100">
                            <span className="text-[9px] font-black text-slate-400 block uppercase">MEDICAÇÃO</span>
                            <span className="text-xs font-black text-indigo-700 block mt-0.5 truncate">
                              {aluno.medicamentos?.[0]?.nome || 'Sem receita ativa'}
                            </span>
                            <span className="text-[9px] text-slate-400 block">Autorizado pelos pais</span>
                          </div>

                          <div className="p-2.5 rounded-xl bg-white border border-slate-100">
                            <span className="text-[9px] font-black text-slate-400 block uppercase">SOCIOEMOCIONAL</span>
                            <span className={`text-xs font-black block mt-0.5 ${aluno.id === 'mariana_souza' ? 'text-rose-600' : 'text-emerald-700'}`}>
                              {aluno.id === 'mariana_souza' ? 'Irritabilidade' : 'Calmo, Participativo'}
                            </span>
                            <span className="text-[9px] text-slate-400 block">Acolhimento contínuo</span>
                          </div>
                        </div>

                        {/* Relato da Professora */}
                        <div className="p-3 rounded-2xl bg-white border border-slate-100 text-xs text-slate-600 flex items-start gap-2">
                          <BookOpen size={14} className="text-indigo-600 flex-shrink-0 mt-0.5" />
                          <p>
                            <span className="font-bold text-slate-800">Relato da Professora:</span> "{(aluno as any).recadoProfessora || (aluno.governanca?.statusRotinaDescricao || 'Participou com entusiasmo de todas as dinâmicas e brincadeiras lúdicas do dia.')}"
                          </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 flex-wrap pt-1">
                          <button
                            onClick={() => setSelectedStudentForModal(aluno)}
                            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                          >
                            <Eye size={14} />
                            Ficha 360º Completa
                          </button>

                          <button
                            onClick={() => {
                              setSelectedStudentForModal(aluno);
                              setIsNoteModalOpen(true);
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                          >
                            <Edit size={14} />
                            Anotar Diretoria
                          </button>

                          <a
                            href={`https://wa.me/55${aluno.responsavelTelefone?.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${aluno.responsavelNome}, aqui é da Direção do Colégio. Gostaríamos de conversar sobre a rotina de hoje de ${aluno.nome}.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                          >
                            <MessageCircle size={14} />
                            Chamar Família (WhatsApp)
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB: INDICADORES ESTRATÉGICOS & EVASÃO */}
          {desempenhoSubTab === 'estrategicos' && (
            <div className="space-y-6">
              <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">DIREÇÃO ESCOLAR AVANÇADA</span>
                  <h3 className="text-xl font-black text-slate-800">Indicadores Estratégicos & Governança Pedagógica</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Monitore a evasão escolar, desenvolvimento cognitivo, tempo de tela e comportamento para intervenções precoces eficientes.
                  </p>
                </div>

                <div className="text-xs font-bold text-slate-600 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-200">
                  Filtrar Turma: <span className="font-black text-indigo-700">Todas as Turmas (2)</span>
                </div>
              </div>

              {/* 7 Strategic Analytical Blocks Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. FREQUENCIA DIARIA & ALERTA DE EVASAO */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      1. FREQUÊNCIA DIÁRIA & ALERTA DE EVASÃO
                    </h4>
                    <span className="text-[10px] font-bold text-slate-400">Meta: &gt;90%</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Faltas frequentes são os principais sinalizadores de desengajamento familiar, insatisfação ou problemas de saúde. Monitore o risco preventivamente.
                  </p>

                  <div className="space-y-3 pt-2">
                    <div className="p-3 rounded-2xl bg-rose-50/60 border border-rose-100 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">🍼 Berçário I - A</span>
                        <span className="text-[10px] font-black text-rose-700">[!] RISCO DE EVASÃO ALTA</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-black text-rose-600">74%</span>
                        <button
                          onClick={() => alert('Verificação de frequência disparada para a equipe de secretaria e coordenação.')}
                          className="px-2.5 py-1 bg-white hover:bg-rose-100 text-rose-700 text-[10px] font-black rounded-lg border border-rose-200 cursor-pointer"
                        >
                          Disparar Verificação
                        </button>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">🧸 Maternal I - A</span>
                        <span className="text-[10px] font-black text-emerald-700">SAUDÁVEL</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-black text-emerald-600">98%</span>
                        <button
                          onClick={() => alert('Frequência em excelente estado.')}
                          className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-lg border border-emerald-200 cursor-pointer"
                        >
                          Disparar Verificação
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. DISTRIBUIÇÃO DE ROTINA (BNCC) */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      5. DISTRIBUIÇÃO DE ROTINA (BNCC)
                    </h4>
                    <span className="text-[10px] font-bold text-slate-400">Direitos de Aprendizagem</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Equilíbrio saudável conforme a Base Nacional Comum Curricular (BNCC), onde o brincar livre e a exploração são os eixos essenciais de aprendizagem.
                  </p>

                  <div className="space-y-2.5 pt-1">
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span>Brincar Livre / Explorar</span>
                        <span className="text-emerald-600">45% (Meta &gt;40%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: '45%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span>Brincar Dirigido / Projetos</span>
                        <span className="text-indigo-600">35% (Meta 20%-40%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full" style={{ width: '35%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span>Cuidados Especiais & Soneca</span>
                        <span className="text-amber-600">20% (Necessário)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: '20%' }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-900 leading-relaxed">
                    <span className="font-bold">Status Pedagógico:</span> Equilíbrio excelente detectado! A proporção de brincadeiras e interações respeita os direitos de aprendizagem infantil.
                  </div>
                </div>

                {/* 2. IDENTIFICAÇÃO PRECOCE DE ATRASO NO DESENVOLVIMENTO */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      2. IDENTIFICAÇÃO PRECOCE DE ATRASO
                    </h4>
                    <span className="text-[10px] font-black bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                      Encaminhamento Precoce
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Monitoramento proativo de marcos do desenvolvimento (fala, coordenação motora, socialização). O encaminhamento precoce para especialistas (Fono, Psico, TO) muda o futuro pedagógico da criança!
                  </p>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm">
                        5.4%
                      </div>
                      <div>
                        <span className="text-xs font-black text-slate-800 block">Sinais de Atenção Identificados</span>
                        <span className="text-[11px] text-slate-500">Apenas 2 de 10 crianças exibiram sinais persistentes</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onNavigateTab && onNavigateTab('coordenacao')}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer"
                    >
                      Abrir Protocolo Fono/Psico
                    </button>
                  </div>
                </div>

                {/* 6. ENGAJAMENTO & PARTICIPAÇÃO FAMILIAR */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      6. ENGAJAMENTO & PARTICIPAÇÃO FAMILIAR
                    </h4>
                    <span className="text-[10px] font-bold text-slate-400">Retenção & Amor</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Famílias engajadas e que interagem de forma positiva criam alta fidelização de marca escolar e diminuem a evasão letiva.
                  </p>

                  <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-center space-y-2">
                    <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block">ADESÃO ESCOLAR ATIVA</span>
                    <div className="text-3xl font-black text-emerald-700">88%</div>
                    <p className="text-xs text-emerald-900 leading-relaxed font-medium">
                      Excelente! Pais ativamente integrados no processo elevam a rematrícula projetada para 94% no próximo período!
                    </p>
                  </div>
                </div>

                {/* 4. EXPOSIÇÃO AO TEMPO DE TELA (ZERO TELA) */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      4. EXPOSIÇÃO AO TEMPO DE TELA (DISPOSITIVOS)
                    </h4>
                    <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      Meta: Mínimo ou Zero
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    A Sociedade Brasileira de Pediatria e a OMS recomendam tempo de tela ZERO para crianças menores de 2 anos, e máximo de 1 hora diária para 3 a 5 anos.
                  </p>

                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-start gap-3">
                    <Award size={24} className="text-emerald-600 flex-shrink-0 mt-1" />
                    <div>
                      <h5 className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                        Certificação Anjinho de Zero Tela na Escola
                      </h5>
                      <p className="text-xs text-emerald-900 leading-relaxed mt-1">
                        Todas as atividades registradas no maternal e berçário hoje indicam 0 minutos de exposição a computadores, TVs ou tablets. A tecnologia no colégio é de uso estrito e exclusivo dos professores para governança e relatórios familiares!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 4: CORPO DOCENTE */}
      {/* ========================================================================= */}
      {activeSubTab === 'docentes' && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-800">Corpo Docente & Equipe Escolar</h2>
              <p className="text-xs text-slate-500 mt-1">
                Quadro geral de professores, coordenadoras e colaboradores cadastrados com suas respectivas turmas vinculadas.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setIsInviteWhatsappOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-black border border-emerald-200 transition cursor-pointer flex items-center gap-1.5"
              >
                <MessageCircle size={15} />
                Convidar Equipe via WhatsApp
              </button>

              <button
                onClick={handleOpenNewDocente}
                className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md shadow-indigo-600/20 transition cursor-pointer flex items-center gap-1.5"
              >
                <Plus size={15} />
                Novo Colaborador / Professor
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {docentes.map((docente) => (
              <div key={docente.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4 hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={docente.fotoUrl}
                      alt={docente.nome}
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-xs"
                    />
                    <div>
                      <h3 className="text-base font-black text-slate-800">{docente.nome}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase">
                          {docente.cargo}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">
                          PIN: {docente.pin}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenEditDocente(docente)}
                    className="px-3 py-1 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200 transition cursor-pointer flex items-center gap-1"
                  >
                    <Edit size={12} />
                    Editar
                  </button>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="text-slate-500 font-medium">
                    <span className="font-bold text-slate-700">TELEFONE:</span> {docente.telefone}
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    {docente.descricao}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">TURMAS ATIVAS:</span>
                  <span className={`font-bold px-2.5 py-0.5 rounded-lg text-[11px] ${
                    docente.turmasAtivas.includes('Nenhuma') 
                      ? 'bg-rose-50 text-rose-700' 
                      : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {docente.turmasAtivas}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAIS */}
      {/* ========================================================================= */}

      {/* Modal Ficha 360 do Aluno */}
      {selectedStudentForModal && !isNoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <img
                  src={selectedStudentForModal.fotoUrl}
                  alt={selectedStudentForModal.nome}
                  className="w-12 h-12 rounded-2xl object-cover border border-slate-200"
                />
                <div>
                  <h3 className="text-base font-black text-slate-800">{selectedStudentForModal.nome}</h3>
                  <p className="text-xs text-slate-500">{selectedStudentForModal.turma} • Nasc: {selectedStudentForModal.nascimento}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudentForModal(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-1">
                <span className="font-black text-indigo-900 uppercase text-[10px] block">CONTATO FAMILIAR</span>
                <p className="text-slate-700 font-semibold">{selectedStudentForModal.responsavel} - {selectedStudentForModal.telefoneResponsavel}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="font-black text-slate-500 uppercase text-[10px] block">STATUS GERAL DA ROTINA</span>
                <p className="text-slate-800 font-medium leading-relaxed">{selectedStudentForModal.statusGeral}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="font-black text-slate-500 uppercase text-[10px] block">ORIENTAÇÕES ESPECIAIS & ALERGIA</span>
                <p className="text-slate-800 font-medium leading-relaxed">{selectedStudentForModal.alergias || 'Nenhuma restrição registrada.'}</p>
              </div>
            </div>

            <button
              onClick={() => setSelectedStudentForModal(null)}
              className="w-full py-2.5 rounded-2xl bg-indigo-600 text-white text-xs font-black shadow-md transition cursor-pointer"
            >
              Fechar Ficha
            </button>
          </div>
        </div>
      )}

      {/* Modal Anotar Diretoria com Voz */}
      {isNoteModalOpen && selectedStudentForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-5">
            <div>
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">DIREÇÃO GERAL</span>
              <h3 className="text-lg font-black text-slate-800">Anotação Confidencial de Diretoria</h3>
              <p className="text-xs text-slate-500">Aluno(a): {selectedStudentForModal.nome}</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Despacho / Parecer do Diretor:</label>
                <VoiceInput onTranscript={(text) => setDirectoriaNote(prev => prev ? `${prev} ${text}` : text)} />
              </div>
              <textarea
                value={directoriaNote}
                onChange={(e) => setDirectoriaNote(e.target.value)}
                placeholder="Ex: Entramos em contato com a mãe para alinhar a transição da mamadeira e acolhimento emocional..."
                className="w-full p-3 rounded-2xl border border-slate-200 text-xs text-slate-800 h-28 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              ></textarea>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setIsNoteModalOpen(false);
                  setSelectedStudentForModal(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  alert('Anotação de diretoria salva com sucesso no prontuário interno.');
                  setIsNoteModalOpen(false);
                  setSelectedStudentForModal(null);
                  setDirectoriaNote('');
                }}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md cursor-pointer"
              >
                Salvar Despacho
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Convidar Equipe via WhatsApp */}
      {isInviteWhatsappOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-5">
            <div>
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">ACESSO DA EQUIPE</span>
              <h3 className="text-lg font-black text-slate-800">Convidar Colaborador via WhatsApp</h3>
              <p className="text-xs text-slate-500">Envie o link de acesso seguro com PIN individual para sua equipe.</p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-900 leading-relaxed font-medium">
              "Olá! Bem-vindo(a) ao Anjinho Educador do {schoolName}. Seu acesso docente está liberado. Utilize seu PIN de 4 dígitos para registrar os diários e acompanhar as crianças com carinho!"
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setIsInviteWhatsappOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Fechar
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Olá! Bem-vindo(a) ao Anjinho Educador do ${schoolName}. Acesse a plataforma pelo link e use seu PIN individual.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsInviteWhatsappOpen(false)}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <MessageCircle size={14} />
                Enviar no WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Modal Criar Nova Turma */}
      {isNewTurmaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-lg font-black text-slate-800">Criar Nova Turma</h3>
            
            <div className="space-y-3">
              <CampoTextoVoz
                label="Nome da Turma"
                value={novaTurmaNome}
                onChange={setNovaTurmaNome}
                placeholder="Ex: Jardim I - A ou Berçário II"
                required
              />

              <CampoTextoVoz
                label="Faixa Etária"
                value={novaTurmaFaixa}
                onChange={setNovaTurmaFaixa}
                placeholder="Ex: 3-4 ANOS ou 6 a 12 meses"
                required
              />

              <CampoTextoVoz
                label="Educador(a) Titular"
                value={novaTurmaProf}
                onChange={setNovaTurmaProf}
                placeholder="Ex: Renata Vasconcelos ou Ana Silva"
                required
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => {
                  setIsNewTurmaModalOpen(false);
                  setNovaTurmaNome('');
                  setNovaTurmaFaixa('');
                  setNovaTurmaProf('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (novaTurmaNome.trim()) {
                    const nova: TurmaEscolar = {
                      id: String(Date.now()),
                      nome: novaTurmaNome.trim(),
                      faixaEtaria: novaTurmaFaixa.trim() || '2-3 ANOS',
                      icone: '🎈',
                      descricao: 'Turma em processo de integração e desenvolvimento.',
                      capacidade: 8,
                      lotacao: 0,
                      educadorTitular: novaTurmaProf.trim() || 'Educador Titular',
                      alunos: []
                    };
                    const updated = [...turmas, nova];
                    setTurmas(updated);
                    localStorage.setItem('anjo_turmas', JSON.stringify(updated));
                    setIsNewTurmaModalOpen(false);
                    setNovaTurmaNome('');
                    setNovaTurmaFaixa('');
                    setNovaTurmaProf('');
                  }
                }}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md cursor-pointer"
              >
                Salvar Turma
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cadastro / Edição de Colaborador (Docente, Diretoria, Coordenação, Dev) com Foto e Voz */}
      {isNewDocenteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4 my-8 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">
                  {editingDocente ? 'GESTÃO DE EQUIPE ESCOLAR' : 'NOVO CADASTRO DE COLABORADOR'}
                </span>
                <h3 className="text-lg font-black text-slate-800">
                  {editingDocente ? 'Editar Ficha do Colaborador' : 'Cadastrar Membro da Equipe'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsNewDocenteModalOpen(false);
                  setEditingDocente(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDocente} className="space-y-4 text-xs font-bold text-slate-700 max-h-[75vh] overflow-y-auto pr-1">
              {/* Foto do Colaborador com recorte/compressão rápida */}
              <CampoFotoUpload
                fotoUrl={docenteFormData.fotoUrl || ''}
                onFotoChange={(url) => setDocenteFormData((prev) => ({ ...prev, fotoUrl: url }))}
                label="Foto de Perfil do Colaborador"
                tipoPerfil={
                  docenteFormData.cargo === 'DIRETOR'
                    ? 'diretora'
                    : docenteFormData.cargo === 'COORDENADOR'
                    ? 'coordenadora'
                    : docenteFormData.cargo === 'DESENVOLVEDOR'
                    ? 'desenvolvedor'
                    : 'professor'
                }
                tamanho="md"
              />

              {/* Nome Completo com Voz */}
              <CampoTextoVoz
                label="Nome Completo *"
                value={docenteFormData.nome || ''}
                onChange={(val) => setDocenteFormData((prev) => ({ ...prev, nome: val }))}
                placeholder="Ex: Nilva Amaral, Renata Vasconcelos, Djalma..."
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-slate-700">Função / Cargo *</label>
                  <select
                    value={docenteFormData.cargo || 'CUIDADOR'}
                    onChange={(e) =>
                      setDocenteFormData((prev) => ({
                        ...prev,
                        cargo: e.target.value as any,
                        cargoDescricao:
                          e.target.value === 'DIRETOR'
                            ? 'Diretor(a) Geral'
                            : e.target.value === 'COORDENADOR'
                            ? 'Coordenador(a) Pedagógico(a)'
                            : e.target.value === 'DESENVOLVEDOR'
                            ? 'Desenvolvedor & Arquiteto de Software'
                            : 'Educador(a) / Cuidador(a) Titular',
                      }))
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800"
                  >
                    <option value="DIRETOR">DIRETOR(A)</option>
                    <option value="COORDENADOR">COORDENADOR(A)</option>
                    <option value="CUIDADOR">EDUCADOR(A) / CUIDADOR(A)</option>
                    <option value="DESENVOLVEDOR">DESENVOLVEDOR</option>
                  </select>
                </div>

                {/* PIN com 4 dígitos */}
                <div>
                  <label className="block mb-1 text-slate-700">PIN de Acesso (4 Dígitos) *</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={docenteFormData.pin || ''}
                    onChange={(e) => setDocenteFormData((prev) => ({ ...prev, pin: e.target.value }))}
                    placeholder="Ex: 3031"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono text-center font-black tracking-widest text-indigo-700"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Telefone / WhatsApp com Voz */}
                <CampoTextoVoz
                  label="Telefone / WhatsApp *"
                  value={docenteFormData.telefone || ''}
                  onChange={(val) => setDocenteFormData((prev) => ({ ...prev, telefone: val }))}
                  placeholder="(11) 98765-4321"
                  type="tel"
                  required
                />

                {/* Turmas Ativas com Voz */}
                <CampoTextoVoz
                  label="Turmas Ativas / Vinculadas"
                  value={docenteFormData.turmasAtivas || ''}
                  onChange={(val) => setDocenteFormData((prev) => ({ ...prev, turmasAtivas: val }))}
                  placeholder="Ex: Berçário I - A ou Todas as Turmas"
                />
              </div>

              {/* Descrição / Atribuições com Voz */}
              <CampoTextoVoz
                label="Atribuições & Descrição Profissional"
                value={docenteFormData.descricao || ''}
                onChange={(val) => setDocenteFormData((prev) => ({ ...prev, descricao: val }))}
                placeholder="Ex: Gestão executiva, acolhimento pedagógico e comunicação escolar diária..."
                type="textarea"
                rows={2}
              />

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                {editingDocente ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteDocente(editingDocente.id)}
                    className="px-3.5 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 border border-rose-200"
                  >
                    <Trash2 size={13} />
                    Excluir
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewDocenteModalOpen(false);
                      setEditingDocente(null);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md transition cursor-pointer"
                  >
                    {editingDocente ? 'Salvar Alterações' : 'Cadastrar Colaborador'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PLANO DE MEDIAÇÃO DE CONFLITOS ESCOLAR */}
      {/* ========================================================================= */}
      {isPlanoMediacaoOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5 relative max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shrink-0">
                  <Smile size={20} />
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">
                  Plano de Mediação de Conflitos Escolar
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPlanoMediacaoOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Intro text */}
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Conflitos leves, disputas por brinquedos ou agressividade física pontual (mordidas no Maternal II, empurrões no Pré) fazem parte da maturação social. Este plano orienta o acolhimento seguro.
            </p>

            {/* 3 Eixos */}
            <div className="space-y-3">
              {/* EIXO 1 */}
              <div className="bg-rose-50/80 border border-rose-200/80 rounded-2xl p-4 text-left space-y-1">
                <span className="text-[11px] font-black text-rose-800 uppercase tracking-wider block">
                  EIXO 1: AÇÃO IMEDIATA DE PROTEÇÃO
                </span>
                <p className="text-xs text-rose-950 font-medium leading-relaxed">
                  Separar fisicamente as crianças de forma neutra, sem gritos ou punição humilhante. Priorizar o acolhimento da criança machucada / agredida e garantir sua integridade física e emocional.
                </p>
              </div>

              {/* EIXO 2 */}
              <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 text-left space-y-1">
                <span className="text-[11px] font-black text-amber-800 uppercase tracking-wider block">
                  EIXO 2: CÍRCULO DE CONVERSA E EMPATIA
                </span>
                <p className="text-xs text-amber-950 font-medium leading-relaxed">
                  Sentar em roda com os envolvidos. Utilizar linguagem de sentimentos (Ex: "O amigo ficou triste porque doeu o braço"). Estimular a reparação do atrito através do cuidado mútuo, ajudando a colocar um gelo ou entregando o brinquedo.
                </p>
              </div>

              {/* EIXO 3 */}
              <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 text-left space-y-1">
                <span className="text-[11px] font-black text-emerald-800 uppercase tracking-wider block">
                  EIXO 3: REGISTRO E COMUNICAÇÃO RESPONSÁVEL
                </span>
                <p className="text-xs text-emerald-950 font-medium leading-relaxed">
                  Anotar no Anjinho o ocorrido em termos objetivos (fatos, não julgamentos). No caso de mordidas, informar ambas as famílias de forma discreta e protetiva no privado, resguardando a identidade da outra criança envolvida para evitar estigmatizaciones.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsPlanoMediacaoOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black transition cursor-pointer"
              >
                Fechar Plano
              </button>
              <button
                type="button"
                onClick={() => setIsPlanoMediacaoOpen(false)}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm transition cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
