import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Share2,
  Search,
  Mic,
  MicOff,
  Phone,
  Mail,
  Edit2,
  Trash2,
  CheckSquare,
  Square,
  LayoutGrid,
  List,
  ShieldCheck,
  KeyRound,
  X,
  Check,
  Building2,
  GraduationCap,
  Sparkles,
  ExternalLink,
  Copy,
} from 'lucide-react';
import { MembroVinculo, CategoriaVinculo } from '../../types';
import { VINCULO_MEMBROS_INICIAIS } from '../../data/vinculoFamiliarData';
import CampoFotoUpload from '../comum/CampoFotoUpload';
import CampoTextoVoz from '../comum/CampoTextoVoz';

interface Props {
  currentStudentName: string;
  userRole?: 'professor' | 'familia';
}

export default function VinculoFamiliarModule({
  currentStudentName,
  userRole = 'professor',
}: Props) {
  // State for members
  const [members, setMembers] = useState<MembroVinculo[]>(() => {
    try {
      const saved = localStorage.getItem('anjo_vinculo_membros');
      return saved ? JSON.parse(saved) : VINCULO_MEMBROS_INICIAIS;
    } catch {
      return VINCULO_MEMBROS_INICIAIS;
    }
  });

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'todos' | CategoriaVinculo>('todos');
  const [viewMode, setViewMode] = useState<'completo' | 'reduzido'>('completo');

  // Modals state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<MembroVinculo | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [copiedPin, setCopiedPin] = useState<string | null>(null);

  // Voice search state
  const [isListening, setIsListening] = useState(false);

  // Form State for Add / Edit
  const [formData, setFormData] = useState<Partial<MembroVinculo>>({
    nome: '',
    tituloExibicao: '',
    cargoBadge: 'Mãe',
    categoria: 'familiares',
    whatsapp: '',
    sala: 'TODAS AS SALAS / GERAL',
    email: '',
    tipoPapel: 'pais_responsaveis',
    papelTitulo: 'PAIS / RESPONSÁVEIS',
    papelDescricao:
      'Pode acompanhar o diário de aula, receber comunicados via WhatsApp e acompanhar a rotina escolar diária.',
    pinAcesso: '',
    notas: '',
    fotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    regrasWhatsApp: {
      rotinasPendentes: false,
      alimentacaoCuidados: false,
      saudeSonoFralda: false,
      diarioAulaResumo: false,
    },
  });

  // Persist helper
  const saveMembers = (updated: MembroVinculo[]) => {
    setMembers(updated);
    try {
      localStorage.setItem('anjo_vinculo_membros', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle WhatsApp rule on a member
  const handleToggleRule = (memberId: string, ruleKey: keyof MembroVinculo['regrasWhatsApp']) => {
    const updated = members.map((m) => {
      if (m.id === memberId) {
        return {
          ...m,
          regrasWhatsApp: {
            ...m.regrasWhatsApp,
            [ruleKey]: !m.regrasWhatsApp[ruleKey],
          },
        };
      }
      return m;
    });
    saveMembers(updated);
  };

  // Copy PIN helper
  const handleCopyPin = (pin: string) => {
    navigator.clipboard.writeText(pin);
    setCopiedPin(pin);
    setTimeout(() => setCopiedPin(null), 2000);
  };

  // Voice Recognition for search
  const handleToggleVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Reconhecimento de voz não suportado neste navegador.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSearchTerm(transcript);
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  // Counts by category
  const counts = useMemo(() => {
    const familiares = members.filter((m) => m.categoria === 'familiares').length;
    const educadores = members.filter((m) => m.categoria === 'educadores').length;
    const direcao = members.filter((m) => m.categoria === 'direcao').length;
    return {
      todos: members.length,
      familiares,
      educadores,
      direcao,
    };
  }, [members]);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      // Category filter
      if (selectedCategory !== 'todos' && m.categoria !== selectedCategory) {
        return false;
      }
      // Text search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = m.nome.toLowerCase().includes(q);
        const matchTitle = m.tituloExibicao.toLowerCase().includes(q);
        const matchCargo = m.cargoBadge.toLowerCase().includes(q);
        const matchSala = m.sala.toLowerCase().includes(q);
        const matchPhone = m.whatsapp.toLowerCase().includes(q);
        const matchEmail = m.email.toLowerCase().includes(q);
        const matchNotes = m.notas.toLowerCase().includes(q);
        if (
          !matchName &&
          !matchTitle &&
          !matchCargo &&
          !matchSala &&
          !matchPhone &&
          !matchEmail &&
          !matchNotes
        ) {
          return false;
        }
      }
      return true;
    });
  }, [members, selectedCategory, searchTerm]);

  // Handle open Add Modal
  const handleOpenAdd = () => {
    setEditingMember(null);
    setFormData({
      nome: '',
      tituloExibicao: '',
      cargoBadge: 'Mãe',
      categoria: 'familiares',
      whatsapp: '',
      sala: 'TODAS AS SALAS / GERAL',
      email: '',
      tipoPapel: 'pais_responsaveis',
      papelTitulo: 'PAIS / RESPONSÁVEIS',
      papelDescricao:
        'Pode acompanhar o diário de aula, receber comunicados via WhatsApp e acompanhar a rotina escolar diária.',
      pinAcesso: Math.floor(1000 + Math.random() * 9000).toString(),
      notas: '',
      fotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      regrasWhatsApp: {
        rotinasPendentes: false,
        alimentacaoCuidados: false,
        saudeSonoFralda: false,
        diarioAulaResumo: false,
      },
    });
    setIsAddEditModalOpen(true);
  };

  // Handle open Edit Modal
  const handleOpenEdit = (m: MembroVinculo) => {
    setEditingMember(m);
    setFormData({ ...m });
    setIsAddEditModalOpen(true);
  };

  // Handle Save Form
  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome || !formData.whatsapp) {
      alert('Por favor, informe ao menos o Nome e o WhatsApp do membro.');
      return;
    }

    const cleanName = formData.nome.trim();
    const titulo = formData.tituloExibicao?.trim() || `${cleanName} (${formData.cargoBadge})`;

    let roleTitulo = 'PAIS / RESPONSÁVEIS';
    let roleDesc =
      'Pode acompanhar o diário de aula, receber comunicados via WhatsApp e acompanhar a rotina escolar diária.';
    if (formData.tipoPapel === 'professor_titular') {
      roleTitulo = 'PROFESSOR(A) TITULAR';
      roleDesc =
        'Pode registrar a agenda diária de sono, alimentação, trocas de fralda, mamadeiras e fotos da classe.';
    } else if (formData.tipoPapel === 'responsavel_secundario') {
      roleTitulo = 'RESPONSÁVEL SECUNDÁRIO';
      roleDesc = 'Visualização parcial da rotina do aluno.';
    }

    if (editingMember) {
      const updated = members.map((m) => {
        if (m.id === editingMember.id) {
          return {
            ...m,
            ...formData,
            nome: cleanName,
            tituloExibicao: titulo,
            papelTitulo: roleTitulo,
            papelDescricao: roleDesc,
          } as MembroVinculo;
        }
        return m;
      });
      saveMembers(updated);
    } else {
      const newMember: MembroVinculo = {
        id: `membro_${Date.now()}`,
        nome: cleanName,
        tituloExibicao: titulo,
        cargoBadge: formData.cargoBadge || 'Responsável',
        categoria: formData.categoria || 'familiares',
        whatsapp: formData.whatsapp || '',
        sala: formData.sala || 'TODAS AS SALAS / GERAL',
        email: formData.email || '',
        tipoPapel: formData.tipoPapel || 'pais_responsaveis',
        papelTitulo: roleTitulo,
        papelDescricao: roleDesc,
        pinAcesso: formData.pinAcesso || Math.floor(1000 + Math.random() * 9000).toString(),
        notas: formData.notas || '',
        fotoUrl:
          formData.fotoUrl ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        regrasWhatsApp: formData.regrasWhatsApp || {
          rotinasPendentes: false,
          alimentacaoCuidados: false,
          saudeSonoFralda: false,
          diarioAulaResumo: false,
        },
      };
      saveMembers([newMember, ...members]);
    }

    setIsAddEditModalOpen(false);
    setEditingMember(null);
  };

  // Handle Delete Member
  const handleDeleteMember = (id: string) => {
    const updated = members.filter((m) => m.id !== id);
    saveMembers(updated);
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* 1. HERO CARD: Vínculo Familiar, Pais e Equipe Escolar (Foto 23) */}
      <div className="bg-[#121528] rounded-3xl p-6 sm:p-8 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-indigo-950/80 border border-indigo-500/30 px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase text-indigo-300 tracking-wider">
              <Users size={13} className="text-indigo-400" />
              <span>REDE DE CONFIANÇA & DIÁRIO ESCOLAR</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Vínculo Familiar, Pais e Equipe Escolar
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Cadastre pais, mães, responsáveis, educadoras e coordenação para acompanhar o diário de{' '}
              <span className="font-bold text-amber-300">{currentStudentName}</span> em tempo real.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="flex-1 sm:flex-initial bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs sm:text-sm px-4 py-3 rounded-2xl shadow-lg shadow-emerald-950/30 flex items-center justify-center gap-2 transition cursor-pointer active:scale-95"
            >
              <Share2 size={16} />
              <span>Convidar via WhatsApp</span>
            </button>

            <button
              onClick={handleOpenAdd}
              className="flex-1 sm:flex-initial bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs sm:text-sm px-4 py-3 rounded-2xl shadow-md flex items-center justify-center gap-2 transition cursor-pointer active:scale-95"
            >
              <UserPlus size={16} className="text-indigo-600" />
              <span>+ Cadastrar Manualmente</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. SEARCH & FILTERS BAR (Foto 23) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Quick Search Input with Voice Mic */}
          <div className="relative w-full flex-1">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Busca rápida: digite nome, cargo, parentesco, sala ou telefone..."
              className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
            <button
              onClick={handleToggleVoice}
              title="Pesquisa por voz"
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition cursor-pointer ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-200'
              }`}
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
          </div>

          {/* View Mode Toggle: Completo vs Reduzido */}
          <div className="flex items-center gap-1 self-end md:self-auto bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('completo')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'completo'
                  ? 'bg-[#4338ca] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid size={14} />
              <span>Completo</span>
            </button>
            <button
              onClick={() => setViewMode('reduzido')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'reduzido'
                  ? 'bg-[#4338ca] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List size={14} />
              <span>Reduzido</span>
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
            <Users size={13} />
            FILTRAR:
          </span>

          <button
            onClick={() => setSelectedCategory('todos')}
            className={`px-3 py-1 rounded-xl text-xs font-black transition cursor-pointer ${
              selectedCategory === 'todos'
                ? 'bg-[#3b82f6] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({counts.todos})
          </button>

          <button
            onClick={() => setSelectedCategory('familiares')}
            className={`px-3 py-1 rounded-xl text-xs font-black transition cursor-pointer ${
              selectedCategory === 'familiares'
                ? 'bg-[#3b82f6] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Familiares ({counts.familiares})
          </button>

          <button
            onClick={() => setSelectedCategory('educadores')}
            className={`px-3 py-1 rounded-xl text-xs font-black transition cursor-pointer ${
              selectedCategory === 'educadores'
                ? 'bg-[#3b82f6] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Educadores ({counts.educadores})
          </button>

          <button
            onClick={() => setSelectedCategory('direcao')}
            className={`px-3 py-1 rounded-xl text-xs font-black transition cursor-pointer ${
              selectedCategory === 'direcao'
                ? 'bg-[#3b82f6] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Direção & Coord. ({counts.direcao})
          </button>
        </div>
      </div>

      {/* 3. MEMBERS CARDS GRID (Fotos 24, 25, 26, 27) */}
      {filteredMembers.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
          <Users size={40} className="mx-auto text-slate-300" />
          <h3 className="font-black text-slate-700 text-lg">Nenhum membro encontrado</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Não encontramos ninguém com o termo de busca informado ou filtro selecionado. Tente
            limpar a pesquisa ou cadastrar um novo membro.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('todos');
            }}
            className="px-4 py-2 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition cursor-pointer"
          >
            Limpar Filtros
          </button>
        </div>
      ) : viewMode === 'completo' ? (
        /* COMPLETO MODE: 2 Columns Grid */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredMembers.map((member) => {
            const isPais = member.tipoPapel === 'pais_responsaveis';
            const isProf = member.tipoPapel === 'professor_titular';
            const isSecundario = member.tipoPapel === 'responsavel_secundario';

            return (
              <div
                key={member.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                {/* Top Section: Left Info & Right WhatsApp Rules */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-5">
                  {/* Left Column: Member Details (7 cols) */}
                  <div className="sm:col-span-7 space-y-3">
                    {/* Header: Photo + Name + Badge */}
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                        <img
                          src={member.fotoUrl}
                          alt={member.nome}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-black text-sm text-slate-800 tracking-tight leading-snug">
                          {member.tituloExibicao}
                        </h3>

                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            {member.cargoBadge}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* WhatsApp & Room Info */}
                    <div className="space-y-1 text-xs text-slate-600 pt-0.5">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Phone size={13} className="text-slate-400 flex-shrink-0" />
                        <span>WhatsApp: {member.whatsapp}</span>
                      </div>

                      <div className="inline-block bg-slate-100 text-slate-700 text-[10px] font-black px-2 py-0.5 rounded">
                        {member.sala}
                      </div>

                      {member.email && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 truncate">
                          <Mail size={12} className="text-slate-400 flex-shrink-0" />
                          <span className="truncate">Email: {member.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Role Description Box */}
                    <div
                      className={`p-3 rounded-xl border text-xs leading-relaxed ${
                        isPais
                          ? 'bg-emerald-50/50 border-emerald-200/80 text-emerald-950'
                          : isProf
                          ? 'bg-amber-50/50 border-amber-200/80 text-amber-950'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-black text-[11px] uppercase tracking-wider mb-1">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            isPais ? 'bg-emerald-500' : isProf ? 'bg-amber-500' : 'bg-slate-400'
                          }`}
                        />
                        <span>{member.papelTitulo}</span>
                      </div>
                      <p className="text-[11px] opacity-90">{member.papelDescricao}</p>
                    </div>

                    {/* PIN de Acesso Box (Beige/Yellow as in photo 24-27) */}
                    <div className="bg-[#fef9c3] border border-amber-200/90 rounded-xl px-3 py-2 text-xs text-amber-950 flex items-center justify-between gap-2 shadow-2xs">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <span>PIN de Acesso:</span>
                        <span className="font-black tracking-widest bg-white/80 border border-amber-300 px-2 py-0.5 rounded text-amber-900 font-mono text-xs">
                          {member.pinAcesso}
                        </span>
                        <span className="text-[10px] text-amber-800/80 hidden sm:inline">
                          (use para entrar no app)
                        </span>
                      </div>

                      <button
                        onClick={() => handleCopyPin(member.pinAcesso)}
                        title="Copiar PIN"
                        className="text-amber-800 hover:text-amber-950 p-1 hover:bg-amber-200/60 rounded transition cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                      >
                        {copiedPin === member.pinAcesso ? (
                          <span className="text-emerald-700 flex items-center gap-0.5">
                            <Check size={12} /> Copiado!
                          </span>
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>
                    </div>

                    {/* Notas */}
                    {member.notas && (
                      <p className="text-[11px] text-slate-500 italic">
                        Notas: &ldquo;{member.notas}&rdquo;
                      </p>
                    )}

                    {/* Edit & Delete Action Icons */}
                    <div className="flex items-center gap-3 pt-1 text-slate-400">
                      <button
                        onClick={() => handleOpenEdit(member)}
                        className="hover:text-indigo-600 transition cursor-pointer p-1 hover:bg-slate-100 rounded"
                        title="Editar Membro"
                      >
                        <Edit2 size={15} />
                      </button>

                      <button
                        onClick={() => setDeleteConfirmId(member.id)}
                        className="hover:text-rose-600 transition cursor-pointer p-1 hover:bg-slate-100 rounded"
                        title="Remover Membro"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Regras para Comunicados WhatsApp (5 cols) */}
                  <div className="sm:col-span-5 bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 flex flex-col justify-between">
                    <div>
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2.5">
                        REGRAS PARA COMUNICADOS WHATSAPP:
                      </h4>

                      <div className="space-y-2">
                        {/* Rule 1 */}
                        <div
                          onClick={() => handleToggleRule(member.id, 'rotinasPendentes')}
                          className="flex items-center justify-between gap-2 text-xs text-slate-700 cursor-pointer hover:text-indigo-600 select-none py-0.5"
                        >
                          <span className="text-[11px] font-medium leading-tight">
                            Rotinas Pendentes / Avisos
                          </span>
                          {member.regrasWhatsApp.rotinasPendentes ? (
                            <div className="w-4 h-4 bg-sky-500 text-white rounded flex items-center justify-center flex-shrink-0 shadow-2xs">
                              <Check size={12} strokeWidth={3} />
                            </div>
                          ) : (
                            <div className="w-4 h-4 border border-slate-300 rounded bg-white flex-shrink-0" />
                          )}
                        </div>

                        {/* Rule 2 */}
                        <div
                          onClick={() => handleToggleRule(member.id, 'alimentacaoCuidados')}
                          className="flex items-center justify-between gap-2 text-xs text-slate-700 cursor-pointer hover:text-indigo-600 select-none py-0.5"
                        >
                          <span className="text-[11px] font-medium leading-tight">
                            Alimentação e Cuidados
                          </span>
                          {member.regrasWhatsApp.alimentacaoCuidados ? (
                            <div className="w-4 h-4 bg-sky-500 text-white rounded flex items-center justify-center flex-shrink-0 shadow-2xs">
                              <Check size={12} strokeWidth={3} />
                            </div>
                          ) : (
                            <div className="w-4 h-4 border border-slate-300 rounded bg-white flex-shrink-0" />
                          )}
                        </div>

                        {/* Rule 3 */}
                        <div
                          onClick={() => handleToggleRule(member.id, 'saudeSonoFralda')}
                          className="flex items-center justify-between gap-2 text-xs text-slate-700 cursor-pointer hover:text-indigo-600 select-none py-0.5"
                        >
                          <span className="text-[11px] font-medium leading-tight">
                            Saúde, Sono e Fralda
                          </span>
                          {member.regrasWhatsApp.saudeSonoFralda ? (
                            <div className="w-4 h-4 bg-sky-500 text-white rounded flex items-center justify-center flex-shrink-0 shadow-2xs">
                              <Check size={12} strokeWidth={3} />
                            </div>
                          ) : (
                            <div className="w-4 h-4 border border-slate-300 rounded bg-white flex-shrink-0" />
                          )}
                        </div>

                        {/* Rule 4 */}
                        <div
                          onClick={() => handleToggleRule(member.id, 'diarioAulaResumo')}
                          className="flex items-center justify-between gap-2 text-xs text-slate-700 cursor-pointer hover:text-indigo-600 select-none py-0.5"
                        >
                          <span className="text-[11px] font-medium leading-tight">
                            Diário de Aula / Resumo
                          </span>
                          {member.regrasWhatsApp.diarioAulaResumo ? (
                            <div className="w-4 h-4 bg-sky-500 text-white rounded flex items-center justify-center flex-shrink-0 shadow-2xs">
                              <Check size={12} strokeWidth={3} />
                            </div>
                          ) : (
                            <div className="w-4 h-4 border border-slate-300 rounded bg-white flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    </div>

                    <a
                      href={`https://wa.me/55${member.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                        `Olá ${member.nome}, você está conectado ao Anjo Cuidador da escolinha para acompanhar o diário de ${currentStudentName}. Seu PIN de acesso rápido é: ${member.pinAcesso}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 block text-center text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 py-1 rounded-lg border border-emerald-200 transition cursor-pointer"
                    >
                      Enviar Mensagem Direta
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* REDUZIDO MODE: Compact List */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                  <img
                    src={member.fotoUrl}
                    alt={member.nome}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800">{member.tituloExibicao}</h4>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{member.whatsapp}</span>
                    <span>•</span>
                    <span className="font-semibold text-slate-700">{member.cargoBadge}</span>
                    <span>•</span>
                    <span className="bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-mono text-[11px]">
                      PIN: {member.pinAcesso}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <a
                  href={`https://wa.me/55${member.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition"
                >
                  WhatsApp
                </a>
                <button
                  onClick={() => handleOpenEdit(member)}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                >
                  <Edit2 size={15} />
                </button>
                <button
                  onClick={() => setDeleteConfirmId(member.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: CONVIDAR VIA WHATSAPP */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-700 font-black">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Share2 size={16} />
                </div>
                <h3 className="text-lg">Convidar via WhatsApp</h3>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Envie o link oficial de acesso ao diário da criança{' '}
              <strong className="text-indigo-700">{currentStudentName}</strong> para um responsável
              ou membro da equipe. A mensagem contém o link seguro e o PIN de acesso.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2 text-slate-700">
              <p className="font-bold text-slate-800">Mensagem padrão:</p>
              <p className="italic text-slate-600 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed">
                &ldquo;Olá! Você foi convidado(a) para acompanhar a rotina escolar diária de{' '}
                {currentStudentName} através do aplicativo <strong>Anjo Cuidador</strong> da
                escolinha. Acesse pelo link seguro para visualizar diário de refeições, sono, fotos e
                trocas de fralda em tempo real.&rdquo;
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700">
                Selecione um membro cadastrado para enviar:
              </label>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800">{m.nome}</span>
                      <span className="text-slate-500 ml-1.5">({m.cargoBadge})</span>
                      <p className="text-[11px] text-slate-400">{m.whatsapp}</p>
                    </div>
                    <a
                      href={`https://wa.me/55${m.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                        `Olá ${m.nome}! Você está conectado ao Anjo Cuidador da escolinha para acompanhar o diário de ${currentStudentName}. Seu PIN de acesso rápido é: ${m.pinAcesso}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1"
                    >
                      Enviar <ExternalLink size={12} />
                    </a>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CADASTRO / EDIÇÃO MANUAL (Foto 23 "+ Cadastrar Manualmente") */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 my-8 animate-scaleUp">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-800 font-black">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <UserPlus size={16} />
                </div>
                <h3 className="text-lg">
                  {editingMember ? 'Editar Membro da Rede' : 'Cadastrar Membro Manualmente'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="space-y-4 text-xs max-h-[75vh] overflow-y-auto pr-1">
              {/* Campo para Inserir Foto com suporte a Aluno, Familiar, Diretora, Coordenadora, Dev */}
              <CampoFotoUpload
                fotoUrl={formData.fotoUrl || ''}
                onFotoChange={(url) => setFormData({ ...formData, fotoUrl: url })}
                label="Foto de Perfil do Membro"
                tipoPerfil={
                  formData.cargoBadge?.toLowerCase().includes('diret')
                    ? 'diretora'
                    : formData.cargoBadge?.toLowerCase().includes('coord')
                    ? 'coordenadora'
                    : formData.cargoBadge?.toLowerCase().includes('dev') || formData.cargoBadge?.toLowerCase().includes('programad')
                    ? 'desenvolvedor'
                    : formData.categoria === 'educadores'
                    ? 'professor'
                    : 'familia'
                }
                tamanho="md"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <CampoTextoVoz
                  label="Nome Completo"
                  value={formData.nome || ''}
                  onChange={(val) => setFormData({ ...formData, nome: val })}
                  placeholder="Ex: Mariana Castro, Nilva, Djalma..."
                  required
                />

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Categoria na Instituição *
                  </label>
                  <select
                    value={formData.categoria || 'familiares'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        categoria: e.target.value as CategoriaVinculo,
                      })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="familiares">Familiares (Pais / Mães / Responsáveis)</option>
                    <option value="educadores">Educadores (Professores / Auxiliares)</option>
                    <option value="direcao">Direção, Coordenação & Desenvolvedor</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <CampoTextoVoz
                  label="Cargo / Parentesco / Função"
                  value={formData.cargoBadge || ''}
                  onChange={(val) => setFormData({ ...formData, cargoBadge: val })}
                  placeholder="Ex: Mãe, Pai, Diretora Geral, Coordenadora Pedagógica, Desenvolvedor..."
                  required
                />

                <CampoTextoVoz
                  label="WhatsApp / Telefone"
                  value={formData.whatsapp || ''}
                  onChange={(val) => setFormData({ ...formData, whatsapp: val })}
                  placeholder="Ex: (11) 99823-3310"
                  type="tel"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <CampoTextoVoz
                  label="Email Institucional / Pessoal"
                  value={formData.email || ''}
                  onChange={(val) => setFormData({ ...formData, email: val })}
                  placeholder="Ex: djalma@escola.com.br"
                  type="email"
                />

                <CampoTextoVoz
                  label="Sala / Abrangência"
                  value={formData.sala || ''}
                  onChange={(val) => setFormData({ ...formData, sala: val })}
                  placeholder="Ex: TODAS AS SALAS / GERAL ou BERÇÁRIO I - A"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tipo de Papel</label>
                  <select
                    value={formData.tipoPapel || 'pais_responsaveis'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tipoPapel: e.target.value as any,
                      })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="pais_responsaveis">PAIS / RESPONSÁVEIS</option>
                    <option value="professor_titular">PROFESSOR(A) TITULAR</option>
                    <option value="responsavel_secundario">RESPONSÁVEL SECUNDÁRIO</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    PIN de Acesso (4 Dígitos)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={formData.pinAcesso || ''}
                    onChange={(e) => setFormData({ ...formData, pinAcesso: e.target.value })}
                    placeholder="Ex: 3310"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center font-bold tracking-widest text-indigo-700 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <CampoTextoVoz
                label="Notas / Observações Administrativas"
                value={formData.notas || ''}
                onChange={(val) => setFormData({ ...formData, notas: val })}
                placeholder='Ex: "Diretora da instituição / Desenvolvedor do app. Acesso irrestrito."'
                type="textarea"
                rows={2}
              />

              {/* Checkboxes Regras WhatsApp */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <span className="font-black text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                  Regras Padrão para Comunicados WhatsApp
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.regrasWhatsApp?.rotinasPendentes ?? false}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          regrasWhatsApp: {
                            ...formData.regrasWhatsApp!,
                            rotinasPendentes: e.target.checked,
                          },
                        })
                      }
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Rotinas Pendentes / Avisos</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.regrasWhatsApp?.alimentacaoCuidados ?? false}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          regrasWhatsApp: {
                            ...formData.regrasWhatsApp!,
                            alimentacaoCuidados: e.target.checked,
                          },
                        })
                      }
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Alimentação e Cuidados</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.regrasWhatsApp?.saudeSonoFralda ?? false}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          regrasWhatsApp: {
                            ...formData.regrasWhatsApp!,
                            saudeSonoFralda: e.target.checked,
                          },
                        })
                      }
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Saúde, Sono e Fralda</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.regrasWhatsApp?.diarioAulaResumo ?? false}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          regrasWhatsApp: {
                            ...formData.regrasWhatsApp!,
                            diarioAulaResumo: e.target.checked,
                          },
                        })
                      }
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Diário de Aula / Resumo</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow"
                >
                  {editingMember ? 'Atualizar Membro' : 'Salvar Membro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAÇÃO DE EXCLUSÃO */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-200 animate-scaleUp">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 size={24} />
            </div>
            <h3 className="font-black text-slate-800 text-base">Remover Membro da Rede?</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tem certeza que deseja remover este membro da rede escolar? Ele perderá o acesso com PIN
              e deixará de receber comunicados via WhatsApp.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteMember(deleteConfirmId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow"
              >
                Sim, Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
