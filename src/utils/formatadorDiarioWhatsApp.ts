import { StudentPaxData } from '../types';

export interface ParametrosDiarioFormatado {
  student: StudentPaxData;
  tempoEmAula?: string;
  dataCustom?: string;
  horaCustom?: string;
  aguaMl?: number;
  mamadeirasContador?: number;
  mamadeiraVolume?: number;
  refeicaoTipo?: string;
  aceitacao?: string;
  humor?: string;
  humorObs?: string;
  soneca?: string;
  fralda?: string;
  temperatura?: string;
  peso?: string;
  checklist?: {
    trocaRoupas?: string;
    escovacaoDentes?: string;
    maosERosto?: string;
    banhoTomado?: string;
    pomadaProtetor?: string;
  };
  observacaoEducadora?: string;
  telefoneEscola?: string;
}

/**
 * Formata o Diário de Classe do Anjinho Escolar conforme o padrão aprovado:
 * Visualmente limpo, carinhoso, detalhado e em conformidade estrita com a LGPD.
 */
export function formatarDiarioCompletoWhatsApp(params: ParametrosDiarioFormatado): string {
  const { student } = params;

  const dataAtual = new Date();
  const diasDaSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const diaSemanaStr = diasDaSemana[dataAtual.getDay()];
  const dataFormatada = params.dataCustom || `${dataAtual.toLocaleDateString('pt-BR')} (${diaSemanaStr})`;
  const educadoraNome = student.professoraTitular || 'Ana Silva';

  // 1. ALIMENTAÇÃO & HIDRATAÇÃO
  const mamadeirasQtd = params.mamadeirasContador ?? student.alimentacao?.mamadeirasServidas ?? 0;
  const mamadeiraVol = params.mamadeiraVolume ?? student.alimentacao?.ultimoVolume ?? student.alimentacao?.volumeSelecionado ?? 150;
  const aceitacaoMamadeira = params.aceitacao ?? 'Tomou Tudo / Super Bem';

  const aguaConsumida = params.aguaMl ?? student.agua?.consumoMl ?? 0;
  const aguaMeta = student.agua?.metaMl || 600;
  const coposQtd = student.agua?.coposServidos || Math.max(1, Math.round(aguaConsumida / 100));
  const aguaPercent = Math.min(100, Math.round((aguaConsumida / aguaMeta) * 100));

  // Refeições do Aluno
  const refeicoesLista = student.alimentacao?.refeicoes || [
    { nome: 'Lanchinho da Manhã', status: 'Comeu Tudo' },
    { nome: 'Almocinho / Papinha', status: 'Comeu Tudo' },
    { nome: 'Lanchinho da Tarde', status: 'Comeu Tudo' },
    { nome: 'Jantinha', status: 'Sem registro no período' },
  ];

  const formatRefStatus = (status?: string) => {
    if (!status || status.toLowerCase().includes('sem registro') || status.toLowerCase().includes('pendente')) {
      return 'Sem registro no período.';
    }
    return `${status} ✅`;
  };

  const lancheManha = refeicoesLista.find(r => r.nome.toLowerCase().includes('manhã'));
  const almocinho = refeicoesLista.find(r => r.nome.toLowerCase().includes('almoço') || r.nome.toLowerCase().includes('papinha'));
  const lancheTarde = refeicoesLista.find(r => r.nome.toLowerCase().includes('tarde') || r.nome.toLowerCase().includes('frutinha'));
  const jantinha = refeicoesLista.find(r => r.nome.toLowerCase().includes('janta'));

  // 2. SONO & SAÚDE
  const sonecaTexto = params.soneca || student.saudeCards?.soneca?.valor || 'Dormiu 1h30 (das 12:00 às 13:30) 😴';
  const tempTexto = params.temperatura || student.saudeCards?.temperatura?.valor || '36.5°C';
  const tempLimpa = tempTexto.replace(/°C/gi, '').trim();
  const afebrilLabel = parseFloat(tempLimpa) <= 37.2 ? '(Afebril)' : '(Alerta Febril)';

  const pesoLimpo = params.peso || student.saudeCards?.peso?.valor || '12 kg';
  const pesoFormatado = pesoLimpo.includes('kg') ? pesoLimpo : `${pesoLimpo} kg`;

  const fraldaTexto = params.fralda || student.saudeCards?.fraldas?.valor || 'Xixi e Cocô + Pomada aplicada 🧷';

  // 3. HUMOR & CUIDADOS PESSOAIS
  const humorEstado = params.humor || student.humor?.estado || 'Alegre e Tranquilo';
  const humorObs = params.humorObs || student.humor?.observacao || '';

  const chk = params.checklist || student.higieneChecklist || {
    trocaRoupas: 'Realizado',
    escovacaoDentes: 'Realizado',
    maosERosto: 'Realizado',
    banhoTomado: 'Realizado',
    pomadaProtetor: 'Realizado',
  };

  const chkIcon = (val?: string) => (val === 'Realizado' ? '✅' : '⏳');

  // 4. VIVÊNCIAS PEDAGÓGICAS (BNCC) - Linha do tempo ou padrão enriquecido
  const atividadesTimeline = (student.auditoriaLinhaDoTempo || []).filter(
    (item) => item.tipo === 'pedagogico' || item.titulo.toLowerCase().includes('pedagógica') || item.titulo.toLowerCase().includes('atividade')
  );

  let vivenciasFormatadas = '';
  if (atividadesTimeline.length > 0) {
    vivenciasFormatadas = atividadesTimeline.map((act) => `• ${act.titulo.replace(/^Atividade Pedagógica:\s*/i, '')}: ${act.descricao}`).join('\n');
  } else {
    vivenciasFormatadas = 
`• 🤝 Acolhida e reconhecimento dos amigos.
• 🗣️ Roda de conversa e socialização afetiva.
• 🎨 Pintura sensorial e exploração de formas e cores no parque.
• 🪞 Brincadeira de espelhos e autoconhecimento.
• 📖 Contação de histórias interativa com livros ilustrados.`;
  }

  // 5. RECADINHO DA EDUCADORA
  let recadinhoTexto = params.observacaoEducadora || humorObs;
  if (!recadinhoTexto || recadinhoTexto.trim() === '') {
    recadinhoTexto = `"${student.nome} teve um dia muito produtivo e alegre! Alimentou-se super bem, descansou no soninho da tarde e participou com entusiasmo das atividades. Está sendo muito bem cuidada e amada por nós!"`;
  } else if (!recadinhoTexto.startsWith('"')) {
    recadinhoTexto = `"${recadinhoTexto}"`;
  }

  const contatoEscola = params.telefoneEscola || '(11) 95555-4440';

  return `🌟 *DIÁRIO DE CLASSE - ANJINHO ESCOLAR* 🌟

👶 *Aluno(a):* ${student.nome}
📅 *Data:* ${dataFormatada}
👩‍🏫 *Educadora:* ${educadoraNome}
⏰ *Status:* Relatório do dia

---

🍼 *ALIMENTAÇÃO & HIDRATAÇÃO*
• *Mamadeira:* ${mamadeirasQtd}x servida (${mamadeiraVol}ml) – _${aceitacaoMamadeira}_ 🌟
• *Água:* ${aguaConsumida}ml (${coposQtd} copos) – _${aguaPercent}% da meta diária de ${aguaMeta}ml_ 💧
• *Lanchinho da Manhã:* ${formatRefStatus(lancheManha?.status)}
• *Almocinho / Papinha:* ${formatRefStatus(almocinho?.status)}
• *Lanchinho da Tarde:* ${formatRefStatus(lancheTarde?.status)}
• *Jantinha:* ${formatRefStatus(jantinha?.status)}

---

💤 *SONO & SAÚDE*
• *Soneca:* ${sonecaTexto.includes('😴') ? sonecaTexto : `${sonecaTexto} 😴`}
• *Temperatura:* ${tempLimpa}°C ${afebrilLabel} 🌡️
• *Peso:* ${pesoFormatado} (Adequado) ⚖️
• *Fralda:* ${fraldaTexto.includes('🧷') ? fraldaTexto : `${fraldaTexto} 🧷`}

---

😊 *HUMOR & CUIDADOS PESSOAIS*
• *Estado Emocional:* ${humorEstado}
• *Checklist de Higiene:*
  👕 Troca de roupas ${chkIcon(chk.trocaRoupas)}
  🪥 Escovação dos dentes ${chkIcon(chk.escovacaoDentes)}
  🧼 Mãos e rosto ${chkIcon(chk.maosERosto)}
  🛁 Banho tomado ${chkIcon(chk.banhoTomado)}
  🧴 Pomada/Protetor ${chkIcon(chk.pomadaProtetor)}

---

🎨 *VIVÊNCIAS PEDAGÓGICAS DO DIA*
⭐ *Engajamento:* Muito participativa e encantada!
A turma teve um dia rico em descobertas (BNCC):
${vivenciasFormatadas}

---

📝 *RECADINHO DA EDUCADORA*
${recadinhoTexto}

---

🔒 *AVISO DE PRIVACIDADE (LGPD)*
_Este relatório contém dados pessoais e de saúde protegidos pela Lei Geral de Proteção de Dados (Lei 13.709/2018). O envio é realizado exclusivamente ao responsável legal cadastrado. Em caso de dúvidas sobre o tratamento de dados, entre em contato com a secretaria da escola._

📞 *Contato da Escola:* ${contatoEscola}
💙 *Anjinho Escolar – Onde a infância é registrada com carinho.*`;
}
