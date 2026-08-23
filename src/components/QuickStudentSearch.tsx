import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Baby, Check, User, Sparkles, Filter, ShieldAlert, Heart, ChevronRight } from 'lucide-react';
import { Idoso, Usuario, isDirectorOrAdminUser } from '../types';
import { getFromDB } from '../data';
import { VoiceInput } from './VoiceInput';

interface QuickStudentSearchProps {
  activeIdoso?: Idoso;
  onSwitchIdoso: (id: string) => void;
  appMode?: string;
  usuarioAtual?: Usuario;
  compact?: boolean;
  className?: string;
  darkMode?: boolean;
  onNavigate?: (screen: string) => void;
}

export const QuickStudentSearch: React.FC<QuickStudentSearchProps> = ({
  activeIdoso,
  onSwitchIdoso,
  appMode = 'escolar_infantil',
  usuarioAtual,
  compact = false,
  className = '',
  darkMode = false,
  onNavigate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>('todas');
  const [allStudents, setAllStudents] = useState<Idoso[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const isEscolar = appMode.startsWith('escolar');

  // Load students from DB and listen to updates
  useEffect(() => {
    const loadStudents = () => {
      const students = getFromDB<Idoso[]>('anjo_idosos', []);
      setAllStudents(students);
    };
    loadStudents();

    window.addEventListener('anjo_user_updated', loadStudents);
    window.addEventListener('anjo_idosos_updated', loadStudents);
    window.addEventListener('storage', loadStudents);
    return () => {
      window.removeEventListener('anjo_user_updated', loadStudents);
      window.removeEventListener('anjo_idosos_updated', loadStudents);
      window.removeEventListener('storage', loadStudents);
    };
  }, [appMode, activeIdoso?.id]);

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const norm = (s: string) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  // Master / Admin / Dev privileges check
  const isMasterActive = typeof localStorage !== 'undefined' && localStorage.getItem('anjo_master_demonstracao_ativo') === 'true';
  const isDevOrAdmin = isMasterActive || isDirectorOrAdminUser(usuarioAtual) || usuarioAtual?.tipo === 'desenvolvedor' || usuarioAtual?.tipo === 'dev' || usuarioAtual?.id === 'user_admin';

  // Filter students according to mode, user permissions and search term
  const filteredStudents = allStudents.filter(student => {
    const isStudent = student.id.startsWith('aluno_');
    const isFundamental = student.id.startsWith('aluno_fun_');

    // Filter by app mode
    if (appMode.startsWith('escolar') && (!isStudent || isFundamental)) return false;
    if (appMode === 'idoso' && isStudent) return false;

    const isSearching = searchTerm.trim().length > 0;

    // Security & Isolation for Non-Master/Non-Admin users (when not master mode and not actively searching):
    if (!isDevOrAdmin && usuarioAtual && !isSearching && selectedRoomFilter === 'todas') {
      const uType = (usuarioAtual.tipo || '').toLowerCase();
      
      // If user is a family member:
      if (uType === 'familiar' || uType === 'familiar_admin' || uType === 'familiar_convidado') {
        const isKnownChild = (usuarioAtual.id === 'user_mae_heitor' && (student.id === 'aluno_5' || student.id === 'aluno_22' || norm(student.nome).includes('heitor') || norm(student.nome).includes('giovan'))) ||
          (usuarioAtual.id === 'user_pai_bernardo' && (student.id === 'aluno_2' || norm(student.nome).includes('bernardo'))) ||
          (usuarioAtual.id === 'user_pai_miguel' && (student.id === 'aluno_10' || norm(student.nome).includes('miguel'))) ||
          (usuarioAtual.id === 'user_mae_alice' && (student.id === 'aluno_6' || norm(student.nome).includes('alice')));

        const cleanUserPhone = usuarioAtual.telefone ? usuarioAtual.telefone.replace(/\D/g, '') : '';
        const cleanContactPhone = student.contatoEmergencia?.telefone ? student.contatoEmergencia.telefone.replace(/\D/g, '') : '';
        const phoneMatches = Boolean(cleanUserPhone && cleanContactPhone && (cleanUserPhone.includes(cleanContactPhone) || cleanContactPhone.includes(cleanUserPhone)));
        
        const cleanUserName = norm(usuarioAtual.nome).replace(/\s*\((mãe|mae|pai|responsável|responsavel|familiar|convidado|admin)\)/gi, '').trim();
        const cleanContactName = norm(student.contatoEmergencia?.nome || '');
        const nameMatches = Boolean(
          cleanContactName && cleanUserName &&
          (cleanContactName.includes(cleanUserName) || cleanUserName.includes(cleanContactName))
        );
        const isActiveChild = activeIdoso && activeIdoso.id === student.id;

        if (!isKnownChild && !phoneMatches && !nameMatches && !isActiveChild) {
          return false;
        }
      } else {
        // Teacher / Caregiver isolation:
        // Only restrict default list if no search term and "todas" is selected
        if (usuarioAtual.salaAula && usuarioAtual.salaAula !== 'Todas') {
          const userRooms = usuarioAtual.salaAula.split(',').map(r => norm(r));
          const studentRoomStr = norm(student.salaAula || student.quarto || (student as any).sala || student.nome || '');
          const belongsToTeacher = userRooms.some(r => studentRoomStr.includes(r) || r.includes(studentRoomStr));
          if (!belongsToTeacher) return false;
        }
      }
    }

    // Filter by room chip
    if (selectedRoomFilter !== 'todas') {
      const studentRoomInfo = norm(`${student.salaAula || ''} ${student.quarto || ''} ${student.nome || ''}`);
      const filterLower = norm(selectedRoomFilter);
      if (!studentRoomInfo.includes(filterLower)) return false;
    }

    // Filter by search query (Name, Room, Parent Name, Phone, Allergies, Observations)
    if (!isSearching) return true;

    const term = norm(searchTerm);
    const termDigits = searchTerm.replace(/\D/g, '');
    const contactPhoneDigits = (student.contatoEmergencia?.telefone || '').replace(/\D/g, '');

    const matchName = norm(student.nome).includes(term);
    const matchContactName = norm(student.contatoEmergencia?.nome || '').includes(term);
    const matchPhone = (termDigits.length >= 3 && contactPhoneDigits.includes(termDigits)) || 
      norm(student.contatoEmergencia?.telefone || '').includes(term);
    const matchRoom = norm(`${student.salaAula || ''} ${student.quarto || ''} ${student.nome || ''}`).includes(term);
    const matchAllergies = Array.isArray(student.alergias)
      ? student.alergias.some((a: string) => norm(a).includes(term))
      : (typeof student.alergias === 'string' && norm(student.alergias as string).includes(term));
    const matchCond = Array.isArray(student.condicoesMedicas)
      ? student.condicoesMedicas.some((c: string) => norm(c).includes(term))
      : false;
    const matchObs = norm(student.observacoes || '').includes(term) || norm((student as any).observacoesGerais || '').includes(term);

    return matchName || matchContactName || matchPhone || matchRoom || matchAllergies || matchCond || matchObs;
  });

  const handleSelectStudent = (studentId: string) => {
    onSwitchIdoso(studentId);
    setIsOpen(false);
    setSearchTerm('');
    if (onNavigate) {
      onNavigate('dashboard');
    }
  };

  const roomFilterOptions = isEscolar
    ? ['todas', 'Berçário I', 'Berçário II', 'Maternal I', 'Maternal II', 'Jardim I', 'Jardim II']
    : ['todas', 'Suíte 101', 'Suíte 102', 'Ala Solaria', 'Recanto Especial'];

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      
      {/* 🔍 SEARCH INPUT FIELD */}
      <div className="relative flex items-center">
        <Search className={`w-4 h-4 absolute left-3.5 pointer-events-none transition-colors ${
          compact
            ? 'text-white/70'
            : darkMode
              ? 'text-slate-400'
              : 'text-indigo-500'
        }`} />

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={
            isEscolar 
              ? "Busca rápida: digite nome da criança, sala ou responsável..." 
              : "Busca rápida: digite nome do idoso ou número do quarto..."
          }
          className={`w-full pl-10 pr-20 py-2.5 rounded-2xl text-xs font-bold transition-all focus:outline-none ${
            compact
              ? 'bg-white/15 text-white placeholder-white/70 border border-white/20 focus:bg-white/25 focus:ring-2 focus:ring-white/40 shadow-inner'
              : darkMode
                ? 'bg-slate-800 text-slate-100 placeholder-slate-400 border border-slate-700 focus:ring-2 focus:ring-emerald-500/30'
                : 'bg-white text-slate-900 placeholder-slate-400 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-xs'
          }`}
        />

        {/* Action icons right side inside input: Voice + Clear */}
        <div className="absolute right-2.5 flex items-center gap-1">
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setIsOpen(false);
              }}
              className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-slate-400 transition-all cursor-pointer"
              title="Limpar busca"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <VoiceInput
            onTranscript={(text) => {
              setSearchTerm(text);
              setIsOpen(true);
            }}
            size="sm"
          />
        </div>
      </div>

      {/* 📋 DROPDOWN RESULTS POPOVER */}
      {isOpen && (
        <div className={`absolute left-0 right-0 top-full mt-2 z-50 rounded-3xl border shadow-2xl overflow-hidden animate-fade-in ${
          darkMode
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}>
          
          {/* Header section in Dropdown */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{isEscolar ? 'Alunos Encontrados' : 'Assistidos Encontrados'} ({filteredStudents.length})</span>
            </span>

            {/* Room Filter Pills */}
            <div className="hidden sm:flex items-center gap-1 overflow-x-auto max-w-xs scrollbar-none">
              {roomFilterOptions.slice(0, 4).map(room => (
                <button
                  key={room}
                  type="button"
                  onClick={() => setSelectedRoomFilter(room)}
                  className={`px-2 py-0.5 rounded-lg text-[9.5px] font-bold transition-all ${
                    selectedRoomFilter === room
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-200/60 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300'
                  }`}
                >
                  {room === 'todas' ? 'Todas Salas' : room}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* List of matching students */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 p-1">
            {filteredStudents.length === 0 ? (
              <div className="p-6 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                  <Baby className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Nenhum {isEscolar ? 'aluno' : 'assistido'} localizado com "{searchTerm}"
                </p>
                <p className="text-[11px] text-slate-400">
                  Verifique a ortografia ou tente buscar por sala/turma.
                </p>
              </div>
            ) : (
              filteredStudents.map(student => {
                const isSelected = activeIdoso?.id === student.id;
                const cleanName = student.nome.split(' (')[0];
                const roomInfo = student.nome.includes('(') 
                  ? student.nome.substring(student.nome.indexOf('(') + 1, student.nome.indexOf(')'))
                  : 'Turma Geral';

                return (
                  <button
                    key={student.id}
                    type="button"
                    onClick={() => handleSelectStudent(student.id)}
                    className={`w-full p-2.5 rounded-2xl text-left flex items-center justify-between gap-3 transition-all cursor-pointer group ${
                      isSelected
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={student.foto || 'https://images.unsplash.com/photo-1519689680058-324335c77ebd?auto=format&fit=crop&q=80&w=150'}
                          alt={student.nome}
                          className="w-10 h-10 rounded-full object-cover border border-white dark:border-slate-700 shadow-xs"
                        />
                        {isSelected && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[8px] font-black border border-white">
                            ✓
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                            {cleanName}
                          </span>
                          {(student.alergias || (student as any).alergiasMedicas) && (
                            <span className="px-1.5 py-0.2 bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 rounded text-[9px] font-black flex items-center gap-0.5 shrink-0">
                              <ShieldAlert className="w-2.5 h-2.5" />
                              Alergias
                            </span>
                          )}
                        </div>

                        {student.contatoEmergencia?.nome && (
                          <div className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 block truncate leading-snug">
                            👨‍👩‍👧 Resp: {student.contatoEmergencia.nome} ({student.contatoEmergencia.parentesco || 'Mãe/Pai'})
                          </div>
                        )}

                        <div className="text-[10.5px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">{roomInfo}</span>
                          <span>•</span>
                          <span>{(student as any).idade || student.dataNascimento || 'Aluno'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isSelected ? (
                        <span className="px-2 py-1 bg-indigo-600 text-white rounded-xl text-[10px] font-black shadow-xs flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>Ativo</span>
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-indigo-600 group-hover:text-white rounded-xl text-[10px] font-bold transition-all flex items-center gap-0.5">
                          <span>Selecionar</span>
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer note in popover */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>💡 Clique para selecionar o aluno instantaneamente</span>
            <span className="font-mono text-[9px]">ESC para fechar</span>
          </div>

        </div>
      )}
    </div>
  );
};
