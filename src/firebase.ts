import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot,
  getDocs,
  query,
  where,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

import { syncShiftStateLocalStorageFlags, isRecordBeforeResetTimestamp } from './data';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = (firebaseConfig as any).firestoreDatabaseId 
  ? getFirestore(app, (firebaseConfig as any).firestoreDatabaseId) 
  : getFirestore(app);

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
    'ocorrencias'
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
export function startFirebaseSync() {
  if (typeof window === 'undefined') return;
  if (isSyncStarted) {
    console.log('⚡ [Firebase Sync] Já está rodando globalmente (Singleton Guard Ativo).');
    return;
  }
  isSyncStarted = true;

  console.log('🚀 [Firebase Sync] Iniciando serviço de sincronização global do Firestore (1 única conexão)...');

  Object.entries(SYNC_COLLECTIONS_MAP).forEach(([localKey, collectionName]) => {
    // 1. Check if we need to seed Firestore with existing LocalStorage data
    const localDataRaw = localStorage.getItem(localKey);
    let localItems: any[] = [];
    if (localDataRaw) {
      try {
        const parsed = JSON.parse(localDataRaw);
        localItems = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        localItems = [];
      }
    }

    // 2. Setup Real-time listener for Firestore collection
    const colRef = collection(db, collectionName);
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      console.log(`🔥 [DIAGNOSTIC] onSnapshot disparou para ${collectionName}. Docs count:`, snapshot.size);
      if (snapshot.size > 0) {
        console.log('🔥 [DIAGNOSTIC] Amostra de dado (primeiro doc):', snapshot.docs[0].data());
      }
      
      // Re-read latest localItems on snapshot update to avoid stale closure state
      const currentLocalRaw = localStorage.getItem(localKey);
      let currentLocalItems: any[] = [];
      if (currentLocalRaw) {
        try {
          const p = JSON.parse(currentLocalRaw);
          currentLocalItems = Array.isArray(p) ? p : [];
        } catch (e) {
          currentLocalItems = [];
        }
      }

      // Check if collection has already been initialized / seeded in this environment
      const isAlreadySeeded = localStorage.getItem(`anjo_seeded_${collectionName}`) === 'true';

      // If snapshot is empty, seed local items to cloud if present, preserving shift states & user data
      if (snapshot.empty) {
        if (currentLocalItems.length > 0 && !isAlreadySeeded) {
          localStorage.setItem(`anjo_seeded_${collectionName}`, 'true');
          console.log(`[Firebase Seeding] Collection "${collectionName}" is empty in Cloud. Preserving ${currentLocalItems.length} local items and uploading to Firestore...`);
          currentLocalItems.forEach(async (item) => {
            if (item && item.id) {
              try {
                const docId = String(item.id).replace(/\//g, '_');
                const cleanItem = sanitizeForFirestore(item);
                await setDoc(doc(db, collectionName, docId), cleanItem);
              } catch (err) {
                console.error(`Error seeding ${item.id}`, err);
              }
            }
          });
          return;
        } else {
          // Cloud collection is empty and local items are empty or collection was reset.
          localStorage.setItem(`anjo_seeded_${collectionName}`, 'true');
          localStorage.setItem(localKey, JSON.stringify([]));
          if (localKey === 'anjo_shift_states') {
            syncShiftStateLocalStorageFlags([]);
          }
          window.dispatchEvent(new CustomEvent('anjo_user_updated', { detail: { localKey, items: [] } }));
          window.dispatchEvent(new CustomEvent('db-vitals-update', { detail: { localKey, items: [] } }));
          return;
        }
      }

      // Mark collection as initialized once docs exist
      localStorage.setItem(`anjo_seeded_${collectionName}`, 'true');

      // Read all items from Firestore snapshot
      const remoteItems: any[] = [];
      snapshot.forEach((docSnapshot) => {
        remoteItems.push(docSnapshot.data());
      });

      // Preserve any local items that are not yet in remoteItems (optimistic local additions / pending sync)
      const remoteIds = new Set(remoteItems.map(i => i && i.id).filter(Boolean));
      const pendingLocalItems = currentLocalItems.filter(localItem => {
        if (!localItem || !localItem.id) return false;
        if (remoteIds.has(localItem.id)) return false;

        const studentId = localItem.idosoId || localItem.studentId || localItem.alunoId;
        if (studentId) {
          const isCleared = localStorage.getItem(`anjo_tasks_cleared_${studentId}`) === 'true' ||
                            localStorage.getItem(`anjo_activities_cleared_${studentId}`) === 'true' ||
                            localStorage.getItem(`anjo_routine_cleared_${studentId}`) === 'true';
          if (isCleared) return false;

          const resetTimeStr = localStorage.getItem(`anjo_routine_reset_${studentId}`) || localStorage.getItem(`anjo_shift_start_time_${studentId}`);
          if (resetTimeStr && isRecordBeforeResetTimestamp(localItem, resetTimeStr)) {
            return false;
          }
        }
        return true;
      });

      const combinedRemoteAndLocal = [...pendingLocalItems, ...remoteItems];

      const deletedStudentsList = JSON.parse(localStorage.getItem('anjo_deleted_students') || '[]') as string[];
      const deletedStudentsSet = new Set(deletedStudentsList);

      // If syncing shift states (anjo_shift_states), deduplicate and merge
      if (localKey === 'anjo_shift_states') {
        const shiftMap = new Map<string, any>();
        combinedRemoteAndLocal.forEach(item => {
          if (!item || !item.id) return;
          const k = String(item.id).trim();
          const existing = shiftMap.get(k);
          if (!existing) {
            shiftMap.set(k, item);
          } else {
            const existingActive = existing.active === true || String(existing.active) === 'true';
            const itemActive = item.active === true || String(item.active) === 'true';
            if (itemActive && !existingActive) {
              shiftMap.set(k, item);
            } else {
              const t1 = new Date(existing.updatedAt || existing.startTime || 0).getTime();
              const t2 = new Date(item.updatedAt || item.startTime || 0).getTime();
              if (t2 >= t1) {
                shiftMap.set(k, item);
              }
            }
          }
        });

        const mergedShiftItems = Array.from(shiftMap.values());
        localStorage.setItem(localKey, JSON.stringify(mergedShiftItems));
        syncShiftStateLocalStorageFlags(mergedShiftItems);
        window.dispatchEvent(new CustomEvent('anjo_shift_updated', { detail: { items: mergedShiftItems } }));
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('anjo_user_updated', { detail: { localKey, items: mergedShiftItems } }));
        window.dispatchEvent(new CustomEvent('db-vitals-update', { detail: { localKey, items: mergedShiftItems } }));
        return;
      }

      // If syncing students (anjo_idosos), merge remote and local, filter out deleted students, and sync to Firestore
      if (localKey === 'anjo_idosos') {
        const studentMap = new Map<string, any>();

        remoteItems.forEach(p => {
          if (!p || !p.id) return;
          if (deletedStudentsSet.has(p.id)) {
            const docId = String(p.id).replace(/\//g, '_');
            deleteDoc(doc(db, collectionName, docId)).catch(() => {});
            return;
          }
          let key = p.id;
          if (key === 'idoso_maria') key = 'aluno_1';
          else if (key === 'idoso_joao') key = 'aluno_2';
          studentMap.set(key, { ...p });
        });

        currentLocalItems.forEach(p => {
          if (!p || !p.id) return;
          if (deletedStudentsSet.has(p.id)) return;
          let key = p.id;
          if (key === 'idoso_maria') key = 'aluno_1';
          else if (key === 'idoso_joao') key = 'aluno_2';

          const existing = studentMap.get(key);
          if (!existing) {
            studentMap.set(key, { ...p });
          } else {
            studentMap.set(key, {
              ...existing,
              ...p,
              foto: (p.foto && !p.foto.includes('placeholder')) ? p.foto : (existing.foto || p.foto),
              nome: (p.nome && p.nome.length >= (existing.nome?.length || 0)) ? p.nome : (existing.nome || p.nome),
              salaAula: p.salaAula || existing.salaAula,
              contatoEmergencia: p.contatoEmergencia || existing.contatoEmergencia
            });
          }
        });

        const mergedStudents = Array.from(studentMap.values());
        localStorage.setItem(localKey, JSON.stringify(mergedStudents));

        mergedStudents.forEach(async (student) => {
          if (student && student.id) {
            try {
              const docId = String(student.id).replace(/\//g, '_');
              const cleanItem = sanitizeForFirestore(student);
              await setDoc(doc(db, collectionName, docId), cleanItem, { merge: true });
            } catch (err) {}
          }
        });

        window.dispatchEvent(new CustomEvent('anjo_user_updated', { detail: { localKey, items: mergedStudents } }));
        window.dispatchEvent(new CustomEvent('anjo_idosos_updated', { detail: { items: mergedStudents } }));
        return;
      }

      // Read current student IDs
      let validStudentIds = new Set<string>();
      try {
        const stored = localStorage.getItem('anjo_idosos');
        if (stored) {
          const parsed = JSON.parse(stored) as any[];
          validStudentIds = new Set(parsed.map(s => s.id));
        }
      } catch (e) {}

      // Filter out items belonging to deleted students or students whose tasks/activities were explicitly cleared
      const mergedItems: any[] = combinedRemoteAndLocal.filter(item => {
        if (!item) return false;
        const studentId = item.idosoId || item.studentId || item.alunoId;
        if (!studentId) return true;

        // If belongs to a deleted student or a non-existent student ID, purge
        if (deletedStudentsSet.has(studentId) || (studentId.startsWith('aluno_') && validStudentIds.size > 0 && !validStudentIds.has(studentId))) {
          if (item.id) {
            const docId = String(item.id).replace(/\//g, '_');
            deleteDoc(doc(db, collectionName, docId)).catch(() => {});
          }
          return false;
        }
        
        if (localKey === 'anjo_tarefas_diarias' || localKey === 'anjo_atividades' || localKey === 'anjo_alimentacao' || localKey === 'anjo_hidratacao' || localKey === 'anjo_humor' || localKey === 'anjo_sono' || localKey === 'anjo_ocorrencias') {
          const isCleared = localStorage.getItem(`anjo_tasks_cleared_${studentId}`) === 'true' ||
                            localStorage.getItem(`anjo_activities_cleared_${studentId}`) === 'true' ||
                            localStorage.getItem(`anjo_routine_cleared_${studentId}`) === 'true';
          const resetTimeStr = localStorage.getItem(`anjo_routine_reset_${studentId}`) || localStorage.getItem(`anjo_shift_start_time_${studentId}`);
          const isBeforeReset = resetTimeStr ? isRecordBeforeResetTimestamp(item, resetTimeStr) : false;

          if (isCleared || isBeforeReset) {
            // Asynchronously delete stale document in Firestore
            if (item.id) {
              const docId = String(item.id).replace(/\//g, '_');
              deleteDoc(doc(db, collectionName, docId)).catch(() => {});
            }
            return false;
          }
        }
        if (localKey === 'anjo_mural_recados') {
          const isCleared = localStorage.getItem(`anjo_mural_cleared_${studentId}`) === 'true';
          if (isCleared || item.id === 'rec_seed_1' || item.id === 'rec_seed_2') {
            if (item.id) {
              const docId = String(item.id).replace(/\//g, '_');
              deleteDoc(doc(db, collectionName, docId)).catch(() => {});
            }
            return false;
          }
        }
        return true;
      });

      // Update LocalStorage to keep client snappy and offline-capable
      localStorage.setItem(localKey, JSON.stringify(mergedItems));
      
      // Mirror active shift status in helper localStorage flags
      if (localKey === 'anjo_shift_states') {
        syncShiftStateLocalStorageFlags(mergedItems);
        window.dispatchEvent(new CustomEvent('anjo_shift_updated', { detail: { items: mergedItems } }));
        window.dispatchEvent(new Event('storage'));
        console.log('📡 [Firebase Sync] Turnos ativos (anjo_shift_states) atualizados do Firestore:', mergedItems);
      }

      // Dispatch global custom events so all screens in App.tsx know there are updates
      window.dispatchEvent(new CustomEvent('anjo_user_updated', { detail: { localKey, items: mergedItems } }));
      window.dispatchEvent(new CustomEvent('db-vitals-update', { detail: { localKey, items: mergedItems } }));
      
      console.log(`[Firebase Sync] Synced ${mergedItems.length} items for collection "${collectionName}"`);
    }, (error) => {
      console.warn(`[Firebase Sync Warning] Listener em "${collectionName}" reportou erro ou cota atingida:`, error?.message || error);
    });

    activeUnsubscribes.push(unsubscribe);
  });

  // 3. Setup listeners for dynamic collections containing individual per-student documents (e.g. hygiene logs, occurrences)
  const DYNAMIC_SYNC_COLLECTIONS = [
    'higiene_logs',
    'ocorrencias',
    'auditoria_lgpd',
    'resumos_turnos',
    'historico_medicamentos'
  ];

  DYNAMIC_SYNC_COLLECTIONS.forEach((collectionName) => {
    const colRef = collection(db, collectionName);
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      // Use docChanges() to process changed documents and assemble student arrays
      snapshot.docChanges().forEach((change) => {
        const docData = change.doc.data();
        const docId = change.doc.id;

        if (change.type === 'added' || change.type === 'modified') {
          if (docId && docData) {
            // Save direct doc by key
            localStorage.setItem(docId, JSON.stringify(docData));

            // Helper to merge item into local array for student
            const mergeIntoStudentArray = (prefixKey: string) => {
              const targetId = docData.idosoId || docData.studentId;
              if (!targetId) return;
              const targetKey = `${prefixKey}_${targetId}`;
              let currentList: any[] = [];
              try {
                const raw = localStorage.getItem(targetKey);
                if (raw) currentList = JSON.parse(raw);
                if (!Array.isArray(currentList)) currentList = [];
              } catch (e) {
                currentList = [];
              }

              const existingIdx = currentList.findIndex(item => item && item.id === docData.id);
              if (existingIdx >= 0) {
                currentList[existingIdx] = docData;
              } else {
                currentList.unshift(docData);
              }
              localStorage.setItem(targetKey, JSON.stringify(currentList));
              window.dispatchEvent(new CustomEvent('anjo_user_updated', { detail: { localKey: targetKey, items: currentList } }));
              window.dispatchEvent(new CustomEvent('db-vitals-update', { detail: { localKey: targetKey, items: currentList } }));
            };

            if (collectionName === 'resumos_turnos') {
              mergeIntoStudentArray('anjo_turn_summaries');
            } else if (collectionName === 'ocorrencias') {
              mergeIntoStudentArray('anjo_ocorrencias');
            } else if (collectionName === 'auditoria_lgpd') {
              mergeIntoStudentArray('anjo_lgpd_auditoria');
            } else if (collectionName === 'historico_medicamentos') {
              mergeIntoStudentArray('anjo_med_hist');
            }

            window.dispatchEvent(new CustomEvent('anjo_user_updated', { detail: { localKey: docId, item: docData } }));
            window.dispatchEvent(new CustomEvent('db-vitals-update', { detail: { localKey: docId, item: docData } }));
          }
        } else if (change.type === 'removed') {
          if (docId) {
            localStorage.removeItem(docId);
            
            const removeFromStudentArrays = (prefixKey: string) => {
              try {
                for (let i = 0; i < localStorage.length; i++) {
                  const k = localStorage.key(i);
                  if (k && k.startsWith(`${prefixKey}_`)) {
                    const raw = localStorage.getItem(k);
                    if (raw) {
                      const list = JSON.parse(raw);
                      if (Array.isArray(list)) {
                        const filtered = list.filter(item => item && item.id !== docId && item.id !== change.doc.id);
                        if (filtered.length !== list.length) {
                          localStorage.setItem(k, JSON.stringify(filtered));
                          window.dispatchEvent(new CustomEvent('anjo_user_updated', { detail: { localKey: k, items: filtered } }));
                          window.dispatchEvent(new CustomEvent('db-vitals-update', { detail: { localKey: k, items: filtered } }));
                        }
                      }
                    }
                  }
                }
              } catch (e) {}
            };

            if (collectionName === 'resumos_turnos') {
              removeFromStudentArrays('anjo_turn_summaries');
            } else if (collectionName === 'ocorrencias') {
              removeFromStudentArrays('anjo_ocorrencias');
            } else if (collectionName === 'auditoria_lgpd') {
              removeFromStudentArrays('anjo_lgpd_auditoria');
            } else if (collectionName === 'historico_medicamentos') {
              removeFromStudentArrays('anjo_med_hist');
            }

            window.dispatchEvent(new CustomEvent('anjo_user_updated', { detail: { localKey: docId } }));
            window.dispatchEvent(new CustomEvent('db-vitals-update', { detail: { localKey: docId } }));
          }
        }
      });
      console.log(`[Firebase Sync Dynamic] Synced ${snapshot.docChanges().length} changes for dynamic collection "${collectionName}"`);
    }, (error) => {
      console.warn(`[Firebase Sync Dynamic Warning] Listener em "${collectionName}":`, error?.message || error);
    });

    activeUnsubscribes.push(unsubscribe);
  });

  // Flush any pending queue
  setTimeout(flushPendingQueue, 3000);
}

export function stopFirebaseSync() {
  activeUnsubscribes.forEach(unsub => {
    try { unsub(); } catch (e) {}
  });
  activeUnsubscribes = [];
  isSyncStarted = false;
  console.log('🛑 [Firebase Sync] Conexões globais encerradas.');
}
