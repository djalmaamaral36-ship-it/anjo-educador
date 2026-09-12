import React, { useState } from 'react';
import { 
  AlertTriangle, X, ShieldAlert, CheckCircle2, Clock, 
  Send, PhoneCall, HeartHandshake, Thermometer, Info, MessageSquare
} from 'lucide-react';
import { StudentPaxData, OcorrenciaEscolar } from '../../types';
import { getTodayPtBr, formatDatePtBr } from '../../utils/formatters';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  student: StudentPaxData;
  userRole: 'professor' | 'familia';
  onAddOcorrencia?: (ocorrencia: OcorrenciaEscolar) => void;
}

export default function ModalOcorrenciaDoDia({
  isOpen,
  onClose,
  student,
  userRole,
  onAddOcorrencia,
}: Props) {
  if (!isOpen) return null;

  const isProfessor = userRole === 'professor';

  // Ocorrências padrão de demonstração se não houver
  const [listaOcorrencias, setListaOcorrencias] = useState<OcorrenciaEscolar[]>(
    student.ocorrenciasHoje || [
      {
        id: 'oc_1',
        studentId: student.id,
        studentNome: student.nome,
        tipo: 'queda_machucado',
        tipoLabel: 'Pequeno tropeço no parquinho',
        gravidade: 'informativo',
        horario: '10:45',
        data: getTodayPtBr(),
        descricao: 'Tropeçou suavemente na grama sintética durante a brincadeira ao ar livre. Sem cortes ou inchaço.',
        condutaTomada: 'Higienizado o local com soro fisiológico e aplicado compressa fria por 5 minutos. Chorou por 1 minuto e voltou a brincar alegremente.',
        educadoraResponsavel: student.professoraTitular,
        notificarPaisWhatsApp: true,
        notificadoEm: '10:50',
        status: 'resolvida',
      }
    ]
  );

  // Form states para o professor
  const [abaAtiva, setAbaAtiva] = useState<'lista' | 'nova'>(isProfessor ? 'nova' : 'lista');
  const [tipoSelecionado, setTipoSelecionado] = useState<OcorrenciaEscolar['tipo']>('queda_machucado');
  const [gravidade, setGravidade] = useState<OcorrenciaEscolar['gravidade']>('informativo');
  const [horario, setHorario] = useState(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
  const [descricao, setDescricao] = useState('');
  const [condutaTomada, setCondutaTomada] = useState('');
  const [dispararWhatsApp, setDispararWhatsApp] = useState(false);
  const [sucessoMsg, setSucessoMsg] = useState<string | null>(null);

  const tiposDisponiveis = [
    { key: 'queda_machucado', label: 'Queda / Arranhão Leve', icon: '🩹' },
    { key: 'febre', label: 'Febre Súbita / Temperatura Elevada', icon: '🌡️' },
    { key: 'recusa_alimentar', label: 'Recusa Alimentar Total', icon: '🥣' },
    { key: 'vomito_malestar', label: 'Vômito / Enjoo / Mal-estar', icon: '🤢' },
    { key: 'alergia', label: 'Reação Alérgica / Manchas na Pele', icon: '⚠️' },
    { key: 'comportamento', label: 'Choro Inconsolável / Desconforto', icon: '🥺' },
    { key: 'outro', label: 'Outra Intercorrência', icon: '📝' },
  ];

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim()) return;

    const tipoObj = tiposDisponiveis.find((t) => t.key === tipoSelecionado);
    const nova: OcorrenciaEscolar = {
      id: `oc_${Date.now()}`,
      studentId: student.id,
      studentNome: student.nome,
      tipo: tipoSelecionado,
      tipoLabel: tipoObj ? tipoObj.label : 'Ocorrência',
      gravidade,
      horario,
      data: getTodayPtBr(),
      descricao,
      condutaTomada: condutaTomada || 'Aferido sinais vitais, prestados primeiros cuidados pedagógicos e acolhimento afetuoso.',
      educadoraResponsavel: student.professoraTitular,
      notificarPaisWhatsApp: dispararWhatsApp,
      notificadoEm: dispararWhatsApp ? horario : undefined,
      status: 'em_acompanhamento',
    };

    setListaOcorrencias((prev) => [nova, ...prev]);
    if (onAddOcorrencia) onAddOcorrencia(nova);

    // Se marcado para WhatsApp, monta link
    if (dispararWhatsApp) {
      const msgTexto = encodeURIComponent(
        `🚨 *COMUNICADO DE OCORRÊNCIA ESCOLAR*\n\n` +
        `Olá, ${student.responsavelNome}!\n` +
        `Informamos uma intercorrência com o(a) aluno(a) *${student.nome}* às *${horario}*:\n\n` +
        `📌 *Tipo*: ${nova.tipoLabel}\n` +
        `📝 *O que ocorreu*: ${nova.descricao}\n` +
        `🩺 *Conduta adotada*: ${nova.condutaTomada}\n` +
        `👩‍🏫 *Educadora*: ${student.professoraTitular}\n\n` +
        `Fique tranquilo(a), nossa equipe está acompanhando tudo com carinho!`
      );
      window.open(`https://api.whatsapp.com/send?phone=5511955554440&text=${msgTexto}`, '_blank');
    }

    setSucessoMsg('Ocorrência registrada com sucesso e protocolada no histórico escolar.');
    setDescricao('');
    setCondutaTomada('');
    setTimeout(() => {
      setSucessoMsg(null);
      setAbaAtiva('lista');
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CABEÇALHO DO MODAL */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-5 sm:p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/30 text-white flex-shrink-0">
              <AlertTriangle size={22} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-100 bg-white/10 px-2.5 py-0.5 rounded-md">
                GOVERNANÇA & SEGURANÇA INFANTIL
              </span>
              <h3 className="text-lg sm:text-xl font-black text-white leading-tight">
                Ocorrência do Dia — {student.nome}
              </h3>
              <p className="text-xs text-amber-100/90 mt-0.5">
                Turma: {student.turma} • Educadora: {student.professoraTitular}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* NAVEGAÇÃO DE ABAS (Para o Professor) */}
        {isProfessor && (
          <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-3">
            <button
              onClick={() => setAbaAtiva('nova')}
              className={`pb-3 text-xs font-black transition cursor-pointer border-b-2 flex items-center gap-2 ${
                abaAtiva === 'nova'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>+ Registrar Nova Ocorrência</span>
            </button>
            <button
              onClick={() => setAbaAtiva('lista')}
              className={`pb-3 text-xs font-black transition cursor-pointer border-b-2 flex items-center gap-2 ${
                abaAtiva === 'lista'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Histórico de Hoje ({listaOcorrencias.length})</span>
            </button>
          </div>
        )}

        {/* FEEDBACK DE SUCESSO */}
        {sucessoMsg && (
          <div className="m-4 p-4 rounded-2xl bg-emerald-500 text-white font-black text-xs flex items-center gap-2 shadow-sm">
            <CheckCircle2 size={18} />
            <span>{sucessoMsg}</span>
          </div>
        )}

        {/* CORPO DO MODAL */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* MODO PROFESSORA: FORMULÁRIO DE NOVA OCORRÊNCIA */}
          {isProfessor && abaAtiva === 'nova' ? (
            <form onSubmit={handleSalvar} className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase text-slate-500 block mb-1.5">
                  1. TIPO DA INTERCORRÊNCIA
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {tiposDisponiveis.map((tipo) => (
                    <button
                      key={tipo.key}
                      type="button"
                      onClick={() => setTipoSelecionado(tipo.key as any)}
                      className={`p-3 rounded-2xl border text-left transition flex items-center gap-2 text-xs font-black cursor-pointer ${
                        tipoSelecionado === tipo.key
                          ? 'border-amber-500 bg-amber-50 text-amber-950 shadow-2xs ring-2 ring-amber-400/20'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="text-lg">{tipo.icon}</span>
                      <span className="leading-tight">{tipo.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black uppercase text-slate-500 block mb-1">
                    2. NÍVEL DE GRAVIDADE
                  </label>
                  <select
                    value={gravidade}
                    onChange={(e) => setGravidade(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none"
                  >
                    <option value="informativo">Informativo / Leve (Sob Controle)</option>
                    <option value="moderado">Moderado (Exige Acompanhamento)</option>
                    <option value="urgente">Urgente (Requer Comparecimento / Contato Imediato)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black uppercase text-slate-500 block mb-1">
                    3. HORÁRIO DO FATO
                  </label>
                  <input
                    type="time"
                    value={horario}
                    onChange={(e) => setHorario(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase text-slate-500 block mb-1">
                  4. DESCRIÇÃO DETALHADA DO OCORRIDO
                </label>
                <textarea
                  rows={3}
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descreva o que aconteceu de forma clara e objetiva (ex: Sentiu-se quente após o soninho, queixou-se de dorzinha de barriga...)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 outline-none placeholder:text-slate-400"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase text-slate-500 block mb-1">
                  5. CONDUTA DA EQUIPE ESCOLAR
                </label>
                <input
                  type="text"
                  value={condutaTomada}
                  onChange={(e) => setCondutaTomada(e.target.value)}
                  placeholder="Ex: Aferido termômetro (38.1°C), avisada a coordenação, colocado em repouso confortável."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 outline-none placeholder:text-slate-400"
                />
              </div>

              {/* TOGGLE WHATSAPP */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                    <MessageSquare size={18} />
                  </div>
                  <div>
                    <span className="text-xs font-black text-emerald-950 block">
                      Enviar também alerta via WhatsApp aos Pais (Opcional)
                    </span>
                    <span className="text-[11px] text-emerald-800">
                      Dispara cópia direta para <strong>{student.responsavelNome}</strong> ({student.responsavelTelefone})
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={dispararWhatsApp}
                  onChange={(e) => setDispararWhatsApp(e.target.checked)}
                  className="w-5 h-5 accent-emerald-600 cursor-pointer"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-2xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldAlert size={16} />
                  <span>Gravar no App & Protocolar Ocorrência</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            /* LISTAGEM DE OCORRÊNCIAS (Para Pais e Consulta do Professor) */
            <div className="space-y-4">
              {!isProfessor && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs text-slate-700">
                  <Info size={18} className="text-indigo-600 flex-shrink-0 mt-0.5" />
                  <p>
                    Todas as intercorrências escolares de <strong>{student.nome}</strong> são registradas com carimbo de hora e assinatura pedagógica para total transparência e segurança da família.
                  </p>
                </div>
              )}

              {listaOcorrencias.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-2xl border border-emerald-200">
                    ✓
                  </div>
                  <h4 className="font-black text-slate-800 text-base">
                    Nenhuma Intercorrência Hoje!
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    O dia de <strong>{student.nome}</strong> está correndo em perfeita harmonia, sem quedas, febre ou qualquer anormalidade.
                  </p>
                </div>
              ) : (
                listaOcorrencias.map((oc) => (
                  <div
                    key={oc.id}
                    className="p-5 rounded-2xl border border-amber-200 bg-amber-50/40 space-y-3 relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">⚠️</span>
                        <div>
                          <h4 className="font-black text-sm text-slate-900">{oc.tipoLabel}</h4>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <Clock size={12} />
                            <span>Registrado em {formatDatePtBr(oc.data)} às {oc.horario} • por {oc.educadoraResponsavel}</span>
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                          oc.gravidade === 'urgente'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : oc.gravidade === 'moderado'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                        }`}
                      >
                        {oc.gravidade}
                      </span>
                    </div>

                    <div className="bg-white rounded-xl p-3.5 border border-slate-100 text-xs space-y-2">
                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 block">
                          O QUE OCORREU:
                        </span>
                        <p className="font-bold text-slate-800 mt-0.5">{oc.descricao}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-black uppercase text-emerald-700 block">
                          CONDUTA TOMADA PELA ESCOLA:
                        </span>
                        <p className="text-slate-600 mt-0.5">{oc.condutaTomada}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 pt-1">
                      <span className="flex items-center gap-1 text-emerald-700 font-bold">
                        <CheckCircle2 size={13} />
                        Status: Protocolado e Auditado
                      </span>

                      {!isProfessor && (
                        <a
                          href={`https://api.whatsapp.com/send?phone=5511955554440&text=Olá,%20gostaria%20de%20falar%20sobre%20a%20ocorrência%20do(a)%20${student.nome}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-700 hover:text-emerald-800 flex items-center gap-1 font-black bg-emerald-100/80 px-2.5 py-1 rounded-lg transition"
                        >
                          <PhoneCall size={12} />
                          <span>Falar com a Professora</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* RODAPÉ */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Protocolo Seguro de Governança Escolar</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
