import React from 'react';
import { auth, googleProvider, signInWithPopup } from '../services/firebase';
import { useNavigate } from 'react-router-dom';
import TelaAtalhoSimuladorModal, { AtalhoPerfil } from './comum/TelaAtalhoSimuladorModal';

export default function Login() {
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/');
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      alert('Falha no login com Google. Você pode simular qualquer perfil abaixo.');
    }
  };

  const handleConfirmProfile = (perfil: AtalhoPerfil) => {
    localStorage.setItem(
      'anjinho_simulated_user',
      JSON.stringify({
        displayName: perfil.tituloExibicao,
        email: `${perfil.id}@escola.com`,
        role: perfil.role,
        tabDestino: perfil.tabDestino,
        alunoPadraoId: perfil.alunoPadraoId,
      })
    );
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#fbf9f4] flex flex-col items-center justify-center p-3 sm:p-6">
      <TelaAtalhoSimuladorModal
        isOpen={true}
        onClose={() => {}}
        activeRole="professor"
        activeTab="diario_escolar"
        onConfirmProfile={handleConfirmProfile}
      />
    </div>
  );
}
