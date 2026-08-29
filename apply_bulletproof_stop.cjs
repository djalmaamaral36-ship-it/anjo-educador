const fs = require('fs');

// 1. In src/components/Dashboard.tsx, let's make sure:
// a) isShiftActive state is direct and not overwritten if locally inactive
// b) handleDirectStopShift is totally bulletproof and wipes any shift states
// c) handleStartShift and handleStartShiftGroup set an exact clean timestamp

let db = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// Patch handleDirectStopShift to be completely destructive to active shift states
const oldStopFunc = db.substring(
  db.indexOf('const handleDirectStopShift = () => {'),
  db.indexOf('const handleConfirmStopIndividualShift = () => {')
);

const newStopFunc = `const handleDirectStopShift = () => {
    console.log('🛑 [STOP SHIFT] Botão Zerar/Desligar clicado!');
    try {
      // 1. Limpa intervalo imediatamente
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      isTimerActiveRef.current = false;

      // 2. Apaga chaves de timer no localStorage
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(k => {
        if (
          k === 'anjo_shift_active' ||
          k === 'anjo_shift_start_time' ||
          k.includes('shift_start_time') ||
          k.includes('shift_active') ||
          k.includes('routine_reset')
        ) {
          try {
            localStorage.removeItem(k);
          } catch(e) {}
        }
      });

      // 3. Força chaves como false
      try {
        localStorage.setItem('anjo_shift_active', 'false');
        localStorage.setItem('anjo_shift_active_' + idoso.id, 'false');
      } catch(e) {}

      // 4. Limpa registro no banco local anjo_shift_states
      try {
        const existingStates = getFromDB<any[]>('anjo_shift_states', []);
        const cleanStates = existingStates.filter(s => {
          if (!s || !s.id) return false;
          const sid = String(s.id).toLowerCase();
          return !sid.includes(idoso.id.toLowerCase()) && !sid.includes('aluno') && !sid.includes('idoso');
        });
        saveToDB('anjo_shift_states', cleanStates);
      } catch(e) {}

      // 5. Zera estados visuais do React IMEDIATAMENTE
      setIsShiftActive(false);
      setShiftStartTime(null);
      setElapsedShiftTime('00:00:00');

      // 6. Notifica outros componentes
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('anjo_shift_updated'));
        window.dispatchEvent(new CustomEvent('anjo_user_updated'));
        window.dispatchEvent(new CustomEvent('db-vitals-update'));
        window.dispatchEvent(new Event('storage'));
      }

      showToast('Cronômetro zerado e desligado com sucesso!', 'success');
    } catch(err) {
      console.error('Erro ao desligar:', err);
      setIsShiftActive(false);
      setShiftStartTime(null);
      setElapsedShiftTime('00:00:00');
    }
  };

  `;

if (oldStopFunc) {
  db = db.replace(oldStopFunc, newStopFunc);
}

fs.writeFileSync('src/components/Dashboard.tsx', db, 'utf8');
console.log('src/components/Dashboard.tsx updated with bulletproof direct stop!');
