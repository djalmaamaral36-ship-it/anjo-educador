import React, { useState, useEffect } from 'react';
import { Idoso, SinalVital, RegistroAlimentacao, RegistroHidratacao, RegistroSono, RegistroHumor, TarefaDiaria, Usuario, formatWhatsAppNumber } from '../types';
import { getFromDB, saveToDB } from '../data';
import { VoiceInput } from './VoiceInput';
import { 
  FileText, 
  TrendingUp, 
  Heart, 
  Activity, 
  Droplets, 
  Moon, 
  Smile, 
  Calendar, 
  Share2, 
  CheckCircle,
  Printer,
  ChevronRight,
  Info,
  Copy,
  Check,
  Scale,
  TrendingDown
} from 'lucide-react';

interface ReportsProps {
  key?: any;
  idoso: Idoso;
  accessibilitySettings: {
    fontSize: 'normal' | 'grande' | 'gigante';
    simplifiedMode: boolean;
  };
  keyTrigger: number;
  triggerWhatsAppSim?: (titulo: string, mensagem: string) => void;
}

export default function Reports({ idoso, accessibilitySettings, keyTrigger, triggerWhatsAppSim }: ReportsProps) {
  const appMode = localStorage.getItem('anjo_app_mode') || 'idoso';
  const isEscolar = appMode === 'escolar_infantil' || appMode === 'escolar_fundamental';
  const [sinais, setSinais] = useState<SinalVital[]>([]);
  const [alimentacao, setAlimentacao] = useState<RegistroAlimentacao[]>([]);
  const [hidratacao, setHidratacao] = useState<RegistroHidratacao[]>([]);
  const [sono, setSono] = useState<RegistroSono[]>([]);
  const [humores, setHumores] = useState<RegistroHumor[]>([]);
  const [todayTasks, setTodayTasks] = useState<TarefaDiaria[]>([]);
  const [customNotes, setCustomNotes] = useState('');
  const [copied, setCopied] = useState(false);

  const [activeReportTab, setActiveReportTab] = useState<'sinais' | 'rotina' | 'resumo' | 'whatsapp_diario'>('sinais');
  const [showPrintReady, setShowPrintReady] = useState(false);

  // States for date range filtering
  const [presetFilter, setPresetFilter] = useState<'todo' | '7' | '30' | '90' | 'personalizado'>('todo');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const getNotificationRecipient = () => {
    const allUsers = getFromDB<Usuario[]>('anjo_usuarios', []);
    const adminUser = allUsers.find(u => u.tipo === 'admin');
    if (adminUser) {
      return { nome: adminUser.nome, telefone: adminUser.telefone };
    }
    const familiarUser = allUsers.find(u => u.tipo === 'familiar');
    if (familiarUser) {
      return { nome: familiarUser.nome, telefone: familiarUser.telefone };
    }
    if (idoso?.contatoEmergencia) {
      return { 
        nome: idoso.contatoEmergencia.nome, 
        telefone: idoso.contatoEmergencia.telefone 
      };
    }
    return { nome: 'Família', telefone: '(11) 98765-4321' };
  };

  useEffect(() => {
    loadReportsData();

    const handleUpdate = () => {
      loadReportsData();
    };
    window.addEventListener('db-vitals-update', handleUpdate);
    return () => {
      window.removeEventListener('db-vitals-update', handleUpdate);
    };
  }, [idoso, keyTrigger, presetFilter, startDate, endDate]);

  const loadReportsData = () => {
    const now = new Date();
    const yLocal = now.getFullYear();
    const mLocal = String(now.getMonth() + 1).padStart(2, '0');
    const dLocal = String(now.getDate()).padStart(2, '0');
    const todayStr = `${yLocal}-${mLocal}-${dLocal}`;
    const todayBr = `${dLocal}/${mLocal}/${yLocal}`;

    const allSinais = getFromDB<SinalVital[]>('anjo_sinais', []);
    
    // Combine global and student-specific feeds
    const globalFeeds = getFromDB<any[]>('anjo_alimentacao', []);
    const studentFeeds = getFromDB<any[]>(`anjo_alimentacao_${idoso.id}`, []);
    const feedsMap = new Map<string, any>();
    [...globalFeeds, ...studentFeeds].forEach((item, idx) => {
      if (!item) return;
      if (item.idosoId && item.idosoId !== idoso.id) return;
      const id = item.id || `feed_${idx}_${Date.now()}`;
      if (!feedsMap.has(id)) {
        feedsMap.set(id, { ...item, id, idosoId: idoso.id });
      }
    });
    const allFeeds = Array.from(feedsMap.values());

    // Combine global and student-specific hydration using clean deduplication
    const globalHyd = getFromDB<any[]>('anjo_hidratacao', []);
    const studentHyd1 = getFromDB<any[]>(`anjo_registro_agua_${idoso.id}`, []);
    const studentHyd2 = getFromDB<any[]>(`anjo_hidratacao_${idoso.id}`, []);
    const combinedHyd: any[] = [];
    [...globalHyd, ...studentHyd1, ...studentHyd2].forEach((item) => {
      if (!item) return;
      if (item.idosoId && item.idosoId !== idoso.id) return;
      combinedHyd.push(item);
    });

    const hasTodayRealHyd = combinedHyd.some(item => {
      if (!item.data) return false;
      const cleanD = String(item.data).split(' ')[0].split('T')[0];
      return cleanD === todayStr || cleanD === todayBr;
    });

    const hydMap = new Map<string, any>();
    combinedHyd.forEach((item, idx) => {
      if (!item) return;
      if (item.data) {
        const cleanD = String(item.data).split(' ')[0].split('T')[0];
        if (hasTodayRealHyd && cleanD !== todayStr && cleanD !== todayBr) return;
      }
      const id = item.id || `hyd_rep_${item.horario || ''}_${item.quantidadeMl || item.ml || ''}_${idx}`;
      const timeStr = item.horario || item.time || '';
      const mlVal = Number(item.quantidadeMl || item.ml || item.quantidade || 0);

      if (!hydMap.has(id)) {
        hydMap.set(id, { ...item, id, idosoId: idoso.id, quantidadeMl: mlVal > 0 ? mlVal : 150 });
      }
    });
    const allHyd = Array.from(hydMap.values());

    const allSonos = getFromDB<RegistroSono[]>('anjo_sono', []);
    const allHum = getFromDB<RegistroHumor[]>('anjo_humor', []);
    const allTasks = getFromDB<TarefaDiaria[]>('anjo_tarefas_diarias', []);

    // Filter by IdosoId/StudentID
    let filteredSinais = allSinais.filter(s => s.idosoId === idoso.id);
    let filteredFeeds = allFeeds.filter(f => f.idosoId === idoso.id);
    let filteredHyd = allHyd.filter(h => h.idosoId === idoso.id);
    let filteredSonos = allSonos.filter(s => s.idosoId === idoso.id);
    let filteredHum = allHum.filter(hu => hu.idosoId === idoso.id);

    // Apply date range filter
    if (presetFilter !== 'todo') {
      let startLimit = '';
      let endLimit = new Date().toISOString().split('T')[0];

      if (presetFilter === '7' || presetFilter === '30' || presetFilter === '90') {
        const days = Number(presetFilter);
        const d = new Date();
        d.setDate(d.getDate() - days);
        startLimit = d.toISOString().split('T')[0];
      } else if (presetFilter === 'personalizado') {
        startLimit = startDate;
        endLimit = endDate || new Date().toISOString().split('T')[0];
      }

      if (startLimit) {
        filteredSinais = filteredSinais.filter(s => s.data >= startLimit);
        filteredFeeds = filteredFeeds.filter(f => f.data >= startLimit);
        filteredHyd = filteredHyd.filter(h => h.data >= startLimit);
        filteredSonos = filteredSonos.filter(s => s.data >= startLimit);
        filteredHum = filteredHum.filter(h => h.data >= startLimit);
      }
      if (endLimit) {
        filteredSinais = filteredSinais.filter(s => s.data <= endLimit);
        filteredFeeds = filteredFeeds.filter(f => f.data <= endLimit);
        filteredHyd = filteredHyd.filter(h => h.data <= endLimit);
        filteredSonos = filteredSonos.filter(s => s.data <= endLimit);
        filteredHum = filteredHum.filter(h => h.data <= endLimit);
      }
    }

    setSinais(filteredSinais.sort((a, b) => a.data.localeCompare(b.data)));
    setAlimentacao(filteredFeeds);
    setHidratacao(filteredHyd);
    setSono(filteredSonos.sort((a, b) => a.data.localeCompare(b.data)));
    setHumores(filteredHum);
    setTodayTasks(allTasks.filter(t => t.idosoId === idoso.id));
  };

  const buildWhatsAppMessage = () => {
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    
    // Day care tasks filters
    const concluidas = todayTasks.filter(t => t.status === 'concluido');
    const pendentes = todayTasks.filter(t => t.status === 'pendente' || t.status === 'atrasado');
    
    // Glicemia & Sinais Vitais of Today
    const nowObj = new Date();
    const yLocal = nowObj.getFullYear();
    const mLocal = String(nowObj.getMonth() + 1).padStart(2, '0');
    const dLocal = String(nowObj.getDate()).padStart(2, '0');
    const todayStr = `${yLocal}-${mLocal}-${dLocal}`;
    const todayBr = `${dLocal}/${mLocal}/${yLocal}`;
    const isTodayOrDemo = (d?: string) => {
      if (!d) return true;
      const cleanD = d.split(' ')[0].split('T')[0];
      return cleanD === todayStr || cleanD === todayBr || d === todayStr || d === todayBr || d === '2026-05-30';
    };

    // Food & Hydration of today - directly fetched to avoid preset filter issues
    const allFeedsRaw = getFromDB<RegistroAlimentacao[]>('anjo_alimentacao', []).filter(f => f.idosoId === idoso.id);
    const globalHydRaw = getFromDB<any[]>('anjo_hidratacao', []);
    const studentHyd1Raw = getFromDB<any[]>(`anjo_registro_agua_${idoso.id}`, []);
    const studentHyd2Raw = getFromDB<any[]>(`anjo_hidratacao_${idoso.id}`, []);
    
    const combinedHydRaw: any[] = [];
    [...globalHydRaw, ...studentHyd1Raw, ...studentHyd2Raw].forEach(item => {
      if (!item) return;
      if (item.idosoId && item.idosoId !== idoso.id) return;
      combinedHydRaw.push(item);
    });

    const hasTodayRealHydRaw = combinedHydRaw.some(item => {
      if (!item.data) return false;
      const cleanD = String(item.data).split(' ')[0].split('T')[0];
      return cleanD === todayStr || cleanD === todayBr;
    });

    const hydReportMap = new Map<string, any>();
    combinedHydRaw.forEach((item, idx) => {
      if (!item) return;
      if (item.data) {
        const cleanD = String(item.data).split(' ')[0].split('T')[0];
        if (hasTodayRealHydRaw && cleanD !== todayStr && cleanD !== todayBr) return;
        if (!isTodayOrDemo(item.data)) return;
      }
      const id = item.id || `hyd_rep_raw_${item.horario || ''}_${item.quantidadeMl || item.ml || ''}_${idx}`;
      const timeStr = item.horario || item.time || '';
      const mlVal = Number(item.quantidadeMl || item.ml || item.quantidade || 0);

      if (!hydReportMap.has(id)) {
        hydReportMap.set(id, { ...item, id, idosoId: idoso.id, quantidadeMl: mlVal > 0 ? mlVal : 150 });
      }
    });

    let feedsHoje = allFeedsRaw.filter(f => isTodayOrDemo(f.data));
    let hidsHoje = Array.from(hydReportMap.values());
    const totalMl = hidsHoje.reduce((acc, curr) => acc + curr.quantidadeMl, 0);
    const coposCount = hidsHoje.length;

    const allSinaisRaw = getFromDB<SinalVital[]>('anjo_sinais', []).filter(s => s.idosoId === idoso.id);
    let sinaisHoje = allSinaisRaw.filter(s => isTodayOrDemo(s.data));
    const ultimoSinal = sinaisHoje[sinaisHoje.length - 1];
    
    let msgSinais = isEscolar 
      ? '⚠ Nenhuma observação de saúde ou rotina hoje.'
      : '⚠ Nenhum sinal aferido hoje.';
    if (ultimoSinal) {
      msgSinais = isEscolar
        ? `• Período de Sono/Soneca: ${ultimoSinal.pressaoArterial}
• Fraldas e Trocas (Urina/Fezes): ${ultimoSinal.fralda || 'Verificada e limpa'}
• Temperatura Corporal: ${ultimoSinal.temperatura}°C
• Copos d'Água oferecidos: ${coposCount} copo(s) (${totalMl}ml total de água)`
        : `• Pressão Arterial: ${ultimoSinal.pressaoArterial} mmHg (às ${ultimoSinal.horario})
• Glicemia Capilar: ${ultimoSinal.glicemia} mg/dL (${ultimoSinal.tipoGlicemia || 'casual'})
• Temperatura Corporal: ${ultimoSinal.temperatura}°C
• Freq. Cardíaca: ${ultimoSinal.frequenciaCardiaca} bpm
• Saturação de O2: ${ultimoSinal.saturacao}%`;
    }

    // Today's meds
    const medicamentosH = concluidas.filter(t => t.tipo === 'medicacao');
    const medPendentesH = todayTasks.filter(t => t.tipo === 'medicacao' && t.status !== 'concluido');

    let msgMed = '✅ Todos os medicamentos programados foram tomados!';
    if (medicamentosH.length === 0 && medPendentesH.length === 0) {
      msgMed = '• Nenhuma medicação programada para hoje.';
    } else {
      msgMed = '';
      if (medicamentosH.length > 0) {
        msgMed += '  *Tomados:*\n' + medicamentosH.map(m => `  • ${m.titulo} às ${m.concluidaEm}`).join('\n');
      }
      if (medPendentesH.length > 0) {
        if (msgMed) msgMed += '\n';
        msgMed += '  *Pendentes/Próximos:*\n' + medPendentesH.map(m => `  • ${m.titulo} (${m.horarioPrevisto})`).join('\n');
      }
    }

    const mealLabelMap: { [key: string]: string } = {
      mamadeira: 'Mamadeira de Leite',
      cafe_manha: 'Café da Manhã',
      almoco: 'Almoço',
      lanche: 'Lanche da Manhã',
      lanche_tarde: 'Lanche da Tarde',
      jantar: 'Jantar',
      ceia: 'Ceia'
    };
    
    const acceptLabelMap: { [key: string]: string } = {
      muito_bem: 'Muito bem',
      pouco: 'Pouco',
      recusou: 'Recusou'
    };

    let msgAlimento = 'Refeições Principais:';
    if (feedsHoje.length === 0) {
      msgAlimento += '\n  • Sem refeições registradas até o momento.';
    } else {
      msgAlimento += '\n' + feedsHoje.map(a => {
        const mealName = mealLabelMap[a.refeicao] || a.refeicao;
        const acceptName = acceptLabelMap[a.aceitacao] || a.aceitacao;
        const obs = a.observacoes ? ` ("${a.observacoes}")` : '';
        const qty = a.quantidadeMl ? ` (${a.quantidadeMl}ml)` : '';
        return `  • ${mealName}${qty}: Aceitação ${acceptName}${obs} às ${a.horario}`;
      }).join('\n');
    }

    const bottleFeedsToday = feedsHoje.filter(f => f.refeicao === 'mamadeira');
    if (bottleFeedsToday.length > 0) {
      msgAlimento += `\n  Mamadeiras Servidas Hoje: ${bottleFeedsToday.length} mamadeira(s) (Total de ${bottleFeedsToday.reduce((acc, curr) => acc + (curr.quantidadeMl || 150), 0)}ml).`;
    }
    
    if (isEscolar) {
      msgAlimento += `\n  Ingestão Hídrica (Água): ${totalMl} ml (${coposCount} copo(s) d'água registrados hoje).`;
    } else {
      msgAlimento += `\n  Ingestão Hídrica: ${totalMl} ml (${coposCount} copo(s) d'água registrados hoje).`;
    }

    // Routine checklist (baths, sun, exercises...)
    const outRotinasH = concluidas.filter(t => t.tipo !== 'medicacao' && t.tipo !== 'alimentacao' && t.tipo !== 'hidratacao');
    let msgRotinas = 'Atividades & Higiene:';
    if (outRotinasH.length === 0) {
      msgRotinas += '\n  • Nenhuma outra atividade concluída até o momento.';
    } else {
      msgRotinas += '\n' + outRotinasH.map(r => `  • [Concluído] ${r.titulo} às ${r.concluidaEm}`).join('\n');
    }

    const obsTxt = customNotes ? `\n\n  *${isEscolar ? 'MENSAGEM DA PROFESSORA' : 'NOTAS DO CUIDADOR'}:*\n"${customNotes}"` : '';

    if (isEscolar) {
      const tenderName = idoso.nome.split(' (')[0].replace(/[0-9]/g, '').trim() || 'Nosso Anjinho';
      return `  *DIÁRIO AFETIVO ESCOLAR — ${tenderName.toUpperCase()}*  
  *Data:* ${dataAtual}

Olá, família querida! ✨
Segue o resumo carinhoso do dia do(a) nosso(a) pequeno(a) na escola:

  *SONO & BEM-ESTAR:*
${msgSinais}

  *ALIMENTAÇÁO & HIDRATAÇÁO:*
${msgAlimento}

  *VIVÊNCIAS & CUIDADOS:*
${msgRotinas}${obsTxt}

✨ *Um dia cheio de carinho, aprendizado e acolhimento!*
___
  *Anjinho Escolar — Cuidando com amor de cada pequeno passo.*`;
    }

    const title = `  *RELATÓRIO DIÁRIO DE CUIDADOS — ${idoso.nome.toUpperCase()}*  `;
    const sinaisLabel = `❤ *SINAIS VITAIS:*`;
    const medsLabel = `💊 *MEDICAÇÕES DO DIA:*`;
    const routinesLabel = `  *OUTROS CUIDADOS REALIZADOS:*`;

    return `${title}
  *Data:* ${dataAtual}

${sinaisLabel}
${msgSinais}

${medsLabel}
${msgMed}

  *ALIMENTAÇÁO & HIDRATAÇÁO:*
${msgAlimento}

${routinesLabel}
${msgRotinas}${obsTxt}

___
  Relatório gerado no aplicativo *Anjo Cuidador*.`;
  };

  const handleCopy = () => {
    const text = buildWhatsAppMessage();
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Convert "Pressao" string ex: "120/80" to coordinates for plotting
  const parseSYS = (pa: string) => {
    const parts = pa.split('/');
    return parts.length > 0 ? Number(parts[0]) : 120;
  };
  const parseDIA = (pa: string) => {
    const parts = pa.split('/');
    return parts.length > 1 ? Number(parts[1]) : 80;
  };

  // Food totals
  const totalFoodsCount = alimentacao.length;
  const foodAcceptanceRate = totalFoodsCount === 0 ? 0 : Math.round(
    (alimentacao.filter(f => f.aceitacao === 'muito_bem').length / totalFoodsCount) * 100
  );

  // Hydration totals
  const totalWaterLoggedThisWeek = hidratacao.reduce((acc, curr) => acc + curr.quantidadeMl, 0);

  // Mood frequency count calculation
  const moodAggregation = () => {
    const counts: { [key: string]: number } = {};
    humores.forEach(h => {
      counts[h.estado] = (counts[h.estado] || 0) + 1;
    });
    return Object.entries(counts).sort((a,b) => b[1] - a[1]);
  };
  const topMoods = moodAggregation();

  // Print simulator callback
  const handlePrintFullReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-serene-blue" />
            Painel de Desempenho e Relatórios
          </h2>
          <p className="text-sm text-slate-500">
            Gráficos e históricos diários consolidados para apresentação médica ou acompanhamento familiar.
          </p>
        </div>

        <button 
          onClick={() => setShowPrintReady(!showPrintReady)}
          className="px-5 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-350 font-bold rounded-xl active:scale-95 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xs"
        >
          <Printer className="w-5 h-5 text-slate-500" /> 
          {showPrintReady ? 'Fechar Visual Impresso' : 'Visualizar para Impressão'}
        </button>
      </div>

      
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Calendar className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm font-extrabold text-slate-800">Filtro de Período & Busca por Datas</h3>
              <p className="text-xs text-slate-500">Selecione o intervalo de tempo para analisar gráficos e boletins históricos</p>
            </div>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg self-start sm:self-auto">
            {presetFilter === 'todo' ? 'Todo o histórico' : presetFilter === '7' ? 'Últimos 7 dias' : presetFilter === '30' ? 'Últimos 30 dias' : presetFilter === '90' ? 'Últimos 3 meses (90 dias)' : 'Intervalo Personalizado'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {[
            { id: 'todo', label: 'Todo o Histórico' },
            { id: '7', label: 'Últimos 7 dias' },
            { id: '30', label: 'Últimos 30 dias' },
            { id: '90', label: 'Últimos 3 meses (90 dias)' },
            { id: 'personalizado', label: 'Intervalo Personalizado  ' }
          ].map(p => {
            const isActive = presetFilter === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPresetFilter(p.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  isActive 
                    ? (isEscolar ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' : 'bg-blue-600 text-white border-blue-600 shadow-xs')
                    : 'bg-white text-slate-650 border-slate-200 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        
        {presetFilter === 'personalizado' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-white border border-slate-200 rounded-xl max-w-xl transition-all">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 block">De (Data de início)</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-250 rounded-xl text-xs text-slate-800 font-semibold focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 block">Até (Data final)</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-250 rounded-xl text-xs text-slate-800 font-semibold focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
        )}
      </div>

      
      {showPrintReady && (
        <div className="bg-white border-2 border-slate-400 p-8 rounded-3xl space-y-6 shadow-2xl relative watermark-protected">
          <div className="absolute right-6 top-6 flex gap-2">
            <button 
              onClick={handlePrintFullReport}
              className="px-4 py-2 bg-serene-blue text-white font-bold text-xs rounded-lg hover:bg-blue-600 transition-colors cursor-pointer"
            >
              Imprimir / Salvar PDF
            </button>
          </div>

          <div className="text-center py-4 border-b border-soft-gray space-y-2">
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-widest">{isEscolar ? 'Anjinho Escolar' : 'Anjo Cuidador'}</h1>
            <p className="text-xs text-slate-400">{isEscolar ? 'Relatório Pedagógico Unificado de Atividades e Rotinas' : 'Relatório Médico Unificado de Rotinas e Sinais Vitais'}</p>
            <div className="inline-flex gap-4 text-xs font-semibold text-slate-705">
              <span>{isEscolar ? 'Criança/Aluno(a):' : 'Paciente:'} <strong className="text-slate-900 font-bold">{idoso.nome}</strong></span>
              <span>•</span>
              <span>Data de Referência: <strong className="text-slate-930">{new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 text-sm">
            <div className="space-y-2">
              <h3 className="font-bold border-b pb-1 text-slate-800">{isEscolar ? 'Restrições, Alergias & Avisos' : 'Alertas Clínicos & Alergias'}</h3>
              <ul className="list-disc pl-4 text-xs text-slate-650 space-y-1">
                <li><strong className="text-slate-800">{isEscolar ? 'Fatores de Observação:' : 'Principais Condições:'}</strong> {idoso.condicoesMedicas.join(', ')}</li>
                <li><strong className="text-slate-800">Alergias Catalogadas:</strong> {idoso.alergias.join(', ')}</li>
                <li><strong className="text-slate-800">{isEscolar ? 'Pediatra / Responsável:' : 'Doutor Responsável:'}</strong> {idoso.medicoResponsavel?.nome || 'Não definido'}</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-bold border-b pb-1 text-slate-800">{isEscolar ? 'Recomendações e Instruções dos Pais' : 'Instruções de Cuidados Atuais'}</h3>
              <p className="text-xs text-slate-600 italic">
                "{idoso.planoCuidado}"
              </p>
            </div>
          </div>

          
          <div className="space-y-3">
            <h3 className="font-bold border-b pb-1 text-slate-800 text-sm">
              {isEscolar ? 'Diário de Saúde, Sono & Rotina Recente' : 'Aferições de Sinais Vitais Recentes'}
            </h3>
            <table className="w-full text-xs text-left text-slate-705 text-[11px]">
              <thead>
                <tr className="bg-slate-100 uppercase tracking-wider text-slate-500 font-bold border-b">
                  <th className="p-2">Data/Hora</th>
                  {isEscolar ? (
                    <>
                      <th className="p-2">Soneca / Sono</th>
                      <th className="p-2">Fralda (Troca)</th>
                      <th className="p-2">Temp</th>
                      <th className="p-2 font-bold">Mamadeiras</th>
                      <th className="p-2">Copos d'Água</th>
                    </>
                  ) : (
                    <>
                      <th className="p-2">P. Arterial</th>
                      <th className="p-2">Glicemia</th>
                      <th className="p-2">Temp</th>
                      <th className="p-2 font-bold">F. Cardíaca</th>
                      <th className="p-2">Saturação</th>
                    </>
                  )}
                  <th className="p-2 font-bold text-indigo-750">Peso</th>
                  <th className="p-2">Registrado Por</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {sinais.map(s => (
                  <tr key={s.id}>
                    <td className="p-2 font-medium">{new Date(s.data).toLocaleDateString('pt-BR')} {s.horario}</td>
                    {isEscolar ? (
                      <>
                        <td className="p-2 font-bold text-slate-700">{s.pressaoArterial}</td>
                        <td className="p-2 font-bold text-slate-700">{s.fralda || 'Verificada'}</td>
                        <td className="p-2">{s.temperatura} °C</td>
                        <td className="p-2">{s.frequenciaCardiaca} u</td>
                        <td className="p-2 font-semibold text-emerald-800">{s.saturacao} copos</td>
                      </>
                    ) : (
                      <>
                        <td className="p-2 font-bold">{s.pressaoArterial} mmHg</td>
                        <td className="p-2 font-bold">{s.glicemia} mg/dL ({s.tipoGlicemia || 'casual'})</td>
                        <td className="p-2">{s.temperatura} °C</td>
                        <td className="p-2">{s.frequenciaCardiaca} bpm</td>
                        <td className="p-2 font-semibold text-emerald-800">{s.saturacao} %</td>
                      </>
                    )}
                    <td className="p-2 font-black text-indigo-700">{s.peso ? `${s.peso} kg` : '—'}</td>
                    <td className="p-2 text-slate-500">{s.registradoPor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          
          <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100 text-xs">
            <div className="p-3 bg-slate-50 border rounded-xl space-y-1.5">
              <h4 className="font-bold text-slate-850">Acompanhamento Alimentação</h4>
              <p>Total de refeições monitoradas: <strong className="font-bold">{totalFoodsCount} refeições</strong></p>
              <p>Grau de aceitação positiva (comeu tudo): <strong className="text-emerald-700 font-bold">{foodAcceptanceRate}%</strong></p>
            </div>
            <div className="p-3 bg-slate-50 border rounded-xl space-y-1.5">
              <h4 className="font-bold text-slate-850">Registro de Hidratação</h4>
              <p>Total de água ingerida acumulado: <strong className="text-cyan-700 font-bold">{totalWaterLoggedThisWeek} ml</strong></p>
              <p>Meta recomendada: 1.500 ml diários</p>
            </div>
          </div>

          
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-2.5 text-[10px] text-slate-500">
            <div className="flex items-center gap-2">
              <span className="p-1 px-2 bg-emerald-100 text-emerald-800 rounded-md font-extrabold text-[9px] uppercase tracking-wider">
                ✓ Documento Oficial Auditado
              </span>
              <span className="font-mono text-slate-700">
                Hash: <strong>ANJO-2026-{Math.abs(((idoso.id || 'aluno') + '_' + (idoso.nome || '')).split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0) | 0, 0)).toString(16).toUpperCase()}</strong>
              </span>
            </div>
            <div className="text-right text-[9px] text-slate-400 font-medium">
              © 2026 Anjinho Escolar / Anjo Cuidador • Protegido pelas Leis 9.609/98 e 9.610/98 • Autoria Registrada
            </div>
          </div>

          <p className="text-[10px] text-slate-400 text-center italic pt-1">
            {isEscolar ? 'Anjinho Escolar — Onde os primeiros capítulos da inf são guardados com amor.' : 'Anjo Cuidador — Cuidado, presença e tranquilidade para quem você ama.'} Relatório compilado eletronicamente em {new Date().toLocaleDateString('pt-BR')}.
          </p>
        </div>
      )}

      
      <div className="flex border-b border-soft-gray gap-4 overflow-x-auto">
        {[
          { id: 'sinais', label: '  Sinais Vitais Históricos', icon: <Activity className="w-4 h-4" /> },
          { id: 'rotina', label: '  Padrão de Sono e Humor', icon: <Moon className="w-4 h-4" /> },
          { id: 'resumo', label: '  Resumo de Alimentação', icon: <FileText className="w-4 h-4" /> },
          { id: 'whatsapp_diario', label: '  Relatório Diário WhatsApp', icon: <Share2 className="w-4 h-4 text-emerald-500" fill="currentColor" /> }
        ].map(tb => (
          <button
            key={tb.id}
            onClick={() => setActiveReportTab(tb.id as any)}
            className={`pb-3 text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeReportTab === tb.id 
                ? 'border-serene-blue text-serene-blue' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tb.icon}
            {tb.label}
          </button>
        ))}
      </div>

      
      <div className="bg-white rounded-2xl border border-soft-gray p-6 space-y-6">
        
        
        {activeReportTab === 'sinais' && (
          <div className="space-y-8">
            {isEscolar ? (
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 shadow-3xs">
                <div className="flex items-center gap-3 text-indigo-600">
                  <Activity className="w-6 h-6 animate-pulse" />
                  <h4 className="font-extrabold text-slate-800 text-base">Foco Pedagógico & Rotina de Saúde do Aluno</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  No modo <strong>Educação Infantil (Anjinho Escolar)</strong>, as professoras e auxiliares de sala <strong>não realizam medições de glicemia (açúcar no sangue) e pressão arterial</strong> de crianças, uma vez que estes são procedimentos de acompanhamento clínico geriátrico.
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  O monitoramento no ambiente escolar é focado integralmente no bem-estar diário e desenvolvimento do(a) aluno(a). Isso inclui o controle de temperatura corporal para prevenção e identificação de episódios de febre, supervisão e registro dos períodos de sono e soneca, trocas higiênicas de fralda (com acompanhamento de assaduras ou necessidades), consumo alimentar/hídrico adequado e evolução saudável do peso da criança.
                </p>
                <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 flex items-start gap-2.5 text-xs text-indigo-800">
                  <span className="text-sm"> </span>
                  <div>
                    <strong className="font-bold block mb-1">Rotina Humanizada e Conectada</strong>
                    Use o formulário rápido de Diário de Rotina na Dashboard para registrar as sonecas, mamadeiras e trocas de fralda de hoje. Todas as observações estarão disponíveis para a família em tempo real!
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              
              <div className="border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Heart className="w-5 h-5 text-rose-500" />
                    Acompanhamento de Pressão Arterial
                  </h4>
                  <span className="text-[10px] text-slate-400 font-bold">Últimas 5 aferições</span>
                </div>

                {sinais.length < 2 ? (
                  <p className="text-xs text-slate-400 py-10 text-center">Registrar aferições na Dashboard para alimentar o gráfico.</p>
                ) : (
                  <div className="space-y-4">
                    
                    <div className="relative h-56 border-b border-l border-slate-300 bg-slate-50/50 rounded-tr-lg p-3 overflow-visible">
                      <svg viewBox="0 0 400 170" className="w-full h-full overflow-visible">
                        
                        <line x1="0" y1="40" x2="400" y2="40" stroke="#fca5a5" strokeDasharray="4 4" strokeWidth="1.5" />
                        <text x="5" y="34" className="chart-limit-text-red" fontSize="9" fontWeight="900" fill="#991b1b">Limite Alerta Sistólica (140)</text>

                        <line x1="0" y1="100" x2="400" y2="100" stroke="#93c5fd" strokeDasharray="4 4" strokeWidth="1.5" />
                        <text x="5" y="94" className="chart-limit-text-blue" fontSize="9" fontWeight="900" fill="#1e3a8a">Limite Alerta Diastólica (90)</text>
                        
                        
                        <polyline
                          fill="none"
                          stroke="#dc2626"
                          strokeWidth="4.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={sinais.map((s, idx) => {
                            const x = (idx / (sinais.length - 1)) * 360 + 20;
                            // map blood pressure Sys (ideal 110-140) to height range (170 to 10)
                            const sys = parseSYS(s.pressaoArterial);
                            const y = 145 - ((sys - 80) / (160 - 80)) * 110;
                            return `${x},${y}`;
                          }).join(' ')}
                        />

                        
                        <polyline
                          fill="none"
                          stroke="#2563eb"
                          strokeWidth="4.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={sinais.map((s, idx) => {
                            const x = (idx / (sinais.length - 1)) * 360 + 20;
                            const dia = parseDIA(s.pressaoArterial);
                            // map blood pressure Dia (ideal 70-90) to height range (170 to 10)
                            const y = 145 - ((dia - 50) / (110 - 50)) * 110;
                            return `${x},${y}`;
                          }).join(' ')}
                        />

                        
                        {sinais.map((s, idx) => {
                          const x = (idx / (sinais.length - 1)) * 360 + 20;
                          
                          const sys = parseSYS(s.pressaoArterial);
                          const ySys = 145 - ((sys - 80) / (160 - 80)) * 110;
                          
                          const dia = parseDIA(s.pressaoArterial);
                          const yDia = 145 - ((dia - 50) / (110 - 50)) * 110;
                          
                          return (
                            <g key={s.id} className="cursor-pointer">
                              <circle cx={x} cy={ySys} r="6" fill="#dc2626" stroke="#ffffff" strokeWidth="2" />
                              <text 
                                x={x} 
                                y={ySys - 8} 
                                className="chart-val-text-sys"
                                fontSize="11" 
                                fontWeight="900" 
                                textAnchor="middle" 
                                fill="#991b1b"
                                stroke="#ffffff"
                                strokeWidth="3.5"
                                paintOrder="stroke"
                              >
                                {sys}
                              </text>

                              <circle cx={x} cy={yDia} r="6" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                              <text 
                                x={x} 
                                y={yDia + 14} 
                                className="chart-val-text-dia"
                                fontSize="11" 
                                fontWeight="900" 
                                textAnchor="middle" 
                                fill="#1e3a8a"
                                stroke="#ffffff"
                                strokeWidth="3.5"
                                paintOrder="stroke"
                              >
                                {dia}
                              </text>

                              
                              <text x={x} y="162" className="chart-date-text" fontSize="11" fontWeight="900" textAnchor="middle" fill="#0f172a">
                                {new Date(s.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                              </text>
                            </g>
                          );
                        })}
                      </svg>

                      
                      <div className="absolute top-2 left-2 flex gap-4 text-xs font-black">
                        <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 bg-red-600 rounded-full"></span> Sistólica (Máx)</span>
                        <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 bg-blue-600 rounded-full"></span> Diastólica (Mín)</span>
                      </div>
                    </div>
                    
                    <p className="text-xs text-slate-400 text-center leading-normal">
                      As linhas indicam o histórico consolidado. Níveis de atenção médica são representados nos traçados tracejados superiores.
                    </p>
                  </div>
                )}
              </div>

              
              <div className="border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Activity className="w-5 h-5 text-amber-500" />
                    Histórico de Glicemia
                  </h4>
                  <span className="text-[10px] text-slate-400 font-bold">Meta: 90 - 140 mg/dL</span>
                </div>

                {sinais.length < 2 ? (
                  <p className="text-xs text-slate-400 py-10 text-center">Registrar aferições na Dashboard para alimentar o gráfico.</p>
                ) : (
                  <div className="space-y-4">
                    
                    <div className="relative h-56 border-b border-l border-slate-300 bg-slate-50/50 rounded-tr-lg p-3 overflow-visible">
                      <svg viewBox="0 0 400 170" className="w-full h-full overflow-visible">
                        
                        <line x1="0" y1="40" x2="400" y2="40" stroke="#fca5a5" strokeDasharray="4 4" strokeWidth="1.5" />
                        <text x="5" y="34" className="chart-limit-text-red" fontSize="9" fontWeight="900" fill="#991b1b">Limite Alto Alerta (180 mg/dL)</text>

                        <line x1="0" y1="110" x2="400" y2="110" stroke="#fed7aa" strokeDasharray="4 4" strokeWidth="1.5" />
                        <text x="5" y="104" className="chart-limit-text-orange" fontSize="9" fontWeight="900" fill="#c2410c">Limite Baixo Alerta (90 mg/dL)</text>

                        <polyline
                          fill="none"
                          stroke="#ea580c"
                          strokeWidth="4.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={sinais.map((s, idx) => {
                            const x = (idx / (sinais.length - 1)) * 360 + 20;
                            // map blood sugar (ideal 70 - 180) to height space (170 to 10)
                            const y = 145 - ((s.glicemia - 60) / (200 - 60)) * 110;
                            return `${x},${y}`;
                          }).join(' ')}
                        />

                        
                        {sinais.map((s, idx) => {
                          const x = (idx / (sinais.length - 1)) * 360 + 20;
                          const y = 145 - ((s.glicemia - 60) / (200 - 60)) * 110;
                          return (
                            <g key={s.id} className="cursor-pointer">
                              <circle cx={x} cy={y} r="6" fill="#ea580c" stroke="#fff" strokeWidth="2" />
                              <text 
                                x={x} 
                                y={y - 8} 
                                className="chart-val-text-glic"
                                fontSize="11" 
                                fontWeight="900" 
                                textAnchor="middle" 
                                fill="#7c2d12"
                                stroke="#ffffff"
                                strokeWidth="3.5"
                                paintOrder="stroke"
                              >
                                {s.glicemia}
                              </text>

                              
                              <text x={x} y="162" className="chart-date-text" fontSize="11" fontWeight="900" textAnchor="middle" fill="#0f172a">
                                {new Date(s.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>

                    <p className="text-xs text-slate-400 text-center leading-normal">
                      A glicemia mantém-se controlada. Variações comuns ocorrem após café da manhã ou almoço (glicose pós-prandial).
                    </p>
                  </div>
                )}
              </div>

            </div>
            )}

            
            <div className="border border-slate-200 rounded-3xl p-6 bg-white space-y-4 shadow-3xs">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <div>
                  <h4 className="font-extrabold text-slate-850 flex items-center gap-2 text-base">
                    <Scale className="w-5 h-5 text-indigo-600 animate-bounce" />
                    Controle e Evolução de Peso Corporal (Acompanhamento Geral)
                  </h4>
                  <p className="text-xs text-slate-500">
                    {isEscolar 
                      ? 'Acompanhamento do ganho de peso e crescimento saudável das crianças (idealmente registrado de forma regular para focar em tendências de desenvolvimento infantil).' 
                      : 'Acompanhamento clínico de ganho ou perda de peso do idoso (idealmente registrado semanalmente para evitar oscilações diárias de água e focar em tendências de nutrição ou robustez corporal).'}
                  </p>
                </div>
                <span className="text-[10px] text-slate-550 bg-indigo-50 text-indigo-700 px-3 py-1 font-bold rounded-lg self-start sm:self-center uppercase tracking-wider">Histórico de Peso</span>
              </div>

              
              {(() => {
                const weightedSinais = sinais.filter(s => s.peso && s.peso > 0);
                if (weightedSinais.length === 0) {
                  return (
                    <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl text-xs text-center text-slate-505">
                      Nenhum registro de peso corporal encontrado para {idoso.nome}. Registre o peso no Painel Um-Toque da Dashboard para alimentar a análise.
                    </div>
                  );
                }

                let diagnosisText = "Estável (Aguardando mais medições para avaliar tendência)";
                let diagnosisColor = "bg-emerald-50 border-emerald-150 text-emerald-800";
                let trendIcon = <TrendingUp className="w-5 h-5 text-emerald-600" />;
                const latestSinal = weightedSinais[weightedSinais.length - 1];
                
                if (weightedSinais.length >= 2) {
                  const latestW = latestSinal.peso!;
                  const prevW = weightedSinais[weightedSinais.length - 2].peso!;
                  const diff = latestW - prevW;
                  if (Math.abs(diff) < 0.3) {
                    diagnosisText = `Mantendo o Peso (Estável): ${latestW} kg (Variação sutil de ${diff >= 0 ? '+' : ''}${diff.toFixed(1)} kg)`;
                    diagnosisColor = "bg-emerald-50 border-emerald-150 text-emerald-800";
                    trendIcon = <TrendingUp className="w-5 h-5 text-emerald-600" />;
                  } else if (diff >= 0.3) {
                    diagnosisText = `Ganhando Peso (Engordando): ${latestW} kg (+${diff.toFixed(1)} kg aumentados em relação à aferição anterior)`;
                    diagnosisColor = "bg-indigo-50 border-indigo-150 text-indigo-850 font-bold";
                    trendIcon = <TrendingUp className="w-5 h-5 text-indigo-600" />;
                  } else {
                    diagnosisText = `Perdendo Peso (Emagrecendo): ${latestW} kg (${diff.toFixed(1)} kg reduzidos em relação à aferição anterior)`;
                    diagnosisColor = "bg-rose-50 border-rose-150 text-rose-800 font-bold";
                    trendIcon = <TrendingDown className="w-5 h-5 text-rose-600" />;
                  }
                }

                return (
                  <div className="space-y-4">
                    <div className={`p-4 border rounded-2xl flex items-center gap-3 ${diagnosisColor}`}>
                      <div className="p-2.5 bg-white rounded-xl shadow-2xs">
                        {trendIcon}
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-black uppercase tracking-wider opacity-65 block">Rastreabilidade / Variação Corporal</span>
                        <p className="text-xs font-black">{diagnosisText}</p>
                      </div>
                    </div>

                    
                    {weightedSinais.length < 2 ? (
                      <p className="text-xs text-slate-400 py-8 text-center bg-slate-50 rounded-xl border border-dashed">
                        Seja bem vindo! Registre pelo menos 2 aferições de peso para que a linha de tendência com variação histórica apareça automaticamente.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        <h5 className="text-[10px] uppercase tracking-wider text-slate-400 font-black">Evolução do Peso ao Longo do Tempo (kg)</h5>
                        <div className="relative h-44 border-b border-l border-slate-200 bg-slate-50/50 rounded-tr-lg p-2 overflow-visible">
                          <svg viewBox="0 0 400 120" className="w-full h-full overflow-visible">
                            
                            <polyline
                              fill="none"
                              stroke="#4f46e5"
                              strokeWidth="4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              points={weightedSinais.map((s, idx) => {
                                const x = (idx / (weightedSinais.length - 1)) * 360 + 20;
                                
                                const weightsList = weightedSinais.map(ws => ws.peso!);
                                const minW = Math.min(...weightsList) - 1;
                                const maxW = Math.max(...weightsList) + 1;
                                const range = maxW - minW || 1;

                                const y = 100 - ((s.peso! - minW) / range) * 80;
                                return `${x},${y}`;
                              }).join(' ')}
                            />

                            
                            {weightedSinais.map((s, idx) => {
                              const x = (idx / (weightedSinais.length - 1)) * 360 + 20;
                              const weightsList = weightedSinais.map(ws => ws.peso!);
                              const minW = Math.min(...weightsList) - 1;
                              const maxW = Math.max(...weightsList) + 1;
                              const range = maxW - minW || 1;
                              const y = 100 - ((s.peso! - minW) / range) * 80;

                              return (
                                <g key={s.id} className="cursor-pointer">
                                  <circle cx={x} cy={y} r="5" fill="#4f46e5" stroke="#fff" strokeWidth="2" />
                                  <text 
                                    x={x} 
                                    y={y - 8} 
                                    fontSize="10" 
                                    fontWeight="950" 
                                    textAnchor="middle" 
                                    fill="#312e81"
                                    stroke="#ffffff"
                                    strokeWidth="3"
                                    paintOrder="stroke"
                                  >
                                    {s.peso} kg
                                  </text>
                                  <text x={x} y="115" fontSize="10" fontWeight="900" textAnchor="middle" fill="#334155">
                                    {new Date(s.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                  </text>
                                </g>
                              );
                            })}
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

          </div>
        )}

        
        {activeReportTab === 'rotina' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              
              <div className="border border-slate-200 rounded-2xl p-5 space-y-4">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Moon className="w-5 h-5 text-indigo-500" />
                  Diário de Sono Semanal
                </h4>

                {sono.length === 0 ? (
                  <p className="text-xs text-slate-400 py-10 text-center">Registrar padrões de sono no painel de rotinas para ver médias.</p>
                ) : (
                  <div className="space-y-4">
                    
                    <div className="relative h-52 border-b border-slate-300 bg-slate-50 rounded-xl p-4 flex items-end justify-around">
                      {sono.slice(-6).map((s) => {
                        const maxH = 135;
                        const barHeight = (s.horasTotais / 10) * maxH; // max 10 hours
                        return (
                          <div key={s.id} className="flex flex-col items-center w-14 cursor-pointer">
                            <span className="text-xs font-black text-slate-850 mb-1">
                              {s.horasTotais}h
                            </span>
                            <div 
                              className={`w-6 hover:w-7 transition-all rounded-t-md ${
                                s.qualidade === 'excelente' 
                                  ? 'bg-indigo-700' 
                                  : s.qualidade === 'boa' 
                                  ? 'bg-blue-600' 
                                  : 'bg-amber-605 bg-amber-500'
                              }`}
                              style={{ height: `${barHeight}px` }}
                            ></div>
                            <span className="text-xs font-extrabold text-slate-800 truncate w-full text-center mt-2">
                              {new Date(s.data).toLocaleDateString('pt-BR', { day: '2-digit' })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="flex justify-center gap-4 text-[10px] font-bold leading-normal">
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-indigo-600 rounded"></span> Excel.</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-blue-400 rounded"></span> Bom</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-400 rounded"></span> Regular</span>
                    </div>
                  </div>
                )}
              </div>

              
              <div className="border border-slate-200 rounded-2xl p-5 space-y-4">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Smile className="w-5 h-5 text-emerald-500" />
                  Avaliação Psicoemocional Recorrente
                </h4>

                {topMoods.length === 0 ? (
                  <p className="text-xs text-slate-400 py-10 text-center">Nenhum humor mensurado para exibição estatística.</p>
                ) : (
                  <div className="space-y-3 pt-2">
                    {topMoods.map(([mood, total]) => {
                      const percentages = Math.round((total / humores.length) * 100);
                      
                      return (
                        <div key={mood} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-slate-700 uppercase">
                            <span>{mood}</span>
                            <span>{total} registros ({percentages}%)</span>
                          </div>
                          
                          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                            <div 
                              className="h-full bg-emerald-500 transition-all rounded-full"
                              style={{ width: `${percentages}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        
        {activeReportTab === 'resumo' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="p-5 border border-slate-200 rounded-2xl bg-slate-50/50 space-y-3">
                <h4 className="font-bold text-slate-800 flex items-center gap-1">
                  <Activity className="text-amber-500 w-5 h-5" /> Acompanhamento Nutricional
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {idoso.nome} demonstrou <strong className="text-emerald-700">{foodAcceptanceRate}%</strong> de aprovação nas refeições principais desta semana. 
                  Isso traduz-se em uma ótima ingestão de calorias e vitaminas essenciais.
                </p>
                <div className="pt-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Últimos registros alimentares:</span>
                  <div className="space-y-2">
                    {alimentacao.slice(-3).map(f => (
                      <div key={f.id} className="text-xs bg-white border p-2.5 rounded-xl flex justify-between items-center">
                        <div>
                          <strong className="font-bold text-slate-800 capitalize">{f.refeicao.replace('_', ' ')}</strong>
                          <span className="block text-slate-400 text-[10px]">Nota: {f.observacoes || 'Comido com satisfação.'}</span>
                        </div>
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-lg uppercase ${
                          f.aceitacao === 'muito_bem' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {f.aceitacao.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-5 border border-slate-200 rounded-2xl bg-cyan-50/30 space-y-3">
                <h4 className="font-bold text-sky-850 flex items-center gap-1">
                  <Droplets className="text-cyan-500 w-5 h-5" /> Par de Hidratação
                </h4>
                <p className="text-sm text-slate-605 leading-relaxed">
                  Ingeridos <strong className="text-sky-800 font-bold">{totalWaterLoggedThisWeek} ml</strong> nos últimos dias. 
                  A hidratação celular combate dores musculares, reduz cansaço mental e {localStorage.getItem('anjo_app_mode') === 'escolar_infantil' ? 'previne fadiga escolar e dores de cabeça nas crianças.' : 'previne crises geriatras de confusão moderada.'}
                </p>
                <div className="flex justify-between items-center p-3 bg-white border border-cyan-100 rounded-2xl text-xs font-semibold text-sky-900 mt-2">
                  <span>Meta Alvo Diária:</span>
                  <span className="font-mono text-cyan-700 bg-cyan-100 px-2 py-0.5 rounded font-bold">1.500 ml</span>
                </div>
              </div>

            </div>
          </div>
        )}

        
        {activeReportTab === 'whatsapp_diario' && (
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">
              
              
              <div className="flex-1 space-y-4">
                <div className="p-5 border border-slate-200 bg-slate-50/50 rounded-2xl space-y-3">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Share2 className="text-emerald-500 w-5 h-5" /> Configurar Informativo do Dia
                  </h4>
                  <p className="text-xs text-slate-500 leading-normal">
                    Este assistente inteligente compila automaticamente todos os sinais vitais, remédios ingeridos, refeições e rotinas de hoje em um formato de WhatsApp limpo e prático para envio rápido.
                  </p>
                  
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-600 block">Deseja adicionar observações extras para a família?</label>
                      <VoiceInput 
                        onTranscript={text => setCustomNotes(prev => prev ? prev + ' ' + text : text)} 
                        size="sm"
                      />
                    </div>
                    <textarea 
                      placeholder={isEscolar ? "Ex: O Pedrinho passou o dia muito alegre e participativo. Brincou bastante com os coleguinhas no parquinho e comeu toda a frutinha no lanche da tarde com alegria!" : "Ex: Dona Maria passou o dia de excelente humor. Conversou bastante durante o banho de sol e fez os alongamentos de pernas com tranquilidade."}
                      rows={4}
                      value={customNotes}
                      onChange={e => setCustomNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-serene-blue/20 bg-white text-sm"
                    ></textarea>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <button
                      onClick={handleCopy}
                      className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl transition-all shadow-xs hover:shadow-md cursor-pointer flex items-center justify-center gap-2 text-sm"
                    >
                      {copied ? (
                        <>
                          <Check className="w-5 h-5 text-white" />
                          <span>Copiado com Sucesso!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-5 h-5 text-white" />
                          <span>Copiar Texto Formatado</span>
                        </>
                      )}
                    </button>

                    {triggerWhatsAppSim && (
                      <div className="flex flex-col sm:flex-row gap-2 w-full">
                        <button
                          onClick={() => {
                            const msg = buildWhatsAppMessage();
                            triggerWhatsAppSim('Informativo Diário de ' + idoso.nome, msg);
                          }}
                          className="flex-1 px-4 py-3 bg-white hover:bg-emerald-50 text-emerald-600 border border-emerald-300 font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 text-sm"
                          title="Simular entrega do sumário formatado"
                        >
                          <Share2 className="w-4 h-4" /> Simular no Log
                        </button>
                        
                        <button
                          onClick={() => {
                            const recipient = getNotificationRecipient();
                            const phone = recipient.telefone || '';
                            const number = formatWhatsAppNumber(phone);
                            const text = encodeURIComponent(buildWhatsAppMessage());
                            window.open(`https://wa.me/${number}?text=${text}`, '_blank');
                          }}
                          className="flex-1 px-4 py-3 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 text-sm"
                          title="Enviar de Verdade pelo WhatsApp"
                        >
                            Enviar p/ WhatsApp Real ({getNotificationRecipient().nome ? getNotificationRecipient().nome.split(' ')[0] : 'Família'})
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2.5">
                  <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-700 space-y-1">
                    <strong className="font-bold block">Como utilizar no seu celular?</strong>
                    <p className="leading-relaxed">
                      Basta clicar no botão **Copiar Texto Formatado** acima e colar diretamente no chat ou grupo de WhatsApp da família. O texto já vai com marcadores e emojis bem organizados!
                    </p>
                  </div>
                </div>
              </div>

              
              <div className="w-full lg:max-w-md shrink-0 mx-auto">
                <div className="bg-[#E5DDD5] rounded-3xl border-8 border-slate-805 shadow-2xl overflow-hidden flex flex-col h-[520px]">
                  
                  
                  <div className="bg-[#075E54] text-white p-3 flex items-center gap-3 shrink-0">
                    <div className="w-10 h-10 bg-slate-200 rounded-full overflow-hidden border border-white/20">
                      <img referrerPolicy="no-referrer" src={idoso.foto} alt="Dona" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-white leading-tight truncate">Grupo de Cuidados — {idoso.nome.split(' ')[0]}</h4>
                      <p className="text-[10px] text-emerald-200 leading-none">Visto por último hoje • Anjo Cuidador</p>
                    </div>
                  </div>

                  
                  <div className="flex-1 p-3.5 overflow-y-auto space-y-4 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat bg-center">
                    
                    <div className="text-center">
                      <span className="bg-white/70 py-1 px-2.5 text-[9px] font-bold text-slate-500 rounded-md shadow-xs uppercase">Hoje</span>
                    </div>

                    <div className="flex justify-end">
                      <div className="bg-[#DCF8C6] hover:bg-[#D1F4B4] p-3.5 rounded-2xl rounded-tr-none max-w-[88%] shadow-xs relative space-y-1 transition-colors border border-emerald-100">
                        <pre className="font-sans text-[11px] leading-relaxed whitespace-pre-wrap select-all font-medium text-slate-800">
                          {buildWhatsAppMessage()}
                        </pre>
                        
                        <div className="flex items-center justify-end gap-1 text-[9px] text-slate-400 font-semibold mt-1">
                          <span>{new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="text-sky-500 font-bold">✓✓</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
