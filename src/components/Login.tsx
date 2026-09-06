import React from 'react';
import { auth, googleProvider, signInWithPopup } from '../services/firebase';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/');
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      alert('Falha no login. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="p-8 bg-white rounded-xl shadow-md">
        <h1 className="text-xl font-bold mb-4">Login Anjinho Educador</h1>
        <button 
          onClick={handleGoogleLogin}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Entrar com Google
        </button>
      </div>
    </div>
  );
}
