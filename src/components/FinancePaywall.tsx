import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  CreditCard, 
  CheckCircle, 
  QrCode, 
  Sparkles, 
  ArrowRight, 
  HelpCircle,
  Copy,
  Check,
  Percent,
  MessageSquare,
  TrendingUp,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Idoso, Usuario, formatWhatsAppNumber } from '../types';

// Helper function to generate Pix Copia e Cola dynamically with CRC16 calculation
function generatePixPayload(key: string, name: string, amount: number, txid: string): string {
  const cleanKey = key.trim();
  const cleanName = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-zA-Z0-9 ]/g, "") // alphanumeric and spaces only
    .substring(0, 25)
    .trim() || "Anjo Cuidador";

  const formattedAmount = amount.toFixed(2);

  // Field 26: Merchant Account Information
  const gui = "0014br.gov.bcb.pix";
  const keyField = "01" + cleanKey.length.toString().padStart(2, '0') + cleanKey;
  const field26Value = gui + keyField;
  const field26 = "26" + field26Value.length.toString().padStart(2, '0') + field26Value;

  // Field 52: Merchant Category Code
  const field52 = "52040000";

  // Field 53: Transaction Currency (986 = BRL)
  const field53 = "5303986";

  // Field 54: Transaction Amount
  const field54 = "54" + formattedAmount.length.toString().padStart(2, '0') + formattedAmount;

  // Field 58: Country Code
  const field58 = "5802BR";

  // Field 59: Merchant Name
  const field59 = "59" + cleanName.length.toString().padStart(2, '0') + cleanName;

  // Field 60: Merchant City
  const city = "SAO PAULO";
  const field60 = "60" + city.length.toString().padStart(2, '0') + city;

  // Field 62: Additional Data Field Template (TXID)
  const cleanTxid = txid.substring(0, 25).replace(/[^a-zA-Z0-9]/g, "") || "ASSINATURA";
  const txidField = "05" + cleanTxid.length.toString().padStart(2, '0') + cleanTxid;
  const field62 = "62" + txidField.length.toString().padStart(2, '0') + txidField;

  // Concatenate everything up to field 63
  const part1 = "000201" + field26 + field52 + field53 + field54 + field58 + field59 + field60 + field62 + "6304";

  // Calculate CRC16 CCITT (polynomial 0x1021, initial value 0xFFFF)
  let crc = 0xFFFF;
  const polynomial = 0x1021;
  for (let i = 0; i < part1.length; i++) {
    const b = part1.charCodeAt(i);
    for (let j = 0; j < 8; j++) {
      const bit = ((b >> (7 - j)) & 1) === 1;
      const c15 = ((crc >> 15) & 1) === 1;
      crc <<= 1;
      if (c15 !== bit) {
        crc ^= polynomial;
      }
    }
  }
  crc &= 0xFFFF;
  const crcHex = crc.toString(16).toUpperCase().padStart(4, '0');

  return part1 + crcHex;
}

interface FinancePaywallProps {
  idoso: Idoso;
  usuarioAtual: Usuario;
  onPaymentSuccess: () => void;
  accessibilitySettings: {
    fontSize: 'normal' | 'grande' | 'gigante';
    darkMode: boolean;
  };
}

export default function FinancePaywall({ 
  idoso, 
  usuarioAtual, 
  onPaymentSuccess,
  accessibilitySettings 
}: FinancePaywallProps) {
  const [selectedPlan, setSelectedPlan] = useState<'mensal' | 'semestral' | 'anual'>('mensal');
  const [cpf, setCpf] = useState(() => localStorage.getItem(`anjo_pay_cpf_${usuarioAtual.id}`) || '123.456.789-00');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [whatsappSent, setWhatsappSent] = useState(false);

  // Dynamic pricing values
  const isCustom = localStorage.getItem(`anjo_sub_is_custom_${idoso.id}`) === 'true';
  const customPreco = isCustom
    ? parseFloat(localStorage.getItem(`anjo_sub_valor_${idoso.id}`) || '29.90')
    : parseFloat(localStorage.getItem('anjo_sub_valor_default') || '29.90');
  const customTipo = localStorage.getItem(`anjo_sub_tipo_${idoso.id}`) || 'individual';

  const pixKeyFromStorage = localStorage.getItem('anjo_billing_pix') || 'djalmaamaral36@gmail.com';
  const pixReceiverFromStorage = localStorage.getItem('anjo_billing_receiver') || 'Djalma Amaral';

  const cleanCpf = cpf.replace(/\D/g, '');
  const txid = cleanCpf ? `CPF${cleanCpf}`.substring(0, 25) : "ASSINATURA";

  // Generate dynamic Pix codes for each plan using our helper
  const dynamicPixMensal = generatePixPayload(pixKeyFromStorage, pixReceiverFromStorage, customPreco, txid);
  const dynamicPixSemestral = generatePixPayload(pixKeyFromStorage, pixReceiverFromStorage, 150.00, txid);
  const dynamicPixAnual = generatePixPayload(pixKeyFromStorage, pixReceiverFromStorage, 250.00, txid);

  const plans = {
    mensal: {
      nome: 'Plano Mensal',
      preco: customPreco,
      precoMensal: customPreco,
      economia: null,
      tag: 'Mais Simples',
      codigoPix: dynamicPixMensal
    },
    semestral: {
      nome: 'Plano Semestral',
      preco: 150.00,
      precoMensal: 25.00,
      economia: 'Economize 16%',
      tag: 'Recomendado',
      codigoPix: dynamicPixSemestral
    },
    anual: {
      nome: 'Plano Anual',
      preco: 250.00,
      precoMensal: 20.83,
      economia: 'Economize 30%',
      tag: 'Melhor Custo-Benefício',
      codigoPix: dynamicPixAnual
    }
  };

  const activePlan = plans[selectedPlan];
  const dynamicPixKey = activePlan.codigoPix;

  useEffect(() => {
    localStorage.setItem(`anjo_pay_cpf_${usuarioAtual.id}`, cpf);
  }, [cpf, usuarioAtual.id]);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(dynamicPixKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulatePayment = () => {
    setLoading(true);
    
    // Simulate real webhook dynamic check wait
    setTimeout(() => {
      // Audio chime simulation
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Beautiful modern triple-up chime (C5 -> E5 -> G5) to simulate instant digital successful transfer
        const playTone = (freq: number, start: number, duration: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
          gain.gain.setValueAtTime(0, ctx.currentTime + start);
          gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + start + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + start);
          osc.stop(ctx.currentTime + start + duration);
        };

        playTone(523.25, 0, 0.4); // C5
        playTone(659.25, 0.15, 0.4); // E5
        playTone(783.99, 0.3, 0.6); // G5 (sustained)
      } catch (e) {
        // Safe bypass
      }

      setLoading(false);
      
      // Save state to DB for the specific profile
      localStorage.setItem(`anjo_sub_status_${idoso.id}`, 'pago');
      
      // Record payment in simulated history log
      const historyKey = `anjo_sub_historico_${idoso.id}`;
      const existingHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
      const newPayment = {
        id: 'pay_' + Date.now(),
        data: new Date().toLocaleDateString('pt-BR'),
        plano: activePlan.nome,
        valor: activePlan.preco,
        status: 'pago',
        comprovante: 'TX-' + Math.floor(Math.random() * 900000 + 100000)
      };
      localStorage.setItem(historyKey, JSON.stringify([newPayment, ...existingHistory]));

      // Dispatch event to update App.tsx states instantly!
      window.dispatchEvent(new Event('anjo_user_updated'));
      onPaymentSuccess();
    }, 1500);
  };

  const handleSendReminderToWhatsApp = () => {
    const appMode = localStorage.getItem('anjo_app_mode') || 'idoso';
    const idosoNome = idoso?.nome || '';
    const idosoId = idoso?.id || '';
    const isEscolar = idosoNome.toLowerCase().includes('infantil') || idosoId.startsWith('aluno_') || appMode === 'escolar_infantil' || appMode === 'escolar_fundamental';
    const appName = isEscolar ? 'Anjinho Escolar' : 'Anjo Cuidador';
    
    const message = `Olá, *${usuarioAtual.nome}*! 🔔\n\nSua assinatura do aplicativo *${appName}* para acompanhar o(a) *${idosoNome}* está pendente.\n\n👉 *Plano Escolhido:* ${activePlan.nome} (${activePlan.economia ? activePlan.economia : 'Ativação imediata'})\n💵 *Valor:* R$ ${activePlan.preco.toFixed(2).replace('.', ',')}\n\n🔑 *Pix Copia e Cola:* \n\`${dynamicPixKey}\`\n\n_Copie o código acima e pague no app do seu banco. O desbloqueio do painel de familiares será feito em segundos após o pagamento!_`;
    
    const cleanNum = formatWhatsAppNumber(usuarioAtual.telefone || '11999999999');
    const url = `https://wa.me/${cleanNum}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    setWhatsappSent(true);
    setTimeout(() => setWhatsappSent(false), 3000);
  };

  const isDark = accessibilitySettings.darkMode;
  const appMode = localStorage.getItem('anjo_app_mode') || 'idoso';
  const isEscolar = (idoso?.nome || '').toLowerCase().includes('infantil') || (idoso?.id || '').startsWith('aluno_') || appMode === 'escolar_infantil' || appMode === 'escolar_fundamental';

  return (
    <div className={`max-w-3xl mx-auto my-6 p-5 md:p-8 rounded-3xl border shadow-2xl text-center space-y-6 relative overflow-hidden transition-all ${
      isDark ? 'bg-slate-900 border-slate-800 text-white shadow-black/40' : 'bg-white border-slate-200 shadow-xl'
    }`}>
      {/* Absolute visual premium indicator line */}
      <div className="absolute top-0 left-0 right-0 h-2.5 bg-gradient-to-r from-indigo-500 via-emerald-500 to-teal-500"></div>
      
      <div className="flex flex-col items-center space-y-2">
        <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center border border-rose-200 shadow-xs relative">
          <Lock className="w-7 h-7 text-rose-500" />
          <span className="absolute -bottom-1 -right-1 bg-rose-600 text-[9px] text-white px-1.5 py-0.5 rounded-full font-black uppercase">Bloqueado</span>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 text-[10px] font-black rounded-full uppercase tracking-wider border border-rose-100">
          <AlertCircle className="w-3.5 h-3.5" />
          Acesso Suspenso Temporariamente
        </div>
      </div>

      <div className="space-y-2">
        <h3 className={`text-xl md:text-2xl font-black font-display tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Seu Período de Testes Expirou ou Assinatura Pendente
        </h3>
        <p className={`text-xs md:text-sm max-w-lg mx-auto leading-relaxed font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          Olá, <strong>{usuarioAtual.nome}</strong>! Para continuar acompanhando em tempo real a rotina diária, mamadeiras, sinais vitais, medicamentos e relatórios do(a) <strong>{idoso.nome}</strong>, regularize sua assinatura mensal no Pix.
        </p>
      </div>

      {/* 💸 ANCORAGEM COMERCIAL: ESCOLHA DE PLANOS */}
      <div className="space-y-3 text-left">
        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5" />
          Escolha o Plano Ideal e Economize (Assinatura Pix Manual)
        </span>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          {/* Plano Mensal */}
          <button
            type="button"
            onClick={() => setSelectedPlan('mensal')}
            className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
              selectedPlan === 'mensal'
                ? 'border-indigo-600 ring-2 ring-indigo-500/10 bg-indigo-50/20'
                : 'border-slate-200 hover:border-slate-300 bg-transparent'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-400">Mensal</span>
                <span className={`px-2 py-0.5 text-[9px] font-black rounded-md uppercase ${
                  customTipo === 'coletivo'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-indigo-100 text-indigo-800'
                }`}>
                  {customTipo === 'coletivo' ? '👥 Coletivo' : '👤 Individual'}
                </span>
              </div>
              <h4 className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>R$ {plans.mensal.preco.toFixed(2).replace('.', ',')} <span className="text-xs font-medium text-slate-500">/mês</span></h4>
            </div>
            <p className="text-[10px] text-slate-500 font-semibold mt-4 leading-relaxed">
              {customTipo === 'coletivo'
                ? 'Desconto Coletivo Irmãos ativado para esta mensalidade!'
                : 'Tarifa mensal integral para um único aluno cadastrado.'}
            </p>
          </button>

          {/* Plano Semestral */}
          <button
            type="button"
            onClick={() => setSelectedPlan('semestral')}
            className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
              selectedPlan === 'semestral'
                ? 'border-indigo-600 ring-2 ring-indigo-500/10 bg-indigo-50/20'
                : 'border-slate-200 hover:border-slate-300 bg-transparent'
            }`}
          >
            <div className="absolute -top-2 right-3 px-2 py-0.5 bg-indigo-600 text-white text-[9px] font-black rounded-full uppercase tracking-wider shadow-xs">
              Popular 👑
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-400">Semestral</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-black rounded-md uppercase">Salva 16%</span>
              </div>
              <h4 className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>R$ 150,00 <span className="text-xs font-medium text-slate-500">/semestre</span></h4>
              <p className="text-[10px] font-black text-indigo-600">Equivale a R$ 25,00/mês</p>
            </div>
            <p className="text-[10px] text-slate-500 font-semibold mt-2 leading-relaxed">
              Evite esquecimentos e cobranças recorrentes por 6 meses seguidos.
            </p>
          </button>

          {/* Plano Anual */}
          <button
            type="button"
            onClick={() => setSelectedPlan('anual')}
            className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
              selectedPlan === 'anual'
                ? 'border-indigo-600 ring-2 ring-indigo-500/10 bg-indigo-50/20'
                : 'border-slate-200 hover:border-slate-300 bg-transparent'
            }`}
          >
            <div className="absolute -top-2 right-3 px-2 py-0.5 bg-emerald-600 text-white text-[9px] font-black rounded-full uppercase tracking-wider shadow-xs">
              Economia Máxima 💰
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-400">Anual</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-black rounded-md uppercase">Salva 30%</span>
              </div>
              <h4 className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>R$ 250,00 <span className="text-xs font-medium text-slate-500">/ano</span></h4>
              <p className="text-[10px] font-black text-emerald-600">Equivale a R$ 20,83/mês</p>
            </div>
            <p className="text-[10px] text-slate-500 font-semibold mt-2 leading-relaxed">
              O preferido dos pais no início do ano letivo. Tranquilidade garantida!
            </p>
          </button>

        </div>
      </div>

      {/* 💳 DADOS DO PAGAMENTO INTEGRADO & WEBHOOK AUTOMÁTICO */}
      <div className={`p-5 md:p-6 rounded-3xl border ${
        isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50/50 border-slate-200'
      } space-y-4`}>
        
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <span className="text-xs font-black text-slate-800 flex items-center gap-1.5 uppercase">
            <QrCode className="w-4 h-4 text-indigo-600" />
            Gateway Pix Copia e Cola Inteligente
          </span>
          <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
            Liberação por Webhook em Segundos
          </span>
        </div>

        {/* Dynamic customized CPF input to show anchoring */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase">CPF do Pagador (Ancorar no Pix)</label>
            <input 
              type="text" 
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              placeholder="000.000.000-00"
              className={`w-full px-3.5 py-2 rounded-xl border text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-250 text-slate-800'
              }`}
            />
            <span className="text-[9px] text-slate-400 font-medium block">Necessário para conciliação automática via Webhook</span>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase">Resumo da Compra</label>
            <div className={`p-2 rounded-xl border flex items-center justify-between text-xs font-bold ${
              isDark ? 'bg-slate-900 border-slate-750' : 'bg-white border-slate-200'
            }`}>
              <span className="text-slate-600">{activePlan.nome}</span>
              <span className="text-indigo-600">R$ {activePlan.preco.toFixed(2).replace('.', ',')}</span>
            </div>
            {activePlan.economia && (
              <span className="text-[9px] text-emerald-600 font-extrabold bg-emerald-50 px-1.5 py-0.5 rounded inline-block uppercase">
                🏷️ {activePlan.economia} obtido!
              </span>
            )}
          </div>
        </div>

        {/* Dynamic interactive payment block */}
        <div className="flex flex-col md:flex-row items-center gap-6 pt-2">
          
          {/* Visual Interactive QR Code */}
          <div className={`p-3 rounded-2xl border-2 border-slate-200 bg-white flex flex-col items-center justify-center shrink-0 shadow-xs relative group ${
            loading ? 'opacity-40' : ''
          }`}>
            <div className="grid grid-cols-6 gap-1 p-1">
              {[...Array(36)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-3.5 h-3.5 rounded-xs transition-colors duration-300 ${
                    selectedPlan === 'anual' && i % 4 === 0 
                      ? 'bg-indigo-900' 
                      : selectedPlan === 'semestral' && i % 3 === 0 
                        ? 'bg-emerald-950' 
                        : (i % 2 === 0 || i % 5 === 0 || i < 6 || i > 30) ? 'bg-slate-900' : 'bg-transparent'
                  }`}
                />
              ))}
            </div>
            
            {/* Core logo watermark */}
            <div className="absolute inset-0 m-auto w-10 h-10 bg-indigo-600 border-2 border-white rounded-xl flex items-center justify-center text-white text-[9px] font-black uppercase tracking-tighter">
              PIX
            </div>
          </div>

          {/* Copia e Cola copy mechanism */}
          <div className="flex-1 space-y-3 text-left w-full">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-500">Chave Copia e Cola do {activePlan.nome}</span>
              <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl p-1.5 shadow-xs w-full">
                <input 
                  type="text" 
                  readOnly 
                  value={dynamicPixKey}
                  className="px-2 flex-1 text-[10px] font-mono text-slate-400 select-all truncate bg-transparent focus:outline-none"
                  title="Código Pix gerado dinamicamente"
                />
                <button
                  type="button"
                  onClick={handleCopyKey}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black uppercase flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300 animate-scale-in" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Pix</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Simulated instant activation trigger */}
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleSimulatePayment}
                disabled={loading}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase rounded-xl transition-all shadow-xs hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer border border-emerald-500/10"
              >
                {loading ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-white rounded-full animate-ping"></span>
                    Webhook: Confirmando Pix no Banco...
                  </span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-25" />
                    Simular Pagamento Prático (Liberar App)
                  </>
                )}
              </button>

              {/* 📲 Automação Salvadora: WhatsApp dispatch button */}
              <button
                type="button"
                onClick={handleSendReminderToWhatsApp}
                className={`py-3 px-4 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                  isDark 
                    ? 'border-slate-800 hover:bg-slate-850 text-slate-300' 
                    : 'border-slate-200 hover:bg-slate-100 text-slate-650 bg-white'
                }`}
                title="A Automação Salvadora: Envia o Pix Copia e Cola diretamente no celular do pai por WhatsApp"
              >
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>Enviar p/ WhatsApp</span>
              </button>
            </div>

            <span className="text-[10px] text-slate-400 font-semibold block text-center sm:text-left">
              💡 <strong>Dica de Teste:</strong> Clique em "Simular Pagamento" para escutar o aviso sonoro e desbloquear o aplicativo imediatamente por webhook simulado!
            </span>
          </div>

        </div>

      </div>

      {/* Access info banner details */}
      <div className={`p-4 rounded-2xl border text-left space-y-2.5 text-xs font-medium leading-relaxed ${
        isDark ? 'bg-slate-950/40 border-slate-850' : 'bg-slate-50 border-slate-200'
      }`}>
        <h4 className="font-bold text-slate-850 flex items-center gap-1.5 uppercase text-[10px] tracking-wider text-indigo-600">
          🛡️ Como funciona a conciliação automática?
        </h4>
        <ul className="space-y-2 text-slate-600">
          <li className="flex items-start gap-1.5">
            <span className="text-emerald-500 font-bold shrink-0">✓</span>
            <span>O sistema gera o Pix customizado com o seu identificador de tutor.</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-emerald-500 font-bold shrink-0">✓</span>
            <span>Assim que o pagamento é feito, o banco envia um aviso (Webhook) para nossa API.</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-emerald-500 font-bold shrink-0">✓</span>
            <span>O sistema libera na hora todos os acessos dos familiares (cônjuges, avós, tios) de forma 100% autônoma!</span>
          </li>
        </ul>
      </div>

      <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1.5 p-2 bg-slate-50 border border-slate-100 rounded-xl font-bold">
        <HelpCircle className="w-4 h-4 text-slate-400" />
        <span>Dúvidas com o financeiro? Fale com o suporte da administração da instituição escolar ou asilo de acolhimento.</span>
      </div>
    </div>
  );
}
