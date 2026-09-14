import React, { useState, useEffect } from 'react';
import {
  FileText,
  Bell,
  CheckCircle2,
  Copy,
  Check,
  Search,
  Heart,
  Eye,
  Trash2,
  MessageCircle,
  X,
  ShieldCheck,
} from 'lucide-react';
import { DiarioRotinaRecebido, AvisoMural } from '../../types';
import { getDiariosRecebidos, getMuralAvisos, excluirDiarioRecebido } from '../../services/muralDiariosService';

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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [curtidasMap, setCurtidasMap] = useState<Record<string, number>>({});
  const [filtroTexto, setFiltroTexto] = useState('');
  const [modalDiario360, setModalDiario360] = useState<DiarioRotinaRecebido | null>(null);

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

  const getDiarioUrl = (diario: DiarioRotinaRecebido) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://anjo-educador.app';
    const slug = encodeURIComponent(diario.studentNome.replace(/\s+/g, '_').toLowerCase());
    return `${origin}/?relatorio=summary_id_${diario.id}_aluno_${slug}`;
  };

  const handleCopy = (id: string, texto: string) => {
    navigator.clipboard.writeText(texto);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCopyLink = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLinkId(id);
    setTimeout(() => setCopiedLinkId(null), 2500);
  };

  const handleCurtir = (id: string) => {
    setCurtidasMap((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
  };

  const handleExcluir = (id: string) => {
    if (window.confirm('Tem certeza que deseja remover este diário de rotina do histórico?')) {
      excluirDiarioRecebido(id);
      setDiarios((prev) => prev.filter((d) => d.id !== id));
      if (modalDiario360?.id === id) {
        setModalDiario360(null);
      }
    }
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
              const curtidas = curtidasMap[diario.id] || 0;
              const linkSeguroUrl = getDiarioUrl(diario);

              return (
                <div
                  key={diario.id}
                  className="p-4 sm:p-5 rounded-3xl border transition space-y-3.5 shadow-2xs hover:shadow-xs bg-emerald-50/40 border-emerald-200"
                >
                  {/* TOPO DO CARD */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/5 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm flex-shrink-0 shadow-2xs">
                        📋
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <strong className="text-xs sm:text-sm text-slate-900">
                            🎓 Diário de Aula Consolidado ({diario.horarioEncerramento})
                          </strong>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-emerald-100 text-emerald-900 border-emerald-200">
                            Diário Consolidado
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          De: <strong>{diario.professoraNome}</strong> • 📅 {diario.data} às {diario.horarioEncerramento}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs">
                      <button
                        type="button"
                        onClick={() => handleCurtir(diario.id)}
                        className="px-2.5 py-1 hover:bg-rose-50 text-rose-600 font-bold rounded-xl border bg-white border-slate-200 transition flex items-center gap-1 cursor-pointer text-xs shadow-2xs"
                        title="Confirmar leitura / curtir"
                      >
                        <Heart size={13} className="fill-rose-500 text-rose-500" />
                        <span>{curtidas}</span>
                      </button>
                    </div>
                  </div>

                  {/* CONTEÚDO DO DIÁRIO / BALÃO FORMATADO */}
                  <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 text-xs sm:text-[13px] text-slate-800 whitespace-pre-wrap leading-relaxed font-mono">
                    {diario.textoWhatsApp}
                  </div>

                  {/* BARRA DE LINK SEGURO & OPÇÕES (EXATAMENTE COMO NA IMAGEM 1) */}
                  <div className="p-3 bg-slate-100/90 rounded-2xl border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 overflow-hidden text-xs">
                      <span className="text-slate-700 font-bold flex items-center gap-1 flex-shrink-0">
                        🔗 Link Seguro do Diário Digital:
                      </span>
                      <a
                        href={linkSeguroUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 hover:underline font-mono text-[11px] truncate block max-w-xs sm:max-w-md"
                        title={linkSeguroUrl}
                      >
                        {linkSeguroUrl}
                      </a>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                      {/* Botão Abrir Diário Digital 360° */}
                      <button
                        type="button"
                        onClick={() => setModalDiario360(diario)}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl transition flex items-center gap-1.5 text-xs shadow-2xs cursor-pointer active:scale-95"
                      >
                        <Eye size={13} />
                        <span>Abrir Diário Digital 360°</span>
                      </button>

                      {/* Botão Copiar Link */}
                      <button
                        type="button"
                        onClick={() => handleCopyLink(diario.id, linkSeguroUrl)}
                        className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl border border-slate-200 transition flex items-center gap-1.5 text-xs shadow-2xs cursor-pointer"
                      >
                        {copiedLinkId === diario.id ? (
                          <>
                            <Check size={13} className="text-emerald-600" />
                            <span className="text-emerald-700 font-black">Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={13} />
                            <span>Copiar Link</span>
                          </>
                        )}
                      </button>

                      {/* Botão Excluir */}
                      <button
                        type="button"
                        onClick={() => handleExcluir(diario.id)}
                        className="px-2.5 py-1.5 bg-white hover:bg-rose-50 text-rose-600 font-bold rounded-xl border border-rose-200 transition flex items-center gap-1 text-xs shadow-2xs cursor-pointer"
                        title="Excluir do histórico"
                      >
                        <Trash2 size={13} />
                        <span>Excluir</span>
                      </button>
                    </div>
                  </div>

                  {/* RODAPÉ DO CARD COM AUDITORIA E COMPARTILHAR WHATSAPP */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs border-t border-slate-200/60">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                      <CheckCircle2 size={13} className="text-emerald-600" />
                      <span>Controle de auditoria de acessos</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          const tel = (diario.destinatarioTelefone || '').replace(/\D/g, '');
                          const num = tel.length >= 10 ? `55${tel}` : '5511988442211';
                          const url = `https://api.whatsapp.com/send?phone=${num}&text=${encodeURIComponent(
                            diario.textoWhatsApp
                          )}`;
                          window.open(url, '_blank');
                        }}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer text-xs shadow-2xs"
                      >
                        <MessageCircle size={13} />
                        <span>Compartilhar WhatsApp</span>
                      </button>

                      <span className="text-[11px] text-slate-500 font-medium">
                        Duração: <strong>Período Completo</strong>
                      </span>
                    </div>
                  </div>
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
                className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 transition space-y-2.5 shadow-2xs"
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

                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
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

      {/* MODAL 360° COMPLETO (EXATAMENTE COMO NA IMAGEM 2) */}
      {modalDiario360 && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            {/* CABEÇALHO DO MODAL */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-3 bg-slate-50/50">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black flex-shrink-0 shadow-xs">
                  <FileText size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-black text-slate-900 text-base sm:text-lg">
                      Diário de Rotina Escolar Digital 360°
                    </h3>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <ShieldCheck size={12} />
                      <span>LINK SEGURO VERIFICADO</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Profª {modalDiario360.professoraNome} (Educadora) • {modalDiario360.data} • Período: {modalDiario360.horarioEncerramento} às {modalDiario360.horarioEncerramento}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalDiario360(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                title="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            {/* CORPO DO MODAL */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
              {/* GRADE DE 3 MÉTRICAS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Auditoria e Conformidade */}
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-center">
                  <span className="text-[10px] font-black text-indigo-700 uppercase tracking-tight block">
                    AUDITORIA E CONFORMIDADE
                  </span>
                  <strong className="text-lg font-black text-indigo-900 block my-0.5">
                    100% OK
                  </strong>
                  <span className="text-[11px] text-slate-500">Rotinas Auditadas</span>
                </div>

                {/* 2. Qualidade de Registro */}
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-center">
                  <span className="text-[10px] font-black text-emerald-700 uppercase tracking-tight block">
                    QUALIDADE DE REGISTRO
                  </span>
                  <strong className="text-lg font-black text-emerald-900 block my-0.5">
                    100%
                  </strong>
                  <span className="text-[11px] text-slate-500">Carimbo Temporal</span>
                </div>

                {/* 3. Duração do Período */}
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-100 text-center">
                  <span className="text-[10px] font-black text-amber-700 uppercase tracking-tight block">
                    DURAÇÃO DO PERÍODO
                  </span>
                  <strong className="text-lg font-black text-amber-900 block my-0.5">
                    Período Completo
                  </strong>
                  <span className="text-[11px] text-slate-500">Registro Sincronizado</span>
                </div>
              </div>

              {/* CONTEÚDO DO BOLETIM */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                  <span>📝 CONTEÚDO DO DIÁRIO / BOLETIM TRANSMITIDO</span>
                </label>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-slate-800 font-mono text-xs leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto">
                  {modalDiario360.textoWhatsApp}
                </div>
              </div>
            </div>

            {/* RODAPÉ DO MODAL */}
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="overflow-hidden">
                <span className="text-[11px] font-bold text-slate-700 block">
                  🔗 Link Seguro para Compartilhamento Exclusivo:
                </span>
                <span className="text-[10px] text-slate-400 font-mono truncate block max-w-sm">
                  {getDiarioUrl(modalDiario360)}
                </span>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleCopyLink(modalDiario360.id, getDiarioUrl(modalDiario360))}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl transition flex items-center gap-1.5 text-xs shadow-xs cursor-pointer active:scale-95"
                >
                  {copiedLinkId === modalDiario360.id ? (
                    <>
                      <Check size={14} />
                      <span>Link Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copiar Link Direto</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
