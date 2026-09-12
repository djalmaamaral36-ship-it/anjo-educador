import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  FileText,
  FileCheck2,
  Lock,
  Search,
  Filter,
  Download,
  Printer,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Calendar,
  UserCheck,
  Scale,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Hash,
  Eye,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { StudentPaxData, LgpdConsentimento, LgpdLogRegistro } from '../../types';
import { PAX_STUDENTS } from '../../data/paxStudentsData';
import {
  getLgpdConsentimentos,
  getLgpdLogsAuditoria,
  salvarLgpdConsentimento,
} from '../../services/lgpdService';
import ModalConsentimentoLgpdInicial from './ModalConsentimentoLgpdInicial';
import CampoTextoVoz from '../comum/CampoTextoVoz';
import LogoAnjinhoEducador from '../comum/LogoAnjinhoEducador';
import ModalExportarRelatoriosPdf from '../relatorios/ModalExportarRelatoriosPdf';

interface Props {
  currentStudent: StudentPaxData;
  userRole: 'professor' | 'familia';
  onSelectStudent?: (id: string) => void;
}

export default function ModuloAuditoriaLgpd({
  currentStudent,
  userRole,
  onSelectStudent,
}: Props) {
  const [subTab, setSubTab] = useState<'termos' | 'livro_auditoria' | 'respaldo_juridico'>('termos');
  const [consentimentos, setConsentimentos] = useState<Record<string, LgpdConsentimento>>({});
  const [logsAuditoria, setLogsAuditoria] = useState<LgpdLogRegistro[]>([]);
  const [filtroAluno, setFiltroAluno] = useState<string>('todos');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Modal para assinar/atualizar termo
  const [showModalAssinatura, setShowModalAssinatura] = useState(false);
  const [alunoParaAssinar, setAlunoParaAssinar] = useState<StudentPaxData>(currentStudent);
  
  // Modal de Detalhes de Certidão Jurídica para Impressão
  const [termoVisualizacao, setTermoVisualizacao] = useState<LgpdConsentimento | null>(null);

  // Modal de Exportação Avançada em PDF (Diários, Prontuário, Ficha e Certidão LGPD)
  const [showPdfExportModal, setShowPdfExportModal] = useState(false);
  const [alunoParaPdf, setAlunoParaPdf] = useState<StudentPaxData>(currentStudent);

  const carregarDados = () => {
    setConsentimentos(getLgpdConsentimentos());
    setLogsAuditoria(getLgpdLogsAuditoria());
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const alunosArray = Object.values(PAX_STUDENTS);

  // Filtragem dos logs
  const logsFiltrados = logsAuditoria.filter((log) => {
    const matchAluno = filtroAluno === 'todos' || log.studentId === filtroAluno;
    const matchTipo = filtroTipo === 'todos' || log.tipo === filtroTipo;
    const matchBusca =
      !searchTerm ||
      log.studentNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.conteudoResumo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.remetenteNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.hashIntegridade.toLowerCase().includes(searchTerm.toLowerCase());
    return matchAluno && matchTipo && matchBusca;
  });

  const termoAlunoAtual = consentimentos[currentStudent.id] || null;

  const handleImprimirCertidao = (termo: LgpdConsentimento) => {
    setTermoVisualizacao(termo);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  return (
    <div className="space-y-6">
      {/* 1. CABEÇALHO OFICIAL DO MÓDULO LGPD & RESPALDO JURÍDICO */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white p-0.5 flex items-center justify-center shadow-xl flex-shrink-0 overflow-hidden">
              <LogoAnjinhoEducador variant="symbol" size="full" className="w-full h-full" />
            </div>
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-400 text-slate-950 shadow-xs">
                <ShieldCheck size={14} />
                <span>GOVERNANÇA & RESPALDO JURÍDICO DA ESCOLA (LEI 13.709/2018)</span>
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
                Área de LGPD & Auditoria de Comunicações
              </h2>
              <p className="text-xs sm:text-sm text-indigo-200 max-w-2xl leading-relaxed">
                Documentação probatória imutável de todas as mensagens via WhatsApp, diários de rotina, medicamentos ministrados e termos de consentimento formal assinados pelas famílias.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setAlunoParaPdf(currentStudent);
                setShowPdfExportModal(true);
              }}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white text-xs font-black rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer border border-indigo-400/30"
              title="Exportar Relatórios, Diários e Certidões em PDF"
            >
              <FileText size={16} />
              <span>Exportar Relatórios em PDF</span>
            </button>
            <button
              onClick={() => {
                setAlunoParaAssinar(currentStudent);
                setShowModalAssinatura(true);
              }}
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 active:scale-98 text-slate-950 text-xs font-black rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={16} />
              <span>Assinar / Atualizar Termo</span>
            </button>
            <button
              onClick={carregarDados}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition cursor-pointer"
              title="Recarregar livro de auditoria"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* CARDS DE ESTATÍSTICAS JURÍDICAS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Termos Ativos</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400">
              {Object.values(consentimentos).filter((c) => c.status === 'ativo').length} / {alunosArray.length}
            </span>
            <span className="text-[9px] text-slate-400 block mt-0.5">Alunos autorizados</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Auditoria Digital</span>
            <span className="text-xl sm:text-2xl font-black text-amber-300">
              {logsAuditoria.length}
            </span>
            <span className="text-[9px] text-slate-400 block mt-0.5">Registros imutáveis</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Disparos WhatsApp</span>
            <span className="text-xl sm:text-2xl font-black text-teal-300">
              {logsAuditoria.filter((l) => l.canal === 'whatsapp').length}
            </span>
            <span className="text-[9px] text-slate-400 block mt-0.5">Comprovantes guardados</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Integridade Cripto</span>
            <span className="text-xl sm:text-2xl font-black text-indigo-300">
              100%
            </span>
            <span className="text-[9px] text-slate-400 block mt-0.5">Carimbo com Hash SHA</span>
          </div>
        </div>
      </div>

      {/* 2. SUB-NAVEGAÇÃO DAS 3 SEÇÕES */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setSubTab('termos')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
            subTab === 'termos'
              ? 'bg-indigo-700 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <FileCheck2 size={16} />
          <span>1. Termos de Consentimento Assinados ({Object.keys(consentimentos).length})</span>
        </button>

        <button
          onClick={() => setSubTab('livro_auditoria')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
            subTab === 'livro_auditoria'
              ? 'bg-indigo-700 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <Smartphone size={16} />
          <span>2. Livro Digital de Disparos & WhatsApp ({logsAuditoria.length})</span>
        </button>

        <button
          onClick={() => setSubTab('respaldo_juridico')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
            subTab === 'respaldo_juridico'
              ? 'bg-indigo-700 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <Scale size={16} />
          <span>3. Cartilha Legal & Respaldo da Escola</span>
        </button>
      </div>

      {/* 3. CONTEÚDO DA SUB-ABA 1: TERMOS DE CONSENTIMENTO ASSINADOS */}
      {subTab === 'termos' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div>
              <h3 className="text-sm font-black text-slate-800">
                Gestão de Consentimentos por Aluno (Art. 14 da LGPD)
              </h3>
              <p className="text-xs text-slate-500">
                Cada responsável legal precisa ter um termo digital assinado com os 4 eixos de autorização.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-bold">Aluno em Foco:</span>
              <span className="text-xs font-black bg-indigo-50 text-indigo-800 border border-indigo-200 px-2.5 py-1 rounded-xl">
                {currentStudent.nome}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alunosArray.map((st) => {
              const termo = consentimentos[st.id];
              const isSelected = st.id === currentStudent.id;

              return (
                <div
                  key={st.id}
                  className={`bg-white rounded-3xl p-5 border transition shadow-xs flex flex-col justify-between gap-4 ${
                    isSelected
                      ? 'border-indigo-500 ring-2 ring-indigo-500/10'
                      : 'border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-3">
                    {/* TOPO DO CARD */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={st.fotoUrl}
                          alt={st.nome}
                          className="w-12 h-12 rounded-2xl object-cover border border-slate-200"
                        />
                        <div>
                          <h4 className="font-black text-slate-900 text-sm sm:text-base">{st.nome}</h4>
                          <span className="text-[11px] text-slate-500 font-medium block">
                            {st.turma} • Nasc: {st.nascimento}
                          </span>
                        </div>
                      </div>

                      {termo ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 size={12} />
                          <span>TERMO ATIVO</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                          <AlertCircle size={12} />
                          <span>PENDENTE</span>
                        </span>
                      )}
                    </div>

                    {/* DADOS DO TERMO */}
                    {termo ? (
                      <div className="space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-200/60 text-xs">
                        <div className="flex justify-between items-center text-slate-600">
                          <span className="font-bold">Responsável Legal:</span>
                          <span className="font-black text-slate-800">{termo.responsavelNome} ({termo.responsavelGrau})</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600">
                          <span className="font-bold">CPF Cadastrado:</span>
                          <span className="font-mono font-bold text-slate-700">{termo.responsavelCpf}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600">
                          <span className="font-bold">Data da Assinatura:</span>
                          <span className="text-slate-700">{termo.aceitoEmFormatado}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600">
                          <span className="font-bold">Hash Jurídico:</span>
                          <span className="font-mono text-[10px] font-black text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                            {termo.hashAssinaturaDigital}
                          </span>
                        </div>

                        {/* CLÁUSULAS */}
                        <div className="pt-2 border-t border-slate-200/70 grid grid-cols-2 gap-1.5 text-[10px] font-bold">
                          <span className={termo.autorizacoes.tratamentoDadosMenor ? 'text-emerald-700 flex items-center gap-1' : 'text-slate-400'}>
                            ✓ Dados do Menor (Art. 14)
                          </span>
                          <span className={termo.autorizacoes.comunicacaoWhatsAppERotina ? 'text-emerald-700 flex items-center gap-1' : 'text-slate-400'}>
                            ✓ WhatsApp & Diários
                          </span>
                          <span className={termo.autorizacoes.registroSaudeEMedicamentos ? 'text-emerald-700 flex items-center gap-1' : 'text-slate-400'}>
                            ✓ Saúde & Medicamentos
                          </span>
                          <span className={termo.autorizacoes.registroFotograficoPedagogico ? 'text-emerald-700 flex items-center gap-1' : 'text-slate-400'}>
                            ✓ Fotos Pedagógicas
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
                        <strong className="block font-black">Aguardando Aceite da Família</strong>
                        <p className="text-[11px] text-amber-800 leading-tight">
                          O responsável ainda não preencheu o termo na entrada do aplicativo. Você pode gerar a assinatura manual agora.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* AÇÕES */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    {termo ? (
                      <button
                        onClick={() => handleImprimirCertidao(termo)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                        title="Imprimir Certidão Oficial de Consentimento"
                      >
                        <Printer size={13} />
                        <span>Imprimir Certidão</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Sem certidão emitida</span>
                    )}

                    <button
                      onClick={() => {
                        setAlunoParaAssinar(st);
                        setShowModalAssinatura(true);
                      }}
                      className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-black rounded-xl transition border border-indigo-200 cursor-pointer flex items-center gap-1"
                    >
                      <span>{termo ? 'Atualizar Termo' : 'Assinar Termo Agora'}</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. CONTEÚDO DA SUB-ABA 2: LIVRO DIGITAL DE DISPAROS & AUDITORIA DE WHATSAPP */}
      {subTab === 'livro_auditoria' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
          {/* BARRA DE FILTROS & BUSCA */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex-1">
              <CampoTextoVoz
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Buscar por aluno, mensagem, remetente ou código hash..."
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filtroAluno}
                onChange={(e) => setFiltroAluno(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none focus:border-indigo-500"
              >
                <option value="todos">Todos os Alunos</option>
                {alunosArray.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nome}
                  </option>
                ))}
              </select>

              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none focus:border-indigo-500"
              >
                <option value="todos">Todos os Tipos de Log</option>
                <option value="whatsapp_diario">Diários de Rotina (WhatsApp)</option>
                <option value="whatsapp_recado">Recados Escolares (WhatsApp)</option>
                <option value="medicamento_ministrado">Medicamentos Ministrados</option>
                <option value="consentimento_assinado">Termos de Consentimento</option>
              </select>

              <button
                onClick={() => window.print()}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Imprimir Livro de Auditoria Digital"
              >
                <Printer size={13} />
                <span>Exportar Livro</span>
              </button>
            </div>
          </div>

          {/* LISTA / TABELA DE REGISTROS AUDITADOS */}
          <div className="space-y-3">
            {logsFiltrados.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs">
                Nenhum registro de auditoria encontrado com os filtros selecionados.
              </div>
            ) : (
              logsFiltrados.map((log) => (
                <div
                  key={log.id}
                  className="p-4 bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-2xl transition space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                        {log.hashIntegridade}
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                          log.canal === 'whatsapp'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : log.canal === 'app_mural'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-slate-200 text-slate-800'
                        }`}
                      >
                        {log.canal === 'whatsapp' ? '📲 WhatsApp Notificado' : '🖥️ Sistema / Mural'}
                      </span>
                      <span className="text-xs font-black text-slate-800">
                        {log.studentNome} ({log.turma})
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-500 font-medium">
                      {log.dataHoraFormatada}
                    </span>
                  </div>

                  <div className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200/80 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-500">
                      <span>
                        <strong>Remetente:</strong> {log.remetenteNome} ({log.remetenteCargo})
                      </span>
                      <span>
                        <strong>Destinatário:</strong> {log.destinatarioNome} {log.destinatarioContato ? `(${log.destinatarioContato})` : ''}
                      </span>
                    </div>
                    <p className="font-medium text-slate-800 pt-1">
                      {log.conteudoResumo}
                    </p>
                    {log.conteudoIntegral && log.conteudoIntegral !== log.conteudoResumo && (
                      <details className="pt-1 text-[11px] text-slate-600 cursor-pointer">
                        <summary className="font-bold text-indigo-600 hover:text-indigo-800">
                          Ver Conteúdo Integral Registrado
                        </summary>
                        <pre className="mt-1.5 p-2 bg-slate-900 text-slate-100 rounded-lg whitespace-pre-wrap font-mono text-[10px] overflow-x-auto leading-relaxed">
                          {log.conteudoIntegral}
                        </pre>
                      </details>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>
                      <strong>Fundamento Legal:</strong> {log.baseLegalLgpd}
                    </span>
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 size={11} />
                      Log Auditado e Válido Juridicamente
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 5. CONTEÚDO DA SUB-ABA 3: CARTILHA LEGAL & RESPALDO DA ESCOLA */}
      {subTab === 'respaldo_juridico' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-black">
              <Scale size={24} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                Diretrizes de Conformidade LGPD na Educação Infantil (Lei 13.709/2018)
              </h3>
              <p className="text-xs text-slate-500">
                Como o aplicativo Anjo Cuidador protege juridicamente a escola, os professores e as famílias.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-xs">
                  14
                </span>
                <h4 className="font-black text-slate-800 text-sm">Artigo 14: Tratamento de Dados de Crianças</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                O tratamento de dados pessoais de crianças deve ser realizado <strong>no seu melhor interesse</strong>, mediante <strong>consentimento específico e destacado</strong> fornecido por pelo menos um dos pais ou pelo responsável legal.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center font-black text-xs">
                  11
                </span>
                <h4 className="font-black text-slate-800 text-sm">Artigo 11: Dados Sensíveis de Saúde</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Informações sobre administração de medicamentos, febre, alergias e saúde do menor são dados sensíveis. O app exige <strong>validação de PIN de segurança pelos pais</strong> para cadastros e alterações.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs">
                  07
                </span>
                <h4 className="font-black text-slate-800 text-sm">Artigo 7º: Execução de Contrato Pedagógico</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                A prestação de contas diária e o envio de relatórios de permanência escolar cumprem o dever de cuidado e a obrigação legal e contratual da instituição de ensino.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center font-black text-xs">
                  18
                </span>
                <h4 className="font-black text-slate-800 text-sm">Artigo 18: Direitos dos Pais (Titulares)</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Os pais podem a qualquer momento consultar os dados registrados, solicitar certidões em PDF, retificar informações de saúde ou revogar autorizações pontuais.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ASSINATURA / ATUALIZAÇÃO DO TERMO LGPD */}
      <ModalConsentimentoLgpdInicial
        isOpen={showModalAssinatura}
        onClose={() => setShowModalAssinatura(false)}
        student={alunoParaAssinar}
        isObrigatorio={false}
        onConsentimentoConcluido={(novo) => {
          carregarDados();
          setShowModalAssinatura(false);
        }}
      />

      {/* CERTIDÃO PARA IMPRESSÃO (MODAL FORMAL) */}
      {termoVisualizacao && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 print:shadow-none print:border-none">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 p-0.5 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <LogoAnjinhoEducador variant="symbol" size="full" className="w-full h-full" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider block">
                    ANJINHO ESCOLAR • DOCUMENTO OFICIAL DE RESPALDO JURÍDICO
                  </span>
                  <h3 className="text-base font-black text-slate-900">
                    Certidão de Consentimento LGPD
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setTermoVisualizacao(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer print:hidden"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 leading-relaxed border border-slate-200 rounded-2xl p-4 bg-slate-50">
              <p>
                Certificamos para os devidos fins de direito e respaldo jurídico que em <strong>{termoVisualizacao.aceitoEmFormatado}</strong>, o(a) Sr(a). <strong>{termoVisualizacao.responsavelNome}</strong>, portador(a) do CPF <strong>{termoVisualizacao.responsavelCpf}</strong>, na qualidade de <strong>{termoVisualizacao.responsavelGrau}</strong> da criança <strong>{termoVisualizacao.studentNome}</strong> (Turma: {termoVisualizacao.turma}), firmou <strong>Assinatura Eletrônica e Consentimento Expresso</strong> nos termos da Lei Federal nº 13.709/2018 (LGPD).
              </p>

              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1 text-[11px]">
                <strong className="block text-slate-800">Cláusulas Atestadas:</strong>
                <div>✓ Tratamento de Dados do Menor (Art. 14 LGPD) — AUTORIZADO</div>
                <div>✓ Notificações e Diários via WhatsApp (Art. 7º LGPD) — AUTORIZADO</div>
                <div>✓ Registros de Saúde e Medicamentos (Art. 11 LGPD) — AUTORIZADO</div>
                <div>✓ Registros Fotográficos Pedagógicos Fechados — AUTORIZADO</div>
              </div>

              <div className="font-mono text-[10px] text-slate-500 pt-2 border-t border-slate-200 flex justify-between items-center">
                <span>Hash Criptográfico: {termoVisualizacao.hashAssinaturaDigital}</span>
                <span>Versão: {termoVisualizacao.versaoTermo}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 print:hidden">
              <button
                type="button"
                onClick={() => setTermoVisualizacao(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer size={14} />
                <span>Imprimir Documento</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Avançado de Exportação em PDF */}
      <ModalExportarRelatoriosPdf
        isOpen={showPdfExportModal}
        onClose={() => setShowPdfExportModal(false)}
        student={alunoParaPdf}
      />
    </div>
  );
}
