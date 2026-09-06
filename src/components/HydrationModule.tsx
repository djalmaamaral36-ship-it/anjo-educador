import React, { useState } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { HydrationRecord } from '../types';
import { VoiceInput } from './VoiceInput';

export default function HydrationModule({ studentId }: { studentId: string }) {
  const [amount, setAmount] = useState<number>(0);

  const handleRegister = async (value: number) => {
    try {
      const record: Omit<HydrationRecord, 'id'> = {
        studentId,
        amountMl: value,
        timestamp: new Date().toISOString()
      };
      
      await addDoc(collection(db, 'hidratacao'), record);
      alert('Registro de hidratação salvo!');
    } catch (error) {
      console.error('Erro ao salvar hidratação:', error);
      alert('Erro ao salvar. Tente novamente.');
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
      <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
        <span className="flex items-center gap-2">💧 Hidratação</span>
        <VoiceInput onTranscript={text => {
           const match = text.match(/\d+/);
           if (match) handleRegister(Number(match[0]));
        }} size="sm" />
      </h3>
      
      <div className="flex items-center gap-3">
        <input
          type="number"
          value={amount === 0 ? '' : amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          placeholder="Quantidade (ml)"
          className="flex-1 text-sm px-4 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:ring-1 focus:outline-hidden text-slate-800 font-bold"
        />
        <button
          onClick={() => handleRegister(amount)}
          className="bg-sky-500 text-white px-5 py-2 rounded-xl font-black text-xs hover:bg-sky-600 transition-all shadow-2xs"
        >
          REGISTRAR
        </button>
      </div>
      
      <div className="flex flex-wrap gap-2 pt-2">
        {[100, 200, 300].map((ml) => (
          <button
            key={ml}
            type="button"
            onClick={() => handleRegister(ml)}
            className="px-3 py-1 bg-sky-50 text-sky-800 border border-sky-200 rounded-lg text-[10px] font-black hover:bg-sky-100 transition-all cursor-pointer"
          >
            {ml}ml
          </button>
        ))}
      </div>
    </div>
  );
}
