import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BannerHeader from './BannerHeader';
import HydrationModule from './HydrationModule';
import AlimentacaoModule from './AlimentacaoModule';
import HumorModule from './HumorModule';
import HealthModule from './HealthModule';
import FamilyDashboard from './FamilyDashboard';
import AuraModule from './AuraModule';

type Tab = 'hidratacao' | 'alimentacao' | 'humor' | 'saude' | 'familia' | 'aura';

export default function Dashboard({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState<Tab>('hidratacao');
  const navigate = useNavigate();

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'hidratacao', label: 'Hidratação', icon: '💧' },
    { id: 'alimentacao', label: 'Alimentação', icon: '🍎' },
    { id: 'humor', label: 'Humor', icon: '😊' },
    { id: 'saude', label: 'Saúde', icon: '❤️' },
    { id: 'familia', label: 'Família', icon: '👪' },
    { id: 'aura', label: 'Aura', icon: '✨' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <BannerHeader user={user} />
      
      <div className="p-6">
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => tab.id === 'aura' ? navigate('/aura') : setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-black transition-all cursor-pointer ${
                activeTab === tab.id 
                  ? 'bg-sky-600 text-white shadow-md' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="max-w-xl">
          {activeTab === 'hidratacao' && <HydrationModule studentId="aluno_exemplo_123" />}
          {activeTab === 'alimentacao' && <AlimentacaoModule studentId="aluno_exemplo_123" />}
          {activeTab === 'humor' && <HumorModule studentId="aluno_exemplo_123" />}
          {activeTab === 'saude' && <HealthModule studentId="aluno_exemplo_123" />}
          {activeTab === 'familia' && <FamilyDashboard studentId="aluno_exemplo_123" />}
          {activeTab === 'aura' && <AuraModule studentId="aluno_exemplo_123" />}
        </div>
      </div>
    </div>
  );
}
