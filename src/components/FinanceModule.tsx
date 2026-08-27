import React, { useState, useEffect } from 'react';
import { Idoso, Usuario } from '../types';
import { getFromDB, saveToDB } from '../data';
import { 
  CreditCard, 
  Coins, 
  CheckCircle, 
  AlertTriangle, 
  Calendar, 
  QrCode, 
  Copy, 
  TrendingUp, 
  DollarSign, 
  FileText, 
  ArrowRight,
  Sparkles,
  Users,
  ShieldCheck,
  RefreshCw,
  Plus
} from 'lucide-react';

interface FinanceModuleProps {
  key?: any;
  idoso: Idoso;
  usuarioAtual: Usuario | null;
  accessibilitySettings: {
    fontSize: 'normal' | 'grande' | 'gigante';
    simplifiedMode: boolean;
    darkMode: boolean;
  };
  keyTrigger: number;
  onRefresh: () => void;
}

interface PaymentHistoryItem {
  id: string;
  competencia: string;
  vencimento: string;
  valor: number;
  status: 'pago' | 'atrasado';
  dataPagamento?: string;
  metodo?: string;
}

export default function FinanceModule({ 
  idoso, 
  usuarioAtual, 
  accessibilitySettings, 
  keyTrigger,
  onRefresh
}: FinanceModuleProps) {
  const [status, setStatus] = useState<'pago' | 'atrasado'>('pago');
  const [price, setPrice] = useState<number>(29.90);
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [billingDay, setBillingDay] = useState<number>(10);
  const [billingType, setBillingType] = useState<'individual' | 'coletivo'>('individual');
  const [history, setHistory] = useState<PaymentHistoryItem[]>([]);
  const [copiedPix, setCopiedPix] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  
  // Custom billing adjustments
  const [customPriceInput, setCustomPriceInput] = useState('29.90');
  const [customDayInput, setCustomDayInput] = useState('10');
  const [successMessage, setSuccessMessage] = useState('');

  const isAdminOrDirector = usuarioAtual?.tipo === 'admin' || usuarioAtual?.tipo === 'profissional' || usuarioAtual?.tipo === 'cuidador';

  useEffect(() => {
    // Load student specific billing info
    const currentStatus = (localStorage.getItem(`anjo_sub_status_${idoso.id}`) as 'pago' | 'atrasado') || 'pago';
    setStatus(currentStatus);

    const isCustomPrice = localStorage.getItem(`anjo_sub_is_custom_${idoso.id}`) === 'true';
    setIsCustom(isCustomPrice);

    const defaultPrice = parseFloat(localStorage.getItem('anjo_sub_valor_default') || '29.90');
    const actualPrice = isCustomPrice 
      ? parseFloat(localStorage.getItem(`anjo_sub_valor_${idoso.id}`) || '29.90')
      : defaultPrice;
    setPrice(actualPrice);
    setCustomPriceInput(actualPrice.toFixed(2));

    const day = parseInt(localStorage.getItem(`anjo_sub_dia_${idoso.id}`) || '10');
    setBillingDay(day);
    setCustomDayInput(day.toString());

    const type = (localStorage.getItem(`anjo_sub_tipo_${idoso.id}`) as 'individual' | 'coletivo') || 'individual';
    setBillingType(type);

    // Load invoice history
    const historyKey = `anjo_sub_historico_${idoso.id}`;
    const savedHistory = localStorage.getItem(historyKey);
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        setHistory(generateDefaultHistory(actualPrice, day, currentStatus));
      }
    } else {
      const defaultHist = generateDefaultHistory(actualPrice, day, currentStatus);
      setHistory(defaultHist);
      localStorage.setItem(historyKey, JSON.stringify(defaultHist));
    }
  }, [idoso.id, keyTrigger]);

  const generateDefaultHistory = (val: number, day: number, currentStat: 'pago' | 'atrasado'): PaymentHistoryItem[] => {
    const hist: PaymentHistoryItem[] = [
      {
        id: 'inv_1',
        competencia: 'Maio / 2026',
        vencimento: `10/05/2026`,
        valor: val,
        status: 'pago',
        dataPagamento: `08/05/2026`,
        metodo: 'Pix'
      },
      {
        id: 'inv_2',
        competencia: 'Junho / 2026',
        vencimento: `10/06/2026`,
        valor: val,
        status: 'pago',
        dataPagamento: `10/06/2026`,
        metodo: 'Cartão de Crédito'
      },
      {
        id: 'inv_3',
        competencia: 'Julho / 2026',
        vencimento: `10/07/2026`,
        valor: val,
        status: currentStat,
        dataPagamento: currentStat === 'pago' ? `09/07/2026` : undefined,
        metodo: currentStat === 'pago' ? 'Pix' : undefined
      }
    ];
    return hist;
  };

  const handleUpdateBillingSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPrice = parseFloat(customPriceInput) || 29.90;
    const cleanDay = parseInt(customDayInput) || 10;

    localStorage.setItem(`anjo_sub_is_custom_${idoso.id}`, 'true');
    localStorage.setItem(`anjo_sub_valor_${idoso.id}`, cleanPrice.toString());
    localStorage.setItem(`anjo_sub_dia_${idoso.id}`, cleanDay.toString());
    localStorage.setItem(`anjo_sub_tipo_${idoso.id}`, billingType);

    setPrice(cleanPrice);
    setIsCustom(true);
    setBillingDay(cleanDay);

    // Update history invoice amounts
    const updatedHistory = history.map(item => {
      if (item.status === 'atrasado') {
        return { ...item, valor: cleanPrice };
      }
      return item;
    });
    setHistory(updatedHistory);
    localStorage.setItem(`anjo_sub_historico_${idoso.id}`, JSON.stringify(updatedHistory));

    setSuccessMessage('⚙ Configurações financeiras do aluno atualizadas com sucesso!');
    setTimeout(() => setSuccessMessage(''), 3000);
    onRefresh();
  };

  const togglePaymentStatus = () => {
    const nextStatus: 'atrasado' | 'pago' = status === 'pago' ? 'atrasado' : 'pago';
    localStorage.setItem(`anjo_sub_status_${idoso.id}`, nextStatus);
    setStatus(nextStatus);

    // Sync history
    const updatedHistory = history.map(item => {
      if (item.id === 'inv_3') {
        return {
          ...item,
          status: nextStatus,
          dataPagamento: nextStatus === 'pago' ? new Date().toLocaleDateString('pt-BR') : undefined,
          metodo: nextStatus === 'pago' ? 'Pix' : undefined
        };
      }
      return item;
    });
    setHistory(updatedHistory);
    localStorage.setItem(`anjo_sub_historico_${idoso.id}`, JSON.stringify(updatedHistory));

    setSuccessMessage(`  Status alterado com sucesso para: ${nextStatus === 'pago' ? 'PAGO (Adimplente)' : 'PENDENTE (Atrasado)'}`);
    setTimeout(() => setSuccessMessage(''), 3000);
    onRefresh();
  };

  const handleCopyPix = () => {
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2000);
  };

  const activeStudentName = idoso.nome.split(' (')[0];
  const pixMockCode = `00020101021126580014br.gov.bcb.pix0136anjinhoescolar-pix-key-99238-128205204000053039865405${price.toFixed(2)}5802BR5915ANJINHO_ESCOLAR6009SAO_PAULO62070503***6304D1B2`;

  return (
    <div className="space-y-6">
      
      
      <div className="bg-white rounded-3xl p-6 border border-indigo-50 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              <CreditCard className="w-5 h-5" />
            </span>
            <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider">Módulo Integrado</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-indigo-950">
            Painel Financeiro & Mensalidades
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Gerencie o plano de mensalidades do aluno <strong className="text-slate-800 font-bold">{activeStudentName}</strong>.
          </p>
        </div>

        
        <div className="flex items-center gap-3 self-stretch md:self-auto border-t md:border-t-0 pt-3 md:pt-0">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] font-black uppercase text-slate-400 block">Status do Aluno</span>
            <span className="text-xs font-semibold text-slate-600">Simulação de Bloqueios</span>
          </div>

          <button
            onClick={togglePaymentStatus}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs transition-all shadow-3xs flex items-center gap-1.5 cursor-pointer ${
              status === 'pago'
                ? 'bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700'
                : 'bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 animate-pulse'
            }`}
            title="Clique para alternar o status de pagamento e testar a visualização dos pais!"
          >
            {status === 'pago' ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-600 fill-emerald-600/10" />
                <span>Mensalidade: PAGA ✅</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-rose-600 animate-bounce" />
                <span>Mensalidade: ATRASADA ⚠</span>
              </>
            )}
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-250 text-emerald-900 rounded-2xl text-xs font-semibold animate-bounce">
          {successMessage}
        </div>
      )}

      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        
        <div className="lg:col-span-8 space-y-6">
          
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            
            <div className="bg-gradient-to-br from-[#FFFDF9] to-[#FFFCEB] border border-amber-200 rounded-3xl p-5 shadow-3xs flex flex-col justify-between min-h-[120px]">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider">Valor Mensal</span>
                <span className="p-1 rounded-lg bg-amber-100 text-amber-800">
                  <Coins className="w-4 h-4" />
                </span>
              </div>
              <div>
                <p className="text-3xl font-serif font-black text-amber-950">R$ {price.toFixed(2).replace('.', ',')}</p>
                <span className="text-[9px] font-extrabold text-amber-700 uppercase tracking-widest mt-0.5 block">
                  {isCustom ? '⭐ Personalizado' : '🏫 Preço Padrão'}
                </span>
              </div>
            </div>

            
            <div className="bg-sky-50/40 border border-sky-100 rounded-3xl p-5 shadow-3xs flex flex-col justify-between min-h-[120px]">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black uppercase text-sky-800 tracking-wider">Vencimento</span>
                <span className="p-1 rounded-lg bg-sky-100 text-sky-800">
                  <Calendar className="w-4 h-4" />
                </span>
              </div>
              <div>
                <p className="text-3xl font-black text-sky-950">Dia {billingDay}</p>
                <span className="text-[9px] font-extrabold text-sky-700 uppercase tracking-widest mt-0.5 block">
                  Cobrança Mensal Recorrente
                </span>
              </div>
            </div>

            
            <div className="bg-indigo-50/40 border border-indigo-100 rounded-3xl p-5 shadow-3xs flex flex-col justify-between min-h-[120px]">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black uppercase text-indigo-800 tracking-wider">Modalidade</span>
                <span className="p-1 rounded-lg bg-indigo-100 text-indigo-800">
                  <Users className="w-4 h-4" />
                </span>
              </div>
              <div>
                <p className="text-xl font-black text-indigo-950 uppercase tracking-tight">
                  {billingType === 'coletivo' ? '  Coletivo' : '  Individual'}
                </p>
                <span className="text-[9px] font-extrabold text-indigo-700 uppercase tracking-widest mt-1 block">
                  Faturamento de Serviços
                </span>
              </div>
            </div>

          </div>

          
          <div className="bg-white rounded-3xl border border-indigo-50 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-indigo-50 bg-indigo-50/20 flex justify-between items-center">
              <h3 className="text-sm font-black text-indigo-950 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" /> Cobrança em Aberto (Competência Corrente)
              </h3>
              <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                status === 'pago' 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                  : 'bg-rose-50 text-rose-700 border-rose-150 animate-pulse'
              }`}>
                {status === 'pago' ? 'Quitada' : 'Aguardando Pagamento'}
              </span>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 font-bold">Anjinho Escolar Serviços Educacionais Ltda.</span>
                  <h4 className="text-base font-bold text-slate-800">Cobrança de Mensalidade Escolar - {activeStudentName}</h4>
                  <p className="text-xs text-slate-500 leading-normal font-medium">
                    Serviço de berçário, cuidados integrados de governança escolar, monitoramento e relatórios de asseio/sono.
                  </p>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Total Devido</span>
                  <strong className="text-2xl font-serif font-black text-slate-900">R$ {price.toFixed(2).replace('.', ',')}</strong>
                </div>
              </div>

              {status === 'atrasado' ? (
                <div className="p-5 rounded-2xl bg-[#FFFDF6] border border-amber-250/50 space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="text-xs font-black text-amber-800 flex items-center gap-1">
                        ⚡ Pagamento Facilitado via Pix
                      </span>
                      <p className="text-[11px] text-amber-900 font-semibold leading-relaxed">
                        Copie a chave Pix Copia e Cola ou escaneie o código QR para realizar a simulação instant de regularização.
                      </p>
                    </div>

                    <button
                      onClick={() => setShowQrCode(!showQrCode)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-[11px] font-black text-slate-800 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-3xs"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>{showQrCode ? 'Ocultar QR Code' : 'Ver QR Code'}</span>
                    </button>
                  </div>

                  {showQrCode && (
                    <div className="flex flex-col items-center justify-center p-4 bg-white border border-slate-100 rounded-xl space-y-2 max-w-[200px] mx-auto shadow-3xs">
                      
                      <div className="w-32 h-32 bg-slate-100 border-4 border-slate-800 p-2 relative flex flex-wrap">
                        <div className="absolute top-2 left-2 w-8 h-8 bg-slate-800 border-2 border-white" />
                        <div className="absolute top-2 right-2 w-8 h-8 bg-slate-800 border-2 border-white" />
                        <div className="absolute bottom-2 left-2 w-8 h-8 bg-slate-800 border-2 border-white" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-indigo-600 rounded-md" />
                        <div className="w-full h-full opacity-35 flex flex-col justify-between py-10 font-mono text-[6px] tracking-tighter text-slate-900 select-none overflow-hidden leading-none">
                          <span>PIX CODE</span>
                          <span>QR SIMULATOR</span>
                        </div>
                      </div>
                      <span className="text-[9px] font-black text-indigo-700 tracking-wider">PIX SEGURO ANJINHO</span>
                    </div>
                  )}

                  
                  <div className="flex gap-2">
                    <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono text-[10px] text-slate-600 select-all truncate">
                      {pixMockCode}
                    </div>
                    <button
                      onClick={handleCopyPix}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-black text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-3xs"
                    >
                      {copiedPix ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copiar Código</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="pt-2 border-t border-amber-200/40 flex justify-between items-center">
                    <span className="text-[10px] text-amber-800 font-extrabold">Seu PIX cai na hora e libera o portal de tranquilidade automaticamente!</span>
                    <button
                      onClick={togglePaymentStatus}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] rounded-lg cursor-pointer transition-all shadow-3xs"
                    >
                      Pagar Fatura Agora (Simulação)  
                    </button>
                  </div>

                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-3">
                  <span className="text-xl"> </span>
                  <div className="space-y-0.5">
                    <strong className="text-xs font-bold text-emerald-950 block">Selo de Regularidade Ativo!</strong>
                    <p className="text-[11px] text-emerald-800 font-semibold">
                      O acesso de todos os pais e autorizados do(a) {activeStudentName} está 100% liberado. Tudo em dia!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          
          <div className="bg-white rounded-3xl border border-indigo-50 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-black text-indigo-950 flex items-center gap-1.5">
              <Calendar className="w-4.5 h-4.5 text-indigo-600" /> Histórico de Faturamento & Recibos
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-indigo-50 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 font-black">Competência</th>
                    <th className="pb-3 font-black">Vencimento</th>
                    <th className="pb-3 font-black text-right">Valor</th>
                    <th className="pb-3 font-black text-center">Status</th>
                    <th className="pb-3 font-black">Método</th>
                    <th className="pb-3 font-black text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-indigo-50/50 text-xs font-semibold text-slate-700">
                  {history.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-3.5 font-bold text-slate-900">{inv.competencia}</td>
                      <td className="py-3.5 text-slate-500">{inv.vencimento}</td>
                      <td className="py-3.5 text-right font-bold text-slate-900">R$ {inv.valor.toFixed(2).replace('.', ',')}</td>
                      <td className="py-3.5 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                          inv.status === 'pago'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : 'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}>
                          {inv.status === 'pago' ? 'Pago' : 'Pendente'}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-500 font-medium">
                        {inv.dataPagamento ? (
                          <span>{inv.metodo} ({inv.dataPagamento})</span>
                        ) : (
                          <span className="italic text-slate-400">Pendente</span>
                        )}
                      </td>
                      <td className="py-3.5 text-right">
                        <button
                          onClick={() => alert(`  Recibo PDF da competência "${inv.competencia}" simulado com sucesso. Arquivo anjo_recibo_${inv.id}.pdf pronto para impressão!`)}
                          className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-indigo-100 rounded-md text-[10px] font-black text-indigo-700 transition-all cursor-pointer"
                        >
                          Recibo
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        
        <div className="lg:col-span-4 space-y-6">
          
          
          <div className="bg-white rounded-3xl border border-indigo-50 shadow-sm p-6 space-y-5">
            <div className="border-b border-indigo-50 pb-3">
              <h3 className="text-sm font-black text-indigo-950 flex items-center gap-1.5">
                <ShieldCheck className="w-4.5 h-4.5 text-indigo-600" /> Configuração Escolar (Diretores)
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold leading-relaxed mt-1">
                Ajuste o plano de mensalidade específico deste aluno para simular diferentes condições.
              </p>
            </div>

            {isAdminOrDirector ? (
              <form onSubmit={handleUpdateBillingSettings} className="space-y-4">
                
                
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 block">
                    Valor Mensal da Turma (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={customPriceInput}
                      onChange={(e) => setCustomPriceInput(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="29.90"
                    />
                  </div>
                </div>

                
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 block">
                    Dia do Vencimento Recorrente
                  </label>
                  <select
                    value={customDayInput}
                    onChange={(e) => setCustomDayInput(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    <option value="5">Dia 5 de cada mês</option>
                    <option value="10">Dia 10 de cada mês</option>
                    <option value="15">Dia 15 de cada mês</option>
                    <option value="20">Dia 20 de cada mês</option>
                  </select>
                </div>

                
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 block">
                    Tipo de Plano do Aluno
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setBillingType('individual')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        billingType === 'individual'
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                        Individual
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillingType('coletivo')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        billingType === 'coletivo'
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                        Coletivo
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-3xs cursor-pointer text-center"
                >
                  Salvar Ajustes do Aluno  
                </button>

              </form>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <span className="text-base"> </span>
                <strong className="text-xs font-bold text-slate-800 block">Acesso Reservado à Direção</strong>
                <p className="text-[11px] text-slate-500 leading-normal font-medium">
                  Para alterar as mensalidades ou configurar preços específicos, use um perfil de Professor ou Diretor com PIN autorizado.
                </p>
              </div>
            )}
          </div>

          
          <div className="bg-gradient-to-br from-indigo-950 to-[#2A2359] border border-indigo-900 text-white rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-amber-300">
              Sobre o Faturamento Anjinho®
            </h3>
            <p className="text-[11px] text-indigo-100 font-semibold leading-relaxed">
              Nosso sistema de mensalidades é integrado ao controle de acessos da escola:
            </p>
            <ul className="text-[11px] text-indigo-100 space-y-2 font-medium list-disc list-inside">
              <li>Inadimplência gera paywall preventivo na conta dos familiares.</li>
              <li>Acesso da equipe de educadores e diretores NUNCA é suspenso por débitos.</li>
              <li>Faturas são geradas automaticamente no dia configurado.</li>
              <li>Controle unificado de planos individuais ou faturamento coletivo municipal.</li>
            </ul>
            <div className="pt-2 border-t border-indigo-850 flex items-center justify-between text-[10px] text-indigo-200 font-bold">
              <span>Tecnologia de Faturamento Integrada</span>
              <span className="text-amber-300">Selo Anjinho</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
