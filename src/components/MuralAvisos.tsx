import React, { useState } from 'react';
import { MuralAviso } from '../types';
import { MURAIS_MOCK } from '../data/mockData';
import { Calendar, Plus, Tag, User, MessageSquare } from 'lucide-react';

export const MuralAvisos: React.FC = () => {
  const [avisos, setAvisos] = useState<MuralAviso[]>(MURAIS_MOCK);
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novoConteudo, setNovoConteudo] = useState('');
  const [novaCategoria, setNovaCategoria] = useState<'Geral' | 'Evento' | 'Urgente'>('Geral');
  const [criando, setCriando] = useState(false);

  const handleCriarAviso = () => {
    if (!novoTitulo.trim() || !novoConteudo.trim()) return;

    const novo: MuralAviso = {
      id: Date.now().toString(),
      titulo: novoTitulo,
      conteudo: novoConteudo,
      data: new Date().toISOString().split('T')[0],
      autor: 'Profª. Ana Cláudia',
      categoria: novaCategoria
    };

    setAvisos([novo, ...avisos]);
    setNovoTitulo('');
    setNovoConteudo('');
    setCriando(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <span>Mural de Avisos & Recados Gerais</span>
          </h2>
          <p className="text-xs text-slate-500">Comunicação oficial com os pais e responsáveis</p>
        </div>

        <button
          onClick={() => setCriando(!criando)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Aviso</span>
        </button>
      </div>

      {criando && (
        <div className="bg-indigo-50/50 border border-indigo-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-indigo-950">Criar Novo Comunicado</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 block mb-1">Título do Aviso</label>
              <input
                type="text"
                value={novoTitulo}
                onChange={(e) => setNovoTitulo(e.target.value)}
                placeholder="Ex: Reunião de Pais ou Atividade Externa..."
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Categoria</label>
              <select
                value={novaCategoria}
                onChange={(e) => setNovaCategoria(e.target.value as any)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="Geral">Geral</option>
                <option value="Evento">Evento</option>
                <option value="Urgente">Urgente</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Conteúdo do Aviso</label>
            <textarea
              value={novoConteudo}
              onChange={(e) => setNovoConteudo(e.target.value)}
              rows={3}
              placeholder="Digite a mensagem completa a ser publicada no mural..."
              className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setCriando(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              onClick={handleCriarAviso}
              className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm"
            >
              Publicar Aviso
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {avisos.map((aviso) => (
          <div key={aviso.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                aviso.categoria === 'Urgente'
                  ? 'bg-rose-100 text-rose-800'
                  : aviso.categoria === 'Evento'
                  ? 'bg-indigo-100 text-indigo-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {aviso.categoria}
              </span>
              <span className="text-xs text-slate-400">{aviso.data}</span>
            </div>

            <h3 className="text-base font-bold text-slate-800">{aviso.titulo}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{aviso.conteudo}</p>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                {aviso.autor}
              </span>
              <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                <MessageSquare className="w-3.5 h-3.5" />
                Mural Ativo
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
