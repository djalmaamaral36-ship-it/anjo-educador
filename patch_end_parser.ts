import fs from 'fs';

const code = `
  // Post-process activities to enforce standardization keys and titles
  activities = activities.map(act => {
    const std = standardizeAuraActivity(act.horario, act.titulo, act.descricao);
    return {
      ...act,
      titulo: std.titulo,
      item_key: std.item_key,
      tipo: std.tipo
    };
  });
`;

const fileStr = fs.readFileSync('src/utils/auraPlanParser.ts', 'utf-8');
const lines = fileStr.split('\n');

const insertIdx = lines.findIndex(l => l.includes('// Calcula resumo por dia'));

if (insertIdx !== -1) {
  lines.splice(insertIdx, 0, code);
  fs.writeFileSync('src/utils/auraPlanParser.ts', lines.join('\n'));
  console.log('Inserted standardization map');
} else {
  console.log('Could not find insert point');
}
