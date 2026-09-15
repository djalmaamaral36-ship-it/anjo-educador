import React, { useState } from 'react';
import { PerfilUsuario } from '../types';
import {
  Menu, X, Heart, Sparkles, UserCheck, Shield, Smartphone, Megaphone,
  TreePine, Palette, Lock, Printer, Headphones, Pill, BookOpen, ChevronRight, User
} from 'lucide-react';

interface HeaderProps {
  tabAtiva: string;
  onSelectTab: (tab: string) => void;
  perfilAtual: PerfilUsuario;
  onSelectPerfil: (perfil: PerfilUsuario) => void;
  onAbrirModalSuporte: () => void;
  turmaAtual: string;
  onSelectTurma: (turma: string) => void;
  onAbrirGuiaRecadinho: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  tabAtiva,
  onSelectTab,
  perfilAtual,
  onSelectPerfil,
  onAbrirModalSuporte,
  turmaAtual,
  onSelectTurma,
  onAbrirGuiaRecadinho
}) => {
  const [drawerAberto, setDrawerAberto] = useState(false);

  const menuItems = [
    { id: 'diario', label: 'Diário de Aula & Recadinho', icon: Heart, desc: 'Frequência, rotinas e recadinho da educadora' },
    { id: 'aura', label: 'Anjinha Aura (Assistente IA)', icon: Sparkles, desc: 'Mascote pedagógica e gerador BNCC', badge: 'IA' },
    { id: 'coordenacao', label: 'Coordenação Pedagógica', icon: UserCheck, desc: 'Validação de planos e BNCC' },
    { id: 'direcao', label: 'Direção & Mantenedores', icon: Shield, desc: 'Gestão financeira e PAX Escolar' },
    { id: 'familias', label: 'Visão dos Pais (Famílias)', icon: Smartphone, desc: 'Celular dos pais e medicamentos' },
    { id: 'jornada', label: 'Jornada da Primeira Infância', icon: TreePine, desc: 'Método Árvore e marcos de infância' },
    { id: 'mural', label: 'Mural de Avisos & Recados', icon: Megaphone, desc: 'Comunicados oficiais da escola' },
    { id: 'brandbook', label: 'BrandBook & Guia da Marca', icon: Palette, desc: 'Identidade visual e selos' },
    { id: 'lgpd', label: 'LGPD & Segurança Infantil', icon: Lock, desc: 'Termos e privacidade' },
    { id: 'relatorios', label: 'Relatórios & Exportação PDF', icon: Printer, desc: 'Impressão de diários' }
  ];

  const itemAtivo = menuItems.find(m => m.id === tabAtiva) || menuItems[0];

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        {/* Topo Utilitário com Contatos */}
        <div className="bg-slate-900 text-white text-[11px] py-1.5 px-4">
          <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
            <div className="flex items-center gap-2 font-medium">
              <span className="animate-pulse text-amber-300">👼</span>
              <span className="font-bold text-amber-300">Anjinho Educador</span>
              <span className="hidden sm:inline text-slate-300">— Diário Escolar Afetivo da Educação Infantil</span>
            </div>
            <div className="flex items-center gap-4 text-slate-300">
              <span className="hidden md:inline">Suporte: Djalma Amaral</span>
              <a href="mailto:djalmaamaral.adm@gmail.com" className="hover:text-amber-300 transition">djalmaamaral.adm@gmail.com</a>
              <a href="https://wa.me/5514997519181" target="_blank" rel="noreferrer" className="text-emerald-400 font-bold hover:underline">
                (14) 99751-9181
              </a>
            </div>
          </div>
        </div>

        {/* Barra Principal com Hambúrguer + Mascote Anjinha Aura */}
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            
            {/* Lado Esquerdo: Botão Hambúrguer + Logo + Anjinha Aura */}
            <div className="flex items-center gap-3">
              {/* Botão Menu Hambúrguer */}
              <button
                onClick={() => setDrawerAberto(true)}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl transition flex items-center gap-2 border border-slate-200 shadow-xs"
                title="Abrir Menu Principal (Painel Hambúrguer)"
              >
                <Menu className="w-5 h-5 text-slate-800" />
                <span className="text-xs font-black uppercase tracking-wider hidden sm:inline">Menu</span>
              </button>

              {/* Logo Anjinho Educador com Mascote Aura */}
              <div
                onClick={() => onSelectTab('diario')}
                className="flex items-center gap-2.5 cursor-pointer group"
              >
                <div className="w-10 h-10 bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-400 rounded-2xl flex items-center justify-center text-xl shadow-md border-2 border-white group-hover:scale-105 transition">
                  👼
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none">Anjinho Educador</h1>
                    <span className="bg-amber-100 text-amber-900 text-[10px] px-2 py-0.5 rounded-full font-black border border-amber-200 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      Aura IA
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">Agenda Escolar & Diário Afetivo</p>
                </div>
              </div>
            </div>

            {/* Centro / Direita: Seletor de Turma + Dúvida Recadinho + Suporte */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Seletor de Turma */}
              <div className="hidden sm:flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-500 font-bold text-[11px] pl-1">Turma:</span>
                <select
                  value={turmaAtual}
                  onChange={(e) => onSelectTurma(e.target.value)}
                  className="bg-white text-slate-800 font-extrabold px-2.5 py-1 rounded-lg border border-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="Berçário II - Manhã">Berçário II - Manhã</option>
                  <option value="Maternal I - Tarde">Maternal I - Tarde</option>
                  <option value="Jardim I - Integral">Jardim I - Integral</option>
                </select>
              </div>

              {/* Botão Guia: Como Inserir Recadinho */}
              <button
                onClick={onAbrirGuiaRecadinho}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold rounded-xl border border-rose-200 transition shadow-xs"
                title="Explicação passo a passo de como a educadora insere o recadinho"
              >
                <Heart className="w-4 h-4 text-rose-600 fill-rose-200 animate-pulse" />
                <span className="hidden md:inline">Como Inserir Recadinho?</span>
                <span className="md:hidden">Recadinho?</span>
              </button>

              {/* Botão Anjinha Aura (Atalho) */}
              <button
                onClick={() => onSelectTab('aura')}
                className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-black rounded-xl shadow-xs transition"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span className="hidden lg:inline">Anjinha Aura</span>
              </button>
            </div>
          </div>
        </div>

        {/* Faixa Inferior de Navegação Rápida (Tabs Horizontais) */}
        <div className="bg-slate-50 border-t border-slate-200 overflow-x-auto no-scrollbar">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1.5 py-2 min-w-max">
            {menuItems.slice(0, 6).map((item) => {
              const Icone = item.icon;
              const ativo = tabAtiva === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition ${
                    ativo
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  <Icone className={`w-4 h-4 ${ativo ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-black ${
                      ativo ? 'bg-amber-300 text-slate-900' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            <button
              onClick={() => setDrawerAberto(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition"
            >
              <Menu className="w-4 h-4" />
              <span>Mais Módulos...</span>
            </button>
          </div>
        </div>
      </header>

      {/* DRAWER / PAINEL LATERAL HAMBÚRGUER */}
      {drawerAberto && (
        <div className="fixed inset-0 z-50 flex">
          {/* Fundo escuro com blur */}
          <div
            onClick={() => setDrawerAberto(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          />

          {/* Painel Deslizante da Esquerda */}
          <div className="relative flex-1 max-w-sm w-full bg-white shadow-2xl flex flex-col z-10 overflow-y-auto">
            {/* Header da Gaveta */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-tr from-rose-500 to-amber-400 rounded-2xl flex items-center justify-center text-xl shadow-md">
                  👼
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight text-white">Anjinho Educador</h3>
                  <p className="text-xs text-slate-400">Painel Principal de Navegação</p>
                </div>
              </div>

              <button
                onClick={() => setDrawerAberto(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Banner da Anjinha Aura no Menu */}
            <div className="p-4 bg-gradient-to-r from-teal-600 to-emerald-700 text-white m-4 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
                  <Sparkles className="w-4 h-4" />
                  <span>Anjinha Aura IA</span>
                </div>
                <p className="text-[11px] text-teal-100">Assistente Pedagógica & Mascote</p>
              </div>
              <button
                onClick={() => {
                  onSelectTab('aura');
                  setDrawerAberto(false);
                }}
                className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-extrabold rounded-xl shadow-xs transition"
              >
                Conversar
              </button>
            </div>

            {/* Lista de Módulos */}
            <div className="px-4 py-2 space-y-1 flex-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-3 block mb-2">
                Módulos do Sistema Escolar
              </span>

              {menuItems.map((item) => {
                const Icone = item.icon;
                const selecionado = tabAtiva === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      setDrawerAberto(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition ${
                      selecionado
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        selecionado ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Icone className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-black flex items-center gap-2">
                          <span>{item.label}</span>
                          {item.badge && (
                            <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-black ${
                              selecionado ? 'bg-amber-300 text-slate-900' : 'bg-rose-100 text-rose-700'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className={`text-[11px] ${selecionado ? 'text-rose-100' : 'text-slate-500'}`}>
                          {item.desc}
                        </p>
                      </div>
                    </div>

                    <ChevronRight className={`w-4 h-4 ${selecionado ? 'text-white' : 'text-slate-400'}`} />
                  </button>
                );
              })}
            </div>

            {/* Rodapé da Gaveta */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-bold">Dúvidas ou Suporte?</span>
                <button
                  onClick={() => {
                    onAbrirModalSuporte();
                    setDrawerAberto(false);
                  }}
                  className="text-emerald-700 font-extrabold hover:underline"
                >
                  Falar com Djalma
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
