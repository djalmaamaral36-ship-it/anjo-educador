const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

content = content.replace(/new Date\(\)\.toLocaleTimeString\(\'pt-BR\'\, \{ hour\: \'2-digit\'\, minute\: \'2-digit\' \}\)/g, 'getNowTimeBr()');

if (!content.includes('getNowTimeBr')) {
  content = content.replace(/getHygieneLog, /, 'getHygieneLog, getNowTimeBr, ');
}

fs.writeFileSync('src/components/Dashboard.tsx', content);

let dataContent = fs.readFileSync('src/data.ts', 'utf8');
dataContent = dataContent.replace(/export function getNowTimeBr\(\)\: string \{[\s\S]*?\}/, `export function getNowTimeBr(): string {
  const d = new Date();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return \`\${h}:\${m}\`;
}`);
fs.writeFileSync('src/data.ts', dataContent);

