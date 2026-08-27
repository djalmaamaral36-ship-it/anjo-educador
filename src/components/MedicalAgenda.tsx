import React, { useState, useEffect, useMemo } from 'react';
import { Idoso, CompromissoMedico, Usuario, TarefaDiaria, Classroom, isStaffUser } from '../types';
import { getFromDB, saveToDB, SALAS_INICIAIS } from '../data';
import { VoiceInput } from './VoiceInput';
import { 
  Plus, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Stethoscope, 
  Phone, 
  Check, 
  Bell, 
  FileText,
  AlertCircle,
  Clock3,
  Share2,
  Trash2,
  Users,
  School,
  Layers
} from 'lucide-react';

const getStudentClassroom = (studentObj: any): string => {
  if (!studentObj) return 'Berçário I - A';
  if (typeof studentObj === 'object') {
    if (studentObj.salaAula && studentObj.salaAula !== 'Todas') return studentObj.salaAula;
    if (studentObj.quarto && studentObj.quarto !== 'Todas') return studentObj.quarto;
    if (studentObj.sala && studentObj.sala !== 'Todas') return studentObj.sala;
    if (studentObj.nome) return getStudentClassroom(studentObj.nome);
    return 'Berçário I - A';
  }
  const name = String(studentObj);
  const rooms = getFromDB<Classroom[]>('anjo_salas', SALAS_INICIAIS);
  const sortedRooms = [...rooms].sort((a, b) => b.name.length - a.name.length);
  const found = sortedRooms.find(r => name.includes(r.name));
  if (found) {
    return found.name;
  }

  const match = name.match(/\(([^)]+)\)/);
  if (match) {
    const content = match[1];
    const parts = content.split('-');
    if (parts.length > 0) {
      const potentialRoom = parts[0].trim();
      const foundFallback = sortedRooms.find(r => 
        r.name.toLowerCase().includes(potentialRoom.toLowerCase()) || 
        potentialRoom.toLowerCase().includes(r.name.toLowerCase())
      );
      if (foundFallback) return foundFallback.name;
    }
  }

  if (name.toLowerCase().includes('berçário i') || name.toLowerCase().includes('bercario i')) return 'Berçário I - A';
  if (name.toLowerCase().includes('berçário ii') || name.toLowerCase().includes('bercario ii')) return 'Berçário II';
  if (name.toLowerCase().includes('maternal ii') || name.toLowerCase().includes('maternal 2')) return 'Maternal II - A';
  if (name.toLowerCase().includes('maternal i') || name.toLowerCase().includes('maternal 1')) return 'Maternal I - A';
  if (name.toLowerCase().includes('jardim ii') || name.toLowerCase().includes('jardim 2')) return 'Jardim II - A';
  if (name.toLowerCase().includes('jardim i') || name.toLowerCase().includes('jardim 1')) return 'Jardim I - A';
  if (name.includes('1º Ano')) return '1º Ano - A';
  if (name.includes('2º Ano')) return '2º Ano - A';
  if (name.includes('3º Ano')) return '3º Ano - A';
  if (name.includes('4º Ano')) return '4º Ano - A';
  if (name.includes('5º Ano')) return '5º Ano - A';
  return 'Berçário I - A';
};

interface MedicalAgendaProps {
  key?: any;
  idoso: Idoso;
  usuarioAtual: Usuario;
  triggerWhatsAppSim: (titulo: string, mensagem: string, targetStudents?: Idoso[]) => void;
  accessibilitySettings: {
    fontSize: 'normal' | 'grande' | 'gigante';
    simplifiedMode: boolean;
  };
  keyTrigger: number;
}

export default function MedicalAgenda({ 
  idoso, 
  usuarioAtual, 
  triggerWhatsAppSim, 
  accessibilitySettings,
  keyTrigger 
}: MedicalAgendaProps) {
  const appMode = localStorage.getItem('anjo_app_mode') || 'idoso';
  const isEscolar = appMode === 'escolar_infantil' || appMode === 'escolar_fundamental';
  const [compromissos, setCompromissos] = useState<CompromissoMedico[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [enviarParaTodos, setEnviarParaTodos] = useState(false);
  const [replicarModo, setReplicarModo] = useState<'classe' | 'escola'>('classe');
  
  // Selected Target Classrooms (supports selecting multiple classrooms or whole categories)
  const [selectedTargetClassrooms, setSelectedTargetClassrooms] = useState<string[]>(() => {
    const defaultRoom = getStudentClassroom(idoso);
    return defaultRoom ? [defaultRoom] : [];
  });

  const selectedTargetClassroom = selectedTargetClassrooms[0] || getStudentClassroom(idoso);

  const [newAppt, setNewAppt] = useState({
    titulo: '',
    tipo: 'consulta' as const,
    medico: '',
    especialidade: '',
    local: '',
    data: '2026-06-05',
    horario: '10:00',
    observacoes: '',
    alertasAtivos: true
  });

  // Safe Interactive Dialogues for the iframe sandbox (eliminating blocking window.confirm)
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<CompromissoMedico | null>(null);
  const [deleteBroadcastSelection, setDeleteBroadcastSelection] = useState<'only_one' | 'all'>('only_one');
  const [toggleConfirmTarget, setToggleConfirmTarget] = useState<CompromissoMedico | null>(null);

  useEffect(() => {
    loadAgenda();
  }, [idoso, keyTrigger]);

  useEffect(() => {
    const defaultRoom = getStudentClassroom(idoso);
    setSelectedTargetClassrooms([defaultRoom]);
    if (!newAppt.especialidade) {
      setNewAppt(prev => ({ ...prev, especialidade: defaultRoom }));
    }
  }, [idoso.id, idoso.nome]);

  const activeSalas = useMemo(() => {
    const rooms = getFromDB<Classroom[]>('anjo_salas', SALAS_INICIAIS);
    if (appMode === 'escolar_fundamental') {
      return rooms.filter(r => r.id.startsWith('sala_fun_') || r.name.includes('Ano'));
    } else if (appMode === 'escolar_infantil') {
      return rooms.filter(r => !r.id.startsWith('sala_fun_'));
    }
    return rooms;
  }, [appMode, showAddModal]);

  const getStudentsCountForClass = (roomName: string): number => {
    const allStudents = getFromDB<Idoso[]>('anjo_idosos', []);
    return allStudents.filter(p => {
      if (!p.id.startsWith('aluno_') && !p.id.startsWith('aluno_fun_')) return false;
      const studentRoom = getStudentClassroom(p);
      if (studentRoom === roomName) return true;
      if (p.nome.includes(roomName)) return true;
      if (roomName.includes(studentRoom)) return true;
      return false;
    }).length;
  };

  const getStudentsCountForClasses = (roomNames: string[]): number => {
    if (!roomNames || roomNames.length === 0) return 0;
    const allStudents = getFromDB<Idoso[]>('anjo_idosos', []);
    return allStudents.filter(p => {
      if (!p.id.startsWith('aluno_') && !p.id.startsWith('aluno_fun_')) return false;
      const studentRoom = getStudentClassroom(p);
      return roomNames.some(room => {
        if (studentRoom === room) return true;
        if (p.nome.includes(room)) return true;
        if (room.includes(studentRoom)) return true;
        return false;
      });
    }).length;
  };

  const totalSchoolStudentsCount = useMemo(() => {
    const allStudents = getFromDB<Idoso[]>('anjo_idosos', []);
    return allStudents.filter(p => p.id.startsWith('aluno_') || p.id.startsWith('aluno_fun_')).length;
  }, [showAddModal, keyTrigger]);

  const getTargetSummaryText = (rooms: string[]): string => {
    if (rooms.length === 0) return 'Nenhuma turma selecionada';
    if (activeSalas.length > 0 && rooms.length === activeSalas.length) {
      return 'Toda a Escola (Todas as Turmas)';
    }

    const bercarioSalas = activeSalas.filter(s => s.name.toLowerCase().includes('berçário') || s.name.toLowerCase().includes('lactente')).map(s => s.name);
    const maternalSalas = activeSalas.filter(s => s.name.toLowerCase().includes('maternal')).map(s => s.name);
    const jardimSalas = activeSalas.filter(s => s.name.toLowerCase().includes('jardim') || s.name.toLowerCase().includes('pré')).map(s => s.name);
    const fundamentalSalas = activeSalas.filter(s => s.name.toLowerCase().includes('ano') || s.name.toLowerCase().includes('fundamental')).map(s => s.name);

    if (bercarioSalas.length > 0 && bercarioSalas.length === rooms.length && bercarioSalas.every(r => rooms.includes(r))) {
      return 'Todo o Berçário';
    }
    if (maternalSalas.length > 0 && maternalSalas.length === rooms.length && maternalSalas.every(r => rooms.includes(r))) {
      return 'Todo o Maternal';
    }
    if (jardimSalas.length > 0 && jardimSalas.length === rooms.length && jardimSalas.every(r => rooms.includes(r))) {
      return 'Todo o Jardim';
    }
    if (fundamentalSalas.length > 0 && fundamentalSalas.length === rooms.length && fundamentalSalas.every(r => rooms.includes(r))) {
      return 'Todo o Ensino Fundamental';
    }

    if (rooms.length === 1) return rooms[0];
    if (rooms.length <= 3) return rooms.join(', ');
    return `${rooms.length} Turmas Selecionadas (${rooms.slice(0, 2).join(', ')}...)`;
  };

  const classroomCategories = useMemo(() => {
    if (!isEscolar) return [];
    
    const bercarioSalas = activeSalas.filter(s => s.name.toLowerCase().includes('berçário') || s.name.toLowerCase().includes('lactente')).map(s => s.name);
    const maternalSalas = activeSalas.filter(s => s.name.toLowerCase().includes('maternal')).map(s => s.name);
    const jardimSalas = activeSalas.filter(s => s.name.toLowerCase().includes('jardim') || s.name.toLowerCase().includes('pré')).map(s => s.name);
    const fundamentalSalas = activeSalas.filter(s => s.name.toLowerCase().includes('ano') || s.name.toLowerCase().includes('fundamental')).map(s => s.name);

    const cats = [];

    // Escola Toda
    cats.push({
      id: 'escola_toda',
      label: '🏫 Toda a Escola',
      salas: activeSalas.map(s => s.name),
      count: totalSchoolStudentsCount
    });

    if (bercarioSalas.length > 0) {
      cats.push({
        id: 'bercario',
        label: '  Todo o Berçário',
        salas: bercarioSalas,
        count: getStudentsCountForClasses(bercarioSalas)
      });
    }

    if (maternalSalas.length > 0) {
      cats.push({
        id: 'maternal',
        label: '  Todo o Maternal',
        salas: maternalSalas,
        count: getStudentsCountForClasses(maternalSalas)
      });
    }

    if (jardimSalas.length > 0) {
      cats.push({
        id: 'jardim',
        label: '  Todo o Jardim',
        salas: jardimSalas,
        count: getStudentsCountForClasses(jardimSalas)
      });
    }

    if (fundamentalSalas.length > 0) {
      cats.push({
        id: 'fundamental',
        label: '  Ensino Fundamental',
        salas: fundamentalSalas,
        count: getStudentsCountForClasses(fundamentalSalas)
      });
    }

    return cats;
  }, [activeSalas, isEscolar, totalSchoolStudentsCount]);

  const handleToggleClassroom = (roomName: string) => {
    let nextRooms: string[];
    if (selectedTargetClassrooms.includes(roomName)) {
      nextRooms = selectedTargetClassrooms.filter(r => r !== roomName);
    } else {
      nextRooms = [...selectedTargetClassrooms, roomName];
    }
    
    setSelectedTargetClassrooms(nextRooms);
    setEnviarParaTodos(nextRooms.length > 1 || (nextRooms.length === 1 && nextRooms[0] !== getStudentClassroom(idoso)));
    setNewAppt(prev => ({
      ...prev,
      especialidade: getTargetSummaryText(nextRooms)
    }));
  };

  const handleToggleCategory = (categorySalas: string[]) => {
    const isAllSelected = categorySalas.every(s => selectedTargetClassrooms.includes(s));
    let nextRooms: string[];
    
    if (isAllSelected) {
      nextRooms = selectedTargetClassrooms.filter(s => !categorySalas.includes(s));
    } else {
      const set = new Set([...selectedTargetClassrooms, ...categorySalas]);
      nextRooms = Array.from(set);
    }

    setSelectedTargetClassrooms(nextRooms);
    setEnviarParaTodos(true);
    setNewAppt(prev => ({
      ...prev,
      especialidade: getTargetSummaryText(nextRooms)
    }));
  };

  const handleSelectAllSchool = () => {
    const allNames = activeSalas.map(s => s.name);
    const isAllSelected = allNames.every(s => selectedTargetClassrooms.includes(s)) && selectedTargetClassrooms.length === allNames.length;
    
    let nextRooms: string[];
    if (isAllSelected) {
      const defaultRoom = getStudentClassroom(idoso);
      nextRooms = [defaultRoom];
    } else {
      nextRooms = allNames;
    }

    setSelectedTargetClassrooms(nextRooms);
    setEnviarParaTodos(true);
    setNewAppt(prev => ({
      ...prev,
      especialidade: getTargetSummaryText(nextRooms)
    }));
  };

  const handleSelectClassroomQuick = (roomName: string) => {
    setSelectedTargetClassrooms([roomName]);
    setNewAppt(prev => ({
      ...prev,
      especialidade: roomName
    }));
    setEnviarParaTodos(true);
  };

  const loadAgenda = () => {
    const allComp = getFromDB<CompromissoMedico[]>('anjo_agenda', []);
    const seniorComp = allComp.filter(c => c.idosoId === idoso.id);
    setCompromissos(seniorComp.sort((a, b) => a.data.localeCompare(b.data) || a.horario.localeCompare(b.horario)));
  };

  const getTipoLabel = (tipo: string) => {
    if (isEscolar) {
      switch (tipo) {
        case 'consulta':
          return 'Reunião de Pais / Conselho';
        case 'exame':
          return 'Festa ou Evento Especial';
        case 'retorno':
          return 'Passeio / Atividade Externa';
        case 'fisioterapia':
          return 'Apresentação / Atendimento';
        case 'vacina':
          return 'Campanha de Vacinação';
        default:
          return 'Outros Eventos';
      }
    }
    switch (tipo) {
      case 'consulta':
        return 'Consulta';
      case 'exame':
        return 'Exame Clínico';
      case 'retorno':
        return 'Retorno';
      case 'fisioterapia':
        return 'Fisioterapia';
      case 'vacina':
        return 'Vacinação';
      default:
        return 'Outros compromissos';
    }
  };

  const getTipoBadgeColor = (tipo: string) => {
    switch (tipo) {
      case 'consulta':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'exame':
        return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'retorno':
        return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'fisioterapia':
        return 'bg-purple-100 text-purple-800 border border-purple-200';
      case 'vacina':
        return 'bg-rose-100 text-rose-800 border border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800 border border-slate-200';
    }
  };

  const handleSaveAppointment = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newAppt.titulo || !newAppt.medico) {
      alert(isEscolar 
        ? 'Por favor, preencha o título do evento/reunião e o responsável.' 
        : 'Por favor preencha o título do compromisso e o nome do profissional.');
      return;
    }

    const broadcastGroupId = enviarParaTodos && isEscolar ? `broadcast_${Date.now()}` : undefined;
    const allComp = getFromDB<CompromissoMedico[]>('anjo_agenda', []);
    const allTasks = getFromDB<TarefaDiaria[]>('anjo_tarefas_diarias', []);
    const dateFormatted = new Date(newAppt.data + 'T00:00:00').toLocaleDateString('pt-BR');

    if (enviarParaTodos && isEscolar) {
      const targetRooms = selectedTargetClassrooms.length > 0 ? selectedTargetClassrooms : [getStudentClassroom(idoso)];
      const summaryText = getTargetSummaryText(targetRooms);
      
      let todosAlunos: Idoso[] = [];
      if (replicarModo === 'escola' || targetRooms.length === activeSalas.length) {
        todosAlunos = getFromDB<Idoso[]>('anjo_idosos', [])
          .filter(p => p.id.startsWith('aluno_') || p.id.startsWith('aluno_fun_'));
      } else {
        todosAlunos = getFromDB<Idoso[]>('anjo_idosos', [])
          .filter(p => {
            if (!p.id.startsWith('aluno_') && !p.id.startsWith('aluno_fun_')) return false;
            const studentRoom = getStudentClassroom(p);
            return targetRooms.some(targetRoom => {
              if (studentRoom === targetRoom) return true;
              if (p.nome.includes(targetRoom)) return true;
              if (targetRoom.includes(studentRoom)) return true;
              return false;
            });
          });
      }

      // Restrict replication to teacher's assigned classroom ONLY when no target rooms are explicitly chosen
      const isTeacher = isStaffUser(usuarioAtual);
      const hasAssignedClassroom = isTeacher && usuarioAtual.salaAula && usuarioAtual.salaAula !== 'Todas' && localStorage.getItem('anjo_master_demonstracao_ativo') !== 'true';
      if (hasAssignedClassroom && replicarModo === 'classe' && selectedTargetClassrooms.length === 0) {
        const userClassrooms = usuarioAtual.salaAula ? usuarioAtual.salaAula.split(',') : [];
        todosAlunos = todosAlunos.filter(p => {
          const studentRoom = getStudentClassroom(p);
          return userClassrooms.some(userRoom => {
            const cleanUserRoom = userRoom.trim();
            if (cleanUserRoom === studentRoom) return true;
            if (studentRoom !== 'Todas' && (cleanUserRoom.startsWith(studentRoom) || studentRoom.startsWith(cleanUserRoom))) return true;
            if (p.nome.includes(cleanUserRoom)) return true;
            return false;
          });
        });
      }

      // Fallback: If no other student was matched in DB, ensure the currently selected student (idoso) is included
      if (todosAlunos.length === 0 && idoso) {
        todosAlunos = [idoso];
      }

      todosAlunos.forEach((aluno, idx) => {
        const copyId = `appt_${Date.now()}_idx_${idx}`;
        const copyAppt: CompromissoMedico = {
          id: copyId,
          idosoId: aluno.id,
          tipo: newAppt.tipo,
          titulo: newAppt.titulo,
          medico: newAppt.medico,
          especialidade: newAppt.especialidade || summaryText,
          local: newAppt.local || 'Escolinha',
          data: newAppt.data,
          horario: newAppt.horario,
          observacoes: newAppt.observacoes,
          confirmadoFamiliar: true,
          alertasAtivos: newAppt.alertasAtivos,
          status: 'agendado',
          broadcastGroupId: broadcastGroupId
        };
        allComp.push(copyAppt);

        // If today, also append to tasks for that student
        if (copyAppt.data === '2026-05-30') {
          const labelTipo = getTipoLabel(copyAppt.tipo).toUpperCase();
          const novaTarefa: TarefaDiaria = {
            id: 'task_appt_' + copyAppt.id,
            idosoId: aluno.id,
            tipo: 'consulta',
            titulo: `${labelTipo}: ${copyAppt.titulo}`,
            descricao: `Com ${copyAppt.medico} em ${copyAppt.local} às ${copyAppt.horario}.`,
            horarioPrevisto: copyAppt.horario,
            status: 'pendente'
          };
          allTasks.push(novaTarefa);
        }
      });

      saveToDB('anjo_agenda', allComp);
      saveToDB('anjo_tarefas_diarias', allTasks);

      const msg = `  COMUNICADO DE EVENTO ESCOLAR\n\n  Público-Alvo: ${summaryText}\n  Evento: ${newAppt.titulo}\n  Responsável: ${newAppt.medico}\n  Data: ${dateFormatted} às ${newAppt.horario}\n  Local: ${newAppt.local || 'Escolinha'}\n\nAgendado para ${todosAlunos.length} alunos (${targetRooms.length} turma(s) selecionada(s)).`;
      triggerWhatsAppSim(`Comunicado Enviado (${summaryText})`, msg, todosAlunos);
    } else {
      const novoCompromisso: CompromissoMedico = {
        id: 'appt_' + Date.now(),
        idosoId: idoso.id,
        tipo: newAppt.tipo,
        titulo: newAppt.titulo,
        medico: newAppt.medico,
        especialidade: newAppt.especialidade || (isEscolar ? 'Geral' : 'Inespecífico'),
        local: newAppt.local || (isEscolar ? 'Escolinha' : 'Domiciliar'),
        data: newAppt.data,
        horario: newAppt.horario,
        observacoes: newAppt.observacoes,
        confirmadoFamiliar: true,
        alertasAtivos: newAppt.alertasAtivos,
        status: 'agendado'
      };

      allComp.push(novoCompromisso);
      saveToDB('anjo_agenda', allComp);

      // If scheduled for TODAY
      if (novoCompromisso.data === '2026-05-30') {
        const labelTipo = getTipoLabel(novoCompromisso.tipo).toUpperCase();
        const novaTarefa: TarefaDiaria = {
          id: 'task_appt_' + novoCompromisso.id,
          idosoId: idoso.id,
          tipo: 'consulta',
          titulo: `${labelTipo}: ${novoCompromisso.titulo}`,
          descricao: isEscolar
            ? `Com ${novoCompromisso.medico} em ${novoCompromisso.local} às ${novoCompromisso.horario}.`
            : `Com Dr(a). ${novoCompromisso.medico} em ${novoCompromisso.local} às ${novoCompromisso.horario}.`,
          horarioPrevisto: novoCompromisso.horario,
          status: 'pendente'
        };
        allTasks.push(novaTarefa);
        saveToDB('anjo_tarefas_diarias', allTasks);
      }

      const msg = isEscolar
        ? `Anjinho Escolar: Novo evento/reunião escolar agendado para o(a) aluno(a) ${idoso.nome}. Compromisso: "${novoCompromisso.titulo}" com ${novoCompromisso.medico} em ${dateFormatted} às ${novoCompromisso.horario}. Local: ${novoCompromisso.local}. Detalhes: ${novoCompromisso.observacoes || 'Sem observações.'}`
        : `Anjo Cuidador: Novo compromisso médico agendado para ${idoso.nome}. Compromisso: "${novoCompromisso.titulo}" com Dr(a). ${novoCompromisso.medico} em ${dateFormatted} às ${novoCompromisso.horario}. Local: ${novoCompromisso.local}.`;
      triggerWhatsAppSim(isEscolar ? 'Evento Escolar Agendado' : 'Compromisso Agendado', msg);
    }

    // Reset Form
    setNewAppt({
      titulo: '',
      tipo: 'consulta',
      medico: '',
      especialidade: '',
      local: '',
      data: '2026-06-05',
      horario: '10:00',
      observacoes: '',
      alertasAtivos: true
    });
    setEnviarParaTodos(false);

    setShowAddModal(false);
    loadAgenda();
  };

  const handleToggleStatus = (apptId: string) => {
    const allComp = getFromDB<CompromissoMedico[]>('anjo_agenda', []);
    const tgt = allComp.find(c => c.id === apptId);
    if (!tgt) return;

    if (isEscolar && tgt.broadcastGroupId) {
      setToggleConfirmTarget(tgt);
    } else {
      executeToggleStatus(tgt, false);
    }
  };

  const executeToggleStatus = (tgt: CompromissoMedico, toggleAll: boolean) => {
    const allComp = getFromDB<CompromissoMedico[]>('anjo_agenda', []);
    const nextStatus = tgt.status === 'realizado' ? 'agendado' : 'realizado';
    const systemName = isEscolar ? 'Anjinho Escolar' : 'Anjo Cuidador';
    const labelTerm = isEscolar ? 'Evento/Reunião' : 'Compromisso';
    const actionTerm = nextStatus === 'realizado' ? 'concluído' : 'agendado';

    const updated = allComp.map(c => {
      if (toggleAll && tgt.broadcastGroupId) {
        if (c.broadcastGroupId === tgt.broadcastGroupId) {
          return { ...c, status: nextStatus as any };
        }
      } else {
        if (c.id === tgt.id) {
          return { ...c, status: nextStatus as any };
        }
      }
      return c;
    });

    if (toggleAll && tgt.broadcastGroupId) {
      triggerWhatsAppSim(
        'Mural Atualizado',
        `${systemName}: O evento geral "${tgt.titulo}" foi marcado como ${actionTerm} para todos os alunos da classe.`
      );
    } else {
      triggerWhatsAppSim(
        isEscolar ? 'Evento/Reunião Atualizado' : 'Compromisso Atualizado',
        `${systemName}: O ${labelTerm} "${tgt.titulo}" de ${idoso.nome} foi marcado como ${actionTerm} por ${usuarioAtual.nome}.`
      );
    }

    saveToDB('anjo_agenda', updated);
    loadAgenda();
    setToggleConfirmTarget(null);
  };

  const handleShareWhatsAppReminder = (appt: CompromissoMedico) => {
    const dateFormatted = new Date(appt.data + 'T00:00:00').toLocaleDateString('pt-BR');
    
    const msg = isEscolar
      ? `Anjinho Escolar: Lembrete de compromisso/reunião escolar sobre o(a) aluno(a) ${idoso.nome}. Próximo dia (${dateFormatted}) às ${appt.horario} haverá "${appt.titulo}" sob coordenação de ${appt.medico}. Local: ${appt.local}. Informações: ${appt.observacoes || 'Sem observações.'}`
      : `Anjo Cuidador: Lembrete de compromisso de ${idoso.nome}. Amanhã (${dateFormatted}) às ${appt.horario} há "${appt.titulo}" com Dr(a). ${appt.medico}. Local: ${appt.local}. Notas: ${appt.observacoes || 'Sem notas.'}`;
    
    triggerWhatsAppSim(isEscolar ? 'Lembrete de Evento' : 'Lembrete de Compromisso', msg);
  };

  const handleDeleteAppointment = (apptId: string, apptTitulo: string) => {
    const allComp = getFromDB<CompromissoMedico[]>('anjo_agenda', []);
    const tgt = allComp.find(c => c.id === apptId);
    if (!tgt) return;

    setDeleteConfirmTarget(tgt);
    setDeleteBroadcastSelection(isEscolar && tgt.broadcastGroupId ? 'all' : 'only_one');
  };

  const executeDeleteAppointment = () => {
    if (!deleteConfirmTarget) return;
    const allComp = getFromDB<CompromissoMedico[]>('anjo_agenda', []);
    const deleteAll = deleteBroadcastSelection === 'all' && isEscolar && !!deleteConfirmTarget.broadcastGroupId;

    let updated;
    if (deleteAll && deleteConfirmTarget.broadcastGroupId) {
      updated = allComp.filter(c => c.broadcastGroupId !== deleteConfirmTarget.broadcastGroupId);
      triggerWhatsAppSim(
        'Geral: Comunicado Excluído',
        `Anjinho Escolar: O comunicado geral "${deleteConfirmTarget.titulo}" foi apagado da agenda de toda a classe de uma vez.`
      );
    } else {
      updated = allComp.filter(c => c.id !== deleteConfirmTarget.id);
      triggerWhatsAppSim(
        isEscolar ? 'Evento Excluído' : 'Compromisso Excluído',
        isEscolar
          ? `Anjinho Escolar: O evento/reunião "${deleteConfirmTarget.titulo}" de ${idoso.nome} foi removido da agenda.`
          : `Anjo Cuidador: O compromisso "${deleteConfirmTarget.titulo}" de ${idoso.nome} foi removido por ${usuarioAtual.nome}.`
      );
    }

    saveToDB('anjo_agenda', updated);
    loadAgenda();
    setDeleteConfirmTarget(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-600" />
            {isEscolar ? 'Eventos, Reuniões e Avisos Escolares' : 'Agenda de Consultas e Compromissos'}
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            {isEscolar 
              ? 'Planeje reuniões de pais, conselhos, eventos comemorativos, passeios pedagógicos e avaliações lúdicas.'
              : 'Acompanhamento de exames, retornos médicos, vacinas, fisioterapia e terapias integradas.'}
          </p>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs hover:shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer text-sm"
        >
          <Plus className="w-5 h-5" />
          {isEscolar ? 'Agendar Reunião ou Evento' : 'Agendar Compromisso'}
        </button>
      </div>

      {isEscolar && (
        <div className="p-4 bg-indigo-50 border border-indigo-200/60 rounded-2xl flex items-start gap-3.5 shadow-3xs">
          <div className="text-xl"> </div>
          <div className="space-y-1">
            <h4 className="font-extrabold text-sm text-indigo-900">Mapeamento e Comunicados por Classe da Escolinha</h4>
            <p className="text-xs text-indigo-700 leading-relaxed">
              <strong>Como professora ou coordenadora</strong>, você não precisa cadastrar uma reunião aluno por aluno! Ao criar um compromisso ou aviso na agenda, marque a opção para <strong>Replicar para a classe toda de uma vez</strong>. O comunicado será publicado instantaneamente nas carteiras da turma. Você também pode apagar em massa diretamente da lixeira ao lado.
            </p>
          </div>
        </div>
      )}

      
      {compromissos.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 border border-soft-gray text-center space-y-3">
          <p className="text-slate-400">
            {isEscolar
              ? `Nenhum evento ou compromisso escolar cadastrado para o(a) aluno(a) ${idoso.nome}.`
              : `Nenhum compromisso médico cadastrado para ${idoso.nome}.`}
          </p>
          <button 
            onClick={() => setShowAddModal(true)}
            className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
          >
            {isEscolar ? 'Agendar o primeiro evento da escolinha' : 'Adicionar o primeiro compromisso de saúde'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {compromissos.map(appt => {
            const isDone = appt.status === 'realizado';
            const isToday = appt.data === '2026-05-30';
            const apptDate = new Date(appt.data + 'T00:00:00');
            
            return (
              <div 
                key={appt.id}
                className={`bg-white rounded-2xl border p-5 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  isDone 
                    ? 'border-dashed border-slate-200 bg-slate-50 opacity-70' 
                    : isToday
                    ? 'border-indigo-300 ring-2 ring-indigo-300/20 shadow-sm'
                    : 'border-soft-gray hover:border-slate-300'
                }`}
              >
                
                <div className="flex items-start md:items-center gap-4 w-full md:w-auto">
                  <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center shrink-0 border uppercase font-display select-none ${
                    isDone 
                      ? 'bg-slate-200 text-slate-500 border-slate-300' 
                      : isToday
                      ? 'bg-indigo-500 text-white border-indigo-400'
                      : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                  }`}>
                    <span className="text-[10px] font-bold leading-none pt-1">
                      {apptDate.toLocaleDateString('pt-BR', { month: 'short' }).slice(0,3)}
                    </span>
                    <span className="text-2xl font-black leading-none">
                      {apptDate.getDate()}
                    </span>
                  </div>
 
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${getTipoBadgeColor(appt.tipo)}`}>
                        {getTipoLabel(appt.tipo)}
                      </span>
                      {appt.broadcastGroupId && (
                        <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="animate-bounce"> </span> Comunicado Geral
                        </span>
                      )}
                      {isToday && (
                        <span className="bg-[#fee2e2] text-rose-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-full animate-pulse-slow">
                          {isEscolar ? 'Hoje na Escola' : 'Hoje!'}
                        </span>
                      )}
                      <span className="text-slate-400 text-xs font-mono font-bold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {appt.horario}
                      </span>
                    </div>

                    <h4 className={`text-base font-bold text-slate-800 leading-snug ${isDone ? 'line-through text-slate-500 font-medium' : ''}`}>
                      {appt.titulo}
                    </h4>

                    
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 font-medium pt-1">
                      <span className="flex items-center gap-1">
                        {isEscolar ? (
                          <>
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <strong>Responsável:</strong> {appt.medico} {appt.especialidade ? `(${appt.especialidade})` : ''}
                          </>
                        ) : (
                          <>
                            <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
                            Dr(a). {appt.medico} ({appt.especialidade})
                          </>
                        )}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {appt.local}
                      </span>
                    </div>

                    {appt.observacoes && (
                      <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 max-w-xl">
                        <strong>{isEscolar ? 'Recomendação / Nota:' : 'Nota:'}</strong> "{appt.observacoes}"
                      </p>
                    )}
                  </div>
                </div>

                
                <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center w-full md:w-auto gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleShareWhatsAppReminder(appt)}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all cursor-pointer border border-slate-200"
                      title={isEscolar ? "Compartilhar lembrete com os pais no WhatsApp" : "Enviar lembrete para a família via WhatsApp"}
                    >
                      <Share2 className="w-4.5 h-4.5" />
                    </button>
                    {isDone && (
                      <button
                        onClick={() => handleDeleteAppointment(appt.id, appt.titulo)}
                        className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all cursor-pointer border border-rose-200"
                        title={isEscolar ? "Excluir reunião/evento concluído" : "Excluir compromisso concluído"}
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    )}
                    {!isDone && (
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-0.5 select-none bg-slate-100 px-2 py-1 rounded" title="Notificação Ativa">
                        <Bell className="w-3 h-3 text-emerald-500 fill-emerald-500" /> Alerta Ativo
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleToggleStatus(appt.id)}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer ${
                      isDone 
                        ? 'bg-slate-200 text-slate-600 hover:bg-slate-300' 
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                    }`}
                  >
                    {isDone 
                      ? (isEscolar ? 'Reabrir Evento' : 'Reordenar Agenda') 
                      : (isEscolar ? 'Marcar como Concluído' : 'Marcar como Realizado')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 border border-soft-gray max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-4">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
              <Calendar className="w-6 h-6 text-indigo-600" />
              {isEscolar ? 'Agendar Reunião ou Evento Escolar' : 'Agendar Novo Compromisso Médico'}
            </h3>

            <form onSubmit={handleSaveAppointment} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-600 block">
                      {isEscolar ? 'Título do Evento ou Reunião *' : 'Título do Compromisso *'}
                    </label>
                    <VoiceInput 
                      onTranscript={text => setNewAppt(prev => ({ ...prev, titulo: prev.titulo ? prev.titulo + ' ' + text : text }))} 
                      size="sm"
                    />
                  </div>
                  <input 
                    type="text" 
                    placeholder={isEscolar ? 'Ex: Reunião de Pais Trimestral, Festa da Primavera, Passeio Pedagógico' : 'Ex: Consulta de Rotina Trimestral, Exame Laboratorial'} 
                    value={newAppt.titulo}
                    onChange={e => setNewAppt({ ...newAppt, titulo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 bg-slate-50 text-sm"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Tipo do Evento *</label>
                  <select 
                    value={newAppt.tipo}
                    onChange={e => setNewAppt({ ...newAppt, tipo: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 bg-slate-50 text-sm animate-fade-in"
                  >
                    {isEscolar ? (
                      <>
                        <option value="consulta">Reunião de Pais / Conselho</option>
                        <option value="exame">Festa ou Evento Especial</option>
                        <option value="retorno">Passeio / Atividade Externa</option>
                        <option value="fisioterapia">Apresentação / Atendimento</option>
                        <option value="vacina">Campanha de Vacinação</option>
                        <option value="outros">Outros Eventos</option>
                      </>
                    ) : (
                      <>
                        <option value="consulta">Consulta</option>
                        <option value="exame">Exame Clínico</option>
                        <option value="retorno">Retorno</option>
                        <option value="fisioterapia">Fisioterapia</option>
                        <option value="vacina">Vacinação</option>
                        <option value="outros">Outros compromissos</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-600 block">
                      {isEscolar ? 'Professor / Orientador Responsável *' : 'Médico / Especialista Responsável *'}
                    </label>
                    <VoiceInput 
                      onTranscript={text => setNewAppt(prev => ({ ...prev, medico: prev.medico ? prev.medico + ' ' + text : text }))} 
                      size="sm"
                    />
                  </div>
                  <input 
                    type="text" 
                    placeholder={isEscolar ? 'Ex: Coordenadora Ana Cláudia ou Profª Helenice' : 'Ex: Dr. Roberto Kardec'} 
                    value={newAppt.medico}
                    onChange={e => setNewAppt({ ...newAppt, medico: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 bg-slate-50 text-sm"
                    required
                  />
                </div>

                <div className={`space-y-1 ${isEscolar ? 'sm:col-span-2' : ''}`}>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-600 block">
                      {isEscolar ? 'Turma / Público-Alvo do Evento *' : 'Especialidade Clínica'}
                    </label>
                    <VoiceInput 
                      onTranscript={text => setNewAppt(prev => ({ ...prev, especialidade: prev.especialidade ? prev.especialidade + ' ' + text : text }))} 
                      size="sm"
                    />
                  </div>
                  <input 
                    type="text" 
                    placeholder={isEscolar ? 'Ex: Todo o Maternal, Berçário I - A, Toda a Escola' : 'Ex: Geriatria, Cardiologia'} 
                    value={newAppt.especialidade}
                    onChange={e => setNewAppt({ ...newAppt, especialidade: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 bg-slate-50 text-sm font-semibold text-slate-800"
                  />

                  {isEscolar && (
                    <div className="pt-2 space-y-3">
                      
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-extrabold text-indigo-900">
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Atalhos de Grupos e Categorias:</span>
                          </span>
                          <span className="text-[10px] text-indigo-600 font-medium hidden sm:inline">
                            Clique na categoria para marcar/desmarcar o grupo todo
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap gap-1.5">
                          {classroomCategories.map(cat => {
                            const isCategorySelected = cat.salas.length > 0 && cat.salas.every(s => selectedTargetClassrooms.includes(s));
                            return (
                              <button
                                key={`cat_${cat.id}`}
                                type="button"
                                onClick={() => {
                                  if (cat.id === 'escola_toda') {
                                    handleSelectAllSchool();
                                  } else {
                                    handleToggleCategory(cat.salas);
                                  }
                                }}
                                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                  isCategorySelected
                                    ? 'bg-indigo-600 text-white shadow-xs font-extrabold ring-2 ring-indigo-400 scale-102'
                                    : 'bg-white hover:bg-indigo-50 text-indigo-900 border border-indigo-200 hover:border-indigo-300'
                                }`}
                              >
                                {isCategorySelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                                <span>{cat.label}</span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${isCategorySelected ? 'bg-white/25 text-white' : 'bg-indigo-100 text-indigo-800'}`}>
                                  {cat.count} {cat.count === 1 ? 'aluno' : 'alunos'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-extrabold text-indigo-900">
                          <span className="flex items-center gap-1">
                            <School className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Salas de Aula (Selecione uma ou mais turmas):</span>
                          </span>
                          <span className="text-[10px] text-indigo-600 font-extrabold">
                            {selectedTargetClassrooms.length} turma(s) • {getStudentsCountForClasses(selectedTargetClassrooms)} alunos
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-indigo-50/70 border border-indigo-150 rounded-2xl shadow-3xs">
                          {activeSalas.map(sala => {
                            const isSelected = selectedTargetClassrooms.includes(sala.name);
                            const count = getStudentsCountForClass(sala.name);
                            return (
                              <button
                                key={`multi_sala_${sala.id}`}
                                type="button"
                                onClick={() => handleToggleClassroom(sala.name)}
                                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-indigo-600 text-white shadow-xs font-extrabold scale-102 ring-2 ring-indigo-400'
                                    : 'bg-white hover:bg-indigo-100/80 text-slate-700 border border-slate-250 hover:border-indigo-300'
                                }`}
                              >
                                {isSelected ? (
                                  <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                                ) : (
                                  <span className="text-sm">{sala.emoji || '🏫'}</span>
                                )}
                                <span>{sala.name}</span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${isSelected ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                  {count}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        
                        <div className="p-2.5 bg-indigo-100/70 border border-indigo-200 rounded-xl text-xs text-indigo-950 font-bold flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-indigo-700 shrink-0" />
                            <span>Público Alvo Selecionado: <strong>{getTargetSummaryText(selectedTargetClassrooms)}</strong></span>
                          </span>
                          <span className="px-2 py-0.5 bg-indigo-600 text-white font-extrabold rounded-lg text-[10px] shrink-0">
                            {getStudentsCountForClasses(selectedTargetClassrooms)} alunos
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-600 block">
                      {isEscolar ? 'Local na Escolinha *' : 'Localização / Clínica *'}
                    </label>
                    <VoiceInput 
                      onTranscript={text => setNewAppt(prev => ({ ...prev, local: prev.local ? prev.local + ' ' + text : text }))} 
                      size="sm"
                    />
                  </div>
                  <input 
                    type="text" 
                    placeholder={isEscolar ? 'Ex: Pátio do Berçário, Sala Temática, Auditório' : 'Ex: Consultório, Moema, Domicílio'} 
                    value={newAppt.local}
                    onChange={e => setNewAppt({ ...newAppt, local: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 bg-slate-50 text-sm"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Data *</label>
                  <input 
                    type="date" 
                    value={newAppt.data}
                    onChange={e => setNewAppt({ ...newAppt, data: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 bg-slate-50 text-sm"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Horário Previsto *</label>
                  <input 
                    type="time" 
                    value={newAppt.horario}
                    onChange={e => setNewAppt({ ...newAppt, horario: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 bg-slate-50 text-sm"
                    required
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-600 block">
                      {isEscolar ? 'Observações e Avisos aos Pais' : 'Instruções Prévias / Observações'}
                    </label>
                    <VoiceInput 
                      onTranscript={text => setNewAppt(prev => ({ ...prev, observacoes: prev.observacoes ? prev.observacoes + ' ' + text : text }))} 
                      size="sm"
                    />
                  </div>
                  <textarea 
                    placeholder={isEscolar ? 'Ex: Trazer autorização preenchida e assinada pela coordenação, lanche saudável para compartilhar...' : 'Ex: Ir em jejum de 8 horas, levar exames de sangue antigos.'}
                    rows={2.5}
                    value={newAppt.observacoes}
                    onChange={e => setNewAppt({ ...newAppt, observacoes: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 bg-slate-50 text-sm"
                  ></textarea>
                </div>

                {isEscolar && (
                  <div className="sm:col-span-2 p-3.5 bg-indigo-50 rounded-2xl border border-indigo-200/80 space-y-3 shadow-3xs">
                    <div className="flex items-start gap-3">
                      <input 
                        type="checkbox" 
                        id="newAppt_sendAll"
                        checked={enviarParaTodos}
                        onChange={e => setEnviarParaTodos(e.target.checked)}
                        className="w-5 h-5 rounded text-indigo-600 border-indigo-300 focus:ring-indigo-500 mt-0.5 cursor-pointer"
                      />
                      <div>
                        <label htmlFor="newAppt_sendAll" className="text-xs font-extrabold text-indigo-900 cursor-pointer select-none flex items-center gap-1.5">
                            Cadastrar evento em massa para as turmas selecionadas ({getStudentsCountForClasses(selectedTargetClassrooms)} alunos)
                        </label>
                        <span className="text-[10px] text-indigo-700 font-medium block mt-1 leading-relaxed">
                          Ative isto para cadastrar este evento na agenda de todos os alunos das turmas marcadas acima ({getTargetSummaryText(selectedTargetClassrooms)}).
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="sm:col-span-2 flex items-center gap-2 pt-1 h-6">
                  <input 
                    type="checkbox" 
                    id="newAppt_alerts"
                    checked={newAppt.alertasAtivos}
                    onChange={e => setNewAppt({ ...newAppt, alertasAtivos: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 border-slate-350 focus:ring-indigo-500 whitespace-nowrap cursor-pointer"
                  />
                  <label htmlFor="newAppt_alerts" className="text-xs font-bold text-slate-600 cursor-pointer select-none whitespace-normal">
                    {isEscolar 
                      ? 'Notificar envio deste evento no mural/WhatsApp dos pais ou responsáveis.'
                      : 'Ativar alertas automáticos e avisar família por WhatsApp.'}
                  </label>
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
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl cursor-pointer"
                >
                  {isEscolar ? 'Adicionar Evento' : 'Confirmar Agendamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      
      {deleteConfirmTarget && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in shadow-2xl">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 max-w-md w-full shadow-2xl space-y-4 text-left">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-base">Confirmar Exclusão</h4>
                <p className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider">Ação Irreversível</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Tem certeza de que deseja apagar o registro <strong>"{deleteConfirmTarget.titulo}"</strong>?
            </p>

            {isEscolar && deleteConfirmTarget.broadcastGroupId && (
              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
                <p className="text-[11px] font-black text-amber-950 flex items-center gap-1">
                  <span> </span> Este evento foi replicado para toda a turma!
                </p>
                <div className="space-y-2 text-xs font-semibold">
                  <label className="flex items-center gap-2 cursor-pointer text-amber-900">
                    <input
                      type="radio"
                      name="delete_scope"
                      checked={deleteBroadcastSelection === 'only_one'}
                      onChange={() => setDeleteBroadcastSelection('only_one')}
                      className="w-4 h-4 text-indigo-600 border-amber-300 focus:ring-indigo-500"
                    />
                    <span>Apagar apenas para o aluno atual <strong>({idoso.nome})</strong></span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-amber-900 text-left">
                    <input
                      type="radio"
                      name="delete_scope"
                      checked={deleteBroadcastSelection === 'all'}
                      onChange={() => setDeleteBroadcastSelection('all')}
                      className="w-4 h-4 text-indigo-600 border-amber-300 focus:ring-indigo-500"
                    />
                    <span>Apagar de TODA A CLASSE de uma vez</span>
                  </label>
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setDeleteConfirmTarget(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeDeleteAppointment}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs cursor-pointer"
              >
                Apagar Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

      
      {toggleConfirmTarget && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 max-w-md w-full shadow-2xl space-y-4 text-left">
            <div className="flex items-center gap-3 text-indigo-600">
              <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-base">Atualizar Evento Geral</h4>
                <p className="text-[10px] text-indigo-400 font-mono font-bold uppercase tracking-wider">Aviso da Turma</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              O evento <strong>"{toggleConfirmTarget.titulo}"</strong> é um comunicado geral de classe. Deseja atualizar o status dele para {toggleConfirmTarget.status === 'realizado' ? 'pendente' : 'realizado'}?
            </p>

            <div className="p-3.5 bg-indigo-50 rounded-2xl border border-indigo-150 text-xs font-semibold space-y-1">
              <p className="text-indigo-900">Selecione o escopo da alteração:</p>
              <p className="text-[11px] text-slate-500 font-medium">Você quer aplicar isso para todos os alunos ou apenas para {idoso.nome}?</p>
            </div>

            <div className="flex gap-2 justify-end pt-2 text-xs font-bold flex-wrap">
              <button
                type="button"
                onClick={() => setToggleConfirmTarget(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => executeToggleStatus(toggleConfirmTarget, false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl cursor-pointer"
              >
                Apenas {idoso.nome}
              </button>
              <button
                type="button"
                onClick={() => executeToggleStatus(toggleConfirmTarget, true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs cursor-pointer"
              >
                Toda a Classe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
