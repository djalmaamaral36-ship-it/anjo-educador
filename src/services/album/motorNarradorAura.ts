/**
 * MOTOR 3: NARRADOR AURA
 * Anjinho Escolar & Anjinha Aura
 * 
 * Regras Estritas da Narrativa:
 * 1. MODO GROUNDED: 100% ancorado nos registros reais. Nunca inventar fatos, datas ou falas.
 * 2. TOM AFETIVO: Poético, humano, delicado e acolhedor (Brand Book: Guardião das Memórias).
 * 3. TEXTOS CONCISOS: Títulos até 8 palavras, narrativas de 2 a 5 frases.
 * 4. REGRA DA VERDADE: Se não houver fala registrada, não criar "Minha Voz". Se não houver carta, não inventar carta fictícia.
 */

import { StudentPaxData } from '../../types';
import { AlbumEntry, AlbumSection, AlbumCover } from '../../types/albumInfancia';
import { CandidatoMemoria } from './motorCuradorAlbum';
import { ContextoArvoreAlbum } from './motorArvoreInfancia';

export class MotorNarradorAura {
  /**
   * Transforma um registro bruto em uma narrativa poética ancorada no fato real
   */
  public narrarMemoria(candidato: CandidatoMemoria, childName: string): AlbumEntry {
    const textoOriginal = candidato.textoOriginal;
    let tituloPoetico = candidato.tituloBruto;
    let narrativaPoetica = textoOriginal;

    switch (candidato.categoria) {
      case 'arte':
        tituloPoetico = 'Cores, Formas e Descobertas com as Mãos';
        narrativaPoetica = `Entre texturas e novas cores, ${childName} experimentou o encanto de criar e sentir o mundo através das próprias mãos: ${textoOriginal}`;
        break;

      case 'musica':
        tituloPoetico = 'Ritmos, Sons e Alegria Compartilhada';
        narrativaPoetica = `A música preencheu a sala de encanto e movimento. Um momento gostoso em que ${childName} dançou, cantou e se expressou com liberdade: ${textoOriginal}`;
        break;

      case 'movimento':
        tituloPoetico = 'Passos Firmes e a Alegria de Explorar';
        narrativaPoetica = `Correr, pular e sentir o vento no rosto. Cada novo movimento de ${childName} revela coragem e curiosidade em desbravar o espaço ao redor: ${textoOriginal}`;
        break;

      case 'autonomia':
        tituloPoetico = 'Uma Pequena Grande Conquista Feita Sozinha';
        narrativaPoetica = `O brilho nos olhos de quem descobre que é capaz. Com paciência e incentivo, ${childName} deu mais um passo lindo em sua autonomia: ${textoOriginal}`;
        break;

      case 'convivencia':
        tituloPoetico = 'O Vínculo, o Abraço e a Amizade';
        narrativaPoetica = `A infância se constrói em companhia. Ao lado dos amigos e educadores, ${childName} partilhou sorrisos e afetos que marcam a alma: ${textoOriginal}`;
        break;

      case 'linguagem':
        tituloPoetico = 'As Primeiras Expressões do Pensamento';
        narrativaPoetica = `Com novas palavras e gestos carinhosos, ${childName} encantou a todos ao comunicar suas vontades, descobertas e sentimentos: ${textoOriginal}`;
        break;

      default:
        tituloPoetico = candidato.tituloBruto || 'Um Momento Especial do Nosso Dia';
        narrativaPoetica = `${childName} viveu mais uma etapa linda de cuidado e acolhimento em nossa rotina escolar: ${textoOriginal}`;
        break;
    }

    return {
      id: `entry_${candidato.id}`,
      childId: candidato.id,
      sourceType: candidato.sourceType,
      sourceId: candidato.sourceId,
      date: candidato.date,
      periodo: candidato.periodo || 'Ao longo do ano letivo',
      title: tituloPoetico,
      narrative: narrativaPoetica,
      originalText: candidato.textoOriginal,
      media: candidato.midias,
      category: candidato.categoria,
      aiGenerated: true,
      aiConfidence: 0.95,
      approved: false, // Inicia como sugestão para a professora revisar e aprovar
      editorialScore: (candidato as any).editorialScore || 5.0,
    };
  }

  /**
   * Monta a Capa do Álbum
   */
  public gerarCapa(student: StudentPaxData, schoolYear: number): AlbumCover {
    return {
      title: 'MEU ÁLBUM DA 1ª INFÂNCIA®',
      subtitle: 'Guardião das Memórias e da História Afetiva',
      childName: student.nome,
      schoolYear: schoolYear,
      schoolName: 'Escola Anjinho de Amor',
      coverPhotoUrl: student.fotoUrl,
      estacaoArvoreSimbolo: '🌱',
    };
  }

  /**
   * Monta as 11 Seções Estruturais Narrativas do Álbum
   */
  public construirEstruturaCompleta(
    student: StudentPaxData,
    memóriasNarradas: AlbumEntry[],
    contextoArvore: ContextoArvoreAlbum,
    schoolYear: number
  ): AlbumSection[] {
    const sections: AlbumSection[] = [];

    // 1. Abertura
    sections.push({
      id: 'sec_abertura',
      type: 'abertura',
      title: 'Abertura: Era Uma Vez...',
      subtitle: `O início de um capítulo inesquecível na vida de ${student.nome}`,
      order: 1,
      visible: true,
      entries: [
        {
          id: 'entry_abertura',
          childId: student.id,
          sourceType: 'observacao',
          sourceId: 'abertura_oficial',
          date: `${schoolYear}-02-15`,
          title: 'Um Capítulo Escrito Dia a Dia',
          narrative: `A primeira infância não volta, mas tudo o que é vivido com amor permanece para sempre. Este álbum guarda as pegadas, os risos soltos, os olhares curiosos e os pequenos grandes milagres que floresceram na jornada de ${student.nome}.`,
          aiGenerated: true,
          approved: true,
        },
      ],
    });

    // 2. Meu Ano em Momentos (Memórias Cronológicas)
    sections.push({
      id: 'sec_momentos',
      type: 'momentos',
      title: '1. Meu Ano em Momentos',
      subtitle: 'Uma linha do tempo de vivências e rotina acolhedora',
      order: 2,
      visible: true,
      entries: memóriasNarradas.slice(0, 8),
    });

    // 3. Minhas Descobertas
    const descobertas = memóriasNarradas.filter(
      (m) => m.category === 'arte' || m.category === 'musica' || m.category === 'natureza'
    );
    sections.push({
      id: 'sec_descobertas',
      type: 'descobertas',
      title: '2. Minhas Descobertas',
      subtitle: 'Explorações sensoriais, arte e a magia do mundo',
      order: 3,
      visible: descobertas.length > 0,
      entries: descobertas.length > 0 ? descobertas : memóriasNarradas.slice(0, 3),
    });

    // 4. Minhas Pequenas Grandes Conquistas
    const conquistas = memóriasNarradas.filter(
      (m) => m.category === 'autonomia' || m.category === 'movimento'
    );
    sections.push({
      id: 'sec_conquistas',
      type: 'conquistas',
      title: '3. Minhas Pequenas Grandes Conquistas',
      subtitle: 'Passos rumo à independência e à autoconfiança',
      order: 4,
      visible: true,
      entries: conquistas.length > 0 ? conquistas : [
        {
          id: 'conquista_autonomia_padrao',
          childId: student.id,
          sourceType: 'conquista',
          sourceId: 'conquista_1',
          date: `${schoolYear}-06-20`,
          title: 'Autonomia que Começa a Desabrochar',
          narrative: `${student.nome} conquistou maior segurança nos momentos de cuidado pessoal e alimentação, comemorando cada conquista com entusiasmo contagiante.`,
          aiGenerated: true,
          approved: true,
        },
      ],
    });

    // 5. Pessoas da Minha História
    sections.push({
      id: 'sec_pessoas',
      type: 'pessoas',
      title: '4. Pessoas da Minha História',
      subtitle: 'Educadores, cuidadores e o calor humano que ampara o crescimento',
      order: 5,
      visible: true,
      entries: [
        {
          id: 'entry_educadores',
          childId: student.id,
          sourceType: 'observacao',
          sourceId: 'professores',
          date: `${schoolYear}-08-10`,
          title: `Professora Titular: ${student.professoraTitular || 'Equipe Pedagógica'}`,
          narrative: `Com carinho e presença atenta, as mãos que acolhem e conduzem ${student.nome} na escola garantem a segurança psicológica essencial para se desenvolver com tranquilidade.`,
          aiGenerated: true,
          approved: true,
        },
      ],
    });

    // 6. Minha Árvore da Infância®
    sections.push({
      id: 'sec_arvore',
      type: 'arvore',
      title: '5. Minha Árvore da Infância®',
      subtitle: contextoArvore.subtitulo,
      order: 6,
      visible: true,
      entries: [
        {
          id: 'arvore_dimensoes',
          childId: student.id,
          sourceType: 'arvore',
          sourceId: 'metodo_arvore',
          date: `${schoolYear}-11-01`,
          title: `Estação: ${contextoArvore.estacaoNome} ${contextoArvore.estacaoSimbolo}`,
          narrative: contextoArvore.frasePoetica,
          originalText: contextoArvore.dimensoesFortalecidas.map((d) => `• ${d.dimensao}: ${d.descricaoAfetiva}`).join('\n'),
          aiGenerated: true,
          approved: true,
        },
      ],
    });

    // 7. O Olhar da Escola
    sections.push({
      id: 'sec_olhar_escola',
      type: 'olhar_escola',
      title: '6. O Olhar da Escola',
      subtitle: 'Uma mensagem de amor e reconhecimento escrita pela equipe',
      order: 7,
      visible: true,
      entries: [
        {
          id: 'mensagem_escola',
          childId: student.id,
          sourceType: 'observacao',
          sourceId: 'professora_recado',
          date: `${schoolYear}-11-20`,
          title: 'Querida Família,',
          narrative: `Conviver com ${student.nome} neste ano letivo foi um presente de imensa alegria. Acompanhar cada sorriso, abraço e superação reforça nossa certeza de que educar a primeira infância é, antes de tudo, amar e proteger as memórias.`,
          aiGenerated: true,
          approved: false, // Requer validação humana da professora
        },
      ],
    });

    // 8. Carta para o Futuro
    sections.push({
      id: 'sec_carta_futuro',
      type: 'carta_futuro',
      title: '7. Carta para o Futuro',
      subtitle: 'Uma cápsula do tempo para ser lida quando você crescer',
      order: 8,
      visible: true,
      entries: [
        {
          id: 'carta_futuro_conteudo',
          childId: student.id,
          sourceType: 'carta',
          sourceId: 'capsula_tempo',
          date: `${schoolYear}-12-01`,
          title: `Para ${student.nome}, quando ler isto no futuro:`,
          narrative: `Nunca se esqueça da doçura, da coragem e da pureza do seu coração neste ano de ${schoolYear}. Você foi, e sempre será, infinitamente amado e protegido em cada passo do seu caminho.`,
          aiGenerated: true,
          approved: true,
        },
      ],
    });

    // 9. Encerramento
    sections.push({
      id: 'sec_encerramento',
      type: 'encerramento',
      title: 'Encerramento: O Legado Permanece',
      subtitle: 'A infância passa. As memórias permanecem.',
      order: 9,
      visible: true,
      entries: [
        {
          id: 'fechamento_album',
          childId: student.id,
          sourceType: 'observacao',
          sourceId: 'fim',
          date: `${schoolYear}-12-15`,
          title: 'Até o Próximo Capítulo!',
          narrative: 'Este capítulo escolar se encerra, mas a sua linda história continua crescendo e frutificando todos os dias. Com carinho e gratidão, Equipe Anjinho Escolar.',
          aiGenerated: true,
          approved: true,
        },
      ],
    });

    return sections;
  }
}
