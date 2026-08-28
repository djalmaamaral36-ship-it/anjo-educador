const fs = require('fs');

// 1. Refine getShiftActiveState in src/data.ts
let dataCode = fs.readFileSync('src/data.ts', 'utf8');

// Ensure getShiftActiveState guarantees strict inactive state if any stop was triggered
const shiftStateStart = dataCode.indexOf('export function getShiftActiveState(');
const shiftStateEnd = dataCode.indexOf('export function generateDefaultTasksForStudent(');

if (shiftStateStart !== -1 && shiftStateEnd !== -1) {
  const newShiftStateFunc = `export function getShiftActiveState(studentId: string, customShiftStates?: ShiftState[]): { active: boolean; isAbsent: boolean; reason?: string | null; startTime: string | null; lastResetTime: string | null } {
  if (typeof window === "undefined" || !studentId) return { active: false, isAbsent: false, reason: null, startTime: null, lastResetTime: null };
  
  let targetStudentId = String(studentId).trim();
  const appMode = (localStorage.getItem("anjo_app_mode") as "idoso" | "escolar_infantil" | "escolar_fundamental") || "escolar_infantil";
  if (appMode.startsWith("escolar")) {
    if (targetStudentId === "idoso_maria") targetStudentId = "aluno_1";
    else if (targetStudentId === "idoso_joao") targetStudentId = "aluno_2";
  } else {
    if (targetStudentId === "aluno_1") targetStudentId = "idoso_maria";
    else if (targetStudentId === "aluno_2") targetStudentId = "idoso_joao";
  }
  const allStudents = getFromDB<Idoso[]>("anjo_idosos", IDOSOS_INICIAIS);
  const studentObj = allStudents.find(s => 
    s.id === targetStudentId || 
    (s.nome && s.nome.toLowerCase() === targetStudentId.toLowerCase()) ||
    keyMatches(s.id, targetStudentId) ||
    (s.nome && keyMatches(s.nome, targetStudentId)) ||
    (s.nome && keyMatches(s.nome.split(" (")[0], targetStudentId))
  );

  const realId = studentObj?.id || targetStudentId;
  const studentName = studentObj?.nome || "";
  const studentCleanName = studentName.split(" (")[0].trim();
  const studentRoom = studentObj?.salaAula || studentObj?.quarto || getStudentRoomName(studentObj || targetStudentId);

  const possibleKeys = getAllPossibleStudentKeys(realId);

  const findExistingStartTime = (): string | null => {
    for (const k of possibleKeys) {
      const saved = localStorage.getItem("anjo_shift_start_time_" + k);
      if (saved) return saved;
    }
    return null;
  };

  const shiftStates = customShiftStates && Array.isArray(customShiftStates) 
    ? customShiftStates 
    : getFromDB<ShiftState[]>("anjo_shift_states", []);

  let localExplicitFalse = false;
  let localActiveFlag = false;
  let localAbsentFlag = false;

  for (const k of possibleKeys) {
    const val = localStorage.getItem("anjo_shift_active_" + k);
    if (val === "false") localExplicitFalse = true;
    if (val === "true") localActiveFlag = true;
    if (localStorage.getItem("anjo_is_absent_" + k) === "true") {
      localAbsentFlag = true;
    }
  }

  const directRecords: { record: ShiftState; time: number }[] = [];
  const classroomRecords: { record: ShiftState; time: number }[] = [];

  shiftStates.forEach(s => {
    if (!s || !s.id) return;
    const sid = String(s.id).trim();
    
    let time = 0;
    if (s.updatedAt) {
      const p = new Date(s.updatedAt).getTime();
      if (!isNaN(p)) time = p;
    }
    if (time === 0 && s.startTime) {
      const p = new Date(s.startTime).getTime();
      if (!isNaN(p)) time = p;
    }

    const isDirectMatch = possibleKeys.some(pk => pk === sid || keyMatches(pk, sid) || keyMatches(sid, pk));
    const isClassroomMatch = studentRoom && keyMatches(sid, studentRoom);

    if (isDirectMatch) {
      directRecords.push({ record: s, time });
    } else if (isClassroomMatch) {
      classroomRecords.push({ record: s, time });
    }
  });

  directRecords.sort((a, b) => b.time - a.time);
  classroomRecords.sort((a, b) => b.time - a.time);

  const latestDirect = directRecords[0]?.record;
  const latestClassroom = classroomRecords[0]?.record;

  const isStudentAbsent = possibleKeys.some(k => localStorage.getItem("anjo_is_absent_" + k) === "true") || 
                          directRecords.some(r => r.record.isAbsent === true || String(r.record.isAbsent) === "true");

  if (isStudentAbsent) {
    return { active: false, isAbsent: true, reason: "Ausente", startTime: null, lastResetTime: null };
  }

  // Priority 1: Direct student record (Individual student action ALWAYS takes top priority)
  if (latestDirect) {
    const isDirectActive = latestDirect.active === true || String(latestDirect.active) === "true";
    if (!isDirectActive) {
      return { active: false, isAbsent: false, reason: null, startTime: null, lastResetTime: null };
    } else {
      const startTime = latestDirect.startTime || findExistingStartTime() || new Date().toISOString();
      const lastResetTime = latestDirect.lastResetTime || startTime;
      return { active: true, isAbsent: false, reason: null, startTime, lastResetTime };
    }
  }

  // Priority 2: Direct localStorage check
  if (localExplicitFalse && !localActiveFlag) {
    return { active: false, isAbsent: false, reason: null, startTime: null, lastResetTime: null };
  }

  // Priority 3: Classroom collective record
  if (latestClassroom && !localExplicitFalse) {
    const isClassroomActive = latestClassroom.active === true || String(latestClassroom.active) === "true";
    if (isClassroomActive) {
      const startTime = latestClassroom.startTime || findExistingStartTime() || new Date().toISOString();
      const lastResetTime = latestClassroom.lastResetTime || startTime;
      return { active: true, isAbsent: false, reason: null, startTime, lastResetTime };
    } else {
      return { active: false, isAbsent: false, reason: null, startTime: null, lastResetTime: null };
    }
  }

  if (localActiveFlag && !localExplicitFalse) {
    const startTime = findExistingStartTime() || new Date().toISOString();
    return { active: true, isAbsent: false, reason: null, startTime, lastResetTime: startTime };
  }

  return { active: false, isAbsent: false, reason: null, startTime: null, lastResetTime: null };
}

`;
  dataCode = dataCode.substring(0, shiftStateStart) + newShiftStateFunc + dataCode.substring(shiftStateEnd);
  fs.writeFileSync('src/data.ts', dataCode, 'utf8');
  console.log('src/data.ts getShiftActiveState updated successfully!');
}

// 2. Refine handleDirectStopShift in src/components/Dashboard.tsx
let dbCode = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const directStopOld = dbCode.substring(
  dbCode.indexOf('const handleDirectStopShift = () => {'),
  dbCode.indexOf('const handleConfirmStopIndividualShift = () => {')
);

const directStopNew = `const handleDirectStopShift = () => {
    try {
      const horaStr = getNowTimeBr();
      const cleanName = (idoso.nome || '').split(' (')[0].trim();
      const studentRoom = idoso.salaAula || idoso.quarto || getStudentRoomName(idoso);
      
      const candidateKeysToClose = Array.from(new Set([
        ...getAllPossibleStudentKeys(idoso.id),
        idoso.id,
        idoso.nome,
        cleanName,
        targetId
      ].filter(Boolean))) as string[];

      candidateKeysToClose.forEach(k => {
        localStorage.setItem('anjo_shift_active_' + k, 'false');
        localStorage.removeItem('anjo_shift_start_time_' + k);
        localStorage.removeItem('anjo_routine_reset_' + k);
      });

      setShiftActiveStatesBatch(candidateKeysToClose.map(k => ({ targetKey: k, active: false })));
      setIsShiftActive(false);
      setShiftStartTime(null);
      setElapsedShiftTime('00:00:00');

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('anjo_shift_updated'));
        window.dispatchEvent(new CustomEvent('anjo_user_updated'));
        window.dispatchEvent(new CustomEvent('db-vitals-update'));
      }

      showToast(' Cronometro desligado e zerado para 00:00:00 com sucesso!', 'success');
    } catch (err) {
      console.error('Erro ao desligar cronometro:', err);
      setIsShiftActive(false);
      setShiftStartTime(null);
      setElapsedShiftTime('00:00:00');
    }
  };

  `;

if (directStopOld) {
  dbCode = dbCode.replace(directStopOld, directStopNew);
  console.log('Dashboard handleDirectStopShift updated successfully!');
}

fs.writeFileSync('src/components/Dashboard.tsx', dbCode, 'utf8');
console.log('src/components/Dashboard.tsx updated successfully!');
