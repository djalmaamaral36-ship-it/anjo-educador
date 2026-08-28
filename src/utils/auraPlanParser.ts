export interface ParsedAuraActivity {
  id?: string;
  dia: string;
  dataStr?: string;
  dataIso?: string;
  tema?: string;
  turma?: string;
  horario: string;
  horarioFim?: string;
  titulo: string;
  descricao: string;
  tipo: 'alimentacao' | 'medicacao' | 'atividade_fisica' | 'banho' | 'sono' | 'humor';
  duracao?: number;
  objetivoBNCC?: string;
  materiais?: string[];
}

export interface AuraDaySummary {
  dia: string;
  dataStr: string;
  dataIso: string;
  tema?: string;
  count: number;
}

// Helper to get dates for current week relative to a reference date
export function getWeekDatesMap(refDate = new Date()): Record<string, { iso: string; br: string; label: string; dia: string }> {
  const current = new Date(refDate);
  const dayOfWeek = current.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  // Find Monday of the current week
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(current);
  monday.setDate(current.getDate() + mondayOffset);

  const daysList = [
    { key: 'segunda', name: 'Segunda-feira' },
    { key: 'terca', name: 'Terca-feira' },
    { key: 'quarta', name: 'Quarta-feira' },
    { key: 'quinta', name: 'Quinta-feira' },
    { key: 'sexta', name: 'Sexta-feira' },
    { key: 'sabado', name: 'Sabado' },
    { key: 'domingo', name: 'Domingo' },
  ];

  const map: Record<string, { iso: string; br: string; label: string; dia: string }> = {};

  daysList.forEach((item, idx) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + idx);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const iso = `${y}-${m}-${day}`;
    const br = `${day}/${m}/${y}`;
    map[item.name] = { iso, br, label: `${item.name} (${day}/${m})`, dia: item.name };
    map[item.key] = { iso, br, label: `${item.name} (${day}/${m})`, dia: item.name };
  });

  return map;
}

// Resolves day name and date into consistent Brazilian format (DD/MM/YYYY) and ISO format (YYYY-MM-DD)
export function resolveDayAndDate(rawDay?: string, rawDate?: string, refDate = new Date()): { dia: string; dataStr: string; dataIso: string } {
  const weekMap = getWeekDatesMap(refDate);
  const now = refDate;
  const currentYear = now.getFullYear();

  let dia = 'Segunda-feira';
  let dataStr = '';
  let dataIso = '';

  // 1. Check if rawDate is provided (e.g. 19/08 or 19/08/2026 or 2026-08-19)
  if (rawDate) {
    const cleanDate = rawDate.trim();
    const slashMatch = cleanDate.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
    if (slashMatch) {
      const d = slashMatch[1].padStart(2, '0');
      const m = slashMatch[2].padStart(2, '0');
      const y = slashMatch[3] ? (slashMatch[3].length === 2 ? `20${slashMatch[3]}` : slashMatch[3]) : String(currentYear);
      dataStr = `${d}/${m}/${y}`;
      dataIso = `${y}-${m}-${d}`;

      try {
        const dObj = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
        const dayIdx = dObj.getDay();
        const daysArr = ['Domingo', 'Segunda-feira', 'Terca-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sabado'];
        dia = daysArr[dayIdx];
      } catch (e) {}
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
      dataIso = cleanDate;
      const [y, m, d] = cleanDate.split('-');
      dataStr = `${d}/${m}/${y}`;
      try {
        const dObj = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
        const dayIdx = dObj.getDay();
        const daysArr = ['Domingo', 'Segunda-feira', 'Terca-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sabado'];
        dia = daysArr[dayIdx];
      } catch (e) {}
    }
  }

  // 2. If rawDay is given, normalize day name
  if (rawDay) {
    const lower = rawDay.toLowerCase();
    if (lower.includes('seg')) dia = 'Segunda-feira';
    else if (lower.includes('ter')) dia = 'Terca-feira';
    else if (lower.includes('qua')) dia = 'Quarta-feira';
    else if (lower.includes('qui')) dia = 'Quinta-feira';
    else if (lower.includes('sex')) dia = 'Sexta-feira';
    else if (lower.includes('sab') || lower.includes('sab')) dia = 'Sabado';
    else if (lower.includes('dom')) dia = 'Domingo';
  }

  // 3. If dataIso wasn't determined from rawDate, use the week map for this day
  if (!dataIso && weekMap[dia]) {
    dataIso = weekMap[dia].iso;
    dataStr = weekMap[dia].br;
  }

  if (!dataStr) dataStr = dia;

  return { dia, dataStr, dataIso };
}

// Categoriza inteligentemente para os tipos oficiais do Anjo Cuidador / Anjinho Escolar
export function inferTaskType(title: string, category: string, description: string): 'alimentacao' | 'medicacao' | 'atividade_fisica' | 'banho' | 'sono' | 'humor' {
  const text = `${title} ${category} ${description}`.toLowerCase();

  if (text.includes('medicamento') || text.includes('remedio') || text.includes('dosagem') || text.includes('gotas') || text.includes('pomada')) {
    return 'medicacao';
  }
  if (text.includes('lanche') || text.includes('almoco') || text.includes('almoco') || text.includes('cafe') || text.includes('cafe') || 
      text.includes('desjejum') || text.includes('colacao') || text.includes('colacao') || text.includes('mamadeira') || text.includes('fruta') || 
      text.includes('refeicao') || text.includes('refeicao') || text.includes('papinha') || text.includes('jantar') || text.includes('formula') || 
      text.includes('formula') || text.includes('alimentar') || text.includes('nutricao') || text.includes('nutricao')) {
    return 'alimentacao';
  }
  if (text.includes('sono') || text.includes('soneca') || text.includes('dormir') || text.includes('repouso') || text.includes('descanso') || 
      text.includes('colchonete') || text.includes('ninar') || text.includes('soninho')) {
    return 'sono';
  }
  if (text.includes('higiene') || text.includes('fralda') || text.includes('troca') || text.includes('banho') || text.includes('dente') || 
      text.includes('escovacao') || text.includes('banheiro') || text.includes('lavar mao') || text.includes('conforto')) {
    return 'banho';
  }
  return 'atividade_fisica';
}

// Normaliza strings de horario como "11:30", "11h30", "11h", "11:30h", "11h30min" para "11:30"
export function normalizeTimeString(raw: string): string {
  if (!raw) return '09:00';
  const clean = raw.trim().toLowerCase().replace(/[^\d:h]/g, '');
  const match = clean.match(/^(\d{1,2})(?:[:h](\d{2}))?/);
  if (match) {
    const h = match[1].padStart(2, '0');
    const m = match[2] ? match[2].padStart(2, '0') : '00';
    return `${h}:${m}`;
  }
  return '09:00';
}

// Realinha inteligentemente titulos e horarios quando ha conflito sem ou deslocamento (shift) no texto
export function realignPedagogicalActivity(
  rawTitle: string, 
  description: string, 
  time: string, 
  category?: string
): { title: string; tipo: 'alimentacao' | 'medicacao' | 'atividade_fisica' | 'banho' | 'sono' | 'humor' } {
  const desc = (description || '').trim();
  const descLower = desc.toLowerCase();
  const titleLower = (rawTitle || '').toLowerCase();
  const t = (time || '').trim();

  // 1. Deteccao de Nome Explicito entre Aspas na Descricao (aspas duplas, simples ou curvas)
  // Ex: plantio da 'Minha Primeira Horta', apresentar a "Caixa Magica das Texturas" -> titulo real e "Minha Primeira Horta   "
  const quotedMatch = desc.match(/(?:apresentar|utilizar|explorar|conduzir|oferecer|trabalhar|realizar|plantio|oficina|projeto|din)\s+(?:a|o|com\s+a|com\s+o|da|do|de)?\s*[""'']([^""'']{3,60})[""'']/i)
    || desc.match(/[""''](Minha Primeira Horta[^""'']*|Horta[^""'']*|Maos na Terra[^""'']*|Caixa\s+Magica[^""'']*|Pintura[^""'']*|Circuito[^""'']*|Massinha[^""'']*|Roda\s+de[^""'']*|Varal[^""'']*|Brincadeira[^""'']*|Oficina[^""'']*|Historia[^""'']*|Teatro[^""'']*|Tapete[^""'']*|Painel[^""'']*|Danca[^""'']*|Musica[^""'']*|Boliche[^""'']*|Culinaria[^""'']*|Quebra-cabeca[^""'']*|Jogos[^""'']*|Garrafa\s+Sensorial[^""'']*|Pique-[^""'']*|Mundo\s+das[^""'']*|Cesto\s+dos[^""'']*|Bicho[^""'']*|Bandinha[^""'']*|Fantoche[^""'']*|Arvore[^""'']*|Caixa\s+das\s+Sensacoes[^""'']*|Caixa\s+dos\s+Sentidos[^""'']*|Caixa\s+de\s+Texturas[^""'']*)/i);

  // Caso 1: Conflito flagrante - Titulo diz "Almoco", mas descricao e sobre "Horta / Natureza", "Caixa Magica", "exploracao sensorial", "texturas", "roda", etc.
  if (titleLower.includes('almoco') || titleLower.includes('almoco')) {
    // 1A. Horta / Natureza / Maos na terra / Sementes
    if (descLower.includes('horta') || descLower.includes('terra') || descLower.includes('semente') || descLower.includes('plantar') || descLower.includes('plantio') || descLower.includes('planta') || descLower.includes('natureza') || descLower.includes('jardim') || descLower.includes('maos na terra') || descLower.includes('vaso') || descLower.includes('adubo') || descLower.includes('regar') || descLower.includes('regador')) {
      if (quotedMatch) {
        return { title: formatAuraTaskTitle(quotedMatch[1], '', ''), tipo: 'atividade_fisica' };
      }
      return { title: 'Minha Primeira Horta   ', tipo: 'atividade_fisica' };
    }

    // 1B. Sensorial / Texturas / Artes / Movimento
    if (descLower.includes('caixa magica') || descLower.includes('textura') || descLower.includes('sensorial') || descLower.includes('tatil') || descLower.includes('tatil') || descLower.includes('roda') || descLower.includes('brincadeira') || descLower.includes('psicomotor') || descLower.includes('musica') || descLower.includes('musica') || descLower.includes('historia') || descLower.includes('historia') || descLower.includes('arte') || descLower.includes('pintura') || descLower.includes('massinha')) {
      if (quotedMatch) {
        return { title: formatAuraTaskTitle(quotedMatch[1], '', ''), tipo: 'atividade_fisica' };
      }
      if (descLower.includes('textura') || descLower.includes('tatil') || descLower.includes('tatil') || descLower.includes('sensorial')) {
        return { title: 'Caixa Magica das Texturas   ', tipo: 'atividade_fisica' };
      }
      return { title: 'Atividade Pedagogica & Sensorial   ', tipo: 'atividade_fisica' };
    }
  }

  // Caso 2: Conflito flagrante - Titulo diz "Higiene / Fralda / Escovacao", mas descricao fala de "refeicao do dia", "alimentacao", "almoco", etc.
  if (titleLower.includes('higiene') || titleLower.includes('fralda') || titleLower.includes('escovacao') || titleLower.includes('escovacao') || titleLower.includes('banho')) {
    if (descLower.includes('refeicao') || descLower.includes('refeicao') || descLower.includes('alimentacao') || descLower.includes('alimentacao') || descLower.includes('almoco') || descLower.includes('almoco') || descLower.includes('prato') || descLower.includes('mastigacao') || descLower.includes('mastigacao') || descLower.includes('degustar') || descLower.includes('legumes') || descLower.includes('nutricao') || descLower.includes('nutricao')) {
      return { title: 'Almoco   ', tipo: 'alimentacao' };
    }
  }

  // Caso 3: Conflito flagrante - Titulo diz "Soneca / Sono", mas descricao fala de "troca de fraldas", "higiene", "lavagem de maos", "escovacao", etc.
  if (titleLower.includes('sono') || titleLower.includes('soneca') || titleLower.includes('dormir') || titleLower.includes('descanso')) {
    if (descLower.includes('fralda') || descLower.includes('higiene') || descLower.includes('escovacao') || descLower.includes('escovacao') || descLower.includes('escovar') || descLower.includes('lavar as maos') || descLower.includes('troca')) {
      return { title: 'Higiene / Fraldas / Escovacao   ', tipo: 'banho' };
    }
  }

  // Caso 4: Conflito flagrante - Titulo diz "Lanche" ou "Parque", mas descricao fala de "soninho", "soneca", "colchonete", "ninar"
  if (titleLower.includes('lanche') || titleLower.includes('parque')) {
    if (descLower.includes('soninho') || descLower.includes('soneca') || descLower.includes('dormir') || descLower.includes('colchonete') || descLower.includes('ninar') || descLower.includes('repouso')) {
      return { title: 'Hora do Sono / Soneca   ', tipo: 'sono' };
    }
  }

  // Caso 4B: Se o titulo misturava "Lanche da Tarde / Mamadeira", separa para ser puramente "Lanche da Tarde & Frutinhas   "
  if ((titleLower.includes('lanche da tarde') || titleLower.includes('lanchinho da tarde') || titleLower.includes('lanche tarde') || titleLower.includes('lanchinho tarde')) && titleLower.includes('mamadeira')) {
    return { title: 'Lanche da Tarde & Frutinhas   ', tipo: 'alimentacao' };
  }

  // Caso 4C: Se o titulo dizia "Mamadeira do Bercario / Cafe da Manha", separa para "Lanche da Manha & Frutinhas   "
  if (titleLower.includes('mamadeira') && (titleLower.includes('cafe') || titleLower.includes('cafe') || titleLower.includes('lanche da manha') || titleLower.includes('lanchinho da manha'))) {
    return { title: 'Lanche da Manha & Frutinhas   ', tipo: 'alimentacao' };
  }

  // Caso 5: Se o horario for claramente 11:30 e a descricao falar de almoco/refeicao:
  if ((t === '11:30' || t === '11:00' || t === '12:00') && (descLower.includes('refeicao') || descLower.includes('refeicao') || descLower.includes('alimentacao') || descLower.includes('alimentacao') || descLower.includes('almoco') || descLower.includes('almoco') || descLower.includes('alimento'))) {
    return { title: 'Almoco   ', tipo: 'alimentacao' };
  }

  // Caso 6: Se o horario for 10:30 ou 10:00 e a descricao falar de atividade/textura/horta/natureza/caixa magica:
  if ((t === '10:30' || t === '10:00') && (descLower.includes('horta') || descLower.includes('terra') || descLower.includes('semente') || descLower.includes('plantar') || descLower.includes('plantio') || descLower.includes('natureza') || descLower.includes('jardim') || descLower.includes('maos na terra') || descLower.includes('textura') || descLower.includes('caixa magica') || descLower.includes('sensorial') || descLower.includes('tatil') || descLower.includes('tatil'))) {
    if (quotedMatch) {
      return { title: formatAuraTaskTitle(quotedMatch[1], '', ''), tipo: 'atividade_fisica' };
    }
    if (descLower.includes('horta') || descLower.includes('semente') || descLower.includes('terra') || descLower.includes('plantio') || descLower.includes('plantar') || descLower.includes('natureza')) {
      return { title: 'Minha Primeira Horta   ', tipo: 'atividade_fisica' };
    }
    return { title: 'Caixa Magica das Texturas   ', tipo: 'atividade_fisica' };
  }

  // Se tem nome cotado especifico na descricao e o titulo for generico
  if (quotedMatch && (titleLower.includes('atividade pedagogica') || titleLower.includes('atividade') || titleLower.includes('almoco') || titleLower.includes('almoco') || titleLower.length <= 4)) {
    return { title: formatAuraTaskTitle(quotedMatch[1], '', ''), tipo: inferTaskType(quotedMatch[1], category || '', desc) };
  }

  // Caso padrao: usa o titulo limpo formatado e tipo inferido
  const finalTitle = formatAuraTaskTitle(rawTitle, '', category || '');
  const tipo = inferTaskType(finalTitle, category || '', desc);
  return { title: finalTitle, tipo };
}

// Detecta se uma linha ou bloco e conversa/chatter da IA (introducao, sugestao, despedida)
export function isConversationalChatNoise(text: string): boolean {
  if (!text) return false;
  const clean = text.replace(/[#\*\_\|]/g, '').trim().toLowerCase();
  if (!clean) return false;

  // Frases classicas de conversa da Aura / IA
  if (/este planejamento est[aa] prontinho/i.test(clean)) return true;
  if (/sugest[aa]o para a professora/i.test(clean)) return true;
  if (/espero que este planejamento ajude/i.test(clean)) return true;
  if (/registrei para voc[ee]/i.test(clean)) return true;
  if (/se precisar de algo mais/i.test(clean)) return true;
  if (/sinta-se [aa] vontade para adaptar/i.test(clean)) return true;
  if (/assim voc[ee] fica livre para cuidar/i.test(clean)) return true;
  if (/aqui est[aa] o planejamento/i.test(clean)) return true;
  if (/como posso te ajudar/i.test(clean)) return true;
  if (/roteiro padr[aa]o que pode ser ajustado/i.test(clean)) return true;
  if (/din[aa]mica da turma e as necessidades/i.test(clean)) return true;
  if (/rotina da [a-z ]+ e de toda a turma/i.test(clean)) return true;
  if (/ideal para voc[ee] usar no sistema/i.test(clean)) return true;
  if (/no formato de linhas/i.test(clean)) return true;

  return false;
}

// Detecta linhas de ruido de status e interface quando o usuario copia a tela
export function isUiNoiseLine(text: string): boolean {
  if (!text) return false;
  const clean = text.replace(/[#\*\_\|]/g, '').trim().toLowerCase();
  if (!clean) return false;

  if (/^agenda de atividades da aula/i.test(clean)) return true;
  if (/^\d+\s*atividade\(s\)\s*programada\(s\)/i.test(clean)) return true;
  if (/^(?:  |   |  )?\s*(?:repetidas|limpar atividades|importar aura|nova atividade)$/i.test(clean)) return true;
  if (/^observa[cc][oo]es(?:\s+da\s+atividade)?$/i.test(clean)) return true;
  if (/^ex:\s*realizou\s+a\s+atividade/i.test(clean)) return true;
  if (/^(?: \s*)?recusou$/i.test(clean)) return true;
  if (/^(?: \s*| \s*)?entregue$/i.test(clean)) return true;
  if (/^(?: \s*)?pendente$/i.test(clean)) return true;

  return false;
}

// Deduplica e limpa excesso de emojis repetidos consecutivos
export function cleanRepeatedEmojis(str: string): string {
  if (!str) return '';
  // Substitui multiplos emojis repetidos consecutivos (ex:          ->   )
  let clean = str.replace(/([\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}])(?:\s*\1)+/gu, '$1');
  // Se ainda houver 3 ou mais emojis diferentes colados no final, mantem no maximo 1 ou 2
  clean = clean.replace(/((?:[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*){3,})$/gu, (match) => {
    const emojis = match.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu);
    return emojis && emojis.length > 0 ? emojis[0] : '';
  });
  return clean.trim();
}

// Formata o titulo no padrao manual bonito do Anjinho Escolar com emojis contextuais
export function formatAuraTaskTitle(rawTitle: string, subTitle: string, category: string): string {
  let preferred = (subTitle && subTitle.length > 2 && !/^(horario|horario|atividade|titulo|titulo|nome)$/i.test(subTitle.trim())) 
    ? subTitle 
    : rawTitle;
  
  // Limpa asteriscos, markdown, pipes e pontuacao extra
  let clean = (preferred || '')
    .replace(/[#\*\|_]/g, '')
    .replace(/^[--- *+]*\s*/, '')
    .replace(/^(?:[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*)?\d{1,2}(?:[:h]\d{2}|h\b)\s*[---:]\s*/u, '')
    .replace(/^(?:Titulo sugerido|Titulo|Nome da Atividade|Atividade|Atividade Guiada|Horario|Horario|Atividade Padronizada)\s*:\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Se o titulo contiver um separador de descricao (ex: "Titulo - Descricao longa..."), separa e pega apenas o titulo
  if (clean.includes(' - ') || clean.includes(' - ') || clean.includes(' - ')) {
    const parts = clean.split(/\s+[---]\s+/);
    if (parts[0] && parts[0].trim().length >= 3) {
      clean = parts[0].trim();
    }
  }

  // Deduplica emojis repetidos que possam ter vindo na copia
  clean = cleanRepeatedEmojis(clean);

  // Se o titulo ficar vazio ou for apenas label generica ("Horario", "Atividade", etc.)
  if (!clean || /^(horario|horario|atividade|titulo|titulo|nome|pendente|horario:)$/i.test(clean)) {
    if (category && !/^(horario|horario|atividade)$/i.test(category.trim())) {
      clean = category.replace(/^(?:Categoria|BNCC|Campo)\s*:\s*/i, '').trim();
    } else {
      clean = 'Atividade Pedagogica';
    }
  }

  // Se ja tiver emoji unicode, apenas devolve limpo
  if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(clean)) {
    return clean;
  }

  const lower = clean.toLowerCase();

  // Mapeamentos especificos para titulos elegantes
  if (lower.includes('horta') || lower.includes('terra') || lower.includes('semente') || lower.includes('plantio') || lower.includes('plantar') || lower.includes('natureza') || lower.includes('jardim') || lower.includes('maos na terra') || lower.includes('planta')) {
    return `${clean}   `;
  }
  if (lower.includes('entrada') || lower.includes('acolhida') || lower.includes('acolhimento') || lower.includes('recepcao') || lower.includes('chegada')) {
    return `${clean}   `;
  }
  if (lower.includes('espelho') || lower.includes('identidade') || lower.includes('olhar')) {
    return `${clean}   `;
  }
  if (lower.includes('mamadeira') || lower.includes('formula') || lower.includes('formula')) {
    return `${clean}   `;
  }
  if (lower.includes('desjejum') || lower.includes('cafe') || lower.includes('cafe') || lower.includes('lanchinho da manha') || lower.includes('lanche da manha')) {
    return `${clean}   `;
  }
  if (lower.includes('almoco') || lower.includes('almoco') || lower.includes('papinha') || lower.includes('almocinho')) {
    return `${clean}   `;
  }
  if (lower.includes('jantar') || lower.includes('jantinha')) {
    return `${clean}   `;
  }
  if (lower.includes('lanche') || lower.includes('fruta') || lower.includes('colacao') || lower.includes('colacao') || lower.includes('frutinha')) {
    return `${clean}   `;
  }
  if (lower.includes('fralda') || lower.includes('higiene') || lower.includes('banheiro') || lower.includes('troca') || lower.includes('desfralde')) {
    return `${clean}   `;
  }
  if (lower.includes('banho de sol') || lower.includes('sol')) {
    return `${clean}   `;
  }
  if (lower.includes('banho') || lower.includes('chuveiro') || lower.includes('lavatorio')) {
    return `${clean}   `;
  }
  if (lower.includes('sono') || lower.includes('soneca') || lower.includes('soninho') || lower.includes('repouso') || lower.includes('ninar') || lower.includes('dormir')) {
    return `${clean}   `;
  }
  if (lower.includes('sensac') || lower.includes('sensacoes') || lower.includes('sensorial') || lower.includes('bau') || lower.includes('bau') || lower.includes('familia') || lower.includes('arte') || lower.includes('pintura') || lower.includes('tinta') || lower.includes('massinha') || lower.includes('modelagem')) {
    return `${clean}   `;
  }
  if (lower.includes('chocalho') || lower.includes('musica') || lower.includes('musica') || lower.includes('som') || lower.includes('sons') || lower.includes('canto') || lower.includes('cantiga') || lower.includes('roda de musica')) {
    return `${clean}   `;
  }
  if (lower.includes('historia') || lower.includes('historia') || lower.includes('conto') || lower.includes('leitura') || lower.includes('livro') || lower.includes('fantoche') || lower.includes('teatro')) {
    return `${clean}   `;
  }
  if (lower.includes('parque') || lower.includes('parquinho') || lower.includes('ar livre') || lower.includes('livre') || lower.includes('brincadeira') || lower.includes('brinquedo')) {
    return `${clean}   `;
  }
  if (lower.includes('saida') || lower.includes('saida') || lower.includes('despedida') || lower.includes('mochila')) {
    return `${clean}   `;
  }
  if (lower.includes('psicomotor') || lower.includes('movimento') || lower.includes('circuito') || lower.includes('engatinhar') || lower.includes('corpo') || lower.includes('danca') || lower.includes('obstaculo') || lower.includes('ginastica')) {
    return `${clean}   `;
  }
  if (lower.includes('agua') || lower.includes('agua') || lower.includes('bolha') || lower.includes('sabao') || lower.includes('bacia')) {
    return `${clean}   `;
  }

  return `${clean}   `;
}

// Detecta se uma linha representa um cabecalho de Dia da Semana ou Data
function detectDayHeader(line: string): { dia?: string; dataStr?: string; dataIso?: string; tema?: string; turma?: string } | null {
  const clean = line.replace(/[#\*\_]/g, '').trim();
  if (!clean || clean.length < 3) return null;

  // Se for apenas um horario de atividade (ex: 08:00 - 08:30), nao e cabecalho de dia
  if (/^\d{1,2}:\d{2}/.test(clean) && !/(segunda|terca|terca|quarta|quinta|sexta|sabado|sabado|domingo)/i.test(clean)) {
    return null;
  }

  const dayRegex = /\b(Segunda|Terca|Terca|Quarta|Quinta|Sexta|Sabado|Sabado|Domingo)(?:-feira)?\b/i;
  const dateSlashRegex = /\b(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\b/;
  const dateIsoRegex = /\b(\d{4}-\d{2}-\d{2})\b/;
  const temaRegex = /(?:Tema(?:\s+do\s+Dia)?|Subtema|Eixo|Projeto|Planejamento\s+Di[aa]rio)\s*[---:]\s*([^\n\(\)]+)/i;
  const turmaRegex = /Turma\s*:\s*([^\n\(\)]+)/i;

  const dayMatch = clean.match(dayRegex);
  const dateMatch = clean.match(dateSlashRegex) || clean.match(dateIsoRegex);
  const temaMatch = clean.match(temaRegex);
  const turmaMatch = clean.match(turmaRegex);

  // Considera cabecalho se encontrou dia da semana, ou data explicita, ou "Rotina Diaria - ..."
  if (dayMatch || dateMatch || /Rotina\s+Di[aa]ria/i.test(clean) || /Planejamento\s+(?:Semanal|Di[aa]rio)/i.test(clean)) {
    const rawDay = dayMatch ? dayMatch[1] : undefined;
    const rawDate = dateMatch ? dateMatch[1] : undefined;
    const resolved = resolveDayAndDate(rawDay, rawDate);

    let tema = temaMatch ? temaMatch[1].trim() : undefined;
    if (!tema && clean.includes('Tema:')) {
      const parts = clean.split(/Tema:/i);
      if (parts[1]) tema = parts[1].split(/[---\(]/)[0].trim();
    }

    return {
      dia: resolved.dia,
      dataStr: resolved.dataStr,
      dataIso: resolved.dataIso,
      tema,
      turma: turmaMatch ? turmaMatch[1].trim() : undefined
    };
  }

  return null;
}

// Parser completo de alta precisao que entende Blocos Estruturados Markdown da Aura, Planejamentos Semanais, Tabelas e Listas
export function parseAuraRawPlan(text: string): {
  metadata: { 
    dia: string; 
    dataStr: string; 
    dataIso?: string; 
    tema: string; 
    turma: string;
    daysSummary?: AuraDaySummary[];
  };
  activities: ParsedAuraActivity[];
} {
  const rawText = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = rawText.split('\n');

  let defaultDia = 'Segunda-feira';
  let defaultDataStr = '';
  let defaultDataIso = '';
  let defaultTema = '';
  let defaultTurma = 'Toda a Sala';

  // 1. Extracao preliminar de metadados globais (e data de inicio se mencionada no texto introdutorio)
  let baseReferenceDate: Date | undefined = undefined;
  const startDateMatch = rawText.match(/(?:comecando|iniciando|a\s+partir\s+de|in[ii]cio\s+em|semana\s+de)\s*(?:em\s*)?(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/i);
  if (startDateMatch) {
    const rawMatchDate = startDateMatch[1];
    const slashParts = rawMatchDate.split('/');
    const d = parseInt(slashParts[0], 10);
    const m = parseInt(slashParts[1], 10);
    const y = slashParts[2] ? (slashParts[2].length === 2 ? parseInt(`20${slashParts[2]}`, 10) : parseInt(slashParts[2], 10)) : new Date().getFullYear();
    try {
      baseReferenceDate = new Date(y, m - 1, d);
      defaultDataStr = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
      defaultDataIso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    } catch (e) {}
  }

  for (const line of lines) {
    const cleanLine = line.replace(/[#\*]/g, '').trim();
    const dayHeader = detectDayHeader(cleanLine);
    if (dayHeader) {
      if (!defaultDataStr && dayHeader.dataStr) {
        defaultDia = dayHeader.dia || defaultDia;
        defaultDataStr = dayHeader.dataStr;
        defaultDataIso = dayHeader.dataIso || defaultDataIso;
      }
      if (!defaultTema && dayHeader.tema) defaultTema = dayHeader.tema;
      if (!defaultTurma && dayHeader.turma) defaultTurma = dayHeader.turma;
    }
  }

  const initialResolved = resolveDayAndDate(defaultDia, defaultDataStr, baseReferenceDate);
  defaultDia = initialResolved.dia;
  defaultDataStr = initialResolved.dataStr;
  defaultDataIso = initialResolved.dataIso;

  const activities: ParsedAuraActivity[] = [];

  // 2. PARSER ROBUSTO LINHA A LINHA (Zero regex lock, Instant < 2ms)
  let currentDia = defaultDia;
  let currentDataStr = defaultDataStr;
  let currentDataIso = defaultDataIso;
  let currentTema = defaultTema;

  interface RawActivityBlock {
    dia: string;
    dataStr: string;
    dataIso: string;
    tema: string;
    headerTitle?: string;
    lines: string[];
  }

  const blocks: RawActivityBlock[] = [];
  let currentBlock: RawActivityBlock | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) {
      if (currentBlock && currentBlock.lines.length > 0) {
        currentBlock.lines.push('');
      }
      continue;
    }

    // A. Verifica se a linha e cabecalho de dia (ex: ## Segunda-feira, ## 18/08)
    const dh = detectDayHeader(trimmed);
    if (dh && (dh.dia || dh.dataStr)) {
      if (dh.dia) currentDia = dh.dia;
      if (dh.dataStr) currentDataStr = dh.dataStr;
      if (dh.dataIso) currentDataIso = dh.dataIso;
      if (dh.tema) currentTema = dh.tema;

      const resD = resolveDayAndDate(currentDia, currentDataStr, baseReferenceDate);
      currentDia = resD.dia;
      currentDataStr = resD.dataStr;
      currentDataIso = resD.dataIso;
      continue;
    }

    // Linha divisoria classica de Markdown (ex: ---, ***, ===, ___)
    const isDividerLine = /^[-=_*]{3,}$/.test(trimmed);
    if (isDividerLine) {
      if (currentBlock && currentBlock.lines.length > 0) {
        blocks.push(currentBlock);
        currentBlock = null;
      }
      continue;
    }

    // B. Verifica se a linha inicia uma nova atividade (Altamente flexivel para qualquer formato de IA/Aura)
    // 1. Horario puro (ex: "10:30", "10h30", "10:30 as 11:30", "[T] 10:30", "   08:00")
    const isPlainTimeLine = /^(?:[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*)?\d{1,2}(?:[:h]\d{2}|h\b)(?:\s*(?:[---]|as|as|ate|ate|a)\s*\d{1,2}(?:[:h]\d{2}|h\b))?$/u.test(trimmed);
    
    // 2. Horario com titulo na mesma linha (ex: "08:00 - Acolhida", "   08:30: Cafe", "10h - Pintura")
    const isTimeWithDashOrColon = /^(?:[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*)?\d{1,2}(?:[:h]\d{2}|h\b)\s*[---:]\s*(.+)$/u.test(trimmed);
    
    // 3. Cabecalhos Markdown (ex: "## Acolhida", "### 08:00 - Cafe", "#### Atividade 1")
    const isMdHeader = /^#{2,5}\s+(?!\s*(?:Planejamento|Tema|Eixo|Projeto|Turma|Rotina|Semana)\b)/i.test(trimmed);
    
    // 4. Numeracao ou Marcadores de Atividade (ex: "1. Acolhida", "**1. Acolhida**", "* 1. ...", "1 - ...", "1) ...", "Atividade 1:")
    const isNumberedOrBulletActivity = /^(?:[--- *+]\s*)?(?:\*\*)?(?:Atividade\s+\d+[\.:\---\s]*|\d+[\.):\---]\s+)(?:[A-ZA-U\u{1F300}-\u{1F9FF}\d]|\*\*)/iu.test(trimmed);
    
    // 5. Palavra-chave explicita de inicio de atividade (ex: "**Atividade 1:**", "Nome da Atividade:", "Titulo:")
    const isActivityKeywordLine = /^(?:[--- *+]\s*)?(?:\*\*)?(?:Atividade\s+\d+|Nome\s*da\s*Atividade|T[ii]tulo\s*(?:da\s*Atividade|sugerido)?|Momento\s*\d*|Oficina\s*\d*|Roteiro\s*\d*)\s*[:\---]/i.test(trimmed);
    
    // 6. Rotulo explicito de horario (ex: "Horario: 08:00", "* **Horario:** 08h30")
    const isExplicitTimeLine = /^(?:[--- *+]\s*)?(?:\*\*)?(?:Hor[aa]rio|Horario|Hora)\s*:\s*(?:\*\*)?\s*\d{1,2}(?:[:h]\d{2}|h\b)/i.test(trimmed);
    
    // 7. Marcador com horario (ex: "- 08:00", "* 09:30", "  11:30")
    const isBulletTimeLine = /^[--- *+]\s*(?:[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*)?\d{1,2}(?:[:h]\d{2}|h\b)/u.test(trimmed);

    const hasExplicitTimeAlready = currentBlock && currentBlock.lines.some(l => /(?:Hor[aa]rio|Horario)\s*:\s*\**\s*\d{1,2}[:h]|\b\d{1,2}[:h]\d{2}\b/i.test(l));
    const blockHasEnoughLines = currentBlock && currentBlock.lines.filter(l => l.trim().length > 0).length >= 2;

    if (
      isPlainTimeLine || 
      isTimeWithDashOrColon || 
      isMdHeader || 
      isNumberedOrBulletActivity || 
      isActivityKeywordLine || 
      (isExplicitTimeLine && (hasExplicitTimeAlready || blockHasEnoughLines)) || 
      (isBulletTimeLine && (hasExplicitTimeAlready || blockHasEnoughLines))
    ) {
      if (currentBlock && currentBlock.lines.length > 0) {
        blocks.push(currentBlock);
      }

      let headerTitle = '';
      const cleanLine = trimmed.replace(/[#\*_\|]/g, '').trim();
      if (!/^\d{1,2}[:h]\d{2}/.test(cleanLine) && !/^(?:horario|horario|atividade|rotina|data|tema)\s*:/i.test(cleanLine)) {
        headerTitle = cleanLine.replace(/^\d+[\.\)]\s*/, '').replace(/^(?:Atividade\s*\d*|Titulo)\s*[---:]\s*/i, '').trim();
      } else if (cleanLine.includes('|')) {
        const parts = cleanLine.split('|').map(p => p.trim()).filter(Boolean);
        if (parts.length > 1) {
          headerTitle = parts.find(p => !/\d{1,2}[:h]\d{2}/.test(p) && !/^(?:horario|horario|atividade)$/i.test(p)) || '';
        }
      } else if (isTimeWithDashOrColon) {
        const afterTime = cleanLine
          .replace(/^[--- *+]*\s*/, '')
          .replace(/^(?:[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*)?\d{1,2}(?:[:h]\d{2}|h\b)\s*[---:]\s*/u, '')
          .trim();
        if (afterTime && !/^(?:horario|horario|atividade)$/i.test(afterTime)) {
          // Se contiver separador de descricao na mesma linha (ex: "Titulo - Descricao"), extrai apenas o titulo no headerTitle
          if (afterTime.includes(' - ') || afterTime.includes(' - ') || afterTime.includes(' - ')) {
            const splitted = afterTime.split(/\s+[---]\s+/);
            headerTitle = splitted[0].trim();
          } else {
            headerTitle = afterTime;
          }
        }
      }

      currentBlock = {
        dia: currentDia,
        dataStr: currentDataStr,
        dataIso: currentDataIso,
        tema: currentTema,
        headerTitle,
        lines: [trimmed]
      };
      continue;
    }

    if (!currentBlock) {
      if (isUiNoiseLine(trimmed) || isConversationalChatNoise(trimmed)) {
        continue;
      }
      currentBlock = {
        dia: currentDia,
        dataStr: currentDataStr,
        dataIso: currentDataIso,
        tema: currentTema,
        lines: [trimmed]
      };
    } else {
      currentBlock.lines.push(trimmed);
    }
  }

  if (currentBlock && currentBlock.lines.length > 0) {
    blocks.push(currentBlock);
  }

  const isNoiseLine = (t: string) => {
    const clean = t.replace(/[#\*\_]/g, '').trim();
    if (isUiNoiseLine(clean)) return true;
    if (/^(?: \s*)?(?:Pendente|Em andamento|Conclu[ii]do|Entregue|Cancelado)$/i.test(clean)) return true;
    if (/^(?: \s*)?Recusou$/i.test(clean)) return true;
    if (/^(?: \s*| \s*)?(?:Entregue|Conclu[ii]do|Realizado)$/i.test(clean)) return true;
    if (/^Observa[cc][oo]es(?:\s+da\s+Atividade)?$/i.test(clean)) return true;
    if (/^Ex:\s*Realizou\s+a\s+atividade/i.test(clean)) return true;
    return false;
  };

  // Processa cada bloco extraido
  for (const block of blocks) {
    let explicitTitle = '';
    let category = '';
    let bnccObjective = '';
    let materials: string[] = [];
    let startTime = '';
    let endTime: string | undefined = undefined;
    let isCapturingDesc = false;
    const descLines: string[] = [];
    const plainCandidateTitles: string[] = [];

    // Se o bloco contiver qualquer linha de conversa da IA ou ruido de sistema, ignora o bloco inteiro
    if (block.lines.some(l => isConversationalChatNoise(l))) {
      continue;
    }

    for (const bLine of block.lines) {
      const trimmed = bLine.trim();
      if (!trimmed) continue;

      // Pula linhas de ruido copiadas da interface de status ou conversa
      if (isNoiseLine(trimmed) || isConversationalChatNoise(trimmed)) {
        continue;
      }

      // Procura por campos de experiencia da BNCC entre parenteses em qualquer linha do bloco
      if (!bnccObjective) {
        const parenBnccMatch = trimmed.match(/\((?:Campo(?:\s+de\s+Experi[ee]ncia)?\s*:\s*)?([^\)]*(?:O Eu,\s*o Outro|Corpo,\s*Gestos|Tracos,\s*Sons|Escuta,\s*Fala|Espacos,\s*Tempos|BNCC|EI\d{2}[A-Z]{2}\d{2})[^\)]*)\)/i)
          || trimmed.match(/\(([^\)]*(?:O Eu, o Outro e o Nos|Corpo, Gestos e Movimentos|Tracos, Sons, Cores e Formas|Escuta, Fala, Pensamento e Imaginacao|Espacos, Tempos, Quantidades, Relacoes e Transformacoes)[^\)]*)\)/i);
        if (parenBnccMatch) {
          bnccObjective = parenBnccMatch[1].trim();
        }
      }

      // Horario dentro do bloco
      const timeLineMatch = trimmed.match(/(?:Hor[aa]rio|Horario|Hora)\s*:\s*\**\s*(\d{1,2}(?:[:h]\d{2}|h\b))\s*(?:(?:[---]|as|as|ate|ate|a)\s*(\d{1,2}(?:[:h]\d{2}|h\b)))?/i)
        || trimmed.match(/\b(\d{1,2}(?:[:h]\d{2}|h\b))\s*(?:(?:[---]|as|as|ate|ate|a)\s*(\d{1,2}(?:[:h]\d{2}|h\b)))/i)
        || trimmed.match(/\b(\d{1,2}[:h]\d{2})\b/i);

      if (timeLineMatch && !startTime) {
        startTime = normalizeTimeString(timeLineMatch[1]);
        if (timeLineMatch[2]) {
          endTime = normalizeTimeString(timeLineMatch[2]);
        }
      }

      // Verifica se e uma linha compacta com horario + titulo + descricao (ex: "- 10:00: Parque / Patio: Banho de Sol - Levar os bebes...")
      const singleLineCompact = trimmed.replace(/^[--- *+]*\s*/, '').replace(/[#\*_]/g, '').trim();
      const compactTimeMatch = singleLineCompact.match(/^(?:[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*)?(\d{1,2}(?:[:h]\d{2}|h\b))\s*[---:]\s*(.+)$/u);
      
      if (compactTimeMatch) {
        if (!startTime) {
          startTime = normalizeTimeString(compactTimeMatch[1]);
        }
        const afterTime = compactTimeMatch[2].trim();
        
        // Verifica se tem separador " - " ou " - " separando o Titulo da Descricao
        if (afterTime.includes(' - ') || afterTime.includes(' - ') || afterTime.includes(' - ')) {
          const parts = afterTime.split(/\s+[---]\s+/);
          if (parts.length >= 2) {
            const rawCandTitle = parts[0].trim();
            const rawCandDesc = parts.slice(1).join(' - ').trim();
            if (rawCandTitle && !explicitTitle) {
              explicitTitle = rawCandTitle;
            }
            if (rawCandDesc) {
              descLines.push(rawCandDesc);
            }
            continue;
          }
        } else if (afterTime.includes(': ') && afterTime.length > 50) {
          // Ex: "Parque / Patio: Banho de Sol com Exploradores: Levar os bebes para um ambiente externo..."
          const colonParts = afterTime.split(/:\s+/);
          if (colonParts.length >= 2) {
            const firstPart = colonParts[0].trim();
            const secondPart = colonParts.slice(1).join(': ').trim();
            if (firstPart.length <= 45 && !explicitTitle) {
              explicitTitle = firstPart;
              descLines.push(secondPart);
              continue;
            }
          }
        }
      }

      const titleMatch = trimmed.match(/^\*?\s*\**\s*(?:T[ii]tulo\s*sugerido|T[ii]tulo|Nome\s*da\s*Atividade|Atividade\s*Padronizada|Atividade)\s*:\s*\**\s*(.+)$/i);
      if (titleMatch) {
        isCapturingDesc = false;
        const candidate = titleMatch[1].replace(/[\*\_]/g, '').trim();
        if (!/^(horario|horario|atividade|titulo|titulo|nome)$/i.test(candidate)) {
          explicitTitle = candidate;
        }
        continue;
      }

      const catMatch = trimmed.match(/^\*?\s*\**\s*(?:Categoria\s*sugerida|Categoria|Alcance|Turma)\s*:\s*\**\s*(.+)$/i);
      if (catMatch) {
        isCapturingDesc = false;
        category = catMatch[1].replace(/[\*\_]/g, '').trim();
        continue;
      }

      const bnccMatch = trimmed.match(/^\*?\s*\**\s*(?:Campo\s*de\s*Experi[ee]ncia|Objetivo\s*Pedag[oo]gico|Objetivo|BNCC|Habilidade|Campo\s*BNCC|  \s*Campo\s*BNCC)\s*:\s*\**\s*(.+)$/i);
      if (bnccMatch) {
        isCapturingDesc = false;
        bnccObjective = bnccMatch[1].replace(/[\*\_]/g, '').trim();
        continue;
      }

      const matMatch = trimmed.match(/^\*?\s*\**\s*(?:Materiais(?:\s*Necess[aa]rios)?|  \s*Materiais)\s*:\s*\**\s*(.+)$/i);
      if (matMatch) {
        isCapturingDesc = false;
        materials = matMatch[1].replace(/[\*\_]/g, '').split(/[,;]/).map(m => m.trim()).filter(Boolean);
        continue;
      }

      const descMatch = trimmed.match(/^\*?\s*\**\s*(?:Descri[cc][aa]o(?:\s*Detalhada|\s*Pedag[oo]gica|\s*Completa|\s*Geral)?|Como\s*Conduzir|Passo\s*a\s*Passo|Desenvolvimento|Orienta[cc][oo]es(?:\s*Pedag[oo]gicas)?|Metodologia|Procedimentos|Instru[cc][oo]es|Objetivo\s*e\s*Descri[cc][aa]o)\s*:\s*\**\s*(.*)$/i);
      if (descMatch) {
        isCapturingDesc = true;
        const remainingOnSameLine = descMatch[1].replace(/[\*\_]/g, '').trim();
        if (remainingOnSameLine) {
          descLines.push(remainingOnSameLine);
        }
        continue;
      }

      if (isCapturingDesc) {
        if (/^\*?\s*\**\s*(?:T[ii]tulo|Categoria|BNCC|Campo|Materiais|Turma|Hor[aa]rio|Atividade|  |  )\s*:\s*\**/i.test(trimmed)) {
          isCapturingDesc = false;
          continue;
        }

        const cleanDescLine = trimmed
          .replace(/^\s*[\*\-\ \d\.\)]\s*/, '')
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .trim();
        if (cleanDescLine) {
          descLines.push(cleanDescLine);
        }
        continue;
      }

      // Linha solta que nao tem label: verifica se e um titulo curto ou uma descricao pedagogica
      const cleanSimple = trimmed.replace(/[#\*_\|]/g, '').trim();
      if (!/^\d{1,2}[:h]\d{2}/.test(cleanSimple) && !isNoiseLine(cleanSimple)) {
        if (cleanSimple.length <= 60 && !/(?:promover|estimular|apresentar|incentivar|desenvolver|momento\s+da\s+principal|realizar)\b/i.test(cleanSimple)) {
          plainCandidateTitles.push(cleanSimple);
        } else {
          descLines.push(cleanSimple);
        }
      }
    }

    if (!explicitTitle && plainCandidateTitles.length > 0) {
      explicitTitle = plainCandidateTitles[0];
    }

    // Se nao capturou descricao com o rotulo "Descricao:", usa o texto restante do bloco
    let detailedDesc = '';
    if (descLines.length > 0) {
      detailedDesc = descLines.join('\n');
    } else {
      const leftover = block.lines
        .filter(l => !isNoiseLine(l))
        .filter(l => !/^\*?\s*\**\s*(?:T[ii]tulo|Categoria|Alcance|Turma|Tema|Data|Campo|BNCC|Objetivo|Materiais|Hor[aa]rio|Atividade|  |  )\s*:/i.test(l.trim()))
        .filter(l => !/^#{2,4}\s+/.test(l.trim()))
        .filter(l => !/^\d{1,2}[:h]\d{2}/.test(l.trim()))
        .map(l => l.replace(/^\s*[\*\-\ ]\s*/, '').replace(/\*\*(.*?)\*\*/g, '$1').replace(/[\*\_]/g, '').trim())
        .filter(Boolean)
        .join('\n');
      detailedDesc = leftover;
    }

    let rawTitle = explicitTitle || block.headerTitle || '';
    rawTitle = cleanRepeatedEmojis(rawTitle);

    // Se o bloco nao tem horario e nao tem titulo explicito, ou e conversa da IA, ignora completamente
    if (!startTime && (!rawTitle || /^(?:Atividade Pedagogica|Atividade|Horario|Horario)$/i.test(rawTitle))) {
      continue;
    }

    if (isConversationalChatNoise(rawTitle) || isConversationalChatNoise(detailedDesc)) {
      continue;
    }

    if (!startTime) {
      // Se nao ha horario no bloco, e nao e uma atividade pedagogica legitima com titulo reconhecido, pula
      if (rawTitle.length < 3) {
        continue;
      }
      startTime = '09:00';
    }

    if (!rawTitle) {
      rawTitle = 'Atividade Pedagogica';
    }

    let finalDesc = detailedDesc;
    if (!finalDesc || finalDesc.trim().length === 0) {
      finalDesc = `Atividade de rotina: ${rawTitle}.`;
    } else {
      // Limpa prefixos de horario ou de titulo duplicados na descricao
      finalDesc = finalDesc
        .replace(/^[--- *+]*\s*\d{1,2}[:h]\d{2}\s*[---:]\s*/i, '')
        .trim();

      // Se a descricao comecar com o mesmo texto do titulo seguido de hifen/dois-pontos, remove a duplicacao
      const cleanRawTitle = rawTitle.replace(/[#\*_\|]/g, '').trim();
      if (cleanRawTitle && finalDesc.toLowerCase().startsWith(cleanRawTitle.toLowerCase())) {
        finalDesc = finalDesc.slice(cleanRawTitle.length).replace(/^[\s\---:]+/, '').trim();
      }
      if (!finalDesc) {
        finalDesc = `Atividade de rotina: ${rawTitle}.`;
      }
    }

    // Se a descricao termina com os campos da BNCC entre parenteses, extrai como bnccObjective e limpa a descricao
    if (!bnccObjective) {
      const inlineBnccMatch = finalDesc.match(/\((?:Campo(?:\s+de\s+Experi[ee]ncia)?\s*:\s*)?([^\)]*(?:O Eu,\s*o Outro|Corpo,\s*Gestos|Tracos,\s*Sons|Escuta,\s*Fala|Espacos,\s*Tempos|BNCC|EI\d{2}[A-Z]{2}\d{2})[^\)]*)\)\s*$/i)
        || finalDesc.match(/\(([^\)]*(?:O Eu, o Outro e o Nos|Corpo, Gestos e Movimentos|Tracos, Sons, Cores e Formas|Escuta, Fala, Pensamento e Imaginacao|Espacos, Tempos, Quantidades, Relacoes e Transformacoes)[^\)]*)\)/i);
      if (inlineBnccMatch) {
        bnccObjective = inlineBnccMatch[1].trim();
        finalDesc = finalDesc.replace(inlineBnccMatch[0], '').trim();
      }
    }

    finalDesc = cleanRepeatedEmojis(finalDesc);

    const { title: finalTitle, tipo: taskType } = realignPedagogicalActivity(rawTitle, finalDesc, startTime, category);

    let duration = 30;
    if (startTime && endTime) {
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      const diff = (eh * 60 + em) - (sh * 60 + sm);
      if (diff > 0 && diff <= 300) {
        duration = diff;
      }
    }

    activities.push({
      id: `act-${activities.length + 1}`,
      dia: block.dia,
      dataStr: block.dataStr,
      dataIso: block.dataIso,
      tema: block.tema,
      turma: defaultTurma,
      horario: startTime,
      horarioFim: endTime,
      titulo: cleanRepeatedEmojis(finalTitle),
      descricao: finalDesc,
      tipo: taskType,
      duracao: duration,
      objetivoBNCC: bnccObjective || category || 'Desenvolvimento Ludico e BNCC',
      materiais: materials
    });
  }

  if (activities.length > 0) {
    const summaryMap = new Map<string, AuraDaySummary>();
    activities.forEach(act => {
      const key = `${act.dia}_${act.dataStr || ''}`;
      if (!summaryMap.has(key)) {
        summaryMap.set(key, {
          dia: act.dia,
          dataStr: act.dataStr || act.dia,
          dataIso: act.dataIso || '',
          tema: act.tema,
          count: 0
        });
      }
      const item = summaryMap.get(key)!;
      item.count++;
    });

    return {
      metadata: {
        dia: activities[0]?.dia || defaultDia,
        dataStr: activities[0]?.dataStr || defaultDataStr,
        dataIso: activities[0]?.dataIso || defaultDataIso,
        tema: defaultTema,
        turma: defaultTurma,
        daysSummary: Array.from(summaryMap.values())
      },
      activities
    };
  }

  // 3. FALLBACK: TABELAS MARKDOWN, TSV OU LISTAS
  let activeDia = defaultDia;
  let activeDataStr = defaultDataStr;
  let activeDataIso = defaultDataIso;
  let activeTema = defaultTema;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Verifica se a linha e um novo cabecalho de dia
    const dh = detectDayHeader(line);
    if (dh) {
      if (dh.dia) activeDia = dh.dia;
      if (dh.dataStr) activeDataStr = dh.dataStr;
      if (dh.dataIso) activeDataIso = dh.dataIso;
      if (dh.tema) activeTema = dh.tema;
      continue;
    }

    if (/^#+\s*\**\s*(?:Planejamento|Data|Tema|Turma|Rotina|Descricao)/i.test(line)) continue;
    if (/^\*\*(?:Data|Tema|Turma|Rotina|Descricao)/i.test(line)) continue;
    if (/^\|?\s*[-:]+\s*\|/i.test(line)) continue;
    if (/^(?:horario|horario|atividade|titulo|titulo|descricao|descricao|acoes|acoes|observacoes|observacoes|bncc)\b/i.test(line)) continue;

    // Caso A: Linhas com Tabs (TSV)
    if (line.includes('\t')) {
      const tabParts = line.split('\t').map(p => p.trim()).filter(Boolean);
      let time = '';
      let timeIdx = -1;

      for (let tI = 0; tI < tabParts.length; tI++) {
        const tMatch = tabParts[tI].match(/\b(\d{1,2}(?:[:h]\d{2}|h\b))/i);
        if (tMatch) {
          time = normalizeTimeString(tMatch[1]);
          timeIdx = tI;
          break;
        }
      }

      if (time && timeIdx !== -1) {
        const otherParts = tabParts.filter((_, idx) => idx !== timeIdx);
        let rawTitle = otherParts[0] || 'Atividade Pedagogica';
        rawTitle = rawTitle.replace(/^(?:Horario|Atividade|Titulo)\s*:\s*/i, '').trim();
        if (!rawTitle || /^(horario|horario|atividade|titulo|titulo)$/i.test(rawTitle)) {
          rawTitle = otherParts[1] || 'Atividade Pedagogica';
        }

        const rawDesc = otherParts.slice(1).join('\n\n') || rawTitle;
        const taskType = inferTaskType(rawTitle, '', rawDesc);
        const finalTitle = formatAuraTaskTitle(rawTitle, '', '');

        activities.push({
          id: `act-${activities.length + 1}`,
          dia: activeDia,
          dataStr: activeDataStr,
          dataIso: activeDataIso,
          tema: activeTema,
          turma: defaultTurma,
          horario: time,
          titulo: finalTitle,
          descricao: rawDesc.replace(/[\*\#\|]/g, '').trim(),
          tipo: taskType,
          duracao: 30,
          objetivoBNCC: 'Desenvolvimento Ludico e Psicomotor',
          materiais: []
        });
        continue;
      }
    }

    // Caso B: Tabela Markdown (| Horario | Atividade | Descricao | BNCC | ...)
    if (line.includes('|')) {
      const cells = line.split('|').map(c => c.trim()).filter(c => c.length > 0);
      if (cells.some(c => /^(horario|horario|atividade|titulo|titulo|categoria|alcance|descricao|descricao|detalhes|bncc)$/i.test(c))) {
        continue;
      }

      // Se a tabela tiver uma coluna com o dia da semana ou data
      for (const cell of cells) {
        const cDh = detectDayHeader(cell);
        if (cDh && cDh.dia) {
          activeDia = cDh.dia;
          if (cDh.dataStr) activeDataStr = cDh.dataStr;
          if (cDh.dataIso) activeDataIso = cDh.dataIso;
        }
      }

      let time = '09:00';
      let timeCellIndex = -1;
      for (let cIdx = 0; cIdx < cells.length; cIdx++) {
        const tMatch = cells[cIdx].match(/\b(\d{1,2}(?:[:h]\d{2}|h\b))/i);
        if (tMatch) {
          time = normalizeTimeString(tMatch[1]);
          timeCellIndex = cIdx;
          break;
        }
      }

      if (timeCellIndex !== -1) {
        const otherCells = cells.filter((_, idx) => idx !== timeCellIndex);
        let rawAct = otherCells[0] || 'Atividade Pedagogica';
        rawAct = rawAct.replace(/^(?:Horario|Atividade|Titulo)\s*:\s*/i, '').trim();
        if (!rawAct || /^(horario|horario|atividade|titulo|titulo)$/i.test(rawAct)) {
          rawAct = otherCells[1] || 'Atividade Pedagogica';
        }
        
        let rawDesc = '';
        let rawCat = '';

        if (otherCells.length === 2) {
          rawDesc = otherCells[1];
        } else if (otherCells.length >= 3) {
          if (otherCells[1].length >= otherCells[2].length) {
            rawDesc = otherCells[1];
            rawCat = otherCells[2];
          } else {
            rawCat = otherCells[1];
            rawDesc = otherCells[2];
          }
        } else {
          rawDesc = otherCells[0];
        }

        const taskType = inferTaskType(rawAct, rawCat, rawDesc);
        const finalTitle = formatAuraTaskTitle(rawAct, '', rawCat);

        activities.push({
          id: `act-${activities.length + 1}`,
          dia: activeDia,
          dataStr: activeDataStr,
          dataIso: activeDataIso,
          tema: activeTema,
          turma: defaultTurma,
          horario: time,
          titulo: finalTitle,
          descricao: rawDesc.replace(/[\*\#\|]/g, '').trim(),
          tipo: taskType,
          duracao: 30,
          objetivoBNCC: rawCat || 'Desenvolvimento Ludico e Psicomotor',
          materiais: []
        });
        continue;
      }
    }

    // Caso C: Linha simples em Topico (- 09:00: Roda de Leitura - Descricao: ...)
    const timeMatch = line.match(/\b(\d{1,2}(?:[:h]\d{2}|h\b))/i);
    if (timeMatch) {
      const time = normalizeTimeString(timeMatch[1]);
      let clean = line
        .replace(/^[\*\-\ \d\.\)\s]+/, '')
        .replace(timeMatch[0], '')
        .replace(/^[:\-\s]+/, '')
        .replace(/[\*\#\|]/g, '')
        .replace(/^(?:Horario|Horario)\s*:\s*/i, '')
        .trim();

      if (clean.length > 2 && !/^(horario|horario|atividade|titulo|titulo)$/i.test(clean)) {
        let rawTitle = clean;
        let rawDesc = '';

        const descMatch = clean.match(/(?:[---:]\s*(?:Descri[cc][aa]o|Objetivo|Passo|Como\s*conduzir|Desenvolvimento)?\s*:\s*|\s*[---]\s*)(.+)$/i);
        if (descMatch) {
          rawTitle = clean.slice(0, clean.indexOf(descMatch[0])).trim();
          rawDesc = descMatch[1].trim();
        } else {
          const parts = clean.split(/[---]/);
          if (parts.length > 1) {
            rawTitle = parts[0].trim();
            rawDesc = parts.slice(1).join(' - ').trim();
          } else {
            rawDesc = clean;
          }
        }

        const taskType = inferTaskType(rawTitle, '', rawDesc);
        const finalTitle = formatAuraTaskTitle(rawTitle, '', '');

        activities.push({
          id: `act-${activities.length + 1}`,
          dia: activeDia,
          dataStr: activeDataStr,
          dataIso: activeDataIso,
          tema: activeTema,
          turma: defaultTurma,
          horario: time,
          titulo: finalTitle,
          descricao: rawDesc.replace(/\s+/g, ' ').trim(),
          tipo: taskType,
          duracao: 30,
          objetivoBNCC: 'Desenvolvimento Ludico e Psicomotor',
          materiais: []
        });
      }
    }
  }

  // Calcula resumo por dia
  const summaryMap = new Map<string, AuraDaySummary>();
  activities.forEach(act => {
    const key = `${act.dia}_${act.dataStr || ''}`;
    if (!summaryMap.has(key)) {
      summaryMap.set(key, {
        dia: act.dia,
        dataStr: act.dataStr || act.dia,
        dataIso: act.dataIso || '',
        tema: act.tema,
        count: 0
      });
    }
    const item = summaryMap.get(key)!;
    item.count++;
  });

  return {
    metadata: {
      dia: defaultDia,
      dataStr: defaultDataStr,
      dataIso: defaultDataIso,
      tema: defaultTema,
      turma: defaultTurma,
      daysSummary: Array.from(summaryMap.values())
    },
    activities
  };
}

// Compara se duas tarefas se referem a mesma atividade/categoria da rotina para evitar duplicidade
export function areTaskTitlesSimilar(
  titleA: string,
  titleB: string,
  typeA?: string,
  typeB?: string,
  timeA?: string,
  timeB?: string
): boolean {
  if (!titleA || !titleB) return false;

  const normalizeStr = (s: string) => s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/gi, '')
    .trim();

  const normA = normalizeStr(titleA);
  const normB = normalizeStr(titleB);

  // Match exato apos normalizacao
  if (normA === normB) return true;

  // 1. Mamadeira de Leite / Formula (Totalmente isolada de qualquer outra refeicao/lanche)
  const isBottleA = normA.includes('mamadeira') || normA.includes('formula') || normA.includes('leite de formula');
  const isBottleB = normB.includes('mamadeira') || normB.includes('formula') || normB.includes('leite de formula');
  if (isBottleA || isBottleB) {
    return isBottleA && isBottleB;
  }

  // 2. Cafe da Manha / Lanchinho da Manha (Colacao)
  const isMorningSnackA = (normA.includes('cafe') || normA.includes('desjejum') || normA.includes('lanche da manha') || normA.includes('lanchinho da manha') || normA.includes('colacao')) && !isBottleA;
  const isMorningSnackB = (normB.includes('cafe') || normB.includes('desjejum') || normB.includes('lanche da manha') || normB.includes('lanchinho da manha') || normB.includes('colacao')) && !isBottleB;
  if (isMorningSnackA || isMorningSnackB) {
    return isMorningSnackA && isMorningSnackB;
  }

  // 3. Almoco / Papinha / Almocinho
  const isLunchA = normA.includes('almoco') || normA.includes('papinha') || normA.includes('almocinho');
  const isLunchB = normB.includes('almoco') || normB.includes('papinha') || normB.includes('almocinho');
  if (isLunchA || isLunchB) {
    return isLunchA && isLunchB;
  }

  // 4. Frutinha / Lanchinho da Tarde
  const isAfternoonSnackA = (normA.includes('lanche da tarde') || normA.includes('lanchinho tarde') || normA.includes('frutinha')) && !isBottleA;
  const isAfternoonSnackB = (normB.includes('lanche da tarde') || normB.includes('lanchinho tarde') || normB.includes('frutinha')) && !isBottleB;
  if (isAfternoonSnackA || isAfternoonSnackB) {
    return isAfternoonSnackA && isAfternoonSnackB;
  }

  // 5. Jantar / Jantinha
  const isDinnerA = normA.includes('jantar') || normA.includes('jantinha');
  const isDinnerB = normB.includes('jantar') || normB.includes('jantinha');
  if (isDinnerA || isDinnerB) {
    return isDinnerA && isDinnerB;
  }

  // 6. Sono / Soneca / Repouso
  const isNapA = normA.includes('soneca') || normA.includes('soninho') || normA.includes('repouso') || normA.includes('sono');
  const isNapB = normB.includes('soneca') || normB.includes('soninho') || normB.includes('repouso') || normB.includes('sono');
  if (isNapA || isNapB) {
    return isNapA && isNapB;
  }

  // Contencao de substring para titulos descritivos longos residuais
  if (normA.length > 6 && normB.length > 6) {
    if (normA.includes(normB) || normB.includes(normA)) return true;
  }

  // 7. Fraldas / Higiene / Escovacao
  const isHygieneA = normA.includes('fralda') || normA.includes('escovacao') || normA.includes('higiene') || normA.includes('banho');
  const isHygieneB = normB.includes('fralda') || normB.includes('escovacao') || normB.includes('higiene') || normB.includes('banho');
  if (isHygieneA || isHygieneB) {
    return isHygieneA && isHygieneB;
  }

  // 8. Entrada / Acolhida
  const isEntryA = normA.includes('acolhida') || normA.includes('entrada') || normA.includes('recepcao');
  const isEntryB = normB.includes('acolhida') || normB.includes('entrada') || normB.includes('recepcao');
  if (isEntryA || isEntryB) {
    return isEntryA && isEntryB;
  }

  // 9. Recreacao / Parque / Patio
  const isParkA = normA.includes('parque') || normA.includes('parquinho') || normA.includes('patio');
  const isParkB = normB.includes('parque') || normB.includes('parquinho') || normB.includes('patio');
  if (isParkA || isParkB) {
    return isParkA && isParkB;
  }

  // 10. Palavras-chave de Atividades Pedagogicas Especificas
  const keywords = ['horta', 'caixa magica', 'textura', 'pintura', 'massinha', 'musica', 'musicalizacao', 'historia', 'teatro', 'espelho', 'boliche', 'culinaria', 'quebracabeca', 'garrafa sensorial'];
  for (const kw of keywords) {
    const hasA = normA.includes(kw);
    const hasB = normB.includes(kw);
    if (hasA || hasB) {
      return hasA && hasB;
    }
  }

  // 11. Substituicao de Atividade Generica (ex: Atividade Dirigida BNCC) no mesmo bloco de horario (diferenca <= 45 min)
  const isGenericPedagogicalA = normA.includes('atividade dirigida') || normA.includes('atividade pedagogica') || normA.includes('atividade bncc') || normA.includes('tema do dia');
  const isGenericPedagogicalB = normB.includes('atividade dirigida') || normB.includes('atividade pedagogica') || normB.includes('atividade bncc') || normB.includes('tema do dia');
  
  if ((isGenericPedagogicalA || isGenericPedagogicalB) && (typeA === 'atividade_fisica' || typeB === 'atividade_fisica' || !typeA || !typeB)) {
    if (timeA && timeB) {
      const getMins = (tStr: string) => {
        const parts = tStr.split(':');
        return parseInt(parts[0] || '0') * 60 + parseInt(parts[1] || '0');
      };
      const diff = Math.abs(getMins(timeA) - getMins(timeB));
      if (diff <= 45) return true;
    }
  }

  return false;
}

// Unifica inteligente uma lista de novas tarefas com as tarefas existentes da rotina, eliminando duplicatas
export function mergeSimilarTasks(existingTasks: any[], newTasks: any[]): any[] {
  const result = [...existingTasks];

  for (const newT of newTasks) {
    const existingIndex = result.findIndex(ex => 
      ex.idosoId === newT.idosoId &&
      areTaskTitlesSimilar(ex.titulo, newT.titulo, ex.tipo, newT.tipo, ex.horarioPrevisto, newT.horarioPrevisto)
    );

    if (existingIndex !== -1) {
      const ex = result[existingIndex];
      
      const isGeneric = (title: string) => 
        /^(atividade|atividade dirigida|atividade pedagogica|refeicao|lanche|tarefa)$/i.test((title || '').replace(/[^\w\s]/gi, '').trim()) ||
        (title || '').toLowerCase().includes('tematica (bncc)');
      
      let bestTitle = ex.titulo;
      if (isGeneric(ex.titulo) && !isGeneric(newT.titulo)) {
        bestTitle = newT.titulo;
      } else if (!isGeneric(newT.titulo) && (newT.titulo || '').length > (ex.titulo || '').length) {
        bestTitle = newT.titulo;
      }

      let mergedDesc = newT.descricao || ex.descricao || '';
      if (ex.descricao && newT.descricao && !ex.descricao.includes(newT.descricao) && !newT.descricao.includes(ex.descricao)) {
        mergedDesc = `${newT.descricao}\n\n   Detalhes da rotina: ${ex.descricao}`;
      }

      const finalStatus = (ex.status === 'concluido' || ex.status === 'recusado') ? ex.status : newT.status;

      result[existingIndex] = {
        ...ex,
        titulo: bestTitle,
        descricao: mergedDesc,
        horarioPrevisto: newT.horarioPrevisto || ex.horarioPrevisto,
        tipo: newT.tipo || ex.tipo,
        status: finalStatus,
        concluidaEm: ex.concluidaEm || newT.concluidaEm,
        completadaPor: ex.completadaPor || newT.completadaPor,
        observacao: ex.observacao || newT.observacao
      };
    } else {
      result.push(newT);
    }
  }

  return result;
}

// Localiza de forma estrita e inteligente a tarefa diaria correspondente a uma refeicao registrada,
// vinculando OBRIGATORIAMENTE palavra-chave E faixa de horario/periodo do dia (manha vs tarde vs noite)
export function findMatchingMealTask(
  tasks: any[],
  refeicao: string, // 'mamadeira' | 'cafe_manha' | 'almoco' | 'lanche' | 'lanche_tarde' | 'jantar' | 'ceia'
  recordTime: string // e.g. '08:30' ou '14:15'
): any | null {
  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) return null;

  const [rh, rm] = (recordTime || '12:00').split(':').map(Number);
  const regHour = !isNaN(rh) ? rh : new Date().getHours();
  const regMin = !isNaN(rm) ? rm : 0;
  const regTotalMinutes = regHour * 60 + regMin;

  // Filtra apenas tarefas pendentes do tipo alimentacao
  const candidateTasks = tasks.filter(t => t.tipo === 'alimentacao' && t.status !== 'concluido');

  interface ScoredTask {
    task: any;
    timeDiffMinutes: number;
  }

  const validMatches: ScoredTask[] = [];

  for (const t of candidateTasks) {
    const titleLower = (t.titulo || '').toLowerCase();
    const [th, tm] = (t.horarioPrevisto || '12:00').split(':').map(Number);
    const taskHour = !isNaN(th) ? th : 12;
    const taskMin = !isNaN(tm) ? tm : 0;
    const taskTotalMinutes = taskHour * 60 + taskMin;
    const timeDiffMinutes = Math.abs(regTotalMinutes - taskTotalMinutes);

    let keywordMatches = false;
    let timeWindowMatches = false;

    if (refeicao === 'mamadeira') {
      // 1. Palavra: deve conter explicitamente mamadeira ou formula e NAO ser lanche/frutinha/almoco/jantar
      keywordMatches = (titleLower.includes('mamadeira') || titleLower.includes('formula') || titleLower.includes('formula')) &&
        !titleLower.includes('lanche') && !titleLower.includes('frut') && !titleLower.includes('almoco') && !titleLower.includes('jantar');

      // 2. Horario: Manha (antes das 12:00) so da match em tarefas da manha (< 12:00).
      // Tarde (12:00 em diante) so da match em tarefas da tarde (>= 12:00).
      if (regHour < 12) {
        timeWindowMatches = taskHour < 12;
      } else {
        timeWindowMatches = taskHour >= 12;
      }
    } else if (refeicao === 'cafe_manha') {
      // 1. Palavra: cafe, desjejum, lanchinho da manha, lanche da manha, colacao
      keywordMatches = (titleLower.includes('cafe') || titleLower.includes('cafe') || titleLower.includes('desjejum') || 
        titleLower.includes('lanche da manha') || titleLower.includes('lanchinho da manha') || titleLower.includes('lanchinho') || titleLower.includes('colacao') || titleLower.includes('colacao')) &&
        !titleLower.includes('mamadeira') && !titleLower.includes('lanche da tarde') && !titleLower.includes('almoco');

      // 2. Horario: apenas manha (< 12:00)
      timeWindowMatches = taskHour < 12;
    } else if (refeicao === 'almoco') {
      // 1. Palavra: almoco, papinha, almocinho, sopinha
      keywordMatches = (titleLower.includes('almoco') || titleLower.includes('almoco') || titleLower.includes('papinha') || titleLower.includes('almocinho') || titleLower.includes('sopinha')) &&
        !titleLower.includes('jantar') && !titleLower.includes('mamadeira');

      // 2. Horario: janela do almoco (10:30 as 14:00)
      timeWindowMatches = taskHour >= 10 && taskHour <= 14;
    } else if (refeicao === 'lanche' || refeicao === 'lanche_tarde') {
      // 1. Palavra: lanche da tarde, lanchinho da tarde, frutinha, lanche
      keywordMatches = (titleLower.includes('lanche da tarde') || titleLower.includes('lanchinho tarde') || titleLower.includes('frutinha') || titleLower.includes('lanche') || titleLower.includes('fruta')) &&
        !titleLower.includes('manha') && !titleLower.includes('manha') && !titleLower.includes('mamadeira') && !titleLower.includes('cafe') && !titleLower.includes('cafe');

      // 2. Horario: apenas periodo da tarde (12:00 as 18:00)
      timeWindowMatches = taskHour >= 12 && taskHour <= 18;
    } else if (refeicao === 'jantar' || refeicao === 'ceia') {
      // 1. Palavra: jantar, ceia
      keywordMatches = (titleLower.includes('jantar') || titleLower.includes('jantinha') || titleLower.includes('ceia')) &&
        !titleLower.includes('mamadeira');

      // 2. Horario: apenas final de tarde/noite (>= 16:30)
      timeWindowMatches = taskHour >= 16;
    }

    // Ambos PALAVRA e HORARIO devem ser compativeis
    if (keywordMatches && timeWindowMatches) {
      validMatches.push({ task: t, timeDiffMinutes });
    }
  }

  if (validMatches.length === 0) return null;

  // Seleciona a tarefa mais proxima em horario
  validMatches.sort((a, b) => a.timeDiffMinutes - b.timeDiffMinutes);
  return validMatches[0].task;
}

