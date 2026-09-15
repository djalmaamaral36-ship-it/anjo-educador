import React, { useState } from 'react';
import { Aluno, RotinaDia, RecadinhoTurma } from '../types';
import {
  CheckCircle2, XCircle, Moon, Utensils, Smile, HeartHandshake,
  MessageSquareHeart, Send, Sparkles, Edit, Mic, MicOff, RefreshCw, Wand2, Heart, HelpCircle
} from 'lucide-react';

interface DiarioAulaProps {
  turmaAtual: string;
  alunos: Aluno[];
  rotinas: Record<string, RotinaDia>;
  recadinhoTurma: RecadinhoTurma;
  setAlunos?: React.Dispatch<React.SetStateAction<Aluno[]>>;
  setRotinas?: React.Dispatch<React.SetStateAction<Record<string, RotinaDia>>>;
  onSalvarRecadinhoTurma?: (novaMensagem: string, categoria: RecadinhoTurma['categoria']) => void;
  onAtualizarPresenca?: (alunoId: string, presente: boolean) => void;
  onAtualizarRotina?: (alunoId: string, dadosNovos: Partial<RotinaDia>) => void;
  onAbrirGuia?: () => void;
}

export const DiarioAula: React.FC<DiarioAulaProps> = ({
  turmaAtual,
  alunos,
  setAlunos,
  rotinas,
  setRotinas,
  recadinhoTurma,
  onSalvarRecadinhoTurma,
  onAtualizarPresenca,
  onAtualizarRotina,
  onAbrirGuia
}) => {
  const [alunoSelecionadoId, setAlunoSelecionadoId] = useState<string>(alunos[0]?.id || '1');
  const [modalWhatsappAberto, setModalWhatsappAberto] = useState(false);

  // Estados para edição do Recadinho da Educadora
  const [editandoRecadinho, setEditandoRecadinho] = useState(false);
  const [textoRecadinhoTemp, setTextoRecadinhoTemp] = useState(recadinhoTurma.mensagem);
  const [categoriaTemp, setCategoriaTemp] = useState<RecadinhoTurma['categoria']>(recadinhoTurma.categoria || 'Carinho & Elogio');
  const [ditandoVoz, setDitandoVoz] = useState(false);

  const alunoAtual = alunos.find(a => a.id === alunoSelecionadoId) || alunos[0];
  const rotinaAtual = rotinas[alunoSelecionadoId] || {
    alunoId: alunoSelecionadoId,
    data: new Date().toISOString().split('T')[0],
    alimentacao: 'Boa',
    sono: 'Dormiu bem',
    tempoSono: '1h',
    higiene: 'Troca de fralda OK',
    evacuacao: 'Normal',
    humor: 'Alegre',
    atividades: ['Pintura', 'Rodinha'],
    recadinhoEducadora: 'Teve um dia muito produtivo e alegre!'
  };

  const togglePresenca = (id: string) => {
    if (onAtualizarPresenca) {
      onAtualizarPresenca(id, !(alunos.find(a => a.id === id)?.presente));
    } else if (setAlunos) {
      setAlunos(alunos.map(a => a.id === id ? { ...a, presente: !a.presente } : a));
    }
  };

  const updateRotina = (campo: keyof RotinaDia, valor: any) => {
    if (onAtualizarRotina) {
      onAtualizarRotina(alunoSelecionadoId, { [campo]: valor });
    } else if (setRotinas) {
      setRotinas({
        ...rotinas,
        [alunoSelecionadoId]: {
          ...rotinaAtual,
          [campo]: valor
        }
      });
    }
  };

  const handleSalvarRecadinho = () => {
    if (onSalvarRecadinhoTurma) {
      onSalvarRecadinhoTurma(textoRecadinhoTemp, categoriaTemp);
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

  const sugestoesRapidas = [
    { label: '🌸 Carinho & Afeto', texto: 'Olá famílias! Hoje nosso dia foi repleto de sorrisos e momentos afetivos na rodinha de histórias. Todos interagiram super bem! Com amor, equipe pedagógica.' },
    { label: '🎨 Projeto Sensorial', texto: 'Queridos pais! Realizamos uma oficina sensorial maravilhosa com massinhas caseiras. As crianças exploraram cores e texturas com muita curiosidade.' },
    { label: '☀️ Brincadeira no Parque', texto: 'Hoje o dia esteve ensolarado e aproveitamos o parque para circuitos motores ao ar livre. Todos retornaram radiantes para o lanche!' }
  ];

  const gerarTextoWhatsAppAluno = (aluno: Aluno) => {
    const rot = rotinas[aluno.id] || rotinaAtual;
    const recadinhoIndiv = aluno.recadinhoIndividual ? `\n\n📌 *Observação Individual:* ${aluno.recadinhoIndividual}` : '';

    return `*DIÁRIO ESCOLAR — ANJINHO EDUCADOR* 👼
📅 *Data:* ${new Date().toLocaleDateString('pt-BR')}
👶 *Aluno(a):* ${aluno.nome}
🏫 *Turma:* ${turmaAtual}

🥣 *Alimentação:* ${rot.alimentacao}
💤 *Sono:* ${rot.sono} (${rot.tempoSono || 'Normal'})
🧼 *Higiene:* ${rot.higiene}
💩 *Evacuação:* ${rot.evacuacao}
😊 *Humor do Dia:* ${rot.humor}
🎨 *Atividades:* ${rot.atividades?.join(', ') || 'Rotina pedagógica'}

🌸 *RECADINHO DA EDUCADORA:*
"${recadinhoTurma.mensagem}"${recadinhoIndiv}

— *${recadinhoTurma.educadoraNome}*
Anjinho Educador ❤️`;
  };

  return (
    <div className="space-y-6">
      {/* Banner Explicativo de Como Inserir o Recadinho */}
      <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white rounded-3xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-white/20 backdrop-blur-md text-white rounded-2xl flex items-center justify-center font-bold shrink-0">
            <Heart className="w-6 h-6 fill-white" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black bg-amber-300 text-slate-900 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Explicação do Recadinho
              </span>
              <span className="text-xs text-rose-100 font-semibold">Anjinho Educador</span>
            </div>
            <h3 className="text-base font-black">Como a Educadora Insere o Recadinho?</h3>
            <p className="text-xs text-rose-100 leading-relaxed max-w-2xl">
              No final da página fica o <strong>Recadinho Geral da Educadora</strong> (assinado e enviado para todos os pais da turma) e em cada aluno há o campo de <strong>Observação Individual</strong>. Você pode digitar, ditar por voz (🎙️) ou usar a Anjinha Aura (👼)!
            </p>
          </div>
        </div>

        <button
          onClick={onAbrirGuia}
          className="px-4 py-2.5 bg-white text-rose-700 hover:bg-rose-50 font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5 whitespace-nowrap"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Ver Passo a Passo Detalhado</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Lista de Alunos na Turma */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800">Alunos ({alunos.length})</h3>
            <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg">{turmaAtual}</span>
          </div>

          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {alunos.map((aluno) => {
              const ativo = aluno.id === alunoSelecionadoId;
              return (
                <div
                  key={aluno.id}
                  onClick={() => setAlunoSelecionadoId(aluno.id)}
                  className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                    ativo
                      ? 'bg-rose-50 border-rose-300 shadow-sm'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      ativo ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {aluno.nome.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">{aluno.nome}</div>
                      <div className="text-[11px] text-slate-500">{aluno.responsaveis}</div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePresenca(aluno.id);
                    }}
                    className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                      aluno.presente
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                    }`}
                  >
                    {aluno.presente ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    <span>{aluno.presente ? 'Presente' : 'Falta'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ficha Individual do Diário de Aula do Aluno */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-slate-800">{alunoAtual?.nome}</h3>
                <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-md font-semibold">
                  Diário de Hoje
                </span>
              </div>
              <p className="text-xs text-slate-500">Preencha a rotina diária do aluno</p>
            </div>

            <button
              onClick={() => setModalWhatsappAberto(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
            >
              <Send className="w-4 h-4" />
              <span>Gerar Relatório WhatsApp</span>
            </button>
          </div>

          {/* Opções de Rotina */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Alimentação */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Utensils className="w-4 h-4 text-emerald-600" />
                <span>Alimentação</span>
              </label>
              <select
                value={rotinaAtual.alimentacao}
                onChange={(e) => updateRotina('alimentacao', e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 font-medium"
              >
                <option value="Excelente">Excelente (Comeu tudo)</option>
                <option value="Boa">Boa (Aceitou bem)</option>
                <option value="Parcial">Parcial (Comeu metade)</option>
                <option value="Recusou">Recusou refeição</option>
              </select>
            </div>

            {/* Sono */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Moon className="w-4 h-4 text-indigo-600" />
                <span>Sono da Tarde</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={rotinaAtual.sono}
                  onChange={(e) => updateRotina('sono', e.target.value)}
                  className="text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium"
                >
                  <option value="Dormiu bem">Dormiu bem</option>
                  <option value="Agitado">Agitado</option>
                  <option value="Não dormiu">Não dormiu</option>
                </select>
                <input
                  type="text"
                  value={rotinaAtual.tempoSono || ''}
                  onChange={(e) => updateRotina('tempoSono', e.target.value)}
                  placeholder="Tempo (ex: 1h30)"
                  className="text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            </div>

            {/* Humor */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Smile className="w-4 h-4 text-amber-500" />
                <span>Humor / Disposição</span>
              </label>
              <select
                value={rotinaAtual.humor}
                onChange={(e) => updateRotina('humor', e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
              >
                <option value="Alegre">Alegre & Participativo</option>
                <option value="Calmo">Calmo & Tranquilo</option>
                <option value="Sensível">Sensível / Chamegoso</option>
                <option value="Choroso">Choroso no início</option>
              </select>
            </div>

            {/* Higiene */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4 text-sky-500" />
                <span>Higiene / Banho</span>
              </label>
              <select
                value={rotinaAtual.higiene}
                onChange={(e) => updateRotina('higiene', e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 font-medium"
              >
                <option value="Troca de fralda OK">Troca de fraldas OK</option>
                <option value="Banho realizado">Banho completo realizado</option>
                <option value="Sem trocas">Sem alteração</option>
              </select>
            </div>
          </div>

          {/* SEÇÃO FINAL DO DIÁRIO DE AULA: ONDE A EDUCADORA INSERE O RECADINHO */}
          <div className="border-t-2 border-slate-200 pt-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center font-bold text-xs shadow-sm">
                  ❤️
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                    Final do Diário: Recadinho da Educadora
                  </h4>
                  <p className="text-xs text-slate-500">Este recado vai impresso ou no WhatsApp no final do relatório do dia</p>
                </div>
              </div>

              {!editandoRecadinho && (
                <button
                  onClick={() => {
                    setTextoRecadinhoTemp(recadinhoTurma.mensagem);
                    setEditandoRecadinho(true);
                  }}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
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
                  <Edit className="w-4 h-4 text-rose-600" />
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
                className="w-full text-xs p-3 bg-white border border-rose-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
            </div>

            {/* 2. Recadinho Coletivo da Educadora no Final da Folha */}
            <div className="p-5 bg-gradient-to-br from-amber-50 via-rose-50/50 to-orange-50 border-2 border-rose-300 rounded-3xl space-y-4 shadow-sm">
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
                    className="w-full text-xs p-3 bg-white border border-rose-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium leading-relaxed"
                    placeholder="Escreva aqui o recadinho da educadora para o final da folha..."
                  />

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-500">Assinado por: <strong>{recadinhoTurma.educadoraNome}</strong></span>
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

      {/* Modal Preview WhatsApp */}
      {modalWhatsappAberto && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <span>Relatório Final do Diário (WhatsApp)</span>
              </h3>
              <button
                onClick={() => setModalWhatsappAberto(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Veja como o recadinho da educadora aparece bonitinho no final da mensagem enviada aos pais:
            </p>

            <pre className="bg-slate-900 text-slate-100 text-xs p-4 rounded-2xl whitespace-pre-wrap font-mono leading-relaxed overflow-y-auto max-h-72 border border-slate-800">
              {gerarTextoWhatsAppAluno(alunoAtual)}
            </pre>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(gerarTextoWhatsAppAluno(alunoAtual));
                  alert('Texto copiado com sucesso!');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Copiar Texto
              </button>
              <button
                onClick={() => setModalWhatsappAberto(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
