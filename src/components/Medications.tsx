import React, { useState, useEffect } from 'react';
import { Idoso, Medicamento, Usuario, TarefaDiaria, isStaffUser } from '../types';
import { getFromDB, saveToDB, checkFeedingCareAuthorization, compressImage, getShiftActiveState, getNowTimeBr } from '../data';
import { VoiceInput } from './VoiceInput';
import { 
  Plus, 
  Activity, 
  Calendar, 
  Clock, 
  AlertCircle, 
  Check, 
  Heart, 
  Upload, 
  Trash2, 
  Camera, 
  Search,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface MedicationsProps {
  key?: any;
  idoso: Idoso;
  usuarioAtual: Usuario;
  triggerWhatsAppSim: (titulo: string, mensagem: string) => void;
  accessibilitySettings: {
    fontSize: 'normal' | 'grande' | 'gigante';
    simplifiedMode: boolean;
  };
  keyTrigger: number;
}

export default function Medications({ 
  idoso, 
  usuarioAtual, 
  triggerWhatsAppSim, 
  accessibilitySettings,
  keyTrigger 
}: MedicationsProps) {
  const appMode = localStorage.getItem('anjo_app_mode') || 'idoso';
  const isEscolar = appMode === 'escolar_infantil' || appMode === 'escolar_fundamental';
  const prefixApp = isEscolar ? 'Anjinho Escolar' : 'Anjo Cuidador';

  const renderAuthBadge = () => {
    const auth = checkFeedingCareAuthorization();
    if (!auth.isAuthorized) {
      return (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 shadow-xs">
          <div className="text-xl">⚠</div>
          <div className="space-y-1">
            <h4 className="font-extrabold text-sm text-rose-950">
              {isEscolar ? 'Falta de Autorização Escolar dos Pais' : 'Falta de Autorização de Cuidados'}
            </h4>
            <p className="text-xs text-rose-800 leading-relaxed">
              {isEscolar 
                ? 'Nenhum pai ou responsável autorizou "Alimentação e Cuidados" no painel de Pais & Autorizados para este aluno. A gravação e a aplicação de novas medicações estão bloqueadas.'
                : 'Nenhum familiar responsável autorizou "Alimentação e Cuidados" no painel da Família. O registro e aplicação de medicações estão bloqueados.'}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 shadow-3xs">
        <div className="text-emerald-600 bg-white p-1 rounded-full text-xs font-black shadow-3xs">✓</div>
        <div className="text-xs font-semibold text-emerald-950">
          {isEscolar ? 'Autorização Ativa dos Pais: ' : 'Autorização Ativa da Família: '}
          <span className="font-extrabold text-emerald-800">
            {auth.authorizedNames.join(', ')}
          </span>
          <span className="text-[10px] text-emerald-600 font-medium ml-1.5">(Permissão concedida via Painel)</span>
        </div>
      </div>
    );
  };

  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [historicoDeHoje, setHistoricoDeHoje] = useState<TarefaDiaria[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShift, setSelectedShift] = useState<'todos' | 'Manhã' | 'Tarde' | 'Noite' | 'Madrugada'>('todos');
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; nome: string } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [localAlert, setLocalAlert] = useState<{ message: string; title?: string } | null>(null);

  const showAlert = (message: string, title?: string) => {
    setLocalAlert({ message, title: title || 'Aviso' });
  };
  
  const getTurno = (horarioStr: string): 'Manhã' | 'Tarde' | 'Noite' | 'Madrugada' => {
    const hora = Number(horarioStr?.split(':')[0] || '0');
    if (hora >= 6 && hora < 12) return 'Manhã';
    if (hora >= 12 && hora < 18) return 'Tarde';
    if (hora >= 18 && hora < 24) return 'Noite';
    return 'Madrugada';
  };
  
  // Design details for new medicine
  const [newMed, setNewMed] = useState({
    nome: '',
    dosagem: '',
    frequência: 'Diário',
    horarioManha: '08:00',
    horarioTarde: '',
    horarioNoite: '',
    horarioMadrugada: '',
    observacoes: '',
    selectedDias: ['Todos'],
    fotoEmbalagem: ''
  });

  const diasSemanaLong = ['Todos', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  // Mock Package Image Selections
  const mockPackImages = [
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=150', // red pill box
    'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=150', // green pills
    'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&q=80&w=150'  // orange bottle
  ];

  useEffect(() => {
    loadMeds();
  }, [idoso, keyTrigger]);

  const loadMeds = () => {
    // Lead from LocalStorage
    const allMeds = getFromDB<Medicamento[]>('anjo_medicamentos', []);
    setMedicamentos(allMeds.filter(m => m.idosoId === idoso.id));

    // Load today's logs (tasks of type medicacao)
    const allTasks = getFromDB<TarefaDiaria[]>('anjo_tarefas_diarias', []);
    const medTasksToday = allTasks.filter(t => t.idosoId === idoso.id && t.tipo === 'medicacao');
    setHistoricoDeHoje(medTasksToday);
  };

  const handleSaveMedicine = (e: React.FormEvent) => {
    e.preventDefault();
    const isMaster = localStorage.getItem('anjo_master_demonstracao_ativo') === 'true';
    const uType = (usuarioAtual.tipo || '').toLowerCase();
    const uParentesco = (usuarioAtual.parentesco || '').toLowerCase();
    const uObs = (usuarioAtual.observacoes || '').toLowerCase();
    const isConvidado = uType === 'familiar_convidado' || uType === 'convidado' || uParentesco.includes('convidado') || uObs.includes('convidado');

    if (isConvidado) {
      showAlert("⚠ Operação Não Autorizada: O Familiar Convidado tem acesso apenas de leitura ao diário. O cadastro de medicamentos e autorizações é exclusivo do Familiar Admin (mãe/pai responsável).", "Acesso Restrito");
      return;
    }

    if (isStaffUser(usuarioAtual) && usuarioAtual.tipo !== 'admin' && !isMaster) {
      showAlert(isEscolar 
        ? "⚠ Operação Não Autorizada: A inclusão de medicamentos é de responsabilidade exclusiva dos pais ou responsáveis (mãe/família)."
        : "⚠ Operação Não Autorizada: A inclusão de medicamentos é de responsabilidade exclusiva da família ou responsáveis.", "Acesso Restrito");
      return;
    }
    if (!newMed.nome || !newMed.dosagem) {
      setValidationError('Por favor, digite o nome e a dosagem do medicamento!');
      return;
    }

    const compiledHorarios: string[] = [];
    if (newMed.horarioManha) compiledHorarios.push(newMed.horarioManha);
    if (newMed.horarioTarde) compiledHorarios.push(newMed.horarioTarde);
    if (!isEscolar && newMed.horarioNoite) compiledHorarios.push(newMed.horarioNoite);
    if (!isEscolar && newMed.horarioMadrugada) compiledHorarios.push(newMed.horarioMadrugada);

    if (compiledHorarios.length === 0) {
      setValidationError('Por favor, defina o horário de pelo menos um turno!');
      return;
    }

    const allMeds = getFromDB<Medicamento[]>('anjo_medicamentos', []);
    const alreadyExistsMed = allMeds.some(m => m.idosoId === idoso.id && m.nome.toLowerCase().trim() === newMed.nome.toLowerCase().trim() && m.status === 'ativo');
    if (alreadyExistsMed) {
      const confirmSave = window.confirm(`⚠ Atenção: Já existe um medicamento ativo com o nome "${newMed.nome}" cadastrado para ${idoso.nome}!\n\nDeseja cadastrar outro perfil/prescrição para este mesmo medicamento?`);
      if (!confirmSave) return;
    }

    const novoMedicamento: Medicamento = {
      id: 'med_' + Date.now(),
      idosoId: idoso.id,
      nome: newMed.nome,
      dosagem: newMed.dosagem,
      frequência: newMed.frequência,
      horarios: compiledHorarios,
      diasSemana: newMed.selectedDias,
      observacoes: newMed.observacoes,
      fotoEmbalagem: newMed.fotoEmbalagem || mockPackImages[0],
      status: 'ativo'
    };

    // Save Medications
    allMeds.push(novoMedicamento);
    saveToDB('anjo_medicamentos', allMeds);

    // Save historical log of this creation
    const histKey = `anjo_historico_medicamentos_${idoso.id}`;
    const medHist = getFromDB<any[]>(histKey, []);
    medHist.push({
      id: 'hist_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      tipo: 'cadastro',
      nome: novoMedicamento.nome,
      detalhes: `Dosagem: ${novoMedicamento.dosagem || 'Sem dosagem'}, Frequência: ${novoMedicamento.frequência}, Horários: ${compiledHorarios.join(', ')}`,
      timestamp: new Date().toISOString(),
      autor: usuarioAtual.nome
    });
    saveToDB(histKey, medHist);

    // Automatically generate today's tasks for these new schedules so the user can interact right away
    const allTasks = getFromDB<TarefaDiaria[]>('anjo_tarefas_diarias', []);
    compiledHorarios.forEach((horario, index) => {
      const novaTarefaMedicamento: TarefaDiaria = {
        id: `task_med_${novoMedicamento.id}_${index}_${Date.now()}`,
        idosoId: idoso.id,
        tipo: 'medicacao',
        titulo: `${novoMedicamento.nome}`,
        descricao: `Dosagem: ${novoMedicamento.dosagem}. Obs: ${novoMedicamento.observacoes || 'Sem notas adicionais.'}`,
        horarioPrevisto: horario,
        status: 'pendente'
      };
      allTasks.push(novaTarefaMedicamento);
    });
    saveToDB('anjo_tarefas_diarias', allTasks);

    // WhatsApp Simulation dispatch
    const alertMsg = `${prefixApp}: Novo medicamento "${novoMedicamento.nome}" (${novoMedicamento.dosagem}) programado por ${isEscolar && usuarioAtual.tipo !== 'familiar' && usuarioAtual.tipo !== 'admin' ? 'Profª ' : ''}${usuarioAtual.nome} para os horários ${compiledHorarios.join(' e ')}.`;
    triggerWhatsAppSim('Novo Medicamento Cadastrado', alertMsg);

    // Dispatch global sync events so Professor / Caregiver Dashboard reloads immediately
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('db-vitals-update'));
      window.dispatchEvent(new CustomEvent('anjo_user_updated'));
    }

    // Reset Form
    setNewMed({
      nome: '',
      dosagem: '',
      frequência: 'Diário',
      horarioManha: '08:00',
      horarioTarde: '',
      horarioNoite: '',
      horarioMadrugada: '',
      observacoes: '',
      selectedDias: ['Todos'],
      fotoEmbalagem: ''
    });
    setShowAddModal(false);
    loadMeds();
  };

  const handleToggleDay = (dia: string) => {
    let updated = [...newMed.selectedDias];
    if (dia === 'Todos') {
      updated = ['Todos'];
    } else {
      updated = updated.filter(d => d !== 'Todos');
      if (updated.includes(dia)) {
        updated = updated.filter(d => d !== dia);
        if (updated.length === 0) updated = ['Todos'];
      } else {
        updated.push(dia);
      }
    }
    setNewMed({ ...newMed, selectedDias: updated });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 200, 200, 0.4);
        setNewMed(prev => ({ ...prev, fotoEmbalagem: compressed }));
      } catch (err) {
        console.error('Erro ao comprimir imagem, usando fallback:', err);
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            const res = typeof reader.result === 'string' ? reader.result : '';
            setNewMed(prev => ({ ...prev, fotoEmbalagem: res }));
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSuspendMedicine = (medId: string) => {
    const isMaster = localStorage.getItem('anjo_master_demonstracao_ativo') === 'true';
    if (isStaffUser(usuarioAtual) && usuarioAtual.tipo !== 'admin' && !isMaster) {
      showAlert(isEscolar 
        ? "⚠ Operação Não Autorizada: A suspensão ou reativação de medicamentos é de responsabilidade exclusiva dos pais ou responsáveis."
        : "⚠ Operação Não Autorizada: A suspensão ou reativação de medicamentos é de responsabilidade exclusiva da família ou responsáveis.", "Acesso Restrito");
      return;
    }

    const allMeds = getFromDB<Medicamento[]>('anjo_medicamentos', []);
    let matchName = '';
    let statusLabel = '';
    let targetMed: Medicamento | null = null;
    
    const updated = allMeds.map(m => {
      if (m.id === medId) {
        const nextStatus = m.status === 'ativo' ? 'suspenso' : 'ativo';
        matchName = m.nome;
        statusLabel = nextStatus;
        targetMed = { ...m, status: nextStatus as 'ativo' | 'suspenso' };
        // Sim WhatsApp message
        triggerWhatsAppSim(
          `${isEscolar ? 'Remédio' : 'Medicamento'} ${nextStatus === 'suspenso' ? 'Suspenso' : 'Reativado'}`,
          `${prefixApp}: O medicamento "${m.nome}" de ${idoso.nome} foi marcado como ${nextStatus} por ${isEscolar && usuarioAtual.tipo !== 'familiar' && usuarioAtual.tipo !== 'admin' ? 'Profª ' : ''}${usuarioAtual.nome}.`
        );
        return targetMed;
      }
      return m;
    });

    saveToDB('anjo_medicamentos', updated);

    // Sync active tasks in anjo_tarefas_diarias
    const allTasks = getFromDB<TarefaDiaria[]>('anjo_tarefas_diarias', []);
    if (statusLabel === 'suspenso') {
      const cleanName = matchName.toLowerCase().trim();
      const baseName = cleanName.split('(')[0].trim();
      const updatedTasks = allTasks.filter(t => {
        if (t.idosoId !== idoso.id) return true;
        if (t.tipo !== 'medicacao') return true;
        if (t.id.includes(medId)) return false;

        const cleanTitle = t.titulo.toLowerCase().trim();
        const baseTitle = cleanTitle.split('(')[0].trim();
        const isMatch = cleanTitle === cleanName ||
                        cleanTitle.includes(baseName) ||
                        cleanName.includes(baseTitle) ||
                        baseTitle.includes(baseName) ||
                        baseName.includes(baseTitle);
        return !isMatch;
      });
      saveToDB('anjo_tarefas_diarias', updatedTasks);
    } else if (statusLabel === 'ativo' && targetMed) {
      const cleanName = matchName.toLowerCase().trim();
      const baseName = cleanName.split('(')[0].trim();
      const hasTask = allTasks.some(t => {
        if (t.idosoId !== idoso.id || t.tipo !== 'medicacao') return false;
        const cleanTitle = t.titulo.toLowerCase().trim();
        const baseTitle = cleanTitle.split('(')[0].trim();
        return cleanTitle === cleanName || cleanTitle.includes(baseName) || baseTitle.includes(baseName);
      });

      if (!hasTask) {
        const schedules = (targetMed as Medicamento).horarios || ['08:00'];
        schedules.forEach((horario, index) => {
          allTasks.push({
            id: `task_med_${targetMed!.id}_${index}_${Date.now()}`,
            idosoId: idoso.id,
            tipo: 'medicacao',
            titulo: `${targetMed!.nome}`,
            descricao: `Dosagem: ${targetMed!.dosagem}. Obs: ${targetMed!.observacoes || 'Sem notas adicionais.'}`,
            horarioPrevisto: horario,
            status: 'pendente'
          });
        });
        saveToDB('anjo_tarefas_diarias', allTasks);
      }
    }

    // Save historical log of this status change
    if (matchName) {
      const histKey = `anjo_historico_medicamentos_${idoso.id}`;
      const medHist = getFromDB<any[]>(histKey, []);
      medHist.push({
        id: 'hist_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        tipo: statusLabel === 'suspenso' ? 'suspensao' : 'reativacao',
        nome: matchName,
        detalhes: `Uso do medicamento foi marcado como ${statusLabel === 'suspenso' ? 'temporariamente suspenso' : 'reativado'}.`,
        timestamp: new Date().toISOString(),
        autor: usuarioAtual.nome
      });
      saveToDB(histKey, medHist);
    }

    // Dispatch global sync events for teacher / caregiver dashboard
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('db-vitals-update'));
      window.dispatchEvent(new CustomEvent('anjo_user_updated'));
    }

    loadMeds();
  };

  const handleDeleteMedicine = (medId: string, name: string) => {
    const isMaster = localStorage.getItem('anjo_master_demonstracao_ativo') === 'true';
    if (isStaffUser(usuarioAtual) && usuarioAtual.tipo !== 'admin' && !isMaster) {
      showAlert(isEscolar 
        ? "⚠ Operação Não Autorizada: A exclusão de medicamentos é de responsabilidade exclusiva dos pais ou responsáveis."
        : "⚠ Operação Não Autorizada: A exclusão de medicamentos é de responsabilidade exclusiva da família ou responsáveis.", "Acesso Restrito");
      return;
    }
    setDeleteConfirmation({ id: medId, nome: name });
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmation) return;
    const { id: medId, nome: name } = deleteConfirmation;

    // 1. Remove from medications list
    const allMeds = getFromDB<Medicamento[]>('anjo_medicamentos', []);
    const updatedMeds = allMeds.filter(m => m.id !== medId);
    saveToDB('anjo_medicamentos', updatedMeds);

    // Save historical log of this deletion
    const histKey = `anjo_historico_medicamentos_${idoso.id}`;
    const medHist = getFromDB<any[]>(histKey, []);
    medHist.push({
      id: 'hist_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      tipo: 'exclusao',
      nome: name,
      detalhes: `Medicamento excluído definitivamente e tarefas pendentes removidas.`,
      timestamp: new Date().toISOString(),
      autor: usuarioAtual.nome
    });
    saveToDB(histKey, medHist);

    // 2. Remove today's related tasks (pending, delayed, etc.) linked to this medicine so it doesn't clutter the checklist
    const allTasks = getFromDB<TarefaDiaria[]>('anjo_tarefas_diarias', []);
    const updatedTasks = allTasks.filter(t => {
      // Keep tasks for other seniors/kids
      if (t.idosoId !== idoso.id) return true;
      // Keep non-medication tasks
      if (t.tipo !== 'medicacao') return true;

      // If the task ID contains the deleted medication ID, remove it
      if (t.id.includes(medId)) {
        return false;
      }

      // If the task title matches the medication name or contains it (case insensitive)
      const cleanTitle = t.titulo.toLowerCase().trim();
      const cleanName = name.toLowerCase().trim();

      // Remove specific suffixes like "(Pressão)", "(Glicofage)", "(Aricept)"
      const baseTitle = cleanTitle.split('(')[0].trim();
      const baseName = cleanName.split('(')[0].trim();

      if (
        cleanTitle === cleanName || 
        cleanTitle.includes(baseName) || 
        cleanName.includes(baseTitle) ||
        baseTitle.includes(baseName) ||
        baseName.includes(baseTitle)
      ) {
        return false;
      }

      return true;
    });
    saveToDB('anjo_tarefas_diarias', updatedTasks);

    // 3. Dispatch WhatsApp Notification simulator
    triggerWhatsAppSim(
      isEscolar ? 'Remédio Retirado' : 'Medicamento Excluído',
      `${prefixApp}: O medicamento "${name}" de ${idoso.nome} foi EXCLUÍDO definitivamente do app por ${isEscolar && usuarioAtual.tipo !== 'familiar' && usuarioAtual.tipo !== 'admin' ? 'Profª ' : ''}${usuarioAtual.nome}.`
    );

    // Dispatch global sync events for teacher / caregiver dashboard
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('db-vitals-update'));
      window.dispatchEvent(new CustomEvent('anjo_user_updated'));
    }

    // 4. Reload page states
    setDeleteConfirmation(null);
    loadMeds();
  };

  // Toggle active checklist from medications screen itself to reflect on overall day status
  const handleToggleChecklistStatus = (taskId: string, titleName: string) => {
    const isShiftActive = getShiftActiveState(idoso.id).active;
    if (usuarioAtual.tipo !== 'familiar' && usuarioAtual.tipo !== 'admin' && !isShiftActive) {
      showAlert(isEscolar ? "⚠ Operação Bloqueada: Por favor, inicie o período letivo antes de registrar medicações!" : "⚠ Operação Bloqueada: Por favor, inicie o seu turno de cuidados antes de registrar medicações!", "Período Não Iniciado");
      return;
    }
    const auth = checkFeedingCareAuthorization();
    if (usuarioAtual.tipo !== 'familiar' && usuarioAtual.tipo !== 'admin' && !auth.isAuthorized) {
      showAlert(isEscolar 
        ? "⚠ Operação Não Autorizada: Nenhum pai ou responsável autorizou \"Alimentação e Cuidados\" no painel \"Pais & Autorizados\" para este aluno. A professora/cuidadora não pode registrar a administração de medicamentos."
        : "⚠ Operação Não Autorizada: Nenhum familiar responsável autorizou \"Alimentação e Cuidados\" no painel \"Família\". O cuidador não pode registrar a administração de medicamentos.", "Sem Autorização");
      return;
    }
    const allTasks = getFromDB<TarefaDiaria[]>('anjo_tarefas_diarias', []);
    const updated = allTasks.map(t => {
      if (t.id === taskId) {
        const isCompleted = t.status === 'concluido';
        const nextStatus = isCompleted ? 'pendente' : 'concluido';
        
        if (nextStatus === 'concluido') {
          triggerWhatsAppSim(
            isEscolar ? 'Remédio Administrado' : 'Medicação Confirmada',
            `${prefixApp}: ${idoso.nome} tomou o medicamento "${titleName}" às ${getNowTimeBr()}, confirmado por ${usuarioAtual.nome}.`
          );
        }

        return {
          ...t,
          status: nextStatus as any,
          concluidaEm: nextStatus === 'concluido' ? getNowTimeBr() : undefined,
          completadaPor: nextStatus === 'concluido' ? usuarioAtual.nome : undefined
        };
      }
      return t;
    });
    saveToDB('anjo_tarefas_diarias', updated);
    loadMeds();
  };

  const filteredMeds = medicamentos.filter(med => 
    med.nome.toLowerCase().includes(searchQuery.toLowerCase()) || 
    med.observacoes.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header with Search and Action Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Activity className="w-6 h-6 text-serene-blue" />
            Controle de Medicamentos
          </h2>
          <p className="text-sm text-slate-500">
            Estoque, horários previstos e históricos de ingestão diária de remédios.
          </p>
        </div>

        {(() => {
          const uType = (usuarioAtual.tipo || '').toLowerCase();
          const uParentesco = (usuarioAtual.parentesco || '').toLowerCase();
          const uObs = (usuarioAtual.observacoes || '').toLowerCase();
          const isConvidado = uType === 'familiar_convidado' || uType === 'convidado' || uParentesco.includes('convidado') || uObs.includes('convidado');
          const isMaster = localStorage.getItem('anjo_master_demonstracao_ativo') === 'true';

          if (isConvidado) {
            return (
              <div className="px-4 py-2 bg-purple-50 border border-purple-200 rounded-xl text-xs font-bold text-purple-900 flex items-center gap-1.5 shadow-xs">
                <span>  Familiar Convidado (Somente Leitura)</span>
              </div>
            );
          }

          if (!isStaffUser(usuarioAtual) || uType === 'familiar' || uType === 'familiar_admin' || uType === 'admin' || isMaster) {
            return (
              <button 
                onClick={() => setShowAddModal(true)}
                className="px-5 py-3 bg-serene-blue hover:bg-blue-600 text-white font-bold rounded-xl shadow-xs hover:shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <Plus className="w-5 h-5" /> Cadastrar Medicamento
              </button>
            );
          }

          return (
            <div className="px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 flex items-center gap-1.5 shadow-xs">
              <span>  Gestão restrita aos Pais/Responsáveis</span>
            </div>
          );
        })()}
      </div>

      {renderAuthBadge()}

      {/* Checklist of Today's Schedules */}
      <div className="bg-white rounded-2xl p-5 border border-soft-gray space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-700 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500 animate-pulse" />
            Organizador de Pílulas por Turnos (Hoje)
          </h3>
          <span className="text-xs bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-md">
            Visualizador Rápido de Cuidados
          </span>
        </div>

        {/* Turnos selectors row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <button
            type="button"
            onClick={() => setSelectedShift('todos')}
            className={`px-3 py-2 rounded-xl font-bold text-xs transition-all border cursor-pointer text-center flex flex-col justify-center items-center gap-0.5 ${
              selectedShift === 'todos'
                ? 'bg-serene-blue text-white border-serene-blue shadow-md'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <span className="font-bold text-xs">✨ Todos os Turnos</span>
            <span className={`text-[10px] font-semibold ${selectedShift === 'todos' ? 'text-white/80' : 'text-slate-400'}`}>
              ({historicoDeHoje.filter(t => t.status === 'concluido').length}/{historicoDeHoje.length})
            </span>
          </button>

          {(['Manhã', 'Tarde', 'Noite', 'Madrugada'] as const).map(turnoId => {
            const shiftTasks = historicoDeHoje.filter(t => getTurno(t.horarioPrevisto) === turnoId);
            const shiftDone = shiftTasks.filter(t => t.status === 'concluido').length;
            const shiftTotal = shiftTasks.length;
            
            const icon = turnoId === 'Manhã' ? ' ' : turnoId === 'Tarde' ? '☀' : turnoId === 'Noite' ? ' ' : ' ';
            const isActive = selectedShift === turnoId;

            return (
              <button
                key={turnoId}
                type="button"
                onClick={() => setSelectedShift(turnoId)}
                className={`px-3 py-2 rounded-xl font-bold text-xs transition-all border cursor-pointer text-center flex flex-col justify-center items-center gap-0.5 ${
                  isActive
                    ? 'bg-serene-blue text-white border-serene-blue shadow-md'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <span className="text-xs font-bold">{icon} {turnoId}</span>
                <span className={`text-[10px] font-semibold ${isActive ? 'text-white/80' : 'text-slate-400'}`}>
                  {shiftDone}/{shiftTotal} Tomados
                </span>
              </button>
            );
          })}
        </div>

        {/* List of active filtered turn tasks */}
        {historicoDeHoje.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">Nenhum controle de remédio programado para hoje.</p>
        ) : (
          <div className="space-y-6 pt-2">
            {(['Manhã', 'Tarde', 'Noite', 'Madrugada'] as const).map(turnoId => {
              // If not looking at todos and not matching active turn, bypass
              if (selectedShift !== 'todos' && selectedShift !== turnoId) return null;

              const shiftTasks = historicoDeHoje.filter(t => getTurno(t.horarioPrevisto) === turnoId);
              if (shiftTasks.length === 0) {
                // If specific shift selected and has 0 meds, show placeholder
                if (selectedShift === turnoId) {
                  return (
                    <div key={turnoId} className="p-6 border border-dashed rounded-2xl bg-slate-50 text-center text-slate-400 text-xs font-semibold">
                      Sem medicações programadas para o período da {turnoId} ({turnoId === 'Manhã' ? '06:00 - 12:00' : turnoId === 'Tarde' ? '12:00 - 18:00' : turnoId === 'Noite' ? '18:00 - 00:00' : '00:00 - 06:00'}).
                    </div>
                  );
                }
                return null;
              }

              const icon = turnoId === 'Manhã' ? ' ' : turnoId === 'Tarde' ? '☀' : turnoId === 'Noite' ? ' ' : ' ';
              const labelRange = turnoId === 'Manhã' ? '06h às 12h' : turnoId === 'Tarde' ? '12h às 18h' : turnoId === 'Noite' ? '18h às 00h' : '00h às 06h';

              return (
                <div key={turnoId} className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1.5">
                    <span>{icon} {turnoId}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-450 px-2 py-0.5 rounded font-bold font-mono normal-case tracking-normal">{labelRange}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {shiftTasks.map(task => {
                      const isChecked = task.status === 'concluido';
                      const isDelayed = task.status === 'atrasado';
                      
                      return (
                        <div 
                          key={task.id}
                          className={`p-4 border rounded-2xl flex items-center justify-between gap-3 transition-colors ${
                            isChecked 
                              ? 'bg-emerald-50/50 border-emerald-350' 
                              : isDelayed
                              ? 'bg-rose-50/50 border-rose-350 animate-pulse'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-md">
                                {task.horarioPrevisto}
                              </span>
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                isChecked 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : isDelayed 
                                  ? 'bg-rose-100 text-rose-800' 
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {task.status}
                              </span>
                            </div>
                            <h4 className={`text-base font-bold text-slate-805 ${isChecked ? 'line-through text-slate-400 font-medium' : ''}`}>
                              {task.titulo}
                            </h4>
                            <p className="text-xs text-slate-500 leading-normal">
                              {task.descricao}
                            </p>
                            {isChecked && (
                              <p className="text-[11px] font-semibold text-emerald-705 flex items-center gap-1 mt-0.5">
                                <Check className="w-3.5 h-3.5 text-emerald-600" /> Tomado às {task.concluidaEm} por {task.completadaPor}
                              </p>
                            )}
                          </div>

                          <button
                            onClick={() => handleToggleChecklistStatus(task.id, task.titulo)}
                            className={`w-10 h-10 rounded-xl shrink-0 border flex items-center justify-center transition-all cursor-pointer ${
                              isChecked 
                                ? 'bg-care-green border-care-green text-white shadow-sm' 
                                : 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            <Check className={`w-6 h-6 ${isChecked ? 'opacity-100' : 'opacity-30'}`} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Inventory / List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-zinc-800">Remédios Cadastrados</h3>
          
          {/* Search bar inside medications */}
          <div className="bg-white border border-soft-gray rounded-xl flex items-center px-3 py-1.5 focus-within:ring-2 focus-within:ring-serene-blue/20">
            <Search className="w-4 h-4 text-slate-400 mr-2" />
            <input 
              type="text" 
              placeholder="Buscar remédio..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="text-sm outline-hidden text-slate-700 w-full md:w-48 placeholder:text-slate-400 bg-transparent"
            />
          </div>
        </div>

        {filteredMeds.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-soft-gray text-center space-y-2">
            <p className="text-slate-500">Nenhum medicamento encontrado para os critérios de busca.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMeds.map(med => {
              const isSuspended = med.status === 'suspenso';
              
              return (
                <div 
                  key={med.id}
                  className={`bg-white rounded-2xl border ${isSuspended ? 'border-dashed border-slate-300 opacity-60' : 'border-soft-gray hover:border-slate-300'} p-5 transition-all flex flex-col justify-between space-y-4`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider mb-1.5 ${
                          isSuspended ? 'bg-slate-200 text-slate-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {med.status}
                        </span>
                        <h4 className="font-bold text-lg text-slate-800 leading-tight">
                          {med.nome}
                        </h4>
                      </div>
                      
                      {/* Package mockup image */}
                      <img 
                        referrerPolicy="no-referrer"
                        src={med.fotoEmbalagem || mockPackImages[0]} 
                        alt={med.nome} 
                        className="w-14 h-14 object-cover rounded-xl border border-soft-gray bg-slate-50 shrink-0"
                      />
                    </div>

                    <div className="space-y-1 text-slate-600 text-sm">
                      <p className="flex items-center gap-1.5 font-medium">
                        <Activity className="w-4 h-4 text-slate-400" />
                        Dosagem: <strong className="text-zinc-800 font-bold">{med.dosagem}</strong>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        Freq: {med.frequência} ({med.diasSemana.join(', ')})
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-slate-400" />
                        Horários: <span className="font-mono bg-zinc-100 px-1.5 py-0.5 rounded text-xs font-bold text-zinc-750">{med.horarios.join(', ')}</span>
                      </p>
                    </div>

                    {med.observacoes && (
                      <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed italic">
                        "{med.observacoes}"
                      </p>
                    )}
                  </div>

                  {usuarioAtual.tipo === 'familiar' || usuarioAtual.tipo === 'admin' || localStorage.getItem('anjo_master_demonstracao_ativo') === 'true' ? (
                    <div className="pt-3 border-t border-slate-150 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-bold">
                        <button
                           onClick={() => handleSuspendMedicine(med.id)}
                           className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider cursor-pointer transition-all ${
                             isSuspended ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                           }`}
                        >
                          {isSuspended ? 'Reativar' : 'Suspender'}
                        </button>

                        <button
                           onClick={() => handleDeleteMedicine(med.id, med.nome)}
                           className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 rounded-xl transition-all border border-rose-150 cursor-pointer"
                           title="Excluir Definitivamente"
                           id={`delete-med-${med.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="text-[10px] font-black uppercase tracking-wider md:hidden">Excluir</span>
                        </button>
                      </div>

                      <span className="text-slate-400 text-[10px] font-mono font-semibold bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">ID: {med.id.slice(0, 8)}</span>
                    </div>
                  ) : (
                    <div className="pt-3 border-t border-slate-150 flex items-center justify-between text-slate-400 text-[11px] font-semibold">
                      <span className="flex items-center gap-1">  Gestão restrita aos pais</span>
                      <span className="text-slate-400 text-[10px] font-mono font-semibold bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">ID: {med.id.slice(0, 8)}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add New Medicine Modal Dialog */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 border border-soft-gray max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-4">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Plus className="w-6 h-6 text-serene-blue" />
              Cadastrar Novo Medicamento
            </h3>

            <form onSubmit={handleSaveMedicine} className="space-y-4">
              {validationError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-extrabold flex items-center gap-2 animate-fade-in" id="med-form-validation-error">
                  <span className="text-sm shrink-0">⚠</span>
                  <span>{validationError}</span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Nome do Medicamento *</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Losartana Potássica" 
                    value={newMed.nome}
                    onChange={e => setNewMed({ ...newMed, nome: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-serene-blue/20 bg-slate-50 text-sm"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Dosagem *</label>
                  <input 
                    type="text" 
                    placeholder="Ex: 50mg - 1 comprimido" 
                    value={newMed.dosagem}
                    onChange={e => setNewMed({ ...newMed, dosagem: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-serene-blue/20 bg-slate-50 text-sm"
                    required
                  />
                </div>

                <div className="space-y-2 sm:col-span-2 border-t border-slate-100 pt-3">
                  <span className="text-xs font-bold text-slate-700 block mb-1">Horários por Turno (Preencha os horários que se aplicam)</span>
                  <div className={`grid ${isEscolar ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2'} gap-3`}>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                      <label className="text-[11px] font-bold text-amber-600 block flex items-center gap-1">  Manhã (06h - 12h)</label>
                      <input 
                        type="time" 
                        value={newMed.horarioManha}
                        onChange={e => setNewMed({ ...newMed, horarioManha: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl bg-white text-xs font-bold focus:ring-1 focus:outline-hidden text-slate-700"
                      />
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                      <label className="text-[11px] font-bold text-orange-600 block flex items-center gap-1">☀ Tarde (12h - 18h)</label>
                      <input 
                        type="time" 
                        value={newMed.horarioTarde}
                        onChange={e => setNewMed({ ...newMed, horarioTarde: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl bg-white text-xs font-bold focus:ring-1 focus:outline-hidden text-slate-700"
                      />
                    </div>
                    {!isEscolar && (
                      <>
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                          <label className="text-[11px] font-bold text-indigo-600 block flex items-center gap-1">  Noite (18h - 00h)</label>
                          <input 
                            type="time" 
                            value={newMed.horarioNoite}
                            onChange={e => setNewMed({ ...newMed, horarioNoite: e.target.value })}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl bg-white text-xs font-bold focus:ring-1 focus:outline-hidden text-slate-700"
                          />
                        </div>
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                          <label className="text-[11px] font-bold text-purple-600 block flex items-center gap-1">  Madrugada (00h - 06h)</label>
                          <input 
                            type="time" 
                            value={newMed.horarioMadrugada}
                            onChange={e => setNewMed({ ...newMed, horarioMadrugada: e.target.value })}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl bg-white text-xs font-bold focus:ring-1 focus:outline-hidden text-slate-700"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-600 block">Dias da Semana</label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {diasSemanaLong.map(dia => {
                      const active = newMed.selectedDias.includes(dia);
                      return (
                        <button
                          key={dia}
                          type="button"
                          onClick={() => handleToggleDay(dia)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                            active 
                              ? 'bg-serene-blue border-serene-blue text-white' 
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                          }`}
                        >
                          {dia}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3 sm:col-span-2 border-t border-slate-100 pt-3">
                  <label className="text-xs font-bold text-slate-700 block">Foto ou Imagem do Medicamento (Opcional)</label>
                  
                  {/* Selector of quick templates */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-medium text-slate-500 block">Opção 1: Selecionar modelo rápido</span>
                    <div className="flex items-center gap-3">
                      {mockPackImages.map((img, idx) => {
                        const isSel = newMed.fotoEmbalagem === img;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setNewMed({ ...newMed, fotoEmbalagem: img })}
                            className={`relative rounded-xl border overflow-hidden w-12 h-12 transition-all ${
                              isSel ? 'ring-2 ring-serene-blue border-transparent scale-105' : 'border-slate-200 opacity-70 hover:opacity-100'
                            }`}
                          >
                            <img referrerPolicy="no-referrer" src={img} alt="embalagem" className="w-full h-full object-cover" />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Upload file directly */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <span className="text-[11px] font-medium text-slate-500 block">Opção 2: Enviar foto do celular/computador</span>
                      <label className="flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer text-xs font-bold text-slate-600">
                        <Camera className="w-4 h-4 text-slate-500" />
                        <span>Tirar Foto / Anexar</span>
                        <input 
                          type="file" 
                          aria-label="Anexar foto do medicamento"
                          accept="image/*" 
                          onChange={handlePhotoUpload} 
                          className="hidden" 
                        />
                      </label>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-medium text-slate-500 block">Opção 3: Inserir link da imagem (URL)</span>
                      <input 
                        type="text" 
                        placeholder="Ex: https://site.com/remedio.png" 
                        value={(newMed.fotoEmbalagem && newMed.fotoEmbalagem.startsWith('data:')) ? '' : (newMed.fotoEmbalagem || '')}
                        onChange={e => setNewMed({ ...newMed, fotoEmbalagem: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-serene-blue/20 bg-slate-50 text-xs text-slate-800"
                      />
                    </div>
                  </div>

                  {newMed.fotoEmbalagem && (
                    <div className="flex items-center gap-3 p-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <img 
                        referrerPolicy="no-referrer" 
                        src={newMed.fotoEmbalagem} 
                        alt="Previa do medicamento" 
                        className="w-12 h-12 object-cover rounded-lg border border-emerald-300" 
                      />
                      <div>
                        <span className="text-xs font-bold text-emerald-800 block">Imagem Carregada!</span>
                        <button 
                          type="button" 
                          onClick={() => setNewMed({ ...newMed, fotoEmbalagem: '' })}
                          className="text-[10px] text-rose-600 hover:underline font-bold"
                        >
                          Remover imagem
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-600 block">Instruções de administração / Observações</label>
                    <VoiceInput 
                      onTranscript={text => setNewMed(prev => ({ ...prev, observacoes: prev.observacoes ? prev.observacoes + ' ' + text : text }))} 
                      size="sm"
                    />
                  </div>
                  <textarea 
                    placeholder="Ex: Tomar com estômago cheio. Diluir saco em 100ml de suco."
                    rows={2}
                    value={newMed.observacoes}
                    onChange={e => setNewMed({ ...newMed, observacoes: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-serene-blue/20 bg-slate-50 text-sm"
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
                  Confirmar Cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Medicine Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 border border-rose-100 max-w-md w-full shadow-2xl relative space-y-4">
            <div className="flex items-center gap-3 text-rose-600 border-b border-rose-50 pb-3">
              <div className="p-2 bg-rose-50 rounded-xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-800">
                  Excluir Medicamento?
                </h3>
                <p className="text-[10px] text-slate-400 font-mono">Esta ação é irreversível</p>
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-2.5 leading-relaxed">
              <p>
                Você está prestes a excluir definitivamente o medicamento:
              </p>
              <div className="p-3 bg-rose-50/40 rounded-2xl border border-rose-100/50 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-black tracking-wider text-rose-500 block">Identificado</span>
                  <strong className="text-sm font-bold text-slate-800">💊 {deleteConfirmation.nome}</strong>
                </div>
                <span className="text-[10px] font-mono text-slate-400">ID: {deleteConfirmation.id.slice(0, 8)}</span>
              </div>
              <p className="font-medium text-slate-500">
                ⚠ <strong className="text-slate-800">O que acontece ao confirmar?</strong>
              </p>
              <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-500">
                <li>O remédio será removido da listagem de estoque de medicamentos.</li>
                <li>Todas as tarefas <strong className="text-slate-705">pendentes</strong> vinculadas a ele hoje serão eliminadas do checklist do cuidador para não poluir o painel de rotinas do turno atual.</li>
                <li>Uma simulação de aviso via WhatsApp será disparada para controle.</li>
              </ul>
            </div>

            <div className="flex gap-2 justify-end pt-2 text-xs">
              <button 
                type="button" 
                onClick={() => setDeleteConfirmation(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-650 font-black rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={handleConfirmDelete}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-black rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5 animate-pulse" />
                Sim, Excluir Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

      {localAlert && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-fade-in" id="medications-alert-modal">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-rose-600 font-extrabold text-base border-b border-slate-100 pb-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h4>{localAlert.title || 'Aviso'}</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
              {localAlert.message}
            </p>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setLocalAlert(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
