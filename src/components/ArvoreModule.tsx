import React, { useEffect, useState } from 'react';
import { db } from '../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function ArvoreModule({ studentId }: { studentId: string }) {
  const [dailyReports, setDailyReports] = useState<Record<string, any[]>>({});

  useEffect(() => {
    const fetchData = async () => {
      const collections = ['hidratacao', 'alimentacao', 'humor', 'saude'];
      const reports: Record<string, any[]> = {};
      
      for (const col of collections) {
        const q = query(collection(db, col), where('studentId', '==', studentId));
        const snapshot = await getDocs(q);
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          const date = new Date(data.timestamp).toLocaleDateString('pt-BR');
          if (!reports[date]) reports[date] = [];
          reports[date].push({ col, ...data });
        });
      }
      setDailyReports(reports);
    };
    fetchData();
  }, [studentId]);

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
      <h3 className="text-xl font-black text-slate-800">📖 Diário de Bordo</h3>
      {Object.entries(dailyReports).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()).map(([date, items]) => (
        <div key={date} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
          <h4 className="font-bold text-indigo-700 text-sm border-b border-indigo-100 pb-2">{date}</h4>
          <p className="text-sm text-slate-700 leading-relaxed">
            Neste dia, Mariana teve os seguintes registros: {items.map(item => item.col).join(', ')}. 
            {/* Aqui podemos expandir para uma narrativa mais completa */}
          </p>
        </div>
      ))}
    </div>
  );
}
