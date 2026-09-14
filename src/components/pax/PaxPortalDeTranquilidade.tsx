import React, { useState, useEffect } from 'react';
import PaxHeaderContext from './PaxHeaderContext';
import PaxModeSwitcher from './PaxModeSwitcher';
import PaxStudentCard from './PaxStudentCard';
import PaxPresencaGovernanca from './PaxPresencaGovernanca';
import PainelRotinaUnificado from '../rotina/PainelRotinaUnificado';
import PaxMedicacoes from './PaxMedicacoes';
import PaxPainelNutricaoAguaHumor from './PaxPainelNutricaoAguaHumor';
import PaxSaudeHorizontalCards from './PaxSaudeHorizontalCards';
import PaxLinhaDoTempoAuditoria from './PaxLinhaDoTempoAuditoria';
import SecaoDiariosRecebidosEMural from '../familias/SecaoDiariosRecebidosEMural';
import AuraPlannerIntegration from '../rotina/AuraPlannerIntegration';
import { PAX_STUDENTS } from '../../data/paxStudentsData';
import { StudentPaxData } from '../../types';
import { Users } from 'lucide-react';
import { 
  subscribeToStudents, 
  syncStudentToFirestore, 
  syncAllStudentsToFirestore 
} from '../../services/firebaseSyncService';

interface Props {
  userRole: 'professor' | 'familia';
  onChangeUserRole: (role: 'professor' | 'familia') => void;
  activeMode: 'aula' | 'pax';
  onChangeMode: (mode: 'aula' | 'pax') => void;
  currentStudentId?: string;
  onSelectStudentId?: (id: string) => void;
  onOpenFullMedicationsTab?: () => void;
  simulatedProfile?: any;
}

export default function PaxPortalDeTranquilidade({
  userRole,
  onChangeUserRole,
  activeMode,
  onChangeMode,
  currentStudentId = 'mariana_souza',
  onSelectStudentId,
  onOpenFullMedicationsTab,
  simulatedProfile,
}: Props) {
  const [studentsMap, setStudentsMap] = useState<Record<string, StudentPaxData>>(PAX_STUDENTS);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(currentStudentId);
  const [selectedRoom, setSelectedRoom] = useState<string>('bercario_1a');
  const [showClassListModal, setShowClassListModal] = useState<boolean>(false);

  // Escuta em tempo real todas as alterações do Firestore (notebook <-> celular em tempo real)
  useEffect(() => {
    const unsubscribe = subscribeToStudents((firestoreMap) => {
      setStudentsMap(firestoreMap);
    });
    return () => unsubscribe();
  }, []);

  const isPaxMode = activeMode === 'pax' || userRole === 'familia';
  const effectiveRole: 'professor' | 'familia' = isPaxMode ? 'familia' : 'professor';

  // Filtro de Alunos por Turma e Autorização de Acesso Docente
  // Professores só têm acesso aos alunos vinculados à classe da qual são responsáveis
  const activeTurmaName = selectedRoom === 'maternal_1a' ? 'Maternal I - A' : 'Berçário I - A';
  const activeProfessora = selectedRoom === 'maternal_1a' ? 'Cláudia Mendes (Professora Titular)' : 'Ana Silva (Professora Titular)';

  const classStudents = Object.values(studentsMap).filter((st) => {
    if (selectedRoom === 'maternal_1a') {
      return st.turma?.includes('Maternal');
    }
    return st.turma?.includes('Berçário') || !st.turma?.includes('Maternal');
  });

  const visibleStudents = effectiveRole === 'professor' ? classStudents : [studentsMap[selectedStudentId] || studentsMap['mariana_souza'] || Object.values(studentsMap)[0]];

  // Garante que o aluno selecionado pertença à turma ativa da professora
  useEffect(() => {
    if (effectiveRole === 'professor') {
      const isCurrentInClass = classStudents.some((st) => st.id === selectedStudentId);
      if (!isCurrentInClass && classStudents.length > 0) {
        setSelectedStudentId(classStudents[0].id);
      }
    }
  }, [selectedRoom, effectiveRole, selectedStudentId]);

  useEffect(() => {
    if (currentStudentId && currentStudentId !== selectedStudentId) {
      setSelectedStudentId(currentStudentId);
    }
  }, [currentStudentId]);

  const currentStudent = studentsMap[selectedStudentId] || classStudents[0] || studentsMap['mariana_souza'] || studentsMap['enzo_alencar'];

  const handleSelectStudent = (id: string) => {
    setSelectedStudentId(id);
    if (onSelectStudentId) {
      onSelectStudentId(id);
    }
  };

  const handleUpdateStudent = (updated: Partial<StudentPaxData>) => {
    setStudentsMap((prev) => {
      const existing = prev[selectedStudentId];
      if (!existing) return prev;
      const nextStudent = {
        ...existing,
        ...updated,
      };
      // Sincroniza em tempo real com o Firestore para atualizar instantaneamente no celular / notebook
      syncStudentToFirestore(selectedStudentId, nextStudent);
      return {
        ...prev,
        [selectedStudentId]: nextStudent,
      };
    });
  };

  const handleUpdateAllStudents = (updater: (st: StudentPaxData) => StudentPaxData) => {
    setStudentsMap((prev) => {
      const nextMap: Record<string, StudentPaxData> = {};
      Object.keys(prev).forEach((id) => {
        nextMap[id] = updater(prev[id]);
      });
      // Sincroniza em tempo real com o Firestore para todos os alunos
      syncAllStudentsToFirestore(updater, prev);
      return nextMap;
    });
  };

  const handleConcluirAtividadePedagogica = (act: any) => {
    const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    let descFinal = act.descricao || 'Atividade realizada em sala de aula.';
    if (act.objetivoBNCC && !descFinal.includes(act.objetivoBNCC)) {
      descFinal += `\n\n📌 Objetivo BNCC / Campo de Experiência: ${act.objetivoBNCC}`;
    }
    if (act.materiais && act.materiais.length > 0 && !descFinal.includes('Materiais')) {
      descFinal += `\n🎨 Materiais Necessários: ${act.materiais.join(', ')}`;
    }

    const isMeal = /lanche|almoço|almocinho|janta|mamadeira|refeição/i.test(act.titulo);
    const tipoItem = isMeal ? 'alimentacao' : 'pedagogico';
    const tituloItem = isMeal ? `Alimentação & Nutrição: ${act.titulo}` : `Atividade Pedagógica: ${act.titulo}`;

    const novaLinhaTempoItem = {
      id: `audit_${isMeal ? 'alim' : 'pedag'}_${Date.now()}`,
      hora: act.horario || horaAtual,
      tipo: tipoItem as any,
      titulo: tituloItem,
      descricao: descFinal,
      responsavel: currentStudent.professoraTitular || 'Ana Silva (Professora Titular)',
      verificado: true,
    };

    // Remove any existing timeline entry for this same activity/meal name to prevent duplicates
    const existingList = currentStudent.auditoriaLinhaDoTempo || [];
    const filteredList = existingList.filter(item => 
      !item.titulo.toLowerCase().includes(act.titulo.toLowerCase()) &&
      !act.titulo.toLowerCase().includes(item.titulo.replace(/Atividade Pedagógica: |Alimentação & Nutrição: /g, '').toLowerCase())
    );

    const updatedTimeline = [novaLinhaTempoItem, ...filteredList];

    // If it's a meal, also update alimentacao.refeicoes
    let updatedAlimentacao = currentStudent.alimentacao;
    if (isMeal && updatedAlimentacao?.refeicoes) {
      const updatedRefeicoes = updatedAlimentacao.refeicoes.map(ref => {
        if (ref.nome.toLowerCase().includes(act.titulo.toLowerCase()) || act.titulo.toLowerCase().includes(ref.nome.toLowerCase())) {
          return { ...ref, status: act.status === 'recusou' ? 'Recusou' : 'Comeu Tudo', horario: act.horario || horaAtual };
        }
        return ref;
      });
      updatedAlimentacao = { ...updatedAlimentacao, refeicoes: updatedRefeicoes };
    }

    const isColetivo = act.escopo === 'coletivo' || act.isColetivo;

    if (isColetivo) {
      handleUpdateAllStudents((st) => {
        const studentExistingList = st.auditoriaLinhaDoTempo || [];
        const studentFilteredList = studentExistingList.filter(item => 
          !item.titulo.toLowerCase().includes(act.titulo.toLowerCase()) &&
          !act.titulo.toLowerCase().includes(item.titulo.replace(/Atividade Pedagógica: |Alimentação & Nutrição: /g, '').toLowerCase())
        );

        const studentNovaLinhaTempo = {
          ...novaLinhaTempoItem,
          id: `audit_${isMeal ? 'alim' : 'pedag'}_${st.id}_${Date.now()}`,
          responsavel: st.professoraTitular || 'Ana Silva (Professora Titular)',
        };

        const studentUpdatedTimeline = [studentNovaLinhaTempo, ...studentFilteredList];

        let studentAlim = st.alimentacao;
        if (isMeal && studentAlim?.refeicoes) {
          const updatedRef = studentAlim.refeicoes.map(ref => {
            if (ref.nome.toLowerCase().includes(act.titulo.toLowerCase()) || act.titulo.toLowerCase().includes(ref.nome.toLowerCase())) {
              return { ...ref, status: act.status === 'recusou' ? 'Recusou' : 'Comeu Tudo', horario: act.horario || horaAtual };
            }
            return ref;
          });
          studentAlim = { ...studentAlim, refeicoes: updatedRef };
        }

        return {
          ...st,
          alimentacao: studentAlim,
          auditoriaLinhaDoTempo: studentUpdatedTimeline,
        };
      });
    } else {
      handleUpdateStudent({
        alimentacao: updatedAlimentacao,
        auditoriaLinhaDoTempo: updatedTimeline,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Contexto Escolar do Topo (Instituição, Busca Rápida, Central de Salas, Banner Maternal) */}
      <PaxHeaderContext
        selectedStudentId={selectedStudentId}
        onSelectStudent={handleSelectStudent}
        selectedRoom={selectedRoom}
        onSelectRoom={setSelectedRoom}
        userRole={effectiveRole}
      />

      {/* 2. O Switcher Principal de Modo (AULA vs PAX) com Perfis e Conexão Nuvem */}
      <PaxModeSwitcher
        activeMode={activeMode}
        onChangeMode={onChangeMode}
        userRole={userRole}
        onChangeUserRole={onChangeUserRole}
        selectedStudentName={currentStudent.nome}
        onOpenStudentModal={() => setShowClassListModal(true)}
        selectedStudentResponsibleName={currentStudent.responsavelNome}
        selectedStudentResponsibleRelation={currentStudent.responsavelParentesco}
        simulatedProfile={simulatedProfile}
      />

      {/* Banner Informativo do Modo Atual */}
      {isPaxMode ? (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-3xl p-5 sm:p-6 shadow-sm border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-2xl flex-shrink-0 shadow-inner">
              🕊️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-950/40 text-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-400/20">
                  PORTAL DE TRANQUILIDADE (PAX)
                </span>
                <span className="text-[10px] font-bold text-emerald-100 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
                  Transmissão Oficial
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white tracking-tight mt-0.5">
                Acompanhamento em Tempo Real das Atividades Diárias
              </h3>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Espaço dedicado aos pais e responsáveis para leitura transparente dos cuidados, tempo em aula, nutrição e bem-estar de <strong>{currentStudent.nome}</strong>.
              </p>
            </div>
          </div>
          <div className="self-end sm:self-center bg-white/10 backdrop-blur-xs border border-white/20 px-3.5 py-2 rounded-2xl text-right">
            <span className="text-[9px] font-black uppercase tracking-wider text-emerald-200 block">MODO ATIVO</span>
            <span className="text-xs font-black text-white">Leitura & Acompanhamento</span>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-sm border border-indigo-600/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-2xl flex-shrink-0 shadow-inner">
              👩‍🏫
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-950/60 text-indigo-200 px-2.5 py-0.5 rounded-full border border-indigo-400/20">
                  PAINEL DA PROFESSORA (AULA)
                </span>
                <span className="text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                  ● Gestão de Rotina & Cronômetro
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white tracking-tight mt-0.5">
                Lançamento Rápido da Rotina de Sala
              </h3>
              <p className="text-xs text-indigo-100/90 mt-0.5">
                Controle do cronômetro coletivo da turma, dosagens de água/mamadeira, sonecas e intercorrências de <strong>{currentStudent.nome}</strong>.
              </p>
            </div>
          </div>
          <div className="self-end sm:self-center bg-white/10 backdrop-blur-xs border border-white/20 px-3.5 py-2 rounded-2xl text-right">
            <span className="text-[9px] font-black uppercase tracking-wider text-indigo-200 block">MODO ATIVO</span>
            <span className="text-xs font-black text-white">Registro & Gestão Docente</span>
          </div>
        </div>
      )}

      {/* 3. Ficha do Aluno Selecionado com Foto, Dados e Troca Rápida de Alunos */}
      <PaxStudentCard
        student={currentStudent}
        userRole={effectiveRole}
        onOpenClassList={() => setShowClassListModal(true)}
        onSelectStudent={handleSelectStudent}
        allStudents={classStudents}
      />

      {/* 4. Gráfico das Métricas de Governança & Segurança da Rotina Hoje (Circular Donut Charts para os Pais e Escola) */}
      <PaxPresencaGovernanca
        student={currentStudent}
        userRole={effectiveRole}
        onUpdateStudent={handleUpdateStudent}
      />

      {/* 5. Painel Integrado e Unificado de Rotina & Cronômetro Compartilhado (Professor Edita / Família Acompanha) */}
      <PainelRotinaUnificado
        student={currentStudent}
        userRole={effectiveRole}
        onUpdateStudent={handleUpdateStudent}
        allStudents={classStudents}
        onUpdateAllStudents={handleUpdateAllStudents}
      />

      {/* 5. Medicações & Autorizações do Aluno (Apenas na visão da Família / Pais, professores apenas ministram se houver prescrição) */}
      {effectiveRole === 'familia' && (
        <PaxMedicacoes
          student={currentStudent}
          userRole={effectiveRole}
          onOpenFullMedicationsTab={onOpenFullMedicationsTab}
        />
      )}

      {/* 6. Os 3 Blocos de Cuidado: Consumo de Água (Jarrinha Animada), Nutrição & Humor */}
      <PaxPainelNutricaoAguaHumor student={currentStudent} />

      {/* 7. Os 7 Cards Horizontais de Saúde, Sono & Fralda */}
      <PaxSaudeHorizontalCards student={currentStudent} />

      {/* 8. Planejamento Aura & Atividades Pedagógicas da Aula (Apenas na visão da Professora / Educadora) */}
      {effectiveRole === 'professor' && (
        <AuraPlannerIntegration
          onConcluirAtividadePedagogica={handleConcluirAtividadePedagogica}
          studentNome={currentStudent.nome}
        />
      )}

      {/* 9. Linha do Tempo e Auditoria de Saúde (Apenas na visão da Família / Pais) */}
      {effectiveRole === 'familia' && (
        <PaxLinhaDoTempoAuditoria student={currentStudent} />
      )}

      {/* 10. Diários de Rotina Recebidos & Mural de Avisos em Tempo Real */}
      <SecaoDiariosRecebidosEMural
        currentStudentName={currentStudent.nome}
        userRole={effectiveRole}
      />

      {/* Modal de Lista de Alunos da Turma */}
      {showClassListModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-indigo-600" />
                <h3 className="text-base font-black text-slate-800">
                  Alunos da Classe — {activeTurmaName} ({classStudents.length} Crianças)
                </h3>
              </div>
              <button
                onClick={() => setShowClassListModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Professora Responsável: <strong>{activeProfessora}</strong>. Selecione o aluno da turma para gerenciar a rotina:
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {classStudents.map((st) => {
                const isSelected = st.id === selectedStudentId;
                return (
                  <div
                    key={st.id}
                    onClick={() => {
                      handleSelectStudent(st.id);
                      setShowClassListModal(false);
                    }}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-amber-100 border border-slate-200 flex-shrink-0">
                        <img src={st.fotoUrl} alt={st.nome} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="font-black text-xs sm:text-sm text-slate-800">{st.nome}</h4>
                        <p className="text-[11px] text-slate-500">
                          {st.nascimento} • {st.responsavelParentesco}: {st.responsavelNome}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="text-xs font-black text-indigo-700 bg-white px-2 py-1 rounded-lg shadow-2xs">
                        Em Exibição
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setShowClassListModal(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-black rounded-xl transition cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
