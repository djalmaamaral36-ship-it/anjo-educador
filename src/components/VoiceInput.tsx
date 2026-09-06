import React, { useState } from 'react';
import { Mic, StopCircle } from 'lucide-react';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  size?: 'sm' | 'md';
}

export function VoiceInput({ onTranscript, size = 'md' }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Seu navegador não suporta reconhecimento de voz.');
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = 'pt-BR';
    rec.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      onTranscript(text);
      setIsListening(false);
    };
    rec.onend = () => setIsListening(false);
    
    rec.start();
    setIsListening(true);
    setRecognition(rec);
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  };

  return (
    <button
      type="button"
      onClick={isListening ? stopListening : startListening}
      className={`p-2 rounded-full transition-all ${
        isListening ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      } ${size === 'sm' ? 'scale-75' : ''}`}
    >
      {isListening ? <StopCircle size={20} /> : <Mic size={20} />}
    </button>
  );
}
