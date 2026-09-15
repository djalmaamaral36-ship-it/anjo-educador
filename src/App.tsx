import React, { useState } from 'react';
import { PerfilUsuario, Aluno, RotinaDia, RecadinhoTurma } from './types';
import { ALUNOS_MOCK, RECADINHO_TURMA_MOCK, ROTINAS_MOCK, MURAIS_MOCK } from './data/mockData';
import { Header } from './components/Header';
import { DiarioAula } from './components/DiarioAula';
import { AnjinhaAuraModule } from './components/comum/AnjinhaAuraModule';
import { CoordenacaoModule } from './components/coordenacao/CoordenacaoModule';
import { DirecaoModule } from './components/direcao/DirecaoModule';
import { FamiliasModule } from './components/familias/FamiliasModule';
import { JornadaModule } from './components/jornada/JornadaModule';
import { MuralAvisos } from './components/MuralAvisos';
import { BrandBookModule } from './components/brandbook/BrandBookModule';
import { LgpdModule } from './components/lgpd/LgpdModule';
import { RelatoriosModule } from './components/relatorios/RelatoriosModule';
import { FloatingRoleSwitcher } from './components/comum/FloatingRoleSwitcher';
import { ModalSuporteContato } from './components/ModalSuporteContato';

export function App() {
  const [tabAtiva, setTabAtiva] = useState<string>('diario');
  const [perfilAtual, setPerfilAtual] = useState<PerfilUsuario>('educadora');
  const [turmaAtual, setTurmaAtual] = useState<string>('Berçário II - Manhã');

  const [alunos, setAlunos] = useState<Aluno[]>(ALUNOS_MOCK);
  const [rotinas, setRotinas] = useState<Record<string, RotinaDia>>(ROTINAS_MOCK);
  const [recadinhoTurma, setRecadinhoTurma] = useState<RecadinhoTurma>(RECADINHO_TURMA_MOCK);

  const [modalSuporteAberto, setModalSuporteAberto] = useState(false);

  const handleSalvarRecadinhoTurma = (novaMensagem: string, categoria: RecadinhoTurma['categoria']) => {
    setRecadinhoTurma({
      ...recadinhoTurma,
      mensagem: novaMensagem,
      categoria,
      data: new Date().toISOString().split('T')[0]
    });
  };

  const handleAtualizarPresenca = (alunoId: string, presente: boolean) => {
    setAlunos(alunos.map(a => a.id === alunoId ? { ...a, presente } : a));
  };

  const handleAtualizarRotina = (alunoId: string, dadosNovos: Partial<RotinaDia>) => {
    setRotinas(prev => ({
      ...prev,
      [alunoId]: {
        ...(prev[alunoId] || {
          alunoId,
          data: new Date().toISOString().split('T')[0],
          alimentacao: 'Boa',
          sono: 'Dormiu bem',
          higiene: 'Troca de fralda OK',
          evacuacao: 'Normal',
          humor: 'Alegre',
          atividades: [],
          recadinhoEducadora: ''
        }),
        ...dadosNovos
      }
    }));
  };

  const handleUsarRecadinhoDaAura = (textoAura: string) => {
    setRecadinhoTurma(prev => ({
      ...prev,
      mensagem: textoAura
    }));
    setTabAtiva('diario');
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 font-sans antialiased pb-20">
      {/* Header com todas as Abas e Hambúrguer */}
      <Header
        tabAtiva={tabAtiva}
        onSelectTab={setTabAtiva}
        perfilAtual={perfilAtual}
        onSelectPerfil={setPerfilAtual}
        onAbrirModalSuporte={() => setModalSuporteAberto(true)}
        turmaAtual={turmaAtual}
        onSelectTurma={setTurmaAtual}
      />

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Aba Diário de Aula */}
        {tabAtiva === 'diario' && (
          <DiarioAula
            turmaAtual={turmaAtual}
            alunos={alunos}
            setAlunos={setAlunos}
            rotinas={rotinas}
            setRotinas={setRotinas}
            recadinhoTurma={recadinhoTurma}
            onSalvarRecadinhoTurma={handleSalvarRecadinhoTurma}
            onAtualizarPresenca={handleAtualizarPresenca}
            onAtualizarRotina={handleAtualizarRotina}
          />
        )}

        {/* Aba Anjinha Aura (IA) */}
        {tabAtiva === 'aura' && (
          <AnjinhaAuraModule
            onUsarRecadinho={handleUsarRecadinhoDaAura}
            turmaAtual={turmaAtual}
          />
        )}

        {/* Aba Coordenação */}
        {tabAtiva === 'coordenacao' && (
          <CoordenacaoModule />
        )}

        {/* Aba Direção */}
        {tabAtiva === 'direcao' && (
          <DirecaoModule />
        )}

        {/* Aba Visão dos Pais */}
        {tabAtiva === 'familias' && (
          <FamiliasModule
            alunos={alunos}
            rotinas={rotinas}
            recadinhoTurmaMensagem={recadinhoTurma.mensagem}
          />
        )}

        {/* Aba Jornada Infantíl */}
        {tabAtiva === 'jornada' && (
          <JornadaModule />
        )}

        {/* Aba Mural de Avisos */}
        {tabAtiva === 'mural' && (
          <MuralAvisos murais={MURAIS_MOCK} />
        )}

        {/* Aba BrandBook */}
        {tabAtiva === 'brandbook' && (
          <BrandBookModule />
        )}

        {/* Aba LGPD */}
        {tabAtiva === 'lgpd' && (
          <LgpdModule />
        )}

        {/* Aba Relatórios */}
        {tabAtiva === 'relatorios' && (
          <RelatoriosModule />
        )}
      </main>

      {/* Seletor Flutuante de Perfil (Role Switcher) */}
      <FloatingRoleSwitcher
        perfilAtual={perfilAtual}
        onSelectPerfil={setPerfilAtual}
      />

      {/* Modal Suporte com Djalma Amaral */}
      <ModalSuporteContato
        isOpen={modalSuporteAberto}
        onClose={() => setModalSuporteAberto(false)}
      />
    </div>
  );
}

export default App;
