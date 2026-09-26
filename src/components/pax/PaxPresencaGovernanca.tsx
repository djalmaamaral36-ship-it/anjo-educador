import React, { useState, useEffect } from 'react';
import { StudentPaxData } from '../../types';
import { Play, Pause, RotateCcw, ShieldCheck, Clock, CheckCircle2, Lock } from 'lucide-react';

interface Props {
  student: StudentPaxData;
  userRole?: string;
  onUpdateStudent?: (updatedFields: Partial<StudentPaxData>) => void;
}

export default function PaxPresencaGovernanca({
  student,
  userRole = 'professor',
  onUpdateStudent
}: Props) {
  const isTeacher = userRole === 'professor' || userRole === 'educador';

  // Timer state inicializado e persistido
  const [isRunning, setIsRunning] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(`pax_timer_running_${student?.id || 'main'}`);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [seconds, setSeconds] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`pax_timer_seconds_${student?.id || 'main'}`);
      return saved !== null ? Number(saved) : 15155; // ~04:12:35 inicial
    } catch {
      return 15155;
    }
  });

  // Tique-taque em tempo real a cada 1 segundo
  useEffect(() => {
    let interval: any = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => {
          const next = prev + 1;
          try {
            localStorage.setItem(`pax_timer_seconds_${student?.id || 'main'}`, String(next));
          } catch (e) {
            console.error(e);
          }
          return next;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, student?.id]);

  const toggleTimer = () => {
    const nextRunning = !isRunning;
    setIsRunning(nextRunning);
    try {
      localStorage.setItem(`pax_timer_running_${student?.id || 'main'}`, JSON.stringify(nextRunning));
    } catch (e) {
      console.error(e);
    }
  };

  const resetTimer = () => {
    setSeconds(0);
    try {
      localStorage.setItem(`pax_timer_seconds_${student?.id || 'main'}`, '0');
    } catch (e) {
      console.error(e);
    }
  };

  const formatTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600).toString().padStart(2, '0');
    const mins = Math.floor((totalSec % 3600) / 60).toString().padStart(2, '0');
    const secs = (totalSec % 60).toString().padStart(2, '0');
    return `${hrs} : ${mins} : ${secs}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* 1. Métricas de Governança Card (%100 Conformidade) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between text-center space-y-3">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
            MÉTRICAS DE GOVERNANÇA
          </span>
          <div className="relative w-24 h-24 mx-auto my-2 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="#E2E8F0"
                strokeWidth="10"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="#5B46EB"
                strokeWidth="10"
                fill="none"
                strokeDasharray="251.2"
                strokeDashoffset="0"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex items-baseline justify-center">
              <span className="text-xl font-black text-[#5B46EB] tracking-tight">100%</span>
            </div>
          </div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 block">
            CONFORMIDADE
          </span>
          <p className="text-[11px] text-slate-500 mt-1">
            Registros e rotinas validadas com conformidade técnica.
          </p>
        </div>
      </div>

      {/* 2. Status da Rotina Hoje */}
      <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              SEGURANÇA DA ROTINA
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                isRunning
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              {isRunning ? 'EM ANDAMENTO' : 'PAUSADO'}
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
            {isRunning ? 'Tudo Sob Controle na Escola' : 'Cronômetro em Pausa'}
          </h3>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            {isRunning
              ? 'O período de aula está ativo. As atividades e rotinas registradas são auditadas em tempo real.'
              : 'O cronômetro está em pausa. Clique em Iniciar para continuar o cômputo do tempo.'}
          </p>
        </div>
        <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 space-y-1">
          <div>
            Responsável: <strong>{student?.professoraTitular || 'Professora Titular'}</strong>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>
              Status:{' '}
              <strong className={isRunning ? 'text-emerald-600' : 'text-amber-600'}>
                {isRunning ? 'Auditando' : 'Pausado'}
              </strong>
            </span>
            <span className="text-[10px] text-slate-400">Tempo Real</span>
          </div>
        </div>
      </div>

      {/* 3. Trava de Segurança Pedagógica */}
      <div className="bg-white rounded-3xl p-6 border border-indigo-100 shadow-sm flex flex-col justify-between space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#5B46EB] text-white flex items-center justify-center shrink-0 shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="text-xs text-slate-600 leading-relaxed">
            <h5 className="font-black text-slate-800 text-xs mb-0.5">
              Trava de Segurança Pedagógica
            </h5>
            <span>
              Acompanhamento oficial de <strong>{student?.nome || 'Mariana Souza'}</strong> com integridade de dados e proteção LGPD.
            </span>
          </div>
        </div>
        <div className="p-2.5 rounded-2xl border text-[11px] font-medium bg-indigo-50/70 border-indigo-100 text-indigo-900">
          🔒 Acesso seguro e auditável pelo responsável legal.
        </div>
      </div>

      {/* 4. Permanência em Aula / Cronômetro Digital Ativo */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
              TEMPO EM AULA
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                isRunning
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              {isRunning ? '▶️ EM AULA (ATIVO)' : '⏸️ EM AULA (PAUSADO)'}
            </span>
          </div>

          <div className="flex items-center justify-between mt-1">
            <h3 className="text-base font-black text-slate-900 leading-tight">
              Permanência em Aula
            </h3>

            {isTeacher && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={toggleTimer}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-xs ${
                    isRunning
                      ? 'bg-amber-500 hover:bg-amber-600 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {isRunning ? (
                    <>
                      <Pause className="w-3 h-3 fill-white" />
                      <span>Pausar</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 fill-white" />
                      <span>Iniciar</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={resetTimer}
                  title="Reiniciar tempo"
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Display Digital do Cronômetro com Atualização ao Vivo */}
          <div className="bg-slate-950 rounded-2xl p-3 my-2 text-center text-white space-y-0.5 shadow-inner">
            <span className="text-[9px] uppercase font-bold tracking-widest text-emerald-400 block">
              {isRunning ? 'TEMPO EM ANDAMENTO' : 'TEMPO COMPUTADO (PAUSADO)'}
            </span>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-emerald-400 tracking-wider">
              {formatTime(seconds)}
            </div>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 text-center font-bold">
          {isRunning ? '🟢 Cronômetro ativo segundo a segundo' : '🟡 Cronômetro pausado'}
        </div>
      </div>
    </div>
  );
}
