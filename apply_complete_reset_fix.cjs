const fs = require('fs');

// 1. Update src/data.ts to ensure reset/stop cleans everything thoroughly and getShiftActiveState defaults to INACTIVE unless explicitly true
let dataCode = fs.readFileSync('src/data.ts', 'utf8');

const targetFuncStart = dataCode.indexOf('export function getShiftActiveState(');
const targetFuncEnd = dataCode.indexOf('export function generateDefaultTasksForStudent(');

if (targetFuncStart !== -1 && targetFuncEnd !== -1) {
  const cleanGetShiftActiveState = `export function getShiftActiveState(studentId: string, customShiftStates?: ShiftState[]): { active: boolean; isAbsent: boolean; reason?: string | null; startTime: string | null; lastResetTime: string | null } {
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

  // Check explicit absence first
  for (const k of possibleKeys) {
    if (localStorage.getItem("anjo_is_absent_" + k) === "true") {
      return { active: false, isAbsent: true, reason: "Ausente", startTime: null, lastResetTime: null };
    }
  }

  // Check explicit individual localStorage active / inactive
  let isExplicitlyInactiveLocally = false;
  let isExplicitlyActiveLocally = false;
  let localStartTime: string | null = null;

  for (const k of possibleKeys) {
    const act = localStorage.getItem("anjo_shift_active_" + k);
    if (act === "false") {
      isExplicitlyInactiveLocally = true;
    } else if (act === "true") {
      isExplicitlyActiveLocally = true;
      const st = localStorage.getItem("anjo_shift_start_time_" + k);
      if (st) localStartTime = st;
    }
  }

  if (isExplicitlyInactiveLocally && !isExplicitlyActiveLocally) {
    return { active: false, isAbsent: false, reason: null, startTime: null, lastResetTime: null };
  }

  const shiftStates = customShiftStates && Array.isArray(customShiftStates) 
    ? customShiftStates 
    : getFromDB<ShiftState[]>("anjo_shift_states", []);

  // Check state database for this student
  const directRecords: { record: ShiftState; time: number }[] = [];
  shiftStates.forEach(s => {
    if (!s || !s.id) return;
    const sid = String(s.id).trim();
    let time = 0;
    if (s.updatedAt) {
      const p = new Date(s.updatedAt).getTime();
      if (!isNaN(p)) time = p;
    }
    if (possibleKeys.some(pk => pk === sid || keyMatches(pk, sid) || keyMatches(sid, pk))) {
      directRecords.push({ record: s, time });
    }
  });

  directRecords.sort((a, b) => b.time - a.time);
  const latestDirect = directRecords[0]?.record;

  if (latestDirect) {
    if (latestDirect.active === false || String(latestDirect.active) === "false") {
      return { active: false, isAbsent: false, reason: null, startTime: null, lastResetTime: null };
    }
    if (latestDirect.active === true || String(latestDirect.active) === "true") {
      const st = latestDirect.startTime || localStartTime || new Date().toISOString();
      return { active: true, isAbsent: false, reason: null, startTime: st, lastResetTime: st };
    }
  }

  if (isExplicitlyActiveLocally && localStartTime) {
    return { active: true, isAbsent: false, reason: null, startTime: localStartTime, lastResetTime: localStartTime };
  }

  return { active: false, isAbsent: false, reason: null, startTime: null, lastResetTime: null };
}

`;
  dataCode = dataCode.substring(0, targetFuncStart) + cleanGetShiftActiveState + dataCode.substring(targetFuncEnd);
  fs.writeFileSync('src/data.ts', dataCode, 'utf8');
  console.log('src/data.ts patched!');
}

// 2. Patch Dashboard.tsx
let dbCode = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// Ensure handleDirectStopShift cleanly stops and cleans
const oldDirectStop = dbCode.substring(
  dbCode.indexOf('const handleDirectStopShift = () => {'),
  dbCode.indexOf('const handleConfirmStopIndividualShift = () => {')
);

const newDirectStop = `const handleDirectStopShift = () => {
    try {
      const cleanName = (idoso.nome || '').split(' (')[0].trim();
      const currentTargetId = idoso.id;
      
      const candidateKeysToClose = Array.from(new Set([
        ...getAllPossibleStudentKeys(idoso.id),
        idoso.id,
        idoso.nome,
        cleanName,
        currentTargetId,
        'aluno_1',
        'aluno_2',
        'idoso_maria',
        'idoso_joao'
      ].filter(Boolean))) as string[];

      // Clear all timer keys from localStorage
      candidateKeysToClose.forEach(k => {
        try {
          localStorage.setItem('anjo_shift_active_' + k, 'false');
          localStorage.removeItem('anjo_shift_start_time_' + k);
          localStorage.removeItem('anjo_routine_reset_' + k);
        } catch (e) {}
      });

      // Update state batch
      setShiftActiveStatesBatch(candidateKeysToClose.map(k => ({ targetKey: k, active: false })));
      
      // Immediately zero out local state
      setIsShiftActive(false);
      setShiftStartTime(null);
      setElapsedShiftTime('00:00:00');

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('anjo_shift_updated'));
        window.dispatchEvent(new CustomEvent('anjo_user_updated'));
        window.dispatchEvent(new CustomEvent('db-vitals-update'));
        window.dispatchEvent(new Event('storage'));
      }

      showToast('Cronômetro zerado e desligado com sucesso!', 'success');
    } catch (err) {
      console.error('Erro ao desligar cronometro:', err);
      setIsShiftActive(false);
      setShiftStartTime(null);
      setElapsedShiftTime('00:00:00');
    }
  };

  `;

if (oldDirectStop) {
  dbCode = dbCode.replace(oldDirectStop, newDirectStop);
}

// Ensure timer useEffect zeros out when isShiftActive is false or no shiftStartTime
const oldTimerEffect = dbCode.substring(
  dbCode.indexOf('// Live timer for active caregiver shift duration'),
  dbCode.indexOf('const loadTasks = () => {')
);

const newTimerEffect = `// Live timer for active caregiver shift duration
  useEffect(() => {
    let intervalId: any;
    if (isShiftActive && shiftStartTime) {
      const updateTimer = () => {
        let startMs = 0;
        const activeStartTime = shiftStartTime || localStorage.getItem(\`anjo_shift_start_time_\${idoso.id}\`);
        
        if (activeStartTime) {
          const parsed = new Date(activeStartTime).getTime();
          if (!isNaN(parsed) && parsed > 0) {
            startMs = parsed;
          } else if (typeof activeStartTime === 'string' && activeStartTime.includes(':')) {
            const parts = activeStartTime.split(':');
            const d = new Date();
            d.setHours(parseInt(parts[0], 10) || 0, parseInt(parts[1], 10) || 0, 0, 0);
            startMs = d.getTime();
          }
        }

        if (startMs === 0 || isNaN(startMs)) {
          setElapsedShiftTime('00:00:00');
          return;
        }

        const now = Date.now();
        const diffMs = Math.max(0, now - startMs);

        const totalSecs = Math.floor(diffMs / 1000);
        const secs = totalSecs % 60;
        const mins = Math.floor(totalSecs / 60) % 60;
        const hours = Math.floor(totalSecs / 3600);

        const pad = (n: number) => String(n).padStart(2, '0');
        setElapsedShiftTime(\`\${pad(hours)}:\${pad(mins)}:\${pad(secs)}\`);
      };
      
      updateTimer();
      intervalId = setInterval(updateTimer, 1000);
      document.addEventListener('visibilitychange', updateTimer);

      return () => {
        if (intervalId) clearInterval(intervalId);
        document.removeEventListener('visibilitychange', updateTimer);
      };
    } else {
      setElapsedShiftTime('00:00:00');
    }
  }, [isShiftActive, shiftStartTime, idoso.id]);

  `;

if (oldTimerEffect) {
  dbCode = dbCode.replace(oldTimerEffect, newTimerEffect);
}

// Add a quick direct reset button in the shift bar for absolute reassurance
const timerDisplayOld = `<div className={\`px-4 py-2.5 rounded-xl border leading-none transition-all duration-300 \${isShiftActive ? 'bg-white border-emerald-300 shadow-xs' : 'bg-slate-100 border-slate-200'}\`}>
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">
                        {isEscolar ? 'TEMPO EM AULA' : 'DURACAO DO TURNO'}
                      </span>
                      {isShiftActive && isStaffUser(usuarioAtual) && (
                        <button
                          onClick={handleDirectStopShift}
                          className="text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-1.5 py-0.5 rounded cursor-pointer transition-all"
                          title="Desligar cronometro imediatamente"
                        >
                           Desligar
                        </button>
                      )}
                    </div>
                    <strong className={\`text-2xl font-mono tracking-tight \${isShiftActive ? 'text-emerald-700' : 'text-slate-400'}\`}>
                      {isShiftActive ? elapsedShiftTime : '00:00:00'}
                    </strong>
                  </div>`;

const timerDisplayNew = `<div className={\`px-4 py-2.5 rounded-xl border leading-none transition-all duration-300 \${isShiftActive ? 'bg-white border-emerald-300 shadow-xs' : 'bg-slate-100 border-slate-200'}\`}>
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">
                        {isEscolar ? 'TEMPO EM AULA' : 'DURACAO DO TURNO'}
                      </span>
                      {isStaffUser(usuarioAtual) && (
                        <button
                          type="button"
                          onClick={handleDirectStopShift}
                          className="text-[10px] font-black text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-md cursor-pointer transition-all border border-rose-200"
                          title="Zerar cronômetro e encerrar contagem imediatamente"
                        >
                          ⏹ Zerar / Desligar
                        </button>
                      )}
                    </div>
                    <strong className={\`text-2xl font-mono tracking-tight \${isShiftActive ? 'text-emerald-700' : 'text-slate-400'}\`}>
                      {isShiftActive ? elapsedShiftTime : '00:00:00'}
                    </strong>
                  </div>`;

if (dbCode.includes(timerDisplayOld)) {
  dbCode = dbCode.replace(timerDisplayOld, timerDisplayNew);
}

fs.writeFileSync('src/components/Dashboard.tsx', dbCode, 'utf8');
console.log('src/components/Dashboard.tsx patched successfully!');
