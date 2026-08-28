import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2, AlertCircle, Check, Square } from 'lucide-react';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  textLanguage?: string;
  className?: string;
  size?: 'sm' | 'md';
}

// Helper to intelligently merge text chunks without repeating words or phrases
const mergeDeduplicatedText = (existing: string, incoming: string): string => {
  const e = existing.trim();
  const i = incoming.trim();
  if (!e) return i;
  if (!i) return e;

  const eLower = e.toLowerCase();
  const iLower = i.toLowerCase();

  // 1. Exact match or incoming is already fully included inside existing
  if (eLower === iLower || eLower.endsWith(iLower) || eLower.includes(iLower)) {
    return e;
  }

  // 2. Incoming is a cumulative extension starting with existing
  if (iLower.startsWith(eLower)) {
    return i;
  }

  // 3. Check for word/phrase boundary overlaps
  const eWords = e.split(/\s+/);
  const iWords = i.split(/\s+/);

  for (let overlapLen = Math.min(eWords.length, iWords.length); overlapLen > 0; overlapLen--) {
    const eSuffix = eWords.slice(-overlapLen).join(' ').toLowerCase();
    const iPrefix = iWords.slice(0, overlapLen).join(' ').toLowerCase();
    if (eSuffix === iPrefix) {
      const remainingWords = iWords.slice(overlapLen).join(' ');
      return remainingWords ? `${e} ${remainingWords}` : e;
    }
  }

  return `${e} ${i}`;
};

export const VoiceInput: React.FC<VoiceInputProps> = ({
  onTranscript,
  textLanguage = 'pt-BR',
  className = '',
  size = 'sm'
}) => {
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showStatus, setShowStatus] = useState(false);
  const [currentText, setCurrentText] = useState('');

  const recognitionRef = useRef<any>(null);
  const shouldBeListeningRef = useRef(false);
  const hasDispatchedRef = useRef(false);
  const baseTranscriptRef = useRef('');
  const fullTranscriptRef = useRef('');
  const latestCombinedRef = useRef('');
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const maxDurationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSpeechTimeRef = useRef<number>(0);
  const restartCountRef = useRef<number>(0);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSupported(true);
    }

    return () => {
      cleanupTimers();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  const cleanupTimers = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }
  };

  const stopListening = (explicitUserStop = true) => {
    shouldBeListeningRef.current = false;
    cleanupTimers();

    if (recognitionRef.current) {
      try {
        const rec = recognitionRef.current;
        recognitionRef.current = null;
        rec.stop();
      } catch (e) {
        // ignore
      }
    }

    setIsListening(false);

    // Send accumulated transcript ONCE per recording session
    if (!hasDispatchedRef.current) {
      hasDispatchedRef.current = true;
      const finalText = (latestCombinedRef.current || fullTranscriptRef.current || '').trim();
      if (finalText) {
        onTranscript(finalText);
        setErrorMsg(null);
        setShowStatus(true);
        setTimeout(() => setShowStatus(false), 3000);
      } else if (explicitUserStop) {
        setShowStatus(false);
      }
    }
    setCurrentText('');
  };

  const resetSilenceTimer = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    // 8.5 seconds of total quiet after last speech before auto-concluding
    silenceTimerRef.current = setTimeout(() => {
      console.log('VoiceInput: Extended silence timeout reached (8.5s). Concluding transcript.');
      stopListening(false);
    }, 8500);
  };

  const startListening = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    setErrorMsg(null);

    if (!supported) {
      setErrorMsg("Navegador incompativel. Use Google Chrome ou Safari.");
      setShowStatus(true);
      setTimeout(() => setShowStatus(false), 5000);
      return;
    }

    // Toggle off if currently active
    if (isListening || shouldBeListeningRef.current) {
      stopListening(true);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    fullTranscriptRef.current = '';
    baseTranscriptRef.current = '';
    latestCombinedRef.current = '';
    hasDispatchedRef.current = false;
    setCurrentText('');
    shouldBeListeningRef.current = true;
    lastSpeechTimeRef.current = Date.now();
    restartCountRef.current = 0;

    const createAndStartRecognition = () => {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = textLanguage;
        recognitionRef.current = recognition;

        recognition.onstart = () => {
          setIsListening(true);
          setShowStatus(true);
          setErrorMsg(null);
          resetSilenceTimer();

          // Maximum 90 seconds continuous recording window
          if (!maxDurationTimerRef.current) {
            maxDurationTimerRef.current = setTimeout(() => {
              stopListening(false);
            }, 90000);
          }
        };

        recognition.onresult = (event: any) => {
          lastSpeechTimeRef.current = Date.now();
          resetSilenceTimer();

          let sessionFinal = '';
          let sessionInterim = '';

          // Construct current session transcript using anti-duplication merger
          for (let i = 0; i < event.results.length; ++i) {
            const transcriptChunk = (event.results[i][0]?.transcript || '').trim();
            if (transcriptChunk) {
              if (event.results[i].isFinal) {
                sessionFinal = mergeDeduplicatedText(sessionFinal, transcriptChunk);
              } else {
                sessionInterim = mergeDeduplicatedText(sessionInterim, transcriptChunk);
              }
            }
          }

          const base = baseTranscriptRef.current.trim();
          const currentFinal = mergeDeduplicatedText(base, sessionFinal);
          fullTranscriptRef.current = currentFinal;

          const combinedDisplay = mergeDeduplicatedText(currentFinal, sessionInterim);
          latestCombinedRef.current = combinedDisplay;
          setCurrentText(combinedDisplay);
        };

        recognition.onerror = (event: any) => {
          console.warn('VoiceInput error event:', event.error);

          if (event.error === 'no-speech') {
            // Ignore brief no-speech errors, stay active if user wants to keep speaking
            if (shouldBeListeningRef.current) {
              return;
            }
          }

          if (event.error === 'not-allowed') {
            shouldBeListeningRef.current = false;
            setIsListening(false);
            cleanupTimers();
            setErrorMsg("Permissao negada! Ative o microfone no seu navegador.");
            setShowStatus(true);
            setTimeout(() => setShowStatus(false), 5000);
          } else if (event.error === 'network') {
            if (!fullTranscriptRef.current && !latestCombinedRef.current && shouldBeListeningRef.current) {
              setErrorMsg("Erro de conexao com o servico de voz. Tente novamente.");
              setShowStatus(true);
              setTimeout(() => setShowStatus(false), 4000);
            }
          }
        };

        recognition.onend = () => {
          // If browser engine auto-stopped due to quiet pause, but user wants mic active, restart!
          if (shouldBeListeningRef.current && restartCountRef.current < 10) {
            const timeSinceSpeech = Date.now() - lastSpeechTimeRef.current;
            // If last speech was within 8.5 seconds, automatically restart recognition!
            if (timeSinceSpeech < 8500) {
              restartCountRef.current += 1;
              baseTranscriptRef.current = latestCombinedRef.current || fullTranscriptRef.current;
              setTimeout(() => {
                if (shouldBeListeningRef.current) {
                  createAndStartRecognition();
                }
              }, 100);
              return;
            }
          }

          // Otherwise stop cleanly
          stopListening(false);
        };

        recognition.start();
      } catch (e) {
        console.error('Error starting SpeechRecognition:', e);
        setErrorMsg("Falha ao inicializar o microfone.");
        setIsListening(false);
        shouldBeListeningRef.current = false;
        cleanupTimers();
        setShowStatus(true);
        setTimeout(() => setShowStatus(false), 4000);
      }
    };

    createAndStartRecognition();
  };

  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <div className="relative inline-flex items-center gap-1.5 z-10">
      <button
        type="button"
        onClick={startListening}
        className={`flex items-center justify-center rounded-xl transition-all cursor-pointer ${
          isListening
            ? 'bg-rose-600 text-white animate-pulse ring-3 ring-rose-500/40 font-bold scale-105'
            : !supported
            ? 'bg-slate-100 text-slate-350 cursor-help border border-slate-200'
            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 hover:text-indigo-800 border border-indigo-100 hover:scale-105 active:scale-95'
        } ${size === 'sm' ? 'p-1.5' : 'p-2.5'} ${className}`}
        title={
          !supported 
            ? "O ditado por voz nao e suportado neste navegador (Recomendado: Chrome/Safari)" 
            : isListening 
            ? "Microfone Ativo (Tempo estendido)! Clique para finalizar e enviar." 
            : "Falar e Transcrever (Clique para ditar por voz)"
        }
      >
        {isListening ? (
          <Square className={`${iconSize} fill-white text-white`} />
        ) : !supported ? (
          <MicOff className={`${iconSize}`} />
        ) : (
          <Mic className={iconSize} />
        )}
      </button>

      
      {showStatus && (
        <div className="absolute bottom-full mb-2 right-0 bg-slate-900 text-white text-[11px] px-3 py-2 rounded-xl shadow-xl flex flex-col gap-1 max-w-[280px] pointer-events-none min-w-[220px] border border-slate-700 animate-fade-in z-50">
          {errorMsg ? (
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="text-rose-200 leading-tight font-medium">{errorMsg}</span>
            </div>
          ) : isListening ? (
            <>
              <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1">
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                  <span className="text-emerald-300 font-bold leading-none animate-pulse">Microfone Ativo...</span>
                </div>
                <span className="text-[9px] text-slate-400 font-medium">Tempo estendido</span>
              </div>
              <p className="text-[10px] text-slate-300 italic truncate max-w-full">
                {currentText ? `"${currentText}"` : 'Fale normalmente, com pausas...'}
              </p>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-slate-100 font-medium">Transcrito com sucesso!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

