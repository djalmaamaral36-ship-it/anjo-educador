const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const badFunc = `const getNowTimeBr = () => {
  return new Date().toLocaleTimeString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit'
  });
};`;

const goodFunc = `const getNowTimeBr = () => {
  const d = new Date();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return \`\${h}:\${m}\`;
};`;

content = content.replace(badFunc, goodFunc);

// Wait, I should also replace anywhere else that might be inline using toLocaleTimeString
content = content.replace(/new Date\(\)\.toLocaleTimeString\(\'pt-BR\', \{ hour: \'2-digit\', minute: \'2-digit\' \}\)/g, 'getNowTimeBr()');

fs.writeFileSync('src/components/Dashboard.tsx', content);
