const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// 1. Direct Stop Shift Handler
const directStopOld = code.substring(
  code.indexOf('const handleDirectStopShift = () => {'),
  code.indexOf('const handleConfirmStopIndividualShift = () => {')
);

const directStopNew = `const handleDirectStopShift = () => {
    try {
      const horaStr = getNowTimeBr();
      const cleanName = (idoso.nome || '').split(' (')[0].trim();
      
      const candidateKeysToClose = Array.from(new Set([
        ...getAllPossibleStudentKeys(idoso.id),
        idoso.id,
        idoso.nome,
        cleanName
      ].filter(Boolean))) as string[];

      candidateKeysToClose.forEach(k => {
        localStorage.setItem('anjo_shift_active_' + k, 'false');
        localStorage.removeItem('anjo_shift_start_time_' + k);
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

      showToast(' Cronometro desligado com sucesso!', 'success');
    } catch (err) {
      console.error('Erro ao desligar cronometro:', err);
      setIsShiftActive(false);
      setShiftStartTime(null);
      setElapsedShiftTime('00:00:00');
    }
  };

  `;

if (directStopOld) {
  code = code.replace(directStopOld, directStopNew);
  console.log('Direct stop shift handler updated successfully!');
}

// 2. Full Meal Select with Mamadeira default
const oldMealSelectBlock = code.substring(
  code.indexOf('<div className="grid grid-cols-2 gap-2">'),
  code.indexOf('{quickMeal.refeicao === \'mamadeira\' && (')
);

const newMealSelectBlock = `<div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Refeicao</label>
                      <select
                        value={quickMeal.refeicao}
                        onChange={e => setQuickMeal({ ...quickMeal, refeicao: e.target.value })}
                        className="w-full text-xs font-bold px-2.5 py-2 border border-[#cbd5e1] rounded-xl bg-white text-slate-800 focus:ring-1 focus:outline-hidden"
                      >
                        <option value="mamadeira">🍼 Mamadeira de Leite</option>
                        <option value="lanche_manha">🥪 Lanche da Manha / Frutas</option>
                        <option value="almoco">🍲 Almoco Saudavel / Papinha</option>
                        <option value="lanche_tarde">🍎 Frutinhas / Lanche da Tarde</option>
                        <option value="jantar">🥣 Jantar / Sopinha</option>
                        <option value="agua">💧 Garrafinha de Agua</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Aceitacao</label>
                      <select 
                        value={quickMeal.aceitacao} 
                        onChange={e => setQuickMeal({...quickMeal, aceitacao: e.target.value})}
                        className="w-full text-xs font-semibold px-2 py-2 border border-[#cbd5e1] rounded-xl bg-slate-50"
                      >
                        <option value="muito_bem">Tomou Tudo / Super Bem</option>
                        <option value="metade">Tomou a Maior Parte</option>
                        <option value="pouco">Tomou Pouquinho</option>
                        <option value="recusou">Recusou</option>
                      </select>
                    </div>
                  </div>

                  `;

if (oldMealSelectBlock) {
  code = code.replace(oldMealSelectBlock, newMealSelectBlock);
  console.log('Meal select block updated successfully!');
}

// 3. Mamadeira ML Buttons
code = code.replace(
  '{[90, 120, 150, 180, 210, 240].map(vol => (',
  '{[60, 90, 120, 150, 180, 210, 240, 300].map(vol => ('
);
code = code.replace(
  'grid grid-cols-6 gap-1',
  'grid grid-cols-4 sm:grid-cols-8 gap-1.5'
);

// 4. Hygiene interactive cards in main view
code = code.replace(/if \(isStaffUser\(usuarioAtual\) && visualMode !== 'familia'\) \{\s*handleToggleHygieneCard\(([^)]+)\);\s*\}/g, 'handleToggleHygieneCard($1);');
code = code.replace(/isStaffUser\(usuarioAtual\) && visualMode !== 'familia'\s*\?\s*'cursor-pointer hover:scale-\[1\.02\] active:scale-\[0\.98\]'\s*:\s*'cursor-default opacity-95'/g, "'cursor-pointer hover:scale-[1.02] active:scale-[0.98]'");
code = code.replace(/\+ \(isStaffUser\(usuarioAtual\) && visualMode !== 'familia'\s*\?\s*' hover:bg-slate-100'\s*:\s*''\)/g, "+ ' hover:bg-slate-100'");

fs.writeFileSync('src/components/Dashboard.tsx', code, 'utf8');
console.log('Finished updating Dashboard.tsx');
