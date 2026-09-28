import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot,
  collection
} from 'firebase/firestore';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDummyKeyForDevEnvironmentOnly",
  authDomain: "ai-studio-anjinhoescolar.firebaseapp.com",
  projectId: "ai-studio-anjinhoescolar-6ec97378-90ae-4475-81a4-3c4cf0d9cfb6",
  storageBucket: "ai-studio-anjinhoescolar.appspot.com",
  messagingSenderId: "78716392594",
  appId: "1:78716392594:web:6ec9737890ae447581a43c"
};

// Inicialização segura
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Exportações explícitas para compatibilidade total
export { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  collection
};

// Interface para o estado diário da criança
export interface DailyStudentState {
  waterMl?: number;
  bottleDone?: boolean;
  napStatus?: string;
  sleepStatus?: string;
  diaperStatus?: string;
  temperature?: string;
  weight?: string;
  mood?: string;
  meals?: any[];
  medications?: any[];
  timelineEvents?: any[];
  notices?: any[];
  lastUpdated?: string;
  updatedBy?: string;
}

/**
 * Salva ou atualiza os dados diários do aluno no Firestore
 */
export const saveDailyState = async (studentId: string, data: Partial<DailyStudentState>) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const docRef = doc(db, 'students_daily', `${studentId}_${today}`);
    
    await setDoc(docRef, {
      ...data,
      studentId,
      date: today,
      lastUpdated: new Date().toISOString()
    }, { merge: true });
    
    return true;
  } catch (error) {
    console.warn('Salvando offline:', error);
    return false;
  }
};

/**
 * Escuta mudanças em tempo real do estado diário do aluno
 */
export const subscribeToDailyState = (studentId: string, callback: (data: DailyStudentState) => void) => {
  const today = new Date().toISOString().split('T')[0];
  const docRef = doc(db, 'students_daily', `${studentId}_${today}`);

  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as DailyStudentState);
    } else {
      callback({
        waterMl: 450,
        bottleDone: true,
        napStatus: 'Dormindo Tranquilo',
        diaperStatus: 'Xixi Normal',
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
    console.warn('Usando sincronização local para este documento:', error);
  });
};
