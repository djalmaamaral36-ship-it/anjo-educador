import React, { useState } from 'react';
import { Leaf, Award, Sprout, HeartHandshake, Sparkles, Filter } from 'lucide-react';

interface StudentTree {
  id: string;
  nome: string;
  turma: string;
  fotoUrl: string;
  statusTexto: string;
  porcentagem: number;
  frutosColhidos: number;
  isSeuAnjinho?: boolean;
}

const STUDENTS_FOREST: StudentTree[] = [
  {
    id: 'mariana',
    nome: 'Mariana Souza',
    turma: 'Maternal I',
    fotoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80',
    statusTexto: 'Árvore de Frutos (Preservação)',
    porcentagem: 100,
    frutosColhidos: 2,
    isSeuAnjinho: true,
  },
  {
    id: 'laura',
    nome: 'Laura Costa',
    turma: 'Maternal I',
    fotoUrl: 'https://images.unsplash.com/photo-1596464716127-f2a829822301?w=400&auto=format&fit=crop&q=80',
    statusTexto: 'Raízes Firmes e Folhas Ativas',
    porcentagem: 98,
    frutosColhidos: 0,
  },
  {
    id: 'enzo',
    nome: 'Enzo Alencar',
    turma: 'Maternal I',
    fotoUrl: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&auto=format&fit=crop&q=80',
    statusTexto: 'Raízes Firmes e Folhas Ativas',
    porcentagem: 98,
    frutosColhidos: 0,
  },
  {
    id: 'beatriz',
    nome: 'Beatriz Castro',
    turma: 'Maternal I',
    fotoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    statusTexto: 'Raízes Firmes e Folhas Ativas',
    porcentagem: 98,
    frutosColhidos: 0,
  },
  {
    id: 'bernardo',
    nome: 'Bernardo Teixeira',
    turma: 'Maternal I',
    fotoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
    statusTexto: 'Raízes Firmes e Folhas Ativas',
    porcentagem: 98,
    frutosColhidos: 0,
  },
  {
    id: 'cecilia',
    nome: 'Cecília Duarte',
    turma: 'Maternal I',
    fotoUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80',
    statusTexto: 'Raízes Firmes e Folhas Ativas',
    porcentagem: 98,
    frutosColhidos: 0,
  },
  {
    id: 'alice',
    nome: 'Alice Santos',
    turma: 'Maternal I',
    fotoUrl: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=400&auto=format&fit=crop&q=80',
    statusTexto: 'Raízes Firmes e Folhas Ativas',
    porcentagem: 98,
    frutosColhidos: 0,
  },
  {
    id: 'lucas',
    nome: 'Lucas Oliveira',
    turma: 'Maternal I',
    fotoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&auto=format&fit=crop&q=80',
    statusTexto: 'Raízes Firmes e Folhas Ativas',
    porcentagem: 98,
    frutosColhidos: 0,
  },
  {
    id: 'helena',
    nome: 'Helena Ferreira',
    turma: 'Maternal I',
    fotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    statusTexto: 'Raízes Firmes e Folhas Ativas',
    porcentagem: 98,
    frutosColhidos: 0,
  },
  {
    id: 'gabriel',
    nome: 'Gabriel Mendes',
    turma: 'Maternal I',
    fotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    statusTexto: 'Raízes Firmes e Folhas Ativas',
    porcentagem: 98,
    frutosColhidos: 0,
  },
];

interface Props {
  onSelectStudent?: (studentId: string) => void;
}

export default function FlorestaDoSaberSection({ onSelectStudent }: Props) {
  const [chuvaSent, setChuvaSent] = useState(false);
  const [selectedClareira, setSelectedClareira] = useState('todas');
  const [selectedBosque, setSelectedBosque] = useState('todos');

  const handleChuvaCarinho = () => {
    setChuvaSent(true);
    setTimeout(() => setChuvaSent(false), 3500);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Banner Principal Verde - A Floresta do Saber */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
        {/* Elemento Decorativo de Fundo */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-emerald-800/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-amber-400 text-amber-950 text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-wider shadow-xs">
                MÉTODO ÁRVORE DA INF
              </span>
              <span className="bg-emerald-800/80 border border-emerald-700 text-emerald-200 text-[10px] font-bold uppercase px-3 py-1 rounded-full tracking-wider">
                A FLORESTA DO SABER
              </span>
            </div>

            {/* Título */}
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight flex items-center gap-3">
              <span>A Floresta do Saber</span>
              <span className="text-2xl sm:text-3xl">🌳</span>
            </h2>

            {/* Descrição Afetiva */}
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-medium">
              Toda escola é uma floresta viva. Aqui, contemplamos o crescimento coletivo, cultivado com afeto, respeito e tempo. Cada árvore representa uma semente única florescendo em seu próprio tempo.
            </p>
          </div>

          {/* Botão de Ação: Chuva de Carinho Coletiva */}
          <div className="flex-shrink-0">
            <button
              onClick={handleChuvaCarinho}
              className="bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs sm:text-sm px-6 py-3.5 rounded-2xl shadow-xl transition flex items-center gap-2 cursor-pointer active:scale-95 border border-amber-300"
            >
              <span>💧</span>
              <span>{chuvaSent ? '✨ Chuva Envida com Amor!' : 'Chuva de Carinho Coletiva'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid de Métricas / Indicadores da Floresta (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Árvores Plantadas */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Árvores Plantadas</span>
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
              🍃
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900">10</div>
            <p className="text-[11px] font-medium text-slate-500 mt-1">
              Crianças florescendo ativas na escola
            </p>
          </div>
        </div>

        {/* Card 2: Vitalidade Geral do Solo */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Vitalidade Geral do Solo</span>
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
              🌱
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-emerald-700">96%</div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: '96%' }} />
            </div>
            <p className="text-[11px] font-medium text-slate-500 mt-1.5">
              Índice de nutrição afetiva geral
            </p>
          </div>
        </div>

        {/* Card 3: Frutos de Aprendizado */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Frutos de Aprendizado</span>
            <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-sm">
              🏅
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900">2</div>
            <p className="text-[11px] font-medium text-slate-500 mt-1">
              Momentos Inesquecíveis & Trabalhinhos
            </p>
          </div>
        </div>

        {/* Card 4: Fases de Crescimento */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Fases de Crescimento</span>
            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-sm">
              🌸
            </div>
          </div>
          <div className="space-y-1 text-xs font-bold text-slate-700">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-normal">Broto/Semente:</span>
              <span className="bg-slate-100 px-2 py-0.5 rounded-md">0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-normal">Em Crescimento:</span>
              <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md font-bold">8</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-normal">Flor/Fruto:</span>
              <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md font-bold">2</span>
            </div>
          </div>
        </div>
      </div>

      {/* Seção Explorar Bosques e Clareiras da Escola */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <h3 className="text-lg sm:text-xl font-black text-slate-800 flex items-center gap-2">
              <span>🌲</span>
              <span>Explorar Bosques e Clareiras da Escola</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Navegue pelas salas de aula e faixas etárias para contemplar o ecossistema pedagógico.
            </p>
          </div>

          {/* Filtros Dropdown */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                CLAREIRAS (SÉRIE)
              </label>
              <select
                value={selectedClareira}
                onChange={(e) => setSelectedClareira(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="todas">Todas as Clareiras</option>
                <option value="bercario">Berçário I</option>
                <option value="maternal1">Maternal I</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                BOSQUES (TURMA)
              </label>
              <select
                value={selectedBosque}
                onChange={(e) => setSelectedBosque(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="todos">Todos os Bosques</option>
                <option value="maternal1a">Maternal I - A</option>
              </select>
            </div>
          </div>
        </div>

        {/* Grid de Cards das Crianças / Árvores */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {STUDENTS_FOREST.map((student) => {
            const isHighlight = student.isSeuAnjinho;

            return (
              <div
                key={student.id}
                onClick={() => onSelectStudent && onSelectStudent(student.id)}
                className={`rounded-2xl p-4 transition-all duration-200 cursor-pointer relative flex flex-col items-center text-center justify-between ${
                  isHighlight
                    ? 'bg-amber-50/40 border-2 border-amber-400 shadow-md ring-2 ring-amber-300/40 hover:bg-amber-50'
                    : 'bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md'
                }`}
              >
                {/* Badge "SEU ANJINHO" para Mariana */}
                {isHighlight && (
                  <div className="absolute -top-3 bg-amber-400 text-amber-950 font-black text-[10px] uppercase px-3 py-0.5 rounded-full shadow-xs tracking-wider border border-white">
                    SEU ANJINHO
                  </div>
                )}

                {/* Ilustração da Árvore */}
                <div className="my-2 relative flex items-center justify-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-emerald-50 flex items-center justify-center p-2">
                    {/* Árvore Estilizada */}
                    <div className="text-center relative">
                      <span className="text-3xl sm:text-4xl block leading-none">
                        {isHighlight ? '🌳' : '🌲'}
                      </span>
                      {isHighlight && (
                        <div className="absolute -top-1 -right-1 text-xs">🍎</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Avatar do Aluno */}
                <div className="w-10 h-10 rounded-full border-2 border-white shadow-xs overflow-hidden bg-slate-100 -mt-5 mb-2 relative z-10">
                  <img
                    src={student.fotoUrl}
                    alt={student.nome}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Nome & Turma */}
                <div className="space-y-0.5 w-full">
                  <h4 className="text-xs sm:text-sm font-black text-slate-800 truncate">
                    {student.nome}
                  </h4>
                  <p className="text-[11px] font-medium text-slate-500">
                    {student.turma}
                  </p>
                </div>

                {/* Barra de Progresso / Status */}
                <div className="w-full mt-3 pt-3 border-t border-slate-100/80 space-y-1.5">
                  <div className="text-[10px] font-bold text-slate-600 truncate flex justify-between">
                    <span className="truncate">{student.statusTexto}</span>
                    <span className="ml-1 text-emerald-700 font-black">{student.porcentagem}%</span>
                  </div>

                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        isHighlight ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${student.porcentagem}%` }}
                    />
                  </div>

                  <p className="text-[10px] font-medium text-slate-400 italic">
                    {student.frutosColhidos}{' '}
                    {student.frutosColhidos === 1 ? 'fruto colhido' : 'frutos colhidos'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
