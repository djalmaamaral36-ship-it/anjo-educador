import React, { useState, useEffect, useRef } from 'react';
import { Idoso, Usuario, JornadaEvent, GestoAfetoTipo } from '../types';
import { getFromDB, saveToDB } from '../data';
import { motion, AnimatePresence } from 'motion/react';
import { SocialShareModal } from './SocialShareModal';
import { 
  Sparkles, 
  Heart, 
  Camera, 
  Calendar, 
  Award, 
  FileText, 
  Plus, 
  X, 
  Check, 
  Printer, 
  Share2, 
  BookOpen, 
  Smile, 
  ChevronDown, 
  ChevronUp,
  Image,
  User,
  ArrowRight,
  Mic,
  Star,
  MessageSquare,
  Gift,
  Info,
  Trees,
  Upload,
  TreePine,
  Leaf,
  Eye,
  Droplet,
  Sprout,
  Users,
  HelpCircle,
  Instagram,
  Gem
} from 'lucide-react';

export const GESTOS_AFETO: { id: GestoAfetoTipo; label: string; emoji: string; desc: string; color: string; activeBg: string }[] = [
  { id: 'encanto', label: 'Que encanto!', emoji: '✨', desc: 'Admiração e surpresa positiva diante da descoberta', color: 'text-amber-700 border-amber-300 bg-amber-50/80', activeBg: 'bg-amber-500 text-white border-amber-600' },
  { id: 'amor', label: 'Feito com amor', emoji: '❤️', desc: 'Valida o afeto e dedicação da criança', color: 'text-rose-700 border-rose-300 bg-rose-50/80', activeBg: 'bg-rose-500 text-white border-rose-600' },
  { id: 'brilho', label: 'Puro brilho!', emoji: '⭐', desc: 'Celebra a criatividade e protagonismo', color: 'text-indigo-700 border-indigo-300 bg-indigo-50/80', activeBg: 'bg-indigo-500 text-white border-indigo-600' },
  { id: 'orgulho', label: 'Orgulho da gente', emoji: '🌿', desc: 'Fortalece o vínculo de comunidade e família', color: 'text-emerald-800 border-emerald-300 bg-emerald-50/80', activeBg: 'bg-emerald-600 text-white border-emerald-700' },
  { id: 'tesouro', label: 'Um tesouro!', emoji: '💎', desc: 'Registro precioso guardado para sempre', color: 'text-sky-700 border-sky-300 bg-sky-50/80', activeBg: 'bg-sky-500 text-white border-sky-600' }
];

interface JornadaAnjinhoProps {
  key?: any;
  idoso: Idoso;
  usuarioAtual: Usuario | null;
  accessibilitySettings: {
    fontSize: 'normal' | 'grande' | 'gigante';
    simplifiedMode: boolean;
    darkMode: boolean;
  };
  keyTrigger: number;
}

// Pre-defined gorgeous preschool-related illustrations/activities for teachers to pick
const PRESET_IMAGES = [
  { url: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&q=80&w=600', label: '🎨 Oficina de Artes' },
  { url: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&q=80&w=600', label: '🧸 Brincadeira Livre' },
  { url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600', label: '📚 Leitura e Histórias' },
  { url: 'https://images.unsplash.com/photo-1519689680058-324335c77ebd?auto=format&fit=crop&q=80&w=600', label: '😴 Soneca dos Anjos' },
  { url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=600', label: '🎵 Musicalização' },
  { url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600', label: '🌱 Atividade de Horta / Habilidades' },
];

const INITIAL_MEMORIES: Omit<JornadaEvent, 'id'>[] = [
  // Mariana Souza (aluno_1)
  {
    idosoId: 'aluno_1',
    tipo: 'conquista',
    titulo: 'Sentou sem apoio pela primeira vez! 🧸',
    data: '2026-06-15',
    descricao: 'Mariana conseguiu se manter sentadinha no tatame de estimulação por mais de 2 minutos sem cair para os lados. Riu muito e bateu palminhas ao conseguir o feito! Desenvolveu o equilíbrio e coordenação motora ampla de forma exemplar!',
    imagemUrl: 'https://images.unsplash.com/photo-1519689680058-324335c77ebd?auto=format&fit=crop&q=80&w=600',
    dimensoesDesenvolvimento: ['Motor Amplo', 'Social/Afetivo'],
    likes: 8,
    reagido: false,
    registradoPor: 'Profª Ana Silva',
    anexoNome: 'certificado_bebe_forte.pdf',
    valoresVivenciados: ['Esperou sua vez', 'Cooperou'],
    inesquecivel: true
  },
  {
    idosoId: 'aluno_1',
    tipo: 'foto',
    titulo: 'Soneca dos Anjos após contação de histórias 😴',
    data: '2026-06-25',
    descricao: 'Um registro precioso da nossa querida Mariana descansando tranquila após nossa contação de histórias com chocalhos suaves de ninar. Dormiu com o apego de chupeta segurando seu cobertor fofinho.',
    imagemUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=600',
    dimensoesDesenvolvimento: ['Social/Afetivo'],
    likes: 12,
    reagido: true,
    registradoPor: 'Profª Ana Silva',
    valoresVivenciados: ['Respeitou regras']
  },
  {
    idosoId: 'aluno_1',
    tipo: 'atividade',
    titulo: 'Pintura de Dedos Sensorial e Cores Quentes 🎨',
    data: '2026-07-02',
    descricao: 'Oficina sensorial de artes! Mariana experimentou guache azul e amarelo misturado com amido de milho para criar texturas. No começo sentiu estranheza na consistência gelada, mas logo espalhou a tinta com entusiasmo no papel craft!',
    imagemUrl: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&q=80&w=600',
    dimensoesDesenvolvimento: ['Motor Fino', 'Cognitivo'],
    likes: 5,
    reagido: false,
    registradoPor: 'Profª Ana Silva',
    valoresVivenciados: ['Cooperou', 'Compartilhou'],
    inesquecivel: true
  },
  
  // Arthur Silveira (aluno_fun_1)
  {
    idosoId: 'aluno_fun_1',
    tipo: 'conquista',
    titulo: "Escreveu o 'A' de Arthur na areia colorida! ✍️",
    data: '2026-06-18',
    descricao: 'Arthur demonstrou excelente avanço na coordenação motora fina e associação fonêmica! Utilizando o dedinho indicador no prato de areia colorida de estimulação, ele reproduziu a letra inicial do seu nome com grande precisão e orgulho.',
    imagemUrl: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&q=80&w=600',
    dimensoesDesenvolvimento: ['Cognitivo', 'Motor Fino', 'Linguagem'],
    likes: 15,
    reagido: true,
    registradoPor: 'Profª Cláudia Lemos',
    valoresVivenciados: ['Respeitou regras'],
    inesquecivel: true
  },
  {
    idosoId: 'aluno_fun_1',
    tipo: 'atividade',
    titulo: 'Construção de Castelo Cooperativo 🏰',
    data: '2026-06-28',
    descricao: 'Arthur trabalhou em equipe com os coleguinhas para erguer uma grande torre de blocos lógicos gigantes. Ele sugeriu colocar as peças maiores na base para não cair. Cooperação nota dez!',
    imagemUrl: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&q=80&w=600',
    dimensoesDesenvolvimento: ['Cognitivo', 'Social/Afetivo'],
    likes: 9,
    reagido: false,
    registradoPor: 'Profª Cláudia Lemos',
    valoresVivenciados: ['Cooperou', 'Compartilhou', 'Demonstrou empatia'],
    inesquecivel: true
  },
  {
    idosoId: 'aluno_fun_1',
    tipo: 'data_importante',
    titulo: 'Passeio Ecológico na Horta da Escola 🌱',
    data: '2026-07-01',
    descricao: 'Dia de plantar sementinhas! Arthur conheceu o pé de tomate-cereja, sentiu o cheiro do hortelã e plantou seu próprio feijãozinho no copinho. Ficou fascinado ao saber que a planta bebe água pela raiz!',
    imagemUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600',
    dimensoesDesenvolvimento: ['Cognitivo', 'Social/Afetivo'],
    likes: 11,
    reagido: false,
    registradoPor: 'Profª Cláudia Lemos',
    valoresVivenciados: ['Foi gentil', 'Cooperou']
  },

  // Enzo Alencar (aluno_fun_2)
  {
    idosoId: 'aluno_fun_2',
    tipo: 'conquista',
    titulo: 'Subindo degraus no módulo de espuma! 🪜',
    data: '2026-06-20',
    descricao: 'Enzo subiu com total autonomia os três degraus do circuito de espuma da nossa sala psicomotora, apoiando as mãozinhas e joelhos com ritmo constante. Celebrou no topo com um sorriso vibrante!',
    imagemUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600',
    dimensoesDesenvolvimento: ['Motor Amplo'],
    likes: 7,
    reagido: false,
    registradoPor: 'Profª Ana Silva',
    valoresVivenciados: ['Esperou sua vez'],
    inesquecivel: true
  },
  {
    idosoId: 'aluno_fun_2',
    tipo: 'atividade',
    titulo: 'Pesca de Tampinhas na Água 💦',
    data: '2026-07-03',
    descricao: 'Trabalho excelente de pinça e coordenação visomotora! Enzo usou uma colherzinha de plástico grande para tentar pescar tampinhas coloridas que boiavam na bacia de água morna. Concentração total!',
    imagemUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600',
    dimensoesDesenvolvimento: ['Motor Fino', 'Cognitivo'],
    likes: 4,
    reagido: false,
    registradoPor: 'Profª Ana Silva',
    valoresVivenciados: ['Cooperou', 'Respeitou regras']
  }
];

export const DIMENSION_LABELS: Record<string, string> = {
  'Cognitivo': '🧠 Aprendizado',
  'Motor Fino': '🎨 Criatividade',
  'Motor Amplo': '🏃 Movimento',
  'Social/Afetivo': '🤝 Convivência',
  'Linguagem': '🗣 Comunicação'
};

export const formatChildTenderName = (rawName: string): string => {
  if (!rawName) return 'Nosso Anjinho';
  let cleaned = rawName.split(' (')[0].trim();
  if (cleaned.toLowerCase().includes('nascimento') || /^\d{2}\/\d{2}/.test(cleaned)) {
    const parts = cleaned.split(/\s+/).filter(p => !p.toLowerCase().includes('nascimento') && !/\d/.test(p));
    if (parts.length > 0 && parts[0].length > 1) {
      return parts[0];
    }
    return 'Nosso Anjinho';
  }
  cleaned = cleaned.replace(/[0-9]/g, '').trim();
  const firstWord = cleaned.split(' ')[0];
  return firstWord.length > 1 ? firstWord : 'Nosso Anjinho';
};

export const generateSmartDiary = (childName: string, studentEvents: JornadaEvent[]) => {
  const tenderName = formatChildTenderName(childName);
  const today = new Date();
  const formattedDate = today.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

  if (studentEvents.length === 0) {
    return `🌸 Diário Afetivo de ${tenderName}
📅 ${formattedDate}

Olá, família querida! ✨

Hoje é um dia de acolhimento e doce expectativa. 
Estamos cuidando de cada detalhe para que os primeiros passos, risadas e vivências de ${tenderName} sejam vividos com muita ternura, segurança e alegria em nosso espaço escolar. Cada pequena vitória e cada gesto de carinho serão eternizados com todo amor.

🧸 Que a nossa caminhada juntos seja cheia de luz, serenidade e encanto!

💙 Guardado com amor no Álbum da Primeira Infância.`;
  }

  // Sort events from newest to oldest
  const sorted = [...studentEvents].sort((a,b) => b.data.localeCompare(a.data));
  
  // Format date based on most recent event if available to keep it synced
  let eventDateStr = formattedDate;
  if (sorted.length > 0) {
    const d = new Date(sorted[0].data + 'T12:00:00');
    eventDateStr = d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  let narrative = `🌸 Diário Afetivo de ${tenderName}\n📅 ${eventDateStr}\n\n`;
  narrative += `Olá, família querida! ✨\nHoje o dia por aqui foi preenchido com muito aconchego, sorrisos serenos e momentos especiais de cuidado e desenvolvimento.\n\n`;

  // Categorize events to build a human, fluid, cohesive story rather than disconnected logs
  const sleepEvents = sorted.filter(e => e.tipo === 'rotina' && (e.titulo.toLowerCase().includes('soneca') || e.titulo.toLowerCase().includes('sono') || e.descricao.toLowerCase().includes('descanso')));
  const mealEvents = sorted.filter(e => e.tipo === 'rotina' && (e.titulo.toLowerCase().includes('refeição') || e.titulo.toLowerCase().includes('refeicao') || e.titulo.toLowerCase().includes('mamadeira') || e.descricao.toLowerCase().includes('alimentação')));
  const hydEvents = sorted.filter(e => e.tipo === 'rotina' && (e.titulo.toLowerCase().includes('hidratação') || e.titulo.toLowerCase().includes('hidratacao') || e.titulo.toLowerCase().includes('água') || e.titulo.toLowerCase().includes('agua')));
  const pedagogicalEvents = sorted.filter(e => (e.tipo as string) !== 'rotina' || e.dimensoesDesenvolvimento?.some(d => d.includes('Cognitivo') || d.includes('Motor') || d.includes('Social') || d.includes('Linguagem')));

  const paragraphs: string[] = [];

  // 1. Sleep & Calmness narrative
  if (sleepEvents.length > 0) {
    const s = sleepEvents[0];
    const matchTime = s.titulo.match(/\((.*?)\)/);
    const timeSpan = matchTime ? matchTime[1] : '';
    paragraphs.push(`😴 *Hora do Soninho e Aconchego:*\n${tenderName} descansou com tranquilidade e serenidade${timeSpan ? ` (${timeSpan})` : ''}, recarregando as energias em um ambiente calmo e protegido. Acordou com disposição, olhar doce e um lindo sorriso.`);
  }

  // 2. Nutrition & Bottle feeding narrative
  if (mealEvents.length > 0) {
    const bottleFeed = mealEvents.find(m => m.titulo.toLowerCase().includes('mamadeira') || m.descricao.toLowerCase().includes('mamadeira'));
    const solidMeals = mealEvents.filter(m => m !== bottleFeed);

    const mealSentences: string[] = [];
    if (bottleFeed) {
      const matchMl = bottleFeed.descricao.match(/(\d+)\s*ml/i) || bottleFeed.titulo.match(/(\d+)\s*ml/i);
      const mlStr = matchMl ? `${matchMl[1]} ml` : 'sua mamadeira quentinha';
      mealSentences.push(`tomou ${mlStr} com calma e excelente apetite, sentindo-se acolhido(a) e muito confortável em nosso colinho`);
    }

    if (solidMeals.length > 0) {
      const cleanTitles = solidMeals.slice(0, 2).map(m => m.titulo.replace(/[🍼🍲✨❤️]/g, '').trim().toLowerCase());
      mealSentences.push(`aproveitou com alegria o momento do ${cleanTitles.join(' e ')}, demonstrando curiosidade pelos sabores e comendo super bem`);
    }

    if (mealSentences.length > 0) {
      paragraphs.push(`🍼 *Nutrição com Afeto:*\nNo momento da alimentação, ${tenderName} ${mealSentences.join(', e também ')}.`);
    }
  }

  // 3. Hydration
  if (hydEvents.length > 0) {
    paragraphs.push(`💧 *Hidratação e Bem-Estar:*\nAo longo de todo o período, bebeu sua aguinha fresca com regularidade, mantendo-se sempre bem hidratado(a), saudável e cheio(a) de disposição.`);
  }

  // 4. Pedagogical and interaction activities
  if (pedagogicalEvents.length > 0) {
    const act = pedagogicalEvents[0];
    const cleanTitle = act.titulo.replace(/[🎨🏆📸🌱📅📄🎉🪜✍️🧸😴✨]/g, '').trim();
    paragraphs.push(`🎨 *Vivências e Descobertas:*\nNa atividade *${cleanTitle}*, demonstrou olhinhos brilhantes, curiosidade e grande delicadeza ao interagir com materiais e colegas, vivenciando um momento muito rico de estímulo e afeto.`);
  }

  // Fallback if very few specific events
  if (paragraphs.length === 0) {
    paragraphs.push(`🧸 *Acolhimento Integral:*\n${tenderName} passou o dia muito bem cuidado(a), tranquilo(a) e em constante harmonia com os educadores e coleguinhas, desfrutando de um ambiente seguro e carinhoso.`);
  }

  narrative += paragraphs.join('\n\n') + '\n\n';

  // Warm, reassuring closing
  narrative += `Nosso dia foi repleto de amor, respeito ao tempinho da infância e muita dedicação. É uma alegria imensa acompanhar o florescer de cada dia! 🧸💖\n\n`;
  narrative += `Com todo carinho da equipe escolar.\n`;
  narrative += `💙 Guardado com amor no Álbum da Primeira Infância.`;

  return narrative;
};

const MiniTreeSVG = ({ svgState }: { svgState: string }) => {
  return (
    <svg viewBox="0 0 200 200" className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-sm transition-all duration-300">
      <path d="M 30,180 Q 100,165 170,180" fill="none" stroke="#D1FAE5" strokeWidth="6" strokeLinecap="round" />
      <path d="M 20,180 Q 100,160 180,180" fill="none" stroke="#86EFAC" strokeWidth="3" strokeLinecap="round" />
      {svgState === 'seed' && (
        <>
          <circle cx="100" cy="170" r="5" fill="#78350F" />
          <path d="M 100,170 Q 95,150 102,145" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" />
          <path d="M 102,145 Q 110,143 112,148" fill="#4ADE80" stroke="#166534" strokeWidth="0.8" />
        </>
      )}
      {svgState === 'sprout' && (
        <>
          <path d="M 100,175 Q 98,140 100,125" fill="none" stroke="#78350F" strokeWidth="5" strokeLinecap="round" />
          <path d="M 99,145 Q 85,138 83,145" fill="#4ADE80" stroke="#166534" strokeWidth="1" />
          <path d="M 100,135 Q 115,128 117,135" fill="#22C55E" stroke="#14532D" strokeWidth="1" />
        </>
      )}
      {svgState === 'roots' && (
        <>
          <path d="M 100,175 Q 98,140 100,115" fill="none" stroke="#78350F" strokeWidth="8" strokeLinecap="round" />
          <circle cx="100" cy="95" r="22" fill="#22C55E" opacity="0.9" />
          <circle cx="78" cy="112" r="18" fill="#15803D" opacity="0.85" />
          <circle cx="122" cy="102" r="18" fill="#166534" opacity="0.85" />
        </>
      )}
      {svgState === 'blossom' && (
        <>
          <path d="M 100,175 Q 98,130 100,105" fill="none" stroke="#78350F" strokeWidth="9" strokeLinecap="round" />
          <circle cx="100" cy="85" r="26" fill="#22C55E" opacity="0.95" />
          <circle cx="74" cy="102" r="22" fill="#15803D" opacity="0.9" />
          <circle cx="126" cy="92" r="22" fill="#166534" opacity="0.9" />
          <circle cx="88" cy="78" r="4" fill="#F472B6" />
          <circle cx="114" cy="88" r="4" fill="#F472B6" />
        </>
      )}
      {svgState === 'fruit' && (
        <>
          <path d="M 100,175 Q 98,130 100,105" fill="none" stroke="#78350F" strokeWidth="10" strokeLinecap="round" />
          <circle cx="100" cy="80" r="30" fill="#166534" />
          <circle cx="68" cy="98" r="24" fill="#15803D" />
          <circle cx="132" cy="88" r="24" fill="#22C55E" />
          <circle cx="85" cy="75" r="5" fill="#EF4444" />
          <circle cx="115" cy="82" r="5" fill="#EF4444" />
          <circle cx="100" cy="98" r="5" fill="#EF4444" />
        </>
      )}
    </svg>
  );
};

// Helper to load and assemble all journey events synchronously
function getJourneyEventsForStudent(studentId: string, studentName: string): JornadaEvent[] {
  const stored = getFromDB<JornadaEvent[]>('anjo_jornada_events', []);
  let baseEvents = stored;
  
  if (baseEvents.length === 0) {
    const populated = INITIAL_MEMORIES.map((m, idx) => ({
      ...m,
      id: `jornada_mock_${idx + 1}`
    }));
    try {
      localStorage.setItem('anjo_jornada_events', JSON.stringify(populated));
    } catch (e) {}
    baseEvents = populated;
  }

  let childEvents = baseEvents.filter(e => e.idosoId === studentId);
  if (childEvents.length === 0) {
    const genericSeeded: JornadaEvent[] = [
      {
        id: `jornada_mock_g1_${studentId}`,
        idosoId: studentId,
        tipo: 'conquista',
        titulo: 'Primeira adaptação bem sucedida! 🎉',
        data: '2026-06-10',
        descricao: `${studentName.split(' (')[0]} se adaptou completamente à rotina da nossa sala, interagindo alegremente com os amiguinhos, participando das rodas musicais e lanchando de forma independente.`,
        imagemUrl: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&q=80&w=600',
        dimensoesDesenvolvimento: ['Social/Afetivo', 'Cognitivo'],
        likes: 6,
        reagido: false,
        registradoPor: 'Coordenação Pedagógica'
      },
      {
        id: `jornada_mock_g2_${studentId}`,
        idosoId: studentId,
        tipo: 'atividade',
        titulo: 'Pintura livre no cavalete 🎨',
        data: '2026-06-22',
        descricao: 'Expressão e criatividade! Atividade de pintura livre com tintas de cores frias para estimular a percepção cromática e o controle motor fino dos bracinhos.',
        imagemUrl: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&q=80&w=600',
        dimensoesDesenvolvimento: ['Motor Fino', 'Cognitivo'],
        likes: 9,
        reagido: true,
        registradoPor: 'Profª Orientadora'
      },
      {
        id: `jornada_mock_g3_${studentId}`,
        idosoId: studentId,
        tipo: 'foto',
        titulo: 'Hora do Soninho da Tarde ✨',
        data: '2026-07-04',
        descricao: 'Um registro fofo do sono regenerador do nosso anjinho após as ricas brincadeiras no parque externo da escola.',
        imagemUrl: 'https://images.unsplash.com/photo-1519689680058-324335c77ebd?auto=format&fit=crop&q=80&w=600',
        dimensoesDesenvolvimento: ['Social/Afetivo'],
        likes: 14,
        reagido: false,
        registradoPor: 'Professora de Apoio'
      }
    ];
    baseEvents = [...baseEvents, ...genericSeeded];
    try {
      localStorage.setItem('anjo_jornada_events', JSON.stringify(baseEvents));
    } catch (e) {}
    childEvents = genericSeeded;
  }

  // Routine sync
  const synchronizedRoutineEvents: JornadaEvent[] = [];

  const sonos = getFromDB<any[]>('anjo_sono', []).filter(s => s.idosoId === studentId);
  sonos.forEach(s => {
    const dormiu = s.dormiuEm || '13:00';
    const acordou = s.acordouEm || '14:30';
    const horas = s.horasTotais || 1.5;
    const qual = s.qualidade ? s.qualidade.toUpperCase() : 'BOA';
    const obs = s.observacoes || s.obs || '';
    
    synchronizedRoutineEvents.push({
      id: `sync_sono_${s.id}`,
      idosoId: studentId,
      tipo: 'rotina',
      titulo: `😴 Soneca Aconchegante (${dormiu} às ${acordou})`,
      data: s.data || '2026-05-30',
      descricao: `Descansou com muita serenidade e conforto por cerca de ${horas}h (sono ${qual.toLowerCase()}). Acordou revigorado(a), com olhar doce e disposição para as vivências escolares. ${obs ? `Obs: ${obs}` : ''}`,
      imagemUrl: 'https://images.unsplash.com/photo-1519689680058-324335c77ebd?auto=format&fit=crop&q=80&w=600',
      dimensoesDesenvolvimento: ['Social/Afetivo', 'Saúde e Bem-Estar'],
      likes: 1,
      reagido: false,
      registradoPor: s.registradoPor || 'Equipe Pedagógica'
    });
  });

  const mealLabelMap: Record<string, string> = {
    mamadeira: 'Mamadeira de Leite',
    cafe_manha: 'Café da Manhã',
    lanche_manha: 'Lanche da Manhã',
    almoco: 'Almoço',
    lanche_tarde: 'Lanche da Tarde',
    jantar: 'Jantar',
    ceia: 'Ceia'
  };
  const globalFeedsTimeline = getFromDB<any[]>('anjo_alimentacao', []);
  const studentFeedsTimeline = getFromDB<any[]>(`anjo_alimentacao_${studentId}`, []);
  const feedsTimelineMap = new Map<string, any>();
  [...globalFeedsTimeline, ...studentFeedsTimeline].forEach((item, idx) => {
    if (!item) return;
    if (item.idosoId && item.idosoId !== studentId) return;
    const id = item.id || `feed_${idx}_${Date.now()}`;
    if (!feedsTimelineMap.has(id)) feedsTimelineMap.set(id, { ...item, id, idosoId: studentId });
  });
  const alimentacoes = Array.from(feedsTimelineMap.values());
  alimentacoes.forEach(a => {
    const isBottle = String(a.refeicao || '').toLowerCase().includes('mamad');
    const mealName = mealLabelMap[a.refeicao] || a.refeicao || 'Refeição';
    const aceitacao = a.aceitacao ? a.aceitacao.replace('_', ' ') : 'muito bem';
    const obs = a.observacoes || '';
    const ml = a.quantidadeMl || 180;
    
    synchronizedRoutineEvents.push({
      id: `sync_ali_${a.id}`,
      idosoId: studentId,
      tipo: 'rotina',
      titulo: isBottle ? `🍼 Mamadeira Aconchegante (${a.horario || 'Horário Escolar'})` : `🍲 ${mealName} Nutritivo (${a.horario || 'Horário Escolar'})`,
      data: a.data || '2026-05-30',
      descricao: isBottle 
        ? `Tomou sua mamadeira quentinha (${ml} ml) com muito apetite e aconchego no colinho (${aceitacao}). ${obs ? `Obs: ${obs}` : ''}`
        : `Aproveitou a refeição do ${mealName.toLowerCase()} com alegria e excelente aceitação (${aceitacao}). ${obs ? `Obs: ${obs}` : ''}`,
      imagemUrl: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&q=80&w=600',
      dimensoesDesenvolvimento: ['Saúde e Nutrição'],
      likes: 1,
      reagido: false,
      registradoPor: a.registradoPor || 'Equipe Escolar'
    });
  });

  const globalHydTimeline = getFromDB<any[]>('anjo_hidratacao', []);
  const studentHyd1Timeline = getFromDB<any[]>(`anjo_registro_agua_${studentId}`, []);
  const studentHyd2Timeline = getFromDB<any[]>(`anjo_hidratacao_${studentId}`, []);
  const hydTimelineMap = new Map<string, any>();
  [...globalHydTimeline, ...studentHyd1Timeline, ...studentHyd2Timeline].forEach((item, idx) => {
    if (!item) return;
    if (item.idosoId && item.idosoId !== studentId) return;
    const id = item.id || `hyd_${idx}_${Date.now()}`;
    if (!hydTimelineMap.has(id)) hydTimelineMap.set(id, { ...item, id, idosoId: studentId, quantidadeMl: Number(item.quantidadeMl || item.ml || item.quantidade || 150) });
  });
  const hidratacoes = Array.from(hydTimelineMap.values());
  hidratacoes.forEach(h => {
    synchronizedRoutineEvents.push({
      id: `sync_hid_${h.id}`,
      idosoId: studentId,
      tipo: 'rotina',
      titulo: `💧 Aguinha Fresca (${h.quantidadeMl} ml às ${h.horario || '10:00'})`,
      data: h.data || '2026-05-30',
      descricao: `Hidratou-se com carinho e aguinha fresca, mantendo a saúde e energia sempre em dia ao longo da rotina.`,
      dimensoesDesenvolvimento: ['Saúde e Bem-Estar'],
      likes: 1,
      reagido: false,
      registradoPor: h.registradoPor || 'Equipe Escolar'
    });
  });

  const isActCleared = localStorage.getItem(`anjo_activities_cleared_${studentId}`) === 'true';
  const atividades = isActCleared ? [] : getFromDB<any[]>('anjo_atividades', []).filter(a => a.idosoId === studentId);
  atividades.forEach(a => {
    synchronizedRoutineEvents.push({
      id: `sync_ativ_${a.id}`,
      idosoId: studentId,
      tipo: 'atividade',
      titulo: `🎨 ${a.titulo || 'Atividade Lúdica Escolar'}`,
      data: a.data || '2026-05-30',
      descricao: `${a.descricao || 'Atividade pedagógica e vivência em sala de aula.'}`,
      imagemUrl: a.fotoTrabalhinho || 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&q=80&w=600',
      dimensoesDesenvolvimento: [a.campoExperiencia || 'Cognitivo'],
      likes: 2,
      reagido: false,
      registradoPor: a.registradoPor || 'Professora Titular'
    });
  });

  const recados = getFromDB<any[]>('anjo_mural_recados', []).filter(r => r.idosoId === studentId);
  recados.forEach(r => {
    synchronizedRoutineEvents.push({
      id: `sync_rec_${r.id}`,
      idosoId: studentId,
      tipo: 'recado',
      titulo: `💬 Recado no Mural: ${r.categoria ? r.categoria.toUpperCase() : 'COMUNICADO'}`,
      data: r.dataHora ? r.dataHora.split(' ')[0] : (r.data || '2026-05-30'),
      descricao: `Mensagem de ${r.remetente || 'Mural de Recados'}: "${r.mensagem}"`,
      dimensoesDesenvolvimento: ['Social/Afetivo'],
      likes: 1,
      reagido: false,
      registradoPor: r.remetente || r.cargo || 'Mural de Mão Dupla'
    });
  });

  const reactionsMap = getFromDB<Record<string, { meuGestoAfeto?: GestoAfetoTipo; gestosAfeto?: Record<string, number>; likes?: number }>>('anjo_jornada_reactions', {});
  const combinedMap = new Map<string, JornadaEvent>();
  
  childEvents.forEach(e => {
    const reaction = reactionsMap[e.id];
    if (reaction) {
      combinedMap.set(e.id, {
        ...e,
        reagido: Boolean(reaction.meuGestoAfeto),
        meuGestoAfeto: reaction.meuGestoAfeto,
        gestosAfeto: reaction.gestosAfeto || e.gestosAfeto,
        likes: reaction.likes !== undefined ? reaction.likes : e.likes
      });
    } else {
      combinedMap.set(e.id, e);
    }
  });
  
  synchronizedRoutineEvents.forEach(e => {
    if (!combinedMap.has(e.id)) {
      const reaction = reactionsMap[e.id];
      if (reaction) {
        combinedMap.set(e.id, {
          ...e,
          reagido: Boolean(reaction.meuGestoAfeto),
          meuGestoAfeto: reaction.meuGestoAfeto,
          gestosAfeto: reaction.gestosAfeto || e.gestosAfeto,
          likes: reaction.likes !== undefined ? reaction.likes : e.likes
        });
      } else {
        combinedMap.set(e.id, e);
      }
    }
  });

  return Array.from(combinedMap.values()).sort((a, b) => b.data.localeCompare(a.data));
}

export default function JornadaAnjinho({ idoso: idosoProp, usuarioAtual, accessibilitySettings, keyTrigger }: JornadaAnjinhoProps) {
  const [focusedStudentId, setFocusedStudentId] = useState<string>(idosoProp.id);
  const [activeViewTab, setActiveViewTab] = useState<'individual' | 'floresta'>('individual');

  const idososList = getFromDB<Idoso[]>('anjo_idosos', []);
  const activeStudent = idososList.find(s => s.id === focusedStudentId) || idosoProp;
  const idoso = activeStudent;

  useEffect(() => {
    setFocusedStudentId(idosoProp.id);
  }, [idosoProp.id]);

  const isDark = accessibilitySettings?.darkMode || false;
  // Initialize synchronously with cached events so the screen never mounts empty or flashes
  const [events, setEvents] = useState<JornadaEvent[]>(() => getJourneyEventsForStudent(activeStudent.id, activeStudent.nome));
  const [filterType, setFilterType] = useState<string>('todos');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [isBookMode, setIsBookMode] = useState<boolean>(false);
  const [copiedDiary, setCopiedDiary] = useState<boolean>(false);
  const formRef = React.useRef<HTMLDivElement>(null);

  // Form Fields
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<JornadaEvent['tipo']>('atividade');
  const [newDesc, setNewDesc] = useState('');
  const [newDate, setNewDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [newImgUrl, setNewImgUrl] = useState(PRESET_IMAGES[0].url);
  const [replicateToClassroom, setReplicateToClassroom] = useState<boolean>(false);
  const [listeningField, setListeningField] = useState<'title' | 'desc' | null>(null);
  const listeningTargetRef = React.useRef<'title' | 'desc'>('desc');
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>(['Cognitivo']);
  const [newAnexo, setNewAnexo] = useState('');
  const [selectedValores, setSelectedValores] = useState<string[]>([]);
  const [isInesquecivel, setIsInesquecivel] = useState<boolean>(false);
  const [showLetterModal, setShowLetterModal] = useState<boolean>(false);
  const [expandedMethod, setExpandedMethod] = useState<string>('L');
  const [watering, setWatering] = useState(false);
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [rainingHearts, setRainingHearts] = useState<{ id: number; left: number; delay: number; emoji?: string }[]>([]);
  const [screenCelebration, setScreenCelebration] = useState<{
    id: number;
    items: { id: number; left: number; top: number; delay: number; emoji: string; size: number; animType: string }[];
  } | null>(null);
  const [lastAfetoFeedback, setLastAfetoFeedback] = useState<{ label: string; emoji: string; text: string } | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedEventToShare, setSelectedEventToShare] = useState<JornadaEvent | null>(null);

  const triggerAfetoAnimation = (gesto: GestoAfetoTipo) => {
    const item = GESTOS_AFETO.find(g => g.id === gesto) || GESTOS_AFETO[0];
    
    // Feedback message
    let feedbackText = '';
    let particleEmoji = '🦋';
    
    if (gesto === 'encanto') {
      feedbackText = '✨ Centelhas de encanto iluminaram a árvore!';
      particleEmoji = '✨';
    } else if (gesto === 'amor') {
      feedbackText = '❤️ Borboletas de amor pousaram nas flores!';
      particleEmoji = '🦋';
    } else if (gesto === 'brilho') {
      feedbackText = '⭐ Estrelinhas e passarinhos cantam na copa!';
      particleEmoji = '🐦';
    } else if (gesto === 'orgulho') {
      feedbackText = '🌿 Raízes e folhas fortes se expandiram!';
      particleEmoji = '🍃';
    } else if (gesto === 'tesouro') {
      feedbackText = '💎 Um tesouro inesquecível guardado com carinho!';
      particleEmoji = '💎';
    }

    setLastAfetoFeedback({ label: item.label, emoji: item.emoji, text: feedbackText });
    
    // Create rich animated floating elements with large prominent sizes
    const animChoices = ['anim-swirl-butterfly', 'anim-fly-bird', 'anim-rise-heart'];
    const emojisPool = [particleEmoji, '🦋', '🐦', '🌸', '✨', '💖', '🕊️', '🌟', '💎', item.emoji];
    const screenParticles = Array.from({ length: 50 }).map((_, i) => ({
      id: Math.random() + i,
      left: Math.random() * 88 + 6,
      top: Math.random() * 75 + 10,
      delay: (i % 8) * 0.15,
      emoji: emojisPool[i % emojisPool.length],
      size: Math.floor(Math.random() * 24) + 38, // 38px to 62px
      animType: animChoices[i % animChoices.length]
    }));

    setScreenCelebration({
      id: Date.now(),
      items: screenParticles
    });

    setRainingHearts(screenParticles.map(p => ({ id: p.id, left: p.left, delay: p.delay, emoji: p.emoji })));

    setTimeout(() => {
      setScreenCelebration(null);
      setRainingHearts([]);
    }, 4500);

    setTimeout(() => {
      setLastAfetoFeedback(null);
    }, 6000);
  };

  const handleRegar = () => {
    if (watering) return;
    setWatering(true);
    
    // Save to local storage
    const currentRegar = parseInt(localStorage.getItem(`anjo_regar_count_${idoso.id}`) || '0', 10);
    localStorage.setItem(`anjo_regar_count_${idoso.id}`, (currentRegar + 1).toString());

    // Create raining droplets, birds and butterflies across the entire screen
    const emojisPool = ['💧', '🦋', '🐦', '🌸', '✨', '🌈', '🕊️', '🌿'];
    const screenParticles = Array.from({ length: 50 }).map((_, i) => ({
      id: Math.random() + i,
      left: Math.random() * 88 + 6,
      top: Math.random() * 75 + 10,
      delay: Math.random() * 1.2,
      emoji: emojisPool[i % emojisPool.length],
      size: Math.floor(Math.random() * 26) + 40, // 40px to 66px
      animType: i % 2 === 0 ? 'anim-swirl-butterfly' : 'anim-fly-bird'
    }));

    setScreenCelebration({
      id: Date.now(),
      items: screenParticles
    });

    setRainingHearts(screenParticles.map(p => ({ id: p.id, left: p.left, delay: p.delay, emoji: p.emoji })));

    setLastAfetoFeedback({
      label: 'Árvore Regada com Afeto',
      emoji: '💧',
      text: 'A árvore foi regada com amor! Borboletas e passarinhos celebraram!'
    });

    setTimeout(() => {
      setWatering(false);
      setScreenCelebration(null);
      setRainingHearts([]);
    }, 4800);

    setTimeout(() => {
      setLastAfetoFeedback(null);
    }, 6500);
  };

  // Get dynamic messaging from the Tree as a narrator / character
  const getTreeMessage = () => {
    const name = idoso.nome.split(' (')[0];
    const nameOnly = name.split(' ')[0];
    
    // Find if we have any recently logged values or "Inesquecível" moments
    const inesqueciveis = events.filter(e => e.inesquecivel);
    const comValores = events.filter(e => e.valoresVivenciados && e.valoresVivenciados.length > 0);
    
    if (inesqueciveis.length > 0) {
      const lastInesq = inesqueciveis[inesqueciveis.length - 1];
      return `🌟 "Olha só! Sinto meus galhos ainda mais fortes e felizes por conta daquele momento especial de ${nameOnly}: '${lastInesq.titulo}'. Guardarei essa linda lembrança para sempre!"`;
    }
    
    if (comValores.length > 0) {
      const lastVal = comValores[comValores.length - 1];
      const val = lastVal.valoresVivenciados?.[0] || 'Empatia';
      return `🌸 "Hoje floresci um pouquinho mais! ${nameOnly} demonstrou o valor precioso de ${val}. É emocionante ver esse sentimento desabrochar em nossas folhas!"`;
    }
    
    // Default messages based on current station lifecycle
    const soilBonus = stats.soilBonus;
    if (soilBonus === 0) {
      return `🌱 "Olá, família! Sou a semente do futuro de ${nameOnly}. Cada soneca tranquila, colher de papa e cuidado diário na escola é como água fresca nutrindo minhas primeiras raízes."`;
    } else if (soilBonus === 20) {
      return `🌿 "Estou criando lindos brotos! É tão alegre ver o ${nameOnly} brincando livremente, descobrindo o mundo e criando vínculos de amizade na sala!"`;
    } else if (soilBonus === 45) {
      return `🌳 "Minhas raízes estão ficando muito fortes! Adoro acompanhar o ${nameOnly} ganhando autonomia e espalhando gargalhadas em cada nova atividade."`;
    } else {
      return `🍎 "Tenho tanto orgulho de carregar frutos maduros! Cada conquista do ${nameOnly} é um doce legado de aprendizados e amor, pronto para iluminar os próximos caminhos da vida!"`;
    }
  };

  // Dynamic calculation for the "Índice de Cultivo" & "Estações da Árvore" (Camada Oculta de Inteligência)
  const getCultivoStats = () => {
    // Determine baseline bonus based on age-group (strictly behind the scenes - Camada Oculta)
    let soilBonus = 0;
    let cycleName = 'Primavera do Berçário';
    let stationEmoji = '🌱';
    let stationName = 'Primavera (Berçário)';
    let stationDesc = 'Toda grande árvore começa como uma semente. Nesta fase, cada cuidado é uma raiz que fortalece o futuro.';
    let stationMetaphor = 'Acolhimento, afeto e as primeiras conexões vitais com o mundo.';
    let svgBaseState = 'seed'; // will adjust based on total progress
    
    const name = idoso.nome;
    
    if (name.includes('Maternal') || name.includes('2 Anos') || name.includes('3 Anos')) {
      soilBonus = 20;
      cycleName = 'Verão do Maternal';
      stationEmoji = '🌿';
      stationName = 'Verão (Maternal)';
      stationDesc = 'Sua árvore já começou a criar novos brotos. Agora ela aprende explorando, descobrindo e criando vínculos.';
      stationMetaphor = 'Tempo de socialização, curiosidade lúdica e expansão afetiva.';
      svgBaseState = 'sprout';
    } else if (name.includes('Jardim I') || name.includes('4 Anos')) {
      soilBonus = 45;
      cycleName = 'Outono do Jardim';
      stationEmoji = '🌸';
      stationName = 'Outono (Jardim)';
      stationDesc = 'Sua árvore já possui raízes fortes. É tempo de florescer, desenvolver autonomia, criatividade e amizades.';
      stationMetaphor = 'O desabrochar socioemocional, empatia e a beleza de conviver.';
      svgBaseState = 'roots';
    } else if (name.includes('Jardim II') || name.includes('Pré') || name.includes('5 Anos') || name.includes('6 Anos')) {
      soilBonus = 75;
      cycleName = 'Estação da Colheita (Pré)';
      stationEmoji = '🍎';
      stationName = 'Estação da Colheita (Pré)';
      stationDesc = 'Sua árvore está no momento de colher os doces frutos da autonomia, das descobertas e de consolidar um lindo legado para o Ensino Fundamental.';
      stationMetaphor = 'A colheita de conquistas, preparando asas fortes para voar alto.';
      svgBaseState = 'blossom';
    }

    let score = soilBonus;
    let totalMoments = events.length;
    let totalValores = 0;
    let totalFrutos = 0;

    // --- INTEGRATION: Compute points from Routine and Activities dynamically ---
    const globalFeedsJ = getFromDB<any[]>('anjo_alimentacao', []);
    const studentFeedsJ = getFromDB<any[]>(`anjo_alimentacao_${idoso.id}`, []);
    const feedsJMap = new Map<string, any>();
    [...globalFeedsJ, ...studentFeedsJ].forEach((item, idx) => {
      if (!item) return;
      if (item.idosoId && item.idosoId !== idoso.id) return;
      const id = item.id || `feed_${idx}_${Date.now()}`;
      if (!feedsJMap.has(id)) feedsJMap.set(id, { ...item, id, idosoId: idoso.id });
    });
    const alimentacaoList = Array.from(feedsJMap.values());

    const globalHydJ = getFromDB<any[]>('anjo_hidratacao', []);
    const studentHyd1J = getFromDB<any[]>(`anjo_registro_agua_${idoso.id}`, []);
    const studentHyd2J = getFromDB<any[]>(`anjo_hidratacao_${idoso.id}`, []);
    const hydJMap = new Map<string, any>();
    [...globalHydJ, ...studentHyd1J, ...studentHyd2J].forEach((item, idx) => {
      if (!item) return;
      if (item.idosoId && item.idosoId !== idoso.id) return;
      const id = item.id || `hyd_${idx}_${Date.now()}`;
      if (!hydJMap.has(id)) hydJMap.set(id, { ...item, id, idosoId: idoso.id, quantidadeMl: Number(item.quantidadeMl || item.ml || item.quantidade || 150) });
    });
    const hidratacaoList = Array.from(hydJMap.values());
    const sonoList = getFromDB<any[]>('anjo_sono', []).filter(item => item.idosoId === idoso.id);
    const humorList = getFromDB<any[]>('anjo_humor', []).filter(item => item.idosoId === idoso.id);
    const isActCleared = localStorage.getItem(`anjo_activities_cleared_${idoso.id}`) === 'true';
    const atividadesList = isActCleared ? [] : getFromDB<any[]>('anjo_atividades', []).filter(item => item.idosoId === idoso.id);

    // Each daily routine log (feeding, sleeping, mood, hydration) adds points
    // especially important for babies (Berçário & Maternal)
    const routinePoints = (soilBonus === 0 || soilBonus === 20) ? 2.5 : 1.5;
    score += (alimentacaoList.length + hidratacaoList.length + sonoList.length + humorList.length) * routinePoints;

    // Each classroom activity adds points, with a bonus if there is a student photo/work
    atividadesList.forEach(a => {
      score += 4; // base points for class activity
      if (a.fotoTrabalhinho) {
        score += 4; // bonus points for pedagogic photo
        totalFrutos++; // contributes directly to legacy fruits!
      }
    });

    totalMoments += (alimentacaoList.length + hidratacaoList.length + sonoList.length + humorList.length + atividadesList.length);

    events.forEach(e => {
      // Base points per event (Camada Oculta)
      let eventPoints = 2;
      
      // Multipliers based on kid age-group:
      const text = (e.titulo + ' ' + (e.descricao || '')).toLowerCase();
      if (soilBonus === 0 || soilBonus === 20) {
        // Berçário & Maternal I: routine logs (sleep, food, hygiene) have high relevance
        if (e.tipo === 'rotina' || text.includes('sono') || text.includes('mamadeira') || text.includes('fralda') || text.includes('papinha') || text.includes('dormiu')) {
          eventPoints = 3.5;
        }
      }

      score += eventPoints;
      
      // Enrichments
      if (e.imagemUrl) score += 3;
      if (e.inesquecivel) {
        score += 10;
        totalFrutos++;
      }
      if (e.valoresVivenciados && e.valoresVivenciados.length > 0) {
        // Jardim & Pré have enhanced valuation for complex socio-emotional values
        const valueWeight = (soilBonus >= 75) ? 6 : 4;
        score += e.valoresVivenciados.length * valueWeight;
        totalValores += e.valoresVivenciados.length;
      }
      if (e.likes) {
        score += e.likes * 0.5;
      }
    });

    const finalScore = Math.round(score);
    
    // Determine tree SVG visualization state based on actual progress (growth response)
    // The more we record, the more the tree grows from its base state!
    let svgState = svgBaseState;
    if (finalScore >= 110) {
      svgState = 'fruit';
    } else if (finalScore >= 76) {
      svgState = 'blossom';
    } else if (finalScore >= 41) {
      svgState = 'roots';
    } else if (finalScore >= 16) {
      svgState = 'sprout';
    } else {
      svgState = 'seed';
    }

    // Progress percent (within the current cycle / nutrition level)
    // We can define cycle goals dynamically:
    let minPts = soilBonus;
    let maxPts = soilBonus + 50; // Every cycle has a progress band of 50 points of new stories
    const progressPercent = Math.min(100, Math.round(((finalScore - minPts) / (maxPts - minPts)) * 100));

    // Qualitative label of tree nutrition (visível para os pais no lugar de pontuação seca)
    let cultivoLabel = 'Solo Acolhedor 💧';
    let labelColor = 'bg-amber-50 border-amber-200/50 text-amber-900';
    if (progressPercent >= 90) {
      cultivoLabel = 'Árvore em Pleno Florescimento 🌟';
      labelColor = 'bg-emerald-50 border-emerald-250 text-emerald-950';
    } else if (progressPercent >= 60) {
      cultivoLabel = 'Copas em Expansão 🌳';
      labelColor = 'bg-sky-50 border-sky-200 text-sky-950';
    } else if (progressPercent >= 30) {
      cultivoLabel = 'Crescimento Ativo 🌿';
      labelColor = 'bg-teal-50 border-teal-200 text-teal-950';
    } else if (progressPercent >= 10) {
      cultivoLabel = 'Solo Fértil Nutrido 🌱';
      labelColor = 'bg-amber-50 border-amber-200 text-amber-950';
    }

    let station = {
      id: soilBonus === 0 ? 1 : soilBonus === 20 ? 2 : soilBonus === 45 ? 3 : 4,
      emoji: stationEmoji,
      name: stationName,
      desc: stationDesc,
      metaphor: stationMetaphor,
      color: 'from-indigo-50 to-indigo-100/50 text-indigo-950 border-indigo-200',
      minPts,
      maxPts,
      svgState
    };

    const totalLikes = events.reduce((acc, curr) => acc + (curr.likes || 0), 0);
    const totalRegadas = parseInt(localStorage.getItem(`anjo_regar_count_${idoso.id}`) || '0', 10);

    return {
      score: finalScore,
      station,
      progressPercent,
      totalMoments,
      totalValores,
      totalFrutos,
      totalLikes,
      totalRegadas,
      soilBonus,
      cycleName,
      cultivoLabel,
      labelColor
    };
  };

  const stats = getCultivoStats();

  // Voice, Camera & Mobile Gallery Upload states
  const [isListening, setIsListening] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const recognitionRef = React.useRef<any>(null);

  // Mobile Gallery & Camera File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert("Por favor, selecione um arquivo de imagem válido (PNG, JPG, WEBP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = document.createElement('img');
      img.onload = () => {
        // Compress and resize image to avoid memory/localStorage size limits on mobile devices
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1024;
        const MAX_HEIGHT = 1024;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setNewImgUrl(compressedDataUrl);
        } else {
          setNewImgUrl(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const isListeningRef = useRef(false);
  const lastJornadaSpeechRef = useRef<number>(0);
  const jornadaBaseTextRef = useRef('');
  const jornadaLatestTextRef = useRef('');

  useEffect(() => {
    // Initialize Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'pt-BR';
      
      rec.onresult = (event: any) => {
        lastJornadaSpeechRef.current = Date.now();
        let sessionFinal = '';
        let sessionInterim = '';

        for (let i = 0; i < event.results.length; ++i) {
          const chunk = (event.results[i][0]?.transcript || '').trim();
          if (chunk) {
            if (event.results[i].isFinal) {
              sessionFinal = sessionFinal ? `${sessionFinal} ${chunk}` : chunk;
            } else {
              sessionInterim = sessionInterim ? `${sessionInterim} ${chunk}` : chunk;
            }
          }
        }

        const sessionCombined = sessionFinal ? (sessionInterim ? `${sessionFinal} ${sessionInterim}` : sessionFinal) : sessionInterim;
        const base = jornadaBaseTextRef.current.trim();
        const fullText = base ? (sessionCombined ? `${base} ${sessionCombined}` : base) : sessionCombined;
        jornadaLatestTextRef.current = fullText;

        if (listeningTargetRef.current === 'title') {
          setNewTitle(fullText);
        } else {
          setNewDesc(fullText);
        }
      };
      
      rec.onerror = (err: any) => {
        console.warn("Speech recognition notice in Jornada:", err?.error || err);
        if (err?.error === 'no-speech' && isListeningRef.current) {
          return; // keep active
        }
        if (err?.error === 'not-allowed') {
          isListeningRef.current = false;
          setIsListening(false);
          setListeningField(null);
        }
      };
      
      rec.onend = () => {
        if (isListeningRef.current) {
          const timeSinceLastSpeech = Date.now() - lastJornadaSpeechRef.current;
          if (timeSinceLastSpeech < 8500) {
            jornadaBaseTextRef.current = jornadaLatestTextRef.current;
            try {
              rec.start();
              return;
            } catch (e) {
              // ignore
            }
          }
        }
        isListeningRef.current = false;
        setIsListening(false);
        setListeningField(null);
      };
      
      recognitionRef.current = rec;
    }
  }, []);

  useEffect(() => {
    return () => {
      // Cleanup camera stream on unmount
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      // Cleanup speech recognition
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening]);

  const toggleListening = (field: 'title' | 'desc') => {
    if (!recognitionRef.current) {
      alert("O reconhecimento de voz não é suportado pelo seu navegador neste momento. Por favor, tente usar o Google Chrome ou Safari.");
      return;
    }
    
    // If already listening to the same field, stop
    if (isListening && listeningTargetRef.current === field) {
      isListeningRef.current = false;
      recognitionRef.current.stop();
      setIsListening(false);
      setListeningField(null);
    } else {
      // If listening to a different field, stop first
      if (isListening) {
        recognitionRef.current.stop();
      }
      
      listeningTargetRef.current = field;
      setListeningField(field);
      lastJornadaSpeechRef.current = Date.now();
      isListeningRef.current = true;
      const initialText = field === 'title' ? newTitle : newDesc;
      jornadaBaseTextRef.current = initialText || '';
      jornadaLatestTextRef.current = initialText || '';
      
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error("Erro ao iniciar microfone:", err);
        isListeningRef.current = false;
        setIsListening(false);
        setListeningField(null);
      }
    }
  };

  // Camera Functions
  const startCamera = async () => {
    setCameraError(null);
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error("Erro ao abrir câmera:", err);
      setCameraError("Não foi possível acessar a câmera do dispositivo. Verifique as permissões de câmera.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setNewImgUrl(dataUrl);
        stopCamera();
      }
    }
  };

  // Always allow registering new moments in Jornada do Anjinho
  const canAddMoment = true;

  useEffect(() => {
    if (showAddForm) {
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    }
  }, [showAddForm]);

  useEffect(() => {
    loadJourneyEvents();

    const handleSync = (e: any) => {
      console.log(`📡 [JornadaAnjinho Component] Evento de atualização capturado (${e?.type || 'sync'})! Recarregando eventos da jornada.`, { timestamp: new Date().toISOString() });
      loadJourneyEvents();
    };

    window.addEventListener('db-jornada-update', handleSync);
    window.addEventListener('db-mural-update', handleSync);
    window.addEventListener('anjo_user_updated', handleSync);
    window.addEventListener('db-vitals-update', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('db-jornada-update', handleSync);
      window.removeEventListener('db-mural-update', handleSync);
      window.removeEventListener('anjo_user_updated', handleSync);
      window.removeEventListener('db-vitals-update', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [focusedStudentId, keyTrigger, idoso.id]);

  const loadJourneyEvents = () => {
    setEvents(getJourneyEventsForStudent(idoso.id, idoso.nome));
  };

  const handleGestoAfeto = (eventId: string, gesto: GestoAfetoTipo) => {
    let selectedGestoForAnim: GestoAfetoTipo = gesto;

    // 1. Update events state in-memory safely so timeline never vanishes or flashes
    setEvents(prevEvents => {
      return prevEvents.map(e => {
        if (e.id === eventId) {
          const currentGesto = e.meuGestoAfeto;
          const isDeselecting = currentGesto === gesto;
          const currentGestosCounts = { ...(e.gestosAfeto || {}) };

          // Adjust counts
          if (currentGesto && currentGestosCounts[currentGesto]) {
            currentGestosCounts[currentGesto] = Math.max(0, (currentGestosCounts[currentGesto] || 1) - 1);
          }

          if (!isDeselecting) {
            currentGestosCounts[gesto] = (currentGestosCounts[gesto] || 0) + 1;
            selectedGestoForAnim = gesto;
          }

          const totalLikes = Object.values(currentGestosCounts).reduce((acc, c) => acc + (c || 0), 0);

          return {
            ...e,
            reagido: !isDeselecting,
            meuGestoAfeto: isDeselecting ? undefined : gesto,
            gestosAfeto: currentGestosCounts,
            likes: totalLikes
          };
        }
        return e;
      });
    });

    // 2. Persist in anjo_jornada_events if the event exists there
    const stored = getFromDB<JornadaEvent[]>('anjo_jornada_events', []);
    const eventExists = stored.some(e => e.id === eventId);
    if (eventExists) {
      const updatedStored = stored.map(e => {
        if (e.id === eventId) {
          const currentGesto = e.meuGestoAfeto;
          const isDeselecting = currentGesto === gesto;
          const currentGestosCounts = { ...(e.gestosAfeto || {}) };

          if (currentGesto && currentGestosCounts[currentGesto]) {
            currentGestosCounts[currentGesto] = Math.max(0, (currentGestosCounts[currentGesto] || 1) - 1);
          }

          if (!isDeselecting) {
            currentGestosCounts[gesto] = (currentGestosCounts[gesto] || 0) + 1;
          }

          const totalLikes = Object.values(currentGestosCounts).reduce((acc, c) => acc + (c || 0), 0);

          return {
            ...e,
            reagido: !isDeselecting,
            meuGestoAfeto: isDeselecting ? undefined : gesto,
            gestosAfeto: currentGestosCounts,
            likes: totalLikes
          };
        }
        return e;
      });
      try {
        localStorage.setItem('anjo_jornada_events', JSON.stringify(updatedStored));
      } catch (err) {}
    }

    // 3. Persist in reactions map for persistent display across all events (including synced routine logs)
    const reactionsMap = getFromDB<Record<string, { meuGestoAfeto?: GestoAfetoTipo; gestosAfeto?: Record<string, number>; likes?: number }>>('anjo_jornada_reactions', {});
    const existingReaction = reactionsMap[eventId] || {};
    const currentGesto = existingReaction.meuGestoAfeto;
    const isDeselecting = currentGesto === gesto;
    const currentGestosCounts = { ...(existingReaction.gestosAfeto || {}) };

    if (currentGesto && currentGestosCounts[currentGesto]) {
      currentGestosCounts[currentGesto] = Math.max(0, (currentGestosCounts[currentGesto] || 1) - 1);
    }
    if (!isDeselecting) {
      currentGestosCounts[gesto] = (currentGestosCounts[gesto] || 0) + 1;
    }
    const totalLikes = Object.values(currentGestosCounts).reduce((acc, c) => acc + (c || 0), 0);

    reactionsMap[eventId] = {
      meuGestoAfeto: isDeselecting ? undefined : gesto,
      gestosAfeto: currentGestosCounts,
      likes: totalLikes
    };
    try {
      localStorage.setItem('anjo_jornada_reactions', JSON.stringify(reactionsMap));
    } catch (err) {}

    // 4. Trigger celebration animation of butterflies, birds, sparkles & full screen joy!
    triggerAfetoAnimation(selectedGestoForAnim || gesto);
  };

  const handleToggleLike = (eventId: string) => {
    // Default to 'amor' if clicked directly
    handleGestoAfeto(eventId, 'amor');
  };

  const handleToggleDimension = (dim: string) => {
    if (selectedDimensions.includes(dim)) {
      if (selectedDimensions.length > 1) {
        setSelectedDimensions(selectedDimensions.filter(d => d !== dim));
      }
    } else {
      setSelectedDimensions([...selectedDimensions, dim]);
    }
  };

  const handleAddEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;

    const studentRoom = getStudentClassroom(idoso.nome);
    const stored = getFromDB<JornadaEvent[]>('anjo_jornada_events', []);
    let newEvents: JornadaEvent[] = [];

    if (replicateToClassroom) {
      // Find all students in the same classroom/room
      const classroomStudents = idososList.filter(s => s.id.startsWith('aluno_') && getStudentClassroom(s.nome) === studentRoom);
      
      classroomStudents.forEach((student, idx) => {
        newEvents.push({
          id: `jornada_event_${Date.now()}_${idx}_${student.id}`,
          idosoId: student.id,
          tipo: newType,
          titulo: newTitle,
          descricao: newDesc,
          data: newDate,
          imagemUrl: newImgUrl,
          dimensoesDesenvolvimento: selectedDimensions,
          likes: 0,
          reagido: false,
          registradoPor: usuarioAtual?.nome || 'Professora Titular',
          anexoNome: newAnexo.trim() ? newAnexo : undefined,
          valoresVivenciados: selectedValores,
          inesquecivel: isInesquecivel
        });
      });
      
      alert(`🎉 Momento registrado com sucesso e replicado para todos os ${classroomStudents.length} alunos da turma ${studentRoom}!`);
    } else {
      newEvents.push({
        id: `jornada_event_${Date.now()}`,
        idosoId: idoso.id,
        tipo: newType,
        titulo: newTitle,
        descricao: newDesc,
        data: newDate,
        imagemUrl: newImgUrl,
        dimensoesDesenvolvimento: selectedDimensions,
        likes: 0,
        reagido: false,
        registradoPor: usuarioAtual?.nome || 'Professora Titular',
        anexoNome: newAnexo.trim() ? newAnexo : undefined,
        valoresVivenciados: selectedValores,
        inesquecivel: isInesquecivel
      });
    }

    const updated = [...newEvents, ...stored];
    saveToDB('anjo_jornada_events', updated);

    // --- ALSO SYNCHRONIZE TO SPECIFIC ROUTINE/MURAL DATABASES ---
    const textLower = (newTitle + ' ' + newDesc).toLowerCase();

    // Sleep sync
    if (newType === 'rotina' || textLower.includes('sono') || textLower.includes('soneca') || textLower.includes('dormiu') || textLower.includes('descanso')) {
      const times = newDesc.match(/(\d{1,2}:\d{2})/g);
      const dormiuEm = times && times.length >= 1 ? times[0] : '13:00';
      const acordouEm = times && times.length >= 2 ? times[1] : '14:30';
      const sonos = getFromDB<any[]>('anjo_sono', []);
      sonos.push({
        id: 'sono_' + Date.now(),
        idosoId: idoso.id,
        dormiuEm,
        acordouEm,
        horasTotais: 1.5,
        qualidade: 'boa',
        interrupcoes: 0,
        data: newDate,
        observacoes: `${newTitle}: ${newDesc}`,
        registradoPor: usuarioAtual?.nome || 'Diário da Infância'
      });
      saveToDB('anjo_sono', sonos);
    }

    // Meal sync
    if (textLower.includes('refeição') || textLower.includes('almoço') || textLower.includes('lanche') || textLower.includes('café') || textLower.includes('papinha') || textLower.includes('mamadeira')) {
      const feeds = getFromDB<any[]>('anjo_alimentacao', []);
      feeds.push({
        id: 'ali_' + Date.now(),
        idosoId: idoso.id,
        refeicao: textLower.includes('almoço') ? 'almoco' : textLower.includes('café') ? 'cafe_manha' : 'lanche_tarde',
        aceitacao: 'muito_bem',
        horario: new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }),
        data: newDate,
        observacoes: `${newTitle}: ${newDesc}`,
        registradoPor: usuarioAtual?.nome || 'Diário da Infância'
      });
      saveToDB('anjo_alimentacao', feeds);
    }

    // Hydration sync
    if (textLower.includes('hidratação') || textLower.includes('água') || textLower.includes('suco') || textLower.includes('copo')) {
      const hydro = getFromDB<any[]>('anjo_hidratacao', []);
      hydro.push({
        id: 'hid_' + Date.now(),
        idosoId: idoso.id,
        quantidadeMl: 200,
        horario: new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }),
        data: newDate,
        registradoPor: usuarioAtual?.nome || 'Diário da Infância'
      });
      saveToDB('anjo_hidratacao', hydro);
    }

    // Mural Recados sync
    if (newType === 'recado' || textLower.includes('recado') || textLower.includes('mural') || textLower.includes('aviso')) {
      const recadosDB = getFromDB<any[]>('anjo_mural_recados', []);
      recadosDB.push({
        id: 'rec_' + Date.now(),
        idosoId: idoso.id,
        tipo: 'prof_para_pais',
        categoria: 'pedagogico',
        remetente: usuarioAtual?.nome || 'Professora Titular',
        cargo: 'Equipe Escolar',
        mensagem: `${newTitle}: ${newDesc}`,
        dataHora: `${newDate} ${new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })}`,
        lido: false
      });
      saveToDB('anjo_mural_recados', recadosDB);
    }

    // Reset Form
    setNewTitle('');
    setNewDesc('');
    setNewAnexo('');
    setNewImgUrl(PRESET_IMAGES[0].url);
    setSelectedDimensions(['Cognitivo']);
    setSelectedValores([]);
    setIsInesquecivel(false);
    setReplicateToClassroom(false);
    setShowAddForm(false);

    // Trigger window events to update all connected components
    window.dispatchEvent(new Event('db-jornada-update'));
    window.dispatchEvent(new Event('db-mural-update'));
    window.dispatchEvent(new Event('anjo_user_updated'));
    loadJourneyEvents();
  };

  // Compute development dimensions percentages for this child based on recorded events
  const computeDimensionStats = () => {
    const totalEvents = events.length;
    if (totalEvents === 0) return {};

    const counts: Record<string, number> = {
      'Cognitivo': 0,
      'Motor Fino': 0,
      'Motor Amplo': 0,
      'Social/Afetivo': 0,
      'Linguagem': 0
    };

    events.forEach(e => {
      e.dimensoesDesenvolvimento?.forEach(d => {
        if (counts[d] !== undefined) {
          counts[d]++;
        }
      });
    });

    return counts;
  };

  const dimensionCounts = computeDimensionStats();

  const getCategoryBadgeColor = (tipo: JornadaEvent['tipo']) => {
    switch (tipo) {
      case 'foto': return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'atividade': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'evolucao': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'conquista': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'relatorio': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'data_importante': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'rotina': return 'bg-violet-100 text-violet-800 border-violet-200';
      case 'recado': return 'bg-pink-100 text-pink-800 border-pink-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getCategoryLabel = (tipo: JornadaEvent['tipo']) => {
    switch (tipo) {
      case 'foto': return '📸 Foto Histórica';
      case 'atividade': return '🎨 Atividade Pedagógica';
      case 'evolucao': return '🌱 Evolução / Crescimento';
      case 'conquista': return '🏆 Primeira Conquista';
      case 'relatorio': return '📄 Relatório de Progresso';
      case 'data_importante': return '📅 Data Comemorativa';
      case 'rotina': return '😴 Rotina / Diário Escolar';
      case 'recado': return '💬 Mural de Recados';
      default: return '📌 Registro';
    }
  };

  const getDimensionColor = (dim: string) => {
    switch (dim) {
      case 'Cognitivo': return 'bg-teal-500 text-white';
      case 'Motor Fino': return 'bg-pink-500 text-white';
      case 'Motor Amplo': return 'bg-blue-500 text-white';
      case 'Social/Afetivo': return 'bg-purple-500 text-white';
      case 'Linguagem': return 'bg-amber-500 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  const filteredEvents = events.filter(e => filterType === 'todos' || e.tipo === filterType);

  const getStudentClassroom = (name: string) => {
    if (name.includes('Berçário I')) return 'Berçário I - A';
    if (name.includes('Berçário II')) return 'Berçário II';
    if (name.includes('Maternal I')) return 'Maternal I';
    if (name.includes('Maternal II')) return 'Maternal II - A';
    if (name.includes('Jardim I')) return 'Jardim I';
    if (name.includes('Jardim II')) return 'Jardim II';
    return 'Maternal I';
  };

  const studentRoom = getStudentClassroom(idoso.nome);

  // Stats calculation for any child to render their respective tree growth stage
  const calculateStudentStats = (student: Idoso) => {
    let soilBonus = 0;
    const name = student.nome;
    if (name.includes('Maternal') || name.includes('2 Anos') || name.includes('3 Anos')) {
      soilBonus = 20;
    } else if (name.includes('Jardim I') || name.includes('4 Anos')) {
      soilBonus = 45;
    } else if (name.includes('Jardim II') || name.includes('Pré') || name.includes('5 Anos') || name.includes('6 Anos')) {
      soilBonus = 75;
    }

    let score = soilBonus;
    
    const allEvents = getFromDB<JornadaEvent[]>('anjo_jornada_events', []);
    const studentEvents = allEvents.filter(e => e.idosoId === student.id);
    
    const alimentacaoList = getFromDB<any[]>('anjo_alimentacao', []).filter(item => item.idosoId === student.id);
    const hidratacaoList = getFromDB<any[]>('anjo_hidratacao', []).filter(item => item.idosoId === student.id);
    const sonoList = getFromDB<any[]>('anjo_sono', []).filter(item => item.idosoId === student.id);
    const humorList = getFromDB<any[]>('anjo_humor', []).filter(item => item.idosoId === student.id);
    const isActCleared = localStorage.getItem(`anjo_activities_cleared_${student.id}`) === 'true';
    const atividadesList = isActCleared ? [] : getFromDB<any[]>('anjo_atividades', []).filter(item => item.idosoId === student.id);

    const routinePoints = (soilBonus === 0 || soilBonus === 20) ? 2.5 : 1.5;
    score += (alimentacaoList.length + hidratacaoList.length + sonoList.length + humorList.length) * routinePoints;

    atividadesList.forEach(a => {
      score += 4;
      if (a.fotoTrabalhinho) {
        score += 4;
      }
    });

    studentEvents.forEach(e => {
      let eventPoints = 2;
      const text = (e.titulo + ' ' + (e.descricao || '')).toLowerCase();
      if (soilBonus === 0 || soilBonus === 20) {
        if ((e.tipo as string) === 'rotina' || text.includes('sono') || text.includes('mamadeira') || text.includes('fralda') || text.includes('papinha')) {
          eventPoints = 3.5;
        }
      }
      score += eventPoints;
      if (e.imagemUrl) score += 3;
      if (e.inesquecivel) score += 10;
      if (e.valoresVivenciados && e.valoresVivenciados.length > 0) {
        const valueWeight = (soilBonus >= 75) ? 6 : 4;
        score += e.valoresVivenciados.length * valueWeight;
      }
      if (e.likes) {
        score += e.likes * 0.5;
      }
    });

    const finalScore = Math.round(score);
    const minPts = soilBonus;
    const maxPts = soilBonus + 50;
    const progressPercent = Math.min(100, Math.round(((finalScore - minPts) / (maxPts - minPts)) * 100));

    let svgState = 'seed';
    let stageName = 'Semente no Solo';
    if (finalScore >= 110) {
      svgState = 'fruit';
      stageName = 'Árvore de Frutos (Preservação) 🍎';
    } else if (finalScore >= 76) {
      svgState = 'blossom';
      stageName = 'Árvore Frondosa / Florescimento 🌸';
    } else if (finalScore >= 41) {
      svgState = 'roots';
      stageName = 'Raízes Firmes e Folhas Ativas 🌿';
    } else if (finalScore >= 16) {
      svgState = 'sprout';
      stageName = 'Brotinho Crescendo 🌱';
    }

    return {
      score: finalScore,
      progressPercent,
      svgState,
      stageName,
      totalEvents: studentEvents.length,
      totalFrutos: studentEvents.filter(e => e.inesquecivel).length + atividadesList.filter(a => a.fotoTrabalhinho).length
    };
  };

  const getForestStats = () => {
    const allStudents = idososList.filter(s => s.id.startsWith('aluno_'));
    const totalStudents = allStudents.length;

    let totalScore = 0;
    let totalFrutos = 0;
    let sementesCount = 0;
    let brotosCount = 0;
    let rootsCount = 0;
    let floresCount = 0;
    let frutosCount = 0;

    allStudents.forEach(s => {
      const sStats = calculateStudentStats(s);
      totalScore += sStats.progressPercent;
      totalFrutos += sStats.totalFrutos;

      if (sStats.svgState === 'fruit') frutosCount++;
      else if (sStats.svgState === 'blossom') floresCount++;
      else if (sStats.svgState === 'roots') rootsCount++;
      else if (sStats.svgState === 'sprout') brotosCount++;
      else sementesCount++;
    });

    const averageVitality = totalStudents > 0 ? Math.round(totalScore / totalStudents) : 0;

    return {
      totalStudents,
      averageVitality,
      totalFrutos,
      sementesCount,
      brotosCount,
      rootsCount,
      floresCount,
      frutosCount
    };
  };

  const forestStats = getForestStats();

  const [forestFilterClassroom, setForestFilterClassroom] = useState<string>('todos');
  const [forestFilterGrade, setForestFilterGrade] = useState<string>('todos');

  // Print Memory Book
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Printable Memory Book (Overlay View) */}
      <AnimatePresence>
        {isBookMode && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-0 bg-indigo-950/45 backdrop-blur-md z-50 overflow-y-auto p-4 md:p-8 flex justify-center items-start"
            style={{ display: 'flex', minHeight: '100vh' }}
          >
            <div className="album-container bg-[#FFFDF6] text-slate-900 rounded-3xl max-w-4xl w-full p-8 md:p-12 shadow-2xl relative flex flex-col space-y-8 print:p-0 print:shadow-none print:rounded-none border border-amber-200/50 min-h-[500px]">
              
              {/* Close and Actions bar (hidden in print) */}
              <div className="flex justify-between items-center border-b border-amber-250/30 pb-4 print:hidden">
                <button 
                  onClick={() => setIsBookMode(false)}
                  className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-all font-semibold"
                >
                  <X className="w-5 h-5" /> Fechar Visualização
                </button>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all cursor-pointer"
                  >
                    <Printer className="w-4 h-4" /> Imprimir / Salvar PDF
                  </button>
                </div>
              </div>

              {/* COVER PAGE */}
              <div className="flex flex-col items-center justify-center text-center py-16 border-4 border-dashed border-amber-300 rounded-3xl bg-gradient-to-tr from-amber-50 via-emerald-50 to-sky-50 px-6 relative shadow-inner">
                <div className="absolute top-4 left-4 text-amber-500 animate-pulse">
                  <Sparkles className="w-8 h-8 animate-spin" style={{ animationDuration: '6s' }} />
                </div>
                <div className="absolute bottom-4 right-4 text-amber-500">
                  <BookOpen className="w-8 h-8" />
                </div>

                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-amber-400 shadow-md mb-6">
                  <img 
                    src={idoso.foto} 
                    alt={idoso.nome} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight print:text-black">
                  O Álbum da Primeira Infância 📖
                </h1>
                <p className="text-lg font-bold text-slate-800 mt-3 max-w-lg leading-relaxed">
                  A Linda Jornada de Aprendizado, Afeto e Descobertas de uma Vida Inteira
                </p>
                <h2 className="text-3xl font-black text-indigo-900 mt-6 print:text-black">
                  {idoso.nome.split(' (')[0]}
                </h2>
                <p className="text-xs font-extrabold text-indigo-950 bg-[#FFFDF9]/80 border border-indigo-200 px-3 py-1 rounded-full mt-2 uppercase tracking-wider">
                  Sala: {studentRoom} • Ano Letivo 2026
                </p>
                
                <div className="max-w-md mt-8 p-5 bg-[#FFFDF9] rounded-2xl border-2 border-dashed border-amber-200 italic text-slate-800 text-xs font-medium shadow-sm leading-relaxed">
                  "Que estas pequenas lembranças de conquistas diárias, sorrisos, primeiras letras e amizades sinceras na escola fiquem eternamente guardadas no coração de toda a família."
                </div>
              </div>

              {/* PAGE BREAK (for printing) */}
              <div className="page-break" style={{ pageBreakBefore: 'always' }} />

              {/* CHRONOLOGICAL MOMENTS */}
              <div className="space-y-12">
                <h3 className="text-2xl font-bold text-slate-800 border-b pb-2 flex items-center gap-2 border-amber-250/30">
                  <Award className="w-6 h-6 text-indigo-500" /> Registro de Momentos Especiais
                </h3>
                
                <div className="space-y-8">
                  {events.map((e, index) => (
                    <div key={e.id} className="flex flex-col md:flex-row gap-6 border-b border-amber-200/30 pb-8 last:border-0 last:pb-0">
                      {e.imagemUrl && (
                        <div className="w-full md:w-48 h-48 shrink-0 rounded-2xl overflow-hidden border bg-[#FFFDF6] border-amber-200/30 shadow-sm">
                          <img 
                            src={e.imagemUrl} 
                            alt={e.titulo} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getCategoryBadgeColor(e.tipo)}`}>
                            {getCategoryLabel(e.tipo)}
                          </span>
                          <span className="text-xs text-slate-600 font-bold">
                            📅 {new Date(e.data).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <h4 className="text-lg font-black text-slate-900">{e.titulo}</h4>
                        <p className="text-slate-800 text-sm leading-relaxed font-medium">{e.descricao}</p>
                        
                        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                          <div className="flex gap-1">
                            {e.dimensoesDesenvolvimento?.map(dim => (
                              <span key={dim} className="text-[10px] px-2.5 py-1 rounded-md font-bold bg-amber-100/60 text-amber-900 border border-amber-200">
                                {DIMENSION_LABELS[dim] || dim}
                              </span>
                            ))}
                          </div>
                          <p className="text-[10px] font-bold text-slate-500 italic">
                            Registrado por: {e.registradoPor}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* BACK COVER */}
              <div className="border-t border-amber-250/30 pt-8 flex justify-between items-center text-xs text-slate-400">
                <p>Gerado via Plataforma Anjinho Escolar • Todos os Direitos Reservados</p>
                <p>{new Date().toLocaleDateString('pt-BR')}</p>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SELETOR DE VISTAS DA JORNADA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#FFFDF6] border border-amber-250/50 p-4 rounded-3xl shadow-sm">
        <div className="space-y-1">
          <h3 className="text-sm sm:text-base font-black text-indigo-950 flex items-center gap-1.5">
            🌳 O Ecossistema de Cultivo Pedagógico
          </h3>
          <p className="text-[11px] font-semibold text-slate-500">
            Acompanhe a evolução de cada semente ou contemple a harmonia coletiva da nossa escola.
          </p>
        </div>

        <div className="flex bg-amber-50/50 p-1 rounded-2xl border border-amber-200/40 w-full sm:w-auto">
          <button
            onClick={() => setActiveViewTab('individual')}
            className={`flex-1 sm:flex-none py-2 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeViewTab === 'individual'
                ? 'bg-indigo-600 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-800 hover:bg-white/50'
            }`}
          >
            <Leaf className="w-3.5 h-3.5" />
            <span>Árvore de {idoso.nome.split(' (')[0].split(' ')[0]}</span>
          </button>
          <button
            onClick={() => setActiveViewTab('floresta')}
            className={`flex-1 sm:flex-none py-2 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeViewTab === 'floresta'
                ? 'bg-gradient-to-r from-emerald-600 to-indigo-600 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-800 hover:bg-white/50'
            }`}
          >
            <Trees className="w-3.5 h-3.5" />
            <span>A Floresta do Saber®</span>
            <span className="bg-amber-400 text-slate-900 font-extrabold text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-wider scale-95 ml-1">
              MÉTODO
            </span>
          </button>
        </div>
      </div>

      {activeViewTab === 'individual' ? (
        <>
          {/* HEADER HERO PANEL */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 rounded-3xl shadow-xl p-6 md:p-8 text-white">
        
        {/* Floating circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl -ml-16 -mb-16"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-center lg:justify-between gap-6 w-full">
          <div className="flex items-center gap-4 text-center lg:text-left flex-col lg:flex-row">
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-4 border-white/30 shadow-lg shrink-0">
                <img 
                  src={idoso.foto} 
                  alt={idoso.nome} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-amber-400 text-slate-900 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-md animate-bounce">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-center lg:justify-start">
                <span className="bg-amber-400 text-indigo-950 font-black text-[10px] sm:text-xs px-3.5 py-1 rounded-full uppercase tracking-wider shadow-sm border border-amber-300">
                  Exclusivo • Jornada do Anjinho 🌟
                </span>
              </div>
              <h2 className="text-xl sm:text-3xl font-black tracking-tight leading-none mt-1">
                {idoso.nome.split(' (')[0]}
              </h2>
              <p className="text-xs sm:text-sm text-indigo-100 font-semibold">
                Sala: {studentRoom} • Histórico Emocional e Pedagógico Permanente
              </p>
            </div>
          </div>

          {/* Action buttons with full tablet support to prevent cutting off */}
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto justify-center lg:justify-end items-stretch sm:items-center">
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className={`flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl text-sm font-black shadow-xl transition-all cursor-pointer border-2 active:scale-95 ${
                showAddForm
                  ? 'bg-red-500 hover:bg-red-600 text-white border-red-300 ring-4 ring-red-200'
                  : 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-200 ring-4 ring-amber-300/80 hover:scale-103'
              }`}
            >
              {showAddForm ? (
                <>
                  <X className="w-5 h-5 text-white" />
                  <span className="font-extrabold text-white">Fechar Formulário</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 text-indigo-950 stroke-[3]" />
                  <span className="text-indigo-950 font-black tracking-tight text-sm sm:text-base">📸 + Registrar Nova Lembrança</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsBookMode(true)}
              className="flex items-center justify-center gap-2 bg-white/95 hover:bg-white text-indigo-950 font-black px-4 py-3.5 rounded-2xl text-xs sm:text-sm shadow-md transition-all cursor-pointer border border-white/50"
            >
              <BookOpen className="w-4 h-4 text-indigo-600" /> O Álbum da Primeira Infância 📖
            </button>
          </div>
        </div>
      </div>

      {/* TEACHER ADD FORM ACCORDION - Rendered right at top below hero banner for instant visibility */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div 
            ref={formRef}
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="w-full my-4"
          >
            <form onSubmit={handleAddEventSubmit} className="rounded-3xl p-6 border-2 border-amber-300 space-y-4 bg-[#FFFDF6] shadow-xl text-slate-800 ring-4 ring-amber-100">
              <div className="flex justify-between items-center border-b pb-3 border-amber-200">
                <h3 className="text-base font-black flex items-center gap-2 text-indigo-950">
                  <Camera className="w-5 h-5 text-indigo-600 animate-bounce" style={{ animationDuration: '2s' }} /> Cultivar uma Nova Lembrança ou Escrever uma Nova Página da Jornada 📸
                </h3>
                <button 
                  type="button" 
                  onClick={() => setShowAddForm(false)}
                  className="cursor-pointer text-indigo-900 hover:text-red-500 p-1.5 rounded-full hover:bg-slate-100 transition-all"
                  title="Fechar Formulário"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* Title and Category */}
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-slate-700">Título do Momento:</label>
                      <button
                        type="button"
                        onClick={() => toggleListening('title')}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold transition-all cursor-pointer ${
                          isListening && listeningField === 'title'
                            ? 'bg-red-500 text-white animate-pulse shadow-sm' 
                            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100'
                        }`}
                        title={isListening && listeningField === 'title' ? "Parar de ouvir" : "Falar título por voz"}
                      >
                        <Mic className="w-3.5 h-3.5" />
                        {isListening && listeningField === 'title' ? 'Ouvindo... Parar' : 'Falar por Voz'}
                      </button>
                    </div>
                    <input 
                      type="text" 
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Ex: Primeiros passinhos independentes! 👣"
                      className={`w-full border px-3 py-2.5 rounded-xl text-xs font-semibold focus:outline-indigo-500 bg-white text-slate-900 border-slate-200 ${
                        isListening && listeningField === 'title' ? 'ring-2 ring-red-400 bg-red-50/10' : ''
                      }`}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold block mb-1 text-slate-700">Categoria:</label>
                    <select 
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as JornadaEvent['tipo'])}
                      className="w-full border px-3 py-2.5 rounded-xl text-xs font-semibold focus:outline-indigo-500 bg-white text-slate-900 border-slate-200"
                    >
                      <option value="atividade">🎨 Atividade Pedagógica</option>
                      <option value="conquista">🏆 Primeira Conquista / Marco</option>
                      <option value="foto">📸 Foto Histórica / Sorriso</option>
                      <option value="evolucao">🌱 Evolução Pedagógica</option>
                      <option value="data_importante">📅 Data Comemorativa Importante</option>
                      <option value="relatorio">📄 Relatório Integral de Progresso</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold block mb-1 text-slate-700">Data:</label>
                    <input 
                      type="date" 
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full border px-3 py-2.5 rounded-xl text-xs font-semibold focus:outline-indigo-500 bg-white text-slate-900 border-slate-200"
                      required
                    />
                  </div>
                </div>

                {/* Description and dimension tagging */}
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-slate-700">Relato / Descrição Detalhada:</label>
                      <button
                        type="button"
                        onClick={() => toggleListening('desc')}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold transition-all cursor-pointer ${
                          isListening && listeningField === 'desc'
                            ? 'bg-red-500 text-white animate-pulse shadow-sm' 
                            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100'
                        }`}
                        title={isListening && listeningField === 'desc' ? "Parar de ouvir" : "Digitar por voz (Falar)"}
                      >
                        <Mic className="w-3.5 h-3.5" />
                        {isListening && listeningField === 'desc' ? 'Ouvindo... Parar' : 'Falar por Voz'}
                      </button>
                    </div>
                    <textarea 
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      rows={4}
                      placeholder={isListening && listeningField === 'desc' ? "Estou ouvindo... Fale com clareza próximo ao microfone de seu aparelho." : "Relate como foi a conquista, a reação do aluno, as habilidades observadas e o sentimento desse momento..."}
                      className={`w-full border px-3 py-2 rounded-xl text-xs font-semibold focus:outline-indigo-500 bg-white text-slate-900 border-slate-200 ${
                        isListening && listeningField === 'desc' ? 'ring-2 ring-red-400 bg-red-50/10' : ''
                      }`}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold block mb-1 text-slate-700">Habilidades Estimuladas (Tag BNCC):</label>
                    <div className="flex flex-wrap gap-1.5">
                      {['Cognitivo', 'Motor Fino', 'Motor Amplo', 'Social/Afetivo', 'Linguagem'].map(dim => (
                        <button
                          key={dim}
                          type="button"
                          onClick={() => handleToggleDimension(dim)}
                          className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                            selectedDimensions.includes(dim)
                              ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {DIMENSION_LABELS[dim] || dim}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Image selection & Mobile Upload Column */}
                <div className="space-y-4">
                  <div className="space-y-3">
                    <label className="text-xs font-bold block text-slate-700">📸 Foto do Momento (Galeria ou Câmera):</label>
                    
                    {/* Primary Action: Native Mobile File/Gallery Upload & WebRTC */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center justify-center gap-2 py-3 px-3 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-black text-xs rounded-2xl shadow-md transition-all cursor-pointer"
                      >
                        <Upload className="w-4 h-4 shrink-0" /> 📱 Enviar Foto da Galeria / Celular
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />

                      {!isCameraActive ? (
                        <button
                          type="button"
                          onClick={startCamera}
                          className="flex items-center justify-center gap-2 py-3 px-3 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-extrabold text-xs rounded-2xl transition-all cursor-pointer"
                        >
                          <Camera className="w-4 h-4 text-indigo-600 shrink-0" /> Web Câmera ao Vivo 🎥
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="flex items-center justify-center gap-2 py-3 px-3 bg-slate-200 text-slate-800 font-extrabold text-xs rounded-2xl transition-all cursor-pointer"
                        >
                          Cancelar Câmera ✕
                        </button>
                      )}
                    </div>

                    {/* Live WebRTC Camera Stream if activated */}
                    {isCameraActive && (
                      <div className="border-2 border-indigo-300 rounded-2xl p-3 bg-indigo-950 text-white space-y-2 text-center animate-fade-in">
                        <p className="text-xs font-black text-indigo-200 animate-pulse flex items-center justify-center gap-1.5">
                          <Camera className="w-4 h-4 text-emerald-400" /> Câmera Ativa - Posicione o Anjinho e a Atividade
                        </p>
                        <video 
                          ref={videoRef} 
                          className="w-full max-h-56 rounded-xl bg-black object-cover shadow-inner" 
                          playsInline 
                        />
                        <div className="flex gap-2 justify-center pt-1">
                          <button
                            type="button"
                            onClick={capturePhoto}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                          >
                            <Camera className="w-4 h-4" /> Capturar Foto 📸
                          </button>
                        </div>
                      </div>
                    )}

                    {cameraError && (
                      <div className="text-[11px] text-amber-900 bg-amber-50 border border-amber-200 p-2.5 rounded-xl space-y-1">
                        <p className="font-bold">💡 Dica para Celular:</p>
                        <p>{cameraError}</p>
                        <p className="text-[10px] text-indigo-800 font-bold">Use o botão azul "📱 Enviar Foto da Galeria / Celular" acima para abrir a câmera ou galeria do seu aparelho diretamente!</p>
                      </div>
                    )}

                    {/* Display PROMINENT high-visibility photo preview on mobile & desktop */}
                    {newImgUrl ? (
                      <div className="rounded-2xl border-2 border-indigo-200 bg-white p-3 shadow-sm space-y-2 animate-fade-in">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-black tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100 flex items-center gap-1">
                            ✓ Foto Pronta para Postar
                          </span>
                          <button
                            type="button"
                            onClick={() => setNewImgUrl('')}
                            className="text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:underline px-2 cursor-pointer flex items-center gap-1"
                          >
                            Remover Foto ✕
                          </button>
                        </div>

                        <div className="w-full h-48 sm:h-56 rounded-xl overflow-hidden border border-slate-200 relative bg-slate-100">
                          <img 
                            src={newImgUrl} 
                            alt="Pré-visualização do momento"
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer" 
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-2xl text-center space-y-1">
                        <p className="text-xs font-bold text-amber-900">Nenhuma foto selecionada ainda</p>
                        <p className="text-[10px] text-slate-500">Clique em "📱 Enviar Foto da Galeria / Celular" para escolher do seu celular ou selecione uma imagem rápida abaixo.</p>
                      </div>
                    )}

                    {/* Preset Image Gallery Options */}
                    <div className="pt-2">
                      <label className="text-[10px] font-bold block mb-1 text-slate-600">Ou escolha uma ilustração pedagógica rápida:</label>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 p-1 border rounded-xl bg-white border-slate-200">
                        {PRESET_IMAGES.map((img) => (
                          <button
                            key={img.label}
                            type="button"
                            onClick={() => setNewImgUrl(img.url)}
                            className={`relative rounded-lg overflow-hidden border-2 h-14 transition-all cursor-pointer ${
                              newImgUrl === img.url ? 'border-amber-400 scale-95 ring-2 ring-amber-400 shadow-md' : 'border-slate-100 hover:border-indigo-300'
                            }`}
                            title={img.label}
                          >
                            <img src={img.url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom URL Option */}
                    <div className="pt-1">
                      <label className="text-[10px] font-semibold text-slate-500">Ou cole um link direto de imagem (URL):</label>
                      <input
                        type="url"
                        value={newImgUrl}
                        onChange={(e) => setNewImgUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full border px-2.5 py-1.5 rounded-xl text-[10px] focus:outline-indigo-500 bg-white text-slate-900 border-slate-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold block mb-1 text-slate-700">Nome do Anexo (PDF/Certificado opcional):</label>
                    <input 
                      type="text" 
                      value={newAnexo}
                      onChange={(e) => setNewAnexo(e.target.value)}
                      placeholder="Ex: certificado_pintor_mirim.pdf"
                      className="w-full border px-3 py-2 rounded-xl text-xs font-semibold focus:outline-indigo-500 bg-white text-slate-900 border-slate-200"
                    />
                  </div>
                </div>

              </div>

              {/* VALORES VIVENCIADOS & DESTAQUE (Full width row inside form) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5 border-t border-amber-200/40">
                {/* Valores Vivenciados Checklist */}
                <div className="space-y-2">
                  <label className="text-xs font-bold block text-slate-700 flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    🌟 Valores Vivenciados (Desenvolvimento Humano):
                  </label>
                  <p className="text-[10px] text-slate-500 font-semibold mb-2">
                    Selecione quais valores humanos o anjinho demonstrou durante este momento especial:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'Compartilhou', label: '🤝 Compartilhou' },
                      { id: 'Demonstrou empatia', label: '❤️ Empatia' },
                      { id: 'Esperou sua vez', label: '⏳ Esperou vez' },
                      { id: 'Consolou um colega', label: '🤗 Consolou' },
                      { id: 'Foi gentil', label: '✨ Foi gentil' },
                      { id: 'Cooperou', label: '🤝 Cooperou' },
                      { id: 'Respeitou regras', label: '📜 Respeitou' },
                    ].map(val => {
                      const selected = selectedValores.includes(val.id);
                      return (
                        <button
                          key={val.id}
                          type="button"
                          onClick={() => {
                            if (selected) {
                              setSelectedValores(selectedValores.filter(v => v !== val.id));
                            } else {
                              setSelectedValores([...selectedValores, val.id]);
                            }
                          }}
                          className={`text-[10px] font-bold px-3 py-2 rounded-xl border text-left flex items-center gap-1.5 transition-all cursor-pointer ${
                            selected
                              ? 'bg-amber-100 border-amber-450 text-amber-900 shadow-3xs font-extrabold'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-amber-50/30'
                          }`}
                        >
                          <span className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[8px] shrink-0 ${
                            selected ? 'bg-amber-500 border-amber-500 text-white' : 'border-slate-300 bg-white'
                          }`}>
                            {selected && '✓'}
                          </span>
                          <span className="truncate">{val.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Destacar como Momento Inesquecivel */}
                <div className="space-y-4 flex flex-col justify-center bg-indigo-50/40 p-4 rounded-2xl border border-indigo-100">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="inesquecivel-checkbox"
                      checked={isInesquecivel}
                      onChange={(e) => setIsInesquecivel(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer mt-1"
                    />
                    <div className="space-y-1">
                      <label htmlFor="inesquecivel-checkbox" className="text-xs font-black text-indigo-950 flex items-center gap-1.5 cursor-pointer">
                        <MessageSquare className="w-4 h-4 text-indigo-500" />
                        💬 Destacar como "Momento Inesquecível"
                      </label>
                      <p className="text-[10px] text-slate-700 leading-relaxed font-semibold">
                        Selecione isso se este for um registro que merece ser lembrado para sempre. Ele aparecerá com destaque especial e design de recordação no álbum.
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-indigo-100/60 pt-3 flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="replicar-checkbox"
                      checked={replicateToClassroom}
                      onChange={(e) => setReplicateToClassroom(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer mt-1"
                    />
                    <div className="space-y-1">
                      <label htmlFor="replicar-checkbox" className="text-xs font-black text-indigo-950 flex items-center gap-1.5 cursor-pointer">
                        <Users className="w-4 h-4 text-emerald-600" />
                        👥 Replicar para a Classe Toda ({studentRoom})
                      </label>
                      <p className="text-[10px] text-slate-700 leading-relaxed font-semibold">
                        Selecione para salvar automaticamente esta mesma atividade pedagógica na linha do tempo de <strong>todos os alunos</strong> desta mesma turma de forma simultânea.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-amber-100">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 hover:bg-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer bg-slate-100 text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Cultivar Lembrança na Linha do Tempo
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* COMPILATION OF DIMENSIONS (BENTO GRID HEADER ITEM) */}
      <div className="bg-[#FFFCEB] border border-amber-200/50 text-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-4">
          <div>
            <h3 className="text-base font-black flex items-center gap-2 text-slate-800">
              <Smile className="w-5 h-5 text-indigo-500" /> Desenvolvimento Integral do Anjinho
            </h3>
            <p className="text-[11px] font-semibold mt-0.5 text-slate-505">
              Áreas de crescimento acompanhadas de perto pelas professoras com base na pedagogia afetiva.
            </p>
          </div>
          <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-100/60 text-amber-900 border border-amber-250/50">
            Acompanhamento BNCC Ativo
          </span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {['Cognitivo', 'Motor Fino', 'Motor Amplo', 'Social/Afetivo', 'Linguagem'].map(dim => {
            const count = dimensionCounts[dim] || 0;
            const percentage = events.length > 0 ? Math.min(100, Math.round((count / events.length) * 100)) : 0;
            
            return (
              <div key={dim} className="p-4 rounded-2xl border flex flex-col justify-between space-y-2 bg-[#FFFDF9] border-amber-200/30 shadow-3xs">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-black text-slate-700">{DIMENSION_LABELS[dim] || dim}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                    {count}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-slate-800">{percentage}%</span>
                    <span className="text-[9px] text-slate-400 font-bold">foco</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden bg-amber-100/40">
                    <div 
                      className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] mt-3 italic text-slate-600 font-semibold">
          * A correspondência com os códigos e relatórios técnicos da BNCC (Base Nacional Comum Curricular) está registrada nos boletins e relatórios escolares das professoras.
        </p>
      </div>

      {/* 🌳 ÁRVORE DA INFÂNCIA (MÉTODO PROPRIETÁRIO) */}
      <div className="bg-[#FFFDF6] border-2 border-amber-200 text-slate-800 rounded-3xl p-6 md:p-8 shadow-md relative overflow-hidden">
        {/* Raining Hearts, Butterflies, Birds or Sparkles on the tree card container */}
        {rainingHearts.map((item) => (
          <div
            key={item.id}
            className="absolute text-xl animate-bounce pointer-events-none z-20 transition-transform"
            style={{
              left: `${item.left}%`,
              top: `-25px`,
              animationDelay: `${item.delay}s`,
              animationDuration: '2.8s',
              transform: 'translateY(110vh)'
            }}
          >
            {item.emoji || '❤️'}
          </div>
        ))}

        {/* Feedback Banner when parent reacts */}
        {lastAfetoFeedback && (
          <div className="mb-4 bg-gradient-to-r from-amber-100 via-rose-50 to-indigo-100 border border-amber-300/80 rounded-2xl p-3.5 flex items-center justify-between shadow-xs animate-pulse">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">{lastAfetoFeedback.emoji}</span>
              <div>
                <p className="text-xs font-black text-indigo-950">
                  {lastAfetoFeedback.label}
                </p>
                <p className="text-[11px] font-semibold text-slate-700">
                  {lastAfetoFeedback.text}
                </p>
              </div>
            </div>
            <span className="text-[10px] uppercase font-black bg-white/80 text-amber-900 px-2.5 py-1 rounded-full border border-amber-200">
              Árvore Regada ✨
            </span>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8 items-center">
          
          {/* Left Visual Area: Interactive SVG tree */}
          <div className="w-full lg:w-1/3 flex flex-col items-center justify-center relative bg-gradient-to-b from-sky-50 to-emerald-50 rounded-2xl p-6 border border-emerald-100 min-h-[280px]">
            {/* Ambient sun/light effect */}
            <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-amber-200/50 blur-lg animate-pulse" />
            
            {/* The Tree SVG */}
            <svg viewBox="0 0 200 200" className="w-48 h-48 drop-shadow-md relative z-10 transition-all duration-500">
              {/* Sky and Ground */}
              <path d="M 20,180 Q 100,165 180,180" fill="none" stroke="#D1FAE5" strokeWidth="8" strokeLinecap="round" />
              <path d="M 10,180 Q 100,160 190,180" fill="none" stroke="#86EFAC" strokeWidth="4" strokeLinecap="round" />
              
              {/* 1. SEED STATE */}
              {stats.station.svgState === 'seed' && (
                <>
                  {/* Seed in soil */}
                  <circle cx="100" cy="170" r="6" fill="#78350F" />
                  {/* Sprout breaking soil */}
                  <path d="M 100,170 Q 95,150 102,140" fill="none" stroke="#22C55E" strokeWidth="4" strokeLinecap="round" />
                  <path d="M 102,140 Q 112,138 114,144" fill="#4ADE80" stroke="#166534" strokeWidth="1" />
                  <circle cx="102" cy="140" r="2" fill="#FACC15" className="animate-ping" />
                </>
              )}

              {/* 2. SPROUT STATE */}
              {stats.station.svgState === 'sprout' && (
                <>
                  {/* Small trunk / main stem */}
                  <path d="M 100,175 Q 98,140 100,120" fill="none" stroke="#78350F" strokeWidth="6" strokeLinecap="round" />
                  {/* Left leaf */}
                  <path d="M 99,145 Q 80,135 78,145 Q 92,152 99,145" fill="#4ADE80" stroke="#166534" strokeWidth="1.5" />
                  {/* Right leaf */}
                  <path d="M 100,135 Q 120,125 122,135 Q 108,142 100,135" fill="#22C55E" stroke="#14532D" strokeWidth="1.5" />
                  {/* Top leaf */}
                  <path d="M 100,120 Q 90,100 100,95 Q 110,100 100,120" fill="#86EFAC" stroke="#166534" strokeWidth="1" />
                </>
              )}

              {/* 3. ROOTS STATE */}
              {stats.station.svgState === 'roots' && (
                <>
                  {/* Tree trunk */}
                  <path d="M 100,175 Q 98,140 100,110" fill="none" stroke="#78350F" strokeWidth="10" strokeLinecap="round" />
                  {/* Branches */}
                  <path d="M 99,135 Q 75,120 65,115" fill="none" stroke="#78350F" strokeWidth="5" strokeLinecap="round" />
                  <path d="M 100,125 Q 125,110 135,105" fill="none" stroke="#78350F" strokeWidth="5" strokeLinecap="round" />
                  
                  {/* Canopy layers */}
                  <circle cx="100" cy="90" r="25" fill="#22C55E" opacity="0.9" />
                  <circle cx="75" cy="110" r="20" fill="#15803D" opacity="0.85" />
                  <circle cx="125" cy="100" r="20" fill="#166534" opacity="0.85" />
                  
                  {/* Roots visible underground (stylized) */}
                  <path d="M 100,175 Q 90,190 85,195" fill="none" stroke="#D97706" strokeWidth="3" strokeLinecap="round" />
                  <path d="M 100,175 Q 110,190 115,195" fill="none" stroke="#D97706" strokeWidth="3" strokeLinecap="round" />
                </>
              )}

              {/* 4. BLOSSOM STATE */}
              {stats.station.svgState === 'blossom' && (
                <>
                  {/* Tree trunk & branch structure */}
                  <path d="M 100,175 Q 98,130 100,100" fill="none" stroke="#78350F" strokeWidth="12" strokeLinecap="round" />
                  <path d="M 99,125 Q 70,110 55,105" fill="none" stroke="#78350F" strokeWidth="6" strokeLinecap="round" />
                  <path d="M 100,115 Q 130,95 145,90" fill="none" stroke="#78350F" strokeWidth="6" strokeLinecap="round" />
                  
                  {/* Lush green canopy */}
                  <circle cx="100" cy="80" r="30" fill="#22C55E" opacity="0.95" />
                  <circle cx="70" cy="100" r="25" fill="#15803D" opacity="0.9" />
                  <circle cx="130" cy="90" r="25" fill="#166534" opacity="0.9" />
                  <circle cx="100" cy="105" r="22" fill="#4ADE80" opacity="0.9" />

                  {/* Soft beautiful pink flowers (blossoms) */}
                  <circle cx="90" cy="70" r="5" fill="#F472B6" />
                  <circle cx="90" cy="70" r="2" fill="#FDE047" />
                  
                  <circle cx="120" cy="80" r="5" fill="#F472B6" />
                  <circle cx="120" cy="80" r="2" fill="#FDE047" />

                  <circle cx="70" cy="95" r="5" fill="#F472B6" />
                  <circle cx="70" cy="95" r="2" fill="#FDE047" />

                  <circle cx="110" cy="105" r="5" fill="#F472B6" />
                  <circle cx="110" cy="105" r="2" fill="#FDE047" />
                  
                  {/* Floating sparkles */}
                  <circle cx="60" cy="60" r="2" fill="#FFF" className="animate-pulse" />
                  <circle cx="140" cy="70" r="1.5" fill="#FFF" className="animate-ping" />
                </>
              )}

              {/* 5. FRUIT STATE */}
              {stats.station.svgState === 'fruit' && (
                <>
                  {/* Grand trunk & branch structure */}
                  <path d="M 100,175 Q 98,130 100,100" fill="none" stroke="#78350F" strokeWidth="14" strokeLinecap="round" />
                  <path d="M 99,120 Q 65,100 50,95" fill="none" stroke="#78350F" strokeWidth="7" strokeLinecap="round" />
                  <path d="M 100,110 Q 135,85 150,80" fill="none" stroke="#78350F" strokeWidth="7" strokeLinecap="round" />
                  
                  {/* Grand Canopy */}
                  <circle cx="100" cy="75" r="35" fill="#166534" />
                  <circle cx="65" cy="95" r="28" fill="#15803D" />
                  <circle cx="135" cy="85" r="28" fill="#22C55E" />
                  <circle cx="100" cy="100" r="25" fill="#4ADE80" opacity="0.95" />

                  {/* Flowers */}
                  <circle cx="85" cy="65" r="4" fill="#F472B6" />
                  <circle cx="115" cy="75" r="4" fill="#F472B6" />
                  <circle cx="130" cy="95" r="4" fill="#F472B6" />

                  {/* Shiny Red Apples (fruits) */}
                  <circle cx="100" cy="60" r="6" fill="#EF4444" className="animate-pulse" />
                  <circle cx="75" cy="85" r="6" fill="#EF4444" />
                  <circle cx="120" cy="70" r="6" fill="#EF4444" />
                  <circle cx="90" cy="90" r="6" fill="#EF4444" />
                  <circle cx="110" cy="95" r="6" fill="#EF4444" />
                  
                  {/* Floating sparkles */}
                  <circle cx="50" cy="50" r="2.5" fill="#FACC15" className="animate-bounce" />
                  <circle cx="150" cy="60" r="2" fill="#FACC15" className="animate-ping" />
                </>
              )}
            </svg>
            
            {/* Action button "Regar com Amor" (interactive watering) */}
            <div className="flex flex-col items-center w-full">
              <button
                onClick={handleRegar}
                className={`mt-4 w-full max-w-[200px] px-4 py-2 rounded-xl text-xs font-black shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  watering 
                    ? 'bg-blue-500 text-white animate-pulse' 
                    : 'bg-white text-indigo-900 hover:bg-blue-50 border border-blue-100'
                }`}
              >
                💧 {watering ? 'Regando com amor...' : 'Regar com Amor'}
              </button>

              {/* Tree conversational speech bubble - The Character Narrator */}
              <div className="mt-4 w-full max-w-[240px] bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-xs font-semibold text-indigo-950 relative shadow-3xs text-center">
                <div className="absolute -top-1.5 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-indigo-50 border-t border-l border-indigo-100 rotate-45" />
                <p className="relative z-10 leading-relaxed font-semibold italic text-slate-700">
                  {getTreeMessage()}
                </p>
              </div>
            </div>
          </div>

          {/* Right Info Area: Estações, Vigor de Cultivo, Breakdown (Camada Visível de Emoção) */}
          <div className="flex-1 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/50 pb-3">
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-200/40">
                  Método Árvore da Infância® 🌳
                </span>
                <h3 className="text-xl font-black text-indigo-950 mt-1.5 flex items-center gap-2">
                  A Árvore da Infância de {idoso.nome.split(' (')[0]}
                </h3>
                <span className="inline-block mt-1 text-[9px] font-extrabold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-150 uppercase tracking-wider">
                  🍂 {stats.cycleName} • Estação da Vida Ativa
                </span>
              </div>
              <button 
                onClick={() => setShowMethodModal(true)}
                className="text-xs font-black text-indigo-600 hover:text-indigo-800 transition-all cursor-pointer flex items-center gap-1 self-start sm:self-center"
              >
                <Info className="w-4 h-4" /> Entenda o Método
              </button>
            </div>

            {/* Current Station & Metaphor */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-8 space-y-1">
                <p className="text-[10px] font-black uppercase text-indigo-500 tracking-wider">Estação do Desenvolvimento</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{stats.station.emoji}</span>
                  <span className="text-lg font-black text-indigo-950">{stats.station.name}</span>
                </div>
                <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                  {stats.station.desc}
                </p>
                <p className="text-[11px] italic font-semibold text-indigo-850/80">
                  "{stats.station.metaphor}"
                </p>
              </div>

              {/* Dynamic Score widget (Qualitative / Emotional) */}
              <div className="md:col-span-4 bg-gradient-to-br from-[#FFFDF9] to-[#FFFCEB] border border-amber-200 rounded-2xl p-4 text-center space-y-1.5 shadow-3xs">
                <span className="text-[9px] uppercase font-black text-amber-800 tracking-widest block">Vitalidade de Cultivo</span>
                <div className={`inline-block text-[10px] font-black px-2.5 py-1 rounded-full border ${stats.labelColor} uppercase tracking-wider`}>
                  {stats.cultivoLabel}
                </div>
                <span className="text-[9px] font-extrabold text-slate-400 block uppercase">Solo Nutrido</span>
              </div>
            </div>

            {/* Progress to next Stage Maturation */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between items-center text-[10px] font-black text-slate-500">
                <span>Raízes do Ciclo</span>
                <span className="text-indigo-600">Florescimento Pleno</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden border border-amber-100/60 relative">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-indigo-600 transition-all duration-1000"
                  style={{ width: `${stats.progressPercent}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-indigo-950/80">
                  {stats.progressPercent}% Cultivada neste Ciclo
                </span>
              </div>
            </div>

            {/* Quality breakdown tags */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 font-sans">
              <div className="bg-[#FFFDF9] border border-amber-200/40 rounded-xl p-2.5 text-center shadow-3xs">
                <span className="text-xs block">🍃</span>
                <span className="text-sm font-black text-slate-900 block">{stats.totalMoments}</span>
                <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Folhas Cultivadas</span>
              </div>

              <div className="bg-[#FFFDF9] border border-amber-200/40 rounded-xl p-2.5 text-center shadow-3xs">
                <span className="text-xs block">🌸</span>
                <span className="text-sm font-black text-slate-900 block">{stats.totalValores}</span>
                <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Valores Desabrochados</span>
              </div>

              <div className="bg-[#FFFDF9] border border-amber-200/40 rounded-xl p-2.5 text-center shadow-3xs">
                <span className="text-xs block">🍎</span>
                <span className="text-sm font-black text-slate-900 block">{stats.totalFrutos}</span>
                <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Frutos Colhidos</span>
              </div>

              <div className="bg-[#FFFDF9] border border-amber-200/40 rounded-xl p-2.5 text-center shadow-3xs">
                <span className="text-xs block">❤️</span>
                <span className="text-sm font-black text-slate-900 block">{stats.totalLikes}</span>
                <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Gestos de Afeto</span>
              </div>

              <div className="bg-[#FFFDF9] border border-amber-200/40 rounded-xl p-2.5 text-center shadow-3xs">
                <span className="text-xs block">💧</span>
                <span className="text-sm font-black text-slate-900 block">{stats.totalRegadas}</span>
                <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Regadas de Amor</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* METHOD EXPLANATION MODAL */}
      <AnimatePresence>
        {showMethodModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-indigo-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-[#FFFDF6] border border-amber-200 text-slate-800 rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl relative space-y-4"
            >
              <button 
                onClick={() => setShowMethodModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-2 border-b border-amber-200/50 pb-4">
                <span className="text-4xl block">🌳</span>
                <h3 className="text-lg font-black text-indigo-950">Método Árvore da Infância®</h3>
                <p className="text-xs text-indigo-600 font-black uppercase tracking-wider">A Filosofia e Arquitetura do Nosso Cultivo</p>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed max-h-[350px] overflow-y-auto pr-2">
                <p className="font-semibold text-slate-800">
                  O <strong>Método Árvore da Infância®</strong> é uma abordagem pedagógica proprietária do Anjinho Escolar estruturada em duas camadas complementares, criada para respeitar a individualidade de cada criança:
                </p>

                <div className="space-y-3 font-sans text-xs">
                  {/* Camada Visível */}
                  <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/40 space-y-1">
                    <h4 className="font-extrabold text-amber-900 uppercase text-[10px] flex items-center gap-1.5">
                      🌸 Camada Visível (Afetiva & Narrativa)
                    </h4>
                    <p className="text-slate-700 leading-relaxed">
                      Livre de rankings, notas frias ou tabelas competitivas de pontuação. Pais e professores contemplam apenas o amadurecimento natural da árvore nas **Estações da Vida** e escutam a voz poética da própria Árvore, que reflete marcos e afeto.
                    </p>
                  </div>

                  {/* Camada Oculta */}
                  <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 space-y-1">
                    <h4 className="font-extrabold text-indigo-900 uppercase text-[10px] flex items-center gap-1.5">
                      ⚖️ Camada Oculta (Inteligência & Equidade)
                    </h4>
                    <p className="text-slate-700 leading-relaxed">
                      Um motor silencioso alinhado com a **BNCC** equilibra as ações:
                    </p>
                    <ul className="list-disc pl-4 space-y-1 mt-1 text-slate-600">
                      <li><strong>Berçário & Maternal:</strong> O cuidado essencial (sono, alimentação, higiene) recebe pesos multiplicadores máximos para consagrar a rotina vital.</li>
                      <li><strong>Pré-Escola & Jardim:</strong> Os marcos socioemocionais (gentileza, cooperação, autonomia) tornam-se o vetor central de maturidade da Árvore.</li>
                      <li><strong>Preservação:</strong> A árvore nunca reseta. Ela amadurece continuamente ao longo de todos os anos letivos.</li>
                    </ul>
                  </div>
                </div>

                <p className="text-xs pt-2 border-t border-amber-200/40 italic text-slate-500 text-center">
                  "Toda criança é uma semente única. A família planta, a escola cultiva e o Anjinho Escolar preserva essa história." 🌳💙
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setShowMethodModal(false)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-2.5 rounded-xl text-xs sm:text-sm shadow-sm transition-all cursor-pointer text-center"
                >
                  Entendi e Quero Cultivar!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DIÁRIO INTELIGENTE & CÁPSULA DO TEMPO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* DIÁRIO INTELIGENTE */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100/40 border border-amber-200/50 text-amber-950 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-[10px] px-3 py-1 rounded-full uppercase tracking-wider bg-amber-100 text-amber-900">
                Exclusivo • Narrativa Afetiva 📝
              </span>
              <span className="text-xs font-semibold text-amber-900/75 font-bold">Mensagem de Hoje</span>
            </div>
            
            <h3 className="text-lg font-black flex items-center gap-2 text-amber-950">
              O Diário de Crescimento do Anjinho 📖
            </h3>
            
            <p className="text-xs font-semibold leading-relaxed text-amber-900/70">
              Com base no histórico real de conquistas do seu filho, criamos uma narrativa aconchegante para ler em família ou compartilhar no grupo com os avós.
            </p>
            
            {/* The Diary content itself styled like a gorgeous book page */}
            <div className="rounded-2xl p-4 md:p-5 text-xs shadow-inner italic font-serif leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap border bg-[#FFFDF9]/95 border-amber-100 text-slate-700">
              {generateSmartDiary(idoso.nome, events)}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                const textShare = generateSmartDiary(idoso.nome, events);
                navigator.clipboard.writeText(textShare);
                setCopiedDiary(true);
                setTimeout(() => setCopiedDiary(false), 2000);
              }}
              className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer shadow-sm"
            >
              {copiedDiary ? (
                <>
                  <Check className="w-4 h-4 text-slate-950" /> Copiado!
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 text-slate-950" /> Copiar Diário Afetivo
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                const textShare = generateSmartDiary(idoso.nome, events);
                window.open(`https://wa.me/?text=${encodeURIComponent(textShare)}`, '_blank');
              }}
              className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white font-black py-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer shadow-sm"
            >
              <Share2 className="w-4 h-4" /> Enviar para a Família
            </button>
          </div>
        </div>

        {/* CÁPSULA DO TEMPO */}
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/40 border border-indigo-200/50 text-indigo-950 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-[10px] px-3 py-1 rounded-full uppercase tracking-wider bg-indigo-100 text-indigo-950">
                Para Sempre • Recordação Eterna ⏳
              </span>
              <span className="text-xs font-extrabold text-indigo-650">Autobiografia Escolar</span>
            </div>
            
            <h3 className="text-lg font-black flex items-center gap-2 text-indigo-950">
              O Legado da Primeira Infância ⏳
            </h3>
            
            <p className="text-xs font-semibold leading-relaxed text-indigo-900/85">
              Parabéns! Durante estes anos de Educação Infantil, registramos e organizamos cada traço da linda jornada de <strong className="text-indigo-950 font-black">{idoso.nome.split(' (')[0]}</strong> para que fiquem guardados para sempre na história da família:
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="border rounded-xl p-3 text-center space-y-1 bg-[#FFFDF9]/80 border-indigo-100/40 shadow-3xs">
                <p className="text-2xl font-black text-indigo-600">{events.length}</p>
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Momentos Salvos</p>
              </div>
              <div className="border rounded-xl p-3 text-center space-y-1 bg-[#FFFDF9]/80 border-indigo-100/40 shadow-3xs">
                <p className="text-2xl font-black text-teal-600">{events.filter(e => e.tipo === 'foto').length}</p>
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Fotografias</p>
              </div>
              <div className="border rounded-xl p-3 text-center space-y-1 bg-[#FFFDF9]/80 border-indigo-100/40 shadow-3xs">
                <p className="text-2xl font-black text-pink-600">{events.filter(e => e.tipo === 'atividade').length}</p>
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Atividades de Arte</p>
              </div>
              <div className="border rounded-xl p-3 text-center space-y-1 bg-[#FFFDF9]/80 border-indigo-100/40 shadow-3xs">
                <p className="text-2xl font-black text-amber-500">{events.filter(e => e.tipo === 'conquista').length}</p>
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Dias de Descoberta</p>
              </div>
            </div>

            <p className="text-[11px] font-semibold leading-relaxed text-indigo-900/80 pt-1 text-center">
              Muito mais que comunicação. Um patrimônio digital seguro e inesquecível da sua família.
            </p>
          </div>

          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={() => setIsBookMode(true)}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer shadow-sm"
            >
              <BookOpen className="w-4 h-4 text-white" /> Baixar Álbum da Primeira Infância (Gratuito)
            </button>
            <div className="p-3 text-center text-[10px] font-bold italic text-indigo-900/70">
              "Obrigado por permitir que o Anjinho Escolar acompanhasse essa linda jornada." 💙
            </div>
          </div>
        </div>

      </div>

      {/* SEÇÃO FILOSOFIA DE VALOR & POSICIONAMENTO (MÉTODO L.I.V.R.O. + 3 PILARES + CARTA PRO FUTURO) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CARD 1: OS TRÊS PILARES DA MARCA */}
        <div className="bg-[#FFFDF6] border border-amber-250/65 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-[9px] px-2.5 py-1 rounded-full uppercase tracking-wider bg-amber-100 text-amber-900">
                Nosso Posicionamento 🌟
              </span>
              <span className="text-[10px] font-bold text-slate-400">Anjinho Escolar</span>
            </div>
            
            <h3 className="text-base font-black text-indigo-950 flex items-center gap-1.5">
              <Smile className="w-5 h-5 text-indigo-500" /> Os 3 Pilares da Nossa Marca
            </h3>
            
            <p className="text-xs text-slate-700 leading-relaxed font-semibold">
              Não somos uma simples agenda digital. Nosso propósito diário se apoia em três pilares integrados que preservam a magia da infância:
            </p>

            <div className="space-y-3 pt-1">
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-amber-200/30">
                <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center shrink-0 text-xs">
                  📘
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">Memórias</h4>
                  <p className="text-[10px] text-slate-600 leading-relaxed font-semibold">Cada dia na escola é uma história inesquecível que merece ser eternizada.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-amber-200/30">
                <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center shrink-0 text-xs">
                  ❤️
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">Relacionamento</h4>
                  <p className="text-[10px] text-slate-600 leading-relaxed font-semibold">Fortalecemos a parceria ativa e a confiança mútua entre escola e família.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-amber-200/30">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0 text-xs">
                  🌱
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">Desenvolvimento</h4>
                  <p className="text-[10px] text-slate-600 leading-relaxed font-semibold">Acompanhamos cada pequena conquista como parte de um lindo legado.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: MÉTODO L.I.V.R.O. INTERATIVO */}
        <div className="bg-[#FFFDF6] border border-amber-250/65 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-[9px] px-2.5 py-1 rounded-full uppercase tracking-wider bg-indigo-50 text-indigo-905">
                Filosofia Exclusiva 📖
              </span>
              <span className="text-[10px] font-bold text-indigo-900">Método L.I.V.R.O.</span>
            </div>
            
            <h3 className="text-base font-black text-indigo-950 flex items-center gap-1.5">
              <BookOpen className="w-5 h-5 text-indigo-500" /> O Método L.I.V.R.O.
            </h3>
            
            <p className="text-xs text-slate-700 leading-relaxed font-semibold">
              Nossa metodologia autoral de preservação da infância. Toque nas letras para ver a aplicação prática:
            </p>

            <div className="space-y-1.5 pt-1">
              {[
                { l: 'L', name: 'Lembrar', desc: 'Registrar cada marco ou pequena descoberta e transformá-la em recordação.' },
                { l: 'I', name: 'Inspirar', desc: 'Evidenciar o progresso e o brilho único da criança dia após dia.' },
                { l: 'V', name: 'Valorizar', desc: 'Envolver a família no ecossistema emocional do desenvolvimento do filho.' },
                { l: 'R', name: 'Registrar', desc: 'Criar uma linha do tempo afetiva e permanente para toda a vida.' },
                { l: 'O', name: 'Organizar', desc: 'Reunir fotografias, artes e relatos em um acervo pedagógico seguro.' }
              ].map((item) => {
                const isExpanded = expandedMethod === item.l;
                return (
                  <div 
                    key={item.l}
                    onClick={() => setExpandedMethod(item.l)}
                    className={`p-2 rounded-xl border transition-all cursor-pointer ${
                      isExpanded 
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm' 
                        : 'bg-white border-amber-200/50 text-slate-805 hover:bg-amber-50/45'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-black ${
                          isExpanded ? 'bg-amber-400 text-slate-900' : 'bg-indigo-50 text-indigo-700'
                        }`}>
                          {item.l}
                        </span>
                        <span className="text-xs font-black">{item.name}</span>
                      </div>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </div>
                    {isExpanded && (
                      <p className="text-[10px] mt-1 font-semibold leading-relaxed pl-7 text-indigo-100">
                        {item.desc}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CARD 3: CARTA PARA O FUTURO */}
        <div className="bg-gradient-to-br from-indigo-950 to-[#2A2359] border border-indigo-900 text-white rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-[9px] px-2.5 py-1 rounded-full uppercase tracking-wider bg-amber-400 text-indigo-950">
                Memória Eterna ⏳
              </span>
              <span className="text-[10px] font-bold text-indigo-200">Geração Inteligente</span>
            </div>
            
            <h3 className="text-base font-black text-amber-300 flex items-center gap-1.5">
              <Gift className="w-5 h-5 text-amber-400" /> A Carta para o Futuro
            </h3>
            
            <p className="text-xs text-indigo-100 leading-relaxed font-semibold">
              Ao concluir a primeira infância na escola, geramos uma linda carta de despedida e gratidão para ser lida e revivida no futuro!
            </p>

            <div className="p-3.5 rounded-2xl border-2 border-dashed border-indigo-550/40 bg-indigo-900/40 text-center space-y-2 relative overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl opacity-10 select-none">
                ✉️
              </div>
              <p className="text-[10px] italic text-indigo-200 font-semibold leading-relaxed relative z-10">
                "Hoje você encerra este capítulo lindo na Educação Infantil. Que você guarde sempre no coração as risadas, os desenhos e a magia que viveu aqui..."
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowLetterModal(true)}
            className="w-full flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-500 text-indigo-950 font-black py-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer shadow-md"
          >
            <Gift className="w-4 h-4 text-indigo-950" /> Abrir Carta de {idoso.nome.split(' (')[0]} ✉️
          </button>
        </div>

      </div>

      {/* FILTER BUTTONS AND COUNTER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 rounded-2xl border bg-[#FFFDF6] border-amber-250/50 shadow-xs">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'todos', label: 'Todos os Momentos 🌟' },
            { id: 'conquista', label: '🏆 Conquistas' },
            { id: 'atividade', label: '🎨 Atividades' },
            { id: 'foto', label: '📸 Fotos' },
            { id: 'evolucao', label: '🌱 Evolução' },
            { id: 'relatorio', label: '📄 Relatórios' },
            { id: 'data_importante', label: '📅 Datas' },
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => setFilterType(btn.id)}
              className={`text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer ${
                filterType === btn.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'border bg-[#FFFDF9] text-slate-700 border-amber-200/50 hover:bg-amber-50/40'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end shrink-0">
          <p className="text-xs font-semibold text-slate-700">
            Mostrando <span className="font-extrabold text-indigo-650">{filteredEvents.length}</span> registros
          </p>
          {canAddMoment && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-indigo-950 font-black text-xs shadow-sm hover:scale-102 active:scale-95 transition-all cursor-pointer border border-amber-300"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>📸 Nova Lembrança</span>
            </button>
          )}
        </div>
      </div>

      {/* 💬 MOMENTOS QUE MERECEM SER LEMBRADOS (Galeria Afetiva do Anjinho) */}
      {events.filter(e => e.inesquecivel).length > 0 && (
        <div className="bg-gradient-to-br from-[#FFFDF2] to-[#FFF9E1] border-2 border-amber-300 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/65 pb-3">
            <div className="space-y-0.5">
              <h3 className="text-base font-black text-indigo-950 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-500 animate-bounce" style={{ animationDuration: '3s' }} />
                💬 Momentos que Merecem ser Lembrados
              </h3>
              <p className="text-xs text-slate-700 font-semibold">
                Registros espontâneos e inesquecíveis da vida do anjinho na escola:
              </p>
            </div>
            <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 border border-amber-250 px-3 py-1 rounded-full uppercase tracking-wider text-center self-start sm:self-center">
              Destaques Afetivos ✨
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.filter(e => e.inesquecivel).map(e => (
              <div 
                key={`inesquecivel_${e.id}`}
                className="bg-white border border-amber-200/50 rounded-2xl p-4 shadow-3xs flex flex-col justify-between space-y-3 relative overflow-hidden group hover:shadow-md transition-all border-b-4 border-b-amber-400"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md border border-amber-200/45">
                      {getCategoryLabel(e.tipo)}
                    </span>
                    <span className="text-[9px] font-bold text-slate-500">
                      {new Date(e.data).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  <h4 className="text-sm font-black text-indigo-950 truncate group-hover:text-indigo-600 transition-colors">{e.titulo}</h4>
                  
                  {e.imagemUrl && (
                    <div className="w-full h-24 rounded-lg overflow-hidden border border-slate-100 relative bg-amber-50/20">
                      <img src={e.imagemUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
                    </div>
                  )}

                  <p className="text-[10px] leading-relaxed text-slate-800 font-medium line-clamp-3 italic">
                    "{e.descricao}"
                  </p>
                </div>

                {/* Valores Vivenciados tags in highlight */}
                {e.valoresVivenciados && e.valoresVivenciados.length > 0 && (
                  <div className="flex flex-wrap gap-1 items-center pt-2 border-t border-slate-100">
                    {e.valoresVivenciados.slice(0, 2).map(val => (
                      <span key={val} className="text-[8px] font-extrabold bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded">
                        🌟 {val}
                      </span>
                    ))}
                    {e.valoresVivenciados.length > 2 && (
                      <span className="text-[8px] font-bold text-slate-400">+{e.valoresVivenciados.length - 2}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TIMELINE LIST */}
      <div className="relative">
        {/* Continuous Center-Left Timeline line */}
        <div className="absolute left-6 md:left-1/2 top-4 bottom-4 w-1 -translate-x-1/2 hidden md:block bg-indigo-100"></div>
        <div className="absolute left-6 top-4 bottom-4 w-1 -translate-x-1/2 md:hidden bg-indigo-100"></div>

        {filteredEvents.length === 0 ? (
          <div className="rounded-3xl p-12 text-center space-y-3 shadow-sm border bg-[#FFFCEB] border-amber-200/50">
            <Camera className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="text-base font-bold text-slate-700">Nenhum momento registrado nesta categoria</h4>
            <p className="text-xs text-slate-505 max-w-md mx-auto">
              Adicione lembranças pedagógicas, marcos de desenvolvimento ou fotos do dia-a-dia do aluno para construir a sua linda linha do tempo eterna.
            </p>
            {canAddMoment && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="px-6 py-3 rounded-2xl bg-amber-400 hover:bg-amber-500 text-indigo-950 font-black text-xs inline-flex items-center gap-2 shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer border border-amber-300"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>📸 Registrar Nova Lembrança</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {filteredEvents.map((e, index) => {
              const isEven = index % 2 === 0;
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={e.id} 
                  className={`relative flex flex-col md:flex-row items-stretch ${
                    isEven ? 'md:flex-row-reverse' : ''
                  }`}
                >
                  {/* Circle Pin Icon on Timeline Line */}
                  <div className="absolute left-6 md:left-1/2 top-6 w-8 h-8 rounded-full border-4 border-indigo-400 flex items-center justify-center -translate-x-1/2 z-10 shadow bg-[#FFFCEB]">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-spin" style={{ animationDuration: '9s' }} />
                  </div>

                  {/* Spacer or Left Column Content for desktop */}
                  <div className="w-full md:w-1/2 px-12 md:px-8 hidden md:block"></div>

                  {/* Main Content card */}
                  <div className="w-full md:w-1/2 pl-12 pr-4 md:px-8">
                    <div className={`rounded-3xl p-5 border shadow-sm hover:shadow-md transition-all space-y-4 group relative overflow-hidden ${
                      e.inesquecivel 
                        ? 'border-amber-400 bg-gradient-to-br from-[#FFFDF6] to-[#FFFBF0] ring-2 ring-amber-300/40 shadow-amber-100/30' 
                        : 'bg-[#FFFCEB] border-amber-200/50'
                    }`}>
                      
                      {/* Decorative colored left/top stripe based on type */}
                      <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                        e.tipo === 'conquista' ? 'bg-indigo-500' :
                        e.tipo === 'atividade' ? 'bg-emerald-500' :
                        e.tipo === 'foto' ? 'bg-sky-500' :
                        e.tipo === 'evolucao' ? 'bg-amber-500' :
                        e.tipo === 'relatorio' ? 'bg-purple-500' :
                        'bg-rose-500'
                      }`} />

                      {/* Top Meta info */}
                      <div className="flex flex-wrap justify-between items-center gap-2 pt-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${getCategoryBadgeColor(e.tipo)}`}>
                            {getCategoryLabel(e.tipo)}
                          </span>
                          
                          {e.inesquecivel && (
                            <span className="text-[9px] font-black px-2.5 py-1 rounded-full bg-amber-400 text-indigo-950 border border-amber-300 flex items-center gap-1 shadow-3xs">
                              <Star className="w-2.5 h-2.5 fill-indigo-950 text-indigo-950 shrink-0" /> Inesquecível ✨
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-50/60 border border-amber-200/30 px-2.5 py-1 rounded-xl">
                          <Calendar className="w-3.5 h-3.5 text-amber-700" />
                          <span>{new Date(e.data).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>

                      {/* Image Frame with polaroid-like look */}
                      {e.imagemUrl && (
                        <div className="p-2 rounded-2xl border shadow-sm overflow-hidden transform group-hover:rotate-1 transition-transform duration-300 bg-[#FFFDF6] border-amber-200/40">
                          <div className="w-full h-48 rounded-xl overflow-hidden relative bg-amber-50/30">
                            <img 
                              src={e.imagemUrl} 
                              alt={e.titulo} 
                              className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent"></div>
                          </div>
                        </div>
                      )}

                      {/* Details */}
                      <div className="space-y-2">
                        <h4 className="text-base sm:text-lg font-black group-hover:text-indigo-600 transition-colors leading-snug text-slate-800">
                          {e.titulo}
                        </h4>
                        
                        <p className="text-xs sm:text-sm leading-relaxed text-slate-800 font-medium">
                          {e.descricao}
                        </p>
                      </div>

                      {/* Development Dimension Badges */}
                      {e.dimensoesDesenvolvimento && e.dimensoesDesenvolvimento.length > 0 && (
                        <div className="flex flex-wrap gap-1 items-center">
                          <span className="text-[9px] font-bold uppercase tracking-wider mr-1 text-slate-750">Foco:</span>
                          {e.dimensoesDesenvolvimento.map(dim => (
                            <span 
                              key={dim} 
                              className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md ${getDimensionColor(dim)} shadow-sm`}
                            >
                              {DIMENSION_LABELS[dim] || dim}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Valores Vivenciados Badges */}
                      {e.valoresVivenciados && e.valoresVivenciados.length > 0 && (
                        <div className="flex flex-wrap gap-1 items-center border-t border-amber-200/30 pt-2">
                          <span className="text-[9px] font-bold uppercase tracking-wider mr-1 text-amber-800 flex items-center gap-0.5">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" /> Valores:
                          </span>
                          {e.valoresVivenciados.map(val => (
                            <span 
                              key={val} 
                              className="text-[9px] font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-250/55 shadow-3xs"
                            >
                              🌟 {val}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* File attachment preview */}
                      {e.anexoNome && (
                        <div className="flex items-center gap-2 p-2 rounded-xl border border-dashed bg-[#FFFDF6] border-indigo-250/40">
                          <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold truncate text-slate-700">{e.anexoNome}</p>
                            <p className="text-[8px] text-slate-500">Documento anexo disponível</p>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => alert(`Visualizando documento em anexo: ${e.anexoNome}`)}
                            className="bg-[#FFFDF9] hover:bg-amber-50 border border-amber-200/50 text-slate-700 text-[10px] px-2 py-1 rounded-md font-bold transition-all cursor-pointer"
                          >
                            Baixar
                          </button>
                        </div>
                      )}

                      {/* Gestos de Afeto (Barra de Reações Humanizadas com grande destaque visual) */}
                      <div className="pt-3 pb-1 border-t-2 border-amber-300/60 bg-amber-50/40 -mx-4 -mb-1 px-4 py-3 rounded-b-2xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-950 flex items-center gap-1.5 bg-white px-2.5 py-0.5 rounded-md border border-amber-200 shadow-3xs">
                            <span className="text-sm">💌</span> Gestos de Presença & Afeto
                          </span>
                          {(e.likes || 0) > 0 && (
                            <span className="text-[10px] font-black text-amber-950 bg-amber-200/80 border border-amber-300 px-2.5 py-0.5 rounded-full shadow-3xs">
                              ❤️ {e.likes} {e.likes === 1 ? 'gesto de afeto' : 'gestos de afeto'}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5 items-center">
                          {GESTOS_AFETO.map(gesto => {
                            const isSelected = e.meuGestoAfeto === gesto.id;
                            const count = e.gestosAfeto?.[gesto.id] || (isSelected ? 1 : 0);

                            return (
                              <button
                                key={gesto.id}
                                type="button"
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  handleGestoAfeto(e.id, gesto.id);
                                }}
                                title={gesto.desc}
                                className={`flex items-center justify-center sm:justify-start gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer shadow-3xs active:scale-95 ${
                                  isSelected 
                                    ? gesto.activeBg + ' shadow-md scale-102 ring-2 ring-amber-400 font-black' 
                                    : gesto.color + ' hover:bg-white hover:border-amber-400 bg-white/90'
                                }`}
                              >
                                <span className="text-sm shrink-0">{gesto.emoji}</span>
                                <span className="whitespace-nowrap">{gesto.label}</span>
                                {count > 0 && (
                                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ml-0.5 ${isSelected ? 'bg-white/30 text-white' : 'bg-slate-100 text-slate-800 border border-slate-200'}`}>
                                    {count}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Footer Interaction Bar */}
                      <div className="flex justify-between items-center border-t pt-2.5 text-[10px] border-amber-200/50 text-slate-600">
                        <span className="text-[9px] font-bold italic text-slate-700 bg-white/65 px-2 py-0.5 rounded-md border border-slate-200/40">
                          Registrado por: {e.registradoPor || 'Educadora'}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const gestoTexto = e.meuGestoAfeto 
                                ? GESTOS_AFETO.find(g => g.id === e.meuGestoAfeto)?.label 
                                : 'Feito com amor';
                              const studentName = idoso.nome.split(' (')[0];
                              const textShare = `🌳 *A ÁRVORE DA INFÂNCIA HOJE:*
Hoje a árvore do(a) *${studentName}* floresceu com um momento lindo na escola:

🌟 *${e.titulo}*
${e.descricao}

💌 *Gesto de Afeto:* "${gestoTexto}"

☀️💧 *PARTICIPE DA JORNADA DO(A) ${studentName.toUpperCase()}!*
Abra as fotos no aplicativo e regue a árvore do seu filho enviando uma das manifestações de afeto:
✨ *Que encanto!* • ❤️ *Feito com amor* • 🌟 *Puro brilho!* • 🤝 *Orgulho da gente* • 💎 *Um tesouro!*

_(Cada manifestação sua ilumina e rega a árvore do desenvolvimento, deixando-a mais verde, forte e florida com puro afeto!)_

Com carinho,
Equipe Anjinho Escolar ❤️🕊️`;
                              window.open(`https://wa.me/?text=${encodeURIComponent(textShare)}`, '_blank');
                            }}
                            className="p-1.5 rounded-full transition-all cursor-pointer text-slate-500 hover:text-indigo-600 hover:bg-slate-150 border border-slate-200/40 bg-white"
                            title="Compartilhar no WhatsApp dos Avós e Familiares"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedEventToShare(e);
                              setShareModalOpen(true);
                            }}
                            className="p-1 px-2 rounded-full transition-all cursor-pointer text-pink-600 hover:text-white hover:bg-pink-600 border border-pink-200 bg-pink-50/50 flex items-center gap-1 text-[9px] font-extrabold"
                            title="Divulgar este Momento no Instagram / Redes Sociais"
                          >
                            <Instagram className="w-3 h-3 text-pink-600 group-hover:text-white" />
                            <span>Postar</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

        </>
      ) : (
        /* A FLORESTA DO SABER */
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-8 pb-10 animate-fade-in"
        >
          {/* BANNER DA FLORESTA */}
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-700 via-teal-800 to-indigo-900 rounded-3xl shadow-xl p-6 md:p-8 text-white">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-indigo-500/10 rounded-full blur-2xl -ml-16 -mb-16 pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-amber-400 text-teal-950 font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-wider shadow-sm border border-amber-350">
                    Método Árvore da Infância®
                  </span>
                  <span className="bg-emerald-600/70 border border-emerald-400/30 text-[10px] px-2.5 py-1 rounded-full text-emerald-100 font-extrabold uppercase tracking-wider">
                    A Floresta do Saber®
                  </span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-none text-white flex items-center gap-2">
                  A Floresta do Saber® <Trees className="w-8 h-8 text-emerald-300" />
                </h2>
                <p className="text-xs sm:text-sm text-teal-100 font-medium leading-relaxed">
                  Toda escola é uma floresta viva. Aqui, contemplamos o crescimento coletivo, cultivado com afeto, respeito e tempo. Cada árvore representa uma semente única florescendo em seu próprio tempo.
                </p>
              </div>

              {/* Rain of affection interactive gesture */}
              <button
                onClick={() => {
                  handleRegar();
                  alert("🌧️ Chuva de Carinho Enviada! O Bosque do colégio inteiro recebeu afeto hoje. Que lindo gesto pedagógico!");
                }}
                className="flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-slate-900 font-black px-5 py-3.5 rounded-2xl text-xs sm:text-sm shadow-md transition-all shrink-0 cursor-pointer animate-pulse"
              >
                <Droplet className="w-4 h-4 text-indigo-950 fill-indigo-950" />
                <span>Chuva de Carinho Coletiva ❤️</span>
              </button>
            </div>
          </div>

          {/* ESTÁCULOS DA FLORESTA (METRICS DASHBOARD) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#FFFCEB] border border-amber-200/50 rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-xs font-black text-slate-700">Árvores Plantadas</span>
                <span className="p-1.5 rounded-lg bg-amber-100 text-amber-900">
                  <Leaf className="w-4 h-4" />
                </span>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-slate-800">{forestStats.totalStudents}</p>
                <p className="text-[10px] font-semibold text-slate-500">Crianças florescendo ativas na escola</p>
              </div>
            </div>

            <div className="bg-emerald-50/55 border border-emerald-200/50 rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-xs font-black text-emerald-950">Vitalidade Geral do Solo</span>
                <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                  <Sprout className="w-4 h-4" />
                </span>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-emerald-950">{forestStats.averageVitality}%</p>
                <div className="w-full h-1.5 bg-emerald-100 rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${forestStats.averageVitality}%` }} />
                </div>
                <p className="text-[10px] font-semibold text-emerald-700 mt-1">Índice de nutrição afetiva geral</p>
              </div>
            </div>

            <div className="bg-sky-50/50 border border-sky-200/40 rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-xs font-black text-sky-950">Frutos de Aprendizado</span>
                <span className="p-1.5 rounded-lg bg-sky-100 text-sky-800">
                  <Award className="w-4 h-4" />
                </span>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-sky-950">{forestStats.totalFrutos}</p>
                <p className="text-[10px] font-semibold text-sky-700">Momentos Inesquecíveis & Trabalhinhos</p>
              </div>
            </div>

            <div className="bg-purple-50/50 border border-purple-200/40 rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-xs font-black text-purple-950">Fases de Crescimento</span>
                <span className="p-1.5 rounded-lg bg-purple-100 text-purple-800">
                  <Trees className="w-4 h-4" />
                </span>
              </div>
              <div className="space-y-1 text-[10px] font-semibold text-purple-900">
                <div className="flex justify-between">
                  <span>Broto/Semente:</span>
                  <span className="font-extrabold">{forestStats.sementesCount + forestStats.brotosCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Em Crescimento:</span>
                  <span className="font-extrabold">{forestStats.rootsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Flor/Fruto:</span>
                  <span className="font-extrabold">{forestStats.floresCount + forestStats.frutosCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* FILTERS AND CONTEXT CARD */}
          <div className="bg-[#FFFDF6] border border-amber-250/50 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-amber-200/30 pb-4">
              <div className="space-y-0.5">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <TreePine className="w-5 h-5 text-emerald-600" /> Explorar Bosques e Clareiras da Escola
                </h3>
                <p className="text-[11px] font-semibold text-slate-500">
                  Navegue pelas salas de aula e faixas etárias para contemplar o ecossistema pedagógico.
                </p>
              </div>

              {/* Filtering Controls */}
              {usuarioAtual?.tipo !== 'familiar' && (
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <div className="flex-1 sm:flex-none">
                    <label className="block text-[9px] font-black uppercase text-slate-500 mb-1">Clareiras (Série)</label>
                    <select
                      value={forestFilterGrade}
                      onChange={(e) => {
                        setForestFilterGrade(e.target.value);
                        setForestFilterClassroom('todos');
                      }}
                      className="w-full text-xs font-bold border border-slate-200 rounded-xl bg-white px-3 py-2 cursor-pointer outline-indigo-500"
                    >
                      <option value="todos">Todas as Clareiras</option>
                      <option value="Berçário">Berçário</option>
                      <option value="Maternal">Maternal</option>
                      <option value="Jardim">Jardim</option>
                    </select>
                  </div>
                  <div className="flex-1 sm:flex-none">
                    <label className="block text-[9px] font-black uppercase text-slate-500 mb-1">Bosques (Turma)</label>
                    <select
                      value={forestFilterClassroom}
                      onChange={(e) => setForestFilterClassroom(e.target.value)}
                      className="w-full text-xs font-bold border border-slate-200 rounded-xl bg-white px-3 py-2 cursor-pointer outline-indigo-500"
                    >
                      <option value="todos">Todos os Bosques</option>
                      {forestFilterGrade === 'todos' || forestFilterGrade === 'Berçário' ? (
                        <>
                          <option value="Berçário I - A">Berçário I - A</option>
                          <option value="Berçário II">Berçário II</option>
                        </>
                      ) : null}
                      {forestFilterGrade === 'todos' || forestFilterGrade === 'Maternal' ? (
                        <>
                          <option value="Maternal I">Maternal I</option>
                          <option value="Maternal II - A">Maternal II - A</option>
                        </>
                      ) : null}
                      {forestFilterGrade === 'todos' || forestFilterGrade === 'Jardim' ? (
                        <>
                          <option value="Jardim I">Jardim I</option>
                          <option value="Jardim II">Jardim II</option>
                        </>
                      ) : null}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* RENDER TREES IN FOREST GRIDS */}
            <div className="space-y-6">
              {/* If user is Family Member, pre-filter for their student's room only and explain privacy */}
              {usuarioAtual?.tipo === 'familiar' ? (
                <div className="p-4 bg-indigo-50/55 border border-indigo-200/50 rounded-2xl space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-black text-indigo-950">Companheirismo e Amizade no {studentRoom}</span>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-600 leading-relaxed">
                    Sua árvore se desenvolve ao lado de outros amiguinhos. Para preservar a segurança e privacidade de cada família, as demais sementes aparecem de forma poética e anônima como "Companheiro de Bosque". Mas repare como todos florescem juntos!
                  </p>
                </div>
              ) : usuarioAtual?.tipo === 'cuidador' ? (
                <div className="p-4 bg-emerald-50/65 border border-emerald-200/50 rounded-2xl flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                  <span className="text-xs font-bold text-emerald-900">
                    Você está contemplando o <strong>Bosque do {usuarioAtual.salaAula || 'Maternal'}</strong>, sua sala de aula titular.
                  </span>
                </div>
              ) : null}

              {/* RENDER ACTUAL GRID */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {idososList
                  .filter(student => student.id.startsWith('aluno_'))
                  .filter(student => {
                    // Filter based on roles
                    if (usuarioAtual?.tipo === 'familiar') {
                      // Only show classmates in same classroom as their own child
                      return getStudentClassroom(student.nome) === studentRoom;
                    }
                    if (usuarioAtual?.tipo === 'cuidador') {
                      // Only show student room of the teacher
                      const teacherRoom = usuarioAtual.salaAula || 'Maternal I';
                      return getStudentClassroom(student.nome) === teacherRoom;
                    }
                    // Admin can filter
                    const room = getStudentClassroom(student.nome);
                    const matchesClassroom = forestFilterClassroom === 'todos' || room === forestFilterClassroom;
                    const matchesGrade = forestFilterGrade === 'todos' || student.nome.includes(forestFilterGrade);
                    return matchesClassroom && matchesGrade;
                  })
                  .map(student => {
                    const stats = calculateStudentStats(student);
                    const isOwnChild = student.id === idosoProp.id;
                    const isFamilyMode = usuarioAtual?.tipo === 'familiar';
                    
                    // Poetic anonymous name for classmates in family mode
                    const displayName = (isFamilyMode && !isOwnChild) 
                      ? `Amiguinho do ${getStudentClassroom(student.nome).split(' -')[0]}`
                      : student.nome.split(' (')[0];

                    const displayPhoto = (isFamilyMode && !isOwnChild)
                      ? "https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&q=80&w=150" // generic child work/avatar
                      : student.foto;

                    return (
                      <motion.div
                        key={student.id}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => {
                          if (isFamilyMode && !isOwnChild) {
                            alert("Para preservar a privacidade escolar, as páginas de recordação dos outros alunos são de acesso exclusivo de suas respectivas famílias.");
                            return;
                          }
                          setFocusedStudentId(student.id);
                          setActiveViewTab('individual');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={`p-4 rounded-2xl border transition-all relative flex flex-col items-center justify-between space-y-3 cursor-pointer select-none text-center h-[260px] ${
                          isOwnChild 
                            ? 'bg-gradient-to-b from-[#FFFDF2] to-amber-50/40 border-amber-400 shadow-md ring-2 ring-amber-300' 
                            : (isFamilyMode && !isOwnChild)
                              ? 'bg-slate-50/50 border-slate-200/50 opacity-90'
                              : 'bg-white hover:bg-slate-50 border-slate-200 shadow-3xs'
                        }`}
                      >
                        {/* Glow for own child */}
                        {isOwnChild && (
                          <span className="absolute -top-2.5 bg-amber-400 text-slate-900 font-extrabold text-[8px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm z-10">
                            Seu Anjinho 🌟
                          </span>
                        )}

                        {/* Interactive mini SVG Tree */}
                        <div className="flex justify-center items-center h-20 w-20 bg-slate-50/40 rounded-xl border border-slate-100/50 p-1">
                          <MiniTreeSVG svgState={stats.svgState} />
                        </div>

                        {/* Child face or placeholder */}
                        <div className="space-y-1">
                          <div className="flex justify-center">
                            <img
                              src={displayPhoto}
                              alt={displayName}
                              referrerPolicy="no-referrer"
                              className={`w-8 h-8 rounded-full object-cover border-2 shadow-3xs ${
                                isOwnChild ? 'border-amber-400' : 'border-indigo-100'
                              }`}
                            />
                          </div>
                          <h4 className="text-xs font-black text-slate-800 line-clamp-1">{displayName}</h4>
                          <p className="text-[9px] font-semibold text-slate-400">
                            {getStudentClassroom(student.nome)}
                          </p>
                        </div>

                        {/* Progress meter */}
                        <div className="w-full space-y-1">
                          <div className="flex justify-between items-baseline text-[8px] font-extrabold text-slate-500">
                            <span className="truncate">{stats.stageName.split(' /')[0]}</span>
                            <span>{stats.progressPercent}%</span>
                          </div>
                          <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                isOwnChild ? 'bg-amber-400' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${stats.progressPercent}%` }}
                            />
                          </div>
                          {(!isFamilyMode || isOwnChild) && (
                            <p className="text-[8px] font-bold text-indigo-750 italic">
                              {stats.totalFrutos} frutos colhidos
                            </p>
                          )}
                        </div>

                        {/* Hover Overlay Help tip */}
                        {(!isFamilyMode || isOwnChild) && (
                          <div className="absolute inset-0 bg-indigo-950/5 rounded-2xl opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="bg-white/95 text-slate-900 text-[8px] font-black py-1 px-2.5 rounded-lg border border-slate-200 shadow-sm uppercase tracking-wider">
                              Ver Árvore 🔍
                            </span>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* CARTA PARA O FUTURO MODAL OVERLAY */}
      <AnimatePresence>
        {showLetterModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto"
            onClick={() => setShowLetterModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#FAF6EE] text-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-10 shadow-2xl border border-amber-300 max-h-[90vh] overflow-y-auto space-y-6 relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button 
                type="button" 
                onClick={() => setShowLetterModal(false)}
                className="absolute top-4 right-4 text-slate-500 hover:text-red-500 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Envelope Design Accent */}
              <div className="text-center space-y-2 pb-4 border-b border-amber-200">
                <span className="text-3xl">✉️</span>
                <h3 className="text-xl sm:text-2xl font-serif font-black text-amber-900 tracking-tight">
                  Uma Carta para o Futuro de {idoso.nome.split(' (')[0]}
                </h3>
                <p className="text-[10px] uppercase font-black tracking-widest text-indigo-900/60">
                  Cápsula do Tempo • Para ler daqui a 10 anos
                </p>
              </div>

              {/* Letter Content (styled beautifully as an emotional parchment letter) */}
              <div className="font-serif leading-relaxed text-slate-800 text-xs sm:text-sm space-y-4 max-h-[50vh] overflow-y-auto px-2 sm:px-4 text-justify">
                <p className="font-bold text-amber-900">
                  Querido(a) {idoso.nome.split(' (')[0]},
                </p>
                <p>
                  Escrevemos esta carta hoje, enquanto você ainda corre pelos corredores com um sorriso contagiante, segura o pincel de pintura cheio de tinta colorida e descobre a magia de empilhar blocos e dar os seus primeiros passos com firmeza e autonomia.
                </p>
                <p>
                  Durante a sua linda jornada na nossa escola, cada conquista sua foi celebrada com muito amor. Nós vimos você rir ao ouvir histórias mágicas, consolar amiguinhos de forma espontânea demonstrando uma empatia preciosa, e se superar em cada oficina criativa de artes.
                </p>
                <p>
                  Seus professores, que o(a) guiaram com tanto carinho através dos pilares de <strong>Memórias, Relacionamento e Desenvolvimento</strong>, guardaram cada pedacinho desse caminho no seu <em>Álbum da Primeira Infância</em>. 
                </p>
                <p>
                  Quando você abrir este aplicativo ou reler esta carta no futuro, esperamos que saiba o quanto foi amado(a) e valorizado(a) aqui. Você aprendeu a compartilhar, a esperar sua vez, a sorrir para os desafios e a espalhar alegria. Cada traço do seu desenho de hoje é a fundação do adulto maravilhoso que você se tornará amanhã.
                </p>
                <p className="italic text-indigo-950 font-bold">
                  "Nunca perca essa curiosidade brilhante nos olhos e o carinho no coração."
                </p>
                <p className="pt-4 text-right font-serif text-slate-600">
                  Com todo o amor de sua família,<br />
                  Seus Educadores e a equipe do <strong>Anjinho Escolar</strong>. ❤️
                </p>
              </div>

              {/* Signature stamp graphic */}
              <div className="flex justify-between items-center pt-4 border-t border-amber-200 text-xs">
                <div className="text-slate-500 font-semibold">
                  Data de Emissão: <span className="font-extrabold text-slate-700">{new Date().toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="text-center font-serif text-amber-900 font-extrabold italic bg-amber-100/50 px-3 py-1.5 rounded-lg border border-amber-200">
                  🛡️ Selo de Preservação Anjinho Escolar
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const textToCopy = `Uma Carta para o Futuro de ${idoso.nome.split(' (')[0]}\n\nQuerido(a) ${idoso.nome.split(' (')[0]},\n\nEscrevemos esta carta hoje, enquanto você ainda corre pelos corredores com um sorriso contagiante...\n\nCom todo o amor, seus Educadores e a equipe do Anjinho Escolar.`;
                    navigator.clipboard.writeText(textToCopy);
                    alert("A Carta para o Futuro foi copiada para a área de transferência! Você pode colá-la em um e-mail ou documento de texto.");
                  }}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-xl text-xs transition-all cursor-pointer shadow-md"
                >
                  <Share2 className="w-4 h-4" /> Copiar Texto da Carta 📋
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                  }}
                  className="flex-1 flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-500 text-indigo-950 font-black py-3 rounded-xl text-xs transition-all cursor-pointer shadow-md"
                >
                  <Printer className="w-4 h-4 text-indigo-950" /> Imprimir Carta de Recordação 🖨️
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Social share exporter modal */}
      {selectedEventToShare && (
        <SocialShareModal
          isOpen={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false);
            setSelectedEventToShare(null);
          }}
          event={selectedEventToShare}
          studentName={idoso.nome}
        />
      )}

      {/* PERSISTENT FLOATING ACTION BUTTON (FAB) FOR EASY ACCESS */}
      <div className="fixed bottom-6 right-6 z-[999] animate-fade-in">
        <button
          type="button"
          onClick={() => {
            setShowAddForm(prev => {
              const next = !prev;
              if (next) {
                setTimeout(() => {
                  formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
              }
              return next;
            });
          }}
          className={`px-5 py-3.5 rounded-full shadow-2xl flex items-center gap-2.5 transition-all cursor-pointer border-2 border-white ring-4 transition-transform hover:scale-105 active:scale-95 group ${
            showAddForm
              ? 'bg-red-500 hover:bg-red-600 text-white ring-red-300'
              : 'bg-amber-400 hover:bg-amber-300 text-indigo-950 ring-amber-300/80 shadow-amber-500/20'
          }`}
          title="Clique para abrir ou fechar o formulário de Nova Lembrança"
        >
          {showAddForm ? (
            <>
              <X className="w-5 h-5 text-white" />
              <span className="text-sm font-black tracking-tight text-white">Fechar Formulário</span>
            </>
          ) : (
            <>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-600"></span>
              </span>
              <Camera className="w-5 h-5 text-indigo-950 group-hover:rotate-12 transition-transform stroke-[2.5]" />
              <span className="text-sm font-black tracking-tight text-indigo-950">📸 + Registrar Lembrança</span>
            </>
          )}
        </button>
      </div>

      {/* FULL-SCREEN FLOATING BUTTERFLIES, BIRDS & SPARKLES OVERLAY (Visible anywhere the user scrolls!) */}
      {screenCelebration && (
        <div className="fixed inset-0 pointer-events-none z-[99999] overflow-hidden">
          {screenCelebration.items.map((item) => (
            <div
              key={item.id}
              className={`absolute select-none filter drop-shadow-2xl ${item.animType}`}
              style={{
                left: `${item.left}vw`,
                top: `${item.top}vh`,
                fontSize: `${item.size}px`,
                animationDelay: `${item.delay}s`,
                zIndex: 99999
              }}
            >
              {item.emoji}
            </div>
          ))}
        </div>
      )}

      {/* Floating Toast Notification for Immediate Visual Feedback */}
      {lastAfetoFeedback && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100000] pointer-events-auto bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-600 p-[3px] rounded-3xl shadow-2xl animate-bounce max-w-[92vw] sm:max-w-lg">
          <div className="bg-[#FFFDF6] px-5 py-3.5 sm:px-6 sm:py-4 rounded-[22px] flex items-center gap-3 sm:gap-4 shadow-2xl border border-amber-200">
            <span className="text-3xl sm:text-4xl animate-spin" style={{ animationDuration: '3s' }}>{lastAfetoFeedback.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-black text-indigo-950 uppercase tracking-wider">
                  {lastAfetoFeedback.label}
                </span>
                <span className="text-[10px] bg-amber-300 text-amber-950 font-black px-2.5 py-0.5 rounded-full border border-amber-400 shadow-sm">
                  Árvore Iluminada! ✨
                </span>
              </div>
              <p className="text-xs sm:text-sm font-black text-slate-800 leading-snug">
                {lastAfetoFeedback.text}
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
