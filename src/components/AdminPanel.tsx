import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Download, 
  ExternalLink, 
  RefreshCw, 
  Search, 
  DollarSign, 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle,
  FileText,
  UserCheck,
  QrCode,
  Share2,
  Copy,
  Check,
  MessageSquare,
  X,
  CreditCard,
  Coins,
  Plus,
  HelpCircle,
  Clock,
  Lock,
  GraduationCap,
  Baby,
  Filter,
  Send,
  MessageCircleHeart,
  Sparkles,
  MapPin,
  Bell
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { getFromDB, saveToDB } from '../data';
import { Idoso, Usuario, formatWhatsAppNumber } from '../types';

interface AdminPanelProps {
  accessibilitySettings: {
    fontSize: 'normal' | 'grande' | 'gigante';
    darkMode: boolean;
  };
  triggerWhatsAppSim?: (titulo: string, mensagem: string) => void;
  idoso?: Idoso;
  appMode?: string;
}

interface ConsentRecord {
  id: string;
  usuarioNome: string;
  usuarioEmail: string;
  usuarioTelefone: string;
  usuarioTipo: string;
  idosoNome: string;
  dataConsentimento: string;
  modoApp: string;
  deviceFingerprint: string;
  statusFinanceiro: string;
}

export default function AdminPanel({ accessibilitySettings, triggerWhatsAppSim, idoso, appMode }: AdminPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [seniors, setSeniors] = useState<Idoso[]>([]);
  const [users, setUsers] = useState<Usuario[]>([]);
  const [filterMode, setFilterMode] = useState<'todos' | 'idoso' | 'escolar'>('todos');
  const [integrationCodeVisible, setIntegrationCodeVisible] = useState(false);
  
  // Marketing campaign states for QR Code Generator
  const [qrCampaign, setQrCampaign] = useState<'nenhum' | 'recepcao' | 'panfleto' | 'parceiros'>('nenhum');
  const [overrideUrl, setOverrideUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [qrTargetMode, setQrTargetMode] = useState<'idoso' | 'escolar_infantil'>('idoso');
  const [qrSourceEngine, setQrSourceEngine] = useState<'google' | 'qrserver'>('google');

  useEffect(() => {
    if (typeof window !== 'undefined' && !overrideUrl) {
      setOverrideUrl(window.location.origin);
    }
  }, []);

  // Co-branding states
  const [instNameInput, setInstNameInput] = useState('');
  const [instLogoInput, setInstLogoInput] = useState('');

  // States for commercial WhatsApp billing notifications
  const [billingModalUser, setBillingModalUser] = useState<ConsentRecord | null>(null);
  const [billingPixKey, setBillingPixKey] = useState(() => localStorage.getItem('anjo_billing_pix') || 'djalmaamaral36@gmail.com');
  const [billingPixReceiver, setBillingPixReceiver] = useState(() => localStorage.getItem('anjo_billing_receiver') || 'Djalma Amaral');
  const [billingMessageType, setBillingMessageType] = useState<'trial_ending' | 'monthly_billing' | 'block_warning'>('trial_ending');
  const [billingCustomText, setBillingCustomText] = useState('');

  // 📈 Jornada de Vendas 30 Dias State & Helper
  const [selectedJourneyUser, setSelectedJourneyUser] = useState<ConsentRecord | null>(null);

  // Subscription States
  const [selectedIdosoId, setSelectedIdosoId] = useState<string>('');
  const [subStatus, setSubStatus] = useState<'pago' | 'atrasado'>('pago');
  const [globalSubValor, setGlobalSubValor] = useState<number>(() => {
    return parseFloat(localStorage.getItem('anjo_sub_valor_default') || '29.90');
  });
  const [isCustomValor, setIsCustomValor] = useState<boolean>(false);
  const [subValor, setSubValor] = useState<number>(29.90);
  const [subDia, setSubDia] = useState<number>(10);
  const [subTipo, setSubTipo] = useState<'individual' | 'coletivo'>('individual');
  const [subHistory, setSubHistory] = useState<any[]>([]);
  const [savingMessage, setSavingMessage] = useState<string>('');

  // Sinais vitais / Saúde, Sono & Fralda states
  const [sinaisList, setSinaisList] = useState<any[]>([]);
  const [sinaisSearchTerm, setSinaisSearchTerm] = useState('');
  const [sinaisFilterMode, setSinaisFilterMode] = useState<'todos' | 'idoso' | 'creche' | 'fundamental'>('todos');

  // 🏫 CRM ANJINHO ESCOLAR BAURU (Controle de Famílias & Funil)
  const [adminActiveTab, setAdminActiveTab] = useState<'faturamento' | 'crm_escolar'>('faturamento');
  const [crmSubTab, setCrmSubTab] = useState<'dashboard' | 'familias' | 'origem' | 'jornada' | 'financeiro'>('dashboard');
  const [crmSearch, setCrmSearch] = useState('');
  const [crmEscolaFilter, setCrmEscolaFilter] = useState('Todas');
  const [crmCampanhaFilter, setCrmCampanhaFilter] = useState('Todas');
  const [crmStatusFilter, setCrmStatusFilter] = useState('Todos');
  const [crmNewFamilyModal, setCrmNewFamilyModal] = useState(false);
  const [crmToast, setCrmToast] = useState<string | null>(null);

  // Form states for adding a new family to Bauru CRM
  const [newFamMae, setNewFamMae] = useState('');
  const [newFamTelefone, setNewFamTelefone] = useState('');
  const [newFamEmail, setNewFamEmail] = useState('');
  const [newFamCrianca, setNewFamCrianca] = useState('');
  const [newFamIdade, setNewFamIdade] = useState('4 anos');
  const [newFamEscola, setNewFamEscola] = useState('EMEF Santa Maria - Bauru');
  const [newFamOrigem, setNewFamOrigem] = useState('QR Code Entrada');
  const [newFamCampanha, setNewFamCampanha] = useState('Panfletagem Portão 7h30');

  // Bauru CRM Families State
  const [crmFamilias, setCrmFamilias] = useState<any[]>(() => {
    const saved = localStorage.getItem('anjo_crm_familias_bauru');
    if (saved) {
      try { return JSON.parse(saved); } catch(e){}
    }
    return [
      {
        id: 'crm_fam_1',
        responsavel: 'Mariana Silva',
        telefone: '(14) 99812-3401',
        email: 'mariana.silva@gmail.com',
        crianca: 'Helena Silva',
        idade: '4 anos',
        escola: 'EMEF Santa Maria - Bauru',
        origem: 'QR Code Entrada',
        campanha: 'Panfletagem Portão 7h30',
        dataAdesao: '12/05/2025',
        status: 'Ativo',
        statusFinanceiro: 'pago',
        valorMensal: 29.90,
        diaJornada: 28,
        likesRecebidos: 14,
        regadasAmor: 6,
        ultimoContato: 'Hoje às 08:30'
      },
      {
        id: 'crm_fam_2',
        responsavel: 'Rafael Oliveira',
        telefone: '(14) 99123-8842',
        email: 'rafael.oli@hotmail.com',
        crianca: 'Theo Oliveira',
        idade: '5 anos',
        escola: 'Colégio São Francisco',
        origem: 'Recepção da Escola',
        campanha: 'Volta às Aulas 2025',
        dataAdesao: '18/05/2025',
        status: 'Ativo',
        statusFinanceiro: 'pago',
        valorMensal: 29.90,
        diaJornada: 22,
        likesRecebidos: 19,
        regadasAmor: 9,
        ultimoContato: 'Ontem'
      },
      {
        id: 'crm_fam_3',
        responsavel: 'Juliana Costa',
        telefone: '(14) 98111-4433',
        email: 'ju.costa@outlook.com',
        crianca: 'Laura e Enzo',
        idade: '3 e 6 anos',
        escola: 'EMEI Leila de Fátima',
        origem: 'Instagram',
        campanha: 'Campanha Insta Bauru',
        dataAdesao: '20/05/2025',
        status: 'Teste (Trial)',
        statusFinanceiro: 'pago',
        valorMensal: 59.80,
        diaJornada: 14,
        likesRecebidos: 8,
        regadasAmor: 4,
        ultimoContato: 'Há 2 dias'
      },
      {
        id: 'crm_fam_4',
        responsavel: 'Carlos Eduardo',
        telefone: '(14) 99777-2211',
        email: 'carlos.edu@yahoo.com.br',
        crianca: 'Enzo Alencar',
        idade: '4 anos',
        escola: 'Escola Criativa Bauru',
        origem: 'QR Code Entrada',
        campanha: 'Panfletagem Portão 7h30',
        dataAdesao: '02/06/2025',
        status: 'Ativo',
        statusFinanceiro: 'pago',
        valorMensal: 29.90,
        diaJornada: 9,
        likesRecebidos: 12,
        regadasAmor: 5,
        ultimoContato: 'Hoje às 10:15'
      },
      {
        id: 'crm_fam_5',
        responsavel: 'Fernanda Lima',
        telefone: '(14) 99654-1100',
        email: 'fer.lima@gmail.com',
        crianca: 'Beatriz Castro',
        idade: '3 anos',
        escola: 'Colégio Preve Objetivo',
        origem: 'Indicação de Mães',
        campanha: 'Indique uma Mãe',
        dataAdesao: '08/06/2025',
        status: 'Pendente',
        statusFinanceiro: 'atrasado',
        valorMensal: 29.90,
        diaJornada: 30,
        likesRecebidos: 2,
        regadasAmor: 1,
        ultimoContato: 'Há 5 dias'
      },
      {
        id: 'crm_fam_6',
        responsavel: 'Patrícia Andrade',
        telefone: '(14) 99188-3322',
        email: 'paty.andrade@gmail.com',
        crianca: 'Gael Andrade',
        idade: '3 anos',
        escola: 'EMEF Nacilda de Campos',
        origem: 'QR Code Entrada',
        campanha: 'Panfletagem Portão 7h30',
        dataAdesao: '10/06/2025',
        status: 'Ativo',
        statusFinanceiro: 'pago',
        valorMensal: 29.90,
        diaJornada: 5,
        likesRecebidos: 15,
        regadasAmor: 7,
        ultimoContato: 'Hoje às 11:40'
      },
      {
        id: 'crm_fam_7',
        responsavel: 'Camila Rocha',
        telefone: '(14) 99800-7766',
        email: 'camila.rocha@uol.com.br',
        crianca: 'Heitor Rocha',
        idade: '5 anos',
        escola: 'Colégio São José',
        origem: 'WhatsApp Direto',
        campanha: 'Campanha WhatsApp Bauru',
        dataAdesao: '11/06/2025',
        status: 'Ativo',
        statusFinanceiro: 'pago',
        valorMensal: 29.90,
        diaJornada: 3,
        likesRecebidos: 10,
        regadasAmor: 4,
        ultimoContato: 'Hoje às 09:00'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('anjo_crm_familias_bauru', JSON.stringify(crmFamilias));
  }, [crmFamilias]);

  const handleAddCrmFamily = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFamMae || !newFamCrianca || !newFamTelefone) return;

    const newRecord = {
      id: 'crm_fam_' + Date.now(),
      responsavel: newFamMae,
      telefone: newFamTelefone,
      email: newFamEmail || `${newFamMae.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
      crianca: newFamCrianca,
      idade: newFamIdade || '4 anos',
      escola: newFamEscola,
      origem: newFamOrigem,
      campanha: newFamCampanha,
      dataAdesao: new Date().toLocaleDateString('pt-BR'),
      status: 'Ativo',
      statusFinanceiro: 'pago',
      valorMensal: 29.90,
      diaJornada: 1,
      likesRecebidos: 0,
      regadasAmor: 0,
      ultimoContato: 'Agora'
    };

    setCrmFamilias([newRecord, ...crmFamilias]);
    setNewFamMae('');
    setNewFamTelefone('');
    setNewFamEmail('');
    setNewFamCrianca('');
    setCrmNewFamilyModal(false);

    setCrmToast(`✓ Família de ${newFamMae} (${newFamCrianca}) cadastrada com sucesso no CRM Bauru!`);
    setTimeout(() => setCrmToast(null), 4000);
  };

  useEffect(() => {
    if (idoso && !selectedIdosoId) {
      setSelectedIdosoId(idoso.id);
    } else if (seniors.length > 0 && !selectedIdosoId) {
      setSelectedIdosoId(seniors[0].id);
    }
  }, [idoso, seniors]);

  useEffect(() => {
    if (selectedIdosoId) {
      const status = (localStorage.getItem(`anjo_sub_status_${selectedIdosoId}`) as 'pago' | 'atrasado') || 'pago';
      const isCustom = localStorage.getItem(`anjo_sub_is_custom_${selectedIdosoId}`) === 'true';
      const defaultVal = parseFloat(localStorage.getItem('anjo_sub_valor_default') || '29.90');
      const valor = isCustom
        ? parseFloat(localStorage.getItem(`anjo_sub_valor_${selectedIdosoId}`) || '29.90')
        : defaultVal;
      const dia = parseInt(localStorage.getItem(`anjo_sub_dia_${selectedIdosoId}`) || '10');
      const tipo = (localStorage.getItem(`anjo_sub_tipo_${selectedIdosoId}`) as 'individual' | 'coletivo') || 'individual';
      
      const historyKey = `anjo_sub_historico_${selectedIdosoId}`;
      let history = [];
      try {
        const rawHistory = localStorage.getItem(historyKey);
        if (rawHistory) {
          history = JSON.parse(rawHistory);
        } else {
          history = [
            { id: '1', data: '10/05/2026', valor: valor, status: 'pago', comprovante: 'TX-459201' },
            { id: '2', data: '10/04/2026', valor: valor, status: 'pago', comprovante: 'TX-284910' },
            { id: '3', data: '10/03/2026', valor: valor, status: 'pago', comprovante: 'TX-104928' }
          ];
          localStorage.setItem(historyKey, JSON.stringify(history));
        }
      } catch (e) {
        // ignore
      }

      setIsCustomValor(isCustom);
      setSubStatus(status);
      setSubValor(valor);
      setSubDia(dia);
      setSubTipo(tipo);
      setSubHistory(history);
    }
  }, [selectedIdosoId, seniors]);

  const handleToggleSub = () => {
    if (!selectedIdosoId) return;
    const nextStatus = subStatus === 'pago' ? 'atrasado' : 'pago';
    setSubStatus(nextStatus);
    localStorage.setItem(`anjo_sub_status_${selectedIdosoId}`, nextStatus);
    
    // Update matching log in consents instantly
    const senior = seniors.find(s => s.id === selectedIdosoId);
    if (senior) {
      const updatedConsents = consents.map(c => {
        if (c.idosoNome === senior.nome) {
          return { ...c, statusFinanceiro: nextStatus };
        }
        return c;
      });
      localStorage.setItem('anjo_lgpd_consents', JSON.stringify(updatedConsents));
      setConsents(updatedConsents);
    }

    // Dispatch update coordinate event
    window.dispatchEvent(new CustomEvent('anjo_user_updated'));
  };

  const handleSaveSubConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIdosoId) return;
    localStorage.setItem(`anjo_sub_is_custom_${selectedIdosoId}`, isCustomValor ? 'true' : 'false');
    if (isCustomValor) {
      localStorage.setItem(`anjo_sub_valor_${selectedIdosoId}`, subValor.toString());
    } else {
      localStorage.removeItem(`anjo_sub_valor_${selectedIdosoId}`);
    }
    localStorage.setItem(`anjo_sub_dia_${selectedIdosoId}`, subDia.toString());
    localStorage.setItem(`anjo_sub_tipo_${selectedIdosoId}`, subTipo);
    
    setSavingMessage('Plano de mensalidade atualizado com sucesso!');
    setTimeout(() => {
      setSavingMessage('');
    }, 2000);
    window.dispatchEvent(new CustomEvent('anjo_user_updated'));
  };

  const handleSaveGlobalPrice = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('anjo_sub_valor_default', globalSubValor.toString());
    
    // If the currently selected student is using the default price, update their state
    const isCustom = localStorage.getItem(`anjo_sub_is_custom_${selectedIdosoId}`) === 'true';
    if (!isCustom) {
      setSubValor(globalSubValor);
    }
    
    setSavingMessage('Preço padrão geral atualizado para todos os alunos!');
    setTimeout(() => {
      setSavingMessage('');
    }, 2000);
    window.dispatchEvent(new CustomEvent('anjo_user_updated'));
  };

  const handleSimulateAddPayment = () => {
    if (!selectedIdosoId) return;
    const newPayment = {
      id: 'pay_' + Date.now(),
      data: new Date().toLocaleDateString('pt-BR'),
      valor: subValor,
      status: 'pago',
      comprovante: 'TX-' + Math.floor(Math.random() * 900000 + 100000)
    };
    const updated = [newPayment, ...subHistory];
    setSubHistory(updated);
    localStorage.setItem(`anjo_sub_historico_${selectedIdosoId}`, JSON.stringify(updated));
    
    setSavingMessage('Novo pagamento manual lançado com sucesso!');
    setTimeout(() => {
      setSavingMessage('');
    }, 2000);
  };

  const getSubValorForConsent = (record: ConsentRecord) => {
    const senior = seniors.find(s => {
      const cleanS = s.nome.toLowerCase();
      const cleanI = record.idosoNome.toLowerCase();
      return cleanS === cleanI || cleanS.includes(cleanI) || cleanI.includes(cleanS) ||
        (s.id === 'idoso_maria' && (cleanI.includes('maria') || cleanI.includes('mariana'))) ||
        (s.id === 'idoso_joao' && (cleanI.includes('joão') || cleanI.includes('joao') || cleanI.includes('enzo')));
    });
    if (senior) {
      const isCustom = localStorage.getItem(`anjo_sub_is_custom_${senior.id}`) === 'true';
      if (isCustom) {
        return parseFloat(localStorage.getItem(`anjo_sub_valor_${senior.id}`) || '29.90');
      }
    }
    return parseFloat(localStorage.getItem('anjo_sub_valor_default') || '29.90');
  };

  const getJourneyMessage = (day: 1 | 15 | 25 | 30, record: ConsentRecord) => {
    const usuarioNome = record.usuarioNome;
    const idosoNome = record.idosoNome;
    const appName = record.modoApp.toLowerCase().includes('escolar') ? 'Anjinho Escolar' : 'Anjo Cuidador';
    const priceFormatted = getSubValorForConsent(record).toFixed(2).replace('.', ',');
    
    if (day === 1) {
      return `Olá, *${usuarioNome}*! Que bom ter você no aplicativo *${appName}*! 🎁 Aproveite seus 30 dias de teste gratuito para acompanhar a rotina diária em tempo real de *${idosoNome}*.\n\nQualquer dúvida, estamos à inteira disposição!`;
    }
    if (day === 15) {
      return `Olá, *${usuarioNome}*! Já se passaram 15 dias de acompanhamento do(a) *${idosoNome}* no aplicativo *${appName}*. 🌸 Viu como as abas de Medicamentos, Rotina e Relatórios facilitam seu dia e trazem muito mais tranquilidade? Aproveite o restante do seu teste grátis!`;
    }
    if (day === 25) {
      return `Olá, *${usuarioNome}*! Faltam apenas 5 dias para encerrar seu período gratuito no aplicativo *${appName}*. 🔔 Para não perder o acesso em tempo real à rotina do(a) *${idosoNome}*, ative sua assinatura mensal por apenas *R$ ${priceFormatted}/mês*!\n\n🔑 *Chave Pix:* ${billingPixKey}\n👤 *Favorecido:* ${billingPixReceiver}\n\nEnvie o comprovante para liberação instantânea!`;
    }
    // Day 30 - Elegant Cut
    return `⚠️ *AVISO DE PAUSA NO ACESSO - ${appName}* ⚠️\n\nOlá, *${usuarioNome}*! O período de 30 dias grátis de testes de *${idosoNome}* chegou ao fim.\n\nPara restabelecer ou manter o seu acesso de familiar ativo imediatamente, regularize sua assinatura por apenas *R$ ${priceFormatted}*:\n\n🔑 *Chave Pix:* ${billingPixKey}\n👤 *Favorecido:* ${billingPixReceiver}\n\nEstamos à disposição para ajudar!`;
  };

  useEffect(() => {
    if (!billingModalUser) return;
    
    const usuarioNome = billingModalUser.usuarioNome;
    const idosoNome = billingModalUser.idosoNome;
    const appName = billingModalUser.modoApp === 'escolar_infantil' ? 'Anjinho Escolar' : 'Anjo Cuidador';
    const priceFormatted = getSubValorForConsent(billingModalUser).toFixed(2).replace('.', ',');
    
    let template = '';
    if (billingMessageType === 'trial_ending') {
      template = `Olá, *${usuarioNome}*! O período de teste grátis de 30 dias de *${idosoNome}* no aplicativo *${appName}* está chegando ao fim. 🎁\n\nPara continuar acompanhando a rotina diária, medicamentos, sinais vitais e receber relatórios de turno em tempo real, ative sua assinatura mensal por apenas *R$ ${priceFormatted}*!\n\n🔑 *Chave Pix para ativação:* ${billingPixKey}\n👤 *Favorecido:* ${billingPixReceiver}\n\nApós o pagamento, envie o comprovante por aqui para liberarmos seu acesso definitivo. Obrigado pela confiança!`;
    } else if (billingMessageType === 'monthly_billing') {
      template = `Olá, *${usuarioNome}*! Passando para lembrar que a mensalidade do aplicativo *${appName}* para o acompanhamento de *${idosoNome}* está disponível para renovação. 🔔\n\nValor: *R$ ${priceFormatted}*\n🔑 *Chave Pix:* ${billingPixKey}\n👤 *Favorecido:* ${billingPixReceiver}\n\nBasta realizar o Pix e nos enviar o comprovante de pagamento para manter seu acesso ativo sem interrupções! Muito obrigado!`;
    } else {
      template = `⚠️ *AVISO IMPORTANTE - ${appName}* ⚠️\n\nOlá, *${usuarioNome}*! Identificamos que o período de testes ou a mensalidade do perfil de *${idosoNome}* expirou e o painel de acompanhamento foi temporariamente suspenso.\n\nPara restabelecer o acesso imediatamente e continuar recebendo os registros diários:\n\nValor: *R$ ${priceFormatted}*\n🔑 *Chave Pix:* ${billingPixKey}\n👤 *Favorecido:* ${billingPixReceiver}\n\nRealize o Pix e envie o comprovante para liberação instantânea. Estamos à disposição!`;
    }
    
    setBillingCustomText(template);
  }, [billingModalUser, billingPixKey, billingPixReceiver, billingMessageType, seniors]);

  const handlePixKeyChange = (val: string) => {
    setBillingPixKey(val);
    localStorage.setItem('anjo_billing_pix', val);
  };

  const handlePixReceiverChange = (val: string) => {
    setBillingPixReceiver(val);
    localStorage.setItem('anjo_billing_receiver', val);
  };

  const handleSendRealWhatsAppBilling = () => {
    if (!billingModalUser) return;
    const cleanNumber = formatWhatsAppNumber(billingModalUser.usuarioTelefone);
    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(billingCustomText)}`;
    window.open(url, '_blank');
    
    // Trigger simulated visual confirmation sound & popup as well!
    if (triggerWhatsAppSim) {
      triggerWhatsAppSim(
        billingMessageType === 'trial_ending' 
          ? 'Lembrete de Cobrança (Trial)' 
          : billingMessageType === 'monthly_billing' 
            ? 'Mensalidade do Aplicativo' 
            : 'Aviso de Bloqueio',
        `Mensagem comercial enviada para o tutor ${billingModalUser.usuarioNome} (${billingModalUser.usuarioTelefone}).`
      );
    }
    
    // Close modal
    setBillingModalUser(null);
  };

  const handleSendSimulatedWhatsAppBilling = () => {
    if (!billingModalUser) return;
    
    // Trigger simulated visual confirmation sound & popup inside the log!
    if (triggerWhatsAppSim) {
      triggerWhatsAppSim(
        billingMessageType === 'trial_ending' 
          ? '🎁 Fim do Teste Comercial' 
          : billingMessageType === 'monthly_billing' 
            ? '🔔 Cobrança Mensal' 
            : '⚠️ Alerta de Bloqueio',
        billingCustomText
      );
    }
    
    // Close modal
    setBillingModalUser(null);
  };

  const handleSaveBrandName = (name: string) => {
    const currentMode = localStorage.getItem('anjo_app_mode') || 'idoso';
    setInstNameInput(name);
    localStorage.setItem(`anjo_brand_name_${currentMode}`, name);
    window.dispatchEvent(new CustomEvent('anjo_user_updated'));
  };

  const handleSaveBrandLogo = (logoUrl: string) => {
    const currentMode = localStorage.getItem('anjo_app_mode') || 'idoso';
    setInstLogoInput(logoUrl);
    localStorage.setItem(`anjo_brand_logo_${currentMode}`, logoUrl);
    window.dispatchEvent(new CustomEvent('anjo_user_updated'));
  };

  const handleClearBranding = () => {
    const currentMode = localStorage.getItem('anjo_app_mode') || 'idoso';
    setInstNameInput('');
    setInstLogoInput('');
    localStorage.removeItem(`anjo_brand_name_${currentMode}`);
    localStorage.removeItem(`anjo_brand_logo_${currentMode}`);
    window.dispatchEvent(new CustomEvent('anjo_user_updated'));
  };

  // Load and sync consents & lists
  const loadData = () => {
    const allConsents = JSON.parse(localStorage.getItem('anjo_lgpd_consents') || '[]');
    const allSeniors = getFromDB<Idoso[]>('anjo_idosos', []);
    const allUsers = getFromDB<Usuario[]>('anjo_usuarios', []);
    
    // Seed dry-run logs so the table isn't blank on first boot!
    if (allConsents.length === 0) {
      const isEscolarCurrent = (localStorage.getItem('anjo_app_mode') || 'escolar_infantil').startsWith('escolar');
      const mockConsents: ConsentRecord[] = isEscolarCurrent ? [
        {
          id: 'mock_1',
          usuarioNome: 'Clarice Souza (Mãe)',
          usuarioEmail: 'clarice.souza@gmail.com',
          usuarioTelefone: '(11) 98765-4321',
          usuarioTipo: 'familiar',
          idosoNome: 'Mariana Souza',
          dataConsentimento: new Date(Date.now() - 3600000 * 24).toLocaleString('pt-BR'),
          modoApp: '🧸 Anjinho Escolar',
          deviceFingerprint: 'IP 189.14.88.221 (SSL • Android 14)',
          statusFinanceiro: 'pago'
        },
        {
          id: 'mock_2',
          usuarioNome: 'Ana Silva (Educadora)',
          usuarioEmail: 'ana.silva@escola.com',
          usuarioTelefone: '(11) 91234-5678',
          usuarioTipo: 'cuidador',
          idosoNome: 'Berçário I - A',
          dataConsentimento: new Date(Date.now() - 3600000 * 48).toLocaleString('pt-BR'),
          modoApp: '🧸 Anjinho Escolar',
          deviceFingerprint: 'IP 177.33.102.13 (SSL • iOS 17)',
          statusFinanceiro: 'pago'
        },
        {
          id: 'mock_3',
          usuarioNome: 'Juliana Santos (Mãe)',
          usuarioEmail: 'juliana.santos@gmail.com',
          usuarioTelefone: '(11) 98844-3322',
          usuarioTipo: 'familiar',
          idosoNome: 'Alice Santos',
          dataConsentimento: new Date(Date.now() - 3600000 * 12).toLocaleString('pt-BR'),
          modoApp: '🧸 Anjinho Escolar',
          deviceFingerprint: 'IP 200.180.2.49 (SSL • Windows 11)',
          statusFinanceiro: 'pago'
        }
      ] : [
        {
          id: 'mock_1',
          usuarioNome: 'Clarice Souza (Filha)',
          usuarioEmail: 'clarice.souza@gmail.com',
          usuarioTelefone: '(11) 98765-4321',
          usuarioTipo: 'admin',
          idosoNome: 'Dona Maria de Souza',
          dataConsentimento: new Date(Date.now() - 3600000 * 24).toLocaleString('pt-BR'),
          modoApp: '👵 Anjo Cuidador',
          deviceFingerprint: 'IP 189.14.88.221 (SSL • Android 14)',
          statusFinanceiro: 'pago'
        },
        {
          id: 'mock_2',
          usuarioNome: 'Ana Silva (Cuidadora)',
          usuarioEmail: 'ana.silva@cuidadora.com',
          usuarioTelefone: '(11) 91234-5678',
          usuarioTipo: 'cuidador',
          idosoNome: 'Dona Maria de Souza',
          dataConsentimento: new Date(Date.now() - 3600000 * 48).toLocaleString('pt-BR'),
          modoApp: '👵 Anjo Cuidador',
          deviceFingerprint: 'IP 177.33.102.13 (SSL • iOS 17)',
          statusFinanceiro: 'pago'
        },
        {
          id: 'mock_3',
          usuarioNome: 'Carlos Souza (Familiar)',
          usuarioEmail: 'carlos.souza@outlook.com',
          usuarioTelefone: '(11) 95555-4444',
          usuarioTipo: 'familiar',
          idosoNome: 'Seu João Alencar',
          dataConsentimento: new Date(Date.now() - 3600000 * 12).toLocaleString('pt-BR'),
          modoApp: '👵 Anjo Cuidador',
          deviceFingerprint: 'IP 200.180.2.49 (SSL • Windows 11)',
          statusFinanceiro: 'atrasado'
        }
      ];
      localStorage.setItem('anjo_lgpd_consents', JSON.stringify(mockConsents));
      setConsents(mockConsents);
    } else {
      setConsents(allConsents);
    }

    setSeniors(allSeniors);
    setUsers(allUsers);
    
    // Fetch recent health/sleep/diaper signals
    const allSinais = getFromDB<any[]>('anjo_sinais', []);
    setSinaisList(allSinais);
  };

  useEffect(() => {
    loadData();
    
    const currentMode = localStorage.getItem('anjo_app_mode') || 'idoso';
    setInstNameInput(localStorage.getItem(`anjo_brand_name_${currentMode}`) || '');
    setInstLogoInput(localStorage.getItem(`anjo_brand_logo_${currentMode}`) || '');
    
    // Listen for global profile additions
    window.addEventListener('anjo_user_updated', loadData);
    return () => window.removeEventListener('anjo_user_updated', loadData);
  }, []);

  useEffect(() => {
    if (consents.length > 0 && !selectedJourneyUser) {
      // Find a familiar or any user
      const target = consents.find(c => c.usuarioTipo === 'familiar') || consents[0];
      setSelectedJourneyUser(target);
    }
  }, [consents, selectedJourneyUser]);

  // Update subscription status for a grandmother or child profile
  const handleToggleSeniorSubscription = (seniorId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'pago' ? 'atrasado' : 'pago';
    localStorage.setItem(`anjo_sub_status_${seniorId}`, newStatus);
    
    // Also update any matching logs instantly to keep visual consistency
    const senior = seniors.find(s => s.id === seniorId);
    if (senior) {
      const updatedConsents = consents.map(c => {
        if (c.idosoNome === senior.nome) {
          return { ...c, statusFinanceiro: newStatus };
        }
        return c;
      });
      localStorage.setItem('anjo_lgpd_consents', JSON.stringify(updatedConsents));
      setConsents(updatedConsents);
    }

    // Force reloading global status and audio chime
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(newStatus === 'pago' ? 700 : 350, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch(e){}

    // Dispatch update to sync App.tsx state completely!
    window.dispatchEvent(new Event('anjo_user_updated'));
    loadData();
  };

  // 📥 EXPORT SPREADSHEET (CSV ENGINE)
  const handleExportToCSV = () => {
    if (consents.length === 0) {
      alert("Nenhum dado para exportar!");
      return;
    }

    // Define CSV Columns compatible with Excel/Google Sheets in UTF-8
    const headers = [
      "ID Registro",
      "Nome do Gestor/Cuidador",
      "E-mail",
      "Telefone WhatsApp",
      "Função",
      "Idoso Assistido",
      "Data e Hora do Consentimento",
      "Ambiente de Uso",
      "ID Digital (Dispositivo/IP)",
      "Adimplência Financeira"
    ];

    const rows = consents.map(c => {
      // Lookup real status of senior in DB
      const matchedSenior = seniors.find(s => s.nome === c.idosoNome);
      const paymentStatus = matchedSenior 
        ? (localStorage.getItem(`anjo_sub_status_${matchedSenior.id}`) || 'pago')
        : c.statusFinanceiro;

      return [
        c.id,
        c.usuarioNome.replace(/,/g, ';'), // avoid CSV breaks
        c.usuarioEmail,
        c.usuarioTelefone,
        c.usuarioTipo,
        c.idosoNome.replace(/,/g, ';'),
        c.dataConsentimento,
        c.modoApp,
        c.deviceFingerprint.replace(/,/g, ';'),
        paymentStatus === 'pago' ? "ADIMPLENTE" : "INADIMPLENTE (BLOQUEADO)"
      ];
    });

    // Merge header & logs with semicolon or comma separator
    const csvContent = "\uFEFF" + [
      headers.join(';'),
      ...rows.map(e => e.join(';'))
    ].join('\n');

    // Create browser binary download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Anjo_Cuidador_LGPD_Adimplencias_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filters calculation
  const filteredConsents = consents.filter(c => {
    const isModeMatch = 
      filterMode === 'todos' || 
      (filterMode === 'idoso' && c.modoApp.includes('Cuidador')) ||
      (filterMode === 'escolar' && c.modoApp.includes('Escolar'));
      
    const norm = (s: string) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const termNorm = norm(searchTerm.trim());
    const isSearchMatch = !termNorm ||
      norm(c.usuarioNome).includes(termNorm) ||
      norm(c.idosoNome).includes(termNorm) ||
      norm(c.usuarioTipo).includes(termNorm) ||
      norm(c.usuarioEmail).includes(termNorm) ||
      (c.usuarioTelefone && c.usuarioTelefone.replace(/\D/g, '').includes(termNorm.replace(/\D/g, ''))) ||
      norm(c.usuarioTelefone).includes(termNorm) ||
      ((termNorm.includes('mae') || termNorm.includes('maes') || termNorm.includes('pai') || termNorm.includes('pais') || termNorm.includes('resp') || termNorm.includes('admin') || termNorm.includes('fam')) &&
       (norm(c.usuarioTipo).includes('admin') || norm(c.usuarioTipo).includes('fam') || norm(c.usuarioNome).includes('mae') || norm(c.usuarioNome).includes('resp')));

    return isModeMatch && isSearchMatch;
  });

  const billingStats = seniors.reduce((acc, current) => {
    const status = localStorage.getItem(`anjo_sub_status_${current.id}`) || 'pago';
    if (status === 'pago') acc.adimplentes++;
    else acc.inadimplentes++;
    return acc;
  }, { adimplentes: 0, inadimplentes: 0 });

  const totalMonthlyBilling = seniors.reduce((acc, current) => {
    const status = localStorage.getItem(`anjo_sub_status_${current.id}`) || 'pago';
    if (status === 'pago') {
      const isCustom = localStorage.getItem(`anjo_sub_is_custom_${current.id}`) === 'true';
      const valor = isCustom
        ? parseFloat(localStorage.getItem(`anjo_sub_valor_${current.id}`) || '29.90')
        : parseFloat(localStorage.getItem('anjo_sub_valor_default') || '29.90');
      return acc + valor;
    }
    return acc;
  }, 0);

  // Compute global engagement metrics
  const allEventsInDb = getFromDB<any[]>('anjo_jornada_events', []);
  const globalLikes = allEventsInDb.reduce((acc, curr) => acc + (curr.likes || 0), 0);
  const globalWaterings = seniors.reduce((acc, current) => {
    return acc + parseInt(localStorage.getItem(`anjo_regar_count_${current.id}`) || '0', 10);
  }, 0);

  const isDark = accessibilitySettings.darkMode;

  return (
    <div className={`space-y-6 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
      
      {/* Upper banner section */}
      <div className={`p-6 bg-gradient-to-br ${
        isDark ? 'from-indigo-950 to-slate-900 border-indigo-900' : 'from-indigo-600 to-indigo-800 text-white'
      } rounded-3xl border shadow-lg relative overflow-hidden`} id="admin-banner-panel">
        <div className="absolute right-0 bottom-0 opacity-15 select-none pointer-events-none transform translate-x-12 translate-y-12">
          <ShieldCheck className="w-64 h-64" />
        </div>

        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-amber-300">
            🔒 Painel do Desenvolvedor (Exclusivo & Privado)
          </div>
          <h2 className="text-2xl md:text-3xl font-black font-display tracking-tight">
            Console do Dono (Financeiro & CRM Anjinho Escolar)
          </h2>
          <p className="text-sm text-indigo-100 font-medium leading-relaxed">
            Consulte métricas comerciais, acompanhe adesões de famílias ao projeto Anjinho Escolar em Bauru, envie notificações via WhatsApp e controle faturamentos Pix. Este painel é mantido em segredo e não é visível para a direção escolar.
          </p>
        </div>
      </div>

      {/* 🧭 DEV MAIN MODE SWITCHER: FATURAMENTO vs CRM ANJINHO ESCOLAR BAURU */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-100 dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setAdminActiveTab('faturamento')}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
              adminActiveTab === 'faturamento'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>💳 Faturamento, Pix & LGPD</span>
          </button>

          <button
            type="button"
            onClick={() => setAdminActiveTab('crm_escolar')}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 relative ${
              adminActiveTab === 'crm_escolar'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-teal-600/20'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>🏫 CRM Anjinho Escolar Bauru (Famílias)</span>
            <span className="px-1.5 py-0.5 bg-amber-400 text-slate-900 text-[9px] font-black rounded-full uppercase tracking-tight">
              {crmFamilias.length}
            </span>
          </button>
        </div>

        {adminActiveTab === 'crm_escolar' && (
          <button
            type="button"
            onClick={() => setCrmNewFamilyModal(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nova Família Aderida</span>
          </button>
        )}
      </div>

      {crmToast && (
        <div className="p-3 bg-emerald-500 text-white rounded-xl text-xs font-bold text-center shadow-lg animate-pulse">
          {crmToast}
        </div>
      )}

      {/* ------------------- TAB 1: FATURAMENTO & ASSINATURAS GENERAL ------------------- */}
      {adminActiveTab === 'faturamento' && (
        <div className="space-y-6">

      {/* KPI Stats Cards row */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4" id="admin-kpi-row">
        
        <div className={`p-5 rounded-2xl border ${
          isDark ? 'bg-slate-850 border-slate-750' : 'bg-white border-slate-200'
        } shadow-2xs space-y-2`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total de Perfis</span>
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><Users className="w-4 h-4" /></span>
          </div>
          <div className="text-2xl font-black">{seniors.length}</div>
          <p className="text-[10px] text-slate-400 font-bold leading-none">Idosos & Alunos Monitorados</p>
        </div>

        <div className={`p-5 rounded-2xl border ${
          isDark ? 'bg-slate-850 border-slate-750' : 'bg-white border-slate-200'
        } shadow-2xs space-y-2`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500">Adimplentes</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle className="w-4 h-4" /></span>
          </div>
          <div className="text-2xl font-black text-emerald-600">{billingStats.adimplentes}</div>
          <p className="text-[10px] text-slate-400 font-bold leading-none">Acesso do aplicativo liberado</p>
        </div>

        <div className={`p-5 rounded-2xl border ${
          isDark ? 'bg-slate-850 border-slate-750' : 'bg-white border-slate-200'
        } shadow-2xs space-y-2`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-500">Inadimplentes</span>
            <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg"><AlertTriangle className="w-4 h-4" /></span>
          </div>
          <div className="text-2xl font-black text-rose-600">{billingStats.inadimplentes}</div>
          <p className="text-[10px] text-slate-400 font-bold leading-none">Interrompidos temporariamente</p>
        </div>

        <div className={`p-5 rounded-2xl border ${
          isDark ? 'bg-slate-850 border-slate-750' : 'bg-white border-slate-200'
        } shadow-2xs space-y-2`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-500">Arrecadação Mensal</span>
            <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg"><TrendingUp className="w-4 h-4" /></span>
          </div>
          <div className="text-2xl font-black text-amber-600">R$ {totalMonthlyBilling.toFixed(2)}</div>
          <p className="text-[10px] text-slate-400 font-bold leading-none">Faturamento ativo projetado / mês</p>
        </div>

        <div className={`p-5 rounded-2xl border ${
          isDark ? 'bg-slate-850 border-slate-750' : 'bg-white border-slate-200'
        } shadow-2xs space-y-2`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500">Engajamento de Afeto</span>
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">❤️</span>
          </div>
          <div className="text-2xl font-black text-rose-600 flex items-baseline gap-1.5">
            {globalLikes} <span className="text-xs text-slate-400 font-bold">gestos de afeto</span>
          </div>
          <p className="text-[10px] text-slate-400 font-bold leading-none flex items-center gap-1.5">
            <span>💧</span> <strong>{globalWaterings}</strong> regadas de amor ativas
          </p>
        </div>

      </div>

      {/* 💳 PANEL: SUBSCRIPTION MANAGEMENT & FAMILIAR ACCESS CONTROL */}
      <div className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-3xl border p-6 space-y-6 shadow-md`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-850 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-500" />
              Gestão de Mensalidades & Controle de Acesso
            </h3>
            <p className="text-xs text-slate-500 font-semibold">
              Regule os pagamentos recorrentes e demonstre o bloqueio temporário de segurança para os familiares.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Senior selector dropdown */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500 shrink-0">Selecionar Aluno/Assistido:</label>
              <select
                value={selectedIdosoId}
                onChange={e => setSelectedIdosoId(e.target.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                  isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
                } focus:outline-none focus:ring-2 focus:ring-indigo-500/25`}
              >
                {seniors.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-800 font-black border border-amber-200 text-xs rounded-full shadow-3xs">
              <Coins className="w-3.5 h-3.5" />
              Preço Base: R$ {subValor.toFixed(2)}/mês
            </div>
          </div>
        </div>

        {/* ⚙️ CONFIGURAÇÃO DO PREÇO PADRÃO GERAL */}
        <div className={`p-4 rounded-2xl border ${
          isDark ? 'bg-indigo-950/20 border-indigo-900/40 text-indigo-100' : 'bg-indigo-50 border-indigo-100'
        } space-y-3`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300 block flex items-center gap-1">
                ⚙️ Configuração do Preço Base Geral (Para Todos)
              </span>
              <p className="text-xs text-slate-500 font-semibold max-w-xl">
                Altere o valor padrão cobrado de todos os alunos cadastrados. Os alunos com descontos especiais (como desconto coletivo para irmãos) são mantidos como exceções e não serão alterados!
              </p>
            </div>
            
            <form onSubmit={handleSaveGlobalPrice} className="flex items-center gap-2 self-start md:self-auto">
              <div className="relative rounded-xl shadow-xs max-w-[140px]">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-black text-slate-400">R$</span>
                <input 
                  type="number"
                  step="0.01"
                  min="5.00"
                  value={globalSubValor}
                  onChange={e => setGlobalSubValor(parseFloat(e.target.value) || 0)}
                  className={`w-full pl-8 pr-3 py-2 border rounded-xl text-xs font-bold ${
                    isDark ? 'bg-slate-900 border-slate-750 text-slate-100' : 'bg-white border-slate-270 text-slate-800'
                  }`}
                />
              </div>
              <button
                type="submit"
                className="py-2 px-3.5 bg-indigo-600 hover:bg-indigo-700 font-extrabold text-xs text-white rounded-xl cursor-pointer shadow-xs transition-colors whitespace-nowrap"
              >
                Atualizar Geral
              </button>
            </form>
          </div>
        </div>

        {/* ⚙️ CONFIGURAÇÃO DA CHAVE PIX DO DESENVOLVEDOR (RECEBER PAGAMENTOS) */}
        <div className={`p-4 rounded-2xl border ${
          isDark ? 'bg-slate-800/40 border-slate-755 text-indigo-100' : 'bg-emerald-50/50 border-emerald-150'
        } space-y-3`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block flex items-center gap-1.5">
                🔑 Configuração das Chaves de Recebimento PIX (Desenvolvedor)
              </span>
              <p className="text-xs text-slate-500 font-semibold max-w-xl">
                Defina os dados da sua chave Pix e o nome do favorecido. Essas informações serão usadas para gerar o <strong>Pix Copia e Cola</strong> automático dos familiares e nas mensagens do WhatsApp!
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="space-y-1 min-w-[190px] flex-1 lg:flex-initial">
                <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Chave Pix (E-mail, CNPJ, Telefone)</label>
                <input 
                  type="text"
                  value={billingPixKey}
                  onChange={e => handlePixKeyChange(e.target.value)}
                  placeholder="ex: djalmaamaral36@gmail.com"
                  className={`w-full px-3 py-1.5 border rounded-xl text-xs font-bold ${
                    isDark ? 'bg-slate-900 border-slate-750 text-slate-100' : 'bg-white border-slate-250 text-slate-850'
                  } focus:outline-none focus:ring-2 focus:ring-emerald-500/20`}
                />
              </div>
              <div className="space-y-1 min-w-[190px] flex-1 lg:flex-initial">
                <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Nome do Favorecido</label>
                <input 
                  type="text"
                  value={billingPixReceiver}
                  onChange={e => handlePixReceiverChange(e.target.value)}
                  placeholder="ex: Djalma Amaral"
                  className={`w-full px-3 py-1.5 border rounded-xl text-xs font-bold ${
                    isDark ? 'bg-slate-900 border-slate-750 text-slate-100' : 'bg-white border-slate-250 text-slate-850'
                  } focus:outline-none focus:ring-2 focus:ring-emerald-500/20`}
                />
              </div>
            </div>
          </div>
        </div>

        {selectedIdosoId ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* COLUMN 1: LIVE SIMULATOR SWITCH */}
            <div className={`${isDark ? 'bg-slate-850 border-slate-750' : 'bg-slate-50/75 border-slate-200'} border rounded-2xl p-4 space-y-4`}>
              <span className="text-xs font-bold text-slate-600 block uppercase tracking-wider">
                🔄 Simulador de Inadimplência
              </span>
              
              <div className="space-y-3">
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  Mude o status abaixo para testar como o sistema reage de forma integrada para os familiares cadastrados:
                </p>

                <div className={`p-3 rounded-xl border flex flex-col items-center text-center space-y-2 ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <span className="text-[10px] uppercase font-black text-slate-400">
                    Status Atual de {seniors.find(s => s.id === selectedIdosoId)?.nome.split(' ')[0]}
                  </span>
                  
                  {subStatus === 'pago' ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full border border-emerald-250 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Em Dia (Acesso Liberado)
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-800 font-bold text-xs rounded-full border border-rose-250 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      Atrasado (Paywall Ativo)
                    </div>
                  )}

                  <p className="text-[10px] text-slate-400 font-medium leading-normal pt-1.5">
                    {subStatus === 'pago' 
                      ? "Os familiares podem visualizar relatórios. Troque para ver o bloqueio."
                      : "Familiares estão restritos à tela de cobrança PIX. Cuidadores continuam liberados!"
                    }
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleToggleSub}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1 text-white ${
                    subStatus === 'pago' 
                      ? 'bg-rose-500 hover:bg-rose-600 shadow-sm shadow-rose-200' 
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-200'
                  }`}
                >
                  {subStatus === 'pago' ? (
                    <>⚠️ Simular Parcela Vencida (Bloquear)</>
                  ) : (
                    <>✓ Normalizar Pagamento (Simular Pago)</>
                  )}
                </button>
              </div>
            </div>

            {/* COLUMN 2: SUB CONFIG FORM */}
            <div className={`border rounded-2xl p-4 space-y-4 ${
              isDark ? 'bg-slate-850 border-slate-750' : 'bg-white border-slate-200'
            }`}>
              <span className="text-xs font-bold text-slate-600 block uppercase tracking-wider">
                ⚙️ Ajuste de Assinatura
              </span>

              <form onSubmit={handleSaveSubConfig} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Regra de Faturamento</label>
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomValor(false);
                        setSubValor(globalSubValor);
                      }}
                      className={`w-full p-2 border rounded-xl text-left text-xs transition-all flex items-start gap-2 cursor-pointer ${
                        !isCustomValor
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-950 font-bold'
                          : isDark ? 'bg-slate-900 border-slate-750 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <span className="mt-0.5 text-xs">🌐</span>
                      <div>
                        <span className="block font-bold">Usar Preço Base Geral (R$ {globalSubValor.toFixed(2).replace('.', ',')})</span>
                        <span className="text-[10px] text-slate-400 font-medium leading-normal block mt-0.5">Herdará reajustes futuros que você fizer para toda a escola automaticamente.</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomValor(true);
                      }}
                      className={`w-full p-2 border rounded-xl text-left text-xs transition-all flex items-start gap-2 cursor-pointer ${
                        isCustomValor
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-950 font-bold'
                          : isDark ? 'bg-slate-900 border-slate-750 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <span className="mt-0.5 text-xs">👤</span>
                      <div>
                        <span className="block font-bold">Usar Valor Personalizado (Exceção/Desconto)</span>
                        <span className="text-[10px] text-slate-400 font-medium leading-normal block mt-0.5">Definir tarifa própria para esse aluno (ex: desconto para irmãos, bolsas ou acordos).</span>
                      </div>
                    </button>
                  </div>
                </div>

                {isCustomValor ? (
                  <>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 block">Tipo de Assinatura</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSubTipo('individual');
                            if (subValor === 19.90) setSubValor(globalSubValor);
                          }}
                          className={`py-2 px-2 border rounded-xl text-[10px] sm:text-xs font-bold text-center cursor-pointer transition-all ${
                            subTipo === 'individual'
                              ? 'bg-indigo-600 border-indigo-650 text-white shadow-xs'
                              : isDark ? 'bg-slate-900 border-slate-750 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
                          }`}
                        >
                          👤 Individual (Integral)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSubTipo('coletivo');
                            if (subValor === globalSubValor || subValor === 29.90) setSubValor(19.90);
                          }}
                          className={`py-2 px-2 border rounded-xl text-[10px] sm:text-xs font-bold text-center cursor-pointer transition-all ${
                            subTipo === 'coletivo'
                              ? 'bg-indigo-600 border-indigo-650 text-white shadow-xs'
                              : isDark ? 'bg-slate-900 border-slate-750 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
                          }`}
                        >
                          👥 Coletivo (Desconto Irmãos)
                        </button>
                      </div>
                      {subTipo === 'coletivo' && (
                        <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-[10px] text-indigo-850 font-bold leading-normal">
                          💡 <strong>Dica de Desconto:</strong> Como este pai possui dois ou mais filhos na escola, aplique uma tarifa reduzida (ex: R$ 19,90) para o segundo aluno para incentivar a fidelidade!
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 block">Preço Mensal Personalizado (R$)</label>
                      <div className="relative rounded-xl shadow-xs">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-black text-slate-400">R$</span>
                        <input 
                          type="number"
                          step="0.01"
                          min="5.00"
                          value={subValor}
                          onChange={e => setSubValor(parseFloat(e.target.value) || 0)}
                          className={`w-full pl-8 pr-3 py-2 border rounded-xl text-xs font-bold ${
                            isDark ? 'bg-slate-900 border-slate-750 text-slate-100 border-slate-700' : 'bg-white border-slate-275 text-slate-800'
                          }`}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl text-[11px] text-slate-500 font-semibold leading-relaxed">
                     🌐 Este aluno herdará o preço base geral de <strong>R$ {globalSubValor.toFixed(2).replace('.', ',')} / mês</strong> automaticamente. Se quiser aplicar um desconto específico para irmãos ou estipular outra exceção, selecione <strong>"Valor Personalizado"</strong> acima.
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Dia do Vencimento</label>
                  <select 
                    value={subDia}
                    onChange={e => setSubDia(parseInt(e.target.value))}
                    className={`w-full px-2.5 py-2 border rounded-xl text-xs font-semibold ${
                      isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-275 text-slate-800'
                    }`}
                  >
                    {[5, 10, 15, 20, 25, 28].map(day => (
                      <option key={day} value={day}>Dia {day} de cada mês</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-slate-800 hover:bg-slate-900 font-bold text-xs text-white rounded-xl cursor-pointer shadow-xs transition-colors"
                >
                  Salvar Regras de Assinatura
                </button>
              </form>
            </div>

            {/* COLUMN 3: REAL WORLD EXPLANATION & ARCHITECTURE */}
            <div className={`border rounded-2xl p-4 space-y-3 ${
              isDark ? 'bg-indigo-950/20 border-indigo-900/40 text-indigo-200' : 'bg-indigo-50/50 border-indigo-150 text-indigo-950'
            }`}>
              <span className="text-xs font-bold text-indigo-600 block uppercase tracking-wider flex items-center gap-1">
                <HelpCircle className="w-4 h-4" />
                Como Automatizar em Produção?
              </span>
              <p className="text-[11px] leading-relaxed font-medium">
                Para automatizar esta cobrança ao lançar o aplicativo de verdade comercialmente:
              </p>
              <div className="text-[10px] space-y-2 text-slate-500 leading-relaxed max-h-36 overflow-y-auto pr-1">
                <div className={`p-1.5 border rounded-lg ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-indigo-100'}`}>
                  <strong className="text-indigo-600 block">1. Assinatura via Gateway:</strong>
                  Use APIs focadas como <span className="font-mono font-bold bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-700">Asaas</span>, <span className="font-mono font-bold bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-700">Mercado Pago</span> ou <span className="font-mono font-bold bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-700">Stripe</span>.
                </div>
                <div className={`p-1.5 border rounded-lg ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-indigo-100'}`}>
                  <strong className="text-indigo-600 block">2. Escuta de Webhooks:</strong>
                  Configure sua API para escutar o evento <span className="font-mono text-pink-600 font-semibold bg-pink-50 px-0.5 rounded">PAYMENT_OVERDUE</span>.
                </div>
                <div className={`p-1.5 border rounded-lg ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-indigo-100'}`}>
                  <strong className="text-indigo-600 block">3. Atualização de Acesso:</strong>
                  Ao receber o webhook, defina a flag <span className="font-mono text-slate-850 bg-slate-100 dark:bg-slate-800 px-0.5 rounded">statusValido = false</span> no banco. O app travará o familiar.
                </div>
              </div>
            </div>

          </div>
        ) : (
          <p className="text-xs text-slate-400 font-bold italic">Carregando informações do aluno/assistido selecionado...</p>
        )}

        {savingMessage && (
          <div className="p-3 bg-emerald-500 text-white rounded-xl text-xs font-bold text-center animate-pulse">
            ✓ {savingMessage}
          </div>
        )}

        {/* SIMULATED BILLING HISTORY LIST */}
        <div className={`border rounded-2xl p-4 space-y-3 ${
          isDark ? 'bg-slate-850 border-slate-750' : 'bg-white border-slate-150'
        }`}>
          <div className="flex justify-between items-center pb-1">
            <span className="text-xs font-bold text-slate-550 uppercase tracking-wider block">
              📋 Histórico Recente de Compensações
            </span>
            <button
              type="button"
              onClick={handleSimulateAddPayment}
              className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 cursor-pointer transition-colors"
            >
              <Plus className="w-3 h-3" /> Simular Baixa Manual (Recebimento)
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[500px]">
              <thead>
                <tr className="text-slate-450 font-bold border-b text-[10px] uppercase">
                  <th className="pb-2">Data Processada</th>
                  <th className="pb-2">Identificação</th>
                  <th className="pb-2">Método</th>
                  <th className="pb-2">Valor</th>
                  <th className="pb-2 text-right">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                {subHistory.map((h, i) => (
                  <tr key={h.id || h.comprovante || i} className="hover:bg-slate-500/5">
                    <td className="py-2.5 text-slate-500 font-mono text-[11px]">{h.data}</td>
                    <td className="py-2.5 text-xs font-semibold flex items-center gap-1">
                      <span>💳</span> Mensalidade de {seniors.find(s => s.id === selectedIdosoId)?.nome.split(' ')[0]} 
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-400 font-mono font-normal">
                        {h.comprovante}
                      </span>
                    </td>
                    <td className="py-2.5 text-[11px]">PIX Instantâneo</td>
                    <td className="py-2.5 font-bold">R$ {parseFloat(h.valor || '29.90').toFixed(2)}</td>
                    <td className="py-2.5 text-right">
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        ✓ Pago
                      </span>
                    </td>
                  </tr>
                ))}
                {subHistory.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400 italic font-normal">
                      Nenhum registro de faturamento cadastrado. Use o botão acima para simular o primeiro!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Main filter & database table card block */}
      <div className={`p-6 rounded-3xl border ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      } shadow-md space-y-5`} id="admin-table-container">
        
        {/* Table header menu */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-slate-800">Assinaturas e Trace de LGPD</h3>
            <p className="text-xs text-slate-500 leading-none">Use o filtro abaixo para pesquisar assinantes ou exportar dados.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={loadData}
              className={`p-2 rounded-xl border transition-all hover:bg-slate-100 ${
                isDark ? 'border-slate-700 hover:bg-slate-850' : 'border-slate-200 bg-white'
              } cursor-pointer`}
              title="Sincronizar base local"
            >
              <RefreshCw className="w-4 h-4 text-slate-500" />
            </button>

            {/* Pivot selectors */}
            <div className="inline-flex bg-slate-100 p-1 rounded-xl gap-1 shrink-0">
              <button
                onClick={() => setFilterMode('todos')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterMode === 'todos' ? 'bg-white text-slate-800 shadow-3xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterMode('idoso')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterMode === 'idoso' ? 'bg-white text-slate-800 shadow-3xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Idosos
              </button>
              <button
                onClick={() => setFilterMode('escolar')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterMode === 'escolar' ? 'bg-white text-slate-800 shadow-3xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Escolares
              </button>
            </div>

            {/* 📥 EXPORT COMMAND TRIGGER */}
            <button
              onClick={handleExportToCSV}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-transform active:scale-95"
              title="Download instantâneo da planilha em .csv"
            >
              <Download className="w-4 h-4 text-emerald-100" />
              Exportar p/ Planilha (CSV)
            </button>
          </div>
        </div>

        {/* Search bar row */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por nome do tutor, paciente, telefone ou email registrado..."
            className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-2xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/10 focus:outline-none focus:bg-white transition-all ${
              isDark ? 'border-slate-850 text-white' : 'border-slate-205'
            }`}
          />
        </div>

        {/* Database Grid / Table */}
        <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-3xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-4 font-black uppercase text-[10px] text-slate-400">Usuário do App</th>
                <th className="p-4 font-black uppercase text-[10px] text-slate-400">Associação / Paciente</th>
                <th className="p-4 font-black uppercase text-[10px] text-slate-400">Data e Assinatura Digital</th>
                <th className="p-4 font-black uppercase text-[10px] text-slate-400">Canal / Modo</th>
                <th className="p-4 font-black uppercase text-[10px] text-slate-400 text-center">Engajamento (Família)</th>
                <th className="p-4 font-black uppercase text-[10px] text-slate-400 text-center">Faturamento</th>
                <th className="p-4 font-black uppercase text-[10px] text-slate-400 text-right">Ação Rápida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredConsents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Nenhum registro de consentimento ou usuário localizado para esta busca.
                  </td>
                </tr>
              ) : (
                filteredConsents.map((item) => {
                  // Resolve real-time live status based on DB settings or local key
                  const matchedS = seniors.find(s => {
                    const cleanS = s.nome.toLowerCase();
                    const cleanI = item.idosoNome.toLowerCase();
                    if (cleanS === cleanI) return true;
                    if (cleanS.includes(cleanI) || cleanI.includes(cleanS)) return true;
                    // Handle adapted children/senior pairs
                    if (s.id === 'idoso_maria' && (cleanI.includes('maria') || cleanI.includes('mariana'))) return true;
                    if (s.id === 'idoso_joao' && (cleanI.includes('joão') || cleanI.includes('joao') || cleanI.includes('enzo'))) return true;
                    return false;
                  });
                  const seniorIdMatch = matchedS ? matchedS.id : '';
                  const liveStatus = seniorIdMatch 
                    ? (localStorage.getItem(`anjo_sub_status_${seniorIdMatch}`) || 'pago')
                    : (localStorage.getItem(`anjo_sub_status_${item.id}`) || item.statusFinanceiro || 'pago');

                  // Compute real engagement stats
                  const childEvents = seniorIdMatch 
                    ? getFromDB<any[]>('anjo_jornada_events', []).filter(e => e.idosoId === seniorIdMatch)
                    : [];
                  const totalLikes = childEvents.reduce((acc, curr) => acc + (curr.likes || 0), 0);
                  const totalRegadas = seniorIdMatch 
                    ? parseInt(localStorage.getItem(`anjo_regar_count_${seniorIdMatch}`) || '0', 10)
                    : 0;

                  return (
                    <tr 
                      key={item.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        liveStatus === 'atrasado' ? 'bg-rose-50/15' : ''
                      }`}
                    >
                      <td className="p-4 space-y-1">
                        <strong className="block font-bold text-slate-800">{item.usuarioNome}</strong>
                        <div className="text-[10px] text-slate-400 font-bold">{item.usuarioEmail} • {item.usuarioTelefone}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 font-bold text-slate-805">
                          <span>👤</span>
                          {item.idosoNome}
                        </div>
                      </td>
                      <td className="p-4 space-y-1">
                        <span className="text-slate-600 block">{item.dataConsentimento}</span>
                        <code className="text-[9px] text-emerald-600 font-mono select-all bg-emerald-50 px-1 py-0.5 rounded-sm">{item.deviceFingerprint}</code>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-indigo-50 text-indigo-700">
                          {item.modoApp}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center justify-center gap-3.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                          <div className="flex items-center gap-1 text-xs text-rose-600 font-black" title="Gestos de Afeto Enviados">
                            <span>❤️</span>
                            <span>{totalLikes}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-blue-600 font-black" title="Regar com Amor (Regadas)">
                            <span>💧</span>
                            <span>{totalRegadas}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            liveStatus === 'pago' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-rose-100 text-rose-800 animate-pulse border border-rose-300'
                          }`}>
                            {liveStatus === 'pago' ? 'ADIMPLENTE' : 'INADIMPLENTE'}
                          </span>
                          <span className="text-[10px] font-black text-slate-500 block">
                            R$ {getSubValorForConsent(item).toFixed(2).replace('.', ',')}
                          </span>
                          <span className="text-[9px] font-bold text-indigo-600 px-1.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 uppercase tracking-wide block">
                            {(seniorIdMatch ? (localStorage.getItem(`anjo_sub_tipo_${seniorIdMatch}`) || 'individual') : 'individual') === 'coletivo' ? '👥 Coletivo' : '👤 Individual'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              if (seniorIdMatch) {
                                handleToggleSeniorSubscription(seniorIdMatch, liveStatus);
                              } else {
                                const newStatus = liveStatus === 'pago' ? 'atrasado' : 'pago';
                                localStorage.setItem(`anjo_sub_status_${item.id}`, newStatus);
                                
                                const updatedConsents = consents.map(c => {
                                  if (c.id === item.id) {
                                    return { ...c, statusFinanceiro: newStatus };
                                  }
                                  return c;
                                });
                                localStorage.setItem('anjo_lgpd_consents', JSON.stringify(updatedConsents));
                                setConsents(updatedConsents);
                                
                                window.dispatchEvent(new Event('anjo_user_updated'));
                                loadData();
                                
                                try {
                                  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                                  const osc = ctx.createOscillator();
                                  const gain = ctx.createGain();
                                  osc.frequency.setValueAtTime(newStatus === 'pago' ? 700 : 350, ctx.currentTime);
                                  gain.gain.setValueAtTime(0.05, ctx.currentTime);
                                  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
                                  osc.connect(gain);
                                  gain.connect(ctx.destination);
                                  osc.start();
                                  osc.stop(ctx.currentTime + 0.25);
                                } catch(e){}
                              }
                            }}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer ${
                              liveStatus === 'pago'
                                ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 animate-bounce'
                            }`}
                            title={liveStatus === 'pago' ? "Bloquear acesso por inadimplência" : "Aprovar pagamento / Desbloquear"}
                          >
                            {liveStatus === 'pago' ? '⚠️ Cortar Acesso' : '✓ Registrar Pago'}
                          </button>

                          <button
                            onClick={() => {
                              setBillingMessageType(liveStatus === 'pago' ? 'monthly_billing' : 'block_warning');
                              setBillingModalUser(item);
                            }}
                            className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase bg-indigo-55 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-all cursor-pointer flex items-center gap-1"
                            title="Disparar aviso comercial ou cobrança Pix via WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Cobrar</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* 📈 MÁQUINA DE VENDAS: JORNADA DE COMUNICAÇÃO DE 30 DIAS */}
      <div className={`p-6 rounded-3xl border ${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200'
      } shadow-md space-y-6`} id="admin-sales-machine-panel">
        
        <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1 text-left">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-full uppercase tracking-wider">
              📈 Máquina de Vendas
            </span>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <span>🚀</span> Jornada Comercial dos 30 Dias Grátis (Trial)
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Não perca assinantes! Acompanhe o funil de comunicação dos 30 dias de teste grátis e envie mensagens de alto valor para guiar os pais até a assinatura por Pix.
            </p>
          </div>

          {/* User selector */}
          <div className="shrink-0 flex flex-col items-start gap-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400">Selecionar Tutor Alvo:</label>
            <select
              value={selectedJourneyUser?.id || ''}
              onChange={(e) => {
                const found = consents.find(c => c.id === e.target.value);
                if (found) setSelectedJourneyUser(found);
              }}
              className={`p-2 rounded-xl border text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-205 text-slate-800'
              }`}
            >
              {consents.length === 0 ? (
                <option value="">Nenhum tutor cadastrado</option>
              ) : (
                consents.map(c => (
                  <option key={c.id} value={c.id}>
                    👤 {c.usuarioNome} ({c.idosoNome})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {selectedJourneyUser ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Milestone 1: Dia 1 */}
            <div className={`p-4 rounded-2xl border flex flex-col justify-between space-y-4 ${
              isDark ? 'bg-slate-850/50 border-slate-755' : 'bg-slate-50/50 border-slate-150'
            }`}>
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-150 pb-2">
                  <span className="text-xs font-black text-indigo-600 uppercase tracking-wide">Dia 1 • Boas-vindas</span>
                  <span className="text-lg">🎁</span>
                </div>
                
                <p className="text-[10px] text-slate-400 font-bold text-left uppercase leading-none">Ação Estratégica:</p>
                <p className="text-[11px] text-slate-600 leading-relaxed text-left font-semibold">
                  Acolher o tutor na ativação do perfil grátis, gerando simpatia e demonstrando a utilidade do aplicativo desde o primeiro minuto.
                </p>

                {/* Mock Phone Bubble */}
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3 text-[11px] leading-relaxed text-slate-700 text-left font-medium select-all">
                  {getJourneyMessage(1, selectedJourneyUser)}
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const cleanNum = formatWhatsAppNumber(selectedJourneyUser.usuarioTelefone);
                    const text = encodeURIComponent(getJourneyMessage(1, selectedJourneyUser));
                    window.open(`https://wa.me/${cleanNum}?text=${text}`, '_blank');
                  }}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  💬 Enviar WhatsApp Real
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (triggerWhatsAppSim) {
                      triggerWhatsAppSim(
                        "Dia 1: Boas-vindas ao Aplicativo",
                        getJourneyMessage(1, selectedJourneyUser)
                      );
                    }
                  }}
                  className="w-full py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-[10px] font-bold uppercase transition-all cursor-pointer"
                >
                  📱 Testar Disparo Virtual
                </button>
              </div>
            </div>

            {/* Milestone 2: Dia 15 */}
            <div className={`p-4 rounded-2xl border flex flex-col justify-between space-y-4 ${
              isDark ? 'bg-slate-850/50 border-slate-755' : 'bg-slate-50/50 border-slate-150'
            }`}>
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-150 pb-2">
                  <span className="text-xs font-black text-amber-600 uppercase tracking-wide">Dia 15 • Reforçar Valor</span>
                  <span className="text-lg">🌸</span>
                </div>
                
                <p className="text-[10px] text-slate-400 font-bold text-left uppercase leading-none">Ação Estratégica:</p>
                <p className="text-[11px] text-slate-600 leading-relaxed text-left font-semibold">
                  Garantir que o tutor conheça as abas mais importantes (Medicamentos, Sinais Vitais) para que ele perceba o valor diário.
                </p>

                {/* Mock Phone Bubble */}
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 text-[11px] leading-relaxed text-slate-700 text-left font-medium select-all">
                  {getJourneyMessage(15, selectedJourneyUser)}
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const cleanNum = formatWhatsAppNumber(selectedJourneyUser.usuarioTelefone);
                    const text = encodeURIComponent(getJourneyMessage(15, selectedJourneyUser));
                    window.open(`https://wa.me/${cleanNum}?text=${text}`, '_blank');
                  }}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  💬 Enviar WhatsApp Real
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (triggerWhatsAppSim) {
                      triggerWhatsAppSim(
                        "Dia 15: Reforço de Valor & Dica",
                        getJourneyMessage(15, selectedJourneyUser)
                      );
                    }
                  }}
                  className="w-full py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-[10px] font-bold uppercase transition-all cursor-pointer"
                >
                  📱 Testar Disparo Virtual
                </button>
              </div>
            </div>

            {/* Milestone 3: Dia 25 */}
            <div className={`p-4 rounded-2xl border flex flex-col justify-between space-y-4 ${
              isDark ? 'bg-slate-850/50 border-slate-755' : 'bg-slate-50/50 border-slate-150'
            }`}>
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-150 pb-2">
                  <span className="text-xs font-black text-rose-500 uppercase tracking-wide">Dia 25 • Aviso Prévio</span>
                  <span className="text-lg">🔔</span>
                </div>
                
                <p className="text-[10px] text-slate-400 font-bold text-left uppercase leading-none">Ação Estratégica:</p>
                <p className="text-[11px] text-slate-600 leading-relaxed text-left font-semibold">
                  Avisar de forma amigável que faltam apenas 5 dias para o fim do teste e fornecer a chave Pix para renovar sem pausas de segurança.
                </p>

                {/* Mock Phone Bubble */}
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-3 text-[11px] leading-relaxed text-slate-700 text-left font-medium select-all">
                  {getJourneyMessage(25, selectedJourneyUser)}
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const cleanNum = formatWhatsAppNumber(selectedJourneyUser.usuarioTelefone);
                    const text = encodeURIComponent(getJourneyMessage(25, selectedJourneyUser));
                    window.open(`https://wa.me/${cleanNum}?text=${text}`, '_blank');
                  }}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  💬 Enviar WhatsApp Real
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (triggerWhatsAppSim) {
                      triggerWhatsAppSim(
                        "Dia 25: Aviso de Fim do Período Grátis",
                        getJourneyMessage(25, selectedJourneyUser)
                      );
                    }
                  }}
                  className="w-full py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-[10px] font-bold uppercase transition-all cursor-pointer"
                >
                  📱 Testar Disparo Virtual
                </button>
              </div>
            </div>

            {/* Milestone 4: Dia 30 */}
            <div className={`p-4 rounded-2xl border flex flex-col justify-between space-y-4 ${
              isDark ? 'bg-slate-850/50 border-slate-755' : 'bg-slate-50/50 border-slate-150'
            }`}>
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-150 pb-2">
                  <span className="text-xs font-black text-red-600 uppercase tracking-wide">Dia 30 • Corte Elegante</span>
                  <span className="text-lg">⚠️</span>
                </div>
                
                <p className="text-[10px] text-slate-400 font-bold text-left uppercase leading-none">Ação Estratégica:</p>
                <p className="text-[11px] text-slate-600 leading-relaxed text-left font-semibold">
                  Bloquear o painel de faturamento no aplicativo de forma automática e enviar uma cobrança firme, mas polida, para reativação via Pix.
                </p>

                {/* Mock Phone Bubble */}
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-3 text-[11px] leading-relaxed text-slate-700 text-left font-medium select-all">
                  {getJourneyMessage(30, selectedJourneyUser)}
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const cleanNum = formatWhatsAppNumber(selectedJourneyUser.usuarioTelefone);
                    const text = encodeURIComponent(getJourneyMessage(30, selectedJourneyUser));
                    window.open(`https://wa.me/${cleanNum}?text=${text}`, '_blank');
                  }}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  💬 Enviar WhatsApp Real
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (triggerWhatsAppSim) {
                      triggerWhatsAppSim(
                        "Dia 30: Suspensão por Fim do Teste",
                        getJourneyMessage(30, selectedJourneyUser)
                      );
                    }
                    
                    // Trigger the actual block for testing in real-time!
                    const targetSeniorMatch = seniors.find(s => s.nome === selectedJourneyUser.idosoNome);
                    if (targetSeniorMatch) {
                      handleToggleSeniorSubscription(targetSeniorMatch.id, 'pago');
                    }
                  }}
                  className="w-full py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-[10px] font-bold uppercase transition-all cursor-pointer border border-red-200"
                  title="Testar o corte elegante simulado: Além do push, altera o status do perfil selecionado para bloquear na hora!"
                >
                  🚨 Testar Bloqueio Imediato
                </button>
              </div>
            </div>

          </div>
        ) : (
          <p className="text-xs text-slate-400 font-bold">Cadastre uma família na planilha ou no formulário para habilitar a visualização da Jornada Comercial.</p>
        )}

      </div>

      {/* 📱 CENTRAL DE COMERCIALIZAÇÃO, TESTE & QR CODE */}
      <div className={`p-6 rounded-3xl border ${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200'
      } shadow-md space-y-6`} id="admin-marketing-panel">
        
        <div className="border-b border-slate-100 pb-4">
          <h3 className="text-lg font-black text-indigo-600 uppercase tracking-tight flex items-center gap-2">
            <span>📱</span> Central Comercial de Testes & Divulgação por QR Code
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed font-semibold mt-1">
            Gere links promocionais e códigos QR para clínicas geriátricas, consultórios parceiros ou panfletos impressos. Controle o funil de aquisição de familiares de forma profissional.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Col 1: Marketing & Sales Operational Guide */}
          <div className="lg:col-span-7 space-y-5">
            <h4 className="text-sm font-extrabold text-slate-850">Como comercializar e controlar o acesso do app?</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-slate-850 border-slate-750' : 'bg-slate-50 border-slate-150'
              } space-y-2`}>
                <div className="text-xl">🎁</div>
                <h5 className="text-xs font-black uppercase text-indigo-600">Disponibilizar para Testes (Trial)</h5>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Ofereça até <strong>30 dias de teste grátis</strong> para novas famílias criarem perfis e usarem todos os recursos. Eles se cadastram pelo link gerado no QR Code ao lado.
                </p>
              </div>

              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-slate-850 border-slate-750' : 'bg-slate-50 border-slate-150'
              } space-y-2`}>
                <div className="text-xl">🎯</div>
                <h5 className="text-xs font-black uppercase text-rose-500">Bloqueio & Controle Absoluto</h5>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Gerencie o funil na planilha ou na <strong>Tabela de Faturamento</strong> acima. Se o período de teste expirar e o cliente não pagar o Pix mensal, clique em <strong className="text-rose-600">⚠️ Cortar Acesso</strong>. O app deles é bloqueado na hora com um cadeado e instruções de pagamento de R$ {subValor.toFixed(2).replace('.', ',')}!
                </p>
              </div>

              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-slate-850 border-slate-750' : 'bg-slate-50 border-slate-150'
              } space-y-2`}>
                <div className="text-xl">🏥</div>
                <h5 className="text-xs font-black uppercase text-emerald-600">Parcerias com Clínicas e Escolas</h5>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Imprima e cole o QR Code preparado no balcão de clínicas de geriatria ou envie nas reuniões de pais escolares. Isso automatiza a captação de clientes sem segredos.
                </p>
              </div>

              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-slate-850 border-slate-750' : 'bg-slate-50 border-slate-150'
              } space-y-2`}>
                <div className="text-xl">📊</div>
                <h5 className="text-xs font-black uppercase text-amber-500">Rastreamento de Origem</h5>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Selecione a campanha no painel ao lado e nós adicionamos um parâmetro invisível. Assim, você saberá exatamente de qual clínica ou panfleto veio cada novo responsável!
                </p>
              </div>

            </div>

            <div className={`p-4 rounded-2xl border border-dashed ${
              isDark ? 'border-slate-700 bg-slate-850/50' : 'border-indigo-200 bg-indigo-50/20'
            } space-y-2`}>
              <div className="flex items-center gap-1.5 text-xs font-black text-indigo-700 uppercase">
                <span>💡</span> Estratégia Recomendada
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Recomendamos imprimir um pequeno display acrílico para o balcão com a frase: <strong className="text-indigo-600">"Conecte sua família com o cuidado que ela merece. Escaneie e ganhe 10 dias de teste grátis no aplicativo oficial Anjo Cuidador."</strong>
              </p>
            </div>

          </div>

          {/* Col 2: Interactive Real-Time Custom QR Code Generator Card */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className={`w-full max-w-sm p-6 rounded-2xl border ${
              isDark ? 'bg-slate-850 border-slate-750' : 'bg-slate-50 border-slate-200'
            } shadow-sm space-y-4`}>
              
              <div className="text-center space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Gerador em Tempo Real</span>
                <h5 className="text-xs font-black text-slate-800">QR Code e Link de Divulgação</h5>
              </div>

              {/* URL Overrider */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400">Link Destino (Web App)</label>
                <input 
                  type="text"
                  placeholder="https://anjo-cuidador.app"
                  value={overrideUrl}
                  onChange={(e) => setOverrideUrl(e.target.value)}
                  className={`w-full p-2 border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/10 ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-205 text-slate-800'
                  }`}
                />
              </div>

              {/* Suffix Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400">Rastrear canal promocional:</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => setQrCampaign('nenhum')}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-center border cursor-pointer transition-all ${
                      qrCampaign === 'nenhum' 
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-3xs' 
                        : isDark ? 'border-slate-700 text-slate-350 hover:bg-slate-750' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    🏷️ Sem Filtro
                  </button>
                  <button
                    onClick={() => setQrCampaign('recepcao')}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-center border cursor-pointer transition-all ${
                      qrCampaign === 'recepcao' 
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-3xs' 
                        : isDark ? 'border-slate-700 text-slate-350 hover:bg-slate-750' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    🏥 Recepção
                  </button>
                  <button
                    onClick={() => setQrCampaign('panfleto')}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-center border cursor-pointer transition-all ${
                      qrCampaign === 'panfleto' 
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-3xs' 
                        : isDark ? 'border-slate-700 text-slate-350 hover:bg-slate-750' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    📄 Panfleto
                  </button>
                  <button
                    onClick={() => setQrCampaign('parceiros')}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-center border cursor-pointer transition-all ${
                      qrCampaign === 'parceiros' 
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-3xs' 
                        : isDark ? 'border-slate-700 text-slate-350 hover:bg-slate-750' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    🤝 Parceiro Pix
                  </button>
                </div>
              </div>

              {/* Target Profile Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400">Perfil Alvo ao escancear:</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => setQrTargetMode('idoso')}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold text-center border cursor-pointer transition-all ${
                      qrTargetMode === 'idoso' 
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-3xs' 
                        : isDark ? 'border-slate-700 text-slate-350 hover:bg-slate-750' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    👵 Anjo Cuidador
                  </button>
                  <button
                    onClick={() => setQrTargetMode('escolar_infantil')}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold text-center border cursor-pointer transition-all ${
                      qrTargetMode === 'escolar_infantil' 
                        ? 'bg-teal-600 text-white border-teal-600 shadow-3xs' 
                        : isDark ? 'border-slate-700 text-slate-350 hover:bg-slate-750' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    🧸 Anjinho Escolar
                  </button>
                </div>
              </div>

              {/* Visual QR Code Image representation */}
              {(() => {
                const base = overrideUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://anjo-cuidador.app');
                const cleanBase = base.endsWith('/') ? base : base + '/';
                
                // Compile beautiful parameters list
                const params = [];
                if (qrCampaign !== 'nenhum') {
                  params.push(`ref=${qrCampaign}`);
                }
                if (qrTargetMode === 'escolar_infantil') {
                  params.push(`mode=escolar`);
                } else {
                  params.push(`mode=idoso`);
                }
                
                const finalTargetUrl = `${cleanBase}?${params.join('&')}`;
                
                // Two highly robust public QR-code generators
                const googleQrUrl = `https://chart.googleapis.com/chart?cht=qr&chs=250x250&chl=${encodeURIComponent(finalTargetUrl)}`;
                const qrserverQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(finalTargetUrl)}`;
                
                const qrServiceUrl = qrSourceEngine === 'google' ? googleQrUrl : qrserverQrUrl;

                const handleCopyLink = async () => {
                  try {
                    await navigator.clipboard.writeText(finalTargetUrl);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  } catch(e) {
                    alert("Por favor selecione e copie o link manualmente no campo acima.");
                  }
                };

                const handleImageError = () => {
                  // Transparently fall back to the other engine if one fails (usually because of ad-blockers or temporary network issues)
                  if (qrSourceEngine === 'google') {
                    console.warn("Google Charts QR failed, falling back to QRServer...");
                    setQrSourceEngine('qrserver');
                  } else {
                    console.warn("QRServer failed, falling back to Google Charts...");
                    setQrSourceEngine('google');
                  }
                };

                return (
                  <div className="space-y-4 pt-1 flex flex-col items-center">
                    
                    {/* Glassmorphic border holder */}
                    <div className="bg-white p-4.5 rounded-2xl shadow-md border border-slate-150 relative group flex flex-col items-center">
                      <img 
                        src={qrServiceUrl} 
                        alt="Promo QR Code" 
                        onError={handleImageError}
                        className="w-48 h-48 block rounded-lg select-none"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-slate-900/5 hover:bg-transparent rounded-2xl transition-colors duration-200 pointer-events-none"></div>
                    </div>

                    <div className="text-center w-full space-y-2">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] text-slate-400 font-medium">
                          Servidor de QR Ativo: <strong className="text-indigo-600 uppercase">{qrSourceEngine === 'google' ? 'Google API (Ultra-Rápido)' : 'QRServer API'}</strong>
                        </span>
                        <button
                          onClick={() => setQrSourceEngine(prev => prev === 'google' ? 'qrserver' : 'google')}
                          className={`text-[9px] font-bold px-2 py-0.5 rounded border shadow-3xs cursor-pointer transition-colors ${
                            isDark 
                              ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750' 
                              : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-100'
                          }`}
                          title="Clique caso seu bloqueador de anúncios ou antivírus no computador esteja impedindo a imagem de carregar"
                        >
                          🔄 Alternar Servidor de QR
                        </button>
                      </div>

                      <code className="text-[10px] block font-mono text-indigo-600 truncate bg-indigo-50/50 py-1.5 px-2 rounded-lg border border-indigo-100 max-w-full select-all">
                        {finalTargetUrl}
                      </code>

                      <div className="flex gap-2">
                        <button
                          onClick={handleCopyLink}
                          className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 shadow-xs"
                        >
                          {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedLink ? 'Copiado!' : 'Copiar Link'}
                        </button>

                        <a
                          href={qrServiceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="py-2 px-3 border border-slate-205 text-slate-500 hover:bg-slate-100 font-extrabold text-[10px] rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 bg-white"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Baixar QR
                        </a>
                      </div>
                    </div>

                  </div>
                );
              })()}

            </div>
          </div>

        </div>

      </div>

      {/* Automatic Integration Architecture & Guide Card */}
      <div className={`p-6 rounded-3xl border ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-205'
      } space-y-4 shadow-2xs`} id="admin-integration-educative">
        <div className="flex items-center justify-between flex-col md:flex-row gap-3">
          <div className="space-y-1">
            <h4 className="text-sm font-black text-indigo-600 flex items-center gap-1.5 uppercase">
              🚀 Como Integrar de forma 100% Automática com o Google Sheets?
            </h4>
            <p className="text-slate-500 text-xs leading-relaxed max-w-2xl font-medium">
              Sua ideia de mandar automaticamente para a planilha é excelente! No mundo real, você não precisa exportar manualmente o arquivo CSV toda hora. Nós fazemos as informações se comunicarem de forma fluida.
            </p>
          </div>

          <button
            onClick={() => setIntegrationCodeVisible(!integrationCodeVisible)}
            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-600 font-extrabold text-xs rounded-xl cursor-pointer shrink-0 transition-all flex items-center gap-1"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {integrationCodeVisible ? "Ocultar Instruções" : "Ver Código de Exemplo"}
          </button>
        </div>

        {integrationCodeVisible && (
          <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 text-xs font-medium space-y-4 border border-slate-850 animate-slide-up">
            <p className="leading-relaxed">
              <strong>Como isso funciona na prática?</strong> <br />
              Toda vez que o familiar ou o cuidador assina digitalmente o consentimento (LGPD) ou realiza um pagamento pelo Pix, nós fazemos um envio no plano de fundo do aplicativo para uma <strong>Google Sheet</strong> (sua planilha dinâmica).
            </p>

            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">Passo a Passo Rápido:</span>
              <ol className="list-decimal pl-5 space-y-1.5 text-slate-300">
                <li>Você cria uma conta gratuita no <strong>Make.com</strong> ou <strong>Zapier</strong>.</li>
                <li>Gera uma URL de <strong>Webhook</strong> e conecta com o módulo do Google Planilhas.</li>
                <li>Nós colocamos o código abaixo no evento de aceitação de consentimento no seu app para enviar as colunas:</li>
              </ol>
            </div>

            <div className="relative">
              <pre className="p-4 bg-slate-950 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed text-emerald-400">
{`// Código real de sincronização em segundo plano (Webhook automático):
async function enviarParaGoogleSheets(dadosConsentimento) {
  try {
    const webhookURL = "https://hook.us1.make.com/sua-chave-webhook-sheets";
    
    const response = await fetch(webhookURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        gestorNome: dadosConsentimento.usuarioNome,
        registroEmail: dadosConsentimento.usuarioEmail,
        whatsappTelefone: dadosConsentimento.usuarioTelefone,
        idosoAssistido: dadosConsentimento.idosoNome,
        dataHora: dadosConsentimento.dataConsentimento,
        certificadoAuditoria: dadosConsentimento.deviceFingerprint,
        situacaoMensalidade: "ADIMPLENTE"
      })
    });
    
    if (response.ok) {
      console.log("Planilha do Google atualizada automaticamente!");
    }
  } catch (error) {
    console.warn("Falha ao comunicar com Google Planilhas. Sincronização offline retentará em breve.", error);
  }
}`}
              </pre>
            </div>

            <div className="p-3.5 bg-slate-850 rounded-xl text-slate-300 leading-normal flex items-start gap-2 border border-slate-750">
              <span className="text-base shrink-0">💡</span>
              <span>
                <strong>Próximo Passo Recomendado:</strong> se você quiser implantar essa automação definitiva com o Sheets para receber as notificações direto no celular da sua equipe comercial, peça para eu escrever ou configurar esse webhook para você!
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 📋 REAL-TIME GENERAL LOGS AUDITOR: SAÚDE, SONO & FRALDA */}
      <div className={`p-6 rounded-3xl border ${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-205'
      } shadow-md space-y-5`} id="admin-sinais-realtime-monitor">
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1 text-left">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-50 text-rose-700 text-[10px] font-black rounded-full uppercase tracking-wider">
              📋 Auditoria de Rotina
            </span>
            <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-1.5">
              <span>🩺</span> Diários de Saúde, Sono & Fralda (Tempo Real)
            </h3>
            <p className="text-xs text-slate-500 leading-none">
              Consulte e audite todos os registros de sono, troca de fraldas, vitais e observações inseridos no app.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={loadData}
              className={`p-2 rounded-xl border transition-all hover:bg-slate-100 ${
                isDark ? 'border-slate-700 hover:bg-slate-850' : 'border-slate-200 bg-white'
              } cursor-pointer`}
              title="Recarregar diários"
            >
              <RefreshCw className="w-4 h-4 text-slate-500" />
            </button>

            {/* Mode Segmented Controls */}
            <div className="inline-flex bg-slate-100 p-1 rounded-xl gap-1 shrink-0">
              <button
                onClick={() => setSinaisFilterMode('todos')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  sinaisFilterMode === 'todos' ? 'bg-white text-slate-800 shadow-3xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setSinaisFilterMode('idoso')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  sinaisFilterMode === 'idoso' ? 'bg-white text-slate-800 shadow-3xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                👵 Idosos
              </button>
              <button
                onClick={() => setSinaisFilterMode('creche')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  sinaisFilterMode === 'creche' ? 'bg-white text-slate-800 shadow-3xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                🧸 Creche
              </button>
              <button
                onClick={() => setSinaisFilterMode('fundamental')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  sinaisFilterMode === 'fundamental' ? 'bg-white text-slate-800 shadow-3xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                🎒 Fundamental
              </button>
            </div>
          </div>
        </div>

        {/* Search Input for signals */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
          <input
            type="text"
            value={sinaisSearchTerm}
            onChange={e => setSinaisSearchTerm(e.target.value)}
            placeholder="Pesquisar por aluno/idoso, professor/cuidador, soneca, xixi/cocô ou anotações..."
            className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-2xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/10 focus:outline-none focus:bg-white transition-all ${
              isDark ? 'border-slate-850 text-white' : 'border-slate-205'
            }`}
          />
        </div>

        {/* Signals Table */}
        <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-3xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-4 font-black uppercase text-[10px] text-slate-400">Aluno / Idoso</th>
                <th className="p-4 font-black uppercase text-[10px] text-slate-400">Data e Hora</th>
                <th className="p-4 font-black uppercase text-[10px] text-slate-400">Sono / Soneca / PA</th>
                <th className="p-4 font-black uppercase text-[10px] text-slate-400">Fralda / Comportamento</th>
                <th className="p-4 font-black uppercase text-[10px] text-slate-400">Vitais / Hidratação</th>
                <th className="p-4 font-black uppercase text-[10px] text-slate-400">Registrado Por</th>
                <th className="p-4 font-black uppercase text-[10px] text-slate-400">Observações</th>
                <th className="p-4 font-black uppercase text-[10px] text-slate-400 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {(() => {
                const filteredSinais = sinaisList.filter(item => {
                  const matchSenior = seniors.find(s => s.id === item.idosoId) as any;
                  const isEscolarFun = item.idosoId && (item.idosoId.startsWith('aluno_fun') || matchSenior?.grupo === 'fundamental');
                  const isEscolarInf = item.idosoId && item.idosoId.startsWith('aluno') && !isEscolarFun;
                  const isIdosoMode = !isEscolarFun && !isEscolarInf;

                  if (sinaisFilterMode === 'idoso' && !isIdosoMode) return false;
                  if (sinaisFilterMode === 'creche' && !isEscolarInf) return false;
                  if (sinaisFilterMode === 'fundamental' && !isEscolarFun) return false;

                  if (sinaisSearchTerm) {
                    const term = sinaisSearchTerm.toLowerCase();
                    const idosoName = (seniors.find(s => s.id === item.idosoId)?.nome || '').toLowerCase();
                    const registrador = (item.registradoPor || '').toLowerCase();
                    const obs = (item.observacoes || '').toLowerCase();
                    const sonoVal = (item.pressaoArterial || item.soneca || '').toLowerCase();
                    const fraldaVal = (item.glicemia || item.fralda || '').toLowerCase();

                    return idosoName.includes(term) || 
                           registrador.includes(term) || 
                           obs.includes(term) || 
                           sonoVal.includes(term) || 
                           fraldaVal.includes(term);
                  }
                  return true;
                });

                if (filteredSinais.length === 0) {
                  return (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        Nenhum registro de Saúde, Sono ou Fralda localizado para esta busca.
                      </td>
                    </tr>
                  );
                }

                // Show most recent first
                const sortedSinais = [...filteredSinais].sort((a, b) => {
                  const dateA = new Date(`${a.data}T${a.horario}`);
                  const dateB = new Date(`${b.data}T${b.horario}`);
                  return dateB.getTime() - dateA.getTime();
                });

                return sortedSinais.map((item) => {
                  const matchS = seniors.find(s => s.id === item.idosoId) as any;
                  const isEscolarFun = item.idosoId && (item.idosoId.startsWith('aluno_fun') || matchS?.grupo === 'fundamental');
                  const isEscolarInf = item.idosoId && item.idosoId.startsWith('aluno') && !isEscolarFun;
                  const isIdosoMode = !isEscolarFun && !isEscolarInf;

                  let modeLabel = '👵 Idoso';
                  let modeClass = 'bg-emerald-50 text-emerald-800 border-emerald-100';
                  if (isEscolarFun) {
                    modeLabel = '🎒 Fundamental';
                    modeClass = 'bg-violet-50 text-violet-800 border-violet-100';
                  } else if (isEscolarInf) {
                    modeLabel = '🧸 Creche';
                    modeClass = 'bg-indigo-50 text-indigo-800 border-indigo-100';
                  }

                  const handleDelete = () => {
                    if (window.confirm("Deseja realmente remover permanentemente este registro de saúde/rotina? Esta ação é irreversível.")) {
                      const allSinais = getFromDB<any[]>('anjo_sinais', []);
                      const updated = allSinais.filter(s => s.id !== item.id);
                      saveToDB('anjo_sinais', updated);
                      setSinaisList(updated);
                      window.dispatchEvent(new CustomEvent('anjo_user_updated'));
                    }
                  };

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <div className="space-y-1">
                          <p className="font-extrabold text-slate-900">{matchS ? matchS.nome : item.idosoId}</p>
                          <span className={`inline-block px-2 py-0.5 text-[9px] font-black uppercase rounded-md border ${modeClass}`}>
                            {modeLabel}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-slate-500">
                        {item.data ? item.data.split('-').reverse().join('/') : '-'} às {item.horario || '-'}
                      </td>
                      <td className="p-4 font-extrabold">
                        {isEscolarFun ? (
                          <div className="space-y-0.5">
                            <span className="text-[9px] block text-slate-400 font-bold uppercase">Lição / Dever:</span>
                            <span className="text-slate-800 text-xs">{item.pressaoArterial || 'Sem registros'}</span>
                          </div>
                        ) : isEscolarInf ? (
                          <div className="space-y-0.5">
                            <span className="text-[9px] block text-indigo-400 font-bold uppercase">💤 Soneca:</span>
                            <span className="text-indigo-800 text-xs">{item.pressaoArterial || item.soneca || 'Sem registros'}</span>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="text-[9px] block text-emerald-400 font-bold uppercase">Pressão Arterial:</span>
                            <span className="text-emerald-800 text-xs">{item.pressaoArterial || 'Sem registros'}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-4 font-extrabold">
                        {isEscolarFun ? (
                          <div className="space-y-0.5">
                            <span className="text-[9px] block text-slate-400 font-bold uppercase">🎯 Comportamento:</span>
                            <span className="text-slate-800 text-xs">{item.glicemia || 'Sem registros'}</span>
                          </div>
                        ) : isEscolarInf ? (
                          <div className="space-y-0.5">
                            <span className="text-[9px] block text-pink-400 font-bold uppercase">🧻 Fralda:</span>
                            <span className="text-pink-800 text-xs">{item.glicemia || item.fralda || 'Sem registros'}</span>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="text-[9px] block text-rose-400 font-bold uppercase">Glicemia:</span>
                            <span className="text-rose-800 text-xs">{item.glicemia ? `${item.glicemia} mg/dL` : 'Sem registros'}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="space-y-1 font-bold text-slate-650">
                          {item.temperatura ? (
                            <p className="flex items-center gap-1"><span className="text-red-500">🌡️</span> {item.temperatura} °C</p>
                          ) : null}
                          {isEscolarFun || isEscolarInf ? (
                            <>
                              {item.frequenciaCardiaca ? (
                                <p className="flex items-center gap-1"><span className="text-sky-500">💧</span> {item.frequenciaCardiaca} copos de água</p>
                              ) : null}
                              {item.saturacao ? (
                                <p className="flex items-center gap-1">
                                  <span className="text-amber-500">🍽️</span> {item.saturacao === 100 ? 'Aceitou Tudo' : item.saturacao === 50 ? 'Aceitou Parcial' : 'Recusou / Pouco'}
                                </p>
                              ) : null}
                            </>
                          ) : (
                            <>
                              {item.frequenciaCardiaca ? (
                                <p className="flex items-center gap-1"><span className="text-rose-500">❤️</span> {item.frequenciaCardiaca} bpm</p>
                              ) : null}
                              {item.saturacao ? (
                                <p className="flex items-center gap-1"><span className="text-blue-500">💙</span> {item.saturacao}% Sat. O₂</p>
                              ) : null}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-extrabold text-slate-800 text-xs">
                        👤 {item.registradoPor || 'Sistema'}
                      </td>
                      <td className="p-4 text-xs text-slate-500 italic max-w-xs truncate font-medium" title={item.observacoes}>
                        {item.observacoes || 'Nenhuma observação'}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={handleDelete}
                          className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all cursor-pointer"
                          title="Excluir este registro"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>
      </div>
      )}

      {/* ------------------- TAB 2: CRM ANJINHO ESCOLAR BAURU (FAMÍLIAS & FUNIL) ------------------- */}
      {adminActiveTab === 'crm_escolar' && (
        <div className="space-y-6 animate-fade-in">
          {/* Sub-navigation for CRM Bauru */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <button
              type="button"
              onClick={() => setCrmSubTab('dashboard')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                crmSubTab === 'dashboard'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Painel & Métricas Bauru</span>
            </button>

            <button
              type="button"
              onClick={() => setCrmSubTab('familias')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                crmSubTab === 'familias'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Baby className="w-4 h-4" />
              <span>Famílias Aderidas ({crmFamilias.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setCrmSubTab('origem')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                crmSubTab === 'origem'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Canais de Captação & Panfletagem</span>
            </button>

            <button
              type="button"
              onClick={() => setCrmSubTab('jornada')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                crmSubTab === 'jornada'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <MessageCircleHeart className="w-4 h-4" />
              <span>Engajamento & Jornada das Mães</span>
            </button>

            <button
              type="button"
              onClick={() => setCrmSubTab('financeiro')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                crmSubTab === 'financeiro'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Mensalidades R$ 29,90</span>
            </button>
          </div>

          {/* CRM SUB-TAB 1: DASHBOARD */}
          {crmSubTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Top KPIs Bauru */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-md space-y-1">
                  <span className="text-[10px] font-black uppercase opacity-80 tracking-wider">Famílias Ativas Bauru</span>
                  <div className="text-3xl font-black">{crmFamilias.filter(f => f.status === 'Ativo' || f.status === 'Teste (Trial)').length}</div>
                  <p className="text-[11px] font-medium opacity-90">Mães acompanhando rotina escolar diária</p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Receita Recorrente Estimada</span>
                  <div className="text-2xl font-black text-slate-800 dark:text-white">
                    R$ {crmFamilias.reduce((acc, f) => acc + (f.statusFinanceiro === 'pago' ? f.valorMensal : 0), 0).toFixed(2).replace('.', ',')}
                    <span className="text-xs text-slate-400 font-normal"> /mês</span>
                  </div>
                  <p className="text-[11px] font-bold text-emerald-600">Base R$ 29,90/mês por aluno</p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Demonstrações de Afeto</span>
                  <div className="text-2xl font-black text-rose-500 flex items-center gap-1">
                    ❤️ {crmFamilias.reduce((acc, f) => acc + (f.likesRecebidos || 0) + (f.regadasAmor || 0), 0)}
                  </div>
                  <p className="text-[11px] font-medium text-slate-500">Likes & Regadas de Amor no diário</p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Principal Canal Bauru</span>
                  <div className="text-lg font-black text-teal-600 truncate">QR Code na Entrada</div>
                  <p className="text-[11px] font-bold text-slate-500">58% das adesões totais</p>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Distribution by School in Bauru */}
                <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs space-y-4">
                  <div>
                    <h4 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-emerald-600" />
                      <span>Distribuição de Alunos por Escola em Bauru</span>
                    </h4>
                    <p className="text-xs text-slate-500">Quantidade de famílias cadastradas por unidade escolar</p>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: 'EMEF Santa Maria', familias: crmFamilias.filter(f => f.escola.includes('Santa Maria')).length },
                        { name: 'Colégio São Francisco', familias: crmFamilias.filter(f => f.escola.includes('São Francisco')).length },
                        { name: 'EMEI Leila de Fátima', familias: crmFamilias.filter(f => f.escola.includes('Leila')).length },
                        { name: 'Escola Criativa Bauru', familias: crmFamilias.filter(f => f.escola.includes('Criativa')).length },
                        { name: 'Colégio Preve Objetivo', familias: crmFamilias.filter(f => f.escola.includes('Preve')).length },
                        { name: 'Outras Escolas', familias: crmFamilias.filter(f => !f.escola.includes('Santa Maria') && !f.escola.includes('São Francisco') && !f.escola.includes('Leila') && !f.escola.includes('Criativa') && !f.escola.includes('Preve')).length }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="familias" fill="#059669" radius={[8, 8, 0, 0]} name="Famílias" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Acquisition Channel Pie */}
                <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs space-y-4">
                  <div>
                    <h4 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-teal-600" />
                      <span>Origem das Famílias em Bauru</span>
                    </h4>
                    <p className="text-xs text-slate-500">Canais que mais convertem mães para a plataforma</p>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'QR Code Entrada', value: crmFamilias.filter(f => f.origem.includes('QR Code')).length, color: '#059669' },
                            { name: 'Recepção Escola', value: crmFamilias.filter(f => f.origem.includes('Recepção')).length, color: '#0d9488' },
                            { name: 'Instagram', value: crmFamilias.filter(f => f.origem.includes('Instagram')).length, color: '#2563eb' },
                            { name: 'Indicação Mães', value: crmFamilias.filter(f => f.origem.includes('Indicação')).length, color: '#7c3aed' },
                            { name: 'WhatsApp', value: crmFamilias.filter(f => f.origem.includes('WhatsApp')).length, color: '#d97706' }
                          ]}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {
                            [
                              { color: '#059669' },
                              { color: '#0d9488' },
                              { color: '#2563eb' },
                              { color: '#7c3aed' },
                              { color: '#d97706' }
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))
                          }
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CRM SUB-TAB 2: FAMÍLIAS */}
          {crmSubTab === 'familias' && (
            <div className="space-y-4">
              {/* Filter controls */}
              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={crmSearch}
                    onChange={(e) => setCrmSearch(e.target.value)}
                    placeholder="Buscar mãe, criança ou fone..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <select
                    value={crmEscolaFilter}
                    onChange={(e) => setCrmEscolaFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="Todas">Escolas: Todas de Bauru</option>
                    <option value="EMEF Santa Maria">EMEF Santa Maria</option>
                    <option value="Colégio São Francisco">Colégio São Francisco</option>
                    <option value="EMEI Leila de Fátima">EMEI Leila de Fátima</option>
                    <option value="Escola Criativa Bauru">Escola Criativa Bauru</option>
                    <option value="Colégio Preve Objetivo">Colégio Preve Objetivo</option>
                  </select>
                </div>

                <div>
                  <select
                    value={crmCampanhaFilter}
                    onChange={(e) => setCrmCampanhaFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="Todas">Campanhas: Todas</option>
                    <option value="Panfletagem Portão 7h30">Panfletagem Portão 7h30</option>
                    <option value="Volta às Aulas 2025">Volta às Aulas 2025</option>
                    <option value="Campanha Insta Bauru">Campanha Insta Bauru</option>
                    <option value="Indique uma Mãe">Indique uma Mãe</option>
                  </select>
                </div>

                <div>
                  <select
                    value={crmStatusFilter}
                    onChange={(e) => setCrmStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="Todos">Status: Todos</option>
                    <option value="Ativo">Ativo</option>
                    <option value="Teste (Trial)">Teste (Trial)</option>
                    <option value="Pendente">Pendente</option>
                  </select>
                </div>
              </div>

              {/* Families Table */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-black tracking-wider text-slate-500">
                        <th className="p-4">Responsável (Mãe/Pai)</th>
                        <th className="p-4">Criança (Aluno)</th>
                        <th className="p-4">Escola / Unidade</th>
                        <th className="p-4">Origem / Campanha</th>
                        <th className="p-4 text-center">Jornada</th>
                        <th className="p-4 text-center">Status Pix</th>
                        <th className="p-4 text-right">Ação WhatsApp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {crmFamilias
                        .filter(fam => {
                          if (crmSearch) {
                            const term = crmSearch.toLowerCase();
                            const matchResp = fam.responsavel.toLowerCase().includes(term);
                            const matchCrianca = fam.crianca.toLowerCase().includes(term);
                            const matchFone = fam.telefone.includes(term);
                            if (!matchResp && !matchCrianca && !matchFone) return false;
                          }
                          if (crmEscolaFilter !== 'Todas' && !fam.escola.includes(crmEscolaFilter)) return false;
                          if (crmCampanhaFilter !== 'Todas' && fam.campanha !== crmCampanhaFilter) return false;
                          if (crmStatusFilter !== 'Todos' && fam.status !== crmStatusFilter) return false;
                          return true;
                        })
                        .map(fam => {
                          const cleanNum = formatWhatsAppNumber(fam.telefone);
                          const msg = `Olá, *${fam.responsavel}*! 🏫 Acompanhe as fotos e novidades escolares de *${fam.crianca}* no *Anjinho Escolar Bauru*! Suporte: (14) 99812-3400.`;
                          const waUrl = `https://wa.me/${cleanNum}?text=${encodeURIComponent(msg)}`;

                          return (
                            <tr key={fam.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="p-4">
                                <div className="font-bold text-slate-900 dark:text-white">{fam.responsavel}</div>
                                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                                  <span>📞 {fam.telefone}</span>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                                  <Baby className="w-3.5 h-3.5" />
                                  <span>{fam.crianca}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 font-medium">{fam.idade}</div>
                              </td>
                              <td className="p-4">
                                <div className="font-medium text-slate-800 dark:text-slate-200">{fam.escola}</div>
                                <div className="text-[10px] text-slate-400">Desde {fam.dataAdesao}</div>
                              </td>
                              <td className="p-4">
                                <span className="px-2 py-0.5 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 rounded-md text-[10px] font-bold border border-teal-100 dark:border-teal-900">
                                  {fam.origem}
                                </span>
                                <div className="text-[10px] text-slate-400 mt-0.5">{fam.campanha}</div>
                              </td>
                              <td className="p-4 text-center">
                                <div className="font-black text-slate-800 dark:text-white">Dia {fam.diaJornada}/30</div>
                                <div className="text-[10px] text-rose-500 font-bold flex items-center justify-center gap-1">
                                  <span>❤️ {fam.likesRecebidos} likes</span>
                                </div>
                              </td>
                              <td className="p-4 text-center">
                                {fam.statusFinanceiro === 'pago' ? (
                                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-black rounded-full text-[10px] uppercase">
                                    ✓ Pago (R$ 29,90)
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-black rounded-full text-[10px] uppercase animate-pulse">
                                    ⚠️ Pendente
                                  </span>
                                )}
                              </td>
                              <td className="p-4 text-right">
                                <a
                                  href={waUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-black shadow-xs transition-all"
                                >
                                  <Send className="w-3 h-3" />
                                  <span>WhatsApp</span>
                                </a>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* CRM SUB-TAB 3: ORIGEM & DIVULGAÇÃO BAURU */}
          {crmSubTab === 'origem' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-lg">
                  📍
                </div>
                <h4 className="font-black text-slate-800 dark:text-white">Panfletagem de Portão (7h30)</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Flyer entregue aos pais na entrada e saída das escolas de Bauru. Possui QR Code direcionando para o cadastro rápido do aluno.
                </p>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-emerald-600">
                  Conversão média: 24% dos escaneamentos
                </div>
              </div>

              <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-black text-lg">
                  🏫
                </div>
                <h4 className="font-black text-slate-800 dark:text-white">Totem/Cartaz na Recepção</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Visual fixo na secretaria escolar. Pais escaneiam enquanto aguardam atendimento ou reunião de pais.
                </p>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-teal-600">
                  Excelente retenção e confiança das famílias
                </div>
              </div>

              <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg">
                  👩‍👧‍👦
                </div>
                <h4 className="font-black text-slate-800 dark:text-white">Grupos de Mães no WhatsApp</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Mães satisfeitas indicando no grupo de mães da sala. A recomendação boca a boca em Bauru gera adesões espontâneas.
                </p>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-indigo-600">
                  Efeito viral sem custo adicional
                </div>
              </div>
            </div>
          )}

          {/* CRM SUB-TAB 4: JORNADA DE ENGAJAMENTO */}
          {crmSubTab === 'jornada' && (
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
              <h4 className="font-black text-slate-800 dark:text-white text-base">
                Ciclo de 30 Dias de Amor das Famílias
              </h4>
              <p className="text-xs text-slate-500">
                Acompanhamento automático do nível de envolvimento das mães com o diário do aluno.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 space-y-2">
                  <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300">Semana 1 (Dia 1-7)</span>
                  <div className="text-xl font-black text-slate-800 dark:text-white">Encantamento Inicial</div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">A mãe recebe as primeiras fotos do almoço e soneca. Taxa de abertura de 98%.</p>
                </div>

                <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900 space-y-2">
                  <span className="text-[10px] font-black uppercase text-teal-700 dark:text-teal-300">Semana 2 (Dia 8-15)</span>
                  <div className="text-xl font-black text-slate-800 dark:text-white">Interação Ativa</div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">Uso diário dos botões "Dar Like" e "Regar com Amor". Média de 12 interações por semana.</p>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 space-y-2">
                  <span className="text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-300">Semana 3-4 (Dia 16-30)</span>
                  <div className="text-xl font-black text-slate-800 dark:text-white">Fidelização Recorrente</div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">Renovação da assinatura mensal de R$ 29,90 via Pix automático ou cartão.</p>
                </div>
              </div>
            </div>
          )}

          {/* CRM SUB-TAB 5: FINANCEIRO BAURU */}
          {crmSubTab === 'financeiro' && (
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h4 className="font-black text-slate-800 dark:text-white text-base">
                    Gestão de Faturamento Bauru (R$ 29,90/mês)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Controle de mensalidades de famílias conectadas ao Anjinho Escolar em Bauru
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-emerald-600">
                    R$ {crmFamilias.reduce((acc, f) => acc + (f.statusFinanceiro === 'pago' ? f.valorMensal : 0), 0).toFixed(2).replace('.', ',')}
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Total Recebido este mês</span>
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  Notificações de Mensalidade Prontas para WhatsApp
                </h5>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Envie a chave Pix com 1 clique para as mães com pagamento pendente:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {crmFamilias.filter(f => f.statusFinanceiro !== 'pago').map(fam => (
                      <a
                        key={fam.id}
                        href={`https://wa.me/${formatWhatsAppNumber(fam.telefone)}?text=${encodeURIComponent(`Olá, ${fam.responsavel}! 🏫 Chave Pix para renovação do Anjinho Escolar Bauru de ${fam.crianca}: ${billingPixKey || 'contato@anjocuidador.com.br'}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black inline-flex items-center gap-1 shadow-xs"
                      >
                        <Send className="w-3 h-3" />
                        <span>Cobrar {fam.responsavel} ({fam.crianca})</span>
                      </a>
                    ))}
                    {crmFamilias.filter(f => f.statusFinanceiro !== 'pago').length === 0 && (
                      <p className="text-xs font-bold text-emerald-600">✓ Todas as famílias de Bauru estão em dia!</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ➕ MODAL DE CADASTRO DE NOVA FAMÍLIA EM BAURU */}
      {crmNewFamilyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-black text-slate-800 dark:text-white text-base flex items-center gap-2">
                <Baby className="w-5 h-5 text-emerald-600" />
                <span>Nova Família em Bauru</span>
              </h3>
              <button
                type="button"
                onClick={() => setCrmNewFamilyModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCrmFamily} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Nome da Mãe / Responsável *</label>
                <input
                  type="text"
                  required
                  value={newFamMae}
                  onChange={(e) => setNewFamMae(e.target.value)}
                  placeholder="Ex: Vanessa Guimarães"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={newFamTelefone}
                    onChange={(e) => setNewFamTelefone(e.target.value)}
                    placeholder="(14) 99811-0099"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">E-mail</label>
                  <input
                    type="email"
                    value={newFamEmail}
                    onChange={(e) => setNewFamEmail(e.target.value)}
                    placeholder="mae@gmail.com"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Nome da Criança *</label>
                  <input
                    type="text"
                    required
                    value={newFamCrianca}
                    onChange={(e) => setNewFamCrianca(e.target.value)}
                    placeholder="Ex: Lucas Guimarães"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Idade / Série</label>
                  <input
                    type="text"
                    value={newFamIdade}
                    onChange={(e) => setNewFamIdade(e.target.value)}
                    placeholder="4 anos"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Escola em Bauru</label>
                <select
                  value={newFamEscola}
                  onChange={(e) => setNewFamEscola(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
                >
                  <option value="EMEF Santa Maria - Bauru">EMEF Santa Maria - Bauru</option>
                  <option value="Colégio São Francisco">Colégio São Francisco</option>
                  <option value="EMEI Leila de Fátima">EMEI Leila de Fátima</option>
                  <option value="Escola Criativa Bauru">Escola Criativa Bauru</option>
                  <option value="Colégio Preve Objetivo">Colégio Preve Objetivo</option>
                  <option value="Outra Unidade Bauru">Outra Unidade Bauru</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Canal de Origem</label>
                  <select
                    value={newFamOrigem}
                    onChange={(e) => setNewFamOrigem(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="QR Code Entrada">QR Code Entrada</option>
                    <option value="Recepção da Escola">Recepção da Escola</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Indicação de Mães">Indicação de Mães</option>
                    <option value="WhatsApp Direto">WhatsApp Direto</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Campanha</label>
                  <select
                    value={newFamCampanha}
                    onChange={(e) => setNewFamCampanha(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="Panfletagem Portão 7h30">Panfletagem Portão 7h30</option>
                    <option value="Volta às Aulas 2025">Volta às Aulas 2025</option>
                    <option value="Campanha Insta Bauru">Campanha Insta Bauru</option>
                    <option value="Indique uma Mãe">Indique uma Mãe</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCrmNewFamilyModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black shadow-md transition-all cursor-pointer"
                >
                  Salvar no CRM Bauru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 💳 MODAL DE COBRANÇA E COMERCIALIZAÇÃO WHATSAPP */}
      {billingModalUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-2 sm:p-4 z-50 animate-fade-in overflow-y-auto">
          <div className={`rounded-3xl p-5 sm:p-6 border max-w-lg w-full shadow-2xl relative space-y-4 my-auto ${
            accessibilitySettings.darkMode 
              ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-black/60' 
              : 'bg-white border-soft-gray text-slate-800 shadow-xl'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <h3 className="text-base font-black flex items-center gap-2">
                <span className="text-xl">💬</span>
                <span>Central de Cobrança WhatsApp</span>
              </h3>
              <button 
                onClick={() => setBillingModalUser(null)}
                className={`p-1.5 rounded-lg transition-colors hover:bg-slate-100 ${
                  accessibilitySettings.darkMode ? 'hover:bg-slate-800 text-slate-400' : 'text-slate-500'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-medium leading-relaxed text-left">
              {/* Recipient info badge */}
              <div className={`p-3 rounded-2xl border flex items-center gap-3 ${
                accessibilitySettings.darkMode ? 'bg-indigo-950/20 border-indigo-900/50 text-indigo-300' : 'bg-indigo-50/50 border-indigo-100 text-indigo-800'
              }`}>
                <span className="text-xl shrink-0">👤</span>
                <div>
                  <p className="font-bold text-slate-800">Enviando para: {billingModalUser.usuarioNome}</p>
                  <p className="text-[10px] opacity-75 text-slate-600">Tutor de {billingModalUser.idosoNome} • WhatsApp: {billingModalUser.usuarioTelefone}</p>
                </div>
              </div>

              {/* PIX Billing settings card */}
              <div className={`p-4 rounded-2xl border space-y-3 ${
                accessibilitySettings.darkMode ? 'bg-slate-850/50 border-slate-755' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">Dados do seu Pix para Receber</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Chave Pix</label>
                    <input 
                      type="text" 
                      value={billingPixKey}
                      onChange={(e) => handlePixKeyChange(e.target.value)}
                      placeholder="E-mail, celular, CNPJ ou aleatória"
                      className={`w-full px-3 py-1.5 rounded-xl border text-[11px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                        accessibilitySettings.darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-250 text-slate-850'
                      }`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Nome do Favorecido</label>
                    <input 
                      type="text" 
                      value={billingPixReceiver}
                      onChange={(e) => handlePixReceiverChange(e.target.value)}
                      placeholder="Nome completo do recebedor"
                      className={`w-full px-3 py-1.5 rounded-xl border text-[11px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                        accessibilitySettings.darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-250 text-slate-850'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Template selection tabs */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-450 text-slate-500 tracking-wide block">Escolha o Tipo de Notificação</label>
                <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setBillingMessageType('trial_ending')}
                    className={`py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer text-center ${
                      billingMessageType === 'trial_ending'
                        ? 'bg-indigo-600 text-white shadow-3xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    🎁 Fim do Teste
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingMessageType('monthly_billing')}
                    className={`py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer text-center ${
                      billingMessageType === 'monthly_billing'
                        ? 'bg-indigo-600 text-white shadow-3xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    🔔 Cobrança Pix
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingMessageType('block_warning')}
                    className={`py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer text-center ${
                      billingMessageType === 'block_warning'
                        ? 'bg-indigo-600 text-white shadow-3xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    ⚠️ Bloqueio
                  </button>
                </div>
              </div>

              {/* Text preview edit area */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wide">Mensagem Pronta para WhatsApp</label>
                  <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded uppercase">Editável antes do envio</span>
                </div>
                <textarea
                  rows={6}
                  value={billingCustomText}
                  onChange={(e) => setBillingCustomText(e.target.value)}
                  className={`w-full p-3 border rounded-2xl text-[11px] leading-relaxed font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                    accessibilitySettings.darkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-white border-slate-205 text-slate-700'
                  }`}
                />
              </div>

              {/* Actions buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-150">
                <button
                  type="button"
                  onClick={handleSendSimulatedWhatsAppBilling}
                  className={`w-full py-2.5 rounded-xl font-bold border transition-colors cursor-pointer text-[11px] flex items-center justify-center gap-1 ${
                    accessibilitySettings.darkMode 
                      ? 'border-slate-800 hover:bg-slate-850 text-slate-300' 
                      : 'border-slate-200 hover:bg-slate-100 text-slate-650'
                  }`}
                >
                  📱 Testar com Disparo Virtual
                </button>
                <button
                  type="button"
                  onClick={handleSendRealWhatsAppBilling}
                  className="w-full py-2.5 rounded-xl font-black bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer text-[11px] shadow-sm shadow-emerald-600/10 flex items-center justify-center gap-1"
                >
                  💬 Abrir Conversa Real no WhatsApp
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
