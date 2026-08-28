const fs = require('fs');
let content = fs.readFileSync('src/data.ts', 'utf8');

const regex = /\/\/ TTL-based local cache resolution utility[\s\S]*?(?=const allRecords: \{ record: ShiftState; time: number \}\[\] = \[\];)/;

const newLogic = `
  // Helper to find existing saved start time across possible keys
  const findExistingStartTime = (): string | null => {
    for (const k of possibleKeys) {
      const saved = localStorage.getItem(\`anjo_shift_start_time_\${k}\`);
      if (saved) return saved;
    }
    if (studentRoom) {
      const savedRoom = localStorage.getItem(\`anjo_shift_start_time_\${studentRoom}\`);
      if (savedRoom) return savedRoom;
    }
    return null;
  };

  // 1. Check shift states in DB (PRIMARY SOURCE OF TRUTH)
  const shiftStates = customShiftStates && Array.isArray(customShiftStates) 
    ? customShiftStates 
    : getFromDB<ShiftState[]>('anjo_shift_states', []);

  let localActiveFlag = false;
  let localAbsentFlag = false;

  for (const k of possibleKeys) {
    if (localStorage.getItem(\`anjo_shift_active_\${k}\`) === 'true') {
      localActiveFlag = true;
    }
    if (localStorage.getItem(\`anjo_is_absent_\${k}\`) === 'true') {
      localAbsentFlag = true;
    }
  }

`;

content = content.replace(regex, newLogic);
fs.writeFileSync('src/data.ts', content);
