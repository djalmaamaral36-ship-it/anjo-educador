import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, Clock, Play, BookOpen, Smile, Award, Flame, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { StudentPaxData } from '../../types';

interface Props {
  onConcluirAtividadePedagogica?: (titulo: string, tipo: string, escopo: 'coletiva' | 'individual') => void;
  studentNome?: string;
  student?: StudentPaxData;
  onUpdateStudent?: (updated: Partial<StudentPaxData>) => void;
  userRole?: string;
}

export interface AtividadeItem {
  id: string;
  horario: string;
  titulo: string;
  subtitulo: string;
  icone: string;
  campoBncc: string;
  status: 'Pendente' | 'Em Andamento' | 'Realizado';
  descricao: string;
  objetivoPedagogico: string;
  materiaisNecessarios: string[];
  duracaoSugerida: string;
  metodologiaLivre?: string;
  tags?: string[];
  fotosRegistradas?: string[];
  observacaoEducador?: string;
}

export const ATIVIDADES_PLANEJADAS_PADRAO: AtividadeItem[] = [
  {
    id: 'atv_acolhida',
    horario: '07:30 - 08:30',
    titulo: 'Acolhida Afetiva & Roda de Canções',
    subtitulo: 'Transição suave de chegada com afeto e escuta',
    icone: '🌅',
    campoBncc: 'O eu, o outro e o nós (EI01EO01)',
    status: 'Pendente',
    descricao: 'Recepção carinhosa de cada criança, acolhimento aos pais e roda matinal de cantigas de bom dia com instrumentos suaves.',
    objetivoPedagogico: 'Fortalecer os vínculos de apego seguro e pertencimento à comunidade escolar.',
    materiaisNecessarios: ['Chocalhos suaves', 'Tapete sensorial', 'Livro de boas-vindas'],
    duracaoSugerida: '60 min',
    metodologiaLivre: 'Árvore da Infância® - Raízes Afetivas'
  },
  {
    id: 'atv_frutinha',
    horario: '08:30 - 09:00',
    titulo: 'Momento da Frutinha & Educação Alimentar',
    subtitulo: 'Exploração de cores, texturas e autonomia',
    icone: '🍎',
    campoBncc: 'Corpo, gestos e movimentos (EI01CG04)',
    status: 'Pendente',
    descricao: 'Oferta de frutas frescas da estação cortadas de forma segura para exploração tátil e gustativa.',
    objetivoPedagogico: 'Estimular a coordenação motora fina e a curiosidade sensorial alimentar.',
    materiaisNecessarios: ['Frutas da estação', 'Babadores confortáveis', 'Copinhos de transição'],
    duracaoSugerida: '30 min'
  },
  {
    id: 'atv_sensorial',
    horario: '09:00 - 10:15',
    titulo: 'Oficina Sensorial: Tintas Naturais & Texturas',
    subtitulo: 'Livre expressão plástica e coordenação',
    icone: '🎨',
    campoBncc: 'Traços, sons, cores e formas (EI01TS02)',
    status: 'Pendente',
    descricao: 'Pintura livre em papel pardo com tintas naturais comestíveis (beterraba, espinafre e cúrcuma).',
    objetivoPedagogico: 'Desenvolver a percepção visual e tátil através da liberdade expressiva.',
    materiaisNecessarios: ['Papel pardo gigante', 'Tintas naturais', 'Pincéis de esponja'],
    duracaoSugerida: '75 min'
  },
  {
    id: 'atv_parque',
    horario: '10:15 - 11:00',
    titulo: 'Circuito Psicomotor no Bosque / Parque',
    subtitulo: 'Movimento ao ar livre e exploração motora',
    icone: '🌳',
    campoBncc: 'Corpo, gestos e movimentos (EI01CG02)',
    status: 'Pendente',
    descricao: 'Desafios motores leves com obstáculos de espuma, túnel de tecido e contato com a grama.',
    objetivoPedagogico: 'Aprimorar o equilíbrio, engatinhar e primeiros passos em terreno seguro.',
    materiaisNecessarios: ['Módulos de espuma', 'Túnel lúdico', 'Bolas macias'],
    duracaoSugerida: '45 min'
  },
  {
    id: 'atv_higiene_almoco',
    horario: '11:00 - 12:15',
    titulo: 'Higiene & Almocinho Nutritivo',
    subtitulo: 'Lavagem das mãozinhas e refeição quente',
    icone: '🍲',
    campoBncc: 'O eu, o outro e o nós (EI01EO03)',
    status: 'Pendente',
    descricao: 'Momento de calma para lavagem das mãozinhas com sabão suave, seguido do almocinho nutritivo com acompanhamento individualizado.',
    objetivoPedagogico: 'Construir hábitos diários de higiene e autocuidado com prazer.',
    materiaisNecessarios: ['Toalhinhas individuais', 'Cadeirões ergonômicos', 'Cardápio nutricional'],
    duracaoSugerida: '75 min'
  },
  {
    id: 'atv_soneca',
    horario: '12:30 - 14:30',
    titulo: 'Soneca Restauradora & Relaxamento Musical',
    subtitulo: 'Ambiente aconchegante com ruído branco e massagem',
    icone: '💤',
    campoBncc: 'Corpo, gestos e movimentos (EI01CG01)',
    status: 'Pendente',
    descricao: 'Quarto na penumbra com música instrumental suave, massagem relaxante e descanso individual de até 2 horas.',
    objetivoPedagogico: 'Garantir a restauração biológica e o processamento cognitivo das vivências da manhã.',
    materiaisNecessarios: ['Colchonetes higienizados', 'Naninhas pessoais', 'Caixa de som com sons da natureza'],
    duracaoSugerida: '120 min'
  },
  {
    id: 'atv_historia',
    horario: '14:45 - 15:30',
    titulo: 'Contação de Histórias & Fantoches Afetivos',
    subtitulo: 'Linguagem oral, fantoches e escuta atenta',
    icone: '📖',
    campoBncc: 'Escuta, fala, pensamento e imaginação (EI01EF01)',
    status: 'Pendente',
    descricao: 'Teatrinho de fantoches de animais da floresta, explorando diferentes timbres de voz e interação lúdica com as crianças.',
    objetivoPedagogico: 'Expandir o repertório auditivo e estimular as primeiras vocalizações e palavras.',
    materiaisNecessarios: ['Fantoches de feltro', 'Livros cartonados', 'Tapete temático'],
    duracaoSugerida: '45 min'
  },
  {
    id: 'atv_despedida',
    horario: '16:00 - 17:00',
    titulo: 'Roda de Despedida & Transição Familiar',
    subtitulo: 'Organização das mochilinhas e entrega amorosa',
    icone: '🧸',
    campoBncc: 'O eu, o outro e o nós (EI01EO04)',
    status: 'Pendente',
    descricao: 'Fechamento do dia com canções calmas de despedida e entrega de cada criança com relatório verbal afetivo aos responsáveis.',
    objetivoPedagogico: 'Proporcionar segurança emocional e previsibilidade no retorno ao lar.',
    materiaisNecessarios: ['Mochilinhas organizadas', 'Diário do dia preenchido'],
    duracaoSugerida: '60 min'
  }
];

export default function AuraPlannerIntegration({
  onConcluirAtividadePedagogica,
  studentNome = 'Mariana Souza',
  student,
  onUpdateStudent,
  userRole = 'professor'
}: Props) {
  const storageKey = `anjinho_activities_state_${student?.id || 'main'}`;

  const [atividades, setAtividades] = useState<AtividadeItem[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    return ATIVIDADES_PLANEJADAS_PADRAO;
  });

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<'todas' | 'pendentes' | 'realizadas'>('todas');
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setAtividades(JSON.parse(saved));
      } else {
        setAtividades(ATIVIDADES_PLANEJADAS_PADRAO);
      }
    } catch (e) {
      console.error(e);
    }
  }, [student?.id, storageKey]);

  const handleStatusChange = (id: string, novoStatus: 'Pendente' | 'Em Andamento' | 'Realizado') => {
    const updated = atividades.map((atv) => {
      if (atv.id === id) {
        return { ...atv, status: novoStatus };
      }
      return atv;
    });

    setAtividades(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }

    const itemModificado = atividades.find((a) => a.id === id);
    if (novoStatus === 'Realizado' && itemModificado) {
      if (onConcluirAtividadePedagogica) {
        onConcluirAtividadePedagogica(itemModificado.titulo, itemModificado.campoBncc, 'coletiva');
      }
      setFeedbackToast(`✨ "${itemModificado.titulo}" concluída e registrada no diário!`);
      setTimeout(() => setFeedbackToast(null), 3500);
    }
  };

  const concluidasCount = atividades.filter((a) => a.status === 'Realizado').length;
  const totalCount = atividades.length;
  const progressoPercent = Math.round((concluidasCount / totalCount) * 100);

  const atividadesFiltradas = atividades.filter((atv) => {
    if (filtroStatus === 'pendentes') return atv.status !== 'Realizado';
    if (filtroStatus === 'realizadas') return atv.status === 'Realizado';
    return true;
  });

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
      {/* Toast Feedback */}
      {feedbackToast && (
        <div className="p-3 bg-emerald-600 text-white font-bold text-xs rounded-2xl shadow-lg flex items-center gap-2 animate-in fade-in">
          <Sparkles size={16} />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Header do Planner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-2xl shrink-0 text-indigo-600 shadow-inner">
            📚
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                AURA PLANNER INTEGRADO
              </span>
              <span className="text-[10px] font-bold text-slate-400">BNCC & Árvore da Infância®</span>
            </div>
            <h4 className="text-base sm:text-lg font-black text-slate-800 mt-0.5">
              Agenda de Atividades da Aula ({studentNome})
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl">
          <div className="text-right">
            <span className="text-[9px] font-black uppercase text-slate-400 block">Progresso do Dia</span>
            <span className="text-sm font-black text-indigo-700">{concluidasCount}/{totalCount} Concluídas</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white border border-indigo-100 flex items-center justify-center font-black text-xs text-indigo-600 shadow-2xs">
            {progressoPercent}%
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setFiltroStatus('todas')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              filtroStatus === 'todas' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todas ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setFiltroStatus('pendentes')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              filtroStatus === 'pendentes' ? 'bg-white text-amber-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pendentes ({totalCount - concluidasCount})
          </button>
          <button
            type="button"
            onClick={() => setFiltroStatus('realizadas')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              filtroStatus === 'realizadas' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Concluídas ({concluidasCount})
          </button>
        </div>
      </div>

      {/* Lista de Atividades */}
      <div className="space-y-3">
        {atividadesFiltradas.map((atv) => {
          const isDone = atv.status === 'Realizado';
          const isExpanded = expandedId === atv.id;

          return (
            <div
              key={atv.id}
              className={`p-4 rounded-2xl border transition ${
                isDone
                  ? 'bg-emerald-50/40 border-emerald-200'
                  : 'bg-white hover:bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="text-2xl shrink-0 p-2 bg-slate-100 rounded-xl">{atv.icone}</span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {atv.horario}
                      </span>
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {atv.campoBncc.split('(')[0]}
                      </span>
                    </div>
                    <h5 className={`font-black text-sm mt-1 ${isDone ? 'text-emerald-900 line-through' : 'text-slate-800'}`}>
                      {atv.titulo}
                    </h5>
                    <p className="text-xs text-slate-500 mt-0.5">{atv.subtitulo}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => handleStatusChange(atv.id, isDone ? 'Pendente' : 'Realizado')}
                    className={`px-3 py-1.5 text-xs font-black rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                      isDone
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    <CheckCircle2 size={14} />
                    <span>{isDone ? 'Concluída ✓' : 'Marcar Concluída'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : atv.id)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                  >
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>
              </div>

              {/* Detalhes Expandidos */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600 animate-in fade-in duration-150">
                  <p><strong>Descrição:</strong> {atv.descricao}</p>
                  <p><strong>Objetivo Pedagógico:</strong> {atv.objetivoPedagogico}</p>
                  <p><strong>Materiais:</strong> {atv.materiaisNecessarios.join(', ')}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
