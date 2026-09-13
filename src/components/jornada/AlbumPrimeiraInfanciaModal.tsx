import React, { useState } from 'react';
import { ChildProfile, LembrancaMoment } from '../../types';
import {
  X,
  Printer,
  Sparkles,
  BookOpen,
  Calendar,
  Heart,
  Award,
  Users,
  MessageCircle,
  TreeDeciduous,
  Send,
  Download,
  CheckCircle2,
  Quote,
  Clock,
  Feather,
  ChevronRight,
  ShieldCheck,
  Smile,
  FileText,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  student: ChildProfile;
  moments: LembrancaMoment[];
}

export default function AlbumPrimeiraInfanciaModal({
  isOpen,
  onClose,
  student,
  moments,
}: Props) {
  const [selectedYear, setSelectedYear] = useState<'2026' | '2027' | 'completo'>('2026');
  const [activeChapter, setActiveChapter] = useState<string>('todos');

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  // 9 Capítulos do Livro de Memórias do Brand Book
  const chapters = [
    { id: 'abertura', label: 'Abertura', icon: Sparkles },
    { id: 'momentos', label: '1. Meu Ano em Momentos', icon: Calendar },
    { id: 'descobertas', label: '2. Minhas Descobertas', icon: Feather },
    { id: 'conquistas', label: '3. Pequenas Grandes Conquistas', icon: Award },
    { id: 'pessoas', label: '4. Pessoas da Minha História', icon: Users },
    { id: 'voz', label: '5. Minha Voz', icon: MessageCircle },
    { id: 'arvore', label: '6. Minha Árvore da Infância®', icon: TreeDeciduous },
    { id: 'escola', label: '7. O Olhar da Escola', icon: Heart },
    { id: 'futuro', label: '8. Carta para o Futuro', icon: Send },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-md flex justify-center items-start p-2 sm:p-4 md:p-6 animate-fadeIn print:p-0 print:bg-white print:static">
      <div className="bg-[#FAF8F5] text-slate-800 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden border border-amber-200/60 my-auto flex flex-col max-h-[94vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Top Control Bar (Hidden on Print) */}
        <div className="p-3.5 sm:p-4 bg-white/90 backdrop-blur border-b border-amber-200/40 flex items-center justify-between gap-3 print:hidden flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs sm:text-sm font-bold transition cursor-pointer"
            >
              <X size={17} />
              <span>Fechar Visualização</span>
            </button>

            {/* Seletor de Coleção de Anos */}
            <div className="hidden sm:flex items-center gap-1 bg-amber-50/80 border border-amber-200/70 p-1 rounded-2xl">
              <button
                onClick={() => setSelectedYear('2026')}
                className={`px-3 py-1 rounded-xl text-xs font-black transition cursor-pointer ${
                  selectedYear === '2026'
                    ? 'bg-amber-400 text-amber-950 shadow-xs'
                    : 'text-amber-900 hover:bg-amber-100'
                }`}
              >
                📚 2026 (Maternal I)
              </button>
              <button
                onClick={() => setSelectedYear('2027')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedYear === '2027'
                    ? 'bg-amber-400 text-amber-950 shadow-xs'
                    : 'text-amber-800/60 hover:text-amber-900'
                }`}
                title="Próximo ano letivo"
              >
                2027 (Maternal II)
              </button>
              <button
                onClick={() => setSelectedYear('completo')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedYear === 'completo'
                    ? 'bg-amber-400 text-amber-950 shadow-xs'
                    : 'text-amber-800/60 hover:text-amber-900'
                }`}
              >
                🌳 Minha História
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              <ShieldCheck size={14} /> Guardião de Memórias Ativo
            </span>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs sm:text-sm font-black shadow-md transition cursor-pointer active:scale-95"
            >
              <Printer size={16} />
              <span>Imprimir / Salvar Livro em PDF</span>
            </button>
          </div>
        </div>

        {/* Navigation by Chapters (Horizontal quick bar - Hidden on Print) */}
        <div className="px-4 py-2 bg-amber-50/50 border-b border-amber-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar print:hidden flex-shrink-0">
          <button
            onClick={() => setActiveChapter('todos')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeChapter === 'todos'
                ? 'bg-indigo-900 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-amber-50'
            }`}
          >
            📖 Ler Livro Completo
          </button>
          {chapters.map((ch) => {
            const Icon = ch.icon;
            const isActive = activeChapter === ch.id;
            return (
              <button
                key={ch.id}
                onClick={() => setActiveChapter(ch.id)}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-700 text-white shadow-xs font-bold'
                    : 'bg-white text-slate-600 border border-amber-200/50 hover:bg-white'
                }`}
              >
                <Icon size={12} className={isActive ? 'text-amber-300' : 'text-amber-600'} />
                <span>{ch.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Printable Book Body */}
        <div className="p-4 sm:p-8 md:p-12 overflow-y-auto space-y-12 bg-[#FAF8F5] print:p-0 print:bg-white print:overflow-visible">
          
          {/* ======================================================== */}
          {/* CAPA & CABEÇALHO DO ÁLBUM                               */}
          {/* ======================================================== */}
          <div className="bg-gradient-to-b from-amber-100/50 via-white to-amber-50/30 rounded-3xl p-6 sm:p-12 border border-amber-200/80 shadow-sm relative text-center overflow-hidden">
            {/* Elementos decorativos */}
            <div className="absolute top-5 left-6 text-amber-500 font-serif text-2xl">
              ✨
            </div>
            <div className="absolute top-5 right-6 text-emerald-600">
              <BookOpen size={28} />
            </div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-amber-200/20 rounded-full blur-2xl pointer-events-none" />

            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black uppercase tracking-wider mb-4 border border-amber-200">
              <Sparkles size={13} className="text-amber-600" />
              <span>Coleção Minha 1ª Infância • Livro do Ano 2026</span>
            </div>

            {/* Foto Oficial de Abertura */}
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-white shadow-xl mx-auto overflow-hidden bg-white mb-4 ring-4 ring-amber-300/50">
              <img
                src={
                  student.fotoUrl ||
                  'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80'
                }
                alt={student.nome}
                className="w-full h-full object-cover"
              />
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-black text-slate-900 tracking-tight">
              O Álbum da Primeira Infância
            </h1>
            <p className="text-sm sm:text-base md:text-lg font-medium text-amber-900/80 mt-2 max-w-xl mx-auto italic">
              "Uma história viva que cresce junto com a criança, guardada para sempre."
            </p>

            <h2 className="text-2xl sm:text-3xl font-black text-indigo-950 mt-5">
              {student.nome}
            </h2>
            <div className="inline-flex items-center gap-2 mt-2 bg-white border border-amber-200 px-4 py-1.5 rounded-full text-xs font-bold text-slate-700 shadow-2xs">
              <span>SALA: {student.sala || 'MATERNAL I'}</span>
              <span className="text-amber-400">•</span>
              <span>COLÉGIO PEQUENO ANJO</span>
              <span className="text-amber-400">•</span>
              <span>PROF. ANA SILVA</span>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 1. ABERTURA — "ERA UMA VEZ..."                           */}
          {/* ======================================================== */}
          {(activeChapter === 'todos' || activeChapter === 'abertura') && (
            <section className="bg-white rounded-3xl p-6 sm:p-10 border border-amber-200/70 shadow-xs relative">
              <div className="max-w-2xl mx-auto text-center space-y-4">
                <Quote className="text-amber-400 mx-auto" size={32} />
                <h3 className="text-2xl sm:text-3xl font-serif font-black text-amber-950">
                  Era uma vez...
                </h3>
                <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-serif italic">
                  "Era uma vez uma pequena história que começou a ser escrita todos os dias...
                  Entre descobertas, abraços, brincadeiras, primeiros passos, novas palavras e tantas pequenas conquistas, este foi um ano especial.
                  Aqui estão os momentos que fizeram parte dessa história."
                </p>
                <div className="pt-2 text-xs font-black uppercase text-amber-800/60 tracking-widest">
                  — O Início do Nosso Legado
                </div>
              </div>
            </section>
          )}

          {/* ======================================================== */}
          {/* 2. "MEU ANO EM MOMENTOS" (Curadoria Cronológica)         */}
          {/* ======================================================== */}
          {(activeChapter === 'todos' || activeChapter === 'momentos') && (
            <section className="space-y-6">
              <div className="border-b border-amber-200 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-xl sm:text-2xl font-serif font-black text-slate-900 flex items-center gap-2">
                    <Calendar className="text-indigo-600" size={24} />
                    <span>Meu Ano em Momentos</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                    A seleção dos momentos mais representativos, narrados mês a mês pela Aura AI e equipe.
                  </p>
                </div>
                <span className="text-xs font-bold text-amber-900 bg-amber-100/70 border border-amber-200 px-3 py-1 rounded-full">
                  Curadoria Afetiva
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Janeiro */}
                <div className="bg-white rounded-2xl p-5 border border-amber-100 shadow-2xs hover:shadow-md transition flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="h-44 rounded-xl overflow-hidden bg-slate-100 relative">
                      <img
                        src="https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80"
                        alt="Janeiro"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 left-2 bg-indigo-950/80 text-white text-[11px] font-black px-2.5 py-1 rounded-lg backdrop-blur">
                        Fevereiro • Acolhimento
                      </span>
                    </div>
                    <h4 className="font-serif font-black text-lg text-slate-900">
                      Cheguei para uma nova aventura
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-serif">
                      Os primeiros dias no colégio foram de olhares curiosos, reconhecimento dos espaços e a descoberta de que aqui haveria um porto seguro de afeto para crescer.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-amber-700 font-bold">
                    <span>🌱 Fase Semente plantada com carinho</span>
                  </div>
                </div>

                {/* Março */}
                <div className="bg-white rounded-2xl p-5 border border-amber-100 shadow-2xs hover:shadow-md transition flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="h-44 rounded-xl overflow-hidden bg-slate-100 relative">
                      <img
                        src="https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=600&auto=format&fit=crop&q=80"
                        alt="Março"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 left-2 bg-emerald-900/80 text-white text-[11px] font-black px-2.5 py-1 rounded-lg backdrop-blur">
                        Março • Socialização
                      </span>
                    </div>
                    <h4 className="font-serif font-black text-lg text-slate-900">
                      Comecei a descobrir novas brincadeiras
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-serif">
                      Compartilhar os blocos e rir junto com os amiguinhos na roda de contação de histórias trouxe sorrisos espontâneos e os primeiros laços de amizade.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-emerald-700 font-bold">
                    <span>🌿 Relações fraternas florescendo</span>
                  </div>
                </div>

                {/* Maio */}
                <div className="bg-white rounded-2xl p-5 border border-amber-100 shadow-2xs hover:shadow-md transition flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="h-44 rounded-xl overflow-hidden bg-slate-100 relative">
                      <img
                        src="https://images.unsplash.com/photo-1596464716127-f2a829822301?w=600&auto=format&fit=crop&q=80"
                        alt="Maio"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 left-2 bg-amber-900/80 text-white text-[11px] font-black px-2.5 py-1 rounded-lg backdrop-blur">
                        Maio • Artes Sensoriais
                      </span>
                    </div>
                    <h4 className="font-serif font-black text-lg text-slate-900">
                      Mãos que contam histórias
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-serif">
                      A descoberta das tintas naturais e a textura das folhas do jardim despertaram uma expressão artística cheia de entusiasmo e concentração.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-amber-800 font-bold">
                    <span>🌸 Criatividade e expressão lúdica</span>
                  </div>
                </div>

                {/* Agosto */}
                <div className="bg-white rounded-2xl p-5 border border-amber-100 shadow-2xs hover:shadow-md transition flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="h-44 rounded-xl overflow-hidden bg-slate-100 relative">
                      <img
                        src="https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=600&auto=format&fit=crop&q=80"
                        alt="Agosto"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 left-2 bg-teal-900/80 text-white text-[11px] font-black px-2.5 py-1 rounded-lg backdrop-blur">
                        Agosto • Autonomia
                      </span>
                    </div>
                    <h4 className="font-serif font-black text-lg text-slate-900">
                      Aprendi a fazer sozinho!
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-serif">
                      Guardar a mochila no cabide e escolher o livro da historinha sem ajuda. Um brilho no olhar que dizia com orgulho: "Eu consigo!"
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-teal-700 font-bold">
                    <span>🍃 Autonomia e independência</span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ======================================================== */}
          {/* 3. "MINHAS DESCOBERTAS" (Experiências Pedagógicas)        */}
          {/* ======================================================== */}
          {(activeChapter === 'todos' || activeChapter === 'descobertas') && (
            <section className="space-y-5 bg-gradient-to-br from-emerald-50/70 to-teal-50/40 rounded-3xl p-6 sm:p-8 border border-emerald-200/70">
              <div className="border-b border-emerald-200/60 pb-3">
                <h3 className="text-xl sm:text-2xl font-serif font-black text-emerald-950 flex items-center gap-2">
                  <Feather className="text-emerald-700" size={24} />
                  <span>Minhas Descobertas</span>
                </h3>
                <p className="text-xs sm:text-sm text-emerald-800/80 mt-0.5">
                  Não apenas atividades burocráticas, mas vivências transformadas em poesia afetiva.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-2xs space-y-2">
                  <div className="text-2xl">🎨</div>
                  <h4 className="font-serif font-black text-slate-900 text-sm">Oficina de Cores</h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-serif italic">
                    "Hoje descobri que minhas mãos também podem pintar sentimentos e dar cor ao mundo ao meu redor."
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-2xs space-y-2">
                  <div className="text-2xl">🎶</div>
                  <h4 className="font-serif font-black text-slate-900 text-sm">Sons e Canções</h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-serif italic">
                    "Ouvindo o batuque dos chocalhos e cantando cirandas, aprendi o ritmo do coração e da alegria."
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-2xs space-y-2">
                  <div className="text-2xl">🌱</div>
                  <h4 className="font-serif font-black text-slate-900 text-sm">Pés na Terra</h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-serif italic">
                    "A terra fofa da horta e a rega das plantinhas me ensinaram que quem cuida com carinho vê a vida brotar."
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* ======================================================== */}
          {/* 4. "MINHAS PEQUENAS GRANDES CONQUISTAS"                   */}
          {/* ======================================================== */}
          {(activeChapter === 'todos' || activeChapter === 'conquistas') && (
            <section className="space-y-4">
              <div className="border-b border-amber-200 pb-3">
                <h3 className="text-xl sm:text-2xl font-serif font-black text-slate-900 flex items-center gap-2">
                  <Award className="text-amber-500" size={24} />
                  <span>Minhas Pequenas Grandes Conquistas</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  Conexão afetiva com a Árvore da Infância® — sem notas ou rankings, valorizando o ser.
                </p>
              </div>

              <div className="space-y-3">
                <div className="bg-white p-5 rounded-2xl border border-amber-100 flex items-start gap-4 shadow-2xs">
                  <span className="text-2xl p-2 bg-emerald-50 rounded-xl border border-emerald-100">🌱</span>
                  <div>
                    <h4 className="font-black text-slate-900 text-sm sm:text-base">
                      Uma nova conquista nasceu: Autonomia nos Cuidados
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 font-serif">
                      Comecei a tentar lavar as mãozinhas e calçar as meinhas sozinho. Pequenos gestos que mostram uma confiança grandiosa florescendo no dia a dia.
                    </p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-amber-100 flex items-start gap-4 shadow-2xs">
                  <span className="text-2xl p-2 bg-teal-50 rounded-xl border border-teal-100">🌿</span>
                  <div>
                    <h4 className="font-black text-slate-900 text-sm sm:text-base">
                      Estou ficando cada vez mais independente na Rotina
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 font-serif">
                      Já participo dos momentos de alimentação com serenidade e tranquilidade, saboreando cada alimento e esperando a minha vez com paciência.
                    </p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-amber-100 flex items-start gap-4 shadow-2xs">
                  <span className="text-2xl p-2 bg-rose-50 rounded-xl border border-rose-100">🌸</span>
                  <div>
                    <h4 className="font-black text-slate-900 text-sm sm:text-base">
                      Empatia e Acolhimento Fraterno
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 font-serif">
                      Quando um amiguinho chorou na hora da despedida, fui até ele e ofereci um brinquedo favorito. O abraço curou a saudade!
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ======================================================== */}
          {/* 5. "PESSOAS QUE FIZERAM PARTE DA MINHA HISTÓRIA"         */}
          {/* ======================================================== */}
          {(activeChapter === 'todos' || activeChapter === 'pessoas') && (
            <section className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-200/70 shadow-xs space-y-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-serif font-black text-indigo-950 flex items-center gap-2">
                  <Users className="text-indigo-600" size={24} />
                  <span>Pessoas que Fizeram Parte da Minha História</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  "Durante este ano, muitas pessoas cuidaram com carinho de cada passo meu."
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/50 text-center space-y-2">
                  <div className="w-16 h-16 rounded-full overflow-hidden mx-auto border-2 border-white shadow-xs">
                    <img
                      src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80"
                      alt="Professora Ana Silva"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h5 className="font-black text-slate-900 text-xs sm:text-sm">Prof. Ana Silva</h5>
                  <p className="text-[11px] text-amber-900 font-medium">Professora Titular</p>
                  <p className="text-[11px] text-slate-600 italic font-serif">"O olhar atento que acolheu cada manhã com ternura."</p>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200/50 text-center space-y-2">
                  <div className="w-16 h-16 rounded-full overflow-hidden mx-auto border-2 border-white shadow-xs">
                    <img
                      src="https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80"
                      alt="Colegas de Turma"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h5 className="font-black text-slate-900 text-xs sm:text-sm">Turma Maternal I</h5>
                  <p className="text-[11px] text-indigo-900 font-medium">Amigos de Jornada</p>
                  <p className="text-[11px] text-slate-600 italic font-serif">"Gargalhadas compartilhadas na casinha e no parquinho."</p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/50 text-center space-y-2">
                  <div className="w-16 h-16 rounded-full overflow-hidden mx-auto border-2 border-white shadow-xs">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"
                      alt="Família Querida"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h5 className="font-black text-slate-900 text-xs sm:text-sm">Família Querida</h5>
                  <p className="text-[11px] text-emerald-900 font-medium">Parceria de Amor</p>
                  <p className="text-[11px] text-slate-600 italic font-serif">"O beijo no portão e a alegria do reencontro diário."</p>
                </div>
              </div>
            </section>
          )}

          {/* ======================================================== */}
          {/* 6. "MINHA VOZ" (As Palavras & Falas Gravadas)            */}
          {/* ======================================================== */}
          {(activeChapter === 'todos' || activeChapter === 'voz') && (
            <section className="bg-gradient-to-r from-amber-100/70 via-rose-50/50 to-amber-50/60 rounded-3xl p-6 sm:p-8 border border-amber-200/80 space-y-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-serif font-black text-amber-950 flex items-center gap-2">
                  <MessageCircle className="text-amber-600" size={24} />
                  <span>Minha Voz</span>
                </h3>
                <p className="text-xs sm:text-sm text-amber-900/80 mt-0.5">
                  Porque daqui a muitos anos, a família não estará apenas vendo uma foto; estará ouvindo a infância que passou.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="bg-white/90 backdrop-blur p-4 rounded-2xl border border-amber-200/60 shadow-2xs flex items-start gap-3">
                  <Quote className="text-amber-500 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="text-sm font-black text-slate-900 font-serif">
                      "Olha, professora! O castelo ficou do tamanho do céu!"
                    </p>
                    <span className="text-[10px] text-slate-500 font-semibold mt-1 block">
                      Registrado em 14 de Abril • Durante oficina com blocos lúdicos
                    </span>
                  </div>
                </div>

                <div className="bg-white/90 backdrop-blur p-4 rounded-2xl border border-amber-200/60 shadow-2xs flex items-start gap-3">
                  <Quote className="text-amber-500 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="text-sm font-black text-slate-900 font-serif">
                      "Eu consegui comer tudinho sozinho, viu?"
                    </p>
                    <span className="text-[10px] text-slate-500 font-semibold mt-1 block">
                      Registrado em 22 de Junho • Momento do almoço acolhedor
                    </span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ======================================================== */}
          {/* 7. "MINHA ÁRVORE DA INFÂNCIA®" (Evolução no Ano)         */}
          {/* ======================================================== */}
          {(activeChapter === 'todos' || activeChapter === 'arvore') && (
            <section className="bg-white rounded-3xl p-6 sm:p-10 border border-emerald-200 shadow-xs space-y-6">
              <div className="text-center max-w-xl mx-auto space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-black uppercase tracking-wider border border-emerald-200">
                  <TreeDeciduous size={14} className="text-emerald-600" />
                  Metodologia Registrada e Protegida
                </span>
                <h3 className="text-2xl sm:text-3xl font-serif font-black text-emerald-950">
                  Minha Árvore da Infância®
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 font-serif">
                  A maturação visual da criança ao longo das estações: do brotinho à copa frondosa de valores e afetos.
                </p>
              </div>

              {/* Linha do Tempo Visual: Início -> Meio -> Final do Ano */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 text-center space-y-3">
                  <span className="text-3xl">🌱</span>
                  <h5 className="font-serif font-black text-slate-900 text-sm sm:text-base">Início do Ano (Plantar)</h5>
                  <p className="text-xs text-slate-600 font-serif">
                    Criação de raízes afetivas e adaptação segura ao novo ambiente escolar.
                  </p>
                  <div className="text-[10px] font-bold text-emerald-800 bg-white border border-emerald-200 py-1 rounded-lg">
                    Solo Fértil & Acolhimento
                  </div>
                </div>

                <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 text-center space-y-3">
                  <span className="text-3xl">🌿</span>
                  <h5 className="font-serif font-black text-slate-900 text-sm sm:text-base">Meio do Ano (Cultivar)</h5>
                  <p className="text-xs text-slate-600 font-serif">
                    Florescimento das primeiras palavras, partilha de brinquedos e autonomia motora.
                  </p>
                  <div className="text-[10px] font-bold text-emerald-800 bg-white border border-emerald-200 py-1 rounded-lg">
                    Ramos Fortes & Descobertas
                  </div>
                </div>

                <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 text-center space-y-3">
                  <span className="text-3xl">🌳</span>
                  <h5 className="font-serif font-black text-slate-900 text-sm sm:text-base">Fim do Ano (Frutificar)</h5>
                  <p className="text-xs text-slate-600 font-serif">
                    Uma criança confiante, segura e repleta de memórias eternizadas em seu legado.
                  </p>
                  <div className="text-[10px] font-bold text-emerald-800 bg-white border border-emerald-200 py-1 rounded-lg">
                    Frutos de Amor & Legado Vivo
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ======================================================== */}
          {/* 8. "O OLHAR DA ESCOLA" (Mensagem Final da Professora)    */}
          {/* ======================================================== */}
          {(activeChapter === 'todos' || activeChapter === 'escola') && (
            <section className="bg-white rounded-3xl p-6 sm:p-10 border border-amber-200/80 shadow-xs relative">
              <div className="max-w-2xl mx-auto space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-amber-200">
                    <img
                      src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80"
                      alt="Professora Titular"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-serif font-black text-slate-900 text-lg sm:text-xl">
                      O Olhar da Escola
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">
                      Mensagem de carinho da Professora Ana Silva e Equipe Pedagógica
                    </p>
                  </div>
                </div>

                <div className="p-6 bg-amber-50/40 rounded-2xl border border-amber-200/60 font-serif text-slate-700 leading-relaxed text-sm sm:text-base space-y-3">
                  <p>
                    <strong>Querida família,</strong>
                  </p>
                  <p>
                    Acompanhar o crescimento de uma criança é testemunhar pequenas transformações diárias que, quando olhamos para trás, se tornam monumentais.
                  </p>
                  <p>
                    Foi um privilégio e uma honra sem tamanho fazer parte deste capítulo da história de <strong>{student.nome}</strong>. Cada sorriso no corredor, cada conquista no parquinho e cada abraço apertado ficarão para sempre guardados em nossos corações.
                  </p>
                  <p className="pt-2 italic text-amber-950 font-bold">
                    Com todo o nosso afeto e gratidão,<br />
                    Professora Ana Silva & Família Colégio Pequeno Anjo
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* ======================================================== */}
          {/* 9. "CARTA PARA O FUTURO" (Cápsula do Tempo - Encerramento) */}
          {/* ======================================================== */}
          {(activeChapter === 'todos' || activeChapter === 'futuro') && (
            <section className="bg-gradient-to-b from-indigo-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-6 sm:p-12 shadow-xl border border-indigo-700/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

              <div className="max-w-2xl mx-auto space-y-6 relative z-10 text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto text-amber-300">
                  <Send size={26} />
                </div>

                <div className="space-y-1">
                  <span className="text-amber-400 text-xs font-black uppercase tracking-widest">
                    Cápsula do Tempo • Carta para o Futuro
                  </span>
                  <h3 className="text-2xl sm:text-4xl font-serif font-black text-white">
                    Para você, quando crescer...
                  </h3>
                </div>

                <div className="p-6 sm:p-8 bg-white/5 backdrop-blur-md rounded-2xl border border-white/15 text-left font-serif text-indigo-100 leading-relaxed text-sm sm:text-base space-y-4 shadow-inner">
                  <p className="italic text-amber-200 font-semibold">
                    "Talvez um dia você não se lembre deste momento exato. Mas nós guardamos."
                  </p>
                  <p>
                    Guardamos o jeito como você corria com os braços abertos ao ver seus amigos. Guardamos a coragem que teve ao tentar mais uma vez após tropeçar. Guardamos o brilho nos seus olhinhos ao descobrir que as tintas podiam criar um arco-íris só seu.
                  </p>
                  <p>
                    Nunca se esqueça de que você é amado, capaz e único. O mundo é um jardim imenso esperando pelos seus passos firmes. Seja sempre curioso, gentil e verdadeiro com a sua história.
                  </p>
                  <p className="pt-3 border-t border-white/10 text-right text-xs text-amber-300 font-sans font-bold">
                    Guardado com amor eterno pelo Anjinho Escolar • {student.nome} (Ano Letivo 2026)
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* ======================================================== */}
          {/* RODAPÉ DO LIVRO: SELO DE PRESERVAÇÃO VITALÍCIA           */}
          {/* ======================================================== */}
          <div className="text-center pt-4 pb-2 border-t border-amber-200/60 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-slate-700 font-medium">
              <ShieldCheck className="text-emerald-600" size={18} />
              <span>Selo de Preservação Vitalícia: Memórias criptografadas e protegidas para o futuro.</span>
            </div>
            <div className="font-bold text-amber-900">
              Anjinho Escolar & Anjinha Aura • O Guardião das Memórias
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
