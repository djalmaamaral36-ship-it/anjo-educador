const fs = require('fs');
let content = fs.readFileSync('src/data.ts', 'utf8');
content = content.replace('  return `${h}:${m}`;\n});\n}', '  return `${h}:${m}`;\n}');
fs.writeFileSync('src/data.ts', content);
