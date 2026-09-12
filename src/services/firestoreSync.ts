import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  orderBy, 
  Timestamp,
  deleteDoc
} from 'firebase/firestore';
import { DiarioRotinaRecebido, AvisoMural, RecadoEscolar, StudentPaxData } from '../types';

// Coleções do Firestore
const COLLECTION_DIARIOS = 'anjo_diarios_rotina';
const COLLECTION_MURAL = 'anjo_mural_avisos';
const COLLECTION_RECADOS = 'anjo_recados_escolares';
const COLLECTION_STUDENTS = 'anjo_students';

// --- SINCRONIZAÇÃO EM TEMPO REAL: DIÁRIOS DE ROTINA ---
export function subscribeToDiariosFirestore(callback: (diarios: DiarioRotinaRecebido[]) => void): () => void {
  try {
    const q = query(collection(db, COLLECTION_DIARIOS));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: DiarioRotinaRecebido[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as DiarioRotinaRecebido);
      });
      if (list.length > 0) {
        callback(list);
      }
    }, (error) => {
      console.warn('Firestore offline or permission warning for diarios:', error);
    });
    return unsubscribe;
  } catch (e) {
    console.warn('Erro ao conectar listener Firestore para diários:', e);
    return () => {};
  }
}

export async function salvarDiarioFirestore(diario: DiarioRotinaRecebido): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_DIARIOS, diario.id);
    await setDoc(docRef, {
      ...diario,
      updatedAt: Timestamp.now()
    }, { merge: true });
  } catch (e) {
    console.error('Erro ao salvar diário no Firestore:', e);
  }
}

// --- SINCRONIZAÇÃO EM TEMPO REAL: MURAL DE AVISOS ---
export function subscribeToMuralFirestore(callback: (avisos: AvisoMural[]) => void): () => void {
  try {
    const q = query(collection(db, COLLECTION_MURAL));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: AvisoMural[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as AvisoMural);
      });
      if (list.length > 0) {
        callback(list);
      }
    }, (error) => {
      console.warn('Firestore offline warning for mural:', error);
    });
    return unsubscribe;
  } catch (e) {
    console.warn('Erro ao conectar listener Firestore para mural:', e);
    return () => {};
  }
}

export async function salvarMuralFirestore(aviso: AvisoMural): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_MURAL, aviso.id);
    await setDoc(docRef, {
      ...aviso,
      updatedAt: Timestamp.now()
    }, { merge: true });
  } catch (e) {
    console.error('Erro ao salvar aviso no Firestore:', e);
  }
}

// --- SINCRONIZAÇÃO EM TEMPO REAL: RECADOS ESCOLARES ---
export function subscribeToRecadosFirestore(callback: (recados: RecadoEscolar[]) => void): () => void {
  try {
    const q = query(collection(db, COLLECTION_RECADOS));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: RecadoEscolar[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as RecadoEscolar);
      });
      if (list.length > 0) {
        callback(list);
      }
    }, (error) => {
      console.warn('Firestore offline warning for recados:', error);
    });
    return unsubscribe;
  } catch (e) {
    console.warn('Erro ao conectar listener Firestore para recados:', e);
    return () => {};
  }
}

export async function salvarRecadoFirestore(recado: RecadoEscolar): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_RECADOS, recado.id);
    await setDoc(docRef, {
      ...recado,
      updatedAt: Timestamp.now()
    }, { merge: true });
  } catch (e) {
    console.error('Erro ao salvar recado no Firestore:', e);
  }
}

// --- SINCRONIZAÇÃO EM TEMPO REAL: ALUNOS E FICHAS PAX ---
export function subscribeToStudentsFirestore(callback: (studentsMap: Record<string, StudentPaxData>) => void): () => void {
  try {
    const q = query(collection(db, COLLECTION_STUDENTS));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const map: Record<string, StudentPaxData> = {};
      snapshot.forEach((docSnap) => {
        const student = docSnap.data() as StudentPaxData;
        if (student && student.id) {
          map[student.id] = student;
        }
      });
      if (Object.keys(map).length > 0) {
        callback(map);
      }
    }, (error) => {
      console.warn('Firestore offline warning for students:', error);
    });
    return unsubscribe;
  } catch (e) {
    console.warn('Erro ao conectar listener Firestore para alunos:', e);
    return () => {};
  }
}

export async function salvarStudentFirestore(student: StudentPaxData): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_STUDENTS, student.id);
    await setDoc(docRef, {
      ...student,
      updatedAt: Timestamp.now()
    }, { merge: true });
  } catch (e) {
    console.error('Erro ao salvar aluno no Firestore:', e);
  }
}
