import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  Instagram, 
  Sparkles, 
  Star, 
  Heart, 
  Share2, 
  Layout, 
  Smartphone,
  Palette,
  ShieldCheck,
  Camera,
  Upload
} from 'lucide-react';
import { JornadaEvent } from '../types';
import { VoiceInput } from './VoiceInput';

interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: JornadaEvent;
  studentName: string;
}

type AspectRatio = 'feed' | 'story';
type ThemeType = 'candy' | 'sunset' | 'forest' | 'cosmic' | 'classroom';

interface ThemeConfig {
  name: string;
  gradient: string;
  canvasBg: string[]; // Gradient steps for canvas
  textColor: string;
  descColor: string;
  badgeBg: string;
  badgeText: string;
  accentColor: string;
  emoji: string;
}

const THEMES: Record<ThemeType, ThemeConfig> = {
  candy: {
    name: 'Doce Algodao',
    gradient: 'from-pink-100 via-purple-50 to-sky-100',
    canvasBg: ['#FFDEE9', '#B5FFFC'],
    textColor: '#4A154B',
    descColor: '#6B3A6F',
    badgeBg: '#FCE7F3',
    badgeText: '#9D174D',
    accentColor: '#EC4899',
    emoji: ' '
  },
  sunset: {
    name: 'Por do Sol',
    gradient: 'from-amber-100 via-orange-50 to-rose-100',
    canvasBg: ['#FFE259', '#FFA751'],
    textColor: '#7C2D12',
    descColor: '#9A3412',
    badgeBg: '#FFEDD5',
    badgeText: '#C2410C',
    accentColor: '#F97316',
    emoji: ' '
  },
  forest: {
    name: 'Bosque Verde',
    gradient: 'from-emerald-100 via-teal-50 to-cyan-100',
    canvasBg: ['#11998e', '#38ef7d'],
    textColor: '#064E3B',
    descColor: '#0F766E',
    badgeBg: '#D1FAE5',
    badgeText: '#065F46',
    accentColor: '#10B981',
    emoji: ' '
  },
  cosmic: {
    name: 'Estrela Cosmica',
    gradient: 'from-slate-900 via-indigo-950 to-purple-900',
    canvasBg: ['#0F2027', '#203A43', '#2C5364'],
    textColor: '#FFFFFF',
    descColor: '#E2E8F0',
    badgeBg: '#312E81',
    badgeText: '#C7D2FE',
    accentColor: '#818CF8',
    emoji: ' '
  },
  classroom: {
    name: 'Classico Escola',
    gradient: 'from-amber-50 to-yellow-100/50',
    canvasBg: ['#FFFDF6', '#FFF9E6'],
    textColor: '#1E293B',
    descColor: '#475569',
    badgeBg: '#FEF3C7',
    badgeText: '#92400E',
    accentColor: '#F59E0B',
    emoji: ' '
  }
};

const getGradientStyle = (colors: string[], isStory = false) => {
  const angle = isStory ? '180deg' : '135deg';
  if (colors.length === 2) {
    return { background: `linear-gradient(${angle}, ${colors[0]} 0%, ${colors[1]} 100%)` };
  } else {
    return { background: `linear-gradient(${angle}, ${colors[0]} 0%, ${colors[1]} 50%, ${colors[2]} 100%)` };
  }
};

const getButtonGradientStyle = (colors: string[]) => {
  if (colors.length === 2) {
    return { background: `linear-gradient(90deg, ${colors[0]} 0%, ${colors[1]} 100%)` };
  } else {
    return { background: `linear-gradient(90deg, ${colors[0]} 0%, ${colors[1]} 50%, ${colors[2]} 100%)` };
  }
};

export function SocialShareModal({ isOpen, onClose, event, studentName }: SocialShareModalProps) {
  const [aspect, setAspect] = useState<AspectRatio>('feed');
  const [activeTheme, setActiveTheme] = useState<ThemeType>('candy');
  const [customNote, setCustomNote] = useState('');
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [hidePhoto, setHidePhoto] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setCustomPhotoUrl(event.imagemUrl || null);
  }, [event.imagemUrl]);

  if (!isOpen) return null;

  const activePhotoUrl = customPhotoUrl !== null ? customPhotoUrl : (event.imagemUrl || '');

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        if (readerEvent.target?.result) {
          setCustomPhotoUrl(readerEvent.target.result as string);
          setHidePhoto(false);
          showToast('  Foto adicionada ao card com sucesso!');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const currentTheme = THEMES[activeTheme];

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const getCleanName = (fullName: string) => {
    return fullName.split(' (')[0];
  };

  const cleanStudentName = getCleanName(studentName);

  // Generate WhatsApp/Instagram style caption text
  const generateCaption = () => {
    const emojiMap: Record<string, string> = {
      conquista: ' ',
      atividade: ' ',
      foto: ' ',
      evolucao: ' ',
      relatorio: ' ',
      data_importante: ' '
    };
    
    const categoryEmoji = emojiMap[event.tipo] || ' ';
    
    return `  MOMENTO INESQUECIVEL NO ANJINHO ESCOLAR  

Hoje o(a) ${cleanStudentName} brilhou muito na escola!

${categoryEmoji} *${event.titulo}*
"${event.descricao}"
${customNote ? `\n  *Recadinho:* ${customNote}` : ''}

   Compartilhado pelo Anjinho Escolar, aproximando as familias do dia a dia pedagogico com amor e transparencia.

  Ative suas notificacoes e participe das conquistas do seu pequeno!

#AnjinhoEscolar #EducacaoInfantil #AmorPedagogico #MomentosEscolares #DesenvolvimentoInfantil #EscolaParceira #${cleanStudentName.replace(/\s+/g, '')}`;
  };

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(generateCaption());
      setCopied(true);
      showToast('  Legenda copiada com sucesso!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Falha ao copiar:', err);
    }
  };

  // Canvas drawing for realistic image download (supporting cross-origin bypass or fallback)
  const handleDownloadImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setDownloading(true);

    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Nao foi possivel obter contexto 2D');

      // Set canvas size based on aspect ratio
      const width = aspect === 'feed' ? 1080 : 1080;
      const height = aspect === 'feed' ? 1080 : 1920;
      canvas.width = width;
      canvas.height = height;

      // 1. Draw Background Gradient
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      const colors = currentTheme.canvasBg;
      if (colors.length === 2) {
        grad.addColorStop(0, colors[0]);
        grad.addColorStop(1, colors[1]);
      } else {
        grad.addColorStop(0, colors[0]);
        grad.addColorStop(0.5, colors[1]);
        grad.addColorStop(1, colors[2]);
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Draw playful background elements (subtle circles/stars)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.arc(150, 150, 200, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(width - 150, height - 300, 300, 0, Math.PI * 2);
      ctx.fill();

      // 2. Draw Header Area (App Branding)
      ctx.fillStyle = activeTheme === 'cosmic' ? 'rgba(255, 255, 255, 0.9)' : currentTheme.textColor;
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('  Anjinho Escolar  ', width / 2, aspect === 'feed' ? 100 : 180);

      // 3. Draw Main Polaroid Box Frame
      const boxWidth = width - 160;
      const boxHeight = aspect === 'feed' ? 760 : 1280;
      const boxX = 80;
      const boxY = aspect === 'feed' ? 160 : 280;

      // Draw box shadow mockup on canvas
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.beginPath();
      ctx.roundRect(boxX + 10, boxY + 15, boxWidth, boxHeight, 40);
      ctx.fill();

      // Draw main white/light box
      ctx.fillStyle = activeTheme === 'cosmic' ? 'rgba(15, 23, 42, 0.85)' : '#FFFDF9';
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 40);
      ctx.fill();

      // Draw thin border
      ctx.strokeStyle = activeTheme === 'cosmic' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(229, 231, 235, 0.5)';
      ctx.lineWidth = 4;
      ctx.stroke();

      // 4. Draw Student Badge or Tag inside the Polaroid box
      const tagX = boxX + 40;
      const tagY = boxY + 50;
      ctx.fillStyle = currentTheme.badgeBg;
      ctx.beginPath();
      ctx.roundRect(tagX, tagY, 320, 56, 16);
      ctx.fill();

      ctx.fillStyle = currentTheme.badgeText;
      ctx.font = '900 22px sans-serif';
      ctx.textAlign = 'center';
      const catText = event.tipo === 'conquista' ? '  CONQUISTA' :
                     event.tipo === 'atividade' ? '  ATIVIDADE' :
                     event.tipo === 'foto' ? '  FOTO DO DIA' :
                     event.tipo === 'evolucao' ? '  EVOLUCAO' : '  ROTINA';
      ctx.fillText(catText, tagX + 160, tagY + 36);

      // Student name highlight
      ctx.fillStyle = activeTheme === 'cosmic' ? '#FFFFFF' : '#1E293B';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`  ${cleanStudentName}`, boxX + boxWidth - 40, tagY + 36);

      let contentStartY = tagY + 100;

      // 5. Draw Image inside polaroid (if available and not hidden for privacy)
      if (activePhotoUrl && !hidePhoto) {
        const urlToLoad = activePhotoUrl;
        
        const loadImage = (url: string): Promise<HTMLImageElement | null> => {
          return new Promise((resolve) => {
            const isDataUrl = url.startsWith('data:');
            const img = new window.Image();
            
            if (!isDataUrl) {
              img.crossOrigin = 'anonymous';
            }
            
            img.onload = () => {
              if (img.naturalWidth > 0) resolve(img);
              else resolve(null);
            };

            img.onerror = () => {
              if (!isDataUrl) {
                // Retry without crossOrigin if CORS failed for standard URL
                const fallbackImg = new window.Image();
                fallbackImg.onload = () => {
                  if (fallbackImg.naturalWidth > 0) resolve(fallbackImg);
                  else resolve(null);
                };
                fallbackImg.onerror = () => resolve(null);
                fallbackImg.src = url;
              } else {
                resolve(null);
              }
            };

            img.src = url;
          });
        };

        const loadedImg = await loadImage(urlToLoad);

        if (loadedImg && loadedImg.complete && loadedImg.naturalWidth > 0) {
          const imgHeight = aspect === 'feed' ? 320 : 540;
          const imgY = contentStartY;
          const imgX = boxX + 40;
          const imgW = boxWidth - 80;

          // Save context to clip image with rounded corners
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(imgX, imgY, imgW, imgHeight, 24);
          ctx.clip();
          
          // Draw and cover image inside the rectangle
          const imgAspect = loadedImg.width / loadedImg.height;
          const rectAspect = imgW / imgHeight;
          let drawWidth = imgW;
          let drawHeight = imgHeight;
          let offsetX = 0;
          let offsetY = 0;

          if (imgAspect > rectAspect) {
            drawWidth = imgHeight * imgAspect;
            offsetX = -(drawWidth - imgW) / 2;
          } else {
            drawHeight = imgW / imgAspect;
            offsetY = -(drawHeight - imgHeight) / 2;
          }

          ctx.drawImage(loadedImg, imgX + offsetX, imgY + offsetY, drawWidth, drawHeight);
          ctx.restore();

          // Stroke photo frame
          ctx.strokeStyle = 'rgba(0,0,0,0.05)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(imgX, imgY, imgW, imgHeight, 24);
          ctx.stroke();

          contentStartY += imgHeight + 40;
        } else {
          // Fallback placeholder if image load failed
          const placeholderHeight = aspect === 'feed' ? 140 : 220;
          const pY = contentStartY;
          const pX = boxX + 40;
          const pW = boxWidth - 80;
          
          ctx.fillStyle = activeTheme === 'cosmic' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(99, 102, 241, 0.05)';
          ctx.strokeStyle = activeTheme === 'cosmic' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(99, 102, 241, 0.2)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(pX, pY, pW, placeholderHeight, 20);
          ctx.fill();
          ctx.stroke();
          
          ctx.font = '72px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(currentTheme.emoji, pX + (pW / 2), pY + (placeholderHeight / 2) + 24);
          
          contentStartY += placeholderHeight + 40;
        }
      } else {
        // Draw a beautiful placeholder badge/symbol when photo is hidden
        const placeholderHeight = aspect === 'feed' ? 140 : 220;
        const pY = contentStartY;
        const pX = boxX + 40;
        const pW = boxWidth - 80;
        
        ctx.fillStyle = activeTheme === 'cosmic' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(99, 102, 241, 0.05)';
        ctx.strokeStyle = activeTheme === 'cosmic' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(99, 102, 241, 0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(pX, pY, pW, placeholderHeight, 20);
        ctx.fill();
        ctx.stroke();
        
        // Draw icon/symbol emoji in the center
        ctx.font = '72px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(currentTheme.emoji, pX + (pW / 2), pY + (placeholderHeight / 2) + 24);
        
        contentStartY += placeholderHeight + 40;
      }

      // 6. Draw Event Title
      ctx.fillStyle = activeTheme === 'cosmic' ? '#FFFFFF' : '#0F172A';
      ctx.font = '900 36px sans-serif';
      ctx.textAlign = 'left';
      
      // Wrap Title
      const titleLines = wrapText(ctx, event.titulo, boxWidth - 80, 42);
      titleLines.forEach((line, index) => {
        ctx.fillText(line, boxX + 40, contentStartY + (index * 46));
      });

      contentStartY += (titleLines.length * 46) + 20;

      // 7. Draw Event Description
      ctx.fillStyle = activeTheme === 'cosmic' ? '#D1D5DB' : '#334155';
      ctx.font = 'medium 26px sans-serif';
      
      const descLines = wrapText(ctx, event.descricao, boxWidth - 80, 32);
      descLines.slice(0, aspect === 'feed' ? 4 : 8).forEach((line, index) => {
        ctx.fillText(line, boxX + 40, contentStartY + (index * 36));
      });

      contentStartY += (Math.min(descLines.length, aspect === 'feed' ? 4 : 8) * 36) + 30;

      // 8. Draw Custom Note (if present)
      if (customNote.trim()) {
        ctx.fillStyle = currentTheme.accentColor;
        ctx.font = 'italic bold 24px sans-serif';
        const noteLines = wrapText(ctx, `  "${customNote}"`, boxWidth - 80, 28);
        noteLines.forEach((line, idx) => {
          ctx.fillText(line, boxX + 40, contentStartY + (idx * 32));
        });
      }

      // 9. Draw Footer watermark inside Polaroid
      const footerY = boxY + boxHeight - 50;
      ctx.fillStyle = 'rgba(100, 116, 139, 0.4)';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Criado com carinho no Aplicativo Anjinho Escolar', width / 2, footerY);

      // 10. Outer bottom footer
      ctx.fillStyle = activeTheme === 'cosmic' ? '#94A3B8' : '#475569';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('  Conectando familias e escolas todos os dias  ', width / 2, height - (aspect === 'feed' ? 45 : 120));

      // Trigger download
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      link.download = `AnjinhoEscolar_${cleanStudentName}_${event.titulo.replace(/\s+/g, '_')}.jpg`;
      link.href = dataUrl;
      link.click();

    } catch (err) {
      console.error('Erro ao gerar imagem:', err);
      alert('Nao foi possivel gerar a imagem devido as restricoes de seguranca de imagens hospedadas. Voce ainda pode copiar a legenda para colar no Instagram!');
    } finally {
      setDownloading(false);
    }
  };

  // Helper text wrapping function for Canvas
  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number, fontSize: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + ' ' + word).width;
      if (width < maxWidth) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    return lines;
  };

  const handleConnectClick = () => {
    const inviteUrl = `https://anjinho.app/conectar?escola=AnjinhoEscolar&aluno=${encodeURIComponent(cleanStudentName)}`;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      showToast(`  Link de convite para ${cleanStudentName} copiado!`);
    }).catch(err => {
      console.error('Erro ao copiar link:', err);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      
      <canvas ref={canvasRef} className="hidden" />

      
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-60 bg-slate-900 dark:bg-indigo-950 text-white font-black text-xs px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-slate-800 dark:border-indigo-800 animate-bounce">
          <span className="text-emerald-400 font-bold"> </span>
          <span>{toastMessage}</span>
        </div>
      )}

      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl max-w-5xl w-full flex flex-col overflow-hidden border border-slate-200/50 dark:border-slate-800 max-h-[95vh] sm:max-h-[92vh]"
      >
        
        <div className="flex items-center justify-between p-3.5 sm:p-4 px-4 sm:px-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-pink-50 text-pink-600 dark:bg-pink-950 dark:text-pink-300 shrink-0">
              <Instagram className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5 leading-tight">
                Divulgar nas Redes Sociais
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-500 font-semibold leading-tight">
                Card de {cleanStudentName} pronto para publicar no Instagram & WhatsApp
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer shrink-0"
            title="Fechar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        
        <div className="grid grid-cols-1 lg:grid-cols-12 overflow-y-auto flex-1 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
          
          
          <div className="lg:col-span-7 bg-slate-100 dark:bg-slate-950 p-3 sm:p-6 flex flex-col items-center justify-center relative">
            
            <div className="w-full flex items-center justify-between mb-2 sm:mb-3 px-1">
              <div className="flex items-center gap-1.5">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] sm:text-xs font-black tracking-wider uppercase text-slate-700 dark:text-slate-200">
                    Card Pronto para Redes Sociais
                </span>
              </div>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-full">
                Formato: {aspect === 'feed' ? 'Quadrado (1:1)' : 'Story (9:16)'}
              </span>
            </div>

            
            <div className="w-full flex justify-center py-1 sm:py-2">
              <div 
                className={`relative shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden border border-slate-300/80 dark:border-slate-800 w-full ${
                  aspect === 'feed' 
                    ? 'max-w-[290px] xs:max-w-[330px] sm:max-w-[380px] min-h-[330px] xs:min-h-[370px] sm:min-h-[420px]' 
                    : 'max-w-[250px] xs:max-w-[280px] sm:max-w-[310px] min-h-[440px] xs:min-h-[490px] sm:min-h-[550px]'
                }`}
                style={getGradientStyle(currentTheme.canvasBg, aspect === 'story')}
              >
                
                {aspect === 'story' && (
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-indigo-600 border border-white/40 flex items-center justify-center text-[10px] font-black text-white"> </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-800 drop-shadow-xs leading-none">anjinho_escolar</p>
                        <p className="text-[7px] text-slate-500 font-bold leading-none">Patrocinado</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                      <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                      <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                    </div>
                  </div>
                )}

                
                <div className={`h-full w-full flex flex-col justify-between p-3 sm:p-5 ${aspect === 'story' ? 'pt-11 sm:pt-14 pb-4 sm:pb-6' : ''}`}>
                  
                  
                  <div className="text-center font-black tracking-wide text-xs text-indigo-950/80 dark:text-white/80 mb-1.5">
                      Anjinho Escolar {currentTheme.emoji}
                  </div>

                  
                  <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs rounded-2xl p-3 sm:p-4 border border-white/60 dark:border-slate-800 shadow-xl flex-1 flex flex-col justify-between space-y-2">
                    
                    <div className="space-y-2">
                      
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                          {event.tipo === 'conquista' ? '  Conquista' :
                           event.tipo === 'atividade' ? '  Atividade' :
                           event.tipo === 'foto' ? '  Foto' :
                           event.tipo === 'evolucao' ? '  Evolucao' : '  Rotina'}
                        </span>
                        <span className="text-[9px] sm:text-[10px] font-black text-slate-800 dark:text-slate-100 truncate max-w-[130px]">
                            {cleanStudentName}
                        </span>
                      </div>

                      
                      {activePhotoUrl && !hidePhoto ? (
                        <div className="w-full h-36 xs:h-40 sm:h-48 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 relative shrink-0 shadow-inner">
                          <img 
                            src={activePhotoUrl} 
                            alt={event.titulo} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        <div className="w-full py-5 sm:py-6 rounded-xl bg-indigo-50/50 dark:bg-slate-800/50 border border-dashed border-indigo-200 dark:border-slate-700 flex flex-col items-center justify-center text-indigo-400 gap-1">
                          <span className="text-2xl animate-bounce">{currentTheme.emoji}</span>
                          <span className="text-[9px] font-black tracking-wider uppercase text-indigo-600 dark:text-indigo-400">
                            {hidePhoto ? 'Protecao de Imagem Ativa  ' : 'Momento Pedagogico'}
                          </span>
                          <span className="text-[7px] sm:text-[8px] text-slate-500 text-center px-4 font-semibold">
                            {hidePhoto ? 'Foto oculta para protecao de privacidade.' : 'Aproximando com amor.'}
                          </span>
                        </div>
                      )}

                      
                      <div className="space-y-0.5 sm:space-y-1">
                        <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight">
                          {event.titulo}
                        </h4>
                        <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-300 line-clamp-3 font-medium leading-relaxed">
                          {event.descricao}
                        </p>
                      </div>

                      
                      {customNote.trim() && (
                        <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-1">
                          <p className="text-[9px] sm:text-[10px] font-black italic text-indigo-600 dark:text-indigo-400">
                              "{customNote}"
                          </p>
                        </div>
                      )}
                    </div>

                    
                    <div className="text-center text-[8px] font-extrabold text-slate-400 dark:text-slate-500 pt-1">
                      Compartilhado pelo app Anjinho Escolar  
                    </div>
                  </div>

                  
                  <button
                    type="button"
                    onClick={handleConnectClick}
                    className="w-full text-center text-[10px] font-black text-slate-800 dark:text-slate-200 mt-2 select-none drop-shadow-xs hover:text-indigo-600 dark:hover:text-indigo-400 hover:scale-102 hover:underline transition-all cursor-pointer bg-transparent border-none flex items-center justify-center gap-1 py-1"
                  >
                      Toque para se conectar e acompanhar!
                  </button>

                </div>
              </div>
            </div>
            
            
            <div className="w-full max-w-[340px] mt-3 space-y-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={downloading}
                  onClick={handleDownloadImage}
                  className="flex-1 py-3 px-4 rounded-xl bg-pink-600 hover:bg-pink-700 active:bg-pink-800 text-white text-xs font-black cursor-pointer flex items-center justify-center gap-2 transition-all shadow-md shadow-pink-200 dark:shadow-none disabled:opacity-50"
                >
                  {downloading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Baixar Card
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCopyCaption}
                  className="py-3 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 text-xs font-black cursor-pointer flex items-center justify-center gap-1.5 transition-all shadow-xs"
                >
                  <Copy className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Copiar Legenda
                </button>
              </div>
              <p className="text-[9px] text-center text-slate-500 font-bold">
                  Role para baixo para personalizar cores, fotos e legenda
              </p>
            </div>
          </div>

          
          <div className="lg:col-span-5 p-4 sm:p-6 flex flex-col justify-between bg-white dark:bg-slate-900">
            
            <div className="space-y-4 sm:space-y-5">

              
              <div className="bg-slate-50 dark:bg-slate-850 p-2.5 sm:p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300 shrink-0">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                      Foto doCard
                    </p>
                    <p className="text-[9px] text-slate-500 font-semibold truncate">
                      {activePhotoUrl ? 'Foto anexada ao card' : 'Sem foto anexada ao evento'}
                    </p>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {activePhotoUrl ? 'Trocar Foto' : 'Carregar Foto'}
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handlePhotoUpload} 
                />
              </div>

              
              <div 
                onClick={() => setHidePhoto(!hidePhoto)}
                className="bg-slate-50 dark:bg-slate-850/60 p-3 sm:p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-850 transition-all select-none"
              >
                <div className="space-y-0.5">
                  <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      Ocultar Foto do(a) Aluno(a)
                  </span>
                  <p className="text-[9px] text-slate-600 dark:text-slate-400 font-semibold">
                    Garante conformidade com a LGPD sem expor o rosto da crianca.
                  </p>
                </div>
                <button
                  type="button"
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    hidePhoto ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      hidePhoto ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Layout className="w-3.5 h-3.5 text-indigo-500" /> Formato da Publicacao
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setAspect('feed')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-black cursor-pointer transition-all ${
                      aspect === 'feed'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-150'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 rotate-90" />
                    Feed Quadrado (1:1)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAspect('story')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-black cursor-pointer transition-all ${
                      aspect === 'story'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-150'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    Story / Status (9:16)
                  </button>
                </div>
              </div>

              
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-pink-500" /> Estilo & Cores do Fundo
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.keys(THEMES) as ThemeType[]).map((themeKey) => {
                    const th = THEMES[themeKey];
                    return (
                      <button
                        key={themeKey}
                        type="button"
                        onClick={() => setActiveTheme(themeKey)}
                        className={`flex flex-col items-start p-2 rounded-xl border text-left cursor-pointer transition-all ${
                          activeTheme === themeKey
                            ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/30 dark:bg-indigo-950/40'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-850'
                        }`}
                      >
                        <div 
                          className="w-full h-2.5 rounded-md mb-1" 
                          style={getButtonGradientStyle(th.canvasBg)}
                        />
                        <span className="text-[10px] font-black text-slate-700 dark:text-slate-300">
                          {th.emoji} {th.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span>Recado Adicional (Opcional):</span>
                  <span className="text-[9px] text-slate-400 font-bold">Aparece em destaque</span>
                </label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value.slice(0, 60))}
                    placeholder="Ex: Orgulho do papai e da mamae!  "
                    className="flex-1 min-w-0 border px-3 py-2 rounded-xl text-xs font-semibold focus:outline-indigo-500 bg-white text-slate-900 border-slate-200 dark:bg-slate-850 dark:text-white dark:border-slate-700"
                  />
                  <VoiceInput
                    onTranscript={(transcript) => {
                      setCustomNote((prev) => {
                        const suffix = prev.trim() ? ' ' + transcript : transcript;
                        return (prev + suffix).slice(0, 60);
                      });
                    }}
                    size="md"
                    className="shrink-0"
                  />
                </div>
              </div>

              
              <div className="rounded-2xl bg-amber-50/90 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 p-3 sm:p-3.5 space-y-1">
                <div className="flex items-center gap-2 text-amber-950 dark:text-amber-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Seguranca & Legislacao (LGPD)</span>
                </div>
                <p className="text-[10px] text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">
                  <strong>Sim, e 100% permitido</strong> divulgar conquistas escolares com a autorizacao do responsavel (Artigo 🍼 da LGPD).
                </p>
              </div>

            </div>

            
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-5 space-y-3">
              <div className="rounded-xl bg-[#FFFDF6] dark:bg-slate-950 p-3 border border-amber-100 dark:border-slate-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[9px] font-black text-amber-900 dark:text-amber-300 uppercase">Sugestao de Legenda p/ Instagram:</span>
                  <button
                    type="button"
                    onClick={handleCopyCaption}
                    className="flex items-center gap-1 text-[10px] text-indigo-700 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600 font-bold">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copiar Texto</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-slate-700 dark:text-slate-400 line-clamp-3 font-medium leading-relaxed italic">
                  {generateCaption()}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={handleCopyCaption}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-250 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-black cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                >
                  <Copy className="w-4 h-4" />
                  Copiar Legenda
                </button>

                <button
                  type="button"
                  disabled={downloading}
                  onClick={handleDownloadImage}
                  className="flex-[1.5] py-3 px-4 rounded-xl bg-pink-600 hover:bg-pink-700 active:bg-pink-800 text-white text-xs font-black cursor-pointer flex items-center justify-center gap-1.5 transition-all shadow-md shadow-pink-200 dark:shadow-none disabled:opacity-50"
                >
                  {downloading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      CriandoCard...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Baixar Card de Foto
                    </>
                  )}
                </button>
              </div>

              <div className="text-center">
                <p className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">
                    Compartilhe a imagem baixada nos Stories ou Feed e cole a legenda copiada!
                </p>
              </div>
            </div>

          </div>
        </div>
      </motion.div>
    </div>
  );
}
