const fs = require('fs');

let db = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// 1. Update updateTimer in useEffect
const oldEffect = db.substring(
  db.indexOf('// Live timer for active caregiver shift duration'),
  db.indexOf('const loadTasks = () => {')
);

const newEffect = `// Live timer for active caregiver shift duration (Ref-based, aggressive clear & auto-expire)
  useEffect(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (isShiftActive && shiftStartTime) {
      isTimerActiveRef.current = true;

      const calculateElapsed = (startMs: number): string => {
        const diffMs = Math.max(0, Date.now() - startMs);
        const totalSecs = Math.floor(diffMs / 1000);
        const secs = totalSecs % 60;
        const mins = Math.floor(totalSecs / 60) % 60;
        const hours = Math.floor(totalSecs / 3600);
        const pad = (n: number) => String(n).padStart(2, '0');
        return pad(hours) + ':' + pad(mins) + ':' + pad(secs);
      };

      const updateTimer = () => {
        const currentActive = localStorage.getItem('anjo_shift_active_' + idoso.id) || localStorage.getItem('anjo_shift_active');
        if (currentActive === 'false' || !isTimerActiveRef.current) {
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
          isTimerActiveRef.current = false;
          setIsShiftActive(false);
          setShiftStartTime(null);
          setElapsedShiftTime('00:00:00');
          return;
        }

        let startMs = 0;
        const activeStartTime = shiftStartTime || localStorage.getItem('anjo_shift_start_time_' + idoso.id);
        if (activeStartTime) {
          const parsed = new Date(activeStartTime).getTime();
          if (!isNaN(parsed) && parsed > 0) {
            startMs = parsed;
          }
        }

        if (startMs === 0) {
          setElapsedShiftTime('00:00:00');
          return;
        }

        // Auto-expire stale shifts older than 14 hours (e.g. 33 hrs)
        if ((Date.now() - startMs) > (14 * 60 * 60 * 1000)) {
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
          isTimerActiveRef.current = false;
          setIsShiftActive(false);
          setShiftStartTime(null);
          setElapsedShiftTime('00:00:00');
          try {
            localStorage.setItem('anjo_shift_active', 'false');
            localStorage.setItem('anjo_shift_active_' + idoso.id, 'false');
            localStorage.removeItem('anjo_shift_start_time_' + idoso.id);
          } catch(e) {}
          return;
        }

        setElapsedShiftTime(calculateElapsed(startMs));
      };

      updateTimer();
      timerIntervalRef.current = setInterval(updateTimer, 1000);
      document.addEventListener('visibilitychange', updateTimer);

      return () => {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        document.removeEventListener('visibilitychange', updateTimer);
      };
    } else {
      isTimerActiveRef.current = false;
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      setElapsedShiftTime('00:00:00');
    }
  }, [isShiftActive, shiftStartTime, idoso.id]);

  `;

if (oldEffect) {
  db = db.replace(oldEffect, newEffect);
}

// 2. Ensure handleDirectStopShift comprehensively disables all student and classroom keys
const oldDirectStop = db.substring(
  db.indexOf('const handleDirectStopShift = () => {'),
  db.indexOf('const handleConfirmStopIndividualShift = () => {')
);

const newDirectStop = `const handleDirectStopShift = () => {
    console.log('🛑 [STOP SHIFT] Desligando cronômetro e encerrando período...');
    try {
      // 1. Limpa intervalo imediatamente
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      isTimerActiveRef.current = false;

      const nowTs = Date.now();
      const possibleKeys = getAllPossibleStudentKeys(idoso.id);
      possibleKeys.push(idoso.id);
      if (idoso.nome) {
        possibleKeys.push(idoso.nome);
        possibleKeys.push(idoso.nome.split(' (')[0].trim());
      }
      const room = getStudentClassName(idoso);
      if (room) possibleKeys.push(room);

      // 2. Apaga e marca como inativo com timestamp
      localStorage.setItem('anjo_shift_active', 'false');
      localStorage.setItem('anjo_shift_active_ts', String(nowTs));

      possibleKeys.forEach(k => {
        if (!k) return;
        try {
          localStorage.setItem('anjo_shift_active_' + k, 'false');
          localStorage.setItem('anjo_shift_active_' + k + '_ts', String(nowTs));
          localStorage.removeItem('anjo_shift_start_time_' + k);
          localStorage.removeItem('anjo_routine_reset_' + k);
        } catch(e) {}
      });

      // 3. Limpa todas as chaves residuais de start_time do localStorage
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(k => {
        if (k.includes('shift_start_time') || k.includes('shift_active')) {
          if (!k.endsWith('_ts')) {
            try {
              localStorage.removeItem(k);
              localStorage.setItem(k, 'false');
            } catch(e) {}
          }
        }
      });

      // 4. Salva no banco anjo_shift_states como inativo
      try {
        const existingStates = getFromDB<any[]>('anjo_shift_states', []);
        const cleanStates = existingStates.map(s => {
          if (!s || !s.id) return s;
          const sid = String(s.id).toLowerCase();
          if (possibleKeys.some(pk => pk.toLowerCase() === sid || sid.includes(pk.toLowerCase()))) {
            return { ...s, active: false, startTime: null, updatedAt: new Date().toISOString() };
          }
          return s;
        });
        saveToDB('anjo_shift_states', cleanStates);
      } catch(e) {}

      // 5. Zera estados visuais do React IMEDIATAMENTE
      setIsShiftActive(false);
      setShiftStartTime(null);
      setElapsedShiftTime('00:00:00');

      // 6. Notifica todos os componentes
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('anjo_shift_updated'));
        window.dispatchEvent(new CustomEvent('anjo_user_updated'));
        window.dispatchEvent(new CustomEvent('db-vitals-update'));
        window.dispatchEvent(new Event('storage'));
      }

      showToast('Período encerrado e cronômetro desligado com sucesso!', 'success');
    } catch(err) {
      console.error('Erro ao desligar:', err);
      setIsShiftActive(false);
      setShiftStartTime(null);
      setElapsedShiftTime('00:00:00');
    }
  };

  `;

if (oldDirectStop) {
  db = db.replace(oldDirectStop, newDirectStop);
}

fs.writeFileSync('src/components/Dashboard.tsx', db, 'utf8');
console.log('Dashboard.tsx successfully updated!');
