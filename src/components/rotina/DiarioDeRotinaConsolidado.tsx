import React, { useState } from 'react';
import RoutineCard from './RoutineCard';
import { Calendar, Plus, CheckCircle, Clock, Sparkles, FileText, Printer } from 'lucide-react';
import ModalExportarRelatoriosPdf from '../relatorios/ModalExportarRelatoriosPdf';
import { PAX_STUDENTS } from '../../data/paxStudentsData';
import { getTodayPtBr } from '../../utils/formatters';

interface Props {
  studentName?: string;
}

export default function DiarioDeRotinaConsolidado({ studentName = 'Mariana Souza' }: Props) {
  const [dataSelecionada, setDataSelecionada] = useState(`Hoje (${getTodayPtBr()})`);
  const [registradoComSucesso, setRegistradoComSucesso] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);

  // Busca dados do aluno para exportação oficial
  const student =
    Object.values(PAX_STUDENTS).find((s) => s.nome.toLowerCase().includes(studentName.toLowerCase())) ||
    PAX_STUDENTS['mariana_souza'] ||
    PAX_STUDENTS['enzo_alencar'];

  // Estados consolidados do período
  const [hidratacaoTotal, setHidratacaoTotal] = useState(450);
  const [trocasFralda, setTrocasFralda] = useState(3);
  const [sonoTempo, setSonoTempo] = useState('1h30 de sono');
  const [temperatura, setTemperatura] = useState('36.5°C');
  const [alimentacaoStatus, setAlimentacaoStatus] = useState('Comeu tudo com ótima aceitação');

  const handleQuickAdd = (tipo: string) => {
    if (tipo === 'agua') setHidratacaoTotal((prev) => prev + 100);
    if (tipo === 'fralda') setTrocasFralda((prev) => prev + 1);
    setRegistradoComSucesso(true);
    setTimeout(() => setRegistradoComSucesso(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header do Diário de Rotina Integrado */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider bg-blue-100 text-blue-900 px-2.5 py-1 rounded-full">
              DIÁRIO ESCOLAR INTEGRADO
            </span>
            <span className="text-xs text-slate-500 font-bold">Maternal I</span>
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight mt-1">
            Diário de Rotina de {studentName}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Resumo único e consolidado do turno, integrado à rotina pedagógica.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-700">
            <Calendar size={16} className="text-indigo-600" />
            <span>{dataSelecionada}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowPdfModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black text-xs shadow-xs transition cursor-pointer"
            title="Exportar Diário de Rotina Oficial em PDF formatado para Impressão e WhatsApp"
          >
            <FileText size={15} />
            <span>Exportar Diário em PDF</span>
          </button>
        </div>
      </div>

      {registradoComSucesso && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle size={18} className="text-emerald-600" />
          <span>Registro consolidado com sucesso na rotina de {studentName}!</span>
        </div>
      )}

      {/* Grid com Cards Consolidados (Sem repetição de linhas) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* 1. Alimentação */}
        <RoutineCard
          id="card-alimentacao"
          title="Alimentação"
          icon="🍽️"
          badge="Excelente"
          badgeColor="bg-emerald-100 text-emerald-800"
          summary={alimentacaoStatus}
          details={[
            'Café da manhã: Frutas frescas (banana e mamão)',
            'Almoço: Arroz, feijão, purê de abóbora e franguinho desfiado (comeu tudo)',
            'Lanche da tarde: Suco de maçã integral e biscoito de aveia',
          ]}
          actionLabel="+ Atualizar Refeição"
          onAction={() => alert('Abrir registro de refeição consolidada')}
        />

        {/* 2. Hidratação */}
        <RoutineCard
          id="card-hidratacao"
          title="Hidratação"
          icon="💧"
          badge={`${hidratacaoTotal} ml ingeridos`}
          badgeColor="bg-blue-100 text-blue-800"
          summary={`Consumo hídrico adequado ao longo do período (${hidratacaoTotal} ml).`}
          details={[
            'Oferecida água filtrada periodicamente em copinho próprio',
            'Aceitou com facilidade após as brincadeiras no sol matinal',
          ]}
          actionLabel="+ Oferecer +100ml de Água"
          onAction={() => handleQuickAdd('agua')}
        />

        {/* 3. Sono & Descanso */}
        <RoutineCard
          id="card-sono"
          title="Sono & Descanso"
          icon="😴"
          badge={sonoTempo}
          badgeColor="bg-indigo-100 text-indigo-800"
          summary="Soneca tranquila no colchonete com música de ninar suave."
          details={[
            'Início: 12h45 | Despertar espontâneo: 14h15',
            'Sono calmo e contínuo, acordou disposta e sorridente',
          ]}
          actionLabel="+ Ajustar Horário do Sono"
          onAction={() => alert('Ajustar sono')}
        />

        {/* 4. Higiene & Fraldas */}
        <RoutineCard
          id="card-higiene"
          title="Fraldas & Higiene"
          icon="🧴"
          badge={`${trocasFralda} trocas realizadas`}
          badgeColor="bg-amber-100 text-amber-900"
          summary="Pele íntegra, higiene completa com aplicação de pomada preventiva."
          details={[
            '10h00: Xixi normal',
            '13h00: Xixi normal (antes da soneca)',
            '15h30: Evacuação de consistência normal',
          ]}
          actionLabel="+ Registrar Nova Troca"
          onAction={() => handleQuickAdd('fralda')}
        />

        {/* 5. Saúde & Temperatura */}
        <RoutineCard
          id="card-saude"
          title="Saúde & Bem-Estar"
          icon="❤️"
          badge={temperatura}
          badgeColor="bg-emerald-100 text-emerald-800"
          summary="Temperatura aferida normal, sem queixas ou sinais de desconforto."
          details={[
            'Aferição das 13h30: 36,5°C',
            'Nenhuma medicação ministrada no período',
            'Disposição física plena para todas as atividades',
          ]}
          actionLabel="+ Aferir Temperatura"
          onAction={() => alert('Aferir temperatura')}
        />

        {/* 6. Humor & Disposição */}
        <RoutineCard
          id="card-humor"
          title="Humor & Emoções"
          icon="😊"
          badge="Alegre & Sereno"
          badgeColor="bg-pink-100 text-pink-800"
          summary="Muito participativa, interagiu com entusiasmo com as colegas."
          details={[
            'Bateu palminhas na cantiga da acolhida',
            'Sorriu e abraçou a professora com carinho',
          ]}
          actionLabel="+ Registrar Observação de Humor"
          onAction={() => alert('Registrar observação')}
        />
      </div>

      {/* Modal de Exportação do Diário em PDF */}
      <ModalExportarRelatoriosPdf
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        student={student}
      />
    </div>
  );
}
