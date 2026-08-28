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
    original: "O aluno comeu toda a refeicao do almoco sem problemas.",
    brandVoice: "Hoje no almoco, o nosso pequeno anjinho devorou tudinho com um sorriso no rosto! Ele experimentou os legumes com muita curiosidade e adorou.   ",
    tip: "Evite termos burocraticos como 'consumiu a refeicao'. Prefira humanizar com termos afetivos e focar na experiencia de descoberta da crianca."
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
        original: "O aluno comeu toda a refeicao do almoco sem problemas.",
        brandVoice: "Hoje no almoco, o nosso pequeno anjinho devorou tudinho com um sorriso no rosto! Ele experimentou os legumes com muita curiosidade e adorou.   ",
        tip: "Evite termos burocraticos como 'consumiu a refeicao'. Prefira humanizar com termos afetivos e focar na experiencia de descoberta da crianca."
      });
    } else if (scenario === 'conflito') {
      setTestToneOutput({
        original: "O aluno brigou pelo brinquedo mas a professora interveio e resolveu.",
        brandVoice: "Durante as brincadeiras, tivemos um momento de aprendizado sobre compartilhar! O anjinho queria o mesmo brinquedo do colega, mas com jeitinho e mediacao, conversamos sobre cooperacao e logo os dois estavam rindo juntos de novo.   ",
        tip: "Nunca dramatize ou use tom punitivo. Encare conflitos da primeira inf sob a otica do desenvolvimento socioemocional e da mediacao afetuosa."
      });
    } else if (scenario === 'sono') {
      setTestToneOutput({
        original: "Dormiu apenas 30 minutos de soneca da tarde e acordou chorando.",
        brandVoice: "Na hora do soninho dos anjos, ele descansou por 30 minutinhos. Acordou com aquela preguica gostosa e pediu um colinho aconchegante para recarregar as energias. Logo ja estava pronto para a proxima aventura!   ",
        tip: "Suavize o despertar dificil enfatizando o acolhimento, o afeto fisica da professora (colo, abraco) e o restabelecimento da seguranca emocional da crianca."
      });
    } else if (scenario === 'machucado') {
      setTestToneOutput({
        original: "Caiu no parquinho e ralou o joelho esquerdo. Lavamos e passamos antisseptico.",
        brandVoice: "No parquinho, nosso pequeno explorador deu um tropeco super corajoso! Ele ganhou um 'carimbo de aventura' (um raladinho de leve) no joelho esquerdo. Ganhamos um colinho especial, lavamos com agua magica e ele ja voltou a sorrir rapidinho.   ",
        tip: "Transforme o pequeno acidente fisico em um momento de superacao e coragem ('carimbo de aventura', 'agua magica'), garantindo que o cuidado foi imediato e acolhedor."
      });
    }
  };

  const chapters = [
    { id: 'intro', label: 'Introducao & Visao', icon: <Bookmark className="w-4 h-4" /> },
    { id: 'proposito', label: 'Proposito & Missao', icon: <Heart className="w-4 h-4" /> },
    { id: 'posicionamento', label: 'Posicionamento', icon: <Compass className="w-4 h-4" /> },
    { id: 'personalidade', label: 'Personalidade da Marca', icon: <Smile className="w-4 h-4" /> },
    { id: 'linguagem', label: 'A Linguagem do Afeto', icon: <MessageCircle className="w-4 h-4" /> },
    { id: 'brand_004', label: 'BRAND-004 - Tom de Voz  ', icon: <FileText className="w-4 h-4 text-amber-500 font-bold animate-pulse" /> },
    { id: 'pilares', label: 'Pilares Emocionais', icon: <Star className="w-4 h-4" /> },
    { id: 'narrativa', label: 'Slogans & Narrativa', icon: <FileText className="w-4 h-4" /> },
    { id: 'experiencia', label: 'A Experiencia do Legado', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'metodo_arvore', label: 'Metodo Arvore da Inf', icon: <TreePine className="w-4 h-4" /> },
    { id: 'protecao_marca', label: 'BRAND-005 - Blindagem & IP  ', icon: <ShieldCheck className="w-4 h-4 text-emerald-500 font-bold" /> },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      
      
      <div className="bg-gradient-to-br from-indigo-950 via-[#1F1A44] to-[#120F2D] rounded-3xl p-6 sm:p-10 border border-indigo-900 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>
        
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[10px] px-3 py-1 rounded-full uppercase tracking-widest bg-amber-400 text-indigo-950 font-sans shadow-md">
              Brand Book   Livro de Marca  
            </span>
            <span className="text-xs font-bold text-indigo-200">Anjinho Escolar</span>
          </div>
          
          <h1 className="text-2xl sm:text-4xl font-serif font-black tracking-tight leading-none text-amber-300">
            Brand Book: O Coracao do Anjinho Escolar
          </h1>
          
          <p className="text-xs sm:text-sm text-indigo-150 leading-relaxed font-sans max-w-2xl font-semibold">
            Empresas memoraveis criam produtos, mas o que as torna eternas e a narrativa e a experiencia que entregam. Este documento estrategico define a nossa essencia: o Anjinho Escolar nao e uma simples ferramenta administrativa, mas o lugar sagrado onde as familias guardam os primeiros e mais lindos capitulos da inf de seus filhos.
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
              Explorar Capitulos <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
            </a>
          </div>
        </div>
      </div>

      
      <div id="nav-chapters" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        
        <div className="lg:col-span-4 bg-[#FFFDF6] border border-amber-250/65 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="border-b border-amber-200/50 pb-3">
            <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" /> Indice de Capitulos
            </h3>
            <p className="text-[10px] text-slate-500 font-semibold mt-1">Navegue pelas diretrizes estrategicas da nossa marca:</p>
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
            <h4 className="text-[11px] font-black text-indigo-950 uppercase tracking-wider">O Maior Patrimonio</h4>
            <p className="text-[10px] text-slate-700 leading-relaxed font-semibold">
              O codigo pode ser copiado, mas um relacionamento baseado em confianca afetuosa e legado e inimitavel.
            </p>
          </div>
        </div>

        
        <div className="lg:col-span-8 bg-[#FFFDF6] border border-amber-250/65 rounded-3xl p-6 sm:p-8 shadow-sm relative min-h-[500px]">
          <AnimatePresence mode="wait">
            
            
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
                    <span className="text-[9px] uppercase font-black text-indigo-500 tracking-wider">Capitulo 1</span>
                    <h2 className="text-xl sm:text-2xl font-serif font-black text-indigo-950">Introducao: O Legado e a Magia</h2>
                  </div>
                  <span className="text-3xl"> </span>
                </div>

                <div className="prose text-xs sm:text-sm text-slate-800 leading-relaxed space-y-4 font-semibold">
                  <p>
                    A inf e um sopro. Em um piscar de olhos, os bebes que seguravamos no colo estao prontos para os primeiros passos na educacao formal. Na correria do dia a dia moderno, pais e maes trabalham com o coracao apertado, perdendo as pequenas piadas cotidianas, os gestos gentis espont a primeira semente plantada na horta escolar.
                  </p>
                  
                  <div className="p-5 my-4 bg-amber-100/50 rounded-2xl border border-amber-200/60 relative overflow-hidden">
                    <Quote className="absolute right-4 bottom-4 w-12 h-12 text-amber-200 opacity-45 shrink-0" />
                    <p className="text-xs sm:text-sm italic font-serif text-amber-950 font-bold relative z-10 leading-relaxed">
                      "Nao criamos um 'aplicativo de comunicacao escolar'. Nos criamos um portal do tempo. O Anjinho Escolar existe para garantir que a magia dos primeiros capitulos da vida de uma crianca nunca caia no esquecimento."
                    </p>
                  </div>

                  <p>
                    Enquanto a concorrencia foca puramente no aspecto tecnico (gerenciar cobrancas, listar presencas, enviar avisos burocraticos frios), o <strong>Anjinho Escolar</strong> se posiciona no territorio emocional. Nosso compromisso e com a <strong>afetividade</strong>, a <strong>seguranca psicologica</strong> e o <strong>legado da inf</strong>.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-amber-250/20">
                  <div className="p-4 rounded-2xl bg-white border border-amber-100 space-y-2">
                    <span className="text-sm"> </span>
                    <h4 className="text-xs font-black text-indigo-950">A Visao Burocratica (Concorrencia)</h4>
                    <p className="text-[10px] text-slate-650 font-semibold leading-relaxed">
                      "O aluno consumiu a refeicao e dormiu por 1 hora. Segue boleto da mensalidade."
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2">
                    <span className="text-sm"> </span>
                    <h4 className="text-xs font-black text-indigo-950">A Visao do Anjinho Escolar</h4>
                    <p className="text-[10px] text-indigo-950 font-semibold leading-relaxed">
                      "Hoje na hora do almoco, o pequeno explorador comeu tudinho e experimentou legumes novos com coragem! Depois, sonhou com anjos por 1 hora e acordou com sorriso no rosto."
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            
            {activeChapter === 'proposito' && (
              <motion.div
                key="proposito"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center border-b border-amber-200/50 pb-4">
                  <div>
                    <span className="text-[9px] uppercase font-black text-indigo-500 tracking-wider">Capitulo 2</span>
                    <h2 className="text-xl sm:text-2xl font-serif font-black text-indigo-950">Proposito & Missao</h2>
                  </div>
                  <span className="text-3xl"> </span>
                </div>

                <div className="space-y-6 text-xs sm:text-sm text-slate-800 leading-relaxed font-semibold">
                  
                  
                  <div className="space-y-2 bg-rose-50/30 p-5 rounded-3xl border border-rose-100">
                    <h3 className="text-base font-black text-rose-950 flex items-center gap-1.5 font-display">
                      <Heart className="w-5 h-5 text-rose-500 fill-rose-500/10" /> Nosso Proposito (A Causa)
                    </h3>
                    <p className="font-serif italic text-rose-900 font-bold">
                      "Preservar as memorias afetivas da primeira inf e construir lacos inabalaveis de amor, confianca e desenvolvimento humano entre a escola e a familia."
                    </p>
                    <p className="text-[11px] text-slate-750 font-semibold leading-relaxed pt-1">
                      Acreditamos que a inf e o solo fertil onde todo o futuro do ser humano e plantado. Guardar essa jornada e um ato de preservacao do que temos de mais valioso: a nossa propria historia.
                    </p>
                  </div>

                  
                  <div className="space-y-2 bg-emerald-50/30 p-5 rounded-3xl border border-emerald-100">
                    <h3 className="text-base font-black text-emerald-950 flex items-center gap-1.5 font-display">
                      <Award className="w-5 h-5 text-emerald-600" /> Nossa Missao (O Meio)
                    </h3>
                    <p className="font-serif italic text-emerald-900 font-bold">
                      "Transformar a rotina de comunicacao escolar em uma experiencia narrativa acolhedora, interativa e empatica."
                    </p>
                    <p className="text-[11px] text-slate-750 font-semibold leading-relaxed pt-1">
                      Nos capacitamos educadores a registrarem de forma rapida e sensivel os momentos especiais do dia a dia, e entregamos as familias um relicario vivo, seguro e duravel, enriquecido com inteligencia e afeto.
                    </p>
                  </div>

                  
                  <div className="text-center py-4 border-t border-amber-250/20">
                    <p className="text-xs font-black text-indigo-900 uppercase tracking-widest">"Cuidar de quem cuida. Narrar para quem ama."</p>
                  </div>
                </div>
              </motion.div>
            )}

            
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
                    <span className="text-[9px] uppercase font-black text-indigo-500 tracking-wider">Capitulo 3</span>
                    <h2 className="text-xl sm:text-2xl font-serif font-black text-indigo-950">O Posicionamento Estrategico</h2>
                  </div>
                  <span className="text-3xl"> </span>
                </div>

                <div className="prose text-xs sm:text-sm text-slate-800 leading-relaxed space-y-4 font-semibold">
                  <p>
                    O <strong>Anjinho Escolar</strong> nao compete por preco ou volume de recursos frios. Nos ocupamos um quadrante unico no mercado de edtechs brasileiras: o **Relicario Digital de Desenvolvimento Afetivo**.
                  </p>

                  <h3 className="text-sm font-black text-indigo-950 uppercase tracking-wide pt-2">A Matriz de Diferenciacao</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-3xs">
                      <div className="flex items-center gap-1.5 text-slate-650 font-black text-xs">
                        <span className="text-red-500 font-bold"> </span> Agendas Tradicionais (Burocraticas)
                      </div>
                      <ul className="text-[10px] space-y-1.5 text-slate-600 pl-4 list-disc font-semibold leading-relaxed">
                        <li>Foco em controle operacional e financeiro</li>
                        <li>Interface cinza, fria ou excessivamente corporativa</li>
                        <li>Relatorios manuais cansativos baseados em caixas de texto genericas</li>
                        <li>Trata o aluno como uma 'matricula' de passagem</li>
                        <li>Os dados desaparecem ou sao apagados ao mudar de colegio</li>
                      </ul>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-300 space-y-3 shadow-3xs">
                      <div className="flex items-center gap-1.5 text-indigo-950 font-black text-xs">
                        <span className="text-emerald-500 font-bold"> </span> Anjinho Escolar (Afetivo)
                      </div>
                      <ul className="text-[10px] space-y-1.5 text-slate-800 pl-4 list-disc font-bold leading-relaxed">
                        <li>Foco em narrar o desenvolvimento e as conquistas</li>
                        <li>Interface ludica, acolhedora, inspirada em livros de recortes (scrapbooks)</li>
                        <li>Registros assistidos por voz e enriquecidos com pilares socioemocionais</li>
                        <li>Trata a crianca como um 'anjinho' unico em evolucao</li>
                        <li>Gera um acervo afetivo perene (exportacao fisica, Carta para o Futuro, etc.)</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-indigo-950 text-white rounded-2xl p-5 border border-indigo-900 mt-4">
                    <h4 className="text-xs font-black text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4 text-amber-300 animate-pulse" /> Nosso Posicionamento de Ouro:
                    </h4>
                    <p className="text-[11px] text-indigo-100 font-serif italic font-bold leading-relaxed mt-2">
                      "Para a escola, somos a ferramenta de fidelizacao emocional definitiva e um selo de excelencia pedagogica afetuosa. Para os pais, somos a garantia diaria de presenca amorosa e o livro de memorias eternas do bem mais valioso de suas vidas."
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            
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
                    <span className="text-[9px] uppercase font-black text-indigo-500 tracking-wider">Capitulo 4</span>
                    <h2 className="text-xl sm:text-2xl font-serif font-black text-indigo-950">Personalidade da Marca</h2>
                  </div>
                  <span className="text-3xl"> </span>
                </div>

                <div className="space-y-6 text-xs sm:text-sm text-slate-800 leading-relaxed font-semibold">
                  <p>
                    Se o Anjinho Escolar fosse uma pessoa, quem ele seria? Ele seria aquele educador empatico, com brilho constante nos olhos, que enxerga poesia no primeiro desenho rabiscado de uma crianca. Ele e seguro, acolhedor e profundamente inspirador.
                  </p>

                  <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wide">Nossos 4 Tracos de Personalidade</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    
                    <div className="p-4 rounded-2xl border border-amber-200 bg-white space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg"> </span>
                        <h4 className="text-xs font-black text-slate-900">Acolhedora & Afetuosa</h4>
                      </div>
                      <p className="text-[10px] text-slate-600 leading-relaxed font-semibold">
                        Acolhemos as preocupacoes dos pais com compaixao e carinho. Nossa presenca conforta, traz paz de espirito e estabelece um canal transparente e empatico de afeto mutuo.
                      </p>
                    </div>

                    
                    <div className="p-4 rounded-2xl border border-amber-200 bg-white space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg"> </span>
                        <h4 className="text-xs font-black text-slate-900">Ludica & Inspiradora</h4>
                      </div>
                      <p className="text-[10px] text-slate-600 leading-relaxed font-semibold">
                        Vemos beleza nas pequenas coisas: no dedinho sujo de tinta guache, na semente de girassol germinando. Inspiramos os adultos a redescobrirem o encanto do mundo sob os olhos de uma crianca.
                      </p>
                    </div>

                    
                    <div className="p-4 rounded-2xl border border-amber-200 bg-white space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">  </span>
                        <h4 className="text-xs font-black text-slate-900">Pedagogicamente Solida</h4>
                      </div>
                      <p className="text-[10px] text-slate-600 leading-relaxed font-semibold">
                        Nao somos um brinquedo. Apoiamos nossas acoes nos marcos reais de desenvolvimento socioemocional e intelectual infantil (valores humanos, autonomia, empatia e coordenacao).
                      </p>
                    </div>

                    
                    <div className="p-4 rounded-2xl border border-amber-200 bg-white space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg"> </span>
                        <h4 className="text-xs font-black text-slate-900">Zelosa & Guardia</h4>
                      </div>
                      <p className="text-[10px] text-slate-600 leading-relaxed font-semibold">
                        Protegemos as memorias e os dados com o rigor maximo que um pai ou mae exige. Somos o guardiao permanente do legado e da privacidade de cada pequeno anjinho.
                      </p>
                    </div>

                  </div>
                </div>
              </motion.div>
            )}

            
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
                    <span className="text-[9px] uppercase font-black text-indigo-500 tracking-wider">Capitulo 5</span>
                    <h2 className="text-xl sm:text-2xl font-serif font-black text-indigo-950">A Linguagem do Afeto</h2>
                  </div>
                  <span className="text-3xl"> </span>
                </div>

                <div className="space-y-6 text-xs sm:text-sm text-slate-800 leading-relaxed font-semibold">
                  <p>
                    Nossa linguagem e uma ponte afetiva. Ela traduz acoes diarias em contos curtos de afeto, valorizando cada esforco pedagogico das escolas e tranquilizando o coracao das familias.
                  </p>

                  
                  <div className="bg-indigo-950 text-white rounded-3xl p-5 border border-indigo-900 space-y-4">
                    <div className="flex items-center justify-between border-b border-indigo-805 pb-2">
                      <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-400" /> Simulador Interativo de Tom de Voz
                      </h4>
                      <span className="text-[9px] bg-indigo-900/60 text-indigo-200 px-2 py-0.5 rounded-full">Anjinho AI Engine</span>
                    </div>

                    <p className="text-[10px] text-indigo-100 font-semibold leading-relaxed">
                      Selecione um cenario tipico do cotidiano escolar para ver como a Linguagem de Afeto do Anjinho Escolar transforma uma mensagem burocratica comum em uma recordacao inesquecivel:
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {[
                        { id: 'refeicao', label: '  Refeicao' },
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
                        <div className="absolute top-2 right-2 text-xs"> </div>
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

                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-amber-250/20">
                    <div className="bg-white border border-red-200 rounded-2xl p-4 space-y-2">
                      <h4 className="text-xs font-black text-red-900 flex items-center gap-1.5">
                        <span className="text-red-500 font-bold"> </span> O que EVITAR na linguagem:
                      </h4>
                      <ul className="text-[10px] text-slate-700 pl-4 list-disc space-y-1 font-semibold leading-relaxed">
                        <li>Falar como um robo corporativo: "No presente dia...", "O discente apresentou..."</li>
                        <li>Focar excessivamente no negativo sem acolhimento: "Fez birra", "Recusou-se a fazer a tarefa."</li>
                        <li>Chamar a crianca de "aluno", "estudante" ou simplesmente pelo sobrenome em comunicacoes afetivas.</li>
                        <li>Burocratizar as pequenas magicas: "O aluno completou o plantio do vegetal na terra."</li>
                      </ul>
                    </div>

                    <div className="bg-white border border-emerald-200 rounded-2xl p-4 space-y-2">
                      <h4 className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                        <span className="text-emerald-500 font-bold"> </span> O que USAR na linguagem:
                      </h4>
                      <ul className="text-[10px] text-slate-700 pl-4 list-disc space-y-1 font-semibold leading-relaxed">
                        <li>Usar apelidos carinhosos e respeitosos: "Nosso anjinho", "Pequeno explorador", "Artista do dia."</li>
                        <li>Transformar desafios em aprendizados: "Hoje aprendemos a compartilhar", "Acolhemos a preguica."</li>
                        <li>Descrever a acao fisica do educador: "Ganhamos colo quentinho", "Conversamos baixinho", "Elogiamos o esforco."</li>
                        <li>Criar narrativas: "Fizemos magica na horta com as sementinhas", "Colorimos o papel com as maos de arco-iris."</li>
                      </ul>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

            
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
                      <span className="text-[9px] uppercase font-black bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 px-2 py-0.5 rounded-md tracking-wider">CODIGO: BRAND-004</span>
                      <span className="text-[9px] uppercase font-black bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 px-2 py-0.5 rounded-md tracking-wider">VERSAO 1.0</span>
                      <span className="text-[9px] uppercase font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-0.5 rounded-md tracking-wider">STATUS: OFICIAL</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-serif font-black text-indigo-950">Tom de Voz e Linguagem da Marca</h2>
                  </div>
                  <span className="text-3xl shrink-0"> </span>
                </div>

                <div className="p-5 bg-amber-50/50 border border-amber-200 rounded-2xl space-y-3">
                  <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1">
                      Objetivo da Constituicao
                  </h3>
                  <p className="text-[11px] text-slate-700 font-semibold leading-relaxed">
                    Definir como o <strong>Anjinho Escolar</strong> se comunica em todos os pontos de contato com diretoras, educadores, coordenacao pedagogica, familias e parceiros, garantindo uma linguagem consistente, acolhedora, humana e profundamente alinhada ao proposito da marca.
                  </p>
                </div>

                
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wider">O jeito de falar do Anjinho Escolar</h3>
                  <p className="text-xs text-slate-600 font-semibold">O Anjinho Escolar fala como uma escola que acolhe. Nunca como uma empresa tentando vender.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="bg-white border border-slate-150 p-4 rounded-xl space-y-2">
                      <h4 className="text-[11px] font-black text-indigo-900 uppercase">  Nossas Diretrizes</h4>
                      <ul className="text-[10px] text-slate-700 pl-4 list-disc space-y-1.5 font-semibold leading-relaxed">
                        <li>Nossa comunicacao transmite serenidade, confianca e proximidade.</li>
                        <li>Nao usamos palavras dificeis para impressionar. Usamos palavras para gerar compreensao.</li>
                        <li>Nao simplificamos porque o publico nao entende. Simplificamos porque respeitamos o tempo precioso de quem le.</li>
                      </ul>
                    </div>
                    <div className="bg-white border border-slate-150 p-4 rounded-xl space-y-2">
                      <h4 className="text-[11px] font-black text-indigo-900 uppercase">  Nossa Personalidade</h4>
                      <p className="text-[10px] text-slate-600 font-semibold leading-relaxed">Se o Anjinho Escolar fosse uma pessoa, seria alguem que:</p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {['escuta antes de responder', 'orienta sem impor', 'inspira confianca', 'demonstra organizacao', 'transmite calma', 'valoriza relacoes humanas', 'fala com clareza', 'acredita no poder da Educacao Infantil'].map((item, idx) => (
                          <span key={idx} className="text-[9px] font-black bg-slate-50 border border-slate-150 px-2 py-1 rounded-lg text-slate-700">
                              {item}
                          </span>
                        ))}
                      </div>
                      <p className="text-[9.5px] font-black text-rose-600 pt-1.5 uppercase">[!] Nunca arrogante, exagerado ou impessoal.</p>
                    </div>
                  </div>
                </div>

                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wider">Como escrevemos</h3>
                    <div className="bg-indigo-50/30 border border-indigo-100 p-4 rounded-xl space-y-1.5">
                      <p className="text-[10.5px] text-indigo-950 font-bold">Sempre escrevemos de forma:</p>
                      <div className="flex flex-wrap gap-1">
                        {['clara', 'acolhedora', 'objetiva', 'elegante', 'humana', 'otimista', 'respeitosa'].map((item, idx) => (
                          <span key={idx} className="text-[9.5px] font-black bg-indigo-50 border border-indigo-100 text-indigo-850 px-2 py-0.5 rounded-full">
                              {item}
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
                        {['confianca', 'acolhimento', 'organizacao', 'profissionalismo', 'serenidade', 'proposito'].map((item, idx) => (
                          <span key={idx} className="text-[9.5px] font-black bg-emerald-50 border border-emerald-100 text-emerald-850 px-2 py-0.5 rounded-full">
                              {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wider">Palavras que fazem parte da nossa identidade</h3>
                  <p className="text-xs text-slate-600 font-semibold">Estas palavras reforcam o posicionamento e devem aparecer naturalmente ao longo de relatorios, relatorios assistidos por voz e comunicacoes:</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="p-3 bg-white border border-amber-200 rounded-xl space-y-1.5">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase">  Relacoes</h4>
                      <p className="text-[9.5px] font-semibold text-slate-750 leading-relaxed">relacionamento, aproximacao, parceria, dialogo, presenca, vinculo, confianca, acolhimento, comunidade</p>
                    </div>
                    <div className="p-3 bg-white border border-amber-200 rounded-xl space-y-1.5">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase">   Educacao</h4>
                      <p className="text-[9.5px] font-semibold text-slate-750 leading-relaxed">Educacao Infantil, desenvolvimento, aprendizagem, inf descoberta, evolucao, cuidado, protagonismo da crianca</p>
                    </div>
                    <div className="p-3 bg-white border border-amber-200 rounded-xl space-y-1.5">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase">  Familia</h4>
                      <p className="text-[9.5px] font-semibold text-slate-750 leading-relaxed">familias, responsaveis, participacao, conexao, presenca, compartilhamento</p>
                    </div>
                    <div className="p-3 bg-white border border-amber-200 rounded-xl space-y-1.5">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase">   Escola</h4>
                      <p className="text-[9.5px] font-semibold text-slate-750 leading-relaxed">escola, educadores, professoras, coordenacao, direcao, equipe pedagogica</p>
                    </div>
                    <div className="p-3 bg-white border border-amber-200 rounded-xl space-y-1.5">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase">  Produto</h4>
                      <p className="text-[9.5px] font-semibold text-slate-750 leading-relaxed">plataforma, experiencia, organizacao, rotina, comunicacao, registro, historia, jornada, memoria, simplicidade</p>
                    </div>
                    <div className="p-3 bg-white border border-amber-200 rounded-xl space-y-1.5">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase">  Valores</h4>
                      <p className="text-[9.5px] font-semibold text-slate-750 leading-relaxed">proposito, cuidado, confianca, transparencia, respeito, continuidade, significado</p>
                    </div>
                  </div>
                </div>

                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wider">Expressoes que representam a marca</h3>
                    <span className="text-[10px] text-indigo-500 font-semibold">Toque para copiar</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      'fortalecer a relacao entre escola e familia',
                      'valorizar o trabalho dos educadores',
                      'acompanhar o desenvolvimento da crianca',
                      'preservar a historia da inf',
                      'aproximar pessoas com cuidado',
                      'organizar a rotina com simplicidade',
                      'tornar cada momento significativo',
                      'construir lembrancas para o futuro',
                      'transformar registros em memorias',
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

                
                <div className="space-y-3 bg-rose-50/15 border border-rose-250/50 p-5 rounded-2xl">
                  <h3 className="text-xs font-black text-rose-950 uppercase tracking-wider flex items-center gap-1">
                      Palavras que evitamos a todo custo
                  </h3>
                  <p className="text-[10px] text-slate-650 font-semibold leading-relaxed">
                    Estas expressoes ou termos comerciais/frios rompem a conexao de carinho e a seriedade etica. Salve em contextos estritamente tecnicos, evite sempre:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="space-y-1 text-[10px] font-semibold text-slate-700">
                      <strong className="text-rose-900 block text-[10.5px] uppercase">  Linguagem Comercial</strong>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {['imperdivel', 'promocao', 'desconto', 'gatilho', 'compre agora', 'oportunidade unica'].map((word, idx) => (
                          <span key={idx} className="bg-rose-50 border border-rose-100 text-rose-800 text-[9px] px-1.5 py-0.5 rounded">
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1 text-[10px] font-semibold text-slate-700">
                      <strong className="text-rose-900 block text-[10.5px] uppercase">  Corporativa Fria / TI</strong>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {['software', 'sistema', 'disruptivo', 'sinergia', 'KPI', 'otimizacao', 'benchmark', 'stakeholders'].map((word, idx) => (
                          <span key={idx} className="bg-rose-50 border border-rose-100 text-rose-800 text-[9px] px-1.5 py-0.5 rounded">
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1 text-[10px] font-semibold text-slate-700">
                      <strong className="text-rose-900 block text-[10.5px] uppercase">  Infantilizada / Medo</strong>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {['fofinho', 'lindinho', 'turminha', 'perder dinheiro', 'ficar para tras', 'desastre'].map((word, idx) => (
                          <span key={idx} className="bg-rose-50 border border-rose-100 text-rose-800 text-[9px] px-1.5 py-0.5 rounded">
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-rose-150/40 text-[9.5px] italic font-semibold text-rose-900 leading-normal">
                    * Falamos sobre a inf com respeito tecnico e afeto profundo. Nao infantilizamos quem trabalha com ela e nunca exploramos as insegurancas das diretoras baseando nossa comunicacao no medo ou em mercantilismo frio.
                  </div>
                </div>

                
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wider">Como tratamos temas-chave</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl bg-white border border-slate-150 space-y-2">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase">  Tecnologia e Produto</h4>
                      <p className="text-[10px] text-slate-750 font-semibold leading-relaxed">
                        A tecnologia nunca e protagonista; trabalha nos bastidores para que educadores e familias se concentrem na relacao humana. 
                      </p>
                      <p className="text-[9.5px] font-black text-indigo-900">
                        Evitamos "Mais uma agenda digital" ou "Gestao/Controle escolar". Prefira: "Plataforma de relacionamento", "Comunicacao organizada", "Acompanhamento".
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-white border border-slate-150 space-y-2">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase">  A Crianca e a Escola</h4>
                      <p className="text-[10px] text-slate-750 font-semibold leading-relaxed">
                        A crianca nunca e um numero, usuario ou cadastro. Ela e sempre descrita como: crianca, inf desenvolvimento, historia, descoberta, jornada de aprendizagem.
                      </p>
                      <p className="text-[9.5px] font-black text-indigo-900">
                        A escola nunca e tratada apenas como um cliente comum. Ela e nossa parceira permanente que transforma vidas.
                      </p>
                    </div>
                  </div>
                </div>

                
                <div className="border-t border-slate-200/50 pt-6 space-y-4">
                  <div className="bg-gradient-to-tr from-indigo-900 to-[#120F2D] p-5 sm:p-6 rounded-3xl border border-indigo-850 text-white relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl"></div>
                    <div className="relative z-10 space-y-4">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-amber-300">Antes de publicar qualquer texto / relatorio</span>
                        <h4 className="text-sm sm:text-base font-serif font-black text-white">Constituicao da Marca   Verificador do Tom de Voz</h4>
                        <p className="text-[11px] text-indigo-200 font-semibold">Escreva ou cole seu rascunho de comunicacao abaixo e responda as 8 perguntas de ouro para validar a sintonia com os nossos principios:</p>
                      </div>

                      <div className="space-y-2">
                        <textarea
                          placeholder="Escreva seu rascunho de relatorio ou e-mail aqui para testar..."
                          className="w-full p-3 rounded-2xl bg-indigo-950/80 border border-indigo-800 text-xs font-semibold h-24 focus:ring-2 focus:ring-amber-400/40 outline-none placeholder:text-indigo-400 text-white"
                          value={checklistText}
                          onChange={(e) => setChecklistText(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2 pt-1">
                        <span className="text-[10px] font-black uppercase text-indigo-250 tracking-wider">Perguntas de Filtro da Marca:</span>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {[
                            { key: 'claro', label: '1. Esta perfeitamente claro?' },
                            { key: 'humano', label: '2. Esta humano e carinhoso?' },
                            { key: 'respeitoso', label: '3. Esta estritamente respeitoso?' },
                            { key: 'simples', label: '4. Esta simples, sem jargoes corporativos?' },
                            { key: 'alinhado', label: '5. Esta alinhado ao nosso proposito educativo?' },
                            { key: 'confianca', label: '6. A diretora e os pais sentiriam confianca ao ler?' },
                            { key: 'tecnologiaSecundaria', label: '7. A tecnologia ficou em segundo plano?' },
                            { key: 'criancaCentro', label: '8. A crianca continua no centro da narrativa?' },
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
                                <span>Aprovou {Object.values(checklistScore).filter(Boolean).length} de 8 criterios. {Object.values(checklistScore).filter(Boolean).length < 8 && 'Recomendamos ajustar para atingir o selo de ouro!'}</span>
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

                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-200/50 pt-6">
                  <div className="bg-[#FFFDF3] border border-indigo-200 p-5 rounded-2xl space-y-2 text-center flex flex-col justify-between">
                    <div>
                      <span className="text-sm"> </span>
                      <h4 className="text-[11px] font-black text-indigo-950 uppercase tracking-widest mt-1">A Regra de Ouro da Comunicacao</h4>
                    </div>
                    <p className="font-serif italic text-indigo-900 font-bold text-xs sm:text-sm py-2">
                      "Nao escrevemos para vender um software. Escrevemos para fortalecer a confianca entre escola, familia e crianca."
                    </p>
                  </div>

                  <div className="bg-[#FFFDF3] border border-amber-300 p-5 rounded-2xl space-y-2 text-center flex flex-col justify-between">
                    <div>
                      <span className="text-sm"> </span>
                      <h4 className="text-[11px] font-black text-indigo-950 uppercase tracking-widest mt-1">O Principio Permanente da Marca</h4>
                    </div>
                    <p className="font-serif italic text-amber-950 font-bold text-xs sm:text-sm py-2">
                      "Toda palavra deve transmitir o mesmo cuidado que esperamos de uma escola de Educacao Infantil."
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            
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
                    <span className="text-[9px] uppercase font-black text-indigo-500 tracking-wider">Capitulo 6</span>
                    <h2 className="text-xl sm:text-2xl font-serif font-black text-indigo-950">Os Tres Pilares Emocionais</h2>
                  </div>
                  <span className="text-3xl"> </span>
                </div>

                <div className="space-y-6 text-xs sm:text-sm text-slate-800 leading-relaxed font-semibold">
                  <p>
                    Nossa marca se apoia em uma triade indivisivel que sustenta todo o ecossistema emocional do aplicativo. Cada linha de codigo que escrevemos serve a um desses tres pilares fundamentais:
                  </p>

                  <div className="space-y-4">
                    
                    
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-amber-200 shadow-3xs group hover:border-amber-400 transition-all">
                      <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center shrink-0 text-xl font-bold">
                         
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-slate-900">Pilar 1: Memorias (Preservacao do Legado)</h4>
                          <span className="text-[8px] font-black uppercase tracking-widest bg-sky-100 text-sky-800 px-2 py-0.5 rounded">Eternidade</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                          A primeira inf passa rapido demais. Acreditamos que cada marco - o primeiro 'por favor' espont o primeiro amigo, o desenho da familia - e um tesouro nacional privado. Nos tratamos fotos, audios e pequenos relatos nao como 'registros de banco de dados', mas como reliquias digitais permanentes e exportaveis para toda a vida.
                        </p>
                      </div>
                    </div>

                    
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-amber-200 shadow-3xs group hover:border-amber-400 transition-all">
                      <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center shrink-0 text-xl font-bold">
                         
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-slate-900">Pilar 2: Relacionamento (Parceria de Confianca)</h4>
                          <span className="text-[8px] font-black uppercase tracking-widest bg-rose-100 text-rose-850 px-2 py-0.5 rounded">Empatia</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                          A escola e os pais nao sao prestadores e tomadores de servico burocratico; sao parceiros de co-autoria da historia da crianca. Eliminamos barreiras, abrimos as cortinas das salas de aula com afeto e construimos pontes de reciprocidade e gratidao emocional entre educadores e familias.
                        </p>
                      </div>
                    </div>

                    
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-amber-200 shadow-3xs group hover:border-amber-400 transition-all">
                      <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 text-xl font-bold">
                         
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-slate-900">Pilar 3: Desenvolvimento (Progresso Humano)</h4>
                          <span className="text-[8px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">Legado</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                          Nao registramos apenas notas ou comparecimento fisico. Acompanhamos a evolucao integral da crianca: a empatia, o espirito de compartilhar, a independencia fisica, a superacao de medos e a inteligencia ludica. Cada pequena vitoria diaria e tratada como um passo glorioso de um lindo legado futuro.
                        </p>
                      </div>
                    </div>

                  </div>
                </div>
              </motion.div>
            )}

            
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
                    <span className="text-[9px] uppercase font-black text-indigo-500 tracking-wider">Capitulo 7</span>
                    <h2 className="text-xl sm:text-2xl font-serif font-black text-indigo-950">Slogans & Narrativa de Marca</h2>
                  </div>
                  <span className="text-3xl"> </span>
                </div>

                <div className="space-y-6 text-xs sm:text-sm text-slate-800 leading-relaxed font-semibold">
                  
                  
                  <div className="space-y-3">
                    <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wide">Nossos Slogans Oficiais</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { 
                          text: "Onde os primeiros capitulos da inf sao guardados com amor.", 
                          type: "Slogan Institucional Principal" 
                        },
                        { 
                          text: "Mais que uma agenda escolar: um relicario vivo de descobertas.", 
                          type: "Slogan Comercial / Diferenciacao" 
                        },
                        { 
                          text: "Para ler, amar e recordar. Sempre.", 
                          type: "Tagline de Produto / Pais" 
                        },
                        { 
                          text: "Eternizando cada conquista do seu pequeno anjinho.", 
                          type: "Slogan de Engajamento Diario" 
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

                  
                  <div className="space-y-3 border-t border-amber-250/20 pt-4">
                    <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wide">A Narrativa Principal (The Brand Story)</h3>
                    
                    <div className="bg-[#FAF6EE] border-2 border-dashed border-amber-300 p-6 rounded-2xl relative overflow-hidden font-serif space-y-4 text-justify text-slate-800 leading-relaxed italic">
                      <Quote className="absolute right-6 top-6 w-16 h-16 text-amber-200/40 opacity-40 shrink-0 pointer-events-none" />
                      
                      <p className="font-serif">
                        Amanha pela manha, uma crianca pequena vai passar pela porta de uma escola infantil. Ela vai soltar a mao de sua mae, talvez com um pequeno frio na barriga, e vai dar os primeiros passos em um territorio de descobertas incriveis. 
                      </p>
                      <p className="font-serif">
                        Nas proximas oito horas, essa crianca vai plantar uma sementinha na horta da escola. Ela vai compartilhar seu giz de cera favorito com um colega choroso, desenhar um sol verde que brilha no canto de uma folha de papel e rir ate a barriga doer ao ouvir a professora fazer vozes de dragao em uma historia de fantoche.
                      </p>
                      <p className="font-serif">
                        Quando a tarde cair e sua mae voltar para busca-la, a crianca estara exausta e feliz. Mas quando a mae perguntar 'O que voce fez hoje na escola, meu amor?', a crianca simplesmente respondera: 'Brinquei'. E todo aquele universo poetico de desenvolvimento socioemocional, pequenos progressos e grandes feiras de artes se perdera no vento do cotidiano burocratico.
                      </p>
                      <p className="font-serif text-indigo-950 font-black not-italic border-l-4 border-amber-400 pl-4">
                        O Anjinho Escolar nasceu para resgatar esse universo. Nos nos recusamos a tratar a rotina da escola como uma lista fria de 'comeu', 'dormiu' e 'boletos'. Nos empoderamos as escolas para capturarem as pequenas magicas invisiveis, e embalamos essas lembrancas como uma carta de amor continua para as familias. 
                      </p>
                      <p className="font-serif font-bold text-amber-900 text-center pt-2">
                        Porque nos nao guardamos dados escolares. Nos somos o bau do tesouro onde os primeiros e mais preciosos capitulos da vida de um filho sao eternizados para sempre.
                      </p>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

            
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
                    <span className="text-[9px] uppercase font-black text-indigo-500 tracking-wider">Capitulo 8</span>
                    <h2 className="text-xl sm:text-2xl font-serif font-black text-indigo-950">A Experiencia do Legado</h2>
                  </div>
                  <span className="text-3xl"> </span>
                </div>

                <div className="space-y-6 text-xs sm:text-sm text-slate-800 leading-relaxed font-semibold font-sans">
                  <p>
                    Nosso design de produto materializa o posicionamento e os pilares de marca em recursos tangiveis, elegantes e intencionais. Nao adicionamos funcoes de forma aleatoria; cada tela e desenhada para evocar afeto e encantamento.
                  </p>

                  <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wide">4 Pilares de Experiencia Pratica no Produto</h3>

                  <div className="space-y-3.5">
                    
                    
                    <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-3xs flex gap-3.5 items-start">
                      <span className="text-xl"> </span>
                      <div>
                        <h4 className="text-xs font-black text-slate-900">1. A Carta para o Futuro (Capsula do Tempo)</h4>
                        <p className="text-[10px] text-slate-600 leading-relaxed font-semibold mt-1">
                          No encerramento da Educacao Infantil, nossa inteligencia aglutina as fotos marcadas como "Inesqueciveis" e as conquistas mais marcantes para formatar uma linda Carta Digital e Impressa para a crianca ler daqui a 10 anos. Um presente inestimavel e inimitavel para as familias.
                        </p>
                      </div>
                    </div>

                    
                    <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-3xs flex gap-3.5 items-start">
                      <span className="text-xl"> </span>
                      <div>
                        <h4 className="text-xs font-black text-slate-900">2. O Selo de Preservacao Anjinho Escolar</h4>
                        <p className="text-[10px] text-slate-600 leading-relaxed font-semibold mt-1">
                          Todas as fotos publicadas na Linha do Tempo e nos Relatorios recebem nosso "Selo de Preservacao", garantindo que aquelas midias e lembrancas estao guardadas e criptografadas em servidores seguros de alta perenidade, prontas para serem baixadas a qualquer momento do futuro.
                        </p>
                      </div>
                    </div>

                    
                    <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-3xs flex gap-3.5 items-start">
                      <span className="text-xl"> </span>
                      <div>
                        <h4 className="text-xs font-black text-slate-900">3. Valores Vivenciados (Desenvolvimento Etico)</h4>
                        <p className="text-[10px] text-slate-600 leading-relaxed font-semibold mt-1">
                          Em vez de relatorios puramente academicos, os professores selecionam quais valores eticos o anjinho demonstrou em cada registro: Gentileza, Empatia, Cooperacao, Respeito ou Compartilhamento. Uma visao holistica sobre quem a crianca esta se tornando.
                        </p>
                      </div>
                    </div>

                    
                    <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-3xs flex gap-3.5 items-start">
                      <span className="text-xl"> </span>
                      <div>
                        <h4 className="text-xs font-black text-slate-900">4. Linha do Tempo de Momentos Inesqueciveis</h4>
                        <p className="text-[10px] text-slate-600 leading-relaxed font-semibold mt-1">
                          Os pais contam com uma galeria afetiva dedicada exclusiva aos "Momentos Inesqueciveis". Um feed livre de ruidos operacionais, focado apenas no brilho estetico dos marcos mais bonitos da rotina do seu filho.
                        </p>
                      </div>
                    </div>

                  </div>

                  <div className="text-center py-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                    <p className="text-xs font-extrabold text-indigo-950 font-serif">
                      "Criamos produtos para educadores, mas construimos memorias eternas para pais."
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
                    <span className="text-[9px] uppercase font-black text-indigo-500 tracking-wider">Capitulo 9</span>
                    <h2 className="text-xl sm:text-2xl font-serif font-black text-indigo-950">Metodo Arvore da Inf</h2>
                  </div>
                  <span className="text-3xl"> </span>
                </div>

                <div className="space-y-6 text-xs sm:text-sm text-slate-800 leading-relaxed font-semibold font-sans">
                  <div className="p-5 rounded-2xl bg-gradient-to-tr from-amber-50 to-emerald-50 border border-amber-250/60 shadow-inner">
                    <p className="font-serif italic text-sm text-slate-800 text-center leading-relaxed">
                      "Toda crianca e uma semente. A familia planta. A escola cultiva. O Anjinho Escolar preserva essa historia."
                    </p>
                  </div>

                  <p>
                    O <strong>Metodo Arvore da Inf</strong> e a nossa metodologia exclusiva e registrada de comunicacao afetiva, documentacao do desenvolvimento e preservacao de legados. Com ele, o Anjinho Escolar deixa de ser um mero software de rotina e se consolida como uma propriedade intelectual insubstituivel.
                  </p>

                  <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wide">Os 5 Principios do Metodo</h3>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 pt-1 font-sans">
                    <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-3xs text-center space-y-1.5 flex flex-col items-center">
                      <span className="text-2xl block"> </span>
                      <h4 className="text-xs font-black text-slate-900">1. Plantar</h4>
                      <p className="text-[10px] text-slate-600 leading-relaxed font-semibold">
                        Acolhimento e confianca. Registros essenciais de rotina (sono, alimentacao, higiene).
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-3xs text-center space-y-1.5 flex flex-col items-center">
                      <span className="text-2xl block"> </span>
                      <h4 className="text-xs font-black text-slate-900">2. Cultivar</h4>
                      <p className="text-[10px] text-slate-600 leading-relaxed font-semibold">
                        Estimulo diario. Oficinas de arte, experiencias pedagogicas, fotos e descobertas.
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-3xs text-center space-y-1.5 flex flex-col items-center">
                      <span className="text-2xl block"> </span>
                      <h4 className="text-xs font-black text-slate-900">3. Florescer</h4>
                      <p className="text-[10px] text-slate-600 leading-relaxed font-semibold">
                        Valores humanos visiveis. Empatia, cooperacao, gentileza, respeito e autonomia.
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-3xs text-center space-y-1.5 flex flex-col items-center">
                      <span className="text-2xl block"> </span>
                      <h4 className="text-xs font-black text-slate-900">4. Frutificar</h4>
                      <p className="text-[10px] text-slate-600 leading-relaxed font-semibold">
                        Legado consolidado. O Album da Primeira Inf e a Linha do Tempo Inesquecivel.
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-3xs text-center space-y-1.5 flex flex-col items-center">
                      <span className="text-2xl block"> </span>
                      <h4 className="text-xs font-black text-slate-900">5. Preservar</h4>
                      <p className="text-[10px] text-slate-600 leading-relaxed font-semibold">
                        Permanencia vitalicia. Garantia de guarda segura e perene das midias para o futuro.
                      </p>
                    </div>
                  </div>

                  <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wide">As 5 Estacoes de Crescimento (Indice de Cultivo)</h3>
                  <p className="text-xs text-slate-700">
                    A arvore da crianca cresce no aplicativo de forma org de acordo com o seu <strong>Indice de Cultivo</strong>. Este indice e um indicador de qualidade (nao apenas de volume), ponderando registros enriquecidos com fotos, momentos marcados como "Inesqueciveis" e valores vivenciados.
                  </p>

                  <div className="space-y-2.5 font-sans">
                    <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xl"> </span>
                        <div>
                          <h4 className="text-xs font-black text-indigo-950">Estacao 1: A Semente</h4>
                          <p className="text-[10px] text-slate-600">Fase inicial de adaptacao e criacao de lacos afetuosos.</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black bg-white px-2 py-0.5 rounded-full border border-amber-200">0 - 15 pts</span>
                    </div>

                    <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xl"> </span>
                        <div>
                          <h4 className="text-xs font-black text-indigo-950">Estacao 2: Os Primeiros Brotos</h4>
                          <p className="text-[10px] text-slate-600">Curiosidade e exploracao ativa das novas din pedagogicas.</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black bg-white px-2 py-0.5 rounded-full border border-emerald-200">16 - 40 pts</span>
                    </div>

                    <div className="p-3 bg-sky-50/50 border border-sky-200 rounded-xl flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xl"> </span>
                        <div>
                          <h4 className="text-xs font-black text-indigo-950">Estacao 3: Raizes Fortes</h4>
                          <p className="text-[10px] text-slate-600">Desenvolvimento da autonomia, independencia e autoconfianca solida.</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black bg-white px-2 py-0.5 rounded-full border border-sky-200">41 - 75 pts</span>
                    </div>

                    <div className="p-3 bg-pink-50/50 border border-pink-200 rounded-xl flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xl"> </span>
                        <div>
                          <h4 className="text-xs font-black text-indigo-950">Estacao 4: Tempo de Florescer</h4>
                          <p className="text-[10px] text-slate-600">Desabrochar da inteligencia emocional, empatia, cooperacao e gentileza.</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black bg-white px-2 py-0.5 rounded-full border border-pink-200">76 - 110 pts</span>
                    </div>

                    <div className="p-3 bg-amber-100/30 border border-amber-300 rounded-xl flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xl"> </span>
                        <div>
                          <h4 className="text-xs font-black text-indigo-950">Estacao 5: Arvore de Frutos</h4>
                          <p className="text-[10px] text-slate-600">O legado completo da inf com memorias maduras, prontas para as proximas etapas da vida.</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black bg-white px-2 py-0.5 rounded-full border border-amber-300">111+ pts</span>
                    </div>
                  </div>

                  <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wide">Poder Comercial e Posicionamento de IP</h3>
                  <div className="bg-[#FFFDF9] p-4 rounded-xl border border-amber-200/60 shadow-3xs space-y-2">
                    <p className="text-[11px] text-slate-700 leading-relaxed">
                      <strong>1. Diferenciacao Absoluta:</strong> Enquanto os concorrentes brigam no oceano vermelho vendendo agendas frias de "sono e comida", nos oferecemos uma metodologia de formacao e documentacao de legado de vida.
                    </p>
                    <p className="text-[11px] text-slate-700 leading-relaxed">
                      <strong>2. Venda Consultiva para Diretores:</strong> O discurso nao e sobre tecnologia, e sobre cultivar a floresta de futuros. "Diretora, a senhora nao administra turmas, a senhora cultiva uma floresta inteira de futuros."
                    </p>
                    <p className="text-[11px] text-slate-700 leading-relaxed">
                      <strong>3. Formacao Continuada para Professores:</strong> O treinamento deixa de ser um tutorial do sistema e passa a ser uma formacao na metodologia de observacao e afeto, valorizando a profissao do educador.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeChapter === 'protecao_marca' && (() => {
              const totalItems = Object.keys(ipProtections).length;
              const activeCount = Object.values(ipProtections).filter(Boolean).length;
              const percent = Math.round((activeCount / totalItems) * 100);

              let level = 'Critico  ';
              let riskBg = 'bg-rose-50 border-rose-200 text-rose-800';
              let barColor = 'bg-rose-500';
              let desc = 'Sua propriedade intelectual esta exposta. Concorrentes podem facilmente plagiar sua marca, copiar sua interface e ate mesmo clonar seus scripts sem grandes barreiras juridicas ou tecnicas.';

              if (percent >= 30 && percent < 60) {
                level = 'Moderado [!]';
                riskBg = 'bg-amber-50 border-amber-200 text-amber-800';
                barColor = 'bg-amber-500';
                desc = 'Voce ja implementou as primeiras defesas (ex: NDA ou termos de uso), mas ainda possui vulnerabilidades criticas. Seu principal metodo ("Arvore da Inf") ou seu logotipo ainda podem ser imitados.';
              } else if (percent >= 60 && percent < 90) {
                level = 'Seguro & Blindado  ';
                riskBg = 'bg-indigo-50 border-indigo-200 text-indigo-900';
                barColor = 'bg-indigo-600';
                desc = 'Sua marca possui barreiras legais e tecnologicas consolidadas. Copias triviais serao combatidas judicialmente de forma rapida e a extracao do seu codigo e extremamente dificil.';
              } else if (percent >= 90) {
                level = 'Fortaleza Intelectual  ';
                riskBg = 'bg-emerald-50 border-emerald-250 text-emerald-950';
                barColor = 'bg-emerald-500';
                desc = 'Parabens! Sua propriedade intelectual esta blindada em todas as esferas. Seus metodos, marcas, codigo-fonte e dados estao protegidos por contratos impecaveis e tecnologias antipirataria.';
              }

              const templateNda = `ACORDO DE CONFIDENCIALIDADE E NAO-CONCORRENCIA (NDA)

Pelo presente instrumento particular, de um lado ANJINHO ESCOLAR TECNOLOGIA LTDA, e de outro lado o CONTRATADO, ajustam o seguinte:

1. OBJETO: O Contratado tera acesso a informacoes confidenciais relativas a arquitetura, codigo-fonte, metodologia "Arvore da Inf" e segredos de negocios do aplicativo Anjinho Escolar.
2. OBRIGACAO DE SIGILO: O Contratado obriga-se a manter absoluto sigilo sobre todas as Informacoes Confidenciais, nao as revelando a terceiros nem utilizando-as para fins alheios ao projeto.
3. NAO-CONCORRENCIA: O Contratado compromete-se a nao desenvolver, participar, prestar consultoria ou assessorar direta ou indiretamente qualquer software de gestao escolar, diario ou agenda escolar pelo prazo de 24 (vinte e quatro) meses a contar do termino deste vinculo.
4. PENALIDADES: O descumprimento de qualquer clausula ensejara multa penal de R$ 100.000,00, sem prejuizo de perdas e danos e medidas criminais cabiveis.`;

              const templateNotice = `NOTIFICACAO EXTRAJUDICIAL POR PLAGIO E USO INDEVIDO DE MARCA

A [NOME DO INFRATOR / CONCORRENTE]

Prezados,

Constatamos que sua empresa esta utilizando, sem previa autorizacao, elementos visuais, identidade de marca e/ou a metodologia registrada de propriedade exclusiva de ANJINHO ESCOLAR TECNOLOGIA LTDA.

Tais condutas configuram concorrencia desleal e violacao da Lei de Propriedade Industrial (Lei 9.279/96), da Lei do Software (Lei 9.609/98) e da Lei de Direitos Autorais (Lei 9.610/98).

Solicitamos que, no prazo improrrogavel de 48 (quarenta e oito) horas, cesse imediatamente todo e qualquer uso dos referidos elementos sob pena de adocao de medidas judiciais civeis (indenizacao por perdas e danos e lucros cessantes) e criminais cabiveis.`;

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
                      <span className="text-[9px] uppercase font-black text-indigo-500 tracking-wider">Capitulo 10   Diretrizes</span>
                      <h2 className="text-xl sm:text-2xl font-serif font-black text-indigo-950">BRAND-005 - Seguranca, Blindagem & IP</h2>
                    </div>
                    <span className="text-3xl"> </span>
                  </div>

                  <div className="space-y-4 text-xs sm:text-sm text-slate-800 leading-relaxed font-semibold font-sans">
                    <p>
                      Para que o <strong>Anjinho Escolar</strong> seja uma marca de valor inestimavel e protegida contra a comoditizacao, precisamos blinda-la legal e tecnologicamente. A concorrencia pode tentar copiar nosso visual, mas nunca podera copiar nossa integridade legal, nossa marca registrada e nossos algoritmos exclusivos.
                    </p>

                    
                    <div className="p-5 rounded-2xl bg-gradient-to-tr from-[#FAF9F5] to-[#F1F5F9] border border-amber-200/70 shadow-sm space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="text-base"> </span>
                        <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wide">Simulador de Vulnerabilidade & Blindagem de IP</h3>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        Selecione quais mecanismos de protecao estao ativos no momento para calcular em tempo real o <strong>Indice de Vulnerabilidade</strong> do produto e gerar o plano de acao adequado:
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                        
                        <div className="space-y-3 p-4 bg-white rounded-xl border border-slate-200/60 shadow-3xs">
                          <h4 className="text-[11px] font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1">
                            <span> </span> Protecoes Legais & Contratos
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
                                <span className="block text-[11px] font-black text-slate-800">Direitos Autorais do Metodo Arvore da Inf</span>
                                <span className="block text-[9px] text-slate-500 font-medium">Registro na Biblioteca Nacional impedindo o plagio da metodologia pedagogica.</span>
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
                                <span className="block text-[9px] text-slate-500 font-medium">Protecao do codigo-fonte do app contra copias literais de trechos de codigo (50 anos).</span>
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
                                <span className="block text-[11px] font-black text-slate-800">NDAs & Nao-Concorrencia com Programadores</span>
                                <span className="block text-[9px] text-slate-500 font-medium">Contratos impedindo desenvolvedores de vender solucoes similares a concorrentes.</span>
                              </div>
                            </label>
                          </div>
                        </div>

                        
                        <div className="space-y-3 p-4 bg-white rounded-xl border border-slate-200/60 shadow-3xs">
                          <h4 className="text-[11px] font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1">
                            <span> </span> Barreiras Tecnicas & Arquitetura
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
                                <span className="block text-[11px] font-black text-slate-800">Ofuscacao & Minificacao (Vite/Bundler)</span>
                                <span className="block text-[9px] text-slate-500 font-medium">Torna o codigo JavaScript do navegador incompreensivel, evitando engenharia reversa.</span>
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
                                <span className="block text-[11px] font-black text-slate-800">Calculos Criticos no Backend-First</span>
                                <span className="block text-[9px] text-slate-500 font-medium">A logica de calculo do "Indice de Cultivo" roda no servidor e nunca vaza no front-end.</span>
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
                                <span className="block text-[11px] font-black text-slate-800">Marcas d'Agua Digitais em PDFs e Fotos</span>
                                <span className="block text-[9px] text-slate-500 font-medium">Evita que concorrentes baixem relatorios e usem como material de portfolio proprio.</span>
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
                                <span className="block text-[9px] text-slate-500 font-medium">Contrato digital forcando o usuario a concordar em nao copiar a estrutura sob pena criminal.</span>
                              </div>
                            </label>
                          </div>
                        </div>
                      </div>

                      
                      <div className="p-4 rounded-xl bg-white border border-slate-200/80 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-indigo-950 uppercase">Grau de Blindagem do Produto:</span>
                          <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${riskBg}`}>
                            {percent}%   {level}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden border border-slate-200 p-0.5">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                          <strong>Diagnostico Legal:</strong> {desc}
                        </p>
                      </div>
                    </div>

                    <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wide">Como Realizar os Registros Oficiais (Brasil)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                        <span className="text-2xl"> </span>
                        <h4 className="text-xs font-black text-slate-900 leading-tight">1. Registro de Marca (INPI)</h4>
                        <p className="text-[10px] text-slate-600 leading-relaxed">
                          Protege o nome "Anjinho Escolar" e o logotipo misto. Impede imitadores de usarem o mesmo nome na classe de softwares e educacao.
                        </p>
                        <div className="text-[9px] text-slate-500 pt-1 font-bold">
                            Prazo: 8 a 12 meses<br />
                            Orgao: INPI (inpi.gov.br)<br />
                            Custo: Taxas a partir de R$ 142,00 (ME)
                        </div>
                      </div>

                      <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                        <span className="text-2xl"> </span>
                        <h4 className="text-xs font-black text-slate-900 leading-tight">2. Registro de Codigo (INPI)</h4>
                        <p className="text-[10px] text-slate-600 leading-relaxed">
                          O registro do codigo-fonte e feito via hash criptografica gerada do codigo e depositada no INPI, garantindo propriedade autoral internacional.
                        </p>
                        <div className="text-[9px] text-slate-500 pt-1 font-bold">
                            Prazo: Ate 7 dias (Automatico)<br />
                            Orgao: INPI (inpi.gov.br)<br />
                            Custo: Taxa fixa de R$ 185,00
                        </div>
                      </div>

                      <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                        <span className="text-2xl"> </span>
                        <h4 className="text-xs font-black text-slate-900 leading-tight">3. Registro de Metodologia</h4>
                        <p className="text-[10px] text-slate-600 leading-relaxed">
                          A apostila literaria e didatica do "Metodo Arvore da Inf" deve ser registrada como obra literaria e cientifica.
                        </p>
                        <div className="text-[9px] text-slate-500 pt-1 font-bold">
                            Prazo: 30 a 90 dias<br />
                            Orgao: Biblioteca Nacional (eda.bn.gov.br)<br />
                            Custo: Taxa de R$ 20,00 a R$ 40,00
                        </div>
                      </div>
                    </div>

                    
                    <div className="space-y-3 pt-2">
                      <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wide">Modelos Juridicos Prontos para Copiar</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center bg-slate-100 px-3.5 py-2 rounded-t-xl border-x border-t border-slate-250">
                            <span className="text-[10px] font-black text-slate-700 flex items-center gap-1">  Modelo NDA & Nao-Concorrencia</span>
                            <button
                              onClick={() => handleCopy(templateNda, 'nda-text')}
                              className="text-[10px] text-indigo-600 font-extrabold hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              {copiedText === 'nda-text' ? 'Copiado!  ' : 'Copiar Texto  '}
                            </button>
                          </div>
                          <pre className="p-3 bg-slate-50 text-[10px] text-slate-650 leading-relaxed font-mono rounded-b-xl border border-slate-250 max-h-48 overflow-y-auto whitespace-pre-wrap select-all shadow-inner">
                            {templateNda}
                          </pre>
                        </div>

                        
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center bg-slate-100 px-3.5 py-2 rounded-t-xl border-x border-t border-slate-250">
                            <span className="text-[10px] font-black text-slate-700 flex items-center gap-1">  Notificacao Extrajudicial de Plagio</span>
                            <button
                              onClick={() => handleCopy(templateNotice, 'notice-text')}
                              className="text-[10px] text-indigo-600 font-extrabold hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              {copiedText === 'notice-text' ? 'Copiado!  ' : 'Copiar Texto  '}
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
                        <strong>Recomendacao de Operacao:</strong> Execute o registro de marca mista no INPI o quanto antes para garantir precedencia. Em paralelo, faca com que todos os prestadores de servico terceirizados assinem o termo de nao-concorrencia e NDA antes de entrega-los acesso ao repositorio de codigo.
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
