import React from 'react';
import { Mail, Phone, ShieldCheck, Heart, User } from 'lucide-react';
import { CONTATO_SUPORTE } from '../data/mockData';

interface ModalSuporteContatoProps {
  isOpen?: boolean;
  onClose?: () => void;
  onFechar?: () => void;
}

export const ModalSuporteContato: React.FC<ModalSuporteContatoProps> = ({ isOpen = true, onClose, onFechar }) => {
  const handleFechar = onClose || onFechar || (() => {});
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Suporte & Atendimento</h3>
              <p className="text-xs text-slate-500">Anjinho Educador</p>
            </div>
          </div>
          <button
            onClick={handleFechar}
            className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold text-xs"
          >
            ✕
          </button>
        </div>

        {/* Informações de Contato */}
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <User className="w-4 h-4 text-emerald-600" />
              <span>{CONTATO_SUPORTE.nome}</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Mail className="w-4 h-4 text-emerald-600" />
              <a href={`mailto:${CONTATO_SUPORTE.email}`} className="hover:underline font-medium text-slate-800">
                {CONTATO_SUPORTE.email}
              </a>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Phone className="w-4 h-4 text-emerald-600" />
              <a href={`https://wa.me/5514997519181`} target="_blank" rel="noreferrer" className="hover:underline font-bold text-emerald-700">
                {CONTATO_SUPORTE.telefone} (WhatsApp Direto)
              </a>
            </div>
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Suporte ativo para tirar dúvidas pedagógicas e técnicas sobre o Anjinho Educador.</span>
          </div>
        </div>

        {/* Botão WhatsApp */}
        <div className="pt-2">
          <a
            href="https://wa.me/5514997519181?text=Olá,%20preciso%20de%20suporte%20no%20Anjinho%20Educador!"
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition"
          >
            <Phone className="w-4 h-4" />
            <span>Chamar no WhatsApp ({CONTATO_SUPORTE.telefone})</span>
          </a>
        </div>

      </div>
    </div>
  );
};
