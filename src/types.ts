export interface User {
  uid: string;
  email: string;
  role: 'professor' | 'familia' | 'coordenacao';
}

export interface Aluno {
  id: string;
  nome: string;
  turma: string;
}

export interface RotinaRegistro {
  id: string;
  alunoId: string;
  tipo: 'hidratacao' | 'alimentacao' | 'sono' | 'higiene';
  timestamp: Date;
  descricao: string;
}

export interface HydrationRecord {
  id: string;
  studentId: string;
  amountMl: number;
  timestamp: string;
}

export interface AlimentacaoRecord {
  id: string;
  studentId: string;
  foodType: string;
  acceptance: string;
  timestamp: string;
}

export interface HumorRecord {
  id: string;
  studentId: string;
  mood: string;
  note: string;
  timestamp: string;
}

export interface HealthRecord {
  id: string;
  studentId: string;
  sleep: string;
  diaper: string;
  temp: string;
  timestamp: string;
}
