import React, { useState } from 'react';
import { ChildProfile, LembrancaMoment, TreeStatus } from '../types';
import { DEFAULT_CHILD, INITIAL_TREE_STATUS } from '../utils/constants';
import JornadaHeader from './jornada/JornadaHeader';
import ArvoreCultivoCard from './jornada/ArvoreCultivoCard';
import NarrativaAfetivaCard from './jornada/NarrativaAfetivaCard';
import MetodoLivroSection from './jornada/MetodoLivroSection';
import MomentosFeed from './jornada/MomentosFeed';
import RegistrarLembrancaModal from './jornada/RegistrarLembrancaModal';
import AlbumPrimeiraInfanciaModal from './jornada/AlbumPrimeiraInfanciaModal';
import FlorestaDoSaberSection from './jornada/FlorestaDoSaberSection';
import MetodoArvoreInfModal from './jornada/MetodoArvoreInfModal';
import { Camera } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

const INITIAL_MOMENTS: LembrancaMoment[] = [
  {
    id: 'momento-1',
    studentId: 'mariana_souza_01',
    titulo: 'Pintura de Dedos Sensorial e Cores Quentes',
    tipo: 'atividade',
    tipoLabel: 'ATIVIDADE PEDAGÓGICA',
    data: '01/07/2026',
    fotoUrl: 'https://images.unsplash.com/photo-1596464716127-f2a829822301?w=800&auto=format&fit=crop&q=80',
    descricao:
      'Oficina sensorial de artes! Mariana experimentou guache azul e amarelo misturado com amido de milho para criar texturas. No começo sentiu estranheza na consistência gelada, mas logo espalhou a tinta com entusiasmo no papel craft!',
    foco: ['Criatividade', 'Aprendizado'],
    valores: ['Cooperou', 'Compartilhou'],
    gestosAfeto: [
      { label: 'Que encanto!', count: 3 },
      { label: 'Feito com amor', count: 4 },
      { label: 'Puro brilho!', count: 2 },
    ],
  },
  {
    id: 'momento-2',
    studentId: 'mariana_souza_01',
    titulo: 'Sentou sem apoio pela primeira vez!',
    tipo: 'conquista',
    tipoLabel: 'PRIMEIRA CONQUISTA',
    data: '14/06/2026',
    descricao:
      'Mariana conseguiu se manter sentadinha no tatame de estimulação por mais de 2 minutos sem cair para os lados. Riu muito e bateu palminhas ao conseguir o feito! Desenvolveu o equilíbrio e celebrou com a turminha!',
    foco: ['Desenvolvimento Motor', 'Autonomia'],
    valores: ['Persistência', 'Alegria'],
    gestosAfeto: [
      { label: 'Orgulho da gente', count: 5 },
      { label: 'Um tesouro!', count: 3 },
    ],
  },
  {
    id: 'momento-3',
    studentId: 'mariana_souza_01',
    titulo: 'Primeiro abraço compartilhado na roda de cantigas',
    tipo: 'atividade',
    tipoLabel: 'MOMENTO AFETIVO',
    data: '28/05/2026',
    fotoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80',
    descricao:
      'Durante a cantiga da borboletinha, Mariana espontaneamente abriu os bracinhos, abraçou a educadora e entregou o chocalho de fitas coloridas com um sorriso radiante.',
    foco: ['Socialização', 'Expressão'],
    valores: ['Afeto', 'Acolhimento'],
    gestosAfeto: [
      { label: 'Que encanto!', count: 6 },
      { label: 'Puro brilho!', count: 2 },
    ],
  },
];

export default function JornadaDoAnjinho() {
  const [activeView, setActiveView] = useState<'arvore' | 'floresta'>('arvore');
  const [treeStatus, setTreeStatus] = useState<TreeStatus>(INITIAL_TREE_STATUS);
  const [moments, setMoments] = useState<LembrancaMoment[]>(INITIAL_MOMENTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAlbumOpen, setIsAlbumOpen] = useState(false);
  const [isMetodoModalOpen, setIsMetodoModalOpen] = useState(false);

  const handleSaveMoment = async (newMoment: Omit<LembrancaMoment, 'id'>) => {
    const momentWithId: LembrancaMoment = {
      id: `momento-${Date.now()}`,
      ...newMoment,
    };

    setMoments((prev) => [momentWithId, ...prev]);

    // Atualiza contadores da árvore
    setTreeStatus((prev) => ({
      ...prev,
      folhasCultivadas: prev.folhasCultivadas + 1,
      valoresDesabrochados: prev.valoresDesabrochados + newMoment.valores.length,
      gestosDeAfeto: prev.gestosDeAfeto + 2,
    }));

    // Tenta persistir no Firestore de forma não-bloqueante
    try {
      await addDoc(collection(db, 'lembrancas'), {
        ...newMoment,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Firestore fallback: lembrança salva na sessão local.');
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header & Switcher */}
      <JornadaHeader
        child={DEFAULT_CHILD}
        activeView={activeView}
        onToggleView={setActiveView}
        onOpenNewMoment={() => setIsModalOpen((prev) => !prev)}
        onOpenAlbum={() => setIsAlbumOpen(true)}
        onOpenMetodo={() => setIsMetodoModalOpen(true)}
        isFormOpen={isModalOpen}
      />

      {/* Form de Registro Inline quando aberto */}
      {isModalOpen && (
        <RegistrarLembrancaModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveMoment}
          studentName={DEFAULT_CHILD.nome}
        />
      )}

      {/* Árvore do Cultivo ou Floresta Coletiva */}
      {activeView === 'arvore' ? (
        <ArvoreCultivoCard
          treeStatus={treeStatus}
          childName={DEFAULT_CHILD.nome}
          onWaterTree={() => {
            setTreeStatus((prev) => ({
              ...prev,
              gestosDeAfeto: prev.gestosDeAfeto + 1,
            }));
          }}
        />
      ) : (
        <FlorestaDoSaberSection onSelectStudent={() => setActiveView('arvore')} />
      )}

      {/* Narrativa Afetiva (O Diário de Crescimento do Anjinho) & Legado */}
      <NarrativaAfetivaCard childName={DEFAULT_CHILD.nome} />

      {/* Método L.I.V.R.O. e Carta para o Futuro */}
      <MetodoLivroSection />

      {/* Feed de Momentos com Filtros e Gestos de Afeto */}
      <MomentosFeed
        moments={moments}
        onOpenNewMoment={() => setIsModalOpen(true)}
        onIncrementGesto={() => {
          setTreeStatus((prev) => ({
            ...prev,
            gestosDeAfeto: prev.gestosDeAfeto + 1,
          }));
        }}
      />

      {/* Modal Álbum da Primeira Infância */}
      <AlbumPrimeiraInfanciaModal
        isOpen={isAlbumOpen}
        onClose={() => setIsAlbumOpen(false)}
        student={DEFAULT_CHILD}
        moments={moments}
      />

      {/* Modal Entenda o Método Árvore da Inf */}
      <MetodoArvoreInfModal
        isOpen={isMetodoModalOpen}
        onClose={() => setIsMetodoModalOpen(false)}
      />

      {/* Botão Flutuante de Ação Rápida */}
      <button
        onClick={() => setIsModalOpen((prev) => !prev)}
        className={`fixed bottom-6 right-6 z-40 font-black text-xs sm:text-sm px-5 py-3.5 rounded-full shadow-2xl transition flex items-center gap-2 cursor-pointer active:scale-95 border-2 border-white ${
          isModalOpen
            ? 'bg-rose-500 hover:bg-rose-600 text-white'
            : 'bg-amber-400 hover:bg-amber-300 text-amber-950'
        }`}
      >
        <Camera size={18} />
        <span>{isModalOpen ? 'X Fechar Formulário' : '+ Registrar Lembrança'}</span>
      </button>
    </div>
  );
}
