import React, { useState } from 'react';
import { db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function AuraModule({ studentId }: { studentId: string }) {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const askAura = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `Como educador, sugira uma atividade pedagógica lúdica para uma criança com o seguinte perfil/contexto: ${prompt}` }),
      });
      const data = await res.json();
      setResponse(data.text);
    } catch (error) {
      console.error('Erro ao consultar Aura:', error);
      setResponse('Desculpe, não consegui processar sua pergunta agora.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
      <h2 className="text-xl font-black text-slate-800">✨ Anjinha Aura</h2>
      <p className="text-sm text-slate-600">Peça sugestões de atividades ou ajuda com relatórios.</p>
      
      <textarea 
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        placeholder="Ex: Sugira uma atividade de coordenação motora para criança de 2 anos..."
        className="w-full text-sm p-4 border border-slate-200 rounded-xl"
        rows={3}
      />
      
      <button 
        onClick={askAura}
        disabled={isLoading}
        className="w-full bg-teal-600 text-white py-3 rounded-xl font-black text-sm hover:bg-teal-700 disabled:bg-slate-300 transition-all cursor-pointer"
      >
        {isLoading ? 'Pensando...' : 'Perguntar à Aura'}
      </button>
      
      {response && (
        <div className="p-4 bg-teal-50 rounded-xl border border-teal-100 text-sm text-teal-900">
          <p className="font-bold mb-1">Resposta da Aura:</p>
          {response}
        </div>
      )}
    </div>
  );
}
