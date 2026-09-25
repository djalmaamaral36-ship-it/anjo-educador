import React, { useState } from 'react';
import { 
  Clock, 
  ShieldCheck, 
  HeartPulse, 
  Utensils, 
  Moon, 
  Sparkles, 
  Pill, 
  Music, 
  Baby, 
  Camera, 
  Plus, 
  Filter, 
  Check, 
  X,
  UserCheck
} from 'lucide-react';
import { TimelineEvent, StudentProfile } from '../types';

interface TimelineAuditSectionProps {
  student: StudentProfile;
  events: TimelineEvent[];
  onAddEvent: (event: Omit<TimelineEvent, 'id'>) => void;
  currentRole: string;
  isPaused: boolean;
  onBlockedAction: () => void;
}

export const TimelineAuditSection: React.FC<TimelineAuditSectionProps> = ({
  student,
  events,
  onAddEvent,
  currentRole,
  isPaused,
  onBlockedAction,
}) => {
  const [filter, setFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<TimelineEvent['category']>('atividade');
  const [newTime, setNewTime] = useState(
    new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  );
  const [newBadge, setNewBadge] = useState('Vivenciada com a Turma');

  const filteredEvents = events.filter(e => {
    if (filter === 'all') return true;
    return e.category === filter;
  });

  const getCategoryIcon = (category: TimelineEvent['category']) => {
    switch (category) {
      case 'alimentacao':
        return <Utensils className="w-4 h-4 text-amber-600" />;
      case 'saude':
        return <HeartPulse className="w-4 h-4 text-rose-600" />;
      case 'medicamento':
        return <Pill className="w-4 h-4 text-purple-600" />;
      case 'sono':
        return <Moon className="w-4 h-4 text-indigo-600" />;
      case 'higiene':
        return <Sparkles className="w-4 h-4 text-teal-600" />;
      case 'atividade':
        return <Music className="w-4 h-4 text-emerald-600" />;
      default:
        return <Baby className="w-4 h-4 text-blue-600" />;
    }
  };

  const getCategoryColorStyles = (color: TimelineEvent['badgeColor']) => {
    switch (color) {
      case 'emerald':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'amber':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'purple':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'teal':
        return 'bg-teal-50 text-teal-800 border-teal-200';
      case 'rose':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      default:
        return 'bg-indigo-50 text-indigo-800 border-indigo-200';
    }
  };

  const handleOpenAddModal = () => {
    if (isPaused) {
      onBlockedAction();
    }
    setNewTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    setIsAddModalOpen(true);
  };

  const handleSubmitNewEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    let badgeColor: TimelineEvent['badgeColor'] = 'indigo';
    if (newCategory === 'alimentacao') badgeColor = 'amber';
    else if (newCategory === 'saude') badgeColor = 'emerald';
    else if (newCategory === 'medicamento') badgeColor = 'purple';
    else if (newCategory === 'higiene') badgeColor = 'teal';
    else if (newCategory === 'atividade') badgeColor = 'indigo';

    onAddEvent({
      time: newTime,
      title: newTitle,
      description: newDescription || 'Registro auditado e inserido na rotina oficial da criança.',
      category: newCategory,
      registeredBy: `${student.teacherName} (${student.teacherRole})`,
      badge: newBadge || 'Registrado',
      badgeColor,
      icon: newCategory === 'alimentacao' ? 'utensils' : newCategory === 'medicamento' ? 'pill' : 'baby',
      verified: true,
    });

    setNewTitle('');
    setNewDescription('');
    setIsAddModalOpen(false);
  };

  return (
    <section 
      id="section-timeline" 
      className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0 shadow-xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                Linha do Tempo e Auditoria de Saúde & Atividades
              </h3>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-300">
                ✓ 100% Auditado
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Registro cronológico auditado em tempo real de todas as vivências, cuidados, saúde e alimentação de <strong>{student.name}</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {currentRole === 'professor' && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#5B46EB] hover:bg-[#4E39E0] text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Registrar na Linha do Tempo</span>
            </button>
          )}

          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-bold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>{events.length} Registros Hoje</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
          <Filter className="w-3 h-3" /> Filtrar:
        </span>
        {[
          { id: 'all', label: 'Todos os Registros' },
          { id: 'alimentacao', label: '🍼 Alimentação & Nutrição' },
          { id: 'saude', label: '🩺 Saúde & Aferições' },
          { id: 'medicamento', label: '💊 Medicamentos' },
          { id: 'atividade', label: '🎨 Atividades Vivenciadas' },
          { id: 'sono', label: '💤 Soneca & Descanso' },
          { id: 'higiene', label: '🧷 Fralda & Higiene' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setFilter(item.id)}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              filter === item.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-emerald-400 before:via-indigo-300 before:to-slate-300">
        {filteredEvents.map((evt) => (
          <div key={evt.id} className="relative group">
            <div className="absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full bg-white border-2 border-emerald-500 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
              <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
            </div>

            <div className="bg-slate-50/90 hover:bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-indigo-200 transition-all shadow-2xs hover:shadow-md space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                    {getCategoryIcon(evt.category)}
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-slate-900 leading-tight">
                      {evt.title}
                    </h4>
                    <span className="text-[11px] font-bold text-slate-500">
                      Horário verificado: <strong className="text-slate-800">{evt.time}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getCategoryColorStyles(evt.badgeColor)}`}>
                    {evt.badge}
                  </span>

                  {evt.verified && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Auditado</span>
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed bg-white/80 p-3 rounded-xl border border-slate-100">
                {evt.description}
              </p>

              {evt.photoUrl && (
                <div className="pt-1">
                  <div 
                    onClick={() => setSelectedPhoto(evt.photoUrl || null)}
                    className="inline-flex items-center gap-2 p-1.5 pr-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 text-xs font-bold cursor-pointer transition-all active:scale-98"
                  >
                    <img 
                      src={evt.photoUrl} 
                      alt="Registro fotográfico" 
                      className="w-10 h-10 rounded-lg object-cover border border-white shadow-2xs"
                    />
                    <div className="text-left">
                      <div className="flex items-center gap-1 text-[11px] font-black text-indigo-950">
                        <Camera className="w-3 h-3 text-indigo-600" />
                        <span>Ver Foto do Momento</span>
                      </div>
                      <span className="text-[9px] text-indigo-600 font-normal">Toque para ampliar</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Responsável pelo registro: <strong>{evt.registeredBy}</strong></span>
                </span>
                <span className="text-[10px] text-slate-400">
                  Transmissão segura aos pais
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                  <Plus className="w-4 h-4" />
                </div>
                <h4 className="text-base font-black text-slate-900">
                  Novo Registro na Linha do Tempo
                </h4>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewEvent} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Categoria:</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="atividade">🎨 Atividade Vivenciada</option>
                    <option value="alimentacao">🍼 Alimentação & Mamadeira</option>
                    <option value="saude">🩺 Saúde & Temperatura</option>
                    <option value="medicamento">💊 Medicamento Ministrado</option>
                    <option value="sono">💤 Soneca & Descanso</option>
                    <option value="higiene">🧷 Troca de Fralda</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Horário:</label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Título do Evento / Atividade:</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Pintura a Dedo com Cores Primárias / Troca de Fralda 2"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Selo / Status:</label>
                <input
                  type="text"
                  value={newBadge}
                  onChange={(e) => setNewBadge(e.target.value)}
                  placeholder="Ex: Vivenciada com a Turma / 180ml Consumidos / Afebril"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Observações & Descrição Pedagógica:</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Descreva a participação da criança, interação social ou detalhes do cuidado..."
                  rows={3}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md cursor-pointer"
                >
                  Confirmar e Salvar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedPhoto && (
        <div 
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm cursor-pointer"
        >
          <div className="relative max-w-lg w-full bg-white rounded-3xl overflow-hidden shadow-2xl p-2">
            <img 
              src={selectedPhoto} 
              alt="Ampliação do registro da atividade" 
              className="w-full h-80 object-cover rounded-2xl"
            />
            <div className="p-3 text-center">
              <span className="text-xs font-bold text-slate-700">
                Registro Fotográfico em Sala de Aula • Colégio Pequeno Anjo
              </span>
            </div>
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
