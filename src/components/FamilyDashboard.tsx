import React, { useEffect, useState } from 'react';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

interface Registro {
  id: string;
  tipo: string;
  timestamp: string;
  detalhes: string;
}

export default function FamilyDashboard({ studentId }: { studentId: string }) {
  const [registros, setRegistros] = useState<Registro[]>([]);

  useEffect(() => {
    const fetchRegistros = async () => {
      const collectionsToFetch = [
        { name: 'hidratacao', label: 'Hidratação', map: (d: any) => `${d.amountMl}ml` },
        { name: 'alimentacao', label: 'Alimentação', map: (d: any) => `${d.foodType} - ${d.acceptance}` },
        { name: 'humor', label: 'Humor', map: (d: any) => `${d.state}` },
        { name: 'saude', label: 'Saúde', map: (d: any) => `${d.sleep || ''} ${d.diaper || ''} ${d.temp || ''}` },
      ];

      let allRegistros: Registro[] = [];

      for (const col of collectionsToFetch) {
        const q = query(collection(db, col.name), where('studentId', '==', studentId));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          tipo: col.label,
          timestamp: doc.data().timestamp,
          detalhes: col.map(doc.data())
        })) as Registro[];
        allRegistros = [...allRegistros, ...data];
      }

      // Sort by timestamp descending
      allRegistros.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRegistros(allRegistros);
    };
    fetchRegistros();
  }, [studentId]);

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
      <h2 className="text-xl font-black text-slate-800">Área da Família</h2>
      <div className="space-y-2">
        {registros.map(reg => (
          <div key={reg.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between">
            <span className="font-bold text-slate-700">{reg.tipo}</span>
            <span className="text-slate-500">{reg.detalhes}</span>
            <span className="text-[10px] text-slate-400">{new Date(reg.timestamp).toLocaleTimeString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
