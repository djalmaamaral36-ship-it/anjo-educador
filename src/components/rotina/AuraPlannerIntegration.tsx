import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Clock, CheckCircle2, RotateCcw, Trash2, Edit2, Check, Mic, 
  Plus, Calendar, AlertCircle, Save, X, Utensils, Moon, Droplets, BookOpen, 
  XCircle, Filter, RefreshCw, AlertTriangle, ArrowUpDown, Layers, Pill, Heart
} from 'lucide-react';
import { parseAuraRawPlan, ParsedAuraActivity } from '../../utils/auraPlanParser';
import { DEFAULT_INITIAL_ACTIVITIES as PLAN_ACTIVITIES } from '../../data/weeklyPlan';
import { StudentPaxData } from '../../types';

interface Props {
  onConcluirAtividadePedagogica?: (act: ParsedAuraActivity) => void;
  studentNome?: string;
  student?: StudentPaxData;
  onUpdateStudent?: (updated: Partial<StudentPaxData>) => void;
  userRole?: 'professor' | 'familia';
}

// Converte horário "HH:MM" para minutos para ordenação cronológica precisa
export function parseTimeToMinutes(timeStr?: string): number {
  if (!timeStr) return 0;
  const match = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (!match) return 0;
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
}

// Ordena atividades estritamente pelo horário agendado
export function sortActivitiesBySchedule(list: ParsedAuraActivity[]): ParsedAuraActivity[] {
  return [...list].sort((a, b) => {
    const timeA = parseTimeToMinutes(a.horario);
    const timeB = parseTimeToMinutes(b.horario);
    if (timeA !== timeB) {
      return timeA - timeB;
    }
    return (a.titulo || '').localeCompare(b.titulo || '');
  });
}

// Remove duplicidades de horário dentro do mesmo dia, priorizando atividades customizadas/importadas
export function deduplicateActivities(list: ParsedAuraActivity[]): ParsedAuraActivity[] {
  const result: ParsedAuraActivity[] = [];

  const getNormalizedDay = (day: string): string => {
    const d = (day || '').toLowerCase();
    if (d.includes('seg')) return 'Segunda-feira';
    if (d.includes('ter')) return 'Terça-feira';
    if (d.includes('qua')) return 'Quarta-feira';
    if (d.includes('qui')) return 'Quinta-feira';
    if (d.includes('sex')) return 'Sexta-feira';
    if (d.includes('sab')) return 'Sábado';
    if (d.includes('dom')) return 'Domingo';
    return 'Quarta-feira';
  };

  for (const act of list) {
    const dayKey = getNormalizedDay(act.dia || 'Quarta-feira');
    const timeKey = (act.horario || '').trim();

    const existingIndex = result.findIndex(item => {
      const itemDay = getNormalizedDay(item.dia || 'Quarta-feira');
      return itemDay === dayKey && (item.horario || '').trim() === timeKey;
    });

    if (existingIndex !== -1) {
      const existingItem = result[existingIndex];
      // Se a existente for rotina padrão e a nova não for (ex: importada/customizada), substitui
      if (existingItem.isRotinaPadrao && !act.isRotinaPadrao) {
        result[existingIndex] = act;
      } else if (!existingItem.isRotinaPadrao && act.isRotinaPadrao) {
        // Mantém a customizada (ignora a padrão que está duplicando)
      } else {
        // Se ambas têm o mesmo tipo, escolhe a que tem mais informações (título longo/descrição longa)
        if ((act.titulo || '').length > (existingItem.titulo || '').length) {
          result[existingIndex] = act;
        }
      }
    } else {
      result.push({
        ...act,
        dia: dayKey
      });
    }
  }

  return result;
}

const DEFAULT_INITIAL_ACTIVITIES: ParsedAuraActivity[] = sortActivitiesBySchedule([
  // --- SEGUNDA-FEIRA ---
  {
    id: 'act-seg-1',
    dia: 'Segunda-feira',
    dataStr: '07/09/2026',
    horario: '07:30',
    titulo: 'Acolhida e Entrada',
    descricao: 'Recepção calorosa das crianças, organização dos pertences e canto de bom dia suave, para iniciar o dia com carinho. (BNCC: O eu, o outro e o nós)',
    tipo: 'atividade_fisica',
    item_key: 'acolhida',
    objetivoBNCC: 'O eu, o outro e o nós',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },
  {
    id: 'act-seg-2',
    dia: 'Segunda-feira',
    dataStr: '07/09/2026',
    horario: '08:30',
    titulo: 'Roda de Conversa',
    descricao: 'Momento de interação com as crianças, utilizando gestos e expressões faciais para criar um vínculo afetivo e estimular a comunicação não verbal. (BNCC: O eu, o outro e o nós)',
    tipo: 'atividade_fisica',
    item_key: 'roda_conversa',
    objetivoBNCC: 'O eu, o outro e o nós',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },
  {
    id: 'act-seg-3',
    dia: 'Segunda-feira',
    dataStr: '07/09/2026',
    horario: '09:30',
    titulo: 'Lanche da Manhã',
    descricao: 'Oferecer o lanche da manhã com carinho, permitindo que os bebês explorem a comida com as mãos (sob supervisão) e desenvolvam a autonomia. (BNCC: Corpo, gestos e movimentos)',
    tipo: 'alimentacao',
    item_key: 'lanche_manha',
    objetivoBNCC: 'Corpo, gestos e movimentos',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },
  {
    id: 'act-seg-4',
    dia: 'Segunda-feira',
    dataStr: '07/09/2026',
    horario: '10:00',
    titulo: 'Parque Sensorial',
    descricao: 'Atividade motora ao ar livre no parquinho com circuito de obstáculos seguros, desenvolvendo o equilíbrio e a socialização. (BNCC: Corpo, gestos e movimentos)',
    tipo: 'atividade_fisica',
    item_key: 'parque',
    objetivoBNCC: 'Corpo, gestos e movimentos',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },
  {
    id: 'act-seg-5',
    dia: 'Segunda-feira',
    dataStr: '07/09/2026',
    horario: '10:30',
    titulo: 'Atividade Dirigida',
    descricao: 'Exploração tátil dirigida com elementos naturais e texturas diversas, estimulando a curiosidade sensorial e a motricidade. (BNCC: Corpo, gestos e movimentos)',
    tipo: 'atividade_fisica',
    item_key: 'atividade',
    objetivoBNCC: 'Corpo, gestos e movimentos',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },
  {
    id: 'act-seg-6',
    dia: 'Segunda-feira',
    dataStr: '07/09/2026',
    horario: '11:30',
    titulo: 'Almoço Saudável',
    descricao: 'Momento de refeição guiado pelo educador, garantindo que cada criança seja alimentada de forma segura e receba a atenção necessária. (BNCC: Corpo, gestos e movimentos)',
    tipo: 'alimentacao',
    item_key: 'almoco',
    objetivoBNCC: 'Corpo, gestos e movimentos',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },
  {
    id: 'act-seg-7',
    dia: 'Segunda-feira',
    dataStr: '07/09/2026',
    horario: '12:15',
    titulo: 'Higiene / Escovação',
    descricao: 'Troca de fraldas e higiene pessoal com delicadeza, conversando com o bebê e nomeando as ações, fortalecendo a segurança e o vínculo. (BNCC: Corpo, gestos e movimentos)',
    tipo: 'banho',
    item_key: 'higiene',
    objetivoBNCC: 'Corpo, gestos e movimentos',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },
  {
    id: 'act-seg-8',
    dia: 'Segunda-feira',
    dataStr: '07/09/2026',
    horario: '12:30',
    titulo: 'Soneca / Repouso',
    descricao: 'Acompanhamento individual dos bebês para o sono, com acalanto e presença afetiva, favorecendo um repouso reparador. (BNCC: Corpo, gestos e movimentos)',
    tipo: 'sono',
    item_key: 'sono',
    objetivoBNCC: 'Corpo, gestos e movimentos',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },
  {
    id: 'act-seg-9',
    dia: 'Segunda-feira',
    dataStr: '07/09/2026',
    horario: '14:30',
    titulo: 'Lanche da Tarde',
    descricao: 'Oferta do lanche da tarde, priorizando a alimentação em ambiente tranquilo e acolhedor para que os bebês se sintam seguros para comer. (BNCC: Corpo, gestos e movimentos)',
    tipo: 'alimentacao',
    item_key: 'lanche_tarde',
    objetivoBNCC: 'Corpo, gestos e movimentos',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },
  {
    id: 'act-seg-10',
    dia: 'Segunda-feira',
    dataStr: '07/09/2026',
    horario: '15:00',
    titulo: 'Brincadeira Livre',
    descricao: 'Brincadeira livre com peças grandes de encaixe, estimulando a coordenação motora ampla e a percepção de causa e efeito. (BNCC: Espaços, tempos, quantidades, relações e transformações)',
    tipo: 'atividade_fisica',
    item_key: 'brincadeira_livre',
    objetivoBNCC: 'Espaços, tempos, quantidades, relações e transformações',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },
  {
    id: 'act-seg-11',
    dia: 'Segunda-feira',
    dataStr: '07/09/2026',
    horario: '15:45',
    titulo: 'Contação de Histórias',
    descricao: 'Contação interativa de histórias com dedoches e livros sensoriais, estimulando a escuta atenta, o vocabulário e o imaginário. (BNCC: Escuta, fala, pensamento e imaginação)',
    tipo: 'atividade_fisica',
    item_key: 'leitura',
    objetivoBNCC: 'Escuta, fala, pensamento e imaginação',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },
  {
    id: 'act-seg-12',
    dia: 'Segunda-feira',
    dataStr: '07/09/2026',
    horario: '16:30',
    titulo: 'Preparação para Saída',
    descricao: 'Organização dos pertences e momento de despedida, com uma música calma e palavras de carinho, encerrando o dia de forma harmoniosa. (BNCC: O eu, o outro e o nós)',
    tipo: 'atividade_fisica',
    item_key: 'saida',
    objetivoBNCC: 'O eu, o outro e o nós',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },

  // --- TERÇA-FEIRA ---
  {
    id: 'act-ter-1',
    dia: 'Terça-feira',
    dataStr: '08/09/2026',
    horario: '07:30',
    titulo: 'Acolhida e Entrada',
    descricao: 'Recepção alegre e personalizada para cada criança, com um sorriso e abraço, facilitando a transição da casa para a escola. (BNCC: O eu, o outro e o nós)',
    tipo: 'atividade_fisica',
    item_key: 'acolhida',
    objetivoBNCC: 'O eu, o outro e o nós',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },
  {
    id: 'act-ter-2',
    dia: 'Terça-feira',
    dataStr: '08/09/2026',
    horario: '08:30',
    titulo: 'Roda de Conversa',
    descricao: 'Interação com os bebês utilizando espelhos seguros e coloridos, estimulando o reconhecimento da própria imagem e a percepção do eu. (BNCC: O eu, o outro e o nós)',
    tipo: 'atividade_fisica',
    item_key: 'roda_conversa',
    objetivoBNCC: 'O eu, o outro e o nós',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },
  {
    id: 'act-ter-3',
    dia: 'Terça-feira',
    dataStr: '08/09/2026',
    horario: '09:30',
    titulo: 'Lanche da Manhã',
    descricao: 'Oferecer o lanche da manhã com carinho, permitindo que os bebês explorem a comida com as mãos (sob supervisão) e desenvolvam a autonomia. (BNCC: Corpo, gestos e movimentos)',
    tipo: 'alimentacao',
    item_key: 'lanche_manha',
    objetivoBNCC: 'Corpo, gestos e movimentos',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },
  {
    id: 'act-ter-4',
    dia: 'Terça-feira',
    dataStr: '08/09/2026',
    horario: '10:00',
    titulo: 'Parque / Pátio',
    descricao: 'Circuito motor e brincadeiras no parquinho com túnel de tecido seguro, auxiliando as crianças a engatinhar e andar trabalhando equilíbrio e exploração espacial. (BNCC: Corpo, gestos e movimentos)',
    tipo: 'atividade_fisica',
    item_key: 'parque',
    objetivoBNCC: 'Corpo, gestos e movimentos',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },
  {
    id: 'act-ter-5',
    dia: 'Terça-feira',
    dataStr: '08/09/2026',
    horario: '10:30',
    titulo: 'Atividade Dirigida',
    descricao: 'Exploração tátil dirigida com elementos naturais e texturas diversas, estimulando a curiosidade sensorial, a motricidade e o tato. (BNCC: Corpo, gestos e movimentos)',
    tipo: 'atividade_fisica',
    item_key: 'atividade',
    objetivoBNCC: 'Corpo, gestos e movimentos',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },
  {
    id: 'act-ter-6',
    dia: 'Terça-feira',
    dataStr: '08/09/2026',
    horario: '11:30',
    titulo: 'Almoço',
    descricao: 'Momento de refeição guiado pelo educador, garantindo que cada criança seja alimentada de forma segura e receba a atenção necessária. (BNCC: Corpo, gestos e movimentos)',
    tipo: 'alimentacao',
    item_key: 'almoco',
    objetivoBNCC: 'Corpo, gestos e movimentos',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },
  {
    id: 'act-ter-7',
    dia: 'Terça-feira',
    dataStr: '08/09/2026',
    horario: '12:15',
    titulo: 'Higiene / Escovação',
    descricao: 'Troca de fraldas e higiene pessoal com delicadeza, conversando com o bebê e nomeando as ações, fortalecendo a segurança e o vínculo. (BNCC: Corpo, gestos e movimentos)',
    tipo: 'banho',
    item_key: 'higiene',
    objetivoBNCC: 'Corpo, gestos e movimentos',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },
  {
    id: 'act-ter-8',
    dia: 'Terça-feira',
    dataStr: '08/09/2026',
    horario: '12:30',
    titulo: 'Soneca / Repouso',
    descricao: 'Acompanhamento individual dos bebês para o sono, com acalanto e presença afetiva, favorecendo um repouso reparador. (BNCC: Corpo, gestos e movimentos)',
    tipo: 'sono',
    item_key: 'sono',
    objetivoBNCC: 'Corpo, gestos e movimentos',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },
  {
    id: 'act-ter-9',
    dia: 'Terça-feira',
    dataStr: '08/09/2026',
    horario: '14:30',
    titulo: 'Lanche da Tarde',
    descricao: 'Oferta do lanche da tarde, priorizando a alimentação em ambiente tranquilo e acolhedor para que os bebês se sintam seguros para comer. (BNCC: Corpo, gestos e movimentos)',
    tipo: 'alimentacao',
    item_key: 'lanche_tarde',
    objetivoBNCC: 'Corpo, gestos e movimentos',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },
  {
    id: 'act-ter-10',
    dia: 'Terça-feira',
    dataStr: '08/09/2026',
    horario: '15:00',
    titulo: 'Brincadeira Livre',
    descricao: 'Brincadeira livre com peças grandes de encaixe, estimulando a coordenação motora ampla e a percepção de causa e efeito. (BNCC: Espaços, tempos, quantidades, relações e transformações)',
    tipo: 'atividade_fisica',
    item_key: 'brincadeira_livre',
    objetivoBNCC: 'Espaços, tempos, quantidades, relações e transformações',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },
  {
    id: 'act-ter-11',
    dia: 'Terça-feira',
    dataStr: '08/09/2026',
    horario: '15:45',
    titulo: 'Contação de Histórias',
    descricao: 'Movimento suave com tecidos coloridos, ao som de músicas instrumentais, estimulando a percepção visual e a exploração de movimentos corporais. (BNCC: Corpo, gestos e movimentos)',
    tipo: 'atividade_fisica',
    item_key: 'leitura',
    objetivoBNCC: 'Corpo, gestos e movimentos',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },
  {
    id: 'act-ter-12',
    dia: 'Terça-feira',
    dataStr: '08/09/2026',
    horario: '16:30',
    titulo: 'Preparação para Saída',
    descricao: 'Organização dos pertences e momento de despedida, com uma música calma e palavras de carinho, encerrando o dia de forma harmoniosa. (BNCC: O eu, o outro e o nós)',
    tipo: 'atividade_fisica',
    item_key: 'saida',
    objetivoBNCC: 'O eu, o outro e o nós',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },

  // --- QUARTA-FEIRA ---
  {
    id: 'act-1',
    dia: 'Quarta-feira',
    dataStr: '09/09/2026',
    horario: '07:30',
    titulo: 'Acolhida e Entrada',
    descricao: 'Recepção alegre e personalizada para cada criança, com um sorriso e abraço, facilitando a transição da casa para a escola. (BNCC: O eu, o outro e o nós)',
    tipo: 'atividade_fisica',
    item_key: 'acolhida',
    objetivoBNCC: 'O eu, o outro e o nós',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },
  {
    id: 'act-2',
    dia: 'Quarta-feira',
    dataStr: '09/09/2026',
    horario: '08:30',
    titulo: 'Roda de Conversa',
    descricao: 'Interação com os bebês utilizando espelhos seguros e coloridos, estimulando o reconhecimento da própria imagem e a percepção do eu. (BNCC: O eu, o outro e o nós)',
    tipo: 'atividade_fisica',
    item_key: 'roda_conversa',
    objetivoBNCC: 'O eu, o outro e o nós',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },
  {
    id: 'act-3',
    dia: 'Quarta-feira',
    dataStr: '09/09/2026',
    horario: '09:30',
    titulo: 'Lanche da Manhã',
    descricao: 'Oferecer o lanche da manhã com carinho, permitindo que os bebês explorem a comida com as mãos (sob supervisão) e desenvolvam a autonomia. (BNCC: Corpo, gestos e movimentos)',
    tipo: 'alimentacao',
    item_key: 'lanche_manha',
    objetivoBNCC: 'Corpo, gestos e movimentos',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },
  {
    id: 'act-4',
    dia: 'Quarta-feira',
    dataStr: '09/09/2026',
    horario: '10:00',
    titulo: 'Parque Sensorial com Túnel de Pano',
    descricao: 'Circuito motor e brincadeiras no parquinho com túnel de tecido seguro, auxiliando as crianças a engatinhar e andar trabalhando equilíbrio e exploração espacial. (BNCC: Corpo, gestos e movimentos)',
    tipo: 'atividade_fisica',
    item_key: 'parque',
    objetivoBNCC: 'Corpo, gestos e movimentos',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },
  {
    id: 'act-5',
    dia: 'Quarta-feira',
    dataStr: '09/09/2026',
    horario: '10:30',
    titulo: 'Caixa Mágica das Texturas',
    descricao: 'Exploração tátil dirigida com elementos naturais e texturas diversas, estimulando a curiosidade sensorial, a motricidade e o tato. (BNCC: Corpo, gestos e movimentos)',
    tipo: 'atividade_fisica',
    item_key: 'atividade',
    objetivoBNCC: 'Corpo, gestos e movimentos',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },
  {
    id: 'act-6',
    dia: 'Quarta-feira',
    dataStr: '09/09/2026',
    horario: '11:30',
    titulo: 'Almoço Saudável',
    descricao: 'Momento de refeição guiado pelo educador, garantindo que cada criança seja alimentada de forma segura e receba a atenção necessária. (BNCC: Corpo, gestos e movimentos)',
    tipo: 'alimentacao',
    item_key: 'almoco',
    objetivoBNCC: 'Corpo, gestos e movimentos',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },
  {
    id: 'act-7',
    dia: 'Quarta-feira',
    dataStr: '09/09/2026',
    horario: '12:15',
    titulo: 'Higiene / Troca de Fralda',
    descricao: 'Troca de fraldas e higiene pessoal com delicadeza, conversando com o bebê e nomeando as ações, fortalecendo a segurança e o vínculo. (BNCC: Corpo, gestos e movimentos)',
    tipo: 'banho',
    item_key: 'higiene',
    objetivoBNCC: 'Corpo, gestos e movimentos',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },
  {
    id: 'act-8',
    dia: 'Quarta-feira',
    dataStr: '09/09/2026',
    horario: '12:30',
    titulo: 'Momento do Soninho / Descanso',
    descricao: 'Acompanhamento individual dos bebês para o sono, com acalanto e presença afetiva, favorecendo um repouso reparador. (BNCC: Corpo, gestos e movimentos)',
    tipo: 'sono',
    item_key: 'sono',
    objetivoBNCC: 'Corpo, gestos e movimentos',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },
  {
    id: 'act-9',
    dia: 'Quarta-feira',
    dataStr: '09/09/2026',
    horario: '14:30',
    titulo: 'Lanche da Tarde',
    descricao: 'Oferta do lanche da tarde, priorizando a alimentação em ambiente tranquilo e acolhedor para que os bebês se sintam seguros para comer. (BNCC: Corpo, gestos e movimentos)',
    tipo: 'alimentacao',
    item_key: 'lanche_tarde',
    objetivoBNCC: 'Corpo, gestos e movimentos',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },
  {
    id: 'act-10',
    dia: 'Quarta-feira',
    dataStr: '09/09/2026',
    horario: '15:00',
    titulo: 'Exploração de Brinquedos de Encaixe Grandes',
    descricao: 'Brincadeira livre com peças grandes de encaixe, estimulando a coordenação motora ampla e a percepção de causa e efeito. (BNCC: Espaços, tempos, quantidades, relações e transformações)',
    tipo: 'atividade_fisica',
    item_key: 'brincadeira_livre',
    objetivoBNCC: 'Espaços, tempos, quantidades, relações e transformações',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },
  {
    id: 'act-11',
    dia: 'Quarta-feira',
    dataStr: '09/09/2026',
    horario: '15:45',
    titulo: 'Música e Movimento com Tecidos',
    descricao: 'Movimento suave com tecidos coloridos, ao som de músicas instrumentais, estimulando a percepção visual e a exploração de movimentos corporais. (BNCC: Corpo, gestos e movimentos)',
    tipo: 'atividade_fisica',
    item_key: 'leitura',
    objetivoBNCC: 'Corpo, gestos e movimentos',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },
  {
    id: 'act-12',
    dia: 'Quarta-feira',
    dataStr: '09/09/2026',
    horario: '16:30',
    titulo: 'Preparação para Saída & Despedida',
    descricao: 'Organização dos pertences e momento de despedida, com uma música calma e palavras de carinho, encerrando o dia de forma harmoniosa. (BNCC: O eu, o outro e o nós)',
    tipo: 'atividade_fisica',
    item_key: 'saida',
    objetivoBNCC: 'O eu, o outro e o nós',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },

  // --- QUINTA-FEIRA ---
  {
    id: 'act-qui-1',
    dia: 'Quinta-feira',
    dataStr: '10/09/2026',
    horario: '07:30',
    titulo: 'Acolhida e Entrada',
    descricao: 'Recepção afetuosa e roda de acolhimento para iniciar o dia letivo com alegria, tranquilidade e segurança emocional. (BNCC: O eu, o outro e o nós)',
    tipo: 'atividade_fisica',
    item_key: 'acolhida',
    objetivoBNCC: 'O eu, o outro e o nós',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },
  {
    id: 'act-qui-2',
    dia: 'Quinta-feira',
    dataStr: '10/09/2026',
    horario: '08:30',
    titulo: 'Roda de Conversa Musical',
    descricao: 'Cantigas de roda tradicionais e interação sonora com chocalhos artesanais, estimulando a escuta, a musicalidade e a socialização. (BNCC: Traços, sons, cores e formas)',
    tipo: 'atividade_fisica',
    item_key: 'roda_conversa',
    objetivoBNCC: 'Traços, sons, cores e formas',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },
  {
    id: 'act-qui-3',
    dia: 'Quinta-feira',
    dataStr: '10/09/2026',
    horario: '09:30',
    titulo: 'Lanche da Manhã',
    descricao: 'Oferecer o lanche da manhã com carinho, permitindo que os bebês explorem a comida com as mãos (sob supervisão) e desenvolvam a autonomia. (BNCC: Corpo, gestos e movimentos)',
    tipo: 'alimentacao',
    item_key: 'lanche_manha',
    objetivoBNCC: 'Corpo, gestos e movimentos',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },
  {
    id: 'act-qui-4',
    dia: 'Quinta-feira',
    dataStr: '10/09/2026',
    horario: '10:00',
    titulo: 'Parque / Pátio',
    descricao: 'Atividade motora ao ar livre estimulando o equilíbrio, a exploração do espaço amplo e a interação com a natureza do ambiente escolar. (BNCC: Corpo, gestos e movimentos)',
    tipo: 'atividade_fisica',
    item_key: 'parque',
    objetivoBNCC: 'Corpo, gestos e movimentos',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },
  {
    id: 'act-qui-5',
    dia: 'Quinta-feira',
    dataStr: '10/09/2026',
    horario: '10:30',
    titulo: 'Atividade Dirigida',
    descricao: 'Exploração criativa com pintura guiada e carimbos com as mãos usando tintas atóxicas, desenvolvendo a coordenação e a expressão estética. (BNCC: Traços, sons, cores e formas)',
    tipo: 'atividade_fisica',
    item_key: 'atividade',
    objetivoBNCC: 'Traços, sons, cores e formas',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },
  {
    id: 'act-qui-6',
    dia: 'Quinta-feira',
    dataStr: '10/09/2026',
    horario: '11:30',
    titulo: 'Almoço',
    descricao: 'Momento de refeição guiado pelo educador, garantindo que cada criança seja alimentada de forma segura e receba a atenção necessária. (BNCC: Corpo, gestos e movimentos)',
    tipo: 'alimentacao',
    item_key: 'almoco',
    objetivoBNCC: 'Corpo, gestos e movimentos',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },
  {
    id: 'act-qui-7',
    dia: 'Quinta-feira',
    dataStr: '10/09/2026',
    horario: '12:15',
    titulo: 'Higiene / Escovação',
    descricao: 'Troca de fraldas e higiene pessoal com delicadeza, conversando com o bebê e nomeando as ações, fortalecendo a segurança e o vínculo. (BNCC: Corpo, gestos e movimentos)',
    tipo: 'banho',
    item_key: 'higiene',
    objetivoBNCC: 'Corpo, gestos e movimentos',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },
  {
    id: 'act-qui-8',
    dia: 'Quinta-feira',
    dataStr: '10/09/2026',
    horario: '12:30',
    titulo: 'Soneca / Repouso',
    descricao: 'Acompanhamento individual dos bebês para o sono, com acalanto e presença afetiva, favorecendo um repouso reparador. (BNCC: Corpo, gestos e movimentos)',
    tipo: 'sono',
    item_key: 'sono',
    objetivoBNCC: 'Corpo, gestos e movimentos',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },
  {
    id: 'act-qui-9',
    dia: 'Quinta-feira',
    dataStr: '10/09/2026',
    horario: '14:30',
    titulo: 'Lanche da Tarde',
    descricao: 'Oferta do lanche da tarde, priorizando a alimentação em ambiente tranquilo e acolhedor para que os bebês se sintam seguros para comer. (BNCC: Corpo, gestos e movimentos)',
    tipo: 'alimentacao',
    item_key: 'lanche_tarde',
    objetivoBNCC: 'Corpo, gestos e movimentos',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },
  {
    id: 'act-qui-10',
    dia: 'Quinta-feira',
    dataStr: '10/09/2026',
    horario: '15:00',
    titulo: 'Brincadeira Livre',
    descricao: 'Brincadeira livre com blocos de montar e encaixe, estimulando a criatividade, a concentração e a autonomia. (BNCC: Espaços, tempos, quantidades, relações e transformações)',
    tipo: 'atividade_fisica',
    item_key: 'brincadeira_livre',
    objetivoBNCC: 'Espaços, tempos, quantidades, relações e transformações',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },
  {
    id: 'act-qui-11',
    dia: 'Quinta-feira',
    dataStr: '10/09/2026',
    horario: '15:45',
    titulo: 'Contação de Histórias',
    descricao: 'Leitura de livrinhos ilustrados com animais e texturas, despertando o gosto pela literatura infantil desde cedo. (BNCC: Escuta, fala, pensamento e imaginação)',
    tipo: 'atividade_fisica',
    item_key: 'leitura',
    objetivoBNCC: 'Escuta, fala, pensamento e imaginação',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },
  {
    id: 'act-qui-12',
    dia: 'Quinta-feira',
    dataStr: '10/09/2026',
    horario: '16:30',
    titulo: 'Preparação para Saída',
    descricao: 'Organização dos pertences e momento de despedida, com uma música calma e palavras de carinho, encerrando o dia de forma harmoniosa. (BNCC: O eu, o outro e o nós)',
    tipo: 'atividade_fisica',
    item_key: 'saida',
    objetivoBNCC: 'O eu, o outro e o nós',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },

  // --- SEXTA-FEIRA ---
  {
    id: 'act-sex-1',
    dia: 'Sexta-feira',
    dataStr: '11/09/2026',
    horario: '07:30',
    titulo: 'Acolhida e Entrada',
    descricao: 'Recepção festiva e acolhedora para celebrar o encerramento da semana letiva com alegria e afeto. (BNCC: O eu, o outro e o nós)',
    tipo: 'atividade_fisica',
    item_key: 'acolhida',
    objetivoBNCC: 'O eu, o outro e o nós',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },
  {
    id: 'act-sex-2',
    dia: 'Sexta-feira',
    dataStr: '11/09/2026',
    horario: '08:30',
    titulo: 'Roda de Conversa',
    descricao: 'Roda de conversa festiva relembrando os momentos felizes da semana e celebrando as descobertas das crianças. (BNCC: O eu, o outro e o nós)',
    tipo: 'atividade_fisica',
    item_key: 'roda_conversa',
    objetivoBNCC: 'O eu, o outro e o nós',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },
  {
    id: 'act-sex-3',
    dia: 'Sexta-feira',
    dataStr: '11/09/2026',
    horario: '09:30',
    titulo: 'Lanche da Manhã',
    descricao: 'Oferecer o lanche da manhã com carinho, permitindo que os bebês explorem a comida com as mãos (sob supervisão) e desenvolvam a autonomia. (BNCC: Corpo, gestos e movimentos)',
    tipo: 'alimentacao',
    item_key: 'lanche_manha',
    objetivoBNCC: 'Corpo, gestos e movimentos',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },
  {
    id: 'act-sex-4',
    dia: 'Sexta-feira',
    dataStr: '11/09/2026',
    horario: '10:00',
    titulo: 'Parque / Pátio',
    descricao: 'Brincadeiras livres e prazerosas no pátio com bolinhas de sabão e espaço amplo ao ar livre. (BNCC: Corpo, gestos e movimentos)',
    tipo: 'atividade_fisica',
    item_key: 'parque',
    objetivoBNCC: 'Corpo, gestos e movimentos',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },
  {
    id: 'act-sex-5',
    dia: 'Sexta-feira',
    dataStr: '11/09/2026',
    horario: '10:30',
    titulo: 'Atividade Dirigida',
    descricao: 'Atividade sensorial coletiva com massinha de modelar caseira e atóxica, estimulando a coordenação fina e a criatividade. (BNCC: Corpo, gestos e movimentos)',
    tipo: 'atividade_fisica',
    item_key: 'atividade',
    objetivoBNCC: 'Corpo, gestos e movimentos',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },
  {
    id: 'act-sex-6',
    dia: 'Sexta-feira',
    dataStr: '11/09/2026',
    horario: '11:30',
    titulo: 'Almoço',
    descricao: 'Momento de refeição guiado pelo educador, garantindo que cada criança seja alimentada de forma segura e receba a atenção necessária. (BNCC: Corpo, gestos e movimentos)',
    tipo: 'alimentacao',
    item_key: 'almoco',
    objetivoBNCC: 'Corpo, gestos e movimentos',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },
  {
    id: 'act-sex-7',
    dia: 'Sexta-feira',
    dataStr: '11/09/2026',
    horario: '12:15',
    titulo: 'Higiene / Escovação',
    descricao: 'Troca de fraldas e higiene pessoal com delicadeza, conversando com o bebê e nomeando as ações, fortalecendo a segurança e o vínculo. (BNCC: Corpo, gestos e movimentos)',
    tipo: 'banho',
    item_key: 'higiene',
    objetivoBNCC: 'Corpo, gestos e movimentos',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },
  {
    id: 'act-sex-8',
    dia: 'Sexta-feira',
    dataStr: '11/09/2026',
    horario: '12:30',
    titulo: 'Soneca / Repouso',
    descricao: 'Acompanhamento individual dos bebês para o sono, com acalanto e presença afetiva, favorecendo um repouso reparador. (BNCC: Corpo, gestos e movimentos)',
    tipo: 'sono',
    item_key: 'sono',
    objetivoBNCC: 'Corpo, gestos e movimentos',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },
  {
    id: 'act-sex-9',
    dia: 'Sexta-feira',
    dataStr: '11/09/2026',
    horario: '14:30',
    titulo: 'Lanche da Tarde',
    descricao: 'Oferta do lanche da tarde, priorizando a alimentação em ambiente tranquilo e acolhedor para que os bebês se sintam seguros para comer. (BNCC: Corpo, gestos e movimentos)',
    tipo: 'alimentacao',
    item_key: 'lanche_tarde',
    objetivoBNCC: 'Corpo, gestos e movimentos',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },
  {
    id: 'act-sex-10',
    dia: 'Sexta-feira',
    dataStr: '11/09/2026',
    horario: '15:00',
    titulo: 'Brincadeira Livre',
    descricao: 'Brincadeira livre com brinquedos prediletos e interação coletiva entre as turminhas. (BNCC: O eu, o outro e o nós)',
    tipo: 'atividade_fisica',
    item_key: 'brincadeira_livre',
    objetivoBNCC: 'O eu, o outro e o nós',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },
  {
    id: 'act-sex-11',
    dia: 'Sexta-feira',
    dataStr: '11/09/2026',
    horario: '15:45',
    titulo: 'Contação de Histórias',
    descricao: 'Roda musical com instrumentos de percussão infantis, dança livre e celebração de encerramento da semana. (BNCC: Traços, sons, cores e formas)',
    tipo: 'atividade_fisica',
    item_key: 'leitura',
    objetivoBNCC: 'Traços, sons, cores e formas',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  },
  {
    id: 'act-sex-12',
    dia: 'Sexta-feira',
    dataStr: '11/09/2026',
    horario: '16:30',
    titulo: 'Preparação para Saída',
    descricao: 'Organização dos pertences, entrega de lembrancinhas da semana e despedida carinhosa para o final de semana. (BNCC: O eu, o outro e o nós)',
    tipo: 'atividade_fisica',
    item_key: 'saida',
    objetivoBNCC: 'O eu, o outro e o nós',
    status: 'pendente',
    entregue: false,
    isRotinaPadrao: true
  }
]);

interface ConflictState {
  newActivity: ParsedAuraActivity;
  existingActivity: ParsedAuraActivity;
}

export default function AuraPlannerIntegration({ 
  onConcluirAtividadePedagogica, 
  studentNome = 'Mariana Souza',
  student,
  onUpdateStudent,
  userRole = 'professor'
}: Props) {
  // Trava de segurança: impede registros se o cronômetro do aluno estiver parado
  const isCronometroAtivo = student?.presenca?.isTimerRunning && student?.presenca?.status === 'em_aula';

  const validarCronometro = () => {
    if (!isCronometroAtivo) {
      alert(`⏱️ ATENÇÃO: O cronômetro de aula de ${student?.nome || studentNome || 'aluno'} está PARADO! Inicie a aula para registrar atividades ou medicamentos.`);
      return false;
    }
    return true;
  };

  const [inputText, setInputText] = useState('');
 const [activities, setActivities] = useState<ParsedAuraActivity[]>(() => sortActivitiesBySchedule(deduplicateActivities(PLAN_ACTIVITIES)));
 
  const [selectedDayTab, setSelectedDayTab] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('anjinho_planner_selected_day');
      if (saved && (saved === 'all' || ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira'].includes(saved))) {
        return saved;
      }
    } catch (e) {
      // ignore
    }
    return 'all';
  });

  const handleSelectDayTab = (day: string) => {
    setSelectedDayTab(day);
    try {
      localStorage.setItem('anjinho_planner_selected_day', day);
    } catch (e) {
      // ignore
    }
  };
  const [statusFilter, setStatusFilter] = useState<'todas' | 'pendentes' | 'entregues' | 'recusadas'>('todas');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Controle de exibição do formulário de agendamento de nova atividade
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<'direto' | 'importar'>('direto');

  // Formulário de Nova Atividade
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('10:00');
  const [newTipo, setNewTipo] = useState<'alimentacao' | 'medicacao' | 'atividade_fisica' | 'banho' | 'sono' | 'humor'>('atividade_fisica');
  const [newDia, setNewDia] = useState('Quarta-feira');
  const [newDesc, setNewDesc] = useState('');
  const [newBncc, setNewBncc] = useState('Corpo, gestos e movimentos');
  const [newScope, setNewScope] = useState<'individual' | 'classe'>('individual');
  const [isListeningTitle, setIsListeningTitle] = useState(false);
  const [isListeningDesc, setIsListeningDesc] = useState(false);

  // Estado de aviso de conflito de horário
  const [conflictState, setConflictState] = useState<ConflictState | null>(null);

  // Estados de edição de atividade existente
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ParsedAuraActivity | null>(null);

  // Observações por atividade
  const [activityNotes, setActivityNotes] = useState<Record<string, string>>({});
  const [listeningNoteId, setListeningNoteId] = useState<string | null>(null);

  // Escopo de aplicação por cartão: 'coletivo' (toda a turma) ou 'individual' (apenas este aluno)
  const [activityScopes, setActivityScopes] = useState<Record<string, 'coletivo' | 'individual'>>({});

  // Visualizador de foto/anexo de medicamento para conferência da professora
  const [previewMedImage, setPreviewMedImage] = useState<string | null>(null);

  // Sincroniza com o cronômetro / novo período: quando o cronômetro é iniciado ou religado,
  // todas as atividades da agenda entram/retornam para o status pendente
  useEffect(() => {
    const handleResetAllToPending = () => {
      setActivities((prev) =>
        prev.map((act) => ({
          ...act,
          status: 'pendente' as const,
          entregue: false,
          observacao: undefined,
        }))
      );
      setActivityNotes({});
      setStatusFilter('todas');

      // Limpa os registros de medicamentos também ao zerar o cronômetro / iniciar novo período
      if (student && student.medicamentos && onUpdateStudent) {
        const resetMeds = student.medicamentos.map((m) => ({
          ...m,
          ministradoHoje: false,
          ministradoDias: [],
          observacoesDias: {},
          ministradoPor: undefined,
          ministradoHorario: undefined,
          observacaoMinistracao: undefined,
        }));
        onUpdateStudent({
          medicamentos: resetMeds,
        });
      }
    };

    const handleRotinaRegistrada = (e: Event) => {
      const customEvent = e as CustomEvent<{ itemKey: string; status: string; observacao?: string }>;
      if (!customEvent.detail) return;
      const { itemKey, status, observacao } = customEvent.detail;
      
      setActivities((prev) =>
        prev.map((act) => {
          const isLancheManha = itemKey === 'lanche_manha' && act.titulo.toLowerCase().includes('lanche da manhã');
          const isAlmoco = itemKey === 'almoco' && act.titulo.toLowerCase().includes('almoço');
          const isLancheTarde = itemKey === 'lanche_tarde' && act.titulo.toLowerCase().includes('lanche da tarde');
          const isSono = itemKey === 'sono' && act.titulo.toLowerCase().includes('soneca');
          const isHigiene = itemKey === 'higiene' && act.titulo.toLowerCase().includes('higiene');
          
          const matchesKey = act.item_key === itemKey || isLancheManha || isAlmoco || isLancheTarde || isSono || isHigiene;
            
          if (matchesKey) {
            return {
              ...act,
              status: status === 'Rejeitou' ? 'recusou' as const : 'entregue' as const,
              entregue: status !== 'Rejeitou',
              observacao: observacao || `Sincronizado da Rotina Diária: ${status}`,
            };
          }
          return act;
        })
      );
    };

    window.addEventListener('anjinho:reset-activities-to-pending', handleResetAllToPending);
    window.addEventListener('anjinho:rotina-registrada', handleRotinaRegistrada);
    return () => {
      window.removeEventListener('anjinho:reset-activities-to-pending', handleResetAllToPending);
      window.removeEventListener('anjinho:rotina-registrada', handleRotinaRegistrada);
    };
  }, []);

  // Horários rápidos pré-configurados (Escola 07:30 às 16:30)
  const TIME_PRESETS = ['07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:15', '12:30', '13:30', '14:00', '14:30', '15:00', '15:45', '16:00', '16:30'];

  // Modelos Rápidos de Atividades Escolares
  const QUICK_MODELS = [
    {
      nome: 'Aula de Artes & Pintura',
      tipo: 'atividade_fisica' as const,
      horario: '10:30',
      bncc: 'Traços, sons, cores e formas',
      desc: 'Exploração de cores e tintas atóxicas em papel craft no chão, estimulando a coordenação motora fina e a livre expressão artística.'
    },
    {
      nome: 'Hora do Conto & Leitura',
      tipo: 'atividade_fisica' as const,
      horario: '15:45',
      bncc: 'Escuta, fala, pensamento e imaginação',
      desc: 'Contação interativa de histórias com dedoches e livros sensoriais, estimulando a escuta atenta, o vocabulário e o imaginário.'
    },
    {
      nome: 'Brincadeiras no Parquinho',
      tipo: 'atividade_fisica' as const,
      horario: '10:00',
      bncc: 'Corpo, gestos e movimentos',
      desc: 'Atividade motora ao ar livre no parquinho com circuito de obstáculos seguros, desenvolvendo o equilíbrio e a socialização.'
    },
    {
      nome: 'Hora da Frutinha & Hidratação',
      tipo: 'alimentacao' as const,
      horario: '09:30',
      bncc: 'Corpo, gestos e movimentos',
      desc: 'Oferecer frutinhas picadas frescas da estação e água fresca, incentivando a autonomia alimentar e o paladar saudável.'
    },
    {
      nome: 'Soneca Pós-Almoço',
      tipo: 'sono' as const,
      horario: '12:30',
      bncc: 'Corpo, gestos e movimentos',
      desc: 'Ambiente climatizado com luz suave e música de ninar para descanso reparador dos bebês e crianças.'
    },
    {
      nome: 'Higiene Oral & Escovar Dentes',
      tipo: 'banho' as const,
      horario: '12:15',
      bncc: 'Corpo, gestos e movimentos',
      desc: 'Troca de fraldas e estímulo lúdico à escovação dental com água e escovinha macia, promovendo hábitos de autocuidado.'
    }
  ];

  // Abas fixas com todos os dias da semana para garantir que terça, quarta e demais dias estejam sempre selecionáveis
  const WEEKDAY_ORDER = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira'];
  const uniqueDaysMap = new Map<string, { dia: string; count: number }>();
  
  // Inicializar com todos os dias da semana com count 0
  WEEKDAY_ORDER.forEach(dia => {
    uniqueDaysMap.set(dia, { dia, count: 0 });
  });

  activities.forEach((act) => {
    let key = act.dia || 'Quarta-feira';
    if (/ter/i.test(key)) key = 'Terça-feira';
    if (/seg/i.test(key)) key = 'Segunda-feira';
    if (/qua/i.test(key)) key = 'Quarta-feira';
    if (/qui/i.test(key)) key = 'Quinta-feira';
    if (/sex/i.test(key)) key = 'Sexta-feira';
    if (/sab/i.test(key)) key = 'Sábado';

    const existing = uniqueDaysMap.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      uniqueDaysMap.set(key, { dia: key, count: 1 });
    }
  });

  const daySummaries = Array.from(uniqueDaysMap.values()).sort((a, b) => {
    const idxA = WEEKDAY_ORDER.indexOf(a.dia);
    const idxB = WEEKDAY_ORDER.indexOf(b.dia);
    return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
  });

  // Função auxiliar para verificar se o medicamento está programado para o dia da semana
  const isMedicationForDay = (diasSemana: string[] | undefined, dayName: string): boolean => {
    if (!diasSemana || diasSemana.length === 0 || diasSemana.includes('Todos')) {
      return true;
    }
    const dLower = dayName.toLowerCase().trim();
    return diasSemana.some((dia) => {
      const diaLower = dia.toLowerCase().trim();
      if (diaLower === 'todos') return true;
      if (diaLower.startsWith('seg') && dLower.includes('seg')) return true;
      if (diaLower.startsWith('ter') && (dLower.includes('ter') || dLower.includes('terça') || dLower.includes('terca'))) return true;
      if (diaLower.startsWith('qua') && dLower.includes('qua')) return true;
      if (diaLower.startsWith('qui') && dLower.includes('qui')) return true;
      if (diaLower.startsWith('sex') && dLower.includes('sex')) return true;
      if (diaLower.startsWith('sab') && (dLower.includes('sab') || dLower.includes('sábado') || dLower.includes('sabado'))) return true;
      if (diaLower.startsWith('dom') && (dLower.includes('dom') || dLower.includes('domingo'))) return true;
      return false;
    });
  };

  // Gera atividades de medicação dinamicamente a partir das prescrições ativas do aluno
  const getDynamicMedicationActivities = (): ParsedAuraActivity[] => {
    if (!student || !student.medicamentos) return [];
    
    const medActivities: ParsedAuraActivity[] = [];
    
    student.medicamentos.forEach((med) => {
      // Ignorar se o medicamento não estiver ativo ou estiver suspenso
      if (!med.ativo || med.suspenso) return;
      
      // Extrair todos os padrões de horários do tipo HH:MM (ex: "08:00 e 14:00" -> ["08:00", "14:00"])
      const timeRegex = /\b\d{1,2}:\d{2}\b/g;
      const times = med.horario.match(timeRegex) || [med.horario];
      
      times.forEach((timeStr, timeIdx) => {
        const cleanTime = timeStr.trim();
        
        // Se a aba selecionada for "Todos os Dias", avalia todos os dias com atividades; senão avalia apenas o dia selecionado
        const targetDays = selectedDayTab === 'all'
          ? (daySummaries.length > 0 ? daySummaries.map(d => d.dia) : WEEKDAY_ORDER)
          : [selectedDayTab];

        // Filtra estritamente pelos dias em que o medicamento foi prescrito (ex: Seg, Ter, Qua)
        const validDays = targetDays.filter((dayName) => isMedicationForDay(med.diasSemana, dayName));
          
        validDays.forEach((dayName) => {
          const isMinistradoNoDia = med.ministradoDias?.includes(dayName) || (dayName === 'Segunda-feira' && med.ministradoHoje);
          const obsDia = med.observacoesDias?.[dayName] || med.observacaoMinistracao || '';
          const diasTexto = med.diasSemana && med.diasSemana.length > 0 ? med.diasSemana.join(', ') : 'Todos os dias úteis';

          medActivities.push({
            id: `med-dyn-${med.id}-${cleanTime}-${dayName}-${timeIdx}`,
            dia: dayName,
            horario: cleanTime,
            titulo: `💊 Medicamento: ${med.nome}`,
            descricao: `Dosagem: ${med.dosagem}. Dias programados: ${diasTexto}. Instruções: ${med.instrucoes}. (Prescrito pelos Pais)`,
            tipo: 'medicacao',
            status: isMinistradoNoDia ? 'entregue' : 'pendente',
            entregue: !!isMinistradoNoDia,
            isRotinaPadrao: false,
            objetivoBNCC: 'Cuidado, saúde e bem-estar do bebê',
            observacao: isMinistradoNoDia ? obsDia : '',
            escopo: 'individual',
            anexoReceitaUrl: med.anexoReceitaUrl,
            diasSemana: med.diasSemana
          });
        });
      });
    });
    
    return medActivities;
  };

  const dynamicMedications = getDynamicMedicationActivities();
  const allCombinedActivities = [
    ...activities,
    ...dynamicMedications
  ];
  const sortedCombined = sortActivitiesBySchedule(allCombinedActivities);

  // Contadores de status (calculados sobre a lista combinada)
  const pendingCount = sortedCombined.filter((a) => a.status === 'pendente' || (!a.status && !a.entregue)).length;
  const entregueCount = sortedCombined.filter((a) => a.status === 'entregue' || a.entregue).length;
  const recusouCount = sortedCombined.filter((a) => a.status === 'recusou').length;

  // Filtros combinados (Dia + Status)
  const filteredActivities = sortedCombined.filter((act) => {
    const matchesDay = selectedDayTab === 'all' || act.dia === selectedDayTab;
    if (!matchesDay) return false;

    if (statusFilter === 'pendentes') {
      return act.status === 'pendente' || (!act.status && !act.entregue);
    }
    if (statusFilter === 'entregues') {
      return act.status === 'entregue' || act.entregue;
    }
    if (statusFilter === 'recusadas') {
      return act.status === 'recusou';
    }
    return true;
  });

  // Extrair texto da Aura (garantindo que todas as atividades importadas comecem como pendentes)
  const handleExtract = () => {
    if (!inputText.trim()) return;
    setIsProcessing(true);
    setTimeout(() => {
      const parsed = parseAuraRawPlan(inputText);
      if (parsed.activities && parsed.activities.length > 0) {
        const pendingImportedActivities = parsed.activities.map((act) => ({
          ...act,
          status: 'pendente' as const,
          entregue: false,
          observacao: undefined,
        }));
        setActivities((prev) => sortActivitiesBySchedule(deduplicateActivities([...prev, ...pendingImportedActivities])));
      }
      setSelectedDayTab('all');
      setShowForm(false);
      setIsProcessing(false);
    }, 400);
  };

  const handleCopyModel = () => {
    const modelText = `Atue como Especialista em Educação Infantil (Anjinha Aura). Crie um planejamento de aulas / rotina escolar detalhado para os dias desejados (ex: 9 e 10 de setembro) ou para a semana inteira, com horários de 07:30 até 16:30.

Siga o padrão com horários, títulos, descrições afetivas e objetivos BNCC:

07:30: Acolhida e Entrada - Recepção alegre e personalizada para cada criança, com um sorriso e abraço, facilitando a transição da casa para a escola. (BNCC: O eu, o outro e o nós)
08:30: Roda de Conversa - Interação com os bebês utilizando espelhos seguros e coloridos, estimulando o reconhecimento da própria imagem e a percepção do eu. (BNCC: O eu, o outro e o nós)
09:30: Lanche da Manhã - Oferecer o lanche da manhã com carinho, permitindo que os bebês explorem a comida com as mãos (sob supervisão) e desenvolvam a autonomia. (BNCC: Corpo, gestos e movimentos)
10:00: Espelho Mágico - Exploração de espelhos inquebráveis em diferentes posições, incentivando o reconhecimento facial, a interação e a expressão de sentimentos. (BNCC: O eu, o outro e o nós)
10:30: Descoberta Tátil com Água - Brincadeira com potes de água em pequena quantidade (sob supervisão total), permitindo a exploração sensorial do líquido e seus efeitos (respingos, temperatura). (BNCC: Corpo, gestos e movimentos)
11:30: Almoço Saudável - Momento de refeição guiado pelo educador, garantindo que cada criança seja alimentada de forma segura e receba a atenção necessária. (BNCC: Corpo, gestos e movimentos)
12:15: Higiene / Troca de Fralda - Troca de fraldas e higiene pessoal com delicadeza, conversando com o bebê e nomeando as ações, fortalecendo a segurança e o vínculo. (BNCC: Corpo, gestos e movimentos)
12:30: Momento do Soninho / Descanso - Acompanhamento individual dos bebês para o sono, com acalanto e presença afetiva, favorecendo um repouso reparador. (BNCC: Corpo, gestos e movimentos)
14:30: Lanche da Tarde - Oferta do lanche da tarde, priorizando a alimentação em ambiente tranquilo e acolhedor para que os bebês se sintam seguros para comer. (BNCC: Corpo, gestos e movimentos)
15:00: Exploração de Brinquedos de Encaixe Grandes - Brincadeira livre com peças grandes de encaixe, estimulando a coordenação motora ampla e a percepção de causa e efeito. (BNCC: Espaços, tempos, quantidades, relações e transformações)
15:45: Música e Movimento com Tecidos - Movimento suave com tecidos coloridos, ao som de músicas instrumentais, estimulando a percepção visual e a exploração de movimentos corporais. (BNCC: Corpo, gestos e movimentos)
16:30: Preparação para Saída & Despedida - Organização dos pertences e momento de despedida, com uma música calma e palavras de carinho, encerrando o dia de forma harmoniosa. (BNCC: O eu, o outro e o nós)`;
    navigator.clipboard.writeText(modelText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // Limpar atividades para permitir inserção de novas
  const handleClearAll = () => {
    if (window.confirm('Deseja limpar as atividades para inserir novas atividades na agenda?')) {
      setActivities([]);
      setActivityNotes({});
      setSelectedDayTab('all');
      setStatusFilter('todas');
      // Abre o formulário de cadastro imediatamente
      setShowForm(true);
      setFormMode('direto');
    }
  };

  // Restaurar atividades padrão (todas em estado pendente)
  const handleRestoreDefault = () => {
    const allPendingDefaults = DEFAULT_INITIAL_ACTIVITIES.map((act) => ({
      ...act,
      status: 'pendente' as const,
      entregue: false,
      observacao: undefined
    }));
    setActivities(sortActivitiesBySchedule(deduplicateActivities(allPendingDefaults)));
    setSelectedDayTab('all');
    setStatusFilter('todas');
    setActivityNotes({});
  };

  // Aplicar Modelo Rápido
  const handleApplyQuickModel = (model: typeof QUICK_MODELS[0]) => {
    setNewTitle(model.nome);
    setNewTipo(model.tipo);
    setNewTime(model.horario);
    setNewBncc(model.bncc);
    setNewDesc(model.desc);
  };

  // Executa a adição efetiva de uma atividade, garantindo ordenação por horário e status pendente
  const commitAddActivity = (newAct: ParsedAuraActivity, replaceId?: string) => {
    setActivities((prev) => {
      let updated: ParsedAuraActivity[];
      if (replaceId) {
        // Substitui a atividade existente
        updated = prev.map((a, i) => ((a.id || `act-${i}`) === replaceId ? newAct : a));
      } else {
        // Adiciona nova atividade
        updated = [...prev, newAct];
      }
      return sortActivitiesBySchedule(deduplicateActivities(updated));
    });

    // Se a aba estiver filtrada em outro dia, ajusta para o dia da atividade criada para exibição imediata
    if (selectedDayTab !== 'all' && selectedDayTab !== newAct.dia) {
      setSelectedDayTab(newAct.dia || 'all');
    }

    // Limpa os campos do formulário
    setNewTitle('');
    setNewDesc('');
    setShowForm(false);
    setConflictState(null);
  };

  // Criar Nova Atividade com Validação e Checagem de Conflito de Horário
  const handleCreateActivity = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = newTitle.trim();
    if (!cleanTitle) {
      alert('Por favor, informe o título da atividade.');
      return;
    }

    const scheduledTime = (newTime || '10:00').trim();
    const scheduledDay = newDia || 'Quarta-feira';

    const created: ParsedAuraActivity = {
      id: `act-${Date.now()}`,
      dia: scheduledDay,
      horario: scheduledTime,
      titulo: cleanTitle,
      descricao: newDesc.trim() 
        ? (newBncc && !newDesc.includes('BNCC:') ? `${newDesc.trim()} (BNCC: ${newBncc})` : newDesc.trim())
        : `Atividade planejada para desenvolvimento lúdico e motor. (BNCC: ${newBncc})`,
      tipo: newTipo,
      objetivoBNCC: newBncc,
      status: 'pendente', // Entra como PENDENTE
      entregue: false,
      item_key: `custom_${Date.now()}`
    };

    // Verificar se já existe outra atividade agendada no mesmo horário e dia
    const existingConflict = activities.find(
      (a) => (a.dia || 'Quarta-feira') === scheduledDay && (a.horario || '').trim() === scheduledTime
    );

    if (existingConflict) {
      // Abre aviso de conflito para a professora decidir se substitui ou agenda ambas
      setConflictState({
        newActivity: created,
        existingActivity: existingConflict
      });
      return;
    }

    // Sem conflito: insere e ordena cronologicamente
    commitAddActivity(created);
  };

  // Excluir Atividade
  const handleDelete = (id: string, idx: number) => {
    if (window.confirm('Deseja excluir esta atividade da agenda?')) {
      setActivities((prev) => prev.filter((a, i) => (a.id ? a.id !== id : i !== idx)));
    }
  };

  // Iniciar Edição
  const handleStartEdit = (act: ParsedAuraActivity, idx: number) => {
    const actId = act.id || `act-${idx}`;
    setEditingId(actId);
    setEditForm({ ...act, id: actId });
  };

  // Salvar Edição
  const handleSaveEdit = () => {
    if (!editForm || !editingId) return;
    setActivities((prev) => {
      const updated = prev.map((a, i) => {
        const id = a.id || `act-${i}`;
        if (id === editingId) {
          return {
            ...editForm,
            descricao: editForm.objetivoBNCC && !editForm.descricao.includes('BNCC:')
              ? `${editForm.descricao} (BNCC: ${editForm.objetivoBNCC})`
              : editForm.descricao
          };
        }
        return a;
      });
      return sortActivitiesBySchedule(updated);
    });
    setEditingId(null);
    setEditForm(null);
  };

  // Marcar como Entregue / Concluído
  const handleMarkEntregue = (act: ParsedAuraActivity, idx: number, customScope?: 'coletivo' | 'individual') => {
    const actId = act.id || `act-${idx}`;
    const note = activityNotes[actId] || '';
    const scope = customScope || activityScopes[actId] || 'coletivo';
    
    if (actId.startsWith('med-dyn-')) {
      if (student && student.medicamentos && onUpdateStudent) {
        const parts = actId.split('-');
        const medId = parts[2];
        const targetDay = act.dia || selectedDayTab;
        
        const updatedMeds = student.medicamentos.map((m) => {
          if (m.id === medId) {
            const currentDays = m.ministradoDias || [];
            const nextDays = currentDays.includes(targetDay) ? currentDays : [...currentDays, targetDay];
            const currentObs = m.observacoesDias || {};
            const nextObs = { ...currentObs, [targetDay]: note || 'Dose administrada no horário estipulado.' };
            
            return {
              ...m,
              ministradoHoje: true,
              ministradoDias: nextDays,
              observacoesDias: nextObs,
              ministradoPor: 'Ana Silva (Professora Titular)',
              ministradoHorario: act.horario,
              observacaoMinistracao: note || 'Dose administrada no horário estipulado.'
            };
          }
          return m;
        });
        
        const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const newTimelineItem = {
          id: `audit_med_${Date.now()}`,
          hora: act.horario || horaAtual,
          tipo: 'saude' as const,
          titulo: `💊 Medicamento Ministrado: ${act.titulo.replace('💊 Medicamento: ', '')} (${targetDay})`,
          descricao: `Dose de ${act.horario} (${targetDay}) administrada com sucesso por Ana Silva (Professora Titular).\n\n💬 Observações: ${note || 'Dose administrada no horário estipulado.'}`,
          responsavel: 'Ana Silva (Professora Titular)',
          verificado: true
        };
        
        onUpdateStudent({
          medicamentos: updatedMeds,
          auditoriaLinhaDoTempo: [newTimelineItem, ...(student.auditoriaLinhaDoTempo || [])]
        });
      }
      return;
    }

    setActivities((prev) =>
      prev.map((a, i) => {
        const currentId = a.id || `act-${i}`;
        if (currentId === actId) {
          return { ...a, status: 'entregue', entregue: true, observacao: note };
        }
        return a;
      })
    );

    if (onConcluirAtividadePedagogica) {
      onConcluirAtividadePedagogica({
        ...act,
        entregue: true,
        status: 'entregue',
        escopo: scope,
        isColetivo: scope === 'coletivo',
        descricao: note ? `${act.descricao}\n\n💬 Observação da Professora: ${note}` : act.descricao
      });
    }
  };

  // Marcar como Recusou
  const handleMarkRecusou = (act: ParsedAuraActivity, idx: number, customScope?: 'coletivo' | 'individual') => {
    const actId = act.id || `act-${idx}`;
    const note = activityNotes[actId] || '';
    const scope = customScope || activityScopes[actId] || 'coletivo';

    if (actId.startsWith('med-dyn-')) {
      if (student && student.medicamentos && onUpdateStudent) {
        const parts = actId.split('-');
        const medId = parts[2];
        const targetDay = act.dia || selectedDayTab;
        
        const updatedMeds = student.medicamentos.map((m) => {
          if (m.id === medId) {
            const currentDays = m.ministradoDias || [];
            const nextDays = currentDays.filter(d => d !== targetDay);
            const currentObs = m.observacoesDias || {};
            const nextObs = { ...currentObs, [targetDay]: note || 'A dose foi recusada ou não pôde ser administrada.' };
            
            return {
              ...m,
              ministradoHoje: false,
              ministradoDias: nextDays,
              observacoesDias: nextObs,
              observacaoMinistracao: note || 'A dose foi recusada ou não pôde ser administrada.'
            };
          }
          return m;
        });
        
        const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const newTimelineItem = {
          id: `audit_med_rec_${Date.now()}`,
          hora: act.horario || horaAtual,
          tipo: 'saude' as const,
          titulo: `⚠️ Recusa de Medicamento: ${act.titulo.replace('💊 Medicamento: ', '')} (${targetDay})`,
          descricao: `A dose de ${act.horario} (${targetDay}) foi recusada ou não pôde ser administrada.\n\n💬 Motivo: ${note || 'Criança recusou ou não pôde tomar a dose.'}`,
          responsavel: 'Ana Silva (Professora Titular)',
          verificado: true
        };
        
        onUpdateStudent({
          medicamentos: updatedMeds,
          auditoriaLinhaDoTempo: [newTimelineItem, ...(student.auditoriaLinhaDoTempo || [])]
        });
      }
      return;
    }

    setActivities((prev) =>
      prev.map((a, i) => {
        const currentId = a.id || `act-${i}`;
        if (currentId === actId) {
          return { ...a, status: 'recusou', entregue: false, observacao: note };
        }
        return a;
      })
    );

    if (onConcluirAtividadePedagogica) {
      onConcluirAtividadePedagogica({
        ...act,
        entregue: false,
        status: 'recusou',
        escopo: scope,
        isColetivo: scope === 'coletivo',
        descricao: `${act.descricao}\n\n⚠️ Status: Criança recusou participar da atividade.${note ? `\n💬 Motivo/Obs: ${note}` : ''}`
      });
    }
  };

  // Reconhecimento de Voz
  const startVoiceInput = (
    setter: (val: string | ((prev: string) => string)) => void,
    stateSetter: (v: boolean) => void
  ) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Reconhecimento de voz não suportado neste navegador. Digite pelo teclado.');
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.continuous = false;
      recognition.interimResults = false;

      stateSetter(true);
      recognition.onend = () => stateSetter(false);
      recognition.onerror = () => stateSetter(false);
      recognition.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        if (transcript) {
          setter((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
        stateSetter(false);
      };
      recognition.start();
    } catch (e) {
      stateSetter(false);
    }
  };

  const getCategoryIcon = (tipo: string) => {
    switch (tipo) {
      case 'alimentacao':
        return <Utensils size={18} className="text-amber-600" />;
      case 'sono':
        return <Moon size={18} className="text-indigo-600" />;
      case 'banho':
        return <Droplets size={18} className="text-sky-600" />;
      case 'medicacao':
        return <Pill size={18} className="text-indigo-600 animate-pulse" />;
      default:
        return <BookOpen size={18} className="text-emerald-600" />;
    }
  };

  return (
    <section id="agenda-atividades-section" className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-sm space-y-6">
      {/* 1. Cabeçalho da Agenda de Atividades */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Clock size={22} className="text-sky-600" />
            <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              Agenda de Atividades da Aula
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium flex items-center gap-2 flex-wrap">
            <strong className="text-slate-800">{activities.length} atividade(s)</strong> no cronograma ordenadas por horário (07:30 às 16:30)
          </p>
        </div>

        {userRole === 'familia' ? (
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-3.5 py-2 rounded-2xl shadow-2xs">
            <Heart size={15} className="text-emerald-600 shrink-0" />
            <span className="text-xs font-bold">
              Acompanhamento Pedagógico Familiar • Método Árvore da Infância®
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleRestoreDefault}
              title="Restaurar grade padrão com todas as atividades em status pendente"
              className="px-3 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw size={14} className="text-slate-600" />
              <span>Restaurar Padrão</span>
            </button>

            <button
              type="button"
              onClick={handleClearAll}
              title="Limpar todas as atividades para cadastrar novas"
              className="px-3 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 size={13} />
              <span>Limpar Atividades</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowForm(true);
                setFormMode('importar');
              }}
              className="px-4 py-2 text-xs font-black text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <Sparkles size={15} className="text-amber-300" />
              <span>Importar Aura</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowForm(true);
                setFormMode('direto');
              }}
              className="px-4 py-2 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <Plus size={16} />
              <span>+ Nova Atividade</span>
            </button>
          </div>
        )}
      </div>

      {/* PAINEL DE MÉTRICAS DE GOVERNANÇA (EXIGIDO PARA MÉTRICAS DO DIRETOR) */}
      <div className="bg-slate-50 border border-slate-200/90 rounded-3xl p-5 flex flex-col gap-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h4 className="text-xs font-black uppercase tracking-widest text-indigo-700 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
              Métricas de Governança — Distribuição de Atividades Aura
            </h4>
            <p className="text-xs text-slate-600 leading-normal">
              Controle de volumetria de atividades diárias integradas com a inteligência da <strong>Anjinha Aura</strong> para assegurar conformidade do plano de aula.
            </p>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 text-indigo-950 px-3.5 py-1.5 rounded-2xl flex items-center gap-2 flex-shrink-0 self-start sm:self-center">
            <Layers size={14} className="text-indigo-600" />
            <span className="text-xs font-black">
              Carga Total: {activities.length} Atividades
            </span>
          </div>
        </div>

        {/* Grid de Dias da Semana com Indicadores e Carga de Trabalho */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
          {daySummaries.map((ds) => {
            const isSelected = selectedDayTab === ds.dia;
            return (
              <div 
                key={ds.dia}
                onClick={() => handleSelectDayTab(ds.dia)}
                className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 ${
                  isSelected 
                    ? 'bg-gradient-to-br from-indigo-600 to-blue-600 border-indigo-600 text-white shadow-md scale-[1.02]' 
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800 hover:shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className={`text-[10px] uppercase font-black tracking-wide ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                    {ds.dia.split('-')[0]}
                  </span>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                    isSelected 
                      ? 'bg-white/20 text-white' 
                      : ds.count >= 12 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                        : 'bg-amber-50 text-amber-700 border border-amber-100'
                  }`}>
                    {ds.count >= 12 ? 'Meta ✓' : 'Planejado'}
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-2xl font-black block tracking-tight">
                    {ds.count}
                  </span>
                  <span className={`text-[9px] block ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                    atividades registradas
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Formulário de Agendar Nova Atividade Escolar */}
      {showForm && (
        <div className="bg-slate-50/95 border-2 border-indigo-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 block">
                PLANEJAMENTO PEDAGÓGICO
              </span>
              <h4 className="text-base sm:text-lg font-black text-slate-900 uppercase">
                Agendar Nova Atividade Escolar
              </h4>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex bg-slate-200 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFormMode('direto')}
                  className={`px-3 py-1.5 text-xs font-black rounded-lg transition cursor-pointer ${
                    formMode === 'direto'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cadastro Direto
                </button>
                <button
                  type="button"
                  onClick={() => setFormMode('importar')}
                  className={`px-3 py-1.5 text-xs font-black rounded-lg transition cursor-pointer flex items-center gap-1 ${
                    formMode === 'importar'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sparkles size={12} className="text-amber-300" />
                  <span>Importar Planejamento Aura</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
                title="Fechar formulário"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {formMode === 'direto' ? (
            /* Formulário Direto de Criação */
            <form onSubmit={handleCreateActivity} className="space-y-4">
              {/* Modelos Rápidos */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-2">
                  Modelos Rápidos de Atividades Escolares
                </label>
                <div className="flex flex-wrap gap-2">
                  {QUICK_MODELS.map((m, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyQuickModel(m)}
                      className="px-3 py-1.5 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs"
                    >
                      {m.nome}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Tipo / Categoria */}
                <div className="md:col-span-4">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                    Tipo / Categoria
                  </label>
                  <select
                    value={newTipo}
                    onChange={(e: any) => setNewTipo(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="atividade_fisica">Atividade Pedagógica / BNCC</option>
                    <option value="alimentacao">Alimentação / Lanche</option>
                    <option value="sono">Soneca / Repouso</option>
                    <option value="banho">Higiene / Banho / Fralda</option>
                    <option value="medicacao">Medicação</option>
                  </select>
                </div>

                {/* Título */}
                <div className="md:col-span-8">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Título / Nome do Cuidado / Atividade *
                    </label>
                    <button
                      type="button"
                      onClick={() => startVoiceInput(setNewTitle, setIsListeningTitle)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 cursor-pointer transition ${
                        isListeningTitle ? 'bg-rose-500 text-white animate-pulse' : 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                      }`}
                    >
                      <Mic size={11} />
                      <span>{isListeningTitle ? 'Gravando...' : 'Gravar Título'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Ex: Aula de pintura guache ou contação de história"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Horário & Reloginho Rápido */}
              <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1">
                    <Clock size={13} className="text-amber-500" />
                    <span>Horário da Atividade (Entra ordenado no cronograma):</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    placeholder="Ex: 10:00"
                    className="w-28 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-center font-mono font-black text-sm text-indigo-900"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {TIME_PRESETS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewTime(t)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold transition cursor-pointer ${
                        newTime === t
                          ? 'bg-amber-400 text-amber-950 font-black shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Alcance e Dia */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                    Alcance da Atividade
                  </label>
                  <div className="flex bg-white border border-slate-200 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setNewScope('individual')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                        newScope === 'individual' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Individual ({studentNome})
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewScope('classe')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                        newScope === 'classe' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Classe Toda
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                    Dia da Semana
                  </label>
                  <select
                    value={newDia}
                    onChange={(e) => setNewDia(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Segunda-feira">Segunda-feira</option>
                    <option value="Terça-feira">Terça-feira</option>
                    <option value="Quarta-feira">Quarta-feira</option>
                    <option value="Quinta-feira">Quinta-feira</option>
                    <option value="Sexta-feira">Sexta-feira</option>
                  </select>
                </div>
              </div>

              {/* Objetivo BNCC */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                  Campo de Experiência / BNCC
                </label>
                <input
                  type="text"
                  value={newBncc}
                  onChange={(e) => setNewBncc(e.target.value)}
                  placeholder="Ex: Corpo, gestos e movimentos ou O eu, o outro e o nós"
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Descrição Detalhada */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Instrução / Descrição Detalhada
                  </label>
                  <button
                    type="button"
                    onClick={() => startVoiceInput(setNewDesc, setIsListeningDesc)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 cursor-pointer transition ${
                      isListeningDesc ? 'bg-rose-500 text-white animate-pulse' : 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                    }`}
                  >
                    <Mic size={11} />
                    <span>{isListeningDesc ? 'Gravando voz...' : 'Gravar por Voz'}</span>
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Ex: Estimular coordenação de motricidade fina nas mãozinhas, observando o engajamento e a interação coletiva..."
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Botões do Formulário */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-md transition cursor-pointer active:scale-95 flex items-center gap-1.5"
                >
                  <Check size={16} />
                  <span>Agendar Atividade como Pendente</span>
                </button>
              </div>
            </form>
          ) : (
            /* Importador de Planejamento da Aura */
            <div className="space-y-4">
              <div className="bg-indigo-900 text-white rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                    <Sparkles size={15} />
                    <span>Instruções da Anjinha Aura</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyModel}
                    className="px-3 py-1 bg-amber-400 hover:bg-amber-500 text-amber-950 text-xs font-black rounded-lg transition cursor-pointer"
                  >
                    {copied ? '✓ Copiado!' : 'Copiar Modelo de Prompt'}
                  </button>
                </div>
                <p className="text-xs text-indigo-100 leading-relaxed">
                  Peça à Anjinha Aura no chat para criar o planejamento da semana ou dias específicos (07:30 às 16:30) com os objetivos da BNCC. Cole o texto abaixo:
                </p>
              </div>

              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Cole aqui o texto da Anjinha Aura..."
                className="w-full h-40 bg-white border-2 border-indigo-200 rounded-2xl p-3 text-xs font-mono text-slate-700 focus:outline-none focus:border-indigo-500 resize-y"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!inputText.trim() || isProcessing}
                  onClick={handleExtract}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  {isProcessing ? <RotateCcw className="animate-spin" size={15} /> : <Sparkles size={15} className="text-amber-300" />}
                  <span>Extrair & Adicionar Atividades</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL DE CONFLITO DE HORÁRIO: Perguntar se deseja Substituir ou Manter Ambas */}
      {conflictState && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border-2 border-amber-300 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0 border border-amber-300 text-amber-700">
                <AlertTriangle size={22} />
              </div>
              <div className="flex-1">
                <h4 className="text-base font-black text-slate-900">
                  Aviso: Horário Já Ocupado na Agenda
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  Já existe uma atividade cadastrada para às <strong className="font-mono text-indigo-900 bg-indigo-50 px-1.5 py-0.5 rounded">{conflictState.newActivity.horario}</strong> no dia <strong>{conflictState.newActivity.dia}</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConflictState(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Comparação da Atividade Existente vs Nova */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
              <div className="space-y-1 border-b sm:border-b-0 sm:border-r border-slate-200 pb-2 sm:pb-0 sm:pr-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 block">
                  Atividade Atual
                </span>
                <p className="font-bold text-slate-800">{conflictState.existingActivity.titulo}</p>
                <p className="text-[11px] text-slate-500 line-clamp-2">{conflictState.existingActivity.descricao}</p>
              </div>

              <div className="space-y-1 sm:pl-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 block">
                  Nova Atividade
                </span>
                <p className="font-bold text-slate-800">{conflictState.newActivity.titulo}</p>
                <p className="text-[11px] text-slate-500 line-clamp-2">{conflictState.newActivity.descricao}</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 font-medium">
              Como você deseja prosseguir com o agendamento?
            </p>

            {/* Opções de Ação */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConflictState(null)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Alterar Horário
              </button>

              <button
                type="button"
                onClick={() => {
                  // Agenda ambas no mesmo horário
                  commitAddActivity(conflictState.newActivity);
                }}
                className="px-4 py-2.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition cursor-pointer"
              >
                Manter Ambas
              </button>

              <button
                type="button"
                onClick={() => {
                  // Substitui a atividade existente
                  commitAddActivity(conflictState.newActivity, conflictState.existingActivity.id);
                }}
                className="px-5 py-2.5 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition cursor-pointer"
              >
                ✓ Substituir Atividade
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Filtros por Dia e Filtros por Status (Pendentes / Entregues / Todas) */}
      <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3 sm:p-4 space-y-3">
        {/* Status: Todas | Pendentes | Entregues */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <span className="text-xs font-black text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
            <Filter size={14} className="text-indigo-600" />
            <span>Exibir por Status:</span>
          </span>

          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setStatusFilter('todas')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === 'todas'
                  ? 'bg-slate-800 text-white shadow-xs font-black'
                  : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
              }`}
            >
              Todas ({activities.length})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('pendentes')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'pendentes'
                  ? 'bg-amber-500 text-amber-950 shadow-xs ring-2 ring-amber-300'
                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <Clock size={13} />
              <span>Pendentes ({pendingCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('entregues')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'entregues'
                  ? 'bg-emerald-600 text-white shadow-xs font-black'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <CheckCircle2 size={13} />
              <span>Entregues ({entregueCount})</span>
            </button>

            {recusouCount > 0 && (
              <button
                type="button"
                onClick={() => setStatusFilter('recusadas')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === 'recusadas'
                    ? 'bg-rose-600 text-white shadow-xs font-black'
                    : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                }`}
              >
                <XCircle size={13} />
                <span>Recusadas ({recusouCount})</span>
              </button>
            )}
          </div>
        </div>

        {/* Dias da Semana */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
            <Calendar size={13} className="text-blue-600" />
            <span>Dias da Semana:</span>
          </span>

          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => handleSelectDayTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                selectedDayTab === 'all'
                  ? 'bg-blue-600 text-white shadow-xs font-black'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>Todos os Dias</span>
              <span className={`px-1.5 py-0.5 text-[9px] rounded-full font-black ${
                selectedDayTab === 'all' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {activities.length}
              </span>
            </button>

            {daySummaries.map((ds) => (
              <button
                key={ds.dia}
                type="button"
                onClick={() => handleSelectDayTab(ds.dia)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  selectedDayTab === ds.dia
                    ? 'bg-blue-600 text-white shadow-xs font-black'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>{ds.dia}</span>
                <span className={`px-1.5 py-0.5 text-[9px] rounded-full font-black ${
                  selectedDayTab === ds.dia ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {ds.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Modal de Edição de Atividade */}
      {editingId && editForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Edit2 size={18} className="text-blue-600" />
                <h4 className="text-base font-black text-slate-800">Editar Atividade Escolar</h4>
              </div>
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">Horário:</label>
                  <input
                    type="text"
                    value={editForm.horario}
                    onChange={(e) => setEditForm({ ...editForm, horario: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">Dia da Semana:</label>
                  <input
                    type="text"
                    value={editForm.dia}
                    onChange={(e) => setEditForm({ ...editForm, dia: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">Título da Atividade:</label>
                <input
                  type="text"
                  value={editForm.titulo}
                  onChange={(e) => setEditForm({ ...editForm, titulo: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">Campo BNCC / Objetivo:</label>
                <input
                  type="text"
                  value={editForm.objetivoBNCC || ''}
                  onChange={(e) => setEditForm({ ...editForm, objetivoBNCC: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">Descrição / Instrução:</label>
                <textarea
                  rows={4}
                  value={editForm.descricao}
                  onChange={(e) => setEditForm({ ...editForm, descricao: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Save size={14} />
                <span>Salvar Alterações</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Lista de Cards de Atividades (Grid 2 Colunas) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredActivities.map((act, idx) => {
          const actId = act.id || `act-${idx}`;
          const currentNote = activityNotes[actId] || act.observacao || '';
          const isListeningNote = listeningNoteId === actId;
          const isEntregue = act.status === 'entregue' || act.entregue;
          const isRecusou = act.status === 'recusou';
          const isPendente = !isEntregue && !isRecusou;

          return (
            <div
              key={actId}
              className={`bg-white rounded-3xl border p-5 sm:p-6 transition-all duration-200 shadow-2xs flex flex-col justify-between space-y-4 ${
                isEntregue
                  ? 'border-emerald-300/80 bg-emerald-50/20'
                  : isRecusou
                  ? 'border-rose-300/80 bg-rose-50/20'
                  : act.tipo === 'medicacao'
                  ? 'border-indigo-300 bg-indigo-50/15 ring-2 ring-indigo-100/50 hover:shadow-xs'
                  : 'border-amber-300/80 bg-amber-50/15 ring-1 ring-amber-200/50 hover:shadow-xs'
              }`}
            >
              {/* Topo do Card: Ícone, Horário, Status, Editar, Excluir */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                    act.tipo === 'medicacao' ? 'bg-indigo-50 text-indigo-700 border-indigo-200/80' : 'bg-slate-100 text-slate-700 border-slate-200/80'
                  }`}>
                    {getCategoryIcon(act.tipo)}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-slate-100 text-slate-800 font-mono font-black text-xs px-2.5 py-1 rounded-lg border border-slate-200">
                      {act.horario}
                    </span>

                    {/* Badge de Status */}
                    {isEntregue ? (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-md flex items-center gap-1 border border-emerald-300">
                        <CheckCircle2 size={11} />
                        <span>{act.tipo === 'medicacao' ? 'Ministrado' : 'Entregue'}</span>
                      </span>
                    ) : isRecusou ? (
                      <span className="bg-rose-100 text-rose-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-md flex items-center gap-1 border border-rose-300">
                        <XCircle size={11} />
                        <span>Recusou</span>
                      </span>
                    ) : (
                      <span className="bg-amber-100 text-amber-900 text-[10px] font-black uppercase px-2 py-0.5 rounded-md border border-amber-300 flex items-center gap-1">
                        <Clock size={10} className="text-amber-700" />
                        <span>Pendente</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Ações de Edição e Exclusão */}
                {act.tipo !== 'medicacao' ? (
                  userRole !== 'familia' ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(act, idx)}
                        title="Editar atividade"
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(actId, idx)}
                        title="Excluir atividade"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      Plano Semanal
                    </span>
                  )
                ) : (
                  <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-100/80 text-indigo-800 px-2 py-1 rounded-md border border-indigo-200 select-none">
                    Autorização Ativa
                  </span>
                )}
              </div>

              {/* Título e Descrição */}
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className={`text-base font-black leading-snug ${act.tipo === 'medicacao' ? 'text-indigo-950 font-extrabold' : 'text-slate-900'}`}>
                      {act.titulo}
                    </h4>
                    {act.tipo === 'medicacao' && (
                      <span className="text-[10px] font-black text-blue-700 bg-blue-100/90 border border-blue-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <Calendar size={11} /> Dias: {act.diasSemana && act.diasSemana.length > 0 ? act.diasSemana.join(', ') : 'Todos os dias úteis'}
                      </span>
                    )}
                  </div>
                  {act.dia && (
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
                      {act.dia}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {act.descricao}
                </p>

                {/* Foto / Receita Anexada para Conferência Visual da Professora */}
                {act.anexoReceitaUrl && (
                  <div className="mt-2 flex items-center gap-3 bg-indigo-50/90 border border-indigo-100 rounded-xl p-2.5">
                    <div
                      className="relative w-14 h-14 rounded-lg overflow-hidden border border-indigo-200 bg-white shrink-0 cursor-pointer shadow-2xs group"
                      onClick={() => setPreviewMedImage(act.anexoReceitaUrl || null)}
                      title="Clique para ampliar e conferir"
                    >
                      <img
                        src={act.anexoReceitaUrl}
                        alt="Foto do Medicamento"
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs">
                        🔍
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-indigo-950">Foto da Embalagem / Receita</span>
                        <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded-sm font-bold">Segurança</span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        Conferência visual para evitar trocas e dosagens incorretas.
                      </p>
                      <button
                        type="button"
                        onClick={() => setPreviewMedImage(act.anexoReceitaUrl || null)}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer mt-0.5"
                      >
                        Clique para ampliar e ver detalhes
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Observações da Atividade com Microfone de Voz ou Visão Acolhedora Familiar */}
              {userRole === 'familia' ? (
                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  {currentNote ? (
                    <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl px-3 py-1.5 text-amber-900 text-xs flex items-center gap-1.5">
                      <span className="font-bold">
                        {act.tipo === 'medicacao' ? '💊 Relato de Ministração:' : '📝 Observação da Escola:'}
                      </span>
                      <span>{currentNote}</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-500 font-medium">
                      {act.tipo === 'medicacao'
                        ? 'Prescrição médica e autorização da família • Cuidado e dosagem estritamente individual'
                        : 'Planejamento pedagógico integrado • Método Árvore da Infância®'}
                    </span>
                  )}
                  <div className="shrink-0">
                    {isEntregue ? (
                      act.tipo === 'medicacao' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-indigo-100 text-indigo-950 border border-indigo-300 shadow-2xs">
                          <Pill size={12} className="text-indigo-700" />
                          <span>Medicamento Ministrado (Individual)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 size={12} className="text-emerald-700" />
                          <span>
                            {activityScopes[actId] === 'individual'
                              ? 'Vivenciada Individualmente'
                              : 'Vivenciada com a Turma'}
                          </span>
                        </span>
                      )
                    ) : isRecusou ? (
                      act.tipo === 'medicacao' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                          <XCircle size={12} className="text-rose-700" />
                          <span>Dose Recusada (Escola Notificada)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                          <XCircle size={12} className="text-rose-700" />
                          <span>Observação Registrada</span>
                        </span>
                      )
                    ) : (
                      act.tipo === 'medicacao' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                          <Clock size={11} className="text-amber-600" />
                          <span>Horário da Dose Agendado (Individual)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          <Clock size={11} className="text-slate-500" />
                          <span>
                            {activityScopes[actId] === 'individual'
                              ? 'Atividade Individual Prevista'
                              : 'Prevista no Plano de Aula'}
                          </span>
                        </span>
                      )
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                        {act.tipo === 'medicacao' ? 'Observações de Ministração' : 'Observações da Atividade'}
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          startVoiceInput(
                            (val) =>
                              setActivityNotes((prev) => ({
                                ...prev,
                                [actId]: typeof val === 'function' ? val(prev[actId] || '') : val
                              })),
                            (isRec) => setListeningNoteId(isRec ? actId : null)
                          )
                        }
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 cursor-pointer transition ${
                          isListeningNote ? 'bg-rose-500 text-white animate-pulse' : 'text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        <Mic size={12} />
                        <span>{isListeningNote ? 'Ouvindo voz...' : 'Gravar'}</span>
                      </button>
                    </div>

                    <input
                      type="text"
                      value={currentNote}
                      onChange={(e) =>
                        setActivityNotes({ ...activityNotes, [actId]: e.target.value })
                      }
                      placeholder={act.tipo === 'medicacao' ? 'Ex: Tomou 10 gotas de dipirona diluídas em água.' : 'Ex: Realizou a atividade com capricho e atenção...'}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400"
                    />
                  </div>

                  {/* Botões de Ação: [Individual / Coletivo] + [Recusou] + [Entregue] */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 mt-1">
                    {act.tipo === 'medicacao' ? (
                      <div className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-1.5 rounded-xl border border-indigo-100 text-[11px] font-black">
                        <span>👤 Medicamento Individual</span>
                      </div>
                    ) : (
                      /* Seletor Individual / Coletivo Padronizado no Próprio Cartão */
                      <div className="flex items-center bg-slate-100/90 p-0.5 rounded-xl border border-slate-200 shadow-2xs">
                        <button
                          type="button"
                          onClick={() =>
                            setActivityScopes((prev) => ({
                              ...prev,
                              [actId]: 'coletivo',
                            }))
                          }
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-black transition cursor-pointer ${
                            (activityScopes[actId] || 'coletivo') === 'coletivo'
                              ? 'bg-indigo-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                          title="Modo Coletivo: Salva para toda a turma de uma vez"
                        >
                          <span>👥 Coletivo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setActivityScopes((prev) => ({
                              ...prev,
                              [actId]: 'individual',
                            }))
                          }
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-black transition cursor-pointer ${
                            activityScopes[actId] === 'individual'
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                          title={`Modo Individual: Salva apenas para ${studentNome.split(' ')[0]}`}
                        >
                          <span>👤 Individual</span>
                        </button>
                      </div>
                    )}

                    {/* Botões de Ação: [Recusou] e [Entregue] */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleMarkRecusou(act, idx)}
                        className={`px-3.5 py-2 text-xs font-black rounded-xl transition cursor-pointer active:scale-95 ${
                          isRecusou
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-200'
                        }`}
                      >
                        Recusou
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMarkEntregue(act, idx)}
                        className={`px-4 py-2 text-xs font-black rounded-xl transition cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5 ${
                          isEntregue
                            ? 'bg-emerald-600 text-white font-black'
                            : act.tipo === 'medicacao'
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                        title={
                          act.tipo === 'medicacao'
                            ? 'Registrar ministração'
                            : (activityScopes[actId] || 'coletivo') === 'coletivo'
                            ? 'Salvar e replicar para toda a turma'
                            : `Salvar apenas para ${studentNome.split(' ')[0]}`
                        }
                      >
                        <Check size={14} />
                        <span>{isEntregue ? (act.tipo === 'medicacao' ? 'Ministrado' : 'Entregue') : (act.tipo === 'medicacao' ? 'Ministrar' : 'Entregue')}</span>
                        {act.tipo !== 'medicacao' && (
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-800/60 text-emerald-100 uppercase tracking-tight">
                            {(activityScopes[actId] || 'coletivo') === 'coletivo' ? 'Turma' : 'Indiv.'}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {filteredActivities.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-300 space-y-4 p-6">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto border border-blue-200">
            <Plus size={24} />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-black text-slate-800">
              {activities.length === 0 ? 'Agenda Limpa para Novas Atividades' : 'Nenhuma atividade encontrada'}
            </h4>
            <p className="text-xs font-medium text-slate-500 max-w-md mx-auto">
              {activities.length === 0
                ? 'A agenda foi limpa. Você pode criar novas atividades personalizadas ou restaurar a rotina padrão com todas as atividades no estado pendente.'
                : 'Nenhuma atividade corresponde aos filtros selecionados de dia ou status.'}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowForm(true);
                setFormMode('direto');
              }}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <Plus size={15} />
              <span>+ Inserir Nova Atividade</span>
            </button>
            <button
              type="button"
              onClick={handleRestoreDefault}
              className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw size={14} className="text-slate-500" />
              <span>Restaurar Padrão (Todas Pendentes)</span>
            </button>
          </div>
        </div>
      )}

      {/* Visualizador de Foto / Receita de Medicamento em Alta Visibilidade para Professora */}
      {previewMedImage && (
        <div 
          className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setPreviewMedImage(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-2xl w-full p-5 shadow-2xl relative flex flex-col gap-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm text-slate-800">Foto do Medicamento / Receita Médica</h3>
                <p className="text-[11px] text-slate-500">Conferência visual para segurança e prevenção de erros</p>
              </div>
              <button 
                onClick={() => setPreviewMedImage(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition flex items-center justify-center font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto rounded-2xl border border-slate-100 bg-slate-50 flex justify-center items-center p-2">
              <img 
                src={previewMedImage} 
                alt="Foto do medicamento ampliada" 
                className="max-w-full max-h-[60vh] object-contain rounded-xl"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setPreviewMedImage(null)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition cursor-pointer"
              >
                Fechar Visualização
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
