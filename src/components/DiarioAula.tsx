import React, { useState } from 'react';
import { Aluno, RotinaDia, RecadinhoTurma } from '../types';
import { CheckCircle2, XCircle, Moon, Utensils, Smile, HeartHandshake, MessageSquareHeart, Send, Share2, Sparkles, AlertCircle, Edit } from 'lucide-react';

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
      {/* Banner Informativo Direto sobre o Recadinho da Educadora */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-bold">
            <MessageSquareHeart className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">Como insere o recadinho da educadora no final?</h4>
            <p className="text-xs text-emerald-800">
              No final da página do diário fica o <strong>Recadinho Geral da Educadora</strong> e em cada aluno você pode adicionar a <strong>Observação Individual</strong>.
            </p>
          </div>
        </div>

        <button
          onClick={onAbrirGuia}
          className="text-xs font-bold px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl transition shadow-sm whitespace-nowrap"
        >
          Ver Passo a Passo Detalhado
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
                      ? 'bg-emerald-50 border-emerald-300 shadow-sm'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      ativo ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
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
              <p className="text-xs text-slate-500">Preencha a rotina e as observações pedagógicas</p>
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
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
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
                  className="text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
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
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400"
              >
                <option value="Troca de fralda OK">Troca de fraldas OK</option>
                <option value="Banho realizado">Banho completo realizado</option>
                <option value="Sem trocas">Sem alteração</option>
              </select>
            </div>
          </div>

          {/* SEÇÃO FINAL DE RECADINHOS */}
          <div className="border-t border-slate-200 pt-5 space-y-4">
            {/* 1. Recadinho Individual do Aluno */}
            <div className="p-4 bg-rose-50/60 border border-rose-200 rounded-xl space-y-2">
              <label className="text-xs font-bold text-rose-900 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Edit className="w-4 h-4 text-rose-600" />
                  <span>Recadinho Individual para {alunoAtual?.nome}</span>
                </span>
                <span className="text-[10px] text-rose-600 font-medium">Observação Exclusiva</span>
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
                placeholder={`Ex: ${alunoAtual?.nome} adorou cantar cantigas de roda e pediu para repetir!`}
                className="w-full text-xs p-2.5 bg-white border border-rose-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
            </div>

            {/* 2. Recadinho Geral da Educadora (Visualização no final da folha) */}
            <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <MessageSquareHeart className="w-4 h-4 text-amber-600" />
                  <span>Recadinho da Educadora no Final do Diário (Turma)</span>
                </span>
                <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  No final do relatório
                </span>
              </div>
              <p className="text-xs text-amber-900 italic bg-white/80 p-3 rounded-lg border border-amber-100">
                "{recadinhoTurma.mensagem}"
              </p>
              <p className="text-[11px] text-amber-700 text-right font-medium">
                — {recadinhoTurma.educadoraNome}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Preview WhatsApp */}
      {modalWhatsappAberto && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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
