import fs from 'fs';

const fileStr = fs.readFileSync('src/components/BannerHeader.tsx', 'utf-8');
const lines = fileStr.split('\n');

const effectStart = lines.findIndex(l => l.includes('// Fecha o dropdown "Mais" ao clicar fora'));
if (effectStart !== -1) {
  let openBraces = 0;
  let effectEnd = -1;
  for (let i = effectStart + 1; i < lines.length; i++) {
    if (lines[i].includes('{')) openBraces++;
    if (lines[i].includes('}')) openBraces--;
    if (openBraces < 0 || lines[i].includes('}, []);')) {
      effectEnd = i;
      break;
    }
  }
  if (effectEnd !== -1) {
    lines.splice(effectStart, effectEnd - effectStart + 1);
    fs.writeFileSync('src/components/BannerHeader.tsx', lines.join('\n'));
    console.log('Removed effect completely');
  }
}
