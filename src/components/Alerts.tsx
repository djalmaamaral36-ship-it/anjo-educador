import React, { useState, useEffect } from 'react';
import { Idoso, NotificacaoSimulada, Usuario, formatWhatsAppNumber } from '../types';
import { getFromDB, saveToDB } from '../data';
import { 
  Bell, 
  MessageSquare, 
  Check, 
  Eye, 
  Send, 
  Smartphone, 
  Sparkles, 
  Volume2, 
  AlertTriangle,
  RefreshCw,
  Search,
  CheckCircle2,
  Lock,
  Users,
  Copy
} from 'lucide-react';

interface AlertsProps {
  idoso: Idoso;
  usuarioAtual: Usuario;
  keyTrigger: number;
  triggerWhatsAppSim: (titulo: string, mensagem: string) => void;
  accessibilitySettings?: {
    fontSize: 'normal' | 'grande' | 'gigante';
    simplifiedMode: boolean;
    darkMode: boolean;
  };
}

export default function Alerts({ idoso, usuarioAtual, keyTrigger, triggerWhatsAppSim, accessibilitySettings }: AlertsProps) {
  const [logs, setLogs] = useState<NotificacaoSimulada[]>([]);
  const [phoneFilter, setPhoneFilter] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [selectedBroadcastLog, setSelectedBroadcastLog] = useState<NotificacaoSimulada | null>(null);
  const [broadcastSearch, setBroadcastSearch] = useState('');
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  const appMode = localStorage.getItem('anjo_app_mode') || 'idoso';
  const isEscolar = appMode === 'escolar_infantil' || appMode === 'escolar_fundamental';
  const isApresentacao = localStorage.getItem('anjo_modo_apresentacao') === 'true';
  const cleanStudentName = idoso.nome.includes(' (') ? idoso.nome.split(' (')[0] : idoso.nome;
  const isDark = accessibilitySettings?.darkMode;

  useEffect(() => {
    loadLogs();
  }, [idoso, keyTrigger]);

  const getBroadcastList = (log: NotificacaoSimulada) => {
    if (log.destinatariosLista && log.destinatariosLista.length > 0) {
      return log.destinatariosLista;
    }
    const allStudents = getFromDB<Idoso[]>('anjo_idosos', [])
      .filter(p => p.id.startsWith('aluno_') || p.id.startsWith('aluno_fun_'));
    return allStudents.map(student => {
      const rawName = student.nome.includes(' (') ? student.nome.split(' (')[0] : student.nome;
      const contactName = student.contatoEmergencia?.nome || `Pais de ${rawName}`;
      const contactPhone = student.contatoEmergencia?.telefone || '(11) 98765-4321';
      return {
        idosoNome: rawName,
        familiarNome: contactName,
        telefone: contactPhone
      };
    });
  };

  // Automatic scroll to bottom of simulated Chat history whenever logs load or update
  useEffect(() => {
    const chatContainer = document.getElementById('whatsapp-chat-container');
    if (chatContainer) {
      setTimeout(() => {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }, 50);
    }
  }, [logs]);

  const loadLogs = () => {
    const allLogs = getFromDB<NotificacaoSimulada[]>('anjo_notificacoes', []);
    const filtered = allLogs.filter(l => {
      const isLogStudent = l.idosoId && l.idosoId.startsWith('aluno_');
      if (isEscolar && !isLogStudent && l.idosoId !== 'todos') return false;
      if (!isEscolar && isLogStudent) return false;
      return l.idosoId === idoso.id || l.idosoId === 'todos';
    });
    
    if (isEscolar) {
      const adapted = filtered.map(l => {
        let cleanMsg = l.mensagem;
        cleanMsg = cleanMsg
          .replace(/AnjoCuidador/g, 'Anjo Escolar')
          .replace(/Dona Maria de Souza/g, 'Mariana Souza')
          .replace(/Dona Maria/g, 'Mariana')
          .replace(/Seu Joao/g, 'Enzo')
          .replace(/Seu Joao de Alencar/g, 'Enzo Alencar')
          .replace(/medicacao/g, 'rotina alimentar')
          .replace(/medicamento/g, 'item de cuidado')
          .replace(/Losartana Potassica/g, 'Lactilon / Chupeta')
          .replace(/Losartana/g, 'Mamadeira')
          .replace(/cuidador\(a\)/g, 'professor(a)')
          .replace(/Cuidadora/g, 'Professora')
          .replace(/Cuidador/g, 'Professor')
          .replace(/paciente/g, 'aluno')
          .replace(/Cafe da manha/g, 'Lanche da manha')
          .replace(/Geleia sem acucar com pao integral/g, 'Frutas frescas fatiadas e suquinho');
        
        return {
          ...l,
          mensagem: cleanMsg
        };
      });
      setLogs(adapted.sort((a,b) => (a.dataEnvio || '').localeCompare(b.dataEnvio || '')));
    } else {
      setLogs(filtered.sort((a,b) => (a.dataEnvio || '').localeCompare(b.dataEnvio || '')));
    }
  };

  const getFormattedDateDivider = (dateIso: string) => {
    const d = new Date(dateIso);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const dStr = d.toLocaleDateString('pt-BR');
    const todayStr = today.toLocaleDateString('pt-BR');
    const yesterdayStr = yesterday.toLocaleDateString('pt-BR');

    const fullDate = d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

    if (dStr === todayStr) {
      return `Hoje   ${fullDate}`;
    } else if (dStr === yesterdayStr) {
      return `Ontem   ${fullDate}`;
    } else {
      return fullDate;
    }
  };

  const handleClearLogs = () => {
    setShowClearConfirm(true);
  };

  const confirmClearLogs = () => {
    saveToDB('anjo_notificacoes', []);
    setLogs([]);
    setShowClearConfirm(false);
    window.dispatchEvent(new CustomEvent('anjo_user_updated'));
  };

  const handleTestDispatchTemplates = (templateType: string) => {
    let msg = '';
    let tit = '';
    
    const elderName = idoso.nome.includes(' (') ? idoso.nome.split(' (')[0] : idoso.nome;
    const caregiverName = usuarioAtual.nome;
    
    if (templateType === 'check') {
      tit = isEscolar ? 'Rotina Realizada' : 'Tarefa Concluida';
      msg = isEscolar
        ? `Anjo Escolar: A rotina/refeicao de ${elderName} das 08:00 foi registrada como concluida pelo professor(a) ${caregiverName}.`
        : `AnjoCuidador: A medicacao de ${elderName} das 08:00 (Losartana) foi marcada como concluida por ${caregiverName}.`;
    } else if (templateType === 'pendente') {
      tit = isEscolar ? 'Item Pendente ou Requerido' : 'Tarefa Proxima ou Pendente';
      msg = isEscolar
        ? `Anjo Escolar: Lembrete, a autorizacao especial ou item de higiene de ${elderName} para as 12:30 ainda nao foi registrado. Favor verificar com ${caregiverName}.`
        : `AnjoCuidador: Atencao, a medicacao de ${elderName} das 12:30 (Calcio + Vit D) ainda nao foi marcada como administrada. Favor verificar com ${caregiverName}.`;
    } else if (templateType === 'atraso') {
      tit = isEscolar ? 'Alerta Critico de Atraso' : 'Alerta Importante de Atraso';
      msg = isEscolar
        ? `Anjo Escolar: Alerta de rotina. A rotina de "Banho/Fralda/Sono" de ${elderName} planejada para as 10:00 esta em aberto no painel de acompanhamento de ${caregiverName}.`
        : `AnjoCuidador: Alerta importante. A tarefa "Banho e Higiene" de ${elderName} planejada para as 10:00 esta atrasada e necessita de acompanhamento cuidador de ${caregiverName}.`;
    } else {
      tit = isEscolar ? 'Resumo de Aula do Dia (Diario)' : 'Resumo Diario do Acompanhamento';
      msg = isEscolar
        ? `Anjo Escolar: Resumo do dia escolar de ${elderName}: alimentacao concluida, soneca de 1h30m realizada com sucesso, sem intercorrências e bem acompanhado(a) por ${caregiverName}.`
        : `AnjoCuidador: Resumo do dia de ${elderName}: alimentacao concluida, medicacao feita, hidratacao parcial (800ml/1500ml) e rotina monitorada com sucesso por ${caregiverName}.`;
    }

    triggerWhatsAppSim(tit, msg);
    loadLogs();
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
            <MessageSquare className="w-6 h-6 text-emerald-500" />
            {isEscolar ? 'Central de Mensagens WhatsApp (Envio para os Pais)' : 'Central de Alertas WhatsApp (Envio Assistido)'}
          </h2>
          <p className={`text-sm ${isDark ? 'text-slate-350' : 'text-slate-500'}`}>
            {isEscolar
              ? 'O Anjo Escolar gera comunicados, rotinas e alertas padronizados de forma automatica, permitindo que voce envie um WhatsApp com um unico clique.'
              : 'O AnjoCuidador gera a mensagem padronizada e abre o WhatsApp para que o cuidador confirme o envio aos familiares cadastrados.'}
          </p>
        </div>

        <button 
          onClick={handleClearLogs}
          className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-150 border border-rose-200 px-3.5 py-2.5 rounded-xl cursor-pointer shrink-0"
        >
          Limpar historico
        </button>
      </div>

      
      <div className={`p-5 rounded-2xl border space-y-4 ${
        isDark ? 'bg-[#161e2e] border-slate-750' : 'bg-white border-soft-gray'
      }`}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-500 animate-spin" style={{ animationDuration: '4s' }} />
          <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-750'}`}>{isApresentacao ? 'Modelos de Comunicacao Padronizados (WhatsApp)' : 'Simulador de Modelos de Mensagem (WhatsApp)'}</h3>
        </div>
        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
          Clique nos botoes abaixo para gerar e pre-visualizar os modelos padronizados de mensagens prontos para envio.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => handleTestDispatchTemplates('check')}
            className={`py-2.5 px-3 border text-center leading-normal rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 ${
              isDark 
                ? 'bg-[#1c2738] border-[#2d394e] text-slate-100 hover:bg-[#253248]' 
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            {isEscolar ? '[OK] Rotina Realizada' : '[OK] IngestaoConfirmada'}
          </button>
          <button
            onClick={() => handleTestDispatchTemplates('pendente')}
            className={`py-2.5 px-3 border text-center leading-normal rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 ${
              isDark 
                ? 'bg-[#1c2738] border-[#2d394e] text-slate-100 hover:bg-[#253248]' 
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            {isEscolar ? '[!] Item Pendente' : '[!] Proximo / Pendente'}
          </button>
          <button
            onClick={() => handleTestDispatchTemplates('atraso')}
            className={`py-2.5 px-3 border text-center leading-normal rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 ${
              isDark 
                ? 'bg-[#1c2738] border-[#2d394e] text-danger-400 hover:bg-[#253248] border-rose-900/35 text-rose-400' 
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            {isEscolar ? '  Alerta de Rotina' : '  Alerta Critico Atraso'}
          </button>
          <button
            onClick={() => handleTestDispatchTemplates('resumo')}
            className={`py-2.5 px-3 border text-center leading-normal rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 ${
              isDark 
                ? 'bg-[#1c2738] border-[#2d394e] text-slate-100 hover:bg-[#253248]' 
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            {isEscolar ? '  Diario de Aula' : '  Resumo do Dia'}
          </button>
        </div>
      </div>

      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        
        <div className={`border p-5 rounded-2xl space-y-4 md:col-span-1 ${
          isDark ? 'bg-[#161e2e] border-slate-750' : 'bg-white border-soft-gray'
        }`}>
          <h4 className={`text-base font-bold flex items-center gap-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>
            <Volume2 className="w-5 h-5 text-blue-500" />
            {isEscolar ? 'Central de Mensagens' : 'Vias de Ingressos'}
          </h4>
          <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {isEscolar
              ? 'Sempre que voce registra uma rotina diaria (como sono, alimentacao e comportamento) ou quando preenche a situation de saude do aluno, o app gera uma notificacao correspondente prontinha para compartilhar com os pais.'
              : 'Sempre que uma cuidadora marca uma rotina diaria como concluida (ex: banho oferecido, Losartana das 08h tomada) ou quando os sinais vitais mudam, o app formata a mensagem correspondente para permitir que o cuidador a despache via WhatsApp com um so clique.'}
          </p>

          <div className="space-y-3 pt-2">
            <div className={`flex gap-2 text-xs font-semibold border p-3 rounded-xl items-start ${
              isDark 
                ? 'bg-emerald-950/20 text-emerald-300 border-emerald-900/30' 
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}>
              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">{isEscolar ? 'Comunicacoes Prontas' : 'Resumos Automatizados'}</strong>
                <span className="text-[11px] leading-normal font-medium block">
                  {isEscolar 
                    ? 'Fraldas, mamadeiras, sonecas e fotos geram textos prontos simplificando a comunicacao da rotina.' 
                    : 'Medicamentos e rotinas geram textos prontos eliminando mensagens confusas.'}
                </span>
              </div>
            </div>

            <div className={`flex gap-2 text-xs font-semibold border p-3 rounded-xl items-start ${
              isDark 
                ? 'bg-blue-950/20 text-blue-300 border-blue-900/30' 
                : 'bg-blue-50 text-blue-800 border-blue-200'
            }`}>
              <Lock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Transparencia Etica</strong>
                <span className="text-[11px] leading-normal font-medium block">
                  {isEscolar 
                    ? 'Disparo assistido com controle do professor, sem custos abusivos ou envios indesejados.' 
                    : 'Disparo assistido sem depender de APIs custosas ou automacoes sem crivo.'}
                </span>
              </div>
            </div>
          </div>
        </div>

        
        <div className={`md:col-span-2 rounded-3xl overflow-hidden shadow-lg flex flex-col h-[520px] border ${
          isDark ? 'bg-[#0f172a] border-slate-750' : 'bg-[#efeae2] border-[#d1d7db]'
        }`}>
          
          <div className={`p-4 flex items-center justify-between shrink-0 ${
            isDark ? 'bg-[#202c33] text-[#e9edef]' : 'bg-[#00a884] text-white'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold select-none text-sm shadow-xs border ${
                isDark ? 'bg-[#111b21] hover:bg-[#182229] text-white border-slate-700' : 'bg-[#e1f3fd] text-slate-600'
              }`}>
                {isEscolar ? 'AE' : 'AC'}
              </div>
              <div>
                <h4 className="font-bold text-sm tracking-wide">
                  {isEscolar ? 'Anjo Escolar Comunicados' : 'AnjoCuidador Alertas'}
                </h4>
                <p className={`text-[10px] font-medium flex items-center gap-1 ${
                  isDark ? 'text-[#8696a0]' : 'text-[#e0fbf4]'
                }`}>
                  <span className="w-2 h-2 rounded-full bg-[#18eb5f] animate-pulse"></span>{' '}
                  {isEscolar 
                    ? `Ativo com os Pais de ${cleanStudentName}` 
                    : `Ativo com a Familia de ${cleanStudentName}`}
                </p>
              </div>
            </div>

            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
              isDark ? 'bg-zinc-800 text-slate-300' : 'bg-white/20 text-white'
            }`}>
              {isApresentacao ? 'Pre-Visualizacao' : 'Simulador'}
            </span>
          </div>

          
          <div className={`flex-1 overflow-y-auto p-4 space-y-3 flex flex-col relative ${
            isDark ? 'bg-[#0b141a]' : 'bg-[#efeae2]'
          }`} id="whatsapp-chat-container">
            
            {logs.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2 select-none font-sans">
                <MessageSquare className="w-10 h-10 opacity-30" />
                <p className="text-xs font-medium">As mensagens simuladas de WhatsApp aparecerao aqui na ordem de envio.</p>
                <p className="text-[10px]">Tente marcar uma atividade na tela inicial ou use os botoes rapidos de teste ali em cima!</p>
              </div>
            ) : (() => {
              let lastDateLabel = '';
              return logs.map(log => {
                const dateLabel = getFormattedDateDivider(log.dataEnvio);
                const showDivider = dateLabel !== lastDateLabel;
                lastDateLabel = dateLabel;
                
                const dateText = new Date(log.dataEnvio).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
                const isBroadcastMessage = log.isBroadcast || log.mensagem.includes('COMUNICADO GERAL') || log.mensagem.includes('COMUNICADO DE CLASSE') || (log.destinatariosContagem && log.destinatariosContagem > 1);
                const recipientsList = isBroadcastMessage ? getBroadcastList(log) : [];
                const totalCount = log.destinatariosContagem || (recipientsList.length > 0 ? recipientsList.length : 1);

                return (
                  <React.Fragment key={log.id}>
                    {showDivider && (
                      <div className={`self-center text-[10px] px-3 py-1 rounded-lg text-center select-none font-bold uppercase tracking-wider my-2 shadow-2xs border ${
                        isDark 
                          ? 'bg-[#1f2c34] text-[#8696a0] border-[#2d3941]' 
                          : 'bg-white/85 text-slate-500 border-slate-250'
                      }`}>
                        {dateLabel}
                      </div>
                    )}
                    <div className={`self-end max-w-[85%] p-3 rounded-2xl rounded-tr-xs shadow-xs text-xs space-y-2 align-right transition-all border ${
                      isDark 
                        ? 'bg-[#005c4b] border-[#024f41] text-[#e9edef]' 
                        : 'bg-[#d9fdd3] border-[#e1fad6] text-slate-800'
                    }`}>
                      {isBroadcastMessage && (
                        <div className="flex items-center gap-1.5 pb-1 border-b border-emerald-300/40 text-[10px] font-extrabold text-emerald-900 dark:text-emerald-200">
                          <Users className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300" />
                          <span>Transmissao em Massa   {totalCount} Alunos/Familias</span>
                        </div>
                      )}

                      <p className={`leading-relaxed font-sans whitespace-pre-wrap ${
                        isDark ? 'text-[#e9edef]' : 'text-slate-800'
                      }`}>
                        {log.mensagem}
                      </p>
                      
                      <div className="flex flex-col gap-1.5 pt-1">
                        {isBroadcastMessage ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setSelectedBroadcastLog(log)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-extrabold px-2.5 py-1.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs border border-indigo-500/20"
                            >
                              <Users className="w-3.5 h-3.5" />
                              <span>  Transmitir via WhatsApp para Todos os {totalCount} Pais / Familias</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const phone = log.telefoneDestino || '';
                                const number = formatWhatsAppNumber(phone);
                                const text = encodeURIComponent(log.mensagem);
                                window.open(`https://wa.me/${number}?text=${text}`, '_blank');
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-[10px] font-bold text-white px-2 py-1 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors opacity-90 hover:opacity-100"
                            >
                                Enviar Direct para {log.familiarNome.split(' ')[0]} ({log.telefoneDestino})
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              const phone = log.telefoneDestino || '';
                              const number = formatWhatsAppNumber(phone);
                              const text = encodeURIComponent(log.mensagem);
                              window.open(`https://wa.me/${number}?text=${text}`, '_blank');
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-[10px] font-black text-white px-2 py-0.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors border border-emerald-500/10 shadow-xs justify-end self-end"
                          >
                              Enviar Whatsapp Real para {log.familiarNome.split(' ')[0]} ({log.telefoneDestino})
                          </button>
                        )}
                      </div>
                      
                      <div className={`flex items-center justify-end gap-1 text-[9px] font-mono text-right select-none font-semibold ${
                        isDark ? 'text-[#8696a0]' : 'text-slate-500'
                      }`}>
                        <span>Destino: {isBroadcastMessage ? `Todas as ${totalCount} Familias (${log.familiarNome})` : log.familiarNome}</span>
                        <span> </span>
                        <span>{dateText}</span>
                        <span className="flex text-sky-500">
                          <Check className="w-2.5 h-2.5" />
                          <Check className="w-2.5 h-2.5 -ml-1" />
                        </span>
                      </div>
                    </div>
                  </React.Fragment>
                );
              });
            })()}
          </div>

          
          <div className={`p-2.5 border-t flex items-center gap-3 shrink-0 ${
            isDark ? 'bg-[#202c33] border-[#2f3b43]' : 'bg-[#f0f2f5] border-[#e9edef]'
          }`}>
            <span className="text-[11px] text-[#8696a0] font-medium ml-2">Monitorando de forma passiva...</span>
            <div className="ml-auto flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                isDark ? 'bg-emerald-950 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
              }`}>Integracao Ativa</span>
            </div>
          </div>
        </div>

      </div>

      
      {selectedBroadcastLog && (() => {
        const list = getBroadcastList(selectedBroadcastLog);
        const filteredList = list.filter(item => 
          item.idosoNome.toLowerCase().includes(broadcastSearch.toLowerCase()) ||
          item.familiarNome.toLowerCase().includes(broadcastSearch.toLowerCase()) ||
          item.telefone.includes(broadcastSearch)
        );

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-3xl p-5 border border-slate-200 max-w-xl w-full shadow-2xl space-y-4 max-h-[90vh] flex flex-col text-left">
              <div className="flex items-center justify-between pb-2 border-b border-slate-150 shrink-0">
                <div className="flex items-center gap-2 text-indigo-900">
                  <div className="p-2 bg-indigo-100 rounded-xl text-indigo-700">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800">
                      Transmissao em Massa de WhatsApp
                    </h3>
                    <p className="text-xs text-indigo-700 font-medium">
                      Enviando para {list.length} familias / responsaveis cadastrados
                    </p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setSelectedBroadcastLog(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-600 cursor-pointer"
                >
                   
                </button>
              </div>

              <div className="bg-indigo-50/70 p-3 rounded-2xl border border-indigo-150 text-xs space-y-2 shrink-0">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-indigo-950">  Conteudo doComunicado:</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedBroadcastLog.mensagem);
                      setCopiedSuccess(true);
                      setTimeout(() => setCopiedSuccess(false), 2000);
                    }}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    {copiedSuccess ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSuccess ? 'Copiado!' : 'Copiar Texto'}</span>
                  </button>
                </div>
                <p className="whitespace-pre-wrap font-mono text-[11px] text-slate-700 bg-white p-2.5 rounded-xl border border-indigo-100 max-h-28 overflow-y-auto">
                  {selectedBroadcastLog.mensagem}
                </p>
              </div>

              <div className="relative shrink-0">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Buscar por aluno, pai ou telefone..." 
                  value={broadcastSearch}
                  onChange={e => setBroadcastSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-250 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {filteredList.map((item, idx) => {
                  const number = formatWhatsAppNumber(item.telefone);
                  const text = encodeURIComponent(selectedBroadcastLog.mensagem);
                  const waUrl = `https://wa.me/${number}?text=${text}`;

                  return (
                    <div key={`rcp_item_${idx}`} className="p-2.5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between gap-3 hover:border-indigo-300 transition-all shadow-3xs">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-extrabold text-slate-800"> /  {item.idosoNome}</span>
                          <span className="text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.2 rounded-full font-bold border border-indigo-100">
                            {item.familiarNome}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">  {item.telefone}</p>
                      </div>

                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer transition-all hover:scale-102"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Abrir WhatsApp</span>
                      </a>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-150 flex justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedBroadcastLog(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      
      {showClearConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in shadow-2xl">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 max-w-md w-full shadow-2xl space-y-4 text-left">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-800">
                {isEscolar ? 'Limpar Historico de Comunicados?' : 'Limpar Historico de Alertas?'}
              </h3>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              {isEscolar
                ? 'Deseja limpar todo o historico de mensagens, comunicados e diarios escolares do WhatsApp enviados aos pais do aluno? Essa acao e permanente.'
                : 'Deseja limpar todo o painel de simulacoes e registros de WhatsApp? Essa operacao removera todos os logs correspondentes de forma irreversivel.'}
            </p>

            <div className="flex gap-2 justify-end pt-2 text-xs">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmClearLogs}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-750 text-white font-bold rounded-xl cursor-pointer transition-colors shadow-xs"
              >
                Confirmar Limpeza
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
