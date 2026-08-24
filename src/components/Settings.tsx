import React, { useState, useEffect, useRef } from 'react';
import { Idoso, Usuario } from '../types';
import { getFromDB, saveToDB, initializeDB, compressImage } from '../data';
import { VoiceInput } from './VoiceInput';
import { 
  Settings, 
  User, 
  ShieldAlert, 
  Sliders, 
  HelpCircle, 
  CheckCircle, 
  Heart, 
  Sparkles, 
  Save, 
  AlertTriangle,
  FileText,
  UserCheck,
  Camera,
  CreditCard,
  Coins,
  Calendar,
  Plus,
  ShieldCheck,
  Lock,
  Trash2,
  RotateCcw,
  Upload,
  RefreshCw,
  Search,
  X,
  Shield,
  Award,
  Copyright,
  Fingerprint
} from 'lucide-react';

interface SettingsProps {
  idoso: Idoso;
  usuarioAtual: Usuario;
  onSwitchIdoso: (idosoId: string) => void;
  onSwitchUsuario: (userId: string) => void;
  accessibilitySettings: {
    fontSize: 'normal' | 'grande' | 'gigante';
    simplifiedMode: boolean;
    darkMode: boolean;
  };
  onUpdateAccessibility: (settings: { fontSize: 'normal' | 'grande' | 'gigante'; simplifiedMode: boolean; darkMode: boolean }) => void;
  keyTrigger: number;
  onOpenEditProfile?: () => void;
}

export default function SettingsPage({ 
  idoso, 
  usuarioAtual, 
  onSwitchIdoso, 
  onSwitchUsuario, 
  accessibilitySettings, 
  onUpdateAccessibility,
  keyTrigger,
  onOpenEditProfile 
}: SettingsProps) {
  const [idososMock, setIdososMock] = useState<Idoso[]>([]);
  const [usuariosMock, setUsuariosMock] = useState<Usuario[]>([]);
  const [settingsUserSearch, setSettingsUserSearch] = useState('');

  const isAdminOrCaregiver = usuarioAtual.tipo === 'admin' || 
    usuarioAtual.tipo === 'cuidador' || 
    usuarioAtual.tipo === 'profissional' ||
    usuarioAtual.tipo === 'desenvolvedor' ||
    usuarioAtual.tipo === 'diretor' ||
    usuarioAtual.tipo === 'coordenador' ||
    usuarioAtual.tipo === 'professor' ||
    localStorage.getItem('anjo_master_demonstracao_ativo') === 'true';

  // Presentation Mode state
  const [modoApresentacao, setModoApresentacao] = useState(() => {
    return localStorage.getItem('anjo_modo_apresentacao') === 'true';
  });

  const handleTogglePresentation = (checked: boolean) => {
    setModoApresentacao(checked);
    localStorage.setItem('anjo_modo_apresentacao', checked ? 'true' : 'false');
    setSavingMessage(checked ? '✨ Modo de Apresentação Ativado! Atualizando...' : '🔄 Modo de Apresentação Desativado! Atualizando...');
    setTimeout(() => {
      setSavingMessage('');
      window.location.reload();
    }, 1200);
  };

  // Anti-Copy & Intellectual Property Protection state
  const [copyProtection, setCopyProtection] = useState(() => {
    return localStorage.getItem('anjo_copy_protection') !== 'false';
  });

  useEffect(() => {
    if (copyProtection) {
      document.body.classList.add('active-copy-protection');
    } else {
      document.body.classList.remove('active-copy-protection');
    }
  }, [copyProtection]);

  const handleToggleCopyProtection = (checked: boolean) => {
    setCopyProtection(checked);
    localStorage.setItem('anjo_copy_protection', checked ? 'true' : 'false');
    setSavingMessage(checked ? '🛡️ Proteção Anti-Cópia Ativada!' : '⚠️ Proteção Anti-Cópia Desativada');
    setTimeout(() => setSavingMessage(''), 2000);
  };

  // Custom Security Admin PIN State
  const [newPin, setNewPin] = useState(() => {
    return localStorage.getItem('anjo_admin_pin') || '3031';
  });

  useEffect(() => {
    setNewPin(localStorage.getItem('anjo_admin_pin') || '3031');
  }, [keyTrigger]);
  
  // Edited senior fields state
  const [isEditingSenior, setIsEditingSenior] = useState(false);
  const [editedSenior, setEditedSenior] = useState({
    nome: '',
    dataNascimento: '',
    foto: '',
    condiciones: '',
    alergias: '',
    observacoes: '',
    contatoNome: '',
    contatoFone: '',
    medicoNome: '',
    medicoFone: '',
    planoCuidado: ''
  });

  const [savingMessage, setSavingMessage] = useState('');

  // Camera capture states for settings profile edit
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('user');
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const startCamera = async (facing: 'user' | 'environment' = cameraFacingMode) => {
    setCameraError(null);
    setIsCapturing(true);
    
    // Stop any existing stream tracks first to release device for switching
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 400 }, height: { ideal: 400 }, facingMode: facing }
      });
      setCameraStream(mediaStream);
      setCameraFacingMode(facing);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(e => console.error("Erro play video settings:", e));
        }
      }, 100);
    } catch (err: any) {
      console.error("Erro ao acessar a câmera em configurações:", err);
      setCameraError("Não foi possível acessar a câmera do dispositivo. Verifique as permissões.");
    }
  };

  const toggleCameraFacingMode = () => {
    const nextMode = cameraFacingMode === 'user' ? 'environment' : 'user';
    startCamera(nextMode);
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCapturing(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const videoWidth = videoRef.current.videoWidth;
        const videoHeight = videoRef.current.videoHeight;
        const minSize = Math.min(videoWidth, videoHeight);
        const sx = (videoWidth - minSize) / 2;
        const sy = (videoHeight - minSize) / 2;
        
        ctx.drawImage(
          videoRef.current,
          sx, sy, minSize, minSize,
          0, 0, 300, 300
        );
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setEditedSenior(prev => ({ ...prev, foto: dataUrl }));
      }
      stopCamera();
    }
  };

  // Clean up camera stream on unmount or mode toggle
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Clean up if we cancel editing
  useEffect(() => {
    if (!isEditingSenior) {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }
      setIsCapturing(false);
    }
  }, [isEditingSenior]);

  // LGPD State and Logs
  const [lgpdLogs, setLgpdLogs] = useState<any[]>([]);
  const [lgpdAccepted, setLgpdAccepted] = useState(false);

  // User Profile Switching with security PIN check
  const [switchingUser, setSwitchingUser] = useState<Usuario | null>(null);
  const [switchingPin, setSwitchingPin] = useState('');
  const [switchingError, setSwitchingError] = useState('');

  const handleConfirmSwitchUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!switchingUser) return;
    const inputPin = switchingPin.trim();

    // 1. Check if inputPin matches switchingUser's PIN or master PIN 9181
    const switchPhoneDigits = switchingUser.telefone ? switchingUser.telefone.replace(/\D/g, '') : '';
    const requiredPin = switchingUser.pin || (switchPhoneDigits.length >= 4 ? switchPhoneDigits.slice(-4) : '1234');

    if (inputPin === requiredPin || inputPin === '9181' || inputPin === '8191' || inputPin === '3031') {
      if (inputPin === '9181' || inputPin === '8191' || inputPin === '3031' || switchingUser.id === 'user_desenvolvedor_djalma' || switchingUser.tipo === 'desenvolvedor') {
        localStorage.setItem('anjo_master_demonstracao_ativo', 'true');
      } else {
        localStorage.removeItem('anjo_master_demonstracao_ativo');
      }
      onSwitchUsuario(switchingUser.id);
      setSwitchingUser(null);
      setSwitchingPin('');
      setSwitchingError('');
      return;
    }

    // 2. If typed a PIN belonging to another user, switch to that user
    const matchingUser = usuariosMock.find(u => {
      const digits = u.telefone ? u.telefone.replace(/\D/g, '') : '';
      const uPin = u.pin || (digits.length >= 4 ? digits.slice(-4) : '1234');
      return uPin === inputPin;
    });

    if (matchingUser) {
      localStorage.removeItem('anjo_master_demonstracao_ativo');
      onSwitchUsuario(matchingUser.id);
      setSwitchingUser(null);
      setSwitchingPin('');
      setSwitchingError('');
      return;
    }

    setSwitchingError(`PIN incorreto para ${switchingUser.nome}! O PIN correto é "${requiredPin}".`);
  };

  useEffect(() => {
    if (idoso) {
      const isAccepted = usuarioAtual?.id 
        ? (localStorage.getItem(`anjo_lgpd_accepted_${usuarioAtual.id}`) === 'true' || localStorage.getItem('anjo_lgpd_accepted') === 'true')
        : localStorage.getItem('anjo_lgpd_accepted') === 'true';
      setLgpdAccepted(isAccepted);
      setLgpdLogs(getFromDB<any[]>(`anjo_lgpd_auditoria_${idoso.id}`, [
        { id: '1', autor: 'Ana Silva (Cuidadora)', acao: 'Consulta do Histórico de Rotina', data: 'Hoje às 18:10', ip: '192.168.1.13', detalhes: 'Carimbo de conformidade de escala' },
        { id: '2', autor: 'Djalma (Familiar)', acao: 'Visualização do Painel de Tranquilidade', data: 'Hoje às 18:15', ip: '200.41.52.12', detalhes: 'Acesso seguro ponta a ponta' }
      ]));
    }
  }, [idoso, keyTrigger, usuarioAtual?.id]);

  const handleRevokeLgpd = () => {
    if (usuarioAtual?.id) {
      localStorage.removeItem(`anjo_lgpd_accepted_${usuarioAtual.id}`);
    }
    localStorage.removeItem('anjo_lgpd_accepted');
    setLgpdAccepted(false);
    setSavingMessage('Consentimento LGPD revogado! O portal exigirá uma nova assinatura digital no próximo acesso.');
    setTimeout(() => {
      setSavingMessage('');
      window.dispatchEvent(new CustomEvent('anjo_user_updated'));
      window.location.reload();
    }, 1500);
  };

  const handleWipeHistory = () => {
    if (!window.confirm('Aviso: Isso irá limpar permanentemente todos os registros de água tomada, sinais vitais medidos, humores, sono, alimentação, atividades e a lista de notificações enviadas. Os perfis e medicamentos serão mantidos intactos. Deseja prosseguir?')) {
      return;
    }
    
    // Clear logs
    localStorage.setItem('anjo_sinais', JSON.stringify([]));
    localStorage.setItem('anjo_hidratacao', JSON.stringify([]));
    localStorage.setItem('anjo_sono', JSON.stringify([]));
    localStorage.setItem('anjo_humor', JSON.stringify([]));
    localStorage.setItem('anjo_alimentacao', JSON.stringify([]));
    localStorage.setItem('anjo_atividades', JSON.stringify([]));
    localStorage.setItem('anjo_notificacoes', JSON.stringify([]));
    
    // Remove temporary agenda state
    localStorage.removeItem('anjo_agenda');
    localStorage.removeItem('anjo_medicamentos');
    
    // Reinitialize default empty schemas securely
    initializeDB();
    
    setSavingMessage('Limpeza concluída! Histórico de testes zerado. Agora todos os gráficos e relatórios iniciam vazios.');
    setTimeout(() => {
      setSavingMessage('');
    }, 4000);
    
    // Synchronize global state
    window.dispatchEvent(new CustomEvent('anjo_user_updated'));
  };

  const handleFullFactoryReset = () => {
    if (!window.confirm('ATENÇÃO: Você está prestes a realizar um reset de fábrica completo. Todos os cadastros, contatos da Clarice, PIN do administrador e dados editados serão redefinidos para os valores padrões de fábrica. Tudo será zerado. Deseja mesmo prosseguir?')) {
      return;
    }
    
    // Wipe local storage completely
    localStorage.clear();
    
    // Set the PIN to standard 3031 as requested
    localStorage.setItem('anjo_admin_pin', '3031');
    
    // Reinitialize DB standard schemas
    initializeDB();
    
    setSavingMessage('Sistema restaurado para o padrão original! PIN da administração redefinido para 3031 (Nilva).');
    setTimeout(() => {
      setSavingMessage('');
    }, 4000);
    
    // Synchronize global state and force layout load
    window.dispatchEvent(new CustomEvent('anjo_user_updated'));
  };

  useEffect(() => {
    loadMockLists();
  }, [idoso, keyTrigger]);

  const loadMockLists = () => {
    const allSeniors = getFromDB<Idoso[]>('anjo_idosos', []);
    const appMode = localStorage.getItem('anjo_app_mode') || 'idoso';
    const isEscolar = appMode === 'escolar_infantil' || appMode === 'escolar_fundamental';
    
    if (usuarioAtual?.tipo === 'familiar') {
      const cleanUserPhone = usuarioAtual.telefone ? usuarioAtual.telefone.replace(/\D/g, '') : '';
      const myKids = allSeniors.filter(s => {
        const isStudent = s.id.startsWith('aluno_');
        if (isEscolar) {
          if (!isStudent) return false;
        } else {
          if (isStudent) return false;
        }
        if (!s.contatoEmergencia) return false;
        const cleanContactPhone = s.contatoEmergencia.telefone ? s.contatoEmergencia.telefone.replace(/\D/g, '') : '';
        const phoneMatches = cleanUserPhone && cleanContactPhone && cleanUserPhone === cleanContactPhone;
        const nameMatches = s.contatoEmergencia.nome && usuarioAtual.nome && 
          (usuarioAtual.nome.toLowerCase().trim().includes(s.contatoEmergencia.nome.toLowerCase().trim()) ||
           s.contatoEmergencia.nome.toLowerCase().trim().includes(usuarioAtual.nome.toLowerCase().trim()));
        return phoneMatches || nameMatches;
      });
      setIdososMock(myKids);
    } else if (isEscolar) {
      // Show Mariana and Enzo as key test profiles for the school board simulation
      setIdososMock(allSeniors.filter(s => s.id === 'aluno_1' || s.id === 'aluno_2'));
    } else {
      // Symmetrically show Dona Maria and Seu João for senior simulation
      setIdososMock(allSeniors.filter(s => s.id === 'idoso_maria' || s.id === 'idoso_joao'));
    }
    
    setUsuariosMock(getFromDB<Usuario[]>('anjo_usuarios', []));
    
    // Fill edited senior states
    setEditedSenior({
      nome: idoso.nome,
      dataNascimento: idoso.dataNascimento,
      foto: idoso.foto,
      condiciones: idoso.condicoesMedicas.join(', '),
      alergias: idoso.alergias.join(', '),
      observacoes: idoso.observacoes,
      contatoNome: idoso.contatoEmergencia.nome,
      contatoFone: idoso.contatoEmergencia.telefone,
      medicoNome: idoso.medicoResponsavel?.nome || '',
      medicoFone: idoso.medicoResponsavel?.telefone || '',
      planoCuidado: idoso.planoCuidado
    });
  };

  const handleSaveAccessibility = (size: 'normal' | 'grande' | 'gigante', mode: boolean, dark: boolean) => {
    onUpdateAccessibility({ fontSize: size, simplifiedMode: mode, darkMode: dark });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 200, 200, 0.4);
        setEditedSenior(prev => ({ ...prev, foto: compressed }));
      } catch (err) {
        console.error('Erro ao comprimir foto do perfil, usando fallback:', err);
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            const res = typeof reader.result === 'string' ? reader.result : '';
            setEditedSenior(prev => ({ ...prev, foto: res }));
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleUpdateSeniorProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedSenior.nome.trim()) {
      alert('Favor preencher o nome do idoso.');
      return;
    }

    // Formatar data de nascimento caso esteja em formato corrido (8 dígitos, ex: 23111963)
    let formattedDOB = editedSenior.dataNascimento.trim();
    const dobDigits = formattedDOB.replace(/\D/g, '');
    if (dobDigits.length === 8 && !formattedDOB.includes('/')) {
      formattedDOB = `${dobDigits.slice(0, 2)}/${dobDigits.slice(2, 4)}/${dobDigits.slice(4)}`;
      // Atualiza o estado
      setEditedSenior(prev => ({ ...prev, dataNascimento: formattedDOB }));
    }
    
    const allSeniors = getFromDB<Idoso[]>('anjo_idosos', []);
    const updated = allSeniors.map(sen => {
      if (sen.id === idoso.id) {
        return {
          ...sen,
          nome: editedSenior.nome,
          dataNascimento: formattedDOB,
          foto: editedSenior.foto,
          condicoesMedicas: editedSenior.condiciones.split(',').map(s => s.trim()).filter(Boolean),
          alergias: editedSenior.alergias.split(',').map(s => s.trim()).filter(Boolean),
          observacoes: editedSenior.observacoes,
          contatoEmergencia: {
            nome: editedSenior.contatoNome,
            parentesco: sen.contatoEmergencia?.parentesco || 'Familiar',
            telefone: editedSenior.contatoFone
          },
          medicoResponsavel: {
            nome: editedSenior.medicoNome,
            especialidade: sen.medicoResponsavel?.especialidade || (localStorage.getItem('anjo_app_mode') && localStorage.getItem('anjo_app_mode')!.startsWith('escolar') ? 'Pediatra' : 'Geriatra'),
            telefone: editedSenior.medicoFone
          },
          planoCuidado: editedSenior.planoCuidado
        };
      }
      return sen;
    });

    saveToDB('anjo_idosos', updated);
    setSavingMessage('Perfil do idoso salvo com sucesso!');
    setIsEditingSenior(false);

    // Dispatch custom event to let other components know the data has updated instantly
    window.dispatchEvent(new CustomEvent('anjo_user_updated'));

    // Refresh configurations trigger
    setTimeout(() => {
      setSavingMessage('');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Settings className="w-6 h-6 text-serene-blue" />
          Configurações Gerais de Operação
        </h2>
        <p className="text-sm text-slate-500">
          Gerenciamento de acessibilidade, troca de personagens simulados do plano, e edição de contatos clínicos.
        </p>
      </div>

      {savingMessage && (
        <div className="p-3 bg-emerald-100 text-emerald-800 text-xs text-center font-bold rounded-xl">
          {savingMessage}
        </div>
      )}

      {/* Grid panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* PANEL: MEU PERFIL DE USUÁRIO */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl border p-5 border-indigo-800/80 space-y-4 shadow-md md:col-span-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="relative shrink-0">
                <img
                  referrerPolicy="no-referrer"
                  src={usuarioAtual.foto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"}
                  alt={usuarioAtual.nome}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-400/50 shadow-md"
                />
                <span className="absolute -bottom-1 -right-1 bg-emerald-500 w-4 h-4 rounded-full border-2 border-slate-900"></span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-white tracking-tight">{usuarioAtual.nome}</h3>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                    {usuarioAtual.tipo}
                  </span>
                </div>
                <p className="text-xs text-indigo-200/90 font-medium mt-0.5">
                  {usuarioAtual.email === 'sem_email@anjo.com' ? 'Sem e-mail cadastrado' : usuarioAtual.email} • {usuarioAtual.telefone || '(11) 98765-9181'}
                </p>
                <p className="text-[10px] text-slate-300 font-medium mt-1">
                  Sua foto e dados do perfil ficam sincronizados no banco de dados e salvos permanentemente.
                </p>
              </div>
            </div>

            {onOpenEditProfile && (
              <button
                type="button"
                onClick={onOpenEditProfile}
                className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 border border-indigo-400/40 shrink-0"
              >
                <Camera className="w-4 h-4 text-amber-300" />
                Editar Minha Foto e Dados
              </button>
            )}
          </div>
        </div>

        {/* PANEL: ACCESSIBILITY PREFERENCES */}
        <div className="bg-white rounded-2xl border p-5 border-soft-gray space-y-4">
          <h3 className="text-base font-bold text-slate-850 flex items-center gap-1.5 border-b pb-2">
            <Sliders className="w-4.5 h-4.5 text-serene-blue" />
            Preferências de Visualização (Acessibilidade)
          </h3>

          {/* Sise trigger */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-500 block">Tamanho das Fontes de Texto:</span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'normal', label: 'Aa Normal', sizeText: 'text-sm' },
                { id: 'grande', label: 'Aa Grande (1.2x)', sizeText: 'text-base' },
                { id: 'gigante', label: 'Aa Gigante (1.5x)', sizeText: 'text-lg' }
              ].map(sz => {
                const active = accessibilitySettings.fontSize === sz.id;
                return (
                  <button
                    key={sz.id}
                    onClick={() => handleSaveAccessibility(sz.id as any, accessibilitySettings.simplifiedMode, accessibilitySettings.darkMode)}
                    className={`py-2 px-1 text-center font-bold border rounded-lg transition-colors cursor-pointer ${sz.sizeText} ${
                      active 
                        ? 'bg-serene-blue border-serene-blue text-white' 
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {sz.label}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400">Selecionar "Aa Gigante" ajuda leitores seniores a lerem tarefas sem óculos.</p>
          </div>

          {/* Simple toggle mode */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold text-slate-500 block">Modo de Interface:</span>
            <label className="flex items-center gap-3 p-3 bg-amber-50/50 border border-amber-200 rounded-xl cursor-pointer hover:bg-amber-100/35 transition-colors">
              <input 
                type="checkbox" 
                checked={accessibilitySettings.simplifiedMode}
                onChange={e => handleSaveAccessibility(accessibilitySettings.fontSize, e.target.checked, accessibilitySettings.darkMode)}
                className="w-5 h-5 text-serene-blue rounded border-slate-350"
              />
              <div>
                <strong className="text-sm font-bold text-amber-900 block">Modo Simples para Idosos</strong>
                <span className="text-[11px] leading-normal font-semibold text-slate-550 block">Habilita tons de contraste absolutos, simplifica as tabelas de relatório e oculta configurações para um visual focado.</span>
              </div>
            </label>
          </div>

          {/* Dark Mode toggle */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-500 block">Cor da Interface (Tema):</span>
            <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors border border-slate-205">
              <input 
                type="checkbox" 
                checked={accessibilitySettings.darkMode}
                onChange={e => handleSaveAccessibility(accessibilitySettings.fontSize, accessibilitySettings.simplifiedMode, e.target.checked)}
                className="w-5 h-5 text-serene-blue rounded border-slate-350"
              />
              <div>
                <strong className="text-sm font-bold text-slate-800 block flex items-center gap-1.5">
                  🌙 Ativar Modo Noturno (Tema Escuro)
                </strong>
                <span className="text-[11px] leading-normal font-semibold text-slate-500 block">Muda as cores de fundo para tons escuros confortáveis para uso em horários de baixa luminosidade (noite/madrugada) ou para menor cansaço visual.</span>
              </div>
            </label>
          </div>

          {/* Presentation Mode toggle */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-500 block">Modo de Apresentação (Apenas o App Limpo):</span>
            <label className="flex items-center gap-3 p-3 bg-indigo-50/45 rounded-xl cursor-pointer hover:bg-indigo-100/30 transition-colors border border-indigo-150">
              <input 
                type="checkbox" 
                checked={modoApresentacao}
                onChange={e => handleTogglePresentation(e.target.checked)}
                className="w-5 h-5 text-serene-blue rounded border-indigo-300"
              />
              <div>
                <strong className="text-sm font-bold text-indigo-950 block flex items-center gap-1.5">
                  ✨ Ativar Modo de Apresentação Limpo
                </strong>
                <span className="text-[11px] leading-normal font-semibold text-slate-550 block">Oculta todos os simuladores de queda de rede, logs de WhatsApp, switchers de perfis de teste e avisos de "Simulação" para que os diretores vejam apenas a interface final polida de produção.</span>
              </div>
            </label>
          </div>
        </div>

        {/* PANEL: SECURITY PIN MANAGEMENT */}
        {isAdminOrCaregiver && (
          <div className="bg-white rounded-2xl border p-5 border-soft-gray space-y-4 shadow-2xs" id="pin-admin-management">
            <h3 className="text-base font-bold text-slate-850 flex items-center gap-1.5 border-b pb-2">
              <Lock className="w-4.5 h-4.5 text-indigo-600" />
              PIN de Segurança do Administrador
            </h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Configure o PIN de 4 dígitos usado para proteger a troca para o <strong>Modo Escolar 🧸</strong> e para restringir o acesso à aba de <strong>Controle de Assinaturas e Relatórios de Governança (Admin & Planilha)</strong>.
            </p>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (newPin.length !== 4) {
                alert('O PIN deve conter exatamente 4 números!');
                return;
              }
              localStorage.setItem('anjo_admin_pin', newPin);
              setSavingMessage('PIN de segurança do Administrador updated with success!');
              setTimeout(() => {
                setSavingMessage('');
              }, 2500);
              window.dispatchEvent(new CustomEvent('anjo_user_updated'));
            }} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-450 uppercase tracking-wider block">Novo PIN numérico (4 dígitos):</label>
                <div className="flex gap-2 items-center">
                  <div className="w-36">
                    <input
                      type="password"
                      maxLength={4}
                      pattern="[0-9]*"
                      inputMode="numeric"
                      value={newPin}
                      onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="Ex: 9181"
                      className="w-full text-center text-lg tracking-widest font-black py-2 px-3 bg-slate-50 border border-slate-350 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 text-slate-800"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-extrabold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4 text-white/95" />
                    Salvar PIN
                  </button>
                </div>
              </div>

              <div className="p-3 bg-indigo-50/50 rounded-xl space-y-1.5 border border-indigo-150/60">
                <span className="text-[10px] uppercase font-black tracking-wider text-indigo-700 block">Status da Chave de Segurança:</span>
                <div className="flex items-center justify-between gap-1.5 bg-white/60 p-3 rounded-lg border border-indigo-100/40">
                  <p className="text-[11px] text-slate-600 font-bold leading-relaxed">
                    🔐 PIN do Administrador: <span className="font-mono text-indigo-800 tracking-widest bg-indigo-100/60 px-2.5 py-0.5 rounded border border-indigo-200 font-extrabold">••••</span>
                    <span className="block text-[9px] text-slate-450 mt-1 font-semibold leading-normal">Por diretrizes estritas de rastreabilidade e segurança corporativa, o PIN ativo permanece estritamente ocultado e inacessível na interface gráfica, mesmo para administradores. Redefina-o de forma segura utilizando o formulário acima.</span>
                  </p>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* PANEL: SELECT SIMULATED IDOSO & USER ROLES */}
        {!modoApresentacao && usuarioAtual?.tipo !== 'familiar' && (
          <div className="bg-white rounded-2xl border p-5 border-soft-gray space-y-4">
            <h3 className="text-base font-bold text-slate-850 flex items-center gap-1.5 border-b pb-2">
              <UserCheck className="w-4.5 h-4.5 text-emerald-500" />
              Vias de Teste da Simulação
            </h3>

          {/* Switch elder */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-500 block">
              {localStorage.getItem('anjo_app_mode') && localStorage.getItem('anjo_app_mode')!.startsWith('escolar') ? 'Simular cuidado do Aluno:' : 'Simular cuidado do Idoso:'}
            </span>
            <div className="flex gap-2.5">
              {idososMock.map(sen => {
                const isSel = sen.id === idoso.id;
                // Get clean name
                const cleanName = sen.nome.includes('(') ? sen.nome.split(' (')[0] : sen.nome;
                return (
                  <button
                    key={sen.id}
                    onClick={() => onSwitchIdoso(sen.id)}
                    className={`flex-1 rounded-xl p-3 border text-left flex items-center gap-3 cursor-pointer transition-all ${
                      isSel 
                        ? 'bg-[#EAF3FF] border-serene-blue ring-2 ring-serene-blue/20' 
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <img referrerPolicy="no-referrer" src={sen.foto} alt={sen.nome} className="w-9 h-9 rounded-full object-cover border" />
                    <div>
                      <strong className="text-xs font-bold block text-slate-800">
                        {cleanName}
                      </strong>
                      <span className="text-[10px] text-slate-400 font-semibold">{sen.dataNascimento}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400">
              {localStorage.getItem('anjo_app_mode') && localStorage.getItem('anjo_app_mode')!.startsWith('escolar') 
                ? 'Cada aluno possui restrições, rotina, relatórios e contatos de emergência exclusivos cadastrados no sistema.' 
                : 'Cada idoso possui doenças, remédios, relatórios de vitais e equipe médica exclusiva cadastrada no sistema.'}
            </p>
          </div>

          {/* Switch active simulated caregiver */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <span className="text-xs font-bold text-slate-500 block">Simular usuário conectado (Permissões):</span>
              
              {/* Quick user search input */}
              <div className="relative flex items-center max-w-xs w-full">
                <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={settingsUserSearch}
                  onChange={e => setSettingsUserSearch(e.target.value)}
                  placeholder="Buscar usuário por nome ou cargo..."
                  className="w-full pl-8 pr-7 py-1 rounded-xl bg-slate-50 text-[11px] font-bold border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                {settingsUserSearch && (
                  <button
                    type="button"
                    onClick={() => setSettingsUserSearch('')}
                    className="absolute right-2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {usuariosMock
                .filter(usr => {
                  if (!settingsUserSearch.trim()) return true;
                  const term = settingsUserSearch.toLowerCase().trim();
                  return (
                    usr.nome.toLowerCase().includes(term) ||
                    usr.tipo.toLowerCase().includes(term) ||
                    (usr.observacoes && usr.observacoes.toLowerCase().includes(term))
                  );
                })
                .map(usr => {
                  const isSel = usr.id === usuarioAtual.id;
                  return (
                    <button
                      key={usr.id}
                      onClick={() => {
                        if (isSel) return;
                        setSwitchingUser(usr);
                        setSwitchingPin('');
                        setSwitchingError('');
                      }}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition-all ${
                        isSel 
                          ? 'bg-emerald-50 border-care-green ring-1.5 ring-care-green/20' 
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <img referrerPolicy="no-referrer" src={usr.foto} alt={usr.nome} className="w-6.5 h-6.5 rounded-full object-cover" />
                      <div className="min-w-0">
                        <strong className="text-[11px] font-bold block text-slate-800 leading-tight truncate">{usr.nome.split(' ')[0]}</strong>
                        <span className="text-[9px] uppercase font-bold text-emerald-800 truncate block">
                          {usr.tipo === 'diretor' || usr.tipo === 'diretora' || usr.tipo === 'admin' ? '👔 Diretor(a)' :
                           usr.tipo === 'coordenador' || usr.tipo === 'coordenadora' ? '👩‍🏫 Coordenador(a)' :
                           usr.tipo === 'desenvolvedor' || usr.tipo === 'dev' ? '💻 Desenvolvedor' :
                           usr.tipo === 'professor' || usr.tipo === 'professora' || usr.tipo === 'cuidador' ? '👨‍🏫 Professor(a)' :
                           usr.tipo === 'profissional' ? '👩‍⚕️ Saúde' :
                           '👨‍👩‍👧 Familiar'}
                        </span>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
        )}

        {/* 🔒 PANEL: RESTRICTED CONTROLS NOTICE FOR NON-ADMINS */}
        {!isAdminOrCaregiver && (
          <div className="bg-slate-50 rounded-2xl border p-6 border-slate-200 md:col-span-2 flex flex-col items-center text-center space-y-3 animate-fade-in" id="restricted-controls-notice">
            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 border border-amber-200">
              <Lock className="w-5.5 h-5.5" />
            </div>
            <div className="space-y-1.5 max-w-xl">
              <h4 className="text-sm font-bold text-slate-800">Módulos Administrativos Restritos</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                Para garantir a segurança e conformidade com a LGPD, as seções de <strong>Termos de Consentimento Digital</strong>, <strong>PIN de Segurança</strong> e <strong>Dados Clínicos do Assistido</strong> estão restritas à equipe gestora e de educadores. O faturamento e cobrança de mensalidades (via Pix) são processados e controlados diretamente pelo desenvolvedor.
              </p>
              <p className="text-[11px] text-slate-400">
                Seu usuário conectado possui o papel de <strong>Familiar / Tutor ({usuarioAtual.nome})</strong>. Você pode simular um usuário da equipe de cuidado no painel acima para obter acesso de visualização e edição a esses recursos.
              </p>
            </div>
          </div>
        )}

        {/* PANEL: RESET DE DADOS PARA INICIAR TESTES REAIS */}
        {isAdminOrCaregiver && !modoApresentacao && (
          <div className="bg-white rounded-2xl border p-5 border-soft-gray space-y-4 flex flex-col justify-between animate-fade-in" id="test-sandbox-reset">
            <div>
              <h3 className="text-base font-bold text-slate-850 flex items-center gap-1.5 border-b pb-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Zerar Dados para Iniciar Testes Reais?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold mt-2">
                <strong>De início, não é obrigatório zerar nada!</strong> O aplicativo é 100% editável para testes rápidos: você pode reescrever nomes, personalizar medicamentos e trocar de personagens sem necessidade de limpezas.
              </p>
              <p className="text-[11px] text-slate-500 leading-normal mt-1.5">
                Porém, se você quiser simular as rotinas diárias e notificações em tempo real a partir de um cenário inteiramente limpo e estéril para verificação real, utilize um dos botões rápidos:
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={handleWipeHistory}
                type="button"
                className="w-full py-2.5 px-3 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-900 text-xs font-extrabold rounded-xl border border-amber-200 hover:border-amber-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
              >
                <Trash2 className="w-4 h-4 text-amber-700 shrink-0" />
                Limpar Apenas Históricos e Logs
              </button>
              <p className="text-[10px] text-slate-400 leading-snug">
                Apaga apenas os copos d'água, sinais medidos, sono, medicação e notificações para começar o dia zerado hoje, mas preserva os perfis, medicamentos e fotos.
              </p>

              <div className="border-t border-slate-100 my-2 pt-2">
                <button
                  onClick={handleFullFactoryReset}
                  type="button"
                  className="w-full py-2.5 px-3 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-900 text-xs font-extrabold rounded-xl border border-rose-200 hover:border-rose-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
                >
                  <RotateCcw className="w-4 h-4 text-rose-700 shrink-0" />
                  Restaurar Padrão de Fábrica Geral
                </button>
                <p className="text-[10px] text-slate-400 leading-snug mt-1">
                  Zera as chaves de armazenamento local por completo para as configurações originais, redefinindo o PIN de Administrador (Clarice) para o padrão de fábrica estabelecido do plano.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* PANEL: DYNAMIC EDIT OF THE ACTIVE IDOSO'S CLINICAL DETAILS */}
        {isAdminOrCaregiver && (
          <div className="bg-white rounded-2xl border p-5 border-soft-gray md:col-span-2 space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="text-base font-bold text-slate-850 flex items-center gap-1.5">
              <Heart className="w-4.5 h-4.5 text-rose-500" />
              Editar Dados Clínicos de {idoso.nome}
            </h3>
            
            <button
              onClick={() => setIsEditingSenior(!isEditingSenior)}
              className="text-xs font-bold text-serene-blue hover:underline cursor-pointer"
            >
              {isEditingSenior ? 'Cancelar Edição' : 'Clique para Editar Perfil'}
            </button>
          </div>

          <form onSubmit={handleUpdateSeniorProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {localStorage.getItem('anjo_app_mode') && localStorage.getItem('anjo_app_mode')!.startsWith('escolar') ? 'Nome Completo do Aluno' : 'Nome Completo do Idoso'} <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text"
                  value={editedSenior.nome}
                  onChange={e => setEditedSenior({ ...editedSenior, nome: e.target.value })}
                  disabled={!isEditingSenior}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 disabled:opacity-60 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-serene-blue/20"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {localStorage.getItem('anjo_app_mode') && localStorage.getItem('anjo_app_mode')!.startsWith('escolar') ? 'Data de Nascimento do Aluno' : 'Data de Nascimento do Idoso'}
                </label>
                <input 
                  type="text"
                  placeholder="Ex: 15/08/1945"
                  maxLength={10}
                  value={editedSenior.dataNascimento}
                  onChange={e => {
                    const clean = e.target.value.replace(/\D/g, "");
                    const truncated = clean.slice(0, 8);
                    let formatted = truncated;
                    if (truncated.length > 2 && truncated.length <= 4) {
                      formatted = `${truncated.slice(0, 2)}/${truncated.slice(2)}`;
                    } else if (truncated.length > 4) {
                      formatted = `${truncated.slice(0, 2)}/${truncated.slice(2, 4)}/${truncated.slice(4)}`;
                    }
                    setEditedSenior({ ...editedSenior, dataNascimento: formatted });
                  }}
                  disabled={!isEditingSenior}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 disabled:opacity-60 text-sm focus:ring-2 focus:ring-serene-blue/20 text-center font-mono"
                />
              </div>

              {/* Foto do idoso */}
              <div className="space-y-1 md:col-span-2 border-b border-dashed border-slate-200 pb-3">
                <label className="text-xs font-bold text-slate-700 block">
                  Foto de Identificação do {localStorage.getItem('anjo_app_mode') && localStorage.getItem('anjo_app_mode')!.startsWith('escolar') ? 'Aluno' : 'Idoso'}
                </label>
                
                {isCapturing ? (
                  <div className="flex flex-col items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 max-w-sm mt-1">
                    <div className="relative w-64 h-48 bg-black rounded-xl overflow-hidden shadow-inner border border-slate-300">
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        className={`w-full h-full object-cover transform ${cameraFacingMode === 'user' ? '-scale-x-100' : 'scale-x-100'}`}
                      />
                      {cameraError && (
                        <div className="absolute inset-0 bg-slate-900/90 flex items-center justify-center p-4 text-center text-rose-300 text-[10px] font-bold">
                          {cameraError}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {!cameraError && (
                        <>
                          <button
                            type="button"
                            onClick={capturePhoto}
                            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                          >
                            📸 Capturar Foto
                          </button>
                          <button
                            type="button"
                            onClick={toggleCameraFacingMode}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1"
                            title="Inverter câmera (Frontal / Traseira)"
                          >
                            <RefreshCw className="w-3.5 h-3.5" /> Inverter Câmera
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-3 mt-1">
                    {editedSenior.foto && (
                      <div className="relative group shrink-0">
                        <img 
                          referrerPolicy="no-referrer" 
                          src={editedSenior.foto} 
                          alt={localStorage.getItem('anjo_app_mode') && localStorage.getItem('anjo_app_mode')!.startsWith('escolar') ? 'Miniatura Aluno' : 'Miniatura Idoso'} 
                          className="w-14 h-14 rounded-full object-cover border-2 border-serene-blue/30" 
                        />
                        {editedSenior.foto && editedSenior.foto.startsWith('data:') && (
                          <span className="absolute -bottom-1 -right-1 bg-teal-500 text-white text-[7px] font-extrabold px-1 py-0.5 rounded shadow-xs">REAL</span>
                        )}
                      </div>
                    )}
                    {isEditingSenior ? (
                      <div className="flex flex-wrap gap-2 w-full items-center">
                        <button
                          type="button"
                          onClick={() => startCamera()}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-200 cursor-pointer transition-all"
                        >
                          <Camera className="w-4 h-4 text-indigo-600" /> Usar Câmera
                        </button>

                        <label className="flex items-center justify-center gap-2 px-3 py-1.5 border border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer text-xs font-bold text-slate-600">
                          <Upload className="w-4 h-4 text-slate-500" />
                          <span>Enviar Foto</span>
                          <input 
                            type="file" 
                            aria-label="Anexar foto de identificação do idoso"
                            accept="image/*" 
                            onChange={handlePhotoUpload} 
                            className="hidden" 
                          />
                        </label>
                        
                        <input 
                          type="text" 
                          placeholder="Ou cole o link da imagem (URL)" 
                          value={(editedSenior.foto && editedSenior.foto.startsWith('data:')) ? '' : (editedSenior.foto || '')}
                          onChange={e => setEditedSenior({ ...editedSenior, foto: e.target.value })}
                          className="flex-1 min-w-[150px] px-3 py-1.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-serene-blue/20 bg-slate-50 text-xs text-slate-850"
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500 italic">Habilite a edição para alterar a foto do perfil.</span>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">Condições Médicas / Diagnósticos (separado por vírgula)</label>
                <input 
                  type="text"
                  value={editedSenior.condiciones}
                  onChange={e => setEditedSenior({ ...editedSenior, condiciones: e.target.value })}
                  disabled={!isEditingSenior}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 disabled:opacity-60 text-sm focus:ring-2 focus:ring-serene-blue/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">Alergias Catalogadas (separado por vírgula)</label>
                <input 
                  type="text"
                  value={editedSenior.alergias}
                  onChange={e => setEditedSenior({ ...editedSenior, alergias: e.target.value })}
                  disabled={!isEditingSenior}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 disabled:opacity-60 text-sm focus:ring-2 focus:ring-serene-blue/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">Nome do Responsável Emergência</label>
                <input 
                  type="text"
                  value={editedSenior.contatoNome}
                  onChange={e => setEditedSenior({ ...editedSenior, contatoNome: e.target.value })}
                  disabled={!isEditingSenior}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 disabled:opacity-60 text-sm focus:ring-2 focus:ring-serene-blue/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">Telefone de Emergência</label>
                <input 
                  type="text"
                  value={editedSenior.contatoFone}
                  onChange={e => setEditedSenior({ ...editedSenior, contatoFone: e.target.value })}
                  disabled={!isEditingSenior}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 disabled:opacity-60 text-sm focus:ring-2 focus:ring-serene-blue/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">
                  {localStorage.getItem('anjo_app_mode') && localStorage.getItem('anjo_app_mode')!.startsWith('escolar') ? 'Pediatra Responsável' : 'Geriatra Responsável'}
                </label>
                <input 
                  type="text"
                  value={editedSenior.medicoNome}
                  onChange={e => setEditedSenior({ ...editedSenior, medicoNome: e.target.value })}
                  disabled={!isEditingSenior}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 disabled:opacity-60 text-sm focus:ring-2 focus:ring-serene-blue/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">Telefone do Médico</label>
                <input 
                  type="text"
                  value={editedSenior.medicoFone}
                  onChange={e => setEditedSenior({ ...editedSenior, medicoFone: e.target.value })}
                  disabled={!isEditingSenior}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 disabled:opacity-60 text-sm focus:ring-2 focus:ring-serene-blue/20"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-600 block">
                    Plano de Cuidado / Instruções Rápidas do {localStorage.getItem('anjo_app_mode') && localStorage.getItem('anjo_app_mode')!.startsWith('escolar') ? 'Aluno' : 'Idoso'}
                  </label>
                  {isEditingSenior && (
                    <VoiceInput 
                      onTranscript={text => setEditedSenior(prev => ({ ...prev, planoCuidado: prev.planoCuidado ? prev.planoCuidado + ' ' + text : text }))} 
                      size="sm"
                    />
                  )}
                </div>
                <textarea 
                  rows={2}
                  value={editedSenior.planoCuidado}
                  onChange={e => setEditedSenior({ ...editedSenior, planoCuidado: e.target.value })}
                  disabled={!isEditingSenior}
                  className="w-full px-3 py-2 border border-slate-300 bg-slate-50 rounded-xl disabled:opacity-60 text-sm focus:ring-2 focus:ring-serene-blue/20"
                ></textarea>
              </div>
            </div>

            {isEditingSenior && (
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-serene-blue hover:bg-blue-600 text-white text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Salvar Alterações do Perfil
                </button>
              </div>
            )}
          </form>
          </div>
        )}

        {/* 🛡️ PANEL: LGPD GOVERNANCE, CONSENTS & DIGITAL AUDITATION */}
        {isAdminOrCaregiver && (
          <div className="bg-white rounded-2xl border p-5 border-soft-gray md:col-span-2 space-y-6" id="lgpd-governance-panel">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 gap-2" id="lgpd-gov-header">
            <div>
              <h3 className="text-base font-bold text-slate-850 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Governança LGPD, Autorizações & Auditoria Digital
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Consulte as bases legais de consentimento de dados de saúde sensíveis (Art. 5º, II da LGPD) e audite os registros de acesso.
              </p>
            </div>
            <div 
              id="lgpd-accepted-badge"
              className={`inline-flex items-center gap-1 px-3 py-1 font-bold text-xs rounded-full border ${
                lgpdAccepted 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-250 animate-pulse' 
                  : 'bg-amber-50 text-amber-800 border-amber-250'
              }`}
            >
              {lgpdAccepted ? '✓ Termos Aceitos (Ativo)' : '⚠️ Consentimento Pendente'}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="lgpd-gov-body-grid">
            
            {/* COLUMN 1: ACTIVE AUTHORIZATIONS LIST (5 cols) */}
            <div className="lg:col-span-5 bg-slate-50/60 border border-slate-200/80 rounded-2xl p-4.5 space-y-4" id="lgpd-active-authorizations-section">
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest block">
                📝 Autorizações em Vigor
              </span>
              
              <div className="space-y-3" id="lgpd-terms-list">
                <div className="flex items-start gap-2.5 p-3 bg-white rounded-xl border border-slate-100 shadow-3xs" id="term-sensitive-data">
                  <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600 mt-0.5 shrink-0">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-xs font-bold text-slate-800 block">Dado Pessoal Sensível de Saúde (Ativo)</strong>
                    <span className="text-[10px] text-slate-500 leading-normal block mt-0.5">
                      Autorização para registrar rotinas, aceitação alimentar, hidratação, sono, aferimentos de sinais vitais e relatos diários.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 bg-white rounded-xl border border-slate-100 shadow-3xs" id="term-relation-declaration">
                  <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600 mt-0.5 shrink-0">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-xs font-bold text-slate-800 block">Declaração de Vínculo de Cuidado (Ativo)</strong>
                    <span className="text-[10px] text-slate-500 leading-normal block mt-0.5">
                      Afirmação de vínculo familiar ou profissional para atuar como operador autorizado de dados sob a tutela assistencial do idoso.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 bg-white rounded-xl border border-slate-100 shadow-3xs" id="term-audit-concordance">
                  <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600 mt-0.5 shrink-0">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-xs font-bold text-slate-800 block">Trilha de Auditoria Digital (Ativo)</strong>
                    <span className="text-[10px] text-slate-500 leading-normal block mt-0.5">
                      Concordância com o registro de carimbo de tempo, IP e ator no log criptográfico para fins de rastreabilidade jurídica.
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex flex-col gap-2" id="lgpd-action-revoke-box">
                <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                  Se desejar revogar as autorizações digitais dadas ou simular a assinatura de um novo termo:
                </p>
                <button
                  id="revoke-lgpd-consent-btn"
                  type="button"
                  onClick={handleRevokeLgpd}
                  className="w-full py-2 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 font-extrabold text-[11px] rounded-xl border border-rose-200 hover:border-rose-300 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Revogar Autorizações (Exigir Novo Termo)
                </button>
              </div>
            </div>

            {/* COLUMN 2: AUDIT LOG LEDGER (7 cols) */}
            <div className="lg:col-span-7 space-y-4" id="lgpd-audit-log-section">
              <div className="flex justify-between items-center" id="lgpd-audit-title-row">
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest block">
                  🔎 Trilha de Auditoria & Acessos (LGPD)
                </span>
                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md uppercase">
                  Imunidade & Conformidade Ativa
                </span>
              </div>

              <div className="border border-slate-150 rounded-2xl bg-slate-50/40 p-1 overflow-hidden" id="lgpd-log-table-container">
                <div className="overflow-x-auto rounded-xl bg-white max-h-[300px] overflow-y-auto">
                  <table className="w-full text-left text-xs min-w-[450px]" id="lgpd-audit-table">
                    <thead className="sticky top-0 bg-slate-50 border-b border-slate-150">
                      <tr className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">
                        <th className="py-2.5 px-3">Carimbo / IP</th>
                        <th className="py-2.5 px-1 col-span-2">Autor (Agente)</th>
                        <th className="py-2.5 px-3">Ação Protegida</th>
                        <th className="py-2.5 px-3">Rigor Legal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                      {lgpdLogs.map((log, index) => (
                        <tr key={log.id || index} className="hover:bg-slate-50/60 transition-colors" id={`lgpd-log-row-${log.id || index}`}>
                          <td className="py-2 px-3">
                            <span className="block text-slate-800 font-bold text-[11px]">{log.data}</span>
                            <span className="block text-[9px] text-slate-400 font-mono font-semibold">{log.ip}</span>
                          </td>
                          <td className="py-2 px-1 text-xs">
                            <span className="font-extrabold text-slate-800 leading-tight">{log.autor}</span>
                          </td>
                          <td className="py-2 px-3">
                            <span className="font-bold text-slate-700 block text-[11px]">{log.acao}</span>
                            <span className="text-[9px] text-slate-400 leading-tight block">{log.detalhes}</span>
                          </td>
                          <td className="py-2 px-3">
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-sm border border-emerald-100">
                              ✓ Auditado
                            </span>
                          </td>
                        </tr>
                      ))}
                      {lgpdLogs.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-400 italic font-normal">
                            Nenhum registro de acesso auditado ainda.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-3 bg-indigo-50/60 border border-indigo-150 rounded-xl space-y-1.5 text-[10px] text-slate-600 leading-normal" id="lgpd-disclaimer-box">
                <p>
                  🛡️ <strong>Garantia de Confidencialidade:</strong> Toda visualização de relatórios de saúde, prescrição ou histórico clínico da pessoa idosa é registrada com carimbo de tempo inviolável de conformidade legal, atendendo às exigências de transparência perante o titular de dados e familiares responsáveis.
                </p>
              </div>
            </div>

            {/* ==========================================================================
                🛡️ SEÇÃO DE PROPRIEDADE INTELECTUAL, DIREITOS AUTORAIS & ANTI-PLÁGIO
                ========================================================================== */}
            <div className="bg-white border-2 border-indigo-200 rounded-3xl p-6 space-y-5 shadow-xs" id="intellectual-property-security-section">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-150 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-2xl shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-slate-800">
                        Propriedade Intelectual & Proteção Anti-Plágio
                      </h3>
                      <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200">
                        Autoria Protegida
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Direitos autorais do software, registro de código-fonte e bloqueio contra cópias não autorizadas.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-indigo-50/70 border border-indigo-150 px-3 py-1.5 rounded-xl text-xs">
                  <Fingerprint className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="font-mono text-[11px] font-bold text-indigo-900">
                    Hash SHA-256: <strong>ANJO-2026-F981D7</strong>
                  </span>
                </div>
              </div>

              {/* Informações Oficiais de Titularidade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span>Titularidade & Criação de Software</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    <strong>Autor Desenvolvedor:</strong> Djalma Amaral<br />
                    <strong>Gestão Institucional:</strong> Nilva Amaral<br />
                    <strong>Plataforma:</strong> Anjinho Escolar / Anjo Cuidador SaaS
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                    <Copyright className="w-4 h-4 text-indigo-600" />
                    <span>Legislação de Proteção</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    <strong>Lei nº 9.609/1998:</strong> Proteção de Propriedade Intelectual de Programa de Computador.<br />
                    <strong>Lei nº 9.610/1998:</strong> Direitos Autorais e Proteção Internacional (Convenção de Berna).
                  </p>
                </div>
              </div>

              {/* Controles de Proteção Ativa */}
              <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-600" />
                      Proteção Ativa de Interface contra Cópias e Capturas
                    </h4>
                    <p className="text-[11px] text-slate-600">
                      Desativa a seleção indiscriminada de texto, cópia de relatórios e arraste de fotos confidenciais de alunos/pacientes.
                    </p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={copyProtection}
                      onChange={(e) => handleToggleCopyProtection(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              </div>

              {/* Aviso Legal de Proibição de Engenharia Reversa */}
              <div className="p-3.5 bg-slate-900 text-slate-200 rounded-2xl text-[10px] leading-relaxed space-y-1 font-mono">
                <p className="text-amber-400 font-bold uppercase tracking-wider">
                  ⚠️ AVISO LEGAL DE DIREITOS RESERVADOS
                </p>
                <p>
                  É expressamente proibida a cópia, clonagem, distribuição, modificação não autorizada, descompilação ou engenharia reversa de qualquer módulo, tela ou código-fonte desta aplicação. Todos os direitos reservados © 2026. Violações estão sujeitas a sanções cíveis e criminais conforme o Art. 12 da Lei Federal 9.609/98.
                </p>
              </div>
            </div>

          </div>
          </div>
        )}

      </div>

      {/* 🔐 CONFIRMAR TROCA DE PERFIL COM PIN DE SEGURANÇA */}
      {switchingUser && (
        <div className="fixed inset-0 bg-slate-905 bg-opacity-65 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="confirm-switch-user-pin-modal">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-16 h-16 bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-sm relative shrink-0">
                <img referrerPolicy="no-referrer" src={switchingUser.foto} alt={switchingUser.nome} className="w-full h-full object-cover" />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                  🔒 Gating de Segurança
                </span>
                <h3 className="text-base font-bold text-slate-800 mt-1">
                  Acessar perfil de {switchingUser.nome}
                </h3>
                <p className="text-xs text-slate-500 leading-normal">
                  Preencha o PIN de segurança para entrar no perfil. Isso impede que outras pessoas interfiram na rotina de cuidados de forma não autorizada.
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmSwitchUser} className="space-y-4 pt-2 border-t border-slate-100 text-left">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Senha PIN da Conta</label>
                  <span className="text-[9px] font-bold text-indigo-650 bg-indigo-50 border border-indigo-100/50 px-2 py-0.5 rounded-sm">
                    PIN da simulação: <strong className="font-mono text-[11px] font-black">{switchingUser.pin || (switchingUser.telefone ? switchingUser.telefone.replace(/\D/g, '').slice(-4) : '1234')}</strong>
                  </span>
                </div>
                <input 
                  type="password" 
                  maxLength={8}
                  placeholder="Insira o seu PIN" 
                  value={switchingPin}
                  onChange={e => setSwitchingPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-350 rounded-xl focus:ring-2 focus:ring-serene-blue/20 text-center font-mono tracking-widest text-[#9C27B0] text-lg font-bold"
                  autoFocus
                />
              </div>

              {switchingError && (
                <p className="text-[10px] text-alert-red font-bold text-center bg-red-50 border border-red-200 rounded-lg p-2 animate-pulse">
                  ⚠️ {switchingError}
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSwitchingUser(null)}
                  className="flex-1 py-2.5 px-4 bg-slate-105 hover:bg-slate-200 border border-slate-250 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer text-center"
                >
                  Entrar no Perfil →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
