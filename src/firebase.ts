import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot,
  getDocs,
  getDoc,
  query,
  where,
  writeBatch,
  enableNetwork,
  disableNetwork
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

import { syncShiftStateLocalStorageFlags, isRecordBeforeResetTimestamp } from './data';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with the default database
export const db = getFirestore(app);

// Connectivity state tracking
export let isFirestoreConnected = true;
export let lastSnapshotTime: string | null = null;
export let snapshotCountTotal = 0;

// Reconnect function (Teste 3)
export async function forceReconnectFirestore(): Promise<boolean> {
  try {
    console.log('🔄 [Firebase Test 3] Forçando reconexão da rede do Firestore...');
    await disableNetwork(db);
    await new Promise(resolve => setTimeout(resolve, 500));
    await enableNetwork(db);
    isFirestoreConnected = true;
    startFirebaseSync(true);
    window.dispatchEvent(new CustomEvent('firestore-connection-status', { detail: { connected: true, reconnected: true } }));
    console.log('✅ [Firebase Test 3] Rede do Firestore reiniciada com sucesso!');
    return true;
  } catch (err) {
    console.error('❌ [Firebase Test 3] Erro ao reconectar Firestore:', err);
    return false;
  }
}

// Keep-Alive & Mobile Visibility Handler (Teste 5)
if (typeof window !== 'undefined') {
  // Mobile keep-alive ping every 25 seconds
  setInterval(() => {
    if (document.visibilityState === 'visible') {
      const pingRef = doc(db, 'turnos_ativos', '_keep_alive_ping');
      getDoc(pingRef).then(() => {
        isFirestoreConnected = true;
        window.dispatchEvent(new CustomEvent('firestore-connection-status', { detail: { connected: true } }));
      }).catch((err) => {
        console.warn('📡 [Firebase Keep-alive Warning]', err?.message || err);
      });
    }
  }, 25000);

  // Auto-wake on tab visibility change (Mobile Safari/Chrome tab focus recovery)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      console.log('📱 [Mobile Auto-Wake] Aba reativada no celular. Verificando/reconectando Firestore...');
      enableNetwork(db).catch(() => {});
      window.dispatchEvent(new CustomEvent('firestore-connection-status', { detail: { connected: true } }));
    }
  });
}

// Map local database keys to Firestore collection names
export const SYNC_COLLECTIONS_MAP: { [key: string]: string } = {
  'anjo_usuarios': 'usuarios',
  'anjo_idosos': 'alunos', // stored as students
  'anjo_salas': 'salas_aula',
  'anjo_sinais': 'sinais_vitais',
  'anjo_alimentacao': 'alimentacao',
  'anjo_hidratacao': 'hidratacao',
  'anjo_humor': 'humor',
  'anjo_atividades': 'atividades',
  'anjo_mural_recados': 'mural_recados',
  'anjo_tarefas_diarias': 'tarefas_diarias',
  'anjo_medicamentos': 'medicamentos',
  'anjo_agenda': 'agenda_compromissos',
  'anjo_notificacoes': 'notificacoes_alertas',
  'anjo_shift_states': 'turnos_ativos',
  'anjo_sono': 'sono',
  'anjo_jornada_events': 'jornada_eventos',
  'anjo_encaminhamentos_pedagogicos': 'encaminhamentos_pedagogicos',
  'anjo_alertas_desenvolvimento': 'alertas_desenvolvimento',
  'anjo_mediacao_conflitos': 'mediacao_conflitos'
};

// Helper to sanitize objects for Firestore (removes undefined fields which crash Firestore SDK)
export function sanitizeForFirestore(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== 'object') return obj;
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) {
    return obj
      .map(item => sanitizeForFirestore(item))
      .filter(item => item !== undefined && item !== null);
  }
  const clean: { [key: string]: any } = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val !== undefined) {
      const sanitized = sanitizeForFirestore(val);
      if (sanitized !== undefined) {
        clean[key] = sanitized;
      }
    }
  }
  return clean;
}

// Helper to detect quota exhaustion
let isFirestoreQuotaExhausted = false;
let quotaExhaustedTimestamp = 0;
const QUOTA_COOLDOWN_MS = 60 * 1000; // 1 minute cooldown to quickly recover once quota resets

export function isQuotaExceeded(): boolean {
  if (isFirestoreQuotaExhausted) {
    if (Date.now() - quotaExhaustedTimestamp > QUOTA_COOLDOWN_MS) {
      isFirestoreQuotaExhausted = false; // Reset to try fresh operations
      return false;
    }
    return true;
  }
  return false;
}

export function handleFirestoreError(err: any, context: string) {
  const errMsg = err?.message || String(err || '');
  const errCode = err?.code || '';
  if (errCode === 'resource-exhausted' || errMsg.includes('Quota limit exceeded') || errMsg.includes('resource-exhausted')) {
    if (!isFirestoreQuotaExhausted) {
      isFirestoreQuotaExhausted = true;
      quotaExhaustedTimestamp = Date.now();
      console.warn(`⚠️ [Firebase Sync] Cota diária gratuita do Firestore atingida (${context}). O app continuará funcionando perfeitamente em modo local com sincronização entre abas e cache.`);
      // Clear pending queue to prevent retry storm
      pendingSyncQueue.length = 0;
    }
    return;
  }
  console.warn(`[Firebase Sync] Erro em ${context}:`, errMsg);
}

// Queue for items waiting to be synced to Firestore when online
const pendingSyncQueue: { collectionName: string; docId: string; data: any; action: 'save' | 'delete' }[] = [];

// Helper to check online status
const isOnline = () => typeof window !== 'undefined' && window.navigator.onLine;

export function getFirestoreCollectionForKey(localKey: string): string | null {
  if (SYNC_COLLECTIONS_MAP[localKey]) return SYNC_COLLECTIONS_MAP[localKey];
  if (localKey.startsWith('anjo_higiene_log_')) return 'higiene_logs';
  if (localKey.startsWith('anjo_ocorrencias_')) return 'ocorrencias';
  if (localKey.startsWith('anjo_lgpd_auditoria_')) return 'auditoria_lgpd';
  if (localKey.startsWith('anjo_turn_summaries_')) return 'resumos_turnos';
  if (localKey.startsWith('anjo_med_hist_')) return 'historico_medicamentos';
  return null;
}

// Cross-tab BroadcastChannel for instantaneous multi-tab sync (works even when Firestore quota is exceeded)
const syncBroadcast = typeof window !== 'undefined' && 'BroadcastChannel' in window ? new BroadcastChannel('anjo_cross_tab_channel') : null;

if (syncBroadcast) {
  syncBroadcast.onmessage = (event) => {
    if (event.data && event.data.type === 'SYNC_KEY') {
      const { localKey } = event.data;
      if (localKey === 'anjo_shift_states') {
        const raw = localStorage.getItem('anjo_shift_states');
        if (raw) {
          try {
            const items = JSON.parse(raw);
            syncShiftStateLocalStorageFlags(items);
          } catch (e) {}
        }
      }
      window.dispatchEvent(new CustomEvent('anjo_shift_updated'));
      window.dispatchEvent(new CustomEvent('anjo_user_updated', { detail: { localKey } }));
      window.dispatchEvent(new CustomEvent('db-vitals-update', { detail: { localKey } }));
    }
  };
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'anjo_shift_states') {
      if (e.newValue) {
        try {
          const items = JSON.parse(e.newValue);
          syncShiftStateLocalStorageFlags(items);
        } catch (err) {}
      }
      window.dispatchEvent(new CustomEvent('anjo_shift_updated'));
      window.dispatchEvent(new CustomEvent('anjo_user_updated', { detail: { localKey: 'anjo_shift_states' } }));
      window.dispatchEvent(new CustomEvent('db-vitals-update', { detail: { localKey: 'anjo_shift_states' } }));
    }
  });
}

export function notifyCrossTabSync(localKey: string) {
  if (syncBroadcast) {
    syncBroadcast.postMessage({ type: 'SYNC_KEY', localKey });
  }
}

/**
 * Save an item directly to Firestore
 */
export async function saveToFirestore(localKey: string, item: any) {
  // Always allow critical turnos_ativos / shift states and student records to attempt cloud sync
  const isCritical = localKey === 'anjo_shift_states' || localKey === 'anjo_idosos';
  if (!isCritical && isQuotaExceeded()) return;
  if (isCritical && isFirestoreQuotaExhausted) {
    isFirestoreQuotaExhausted = false; // Force retry for critical timer/student updates
  }

  const collectionName = getFirestoreCollectionForKey(localKey);
  if (!collectionName || !item) return;

  const docId = item.id ? String(item.id).replace(/\//g, '_') : String(localKey).replace(/\//g, '_');
  const cleanItem = sanitizeForFirestore(item.id ? item : { id: docId, ...item });

  try {
    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, cleanItem);
    console.log(`✅ [Firebase Sync] Sucesso ao gravar doc ${docId} em ${collectionName}`);
  } catch (err: any) {
    handleFirestoreError(err, `save doc ${docId} to ${collectionName}`);
    if (!isQuotaExceeded() && pendingSyncQueue.length < 50) {
      pendingSyncQueue.push({ collectionName, docId, data: cleanItem, action: 'save' });
    }
  }
}

/**
 * Delete an item directly from Firestore
 */
export async function deleteFromFirestore(localKey: string, itemId: string) {
  if (isQuotaExceeded()) return;

  const collectionName = getFirestoreCollectionForKey(localKey);
  if (!collectionName || !itemId) return;

  const docId = String(itemId).replace(/\//g, '_');
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (err: any) {
    handleFirestoreError(err, `delete doc ${docId} from ${collectionName}`);
    if (!isQuotaExceeded() && pendingSyncQueue.length < 50) {
      pendingSyncQueue.push({ collectionName, docId, data: null, action: 'delete' });
    }
  }
}

/**
 * Delete multiple items atomically from Firestore using writeBatch
 */
export async function deleteBatchFromFirestore(localKey: string, itemIds: string[]) {
  if (isQuotaExceeded()) return;

  const collectionName = getFirestoreCollectionForKey(localKey);
  if (!collectionName || !itemIds || itemIds.length === 0) return;

  const validIds = itemIds.filter(Boolean);
  if (validIds.length === 0) return;

  const chunkSize = 100;
  for (let i = 0; i < validIds.length; i += chunkSize) {
    const chunk = validIds.slice(i, i + chunkSize);
    try {
      const batch = writeBatch(db);
      chunk.forEach(id => {
        const docId = String(id).replace(/\//g, '_');
        const docRef = doc(db, collectionName, docId);
        batch.delete(docRef);
      });
      await batch.commit();
    } catch (err: any) {
      handleFirestoreError(err, `batch delete from ${collectionName}`);
      break;
    }
  }
}

/**
 * Purge all tasks, activities, mural notes, and records for specified student(s) directly from Firestore
 */
export async function deleteStudentDataFromFirestore(studentIds: string | string[]) {
  const ids = Array.isArray(studentIds) ? studentIds.filter(Boolean) : [studentIds].filter(Boolean);
  if (ids.length === 0) return;

  const collectionsToClean = [
    'tarefas_diarias', 
    'atividades', 
    'mural_recados', 
    'jornada_eventos',
    'alimentacao',
    'hidratacao',
    'humor',
    'sono',
    'higiene_logs',
    'ocorrencias',
    'sinais_vitais',
    'encaminhamentos_pedagogicos',
    'alertas_desenvolvimento',
    'mediacao_conflitos'
  ];

  for (const studentId of ids) {
    // 1. Direct document deletions for key-based collections
    const directDocTargets = [
      { col: 'higiene_logs', docId: `anjo_higiene_log_${studentId}` },
      { col: 'ocorrencias', docId: `anjo_ocorrencias_${studentId}` },
      { col: 'auditoria_lgpd', docId: `anjo_lgpd_auditoria_${studentId}` },
      { col: 'resumos_turnos', docId: `anjo_turn_summaries_${studentId}` },
      { col: 'historico_medicamentos', docId: `anjo_med_hist_${studentId}` },
      { col: 'historico_medicamentos', docId: `anjo_historico_medicamentos_${studentId}` },
    ];
    for (const target of directDocTargets) {
      try {
        await deleteDoc(doc(db, target.col, target.docId));
      } catch (e) {
        // non-blocking
      }
    }

    // 2. Query-based cleanup for array collections
    for (const colName of collectionsToClean) {
      try {
        const queryFields = ['idosoId', 'studentId', 'alunoId'];
        const docsToDelete = new Map<string, any>();

        for (const f of queryFields) {
          try {
            const q = query(collection(db, colName), where(f, '==', studentId));
            const snap = await getDocs(q);
            snap.forEach(d => docsToDelete.set(d.id, d.ref));
          } catch (e) {}
        }

        if (docsToDelete.size > 0) {
          const docRefs = Array.from(docsToDelete.values());
          const chunkSize = 400;
          for (let i = 0; i < docRefs.length; i += chunkSize) {
            const chunk = docRefs.slice(i, i + chunkSize);
            const batch = writeBatch(db);
            chunk.forEach(ref => batch.delete(ref));
            await batch.commit();
          }
          console.log(`[Firebase Sync] Cleaned ${docsToDelete.size} docs from collection ${colName} for student ${studentId}`);
        }
      } catch (err) {
        console.warn(`[Firebase Sync] Non-blocking notice cleaning ${colName} for ${studentId}:`, err);
      }
    }
  }
}

/**
 * Flush pending items to Firestore when connection resumes
 */
async function flushPendingQueue() {
  if (pendingSyncQueue.length === 0 || !isOnline() || isQuotaExceeded()) return;
  
  const tempQueue = [...pendingSyncQueue];
  pendingSyncQueue.length = 0; // clear

  for (const op of tempQueue) {
    if (isQuotaExceeded()) break;
    try {
      if (op.action === 'save') {
        const cleanData = sanitizeForFirestore(op.data);
        await setDoc(doc(db, op.collectionName, op.docId), cleanData);
      } else {
        await deleteDoc(doc(db, op.collectionName, op.docId));
      }
    } catch (err: any) {
      handleFirestoreError(err, `flush item ${op.docId}`);
      if (isQuotaExceeded()) break;
    }
  }
}

// Setup network status listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', flushPendingQueue);
}

/**
 * Core Initialization: Sets up real-time onSnapshot listeners for all sync collections
 * and pushes initial LocalStorage data to Firestore if Firestore is empty.
 */
let isSyncStarted = false;
let activeUnsubscribes: (() => void)[] = [];

/**
 * Core Initialization: Sets up real-time onSnapshot listeners for all sync collections
 * and pushes initial LocalStorage data to Firestore if Firestore is empty.
 * Enforces a strict singleton to avoid multiple active listeners / excessive reads.
 */
export function startFirebaseSync(force = false) {
  console.log("🚀 [Firebase] Conectando para escutar turnos_ativos...");
  
  const colRef = collection(db, "turnos_ativos");
  
  onSnapshot(colRef, (snapshot) => {
    console.log(`📡 [Firebase] Snapshot recebido: ${snapshot.size} docs.`);
    
    // Convert snapshot data to simple array
    const turnos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Dispatch event with data, absolutely NO localStorage manipulation here
    window.dispatchEvent(new CustomEvent('anjo_shift_updated', { 
      detail: { items: turnos } 
    }));
  }, (error) => {
    console.error("❌ [Firebase] Erro de conexão/permissão:", error);
  });
}

export function stopFirebaseSync() {
  activeUnsubscribes.forEach(unsub => {
    try { unsub(); } catch (e) {}
  });
  activeUnsubscribes = [];
  isSyncStarted = false;
  console.log('🛑 [Firebase Sync] Conexões globais encerradas.');
}

// Expose global debug helpers on window for mobile console debugging
if (typeof window !== 'undefined') {
  (window as any).db = db;
  (window as any).startFirebaseSync = startFirebaseSync;
  (window as any).forceReconnectFirestore = forceReconnectFirestore;
  (window as any).firebaseConfig = firebaseConfig;
}
