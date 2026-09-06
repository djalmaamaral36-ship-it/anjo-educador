import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import AuraModule from './AuraModule';

export default function AuraPage({ studentId }: { studentId: string }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <button onClick={() => navigate('/')} className="flex items-center gap-2 mb-6 text-slate-400 hover:text-white cursor-pointer">
        <ArrowLeft /> Voltar ao Anjinho
      </button>
      <div className="max-w-2xl mx-auto">
        <AuraModule studentId={studentId} />
      </div>
    </div>
  );
}
