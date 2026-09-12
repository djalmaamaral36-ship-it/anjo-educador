import React, { useState, useRef } from 'react';
import { Camera, Upload, Trash2, Image, User, Check, RefreshCw, Sparkles } from 'lucide-react';

interface FotoUploadProps {
  fotoUrl?: string;
  onFotoChange: (url: string) => void;
  label?: string;
  tipoPerfil?: 'aluno' | 'familia' | 'diretora' | 'coordenadora' | 'desenvolvedor' | 'professor' | 'generico';
  tamanho?: 'sm' | 'md' | 'lg';
  className?: string;
  id?: string;
}

// Avatares e fotos padrão de alta qualidade para sugestão rápida
const FOTOS_SUGERIDAS: Record<string, { label: string; url: string }[]> = {
  aluno: [
    { label: 'Bebê Menina', url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80' },
    { label: 'Bebê Menino', url: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=200&auto=format&fit=crop&q=80' },
    { label: 'Criança Sorridente', url: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=200&auto=format&fit=crop&q=80' },
    { label: 'Bebê Alegre', url: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=200&auto=format&fit=crop&q=80' },
  ],
  familia: [
    { label: 'Mãe 1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80' },
    { label: 'Pai 1', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80' },
    { label: 'Mãe 2', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80' },
    { label: 'Pai 2', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80' },
  ],
  diretora: [
    { label: 'Diretora Nilva', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80' },
    { label: 'Executiva', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80' },
  ],
  coordenadora: [
    { label: 'Coord. Renata', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80' },
    { label: 'Coord. Fabiana', url: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=200&auto=format&fit=crop&q=80' },
  ],
  desenvolvedor: [
    { label: 'Dev Djalma', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80' },
    { label: 'Tech Lead', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80' },
  ],
  professor: [
    { label: 'Prof. Ana Silva', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80' },
    { label: 'Prof. Carla Dias', url: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=200&auto=format&fit=crop&q=80' },
  ],
  generico: [
    { label: 'Perfil 1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80' },
    { label: 'Perfil 2', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80' },
  ]
};

export default function CampoFotoUpload({
  fotoUrl = '',
  onFotoChange,
  label = 'Foto de Perfil / Cadastro',
  tipoPerfil = 'generico',
  tamanho = 'md',
  className = '',
  id = 'campo_foto_upload',
}: FotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlManual, setUrlManual] = useState(fotoUrl);
  const [showSugestoes, setShowSugestoes] = useState(false);

  // Manipular upload local de imagem com redimensionamento e compressão leve
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const rawDataUrl = uploadEvent.target?.result as string;
      if (!rawDataUrl) return;

      // Redimensiona para resolução leve ideal para identificação facial (máx 320x320, 70% qualidade)
      const img = new window.Image();
      img.onload = () => {
        const MAX_WIDTH = 320;
        const MAX_HEIGHT = 320;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'medium';
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.72);
          onFotoChange(compressedBase64);
        } else {
          onFotoChange(rawDataUrl);
        }
      };
      img.onerror = () => {
        onFotoChange(rawDataUrl);
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const sugestoes = FOTOS_SUGERIDAS[tipoPerfil] || FOTOS_SUGERIDAS.generico;

  const sizeClasses = {
    sm: 'w-14 h-14 rounded-2xl',
    md: 'w-20 h-20 rounded-3xl',
    lg: 'w-28 h-28 rounded-3xl',
  };

  return (
    <div id={id} className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Camera size={14} className="text-indigo-600" />
            <span>{label}</span>
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSugestoes(!showSugestoes)}
              className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5 cursor-pointer"
            >
              <Sparkles size={11} />
              <span>{showSugestoes ? 'Ocultar Sugestões' : 'Sugestões de Fotos'}</span>
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="text-[10px] text-slate-500 hover:text-slate-800 font-bold cursor-pointer"
            >
              {showUrlInput ? 'Ocultar URL' : 'Inserir Link/URL'}
            </button>
          </div>
        </div>
      )}

      {/* Sugestões Rápidas de Fotos para Alunos, Familiares, Diretor, Coordenador, Dev */}
      {showSugestoes && (
        <div className="p-2.5 bg-indigo-50/70 border border-indigo-200 rounded-2xl animate-in fade-in duration-200">
          <p className="text-[10px] font-bold text-indigo-900 mb-2 uppercase tracking-wider">
            Selecione uma foto recomendada para {tipoPerfil}:
          </p>
          <div className="flex flex-wrap gap-2">
            {sugestoes.map((sug, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onFotoChange(sug.url);
                  setShowSugestoes(false);
                }}
                className={`flex items-center gap-1.5 p-1 bg-white hover:bg-indigo-100 border rounded-xl text-[11px] font-bold transition cursor-pointer ${
                  fotoUrl === sug.url ? 'border-indigo-600 ring-2 ring-indigo-500/20 text-indigo-800' : 'border-indigo-200 text-slate-700'
                }`}
              >
                <img src={sug.url} alt={sug.label} className="w-6 h-6 rounded-lg object-cover" />
                <span>{sug.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Caixa de Upload e Visualização Principal */}
      <div className="flex items-center gap-4 p-3 bg-slate-50/80 border border-slate-200 rounded-2xl">
        {/* Preview do Avatar com Botão de Ação */}
        <div
          className={`relative ${sizeClasses[tamanho]} overflow-hidden bg-slate-200 border-2 border-dashed border-indigo-300 flex items-center justify-center flex-shrink-0 cursor-pointer shadow-xs group`}
          onClick={() => fileInputRef.current?.click()}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          title="Clique para escolher foto do dispositivo"
        >
          {fotoUrl ? (
            <img
              src={fotoUrl}
              alt="Foto do Perfil"
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 group-hover:text-indigo-600 transition">
              <User size={tamanho === 'sm' ? 20 : tamanho === 'md' ? 28 : 36} />
              <span className="text-[9px] font-bold mt-0.5">Sem Foto</span>
            </div>
          )}

          {/* Overlay de Hover para Troca Rápida */}
          <div className="absolute inset-0 bg-indigo-900/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Camera size={18} />
            <span className="text-[9px] font-bold uppercase tracking-tight mt-0.5">Alterar</span>
          </div>
        </div>

        {/* Informações e Botões de Ação */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Upload size={13} />
              <span>Enviar Foto</span>
            </button>

            {fotoUrl && (
              <button
                type="button"
                onClick={() => onFotoChange('')}
                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer"
                title="Remover foto"
              >
                <Trash2 size={13} />
                <span className="hidden sm:inline">Remover</span>
              </button>
            )}
          </div>

          <p className="text-[11px] text-slate-500 font-normal">
            Fotos otimizadas e leves para reconhecimento visual nítido (câmera, celular ou computador).
          </p>
        </div>

        {/* Input Oculto de Arquivo */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Input de URL manual (caso prefira colar link web) */}
      {showUrlInput && (
        <div className="flex items-center gap-2 animate-in fade-in duration-150">
          <input
            type="url"
            value={urlManual}
            onChange={(e) => setUrlManual(e.target.value)}
            placeholder="Cole o link da foto: https://..."
            className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-normal text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="button"
            onClick={() => {
              if (urlManual.trim()) {
                onFotoChange(urlManual.trim());
              }
            }}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl flex-shrink-0 cursor-pointer"
          >
            Aplicar URL
          </button>
        </div>
      )}
    </div>
  );
}
