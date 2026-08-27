import React, { useState, useEffect } from 'react';
import { Idoso, Usuario, Classroom, isStaffUser, isDirectorOrAdminUser } from '../types';
import { getFromDB, saveToDB, compressImage, SALAS_INICIAIS, USUARIOS_SIMULADOS, isPinUnique } from '../data';
import { VoiceInput } from './VoiceInput';
import { 
  Users, 
  Plus, 
  Shield, 
  Phone, 
  Mail, 
  Smartphone, 
  MessageSquare, 
  UserPlus, 
  Briefcase,
  Sliders,
  CheckCircle,
  HelpCircle,
  Trash2,
  Edit2,
  Camera,
  Share2,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  Search,
  LayoutGrid,
  List,
  X,
  Filter
} from 'lucide-react';

interface FamilySectionProps {
  key?: any;
  idoso: Idoso;
  usuarioAtual: Usuario;
  accessibilitySettings: {
    fontSize: 'normal' | 'grande' | 'gigante';
    simplifiedMode: boolean;
    darkMode: boolean;
  };
  keyTrigger: number;
}

const mockAvatars = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=150',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150'
];

export default function FamilySection({ 
  idoso, 
  usuarioAtual, 
  accessibilitySettings,
  keyTrigger 
}: FamilySectionProps) {
  const appMode = localStorage.getItem('anjo_app_mode') || 'idoso';
  const isEscolar = appMode === 'escolar_infantil' || appMode === 'escolar_fundamental';
  const cleanStudentName = idoso.nome.includes(' (') ? idoso.nome.split(' (')[0] : idoso.nome;
  const [integrantes, setIntegrantes] = useState<Usuario[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'todos' | 'familiar' | 'educador' | 'direcao' | 'especialista'>('todos');
  const [viewMode, setViewMode] = useState<'completo' | 'reduzido'>('completo');
  
  const [newMember, setNewMember] = useState({
    nome: '',
    email: '',
    telefone: '',
    tipo: 'familiar' as any,
    parentesco: 'Filho(a)',
    observacoes: '',
    foto: '',
    pin: '',
    salaAula: 'Todas',
    alertaAtrasados: true,
    alertaMedica: true,
    alertaVitas: false,
    alertaCheck: true
  });

  const [editMemberForm, setEditMemberForm] = useState({
    id: '',
    nome: '',
    email: '',
    telefone: '',
    tipo: 'familiar' as any,
    parentesco: '',
    observacoes: '',
    foto: '',
    pin: '',
    salaAula: 'Todas'
  });

  const [notifConfig, setNotifConfig] = useState<{ [key: string]: any }>({});

  const [classrooms, setClassrooms] = useState<Classroom[]>(() => {
    return getFromDB<Classroom[]>('anjo_salas', SALAS_INICIAIS);
  });
  const [selectedAddRooms, setSelectedAddRooms] = useState<string[]>([]);
  const [selectedEditRooms, setSelectedEditRooms] = useState<string[]>([]);

  // States for Invitation Link features (informational & simulation)
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [inviteRole, setInviteRole] = useState<string>('familiar');
  const [inviteClass, setInviteClass] = useState<string>('Todas');
  const [inviteParentesco, setInviteParentesco] = useState<string>('Mãe / Responsável');
  const [inviteRecipientName, setInviteRecipientName] = useState<string>('');
  const [inviteRecipientPhone, setInviteRecipientPhone] = useState<string>('');
  const [inviteSimulateActive, setInviteSimulateActive] = useState(false);

  // Hierarchy permission flags based on logged-in user (usuarioAtual)
  const uRole = (usuarioAtual?.tipo || '').toLowerCase();
  const uName = (usuarioAtual?.nome || '').toLowerCase();
  const uId = (usuarioAtual?.id || '').toLowerCase();
  const isMasterActive = localStorage.getItem('anjo_master_demonstracao_ativo') === 'true';

  const isDirectorOrAdmin = isDirectorOrAdminUser(usuarioAtual) || isMasterActive || uRole === 'diretor' || uRole === 'diretora' || uRole === 'admin' || uId === 'user_admin' || uName.includes('diretor') || uName.includes('diretora');
  const isCoord = isDirectorOrAdmin || uRole === 'coordenador' || uRole === 'coordenadora' || uName.includes('coordenad') || uId === 'user_medico_1';
  const isStaff = isStaffUser(usuarioAtual) || isCoord;

  const canInviteDev = uRole === 'desenvolvedor' || uRole === 'dev' || uRole === 'developer' || uName.includes('dev') || uId.includes('dev');
  const canInviteDiretor = canInviteDev || isDirectorOrAdmin;
  const canInviteCoordenador = isDirectorOrAdmin || canInviteDiretor;
  const canInviteProfessor = isStaff || isCoord;
  const canInviteFamiliarAdmin = true;
  const canInviteFamiliarConvidado = true;

  // Auto-set top allowed invite role when modal opens
  useEffect(() => {
    if (showInviteModal) {
      if (canInviteDev) setInviteRole('desenvolvedor');
      else if (canInviteCoordenador) setInviteRole('coordenador');
      else if (canInviteProfessor) setInviteRole('cuidador');
      else if (canInviteFamiliarAdmin) setInviteRole('familiar');
      else setInviteRole('familiar_convidado');
    }
  }, [showInviteModal, canInviteDev, canInviteCoordenador, canInviteProfessor, canInviteFamiliarAdmin]);

  const [simulationForm, setSimulationForm] = useState({
    nome: '',
    telefone: '',
    pin: '',
    email: '',
    parentesco: ''
  });

  const handleCopyInviteLink = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const getInviteAcessoLabel = () => {
    if (inviteRole === 'desenvolvedor') {
      return '  Desenvolvedor do Sistema';
    }
    if (inviteRole === 'diretor') {
      return '  Diretor(a) Geral';
    }
    if (inviteRole === 'coordenador') {
      return ' 🏫 Coordenador(a) Escolar' + (inviteClass !== 'Todas' ? ` (${inviteClass})` : '');
    }
    if (inviteRole === 'cuidador' || inviteRole === 'professor') {
      return (isEscolar ? ' 🏫 Professor(a) Titular' : 'Cuidador de Plantão') + (inviteClass !== 'Todas' ? ` (${inviteClass})` : '');
    }
    if (inviteRole === 'profissional') {
      return '🩺 Profissional de Saúde / Especialista (Médico, Fonoaudiólogo, Psicólogo, Pediatra, Terapeuta)';
    }
    if (inviteRole === 'familiar' || inviteRole === 'familiar_admin') {
      return (inviteParentesco || 'Responsável') + ' •     Familiar Admin (Com Autorizações)';
    }
    if (inviteRole === 'familiar_convidado') {
      return (inviteParentesco || 'Parente') + ' •   Familiar Convidado (Somente Leitura)';
    }
    return 'Profissional / Convidado';
  };

  const handleCompleteInviteSimulation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulationForm.nome.trim() || !simulationForm.telefone.trim()) {
      alert('Por favor, preencha o nome e o celular de quem está aceitando o convite.');
      return;
    }

    const phoneDigits = simulationForm.telefone.replace(/\D/g, '');
    const fallbackPin = simulationForm.pin || (phoneDigits.length >= 4 ? phoneDigits.slice(-4) : '1234');

    // Validate PIN uniqueness
    const pinCheck = isPinUnique(fallbackPin);
    if (!pinCheck.isUnique) {
      alert(`⚠ O PIN "${fallbackPin}" já pertence a outro integrante (${pinCheck.conflictingUser?.nome}). Cada pessoa deve possuir um PIN exclusivo de 4 dígitos. Por favor, escolha outro PIN.`);
      return;
    }

    let finalType: string = inviteRole;
    let finalParentesco: string | undefined = undefined;

    if (inviteRole === 'desenvolvedor') {
      finalType = 'desenvolvedor';
      finalParentesco = 'Desenvolvedor';
    } else if (inviteRole === 'diretor') {
      finalType = 'diretor';
      finalParentesco = 'Direção Geral';
    } else if (inviteRole === 'coordenador') {
      finalType = 'coordenador';
      finalParentesco = 'Coordenação Pedagógica';
    } else if (inviteRole === 'cuidador' || inviteRole === 'professor') {
      finalType = 'professor';
      finalParentesco = isEscolar ? 'Professor(a) / Educador(a)' : 'Cuidador(a)';
    } else if (inviteRole === 'profissional') {
      finalType = 'profissional';
      finalParentesco = simulationForm.parentesco || 'Especialista de Saúde (Médico/Fono/Psico/Terapeuta)';
    } else if (inviteRole === 'familiar' || inviteRole === 'familiar_admin') {
      finalType = 'familiar_admin';
      finalParentesco = simulationForm.parentesco || inviteParentesco || 'Mãe / Responsável';
    } else if (inviteRole === 'familiar_convidado') {
      finalType = 'familiar_convidado';
      finalParentesco = (simulationForm.parentesco || inviteParentesco || 'Outro Parente') + ' (Convidado)';
    }

    const novoUsuario: Usuario = {
      id: 'usr_' + Date.now(),
      nome: simulationForm.nome.trim(),
      email: simulationForm.email.trim() || 'sem_email@anjo.com',
      telefone: simulationForm.telefone.trim(),
      tipo: finalType as any,
      parentesco: finalParentesco,
      foto: mockAvatars[Math.floor(Math.random() * mockAvatars.length)],
      pin: fallbackPin,
      salaAula: (finalType === 'professor' || finalType === 'coordenador') ? inviteClass : 'Todas',
      observacoes: `Cadastrado via link de convite rápido por ${usuarioAtual.nome}.`
    };

    const allUsers = getFromDB<Usuario[]>('anjo_usuarios', []);
    allUsers.push(novoUsuario);
    saveToDB('anjo_usuarios', allUsers);

    // Save alert configs
    const currentConfigs = { ...notifConfig };
    currentConfigs[novoUsuario.id] = {
      atrasos: true,
      medicamentos: true,
      vitais: true,
      resumo: true
    };
    localStorage.setItem('anjo_alerta_configs', JSON.stringify(currentConfigs));
    setNotifConfig(currentConfigs);

    // Clean up
    setSimulationForm({ nome: '', telefone: '', pin: '', email: '', parentesco: '' });
    setInviteSimulateActive(false);
    setShowInviteModal(false);
    loadMembers();

    // Dispatch global sync event
    window.dispatchEvent(new CustomEvent('anjo_user_updated'));
    alert(`  Sucesso! O perfil de ${novoUsuario.nome} (${finalParentesco || finalType}) foi ativado e já está vinculado ao aluno(a) ${cleanStudentName}!`);
  };

  useEffect(() => {
    loadMembers();

    const handleSync = () => {
      loadMembers();
    };

    window.addEventListener('anjo_user_updated', handleSync);
    window.addEventListener('anjo_idosos_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('anjo_user_updated', handleSync);
      window.removeEventListener('anjo_idosos_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [idoso, keyTrigger]);

  const loadMembers = () => {
    let allUsers = getFromDB<Usuario[]>('anjo_usuarios', USUARIOS_SIMULADOS);
    if (!allUsers || allUsers.length === 0) {
      allUsers = USUARIOS_SIMULADOS;
      saveToDB('anjo_usuarios', allUsers);
    }
    setIntegrantes(allUsers);
    
    // Alert configs per relative
    let savedConfigs = localStorage.getItem('anjo_alerta_configs');
    if (!savedConfigs) {
      const initialConfigs = {
        'user_admin': { atrasos: true, medicamentos: true, vitais: true, resumo: true },
        'user_cuidador_1': { atrasos: true, medicamentos: true, vitais: false, resumo: false },
        'user_cuidador_2': { atrasos: true, medicamentos: false, vitais: false, resumo: true },
        'user_medico_1': { atrasos: false, medicamentos: false, vitais: true, resumo: false }
      };
      localStorage.setItem('anjo_alerta_configs', JSON.stringify(initialConfigs));
      setNotifConfig(initialConfigs);
    } else {
      setNotifConfig(JSON.parse(savedConfigs));
    }
  };

  const handlePhotoUploadForAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 200, 200, 0.4);
        setNewMember(prev => ({ ...prev, foto: compressed }));
      } catch (err) {
        console.error('Erro ao comprimir foto, usando fallback:', err);
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            const res = typeof reader.result === 'string' ? reader.result : '';
            setNewMember(prev => ({ ...prev, foto: res }));
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handlePhotoUploadForEdit = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 200, 200, 0.4);
        setEditMemberForm(prev => ({ ...prev, foto: compressed }));
      } catch (err) {
        console.error('Erro ao comprimir foto, usando fallback:', err);
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            const res = typeof reader.result === 'string' ? reader.result : '';
            setEditMemberForm(prev => ({ ...prev, foto: res }));
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.nome || !newMember.telefone) {
      alert('Favor inserir nome e telefone do novo integrante.');
      return;
    }

    const phoneDigits = newMember.telefone.replace(/\D/g, '');
    const fallbackPin = newMember.pin || (phoneDigits.length >= 4 ? phoneDigits.slice(-4) : '1234');

    // Validate PIN uniqueness
    const pinCheck = isPinUnique(fallbackPin);
    if (!pinCheck.isUnique) {
      alert(`⚠ O PIN "${fallbackPin}" já pertence a outro integrante (${pinCheck.conflictingUser?.nome}). Cada pessoa deve ter seu próprio PIN exclusivo. Por favor, escolha outro PIN.`);
      return;
    }

    const calculatedSala = (newMember.tipo === 'cuidador' || newMember.tipo === 'profissional' || newMember.tipo === 'professor' || newMember.tipo === 'professora' || newMember.tipo === 'educador' || newMember.tipo === 'educadora' || isStaffUser(newMember)) 
      ? (selectedAddRooms.length === 0 ? 'Todas' : selectedAddRooms.join(',')) 
      : 'Todas';

    const novoUsuario: Usuario = {
      id: 'usr_' + Date.now(),
      nome: newMember.nome,
      email: newMember.email || 'sem_email@anjo.com',
      telefone: newMember.telefone,
      tipo: newMember.tipo,
      parentesco: newMember.tipo === 'familiar' || newMember.tipo === 'admin' ? newMember.parentesco : undefined,
      foto: newMember.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150', // standard avatar placeholder
      observacoes: newMember.observacoes,
      pin: fallbackPin,
      salaAula: calculatedSala
    };

    const allUsers = getFromDB<Usuario[]>('anjo_usuarios', []);
    allUsers.push(novoUsuario);
    saveToDB('anjo_usuarios', allUsers);

    // Save alerts configs
    const currentConfigs = { ...notifConfig };
    currentConfigs[novoUsuario.id] = {
      atrasos: newMember.alertaAtrasados,
      medicamentos: newMember.alertaMedica,
      vitais: newMember.alertaVitas,
      resumo: newMember.alertaCheck
    };
    localStorage.setItem('anjo_alerta_configs', JSON.stringify(currentConfigs));
    setNotifConfig(currentConfigs);

    setNewMember({
      nome: '',
      email: '',
      telefone: '',
      tipo: 'familiar',
      parentesco: 'Filho(a)',
      observacoes: '',
      foto: '',
      pin: '',
      salaAula: 'Todas',
      alertaAtrasados: true,
      alertaMedica: true,
      alertaVitas: false,
      alertaCheck: true
    });
    setSelectedAddRooms([]);

    setShowAddModal(false);
    loadMembers();
    
    // Dispatch custom event to let other components know the user list has updated
    window.dispatchEvent(new CustomEvent('anjo_user_updated'));

    alert('Integrante cadastrado com sucesso!');
  };

  const handleToggleIndividualAlert = (userId: string, alertType: string) => {
    const backup = { ...notifConfig };
    if (!backup[userId]) {
      backup[userId] = { atrasos: true, medicamentos: true, vitais: false, resumo: false };
    }
    backup[userId][alertType] = !backup[userId][alertType];
    setNotifConfig(backup);
    localStorage.setItem('anjo_alerta_configs', JSON.stringify(backup));
  };

  const handleRemoveMember = (userId: string) => {
    if (userId === usuarioAtual.id) {
      alert('Você não pode apagar o seu próprio usuário de simulação ativo!');
      return;
    }
    if (confirm(isEscolar ? 'Tem certeza que deseja desvincular este integrante do plano escolar do aluno?' : 'Tem certeza que deseja desvincular este integrante do plano do idoso?')) {
      const allUsers = getFromDB<Usuario[]>('anjo_usuarios', []);
      const filtered = allUsers.filter(u => u.id !== userId);
      saveToDB('anjo_usuarios', filtered);
      loadMembers();
      
      // Dispatch custom event to let other components know the user list has updated
      window.dispatchEvent(new CustomEvent('anjo_user_updated'));
    }
  };

  const handleEditClick = (user: Usuario) => {
    setEditingMemberId(user.id);
    const roomsArray = user.salaAula && user.salaAula !== 'Todas' ? user.salaAula.split(',') : [];
    setSelectedEditRooms(roomsArray);
    setEditMemberForm({
      id: user.id,
      nome: user.nome,
      email: user.email === 'sem_email@anjo.com' ? '' : user.email,
      telefone: user.telefone,
      tipo: user.tipo,
      parentesco: user.parentesco || '',
      observacoes: user.observacoes || '',
      foto: user.foto || '',
      pin: user.pin || '1234',
      salaAula: user.salaAula || 'Todas'
    });
    setShowEditModal(true);
  };

  const handleUpdateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMemberForm.nome.trim() || !editMemberForm.telefone.trim()) {
      alert('Favor preencher nome e telefone do integrante.');
      return;
    }

    const editPhoneDigits = editMemberForm.telefone.replace(/\D/g, '');
    const editFallbackPin = editMemberForm.pin || (editPhoneDigits.length >= 4 ? editPhoneDigits.slice(-4) : '1234');

    // Validate PIN uniqueness excluding current member
    const pinCheck = isPinUnique(editFallbackPin, editingMemberId || undefined);
    if (!pinCheck.isUnique) {
      alert(`⚠ O PIN "${editFallbackPin}" já está em uso por ${pinCheck.conflictingUser?.nome}. Cada integrante deve possuir seu próprio PIN de acesso. Por favor, digite um PIN exclusivo.`);
      return;
    }

    const calculatedSala = (editMemberForm.tipo === 'cuidador' || editMemberForm.tipo === 'profissional' || editMemberForm.tipo === 'professor' || editMemberForm.tipo === 'professora' || editMemberForm.tipo === 'educador' || editMemberForm.tipo === 'educadora' || isStaffUser(editMemberForm)) 
      ? (selectedEditRooms.length === 0 ? 'Todas' : selectedEditRooms.join(',')) 
      : 'Todas';

    const allUsers = getFromDB<Usuario[]>('anjo_usuarios', []);
    const updated = allUsers.map(u => {
      if (u.id === editingMemberId) {
        return {
          ...u,
          nome: editMemberForm.nome.trim(),
          email: editMemberForm.email ? editMemberForm.email.trim() : 'sem_email@anjo.com',
          telefone: editMemberForm.telefone.trim(),
          tipo: editMemberForm.tipo,
          parentesco: editMemberForm.parentesco ? editMemberForm.parentesco.trim() : undefined,
          observacoes: editMemberForm.observacoes ? editMemberForm.observacoes.trim() : undefined,
          foto: editMemberForm.foto,
          pin: editFallbackPin,
          salaAula: calculatedSala
        };
      }
      return u;
    });

    saveToDB('anjo_usuarios', updated);
    
    // Also update current active user session if we updated current user
    if (editingMemberId === usuarioAtual?.id || (usuarioAtual?.nome && usuarioAtual.nome.toLowerCase().includes(editMemberForm.nome.trim().toLowerCase()))) {
      const updatedSelf = updated.find(u => u.id === editingMemberId);
      if (updatedSelf) {
        localStorage.setItem('anjo_simulacao_user_id', updatedSelf.id);
        window.dispatchEvent(new CustomEvent('anjo_user_updated', { detail: updatedSelf }));
      }
    }

    setShowEditModal(false);
    setEditingMemberId(null);
    loadMembers();
    
    // Dispatch custom event to let other components know the user list has updated
    window.dispatchEvent(new CustomEvent('anjo_user_updated'));
    
    alert('Cadastro atualizado com sucesso!');
  };

  const getTipoPermissaoLabel = (user: Usuario) => {
    const tipo = user.tipo;
    const sala = user.salaAula || 'Todas';
    if (isEscolar) {
      switch (tipo) {
        case 'admin':
          return { text: 'Responsável Financeiro / Admin', desc: 'Pode visualizar tudo, cadastrar professores, editar agenda escolar e receber todos os comunicados.', color: 'text-indigo-700 bg-indigo-50 border-indigo-250' };
        case 'familiar':
          return { text: 'Pais / Responsáveis', desc: 'Pode acompanhar o diário de aula, receber comunicados via WhatsApp e acompanhar a rotina escolar diária.', color: 'text-emerald-700 bg-emerald-50 border-emerald-250' };
        case 'cuidador':
          return { text: 'Professor(a) Titular', desc: 'Pode registrar a agenda diária de sono, alimentação, trocas de fralda, mamadeiras e fotos da classe.', color: 'text-amber-700 bg-amber-50 border-amber-250' };
        case 'profissional':
          if (sala === 'Todas') {
            return { text: 'Diretor(a) Geral', desc: 'Acesso total e irrestrito a todas as turmas, relatórios de saúde, agendamentos pedagógicos e avisos no mural.', color: 'text-violet-700 bg-violet-50 border-violet-200' };
          } else {
            return { text: 'Coordenador(a) Escolar', desc: 'Acesso completo a relatórios, agendamentos e diários das salas específicas de sua coordenação.', color: 'text-sky-700 bg-sky-50 border-sky-150' };
          }
        default:
          return { text: 'Responsável Secundário', desc: 'Visualização parcial da rotina do aluno.', color: 'text-slate-700 bg-slate-50 border-slate-200' };
      }
    }

    switch (tipo) {
      case 'admin':
        return { text: 'Administrador da Família', desc: 'Pode visualizar tudo, cadastrar cuidadores, editar medicação e receber todos os alertas.', color: 'text-indigo-700 bg-indigo-50 border-indigo-250' };
      case 'familiar':
        return { text: 'Familiar Acompanhante', desc: 'Pode visualizar relatórios da rotina, receber alertas de WhatsApp e acompanhar o dia.', color: 'text-emerald-700 bg-emerald-50 border-emerald-250' };
      case 'cuidador':
        return { text: 'Cuidador de Plantão', desc: 'Pode registrar medicamentos tomados, banhos, refeições, hidratação e notas de humor.', color: 'text-amber-700 bg-amber-50 border-amber-250' };
      case 'profissional':
        return { text: 'Profissional de Saúde', desc: 'Acesso cirúrgico a relatórios vitais históricos, medicação ativa e agenda de consultas.', color: 'text-sky-700 bg-sky-50 border-sky-150' };
      default:
        return { text: 'Acompanhante Simples', desc: 'Visualização parcial.', color: 'text-slate-700 bg-slate-50 border-slate-200' };
    }
  };

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 p-5 sm:p-6 rounded-3xl text-white shadow-md border border-indigo-500/20 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-indigo-200 text-xs font-black uppercase tracking-wider">
            <Users className="w-3.5 h-3.5 text-indigo-300" />
            {isEscolar ? 'Rede de Confiança & Diário Escolar' : 'Rede de Apoio & Cuidados'}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            {isEscolar ? 'Vínculo Familiar, Pais e Equipe Escolar' : 'Vínculo Familiar e Cuidadores'}
          </h2>
          <p className="text-xs sm:text-sm text-indigo-100/80 leading-relaxed">
            {isEscolar
              ? `Cadastre pais, mães, responsáveis, educadoras e coordenação para acompanhar o diário de ${cleanStudentName} em tempo real.`
              : `Cadastre familiares e cuidadores autorizados para acompanhar a rotina e o plano de cuidados de ${idoso.nome}.`}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          <button 
            type="button"
            id="btn_convidar_whatsapp_familia"
            onClick={() => setShowInviteModal(true)}
            className="px-5 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black rounded-2xl transition-all shadow-lg hover:shadow-emerald-500/30 active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer text-xs sm:text-sm"
          >
            <Share2 className="w-4 h-4 text-emerald-950 stroke-[2.5]" />
            <span>Convidar via WhatsApp</span>
          </button>
          <button 
            type="button"
            id="btn_cadastrar_manual_familia"
            onClick={() => setShowAddModal(true)}
            className="px-5 py-3.5 bg-white hover:bg-slate-100 text-indigo-950 font-black rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer text-xs sm:text-sm"
          >
            <UserPlus className="w-4 h-4 text-indigo-700 stroke-[2.5]" />
            <span>Cadastrar Manualmente</span>
          </button>
        </div>
      </div>

      
      <div className={`p-4 rounded-2xl border flex flex-col gap-3.5 ${
        accessibilitySettings.darkMode
          ? 'bg-slate-900 border-slate-800'
          : 'bg-white border-soft-gray shadow-3xs'
      }`}>
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          <div className="relative w-full md:max-w-lg flex items-center">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 pointer-events-none" />
            <input
              type="text"
              placeholder={isEscolar ? "Busca rápida: digite nome, cargo, parentesco, sala ou telefone..." : "Busca rápida: digite nome, parentesco ou telefone..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-20 py-2.5 text-xs font-bold rounded-xl border focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${
                accessibilitySettings.darkMode
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400'
                  : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 shadow-inner'
              }`}
            />

            <div className="absolute right-2.5 flex items-center gap-1">
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-all cursor-pointer"
                  title="Limpar busca"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              <VoiceInput
                onTranscript={(text) => setSearchTerm(text)}
                size="sm"
              />
            </div>
          </div>

          
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('completo')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'completo'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Completo
            </button>
            <button
              type="button"
              onClick={() => setViewMode('reduzido')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'reduzido'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-850 dark:hover:text-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5" /> Reduzido
            </button>
          </div>
        </div>

        
        {(() => {
          const normHelper = (s: string) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
          const countFamiliar = integrantes.filter(u => {
            const t = normHelper(u.tipo);
            const p = normHelper(u.parentesco || '');
            return t === 'familiar' || t === 'familiar_admin' || t === 'familiar_convidado' || t === 'admin' || p.includes('mae') || p.includes('pai') || p.includes('filh') || p.includes('irma') || p.includes('resp') || p.includes('parente');
          }).length;

          const countEducador = integrantes.filter(u => {
            const t = normHelper(u.tipo);
            const p = normHelper(u.parentesco || '');
            return t === 'professor' || t === 'professora' || t === 'cuidador' || t === 'educador' || t === 'educadora' || t === 'estagiaria' || p.includes('prof') || p.includes('cuidado') || p.includes('educad');
          }).length;

          const countDirecao = integrantes.filter(u => {
            const t = normHelper(u.tipo);
            const p = normHelper(u.parentesco || '');
            return t === 'diretor' || t === 'diretora' || t === 'coordenador' || t === 'coordenadora' || t === 'desenvolvedor' || t === 'dev' || p.includes('dire') || p.includes('coord') || p.includes('gestao') || p.includes('dev');
          }).length;

          const countEspecialistas = integrantes.filter(u => {
            const t = normHelper(u.tipo);
            const p = normHelper(u.parentesco || '');
            return t === 'profissional' || t === 'medico' || p.includes('med') || p.includes('fono') || p.includes('psico') || p.includes('terap') || p.includes('nutri');
          }).length;

          return (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px] font-bold">
              <span className="text-slate-400 shrink-0 text-[10px] uppercase font-black tracking-wider mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3 text-indigo-500" /> Filtrar:
              </span>
              <button
                type="button"
                onClick={() => setSelectedRoleFilter('todos')}
                className={`px-3 py-1 rounded-xl transition-all shrink-0 cursor-pointer ${
                  selectedRoleFilter === 'todos'
                    ? 'bg-indigo-600 text-white shadow-xs font-black'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Todos ({integrantes.length})
              </button>

              <button
                type="button"
                onClick={() => setSelectedRoleFilter('familiar')}
                className={`px-3 py-1 rounded-xl transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                  selectedRoleFilter === 'familiar'
                    ? 'bg-indigo-600 text-white shadow-xs font-black'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <span>    Familiares</span>
                <span className="text-[10px] opacity-80">({countFamiliar})</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRoleFilter('educador')}
                className={`px-3 py-1 rounded-xl transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                  selectedRoleFilter === 'educador'
                    ? 'bg-indigo-600 text-white shadow-xs font-black'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <span> 🏫 Educadores</span>
                <span className="text-[10px] opacity-80">({countEducador})</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRoleFilter('direcao')}
                className={`px-3 py-1 rounded-xl transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                  selectedRoleFilter === 'direcao'
                    ? 'bg-indigo-600 text-white shadow-xs font-black'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <span>  Direção & Coord.</span>
                <span className="text-[10px] opacity-80">({countDirecao})</span>
              </button>

              {countEspecialistas > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedRoleFilter('especialista')}
                  className={`px-3 py-1 rounded-xl transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                    selectedRoleFilter === 'especialista'
                      ? 'bg-indigo-600 text-white shadow-xs font-black'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <span>🩺 Especialistas</span>
                  <span className="text-[10px] opacity-80">({countEspecialistas})</span>
                </button>
              )}
            </div>
          );
        })()}
      </div>

      
      {(() => {
        const norm = (s: string) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        
        const filteredIntegrantes = integrantes.filter(user => {
          const uType = norm(user.tipo || '');
          const uParentesco = norm(user.parentesco || '');

          // 1. Role category filter
          if (selectedRoleFilter === 'familiar') {
            const isFam = uType === 'familiar' || uType === 'familiar_admin' || uType === 'familiar_convidado' || uType === 'admin' || uParentesco.includes('mae') || uParentesco.includes('pai') || uParentesco.includes('filh') || uParentesco.includes('irma') || uParentesco.includes('resp') || uParentesco.includes('parente');
            if (!isFam) return false;
          } else if (selectedRoleFilter === 'educador') {
            const isEdu = uType === 'professor' || uType === 'professora' || uType === 'cuidador' || uType === 'educador' || uType === 'educadora' || uType === 'estagiaria' || uParentesco.includes('prof') || uParentesco.includes('cuidado') || uParentesco.includes('educad');
            if (!isEdu) return false;
          } else if (selectedRoleFilter === 'direcao') {
            const isDir = uType === 'diretor' || uType === 'diretora' || uType === 'coordenador' || uType === 'coordenadora' || uType === 'desenvolvedor' || uType === 'dev' || uParentesco.includes('dire') || uParentesco.includes('coord') || uParentesco.includes('gestao') || uParentesco.includes('dev');
            if (!isDir) return false;
          } else if (selectedRoleFilter === 'especialista') {
            const isEsp = uType === 'profissional' || uType === 'medico' || uParentesco.includes('med') || uParentesco.includes('fono') || uParentesco.includes('psico') || uParentesco.includes('terap') || uParentesco.includes('nutri');
            if (!isEsp) return false;
          }

          // 2. Text Search filter
          const termNorm = norm(searchTerm.trim());
          if (!termNorm) return true;
          
          const nameMatch = norm(user.nome).includes(termNorm);
          const rawPhone = user.telefone || '';
          const phoneDigits = rawPhone.replace(/\D/g, '');
          const searchDigits = termNorm.replace(/\D/g, '');
          const phoneMatch = (searchDigits.length >= 2 && phoneDigits.includes(searchDigits)) || norm(rawPhone).includes(termNorm);
          const emailMatch = norm(user.email || '').includes(termNorm);
          const parentescoMatch = uParentesco.includes(termNorm);
          const uName = norm(user.nome);
          const obsMatch = norm(user.observacoes || '').includes(termNorm);
          
          const tipoMatch = uType.includes(termNorm) ||
            (termNorm.includes('diret') && (uType === 'diretor' || uType === 'diretora' || uType === 'admin' || uName.includes('nilva'))) ||
            (termNorm.includes('prof') && (uType === 'cuidador' || uType === 'professor' || uType === 'professora' || uType === 'educador')) ||
            ((termNorm.includes('mae') || termNorm.includes('maes') || termNorm.includes('pai') || termNorm.includes('pais') || termNorm.includes('resp') || termNorm.includes('fam') || termNorm.includes('admin')) && (uType === 'familiar' || uType === 'admin' || uParentesco.includes('mae') || uParentesco.includes('pai') || uParentesco.includes('resp') || uParentesco.includes('admin'))) ||
            (termNorm.includes('estag') && (uType === 'cuidador' || uType === 'estagiaria' || uType === 'assistente')) ||
            (termNorm.includes('coord') && (uType === 'profissional' || uType === 'coordenador' || uType === 'coordenadora'));
          const salaMatch = norm(user.salaAula || '').includes(termNorm);
          
          return nameMatch || phoneMatch || emailMatch || parentescoMatch || tipoMatch || salaMatch || obsMatch;
        });

        if (filteredIntegrantes.length === 0) {
          return (
            <div className={`p-10 rounded-2xl border text-center space-y-3 ${
              accessibilitySettings.darkMode
                ? 'bg-slate-900/60 border-slate-800'
                : 'bg-slate-50 border-slate-150'
            }`}>
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg mx-auto">
                 
              </div>
              <h4 className="font-bold text-slate-800 dark:text-white">Nenhum integrante encontrado</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Sua busca por "{searchTerm}" não retornou nenhum familiar, professor ou cuidador{selectedRoleFilter !== 'todos' ? ` na categoria "${selectedRoleFilter}"` : ''}. Tente buscar por outro termo ou limpe os filtros.
              </p>
              <div className="flex items-center justify-center gap-3">
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="text-xs font-black text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                  >
                    Limpar Texto de Busca
                  </button>
                )}
                {selectedRoleFilter !== 'todos' && (
                  <button
                    type="button"
                    onClick={() => setSelectedRoleFilter('todos')}
                    className="text-xs font-black text-slate-600 dark:text-slate-300 hover:underline cursor-pointer"
                  >
                    Mostrar Todos
                  </button>
                )}
              </div>
            </div>
          );
        }

        return (
          <div className={`grid gap-6 ${
            viewMode === 'reduzido'
              ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
              : 'grid-cols-1 lg:grid-cols-2'
          }`}>
            {filteredIntegrantes.map(user => {
              const perm = getTipoPermissaoLabel(user);
              const alerts = notifConfig[user.id] || { atrasos: false, medicamentos: false, vitais: false, resumo: false };
              
              if (viewMode === 'reduzido') {
                return (
                  <div 
                    key={user.id}
                    className={`rounded-2xl border p-4 flex flex-col justify-between gap-4 hover:border-indigo-400 dark:hover:border-indigo-800 transition-all hover:shadow-xs ${
                      accessibilitySettings.darkMode
                        ? 'bg-slate-900 border-slate-800 text-white'
                        : 'bg-white border-soft-gray text-slate-800 shadow-2xs'
                    }`}
                  >
                    <div className="space-y-3">
                      
                      <div className="flex items-start gap-3">
                        <img 
                          referrerPolicy="no-referrer"
                          src={user.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'} 
                          alt={user.nome} 
                          className="w-11 h-11 rounded-full object-cover border-2 border-slate-200 shrink-0 shadow-3xs"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5 flex-wrap leading-tight">
                            <span className="truncate">{user.nome}</span>
                            {user.parentesco && (
                              <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-extrabold px-1.5 py-0.5 rounded shrink-0">
                                {user.parentesco}
                              </span>
                            )}
                          </h4>
                          <p className="text-xs text-slate-550 dark:text-slate-400 flex items-center gap-1 mt-1 font-medium">
                            <Smartphone className="w-3 h-3 text-slate-400 shrink-0" /> 
                            <strong className="text-slate-850 dark:text-slate-200">{user.telefone}</strong>
                          </p>
                        </div>
                      </div>

                      
                      <div className="flex flex-wrap gap-1 items-center">
                        
                        <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-md border uppercase tracking-wider ${perm.color}`}>
                          <Shield className="w-2.5 h-2.5" /> {perm.text.split(' / ')[0]}
                        </span>

                        
                        {isEscolar && (
                          user.salaAula && user.salaAula !== 'Todas' ? (
                            <span className="inline-flex items-center gap-1 text-[9px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 font-black px-2 py-0.5 rounded-md border border-indigo-150 uppercase tracking-wider">
                              🏫 {user.salaAula.split(',')[0]} {user.salaAula.split(',').length > 1 ? `+${user.salaAula.split(',').length - 1}` : ''}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-450 font-extrabold px-2 py-0.5 rounded-md border border-slate-200/60 uppercase tracking-wider">
                              🏫 Geral
                            </span>
                          )
                        )}

                        
                        <span className="inline-flex items-center gap-1 text-[9px] bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 text-amber-800 dark:text-amber-400 font-mono font-bold px-1.5 py-0.5 rounded-md">
                            {user.pin || '1234'}
                        </span>
                      </div>
                    </div>

                    
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-2.5 flex items-center justify-between">
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 truncate max-w-[120px] font-medium">
                        {user.email && user.email !== 'sem_email@anjo.com' ? user.email : 'Sem e-mail'}
                      </span>
                      
                      <div className="flex items-center gap-1 shrink-0">
                        <button 
                          onClick={() => handleEditClick(user)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                          title="Editar informações do integrante"
                          id={`btn-edit-compact-${user.id}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleRemoveMember(user.id)}
                          className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-350 hover:text-rose-600 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                          title="Remover integrante"
                          id={`btn-remove-compact-${user.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div 
                  key={user.id}
                  className="bg-white rounded-2xl border border-soft-gray p-5 flex flex-col md:flex-row justify-between gap-4 hover:border-slate-300 transition-colors"
                >
                  <div className="space-y-3 flex-1">
                    
                    <div className="flex items-start gap-3">
                      <img 
                        referrerPolicy="no-referrer"
                        src={user.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'} 
                        alt={user.nome} 
                        className="w-12 h-12 rounded-full object-cover border-2 border-slate-200"
                      />
                      <div>
                        <h4 className="text-base font-bold text-slate-800 flex items-center gap-1.5 flex-wrap">
                          {user.nome}
                          {user.parentesco && (
                            <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded">
                              {user.parentesco}
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-slate-550 flex items-center gap-1">
                          <Smartphone className="w-3 h-3" /> WhatsApp: <strong className="text-zinc-805 font-bold">{user.telefone}</strong>
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {user.salaAula && user.salaAula !== 'Todas' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-indigo-50 text-indigo-700 font-black px-2 py-0.5 rounded-full border border-indigo-150 uppercase tracking-wider">
                              🏫 Salas: {user.salaAula.split(',').join(' | ')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-slate-100 text-slate-600 font-extrabold px-2 py-0.5 rounded-full border border-slate-200/60 uppercase tracking-wider">
                              🏫 Todas as Salas / Geral
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Email: {user.email}
                        </p>
                      </div>
                    </div>

                    
                    <div className={`p-3 rounded-xl border ${perm.color} space-y-1`}>
                      <div className="flex items-center gap-1 font-bold text-xs uppercase tracking-wider">
                        <Shield className="w-3.5 h-3.5" /> {perm.text}
                      </div>
                      <p className="text-[11px] leading-relaxed font-medium">
                        {perm.desc}
                      </p>
                    </div>

                    
                    <div className="flex items-center gap-1.5 text-[11px] bg-amber-50 border border-amber-200 rounded-xl p-2.5 font-bold text-amber-800">
                      <span>  PIN de Acesso:</span>
                      <span className="font-mono bg-white px-2 py-0.5 rounded text-xs tracking-wider select-all shadow-xs border border-amber-200">
                        {user.pin || '1234'}
                      </span>
                      <span className="text-[10px] text-amber-600 font-normal">(use para entrar no app)</span>
                    </div>

                    {user.observacoes && (
                      <p className="text-xs text-slate-500 font-medium">
                        Notas: "{user.observacoes}"
                      </p>
                    )}
                  </div>

                  
                  <div className="md:w-56 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4 flex flex-col justify-between">
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">
                        {isEscolar ? 'Regras para comunicados WhatsApp:' : 'Regras para alertas WhatsApp:'}
                      </span>
                      
                      <div className="space-y-1 text-xs font-semibold">
                        <label className="flex items-center justify-between text-slate-700 p-1 hover:bg-slate-50 rounded cursor-pointer select-none">
                          <span>{isEscolar ? 'Rotinas Pendentes / Avisos' : 'Tarefas Atrasadas'}</span>
                          <input 
                            type="checkbox" 
                            checked={!!alerts.atrasos}
                            onChange={() => handleToggleIndividualAlert(user.id, 'atrasos')}
                            className="w-3.5 h-3.5 text-serene-blue rounded"
                          />
                        </label>
                        <label className="flex items-center justify-between text-slate-700 p-1 hover:bg-slate-50 rounded cursor-pointer select-none">
                          <span>{isEscolar ? 'Alimentação e Cuidados' : 'Medicamentos Tomados'}</span>
                          <input 
                            type="checkbox" 
                            checked={!!alerts.medicamentos}
                            onChange={() => handleToggleIndividualAlert(user.id, 'medicamentos')}
                            className="w-3.5 h-3.5 text-serene-blue rounded"
                          />
                        </label>
                        <label className="flex items-center justify-between text-slate-700 p-1 hover:bg-slate-50 rounded cursor-pointer select-none">
                          <span>{isEscolar ? 'Saúde, Sono e Fralda' : 'Aferição de Vitais'}</span>
                          <input 
                            type="checkbox" 
                            checked={!!alerts.vitais}
                            onChange={() => handleToggleIndividualAlert(user.id, 'vitais')}
                            className="w-3.5 h-3.5 text-serene-blue rounded"
                          />
                        </label>
                        <label className="flex items-center justify-between text-slate-700 p-1 hover:bg-slate-50 rounded cursor-pointer select-none">
                          <span>{isEscolar ? 'Diário de Aula / Resumo' : 'Resumos diários'}</span>
                          <input 
                            type="checkbox" 
                            checked={!!alerts.resumo}
                            onChange={() => handleToggleIndividualAlert(user.id, 'resumo')}
                            className="w-3.5 h-3.5 text-serene-blue rounded"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="pt-3 flex justify-end gap-1.5">
                      <button 
                        onClick={() => handleEditClick(user)}
                        className="p-1.5 hover:bg-slate-100 text-slate-450 hover:text-serene-blue rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                        title="Editar informações do integrante"
                        id={`btn-edit-${user.id}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleRemoveMember(user.id)}
                        className="p-1.5 hover:bg-rose-50 text-slate-350 hover:text-alert-red rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                        title="Remover integrante do time"
                        id={`btn-remove-${user.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        );
      })()}

      
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-2 sm:p-4 z-50 animate-fade-in overflow-y-auto">
          <div className={`rounded-3xl p-5 sm:p-6 border max-w-md w-full shadow-2xl relative space-y-4 my-auto ${
            accessibilitySettings.darkMode 
              ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-black/60' 
              : 'bg-white border-soft-gray text-slate-800 shadow-xl'
          }`}>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <UserPlus className="w-6 h-6 text-serene-blue" />
              <span>Cadastrar Novo Integrante</span>
            </h3>

            <form onSubmit={handleSaveMember} className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Nome do Integrante *</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Clara de Souza" 
                    value={newMember.nome}
                    onChange={e => setNewMember({ ...newMember, nome: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-serene-blue/20 bg-slate-50 text-sm"
                    required
                  />
                </div>

                
                <div className="space-y-2 border-t border-b border-dashed border-slate-200 py-3 my-1">
                  <label className="text-xs font-bold text-slate-700 block">Foto do Integrante</label>
                  
                  
                  <div className="space-y-1">
                    <span className="text-[10px] font-medium text-slate-500 block">Opção 1: Selecionar avatar rápido</span>
                    <div className="flex items-center gap-2">
                      {mockAvatars.map((img, idx) => {
                        const isSel = newMember.foto === img;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setNewMember({ ...newMember, foto: img })}
                            className={`relative rounded-full border overflow-hidden w-9 h-9 transition-all cursor-pointer ${
                              isSel ? 'ring-2 ring-serene-blue scale-105 border-transparent' : 'border-slate-200 opacity-70 hover:opacity-100'
                            }`}
                          >
                            <img referrerPolicy="no-referrer" src={img} alt="avatar" className="w-full h-full object-cover" />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  
                  <div className="grid grid-cols-2 gap-2 pt-1.55">
                    <div className="space-y-1">
                      <span className="text-[10px] font-medium text-slate-500 block">Opção 2: Enviar foto</span>
                      <label className="flex items-center justify-center gap-1 px-2.5 py-1.5 border border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer text-[11px] font-bold text-slate-600">
                        <Camera className="w-3.5 h-3.5 text-slate-500" />
                        <span>Tirar Foto / Anexar</span>
                        <input 
                          type="file" 
                          aria-label="Anexar foto do integrante"
                          accept="image/*" 
                          onChange={handlePhotoUploadForAdd} 
                          className="hidden" 
                        />
                      </label>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-medium text-slate-500 block">Opção 3: Link da imagem URL</span>
                      <input 
                        type="text" 
                        placeholder="Ex: https://site.com/foto.jpg" 
                        value={newMember.foto.startsWith('data:') ? '' : newMember.foto}
                        onChange={e => setNewMember({ ...newMember, foto: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl focus:ring-1 focus:ring-serene-blue/20 bg-slate-50 text-[11px] text-slate-800"
                      />
                    </div>
                  </div>

                  {newMember.foto && (
                    <div className="flex items-center gap-2 p-1.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <img 
                        referrerPolicy="no-referrer" 
                        src={newMember.foto} 
                        alt="Previa do membro" 
                        className="w-8 h-8 object-cover rounded-full border border-emerald-300" 
                      />
                      <div className="flex-1">
                        <span className="text-[10px] font-bold text-emerald-800 block">Foto escolhida!</span>
                        <button 
                          type="button" 
                          onClick={() => setNewMember({ ...newMember, foto: '' })}
                          className="text-[9px] text-rose-600 hover:underline font-bold"
                        >
                          Limpar foto
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">Telefone WhatsApp *</label>
                    <input 
                      type="text" 
                      placeholder="Ex: (11) 98765-4321" 
                      value={newMember.telefone}
                      onChange={e => {
                        const val = e.target.value;
                        const digits = val.replace(/\D/g, '');
                        const lastFour = digits.length >= 4 ? digits.slice(-4) : '';
                        setNewMember(prev => ({
                          ...prev,
                          telefone: val,
                          pin: (prev.pin === '1234' || prev.pin === '' || prev.pin === (prev.telefone.replace(/\D/g, '').slice(-4) || '1234')) ? lastFour : prev.pin
                        }));
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-serene-blue/20 bg-slate-50 text-sm font-semibold"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">Email (Opcional)</label>
                    <input 
                      type="email" 
                      placeholder="Ex: clara@email.com" 
                      value={newMember.email}
                      onChange={e => setNewMember({ ...newMember, email: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-serene-blue/20 bg-slate-50 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">Tipo/Nível de Acesso *</label>
                    <select 
                      value={
                        isEscolar && newMember.tipo === 'profissional'
                          ? (selectedAddRooms.length === 0 ? 'diretor' : 'coordenador')
                          : newMember.tipo
                      }
                      onChange={e => {
                        const val = e.target.value;
                        if (isEscolar && val === 'diretor') {
                          setNewMember({ ...newMember, tipo: 'profissional' });
                          setSelectedAddRooms([]);
                        } else if (isEscolar && val === 'coordenador') {
                          setNewMember({ ...newMember, tipo: 'profissional' });
                          if (selectedAddRooms.length === 0 && classrooms.length > 0) {
                            setSelectedAddRooms([classrooms[0].name]);
                          }
                        } else {
                          setNewMember({ ...newMember, tipo: val as any });
                        }
                      }}
                      className="w-full px-2.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-serene-blue/20 bg-slate-50 text-sm font-bold text-slate-800"
                    >
                      {isEscolar ? (
                        <>
                          {canInviteDev && <option value="desenvolvedor">  Desenvolvedor (Dev)</option>}
                          {canInviteDiretor && <option value="diretor">  Diretor(a) Geral (Acesso Completo)</option>}
                          {canInviteCoordenador && <option value="coordenador"> 🏫 Coordenador(a) Escolar (Salas Vinculadas)</option>}
                          {canInviteProfessor && (
                            <>
                              <option value="cuidador"> 🏫 Professor(a) / Educador(a) Titular</option>
                              <option value="profissional">🩺 Profissional de Saúde / Especialista (Médico, Fono, Psicólogo, Terapeuta, Pediatra)</option>
                            </>
                          )}
                          {canInviteFamiliarAdmin && <option value="familiar">    Familiar Admin (Pais / Responsáveis com Autorização)</option>}
                          <option value="familiar_convidado">  Familiar Convidado (Somente Leitura)</option>
                        </>
                      ) : (
                        <>
                          {canInviteDev && <option value="desenvolvedor">  Desenvolvedor (Dev)</option>}
                          {canInviteDiretor && <option value="admin">  Administrador Geral / Responsável</option>}
                          {canInviteCoordenador && <option value="coordenador"> ⚕ Coordenador(a)</option>}
                          {canInviteProfessor && (
                            <>
                              <option value="cuidador"> ⚕ Cuidador Profissional / Plantonista</option>
                              <option value="profissional">🩺 Profissional de Saúde / Especialista (Médico, Fono, Psicólogo, Terapeuta)</option>
                            </>
                          )}
                          {canInviteFamiliarAdmin && <option value="familiar">    Familiar Admin</option>}
                          <option value="familiar_convidado">  Familiar Convidado (Somente Leitura)</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">
                      {isEscolar ? 'Parentesco ou Função' : 'Parentesco ou Vínculo'}
                    </label>
                    <input 
                      type="text" 
                      placeholder={isEscolar ? "Ex: Mãe, Pai, Prof de Música, Tia" : "Ex: Filho, Cuidador Noturno, Fisio"} 
                      value={newMember.parentesco}
                      onChange={e => setNewMember({ ...newMember, parentesco: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-serene-blue/20 bg-slate-50 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-pink-600 flex items-center gap-1">  PIN de Acesso *</label>
                    <input 
                      type="text" 
                      placeholder="Ex: 1234" 
                      maxLength={6}
                      value={newMember.pin}
                      onChange={e => setNewMember({ ...newMember, pin: e.target.value.trim().replace(/\D/g, '') })}
                      className="w-full px-3 py-2 border border-pink-300 rounded-xl focus:ring-2 focus:ring-pink-300/20 bg-[#FFF5F7] text-sm font-bold font-mono text-center tracking-widest text-[#9C27B0]"
                      required
                    />
                    <span className="text-[9px] text-pink-500 font-bold leading-tight block">Sugerido: últimos 4 dígitos do celular</span>
                    {newMember.pin && integrantes.some(m => (m.pin || (m.telefone ? m.telefone.replace(/\D/g, '').slice(-4) : '1234')) === newMember.pin) && (
                      <div className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 p-1.5 rounded-lg font-bold mt-1 text-left leading-tight">
                        ⚠ Atenção: Os últimos dígitos coincidem com outro usuário cadastrado. Você pode personalizar este PIN com qualquer número único.
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏫</span>
                    <label className="text-xs font-black text-slate-700 block uppercase tracking-wide">
                      {isEscolar ? 'Classe / Sala de Aula Vinculada' : 'Ala / Setor de Cuidados'}
                    </label>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                    {isEscolar 
                      ? 'Ao atrelar os profissionais às salas correspondentes, eles visualizarão preferencialmente as crianças sob sua responsabilidade. Coordenadores podem ter acesso a múltiplas salas de uma vez.'
                      : 'Define qual o setor de atuação do cuidador para direcionamento de chamados e fluxo de rotina.'
                    }
                  </p>
                  
                  {isEscolar && (newMember.tipo === 'cuidador' || newMember.tipo === 'profissional' || newMember.tipo === 'professor' || newMember.tipo === 'professora' || newMember.tipo === 'educador' || newMember.tipo === 'educadora' || isStaffUser(newMember)) ? (
                    newMember.tipo === 'profissional' && selectedAddRooms.length === 0 ? (
                      <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-2xl text-xs text-indigo-950 font-semibold space-y-1 animate-fade-in">
                        <p className="font-extrabold flex items-center gap-1.5 text-indigo-900 text-sm">
                            Acesso de Direção Geral Ativo
                        </p>
                        <p className="text-[11px] text-slate-600 leading-relaxed font-bold">
                          Como <strong>Diretor(a) Geral</strong>, este usuário tem permissões administrativas globais e visualizará todas as salas da creche de forma irrestrita. O controle individual de turmas está desativado para esta função.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            if (classrooms.length > 0) {
                              setSelectedAddRooms([classrooms[0].name]);
                            }
                          }}
                          className="text-[10px] text-indigo-600 font-extrabold hover:underline block pt-1.5 cursor-pointer"
                        >
                          ⚙ Alterar para Coordenador(a) Escolar (Selecionar turmas)
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                            <input 
                              type="checkbox"
                              checked={selectedAddRooms.length === 0}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedAddRooms([]);
                                }
                              }}
                              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                            />
                            <span className="text-xs font-black text-slate-800">  Acesso Total a Todas as Salas (Diretor/Geral)</span>
                          </label>
                          {newMember.tipo === 'profissional' && (
                            <button
                              type="button"
                              onClick={() => setSelectedAddRooms([])}
                              className="text-[10px] text-indigo-600 font-black hover:underline cursor-pointer"
                            >
                                Tornar Diretor(a) Geral
                            </button>
                          )}
                        </div>
                        
                        {selectedAddRooms.length > 0 && (
                          <p className="text-[9px] text-indigo-600 font-extrabold uppercase tracking-wide">
                            Selecionados ({selectedAddRooms.length}): {selectedAddRooms.join(', ')}
                          </p>
                        )}
                      
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 max-h-40 overflow-y-auto pr-1">
                        {classrooms.map(room => {
                          const isChecked = selectedAddRooms.includes(room.name);
                          return (
                            <label key={room.id} className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-all select-none ${
                              isChecked 
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-950 font-bold' 
                                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-650 text-xs'
                            }`}>
                              <input 
                                type="checkbox" 
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setSelectedAddRooms(selectedAddRooms.filter(r => r !== room.name));
                                  } else {
                                    setSelectedAddRooms([...selectedAddRooms, room.name]);
                                  }
                                }}
                                className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                              />
                              <span className="text-[11px] truncate">{room.emoji} {room.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )
                ) : (
                  <select 
                    value={newMember.salaAula}
                      onChange={e => setNewMember({ ...newMember, salaAula: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-serene-blue/20 bg-white text-xs font-bold text-slate-750"
                    >
                      <option value="Todas">  Todas as Salas / Visão Geral</option>
                      {classrooms.map(room => (
                        <option key={room.id} value={room.name}>{room.emoji} {room.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-550 block">
                    {isEscolar ? 'Comunicados Habilitados para Envio WhatsApp:' : 'Alertas Habilitados para Envio WhatsApp:'}
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-700 font-semibold p-1">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={newMember.alertaAtrasados}
                        onChange={e => setNewMember({ ...newMember, alertaAtrasados: e.target.checked })}
                        className="w-3.5 h-3.5 text-serene-blue rounded"
                      />
                      <span>{isEscolar ? 'Rotinas Pendentes / Avisos' : 'Tarefas Atrasadas'}</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={newMember.alertaMedica}
                        onChange={e => setNewMember({ ...newMember, alertaMedica: e.target.checked })}
                        className="w-3.5 h-3.5 text-serene-blue rounded"
                      />
                      <span>{isEscolar ? 'Alimentação e Cuidados' : 'Medicamentos Feitos'}</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={newMember.alertaVitas}
                        onChange={e => setNewMember({ ...newMember, alertaVitas: e.target.checked })}
                        className="w-3.5 h-3.5 text-serene-blue rounded"
                      />
                      <span>{isEscolar ? 'Saúde, Sono e Fralda' : 'Novos Sinais Vitais'}</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={newMember.alertaCheck}
                        onChange={e => setNewMember({ ...newMember, alertaCheck: e.target.checked })}
                        className="w-3.5 h-3.5 text-serene-blue rounded"
                      />
                      <span>{isEscolar ? 'Diário de Aula / Resumo' : 'Resumos diários'}</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Observação Explicativa</label>
                  <textarea 
                    placeholder="Ex: Só mandar notificações de dia. Liga em emergências."
                    rows={2}
                    value={newMember.observacoes}
                    onChange={e => setNewMember({ ...newMember, observacoes: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 bg-slate-50 rounded-xl focus:ring-2 focus:ring-serene-blue/20 text-sm"
                  ></textarea>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 text-sm">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-serene-blue hover:bg-blue-600 text-white font-bold rounded-xl cursor-pointer"
                >
                  Salvar Integrante
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-2 sm:p-4 z-50 animate-fade-in overflow-y-auto" id="modal-edit-member">
          <div className={`rounded-3xl p-5 sm:p-6 border max-w-md w-full shadow-2xl relative space-y-4 my-auto ${
            accessibilitySettings.darkMode 
              ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-black/60' 
              : 'bg-white border-soft-gray text-slate-800 shadow-xl'
          }`}>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Edit2 className="w-6 h-6 text-serene-blue" />
              <span>Editar Cadastro do Integrante</span>
            </h3>

            <form onSubmit={handleUpdateMember} className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Nome do Integrante *</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Clara de Souza" 
                    value={editMemberForm.nome}
                    onChange={e => setEditMemberForm({ ...editMemberForm, nome: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-serene-blue/20 bg-slate-50 text-sm font-bold text-slate-800"
                    required
                  />
                </div>

                
                <div className="space-y-2 border-t border-b border-dashed border-slate-200 py-3 my-1">
                  <label className="text-xs font-bold text-slate-700 block">Foto do Integrante</label>
                  
                  
                  <div className="space-y-1">
                    <span className="text-[10px] font-medium text-slate-500 block">Opção 1: Selecionar avatar rápido</span>
                    <div className="flex items-center gap-2">
                      {mockAvatars.map((img, idx) => {
                        const isSel = editMemberForm.foto === img;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setEditMemberForm({ ...editMemberForm, foto: img })}
                            className={`relative rounded-full border overflow-hidden w-9 h-9 transition-all cursor-pointer ${
                              isSel ? 'ring-2 ring-serene-blue scale-105 border-transparent' : 'border-slate-200 opacity-70 hover:opacity-100'
                            }`}
                          >
                            <img referrerPolicy="no-referrer" src={img} alt="avatar" className="w-full h-full object-cover" />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  
                  <div className="grid grid-cols-2 gap-2 pt-1.5">
                    <div className="space-y-1">
                      <span className="text-[10px] font-medium text-slate-500 block">Opção 2: Enviar foto</span>
                      <label className="flex items-center justify-center gap-1 px-2.5 py-1.5 border border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer text-[11px] font-bold text-slate-600">
                        <Camera className="w-3.5 h-3.5 text-slate-500" />
                        <span>Tirar Foto / Anexar</span>
                        <input 
                          type="file" 
                          aria-label="Anexar foto"
                          accept="image/*" 
                          onChange={handlePhotoUploadForEdit} 
                          className="hidden" 
                        />
                      </label>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-medium text-slate-500 block">Opção 3: Link da imagem URL</span>
                      <input 
                        type="text" 
                        placeholder="Ex: https://site.com/foto.jpg" 
                        value={editMemberForm.foto.startsWith('data:') ? '' : editMemberForm.foto}
                        onChange={e => setEditMemberForm({ ...editMemberForm, foto: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl focus:ring-1 focus:ring-serene-blue/20 bg-slate-50 text-[11px] text-slate-800"
                      />
                    </div>
                  </div>

                  {editMemberForm.foto && (
                    <div className="flex items-center gap-2 p-1.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <img 
                        referrerPolicy="no-referrer" 
                        src={editMemberForm.foto} 
                        alt="Previa do membro" 
                        className="w-8 h-8 object-cover rounded-full border border-emerald-300" 
                      />
                      <div className="flex-1">
                        <span className="text-[10px] font-bold text-emerald-800 block">Foto escolhida!</span>
                        <button 
                          type="button" 
                          onClick={() => setEditMemberForm({ ...editMemberForm, foto: '' })}
                          className="text-[9px] text-rose-600 hover:underline font-bold"
                        >
                          Limpar foto
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">Telefone WhatsApp *</label>
                    <input 
                      type="text" 
                      placeholder="Ex: (11) 98765-4321" 
                      value={editMemberForm.telefone}
                      onChange={e => {
                        const val = e.target.value;
                        const digits = val.replace(/\D/g, '');
                        const lastFour = digits.length >= 4 ? digits.slice(-4) : '';
                        setEditMemberForm(prev => ({
                          ...prev,
                          telefone: val,
                          pin: (prev.pin === '1234' || prev.pin === '' || prev.pin === (prev.telefone.replace(/\D/g, '').slice(-4) || '1234')) ? lastFour : prev.pin
                        }));
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-serene-blue/20 bg-slate-50 text-sm font-semibold text-slate-800"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">Email (Opcional)</label>
                    <input 
                      type="email" 
                      placeholder="Ex: clara@email.com" 
                      value={editMemberForm.email}
                      onChange={e => setEditMemberForm({ ...editMemberForm, email: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-serene-blue/20 bg-slate-50 text-sm text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">Tipo/Nível de Acesso *</label>
                    <select 
                      value={
                        isEscolar && editMemberForm.tipo === 'profissional'
                          ? (selectedEditRooms.length === 0 ? 'diretor' : 'coordenador')
                          : editMemberForm.tipo
                      }
                      onChange={e => {
                        const val = e.target.value;
                        if (isEscolar && val === 'diretor') {
                          setEditMemberForm({ ...editMemberForm, tipo: 'profissional' });
                          setSelectedEditRooms([]);
                        } else if (isEscolar && val === 'coordenador') {
                          setEditMemberForm({ ...editMemberForm, tipo: 'profissional' });
                          if (selectedEditRooms.length === 0 && classrooms.length > 0) {
                            setSelectedEditRooms([classrooms[0].name]);
                          }
                        } else {
                          setEditMemberForm({ ...editMemberForm, tipo: val as any });
                        }
                      }}
                      className="w-full px-2.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-serene-blue/25 bg-slate-50 text-xs font-bold text-slate-850"
                    >
                      {isEscolar ? (
                        <>
                          <option value="admin">Responsável Financeiro/Admin</option>
                          <option value="familiar">Pais / Responsável</option>
                          <option value="cuidador">Professor(a) Titular</option>
                          <option value="diretor">Diretor(a) Geral (Acesso Completo)</option>
                          <option value="coordenador">Coordenador(a) Escolar (Salas Vinculadas)</option>
                        </>
                      ) : (
                        <>
                          <option value="admin">Administrador Familiar</option>
                          <option value="familiar">Familiar Acompanhante</option>
                          <option value="cuidador">Cuidador Profissional</option>
                          <option value="profissional">Médico ou Terapeuta</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">
                      {isEscolar ? 'Parentesco ou Função' : 'Parentesco ou Vínculo'}
                    </label>
                    <input 
                      type="text" 
                      placeholder={isEscolar ? "Ex: Mãe, Pai, Prof de Música, Tia" : "Ex: Filho, Cuidador Noturno, Fisio"} 
                      value={editMemberForm.parentesco}
                      onChange={e => setEditMemberForm({ ...editMemberForm, parentesco: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-serene-blue/20 bg-slate-50 text-sm text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-pink-600 flex items-center gap-1">  PIN de Acesso *</label>
                    <input 
                      type="text" 
                      placeholder="Ex: 1234" 
                      maxLength={6}
                      value={editMemberForm.pin}
                      onChange={e => setEditMemberForm({ ...editMemberForm, pin: e.target.value.trim().replace(/\D/g, '') })}
                      className="w-full px-3 py-2 border border-pink-300 rounded-xl focus:ring-2 focus:ring-pink-300/20 bg-[#FFF5F7] text-sm font-bold font-mono text-center tracking-widest text-[#9C27B0]"
                      required
                    />
                    <span className="text-[9px] text-pink-500 font-bold leading-tight block">Sugerido: últimos 4 dígitos do celular</span>
                    {editMemberForm.pin && integrantes.some(m => m.id !== editMemberForm.id && (m.pin || (m.telefone ? m.telefone.replace(/\D/g, '').slice(-4) : '1234')) === editMemberForm.pin) && (
                      <div className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 p-1.5 rounded-lg font-bold mt-1 text-left leading-tight">
                        ⚠ Atenção: Os últimos dígitos coincidem com outro usuário cadastrado. Você pode personalizar este PIN com qualquer número único.
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏫</span>
                    <label className="text-xs font-black text-slate-700 block uppercase tracking-wide">
                      {isEscolar ? 'Classe / Sala de Aula Vinculada' : 'Ala / Setor de Cuidados'}
                    </label>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                    {isEscolar 
                      ? 'Ao atrelar os profissionais às salas correspondentes, eles visualizarão preferencialmente as crianças sob sua responsabilidade. Coordenadores podem ter acesso a múltiplas salas de uma vez.'
                      : 'Define qual o setor de atuação do cuidador para direcionamento de chamados e fluxo de rotina.'
                    }
                  </p>
                  
                  {isEscolar && (editMemberForm.tipo === 'cuidador' || editMemberForm.tipo === 'profissional' || editMemberForm.tipo === 'professor' || editMemberForm.tipo === 'professora' || editMemberForm.tipo === 'educador' || editMemberForm.tipo === 'educadora' || isStaffUser(editMemberForm)) ? (
                    editMemberForm.tipo === 'profissional' && selectedEditRooms.length === 0 ? (
                      <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-2xl text-xs text-indigo-950 font-semibold space-y-1 animate-fade-in">
                        <p className="font-extrabold flex items-center gap-1.5 text-indigo-900 text-sm">
                            Acesso de Direção Geral Ativo
                        </p>
                        <p className="text-[11px] text-slate-600 leading-relaxed font-bold">
                          Como <strong>Diretor(a) Geral</strong>, este usuário tem permissões administrativas globais e visualizará todas as salas da creche de forma irrestrita. O controle individual de turmas está desativado para esta função.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            if (classrooms.length > 0) {
                              setSelectedEditRooms([classrooms[0].name]);
                            }
                          }}
                          className="text-[10px] text-indigo-600 font-extrabold hover:underline block pt-1.5 cursor-pointer"
                        >
                          ⚙ Alterar para Coordenador(a) Escolar (Selecionar turmas)
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                            <input 
                              type="checkbox"
                              checked={selectedEditRooms.length === 0}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedEditRooms([]);
                                }
                              }}
                              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                            />
                            <span className="text-xs font-black text-slate-800">  Acesso Total a Todas as Salas (Diretor/Geral)</span>
                          </label>
                          {editMemberForm.tipo === 'profissional' && (
                            <button
                              type="button"
                              onClick={() => setSelectedEditRooms([])}
                              className="text-[10px] text-indigo-600 font-black hover:underline cursor-pointer"
                            >
                                Tornar Diretor(a) Geral
                            </button>
                          )}
                        </div>
                        
                        {selectedEditRooms.length > 0 && (
                          <p className="text-[9px] text-indigo-600 font-extrabold uppercase tracking-wide">
                            Selecionados ({selectedEditRooms.length}): {selectedEditRooms.join(', ')}
                          </p>
                        )}
                      
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 max-h-40 overflow-y-auto pr-1">
                        {classrooms.map(room => {
                          const isChecked = selectedEditRooms.includes(room.name);
                          return (
                            <label key={room.id} className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-all select-none ${
                              isChecked 
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-950 font-bold' 
                                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-650 text-xs'
                            }`}>
                              <input 
                                type="checkbox" 
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setSelectedEditRooms(selectedEditRooms.filter(r => r !== room.name));
                                  } else {
                                    setSelectedEditRooms([...selectedEditRooms, room.name]);
                                  }
                                }}
                                className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                              />
                              <span className="text-[11px] truncate">{room.emoji} {room.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )
                ) : (
                  <select 
                    value={editMemberForm.salaAula}
                      onChange={e => setEditMemberForm({ ...editMemberForm, salaAula: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-serene-blue/20 bg-white text-xs font-bold text-slate-750"
                    >
                      <option value="Todas">  Todas as Salas / Visão Geral</option>
                      {classrooms.map(room => (
                        <option key={room.id} value={room.name}>{room.emoji} {room.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Observação Explicativa</label>
                  <textarea 
                    placeholder="Ex: Só mandar notificações de dia. Liga em emergências."
                    rows={2}
                    value={editMemberForm.observacoes}
                    onChange={e => setEditMemberForm({ ...editMemberForm, observacoes: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 bg-slate-50 rounded-xl focus:ring-2 focus:ring-serene-blue/20 text-sm text-slate-800"
                  ></textarea>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 text-sm">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingMemberId(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-serene-blue hover:bg-blue-600 text-white font-bold rounded-xl cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      
      
      
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 z-50 animate-fade-in overflow-y-auto">
          <div className={`rounded-3xl border shadow-2xl relative w-full max-w-2xl overflow-hidden ${
            accessibilitySettings.darkMode 
              ? 'bg-slate-900 border-slate-800 text-slate-100' 
              : 'bg-white border-slate-200 text-slate-800'
          }`}>
            
            <div className="bg-emerald-600 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="w-6 h-6 animate-pulse" />
                <div>
                  <h3 className="text-lg font-bold">Criar Convite por WhatsApp</h3>
                  <p className="text-xs text-emerald-100">
                    Gere um link inteligente para que o próprio familiar ou professor se cadastre.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteSimulateActive(false);
                }}
                className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Fechar
              </button>
            </div>

            
            <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              
              <div className={`p-4 rounded-2xl flex items-center gap-3 border shadow-3xs ${
                accessibilitySettings.darkMode
                  ? 'bg-indigo-950/40 border-indigo-900/60 text-slate-150'
                  : 'bg-indigo-50 border-indigo-200 text-slate-800'
              }`}>
                <div className="w-11 h-11 bg-indigo-600 rounded-full flex items-center justify-center text-xl shrink-0 shadow-xs">
                  {inviteRole === 'diretor' || inviteRole === 'desenvolvedor' ? ' ' : inviteRole === 'coordenador' ? ' 🏫' : inviteRole === 'cuidador' || inviteRole === 'professor' ? ' 🏫' : inviteRole === 'profissional' ? '🩺' : (isEscolar ? ' ' : ' ')}
                </div>
                <div className="space-y-0.5">
                  <span className={`text-[10px] font-black uppercase tracking-wider block ${
                    accessibilitySettings.darkMode ? 'text-indigo-400' : 'text-indigo-700'
                  }`}>
                    {inviteRole === 'diretor' || inviteRole === 'coordenador' || inviteRole === 'cuidador' || inviteRole === 'desenvolvedor' || inviteRole === 'profissional'
                      ? 'Nível de Permissão e Acesso Escolar'
                      : (isEscolar ? 'Criança / Aluno(a) Vinculado(a)' : 'Acompanhado(a) Vinculado(a)')}
                  </span>
                  <h4 className={`text-base font-black ${
                    accessibilitySettings.darkMode ? 'text-white' : 'text-indigo-950'
                  }`}>
                    {inviteRole === 'diretor' ? '  Direção Geral (Todas as Turmas)' : inviteRole === 'coordenador' ? ' 🏫 Coordenação Pedagógica' : inviteRole === 'cuidador' || inviteRole === 'professor' ? ' 🏫 Equipe Pedagógica / Docente' : inviteRole === 'profissional' ? '🩺 Profissional Especialista / Saúde' : cleanStudentName}
                  </h4>
                  <p className={`text-xs ${
                    accessibilitySettings.darkMode ? 'text-indigo-300' : 'text-indigo-850'
                  } font-medium`}>
                    {inviteRole === 'diretor' || inviteRole === 'coordenador' || inviteRole === 'desenvolvedor'
                      ? 'O link concederá acesso administrativo amplo para gestão de turmas, alunos e equipe.'
                      : (inviteRole === 'cuidador' || inviteRole === 'professor' || inviteRole === 'profissional'
                        ? 'O link concederá acesso pedagógico para preenchimento de diários e rotina.'
                        : (isEscolar ? `Este convite dará acesso exclusivo à rotina escolar de ${cleanStudentName}.` : `Este convite dará acesso aos cuidados de ${cleanStudentName}.`))}
                  </p>
                </div>
              </div>

              {!inviteSimulateActive ? (
                // VIEW 1: CONFIGURE & GENERATE THE LINK
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    <div className="space-y-4 pr-0 md:pr-4 md:border-r border-slate-200/60">
                      <h4 className="text-sm font-black text-slate-550 uppercase tracking-wider flex items-center gap-1.5">
                        <Sliders className="w-4 h-4 text-emerald-600" />
                        1. Configurar Acesso
                      </h4>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">Função do Convidado (Hierarquia Top-Down)</label>
                        <select
                          value={inviteRole}
                          onChange={(e: any) => {
                            const val = e.target.value;
                            setInviteRole(val);
                            if (val === 'diretor' || val === 'desenvolvedor') {
                              setInviteClass('Todas');
                            } else if (val === 'coordenador' && inviteClass === 'Todas') {
                              setInviteClass('Berçário I');
                            }
                          }}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 bg-slate-50 text-xs font-extrabold text-slate-750"
                        >
                          {canInviteDev && (
                            <option value="desenvolvedor">  Desenvolvedor do Sistema (Dev Total)</option>
                          )}
                          {canInviteDiretor && (
                            <option value="diretor">{isEscolar ? '  Diretor(a) Geral (Gestão Escolar)' : '  Administrador Geral'}</option>
                          )}
                          {canInviteCoordenador && (
                            <option value="coordenador">{isEscolar ? ' 🏫 Coordenador(a) Pedagógico(a)' : ' ⚕ Coordenador de Equipe'}</option>
                          )}
                          {canInviteProfessor && (
                            <>
                              <option value="cuidador">{isEscolar ? ' 🏫 Professor(a) / Educador(a) Titular' : ' ⚕ Cuidador(a) / Plantonista'}</option>
                              <option value="profissional">🩺 Profissional de Saúde / Especialista (Médico, Fono, Psicólogo, Terapeuta, Pediatra)</option>
                            </>
                          )}
                          {canInviteFamiliarAdmin && (
                            <option value="familiar">{isEscolar ? '    Familiar Admin (Mãe/Pai com Autorizações)' : '    Familiar Admin'}</option>
                          )}
                          {canInviteFamiliarConvidado && (
                            <option value="familiar_convidado">{isEscolar ? '  Familiar Convidado (Outro Parente - Leitor Sem Autorizações)' : '  Familiar Convidado (Somente Leitura)'}</option>
                          )}
                        </select>
                        <span className="text-[10px] text-slate-400 font-semibold block pt-0.5">
                            Convidando como <strong>{usuarioAtual.nome}</strong>. Opções filtradas conforme sua hierarquia de acesso.
                        </span>
                      </div>

                      {(inviteRole === 'familiar' || inviteRole === 'familiar_convidado') && (
                        <div className="space-y-1 animate-fade-in">
                          <label className="text-xs font-bold text-slate-500 block">Grau de Parentesco / Relação</label>
                          <select
                            value={inviteParentesco}
                            onChange={e => setInviteParentesco(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 bg-slate-50 text-xs font-bold text-slate-705"
                          >
                            {isEscolar ? (
                              <>
                                <option value="Mãe / Responsável">Mãe / Responsável</option>
                                <option value="Pai / Responsável">Pai / Responsável</option>
                                <option value="Responsável Legal">Responsável Legal</option>
                                <option value="Tio(a)">Tio(a)</option>
                                <option value="Avô / Avó">Avô / Avó</option>
                              </>
                            ) : (
                              <>
                                <option value="Filho(a)">Filho(a)</option>
                                <option value="Cônjuge">Cônjuge</option>
                                <option value="Irmão / Irmã">Irmão / Irmã</option>
                                <option value="Neto(a)">Neto(a)</option>
                                <option value="Sobrinho(a)">Sobrinho(a)</option>
                                <option value="Outro Familiar">Outro Familiar</option>
                              </>
                            )}
                          </select>
                        </div>
                      )}

                      {(inviteRole === 'cuidador' || inviteRole === 'profissional') && (
                        <div className="space-y-1 animate-fade-in">
                          <label className="text-xs font-bold text-slate-500 block">Restrição de Turma / Sala</label>
                          <select
                            value={inviteClass}
                            onChange={e => setInviteClass(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 bg-slate-50 text-xs font-bold text-slate-705"
                          >
                            <option value="Todas">  Todas as Salas / Visão Geral</option>
                            <option value="Berçário I">  Berçário I (0-1 ano)</option>
                            <option value="Berçário II">  Berçário II (1-2 anos)</option>
                            <option value="Maternal I">  Maternal I (2-3 anos)</option>
                            <option value="Maternal II">  Maternal II (3-4 anos)</option>
                            <option value="Jardim I">  Jardim I (4-5 anos)</option>
                            <option value="Jardim II">  Jardim II (5-6 anos)</option>
                          </select>
                        </div>
                      )}

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">Nome do Convidado (Opcional)</label>
                        <input
                          type="text"
                          placeholder="Ex: Clara, Professora Juliana"
                          value={inviteRecipientName}
                          onChange={e => setInviteRecipientName(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 bg-slate-50 text-xs text-slate-800 font-bold"
                        />
                        <p className="text-[10px] text-slate-400">Usado para personalizar a mensagem automática.</p>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 block">Celular / WhatsApp do Convidado (Opcional)</label>
                        <input
                          type="text"
                          placeholder="Ex: (11) 98765-4321"
                          value={inviteRecipientPhone}
                          onChange={e => {
                            const clean = e.target.value.replace(/\D/g, "");
                            let formatted = clean;
                            if (clean.length > 2 && clean.length <= 6) {
                              formatted = `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
                            } else if (clean.length > 6) {
                              formatted = `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7, 11)}`;
                            }
                            setInviteRecipientPhone(formatted);
                          }}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 bg-slate-50 text-xs text-slate-800 font-bold font-mono text-center"
                        />
                        <p className="text-[10px] text-slate-400">Insira com DDD para poder disparar o convite direto para o WhatsApp dele(a).</p>
                      </div>
                    </div>

                    
                    <div className="space-y-4">
                      <h4 className="text-sm font-black text-slate-550 uppercase tracking-wider flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-emerald-600" />
                        2. Pré-visualização do Envio
                      </h4>

                      
                      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 space-y-3 relative overflow-hidden text-xs">
                        <div className="absolute top-0 right-0 bg-emerald-600 text-white px-2 py-0.5 rounded-bl-xl text-[9px] font-black uppercase tracking-widest">
                          MENSAGEM WHATSAPP
                        </div>
                        <div className="font-sans text-slate-700 leading-relaxed whitespace-pre-wrap mt-2 select-all">
                          {`*Convite de Acesso - ${isEscolar ? 'Anjinho Escolar' : 'Anjo Cuidador'}*  \n\nOlá${inviteRecipientName ? ' ' + inviteRecipientName : ''}! Você foi convidado(a) por *${usuarioAtual.nome}* para acessar e acompanhar a rotina diária de *${cleanStudentName}* no aplicativo Anjo.\n\n*Acesso:* ${getInviteAcessoLabel()}\n\nPara ativar seu perfil com segurança e cadastrar seu PIN pessoal de acesso rápido, clique no link oficial abaixo:\n\n  ${window.location.origin}/entrar?token=convite_${Date.now().toString(36)}&ref=${idoso.id}&role=${inviteRole}`}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        
                        {inviteRecipientPhone.replace(/\D/g, "").length >= 10 ? (
                          <button
                            onClick={() => {
                              const linkMsg = `*Convite de Acesso - ${isEscolar ? 'Anjinho Escolar' : 'Anjo Cuidador'}*  \n\nOlá${inviteRecipientName ? ' ' + inviteRecipientName : ''}! Você foi convidado(a) por *${usuarioAtual.nome}* para acessar e acompanhar a rotina diária de *${cleanStudentName}* no aplicativo Anjo.\n\n*Acesso:* ${getInviteAcessoLabel()}\n\nPara ativar seu perfil com segurança e cadastrar seu PIN pessoal de acesso rápido, clique no link oficial abaixo:\n\n  ${window.location.origin}/entrar?token=convite_${Date.now().toString(36)}&ref=${idoso.id}&role=${inviteRole}`;
                              const cleanNum = inviteRecipientPhone.replace(/\D/g, "");
                              window.open(`https://api.whatsapp.com/send?phone=55${cleanNum}&text=${encodeURIComponent(linkMsg)}`, '_blank');
                            }}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/10 transition-all hover:scale-[1.02] animate-pulse"
                          >
                            <MessageSquare className="w-4 h-4 fill-white" /> Enviar Direto pelo WhatsApp (Celular Informado)
                          </button>
                        ) : (
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center text-[11px] text-slate-550 font-medium">
                              Digite o celular no campo ao lado para habilitar o <strong>disparo automático direto</strong> para o WhatsApp!
                          </div>
                        )}

                        
                        <button
                          type="button"
                          onClick={() => {
                            const linkMsg = `*Convite de Acesso - ${isEscolar ? 'Anjinho Escolar' : 'Anjo Cuidador'}*  \n\nOlá${inviteRecipientName ? ' ' + inviteRecipientName : ''}! Você foi convidado(a) por *${usuarioAtual.nome}* para acessar e acompanhar a rotina diária de *${cleanStudentName}* no aplicativo Anjo.\n\n*Acesso:* ${getInviteAcessoLabel()}\n\nPara ativar seu perfil com segurança e cadastrar seu PIN pessoal de acesso rápido, clique no link oficial abaixo:\n\n  ${window.location.origin}/entrar?token=convite_${Date.now().toString(36)}&ref=${idoso.id}&role=${inviteRole}`;
                            handleCopyInviteLink(linkMsg);
                          }}
                          className={`w-full py-2.5 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                            copiedLink 
                              ? 'bg-emerald-600 text-white' 
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-350'
                          }`}
                        >
                          {copiedLink ? (
                            <>
                              <Check className="w-4 h-4" /> Texto Copiado! Pronto para Enviar
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 text-slate-500" /> Copiar Texto de Convite para Colar Manualmente
                            </>
                          )}
                        </button>

                        <div className="text-[10px] text-slate-450 leading-relaxed text-center">
                          O link gerado é único para este acompanhado. Você deve enviá-lo <strong>diretamente para o celular ou e-mail de quem deseja convidar</strong>. Ao clicar, a pessoa definirá a senha/PIN dela e já entrará conectada ao acompanhado com segurança!
                        </div>
                      </div>
                    </div>
                  </div>

                  
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-4 space-y-3 mt-4 text-slate-800">
                    <div className="flex items-center gap-1.5 font-bold text-amber-800 text-sm">
                      <Sparkles className="w-5 h-5 text-amber-600 animate-bounce" />
                      <span>Deseja testar este fluxo agora mesmo?</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Como estamos no ambiente de testes, você pode <strong>simular exatamente</strong> o que o convidado verá no celular dele ao clicar no link de convite gerado. Clique no botão abaixo para preencher os dados do convidado e concluir o teste de ativação de perfil!
                    </p>
                    <button
                      onClick={() => {
                        setSimulationForm({
                          nome: inviteRecipientName || '',
                          telefone: '',
                          pin: '',
                          email: '',
                          parentesco: inviteRole === 'familiar' ? inviteParentesco : ''
                        });
                        setInviteSimulateActive(true);
                      }}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Simular Clique no Link e Cadastro do Convidado
                    </button>
                  </div>
                </div>
              ) : (
                // VIEW 2: INTERACTIVE CELLPHONE SIMULATION OF THE JOIN FLOW
                <div className="max-w-md mx-auto bg-slate-950 rounded-[40px] p-3 border-4 border-slate-800 shadow-2xl relative">
                  
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-10 flex items-center justify-center">
                    <div className="w-12 h-1 bg-slate-900 rounded-full mb-1"></div>
                  </div>

                  
                  <div className="bg-white rounded-[32px] overflow-hidden border border-slate-900 px-4 py-6 text-slate-800 min-h-[460px] flex flex-col justify-between space-y-4">
                    
                    <div className="h-2"></div>

                    
                    <div className="text-center space-y-1">
                      <div className="w-11 h-11 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
                        <Users className="w-6 h-6" />
                      </div>
                      <h4 className="font-black text-sm tracking-tight text-emerald-800">
                        Anjo • Registro de Integrante
                      </h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        {isEscolar ? 'Portal do Responsável & Educador' : 'Portal da Família & Cuidador'}
                      </p>
                    </div>

                    
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-[11px] leading-relaxed text-emerald-900">
                        Olá! <strong>{usuarioAtual.nome}</strong> convidou você para fazer parte do plano de acompanhamento de <strong>{cleanStudentName}</strong>. 
                      Preencha os campos abaixo para ativar seu perfil:
                    </div>

                    
                    <form onSubmit={handleCompleteInviteSimulation} className="space-y-2.5 text-xs">
                      <div className="space-y-0.5">
                        <label className="text-[10px] font-bold text-slate-500 block">Seu Nome Completo *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Júlia Maria Silva"
                          value={simulationForm.nome}
                          onChange={e => setSimulationForm({ ...simulationForm, nome: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/25 bg-slate-50 font-bold text-slate-850"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-0.5">
                          <label className="text-[10px] font-bold text-slate-500 block">WhatsApp / Celular *</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: (11) 99888-7766"
                            value={simulationForm.telefone}
                            onChange={e => setSimulationForm({ ...simulationForm, telefone: e.target.value })}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/25 bg-slate-50 font-bold text-slate-850"
                          />
                        </div>

                        <div className="space-y-0.5">
                          <label className="text-[10px] font-bold text-slate-500 block flex items-center justify-between">
                            <span>Definir PIN de Acesso *</span>
                          </label>
                          <input
                            type="text"
                            maxLength={4}
                            required
                            placeholder="Ex: 4321"
                            value={simulationForm.pin}
                            onChange={e => setSimulationForm({ ...simulationForm, pin: e.target.value.replace(/\D/g, '') })}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-center tracking-widest font-mono font-bold focus:ring-2 focus:ring-emerald-500/25 bg-slate-50 text-slate-850"
                          />
                        </div>
                      </div>

                      {inviteRole === 'familiar' && (
                        <div className="space-y-0.5">
                          <label className="text-[10px] font-bold text-slate-500 block">Sua Relação com {cleanStudentName} *</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: Mãe, Pai, Avó"
                            value={simulationForm.parentesco}
                            onChange={e => setSimulationForm({ ...simulationForm, parentesco: e.target.value })}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/25 bg-slate-50 font-semibold"
                          />
                        </div>
                      )}

                      <div className="space-y-0.5">
                        <label className="text-[10px] font-bold text-slate-500 block">Seu E-mail (Opcional)</label>
                        <input
                          type="email"
                          placeholder="Ex: julia@exemplo.com"
                          value={simulationForm.email}
                          onChange={e => setSimulationForm({ ...simulationForm, email: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/25 bg-slate-50"
                        />
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-95 transition-all"
                        >
                          <CheckCircle className="w-4 h-4" /> Ativar Meu Perfil & Entrar
                        </button>
                      </div>
                    </form>

                    <button
                      onClick={() => setInviteSimulateActive(false)}
                      className="text-center text-[11px] text-slate-400 hover:text-slate-600 underline font-semibold block w-full mt-2"
                    >
                      ← Voltar para a Tela do Convite
                    </button>
                  </div>
                </div>
              )}
            </div>

            
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-between items-center text-xs text-slate-500">
              <span className="flex items-center gap-1 font-semibold">
                <Shield className="w-4 h-4 text-emerald-600" /> Acesso Seguro e Criptografado
              </span>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteSimulateActive(false);
                }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl cursor-pointer"
              >
                Fechar Painel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
