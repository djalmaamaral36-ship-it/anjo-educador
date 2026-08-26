import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, doc, setDoc, getDocs } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export let isFirestoreConnected = false;
export let lastSnapshotTime = 'Nunca';
export let snapshotCountTotal = 0;

export const SYNC_COLLECTIONS_MAP = {
  'anjo_shift_states': 'anjo_shift_states',
  'turnos_ativos': 'turnos_ativos'
};

export async function saveToFirestore(collectionName: string, data: any) {}
export async function deleteFromFirestore(collectionName: string, id: string) {}
export async function deleteBatchFromFirestore(collectionName: string, ids: string[]) {}
export function getFirestoreCollectionForKey(key: string) { return key; }
export function notifyCrossTabSync() {}
export async function deleteStudentDataFromFirestore(studentId: string) {}
export function forceReconnectFirestore() {}

// Simplest sync: Just seed if empty, and listen for updates.
export async function seedDatabase(collectionName: string, localItems: any[]) {
  const colRef = collection(db, collectionName);
  const snapshot = await getDocs(colRef);
  
  if (snapshot.empty) {
    console.log(`🚀 [Firebase] Seeding ${collectionName} with ${localItems.length} items.`);
    for (const item of localItems) {
      if (item && item.id) {
        await setDoc(doc(db, collectionName, String(item.id).replace(/\//g, '_')), item, { merge: true });
      }
    }
  }
}

export function startFirebaseSync() {
  console.log("🚀 [Firebase] Sync initialized...");
  const collectionsToListen = ['turnos_ativos'];
  
  collectionsToListen.forEach(colName => {
    onSnapshot(collection(db, colName), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log(`📡 [Firebase] Sync ${colName}: ${data.length} docs`);
      
      // Masquerade as anjo_shift_states
      window.dispatchEvent(new CustomEvent('anjo_shift_updated', { 
        detail: { collection: 'anjo_shift_states', items: data } 
      }));
    }, (error) => {
      console.error(`❌ [Firebase] Error in ${colName}:`, error);
    });
  });
}
