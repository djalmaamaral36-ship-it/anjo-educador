const fs = require('fs');

let dbCode = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// 1. Add timerIntervalRef and isTimerActiveRef
const targetRefSearch = "const [elapsedShiftTime, setElapsedShiftTime] = useState<string>('00:00:00');";
const newRefs = `const [elapsedShiftTime, setElapsedShiftTime] = useState<string>('00:00:00');
  const timerIntervalRef = useRef<any>(null);
  const isTimerActiveRef = useRef<boolean>(false);`;

if (dbCode.includes(targetRefSearch) && !dbCode.includes('timerIntervalRef')) {
  dbCode = dbCode.replace(targetRefSearch, newRefs);
}

// 2. Replace the timer useEffect
const oldEffectStart = dbCode.indexOf('// Live timer for active caregiver shift duration');
const oldEffectEnd = dbCode.indexOf('const loadTasks = () => {');

if (oldEffectStart !== -1 && oldEffectEnd !== -1) {
  const newEffect = `// Live timer for active caregiver shift duration (Ref-based, aggressive clear)
  useEffect(() => {
    // Limpa qualquer intervalo anterior ativo
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

  dbCode = dbCode.substring(0, oldEffectStart) + newEffect + dbCode.substring(oldEffectEnd);
}

// 3. Replace handleDirectStopShift with the aggressive stop routine
const oldDirectStart = dbCode.indexOf('const handleDirectStopShift = () => {');
const oldDirectEnd = dbCode.indexOf('const handleConfirmStopIndividualShift = () => {');

if (oldDirectStart !== -1 && oldDirectEnd !== -1) {
  const newDirect = `const handleDirectStopShift = () => {
    console.log('🛑 [STOP SHIFT] Iniciando parada agressiva...');
    try {
      // 1. PARA O INTERVALO IMEDIATAMENTE
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      isTimerActiveRef.current = false;

      // 2. Remove TODAS as chaves de timer do localStorage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (
          k === 'anjo_shift_start_time' ||
          k === 'anjo_shift_active' ||
          k.includes('shift_start_time') ||
          k.includes('routine_reset') ||
          k.startsWith('anjo_shift_active_')
        )) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));

      // Marca explicitamente como desligado
      localStorage.setItem('anjo_shift_active', 'false');
      localStorage.setItem('anjo_shift_active_' + idoso.id, 'false');

      const candidateKeysToClose = Array.from(new Set([
        ...getAllPossibleStudentKeys(idoso.id),
        idoso.id,
        idoso.nome,
        (idoso.nome || '').split(' (')[0].trim()
      ].filter(Boolean)));

      candidateKeysToClose.forEach(k => {
        localStorage.setItem('anjo_shift_active_' + k, 'false');
        localStorage.removeItem('anjo_shift_start_time_' + k);
      });

      setShiftActiveStatesBatch(candidateKeysToClose.map(k => ({ targetKey: k, active: false })));

      // 3. Zera o estado React IMEDIATAMENTE
      setIsShiftActive(false);
      setShiftStartTime(null);
      setElapsedShiftTime('00:00:00');

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('anjo_shift_updated'));
        window.dispatchEvent(new CustomEvent('anjo_user_updated'));
        window.dispatchEvent(new CustomEvent('db-vitals-update'));
        window.dispatchEvent(new Event('storage'));
      }

      showToast('🛑 Cronômetro desligado e zerado para 00:00:00!', 'success');
      console.log('✅ [STOP SHIFT] Cronômetro parado e zerado com sucesso.');
    } catch (err) {
      console.error('Erro ao parar cronometro:', err);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      isTimerActiveRef.current = false;
      setIsShiftActive(false);
      setShiftStartTime(null);
      setElapsedShiftTime('00:00:00');
    }
  };

  `;

  dbCode = dbCode.substring(0, oldDirectStart) + newDirect + dbCode.substring(oldDirectEnd);
}

fs.writeFileSync('src/components/Dashboard.tsx', dbCode, 'utf8');
console.log('Dashboard.tsx successfully updated with ref-based aggressive stop timer!');
