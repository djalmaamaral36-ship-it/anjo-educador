import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  GraduationCap, 
  Heart, 
  Clock, 
  Sparkles, 
  Sliders, 
  Building, 
  Plus, 
  X, 
  Check, 
  Edit, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  Calendar,
  MessageSquare,
  Activity,
  Trash2,
  BookOpen,
  Smartphone,
  Smile,
  Award,
  Search,
  FileText,
  PhoneCall,
  Send,
  Eye,
  Pencil,
  Filter,
  CheckSquare,
  UserPlus,
  Share2,
  Mic
} from 'lucide-react';
import { VoiceInput } from './VoiceInput';
import { getFromDB, saveToDB, SALAS_INICIAIS, isPinUnique, generateUniquePin } from '../data';
import { Idoso, Usuario, Classroom, isStaffUser } from '../types';

interface DirectorPanelProps {
  accessibilitySettings: {
    fontSize: 'normal' | 'grande' | 'gigante';
    darkMode: boolean;
  };
  appMode?: string;
}

export default function DirectorPanel({ accessibilitySettings, appMode }: DirectorPanelProps) {
  const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('anjo_simulacao_user_id') : null;
  const allUsers = getFromDB<Usuario[]>('anjo_usuarios', []);
  const activeUser = savedUserId ? allUsers.find(u => u.id === savedUserId) : null;

  const directorUser = allUsers.find(u => 
    u.tipo === 'diretor' || u.tipo === 'diretora' || u.nome.toLowerCase().includes('nilva') || u.nome.toLowerCase().includes('diret')
  );

  if (activeUser?.tipo === 'familiar') {
    const handleSwitchToDirector = (targetId?: string) => {
      const targetUser = (targetId ? allUsers.find(u => u.id === targetId) : directorUser) || allUsers.find(u => u.id === 'user_admin');
      if (targetUser) {
        localStorage.setItem('anjo_simulacao_user_id', targetUser.id);
        window.dispatchEvent(new CustomEvent('anjo_user_updated'));
      }
    };

    return (
      <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-3xl border border-red-100 shadow-sm space-y-5 my-4">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 border border-red-200">
          <span className="text-3xl"> </span>
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-black text-slate-800">Acesso Restrito ao Painel da Direcao</h2>
          <p className="text-xs font-bold text-rose-600">
            Perfil Selecionado noCelular: {activeUser.nome} ({activeUser.tipo === 'familiar' ? 'Familiar Responsavel' : activeUser.tipo})
          </p>
        </div>
        <p className="text-sm text-slate-500 max-w-md leading-relaxed">
          O celular esta atualmente com o perfil de <strong>Familiar</strong> selecionado. O Painel da Direcao e restrito a equipe diretiva da escola.
        </p>

        {directorUser && (
          <div className="pt-2 w-full max-w-xs space-y-3">
            <button
              type="button"
              onClick={() => handleSwitchToDirector(directorUser.id)}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold rounded-2xl text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span> </span>
              <span>Alternar para Perfil de {directorUser.nome} (Diretora)</span>
            </button>
            <p className="text-[10px] text-slate-400 font-medium">
              Ou selecione o perfil de Nilva Amaral no menu superior do aplicativo.
            </p>
          </div>
        )}
      </div>
    );
  }

  const isDark = accessibilitySettings.darkMode;

  // State managers
  const [seniors, setSeniors] = useState<Idoso[]>([]);
  const [users, setUsers] = useState<Usuario[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  
  // Co-branding inputs (moved here as the director manages school identity)
  const [instNameInput, setInstNameInput] = useState('');
  const [instLogoInput, setInstLogoInput] = useState('');
  const [instSloganInput, setInstSloganInput] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Classroom allocation states
  const [showClassroomModal, setShowClassroomModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassEmoji, setNewClassEmoji] = useState(' ');
  const [newClassAge, setNewClassAge] = useState('2-3 anos');
  const [newClassCapacity, setNewClassCapacity] = useState(15);
  const [newClassDesc, setNewClassDesc] = useState('');

  // Assign teacher state
  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [deletingClassroom, setDeletingClassroom] = useState<Classroom | null>(null);

  // Edit Teacher / Staff state
  const [editingTeacher, setEditingTeacher] = useState<Usuario | null>(null);
  const [editTeacherName, setEditTeacherName] = useState('');
  const [editTeacherRole, setEditTeacherRole] = useState<'professor' | 'coordenador' | 'pedagoga' | 'cuidador' | 'admin'>('professor');
  const [editTeacherPhone, setEditTeacherPhone] = useState('');
  const [editTeacherEmail, setEditTeacherEmail] = useState('');
  const [editTeacherPin, setEditTeacherPin] = useState('');
  const [editTeacherClassrooms, setEditTeacherClassrooms] = useState<string[]>([]);
  const [editTeacherObs, setEditTeacherObs] = useState('');

  // New Staff / Teacher modal states
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showInviteStaffModal, setShowInviteStaffModal] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'professor' | 'coordenador' | 'pedagoga' | 'cuidador' | 'admin'>('professor');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPin, setNewStaffPin] = useState('');
  const [newStaffClassrooms, setNewStaffClassrooms] = useState<string[]>([]);
  const [newStaffObs, setNewStaffObs] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Active tab inside Director panel
  const [activeTab, setActiveTab] = useState<'overview' | 'classes' | 'pedagogy' | 'teachers'>('overview');

  // New Evolving Trees pedagogy states
  const [pedagogyViewMode, setPedagogyViewMode] = useState<'trees' | 'charts'>('trees');
  const [chartsSubTab, setChartsSubTab] = useState<'care' | 'strategic'>('care');
  const [selectedClassroomForMetrics, setSelectedClassroomForMetrics] = useState<string>('Todas');
  const [showStrategicReferralModal, setShowStrategicReferralModal] = useState<boolean>(false);
  const [showStrategicConflictModal, setShowStrategicConflictModal] = useState<boolean>(false);
  const [showReferralsClassModal, setShowReferralsClassModal] = useState<Classroom | null>(null);
  const [pedagógicalReferrals, setPedagógicalReferrals] = useState<any[]>([]);
  const [newReferralForm, setNewReferralForm] = useState({
    studentName: '',
    tipo: 'pedagogico_geral',
    reason: '',
  });
  const [customStudentName, setCustomStudentName] = useState('');
  const [treeLevel, setTreeLevel] = useState<'individual' | 'class' | 'school'>('individual');
  const [selectedStudentForTree, setSelectedStudentForTree] = useState<string>('');
  const [selectedClassForBosque, setSelectedClassForBosque] = useState<string>('');
  const [isWateringAnimate, setIsWateringAnimate] = useState<boolean>(false);

  // Rastreamento 360o Individual Attention states
  const [rastreamentoFilter, setRastreamentoFilter] = useState<'todos' | 'alertas'>('todos');
  const [rastreamentoClassFilter, setRastreamentoClassFilter] = useState<string>('Todas');
  const [rastreamentoSearch, setRastreamentoSearch] = useState<string>('');
  const [selectedStudent360, setSelectedStudent360] = useState<Idoso | null>(null);
  const [directorNoteModalStudent, setDirectorNoteModalStudent] = useState<Idoso | null>(null);
  const [directorNoteText, setDirectorNoteText] = useState<string>('');
  const [noteNotifyTeacher, setNoteNotifyTeacher] = useState<boolean>(true);
  const [noteNotifyCoordination, setNoteNotifyCoordination] = useState<boolean>(true);
  const [noteNotifyFamilyMural, setNoteNotifyFamilyMural] = useState<boolean>(false);
  const [noteCallWhatsApp, setNoteCallWhatsApp] = useState<boolean>(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Initialize selection states
  useEffect(() => {
    const studentList = seniors.filter(s => s.id.startsWith('aluno_'));
    if (studentList.length > 0 && !selectedStudentForTree) {
      setSelectedStudentForTree(studentList[0].id);
    }
    if (classrooms.length > 0 && !selectedClassForBosque) {
      setSelectedClassForBosque(classrooms[0].name);
    }
  }, [seniors, classrooms]);

  // Load state on startup
  useEffect(() => {
    loadData();
    
    // Read branding from localStorage
    const mode = 'escolar_infantil';
    setInstNameInput(localStorage.getItem(`anjo_brand_name_${mode}`) || '');
    setInstLogoInput(localStorage.getItem(`anjo_brand_logo_${mode}`) || '');
    setInstSloganInput(localStorage.getItem(`anjo_brand_slogan_${mode}`) || '');
  }, []);

  const loadData = () => {
    const allSeniors = getFromDB<Idoso[]>('anjo_idosos', []);
    const allUsers = getFromDB<Usuario[]>('anjo_usuarios', []);
    const allSalas = getFromDB<Classroom[]>('anjo_salas', SALAS_INICIAIS);

    setSeniors(allSeniors);
    setUsers(allUsers);
    setClassrooms(allSalas);

    const savedReferrals = getFromDB<any[]>('anjo_encaminhamentos_pedagogicos', []);
    if (savedReferrals.length === 0) {
      const defaultReferrals = [
        {
          id: 'ref_1',
          classroomName: 'Maternal I',
          studentName: 'Arthur Silva',
          tipo: 'pedagogico_geral',
          reason: 'Dificuldade de socializacao em grupo e choro persistente na hora da despedida.',
          data: '2026-05-10',
          registeredBy: 'Profa Estela Pinto'
        },
        {
          id: 'ref_2',
          classroomName: 'Maternal II',
          studentName: 'Beatriz Souza',
          tipo: 'fonoaudiologia',
          reason: 'Atraso de fala expressiva identificado no diario pedagogico e conversado com a coordenacao.',
          data: '2026-05-12',
          registeredBy: 'Profa Estela Pinto'
        },
        {
          id: 'ref_3',
          classroomName: 'Maternal II',
          studentName: 'Guilherme Santos',
          tipo: 'terapia_ocupacional',
          reason: 'Hipersensibilidade tatil severa relatada no momento do banho e resistencia a texturas de massinha.',
          data: '2026-05-14',
          registeredBy: 'Profa Estela Pinto'
        },
        {
          id: 'ref_4',
          classroomName: 'Jardim II',
          studentName: 'EnzoCosta',
          tipo: 'psicologia',
          reason: 'Agitacao fisica intensa com episodios frequentes de morder brinquedos e disputar espaco com os colegas.',
          data: '2026-05-15',
          registeredBy: 'Profa Estela Pinto'
        },
        {
          id: 'ref_5',
          classroomName: 'Jardim II',
          studentName: 'Laura Lima',
          tipo: 'terapia_ocupacional',
          reason: 'Seletividade alimentar extrema com recusa total de solidos durante o almoco escolar.',
          data: '2026-05-18',
          registeredBy: 'Profa Estela Pinto'
        },
        {
          id: 'ref_6',
          classroomName: 'Jardim II',
          studentName: 'Miguel Oliveira',
          tipo: 'pedagogico_geral',
          reason: 'Comportamento desafiador recorrente e resistencia sistematica as regras de transicao de rotina.',
          data: '2026-05-20',
          registeredBy: 'Profa Estela Pinto'
        },
        {
          id: 'ref_7',
          classroomName: 'Jardim II',
          studentName: 'Ana Clara',
          tipo: 'fonoaudiologia',
          reason: 'Troca de fonemas (/r/ por /l/) persistente aos 5 anos de idade na fala espont',
          data: '2026-05-22',
          registeredBy: 'Profa Estela Pinto'
        },
        {
          id: 'ref_8',
          classroomName: 'Jardim II',
          studentName: 'Lucas Rocha',
          tipo: 'psicologia',
          reason: 'Isolamento social sistematico no recreio, preferindo ficar sozinho no canto do patio e evitando brincar.',
          data: '2026-05-25',
          registeredBy: 'Profa Estela Pinto'
        },
        {
          id: 'ref_9',
          classroomName: 'Jardim II',
          studentName: 'Sofia Mendes',
          tipo: 'pedagogico_geral',
          reason: 'Falta de atencao concentrada com perda frequente de materiais de uso pedagogico.',
          data: '2026-05-28',
          registeredBy: 'Profa Estela Pinto'
        }
      ];
      saveToDB('anjo_encaminhamentos_pedagogicos', defaultReferrals);
      setPedagógicalReferrals(defaultReferrals);
    } else {
      setPedagógicalReferrals(savedReferrals);
    }
  };

  // Branding actions
  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    const mode = 'escolar_infantil';
    localStorage.setItem(`anjo_brand_name_${mode}`, instNameInput);
    localStorage.setItem(`anjo_brand_logo_${mode}`, instLogoInput);
    localStorage.setItem(`anjo_brand_slogan_${mode}`, instSloganInput);
    
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    
    // Dispatch event to update App.tsx header instantly
    window.dispatchEvent(new CustomEvent('anjo_user_updated'));
  };

  const handleClearBranding = () => {
    const mode = 'escolar_infantil';
    localStorage.removeItem(`anjo_brand_name_${mode}`);
    localStorage.removeItem(`anjo_brand_logo_${mode}`);
    localStorage.removeItem(`anjo_brand_slogan_${mode}`);
    setInstNameInput('');
    setInstLogoInput('');
    setInstSloganInput('');
    
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
    window.dispatchEvent(new CustomEvent('anjo_user_updated'));
  };

  // Create new classroom
  const handleCreateClassroom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    const newSala: Classroom = {
      id: `sala_${Date.now()}`,
      name: newClassName.trim(),
      emoji: newClassEmoji,
      ageGroup: newClassAge,
      capacity: Number(newClassCapacity) || 15,
      description: newClassDesc.trim() || 'Sem descricao.'
    };

    const updatedSalas = [...classrooms, newSala];
    setClassrooms(updatedSalas);
    saveToDB('anjo_salas', updatedSalas);

    // Reset inputs
    setNewClassName('');
    setNewClassEmoji(' ');
    setNewClassAge('2-3 anos');
    setNewClassCapacity(15);
    setNewClassDesc('');
    setShowClassroomModal(false);
    
    // Trigger update
    window.dispatchEvent(new Event('anjo_user_updated'));
  };

  // Delete classroom and unbind from any linked teachers
  const handleDeleteClassroom = (roomName: string) => {
    const updated = classrooms.filter(c => c.name !== roomName);
    setClassrooms(updated);
    saveToDB('anjo_salas', updated);
    
    const updatedUsers = users.map(user => {
      if (user.tipo === 'cuidador' && user.salaAula) {
        const rooms = user.salaAula.split(',').filter(r => r !== roomName);
        return { ...user, salaAula: rooms.join(',') };
      }
      return user;
    });
    setUsers(updatedUsers);
    saveToDB('anjo_usuarios', updatedUsers);

    setDeletingClassroom(null);
    window.dispatchEvent(new Event('anjo_user_updated'));
  };

  // Assign teacher to classroom
  const handleOpenAssignTeacher = (room: Classroom) => {
    setEditingClassroom(room);
    // Find who currently teaches this class
    const teacher = users.find(u => 
      (u.tipo === 'cuidador' || u.tipo === 'professor' || u.tipo === 'professora' || u.tipo === 'educador' || u.tipo === 'educadora' || isStaffUser(u)) && 
      u.salaAula?.split(',').map(r => r.trim()).filter(Boolean).includes(room.name)
    );
    setSelectedTeacherId(teacher ? teacher.id : '');
  };

  // Open edit modal for an existing teacher / staff member
  const handleOpenEditTeacher = (teacher: Usuario) => {
    setEditingTeacher(teacher);
    setEditTeacherName(teacher.nome || '');
    setEditTeacherRole((teacher.tipo as any) || 'professor');
    setEditTeacherPhone(teacher.telefone || '');
    setEditTeacherEmail(teacher.email || '');
    setEditTeacherPin(teacher.pin || '');
    const rooms = teacher.salaAula ? teacher.salaAula.split(',').map(r => r.trim()).filter(Boolean) : [];
    setEditTeacherClassrooms(rooms);
    setEditTeacherObs(teacher.observacoes || '');
  };

  const handleToggleEditTeacherClassroom = (roomName: string) => {
    setEditTeacherClassrooms(prev => 
      prev.includes(roomName)
        ? prev.filter(r => r !== roomName)
        : [...prev, roomName]
    );
  };

  const handleSaveEditTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    if (!editTeacherName.trim()) return;

    const newPin = editTeacherPin.trim();
    if (newPin && newPin.length < 4) {
      alert('O PIN deve conter pelo menos 4 digitos numericos!');
      return;
    }

    if (newPin) {
      const pinCheck = isPinUnique(newPin, editingTeacher.id);
      if (!pinCheck.isUnique) {
        alert(`[!] O PIN "${newPin}" ja esta em uso na escola por ${pinCheck.conflictingUser?.nome || 'outro colaborador'}.\n\nPor favor, escolha um PIN diferente para evitar conflito de acesso.`);
        return;
      }
    }

    const updatedUsers = users.map(u => {
      if (u.id === editingTeacher.id) {
        return {
          ...u,
          nome: editTeacherName.trim(),
          tipo: editTeacherRole,
          telefone: editTeacherPhone.trim() || undefined,
          email: editTeacherEmail.trim() || u.email,
          pin: newPin || u.pin,
          salaAula: editTeacherClassrooms.length > 0 ? editTeacherClassrooms.join(',') : undefined,
          observacoes: editTeacherObs.trim() || u.observacoes
        };
      }
      return u;
    });

    setUsers(updatedUsers);
    saveToDB('anjo_usuarios', updatedUsers);
    setEditingTeacher(null);
    loadData();

    setActionSuccessMessage(`  Dados e turmas de "${editTeacherName}" atualizados com sucesso!`);
    setTimeout(() => setActionSuccessMessage(null), 4000);
    window.dispatchEvent(new Event('anjo_user_updated'));
    window.dispatchEvent(new CustomEvent('anjo_user_updated'));
  };

  const handleDeleteStaff = (teacherId: string, teacherName: string) => {
    if (!window.confirm(`Tem certeza de que deseja remover o(a) colaborador(a) "${teacherName}"?`)) {
      return;
    }
    const updatedUsers = users.filter(u => u.id !== teacherId);
    setUsers(updatedUsers);
    saveToDB('anjo_usuarios', updatedUsers);
    if (editingTeacher?.id === teacherId) {
      setEditingTeacher(null);
    }
    loadData();
    setActionSuccessMessage(`  Colaborador(a) "${teacherName}" removido(a) com sucesso.`);
    setTimeout(() => setActionSuccessMessage(null), 4000);
    window.dispatchEvent(new Event('anjo_user_updated'));
    window.dispatchEvent(new CustomEvent('anjo_user_updated'));
  };

  // Create new staff / teacher directly
  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim()) return;

    let finalPin = newStaffPin.trim();
    if (finalPin && finalPin.length < 4) {
      alert('O PIN deve conter pelo menos 4 digitos numericos!');
      return;
    }

    if (finalPin) {
      const pinCheck = isPinUnique(finalPin);
      if (!pinCheck.isUnique) {
        alert(`[!] O PIN "${finalPin}" ja esta em uso na escola por ${pinCheck.conflictingUser?.nome || 'outro colaborador'}.\n\nPor favor, escolha um PIN diferente.`);
        return;
      }
    } else {
      finalPin = generateUniquePin(undefined, newStaffPhone);
    }

    const defaultAvatars: Record<string, string> = {
      professor: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250",
      coordenador: "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&q=80&w=250",
      pedagoga: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250",
      cuidador: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250",
      admin: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250"
    };

    const newCollaborator: Usuario = {
      id: `colab_${Date.now()}`,
      nome: newStaffName.trim(),
      tipo: newStaffRole,
      telefone: newStaffPhone.trim() || undefined,
      email: newStaffEmail.trim() || `${newStaffName.toLowerCase().replace(/\s+/g, '.')}@escola.anjinho.app`,
      pin: finalPin,
      foto: defaultAvatars[newStaffRole] || defaultAvatars.professor,
      salaAula: newStaffClassrooms.length > 0 ? newStaffClassrooms.join(',') : undefined,
      observacoes: newStaffObs.trim() || `${newStaffRole === 'coordenador' ? 'Coordenacao Pedagógica' : newStaffRole === 'pedagoga' ? 'Equipe Pedagógica' : newStaffRole === 'admin' ? 'Administracao Escolar' : 'Corpo Docente'} credenciado.`
    };

    const updatedUsers = [...users, newCollaborator];
    setUsers(updatedUsers);
    saveToDB('anjo_usuarios', updatedUsers);

    // Reset and close
    setNewStaffName('');
    setNewStaffRole('professor');
    setNewStaffPhone('');
    setNewStaffEmail('');
    setNewStaffPin('');
    setNewStaffClassrooms([]);
    setNewStaffObs('');
    setShowStaffModal(false);

    setActionSuccessMessage(`  Colaborador(a) ${newCollaborator.nome} cadastrado(a) com sucesso! PIN: ${finalPin}`);
    setTimeout(() => setActionSuccessMessage(null), 4000);
    window.dispatchEvent(new Event('anjo_user_updated'));
    window.dispatchEvent(new CustomEvent('anjo_user_updated'));
  };

  const handleToggleStaffClassroom = (roomName: string) => {
    setNewStaffClassrooms(prev => 
      prev.includes(roomName) 
        ? prev.filter(r => r !== roomName) 
        : [...prev, roomName]
    );
  };

  const handleSaveTeacherAssignment = () => {
    if (!editingClassroom) return;

    const roomName = editingClassroom.name;
    const selectedTeacher = users.find(u => u.id === selectedTeacherId);

    const updatedUsers = users.map(user => {
      const isStaff = user.tipo === 'cuidador' || user.tipo === 'professor' || user.tipo === 'professora' || user.tipo === 'educador' || user.tipo === 'educadora' || isStaffUser(user);
      const userRooms = user.salaAula ? user.salaAula.split(',').map(r => r.trim()).filter(Boolean) : [];

      // 1. If we selected this teacher, append/set this classroom to their list
      if (user.id === selectedTeacherId) {
        if (!userRooms.includes(roomName)) {
          userRooms.push(roomName);
        }
        return { ...user, salaAula: userRooms.join(',') };
      }

      // 2. If they were previously assigned to this classroom, remove it (unless they are the newly selected one)
      if (isStaff && userRooms.includes(roomName) && user.id !== selectedTeacherId) {
        const filteredRooms = userRooms.filter(r => r !== roomName);
        return { ...user, salaAula: filteredRooms.length > 0 ? filteredRooms.join(',') : undefined };
      }

      return user;
    });

    setUsers(updatedUsers);
    saveToDB('anjo_usuarios', updatedUsers);
    
    if (selectedTeacher) {
      setActionSuccessMessage(`  Professor(a) ${selectedTeacher.nome.split(' (')[0]} vinculado(a) a turma "${roomName}" com sucesso!`);
    } else {
      setActionSuccessMessage(`  Vinculo de professor da turma "${roomName}" desfeito.`);
    }
    setTimeout(() => setActionSuccessMessage(null), 4000);

    setEditingClassroom(null);
    loadData();
    
    // Dispatch update
    window.dispatchEvent(new Event('anjo_user_updated'));
    window.dispatchEvent(new CustomEvent('anjo_user_updated'));
    window.dispatchEvent(new CustomEvent('anjo_usuarios_updated'));
  };

  // Filter students (with "aluno_" prefix)
  const students = seniors.filter(s => s.id.startsWith('aluno_'));
  const teachers = users.filter(u => u.tipo === 'cuidador' || u.tipo === 'professor' || u.tipo === 'educador' || isStaffUser(u));

  // Compute school engagement metrics (purely affectionate and parent-school alignment)
  const allEventsInDb = getFromDB<any[]>('anjo_jornada_events', []);
  const allReactionsInDb = getFromDB<Record<string, { likes?: number; gestosAfeto?: Record<string, number> }>>('anjo_jornada_reactions', {});
  const reactionsTotal = Object.values(allReactionsInDb).reduce((acc, curr) => {
    if (curr.likes !== undefined) return acc + curr.likes;
    if (curr.gestosAfeto) return acc + Object.values(curr.gestosAfeto).reduce((a, b) => a + (b || 0), 0);
    return acc;
  }, 0);
  const eventsLikesTotal = allEventsInDb.reduce((acc, curr) => {
    // If the event already has an entry in reactionsMap, avoid double counting
    if (allReactionsInDb[curr.id]) return acc;
    return acc + (curr.likes || 0);
  }, 0);
  const globalLikes = reactionsTotal + eventsLikesTotal;
  
  // Hydrations of love (watering count per student)
  const globalWaterings = seniors.reduce((acc, s) => {
    return acc + parseInt(localStorage.getItem(`anjo_regar_count_${s.id}`) || '0', 10);
  }, 0);

  // Active alerts (health/behavior issues)
  const studentsWithAlerts = seniors.filter(s => {
    if (!s.id.startsWith('aluno_')) return false;
    // Check if they have food alert or high temperature or pending medical warnings
    const foodAverage = parseInt(localStorage.getItem(`anjo_almoco_pct_${s.id}`) || '100', 10);
    const tempAverage = parseFloat(localStorage.getItem(`anjo_temp_deg_${s.id}`) || '36.5');
    const sleepAverage = parseFloat(localStorage.getItem(`anjo_sleep_hr_${s.id}`) || '2.2');
    return (foodAverage > 0 && foodAverage < 50) || tempAverage > 37.8;
  });

  // Calculate stats for classroom occupancy
  const getStudentsInClassroom = (className: string) => {
    return seniors.filter(s => {
      if (!s.id.startsWith('aluno_')) return false;
      const sRoom = (s.salaAula || s.quarto || (s as any).sala || '').trim();
      if (sRoom) {
        if (sRoom === className) return true;
        if (sRoom.split(',').map(r => r.trim()).includes(className)) return true;
        return false;
      }
      return s.nome.includes(`(${className}`) || s.nome.includes(`- ${className} -`) || s.nome.includes(className);
    });
  };

  return (
    <div className={`space-y-6 animate-fade-in ${isDark ? 'text-slate-100' : 'text-slate-800'}`} id="school-director-panel">
      
      
      <div className={`p-6 sm:p-8 rounded-3xl border transition-all relative overflow-hidden ${
        isDark ? 'bg-slate-900 border-slate-800 shadow-black/40' : 'bg-gradient-to-br from-indigo-50/50 via-white to-white border-slate-200'
      } shadow-md`}>
        
        <div className="absolute -right-24 -top-24 w-72 h-72 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none"></div>
        <div className="absolute -left-12 -bottom-12 w-60 h-60 rounded-full bg-amber-500/5 blur-3xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5 text-left">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 rounded-2xl">
                <Shield className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
                Direcao Geral & Gestao Pedagógica
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight leading-none text-slate-900 dark:text-white">
              Painel da Direcao Escolar
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-xl">
              Portal exclusivo para controle de desempenho das turmas, capacitacao de educadores, monitoramento de rotina e customizacao visual da marca da escola.
            </p>
          </div>

          <div className="flex items-center gap-1.5 self-stretch sm:self-auto">
            <span className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500">Filtrando:</span>
            <div className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-bold rounded-xl text-xs flex items-center gap-1">
              <span>  </span>
              <span>Anjinho Escolar</span>
            </div>
          </div>
        </div>

        
        <div className="flex flex-wrap gap-1 border-b border-slate-100 dark:border-slate-800 pt-6 mt-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 text-xs font-black transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-200'
            }`}
          >
            <span> </span> Visao Geral Escolar
          </button>
          <button
            onClick={() => setActiveTab('classes')}
            className={`px-4 py-2.5 text-xs font-black transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'classes'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-200'
            }`}
          >
            <span> </span> Grade de Turmas ({classrooms.length})
          </button>
          <button
            onClick={() => setActiveTab('pedagogy')}
            className={`px-4 py-2.5 text-xs font-black transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'pedagogy'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-200'
            }`}
          >
            <span> </span> Desempenho & Saude Geral
          </button>
          <button
            onClick={() => setActiveTab('teachers')}
            className={`px-4 py-2.5 text-xs font-black transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'teachers'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-200'
            }`}
          >
            <span>   </span> Corpo Docente ({teachers.length})
          </button>
        </div>
      </div>

      
      {activeTab === 'overview' && (
        <div className="space-y-6">
          
          
          <div className={`p-6 rounded-3xl border text-left space-y-5 ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white border-indigo-950'
          } shadow-xl relative overflow-hidden`} id="visao-360-escola">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-indigo-800/40 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-black uppercase tracking-wider">
                    Monitoramento em Tempo Real
                  </span>
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <span> </span> Visao 360o da Escola
                </h2>
                <p className="text-xs text-indigo-200/80 font-medium">
                  Indicadores unificados de gestao operacional, pedagógica, saude e engajamento da comunidade escolar.
                </p>
              </div>

              <div className="flex items-center gap-2 bg-indigo-950/60 p-2 rounded-2xl border border-indigo-800/50 text-[11px] font-bold text-indigo-200">
                <span>  Diretora:</span>
                <span className="text-white font-extrabold">{directorUser?.nome || 'Nilva Amaral'}</span>
              </div>
            </div>

            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              
              
              <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:border-indigo-400/30 transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black tracking-wider text-indigo-300 uppercase flex items-center gap-1.5">
                    <span>  </span> OPERACAO
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">Em conformidade</span>
                </div>
                <div>
                  <div className="text-2xl font-black text-white flex items-baseline gap-1">
                    94% <span className="text-[11px] text-indigo-200/70 font-semibold">Compliance Rate</span>
                  </div>
                  <div className="w-full bg-white/10 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div className="bg-emerald-400 h-full rounded-full" style={{ width: '94%' }}></div>
                  </div>
                </div>
                <p className="text-[10px] text-indigo-200/70 font-medium">Audit de rotinas e seguranca LGPD/normativas</p>
              </div>

              
              <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:border-indigo-400/30 transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black tracking-wider text-sky-300 uppercase flex items-center gap-1.5">
                    <span> </span> CUIDADO
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[9px] font-bold">Excelente</span>
                </div>
                <div>
                  <div className="text-2xl font-black text-white flex items-baseline gap-1">
                    96% <span className="text-[11px] text-sky-200/70 font-semibold">das rotinas registradas</span>
                  </div>
                  <div className="w-full bg-white/10 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div className="bg-sky-400 h-full rounded-full" style={{ width: '96%' }}></div>
                  </div>
                </div>
                <p className="text-[10px] text-indigo-200/70 font-medium">Sono, alimentacao, fralda e hidratacao do dia</p>
              </div>

              
              <div 
                onClick={() => setShowStrategicConflictModal(true)}
                className="p-4 rounded-2xl bg-rose-500/10 backdrop-blur-md border border-rose-500/30 hover:border-rose-400 transition-all space-y-2 cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black tracking-wider text-rose-300 uppercase flex items-center gap-1.5">
                    <span> </span> ATENCAO
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-rose-500/30 text-rose-200 text-[9px] font-bold group-hover:bg-rose-500 group-hover:text-white transition-colors">
                    Acao Imediata  
                  </span>
                </div>
                <div>
                  <div className="text-2xl font-black text-rose-200 flex items-baseline gap-1">
                    1 <span className="text-[11px] text-rose-200/80 font-semibold">ocorrencia prioritaria</span>
                  </div>
                  <p className="text-[10px] text-rose-200/70 font-medium mt-1.5">
                    Acompanhamento de febre/recusa alimentar em analise
                  </p>
                </div>
              </div>

              
              <div 
                onClick={() => setActiveTab('classes')}
                className="p-4 rounded-2xl bg-amber-500/10 backdrop-blur-md border border-amber-500/30 hover:border-amber-400 transition-all space-y-2 cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black tracking-wider text-amber-300 uppercase flex items-center gap-1.5">
                    <span> </span> TURMAS
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                    Ver Salas  
                  </span>
                </div>
                <div>
                  <div className="text-2xl font-black text-amber-200 flex items-baseline gap-1">
                    2 <span className="text-[11px] text-amber-200/80 font-semibold">turmas sob observacao</span>
                  </div>
                  <p className="text-[10px] text-amber-200/70 font-medium mt-1.5">
                    Maternal I e Jardim II com variacao de intercorrências
                  </p>
                </div>
              </div>

              
              <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:border-indigo-400/30 transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black tracking-wider text-emerald-300 uppercase flex items-center gap-1.5">
                    <span>   </span> EQUIPE
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">Engajada</span>
                </div>
                <div>
                  <div className="text-2xl font-black text-white flex items-baseline gap-1">
                    93% <span className="text-[11px] text-indigo-200/70 font-semibold">de adesao aos registros</span>
                  </div>
                  <div className="w-full bg-white/10 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div className="bg-emerald-400 h-full rounded-full" style={{ width: '93%' }}></div>
                  </div>
                </div>
                <p className="text-[10px] text-indigo-200/70 font-medium">Professores e cuidadores preenchendo diarios via PIN</p>
              </div>

              
              <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:border-indigo-400/30 transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black tracking-wider text-rose-300 uppercase flex items-center gap-1.5">
                    <span>   </span> FAMILIAS
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[9px] font-bold">Ativas</span>
                </div>
                <div>
                  <div className="text-2xl font-black text-white flex items-baseline gap-1">
                    91% <span className="text-[11px] text-indigo-200/70 font-semibold">de visualizacao</span>
                  </div>
                  <div className="w-full bg-white/10 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div className="bg-rose-400 h-full rounded-full" style={{ width: '91%' }}></div>
                  </div>
                </div>
                <p className="text-[10px] text-indigo-200/70 font-medium">Visualizacao de recados, fotos e autorizacoes no app</p>
              </div>

              
              <div 
                onClick={() => setActiveTab('pedagogy')}
                className="p-4 rounded-2xl bg-indigo-500/20 backdrop-blur-md border border-indigo-400/30 hover:border-indigo-300 transition-all space-y-2 cursor-pointer group sm:col-span-2 lg:col-span-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black tracking-wider text-indigo-300 uppercase flex items-center gap-1.5">
                    <span> </span> PEDAGOGICO
                  </span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500 text-white text-[9px] font-extrabold group-hover:bg-indigo-400 transition-colors">
                    Ver Acompanhamento Pedagogico  
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <div className="text-2xl font-black text-white flex items-baseline gap-1">
                      3 <span className="text-[11px] text-indigo-200/80 font-semibold">criancas com evolucao que merece acompanhamento</span>
                    </div>
                    <p className="text-[10px] text-indigo-200/70 font-medium mt-1">
                      Encaminhamentos ativos para fonoaudiologia, psicologia e desenvolvimento cognitivo
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="director-kpis">
            
            <div className={`p-5 rounded-2xl border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            } shadow-2xs space-y-2 text-left`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total de Alunos</span>
                <span className="p-1.5 bg-sky-50 dark:bg-sky-950/40 text-sky-600 rounded-lg"> </span>
              </div>
              <div className="text-3xl font-black text-slate-950 dark:text-white flex items-baseline gap-1">
                {students.length} <span className="text-xs text-slate-400 font-bold">matriculados</span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold leading-none flex items-center gap-1">
                <span> </span> Distribuicao em {classrooms.length} turmas ativas
              </p>
            </div>

            <div className={`p-5 rounded-2xl border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            } shadow-2xs space-y-2 text-left`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Educadores Titulares</span>
                <span className="p-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-lg">   </span>
              </div>
              <div className="text-3xl font-black text-slate-950 dark:text-white flex items-baseline gap-1">
                {teachers.length} <span className="text-xs text-slate-400 font-bold">professores</span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold leading-none flex items-center gap-1">
                <span> </span> Alocacao com seguranca por PIN individual
              </p>
            </div>

            <div className={`p-5 rounded-2xl border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            } shadow-2xs space-y-2 text-left`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-500">Parceria com Familias</span>
                <span className="p-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-lg"> </span>
              </div>
              <div className="text-3xl font-black text-rose-600 flex items-baseline gap-1.5">
                {globalLikes} <span className="text-xs text-slate-400 font-bold">gestos de afeto</span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold leading-none flex items-center gap-1">
                <span> </span> {globalWaterings} regadas de afeto enviadas do app
              </p>
            </div>

            <div className={`p-5 rounded-2xl border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            } shadow-2xs space-y-2 text-left`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600">Alertas de Saude</span>
                <span className="p-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-lg">[!]</span>
              </div>
              <div className="text-3xl font-black text-amber-600 flex items-baseline gap-1">
                {studentsWithAlerts.length} <span className="text-xs text-slate-400 font-bold">casos em atencao</span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold leading-none">
                {studentsWithAlerts.length > 0 ? '[!] Baixa alimentacao ou febre detectada.' : '[OK] Rotinas saudaveis estaveis.'}
              </p>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            
            <div className={`lg:col-span-7 p-6 rounded-3xl border text-left space-y-5 ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            } shadow-xs`}>
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500">Identidade Institucional</span>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span> </span> Identidade e Logomarca da Escola
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Personalize o aplicativo com o nome da sua escola e a URL do seu logo. Ele sera exibido de forma harmonica no topo de todas as telas.
                </p>
              </div>

              <form onSubmit={handleSaveBranding} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Nome da Escola</label>
                    <input
                      type="text"
                      value={instNameInput}
                      onChange={(e) => setInstNameInput(e.target.value)}
                      placeholder="Ex: Colegio Mater Dei / Escola Arco-Iris"
                      className={`w-full px-3 py-2.5 text-xs rounded-xl border focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-semibold ${
                        isDark ? 'bg-slate-850 border-slate-750 text-white' : 'bg-white border-slate-205 text-slate-800'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">URL da Imagem do Logo (PNG/JPG)</label>
                    <input
                      type="text"
                      value={instLogoInput}
                      onChange={(e) => setInstLogoInput(e.target.value)}
                      placeholder="https://exemplo.com/logo-escola.png"
                      className={`w-full px-3 py-2.5 text-xs rounded-xl border focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-semibold ${
                        isDark ? 'bg-slate-850 border-slate-750 text-white' : 'bg-white border-slate-205 text-slate-800'
                      }`}
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Frase do Banner / Slogan Oficial</label>
                    <input
                      type="text"
                      value={instSloganInput}
                      onChange={(e) => setInstSloganInput(e.target.value)}
                      placeholder="Ex: Onde a inf e registrada para sempre"
                      className={`w-full px-3 py-2.5 text-xs rounded-xl border focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-semibold ${
                        isDark ? 'bg-slate-850 border-slate-750 text-white' : 'bg-white border-slate-205 text-slate-800'
                      }`}
                    />
                  </div>

                </div>

                <div className="flex flex-wrap gap-2 items-center pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl transition-all cursor-pointer shadow-3xs"
                  >
                      Salvar Identidade da Escola
                  </button>
                  
                  {instNameInput && (
                    <button
                      type="button"
                      onClick={handleClearBranding}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
                    >
                        Limpar Marca
                    </button>
                  )}

                  {saveSuccess && (
                    <span className="text-xs text-emerald-600 font-extrabold flex items-center gap-1 animate-pulse">
                        Configuracoes salvas e aplicadas!
                    </span>
                  )}
                </div>
              </form>

              
              <div className="border-t border-slate-100 dark:border-slate-850 pt-3.5 space-y-1.5">
                <span className="text-[9px] font-black text-slate-400 uppercase">Modelos de Marca Escolares:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setInstNameInput('Colegio Infantil Doce Saber');
                      setInstLogoInput('https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=150');
                    }}
                    className={`px-2.5 py-1 text-[10px] font-bold border rounded-lg cursor-pointer transition-colors ${
                      isDark ? 'bg-slate-850 border-slate-750 text-slate-300 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                      Doce Saber (Colorido)
                  </button>
                  <button
                    onClick={() => {
                      setInstNameInput('Colegio Montessori');
                      setInstLogoInput('https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=150');
                    }}
                    className={`px-2.5 py-1 text-[10px] font-bold border rounded-lg cursor-pointer transition-colors ${
                      isDark ? 'bg-slate-850 border-slate-750 text-slate-300 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                      Montessori (Tradicional)
                  </button>
                </div>
              </div>

            </div>

            
            <div className={`lg:col-span-5 p-6 rounded-3xl border text-left flex flex-col ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            } shadow-xs`}>
              <div className="space-y-1 border-b border-slate-100 dark:border-slate-850 pb-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-500">Familia Ativa</span>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span> </span> Linha de Afeto (Reacoes dos Pais)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-tight">
                  Log em tempo real de curtidas, regadas e interacoes que os pais enviaram aos diarios da escola.
                </p>
              </div>

              <div className="flex-1 overflow-y-auto max-h-64 mt-4 space-y-3.5 pr-1">
                {allEventsInDb.filter(e => e.likes > 0).length === 0 ? (
                  <div className="text-center py-8 text-slate-400 font-bold text-xs space-y-1">
                    <span> </span>
                    <p>Aguardando primeiras interacoes dos pais nos diarios escolares dos bebes.</p>
                  </div>
                ) : (
                  allEventsInDb.filter(e => e.likes > 0 || e.idosoId).slice(0, 10).map((evt, idx) => {
                    const idosoRef = seniors.find(s => s.id === evt.idosoId);
                    const studentName = idosoRef ? idosoRef.nome.split(' (')[0] : 'Aluno';
                    return (
                      <div key={idx} className="flex gap-2.5 text-[11px] leading-tight pb-3 border-b border-slate-50 dark:border-slate-850 last:border-0">
                        <div className="p-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-lg shrink-0 h-fit self-center">
                          <span> </span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-slate-700 dark:text-slate-300">
                            Familiar amou o momento <strong>"{evt.titulo || 'Atividade'}"</strong> registrado para o aluno(a) <strong className="text-indigo-600 dark:text-indigo-400">{studentName}</strong>.
                          </p>
                          <span className="text-[9px] text-slate-400 font-bold block">{evt.horario || 'Agora mesmo'}   {evt.registradoPor || 'Familia'}</span>
                        </div>
                      </div>
                    );
                  })
                )}
                
                <div className="flex gap-2.5 text-[11px] leading-tight pb-3 border-b border-slate-50 dark:border-slate-850 last:border-0">
                  <div className="p-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-lg shrink-0 h-fit self-center">
                    <span> </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-700 dark:text-slate-300">
                      Mae de <strong>Mariana Souza</strong> enviou uma <strong>Regada de Amor</strong> para parabenizar a dedicacao dos professores hoje!
                    </p>
                    <span className="text-[9px] text-slate-400 font-bold block">15 min atras   App do Familiar</span>
                  </div>
                </div>
                <div className="flex gap-2.5 text-[11px] leading-tight pb-3">
                  <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-lg shrink-0 h-fit self-center">
                    <span> </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-700 dark:text-slate-300">
                      Pai de <strong>Miguel Oliveira</strong> assinou eletronicamente o diario e confirmou envio de medicacao diaria.
                    </p>
                    <span className="text-[9px] text-slate-400 font-bold block">1 hora atras   AutorizacaoConfirmada</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      
      {activeTab === 'classes' && (
        <div className="space-y-6 text-left">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <span> </span> Lista de Salas & Taxa de Ocupacao
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                Gerencie as capacidades de cada turma do maternal e bercario, veja as criancas ativas e faca a alocacao do educador titular.
              </p>
            </div>

            <button
              onClick={() => setShowClassroomModal(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl cursor-pointer flex items-center gap-1 shadow-3xs"
            >
              <Plus className="w-4 h-4" /> Criar Nova Turma
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classrooms.map(room => {
              const classStudents = getStudentsInClassroom(room.name);
              const occupancyPct = Math.round((classStudents.length / room.capacity) * 100) || 0;
              
              // Find assigned teacher strictly for this classroom
              const assignedTeacher = users.find(t => 
                (t.tipo === 'cuidador' || t.tipo === 'professor' || t.tipo === 'professora' || t.tipo === 'educador' || t.tipo === 'educadora' || isStaffUser(t)) && 
                t.salaAula?.split(',').map(r => r.trim()).filter(Boolean).includes(room.name)
              );

              return (
                <div key={room.id} className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-205'
                } shadow-3xs hover:shadow-xs transition-shadow`}>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xl p-2 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl">{room.emoji}</span>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black rounded-full uppercase">
                          {room.ageGroup}
                        </span>
                        <button
                          onClick={() => setDeletingClassroom(room)}
                          className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-500 hover:text-rose-600 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="Excluir Turma"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-black text-sm text-slate-900 dark:text-white leading-tight">
                        {room.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed line-clamp-2">
                        {room.description}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3.5 pt-2 border-t border-slate-100/10">
                    
                    
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                        <span>Lotacao: {classStudents.length} / {room.capacity}</span>
                        <span className={`${occupancyPct > 90 ? 'text-rose-500' : 'text-indigo-600 dark:text-indigo-400'}`}>{occupancyPct}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            occupancyPct > 90 ? 'bg-rose-500' : 'bg-indigo-600 dark:bg-indigo-400'
                          }`}
                          style={{ width: `${Math.min(occupancyPct, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    
                    <div className={`p-2.5 rounded-xl flex items-center justify-between gap-2 text-xs ${
                      isDark ? 'bg-slate-850 text-slate-300' : 'bg-slate-50 text-slate-700'
                    }`}>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-base shrink-0">   </span>
                        <div className="min-w-0 leading-tight">
                          <span className="text-[9px] block text-slate-400 font-bold uppercase">Professor(a) Responsavel</span>
                          <span className="font-extrabold text-slate-800 dark:text-slate-200 truncate block">
                            {assignedTeacher ? assignedTeacher.nome.split(' (')[0] : 'Nenhum Alocado'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenAssignTeacher(room)}
                        className="p-1 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 text-indigo-600 rounded-lg transition-colors cursor-pointer shrink-0"
                        title="Vincular Professor"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

      
      {activeTab === 'pedagogy' && (
        <div className="space-y-6 text-left">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <span> </span> Monitor de Desempenho e Rotinas Coletivas
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                Analise pedagógica da rotina escolar, saude e engajamento das familias por meio de metaforas da natureza ou relatorios convencionais.
              </p>
            </div>

            
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0 self-start sm:self-center border border-slate-200/50 dark:border-slate-700/50 shadow-3xs">
              <button
                onClick={() => setPedagogyViewMode('trees')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black cursor-pointer transition-all flex items-center gap-1 ${
                  pedagogyViewMode === 'trees'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-3xs'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                  Árvores em Evolucao
              </button>
              <button
                onClick={() => setPedagogyViewMode('charts')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black cursor-pointer transition-all flex items-center gap-1 ${
                  pedagogyViewMode === 'charts'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-3xs'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                  Graficos Convencionais
              </button>
            </div>
          </div>

          
          
          
          {pedagogyViewMode === 'trees' ? (
            <div className="space-y-6">
              
              
              <div className="flex flex-wrap gap-1.5 border-b border-slate-100 dark:border-slate-850 pb-3">
                <button
                  onClick={() => setTreeLevel('individual')}
                  className={`px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                    treeLevel === 'individual'
                      ? 'bg-indigo-550 text-white bg-indigo-600 shadow-3xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  <span> </span> Árvore Individual (Aluno)
                </button>
                <button
                  onClick={() => setTreeLevel('class')}
                  className={`px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                    treeLevel === 'class'
                      ? 'bg-indigo-550 text-white bg-indigo-600 shadow-3xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  <span> </span> Bosque da Classe (Turma)
                </button>
                <button
                  onClick={() => setTreeLevel('school')}
                  className={`px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                    treeLevel === 'school'
                      ? 'bg-indigo-550 text-white bg-indigo-600 shadow-3xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  <span> </span> Floresta Escolar (Geral)
                </button>
              </div>

              
              {treeLevel === 'individual' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  
                  
                  <div className={`lg:col-span-5 p-6 rounded-3xl border flex flex-col items-center justify-between text-center relative overflow-hidden ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-gradient-to-b from-sky-50/30 via-white to-white border-slate-200'
                  } shadow-xs`}>
                    
                    <div className="w-full flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3 mb-4">
                      <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wide">Plantacao Pedagógica</span>
                      <span className="text-[10px] font-bold text-slate-400">Tempo Real</span>
                    </div>

                    
                    <div className="w-full space-y-1 mb-4 text-left">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide block">Selecione o Aluno para Ver Sua Árvore</label>
                      <select
                        value={selectedStudentForTree}
                        onChange={(e) => setSelectedStudentForTree(e.target.value)}
                        className={`w-full px-3 py-2 text-xs rounded-xl border focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-semibold ${
                          isDark ? 'bg-slate-850 border-slate-750 text-white' : 'bg-white border-slate-205 text-slate-800'
                        }`}
                      >
                        {students.map(s => (
                          <option key={s.id} value={s.id}>{s.nome}</option>
                        ))}
                      </select>
                    </div>

                    
                    {(() => {
                      const selectedStudent = students.find(s => s.id === selectedStudentForTree);
                      if (!selectedStudent) {
                        return (
                          <div className="py-12 text-slate-400 text-xs font-bold">
                            Nenhum aluno selecionado.
                          </div>
                        );
                      }

                      // Let's get student metrics
                      const foodVal = parseInt(localStorage.getItem(`anjo_almoco_pct_${selectedStudent.id}`) || '90', 10);
                      const tempVal = parseFloat(localStorage.getItem(`anjo_temp_deg_${selectedStudent.id}`) || '36.5');
                      const sleepVal = parseFloat(localStorage.getItem(`anjo_sleep_hr_${selectedStudent.id}`) || '2.0');
                      
                      // Calculate compliance rate (representing tree health)
                      const compliance = Math.min(100, Math.max(10, Math.round((foodVal + (sleepVal / 3 * 100)) / 2)));
                      const regarCount = parseInt(localStorage.getItem(`anjo_regar_count_${selectedStudent.id}`) || '0', 10);
                      const hasAlert = tempVal > 37.8 || foodVal < 50;

                      // Color palette for leaves
                      let leafColor = '#22c55e'; // healthy green
                      if (hasAlert) {
                        leafColor = '#f59e0b'; // warning yellow/orange
                      } else if (compliance > 85) {
                        leafColor = '#15803d'; // dark vibrant green
                      } else if (compliance < 40) {
                        leafColor = '#84cc16'; // light lime green
                      }

                      // Trunk height and thickness
                      const heightMultiplier = compliance / 100; // 0.1 to 1.0
                      const trunkHeight = 50 + 70 * heightMultiplier;
                      const trunkThickness = 8 + 14 * heightMultiplier;
                      
                      const fruitCount = Math.min(12, regarCount);
                      const fruitCoords = [
                        { cx: 170, cy: 110 }, { cx: 230, cy: 110 }, { cx: 200, cy: 80 },
                        { cx: 185, cy: 130 }, { cx: 215, cy: 130 }, { cx: 160, cy: 145 },
                        { cx: 240, cy: 145 }, { cx: 200, cy: 155 }, { cx: 175, cy: 95 },
                        { cx: 225, cy: 95 }, { cx: 190, cy: 140 }, { cx: 210, cy: 140 }
                      ];

                      return (
                        <div className="w-full flex flex-col items-center">
                          <svg viewBox="0 0 400 300" className="w-full max-w-[320px] h-auto drop-shadow-md select-none overflow-visible">
                            <circle cx="200" cy="150" r="130" fill="url(#skyGlow)" opacity="0.15" />
                            
                            <defs>
                              <radialGradient id="skyGlow" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor="#6366f1" />
                                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                              </radialGradient>
                              <linearGradient id="trunkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#78350f" />
                                <stop offset="50%" stopColor="#92400e" />
                                <stop offset="100%" stopColor="#78350f" />
                              </linearGradient>
                              <linearGradient id="leafGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor={leafColor} />
                                <stop offset="100%" stopColor={hasAlert ? '#d97706' : '#16a34a'} />
                              </linearGradient>
                              <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
                                <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.1" />
                              </filter>
                            </defs>

                            
                            {isWateringAnimate && (
                              <g>
                                <circle cx="180" cy="50" r="4" fill="#38bdf8" className="animate-bounce" />
                                <circle cx="200" cy="30" r="4.5" fill="#38bdf8" className="animate-bounce" style={{ animationDelay: '0.2s' }} />
                                <circle cx="220" cy="60" r="3.5" fill="#38bdf8" className="animate-bounce" style={{ animationDelay: '0.4s' }} />
                                <circle cx="160" cy="40" r="4" fill="#38bdf8" className="animate-bounce" style={{ animationDelay: '0.1s' }} />
                                <circle cx="240" cy="45" r="4" fill="#38bdf8" className="animate-bounce" style={{ animationDelay: '0.3s' }} />
                              </g>
                            )}

                            
                            <path d="M 50 250 Q 200 230 350 250 L 350 280 L 50 280 Z" fill="#4ade80" opacity="0.9" />
                            <path d="M 80 251 Q 200 240 320 251" stroke="#22c55e" strokeWidth="3" fill="none" />
                            
                            
                            {compliance <= 20 ? (
                              <g filter="url(#shadow)">
                                <path d="M 200 245 Q 195 210 205 190" stroke="#4ade80" strokeWidth="6" strokeLinecap="round" fill="none" />
                                <path d="M 205 190 Q 220 180 225 195 Q 210 200 205 190 Z" fill="#22c55e" />
                                <path d="M 201 205 Q 180 200 175 212 Q 192 215 201 205 Z" fill="#22c55e" />
                                <path d="M 170 250 Q 200 238 230 250 Z" fill="#78350f" />
                              </g>
                            ) : (
                              <g filter="url(#shadow)">
                                
                                <path 
                                  d={`M ${200 - trunkThickness/2} 248 
                                      Q ${200 - trunkThickness/4} ${250 - trunkHeight/2} ${195} ${250 - trunkHeight} 
                                      Q ${200} ${250 - trunkHeight/2} ${200 + trunkThickness/2} 248 Z`} 
                                  fill="url(#trunkGrad)" 
                                />

                                
                                {compliance > 45 && (
                                  <path 
                                    d={`M 197 ${250 - trunkHeight*0.6} Q 170 ${250 - trunkHeight*0.8} 150 ${250 - trunkHeight*0.95}`} 
                                    stroke="url(#trunkGrad)" 
                                    strokeWidth={trunkThickness * 0.45} 
                                    strokeLinecap="round" 
                                    fill="none" 
                                  />
                                )}

                                
                                {compliance > 55 && (
                                  <path 
                                    d={`M 202 ${250 - trunkHeight*0.5} Q 230 ${250 - trunkHeight*0.75} 250 ${250 - trunkHeight*0.9}`} 
                                    stroke="url(#trunkGrad)" 
                                    strokeWidth={trunkThickness * 0.4} 
                                    strokeLinecap="round" 
                                    fill="none" 
                                  />
                                )}

                                
                                <g className="transition-all duration-700">
                                  <circle cx="200" cy={250 - trunkHeight} r={trunkHeight * 0.46} fill="url(#leafGrad)" opacity="0.95" />
                                  {compliance > 40 && (
                                    <circle cx="165" cy={250 - trunkHeight * 0.9} r={trunkHeight * 0.36} fill="url(#leafGrad)" opacity="0.9" />
                                  )}
                                  {compliance > 50 && (
                                    <circle cx="235" cy={250 - trunkHeight * 0.85} r={trunkHeight * 0.34} fill="url(#leafGrad)" opacity="0.9" />
                                  )}
                                  {compliance > 75 && (
                                    <circle cx="200" cy={250 - trunkHeight * 1.25} r={trunkHeight * 0.3} fill="url(#leafGrad)" opacity="0.95" />
                                  )}
                                </g>

                                
                                {fruitCoords.slice(0, fruitCount).map((f, i) => (
                                  <g key={i} className="animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}>
                                    <circle cx={f.cx} cy={f.cy - (100 - compliance) * 0.25} r="7" fill="#f43f5e" />
                                    <circle cx={f.cx} cy={f.cy - (100 - compliance) * 0.25} r="2.2" fill="#fef08a" />
                                  </g>
                                ))}
                              </g>
                            )}

                            
                            <g transform="translate(135, 258)">
                              <rect x="0" y="0" width="130" height="18" rx="6" fill="#1e293b" opacity="0.9" />
                              <text x="65" y="12" fill="#ffffff" fontSize="8" fontWeight="black" textAnchor="middle" className="font-mono">
                                CRESCIMENTO: {compliance}%
                              </text>
                            </g>
                          </svg>

                          
                          <div className="mt-1 space-y-1">
                            <span className="text-[10px] font-black uppercase text-slate-400 block leading-none">Estagio de Vida</span>
                            <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-extrabold rounded-full text-xs inline-block shadow-3xs">
                              {compliance <= 20 ? '  Brotinho (Iniciando Sopro)' : 
                               compliance <= 50 ? '  Árvore Jovem (Em Crescimento)' : 
                               compliance <= 85 ? '  Árvore Frondosa (Saudavel e Forte)' : 
                               '  Árvore Frutifera e Florida (Harmonia Completa)'}
                            </span>
                          </div>

                          
                          <button
                            onClick={() => {
                              setIsWateringAnimate(true);
                              const currentCount = parseInt(localStorage.getItem(`anjo_regar_count_${selectedStudent.id}`) || '0', 10);
                              localStorage.setItem(`anjo_regar_count_${selectedStudent.id}`, String(currentCount + 1));
                              setTimeout(() => {
                                setIsWateringAnimate(false);
                              }, 1500);
                              loadData();
                              window.dispatchEvent(new Event('anjo_user_updated'));
                            }}
                            className={`mt-4 px-4 py-2 text-xs font-black rounded-xl border cursor-pointer transition-all flex items-center gap-1.5 active:scale-95 ${
                              isDark 
                                ? 'bg-sky-950 border-sky-800 hover:bg-sky-900 text-sky-400' 
                                : 'bg-sky-50 border-sky-100 hover:bg-sky-100 text-sky-700 shadow-3xs'
                            }`}
                          >
                              Regar de Afeto (+1 Fruto)
                          </button>
                        </div>
                      );
                    })()}

                  </div>

                  
                  <div className={`lg:col-span-7 p-6 rounded-3xl border text-left flex flex-col justify-between ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  } shadow-xs`}>
                    
                    {(() => {
                      const selectedStudent = students.find(s => s.id === selectedStudentForTree);
                      if (!selectedStudent) return <div className="text-slate-400 text-xs">Selecione uma crianca.</div>;

                      const foodVal = parseInt(localStorage.getItem(`anjo_almoco_pct_${selectedStudent.id}`) || '90', 10);
                      const tempVal = parseFloat(localStorage.getItem(`anjo_temp_deg_${selectedStudent.id}`) || '36.5');
                      const sleepVal = parseFloat(localStorage.getItem(`anjo_sleep_hr_${selectedStudent.id}`) || '2.0');
                      const regarCount = parseInt(localStorage.getItem(`anjo_regar_count_${selectedStudent.id}`) || '0', 10);
                      
                      const isFever = tempVal > 37.8;
                      const isLowFood = foodVal < 50;
                      const hasAlert = isFever || isLowFood;
                      const compliance = Math.min(100, Math.max(10, Math.round((foodVal + (sleepVal / 3 * 100)) / 2)));

                      return (
                        <div className="space-y-5 h-full flex flex-col justify-between">
                          <div className="space-y-4">
                            
                            
                            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-850">
                              <img
                                referrerPolicy="no-referrer"
                                src={selectedStudent.foto || "https://images.unsplash.com/photo-1519689680058-324335c77ebd?auto=format&fit=crop&q=80&w=150"}
                                alt={selectedStudent.nome}
                                className="w-12 h-12 rounded-2xl object-cover border border-slate-150"
                              />
                              <div className="leading-tight text-left">
                                <h4 className="font-black text-sm text-slate-900 dark:text-white">{selectedStudent.nome.split(' (')[0]}</h4>
                                <span className="text-[10px] text-slate-400 font-extrabold uppercase">
                                  {selectedStudent.nome.split(' (')[1]?.replace(')', '') || 'Maternal'}
                                </span>
                              </div>
                            </div>

                            
                            <div className="space-y-2">
                              <h5 className="text-[10px] uppercase font-black tracking-wider text-indigo-500">Diagnostico Ecologico</h5>
                              <p className="text-xs text-slate-650 dark:text-slate-400 font-semibold leading-relaxed">
                                A Árvore de Desenvolvimento de <strong>{selectedStudent.nome.split(' (')[0]}</strong> e uma representacao ludica de sua rotina. Ela responde de forma viva aos registros das professoras e a proximidade dos familiares.
                              </p>
                            </div>

                            
                            <div className="grid grid-cols-2 gap-3.5">
                              
                              <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-100/10 space-y-1">
                                <span className="text-[9px] font-black uppercase text-slate-400 block">Grau de Crescimento (Rotina)</span>
                                <div className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-1">
                                  <span> </span> {compliance}%
                                </div>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium leading-tight">
                                  Alimentacao saudavel e soneca regulada fortalecem o tronco.
                                </span>
                              </div>

                              <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-100/10 space-y-1">
                                <span className="text-[9px] font-black uppercase text-slate-400 block">Nutricao Afetiva (Familiar)</span>
                                <div className="text-lg font-black text-rose-600 flex items-center gap-1 animate-pulse">
                                  <span> </span> {regarCount} regas
                                </div>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium leading-tight">
                                  Curtidas de fotos e regadas dos pais geram frutos vermelhos e flores.
                                </span>
                              </div>

                              <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-100/10 space-y-1">
                                <span className="text-[9px] font-black uppercase text-slate-400 block">Fotossintese de Saude</span>
                                <div className={`text-lg font-black flex items-center gap-1 ${hasAlert ? 'text-amber-500' : 'text-emerald-600'}`}>
                                  <span> </span> {tempVal}°C
                                </div>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium leading-tight">
                                  {isFever ? 'Alerta de Febre: Folhagem desidratada/amarela.' : 'Temperatura corporal ideal. Clima ameno.'}
                                </span>
                              </div>

                              <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-100/10 space-y-1">
                                <span className="text-[9px] font-black uppercase text-slate-400 block">Energia Vital</span>
                                <div className="text-lg font-black text-sky-600 flex items-center gap-1">
                                  <span> </span> {foodVal}%
                                </div>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium leading-tight">
                                  {isLowFood ? 'Atencao: Pouco apetite hoje.' : 'Excelente aceitacao de nutrientes.'}
                                </span>
                              </div>

                            </div>

                          </div>

                          
                          <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100/20 text-[10.5px] text-indigo-800 dark:text-indigo-300 font-semibold leading-normal mt-4">
                              <strong>Dica da Coordenacao:</strong> A folhagem de {selectedStudent.nome.split(' (')[0]} esta {hasAlert ? 'amarela, sugerindo atencao de saude.' : 'verde e vibrante!'} Estimule os pais a mandarem "Regadas de Amor" pelo app para continuarem preenchendo o diario com interacoes afetivas.
                          </div>

                        </div>
                      );
                    })()}

                  </div>

                </div>
              )}

              
              {treeLevel === 'class' && (
                <div className="space-y-6">
                  
                  
                  <div className={`p-4 rounded-2xl border ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
                  } flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-semibold`}>
                    
                    <div className="space-y-0.5 text-left">
                      <span className="text-[10px] font-black uppercase text-slate-400 block">Turma Sob Analise</span>
                      <h4 className="text-sm font-extrabold text-slate-800 dark:text-white">Bosque do DesenvolvimentoColetivo</h4>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <span className="text-slate-500 shrink-0">Filtrar Turma:</span>
                      <select
                        value={selectedClassForBosque}
                        onChange={(e) => setSelectedClassForBosque(e.target.value)}
                        className={`px-3 py-2 text-xs rounded-xl border focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-semibold w-full sm:w-48 ${
                          isDark ? 'bg-slate-850 border-slate-750 text-white' : 'bg-white border-slate-205 text-slate-800'
                        }`}
                      >
                        {classrooms.map(c => (
                          <option key={c.id} value={c.name}>{c.emoji} {c.name}</option>
                        ))}
                      </select>
                    </div>

                  </div>

                  
                  {(() => {
                    const classStudents = students.filter(s => s.nome.includes(selectedClassForBosque));
                    
                    if (classStudents.length === 0) {
                      return (
                        <div className={`p-12 text-center border-2 border-dashed rounded-3xl ${
                          isDark ? 'bg-slate-900/40 border-slate-800 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-400'
                        } font-bold text-xs space-y-1.5`}>
                          <span> </span>
                          <p>Nao ha alunos matriculados nesta turma para compor o Bosque.</p>
                          <p className="text-[10px] text-slate-400 font-normal">Altere o nome da sala dos alunos no painel de turmas para vincula-los aqui.</p>
                        </div>
                      );
                    }

                    // Calculate class averages for the grove
                    const avgCompliance = Math.round(classStudents.reduce((acc, s) => {
                      const food = parseInt(localStorage.getItem(`anjo_almoco_pct_${s.id}`) || '90', 10);
                      const sleep = parseFloat(localStorage.getItem(`anjo_sleep_hr_${s.id}`) || '2.0');
                      return acc + Math.min(100, Math.max(10, Math.round((food + (sleep / 3 * 100)) / 2)));
                    }, 0) / classStudents.length);

                    const totalClassWaterings = classStudents.reduce((acc, s) => {
                      return acc + parseInt(localStorage.getItem(`anjo_regar_count_${s.id}`) || '0', 10);
                    }, 0);

                    return (
                      <div className="space-y-6">
                        
                        
                        <div className={`p-6 rounded-3xl border relative overflow-hidden ${
                          isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-gradient-to-b from-sky-100 via-indigo-50/20 to-emerald-50/10 border-slate-200'
                        } shadow-xs min-h-[360px] flex flex-col justify-between`}>
                          
                          
                          <div className="absolute top-6 left-8 w-10 h-10 rounded-full bg-amber-400/20 blur-sm"></div>
                          <div className="absolute top-10 right-16 bg-white/70 dark:bg-slate-800/40 px-3 py-1 rounded-full text-[9px] font-bold text-slate-400">  Turma Harmonica</div>

                          
                          <div className="flex flex-wrap items-end justify-center gap-6 md:gap-12 py-6 z-10 overflow-x-auto">
                            {classStudents.map(student => {
                              const foodVal = parseInt(localStorage.getItem(`anjo_almoco_pct_${student.id}`) || '90', 10);
                              const tempVal = parseFloat(localStorage.getItem(`anjo_temp_deg_${student.id}`) || '36.5');
                              const sleepVal = parseFloat(localStorage.getItem(`anjo_sleep_hr_${student.id}`) || '2.0');
                              const regarCount = parseInt(localStorage.getItem(`anjo_regar_count_${student.id}`) || '0', 10);
                              
                              const compliance = Math.min(100, Math.max(10, Math.round((foodVal + (sleepVal / 3 * 100)) / 2)));
                              const isFever = tempVal > 37.8;
                              const isLowFood = foodVal < 50;

                              let leafColor = '#4ade80';
                              if (isFever || isLowFood) leafColor = '#fbbf24';
                              else if (compliance > 85) leafColor = '#15803d';

                              const heightScale = 0.5 + (compliance / 100) * 0.5; // 0.5 to 1.0

                              return (
                                <div 
                                  key={student.id} 
                                  onClick={() => {
                                    setSelectedStudentForTree(student.id);
                                    setTreeLevel('individual');
                                  }}
                                  className="flex flex-col items-center cursor-pointer hover:scale-105 transition-all duration-300 group max-w-[120px] text-center"
                                  title={`Ver Árvore Detalhada de ${student.nome.split(' (')[0]}`}
                                >
                                  
                                  <svg viewBox="0 0 160 160" className="w-20 h-20 overflow-visible">
                                    
                                    <ellipse cx="80" cy="140" rx="30" ry="6" fill="#86efac" opacity="0.8" />
                                    
                                    <line x1="80" y1="140" x2="80" y2={140 - 55 * heightScale} stroke="#92400e" strokeWidth="6" strokeLinecap="round" />
                                    
                                    <circle cx="80" cy={140 - 55 * heightScale} r={28 * heightScale} fill={leafColor} opacity="0.9" />
                                    
                                    {regarCount > 0 && (
                                      <circle cx="70" cy={140 - 55 * heightScale + 5} r="4.5" fill="#f43f5e" />
                                    )}
                                    {regarCount > 2 && (
                                      <circle cx="90" cy={140 - 55 * heightScale - 5} r="4.5" fill="#f43f5e" />
                                    )}
                                  </svg>

                                  
                                  <div className="relative mt-2">
                                    <img 
                                      referrerPolicy="no-referrer"
                                      src={student.foto || "https://images.unsplash.com/photo-1519689680058-324335c77ebd?auto=format&fit=crop&q=80&w=150"} 
                                      alt={student.nome}
                                      className="w-6 h-6 rounded-full object-cover border border-white dark:border-slate-800 shadow-2xs group-hover:border-indigo-500"
                                    />
                                    {isFever && <span className="absolute -top-1 -right-1 bg-red-500 text-[8px] text-white p-0.5 rounded-full animate-pulse leading-none">[!]</span>}
                                  </div>

                                  <span className="text-[10px] font-black text-slate-800 dark:text-slate-300 truncate w-full mt-1 leading-tight group-hover:text-indigo-600 block">
                                    {student.nome.split(' (')[0]}
                                  </span>
                                  <span className="text-[8px] text-slate-400 font-mono block">Prog: {compliance}%</span>
                                </div>
                              );
                            })}
                          </div>

                          
                          <div className="w-full h-2 bg-emerald-400 dark:bg-emerald-950/40 rounded-full z-0"></div>

                        </div>

                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          
                          <div className={`p-4 rounded-2xl border text-left ${
                            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-205'
                          } shadow-3xs space-y-1`}>
                            <span className="text-[10px] font-black uppercase text-slate-400 block">Árvores no Bosque</span>
                            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{classStudents.length} unidades</div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal font-medium">
                              Cada crianca matriculada cultiva sua propria árvore correspondente.
                            </p>
                          </div>

                          <div className={`p-4 rounded-2xl border text-left ${
                            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-205'
                          } shadow-3xs space-y-1`}>
                            <span className="text-[10px] font-black uppercase text-slate-400 block">Clima do Bosque (Harmonia)</span>
                            <div className="text-2xl font-black text-emerald-600">{avgCompliance}% Saudavel</div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal font-medium">
                              Media de rotina concluida e soneca ideal das criancas hoje.
                            </p>
                          </div>

                          <div className={`p-4 rounded-2xl border text-left ${
                            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-205'
                          } shadow-3xs space-y-1`}>
                            <span className="text-[10px] font-black uppercase text-slate-400 block">Precipitacao de Afeto (Regadas)</span>
                            <div className="text-2xl font-black text-sky-600">{totalClassWaterings} ml total</div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal font-medium">
                              Regadas de afeto enviadas pelos familiares e pela direcao doColegio.
                            </p>
                          </div>

                        </div>

                      </div>
                    );
                  })()}

                </div>
              )}

              
              {treeLevel === 'school' && (
                <div className="space-y-6">
                  
                  
                  <div className={`p-6 rounded-3xl border text-left space-y-6 ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-202'
                  } shadow-xs`}>
                    
                    <div className="space-y-1.5 pb-4 border-b border-slate-100 dark:border-slate-850">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500">Eco-Pedagogia Unificada</span>
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span> </span> Floresta Escolar: Ecossistema de Rotina e Cuidado
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                        A uniao dos bosques de todas as salas forma a Floresta Escolar da nossa instituicao. Cada árvore representa o desenvolvimento coletivo e a harmonia das familias parceiras!
                      </p>
                    </div>

                    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      
                      <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl space-y-1 border border-slate-100/10">
                        <span className="text-[9px] font-black uppercase text-slate-400 block">Árvores Plantadas (Alunos)</span>
                        <div className="text-2xl font-black text-slate-800 dark:text-slate-100">{students.length}  </div>
                        <span className="text-[10px] text-slate-400 font-medium block">Total de ecossistemas individuais monitorados.</span>
                      </div>

                      <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl space-y-1 border border-slate-100/10">
                        <span className="text-[9px] font-black uppercase text-slate-400 block">Oxigenio Pedagogico (Harmonia)</span>
                        <div className="text-2xl font-black text-emerald-600">86% OK</div>
                        <span className="text-[10px] text-slate-400 font-medium block">Media geral de conformidade das salas escolares de hoje.</span>
                      </div>

                      <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl space-y-1 border border-slate-100/10">
                        <span className="text-[9px] font-black uppercase text-slate-400 block">Chuva de Amor (Regas de Afeto)</span>
                        {(() => {
                          const totalS = students.reduce((acc, s) => {
                            return acc + parseInt(localStorage.getItem(`anjo_regar_count_${s.id}`) || '0', 10);
                          }, 0);
                          return (
                            <div className="text-2xl font-black text-sky-600">{totalS} gotas  </div>
                          );
                        })()}
                        <span className="text-[10px] text-slate-400 font-medium block">Gotas de regada acumuladas enviadas do app familiar.</span>
                      </div>

                      <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl space-y-1 border border-slate-100/10">
                        <span className="text-[9px] font-black uppercase text-slate-400 block">Grau de Florada Escolar</span>
                        <div className="text-2xl font-black text-amber-500">Excelente  </div>
                        <span className="text-[10px] text-slate-400 font-medium block">Taxa de engajamento familiar e retorno de curtidas.</span>
                      </div>

                    </div>

                    
                    <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-850">
                      <h5 className="text-[10px] uppercase font-black tracking-wider text-slate-400">Bosques das Turmas no Ecossistema</h5>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {classrooms.map(room => {
                          const classStudents = getStudentsInClassroom(room.name);
                          
                          // Class average wellness
                          const avgCompliance = classStudents.length === 0 ? 0 : Math.round(classStudents.reduce((acc, s) => {
                            const food = parseInt(localStorage.getItem(`anjo_almoco_pct_${s.id}`) || '90', 10);
                            const sleep = parseFloat(localStorage.getItem(`anjo_sleep_hr_${s.id}`) || '2.0');
                            return acc + Math.min(100, Math.max(10, Math.round((food + (sleep / 3 * 100)) / 2)));
                          }, 0) / classStudents.length);

                          const classRegas = classStudents.reduce((acc, s) => {
                            return acc + parseInt(localStorage.getItem(`anjo_regar_count_${s.id}`) || '0', 10);
                          }, 0);

                          return (
                            <div 
                              key={room.id}
                              onClick={() => {
                                setSelectedClassForBosque(room.name);
                                setTreeLevel('class');
                              }}
                              className={`p-4 rounded-2xl border cursor-pointer hover:border-indigo-500 transition-all text-left flex items-center justify-between gap-3 ${
                                isDark ? 'bg-slate-850 border-slate-800' : 'bg-slate-50 border-slate-200'
                              }`}
                            >
                              <div className="space-y-2 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-lg">{room.emoji}</span>
                                  <h6 className="font-extrabold text-xs text-slate-900 dark:text-white truncate">{room.name}</h6>
                                </div>

                                <div className="space-y-1">
                                  <div className="flex justify-between text-[9px] font-black uppercase text-slate-400">
                                    <span>Clima: {avgCompliance}%</span>
                                    <span>{classStudents.length} Árvores</span>
                                  </div>
                                  <div className="h-1.5 w-28 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-emerald-500 rounded-full"
                                      style={{ width: `${avgCompliance}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>

                              
                              <span className="text-2xl p-2 bg-indigo-100/50 dark:bg-indigo-950/40 text-indigo-600 rounded-xl shrink-0">
                                {avgCompliance > 80 ? ' ' : avgCompliance > 50 ? ' ' : ' '}
                              </span>

                            </div>
                          );
                        })}
                      </div>
                    </div>

                    
                    <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl gap-4">
                      <div className="flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
                        <span className="text-xl"> </span>
                        <div>
                          <strong className="font-bold block mb-0.5">Irrigacao Geral Escolar</strong>
                          Selecione esta acao para enviar uma notificacao de carinho e afeto coletivo para todos os familiares cadastrados no Anjinho!
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setIsWateringAnimate(true);
                          students.forEach(student => {
                            const current = parseInt(localStorage.getItem(`anjo_regar_count_${student.id}`) || '0', 10);
                            localStorage.setItem(`anjo_regar_count_${student.id}`, String(current + 1));
                          });
                          setTimeout(() => {
                            setIsWateringAnimate(false);
                            alert('  Chuva de Afeto enviada! Todos os familiares receberam um convite de regada de amor e todas as árvores ganharam +1 fruto florido!');
                          }, 1000);
                          loadData();
                          window.dispatchEvent(new Event('anjo_user_updated'));
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition-all cursor-pointer shadow-3xs whitespace-nowrap active:scale-95"
                      >
                          Regar Toda a Floresta
                      </button>
                    </div>

                  </div>

                </div>
              )}

            </div>
          ) : (
            // =========================================================================
            // VIEW MODE 2: CONVENTIONAL CHARTS (RELATORIOS E LISTAS TRADICIONAIS)     
            // =========================================================================
            <div className="space-y-6 animate-fade-in">
              
              
              <div className="flex border-b border-slate-200 dark:border-slate-800 pb-px gap-6 overflow-x-auto">
                <button
                  onClick={() => setChartsSubTab('care')}
                  className={`pb-3 text-xs font-black relative transition-all cursor-pointer whitespace-nowrap ${
                    chartsSubTab === 'care'
                      ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                      : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
                  }`}
                >
                    Monitor de Cuidados & Saude Diaria
                </button>
                <button
                  onClick={() => setChartsSubTab('strategic')}
                  className={`pb-3 text-xs font-black relative transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    chartsSubTab === 'strategic'
                      ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                      : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
                  }`}
                >
                    Indicadores Estrategicos & Evasao <span className="bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold font-mono">Novo</span>
                </button>
              </div>

              {chartsSubTab === 'care' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  
                  <div className={`lg:col-span-8 p-6 rounded-3xl border space-y-6 ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  } shadow-xs`}>
                    
                    <h4 className="text-sm font-extrabold text-slate-850 flex items-center gap-1">
                      <span> </span> Indicadores Medios dos Alunos
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      
                      <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-100/10 space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                          <span>Aproveitamento Alimentar</span>
                          <span> </span>
                        </div>
                        <div className="text-2xl font-black text-emerald-600">86%</div>
                        <p className="text-[10px] text-slate-400 leading-normal">
                          Media de papinhas e lanchinhos aceitos pelas criancas esta semana.
                        </p>
                      </div>

                      <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-100/10 space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                          <span>Media de Soneca Diaria</span>
                          <span> </span>
                        </div>
                        <div className="text-2xl font-black text-indigo-600">2,1h</div>
                        <p className="text-[10px] text-slate-400 leading-normal">
                          Duracao media de repouso vespertino registrado pelos professores.
                        </p>
                      </div>

                      <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-100/10 space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                          <span>Adesao a Remedios</span>
                          <span>  </span>
                        </div>
                        <div className="text-2xl font-black text-rose-600">100%</div>
                        <p className="text-[10px] text-slate-400 leading-normal">
                          Administracoes de medicamentos efetuadas rigorosamente conforme receita.
                        </p>
                      </div>

                    </div>

                    
                    <div className="space-y-4 pt-6 border-t border-slate-100/10">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                        <div className="space-y-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                              <span> </span> Rastreamento 360o de Atencao Individual
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-extrabold">
                              6 Pilares de Cuidado
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            Painel completo do diretor: temperatura, nutricao, sono, higiene/fraldas, medicacao prescrita e desenvolvimento socioemocional.
                          </p>
                        </div>

                        
                        <div className="flex flex-wrap items-center gap-1.5 self-stretch sm:self-auto">
                          <button
                            type="button"
                            onClick={() => setRastreamentoFilter('todos')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                              rastreamentoFilter === 'todos'
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            Todos ({students.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setRastreamentoFilter('alertas')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                              rastreamentoFilter === 'alertas'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 hover:bg-rose-200'
                            }`}
                          >
                            <span> </span> Apenas Alertas / Observacao
                          </button>
                        </div>
                      </div>

                      {actionSuccessMessage && (
                        <div className="p-3 bg-emerald-500 text-white font-extrabold rounded-2xl text-xs flex items-center justify-between shadow-md animate-fade-in text-left">
                          <span>{actionSuccessMessage}</span>
                          <button type="button" onClick={() => setActionSuccessMessage(null)} className="font-bold underline text-[11px]">Fechar</button>
                        </div>
                      )}

                      
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="relative flex-1 w-full">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={rastreamentoSearch}
                            onChange={(e) => setRastreamentoSearch(e.target.value)}
                            placeholder="Buscar aluno por nome, sala ou responsavel..."
                            className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs font-medium ${
                              isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                            }`}
                          />
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <Filter className="w-3.5 h-3.5 text-slate-400" />
                          <select
                            value={rastreamentoClassFilter}
                            onChange={(e) => setRastreamentoClassFilter(e.target.value)}
                            className={`px-3 py-2 rounded-xl border text-xs font-bold ${
                              isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                            }`}
                          >
                            <option value="Todas">Todas as Salas</option>
                            {classrooms.map(c => (
                              <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      
                      <div className="space-y-3">
                        {students
                          .filter(s => {
                            const foodVal = parseInt(localStorage.getItem(`anjo_almoco_pct_${s.id}`) || (s.id === 'aluno_1' ? '30' : s.id === 'aluno_2' ? '45' : '90'), 10);
                            const tempVal = parseFloat(localStorage.getItem(`anjo_temp_deg_${s.id}`) || (s.id === 'aluno_1' ? '38.2' : s.id === 'aluno_4' ? '37.9' : '36.5'));
                            const sleepVal = parseFloat(localStorage.getItem(`anjo_sleep_hr_${s.id}`) || (s.id === 'aluno_2' ? '0.5' : '2.0'));
                            const isAlert = foodVal < 50 || tempVal >= 37.8 || sleepVal < 1.0;

                            if (rastreamentoFilter === 'alertas' && !isAlert) return false;
                            if (rastreamentoClassFilter !== 'Todas') {
                              const studentRoom = s.salaAula || s.nome.split(' (')[1]?.replace(')', '') || '';
                              if (!studentRoom.toLowerCase().includes(rastreamentoClassFilter.toLowerCase())) return false;
                            }
                            if (rastreamentoSearch.trim()) {
                              const q = rastreamentoSearch.toLowerCase();
                              return s.nome.toLowerCase().includes(q) || (s.contatoEmergencia?.nome || '').toLowerCase().includes(q);
                            }
                            return true;
                          })
                          .map(s => {
                            const foodVal = parseInt(localStorage.getItem(`anjo_almoco_pct_${s.id}`) || (s.id === 'aluno_1' ? '30' : s.id === 'aluno_2' ? '45' : '90'), 10);
                            const tempVal = parseFloat(localStorage.getItem(`anjo_temp_deg_${s.id}`) || (s.id === 'aluno_1' ? '38.2' : s.id === 'aluno_4' ? '37.9' : '36.5'));
                            const sleepVal = parseFloat(localStorage.getItem(`anjo_sleep_hr_${s.id}`) || (s.id === 'aluno_2' ? '0.5' : '2.0'));
                            
                            const diaperStatus = localStorage.getItem(`anjo_diaper_${s.id}`) || (
                              s.id === 'aluno_1' ? '3 trocas (Fezes Moles/Atencao)' :
                              s.id === 'aluno_3' ? '2 trocas (Acompanhamento)' :
                              '3 trocas (Aspecto Normal)'
                            );

                            const medStatus = localStorage.getItem(`anjo_med_${s.id}`) || (
                              s.id === 'aluno_1' ? 'Paracetamol 10mg/mL (12:00  )' :
                              s.id === 'aluno_4' ? 'Amoxicilina (Pendente 15:30 [T])' :
                              'Sem receita para hoje'
                            );

                            const emotionalStatus = localStorage.getItem(`anjo_emotional_${s.id}`) || (
                              s.id === 'aluno_1' ? 'Irritabilidade / Choro Dificultado' :
                              s.id === 'aluno_2' ? 'Agitacao no Repouso / Recusa de Chupeta' :
                              s.id === 'aluno_4' ? 'Encaminhado p/ Fonoaudiologia' :
                              'Calmo, Participativo e Comunicativo'
                            );

                            const isAlert = tempVal >= 37.8 || foodVal < 50 || sleepVal < 1.0 || diaperStatus.includes('Atencao') || medStatus.includes('Pendente');
                            const isObservation = !isAlert && (tempVal >= 37.3 || foodVal < 70 || emotionalStatus.includes('Choro') || emotionalStatus.includes('Encaminhado'));

                            const parentContact = s.contatoEmergencia?.nome || 'Clarice Souza (Mae)';
                            const parentPhone = s.contatoEmergencia?.telefone || '(11) 98765-4321';

                            return (
                              <div 
                                key={s.id} 
                                className={`p-4 rounded-2xl border transition-all space-y-3 text-left ${
                                  isAlert 
                                    ? 'bg-rose-500/5 border-rose-500/40 shadow-xs' 
                                    : isObservation
                                    ? 'bg-amber-500/5 border-amber-500/30'
                                    : isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                                }`}
                              >
                                
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100/10 pb-2.5">
                                  <div className="flex items-center gap-3">
                                    <img 
                                      referrerPolicy="no-referrer"
                                      src={s.foto || "https://images.unsplash.com/photo-1519689680058-324335c77ebd?auto=format&fit=crop&q=80&w=150"} 
                                      alt={s.nome}
                                      className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 shadow-xs"
                                    />
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <h5 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{s.nome.split(' (')[0]}</h5>
                                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-black uppercase">
                                          {s.salaAula || s.nome.split(' (')[1]?.replace(')', '') || 'Maternal'}
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-slate-500 font-medium">
                                        Responsavel: <strong className="text-slate-700 dark:text-slate-300">{parentContact}</strong>   {parentPhone}
                                      </p>
                                    </div>
                                  </div>

                                  
                                  <div className="flex items-center gap-2 self-start sm:self-auto">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                      isAlert 
                                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 animate-pulse border border-rose-300' 
                                        : isObservation
                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300'
                                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300'
                                    }`}>
                                      {isAlert ? '  ATENCAO PRIORITARIA' : isObservation ? '[!] EM OBSERVACAO' : '  ROTINA REGISTRADA EM DIA'}
                                    </span>
                                  </div>
                                </div>

                                
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                                  
                                  
                                  <div className={`p-2 rounded-xl border text-xs space-y-0.5 ${
                                    tempVal >= 37.8 ? 'bg-rose-100/60 border-rose-300 text-rose-900 font-extrabold' : 'bg-slate-50 dark:bg-slate-800 border-slate-200/50 dark:border-slate-700'
                                  }`}>
                                    <span className="text-[9px] font-bold uppercase text-slate-400 block">  Temperatura</span>
                                    <span className="font-black text-slate-800 dark:text-slate-100">{tempVal}°C</span>
                                    <span className="text-[9px] block text-slate-500 font-medium">{tempVal >= 37.8 ? 'Febril (Medicao 10:15)' : 'Estavel'}</span>
                                  </div>

                                  
                                  <div className={`p-2 rounded-xl border text-xs space-y-0.5 ${
                                    foodVal < 50 ? 'bg-amber-100/60 border-amber-300 text-amber-900 font-extrabold' : 'bg-slate-50 dark:bg-slate-800 border-slate-200/50 dark:border-slate-700'
                                  }`}>
                                    <span className="text-[9px] font-bold uppercase text-slate-400 block">  Nutricao / Almoco</span>
                                    <span className="font-black text-slate-800 dark:text-slate-100">{foodVal}%</span>
                                    <span className="text-[9px] block text-slate-500 font-medium">{foodVal < 50 ? 'Recusa Alimentar' : 'Otima Aceitacao'}</span>
                                  </div>

                                  
                                  <div className="p-2 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200/50 dark:border-slate-700 text-xs space-y-0.5">
                                    <span className="text-[9px] font-bold uppercase text-slate-400 block">  Sono / Repouso</span>
                                    <span className="font-black text-slate-800 dark:text-slate-100">{sleepVal}h</span>
                                    <span className="text-[9px] block text-slate-500 font-medium">{sleepVal < 1.0 ? 'RepousoCurto' : 'Sono Tranquilo'}</span>
                                  </div>

                                  
                                  <div className="p-2 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200/50 dark:border-slate-700 text-xs space-y-0.5">
                                    <span className="text-[9px] font-bold uppercase text-slate-400 block">  Higiene / Trocas</span>
                                    <span className="font-black text-slate-800 dark:text-slate-100 text-[11px] truncate block">{diaperStatus}</span>
                                  </div>

                                  
                                  <div className={`p-2 rounded-xl border text-xs space-y-0.5 ${
                                    medStatus.includes('Pendente') ? 'bg-amber-100/60 border-amber-300' : 'bg-slate-50 dark:bg-slate-800 border-slate-200/50 dark:border-slate-700'
                                  }`}>
                                    <span className="text-[9px] font-bold uppercase text-slate-400 block">   Medicacao</span>
                                    <span className="font-black text-slate-800 dark:text-slate-100 text-[10px] block truncate">{medStatus}</span>
                                  </div>

                                  
                                  <div className="p-2 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200/50 dark:border-slate-700 text-xs space-y-0.5">
                                    <span className="text-[9px] font-bold uppercase text-slate-400 block">  Socioemocional</span>
                                    <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-[10px] block truncate">{emotionalStatus}</span>
                                  </div>

                                </div>

                                
                                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
                                  <FileText className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                                  <p className="leading-relaxed text-[11px] font-medium">
                                    <strong className="text-slate-800 dark:text-slate-200">Relato da Professora:</strong> "{s.observacoes || 'Crianca apresentou boa disposicao nas vivencias pedagógicas e interacao harmoniosa com o grupo.'}"
                                  </p>
                                </div>

                                
                                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100/10">
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedStudent360(s)}
                                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                                    >
                                      <Eye className="w-3.5 h-3.5" /> Ficha 360°Completa
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setDirectorNoteModalStudent(s);
                                        setDirectorNoteText(localStorage.getItem(`anjo_director_note_${s.id}`) || '');
                                        setNoteNotifyTeacher(true);
                                        setNoteNotifyCoordination(true);
                                        setNoteNotifyFamilyMural(false);
                                        setNoteCallWhatsApp(false);
                                      }}
                                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                                    >
                                      <Pencil className="w-3.5 h-3.5 text-indigo-500" /> Anotar Diretoria
                                    </button>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      const studentShortName = s.nome.split(' (')[0];
                                      const phoneRaw = s.contatoEmergencia?.telefone || '';
                                      const cleanDigits = phoneRaw.replace(/\D/g, '');
                                      let formattedPhone = cleanDigits;
                                      if (cleanDigits.length >= 10 && cleanDigits.length <= 11) {
                                        formattedPhone = `55${cleanDigits}`;
                                      }
                                      const now = new Date();
                                      const dateFormatted = now.toLocaleDateString('pt-BR');
                                      const timeFormatted = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                                      const waMsg = `*   Colegio Anjinho Escolar Bauru - Direcao Geral*\n\n` +
                                        `Ola, responsaveis pelo(a) *${studentShortName}*!\n` +
                                        `Aqui e a Diretora *Nilva Amaral*. Gostaria de alinhar com voces algumas informacoes sobre a rotina e o bem-estar do(a) ${studentShortName}.\n\n` +
                                        `_Data:_ ${dateFormatted} as ${timeFormatted}\n` +
                                        `_Colegio Anjinho Escolar - Cuidado, Afeto e Excelencia Pedagógica_  `;

                                      if (formattedPhone) {
                                        window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(waMsg)}`, '_blank');
                                      } else {
                                        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(waMsg)}`, '_blank');
                                      }
                                      setActionSuccessMessage(`  WhatsApp aberto com o contato da familia de ${studentShortName} (${parentContact})!`);
                                      setTimeout(() => setActionSuccessMessage(null), 4500);
                                    }}
                                    className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-all"
                                  >
                                    <PhoneCall className="w-3.5 h-3.5 text-emerald-600" /> Chamar Familia (WhatsApp)
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                  </div>

                  
                  <div className={`lg:col-span-4 p-6 rounded-3xl border flex flex-col justify-between ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  } shadow-xs`}>
                    
                    <div className="space-y-2 text-left">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-500">Engajamento de Afeto</span>
                      <h4 className="text-sm font-extrabold text-slate-850 flex items-center gap-1">
                        <span> </span> Ranking de Participacao dos Pais
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                        As salas onde os familiares mais interagem com curtidas e regadas. Estimule o canal para aumentar a fidelidade das familias!
                      </p>
                    </div>

                    <div className="my-5 space-y-4 flex-1">
                      {classrooms.slice(0, 4).map((room, idx) => {
                        // Simulate random higher engagement for top classes
                        const score = idx === 0 ? 84 : idx === 1 ? 62 : idx === 2 ? 41 : 18;

                        return (
                          <div key={room.id} className="space-y-1.5 text-left">
                            <div className="flex items-center justify-between text-xs font-black">
                              <span className="text-slate-800 dark:text-slate-200">{room.emoji} {room.name}</span>
                              <span className="text-indigo-600 dark:text-indigo-400 font-black">{score} pts</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-indigo-600 dark:bg-indigo-400 rounded-full"
                                style={{ width: `${score}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-200/30 text-[10px] text-amber-800 dark:text-amber-300 font-bold leading-normal text-left">
                        <strong>Dica da Direcao:</strong> envie comunicados no mural de avisos convidando os pais para curtirem o diario. Escolas com engajamento acima de 50 pontos retem 40% mais familias na matricula anual!
                    </div>

                  </div>

                </div>
              ) : (
                // =========================================================================
                //   PAINEL DE INDICADORES ESTRATEGICOS (ANJINHO ANALYTICS)
                // =========================================================================
                <div className="space-y-6">
                  
                  
                  <div className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-indigo-500 block tracking-wider">Direcao Escolar Avancada</span>
                      <h4 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                        <span> </span> Indicadores Estrategicos & Governanca Pedagógica
                      </h4>
                      <p className="text-[11px] text-slate-400 font-semibold leading-normal">
                        Monitore a evasao escolar, desenvolvimento cognitivo, tempo de tela e comportamento para intervencoes precoces eficientes.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">Filtrar Turma:</span>
                      <select 
                        value={selectedClassroomForMetrics}
                        onChange={(e) => setSelectedClassroomForMetrics(e.target.value)}
                        className={`text-xs font-bold p-1.5 rounded-xl border ${
                          isDark ? 'bg-slate-850 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <option value="Todas">Todas as Turmas ({classrooms.length})</option>
                        {classrooms.map(c => (
                          <option key={c.id} value={c.name}>{c.emoji} {c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    
                    <div className="lg:col-span-8 space-y-6">
                      
                      
                      <div className={`p-5 rounded-3xl border space-y-4 ${
                        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                      } shadow-xs`}>
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-black uppercase text-slate-500 flex items-center gap-1.5">
                            <span className="p-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-lg"> </span> 
                            1. Frequencia Diaria & Alerta de Evasao
                          </h5>
                          <span className="text-[10px] font-extrabold text-slate-400 font-mono">Meta: &gt;90%</span>
                        </div>

                        <div className="space-y-4">
                          <p className="text-[11px] font-semibold text-slate-500 leading-relaxed">
                            Faltas frequentes sao os principais sinalizadores de desengajamento familiar, insatisfacao ou problemas de saude. Monitore o risco preventivamente.
                          </p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {classrooms
                              .filter(c => selectedClassroomForMetrics === 'Todas' || c.name === selectedClassroomForMetrics)
                              .map(c => {
                                // Simulate customized attendance percentages based on class name
                                const attendance = c.name.includes('Maternal I') ? 96 
                                                 : c.name.includes('Maternal II') ? 88 
                                                 : c.name.includes('Jardim I') ? 84 
                                                 : 74; // Jardim II / Pre has some absentees

                                const isLow = attendance < 85;

                                return (
                                  <div key={c.id} className={`p-3 rounded-2xl border ${
                                    isDark ? 'bg-slate-850 border-slate-800/60' : 'bg-slate-50 border-slate-200/60'
                                  } space-y-2`}>
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                        <span>{c.emoji}</span> {c.name}
                                      </span>
                                      <span className={`text-xs font-black ${
                                        isLow ? 'text-rose-500' : 'text-emerald-500'
                                      }`}>{attendance}%</span>
                                    </div>

                                    <div className="h-2 w-full bg-slate-200 dark:bg-slate-750 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full rounded-full ${isLow ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                        style={{ width: `${attendance}%` }}
                                      ></div>
                                    </div>

                                    <div className="flex items-center justify-between pt-1">
                                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase ${
                                        isLow 
                                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400' 
                                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                                      }`}>
                                        {isLow ? '[!] Risco de Evasao Alta' : '  Saudavel'}
                                      </span>
                                      
                                      <button 
                                        onClick={() => alert(`  Disparo Preventivo: Uma mensagem automatica de carinho e verificacao de saude foi sugerida para a professora de ${c.name} disparar para as familias com mais de 2 faltas consecutivas!`)}
                                        className="text-[9px] font-bold text-indigo-600 hover:text-indigo-700 underline cursor-pointer"
                                      >
                                        Disparar Verificacao
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      </div>

                      
                      <div className={`p-5 rounded-3xl border space-y-4 ${
                        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                      } shadow-xs`}>
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-black uppercase text-slate-500 flex items-center gap-1.5">
                            <span className="p-1.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 rounded-lg"> </span> 
                            2. Identificacao Precoce de Atraso no Desenvolvimento
                          </h5>
                          <span className="text-[10px] font-extrabold text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full font-mono">Encaminhamento Precoce</span>
                        </div>

                        <div className="space-y-4">
                          <p className="text-[11px] font-semibold text-slate-500 leading-relaxed">
                            Monitoramento proativo de marcos do desenvolvimento (fala, coordenacao motora, socializacao). O encaminhamento precoce para especialistas (Fono, Psico, TO) muda o futuro pedagogico da crianca!
                          </p>

                          <div className={`p-4 rounded-2xl border ${
                            isDark ? 'bg-slate-850 border-slate-800/80 text-white' : 'bg-gradient-to-r from-indigo-50/50 to-pink-50/20 border-slate-100'
                          } flex flex-col md:flex-row items-center gap-5 justify-between`}>
                            
                            <div className="flex items-center gap-4">
                              <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                                <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                  <path className="text-slate-200 dark:text-slate-700" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                  <path className="text-indigo-600 dark:text-indigo-400" strokeWidth="3" strokeDasharray="5.4, 100" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                </svg>
                                <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">5.4%</span>
                              </div>
                              <div className="text-left space-y-0.5">
                                <span className="text-xs font-black text-slate-800 dark:text-slate-100 block">Sinais de Atencao Identificados</span>
                                <span className="text-[10px] font-medium text-slate-400 block leading-tight">
                                  Apenas 2 de 37 criancas matriculadas exibiram sinais persistentes de alerta nos relatorios de diarios pedagogicos este mes.
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => setShowStrategicReferralModal(true)}
                              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] rounded-xl whitespace-nowrap cursor-pointer transition-all active:scale-95 shadow-3xs"
                            >
                                Abrir Protocolo Fono/Psico
                            </button>
                          </div>
                        </div>
                      </div>

                      
                      <div className={`p-5 rounded-3xl border space-y-4 ${
                        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                      } shadow-xs`}>
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-black uppercase text-slate-500 flex items-center gap-1.5">
                            <span className="p-1.5 bg-amber-50 dark:bg-amber-950/30 text-amber-600 rounded-lg">  </span> 
                            3. Numero de Encaminhamentos Pedagogicos por Turma
                          </h5>
                          <span className="text-[10px] font-extrabold text-slate-400 font-mono">Meta de Equilibrio: &lt;5 / Sem</span>
                        </div>

                        <div className="space-y-4">
                          <p className="text-[11px] font-semibold text-slate-500 leading-relaxed">
                            Encaminhamentos pedagogicos internos excessivos podem indicar problemas de adequacao de planejamento, estresse docente ou atividades inadequadas para a idade de maturacao da turma.
                          </p>

                          <div className="space-y-3">
                            {classrooms
                              .filter(c => selectedClassroomForMetrics === 'Todas' || c.name === selectedClassroomForMetrics)
                              .map(c => {
                                // Dynamic referrals count
                                const count = pedagógicalReferrals.filter(r => 
                                  r.classroomName === c.name || 
                                  (c.name && r.classroomName && (
                                    c.name.toLowerCase().includes(r.classroomName.toLowerCase()) || 
                                    r.classroomName.toLowerCase().includes(c.name.toLowerCase())
                                  ))
                                ).length;

                                const isHigh = count >= 5;

                                return (
                                  <div key={c.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850/50 border border-slate-100 dark:border-slate-800/40">
                                    <div className="flex items-center gap-2">
                                      <span className="text-base">{c.emoji}</span>
                                      <span className="text-xs font-black text-slate-800 dark:text-slate-200">{c.name}</span>
                                    </div>

                                    <div className="flex items-center gap-4">
                                      <div className="flex items-center gap-2.5">
                                        <span className="text-[10px] font-black text-slate-400 uppercase">Volume:</span>
                                        <button
                                          onClick={() => setShowReferralsClassModal(c)}
                                          className={`text-xs font-black px-2 py-0.5 rounded-md hover:scale-105 active:scale-95 transition-all cursor-pointer ${
                                            isHigh 
                                              ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-900/60' 
                                              : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400 dark:hover:bg-indigo-900/60'
                                          }`}
                                          title="Clique para ver ou lancar novos encaminhamentos para esta turma"
                                        >
                                          {count} encaminhamentos  
                                        </button>
                                      </div>

                                      {isHigh && (
                                        <span className="text-[9px] text-amber-600 font-extrabold flex items-center gap-0.5" title="Recomenda-se revisar planejamento">
                                          [!] Alto (Revisar Planejamento)
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      </div>

                      
                      <div className={`p-5 rounded-3xl border space-y-4 ${
                        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                      } shadow-xs`}>
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-black uppercase text-slate-500 flex items-center gap-1.5">
                            <span className="p-1.5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 rounded-lg"> </span> 
                            4. Exposicao ao Tempo de Tela (Dispositivos)
                          </h5>
                          <span className="text-[10px] font-extrabold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full font-mono">Meta: Minimo ou Zero  </span>
                        </div>

                        <div className="space-y-4 text-left">
                          <p className="text-[11px] font-semibold text-slate-500 leading-relaxed">
                            A Sociedade Brasileira de Pediatria e a OMS recomendam tempo de tela <strong>ZERO</strong> para criancas menores de 2 anos, e maximo de 1 hora diaria para 3 a 5 anos.
                          </p>

                          <div className="p-4 rounded-2xl border border-dashed border-emerald-300 dark:border-emerald-800/40 bg-emerald-50/40 dark:bg-emerald-950/10 space-y-3">
                            <div className="flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-400">
                              <span className="text-lg"> </span>
                              <div>
                                <span className="font-extrabold block">Certificacao Anjinho de Zero Tela na Escola</span>
                                <p className="text-[10px] leading-relaxed font-bold mt-0.5 text-slate-600 dark:text-slate-400">
                                  Todas as atividades registradas no maternal e jardim hoje indicam <strong>0 minutos</strong> de exposicao a computadores, TVs ou tablets. A tecnologia no colegio e de uso estrito e exclusivo dos professores para governanca e relatorios familiares!
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>

                    
                    <div className="lg:col-span-4 space-y-6">
                      
                      
                      <div className={`p-5 rounded-3xl border space-y-4 ${
                        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                      } shadow-xs text-left`}>
                        <h5 className="text-xs font-black uppercase text-slate-500 flex items-center gap-1.5">
                          <span className="p-1.5 bg-purple-50 dark:bg-purple-950/30 text-purple-600 rounded-lg"> </span> 
                          5. Distribuicao de Rotina
                        </h5>

                        <div className="space-y-4">
                          <p className="text-[11px] font-semibold text-slate-500 leading-normal">
                            Equilibrio saudavel conforme a Base Nacional Comum Curricular (BNCC), onde o brincar livre e a exploracao sao os eixos essenciais de aprendizagem.
                          </p>

                          <div className="space-y-3 text-[11px] font-bold">
                            
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px]">
                                <span className="text-emerald-600 font-extrabold">  Brincar Livre / Explorar</span>
                                <span className="font-extrabold">45% <span className="text-[9px] text-slate-400 font-semibold">(Meta &gt;40%)</span></span>
                              </div>
                              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '45%' }}></div>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px]">
                                <span className="text-indigo-600 font-extrabold">  Brincar Dirigido / Projetos</span>
                                <span className="font-extrabold">35% <span className="text-[9px] text-slate-400 font-semibold">(Meta 20%-40%)</span></span>
                              </div>
                              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: '35%' }}></div>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px]">
                                <span className="text-slate-500 dark:text-slate-400 font-extrabold">  Cuidados Especiais & Soneca</span>
                                <span className="font-extrabold">20% <span className="text-[9px] text-slate-400 font-semibold">(Necessario)</span></span>
                              </div>
                              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-slate-400 dark:bg-slate-600 rounded-full" style={{ width: '20%' }}></div>
                              </div>
                            </div>

                            <div className="p-2.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 text-[10px] text-indigo-800 dark:text-indigo-400 leading-normal font-semibold">
                                <strong>Status Pedagogico:</strong> Equilibrio excelente detectado! A proporcao de brincadeiras e interacoes respeita os direitos de aprendizagem infantil.
                            </div>
                          </div>
                        </div>
                      </div>

                      
                      <div className={`p-5 rounded-3xl border space-y-4 ${
                        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                      } shadow-xs text-left`}>
                        <h5 className="text-xs font-black uppercase text-slate-500 flex items-center gap-1.5">
                          <span className="p-1.5 bg-sky-50 dark:bg-sky-950/30 text-sky-600 rounded-lg"> </span> 
                          6. Engajamento & Participacao Familiar
                        </h5>

                        <div className="space-y-3">
                          <p className="text-[11px] font-semibold text-slate-500 leading-normal">
                            Familias engajadas e que interagem de forma positiva criam alta fidelizacao de marca escolar e diminuem a evasao letiva.
                          </p>

                          <div className="p-3.5 rounded-2xl bg-sky-50/50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40 text-center space-y-1">
                            <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Adesao Escolar Ativa</span>
                            <div className="text-3xl font-black text-sky-600">88%</div>
                            <span className="text-[10px] text-sky-800 dark:text-sky-300 font-extrabold block">Participacao em Enquetes & Curtidas</span>
                            <p className="text-[9px] text-slate-400 leading-normal font-bold">
                              Excelente! Pais ativamente integrados no processo elevam a rematricula projetada para 94% no proximo periodo!
                            </p>
                          </div>
                        </div>
                      </div>

                      
                      <div className={`p-5 rounded-3xl border space-y-4 ${
                        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                      } shadow-xs text-left`}>
                        <h5 className="text-xs font-black uppercase text-slate-500 flex items-center gap-1.5">
                          <span className="p-1.5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 rounded-lg"> </span> 
                          7. Comportamento & Mediacao de Conflitos
                        </h5>

                        <div className="space-y-3">
                          <p className="text-[11px] font-semibold text-slate-500 leading-normal">
                            Ocorrencias recorrentes de agressividade ou isolamento requerem mediacao precoce para evitar comportamentos atipicos e bullying infantil no Pre II e Fundamental I.
                          </p>

                          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 text-amber-800 dark:text-amber-400 space-y-2">
                            <span className="font-extrabold text-[10px] uppercase block tracking-wider">[!] Registro Leve de Atrito (Pre II)</span>
                            <p className="text-[10px] font-bold leading-normal">
                              2 ocorrencias pontuais de empurroes/disputa de brinquedos anotadas hoje. Professores conduziram din de acolhimento em roda imediatamente.
                            </p>
                            
                            <button
                              onClick={() => setShowStrategicConflictModal(true)}
                              className="w-full mt-1.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-[9px] rounded-lg cursor-pointer transition-colors uppercase tracking-wider"
                            >
                              Ver Plano de Mediacao Escolar
                            </button>
                          </div>
                        </div>
                      </div>

                    </div>

                  </div>

                </div>
              )}

            </div>
          )}

        </div>
      )}

      
      {activeTab === 'teachers' && (
        <div className="space-y-6 text-left">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>   </span> Corpo Docente & Equipe Escolar
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                Quadro geral de professores, coordenadoras e colaboradores cadastrados com suas respectivas turmas vinculadas.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowInviteStaffModal(true)}
                className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-black text-xs flex items-center gap-1.5 transition-all border border-emerald-200 dark:border-emerald-800/40 cursor-pointer shadow-xs"
              >
                <span> </span> Convidar Equipe via WhatsApp
              </button>

              <button
                type="button"
                onClick={() => setShowStaffModal(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center gap-1.5 transition-all shadow-sm hover:shadow cursor-pointer"
                id="btn-novo-professor-diretor"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ NovoColaborador / Professor</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teachers.map(t => (
              <div key={t.id} className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-205'
              } shadow-3xs hover:shadow-xs transition-shadow`}>
                
                <div className="flex gap-4 items-start">
                  <img 
                    referrerPolicy="no-referrer"
                    src={t.foto || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150"} 
                    alt={t.nome}
                    className="w-14 h-14 rounded-full object-cover border border-slate-100 shrink-0 self-center"
                  />

                  <div className="space-y-2 min-w-0 flex-1 text-left">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5 min-w-0">
                        <h4 className="font-black text-sm text-slate-900 dark:text-white truncate leading-tight">
                          {t.nome.split(' (')[0]}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[9px] font-black rounded uppercase">
                            {t.tipo}
                          </span>
                          <span className="text-[9px] text-slate-400 font-bold">
                            PIN: {t.pin || '    '}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenEditTeacher(t)}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 text-[10px] font-black rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                        title="Editar Perfil e Vinculos"
                      >
                        <Edit className="w-3 h-3" /> Editar
                      </button>
                    </div>

                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                      Telefone: {t.telefone || '(Sem Numero)'}
                    </span>

                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium line-clamp-1">
                      {t.observacoes || 'Professora credenciada.'}
                    </p>

                    <div className="flex flex-wrap gap-1 items-center pt-1">
                      <span className="text-[9px] font-black uppercase text-slate-400 shrink-0">Turmas Ativas:</span>
                      {t.salaAula ? t.salaAula.split(',').map((room, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 text-[9px] font-extrabold rounded-md border border-indigo-100/10">
                          {room.trim()}
                        </span>
                      )) : (
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[9px] font-extrabold rounded-md">
                          Nenhuma sala vinculada
                        </span>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>

        </div>
      )}

      
      {showClassroomModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <form 
            onSubmit={handleCreateClassroom}
            className={`rounded-3xl max-w-md w-full border p-6 space-y-4 shadow-2xl animate-scale-up text-left ${
              isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-100/10 pb-3">
              <h4 className="text-base font-black flex items-center gap-1.5">
                <span>  </span> Criar Nova Turma Escolar
              </h4>
              <button 
                type="button"
                onClick={() => setShowClassroomModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Nome da Turma</label>
                  <input
                    type="text"
                    required
                    value={newClassName}
                    onChange={e => setNewClassName(e.target.value)}
                    placeholder="Ex: Maternal I - C"
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:ring-2 focus:ring-indigo-500/20 outline-none ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-205 text-slate-800'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Emoji</label>
                  <select
                    value={newClassEmoji}
                    onChange={e => setNewClassEmoji(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:ring-2 focus:ring-indigo-500/20 outline-none ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-205'
                    }`}
                  >
                    <option value=" ">  Ursinho</option>
                    <option value=" ">  Mamadeira</option>
                    <option value=" ">  Bebe</option>
                    <option value=" ">  Balao</option>
                    <option value=" ">  Pintor</option>
                    <option value=" ">  Pintinho</option>
                    <option value=" ">  Abelhinha</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Faixa Etaria</label>
                  <input
                    type="text"
                    value={newClassAge}
                    onChange={e => setNewClassAge(e.target.value)}
                    placeholder="Ex: 2-3 anos"
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:ring-2 focus:ring-indigo-500/20 outline-none ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-205'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Capacidade Maxima</label>
                  <input
                    type="number"
                    value={newClassCapacity}
                    onChange={e => setNewClassCapacity(Number(e.target.value))}
                    placeholder="15"
                    min={5}
                    max={40}
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:ring-2 focus:ring-indigo-500/20 outline-none ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-205'
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Foco Pedagogico / Descricao</label>
                <textarea
                  value={newClassDesc}
                  onChange={e => setNewClassDesc(e.target.value)}
                  placeholder="Ex: Estimular coordenacao de motricidade fina, inicio de letramento ludico..."
                  rows={2}
                  className={`w-full px-3 py-2 text-xs rounded-xl border focus:ring-2 focus:ring-indigo-500/20 outline-none ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-205'
                  }`}
                />
              </div>

            </div>

            <div className="flex gap-2 items-center justify-end pt-3">
              <button 
                type="button"
                onClick={() => setShowClassroomModal(false)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-colors cursor-pointer shadow-3xs"
              >
                Criar Turma
              </button>
            </div>
          </form>
        </div>
      )}

      
      {editingClassroom && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className={`rounded-3xl max-w-sm w-full border p-6 space-y-4 shadow-2xl text-left ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-100/10 pb-3">
              <h4 className="text-base font-black flex items-center gap-1.5">
                <span>   </span> Alocar Professor(a)
              </h4>
              <button 
                onClick={() => setEditingClassroom(null)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs font-semibold leading-relaxed">
              <p className="text-slate-500">
                Selecione o(a) educador(a) responsavel para gerenciar as rotinas e diarios da turma <strong className="text-indigo-600 font-extrabold">{editingClassroom.name}</strong>:
              </p>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Escolher Educador(a)</label>
                <select
                  value={selectedTeacherId}
                  onChange={e => setSelectedTeacherId(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border focus:ring-2 focus:ring-indigo-500/20 outline-none ${
                    isDark ? 'bg-slate-850 border-slate-750 text-white' : 'bg-white border-slate-205 text-slate-800'
                  }`}
                >
                  <option value="">Nenhum Alocado (Desvincular Turma)</option>
                  {teachers.map(t => {
                    const currentRooms = t.salaAula ? t.salaAula.split(',').map(r => r.trim()).filter(Boolean) : [];
                    return (
                      <option key={t.id} value={t.id}>
                        {t.nome.split(' (')[0]} {currentRooms.length > 0 ? `(${currentRooms.join(', ')})` : '(Sem sala)'}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="flex gap-2 items-center justify-end pt-3">
              <button 
                type="button"
                onClick={() => setEditingClassroom(null)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveTeacherAssignment}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-3xs"
              >
                Salvar Vinculo
              </button>
            </div>
          </div>
        </div>
      )}

      
      {editingTeacher && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <form 
            onSubmit={handleSaveEditTeacher}
            className={`rounded-3xl max-w-lg w-full border p-6 space-y-4 shadow-2xl animate-scale-up text-left max-h-[90vh] overflow-y-auto ${
              isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-100/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl p-1.5 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl">   </span>
                <div>
                  <h4 className="text-base font-black">Editar Colaborador(a) / Professor(a)</h4>
                  <p className="text-[11px] text-slate-400 font-semibold">Atualize dados cadastrais, PIN e salas vinculadas</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setEditingTeacher(null)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs font-semibold leading-relaxed">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={editTeacherName}
                  onChange={e => setEditTeacherName(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border focus:ring-2 focus:ring-indigo-500/20 outline-none ${
                    isDark ? 'bg-slate-850 border-slate-750 text-white' : 'bg-white border-slate-205 text-slate-800'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Funcao / Cargo</label>
                  <select
                    value={editTeacherRole}
                    onChange={e => setEditTeacherRole(e.target.value as any)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:ring-2 focus:ring-indigo-500/20 outline-none ${
                      isDark ? 'bg-slate-850 border-slate-750 text-white' : 'bg-white border-slate-205 text-slate-800'
                    }`}
                  >
                    <option value="professor">Professora / Educadora</option>
                    <option value="coordenador">Coordenador(a)</option>
                    <option value="pedagoga">Pedagoga</option>
                    <option value="cuidador">Cuidador(a)</option>
                    <option value="admin">Administrador(a)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">PIN de Acesso (4 Digitos)</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={editTeacherPin}
                    onChange={e => setEditTeacherPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ex: 2244"
                    className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border focus:ring-2 focus:ring-indigo-500/20 outline-none ${
                      isDark ? 'bg-slate-850 border-slate-750 text-white' : 'bg-white border-slate-205 text-slate-800'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={editTeacherPhone}
                    onChange={e => setEditTeacherPhone(e.target.value)}
                    placeholder="(11) 90000-0000"
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:ring-2 focus:ring-indigo-500/20 outline-none ${
                      isDark ? 'bg-slate-850 border-slate-750 text-white' : 'bg-white border-slate-205 text-slate-800'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">E-mail</label>
                  <input
                    type="email"
                    value={editTeacherEmail}
                    onChange={e => setEditTeacherEmail(e.target.value)}
                    placeholder="nome@escola.com"
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:ring-2 focus:ring-indigo-500/20 outline-none ${
                      isDark ? 'bg-slate-850 border-slate-750 text-white' : 'bg-white border-slate-205 text-slate-800'
                    }`}
                  />
                </div>
              </div>

              
              <div className="space-y-1.5 pt-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-between">
                  <span>Turmas Vinculadas</span>
                  <span className="text-indigo-600 font-extrabold">{editTeacherClassrooms.length} selecionada(s)</span>
                </label>
                <div className={`p-3 rounded-2xl border max-h-36 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 ${
                  isDark ? 'bg-slate-850 border-slate-750' : 'bg-slate-50 border-slate-205'
                }`}>
                  {classrooms.map(c => {
                    const isChecked = editTeacherClassrooms.includes(c.name);
                    return (
                      <label 
                        key={c.id} 
                        className={`flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer text-xs ${
                          isChecked 
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold dark:bg-indigo-950/60 dark:border-indigo-700 dark:text-indigo-200' 
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleEditTeacherClassroom(c.name)}
                          className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                        />
                        <span className="text-sm shrink-0">{c.emoji}</span>
                        <span className="truncate">{c.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Observacoes / Especialidade</label>
                <textarea
                  rows={2}
                  value={editTeacherObs}
                  onChange={e => setEditTeacherObs(e.target.value)}
                  placeholder="Ex: Especialista em psicomotricidade e desenvolvimento infantil."
                  className={`w-full px-3 py-2 text-xs rounded-xl border focus:ring-2 focus:ring-indigo-500/20 outline-none ${
                    isDark ? 'bg-slate-850 border-slate-750 text-white' : 'bg-white border-slate-205 text-slate-800'
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100/10">
              <button 
                type="button"
                onClick={() => handleDeleteStaff(editingTeacher.id, editingTeacher.nome)}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 text-rose-600 text-xs font-black rounded-xl transition-colors cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remover
              </button>

              <div className="flex gap-2 items-center">
                <button 
                  type="button"
                  onClick={() => setEditingTeacher(null)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-3xs"
                >
                  Salvar Alteracoes
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      
      {deletingClassroom && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className={`rounded-3xl max-w-md w-full border p-6 space-y-4 shadow-2xl text-left ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-100/10 pb-3">
              <h4 className="text-base font-black flex items-center gap-1.5 text-rose-600">
                <AlertTriangle className="w-5 h-5 text-rose-500" /> Confirmar Exclusao de Turma
              </h4>
              <button 
                onClick={() => setDeletingClassroom(null)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs font-semibold leading-relaxed">
              <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                Voce tem certeza que deseja excluir permanentemente a turma <strong className="text-rose-600 font-extrabold">{deletingClassroom.name}</strong> ({deletingClassroom.emoji})? Esta acao nao pode ser desfeita.
              </p>

              
              {getStudentsInClassroom(deletingClassroom.name).length > 0 ? (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 space-y-1">
                  <span className="font-black text-[10px] uppercase tracking-wider block">[!] Alunos Alocados Detectados</span>
                  <p className="text-[11px] font-bold">
                    Existem {getStudentsInClassroom(deletingClassroom.name).length} alunos vinculados a esta sala. Ao exclui-la, as visualizacoes e relatorios destes alunos podem ficar incompletos ate que sejam reordenados para uma nova turma ativa no cadastro.
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-400">
                  <p className="text-[11px] font-bold">
                    Tudo limpo! Nenhum aluno ativo esta alocado atualmente nesta sala.
                  </p>
                </div>
              )}

              
              {teachers.some(t => t.salaAula?.split(',').includes(deletingClassroom.name)) && (
                <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/40 text-sky-800 dark:text-sky-300">
                  <span className="font-black text-[10px] uppercase tracking-wider block">    Vinculo Docente</span>
                  <p className="text-[11px] font-bold">
                    O professor titular vinculado perdera o acesso automatico de diario a este grupo, necessitando de uma nova alocacao.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2 items-center justify-end pt-2">
              <button 
                type="button"
                onClick={() => setDeletingClassroom(null)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleDeleteClassroom(deletingClassroom.name)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-3xs"
              >
                Confirmar Exclusao  
              </button>
            </div>
          </div>
        </div>
      )}

      
      {showStrategicReferralModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className={`rounded-3xl max-w-lg w-full border p-6 space-y-4 shadow-2xl text-left ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
          } max-h-[85vh] overflow-y-auto`}>
            
            <div className="flex items-center justify-between border-b border-slate-100/10 pb-3">
              <h4 className="text-sm font-black flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                <BookOpen className="w-5 h-5" /> Protocolo de Identificacao Precoce & Triagem
              </h4>
              <button 
                onClick={() => setShowStrategicReferralModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs leading-relaxed font-semibold">
              <p className="text-[11px] text-slate-500">
                O Anjinho auxilia na identificacao de sinais atipicos atraves de relatos automatizados da rotina pedagógica. Use este painel para organizar a conducao etica e acolhedora com os pais.
              </p>

              <div className="space-y-3.5">
                <div className="p-3 rounded-xl bg-indigo-550/5 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-150 space-y-1.5">
                  <span className="font-extrabold text-[10px] uppercase text-indigo-700 dark:text-indigo-400 block tracking-wider">   Lista de Sinais de RastreamentoComum</span>
                  <ul className="list-disc list-inside space-y-1 pl-1 text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                    <li><strong className="text-indigo-600 dark:text-indigo-300">Fonoaudiologia (Fala/Linguagem):</strong> Criancas acima de 2 anos com ausencia de fala ou ecolalia persistente.</li>
                    <li><strong className="text-indigo-600 dark:text-indigo-300">Psicologia (Socioemocional):</strong> Isolamento continuo durante o brincar livre ou choro inconsolavel com resistencia ao toque.</li>
                    <li><strong className="text-indigo-600 dark:text-indigo-300">Terapia Ocupacional (Integracao Sensorial):</strong> Irritabilidade severa com barulhos de rotina ou texturas de alimentos.</li>
                  </ul>
                </div>

                <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
                  <span className="font-extrabold text-[10px] uppercase text-slate-400 block">Sugerir Mensagem Discreta de Acolhimento a Familia</span>
                  <textarea 
                    readOnly
                    className={`w-full p-2.5 rounded-lg border text-[10px] font-mono leading-relaxed h-28 select-all ${
                      isDark ? 'bg-slate-850 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                    value={`"Ola, [Nome do Pai/Mae]! Esperamos que esteja bem. Observando o desenvolvimento de [Nome da Crianca] nas nossas vivencias e interacoes pedagógicas, notamos que ela tem demonstrado [descrever comportamento leve de forma amorosa, ex: um tempo maior para responder chamados na roda]. Gostariamos de convidar voces para um cafe com nossa coordenacao na proxima quarta-feira para conversarmos sobre como podemos, em parceria escola-familia, potencializar o desenvolvimento dela de forma integral. Contem conosco sempre!"`}
                  />
                  <p className="text-[9px] text-amber-600 font-bold">
                      <strong>Regra de Ouro:</strong> Nunca faca diagnosticos escolares. Ofereca um olhar de acolhimento focado nas interacoes e sugira a avaliacao profissional especializada de forma complementar.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 items-center justify-end pt-3 border-t border-slate-100/10">
              <button 
                type="button"
                onClick={() => setShowStrategicReferralModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black rounded-xl cursor-pointer"
              >
                Fechar Protocolo
              </button>
              <button 
                onClick={() => {
                  alert('  Protocolo salvo com sucesso! O formulario de acompanhamento integrado foi enviado ao prontuario pedagogico confidencial.');
                  setShowStrategicReferralModal(false);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl cursor-pointer"
              >
                Salvar Protocolo
              </button>
            </div>
          </div>
        </div>
      )}

      
      {showStrategicConflictModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className={`rounded-3xl max-w-lg w-full border p-6 space-y-4 shadow-2xl text-left ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
          } max-h-[85vh] overflow-y-auto`}>
            
            <div className="flex items-center justify-between border-b border-slate-100/10 pb-3">
              <h4 className="text-sm font-black flex items-center gap-1.5 text-rose-600">
                <Smile className="w-5 h-5 text-rose-500" /> Plano de Mediacao de Conflitos Escolar
              </h4>
              <button 
                onClick={() => setShowStrategicConflictModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs leading-relaxed font-semibold">
              <p className="text-[11px] text-slate-500 leading-normal">
                Conflitos leves, disputas por brinquedos ou agressividade fisica pontual (mordidas no Maternal II, empurroes no Pre) fazem parte da maturacao social. Este plano orienta o acolhimento seguro.
              </p>

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 text-rose-850 dark:text-rose-300 space-y-1">
                  <span className="font-extrabold text-[10px] uppercase block tracking-wider text-rose-600">  Eixo 1: Acao Imediata de Protecao</span>
                  <p className="text-[10px] leading-relaxed font-medium">
                    Separar fisicamente as criancas de forma neutra, sem gritos ou punicao humilhante. Priorizar o acolhimento da crianca machucada / agredida e garantir sua integridade fisica e emocional.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/10 border border-amber-200 text-amber-800 dark:text-amber-400 space-y-1">
                  <span className="font-extrabold text-[10px] uppercase block tracking-wider">  Eixo 2: Circulo de Conversa e Empatia</span>
                  <p className="text-[10px] leading-relaxed font-medium">
                    Sentar em roda com os envolvidos. Utilizar linguagem de sentimentos (Ex: &quot;O amigo ficou triste porque doeu o braco&quot;). Estimular a reparacao do atrito atraves do cuidado mutuo, ajudando a colocar um gelo ou entregando o brinquedo.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/10 border border-emerald-200 text-emerald-800 dark:text-emerald-400 space-y-1">
                  <span className="font-extrabold text-[10px] uppercase block tracking-wider">  Eixo 3: Registro e Comunicacao Responsavel</span>
                  <p className="text-[10px] leading-relaxed font-medium">
                    Anotar no Anjinho o ocorrido em termos objetivos (fatos, nao julgamentos). No caso de mordidas, informar ambas as familias de forma discreta e protetiva no privado, resguardando a identidade da outra crianca envolvida para evitar estigmatizacoes.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 items-center justify-end pt-3 border-t border-slate-100/10">
              <button 
                type="button"
                onClick={() => setShowStrategicConflictModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black rounded-xl cursor-pointer"
              >
                Fechar Plano
              </button>
              <button 
                onClick={() => {
                  alert('  Plano de mediacao registrado como revisado e ativo para o corpo pedagogico!');
                  setShowStrategicConflictModal(false);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      
      {showReferralsClassModal && (() => {
        const cleanClassName = showReferralsClassModal.name.replace(/ | |  | | | | | /g, '').trim().toLowerCase();
        
        // Filter students of this class
        const classStudents = seniors.filter(s => 
          cleanClassName && s.nome.toLowerCase().includes(cleanClassName)
        );

        // Filter current referrals of this class
        const classReferrals = pedagógicalReferrals.filter(r => 
          r.classroomName === showReferralsClassModal.name || 
          (showReferralsClassModal.name && r.classroomName && (
            showReferralsClassModal.name.toLowerCase().includes(r.classroomName.toLowerCase()) || 
            r.classroomName.toLowerCase().includes(showReferralsClassModal.name.toLowerCase())
          ))
        );

        const handleAddReferral = (e: React.FormEvent) => {
          e.preventDefault();
          
          const finalStudentName = newReferralForm.studentName === 'custom' || !newReferralForm.studentName
            ? customStudentName.trim()
            : newReferralForm.studentName;
            
          if (!finalStudentName) {
            alert('Por favor, informe o nome do aluno.');
            return;
          }
          if (!newReferralForm.reason.trim()) {
            alert('Por favor, insira o motivo do encaminhamento.');
            return;
          }
          
          const newRef = {
            id: 'ref_' + Date.now(),
            classroomName: showReferralsClassModal.name,
            studentName: finalStudentName,
            tipo: newReferralForm.tipo,
            reason: newReferralForm.reason,
            data: new Date().toISOString().split('T')[0],
            registeredBy: 'Diretoria / Coordenacao'
          };
          
          const updated = [newRef, ...pedagógicalReferrals];
          setPedagógicalReferrals(updated);
          saveToDB('anjo_encaminhamentos_pedagogicos', updated);
          
          // Reset
          setNewReferralForm({
            studentName: '',
            tipo: 'pedagogico_geral',
            reason: '',
          });
          setCustomStudentName('');
        };

        const handleDeleteReferral = (id: string) => {
          if (window.confirm('Tem certeza que deseja excluir este encaminhamento?')) {
            const updated = pedagógicalReferrals.filter(r => r.id !== id);
            setPedagógicalReferrals(updated);
            saveToDB('anjo_encaminhamentos_pedagogicos', updated);
          }
        };

        const getTipoLabel = (tipo: string) => {
          switch (tipo) {
            case 'fonoaudiologia': return '  Fonoaudiologia';
            case 'psicologia': return '  Psicologia';
            case 'terapia_ocupacional': return '  Terapia Ocupacional';
            default: return '  Geral / Coordenacao';
          }
        };

        const getTipoColorClass = (tipo: string) => {
          switch (tipo) {
            case 'fonoaudiologia': return 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/30 dark:text-cyan-400 dark:border-cyan-900/30';
            case 'psicologia': return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/30';
            case 'terapia_ocupacional': return 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/30 dark:text-pink-400 dark:border-pink-900/30';
            default: return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/30';
          }
        };

        return (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className={`rounded-3xl max-w-4xl w-full border p-6 space-y-6 shadow-2xl text-left ${
              isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
            } max-h-[90vh] overflow-y-auto`}>
              
              
              <div className="flex items-center justify-between border-b border-slate-100/10 pb-4">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-black flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                    <GraduationCap className="w-5 h-5 text-indigo-500" />
                    Encaminhamentos Pedagogicos - {showReferralsClassModal.name}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-semibold">
                    Gerencie os registros confidenciais e direcione acoes pedagógicas e multidisciplinares de forma estruturada.
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setShowReferralsClassModal(null);
                    setNewReferralForm({ studentName: '', tipo: 'pedagogico_geral', reason: '' });
                    setCustomStudentName('');
                  }}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                
                <div className="md:col-span-7 space-y-4">
                  <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    Historico de Encaminhamentos ({classReferrals.length})
                  </h5>
                  
                  {classReferrals.length === 0 ? (
                    <div className="p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-2">
                      <span className="text-2xl block"> </span>
                      <p className="text-xs font-black text-slate-400">Nenhum encaminhamento registrado</p>
                      <p className="text-[10px] text-slate-500 font-medium">Esta turma esta em total equilibrio pedagogico nesta semana.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                      {classReferrals.map((ref) => (
                        <div 
                          key={ref.id} 
                          className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/40 space-y-2 relative group hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1 text-left">
                              <span className="text-xs font-black text-slate-800 dark:text-slate-100 block">
                                  {ref.studentName}
                              </span>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border ${getTipoColorClass(ref.tipo)}`}>
                                  {getTipoLabel(ref.tipo)}
                                </span>
                                <span className="text-[9px] text-slate-400 font-mono">
                                    {ref.data}
                                </span>
                              </div>
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => handleDeleteReferral(ref.id)}
                              className="text-slate-400 hover:text-red-500 p-1 rounded-lg transition-colors cursor-pointer"
                              title="Excluir encaminhamento"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 leading-relaxed italic bg-white dark:bg-slate-950/30 p-2 rounded-xl">
                            &ldquo;{ref.reason}&rdquo;
                          </p>
                          
                          <div className="text-[9px] text-slate-400 font-bold flex items-center justify-between pt-1">
                            <span>Registrado por:</span>
                            <span className="text-indigo-600 dark:text-indigo-400">{ref.registeredBy}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                
                <form onSubmit={handleAddReferral} className="md:col-span-5 space-y-4 border-t md:border-t-0 md:border-l border-slate-100/10 pt-4 md:pt-0 md:pl-6 text-left">
                  <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Lancar Novo Registro
                  </h5>

                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Aluno da Turma</label>
                    <select
                      className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                      required
                      value={newReferralForm.studentName}
                      onChange={(e) => setNewReferralForm({ ...newReferralForm, studentName: e.target.value })}
                    >
                      <option value="">-- Selecione o Aluno --</option>
                      {classStudents.map(student => (
                        <option key={student.id} value={student.nome.split(' (')[0]}>
                          {student.nome.split(' (')[0]}
                        </option>
                      ))}
                      <option value="custom">  Outro Aluno (Digitar nome)...</option>
                    </select>
                  </div>

                  
                  {(newReferralForm.studentName === 'custom' || classStudents.length === 0) && (
                    <div className="space-y-1.5 animate-slide-down">
                      <label className="text-[10px] font-black text-slate-400 uppercase">Escreva o Nome do Aluno</label>
                      <input
                        type="text"
                        placeholder="Ex: Joaozinho Santos"
                        className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none ${
                          isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                        required
                        value={customStudentName}
                        onChange={(e) => setCustomStudentName(e.target.value)}
                      />
                    </div>
                  )}

                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Especialidade / Destino</label>
                    <select
                      className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                      required
                      value={newReferralForm.tipo}
                      onChange={(e) => setNewReferralForm({ ...newReferralForm, tipo: e.target.value })}
                    >
                      <option value="pedagogico_geral">  Geral / Coordenacao</option>
                      <option value="fonoaudiologia">  Fonoaudiologia</option>
                      <option value="psicologia">  Psicologia (Socioemocional)</option>
                      <option value="terapia_ocupacional">  Terapia Ocupacional</option>
                    </select>
                  </div>

                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Relato do Motivo / Observacao</label>
                    <textarea
                      placeholder="Descreva de forma etica os comportamentos observados, reacoes fisicas e justificativa do encaminhamento..."
                      className={`w-full p-2.5 rounded-xl border text-xs font-semibold h-24 focus:ring-2 focus:ring-indigo-500/20 outline-none leading-relaxed ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                      required
                      value={newReferralForm.reason}
                      onChange={(e) => setNewReferralForm({ ...newReferralForm, reason: e.target.value })}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl cursor-pointer transition-all active:scale-98 shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Registrar Encaminhamento
                  </button>
                </form>

              </div>

              
              <div className="flex gap-2 items-center justify-end pt-4 border-t border-slate-100/10">
                <button 
                  type="button"
                  onClick={() => {
                    setShowReferralsClassModal(null);
                    setNewReferralForm({ studentName: '', tipo: 'pedagogico_geral', reason: '' });
                    setCustomStudentName('');
                  }}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black rounded-xl cursor-pointer transition-colors"
                >
                  Fechar Painel Confidencial
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      
      {selectedStudent360 && (() => {
        const s = selectedStudent360;
        const foodVal = parseInt(localStorage.getItem(`anjo_almoco_pct_${s.id}`) || (s.id === 'aluno_1' ? '30' : s.id === 'aluno_2' ? '45' : '90'), 10);
        const tempVal = parseFloat(localStorage.getItem(`anjo_temp_deg_${s.id}`) || (s.id === 'aluno_1' ? '38.2' : s.id === 'aluno_4' ? '37.9' : '36.5'));
        const sleepVal = parseFloat(localStorage.getItem(`anjo_sleep_hr_${s.id}`) || (s.id === 'aluno_2' ? '0.5' : '2.0'));
        const diaperStatus = localStorage.getItem(`anjo_diaper_${s.id}`) || (s.id === 'aluno_1' ? '3 trocas (Fezes Moles/Atencao)' : '3 trocas (Aspecto Normal)');
        const medStatus = localStorage.getItem(`anjo_med_${s.id}`) || (s.id === 'aluno_1' ? 'Paracetamol 10mg/mL (12:00  )' : s.id === 'aluno_4' ? 'Amoxicilina (Pendente 15:30 [T])' : 'Sem receita para hoje');
        const emotionalStatus = localStorage.getItem(`anjo_emotional_${s.id}`) || (s.id === 'aluno_1' ? 'Irritabilidade / Choro Dificultado' : 'Calmo, Participativo e Comunicativo');
        const savedDirectorNotes = localStorage.getItem(`anjo_director_note_${s.id}`) || '';

        return (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className={`rounded-3xl max-w-2xl w-full border p-6 space-y-5 shadow-2xl text-left ${
              isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
            } max-h-[90vh] overflow-y-auto`}>
              
              
              <div className="flex items-center justify-between border-b border-slate-100/10 pb-4">
                <div className="flex items-center gap-3">
                  <img 
                    referrerPolicy="no-referrer"
                    src={s.foto || "https://images.unsplash.com/photo-1519689680058-324335c77ebd?auto=format&fit=crop&q=80&w=150"} 
                    alt={s.nome}
                    className="w-14 h-14 rounded-full object-cover border-2 border-indigo-500 shadow-md"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black">{s.nome.split(' (')[0]}</h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-black">
                        {s.salaAula || s.nome.split(' (')[1]?.replace(')', '') || 'Maternal'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium">
                      Nascimento: {s.dataNascimento || '12/05/2022'}   Matricula Ativa
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedStudent360(null)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              
              <div className="space-y-2">
                <h5 className="text-xs font-black uppercase tracking-wider text-indigo-500">
                    Monitoramento dos 6 Pilares de Cuidado Hoje
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div className={`p-3 rounded-2xl border ${tempVal >= 37.8 ? 'bg-rose-500/10 border-rose-500/40 text-rose-300' : 'bg-slate-50 dark:bg-slate-800 border-slate-200/50 dark:border-slate-700'}`}>
                    <span className="text-[10px] font-bold uppercase block text-slate-400">  Temperatura</span>
                    <span className="text-sm font-black">{tempVal}°C</span>
                    <span className="text-[10px] block font-medium mt-0.5">{tempVal >= 37.8 ? '[!] Febril' : '  Estavel'}</span>
                  </div>

                  <div className={`p-3 rounded-2xl border ${foodVal < 50 ? 'bg-amber-500/10 border-amber-500/40 text-amber-300' : 'bg-slate-50 dark:bg-slate-800 border-slate-200/50 dark:border-slate-700'}`}>
                    <span className="text-[10px] font-bold uppercase block text-slate-400">  Almoco / Nutricao</span>
                    <span className="text-sm font-black">{foodVal}%</span>
                    <span className="text-[10px] block font-medium mt-0.5">{foodVal < 50 ? '[!] Recusa Parcial' : '  Alimentacao Boa'}</span>
                  </div>

                  <div className="p-3 rounded-2xl border bg-slate-50 dark:bg-slate-800 border-slate-200/50 dark:border-slate-700">
                    <span className="text-[10px] font-bold uppercase block text-slate-400">  Soneca / Repouso</span>
                    <span className="text-sm font-black">{sleepVal} Horas</span>
                    <span className="text-[10px] block font-medium mt-0.5">{sleepVal < 1.0 ? 'Repouso Agitado' : 'Repouso Adequado'}</span>
                  </div>

                  <div className="p-3 rounded-2xl border bg-slate-50 dark:bg-slate-800 border-slate-200/50 dark:border-slate-700">
                    <span className="text-[10px] font-bold uppercase block text-slate-400">  Higiene / Trocas</span>
                    <span className="text-xs font-extrabold">{diaperStatus}</span>
                  </div>

                  <div className="p-3 rounded-2xl border bg-slate-50 dark:bg-slate-800 border-slate-200/50 dark:border-slate-700">
                    <span className="text-[10px] font-bold uppercase block text-slate-400">   Prescricao Medica</span>
                    <span className="text-xs font-extrabold">{medStatus}</span>
                  </div>

                  <div className="p-3 rounded-2xl border bg-slate-50 dark:bg-slate-800 border-slate-200/50 dark:border-slate-700">
                    <span className="text-[10px] font-bold uppercase block text-slate-400">  Socioemocional</span>
                    <span className="text-xs font-extrabold text-indigo-400">{emotionalStatus}</span>
                  </div>
                </div>
              </div>

              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/50 dark:border-indigo-800/40 space-y-1.5">
                  <h6 className="text-[11px] font-black uppercase text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    <PhoneCall className="w-3.5 h-3.5" /> Responsaveis Cadastrados
                  </h6>
                  <p className="text-xs font-bold">{s.contatoEmergencia?.nome || 'Clarice Souza (Mae)'}</p>
                  <p className="text-xs text-indigo-600 dark:text-indigo-300 font-mono font-bold">
                      {s.contatoEmergencia?.telefone || '(11) 98765-4321'}
                  </p>
                  <p className="text-[10px] text-slate-400">Canal direto de aviso autorizado via aplicativo.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200/50 dark:border-rose-800/40 space-y-1.5">
                  <h6 className="text-[11px] font-black uppercase text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" /> Prontuario Medico e Alergias
                  </h6>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Alergias: <span className="text-rose-500 font-extrabold">{s.alergias?.join(', ') || 'Nenhuma declarada'}</span>
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {s.condicoesMedicas?.join('   ') || 'Acompanhamento pediatrico regular'}
                  </p>
                </div>
              </div>

              
              <div className="space-y-2">
                <h6 className="text-xs font-black uppercase text-slate-400">  Registro da Professora & Notacoes da Diretoria</h6>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 space-y-2">
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    <strong>Professora:</strong> "{s.observacoes || 'Crianca participou ativamente das rodas de leitura e brincadeiras.'}"
                  </p>
                  {savedDirectorNotes && (
                    <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700 text-xs text-indigo-600 dark:text-indigo-300">
                      <strong>Notacao da Diretora Nilva:</strong> "{savedDirectorNotes}"
                    </div>
                  )}
                </div>
              </div>

              
              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100/10">
                <button
                  type="button"
                  onClick={() => setSelectedStudent360(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-black rounded-xl cursor-pointer"
                >
                  Fechar Ficha
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActionSuccessMessage(`  Comunicado do Diretor enviado para ${s.contatoEmergencia?.nome || 'Familia de ' + s.nome}!`);
                    setSelectedStudent360(null);
                    setTimeout(() => setActionSuccessMessage(null), 4000);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Notificar Responsaveis
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      
      {directorNoteModalStudent && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className={`rounded-3xl max-w-xl w-full border p-6 space-y-4 shadow-2xl text-left max-h-[92vh] overflow-y-auto ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-100/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold overflow-hidden">
                  {directorNoteModalStudent.foto ? (
                    <img src={directorNoteModalStudent.foto} alt={directorNoteModalStudent.nome} className="w-full h-full object-cover" />
                  ) : (
                    directorNoteModalStudent.nome.substring(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                    <Pencil className="w-4 h-4" /> Anotacao da Diretoria - {directorNoteModalStudent.nome.split(' (')[0]}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {directorNoteModalStudent.salaAula || directorNoteModalStudent.quarto || 'Turma Geral'}   Resp: {directorNoteModalStudent.contatoEmergencia?.nome || 'Familia'} ({directorNoteModalStudent.contatoEmergencia?.telefone || 'Sem tel'})
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setDirectorNoteModalStudent(null)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Registre orientacoes da Diretora Nilva Amaral, registros de atendimentos, ligacoes ou decisoes pedagógicas e de saude.
            </p>

            <div className="flex items-center justify-between gap-2 bg-indigo-50/70 dark:bg-indigo-950/30 p-2.5 rounded-2xl border border-indigo-100 dark:border-indigo-900/40">
              <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Ditado por Voz (Microfone):
              </span>
              <VoiceInput
                onTranscript={(transcribedText) => {
                  setDirectorNoteText((prev) => {
                    const cleanPrev = prev.trim();
                    const cleanNew = transcribedText.trim();
                    if (!cleanPrev) return cleanNew;
                    if (cleanPrev.toLowerCase().includes(cleanNew.toLowerCase())) return cleanPrev;
                    return `${cleanPrev} ${cleanNew}`;
                  });
                }}
                className="scale-95"
              />
            </div>

            <textarea
              value={directorNoteText}
              onChange={(e) => setDirectorNoteText(e.target.value)}
              placeholder="Ex: Entrei em contato com a mae Clarice por telefone as 10:45. Orientado repouso em casa e alinhado acompanhamento de febre com a professora."
              className={`w-full p-3.5 rounded-2xl border text-xs font-medium h-28 outline-none focus:ring-2 focus:ring-indigo-500/20 leading-relaxed ${
                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            />

            {directorNoteText && (
              <div className="flex justify-end -mt-2">
                <button
                  type="button"
                  onClick={() => setDirectorNoteText('')}
                  className="text-[10px] font-semibold text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                >
                  Limpar texto
                </button>
              </div>
            )}

            
            <div className={`p-3.5 rounded-2xl border space-y-2.5 ${
              isDark ? 'bg-slate-800/60 border-slate-700/80' : 'bg-slate-50/80 border-slate-200/80'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5" /> Quem deve receber copia deste comunicado?
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Criterio da Direcao</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                
                <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                  noteNotifyTeacher 
                    ? 'bg-indigo-50/60 border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-800/60 text-indigo-900 dark:text-indigo-200' 
                    : isDark ? 'bg-slate-900/40 border-slate-800 text-slate-400 opacity-60' : 'bg-white border-slate-200 text-slate-500 opacity-60'
                }`}>
                  <input 
                    type="checkbox" 
                    checked={noteNotifyTeacher} 
                    onChange={(e) => setNoteNotifyTeacher(e.target.checked)}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="text-left">
                    <p className="text-xs font-bold leading-tight flex items-center gap-1">
                          Professora da Sala
                    </p>
                    <p className="text-[10px] opacity-80 mt-0.5">
                      Diario de bordo e mural da equipe
                    </p>
                  </div>
                </label>

                
                <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                  noteNotifyCoordination 
                    ? 'bg-purple-50/60 border-purple-200 dark:bg-purple-950/40 dark:border-purple-800/60 text-purple-900 dark:text-purple-200' 
                    : isDark ? 'bg-slate-900/40 border-slate-800 text-slate-400 opacity-60' : 'bg-white border-slate-200 text-slate-500 opacity-60'
                }`}>
                  <input 
                    type="checkbox" 
                    checked={noteNotifyCoordination} 
                    onChange={(e) => setNoteNotifyCoordination(e.target.checked)}
                    className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
                  />
                  <div className="text-left">
                    <p className="text-xs font-bold leading-tight flex items-center gap-1">
                         Coordenacao Pedagógica
                    </p>
                    <p className="text-[10px] opacity-80 mt-0.5">
                      Painel pedagogico da coordenacao
                    </p>
                  </div>
                </label>

                
                <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                  noteNotifyFamilyMural 
                    ? 'bg-amber-50/60 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800/60 text-amber-900 dark:text-amber-200' 
                    : isDark ? 'bg-slate-900/40 border-slate-800 text-slate-400 opacity-60' : 'bg-white border-slate-200 text-slate-500 opacity-60'
                }`}>
                  <input 
                    type="checkbox" 
                    checked={noteNotifyFamilyMural} 
                    onChange={(e) => setNoteNotifyFamilyMural(e.target.checked)}
                    className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <div className="text-left">
                    <p className="text-xs font-bold leading-tight flex items-center gap-1">
                          Mural da Familia (App)
                    </p>
                    <p className="text-[10px] opacity-80 mt-0.5">
                      Publica na caderneta digital dos pais
                    </p>
                  </div>
                </label>

                
                <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                  noteCallWhatsApp 
                    ? 'bg-emerald-50/60 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200' 
                    : isDark ? 'bg-slate-900/40 border-slate-800 text-slate-400 opacity-60' : 'bg-white border-slate-200 text-slate-500 opacity-60'
                }`}>
                  <input 
                    type="checkbox" 
                    checked={noteCallWhatsApp} 
                    onChange={(e) => setNoteCallWhatsApp(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="text-left">
                    <p className="text-xs font-bold leading-tight flex items-center gap-1">
                        Chamar no WhatsApp
                    </p>
                    <p className="text-[10px] opacity-80 mt-0.5">
                      Abre mensagem oficial para os pais
                    </p>
                  </div>
                </label>
              </div>
            </div>

            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100/10">
              <button
                type="button"
                onClick={() => setDirectorNoteModalStudent(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancelar
              </button>

              <div className="flex flex-col sm:flex-row gap-2">
                
                <button
                  type="button"
                  onClick={() => {
                    if (!directorNoteText.trim()) return;
                    const s = directorNoteModalStudent;
                    const cleanNote = directorNoteText.trim();
                    const studentShortName = s.nome.split(' (')[0];
                    localStorage.setItem(`anjo_director_note_${s.id}`, cleanNote);
                    setActionSuccessMessage(`  Notacao salva com sucesso no prontuario de ${studentShortName}! (Acesso estritamente interno da Diretoria)`);
                    setDirectorNoteModalStudent(null);
                    setTimeout(() => setActionSuccessMessage(null), 4500);
                  }}
                  className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                  title="Salva no prontuario 360o sem emitir nenhuma notificacao externa"
                >
                  <Shield className="w-3.5 h-3.5 text-slate-500" /> Salvar Apenas Interno (Sigiloso)
                </button>

                
                <button
                  type="button"
                  onClick={() => {
                    if (!directorNoteText.trim()) return;
                    const s = directorNoteModalStudent;
                    const cleanNote = directorNoteText.trim();
                    const studentShortName = s.nome.split(' (')[0];
                    const now = new Date();
                    const dateFormatted = now.toLocaleDateString('pt-BR');
                    const timeFormatted = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    const dateTimeStr = `${dateFormatted} as ${timeFormatted}`;

                    // 1. Salva na Ficha 360o
                    localStorage.setItem(`anjo_director_note_${s.id}`, cleanNote);

                    const dispatchedActions: string[] = [];

                    // 2. Notificar Professora da Sala
                    if (noteNotifyTeacher) {
                      const occKey = `anjo_ocorrencias_${s.id}`;
                      const occList = getFromDB<any[]>(occKey, []);
                      const newOcc = {
                        id: `occ_dir_${Date.now()}`,
                        tipo: 'observacao_diretoria',
                        titulo: '  Orientacao da Direcao Geral (Nilva Amaral)',
                        descricao: cleanNote,
                        dataHora: dateTimeStr,
                        autor: 'Diretora Nilva Amaral',
                        cargo: 'Diretora Geral',
                        salaAula: s.salaAula || s.quarto || 'Geral',
                        tag: 'Direcao',
                        importancia: 'alta'
                      };
                      occList.unshift(newOcc);
                      saveToDB(occKey, occList);
                      window.dispatchEvent(new CustomEvent('anjo_user_updated', { detail: { localKey: occKey } }));
                      dispatchedActions.push('Professora');
                    }

                    // 3. Notificar Coordenacao Pedagógica
                    if (noteNotifyCoordination) {
                      const coordKey = 'anjo_comunicados_coordenacao';
                      const coordList = getFromDB<any[]>(coordKey, []);
                      const newCoordAlert = {
                        id: `coord_dir_${Date.now()}`,
                        alunoId: s.id,
                        alunoNome: studentShortName,
                        salaAula: s.salaAula || s.quarto || 'Todas',
                        remetente: 'Diretora Nilva Amaral',
                        cargo: 'Direcao Geral',
                        titulo: `Orientacao da Direcao - ${studentShortName}`,
                        mensagem: cleanNote,
                        dataHora: dateTimeStr,
                        status: 'pendente',
                        prioridade: 'alta'
                      };
                      coordList.unshift(newCoordAlert);
                      saveToDB(coordKey, coordList);
                      window.dispatchEvent(new CustomEvent('anjo_user_updated', { detail: { localKey: coordKey } }));
                      dispatchedActions.push('Coordenacao');
                    }

                    // 4. Publicar no Mural da Familia
                    if (noteNotifyFamilyMural) {
                      const muralKey = 'anjo_mural_recados';
                      const muralList = getFromDB<any[]>(muralKey, []);
                      const newMuralRecado = {
                        id: `rec_dir_${Date.now()}`,
                        idosoId: s.id,
                        tipo: 'prof_para_pais',
                        categoria: 'geral',
                        remetente: 'Direcao Geral (Nilva Amaral)',
                        cargo: 'Diretora Geral',
                        mensagem: cleanNote,
                        dataHora: dateTimeStr,
                        lido: false
                      };
                      muralList.unshift(newMuralRecado);
                      saveToDB(muralKey, muralList);
                      window.dispatchEvent(new CustomEvent('anjo_user_updated', { detail: { localKey: muralKey } }));
                      dispatchedActions.push('Mural da Familia');
                    }

                    // 5. Chamar Responsavel no WhatsApp
                    if (noteCallWhatsApp) {
                      const phoneRaw = s.contatoEmergencia?.telefone || '';
                      const cleanDigits = phoneRaw.replace(/\D/g, '');
                      let formattedPhone = cleanDigits;
                      if (cleanDigits.length >= 10 && cleanDigits.length <= 11) {
                        formattedPhone = `55${cleanDigits}`;
                      }

                      const waMessage = `*   Colegio Anjinho Escolar Bauru - Comunicado da Direcao Geral*\n\n` +
                        `*Aluno(a):* ${studentShortName}\n` +
                        `*Diretora:* Nilva Amaral\n` +
                        `*Data:* ${dateTimeStr}\n\n` +
                        `*Mensagem da Diretoria:*\n${cleanNote}\n\n` +
                        `_Colegio Anjinho Escolar - Cuidado, Afeto e Excelencia Pedagógica_  `;

                      if (formattedPhone) {
                        window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(waMessage)}`, '_blank');
                      } else {
                        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(waMessage)}`, '_blank');
                      }
                      dispatchedActions.push('WhatsApp');
                    }

                    const dispatchedStr = dispatchedActions.length > 0 ? ` Enviado para: ${dispatchedActions.join(', ')}.` : '';
                    setActionSuccessMessage(`  Notacao salva e encaminhada com sucesso!${dispatchedStr}`);
                    setDirectorNoteModalStudent(null);
                    setTimeout(() => setActionSuccessMessage(null), 5000);
                  }}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-md transition-all"
                >
                  <Send className="w-3.5 h-3.5" /> Salvar e Enviar Notificacoes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      
      {showStaffModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <form 
            onSubmit={handleCreateStaff}
            className={`rounded-3xl max-w-lg w-full border p-6 space-y-4 shadow-2xl animate-scale-up text-left max-h-[90vh] overflow-y-auto ${
              isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-100/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black">Cadastrar NovoColaborador</h4>
                  <p className="text-[11px] text-slate-400 font-medium">Adicione professores, coordenadoras ou equipe escolar</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowStaffModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs font-semibold">
              
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Funcao / Cargo</label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value as any)}
                  className={`w-full px-3 py-2.5 text-xs rounded-xl border focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="professor">    Professora / Educador(a)</option>
                  <option value="coordenador">   Coordenador(a) Pedagogico(a)</option>
                  <option value="pedagoga">  Pedagogo(a) Especialista</option>
                  <option value="cuidador">  Cuidador(a) / Monitor(a) Infantil</option>
                  <option value="admin">  Administracao Escolar</option>
                </select>
              </div>

              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="Ex: Profa Fabiana Albuquerque"
                  className={`w-full px-3 py-2.5 text-xs rounded-xl border focus:ring-2 focus:ring-indigo-500/20 outline-none font-medium ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
              </div>

              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">WhatsApp / Telefone</label>
                  <input
                    type="tel"
                    value={newStaffPhone}
                    onChange={(e) => setNewStaffPhone(e.target.value)}
                    placeholder="Ex: (11) 98765-4321"
                    className={`w-full px-3 py-2.5 text-xs rounded-xl border focus:ring-2 focus:ring-indigo-500/20 outline-none font-medium ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">E-mail Corporativo</label>
                  <input
                    type="email"
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                    placeholder="Ex: fabiana@escola.com"
                    className={`w-full px-3 py-2.5 text-xs rounded-xl border focus:ring-2 focus:ring-indigo-500/20 outline-none font-medium ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-between">
                    <span>PIN de Acesso</span>
                    <span className="text-[9px] text-indigo-500 font-normal">4 digitos</span>
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={newStaffPin}
                    onChange={(e) => setNewStaffPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ex: 5566 (ou auto)"
                    className={`w-full px-3 py-2.5 text-xs rounded-xl border font-mono font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
              </div>

              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Vincular Turmas de Atuacao</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  {classrooms.map(room => {
                    const isSelected = newStaffClassrooms.includes(room.name);
                    return (
                      <button
                        key={room.id}
                        type="button"
                        onClick={() => handleToggleStaffClassroom(room.name)}
                        className={`p-2 rounded-lg text-left transition-all border text-[11px] font-bold flex items-center justify-between cursor-pointer ${
                          isSelected 
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs' 
                            : isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span className="truncate">{room.emoji} {room.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400">Pode selecionar multiplas salas para professores volantes ou coordenadores.</p>
              </div>

              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Observacoes & Especialidades</label>
                <textarea
                  value={newStaffObs}
                  onChange={(e) => setNewStaffObs(e.target.value)}
                  placeholder="Ex: Especialista em Educacao Infantil, pos-graduada em Psicomotricidade."
                  className={`w-full p-2.5 text-xs rounded-xl border focus:ring-2 focus:ring-indigo-500/20 outline-none font-medium h-20 ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
              </div>

            </div>

            <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowStaffModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black cursor-pointer shadow-sm hover:shadow transition-all flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                Cadastrar Colaborador
              </button>
            </div>
          </form>
        </div>
      )}

      
      {showInviteStaffModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className={`rounded-3xl max-w-md w-full border p-6 space-y-4 shadow-2xl text-left ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-100/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl">
                  <span> </span>
                </div>
                <div>
                  <h4 className="text-base font-black">Convidar Equipe Escolar</h4>
                  <p className="text-[11px] text-slate-400 font-medium">Link de acesso exclusivo para professores e coordenacao</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowInviteStaffModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30 text-emerald-900 dark:text-emerald-300 text-xs space-y-2">
              <p className="font-bold leading-relaxed">
                Envie o convite oficial da escola pelo WhatsApp para o professor ou coordenador ingressar diretamente no sistema Anjinho.
              </p>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 font-mono text-[11px] text-slate-600 dark:text-slate-300 break-all select-all">
                {window.location.origin}/?convite=equipe_docente_{Date.now().toString(36)}
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const url = `${window.location.origin}/?convite=equipe_docente`;
                  const msg = `Ola! A Diretoria da escola convida voce para acessar o Anjinho App Escolar com perfil de Equipe Docente/Coordenacao: ${url}`;
                  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
                }}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl cursor-pointer flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <span> </span> Abrir WhatsApp e Enviar Convite
              </button>

              <button
                type="button"
                onClick={() => {
                  const url = `${window.location.origin}/?convite=equipe_docente`;
                  navigator.clipboard.writeText(url);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 3000);
                }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-black text-xs rounded-xl cursor-pointer flex items-center justify-center gap-2 transition-colors"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                {copiedLink ? 'Link Copiado com Sucesso!' : 'Copiar Link de Convite'}
              </button>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100/10">
              <button
                type="button"
                onClick={() => setShowInviteStaffModal(false)}
                className="px-4 py-2 text-xs font-black text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
