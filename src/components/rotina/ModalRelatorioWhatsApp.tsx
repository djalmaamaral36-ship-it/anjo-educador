import React, { useState } from 'react';
import { 
  X, Check, Copy, Send, Sparkles, Clock, MessageSquare,
  Baby, Droplet, Moon, Heart, Thermometer, ShieldCheck
} from 'lucide-react';
import { StudentPaxData } from '../../types';
import { registrarLogAuditoriaLgpd } from '../../services/lgpdService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  student: StudentPaxData;
  tempoEmAula: string;
  aguaMl: number;
  mamadeirasContador: number;
  refeicaoTipo: string;
  aceitacao: string;
  humor: string;
  humorObs: string;
  soneca: string;
  fralda: string;
  temperatura: string;
  checklistCount: number;
  onConfirmarEncerramento?: () => void;
}

export default function ModalRelatorioWhatsApp({
  isOpen,
  onClose,
  student,
  tempoEmAula,
  aguaMl,
  mamadeirasContador,
  refeicaoTipo,
  aceitacao,
  humor,
  humorObs,
  soneca,
  fralda,
  temperatura,
  checklistCount,
  onConfirmarEncerramento,
}: Props) {
  if (!isOpen) return null;

  const [copied, setCopied] = useState(false);
  const [encerradoSucesso, setEncerradoSucesso] = useState(false);

  // Formata o texto para envio no WhatsApp
  const textoWhatsApp = 
`🌟 *DIÁRIO DE CLASSE ESCOLAR — ANJO CUIDADOR* 🌟
----------------------------------------
👶 *Aluno(a)*: ${student.nome} (${student.turma})
👩‍🏫 *Educadora*: ${student.professoraTitular}
📅 *Data*: ${new Date().toLocaleDateString('pt-BR')}
⏱️ *Tempo em Sala*: ${tempoEmAula}

💧 *HIDRATAÇÃO (ÁGUA)*:
• Consumo: ${aguaMl}ml ingeridos (Meta diária de ${student.agua.metaMl}ml)

🍼 *ALIMENTAÇÃO & MAMADEIRAS*:
• Mamadeiras servidas: ${mamadeirasContador} mamadeira(s)
• Refeição do dia: ${refeicaoTipo}
• Aceitação: ${aceitacao}

💤 *SONO & DESCANSO*:
• ${soneca}

🧷 *FRALDA & HIGIENE*:
• Trocas e cuidados: ${fralda}
• Checklist de higiene pessoal: ${checklistCount}/5 cuidados realizados

😊 *HUMOR & DESENVOLVIMENTO*:
• Estado geral: ${humor}
• Nota da educadora: "${humorObs}"

🩺 *SAÚDE & SINAIS*:
• Temperatura: ${temperatura}°C (Afebril, tudo sob controle)

----------------------------------------
💬 _"Acompanhar cada pequeno passo do seu tesouro é nossa maior honra com amor e segurança!"_
🏫 *Colégio Anjo Cuidador — Transparência em Tempo Real*`;

  const handleCopy = () => {
    navigator.clipboard.writeText(textoWhatsApp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleEnviarWhatsApp = () => {
    const telefoneLimpo = student.responsavelTelefone.replace(/\D/g, '');
    const num = telefoneLimpo.length >= 10 ? `55${telefoneLimpo}` : '5511955554440';
    const url = `https://api.whatsapp.com/send?phone=${num}&text=${encodeURIComponent(textoWhatsApp)}`;
    
    // Registra no Livro de Auditoria Digital da LGPD
    registrarLogAuditoriaLgpd({
      tipo: 'whatsapp_diario',
      tipoLabel: 'Diário de Rotina via WhatsApp',
      studentId: student.id,
      studentNome: student.nome,
      turma: student.turma,
      remetenteNome: student.professoraTitular || 'Ana Silva',
      remetenteCargo: 'Professora Titular',
      destinatarioNome: `${student.responsavelNome} (${student.responsavelParentesco})`,
      destinatarioContato: student.responsavelTelefone,
      canal: 'whatsapp',
      conteudoResumo: `Boletim diário: ${aguaMl}ml água, ${mamadeirasContador} mamadeiras, soneca ${soneca}, temp ${temperatura}°C.`,
      conteudoIntegral: textoWhatsApp,
      baseLegalLgpd: 'Art. 14, §1º da Lei 13.709/18 c/c Termo de Consentimento Escolar',
    });

    window.open(url, '_blank');
    if (onConfirmarEncerramento) onConfirmarEncerramento();
    setEncerradoSucesso(true);
  };

  const handleConfirmar = () => {
    if (onConfirmarEncerramento) onConfirmarEncerramento();
    setEncerradoSucesso(true);
    setTimeout(() => {
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOPO COM IDENTIDADE WHATSAPP & ANJO CUIDADOR */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-5 sm:p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/30 text-white flex-shrink-0">
              <MessageSquare size={22} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-100 bg-white/10 px-2.5 py-0.5 rounded-md">
                DISPARO AUTOMÁTICO VIA WHATSAPP
              </span>
              <h3 className="text-lg sm:text-xl font-black text-white leading-tight">
                Boletim Diário — {student.nome}
              </h3>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Para: {student.responsavelNome} ({student.responsavelTelefone})
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

        {/* FEEDBACK DE ENCERRAMENTO */}
        {encerradoSucesso && (
          <div className="m-4 p-4 rounded-2xl bg-emerald-500 text-white font-black text-xs flex items-center gap-2 shadow-sm animate-in fade-in">
            <Check size={18} />
            <span>Aula finalizada com sucesso! Relatório disparado para os pais no WhatsApp.</span>
          </div>
        )}

        {/* CORPO: PREVIEW DA MENSAGEM */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-slate-500">
              PRÉ-VISUALIZAÇÃO DA MENSAGEM FORMATADA:
            </span>
            <button
              onClick={handleCopy}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copied ? 'Copiado para a área!' : 'Copiar Texto'}</span>
            </button>
          </div>

          {/* CAIXA ESTILO BALÃO DO WHATSAPP */}
          <div className="bg-[#EFEAE2] p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-inner">
            <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100 text-xs text-slate-800 whitespace-pre-line font-mono leading-relaxed select-all">
              {textoWhatsApp}
            </div>
          </div>

          {/* RESUMO DOS INDICADORES CHAVE */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-lg block">⏱️</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Tempo</span>
              <p className="font-black text-xs text-slate-800 mt-0.5">{tempoEmAula}</p>
            </div>

            <div className="p-3 bg-sky-50 rounded-2xl border border-sky-100">
              <span className="text-lg block">💧</span>
              <span className="text-[10px] font-bold text-sky-600 uppercase">Água</span>
              <p className="font-black text-xs text-sky-900 mt-0.5">{aguaMl} ml</p>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100">
              <span className="text-lg block">🍼</span>
              <span className="text-[10px] font-bold text-amber-600 uppercase">Mamadeiras</span>
              <p className="font-black text-xs text-amber-900 mt-0.5">{mamadeirasContador} un</p>
            </div>

            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
              <span className="text-lg block">🩺</span>
              <span className="text-[10px] font-bold text-emerald-600 uppercase">Saúde</span>
              <p className="font-black text-xs text-emerald-900 mt-0.5">{temperatura}°C</p>
            </div>
          </div>
        </div>

        {/* RODAPÉ COM BOTÕES DE AÇÃO */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition cursor-pointer"
          >
            Voltar ao Painel
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleConfirmar}
              className="px-5 py-3 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-black rounded-2xl transition cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <Check size={16} />
              <span>Gravar no App & Encerrar</span>
            </button>

            <button
              onClick={handleEnviarWhatsApp}
              className="flex-1 sm:flex-initial px-5 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-black rounded-2xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send size={15} />
              <span>📲 Enviar ao WhatsApp (Opcional)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
