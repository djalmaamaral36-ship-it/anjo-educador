import React, { useState, useEffect } from 'react';
import {
  FileText,
  Bell,
  MessageSquare,
  Clock,
  CheckCircle2,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Send,
  User,
  Baby,
  Droplet,
  ExternalLink,
  Search,
} from 'lucide-react';
import { DiarioRotinaRecebido, AvisoMural } from '../../types';
import { getDiariosRecebidos, getMuralAvisos } from '../../services/muralDiariosService';

interface Props {
  currentStudentName: string;
  userRole?: 'professor' | 'familia';
}

export default function SecaoDiariosRecebidosEMural({
  currentStudentName,
  userRole = 'professor',
}: Props) {
  const [activeSubTab, setActiveSubTab] = useState<'diarios' | 'mural'>('diarios');
  const [diarios, setDiarios] = useState<DiarioRotinaRecebido[]>(() => getDiariosRecebidos());
  const [mural, setMural] = useState<AvisoMural[]>(() => getMuralAvisos());
  const [expandedDiarioId, setExpandedDiarioId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filtroTexto, setFiltroTexto] = useState('');

  // Sincroniza em tempo real com eventos do app e Firestore Nuvem
  useEffect(() => {
    const handleUpdate = () => {
      setDiarios(getDiariosRecebidos());
      setMural(getMuralAvisos());
    };

    window.addEventListener('anjo_diario_atualizado', handleUpdate);
    window.addEventListener('anjo_mural_atualizado', handleUpdate);
    window.addEventListener('anjo_diarios_sync_nuvem', handleUpdate);
    window.addEventListener('anjo_mural_sync_nuvem', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('anjo_diario_atualizado', handleUpdate);
      window.removeEventListener('anjo_mural_atualizado', handleUpdate);
      window.removeEventListener('anjo_diarios_sync_nuvem', handleUpdate);
      window.removeEventListener('anjo_mural_sync_nuvem', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const handleCopy = (id: string, texto: string) => {
    navigator.clipboard.writeText(texto);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const filteredDiarios = diarios.filter(
    (d) =>
      d.studentNome.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      d.data.includes(filtroTexto) ||
      d.professoraNome.toLowerCase().includes(filtroTexto.toLowerCase())
  );

  const filteredMural = mural.filter(
    (m) =>
      m.titulo.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      m.conteudo.toLowerCase().includes(filtroTexto.toLowerCase())
  );

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
      {/* CABEÇALHO DO MÓDULO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📬</span>
            <h3 className="text-lg sm:text-xl font-black text-slate-800">
              Diários de Rotina Recebidos & Mural de Avisos
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Espaço integrado onde os pais acompanham os relatórios diários de classe enviados ao final das aulas e os comunicados da escola.
          </p>
        </div>

        {/* SELETOR DE SUB-ABAS */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl self-start sm:self-auto">
          <button
            onClick={() => setActiveSubTab('diarios')}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'diarios'
                ? 'bg-white text-emerald-700 shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText size={14} />
            <span>Diários Recebidos ({diarios.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('mural')}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'mural'
                ? 'bg-white text-indigo-700 shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bell size={14} />
            <span>Mural de Avisos ({mural.length})</span>
          </button>
        </div>
      </div>

      {/* BARRA DE PESQUISA RÁPIDA */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={
              activeSubTab === 'diarios'
                ? 'Filtrar diários por aluno, data ou professora...'
                : 'Buscar no mural de avisos...'
            }
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl pl-9 pr-4 py-2 text-xs text-slate-800 outline-none focus:border-indigo-400 focus:bg-white transition"
          />
        </div>
      </div>

      {/* CONTEÚDO 1: DIÁRIOS DE ROTINA RECEBIDOS */}
      {activeSubTab === 'diarios' && (
        <div className="space-y-4">
          {filteredDiarios.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 text-slate-500 space-y-2">
              <FileText size={32} className="mx-auto text-slate-300" />
              <p className="font-bold text-xs">Nenhum diário de rotina encontrado.</p>
              <p className="text-[11px] text-slate-400">
                Os relatórios enviados via WhatsApp e encerramento de aula aparecerão aqui automaticamente.
              </p>
            </div>
          ) : (
            filteredDiarios.map((diario) => {
              const isExpanded = expandedDiarioId === diario.id;

              return (
                <div
                  key={diario.id}
                  className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 hover:border-emerald-200 bg-slate-50/50 hover:bg-emerald-50/20 transition space-y-3"
                >
                  {/* LINHA SUPERIOR DO DIÁRIO */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center flex-shrink-0 text-sm border border-emerald-200">
                        {diario.studentNome.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-sm text-slate-800">
                            {diario.studentNome}
                          </h4>
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-md">
                            {diario.turma}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                          <span>📅 {diario.data} às {diario.horarioEncerramento}</span>
                          <span>•</span>
                          <span>👩‍🏫 {diario.professoraNome}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        <span>Enviado via WhatsApp</span>
                      </span>

                      <button
                        onClick={() => setExpandedDiarioId(isExpanded ? null : diario.id)}
                        className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition flex items-center gap-1 cursor-pointer"
                      >
                        <span>{isExpanded ? 'Recolher' : 'Ver Detalhes'}</span>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* RESUMO EM GRADE COMPACTA */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                      <span className="text-[9px] font-black text-slate-400 uppercase block">
                        TEMPO EM SALA
                      </span>
                      <strong className="text-emerald-700 font-mono">{diario.tempoEmAula}</strong>
                    </div>

                    <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                      <span className="text-[9px] font-black text-slate-400 uppercase block">
                        ÁGUA & HIDRATAÇÃO
                      </span>
                      <strong className="text-sky-700">{diario.aguaMl}ml ingeridos</strong>
                    </div>

                    <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                      <span className="text-[9px] font-black text-slate-400 uppercase block">
                        ALIMENTAÇÃO
                      </span>
                      <strong className="text-amber-700 truncate block">
                        {diario.mamadeirasContador} mamadeiras
                      </strong>
                    </div>

                    <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                      <span className="text-[9px] font-black text-slate-400 uppercase block">
                        SONINHO & DESCANSO
                      </span>
                      <span className="text-indigo-700 font-bold truncate block" title={diario.soneca}>
                        {diario.soneca}
                      </span>
                    </div>
                  </div>

                  {/* DETALHES EXPANDIDOS COM TEXTO DO WHATSAPP */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-slate-200/80 space-y-3 animate-in fade-in duration-150">
                      <div className="p-3.5 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] leading-relaxed whitespace-pre-wrap border border-slate-800">
                        {diario.textoWhatsApp}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
                        <span className="text-[11px] text-slate-500">
                          Disparado para: <strong>{diario.destinatarioNome}</strong> ({diario.destinatarioTelefone})
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopy(diario.id, diario.textoWhatsApp)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer text-xs"
                          >
                            {copiedId === diario.id ? (
                              <>
                                <Check size={14} className="text-emerald-600" />
                                <span className="text-emerald-700 font-black">Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy size={14} />
                                <span>Copiar Relatório</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => {
                              const tel = diario.destinatarioTelefone.replace(/\D/g, '');
                              const num = tel.length >= 10 ? `55${tel}` : '5511988442211';
                              const url = `https://api.whatsapp.com/send?phone=${num}&text=${encodeURIComponent(
                                diario.textoWhatsApp
                              )}`;
                              window.open(url, '_blank');
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer text-xs"
                          >
                            <Send size={14} />
                            <span>Abrir no WhatsApp</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* CONTEÚDO 2: MURAL DE AVISOS */}
      {activeSubTab === 'mural' && (
        <div className="space-y-3.5">
          {filteredMural.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 text-slate-500 space-y-2">
              <Bell size={32} className="mx-auto text-slate-300" />
              <p className="font-bold text-xs">Nenhum aviso publicado no mural.</p>
            </div>
          ) : (
            filteredMural.map((aviso) => (
              <div
                key={aviso.id}
                className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 transition space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 flex-shrink-0" />
                    <h4 className="font-black text-xs sm:text-sm text-slate-800">
                      {aviso.titulo}
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full self-start sm:self-auto">
                    {aviso.data} • {aviso.turma}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {aviso.conteudo}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-50 text-[11px] text-slate-500">
                  <span className="font-semibold">
                    Publicado por: <strong className="text-slate-700">{aviso.autorNome}</strong>
                  </span>
                  <span className="text-slate-400">
                    Público: {aviso.destinatarios}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
