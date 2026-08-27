import fs from 'fs';
import path from 'path';

function fixFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix specific double replacements or remaining mojibake
  const replacements: [RegExp, string][] = [
    [/Ã\x81/g, 'Á'],
    [/Ã\x80/g, 'À'],
    [/Ã\x82/g, 'Â'],
    [/Ã\x83/g, 'Ã'],
    [/Ã\x89/g, 'É'],
    [/Ã\x8A/g, 'Ê'],
    [/Ã\x8D/g, 'Í'],
    [/Ã\x93/g, 'Ó'],
    [/Ã\x94/g, 'Ô'],
    [/Ã\x95/g, 'Õ'],
    [/Ã\x9A/g, 'Ú'],
    [/Ã\x87/g, 'Ç'],
    [/Ã¡/g, 'á'],
    [/Ã /g, 'à'],
    [/Ã¢/g, 'â'],
    [/Ã£/g, 'ã'],
    [/Ã©/g, 'é'],
    [/Ãª/g, 'ê'],
    [/Ã­/g, 'í'],
    [/Ã³/g, 'ó'],
    [/Ã´/g, 'ô'],
    [/Ãµ/g, 'õ'],
    [/Ãº/g, 'ú'],
    [/Ã§/g, 'ç'],
    [/Ã/g, 'Á'], // remaining uppercase Á
    [/ï¸\x8F/g, '⚠️ '],
    [/ï¸/g, ''],
    [/ð\x9F[^\s<>"'`\\{}()[\]]+/g, ''],
    [/â\x80[^\s<>"'`\\{}()[\]]+/g, ''],
    [/â[^\s<>"'`\\{}()[\]]+/g, ''],
    [/çãoo/g, 'ção'],
    [/çõeses/g, 'ções'],
    [/açãoo/g, 'ação'],
    [/Atençãoo/g, 'Atenção'],
    [/Observaçãoo/g, 'Observação'],
    [/observaçãoo/g, 'observação'],
    [/NÃO reescreve/g, 'NÃO reescreve'],
    [/NÁO reescreve/g, 'NÃO reescreve']
  ];

  for (const [r, repl] of replacements) {
    content = content.replace(r, repl);
  }

  // Remove control characters like \x80-\x9F
  content = content.replace(/[\u0080-\u009F]/g, '');

  fs.writeFileSync(filePath, content, 'utf8');
}

function walk(dir: string) {
  const list = fs.readdirSync(dir);
  for (const f of list) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (f !== 'node_modules' && f !== 'dist' && f !== '.git') walk(full);
    } else if (f.endsWith('.tsx') || f.endsWith('.ts')) {
      fixFile(full);
    }
  }
}

walk(path.join(process.cwd(), 'src'));
console.log('Finished deep replacement!');
