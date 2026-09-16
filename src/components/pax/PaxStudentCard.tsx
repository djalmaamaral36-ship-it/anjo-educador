import React, { useState, useEffect } from 'react';
import { ShieldAlert, Users, Phone, Calendar, Heart, Plus, Sparkles, CheckCircle2, FileText, Printer, MessageSquare, Send } from 'lucide-react';
import { StudentPaxData } from '../../types';
import ModalExportarRelatoriosPdf from '../relatorios/ModalExportarRelatoriosPdf';
import ModalRelatorioWhatsApp from '../rotina/ModalRelatorioWhatsApp';
import { VoiceInput } from '../VoiceInput';

interface Props {
  student: StudentPaxData;
  userRole: 'professor' | 'familia';
  onOpenClassList?: () => void;
  onSelectStudent?: (id: string) => void;
  allStudents?: StudentPaxData[];
}

export default function PaxStudentCard({
  student,
  userRole,
  onOpenClassList,
  onSelectStudent,
  allStudents = [],
}: Props) {
  const [showAllergyModal, setShowAllergyModal] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  // Estados para Recados Coletivos e Individuais
  const [recadoColetivo, setRecadoColetivo] = useState<string>('Hoje a nossa turma teve um dia maravilhoso, repleto de sorrisos, descobertas e brincadeiras ao ar livre! 🌟');
  const [recadoIndividual, setRecadoIndividual] = useState<string>('');

  // Sincroniza o recado individual quando o aluno muda
  useEffect(() => {
    if (student.id === 'mariana_souza') {
      setRecadoIndividual("Mariana brincou na cabana sensorial e interagiu carinhosamente com os colegas.");
    } else {
      setRecadoIndividual(student.humor?.observacao || "");
    }
  }, [student.id, student.humor?.observacao]);

  // Combina coletivo e individual conforme a inteligência do gerador
  const obterRecadoCombinado = () => {
    const coletivoLimpo = recadoColetivo.trim();
    const individualLimpo = recadoIndividual.trim();
    
    if (coletivoLimpo && individualLimpo) {
      return `${coletivoLimpo}\n\n📝 *Relato Individual de ${student.nome}:*\n${individualLimpo}`;
    }
    if (coletivoLimpo) {
      return coletivoLimpo;
    }
    if (individualLimpo) {
      return individualLimpo;
    }
    return "";
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-6">
      {/* Barra de Troca Rápida de Aluno (Apenas Professor) */}
      {userRole === 'professor' && allStudents.length > 0 && (
        <div className="pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <span className="text-[11px] font-black uppercase text-indigo-950 flex items-center gap-1.5 tracking-wider">
              <Users size={14} className="text-indigo-600" />
              <span>Troca Rápida de Aluno na Turma ({allStudents.length} Crianças):</span>
            </span>
            {onOpenClassList && (
              <button
                type="button"
                onClick={onOpenClassList}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
              >
                Ver Lista Geral &gt;
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
            {allStudents.map((st) => {
              const isSelected = st.id === student.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => onSelectStudent && onSelectStudent(st.id)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-2xl border transition-all cursor-pointer flex-shrink-0 text-left ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-300'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full overflow-hidden border border-white/50 flex-shrink-0">
                    <img src={st.fotoUrl} alt={st.nome} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-xs font-bold whitespace-nowrap">
                    {st.nome.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
        {/* Child Avatar */}
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden bg-amber-100 border-2 border-indigo-100 shadow-md flex-shrink-0 relative">
          <img
            src={student.fotoUrl}
            alt={student.nome}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-1.5 right-1.5 bg-emerald-500 text-white rounded-full p-0.5 shadow">
            <CheckCircle2 size={12} />
          </div>
        </div>

        {/* Child Info */}
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
              {student.nome}
            </h3>
            <span className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
              Aluno Verificado
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-slate-600 font-medium">
            <p className="flex items-center gap-1.5">
              <span className="font-bold text-slate-800">Resp:</span>
              <span>
                {student.responsavelNome} ({student.responsavelParentesco})
              </span>
              <span className="text-slate-400 font-mono text-xs">{student.responsavelTelefone}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
            <p className="flex items-center gap-1">
              <Calendar size={13} className="text-indigo-600" />
              <span>
                Nascimento: <strong className="text-slate-700">{student.nascimento}</strong> ({student.idadeStr})
              </span>
            </p>
            <p className="flex items-center gap-1.5">
              <span>Professora Titular:</span>
              <strong className="text-slate-800">{student.professoraTitular}</strong>
              <span className="text-[10px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded-md">
                {student.turma}
              </span>
            </p>
          </div>

          {/* Tags & Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {student.marcos.map((marco, i) => (
              <span
                key={i}
                className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 flex items-center gap-1"
              >
                <span>🏃</span> {marco}
              </span>
            ))}

            {student.alergias.map((alergia, i) => (
              <span
                key={i}
                className="text-xs font-black text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs"
              >
                <ShieldAlert size={14} className="text-rose-600" />
                <span>Alergia: {alergia}</span>
              </span>
            ))}

            <button
              onClick={() => setShowAllergyModal(true)}
              className="text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50/70 hover:bg-indigo-100 border border-indigo-200/60 px-3 py-1 rounded-full flex items-center gap-1 transition cursor-pointer"
            >
              <Plus size={13} />
              <span>+ Novo Alerta/Alergia</span>
            </button>

            <button
              onClick={() => setShowPdfModal(true)}
              className="text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 border border-indigo-700 px-3 py-1 rounded-full flex items-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95 ml-auto"
              title="Gerar Diário Oficial, Ficha Cadastral ou Parecer Pedagógico em PDF"
            >
              <FileText size={13} />
              <span>📄 Relatório em PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Blue Informational Box: Painel da Sala e Switcher */}
      <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
            <Users size={18} />
          </div>
          <div>
            <h5 className="text-xs sm:text-sm font-black text-indigo-950">Painel da Sala e Switcher</h5>
            <p className="text-xs text-indigo-800/80 mt-0.5">
              Você está visualizando a ficha de {student.nome}. Turma com {allStudents.length || 10} alunos cadastrados.
            </p>
          </div>
        </div>

        {onOpenClassList && userRole === 'professor' && (
          <button
            onClick={onOpenClassList}
            className="text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition shadow-xs cursor-pointer flex-shrink-0 self-stretch sm:self-auto text-center"
          >
            Ver Lista Geral ({allStudents.length || 10} Alunos) &gt;
          </button>
        )}
        {userRole === 'familia' && (
          <span className="text-[11px] font-black text-indigo-700 bg-white border border-indigo-200 px-3 py-1.5 rounded-xl self-stretch sm:self-auto text-center">
            Filho: {student.nome}
          </span>
        )}
      </div>

      {/* Seção Inteligente de Recados e Gerador de WhatsApp (Apenas Professora) */}
      {userRole === 'professor' && (
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-2xs">
              <MessageSquare size={16} />
            </div>
            <div>
              <h5 className="text-xs sm:text-sm font-black text-slate-800">
                Gerador Inteligente de Diário Escolar (WhatsApp)
              </h5>
              <p className="text-[11px] text-slate-500">
                Preencha e combine o recado coletivo da turma com o relato de desenvolvimento individual de {student.nome.split(' ')[0]}.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Campo Coletivo */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Users size={12} className="text-indigo-600" />
                  <span>Recado Coletivo (Geral da Turma)</span>
                </label>
                <VoiceInput 
                  onTranscript={(text) => setRecadoColetivo(prev => prev ? `${prev} ${text}` : text)} 
                  size="sm" 
                />
              </div>
              <textarea
                value={recadoColetivo}
                onChange={(e) => setRecadoColetivo(e.target.value)}
                rows={3}
                placeholder="Insira a mensagem que vale para toda a turma..."
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-medium transition resize-none"
              />
            </div>

            {/* Campo Individual */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Heart size={12} className="text-rose-600" />
                  <span>Relato Individual (de {student.nome.split(' ')[0]})</span>
                </label>
                <VoiceInput 
                  onTranscript={(text) => setRecadoIndividual(prev => prev ? `${prev} ${text}` : text)} 
                  size="sm" 
                />
              </div>
              <textarea
                value={recadoIndividual}
                onChange={(e) => setRecadoIndividual(e.target.value)}
                rows={3}
                placeholder="Escreva como foi o desenvolvimento individual hoje..."
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-medium transition resize-none"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            <div className="text-[10px] text-slate-500 flex items-center gap-1.5 font-medium">
              <Sparkles size={12} className="text-amber-500" />
              <span>
                {recadoColetivo.trim() && recadoIndividual.trim()
                  ? '✨ Os dois recados serão combinados de forma linda automaticamente no final!'
                  : recadoColetivo.trim()
                  ? '✨ Apenas o recado Coletivo será gerado no relatório.'
                  : recadoIndividual.trim()
                  ? '✨ Apenas o relato Individual será gerado no relatório.'
                  : '⚠️ Escreva pelo menos um recado para gerar o boletim.'}
              </span>
            </div>
            
            <button
              type="button"
              onClick={() => setShowWhatsAppModal(true)}
              disabled={!recadoColetivo.trim() && !recadoIndividual.trim()}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send size={13} />
              <span>Gerar Relatório WhatsApp</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal de Alerta/Alergia */}
      {showAllergyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert size={20} className="text-rose-600" />
                <h3 className="text-base font-black text-slate-800">Protocolo de Alergias & Cuidados</h3>
              </div>
              <button
                onClick={() => setShowAllergyModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2">
              <p>
                <strong>Alergias registradas no prontuário oficial:</strong>
              </p>
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 font-bold">
                ⚠️ {student.alergias.join(', ')}
              </div>
              <p className="text-[11px] text-slate-500 pt-1">
                {userRole === 'familia'
                  ? 'Como medida de segurança biológica, novas inclusões de alergias requerem laudo pediátrico e devem ser solicitadas à coordenação escolar.'
                  : 'Educadores podem adicionar observações temporárias no diário de saúde.'}
              </p>
            </div>

            <button
              onClick={() => setShowAllergyModal(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-black rounded-xl transition cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Modal de Exportação de Relatórios Oficiais em PDF */}
      <ModalExportarRelatoriosPdf
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        student={student}
      />

      {/* Modal de Relatório do WhatsApp com comentários inteligentes combinados */}
      {showWhatsAppModal && (
        <ModalRelatorioWhatsApp
          isOpen={showWhatsAppModal}
          onClose={() => setShowWhatsAppModal(false)}
          student={student}
          tempoEmAula={student.presenca?.tempoEmAulaFormatado || '08:00:00'}
          aguaMl={student.agua?.consumoMl || 250}
          mamadeirasContador={student.alimentacao?.mamadeirasServidas || 1}
          refeicaoTipo={student.alimentacao?.refeicoes?.[0]?.nome || 'Mamadeira de Leite'}
          aceitacao={student.alimentacao?.refeicoes?.[0]?.status || 'Comeu Tudo / Super Bem'}
          humor={student.humor?.estado || 'Calmo / Sereno'}
          humorObs={obterRecadoCombinado()}
          soneca={student.saudeCards?.soneca?.valor || 'Dormiu bem'}
          fralda={student.saudeCards?.fraldas?.valor || 'Fralda limpa'}
          temperatura={student.saudeCards?.temperatura?.valor || '36.5'}
          checklistCount={5}
        />
      )}
    </div>
  );
}
