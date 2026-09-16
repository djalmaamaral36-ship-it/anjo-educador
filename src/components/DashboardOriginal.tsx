import React, { useState } from 'react';
import { Aluno, RotinaDia, RecadinhoTurma } from '../types';
import {
  Search, Mic, MicOff, ShieldCheck, Award, Sparkles, CheckCircle2, User, Users,
  Utensils, Moon, Heart, Smile, Send, AlertTriangle, ChevronRight, Edit3, Edit, Wand2,
  Camera, Image, Plus, Trash2, BookOpen, Palette, Music, Check, Star
} from 'lucide-react';

interface DashboardOriginalProps {
  turmaAtual: string;
  onSelectTurma: (turma: string) => void;
  alunos: Aluno[];
  setAlunos?: React.Dispatch<React.SetStateAction<Aluno[]>>;
  rotinas: Record<string, RotinaDia>;
  setRotinas?: React.Dispatch<React.SetStateAction<Record<string, RotinaDia>>>;
  recadinhoTurma: RecadinhoTurma;
  onSalvarRecadinhoTurma?: (novaMensagem: string, categoria: RecadinhoTurma['categoria']) => void;
  onAtualizarPresenca?: (alunoId: string, presente: boolean) => void;
  onAtualizarRotina?: (alunoId: string, dadosNovos: Partial<RotinaDia>) => void;
  onAbrirModalOcorrencia?: () => void;
}

export const DashboardOriginal: React.FC<DashboardOriginalProps> = ({
  turmaAtual,
  onSelectTurma,
  alunos,
  setAlunos,
  rotinas,
  setRotinas,
  recadinhoTurma,
  onSalvarRecadinhoTurma,
  onAtualizarPresenca,
  onAtualizarRotina,
  onAbrirModalOcorrencia
}) => {
  const [busca, setBusca] = useState('');
  const [alunoSelecionadoId, setAlunoSelecionadoId] = useState<string>(alunos[0]?.id || '1');
  const [modalOcorrencia, setModalOcorrencia] = useState(false);
  const [modalWhatsapp, setModalWhatsapp] = useState(false);

  // Estados para edição do Recadinho da Educadora
  const [editandoRecadinho, setEditandoRecadinho] = useState(false);
  const [textoRecadinhoTemp, setTextoRecadinhoTemp] = useState(recadinhoTurma.mensagem);
  const [ditandoVoz, setDitandoVoz] = useState(false);

  const sugestoesRapidas = [
    { label: '🌸 Carinho & Afeto', texto: 'Olá famílias! Hoje nosso dia foi repleto de sorrisos e momentos afetivos na rodinha de histórias. Todos interagiram super bem! Com amor, equipe pedagógica.' },
    { label: '🎨 Projeto Sensorial', texto: 'Queridos pais! Realizamos uma oficina sensorial maravilhosa com massinhas caseiras. As crianças exploraram cores e texturas com muita curiosidade.' },
    { label: '☀️ Brincadeira no Parque', texto: 'Hoje o dia esteve ensolarado e aproveitamos o parque para circuitos motores ao ar livre. Todos retornaram radiantes para o lanche!' }
  ];

  const handleSalvarRecadinho = () => {
    if (onSalvarRecadinhoTurma) {
      onSalvarRecadinhoTurma(textoRecadinhoTemp, 'Carinho & Elogio');
    }
    setEditandoRecadinho(false);
  };

  const handleDitarVozSimulacao = () => {
    setDitandoVoz(true);
    setTimeout(() => {
      setTextoRecadinhoTemp(prev => prev + " Hoje as crianças exploraram tintas atóxicas no papel de embrulho com muita alegria!");
      setDitandoVoz(false);
    }, 1500);
  };

  const turmasDisponiveis = [
    { id: 'Berçário I - A', faixa: '0-1 ano', professora: 'Ana Silva', totalAlunos: 5, capacidade: 5, icone: '🍼' },
    { id: 'Maternal I - A', faixa: '1-2 anos', professora: 'Cláudia Ramos', totalAlunos: 8, capacidade: 10, icone: '🧸' },
    { id: 'Maternal II - B', faixa: '2-3 anos', professora: 'Fernanda Souza', totalAlunos: 12, capacidade: 15, icone: '🎨' },
    { id: 'Jardim I - A', faixa: '3-4 anos', professora: 'Mariana Lima', totalAlunos: 15, capacidade: 15, icone: '✨' },
  ];

  const alunoAtual = alunos.find(a => a.id === alunoSelecionadoId) || alunos[0];
  const rotinaAtual = rotinas[alunoSelecionadoId] || {
    alunoId: alunoSelecionadoId,
    data: new Date().toISOString().split('T')[0],
    alimentacao: 'Boa',
    sono: 'Dormiu bem',
    tempoSono: '1h 30min',
    higiene: 'Troca de fralda OK',
    evacuacao: 'Normal',
    humor: 'Alegre',
    atividades: ['Pintura', 'Rodinha'],
    recadinhoEducadora: 'Teve um ótimo dia!'
  };

  const alunosFiltrados = alunos.filter(a =>
    a.nome.toLowerCase().includes(busca.toLowerCase()) ||
    a.responsaveis.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="space-y-6 relative pb-16">
      
      {/* 1. CARD DE INSTITUIÇÃO CREDENCIADA & PATROCINADORA (Image 1 Exact Layout) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md border border-slate-100 text-2xl">
            👼
          </div>
          <div>
            <span className="text-[10px] font-black text-indigo-600 tracking-widest uppercase block">
              INSTITUIÇÃO CREDENCIADA & PATROCINADORA
            </span>
            <h2 className="text-base font-black text-slate-900 leading-tight">
              Colegio Pequeno Anjo
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Onde a infância é registrada para sempre Transparência e segurança diária.
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right border-t sm:border-t-0 border-slate-100 pt-2 sm:pt-0">
          <span className="text-emerald-600 font-black text-xs block uppercase tracking-wider">
            PARCEIRO OFICIAL
          </span>
          <span className="text-slate-400 text-[11px] font-bold block">
            Selo de Qualidade Digital
          </span>
        </div>
      </div>

      {/* 2. CARD BUSCA DIRETA POR NOME (Image 1 Exact Layout) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
        <div className="bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full w-fit">
          BUSCA DIRETA POR NOME
        </div>
        <h3 className="text-lg font-black text-slate-900 tracking-tight">
          Busca Rápida de Alunos & Crianças
        </h3>
        <p className="text-xs text-slate-500 font-medium">
          Digite o nome de qualquer aluno, turma ou responsável para alternar o diário e boletim em 1 clique:
        </p>

        <div className="relative">
          <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 text-slate-400 shadow-xs focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100">
            <div className="flex items-center gap-3 flex-1">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Busca rápida: digite nome da criança, sala ou responsável..."
                className="bg-transparent border-none text-slate-800 text-xs sm:text-sm font-medium focus:outline-none w-full placeholder:text-slate-400"
              />
            </div>
            <button className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition shrink-0">
              <Mic className="w-4 h-4 text-indigo-600" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. CARD CENTRAL DE SALAS & PROFESSORAS (Image 1 Exact Layout) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Central de Salas & Professoras
              </h3>
              <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                AMBIENTE DE TESTES
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Mude de sala e professora com 1 clique. O painel se adaptará por completo para carregar as informações e diários da sala selecionada.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-2xl text-xs">
            <span className="text-slate-500 font-bold text-[11px]">PROFESSORA ATIVA:</span>
            <span className="font-extrabold text-slate-900">Ana Silva (Professora Titular)</span>
            <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md ml-1">
              {turmaAtual}
            </span>
          </div>
        </div>

        {/* CARDS DAS TURMAS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {turmasDisponiveis.map((turma) => {
            const selecionada = turmaAtual === turma.id;
            return (
              <div
                key={turma.id}
                onClick={() => onSelectTurma(turma.id)}
                className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                  selecionada
                    ? 'bg-indigo-50/70 border-2 border-indigo-600 shadow-md scale-[1.02]'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{turma.icone}</span>
                    <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {turma.faixa}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 leading-tight">
                      {turma.id}
                    </h4>
                    <p className="text-xs text-slate-500 font-semibold">{turma.professora}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-3 text-[11px]">
                  <span className="font-bold text-slate-700">{turma.totalAlunos} Alunos</span>
                  <span className="text-slate-400 font-bold">Cap: {turma.capacidade}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. SEÇÃO DO DIÁRIO DE AULA (LISTAGEM DE ALUNOS & FICHA) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LISTA DE ALUNOS NA TURMA */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Alunos ({alunosFiltrados.length})</h3>
              <span className="text-[11px] text-slate-500 font-medium">{turmaAtual}</span>
            </div>
            <span className="text-[10px] font-black bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full">
              Diário de Hoje
            </span>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {alunosFiltrados.map((aluno) => {
              const ativo = aluno.id === alunoSelecionadoId;
              return (
                <div
                  key={aluno.id}
                  onClick={() => setAlunoSelecionadoId(aluno.id)}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                    ativo
                      ? 'bg-rose-50/80 border-2 border-rose-300 shadow-sm'
                      : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs ${
                      ativo ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {aluno.nome.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900">{aluno.nome}</div>
                      <div className="text-[11px] text-slate-500 font-medium">{aluno.responsaveis}</div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onAtualizarPresenca) {
                        onAtualizarPresenca(aluno.id, !aluno.presente);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-black flex items-center gap-1 transition ${
                      aluno.presente
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{aluno.presente ? 'Presente' : 'Falta'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* DETALHES DO DIÁRIO DO ALUNO SELECIONADO */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">{alunoAtual?.nome}</h3>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                  Diário de Hoje
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Preencha a rotina diária do aluno</p>
            </div>

            <button
              onClick={() => setModalWhatsapp(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Gerar Relatório WhatsApp</span>
            </button>
          </div>

          {/* CAMPOS DE ROTINA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Utensils className="w-4 h-4 text-emerald-600" />
                <span>Alimentação</span>
              </label>
              <select
                value={rotinaAtual.alimentacao}
                onChange={(e) => onAtualizarRotina && onAtualizarRotina(alunoSelecionadoId, { alimentacao: e.target.value as any })}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <option value="Excelente">Excelente (Comeu tudo)</option>
                <option value="Boa">Boa (Aceitou bem)</option>
                <option value="Parcial">Parcial (Comeu metade)</option>
                <option value="Recusou">Recusou refeição</option>
              </select>
            </div>

            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Moon className="w-4 h-4 text-indigo-600" />
                <span>Sono da Tarde</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={rotinaAtual.sono}
                  onChange={(e) => onAtualizarRotina && onAtualizarRotina(alunoSelecionadoId, { sono: e.target.value as any })}
                  className="text-xs p-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="Dormiu bem">Dormiu bem</option>
                  <option value="Agitado">Agitado</option>
                  <option value="Não dormiu">Não dormiu</option>
                </select>
                <input
                  type="text"
                  value={rotinaAtual.tempoSono || '1h 30min'}
                  onChange={(e) => onAtualizarRotina && onAtualizarRotina(alunoSelecionadoId, { tempoSono: e.target.value })}
                  placeholder="Ex: 1h 30min"
                  className="text-xs p-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Smile className="w-4 h-4 text-amber-500" />
                <span>Humor / Disposição</span>
              </label>
              <select
                value={rotinaAtual.humor}
                onChange={(e) => onAtualizarRotina && onAtualizarRotina(alunoSelecionadoId, { humor: e.target.value as any })}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="Alegre">Alegre & Participativo</option>
                <option value="Calmo">Calmo & Tranquilo</option>
                <option value="Sensível">Sensível / Chamegoso</option>
                <option value="Choroso">Choroso no início</option>
              </select>
            </div>

            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-500" />
                <span>Higiene / Banho</span>
              </label>
              <select
                value={rotinaAtual.higiene}
                onChange={(e) => onAtualizarRotina && onAtualizarRotina(alunoSelecionadoId, { higiene: e.target.value as any })}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400"
              >
                <option value="Troca de fralda OK">Troca de fraldas OK</option>
                <option value="Banho realizado">Banho completo realizado</option>
                <option value="Sem trocas">Sem trocas</option>
              </select>
            </div>
          </div>

          {/* 1. SEÇÃO DE ATIVIDADES PEDAGÓGICAS DO DIA (ENVIADAS PELA ANJINHA AURA) */}
          <div className="p-5 bg-gradient-to-br from-indigo-50/80 via-teal-50/40 to-slate-50 border-2 border-indigo-200 rounded-3xl space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between border-b border-indigo-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-indigo-950 uppercase tracking-tight flex items-center gap-2">
                    <span>Atividades Pedagógicas Enviadas pela Anjinha Aura</span>
                    <span className="text-[10px] bg-amber-300 text-slate-900 font-extrabold px-2 py-0.5 rounded-full">
                      BNCC Ativa
                    </span>
                  </h4>
                  <p className="text-[11px] text-indigo-800 font-medium">Atividades e vivências realizadas pela turma durante o dia</p>
                </div>
              </div>

              <span className="text-[11px] font-extrabold text-indigo-700 bg-white px-3 py-1 rounded-full border border-indigo-200">
                ✨ Aura IA Recomendou
              </span>
            </div>

            {/* Tags de Atividades Selecionáveis */}
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                { label: '🎨 Pintura com Tintas Atóxicas (BNCC TS01)', selecionada: true },
                { label: '🎵 Rodinha de Cantigas & Musicalização', selecionada: true },
                { label: '🧸 Circuito Motor Baby Sensorial', selecionada: true },
                { label: '📖 Historinha Interativa da Anjinha Aura', selecionada: true },
                { label: '🌱 Horta da Infância & Texturas', selecionada: false },
                { label: '☀️ Brincadeira de Roda ao Ar Livre', selecionada: false }
              ].map((ativ, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    const atuais = rotinaAtual.atividades || [];
                    const novas = atuais.includes(ativ.label)
                      ? atuais.filter(a => a !== ativ.label)
                      : [...atuais, ativ.label];
                    if (onAtualizarRotina) onAtualizarRotina(alunoSelecionadoId, { atividades: novas });
                  }}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 ${
                    (rotinaAtual.atividades || ['🎨 Pintura com Tintas Atóxicas (BNCC TS01)', '🎵 Rodinha de Cantigas & Musicalização']).includes(ativ.label)
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Check className={`w-3.5 h-3.5 ${(rotinaAtual.atividades || []).includes(ativ.label) ? 'opacity-100' : 'opacity-30'}`} />
                  <span>{ativ.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. SEÇÃO DE FOTOS DO DIA DO ANJINHO */}
          <div className="p-5 bg-gradient-to-br from-rose-50/70 via-amber-50/40 to-slate-50 border-2 border-rose-200 rounded-3xl space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-rose-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-rose-500 text-white rounded-xl flex items-center justify-center font-bold">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-rose-950 uppercase tracking-tight flex items-center gap-2">
                    <span>Fotos & Registros Visuais dos Momentos de Hoje</span>
                    <span className="text-[10px] bg-rose-200 text-rose-900 font-extrabold px-2 py-0.5 rounded-full">
                      Visível para os Pais
                    </span>
                  </h4>
                  <p className="text-[11px] text-rose-800 font-medium">Fotos capturadas na sala enviadas diretamente para a família</p>
                </div>
              </div>

              <button
                onClick={() => {
                  const urlFoto = prompt('Insira o link da foto ou selecione uma imagem:', 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80');
                  if (urlFoto && onAtualizarRotina) {
                    const fotosAtuais = rotinaAtual.fotos || [
                      'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80',
                      'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=400&q=80'
                    ];
                    onAtualizarRotina(alunoSelecionadoId, { fotos: [...fotosAtuais, urlFoto] });
                  }
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Foto</span>
              </button>
            </div>

            {/* Galeria de Fotos */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(rotinaAtual.fotos || [
                'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80',
                'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=400&q=80'
              ]).map((fotoUrl, fIdx) => (
                <div key={fIdx} className="relative group rounded-2xl overflow-hidden border-2 border-white shadow-sm aspect-square bg-slate-100">
                  <img
                    src={fotoUrl}
                    alt={`Momento ${fIdx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                    <button
                      onClick={() => {
                        const fotosAtuais = rotinaAtual.fotos || [];
                        const novas = fotosAtuais.filter((_, i) => i !== fIdx);
                        if (onAtualizarRotina) onAtualizarRotina(alunoSelecionadoId, { fotos: novas });
                      }}
                      className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition"
                      title="Excluir foto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="absolute bottom-1.5 left-1.5 text-[9px] font-black bg-slate-900/80 text-white px-2 py-0.5 rounded-md">
                    Momento #{fIdx + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* RECADINHO DA EDUCADORA */}
          <div className="border-t-2 border-slate-200 pt-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center font-bold text-xs shadow-xs">
                  ❤️
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                    Final do Diário: Recadinho da Educadora
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">Este recado vai no final do relatório do dia impresso ou via WhatsApp</p>
                </div>
              </div>

              {!editandoRecadinho && (
                <button
                  onClick={() => {
                    setTextoRecadinhoTemp(recadinhoTurma.mensagem);
                    setEditandoRecadinho(true);
                  }}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Editar Recadinho</span>
                </button>
              )}
            </div>

            {/* 1. Observação Individual para este aluno especificamente */}
            <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-2">
              <label className="text-xs font-extrabold text-rose-950 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4 text-rose-600" />
                  <span>1. Observação Individual para {alunoAtual?.nome}</span>
                </span>
                <span className="text-[10px] bg-rose-200 text-rose-900 font-black px-2 py-0.5 rounded-full">
                  Exclusivo deste Aluno
                </span>
              </label>
              <textarea
                value={alunoAtual?.recadinhoIndividual || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (setAlunos) {
                    setAlunos(alunos.map(a => a.id === alunoAtual.id ? { ...a, recadinhoIndividual: val } : a));
                  }
                }}
                rows={2}
                placeholder={`Ex: ${alunoAtual?.nome} comeu toda a fruta no lanche e se divertiu na pintura com pincel!`}
                className="w-full text-xs p-3 bg-white border border-rose-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 font-medium text-slate-800"
              />
            </div>

            {/* 2. Recadinho Coletivo da Educadora no Final da Folha */}
            <div className="p-5 bg-gradient-to-br from-amber-50 via-rose-50/50 to-orange-50 border-2 border-rose-300 rounded-3xl space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-rose-600 text-white font-black rounded-lg text-xs flex items-center justify-center">
                    2
                  </span>
                  <div>
                    <h5 className="text-xs font-black text-rose-950">
                      Recadinho Geral da Educadora para a Turma ({turmaAtual})
                    </h5>
                    <span className="text-[10px] text-rose-700 font-semibold">
                      Enviado no rodapé de todas as agendas da turma
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={handleDitarVozSimulacao}
                    disabled={ditandoVoz}
                    className="px-2.5 py-1 bg-white text-slate-800 hover:bg-slate-100 font-bold text-[11px] rounded-lg border border-slate-300 transition flex items-center gap-1"
                  >
                    {ditandoVoz ? <MicOff className="w-3.5 h-3.5 text-rose-600 animate-pulse" /> : <Mic className="w-3.5 h-3.5 text-rose-600" />}
                    <span>{ditandoVoz ? 'Ouvindo...' : 'Ditar por Voz'}</span>
                  </button>
                </div>
              </div>

              {editandoRecadinho ? (
                <div className="space-y-3">
                  {/* Sugestões Rápidas */}
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[11px] font-bold text-slate-600 self-center">Modelos Rápidos:</span>
                    {sugestoesRapidas.map((sug, i) => (
                      <button
                        key={i}
                        onClick={() => setTextoRecadinhoTemp(sug.texto)}
                        className="text-[11px] font-semibold bg-white text-slate-800 border border-rose-200 px-2.5 py-1 rounded-lg hover:bg-rose-100 transition"
                      >
                        {sug.label}
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={textoRecadinhoTemp}
                    onChange={(e) => setTextoRecadinhoTemp(e.target.value)}
                    rows={4}
                    className="w-full text-xs p-3 bg-white border border-rose-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium leading-relaxed text-slate-800"
                    placeholder="Escreva aqui o recadinho da educadora para o final da folha..."
                  />

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-500 font-medium">Assinado por: <strong>{recadinhoTurma.educadoraNome}</strong></span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditandoRecadinho(false)}
                        className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 font-bold rounded-xl"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSalvarRecadinho}
                        className="px-4 py-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl shadow-xs"
                      >
                        Salvar Recadinho da Educadora
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="bg-white/90 p-4 rounded-2xl border border-rose-200 shadow-xs space-y-2">
                    <p className="text-xs text-slate-800 italic leading-relaxed font-medium">
                      "{recadinhoTurma.mensagem}"
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-rose-100 text-[11px]">
                      <span className="text-rose-700 font-bold">Categoria: {recadinhoTurma.categoria}</span>
                      <span className="text-slate-600 font-extrabold">— {recadinhoTurma.educadoraNome}</span>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => setEditandoRecadinho(true)}
                      className="text-xs font-extrabold text-rose-700 hover:underline flex items-center gap-1"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>Alterar mensagem do recadinho</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5. BOTÕES FLUTUANTES: INTERCORRÊNCIA URGENTE & OCORRÊNCIA DO DIA (IMAGE 1 EXACT) */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
        <button
          onClick={() => alert('Alerta de Intercorrência Urgente disparado para a Coordenação!')}
          className="bg-white hover:bg-rose-50 text-rose-700 font-extrabold px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 border border-rose-200 transition transform hover:scale-105 text-xs"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          <span>Intercorrência Urgente</span>
        </button>

        <button
          onClick={() => setModalOcorrencia(true)}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-5 py-3 rounded-full shadow-2xl flex items-center gap-2.5 border-2 border-amber-300 transition transform hover:scale-105"
        >
          <AlertTriangle className="w-5 h-5 text-slate-950 fill-amber-300" />
          <span className="text-xs uppercase tracking-wider">Ocorrência do Dia</span>
        </button>
      </div>

      {/* MODAL OCORRÊNCIA DO DIA */}
      {modalOcorrencia && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <span>Registrar Ocorrência do Dia</span>
              </h3>
              <button
                onClick={() => setModalOcorrencia(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Criança / Aluno:</label>
                <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold">
                  {alunos.map(a => (
                    <option key={a.id} value={a.id}>{a.nome} ({a.responsaveis})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Descrição da Ocorrência:</label>
                <textarea
                  rows={3}
                  placeholder="Ex: Ralou levemente o joelho no parquinho durante a recreação..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setModalOcorrencia(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  alert('Ocorrência salva e encaminhada para a coordenação!');
                  setModalOcorrencia(false);
                }}
                className="px-4 py-2 bg-amber-500 text-slate-950 text-xs font-black rounded-xl shadow-xs"
              >
                Salvar Ocorrência
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL WHATSAPP PREVIEW */}
      {modalWhatsapp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <span>Relatório Final de Hoje ({alunoAtual?.nome})</span>
              </h3>
              <button
                onClick={() => setModalWhatsapp(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <pre className="bg-slate-900 text-emerald-400 text-xs p-4 rounded-2xl whitespace-pre-wrap font-mono leading-relaxed border border-slate-800">
{`*DIÁRIO ESCOLAR — ANJINHO EDUCADOR* 👼
📅 *Data:* ${new Date().toLocaleDateString('pt-BR')}
👶 *Aluno(a):* ${alunoAtual?.nome}
🏫 *Turma:* ${turmaAtual}

🥣 *Alimentação:* ${rotinaAtual.alimentacao}
💤 *Sono:* ${rotinaAtual.sono} (${rotinaAtual.tempoSono || '1h 30min'})
🧼 *Higiene:* ${rotinaAtual.higiene}
😊 *Humor:* ${rotinaAtual.humor}

🌸 *RECADINHO DA EDUCADORA:*
"${recadinhoTurma.mensagem}"
${alunoAtual?.recadinhoIndividual ? `\n📝 *Observação Individual:*\n"${alunoAtual.recadinhoIndividual}"\n` : ''}
— *${recadinhoTurma.educadoraNome}*
Anjinho Educador ❤️`}
            </pre>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(alunoAtual?.nome || '');
                  alert('Relatório copiado para a área de transferência!');
                }}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
              >
                Copiar
              </button>
              <button
                onClick={() => setModalWhatsapp(false)}
                className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
