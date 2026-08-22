import React, { useState, useRef, useEffect } from 'react';
import { Usuario } from '../types';
import { getFromDB, saveToDB, compressImage, isPinUnique } from '../data';
import { 
  X, 
  Camera, 
  Upload, 
  User, 
  Mail, 
  Phone, 
  Key, 
  Check, 
  RefreshCw, 
  Sparkles,
  ShieldCheck,
  Image as ImageIcon
} from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  usuarioAtual: Usuario | null;
  onSaveUsuario: (updatedUser: Usuario) => void;
}

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200'
];

export default function EditProfileModal({
  isOpen,
  onClose,
  usuarioAtual,
  onSaveUsuario
}: EditProfileModalProps) {
  if (!isOpen || !usuarioAtual) return null;

  const [nome, setNome] = useState(usuarioAtual.nome || '');
  const [email, setEmail] = useState(usuarioAtual.email === 'sem_email@anjo.com' ? '' : (usuarioAtual.email || ''));
  const [telefone, setTelefone] = useState(usuarioAtual.telefone || '');
  const [foto, setFoto] = useState(usuarioAtual.foto || '');
  const [pin, setPin] = useState(usuarioAtual.pin || '1234');
  const [observacoes, setObservacoes] = useState(usuarioAtual.observacoes || '');

  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Camera capture states
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (usuarioAtual) {
      setNome(usuarioAtual.nome || '');
      setEmail(usuarioAtual.email === 'sem_email@anjo.com' ? '' : (usuarioAtual.email || ''));
      setTelefone(usuarioAtual.telefone || '');
      setFoto(usuarioAtual.foto || '');
      setPin(usuarioAtual.pin || '1234');
      setObservacoes(usuarioAtual.observacoes || '');
    }
  }, [usuarioAtual, isOpen]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  };

  const startCamera = async (facing: 'user' | 'environment' = cameraFacing) => {
    stopCamera();
    setCameraError(null);
    setIsCapturing(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error("Erro ao abrir câmera:", err);
      setCameraError("Não foi possível acessar a câmera. Verifique as permissões do seu navegador.");
      setIsCapturing(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, 300, 300);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
      setFoto(dataUrl);
      setSuccessMsg("Foto capturada pela câmera com sucesso!");
      setTimeout(() => setSuccessMsg(''), 3000);
    }
    stopCamera();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Compress image to 250x250, quality 0.5 to keep file small (<12KB)
      const compressedDataUrl = await compressImage(file, 250, 250, 0.5);
      setFoto(compressedDataUrl);
      setSuccessMsg("Sua foto foi enviada e otimizada com sucesso!");
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error("Erro ao comprimir imagem enviada:", err);
      const reader = new FileReader();
      reader.onload = (evt) => {
        setFoto(evt.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErrorMsg("O nome de usuário não pode ficar em branco.");
      return;
    }

    const newPin = pin.trim() || usuarioAtual.pin || '1234';

    // Check if PIN is unique
    const pinCheck = isPinUnique(newPin, usuarioAtual.id);
    if (!pinCheck.isUnique) {
      setErrorMsg(`⚠️ O PIN "${newPin}" já está em uso por ${pinCheck.conflictingUser?.nome || 'outro usuário'}. Por favor, escolha um PIN exclusivo de 4 dígitos.`);
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    try {
      const allUsers = getFromDB<Usuario[]>('anjo_usuarios', []);
      const updatedUser: Usuario = {
        ...usuarioAtual,
        nome: nome.trim(),
        email: email.trim() || 'sem_email@anjo.com',
        telefone: telefone.trim() || usuarioAtual.telefone || '(11) 98765-9181',
        foto: foto.trim() || usuarioAtual.foto,
        pin: newPin,
        observacoes: observacoes.trim() || usuarioAtual.observacoes
      };

      const exists = allUsers.some(u => u.id === usuarioAtual.id);
      const updatedUsersList = exists
        ? allUsers.map(u => u.id === usuarioAtual.id ? updatedUser : u)
        : [updatedUser, ...allUsers];

      // Save to localStorage AND sync with Firestore 'usuarios'
      saveToDB('anjo_usuarios', updatedUsersList);

      // Save active session
      localStorage.setItem('anjo_simulacao_user_id', updatedUser.id);

      // Notify parent App component
      onSaveUsuario(updatedUser);

      setSuccessMsg("✨ Perfil e foto atualizados permanentemente!");
      setTimeout(() => {
        setIsSaving(false);
        setSuccessMsg('');
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error("Erro ao salvar perfil:", err);
      setErrorMsg("Não foi possível salvar as alterações. Tente novamente.");
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full overflow-hidden text-slate-850 dark:text-slate-100 my-8">
        
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/15 shrink-0">
              <User className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight">Editar Meu Perfil</h3>
              <p className="text-xs text-indigo-200/90 font-medium">
                Altere sua foto oficial, nome e dados cadastrais
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-2xl text-xs font-bold flex items-center gap-2 animate-bounce">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-2xl text-xs font-bold flex items-center gap-2">
              <X className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Photo Preview & Options */}
          <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Foto do Perfil de Usuário
            </label>

            {isCapturing ? (
              <div className="space-y-3 flex flex-col items-center">
                <div className="relative w-48 h-48 rounded-2xl overflow-hidden border-2 border-indigo-500 bg-black shadow-md">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                </div>
                {cameraError && <p className="text-xs text-rose-500 font-semibold">{cameraError}</p>}
                <div className="flex flex-wrap gap-2 justify-center">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Camera className="w-4 h-4" /> Capturar Foto
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const nextFacing = cameraFacing === 'user' ? 'environment' : 'user';
                      setCameraFacing(nextFacing);
                      startCamera(nextFacing);
                    }}
                    className="px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Inverter
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative shrink-0">
                  <img
                    referrerPolicy="no-referrer"
                    src={foto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                    alt="Foto do perfil"
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-500/30 shadow-md"
                  />
                  {foto && foto.startsWith('data:') && (
                    <span className="absolute -bottom-1 -right-1 bg-emerald-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-xs">
                      SUA FOTO
                    </span>
                  )}
                </div>

                <div className="space-y-2 w-full">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => startCamera('user')}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold border border-indigo-200 dark:border-indigo-800 cursor-pointer flex items-center gap-1.5 transition-colors"
                    >
                      <Camera className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Câmera
                    </button>

                    <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-600 cursor-pointer flex items-center gap-1.5 transition-colors">
                      <Upload className="w-3.5 h-3.5 text-slate-500" /> Enviar Arquivo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* URL Input */}
                  <input
                    type="text"
                    value={foto.startsWith('data:') ? '' : foto}
                    onChange={e => setFoto(e.target.value)}
                    placeholder="Ou cole a URL da imagem..."
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20"
                  />

                  {/* Predefined Avatars */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block mb-1">Ou escolha um avatar predefinido:</span>
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      {DEFAULT_AVATARS.map((avUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setFoto(avUrl)}
                          className={`w-7 h-7 rounded-full overflow-hidden border-2 cursor-pointer shrink-0 transition-transform ${
                            foto === avUrl ? 'border-indigo-600 scale-110 ring-2 ring-indigo-500/30' : 'border-slate-300 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img referrerPolicy="no-referrer" src={avUrl} alt="Avatar" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Full Name */}
          <div className="space-y-1">
            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-500" /> Nome Completo
            </label>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: Djalma Amaral"
              required
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20 font-medium"
            />
          </div>

          {/* User Email & Phone Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-500" /> E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="exemplo@email.com"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-indigo-500" /> Telefone / WhatsApp
              </label>
              <input
                type="text"
                value={telefone}
                onChange={e => setTelefone(e.target.value)}
                placeholder="(11) 98765-4321"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* User PIN & Role Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-500" /> PIN de Acesso (4 Dígitos)
              </label>
              <input
                type="text"
                maxLength={6}
                value={pin}
                onChange={e => setPin(e.target.value)}
                placeholder="1234"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono font-bold tracking-widest focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Nível do Perfil
              </label>
              <div className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">
                {usuarioAtual.tipo === 'desenvolvedor' ? '💻 Desenvolvedor Master' :
                 usuarioAtual.tipo === 'diretor' ? '👔 Direção / Administrador' :
                 usuarioAtual.tipo === 'coordenador' ? '👩‍🏫 Coordenador(a)' :
                 usuarioAtual.tipo === 'professor' ? '👨‍🏫 Professor(a)' :
                 '👨‍👩‍👧 Familiar'}
              </div>
            </div>
          </div>

          {/* Observações / Bio */}
          <div className="space-y-1">
            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
              Observações / Bio
            </label>
            <textarea
              rows={2}
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
              placeholder="Breve descrição do seu perfil..."
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Buttons Footer */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs font-extrabold rounded-xl shadow-md cursor-pointer flex items-center gap-2 transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
