import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  FileText,
  AlertTriangle,
  Smartphone,
  HeartPulse,
  Camera,
  UserCheck,
  X,
  FileCheck,
  ChevronRight,
  Info,
} from 'lucide-react';
import { StudentPaxData, LgpdConsentimento } from '../../types';
import { salvarLgpdConsentimento, gerarHashIntegridade } from '../../services/lgpdService';
import CampoFotoUpload from '../comum/CampoFotoUpload';
import CampoTextoVoz from '../comum/CampoTextoVoz';
import LogoAnjinhoEducador from '../comum/LogoAnjinhoEducador';

interface Props {
  isOpen: boolean;
  onClose?: () => void;
  student: StudentPaxData;
  isObrigatorio?: boolean; // Se for o primeiro acesso, não permite fechar sem assinar
  onConsentimentoConcluido: (consentimento: LgpdConsentimento) => void;
}

export default function ModalConsentimentoLgpdInicial({
  isOpen,
  onClose,
  student,
  isObrigatorio = false,
  onConsentimentoConcluido,
}: Props) {
  if (!isOpen) return null;

  const [nomeResponsavel, setNomeResponsavel] = useState(student.responsavelNome || '');
  const [cpfResponsavel, setCpfResponsavel] = useState('342.581.908-09');
  const [grauParentesco, setGrauParentesco] = useState<'Mae' | 'Pai' | 'Responsavel_Legal' | 'Outro'>('Mae');
  const [telefoneWhatsApp, setTelefoneWhatsApp] = useState(student.responsavelTelefone || '(11) 98765-4321');
  const [emailResponsavel, setEmailResponsavel] = useState('contato.familia@email.com');
  const [fotoResponsavel, setFotoResponsavel] = useState<string>(
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
  );

  // 4 Cláusulas de Consentimento
  const [dadosMenor, setDadosMenor] = useState(true);
  const [whatsappERotina, setWhatsappERotina] = useState(true);
  const [saudeMedicamentos, setSaudeMedicamentos] = useState(true);
  const [fotosPedagogicas, setFotosPedagogicas] = useState(true);

  const [aceiteGeral, setAceiteGeral] = useState(false);
  const [erroValidacao, setErroValidacao] = useState<string | null>(null);
  const [assinadoSucesso, setAssinadoSucesso] = useState(false);

  const handleAssinar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeResponsavel.trim()) {
      setErroValidacao('Por favor, informe o Nome Completo do Responsável.');
      return;
    }
    if (!cpfResponsavel.trim() || cpfResponsavel.length < 11) {
      setErroValidacao('Por favor, informe um CPF válido para registro jurídico.');
      return;
    }
    if (!aceiteGeral) {
      setErroValidacao('É obrigatório marcar a confirmação de ciência e veracidade das informações.');
      return;
    }
    if (!dadosMenor) {
      setErroValidacao('O consentimento para tratamento de dados pedagógicos da criança (Art. 14 da LGPD) é fundamental para o uso do diário escolar.');
      return;
    }

    const agora = new Date();
    const dataIso = agora.toISOString();
    const dataFormatada = `${agora.toLocaleDateString('pt-BR')} às ${agora.toLocaleTimeString('pt-BR')}`;
    const hash = gerarHashIntegridade(`${nomeResponsavel}_${cpfResponsavel}_${student.id}`, dataIso);

    const novoConsentimento: LgpdConsentimento = {
      id: `lgpd_${student.id}_${Date.now()}`,
      studentId: student.id,
      studentNome: student.nome,
      turma: student.turma,
      responsavelNome: nomeResponsavel,
      responsavelCpf: cpfResponsavel,
      responsavelGrau: grauParentesco,
      responsavelTelefone: telefoneWhatsApp,
      responsavelEmail: emailResponsavel,
      aceitoEm: dataIso,
      aceitoEmFormatado: dataFormatada,
      versaoTermo: '1.0/2026 - Educação Infantil',
      ipOrigem: 'Acesso Seguro SSL (Portal das Famílias)',
      dispositivoInfo: `${navigator.userAgent.includes('Mobile') ? 'Dispositivo Móvel' : 'Navegador Web / Desktop'} - WhatsApp Validado`,
      hashAssinaturaDigital: hash,
      status: 'ativo',
      autorizacoes: {
        tratamentoDadosMenor: dadosMenor,
        comunicacaoWhatsAppERotina: whatsappERotina,
        registroSaudeEMedicamentos: saudeMedicamentos,
        registroFotograficoPedagogico: fotosPedagogicas,
      },
      observacoes: 'Termo de Consentimento Eletrônico assinado na entrada do aplicativo.',
    };

    salvarLgpdConsentimento(novoConsentimento);
    setAssinadoSucesso(true);

    setTimeout(() => {
      onConsentimentoConcluido(novoConsentimento);
      if (onClose) onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full my-auto shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* CABEÇALHO JURÍDICO LGPD */}
        <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white p-6 relative">
          {!isObrigatorio && onClose && (
            <button
              onClick={onClose}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition cursor-pointer"
            >
              <X size={20} />
            </button>
          )}

          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-white p-0.5 flex items-center justify-center shadow-lg flex-shrink-0 overflow-hidden">
              <LogoAnjinhoEducador variant="symbol" size="full" className="w-full h-full" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-amber-950">
                  <ShieldCheck size={12} />
                  <span>LEI FEDERAL Nº 13.709/2018 — ART. 14</span>
                </div>
                <span className="text-[10px] text-teal-200 font-bold">
                  Anjinho Escolar Oficial
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                Termo de Consentimento LGPD & Autorizações Legais
              </h2>
              <p className="text-xs text-indigo-200 font-medium">
                Proteção e Segurança de Dados da Criança: <strong className="text-amber-300">{student.nome}</strong> ({student.turma})
              </p>
            </div>
          </div>
        </div>

        {assinadoSucesso ? (
          <div className="p-10 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm animate-bounce">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-xl font-black text-slate-800">Termo Assinado com Sucesso!</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              As autorizações foram registradas no Livro de Auditoria Digital da Escola com carimbo de integridade e validade jurídica. Liberando acesso ao aplicativo...
            </p>
          </div>
        ) : (
          <form onSubmit={handleAssinar} className="p-6 sm:p-7 space-y-5 max-h-[80vh] overflow-y-auto">
            {/* NOTA INTRODUTÓRIA */}
            <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-2xl flex items-start gap-3 text-xs text-indigo-950">
              <Info size={20} className="text-indigo-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong className="block text-indigo-900 font-black">
                  Transparência e Respaldo Jurídico para a Escola e a Família
                </strong>
                <p className="text-indigo-800 leading-relaxed">
                  Para garantir a segurança jurídica da instituição e cumprir o <strong>Art. 14 da LGPD</strong> (Tratamento de dados pessoais de crianças no seu melhor interesse), solicitamos a confirmação expressa das autorizações abaixo.
                </p>
              </div>
            </div>

            {/* AS 4 CLÁUSULAS ESPECÍFICAS DA LGPD */}
            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase text-slate-600 block tracking-wider">
                Autorizações Específicas de Tratamento de Dados:
              </label>

              {/* 1. Tratamento de Dados do Menor */}
              <label className="flex items-start gap-3 p-3.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={dadosMenor}
                  onChange={(e) => setDadosMenor(e.target.checked)}
                  className="w-4 h-4 mt-1 text-indigo-600 rounded accent-indigo-600 cursor-pointer"
                />
                <div className="flex-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-800">1. Acompanhamento Pedagógico & Diário de Bordo (Art. 14 LGPD)</span>
                    <span className="text-[9px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.5 rounded">Obrigatório</span>
                  </div>
                  <p className="text-slate-500 mt-0.5 leading-relaxed">
                    Autorizo o registro de rotina escolar, presenças, horários, alimentação, sono e marcos pedagógicos da criança para fins exclusivos de cuidado e acompanhamento educacional.
                  </p>
                </div>
              </label>

              {/* 2. WhatsApp & Notificações */}
              <label className="flex items-start gap-3 p-3.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={whatsappERotina}
                  onChange={(e) => setWhatsappERotina(e.target.checked)}
                  className="w-4 h-4 mt-1 text-emerald-600 rounded accent-emerald-600 cursor-pointer"
                />
                <div className="flex-1 text-xs">
                  <div className="flex items-center gap-2">
                    <Smartphone size={14} className="text-emerald-600" />
                    <span className="font-black text-slate-800">2. Comunicação Direta & Disparos de WhatsApp</span>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">Recomendado</span>
                  </div>
                  <p className="text-slate-500 mt-0.5 leading-relaxed">
                    Autorizo a escola a enviar relatórios diários de rotina, comunicados urgentes, recados e avisos pedagógicos no número de WhatsApp informado pelos responsáveis.
                  </p>
                </div>
              </label>

              {/* 3. Saúde & Medicamentos */}
              <label className="flex items-start gap-3 p-3.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={saudeMedicamentos}
                  onChange={(e) => setSaudeMedicamentos(e.target.checked)}
                  className="w-4 h-4 mt-1 text-rose-600 rounded accent-rose-600 cursor-pointer"
                />
                <div className="flex-1 text-xs">
                  <div className="flex items-center gap-2">
                    <HeartPulse size={14} className="text-rose-600" />
                    <span className="font-black text-slate-800">3. Dados Sensíveis de Saúde & Medicamentos (Art. 11 LGPD)</span>
                    <span className="text-[9px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.5 rounded">Saúde do Menor</span>
                  </div>
                  <p className="text-slate-500 mt-0.5 leading-relaxed">
                    Autorizo o registro de temperatura, histórico de alergias, fraldas e a ministração de medicamentos sob receita médica cadastrada e validada via PIN pelos pais.
                  </p>
                </div>
              </label>

              {/* 4. Registros Fotográficos Pedagógicos */}
              <label className="flex items-start gap-3 p-3.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={fotosPedagogicas}
                  onChange={(e) => setFotosPedagogicas(e.target.checked)}
                  className="w-4 h-4 mt-1 text-purple-600 rounded accent-purple-600 cursor-pointer"
                />
                <div className="flex-1 text-xs">
                  <div className="flex items-center gap-2">
                    <Camera size={14} className="text-purple-600" />
                    <span className="font-black text-slate-800">4. Registro Fotográfico Estritamente Pedagógico</span>
                    <span className="text-[9px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded">Ambiente Fechado</span>
                  </div>
                  <p className="text-slate-500 mt-0.5 leading-relaxed">
                    Autorizo fotos de atividades artísticas e marcos do desenvolvimento para visualização restrita dos pais dentro do aplicativo, sem veiculação em redes sociais públicas sem anuência prévia.
                  </p>
                </div>
              </label>
            </div>

            {/* DADOS DE IDENTIFICAÇÃO DO RESPONSÁVEL LEGAL */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <label className="text-[11px] font-black uppercase text-slate-600 block tracking-wider">
                Identificação do Responsável Legal (Assinante):
              </label>

              {/* Upload de Foto do Responsável para respaldo e identificação facial */}
              <CampoFotoUpload
                fotoUrl={fotoResponsavel}
                onFotoChange={setFotoResponsavel}
                label="Foto do Responsável Legal (Identificação e Respaldo)"
                tipoPerfil="familia"
                tamanho="sm"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <CampoTextoVoz
                  label="Nome Completo *"
                  value={nomeResponsavel}
                  onChange={setNomeResponsavel}
                  placeholder="Nome completo do pai, mãe ou tutor"
                  required
                />

                <CampoTextoVoz
                  label="CPF do Responsável *"
                  value={cpfResponsavel}
                  onChange={setCpfResponsavel}
                  placeholder="000.000.000-00"
                  required
                />

                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">
                    Grau de Parentesco / Vínculo:
                  </label>
                  <select
                    value={grauParentesco}
                    onChange={(e: any) => setGrauParentesco(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:bg-white font-medium"
                  >
                    <option value="Mae">Mãe</option>
                    <option value="Pai">Pai</option>
                    <option value="Responsavel_Legal">Responsável Legal / Guardião</option>
                    <option value="Outro">Outro Responsável</option>
                  </select>
                </div>

                <CampoTextoVoz
                  label="Telefone WhatsApp *"
                  value={telefoneWhatsApp}
                  onChange={setTelefoneWhatsApp}
                  placeholder="(11) 99999-9999"
                  type="tel"
                  required
                />
              </div>
            </div>

            {/* CHECKBOX GERAL DE VERACIDADE */}
            <label className="flex items-start gap-2.5 p-3.5 bg-amber-50/70 border border-amber-300/80 rounded-2xl cursor-pointer hover:bg-amber-50 transition">
              <input
                type="checkbox"
                required
                checked={aceiteGeral}
                onChange={(e) => setAceiteGeral(e.target.checked)}
                className="w-4 h-4 mt-0.5 text-amber-600 rounded accent-amber-600 cursor-pointer"
              />
              <div className="flex-1 text-xs text-amber-950 leading-tight">
                <span className="font-black block mb-0.5">
                  Declaro que sou responsável legal pela criança e aceito os termos
                </span>
                <span className="text-[11px] text-amber-800">
                  Ao assinar eletronicamente, confirmo que li e concordo com o tratamento de dados conforme a LGPD (Lei 13.709/18).
                </span>
              </div>
            </label>

            {erroValidacao && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle size={16} className="text-rose-600 flex-shrink-0" />
                <span>{erroValidacao}</span>
              </div>
            )}

            {/* BOTÕES DO FORMULÁRIO */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              {!isObrigatorio && onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
              )}

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 bg-indigo-700 hover:bg-indigo-800 active:scale-98 text-white text-xs font-black rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock size={15} />
                <span>🔒 Assinar Digitalmente e Confirmar Termos LGPD</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
