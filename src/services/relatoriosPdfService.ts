import { StudentPaxData } from '../types';
import { getLgpdConsentimentoAluno } from './lgpdService';

export interface RelatorioConfig {
  tipo: 'diario_rotina' | 'ficha_individual' | 'parecer_pedagogico' | 'prontuario_saude' | 'certidao_lgpd';
  dataEmissao: string;
  incluirFotos: boolean;
  incluirAssinaturas: boolean;
  incluirHashSeguranca: boolean;
  observacaoEducador?: string;
  periodo?: string;
}

export function gerarRelatorioPdfHtml(
  student: StudentPaxData,
  config: RelatorioConfig,
  schoolName: string = 'Anjinho Educador',
  schoolSlogan: string = 'Onde a infância é registrada para sempre'
): string {
  const termoLgpd = getLgpdConsentimentoAluno(student.id);
  const dataHoje = new Date().toLocaleDateString('pt-BR');
  const horaHoje = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const hashDocumento = `DOC-PDF-${student.id.slice(0, 4).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

  // Estilos limpos para impressão A4 de alta qualidade
  const css = `
    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      margin: 0;
      padding: 0;
      font-size: 11pt;
      line-height: 1.5;
      background: #ffffff;
    }
    .relatorio-container {
      max-width: 100%;
      margin: 0 auto;
    }
    .header-doc {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #214E8A;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-logo {
      width: 46px;
      height: 46px;
      object-fit: contain;
    }
    .brand-title {
      font-size: 16pt;
      font-weight: 900;
      color: #214E8A;
      line-height: 1.1;
      margin: 0;
    }
    .brand-sub {
      font-size: 8.5pt;
      color: #64748b;
      margin: 2px 0 0 0;
    }
    .doc-meta {
      text-align: right;
      font-size: 8pt;
      color: #64748b;
    }
    .doc-badge {
      display: inline-block;
      background: #e0f2fe;
      color: #0369a1;
      font-weight: 800;
      font-size: 7.5pt;
      padding: 3px 8px;
      border-radius: 999px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .titulo-relatorio {
      font-size: 14pt;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 14px 0;
      padding-bottom: 6px;
      border-bottom: 1px solid #e2e8f0;
    }
    .aluno-card {
      display: flex;
      gap: 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px 16px;
      margin-bottom: 16px;
    }
    .aluno-foto {
      width: 64px;
      height: 64px;
      border-radius: 10px;
      object-fit: cover;
      border: 2px solid #cbd5e1;
    }
    .aluno-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px 16px;
      flex: 1;
    }
    .dado-item {
      display: flex;
      flex-direction: column;
    }
    .dado-label {
      font-size: 7.5pt;
      text-transform: uppercase;
      font-weight: 700;
      color: #64748b;
    }
    .dado-valor {
      font-size: 9.5pt;
      font-weight: 600;
      color: #0f172a;
    }
    .secao-titulo {
      font-size: 10.5pt;
      font-weight: 800;
      color: #214E8A;
      margin: 16px 0 8px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-left: 3px solid #53C7C6;
      padding-left: 8px;
    }
    .tabela {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      font-size: 9pt;
    }
    .tabela th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 700;
      text-align: left;
      padding: 6px 10px;
      border: 1px solid #cbd5e1;
      font-size: 8pt;
      text-transform: uppercase;
    }
    .tabela td {
      padding: 6px 10px;
      border: 1px solid #e2e8f0;
      color: #1e293b;
    }
    .box-destaque {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 14px;
      font-size: 9.5pt;
      color: #166534;
    }
    .observacoes-box {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 12px;
      font-size: 9.5pt;
      min-height: 70px;
      margin-bottom: 16px;
      white-space: pre-wrap;
    }
    .assinaturas-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-top: 36px;
      padding-top: 10px;
      page-break-inside: avoid;
    }
    .linha-assinatura {
      border-top: 1px solid #94a3b8;
      text-align: center;
      padding-top: 6px;
      font-size: 8.5pt;
      color: #475569;
    }
    .linha-assinatura strong {
      display: block;
      color: #0f172a;
      font-size: 9.5pt;
    }
    .rodape-seguranca {
      margin-top: 24px;
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;
      font-size: 7.5pt;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
      page-break-inside: avoid;
    }
  `;

  // Conteúdo variável pelo tipo de relatório
  let conteudoCorpo = '';

  if (config.tipo === 'diario_rotina') {
    conteudoCorpo = `
      <div class="secao-titulo">1. Acompanhamento Biológico & Rotina de Cuidados</div>
      <table class="tabela">
        <thead>
          <tr>
            <th style="width: 25%;">Dimensão</th>
            <th style="width: 35%;">Status Consolidado</th>
            <th style="width: 40%;">Detalhamento / Ocorrências</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Alimentação</strong></td>
            <td>Ótima aceitação</td>
            <td>Café da manhã: Frutas frescas. Almoço: Prato principal 100% consumido com gosto. Lanche: Suco natural e aveia.</td>
          </tr>
          <tr>
            <td><strong>Hidratação</strong></td>
            <td>Adequada (~450 ml)</td>
            <td>Ingestão hídrica contínua ao longo de todo o período letivo em copinho individual higienizado.</td>
          </tr>
          <tr>
            <td><strong>Sono & Descanso</strong></td>
            <td>1h30 de repouso calmo</td>
            <td>Soneca acolhedora no colchonete. Despertar tranquilo, sorridente e sem agitação.</td>
          </tr>
          <tr>
            <td><strong>Fraldas & Higiene</strong></td>
            <td>3 trocas higiênicas</td>
            <td>Pele íntegra e saudável, uso de pomada protetora preventiva conforme autorização dos pais.</td>
          </tr>
          <tr>
            <td><strong>Saúde & Temperatura</strong></td>
            <td>36.5°C (Estável)</td>
            <td>Sem queixas álgicas, sintomas febris ou qualquer indisposição ao longo da permanência na escola.</td>
          </tr>
          <tr>
            <td><strong>Estado Emocional</strong></td>
            <td>Alegre & Participativa</td>
            <td>Acolhimento afetivo positivo, entrosamento excelente nas brincadeiras com os coleguinhas da turma.</td>
          </tr>
        </tbody>
      </table>

      <div class="secao-titulo">2. Vivências e Interações Pedagógicas (BNCC)</div>
      ${(() => {
        const atividadesPedagogicas = (student.auditoriaLinhaDoTempo || []).filter(
          (item) => item.tipo === 'pedagogico' || item.titulo.toLowerCase().includes('atividade') || item.titulo.toLowerCase().includes('roda') || item.titulo.toLowerCase().includes('história') || item.titulo.toLowerCase().includes('pintura') || item.titulo.toLowerCase().includes('parque')
        );

        if (atividadesPedagogicas.length > 0) {
          return `
            <table class="tabela">
              <thead>
                <tr>
                  <th style="width: 12%;">Horário</th>
                  <th style="width: 28%;">Atividade Pedagógica</th>
                  <th style="width: 60%;">Descrição & Como Foi Realizada (Passo a Passo)</th>
                </tr>
              </thead>
              <tbody>
                ${atividadesPedagogicas
                  .map(
                    (a) => `
                  <tr>
                    <td><strong>${a.hora}</strong></td>
                    <td><strong>${a.titulo}</strong></td>
                    <td style="white-space: pre-wrap; font-size: 8.5pt; line-height: 1.4;">${a.descricao}</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          `;
        } else {
          return `
            <div class="box-destaque">
              <strong>Campos de Experiências Trabalhados:</strong> O eu, o outro e o nós • Traços, sons, cores e formas.<br/>
              <strong>Atividade Realizada:</strong> Roda de acolhida musical e oficina de exploração sensorial com tintas naturais. A criança participou ativamente com alegria e excelente engajamento.
            </div>
          `;
        }
      })()}

      <div class="secao-titulo">3. Observações Gerais da Professora Titular</div>
      <div class="observacoes-box">${
        config.observacaoEducador ||
        `Criança muito participativa e afetuosa hoje! Participou com alegria de todas as etapas da rotina e demonstrou excelente autonomia ao alimentar-se e guardar os brinquedos após a oficina de música.`
      }</div>
    `;
  } else if (config.tipo === 'ficha_individual') {
    conteudoCorpo = `
      <div class="secao-titulo">1. Ficha Cadastral e Dados de Contato Familiar</div>
      <table class="tabela">
        <tbody>
          <tr>
            <td style="width: 25%;"><strong>Responsável Legal:</strong></td>
            <td style="width: 40%;">${student.responsavelNome} (${student.responsavelParentesco || 'Responsável'})</td>
            <td style="width: 35%;"><strong>Telefone / WhatsApp:</strong> ${student.responsavelTelefone}</td>
          </tr>
          <tr>
            <td><strong>Professora Titular:</strong></td>
            <td>${student.professoraTitular}</td>
            <td><strong>Turma / Turno:</strong> ${student.turma}</td>
          </tr>
          <tr>
            <td><strong>Alergias ou Restrições:</strong></td>
            <td colspan="2" style="color: #dc2626; font-weight: 700;">${
              student.alergias && student.alergias.length > 0 ? student.alergias.join(', ') : 'Nenhuma alergia relatada'
            }</td>
          </tr>
          <tr>
            <td><strong>Pediatra Assistente:</strong></td>
            <td colspan="2">${student.pediatra?.nome || 'Não informado'} — Contato: ${student.pediatra?.telefone || 'Em prontuário'}</td>
          </tr>
        </tbody>
      </table>

      <div class="secao-titulo">2. Marcos do Desenvolvimento & Autonomia</div>
      <table class="tabela">
        <thead>
          <tr>
            <th>Habilidade / Marco Observado</th>
            <th>Evidência Pedagógica</th>
            <th>Nível de Consolidação</th>
          </tr>
        </thead>
        <tbody>
          ${(student.marcos || ['Socialização espontânea', 'Exploração motora livre', 'Comunicação gestual/verbal'])
            .map(
              (m) => `
            <tr>
              <td><strong>${m}</strong></td>
              <td>Demonstra iniciativa e segurança nas atividades com o grupo e educadores.</td>
              <td><span style="color: #16a34a; font-weight: 700;">✓ Consolidado / Em expansão</span></td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>

      <div class="secao-titulo">3. Parecer Sintético e Recomendações</div>
      <div class="observacoes-box">${
        config.observacaoEducador ||
        `O aluno apresenta adaptação exemplar, estabelecendo vínculos de confiança sólidos com a equipe pedagógica e seus pares. Recomendamos a manutenção da rotina de leitura afetiva em ambiente doméstico.`
      }</div>
    `;
  } else if (config.tipo === 'prontuario_saude') {
    conteudoCorpo = `
      <div class="secao-titulo">1. Protocolo de Saúde e Medicamentos Cadastrados</div>
      <table class="tabela">
        <thead>
          <tr>
            <th>Medicamento</th>
            <th>Horário / Condição</th>
            <th>Dosagem Autorizada</th>
            <th>Autorização Familiar</th>
          </tr>
        </thead>
        <tbody>
          ${
            student.medicamentos && student.medicamentos.length > 0
              ? student.medicamentos
                  .map(
                    (med) => `
                <tr>
                  <td><strong>${med.nome}</strong></td>
                  <td>${med.horario}</td>
                  <td>${med.dosagem}</td>
                  <td><span style="color: #059669; font-weight: 700;">✓ PIN Autorizado por ${med.cadastradoPor}</span></td>
                </tr>
              `
                  )
                  .join('')
              : `<tr><td colspan="4" style="text-align: center; color: #64748b; padding: 12px;">Nenhuma medicação contínua cadastrada no momento.</td></tr>`
          }
        </tbody>
      </table>

      <div class="secao-titulo">2. Alergias e Cuidados de Emergência</div>
      <div class="box-destaque" style="background: #fff1f2; border-color: #fecdd3; color: #9f1239;">
        <strong>Alergias Registradas:</strong> ${
          student.alergias && student.alergias.length > 0 ? student.alergias.join(', ') : 'Nenhuma restrição conhecida'
        }.<br>
        <strong>Conduta da Escola:</strong> Em caso de febre ou reação adversa súbita, o contato imediato deve ser feito com ${student.responsavelNome} no número ${student.responsavelTelefone}.
      </div>

      <div class="secao-titulo">3. Observações Médicas e Orientações aos Educadores</div>
      <div class="observacoes-box">${
        student.diretrizesCuidados || 'Manter hidratação regular e observar sinais de cansaço após atividades físicas ao ar livre.'
      }</div>
    `;
  } else if (config.tipo === 'certidao_lgpd') {
    conteudoCorpo = `
      <div class="secao-titulo">1. Dados do Termo de Consentimento Formal (Lei 13.709/2018)</div>
      <table class="tabela">
        <tbody>
          <tr>
            <td style="width: 30%;"><strong>Responsável Outorgante:</strong></td>
            <td>${termoLgpd?.responsavelNome || student.responsavelNome} (CPF: ${termoLgpd?.responsavelCpf || '***.***.***-**'})</td>
          </tr>
          <tr>
            <td><strong>Aluno(a) Beneficiário(a):</strong></td>
            <td>${student.nome} (Nascimento: ${student.nascimento})</td>
          </tr>
          <tr>
            <td><strong>Data e Hora do Aceite:</strong></td>
            <td>${termoLgpd?.aceitoEmFormatado || dataHoje} (Carimbo Imutável)</td>
          </tr>
          <tr>
            <td><strong>Dispositivo / Origem:</strong></td>
            <td>${termoLgpd?.dispositivoInfo || 'Aplicativo Anjinho Educador'} — IP: ${termoLgpd?.ipOrigem || 'Autenticado'}</td>
          </tr>
          <tr>
            <td><strong>Hash Criptográfico de Integridade:</strong></td>
            <td style="font-family: monospace; font-weight: 700; color: #1e40af;">${
              termoLgpd?.hashAssinaturaDigital || hashDocumento
            }</td>
          </tr>
        </tbody>
      </table>

      <div class="secao-titulo">2. Abrangência dos Consentimentos Outorgados</div>
      <table class="tabela">
        <thead>
          <tr>
            <th>Finalidade Específica (Art. 14 LGPD)</th>
            <th>Autorização</th>
            <th>Base Legal</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Tratamento de dados pessoais da criança para diário escolar</td>
            <td><strong style="color: #16a34a;">AUTORIZADO</strong></td>
            <td>Art. 14, § 1º (Melhor interesse da criança)</td>
          </tr>
          <tr>
            <td>Comunicação direta de rotina e recados via WhatsApp oficial</td>
            <td><strong style="color: #16a34a;">AUTORIZADO</strong></td>
            <td>Execução do Contrato de Prestação Pedagógica</td>
          </tr>
          <tr>
            <td>Registro e controle seguro de saúde e administração médica</td>
            <td><strong style="color: #16a34a;">AUTORIZADO</strong></td>
            <td>Proteção à Vida e Incolumidade Física</td>
          </tr>
          <tr>
            <td>Fotos para portfólio pedagógico e memórias escolares restritas aos pais</td>
            <td><strong style="color: #16a34a;">AUTORIZADO</strong></td>
            <td>Consentimento Específico e em Destaque</td>
          </tr>
        </tbody>
      </table>

      <div class="box-destaque">
        Este documento comprova formalmente o estrito cumprimento da Lei Federal nº 13.709/2018 (LGPD), assegurando transparência pedagógica e proteção integral à privacidade dos dados de crianças e suas famílias.
      </div>
    `;
  } else {
    conteudoCorpo = `
      <div class="secao-titulo">1. Parecer Avaliativo de Desenvolvimento Infantil</div>
      <div class="observacoes-box">${
        config.observacaoEducador ||
        `Ao longo do período, ${student.nome} demonstrou avanços expressivos nos aspectos socioafetivos, psicomotores e de linguagem. Participa ativamente das rodas de conversa, manifesta suas necessidades com clareza e interage fraternalmente com seus educadores e colegas.`
      }</div>
    `;
  }

  // Assinaturas institucionais
  const blocoAssinaturas = config.incluirAssinaturas
    ? `
      <div class="assinaturas-grid">
        <div class="linha-assinatura">
          <strong>${student.professoraTitular}</strong>
          Professora Titular • ${student.turma}
        </div>
        <div class="linha-assinatura">
          <strong>Direção & Coordenação Pedagógica</strong>
          ${schoolName}
        </div>
      </div>
    `
    : '';

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>${schoolName} - Relatório Oficial de ${student.nome}</title>
      <style>${css}</style>
    </head>
    <body>
      <div class="relatorio-container">
        <!-- HEADER OFICIAL DA ESCOLA -->
        <div class="header-doc">
          <div class="brand">
            <img src="/logo.png" class="brand-logo" alt="${schoolName}" />
            <div>
              <h1 class="brand-title">${schoolName}</h1>
              <p class="brand-sub">${schoolSlogan} • Guardião das Memórias da Infância</p>
            </div>
          </div>
          <div class="doc-meta">
            <span class="doc-badge">DOCUMENTO OFICIAL ESCOLAR</span>
            <div>Emissão: <strong>${dataHoje} às ${horaHoje}</strong></div>
            <div>Código: <strong>${student.codigoAl || 'AL-01'}</strong></div>
          </div>
        </div>

        <!-- TÍTULO DO RELATÓRIO -->
        <h2 class="titulo-relatorio">
          ${
            config.tipo === 'diario_rotina'
              ? 'Diário de Rotina, Cuidados & Vivências do Aluno'
              : config.tipo === 'ficha_individual'
              ? 'Ficha Cadastral e Avaliativa do Aluno'
              : config.tipo === 'prontuario_saude'
              ? 'Prontuário Médico, Medicações e Segurança da Saúde'
              : config.tipo === 'certidao_lgpd'
              ? 'Certidão de Conformidade e Consentimento LGPD (Lei 13.709/18)'
              : 'Parecer Pedagógico de Desenvolvimento Integral'
          }
        </h2>

        <!-- CARD IDENTIFICADOR DO ALUNO -->
        <div class="aluno-card">
          ${
            config.incluirFotos && student.fotoUrl
              ? `<img src="${student.fotoUrl}" alt="${student.nome}" class="aluno-foto">`
              : `<div class="aluno-foto" style="display:flex;align-items:center;justify-content:center;background:#e2e8f0;font-size:20pt;">👶</div>`
          }
          <div class="aluno-grid">
            <div class="dado-item">
              <span class="dado-label">Nome do Aluno</span>
              <span class="dado-valor">${student.nome}</span>
            </div>
            <div class="dado-item">
              <span class="dado-label">Turma / Turno</span>
              <span class="dado-valor">${student.turma}</span>
            </div>
            <div class="dado-item">
              <span class="dado-label">Data de Nascimento</span>
              <span class="dado-valor">${student.nascimento} (${student.idadeStr || '3 anos'})</span>
            </div>
            <div class="dado-item">
              <span class="dado-label">Responsável Legal</span>
              <span class="dado-valor">${student.responsavelNome}</span>
            </div>
            <div class="dado-item">
              <span class="dado-label">Contato Emergencial</span>
              <span class="dado-valor">${student.responsavelTelefone}</span>
            </div>
            <div class="dado-item">
              <span class="dado-label">Educadora de Referência</span>
              <span class="dado-valor">${student.professoraTitular}</span>
            </div>
          </div>
        </div>

        <!-- CORPO PRINCIPAL -->
        ${conteudoCorpo}

        <!-- ASSINATURAS -->
        ${blocoAssinaturas}

        <!-- RODAPÉ DE SEGURANÇA E LGPD -->
        <div class="rodape-seguranca">
          <div>
            ${schoolName} • Árvore da Infância • Lei Federal 13.709/2018 (LGPD) • Certidão válida sem rasuras
          </div>
          <div>
            Integridade Criptográfica: <strong style="font-family:monospace;">${hashDocumento}</strong>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Abre a janela nativa do navegador formatada para gerar o PDF ou imprimir diretamente
 */
export function imprimirOuExportarPdf(
  student: StudentPaxData,
  config: RelatorioConfig,
  schoolName: string = 'Anjinho Educador',
  schoolSlogan: string = 'Onde a infância é registrada para sempre'
) {
  const html = gerarRelatorioPdfHtml(student, config, schoolName, schoolSlogan);

  // Cria um iframe invisível para disparar a impressão de forma limpa
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(html);
    doc.close();

    // Aguarda carregar imagens e estilos antes de abrir o diálogo de impressão/salvamento em PDF
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();

      // Remove o iframe da memória após a conclusão
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 450);
  }
}
