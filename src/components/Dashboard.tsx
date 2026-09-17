import React, { useState, useEffect } from 'react';
import BannerHeader from './BannerHeader';
import JornadaDoAnjinho from './JornadaDoAnjinho';
import PaxPortalDeTranquilidade from './pax/PaxPortalDeTranquilidade';
import PaxModeSwitcher from './pax/PaxModeSwitcher';
import AgendaEscolar from './agenda/AgendaEscolar';
import TurmaAlunosModule from './turma/TurmaAlunosModule';
import VinculoFamiliarModule from './familias/VinculoFamiliarModule';
import PainelRotinaUnificado from './rotina/PainelRotinaUnificado';
import ControleMedicamentosModule from './medicamentos/ControleMedicamentosModule';
import MuralAvisosERecadosModule from './mural/MuralAvisosERecadosModule';
import ModuloAuditoriaLgpd from './lgpd/ModuloAuditoriaLgpd';
import ModalConsentimentoLgpdInicial from './lgpd/ModalConsentimentoLgpdInicial';
import CoordenacaoModule from './coordenacao/CoordenacaoModule';
import DirecaoModule from './direcao/DirecaoModule';
import CentralJuridicaESuporteModule from './direcao/CentralJuridicaESuporteModule';
import BrandBookModule from './brandbook/BrandBookModule';
import FloatingRoleSwitcher from './comum/FloatingRoleSwitcher';
import TelaAtalhoSimuladorModal, { AtalhoPerfil } from './comum/TelaAtalhoSimuladorModal';
import { PAX_STUDENTS, StudentPaxData } from '../data/paxStudentsData';
import { getLgpdConsentimentoAluno } from '../services/lgpdService';
import { auth, signOut } from '../services/firebase';
import { subscribeToStudents, syncStudentToFirestore } from '../services/firebaseSyncService';
import { Calendar, Users, BookOpen, HeartHandshake, ShieldCheck } from 'lucide-react';

interface Props {
  user: any;
}

export default function Dashboard({ user }: Props) {
  const [activeTab, setActiveTab] = useState<string>('diario_escolar');
  const [userRole, setUserRole] = useState<'professor' | 'familia'>('professor');
  const [activeMode, setActiveMode] = useState<'aula' | 'pax'>('pax');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('mariana_souza');
  const [isStudentModalOpen, setIsStudentModalOpen] = useState<boolean>(false);
  const [showLgpdModal, setShowLgpdModal] = useState<boolean>(false);
  const [isShortcutModalOpen, setIsShortcutModalOpen] = useState<boolean>(false);
  const [simulatedProfile, setSimulatedProfile] = useState<AtalhoPerfil | null>(null);
  
  const [studentsMap, setStudentsMap] = useState<Record<string, StudentPaxData>>(PAX_STUDENTS);

  // Subscreve às atualizações dos alunos em tempo real
  useEffect(() => {
    const unsubscribe = subscribeToStudents((firestoreMap) => {
      setStudentsMap(firestoreMap);
    });
    return () => unsubscribe();
  }, []);

  const currentStudent = studentsMap[selectedStudentId] || studentsMap['mariana_souza'] || studentsMap['enzo_alencar'];

  // Verifica parâmetros de URL caso o responsável tenha escaneado o QR Code
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlAlunoId = params.get('alunoId');
      const urlOrigem = params.get('origem');
      if (urlAlunoId && PAX_STUDENTS[urlAlunoId]) {
        setSelectedStudentId(urlAlunoId);
        if (urlOrigem === 'qrcode_secretaria') {
          setUserRole('familia');
          setActiveMode('pax');
          setActiveTab('diario_escolar');
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Verifica se o responsável já assinou os termos LGPD para o aluno (Primeira tela obrigatória para a família)
  useEffect(() => {
    if (userRole === 'familia') {
      const termo = getLgpdConsentimentoAluno(selectedStudentId);
      if (!termo) {
        setShowLgpdModal(true);
      }
    }
  }, [userRole, selectedStudentId]);

  const handleToggleRole = (newRole: 'professor' | 'familia') => {
    setUserRole(newRole);
    if (newRole === 'familia') {
      setActiveMode('pax');
      // Verifica se o responsável já assinou os termos LGPD para o aluno
      const termo = getLgpdConsentimentoAluno(selectedStudentId);
      if (!termo) {
        setShowLgpdModal(true);
      }
    } else {
      setActiveMode('aula');
    }
  };

  const handleConfirmProfile = (perfil: AtalhoPerfil) => {
    setSimulatedProfile(perfil);
    handleToggleRole(perfil.role);
    if (perfil.tabDestino) {
      setActiveTab(perfil.tabDestino);
    }
    if (perfil.alunoPadraoId) {
      setSelectedStudentId(perfil.alunoPadraoId);
    }
  };

  const handleModeChange = (newMode: 'aula' | 'pax') => {
    setActiveMode(newMode);
    setActiveTab('diario_escolar');
  };

  return (
    <div className="min-h-screen bg-[#fffbf5] text-slate-800 flex flex-col font-sans">
      {/* Official Top Navigation Bar */}
      <BannerHeader
        user={user}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        selectedChildName={currentStudent.nome}
        selectedChildDob={currentStudent.nascimento}
        selectedChildPhoto={currentStudent.fotoUrl}
        userRole={userRole}
        onToggleRole={handleToggleRole}
        onOpenStudentModal={() => setIsStudentModalOpen(true)}
        onOpenShortcutModal={() => setIsShortcutModalOpen(true)}
        currentProfileName={
          simulatedProfile?.tituloExibicao ||
          (userRole === 'professor'
            ? 'Ana Silva (Professora Titular)'
            : `${currentStudent.responsavelNome} (${currentStudent.responsavelParentesco || 'Responsável'} de ${currentStudent.nome.split(' ')[0]})`)
        }
        currentProfilePhoto={
          simulatedProfile?.fotoUrl ||
          (userRole === 'professor'
            ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80'
            : (currentStudent.responsavelNome === 'Mariana Castro'
                ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'))
        }
        currentProfileRoleTitle={
          simulatedProfile?.subtituloCargo ||
          (userRole === 'professor' ? 'MASTER (DEV) BERÇÁRIO I - A' : 'RESPONSÁVEL FAMILIAR / CONSULTA')
        }
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* ABA: PAINEL DA DIREÇÃO ESCOLAR (Visão 360º, Turmas, Desempenho e Corpo Docente) */}
        {activeTab === 'direcao' && (
          <DirecaoModule
            userRole={userRole}
            onNavigateTab={setActiveTab}
          />
        )}

        {/* ABA: COORDENAÇÃO PEDAGÓGICA (Identificação Precoce, Encaminhamentos e Mediação de Conflitos) */}
        {activeTab === 'coordenacao' && (
          <CoordenacaoModule userRole={userRole} />
        )}

        {/* ABA: MURAL DE AVISOS, RECADOS DE MÃO DUPLA & WHATSAPP */}
        {activeTab === 'mural' && (
          <MuralAvisosERecadosModule
            currentStudent={currentStudent}
            userRole={userRole}
            onToggleRole={handleToggleRole}
            onSelectStudent={setSelectedStudentId}
          />
        )}

        {/* ABA: FAMÍLIAS (Vínculo Familiar, Pais e Equipe Escolar - Fotos 23 a 27) */}
        {activeTab === 'familias' && (
          <VinculoFamiliarModule
            currentStudentName={currentStudent.nome}
            currentStudent={currentStudent}
            userRole={userRole}
            onSelectStudent={setSelectedStudentId}
          />
        )}

        {/* ABA: DIÁRIO ESCOLAR UNIFICADO (Com Foto, Dados da Criança, Portal de Tranquilidade, Troca Rápida de Alunos e Diário 1-Clique/Voz Foto 28) */}
        {activeTab === 'diario_escolar' && (
          <PaxPortalDeTranquilidade
            userRole={userRole}
            onChangeUserRole={handleToggleRole}
            activeMode={activeMode}
            onChangeMode={handleModeChange}
            currentStudentId={selectedStudentId}
            onSelectStudentId={setSelectedStudentId}
            onOpenFullMedicationsTab={() => setActiveTab('medicamentos')}
            simulatedProfile={simulatedProfile}
          />
        )}

        {/* ABA: MEDICAMENTOS (Exclusivo para Pais cadastrarem/suspenderem com PIN; Professores apenas ministram) */}
        {activeTab === 'medicamentos' && (
          <ControleMedicamentosModule
            currentStudent={currentStudent}
            userRole={userRole}
            onSelectStudent={setSelectedStudentId}
            onToggleRole={handleToggleRole}
          />
        )}

        {/* ABA: JORNADA DO ANJINHO (Árvore, Método LIVRO, Memórias) */}
        {activeTab === 'jornada' && <JornadaDoAnjinho />}

        {/* ABA: TURMA & ALUNOS */}
        {activeTab === 'turma' && (
          <TurmaAlunosModule
            currentStudent={currentStudent}
            onSelectStudent={setSelectedStudentId}
            userRole={userRole}
          />
        )}

        {/* ABA: AGENDA */}
        {activeTab === 'agenda' && (
          <AgendaEscolar
            currentStudent={currentStudent}
            userRole={userRole}
          />
        )}

        {/* ABA: BRAND BOOK (Livro de Marca & Diretrizes Estratégicas) */}
        {activeTab === 'brand_book' && (
          <BrandBookModule />
        )}

        {/* ABA: CENTRAL JURÍDICA, CONTRATOS & SUPORTE */}
        {activeTab === 'central_juridica' && (
          <CentralJuridicaESuporteModule
            userRole={userRole}
            onNavigateTab={setActiveTab}
          />
        )}

        {/* ABA: GOVERNANÇA LGPD & RESPALDO JURÍDICO */}
        {activeTab === 'lgpd' && (
          <ModuloAuditoriaLgpd
            currentStudent={currentStudent}
            userRole={userRole}
            onSelectStudent={setSelectedStudentId}
          />
        )}
      </main>

      {/* Modal de Onboarding Inicial LGPD para Famílias (Primeira Tela) */}
      <ModalConsentimentoLgpdInicial
        isOpen={showLgpdModal}
        onClose={() => setShowLgpdModal(false)}
        student={currentStudent}
        isObrigatorio={false}
        onConsentimentoConcluido={(consentimento) => {
          setShowLgpdModal(false);
        }}
      />

      {/* Modal Global de Troca Rápida de Aluno */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-indigo-600" />
                <h3 className="text-base font-black text-slate-800">
                  Troca Rápida de Aluno — Berçário I - A ({Object.keys(PAX_STUDENTS).length} Alunos)
                </h3>
              </div>
              <button
                onClick={() => setIsStudentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Selecione o aluno para carregar a foto, ficha de saúde, portal de tranquilidade e diário:
            </p>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {Object.values(PAX_STUDENTS).map((st) => {
                const isSelected = st.id === selectedStudentId;
                return (
                  <div
                    key={st.id}
                    onClick={() => {
                      setSelectedStudentId(st.id);
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
                      <span className="text-xs font-bold text-slate-400 group-hover:text-indigo-600">
                        Selecionar &gt;
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setIsStudentModalOpen(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-black rounded-xl transition cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Botões Flutuantes Permanentes de Troca Rápida de Perfil (Professor, Pais/Família, Diretora) */}
      <FloatingRoleSwitcher
        userRole={userRole}
        activeTab={activeTab}
        onSelectRole={(role) => {
          handleToggleRole(role);
          if (activeTab === 'direcao') {
            setActiveTab('diario_escolar');
          }
        }}
        onSelectDirecao={() => setActiveTab('direcao')}
      />

      {/* Tela de Atalho / Simulador de Perfis (Acessada pelo botão superior direito) */}
      <TelaAtalhoSimuladorModal
        isOpen={isShortcutModalOpen}
        onClose={() => setIsShortcutModalOpen(false)}
        activeRole={userRole}
        activeTab={activeTab}
        onConfirmProfile={handleConfirmProfile}
        onSignOutDefinitive={() => signOut(auth)}
      />
    </div>
  );
}
