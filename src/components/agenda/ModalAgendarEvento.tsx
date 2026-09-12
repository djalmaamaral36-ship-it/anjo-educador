import React, { useState } from 'react';
import { 
  Calendar, X, Mic, Check, Users, MapPin, Clock, MessageSquare, 
  Sparkles, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { EventoEscolar, StudentPaxData } from '../../types';
import { salvarAvisoMural } from '../../services/muralDiariosService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentStudent: StudentPaxData;
  onAddEvento: (evento: EventoEscolar) => void;
}

export default function ModalAgendarEvento({
  isOpen,
  onClose,
  currentStudent,
  onAddEvento,
}: Props) {
  if (!isOpen) return null;

  // Form states
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState('Reunião de Pais / Conselho');
  const [professorResponsavel, setProfessorResponsavel] = useState('Professora Ana Silva');
  
  // Turmas selection
  const [selectedTurmas, setSelectedTurmas] = useState<string[]>(['bercario']); // 'bercario', 'maternal'
  
  const [local, setLocal] = useState('');
  const [data, setData] = useState('2026-06-05');
  const [horario, setHorario] = useState('10:00');
  const [observacoes, setObservacoes] = useState('');
  const [cadastrarEmMassa, setCadastrarEmMassa] = useState(true);
  const [publicarNoMural, setPublicarNoMural] = useState(true);
  const [notificarWhatsApp, setNotificarWhatsApp] = useState(true);
  
  // Voice dictation simulation/feedback
  const [listeningField, setListeningField] = useState<string | null>(null);

  const toggleTurma = (key: string) => {
    if (selectedTurmas.includes(key)) {
      if (selectedTurmas.length === 1) return; // manter ao menos 1
      setSelectedTurmas(selectedTurmas.filter((t) => t !== key));
    } else {
      setSelectedTurmas([...selectedTurmas, key]);
    }
  };

  const handleShortcutTodaEscola = () => {
    setSelectedTurmas(['bercario', 'maternal']);
  };

  const handleShortcutMaternal = () => {
    setSelectedTurmas(['maternal']);
  };

  const totalAlunos = 
    (selectedTurmas.includes('bercario') ? 5 : 0) + 
    (selectedTurmas.includes('maternal') ? 5 : 0);

  const getPublicoAlvoTexto = () => {
    if (selectedTurmas.includes('bercario') && selectedTurmas.includes('maternal')) {
      return 'Toda a Escola (Berçário I - A e Maternal I - A)';
    }
    if (selectedTurmas.includes('bercario')) return 'Berçário I - A';
    if (selectedTurmas.includes('maternal')) return 'Maternal I - A';
    return 'Alunos Selecionados';
  };

  const handleVoiceInput = (fieldName: string, currentVal: string, setter: (v: string) => void) => {
    // Check if SpeechRecognition is available in browser
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.interimResults = false;
      setListeningField(fieldName);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setter(currentVal ? `${currentVal} ${transcript}` : transcript);
        setListeningField(null);
      };
      recognition.onerror = () => {
        setListeningField(null);
      };
      recognition.onend = () => {
        setListeningField(null);
      };
      recognition.start();
    } else {
      // Fallback feedback
      setListeningField(fieldName);
      setTimeout(() => {
        setListeningField(null);
      }, 1500);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    const novoEvento: EventoEscolar = {
      id: `evt_${Date.now()}`,
      titulo: titulo.trim(),
      tipo,
      professorResponsavel: professorResponsavel.trim() || 'Equipe Pedagógica',
      turmas: selectedTurmas,
      publicoAlvoTexto: getPublicoAlvoTexto(),
      totalAlunosImpactados: totalAlunos,
      local: local.trim() || 'Pátio da Escolinha',
      data,
      horario,
      observacoes: observacoes.trim(),
      emMassa: cadastrarEmMassa,
      notificarWhatsApp,
      criadoEm: new Date().toISOString(),
      alunoId: currentStudent.id,
    };

    onAddEvento(novoEvento);

    const dataFormatada = data.split('-').reverse().join('/');

    // Se marcado para publicar no Mural de Avisos da Família
    if (publicarNoMural) {
      salvarAvisoMural({
        id: `mural_${Date.now()}`,
        titulo: `📅 Agenda: ${titulo.trim()}`,
        categoria: 'evento',
        turma: currentStudent.turma,
        autorNome: professorResponsavel.trim() || 'Equipe Pedagógica',
        data: new Date().toLocaleDateString('pt-BR'),
        conteudo: `Gostaríamos de convidá-los para o nosso próximo compromisso escolar:\n\n📌 *${novoEvento.titulo}*\n🏷️ *Tipo*: ${novoEvento.tipo}\n🗓️ *Data*: ${dataFormatada} às ${novoEvento.horario}\n📍 *Local*: ${novoEvento.local}\n👩‍🏫 *Responsável*: ${novoEvento.professorResponsavel}\n${novoEvento.observacoes ? `\n📝 *Avisos*: ${novoEvento.observacoes}` : ''}`,
        tags: ['Agenda', tipo],
        destinatarios: getPublicoAlvoTexto(),
        criadoEm: `${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
      });
    }

    // Se marcado para notificar via WhatsApp, abre ou prepara link
    if (notificarWhatsApp) {
      const msg = encodeURIComponent(
        `📅 *COMUNICADO DA ESCOLINHA — ANJO CUIDADOR*\n\n` +
        `Olá, família de *${currentStudent.nome}*!\n` +
        `Gostaríamos de convidá-los para o nosso próximo compromisso escolar:\n\n` +
        `📌 *${novoEvento.titulo}*\n` +
        `🏷️ *Tipo*: ${novoEvento.tipo}\n` +
        `🗓️ *Data*: ${dataFormatada} às ${novoEvento.horario}\n` +
        `📍 *Local*: ${novoEvento.local}\n` +
        `👩‍🏫 *Responsável*: ${novoEvento.professorResponsavel}\n` +
        (novoEvento.observacoes ? `\n📝 *Avisos*: ${novoEvento.observacoes}\n` : '') +
        `\nContamos com a sua presença e parceria de sempre!`
      );
      window.open(`https://api.whatsapp.com/send?phone=5511955554440&text=${msg}`, '_blank');
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[94vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CABEÇALHO DO MODAL (Foto 15) */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Calendar size={20} />
            </div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">
              Agendar Reunião ou Evento Escolar
            </h3>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* CORPO COM FORMULÁRIO (Fotos 15 e 16) */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-slate-800">
          
          {/* TÍTULO DO EVENTO */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-black uppercase text-slate-700">
                Título do Evento ou Reunião *
              </label>
              <button
                type="button"
                onClick={() => handleVoiceInput('titulo', titulo, setTitulo)}
                className={`text-slate-400 hover:text-indigo-600 transition p-1 rounded-md ${
                  listeningField === 'titulo' ? 'text-rose-500 animate-pulse bg-rose-50' : ''
                }`}
                title="Ditado por voz"
              >
                <Mic size={15} />
              </button>
            </div>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Reunião de Pais Trimestral, Festa da Primavera, Passeio Pe..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs sm:text-sm font-medium text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition placeholder:text-slate-400"
              required
            />
          </div>

          {/* TIPO & PROFESSOR */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-black uppercase text-slate-700 block mb-1.5">
                Tipo do Evento *
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs sm:text-sm font-medium text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition"
              >
                <option value="Reunião de Pais / Conselho">Reunião de Pais / Conselho</option>
                <option value="Festa / Comemoração">Festa / Comemoração</option>
                <option value="Passeio Pedagógico">Passeio Pedagógico</option>
                <option value="Avaliação Lúdica / Portfólio">Avaliação Lúdica / Portfólio</option>
                <option value="Oficina Sensorial Pais & Bebês">Oficina Sensorial Pais & Bebês</option>
                <option value="Aviso Importante / Comunicado">Aviso Importante / Comunicado</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black uppercase text-slate-700">
                  Professor / Orientador Responsável *
                </label>
                <button
                  type="button"
                  onClick={() => handleVoiceInput('prof', professorResponsavel, setProfessorResponsavel)}
                  className={`text-slate-400 hover:text-indigo-600 transition p-1 rounded-md ${
                    listeningField === 'prof' ? 'text-rose-500 animate-pulse bg-rose-50' : ''
                  }`}
                  title="Ditado por voz"
                >
                  <Mic size={15} />
                </button>
              </div>
              <input
                type="text"
                value={professorResponsavel}
                onChange={(e) => setProfessorResponsavel(e.target.value)}
                placeholder="Ex: Coordenadora Ana Cláudia"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs sm:text-sm font-medium text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition placeholder:text-slate-400"
                required
              />
            </div>
          </div>

          {/* TURMA / PÚBLICO-ALVO DO EVENTO */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase text-slate-700">
                Turma / Público-Alvo do Evento *
              </label>
              <Mic size={15} className="text-slate-400" />
            </div>
            
            <input
              type="text"
              readOnly
              value={getPublicoAlvoTexto()}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold text-slate-800 outline-none"
            />

            {/* ATALHOS DE GRUPOS E CATEGORIAS (Foto 15) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span className="font-bold flex items-center gap-1">
                  <Users size={12} className="text-indigo-600" />
                  Atalhos de Grupos e Categorias:
                </span>
                <span>Clique na categoria para marcar/desmarcar o grupo todo</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleShortcutTodaEscola}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Toda a Escola</span>
                  <span className="bg-indigo-100 text-indigo-700 text-[10px] px-1.5 py-0.5 rounded-md">
                    10 alunos
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleShortcutMaternal}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Todo o Maternal</span>
                  <span className="bg-indigo-100 text-indigo-700 text-[10px] px-1.5 py-0.5 rounded-md">
                    5 alunos
                  </span>
                </button>
              </div>
            </div>

            {/* SELETOR DE SALAS DE AULA (Foto 15) */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs text-slate-600 font-bold">
                <span>Salas de Aula (Selecione uma ou mais turmas):</span>
                <span className="text-[11px] text-slate-400">
                  {selectedTurmas.length} turma(s) {totalAlunos} alunos
                </span>
              </div>

              <div className="flex flex-wrap gap-2.5">
                {/* Turma Berçário I - A */}
                <button
                  type="button"
                  onClick={() => toggleTurma('bercario')}
                  className={`px-4 py-2.5 rounded-2xl border text-xs font-black transition flex items-center gap-2 cursor-pointer ${
                    selectedTurmas.includes('bercario')
                      ? 'bg-indigo-600 border-indigo-700 text-white shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {selectedTurmas.includes('bercario') && <Check size={14} />}
                  <span>Berçário I - A</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    selectedTurmas.includes('bercario') ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    5
                  </span>
                </button>

                {/* Turma Maternal I - A */}
                <button
                  type="button"
                  onClick={() => toggleTurma('maternal')}
                  className={`px-4 py-2.5 rounded-2xl border text-xs font-black transition flex items-center gap-2 cursor-pointer ${
                    selectedTurmas.includes('maternal')
                      ? 'bg-indigo-600 border-indigo-700 text-white shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {selectedTurmas.includes('maternal') ? <Check size={14} /> : <span>🐻</span>}
                  <span>Maternal I - A</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    selectedTurmas.includes('maternal') ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    5
                  </span>
                </button>
              </div>
            </div>

            {/* PÚBLICO-ALVO SELECIONADO BANNER (Foto 15) */}
            <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-3 flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <Users size={14} className="text-indigo-600" />
                Público Alvo Selecionado: {getPublicoAlvoTexto()}
              </span>
              <span className="text-[11px] font-black bg-indigo-600 text-white px-2.5 py-0.5 rounded-full">
                {totalAlunos} alunos
              </span>
            </div>
          </div>

          {/* LOCAL & DATA (Foto 16) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black uppercase text-slate-700">
                  Local na Escolinha *
                </label>
                <button
                  type="button"
                  onClick={() => handleVoiceInput('local', local, setLocal)}
                  className={`text-slate-400 hover:text-indigo-600 transition p-1 rounded-md ${
                    listeningField === 'local' ? 'text-rose-500 animate-pulse bg-rose-50' : ''
                  }`}
                  title="Ditado por voz"
                >
                  <Mic size={15} />
                </button>
              </div>
              <input
                type="text"
                value={local}
                onChange={(e) => setLocal(e.target.value)}
                placeholder="Ex: Pátio do Berçário, Sala Titular"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs sm:text-sm font-medium text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition placeholder:text-slate-400"
                required
              />
            </div>

            <div>
              <label className="text-xs font-black uppercase text-slate-700 block mb-1.5">
                Data *
              </label>
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition"
                required
              />
            </div>
          </div>

          {/* HORÁRIO PREVISTO (Foto 16) */}
          <div>
            <label className="text-xs font-black uppercase text-slate-700 block mb-1.5">
              Horário Previsto *
            </label>
            <input
              type="time"
              value={horario}
              onChange={(e) => setHorario(e.target.value)}
              className="w-full sm:w-1/2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition"
              required
            />
          </div>

          {/* OBSERVAÇÕES E AVISOS AOS PAIS (Foto 16) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-black uppercase text-slate-700">
                Observações e Avisos aos Pais
              </label>
              <button
                type="button"
                onClick={() => handleVoiceInput('obs', observacoes, setObservacoes)}
                className={`text-slate-400 hover:text-indigo-600 transition p-1 rounded-md ${
                  listeningField === 'obs' ? 'text-rose-500 animate-pulse bg-rose-50' : ''
                }`}
                title="Ditado por voz"
              >
                <Mic size={15} />
              </button>
            </div>
            <textarea
              rows={3}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: Trazer autorização preenchida e assinada pela coordenação, lanche saudável para compartilhar..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs sm:text-sm font-medium text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition placeholder:text-slate-400"
            />
          </div>

          {/* CHECKBOX 1: CADASTRO EM MASSA (Foto 16) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-start gap-3">
            <input
              type="checkbox"
              id="chkMassa"
              checked={cadastrarEmMassa}
              onChange={(e) => setCadastrarEmMassa(e.target.checked)}
              className="w-5 h-5 rounded-md accent-indigo-600 cursor-pointer mt-0.5"
            />
            <label htmlFor="chkMassa" className="text-xs cursor-pointer">
              <span className="font-black text-slate-800 block">
                Cadastrar evento em massa para as turmas selecionadas ({totalAlunos} alunos)
              </span>
              <span className="text-slate-500 mt-0.5 block">
                Ative isto para cadastrar este evento na agenda de todos os alunos das turmas marcadas acima ({getPublicoAlvoTexto()}).
              </span>
            </label>
          </div>

          {/* CHECKBOX 2: PUBLICAR NO MURAL DE AVISOS */}
          <div className="flex items-center gap-3 px-1">
            <input
              type="checkbox"
              id="chkMural"
              checked={publicarNoMural}
              onChange={(e) => setPublicarNoMural(e.target.checked)}
              className="w-5 h-5 rounded-md accent-indigo-600 cursor-pointer"
            />
            <label htmlFor="chkMural" className="text-xs font-bold text-slate-700 cursor-pointer">
              Publicar este compromisso automaticamente no Mural de Avisos geral.
            </label>
          </div>

          {/* CHECKBOX 3: NOTIFICAR WHATSAPP (Foto 16) */}
          <div className="flex items-center gap-3 px-1">
            <input
              type="checkbox"
              id="chkWpp"
              checked={notificarWhatsApp}
              onChange={(e) => setNotificarWhatsApp(e.target.checked)}
              className="w-5 h-5 rounded-md accent-indigo-600 cursor-pointer"
            />
            <label htmlFor="chkWpp" className="text-xs font-bold text-slate-700 cursor-pointer">
              Disparar notificação e modelo do evento via WhatsApp dos pais ou responsáveis.
            </label>
          </div>

          {/* RODAPÉ DO FORMULÁRIO (Foto 16) */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-black rounded-2xl transition cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-xs font-black rounded-2xl transition shadow-md cursor-pointer"
            >
              Adicionar Evento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
