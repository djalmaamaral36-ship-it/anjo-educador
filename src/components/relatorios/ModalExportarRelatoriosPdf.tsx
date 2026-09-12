import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Download,
  Share2,
  CheckCircle2,
  Sparkles,
  Eye,
  Calendar,
  User,
  Shield,
  HeartPulse,
  BookOpen,
  X,
} from 'lucide-react';
import { StudentPaxData } from '../../types';
import LogoAnjinhoEducador from '../comum/LogoAnjinhoEducador';
import {
  RelatorioConfig,
  gerarRelatorioPdfHtml,
  imprimirOuExportarPdf,
} from '../../services/relatoriosPdfService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  student: StudentPaxData;
  schoolName?: string;
  schoolSlogan?: string;
}

export default function ModalExportarRelatoriosPdf({
  isOpen,
  onClose,
  student,
  schoolName = 'Anjinho Educador',
  schoolSlogan = 'Onde a infância é registrada para sempre',
}: Props) {
  const [tipoSelecionado, setTipoSelecionado] = useState<RelatorioConfig['tipo']>('diario_rotina');
  const [incluirFotos, setIncluirFotos] = useState(true);
  const [incluirAssinaturas, setIncluirAssinaturas] = useState(true);
  const [incluirHashSeguranca, setIncluirHashSeguranca] = useState(true);
  const [observacaoEducador, setObservacaoEducador] = useState('');
  const [modoVisualizacao, setModoVisualizacao] = useState(false);
  const [copiadoLink, setCopiadoLink] = useState(false);

  if (!isOpen) return null;

  const configAtual: RelatorioConfig = {
    tipo: tipoSelecionado,
    dataEmissao: new Date().toLocaleDateString('pt-BR'),
    incluirFotos,
    incluirAssinaturas,
    incluirHashSeguranca,
    observacaoEducador: observacaoEducador.trim() || undefined,
  };

  const tiposDisponiveis = [
    {
      id: 'diario_rotina' as const,
      titulo: 'Diário de Rotina do Dia',
      sub: 'Alimentação, sono, hidratação, trocas de fralda, humor e observação pedagógica.',
      icon: BookOpen,
      badge: 'Mais Emitido',
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 'ficha_individual' as const,
      titulo: 'Ficha Individual & Marcos da Infância',
      sub: 'Dados cadastrais completos, filiação, emergência e marcos do desenvolvimento.',
      icon: User,
      badge: 'Completo',
      badgeColor: 'bg-indigo-100 text-indigo-800',
    },
    {
      id: 'parecer_pedagogico' as const,
      titulo: 'Parecer Pedagógico Semestral',
      sub: 'Avaliação descritiva segundo a BNCC (campos de experiência) e vivências coletivas.',
      icon: Sparkles,
      badge: 'Pedagógico',
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'prontuario_saude' as const,
      titulo: 'Prontuário Médico & Medicações',
      sub: 'Alergias, prescrições de remédios com PIN, orientações e contato do pediatra.',
      icon: HeartPulse,
      badge: 'Segurança',
      badgeColor: 'bg-rose-100 text-rose-800',
    },
    {
      id: 'certidao_lgpd' as const,
      titulo: 'Certidão Legal de Consentimento LGPD',
      sub: 'Comprovante probatório com hash de integridade, carimbo de IP e autorizações dos pais.',
      icon: Shield,
      badge: 'Jurídico',
      badgeColor: 'bg-blue-100 text-blue-800',
    },
  ];

  const handleGerarPdf = () => {
    imprimirOuExportarPdf(student, configAtual, schoolName, schoolSlogan);
  };

  const handleCompartilharWhatsApp = () => {
    const texto = encodeURIComponent(
      `Olá, família de ${student.nome}! 🌸\n` +
      `Aqui está o relatório oficial emitido pela equipe do *${schoolName}*.\n\n` +
      `📌 *Tipo:* ${tiposDisponiveis.find((t) => t.id === tipoSelecionado)?.titulo}\n` +
      `📅 *Data:* ${new Date().toLocaleDateString('pt-BR')}\n` +
      `👩‍🏫 *Educadora Responsável:* ${student.professoraTitular}\n\n` +
      `O documento oficial em PDF com hash de autenticidade foi gerado pelo sistema escolar.`
    );
    const foneLimpo = student.responsavelTelefone.replace(/\D/g, '');
    const url = `https://wa.me/55${foneLimpo}?text=${texto}`;
    window.open(url, '_blank');
  };

  const previewHtml = gerarRelatorioPdfHtml(student, configAtual, schoolName, schoolSlogan);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Cabeçalho do Modal */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white p-0.5 flex items-center justify-center flex-shrink-0 shadow-md overflow-hidden">
              <LogoAnjinhoEducador variant="symbol" size="full" className="w-full h-full" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950">
                  EXPORTAÇÃO OFICIAL PDF
                </span>
                <span className="text-xs text-indigo-300 font-bold">A4 Formato Oficial</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white mt-0.5">
                Central de Relatórios & Diários em PDF
              </h2>
              <p className="text-xs text-slate-300">
                Aluno(a): <strong className="text-white">{student.nome}</strong> • {student.turma}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
            title="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Corpo com Configuração e Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Seletor de Tipos de Relatórios */}
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-2.5">
              1. Selecione o Tipo de Relatório
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {tiposDisponiveis.map((item) => {
                const Icon = item.icon;
                const selecionado = tipoSelecionado === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTipoSelecionado(item.id)}
                    className={`p-3.5 rounded-2xl text-left transition border cursor-pointer flex flex-col justify-between ${
                      selecionado
                        ? 'bg-indigo-50/80 border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            selecionado ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Icon size={16} />
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      </div>
                      <h4 className="text-xs font-black text-slate-900 leading-snug">{item.titulo}</h4>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{item.sub}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold">
                      <span className={selecionado ? 'text-indigo-700 font-black' : 'text-slate-400'}>
                        {selecionado ? '✓ Selecionado' : 'Clique para escolher'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Opções de Customização & Observação do Educador */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2 border-t border-slate-100">
            
            {/* Opções de layout */}
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500 block">
                2. Configurações de Impressão
              </label>

              <div className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <label className="flex items-center gap-2.5 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={incluirFotos}
                    onChange={(e) => setIncluirFotos(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Incluir foto oficial do aluno no cabeçalho</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={incluirAssinaturas}
                    onChange={(e) => setIncluirAssinaturas(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Incluir campos de assinatura (Professora e Direção)</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={incluirHashSeguranca}
                    onChange={(e) => setIncluirHashSeguranca(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Carimbo de integridade criptográfica & Conformidade LGPD</span>
                </label>
              </div>

              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                <Sparkles size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p>
                  <strong>Dica de Impressão:</strong> Na tela de impressão que se abrir, selecione o destino <strong>"Salvar como PDF"</strong> para baixar o arquivo no computador ou celular.
                </p>
              </div>
            </div>

            {/* Campo de observação personalizada */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                  3. Parecer / Observação da Educadora (Opcional)
                </label>
                <span className="text-[10px] text-slate-400">Personaliza o documento</span>
              </div>
              <textarea
                value={observacaoEducador}
                onChange={(e) => setObservacaoEducador(e.target.value)}
                placeholder="Ex.: Criança muito participativa nas atividades pedagógicas de hoje. Demonstrou autonomia, carinho com os colegas e excelente aceitação da alimentação..."
                rows={5}
                className="w-full p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Botão de Toggle da Pré-visualização */}
          <div>
            <button
              type="button"
              onClick={() => setModoVisualizacao(!modoVisualizacao)}
              className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1.5 cursor-pointer"
            >
              <Eye size={15} />
              <span>{modoVisualizacao ? 'Ocultar Pré-visualização A4' : 'Visualizar Folha A4 antes de gerar'}</span>
            </button>

            {modoVisualizacao && (
              <div className="mt-3 border border-slate-300 rounded-2xl overflow-hidden shadow-inner bg-slate-200 p-3">
                <div className="bg-white rounded-xl shadow-md p-2 overflow-x-auto max-h-96">
                  <iframe
                    title="Pré-visualização do Relatório"
                    srcDoc={previewHtml}
                    className="w-full h-[600px] border-0"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rodapé com Botões de Ação */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Shield size={14} className="text-teal-600" />
            <span>Documento timbrado com identidade visual oficial do <strong>{schoolName}</strong></span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCompartilharWhatsApp}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
              title="Notificar família no WhatsApp"
            >
              <Share2 size={15} />
              <span>Avisar via WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleGerarPdf}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
            >
              <Printer size={15} />
              <span>Salvar PDF / Imprimir</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
