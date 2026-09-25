import React, { useState } from 'react';
import { 
  FileText, 
  Share2, 
  Printer, 
  Copy,
  Check
} from 'lucide-react';
import { StudentProfile, MealStatus, MedicationItem, TimelineEvent } from '../types';

interface ConsolidatedDailySummaryProps {
  student: StudentProfile;
  meals: MealStatus[];
  medications: MedicationItem[];
  timelineEvents: TimelineEvent[];
  elapsedSeconds: number;
  onOpenReportModal: () => void;
}

export const ConsolidatedDailySummary: React.FC<ConsolidatedDailySummaryProps> = ({
  student,
  meals,
  medications,
  timelineEvents,
  elapsedSeconds,
  onOpenReportModal,
}) => {
  const [copied, setCopied] = useState(false);

  const formatHours = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    return `${hrs}h ${mins.toString().padStart(2, '0')}min`;
  };

  const completedMeals = meals.filter(m => m.status !== 'SEM REGISTRO').length;
  const totalMeals = meals.length;
  const completedActivities = timelineEvents.filter(e => e.category === 'atividade');
  const administeredMeds = medications.filter(m => m.lastAdministeredAt);

  const handleShareWhatsApp = () => {
    const text = `🌟 *DIÁRIO CONSOLIDADO DO DIA - ANJINHO ESCOLAR* 🌟\n\n` +
      `👶 *Criança:* ${student.name} (${student.ageFormatted})\n` +
      `🏫 *Escola:* ${student.schoolName}\n` +
      `👩‍🏫 *Professora:* ${student.teacherName}\n` +
      `📅 *Data:* 24/09/2026\n` +
      `⏱️ *Tempo de Aula:* ${formatHours(elapsedSeconds)}\n\n` +
      `🍼 *Alimentação & Hidratação:*\n` +
      meals.map(m => `• ${m.name}: *${m.status}*`).join('\n') +
      `\n\n💤 *Soneca & Descanso:* Soninho tranquilo no berço climatizado.\n` +
      `🧷 *Higiene:* Trocas de fralda realizadas e pomada preventiva aplicada.\n` +
      `🩺 *Saúde:* Temperatura 36.6°C (Afebril, muito bem disposta).\n\n` +
      `💊 *Medicamentos & Cuidados:* \n` +
      (administeredMeds.length > 0
        ? administeredMeds.map(m => `• ${m.name} (${m.dose}) - ${m.lastAdministeredAt} (PIN Legal Autorizado)`).join('\n')
        : `• Nenhum medicamento necessário no período.`) +
      `\n\n🎨 *Atividades Vivenciadas:*\n` +
      completedActivities.map(a => `• ${a.time} - ${a.title}`).join('\n') +
      `\n\n_✨ Diário gerado com amor e transparência total pelo Anjinho Escolar._`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);

    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const handleCopyText = () => {
    const text = `🌟 *DIÁRIO CONSOLIDADO DO DIA - ANJINHO ESCOLAR* 🌟\n\n` +
      `👶 *Criança:* ${student.name} (${student.ageFormatted})\n` +
      `🏫 *Escola:* ${student.schoolName}\n` +
      `👩‍🏫 *Professora:* ${student.teacherName}\n` +
      `📅 *Data:* 24/09/2026\n` +
      `⏱️ *Tempo de Aula:* ${formatHours(elapsedSeconds)}\n\n` +
      `🍼 *Alimentação & Hidratação:*\n` +
      meals.map(m => `• ${m.name}: *${m.status}*`).join('\n') +
      `\n\n💤 *Soneca & Descanso:* Soninho tranquilo no berço climatizado.\n` +
      `🧷 *Higiene:* Trocas de fralda realizadas e pomada preventiva aplicada.\n` +
      `🩺 *Saúde:* Temperatura 36.6°C (Afebril, muito bem disposta).\n\n` +
      `🎨 *Atividades Vivenciadas:*\n` +
      completedActivities.map(a => `• ${a.time} - ${a.title}`).join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <section 
      id="section-consolidated" 
      className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                Diário Consolidado do Dia
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-300 text-[10px] font-black uppercase">
                Síntese Completa
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Resumo integrado de todos os cuidados, nutrição, sono, saúde e vivências de <strong>{student.name}</strong> para os pais.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={handleCopyText}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all active:scale-95 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
            <span>{copied ? 'Copiado!' : 'Copiar Resumo'}</span>
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Enviar no WhatsApp</span>
          </button>

          <button
            onClick={onOpenReportModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5B46EB] hover:bg-[#4D3AE0] text-white text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Boletim PDF</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-1 text-center">
          <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider block">
            TEMPO EM AULA
          </span>
          <div className="text-xl font-mono font-bold text-indigo-950">
            {formatHours(elapsedSeconds)}
          </div>
          <span className="inline-block text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            ✓ Presença Ativa
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1 text-center">
          <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider block">
            ALIMENTAÇÃO & LEITE
          </span>
          <div className="text-xl font-black text-amber-950">
            {completedMeals}/{totalMeals} Refeições
          </div>
          <span className="inline-block text-[10px] text-amber-800 font-bold bg-amber-100/70 px-2 py-0.5 rounded-md">
            Excelente Apetite
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1 text-center">
          <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider block">
            SAÚDE & TEMPERATURA
          </span>
          <div className="text-xl font-black text-emerald-950">
            36.6°C Afebril
          </div>
          <span className="inline-block text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-md">
            100% Bem Disposta
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-1 text-center">
          <span className="text-[10px] font-black uppercase text-purple-800 tracking-wider block">
            MEDICAÇÃO & PIN
          </span>
          <div className="text-xl font-black text-purple-950">
            {administeredMeds.length} Ministrado(s)
          </div>
          <span className="inline-block text-[10px] text-purple-800 font-bold bg-purple-100 px-2 py-0.5 rounded-md">
            🔒 PIN Autorizado
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <span>🎨</span> Atividades Vivenciadas Hoje
            </h4>
            <span className="text-[10px] text-slate-500 font-bold">
              {completedActivities.length} registradas
            </span>
          </div>

          <div className="space-y-2">
            {completedActivities.map((act) => (
              <div key={act.id} className="p-2.5 rounded-xl bg-white border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900">{act.title}</div>
                  <div className="text-[10px] text-slate-500">Horário: {act.time} • {act.badge}</div>
                </div>
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold text-[10px] border border-emerald-200">
                  ✓ Vivenciada
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <span>💖</span> Fisiologia, Sono & Cuidados
            </h4>
            <span className="text-[10px] text-emerald-700 font-bold">
              100% Conforme
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-xl bg-white border border-slate-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800">💤 Soneca da Tarde</span>
                <p className="text-[10px] text-slate-500">Início às 12:30 • Som suave e berço climatizado</p>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px]">
                Sereno
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-slate-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800">🧷 Trocas de Fralda</span>
                <p className="text-[10px] text-slate-500">Pele íntegra, pomada Bepantol aplicada</p>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 font-bold text-[10px]">
                3 Trocas
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-slate-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800">💊 Medicamento Ministrado</span>
                <p className="text-[10px] text-slate-500">Soro Nasal 0.9% aplicado às 12:15</p>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold text-[10px]">
                Auditado
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
