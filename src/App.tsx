import React, { useState } from 'react';
import { Header } from './components/Header';
import { DiarioAula } from './components/DiarioAula';
import { RecadinhoEducadoraSection } from './components/RecadinhoEducadoraSection';
import { MuralAvisos } from './components/MuralAvisos';
import { GuiaRecadinhoModal } from './components/GuiaRecadinhoModal';
import { ModalSuporteContato } from './components/ModalSuporteContato';
import { ALUNOS_MOCK, RECADINHO_TURMA_MOCK, ROTINAS_MOCK } from './data/mockData';
import { Aluno, RecadinhoTurma, RotinaDia } from './types';

export function App() {
  const [turmaAtual, setTurmaAtual] = useState<string>('Berçário II - Manhã');
  const [tabAtiva, setTabAtiva] = useState<'diario' | 'recadinho' | 'mural' | 'guia'>('diario');
  const [alunos, setAlunos] = useState<Aluno[]>(ALUNOS_MOCK);
  const [recadinhoTurma, setRecadinhoTurma] = useState<RecadinhoTurma>(RECADINHO_TURMA_MOCK);
  const [rotinas, setRotinas] = useState<Record<string, RotinaDia>>(ROTINAS_MOCK);

  const [guiaAberto, setGuiaAberto] = useState(false);
  const [suporteAberto, setSuporteAberto] = useState(false);

  const handleAtualizarAlunoRecadinho = (id: string, texto: string) => {
    setAlunos(alunos.map(a => a.id === id ? { ...a, recadinhoIndividual: texto } : a));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        turmaAtual={turmaAtual}
        setTurmaAtual={setTurmaAtual}
        tabAtiva={tabAtiva}
        setTabAtiva={setTabAtiva}
        onAbrirSuporte={() => setSuporteAberto(true)}
        onAbrirGuia={() => setGuiaAberto(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {tabAtiva === 'diario' && (
          <DiarioAula
            turmaAtual={turmaAtual}
            alunos={alunos}
            setAlunos={setAlunos}
            rotinas={rotinas}
            setRotinas={setRotinas}
            recadinhoTurma={recadinhoTurma}
            onAbrirGuia={() => setGuiaAberto(true)}
          />
        )}

        {tabAtiva === 'recadinho' && (
          <RecadinhoEducadoraSection
            recadinhoTurma={recadinhoTurma}
            setRecadinhoTurma={setRecadinhoTurma}
            alunos={alunos}
            onAtualizarAlunoRecadinho={handleAtualizarAlunoRecadinho}
          />
        )}

        {tabAtiva === 'mural' && <MuralAvisos />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Anjinho Educador — Agenda & Diário Escolar da Educação Infantil</p>
          <div className="flex items-center gap-4">
            <button onClick={() => setGuiaAberto(true)} className="hover:underline text-emerald-700 font-semibold">
              Guia: Como Inserir Recadinho
            </button>
            <button onClick={() => setSuporteAberto(true)} className="hover:underline text-slate-600">
              Contato Suporte
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {guiaAberto && (
        <GuiaRecadinhoModal
          onFechar={() => setGuiaAberto(false)}
          onIrParaRecadinho={() => setTabAtiva('recadinho')}
        />
      )}

      {suporteAberto && (
        <ModalSuporteContato onFechar={() => setSuporteAberto(false)} />
      )}
    </div>
  );
}

export default App;
