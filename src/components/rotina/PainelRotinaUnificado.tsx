import React, { useState, useEffect } from 'react';
import { StudentPaxData } from '../../types';
import { Play, Pause, RotateCcw, MessageCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

interface Props {
  student?: StudentPaxData;
  userRole?: string;
  onUpdateStudent?: (updated: Partial<StudentPaxData>) => void;
  allStudents?: StudentPaxData[];
  onUpdateAllStudents?: (updater: (st: StudentPaxData) => StudentPaxData) => void;
}

export default function PainelRotinaUnificado({
  student,
  userRole = 'professor',
  onUpdateStudent,
  allStudents,
  onUpdateAllStudents
}: Props) {
  const isTeacher = userRole === 'professor' || userRole === 'educador';

  // 1. Estado do Cronômetro em tempo real
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [seconds, setSeconds] = useState<number>(15155); // 04:12:35 inicial
  const [activeTab, setActiveTab] = useState<'individual' | 'coletivo'>('individual');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Contador tique-taque ao vivo segundo a segundo
  useEffect(() => {
    let interval: any = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const togglePause = () => {
    setIsRunning(!isRunning);
    showToast(isRunning ? '⏸️ Cronômetro da aula pausado' : '▶️ Cronômetro da aula em andamento');
  };

  const handleZerar = () => {
    setSeconds(0);
    showToast('🔄 Cronômetro zerado com sucesso');
  };

  const handleDesligarColetivo = () => {
    setIsRunning(false);
    showToast('🛑 Aulas coletivas encerradas para a turma.');
  };

  const handleDesligarIndividual = () => {
    showToast(`👤 Ausência registrada para ${student?.nome || 'o aluno'}.`);
  };

  const handleWhatsappBoletim = () => {
    const nome = student?.nome || 'Mariana Souza';
    const msg = encodeURIComponent(`Olá! Segue o boletim diário de acompanhamento escolar de ${nome} no Colégio Pequeno Anjo.`);
    window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
  };

  const formatTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600).toString().padStart(2, '0');
    const mins = Math.floor((totalSec % 3600) / 60).toString().padStart(2, '0');
    const secs = (totalSec % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  return (
    <div className="space-y-6">
      {toastMsg && (
        <div className="p-3 bg-slate-900 text-white font-bold text-xs rounded-2xl shadow-xl flex items-center justify-between animate-in fade-in">
          <span>{toastMsg}</span>
          <span className="text-emerald-400">✓</span>
        </div>
      )}

      {/* Banner de Modo Professora Ativo */}
      {isTeacher && (
        <div className="bg-white rounded-2xl p-4 border border-emerald-200 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
              ✓
            </div>
            <div>
              <h5 className="text-xs font-black text-slate-800">
                Modo Professora Ativo — Edição Liberada
              </h5>
              <p className="text-[11px] text-slate-500">
                Os dados e o cronômetro controlados nesta tela são transmitidos instantaneamente para a família de {student?.nome || 'Mariana Souza'}.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg">
            Painel Unificado
          </span>
        </div>
      )}

      {/* Bloco Principal: Classe e Presença do Aluno */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
              CLASSE E PRESENÇA DO ALUNO
            </span>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">
              Em Aula — {student?.nome || 'Mariana Souza'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Inicie o diário de classe do aluno para registrar sonecas, xixi/cocô, mamadeiras e saúde.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${
              isRunning
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
              {isRunning ? 'EM AULA (AO VIVO)' : 'EM AULA (PAUSADO)'}
            </span>
          </div>
        </div>

        {/* Linha do Cronômetro e Botões de Ação */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
          {/* Caixa Digital do Cronômetro */}
          <div className="bg-slate-950 rounded-2xl p-3 sm:p-4 text-white flex items-center justify-between gap-4 shadow-inner">
            <div>
              <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block">
                TEMPO DE AULA EM ANDAMENTO
              </span>
              <div className="text-2xl sm:text-3xl font-mono font-bold text-emerald-400 tracking-wider">
                {formatTime(seconds)}
              </div>
            </div>

            {isTeacher && (
              <button
                type="button"
                onClick={handleZerar}
                className="px-2.5 py-1 text-[11px] font-black bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-lg transition cursor-pointer"
              >
                Zerar
              </button>
            )}
          </div>

          {/* Botões de Ação da Professora */}
          {isTeacher && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDesligarColetivo}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition cursor-pointer shadow-2xs"
              >
                ⏰ Desligar Coletivo (Encerrar Aulas)
              </button>

              <button
                type="button"
                onClick={togglePause}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer shadow-2xs ${
                  isRunning
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {isRunning ? '⏸️ Pausar' : '▶️ Continuar'}
              </button>

              <button
                type="button"
                onClick={handleDesligarIndividual}
                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-black transition cursor-pointer"
              >
                👤 Desligar Individual / Ausência
              </button>

              <button
                type="button"
                onClick={handleWhatsappBoletim}
                className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black transition cursor-pointer shadow-2xs"
              >
                💬 Boletim WhatsApp
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
