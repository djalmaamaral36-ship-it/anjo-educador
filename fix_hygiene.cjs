const fs = require('fs');
let content = fs.readFileSync('src/data.ts', 'utf8');

const oldSort = `      studentLogs.sort((a, b) => {
        const timeA = new Date(a.date + 'T' + (a.time || '00:00') + ':00').getTime();
        const timeB = new Date(b.date + 'T' + (b.time || '00:00') + ':00').getTime();
        return timeB - timeA;
      });`;

const newSort = `      studentLogs.sort((a, b) => {
        const dateA = a.date || getTodayIso();
        const dateB = b.date || getTodayIso();
        const timeA = new Date(dateA + 'T' + (a.time || '00:00') + ':00').getTime() || 0;
        const timeB = new Date(dateB + 'T' + (b.time || '00:00') + ':00').getTime() || 0;
        return timeB - timeA;
      });`;

content = content.replace(oldSort, newSort);
fs.writeFileSync('src/data.ts', content);
