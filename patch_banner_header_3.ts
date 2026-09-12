import fs from 'fs';

const fileStr = fs.readFileSync('src/components/BannerHeader.tsx', 'utf-8');
const lines = fileStr.split('\n');

const startIndex = lines.findIndex(l => l.includes('/* Botão Dropdown "☰ Mais ▾" */'));
if (startIndex !== -1) {
  let endIndex = -1;
  let openDivs = 0;
  for (let i = startIndex + 1; i < lines.length; i++) {
    if (lines[i].includes('<div className="relative" ref={moreMenuRef}>')) {
      openDivs++;
    } else if (lines[i].includes('<div')) {
      openDivs++;
    }
    if (lines[i].includes('</div')) {
      openDivs--;
      if (openDivs === 0) {
        endIndex = i;
        break;
      }
    }
  }
  
  if (endIndex !== -1) {
    lines.splice(startIndex, endIndex - startIndex + 1);
    fs.writeFileSync('src/components/BannerHeader.tsx', lines.join('\n'));
    console.log('Removed Dropdown UI');
  }
}
