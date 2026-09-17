import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

interface Props {
  studentName?: string;
  studentPhoto?: string;
}

export default function BotaoVoltarAoAluno({
  studentName = 'Mariana Souza',
  studentPhoto,
}: Props) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Exibe o botão quando o usuário rolar mais de 260px (passando do card do aluno)
      if (window.scrollY > 260) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollToStudent = () => {
    // Busca o card do aluno ou o cabeçalho de contexto do aluno
    const alunoCard = document.getElementById('perfil-aluno-card');
    const alunoHeader = document.getElementById('aluno-context-header');
    const target = alunoCard || alunoHeader;

    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Adiciona um destaque temporário dourado para sinalizar a chegada ao perfil
      target.classList.add('ring-4', 'ring-amber-400', 'ring-offset-2');
      setTimeout(() => {
        target.classList.remove('ring-4', 'ring-amber-400', 'ring-offset-2');
      }, 2000);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (!isVisible) return null;

  const primeiroNome = studentName.split(' ')[0];

  return (
    <div
      className="fixed bottom-5 right-4 sm:bottom-7 sm:right-6 z-40 animate-in fade-in slide-in-from-bottom-3 duration-200"
    >
      <button
        type="button"
        onClick={handleScrollToStudent}
        title={`Voltar ao perfil de ${studentName}`}
        className="group flex items-center gap-2 px-3.5 py-2.5 sm:px-4 sm:py-2.5 rounded-full bg-[#120f30]/95 hover:bg-[#1b1742] text-white border-2 border-amber-300/60 shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md"
      >
        {/* Seta para cima estilizada */}
        <div className="w-6 h-6 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-300 group-hover:bg-amber-400 group-hover:text-amber-950 transition-colors">
          <ArrowUp size={14} className="stroke-[3]" />
        </div>

        {/* Miniatura do Aluno */}
        {studentPhoto && (
          <div className="w-6 h-6 rounded-full overflow-hidden border border-amber-300 shrink-0 bg-amber-200">
            <img
              src={studentPhoto}
              alt={studentName}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Textos explicativos */}
        <div className="flex items-center gap-1 text-left">
          <span className="text-xs font-black text-white tracking-tight">
            Voltar ao Aluno
          </span>
          <span className="text-[11px] font-bold text-amber-300 hidden sm:inline truncate max-w-[100px]">
            ({primeiroNome})
          </span>
        </div>
      </button>
    </div>
  );
}
