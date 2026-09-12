import React, { useState } from 'react';
import {
  Shield,
  GraduationCap,
  Heart,
  Lock,
  Wifi,
  KeyRound,
  UserCheck,
  ChevronRight,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface Props {
  activeMode: 'aula' | 'pax';
  onChangeMode: (mode: 'aula' | 'pax') => void;
  userRole: 'professor' | 'familia';
  onChangeUserRole: (role: 'professor' | 'familia') => void;
  selectedStudentName: string;
  onOpenStudentModal?: () => void;
}

export default function PaxModeSwitcher({
  activeMode,
  onChangeMode,
  userRole,
  onChangeUserRole,
  selectedStudentName,
  onOpenStudentModal,
}: Props) {
  const [showAccessDeniedModal, setShowAccessDeniedModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);

  const handleModeClick = (mode: 'aula' | 'pax') => {
    if (mode === 'aula' && userRole === 'familia') {
      // Pai/Responsável cannot enter Professor panel!
      setShowAccessDeniedModal(true);
      return;
    }
    onChangeMode(mode);
  };

  return (
    <div className="space-y-4 my-6">
      {/* 1. O BOTÃO PRINCIPAL DE ALTERNÂNCIA (AULA vs PAX) */}
      <div className="flex flex-col items-center justify-center">
        <div className="bg-slate-100 p-1.5 rounded-full border border-slate-300/80 shadow-inner flex items-center gap-1 w-full max-w-lg">
          {/* Botão AULA Painel da Professora */}
          <button
            onClick={() => handleModeClick('aula')}
            className={`flex-1 py-3 px-4 rounded-full text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeMode === 'aula'
                ? 'bg-indigo-700 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <GraduationCap size={18} />
            <span>AULA Painel da Professora</span>
            {userRole === 'familia' && <Lock size={13} className="text-slate-400 ml-0.5" />}
          </button>

          {/* Botão PAX Portal de Tranquilidade */}
          <button
            onClick={() => handleModeClick('pax')}
            className={`flex-1 py-3 px-4 rounded-full text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeMode === 'pax'
                ? 'bg-[#059669] text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Heart size={18} />
            <span>PAX Portal de Tranquilidade</span>
          </button>
        </div>

        {/* Dica visual de perfil */}
        <p className="text-[11px] text-slate-500 font-medium mt-2 flex items-center gap-1.5">
          {userRole === 'professor' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Você está conectado como <strong>Professora Titular</strong> (acesso livre aos dois painéis).
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Você está conectado como <strong>Família / Responsável</strong> (exclusivo PAX somente leitura).
            </>
          )}
        </p>
      </div>

      {/* 2. Barra de Conexão à Nuvem & Servidor */}
      <div className="bg-white rounded-2xl px-4 py-2.5 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-bold text-slate-700">Dispositivo Conectado À Nuvem (Servidor)</span>
        </div>

        <button
          onClick={() => alert('Simulação de rede: Latência de 24ms. Conexão criptografada ponta-a-ponta.')}
          className="text-[10px] font-black text-slate-500 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition cursor-pointer"
        >
          [!] SIMULAR REDES / TESTES
        </button>
      </div>

      {/* 3. PERFIL ATIVO DO SISTEMA & TROCADOR */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full overflow-hidden bg-amber-200 border-2 border-indigo-200 flex-shrink-0">
            <img
              src={
                userRole === 'professor'
                  ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80'
                  : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'
              }
              alt="Perfil Ativo"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              PERFIL ATIVO DO SISTEMA
            </span>
            <h4 className="text-sm sm:text-base font-black text-slate-800 leading-tight">
              {userRole === 'professor'
                ? 'Ana Silva (Professora Titular)'
                : 'Thiago Alencar (Pai do Enzo)'}
            </h4>
            <span
              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md inline-block mt-0.5 ${
                userRole === 'professor'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'bg-emerald-50 text-emerald-800'
              }`}
            >
              {userRole === 'professor'
                ? 'Professora Titular / Educador'
                : 'Responsável Familiar / Consulta'}
            </span>
          </div>
        </div>

        {/* Ações de perfil e aluno */}
        <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto justify-end">
          <button
            onClick={() => setShowRoleModal(true)}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <KeyRound size={14} />
            <span>Trocar Educador / Perfil (PIN)</span>
          </button>

          {onOpenStudentModal && (
            <button
              onClick={onOpenStudentModal}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              <UserCheck size={14} />
              <span>Trocar Sala / Aluno</span>
            </button>
          )}
        </div>
      </div>

      {/* Modal de Bloqueio de Acesso para Pais ao Painel da Professora */}
      {showAccessDeniedModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
              <Lock size={28} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800">Acesso Restrito ao Corpo Docente</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                O <strong>Painel da Professora (AULA)</strong> é exclusivo para os educadores realizarem anotações,
                lançamentos de rotinas e avaliações de classe.
              </p>
              <p className="text-xs text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 rounded-xl p-3 mt-3">
                Como pai ou responsável, você tem acesso integral e seguro ao <strong>PAX Portal de Tranquilidade</strong> para acompanhar cada momento do seu filho em tempo real.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowAccessDeniedModal(false)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-black rounded-xl transition cursor-pointer"
              >
                Entendido, voltar ao PAX
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Simular Troca de Perfil (Professor vs Pais) */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound size={20} className="text-indigo-600" />
                <h3 className="text-base font-black text-slate-800">Simulador de Perfil & PIN</h3>
              </div>
              <button
                onClick={() => setShowRoleModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Escolha qual perfil você deseja simular no Anjinho Educador:
            </p>

            <div className="space-y-2.5">
              {/* Opção Professora */}
              <div
                onClick={() => {
                  onChangeUserRole('professor');
                  setShowRoleModal(false);
                }}
                className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                  userRole === 'professor'
                    ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-amber-200 flex-shrink-0">
                    <img
                      src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80"
                      alt="Ana Silva"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-slate-800">Ana Silva (Professora Titular)</h4>
                    <p className="text-[11px] text-slate-500">Acesso Total: AULA (lançamentos) & PAX (visão pais)</p>
                  </div>
                </div>
                {userRole === 'professor' && (
                  <span className="text-xs font-black text-indigo-600 bg-white px-2 py-1 rounded-lg shadow-xs">
                    Ativo
                  </span>
                )}
              </div>

              {/* Opção Pais / Responsável */}
              <div
                onClick={() => {
                  onChangeUserRole('familia');
                  onChangeMode('pax'); // switches to PAX immediately
                  setShowRoleModal(false);
                }}
                className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                  userRole === 'familia'
                    ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-emerald-200 flex-shrink-0">
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                      alt="Thiago Alencar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-slate-800">Thiago Alencar (Pai do Enzo)</h4>
                    <p className="text-[11px] text-slate-500">Acesso Exclusivo: PAX (somente leitura e tranquilidade)</p>
                  </div>
                </div>
                {userRole === 'familia' && (
                  <span className="text-xs font-black text-emerald-600 bg-white px-2 py-1 rounded-lg shadow-xs">
                    Ativo
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowRoleModal(false)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
