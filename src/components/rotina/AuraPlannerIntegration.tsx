import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Clock, CheckCircle2, RotateCcw, Trash2, Edit2, Check, Mic, 
  Plus, Calendar, Save, X, Utensils, Moon, Droplets, BookOpen, 
  XCircle, Filter, RefreshCw, Layers, Pill, Heart
} from 'lucide-react';
import { parseAuraRawPlan, ParsedAuraActivity } from '../../utils/auraPlanParser';
import { DEFAULT_INITIAL_ACTIVITIES as PLAN_ACTIVITIES } from '../../data/weeklyPlan';
import { StudentPaxData } from '../../types';

interface Props {
  onConcluirAtividadePedagogica?: (act: ParsedAuraActivity) => void;
  studentNome?: string;
  student?: StudentPaxData;
  onUpdateStudent?: (updated: Partial<StudentPaxData>) => void;
  userRole?: 'professor' | 'familia';
}

export function parseTimeToMinutes(timeStr?: string): number {
  if (!timeStr) return 0;
  const match = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (!match) return 0;
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
}

export function sortActivitiesBySchedule(list: ParsedAuraActivity[]): ParsedAuraActivity[] {
  return [...list].sort((a, b) => {
    const timeA = parseTimeToMinutes(a.horario);
    const timeB = parseTimeToMinutes(b.horario);
    if (timeA !== timeB) return timeA - timeB;
    return (a.titulo || '').localeCompare(b.titulo || '');
  });
}

export function deduplicateActivities(list: ParsedAuraActivity[]): ParsedAuraActivity[] {
  const result: ParsedAuraActivity[] = [];
  const getNormalizedDay = (day: string): string => {
    const d = (day || '').toLowerCase();
    if (d.includes('seg')) return 'Segunda-feira';
    if (d.includes('ter')) return 'Terça-feira';
    if (d.includes('qua')) return 'Quarta-feira';
    if (d.includes('qui')) return 'Quinta-feira';
    if (d.includes('sex')) return 'Sexta-feira';
    return 'Quarta-feira';
  };

  for (const act of list) {
    const dayKey = getNormalizedDay(act.dia || 'Quarta-feira');
    const timeKey = (act.horario || '').trim();

    const existingIndex = result.findIndex(item => {
      const itemDay = getNormalizedDay(item.dia || 'Quarta-feira');
      return itemDay === dayKey && (item.horario || '').trim() === timeKey;
    });

    if (existingIndex !== -1) {
      const existingItem = result[existingIndex];
      if (existingItem.isRotinaPadrao && !act.isRotinaPadrao) {
        result[existingIndex] = act;
      } else if (!existingItem.isRotinaPadrao && act.isRotinaPadrao) {
        // Mantém
      } else if ((act.titulo || '').length > (existingItem.titulo || '').length) {
        result[existingIndex] = act;
      }
    } else {
      result.push({ ...act, dia: dayKey });
    }
  }
  return result;
}

export default function AuraPlannerIntegration({ 
  onConcluirAtividadePedagogica, 
  studentNome = 'Mariana Souza',
  student,
  onUpdateStudent,
  userRole = 'professor'
}: Props) {
  const storageKey = `anjinho_activities_state_${student?.id || 'main'}`;

  const validarCronometro = () => {
    if (student && onUpdateStudent && (!student.presenca?.isTimerRunning || student.presenca?.status !== 'em_aula')) {
      onUpdateStudent({
        presenca: {
          ...student.presenca,
          isTimerRunning: true,
          status: 'em_aula',
          startTimestamp: student.presenca?.startTimestamp || Date.now(),
        }
      });
    }
    return true;
  };

  const [inputText, setInputText] = useState('');
  const [activities, setActivities] = useState<ParsedAuraActivity[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return sortActivitiesBySchedule(parsed);
        }
      }
    } catch (e) {}
    return sortActivitiesBySchedule(deduplicateActivities(PLAN_ACTIVITIES || []));
  });
 
  const [selectedDayTab, setSelectedDayTab] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'todas' | 'pendentes' | 'entregues' | 'recusadas'>('todas');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<'direto' | 'importar'>('direto');

  const [activityNotes, setActivityNotes] = useState<Record<string, string>>({});
  const [activityScopes, setActivityScopes] = useState<Record<string, 'coletivo' | 'individual'>>({});

  // Sincroniza e grava no LocalStorage sempre que uma atividade for concluída
  const salvarEAtualizarAtividades = (novasAtividades: ParsedAuraActivity[]) => {
    setActivities(novasAtividades);
    try {
      localStorage.setItem(storageKey, JSON.stringify(novasAtividades));
    } catch (e) {}
  };

  useEffect(() => {
    const handleResetAllToPending = () => {
      const reset = activities.map((act) => ({
        ...act,
        status: 'pendente' as const,
        entregue: false,
        observacao: undefined,
      }));
      salvarEAtualizarAtividades(reset);
      setActivityNotes({});
      setStatusFilter('todas');
    };

    const handleRotinaRegistrada = (e: Event) => {
      const customEvent = e as CustomEvent<{ itemKey: string; status: string; observacao?: string }>;
      if (!customEvent.detail) return;
      const { itemKey, status, observacao } = customEvent.detail;
      
      const updated = activities.map((act) => {
        const isLancheManha = itemKey === 'lanche_manha' && act.titulo.toLowerCase().includes('lanche da manhã');
        const isAlmoco = itemKey === 'almoco' && act.titulo.toLowerCase().includes('almoço');
        const isLancheTarde = itemKey === 'lanche_tarde' && act.titulo.toLowerCase().includes('lanche da tarde');
        const isSono = itemKey === 'sono' && act.titulo.toLowerCase().includes('soneca');
        const isHigiene = itemKey === 'higiene' && act.titulo.toLowerCase().includes('higiene');
        
        if (act.item_key === itemKey || isLancheManha || isAlmoco || isLancheTarde || isSono || isHigiene) {
          return {
            ...act,
            status: status === 'Rejeitou' ? 'recusou' as const : 'entregue' as const,
            entregue: status !== 'Rejeitou',
            observacao: observacao || `Sincronizado da Rotina: ${status}`,
          };
        }
        return act;
      });
      salvarEAtualizarAtividades(updated);
    };

    window.addEventListener('anjinho:reset-activities-to-pending', handleResetAllToPending);
    window.addEventListener('anjinho:rotina-registrada', handleRotinaRegistrada);
    return () => {
      window.removeEventListener('anjinho:reset-activities-to-pending', handleResetAllToPending);
      window.removeEventListener('anjinho:rotina-registrada', handleRotinaRegistrada);
    };
  }, [activities]);

  const WEEKDAY_ORDER = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira'];
  const uniqueDaysMap = new Map<string, { dia: string; count: number }>();
  WEEKDAY_ORDER.forEach(dia => uniqueDaysMap.set(dia, { dia, count: 0 }));

  activities.forEach((act) => {
    let key = act.dia || 'Quarta-feira';
    if (/ter/i.test(key)) key = 'Terça-feira';
    if (/seg/i.test(key)) key = 'Segunda-feira';
    if (/qua/i.test(key)) key = 'Quarta-feira';
    if (/qui/i.test(key)) key = 'Quinta-feira';
    if (/sex/i.test(key)) key = 'Sexta-feira';

    const existing = uniqueDaysMap.get(key);
    if (existing) existing.count += 1;
    else uniqueDaysMap.set(key, { dia: key, count: 1 });
  });

  const daySummaries = Array.from(uniqueDaysMap.values());

  const getDynamicMedicationActivities = (): ParsedAuraActivity[] => {
    if (!student || !student.medicamentos) return [];
    const medActivities: ParsedAuraActivity[] = [];
    
    student.medicamentos.forEach((med) => {
      if (!med.ativo || med.suspenso) return;
      const times = med.horario.match(/\b\d{1,2}:\d{2}\b/g) || [med.horario];
      
      times.forEach((timeStr, timeIdx) => {
        const cleanTime = timeStr.trim();
        const targetDays = selectedDayTab === 'all' ? (daySummaries.length > 0 ? daySummaries.map(d => d.dia) : WEEKDAY_ORDER) : [selectedDayTab];
        const validDays = targetDays.filter((dayName) => {
          if (!med.diasSemana || med.diasSemana.length === 0 || med.diasSemana.includes('Todos')) return true;
          return med.diasSemana.some(d => dayName.toLowerCase().includes(d.toLowerCase().slice(0, 3)));
        });
          
        validDays.forEach((dayName) => {
          const isMinistrado = med.ministradoDias?.includes(dayName) || (dayName === 'Segunda-feira' && med.ministradoHoje);
          medActivities.push({
            id: `med-dyn-${med.id}-${cleanTime}-${dayName}-${timeIdx}`,
            dia: dayName,
            horario: cleanTime,
            titulo: `💊 Medicamento: ${med.nome}`,
            descricao: `Dosagem: ${med.dosagem}. Instruções: ${med.instrucoes}. (Prescrito pelos Pais)`,
            tipo: 'medicacao',
            status: isMinistrado ? 'entregue' : 'pendente',
            entregue: !!isMinistrado,
            isRotinaPadrao: false,
            objetivoBNCC: 'Saúde e bem-estar',
            observacao: isMinistrado ? (med.observacoesDias?.[dayName] || med.observacaoMinistracao || '') : '',
            escopo: 'individual',
            anexoReceitaUrl: med.anexoReceitaUrl,
            diasSemana: med.diasSemana
          });
        });
      });
    });
    return medActivities;
  };

  const allCombined = sortActivitiesBySchedule([...activities, ...getDynamicMedicationActivities()]);
  const pendingCount = allCombined.filter((a) => a.status === 'pendente' || (!a.status && !a.entregue)).length;
  const entregueCount = allCombined.filter((a) => a.status === 'entregue' || a.entregue).length;
  const recusouCount = allCombined.filter((a) => a.status === 'recusou').length;

  const filteredActivities = allCombined.filter((act) => {
    if (selectedDayTab !== 'all' && act.dia !== selectedDayTab) return false;
    if (statusFilter === 'pendentes') return act.status === 'pendente' || (!act.status && !act.entregue);
    if (statusFilter === 'entregues') return act.status === 'entregue' || act.entregue;
    if (statusFilter === 'recusadas') return act.status === 'recusou';
    return true;
  });

  const handleExtract = () => {
    if (!inputText.trim()) return;
    setIsProcessing(true);
    setTimeout(() => {
      const parsed = parseAuraRawPlan(inputText);
      if (parsed.activities && parsed.activities.length > 0) {
        const pending = parsed.activities.map((act) => ({
          ...act,
          status: 'pendente' as const,
          entregue: false,
        }));
        salvarEAtualizarAtividades(sortActivitiesBySchedule(deduplicateActivities([...activities, ...pending])));
      }
      setSelectedDayTab('all');
      setShowForm(false);
      setIsProcessing(false);
    }, 400);
  };

  // Concluir Atividade (100% responsivo para Mobile e Desktop)
  const handleMarkEntregue = (act: ParsedAuraActivity, idx: number) => {
    const actId = act.id || `act-${idx}`;
    const note = activityNotes[actId] || '';
    const scope = activityScopes[actId] || 'coletivo';
    
    if (actId.startsWith('med-dyn-') && student && student.medicamentos && onUpdateStudent) {
      const parts = actId.split('-');
      const medId = parts[2];
      const targetDay = act.dia || selectedDayTab;
      
      const updatedMeds = student.medicamentos.map((m) => {
        if (m.id === medId) {
          const currentDays = m.ministradoDias || [];
          return {
            ...m,
            ministradoHoje: true,
            ministradoDias: currentDays.includes(targetDay) ? currentDays : [...currentDays, targetDay],
            ministradoPor: 'Professora Titular',
            ministradoHorario: act.horario,
            observacaoMinistracao: note || 'Dose administrada no horário estipulado.'
          };
        }
        return m;
      });
      onUpdateStudent({ medicamentos: updatedMeds });
      return;
    }

    const novasAtividades = activities.map((a, i) => {
      if ((a.id || `act-${i}`) === actId) {
        return { ...a, status: 'entregue' as const, entregue: true, observacao: note };
      }
      return a;
    });

    salvarEAtualizarAtividades(novasAtividades);

    if (student && onUpdateStudent) {
      const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const newTimelineItem = {
        id: `audit_act_${Date.now()}`,
        hora: act.horario || horaAtual,
        tipo: 'pedagogico' as const,
        titulo: `${act.titulo} (${scope === 'coletivo' ? 'Coletiva' : 'Individual'})`,
        descricao: `${student.nome}: ${act.descricao}${note ? ` [Obs: ${note}]` : ''}`,
        responsavel: student.professoraTitular || 'Professora Titular',
        verificado: true
      };
      onUpdateStudent({
        auditoriaLinhaDoTempo: [newTimelineItem, ...(student.auditoriaLinhaDoTempo || [])]
      });
    }

    if (onConcluirAtividadePedagogica) {
      onConcluirAtividadePedagogica({
        ...act,
        entregue: true,
        status: 'entregue',
        escopo: scope,
        isColetivo: scope === 'coletivo',
        descricao: note ? `${act.descricao}\n\n💬 Obs: ${note}` : act.descricao
      });
    }
  };

  // Recusar Atividade
  const handleMarkRecusou = (act: ParsedAuraActivity, idx: number) => {
    const actId = act.id || `act-${idx}`;
    const note = activityNotes[actId] || 'Recusou participar da atividade';
    const scope = activityScopes[actId] || 'coletivo';

    const novasAtividades = activities.map((a, i) => {
      if ((a.id || `act-${i}`) === actId) {
        return { ...a, status: 'recusou' as const, entregue: false, observacao: note };
      }
      return a;
    });

    salvarEAtualizarAtividades(novasAtividades);

    if (onConcluirAtividadePedagogica) {
      onConcluirAtividadePedagogica({
        ...act,
        entregue: false,
        status: 'recusou',
        escopo: scope,
        isColetivo: scope === 'coletivo',
        descricao: `${act.descricao}\n\n⚠️ Recusou participar. Obs: ${note}`
      });
    }
  };

  const getCategoryIcon = (tipo: string) => {
    switch (tipo) {
      case 'alimentacao': return <Utensils size={18} className="text-amber-600" />;
      case 'sono': return <Moon size={18} className="text-indigo-600" />;
      case 'banho': return <Droplets size={18} className="text-sky-600" />;
      case 'medicacao': return <Pill size={18} className="text-indigo-600 animate-pulse" />;
      default: return <BookOpen size={18} className="text-emerald-600" />;
    }
  };

  return (
    <section id="agenda-atividades-section" className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-sm space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Clock size={22} className="text-sky-600" />
            <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              Agenda de Atividades da Aula
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            <strong className="text-slate-800">{activities.length} atividade(s)</strong> no cronograma ordenadas por horário (07:30 às 16:30)
          </p>
        </div>

        {userRole === 'familia' ? (
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-3.5 py-2 rounded-2xl">
            <Heart size={15} className="text-emerald-600" />
            <span className="text-xs font-bold">Acompanhamento Familiar em Tempo Real</span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const reset = activities.map(a => ({ ...a, status: 'pendente' as const, entregue: false }));
                salvarEAtualizarAtividades(reset);
              }}
              className="px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition cursor-pointer flex items-center gap-1.5 touch-manipulation"
            >
              <RefreshCw size={14} />
              <span>Restaurar Padrão</span>
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(true); setFormMode('importar'); }}
              className="px-4 py-2 text-xs font-black text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5 touch-manipulation"
            >
              <Sparkles size={15} className="text-amber-300" />
              <span>Importar Aura</span>
            </button>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3 sm:p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <span className="text-xs font-black text-slate-700 flex items-center gap-1.5 uppercase">
            <Filter size={14} className="text-indigo-600" />
            <span>Exibir Status:</span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setStatusFilter('todas')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer touch-manipulation ${
                statusFilter === 'todas' ? 'bg-slate-800 text-white font-black' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              Todas ({allCombined.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pendentes')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 touch-manipulation ${
                statusFilter === 'pendentes' ? 'bg-amber-500 text-amber-950 ring-2 ring-amber-300' : 'bg-amber-50 text-amber-900 border border-amber-200'
              }`}
            >
              <Clock size={13} />
              <span>Pendentes ({pendingCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('entregues')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 touch-manipulation ${
                statusFilter === 'entregues' ? 'bg-emerald-600 text-white font-black' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}
            >
              <CheckCircle2 size={13} />
              <span>Entregues ({entregueCount})</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
            <Calendar size={13} className="text-blue-600" />
            <span>Dias:</span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedDayTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer touch-manipulation ${
                selectedDayTab === 'all' ? 'bg-blue-600 text-white font-black' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              Todos os Dias
            </button>
            {daySummaries.map((ds) => (
              <button
                key={ds.dia}
                type="button"
                onClick={() => setSelectedDayTab(ds.dia)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer touch-manipulation ${
                  selectedDayTab === ds.dia ? 'bg-blue-600 text-white font-black' : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                {ds.dia}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid de Cards de Atividades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredActivities.map((act, idx) => {
          const actId = act.id || `act-${idx}`;
          const currentNote = activityNotes[actId] || act.observacao || '';
          const isEntregue = act.status === 'entregue' || act.entregue;
          const isRecusou = act.status === 'recusou';

          return (
            <div
              key={actId}
              className={`bg-white rounded-3xl border p-5 sm:p-6 transition-all duration-200 shadow-2xs flex flex-col justify-between space-y-4 ${
                isEntregue
                  ? 'border-emerald-300/80 bg-emerald-50/20'
                  : isRecusou
                  ? 'border-rose-300/80 bg-rose-50/20'
                  : act.tipo === 'medicacao'
                  ? 'border-indigo-300 bg-indigo-50/15'
                  : 'border-amber-300/80 bg-amber-50/15'
              }`}
            >
              {/* Topo do Card */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border bg-slate-100 text-slate-700 border-slate-200">
                    {getCategoryIcon(act.tipo)}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-slate-100 text-slate-800 font-mono font-black text-xs px-2.5 py-1 rounded-lg border border-slate-200">
                      {act.horario}
                    </span>
                    {isEntregue ? (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-md flex items-center gap-1 border border-emerald-300">
                        <CheckCircle2 size={11} />
                        <span>{act.tipo === 'medicacao' ? 'Ministrado' : 'Entregue'}</span>
                      </span>
                    ) : isRecusou ? (
                      <span className="bg-rose-100 text-rose-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-md flex items-center gap-1 border border-rose-300">
                        <XCircle size={11} />
                        <span>Recusou</span>
                      </span>
                    ) : (
                      <span className="bg-amber-100 text-amber-900 text-[10px] font-black uppercase px-2 py-0.5 rounded-md border border-amber-300 flex items-center gap-1">
                        <Clock size={10} className="text-amber-700" />
                        <span>Pendente</span>
                      </span>
                    )}
                  </div>
                </div>

                {act.dia && (
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                    {act.dia}
                  </span>
                )}
              </div>

              {/* Título e Descrição */}
              <div className="space-y-1 flex-1">
                <h4 className="text-base font-black text-slate-900 leading-snug">
                  {act.titulo}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {act.descricao}
                </p>
              </div>

              {/* Visão Familiar vs Professora */}
              {userRole === 'familia' ? (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500 font-medium">
                    {isEntregue ? 'Atividade vivenciada na escola' : 'Prevista no plano de aula'}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    isEntregue ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {isEntregue ? '✓ Vivenciada com a Turma' : 'Prevista no Plano de Aula'}
                  </span>
                </div>
              ) : (
                <>
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <input
                      type="text"
                      value={currentNote}
                      onChange={(e) => setActivityNotes({ ...activityNotes, [actId]: e.target.value })}
                      placeholder="Observação rápida da atividade..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>

                  {/* Botões de Ação com Toque Imediato */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 mt-1">
                    <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setActivityScopes((prev) => ({ ...prev, [actId]: 'coletivo' }))}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-black transition cursor-pointer touch-manipulation ${
                          (activityScopes[actId] || 'coletivo') === 'coletivo' ? 'bg-indigo-600 text-white' : 'text-slate-600'
                        }`}
                      >
                        👥 Coletivo
                      </button>
                      <button
                        type="button"
                        onClick={() => setActivityScopes((prev) => ({ ...prev, [actId]: 'individual' }))}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-black transition cursor-pointer touch-manipulation ${
                          activityScopes[actId] === 'individual' ? 'bg-emerald-600 text-white' : 'text-slate-600'
                        }`}
                      >
                        👤 Individual
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          validarCronometro();
                          handleMarkRecusou(act, idx);
                        }}
                        className={`px-3 py-2 text-xs font-black rounded-xl transition cursor-pointer touch-manipulation active:scale-95 ${
                          isRecusou ? 'bg-rose-600 text-white' : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300'
                        }`}
                      >
                        {isRecusou ? '✕ Recusado' : 'Recusou'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          validarCronometro();
                          handleMarkEntregue(act, idx);
                        }}
                        className={`px-4 py-2 text-xs font-black rounded-xl transition cursor-pointer shadow-md active:scale-95 flex items-center gap-1.5 border touch-manipulation ${
                          isEntregue
                            ? 'bg-emerald-600 border-emerald-700 text-white ring-2 ring-emerald-300'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500'
                        }`}
                      >
                        <Check size={15} className="stroke-[3]" />
                        <span>{isEntregue ? 'Concluído' : 'Concluir'}</span>
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-black/25 text-emerald-100 uppercase">
                          {(activityScopes[actId] || 'coletivo') === 'coletivo' ? 'Turma' : 'Indiv.'}
                        </span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
