import React from 'react';
import { Heart, Mic, Sparkles, Send, CheckCircle2, MessageSquare, BookOpen, X } from 'lucide-react';

interface ModalGuiaRecadinhoProps {
  isOpen: boolean;
  onClose: () => void;
  onIrParaDiario?: () => void;
}

export const ModalGuiaRecadinho: React.FC<ModalGuiaRecadinhoProps> = ({ isOpen, onClose, onIrParaDiario }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-100 relative">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center font-bold shadow-xs">
              <Heart className="w-5 h-5 fill-rose-500" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Como a Educadora Insere o Recadinho?</h3>
              <p className="text-xs text-slate-500">Passo a passo simples de uso no final do Diário de Aula</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold text-xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Passo a Passo */}
        <div className="space-y-4 text-xs">
          {/* Passo 1 */}
          <div className="flex items-start gap-3 bg-rose-50/60 p-3.5 rounded-2xl border border-rose-100">
            <div className="w-7 h-7 bg-rose-600 text-white rounded-xl flex items-center justify-center font-black text-xs shrink-0">
              1
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-slate-800 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                <span>No Final da Tela do Diário de Aula</span>
              </h4>
              <p className="text-slate-600 leading-relaxed">
                Role a página do Diário de Aula até o final. Encontre o cartão rosa destacado chamado <strong>"Recadinho da Educadora para a Turma"</strong>.
              </p>
            </div>
          </div>

          {/* Passo 2 */}
          <div className="flex items-start gap-3 bg-amber-50/60 p-3.5 rounded-2xl border border-amber-100">
            <div className="w-7 h-7 bg-amber-500 text-slate-950 rounded-xl flex items-center justify-center font-black text-xs shrink-0">
              2
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-slate-800 flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-amber-600" />
                <span>Digite, Dite por Voz ou Use Sugestões Rápidas</span>
              </h4>
              <p className="text-slate-600 leading-relaxed">
                Você tem 3 opções fáceis:
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-1 pt-1">
                <li><strong>Digitação direta:</strong> Escreva a mensagem personalizada no campo de texto.</li>
                <li><strong>Ditar por Voz (🎙️):</strong> Fale diretamente com seu microfone e o sistema transcreve.</li>
                <li><strong>Sugestão da Anjinha Aura (👼):</strong> Clique nos botões pré-prontos para gerar uma mensagem afetiva instantânea!</li>
              </ul>
            </div>
          </div>

          {/* Passo 3 */}
          <div className="flex items-start gap-3 bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-100">
            <div className="w-7 h-7 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-black text-xs shrink-0">
              3
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-slate-800 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-emerald-600" />
                <span>Salvar & Enviar no Relatório WhatsApp dos Pais</span>
              </h4>
              <p className="text-slate-600 leading-relaxed">
                Ao clicar em <strong>"Salvar Recadinho"</strong> ou <strong>"Gerar Relatório WhatsApp"</strong>, a mensagem será automaticamente incluída no final de cada diário individual assinado pela professora!
              </p>
            </div>
          </div>
        </div>

        {/* Botão de Ação */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={() => {
              onClose();
              if (onIrParaDiario) onIrParaDiario();
            }}
            className="w-full sm:w-auto px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Entendi, Ir para o Diário de Aula</span>
          </button>
        </div>
      </div>
    </div>
  );
};
