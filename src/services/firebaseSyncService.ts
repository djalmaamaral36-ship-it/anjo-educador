import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  getDocs 
} from 'firebase/firestore';
import { db } from './firebase';
import { StudentPaxData } from '../types';
import { PAX_STUDENTS } from '../data/paxStudentsData';

const COLLECTION_NAME = 'students';

/**
 * Escuta atualizações em tempo real de todos os alunos no Firestore.
 * Se a coleção estiver vazia, faz o seed inicial com PAX_STUDENTS.
 */
export function subscribeToStudents(
  onData: (studentsMap: Record<string, StudentPaxData>) => void
) {
  const colRef = collection(db, COLLECTION_NAME);

  const unsubscribe = onSnapshot(
    colRef,
    async (snapshot) => {
      if (snapshot.empty) {
        // Se ainda não houver alunos gravados no Firestore, efetua o seed inicial
        console.log('[Firestore] Coleção vazia. Efetuando seed dos dados dos alunos...');
        await seedInitialStudents();
        return;
      }

      const map: Record<string, StudentPaxData> = {};
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data() as StudentPaxData;
        map[docSnap.id] = data;
      });

      // Autocorreção: Se Mariana não tiver medicamentos no Firestore ou Enzo tiver os de Mariana incorretamente
      const marianaDb = map['mariana_souza'];
      const enzoDb = map['enzo_alencar'];
      if (
        (marianaDb && (!marianaDb.medicamentos || marianaDb.medicamentos.length === 0)) ||
        (enzoDb && enzoDb.medicamentos && enzoDb.medicamentos.some(m => m.id.startsWith('med_mariana')))
      ) {
        console.log('[Firestore] Detectado desalinhamento de medicamentos. Corrigindo banco...');
        await seedInitialStudents();
        return;
      }

      onData(map);
    },
    (error) => {
      console.error('[Firestore] Erro na escuta em tempo real dos alunos:', error);
    }
  );

  return unsubscribe;
}

/**
 * Grava dados iniciais de PAX_STUDENTS caso o banco esteja vazio.
 */
export async function seedInitialStudents() {
  try {
    const promises = Object.entries(PAX_STUDENTS).map(([id, student]) => {
      const docRef = doc(db, COLLECTION_NAME, id);
      return setDoc(docRef, student, { merge: true });
    });
    await Promise.all(promises);
    console.log('[Firestore] Seed de alunos concluído com sucesso.');
  } catch (err) {
    console.error('[Firestore] Erro ao salvar seed inicial de alunos:', err);
  }
}

/**
 * Atualiza um único aluno no Firestore (notificará imediatamente todos os dispositivos via onSnapshot).
 */
export async function syncStudentToFirestore(
  studentId: string,
  updatedFields: Partial<StudentPaxData>
) {
  try {
    const docRef = doc(db, COLLECTION_NAME, studentId);
    await setDoc(docRef, updatedFields, { merge: true });
  } catch (err) {
    console.error(`[Firestore] Erro ao sincronizar aluno ${studentId}:`, err);
  }
}

/**
 * Atualiza todos os alunos no Firestore (ex: encerramento coletivo da aula ou zerar geral).
 */
export async function syncAllStudentsToFirestore(
  updater: (st: StudentPaxData) => StudentPaxData,
  currentMap: Record<string, StudentPaxData>
) {
  try {
    const promises = Object.entries(currentMap).map(([id, student]) => {
      const updated = updater(student);
      const docRef = doc(db, COLLECTION_NAME, id);
      return setDoc(docRef, updated, { merge: true });
    });
    await Promise.all(promises);
  } catch (err) {
    console.error('[Firestore] Erro ao sincronizar todos os alunos:', err);
  }
}
