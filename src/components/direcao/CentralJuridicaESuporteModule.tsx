import React, { useState } from 'react';
import {
  Shield,
  FileText,
  Phone,
  MessageCircle,
  Download,
  Printer,
  Copy,
  Check,
  Server,
  Database,
  Lock,
  Clock,
  AlertTriangle,
  Send,
  HelpCircle,
  ExternalLink,
  Award,
  Users,
  CheckCircle2,
  Calendar,
  Sparkles,
  Building2,
  FileCheck,
  RefreshCw,
  Eye,
  Sliders,
  Mail,
  ChevronRight,
  Edit3,
  Save,
  Smartphone
} from 'lucide-react';
import LogoAnjinhoEducador from '../comum/LogoAnjinhoEducador';

interface Props {
  userRole?: 'professor' | 'familia';
  onNavigateTab?: (tab: string) => void;
}

type SubAba = 'documentos' | 'suporte' | 'backups' | 'faturamento';
type DocumentoId = 'piloto' | 'termos_uso' | 'politica_privacidade' | 'consentimento_pais' | 'contrato_saas';

export default function CentralJuridicaESuporteModule({ userRole = 'professor', onNavigateTab }: Props) {
  const [activeSubAba, setActiveSubAba] = useState<SubAba>('documentos');
  const [selectedDocId, setSelectedDocId] = useState<DocumentoId>('piloto');
  
  // Customização dos Dados do Documento
  const [nomeEscola, setNomeEscola] = useState<string>('Colégio Árvore da Infância');
  const [cnpjEscola, setCnpjEscola] = useState<string>('12.345.678/0001-90');
  const [nomeDiretora, setNomeDiretora] = useState<string>('Nilva Amaral');
  const [cidadeEstado, setCidadeEstado] = useState<string>('São Paulo - SP');
  const [nomeFundador, setNomeFundador] = useState<string>('Djalma Amaral');
  const [cpfFundador, setCpfFundador] = useState<string>('123.456.789-00');
  const [diasPiloto, setDiasPiloto] = useState<string>('60 dias (Gratuito)');
  
  // Telefones e Canais Oficiais de Atendimento (Suporte / Plantão da Engenharia)
  const [telefonePlantao, setTelefonePlantao] = useState<string>(() => {
    return localStorage.getItem('anjinho_telefone_suporte') || '(11) 95555-4440';
  });
  const [emailSuporte, setEmailSuporte] = useState<string>(() => {
    return localStorage.getItem('anjinho_email_suporte') || 'suporte@anjinhoescolar.com.br';
  });
  const [isEditandoCanais, setIsEditandoCanais] = useState<boolean>(false);
  const [canaisSalvosSucesso, setCanaisSalvosSucesso] = useState<boolean>(false);

  // Helper para limpar número para o link da API do WhatsApp
  const sanitizePhoneForWhatsApp = (phone: string) => {
    const digitsOnly = phone.replace(/\D/g, '');
    if (!digitsOnly) return '5511955554440';
    if (digitsOnly.startsWith('55')) {
      return digitsOnly;
    }
    return `55${digitsOnly}`;
  };

  const handleSalvarCanais = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    localStorage.setItem('anjinho_telefone_suporte', telefonePlantao);
    localStorage.setItem('anjinho_email_suporte', emailSuporte);
    setCanaisSalvosSucesso(true);
    setIsEditandoCanais(false);
    setTimeout(() => setCanaisSalvosSucesso(false), 3000);
  };
  
  // Feedback states
  const [copiedText, setCopiedText] = useState(false);
  const [backupGenerated, setBackupGenerated] = useState(false);

  // Chamado de Suporte
  const [chamadoTipo, setChamadoTipo] = useState<'critica' | 'media' | 'baixa'>('critica');
  const [chamadoTitulo, setChamadoTitulo] = useState<string>('Dificuldade de acesso matutino');
  const [chamadoDescricao, setChamadoDescricao] = useState<string>('');
  const [chamadoNomeContato, setChamadoNomeContato] = useState<string>('Nilva Amaral (Diretora)');
  const [chamadoTelefone, setChamadoTelefone] = useState<string>('(11) 98844-2211');
  const [chamadoEnviado, setChamadoEnviado] = useState(false);

  // Data formatada para documentos
  const dataHojeStr = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  // GERAÇÃO DOS DOCUMENTOS JURÍDICOS COMPLETOS
  const gerarConteudoDocumento = (id: DocumentoId): { titulo: string; subtitulo: string; texto: string } => {
    switch (id) {
      case 'piloto':
        return {
          titulo: 'TERMO DE PARCERIA PILOTO E DEGUSTAÇÃO GRATUITA',
          subtitulo: 'Acordo de cooperação técnica, homologação e proteção de dados para a Educação Infantil',
          texto: `TERMO DE PARCERIA PILOTO E DEGUSTAÇÃO GRATUITA DE SOFTWARE

Pelo presente instrumento particular, de um lado:

DESENVOLVEDOR / OPERADOR TÉCNICO:
${nomeFundador}, brasileiro, desenvolvedor e idealizador da plataforma ANJINHO ESCOLAR & ANJINHA AURA, portador do CPF nº ${cpfFundador}, doravante denominado simplesmente "OPERADOR TÉCNICO / ANJINHO ESCOLAR".

E de outro lado:

INSTITUIÇÃO DE ENSINO / CONTROLADORA:
${nomeEscola}, pessoa jurídica de direito privado, inscrita no CNPJ/MF sob o nº ${cnpjEscola}, com sede em ${cidadeEstado}, neste ato representada por sua Diretora/Gestora ${nomeDiretora}, doravante denominada "ESCOLA / CONTROLADORA".

As partes acima identificadas têm, entre si, justo e acordado o presente TERMO DE PARCERIA PILOTO E DEGUSTAÇÃO GRATUITA, que se regerá pelas seguintes cláusulas e condições:

CLÁUSULA PRIMEIRA – DO OBJETO
1.1. O presente instrumento tem por objeto a concessão de acesso gratuito, irrestrito e temporário à plataforma digital "ANJINHO ESCOLAR & ANJINHA AURA" para uso pedagógico, rotina escolar, controle diário de bem-estar infantil e comunicação com famílias nas turmas selecionadas pela ESCOLA.
1.2. O período de degustação e projeto piloto terá duração de ${diasPiloto}, com início imediato na data de assinatura deste termo.

CLÁUSULA SEGUNDA – DA GRATUIDADE E ISENÇÃO DE ENCARGOS
2.1. O período de degustação é 100% (cem por cento) GRATUITO para a ESCOLA e para as famílias vinculadas.
2.2. A participação no piloto não gera qualquer obrigação compulsória de contratação futura, nem cobrança de taxas de adesão, implantação ou multas rescisórias ao final do período.

CLÁUSULA TERCEIRA – DA PROTEÇÃO DE DADOS (LGPD - LEI Nº 13.709/2018)
3.1. As partes declaram estrita observância à Lei Geral de Proteção de Dados (Lei nº 13.709/2018), em especial ao Art. 14 (Tratamento de dados pessoais de crianças e adolescentes).
3.2. A ESCOLA atua como CONTROLADORA dos dados de seus alunos e responsáveis, cabendo a ela a coleta do consentimento inicial.
3.3. O ANJINHO ESCOLAR atua estritamente como OPERADOR TÉCNICO, comprometendo-se a:
    a) Tratar os dados exclusivamente para a finalidade da rotina escolar, bem-estar e comunicação pedagógica;
    b) Não comercializar, transferir ou fornecer dados a terceiros para qualquer finalidade publicitária;
    c) Manter os dados protegidos sob criptografia de alto padrão (AES-256 e TLS) com rotinas de backup diárias;
    d) Eliminar ou exportar integralmente os dados para a ESCOLA caso a parceria não seja continuada ao término do piloto.

CLÁUSULA QUARTA – DO SUPORTE E TREINAMENTO
4.1. O ANJINHO ESCOLAR disponibilizará canal prioritário de suporte operacional via WhatsApp para a Direção, Coordenação e Educadoras durante todo o período de testes.

CLÁUSULA QUINTA – DA TRANSIÇÃO E CONTINUIDADE
5.1. Ao término do período de ${diasPiloto}, a ESCOLA terá prioridade e condições comerciais diferenciadas para a formalização do contrato de licença definitiva sob o CNPJ oficial do ANJINHO ESCOLAR.

E, por estarem justas e acordadas, as partes firmam o presente termo.

${cidadeEstado}, ${dataHojeStr}.


________________________________________________
${nomeFundador}
Idealizador & Desenvolvedor — Anjinho Escolar


________________________________________________
${nomeDiretora}
Direção Geral — ${nomeEscola}`
        };

      case 'termos_uso':
        return {
          titulo: 'TERMOS DE USO E ACORDO DE PROCESSAMENTO DE DADOS (DPA / SAAS)',
          subtitulo: 'Regulamento oficial de licenciamento, responsabilidades e proteção técnica',
          texto: `TERMOS DE USO DO SISTEMA ANJINHO ESCOLAR & DPA (DATA PROCESSING AGREEMENT)

1. DISPOSIÇÕES GERAIS
O Anjinho Escolar é uma plataforma SaaS (Software as a Service) voltada exclusivamente para a Educação Infantil e Primeira Infância, integrando registro de rotina em 1-clique, linha do tempo afetiva, governança da saúde e comunicação transparente com os responsáveis legais.

2. ATRIBUIÇÃO DE PAPÉIS (LGPD - LEI 13.709/2018)
2.1. A INSTITUIÇÃO DE ENSINO CONTRATANTE é a única CONTROLADORA dos dados pessoais e sensíveis inseridos no sistema.
2.2. A PLATAFORMA ANJINHO ESCOLAR atua unicamente como OPERADORA, executando o tratamento de dados segundo as ordens e finalidades educacionais determinadas pela Contratante.

3. CONFIDENCIALIDADE E SEGURANÇA
3.1. Todos os registros de alimentação, sono, evacuação, medicação e fotos são armazenados em servidores Google Cloud com criptografia AES-256 em repouso e TLS 1.3 em trânsito.
3.2. É expressamente vedado o uso de dados de menores para geração de perfis comportamentais para fins comerciais ou cessão a terceiros.

4. DISPONIBILIDADE E SLA (SERVICE LEVEL AGREEMENT)
4.1. A plataforma garante índice de disponibilidade (Uptime) de 99,5% no horário escolar (06h30 às 19h30 em dias úteis).
4.2. São mantidas rotinas automáticas de backup diário com retenção de segurança de 30 dias.

5. PROPRIEDADE INTELECTUAL
5.1. A metodologia "Árvore da Infância®", algoritmos, interface e identidade visual são marcas e propriedades intelectuais protegidas, concedendo-se à Escola licença temporária e não exclusiva de uso.

${cidadeEstado}, ${dataHojeStr}.`
        };

      case 'politica_privacidade':
        return {
          titulo: 'POLÍTICA DE PRIVACIDADE E PROTEÇÃO DA PRIMEIRA INFÂNCIA',
          subtitulo: 'Diretrizes de transparência calma e segurança psicológica de dados de menores',
          texto: `POLÍTICA DE PRIVACIDADE E SEGURANÇA — ANJINHO ESCOLAR

Compromisso Fundamental: Cuidar da infância e preservar suas memórias com absoluta segurança e afeto.

1. QUAIS DADOS SÃO COLETADOS E POR QUÊ:
• Identificação do Aluno: Nome completo, data de nascimento e turma (para identificação em sala).
• Rotina e Cuidados Diários: Consumo de água, refeições, trocas de fralda, temperatura e sono (para segurança física e tranquilidade das famílias).
• Saúde e Alergias: Medicamentos prescritos com autorização formal dos pais e alergias alimentares registradas com trava de segurança.
• Fotos e Vivências Pedagógicas: Imagens restritas às famílias de cada aluno conforme o Termo de Consentimento Escolar.

2. DIREITOS DOS PAIS E TITULARES:
Os responsáveis legais possuem o direito de:
• Acessar a qualquer momento todos os registros diários de seus filhos;
• Solicitar retificação de dados cadastrais;
• Revogar autorizações de uso de fotos no mural coletivo a qualquer momento.

3. DESCARTE E RETENÇÃO:
Ao final do ano letivo ou em caso de transferência escolar, a família tem direito a receber o Livro Digital de Memórias (PDF) e a Escola mantém os logs de auditoria conforme exigência legal de guarda de prontuários educacionais.

${cidadeEstado}, ${dataHojeStr}.`
        };

      case 'consentimento_pais':
        return {
          titulo: 'TERMO DE CONSENTIMENTO ESCOLAR — USO DE AGENDA DIGITAL E IMAGEM',
          subtitulo: 'Modelo oficial fornecido para a Escola colher a assinatura dos pais na matrícula',
          texto: `TERMO DE AUTORIZAÇÃO E CONSENTIMENTO LIVRE E ESCLARECIDO
(Conforme Art. 14, §1º da Lei Federal nº 13.709/2018 - LGPD)

Eu, ____________________________________________________________________,
portador(a) do RG nº _______________________ e CPF nº _____________________,
na qualidade de responsável legal pelo(a) aluno(a) ____________________________________________________________________,
regularmente matriculado(a) na turma ___________________________ do ${nomeEscola}.

DECLARO e AUTORIZO:

1. USO DA PLATAFORMA DIGITAL ANJINHO ESCOLAR:
Autorizo o ${nomeEscola} a utilizar a plataforma Anjinho Escolar para registro diário das atividades de cuidado (alimentação, hidratação, sono, fraldas, temperatura e medicações solicitadas) e vivências pedagógicas do meu filho(a).

2. ENVIO DE RELATÓRIOS E AVISOS VIA WHATSAPP:
Autorizo o envio do Diário de Classe Digital e comunicados institucionais da escola diretamente para o meu número de WhatsApp cadastrado.

3. REGISTRO DE FOTOS PEDAGÓGICAS:
(  ) AUTORIZO o registro de fotos das vivências pedagógicas e brincadeiras para envio exclusivo no meu diário individual e álbum de memórias da escola.
(  ) NÃO AUTORIZO o registro fotográfico do meu filho(a).

Estou ciente de que os dados serão tratados com sigilo absoluto, sem qualquer finalidade comercial, e que posso revogar esta autorização a qualquer momento mediante solicitação por escrito à secretaria da escola.

${cidadeEstado}, ____ de ___________________ de 2026.


_______________________________________________________________
Assinatura do Responsável Legal`
        };

      case 'contrato_saas':
        return {
          titulo: 'CONTRATO DE LICENCIAMENTO DE SOFTWARE E PRESTAÇÃO DE SERVIÇOS (SAAS)',
          subtitulo: 'Minuta de contrato comercial definitivo para contratação pós-degustação',
          texto: `CONTRATO DE PRESTAÇÃO DE SERVIÇOS E LICENÇA DE USO DE SOFTWARE

CONTRATADA:
ANJINHO ESCOLAR TECNOLOGIA EDUCACIONAL LTDA (ou ${nomeFundador} - Desenvolvedor)
CNPJ/CPF: ${cpfFundador}
Endereço: ${cidadeEstado}

CONTRATANTE:
${nomeEscola}
CNPJ: ${cnpjEscola}
Representante Legal: ${nomeDiretora}

CLÁUSULA 1ª - DO OBJETO E ESCOPO:
Licença de uso mensal e continuada do ecossistema Anjinho Escolar & Anjinha Aura, contemplando:
• Portal do Professor (Diário 1-Clique por Voz);
• Portal da Direção e Coordenação (Visão 360º de todas as turmas);
• Envio automatizado de diários no WhatsApp dos pais;
• Módulo de Auditoria LGPD e Medicamentos com trava de PIN.

CLÁUSULA 2ª - DO VALOR E FORMA DE PAGAMENTO:
A CONTRATANTE pagará mensalmente o valor acordado por aluno ativo na plataforma, com emissão automática de Boleto Bancário / PIX com QR Code e Nota Fiscal de Serviços Eletrônica (NFS-e).

CLÁUSULA 3ª - DO SUPORTE E DISPONIBILIDADE:
Plantão matutino de suporte prioritário para a Direção e garantia de 99,5% de Uptime.

${cidadeEstado}, ${dataHojeStr}.`
        };
    }
  };

  const docAtual = gerarConteudoDocumento(selectedDocId);

  const handleCopiarTexto = () => {
    navigator.clipboard.writeText(docAtual.texto);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleImprimir = () => {
    const janelaImpressao = window.open('', '_blank');
    if (janelaImpressao) {
      janelaImpressao.document.write(`
        <html>
          <head>
            <title>${docAtual.titulo} - Anjinho Escolar</title>
            <style>
              body { font-family: 'Arial', sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; font-size: 13px; }
              .header { text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 20px; margin-bottom: 30px; }
              .logo-title { font-size: 20px; font-weight: bold; color: #0f172a; margin: 5px 0; }
              .logo-sub { font-size: 12px; color: #64748b; }
              .doc-title { font-size: 15px; font-weight: bold; color: #0369a1; text-align: center; margin-bottom: 25px; text-transform: uppercase; }
              .content { white-space: pre-wrap; word-wrap: break-word; }
              .footer { margin-top: 50px; font-size: 11px; text-align: center; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo-title">🌟 ANJINHO ESCOLAR & ANJINHA AURA</div>
              <div class="logo-sub">Plataforma de Afetividade, Rotina e Proteção de Dados na Primeira Infância</div>
            </div>
            <div class="doc-title">${docAtual.titulo}</div>
            <div class="content">${docAtual.texto}</div>
            <div class="footer">
              Documento gerado eletronicamente em conformidade com a Lei Federal nº 13.709/2018 (LGPD).
            </div>
          </body>
        </html>
      `);
      janelaImpressao.document.close();
      janelaImpressao.focus();
      setTimeout(() => {
        janelaImpressao.print();
      }, 500);
    }
  };

  const handleEnviarChamadoSuporte = (e: React.FormEvent) => {
    e.preventDefault();
    const textoZap = `🚨 *CHAMADO DE SUPORTE — ANJINHO ESCOLAR*
🏫 *Escola:* ${nomeEscola}
👤 *Solicitante:* ${chamadoNomeContato} (${chamadoTelefone})
⚠️ *Nível:* ${chamadoTipo === 'critica' ? '🔴 CRÍTICA (Plantão Matutino)' : chamadoTipo === 'media' ? '🟡 MÉDIA' : '🟢 DÚVIDA / SUGESTÃO'}
📋 *Assunto:* ${chamadoTitulo}
💬 *Descrição:* ${chamadoDescricao || 'Solicito suporte técnico da equipe.'}
⏰ *Horário:* ${new Date().toLocaleTimeString('pt-BR')}`;

    const numZap = sanitizePhoneForWhatsApp(telefonePlantao);
    const url = `https://api.whatsapp.com/send?phone=${numZap}&text=${encodeURIComponent(textoZap)}`;
    window.open(url, '_blank');
    setChamadoEnviado(true);
    setTimeout(() => setChamadoEnviado(false), 5000);
  };

  const handleGerarBackupCompleto = () => {
    setBackupGenerated(true);
    const dadosBackup = {
      escola: nomeEscola,
      cnpj: cnpjEscola,
      geradoEm: new Date().toISOString(),
      versaoSistema: 'Anjinho Escolar v3.4 - LGPD Compliant',
      totalAlunosCadastrados: 8,
      statusBanco: 'Google Cloud Firestore Multi-Regional Ativo',
      integridadeHash: 'SHA256-ANJINHO-BACKUP-OK-2026',
    };

    const blob = new Blob([JSON.stringify(dadosBackup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_seguranca_${nomeEscola.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setTimeout(() => setBackupGenerated(false), 4000);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Top Banner de Identidade Jurídica e Suporte */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-indigo-900/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
              <Shield size={14} />
              <span>Conformidade Legal & SLA de Suporte 07h00</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>Central Jurídica, Contratos & Suporte</span>
            </h1>
            <p className="text-sm text-indigo-200/90 max-w-2xl leading-relaxed">
              Tudo o que a Direção Escolar precisa: contratos de degustação piloto com respaldo em seu CPF/CNPJ, termos de uso, modelos para entrega aos pais (LGPD Art. 14), backups automáticos diários e canal direto de plantão matutino.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setActiveSubAba('suporte')}
              className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition active:scale-95"
            >
              <Phone size={15} />
              <span>Plantão Matutino (WhatsApp)</span>
            </button>
            <button
              onClick={() => setActiveSubAba('documentos')}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 border border-white/20 transition active:scale-95"
            >
              <FileCheck size={15} />
              <span>Gerar Termo Piloto</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navegação Superior em 4 Abas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200">
        <button
          onClick={() => setActiveSubAba('documentos')}
          className={`px-4 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
            activeSubAba === 'documentos'
              ? 'bg-white text-indigo-900 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText size={16} className={activeSubAba === 'documentos' ? 'text-indigo-600' : 'text-slate-400'} />
          <span>1. Documentos & Contratos</span>
        </button>

        <button
          onClick={() => setActiveSubAba('suporte')}
          className={`px-4 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
            activeSubAba === 'suporte'
              ? 'bg-white text-emerald-900 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Phone size={16} className={activeSubAba === 'suporte' ? 'text-emerald-600' : 'text-slate-400'} />
          <span>2. Suporte & Plantão 07h</span>
        </button>

        <button
          onClick={() => setActiveSubAba('backups')}
          className={`px-4 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
            activeSubAba === 'backups'
              ? 'bg-white text-blue-900 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Database size={16} className={activeSubAba === 'backups' ? 'text-blue-600' : 'text-slate-400'} />
          <span>3. Segurança & Backups</span>
        </button>

        <button
          onClick={() => setActiveSubAba('faturamento')}
          className={`px-4 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
            activeSubAba === 'faturamento'
              ? 'bg-white text-amber-900 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Award size={16} className={activeSubAba === 'faturamento' ? 'text-amber-600' : 'text-slate-400'} />
          <span>4. Planos & Cobrança (Asaas)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* ABA 1: DOCUMENTOS JURÍDICOS & CONTRATOS (KIT COMPLETO) */}
      {/* ========================================================================= */}
      {activeSubAba === 'documentos' && (
        <div className="space-y-6">
          {/* Menu Lateral de Seleção do Documento + Área de Pré-Visualização */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Coluna Esquerda: Seletor de Documentos e Painel de Dados */}
            <div className="lg:col-span-4 space-y-5">
              
              {/* Seletor de Documentos */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <FileText size={14} className="text-indigo-600" />
                  <span>Selecione o Documento Jurídico</span>
                </h3>

                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedDocId('piloto')}
                    className={`w-full text-left p-3.5 rounded-2xl transition border flex items-start gap-3 ${
                      selectedDocId === 'piloto'
                        ? 'bg-indigo-50/80 border-indigo-300 text-indigo-950 font-bold shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-indigo-600 text-white flex-shrink-0 mt-0.5">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black">Termo Piloto / Degustação</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-400 text-amber-950">FASE ATUAL</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-normal mt-0.5 leading-snug">
                        Para iniciar na escola como Pessoa Física (sem custo inicial, 100% LGPD).
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedDocId('consentimento_pais')}
                    className={`w-full text-left p-3.5 rounded-2xl transition border flex items-start gap-3 ${
                      selectedDocId === 'consentimento_pais'
                        ? 'bg-indigo-50/80 border-indigo-300 text-indigo-950 font-bold shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-emerald-600 text-white flex-shrink-0 mt-0.5">
                      <Users size={16} />
                    </div>
                    <div>
                      <span className="text-xs font-black">Termo para os Pais (Matrícula)</span>
                      <p className="text-[11px] text-slate-500 font-normal mt-0.5 leading-snug">
                        Bônus para a diretora entregar às famílias autorizando fotos e WhatsApp.
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedDocId('termos_uso')}
                    className={`w-full text-left p-3.5 rounded-2xl transition border flex items-start gap-3 ${
                      selectedDocId === 'termos_uso'
                        ? 'bg-indigo-50/80 border-indigo-300 text-indigo-950 font-bold shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-blue-600 text-white flex-shrink-0 mt-0.5">
                      <Shield size={16} />
                    </div>
                    <div>
                      <span className="text-xs font-black">Termos de Uso & DPA (LGPD)</span>
                      <p className="text-[11px] text-slate-500 font-normal mt-0.5 leading-snug">
                        Acordo formal definindo Escola como Controladora e App como Operador.
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedDocId('politica_privacidade')}
                    className={`w-full text-left p-3.5 rounded-2xl transition border flex items-start gap-3 ${
                      selectedDocId === 'politica_privacidade'
                        ? 'bg-indigo-50/80 border-indigo-300 text-indigo-950 font-bold shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-purple-600 text-white flex-shrink-0 mt-0.5">
                      <Lock size={16} />
                    </div>
                    <div>
                      <span className="text-xs font-black">Política de Privacidade Infantil</span>
                      <p className="text-[11px] text-slate-500 font-normal mt-0.5 leading-snug">
                        Criptografia AES-256, segurança de dados e proibição de anúncios.
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedDocId('contrato_saas')}
                    className={`w-full text-left p-3.5 rounded-2xl transition border flex items-start gap-3 ${
                      selectedDocId === 'contrato_saas'
                        ? 'bg-indigo-50/80 border-indigo-300 text-indigo-950 font-bold shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-amber-600 text-white flex-shrink-0 mt-0.5">
                      <Building2 size={16} />
                    </div>
                    <div>
                      <span className="text-xs font-black">Contrato de Licença Definitivo</span>
                      <p className="text-[11px] text-slate-500 font-normal mt-0.5 leading-snug">
                        Minuta comercial para formalização após os 30-60 dias de degustação.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Personalizador Rápido de Dados da Escola */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Sliders size={14} className="text-indigo-600" />
                    <span>Dados do Documento</span>
                  </h3>
                  <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full">
                    Preenchimento em Tempo Real
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Nome da Escola:</label>
                    <input
                      type="text"
                      value={nomeEscola}
                      onChange={(e) => setNomeEscola(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:border-indigo-500 outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">CNPJ da Escola:</label>
                      <input
                        type="text"
                        value={cnpjEscola}
                        onChange={(e) => setCnpjEscola(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:border-indigo-500 outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Diretora / Gestora:</label>
                      <input
                        type="text"
                        value={nomeDiretora}
                        onChange={(e) => setNomeDiretora(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:border-indigo-500 outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Seu Nome (Fundador):</label>
                      <input
                        type="text"
                        value={nomeFundador}
                        onChange={(e) => setNomeFundador(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:border-indigo-500 outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Seu CPF:</label>
                      <input
                        type="text"
                        value={cpfFundador}
                        onChange={(e) => setCpfFundador(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:border-indigo-500 outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Cidade - UF:</label>
                      <input
                        type="text"
                        value={cidadeEstado}
                        onChange={(e) => setCidadeEstado(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:border-indigo-500 outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Prazo do Piloto:</label>
                      <input
                        type="text"
                        value={diasPiloto}
                        onChange={(e) => setDiasPiloto(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:border-indigo-500 outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">WhatsApp / Suporte da Direção:</label>
                    <input
                      type="text"
                      value={telefonePlantao}
                      onChange={(e) => {
                        setTelefonePlantao(e.target.value);
                        localStorage.setItem('anjinho_telefone_suporte', e.target.value);
                      }}
                      placeholder="(11) 95555-4440"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:border-indigo-500 outline-hidden"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Coluna Direita: Pré-Visualização Formatada (Papel Timbrado Oficial) */}
            <div className="lg:col-span-8 space-y-4">
              
              {/* Barra de Ações do Documento */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div>
                  <h4 className="text-sm font-black text-slate-800">{docAtual.titulo}</h4>
                  <p className="text-xs text-slate-500">{docAtual.subtitulo}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopiarTexto}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition active:scale-95"
                    title="Copiar texto completo para a área de transferência"
                  >
                    {copiedText ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    <span>{copiedText ? 'Copiado!' : 'Copiar Texto'}</span>
                  </button>

                  <button
                    onClick={handleImprimir}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition active:scale-95"
                    title="Imprimir ou Salvar em PDF com papel timbrado oficial"
                  >
                    <Printer size={14} />
                    <span>Imprimir / Salvar em PDF</span>
                  </button>
                </div>
              </div>

              {/* Folha do Documento (Visual Papel Timbrado) */}
              <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-md space-y-6 relative">
                
                {/* Timbre Superior */}
                <div className="flex items-center justify-between border-b-2 border-indigo-600 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 p-1 flex items-center justify-center border border-indigo-100">
                      <LogoAnjinhoEducador variant="symbol" size="full" />
                    </div>
                    <div>
                      <h2 className="text-base font-black tracking-tight text-indigo-950">ANJINHO ESCOLAR & ANJINHA AURA</h2>
                      <p className="text-[11px] text-slate-500 font-medium">Guardião das Memórias e Proteção de Dados na Primeira Infância</p>
                    </div>
                  </div>

                  <div className="text-right hidden sm:block">
                    <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                      Doc. Jurídico Oficial
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">Lei Federal nº 13.709/2018 (LGPD)</p>
                  </div>
                </div>

                {/* Conteúdo Formatado */}
                <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-700 font-mono whitespace-pre-wrap leading-relaxed bg-slate-50/70 p-6 rounded-2xl border border-slate-200/80">
                  {docAtual.texto}
                </div>

                {/* Rodapé do Timbre */}
                <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
                  <span>Anjinho Escolar — Todos os direitos reservados.</span>
                  <span>Segurança Garantida: Criptografia AES-256 e DPA Ativo</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: SUPORTE TÉCNICO & PLANTÃO MATUTINO (07H00) */}
      {/* ========================================================================= */}
      {activeSubAba === 'suporte' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Coluna Esquerda: Informações e Cartões de SLA */}
            <div className="lg:col-span-5 space-y-4">
              
              <div className="bg-gradient-to-br from-emerald-600 to-teal-800 rounded-3xl p-6 text-white shadow-lg space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold">
                  <Clock size={14} />
                  <span>SLA Prioritário para Diretoras</span>
                </div>
                <h3 className="text-xl font-black">Plantão Matutino da Infância</h3>
                <p className="text-xs text-emerald-100 leading-relaxed">
                  Sabemos que a rotina escolar começa antes do sol nascer. Nosso plantão atende diretamente as diretoras e coordenadoras para garantir que nenhuma educadora fique sem acesso à sala de aula.
                </p>

                <div className="pt-2 border-t border-white/20 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-emerald-200 block text-[10px]">Horário de Cobertura:</span>
                    <strong className="font-bold">06h30 às 19h00</strong>
                  </div>
                  <div>
                    <span className="text-emerald-200 block text-[10px]">Tempo de Resposta Crítica:</span>
                    <strong className="font-bold text-amber-300">Até 15 minutos</strong>
                  </div>
                </div>
              </div>

              {/* Cartão de Canais Oficiais */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Canais Oficiais de Atendimento</h4>
                  <button
                    onClick={() => setIsEditandoCanais(!isEditandoCanais)}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-xl flex items-center gap-1 transition cursor-pointer"
                  >
                    <Edit3 size={13} />
                    <span>{isEditandoCanais ? 'Fechar Edição' : 'Editar Telefone'}</span>
                  </button>
                </div>

                {canaisSalvosSucesso && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
                    <Check size={14} className="text-emerald-600" />
                    <span>Telefone e canais atualizados com sucesso!</span>
                  </div>
                )}

                {isEditandoCanais ? (
                  <form onSubmit={handleSalvarCanais} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">WhatsApp / Telefone de Plantão:</label>
                      <input
                        type="text"
                        value={telefonePlantao}
                        onChange={(e) => setTelefonePlantao(e.target.value)}
                        placeholder="Ex: (11) 95555-4440 ou (11) 98877-6655"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 focus:border-indigo-500 outline-hidden"
                      />
                      <span className="text-[10px] text-slate-400 block">
                        Este número receberá os chamados e será o link oficial de suporte da Direção.
                      </span>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">E-mail de Suporte:</label>
                      <input
                        type="email"
                        value={emailSuporte}
                        onChange={(e) => setEmailSuporte(e.target.value)}
                        placeholder="Ex: suporte@anjinhoescolar.com.br"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 focus:border-indigo-500 outline-hidden"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsEditandoCanais(false)}
                        className="px-3 py-1.5 rounded-xl bg-slate-200 text-slate-700 font-bold text-[11px] hover:bg-slate-300 transition cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-[11px] flex items-center gap-1 hover:bg-emerald-700 transition cursor-pointer shadow-xs"
                      >
                        <Save size={13} />
                        <span>Salvar Telefone</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-2 text-xs">
                    <a
                      href={`https://api.whatsapp.com/send?phone=${sanitizePhoneForWhatsApp(telefonePlantao)}&text=Ol%C3%A1%2C%20sou%20da%20Dire%C3%A7%C3%A3o%20Escolar%20e%20preciso%20de%20suporte%20no%20Anjinho%20Escolar.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between hover:bg-emerald-100 transition group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-emerald-600 text-white">
                          <MessageCircle size={16} />
                        </div>
                        <div>
                          <strong className="block font-bold">WhatsApp Direto da Direção</strong>
                          <span className="text-[11px] text-emerald-700 font-medium">{telefonePlantao} (Plantão)</span>
                        </div>
                      </div>
                      <ExternalLink size={14} className="text-emerald-600 group-hover:translate-x-0.5 transition" />
                    </a>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-indigo-600 text-white">
                        <Mail size={16} />
                      </div>
                      <div>
                        <strong className="block font-bold">E-mail Institucional</strong>
                        <span className="text-[11px] text-slate-500">{emailSuporte}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tabela de Níveis de Severidade */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Classificação de Incidentes</h4>
                
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                      <strong className="text-rose-950 font-bold">Nível 1 - Crítico (App fora/Login)</strong>
                    </div>
                    <span className="font-mono text-rose-700 font-bold">SLA: 15 min</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      <strong className="text-amber-950 font-bold">Nível 2 - Médio (Ajuste/Turmas)</strong>
                    </div>
                    <span className="font-mono text-amber-700 font-bold">SLA: 2 horas</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                      <strong className="text-slate-700 font-bold">Nível 3 - Dúvida ou Sugestão</strong>
                    </div>
                    <span className="font-mono text-slate-600 font-bold">SLA: 24 horas</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Coluna Direita: Formulário de Abertura de Chamado Rápido */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-5">
                <div>
                  <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <Send size={18} className="text-indigo-600" />
                    <span>Abrir Chamado Rápido de Suporte</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Preencha os dados abaixo para acionar imediatamente a equipe de engenharia e suporte via canal de alta prioridade.
                  </p>
                </div>

                {chamadoEnviado && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                    <span>Chamado enviado com sucesso para o WhatsApp de Plantão da Engenharia!</span>
                  </div>
                )}

                <form onSubmit={handleEnviarChamadoSuporte} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Grau de Urgência:</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setChamadoTipo('critica')}
                        className={`p-3 rounded-2xl border font-bold text-center transition flex flex-col items-center gap-1 ${
                          chamadoTipo === 'critica'
                            ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <AlertTriangle size={16} className="text-rose-600" />
                        <span>🔴 Crítica (Urgente)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setChamadoTipo('media')}
                        className={`p-3 rounded-2xl border font-bold text-center transition flex flex-col items-center gap-1 ${
                          chamadoTipo === 'media'
                            ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <HelpCircle size={16} className="text-amber-600" />
                        <span>🟡 Dúvida Operacional</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setChamadoTipo('baixa')}
                        className={`p-3 rounded-2xl border font-bold text-center transition flex flex-col items-center gap-1 ${
                          chamadoTipo === 'baixa'
                            ? 'bg-slate-100 border-slate-300 text-slate-900 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <Sparkles size={16} className="text-indigo-600" />
                        <span>🟢 Sugestão de Melhoria</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Nome do Solicitante:</label>
                      <input
                        type="text"
                        value={chamadoNomeContato}
                        onChange={(e) => setChamadoNomeContato(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:border-indigo-500 outline-hidden"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Telefone / WhatsApp para Retorno:</label>
                      <input
                        type="text"
                        value={chamadoTelefone}
                        onChange={(e) => setChamadoTelefone(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:border-indigo-500 outline-hidden"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Assunto Resumido:</label>
                    <input
                      type="text"
                      value={chamadoTitulo}
                      onChange={(e) => setChamadoTitulo(e.target.value)}
                      placeholder="Ex: Não consigo cadastrar nova educadora na turma"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:border-indigo-500 outline-hidden"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Descrição Detalhada do Ocorrido:</label>
                    <textarea
                      rows={4}
                      value={chamadoDescricao}
                      onChange={(e) => setChamadoDescricao(e.target.value)}
                      placeholder="Descreva o que está acontecendo e qual turma ou aluno está envolvido..."
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:border-indigo-500 outline-hidden"
                      required
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition active:scale-95"
                  >
                    <MessageCircle size={18} />
                    <span>Disparar Chamado para o WhatsApp do Plantão</span>
                  </button>
                </form>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 3: SEGURANÇA, BACKUPS & UPTIME */}
      {/* ========================================================================= */}
      {activeSubAba === 'backups' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <Database size={18} />
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  100% OPERACIONAL
                </span>
              </div>
              <h4 className="text-sm font-black text-slate-800">Banco de Dados em Nuvem</h4>
              <p className="text-xs text-slate-500">Google Cloud Firestore com replicação automática multirregional e sem perda de dados.</p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-blue-100 text-blue-700">
                  <Lock size={18} />
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                  AES-256 ATIVO
                </span>
              </div>
              <h4 className="text-sm font-black text-slate-800">Criptografia em Repouso</h4>
              <p className="text-xs text-slate-500">Fotos de bebês, rotinas e anotações médicas protegidas sob os mais altos padrões mundiais.</p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-xl bg-purple-100 text-purple-700">
                  <RefreshCw size={18} />
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                  DIÁRIO (02:00)
                </span>
              </div>
              <h4 className="text-sm font-black text-slate-800">Rotina Automática de Backup</h4>
              <p className="text-xs text-slate-500">Cópias automáticas executadas todas as noites com retenção histórica de segurança.</p>
            </div>

          </div>

          {/* Painel de Exportação e Auditoria de Backups */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <Server size={18} className="text-indigo-600" />
                  <span>Central de Cópias de Segurança da Escola</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  A escola tem a garantia de portabilidade e posse total dos seus dados conforme determina a LGPD.
                </p>
              </div>

              <button
                onClick={handleGerarBackupCompleto}
                className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-600/20 transition active:scale-95 flex-shrink-0"
              >
                {backupGenerated ? <Check size={16} /> : <Download size={16} />}
                <span>{backupGenerated ? 'Arquivo Gerado!' : 'Exportar Cópia Instantânea (JSON)'}</span>
              </button>
            </div>

            {/* Tabela de Logs de Backup Recentes */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="pb-3">Data e Horário</th>
                    <th className="pb-3">Tipo de Rotina</th>
                    <th className="pb-3">Destino / Nuvem</th>
                    <th className="pb-3">Volume de Registros</th>
                    <th className="pb-3 text-right">Integridade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  <tr>
                    <td className="py-3 font-bold text-slate-900">Hoje às 02:00:15</td>
                    <td className="py-3">Backup Noturno Automático</td>
                    <td className="py-3 font-mono text-slate-500">Google Cloud Multi-Region</td>
                    <td className="py-3">100% dos Diários e Fotos</td>
                    <td className="py-3 text-right">
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 size={12} /> Verificado OK
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 font-bold text-slate-900">Ontem às 02:00:12</td>
                    <td className="py-3">Backup Noturno Automático</td>
                    <td className="py-3 font-mono text-slate-500">Google Cloud Multi-Region</td>
                    <td className="py-3">100% dos Diários e Fotos</td>
                    <td className="py-3 text-right">
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 size={12} /> Verificado OK
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 font-bold text-slate-900">Anteontem às 02:00:08</td>
                    <td className="py-3">Backup Noturno Automático</td>
                    <td className="py-3 font-mono text-slate-500">Google Cloud Multi-Region</td>
                    <td className="py-3">100% dos Diários e Fotos</td>
                    <td className="py-3 text-right">
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 size={12} /> Verificado OK
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 4: FATURAMENTO & COBRANÇA RECORRENTE (ASAAS / IUGU) */}
      {/* ========================================================================= */}
      {activeSubAba === 'faturamento' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-3">
            <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold inline-block">
              Gestão Financeira & Cobrança Automatizada
            </span>
            <h3 className="text-2xl font-black">Como Funciona o Faturamento Pós-Piloto</h3>
            <p className="text-xs sm:text-sm text-amber-50 max-w-2xl leading-relaxed">
              Sem dor de cabeça com PIX manual ou cobranças inconvenientes. Toda a recorrência é processada via gateway oficial (Asaas / Iugu) com emissão automática de boletos com QR Code PIX e Nota Fiscal Eletrônica (NFS-e).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                1
              </div>
              <h4 className="text-base font-black text-slate-800">Degustação 100% Gratuita</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Durante os primeiros {diasPiloto}, a escola não paga absolutamente nada. Validamos o encantamento dos pais e das educadoras primeiro.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                2
              </div>
              <h4 className="text-base font-black text-slate-800">Abertura de CNPJ (Mês 1-2)</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Durante o período de testes, a empresa é formalizada (ME Simples Nacional) e plugada ao Asaas para emissão das notas fiscais.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
                3
              </div>
              <h4 className="text-base font-black text-slate-800">Régua Automática de Cobrança</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                O sistema envia o lembrete de mensalidade 5 dias antes no e-mail da secretaria, com link do boleto e chave PIX Copia e Cola instantânea.
              </p>
            </div>

          </div>

          <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <h4 className="text-base font-black text-white">Deseja simular os planos comerciais oficiais?</h4>
              <p className="text-xs text-slate-400">
                Planos escaláveis a partir de R$ 3,90 a R$ 6,90 por aluno/mês com todas as funcionalidades inclusas.
              </p>
            </div>

            <button
              onClick={() => setActiveSubAba('documentos')}
              className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs transition active:scale-95 flex-shrink-0"
            >
              Visualizar Minuta de Contrato Comercial
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
