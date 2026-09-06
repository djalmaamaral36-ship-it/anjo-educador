import React, { useState } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { AlimentacaoRecord } from '../types';
import { VoiceInput } from './VoiceInput';

export default function AlimentacaoModule({ studentId }: { studentId: string }) {
  const [foodType, setFoodType] = useState('Mamadeira');
  const [acceptance, setAcceptance] = useState('Tomou Tudo / Super Bem');

  const handleRegister = async (food?: string, acc?: string) => {
    try {
      const record: Omit<AlimentacaoRecord, 'id'> = {
        studentId,
        foodType: food || foodType,
        acceptance: acc || acceptance,
        timestamp: new Date().toISOString()
      };
      
      await addDoc(collection(db, 'alimentacao'), record);
      alert('Registro de alimentação salvo!');
    } catch (error) {
      console.error('Erro ao salvar alimentação:', error);
      alert('Erro ao salvar. Tente novamente.');
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
      <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
        <span className="flex items-center gap-2">☕ Alimentação & Mamadeira</span>
      </h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Refeição</label>
          <select value={foodType} onChange={(e) => setFoodType(e.target.value)} className="w-full text-sm px-4 py-2 border border-slate-300 rounded-xl bg-slate-50 font-bold">
            <option>Mamadeira</option>
            <option>Frutinha</option>
            <option>Almoço</option>
            <option>Lanchinho da Tarde</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Aceitação</label>
          <select value={acceptance} onChange={(e) => setAcceptance(e.target.value)} className="w-full text-sm px-4 py-2 border border-slate-300 rounded-xl bg-slate-50 font-bold">
            <option>Tomou Tudo / Super Bem</option>
            <option>Comeu Pouco</option>
            <option>Recusou</option>
          </select>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 pt-2">
        {['Tomou Tudo', 'Comeu Pouco', 'Recusou'].map((acc) => (
          <button key={acc} type="button" onClick={() => handleRegister(foodType, acc)} className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-[10px] font-black hover:bg-amber-100 transition-all cursor-pointer">
            {acc}
          </button>
        ))}
      </div>

      <button
        onClick={() => handleRegister()}
        className="w-full bg-amber-500 text-white py-3 rounded-xl font-black text-xs hover:bg-amber-600 transition-all shadow-2xs"
      >
        REGISTRAR REFEIÇÃO
      </button>
    </div>
  );
}
