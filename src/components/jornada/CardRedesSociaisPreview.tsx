import React, { useState, useRef } from 'react';
import { Share2, Download, Copy, Check, ShieldCheck, Heart, Sparkles, MessageCircle, EyeOff, Eye } from 'lucide-react';
import LogoAnjinhoEducador from '../comum/LogoAnjinhoEducador';

export interface CardRedesSociaisProps {
  titulo: string;
  descricao: string;
  data: string;
  studentName: string;
  fotoUrl?: string;
  selectedBncc: string[];
  ocultarFotoCrianca: boolean;
  onToggleOcultarFoto: (val: boolean) => void;
  mensagemAfeto: string;
  onChangeMensagemAfeto: (val: string) => void;
}

export const MENSAGENS_AFETO_PRESET = [
  '🌱 "Cultivando memórias com carinho, respeito e proteção. Cada passo na primeira infância é uma semente de amor que floresce para a vida toda."',
  '✨ "Brincar, aprender e florescer com segurança no coração. Aqui, o desenvolvimento infantil é celebrado com afeto e encantamento diário."',
  '💛 "Pequenas mãos, grandes descobertas! Hoje escrevemos mais uma linda página repleta de carinho, autonomia e amizade."',
  '🕊️ "Preservar a infância é o nosso maior legado. Momentos que acolhem o crescimento e cuidam com zelo da história de cada anjinho."',
];

export default function CardRedesSociaisPreview({
  titulo,
  descricao,
  data,
  studentName,
  fotoUrl,
  selectedBncc,
  ocultarFotoCrianca,
  onToggleOcultarFoto,
  mensagemAfeto,
  onChangeMensagemAfeto,
}: CardRedesSociaisProps) {
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Geração de Legenda Pronta para Redes
  const gerarLegenda = () => {
    const hashtags = '#EducacaoInfantil #PrimeiraInfancia #AnjinhoEscolar #CuidarEEducar #DesenvolvimentoInfantil #AmorPelaInfancia #RotinaEscolar';
    const tagBnccStr = selectedBncc.length > 0 ? `\n🎯 Campos de Experiência (BNCC): ${selectedBncc.join(', ')}` : '';
    
    if (ocultarFotoCrianca) {
      return `✨ MOMENTO ESPECIAL NA EDUCAÇÃO INFANTIL ✨\n\n${mensagemAfeto}\n\n📖 Atividade: "${titulo || 'Vivência Pedagógica'}"\n📅 Data: ${data || 'Hoje'}${tagBnccStr}\n\n🛡️ Nota de Privacidade & LGPD: Preservamos com respeito a imagem de nossos alunos. As memórias completas e registros fotográficos detalhados ficam disponíveis com segurança exclusiva aos pais na agenda Anjinho Escolar.\n\n${hashtags}`;
    }

    return `✨ MOMENTO INESQUECÍVEL NA ESCOLA ✨\n\n"${titulo || 'Atividade Especial'}"\n\n${descricao || 'Uma linda vivência de aprendizado, alegria e socialização em nossa turma.'}${tagBnccStr}\n\n💛 Aqui cada detalhe é cuidado e cada descoberta é celebrada com amor!\n\n${hashtags}`;
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(gerarLegenda());
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2500);
  };

  // Gerar e Baixar Imagem 1080x1080 via HTML5 Canvas
  const handleDownloadCard = async () => {
    setIsDownloading(true);
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const size = 1080;
      canvas.width = size;
      canvas.height = size;

      // 1. Fundo Gradiente Acolhedor
      const bgGradient = ctx.createLinearGradient(0, 0, size, size);
      if (ocultarFotoCrianca) {
        bgGradient.addColorStop(0, '#FFFBF0');
        bgGradient.addColorStop(0.5, '#FDF6E2');
        bgGradient.addColorStop(1, '#F0F9F8');
      } else {
        bgGradient.addColorStop(0, '#FFFFFF');
        bgGradient.addColorStop(1, '#F8FAFC');
      }
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, size, size);

      // 2. Borda Decorativa Dupla (Estilo Moldura de Certificado/Memória)
      ctx.strokeStyle = '#D8B24C';
      ctx.lineWidth = 14;
      ctx.strokeRect(30, 30, size - 60, size - 60);

      ctx.strokeStyle = '#53C7C6';
      ctx.lineWidth = 4;
      ctx.strokeRect(48, 48, size - 96, size - 96);

      // 3. Topo: Header com Anjinho Escolar
      ctx.fillStyle = '#214E8A';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ANJINHO ESCOLAR', size / 2, 120);

      ctx.fillStyle = '#53C7C6';
      ctx.font = 'bold 18px sans-serif';
      ctx.letterSpacing = '2px';
      ctx.fillText('GUARDIÃO DAS MEMÓRIAS DA PRIMEIRA INFÂNCIA', size / 2, 155);

      // 4. Seção Central (Foto OU Mensagem Afetiva de Proteção)
      if (ocultarFotoCrianca || !fotoUrl) {
        // Caixa de Mensagem Poética
        ctx.fillStyle = '#FFFFFF';
        ctx.roundRect(90, 210, size - 180, 560, 32);
        ctx.fill();

        ctx.strokeStyle = '#E2E8F0';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Aspas Decorativas
        ctx.fillStyle = '#D8B24C';
        ctx.font = 'italic bold 90px serif';
        ctx.textAlign = 'center';
        ctx.fillText('“', size / 2, 290);

        // Mensagem de Afeto (Quebra de Linha Automática)
        ctx.fillStyle = '#1E293B';
        ctx.font = 'italic 500 32px sans-serif';
        const words = mensagemAfeto.split(' ');
        let line = '';
        let y = 370;
        const maxWidth = size - 280;

        for (let i = 0; i < words.length; i++) {
          const testLine = line + words[i] + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && i > 0) {
            ctx.fillText(line, size / 2, y);
            line = words[i] + ' ';
            y += 48;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, size / 2, y);

        // Aspas de Fechamento
        ctx.fillStyle = '#D8B24C';
        ctx.font = 'italic bold 80px serif';
        ctx.fillText('”', size / 2, y + 60);

        // Título da Atividade e BNCC
        ctx.fillStyle = '#214E8A';
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText(`✨ Atividade: ${titulo || 'Vivência Pedagógica'}`, size / 2, 690);

        // Selo de Proteção LGPD
        ctx.fillStyle = '#0D9488';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText('🛡️ IMAGEM DA CRIANÇA PRESERVADA • CONFORME LGPD', size / 2, 735);
      } else {
        // Desenha Foto da Criança (se carregada)
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve) => {
          img.onload = () => {
            ctx.save();
            ctx.roundRect(90, 210, size - 180, 560, 28);
            ctx.clip();
            ctx.drawImage(img, 90, 210, size - 180, 560);
            ctx.restore();

            // Overlay Suave com Título
            ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
            ctx.roundRect(110, 640, size - 220, 110, 20);
            ctx.fill();

            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 26px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(titulo || 'Momento Especial', size / 2, 685);

            ctx.fillStyle = '#D8B24C';
            ctx.font = 'bold 18px sans-serif';
            ctx.fillText(`📅 ${data} • ${selectedBncc.join(' • ')}`, size / 2, 720);
            resolve(true);
          };
          img.onerror = () => resolve(false);
          img.src = fotoUrl;
        });
      }

      // 5. Rodapé: Tagline Oficial do Brand Book
      ctx.fillStyle = '#64748B';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Onde a infância é registrada e cuidada para sempre', size / 2, 830);

      // Data e Escola
      ctx.fillStyle = '#94A3B8';
      ctx.font = '16px sans-serif';
      ctx.fillText(`Registro Oficial Escolar • ${data}`, size / 2, 860);

      // Download
      const link = document.createElement('a');
      link.download = `card_redes_${ocultarFotoCrianca ? 'afeto_lgpd' : 'atividade'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Erro ao gerar card:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  // Compartilhamento Direto (Web Share API para Celular/Tablet)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Momento Escolar: ${titulo}`,
          text: gerarLegenda(),
        });
      } catch (err) {
        console.warn('Compartilhamento cancelado:', err);
      }
    } else {
      handleCopyCaption();
    }
  };

  return (
    <div className="bg-gradient-to-br from-amber-50/60 via-teal-50/40 to-slate-50 rounded-3xl p-5 sm:p-6 border-2 border-teal-300 shadow-md space-y-5">
      {/* Cabeçalho da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-teal-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center font-black shadow-xs">
            <Share2 size={18} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
              <span>Post para Redes Sociais da Escola</span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                Instagram / WhatsApp
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Gere posts encantadores com conformidade jurídica para divulgar a rotina pedagógica
            </p>
          </div>
        </div>

        {/* Toggle Ocultar Foto da Criança (Sem Autorização) */}
        <button
          type="button"
          onClick={() => onToggleOcultarFoto(!ocultarFotoCrianca)}
          className={`px-3.5 py-2 rounded-2xl text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-xs border ${
            ocultarFotoCrianca
              ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
          }`}
        >
          {ocultarFotoCrianca ? (
            <>
              <EyeOff size={15} />
              <span>Foto Oculta (Sem autorização / LGPD Ativa)</span>
            </>
          ) : (
            <>
              <Eye size={15} />
              <span>Mostrar Foto Original (Autorizada)</span>
            </>
          )}
        </button>
      </div>

      {/* Aviso Explicativo LGPD */}
      <div className={`p-3 rounded-2xl text-xs flex items-start gap-2.5 border ${
        ocultarFotoCrianca
          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
          : 'bg-amber-50 border-amber-200 text-amber-900'
      }`}>
        <ShieldCheck size={18} className={`flex-shrink-0 mt-0.5 ${ocultarFotoCrianca ? 'text-emerald-600' : 'text-amber-600'}`} />
        <div className="space-y-0.5">
          <p className="font-bold">
            {ocultarFotoCrianca
              ? '✅ Proteção de Imagem Ativa: O rosto da criança não será exposto na rede social!'
              : '⚠️ Atenção: Certifique-se de que a família assinou o termo de autorização de imagem para redes.'}
          </p>
          <p className="text-[11px] opacity-90 leading-tight">
            {ocultarFotoCrianca
              ? 'A foto original será salva de forma segura e exclusiva no álbum particular da família. No card público para as redes, será exibida uma linda mensagem afetiva de aprendizado.'
              : 'Se a criança não tiver autorização expressa dos responsáveis, clique no botão acima para ocultar a foto e publicar a mensagem poética com segurança.'}
          </p>
        </div>
      </div>

      {/* Se Ocultar Foto Estiver Ativo: Seleção de Mensagem de Afeto */}
      {ocultarFotoCrianca && (
        <div className="space-y-2.5 bg-white p-4 rounded-2xl border border-slate-200">
          <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
            Escolha uma Mensagem Poética de Afeto (ou personalize abaixo):
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {MENSAGENS_AFETO_PRESET.map((msg, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => onChangeMensagemAfeto(msg)}
                className={`p-2.5 text-left rounded-xl text-xs transition border cursor-pointer ${
                  mensagemAfeto === msg
                    ? 'bg-teal-50 border-teal-400 text-teal-950 font-bold shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-medium'
                }`}
              >
                {msg}
              </button>
            ))}
          </div>

          <div className="pt-2">
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
              Editar Mensagem de Afeto do Card:
            </label>
            <textarea
              rows={2}
              value={mensagemAfeto}
              onChange={(e) => onChangeMensagemAfeto(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-400 bg-slate-50"
              placeholder="Digite uma mensagem acolhedora de afeto..."
            />
          </div>
        </div>
      )}

      {/* Grid: Preview Visual do Card + Ações de Compartilhamento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
        {/* Esquerda: O Card Visual Como Ficará no Instagram (Proporção 1:1) */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <Sparkles size={13} className="text-amber-500" />
            <span>Prévia do Card (Instagram / WhatsApp):</span>
          </span>

          <div className="w-full aspect-square rounded-2xl border-4 border-amber-300 shadow-md p-4 flex flex-col justify-between relative overflow-hidden bg-gradient-to-b from-[#fdfbf7] via-white to-[#f0f9f8]">
            {/* Topo do Card */}
            <div className="flex items-center justify-between border-b border-amber-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white p-0.5 border border-slate-200 flex items-center justify-center shadow-2xs">
                  <LogoAnjinhoEducador variant="symbol" size="full" className="w-full h-full" />
                </div>
                <div>
                  <h4 className="text-[11px] font-black text-[#214E8A] leading-tight">
                    ANJINHO ESCOLAR
                  </h4>
                  <p className="text-[8px] font-bold text-teal-600 uppercase tracking-widest leading-none">
                    Guardião das Memórias
                  </p>
                </div>
              </div>
              <span className="text-[9px] font-bold text-slate-400">
                {data || 'Data de Hoje'}
              </span>
            </div>

            {/* Centro do Card: Foto Original OU Mensagem Afetiva */}
            <div className="my-auto py-2">
              {ocultarFotoCrianca || !fotoUrl ? (
                <div className="bg-white/90 border border-amber-200 rounded-2xl p-4 shadow-xs text-center space-y-2">
                  <div className="text-2xl leading-none text-amber-500 font-serif">“</div>
                  <p className="text-xs sm:text-sm font-medium text-slate-800 italic leading-relaxed px-2">
                    {mensagemAfeto}
                  </p>
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-[11px] font-black text-indigo-900 truncate">
                      ✨ {titulo || 'Vivência Pedagógica'}
                    </p>
                    <span className="inline-block mt-1 text-[9px] font-black text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                      🛡️ Imagem Protegida • Respeito à LGPD
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-full h-44 rounded-xl overflow-hidden relative border border-slate-200 shadow-xs">
                  <img
                    src={fotoUrl}
                    alt="Atividade"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/80 to-transparent p-2.5 text-white">
                    <p className="text-xs font-black truncate">{titulo}</p>
                    <p className="text-[9px] text-amber-300 font-bold">{selectedBncc.join(' • ')}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Rodapé do Card */}
            <div className="text-center pt-2 border-t border-amber-100">
              <p className="text-[9px] font-bold text-slate-500">
                Onde a infância é registrada e cuidada para sempre
              </p>
            </div>
          </div>
        </div>

        {/* Direita: Botões e Legenda Pronta */}
        <div className="space-y-3">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">
            Ações Rápidas de Compartilhamento:
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Botão Baixar Imagem */}
            <button
              type="button"
              onClick={handleDownloadCard}
              disabled={isDownloading}
              className="py-2.5 px-3 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Download size={15} />
              <span>{isDownloading ? 'Gerando...' : 'Baixar Card (PNG)'}</span>
            </button>

            {/* Botão Compartilhar Direto */}
            <button
              type="button"
              onClick={handleNativeShare}
              className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Share2 size={15} />
              <span>Compartilhar Post</span>
            </button>
          </div>

          {/* Copiar Legenda */}
          <div className="bg-white rounded-2xl p-3 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-700 flex items-center gap-1">
                <MessageCircle size={13} className="text-indigo-600" />
                <span>Legenda Pronta com Hashtags:</span>
              </span>
              <button
                type="button"
                onClick={handleCopyCaption}
                className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition flex items-center gap-1 cursor-pointer"
              >
                {copiedCaption ? (
                  <>
                    <Check size={11} className="text-emerald-600" />
                    <span className="text-emerald-700">Copiada!</span>
                  </>
                ) : (
                  <>
                    <Copy size={11} />
                    <span>Copiar Texto</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl max-h-32 overflow-y-auto font-mono whitespace-pre-line border border-slate-100">
              {gerarLegenda()}
            </div>
          </div>
        </div>
      </div>

      {/* Canvas Oculto para Renderização de Alta Resolução */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
