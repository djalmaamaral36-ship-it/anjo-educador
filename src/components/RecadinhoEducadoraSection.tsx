import React, { useState } from 'react';
import { MessageSquareHeart, Sparkles, Mic, Save, Send, Copy, Check, Heart, User, Info, Edit3, Volume2 } from 'lucide-react';
import { RecadinhoTurma, Aluno } from '../types';

interface RecadinhoEducadoraSectionProps {
  recadinhoTurma: RecadinhoTurma;
  setRecadinhoTurma: React.Dispatch<React.SetStateAction<RecadinhoTurma>>;
  alunos: Aluno[];
  onAtualizarAlunoRecadinho: (id: string, texto: string) => void;
}

export const RecadinhoEducadoraSection: React.FC<RecadinhoEducadoraSectionProps> = ({
  recadinhoTurma,
  setRecadinhoTurma,
  alunos,
  onAtualizarAlunoRecadinho
}) => {
  const [mensagem, setMensagem] = useState(recadinhoTurma.mensagem);
  const [educadoraNome, setEducadoraNome] = useState(recadinhoTurma.educadoraNome);
  const [categoria, setCategoria] = useState(recadinhoTurma.categoria);
  const [salvo, setSalvo] = useState(false);
  const [ouvindoVoz, setOuvindoVoz] = useState(false);
  const [copiadoIndex, setCopiadoIndex] = useState<string | null>(null);

  const modelosRapidos = [
    {
      titulo: '🌟 Dia Especial de Arte & Cores',
      texto: 'Olá papais e mamães! Hoje tivemos um dia muito especial repleto de exploração sensorial com tintas atóxicas e contação de histórias com fantoches. Todos os pequenos interagiram super bem e se divertiram bastante. Lembrem-se de enviar a troca de roupa reserva amanhã! Com carinho, Tia Ana.'
    },
    {
      titulo: '🧩 Desenvolvimento & Roda de Conversa',
      texto: 'Queridas famílias, hoje trabalhamos a coordenação motora fina com jogos de encaixe e música. Nossas crianças demonstraram muita autonomia e alegria durante as atividades. Um forte abraço!'
    },
    {
      titulo: '🎒 Lembrete de Higiene & Materiais',
      texto: 'Olá famílias! Gostaria de lembrar a todos de enviar novas fraldas e lencinhos umedecidos na mochila até amanhã. Muito obrigada pela parceria de sempre!'
    }
  ];

  const handleSalvarRecadinhoTurma = () => {
    setRecadinhoTurma({
      ...recadinhoTurma,
      mensagem,
      educadoraNome,
      categoria
    });
    setSalvo(true);
    setTimeout(() => setSalvo(false), 3000);
  };

  const handleSimularVoz = () => {
    setOuvindoVoz(true);
    setTimeout(() => {
      setMensagem((prev) => prev + ' Hoje as crianças demonstraram muito entusiasmo na atividade ao ar livre!');
      setOuvindoVoz(false);
    }, 1500);
  };

  const handleCopiarWhatsAppGeral = () => {
    const textoFormatado = `*DIÁRIO DE AULA — ${recadinhoTurma.turma}*\n📅 Data: ${new Date().toLocaleDateString('pt-BR')}\n\n*Recadinho da Educadora:* 🌸\n"${mensagem}"\n\n— *${educadoraNome}*`;
    navigator.clipboard.writeText(textoFormatado);
    setCopiadoIndex('geral');
    setTimeout(() => setCopiadoIndex(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Banner Explicativo de Como Inserir */}
      <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 opacity-15">
          <MessageSquareHeart className="w-48 h-48" />
        </div>
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold w-fit mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Como Funciona o Recadinho da Educadora</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">Inserindo o Recadinho no Diário de Aula</h2>
          <p className="mt-2 text-rose-50 text-sm leading-relaxed">
            O recadinho pode ser inserido de duas formas práticas no final do diário: <strong className="text-white">Recadinho Geral da Turma</strong> (mensagem carinhosa que vai para todas as famílias no fechamento do dia) e <strong className="text-white">Recadinho Individual</strong> (observações personalizadas para cada aluno).
          </p>
        </div>
      </div>

      {/* Editor do Recadinho Coletivo da Turma */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-100 text-rose-700 rounded-xl flex items-center justify-center">
              <MessageSquareHeart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">1. Recadinho da Educadora (Geral da Turma)</h3>
              <p className="text-xs text-slate-500">Esta mensagem aparece no final do Diário da Turma enviado aos pais.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopiarWhatsAppGeral}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl transition"
            >
              {copiadoIndex === 'geral' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copiadoIndex === 'geral' ? 'Copiado para Zap!' : 'Copiar p/ WhatsApp'}</span>
            </button>

            <button
              onClick={handleSalvarRecadinhoTurma}
              className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 bg-rose-600 text-white hover:bg-rose-700 rounded-xl shadow-sm transition"
            >
              <Save className="w-4 h-4" />
              <span>{salvo ? 'Salvo com Sucesso!' : 'Salvar Recadinho'}</span>
            </button>
          </div>
        </div>

        {/* Modelos Prontos para Inserção Rápida */}
        <div className="mb-4">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 block">
            Modelos Rápidos da Educadora (Clique para preencher):
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {modelosRapidos.map((modelo, idx) => (
              <button
                key={idx}
                onClick={() => setMensagem(modelo.texto)}
                className="text-left p-3 rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50/50 transition text-xs"
              >
                <div className="font-bold text-slate-800 mb-1">{modelo.titulo}</div>
                <div className="text-slate-500 line-clamp-2">{modelo.texto}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Campo Texto do Recadinho com Ditado por Voz */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Edit3 className="w-4 h-4 text-rose-500" />
              <span>Mensagem do Dia da Educadora</span>
            </label>
            <button
              onClick={handleSimularVoz}
              className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition ${
                ouvindoVoz ? 'bg-rose-100 text-rose-700 animate-pulse' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Mic className="w-3.5 h-3.5 text-rose-600" />
              <span>{ouvindoVoz ? 'Escutando voz...' : 'Ditar por Voz'}</span>
            </button>
          </div>

          <textarea
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            rows={4}
            className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white transition"
            placeholder="Digite aqui o recadinho carinhoso da educadora no final do diário..."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Nome da Educadora / Assinatura</label>
              <input
                type="text"
                value={educadoraNome}
                onChange={(e) => setEducadoraNome(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400"
                placeholder="Ex: Profª. Ana Cláudia"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Categoria do Recadinho</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as any)}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 cursor-pointer"
              >
                <option value="Carinho & Elogio">Carinho & Elogio</option>
                <option value="Pedagógico">Pedagógico</option>
                <option value="Aviso Importante">Aviso Importante</option>
                <option value="Lembrete de Material">Lembrete de Material</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Recadinhos Individuais dos Alunos */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">2. Recadinhos Individuais por Aluno</h3>
              <p className="text-xs text-slate-500">Adicione um recadinho específico para os pais de uma criança em particular.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alunos.map((aluno) => (
            <div key={aluno.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-500" />
                  {aluno.nome}
                </span>
                <span className="text-xs text-slate-500">{aluno.responsaveis}</span>
              </div>
              <input
                type="text"
                value={aluno.recadinhoIndividual || ''}
                onChange={(e) => onAtualizarAlunoRecadinho(aluno.id, e.target.value)}
                placeholder="Ex: Teve ótimo desempenho nas tarefas ou dormiu 1h30..."
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
