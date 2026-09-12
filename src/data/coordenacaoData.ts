export interface AlertaIdentificacaoPrecoce {
  id: string;
  alunoId?: string;
  alunoNome: string;
  turma: string;
  area: 'Fala & Linguagem' | 'Socioemocional' | 'Integração Sensorial' | 'Coordenação Motora' | 'Comportamento';
  severidade: 'Leve / Inicial' | 'Moderada / Frequente' | 'Recorrente / Severa';
  sintese: string;
  observacaoObjetiva: string;
  registradoPor: string;
  dataRegistro: string;
  mensagemAcolhimentoSugerida: string;
  status: 'Em Monitoramento' | 'Família Orientada' | 'Encaminhado';
}

export interface EncaminhamentoEspecialista {
  id: string;
  alunoId?: string;
  alunoNome: string;
  turma: string;
  especialidade: 'Fonoaudiologia' | 'Terapia Ocupacional' | 'Neuropediatria' | 'Psicologia Infantil' | 'Psicopedagogia' | 'Geral / Coordenação';
  dataEncaminhamento: string;
  motivoRelato: string;
  statusRetorno: 'Aguardando Avaliação Externa' | 'Em Acompanhamento Clínico' | 'Devolutiva Recebida na Escola';
  registradoPor: string;
  parecerTecnico?: string;
  atualizadoPor?: string;
  dataAtualizacao?: string;
  documentoAnexoUrl?: string;
  privacidade: 'Confidencial - Apenas Coordenação e Direção';
}

export interface OcorrenciaMediacao {
  id: string;
  turma: string;
  alunosEnvolvidos: string;
  horario: string;
  dataOcorrencia: string;
  descricaoFatos: string;
  medidasPedagogicas: string;
  paisNotificadosConfidencialmente: boolean;
  registradoPor: string;
  resolvido: boolean;
}

export const ALERTAS_PRECOCES_INICIAIS: AlertaIdentificacaoPrecoce[] = [
  {
    id: 'alerta_1',
    alunoNome: 'Maria Eduarda',
    turma: 'Berçário I - A',
    area: 'Fala & Linguagem',
    severidade: 'Moderada / Frequente',
    sintese: 'Ausência de fala espontânea ou tentativas de comunicação aos 2 anos e meio.',
    observacaoObjetiva: 'Notado em interações na roda de música. Prefere apontar ou puxar o braço da professora para demonstrar necessidades.',
    registradoPor: 'Coordenação Pedagógica',
    dataRegistro: '11/05/2026',
    status: 'Em Monitoramento',
    mensagemAcolhimentoSugerida: '*Olá, responsável por Maria Eduarda! Esperamos que esteja bem. Observando o desenvolvimento de Maria Eduarda em nossas vivências de comunicação e interações pedagógicas, notamos que ela tem demonstrado comportamentos de foco atípicos. Gostaríamos de convidar vocês para um café com nossa coordenação na próxima quarta-feira para conversarmos em parceria sobre como podemos potencializar o desenvolvimento infantil de forma integral. Contem conosco!*'
  },
  {
    id: 'alerta_2',
    alunoNome: 'Enzo Gabriel',
    turma: 'Maternal I - A',
    area: 'Socioemocional',
    severidade: 'Recorrente / Severa',
    sintese: 'Isolamento contínuo durante o brincar livre e recusa em participar de atividades coletivas.',
    observacaoObjetiva: 'Brinca apenas no canto da sala enfileirando carrinhos de brinquedo na mesma ordem e demonstra forte incômodo com mudança de transição.',
    registradoPor: 'Coordenação Pedagógica',
    dataRegistro: '15/05/2026',
    status: 'Família Orientada',
    mensagemAcolhimentoSugerida: '*Olá, responsável por Enzo Gabriel! Esperamos que esteja bem. Observando o desenvolvimento de Enzo Gabriel em nossas vivências de convivência social e interações pedagógicas, notamos que ele tem demonstrado comportamentos de foco atípicos. Gostaríamos de convidar vocês para um café com nossa coordenação na próxima quarta-feira para conversarmos em parceria sobre como podemos potencializar o desenvolvimento infantil de forma integral. Contem conosco!*'
  }
];

export const ENCAMINHAMENTOS_INICIAIS: EncaminhamentoEspecialista[] = [
  {
    id: 'enc_1',
    alunoNome: 'Arthur Silva',
    turma: 'Maternal I',
    especialidade: 'Geral / Coordenação',
    dataEncaminhamento: '10/05/2026',
    motivoRelato: 'Dificuldade de socialização em grupo e choro persistente na hora da despedida com hipersensibilidade a ruídos.',
    statusRetorno: 'Em Acompanhamento Clínico',
    registradoPor: 'Coordenação Pedagógica',
    privacidade: 'Confidencial - Apenas Coordenação e Direção'
  },
  {
    id: 'enc_2',
    alunoNome: 'Beatriz Souza',
    turma: 'Maternal II',
    especialidade: 'Fonoaudiologia',
    dataEncaminhamento: '12/05/2026',
    motivoRelato: 'Atraso de fala expressiva identificado no diário pedagógico e conversado com a coordenação e a família.',
    statusRetorno: 'Aguardando Avaliação Externa',
    registradoPor: 'Profa Estela Pinto',
    privacidade: 'Confidencial - Apenas Coordenação e Direção'
  },
  {
    id: 'enc_3',
    alunoNome: 'Guilherme Santos',
    turma: 'Maternal II',
    especialidade: 'Terapia Ocupacional',
    dataEncaminhamento: '14/05/2026',
    motivoRelato: 'Hipersensibilidade tátil severa relatada no momento do banho e resistência a texturas de massinha e tinta guache.',
    statusRetorno: 'Devolutiva Recebida na Escola',
    registradoPor: 'Profa Estela Pinto',
    privacidade: 'Confidencial - Apenas Coordenação e Direção'
  }
];

export const OCORRENCIAS_MEDIAS_INICIAIS: OcorrenciaMediacao[] = [
  {
    id: 'oco_1',
    turma: 'Maternal II',
    alunosEnvolvidos: 'João e Lucas Santos',
    horario: '10:15',
    dataOcorrencia: '18/05/2026',
    descricaoFatos: 'Disputa física por um urso de pelúcia na transição para o lanche. Ocorreu uma mordida leve no braço de João.',
    medidasPedagogicas: 'Separados de forma neutra e acolhedora. Aplicado gelinho com carinho em João. Realizado círculo de sentimentos sobre a mordida e expressão verbal das vontades. Pais de ambos informados confidencialmente.',
    paisNotificadosConfidencialmente: true,
    registradoPor: 'Coordenação Pedagógica',
    resolvido: true
  }
];
