import React, { useState } from 'react';
import { Aluno, RotinaDia } from '../../types';
import { Smartphone, Heart, Moon, Utensils, Pill, Camera, Bell, ShieldAlert, CheckCircle2, UserCheck } from 'lucide-react';

interface FamiliasModuleProps {
  alunos: Aluno[];
  rotinas: Record<string, RotinaDia>;
  recadinhoTurmaMensagem: string;
}

export const FamiliasModule: React.FC<FamiliasModuleProps> = ({ alunos, rotinas, recadinhoTurmaMensagem }) => {
  const [alunoSelecionadoId, setAlunoSelecionadoId] = useState(alunos[0]?.id || '1');
  const aluno = alunos.find(a => a.id === alunoSelecionadoId) || alunos[0];
  const rotina = rotinas[alunoSelecionadoId] || {
    alunoId: alunoSelecionadoId,
    data: new Date().toISOString().split('T')[0],
    alimentacao: 'Excelente',
    sono: 'Dormiu bem',
    tempoSono: '1h 30min',
    higiene: 'Troca de fralda OK',
    evacuacao: 'Normal',
    humor: 'Alegre',
    atividades: ['Pintura a dedo', 'Roda de música'],
    recadinhoEducadora: 'Teve um dia muito produtivo!'
  };

  const [solicitandoMedicamento, setSolicitandoMedicamento] = useState(false);
  const [nomeMed, setNomeMed] = useState('');
  const [doseMed, setDoseMed] = useState('');
  const [horaMed, setHoraMed] = useState('');

  const handleEnviarMedicamento = () => {
    if (!nomeMed || !doseMed || !horaMed) return;
    alert(`Autorização de medicamento enviado para a escola com sucesso!\nRemédio: ${nomeMed} (${doseMed}) às ${horaMed}.`);
    setSolicitandoMedicamento(false);
    setNomeMed('');
    setDoseMed('');
    setHoraMed('');
  };

  return (
    <div className="space-y-6">
      {/* Banner Simulação do App dos Pais */}
      <div className="bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold w-fit mb-2">
            <Smartphone className="w-3.5 h-3.5 text-sky-200" />
            <span>Visão dos Responsáveis & Famílias</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">Diário Escolar no Celular dos Pais</h2>
          <p className="text-xs text-sky-100 mt-1 max-w-xl">
            Como os pais enxergam as atualizações em tempo real enviadas pela escola: alimentação, sono, fralda, medicamentos autorizados e o Recadinho da Educadora.
          </p>
        </div>

        {/* Seletor de Filho/Filha */}
        <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 text-xs font-semibold">
          <label className="text-[11px] text-sky-200 block mb-1">Selecione o Filho(a):</label>
          <select
            value={alunoSelecionadoId}
            onChange={(e) => setAlunoSelecionadoId(e.target.value)}
            className="bg-white text-slate-800 rounded-xl px-3 py-1.5 font-bold cursor-pointer text-xs focus:outline-none"
          >
            {alunos.map(a => (
              <option key={a.id} value={a.id}>{a.nome} ({a.turma})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Simulação de Celular com o Diário */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Mockup Celular dos Pais */}
        <div className="md:col-span-6 lg:col-span-5 mx-auto w-full max-w-sm bg-slate-900 rounded-[40px] p-4 shadow-2xl border-4 border-slate-800 relative">
          {/* Notch Celular */}
          <div className="w-28 h-4 bg-slate-800 rounded-full mx-auto mb-3"></div>

          {/* Tela do App dos Pais */}
          <div className="bg-slate-50 rounded-[28px] p-4 text-slate-800 space-y-4 max-h-[580px] overflow-y-auto">
            {/* Top Bar Pais */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-rose-500 text-white rounded-full flex items-center justify-center font-bold text-xs shadow-sm">
                  {aluno.nome.charAt(0)}
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">{aluno.nome}</h4>
                  <p className="text-[10px] text-slate-500">{aluno.turma}</p>
                </div>
              </div>

              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                Diário de Hoje
              </span>
            </div>

            {/* Resumo da Rotina */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-[11px]">
                  <Utensils className="w-3.5 h-3.5" />
                  <span>Alimentação</span>
                </div>
                <div className="font-semibold text-slate-800">{rotina.alimentacao}</div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                <div className="flex items-center gap-1.5 text-indigo-600 font-bold text-[11px]">
                  <Moon className="w-3.5 h-3.5" />
                  <span>Sono</span>
                </div>
                <div className="font-semibold text-slate-800">{rotina.sono} ({rotina.tempoSono || '1h'})</div>
              </div>
            </div>

            {/* Recadinho da Educadora no Final */}
            <div className="bg-gradient-to-br from-rose-500 to-pink-600 text-white p-4 rounded-2xl shadow-md space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-100">
                <Heart className="w-4 h-4 fill-white" />
                <span>Recadinho da Educadora</span>
              </div>
              <p className="text-xs leading-relaxed text-rose-50 italic bg-white/10 p-2.5 rounded-xl backdrop-blur-xs">
                "{recadinhoTurmaMensagem}"
              </p>
            </div>

            {/* Observação Individual */}
            {aluno.recadinhoIndividual && (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs space-y-1">
                <span className="font-bold text-amber-900 block">📌 Observação Individual para você:</span>
                <p className="text-amber-800">{aluno.recadinhoIndividual}</p>
              </div>
            )}
          </div>
        </div>

        {/* Lado Direito: Autorização de Medicamento pelos Pais */}
        <div className="md:col-span-6 lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-100 text-rose-700 rounded-xl flex items-center justify-center font-bold">
                <Pill className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Autorização de Medicamentos (Família)</h3>
                <p className="text-xs text-slate-500">Envie a receita e o horário para a professora administrar na escola</p>
              </div>
            </div>

            <button
              onClick={() => setSolicitandoMedicamento(!solicitandoMedicamento)}
              className="text-xs font-bold px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition"
            >
              + Nova Autorização
            </button>
          </div>

          {aluno.medicamentoAtivo ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-900 flex items-center gap-1.5">
                  <Pill className="w-4 h-4 text-rose-600" />
                  {aluno.medicamentoAtivo.nome} ({aluno.medicamentoAtivo.dosagem})
                </span>
                <span className="bg-rose-200 text-rose-800 font-bold px-2 py-0.5 rounded-md">
                  Horário: {aluno.medicamentoAtivo.horario}
                </span>
              </div>
              <p className="text-rose-800"><strong>Instruções:</strong> {aluno.medicamentoAtivo.instrucoes}</p>
              <p className="text-[11px] text-rose-700 font-medium">Autorizado por: {aluno.medicamentoAtivo.autorizadoPor}</p>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">Nenhum medicamento registrado para ministrar hoje.</p>
          )}

          {solicitandoMedicamento && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold text-slate-800">Formulário de Autorização de Remédio</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <input
                  type="text"
                  placeholder="Nome do Remédio (ex: Novalgina)"
                  value={nomeMed}
                  onChange={(e) => setNomeMed(e.target.value)}
                  className="p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
                <input
                  type="text"
                  placeholder="Dosagem (ex: 10 gotas)"
                  value={doseMed}
                  onChange={(e) => setDoseMed(e.target.value)}
                  className="p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
                <input
                  type="text"
                  placeholder="Horário (ex: 14:30)"
                  value={horaMed}
                  onChange={(e) => setHoraMed(e.target.value)}
                  className="p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setSolicitandoMedicamento(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEnviarMedicamento}
                  className="px-4 py-1.5 text-xs bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 shadow-sm"
                >
                  Confirmar Autorização
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
