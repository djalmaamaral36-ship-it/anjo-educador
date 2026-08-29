const fs = require('fs');

let db = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// Replace handleEndShiftGroup with bulletproof implementation
const startIdx = db.indexOf('const handleEndShiftGroup =');
const endIdx = db.indexOf('const handleTriggerEndShiftReview =');

if (startIdx >= 0 && endIdx >= 0) {
  const newHandleEndShiftGroup = `const handleEndShiftGroup = (className: string) => {
    if (!isStaffUser(usuarioAtual)) {
      alert(" [!] Operação Bloqueada: Apenas educadores/cuidadores autorizados podem encerrar o período letivo coletivo!");
      return;
    }
    try {
      const targetClass = getStudentClassName(idoso) || className || (usuarioAtual?.salaAula && usuarioAtual.salaAula !== 'Todas' ? usuarioAtual.salaAula : 'Berçário I - A');
      
      const executeStopGroup = () => {
        try {
          const nowTs = Date.now();
          const nowStr = new Date().toISOString();

          // 1. Kill timer immediately
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
          isTimerActiveRef.current = false;

          // 2. Set global shift state to false in localStorage
          localStorage.setItem('anjo_shift_active', 'false');
          localStorage.setItem('anjo_shift_active_ts', String(nowTs));

          // 3. Find all students in this class
          const allSeniors = getFromDB<Idoso[]>('anjo_idosos', []);
          const classmates = allSeniors.filter(s => {
            if (!s || typeof s !== 'object' || !s.id || !s.nome) return false;
            return isStudentInRoom(s, targetClass);
          });

          if (!classmates.some(c => c.id === idoso.id)) {
            classmates.push(idoso);
          }

          // 4. Gather all keys to turn off
          const allKeysToTurnOff = new Set<string>();
          allKeysToTurnOff.add(targetClass);
          if (className) allKeysToTurnOff.add(className);

          classmates.forEach(mate => {
            if (!mate || !mate.id) return;
            allKeysToTurnOff.add(mate.id);
            getAllPossibleStudentKeys(mate.id).forEach(k => allKeysToTurnOff.add(k));
            if (mate.nome) {
              allKeysToTurnOff.add(mate.nome);
              allKeysToTurnOff.add(mate.nome.split(' (')[0].trim());
            }
          });

          // 5. Unconditionally turn off all keys in localStorage
          allKeysToTurnOff.forEach(k => {
            if (!k) return;
            try {
              localStorage.setItem('anjo_shift_active_' + k, 'false');
              localStorage.setItem('anjo_shift_active_' + k + '_ts', String(nowTs));
              localStorage.removeItem('anjo_shift_start_time_' + k);
              localStorage.removeItem('anjo_routine_reset_' + k);
            } catch(e) {}
          });

          // 6. Update database anjo_shift_states
          try {
            const existingStates = getFromDB<any[]>('anjo_shift_states', []);
            const updatedStates = existingStates.map(s => {
              if (!s || !s.id) return s;
              const sid = String(s.id).toLowerCase();
              if (Array.from(allKeysToTurnOff).some(pk => pk.toLowerCase() === sid || sid.includes(pk.toLowerCase()))) {
                return { ...s, active: false, startTime: null, updatedAt: nowStr };
              }
              return s;
            });
            saveToDB('anjo_shift_states', updatedStates);
          } catch(e) {}

          // 7. Update batch
          const endShiftUpdates = Array.from(allKeysToTurnOff).map(k => ({ targetKey: k, active: false }));
          setShiftActiveStatesBatch(endShiftUpdates);

          // 8. Reset UI states immediately
          setIsShiftActive(false);
          setShiftStartTime(null);
          setElapsedShiftTime('00:00:00');

          // 9. Generate summaries for classmates
          const allTasksToday = getFromDB<TarefaDiaria[]>('anjo_tarefas_diarias', []);
          const shareList: any[] = [];
          const initialStatuses: Record<string, 'pendente' | 'aberto' | 'confirmado'> = {};
          const allLogs = getFromDB<NotificacaoSimulada[]>('anjo_notificacoes', []);

          classmates.forEach(mate => {
            if (!mate || !mate.id) return;
            const mateTasks = allTasksToday.filter(t => t && t.idosoId === mate.id);
            const mateConcluidas = mateTasks.filter(t => t.status === 'concluido');
            const mateHids = getTodayHydrationRecords(mate.id);
            const mateTotalMl = mateHids.reduce((acc, h) => acc + (Number(h.quantidadeMl) || 0), 0);
            const totalTasks = mateTasks.length > 0 ? mateTasks.length : 5;
            const completedTasks = mateTasks.length > 0 ? mateConcluidas.length : 5;
            const taxaConformidadeCalc = Math.round((completedTasks / totalTasks) * 100);
            const summaryId = 'summary_id_' + Date.now() + '_' + mate.id;
            const mateNameClean = (mate.nome || '').includes(' (') ? mate.nome.split(' (')[0] : (mate.nome || 'Aluno');
            const startHourStr = formatShiftTime(shiftStartTime, getNowTimeBr());
            const endHourStr = getNowTimeBr();

            const mateMsg = \`🌳 A ÁRVORE DA INFÂNCIA HOJE:
Hoje a árvore do(a) *\${mateNameClean}* floresceu no Anjinho Escolar:
🍃 *Folhas verdes:* Nutrição balanceada e hidratação regular (\${mateTotalMl}ml);
🌸 *Flores e borboletas:* Momento acolhedor de sono e descanso tranquilo;
🍎 *Frutos e passarinhos:* Atividades pedagógicas, trabalhinhos e aprendizados;
🪵 *Tronco forte:* Cuidados diários, higiene completa e saúde acompanhada de perto (36.5°C).

🌟 *PARTICIPE DA JORNADA DO(A) \${mateNameClean.toUpperCase()}!*
Abra as fotos no aplicativo e regue a árvore do seu filho enviando uma das manifestações de afeto:
*Que encanto!* ❤️ | *Feito com amor* 🎨 | *Puro brilho!* ✨ | *Orgulho da gente* 🌟 | *Um tesouro!* 💎
_(Cada manifestação sua ilumina e rega a árvore do desenvolvimento, deixando-a mais verde, forte e florida com puro afeto!)_

Acesse o diário de rotina escolar completo de hoje pelo link seguro: \${window.location.origin}/?relatorio=\${summaryId}

Com carinho,
Equipe Anjinho Escolar\`;

            const primaryContact = mate.contatoEmergencia || { nome: 'Responsáveis', telefone: '11999999999' };
            const newLog: NotificacaoSimulada = {
              id: 'log_coletivo_' + Date.now() + '_' + mate.id,
              idosoId: mate.id,
              familiarNome: primaryContact.nome || 'Responsáveis',
              telefoneDestino: primaryContact.telefone || '11999999999',
              tipoCompromisso: 'Resumo Diário da Aula (Coletivo)',
              mensagem: mateMsg,
              status: 'enviada_whatsapp',
              dataEnvio: new Date().toISOString(),
              canal: 'WhatsApp'
            };
            allLogs.push(newLog);

            shareList.push({
              id: mate.id,
              nome: mateNameClean,
              contatoNome: primaryContact.nome || 'Responsáveis',
              contatoTelefone: primaryContact.telefone || '11999999999',
              mensagem: mateMsg
            });
            initialStatuses[mate.id] = 'pendente';

            let pastSummaries = getFromDB<any[]>(\`anjo_turn_summaries_\${mate.id}\`, []);
            if (!Array.isArray(pastSummaries)) pastSummaries = [];
            pastSummaries.unshift({
              id: summaryId,
              cuidador: usuarioAtual?.nome || 'Educador(a)',
              data: new Date().toLocaleDateString('pt-BR'),
              duracao: 'Período Completo',
              inicio: startHourStr,
              fim: endHourStr,
              taxaConformidade: taxaConformidadeCalc,
              taxaQualidade: 100,
              mensagemCompleta: mateMsg,
              timestamp: new Date().toISOString()
            });
            saveToDB(\`anjo_turn_summaries_\${mate.id}\`, pastSummaries);
          });

          saveToDB('anjo_notificacoes', allLogs);

          // Reset tasks
          const classmateIds = classmates.map(c => c.id);
          const allTasksTodayCollective = getFromDB<TarefaDiaria[]>('anjo_tarefas_diarias', []);
          const updatedTasksCollective = allTasksTodayCollective.map(t => {
            if (classmateIds.includes(t.idosoId)) {
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
          saveToDB('anjo_tarefas_diarias', updatedTasksCollective);
          setTarefas(updatedTasksCollective.filter(t => t.idosoId === idoso.id));

          // 10. Dispatch events to notify all active listeners
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('anjo_shift_updated'));
            window.dispatchEvent(new CustomEvent('anjo_user_updated'));
            window.dispatchEvent(new CustomEvent('db-vitals-update'));
            window.dispatchEvent(new Event('storage'));
          }

          setCollectiveShareList(shareList);
          setCollectiveShareStatuses(initialStatuses);
          setShowCollectiveShareModal(true);

          showToast(\`Período Coletivo da classe \${targetClass} encerrado com sucesso!\`, 'success');
        } catch(err) {
          console.error('Erro ao encerrar coletivo:', err);
          setIsShiftActive(false);
          setShiftStartTime(null);
          setElapsedShiftTime('00:00:00');
        }
      };

      triggerConfirm(
        'Encerrar Aulas Coletivo',
        \`Você tem certeza que deseja encerrar as aulas de todos os alunos da classe \${targetClass} ao mesmo tempo? Todos os diários de rotina serão finalizados e o cronômetro será desligado.\`,
        executeStopGroup
      );
    } catch(e) {
      console.error('Erro ao acionar encerramento:', e);
      setIsShiftActive(false);
      setShiftStartTime(null);
      setElapsedShiftTime('00:00:00');
    }
  };

  `;

  db = db.substring(0, startIdx) + newHandleEndShiftGroup + db.substring(endIdx);
  fs.writeFileSync('src/components/Dashboard.tsx', db, 'utf8');
  console.log('handleEndShiftGroup updated successfully!');
} else {
  console.log('Failed to find handleEndShiftGroup boundaries in Dashboard.tsx');
}
