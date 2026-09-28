import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot,
  Unsubscribe 
} from 'firebase/firestore';
import { MealStatus, MedicationItem, TimelineEvent, NoticeItem } from '../types';

const firebaseConfig = {
  projectId: "capable-weaver-583b3",
  appId: "1:480442416005:web:d6503ebf590a3209b322ec",
  apiKey: "AIzaSyD8S9g0wDe5-1g11AMzVl8KUNesgZL5TA8",
  authDomain: "capable-weaver-583b3.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-anjinhoescolar-6ec97378-90ae-4475-81a4-3c4cf0d9cfb6",
  storageBucket: "capable-weaver-583b3.firebasestorage.app",
  messagingSenderId: "480442416005"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export { signInWithPopup, signOut, onAuthStateChanged, GoogleAuthProvider };
export type { User };

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

// Ouvinte em tempo real para sincronização instantânea entre Celular e Notebook
export const subscribeToDailyState = (
  studentId: string, 
  onUpdate: (data: DailyStateFirebase) => void
): Unsubscribe => {
  try {
    const docRef = doc(db, 'dailyStates', studentId);
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data() as DailyStateFirebase);
      } else {
        saveDailyState(studentId, {
          studentId,
          studentName: 'Mariana Souza',
          isTimerRunning: true,
          startTimestamp: Date.now() - (3 * 3600 + 45 * 60) * 1000,
          elapsedSeconds: 3 * 3600 + 45 * 60,
          waterMl: 150,
          bottleVolume: 180,
          bottleDone: true,
          bottleCount: 1,
          sleepStatus: 'Soneca em Andamento',
          sleepStart: '12:30',
          sleepEnd: '',
          diaperStatus: 'Xixi + Pomada',
          temperature: '36.6',
          weight: '9.8',
          mood: 'Calmo / Sereno',
          meals: [],
          medications: [],
          timelineEvents: [],
          notices: []
        });
      }
    }, (error) => {
      console.error('Erro na sincronização em tempo real do Firestore:', error);
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
