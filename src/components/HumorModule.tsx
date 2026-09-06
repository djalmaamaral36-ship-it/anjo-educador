import React, { useState } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { HumorRecord } from '../types';
import { VoiceInput } from './VoiceInput';

export default function HumorModule({ studentId }: { studentId: string }) {
  const [mood, setMood] = useState('Calmo / Sereno');
  const [note, setNote] = useState('');

  const handleRegister = async () => {
    try {
      const record: Omit<HumorRecord, 'id'> = {
        studentId,
        mood,
        note,
        timestamp: new Date().toISOString()
      };
      
      await addDoc(collection(db, 'humor'), record);
      setNote('');
      alert('Registro de humor salvo!');
    } catch (error) {
      console.error('Erro ao salvar humor:', error);
      alert('Erro ao salvar.');
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
      <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
        <span className="flex items-center gap-2">😊 Estado de Humor</span>
        <VoiceInput onTranscript={setNote} size="sm" />
      </h3>
      
      <select
        value={mood}
        onChange={(e) => setMood(e.target.value)}
        className="w-full text-sm px-4 py-2 border border-slate-300 rounded-xl bg-slate-50 font-bold"
      >
        <option>Calmo / Sereno</option>
        <option>Alegre</option>
        <option>Choroso</option>
      </select>
      
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Nota rápida..."
        className="w-full text-sm px-4 py-2 border border-slate-300 rounded-xl bg-slate-50 h-20"
      />
      
      <button
        onClick={handleRegister}
        className="w-full bg-indigo-500 text-white py-3 rounded-xl font-black text-xs hover:bg-indigo-600 transition-all shadow-2xs"
      >
        SALVAR REGISTROS DE HUMOR
      </button>
    </div>
  );
}
