import React, { useState } from 'react';
import { LembrancaMoment } from '../../types';
import { GESTOS_DEFAULT } from '../../utils/constants';
import { Plus, MessageSquare, Heart, Sparkles, Share2, ShieldCheck } from 'lucide-react';

interface Props {
  moments: LembrancaMoment[];
  onOpenNewMoment: () => void;
}

export default function MomentosFeed({ moments, onOpenNewMoment }: Props) {
  const [activeFilter, setActiveFilter] = useState('todos');
  const [items, setItems] = useState<LembrancaMoment[]>(moments);

  const filters = [
    { id: 'todos', label: 'Todos os Momentos' },
    { id: 'conquistas', label: 'Conquistas' },
    { id: 'atividades', label: 'Atividades' },
    { id: 'fotos', label: 'Fotos' },
    { id: 'evolucao', label: 'Evolução' },
    { id: 'relatorios', label: 'Relatórios' },
    { id: 'datas', label: 'Datas' },
  ];

  const filteredMoments = items.filter((m) => {
    if (activeFilter === 'todos') return true;
    if (activeFilter === 'conquistas') return m.tipo === 'conquista';
    if (activeFilter === 'atividades') return m.tipo === 'atividade';
    if (activeFilter === 'fotos') return m.tipo === 'foto' || !!m.fotoUrl;
    if (activeFilter === 'evolucao') return m.tipo === 'evolucao';
    if (activeFilter === 'relatorios') return m.tipo === 'relatorio';
    return true;
  });

  const handleToggleGesto = (momentId: string, gestoLabel: string) => {
    setItems((prev) =>
      prev.map((m) => {
        if (m.id !== momentId) return m;
        const exists = m.gestosAfeto?.find((g) => g.label === gestoLabel);
        let updatedGestos = m.gestosAfeto || [];
        if (exists) {
          updatedGestos = updatedGestos.map((g) =>
            g.label === gestoLabel ? { ...g, count: g.count + 1 } : g
          );
        } else {
          updatedGestos = [...updatedGestos, { label: gestoLabel, count: 1 }];
        }
        return { ...m, gestosAfeto: updatedGestos };
      })
    );
  };

  return (
    <div className="space-y-5">
      {/* Category Pills & Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition-all cursor-pointer ${
                activeFilter === filter.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500">
            Mostrando {filteredMoments.length} registros
          </span>
          <button
            onClick={onOpenNewMoment}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-amber-950 rounded-xl font-black text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus size={16} strokeWidth={3} /> Nova Lembrança
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-amber-50/20 rounded-3xl p-5 sm:p-7 border border-amber-200/60 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare size={20} className="text-indigo-600" />
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight">
                Momentos que Merecem ser Lembrados
              </h3>
              <p className="text-xs text-slate-500">
                Registros espontâneos e inesquecíveis da vida do anjinho na escola:
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 px-3 py-1 rounded-full hidden sm:inline-block">
            DESTAQUES AFETIVOS
          </span>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredMoments.map((moment) => (
            <div
              key={moment.id}
              className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition"
            >
              <div className="space-y-3">
                {/* Header Tag and Date */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full">
                    {moment.tipoLabel || moment.tipo}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400">
                    {moment.data}
                  </span>
                </div>

                {/* Title */}
                <h4 className="text-base sm:text-lg font-black text-slate-800 leading-snug">
                  {moment.titulo}
                </h4>

                {/* Photo (if exists) */}
                {moment.fotoUrl && (
                  <div className="w-full h-48 rounded-2xl overflow-hidden bg-slate-100 relative">
                    <img
                      src={moment.fotoUrl}
                      alt={moment.titulo}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Description */}
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  "{moment.descricao}"
                </p>

                {/* Badge e Card de Redes Sociais */}
                {moment.postarRedesSociais && (
                  <div className="p-3 bg-teal-50/80 border border-teal-200 rounded-2xl space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase text-teal-800">
                      <span className="flex items-center gap-1">
                        <Share2 size={12} /> Postado nas Redes da Escola
                      </span>
                      {moment.fotoOcultaRedes && (
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <ShieldCheck size={11} /> Foto Oculta (LGPD)
                        </span>
                      )}
                    </div>
                    {moment.fotoOcultaRedes && moment.mensagemAfetoRedes && (
                      <p className="text-xs text-slate-700 italic bg-white p-2.5 rounded-xl border border-teal-100/80">
                        {moment.mensagemAfetoRedes}
                      </p>
                    )}
                  </div>
                )}

                {/* Tags Foco & Valores */}
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  {moment.foco && moment.foco.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        FOCO:
                      </span>
                      {moment.foco.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-bold bg-pink-50 text-pink-700 border border-pink-200 px-2 py-0.5 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {moment.valores && moment.valores.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        ⭐ VALORES:
                      </span>
                      {moment.valores.map((val) => (
                        <span
                          key={val}
                          className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full"
                        >
                          {val}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Gestos de Presença e Afeto */}
              <div className="bg-amber-50/60 rounded-2xl p-3 border border-amber-200/60 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-black text-amber-900 uppercase tracking-wider text-[10px]">
                    GESTOS DE PRESENÇA & AFETO
                  </span>
                  <span className="text-[10px] font-bold bg-amber-200/80 text-amber-950 px-2 py-0.5 rounded-full">
                    {moment.gestosAfeto?.reduce((acc, curr) => acc + curr.count, 0) || 5} gestos de afeto
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {GESTOS_DEFAULT.map((gesto) => {
                    const found = moment.gestosAfeto?.find((g) => g.label === gesto);
                    return (
                      <button
                        key={gesto}
                        onClick={() => handleToggleGesto(moment.id, gesto)}
                        className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-white hover:bg-amber-100/60 text-slate-700 border border-slate-200 transition cursor-pointer active:scale-95 flex items-center gap-1"
                      >
                        <span>{gesto}</span>
                        {found && found.count > 0 && (
                          <span className="text-[10px] font-black text-amber-700">
                            ({found.count})
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
