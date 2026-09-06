import React, { useState } from 'react';
import { Menu, LogOut, User } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';

export default function BannerHeader({ user }: { user: any }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="bg-teal-700 text-white w-full">
      {/* Banner Superior */}
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-teal-700 font-black">A</div>
          <div>
            <h1 className="font-black text-lg">Anjinho Educador</h1>
            <p className="text-xs opacity-80">Gestão do Cuidado</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold">{user?.displayName || 'Usuário'}</p>
            <p className="text-[10px] opacity-75">Professor Titular</p>
          </div>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 bg-teal-800 rounded-lg hover:bg-teal-900 transition-all cursor-pointer"
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Menu Hamburguer (Dropdown) */}
      {isMenuOpen && (
        <div className="absolute right-6 top-20 bg-white text-slate-800 shadow-xl rounded-2xl p-4 w-48 z-50 border border-slate-100">
          <div className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
            <User size={16} />
            <span className="text-sm font-bold">Perfil</span>
          </div>
          <button 
            onClick={() => signOut(auth)}
            className="flex w-full items-center gap-2 p-2 hover:bg-red-50 text-red-600 rounded-lg cursor-pointer"
          >
            <LogOut size={16} />
            <span className="text-sm font-bold">Sair</span>
          </button>
        </div>
      )}
    </div>
  );
}
