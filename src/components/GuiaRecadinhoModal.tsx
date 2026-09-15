import React from 'react';
import { MessageSquareHeart, CheckCircle, Mic, Edit3, Send, Sparkles, BookOpen, Layers } from 'lucide-react';

interface GuiaRecadinhoModalProps {
  onFechar: () => void;
  onIrParaRecadinho: () => void;
}

export const GuiaRecadinhoModal: React.FC<GuiaRecadinhoModalProps> = ({ onFechar, onIrParaRecadinho }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center">
              <MessageSquareHeart className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-800">Guia: Recadinho da Educadora no Diário</h2>
              <p className="text-xs text-slate-500">Como inserir a mensagem carinhosa e pedagógica no final do diário de aula</p>
            </div>
          </div>
          <button
            onClick={onFechar}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {/* Passo a Passo Ilustrado */}
        <div className="space-y-4">
          {/* Passo 1 */}
          <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100 flex items-start gap-4">
            <div className="w-8 h-8 bg-rose-600 text-white rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
              1
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-rose-600" />
                No Painel "Recadinho da Educadora"
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Acesse a aba <strong>Recadinho da Educadora</strong> no topo da página. Lá você pode digitar o texto principal da turma ou clicar em modelos pré-prontos como <em>"Dia Especial de Arte"</em> ou <em>"Lembrete de Materiais"</em>.
              </p>
            </div>
          </div>

          {/* Passo 2 */}
          <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-start gap-4">
            <div className="w-8 h-8 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
              2
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Mic className="w-4 h-4 text-emerald-600" />
                Opção de Ditar por Voz
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Para economizar tempo no encerramento da aula, a educadora pode clicar no botão <strong>"Ditar por Voz"</strong> e falar diretamente pelo celular ou computador. O texto é transcrito automaticamente!
              </p>
            </div>
          </div>

          {/* Passo 3 */}
          <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 flex items-start gap-4">
            <div className="w-8 h-8 bg-amber-600 text-white rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
              3
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-600" />
                Recadinho Individual vs. Recadinho da Turma
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Você pode deixar o recadinho <strong>geral da turma</strong> para todas as famílias e, caso alguma criança tenha um detalhe específico (ex: <em>"Arthur dormiu 1h30"</em>), insira no campo <strong>Observação Individual</strong> de cada aluno.
              </p>
            </div>
          </div>

          {/* Passo 4 */}
          <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-start gap-4">
            <div className="w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
              4
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Send className="w-4 h-4 text-indigo-600" />
                Visualização no Envio (WhatsApp ou PDF)
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Quando a professora clica em <strong>"Gerar Relatório WhatsApp"</strong>, o recadinho da educadora aparece automaticamente destacado no final do diário com a assinatura da professora!
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            onClick={onFechar}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
          >
            Entendi
          </button>
          <button
            onClick={() => {
              onFechar();
              onIrParaRecadinho();
            }}
            className="w-full sm:w-auto px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Inserir Recadinho Agora</span>
          </button>
        </div>

      </div>
    </div>
  );
};
