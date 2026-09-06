import React, { useState } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { HealthRecord } from '../types';
import { VoiceInput } from './VoiceInput';

export default function HealthModule({ studentId }: { studentId: string }) {
  const [sleep, setSleep] = useState('');
  const [diaper, setDiaper] = useState('');
  const [temp, setTemp] = useState('');

  const handleRegister = async (data: Partial<HealthRecord>) => {
    try {
      await addDoc(collection(db, 'saude'), {
        studentId,
        sleep: data.sleep || sleep,
        diaper: data.diaper || diaper,
        temp: data.temp || temp,
        timestamp: new Date().toISOString()
      });
      alert('Registro de saúde salvo!');
    } catch (error) {
      console.error('Erro ao salvar saúde:', error);
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
      <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
        <span className="flex items-center gap-2">❤️ Saúde, Sono & Fralda</span>
        <VoiceInput onTranscript={text => setSleep(text)} size="sm" />
      </h3>
      
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-500 uppercase">Soneca / Descanso</label>
        <input type="text" value={sleep} onChange={e => setSleep(e.target.value)} placeholder="Ex: Dormiu das 13:00 As 14:30" className="w-full text-sm px-4 py-2 border rounded-xl" />
        <div className="flex flex-wrap gap-2">
          {['30m', '1h', '1h30', '2h', 'Não dormiu'].map(opt => (
            <button key={opt} type="button" onClick={() => setSleep(opt)} className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black hover:bg-slate-200 cursor-pointer">{opt}</button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-500 uppercase">Fralda (Xixi ou Coco)</label>
        <input type="text" value={diaper} onChange={e => setDiaper(e.target.value)} placeholder="Ex: Fez Coco / Pomada" className="w-full text-sm px-4 py-2 border rounded-xl" />
        <div className="flex flex-wrap gap-2">
          {['Apenas Xixi', 'Apenas Coco', 'Xixi e Coco', '+ Pomada', 'Seca/Limpa'].map(opt => (
            <button key={opt} type="button" onClick={() => setDiaper(prev => prev ? `${prev} e ${opt}` : opt)} className="px-3 py-1 bg-sky-50 text-sky-800 border border-sky-100 rounded-lg text-[10px] font-black hover:bg-sky-100 cursor-pointer">{opt}</button>
          ))}
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-500 uppercase">Febre / Temperatura (°C)</label>
        <input 
          type="number" 
          step="0.1" 
          value={temp} 
          onChange={e => setTemp(e.target.value)} 
          placeholder="Ex: 36.5" 
          className={`w-full text-sm px-4 py-2 border rounded-xl font-bold ${parseFloat(temp) > 37.5 ? 'bg-red-50 border-red-500 text-red-700' : 'bg-slate-50'}`}
        />
        {parseFloat(temp) > 37.5 && <p className="text-[10px] font-black text-red-600">⚠️ ALERTA: TEMPERATURA ELEVADA!</p>}
      </div>
      
      <button type="button" onClick={() => handleRegister({})} className="w-full bg-rose-500 text-white py-3 rounded-xl font-black text-xs hover:bg-rose-600 transition-all cursor-pointer">
        SALVAR REGISTROS DE SAÚDE
      </button>
    </div>
  );
}
