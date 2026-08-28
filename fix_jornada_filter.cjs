const fs = require('fs');
let content = fs.readFileSync('src/components/JornadaAnjinho.tsx', 'utf8');

// Just don't filter by isRecordBeforeResetTimestamp, since we already clear old items anyway!
content = content.replace(/&& \!isRecordBeforeResetTimestamp\(item, resetTimeStrStudent\)/g, '');
content = content.replace(/&& \!isRecordBeforeResetTimestamp\(hygLog, resetTimeStrInJornada\)/g, '');

fs.writeFileSync('src/components/JornadaAnjinho.tsx', content);
