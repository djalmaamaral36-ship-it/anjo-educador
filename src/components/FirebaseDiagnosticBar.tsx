import React, { useState, useEffect } from 'react';
import { db, forceReconnectFirestore, startFirebaseSync, lastSnapshotTime, snapshotCountTotal } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Wifi, WifiOff, RefreshCw, ShieldCheck, ChevronUp, ChevronDown, Terminal, MoveUp, MoveDown, EyeOff } from 'lucide-react';

export default function FirebaseDiagnosticBar() {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<string | null>(lastSnapshotTime);
  const [lastCol, setLastCol] = useState<string>('Nenhuma ainda');
  const [totalSnapshots, setTotalSnapshots] = useState<number>(snapshotCountTotal);
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [showFullLogs, setShowFullLogs] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(true);
  const [testResult, setTestResult] = useState<string | null>(null);
  
  // Custom position state (top vs bottom) & visibility state
  const [position, setPosition] = useState<'top' | 'bottom'>('bottom');
  const [isHidden, setIsHidden] = useState<boolean>(true); // Start collapsed/hidden by default to never block UI

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString('pt-BR');
    setLogs(prev => [`[${time}] ${msg}`, ...prev.slice(0, 25)]);
  };

  useEffect(() => {
    addLog('  Painel de Diagnóstico do Firestore ativado.');
    startFirebaseSync();

    const handleConnectionStatus = (e: any) => {
      const conn = e.detail?.connected ?? true;
      setIsConnected(conn);
      if (e.detail?.reconnected) {
        addLog('✅ Rede reconectada manualmente com sucesso (Teste 3).');
      }
    };

    const handleSnapshotEvent = (e: any) => {
      setIsConnected(true);
      const { collectionName, docCount, timestamp } = e.detail || {};
      setLastUpdate(timestamp);
      setLastCol(collectionName);
      setTotalSnapshots(prev => prev + 1);
      addLog(`  [onSnapshot] Recebido de "${collectionName}" (${docCount} docs) às ${timestamp}`);
    };

    const handleSyncError = (e: any) => {
      const { collectionName, code, message } = e.detail || {};
      addLog(`❌ [ERRO SYNC] ${collectionName || ''}: ${code || ''} - ${message || ''}`);
      if (code === 'permission-denied') {
        setTestResult(`❌ Permissão Negada em ${collectionName || ''}. Verifique firestore.rules`);
      }
    };

    window.addEventListener('firestore-connection-status', handleConnectionStatus);
    window.addEventListener('firestore-snapshot-event', handleSnapshotEvent);
    window.addEventListener('anjo_sync_error', handleSyncError);

    return () => {
      window.removeEventListener('firestore-connection-status', handleConnectionStatus);
      window.removeEventListener('firestore-snapshot-event', handleSnapshotEvent);
      window.removeEventListener('anjo_sync_error', handleSyncError);
    };
  }, []);

  const handleManualReconnect = async () => {
    setIsReconnecting(true);
    addLog('  [Teste 3] Forçando reinicialização da rede WebSocket do Firestore...');
    const success = await forceReconnectFirestore();
    setIsReconnecting(false);
    if (success) {
      setTestResult('✅ Rede reiniciada e reconectada com sucesso!');
    } else {
      setTestResult('❌ Erro na reconexão. Verifique a internet.');
    }
    setTimeout(() => setTestResult(null), 4000);
  };

  const handleTestWriteAndRead = async () => {
    addLog('  [Teste 4] Testando leitura e escrita no Firestore...');
    try {
      const pingDocRef = doc(db, 'turnos_ativos', '_diagnostic_ping_test');
      const testPayload = {
        id: '_diagnostic_ping_test',
        timestamp: new Date().toISOString(),
        device: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
      };
      await setDoc(pingDocRef, testPayload);
      const checkSnap = await getDoc(pingDocRef);
      if (checkSnap.exists()) {
        addLog('✅ [Teste 4 SUCESSO] Regras do Firestore OK! Escrita e Leitura permitidas.');
        setTestResult('✅ Regras OK! Conexão de leitura/escrita funcionando.');
      } else {
        addLog('⚠ [Teste 4 AVISO] O documento de teste não retornou.');
      }
    } catch (err: any) {
      addLog(`❌ [Teste 4 ERRO DE REGRAS] ${err?.message || err}`);
      setTestResult(`❌ Erro nas regras ou conexão: ${err?.message || 'Acesso negado'}`);
    }
    setTimeout(() => setTestResult(null), 5000);
  };

  if (isHidden) {
    return (
      <button
        onClick={() => setIsHidden(false)}
        title="Mostrar Diagnóstico do Firestore"
        className="hidden sm:flex fixed bottom-2 right-2 z-[9999] p-1.5 rounded-full bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 shadow-md backdrop-blur-xs text-[10px] items-center gap-1 active:scale-95 cursor-pointer opacity-40 hover:opacity-100 transition-opacity"
      >
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <Wifi className="w-3 h-3" />
      </button>
    );
  }

  return (
    <div className={`fixed z-[9999] max-w-[95vw] sm:max-w-md select-none font-sans text-xs transition-all duration-300 ${
      position === 'top' 
        ? 'top-2 sm:top-3 right-2 sm:right-3' 
        : 'bottom-2 sm:bottom-3 right-2 sm:right-3'
    }`}>
      
      <div className={`shadow-xl rounded-xl border p-2 sm:p-2.5 transition-all duration-300 backdrop-blur-md ${
        isConnected ? 'bg-emerald-950/95 text-emerald-100 border-emerald-500/50' : 'bg-red-950/95 text-red-100 border-red-500/50'
      }`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsMinimized(!isMinimized)}>
            <span className="relative flex h-2.5 w-2.5 sm:h-3 sm:w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isConnected ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
            </span>
            <div className="flex flex-col leading-tight">
              <div className="font-bold flex items-center gap-1 text-[10px] sm:text-[11px]">
                {isConnected ? <Wifi className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" /> : <WifiOff className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-400" />}
                {isConnected ? 'Firestore Online' : 'Firestore Offline'}
              </div>
              <span className="text-[9px] sm:text-[10px] opacity-80 truncate max-w-[140px] sm:max-w-[200px]">
                {lastUpdate ? `Sinc: ${lastUpdate}` : 'Aguardando snapshot...'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            
            <button
              onClick={() => setPosition(prev => prev === 'top' ? 'bottom' : 'top')}
              title={position === 'top' ? "Mover para baixo" : "Mover para cima"}
              className="p-1 rounded-md bg-white/10 hover:bg-white/20 text-white/90 transition active:scale-95"
            >
              {position === 'top' ? <MoveDown className="w-3 h-3" /> : <MoveUp className="w-3 h-3" />}
            </button>

            
            <button
              onClick={handleManualReconnect}
              disabled={isReconnecting}
              title="Forçar Reconexão"
              className="px-1.5 sm:px-2 py-1 rounded-md bg-emerald-700/70 hover:bg-emerald-600 text-white flex items-center gap-1 text-[9px] sm:text-[10px] font-semibold transition active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${isReconnecting ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Reconectar</span>
            </button>

            
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 rounded-md hover:bg-white/10 text-white/80"
              title={isMinimized ? "Expandir detalhes" : "Minimizar"}
            >
              {isMinimized ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>

            
            <button
              onClick={() => setIsHidden(true)}
              className="p-1 rounded-md hover:bg-white/10 text-white/60 hover:text-white"
              title="Ocultar barra"
            >
              <EyeOff className="w-3 h-3" />
            </button>
          </div>
        </div>

        
        {testResult && (
          <div className="mt-1.5 text-[9px] sm:text-[10px] p-1.5 rounded bg-black/50 border border-white/20 font-medium animate-fade-in">
            {testResult}
          </div>
        )}

        
        {!isMinimized && (
          <div className="mt-2 pt-2 border-t border-white/15 space-y-2 text-[10px] sm:text-[11px]">
            <div className="grid grid-cols-2 gap-1.5 text-[9px] sm:text-[10px]">
              <div className="p-1.5 rounded bg-black/40 border border-white/10">
                <span className="text-white/60 block">Última Coleção:</span>
                <span className="font-mono font-bold text-emerald-300 truncate block">{lastCol}</span>
              </div>
              <div className="p-1.5 rounded bg-black/40 border border-white/10">
                <span className="text-white/60 block">Snapshots Totais:</span>
                <span className="font-mono font-bold text-emerald-300">{totalSnapshots}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1 pt-1">
              <button
                onClick={handleTestWriteAndRead}
                className="flex-1 py-1 px-2 rounded bg-blue-600/80 hover:bg-blue-500 text-white text-[9px] sm:text-[10px] font-medium flex items-center justify-center gap-1 transition"
              >
                <ShieldCheck className="w-3 h-3" />
                Testar Escrita
              </button>
              <button
                onClick={() => setShowFullLogs(!showFullLogs)}
                className="py-1 px-2 rounded bg-gray-700/80 hover:bg-gray-600 text-white text-[9px] sm:text-[10px] font-medium flex items-center gap-1"
              >
                <Terminal className="w-3 h-3" />
                Logs ({logs.length})
              </button>
            </div>

            
            {showFullLogs && (
              <div className="mt-1.5 p-1.5 rounded bg-black/80 border border-white/10 font-mono text-[8px] sm:text-[9px] max-h-36 overflow-y-auto space-y-1 leading-tight text-emerald-400">
                {logs.length === 0 ? (
                  <p className="text-gray-400">Nenhum log registrado ainda.</p>
                ) : (
                  logs.map((log, idx) => (
                    <div key={idx} className="whitespace-pre-wrap break-all">{log}</div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
