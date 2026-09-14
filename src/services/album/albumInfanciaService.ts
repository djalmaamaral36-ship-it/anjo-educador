/**
 * SERVIÇO PRINCIPAL: ÁLBUM DA 1ª INFÂNCIA®
 * Anjinho Escolar & Anjinha Aura
 * 
 * Orquestra os 3 motores:
 * 1. Motor Árvore da Infância® (Inteligência oculta e contexto pedagógico)
 * 2. Motor Curador do Álbum (Seleção editorial, diversidade e deduplicação)
 * 3. Motor Narrador Aura (Geração poética ancorada em fatos reais)
 * 
 * Gerencia o ciclo de vida:
 * rascunho -> gerando -> revisao -> aprovado -> publicado
 */

import { StudentPaxData } from '../../types';
import { AlbumInfancia, AlbumSection, AlbumEntry } from '../../types/albumInfancia';
import { interpretarArvoreParaAlbum } from './motorArvoreInfancia';
import { MotorCuradorAlbum } from './motorCuradorAlbum';
import { MotorNarradorAura } from './motorNarradorAura';

const STORAGE_PREFIX = 'anjinho_album_infancia_';

export class AlbumInfanciaService {
  private curador = new MotorCuradorAlbum();
  private narrador = new MotorNarradorAura();

  /**
   * Obtém chave do localStorage para persistência isolada e segura
   */
  private getStorageKey(childId: string, year: number): string {
    return `${STORAGE_PREFIX}${childId}_${year}`;
  }

  /**
   * Gera o Álbum Completo orquestrando os 3 motores
   */
  public async gerarAlbum(
    student: StudentPaxData,
    anoLetivo: number = new Date().getFullYear()
  ): Promise<AlbumInfancia> {
    // 1. Motor 1: Interpreta a trajetória pedagógica na Árvore da Infância®
    const contextoArvore = interpretarArvoreParaAlbum(student);

    // 2. Motor 2: Curador extrai, filtra e ranqueia memórias do aluno
    const candidatos = this.curador.extrairCandidatos(student);
    const selecionados = this.curador.selecionarMemóriasEditoriais(candidatos, 20);

    // 3. Motor 3: Narrador Aura transforma cada memória em prosa poética e afetiva
    const memoriasNarradas: AlbumEntry[] = selecionados.map((c) =>
      this.narrador.narrarMemoria(c, student.nome)
    );

    // Monta Capa e Seções
    const cover = this.narrador.gerarCapa(student, anoLetivo);
    const sections: AlbumSection[] = this.narrador.construirEstruturaCompleta(
      student,
      memoriasNarradas,
      contextoArvore,
      anoLetivo
    );

    const novoAlbum: AlbumInfancia = {
      id: `album_${student.id}_${anoLetivo}`,
      childId: student.id,
      schoolId: 'escola_anjinho_central',
      schoolYear: anoLetivo,
      title: `Álbum da 1ª Infância® de ${student.nome}`,
      subtitle: `${anoLetivo} • Uma história que cresce junto com a criança`,
      status: 'revisao', // Pronto para a revisão humana da professora
      cover: cover,
      configuracaoLivro: {
        orientacao: 'paisagem',
        formato: 'A4_horizontal',
        papelTextura: 'linho_natural',
        corFundoPadrao: '#FAF8F5',
        fechamentoAnoPadrao: '15 de dezembro',
        minMomentosPorMes: 2,
        maxMomentosPorMes: 4,
        alvoAnualMomentos: 30,
      },
      sections: sections,
      generatedAt: new Date().toISOString(),
      version: 1,
      mensagemEntregaFamilia: `✨ Uma história de amor e desenvolvimento foi guardada com carinho para vocês. O Álbum da 1ª Infância de ${student.nome} está pronto para ser revivido e guardado no coração!`,
    };

    // Salva localmente
    this.salvarAlbum(novoAlbum);

    return novoAlbum;
  }

  /**
   * Salva o álbum
   */
  public salvarAlbum(album: AlbumInfancia): void {
    try {
      const key = this.getStorageKey(album.childId, album.schoolYear);
      localStorage.setItem(key, JSON.stringify(album));
    } catch (e) {
      console.warn('Não foi possível salvar o álbum no localStorage:', e);
    }
  }

  /**
   * Obtém o álbum de um determinado ano letivo
   */
  public obterAlbum(childId: string, anoLetivo: number = new Date().getFullYear()): AlbumInfancia | null {
    try {
      const key = this.getStorageKey(childId, anoLetivo);
      const data = localStorage.getItem(key);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Erro ao ler álbum do localStorage:', e);
    }
    return null;
  }

  /**
   * Aprova uma memória específica (Curadoria da Professora)
   */
  public aprovarMemoria(
    albumId: string,
    sectionId: string,
    entryId: string,
    aprovadorNome: string
  ): AlbumInfancia | null {
    const [_, childId, yearStr] = albumId.split('_');
    const year = parseInt(yearStr, 10) || new Date().getFullYear();
    const album = this.obterAlbum(childId, year);
    if (!album) return null;

    const secao = album.sections.find((s) => s.id === sectionId);
    if (secao) {
      const entrada = secao.entries.find((e) => e.id === entryId);
      if (entrada) {
        entrada.approved = true;
        entrada.approvedBy = aprovadorNome;
        entrada.approvedAt = new Date().toISOString();
        album.reviewedAt = new Date().toISOString();
        album.reviewedBy = aprovadorNome;
        this.salvarAlbum(album);
      }
    }

    return album;
  }

  /**
   * Edita o texto ou narrativa de uma memória (Toque humano da professora)
   */
  public editarMemoria(
    albumId: string,
    sectionId: string,
    entryId: string,
    novoTitulo: string,
    novaNarrativa: string
  ): AlbumInfancia | null {
    const [_, childId, yearStr] = albumId.split('_');
    const year = parseInt(yearStr, 10) || new Date().getFullYear();
    const album = this.obterAlbum(childId, year);
    if (!album) return null;

    const secao = album.sections.find((s) => s.id === sectionId);
    if (secao) {
      const entrada = secao.entries.find((e) => e.id === entryId);
      if (entrada) {
        entrada.title = novoTitulo;
        entrada.narrative = novaNarrativa;
        entrada.approved = true; // Ao editar manualmente, já fica aprovado
        this.salvarAlbum(album);
      }
    }

    return album;
  }

  /**
   * Remove uma memória do álbum (Editorial)
   */
  public removerMemoria(
    albumId: string,
    sectionId: string,
    entryId: string
  ): AlbumInfancia | null {
    const [_, childId, yearStr] = albumId.split('_');
    const year = parseInt(yearStr, 10) || new Date().getFullYear();
    const album = this.obterAlbum(childId, year);
    if (!album) return null;

    const secao = album.sections.find((s) => s.id === sectionId);
    if (secao) {
      secao.entries = secao.entries.filter((e) => e.id !== entryId);
      this.salvarAlbum(album);
    }

    return album;
  }

  /**
   * Validação e Aprovação Geral da Escola
   */
  public aprovarAlbumCompleto(albumId: string, aprovadorNome: string): AlbumInfancia | null {
    const [_, childId, yearStr] = albumId.split('_');
    const year = parseInt(yearStr, 10) || new Date().getFullYear();
    const album = this.obterAlbum(childId, year);
    if (!album) return null;

    album.status = 'aprovado';
    album.approvedAt = new Date().toISOString();
    album.approvedBy = aprovadorNome;

    // Aprova todas as entradas pendentes
    album.sections.forEach((sec) => {
      sec.entries.forEach((ent) => {
        ent.approved = true;
      });
    });

    this.salvarAlbum(album);
    return album;
  }

  /**
   * Publica o Álbum para a Família com carinho
   */
  public publicarParaFamilia(albumId: string): AlbumInfancia | null {
    const [_, childId, yearStr] = albumId.split('_');
    const year = parseInt(yearStr, 10) || new Date().getFullYear();
    const album = this.obterAlbum(childId, year);
    if (!album) return null;

    album.status = 'publicado';
    album.publishedAt = new Date().toISOString();
    this.salvarAlbum(album);
    return album;
  }
}

export const albumInfanciaService = new AlbumInfanciaService();
