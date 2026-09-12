import React, { useState, useRef, useEffect } from 'react';
import {
  BookOpen,
  Users,
  ClipboardList,
  Calendar,
  HeartHandshake,
  Sparkles,
  Search,
  Mic,
  LogOut,
  ChevronDown, RotateCcw,
  TreeDeciduous,
  Pill,
  Bell,
  ShieldCheck,
  Menu,
  X,
  GraduationCap,
  ChevronRight,
  Shield,
  Activity,
  Layers,
  Crown,
  Moon,
  Sun,
  School
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import LogoAnjinhoEducador from './comum/LogoAnjinhoEducador';

interface Props {
  user: any;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  selectedChildName?: string;
  selectedChildDob?: string;
  selectedChildPhoto?: string;
  userRole?: 'professor' | 'familia';
  onToggleRole?: (role: 'professor' | 'familia') => void;
  onOpenStudentModal?: () => void;
  onOpenShortcutModal?: () => void;
  currentProfileName?: string;
  currentProfilePhoto?: string;
  currentProfileRoleTitle?: string;
}

export default function BannerHeader({
  user,
  activeTab,
  onSelectTab,
  selectedChildName = 'Mariana Souza',
  selectedChildDob = '12/10/2023',
  selectedChildPhoto = 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=100&auto=format&fit=crop&q=80',
  userRole = 'professor',
  onToggleRole,
  onOpenStudentModal,
  onOpenShortcutModal,
  currentProfileName,
  currentProfilePhoto,
  currentProfileRoleTitle,
}: Props) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isListeningSearch, setIsListeningSearch] = useState(false);
  const [isAuraLoading, setIsAuraLoading] = useState(false);


  const handleAuraSSO = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isAuraLoading) return;
    setIsAuraLoading(true);
    try {
      // Determina cargo exato conforme o Brand Book e a especificação da Aura:
      // diretor | coordenador | professor | familiar | especialista
      let cargoTipo = 'professor';
      let nomeUsuario = user?.displayName || 'Ana Silva (Professora Titular)';
      let emailUsuario = user?.email || 'ana.silva@escola.com';
      let idUsuario = user?.uid || 'usr_prof_ana';

      const roleDesc = (currentProfileRoleTitle || '').toLowerCase();
      const roleStr = String(userRole);
      if (activeTab === 'direcao' || roleStr === 'diretor' || roleDesc.includes('diret')) {
        cargoTipo = 'diretor';
        nomeUsuario = 'Nilva Amaral (Diretora Geral)';
        emailUsuario = 'diretoria@arvoredainfancia.com.br';
        idUsuario = 'usr_dir_nilva';
      } else if (activeTab === 'coordenacao' || roleStr === 'coordenacao' || roleDesc.includes('coord')) {
        cargoTipo = 'coordenador';
        nomeUsuario = 'Marina Santos (Coordenação Pedagógica)';
        emailUsuario = 'coordenacao@arvoredainfancia.com.br';
        idUsuario = 'usr_coord_marina';
      } else if (roleStr === 'familia' || activeTab === 'familias' || roleDesc.includes('mãe') || roleDesc.includes('pai') || roleDesc.includes('famíl')) {
        cargoTipo = 'familiar';
        nomeUsuario = 'Clarice Souza (Mãe da Mariana)';
        emailUsuario = 'clarice.souza@gmail.com';
        idUsuario = 'usr_fam_clarice';
      }

      const response = await fetch('/api/aura/sso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailUsuario,
          userId: idUsuario,
          userName: nomeUsuario,
          tipo: cargoTipo,
          escola: 'Escola Árvore da Infância',
          escola_id: 'esc_001',
          returnUrl: window.location.href,
          student_id: selectedChildName ? 'mariana_souza_01' : undefined,
          studentNome: selectedChildName || 'Mariana Souza',
          studentAge: '1 ano e 4 meses',
          turma: 'Berçário I - A',
          alergias: 'Nenhuma alergia alimentar registrada',
          condicoes: 'Desenvolvimento motor em evolução ativa',
          historico: 'Adaptação excelente, rotina de sono e mamadeira tranquila',
        }),
      });
      const data = await response.json();
      if (data.url) {
        window.open(data.url, '_blank');
      } else {
        alert('Falha ao conectar com a Anjinha Aura.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão com o servidor.');
    } finally {
      setIsAuraLoading(false);
    }
  };

  const handleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Reconhecimento de voz não suportado neste navegador.');
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.continuous = false;
      setIsListeningSearch(true);
      recognition.onend = () => setIsListeningSearch(false);
      recognition.onerror = () => setIsListeningSearch(false);
      recognition.onresult = (e: any) => {
        const text = e.results[0][0].transcript;
        setSearchTerm(text);
        setIsListeningSearch(false);
      };
      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListeningSearch(false);
    }
  };

  // Itens visíveis diretamente na barra superior
  const primaryNavItems = [
    { id: 'diario_escolar', label: 'Diário Escolar', icon: BookOpen },
    { id: 'turma', label: 'Turma & Alunos', icon: Users },
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'familias', label: 'Famílias', icon: HeartHandshake },
  ];

  const categorizedMenu = [
    {
      categoria: 'Gestão, Direção & Coordenação',
      descricao: 'Visão estratégica, supervisão pedagógica e gestão escolar',
      items: [
        {
          id: 'direcao',
          label: 'Painel da Direção Escolar',
          sub: 'Visão 360º, Turmas, Indicadores e Gestão Docente',
          icon: Crown,
          badge: 'NOVA ABA',
          badgeColor: 'bg-amber-400 text-amber-950',
        },
        {
          id: 'coordenacao',
          label: 'Coordenação Pedagógica',
          sub: 'Identificação Precoce, Encaminhamentos & Mediação de Conflitos',
          icon: GraduationCap,
          badge: 'Destaque',
          badgeColor: 'bg-indigo-100 text-indigo-800',
        },
        {
          id: 'jornada',
          label: 'Jornada do Anjinho & Método LIVRO',
          sub: 'Árvore da Vida, Marcos Pedagógicos & Linha do Tempo',
          icon: TreeDeciduous,
          badge: 'BNCC',
          badgeColor: 'bg-emerald-100 text-emerald-800',
        },
        {
          id: 'brand_book',
          label: 'Brand Book',
          sub: 'Livro de Marca & Diretrizes Estratégicas do Anjinho Escolar',
          icon: BookOpen,
          badge: 'NOVO',
          badgeColor: 'bg-amber-400 text-amber-950',
        },
      ],
    },
    {
      categoria: 'Rotina & Sala de Aula',
      descricao: 'Registros diários em tempo real e gestão de alunos',
      items: [
        {
          id: 'diario_escolar',
          label: 'Diário Escolar & Portal de Paz',
          sub: 'Presença, Sono, Alimentação, Fraldas e Humor com 1-Clique/Voz',
          icon: BookOpen,
          badge: 'Principal',
          badgeColor: 'bg-teal-100 text-teal-800',
        },
        {
          id: 'rotina',
          label: 'Diário de Rotina Consolidado',
          sub: 'Painel unificado e linha do tempo de cuidados diários',
          icon: ClipboardList,
        },
        {
          id: 'turma',
          label: 'Turma & Alunos',
          sub: 'Fichas individuais, contatos de emergência e fotos',
          icon: Users,
        },
      ],
    },
    {
      categoria: 'Comunicação & Vínculo Familiar',
      descricao: 'Conexão direta, transparente e carinhosa com os pais',
      items: [
        {
          id: 'mural',
          label: 'Mural de Avisos & Recados',
          sub: 'Comunicação de mão dupla e integração WhatsApp',
          icon: Bell,
        },
        {
          id: 'familias',
          label: 'Famílias & Vínculo',
          sub: 'Contatos autorizados, diretoria, educadores e pais',
          icon: HeartHandshake,
        },
        {
          id: 'agenda',
          label: 'Agenda & Calendário Escolar',
          sub: 'Eventos letivos, festas temáticas e reuniões',
          icon: Calendar,
        },
      ],
    },
    {
      categoria: 'Saúde, Cuidado & Segurança Jurídica',
      descricao: 'Protocolos de segurança, medicamentos e privacidade',
      items: [
        {
          id: 'medicamentos',
          label: 'Controle de Medicamentos',
          sub: 'Administração com PIN, dosagens e autorização dos pais',
          icon: Pill,
          badge: 'PIN Seguro',
          badgeColor: 'bg-rose-100 text-rose-800',
        },
        {
          id: 'lgpd',
          label: 'Governança LGPD & Jurídico',
          sub: 'Consentimento de fotos, auditoria e respaldo legal da escola',
          icon: ShieldCheck,
        },
      ],
    },
  ];


  return (
    <header className="w-full shadow-md z-30 sticky top-0">
      {/* Top Main Navigation Bar */}
      <div className="bg-gradient-to-r from-teal-600 via-indigo-700 to-indigo-800 text-white px-3 sm:px-5 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
          
          {/* Left: Logo & Hamburger Trigger */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Botão Hambúrguer Principal */}
            <button
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border border-white/20 shadow-xs"
              title="Abrir menu lateral com todas as abas e módulos"
            >
              <Menu size={17} />
              <span className="hidden lg:inline text-[11px] font-bold">Menu</span>
            </button>

            {/* Logo Oficial Anjinho Escolar */}
            <div
              onClick={() => onSelectTab('diario_escolar')}
              className="flex items-center gap-2.5 cursor-pointer select-none group"
              title="Anjinho Escolar - Início"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white p-0.5 flex items-center justify-center shadow-md flex-shrink-0 group-hover:scale-105 transition overflow-hidden">
                <LogoAnjinhoEducador variant="symbol" size="full" className="w-full h-full" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-sm sm:text-base tracking-tight leading-none text-white">
                    Anjinho Escolar
                  </span>
                </div>
                <p className="text-[9px] sm:text-[10px] text-indigo-100/90 font-medium leading-none mt-1 hidden sm:block truncate max-w-[170px] md:max-w-none">
                  Onde a infância é registrada para sempre
                </p>
              </div>
            </div>
          </div>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1">
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-white/25 text-white shadow-xs backdrop-blur font-black'
                      : 'text-indigo-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon size={14} className="flex-shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}


            {/* Link Aura Destacado */}
            <button
              onClick={handleAuraSSO}
              disabled={isAuraLoading}
              className={`ml-1 px-2.5 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-amber-950 shadow-md transition flex items-center gap-1 cursor-pointer active:scale-95 whitespace-nowrap ${isAuraLoading ? 'opacity-70 cursor-wait' : ''}`}
            >
              {isAuraLoading ? <RotateCcw className="animate-spin" size={13} /> : <Sparkles size={13} />}
              <span>Anjinha Aura</span>
            </button>
          </nav>

          {/* Right Profile & Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Aura Button on mobile */}
            <button
              onClick={handleAuraSSO}
              disabled={isAuraLoading}
              className={`lg:hidden px-2 py-1 rounded-xl text-[10px] font-black bg-amber-400 text-amber-950 flex items-center gap-1 shadow flex-shrink-0 ${isAuraLoading ? 'opacity-70 cursor-wait' : ''}`}
            >
              {isAuraLoading ? <RotateCcw className="animate-spin" size={12} /> : <Sparkles size={12} />}
              <span>Aura</span>
            </button>

            {/* Teacher / Family Profile Pill */}
            <div className="relative">
              <div
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-1.5 sm:gap-2 bg-white/10 hover:bg-white/15 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-2xl cursor-pointer transition border border-white/15"
              >
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full overflow-hidden bg-amber-300 flex items-center justify-center text-amber-950 font-black text-xs border border-white/40 flex-shrink-0">
                  <img
                    src={
                      currentProfilePhoto ||
                      (userRole === 'professor'
                        ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80'
                        : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80')
                    }
                    alt="Perfil"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-[11px] font-black leading-tight truncate max-w-[150px] xl:max-w-[200px]">
                    {currentProfileName ||
                      (userRole === 'professor'
                        ? 'Ana Silva (Professora Titular)'
                        : 'Thiago Alencar (Pai)')}
                  </p>
                  <p className="text-[8px] text-indigo-200 uppercase tracking-wider leading-none">
                    {currentProfileRoleTitle ||
                      (userRole === 'professor' ? 'MASTER (DEV) BERÇÁRIO I - A' : 'RESPONSÁVEL FAMILIAR')}
                  </p>
                </div>
                <ChevronDown size={12} className="text-indigo-200" />
              </div>

              {/* Profile Dropdown */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white text-slate-800 rounded-2xl shadow-xl p-2 border border-slate-100 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-3 border-b border-slate-100">
                    <p className="text-xs font-black text-slate-800">
                      {currentProfileName || (userRole === 'professor' ? 'Ana Silva' : 'Thiago Alencar')}
                    </p>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
                        userRole === 'professor'
                          ? 'text-indigo-600 bg-indigo-50'
                          : 'text-emerald-600 bg-emerald-50'
                      }`}
                    >
                      {currentProfileRoleTitle ||
                        (userRole === 'professor'
                          ? 'PROFESSORA TITULAR / EDUCADOR'
                          : 'RESPONSÁVEL FAMILIAR')}
                    </span>
                  </div>

                  {onOpenShortcutModal && (
                    <button
                      onClick={() => {
                        onOpenShortcutModal();
                        setIsProfileOpen(false);
                      }}
                      className="w-full text-left p-2.5 text-xs font-bold text-indigo-700 hover:bg-indigo-50 rounded-xl transition cursor-pointer mt-1 flex items-center gap-2"
                    >
                      <span>⚡ Tela de Atalho (Simular Perfil)</span>
                    </button>
                  )}

                  {onToggleRole && (
                    <button
                      onClick={() => {
                        onToggleRole(userRole === 'professor' ? 'familia' : 'professor');
                        setIsProfileOpen(false);
                      }}
                      className="w-full text-left p-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition cursor-pointer mt-1"
                    >
                      {userRole === 'professor'
                        ? '🔄 Alternar para Visão dos Pais'
                        : '🔄 Alternar para Visão da Professora'}
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (onOpenShortcutModal) {
                        onOpenShortcutModal();
                        setIsProfileOpen(false);
                      } else {
                        signOut(auth);
                      }
                    }}
                    className="w-full flex items-center gap-2 p-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer mt-1"
                  >
                    <LogOut size={15} />
                    <span>Trocar Perfil / Sair</span>
                  </button>
                </div>
              )}
            </div>

            {/* Quick Role Toggle Icon (Moon/Sun) */}
            {onToggleRole && (
              <button
                onClick={() => onToggleRole(userRole === 'professor' ? 'familia' : 'professor')}
                className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 text-indigo-100 hover:text-white transition cursor-pointer"
                title={userRole === 'professor' ? 'Mudar para perfil de Família' : 'Mudar para perfil de Professor'}
              >
                {userRole === 'professor' ? <Moon size={15} /> : <Sun size={15} />}
              </button>
            )}

            {/* Quick Logout Icon -> Opens Shortcut Screen */}
            <button
              onClick={() => {
                if (onOpenShortcutModal) {
                  onOpenShortcutModal();
                } else {
                  signOut(auth);
                }
              }}
              className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/25 text-indigo-100 hover:text-white transition cursor-pointer shadow-xs"
              title="Tela de Atalho (Simular Perfil)"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar (Horizontal scroll for small screens) */}
        <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto pt-2 pb-0.5 text-xs no-scrollbar">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`px-2.5 py-1 rounded-xl font-bold whitespace-nowrap flex items-center gap-1 text-[11px] ${
                  isActive ? 'bg-white/25 text-white shadow-xs' : 'text-indigo-100 hover:bg-white/10'
                }`}
              >
                <Icon size={13} />
                <span>{item.label}</span>
              </button>
            );
          })}

        </div>
      </div>

      {/* Secondary Navy Bar (Child Context & Search) */}
      <div className="bg-[#120f30] text-white px-3 sm:px-5 py-2 border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
          {/* Child in View Badge */}
          <div
            onClick={onOpenStudentModal}
            className={`flex items-center gap-2.5 ${
              onOpenStudentModal ? 'cursor-pointer hover:bg-white/5 p-1 -m-1 rounded-xl transition' : ''
            }`}
            title={onOpenStudentModal ? 'Clique para trocar de aluno' : undefined}
          >
            <div className="w-8 h-8 rounded-full overflow-hidden bg-amber-400 border border-indigo-300 flex-shrink-0">
              <img
                src={selectedChildPhoto}
                alt={selectedChildName}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-[9px] text-indigo-300 font-bold uppercase tracking-wider flex items-center gap-1">
                <span>CRIANÇA/ALUNO EM EXIBIÇÃO:</span>
                {onOpenStudentModal && <span className="text-[8px] bg-indigo-500/40 text-indigo-200 px-1 py-0.2 rounded">Trocar ▾</span>}
              </p>
              <p className="text-xs font-black text-white leading-tight">
                {selectedChildName}{' '}
                <span className="text-indigo-300 font-normal">{selectedChildDob}</span>
              </p>
            </div>
          </div>

          {/* Quick Search & Voice Input */}
          <div className="flex items-center bg-[#1c1747] border border-indigo-950/60 rounded-xl px-3 py-1.5 max-w-md w-full focus-within:border-indigo-400 transition">
            <Search size={14} className="text-indigo-400 mr-2 flex-shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Busca rápida: digite nome da criança, sala ou responsável..."
              className="bg-transparent text-xs text-white placeholder-indigo-300/60 w-full outline-none"
            />
            <button
              onClick={handleVoiceSearch}
              className={`p-1 rounded-lg transition cursor-pointer ${
                isListeningSearch
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'text-indigo-300 hover:text-white hover:bg-white/10'
              }`}
              title="Busca por voz"
            >
              <Mic size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* DRAWER LATERAL / HAMBÚRGUER COMPLETO COM TODAS AS ABAS E MÓDULOS */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          />

          {/* Slide-over Content Drawer */}
          <div className="relative ml-0 w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-250">
            {/* Drawer Header */}
            <div className="bg-gradient-to-r from-teal-600 via-indigo-700 to-indigo-800 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white p-0.5 flex items-center justify-center shadow-lg flex-shrink-0 overflow-hidden">
                  <LogoAnjinhoEducador variant="symbol" size="full" className="w-full h-full" />
                </div>
                <div>
                  <h2 className="font-black text-base tracking-tight flex items-center gap-1.5 leading-tight">
                    <span>Anjinho Escolar</span>
                    <span className="text-[9px] bg-amber-400 text-amber-950 font-black px-1.5 py-0.5 rounded">
                      MENU COMPLETO
                    </span>
                  </h2>
                  <p className="text-[11px] text-indigo-100/90 font-medium">
                    Símbolo da Árvore da Infância • Gestão & Cuidado
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white cursor-pointer transition"
                title="Fechar Menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Categorized Menu Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {categorizedMenu.map((group, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="px-2">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-800">
                      {group.categoria}
                    </p>
                    <p className="text-[11px] text-slate-500 font-normal">
                      {group.descricao}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isSelected = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            onSelectTab(item.id);
                            setIsDrawerOpen(false);
                          }}
                          className={`w-full p-3 rounded-2xl border text-left transition flex items-center justify-between gap-3 cursor-pointer group ${
                            isSelected
                              ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                              : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition ${
                                isSelected
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-indigo-50 text-indigo-700 group-hover:bg-indigo-100'
                              }`}
                            >
                              <Icon size={20} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p
                                  className={`text-xs font-black truncate ${
                                    isSelected ? 'text-indigo-950' : 'text-slate-800'
                                  }`}
                                >
                                  {item.label}
                                </p>
                                {item.badge && (
                                  <span
                                    className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                                      item.badgeColor || 'bg-indigo-100 text-indigo-800'
                                    }`}
                                  >
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 font-medium truncate">
                                {item.sub}
                              </p>
                            </div>
                          </div>

                          <ChevronRight
                            size={16}
                            className={`flex-shrink-0 transition-transform ${
                              isSelected ? 'text-indigo-600 translate-x-0.5' : 'text-slate-300 group-hover:text-slate-500'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Botão Especial Anjinha Aura IA */}
              <div className="p-4 bg-gradient-to-r from-amber-50 to-amber-100/70 border border-amber-200 rounded-3xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-amber-600" size={18} />
                    <span className="text-xs font-black text-amber-950 uppercase tracking-wider">
                      Inteligência Artificial Pedagógica
                    </span>
                  </div>
                  <span className="text-[9px] bg-amber-300 text-amber-950 font-black px-2 py-0.5 rounded-full">
                    AURA IA
                  </span>
                </div>
                <p className="text-[11px] text-amber-900/90 font-medium leading-relaxed">
                  Consulte relatórios automatizados, insights de desenvolvimento infantil e sugestões pedagógicas.
                </p>
                <button
                  onClick={handleAuraSSO}
                  disabled={isAuraLoading}
                  className={`w-full py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-amber-950 font-black text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer ${isAuraLoading ? 'opacity-70 cursor-wait' : ''}`}
                >
                  {isAuraLoading ? <RotateCcw className="animate-spin" size={14} /> : <Sparkles size={14} />}
                  <span>{isAuraLoading ? 'Conectando...' : 'Acessar Anjinha Aura'}</span>
                </button>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 text-center">
              <p className="text-[11px] text-slate-500 font-bold">
                Anjo Educador • Sistema de Gestão e Cuidado Infantil
              </p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
