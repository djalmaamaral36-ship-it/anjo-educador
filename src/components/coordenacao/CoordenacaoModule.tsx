import React, { useState } from 'react';
import {
  GraduationCap,
  AlertTriangle,
  FileText,
  HeartHandshake,
  Search,
  Plus,
  Trash2,
  Copy,
  Check,
  Send,
  Sparkles,
  Users,
  Clock,
  Shield,
  ShieldAlert,
  Info,
  ChevronRight,
  Filter,
  Eye,
  CheckCircle2,
  Lock,
  MessageCircle,
  Edit3
} from 'lucide-react';
import {
  AlertaIdentificacaoPrecoce,
  EncaminhamentoEspecialista,
  OcorrenciaMediacao,
  ALERTAS_PRECOCES_INICIAIS,
  ENCAMINHAMENTOS_INICIAIS,
  OCORRENCIAS_MEDIAS_INICIAIS
} from '../../data/coordenacaoData';
import { PAX_STUDENTS } from '../../data/paxStudentsData';
import CampoTextoVoz from '../comum/CampoTextoVoz';
import { formatDatePtBr, formatDateTimePtBr, getTodayPtBr, getNowPtBr } from '../../utils/formatters';

interface Props {
  userRole?: 'professor' | 'familia';
}

export default function CoordenacaoModule({ userRole = 'professor' }: Props) {
  const [activeTab, setActiveTab] = useState<'identificacao' | 'encaminhamentos' | 'conflitos'>('identificacao');
  const [selectedTurmaFiltro, setSelectedTurmaFiltro] = useState<'todas' | 'bercario' | 'maternal'>('todas');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // States for Identificação Precoce
  const [alertasList, setAlertasList] = useState<AlertaIdentificacaoPrecoce[]>(ALERTAS_PRECOCES_INICIAIS);
  const [selectedAlunoAlerta, setSelectedAlunoAlerta] = useState<string>('Mariana Souza');
  const [alunoSearchTerm, setAlunoSearchTerm] = useState('');
  const [areaAlerta, setAreaAlerta] = useState<AlertaIdentificacaoPrecoce['area']>('Fala & Linguagem');
  const [severidadeAlerta, setSeveridadeAlerta] = useState<AlertaIdentificacaoPrecoce['severidade']>('Moderada / Frequente');
  const [sinteseAlerta, setSinteseAlerta] = useState('');
  const [obsAlerta, setObsAlerta] = useState('');
  const [showNovoAlertaForm, setShowNovoAlertaForm] = useState(false);

  // States for Encaminhamentos
  const [encaminhamentosList, setEncaminhamentosList] = useState<EncaminhamentoEspecialista[]>(ENCAMINHAMENTOS_INICIAIS);
  const [searchEncaminhamento, setSearchEncaminhamento] = useState('');
  const [showNovoEncModal, setShowNovoEncModal] = useState(false);
  const [novoEncAluno, setNovoEncAluno] = useState('Arthur Silva');
  const [novoEncTurma, setNovoEncTurma] = useState('Maternal I');
  const [novoEncEspecialidade, setNovoEncEspecialidade] = useState<EncaminhamentoEspecialista['especialidade']>('Fonoaudiologia');
  const [novoEncMotivo, setNovoEncMotivo] = useState('');
  const [novoEncProf, setNovoEncProf] = useState('Coordenação Pedagógica');

  // Edit Encaminhamento / Devolutiva Fono
  const [selectedEncToEdit, setSelectedEncToEdit] = useState<EncaminhamentoEspecialista | null>(null);
  const [editEncStatus, setEditEncStatus] = useState<EncaminhamentoEspecialista['statusRetorno']>('Aguardando Avaliação Externa');
  const [editEncParecer, setEditEncParecer] = useState('');
  const [editEncProfissional, setEditEncProfissional] = useState('Dra. Juliana Costa - Fonoaudióloga');

  // States for Mediação de Conflitos
  const [ocorrenciasList, setOcorrenciasList] = useState<OcorrenciaMediacao[]>(OCORRENCIAS_MEDIAS_INICIAIS);
  const [searchConflito, setSearchConflito] = useState('');
  const [showNovoConflitoForm, setShowNovoConflitoForm] = useState(false);
  const [novoConfTurma, setNovoConfTurma] = useState('Maternal II');
  const [novoConfAlunos, setNovoConfAlunos] = useState('');
  const [novoConfHorario, setNovoConfHorario] = useState('10:15');
  const [novoConfDescricao, setNovoConfDescricao] = useState('');
  const [novoConfMedidas, setNovoConfMedidas] = useState('');
  const [novoConfPaisNotificados, setNovoConfPaisNotificados] = useState(true);

  const alunosTurmaDisponiveis = [
    { nome: 'Mariana Souza', turma: 'Berçário I - A', status: 'Sinais Registrados' },
    { nome: 'Laura Costa', turma: 'Berçário I - A', status: 'Monitorado' },
    { nome: 'Enzo Alencar', turma: 'Maternal I - A', status: 'Sinais Registrados' },
    { nome: 'Beatriz Castro', turma: 'Berçário I - A', status: 'Monitorado' },
    { nome: 'Bernardo Teixeira', turma: 'Maternal I - A', status: 'Monitorado' },
    { nome: 'Cecília Duarte', turma: 'Berçário I - A', status: 'Monitorado' },
    { nome: 'Alice Santos', turma: 'Berçário I - A', status: 'Monitorado' },
    { nome: 'Lucas Oliveira', turma: 'Maternal I - A', status: 'Monitorado' },
    { nome: 'Helena Ferreira', turma: 'Berçário I - A', status: 'Monitorado' },
    { nome: 'Gabriel Mendes', turma: 'Maternal I - A', status: 'Monitorado' },
  ];

  const alunosFiltradosBusca = alunosTurmaDisponiveis.filter((al) => {
    if (selectedTurmaFiltro === 'bercario' && !al.turma.includes('Berçário')) return false;
    if (selectedTurmaFiltro === 'maternal' && !al.turma.includes('Maternal')) return false;
    if (alunoSearchTerm.trim()) {
      return al.nome.toLowerCase().includes(alunoSearchTerm.toLowerCase());
    }
    return true;
  });

  const handleCopiarMensagem = (id: string, texto: string) => {
    navigator.clipboard.writeText(texto);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  const handleSalvarAlerta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sinteseAlerta.trim()) return;

    const novoAlerta: AlertaIdentificacaoPrecoce = {
      id: `alerta_${Date.now()}`,
      alunoNome: selectedAlunoAlerta,
      turma: selectedAlunoAlerta === 'Enzo Alencar' ? 'Maternal I - A' : 'Berçário I - A',
      area: areaAlerta,
      severidade: severidadeAlerta,
      sintese: sinteseAlerta.trim(),
      observacaoObjetiva: obsAlerta.trim() || 'Acompanhamento contínuo registrado pela coordenação.',
      registradoPor: 'Coordenação Pedagógica',
      dataRegistro: getTodayPtBr(),
      status: 'Em Monitoramento',
      mensagemAcolhimentoSugerida: `*Olá, família de ${selectedAlunoAlerta}! Esperamos que estejam bem. Em nossas vivências pedagógicas, notamos detalhes especiais no desenvolvimento de ${selectedAlunoAlerta}. Gostaríamos de convidá-los para um acolhimento com nossa coordenação nesta semana para conversarmos juntos em parceria pelo bem-estar da criança. Abraços carinhosos!*`
    };

    setAlertasList([novoAlerta, ...alertasList]);
    setSinteseAlerta('');
    setObsAlerta('');
    setShowNovoAlertaForm(false);
  };

  const handleSalvarEncaminhamento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoEncMotivo.trim()) return;

    const novoEnc: EncaminhamentoEspecialista = {
      id: `enc_${Date.now()}`,
      alunoNome: novoEncAluno,
      turma: novoEncTurma,
      especialidade: novoEncEspecialidade,
      dataEncaminhamento: getTodayPtBr(),
      motivoRelato: novoEncMotivo.trim(),
      statusRetorno: 'Aguardando Avaliação Externa',
      registradoPor: novoEncProf.trim() || 'Coordenação Pedagógica',
      privacidade: 'Confidencial - Apenas Coordenação e Direção'
    };

    setEncaminhamentosList([novoEnc, ...encaminhamentosList]);
    setNovoEncMotivo('');
    setShowNovoEncModal(false);
  };

  const handleAbrirEditarEncaminhamento = (enc: EncaminhamentoEspecialista) => {
    setSelectedEncToEdit(enc);
    setEditEncStatus(enc.statusRetorno);
    setEditEncParecer(enc.parecerTecnico || '');
    setEditEncProfissional(enc.atualizadoPor || 'Dra. Juliana Costa - Fonoaudióloga');
  };

  const handleSalvarEdicaoEncaminhamento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEncToEdit) return;

    const listAtualizada = encaminhamentosList.map((item) => {
      if (item.id === selectedEncToEdit.id) {
        return {
          ...item,
          statusRetorno: editEncStatus,
          parecerTecnico: editEncParecer.trim() || undefined,
          atualizadoPor: editEncProfissional.trim() || 'Fonoaudiologia / Coordenação',
          dataAtualizacao: getNowPtBr()
        };
      }
      return item;
    });

    setEncaminhamentosList(listAtualizada);
    setSelectedEncToEdit(null);
  };

  const handleSalvarOcorrencia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoConfAlunos.trim() || !novoConfDescricao.trim()) return;

    const novaOco: OcorrenciaMediacao = {
      id: `oco_${Date.now()}`,
      turma: novoConfTurma,
      alunosEnvolvidos: novoConfAlunos.trim(),
      horario: novoConfHorario,
      dataOcorrencia: getTodayPtBr(),
      descricaoFatos: novoConfDescricao.trim(),
      medidasPedagogicas: novoConfMedidas.trim() || 'Diálogo acolhedor e escuta atenta.',
      paisNotificadosConfidencialmente: novoConfPaisNotificados,
      registradoPor: 'Coordenação Pedagógica',
      resolvido: true
    };

    setOcorrenciasList([novaOco, ...ocorrenciasList]);
    setNovoConfAlunos('');
    setNovoConfDescricao('');
    setNovoConfMedidas('');
    setShowNovoConflitoForm(false);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Main Banner Card */}
      <div className="bg-white border border-indigo-100 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full inline-flex items-center gap-1.5 border border-indigo-200">
              <Lock size={12} />
              Portal Confidencial da Coordenação Pedagógica
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2">
              <GraduationCap className="text-indigo-600" size={26} />
              Painel de Coordenação & Acompanhamento
            </h1>
            <p className="text-xs text-slate-500 font-medium max-w-3xl leading-relaxed">
              Espaço de monitoramento específico da coordenação pedagógica. Ao contrário do Diretor (gestão global e financeira), o Coordenador atua na orientação das turmas, identificação precoce de marcos de desenvolvimento de alunos e mediação de conflitos.
            </p>
          </div>

          {/* Filtro de Turma de Trabalho */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex flex-col gap-1.5 flex-shrink-0">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Turma de Trabalho:
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSelectedTurmaFiltro('todas')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedTurmaFiltro === 'todas'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Todas as Turmas (2)
              </button>
              <button
                onClick={() => setSelectedTurmaFiltro('bercario')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedTurmaFiltro === 'bercario'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                🍼 Berçário I - A
              </button>
              <button
                onClick={() => setSelectedTurmaFiltro('maternal')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedTurmaFiltro === 'maternal'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                🧸 Maternal I - A
              </button>
            </div>
          </div>
        </div>

        {/* Abas Internas da Coordenação */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-100 overflow-x-auto">
          <button
            onClick={() => setActiveTab('identificacao')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
              activeTab === 'identificacao'
                ? 'bg-indigo-50 border-indigo-300 text-indigo-900 shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle size={15} className="text-amber-500" />
            <span>Identificação Precoce ({alertasList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('encaminhamentos')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
              activeTab === 'encaminhamentos'
                ? 'bg-indigo-50 border-indigo-300 text-indigo-900 shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <FileText size={15} className="text-indigo-600" />
            <span>Encaminhamentos ({encaminhamentosList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('conflitos')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
              activeTab === 'conflitos'
                ? 'bg-indigo-50 border-indigo-300 text-indigo-900 shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <HeartHandshake size={15} className="text-rose-500" />
            <span>Mediação de Conflitos ({ocorrenciasList.length})</span>
          </button>
        </div>
      </div>

      {/* ABA 1: IDENTIFICAÇÃO PRECOCE */}
      {activeTab === 'identificacao' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Coluna Esquerda: Diretrizes de Identificação */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <AlertTriangle size={15} className="text-amber-500" />
                Diretrizes de Identificação
              </h2>
              <p className="text-[11px] text-slate-500 leading-relaxed font-normal">
                O Anjinho atua no rastreamento passivo da rotina pedagógica diária. A coordenação deve revisar e registrar sinais formais de atenção.
              </p>

              <div className="space-y-3">
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-1">
                  <p className="text-xs font-bold text-amber-900">Fala & Linguagem:</p>
                  <p className="text-[11px] text-amber-800 leading-relaxed font-normal">
                    Ausência de palavras inteligíveis aos 2 anos; ecolalia persistente ou perda de vocabulário prévio.
                  </p>
                </div>

                <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-1">
                  <p className="text-xs font-bold text-indigo-900">Socioemocional:</p>
                  <p className="text-[11px] text-indigo-800 leading-relaxed font-normal">
                    Falta de contato visual ou compartilhamento de atenção; isolamento intencional persistente no pátio.
                  </p>
                </div>

                <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-1">
                  <p className="text-xs font-bold text-teal-900">Integração Sensorial:</p>
                  <p className="text-[11px] text-teal-800 leading-relaxed font-normal">
                    Reações severas de choro com barulhos de sala de aula; recusa alimentar extrema por texturas.
                  </p>
                </div>

                <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-1">
                  <p className="text-xs font-bold text-rose-900 flex items-center gap-1">
                    <ShieldAlert size={12} /> Conduta Ética:
                  </p>
                  <p className="text-[11px] text-rose-800 leading-relaxed font-normal">
                    Nunca afirme diagnósticos (ex: "Este aluno tem Autismo"). Registre fatos objetivos observados (ex: "O aluno enfileira brinquedos e não atende a comandos verbais de roda").
                  </p>
                </div>
              </div>
            </div>

            {/* Coluna Direita: Registrar Sinal de Alerta / Acompanhamento */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    Registrar Sinal de Alerta / Acompanhamento
                  </h2>
                  <p className="text-[11px] text-slate-500 font-normal">
                    Selecione um aluno da turma para registrar um sinal de atraso monitorado.
                  </p>
                </div>
                <button
                  onClick={() => setShowNovoAlertaForm(!showNovoAlertaForm)}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>{showNovoAlertaForm ? 'Ocultar Formulário' : 'Novo Alerta'}</span>
                </button>
              </div>

              {/* Seletor de Alunos em Grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Selecione o Aluno Abaixo:
                  </label>
                  <div className="relative w-48">
                    <input
                      type="text"
                      placeholder="Buscar aluno..."
                      value={alunoSearchTerm}
                      onChange={(e) => setAlunoSearchTerm(e.target.value)}
                      className="w-full p-1.5 pl-7 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-indigo-500"
                    />
                    <Search size={12} className="absolute left-2 top-2.5 text-slate-400" />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto p-1">
                  {alunosFiltradosBusca.map((aluno, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setSelectedAlunoAlerta(aluno.nome);
                        setShowNovoAlertaForm(true);
                      }}
                      className={`p-2.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        selectedAlunoAlerta === aluno.nome
                          ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-400/20 shadow-xs'
                          : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/80'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-800 truncate">{aluno.nome}</p>
                        <p className="text-[10px] text-slate-500">{aluno.turma}</p>
                      </div>
                      <span
                        className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md mt-1.5 inline-block w-fit ${
                          aluno.status.includes('Sinais')
                            ? 'bg-amber-200 text-amber-900'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {aluno.status}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Formulário de Registro de Sinal de Alerta */}
              {showNovoAlertaForm && (
                <form onSubmit={handleSalvarAlerta} className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-2xl space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
                    <p className="text-xs font-bold text-indigo-900">
                      Registrando para: <span className="underline font-black">{selectedAlunoAlerta}</span>
                    </p>
                    <span className="text-[10px] bg-indigo-200/80 text-indigo-950 px-2 py-0.5 rounded-lg font-bold">
                      Protocolo Confidencial
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">
                        Área de Atenção
                      </label>
                      <select
                        value={areaAlerta}
                        onChange={(e) => setAreaAlerta(e.target.value as any)}
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-indigo-500"
                      >
                        <option value="Fala & Linguagem">Fala & Linguagem</option>
                        <option value="Socioemocional">Socioemocional</option>
                        <option value="Integração Sensorial">Integração Sensorial</option>
                        <option value="Coordenação Motora">Coordenação Motora</option>
                        <option value="Comportamento">Comportamento</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">
                        Severidade / Frequência
                      </label>
                      <select
                        value={severidadeAlerta}
                        onChange={(e) => setSeveridadeAlerta(e.target.value as any)}
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-indigo-500"
                      >
                        <option value="Leve / Inicial">Leve / Inicial</option>
                        <option value="Moderada / Frequente">Moderada / Frequente</option>
                        <option value="Recorrente / Severa">Recorrente / Severa</option>
                      </select>
                    </div>
                  </div>

                  <CampoTextoVoz
                    label="Síntese do Comportamento Observado"
                    value={sinteseAlerta}
                    onChange={setSinteseAlerta}
                    placeholder="Ex: Ausência de resposta ao chamado pelo nome ou dificuldade em fixar olhar..."
                    required
                  />

                  <CampoTextoVoz
                    label="Fatos Objetivos Observados (Sem diagnósticos médicos)"
                    value={obsAlerta}
                    onChange={setObsAlerta}
                    placeholder="Ex: Notado durante a roda de histórias. Prefere manter distância e organiza brinquedos em fila."
                    type="textarea"
                    rows={2}
                  />

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowNovoAlertaForm(false)}
                      className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
                    >
                      Salvar Alerta no Prontuário
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Lista de Alertas Ativos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <AlertTriangle size={15} className="text-amber-600" />
                Lista de Alertas e Sinais de Desenvolvimento Ativos
              </h3>
              <span className="text-xs text-slate-500 font-bold">
                {alertasList.length} alertas monitorados
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {alertasList.map((alerta) => (
                <div
                  key={alerta.id}
                  className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs hover:border-indigo-200 transition space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-black text-slate-800">{alerta.alunoNome}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200">
                            {alerta.area}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              alerta.severidade.includes('Severa')
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {alerta.severidade}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAlertasList(alertasList.filter((a) => a.id !== alerta.id))}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition cursor-pointer"
                        title="Remover alerta"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <p className="text-xs font-bold text-slate-700 leading-snug">
                      {alerta.sintese}
                    </p>

                    <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      "{alerta.observacaoObjetiva}"
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                      <span>Registrado por: <b>{alerta.registradoPor}</b></span>
                      <span>{formatDatePtBr(alerta.dataRegistro)}</span>
                    </div>
                  </div>

                  {/* Mensagem de Acolhimento Sugerida */}
                  <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-2">
                    <p className="text-[10px] font-black uppercase text-indigo-900 tracking-wider">
                      Mensagem de Acolhimento Sugerida:
                    </p>
                    <p className="text-[11px] text-indigo-900/90 leading-relaxed font-normal">
                      {alerta.mensagemAcolhimentoSugerida}
                    </p>

                    <button
                      type="button"
                      onClick={() => handleCopiarMensagem(alerta.id, alerta.mensagemAcolhimentoSugerida)}
                      className="w-full py-2 bg-white hover:bg-indigo-100/70 border border-indigo-300 text-indigo-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      {copiedId === alerta.id ? (
                        <>
                          <Check size={14} className="text-emerald-600" />
                          <span className="text-emerald-700">Texto Copiado com Sucesso!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span>Copiar Texto para WhatsApp</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: ENCAMINHAMENTOS CONFIDENCIAIS */}
      {activeTab === 'encaminhamentos' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 border border-slate-200 rounded-3xl shadow-xs">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Prontuário de Encaminhamentos Confidenciais
              </h3>
              <p className="text-[11px] text-slate-500 font-normal">
                Direcionamento para especialistas externos em conjunto com a família.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <input
                  type="text"
                  placeholder="Pesquisar por aluno ou especialidade..."
                  value={searchEncaminhamento}
                  onChange={(e) => setSearchEncaminhamento(e.target.value)}
                  className="w-full p-2 pl-8 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-indigo-500"
                />
                <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
              </div>

              <button
                onClick={() => setShowNovoEncModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer flex-shrink-0"
              >
                <Plus size={15} />
                <span>Novo Encaminhamento</span>
              </button>
            </div>
          </div>

          {/* Cards de Encaminhamentos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {encaminhamentosList
              .filter((enc) =>
                searchEncaminhamento
                  ? enc.alunoNome.toLowerCase().includes(searchEncaminhamento.toLowerCase()) ||
                    enc.especialidade.toLowerCase().includes(searchEncaminhamento.toLowerCase())
                  : true
              )
              .map((enc) => {
                const getStatusBadge = (status: EncaminhamentoEspecialista['statusRetorno']) => {
                  if (status === 'Devolutiva Recebida na Escola') {
                    return 'bg-emerald-50 text-emerald-800 border-emerald-200';
                  }
                  if (status === 'Em Acompanhamento Clínico') {
                    return 'bg-indigo-50 text-indigo-800 border-indigo-200';
                  }
                  return 'bg-amber-50 text-amber-800 border-amber-200';
                };

                return (
                  <div
                    key={enc.id}
                    className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-3.5 hover:border-indigo-200 transition"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-black text-slate-800">{enc.alunoNome}</h4>
                          <p className="text-[10px] font-bold text-slate-500 uppercase">{enc.turma}</p>
                        </div>
                        <button
                          onClick={() =>
                            setEncaminhamentosList(encaminhamentosList.filter((e) => e.id !== enc.id))
                          }
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                          title="Excluir"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md">
                          {enc.especialidade}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {formatDatePtBr(enc.dataEncaminhamento)}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Motivo Pedagógico:</span>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium bg-slate-50 p-3 rounded-2xl border border-slate-100">
                          "{enc.motivoRelato}"
                        </p>
                      </div>

                      {/* Parecer / Devolutiva do Especialista */}
                      {enc.parecerTecnico && (
                        <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl space-y-1">
                          <span className="text-[10px] font-black text-emerald-800 uppercase block">
                            Parecer / Devolutiva Técnica:
                          </span>
                          <p className="text-xs text-emerald-950 font-medium leading-relaxed">
                            "{enc.parecerTecnico}"
                          </p>
                          {enc.atualizadoPor && (
                            <span className="text-[9px] text-emerald-700 font-bold block pt-1">
                              Por: {enc.atualizadoPor} {enc.dataAtualizacao ? `• ${formatDateTimePtBr(enc.dataAtualizacao)}` : ''}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                        <span>Por: <b>{enc.registradoPor}</b></span>
                        <span className={`font-bold px-2 py-0.5 rounded border text-[10px] ${getStatusBadge(enc.statusRetorno)}`}>
                          {enc.statusRetorno}
                        </span>
                      </div>

                      <button
                        onClick={() => handleAbrirEditarEncaminhamento(enc)}
                        className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer border border-indigo-100"
                      >
                        <Edit3 size={13} />
                        <span>Atualizar Devolutiva / Status</span>
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Modal Novo Encaminhamento */}
          {showNovoEncModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-100">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <FileText size={18} className="text-indigo-600" />
                    Novo Encaminhamento de Especialista
                  </h3>
                  <button
                    onClick={() => setShowNovoEncModal(false)}
                    className="text-slate-400 hover:text-slate-700 cursor-pointer font-bold"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSalvarEncaminhamento} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <CampoTextoVoz
                      label="Nome do Aluno"
                      value={novoEncAluno}
                      onChange={setNovoEncAluno}
                      placeholder="Ex: Arthur Silva"
                      required
                    />

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Turma / Sala</label>
                      <select
                        value={novoEncTurma}
                        onChange={(e) => setNovoEncTurma(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-indigo-500"
                      >
                        <option value="Berçário I - A">Berçário I - A</option>
                        <option value="Maternal I">Maternal I</option>
                        <option value="Maternal II">Maternal II</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Especialidade Indicada</label>
                    <select
                      value={novoEncEspecialidade}
                      onChange={(e) => setNovoEncEspecialidade(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-indigo-500"
                    >
                      <option value="Fonoaudiologia">Fonoaudiologia</option>
                      <option value="Terapia Ocupacional">Terapia Ocupacional</option>
                      <option value="Neuropediatria">Neuropediatria</option>
                      <option value="Psicologia Infantil">Psicologia Infantil</option>
                      <option value="Psicopedagogia">Psicopedagogia</option>
                      <option value="Geral / Coordenação">Geral / Coordenação</option>
                    </select>
                  </div>

                  <CampoTextoVoz
                    label="Motivo e Relato Pedagógico para o Especialista"
                    value={novoEncMotivo}
                    onChange={setNovoEncMotivo}
                    placeholder="Descreva as observações pedagógicas e motivos do direcionamento..."
                    type="textarea"
                    rows={3}
                    required
                  />

                  <CampoTextoVoz
                    label="Profissional Responsável pelo Registro"
                    value={novoEncProf}
                    onChange={setNovoEncProf}
                    placeholder="Ex: Profa Estela Pinto ou Coordenação"
                  />

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowNovoEncModal(false)}
                      className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-200"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer"
                    >
                      Salvar no Prontuário
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal Atualizar Devolutiva / Status de Acompanhamento */}
          {selectedEncToEdit && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-100">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                      <Edit3 size={18} className="text-indigo-600" />
                      Atualizar Devolutiva & Status Clínico
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {selectedEncToEdit.alunoNome} ({selectedEncToEdit.turma}) • {selectedEncToEdit.especialidade}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedEncToEdit(null)}
                    className="text-slate-400 hover:text-slate-700 cursor-pointer font-bold"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSalvarEdicaoEncaminhamento} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      Status de Acompanhamento do Especialista
                    </label>
                    <select
                      value={editEncStatus}
                      onChange={(e) => setEditEncStatus(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                    >
                      <option value="Aguardando Avaliação Externa">🟡 Aguardando Avaliação Externa (Pela Família)</option>
                      <option value="Em Acompanhamento Clínico">🔵 Em Acompanhamento Clínico (Em Terapia/Tratamento)</option>
                      <option value="Devolutiva Recebida na Escola">🟢 Devolutiva Recebida na Escola (Parecer Concluído)</option>
                    </select>
                  </div>

                  <CampoTextoVoz
                    label="Parecer Técnico / Devolutiva do Especialista (Fono, Psico, TO)"
                    value={editEncParecer}
                    onChange={setEditEncParecer}
                    placeholder="Digite as orientações, parecer médico ou recomendações de estímulo para a escola..."
                    type="textarea"
                    rows={4}
                  />

                  <CampoTextoVoz
                    label="Nome e Função do Profissional Responsável"
                    value={editEncProfissional}
                    onChange={setEditEncProfissional}
                    placeholder="Ex: Dra. Juliana Costa - Fonoaudióloga CRFa 1234"
                  />

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setSelectedEncToEdit(null)}
                      className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-200"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer"
                    >
                      Salvar Devolutiva & Atualizar Status
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ABA 3: MEDIAÇÃO DE CONFLITOS */}
      {activeTab === 'conflitos' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Protocolo de Mediação */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <HeartHandshake size={16} className="text-rose-500" />
                Protocolo de Mediação
              </h2>
              <p className="text-[11px] text-slate-500 leading-relaxed font-normal">
                Pequenas agressões físicas (mordidas, puxões) e disputas territoriais de brinquedos são comuns na primeira infância. Nossa atuação deve ser focada no desenvolvimento socioemocional e mediação assertiva.
              </p>

              <div className="space-y-3">
                <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-1">
                  <p className="text-xs font-bold text-rose-900">EIXO 1: PROTEÇÃO E LIMITE</p>
                  <p className="text-[11px] text-rose-800 leading-relaxed font-normal">
                    Separar fisicamente e acolher imediatamente a criança atingida de forma carinhosa e neutra. Sem gritos.
                  </p>
                </div>

                <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-1">
                  <p className="text-xs font-bold text-indigo-900">EIXO 2: EMPATIA E CUIDADO</p>
                  <p className="text-[11px] text-indigo-800 leading-relaxed font-normal">
                    Envolver a criança que bateu/mordeu no cuidado ao amigo (ajudar com o gelo, dar o urso). Estimular a responsabilidade social.
                  </p>
                </div>

                <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-1">
                  <p className="text-xs font-bold text-teal-900">EIXO 3: SIGILO & COMUNICAÇÃO</p>
                  <p className="text-[11px] text-teal-800 leading-relaxed font-normal">
                    Informar os responsáveis no privado de maneira discreta, resguardando sempre a identidade da outra criança envolvida.
                  </p>
                </div>
              </div>
            </div>

            {/* Formulário / Registro de Ocorrência */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    Livro de Ocorrências e Mediações Realizadas
                  </h2>
                  <p className="text-[11px] text-slate-500 font-normal">
                    Registro sigiloso das intervenções pedagógicas e combinados com os responsáveis.
                  </p>
                </div>
                <button
                  onClick={() => setShowNovoConflitoForm(!showNovoConflitoForm)}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>{showNovoConflitoForm ? 'Fechar Registro' : '+ Registrar Ocorrência'}</span>
                </button>
              </div>

              {showNovoConflitoForm && (
                <form onSubmit={handleSalvarOcorrencia} className="p-4 bg-rose-50/50 border border-rose-200 rounded-2xl space-y-3 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 block mb-1">Sala / Turma</label>
                      <select
                        value={novoConfTurma}
                        onChange={(e) => setNovoConfTurma(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-rose-500"
                      >
                        <option value="Berçário I - A">Berçário I - A</option>
                        <option value="Maternal I">Maternal I</option>
                        <option value="Maternal II">Maternal II</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <CampoTextoVoz
                        label="Alunos Envolvidos"
                        value={novoConfAlunos}
                        onChange={setNovoConfAlunos}
                        placeholder="Ex: João e Lucas Santos"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 block mb-1">Horário do Ocorrido</label>
                      <input
                        type="time"
                        value={novoConfHorario}
                        onChange={(e) => setNovoConfHorario(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-rose-500"
                      />
                    </div>

                    <div className="sm:col-span-2 flex items-center pt-4">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                        <input
                          type="checkbox"
                          checked={novoConfPaisNotificados}
                          onChange={(e) => setNovoConfPaisNotificados(e.target.checked)}
                          className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                        />
                        <span>Pais/Responsáveis foram notificados confidencialmente</span>
                      </label>
                    </div>
                  </div>

                  <CampoTextoVoz
                    label="Descrição da Ocorrência / Conflito"
                    value={novoConfDescricao}
                    onChange={setNovoConfDescricao}
                    placeholder="Relate os fatos de forma imparcial (ex: disputa de brinquedo, agressão física, mordida, etc.)..."
                    type="textarea"
                    rows={2}
                    required
                  />

                  <CampoTextoVoz
                    label="Medidas Pedagógicas de Resolução Adotadas"
                    value={novoConfMedidas}
                    onChange={setNovoConfMedidas}
                    placeholder="Ex: Diálogo sobre sentimentos, círculo de empatia com a turma, entrega de brinquedo compartilhado..."
                    type="textarea"
                    rows={2}
                  />

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowNovoConflitoForm(false)}
                      className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
                    >
                      Registrar no Livro Confidencial
                    </button>
                  </div>
                </form>
              )}

              {/* Lista de Conflitos */}
              <div className="space-y-3 pt-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Pesquisar conflitos por aluno ou relato..."
                    value={searchConflito}
                    onChange={(e) => setSearchConflito(e.target.value)}
                    className="w-full p-2 pl-8 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-indigo-500"
                  />
                  <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                </div>

                <div className="space-y-3">
                  {ocorrenciasList
                    .filter((oco) =>
                      searchConflito
                        ? oco.alunosEnvolvidos.toLowerCase().includes(searchConflito.toLowerCase()) ||
                          oco.descricaoFatos.toLowerCase().includes(searchConflito.toLowerCase())
                        : true
                    )
                    .map((oco) => (
                      <div
                        key={oco.id}
                        className="bg-slate-50 border border-slate-200 rounded-3xl p-4 space-y-2.5 hover:border-slate-300 transition"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs font-black text-slate-800">
                              Envolvidos: {oco.alunosEnvolvidos}
                            </p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase">
                              {oco.turma} • Horário: {oco.horario}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {oco.paisNotificadosConfidencialmente && (
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">
                                Pais Notificados
                              </span>
                            )}
                            <button
                              onClick={() =>
                                setOcorrenciasList(ocorrenciasList.filter((o) => o.id !== oco.id))
                              }
                              className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                              title="Excluir"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] font-black uppercase text-slate-600">Incidente:</p>
                          <p className="text-xs text-slate-700 leading-snug">
                            "{oco.descricaoFatos}"
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-black uppercase text-rose-600">Mediação Realizada:</p>
                          <p className="text-xs text-slate-700 leading-snug">
                            {oco.medidasPedagogicas}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[10px] text-slate-400 font-medium">
                          <span>Registrado por: <b>{oco.registradoPor}</b></span>
                          <span>{formatDatePtBr(oco.dataOcorrencia)} às {oco.horario}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
