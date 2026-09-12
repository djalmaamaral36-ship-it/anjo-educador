import React, { useState } from 'react';

interface LogoProps {
  /** 'symbol' (somente ícone), 'full' (ícone + texto), 'badge' (ícone de app estilizado), 'monochrome-white', 'horizontal' */
  variant?: 'symbol' | 'full' | 'badge' | 'monochrome-white' | 'horizontal';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  showTagline?: boolean;
  taglineText?: string;
  className?: string;
  hasHalo?: boolean;
}

/**
 * Logo Oficial: Anjinho Escolar & Árvore da Infância
 * Design Clean e Detalhado:
 * - Emblema do Coração e Asas de Anjo em degrade azul real e ciano
 * - Silhueta pura da criança acolhida de braços abertos
 * - Árvore da Infância com ramificações e folhas suaves
 * - Preenchimento harmonioso, perfeitamente ajustado ao espaço
 */
export default function LogoAnjinhoEducador({
  variant = 'full',
  size = 'md',
  showTagline = true,
  taglineText = 'Onde a infância é registrada para sempre',
  className = '',
}: LogoProps) {
  const [imageError, setImageError] = useState(false);

  // Mapeamento de dimensões para preenchimento ideal
  const sizeMap = {
    xs: { boxClass: 'w-7 h-7', textClass: 'text-xs', subClass: 'text-[8px]' },
    sm: { boxClass: 'w-9 h-9', textClass: 'text-sm', subClass: 'text-[9px]' },
    md: { boxClass: 'w-11 h-11', textClass: 'text-base', subClass: 'text-[10px]' },
    lg: { boxClass: 'w-14 h-14', textClass: 'text-lg', subClass: 'text-xs' },
    xl: { boxClass: 'w-20 h-20', textClass: 'text-2xl', subClass: 'text-sm' },
    '2xl': { boxClass: 'w-28 h-28 sm:w-32 sm:h-32', textClass: 'text-3xl', subClass: 'text-base' },
    '3xl': { boxClass: 'w-36 h-36 sm:w-40 sm:h-40', textClass: 'text-4xl', subClass: 'text-lg' },
    full: { boxClass: 'w-full h-full', textClass: 'text-base', subClass: 'text-xs' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  // Render do símbolo: imagem oficial clean de alta resolução
  const renderSymbol = (mode: 'default' | 'white' = 'default') => {
    if (imageError) {
      // Fallback SVG elegante caso haja erro no carregamento da imagem
      return (
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-contain"
        >
          <path
            d="M50 88 C44 84, 20 68, 18 48 C16 35, 27 25, 40 28 C45 30, 48 34, 50 38 C52 34, 55 30, 60 28 C73 25, 84 35, 82 48 C80 68, 56 84, 50 88 Z"
            fill={mode === 'white' ? '#FFFFFF' : '#1e3a8a'}
          />
          <circle cx="42" cy="50" r="7" fill={mode === 'white' ? '#1e3a8a' : '#FFFFFF'} />
          <path
            d="M38 56 C34 59, 32 64, 34 68 C37 72, 42 73, 47 73 C45 68, 44 63, 43 59 Z"
            fill={mode === 'white' ? '#1e3a8a' : '#FFFFFF'}
          />
        </svg>
      );
    }

    return (
      <img
        src="/logo.png"
        alt="Logotipo Anjinho Escolar"
        className="w-full h-full object-contain select-none transition-transform duration-200"
        referrerPolicy="no-referrer"
        onError={() => setImageError(true)}
      />
    );
  };

  // 1. Variante 'badge' (App Icon com fundo suave e cantos arredondados)
  if (variant === 'badge') {
    return (
      <div
        className={`relative flex items-center justify-center rounded-2xl bg-white p-0.5 shadow-md border border-slate-100 overflow-hidden ${currentSize.boxClass} ${className}`}
      >
        {renderSymbol('default')}
      </div>
    );
  }

  // 2. Variante 'symbol' (somente o ícone preenchendo o espaço exato)
  if (variant === 'symbol') {
    return (
      <div
        className={`inline-flex items-center justify-center ${size === 'full' ? 'w-full h-full' : currentSize.boxClass} ${className}`}
      >
        {renderSymbol('default')}
      </div>
    );
  }

  // 3. Variante 'monochrome-white' (Para fundos escuros e headers contrastantes)
  if (variant === 'monochrome-white') {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white p-0.5 flex items-center justify-center shadow-xs flex-shrink-0 overflow-hidden">
          {renderSymbol('default')}
        </div>
        <div className="flex flex-col">
          <span className={`font-black tracking-tight text-white leading-none ${currentSize.textClass}`}>
            Anjinho Escolar
          </span>
          {showTagline && (
            <span className={`text-white/80 font-medium leading-none mt-1 hidden sm:block ${currentSize.subClass}`}>
              {taglineText}
            </span>
          )}
        </div>
      </div>
    );
  }

  // 4. Variante 'horizontal' ou 'full' (Símbolo + Texto da Marca)
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <div className={`flex-shrink-0 flex items-center justify-center ${currentSize.boxClass}`}>
        {renderSymbol('default')}
      </div>
      <div className="flex flex-col min-w-0">
        <span className={`font-black tracking-tight text-[#1e3a8a] leading-tight flex items-center gap-1 ${currentSize.textClass}`}>
          <span>Anjinho Escolar</span>
        </span>
        {showTagline && (
          <span className={`text-slate-500 font-medium tracking-normal leading-none mt-0.5 truncate ${currentSize.subClass}`}>
            {taglineText}
          </span>
        )}
      </div>
    </div>
  );
}
