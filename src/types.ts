export interface StudentProfile {
  id: string;
  name: string;
  photoUrl: string;
  isOnline: boolean;
  isVerified: boolean;
  schoolName: string;
  schoolSubtitle: string;
  responsible: string;
  birthDate: string;
  ageFormatted: string;
  roomName: string;
  teacherName: string;
  teacherRole: string;
  teacherPhoto: string;
  allergyNotice: string;
  tags: { id: string; label: string; icon: 'footprints' | 'music' | 'star' }[];
}

export interface ActivityItem {
  id: string;
  time: string;
  title: string;
  description: string;
  category: string;
  bnccTag: string;
  status: 'pending' | 'completed' | 'skipped';
  isUrgent?: boolean;
  completedAt?: string;
  observation?: string;
  participation?: string;
  photoUrl?: string;
  registeredBy?: string;
}

export interface MedicationItem {
  id: string;
  name: string;
  dose: string;
  instructions: string;
  scheduleDescription: string;
  authorizedBy: string;
  authorizedRole: string;
  pinVerified: boolean;
  status: 'active' | 'suspended';
  lastAdministeredAt?: string;
  lastAdministeredBy?: string;
  history?: {
    id: string;
    timestamp: string;
    administeredBy: string;
    dose: string;
    pinConfirmed: boolean;
    notes?: string;
  }[];
}

export interface MealStatus {
  id: string;
  name: string;
  status: 'SEM REGISTRO' | 'ACEITOU TUDO' | 'ACEITOU BEM' | 'RECUSOU' | 'PARCIAL';
  time?: string;
  icon: string;
  observation?: string;
}

export interface BottleItem {
  id: string;
  label: string;
  targetMl: number;
  consumedMl: number;
  status: 'Tudo' | 'Parcial' | 'Recusou' | 'Sem registro';
  observation: string;
}

export interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  description: string;
  category: 'saude' | 'alimentacao' | 'atividade' | 'medicamento' | 'sono' | 'higiene' | 'geral';
  registeredBy: string;
  badge: string;
  badgeColor: 'emerald' | 'indigo' | 'amber' | 'purple' | 'rose' | 'teal';
  icon: string;
  photoUrl?: string;
  details?: string;
  verified: boolean;
}

export interface NoticeItem {
  id: string;
  title: string;
  content: string;
  author: string;
  role: 'escola' | 'familia' | 'saude' | 'sistema';
  authorPhoto?: string;
  date: string;
  time: string;
  priority: 'normal' | 'importante' | 'urgente';
  isRead: boolean;
  tags?: string[];
}
