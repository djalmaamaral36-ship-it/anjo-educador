import { LgpdConsentimento, LgpdLogRegistro, TipoLgpdLog } from '../types';

const STORAGE_KEY_CONSENTIMENTOS = 'anjo_lgpd_consentimentos_v1';
const STORAGE_KEY_LOGS = 'anjo_lgpd_logs_auditoria_v1';

// Gerador simples de hash de integridade para simular carimbo digital seguro
export function gerarHashIntegridade(texto: string, timestamp: string): string {
  let hash = 0;
  const str = `${texto}_${timestamp}_ANJO_LGPD_2026`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Converte para inteiro 32bit
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0').toUpperCase();
  return `BR-LGPD-${hex}-${timestamp.slice(0, 10).replace(/-/g, '')}`;
}

// Consentimentos Iniciais
const CONSENTIMENTOS_INICIAIS: Record<string, LgpdConsentimento> = {
  mariana_souza: {
    id: 'lgpd_mariana_01',
    studentId: 'mariana_souza',
    studentNome: 'Mariana Souza',
    turma: 'Berçário I - A',
    responsavelNome: 'Camila Souza',
    responsavelCpf: '342.***.***-09',
    responsavelGrau: 'Mae',
    responsavelTelefone: '(11) 98765-4321',
    responsavelEmail: 'camila.souza@email.com',
    aceitoEm: '2026-02-10T14:30:00.000Z',
    aceitoEmFormatado: '10/02/2026 às 11:30',
    versaoTermo: '1.0/2026 - Educação Infantil',
    ipOrigem: '189.120.44.18 (São Paulo/SP)',
    dispositivoInfo: 'Smartphone Android (WhatsApp Auth Verified)',
    hashAssinaturaDigital: 'BR-LGPD-9F2B4E1A-20260210',
    status: 'ativo',
    autorizacoes: {
      tratamentoDadosMenor: true,
      comunicacaoWhatsAppERotina: true,
      registroSaudeEMedicamentos: true,
      registroFotograficoPedagogico: true,
    },
    observacoes: 'Termo assinado no primeiro acesso ao Portal de Famílias.',
  },
  enzo_alencar: {
    id: 'lgpd_enzo_01',
    studentId: 'enzo_alencar',
    studentNome: 'Enzo Alencar',
    turma: 'Berçário I - A',
    responsavelNome: 'Juliana Alencar',
    responsavelCpf: '219.***.***-45',
    responsavelGrau: 'Mae',
    responsavelTelefone: '(11) 97654-3210',
    responsavelEmail: 'juliana.alencar@email.com',
    aceitoEm: '2026-02-12T09:15:00.000Z',
    aceitoEmFormatado: '12/02/2026 às 06:15',
    versaoTermo: '1.0/2026 - Educação Infantil',
    ipOrigem: '177.34.198.52 (São Paulo/SP)',
    dispositivoInfo: 'Apple iPhone iOS (App Mobile)',
    hashAssinaturaDigital: 'BR-LGPD-A8C3D190-20260212',
    status: 'ativo',
    autorizacoes: {
      tratamentoDadosMenor: true,
      comunicacaoWhatsAppERotina: true,
      registroSaudeEMedicamentos: true,
      registroFotograficoPedagogico: true,
    },
    observacoes: 'Termo assinado eletronicamente via Portal da Família.',
  },
};

// Logs de Auditoria Iniciais
const LOGS_AUDITORIA_INICIAIS: LgpdLogRegistro[] = [
  {
    id: 'log_lgpd_001',
    tipo: 'whatsapp_diario',
    tipoLabel: 'Diário de Rotina via WhatsApp',
    studentId: 'mariana_souza',
    studentNome: 'Mariana Souza',
    turma: 'Berçário I - A',
    dataHoraFormatada: '07/09/2026 às 18:01:22',
    dataIso: '2026-09-07T18:01:22.000Z',
    remetenteNome: 'Ana Silva',
    remetenteCargo: 'Professora Titular',
    destinatarioNome: 'Camila Souza (Mãe)',
    destinatarioContato: '(11) 98765-4321',
    canal: 'whatsapp',
    conteudoResumo: 'Boletim diário: 350ml de água, 2 mamadeiras, soneca 1h30, humor calmo.',
    conteudoIntegral: `🌟 *DIÁRIO DE CLASSE - ANJINHO ESCOLAR* 🌟

👶 *Aluno(a):* Mariana Souza
📅 *Data:* 07/09/2026 (Segunda-feira)
👩‍🏫 *Educadora:* Ana Silva
⏰ *Status:* Relatório do dia

---

🍼 *ALIMENTAÇÃO & HIDRATAÇÃO*
• *Mamadeira:* 2x servidas (150ml) – _Tomou Tudo / Super Bem_ 🌟
• *Água:* 350ml (3 copos) – _58% da meta diária de 600ml_ 💧
• *Lanchinho da Manhã:* Comeu Tudo ✅
• *Almocinho / Papinha:* Comeu Tudo ✅
• *Lanchinho da Tarde:* Comeu Tudo ✅
• *Jantinha:* Sem registro no período.

---

💤 *SONO & SAÚDE*
• *Soneca:* Dormiu 1h30 (das 12:00 às 13:30) 😴
• *Temperatura:* 36.5°C (Afebril) 🌡️
• *Peso:* 12.0 kg (Adequado) ⚖️
• *Fralda:* Xixi e Cocô + Pomada aplicada 🧷

---

😊 *HUMOR & CUIDADOS PESSOAIS*
• *Estado Emocional:* Calma e Serena
• *Checklist de Higiene:*
  👕 Troca de roupas ✅
  🪥 Escovação dos dentes ✅
  🧼 Mãos e rosto ✅
  🛁 Banho tomado ✅
  🧴 Pomada/Protetor ✅

---

🎨 *VIVÊNCIAS PEDAGÓGICAS DO DIA*
⭐ *Engajamento:* Muito participativa e encantada!
A turma teve um dia rico em descobertas (BNCC):
• 🤝 Acolhida e reconhecimento dos amigos.
• 🎨 Pintura sensorial com cores primárias.
• 📖 Contação de histórias interativa: "O Grande Rabanete".

---

📝 *RECADINHO DA EDUCADORA*
"Mariana teve um dia muito calmo e acolhedor! Alimentou-se super bem e descansou no horário previsto."

---

🔒 *AVISO DE PRIVACIDADE (LGPD)*
_Este relatório contém dados pessoais e de saúde protegidos pela Lei Geral de Proteção de Dados (Lei 13.709/2018). O envio é realizado exclusivamente ao responsável legal cadastrado. Em caso de dúvidas sobre o tratamento de dados, entre em contato com a secretaria da escola._

📞 *Contato da Escola:* (11) 95555-4440
💙 *Anjinho Escolar – Onde a infância é registrada com carinho.*`,
    hashIntegridade: 'BR-LGPD-88A7C1-20260907',
    baseLegalLgpd: 'Art. 14, §1º da Lei 13.709/18 c/c Consentimento Ativo de 10/02/2026',
  },
  {
    id: 'log_lgpd_002',
    tipo: 'whatsapp_recado',
    tipoLabel: 'Recado Escolar via WhatsApp',
    studentId: 'mariana_souza',
    studentNome: 'Mariana Souza',
    turma: 'Berçário I - A',
    dataHoraFormatada: '06/09/2026 às 14:10:05',
    dataIso: '2026-09-06T14:10:05.000Z',
    remetenteNome: 'Ana Silva',
    remetenteCargo: 'Professora Titular',
    destinatarioNome: 'Camila Souza (Mãe)',
    destinatarioContato: '(11) 98765-4321',
    canal: 'whatsapp',
    conteudoResumo: 'Solicitação pedagógica: Reposição de fraldas e toalhinha de boca.',
    conteudoIntegral: 'Olá, Sra. Camila! Lembramos gentilmente de repor as fraldas descartáveis tamanho M da Mariana na mochilinha de amanhã. Um abraço da Prof. Ana Silva.',
    hashIntegridade: 'BR-LGPD-33D4F9-20260906',
    baseLegalLgpd: 'Art. 7º, Inciso V (Execução de Contrato e Dever Pedagógico) e Art. 14 da LGPD',
  },
  {
    id: 'log_lgpd_003',
    tipo: 'medicamento_ministrado',
    tipoLabel: 'Administração de Medicamento',
    studentId: 'mariana_souza',
    studentNome: 'Mariana Souza',
    turma: 'Berçário I - A',
    dataHoraFormatada: '05/09/2026 às 13:30:00',
    dataIso: '2026-09-05T13:30:00.000Z',
    remetenteNome: 'Ana Silva',
    remetenteCargo: 'Professora Titular',
    destinatarioNome: 'Registro Institucional / Camila Souza',
    destinatarioContato: '(11) 98765-4321',
    canal: 'sistema',
    conteudoResumo: 'Paracetamol Gotas 200mg/ml - 8 gotas ministrado conforme receita médica.',
    conteudoIntegral: 'Medicamento: Paracetamol Gotas 200mg/ml. Dosagem: 8 gotas às 13:30. Autorizado pela mãe via PIN de Segurança em 05/09/2026.',
    hashIntegridade: 'BR-LGPD-7E11B2-20260905',
    baseLegalLgpd: 'Art. 11, Inciso II, "f" da Lei 13.709/18 (Tutela da Saúde e Segurança do Menor)',
  },
  {
    id: 'log_lgpd_004',
    tipo: 'consentimento_assinado',
    tipoLabel: 'Assinatura de Termo LGPD',
    studentId: 'mariana_souza',
    studentNome: 'Mariana Souza',
    turma: 'Berçário I - A',
    dataHoraFormatada: '10/02/2026 às 11:30:00',
    dataIso: '2026-02-10T11:30:00.000Z',
    remetenteNome: 'Camila Souza',
    remetenteCargo: 'Mãe / Titular dos Dados',
    destinatarioNome: 'Escola Anjo Cuidador - Educação Infantil',
    destinatarioContato: 'contato@anjocuidador.com.br',
    canal: 'sistema',
    conteudoResumo: 'Aceite integral dos 4 eixos de consentimento da LGPD na Educação Infantil.',
    conteudoIntegral: 'Termo de Consentimento para Tratamento de Dados Pessoais de Crianças e Comunicações Escolares assinado digitalmente por Camila Souza (CPF 342.***.***-09).',
    hashIntegridade: 'BR-LGPD-9F2B4E1A-20260210',
    baseLegalLgpd: 'Art. 14, §1º da Lei 13.709/2018 (Consentimento Específico e Destacado dado por pelo menos um dos Pais)',
  },
];

// Obter todos os consentimentos salvos
export function getLgpdConsentimentos(): Record<string, LgpdConsentimento> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONSENTIMENTOS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_CONSENTIMENTOS, JSON.stringify(CONSENTIMENTOS_INICIAIS));
      return CONSENTIMENTOS_INICIAIS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Erro ao ler consentimentos LGPD:', err);
    return CONSENTIMENTOS_INICIAIS;
  }
}

// Obter consentimento de um aluno específico
export function getLgpdConsentimentoAluno(studentId: string): LgpdConsentimento | null {
  const todos = getLgpdConsentimentos();
  return todos[studentId] || null;
}

// Salvar / Atualizar Consentimento
export function salvarLgpdConsentimento(consentimento: LgpdConsentimento): void {
  const todos = getLgpdConsentimentos();
  todos[consentimento.studentId] = consentimento;
  try {
    localStorage.setItem(STORAGE_KEY_CONSENTIMENTOS, JSON.stringify(todos));
    
    // Registra o evento no livro de auditoria
    registrarLogAuditoriaLgpd({
      tipo: 'consentimento_assinado',
      tipoLabel: 'Assinatura de Termo LGPD',
      studentId: consentimento.studentId,
      studentNome: consentimento.studentNome,
      turma: consentimento.turma,
      remetenteNome: consentimento.responsavelNome,
      remetenteCargo: `${consentimento.responsavelGrau} / Responsável Legal`,
      destinatarioNome: 'Escola Anjo Cuidador',
      destinatarioContato: consentimento.responsavelTelefone,
      canal: 'sistema',
      conteudoResumo: `Consentimento LGPD firmado para ${consentimento.studentNome}.`,
      conteudoIntegral: `Assinatura do Termo de Consentimento v${consentimento.versaoTermo} por ${consentimento.responsavelNome} (CPF ${consentimento.responsavelCpf}). Autorizações: Dados Menor: ${consentimento.autorizacoes.tratamentoDadosMenor}, WhatsApp: ${consentimento.autorizacoes.comunicacaoWhatsAppERotina}, Saúde/Med: ${consentimento.autorizacoes.registroSaudeEMedicamentos}, Fotos: ${consentimento.autorizacoes.registroFotograficoPedagogico}. Hash: ${consentimento.hashAssinaturaDigital}`,
      baseLegalLgpd: 'Art. 14, §1º da Lei 13.709/2018 (Consentimento do Responsável Legal)',
    });
  } catch (err) {
    console.error('Erro ao salvar consentimento LGPD:', err);
  }
}

// Obter todos os Logs de Auditoria
export function getLgpdLogsAuditoria(): LgpdLogRegistro[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(LOGS_AUDITORIA_INICIAIS));
      return LOGS_AUDITORIA_INICIAIS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Erro ao ler logs de auditoria LGPD:', err);
    return LOGS_AUDITORIA_INICIAIS;
  }
}

// Registrar Novo Log de Auditoria Jurídica (Disparo de WhatsApp, Medicação, Ocorrência)
export function registrarLogAuditoriaLgpd(novo: Omit<LgpdLogRegistro, 'id' | 'dataHoraFormatada' | 'dataIso' | 'hashIntegridade'>): LgpdLogRegistro {
  const agora = new Date();
  const dataIso = agora.toISOString();
  const dataHoraFormatada = `${agora.toLocaleDateString('pt-BR')} às ${agora.toLocaleTimeString('pt-BR')}`;
  const hashIntegridade = gerarHashIntegridade(novo.conteudoIntegral || novo.conteudoResumo, dataIso);

  const logCompleto: LgpdLogRegistro = {
    ...novo,
    id: `log_lgpd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    dataHoraFormatada,
    dataIso,
    hashIntegridade,
  };

  const logsAtuais = getLgpdLogsAuditoria();
  const logsAtualizados = [logCompleto, ...logsAtuais];

  try {
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logsAtualizados));
  } catch (err) {
    console.error('Erro ao salvar log de auditoria LGPD:', err);
  }

  return logCompleto;
}
