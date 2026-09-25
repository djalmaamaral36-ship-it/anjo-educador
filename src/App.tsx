import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebase';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        const stored = localStorage.getItem('anjinho_simulated_user');
        if (stored) {
          try {
            setUser(JSON.parse(stored));
          } catch {
            setUser({ displayName: 'Ana Silva (Professora Titular)', email: 'ana.silva@escola.com' });
          }
        } else {
          const defaultSimulated = { displayName: 'Ana Silva (Professora Titular)', email: 'ana.silva@escola.com' };
          localStorage.setItem('anjinho_simulated_user', JSON.stringify(defaultSimulated));
          setUser(defaultSimulated);
        }
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route path="/" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}
