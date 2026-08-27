import { Idoso, Usuario, Medicamento, CompromissoMedico, TarefaDiaria, SinalVital, RegistroHidratacao, RegistroSono, RegistroHumor, RegistroAlimentacao, RegistroAtividade, NotificacaoSimulada, Classroom } from './types';
import { SYNC_COLLECTIONS_MAP, saveToFirestore, deleteFromFirestore, deleteBatchFromFirestore, getFirestoreCollectionForKey, notifyCrossTabSync, deleteStudentDataFromFirestore } from './firebase';
import { USUARIOS_SIMULADOS, IDOSOS_INICIAIS, SALAS_INICIAIS } from './seedData';
export { USUARIOS_SIMULADOS, IDOSOS_INICIAIS, SALAS_INICIAIS };

export const MEDICAMENTOS_INICIAIS: Medicamento[] = [
  // Dona Maria
  {
    id: 'med_maria_losartana',
    idosoId: 'idoso_maria',
    nome: 'Losartana Potássica (Pressão)',
    dosagem: '50mg - 1 Comp.',
    frequência: 'Diário',
    horarios: ['08:00'],
    diasSemana: ['Todos'],
    observacoes: 'Tomar em jejum, com meio copo d\'água.',
    status: 'ativo'
  },
  {
    id: 'med_maria_aricept',
    idosoId: 'idoso_maria',
    nome: 'Donepezila (Aricept - Alzheimer)',
    dosagem: '5mg - 1 Comp.',
    frequência: 'Diário',
    horarios: ['21:00'],
    diasSemana: ['Todos'],
    observacoes: 'Oferecer logo antes do descanso noturno.',
    status: 'ativo'
  },
  {
    id: 'med_maria_calcio',
    idosoId: 'idoso_maria',
    nome: 'Cálcio + Vitamina D',
    dosagem: '1 sachet em pó',
    frequência: 'Diário',
    horarios: ['12:30'],
    diasSemana: ['Todos'],
    observacoes: 'Diluir em 100ml de suco ou água no almoço.',
    status: 'ativo'
  },
  // Seu João
  {
    id: 'med_joao_metformina',
    idosoId: 'idoso_joao',
    nome: 'Glicofage XR (Metformina - Diabetes)',
    dosagem: '850mg - 1 Comp.',
    frequência: 'Diário',
    horarios: ['08:00', '20:00'],
    diasSemana: ['Todos'],
    observacoes: 'Tomar imediatamente após o café da manhã e após o jantar.',
    status: 'ativo'
  },
  {
    id: 'med_joao_daflon',
    idosoId: 'idoso_joao',
    nome: 'Daflon 1000mg (Circulação)',
    dosagem: '1 comprimido',
    frequência: 'A cada 12h',
    horarios: ['09:00', '21:00'],
    diasSemana: ['Todos'],
    observacoes: 'Tomar com as refeições.',
    status: 'ativo'
  }
];

export const AGENDA_INICIAL: CompromissoMedico[] = [
  // Dona Maria
  {
    id: 'compromisso_maria_1',
    idosoId: 'idoso_maria',
    tipo: 'consulta',
    titulo: 'Retorno Clínico de Geriatria',
    medico: 'Dr. Roberto Kardec',
    especialidade: 'Geriatria & Cardiologia',
    local: 'Consultório Dr. Kardec - Av. Paulista, 1500, cj 42',
    data: '2026-06-05', // no futuro próximo
    horario: '14:30',
    observacoes: 'Levar último exame de ecocardiograma e medições de pressão feitas em casa.',
    confirmadoFamiliar: true,
    alertasAtivos: true,
    status: 'agendado'
  },
  {
    id: 'compromisso_maria_2',
    idosoId: 'idoso_maria',
    tipo: 'exame',
    titulo: 'Coleta de Exame de Sangue',
    medico: 'Dra. Patrícia - Laboratório Fleury',
    especialidade: 'Hematologia / Bioquímica',
    local: 'Fleury Moema - Av. Ibirapuera, 1200',
    data: '2026-06-12',
    horario: '07:00',
    observacoes: 'Necessário jejum de 8 horas. Beber água moderadamente livre.',
    confirmadoFamiliar: true,
    alertasAtivos: true,
    status: 'agendado'
  },
  // Seu João
  {
    id: 'compromisso_joao_1',
    idosoId: 'idoso_joao',
    tipo: 'fisioterapia',
    titulo: 'Sessão de Fisioterapia Domiciliar',
    medico: 'Dr. Alan Macedo',
    especialidade: 'Fisioterapia Traumato-Ortopédica',
    local: 'Residencial Seu João',
    data: '2026-06-01',
    horario: '10:00',
    observacoes: 'Foco no ganho de força de quadríceps e flexibilidade patelar.',
    confirmadoFamiliar: true,
    alertasAtivos: true,
    status: 'agendado'
  }
];

// Seed Historical Data (last 5 days) for Charts
export const HISTORICO_SINAIS_INICAIS: SinalVital[] = [];
export const HISTORICO_HIDRATACAO_INICIAL: RegistroHidratacao[] = [];
export const HISTORICO_SONO_INICIAL: RegistroSono[] = [];
export const HISTORICO_HUMOR_INICIAL: RegistroHumor[] = [];
export const HISTORICO_ALIMENTACAO_INICIAL: RegistroAlimentacao[] = [];
export const HISTORICO_ATIVIDADE_INICIAL: RegistroAtividade[] = [];
export const HISTORICO_NOTIFICACOES_INICIAIS: NotificacaoSimulada[] = [];

// Helper functions for PIN validation and uniqueness
export function isPinUnique(pin: string, excludeUserId?: string): { isUnique: boolean; conflictingUser?: Usuario } {
  const cleanPin = pin.trim();
  if (!cleanPin) return { isUnique: true };
  const allUsers = getFromDB<Usuario[]>('anjo_usuarios', USUARIOS_SIMULADOS);
  const conflictingUser = allUsers.find(u => u.pin === cleanPin && u.id !== excludeUserId);
  if (conflictingUser) {
    return { isUnique: false, conflictingUser };
  }
  return { isUnique: true };
}

export function generateUniquePin(excludeUserId?: string, preferredDigits?: string): string {
  const allUsers = getFromDB<Usuario[]>('anjo_usuarios', USUARIOS_SIMULADOS);
  const usedPins = new Set(allUsers.filter(u => u.id !== excludeUserId && u.pin).map(u => u.pin!));

  if (preferredDigits) {
    const cleanDigits = preferredDigits.replace(/\D/g, '');
    if (cleanDigits.length >= 4) {
      const candidate = cleanDigits.slice(-4);
      if (!usedPins.has(candidate)) return candidate;
    }
  }

  for (let i = 0; i < 1000; i++) {
    const candidate = String(Math.floor(1000 + Math.random() * 9000));
    if (!usedPins.has(candidate)) return candidate;
  }
  return String(Math.floor(1000 + Math.random() * 9000));
}

// Initialize database in localStorage
export function initializeDB() {
  if (typeof window === 'undefined') return;

  const DB_SCHEMA_VERSION = 'v12_school_10students_2classes_1director_2coords_10parents_1dev_live';
  const currentDbVersion = localStorage.getItem('anjo_db_version');

  // Hard reset/seed to canonical dataset on version upgrade
  if (currentDbVersion !== DB_SCHEMA_VERSION) {
    localStorage.setItem('anjo_salas', JSON.stringify(SALAS_INICIAIS));
    localStorage.setItem('anjo_usuarios', JSON.stringify(USUARIOS_SIMULADOS));
    localStorage.setItem('anjo_idosos', JSON.stringify(IDOSOS_INICIAIS));
    localStorage.setItem('anjo_medicamentos', JSON.stringify(MEDICAMENTOS_INICIAIS));
    localStorage.setItem('anjo_agenda', JSON.stringify(AGENDA_INICIAL));
    localStorage.setItem('anjo_sinais', JSON.stringify(HISTORICO_SINAIS_INICAIS));
    localStorage.setItem('anjo_hidratacao', JSON.stringify(HISTORICO_HIDRATACAO_INICIAL));
    localStorage.setItem('anjo_sono', JSON.stringify(HISTORICO_SONO_INICIAL));
    localStorage.setItem('anjo_humor', JSON.stringify(HISTORICO_HUMOR_INICIAL));
    localStorage.setItem('anjo_alimentacao', JSON.stringify(HISTORICO_ALIMENTACAO_INICIAL));
    localStorage.setItem('anjo_atividades', JSON.stringify(HISTORICO_ATIVIDADE_INICIAL));
    localStorage.setItem('anjo_notificacoes', JSON.stringify(HISTORICO_NOTIFICACOES_INICIAIS));
    localStorage.setItem('anjo_simulacao_user_id', 'user_cuidador_1');
    localStorage.setItem('anjo_simulacao_idoso_id', 'aluno_6');
    localStorage.setItem('anjo_app_mode', 'escolar_infantil');
    localStorage.setItem('anjo_db_version', DB_SCHEMA_VERSION);
    wipeAllParentsPanelActivities();
    purgeOrphanedStudentData();
    return;
  }
  
  const checkAndSet = (key: string, initialData: any) => {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(initialData));
    } else {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(initialData) && (!Array.isArray(parsed) || parsed.length === 0)) {
          localStorage.setItem(key, JSON.stringify(initialData));
        }
      } catch (e) {
        localStorage.setItem(key, JSON.stringify(initialData));
      }
    }
  };

  checkAndSet('anjo_salas', SALAS_INICIAIS);
  checkAndSet('anjo_usuarios', USUARIOS_SIMULADOS);
  checkAndSet('anjo_idosos', IDOSOS_INICIAIS);
  checkAndSet('anjo_medicamentos', MEDICAMENTOS_INICIAIS);
  checkAndSet('anjo_agenda', AGENDA_INICIAL);
  checkAndSet('anjo_sinais', HISTORICO_SINAIS_INICAIS);
  checkAndSet('anjo_hidratacao', HISTORICO_HIDRATACAO_INICIAL);
  checkAndSet('anjo_sono', HISTORICO_SONO_INICIAL);
  checkAndSet('anjo_humor', HISTORICO_HUMOR_INICIAL);
  checkAndSet('anjo_alimentacao', HISTORICO_ALIMENTACAO_INICIAL);
  checkAndSet('anjo_atividades', HISTORICO_ATIVIDADE_INICIAL);
  checkAndSet('anjo_notificacoes', HISTORICO_NOTIFICACOES_INICIAIS);

  if (!localStorage.getItem('anjo_simulacao_user_id')) {
    localStorage.setItem('anjo_simulacao_user_id', 'user_cuidador_1');
  }
  if (!localStorage.getItem('anjo_simulacao_idoso_id')) {
    localStorage.setItem('anjo_simulacao_idoso_id', 'aluno_6');
  }

  purgeOrphanedStudentData();
}

// Read helpers
export function getFromDB<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  const item = localStorage.getItem(key);
  if (!item) return defaultValue;
  try {
    const parsed = JSON.parse(item);
    if (Array.isArray(defaultValue) && (defaultValue as any[]).length > 0 && Array.isArray(parsed) && parsed.length === 0) {
      if (key === 'anjo_usuarios' || key === 'anjo_salas' || key === 'anjo_idosos') {
        localStorage.setItem(key, JSON.stringify(defaultValue));
        return defaultValue;
      }
    }
    return parsed;
  } catch (e) {
    console.error(`Erro ao analisar JSON do localStorage para chave: ${key}`, e);
    return defaultValue;
  }
}

// Write helpers
export function pruneLocalStorageToFreeSpace() {
  console.warn("Iniciando auto-limpeza de emergência do localStorage para liberar espaço...");
  try {
    // 1. Truncate notifications (anjo_notificacoes) to the last 5 entries
    const notifsStr = localStorage.getItem('anjo_notificacoes');
    if (notifsStr) {
      try {
        const notifs = JSON.parse(notifsStr);
        if (Array.isArray(notifs) && notifs.length > 5) {
          console.log(`Removendo ${notifs.length - 5} notificações antigas...`);
          localStorage.setItem('anjo_notificacoes', JSON.stringify(notifs.slice(-5)));
        }
      } catch (e) {
        localStorage.removeItem('anjo_notificacoes');
      }
    }

    // 2. Clear old tasks with extremely large images in anjo_tarefas_diarias
    const tasksStr = localStorage.getItem('anjo_tarefas_diarias');
    if (tasksStr) {
      try {
        const tasks = JSON.parse(tasksStr);
        if (Array.isArray(tasks)) {
          let modified = false;
          // Deduplicar tarefas e garantir que almoço/papinha não se repita para o mesmo aluno
          const seenKeySet = new Set<string>();
          const seenLunchStudents = new Set<string>();
          const dedupedTasks: any[] = [];

          tasks.forEach(t => {
            if (!t || !t.idosoId) return;
            const tit = (t.titulo || '').toLowerCase();
            const isLunch = tit.includes('almoço') || tit.includes('almocinho') || tit.includes('papinha') || tit.includes('sopinha');
            const studentId = t.idosoId;

            if (isLunch) {
              if (seenLunchStudents.has(studentId)) {
                modified = true;
                return; // Ignora almoços duplicados
              }
              seenLunchStudents.add(studentId);
            }

            const key = `${studentId}_${(t.horarioPrevisto || '').trim()}_${tit.replace(/[^a-z0-9]/g, '')}`;
            if (!seenKeySet.has(key)) {
              seenKeySet.add(key);
              
              if (t.fotoTrabalhinho && t.fotoTrabalhinho.length > 20000) {
                modified = true;
                dedupedTasks.push({ ...t, fotoTrabalhinho: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=150" });
              } else {
                dedupedTasks.push(t);
              }
            } else {
              modified = true;
            }
          });

          if (modified || dedupedTasks.length !== tasks.length) {
            localStorage.setItem('anjo_tarefas_diarias', JSON.stringify(dedupedTasks));
          }
        }
      } catch (e) {
        console.error("Erro ao limpar fotos das tarefas", e);
      }
    }

    // 3. Clear old large photos ONLY if uncompressed (> 400KB base64 string) from anjo_idosos
    const seniorsStr = localStorage.getItem('anjo_idosos');
    if (seniorsStr) {
      try {
        const seniors = JSON.parse(seniorsStr);
        if (Array.isArray(seniors)) {
          let modified = false;
          const cleanedSeniors = seniors.map(s => {
            if (s.foto && s.foto.length > 500000) {
              console.log(`Foto extremamente pesada (>500KB) detectada em "${s.nome}". Otimizando...`);
              modified = true;
              return { ...s, foto: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=80" };
            }
            return s;
          });
          if (modified) {
            localStorage.setItem('anjo_idosos', JSON.stringify(cleanedSeniors));
          }
        }
      } catch (e) {
        console.error("Erro ao limpar fotos de alunos", e);
      }
    }

    // 4. Clear old large photos from anjo_medicamentos
    const medsStr = localStorage.getItem('anjo_medicamentos');
    if (medsStr) {
      try {
        const meds = JSON.parse(medsStr);
        if (Array.isArray(meds)) {
          let modified = false;
          const cleanedMeds = meds.map(m => {
            if (m.fotoEmbalagem && m.fotoEmbalagem.length > 20000) {
              console.log(`Reduzindo foto do medicamento "${m.nome}"...`);
              modified = true;
              return { ...m, fotoEmbalagem: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=80" };
            }
            return m;
          });
          if (modified) {
            localStorage.setItem('anjo_medicamentos', JSON.stringify(cleanedMeds));
          }
        }
      } catch (e) {
        console.error("Erro ao limpar fotos de medicamentos", e);
      }
    }
    console.log("Limpeza de emergência concluída com sucesso!");
  } catch (err) {
    console.error("Falha catastrófica ao tentar auto-limpar o localStorage:", err);
  }
}

export function saveToDB(key: string, data: any) {
  if (typeof window === 'undefined') return;

  // 0. Auto-remove stale '_cleared_' flags when new data is saved for a student
  if (Array.isArray(data) && data.length > 0) {
    data.forEach(item => {
      if (item) {
        const studentId = item.idosoId || item.studentId || item.alunoId;
        if (studentId) {
          localStorage.removeItem(`anjo_activities_cleared_${studentId}`);
          localStorage.removeItem(`anjo_routine_cleared_${studentId}`);
          localStorage.removeItem(`anjo_tasks_cleared_${studentId}`);
        }
      }
    });
  }

  const colName = getFirestoreCollectionForKey(key);
  let itemsToUpload: any[] = [];

  // 1. Calculate diff BEFORE overwriting localStorage so oldData is accurate!
  try {
    if (colName) {
      const oldDataRaw = localStorage.getItem(key);
      if (oldDataRaw && Array.isArray(data)) {
        const oldDataMap = new Map<string, string>();
        try {
          const oldArray = JSON.parse(oldDataRaw);
          if (Array.isArray(oldArray)) {
            oldArray.forEach(oldItem => {
              if (oldItem && oldItem.id) {
                oldDataMap.set(String(oldItem.id), JSON.stringify(oldItem));
              }
            });

            // Handle deleted items in batch
            const newIds = new Set(data.map(item => item?.id).filter(Boolean));
            const deletedIds: string[] = [];
            oldArray.forEach(oldItem => {
              if (oldItem && oldItem.id && !newIds.has(oldItem.id)) {
                deletedIds.push(String(oldItem.id));
              }
            });
            if (deletedIds.length > 0) {
              deleteBatchFromFirestore(key, deletedIds);
            }
          }
        } catch (e) {}

        // For shift states or other critical collections, upload items that are new or changed
        itemsToUpload = data.filter(newItem => {
          if (!newItem || !newItem.id) return false;
          const oldJson = oldDataMap.get(String(newItem.id));
          if (!oldJson) return true; // New item!
          return JSON.stringify(newItem) !== oldJson; // Modified item!
        });
      } else if (Array.isArray(data)) {
        itemsToUpload = data;
      } else if (data) {
        itemsToUpload = [data];
      }
    }
  } catch (err) {
    if (Array.isArray(data)) itemsToUpload = data;
    else if (data) itemsToUpload = [data];
  }

  // 2. Write to local storage
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e: any) {
    console.error(`Erro ao gravar no localStorage para chave: ${key}`, e);
    const isQuotaError = e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22 || e.code === 1014;
    
    if (isQuotaError) {
      // Self-heal and retry!
      pruneLocalStorageToFreeSpace();
      try {
        localStorage.setItem(key, JSON.stringify(data));
        console.log(`Sucesso ao salvar chave ${key} após limpeza de emergência!`);
      } catch (retryError) {
        console.error("Falha ao salvar mesmo após a auto-limpeza:", retryError);
      }
    }
  }

  // 3. Write ONLY modified or new items to Firestore immediately
  try {
    if (colName && itemsToUpload.length > 0) {
      itemsToUpload.forEach(item => {
        if (item) {
          saveToFirestore(key, item);
        }
      });
      console.log(`⚡ [Firebase Diff Sync] Enviando ${itemsToUpload.length} item(ns) para Firestore na chave "${key}".`);
    }
  } catch (err) {
    console.error("[Firebase Sync] Error uploading saved items", err);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('db-vitals-update'));
    window.dispatchEvent(new CustomEvent('anjo_user_updated', { detail: { localKey: key } }));
    notifyCrossTabSync(key);
  }
}

// Helper to compress images client-side using Canvas to avoid localStorage quota limits (reduces size from 5MB+ to ~10KB)
export function compressImage(file: File, maxWidth: number = 200, maxHeight: number = 200, quality: number = 0.4): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
      img.src = event.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

// Helper to compress existing Base64 / Data URL images before saving to Firestore & LocalStorage
export function compressBase64Image(base64Str: string, maxWidth: number = 250, maxHeight: number = 250, quality: number = 0.5): Promise<string> {
  return new Promise((resolve) => {
    if (!base64Str || !base64Str.startsWith('data:image')) {
      resolve(base64Str);
      return;
    }
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Str);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(base64Str);
    img.src = base64Str;
  });
}

export interface AuthorizationStatus {
  isAuthorized: boolean;
  authorizedNames: string[];
  totalResponsibles: number;
}

export function checkFeedingCareAuthorization(): AuthorizationStatus {
  if (typeof window === 'undefined') {
    return { isAuthorized: true, authorizedNames: [], totalResponsibles: 0 };
  }
  
  const storedUsers = localStorage.getItem('anjo_usuarios');
  let allUsers: any[] = [];
  if (storedUsers) {
    try {
      allUsers = JSON.parse(storedUsers);
    } catch (e) {
      // ignore
    }
  }

  const responsibles = allUsers.filter(u => u.tipo === 'familiar');

  return {
    isAuthorized: true,
    authorizedNames: responsibles.map(u => u.nome),
    totalResponsibles: responsibles.length
  };
}

export function isTeacherForRoom(u: Usuario | null | undefined, roomName: string): boolean {
  if (!u || !u.salaAula || !roomName) return false;
  const isStaff = u.tipo === 'cuidador' || u.tipo === 'professor' || u.tipo === 'professora' || u.tipo === 'educador' || u.tipo === 'educadora' || u.tipo === 'admin' || u.tipo === 'diretor' || u.tipo === 'coordenador';
  if (!isStaff) return false;
  const targetNorm = normalizeKey(roomName);
  const userRooms = u.salaAula.split(',').map(r => r.trim()).filter(Boolean);
  return userRooms.some(r => {
    const rNorm = normalizeKey(r);
    return rNorm === targetNorm || keyMatches(r, roomName);
  });
}

export function getAssignedTeacherForRoom(roomName: string, activeUser?: Usuario | null): Usuario | null {
  if (!roomName) return null;
  
  // 1. If activeUser is logged in and is a teacher/staff for this room, PREFER activeUser!
  if (activeUser && isTeacherForRoom(activeUser, roomName)) {
    return activeUser;
  }

  const allUsers = getFromDB<Usuario[]>('anjo_usuarios', USUARIOS_SIMULADOS);
  
  // 2. Find in stored DB users (excluding general directors/admins/coordinators unless assigned to the room)
  let matched = allUsers.find(u => u.tipo !== 'admin' && u.tipo !== 'diretor' && u.tipo !== 'coordenador' && isTeacherForRoom(u, roomName));
  if (matched) return matched;

  // 3. Check any staff user
  let anyStaff = allUsers.find(u => isTeacherForRoom(u, roomName));
  if (anyStaff) return anyStaff;
  
  return null;
}

export interface ShiftState {
  id: string; // student or senior ID (e.g. 'aluno_heitor')
  active: boolean;
  isAbsent?: boolean;
  reason?: string | null;
  startTime?: string | null;
  lastResetTime?: string | null;
  updatedAt?: string;
}

export function normalizeKey(str: string | undefined | null): string {
  if (!str) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function keyMatches(keyA: string | undefined | null, keyB: string | undefined | null): boolean {
  if (!keyA || !keyB) return false;
  const normA = normalizeKey(keyA);
  const normB = normalizeKey(keyB);
  if (normA === normB) return true;
  const cleanA = normA.replace(/[^a-z0-9]/g, '');
  const cleanB = normB.replace(/[^a-z0-9]/g, '');
  if (cleanA && cleanB && cleanA === cleanB) return true;
  return false;
}

export function getStudentRoomName(studentObj: any): string | null {
  if (!studentObj) return null;
  if (typeof studentObj === 'object') {
    if (studentObj.salaAula && studentObj.salaAula !== 'Todas') return studentObj.salaAula;
    if (studentObj.quarto && studentObj.quarto !== 'Todas') return studentObj.quarto;
    if (studentObj.sala && studentObj.sala !== 'Todas') return studentObj.sala;
    if (studentObj.nome) return getStudentRoomName(studentObj.nome);
    return null;
  }
  const name = String(studentObj);
  const rooms = getFromDB<any[]>('anjo_salas', SALAS_INICIAIS);
  const sortedRooms = [...rooms].sort((a, b) => b.name.length - a.name.length);
  const found = sortedRooms.find(r => name.includes(r.name));
  if (found) return found.name;

  const match = name.match(/\(([^)]+)\)/);
  if (match) {
    const content = match[1];
    const parts = content.split('-');
    if (parts.length > 0) {
      const potentialRoom = parts[0].trim();
      const foundFallback = sortedRooms.find(r => r.name.toLowerCase().includes(potentialRoom.toLowerCase()) || potentialRoom.toLowerCase().includes(r.name.toLowerCase()));
      if (foundFallback) return foundFallback.name;
    }
  }

  if (name.includes('Berçário I - B') || name.includes('Berçário 1B') || name.includes('Berçário 1 - B') || name.includes('B1-B') || name.includes('B1B')) return 'Berçário I - B';
  if (name.includes('Berçário I - A') || name.includes('Berçário 1A') || name.includes('Berçário 1 - A') || name.includes('Berçário I') || name.includes('Berçário 1')) return 'Berçário I - A';
  if (name.includes('Berçário III') || name.includes('Berçário 3')) return 'Berçário III';
  if (name.includes('Berçário II') || name.includes('Berçário 2')) return 'Berçário II';
  if (name.includes('Maternal I - D') || name.includes('Maternal 1D')) return 'Maternal I - D';
  if (name.includes('Maternal I - C') || name.includes('Maternal 1C')) return 'Maternal I - C';
  if (name.includes('Maternal I - B') || name.includes('Maternal 1B')) return 'Maternal I - B';
  if (name.includes('Maternal I - A') || name.includes('Maternal 1A') || name.includes('Maternal I') || name.includes('Maternal 1')) return 'Maternal I - A';
  if (name.includes('Maternal II - C') || name.includes('Maternal 2C')) return 'Maternal II - C';
  if (name.includes('Maternal II - B') || name.includes('Maternal 2B')) return 'Maternal II - B';
  if (name.includes('Maternal II - A') || name.includes('Maternal 2A') || name.includes('Maternal II') || name.includes('Maternal 2')) return 'Maternal II - A';
  if (name.includes('Jardim I - B') || name.includes('Jardim 1B')) return 'Jardim I - B';
  if (name.includes('Jardim I - A') || name.includes('Jardim 1A') || name.includes('Jardim I')) return 'Jardim I - A';
  if (name.includes('Jardim II - B') || name.includes('Jardim 2B')) return 'Jardim II - B';
  if (name.includes('Jardim II - A') || name.includes('Jardim 2A') || name.includes('Jardim II')) return 'Jardim II - A';

  return null;
}

export function isStudentInRoom(student: Idoso | null | undefined, roomName: string | null | undefined): boolean {
  if (!student || !roomName) return false;
  const sRoom = student.salaAula || student.quarto || getStudentRoomName(student);
  if (!sRoom) return false;
  return keyMatches(sRoom, roomName);
}

export function getAllPossibleStudentKeys(key: string): string[] {
  if (!key) return [];
  const trimmed = String(key).trim();
  const keys = new Set<string>();
  keys.add(trimmed);

  if (trimmed === 'idoso_maria') { keys.add('aluno_1'); }
  if (trimmed === 'aluno_1') { keys.add('idoso_maria'); }
  if (trimmed === 'idoso_joao') { keys.add('aluno_2'); }
  if (trimmed === 'aluno_2') { keys.add('idoso_joao'); }

  const allStudents = getFromDB<Idoso[]>('anjo_idosos', IDOSOS_INICIAIS);
  const student = allStudents.find(s => 
    s.id === trimmed || 
    (s.nome && s.nome.toLowerCase() === trimmed.toLowerCase()) ||
    keyMatches(s.id, trimmed) ||
    (s.nome && keyMatches(s.nome, trimmed)) ||
    (s.nome && keyMatches(s.nome.split(' (')[0], trimmed))
  );

  if (student) {
    if (student.id) {
      keys.add(student.id);
      if (student.id === 'idoso_maria') keys.add('aluno_1');
      if (student.id === 'aluno_1') keys.add('idoso_maria');
      if (student.id === 'idoso_joao') keys.add('aluno_2');
      if (student.id === 'aluno_2') keys.add('idoso_joao');
    }
    if (student.nome) {
      keys.add(student.nome);
      keys.add(student.nome.split(' (')[0].trim());
    }
  }

  return Array.from(keys).filter(Boolean);
}

export function isStudentIdMatch(idA: string | undefined | null, idB: string | undefined | null): boolean {
  if (!idA || !idB) return false;
  const strA = String(idA).trim();
  const strB = String(idB).trim();
  if (strA === strB) return true;
  const keysA = getAllPossibleStudentKeys(strA);
  const keysB = new Set(getAllPossibleStudentKeys(strB));
  return keysA.some(k => keysB.has(k) || keyMatches(k, strB) || keyMatches(strA, k));
}

export function saveHygieneLog(idosoId: string, hygieneLog: any) {
  if (typeof window === 'undefined' || !idosoId) return;
  const keys = getAllPossibleStudentKeys(idosoId);
  keys.forEach(k => {
    saveToDB(`anjo_higiene_log_${k}`, hygieneLog);
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('anjo_user_updated', { detail: { localKey: `anjo_higiene_log_${idosoId}` } }));
    window.dispatchEvent(new CustomEvent('db-vitals-update', { detail: { localKey: `anjo_higiene_log_${idosoId}` } }));
    window.dispatchEvent(new CustomEvent('db-routine-update'));
  }
}

export function getHygieneLog(idosoId: string): any {
  if (typeof window === 'undefined' || !idosoId) return null;
  const keys = getAllPossibleStudentKeys(idosoId);
  for (const k of keys) {
    const h = getFromDB<any>(`anjo_higiene_log_${k}`, null);
    if (h && (h.diaper || h.teeth || h.clothes || h.hands || h.bath || h.cream || h.observations || h.obs || h.time || h.trocaFralda || h.higieneBucal || h.trocaRoupa || h.banho || h.pele)) {
      return h;
    }
  }
  return null;
}

export function saveMealRecord(mealRecord: RegistroAlimentacao) {
  if (typeof window === 'undefined' || !mealRecord || !mealRecord.idosoId) return;
  const globalMeals = getFromDB<RegistroAlimentacao[]>('anjo_alimentacao', []);
  const existingIdx = globalMeals.findIndex(m => m.id === mealRecord.id);
  if (existingIdx >= 0) {
    globalMeals[existingIdx] = mealRecord;
  } else {
    globalMeals.push(mealRecord);
  }
  saveToDB('anjo_alimentacao', globalMeals);

  const keys = getAllPossibleStudentKeys(mealRecord.idosoId);
  keys.forEach(k => {
    const sKey = `anjo_alimentacao_${k}`;
    const sMeals = getFromDB<RegistroAlimentacao[]>(sKey, []);
    const idx = sMeals.findIndex(m => m.id === mealRecord.id);
    if (idx >= 0) sMeals[idx] = mealRecord;
    else sMeals.push(mealRecord);
    saveToDB(sKey, sMeals);
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('anjo_user_updated', { detail: { localKey: 'anjo_alimentacao' } }));
    window.dispatchEvent(new CustomEvent('db-vitals-update', { detail: { localKey: 'anjo_alimentacao' } }));
    window.dispatchEvent(new CustomEvent('db-routine-update'));
  }
}

export function getStudentMealsToday(idosoId: string): RegistroAlimentacao[] {
  if (typeof window === 'undefined' || !idosoId) return [];
  const globalMeals = getFromDB<any[]>('anjo_alimentacao', []);
  const keys = getAllPossibleStudentKeys(idosoId);
  let studentSpecificMeals: any[] = [];
  keys.forEach(k => {
    const sMeals = getFromDB<any[]>(`anjo_alimentacao_${k}`, []);
    if (sMeals && sMeals.length > 0) {
      studentSpecificMeals = [...studentSpecificMeals, ...sMeals];
    }
  });

  const mealsMap = new Map<string, RegistroAlimentacao>();
  [...globalMeals, ...studentSpecificMeals].forEach((item, idx) => {
    if (!item) return;
    const itemStudentId = item.idosoId || idosoId;
    if (!isStudentIdMatch(itemStudentId, idosoId)) return;
    if (!isTodayOrDemoDate(item.data)) return;
    const id = item.id || `meal_${idx}_${Date.now()}`;
    if (!mealsMap.has(id)) {
      mealsMap.set(id, {
        id,
        idosoId,
        refeicao: (item.refeicao || 'cafe_manha') as any,
        aceitacao: (item.aceitacao || 'muito_bem') as any,
        horario: item.horario || '10:00',
        data: item.data || new Date().toISOString().split('T')[0],
        observacoes: item.observacoes || item.observacao || '',
        quantidadeMl: Number(item.quantidadeMl || item.ml || item.quantidade) || (item.refeicao === 'mamadeira' ? 180 : undefined),
        registradoPor: item.registradoPor || 'Equipe Escolar / Pais'
      });
    }
  });
  return Array.from(mealsMap.values());
}

export function getShiftActiveState(studentId: string, customShiftStates?: ShiftState[]): { active: boolean; isAbsent: boolean; reason?: string | null; startTime: string | null; lastResetTime: string | null } {
  if (typeof window === 'undefined' || !studentId) return { active: false, isAbsent: false, reason: null, startTime: null, lastResetTime: null };
  
  let targetStudentId = String(studentId).trim();
  const appMode = (localStorage.getItem('anjo_app_mode') as 'idoso' | 'escolar_infantil' | 'escolar_fundamental') || 'escolar_infantil';
  if (appMode.startsWith('escolar')) {
    if (targetStudentId === 'idoso_maria') targetStudentId = 'aluno_1';
    else if (targetStudentId === 'idoso_joao') targetStudentId = 'aluno_2';
  } else {
    if (targetStudentId === 'aluno_1') targetStudentId = 'idoso_maria';
    else if (targetStudentId === 'aluno_2') targetStudentId = 'idoso_joao';
  }
  const allStudents = getFromDB<Idoso[]>('anjo_idosos', IDOSOS_INICIAIS);
  const studentObj = allStudents.find(s => 
    s.id === targetStudentId || 
    (s.nome && s.nome.toLowerCase() === targetStudentId.toLowerCase()) ||
    keyMatches(s.id, targetStudentId) ||
    (s.nome && keyMatches(s.nome, targetStudentId)) ||
    (s.nome && keyMatches(s.nome.split(' (')[0], targetStudentId))
  );

  const realId = studentObj?.id || targetStudentId;
  const studentName = studentObj?.nome || '';
  const studentCleanName = studentName.split(' (')[0].trim();
  const studentRoom = studentObj?.salaAula || studentObj?.quarto || getStudentRoomName(studentObj || targetStudentId);

  const possibleKeys = getAllPossibleStudentKeys(realId);

  // Check if any possible key or classroom has an explicit local stop flag ('false')
  for (const k of possibleKeys) {
    const flag = localStorage.getItem(`anjo_shift_active_${k}`);
    if (flag === 'false') {
      const isAbsentVal = localStorage.getItem(`anjo_is_absent_${k}`) === 'true';
      return { active: false, isAbsent: isAbsentVal, reason: null, startTime: null, lastResetTime: null };
    }
  }
  if (studentRoom) {
    const roomFlag = localStorage.getItem(`anjo_shift_active_${studentRoom}`);
    if (roomFlag === 'false') {
      return { active: false, isAbsent: false, reason: null, startTime: null, lastResetTime: null };
    }
  }


// TTL-based local cache resolution utility
const LOCAL_FLAG_TTL_MS = 15000;
function getLocalShiftFlag(key: string): { active: boolean; isFresh: boolean; exists: boolean } {
  const flag = localStorage.getItem(`anjo_shift_active_${key}`);
  const timestamp = localStorage.getItem(`anjo_shift_active_${key}_ts`);
  if (flag === null) return { active: false, isFresh: false, exists: false };
  const elapsed = timestamp ? Date.now() - Number(timestamp) : Infinity;
  return { active: flag === 'true', isFresh: elapsed < LOCAL_FLAG_TTL_MS, exists: true };
}
function setLocalShiftFlag(key: string, active: boolean): void {
  localStorage.setItem(`anjo_shift_active_${key}`, String(active));
  localStorage.setItem(`anjo_shift_active_${key}_ts`, String(Date.now()));
}
  // Helper to find existing saved start time across possible keys
  const findExistingStartTime = (): string | null => {
    for (const k of possibleKeys) {
      const saved = localStorage.getItem(`anjo_shift_start_time_${k}`);
      if (saved) return saved;
    }
    if (studentRoom) {
      const savedRoom = localStorage.getItem(`anjo_shift_start_time_${studentRoom}`);
      if (savedRoom) return savedRoom;
    }
    return null;
  };

  // 1. Check shift states in DB (PRIMARY SOURCE OF TRUTH)
  const isFromFirestoreListener = Boolean(customShiftStates && Array.isArray(customShiftStates));
  const shiftStates = customShiftStates && Array.isArray(customShiftStates) 
    ? customShiftStates 
    : getFromDB<ShiftState[]>('anjo_shift_states', []);

  let localActiveFlag = false;
  let localActiveKey = '';
  let localAbsentFlag = false;
  let hasFreshLocalOverride = false;
  let freshLocalActiveValue = false;

  for (const k of possibleKeys) {
    const remoteState = shiftStates.find(s => s && (s.id === k || keyMatches(s.id, k) || keyMatches(k, s.id)));
    const local = getLocalShiftFlag(k);

    // --- TRAVA DE SEGURANÇA ---
    // Se o Firebase diz que o turno está inativo, MAS o cache local diz que está ativo
    // e é um registro "fresco" (< 15s), nós forçamos a manutenção do estado ativo.
    // Isso ignora dados remotos incompletos ou transitórios, preservando o turno atual.
    let efetivamenteAtivo = remoteState?.active;
    if (remoteState && !remoteState.active && local.active && local.isFresh) {
        console.warn(`⚠️ [Data Trava] Ignorando Firebase (inativo) para ${k} pois o Local cache está fresco (ativo).`);
        efetivamenteAtivo = true; 
    }
    // --------------------------

    // Only allow local override if NOT receiving explicit Firestore listener update AND local flag is very fresh (<15s)
    if (!isFromFirestoreListener && local.isFresh && local.exists) {
      hasFreshLocalOverride = true;
      if (local.active) {
        freshLocalActiveValue = true;
        localActiveFlag = true;
        localActiveKey = k;
      }
    } else if (remoteState) {
      setLocalShiftFlag(k, efetivamenteAtivo || false);
      if (efetivamenteAtivo) {
        localActiveFlag = true;
        localActiveKey = k;
      }
    }
    
    if (localStorage.getItem(`anjo_is_absent_${k}`) === 'true') {
      localAbsentFlag = true;
    }
  }

  // PRIORITY 0: FRESH LOCAL ACTION OVERRIDE (Only when not processing direct Firestore snapshot)
  if (hasFreshLocalOverride && !isFromFirestoreListener) {
    if (freshLocalActiveValue) {
      const startTime = findExistingStartTime() || new Date().toISOString();
      possibleKeys.forEach(k => localStorage.setItem(`anjo_shift_start_time_${k}`, startTime));
      return { active: true, isAbsent: false, reason: null, startTime, lastResetTime: startTime };
    } else {
      return { active: false, isAbsent: localAbsentFlag, reason: null, startTime: null, lastResetTime: null };
    }
  }

  const allRecords: { record: ShiftState; time: number }[] = [];

  shiftStates.forEach(s => {
    if (!s || !s.id) return;
    const sid = String(s.id).trim();
    
    let time = 0;
    if (s.updatedAt) {
      const p = new Date(s.updatedAt).getTime();
      if (!isNaN(p)) time = p;
    }
    if (time === 0 && s.startTime) {
      const p = new Date(s.startTime).getTime();
      if (!isNaN(p)) time = p;
    }

    const isDirectMatch = possibleKeys.some(pk => pk === sid || keyMatches(pk, sid) || keyMatches(sid, pk));
    const isClassroomMatch = studentRoom && keyMatches(sid, studentRoom);

    if (isDirectMatch || isClassroomMatch) {
      allRecords.push({ record: s, time });
    }
  });

  if (allRecords.length > 0) {
    allRecords.sort((a, b) => b.time - a.time);
    const latest = allRecords[0].record;
    const isActive = latest.active === true || String(latest.active) === 'true';

    if (isActive) {
      const startTime = latest.startTime || findExistingStartTime() || new Date().toISOString();
      possibleKeys.forEach(k => {
        localStorage.removeItem(`anjo_is_absent_${k}`);
        localStorage.setItem(`anjo_is_absent_${k}`, 'false');
        localStorage.setItem(`anjo_shift_active_${k}`, 'true');
        localStorage.setItem(`anjo_shift_start_time_${k}`, startTime);
      });
      if (studentRoom) {
        localStorage.setItem(`anjo_shift_active_${studentRoom}`, 'true');
        localStorage.setItem(`anjo_shift_start_time_${studentRoom}`, startTime);
      }
      const lastResetTime = latest.lastResetTime || startTime;
      return { active: true, isAbsent: false, reason: null, startTime, lastResetTime };
    } else {
      const isAbsentBool = Boolean(latest.isAbsent || latest.reason);
      if (isAbsentBool) {
        possibleKeys.forEach(k => localStorage.setItem(`anjo_is_absent_${k}`, 'true'));
      }
      possibleKeys.forEach(k => {
        localStorage.setItem(`anjo_shift_active_${k}`, 'false');
        localStorage.removeItem(`anjo_shift_start_time_${k}`);
      });
      if (studentRoom) {
        localStorage.setItem(`anjo_shift_active_${studentRoom}`, 'false');
        localStorage.removeItem(`anjo_shift_start_time_${studentRoom}`);
      }
      return { 
        active: false, 
        isAbsent: isAbsentBool, 
        reason: latest.reason || null, 
        startTime: null, 
        lastResetTime: latest.lastResetTime || null 
      };
    }
  }

  // FALLBACK: If no direct DB record, use local storage
  if (localActiveFlag) {
    const startTime = findExistingStartTime() || new Date().toISOString();
    possibleKeys.forEach(k => {
      localStorage.setItem(`anjo_shift_active_${k}`, 'true');
      localStorage.setItem(`anjo_shift_start_time_${k}`, startTime);
    });
    return { active: true, isAbsent: false, reason: null, startTime, lastResetTime: startTime };
  }

  // 2. Absence check fallback
  if (localAbsentFlag) {
    return { active: false, isAbsent: true, reason: 'Ausente', startTime: null, lastResetTime: null };
  }

  // 3. Fallback: check direct localStorage flags
  let localDirectActive = false;
  for (const k of possibleKeys) {
    if (localStorage.getItem(`anjo_shift_active_${k}`) === 'true') {
      localDirectActive = true;
      break;
    }
  }
  if (studentRoom && localStorage.getItem(`anjo_shift_active_${studentRoom}`) === 'true') {
    localDirectActive = true;
  }
  
  if (localDirectActive) {
    const startTime = findExistingStartTime() || new Date().toISOString();
    possibleKeys.forEach(k => {
      localStorage.setItem(`anjo_shift_active_${k}`, 'true');
      localStorage.setItem(`anjo_shift_start_time_${k}`, startTime);
    });
    const localResetTime = possibleKeys.reduce((acc, k) => acc || localStorage.getItem(`anjo_routine_reset_${k}`), null as string | null) || startTime;
    return { active: true, isAbsent: false, reason: null, startTime, lastResetTime: localResetTime };
  }

  return { active: false, isAbsent: false, reason: null, startTime: null, lastResetTime: null };
}



export function isRecordBeforeResetTimestamp(item: any, resetTimeStr: string | null | undefined): boolean {
  if (!item || !resetTimeStr) return false;
  
  const resetDateStr = resetTimeStr.split('T')[0];
  if (item.data && typeof item.data === 'string') {
    const cleanData = item.data.split('T')[0].split(' ')[0];
    if (cleanData < resetDateStr) return true; // From a previous day -> stale
    if (cleanData === resetDateStr) return false; // From today -> valid for today's routine
  }

  // Check item.createdAt timestamp if present
  if (item.createdAt) {
    const resetTime = new Date(resetTimeStr).getTime();
    const t = new Date(item.createdAt).getTime();
    if (!isNaN(t) && !isNaN(resetTime)) {
      // 12-hour grace margin to ensure items logged for the active shift are retained
      return t < (resetTime - 12 * 3600 * 1000);
    }
  }

  return false;
}

export function purgeStaleStudentRoutineLocalRecords(studentId: string, resetTimeStr: string) {
  if (typeof window === 'undefined' || !studentId || !resetTimeStr) return;

  const collectionsToClean = [
    'anjo_alimentacao',
    'anjo_hidratacao',
    'anjo_humor',
    'anjo_atividades',
    'anjo_sono',
    'anjo_ocorrencias'
  ];

  collectionsToClean.forEach(colKey => {
    const items = getFromDB<any[]>(colKey, []);
    if (items && items.length > 0) {
      const freshItems = items.filter(item => {
        if (!item) return false;
        const sId = item.idosoId || item.studentId || item.alunoId;
        if (sId !== studentId) return true;
        return !isRecordBeforeResetTimestamp(item, resetTimeStr);
      });
      if (freshItems.length !== items.length) {
        saveToDB(colKey, freshItems);
      }
    }
  });

  const perStudentKeys = [
    `anjo_registro_agua_${studentId}`,
    `anjo_hidratacao_${studentId}`,
    `anjo_alimentacao_${studentId}`,
    `anjo_humor_${studentId}`,
    `anjo_atividades_${studentId}`,
    `anjo_sono_${studentId}`,
    `anjo_ocorrencias_${studentId}`
  ];
  perStudentKeys.forEach(pKey => {
    const items = getFromDB<any[]>(pKey, []);
    if (items && items.length > 0) {
      const freshItems = items.filter(item => !isRecordBeforeResetTimestamp(item, resetTimeStr));
      saveToDB(pKey, freshItems);
    }
  });

  const allTasks = getFromDB<any[]>('anjo_tarefas_diarias', []);
  if (allTasks && allTasks.length > 0) {
    let taskChanged = false;
    const updatedTasks = allTasks.map(task => {
      if (task && task.idosoId === studentId && task.status === 'concluido') {
        const isStale = isRecordBeforeResetTimestamp(
          { ...task, createdAt: task.concluidaEm || task.createdAt },
          resetTimeStr
        );
        if (isStale) {
          taskChanged = true;
          return {
            ...task,
            status: 'pendente' as const,
            concluidaEm: undefined,
            completadaPor: undefined,
            observacao: undefined,
            detalhes: undefined
          };
        }
      }
      return task;
    });
    if (taskChanged) {
      saveToDB('anjo_tarefas_diarias', updatedTasks);
    }
  }
}

export function syncShiftStateLocalStorageFlags(shiftItems?: ShiftState[]) {
  if (typeof window === 'undefined') return;

  const allStudents = getFromDB<Idoso[]>('anjo_idosos', IDOSOS_INICIAIS);

  allStudents.forEach(s => {
    const shiftInfo = getShiftActiveState(s.id, shiftItems);
    const keys = [s.id, s.nome, s.nome.split(' (')[0].trim()].filter(Boolean);
    const effectiveResetTime = shiftInfo.lastResetTime || shiftInfo.startTime;

    keys.forEach(k => {
      if (shiftInfo.active) {
        localStorage.setItem(`anjo_shift_active_${k}`, 'true');
        if (shiftInfo.startTime) localStorage.setItem(`anjo_shift_start_time_${k}`, shiftInfo.startTime);
        if (effectiveResetTime) localStorage.setItem(`anjo_routine_reset_${k}`, effectiveResetTime);
        localStorage.removeItem(`anjo_is_absent_${k}`);
        localStorage.setItem(`anjo_is_absent_${k}`, 'false');
      } else {
        localStorage.removeItem(`anjo_shift_start_time_${k}`);
        localStorage.setItem(`anjo_shift_active_${k}`, 'false');
        if (shiftInfo.isAbsent || shiftInfo.reason) {
          localStorage.setItem(`anjo_is_absent_${k}`, 'true');
        } else {
          localStorage.removeItem(`anjo_is_absent_${k}`);
          localStorage.setItem(`anjo_is_absent_${k}`, 'false');
        }
      }
    });

    if (effectiveResetTime) {
      localStorage.setItem(`anjo_routine_reset_${s.id}`, effectiveResetTime);
      purgeStaleStudentRoutineLocalRecords(s.id, effectiveResetTime);
    }
  });
}

export function generateDefaultTasksForStudent(idosoId: string): any[] {
  const isEscolarStudent = idosoId.startsWith('aluno_') || idosoId.startsWith('aluno') || idosoId.startsWith('escola_');
  if (isEscolarStudent) {
    return [
      {
        id: 'task_s_entrada_' + idosoId,
        idosoId,
        tipo: 'atividade_fisica',
        titulo: 'Acolhida & Entrada Afetiva 🏫',
        descricao: 'Recepção carinhosa dos alunos, acolhimento individual e organização de pertences.',
        horarioPrevisto: '07:00',
        status: 'pendente'
      },
      {
        id: 'task_s_roda_' + idosoId,
        idosoId,
        tipo: 'atividade_fisica',
        titulo: 'Roda de Conversa: Tema do Dia 🪞',
        descricao: 'Apresentação do tema diário, musicalização, chamada divertida e expressão das crianças.',
        horarioPrevisto: '08:00',
        status: 'pendente'
      },
      {
        id: 'task_s_lanche_manha_' + idosoId,
        idosoId,
        tipo: 'alimentacao',
        titulo: 'Lanche da Manhã & Frutinhas 🍎',
        descricao: 'Frutas frescas da estação, biscoito integral e incentivo à hidratação.',
        horarioPrevisto: '09:00',
        status: 'pendente'
      },
      {
        id: 'task_s_parque_' + idosoId,
        idosoId,
        tipo: 'atividade_fisica',
        titulo: 'Recreação no Pátio & Parquinho 🧸',
        descricao: 'Brincadeiras ao ar livre para estímulo motor, socialização e banho de sol adequado.',
        horarioPrevisto: '09:45',
        status: 'pendente'
      },
      {
        id: 'task_s_dirigida_' + idosoId,
        idosoId,
        tipo: 'atividade_fisica',
        titulo: 'Atividade Dirigida Temática (BNCC) 🎨',
        descricao: 'Atividade prática pedagógica com foco no desenvolvimento cognitivo e sensorial.',
        horarioPrevisto: '10:30',
        status: 'pendente'
      },
      {
        id: 'task_s_almoco_' + idosoId,
        idosoId,
        tipo: 'alimentacao',
        titulo: 'Almoço Saudável / Papinha 🍲',
        descricao: 'Pratinho balanceado, introdução de novos sabores, verduras e carninha desfiada.',
        horarioPrevisto: '11:30',
        status: 'pendente'
      },
      {
        id: 'task_s_higiene_escovacao_' + idosoId,
        idosoId,
        tipo: 'banho',
        titulo: 'Higiene, Fraldas & Escovação 👶',
        descricao: 'Troca de fraldas, lavagem das mãos e estímulo à escovação dental com carinho.',
        horarioPrevisto: '12:15',
        status: 'pendente'
      },
      {
        id: 'task_s_soneca_' + idosoId,
        idosoId,
        tipo: 'sono',
        titulo: 'Soneca & Repouso Restaurador 💤',
        descricao: 'Descanso nos colchonetes individuais com ambiente calmo, iluminação suave e música relaxante.',
        horarioPrevisto: '12:30',
        status: 'pendente'
      },
      {
        id: 'task_s_lanche_tarde_' + idosoId,
        idosoId,
        tipo: 'alimentacao',
        titulo: 'Lanche da Tarde & Frutinhas 🍎',
        descricao: 'Frutas frescas da época fatiadas, biscoito integral e hidratação da tarde.',
        horarioPrevisto: '14:15',
        status: 'pendente'
      },
      {
        id: 'task_s_brincadeira_livre_' + idosoId,
        idosoId,
        tipo: 'atividade_fisica',
        titulo: 'Brincadeira Livre & Socialização 🧸',
        descricao: 'Cantinhos temáticos com brinquedos educativos, blocos de montar e autonomia.',
        horarioPrevisto: '14:45',
        status: 'pendente'
      },
      {
        id: 'task_s_historias_' + idosoId,
        idosoId,
        tipo: 'atividade_fisica',
        titulo: 'Contação de Histórias & Música 📚',
        descricao: 'Leitura de livros ilustrados, fantoches e cantigas de roda.',
        horarioPrevisto: '15:30',
        status: 'pendente'
      },
      {
        id: 'task_s_saida_' + idosoId,
        idosoId,
        tipo: 'atividade_fisica',
        titulo: 'Preparação para Saída & Despedida Afetiva 🎒',
        descricao: 'Organização das mochilinhas, fechamento da agenda do dia e entrega afetiva aos familiares.',
        horarioPrevisto: '16:00',
        status: 'pendente'
      }
    ];
  }
  return [
    {
      id: 'task_m_losartana_' + idosoId,
      idosoId,
      tipo: 'medicacao',
      titulo: 'Losartana Potássica (Pressão)',
      descricao: 'Dosagem: 50mg - 1 comprimido. Dar com meio copo d\'água.',
      horarioPrevisto: '08:00',
      status: 'pendente'
    },
    {
      id: 'task_m_cafe_' + idosoId,
      idosoId,
      tipo: 'alimentacao',
      titulo: 'Café da manhã',
      descricao: 'Geleia sem açúcar com pão integral + café com leite.',
      horarioPrevisto: '08:30',
      status: 'pendente'
    },
    {
      id: 'task_m_banho_' + idosoId,
      idosoId,
      tipo: 'banho',
      titulo: 'Banho & Higiene Geral',
      descricao: 'Banho morno assistido, hidratação da pele e troca de roupas limpas.',
      horarioPrevisto: '10:00',
      status: 'pendente'
    },
    {
      id: 'task_m_almoco_' + idosoId,
      idosoId,
      tipo: 'alimentacao',
      titulo: 'Almoço',
      descricao: 'Arroz integral, purê de abóbora, filé de frango desfiado e brócolis cozido ao vapor.',
      horarioPrevisto: '12:30',
      status: 'pendente'
    },
    {
      id: 'task_m_hidra_tarde_' + idosoId,
      idosoId,
      tipo: 'hidratacao',
      titulo: 'Copos d\'Água da Tarde',
      descricao: 'Oferecer 250ml de água gelada.',
      horarioPrevisto: '15:00',
      status: 'pendente'
    }
  ];
}

export function wipeAllParentsPanelActivities() {
  if (typeof window === 'undefined') return;

  const resetNowIso = new Date().toISOString();
  const allStudents = getFromDB<Idoso[]>('anjo_idosos', IDOSOS_INICIAIS);
  const studentIds = allStudents.map(s => s.id);

  // 1. Wipe all global activity/routine tables completely
  saveToDB('anjo_alimentacao', []);
  saveToDB('anjo_hidratacao', []);
  saveToDB('anjo_humor', []);
  saveToDB('anjo_atividades', []);
  saveToDB('anjo_sono', []);
  saveToDB('anjo_sinais', []);
  saveToDB('anjo_notificacoes', []);
  saveToDB('anjo_mural_recados', []);
  saveToDB('anjo_jornada_events', []);
  saveToDB('anjo_ocorrencias', []);
  saveToDB('anjo_encaminhamentos_pedagogicos', []);
  saveToDB('anjo_alertas_desenvolvimento', []);
  saveToDB('anjo_mediacao_conflitos', []);

  // 2. Wipe per-student keys and set reset timestamps for all students
  studentIds.forEach(id => {
    localStorage.setItem(`anjo_tasks_initialized_${id}`, 'true');
    localStorage.setItem(`anjo_routine_reset_${id}`, resetNowIso);
    localStorage.removeItem(`anjo_activities_cleared_${id}`);
    localStorage.removeItem(`anjo_routine_cleared_${id}`);
    localStorage.removeItem(`anjo_tasks_cleared_${id}`);
    localStorage.removeItem(`anjo_almoço_pct_${id}`);
    localStorage.removeItem(`anjo_sleep_hr_${id}`);
    localStorage.removeItem(`anjo_registro_agua_${id}`);
    localStorage.removeItem(`anjo_hidratacao_${id}`);
    localStorage.removeItem(`anjo_alimentacao_${id}`);
    localStorage.removeItem(`anjo_humor_${id}`);
    localStorage.removeItem(`anjo_atividades_${id}`);
    localStorage.removeItem(`anjo_sono_${id}`);
    localStorage.removeItem(`anjo_sinais_vitais_${id}`);
    localStorage.removeItem(`anjo_is_absent_${id}`);

    saveToDB(`anjo_registro_agua_${id}`, []);
    saveToDB(`anjo_hidratacao_${id}`, []);
    saveToDB(`anjo_alimentacao_${id}`, []);
    saveToDB(`anjo_humor_${id}`, []);
    saveToDB(`anjo_atividades_${id}`, []);
    saveToDB(`anjo_sono_${id}`, []);
    saveToDB(`anjo_ocorrencias_${id}`, []);

    saveToDB(`anjo_higiene_log_${id}`, {
      bath: false, teeth: false, clothes: false, diaper: false, hands: false, cream: false,
      banho: false, higieneBucal: false, trocaRoupa: false, trocaFralda: false, pele: false,
      time: '', observations: ''
    });
  });

  // 3. Reset daily tasks to pendente
  const allTasks = getFromDB<any[]>('anjo_tarefas_diarias', []);
  const resetTasks = allTasks.map(t => ({
    ...t,
    status: 'pendente' as const,
    concluidaEm: undefined,
    completadaPor: undefined,
    observacao: undefined,
    detalhes: undefined
  }));
  saveToDB('anjo_tarefas_diarias', resetTasks);

  // 4. Purge remote Firestore
  deleteStudentDataFromFirestore(studentIds).catch(err => {
    console.warn('[wipeAllParentsPanelActivities] Remote Firestore cleanup warning:', err);
  });

  // 5. Broadcast updates
  window.dispatchEvent(new CustomEvent('anjo_user_updated'));
  window.dispatchEvent(new CustomEvent('db-vitals-update'));
  window.dispatchEvent(new CustomEvent('db-tasks-update'));
  window.dispatchEvent(new CustomEvent('db-routine-update'));
  window.dispatchEvent(new CustomEvent('db-jornada-update'));
  window.dispatchEvent(new CustomEvent('db-activities-update'));
}

export function resetStudentDailyRoutine(studentIds: string[]) {
  if (typeof window === 'undefined' || !studentIds || studentIds.length === 0) return;

  const validIds = new Set(studentIds.filter(Boolean));
  if (validIds.size === 0) return;

  const resetNowIso = new Date().toISOString();

  // Set reset timestamp & remove cleared flags so newly logged activities during active shift are displayed
  validIds.forEach(id => {
    localStorage.setItem(`anjo_tasks_initialized_${id}`, 'true');
    localStorage.setItem(`anjo_routine_reset_${id}`, resetNowIso);
    localStorage.removeItem(`anjo_activities_cleared_${id}`);
    localStorage.removeItem(`anjo_routine_cleared_${id}`);
    localStorage.removeItem(`anjo_tasks_cleared_${id}`);
  });

  // 1. Clear routine activity tables for these students so they start at 0
  const allMeals = getFromDB<any[]>('anjo_alimentacao', []);
  saveToDB('anjo_alimentacao', allMeals.filter(m => !m || !m.idosoId || !validIds.has(m.idosoId)));

  const allHids = getFromDB<any[]>('anjo_hidratacao', []);
  saveToDB('anjo_hidratacao', allHids.filter(h => !h || !h.idosoId || !validIds.has(h.idosoId)));

  const allHumor = getFromDB<any[]>('anjo_humor', []);
  saveToDB('anjo_humor', allHumor.filter(h => !h || !h.idosoId || !validIds.has(h.idosoId)));

  const allAtivs = getFromDB<any[]>('anjo_atividades', []);
  saveToDB('anjo_atividades', allAtivs.filter(a => !a || !a.idosoId || !validIds.has(a.idosoId)));

  const allSono = getFromDB<any[]>('anjo_sono', []);
  saveToDB('anjo_sono', allSono.filter(s => !s || !s.idosoId || !validIds.has(s.idosoId)));

  const allSinais = getFromDB<any[]>('anjo_sinais', []);
  saveToDB('anjo_sinais', allSinais.filter(s => !s || !s.idosoId || !validIds.has(s.idosoId)));

  const allRecados = getFromDB<any[]>('anjo_mural_recados', []);
  saveToDB('anjo_mural_recados', allRecados.filter(r => !r || !r.idosoId || !validIds.has(r.idosoId)));

  const allEvents = getFromDB<any[]>('anjo_jornada_events', []);
  saveToDB('anjo_jornada_events', allEvents.filter(e => !e || !e.idosoId || !validIds.has(e.idosoId)));

  // 2. Reset daily tasks checklist (anjo_tarefas_diarias) to 'pendente' for the new day
  const allTasks = getFromDB<any[]>('anjo_tarefas_diarias', []);
  const otherTasks = allTasks.filter(t => !t || !t.idosoId || !validIds.has(t.idosoId));
  const newOrResetTasks: any[] = [];

  validIds.forEach(id => {
    const studentTasks = allTasks.filter(t => t && t.idosoId === id);
    if (studentTasks.length > 0) {
      studentTasks.forEach(t => {
        newOrResetTasks.push({
          ...t,
          status: 'pendente' as const,
          concluidaEm: undefined,
          completadaPor: undefined,
          observacao: undefined,
          detalhes: undefined
        });
      });
    } else {
      newOrResetTasks.push(...generateDefaultTasksForStudent(id));
    }
  });

  saveToDB('anjo_tarefas_diarias', [...otherTasks, ...newOrResetTasks]);

  // 3. Clear individual per-student logs and hygiene checkboxes
  validIds.forEach(id => {
    localStorage.removeItem(`anjo_almoço_pct_${id}`);
    localStorage.removeItem(`anjo_sleep_hr_${id}`);
    localStorage.removeItem(`anjo_registro_agua_${id}`);
    localStorage.removeItem(`anjo_hidratacao_${id}`);
    localStorage.removeItem(`anjo_alimentacao_${id}`);
    localStorage.removeItem(`anjo_humor_${id}`);
    localStorage.removeItem(`anjo_atividades_${id}`);
    localStorage.removeItem(`anjo_sono_${id}`);
    localStorage.removeItem(`anjo_sinais_vitais_${id}`);
    localStorage.removeItem(`anjo_is_absent_${id}`);

    saveToDB(`anjo_registro_agua_${id}`, []);
    saveToDB(`anjo_hidratacao_${id}`, []);
    saveToDB(`anjo_alimentacao_${id}`, []);
    saveToDB(`anjo_humor_${id}`, []);
    saveToDB(`anjo_atividades_${id}`, []);
    saveToDB(`anjo_sono_${id}`, []);
    saveToDB(`anjo_ocorrencias_${id}`, []);

    saveToDB(`anjo_higiene_log_${id}`, {
      bath: false,
      teeth: false,
      clothes: false,
      diaper: false,
      hands: false,
      cream: false,
      banho: false,
      higieneBucal: false,
      trocaRoupa: false,
      trocaFralda: false,
      pele: false,
      time: '',
      observations: ''
    });
  });

  // 4. Delete remote data in Firestore so onSnapshot listeners don't resurrect cleared activities
  deleteStudentDataFromFirestore(Array.from(validIds)).catch((err) => {
    console.warn('[resetStudentDailyRoutine] Remote Firestore cleanup error:', err);
  });

  // 5. Broadcast events to refresh all components instantly
  window.dispatchEvent(new CustomEvent('anjo_user_updated'));
  window.dispatchEvent(new CustomEvent('db-vitals-update'));
  window.dispatchEvent(new CustomEvent('db-tasks-update'));
  window.dispatchEvent(new CustomEvent('db-routine-update'));
  window.dispatchEvent(new CustomEvent('db-jornada-update'));
  window.dispatchEvent(new CustomEvent('db-activities-update'));
}

export function setShiftActiveStatesBatch(updates: { targetKey: string; active: boolean; isAbsent?: boolean; reason?: string | null; startTime?: string }[]) {
  if (typeof window === 'undefined' || !updates || updates.length === 0) return;

  const nowStr = new Date().toISOString();
  const allStudents = getFromDB<Idoso[]>('anjo_idosos', IDOSOS_INICIAIS);
  let shiftStates = getFromDB<ShiftState[]>('anjo_shift_states', []);

  updates.forEach(({ targetKey, active, isAbsent, reason, startTime }) => {
    if (!targetKey) return;
    const cleanKey = String(targetKey).trim();

    let effectiveStartTime: string | null = null;
    if (active) {
      const rawTime = startTime || new Date().toISOString();
      if (!isNaN(new Date(rawTime).getTime())) {
        effectiveStartTime = rawTime;
      } else if (rawTime.includes(':')) {
        const parts = rawTime.split(':');
        const d = new Date();
        d.setHours(parseInt(parts[0], 10) || 0, parseInt(parts[1], 10) || 0, 0, 0);
        effectiveStartTime = d.toISOString();
      } else {
        effectiveStartTime = nowStr;
      }
    }

    const upsertState = (k: string) => {
      if (!k) return;
      const normalizedK = String(k).trim();
      if (!normalizedK) return;

      if (active) {
        localStorage.setItem(`anjo_shift_active_${normalizedK}`, 'true');
        localStorage.setItem(`anjo_shift_active_${normalizedK}_ts`, String(Date.now()));
        if (effectiveStartTime) {
          localStorage.setItem(`anjo_shift_start_time_${normalizedK}`, effectiveStartTime);
          localStorage.setItem(`anjo_routine_reset_${normalizedK}`, effectiveStartTime);
        }
        localStorage.removeItem(`anjo_is_absent_${normalizedK}`);
        localStorage.setItem(`anjo_is_absent_${normalizedK}`, 'false');
      } else {
        localStorage.removeItem(`anjo_shift_start_time_${normalizedK}`);
        localStorage.setItem(`anjo_shift_active_${normalizedK}`, 'false');
        localStorage.setItem(`anjo_shift_active_${normalizedK}_ts`, String(Date.now()));
        if (isAbsent || reason) {
          localStorage.setItem(`anjo_is_absent_${normalizedK}`, 'true');
        } else {
          localStorage.removeItem(`anjo_is_absent_${normalizedK}`);
          localStorage.setItem(`anjo_is_absent_${normalizedK}`, 'false');
        }
      }

      let idx = shiftStates.findIndex(s => s.id === normalizedK);
      if (idx < 0) {
        idx = shiftStates.findIndex(s => s.id && s.id.toLowerCase() === normalizedK.toLowerCase());
      }

      const newState: ShiftState = {
        id: normalizedK,
        active,
        isAbsent: active ? false : (isAbsent ?? false),
        reason: active ? null : (reason || null),
        startTime: active ? effectiveStartTime : null,
        lastResetTime: active ? effectiveStartTime : (shiftStates[idx]?.lastResetTime || nowStr),
        updatedAt: nowStr
      };
      if (idx >= 0) {
        shiftStates[idx] = newState;
      } else {
        shiftStates.push(newState);
      }
    };

    // 1. Identify all related keys to update (Student, Classmates, Classroom, Teachers)
    const keysToUpdate = new Set<string>();
    getAllPossibleStudentKeys(cleanKey).forEach(k => keysToUpdate.add(k));

    // Check if cleanKey is a student
    const student = allStudents.find(s => 
      s.id === cleanKey || 
      (s.nome && s.nome.toLowerCase() === cleanKey.toLowerCase()) ||
      keyMatches(s.id, cleanKey) ||
      (s.nome && keyMatches(s.nome, cleanKey)) ||
      (s.nome && keyMatches(s.nome.split(' (')[0], cleanKey))
    );

    if (student) {
      // Individual student update - update all possible student alias keys
      getAllPossibleStudentKeys(student.id).forEach(k => keysToUpdate.add(k));
      if (student.nome) {
        keysToUpdate.add(student.nome);
        keysToUpdate.add(student.nome.split(' (')[0].trim());
      }
    } else {
      // Classroom or Group update - update classroom and all room students
      const targetRoom = getStudentRoomName(cleanKey) || cleanKey;
      if (targetRoom) {
        keysToUpdate.add(targetRoom);
        // Find all students in this EXACT room
        const roomStudents = allStudents.filter(s => {
          const sRoom = s.salaAula || s.quarto || getStudentRoomName(s) || '';
          return keyMatches(sRoom, targetRoom);
        });

        roomStudents.forEach(s => {
          keysToUpdate.add(s.id);
          if (s.nome) {
            keysToUpdate.add(s.nome);
            keysToUpdate.add(s.nome.split(' (')[0].trim());
          }
        });

        // Find teacher assigned to this room
        const assignedTeacher = getAssignedTeacherForRoom(targetRoom);
        if (assignedTeacher) {
          keysToUpdate.add(assignedTeacher.id);
          if (assignedTeacher.nome) {
            keysToUpdate.add(assignedTeacher.nome);
            keysToUpdate.add(assignedTeacher.nome.replace(/\s*\([^)]*\)/g, '').trim());
          }
        }
      }
    }

    // Apply upsert for all identified keys
    keysToUpdate.forEach(k => {
      if (k) upsertState(k);
    });

    if (!active) {
      shiftStates = shiftStates.map(s => {
        if (s && s.id && keysToUpdate.has(s.id)) {
          return {
            ...s,
            active: false,
            isAbsent: isAbsent ?? s.isAbsent,
            reason: reason || s.reason,
            startTime: null,
            updatedAt: nowStr
          };
        }
        return s;
      });
    }

    if (active) {
      const studentIdsToReset: string[] = [];
      if (student) {
        studentIdsToReset.push(student.id);
      } else {
        const targetRoom = getStudentRoomName(cleanKey) || cleanKey;
        if (targetRoom) {
          const roomStudents = allStudents.filter(s => {
            const sRoom = s.salaAula || s.quarto || getStudentRoomName(s) || '';
            return keyMatches(sRoom, targetRoom);
          });
          roomStudents.forEach(s => studentIdsToReset.push(s.id));
        }
        allStudents.forEach(s => {
          if (s.id === cleanKey || (s.nome && (s.nome === cleanKey || s.nome.split(' (')[0].trim() === cleanKey))) {
            studentIdsToReset.push(s.id);
          }
        });
      }
      if (studentIdsToReset.length > 0) {
        resetStudentDailyRoutine(studentIdsToReset);
      }
    }
  });

  saveToDB('anjo_shift_states', shiftStates);

  // Broadcast events to update all components in real-time
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('anjo_shift_updated', { detail: { items: shiftStates } }));
    window.dispatchEvent(new CustomEvent('anjo_user_updated', { detail: { localKey: 'anjo_shift_states', items: shiftStates } }));
    window.dispatchEvent(new CustomEvent('db-vitals-update'));
    window.dispatchEvent(new CustomEvent('db-tasks-update'));
    window.dispatchEvent(new CustomEvent('db-routine-update'));
    window.dispatchEvent(new Event('storage'));
  }
}

export function setShiftActiveState(targetKey: string, active: boolean, startTime?: string) {
  setShiftActiveStatesBatch([{ targetKey, active, startTime }]);
}

export function getNowTimeBr(): string {
  return new Date().toLocaleTimeString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function getTodayIsoBr(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}

export function getTodayBr(): string {
  return new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

export function isTodayOrDemoDate(d?: string, studentId?: string): boolean {
  if (!d) return true;
  const todayIso = new Date().toISOString().split('T')[0];
  const todayBr = new Date().toLocaleDateString('pt-BR');
  const cleanD = d.split(' ')[0].split('T')[0];

  if (studentId) {
    const isCleared = localStorage.getItem(`anjo_routine_cleared_${studentId}`) === 'true' ||
                      localStorage.getItem(`anjo_activities_cleared_${studentId}`) === 'true' ||
                      localStorage.getItem(`anjo_tasks_cleared_${studentId}`) === 'true';
    if (isCleared) return false;

    const resetTimeStr = localStorage.getItem(`anjo_routine_reset_${studentId}`) || localStorage.getItem(`anjo_shift_start_time_${studentId}`);
    if (resetTimeStr) {
      if (isRecordBeforeResetTimestamp({ data: d }, resetTimeStr)) {
        return false;
      }
      if (cleanD === '2026-05-30' || d === '2026-05-30') {
        const resetDateStr = resetTimeStr.split('T')[0];
        if ('2026-05-30' < resetDateStr || resetDateStr > '2026-05-30') {
          return false;
        }
      }
    }
  }

  const isDateMatch = cleanD === todayIso || cleanD === todayBr;
  if (isDateMatch) return true;

  if (studentId) {
    const hasReset = localStorage.getItem(`anjo_routine_reset_${studentId}`) || localStorage.getItem(`anjo_shift_start_time_${studentId}`);
    if (hasReset) return false;
  }

  return cleanD === '2026-05-30' || d === '2026-05-30';
}

export interface BottleIntervalCheckResult {
  allowed: boolean;
  lastHorario: string;
  nextAllowedHorario: string;
  diffMinutes: number;
  message: string;
}

export function checkBottleFeedingInterval(
  studentId: string,
  newHorarioStr?: string,
  studentName?: string
): BottleIntervalCheckResult {
  const allMeals = getFromDB<any[]>('anjo_alimentacao', []);
  const studentMealKey = `anjo_alimentacao_${studentId}`;
  const studentMeals = getFromDB<any[]>(studentMealKey, []);

  const combined = [...allMeals, ...studentMeals];
  const uniqueMap = new Map<string, any>();
  combined.forEach(m => {
    if (m && m.id) uniqueMap.set(m.id, m);
  });
  const uniqueMeals = Array.from(uniqueMap.values());

  const todayBottles = uniqueMeals.filter(m =>
    m.idosoId === studentId &&
    m.refeicao === 'mamadeira' &&
    isTodayOrDemoDate(m.data)
  );

  if (todayBottles.length === 0) {
    return {
      allowed: true,
      lastHorario: '',
      nextAllowedHorario: '',
      diffMinutes: 9999,
      message: ''
    };
  }

  const parseTimeToMinutes = (timeStr: string): number => {
    if (!timeStr) return 0;
    const clean = String(timeStr).trim();
    const parts = clean.split(':').map(p => parseInt(p, 10));
    const h = isNaN(parts[0]) ? 0 : parts[0];
    const m = isNaN(parts[1]) ? 0 : parts[1];
    return h * 60 + m;
  };

  const formatMinutesToTime = (totalMinutes: number): string => {
    const wrapped = ((totalMinutes % (24 * 60)) + (24 * 60)) % (24 * 60);
    const h = Math.floor(wrapped / 60);
    const m = wrapped % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const targetTimeStr = newHorarioStr || getNowTimeBr();
  const targetMinutes = parseTimeToMinutes(targetTimeStr);
  const MIN_INTERVAL_MINUTES = 120; // 2 hours

  for (const bottle of todayBottles) {
    const bottleTimeStr = bottle.horario || '00:00';
    const bottleMins = parseTimeToMinutes(bottleTimeStr);
    const diff = Math.abs(targetMinutes - bottleMins);

    if (diff < MIN_INTERVAL_MINUTES) {
      const nextAllowedMins = bottleMins + MIN_INTERVAL_MINUTES;
      const nextAllowedTime = formatMinutesToTime(nextAllowedMins);
      const cleanName = studentName ? (studentName.includes(' (') ? studentName.split(' (')[0] : studentName) : 'A criança';

      return {
        allowed: false,
        lastHorario: bottleTimeStr,
        nextAllowedHorario: nextAllowedTime,
        diffMinutes: diff,
        message: `🍼 COMUNICADO DE SEGURANÇA (MAMADEIRA)\n\n${cleanName} já tomou mamadeira às ${bottleTimeStr}.\nPara a nutrição e digestão adequada, deve ser mantido o intervalo mínimo de 2 horas entre mamadeiras.\n\n⏰ Próxima mamadeira liberada a partir das ${nextAllowedTime}.`
      };
    }
  }

  return {
    allowed: true,
    lastHorario: '',
    nextAllowedHorario: '',
    diffMinutes: 9999,
    message: ''
  };
}

export function registerBottleAttemptNotice(
  studentId: string,
  studentName: string,
  lastTime: string,
  nextTime: string,
  attemptTime: string,
  registradoPor: string = 'Professora'
) {
  const cleanName = studentName.includes(' (') ? studentName.split(' (')[0] : studentName;
  const allLogs = getFromDB<any[]>('anjo_notificacoes', []);

  const newNotice: any = {
    id: `notif_mamadeira_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    idosoId: studentId,
    familiarNome: `Pais/Responsáveis de ${cleanName}`,
    telefone: '(11) 98765-4321',
    dataHora: `${getTodayBr()} ${attemptTime}`,
    tipo: 'comunicado_mamadeira',
    titulo: `🍼 Comunicado: Mamadeira Recente (${cleanName})`,
    mensagem: `Anjinho Escolar: Comunicado de acompanhamento. ${cleanName} já tomou mamadeira às ${lastTime}. A tentativa de registro foi realizada às ${attemptTime}. Respeitando o intervalo mínimo de 2 horas para digestão adequada, a próxima mamadeira estará liberada a partir das ${nextTime}. Registrado por ${registradoPor}.`,
    statusEnvio: 'enviado'
  };

  allLogs.unshift(newNotice);
  saveToDB('anjo_notificacoes', allLogs);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('anjo_user_updated', { detail: { localKey: 'anjo_notificacoes' } }));
    window.dispatchEvent(new CustomEvent('db-routine-update'));
  }
}

export function formatTimeBr(dateOrIso?: string | Date | null, fallback = '07:30'): string {
  if (!dateOrIso) return fallback;
  if (/^\d{2}:\d{2}$/.test(String(dateOrIso))) return String(dateOrIso);
  if (/^\d{2}:\d{2}:\d{2}$/.test(String(dateOrIso))) return String(dateOrIso).substring(0, 5);
  if (dateOrIso === 'Início do Turno' || String(dateOrIso).includes('Invalid')) return fallback;
  try {
    const d = typeof dateOrIso === 'string' ? new Date(dateOrIso) : dateOrIso;
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  } catch (e) {}
  return fallback;
}

/**
 * Completely purge any orphaned data left over from students that no longer exist in the system
 */
export function purgeOrphanedStudentData() {
  if (typeof window === 'undefined') return;

  try {
    const allStudents = getFromDB<Idoso[]>('anjo_idosos', []);
    if (!allStudents || allStudents.length === 0) return;

    const validStudentIds = new Set(allStudents.map(s => s.id));
    const deletedStudentsList = JSON.parse(localStorage.getItem('anjo_deleted_students') || '[]') as string[];
    const deletedSet = new Set(deletedStudentsList);

    const isValidOwner = (ownerId?: string) => {
      if (!ownerId) return false;
      if (deletedSet.has(ownerId)) return false;
      if (ownerId.startsWith('aluno_')) {
        return validStudentIds.has(ownerId);
      }
      return true;
    };

    // 1. Purge anjo_atividades
    const allAtivs = getFromDB<any[]>('anjo_atividades', []);
    const validAtivs = allAtivs.filter(a => a && isValidOwner(a.idosoId));
    if (validAtivs.length !== allAtivs.length) {
      saveToDB('anjo_atividades', validAtivs);
      const orphanedIds = allAtivs.filter(a => a && !isValidOwner(a.idosoId)).map(a => a.id).filter(Boolean);
      if (orphanedIds.length > 0) {
        deleteBatchFromFirestore('anjo_atividades', orphanedIds);
      }
    }

    // 2. Purge and sanitize anjo_tarefas_diarias
    const allTasks = getFromDB<any[]>('anjo_tarefas_diarias', []);
    let tasksChanged = false;
    const sanitizedTasks = allTasks.filter(t => t && isValidOwner(t.idosoId)).map(t => {
      let mod = { ...t };
      const titleLower = (mod.titulo || '').toLowerCase();
      if ((titleLower.includes('lanche da tarde') || titleLower.includes('lanchinho da tarde') || titleLower.includes('lanche tarde')) && titleLower.includes('mamadeira')) {
        mod.titulo = 'Lanche da Tarde & Frutinhas 🍎';
        mod.descricao = 'Frutas frescas da época fatiadas, biscoito integral e hidratação da tarde.';
        tasksChanged = true;
      }
      if (titleLower.includes('mamadeira') && (titleLower.includes('café') || titleLower.includes('cafe'))) {
        mod.titulo = 'Lanche da Manhã & Frutinhas 🍎';
        mod.descricao = 'Frutas frescas da estação, biscoito integral e incentivo à hidratação.';
        tasksChanged = true;
      }
      return mod;
    });

    if (sanitizedTasks.length !== allTasks.length || tasksChanged) {
      saveToDB('anjo_tarefas_diarias', sanitizedTasks);
      const orphanedIds = allTasks.filter(t => t && !isValidOwner(t.idosoId)).map(t => t.id).filter(Boolean);
      if (orphanedIds.length > 0) {
        deleteBatchFromFirestore('anjo_tarefas_diarias', orphanedIds);
      }
    }

    // 3. Purge other routine collections
    const collectionsToPurge = [
      'anjo_alimentacao',
      'anjo_hidratacao',
      'anjo_humor',
      'anjo_sono',
      'anjo_sinais',
      'anjo_mural_recados',
      'anjo_jornada_events',
      'anjo_encaminhamentos_pedagogicos',
      'anjo_alertas_desenvolvimento',
      'anjo_mediacao_conflitos'
    ];

    collectionsToPurge.forEach(colKey => {
      const records = getFromDB<any[]>(colKey, []);
      const validRecords = records.filter(r => r && isValidOwner(r.idosoId || r.studentId || r.alunoId));
      if (validRecords.length !== records.length) {
        saveToDB(colKey, validRecords);
        const orphanedIds = records.filter(r => r && !isValidOwner(r.idosoId || r.studentId || r.alunoId)).map(r => r.id).filter(Boolean);
        if (orphanedIds.length > 0) {
          deleteBatchFromFirestore(colKey, orphanedIds);
        }
      }
    });

    if (deletedStudentsList.length > 0) {
      deleteStudentDataFromFirestore(deletedStudentsList).catch(() => {});
    }
  } catch (err) {
    console.warn('[purgeOrphanedStudentData] Error during orphaned data purge:', err);
  }
}

/**
 * Permanently and completely deletes a student and all related historical, activity and task data across both local DB and Firestore
 */
export function deleteStudentEverywhere(studentId: string) {
  if (typeof window === 'undefined' || !studentId) return;

  // 1. Remove from anjo_idosos
  const allPeople = getFromDB<Idoso[]>('anjo_idosos', []);
  const updatedPeople = allPeople.filter(p => p.id !== studentId);
  saveToDB('anjo_idosos', updatedPeople);

  // 2. Track in anjo_deleted_students list so it never resurrects
  const deletedStudents = JSON.parse(localStorage.getItem('anjo_deleted_students') || '[]') as string[];
  if (!deletedStudents.includes(studentId)) {
    deletedStudents.push(studentId);
    localStorage.setItem('anjo_deleted_students', JSON.stringify(deletedStudents));
  }

  // 3. Clear from all collections
  const collections = [
    'anjo_atividades',
    'anjo_tarefas_diarias',
    'anjo_alimentacao',
    'anjo_hidratacao',
    'anjo_humor',
    'anjo_sono',
    'anjo_sinais',
    'anjo_mural_recados',
    'anjo_medicamentos',
    'anjo_agenda',
    'anjo_notificacoes',
    'anjo_jornada_events',
    'anjo_encaminhamentos_pedagogicos',
    'anjo_alertas_desenvolvimento',
    'anjo_mediacao_conflitos'
  ];

  collections.forEach(col => {
    const list = getFromDB<any[]>(col, []);
    const remaining = list.filter(item => item && (item.idosoId || item.studentId || item.alunoId) !== studentId);
    if (remaining.length !== list.length) {
      saveToDB(col, remaining);
    }
  });

  // 4. Clear student specific localStorage flags and parameters
  localStorage.removeItem(`anjo_absences_history_${studentId}`);
  localStorage.removeItem(`anjo_is_absent_${studentId}`);
  localStorage.removeItem(`anjo_tasks_cleared_${studentId}`);
  localStorage.removeItem(`anjo_activities_cleared_${studentId}`);
  localStorage.removeItem(`anjo_tasks_initialized_${studentId}`);
  localStorage.removeItem(`anjo_mural_cleared_${studentId}`);
  localStorage.removeItem(`anjo_almoço_pct_${studentId}`);
  localStorage.removeItem(`anjo_sleep_hr_${studentId}`);
  localStorage.removeItem(`anjo_registro_agua_${studentId}`);
  localStorage.removeItem(`anjo_hidratacao_${studentId}`);
  localStorage.removeItem(`anjo_alimentacao_${studentId}`);
  localStorage.removeItem(`anjo_sub_status_${studentId}`);
  localStorage.removeItem(`anjo_sub_valor_${studentId}`);
  localStorage.removeItem(`anjo_sub_is_custom_${studentId}`);
  localStorage.removeItem(`anjo_shift_active_${studentId}`);
  localStorage.removeItem(`anjo_shift_start_time_${studentId}`);
  
  localStorage.removeItem(`anjo_higiene_log_${studentId}`);
  localStorage.removeItem(`anjo_ocorrencias_${studentId}`);
  localStorage.removeItem(`anjo_lgpd_auditoria_${studentId}`);

  // 5. Delete from Firestore
  deleteFromFirestore('anjo_idosos', studentId);
  deleteStudentDataFromFirestore(studentId).catch(() => {});

  // 6. If the active simulation idoso was this deleted student, reset to first available
  const currentSaved = localStorage.getItem('anjo_simulacao_idoso_id');
  if (currentSaved === studentId) {
    const remainingStudents = updatedPeople.filter(p => p.id.startsWith('aluno_'));
    if (remainingStudents.length > 0) {
      localStorage.setItem('anjo_simulacao_idoso_id', remainingStudents[0].id);
    } else if (updatedPeople.length > 0) {
      localStorage.setItem('anjo_simulacao_idoso_id', updatedPeople[0].id);
    } else {
      localStorage.removeItem('anjo_simulacao_idoso_id');
    }
  }

  // 7. Broadcast update events
  window.dispatchEvent(new CustomEvent('anjo_user_updated'));
  window.dispatchEvent(new CustomEvent('anjo_idosos_updated'));
  window.dispatchEvent(new CustomEvent('db-vitals-update'));
  window.dispatchEvent(new CustomEvent('db-tasks-update'));
  window.dispatchEvent(new CustomEvent('db-routine-update'));
  window.dispatchEvent(new CustomEvent('db-jornada-update'));
  window.dispatchEvent(new CustomEvent('db-mural-update'));
}


