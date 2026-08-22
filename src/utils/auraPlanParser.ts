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
    { key: 'terca', name: 'Terça-feira' },
    { key: 'quarta', name: 'Quarta-feira' },
    { key: 'quinta', name: 'Quinta-feira' },
    { key: 'sexta', name: 'Sexta-feira' },
    { key: 'sabado', name: 'Sábado' },
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
        const daysArr = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
        dia = daysArr[dayIdx];
      } catch (e) {}
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
      dataIso = cleanDate;
      const [y, m, d] = cleanDate.split('-');
      dataStr = `${d}/${m}/${y}`;
      try {
        const dObj = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
        const dayIdx = dObj.getDay();
        const daysArr = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
        dia = daysArr[dayIdx];
      } catch (e) {}
    }
  }

  // 2. If rawDay is given, normalize day name
  if (rawDay) {
    const lower = rawDay.toLowerCase();
    if (lower.includes('seg')) dia = 'Segunda-feira';
    else if (lower.includes('ter')) dia = 'Terça-feira';
    else if (lower.includes('qua')) dia = 'Quarta-feira';
    else if (lower.includes('qui')) dia = 'Quinta-feira';
    else if (lower.includes('sex')) dia = 'Sexta-feira';
    else if (lower.includes('sáb') || lower.includes('sab')) dia = 'Sábado';
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

  if (text.includes('medicamento') || text.includes('remédio') || text.includes('dosagem') || text.includes('gotas') || text.includes('pomada')) {
    return 'medicacao';
  }
  if (text.includes('lanche') || text.includes('almoço') || text.includes('almoco') || text.includes('café') || text.includes('cafe') || 
      text.includes('desjejum') || text.includes('colação') || text.includes('colacao') || text.includes('mamadeira') || text.includes('fruta') || 
      text.includes('refeição') || text.includes('refeicao') || text.includes('papinha') || text.includes('jantar') || text.includes('fórmula') || 
      text.includes('formula') || text.includes('alimentar') || text.includes('nutrição') || text.includes('nutricao')) {
    return 'alimentacao';
  }
  if (text.includes('sono') || text.includes('soneca') || text.includes('dormir') || text.includes('repouso') || text.includes('descanso') || 
      text.includes('colchonete') || text.includes('ninar') || text.includes('soninho')) {
    return 'sono';
  }
  if (text.includes('higiene') || text.includes('fralda') || text.includes('troca') || text.includes('banho') || text.includes('dente') || 
      text.includes('escovação') || text.includes('banheiro') || text.includes('lavar mão') || text.includes('conforto')) {
    return 'banho';
  }
  return 'atividade_fisica';
}

// Normaliza strings de horário como "11:30", "11h30", "11h", "11:30h", "11h30min" para "11:30"
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

// Realinha inteligentemente títulos e horários quando há conflito semântico ou deslocamento (shift) no texto
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

  // 1. Detecção de Nome Explícito entre Aspas na Descrição (aspas duplas, simples ou curvas)
  // Ex: plantio da 'Minha Primeira Horta', apresentar a "Caixa Mágica das Texturas" -> título real é "Minha Primeira Horta 🌿"
  const quotedMatch = desc.match(/(?:apresentar|utilizar|explorar|conduzir|oferecer|trabalhar|realizar|plantio|oficina|projeto|dinâmica|dinamica|atividade|tema)\s+(?:a|o|com\s+a|com\s+o|da|do|de)?\s*["“'‘]([^"”'‘]{3,60})["”'‘]/i)
    || desc.match(/["“'‘](Minha Primeira Horta[^"”'‘]*|Horta[^"”'‘]*|Mãos na Terra[^"”'‘]*|Caixa\s+Mágica[^"”'‘]*|Pintura[^"”'‘]*|Circuito[^"”'‘]*|Massinha[^"”'‘]*|Roda\s+de[^"”'‘]*|Varal[^"”'‘]*|Brincadeira[^"”'‘]*|Oficina[^"”'‘]*|História[^"”'‘]*|Teatro[^"”'‘]*|Tapete[^"”'‘]*|Painel[^"”'‘]*|Dança[^"”'‘]*|Música[^"”'‘]*|Boliche[^"”'‘]*|Culinária[^"”'‘]*|Quebra-cabeça[^"”'‘]*|Jogos[^"”'‘]*|Garrafa\s+Sensorial[^"”'‘]*|Pique-[^"”'‘]*|Mundo\s+das[^"”'‘]*|Cesto\s+dos[^"”'‘]*|Bicho[^"”'‘]*|Bandinha[^"”'‘]*|Fantoche[^"”'‘]*|Árvore[^"”'‘]*|Caixa\s+das\s+Sensações[^"”'‘]*|Caixa\s+dos\s+Sentidos[^"”'‘]*|Caixa\s+de\s+Texturas[^"”'‘]*)/i);

  // Caso 1: Conflito flagrante - Título diz "Almoço", mas descrição é sobre "Horta / Natureza", "Caixa Mágica", "exploração sensorial", "texturas", "roda", etc.
  if (titleLower.includes('almoço') || titleLower.includes('almoco')) {
    // 1A. Horta / Natureza / Mãos na terra / Sementes
    if (descLower.includes('horta') || descLower.includes('terra') || descLower.includes('semente') || descLower.includes('plantar') || descLower.includes('plantio') || descLower.includes('planta') || descLower.includes('natureza') || descLower.includes('jardim') || descLower.includes('mãos na terra') || descLower.includes('vaso') || descLower.includes('adubo') || descLower.includes('regar') || descLower.includes('regador')) {
      if (quotedMatch) {
        return { title: formatAuraTaskTitle(quotedMatch[1], '', ''), tipo: 'atividade_fisica' };
      }
      return { title: 'Minha Primeira Horta 🌿', tipo: 'atividade_fisica' };
    }

    // 1B. Sensorial / Texturas / Artes / Movimento
    if (descLower.includes('caixa mágica') || descLower.includes('textura') || descLower.includes('sensorial') || descLower.includes('tátil') || descLower.includes('tatil') || descLower.includes('roda') || descLower.includes('brincadeira') || descLower.includes('psicomotor') || descLower.includes('música') || descLower.includes('musica') || descLower.includes('história') || descLower.includes('historia') || descLower.includes('arte') || descLower.includes('pintura') || descLower.includes('massinha')) {
      if (quotedMatch) {
        return { title: formatAuraTaskTitle(quotedMatch[1], '', ''), tipo: 'atividade_fisica' };
      }
      if (descLower.includes('textura') || descLower.includes('tátil') || descLower.includes('tatil') || descLower.includes('sensorial')) {
        return { title: 'Caixa Mágica das Texturas 🎨', tipo: 'atividade_fisica' };
      }
      return { title: 'Atividade Pedagógica & Sensorial 🎨', tipo: 'atividade_fisica' };
    }
  }

  // Caso 2: Conflito flagrante - Título diz "Higiene / Fralda / Escovação", mas descrição fala de "refeição do dia", "alimentação", "almoço", etc.
  if (titleLower.includes('higiene') || titleLower.includes('fralda') || titleLower.includes('escovação') || titleLower.includes('escovacao') || titleLower.includes('banho')) {
    if (descLower.includes('refeição') || descLower.includes('refeicao') || descLower.includes('alimentação') || descLower.includes('alimentacao') || descLower.includes('almoço') || descLower.includes('almoco') || descLower.includes('prato') || descLower.includes('mastigação') || descLower.includes('mastigacao') || descLower.includes('degustar') || descLower.includes('legumes') || descLower.includes('nutrição') || descLower.includes('nutricao')) {
      return { title: 'Almoço 🍲', tipo: 'alimentacao' };
    }
  }

  // Caso 3: Conflito flagrante - Título diz "Soneca / Sono", mas descrição fala de "troca de fraldas", "higiene", "lavagem de mãos", "escovação", etc.
  if (titleLower.includes('sono') || titleLower.includes('soneca') || titleLower.includes('dormir') || titleLower.includes('descanso')) {
    if (descLower.includes('fralda') || descLower.includes('higiene') || descLower.includes('escovação') || descLower.includes('escovacao') || descLower.includes('escovar') || descLower.includes('lavar as mãos') || descLower.includes('troca')) {
      return { title: 'Higiene / Fraldas / Escovação 👶', tipo: 'banho' };
    }
  }

  // Caso 4: Conflito flagrante - Título diz "Lanche" ou "Parque", mas descrição fala de "soninho", "soneca", "colchonete", "ninar"
  if (titleLower.includes('lanche') || titleLower.includes('parque')) {
    if (descLower.includes('soninho') || descLower.includes('soneca') || descLower.includes('dormir') || descLower.includes('colchonete') || descLower.includes('ninar') || descLower.includes('repouso')) {
      return { title: 'Hora do Sono / Soneca 💤', tipo: 'sono' };
    }
  }

  // Caso 5: Se o horário for claramente 11:30 e a descrição falar de almoço/refeição:
  if ((t === '11:30' || t === '11:00' || t === '12:00') && (descLower.includes('refeição') || descLower.includes('refeicao') || descLower.includes('alimentação') || descLower.includes('alimentacao') || descLower.includes('almoço') || descLower.includes('almoco') || descLower.includes('alimento'))) {
    return { title: 'Almoço 🍲', tipo: 'alimentacao' };
  }

  // Caso 6: Se o horário for 10:30 ou 10:00 e a descrição falar de atividade/textura/horta/natureza/caixa mágica:
  if ((t === '10:30' || t === '10:00') && (descLower.includes('horta') || descLower.includes('terra') || descLower.includes('semente') || descLower.includes('plantar') || descLower.includes('plantio') || descLower.includes('natureza') || descLower.includes('jardim') || descLower.includes('mãos na terra') || descLower.includes('textura') || descLower.includes('caixa mágica') || descLower.includes('sensorial') || descLower.includes('tátil') || descLower.includes('tatil'))) {
    if (quotedMatch) {
      return { title: formatAuraTaskTitle(quotedMatch[1], '', ''), tipo: 'atividade_fisica' };
    }
    if (descLower.includes('horta') || descLower.includes('semente') || descLower.includes('terra') || descLower.includes('plantio') || descLower.includes('plantar') || descLower.includes('natureza')) {
      return { title: 'Minha Primeira Horta 🌿', tipo: 'atividade_fisica' };
    }
    return { title: 'Caixa Mágica das Texturas 🎨', tipo: 'atividade_fisica' };
  }

  // Se tem nome cotado específico na descrição e o título for genérico
  if (quotedMatch && (titleLower.includes('atividade pedagógica') || titleLower.includes('atividade') || titleLower.includes('almoço') || titleLower.includes('almoco') || titleLower.length <= 4)) {
    return { title: formatAuraTaskTitle(quotedMatch[1], '', ''), tipo: inferTaskType(quotedMatch[1], category || '', desc) };
  }

  // Caso padrão: usa o título limpo formatado e tipo inferido
  const finalTitle = formatAuraTaskTitle(rawTitle, '', category || '');
  const tipo = inferTaskType(finalTitle, category || '', desc);
  return { title: finalTitle, tipo };
}

// Detecta se uma linha ou bloco é conversa/chatter da IA (introdução, sugestão, despedida)
export function isConversationalChatNoise(text: string): boolean {
  if (!text) return false;
  const clean = text.replace(/[#\*\_\|]/g, '').trim().toLowerCase();
  if (!clean) return false;

  // Frases clássicas de conversa da Aura / IA
  if (/este planejamento est[aá] prontinho/i.test(clean)) return true;
  if (/sugest[aã]o para a professora/i.test(clean)) return true;
  if (/espero que este planejamento ajude/i.test(clean)) return true;
  if (/registrei para voc[eê]/i.test(clean)) return true;
  if (/se precisar de algo mais/i.test(clean)) return true;
  if (/sinta-se [aà] vontade para adaptar/i.test(clean)) return true;
  if (/assim voc[eê] fica livre para cuidar/i.test(clean)) return true;
  if (/aqui est[aá] o planejamento/i.test(clean)) return true;
  if (/como posso te ajudar/i.test(clean)) return true;
  if (/roteiro padr[aã]o que pode ser ajustado/i.test(clean)) return true;
  if (/din[aâ]mica da turma e as necessidades/i.test(clean)) return true;
  if (/rotina da [a-zÀ-ÿ]+ e de toda a turma/i.test(clean)) return true;
  if (/ideal para voc[eê] usar no sistema/i.test(clean)) return true;
  if (/no formato de linhas/i.test(clean)) return true;

  return false;
}

// Detecta linhas de ruído de status e interface quando o usuário copia a tela
export function isUiNoiseLine(text: string): boolean {
  if (!text) return false;
  const clean = text.replace(/[#\*\_\|]/g, '').trim().toLowerCase();
  if (!clean) return false;

  if (/^agenda de atividades da aula/i.test(clean)) return true;
  if (/^\d+\s*atividade\(s\)\s*programada\(s\)/i.test(clean)) return true;
  if (/^(?:🧹|🗑️|🧠)?\s*(?:repetidas|limpar atividades|importar aura|nova atividade)$/i.test(clean)) return true;
  if (/^observa[çc][õo]es(?:\s+da\s+atividade)?$/i.test(clean)) return true;
  if (/^ex:\s*realizou\s+a\s+atividade/i.test(clean)) return true;
  if (/^(?:❌\s*)?recusou$/i.test(clean)) return true;
  if (/^(?:✓\s*|✔\s*)?entregue$/i.test(clean)) return true;
  if (/^(?:⏳\s*)?pendente$/i.test(clean)) return true;

  return false;
}

// Deduplica e limpa excesso de emojis repetidos consecutivos
export function cleanRepeatedEmojis(str: string): string {
  if (!str) return '';
  // Substitui múltiplos emojis repetidos consecutivos (ex: ☀️ ☀️ ☀️ -> ☀️)
  let clean = str.replace(/([\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}])(?:\s*\1)+/gu, '$1');
  // Se ainda houver 3 ou mais emojis diferentes colados no final, mantém no máximo 1 ou 2
  clean = clean.replace(/((?:[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*){3,})$/gu, (match) => {
    const emojis = match.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu);
    return emojis && emojis.length > 0 ? emojis[0] : '';
  });
  return clean.trim();
}

// Formata o título no padrão manual bonito do Anjinho Escolar com emojis contextuais
export function formatAuraTaskTitle(rawTitle: string, subTitle: string, category: string): string {
  let preferred = (subTitle && subTitle.length > 2 && !/^(horário|horario|atividade|título|titulo|nome)$/i.test(subTitle.trim())) 
    ? subTitle 
    : rawTitle;
  
  // Limpa asteriscos, markdown, pipes e pontuação extra
  let clean = (preferred || '')
    .replace(/[#\*\|_]/g, '')
    .replace(/^[-–—•*+]*\s*/, '')
    .replace(/^(?:[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*)?\d{1,2}(?:[:h]\d{2}|h\b)\s*[-–—:]\s*/u, '')
    .replace(/^(?:Título sugerido|Título|Nome da Atividade|Atividade|Atividade Guiada|Horário|Horario|Atividade Padronizada)\s*:\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Se o título contiver um separador de descrição (ex: "Título - Descrição longa..."), separa e pega apenas o título
  if (clean.includes(' - ') || clean.includes(' — ') || clean.includes(' – ')) {
    const parts = clean.split(/\s+[-–—]\s+/);
    if (parts[0] && parts[0].trim().length >= 3) {
      clean = parts[0].trim();
    }
  }

  // Deduplica emojis repetidos que possam ter vindo na cópia
  clean = cleanRepeatedEmojis(clean);

  // Se o título ficar vazio ou for apenas label genérica ("Horário", "Atividade", etc.)
  if (!clean || /^(horário|horario|atividade|título|titulo|nome|pendente|horário:)$/i.test(clean)) {
    if (category && !/^(horário|horario|atividade)$/i.test(category.trim())) {
      clean = category.replace(/^(?:Categoria|BNCC|Campo)\s*:\s*/i, '').trim();
    } else {
      clean = 'Atividade Pedagógica';
    }
  }

  // Se já tiver emoji unicode, apenas devolve limpo
  if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(clean)) {
    return clean;
  }

  const lower = clean.toLowerCase();

  // Mapeamentos específicos para títulos elegantes
  if (lower.includes('horta') || lower.includes('terra') || lower.includes('semente') || lower.includes('plantio') || lower.includes('plantar') || lower.includes('natureza') || lower.includes('jardim') || lower.includes('mãos na terra') || lower.includes('planta')) {
    return `${clean} 🌿`;
  }
  if (lower.includes('entrada') || lower.includes('acolhida') || lower.includes('acolhimento') || lower.includes('recepção') || lower.includes('chegada')) {
    return `${clean} 🏫`;
  }
  if (lower.includes('espelho') || lower.includes('identidade') || lower.includes('olhar')) {
    return `${clean} 🪞`;
  }
  if (lower.includes('desjejum') || lower.includes('café') || lower.includes('cafe') || lower.includes('mamadeira')) {
    return `${clean} 🍼`;
  }
  if (lower.includes('almoço') || lower.includes('almoco') || lower.includes('papinha') || lower.includes('refeição') || lower.includes('jantar')) {
    return `${clean} 🍲`;
  }
  if (lower.includes('lanche') || lower.includes('fruta') || lower.includes('colação') || lower.includes('colacao') || lower.includes('alimentar')) {
    return `${clean} 🍎`;
  }
  if (lower.includes('fralda') || lower.includes('higiene') || lower.includes('banheiro') || lower.includes('troca') || lower.includes('desfralde')) {
    return `${clean} 👶`;
  }
  if (lower.includes('banho de sol') || lower.includes('sol')) {
    return `${clean} ☀️`;
  }
  if (lower.includes('banho') || lower.includes('chuveiro') || lower.includes('lavatório')) {
    return `${clean} 🧼`;
  }
  if (lower.includes('sono') || lower.includes('soneca') || lower.includes('soninho') || lower.includes('repouso') || lower.includes('ninar') || lower.includes('dormir')) {
    return `${clean} 💤`;
  }
  if (lower.includes('sensaç') || lower.includes('sensacoes') || lower.includes('sensorial') || lower.includes('baú') || lower.includes('bau') || lower.includes('família') || lower.includes('arte') || lower.includes('pintura') || lower.includes('tinta') || lower.includes('massinha') || lower.includes('modelagem')) {
    return `${clean} 🎨`;
  }
  if (lower.includes('chocalho') || lower.includes('música') || lower.includes('musica') || lower.includes('som') || lower.includes('sons') || lower.includes('canto') || lower.includes('cantiga') || lower.includes('roda de música')) {
    return `${clean} 🎵`;
  }
  if (lower.includes('história') || lower.includes('historia') || lower.includes('conto') || lower.includes('leitura') || lower.includes('livro') || lower.includes('fantoche') || lower.includes('teatro')) {
    return `${clean} 📚`;
  }
  if (lower.includes('parque') || lower.includes('parquinho') || lower.includes('ar livre') || lower.includes('livre') || lower.includes('brincadeira') || lower.includes('brinquedo')) {
    return `${clean} 🧸`;
  }
  if (lower.includes('saída') || lower.includes('saida') || lower.includes('despedida') || lower.includes('mochila')) {
    return `${clean} 🎒`;
  }
  if (lower.includes('psicomotor') || lower.includes('movimento') || lower.includes('circuito') || lower.includes('engatinhar') || lower.includes('corpo') || lower.includes('dança') || lower.includes('obstáculo') || lower.includes('ginástica')) {
    return `${clean} 🤸`;
  }
  if (lower.includes('água') || lower.includes('agua') || lower.includes('bolha') || lower.includes('sabão') || lower.includes('bacia')) {
    return `${clean} 🫧`;
  }

  return `${clean} 🌟`;
}

// Detecta se uma linha representa um cabeçalho de Dia da Semana ou Data
function detectDayHeader(line: string): { dia?: string; dataStr?: string; dataIso?: string; tema?: string; turma?: string } | null {
  const clean = line.replace(/[#\*\_]/g, '').trim();
  if (!clean || clean.length < 3) return null;

  // Se for apenas um horário de atividade (ex: 08:00 - 08:30), não é cabeçalho de dia
  if (/^\d{1,2}:\d{2}/.test(clean) && !/(segunda|terça|terca|quarta|quinta|sexta|sábado|sabado|domingo)/i.test(clean)) {
    return null;
  }

  const dayRegex = /\b(Segunda|Terça|Terca|Quarta|Quinta|Sexta|Sábado|Sabado|Domingo)(?:-feira)?\b/i;
  const dateSlashRegex = /\b(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\b/;
  const dateIsoRegex = /\b(\d{4}-\d{2}-\d{2})\b/;
  const temaRegex = /(?:Tema(?:\s+do\s+Dia)?|Subtema|Eixo|Projeto|Planejamento\s+Di[aá]rio)\s*[-–—:]\s*([^\n\(\)]+)/i;
  const turmaRegex = /Turma\s*:\s*([^\n\(\)]+)/i;

  const dayMatch = clean.match(dayRegex);
  const dateMatch = clean.match(dateSlashRegex) || clean.match(dateIsoRegex);
  const temaMatch = clean.match(temaRegex);
  const turmaMatch = clean.match(turmaRegex);

  // Considera cabeçalho se encontrou dia da semana, ou data explícita, ou "Rotina Diária - ..."
  if (dayMatch || dateMatch || /Rotina\s+Di[aá]ria/i.test(clean) || /Planejamento\s+(?:Semanal|Di[aá]rio)/i.test(clean)) {
    const rawDay = dayMatch ? dayMatch[1] : undefined;
    const rawDate = dateMatch ? dateMatch[1] : undefined;
    const resolved = resolveDayAndDate(rawDay, rawDate);

    let tema = temaMatch ? temaMatch[1].trim() : undefined;
    if (!tema && clean.includes('Tema:')) {
      const parts = clean.split(/Tema:/i);
      if (parts[1]) tema = parts[1].split(/[-–—\(]/)[0].trim();
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

// Parser completo de alta precisão que entende Blocos Estruturados Markdown da Aura, Planejamentos Semanais, Tabelas e Listas
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

  // 1. Extração preliminar de metadados globais (e data de início se mencionada no texto introdutório)
  let baseReferenceDate: Date | undefined = undefined;
  const startDateMatch = rawText.match(/(?:começando|iniciando|a\s+partir\s+de|in[íi]cio\s+em|semana\s+de)\s*(?:em\s*)?(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/i);
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

  // 2. PARSER ROBUSTO LINHA A LINHA (Zero regex lock, Instantâneo < 2ms)
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

    // A. Verifica se a linha é cabeçalho de dia (ex: ## Segunda-feira, ## 18/08)
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

    // Linha divisória clássica de Markdown (ex: ---, ***, ===, ___)
    const isDividerLine = /^[-=_*]{3,}$/.test(trimmed);
    if (isDividerLine) {
      if (currentBlock && currentBlock.lines.length > 0) {
        blocks.push(currentBlock);
        currentBlock = null;
      }
      continue;
    }

    // B. Verifica se a linha inicia uma nova atividade (Altamente flexível para qualquer formato de IA/Aura)
    // 1. Horário puro (ex: "10:30", "10h30", "10:30 às 11:30", "⏰ 10:30", "🍼 08:00")
    const isPlainTimeLine = /^(?:[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*)?\d{1,2}(?:[:h]\d{2}|h\b)(?:\s*(?:[-–—]|às|as|até|ate|a)\s*\d{1,2}(?:[:h]\d{2}|h\b))?$/u.test(trimmed);
    
    // 2. Horário com título na mesma linha (ex: "08:00 - Acolhida", "🍼 08:30: Café", "10h - Pintura")
    const isTimeWithDashOrColon = /^(?:[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*)?\d{1,2}(?:[:h]\d{2}|h\b)\s*[-–—:]\s*(.+)$/u.test(trimmed);
    
    // 3. Cabeçalhos Markdown (ex: "## Acolhida", "### 08:00 - Café", "#### Atividade 1")
    const isMdHeader = /^#{2,5}\s+(?!\s*(?:Planejamento|Tema|Eixo|Projeto|Turma|Rotina|Semana)\b)/i.test(trimmed);
    
    // 4. Numeração ou Marcadores de Atividade (ex: "1. Acolhida", "**1. Acolhida**", "* 1. ...", "1 - ...", "1) ...", "Atividade 1:")
    const isNumberedOrBulletActivity = /^(?:[-–—•*+]\s*)?(?:\*\*)?(?:Atividade\s+\d+[\.:\-–—\s]*|\d+[\.):\-–—]\s+)(?:[A-ZÀ-Ú\u{1F300}-\u{1F9FF}\d]|\*\*)/iu.test(trimmed);
    
    // 5. Palavra-chave explícita de início de atividade (ex: "**Atividade 1:**", "Nome da Atividade:", "Título:")
    const isActivityKeywordLine = /^(?:[-–—•*+]\s*)?(?:\*\*)?(?:Atividade\s+\d+|Nome\s*da\s*Atividade|T[ií]tulo\s*(?:da\s*Atividade|sugerido)?|Momento\s*\d*|Oficina\s*\d*|Roteiro\s*\d*)\s*[:\-–—]/i.test(trimmed);
    
    // 6. Rótulo explícito de horário (ex: "Horário: 08:00", "* **Horário:** 08h30")
    const isExplicitTimeLine = /^(?:[-–—•*+]\s*)?(?:\*\*)?(?:Hor[aá]rio|Horario|Hora)\s*:\s*(?:\*\*)?\s*\d{1,2}(?:[:h]\d{2}|h\b)/i.test(trimmed);
    
    // 7. Marcador com horário (ex: "- 08:00", "* 09:30", "• 11:30")
    const isBulletTimeLine = /^[-–—•*+]\s*(?:[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*)?\d{1,2}(?:[:h]\d{2}|h\b)/u.test(trimmed);

    const hasExplicitTimeAlready = currentBlock && currentBlock.lines.some(l => /(?:Hor[aá]rio|Horario)\s*:\s*\**\s*\d{1,2}[:h]|\b\d{1,2}[:h]\d{2}\b/i.test(l));
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
      if (!/^\d{1,2}[:h]\d{2}/.test(cleanLine) && !/^(?:horário|horario|atividade|rotina|data|tema)\s*:/i.test(cleanLine)) {
        headerTitle = cleanLine.replace(/^\d+[\.\)]\s*/, '').replace(/^(?:Atividade\s*\d*|Título)\s*[-–—:]\s*/i, '').trim();
      } else if (cleanLine.includes('|')) {
        const parts = cleanLine.split('|').map(p => p.trim()).filter(Boolean);
        if (parts.length > 1) {
          headerTitle = parts.find(p => !/\d{1,2}[:h]\d{2}/.test(p) && !/^(?:horário|horario|atividade)$/i.test(p)) || '';
        }
      } else if (isTimeWithDashOrColon) {
        const afterTime = cleanLine
          .replace(/^[-–—•*+]*\s*/, '')
          .replace(/^(?:[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*)?\d{1,2}(?:[:h]\d{2}|h\b)\s*[-–—:]\s*/u, '')
          .trim();
        if (afterTime && !/^(?:horário|horario|atividade)$/i.test(afterTime)) {
          // Se contiver separador de descrição na mesma linha (ex: "Título - Descrição"), extrai apenas o título no headerTitle
          if (afterTime.includes(' - ') || afterTime.includes(' — ') || afterTime.includes(' – ')) {
            const splitted = afterTime.split(/\s+[-–—]\s+/);
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
    if (/^(?:⏳\s*)?(?:Pendente|Em andamento|Conclu[íi]do|Entregue|Cancelado)$/i.test(clean)) return true;
    if (/^(?:❌\s*)?Recusou$/i.test(clean)) return true;
    if (/^(?:✓\s*|✔\s*)?(?:Entregue|Conclu[íi]do|Realizado)$/i.test(clean)) return true;
    if (/^Observa[çc][õo]es(?:\s+da\s+Atividade)?$/i.test(clean)) return true;
    if (/^Ex:\s*Realizou\s+a\s+atividade/i.test(clean)) return true;
    return false;
  };

  // Processa cada bloco extraído
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

    // Se o bloco contiver qualquer linha de conversa da IA ou ruído de sistema, ignora o bloco inteiro
    if (block.lines.some(l => isConversationalChatNoise(l))) {
      continue;
    }

    for (const bLine of block.lines) {
      const trimmed = bLine.trim();
      if (!trimmed) continue;

      // Pula linhas de ruído copiadas da interface de status ou conversa
      if (isNoiseLine(trimmed) || isConversationalChatNoise(trimmed)) {
        continue;
      }

      // Procura por campos de experiência da BNCC entre parênteses em qualquer linha do bloco
      if (!bnccObjective) {
        const parenBnccMatch = trimmed.match(/\((?:Campo(?:\s+de\s+Experi[eê]ncia)?\s*:\s*)?([^\)]*(?:O Eu,\s*o Outro|Corpo,\s*Gestos|Traços,\s*Sons|Escuta,\s*Fala|Espaços,\s*Tempos|BNCC|EI\d{2}[A-Z]{2}\d{2})[^\)]*)\)/i)
          || trimmed.match(/\(([^\)]*(?:O Eu, o Outro e o Nós|Corpo, Gestos e Movimentos|Traços, Sons, Cores e Formas|Escuta, Fala, Pensamento e Imaginação|Espaços, Tempos, Quantidades, Relações e Transformações)[^\)]*)\)/i);
        if (parenBnccMatch) {
          bnccObjective = parenBnccMatch[1].trim();
        }
      }

      // Horário dentro do bloco
      const timeLineMatch = trimmed.match(/(?:Hor[aá]rio|Horario|Hora)\s*:\s*\**\s*(\d{1,2}(?:[:h]\d{2}|h\b))\s*(?:(?:[-–—]|às|as|até|ate|a)\s*(\d{1,2}(?:[:h]\d{2}|h\b)))?/i)
        || trimmed.match(/\b(\d{1,2}(?:[:h]\d{2}|h\b))\s*(?:(?:[-–—]|às|as|até|ate|a)\s*(\d{1,2}(?:[:h]\d{2}|h\b)))/i)
        || trimmed.match(/\b(\d{1,2}[:h]\d{2})\b/i);

      if (timeLineMatch && !startTime) {
        startTime = normalizeTimeString(timeLineMatch[1]);
        if (timeLineMatch[2]) {
          endTime = normalizeTimeString(timeLineMatch[2]);
        }
      }

      // Verifica se é uma linha compacta com horário + título + descrição (ex: "- 10:00: Parque / Pátio: Banho de Sol - Levar os bebês...")
      const singleLineCompact = trimmed.replace(/^[-–—•*+]*\s*/, '').replace(/[#\*_]/g, '').trim();
      const compactTimeMatch = singleLineCompact.match(/^(?:[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*)?(\d{1,2}(?:[:h]\d{2}|h\b))\s*[-–—:]\s*(.+)$/u);
      
      if (compactTimeMatch) {
        if (!startTime) {
          startTime = normalizeTimeString(compactTimeMatch[1]);
        }
        const afterTime = compactTimeMatch[2].trim();
        
        // Verifica se tem separador " - " ou " — " separando o Título da Descrição
        if (afterTime.includes(' - ') || afterTime.includes(' — ') || afterTime.includes(' – ')) {
          const parts = afterTime.split(/\s+[-–—]\s+/);
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
          // Ex: "Parque / Pátio: Banho de Sol com Exploradores: Levar os bebês para um ambiente externo..."
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

      const titleMatch = trimmed.match(/^\*?\s*\**\s*(?:T[ií]tulo\s*sugerido|T[ií]tulo|Nome\s*da\s*Atividade|Atividade\s*Padronizada|Atividade)\s*:\s*\**\s*(.+)$/i);
      if (titleMatch) {
        isCapturingDesc = false;
        const candidate = titleMatch[1].replace(/[\*\_]/g, '').trim();
        if (!/^(horário|horario|atividade|título|titulo|nome)$/i.test(candidate)) {
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

      const bnccMatch = trimmed.match(/^\*?\s*\**\s*(?:Campo\s*de\s*Experi[eê]ncia|Objetivo\s*Pedag[oó]gico|Objetivo|BNCC|Habilidade|Campo\s*BNCC|🎯\s*Campo\s*BNCC)\s*:\s*\**\s*(.+)$/i);
      if (bnccMatch) {
        isCapturingDesc = false;
        bnccObjective = bnccMatch[1].replace(/[\*\_]/g, '').trim();
        continue;
      }

      const matMatch = trimmed.match(/^\*?\s*\**\s*(?:Materiais(?:\s*Necess[aá]rios)?|📦\s*Materiais)\s*:\s*\**\s*(.+)$/i);
      if (matMatch) {
        isCapturingDesc = false;
        materials = matMatch[1].replace(/[\*\_]/g, '').split(/[,;]/).map(m => m.trim()).filter(Boolean);
        continue;
      }

      const descMatch = trimmed.match(/^\*?\s*\**\s*(?:Descri[çc][aã]o(?:\s*Detalhada|\s*Pedag[oó]gica|\s*Completa|\s*Geral)?|Como\s*Conduzir|Passo\s*a\s*Passo|Desenvolvimento|Orienta[çc][õo]es(?:\s*Pedag[oó]gicas)?|Metodologia|Procedimentos|Instru[çc][õo]es|Objetivo\s*e\s*Descri[çc][aã]o)\s*:\s*\**\s*(.*)$/i);
      if (descMatch) {
        isCapturingDesc = true;
        const remainingOnSameLine = descMatch[1].replace(/[\*\_]/g, '').trim();
        if (remainingOnSameLine) {
          descLines.push(remainingOnSameLine);
        }
        continue;
      }

      if (isCapturingDesc) {
        if (/^\*?\s*\**\s*(?:T[ií]tulo|Categoria|BNCC|Campo|Materiais|Turma|Hor[aá]rio|Atividade|🎯|📦)\s*:\s*\**/i.test(trimmed)) {
          isCapturingDesc = false;
          continue;
        }

        const cleanDescLine = trimmed
          .replace(/^\s*[\*\-\•\d\.\)]\s*/, '')
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .trim();
        if (cleanDescLine) {
          descLines.push(cleanDescLine);
        }
        continue;
      }

      // Linha solta que não tem label: verifica se é um título curto ou uma descrição pedagógica
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

    // Se não capturou descrição com o rótulo "Descrição:", usa o texto restante do bloco
    let detailedDesc = '';
    if (descLines.length > 0) {
      detailedDesc = descLines.join('\n');
    } else {
      const leftover = block.lines
        .filter(l => !isNoiseLine(l))
        .filter(l => !/^\*?\s*\**\s*(?:T[ií]tulo|Categoria|Alcance|Turma|Tema|Data|Campo|BNCC|Objetivo|Materiais|Hor[aá]rio|Atividade|🎯|📦)\s*:/i.test(l.trim()))
        .filter(l => !/^#{2,4}\s+/.test(l.trim()))
        .filter(l => !/^\d{1,2}[:h]\d{2}/.test(l.trim()))
        .map(l => l.replace(/^\s*[\*\-\•]\s*/, '').replace(/\*\*(.*?)\*\*/g, '$1').replace(/[\*\_]/g, '').trim())
        .filter(Boolean)
        .join('\n');
      detailedDesc = leftover;
    }

    let rawTitle = explicitTitle || block.headerTitle || '';
    rawTitle = cleanRepeatedEmojis(rawTitle);

    // Se o bloco não tem horário e não tem título explícito, ou é conversa da IA, ignora completamente
    if (!startTime && (!rawTitle || /^(?:Atividade Pedagógica|Atividade|Horário|Horario)$/i.test(rawTitle))) {
      continue;
    }

    if (isConversationalChatNoise(rawTitle) || isConversationalChatNoise(detailedDesc)) {
      continue;
    }

    if (!startTime) {
      // Se não há horário no bloco, e não é uma atividade pedagógica legítima com título reconhecido, pula
      if (rawTitle.length < 3) {
        continue;
      }
      startTime = '09:00';
    }

    if (!rawTitle) {
      rawTitle = 'Atividade Pedagógica';
    }

    let finalDesc = detailedDesc;
    if (!finalDesc || finalDesc.trim().length === 0) {
      finalDesc = `Atividade de rotina: ${rawTitle}.`;
    } else {
      // Limpa prefixos de horário ou de título duplicados na descrição
      finalDesc = finalDesc
        .replace(/^[-–—•*+]*\s*\d{1,2}[:h]\d{2}\s*[-–—:]\s*/i, '')
        .trim();

      // Se a descrição começar com o mesmo texto do título seguido de hífen/dois-pontos, remove a duplicação
      const cleanRawTitle = rawTitle.replace(/[#\*_\|]/g, '').trim();
      if (cleanRawTitle && finalDesc.toLowerCase().startsWith(cleanRawTitle.toLowerCase())) {
        finalDesc = finalDesc.slice(cleanRawTitle.length).replace(/^[\s\-–—:]+/, '').trim();
      }
      if (!finalDesc) {
        finalDesc = `Atividade de rotina: ${rawTitle}.`;
      }
    }

    // Se a descrição termina com os campos da BNCC entre parênteses, extrai como bnccObjective e limpa a descrição
    if (!bnccObjective) {
      const inlineBnccMatch = finalDesc.match(/\((?:Campo(?:\s+de\s+Experi[eê]ncia)?\s*:\s*)?([^\)]*(?:O Eu,\s*o Outro|Corpo,\s*Gestos|Traços,\s*Sons|Escuta,\s*Fala|Espaços,\s*Tempos|BNCC|EI\d{2}[A-Z]{2}\d{2})[^\)]*)\)\s*$/i)
        || finalDesc.match(/\(([^\)]*(?:O Eu, o Outro e o Nós|Corpo, Gestos e Movimentos|Traços, Sons, Cores e Formas|Escuta, Fala, Pensamento e Imaginação|Espaços, Tempos, Quantidades, Relações e Transformações)[^\)]*)\)/i);
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
      objetivoBNCC: bnccObjective || category || 'Desenvolvimento Lúdico e BNCC',
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

    // Verifica se a linha é um novo cabeçalho de dia
    const dh = detectDayHeader(line);
    if (dh) {
      if (dh.dia) activeDia = dh.dia;
      if (dh.dataStr) activeDataStr = dh.dataStr;
      if (dh.dataIso) activeDataIso = dh.dataIso;
      if (dh.tema) activeTema = dh.tema;
      continue;
    }

    if (/^#+\s*\**\s*(?:Planejamento|Data|Tema|Turma|Rotina|Descrição)/i.test(line)) continue;
    if (/^\*\*(?:Data|Tema|Turma|Rotina|Descrição)/i.test(line)) continue;
    if (/^\|?\s*[-:]+\s*\|/i.test(line)) continue;
    if (/^(?:horário|horario|atividade|título|titulo|descrição|descricao|ações|acoes|observações|observacoes|bncc)\b/i.test(line)) continue;

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
        let rawTitle = otherParts[0] || 'Atividade Pedagógica';
        rawTitle = rawTitle.replace(/^(?:Horário|Atividade|Título)\s*:\s*/i, '').trim();
        if (!rawTitle || /^(horário|horario|atividade|título|titulo)$/i.test(rawTitle)) {
          rawTitle = otherParts[1] || 'Atividade Pedagógica';
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
          objetivoBNCC: 'Desenvolvimento Lúdico e Psicomotor',
          materiais: []
        });
        continue;
      }
    }

    // Caso B: Tabela Markdown (| Horário | Atividade | Descrição | BNCC | ...)
    if (line.includes('|')) {
      const cells = line.split('|').map(c => c.trim()).filter(c => c.length > 0);
      if (cells.some(c => /^(horário|horario|atividade|título|titulo|categoria|alcance|descrição|descricao|detalhes|bncc)$/i.test(c))) {
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
        let rawAct = otherCells[0] || 'Atividade Pedagógica';
        rawAct = rawAct.replace(/^(?:Horário|Atividade|Título)\s*:\s*/i, '').trim();
        if (!rawAct || /^(horário|horario|atividade|título|titulo)$/i.test(rawAct)) {
          rawAct = otherCells[1] || 'Atividade Pedagógica';
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
          objetivoBNCC: rawCat || 'Desenvolvimento Lúdico e Psicomotor',
          materiais: []
        });
        continue;
      }
    }

    // Caso C: Linha simples em Tópico (- 09:00: Roda de Leitura - Descrição: ...)
    const timeMatch = line.match(/\b(\d{1,2}(?:[:h]\d{2}|h\b))/i);
    if (timeMatch) {
      const time = normalizeTimeString(timeMatch[1]);
      let clean = line
        .replace(/^[\*\-\•\d\.\)\s]+/, '')
        .replace(timeMatch[0], '')
        .replace(/^[:\-\s]+/, '')
        .replace(/[\*\#\|]/g, '')
        .replace(/^(?:Horário|Horario)\s*:\s*/i, '')
        .trim();

      if (clean.length > 2 && !/^(horário|horario|atividade|título|titulo)$/i.test(clean)) {
        let rawTitle = clean;
        let rawDesc = '';

        const descMatch = clean.match(/(?:[-–—:]\s*(?:Descri[çc][aã]o|Objetivo|Passo|Como\s*conduzir|Desenvolvimento)?\s*:\s*|\s*[-–—]\s*)(.+)$/i);
        if (descMatch) {
          rawTitle = clean.slice(0, clean.indexOf(descMatch[0])).trim();
          rawDesc = descMatch[1].trim();
        } else {
          const parts = clean.split(/[-–—]/);
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
          objetivoBNCC: 'Desenvolvimento Lúdico e Psicomotor',
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
