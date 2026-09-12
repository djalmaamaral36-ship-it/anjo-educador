import React from 'react';
import { ChildProfile, LembrancaMoment } from '../../types';
import { X, Printer, Bookmark, BookOpen } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  student: ChildProfile;
  moments: LembrancaMoment[];
}

export default function AlbumPrimeiraInfanciaModal({
  isOpen,
  onClose,
  student,
  moments,
}: Props) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex justify-center items-start p-2 sm:p-4 md:p-6 animate-fadeIn print:p-0 print:bg-white print:static">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-auto flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Modal Top Control Bar (Hidden on print) */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-4 print:hidden flex-shrink-0">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-700 hover:bg-slate-200 text-xs sm:text-sm font-bold transition cursor-pointer"
          >
            <X size={18} />
            <span>Fechar Visualização</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-black shadow-md transition cursor-pointer active:scale-95"
          >
            <Printer size={18} />
            <span>Imprimir / Salvar PDF</span>
          </button>
        </div>

        {/* Scrollable Printable Content */}
        <div className="p-6 sm:p-10 overflow-y-auto space-y-8 bg-slate-50/50 print:p-0 print:bg-white print:overflow-visible">
          
          {/* Header Banner - Matching Screenshot 1.jpg */}
          <div className="bg-gradient-to-b from-cyan-50/90 via-emerald-50/50 to-white rounded-3xl p-6 sm:p-10 border border-emerald-100 shadow-xs relative text-center overflow-hidden">
            {/* Top decorative icons */}
            <div className="absolute top-5 left-6 text-amber-400 text-xl font-black">
              ⭐
            </div>
            <div className="absolute top-5 right-6 text-emerald-600 text-xl font-black">
              <BookOpen size={24} />
            </div>

            {/* Student Avatar Circle */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white shadow-md mx-auto overflow-hidden bg-white mb-4">
              <img
                src={
                  student.fotoUrl ||
                  'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80'
                }
                alt={student.nome}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Title & Subtitle */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              O Álbum da Primeira Infância
            </h1>
            <p className="text-xs sm:text-sm md:text-base font-semibold text-slate-600 mt-1.5 max-w-xl mx-auto">
              A Linda Jornada de Aprendizado, Afeto e Descobertas de uma Vida Inteira
            </p>

            {/* Child Name & Class Pill */}
            <h2 className="text-2xl sm:text-3xl font-black text-indigo-950 mt-4">
              {student.nome}
            </h2>
            <div className="inline-block mt-2 bg-white/90 border border-slate-200 px-4 py-1.5 rounded-full text-xs font-black uppercase text-slate-700 tracking-wider shadow-xs">
              SALA: {student.sala || 'MATERNAL I'} • ANO LETIVO 2026
            </div>
          </div>

          {/* Section: Registro de Momentos Especiais - Matching Screenshot 2.jpg */}
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <h3 className="text-lg sm:text-xl font-black text-slate-800 flex items-center gap-2">
                <Bookmark className="text-indigo-600" size={22} />
                <span>Registro de Momentos Especiais</span>
              </h3>
              <span className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-full">
                {moments.length} {moments.length === 1 ? 'Lembrança' : 'Lembranças'}
              </span>
            </div>

            {/* Moments List */}
            {moments.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200 p-6">
                <p className="text-sm font-medium text-slate-500">
                  Nenhum momento registrado ainda no álbum.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {moments.map((m) => (
                  <div
                    key={m.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition flex flex-col sm:flex-row gap-5 items-start"
                  >
                    {/* Moment Photo */}
                    <div className="w-full sm:w-44 h-40 sm:h-36 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-100">
                      <img
                        src={
                          m.fotoUrl ||
                          'https://images.unsplash.com/photo-1596464716127-f2a829822301?w=800&auto=format&fit=crop&q=80'
                        }
                        alt={m.titulo}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Moment Information */}
                    <div className="flex-1 space-y-2 w-full">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold px-3 py-0.5 rounded-full">
                          {m.tipoLabel || 'Atividade Pedagógica'}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          {m.data}
                        </span>
                      </div>

                      <h4 className="text-base sm:text-lg font-black text-slate-800 leading-snug">
                        {m.titulo}
                      </h4>

                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {m.descricao}
                      </p>

                      {/* Tags (Focus / Values) */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        {m.foco?.map((f, idx) => (
                          <span
                            key={`foco-${idx}`}
                            className="bg-amber-50 text-amber-900 border border-amber-200/80 text-[10px] font-bold px-2.5 py-0.5 rounded-lg"
                          >
                            {f}
                          </span>
                        ))}
                        {m.valores?.map((v, idx) => (
                          <span
                            key={`val-${idx}`}
                            className="bg-indigo-50 text-indigo-900 border border-indigo-200/80 text-[10px] font-bold px-2.5 py-0.5 rounded-lg"
                          >
                            {v}
                          </span>
                        ))}
                      </div>

                      {/* Author Tag */}
                      <div className="text-right pt-2 border-t border-slate-100 mt-2">
                        <span className="text-[11px] italic font-medium text-slate-400">
                          Registrado por: Professora Titular
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
