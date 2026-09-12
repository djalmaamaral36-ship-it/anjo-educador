import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, ShieldCheck, Activity } from 'lucide-react';
import { StudentPaxData } from '../../types';

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

  // 1. Contagem de rotinas executadas na realidade do aluno no dia
  let rotinasRealizadas = 0;
  let rotinasRecusas = 0;

  // A. Hidratação
  if ((student.agua?.consumoMl && student.agua.consumoMl > 0) || (student.agua?.coposServidos && student.agua.coposServidos > 0)) {
    rotinasRealizadas += 1;
  }

  // B. Alimentação / Mamadeira
  if (student.alimentacao?.mamadeirasServidas && student.alimentacao.mamadeirasServidas > 0) {
    rotinasRealizadas += 1;
  }

  // C. Refeições (Papa, lanche, almoço)
  if (student.alimentacao?.refeicoes && student.alimentacao.refeicoes.length > 0) {
    student.alimentacao.refeicoes.forEach((ref) => {
      if (ref.status && ref.status !== 'SEM REGISTRO' && !ref.status.includes('PREVISTO')) {
        rotinasRealizadas += 1;
        if (ref.status.toLowerCase().includes('recus') || ref.status.toLowerCase().includes('rejeit')) {
          rotinasRecusas += 1;
        }
      }
    });
  }

  // D. Soneca / Descanso
  const sonecaVal = student.saudeCards?.soneca?.valor;
  if (sonecaVal && sonecaVal !== 'Sem Soneca Ainda' && sonecaVal !== 'Sem registros' && sonecaVal !== 'Sem Registros') {
    rotinasRealizadas += 1;
  }

  // E. Fralda / Higiene
  const fraldaVal = student.saudeCards?.fraldas?.valor;
  if (fraldaVal && fraldaVal !== 'Nenhuma Troca' && fraldaVal !== 'Sem trocas' && fraldaVal !== 'Verificada / Limpa') {
    rotinasRealizadas += 1;
  }

  // F. Atividades Pedagógicas e Auditoria de Sala (todos os itens da linha do tempo contam como rotina auditada)
  if (student.auditoriaLinhaDoTempo && student.auditoriaLinhaDoTempo.length > 0) {
    rotinasRealizadas += student.auditoriaLinhaDoTempo.length;
  }

  // Fallback para valores salvos em student.governanca se existirem
  if (student.governanca?.rotinasRealizadasHoje !== undefined && student.governanca.rotinasRealizadasHoje > rotinasRealizadas) {
    rotinasRealizadas = student.governanca.rotinasRealizadasHoje;
    rotinasRecusas = student.governanca.rotinasRecusasHoje || rotinasRecusas;
  }

  // Se o timer estiver em zero E nenhuma rotina foi realizada e nenhum item na linha do tempo existe, conformidade é 0
  if (isTimerAtZero && rotinasRealizadas === 0 && (!student.auditoriaLinhaDoTempo || student.auditoriaLinhaDoTempo.length === 0)) {
    rotinasRealizadas = 0;
    rotinasRecusas = 0;
  }

  // Meta de rotinas esperadas por turno
  const metaRotinasTurno = 8;
  const conformidadeCalculada = Math.min(100, Math.round((rotinasRealizadas / metaRotinasTurno) * 100));
  const conformidade = rotinasRealizadas > 0 
    ? Math.max(conformidadeCalculada, student.governanca?.conformidadePercent || 0)
    : (student.governanca?.conformidadePercent || (rotinasRealizadas > 0 ? 100 : 0));

  // Qualidade começa em 100% e desconta eventuais recusas ou febre
  const isFebril = parseFloat(student.saudeCards?.temperatura?.valor || '36.5') >= 37.8;
  const qualidadeCalculada = Math.max(70, Math.min(100, 100 - rotinasRecusas * 5 - (isFebril ? 5 : 0)));
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
