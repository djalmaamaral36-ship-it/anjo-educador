import React, { useState } from 'react';
import {
  QrCode,
  Printer,
  Share2,
  Copy,
  Check,
  Download,
  X,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Lock,
  Heart,
  School,
  Calendar,
  KeyRound,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { StudentPaxData } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  student: StudentPaxData;
  allStudents?: StudentPaxData[];
  onSelectStudent?: (studentId: string) => void;
}

export default function ModalQrCodeInstalacao({
  isOpen,
  onClose,
  student,
  allStudents = [],
  onSelectStudent,
}: Props) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [activeTab, setActiveTab] = useState<'individual' | 'lote'>('individual');
  const [showPinAlert, setShowPinAlert] = useState(false);

  if (!isOpen) return null;

  // Garante que o aluno tenha um PIN de 4 dígitos consistente
  const studentPin = student.pinAcesso || (
    student.id === 'mariana_souza' ? '4321' :
    student.id === 'enzo_alencar' ? '4440' :
    student.id === 'beatriz_castro' ? '3310' :
    '2026'
  );

  // URL de instalação e acesso direto da família para este aluno
  const baseUrl = window.location.origin;
  const directAccessUrl = `${baseUrl}/?alunoId=${student.id}&pin=${studentPin}&origem=qrcode_secretaria`;

  // URL para renderizar o QR Code real com a API segura
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(directAccessUrl)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(directAccessUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyPin = () => {
    navigator.clipboard.writeText(studentPin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `🌟 *Olá, ${student.responsavelNome}! Bem-vindos ao Anjinho Escolar.*\n\n` +
      `Para acompanhar a rotina escolar, fotos, alimentação e a Árvore da Infância® de *${student.nome}* no seu celular:\n\n` +
      `📲 *Link de Acesso Rápido:* ${directAccessUrl}\n` +
      `🔑 *Seu PIN de Segurança Familiar:* *${studentPin}*\n\n` +
      `_Ao abrir o link no seu celular, clique em "Adicionar à Tela Inicial" para instalar o aplicativo._`
    );
    const phone = student.responsavelTelefone.replace(/\D/g, '');
    window.open(`https://wa.me/55${phone}?text=${text}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex justify-center items-start p-2 sm:p-4 md:p-6 animate-fadeIn print:p-0 print:bg-white print:static">
      <div className="bg-white text-slate-800 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-indigo-100 my-auto flex flex-col max-h-[94vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Top Control Bar (Hidden on Print) */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 print:hidden flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition cursor-pointer"
              title="Fechar"
            >
              <X size={20} />
            </button>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <QrCode className="text-indigo-600" size={20} />
                <span>QR Code de Instalação & Acesso Familiar</span>
              </h2>
              <p className="text-xs text-slate-500 hidden sm:block">
                Vinculado diretamente à criança • Sem risco de misturar com outros alunos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {allStudents.length > 1 && (
              <div className="hidden md:flex items-center bg-slate-200/70 p-0.5 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setActiveTab('individual')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    activeTab === 'individual' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Cartão do Aluno
                </button>
                <button
                  onClick={() => setActiveTab('lote')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    activeTab === 'lote' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Imprimir Turma em Lote ({allStudents.length})
                </button>
              </div>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md transition cursor-pointer active:scale-95"
            >
              <Printer size={16} />
              <span>Imprimir Ficha</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-8 overflow-y-auto space-y-6 bg-slate-50/60 print:p-0 print:bg-white print:overflow-visible">
          
          {/* Instruções Rápidas para a Secretaria (Hidden on Print) */}
          <div className="bg-gradient-to-r from-amber-50 to-indigo-50 border border-amber-200/80 rounded-2xl p-4 print:hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-black flex-shrink-0 text-base shadow-xs">
                💡
              </span>
              <div>
                <strong className="text-slate-900 block font-black">
                  Como funciona para a Secretaria e para os Pais:
                </strong>
                <span className="text-slate-600">
                  1. O PIN já é gerado previamente pela escola. • 2. A mãe aponta a câmera para o QR Code. • 3. O celular abre direto na tela de {student.nome} e instala com 1 toque!
                </span>
              </div>
            </div>

            {/* Seletor de Alunos caso a secretária queira mudar rápido */}
            {allStudents.length > 0 && onSelectStudent && (
              <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 flex-shrink-0 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-500">Aluno:</span>
                <select
                  value={student.id}
                  onChange={(e) => onSelectStudent(e.target.value)}
                  className="text-xs font-black text-indigo-900 bg-transparent outline-none cursor-pointer"
                >
                  {allStudents.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.nome} ({st.turma})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* ======================================================= */}
          {/* MODO 1: CARTÃO INDIVIDUAL TIMBRADO (FICHA OFICIAL)     */}
          {/* ======================================================= */}
          {activeTab === 'individual' && (
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-sm print:shadow-none print:border-2 print:border-slate-800 space-y-6 max-w-2xl mx-auto relative overflow-hidden">
              
              {/* Marca d'água de fundo */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50/50 rounded-full blur-2xl pointer-events-none" />

              {/* Cabeçalho Oficial do Colégio */}
              <div className="text-center border-b border-slate-100 pb-5 space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-900 text-[11px] font-black uppercase tracking-wider">
                  <School size={13} className="text-indigo-600" />
                  <span>COLÉGIO PEQUENO ANJO • SECRETARIA ESCOLAR</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 pt-1">
                  Cartão de Boas-Vindas & Acesso Familiar
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Guardião das Memórias • Acesso exclusivo dos responsáveis
                </p>
              </div>

              {/* Identificação do Aluno */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 flex items-center gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-white border-2 border-indigo-200 shadow-xs flex-shrink-0">
                  <img
                    src={student.fotoUrl}
                    alt={student.nome}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base sm:text-lg text-slate-900 truncate">
                      {student.nome}
                    </h3>
                    <span className="text-[10px] font-black uppercase bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md">
                      {student.codigoAl || 'AL-01'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    <strong>Turma:</strong> {student.turma} • <strong>Professora:</strong> {student.professoraTitular}
                  </p>
                  <p className="text-xs text-slate-500">
                    <strong>Responsável:</strong> {student.responsavelNome} ({student.responsavelParentesco}) • {student.responsavelTelefone}
                  </p>
                </div>
              </div>

              {/* Bloco Central: QR Code + Chave PIN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center py-2">
                
                {/* QR Code Container */}
                <div className="flex flex-col items-center justify-center p-5 bg-gradient-to-b from-indigo-50/50 to-white rounded-2xl border-2 border-dashed border-indigo-300 text-center">
                  <div className="w-44 h-44 bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center">
                    <img
                      src={qrCodeUrl}
                      alt={`QR Code para ${student.nome}`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="text-[11px] font-black text-indigo-900 uppercase tracking-wider mt-3 flex items-center gap-1">
                    <Smartphone size={13} /> Aponte a câmera do celular
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5">
                    Instalação automática sem precisar de loja de apps
                  </span>
                </div>

                {/* Caixa do PIN de Segurança e Instruções */}
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/80 space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block flex items-center gap-1.5">
                      <KeyRound size={13} className="text-amber-600" />
                      PIN Familiar de 4 Dígitos (Definido na Matrícula)
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-mono font-black text-amber-950 tracking-widest bg-white px-4 py-2 rounded-xl border border-amber-200 shadow-2xs">
                        {studentPin}
                      </span>
                      <button
                        onClick={handleCopyPin}
                        className="p-2.5 rounded-xl bg-white hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition print:hidden cursor-pointer"
                        title="Copiar PIN"
                      >
                        {copiedPin ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                      </button>
                    </div>
                    <p className="text-[11px] text-amber-900/80 leading-relaxed font-medium">
                      Este PIN protege as fotos e o diário de {student.nome}, garantindo total conformidade com a LGPD.
                    </p>
                  </div>

                  {/* Passo a Passo para os Pais */}
                  <div className="space-y-2 text-xs text-slate-600">
                    <strong className="text-slate-800 block font-bold">
                      Passo a Passo para Instalar:
                    </strong>
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 font-black flex items-center justify-center flex-shrink-0 text-[11px]">
                        1
                      </span>
                      <span>Aponte a câmera do celular para o QR Code ao lado.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 font-black flex items-center justify-center flex-shrink-0 text-[11px]">
                        2
                      </span>
                      <span>Digite o seu PIN de segurança: <strong>{studentPin}</strong>.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 font-black flex items-center justify-center flex-shrink-0 text-[11px]">
                        3
                      </span>
                      <span>Toque em <em>"Adicionar à Tela Inicial"</em> no navegador.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rodapé do Cartão (Autenticação do Colégio) */}
              <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                <div className="flex items-center gap-1.5 font-medium text-emerald-700">
                  <ShieldCheck size={16} />
                  <span>Acesso individual e criptografado • Conexão segura escola-família</span>
                </div>
                <div className="font-bold text-slate-700">
                  Anjinho Escolar & Anjinha Aura
                </div>
              </div>

              {/* Botões de Ação Rápida (Ocultos na Impressão) */}
              <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-end gap-2.5 print:hidden">
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedLink ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link de Acesso'}</span>
                </button>

                <button
                  onClick={handleShareWhatsApp}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Share2 size={14} />
                  <span>Enviar Convite pelo WhatsApp</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Printer size={14} />
                  <span>Imprimir Cartão</span>
                </button>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* MODO 2: IMPRESSÃO EM LOTE DA TURMA (SECRETARIA)         */}
          {/* ======================================================= */}
          {activeTab === 'lote' && (
            <div className="space-y-6">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between print:hidden">
                <div>
                  <strong className="text-slate-900 block">
                    Caderno de Cartões da Turma: {student.turma}
                  </strong>
                  <span>
                    Pronto para imprimir e recortar na secretaria escolar para entrega aos pais na matrícula.
                  </span>
                </div>
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 flex items-center gap-1.5"
                >
                  <Printer size={14} />
                  <span>Imprimir Todos ({allStudents.length})</span>
                </button>
              </div>

              {/* Grid de Crachás para Recortar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-3">
                {allStudents.map((st) => {
                  const pin = st.pinAcesso || (
                    st.id === 'mariana_souza' ? '4321' :
                    st.id === 'enzo_alencar' ? '4440' :
                    st.id === 'beatriz_castro' ? '3310' :
                    '2026'
                  );
                  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=6&data=${encodeURIComponent(`${baseUrl}/?alunoId=${st.id}&pin=${pin}`)}`;

                  return (
                    <div
                      key={st.id}
                      className="bg-white p-4 rounded-2xl border-2 border-dashed border-slate-300 print:border-slate-800 print:rounded-none flex items-center gap-4 text-xs relative page-break-inside-avoid"
                    >
                      {/* QR Code */}
                      <div className="w-28 h-28 bg-slate-50 p-1.5 rounded-xl border border-slate-200 flex-shrink-0 flex items-center justify-center">
                        <img src={qr} alt={st.nome} className="w-full h-full object-contain" />
                      </div>

                      {/* Dados da Criança */}
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <span className="text-[9px] font-black uppercase bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded border border-indigo-100">
                          {st.turma}
                        </span>
                        <h4 className="font-black text-slate-900 text-sm truncate">
                          {st.nome}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate">
                          Resp: {st.responsavelNome}
                        </p>
                        <div className="flex items-center gap-1.5 pt-1">
                          <span className="text-[10px] font-bold text-slate-500">PIN:</span>
                          <span className="font-mono font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded text-xs">
                            {pin}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
