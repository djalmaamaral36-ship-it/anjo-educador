import React, { useState } from 'react';
import { Mic, MicOff, Sparkles, Check, AlertCircle } from 'lucide-react';

interface CampoTextoVozProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  type?: 'text' | 'textarea' | 'email' | 'tel' | 'number';
  rows?: number;
  className?: string;
  id?: string;
  disabled?: boolean;
  helpText?: string;
}

export default function CampoTextoVoz({
  value,
  onChange,
  label,
  placeholder = 'Digite ou fale pelo microfone...',
  required = false,
  type = 'text',
  rows = 3,
  className = '',
  id = `campo_voz_${Math.random().toString(36).substring(2, 9)}`,
  disabled = false,
  helpText,
}: CampoTextoVozProps) {
  const [isListening, setIsListening] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleVoiceInput = () => {
    if (disabled) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatusMessage('Microfone não suportado no navegador.');
      setTimeout(() => setStatusMessage(null), 3500);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.continuous = false;
      recognition.interimResults = false;

      setIsListening(true);
      setStatusMessage('Ouvindo... Fale agora');

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          const updatedValue = value ? `${value} ${transcript}` : transcript;
          onChange(updatedValue);
          setStatusMessage('Texto capturado por voz!');
          setTimeout(() => setStatusMessage(null), 2500);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setStatusMessage('Não foi possível ouvir. Tente novamente.');
        setTimeout(() => setStatusMessage(null), 3000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
      setStatusMessage('Erro ao ativar microfone.');
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={id} className="text-xs font-bold text-slate-700 block">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
          <button
            type="button"
            onClick={handleVoiceInput}
            disabled={disabled}
            className={`text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 transition cursor-pointer ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse shadow-xs'
                : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
            }`}
            title="Clique para ditar por voz"
          >
            {isListening ? <MicOff size={11} /> : <Mic size={11} />}
            <span>{isListening ? 'Ouvindo...' : 'Falar por Voz'}</span>
          </button>
        </div>
      )}

      <div className="relative flex items-center">
        {type === 'textarea' ? (
          <textarea
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            rows={rows}
            disabled={disabled}
            className={`w-full p-2.5 pr-10 bg-slate-50/70 border rounded-xl text-xs font-medium text-slate-800 outline-none transition resize-y ${
              isListening
                ? 'border-rose-400 ring-2 ring-rose-200 bg-rose-50/20'
                : 'border-slate-200 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500'
            }`}
          />
        ) : (
          <input
            id={id}
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            className={`w-full p-2.5 pr-10 bg-slate-50/70 border rounded-xl text-xs font-medium text-slate-800 outline-none transition ${
              isListening
                ? 'border-rose-400 ring-2 ring-rose-200 bg-rose-50/20'
                : 'border-slate-200 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500'
            }`}
          />
        )}

        {/* Botão de Microfone Embutido no Campo */}
        <button
          type="button"
          onClick={handleVoiceInput}
          disabled={disabled}
          className={`absolute right-2.5 ${
            type === 'textarea' ? 'top-3' : 'top-1/2 -translate-y-1/2'
          } p-1.5 rounded-lg transition cursor-pointer ${
            isListening
              ? 'bg-rose-500 text-white animate-pulse shadow-sm'
              : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'
          }`}
          title="Digitar por voz (Microfone)"
        >
          <Mic size={15} />
        </button>
      </div>

      {/* Mensagem de Feedback de Voz ou Ajuda */}
      {statusMessage ? (
        <p
          className={`text-[10px] font-bold flex items-center gap-1 mt-0.5 ${
            isListening
              ? 'text-rose-600 animate-pulse'
              : statusMessage.includes('Erro') || statusMessage.includes('não')
              ? 'text-amber-600'
              : 'text-emerald-600'
          }`}
        >
          {isListening ? (
            <Mic size={10} className="animate-spin" />
          ) : (
            <Check size={10} />
          )}
          <span>{statusMessage}</span>
        </p>
      ) : helpText ? (
        <p className="text-[10px] text-slate-400 font-normal">{helpText}</p>
      ) : null}
    </div>
  );
}
