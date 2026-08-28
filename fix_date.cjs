const fs = require('fs');
let content = fs.readFileSync('src/data.ts', 'utf8');

const badFunc = `    const isCleared = localStorage.getItem(\`anjo_routine_cleared_\${studentId}\`) === 'true' ||
                      localStorage.getItem(\`anjo_activities_cleared_\${studentId}\`) === 'true' ||
                      localStorage.getItem(\`anjo_tasks_cleared_\${studentId}\`) === 'true';
    if (isCleared) return false;`;

content = content.replace(badFunc, `// removed isCleared check to prevent hiding today's valid records`);
fs.writeFileSync('src/data.ts', content);
