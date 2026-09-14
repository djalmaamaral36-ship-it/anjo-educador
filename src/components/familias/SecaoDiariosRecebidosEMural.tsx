import React, { useState, useEffect } from 'react';
import {
  FileText,
  Bell,
  CheckCircle2,
  Copy,
  Check,
  Phone,
  Search,
  Heart,
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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [curtidasMap, setCurtidasMap] = useState<Record<string, number>>({});
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

  const handleCurtir = (id: string) => {
    setCurtidasMap((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
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

      {/* CONTEÚDO 1: DIÁRIOS DE ROTINA RECEBIDOS (EXATO FORMATO DA IMAGEM 2) */}
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

              return (
                <div
                  key={diario.id}
                  className="p-4 sm:p-5 rounded-3xl border transition space-y-3 shadow-2xs hover:shadow-xs bg-emerald-50/40 border-emerald-200"
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

                  {/* AÇÕES RÁPIDAS NO CARD */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 font-semibold">
                      <CheckCircle2 size={13} className="text-emerald-600" />
                      <span>Registrado no Diário & Histórico Oficial</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopy(diario.id, diario.textoWhatsApp)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer text-xs"
                      >
                        {copiedId === diario.id ? (
                          <>
                            <Check size={13} className="text-emerald-600" />
                            <span className="text-emerald-700 font-black">Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={13} />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>

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
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer text-xs shadow-2xs"
                      >
                        <Phone size={13} />
                        <span>Enviar no WhatsApp</span>
                      </button>
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
    </div>
  );
}
