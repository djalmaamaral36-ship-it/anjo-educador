const fs = require('fs');
let content = fs.readFileSync('src/components/JornadaAnjinho.tsx', 'utf8');

// Replace all usages of isRoutineClearedInJornada with false, or just remove the ternary logic.
content = content.replace(/const isRoutineClearedInJornada = localStorage\.getItem\(\`anjo_routine_cleared_\$\{studentId\}\`\) === \'true\';/g, 'const isRoutineClearedInJornada = false;');

content = content.replace(/const isRoutineClearedStudent = localStorage\.getItem\(\`anjo_routine_cleared_\$\{student\.id\}\`\) === \'true\';/g, 'const isRoutineClearedStudent = false;');

fs.writeFileSync('src/components/JornadaAnjinho.tsx', content);
