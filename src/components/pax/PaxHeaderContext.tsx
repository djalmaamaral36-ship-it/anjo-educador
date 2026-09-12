import React, { useState } from 'react';
import { Search, Mic, Building2, ShieldCheck, School, Users, Sparkles } from 'lucide-react';
import LogoAnjinhoEducador from '../comum/LogoAnjinhoEducador';

interface Props {
  selectedStudentId: string;
  onSelectStudent: (id: string) => void;
  selectedRoom: string;
  onSelectRoom: (room: string) => void;
  userRole?: 'professor' | 'familia';
}

export default function PaxHeaderContext({
  selectedStudentId,
  onSelectStudent,
  selectedRoom,
  onSelectRoom,
  userRole = 'professor',
}: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const isProfessor = userRole === 'professor';

  const rooms = [
    { id: 'bercario_1a', nome: 'Berçário I - A', idade: '0-1 ano', professora: 'Ana Silva', alunos: 5, cap: 5 },
    { id: 'bercario_1b', nome: 'Berçário I - B', idade: '0-1 ano', professora: 'Mariana Lima', alunos: 4, cap: 6 },
    { id: 'maternal_1', nome: 'Maternal I', idade: '1-2 anos', professora: 'Carla Dias', alunos: 8, cap: 10 },
  ];

  return (
    <div className="space-y-4 mb-6">
      {/* 1. Instituição Credenciada & Patrocinadora */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 shadow-inner flex-shrink-0">
            <School size={28} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">
              INSTITUIÇÃO CREDENCIADA & PATROCINADORA
            </span>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Colégio Pequeno Anjo</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Onde a infância é registrada para sempre • Transparência e segurança diária para a família.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center bg-emerald-50 text-emerald-800 border border-emerald-200/70 px-3.5 py-1.5 rounded-2xl">
          <ShieldCheck size={18} className="text-emerald-600 flex-shrink-0" />
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-wider leading-none">PARCEIRO OFICIAL</p>
            <p className="text-[9px] text-emerald-700 font-medium leading-tight">Selo de Qualidade Digital</p>
          </div>
        </div>
      </div>

      {/* 2. Busca Direta por Nome */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-3">
        <div>
          <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">
            BUSCA DIRETA POR NOME
          </span>
          <h4 className="text-lg font-black text-slate-800">Busca Rápida de Alunos & Crianças</h4>
          <p className="text-xs text-slate-500">
            Digite o nome de qualquer aluno, turma ou responsável para alternar o diário e boletim em 1 clique:
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 focus-within:border-indigo-500 focus-within:bg-white transition shadow-inner">
          <Search size={18} className="text-slate-400 flex-shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Busca rápida: digite nome da criança, sala ou responsável..."
            className="w-full bg-transparent text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none"
          />
          <button
            onClick={() => alert('Busca por voz ativa. Diga o nome da criança...')}
            className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-500 hover:text-indigo-600 transition cursor-pointer"
            title="Entrada por Voz"
          >
            <Mic size={18} />
          </button>
        </div>

        {/* Quick Suggestion Pills */}
        {isProfessor ? (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-bold text-slate-400">Atalhos rápidos da turma:</span>
            {selectedRoom === 'maternal_1a' ? (
              <>
                <button
                  onClick={() => onSelectStudent('lucas_ferreira')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    selectedStudentId === 'lucas_ferreira'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>👦 Lucas Ferreira (Maternal I - A)</span>
                </button>
                <button
                  onClick={() => onSelectStudent('alice_oliveira')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    selectedStudentId === 'alice_oliveira'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>👧 Alice Oliveira (Maternal I - A)</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onSelectStudent('enzo_alencar')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    selectedStudentId === 'enzo_alencar'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>👦 Enzo Alencar (Berçário I - A)</span>
                </button>
                <button
                  onClick={() => onSelectStudent('mariana_souza')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    selectedStudentId === 'mariana_souza'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>👧 Mariana Souza (Berçário I - A)</span>
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="pt-1">
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl inline-flex items-center gap-1.5">
              🔒 Perfil Familiar: Acesso restrito e exclusivo à rotina de <strong>Enzo Alencar</strong>
            </span>
          </div>
        )}
      </div>

      {/* 3. Central de Salas & Professoras (Ambiente de Testes) - Apenas Professores */}
      {isProfessor && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-black text-slate-800">Central de Salas & Professoras</h4>
                <span className="text-[10px] font-black uppercase text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
                  AMBIENTE DE TESTES
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Mude de sala e professora com 1 clique. O painel se adaptará por completo para carregar as informações e diários da sala selecionada.
              </p>
            </div>

            <div className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl self-start sm:self-auto flex items-center gap-1.5">
              <span>PROFESSORA ATIVA:</span>
              <span className="text-indigo-700 font-black">
                {selectedRoom === 'maternal_1a' ? 'Cláudia Mendes' : 'Ana Silva'} (Professora Titular)
              </span>
              <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-md font-black">
                {selectedRoom === 'maternal_1a' ? 'Maternal I - A' : 'Berçário I - A'}
              </span>
            </div>
          </div>

          {/* Room cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {rooms.map((room) => {
              const isSelected = selectedRoom === room.id;
              return (
                <div
                  key={room.id}
                  onClick={() => onSelectRoom(room.id)}
                  className={`p-4 rounded-2xl border transition cursor-pointer relative ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🍼</span>
                      <div>
                        <h5 className="font-black text-xs sm:text-sm text-slate-800">{room.nome}</h5>
                        <p className="text-[11px] text-slate-500">{room.professora}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {room.idade}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mt-2.5 pt-2 border-t border-slate-100">
                    <span>{room.alunos} Alunos</span>
                    <span>Cap: {room.cap}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Modo Agenda Escolar Infantil Ativo (Maternal & Creche)! */}
      <div className="bg-gradient-to-r from-teal-50/70 via-indigo-50/50 to-amber-50/40 rounded-3xl p-5 sm:p-6 border border-teal-200/80 shadow-xs space-y-3">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white p-0.5 flex items-center justify-center border border-teal-200/80 shadow-sm flex-shrink-0 group hover:scale-105 transition overflow-hidden">
            <LogoAnjinhoEducador variant="symbol" size="full" className="w-full h-full" />
          </div>
          <div>
            <h4 className="text-base font-black text-slate-800 tracking-tight">
              Modo Agenda Escolar Infantil Ativo (Maternal & Creche)!
            </h4>
            <p className="text-xs text-slate-600 mt-0.5">
              Você está simulando o aplicativo voltado para creches e berçários. As abas do Diário foram configuradas para o bem-estar lúdico, higiene e rotina da primeira infância.
            </p>
          </div>
        </div>

        {/* Categories Pills */}
        <div className="flex flex-wrap gap-2 pt-1">
          {[
            'Papa & Mamadeira',
            'Trocas & Higiene',
            'Copos de Água',
            'Sono / Soneca',
            'Humor & Social',
            'Atividade Pedagógica',
          ].map((tag) => (
            <span
              key={tag}
              className="text-xs font-bold text-teal-900 bg-teal-100/80 border border-teal-200 px-3 py-1 rounded-xl"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
