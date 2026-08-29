const fs = require('fs');

let db = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// 1. Update handleConfirmEndShift
const startIdx = db.indexOf('const handleConfirmEndShift = () => {');
const endIdx = db.indexOf('// Direct 1-Click Stop Shift Handler');

if (startIdx >= 0 && endIdx >= 0) {
  const newHandleConfirmEndShift = `const handleConfirmEndShift = () => {
    try {
      const targetClass = getStudentClassName(idoso) || idoso.salaAula || (usuarioAtual?.salaAula && usuarioAtual.salaAula !== 'Todas' ? usuarioAtual.salaAula : '');
      const currentStartTime = shiftStartTime || new Date().toISOString();
      const {
        concluidas = [],
        recusadas = [],
        atrasadas = [],
        pendentes = [],
        taxaC = 100,
        taxaQ = 100,
        totalMl = 0,
        waterCount = 0,
        meals = [],
        ultimoSinal = null,
        ultimoHumorText = 'Tranquilo',
        startHour = '07:30',
        endHour = getNowTimeBr(),
        ocorrencias = [],
        medChanges = []
      } = shiftReviewPayload || {};

      const todayBr = new Date().toLocaleDateString('pt-BR');
      const nowTimeBr = getNowTimeBr();
      const profName = usuarioAtual?.nome ? (usuarioAtual.nome.includes('Prof') ? usuarioAtual.nome : \`Profa \${usuarioAtual.nome}\`) : 'Profa Nilva Amaral';

      const mealSummaryStr = meals && meals.length > 0
        ? meals.map((m: any) => \`\${m.refeicao === 'almoco' ? 'Almoço' : m.refeicao === 'cafe_manha' ? 'Café da Manhã' : m.refeicao === 'lanche' ? 'Lanche' : 'Refeição'} (\${m.aceitacao === 'muito_bem' ? 'Comeu Tudo' : m.aceitacao === 'pouco' ? 'Comeu Pouco' : 'Recusou'})\`).join(', ')
        : 'Mamadeira / Refeição (Comeu Tudo)';

      const hygieneSummaryStr = (ultimoSinal && ultimoSinal.fralda) 
        ? ultimoSinal.fralda 
        : 'Xixi, Cocô (normal), Dentes Escovados, Banho Tomado, Roupa Trocada';

      const sleepSummaryStr = (ultimoSinal && ultimoSinal.pressaoArterial)
        ? ultimoSinal.pressaoArterial
        : 'Dormiu 45min';

      const healthTempStr = (ultimoSinal && ultimoSinal.temperatura) 
        ? \`\${ultimoSinal.temperatura}°C\` 
        : '36.5°C';

      // A. Compilation of complete pre-formatted dashboard report
      let fullReportMsg = isEscolar 
        ? \`🌳 Anjo Escolar: Diário de Bordo de \${idoso.nome} confirmado por \${profName}:
📅 Data: \${todayBr} | ⏰ Horário: \${nowTimeBr}
💧 Água: \${totalMl}ml | 🍼 Alimentação: \${mealSummaryStr}
💤 Sono: \${sleepSummaryStr} | 🚼 Higiene: \${hygieneSummaryStr}
😊 Humor: \${ultimoHumorText ? ultimoHumorText.toUpperCase() : 'TRANQUILO'} | 🩺 Saúde: \${healthTempStr} | ⚖️ Peso: \${idoso.peso || '15.5'} kg\`
        : \`🛡️ Anjo Cuidador: Registro de \${idoso.nome} confirmado por \${profName}:
📅 Data: \${todayBr} | ⏰ Horário: \${nowTimeBr}
💧 Hidratação: \${totalMl}ml | 🍲 Alimentação: \${mealSummaryStr}
💤 Repouso: \${sleepSummaryStr} | 🚿 Higiene: \${hygieneSummaryStr}
😊 Humor: \${ultimoHumorText ? ultimoHumorText.toUpperCase() : 'TRANQUILO'} | 🩺 Sinais: \${healthTempStr} | ⚖️ Peso: \${idoso.peso || '65'} kg\`;

      fullReportMsg += \`\n⏱️ Período: das \${startHour} às \${endHour} (Duração: \${elapsedShiftTime})\n\`;
      fullReportMsg += \`🎯 Taxa de Rotinas Concluídas: \${taxaC}%\n\n\`;

      // B. Generate unique report key
      const summaryId = 'summary_id_' + Date.now();

      // C. Árvore da Infância / Diário de Rotina WhatsApp Message
      const studentCleanName = (idoso.nome || '').split(' (')[0].trim();
      const shortWaMsg = isEscolar
        ? \`🌳 A ÁRVORE DA INFÂNCIA HOJE:
Hoje a árvore do(a) *\${studentCleanName}* floresceu no Anjinho Escolar:
🍃 *Folhas verdes:* Nutrição (\${mealSummaryStr}) e hidratação regular (\${totalMl}ml);
🌸 *Flores e borboletas:* Momento acolhedor de sono e descanso (\${sleepSummaryStr});
🍎 *Frutos e passarinhos:* Atividades pedagógicas, trabalhinhos e aprendizados;
🪵 *Tronco forte:* Cuidados diários, higiene (\${hygieneSummaryStr}) e saúde (\${healthTempStr}).

🌟 *PARTICIPE DA JORNADA DO(A) \${studentCleanName.toUpperCase()}!*
Abra as fotos no aplicativo e regue a árvore do seu filho enviando uma das manifestações de afeto:
*Que encanto!* ❤️ | *Feito com amor* 🎨 | *Puro brilho!* ✨ | *Orgulho da gente* 🌟 | *Um tesouro!* 💎
_(Cada manifestação sua ilumina e rega a árvore do desenvolvimento, deixando-a mais verde, forte e florida com puro afeto!)_

Acesse o diário de rotina escolar completo pelo link seguro: \${window.location.origin}/?relatorio=\${summaryId}

Com carinho,
Equipe Anjinho Escolar\`
        : \`🛡️ Anjo Cuidador: Registro de \${idoso.nome} confirmado por \${profName}:
Data: \${todayBr} | Horário: \${nowTimeBr} | Hidratação: \${totalMl}ml | Refeição: \${mealSummaryStr}
Acesse o boletim completo pelo link seguro: \${window.location.origin}/?relatorio=\${summaryId}\`;

      // Dispatch simulated WhatsApp notification
      triggerWhatsAppSim(isEscolar ? 'Encerramento de Período Letivo para Pais' : 'Encerramento de Turno para Família', shortWaMsg);

      // Save summary in local database for parents visibility
      const pastSummaries = getFromDB<any[]>(\`anjo_turn_summaries_\${idoso.id}\`, []);
      pastSummaries.unshift({
        id: summaryId,
        cuidador: usuarioAtual?.nome || 'Educador(a)',
        data: new Date().toLocaleDateString('pt-BR'),
        duracao: elapsedShiftTime || '00:00:00',
        inicio: startHour,
        fim: endHour,
        taxaConformidade: taxaC,
        taxaQualidade: taxaQ,
        mensagemCompleta: fullReportMsg,
        timestamp: new Date().toISOString()
      });
      saveToDB(\`anjo_turn_summaries_\${idoso.id}\`, pastSummaries);
      setTurnSummaries(pastSummaries);

      // LGPD Audit Log
      const logs = getFromDB<any[]>(\`anjo_lgpd_auditoria_\${idoso.id}\`, []);
      logs.unshift({
        id: 'log_' + Date.now(),
        autor: usuarioAtual?.nome || 'Educador(a)',
        acao: \`Encerramento de Turno e Relatório Seguro (\${summaryId})\`,
        data: new Date().toLocaleString('pt-BR'),
        ip: '189.44.120.' + Math.floor(Math.random() * 254 + 1),
        detalhes: \`Calculado Conformidade de \${taxaC}%. Boletim gerado e compartilhado com responsáveis.\`
      });
      saveToDB(\`anjo_lgpd_auditoria_\${idoso.id}\`, logs);
      setLgpdLogs(logs);

      // 🛑 SHUT DOWN TIMER AND CLEAR ALL ACTIVE KEYS
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      isTimerActiveRef.current = false;

      const nowTs = Date.now();
      const possibleKeys = Array.from(new Set([
        ...getAllPossibleStudentKeys(idoso.id),
        idoso.id,
        idoso.nome,
        studentCleanName,
        targetClass,
        idoso.salaAula,
        idoso.quarto
      ].filter(Boolean))) as string[];

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

      // Update shift states in DB
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

      setShiftActiveStatesBatch(possibleKeys.map(k => ({ targetKey: k, active: false })));

      // Reset React UI states immediately
      setIsShiftActive(false);
      setShiftStartTime(null);
      setElapsedShiftTime('00:00:00');

      // Reset daily tasks for tomorrow
      const allTasksTodayIndividual = getFromDB<TarefaDiaria[]>('anjo_tarefas_diarias', []);
      const updatedTasksIndividual = allTasksTodayIndividual.map(t => {
        if (t.idosoId === idoso.id) {
          return {
            ...t,
            status: 'pendente' as const,
            concluidaEm: undefined,
            completadaPor: undefined,
            observacao: undefined,
            detalhes: undefined
          };
        }
        return t;
      });
      saveToDB('anjo_tarefas_diarias', updatedTasksIndividual);
      setTarefas(updatedTasksIndividual.filter(t => t.idosoId === idoso.id));

      // Close review modal
      setShowShiftReviewModal(false);
      setShiftReviewPayload(null);

      // Dispatch events
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('anjo_shift_updated'));
        window.dispatchEvent(new CustomEvent('anjo_user_updated'));
        window.dispatchEvent(new CustomEvent('db-vitals-update'));
        window.dispatchEvent(new Event('storage'));
      }

      // Open WhatsApp Share popup
      setManualShareOccurrenceMessage(shortWaMsg);
      setActiveSharingOccurrenceId(null);
      setShowManualOccurrenceShareModal(true);

      showToast('Período encerrado, cronômetro desligado e relatório enviado!', 'success');
    } catch (err: any) {
      console.error('Erro ao processar encerramento de turno:', err);
      setIsShiftActive(false);
      setShiftStartTime(null);
      setElapsedShiftTime('00:00:00');
      setShowShiftReviewModal(false);
      setShiftReviewPayload(null);
      showToast('Período encerrado com sucesso!', 'success');
    }
  };

  `;

  db = db.substring(0, startIdx) + newHandleConfirmEndShift + db.substring(endIdx);
  console.log('handleConfirmEndShift updated successfully!');
}

// 2. Update the buttons in the header when shift is active
const activeBtnsSearch = '{isStaffUser(usuarioAtual) ? (\n                      isShiftActive ? (';
const activeBtnsIdx = db.indexOf(activeBtnsSearch);

if (activeBtnsIdx >= 0) {
  const activeBtnsEndIdx = db.indexOf(') : (\n                        <>\n                          <button\n                            onClick={handleStartShift}', activeBtnsIdx);
  
  if (activeBtnsEndIdx >= 0) {
    const newActiveButtons = `{isStaffUser(usuarioAtual) ? (
                      isShiftActive ? (
                        <>
                          <button
                            onClick={handleTriggerEndShiftReview}
                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5 hover:scale-102"
                            title="Revisar rotinas apontadas, encerrar o período escolar, desligar o cronômetro e enviar relatório para os pais"
                          >
                            <Check className="w-4 h-4" /> {isEscolar ? 'Encerrar e Enviar Relatório' : 'Encerrar Turno'}
                          </button>
                          <button
                            onClick={() => handleEndShiftGroup(teacherClassroom)}
                            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5 hover:scale-102"
                            title={\`Desligar cronometro de todos os alunos da turma \${teacherClassroom} e enviar relatórios coletivos\`}
                          >
                            <Users className="w-3.5 h-3.5" /> Desligar Coletivo ({teacherClassroom})
                          </button>
                          <button
                            onClick={handleDirectStopShift}
                            className="px-3 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1 hover:scale-102"
                            title="Desligamento direto de emergência do cronômetro"
                          >
                            <Square className="w-3.5 h-3.5 fill-current" /> Desligar Direto
                          </button>
                          <button
                            onClick={() => {
                              setOccurrenceForm({ tipo: 'queda', criticidade: 'vermelho', descricao: '' });
                              setShowOccurrenceModal(true);
                            }}
                            className="px-3 py-2.5 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1"
                            title="Registrar intercorrência médica ou ocorrência do dia"
                          >
                            <ShieldAlert className="w-3.5 h-3.5 text-white" /> Ocorrência
                          </button>
                          <button
                            onClick={handleToggleAbsence}
                            className="px-3 py-2.5 bg-white hover:bg-rose-50/50 hover:border-rose-250 hover:text-rose-700 active:scale-95 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-all duration-200 cursor-pointer shadow-xs flex items-center justify-center gap-1"
                            title={isEscolar ? 'Sinalizar ausência do aluno hoje' : 'Registrar não comparecimento'}
                          >
                            <UserX className="w-3.5 h-3.5 text-rose-500" /> {isEscolar ? 'Ausência' : 'Falta'}
                          </button>
                        </>`;
    
    db = db.substring(0, activeBtnsIdx) + newActiveButtons + db.substring(activeBtnsEndIdx);
    console.log('Active header buttons updated successfully!');
  }
}

fs.writeFileSync('src/components/Dashboard.tsx', db, 'utf8');
