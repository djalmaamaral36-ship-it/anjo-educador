import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  onSnapshot,
  Unsubscribe 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { MealStatus, MedicationItem, TimelineEvent, NoticeItem } from '../types';

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Tipagem do estado sincronizado
export interface DailyStateFirebase {
  studentId: string;
  studentName: string;
  isTimerRunning: boolean;
  startTimestamp: number | null;
  elapsedSeconds: number;
  waterMl: number;
  bottleVolume: number;
  bottleDone: boolean;
  bottleCount: number;
  sleepStatus: string;
  sleepStart: string;
  sleepEnd: string;
  diaperStatus: string;
  temperature: string;
  weight: string;
  mood?: string;
  humor?: string;
  hygieneChecklist?: Record<string, string | boolean>;
  hygieneChecks?: Record<string, boolean>;
  meals: MealStatus[];
  medications: MedicationItem[];
  timelineEvents: TimelineEvent[];
  notices: NoticeItem[];
  updatedAt?: string;
}

// Ouvir alterações em tempo real (Celular <-> Computador)
export const subscribeToDailyState = (
  studentId: string, 
  onUpdate: (data: DailyStateFirebase) => void
): Unsubscribe => {
  try {
    const docRef = doc(db, 'dailyStates', studentId);
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data() as DailyStateFirebase);
      }
    }, (error) => {
      console.error('Erro na sincronização Firestore:', error);
    });
  } catch (err) {
    console.error('Erro ao conectar Firestore:', err);
    return () => {};
  }
};

// Salvar / atualizar o estado na nuvem
export const saveDailyState = async (
  studentId: string, 
  data: Partial<DailyStateFirebase>
) => {
  try {
    const docRef = doc(db, 'dailyStates', studentId);
    await setDoc(docRef, {
      ...data,
      studentId,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.error('Erro ao salvar no Firestore:', err);
  }
};
