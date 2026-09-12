import fs from 'fs';

const fileStr = fs.readFileSync('src/components/BannerHeader.tsx', 'utf-8');
const lines = fileStr.split('\n');

const startIndex = lines.findIndex(l => l.includes('<span>Mais...</span>'));

if (startIndex !== -1) {
  lines.splice(startIndex - 7, 9);
  fs.writeFileSync('src/components/BannerHeader.tsx', lines.join('\n'));
  console.log('Removed mobile Mais... button');
}
