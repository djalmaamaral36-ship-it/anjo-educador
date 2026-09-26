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
  onChangeUserRole?: (role: 'professor' | 'familia') => void;
  activeMode: 'aula' | 'pax';
  onChangeMode: (mode: 'aula' | 'pax') => void;
  currentStudentId: string;
  onSelectStudentId: (id: string) => void;
  onOpenFullMedicationsTab?: () => void;
  simulatedProfile?: any;
}

export default function PaxPortalDeTranquilidade({
  userRole,
  onChangeUserRole,
  activeMode,
  onChangeMode,
  currentStudentId,
  onSelectStudentId,
  onOpenFullMedicationsTab,
  simulatedProfile
}: Props) {
  const [students, setStudents] = useState<Record<string, StudentPaxData>>(PAX_STUDENTS);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToStudents((firestoreStudents) => {
      if (firestoreStudents && Object.keys(firestoreStudents).length > 0) {
        setStudents(firestoreStudents);
      }
    });
    return () => unsubscribe();
  }, []);

  const currentStudent =
    students[currentStudentId] ||
    students['mariana_souza'] ||
    PAX_STUDENTS[currentStudentId] ||
    PAX_STUDENTS['mariana_souza'] ||
    Object.values(PAX_STUDENTS)[0];

  const handleUpdateStudent = (updatedFields: Partial<StudentPaxData>) => {
    if (!currentStudent) return;
    const updatedStudent: StudentPaxData = {
      ...currentStudent,
      ...updatedFields,
    };
    setStudents((prev) => ({
      ...prev,
      [currentStudent.id]: updatedStudent,
    }));
    syncStudentToFirestore(updatedStudent);
  };

  const handleUpdateAllStudents = (updater: (st: StudentPaxData) => StudentPaxData) => {
    const updatedMap: Record<string, StudentPaxData> = {};
    const updatedList: StudentPaxData[] = [];

    Object.values(students).forEach((st) => {
      const updated = updater(st);
      updatedMap[st.id] = updated;
      updatedList.push(updated);
    });

    setStudents(updatedMap);
    syncAllStudentsToFirestore(updatedList);
  };

  const handleConcluirAtividadePedagogica = (
    titulo: string,
    tipo: string,
    escopo: 'coletiva' | 'individual'
  ) => {
    const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    if (escopo === 'coletiva') {
      handleUpdateAllStudents((st) => {
        const itemColetivo = {
          id: `audit_ped_${st.id}_${Date.now()}`,
          hora: horaAtual,
          tipo: 'pedagogico' as const,
          titulo: `${titulo} (Coletiva)`,
          descricao: `${st.nome}: Participou da atividade coletiva da turma: ${titulo}.`,
          responsavel: st.professoraTitular || 'Ana Silva (Professora Titular)',
          verificado: true,
        };
        const currentList = st.auditoriaLinhaDoTempo || [];
        return {
          ...st,
          auditoriaLinhaDoTempo: [itemColetivo, ...currentList],
        };
      });
    } else {
      const itemIndividual = {
        id: `audit_ped_${Date.now()}`,
        hora: horaAtual,
        tipo: 'pedagogico' as const,
        titulo: `${titulo}`,
        descricao: `${currentStudent.nome}: Participou da vivência pedagógica individual: ${titulo}.`,
        responsavel: currentStudent.professoraTitular || 'Ana Silva (Professora Titular)',
        verificado: true,
      };
      const currentList = currentStudent.auditoriaLinhaDoTempo || [];
      handleUpdateStudent({
        auditoriaLinhaDoTempo: [itemIndividual, ...currentList],
      });
    }
  };

  const effectiveRole = simulatedProfile?.role || userRole;

  return (
    <div className="space-y-6">
      {/* 1. Header de Identificação e Troca de Aluno */}
      <PaxHeaderContext
        userRole={effectiveRole}
        activeMode={activeMode}
        currentStudent={currentStudent}
        onOpenStudentModal={() => setIsStudentModalOpen(true)}
      />

      {/* 2. Card Principal com Foto, Idade e Presença do Aluno */}
      <PaxStudentCard
        student={currentStudent}
        userRole={effectiveRole}
        onOpenStudentModal={() => setIsStudentModalOpen(true)}
      />

      {/* 3. Governança e Presença */}
      <PaxPresencaGovernanca
        student={currentStudent}
        userRole={effectiveRole}
        onUpdateStudent={handleUpdateStudent}
      />

      {/* 4. Painel de Rotina com Cronômetros em Tempo Real (Sono, Alimentação, Trocas) */}
      <PainelRotinaUnificado
        student={currentStudent}
        userRole={effectiveRole}
        onUpdateStudent={handleUpdateStudent}
        allStudents={Object.values(students)}
        onUpdateAllStudents={handleUpdateAllStudents}
      />

      {/* 5. Painel de Nutrição, Água e Humor */}
      <PaxPainelNutricaoAguaHumor student={currentStudent} />

      {/* 6. Saúde e Cartões Horizontais */}
      <PaxSaudeHorizontalCards student={currentStudent} />

      {/* 7. Medicações */}
      <PaxMedicacoes
        student={currentStudent}
        userRole={effectiveRole}
        onUpdateStudent={handleUpdateStudent}
        onOpenFullMedicationsTab={onOpenFullMedicationsTab}
      />

      {/* 8. Agenda Pedagógica / Aura Planner */}
      <AuraPlannerIntegration
        student={currentStudent}
        onUpdateStudent={handleUpdateStudent}
        onConcluirAtividadePedagogica={handleConcluirAtividadePedagogica}
        studentNome={currentStudent?.nome || 'Mariana Souza'}
        userRole={effectiveRole}
      />

      {/* 9. Linha do Tempo e Auditoria */}
      <PaxLinhaDoTempoAuditoria
        student={currentStudent}
        userRole={effectiveRole}
        onDeleteItem={(itemId) => {
          const currentList = currentStudent.auditoriaLinhaDoTempo || [];
          const updatedTimeline = currentList.filter((item) => item.id !== itemId);
          handleUpdateStudent({ auditoriaLinhaDoTempo: updatedTimeline });
        }}
      />

      {/* 10. Mural de Recados do Aluno */}
      <SecaoDiariosRecebidosEMural
        student={currentStudent}
        userRole={effectiveRole}
      />

      {/* Modal de Seleção de Aluno */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-indigo-600" />
                <h3 className="text-base font-black text-slate-800">
                  Troca Rápida de Aluno — Berçário I - A
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsStudentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Selecione o aluno para carregar a rotina:
            </p>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {Object.values(students).map((st) => {
                const isSelected = st.id === currentStudentId;
                return (
                  <div
                    key={st.id}
                    onClick={() => {
                      onSelectStudentId(st.id);
                      setIsStudentModalOpen(false);
                    }}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full overflow-hidden bg-amber-100 border border-slate-200 flex-shrink-0">
                        <img src={st.fotoUrl} alt={st.nome} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-slate-800">{st.nome}</h4>
                        <p className="text-[11px] text-slate-500">
                          {st.nascimento} ({st.idadeStr}) • {st.responsavelParentesco}: {st.responsavelNome}
                        </p>
                      </div>
                    </div>
                    {isSelected ? (
                      <span className="text-xs font-black text-indigo-700 bg-white px-2.5 py-1 rounded-lg shadow-2xs border border-indigo-200">
                        Ativo
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-slate-400">
                        Selecionar &gt;
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setIsStudentModalOpen(false)}
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
