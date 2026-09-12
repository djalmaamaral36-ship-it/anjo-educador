import React, { useState } from 'react';
import { 
  Calendar, Plus, Users, MapPin, Clock, Trash2, 
  MessageSquare, CheckCircle2, Sparkles, AlertCircle, Info 
} from 'lucide-react';
import { EventoEscolar, StudentPaxData } from '../../types';
import ModalAgendarEvento from './ModalAgendarEvento';

interface Props {
  currentStudent: StudentPaxData;
  userRole?: 'professor' | 'familia';
}

export default function AgendaEscolar({ currentStudent, userRole = 'professor' }: Props) {
  const isProfessor = userRole === 'professor';

  // Eventos na agenda
  const [eventos, setEventos] = useState<EventoEscolar[]>([
    {
      id: 'evt_sample_1',
      titulo: 'Reunião de Pais Trimestral & Avaliação Lúdica',
      tipo: 'Reunião de Pais / Conselho',
      professorResponsavel: 'Professora Ana Silva & Coordenação',
      turmas: ['bercario'],
      publicoAlvoTexto: 'Berçário I - A (5 alunos)',
      totalAlunosImpactados: 5,
      local: 'Sala Multiuso & Pátio Coberto',
      data: '2026-06-05',
      horario: '10:00',
      observacoes: 'Apresentação do portfólio de memórias e conquistas motoras do 1º semestre. Teremos café afetivo e acolhimento.',
      emMassa: true,
      notificarWhatsApp: true,
      criadoEm: '2026-05-20T10:00:00Z',
      alunoId: currentStudent.id,
    },
    {
      id: 'evt_sample_2',
      titulo: 'Festa da Primavera & Vivência com a Natureza',
      tipo: 'Festa / Comemoração',
      professorResponsavel: 'Equipe Pedagógica Anjo Cuidador',
      turmas: ['bercario', 'maternal'],
      publicoAlvoTexto: 'Toda a Escola (10 alunos)',
      totalAlunosImpactados: 10,
      local: 'Pátio Descoberto e Jardim Sensorial',
      data: '2026-09-22',
      horario: '14:30',
      observacoes: 'Vestir os pequenos com roupinhas floridas ou em tons pastéis. Plantio da árvore coletiva com as famílias.',
      emMassa: true,
      notificarWhatsApp: true,
      criadoEm: '2026-06-01T14:30:00Z',
      alunoId: currentStudent.id,
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleAddEvento = (novo: EventoEscolar) => {
    setEventos([novo, ...eventos]);
    setFeedback(`Evento "${novo.titulo}" cadastrado com sucesso na agenda!`);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleExcluirEvento = (id: string, titulo: string) => {
    if (!window.confirm(`Deseja realmente remover o evento "${titulo}" da agenda escolar?`)) return;
    setEventos(eventos.filter((e) => e.id !== id));
    setFeedback(`Evento removido da agenda.`);
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* 1. TÍTULO E CABEÇALHO DA ABA AGENDA (Foto 14) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Calendar size={18} />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              Eventos, Reuniões e Avisos Escolares
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Planeje reuniões de pais, conselhos, eventos comemorativos, passeios pedagógicos e avaliações lúdicas.
          </p>
        </div>

        {isProfessor && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-black text-xs sm:text-sm rounded-2xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer flex-shrink-0"
          >
            <Plus size={18} />
            <span>Agendar Reunião ou Evento</span>
          </button>
        )}
      </div>

      {/* 2. CARD DE MAPEAMENTO E COMUNICADOS POR CLASSE (Foto 14) */}
      <div className="bg-indigo-50/70 border border-indigo-100/90 rounded-2xl p-5 sm:p-6 space-y-2">
        <h3 className="text-sm sm:text-base font-black text-indigo-900">
          Mapeamento e Comunicados por Classe da Escolinha
        </h3>
        <p className="text-xs sm:text-sm text-indigo-900/80 leading-relaxed">
          Como professora ou coordenadora, você não precisa cadastrar uma reunião aluno por aluno! Ao criar um compromisso ou aviso na agenda, marque a opção para <strong>Replicar para a classe toda de uma vez</strong>. O comunicado será publicado instantaneamente nas carteiras da turma. Você também pode apagar em massa diretamente da lixeira ao lado.
        </p>
      </div>

      {/* FEEDBACK DE AÇÃO */}
      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-500 text-white font-black text-xs flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle2 size={16} />
          <span>{feedback}</span>
        </div>
      )}

      {/* 3. LISTAGEM OU ESTADO VAZIO (Foto 14) */}
      {eventos.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 sm:p-14 border border-slate-200 text-center shadow-xs space-y-3">
          <p className="text-sm font-medium text-slate-500">
            Nenhum evento ou compromisso escolar cadastrado para o(a) aluno(a) {currentStudent.nome}.
          </p>
          {isProfessor ? (
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-xs font-black text-indigo-600 hover:text-indigo-800 underline cursor-pointer inline-block"
            >
              Agendar o primeiro evento da escolinha
            </button>
          ) : (
            <span className="text-xs text-slate-400 block">
              Novos avisos da coordenação serão exibidos aqui assim que agendados.
            </span>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* BANNER DE ATENÇÃO DA FAMÍLIA (AURA ANJO CUIDADOR) */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-4 flex items-start gap-3.5 shadow-2xs">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 text-lg shadow-sm">
              🔔
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black text-amber-950 flex items-center gap-1.5">
                Compromissos Familiares Relevantes
                <span className="text-[9px] uppercase font-black bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full animate-pulse">
                  Presença Importante
                </span>
              </h4>
              <p className="text-xs text-amber-900/80 leading-relaxed">
                Olá, família! Há novos compromissos e reuniões importantes marcados na agenda de <strong>{currentStudent.nome}</strong>. Por favor, verifique as datas abaixo para planejar sua presença e apoiar a jornada de desenvolvimento do seu pequeno com carinho.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1 pt-2">
            <span>Compromissos Agendados ({eventos.length})</span>
            <span>Aluno em Exibição: {currentStudent.nome}</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {eventos.map((evt, idx) => {
              const dataFormatada = evt.data.split('-').reverse().join('/');
              const isRecent = idx === 0 || evt.id.startsWith('evt_'); // newly added or first in list

              return (
                <div
                  key={evt.id}
                  className={`rounded-3xl p-5 sm:p-6 border transition space-y-4 ${
                    isRecent 
                      ? 'bg-amber-50/50 border-amber-300 ring-2 ring-amber-400/10 shadow-xs' 
                      : 'bg-white border-slate-200 shadow-xs hover:border-indigo-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-black uppercase bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                          {evt.tipo}
                        </span>
                        {isRecent && (
                          <span className="text-[10px] font-black uppercase bg-amber-500 text-white px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                            <Sparkles size={11} className="fill-white" />
                            <span>Novo Compromisso!</span>
                          </span>
                        )}
                        {evt.emMassa && (
                          <span className="text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <Users size={11} />
                            <span>Classe Toda ({evt.totalAlunosImpactados} alunos)</span>
                          </span>
                        )}
                        {evt.notificarWhatsApp && (
                          <span className="text-[10px] font-black uppercase bg-emerald-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                            <MessageSquare size={10} />
                            <span>WhatsApp</span>
                          </span>
                        )}
                      </div>

                      <h3 className="text-base sm:text-lg font-black text-slate-800">
                        {evt.titulo}
                      </h3>
                    </div>

                    {isProfessor && (
                      <button
                        onClick={() => handleExcluirEvento(evt.id, evt.titulo)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer flex-shrink-0"
                        title="Apagar compromisso da agenda"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  {/* DETALHES DE DATA, HORA, LOCAL E PROFESSOR */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-2xl text-xs text-slate-700 border border-slate-100">
                    <div className="flex items-center gap-2">
                      <Clock size={15} className="text-indigo-600 flex-shrink-0" />
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Data & Horário</span>
                        <span className="font-bold text-slate-800">{dataFormatada} às {evt.horario}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin size={15} className="text-indigo-600 flex-shrink-0" />
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Local</span>
                        <span className="font-bold text-slate-800">{evt.local}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users size={15} className="text-indigo-600 flex-shrink-0" />
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Responsável</span>
                        <span className="font-bold text-slate-800">{evt.professorResponsavel}</span>
                      </div>
                    </div>
                  </div>

                  {/* OBSERVAÇÕES / AVISOS */}
                  {evt.observacoes && (
                    <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-xl text-xs text-amber-950">
                      <span className="text-[10px] font-black uppercase text-amber-700 block mb-0.5">
                        Avisos e Recomendações às Famílias:
                      </span>
                      <p className="font-medium">{evt.observacoes}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL DE AGENDAMENTO (Fotos 15 e 16) */}
      <ModalAgendarEvento
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentStudent={currentStudent}
        onAddEvento={handleAddEvento}
      />
    </div>
  );
}
