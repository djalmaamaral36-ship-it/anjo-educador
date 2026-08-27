import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Sparkles, 
  Heart, 
  Compass, 
  MessageCircle, 
  Star, 
  Quote, 
  ShieldCheck, 
  CheckCircle, 
  Award, 
  Users, 
  FileText, 
  Printer, 
  Copy, 
  Check, 
  ArrowRight, 
  Lightbulb, 
  Baby, 
  GraduationCap, 
  Smile, 
  MessageSquare,
  Bookmark,
  TreePine
} from 'lucide-react';

interface BrandBookProps {
  key?: any;
  accessibilitySettings?: {
    highContrast: boolean;
    fontSize: 'normal' | 'large' | 'extra-large';
  };
  keyTrigger?: number;
}

export default function BrandBook({ accessibilitySettings, keyTrigger }: BrandBookProps) {
  const [activeChapter, setActiveChapter] = useState<string>('intro');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [testToneScenario, setTestToneScenario] = useState<string>('refeicao');
  const [testToneOutput, setTestToneOutput] = useState<{ original: string; brandVoice: string; tip: string }>({
    original: "O aluno comeu toda a refeição do almoço sem problemas.",
    brandVoice: "Hoje no almoço, o nosso pequeno anjinho devorou tudinho com um sorriso no rosto! Ele experimentou os legumes com muita curiosidade e adorou.  ✨",
    tip: "Evite termos burocráticos como 'consumiu a refeição'. Prefira humanizar com termos afetivos e focar na experiência de descoberta da criança."
  });

  // State for BRAND-004 copy-check
  const [checklistText, setChecklistText] = useState<string>('');
  const [checklistScore, setChecklistScore] = useState({
    claro: false,
    humano: false,
    respeitoso: false,
    simples: false,
    alinhado: false,
    confianca: false,
    tecnologiaSecundaria: false,
    criancaCentro: false,
  });

  // State for Chapter 10 - IP & Copycat Protection Simulator
  const [ipProtections, setIpProtections] = useState({
    brandInpi: false,
    softwareInpi: false,
    methodCopyright: false,
    developerNda: false,
    customerTerms: false,
    codeObfuscation: false,
    serverFirstLogic: false,
    watermarkPdfs: false,
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleToneScenarioChange = (scenario: string) => {
    setTestToneScenario(scenario);
    if (scenario === 'refeicao') {
      setTestToneOutput({
        original: "O aluno comeu toda a refeição do almoço sem problemas.",
        brandVoice: "Hoje no almoço, o nosso pequeno anjinho devorou tudinho com um sorriso no rosto! Ele experimentou os legumes com muita curiosidade e adorou.  ✨",
        tip: "Evite termos burocráticos como 'consumiu a refeição'. Prefira humanizar com termos afetivos e focar na experiência de descoberta da criança."
      });
    } else if (scenario === 'conflito') {
      setTestToneOutput({
        original: "O aluno brigou pelo brinquedo mas a professora interveio e resolveu.",
        brandVoice: "Durante as brincadeiras, tivemos um momento de aprendizado sobre compartilhar! O anjinho queria o mesmo brinquedo do colega, mas com jeitinho e mediação, conversamos sobre cooperação e logo os dois estavam rindo juntos de novo.  ❤",
        tip: "Nunca dramatize ou use tom punitivo. Encare conflitos da primeira inf sob a ótica do desenvolvimento socioemocional e da mediação afetuosa."
      });
    } else if (scenario === 'sono') {
      setTestToneOutput({
        original: "Dormiu apenas 30 minutos de soneca da tarde e acordou chorando.",
        brandVoice: "Na hora do soninho dos anjos, ele descansou por 30 minutinhos. Acordou com aquela preguiça gostosa e pediu um colinho aconchegante para recarregar as energias. Logo já estava pronto para a próxima aventura!   ",
        tip: "Suavize o despertar difícil enfatizando o acolhimento, o afeto física da professora (colo, abraço) e o restabelecimento da segurança emocional da criança."
      });
    } else if (scenario === 'machucado') {
      setTestToneOutput({
        original: "Caiu no parquinho e ralou o joelho esquerdo. Lavamos e passamos antisséptico.",
        brandVoice: "No parquinho, nosso pequeno explorador deu um tropeço super corajoso! Ele ganhou um 'carimbo de aventura' (um raladinho de leve) no joelho esquerdo. Ganhamos um colinho especial, lavamos com água mágica e ele já voltou a sorrir rapidinho.  ✨",
        tip: "Transforme o pequeno acidente físico em um momento de superação e coragem ('carimbo de aventura', 'água mágica'), garantindo que o cuidado foi imediato e acolhedor."
      });
    }
  };

  const chapters = [
    { id: 'intro', label: 'Introdução & Visão', icon: <Bookmark className="w-4 h-4" /> },
    { id: 'propósito', label: 'Propósito & Missão', icon: <Heart className="w-4 h-4" /> },
    { id: 'posicionamento', label: 'Posicionamento', icon: <Compass className="w-4 h-4" /> },
    { id: 'personalidade', label: 'Personalidade da Marca', icon: <Smile className="w-4 h-4" /> },
    { id: 'linguagem', label: 'A Linguagem do Afeto', icon: <MessageCircle className="w-4 h-4" /> },
    { id: 'brand_004', label: 'BRAND-004 — Tom de Voz  ', icon: <FileText className="w-4 h-4 text-amber-500 font-bold animate-pulse" /> },
    { id: 'pilares', label: 'Pilares Emocionais', icon: <Star className="w-4 h-4" /> },
    { id: 'narrativa', label: 'Slogans & Narrativa', icon: <FileText className="w-4 h-4" /> },
    { id: 'experiencia', label: 'A Experiência do Legado', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'metodo_arvore', label: 'Método Árvore da Inf', icon: <TreePine className="w-4 h-4" /> },
    { id: 'protecao_marca', label: 'BRAND-005 — Blindagem & IP  ', icon: <ShieldCheck className="w-4 h-4 text-emerald-500 font-bold" /> },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      
      {/* HEADER HERO BANNER */}
      <div className="bg-gradient-to-br from-indigo-950 via-[#1F1A44] to-[#120F2D] rounded-3xl p-6 sm:p-10 border border-indigo-900 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>
        
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[10px] px-3 py-1 rounded-full uppercase tracking-widest bg-amber-400 text-indigo-950 font-sans shadow-md">
              Brand Book • Livro de Marca  
            </span>
            <span className="text-xs font-bold text-indigo-200">Anjinho Escolar</span>
          </div>
          
          <h1 className="text-2xl sm:text-4xl font-serif font-black tracking-tight leading-none text-amber-300">
            Brand Book: O Coração do Anjinho Escolar
          </h1>
          
          <p className="text-xs sm:text-sm text-indigo-150 leading-relaxed font-sans max-w-2xl font-semibold">
            Empresas memoráveis criam produtos, mas o que as torna eternas é a narrativa e a experiência que entregam. Este documento estratégico define a nossa essência: o Anjinho Escolar não é uma simples ferramenta administrativa, mas o lugar sagrado onde as famílias guardam os primeiros e mais lindos capítulos da inf de seus filhos.
          </p>
          
          <div className="flex flex-wrap gap-2 pt-2">
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-indigo-950 text-xs font-black py-2.5 px-4 rounded-xl shadow-md cursor-pointer transition-all"
            >
              <Printer className="w-4 h-4 text-indigo-950" /> Imprimir / Salvar PDF do Brand Book  
            </button>
            <a 
              href="#nav-chapters"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-2.5 px-4 rounded-xl border border-white/10 cursor-pointer transition-all"
            >
              Explorar Capítulos <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
            </a>
          </div>
        </div>
      </div>

      {/* CORE LAYOUT WITH CHAPTER SELECTOR SIDEBAR & MAIN CARD */}
      <div id="nav-chapters" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* SIDEBAR NAVIGATION */}
        <div className="lg:col-span-4 bg-[#FFFDF6] border border-amber-250/65 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="border-b border-amber-200/50 pb-3">
            <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" /> Índice de Capítulos
            </h3>
            <p className="text-[10px] text-slate-500 font-semibold mt-1">Navegue pelas diretrizes estratégicas da nossa marca:</p>
          </div>

          <div className="space-y-1">
            {chapters.map((ch) => {
              const isActive = activeChapter === ch.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => setActiveChapter(ch.id)}
                  className={`w-full text-left px-3.5 py-3 rounded-xl flex items-center justify-between transition-all cursor-pointer text-xs font-bold ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-sm font-black translate-x-1 border border-indigo-500' 
                      : 'bg-white text-slate-700 hover:bg-amber-50/45 border border-slate-100 hover:border-amber-200/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`p-1.5 rounded-lg shrink-0 ${
                      isActive ? 'bg-amber-400 text-indigo-950' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {ch.icon}
                    </span>
                    <span>{ch.label}</span>
                  </div>
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>}
                </button>
              );
            })}
          </div>

          <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-2 text-center">
            <span className="text-[16px] block"> </span>
            <h4 className="text-[11px] font-black text-indigo-950 uppercase tracking-wider">O Maior Patrimônio</h4>
            <p className="text-[10px] text-slate-700 leading-relaxed font-semibold">
              O código pode ser copiado, mas um relacionamento baseado em confiança afetuosa e legado é inimitável.
            </p>
          </div>
        </div>

        {/* MAIN INTERACTIVE CHAPTER CONTENT CARD */}
        <div className="lg:col-span-8 bg-[#FFFDF6] border border-amber-250/65 rounded-3xl p-6 sm:p-8 shadow-sm relative min-h-[500px]">
          <AnimatePresence mode="wait">
            
            {/* CHAPTER: INTRO */}
            {activeChapter === 'intro' && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center border-b border-amber-200/50 pb-4">
                  <div>
                    <span className="text-[9px] uppercase font-black text-indigo-500 tracking-wider">Capítulo 1</span>
                    <h2 className="text-xl sm:text-2xl font-serif font-black text-indigo-950">Introdução: O Legado e a Magia</h2>
                  </div>
                  <span className="text-3xl"> </span>
                </div>

                <div className="prose text-xs sm:text-sm text-slate-800 leading-relaxed space-y-4 font-semibold">
                  <p>
                    A inf é um sopro. Em um piscar de olhos, os bebês que segurávamos no colo estão prontos para os primeiros passos na educação formal. Na correria do dia a dia moderno, pais e mães trabalham com o coração apertado, perdendo as pequenas piadas cotidianas, os gestos gentis espont a primeira semente plantada na horta escolar.
                  </p>
                  
                  <div className="p-5 my-4 bg-amber-100/50 rounded-2xl border border-amber-200/60 relative overflow-hidden">
                    <Quote className="absolute right-4 bottom-4 w-12 h-12 text-amber-200 opacity-45 shrink-0" />
                    <p className="text-xs sm:text-sm italic font-serif text-amber-950 font-bold relative z-10 leading-relaxed">
                      "Não criamos um 'aplicativo de comunicação escolar'. Nós criamos um portal do tempo. O Anjinho Escolar existe para garantir que a magia dos primeiros capítulos da vida de uma criança nunca caia no esquecimento."
                    </p>
                  </div>

                  <p>
                    Enquanto a concorrência foca puramente no aspecto técnico (gerenciar cobranças, listar presenças, enviar avisos burocráticos frios), o <strong>Anjinho Escolar</strong> se posiciona no território emocional. Nosso compromisso é com a <strong>afetividade</strong>, a <strong>segurança psicológica</strong> e o <strong>legado da inf</strong>.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-amber-250/20">
                  <div className="p-4 rounded-2xl bg-white border border-amber-100 space-y-2">
                    <span className="text-sm"> </span>
                    <h4 className="text-xs font-black text-indigo-950">A Visão Burocrática (Concorrência)</h4>
                    <p className="text-[10px] text-slate-650 font-semibold leading-relaxed">
                      "O aluno consumiu a refeição e dormiu por 1 hora. Segue boleto da mensalidade."
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2">
                    <span className="text-sm"> </span>
                    <h4 className="text-xs font-black text-indigo-950">A Visão do Anjinho Escolar</h4>
                    <p className="text-[10px] text-indigo-950 font-semibold leading-relaxed">
                      "Hoje na hora do almoço, o pequeno explorador comeu tudinho e experimentou legumes novos com coragem! Depois, sonhou com anjos por 1 hora e acordou com sorriso no rosto."
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* CHAPTER: PROPOSITO */}
            {activeChapter === 'propósito' && (
              <motion.div
                key="propósito"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center border-b border-amber-200/50 pb-4">
                  <div>
                    <span className="text-[9px] uppercase font-black text-indigo-500 tracking-wider">Capítulo 2</span>
                    <h2 className="text-xl sm:text-2xl font-serif font-black text-indigo-950">Propósito & Missão</h2>
                  </div>
                  <span className="text-3xl">❤</span>
                </div>

                <div className="space-y-6 text-xs sm:text-sm text-slate-800 leading-relaxed font-semibold">
                  
                  {/* O PROPÓSITO SECTION */}
                  <div className="space-y-2 bg-rose-50/30 p-5 rounded-3xl border border-rose-100">
                    <h3 className="text-base font-black text-rose-950 flex items-center gap-1.5 font-display">
                      <Heart className="w-5 h-5 text-rose-500 fill-rose-500/10" /> Nosso Propósito (A Causa)
                    </h3>
                    <p className="font-serif italic text-rose-900 font-bold">
                      "Preservar as memórias afetivas da primeira inf e construir laços inabaláveis de amor, confiança e desenvolvimento humano entre a escola e a família."
                    </p>
                    <p className="text-[11px] text-slate-750 font-semibold leading-relaxed pt-1">
                      Acreditamos que a inf é o solo fértil onde todo o futuro do ser humano é plantado. Guardar essa jornada é um ato de preservação do que temos de mais valioso: a nossa própria história.
                    </p>
                  </div>

                  {/* A MISSÁO SECTION */}
                  <div className="space-y-2 bg-emerald-50/30 p-5 rounded-3xl border border-emerald-100">
                    <h3 className="text-base font-black text-emerald-950 flex items-center gap-1.5 font-display">
                      <Award className="w-5 h-5 text-emerald-600" /> Nossa Missão (O Meio)
                    </h3>
                    <p className="font-serif italic text-emerald-900 font-bold">
                      "Transformar a rotina de comunicação escolar em uma experiência narrativa acolhedora, interativa e empática."
                    </p>
                    <p className="text-[11px] text-slate-750 font-semibold leading-relaxed pt-1">
                      Nós capacitamos educadores a registrarem de forma rápida e sensível os momentos especiais do dia a dia, e entregamos às famílias um relicário vivo, seguro e durável, enriquecido com inteligência e afeto.
                    </p>
                  </div>

                  {/* QUOTE STAMP */}
                  <div className="text-center py-4 border-t border-amber-250/20">
                    <p className="text-xs font-black text-indigo-900 uppercase tracking-widest">"Cuidar de quem cuida. Narrar para quem ama."</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* CHAPTER: POSICIONAMENTO */}
            {activeChapter === 'posicionamento' && (
              <motion.div
                key="posicionamento"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center border-b border-amber-200/50 pb-4">
                  <div>
                    <span className="text-[9px] uppercase font-black text-indigo-500 tracking-wider">Capítulo 3</span>
                    <h2 className="text-xl sm:text-2xl font-serif font-black text-indigo-950">O Posicionamento Estratégico</h2>
                  </div>
                  <span className="text-3xl"> </span>
                </div>

                <div className="prose text-xs sm:text-sm text-slate-800 leading-relaxed space-y-4 font-semibold">
                  <p>
                    O <strong>Anjinho Escolar</strong> não compete por preço ou volume de recursos frios. Nós ocupamos um quadrante único no mercado de edtechs brasileiras: o **Relicário Digital de Desenvolvimento Afetivo**.
                  </p>

                  <h3 className="text-sm font-black text-indigo-950 uppercase tracking-wide pt-2">A Matriz de Diferenciação</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-3xs">
                      <div className="flex items-center gap-1.5 text-slate-650 font-black text-xs">
                        <span className="text-red-500 font-bold">❌</span> Agendas Tradicionais (Burocráticas)
                      </div>
                      <ul className="text-[10px] space-y-1.5 text-slate-600 pl-4 list-disc font-semibold leading-relaxed">
                        <li>Foco em controle operacional e financeiro</li>
                        <li>Interface cinza, fria ou excessivamente corporativa</li>
                        <li>Relatórios manuais cansativos baseados em caixas de texto genéricas</li>
                        <li>Trata o aluno como uma 'matrícula' de passagem</li>
                        <li>Os dados desaparecem ou são apagados ao mudar de colégio</li>
                      </ul>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-300 space-y-3 shadow-3xs">
                      <div className="flex items-center gap-1.5 text-indigo-950 font-black text-xs">
                        <span className="text-emerald-500 font-bold">✓</span> Anjinho Escolar (Afetivo)
                      </div>
                      <ul className="text-[10px] space-y-1.5 text-slate-800 pl-4 list-disc font-bold leading-relaxed">
                        <li>Foco em narrar o desenvolvimento e as conquistas</li>
                        <li>Interface lúdica, acolhedora, inspirada em livros de recortes (scrapbooks)</li>
                        <li>Registros assistidos por voz e enriquecidos com pilares socioemocionais</li>
                        <li>Trata a criança como um 'anjinho' único em evolução</li>
                        <li>Gera um acervo afetivo perene (exportação física, Carta para o Futuro, etc.)</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-indigo-950 text-white rounded-2xl p-5 border border-indigo-900 mt-4">
                    <h4 className="text-xs font-black text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4 text-amber-300 animate-pulse" /> Nosso Posicionamento de Ouro:
                    </h4>
                    <p className="text-[11px] text-indigo-100 font-serif italic font-bold leading-relaxed mt-2">
                      "Para a escola, somos a ferramenta de fidelização emocional definitiva e um selo de excelência pedagógica afetuosa. Para os pais, somos a garantia diária de presença amorosa e o livro de memórias eternas do bem mais valioso de suas vidas."
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* CHAPTER: PERSONALIDADE */}
            {activeChapter === 'personalidade' && (
              <motion.div
                key="personalidade"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center border-b border-amber-200/50 pb-4">
                  <div>
                    <span className="text-[9px] uppercase font-black text-indigo-500 tracking-wider">Capítulo 4</span>
                    <h2 className="text-xl sm:text-2xl font-serif font-black text-indigo-950">Personalidade da Marca</h2>
                  </div>
                  <span className="text-3xl">✨</span>
                </div>

                <div className="space-y-6 text-xs sm:text-sm text-slate-800 leading-relaxed font-semibold">
                  <p>
                    Se o Anjinho Escolar fosse uma pessoa, quem ele seria? Ele seria aquele educador empático, com brilho constante nos olhos, que enxerga poesia no primeiro desenho rabiscado de uma criança. Ele é seguro, acolhedor e profundamente inspirador.
                  </p>

                  <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wide">Nossos 4 Traços de Personalidade</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* TRAÇO 1 */}
                    <div className="p-4 rounded-2xl border border-amber-200 bg-white space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg"> </span>
                        <h4 className="text-xs font-black text-slate-900">Acolhedora & Afetuosa</h4>
                      </div>
                      <p className="text-[10px] text-slate-600 leading-relaxed font-semibold">
                        Acolhemos as preocupações dos pais com compaixão e carinho. Nossa presença conforta, traz paz de espírito e estabelece um canal transparente e empático de afeto mútuo.
                      </p>
                    </div>

                    {/* TRAÇO 2 */}
                    <div className="p-4 rounded-2xl border border-amber-200 bg-white space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg"> </span>
                        <h4 className="text-xs font-black text-slate-900">Lúdica & Inspiradora</h4>
                      </div>
                      <p className="text-[10px] text-slate-600 leading-relaxed font-semibold">
                        Vemos beleza nas pequenas coisas: no dedinho sujo de tinta guache, na semente de girassol germinando. Inspiramos os adultos a redescobrirem o encanto do mundo sob os olhos de uma criança.
                      </p>
                    </div>

                    {/* TRAÇO 3 */}
                    <div className="p-4 rounded-2xl border border-amber-200 bg-white space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🏫</span>
                        <h4 className="text-xs font-black text-slate-900">Pedagogicamente Sólida</h4>
                      </div>
                      <p className="text-[10px] text-slate-600 leading-relaxed font-semibold">
                        Não somos um brinquedo. Apoiamos nossas ações nos marcos reais de desenvolvimento socioemocional e intelectual infantil (valores humanos, autonomia, empatia e coordenação).
                      </p>
                    </div>

                    {/* TRAÇO 4 */}
                    <div className="p-4 rounded-2xl border border-amber-200 bg-white space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg"> </span>
                        <h4 className="text-xs font-black text-slate-900">Zelosa & Guardiã</h4>
                      </div>
                      <p className="text-[10px] text-slate-600 leading-relaxed font-semibold">
                        Protegemos as memórias e os dados com o rigor máximo que um pai ou mãe exige. Somos o guardião permanente do legado e da privacidade de cada pequeno anjinho.
                      </p>
                    </div>

                  </div>
                </div>
              </motion.div>
            )}

            {/* CHAPTER: LINGUAGEM */}
            {activeChapter === 'linguagem' && (
              <motion.div
                key="linguagem"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center border-b border-amber-200/50 pb-4">
                  <div>
                    <span className="text-[9px] uppercase font-black text-indigo-500 tracking-wider">Capítulo 5</span>
                    <h2 className="text-xl sm:text-2xl font-serif font-black text-indigo-950">A Linguagem do Afeto</h2>
                  </div>
                  <span className="text-3xl"> </span>
                </div>

                <div className="space-y-6 text-xs sm:text-sm text-slate-800 leading-relaxed font-semibold">
                  <p>
                    Nossa linguagem é uma ponte afetiva. Ela traduz ações diárias em contos curtos de afeto, valorizando cada esforço pedagógico das escolas e tranquilizando o coração das famílias.
                  </p>

                  {/* INTERACTIVE BRAND VOICE SIMULATOR */}
                  <div className="bg-indigo-950 text-white rounded-3xl p-5 border border-indigo-900 space-y-4">
                    <div className="flex items-center justify-between border-b border-indigo-805 pb-2">
                      <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-400" /> Simulador Interativo de Tom de Voz
                      </h4>
                      <span className="text-[9px] bg-indigo-900/60 text-indigo-200 px-2 py-0.5 rounded-full">Anjinho AI Engine</span>
                    </div>

                    <p className="text-[10px] text-indigo-100 font-semibold leading-relaxed">
                      Selecione um cenário típico do cotidiano escolar para ver como a Linguagem de Afeto do Anjinho Escolar transforma uma mensagem burocrática comum em uma recordação inesquecível:
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {[
                        { id: 'refeicao', label: '  Refeição' },
                        { id: 'conflito', label: '  Conflito' },
                        { id: 'sono', label: '  Sono/Choro' },
                        { id: 'machucado', label: '  Pequeno Acidente' },
                      ].map((scen) => (
                        <button
                          key={scen.id}
                          type="button"
                          onClick={() => handleToneScenarioChange(scen.id)}
                          className={`text-[10px] font-black px-2.5 py-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                            testToneScenario === scen.id 
                              ? 'bg-amber-400 border-amber-400 text-indigo-950 shadow-sm' 
                              : 'bg-indigo-900/40 border-indigo-800 text-indigo-200 hover:bg-indigo-900/80'
                          }`}
                        >
                          {scen.label}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      <div className="bg-indigo-900/60 p-3.5 rounded-xl border border-indigo-850 space-y-1">
                        <span className="text-[9px] font-black text-rose-300 uppercase tracking-wider">Como as Agendas Comuns escrevem:</span>
                        <p className="text-[10px] font-medium leading-relaxed italic text-indigo-200">
                          "{testToneOutput.original}"
                        </p>
                      </div>

                      <div className="bg-amber-400/10 p-3.5 rounded-xl border border-amber-450/40 space-y-1 relative overflow-hidden">
                        <div className="absolute top-2 right-2 text-xs">✨</div>
                        <span className="text-[9px] font-black text-amber-300 uppercase tracking-wider">Como o Anjinho Escolar escreve:</span>
                        <p className="text-[10px] font-black leading-relaxed italic text-white font-serif">
                          "{testToneOutput.brandVoice}"
                        </p>
                      </div>
                    </div>

                    <div className="bg-indigo-900/40 p-3 rounded-lg border border-indigo-800 flex items-start gap-2">
                      <span className="text-xs"> </span>
                      <p className="text-[9px] text-indigo-150 leading-normal font-semibold">
                        <strong>Diretriz do Anjinho:</strong> {testToneOutput.tip}
                      </p>
                    </div>
                  </div>

                  {/* DO'S & DONT'S CARD */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-amber-250/20">
                    <div className="bg-white border border-red-200 rounded-2xl p-4 space-y-2">
                      <h4 className="text-xs font-black text-red-900 flex items-center gap-1.5">
                        <span className="text-red-500 font-bold">❌</span> O que EVITAR na linguagem:
                      </h4>
                      <ul className="text-[10px] text-slate-700 pl-4 list-disc space-y-1 font-semibold leading-relaxed">
                        <li>Falar como um robô corporativo: "No presente dia...", "O discente apresentou..."</li>
                        <li>Focar excessivamente no negativo sem acolhimento: "Fez birra", "Recusou-se a fazer a tarefa."</li>
                        <li>Chamar a criança de "aluno", "estudante" ou simplesmente pelo sobrenome em comunicações afetivas.</li>
                        <li>Burocratizar as pequenas mágicas: "O aluno completou o plantio do vegetal na terra."</li>
                      </ul>
                    </div>

                    <div className="bg-white border border-emerald-200 rounded-2xl p-4 space-y-2">
                      <h4 className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                        <span className="text-emerald-500 font-bold">✓</span> O que USAR na linguagem:
                      </h4>
                      <ul className="text-[10px] text-slate-700 pl-4 list-disc space-y-1 font-semibold leading-relaxed">
                        <li>Usar apelidos carinhosos e respeitosos: "Nosso anjinho", "Pequeno explorador", "Artista do dia."</li>
                        <li>Transformar desafios em aprendizados: "Hoje aprendemos a compartilhar", "Acolhemos a preguiça."</li>
                        <li>Descrever a ação física do educador: "Ganhamos colo quentinho", "Conversamos baixinho", "Elogiamos o esforço."</li>
                        <li>Criar narrativas: "Fizemos mágica na horta com as sementinhas", "Colorimos o papel com as mãos de arco-íris."</li>
                      </ul>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

            {/* CHAPTER: BRAND-004 */}
            {activeChapter === 'brand_004' && (
              <motion.div
                key="brand_004"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-amber-200/50 pb-4 gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-[9px] uppercase font-black bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 px-2 py-0.5 rounded-md tracking-wider">CÓDIGO: BRAND-004</span>
                      <span className="text-[9px] uppercase font-black bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 px-2 py-0.5 rounded-md tracking-wider">VERSÁO 1.0</span>
                      <span className="text-[9px] uppercase font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-0.5 rounded-md tracking-wider">STATUS: OFICIAL</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-serif font-black text-indigo-950">Tom de Voz e Linguagem da Marca</h2>
                  </div>
                  <span className="text-3xl shrink-0"> </span>
                </div>

                <div className="p-5 bg-amber-50/50 border border-amber-200 rounded-2xl space-y-3">
                  <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1">
                      Objetivo da Constituição
                  </h3>
                  <p className="text-[11px] text-slate-700 font-semibold leading-relaxed">
                    Definir como o <strong>Anjinho Escolar</strong> se comunica em todos os pontos de contato com diretoras, educadores, coordenação pedagógica, famílias e parceiros, garantindo uma linguagem consistente, acolhedora, humana e profundamente alinhada ao propósito da marca.
                  </p>
                </div>

                {/* O JEITO DE FALAR */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wider">O jeito de falar do Anjinho Escolar</h3>
                  <p className="text-xs text-slate-600 font-semibold">O Anjinho Escolar fala como uma escola que acolhe. Nunca como uma empresa tentando vender.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="bg-white border border-slate-150 p-4 rounded-xl space-y-2">
                      <h4 className="text-[11px] font-black text-indigo-900 uppercase">✨ Nossas Diretrizes</h4>
                      <ul className="text-[10px] text-slate-700 pl-4 list-disc space-y-1.5 font-semibold leading-relaxed">
                        <li>Nossa comunicação transmite serenidade, confiança e proximidade.</li>
                        <li>Não usamos palavras difíceis para impressionar. Usamos palavras para gerar compreensão.</li>
                        <li>Não simplificamos porque o público não entende. Simplificamos porque respeitamos o tempo precioso de quem lê.</li>
                      </ul>
                    </div>
                    <div className="bg-white border border-slate-150 p-4 rounded-xl space-y-2">
                      <h4 className="text-[11px] font-black text-indigo-900 uppercase">  Nossa Personalidade</h4>
                      <p className="text-[10px] text-slate-600 font-semibold leading-relaxed">Se o Anjinho Escolar fosse uma pessoa, seria alguém que:</p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {['escuta antes de responder', 'orienta sem impor', 'inspira confiança', 'demonstra organização', 'transmite calma', 'valoriza relações humanas', 'fala com clareza', 'acredita no poder da Educação Infantil'].map((item, idx) => (
                          <span key={idx} className="text-[9px] font-black bg-slate-50 border border-slate-150 px-2 py-1 rounded-lg text-slate-700">
                            ✓ {item}
                          </span>
                        ))}
                      </div>
                      <p className="text-[9.5px] font-black text-rose-600 pt-1.5 uppercase">⚠ Nunca arrogante, exagerado ou impessoal.</p>
                    </div>
                  </div>
                </div>

                {/* COMO ESCREVEMOS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wider">Como escrevemos</h3>
                    <div className="bg-indigo-50/30 border border-indigo-100 p-4 rounded-xl space-y-1.5">
                      <p className="text-[10.5px] text-indigo-950 font-bold">Sempre escrevemos de forma:</p>
                      <div className="flex flex-wrap gap-1">
                        {['clara', 'acolhedora', 'objetiva', 'elegante', 'humana', 'otimista', 'respeitosa'].map((item, idx) => (
                          <span key={idx} className="text-[9.5px] font-black bg-indigo-50 border border-indigo-100 text-indigo-850 px-2 py-0.5 rounded-full">
                            ★ {item}
                          </span>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-700 leading-relaxed font-semibold pt-1">
                        Preferimos frases curtas, linguagem natural e explicar detalhadamente com sensibilidade em vez de tentar impressionar.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wider">O que queremos transmitir</h3>
                    <div className="bg-emerald-50/20 border border-emerald-100 p-4 rounded-xl space-y-1.5">
                      <p className="text-[10.5px] text-emerald-950 font-bold">Em cada texto, a leitora deve sentir:</p>
                      <div className="flex flex-wrap gap-1">
                        {['confiança', 'acolhimento', 'organização', 'profissionalismo', 'serenidade', 'propósito'].map((item, idx) => (
                          <span key={idx} className="text-[9.5px] font-black bg-emerald-50 border border-emerald-100 text-emerald-850 px-2 py-0.5 rounded-full">
                            ❤ {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* PALAVRAS DA IDENTIDADE */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wider">Palavras que fazem parte da nossa identidade</h3>
                  <p className="text-xs text-slate-600 font-semibold">Estas palavras reforçam o posicionamento e devem aparecer naturalmente ao longo de relatórios, relatórios assistidos por voz e comunicações:</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="p-3 bg-white border border-amber-200 rounded-xl space-y-1.5">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase">  Relações</h4>
                      <p className="text-[9.5px] font-semibold text-slate-750 leading-relaxed">relacionamento, aproximação, parceria, diálogo, presença, vínculo, confiança, acolhimento, comunidade</p>
                    </div>
                    <div className="p-3 bg-white border border-amber-200 rounded-xl space-y-1.5">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase">🏫 Educação</h4>
                      <p className="text-[9.5px] font-semibold text-slate-750 leading-relaxed">Educação Infantil, desenvolvimento, aprendizagem, inf descoberta, evolução, cuidado, protagonismo da criança</p>
                    </div>
                    <div className="p-3 bg-white border border-amber-200 rounded-xl space-y-1.5">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase">  Família</h4>
                      <p className="text-[9.5px] font-semibold text-slate-750 leading-relaxed">famílias, responsáveis, participação, conexão, presença, compartilhamento</p>
                    </div>
                    <div className="p-3 bg-white border border-amber-200 rounded-xl space-y-1.5">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase">🏫 Escola</h4>
                      <p className="text-[9.5px] font-semibold text-slate-750 leading-relaxed">escola, educadores, professoras, coordenação, direção, equipe pedagógica</p>
                    </div>
                    <div className="p-3 bg-white border border-amber-200 rounded-xl space-y-1.5">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase">  Produto</h4>
                      <p className="text-[9.5px] font-semibold text-slate-750 leading-relaxed">plataforma, experiência, organização, rotina, comunicação, registro, história, jornada, memória, simplicidade</p>
                    </div>
                    <div className="p-3 bg-white border border-amber-200 rounded-xl space-y-1.5">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase">❤ Valores</h4>
                      <p className="text-[9.5px] font-semibold text-slate-750 leading-relaxed">propósito, cuidado, confiança, transparência, respeito, continuidade, significado</p>
                    </div>
                  </div>
                </div>

                {/* EXPRESSÕES QUE REPRESENTAM A MARCA */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wider">Expressões que representam a marca</h3>
                    <span className="text-[10px] text-indigo-500 font-semibold">Toque para copiar</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      'fortalecer a relação entre escola e família',
                      'valorizar o trabalho dos educadores',
                      'acompanhar o desenvolvimento da criança',
                      'preservar a história da inf',
                      'aproximar pessoas com cuidado',
                      'organizar a rotina com simplicidade',
                      'tornar cada momento significativo',
                      'construir lembranças para o futuro',
                      'transformar registros em memórias',
                      'comunicar com afeto e cuidado'
                    ].map((exp, i) => (
                      <button
                        key={i}
                        onClick={() => handleCopy(exp, `exp_${i}`)}
                        className="p-3 bg-white hover:bg-amber-50/30 border border-slate-150 rounded-xl text-left text-[10.5px] font-semibold text-slate-800 transition-all flex items-center justify-between cursor-pointer group"
                      >
                        <span className="font-serif italic font-bold">"{exp}"</span>
                        <span className="text-[9px] text-slate-400 group-hover:text-indigo-600 flex items-center gap-1">
                          {copiedText === `exp_${i}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* PALAVRAS QUE EVITAMOS */}
                <div className="space-y-3 bg-rose-50/15 border border-rose-250/50 p-5 rounded-2xl">
                  <h3 className="text-xs font-black text-rose-950 uppercase tracking-wider flex items-center gap-1">
                      Palavras que evitamos a todo custo
                  </h3>
                  <p className="text-[10px] text-slate-650 font-semibold leading-relaxed">
                    Estas expressões ou termos comerciais/frios rompem a conexão de carinho e a seriedade ética. Salve em contextos estritamente técnicos, evite sempre:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="space-y-1 text-[10px] font-semibold text-slate-700">
                      <strong className="text-rose-900 block text-[10.5px] uppercase">  Linguagem Comercial</strong>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {['imperdível', 'promoção', 'desconto', 'gatilho', 'compre agora', 'oportunidade única'].map((word, idx) => (
                          <span key={idx} className="bg-rose-50 border border-rose-100 text-rose-800 text-[9px] px-1.5 py-0.5 rounded">
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1 text-[10px] font-semibold text-slate-700">
                      <strong className="text-rose-900 block text-[10.5px] uppercase">  Corporativa Fria / TI</strong>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {['software', 'sistema', 'disruptivo', 'sinergia', 'KPI', 'otimização', 'benchmark', 'stakeholders'].map((word, idx) => (
                          <span key={idx} className="bg-rose-50 border border-rose-100 text-rose-800 text-[9px] px-1.5 py-0.5 rounded">
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1 text-[10px] font-semibold text-slate-700">
                      <strong className="text-rose-900 block text-[10.5px] uppercase">  Infantilizada / Medo</strong>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {['fofinho', 'lindinho', 'turminha', 'perder dinheiro', 'ficar para trás', 'desastre'].map((word, idx) => (
                          <span key={idx} className="bg-rose-50 border border-rose-100 text-rose-800 text-[9px] px-1.5 py-0.5 rounded">
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-rose-150/40 text-[9.5px] italic font-semibold text-rose-900 leading-normal">
                    * Falamos sobre a inf com respeito técnico e afeto profundo. Não infantilizamos quem trabalha com ela e nunca exploramos as inseguranças das diretoras baseando nossa comunicação no medo ou em mercantilismo frio.
                  </div>
                </div>

                {/* COMO FALAMOS SOBRE OS TEMAS CHAVE */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wider">Como tratamos temas-chave</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl bg-white border border-slate-150 space-y-2">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase">  Tecnologia e Produto</h4>
                      <p className="text-[10px] text-slate-750 font-semibold leading-relaxed">
                        A tecnologia nunca é protagonista; trabalha nos bastidores para que educadores e famílias se concentrem na relação humana. 
                      </p>
                      <p className="text-[9.5px] font-black text-indigo-900">
                        Evitamos "Mais uma agenda digital" ou "Gestão/Controle escolar". Prefira: "Plataforma de relacionamento", "Comunicação organizada", "Acompanhamento".
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-white border border-slate-150 space-y-2">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase">  A Criança e a Escola</h4>
                      <p className="text-[10px] text-slate-750 font-semibold leading-relaxed">
                        A criança nunca é um número, usuário ou cadastro. Ela é sempre descrita como: criança, inf desenvolvimento, história, descoberta, jornada de aprendizagem.
                      </p>
                      <p className="text-[9.5px] font-black text-indigo-900">
                        A escola nunca é tratada apenas como um cliente comum. Ela é nossa parceira permanente que transforma vidas.
                      </p>
                    </div>
                  </div>
                </div>

                {/* ANTES DE PUBLICAR: PLAYGROUND INTERATIVO E FILTRO */}
                <div className="border-t border-slate-200/50 pt-6 space-y-4">
                  <div className="bg-gradient-to-tr from-indigo-900 to-[#120F2D] p-5 sm:p-6 rounded-3xl border border-indigo-850 text-white relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl"></div>
                    <div className="relative z-10 space-y-4">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-amber-300">Antes de publicar qualquer texto / relatório</span>
                        <h4 className="text-sm sm:text-base font-serif font-black text-white">Constituição da Marca • Verificador do Tom de Voz</h4>
                        <p className="text-[11px] text-indigo-200 font-semibold">Escreva ou cole seu rascunho de comunicação abaixo e responda às 8 perguntas de ouro para validar a sintonia com os nossos princípios:</p>
                      </div>

                      <div className="space-y-2">
                        <textarea
                          placeholder="Escreva seu rascunho de relatório ou e-mail aqui para testar..."
                          className="w-full p-3 rounded-2xl bg-indigo-950/80 border border-indigo-800 text-xs font-semibold h-24 focus:ring-2 focus:ring-amber-400/40 outline-none placeholder:text-indigo-400 text-white"
                          value={checklistText}
                          onChange={(e) => setChecklistText(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2 pt-1">
                        <span className="text-[10px] font-black uppercase text-indigo-250 tracking-wider">Perguntas de Filtro da Marca:</span>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {[
                            { key: 'claro', label: '1. Está perfeitamente claro?' },
                            { key: 'humano', label: '2. Está humano e carinhoso?' },
                            { key: 'respeitoso', label: '3. Está estritamente respeitoso?' },
                            { key: 'simples', label: '4. Está simples, sem jargões corporativos?' },
                            { key: 'alinhado', label: '5. Está alinhado ao nosso propósito educativo?' },
                            { key: 'confianca', label: '6. A diretora e os pais sentiriam confiança ao ler?' },
                            { key: 'tecnologiaSecundaria', label: '7. A tecnologia ficou em segundo plano?' },
                            { key: 'criancaCentro', label: '8. A criança continua no centro da narrativa?' },
                          ].map((item) => (
                            <label
                              key={item.key}
                              className="flex items-center gap-2 bg-indigo-950/40 p-2.5 rounded-xl border border-indigo-900/60 hover:bg-indigo-900/30 cursor-pointer select-none"
                            >
                              <input
                                type="checkbox"
                                className="rounded text-amber-400 focus:ring-amber-400 bg-indigo-950 border-indigo-800"
                                checked={(checklistScore as any)[item.key]}
                                onChange={(e) => setChecklistScore(prev => ({ ...prev, [item.key]: e.target.checked }))}
                              />
                              <span className="text-[10.5px] font-semibold text-indigo-150">{item.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* SCORE CARD */}
                      {Object.values(checklistScore).filter(Boolean).length > 0 && (
                        <div className="p-4 bg-indigo-950/85 border border-indigo-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-slide-down">
                          <div className="space-y-1 text-center sm:text-left">
                            <span className="text-[9px] uppercase font-black tracking-widest text-emerald-400">Score de Qualidade Verbal:</span>
                            <div className="text-xs font-black">
                              {Object.values(checklistScore).filter(Boolean).length === 8 ? (
                                <span className="text-emerald-400 flex items-center gap-1 font-serif text-sm">
                                    100% Alinhado ao Cuidado do Anjinho Escolar!
                                </span>
                              ) : (
                                <span>Aprovou {Object.values(checklistScore).filter(Boolean).length} de 8 critérios. {Object.values(checklistScore).filter(Boolean).length < 8 && 'Recomendamos ajustar para atingir o selo de ouro!'}</span>
                              )}
                            </div>
                          </div>
                          <div className="w-16 h-16 rounded-full border-4 border-indigo-800 flex items-center justify-center font-black text-amber-300 text-sm shrink-0">
                            {Math.round((Object.values(checklistScore).filter(Boolean).length / 8) * 100)}%
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* GOLDEN RULES BANNERS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-200/50 pt-6">
                  <div className="bg-[#FFFDF3] border border-indigo-200 p-5 rounded-2xl space-y-2 text-center flex flex-col justify-between">
                    <div>
                      <span className="text-sm"> </span>
                      <h4 className="text-[11px] font-black text-indigo-950 uppercase tracking-widest mt-1">A Regra de Ouro da Comunicação</h4>
                    </div>
                    <p className="font-serif italic text-indigo-900 font-bold text-xs sm:text-sm py-2">
                      "Não escrevemos para vender um software. Escrevemos para fortalecer a confiança entre escola, família e criança."
                    </p>
                  </div>

                  <div className="bg-[#FFFDF3] border border-amber-300 p-5 rounded-2xl space-y-2 text-center flex flex-col justify-between">
                    <div>
                      <span className="text-sm"> </span>
                      <h4 className="text-[11px] font-black text-indigo-950 uppercase tracking-widest mt-1">O Princípio Permanente da Marca</h4>
                    </div>
                    <p className="font-serif italic text-amber-950 font-bold text-xs sm:text-sm py-2">
                      "Toda palavra deve transmitir o mesmo cuidado que esperamos de uma escola de Educação Infantil."
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* CHAPTER: PILARES */}
            {activeChapter === 'pilares' && (
              <motion.div
                key="pilares"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center border-b border-amber-200/50 pb-4">
                  <div>
                    <span className="text-[9px] uppercase font-black text-indigo-500 tracking-wider">Capítulo 6</span>
                    <h2 className="text-xl sm:text-2xl font-serif font-black text-indigo-950">Os Três Pilares Emocionais</h2>
                  </div>
                  <span className="text-3xl"> </span>
                </div>

                <div className="space-y-6 text-xs sm:text-sm text-slate-800 leading-relaxed font-semibold">
                  <p>
                    Nossa marca se apoia em uma tríade indivisível que sustenta todo o ecossistema emocional do aplicativo. Cada linha de código que escrevemos serve a um desses três pilares fundamentais:
                  </p>

                  <div className="space-y-4">
                    
                    {/* PILAR 1 */}
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-amber-200 shadow-3xs group hover:border-amber-400 transition-all">
                      <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center shrink-0 text-xl font-bold">
                         
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-slate-900">Pilar 1: Memórias (Preservação do Legado)</h4>
                          <span className="text-[8px] font-black uppercase tracking-widest bg-sky-100 text-sky-800 px-2 py-0.5 rounded">Eternidade</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                          A primeira inf passa rápido demais. Acreditamos que cada marco — o primeiro 'por favor' espont o primeiro amigo, o desenho da família — é um tesouro nacional privado. Nós tratamos fotos, áudios e pequenos relatos não como 'registros de banco de dados', mas como relíquias digitais permanentes e exportáveis para toda a vida.
                        </p>
                      </div>
                    </div>

                    {/* PILAR 2 */}
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-amber-200 shadow-3xs group hover:border-amber-400 transition-all">
                      <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center shrink-0 text-xl font-bold">
                        ❤
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-slate-900">Pilar 2: Relacionamento (Parceria de Confiança)</h4>
                          <span className="text-[8px] font-black uppercase tracking-widest bg-rose-100 text-rose-850 px-2 py-0.5 rounded">Empatia</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                          A escola e os pais não são prestadores e tomadores de serviço burocrático; são parceiros de co-autoria da história da criança. Eliminamos barreiras, abrimos as cortinas das salas de aula com afeto e construímos pontes de reciprocidade e gratidão emocional entre educadores e famílias.
                        </p>
                      </div>
                    </div>

                    {/* PILAR 3 */}
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-amber-200 shadow-3xs group hover:border-amber-400 transition-all">
                      <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 text-xl font-bold">
                         
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-slate-900">Pilar 3: Desenvolvimento (Progresso Humano)</h4>
                          <span className="text-[8px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">Legado</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                          Não registramos apenas notas ou comparecimento físico. Acompanhamos a evolução integral da criança: a empatia, o espírito de compartilhar, a independência física, a superação de medos e a inteligência lúdica. Cada pequena vitória diária é tratada como um passo glorioso de um lindo legado futuro.
                        </p>
                      </div>
                    </div>

                  </div>
                </div>
              </motion.div>
            )}

            {/* CHAPTER: NARRATIVA */}
            {activeChapter === 'narrativa' && (
              <motion.div
                key="narrativa"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center border-b border-amber-200/50 pb-4">
                  <div>
                    <span className="text-[9px] uppercase font-black text-indigo-500 tracking-wider">Capítulo 7</span>
                    <h2 className="text-xl sm:text-2xl font-serif font-black text-indigo-950">Slogans & Narrativa de Marca</h2>
                  </div>
                  <span className="text-3xl">✉</span>
                </div>

                <div className="space-y-6 text-xs sm:text-sm text-slate-800 leading-relaxed font-semibold">
                  
                  {/* SLOGANS SECTION */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wide">Nossos Slogans Oficiais</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { 
                          text: "Onde os primeiros capítulos da inf são guardados com amor.", 
                          type: "Slogan Institucional Principal" 
                        },
                        { 
                          text: "Mais que uma agenda escolar: um relicário vivo de descobertas.", 
                          type: "Slogan Comercial / Diferenciação" 
                        },
                        { 
                          text: "Para ler, amar e recordar. Sempre.", 
                          type: "Tagline de Produto / Pais" 
                        },
                        { 
                          text: "Eternizando cada conquista do seu pequeno anjinho.", 
                          type: "Slogan de Engajamento Diário" 
                        },
                      ].map((slog, i) => (
                        <div 
                          key={i}
                          className="p-4 rounded-xl border border-amber-200 bg-white shadow-3xs flex flex-col justify-between hover:shadow-2xs transition-all relative group"
                        >
                          <span className="text-[8px] font-black uppercase text-indigo-500 tracking-wider mb-2 block">{slog.type}</span>
                          <p className="text-xs font-black text-slate-900 font-serif italic mb-3">"{slog.text}"</p>
                          <button
                            type="button"
                            onClick={() => handleCopy(slog.text, `slog_${i}`)}
                            className="text-[9px] text-slate-500 hover:text-indigo-600 font-black flex items-center gap-1 self-end bg-slate-50 px-2 py-1 rounded-md cursor-pointer transition-colors"
                          >
                            {copiedText === `slog_${i}` ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-500" /> Copiado!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" /> Copiar Slogan
                              </>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* NARRATIVA DE MARCA */}
                  <div className="space-y-3 border-t border-amber-250/20 pt-4">
                    <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wide">A Narrativa Principal (The Brand Story)</h3>
                    
                    <div className="bg-[#FAF6EE] border-2 border-dashed border-amber-300 p-6 rounded-2xl relative overflow-hidden font-serif space-y-4 text-justify text-slate-800 leading-relaxed italic">
                      <Quote className="absolute right-6 top-6 w-16 h-16 text-amber-200/40 opacity-40 shrink-0 pointer-events-none" />
                      
                      <p className="font-serif">
                        Amanhã pela manhã, uma criança pequena vai passar pela porta de uma escola infantil. Ela vai soltar a mão de sua mãe, talvez com um pequeno frio na barriga, e vai dar os primeiros passos em um território de descobertas incríveis. 
                      </p>
                      <p className="font-serif">
                        Nas próximas oito horas, essa criança vai plantar uma sementinha na horta da escola. Ela vai compartilhar seu giz de cera favorito com um colega choroso, desenhar um sol verde que brilha no canto de uma folha de papel e rir até a barriga doer ao ouvir a professora fazer vozes de dragão em uma história de fantoche.
                      </p>
                      <p className="font-serif">
                        Quando a tarde cair e sua mãe voltar para buscá-la, a criança estará exausta e feliz. Mas quando a mãe perguntar 'O que você fez hoje na escola, meu amor?', a criança simplesmente responderá: 'Brinquei'. E todo aquele universo poético de desenvolvimento socioemocional, pequenos progressos e grandes feiras de artes se perderá no vento do cotidiano burocrático.
                      </p>
                      <p className="font-serif text-indigo-950 font-black not-italic border-l-4 border-amber-400 pl-4">
                        O Anjinho Escolar nasceu para resgatar esse universo. Nós nos recusamos a tratar a rotina da escola como uma lista fria de 'comeu', 'dormiu' e 'boletos'. Nós empoderamos as escolas para capturarem as pequenas mágicas invisíveis, e embalamos essas lembranças como uma carta de amor contínua para as famílias. 
                      </p>
                      <p className="font-serif font-bold text-amber-900 text-center pt-2">
                        Porque nós não guardamos dados escolares. Nós somos o baú do tesouro onde os primeiros e mais preciosos capítulos da vida de um filho são eternizados para sempre.
                      </p>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

            {/* CHAPTER: EXPERIENCIA */}
            {activeChapter === 'experiencia' && (
              <motion.div
                key="experiencia"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center border-b border-amber-200/50 pb-4">
                  <div>
                    <span className="text-[9px] uppercase font-black text-indigo-500 tracking-wider">Capítulo 8</span>
                    <h2 className="text-xl sm:text-2xl font-serif font-black text-indigo-950">A Experiência do Legado</h2>
                  </div>
                  <span className="text-3xl"> </span>
                </div>

                <div className="space-y-6 text-xs sm:text-sm text-slate-800 leading-relaxed font-semibold font-sans">
                  <p>
                    Nosso design de produto materializa o posicionamento e os pilares de marca em recursos tangíveis, elegantes e intencionais. Não adicionamos funções de forma aleatória; cada tela é desenhada para evocar afeto e encantamento.
                  </p>

                  <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wide">4 Pilares de Experiência Prática no Produto</h3>

                  <div className="space-y-3.5">
                    
                    {/* XP 1 */}
                    <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-3xs flex gap-3.5 items-start">
                      <span className="text-xl">✉</span>
                      <div>
                        <h4 className="text-xs font-black text-slate-900">1. A Carta para o Futuro (Cápsula do Tempo)</h4>
                        <p className="text-[10px] text-slate-600 leading-relaxed font-semibold mt-1">
                          No encerramento da Educação Infantil, nossa inteligência aglutina as fotos marcadas como "Inesquecíveis" e as conquistas mais marcantes para formatar uma linda Carta Digital e Impressa para a criança ler daqui a 10 anos. Um presente inestimável e inimitável para as famílias.
                        </p>
                      </div>
                    </div>

                    {/* XP 2 */}
                    <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-3xs flex gap-3.5 items-start">
                      <span className="text-xl"> </span>
                      <div>
                        <h4 className="text-xs font-black text-slate-900">2. O Selo de Preservação Anjinho Escolar</h4>
                        <p className="text-[10px] text-slate-600 leading-relaxed font-semibold mt-1">
                          Todas as fotos publicadas na Linha do Tempo e nos Relatórios recebem nosso "Selo de Preservação", garantindo que aquelas mídias e lembranças estão guardadas e criptografadas em servidores seguros de alta perenidade, prontas para serem baixadas a qualquer momento do futuro.
                        </p>
                      </div>
                    </div>

                    {/* XP 3 */}
                    <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-3xs flex gap-3.5 items-start">
                      <span className="text-xl"> </span>
                      <div>
                        <h4 className="text-xs font-black text-slate-900">3. Valores Vivenciados (Desenvolvimento Ético)</h4>
                        <p className="text-[10px] text-slate-600 leading-relaxed font-semibold mt-1">
                          Em vez de relatórios puramente acadêmicos, os professores selecionam quais valores éticos o anjinho demonstrou em cada registro: Gentileza, Empatia, Cooperação, Respeito ou Compartilhamento. Uma visão holística sobre quem a criança está se tornando.
                        </p>
                      </div>
                    </div>

                    {/* XP 4 */}
                    <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-3xs flex gap-3.5 items-start">
                      <span className="text-xl"> </span>
                      <div>
                        <h4 className="text-xs font-black text-slate-900">4. Linha do Tempo de Momentos Inesquecíveis</h4>
                        <p className="text-[10px] text-slate-600 leading-relaxed font-semibold mt-1">
                          Os pais contam com uma galeria afetiva dedicada exclusiva aos "Momentos Inesquecíveis". Um feed livre de ruídos operacionais, focado apenas no brilho estético dos marcos mais bonitos da rotina do seu filho.
                        </p>
                      </div>
                    </div>

                  </div>

                  <div className="text-center py-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                    <p className="text-xs font-extrabold text-indigo-950 font-serif">
                      "Criamos produtos para educadores, mas construímos memórias eternas para pais."
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeChapter === 'metodo_arvore' && (
              <motion.div
                key="metodo_arvore"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center border-b border-amber-200/50 pb-4">
                  <div>
                    <span className="text-[9px] uppercase font-black text-indigo-500 tracking-wider">Capítulo 9</span>
                    <h2 className="text-xl sm:text-2xl font-serif font-black text-indigo-950">Método Árvore da Inf</h2>
                  </div>
                  <span className="text-3xl"> </span>
                </div>

                <div className="space-y-6 text-xs sm:text-sm text-slate-800 leading-relaxed font-semibold font-sans">
                  <div className="p-5 rounded-2xl bg-gradient-to-tr from-amber-50 to-emerald-50 border border-amber-250/60 shadow-inner">
                    <p className="font-serif italic text-sm text-slate-800 text-center leading-relaxed">
                      "Toda criança é uma semente. A família planta. A escola cultiva. O Anjinho Escolar preserva essa história."
                    </p>
                  </div>

                  <p>
                    O <strong>Método Árvore da Inf</strong> é a nossa metodologia exclusiva e registrada de comunicação afetiva, documentação do desenvolvimento e preservação de legados. Com ele, o Anjinho Escolar deixa de ser um mero software de rotina e se consolida como uma propriedade intelectual insubstituível.
                  </p>

                  <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wide">Os 5 Princípios do Método</h3>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 pt-1 font-sans">
                    <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-3xs text-center space-y-1.5 flex flex-col items-center">
                      <span className="text-2xl block"> </span>
                      <h4 className="text-xs font-black text-slate-900">1. Plantar</h4>
                      <p className="text-[10px] text-slate-600 leading-relaxed font-semibold">
                        Acolhimento e confiança. Registros essenciais de rotina (sono, alimentação, higiene).
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-3xs text-center space-y-1.5 flex flex-col items-center">
                      <span className="text-2xl block"> </span>
                      <h4 className="text-xs font-black text-slate-900">2. Cultivar</h4>
                      <p className="text-[10px] text-slate-600 leading-relaxed font-semibold">
                        Estímulo diário. Oficinas de arte, experiências pedagógicas, fotos e descobertas.
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-3xs text-center space-y-1.5 flex flex-col items-center">
                      <span className="text-2xl block"> </span>
                      <h4 className="text-xs font-black text-slate-900">3. Florescer</h4>
                      <p className="text-[10px] text-slate-600 leading-relaxed font-semibold">
                        Valores humanos visíveis. Empatia, cooperação, gentileza, respeito e autonomia.
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-3xs text-center space-y-1.5 flex flex-col items-center">
                      <span className="text-2xl block"> </span>
                      <h4 className="text-xs font-black text-slate-900">4. Frutificar</h4>
                      <p className="text-[10px] text-slate-600 leading-relaxed font-semibold">
                        Legado consolidado. O Álbum da Primeira Inf e a Linha do Tempo Inesquecível.
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-3xs text-center space-y-1.5 flex flex-col items-center">
                      <span className="text-2xl block"> </span>
                      <h4 className="text-xs font-black text-slate-900">5. Preservar</h4>
                      <p className="text-[10px] text-slate-600 leading-relaxed font-semibold">
                        Permanência vitalícia. Garantia de guarda segura e perene das mídias para o futuro.
                      </p>
                    </div>
                  </div>

                  <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wide">As 5 Estações de Crescimento (Índice de Cultivo)</h3>
                  <p className="text-xs text-slate-700">
                    A árvore da criança cresce no aplicativo de forma org de acordo com o seu <strong>Índice de Cultivo</strong>. Este índice é um indicador de qualidade (não apenas de volume), ponderando registros enriquecidos com fotos, momentos marcados como "Inesquecíveis" e valores vivenciados.
                  </p>

                  <div className="space-y-2.5 font-sans">
                    <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xl"> </span>
                        <div>
                          <h4 className="text-xs font-black text-indigo-950">Estação 1: A Semente</h4>
                          <p className="text-[10px] text-slate-600">Fase inicial de adaptação e criação de laços afetuosos.</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black bg-white px-2 py-0.5 rounded-full border border-amber-200">0 - 15 pts</span>
                    </div>

                    <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xl"> </span>
                        <div>
                          <h4 className="text-xs font-black text-indigo-950">Estação 2: Os Primeiros Brotos</h4>
                          <p className="text-[10px] text-slate-600">Curiosidade e exploração ativa das novas din pedagógicas.</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black bg-white px-2 py-0.5 rounded-full border border-emerald-200">16 - 40 pts</span>
                    </div>

                    <div className="p-3 bg-sky-50/50 border border-sky-200 rounded-xl flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xl"> </span>
                        <div>
                          <h4 className="text-xs font-black text-indigo-950">Estação 3: Raízes Fortes</h4>
                          <p className="text-[10px] text-slate-600">Desenvolvimento da autonomia, independência e autoconfiança sólida.</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black bg-white px-2 py-0.5 rounded-full border border-sky-200">41 - 75 pts</span>
                    </div>

                    <div className="p-3 bg-pink-50/50 border border-pink-200 rounded-xl flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xl"> </span>
                        <div>
                          <h4 className="text-xs font-black text-indigo-950">Estação 4: Tempo de Florescer</h4>
                          <p className="text-[10px] text-slate-600">Desabrochar da inteligência emocional, empatia, cooperação e gentileza.</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black bg-white px-2 py-0.5 rounded-full border border-pink-200">76 - 110 pts</span>
                    </div>

                    <div className="p-3 bg-amber-100/30 border border-amber-300 rounded-xl flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xl"> </span>
                        <div>
                          <h4 className="text-xs font-black text-indigo-950">Estação 5: Árvore de Frutos</h4>
                          <p className="text-[10px] text-slate-600">O legado completo da inf com memórias maduras, prontas para as próximas etapas da vida.</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black bg-white px-2 py-0.5 rounded-full border border-amber-300">111+ pts</span>
                    </div>
                  </div>

                  <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wide">Poder Comercial e Posicionamento de IP</h3>
                  <div className="bg-[#FFFDF9] p-4 rounded-xl border border-amber-200/60 shadow-3xs space-y-2">
                    <p className="text-[11px] text-slate-700 leading-relaxed">
                      <strong>1. Diferenciação Absoluta:</strong> Enquanto os concorrentes brigam no oceano vermelho vendendo agendas frias de "sono e comida", nós oferecemos uma metodologia de formação e documentação de legado de vida.
                    </p>
                    <p className="text-[11px] text-slate-700 leading-relaxed">
                      <strong>2. Venda Consultiva para Diretores:</strong> O discurso não é sobre tecnologia, é sobre cultivar a floresta de futuros. "Diretora, a senhora não administra turmas, a senhora cultiva uma floresta inteira de futuros."
                    </p>
                    <p className="text-[11px] text-slate-700 leading-relaxed">
                      <strong>3. Formação Continuada para Professores:</strong> O treinamento deixa de ser um tutorial do sistema e passa a ser uma formação na metodologia de observação e afeto, valorizando a profissão do educador.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeChapter === 'protecao_marca' && (() => {
              const totalItems = Object.keys(ipProtections).length;
              const activeCount = Object.values(ipProtections).filter(Boolean).length;
              const percent = Math.round((activeCount / totalItems) * 100);

              let level = 'Crítico  ';
              let riskBg = 'bg-rose-50 border-rose-200 text-rose-800';
              let barColor = 'bg-rose-500';
              let desc = 'Sua propriedade intelectual está exposta. Concorrentes podem facilmente plagiar sua marca, copiar sua interface e até mesmo clonar seus scripts sem grandes barreiras jurídicas ou técnicas.';

              if (percent >= 30 && percent < 60) {
                level = 'Moderado ⚠';
                riskBg = 'bg-amber-50 border-amber-200 text-amber-800';
                barColor = 'bg-amber-500';
                desc = 'Você já implementou as primeiras defesas (ex: NDA ou termos de uso), mas ainda possui vulnerabilidades críticas. Seu principal método ("Árvore da Inf") ou seu logotipo ainda podem ser imitados.';
              } else if (percent >= 60 && percent < 90) {
                level = 'Seguro & Blindado  ';
                riskBg = 'bg-indigo-50 border-indigo-200 text-indigo-900';
                barColor = 'bg-indigo-600';
                desc = 'Sua marca possui barreiras legais e tecnológicas consolidadas. Cópias triviais serão combatidas judicialmente de forma rápida e a extração do seu código é extremamente difícil.';
              } else if (percent >= 90) {
                level = 'Fortaleza Intelectual  ';
                riskBg = 'bg-emerald-50 border-emerald-250 text-emerald-950';
                barColor = 'bg-emerald-500';
                desc = 'Parabéns! Sua propriedade intelectual está blindada em todas as esferas. Seus métodos, marcas, código-fonte e dados estão protegidos por contratos impecáveis e tecnologias antipirataria.';
              }

              const templateNda = `ACORDO DE CONFIDENCIALIDADE E NÁO-CONCORRÊNCIA (NDA)

Pelo presente instrumento particular, de um lado ANJINHO ESCOLAR TECNOLOGIA LTDA, e de outro lado o CONTRATADO, ajustam o seguinte:

1. OBJETO: O Contratado terá acesso a informações confidenciais relativas à arquitetura, código-fonte, metodologia "Árvore da Inf" e segredos de negócios do aplicativo Anjinho Escolar.
2. OBRIGAÇÁO DE SIGILO: O Contratado obriga-se a manter absoluto sigilo sobre todas as Informações Confidenciais, não as revelando a terceiros nem utilizando-as para fins alheios ao projeto.
3. NÁO-CONCORRÊNCIA: O Contratado compromete-se a não desenvolver, participar, prestar consultoria ou assessorar direta ou indiretamente qualquer software de gestão escolar, diário ou agenda escolar pelo prazo de 24 (vinte e quatro) meses a contar do término deste vínculo.
4. PENALIDADES: O descumprimento de qualquer cláusula ensejará multa penal de R$ 100.000,00, sem prejuízo de perdas e danos e medidas criminais cabíveis.`;

              const templateNotice = `NOTIFICAÇÁO EXTRAJUDICIAL POR PLÁGIO E USO INDEVIDO DE MARCA

À [NOME DO INFRATOR / CONCORRENTE]

Prezados,

Constatamos que sua empresa está utilizando, sem prévia autorização, elementos visuais, identidade de marca e/ou a metodologia registrada de propriedade exclusiva de ANJINHO ESCOLAR TECNOLOGIA LTDA.

Tais condutas configuram concorrência desleal e violação da Lei de Propriedade Industrial (Lei 9.279/96), da Lei do Software (Lei 9.609/98) e da Lei de Direitos Autorais (Lei 9.610/98).

Solicitamos que, no prazo improrrogável de 48 (quarenta e oito) horas, cesse imediatamente todo e qualquer uso dos referidos elementos sob pena de adoção de medidas judiciais cíveis (indenização por perdas e danos e lucros cessantes) e criminais cabíveis.`;

              return (
                <motion.div
                  key="protecao_marca"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-center border-b border-amber-200/50 pb-4">
                    <div>
                      <span className="text-[9px] uppercase font-black text-indigo-500 tracking-wider">Capítulo 10 • Diretrizes</span>
                      <h2 className="text-xl sm:text-2xl font-serif font-black text-indigo-950">BRAND-005 — Segurança, Blindagem & IP</h2>
                    </div>
                    <span className="text-3xl"> </span>
                  </div>

                  <div className="space-y-4 text-xs sm:text-sm text-slate-800 leading-relaxed font-semibold font-sans">
                    <p>
                      Para que o <strong>Anjinho Escolar</strong> seja uma marca de valor inestimável e protegida contra a comoditização, precisamos blindá-la legal e tecnologicamente. A concorrência pode tentar copiar nosso visual, mas nunca poderá copiar nossa integridade legal, nossa marca registrada e nossos algoritmos exclusivos.
                    </p>

                    {/* INTERACTIVE SIMULATOR */}
                    <div className="p-5 rounded-2xl bg-gradient-to-tr from-[#FAF9F5] to-[#F1F5F9] border border-amber-200/70 shadow-sm space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="text-base"> </span>
                        <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wide">Simulador de Vulnerabilidade & Blindagem de IP</h3>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        Selecione quais mecanismos de proteção estão ativos no momento para calcular em tempo real o <strong>Índice de Vulnerabilidade</strong> do produto e gerar o plano de ação adequado:
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                        {/* Legal Side */}
                        <div className="space-y-3 p-4 bg-white rounded-xl border border-slate-200/60 shadow-3xs">
                          <h4 className="text-[11px] font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1">
                            <span>⚖</span> Proteções Legais & Contratos
                          </h4>
                          <div className="space-y-2.5">
                            <label className="flex items-start gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={ipProtections.brandInpi}
                                onChange={e => setIpProtections({ ...ipProtections, brandInpi: e.target.checked })}
                                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 mt-0.5 shrink-0"
                              />
                              <div className="space-y-0.5">
                                <span className="block text-[11px] font-black text-slate-800">Registro de Marca no INPI</span>
                                <span className="block text-[9px] text-slate-500 font-medium">Bloqueia o uso do nome "Anjinho Escolar" por concorrentes em todo o Brasil.</span>
                              </div>
                            </label>

                            <label className="flex items-start gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={ipProtections.methodCopyright}
                                onChange={e => setIpProtections({ ...ipProtections, methodCopyright: e.target.checked })}
                                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 mt-0.5 shrink-0"
                              />
                              <div className="space-y-0.5">
                                <span className="block text-[11px] font-black text-slate-800">Direitos Autorais do Método Árvore da Inf</span>
                                <span className="block text-[9px] text-slate-500 font-medium">Registro na Biblioteca Nacional impedindo o plágio da metodologia pedagógica.</span>
                              </div>
                            </label>

                            <label className="flex items-start gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={ipProtections.softwareInpi}
                                onChange={e => setIpProtections({ ...ipProtections, softwareInpi: e.target.checked })}
                                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 mt-0.5 shrink-0"
                              />
                              <div className="space-y-0.5">
                                <span className="block text-[11px] font-black text-slate-800">Registro de Programa de Computador (INPI)</span>
                                <span className="block text-[9px] text-slate-500 font-medium">Proteção do código-fonte do app contra cópias literais de trechos de código (50 anos).</span>
                              </div>
                            </label>

                            <label className="flex items-start gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={ipProtections.developerNda}
                                onChange={e => setIpProtections({ ...ipProtections, developerNda: e.target.checked })}
                                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 mt-0.5 shrink-0"
                              />
                              <div className="space-y-0.5">
                                <span className="block text-[11px] font-black text-slate-800">NDAs & Não-Concorrência com Programadores</span>
                                <span className="block text-[9px] text-slate-500 font-medium">Contratos impedindo desenvolvedores de vender soluções similares a concorrentes.</span>
                              </div>
                            </label>
                          </div>
                        </div>

                        {/* Technical Side */}
                        <div className="space-y-3 p-4 bg-white rounded-xl border border-slate-200/60 shadow-3xs">
                          <h4 className="text-[11px] font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1">
                            <span> </span> Barreiras Técnicas & Arquitetura
                          </h4>
                          <div className="space-y-2.5">
                            <label className="flex items-start gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={ipProtections.codeObfuscation}
                                onChange={e => setIpProtections({ ...ipProtections, codeObfuscation: e.target.checked })}
                                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 mt-0.5 shrink-0"
                              />
                              <div className="space-y-0.5">
                                <span className="block text-[11px] font-black text-slate-800">Ofuscação & Minificação (Vite/Bundler)</span>
                                <span className="block text-[9px] text-slate-500 font-medium">Torna o código JavaScript do navegador incompreensível, evitando engenharia reversa.</span>
                              </div>
                            </label>

                            <label className="flex items-start gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={ipProtections.serverFirstLogic}
                                onChange={e => setIpProtections({ ...ipProtections, serverFirstLogic: e.target.checked })}
                                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 mt-0.5 shrink-0"
                              />
                              <div className="space-y-0.5">
                                <span className="block text-[11px] font-black text-slate-800">Cálculos Críticos no Backend-First</span>
                                <span className="block text-[9px] text-slate-500 font-medium">A lógica de cálculo do "Índice de Cultivo" roda no servidor e nunca vaza no front-end.</span>
                              </div>
                            </label>

                            <label className="flex items-start gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={ipProtections.watermarkPdfs}
                                onChange={e => setIpProtections({ ...ipProtections, watermarkPdfs: e.target.checked })}
                                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 mt-0.5 shrink-0"
                              />
                              <div className="space-y-0.5">
                                <span className="block text-[11px] font-black text-slate-800">Marcas d'Água Digitais em PDFs e Fotos</span>
                                <span className="block text-[9px] text-slate-500 font-medium">Evita que concorrentes baixem relatórios e usem como material de portfólio próprio.</span>
                              </div>
                            </label>

                            <label className="flex items-start gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={ipProtections.customerTerms}
                                onChange={e => setIpProtections({ ...ipProtections, customerTerms: e.target.checked })}
                                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 mt-0.5 shrink-0"
                              />
                              <div className="space-y-0.5">
                                <span className="block text-[11px] font-black text-slate-800">Termos de Uso Restritivos no Primeiro Acesso</span>
                                <span className="block text-[9px] text-slate-500 font-medium">Contrato digital forçando o usuário a concordar em não copiar a estrutura sob pena criminal.</span>
                              </div>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* SCORE GAUGE */}
                      <div className="p-4 rounded-xl bg-white border border-slate-200/80 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-indigo-950 uppercase">Grau de Blindagem do Produto:</span>
                          <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${riskBg}`}>
                            {percent}% • {level}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden border border-slate-200 p-0.5">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                          <strong>Diagnóstico Legal:</strong> {desc}
                        </p>
                      </div>
                    </div>

                    <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wide">Como Realizar os Registros Oficiais (Brasil)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                        <span className="text-2xl"> </span>
                        <h4 className="text-xs font-black text-slate-900 leading-tight">1. Registro de Marca (INPI)</h4>
                        <p className="text-[10px] text-slate-600 leading-relaxed">
                          Protege o nome "Anjinho Escolar" e o logotipo misto. Impede imitadores de usarem o mesmo nome na classe de softwares e educação.
                        </p>
                        <div className="text-[9px] text-slate-500 pt-1 font-bold">
                          • Prazo: 8 a 12 meses<br />
                          • Órgão: INPI (inpi.gov.br)<br />
                          • Custo: Taxas a partir de R$ 142,00 (ME)
                        </div>
                      </div>

                      <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                        <span className="text-2xl"> </span>
                        <h4 className="text-xs font-black text-slate-900 leading-tight">2. Registro de Código (INPI)</h4>
                        <p className="text-[10px] text-slate-600 leading-relaxed">
                          O registro do código-fonte é feito via hash criptográfica gerada do código e depositada no INPI, garantindo propriedade autoral internacional.
                        </p>
                        <div className="text-[9px] text-slate-500 pt-1 font-bold">
                          • Prazo: Até 7 dias (Automático)<br />
                          • Órgão: INPI (inpi.gov.br)<br />
                          • Custo: Taxa fixa de R$ 185,00
                        </div>
                      </div>

                      <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                        <span className="text-2xl"> </span>
                        <h4 className="text-xs font-black text-slate-900 leading-tight">3. Registro de Metodologia</h4>
                        <p className="text-[10px] text-slate-600 leading-relaxed">
                          A apostila literária e didática do "Método Árvore da Inf" deve ser registrada como obra literária e científica.
                        </p>
                        <div className="text-[9px] text-slate-500 pt-1 font-bold">
                          • Prazo: 30 a 90 dias<br />
                          • Órgão: Biblioteca Nacional (eda.bn.gov.br)<br />
                          • Custo: Taxa de R$ 20,00 a R$ 40,00
                        </div>
                      </div>
                    </div>

                    {/* COPYABLE CONTRACT TEMPLATES */}
                    <div className="space-y-3 pt-2">
                      <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wide">Modelos Jurídicos Prontos para Copiar</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* NDA */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center bg-slate-100 px-3.5 py-2 rounded-t-xl border-x border-t border-slate-250">
                            <span className="text-[10px] font-black text-slate-700 flex items-center gap-1">  Modelo NDA & Não-Concorrência</span>
                            <button
                              onClick={() => handleCopy(templateNda, 'nda-text')}
                              className="text-[10px] text-indigo-600 font-extrabold hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              {copiedText === 'nda-text' ? 'Copiado! ✓' : 'Copiar Texto  '}
                            </button>
                          </div>
                          <pre className="p-3 bg-slate-50 text-[10px] text-slate-650 leading-relaxed font-mono rounded-b-xl border border-slate-250 max-h-48 overflow-y-auto whitespace-pre-wrap select-all shadow-inner">
                            {templateNda}
                          </pre>
                        </div>

                        {/* NOTIFICATION */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center bg-slate-100 px-3.5 py-2 rounded-t-xl border-x border-t border-slate-250">
                            <span className="text-[10px] font-black text-slate-700 flex items-center gap-1">⚖ Notificação Extrajudicial de Plágio</span>
                            <button
                              onClick={() => handleCopy(templateNotice, 'notice-text')}
                              className="text-[10px] text-indigo-600 font-extrabold hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              {copiedText === 'notice-text' ? 'Copiado! ✓' : 'Copiar Texto  '}
                            </button>
                          </div>
                          <pre className="p-3 bg-slate-50 text-[10px] text-slate-650 leading-relaxed font-mono rounded-b-xl border border-slate-250 max-h-48 overflow-y-auto whitespace-pre-wrap select-all shadow-inner">
                            {templateNotice}
                          </pre>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl text-[11px] text-emerald-950 font-bold flex items-center gap-3">
                      <span className="text-xl"> </span>
                      <p className="leading-relaxed">
                        <strong>Recomendação de Operação:</strong> Execute o registro de marca mista no INPI o quanto antes para garantir precedência. Em paralelo, faça com que todos os prestadores de serviço terceirizados assinem o termo de não-concorrência e NDA antes de entregá-los acesso ao repositório de código.
                      </p>
                    </div>

                  </div>
                </motion.div>
              );
            })()}

          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
