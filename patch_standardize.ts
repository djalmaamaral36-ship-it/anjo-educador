import fs from 'fs';

const code = `
// Padroniza as atividades de acordo com o formato esperado pelo sistema
export function standardizeAuraActivity(rawTime: string, rawTitle: string, rawDesc: string): { titulo: string, item_key: string, tipo: 'alimentacao' | 'medicacao' | 'atividade_fisica' | 'banho' | 'sono' | 'humor' } {
  const text = \`\${rawTitle} \${rawDesc}\`.toLowerCase();
  
  if (text.includes('acolhida') || text.includes('entrada') || text.includes('recepcao')) {
    return { titulo: 'Acolhida / entrada', item_key: 'acolhida', tipo: 'atividade_fisica' };
  }
  if (text.includes('roda') || text.includes('conversa')) {
    return { titulo: 'Roda de conversa', item_key: 'roda', tipo: 'atividade_fisica' };
  }
  if ((text.includes('lanche') && text.includes('manha')) || rawTime === '09:30' || text.includes('colacao')) {
    return { titulo: 'Lanche da manhã', item_key: 'lanche', tipo: 'alimentacao' };
  }
  if (text.includes('lanche') && text.includes('tarde') || rawTime === '14:30') {
    return { titulo: 'Lanche da tarde', item_key: 'lanche_tarde', tipo: 'alimentacao' };
  }
  if (text.includes('parque') || text.includes('patio') || text.includes('ar livre') || text.includes('brincadeira dirigida')) {
    return { titulo: 'Parque / pátio', item_key: 'parque', tipo: 'atividade_fisica' };
  }
  if (text.includes('almoco') || text.includes('almoço')) {
    return { titulo: 'Almoço', item_key: 'almoco', tipo: 'alimentacao' };
  }
  if (text.includes('higiene') || text.includes('escovacao') || text.includes('escovação') || text.includes('banheiro') || text.includes('fralda')) {
    return { titulo: 'Higiene / escovação', item_key: 'higiene', tipo: 'banho' };
  }
  if (text.includes('soneca') || text.includes('repouso') || text.includes('sono') || text.includes('dormir') || text.includes('descanso')) {
    return { titulo: 'Soneca / repouso', item_key: 'sono', tipo: 'sono' };
  }
  if (text.includes('brincadeira livre') || text.includes('livre')) {
    return { titulo: 'Brincadeira livre', item_key: 'brincadeira_livre', tipo: 'atividade_fisica' };
  }
  if (text.includes('historia') || text.includes('história') || text.includes('leitura') || text.includes('conto')) {
    return { titulo: 'Contação de histórias', item_key: 'leitura', tipo: 'atividade_fisica' };
  }
  if (text.includes('saida') || text.includes('saída') || text.includes('despedida') || text.includes('preparacao')) {
    return { titulo: 'Preparação para saída', item_key: 'saida', tipo: 'atividade_fisica' };
  }
  if (text.includes('atividade dirigida') || text.includes('pedagogica') || text.includes('pedagógica') || text.includes('exploracao')) {
    return { titulo: 'Atividade dirigida', item_key: 'atividade', tipo: 'atividade_fisica' };
  }

  // Fallbacks by exact time matching
  if (rawTime === '07:30') return { titulo: 'Acolhida / entrada', item_key: 'acolhida', tipo: 'atividade_fisica' };
  if (rawTime === '08:30') return { titulo: 'Roda de conversa', item_key: 'roda', tipo: 'atividade_fisica' };
  if (rawTime === '09:30') return { titulo: 'Lanche da manhã', item_key: 'lanche', tipo: 'alimentacao' };
  if (rawTime === '10:00') return { titulo: 'Parque / pátio', item_key: 'parque', tipo: 'atividade_fisica' };
  if (rawTime === '10:30') return { titulo: 'Atividade dirigida', item_key: 'atividade', tipo: 'atividade_fisica' };
  if (rawTime === '11:30') return { titulo: 'Almoço', item_key: 'almoco', tipo: 'alimentacao' };
  if (rawTime === '12:15') return { titulo: 'Higiene / escovação', item_key: 'higiene', tipo: 'banho' };
  if (rawTime === '12:30') return { titulo: 'Soneca / repouso', item_key: 'sono', tipo: 'sono' };
  if (rawTime === '14:30') return { titulo: 'Lanche da tarde', item_key: 'lanche_tarde', tipo: 'alimentacao' };
  if (rawTime === '15:00') return { titulo: 'Brincadeira livre', item_key: 'brincadeira_livre', tipo: 'atividade_fisica' };
  if (rawTime === '15:45') return { titulo: 'Contação de histórias', item_key: 'leitura', tipo: 'atividade_fisica' };
  if (rawTime === '16:30') return { titulo: 'Preparação para saída', item_key: 'saida', tipo: 'atividade_fisica' };

  // Strict fallback
  const tipo = inferTaskType(rawTitle, '', rawDesc);
  const finalTitle = formatAuraTaskTitle(rawTitle, '', '');
  return { titulo: finalTitle, item_key: 'atividade', tipo };
}
`;

const fileStr = fs.readFileSync('src/utils/auraPlanParser.ts', 'utf-8');
const lines = fileStr.split('\n');

const insertIdx = lines.findIndex(l => l.includes('export function normalizeTimeString'));

if (insertIdx !== -1) {
  lines.splice(insertIdx, 0, code);
  fs.writeFileSync('src/utils/auraPlanParser.ts', lines.join('\n'));
  console.log('Inserted standardizeAuraActivity');
} else {
  console.log('Could not find insert point');
}

