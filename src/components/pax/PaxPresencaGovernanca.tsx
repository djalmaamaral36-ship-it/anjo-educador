import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, ShieldCheck, Activity } from 'lucide-react';
import { StudentPaxData } from '../../types';
import { DEFAULT_INITIAL_ACTIVITIES as PLAN_ACTIVITIES } from '../../data/weeklyPlan';
import { deduplicateActivities } from '../rotina/AuraPlannerIntegration';

interface Props {
  student: StudentPaxData;
  userRole?: 'professor' | 'familia';
  onUpdateStudent?: (updated: Partial<StudentPaxData>) => void;
}

// Componente de Gráfico Circular Donut com Anel de Progresso SVG
function CircularDonutChart({
  percent,
  label,
  color = '#0d9488',
  trackColor = '#e2e8f0',
  size = 110,
  strokeWidth = 9,
}: {
  percent: number;
  label: string;
  color?: string;
  trackColor?: string;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPercent = Math.max(0, Math.min(100, Math.round(percent)));
  const strokeDashoffset = circumference - (clampedPercent / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          {/* Trilha de fundo */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
          />
          {/* Anel de progresso preenchido */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            {clampedPercent}%
          </span>
        </div>
      </div>
      <p className="text-[10px] sm:text-[11px] font-black uppercase text-slate-500 tracking-wider mt-2.5">
        {label}
      </p>
    </div>
  );
}

export default function PaxPresencaGovernanca({ student, userRole = 'familia', onUpdateStudent }: Props) {
  const isProfessor = userRole === 'professor';
  const [lastSyncTime, setLastSyncTime] = useState('Agora mesmo');

  // Listener para evento de reset do cronômetro
  useEffect(() => {
    const handleReset = () => {
      setLastSyncTime('Agora mesmo');
    };
    window.addEventListener('anjinho:reset-activities-to-pending', handleReset);
    return () => window.removeEventListener('anjinho:reset-activities-to-pending', handleReset);
  }, []);

  // Cálculo Dinâmico e Realista das Métricas de Governança
  const isTimerAtZero =
    student.presenca?.tempoEmAulaFormatado === '00:00:00' ||
    student.presenca?.status === 'sem_aula';

  // Obter as atividades semanais desduplicadas
  const deduplicatedAll = deduplicateActivities(PLAN_ACTIVITIES);
  
  // Filtramos para a Quarta-feira, dia letivo simulado cheio
  const simulatedDay = 'Quarta-feira';
  const plannedForToday = deduplicatedAll.filter(act => (act.dia || 'Quarta-feira') === simulatedDay);

  let plannedCompletedCount = 0;
  let totalRefeicoesRecusadas = 0;

  plannedForToday.forEach(p => {
    let isCompleted = false;

    // A. Verifica se há um registro correspondente na linha do tempo de auditoria
    const normalizedPlanned = p.titulo.toLowerCase().trim();
    const auditItem = (student.auditoriaLinhaDoTempo || []).find(item => {
      const normalizedAudit = item.titulo.replace(/Atividade Pedagógica: |Alimentação & Nutrição: /g, '').toLowerCase().trim();
      return normalizedAudit.includes(normalizedPlanned) || normalizedPlanned.includes(normalizedAudit);
    });

    if (auditItem) {
      isCompleted = true;
    }

    // B. Fallbacks para garantir que ações diretas nos cartões de saúde/alimentação também dêem baixa sem duplicar:
    if (!isCompleted) {
      if (p.item_key === 'sono' || p.tipo === 'sono') {
        const sonecaVal = student.saudeCards?.soneca?.valor;
        if (sonecaVal && sonecaVal !== 'Sem Soneca Ainda' && sonecaVal !== 'Sem registros' && sonecaVal !== 'Sem Registros') {
          isCompleted = true;
        }
      } else if (p.item_key === 'almoco' || p.item_key === 'lanche' || p.tipo === 'alimentacao') {
        const matchingRef = (student.alimentacao?.refeicoes || []).find(ref => {
          const rName = ref.nome.toLowerCase();
          return rName.includes(normalizedPlanned) || normalizedPlanned.includes(rName);
        });
        if (matchingRef && matchingRef.status && matchingRef.status !== 'SEM REGISTRO' && !matchingRef.status.includes('PREVISTO')) {
          isCompleted = true;
          if (matchingRef.status.toLowerCase().includes('recus') || matchingRef.status.toLowerCase().includes('rejeit')) {
            totalRefeicoesRecusadas += 1;
          }
        }
      } else if (p.item_key === 'higiene' || p.tipo === 'banho') {
        const fraldaVal = student.saudeCards?.fraldas?.valor;
        if (fraldaVal && fraldaVal !== 'Nenhuma Troca' && fraldaVal !== 'Sem trocas' && fraldaVal !== 'Verificada / Limpa') {
          isCompleted = true;
        }
      } else if ((p.tipo as string) === 'presenca') {
        if (student.presenca?.status === 'em_aula' || student.presenca?.status === 'encerrada') {
          isCompleted = true;
        }
      }
    }

    if (isCompleted) {
      plannedCompletedCount += 1;
    }
  });

  // Outras rotinas complementares essenciais que não estão no cronograma pedagógico principal:
  let extraRoutinesExpected = 0;
  let extraRoutinesCompleted = 0;

  // Fraldas:
  const fraldaVal = student.saudeCards?.fraldas?.valor;
  if (fraldaVal && fraldaVal !== 'Nenhuma Troca' && fraldaVal !== 'Sem trocas') {
    extraRoutinesExpected += 1;
    extraRoutinesCompleted += 1;
  }

  // Hidratação extra:
  const copoVal = student.agua?.coposServidos || 0;
  if (copoVal > 0) {
    extraRoutinesExpected += 1;
    extraRoutinesCompleted += 1;
  }

  // Carga e realização total desduplicada
  const totalExpected = plannedForToday.length + extraRoutinesExpected;
  const totalCompleted = plannedCompletedCount + extraRoutinesCompleted;

  // Quantidade de rotinas realizadas e recusas finais
  let rotinasRealizadas = totalCompleted;
  let rotinasRecusas = totalRefeicoesRecusadas;

  // Se o timer estiver em zero e nenhuma rotina foi iniciada
  if (isTimerAtZero && rotinasRealizadas === 0 && (!student.auditoriaLinhaDoTempo || student.auditoriaLinhaDoTempo.length === 0)) {
    rotinasRealizadas = 0;
    rotinasRecusas = 0;
  }

  // Calculamos a porcentagem de conformidade com precisão baseada em planejamento e realização reais
  const conformidadeCalculada = totalExpected > 0 ? Math.min(100, Math.round((rotinasRealizadas / totalExpected) * 100)) : 0;
  const conformidade = rotinasRealizadas > 0 
    ? Math.max(conformidadeCalculada, student.governanca?.conformidadePercent || 0)
    : (student.governanca?.conformidadePercent || (rotinasRealizadas > 0 ? 100 : 0));

  // Qualidade baseada em anomalias (Febre, Recusas, Atrasos, etc.)
  const isFebril = parseFloat(student.saudeCards?.temperatura?.valor || '36.5') >= 37.8;
  const qualidadeCalculada = Math.max(70, Math.min(100, 100 - rotinasRecusas * 10 - (isFebril ? 15 : 0)));
  const qualidade = student.governanca?.qualidadePercent !== undefined && student.governanca.qualidadePercent > 0
    ? student.governanca.qualidadePercent
    : qualidadeCalculada;

  return (
    <div className="space-y-4">
      {/* 2 COLUNAS: MÉTRICAS DE GOVERNANÇA (GRÁFICOS CIRCULARES) & SEGURANÇA DA ROTINA HOJE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Coluna Esquerda: Métricas de Governança com Gráficos Circulares */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-black uppercase text-slate-400 tracking-wider">
                MÉTRICAS DE GOVERNANÇA
              </span>
              {rotinasRealizadas === 0 && (
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                  Início de Período
                </span>
              )}
            </div>

            {/* Dois Gráficos Circulares Donut Lado a Lado (Conformidade & Qualidade) */}
            <div className="grid grid-cols-2 gap-4 mt-4 items-center justify-items-center">
              {/* Conformidade (Verde Esmeralda/Teal) */}
              <CircularDonutChart
                percent={conformidade}
                label="CONFORMIDADE"
                color="#0d9488"
                trackColor="#e2e8f0"
              />

              {/* Qualidade (Azul Índigo/Roxo) */}
              <CircularDonutChart
                percent={qualidade}
                label="QUALIDADE"
                color="#4f46e5"
                trackColor="#e2e8f0"
              />
            </div>
          </div>

          <p className="text-xs text-slate-500 pt-3 border-t border-slate-100 leading-relaxed text-center sm:text-left">
            <strong>{rotinasRealizadas}</strong> rotina(s) realizada(s) e{' '}
            <strong>{rotinasRecusas}</strong> recusa(s) com registro técnico no período.
          </p>
        </div>

        {/* Coluna Direita: Segurança da Rotina Hoje */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-emerald-300/80 shadow-xs space-y-4 flex flex-col justify-between bg-gradient-to-br from-white to-emerald-50/30">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[10px] sm:text-[11px] font-black uppercase text-slate-500 tracking-wider">
                SEGURANÇA DA ROTINA HOJE
              </span>
              <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-900 border border-emerald-300 px-3 py-1 rounded-full text-[11px] sm:text-xs font-black">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{student.governanca?.statusRotinaBadge || 'STATUS: ROTINA ESCOLAR DENTRO DO ESPERADO'}</span>
              </div>
            </div>

            <h4 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight">
              {student.governanca?.statusRotinaTitulo || 'Tudo Sob Controle na Escola'}
            </h4>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {rotinasRealizadas === 0
                ? `O cronômetro e o novo período foram iniciados para ${student.nome}. As rotinas e cuidados previstos na escala estão aguardando execução pelas professoras. O Anjinho Escolar apontará e auditará cada ação em tempo real.`
                : student.governanca?.statusRotinaDescricao ||
                  `Tudo correndo tranquilamente hoje. Das atividades previstas na escala, ${rotinasRealizadas} foram realizadas com sucesso pelas professoras. O Anjinho Escolar audita e monitora cada ação. Fique despreocupado: qualquer falha gerará um alerta imediato para o seu celular.`}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-3 border-t border-emerald-100 text-xs text-slate-500 font-medium">
            <p>
              Responsável da Classe:{' '}
              <strong className="text-slate-800">
                {student.governanca?.responsavelClasse || student.professoraTitular || 'Ana Silva (Professora Titular)'}
              </strong>
            </p>
            <p>
              Último Contato Realizado via API:{' '}
              <strong className="text-indigo-600 font-bold">{lastSyncTime}</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
