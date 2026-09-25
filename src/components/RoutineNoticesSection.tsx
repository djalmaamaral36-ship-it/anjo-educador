import React, { useState } from 'react';
import { 
  Bell, 
  MessageSquare, 
  Send, 
  Heart, 
  School, 
  CheckCircle2, 
  Pill,
  Inbox
} from 'lucide-react';
import { NoticeItem, StudentProfile } from '../types';

interface RoutineNoticesSectionProps {
  student: StudentProfile;
  notices: NoticeItem[];
  onAddNotice: (notice: Omit<NoticeItem, 'id'>) => void;
  currentRole: string;
}

export const RoutineNoticesSection: React.FC<RoutineNoticesSectionProps> = ({
  student,
  notices,
  onAddNotice,
  currentRole,
}) => {
  const [filter, setFilter] = useState<'all' | 'escola' | 'familia' | 'saude'>('all');
  const [newMessage, setNewMessage] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<'normal' | 'importante' | 'urgente'>('normal');
  const [toastSuccess, setToastSuccess] = useState(false);

  const filteredNotices = notices.filter(n => {
    if (filter === 'all') return true;
    return n.role === filter;
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const isTeacher = currentRole === 'professor';
    const authorName = isTeacher ? `${student.teacherName} (Professora Titular)` : student.responsible;
    const authorRole = isTeacher ? 'escola' : 'familia';
    const authorPhoto = isTeacher ? student.teacherPhoto : 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=faces&q=80';

    onAddNotice({
      title: newTitle.trim() || (isTeacher ? 'Comunicado da Professora' : 'Recado da Família'),
      content: newMessage.trim(),
      author: authorName,
      role: authorRole,
      authorPhoto,
      date: '24/09/2026',
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      priority: newPriority,
      isRead: true,
      tags: isTeacher ? ['Escola', 'Avisos'] : ['Família', 'Recados'],
    });

    setNewTitle('');
    setNewMessage('');
    setToastSuccess(true);
    setTimeout(() => setToastSuccess(false), 3000);
  };

  const getRoleBadge = (role: NoticeItem['role']) => {
    switch (role) {
      case 'escola':
        return {
          label: 'Comunicado Escolar',
          styles: 'bg-indigo-50 text-indigo-800 border-indigo-200',
          icon: <School className="w-3 h-3 text-indigo-600" />
        };
      case 'familia':
        return {
          label: 'Recado da Família',
          styles: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          icon: <Heart className="w-3 h-3 text-emerald-600" />
        };
      case 'saude':
        return {
          label: 'Alerta de Saúde & Cuidados',
          styles: 'bg-purple-50 text-purple-800 border-purple-200',
          icon: <Pill className="w-3 h-3 text-purple-600" />
        };
      default:
        return {
          label: 'Notificação',
          styles: 'bg-slate-50 text-slate-800 border-slate-200',
          icon: <Bell className="w-3 h-3 text-slate-600" />
        };
    }
  };

  return (
    <section 
      id="section-notices" 
      className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0 shadow-xs">
            <Inbox className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                Diários de Rotina Recebidos & Mural de Avisos
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black uppercase">
                {notices.length} Mensagens
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Canal oficial de comunicação direta entre a Família de <strong>{student.name}</strong> e a Equipe Pedagógica.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'familia', label: '👨‍👩‍👧 Recados da Família' },
            { id: 'escola', label: '🏫 Avisos da Escola' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                filter === f.id
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3.5">
          {filteredNotices.map((notice) => {
            const badgeInfo = getRoleBadge(notice.role);
            return (
              <div 
                key={notice.id}
                className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200 hover:border-amber-300 transition-all space-y-3 shadow-2xs hover:shadow-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {notice.authorPhoto ? (
                      <img 
                        src={notice.authorPhoto} 
                        alt={notice.author}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0" 
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 font-black shrink-0">
                        {notice.author.charAt(0)}
                      </div>
                    )}

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black border ${badgeInfo.styles}`}>
                          {badgeInfo.icon}
                          <span>{badgeInfo.label}</span>
                        </span>

                        {notice.priority === 'importante' && (
                          <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[10px] font-black border border-rose-200">
                            ⚠️ Importante
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-black text-slate-900 mt-1">
                        {notice.title}
                      </h4>
                    </div>
                  </div>

                  <div className="text-right text-[10px] text-slate-500 font-bold shrink-0">
                    <div>{notice.time}</div>
                    <div className="text-slate-400">{notice.date}</div>
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-100">
                  {notice.content}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Enviado por: <strong>{notice.author}</strong></span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Recebido & Sincronizado</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-gradient-to-br from-amber-50/70 to-indigo-50/40 p-5 rounded-2xl border border-amber-200/80 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-700" />
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                {currentRole === 'professor' ? 'Enviar Recado para a Família' : 'Enviar Recado para a Professora'}
              </h4>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Escreva orientações sobre sono, medicações, alimentação ou recados pedagógicos para hoje.
            </p>

            {toastSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Mensagem enviada e registrada no mural!</span>
              </div>
            )}

            <form onSubmit={handleSendMessage} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Título do Recado:</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Leve resfriado / Reposição de fraldas..."
                  className="w-full p-2 rounded-xl border border-amber-200 bg-white font-medium focus:ring-2 focus:ring-amber-400 outline-none text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Prioridade:</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as any)}
                  className="w-full p-2 rounded-xl border border-amber-200 bg-white font-bold text-xs outline-none"
                >
                  <option value="normal">🟢 Normal (Rotina regular)</option>
                  <option value="importante">🟡 Importante (Atenção no dia)</option>
                  <option value="urgente">🔴 Urgente (Saúde / Medicação)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mensagem:</label>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={4}
                  placeholder="Digite sua mensagem para a equipe ou família..."
                  className="w-full p-2.5 rounded-xl border border-amber-200 bg-white text-xs focus:ring-2 focus:ring-amber-400 outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar Recado Agora</span>
              </button>
            </form>
          </div>

          <div className="pt-2 border-t border-amber-200/60 text-[10px] text-slate-500 text-center">
            🔒 Notificações com protocolo de leitura em conformidade LGPD.
          </div>
        </div>
      </div>
    </section>
  );
};
