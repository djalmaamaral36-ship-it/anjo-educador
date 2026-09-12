import React, { useState } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  Heart, 
  ShieldCheck, 
  Compass, 
  MessageSquare, 
  Award, 
  Star, 
  Printer, 
  ChevronRight, 
  Edit3, 
  Plus, 
  CheckCircle2, 
  Lightbulb, 
  FileText 
} from 'lucide-react';

interface BrandBookChapter {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  content: string;
  quote?: string;
  comparisonBureaucratic?: string;
  comparisonAnjinho?: string;
  keyPoints?: string[];
  cards?: {
    title: string;
    icon?: any;
    quote: string;
    text: string;
  }[];
  footerQuote?: string;
  isLanguageSimulator?: boolean;
  isTomVozSimulator?: boolean;
  isPilaresModule?: boolean;
  isSlogansModule?: boolean;
  isExperienciaLegadoModule?: boolean;
  isMetodoArvoreModule?: boolean;
  isSegurancaModule?: boolean;
}

const INITIAL_CHAPTERS: BrandBookChapter[] = [
  {
    id: 'introducao',
    title: 'Introdução: O Legado e a Magia',
    subtitle: 'Capítulo 01 • Diretrizes Fundamentais',
    icon: Sparkles,
    content: `A infância é um sopro. Em um piscar de olhos, os bebês que segurávamos no colo estão prontos para os primeiros passos na educação formal. Na correria do dia a dia moderno, pais e mães trabalham com o coração apertado, perdendo as pequenas piadas cotidianas, os gestos gentis e a primeira semente plantada na horta escolar.`,
    quote: "Não criamos um 'aplicativo de comunicação escolar'. Nós criamos um portal do tempo. O Anjinho Escolar existe para garantir que a magia dos primeiros capítulos da vida de uma criança nunca caia no esquecimento.",
    comparisonBureaucratic: '"O aluno consumiu a refeição e dormiu por 1 hora. Segue boleto e avisos de secretaria."',
    comparisonAnjinho: '"Hoje na hora do almoço, o pequeno explorador comeu tudinho e deu tchauzinho para o prato de cenoura. Dormiu com o soninho tranquilo de um anjo."',
    keyPoints: [
      'Foco emocional e humanizado no vínculo familiar',
      'Registro perpétuo dos marcos da primeira infância',
      'Transparência com acolhimento e escuta sensível'
    ]
  },
  {
    id: 'proposito',
    title: 'Propósito & Missão',
    subtitle: 'Capítulo 02 • Razão de Ser',
    icon: Compass,
    content: ``,
    cards: [
      {
        title: 'Nosso Propósito (A Causa)',
        icon: Heart,
        quote: 'Preservar as memórias afetivas da primeira infância e construir laços inabaláveis de amor, confiança e desenvolvimento humano entre a escola e a família.',
        text: 'Acreditamos que a infância é o solo fértil onde todo o futuro do ser humano é plantado. Guardar essa jornada é um ato de preservação do que temos de mais valioso: a nossa própria história.'
      },
      {
        title: 'Nossa Missão (O Meio)',
        icon: ShieldCheck,
        quote: 'Transformar a rotina de comunicação escolar em uma experiência narrativa acolhedora, interativa e empática.',
        text: 'Capacitamos educadores a registrarem de forma rápida e sensível os momentos especiais do dia a dia, e entregamos às famílias um relicário vivo, seguro e durável, enriquecido com inteligência e afeto.'
      }
    ],
    footerQuote: 'CUIDAR DE QUEM CUIDA. NARRAR PARA QUEM AMA.',
    keyPoints: [
      'Segurança psicológica em primeiro lugar',
      'Valorização dos educadores e cuidadores',
      'Respeito absoluto ao ritmo de cada criança'
    ]
  },
  {
    id: 'posicionamento',
    title: 'Posicionamento',
    subtitle: 'Capítulo 03 • O Território Emocional',
    icon: Award,
    content: `Enquanto a concorrência foca puramente no aspecto técnico (gerenciar cobranças, listar presenças, enviar avisos burocráticos frios), o Anjinho Escolar se posiciona no território emocional. Nosso compromisso é com a afetividade, a segurança psicológica e o legado da infância.`,
    keyPoints: [
      'Diferenciação pela experiência afetiva e estética acolhedora',
      'Zero burocracia fria: comunicação calorosa e transparente',
      'Tecnologia invisível a serviço do carinho'
    ]
  },
  {
    id: 'personalidade',
    title: 'Personalidade da Marca',
    subtitle: 'Capítulo 04 • Quem Somos Nós',
    icon: Heart,
    content: `Se o Anjinho Escolar fosse uma pessoa, quem ele seria? Ele seria aquele educador empático, com brilho constante nos olhos, que enxerga poesia no primeiro desenho rabiscado de uma criança. Ele é seguro, acolhedor e profundamente inspirador.`,
    cards: [
      {
        title: 'Acolhedora & Afetuosa',
        icon: Heart,
        quote: 'Acolhemos as preocupações dos pais com compaixão e carinho.',
        text: 'Nossa presença conforta, traz paz de espírito e estabelece um canal transparente e empático de afeto mútuo.'
      },
      {
        title: 'Lúdica & Inspiradora',
        icon: Sparkles,
        quote: 'Vemos beleza nas pequenas coisas: no dedinho sujo de tinta guache, na semente de girassol germinando.',
        text: 'Inspiramos os adultos a redescobrirem o encanto do mundo sob os olhos de uma criança.'
      },
      {
        title: 'Pedagogicamente Sólida',
        icon: Award,
        quote: 'Não somos um brinquedo. Apoiamos nossas ações nos marcos reais de desenvolvimento infantil.',
        text: 'Desenvolvimento socioemocional e intelectual infantil (valores humanos, autonomia, empatia e coordenação).'
      },
      {
        title: 'Zelosa & Guardiã',
        icon: ShieldCheck,
        quote: 'Protegemos as memórias e os dados com o rigor máximo que um pai ou mãe exige.',
        text: 'Somos o guardião permanente do legado e da privacidade de cada pequeno anjinho.'
      }
    ],
    keyPoints: [
      'Acolhedor e empático',
      'Seguro e confiável',
      'Inovador com ternura'
    ]
  },
  {
    id: 'linguagem',
    title: 'A Linguagem do Afeto',
    subtitle: 'Capítulo 05 • Tom e Comunicação',
    icon: MessageSquare,
    content: `Nossa linguagem é uma ponte afetiva. Ela traduz ações diárias em contos curtos de afeto, valorizando cada esforço pedagógico das escolas e tranquilizando o coração das famílias.`,
    isLanguageSimulator: true,
    keyPoints: [
      'Uso de emojis acolhedores e vocabulário afetuoso',
      'Foco nas conquistas e no desenvolvimento positivo',
      'Clareza e empatia em qualquer comunicado'
    ]
  },
  {
    id: 'tom_voz',
    title: 'BRAND-004 - Tom de Voz',
    subtitle: 'Capítulo 06 • Diretrizes de Redação',
    icon: FileText,
    content: `CÓDIGO: BRAND-004 | VERSÃO 1.0 | STATUS: OFICIAL\n\nOBJETIVO DA CONSTITUIÇÃO:\nDefinir como o Anjinho Escolar se comunica em todos os pontos de contato com diretoras, educadores, coordenação pedagógica, famílias e parceiros, garantindo uma linguagem consistente, acolhedora, humana e profundamente alinhada ao propósito da marca.\n\nO JEITO DE FALAR DO ANJINHO ESCOLAR:\nO Anjinho Escolar fala como uma escola que acolhe. Nunca como uma empresa tentando vender.`,
    isTomVozSimulator: true,
    keyPoints: [
      'Calmo, firme e amoroso',
      'Colaborativo com a família',
      'Profissional sem perder a doçura'
    ]
  },
  {
    id: 'pilares',
    title: 'Pilares Emocionais',
    subtitle: 'Capítulo 07 • Sustentação',
    icon: Star,
    content: `Nossa marca se apoia em uma tríade indivisível que sustenta todo o ecossistema emocional do aplicativo. Cada linha de código que escrevemos serve a um desses três pilares fundamentais:`,
    isPilaresModule: true,
    cards: [
      {
        title: 'Pilar 1: Memórias (Preservação do Legado)',
        quote: 'ETERNIDADE',
        text: 'A primeira infância passa rápido demais. Acreditamos que cada marco - o primeiro "por favor" espontâneo, o primeiro amigo, o desenho da família - é um tesouro nacional privado. Nós tratamos fotos, áudios e pequenos relatos não como "registros de banco de dados", mas como relíquias digitais permanentes e exportáveis para toda a vida.'
      },
      {
        title: 'Pilar 2: Relacionamento (Parceria de Confiança)',
        quote: 'EMPATIA',
        text: 'A escola e os pais não são prestadores e tomadores de serviço burocrático; são parceiros de co-autoria da história da criança. Eliminamos barreiras, abrimos as cortinas das salas de aula com afeto e construímos pontes de reciprocidade e gratidão emocional entre educadores e famílias.'
      },
      {
        title: 'Pilar 3: Desenvolvimento (Progresso Humano)',
        quote: 'LEGADO',
        text: 'Não registramos apenas notas ou comparecimento físico. Acompanhamos a evolução integral da criança: a empatia, o espírito de compartilhar, a independência física, a superação de medos e a inteligência lúdica. Cada pequena vitória diária é tratada como um passo glorioso de um lindo legado futuro.'
      }
    ],
    keyPoints: [
      'Pilar 1: Afeto e acolhimento incondicional',
      'Pilar 2: Rigor técnico e segurança de dados',
      'Pilar 3: Perpetuidade das memórias escolares'
    ]
  },
  {
    id: 'experiencia_legado',
    title: 'A Experiência do Legado',
    subtitle: 'Capítulo 08 • Tangibilização no Produto',
    icon: Award,
    content: `Nosso design de produto materializa o posicionamento e os pilares de marca em recursos tangíveis, elegantes e intencionais. Não adicionamos funções de forma aleatória; cada tela é desenhada para evocar afeto e encantamento.\n\n4 PILARES DE EXPERIÊNCIA PRÁTICA NO PRODUTO`,
    isExperienciaLegadoModule: true,
    cards: [
      {
        title: '1. A Carta para o Futuro (Cápsula do Tempo)',
        quote: 'No encerramento da Educação Infantil, nossa inteligência aglutina as fotos marcadas como "Inesquecíveis" e as conquistas mais marcantes para formatar uma linda Carta Digital e Impressa para a criança ler daqui a 10 anos. Um presente inestimável e inimitável para as famílias.',
        text: 'No encerramento da Educação Infantil, nossa inteligência aglutina as fotos marcadas como "Inesquecíveis" e as conquistas mais marcantes para formatar uma linda Carta Digital e Impressa para a criança ler daqui a 10 anos. Um presente inestimável e inimitável para as famílias.'
      },
      {
        title: '2. O Selo de Preservação Anjinho Escolar',
        quote: 'Todas as fotos publicadas na Linha do Tempo e nos Relatórios recebem nosso "Selo de Preservação", garantindo que aquelas mídias e lembranças estão guardadas e criptografadas em servidores seguros de alta perenidade, prontas para serem baixadas a qualquer momento do futuro.',
        text: 'Todas as fotos publicadas na Linha do Tempo e nos Relatórios recebem nosso "Selo de Preservação", garantindo que aquelas mídias e lembranças estão guardadas e criptografadas em servidores seguros de alta perenidade, prontas para serem baixadas a qualquer momento do futuro.'
      },
      {
        title: '3. Valores Vivenciados (Desenvolvimento Ético)',
        quote: 'Em vez de relatórios puramente acadêmicos, os professores selecionam quais valores éticos o anjinho demonstrou em cada registro: Gentileza, Empatia, Cooperação, Respeito ou Compartilhamento. Uma visão holística sobre quem a criança está se tornando.',
        text: 'Em vez de relatórios puramente acadêmicos, os professores selecionam quais valores éticos o anjinho demonstrou em cada registro: Gentileza, Empatia, Cooperação, Respeito ou Compartilhamento. Uma visão holística sobre quem a criança está se tornando.'
      },
      {
        title: '4. Linha do Tempo de Momentos Inesquecíveis',
        quote: 'Os pais contam com uma galeria afetiva dedicada exclusiva aos "Momentos Inesquecíveis". Um feed livre de ruídos operacionais, focado apenas no brilho estético dos marcos mais bonitos da rotina do seu filho.',
        text: 'Os pais contam com uma galeria afetiva dedicada exclusiva aos "Momentos Inesquecíveis". Um feed livre de ruídos operacionais, focado apenas no brilho estético dos marcos mais bonitos da rotina do seu filho.'
      }
    ],
    footerQuote: 'Criamos produtos para educadores, mas construímos memórias eternas para pais.',
    keyPoints: [
      'Cápsula do tempo e carta para o futuro',
      'Selo de preservação digital seguro',
      'Galeria exclusiva de momentos inesquecíveis'
    ]
  },
  {
    id: 'slogans',
    title: 'Slogans & Narrativa de Marca',
    subtitle: 'Capítulo 09 • A Voz do Anjinho',
    icon: MessageSquare,
    content: `NOSSOS SLOGANS OFICIAIS`,
    isSlogansModule: true,
    cards: [
      {
        title: 'SLOGAN INSTITUCIONAL PRINCIPAL',
        quote: 'Onde os primeiros capítulos da infância são guardados com amor.',
        text: 'Onde os primeiros capítulos da infância são guardados com amor.'
      },
      {
        title: 'SLOGAN COMERCIAL / DIFERENCIAÇÃO',
        quote: 'Mais que uma agenda escolar: um relicário vivo de descobertas.',
        text: 'Mais que uma agenda escolar: um relicário vivo de descobertas.'
      },
      {
        title: 'TAGLINE DE PRODUTO / PAIS',
        quote: 'Para ler, amar e recordar. Sempre.',
        text: 'Para ler, amar e recordar. Sempre.'
      },
      {
        title: 'SLOGAN DE ENGAJAMENTO DIÁRIO',
        quote: 'Eternizando cada conquista do seu pequeno anjinho.',
        text: 'Eternizando cada conquista do seu pequeno anjinho.'
      }
    ],
    footerQuote: 'Porque nós não guardamos dados escolares. Nós somos o baú do tesouro onde os primeiros e mais preciosos capítulos da vida de um filho são eternizados para sempre.',
    keyPoints: [
      'Identidade memorável e emocionante',
      'Alinhamento total entre promessa e entrega'
    ]
  },
  {
    id: 'metodo_arvore',
    title: 'Método Árvore da Infância',
    subtitle: 'Capítulo 10 • Metodologia Exclusiva & IP',
    icon: Compass,
    content: `O Método Árvore da Infância é a nossa metodologia exclusiva e registrada de comunicação afetiva, documentação do desenvolvimento e preservação de legados. Com ele, o Anjinho Escolar deixa de ser um mero software de rotina e se consolida como uma propriedade intelectual insubstituível.`,
    quote: "Toda criança é uma semente. A família planta. A escola cultiva. O Anjinho Escolar preserva essa história.",
    isMetodoArvoreModule: true,
    cards: [
      {
        title: '1. Plantar',
        quote: 'Acolhimento e confiança',
        text: 'Registros essenciais de rotina (sono, alimentação, higiene).'
      },
      {
        title: '2. Cultivar',
        quote: 'Estímulo diário',
        text: 'Oficinas de arte, experiências pedagógicas, fotos e descobertas.'
      },
      {
        title: '3. Florescer',
        quote: 'Valores humanos visíveis',
        text: 'Empatia, cooperação, gentileza, respeito e autonomia.'
      },
      {
        title: '4. Frutificar',
        quote: 'Legado consolidado',
        text: 'O Álbum da Primeira Infância e a Linha do Tempo Inesquecível.'
      },
      {
        title: '5. Preservar',
        quote: 'Permanência vitalícia',
        text: 'Garantia de guarda segura e perene das mídias para o futuro.'
      }
    ],
    keyPoints: [
      '5 Princípios do Método: Plantar, Cultivar, Florescer, Frutificar e Preservar',
      '5 Estações de Crescimento (Índice de Cultivo)',
      'Poder comercial e posicionamento de IP'
    ]
  },
  {
    id: 'seguranca_ip',
    title: 'BRAND-005 - Segurança, Blindagem & IP',
    subtitle: 'Capítulo 10 DIRETRIZES',
    icon: ShieldCheck,
    content: `Para que o Anjinho Escolar seja uma marca de valor inestimável e protegida contra a comoditização, precisamos blindá-la legal e tecnologicamente. A concorrência pode tentar copiar nosso visual, mas nunca poderá copiar nossa integridade legal, nossa marca registrada e nossos algoritmos exclusivos.`,
    isSegurancaModule: true,
    keyPoints: [
      'Simulador de Vulnerabilidade & Blindagem',
      'Como realizar registros (INPI e BN)',
      'Modelos jurídicos (NDA e Notificação Extrajudicial)'
    ]
  }
];

export default function BrandBookModule() {
  const [chapters, setChapters] = useState<BrandBookChapter[]>(INITIAL_CHAPTERS);
  const [activeChapterId, setActiveChapterId] = useState<string>('introducao');
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [simScenario, setSimScenario] = useState<'refeicao' | 'conflito' | 'sono' | 'acidente'>('refeicao');
  const [tomVerifierText, setTomVerifierText] = useState('');
  const [copiedExpr, setCopiedExpr] = useState<string | null>(null);
  const [copiedSlogan, setCopiedSlogan] = useState<string | null>(null);
  const [copiedJuridico, setCopiedJuridico] = useState<string | null>(null);
  const [segurancaState, setSegurancaState] = useState({
    regMarca: false,
    regMetodo: false,
    regApp: false,
    nda: false,
    ofuscacao: false,
    backend: false,
    marcaDagua: false,
    termos: false
  });

  const handleCopySlogan = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSlogan(text);
    setTimeout(() => setCopiedSlogan(null), 2500);
  };

  const handleCopyJuridico = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedJuridico(text);
    setTimeout(() => setCopiedJuridico(null), 2500);
  };

  const expressionsList = [
    "fortalecer a relação entre escola e família",
    "valorizar o trabalho dos educadores",
    "acompanhar o desenvolvimento da criança",
    "preservar a história da infância",
    "aproximar pessoas com cuidado",
    "organizar a rotina com simplicidade",
    "tornar cada momento significativo",
    "construir lembranças para o futuro",
    "transformar registros em memórias",
    "comunicar com afeto e cuidado"
  ];

  const handleCopyExpr = (expr: string) => {
    navigator.clipboard.writeText(expr);
    setCopiedExpr(expr);
    setTimeout(() => setCopiedExpr(null), 2500);
  };

  const simData = {
    refeicao: {
      label: 'Refeição',
      burocratico: '"O aluno comeu toda a refeição do almoço sem problemas."',
      anjinho: '"Hoje no almoço, o nosso pequeno anjinho devorou tudinho com um sorriso no rosto! Ele experimentou os legumes com muita curiosidade e adorou."',
      diretriz: "Diretriz do Anjinho: Evite termos burocráticos como 'consumiu a refeição'. Prefira humanizar com termos afetuosos e focar na experiência de descoberta da criança."
    },
    conflito: {
      label: 'Conflito',
      burocratico: '"A criança brigou com o colega pelo brinquedo."',
      anjinho: '"Hoje tivemos um momento de aprendizado na partilha dos carrinhos. Conversamos com carinho e logo os dois pequenos estavam abraçados construindo uma torre juntos!"',
      diretriz: "Diretriz do Anjinho: Transforme atritos cotidianos em oportunidades de acolhimento socioemocional e mediação gentil."
    },
    sono: {
      label: 'Sono/Choro',
      burocratico: '"O aluno chorou na hora de dormir."',
      anjinho: '"No momento do soninho, o pequeno estava com saudades e recebeu um colinho bem aconchegante da tia. Dormiu tranquilamente por 1 hora e meia."',
      diretriz: "Diretriz do Anjinho: Acolha a vulnerabilidade com presença e carinho, tranquilizando os pais sobre o bem-estar do filho."
    },
    acidente: {
      label: 'Pequeno Acidente',
      burocratico: '"O aluno caiu e ralou o joelho no pátio."',
      anjinho: '"Durante a explorada no pátio, o pequeno explorador deu uma tropeçadinha. Fizemos um curativo com carinho, sopro mágico e colinho; agora já está correndo feliz novamente!"',
      diretriz: "Diretriz do Anjinho: Nunca assuste as famílias. Relate pequenos imprevistos com transparência afetuosa, destacando o cuidado imediato."
    }
  };

  const checkedSegurancaCount = Object.values(segurancaState).filter(Boolean).length;
  const segurancaPercent = Math.round((checkedSegurancaCount / 8) * 100);
  
  let segurancaDiagnostic = "";
  if (segurancaPercent <= 25) {
    segurancaDiagnostic = "Diagnóstico Legal: Sua propriedade intelectual está exposta. Concorrentes podem facilmente plagiar sua marca, copiar sua interface e até mesmo clonar seus scripts sem grandes barreiras jurídicas ou técnicas.";
  } else if (segurancaPercent <= 75) {
    segurancaDiagnostic = "Diagnóstico Legal: Blindagem parcial. Você já possui algumas barreiras legais ou técnicas, mas ainda há brechas que um concorrente experiente pode explorar para replicar seu modelo de negócio.";
  } else {
    segurancaDiagnostic = "Diagnóstico Legal: Blindagem de Alto Nível. Seu produto está juridicamente e tecnologicamente seguro contra imitações rasas. Os ativos da marca estão garantidos como IP.";
  }

  const currentChapter = chapters.find(c => c.id === activeChapterId) || chapters[0];
  const ChapterIcon = currentChapter.icon || BookOpen;

  const handleStartEdit = () => {
    setEditTitle(currentChapter.title);
    setEditContent(currentChapter.content);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    setChapters(chapters.map(c => c.id === activeChapterId ? {
      ...c,
      title: editTitle,
      content: editContent
    } : c));
    setIsEditing(false);
    setSuccessMsg('Capítulo atualizado com sucesso conforme diretrizes do Brand Book!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-900 border border-indigo-500/30 p-6 sm:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <BookOpen size={180} className="text-amber-400" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-semibold">
                <Sparkles size={13} />
                BRAND BOOK LIVRO DE MARCA • Anjinho Escolar
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                Brand Book: O Coração da Escola
              </h1>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Empresas memoráveis criam produtos, mas o que as torna eternas é o impacto que entregam. Este documento estratégico define a nossa essência: mais do que uma ferramenta administrativa, o lugar sagrado onde guardamos os primeiros e mais lindos capítulos da infância de seus filhos.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handlePrint}
                className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition cursor-pointer active:scale-95"
              >
                <Printer size={16} />
                Imprimir / Salvar PDF do Brand Book
              </button>
            </div>
          </div>
        </div>

        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-sm flex items-center gap-2 shadow-lg animate-fade-in">
            <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Layout Principal: Índice à Esquerda, Conteúdo à Direita */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Índice de Capítulos */}
          <div className="lg:col-span-4 bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700/60 p-4 shadow-xl space-y-3 sticky top-20">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-amber-400" />
                <h2 className="font-bold text-white text-sm">ÍNDICE DE CAPÍTULOS</h2>
              </div>
              <span className="text-[10px] bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded-md font-medium border border-indigo-800">
                {chapters.length} Capítulos
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Navegue pelas diretrizes estratégicas da nossa marca:
            </p>

            <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
              {chapters.map((ch) => {
                const IconComp = ch.icon || BookOpen;
                const isActive = ch.id === activeChapterId;
                return (
                  <button
                    key={ch.id}
                    onClick={() => {
                      setActiveChapterId(ch.id);
                      setIsEditing(false);
                    }}
                    className={`w-full text-left px-3.5 py-3 rounded-xl transition flex items-center justify-between gap-2 cursor-pointer ${
                      isActive 
                        ? 'bg-amber-400 text-slate-950 font-bold shadow-md' 
                        : 'bg-slate-900/50 hover:bg-slate-700/60 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <IconComp size={16} className={isActive ? 'text-slate-950' : 'text-amber-400'} />
                      <span className="text-xs sm:text-sm truncate">{ch.title}</span>
                    </div>
                    <ChevronRight size={14} className={isActive ? 'text-slate-950' : 'text-slate-500'} />
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-700 text-[11px] text-slate-400 flex items-center gap-2">
              <Lightbulb size={14} className="text-amber-400 flex-shrink-0" />
              <span>Envie novos itens do Brand Book para atualizar em tempo real.</span>
            </div>
          </div>

          {/* Visualizador de Capítulo */}
          <div className="lg:col-span-8 bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700/60 p-6 sm:p-8 shadow-xl space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-400 flex items-center justify-center flex-shrink-0">
                  <ChapterIcon size={22} />
                </div>
                <div>
                  <span className="text-xs text-amber-400 font-semibold uppercase tracking-wider">{currentChapter.subtitle}</span>
                  <h2 className="text-xl sm:text-2xl font-black text-white">{currentChapter.title}</h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isEditing ? (
                  <button
                    onClick={handleStartEdit}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
                  >
                    <Edit3 size={14} />
                    Editar Capítulo
                  </button>
                ) : (
                  <button
                    onClick={handleSaveEdit}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
                  >
                    <CheckCircle2 size={14} />
                    Salvar Alterações
                  </button>
                )}
              </div>
            </div>

            {/* Conteúdo do Capítulo */}
            {!isEditing ? (
              <div className="space-y-6">
                {currentChapter.content && (
                  <div className="text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                    {currentChapter.content}
                  </div>
                )}

                {currentChapter.isLanguageSimulator && (
                  <div className="my-6 p-6 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 space-y-6 shadow-xl">
                    <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-indigo-900">
                      <div className="flex items-center gap-2">
                        <Sparkles size={18} className="text-amber-400" />
                        <h3 className="font-bold text-white text-sm sm:text-base">SIMULADOR INTERATIVO DE TOM DE VOZ</h3>
                      </div>
                      <span className="text-[10px] bg-indigo-900/80 text-indigo-200 px-2.5 py-1 rounded-md font-medium border border-indigo-700">
                        Anjinho AI Engine
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-300">
                      Selecione um cenário típico do cotidiano escolar para ver como a Linguagem do Afeto do Anjinho Escolar transforma uma mensagem burocrática comum em uma recordação inesquecível:
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(['refeicao', 'conflito', 'sono', 'acidente'] as const).map((scKey) => {
                        const isSel = simScenario === scKey;
                        return (
                          <button
                            key={scKey}
                            onClick={() => setSimScenario(scKey)}
                            className={`px-3 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition cursor-pointer ${
                              isSel 
                                ? 'bg-amber-400 text-slate-950 font-bold shadow-md' 
                                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700'
                            }`}
                          >
                            {simData[scKey].label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-500/40 space-y-2 shadow-inner">
                        <div className="text-[11px] font-bold text-rose-300 uppercase tracking-wider">COMO AS AGENDAS COMUNS ESCREVEM:</div>
                        <p className="text-xs sm:text-sm text-slate-200 italic">{simData[simScenario].burocratico}</p>
                      </div>

                      <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/40 space-y-2 shadow-inner">
                        <div className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">COMO O ANJINHO ESCOLAR ESCREVE:</div>
                        <p className="text-xs sm:text-sm text-slate-100 font-medium">{simData[simScenario].anjinho}</p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-amber-300/90 font-medium">
                      {simData[simScenario].diretriz}
                    </div>
                  </div>
                )}

                {currentChapter.isTomVozSimulator && (
                  <div className="space-y-8 mt-6">
                    {/* Nossas Diretrizes & Nossa Personalidade */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-700/80 space-y-4 shadow-lg">
                        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
                          <CheckCircle2 size={20} className="text-amber-400" />
                          <h3 className="font-bold text-white text-base">Nossas Diretrizes</h3>
                        </div>
                        <ul className="space-y-3 text-slate-300 text-sm list-disc pl-4">
                          <li>Nossa comunicação transmite serenidade, confiança e proximidade.</li>
                          <li>Não usamos palavras difíceis para impressionar. Usamos palavras para gerar compreensão.</li>
                          <li>Não simplificamos porque o público não entende. Simplificamos porque respeitamos o tempo precioso de quem lê.</li>
                        </ul>
                      </div>

                      <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-700/80 space-y-4 shadow-lg">
                        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
                          <Heart size={20} className="text-amber-400" />
                          <h3 className="font-bold text-white text-base">Nossa Personalidade</h3>
                        </div>
                        <p className="text-xs text-slate-400">Se o Anjinho Escolar fosse uma pessoa, seria alguém que:</p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {['escuta antes de responder', 'orienta sem impor', 'inspira confiança', 'demonstra organização', 'transmite calma', 'valoriza relações humanas', 'fala com clareza', 'acredita no poder da Educação Infantil'].map((tag, idx) => (
                            <span key={idx} className="px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/30 text-indigo-200 text-xs font-medium">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="pt-2 text-[11px] text-rose-400 font-bold uppercase tracking-wider">
                          [!] NUNCA ARROGANTE, EXAGERADO OU IMPESSOAL.
                        </div>
                      </div>
                    </div>

                    {/* Como Escrevemos & O que Queremos Transmitir */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-700/80 space-y-4 shadow-lg">
                        <h3 className="font-bold text-white text-base pb-2 border-b border-slate-800">Como Escrevemos</h3>
                        <p className="text-xs text-slate-300">Sempre escrevemos de forma:</p>
                        <div className="flex flex-wrap gap-2">
                          {['clara', 'acolhedora', 'objetiva', 'elegante', 'humana', 'otimista', 'respeitosa'].map((tag, idx) => (
                            <span key={idx} className="px-3 py-1 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-bold">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-slate-400 pt-2 leading-relaxed">
                          Preferimos frases curtas, linguagem natural e explicar detalhadamente com sensibilidade em vez de tentar impressionar.
                        </p>
                      </div>

                      <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-700/80 space-y-4 shadow-lg">
                        <h3 className="font-bold text-white text-base pb-2 border-b border-slate-800">O que Queremos Transmitir</h3>
                        <p className="text-xs text-slate-300">Em cada texto, a leitora deve sentir:</p>
                        <div className="flex flex-wrap gap-2">
                          {['confiança', 'acolhimento', 'organização', 'profissionalismo', 'serenidade', 'propósito'].map((tag, idx) => (
                            <span key={idx} className="px-3 py-1 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Palavras que Fazem Parte da Nossa Identidade */}
                    <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-700/80 space-y-4 shadow-lg">
                      <h3 className="font-bold text-white text-base pb-2 border-b border-slate-800">Palavras que Fazem Parte da Nossa Identidade</h3>
                      <p className="text-xs text-slate-300">Estas palavras reforçam o posicionamento e devem aparecer naturalmente ao longo de relatórios, relatórios assistidos por voz e comunicações:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">RELAÇÕES</h4>
                          <p className="text-xs text-slate-300 leading-relaxed">relacionamento, aproximação, parceria, diálogo, presença, vínculo, confiança, acolhimento, comunidade</p>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">EDUCAÇÃO</h4>
                          <p className="text-xs text-slate-300 leading-relaxed">Educação Infantil, desenvolvimento, aprendizagem, infância descoberta, evolução, cuidado, protagonismo da criança</p>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">FAMÍLIA</h4>
                          <p className="text-xs text-slate-300 leading-relaxed">famílias, responsáveis, participação, conexão, presença, compartilhamento</p>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">ESCOLA</h4>
                          <p className="text-xs text-slate-300 leading-relaxed">escola, educadores, professoras, coordenação, direção, equipe pedagógica</p>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">PRODUTO</h4>
                          <p className="text-xs text-slate-300 leading-relaxed">plataforma, experiência, organização, rotina, comunicação, registro, história, jornada, memória, simplicidade</p>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">VALORES</h4>
                          <p className="text-xs text-slate-300 leading-relaxed">propósito, cuidado, confiança, transparência, respeito, continuidade, significado</p>
                        </div>
                      </div>
                    </div>

                    {/* Expressões que Representam a Marca */}
                    <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-700/80 space-y-4 shadow-lg">
                      <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800">
                        <h3 className="font-bold text-white text-base">Expressões que Representam a Marca</h3>
                        <span className="text-[11px] text-slate-400">Clique para copiar</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        {expressionsList.map((expr, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleCopyExpr(expr)}
                            className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-amber-400/50 flex items-center justify-between gap-3 cursor-pointer transition group shadow-sm"
                          >
                            <span className="text-xs sm:text-sm text-slate-200 font-medium italic">"{expr}"</span>
                            <span className="text-xs text-amber-400 flex items-center gap-1 opacity-80 group-hover:opacity-100">
                              {copiedExpr === expr ? 'Copiado! ✓' : 'Copiar'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Palavras que Evitamos a Todo Custo */}
                    <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-4 shadow-lg">
                      <h3 className="font-bold text-rose-300 text-base pb-2 border-b border-rose-900/60">Palavras que Evitamos a Todo Custo</h3>
                      <p className="text-xs text-slate-300">
                        Estas expressões ou termos comerciais/frios rompem a conexão de carinho e a seriedade ética. Salvo em contextos estritamente técnicos, evite sempre:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 space-y-2">
                          <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider">LINGUAGEM COMERCIAL</h4>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {['imperdível', 'promoção', 'desconto', 'gatilho', 'competidora', 'oportunidade única'].map((w, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded bg-rose-900/60 text-rose-200 text-[11px]">{w}</span>
                            ))}
                          </div>
                        </div>

                        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 space-y-2">
                          <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider">CORPORATIVA FRIA / TI</h4>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {['software', 'sistema', 'disruptivo', 'sinergia', 'KPI', 'otimização', 'benchmark', 'stakeholders'].map((w, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded bg-rose-900/60 text-rose-200 text-[11px]">{w}</span>
                            ))}
                          </div>
                        </div>

                        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 space-y-2">
                          <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider">INFANTILIZADA / MEDO</h4>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {['fofinho', 'lindinho', 'turminha', 'perder dinheiro', 'ficar para trás', 'desastre'].map((w, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded bg-rose-900/60 text-rose-200 text-[11px]">{w}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400 italic pt-2">
                        * Falamos sobre a infância com respeito técnico e afeto profundo. Não infantilizamos quem trabalha com ela e nunca exploramos as inseguranças das diretoras baseando nossa comunicação no medo ou em mercantilismo frio.
                      </p>
                    </div>

                    {/* Como Tratamos Temas-Chave */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-700/80 space-y-3 shadow-lg">
                        <h4 className="font-bold text-amber-400 text-sm uppercase tracking-wider">TECNOLOGIA E PRODUTO</h4>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          A tecnologia nunca é protagonista; trabalha nos bastidores para que educadores e famílias se concentrem na relação humana.
                        </p>
                        <p className="text-xs text-slate-400 leading-relaxed pt-1">
                          Evitamos: "Mais uma agenda digital" ou "Gestão/Controle escolar". Preferimos: "Plataforma de relacionamento", "Comunicação organizada", "Acompanhamento".
                        </p>
                      </div>

                      <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-700/80 space-y-3 shadow-lg">
                        <h4 className="font-bold text-amber-400 text-sm uppercase tracking-wider">A CRIANÇA E A ESCOLA</h4>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          A criança nunca é um número, usuário ou cadastro. Ela é sempre descrita como: criança, infância desenvolvimento, história, descoberta, jornada de aprendizagem.
                        </p>
                        <p className="text-xs text-slate-400 leading-relaxed pt-1">
                          A escola nunca é tratada apenas com um cliente comum. Ela é nossa parceira permanente que transforma vidas.
                        </p>
                      </div>
                    </div>

                    {/* Verificador de Tom de Voz */}
                    <div className="p-6 rounded-2xl bg-indigo-950/50 border border-indigo-500/40 space-y-6 shadow-xl">
                      <div className="flex items-center gap-2.5 pb-3 border-b border-indigo-900">
                        <Sparkles size={20} className="text-amber-400" />
                        <div>
                          <div className="text-[10px] text-indigo-300 uppercase tracking-wider font-semibold">ANTES DE PUBLICAR QUALQUER TEXTO / RELATÓRIO</div>
                          <h3 className="font-bold text-white text-base">Constituição da Marca • Verificador do Tom de Voz</h3>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300">
                        Escreva ou cole seu rascunho de comunicação abaixo e verifique se ele atende aos critérios da nossa constituição de marca:
                      </p>

                      <textarea
                        rows={4}
                        placeholder="Escreva seu rascunho de relatório ou e-mail aqui para testar..."
                        value={tomVerifierText}
                        onChange={(e) => setTomVerifierText(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400 leading-relaxed"
                      />

                      <div className="space-y-3">
                        <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">PERGUNTAS DE FILTRO DA MARCA:</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {[
                            "1. Está perfeitamente claro?",
                            "2. Está humano e carinhoso?",
                            "3. Está estritamente respeitoso?",
                            "4. Está simples, sem jargões corporativos?",
                            "5. Está alinhado ao nosso propósito educativo?",
                            "6. A diretora e os pais sentiriam confiança ao ler?",
                            "7. A tecnologia ficou em segundo plano?",
                            "8. A criança continua no centro da narrativa?"
                          ].map((checkText, idx) => (
                            <label key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 cursor-pointer hover:border-slate-700 transition">
                              <input type="checkbox" defaultChecked className="rounded border-slate-700 text-amber-500 focus:ring-amber-400 w-4 h-4 bg-slate-950" />
                              <span>{checkText}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Rodapé: Regra de Ouro & Princípio Permanente */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      <div className="p-5 rounded-2xl bg-amber-500/10 border-l-4 border-amber-400 space-y-2">
                        <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">A REGRA DE OURO DA COMUNICAÇÃO</div>
                        <p className="text-xs sm:text-sm text-amber-100 italic leading-relaxed">
                          "Não escrevemos para vender um software. Escrevemos para fortalecer a confiança entre escola, família e criança."
                        </p>
                      </div>

                      <div className="p-5 rounded-2xl bg-indigo-500/10 border-l-4 border-indigo-400 space-y-2">
                        <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider">O PRINCÍPIO PERMANENTE DA MARCA</div>
                        <p className="text-xs sm:text-sm text-indigo-100 italic leading-relaxed">
                          "Toda palavra deve transmitir o mesmo cuidado que esperamos de uma escola de Educação Infantil."
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {currentChapter.isPilaresModule && currentChapter.cards && currentChapter.cards.length > 0 && (
                  <div className="space-y-6 mt-6">
                    {currentChapter.cards.map((card, idx) => {
                      return (
                        <div key={idx} className="p-6 rounded-2xl bg-slate-900/70 border border-slate-700/80 shadow-lg space-y-4">
                          <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-800">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold text-sm">
                                {idx + 1}
                              </div>
                              <h3 className="font-bold text-white text-base sm:text-lg">{card.title}</h3>
                            </div>
                            <span className="px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-amber-300 font-bold text-xs tracking-wider">
                              {card.quote}
                            </span>
                          </div>
                          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                            {card.text}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {currentChapter.isMetodoArvoreModule && (
                  <div className="space-y-8 mt-6">
                    {currentChapter.quote && (
                      <div className="p-6 rounded-2xl bg-amber-500/10 border-l-4 border-amber-400 text-amber-100 text-base sm:text-lg italic leading-relaxed shadow-md">
                        "{currentChapter.quote}"
                      </div>
                    )}

                    <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-700/80 shadow-lg space-y-4">
                      <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                        {currentChapter.content}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                        OS 5 PRINCÍPIOS DO MÉTODO
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {currentChapter.cards?.map((card, idx) => (
                          <div key={idx} className="p-5 rounded-2xl bg-slate-900/70 border border-slate-700/80 shadow-lg space-y-2 flex flex-col justify-between">
                            <div>
                              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
                                {card.title}
                              </div>
                              <div className="text-sm font-semibold text-white mb-2">
                                {card.quote}
                              </div>
                              <p className="text-xs text-slate-300 leading-relaxed">
                                {card.text}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* As 5 Estações de Crescimento */}
                    <div className="space-y-4 pt-4">
                      <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                        AS 5 ESTAÇÕES DE CRESCIMENTO (ÍNDICE DE CULTIVO)
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        A árvore da criança cresce no aplicativo de forma orgânica de acordo com o seu Índice de Cultivo. Este Índice é um indicador de qualidade (não apenas de volume), ponderando registros enriquecidos com fotos, momentos marcados como "Inesquecíveis" e valores vivenciados.
                      </p>

                      <div className="space-y-3">
                        {[
                          { estacao: 'Estação 1: A Semente', desc: 'Fase inicial de adaptação e criação de laços afetuosos.', pts: '0 - 15 pts' },
                          { estacao: 'Estação 2: Os Primeiros Brotos', desc: 'Curiosidade e exploração ativa das novas dinâmicas pedagógicas.', pts: '16 - 40 pts' },
                          { estacao: 'Estação 3: Raízes Fortes', desc: 'Desenvolvimento da autonomia, independência e autoconfiança sólida.', pts: '41 - 75 pts' },
                          { estacao: 'Estação 4: Tempo de Florescer', desc: 'Desabrochar da inteligência emocional, empatia, cooperação e gentileza.', pts: '76 - 110 pts' },
                          { estacao: 'Estação 5: Árvore de Frutos', desc: 'O legado completo da infância com memórias maduras, prontas para as próximas etapas da vida.', pts: '111+ pts' }
                        ].map((est, idx) => (
                          <div key={idx} className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/80 flex items-center justify-between gap-4">
                            <div className="space-y-1">
                              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">{est.estacao}</h4>
                              <p className="text-xs text-slate-300">{est.desc}</p>
                            </div>
                            <span className="px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 font-bold text-xs whitespace-nowrap">
                              {est.pts}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Poder Comercial e Posicionamento de IP */}
                    <div className="p-6 rounded-2xl bg-indigo-950/50 border border-indigo-500/40 space-y-4 shadow-xl">
                      <div className="text-xs font-bold text-amber-400 uppercase tracking-wider border-b border-indigo-900 pb-2">
                        PODER COMERCIAL E POSICIONAMENTO DE IP
                      </div>
                      <div className="space-y-3 text-xs sm:text-sm text-slate-200 leading-relaxed">
                        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                          <strong>1. Diferenciação Absoluta:</strong> Enquanto os concorrentes brigam no oceano vermelho vendendo agendas frias de "sono e comida", nós oferecemos uma metodologia de formação e documentação de legado de vida.
                        </div>
                        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                          <strong>2. Venda Consultiva para Diretores:</strong> O discurso não é sobre tecnologia, é sobre cultivar a floresta de futuros. <em>"Diretora, a senhora não administra turmas, a senhora cultiva uma floresta inteira de futuros."</em>
                        </div>
                        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                          <strong>3. Formação Continuada para Professores:</strong> O treinamento deixa de ser um tutorial do sistema e passa a ser uma formação na metodologia de observação e afeto, valorizando a profissão do educador.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentChapter.isSegurancaModule && (
                  <div className="space-y-8 mt-6">
                    <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-700/80 shadow-lg space-y-4">
                      <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                        {currentChapter.content}
                      </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-700/80 shadow-lg space-y-6">
                      <div className="text-xs font-bold text-amber-400 uppercase tracking-wider border-b border-slate-700/50 pb-2">
                        SIMULADOR DE VULNERABILIDADE & BLINDAGEM DE IP
                      </div>
                      <p className="text-xs text-slate-300">
                        Selecione quais mecanismos de proteção estão ativos no momento para calcular em tempo real o Índice de Vulnerabilidade do produto e gerar o plano de ação adequado:
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Proteções Legais & Contratos</h4>
                          
                          <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 cursor-pointer hover:bg-slate-800 transition">
                            <input type="checkbox" className="mt-1" checked={segurancaState.regMarca} onChange={(e) => setSegurancaState(s => ({...s, regMarca: e.target.checked}))} />
                            <div>
                              <div className="text-xs font-bold text-white mb-0.5">Registro de Marca no INPI</div>
                              <div className="text-[10px] text-slate-400">Bloqueia o uso do nome "Anjinho Escolar" por concorrentes em todo o Brasil.</div>
                            </div>
                          </label>

                          <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 cursor-pointer hover:bg-slate-800 transition">
                            <input type="checkbox" className="mt-1" checked={segurancaState.regMetodo} onChange={(e) => setSegurancaState(s => ({...s, regMetodo: e.target.checked}))} />
                            <div>
                              <div className="text-xs font-bold text-white mb-0.5">Direitos Autorais do Método Árvore da Inf</div>
                              <div className="text-[10px] text-slate-400">Registro na Biblioteca Nacional impedindo o plágio da metodologia pedagógica.</div>
                            </div>
                          </label>

                          <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 cursor-pointer hover:bg-slate-800 transition">
                            <input type="checkbox" className="mt-1" checked={segurancaState.regApp} onChange={(e) => setSegurancaState(s => ({...s, regApp: e.target.checked}))} />
                            <div>
                              <div className="text-xs font-bold text-white mb-0.5">Registro de Programa de Computador (INPI)</div>
                              <div className="text-[10px] text-slate-400">Proteção do código-fonte do app contra cópias literais de trechos de código (50 anos).</div>
                            </div>
                          </label>

                          <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 cursor-pointer hover:bg-slate-800 transition">
                            <input type="checkbox" className="mt-1" checked={segurancaState.nda} onChange={(e) => setSegurancaState(s => ({...s, nda: e.target.checked}))} />
                            <div>
                              <div className="text-xs font-bold text-white mb-0.5">NDAs & Não-Concorrência com Programadores</div>
                              <div className="text-[10px] text-slate-400">Contratos impedindo desenvolvedores de vender soluções similares a concorrentes.</div>
                            </div>
                          </label>
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Barreiras Técnicas & Arquitetura</h4>
                          
                          <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 cursor-pointer hover:bg-slate-800 transition">
                            <input type="checkbox" className="mt-1" checked={segurancaState.ofuscacao} onChange={(e) => setSegurancaState(s => ({...s, ofuscacao: e.target.checked}))} />
                            <div>
                              <div className="text-xs font-bold text-white mb-0.5">Ofuscação & Minificação (Vite/Bundler)</div>
                              <div className="text-[10px] text-slate-400">Torna o código JavaScript do navegador incompreensível, evitando engenharia reversa.</div>
                            </div>
                          </label>

                          <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 cursor-pointer hover:bg-slate-800 transition">
                            <input type="checkbox" className="mt-1" checked={segurancaState.backend} onChange={(e) => setSegurancaState(s => ({...s, backend: e.target.checked}))} />
                            <div>
                              <div className="text-xs font-bold text-white mb-0.5">Cálculos Críticos no Backend-First</div>
                              <div className="text-[10px] text-slate-400">A lógica de cálculo do "Índice de Cultivo" roda no servidor e nunca vaza no front-end.</div>
                            </div>
                          </label>

                          <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 cursor-pointer hover:bg-slate-800 transition">
                            <input type="checkbox" className="mt-1" checked={segurancaState.marcaDagua} onChange={(e) => setSegurancaState(s => ({...s, marcaDagua: e.target.checked}))} />
                            <div>
                              <div className="text-xs font-bold text-white mb-0.5">Marcas d'Água Digitais em PDFs e Fotos</div>
                              <div className="text-[10px] text-slate-400">Evita que concorrentes baixem relatórios e usem como material de portfólio próprio.</div>
                            </div>
                          </label>

                          <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 cursor-pointer hover:bg-slate-800 transition">
                            <input type="checkbox" className="mt-1" checked={segurancaState.termos} onChange={(e) => setSegurancaState(s => ({...s, termos: e.target.checked}))} />
                            <div>
                              <div className="text-xs font-bold text-white mb-0.5">Termos de Uso Restritivos no Primeiro Acesso</div>
                              <div className="text-[10px] text-slate-400">Contrato digital forçando o usuário a concordar em não copiar a estrutura sob pena criminal.</div>
                            </div>
                          </label>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 mt-4 space-y-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs font-bold text-white uppercase">Grau de Blindagem do Produto:</div>
                          <div className={`text-xs font-bold px-3 py-1 rounded-full ${segurancaPercent <= 25 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : segurancaPercent <= 75 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                            {segurancaPercent}% {segurancaPercent <= 25 ? 'Crítico' : segurancaPercent <= 75 ? 'Atenção' : 'Seguro'}
                          </div>
                        </div>
                        <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                          <div className={`h-full transition-all duration-500 ${segurancaPercent <= 25 ? 'bg-rose-500' : segurancaPercent <= 75 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${segurancaPercent}%` }}></div>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed pt-2 border-t border-slate-700/50">
                          {segurancaDiagnostic}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                        COMO REALIZAR OS REGISTROS OFICIAIS (BRASIL)
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-700/80 shadow-lg space-y-3">
                          <h4 className="text-sm font-bold text-white">1. Registro de Marca (INPI)</h4>
                          <p className="text-xs text-slate-300 leading-relaxed">Protege o nome "Anjinho Escolar" e o logotipo misto. Impede imitadores de usarem o mesmo nome na classe de softwares e educação.</p>
                          <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-800">Prazo: 8 a 12 meses<br/>Órgão: INPI (inpi.gov.br)</div>
                        </div>
                        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-700/80 shadow-lg space-y-3">
                          <h4 className="text-sm font-bold text-white">2. Registro de Código (INPI)</h4>
                          <p className="text-xs text-slate-300 leading-relaxed">O registro do código-fonte é feito via hash criptográfica gerada do código e depositada no INPI, garantindo propriedade autoral internacional.</p>
                          <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-800">Prazo: Até 7 dias (Automático)<br/>Órgão: INPI (inpi.gov.br)</div>
                        </div>
                        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-700/80 shadow-lg space-y-3">
                          <h4 className="text-sm font-bold text-white">3. Registro de Metodologia</h4>
                          <p className="text-xs text-slate-300 leading-relaxed">A apostila literária e didática do "Método Árvore da Infância" deve ser registrada como obra literária e científica.</p>
                          <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-800">Prazo: 30 a 90 dias<br/>Órgão: Biblioteca Nacional (eda.bn.gov.br)</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                        MODELOS JURÍDICOS PRONTOS PARA COPIAR
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-700/80 shadow-lg flex flex-col h-full">
                          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                            <span className="text-xs font-bold text-white">Modelo NDA & Não-Concorrência</span>
                            <button 
                              onClick={() => handleCopyJuridico("ACORDO DE CONFIDENCIALIDADE E NÃO-CONCORRÊNCIA (NDA)\\n\\nPelo presente instrumento particular, de um lado ANJINHO ESCOLAR TECNOLOGIA LTDA, e de outro lado o CONTRATADO, ajustam o seguinte:\\n\\n1. OBJETO: O Contratado terá acesso a informações confidenciais relativas à arquitetura, código-fonte, metodologia 'Árvore da Infância' e segredos de negócios do aplicativo Anjinho Escolar.\\n2. OBRIGAÇÃO DE SIGILO: O Contratado obriga-se a manter absoluto sigilo sobre todas as Informações Confidenciais, não as revelando...")}
                              className="text-xs text-indigo-400 hover:text-indigo-300 transition"
                            >
                              {copiedJuridico?.includes('NDA') ? 'Copiado!' : 'Copiar Texto'}
                            </button>
                          </div>
                          <div className="text-[10px] text-slate-400 leading-relaxed font-mono whitespace-pre-wrap flex-grow">
                            ACORDO DE CONFIDENCIALIDADE E NÃO-CONCORRÊNCIA (NDA)
                            <br/><br/>
                            Pelo presente instrumento particular, de um lado ANJINHO ESCOLAR TECNOLOGIA LTDA, e de outro lado o CONTRATADO, ajustam o seguinte:
                            <br/><br/>
                            1. OBJETO: O Contratado terá acesso a informações confidenciais relativas à arquitetura, código-fonte, metodologia "Árvore da Infância" e segredos de negócios do aplicativo Anjinho Escolar.
                            <br/>
                            2. OBRIGAÇÃO DE SIGILO: O Contratado obriga-se a manter absoluto sigilo sobre todas as Informações Confidenciais, não as revelando...
                          </div>
                        </div>
                        
                        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-700/80 shadow-lg flex flex-col h-full">
                          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                            <span className="text-xs font-bold text-white">Notificação Extrajudicial de Plágio</span>
                            <button 
                              onClick={() => handleCopyJuridico("NOTIFICAÇÃO EXTRAJUDICIAL POR PLÁGIO E USO INDEVIDO DE MARCA\\n\\nA [NOME DO INFRATOR / CONCORRENTE]\\n\\nPrezados,\\n\\nConstatamos que sua empresa está utilizando, sem prévia autorização, elementos visuais, identidade de marca e/ou a metodologia registrada de propriedade exclusiva da ANJINHO ESCOLAR TECNOLOGIA LTDA.")}
                              className="text-xs text-indigo-400 hover:text-indigo-300 transition"
                            >
                              {copiedJuridico?.includes('NOTIFICAÇÃO') ? 'Copiado!' : 'Copiar Texto'}
                            </button>
                          </div>
                          <div className="text-[10px] text-slate-400 leading-relaxed font-mono whitespace-pre-wrap flex-grow">
                            NOTIFICAÇÃO EXTRAJUDICIAL POR PLÁGIO E USO INDEVIDO DE MARCA
                            <br/><br/>
                            A [NOME DO INFRATOR / CONCORRENTE]
                            <br/><br/>
                            Prezados,
                            <br/><br/>
                            Constatamos que sua empresa está utilizando, sem prévia autorização, elementos visuais, identidade de marca e/ou a metodologia registrada de propriedade exclusiva da ANJINHO ESCOLAR TECNOLOGIA LTDA.
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 mt-4">
                        <p className="text-xs text-emerald-400 leading-relaxed">
                          <strong>Recomendação de Operação:</strong> Execute o registro de marca mista no INPI o quanto antes para garantir precedência. Em paralelo, faça com que todos os prestadores de serviço terceirizados assinem o termo de não-concorrência e NDA antes de entregá-los acesso ao repositório de código.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {currentChapter.isExperienciaLegadoModule && (
                  <div className="space-y-8 mt-6">
                    <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-700/80 shadow-lg space-y-4">
                      <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                        Nosso design de produto materializa o posicionamento e os pilares de marca em recursos tangíveis, elegantes e intencionais. Não adicionamos funções de forma aleatória; cada tela é desenhada para evocar afeto e encantamento.
                      </p>
                      <div className="text-xs font-bold text-amber-400 uppercase tracking-wider pt-2 border-t border-slate-800">
                        4 PILARES DE EXPERIÊNCIA PRÁTICA NO PRODUTO
                      </div>
                    </div>

                    {currentChapter.cards && currentChapter.cards.length > 0 && (
                      <div className="space-y-6">
                        {currentChapter.cards.map((card, idx) => (
                          <div key={idx} className="p-6 rounded-2xl bg-slate-900/70 border border-slate-700/80 shadow-lg space-y-3">
                            <h3 className="font-bold text-white text-base sm:text-lg text-amber-300">
                              {card.title}
                            </h3>
                            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                              {card.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {currentChapter.footerQuote && (
                      <div className="p-6 rounded-2xl bg-indigo-950/80 border border-indigo-500/40 text-center shadow-xl">
                        <span className="text-amber-300 font-bold text-base sm:text-lg italic tracking-wide">
                          "{currentChapter.footerQuote}"
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {currentChapter.isSlogansModule && (
                  <div className="space-y-8 mt-6">
                    {currentChapter.cards && currentChapter.cards.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {currentChapter.cards.map((card, idx) => (
                          <div key={idx} className="p-6 rounded-2xl bg-slate-900/70 border border-slate-700/80 shadow-lg space-y-4 flex flex-col justify-between">
                            <div className="space-y-3">
                              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                                {card.title}
                              </span>
                              <p className="text-white text-base sm:text-lg font-serif italic leading-relaxed">
                                "{card.quote}"
                              </p>
                            </div>
                            <div className="pt-3 border-t border-slate-800 flex justify-end">
                              <button
                                onClick={() => handleCopySlogan(card.quote)}
                                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                              >
                                {copiedSlogan === card.quote ? 'Copiado! ✓' : 'Copiar Slogan'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/80 border border-slate-700/80 shadow-xl space-y-6">
                      <div className="border-b border-slate-800 pb-3">
                        <h3 className="font-black text-white text-lg sm:text-xl uppercase tracking-wider">A NARRATIVA PRINCIPAL (THE BRAND STORY)</h3>
                      </div>

                      <div className="space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed">
                        <p>
                          Quando a tarde cair e sua mãe voltar para buscá-la, a criança estará exausta e feliz. Mas quando a mãe perguntar <em>"O que você fez hoje na escola, meu amor?"</em>, a criança simplesmente responderá: <em>"Brinquei"</em>. E todo aquele universo poético de desenvolvimento socioemocional, pequenos progressos e grandes feiras de artes se perderá no vento do cotidiano burocrático.
                        </p>

                        <div className="p-5 rounded-2xl bg-indigo-950/50 border-l-4 border-amber-400 text-indigo-100 italic space-y-3 shadow-inner">
                          <p>
                            "O Anjinho Escolar nasceu para resgatar esse universo. Nós nos recusamos a tratar a rotina da escola como uma lista fria de 'comeu', 'dormiu' e 'boletos'. Nós empoderamos as escolas para capturarem as pequenas mágicas invisíveis, e embalamos essas lembranças como uma carta de amor contínua para as famílias."
                          </p>
                        </div>
                      </div>

                      {currentChapter.footerQuote && (
                        <div className="pt-4 border-t border-slate-800 text-center">
                          <span className="inline-block px-6 py-4 rounded-2xl bg-indigo-950/80 border border-indigo-500/40 text-amber-300 font-bold text-sm sm:text-base italic tracking-wide shadow-xl">
                            "{currentChapter.footerQuote}"
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {currentChapter.footerQuote && (
                  <div className="pt-6 border-t border-slate-700/60 text-center">
                    <span className="inline-block px-6 py-3 rounded-2xl bg-indigo-950/80 border border-indigo-500/40 text-amber-300 font-black text-sm sm:text-base tracking-wide shadow-xl">
                      "{currentChapter.footerQuote}"
                    </span>
                  </div>
                )}

                {currentChapter.quote && (
                  <div className="my-6 p-5 rounded-2xl bg-amber-500/10 border-l-4 border-amber-400 text-amber-100 text-sm sm:text-base italic leading-relaxed shadow-inner">
                    "{currentChapter.quote}"
                  </div>
                )}

                {(currentChapter.comparisonBureaucratic || currentChapter.comparisonAnjinho) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 space-y-2">
                      <div className="text-xs font-bold text-rose-400 uppercase tracking-wider">A Visão Burocrática (Concorrência)</div>
                      <p className="text-xs sm:text-sm text-slate-300 italic">{currentChapter.comparisonBureaucratic}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-2">
                      <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">A Visão do Anjinho Educador</div>
                      <p className="text-xs sm:text-sm text-slate-200 font-medium">{currentChapter.comparisonAnjinho}</p>
                    </div>
                  </div>
                )}

                {currentChapter.keyPoints && currentChapter.keyPoints.length > 0 && (
                  <div className="pt-4 border-t border-slate-700/60 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Pontos-Chave da Diretriz</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {currentChapter.keyPoints.map((pt, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/50 flex items-start gap-2.5">
                          <CheckCircle2 size={15} className="text-amber-400 flex-shrink-0 mt-0.5" />
                          <span className="text-xs text-slate-300">{pt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Título do Capítulo</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Conteúdo Estratégico</label>
                  <textarea
                    rows={10}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400 leading-relaxed"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer shadow-md"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
