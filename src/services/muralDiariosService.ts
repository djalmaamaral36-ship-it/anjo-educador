import { DiarioRotinaRecebido, AvisoMural, RecadoEscolar } from '../types';
import { 
  subscribeToDiariosFirestore, 
  salvarDiarioFirestore, 
  subscribeToMuralFirestore, 
  salvarMuralFirestore, 
  subscribeToRecadosFirestore, 
  salvarRecadoFirestore 
} from './firestoreSync';

const STORAGE_DIARIOS_KEY = 'anjo_diarios_rotina_recebidos';
const STORAGE_MURAL_KEY = 'anjo_mural_avisos';
const STORAGE_RECADOS_KEY = 'anjo_recados_escolares';

const DIARIOS_INICIAIS: DiarioRotinaRecebido[] = [
  {
    id: 'diario_prev_1',
    studentId: 'mariana_souza',
    studentNome: 'Mariana Souza',
    turma: 'Berçário I - A',
    data: '05/09/2026',
    horarioEncerramento: '17:00',
    professoraNome: 'Ana Silva (Professora Titular)',
    tempoEmAula: '04h 15m',
    aguaMl: 550,
    mamadeirasContador: 2,
    refeicaoTipo: 'Papinha de Cenoura e Mandioquinha com Frango',
    aceitacao: 'Comeu Tudo (Excelente apetite)',
    humor: 'Alegre e Comunicativa',
    humorObs: 'Brincou com blocos de montar e interagiu muito bem com os coleguinhas.',
    soneca: 'Dormiu 1h 30m no soninho da tarde (13:15 às 14:45), bem tranquila.',
    fralda: '3 trocas (2 xixis normais + 1 cocô pastoso sem assadura) + Pomada protetora',
    temperatura: '36.5',
    textoWhatsApp: `🌟 *DIÁRIO DE CLASSE - ANJINHO ESCOLAR* 🌟

👶 *Aluno(a):* Mariana Souza
📅 *Data:* 05/09/2026 (Sexta-feira)
👩‍🏫 *Educadora:* Ana Silva
⏰ *Status:* Relatório do dia

---

🍼 *ALIMENTAÇÃO & HIDRATAÇÃO*
• *Mamadeira:* 2x servidas (180ml) – _Tomou Tudo / Super Bem_ 🌟
• *Água:* 550ml (5 copos) – _91% da meta diária de 600ml_ 💧
• *Lanchinho da Manhã:* Comeu Tudo ✅
• *Almocinho / Papinha:* Comeu Tudo ✅
• *Lanchinho da Tarde:* Comeu Tudo ✅
• *Jantinha:* Sem registro no período.

---

💤 *SONO & SAÚDE*
• *Soneca:* Dormiu 1h30 (das 13:15 às 14:45) 😴
• *Temperatura:* 36.5°C (Afebril) 🌡️
• *Peso:* 12.5 kg (Adequado) ⚖️
• *Fralda:* Xixi e Cocô + Pomada aplicada 🧷

---

😊 *HUMOR & CUIDADOS PESSOAIS*
• *Estado Emocional:* Alegre e Comunicativa
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
• 🗣️ Roda de conversa e socialização afetiva.
• 🎨 Pintura sensorial e exploração no parque.
• 🪞 Brincadeira de espelhos e autoconhecimento.
• 📖 Contação de histórias: "O Grande Rabanete".

---

📝 *RECADINHO DA EDUCADORA*
"Mariana teve um dia muito produtivo e alegre! Comeu super bem em todas as refeições, descansou tranquila no soninho e brincou muito no tapete sensorial com os amigos."

---

🔒 *AVISO DE PRIVACIDADE (LGPD)*
_Este relatório contém dados pessoais e de saúde protegidos pela Lei Geral de Proteção de Dados (Lei 13.709/2018). O envio é realizado exclusivamente ao responsável legal cadastrado. Em caso de dúvidas sobre o tratamento de dados, entre em contato com a secretaria da escola._

📞 *Contato da Escola:* (11) 95555-4440
💙 *Anjinho Escolar – Onde a infância é registrada com carinho.*`,
    destinatarioNome: 'Clarice Souza (Mãe)',
    destinatarioTelefone: '(11) 98844-2211',
    enviadoWhatsApp: true,
    publicadoMural: true,
    criadoEm: '05/09/2026 às 17:05',
  },
  {
    id: 'diario_prev_2',
    studentId: 'enzo_alencar',
    studentNome: 'Enzo Alencar',
    turma: 'Berçário I - A',
    data: '05/09/2026',
    horarioEncerramento: '16:45',
    professoraNome: 'Ana Silva (Professora Titular)',
    tempoEmAula: '04h 00m',
    aguaMl: 480,
    mamadeirasContador: 2,
    refeicaoTipo: 'Lanchinho de Banana Amassada e Aveia',
    aceitacao: 'Comeu Tudo',
    humor: 'Tranquilo',
    humorObs: 'Atividades motoras no tapete sensorial.',
    soneca: 'Dormiu 1h 10m no soninho da tarde.',
    fralda: '2 trocas regulares',
    temperatura: '36.6',
    textoWhatsApp: `🌟 *DIÁRIO DE CLASSE - ANJINHO ESCOLAR* 🌟

👶 *Aluno(a):* Enzo Alencar
📅 *Data:* 05/09/2026 (Sexta-feira)
👩‍🏫 *Educadora:* Ana Silva
⏰ *Status:* Relatório do dia

---

🍼 *ALIMENTAÇÃO & HIDRATAÇÃO*
• *Mamadeira:* 2x servidas (150ml) – _Tomou Tudo_ 🌟
• *Água:* 480ml (4 copos) – _80% da meta diária de 600ml_ 💧
• *Lanchinho da Manhã:* Comeu Tudo ✅
• *Almocinho / Papinha:* Comeu Tudo ✅
• *Lanchinho da Tarde:* Comeu Tudo ✅
• *Jantinha:* Sem registro no período.

---

💤 *SONO & SAÚDE*
• *Soneca:* Dormiu 1h10 (das 13:00 às 14:10) 😴
• *Temperatura:* 36.6°C (Afebril) 🌡️
• *Peso:* 13 kg (Adequado) ⚖️
• *Fralda:* 2 trocas regulares 🧷

---

😊 *HUMOR & CUIDADOS PESSOAIS*
• *Estado Emocional:* Calmo e Atento
• *Checklist de Higiene:*
  👕 Troca de roupas ✅
  🪥 Escovação dos dentes ✅
  🧼 Mãos e rosto ✅
  🛁 Banho tomado ✅
  🧴 Pomada/Protetor ✅

---

🎨 *VIVÊNCIAS PEDAGÓGICAS DO DIA*
⭐ *Engajamento:* Muito participativo!
A turma teve um dia rico em descobertas (BNCC):
• 🤝 Acolhida e músicas de integração.
• 🎨 Atividades motoras no tapete sensorial.
• 📖 Leitura guiada e cantigas de roda.

---

📝 *RECADINHO DA EDUCADORA*
"Enzo esteve muito bem hoje! Desenvolveu excelente foco nas atividades motoras e alimentou-se muito bem."

---

🔒 *AVISO DE PRIVACIDADE (LGPD)*
_Este relatório contém dados pessoais e de saúde protegidos pela Lei Geral de Proteção de Dados (Lei 13.709/2018). O envio é realizado exclusivamente ao responsável legal cadastrado. Em caso de dúvidas sobre o tratamento de dados, entre em contato com a secretaria da escola._

📞 *Contato da Escola:* (11) 95555-4440
💙 *Anjinho Escolar – Onde a infância é registrada com carinho.*`,
    destinatarioNome: 'Camila Duarte (Mãe)',
    destinatarioTelefone: '(11) 97722-3344',
    enviadoWhatsApp: true,
    publicadoMural: true,
    criadoEm: '05/09/2026 às 16:50',
  },
];

const MURAL_INICIAIS: AvisoMural[] = [
  {
    id: 'mural_1',
    titulo: '🎓 Encerramento do Período Letivo & Relatórios Consolidados (05/09)',
    categoria: 'diario_rotina',
    turma: 'Berçário I - A',
    autorNome: 'Profª. Ana Silva',
    data: '05/09/2026',
    conteudo:
      'Todas as atividades da turma foram encerradas com sucesso às 17:00. Os diários de classe individuais de hidratação, mamadeira, trocas de fralda e soninho foram consolidados e transmitidos para o WhatsApp dos responsáveis cadastrados.',
    tags: ['Diário de Rotina', 'Encerramento de Aula', 'Berçário I - A'],
    destinatarios: 'Todos os Pais e Responsáveis do Berçário I - A',
    criadoEm: '05/09/2026 às 17:05',
  },
  {
    id: 'mural_2',
    titulo: '💧 Campanha de Hidratação Saudável na Primavera',
    categoria: 'saude',
    turma: 'Berçário I - A',
    autorNome: 'Coordenação Pedagógica & Enfermagem',
    data: '04/09/2026',
    conteudo:
      'Lembramos aos pais que o clima mais seco exige reposição constante de água. Cada criança tem sua jarrinha e copinho monitorados em tempo real na rotina escolar.',
    tags: ['Saúde & Hidratação', 'Comunicado Geral'],
    destinatarios: 'Pais do Berçário I - A',
    criadoEm: '04/09/2026 às 10:00',
  },
  {
    id: 'mural_3',
    titulo: '🎨 Sexta-feira da Pintura Sensorial com Tintas Naturais',
    categoria: 'evento',
    turma: 'Berçário I - A',
    autorNome: 'Profª. Ana Silva',
    data: '02/09/2026',
    conteudo:
      'Nesta sexta-feira realizaremos a oficina de estimulação tátil com tintas comestíveis feitas com beterraba, espinafre e cenoura. Pedimos que enviem uma mudinha extra de roupinha confortável na mochila!',
    tags: ['Atividade Sensorial', 'Artes & Estímulo', 'Berçário I - A'],
    destinatarios: 'Pais e Responsáveis do Berçário I - A',
    criadoEm: '02/09/2026 às 14:20',
  },
];

const RECADOS_INICIAIS: RecadoEscolar[] = [
  {
    id: 'recado_1',
    studentId: 'mariana_souza',
    studentNome: 'Mariana Souza',
    turma: 'Berçário I - A',
    remetenteTipo: 'familia',
    remetenteNome: 'Clarice Souza (Mãe)',
    remetenteCargo: 'Mãe / Responsável',
    destinatarioNome: 'Profª. Ana Silva',
    mensagem:
      'Bom dia, Prô Ana! A Mariana acordou com o dentinho nascendo e um pouco dengosa hoje. Deixei o mordedor de silicone esterilizado na bolsa lateral da mochila.',
    data: '05/09/2026',
    horario: '07:45',
    lido: true,
    categoria: 'saude',
    enviadoWhatsApp: true,
    criadoEm: '05/09/2026 às 07:45',
  },
  {
    id: 'recado_2',
    studentId: 'mariana_souza',
    studentNome: 'Mariana Souza',
    turma: 'Berçário I - A',
    remetenteTipo: 'professor',
    remetenteNome: 'Profª. Ana Silva',
    remetenteCargo: 'Educadora Titular',
    destinatarioNome: 'Clarice Souza (Mãe)',
    mensagem:
      'Olá, Clarice! Recebido com carinho. Já higienizamos o mordedor e oferecemos a aguinha fresca. Ela está bem calma e participando da rodinha de música agora de manhã.',
    data: '05/09/2026',
    horario: '09:20',
    lido: true,
    categoria: 'recado_rapido',
    enviadoWhatsApp: true,
    criadoEm: '05/09/2026 às 09:20',
  },
  {
    id: 'recado_3',
    studentId: 'mariana_souza',
    studentNome: 'Mariana Souza',
    turma: 'Berçário I - A',
    remetenteTipo: 'familia',
    remetenteNome: 'Clarice Souza (Mãe)',
    remetenteCargo: 'Mãe / Responsável',
    destinatarioNome: 'Profª. Ana Silva & Portaria',
    mensagem:
      'Aviso de saída: Hoje às 17h15 quem irá retirar a Mariana será a vovó Lourdes Souza (RG 28.914.882-X), já cadastrada na lista de autorizados.',
    data: '05/09/2026',
    horario: '14:30',
    lido: true,
    categoria: 'saida_autorizada',
    enviadoWhatsApp: true,
    criadoEm: '05/09/2026 às 14:30',
  },
  {
    id: 'recado_4',
    studentId: 'enzo_alencar',
    studentNome: 'Enzo Alencar',
    turma: 'Berçário I - A',
    remetenteTipo: 'professor',
    remetenteNome: 'Profª. Ana Silva',
    remetenteCargo: 'Educadora Titular',
    destinatarioNome: 'Camila Duarte (Mãe)',
    mensagem:
      'Boa tarde, família do Enzo! Notamos que o pacote de fraldas tamanho G no escaninho está com as últimas 2 unidades. Se puderem enviar um pacote amanhã agradecemos!',
    data: '05/09/2026',
    horario: '15:10',
    lido: false,
    categoria: 'geral',
    enviadoWhatsApp: true,
    criadoEm: '05/09/2026 às 15:10',
  },
];

// Inicializar listeners em tempo real do Firestore se disponíveis
let listenersIniciados = false;
function iniciarListenersFirestoreSeNecessario() {
  if (listenersIniciados) return;
  listenersIniciados = true;

  try {
    subscribeToDiariosFirestore((diarios) => {
      localStorage.setItem(STORAGE_DIARIOS_KEY, JSON.stringify(diarios));
      window.dispatchEvent(new CustomEvent('anjo_diarios_sync_nuvem', { detail: diarios }));
    });

    subscribeToMuralFirestore((avisos) => {
      localStorage.setItem(STORAGE_MURAL_KEY, JSON.stringify(avisos));
      window.dispatchEvent(new CustomEvent('anjo_mural_sync_nuvem', { detail: avisos }));
    });

    subscribeToRecadosFirestore((recados) => {
      localStorage.setItem(STORAGE_RECADOS_KEY, JSON.stringify(recados));
      window.dispatchEvent(new CustomEvent('anjo_recados_sync_nuvem', { detail: recados }));
    });
  } catch (e) {
    console.warn('Não foi possível iniciar ouvintes em tempo real do Firestore:', e);
  }
}

// Iniciar ao carregar o módulo
iniciarListenersFirestoreSeNecessario();

// DIÁRIOS RECEBIDOS
export function getDiariosRecebidos(studentId?: string): DiarioRotinaRecebido[] {
  try {
    const raw = localStorage.getItem(STORAGE_DIARIOS_KEY);
    const list: DiarioRotinaRecebido[] = raw ? JSON.parse(raw) : DIARIOS_INICIAIS;
    if (studentId) {
      return list.filter((d) => !d.studentId || d.studentId === studentId);
    }
    return list;
  } catch {
    return DIARIOS_INICIAIS;
  }
}

export function salvarDiarioRecebido(diario: DiarioRotinaRecebido): void {
  try {
    const list = getDiariosRecebidos();
    const updated = [diario, ...list.filter((d) => d.id !== diario.id)];
    localStorage.setItem(STORAGE_DIARIOS_KEY, JSON.stringify(updated));
    // Persiste também no Firestore para sincronização em tempo real multi-usuário
    salvarDiarioFirestore(diario);
    window.dispatchEvent(new CustomEvent('anjo_diario_atualizado', { detail: diario }));
  } catch (e) {
    console.error('Erro ao salvar diário recebido', e);
  }
}

export function excluirDiarioRecebido(diarioId: string): void {
  try {
    const list = getDiariosRecebidos();
    const updated = list.filter((d) => d.id !== diarioId);
    localStorage.setItem(STORAGE_DIARIOS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('anjo_diario_atualizado', { detail: { id: diarioId, excluido: true } }));
  } catch (e) {
    console.error('Erro ao excluir diário recebido', e);
  }
}

// MURAL DE AVISOS
export function getMuralAvisos(turma?: string): AvisoMural[] {
  try {
    const raw = localStorage.getItem(STORAGE_MURAL_KEY);
    const list: AvisoMural[] = raw ? JSON.parse(raw) : MURAL_INICIAIS;
    if (turma && turma !== 'TODAS') {
      return list.filter((a) => !a.turma || a.turma === turma || a.turma === 'TODAS');
    }
    return list;
  } catch {
    return MURAL_INICIAIS;
  }
}

export function salvarAvisoMural(aviso: AvisoMural): void {
  try {
    const list = getMuralAvisos();
    const updated = [aviso, ...list.filter((a) => a.id !== aviso.id)];
    localStorage.setItem(STORAGE_MURAL_KEY, JSON.stringify(updated));
    salvarMuralFirestore(aviso);
    window.dispatchEvent(new CustomEvent('anjo_mural_atualizado', { detail: aviso }));
  } catch (e) {
    console.error('Erro ao salvar aviso no mural', e);
  }
}

// RECADOS ESCOLARES (COMUNICAÇÃO DE MÃO DUPLA: PAIS <-> PROFESSORES)
export function getRecadosEscolares(studentId?: string): RecadoEscolar[] {
  try {
    const raw = localStorage.getItem(STORAGE_RECADOS_KEY);
    const list: RecadoEscolar[] = raw ? JSON.parse(raw) : RECADOS_INICIAIS;
    if (studentId) {
      return list.filter((r) => !r.studentId || r.studentId === studentId);
    }
    return list;
  } catch {
    return RECADOS_INICIAIS;
  }
}

export function salvarRecadoEscolar(recado: RecadoEscolar): void {
  try {
    const list = getRecadosEscolares();
    const updated = [recado, ...list.filter((r) => r.id !== recado.id)];
    localStorage.setItem(STORAGE_RECADOS_KEY, JSON.stringify(updated));
    salvarRecadoFirestore(recado);
    window.dispatchEvent(new CustomEvent('anjo_recados_atualizado', { detail: recado }));
  } catch (e) {
    console.error('Erro ao salvar recado escolar', e);
  }
}

export function marcarRecadoComoLido(recadoId: string): void {
  try {
    const list = getRecadosEscolares();
    const recadoAlvo = list.find(r => r.id === recadoId);
    const updated = list.map((r) => (r.id === recadoId ? { ...r, lido: true } : r));
    localStorage.setItem(STORAGE_RECADOS_KEY, JSON.stringify(updated));
    if (recadoAlvo) {
      salvarRecadoFirestore({ ...recadoAlvo, lido: true });
    }
    window.dispatchEvent(new CustomEvent('anjo_recados_atualizado', { detail: { id: recadoId, lido: true } }));
  } catch (e) {
    console.error('Erro ao marcar recado como lido', e);
  }
}

