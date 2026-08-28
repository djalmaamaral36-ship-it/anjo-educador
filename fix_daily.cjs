const fs = require('fs');
let content = fs.readFileSync('src/components/DailyRoutine.tsx', 'utf8');
content = content.replace(/const isRoutineClearedStudent = localStorage\.getItem\(\`anjo_routine_cleared_\$\{idoso\.id\}\`\) === \'true\';/g, 'const isRoutineClearedStudent = false;');
fs.writeFileSync('src/components/DailyRoutine.tsx', content);
