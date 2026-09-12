import React, { useState } from 'react';
import {
  X,
  Search,
  Mic,
  Moon,
  Sun,
  Lock,
  Sparkles,
  Check,
  ShieldCheck,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import LogoAnjinhoEducador from './LogoAnjinhoEducador';

export interface AtalhoPerfil {
  id: string;
  nome: string;
  tituloExibicao: string;
  subtituloCargo: string;
  categoria: 'dir' | 'coord' | 'prof' | 'fam_admin' | 'fam_conv' | 'dev';
  role: 'professor' | 'familia';
  tabDestino?: string;
  pinAcesso: string;
  fotoUrl: string;
  alunoPadraoId?: string;
}

export const ATALHO_PERFIS: AtalhoPerfil[] = [
  {
    id: 'nilva_amaral',
    nome: 'Nilva Amaral',
    tituloExibicao: 'Nilva Amaral (Diretora)',
    subtituloCargo: 'DIRETOR(A) / GESTÃO GERAL',
    categoria: 'dir',
    role: 'professor',
    tabDestino: 'direcao',
    pinAcesso: '3031',
    fotoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'renata_vasconcelos',
    nome: 'Renata Vasconcelos',
    tituloExibicao: 'Renata Vasconcelos (Coord...)',
    subtituloCargo: 'COORDENADOR(A) PEDAGÓGICO(A)',
    categoria: 'coord',
    role: 'professor',
    tabDestino: 'coordenacao',
    pinAcesso: '1010',
    fotoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'fabiana_moreira',
    nome: 'Fabiana Moreira',
    tituloExibicao: 'Fabiana Moreira (Coorden...)',
    subtituloCargo: 'COORDENADOR(A) PEDAGÓGICO(A)',
    categoria: 'coord',
    role: 'professor',
    tabDestino: 'coordenacao',
    pinAcesso: '2020',
    fotoUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'ana_silva',
    nome: 'Ana Silva',
    tituloExibicao: 'Ana Silva (Professora Titular)',
    subtituloCargo: 'PROFESSORA (BERÇÁRIO I - A)',
    categoria: 'prof',
    role: 'professor',
    tabDestino: 'diario_escolar',
    pinAcesso: '5678',
    fotoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    alunoPadraoId: 'mariana_souza',
  },
  {
    id: 'carla_dias',
    nome: 'Carla Dias',
    tituloExibicao: 'Carla Dias (Professora Tit...)',
    subtituloCargo: 'PROFESSORA (MATERNAL I - A)',
    categoria: 'prof',
    role: 'professor',
    tabDestino: 'diario_escolar',
    pinAcesso: '2222',
    fotoUrl: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=150&auto=format&fit=crop&q=80',
    alunoPadraoId: 'bernardo_teixeira',
  },
  {
    id: 'djalma_amaral',
    nome: 'Djalma Amaral',
    tituloExibicao: 'Djalma Amaral (Desenvolv...)',
    subtituloCargo: 'DESENVOLVEDOR DO SISTEMA',
    categoria: 'dev',
    role: 'professor',
    tabDestino: 'brandbook',
    pinAcesso: '9181',
    fotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'mariana_castro',
    nome: 'Mariana Castro',
    tituloExibicao: 'Mariana Castro (Mãe)',
    subtituloCargo: 'FAMILIAR ADMIN (MÃE)',
    categoria: 'fam_admin',
    role: 'familia',
    tabDestino: 'diario_escolar',
    pinAcesso: '3310',
    fotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    alunoPadraoId: 'beatriz_castro',
  },
  {
    id: 'camila_duarte',
    nome: 'Camila Duarte',
    tituloExibicao: 'Camila Duarte (Mãe)',
    subtituloCargo: 'FAMILIAR ADMIN (MÃE)',
    categoria: 'fam_admin',
    role: 'familia',
    tabDestino: 'diario_escolar',
    pinAcesso: '7654',
    fotoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    alunoPadraoId: 'cecilia_duarte',
  },
  {
    id: 'clarice_souza',
    nome: 'Clarice Souza',
    tituloExibicao: 'Clarice Souza (Mãe)',
    subtituloCargo: 'FAMILIAR ADMIN (MÃE)',
    categoria: 'fam_admin',
    role: 'familia',
    tabDestino: 'diario_escolar',
    pinAcesso: '4321',
    fotoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    alunoPadraoId: 'mariana_souza',
  },
  {
    id: 'juliana_santos',
    nome: 'Juliana Santos',
    tituloExibicao: 'Juliana Santos (Mãe)',
    subtituloCargo: 'FAMILIAR ADMIN (MÃE)',
    categoria: 'fam_admin',
    role: 'familia',
    tabDestino: 'diario_escolar',
    pinAcesso: '3322',
    fotoUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80',
    alunoPadraoId: 'gabriel_santos',
  },
  {
    id: 'larissa_costa',
    nome: 'Larissa Costa',
    tituloExibicao: 'Larissa Costa (Mãe)',
    subtituloCargo: 'FAMILIAR ADMIN (MÃE)',
    categoria: 'fam_admin',
    role: 'familia',
    tabDestino: 'diario_escolar',
    pinAcesso: '6677',
    fotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    alunoPadraoId: 'helena_costa',
  },
  {
    id: 'patricia_ferreira',
    nome: 'Patricia Ferreira',
    tituloExibicao: 'Patricia Ferreira (Mãe)',
    subtituloCargo: 'FAMILIAR ADMIN (MÃE)',
    categoria: 'fam_admin',
    role: 'familia',
    tabDestino: 'diario_escolar',
    pinAcesso: '8899',
    fotoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    alunoPadraoId: 'lucas_moraes',
  },
  {
    id: 'felipe_teixeira',
    nome: 'Felipe Teixeira',
    tituloExibicao: 'Felipe Teixeira (Pai)',
    subtituloCargo: 'FAMILIAR ADMIN (PAI)',
    categoria: 'fam_admin',
    role: 'familia',
    tabDestino: 'diario_escolar',
    pinAcesso: '4567',
    fotoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    alunoPadraoId: 'bernardo_teixeira',
  },
  {
    id: 'marcelo_oliveira',
    nome: 'Marcelo Oliveira',
    tituloExibicao: 'Marcelo Oliveira (Pai)',
    subtituloCargo: 'FAMILIAR ADMIN (PAI)',
    categoria: 'fam_admin',
    role: 'familia',
    tabDestino: 'diario_escolar',
    pinAcesso: '3344',
    fotoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    alunoPadraoId: 'alice_oliveira',
  },
  {
    id: 'rodrigo_mendes',
    nome: 'Rodrigo Mendes',
    tituloExibicao: 'Rodrigo Mendes (Pai)',
    subtituloCargo: 'FAMILIAR ADMIN (PAI)',
    categoria: 'fam_admin',
    role: 'familia',
    tabDestino: 'diario_escolar',
    pinAcesso: '9988',
    fotoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    alunoPadraoId: 'theo_ribeiro',
  },
  {
    id: 'thiago_alencar',
    nome: 'Thiago Alencar',
    tituloExibicao: 'Thiago Alencar (Pai)',
    subtituloCargo: 'FAMILIAR ADMIN (PAI)',
    categoria: 'fam_admin',
    role: 'familia',
    tabDestino: 'diario_escolar',
    pinAcesso: '4440',
    fotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    alunoPadraoId: 'enzo_alencar',
  },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeRole: 'professor' | 'familia';
  activeTab: string;
  onConfirmProfile: (perfil: AtalhoPerfil) => void;
  onSignOutDefinitive?: () => void;
}

export default function TelaAtalhoSimuladorModal({
  isOpen,
  onClose,
  activeRole,
  activeTab,
  onConfirmProfile,
  onSignOutDefinitive,
}: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [selectedProfileId, setSelectedProfileId] = useState<string>('ana_silva');
  const [pinDigits, setPinDigits] = useState<string>('5678');
  const [isDarkMode, setIsDarkMode] = useState(false);

  if (!isOpen) return null;

  // Filtragem dos perfis
  const perfisFiltrados = ATALHO_PERFIS.filter((p) => {
    const matchSearch =
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.tituloExibicao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.subtituloCargo.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchSearch) return false;

    if (selectedCategory === 'todos') return true;
    if (selectedCategory === 'dir') return p.categoria === 'dir';
    if (selectedCategory === 'coord') return p.categoria === 'coord';
    if (selectedCategory === 'prof') return p.categoria === 'prof';
    if (selectedCategory === 'fam_admin') return p.categoria === 'fam_admin';
    if (selectedCategory === 'fam_conv') return p.categoria === 'fam_conv';
    if (selectedCategory === 'dev') return p.categoria === 'dev';

    return true;
  });

  const perfilSelecionadoObj = ATALHO_PERFIS.find((p) => p.id === selectedProfileId);

  const handleSelectProfile = (perfil: AtalhoPerfil) => {
    setSelectedProfileId(perfil.id);
    setPinDigits(perfil.pinAcesso || '1234');
  };

  const handleKeypadPress = (val: string) => {
    if (val === 'C') {
      setPinDigits('');
    } else if (pinDigits.length < 6) {
      setPinDigits((prev) => prev + val);
    }
  };

  const handleConfirmLogin = () => {
    if (perfilSelecionadoObj) {
      onConfirmProfile(perfilSelecionadoObj);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#fbf9f4]/95 backdrop-blur-md flex flex-col items-center justify-start p-3 sm:p-6 animate-fadeIn">
      {/* Botão Superior Direito: Modo Escuro & Fechar */}
      <div className="w-full max-w-2xl flex items-center justify-between pt-2 pb-1 px-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-slate-600 hover:text-slate-900 border border-slate-200 text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <span>← Voltar ao Sistema</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center shadow-xs transition cursor-pointer"
            title="Alternar Tema"
          >
            {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center shadow-xs transition cursor-pointer"
            title="Fechar"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Card Central Principal */}
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-100 p-5 sm:p-8 space-y-6 my-3">
        {/* 1. Logotipo Oficial */}
        <div className="flex flex-col items-center text-center">
          <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-3xl bg-white p-1 shadow-lg border border-slate-100 flex items-center justify-center mb-3 overflow-hidden">
            <LogoAnjinhoEducador variant="symbol" size="full" className="w-full h-full" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
            Anjinho Escolar
          </h1>
          <p className="text-[11px] sm:text-xs font-black uppercase text-sky-600 tracking-wider mt-1">
            ROTINA, SEGURANÇA E CONECTIVIDADE PARA EDUCAÇÃO INFANTIL
          </p>
        </div>

        {/* 2. Botões de Ação Topo */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-slate-700 text-xs font-black">
            <Lock size={14} className="text-slate-500" />
            <span>ENTRAR (SIMULAR PERFIL)</span>
          </div>

          <div className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-slate-700 text-xs font-black">
            <Sparkles size={14} className="text-amber-500" />
            <span>30 DIAS GRÁTIS & LGPD</span>
          </div>
        </div>

        {/* 3. Instrução e Estado */}
        <div className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-700">
            SELECIONE UM DOS PERFIS SIMULADOS PARA ENTRAR:
          </p>

          {/* Status Conectado */}
          <div className="w-full py-1.5 px-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold text-center">
            ESTADO: CONECTADO
          </div>
        </div>

        {/* 4. Modo Creche & Educação Infantil Ativo */}
        <div className="flex items-center justify-between pt-1">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-black shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
            <span>MODO CRECHE & MATERNAL ATIVO</span>
          </div>

          <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
            Busca rápida de profissionais por nome
          </span>
        </div>

        {/* 5. Campo de Busca com Microfone */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Digite nome da professora, educadora ou responsável..."
            className="w-full pl-10 pr-10 py-3 rounded-2xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm font-medium transition"
          />
          <button
            type="button"
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition"
            title="Entrada por Voz"
          >
            <Mic size={17} />
          </button>
        </div>

        {/* 6. Filtros por Categoria */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-bold">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'dir', label: 'Dir.' },
            { id: 'coord', label: 'Coord.' },
            { id: 'prof', label: 'Prof.' },
            { id: 'fam_admin', label: 'Fam. Admin' },
            { id: 'fam_conv', label: 'Fam. Conv.' },
            { id: 'dev', label: 'Dev' },
          ].map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs font-black'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* 7. Grid de Perfis */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {perfisFiltrados.map((perfil) => {
            const isSelected = selectedProfileId === perfil.id;

            return (
              <div
                key={perfil.id}
                onClick={() => handleSelectProfile(perfil)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50/30 ring-2 ring-indigo-400/40 shadow-md sm:col-span-2'
                    : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                {/* Linha de Identificação */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={perfil.fotoUrl}
                      alt={perfil.nome}
                      className="w-11 h-11 rounded-full object-cover border border-slate-200 shadow-xs flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-black text-slate-800 truncate">
                        {perfil.tituloExibicao}
                      </h4>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                        {perfil.subtituloCargo}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="text-[10px] font-black bg-indigo-600 text-white px-2.5 py-1 rounded-lg shadow-xs flex-shrink-0">
                      Selecionado
                    </span>
                  )}
                </div>

                {/* Bloco de PIN e Teclado Numérico (quando o perfil está selecionado) */}
                {isSelected && (
                  <div className="mt-4 pt-4 border-t border-indigo-100 space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-black uppercase tracking-wider text-slate-700">
                        CÓDIGO PIN DE ACESSO
                      </span>
                      <span className="font-bold text-indigo-700 bg-indigo-100/80 px-2.5 py-0.5 rounded-md text-[11px]">
                        PIN: {perfil.pinAcesso}
                      </span>
                    </div>

                    {/* Visor do PIN */}
                    <div className="py-2.5 px-4 bg-white border border-indigo-200 rounded-xl text-center text-lg font-black tracking-widest text-slate-800 shadow-inner">
                      {pinDigits ? pinDigits.split('').join(' ') : '— — — —'}
                    </div>

                    {/* Teclado Numérico */}
                    <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto pt-1">
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0'].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleKeypadPress(val);
                          }}
                          className={`py-2.5 rounded-xl font-black text-sm transition cursor-pointer border ${
                            val === 'C'
                              ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                              : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-100 shadow-xs'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>

                    {/* Botão de Confirmação */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConfirmLogin();
                      }}
                      className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition transform active:scale-98 cursor-pointer flex items-center justify-center gap-2 mt-2"
                    >
                      <span>CONFIRMAR & ENTRAR</span>
                      <Check size={16} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 8. Nota Importante LGPD */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-center">
          <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
            <strong className="text-slate-700">Nota Importante:</strong> O aplicativo Anjinho Escolar foi desenvolvido de forma estrita em total concordância com as diretrizes de proteção e privacidade da LGPD (Lei nº 13.709/2018) brasileira.
          </p>
        </div>

        {/* 9. Desconectar Geral / Sair da Conta Google */}
        {onSignOutDefinitive && (
          <div className="pt-2 text-center">
            <button
              onClick={onSignOutDefinitive}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline inline-flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut size={13} />
              <span>Desconectar Conta Google do Dispositivo</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
