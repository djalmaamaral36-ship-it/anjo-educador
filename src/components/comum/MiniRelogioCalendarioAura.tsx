import React, { useState, useEffect, useRef } from 'react';
import { Clock, Calendar, ChevronLeft, ChevronRight, X, ExternalLink } from 'lucide-react';

interface Props {
  onOpenAgenda?: () => void;
  className?: string;
}

export default function MiniRelogioCalendarioAura({ onOpenAgenda, className = '' }: Props) {
  const [now, setNow] = useState(new Date());
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Atualiza o relógio a cada segundo em tempo real
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Formatação de hora igual ao print da Aura: "01:32:52"
  const timeStr = now.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  // Formatação de data igual ao print da Aura: "Qui., 17 De Set."
  const formatAuraDate = (date: Date) => {
    const diasSemana = ['Dom.', 'Seg.', 'Ter.', 'Qua.', 'Qui.', 'Sex.', 'Sáb.'];
    const meses = [
      'Jan.', 'Fev.', 'Mar.', 'Abr.', 'Mai.', 'Jun.',
      'Jul.', 'Ago.', 'Set.', 'Out.', 'Nov.', 'Dez.'
    ];

    const diaSem = diasSemana[date.getDay()];
    const diaNum = String(date.getDate()).padStart(2, '0');
    const mesNome = meses[date.getMonth()];

    return `${diaSem}, ${diaNum} De ${mesNome}`;
  };

  const dateStr = formatAuraDate(now);

  // Mini calendário logic
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleResetToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date());
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Widget Botão igual ao da Anjinha Aura */}
      <button
        type="button"
        onClick={() => {
          setViewDate(new Date());
          setIsOpen(!isOpen);
        }}
        className={`flex flex-col items-end justify-center px-2 sm:px-2.5 py-1 rounded-xl transition cursor-pointer select-none border text-right group ${
          isOpen
            ? 'bg-white/25 border-amber-300/80 shadow-inner'
            : 'bg-white/10 hover:bg-white/20 border-white/15 hover:border-white/30'
        }`}
        title="Clique para abrir o mini calendário"
      >
        {/* Hora em tempo real: 01:32:52 */}
        <div className="text-xs sm:text-[13px] font-mono font-black tracking-wider text-white leading-tight drop-shadow-xs flex items-center gap-1">
          <Clock size={11} className="text-amber-300 opacity-90 group-hover:scale-110 transition-transform hidden sm:inline" />
          <span>{timeStr}</span>
        </div>

        {/* Data formatada: Qui., 17 De Set. */}
        <div className="text-[9px] sm:text-[10px] text-amber-200 group-hover:text-amber-100 font-bold leading-none mt-0.5 tracking-tight">
          {dateStr}
        </div>
      </button>

      {/* Popover / Modal Mini Calendário */}
      {isOpen && (
        <>
          {/* Backdrop escuro suave para celular */}
          <div
            className="fixed inset-0 z-[99] bg-slate-900/60 backdrop-blur-xs sm:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Container do Calendário: Centralizado na tela no mobile, popover ancorado no desktop */}
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 sm:translate-y-0 sm:top-full sm:right-0 sm:left-auto sm:absolute sm:inset-x-auto sm:mt-2 w-auto sm:w-72 max-w-[340px] mx-auto sm:mx-0 bg-white rounded-3xl sm:rounded-2xl shadow-2xl border border-slate-200/90 text-slate-800 z-[100] p-4 sm:p-3.5 animate-in fade-in zoom-in-95 duration-150">
            {/* Header do Mini Calendário */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 sm:w-6 sm:h-6 rounded-xl sm:rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  <Calendar size={14} />
                </div>
                <div>
                  <h4 className="text-sm sm:text-xs font-black text-slate-900 leading-tight">
                    {monthNames[month]} {year}
                  </h4>
                  <p className="text-[11px] sm:text-[10px] text-slate-400 font-mono font-semibold">
                    {timeStr}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 sm:p-1 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer"
                  title="Mês anterior"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleResetToday}
                  className="px-2 sm:px-1.5 py-1 sm:py-0.5 rounded-lg sm:rounded-md text-[11px] sm:text-[10px] font-bold text-indigo-600 bg-indigo-50/70 hover:bg-indigo-100 transition cursor-pointer"
                  title="Voltar para hoje"
                >
                  Hoje
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 sm:p-1 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer"
                  title="Próximo mês"
                >
                  <ChevronRight size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 sm:p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer ml-1"
                  title="Fechar"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Dias da semana */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                <span
                  key={i}
                  className={`text-[11px] sm:text-[10px] font-black ${
                    i === 0 || i === 6 ? 'text-rose-500' : 'text-slate-400'
                  }`}
                >
                  {d}
                </span>
              ))}
            </div>

            {/* Grid dos dias */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {/* Dias do mês anterior */}
              {Array.from({ length: firstDayIndex }).map((_, i) => {
                const dayNum = daysInPrevMonth - firstDayIndex + i + 1;
                return (
                  <div
                    key={`prev-${i}`}
                    className="h-8 sm:h-7 flex items-center justify-center text-[12px] sm:text-[11px] text-slate-300 select-none"
                  >
                    {dayNum}
                  </div>
                );
              })}

              {/* Dias do mês atual */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const isToday =
                  dayNum === now.getDate() &&
                  month === now.getMonth() &&
                  year === now.getFullYear();
                const dayOfWeek = (firstDayIndex + i) % 7;
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                return (
                  <div
                    key={`day-${dayNum}`}
                    className={`h-8 sm:h-7 flex items-center justify-center text-xs font-semibold rounded-xl sm:rounded-lg transition ${
                      isToday
                        ? 'bg-indigo-600 text-white font-black shadow-xs ring-2 ring-indigo-200'
                        : isWeekend
                        ? 'text-rose-600/80 hover:bg-slate-50'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {dayNum}
                  </div>
                );
              })}
            </div>

            {/* Rodapé com atalho para a Agenda Escolar */}
            {onOpenAgenda && (
              <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] sm:text-[10px] text-slate-400 font-medium">
                  Anjinho Escolar
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenAgenda();
                  }}
                  className="text-xs sm:text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 transition cursor-pointer hover:underline py-1"
                >
                  <span>Ver Agenda Completa</span>
                  <ExternalLink size={12} />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
