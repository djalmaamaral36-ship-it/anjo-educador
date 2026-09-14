/**
 * ÁLBUM DA 1ª INFÂNCIA® - MODELOS DE DADOS
 * Anjinho Escolar & Anjinha Aura
 * 
 * Especificação conforme Seções 23 a 26 da Arquitetura do Produto:
 * - Entidade raiz: AlbumInfancia
 * - Seções temáticas: AlbumSection
 * - Memórias individuais: AlbumEntry
 * - Mídias e fotos autorizadas: AlbumMedia
 * - Capa e metadados de ciclo de vida e auditoria
 */

export type AlbumStatus =
  | 'rascunho'
  | 'gerando'
  | 'revisao'
  | 'aprovado'
  | 'publicado'
  | 'arquivado';

export type AlbumSectionType =
  | 'abertura'
  | 'momentos'
  | 'descobertas'
  | 'conquistas'
  | 'pessoas'
  | 'voz'
  | 'arvore'
  | 'olhar_escola'
  | 'carta_futuro'
  | 'encerramento';

export type AlbumEntrySourceType =
  | 'foto'
  | 'atividade'
  | 'observacao'
  | 'registro_diario'
  | 'frase'
  | 'conquista'
  | 'arvore'
  | 'carta';

export interface AlbumMedia {
  id: string;
  type: 'image' | 'video';
  sourceId: string;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  approved: boolean;
  authorizationStatus: 'authorized' | 'pending' | 'blocked';
}

export interface AlbumEntry {
  id: string;
  childId: string;
  sourceType: AlbumEntrySourceType;
  sourceId: string;
  date: string;
  periodo?: string; // ex: "Março de 2026"
  title?: string;
  narrative?: string;
  originalText?: string;
  media?: AlbumMedia[];
  category?: string;
  aiGenerated: boolean;
  aiConfidence?: number;
  approved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  // Critério editorial interno de curadoria (oculto de famílias)
  editorialScore?: number;
}

export interface AlbumSection {
  id: string;
  type: AlbumSectionType;
  title: string;
  subtitle?: string;
  order: number;
  entries: AlbumEntry[];
  visible: boolean;
}

export interface ConfiguracaoLivroPdf {
  orientacao: 'paisagem';
  formato: 'A4_horizontal' | '21x28cm';
  papelTextura: 'linho_natural' | 'algodao_suave';
  corFundoPadrao: string; // ex: '#FAF8F5'
  fechamentoAnoPadrao: string; // ex: '15 de dezembro'
  minMomentosPorMes: number; // 2
  maxMomentosPorMes: number; // 4
  alvoAnualMomentos: number; // 25 a 35
}

export interface AlbumCover {
  title: string;
  subtitle?: string;
  childName: string;
  schoolYear: number;
  schoolName: string;
  coverPhotoUrl?: string;
  estacaoArvoreSimbolo?: string;
}

export interface AlbumInfancia {
  id: string;
  childId: string;
  schoolId: string;
  schoolYear: number;
  title: string;
  subtitle?: string;
  status: AlbumStatus;
  cover?: AlbumCover;
  configuracaoLivro?: ConfiguracaoLivroPdf;
  sections: AlbumSection[];
  generatedAt?: string;
  reviewedAt?: string;
  approvedAt?: string;
  publishedAt?: string;
  createdBy?: string;
  reviewedBy?: string;
  approvedBy?: string;
  version: number;
  // Mensagem poética de entrega para a família
  mensagemEntregaFamilia?: string;
}
