import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  writeBatch,
  enableNetwork,
  disableNetwork
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { USUARIOS_SIMULADOS, SALAS_INICIAIS, IDOSOS_INICIAIS } from './seedData';

const app = initializeApp(firebaseConfig);
let dbInstance;
try {
  console.log("   [Firebase] Initializing Firestore with DB ID:", firebaseConfig.firestoreDatabaseId);
  dbInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
} catch (e) {
  console.warn("[!]  [Firebase] Failed to init custom DB, falling back to (default).", e);
  dbInstance = getFirestore(app);
}
export const db = dbInstance;

export let isFirestoreConnected = false;
export let lastSnapshotTime = 'Nunca';
export let snapshotCountTotal = 0;

export const SYNC_COLLECTIONS_MAP: Record<string, string> = {
  'anjo_shift_states': 'anjo_shift_states',
  'turnos_ativos': 'turnos_ativos',
  'anjo_idosos': 'anjo_idosos',
  'anjo_usuarios': 'anjo_usuarios',
  'anjo_salas': 'anjo_salas',
  'anjo_medicamentos': 'anjo_medicamentos',
  'anjo_agenda': 'anjo_agenda',
  'anjo_tarefas_diarias': 'anjo_tarefas_diarias',
  'anjo_alimentacao': 'anjo_alimentacao',
  'anjo_hidratacao': 'anjo_hidratacao',
  'anjo_sono': 'anjo_sono',
  'anjo_humor': 'anjo_humor',
  'anjo_atividades': 'anjo_atividades',
  'anjo_ocorrencias': 'anjo_ocorrencias',
  'anjo_notificacoes': 'anjo_notificacoes',
  'anjo_sinais': 'anjo_sinais',
  'anjo_higiene_global': 'anjo_higiene_global'
};

export function getFirestoreCollectionForKey(key: string): string {
  if (SYNC_COLLECTIONS_MAP[key]) return SYNC_COLLECTIONS_MAP[key];
  if (key.startsWith('anjo_higiene_log_')) return key;
  if (key.startsWith('anjo_sono_') || key.startsWith('anjo_atividades_') || key.startsWith('anjo_ocorrencias_') || key.startsWith('anjo_alimentacao_') || key.startsWith('anjo_hidratacao_')) {
    return key;
  }
  return key;
}

export function notifyCrossTabSync(key?: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('anjo_user_updated', { detail: { localKey: key } }));
    window.dispatchEvent(new CustomEvent('db-vitals-update', { detail: { localKey: key } }));
  }
}

export function cleanUndefinedFields(obj: any): any {
  if (obj === null || obj === undefined) return undefined;
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefinedFields).filter(v => v !== undefined);
  }
  if (typeof obj === 'object' && (obj.constructor === Object || !obj.constructor)) {
    const cleaned: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      const value = obj[key];
      if (value !== undefined) {
        const cleanedValue = cleanUndefinedFields(value);
        if (cleanedValue !== undefined) {
          cleaned[key] = cleanedValue;
        }
      }
    }
    return cleaned;
  }
  return obj;
}

export async function saveToFirestore(collectionName: string, data: any) {
  if (!data) return;
  try {
    const colName = getFirestoreCollectionForKey(collectionName);
    const cleanedData = cleanUndefinedFields(data);
    if (!cleanedData) return;
    const docId = String(cleanedData.id || cleanedData.alunoId || cleanedData.targetKey || cleanedData.idosoId || `doc_${Date.now()}`).replace(/\//g, '_');
    const docRef = doc(db, colName, docId);
    await setDoc(docRef, cleanedData, { merge: true });
    
    // If saving shift states, also duplicate into turnos_ativos for legacy compatibility
    if (colName === 'anjo_shift_states' || collectionName === 'anjo_shift_states') {
      try {
        const altRef = doc(db, 'turnos_ativos', docId);
        await setDoc(altRef, cleanedData, { merge: true });
      } catch (err) {}
    }

    isFirestoreConnected = true;
    lastSnapshotTime = new Date().toLocaleTimeString('pt-BR');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('firestore-connection-status', { detail: { connected: true } }));
    }
  } catch (error: any) {
    console.error(`  [Firebase] Error saving to ${collectionName}:`, error);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('anjo_sync_error', { 
        detail: { collectionName, code: error?.code, message: error?.message } 
      }));
    }
  }
}

export async function deleteFromFirestore(collectionName: string, id: string) {
  if (!id) return;
  try {
    const colName = getFirestoreCollectionForKey(collectionName);
    const docId = String(id).replace(/\//g, '_');
    await deleteDoc(doc(db, colName, docId));
    if (colName === 'anjo_shift_states') {
      try {
        await deleteDoc(doc(db, 'turnos_ativos', docId));
      } catch (e) {}
    }
  } catch (error: any) {
    console.error(`  [Firebase] Error deleting from ${collectionName}:`, error);
  }
}

export async function deleteBatchFromFirestore(collectionName: string, ids: string[]) {
  if (!ids || ids.length === 0) return;
  try {
    const colName = getFirestoreCollectionForKey(collectionName);
    const batch = writeBatch(db);
    ids.forEach(id => {
      const docId = String(id).replace(/\//g, '_');
      batch.delete(doc(db, colName, docId));
    });
    await batch.commit();
  } catch (error: any) {
    console.error(`  [Firebase] Batch delete error in ${collectionName}:`, error);
  }
}

export async function deleteStudentDataFromFirestore(studentIdOrIds: string | string[]) {
  if (!studentIdOrIds) return;
  const studentIds = Array.isArray(studentIdOrIds) ? studentIdOrIds : [studentIdOrIds];
  if (studentIds.length === 0) return;
  const collections = [
    'anjo_tarefas_diarias',
    'anjo_alimentacao',
    'anjo_hidratacao',
    'anjo_sono',
    'anjo_humor',
    'anjo_atividades',
    'anjo_ocorrencias',
    'anjo_shift_states',
    'turnos_ativos'
  ];
  for (const col of collections) {
    try {
      const snapshot = await getDocs(collection(db, col));
      const toDelete = snapshot.docs.filter(d => {
        const dat = d.data();
        return studentIds.some(sid => 
          d.id === sid || d.id.includes(sid) || dat.idosoId === sid || dat.alunoId === sid || dat.studentId === sid
        );
      });
      if (toDelete.length > 0) {
        const batch = writeBatch(db);
        toDelete.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
    } catch (e) {}
  }
}

export async function forceReconnectFirestore(): Promise<boolean> {
  try {
    await disableNetwork(db);
    await enableNetwork(db);
    isFirestoreConnected = true;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('firestore-connection-status', { detail: { connected: true, reconnected: true } }));
    }
    return true;
  } catch (err) {
    console.error("Erro ao forcar reconexao Firestore:", err);
    return false;
  }
}

export async function seedDatabase(collectionName: string, localItems: any[]) {
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    if (snapshot.empty && localItems.length > 0) {
      console.log(`   [Firebase] Seeding ${collectionName} with ${localItems.length} items.`);
      for (const item of localItems) {
        if (item && item.id) {
          const cleaned = cleanUndefinedFields(item);
          if (cleaned) {
            await setDoc(doc(db, collectionName, String(cleaned.id).replace(/\//g, '_')), cleaned, { merge: true });
          }
        }
      }
    }
  } catch (e) {}
}

let syncInitialized = false;
const lastDataSerialized: Record<string, string> = {};

export function startFirebaseSync(force?: boolean) {
  if (syncInitialized && !force) return;
  syncInitialized = true;
  console.log("   [Firebase] Full Real-time Sync initialized with custom DB:", firebaseConfig.firestoreDatabaseId);

  const collectionsToListen = Object.keys(SYNC_COLLECTIONS_MAP);

  collectionsToListen.forEach(colName => {
    try {
      onSnapshot(collection(db, colName), (snapshot) => {
        isFirestoreConnected = true;
        const nowTime = new Date().toLocaleTimeString('pt-BR');
        lastSnapshotTime = nowTime;
        snapshotCountTotal++;

        let data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

        // Self-heal and protect canonical collections from being wiped to empty array
        if (colName === 'anjo_usuarios') {
          if (data.length === 0) {
            console.log("   [Firebase] Auto-seeding empty anjo_usuarios in Firestore with 14 canonical simulated users...");
            seedDatabase('anjo_usuarios', USUARIOS_SIMULADOS);
            data = USUARIOS_SIMULADOS;
          } else {
            // Check if any canonical users are missing from remote (like dev, director, coordinators, teachers, parents)
            const missingSeedUsers = USUARIOS_SIMULADOS.filter(seedU => !data.some(d => d.id === seedU.id));
            if (missingSeedUsers.length > 0) {
              console.log(`   [Firebase] Restoring ${missingSeedUsers.length} missing seed users to anjo_usuarios in Firestore...`);
              missingSeedUsers.forEach(u => saveToFirestore('anjo_usuarios', u));
              data = [...data, ...missingSeedUsers];
            }
          }
        } else if (colName === 'anjo_salas') {
          if (data.length === 0) {
            console.log("   [Firebase] Auto-seeding empty anjo_salas in Firestore with 2 initial classes...");
            seedDatabase('anjo_salas', SALAS_INICIAIS);
            data = SALAS_INICIAIS;
          }
        } else if (colName === 'anjo_idosos') {
          if (data.length === 0) {
            console.log("   [Firebase] Auto-seeding empty anjo_idosos in Firestore with 10 students...");
            seedDatabase('anjo_idosos', IDOSOS_INICIAIS);
            data = IDOSOS_INICIAIS;
          }
        }

        const serialized = JSON.stringify(data);

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('firestore-snapshot-event', {
            detail: { collectionName: colName, docCount: data.length, timestamp: nowTime }
          }));
          window.dispatchEvent(new CustomEvent('firestore-connection-status', {
            detail: { connected: true }
          }));
        }

        // Only dispatch and update storage if data changed
        if (serialized !== lastDataSerialized[colName]) {
          lastDataSerialized[colName] = serialized;
          console.log(`   [Firebase Sync] ${colName}: ${data.length} docs atualizados`);

          if (Array.isArray(data) && data.length > 0) {
            data.forEach((item: any) => {
              if (item) {
                const studentId = item.idosoId || item.studentId || item.alunoId;
                if (studentId) {
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem(`anjo_activities_cleared_${studentId}`);
                    localStorage.removeItem(`anjo_routine_cleared_${studentId}`);
                    localStorage.removeItem(`anjo_tasks_cleared_${studentId}`);
                  }
                }
              }
            });
          }

          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(colName, serialized);
            } catch (err) {}

            if (colName === 'turnos_ativos' || colName === 'anjo_shift_states') {
              localStorage.setItem('anjo_shift_states', serialized);
              window.dispatchEvent(new CustomEvent('anjo_shift_updated', { detail: { items: data } }));
              window.dispatchEvent(new CustomEvent('anjo_user_updated', { detail: { localKey: 'anjo_shift_states', items: data } }));
            } else {
              window.dispatchEvent(new CustomEvent('anjo_user_updated', { detail: { localKey: colName, items: data } }));
            }
            window.dispatchEvent(new CustomEvent('db-vitals-update', { detail: { localKey: colName } }));
          }
        }
      }, (error) => {
        console.error(`  [Firebase] Error listening to ${colName}:`, error);
        isFirestoreConnected = false;
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('firestore-connection-status', { detail: { connected: false } }));
          window.dispatchEvent(new CustomEvent('anjo_sync_error', { 
            detail: { collectionName: colName, code: error?.code, message: error?.message } 
          }));
        }
      });
    } catch (err) {
      console.error(`  [Firebase] Failed to attach listener for ${colName}:`, err);
    }
  });
}
