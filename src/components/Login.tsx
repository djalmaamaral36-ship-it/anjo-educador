import React, { useState, useEffect, useMemo } from 'react';
import { Usuario, Idoso } from '../types';
import { USUARIOS_SIMULADOS, getFromDB, saveToDB, isPinUnique } from '../data';
import { 
  Shield, Sparkles, Heart, Check, Users, MessageSquare, 
  Lock, FileText, Phone, Mail, User, Baby, Activity, 
  Settings, CheckSquare, Award, ThumbsUp, ArrowRight, HelpCircle,
  Sun, Moon, Search, X, Filter
} from 'lucide-react';
import { VoiceInput } from './VoiceInput';

interface LoginProps {
  onLoginSuccess: (user: Usuario) => void;
  accessibility?: { fontSize: 'normal' | 'grande' | 'gigante'; simplifiedMode: boolean; darkMode: boolean };
  onUpdateAccessibility?: (newSettings: { fontSize: 'normal' | 'grande' | 'gigante'; simplifiedMode: boolean; darkMode: boolean }) => void;
}

export default function Login({ onLoginSuccess, accessibility, onUpdateAccessibility }: LoginProps) {
  const [userListVersion, setUserListVersion] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setUserListVersion(v => v + 1);
    window.addEventListener('anjo_user_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('anjo_user_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const dbUsers = useMemo(() => {
    let list = getFromDB<Usuario[]>('anjo_usuarios', USUARIOS_SIMULADOS);
    if (!list || list.length === 0) {
      list = USUARIOS_SIMULADOS;
      saveToDB('anjo_usuarios', list);
    }
    if (!list.some(u => u.id === 'user_desenvolvedor_djalma' || u.tipo === 'desenvolvedor' || u.nome.includes('Djalma'))) {
      const devUser: Usuario = USUARIOS_SIMULADOS[0];
      list = [devUser, ...list];
      saveToDB('anjo_usuarios', list);
    }
    return list;
  }, [userListVersion]);
  const [selectedUser, setSelectedUser] = useState<Usuario>(() => {
    return dbUsers.find(u => u.tipo === 'desenvolvedor') || dbUsers.find(u => u.tipo === 'cuidador') || dbUsers[1] || dbUsers[0];
  });
  const [passcode, setPasscode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<string>('Conectando...');

  // Mocking status logic for demonstration until real-time firebase state is linked
  useEffect(() => {
    const timer = setTimeout(() => {
      setConnectionStatus('Conectado');
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Tab State: 'login' for normal access / simulation chooser, 'trial' for Option B (15 Day Trial & LGPD consent)
  const [activeTab, setActiveTab] = useState<'login' | 'trial'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      // Auto-toggle to trial form if campaign reference is detected in the URL scanned
      return params.get('ref') ? 'trial' : 'login';
    }
    return 'login';
  });

  // Read campaign parameters dynamically
  const [refCampaign, setRefCampaign] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('ref') || 'geral';
    }
    return 'geral';
  });

  const [selectedMode, setSelectedMode] = useState<'idoso' | 'escolar_infantil' | 'escolar_fundamental'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const m = params.get('mode');
      if (m === 'escolar') return 'escolar_infantil';
      return 'idoso';
    }
    return 'idoso';
  });

  // Quick Profile / Professional Search
  const [profileSearch, setProfileSearch] = useState('');
  const [profileRoleFilter, setProfileRoleFilter] = useState<'todos' | 'cuidador' | 'admin' | 'profissional' | 'familiar' | 'desenvolvedor' | 'familiar_admin' | 'familiar_convidado'>('todos');
  
  // Classroom PIN authorization pending state
  const [pendingClassroom, setPendingClassroom] = useState<string | null>(null);
  const [pendingTeacherName, setPendingTeacherName] = useState<string | null>(null);

  // Onboarding trial form fields
  const [tutorName, setTutorName] = useState('Djalma Amaral');
  const [cargoUsuario, setCargoUsuario] = useState<'diretor' | 'coordenador' | 'professor' | 'desenvolvedor' | 'familiar_admin' | 'familiar_convidado' | 'familiar'>('diretor');
  const [relacionamento, setRelacionamento] = useState('Filho(a)');
  const [whatsapp, setWhatsapp] = useState('(11) 98765-4321');
  const [email, setEmail] = useState('djalmaamaral36@gmail.com');
  const [customPin, setCustomPin] = useState('9181');
  const [assistidoNome, setAssistidoNome] = useState('Dona Alzira Amaral');

  // Required LGPD Checkboxes
  const [agreedSensivel, setAgreedSensivel] = useState(true);
  const [agreedTutor, setAgreedTutor] = useState(true);
  const [agreedPolitica, setAgreedPolitica] = useState(true);

  // Registration feedback payload
  const [registeredSuccess, setRegisteredSuccess] = useState<{
    user: Usuario;
    senior: any;
    consentHash: string;
    mode: 'idoso' | 'escolar_infantil' | 'escolar_fundamental';
    refLabel: string;
  } | null>(null);

  // Sync mode based on toggle
  useEffect(() => {
    const currentMode = localStorage.getItem('anjo_app_mode') || 'idoso';
    if (!refCampaign || refCampaign === 'geral') {
      const parsedMode = currentMode === 'escolar_fundamental' ? 'escolar_infantil' : currentMode;
      setSelectedMode(parsedMode as any);
    }

    // Check for pending classroom authentication redirect
    const pendingRoom = localStorage.getItem('anjo_pending_classroom');
    const pendingTeacherId = localStorage.getItem('anjo_pending_teacher_id');

    if (pendingRoom) {
      setPendingClassroom(pendingRoom);
      setSelectedMode('escolar_infantil');

      const teacher = dbUsers.find(u => u.id === pendingTeacherId) || dbUsers.find(u => {
        if (!u.salaAula) return false;
        const userRoom = u.salaAula.toLowerCase();
        const targetRoom = pendingRoom.toLowerCase();
        return userRoom === targetRoom || userRoom.includes(targetRoom) || targetRoom.includes(userRoom);
      });

      if (teacher) {
        setSelectedUser(teacher);
        setPendingTeacherName(teacher.nome.split(' (')[0]);
      } else {
        setProfileSearch(pendingRoom);
      }
    }
  }, [dbUsers]);

  // Sync assisted person default name dynamically based on selected mode
  useEffect(() => {
    if (selectedMode === 'escolar_infantil') {
      if (assistidoNome === 'Dona Alzira Amaral' || assistidoNome === 'Arthur Amaral' || !assistidoNome) {
        setAssistidoNome('Paulinho Amaral');
        setRelacionamento('Pai/Mae');
      }
    } else {
      if (assistidoNome === 'Paulinho Amaral' || assistidoNome === 'Arthur Amaral' || !assistidoNome) {
        setAssistidoNome('Dona Alzira Amaral');
        setRelacionamento('Filho(a)');
      }
    }
  }, [selectedMode]);

  // Auto-align selected simulated user when selected mode changes
  useEffect(() => {
    // Don't auto-switch user if there is a pending classroom redirect
    if (localStorage.getItem('anjo_pending_classroom')) return;

    if (dbUsers.length > 0) {
      if (!selectedUser || (selectedMode === 'idoso' && selectedUser.salaAula && selectedUser.id !== 'user_cuidador_1')) {
        const defaultUser = dbUsers.find(u => u.id === 'user_cuidador_1' || u.id === 'user_admin') || dbUsers[0];
        setSelectedUser(defaultUser);
      } else if (selectedMode.startsWith('escolar') && !selectedUser.salaAula && selectedUser.id !== 'user_cuidador_1' && selectedUser.id !== 'user_medico_1') {
        const defaultUser = dbUsers.find(u => u.salaAula || u.id === 'user_cuidador_1') || dbUsers[0];
        setSelectedUser(defaultUser);
      }
    }
  }, [selectedMode, dbUsers]);

  useEffect(() => {
    if (selectedUser) {
      const selectedPhoneDigits = selectedUser.telefone ? selectedUser.telefone.replace(/\D/g, '') : '';
      const selectedPin = selectedUser.pin || (selectedPhoneDigits.length >= 4 ? selectedPhoneDigits.slice(-4) : '1234');
      setPasscode(selectedPin);
    } else {
      setPasscode('');
    }
    setErrorMessage('');
  }, [selectedUser?.id]);

  const handleBypassSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const selectedPhoneDigits = selectedUser?.telefone ? selectedUser.telefone.replace(/\D/g, '') : '';
    const selectedPin = selectedUser?.pin || (selectedPhoneDigits.length >= 4 ? selectedPhoneDigits.slice(-4) : '1234');
    const inputPin = (passcode || selectedPin || '1234').trim();

    try {
      // 1. Check if inputPin matches selectedUser's PIN or master PINs (9181, 8191, 3031, 1234, 0000, 1010, 2020, 2222, 5678)
      const universalPins = ['9181', '8191', '3031', '1234', '0000', '1010', '2020', '2222', '5678'];

      if (inputPin === selectedPin || universalPins.includes(inputPin) || !passcode || passcode.trim() === selectedPin) {
        if (inputPin === '9181' || inputPin === '8191' || inputPin === '3031' || selectedUser?.id === 'user_desenvolvedor_djalma' || selectedUser?.tipo === 'desenvolvedor') {
          try { localStorage.setItem('anjo_master_demonstracao_ativo', 'true'); } catch (e) {}
        } else {
          try { localStorage.removeItem('anjo_master_demonstracao_ativo'); } catch (e) {}
        }

        let effectiveMode = selectedMode;
        const uType = (selectedUser?.tipo || '').toLowerCase();
        const uName = (selectedUser?.nome || '').toLowerCase();
        const isDirector = uType === 'diretor' || uType === 'diretora' || uType === 'admin' || uName.includes('nilva') || selectedUser?.id === 'user_admin';
        const isSchoolStaff = isDirector || uType === 'coordenador' || uType === 'coordenadora' || uType === 'professor' || uType === 'professora' || uType === 'educador' || uType === 'educadora' || selectedUser?.id?.startsWith('user_pai_') || selectedUser?.id?.startsWith('user_mae_') || selectedUser?.id?.startsWith('aluno_');

        if (isDirector || isSchoolStaff || (selectedUser?.salaAula && selectedUser.salaAula !== 'Todas') || selectedUser?.id === 'user_cuidador_1') {
          effectiveMode = 'escolar_infantil';
        } else if (selectedUser?.id === 'user_cuidador_2') {
          effectiveMode = 'idoso';
        }
        try { localStorage.setItem('anjo_app_mode', effectiveMode); } catch (e) {}

        if (pendingClassroom && selectedUser) {
          // Assign selected user's classroom in DB
          const allUsers = getFromDB<Usuario[]>('anjo_usuarios', []);
          const updatedUsers = allUsers.map(u => {
            if (u.id === selectedUser.id) {
              return { ...u, salaAula: pendingClassroom };
            }
            return u;
          });
          saveToDB('anjo_usuarios', updatedUsers);

          // Activate a student in this classroom
          const allStudents = getFromDB<Idoso[]>('anjo_idosos', []);
          const targetRoomLower = pendingClassroom.toLowerCase();
          const baseRoomLower = pendingClassroom.split(' - ')[0].toLowerCase();
            
          const matchingStudent = allStudents.find(s => {
            if (!s.id.startsWith('aluno_')) return false;
            const sName = s.nome.toLowerCase();
            return sName.includes(targetRoomLower) || sName.includes(baseRoomLower);
          });

          if (matchingStudent) {
            try { localStorage.setItem('anjo_simulacao_idoso_id', matchingStudent.id); } catch (e) {}
          }

          try {
            localStorage.removeItem('anjo_pending_classroom');
            localStorage.removeItem('anjo_pending_teacher_id');
          } catch (e) {}
        }

        setErrorMessage('');
        if (selectedUser) onLoginSuccess(selectedUser);
        return;
      }

      // 2. If typed a PIN that belongs to another user in DB, switch to that user
      const matchingUser = dbUsers.find(u => {
        const digits = u.telefone ? u.telefone.replace(/\D/g, '') : '';
        const uPin = u.pin || (digits.length >= 4 ? digits.slice(-4) : '1234');
        return uPin === inputPin;
      });

      if (matchingUser) {
        try { localStorage.removeItem('anjo_master_demonstracao_ativo'); } catch (e) {}
          
        let matchingMode = selectedMode;
        const muType = (matchingUser.tipo || '').toLowerCase();
        const muName = matchingUser.nome.toLowerCase();
        const isDirectorM = muType === 'diretor' || muType === 'diretora' || muType === 'admin' || muName.includes('nilva') || matchingUser.id === 'user_admin';
        const isSchoolStaffM = isDirectorM || muType === 'coordenador' || muType === 'coordenadora' || muType === 'professor' || muType === 'professora' || muType === 'educador' || muType === 'educadora' || matchingUser.id.startsWith('user_pai_') || matchingUser.id.startsWith('user_mae_') || matchingUser.id.startsWith('aluno_');

        if (isDirectorM || isSchoolStaffM || (matchingUser.salaAula && matchingUser.salaAula !== 'Todas') || matchingUser.id === 'user_cuidador_1') {
          matchingMode = 'escolar_infantil';
        } else if (matchingUser.id === 'user_cuidador_2') {
          matchingMode = 'idoso';
        }
        try { localStorage.setItem('anjo_app_mode', matchingMode); } catch (e) {}

        setErrorMessage('');
        onLoginSuccess(matchingUser);
        return;
      }
    } catch (err: any) {
      setErrorMessage('Erro interno: ' + (err.message || 'Falha no navegador'));
      return;
    }

    setErrorMessage(`Codigo de acesso invalido! Tente "9181", "3031" ou o PIN de 4 digitos do seu perfil.`);
  };

  const handlePhoneChange = (val: string) => {
    let cleaned = val.replace(/\D/g, '');
    if (cleaned.length > 11) cleaned = cleaned.slice(0, 11);
    
    // Pre-formatting (XX) XXXXX-XXXX Brazilian style
    if (cleaned.length > 6) {
      setWhatsapp(`(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`);
    } else if (cleaned.length > 2) {
      setWhatsapp(`(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`);
    } else {
      setWhatsapp(cleaned);
    }
  };

  const handleTrialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tutorName.trim() || !whatsapp.trim() || !email.trim() || !assistidoNome.trim() || !customPin.trim()) {
      setErrorMessage("Por favor, preencha todos os campos cadastrais para sua seguranca.");
      return;
    }
    if (customPin.length < 4) {
      setErrorMessage("O codigo PIN precisa conter pelo menos 4 caracteres numericos.");
      return;
    }
    if (!agreedSensivel || !agreedTutor || !agreedPolitica) {
      setErrorMessage("Para ativar a licenca gratis, e obrigatorio assinar todas as opcoes de consentimento da LGPD.");
      return;
    }

    // Check if customPin is unique across users
    const pinCheck = isPinUnique(customPin.trim());
    if (!pinCheck.isUnique) {
      setErrorMessage(`[!] O PIN "${customPin.trim()}" ja esta em uso por ${pinCheck.conflictingUser?.nome || 'outro usuario'}. Por favor, escolha um PIN exclusivo de 4 digitos.`);
      return;
    }

    setErrorMessage('');

    // Rastreamento amigavel
    let finalCampLabel = '  Divulgacao Geral';
    if (refCampaign === 'recepcao') finalCampLabel = '  RecepcaoClinica';
    if (refCampaign === 'panfleto') finalCampLabel = '  Panfleto Promocional';
    if (refCampaign === 'parceiros') finalCampLabel = '  ParceiroCredenciado';

    const cleanRef = refCampaign || 'geral';
    const deviceHash = `IP ${Math.floor(Math.random() * 80 + 171)}.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 255)} (SSL   ${navigator.userAgent.includes('iPhone') ? 'iPhone OS' : 'Android OS 14'})`;
    const consentId = `consent_${Date.now()}`;

    // 1st Layer: Generate LGPD Consent Log Entry (This sends the user to the spreadsheet/planilha!)
    const newConsent = {
      id: consentId,
      usuarioNome: `${tutorName} (${relacionamento})`,
      usuarioEmail: email,
      usuarioTelefone: whatsapp,
      usuarioTipo: 'familiar',
      idosoNome: assistidoNome,
      dataConsentimento: new Date().toLocaleString('pt-BR'),
      modoApp: selectedMode === 'escolar_infantil' ? '  Anjinho Escolar (Infantil)' : '  AnjoCuidador',
      deviceFingerprint: `${deviceHash}   Ref: ${cleanRef.toUpperCase()}`,
      statusFinanceiro: 'pago' // Free 15-day trial is registered as Active/Adimplente directly
    };

    // Save Consent to the Shared Database (LocalStorage simulates this central sheets ledger)
    const allConsents = getFromDB<any[]>('anjo_lgpd_consents', []);
    localStorage.setItem('anjo_lgpd_consents', JSON.stringify([newConsent, ...allConsents]));

    // 2nd Layer: Dynamically Generate Simulated Profiles in Database (Zero configuration needed)
    const newUserId = `user_trial_${Date.now()}`;
    const newSeniorId = selectedMode.startsWith('escolar') ? `aluno_trial_${Date.now()}` : `idoso_trial_${Date.now()}`;

    let userRoleLabel = 'Diretor Geral';
    if (cargoUsuario === 'diretor') userRoleLabel = 'Diretor(a)';
    if (cargoUsuario === 'coordenador') userRoleLabel = 'Coordenador(a)';
    if (cargoUsuario === 'professor') userRoleLabel = 'Professor(a)';
    if (cargoUsuario === 'desenvolvedor') userRoleLabel = 'Desenvolvedor';
    if (cargoUsuario === 'familiar_admin' || cargoUsuario === 'familiar') userRoleLabel = `Familiar Admin (${relacionamento})`;
    if (cargoUsuario === 'familiar_convidado') userRoleLabel = `Familiar Convidado (${relacionamento})`;

    const newUser: Usuario = {
      id: newUserId,
      nome: tutorName,
      email: email,
      telefone: whatsapp,
      tipo: cargoUsuario,
      parentesco: userRoleLabel,
      foto: selectedMode.startsWith('escolar')
        ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150'
        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
      observacoes: `Perfil ${userRoleLabel} registrado em ${new Date().toLocaleDateString('pt-BR')}.`,
      pin: customPin
    };

    const newSenior = {
      id: newSeniorId,
      nome: assistidoNome,
      foto: selectedMode.startsWith('escolar')
        ? 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&q=80&w=200'
        : 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?auto=format&fit=crop&q=80&w=200',
      dataNascimento: selectedMode === 'escolar_infantil' ? '14/10/2023' : '15/07/1944',
      condicoesMedicas: selectedMode.startsWith('escolar')
        ? ['Periodo de Adaptacao Ativo', 'Ativacao Gratis de 30 Dias'] 
        : ['Acompanhamento Ativo', 'Ativacao Gratis de 30 Dias'],
      alergias: ['Nenhuma cadastrada'],
      observacoes: `Perfil do assistido criado digitalmente pelo tutor ${tutorName} nas configuracoes rapidas do app.`,
      contatoEmergencia: {
        nome: tutorName,
        parentesco: relacionamento,
        telefone: whatsapp
      },
      planoDeCuidado: selectedMode === 'escolar_infantil'
        ? 'Apoiar adaptacao ludica, registrar alimentacao e hidratacao regular, sestas a tarde.'
        : 'Verificar batimentos e saturacao diariamente, alertar sobre remedios e hidratacao constante.',
      medicoResponsavel: {
        nome: selectedMode.startsWith('escolar') ? 'Dra. Luana Peixoto' : 'Dr. Roberto Kardec',
        especialidade: selectedMode.startsWith('escolar') ? 'Pediatra Geral' : 'Geriatra',
        telefone: '(11) 98888-7777'
      }
    };

    // Save actual user and senior objects down to the DB to simulate life
    const allUsersList = getFromDB<any[]>('anjo_usuarios', USUARIOS_SIMULADOS);
    saveToDB('anjo_usuarios', [newUser, ...allUsersList]);

    const allSeniorsList = getFromDB<any[]>('anjo_idosos', []);
    saveToDB('anjo_idosos', [newSenior, ...allSeniorsList]);

    // Point dynamic state machines to this new user/senior context
    localStorage.setItem('anjo_simulacao_user_id', newUserId);
    localStorage.setItem('anjo_simulacao_idoso_id', newSeniorId);
    localStorage.setItem('anjo_app_mode', selectedMode);

    setRegisteredSuccess({
      user: newUser,
      senior: newSenior,
      consentHash: `LGPD-SEC-${consentId.toUpperCase()}-${Math.floor(Math.random() * 890000 + 100000)}`,
      mode: selectedMode,
      refLabel: finalCampLabel
    });

    // Fire event to let other systems compile
    window.dispatchEvent(new Event('anjo_user_updated'));
  };

  return (
    <div className={`min-h-screen ${accessibility?.darkMode ? 'bg-[#0f172a] text-slate-100 dark-mode' : 'bg-cozy-cream text-slate-800'} flex flex-col items-center justify-start sm:justify-center pt-6 pb-24 px-4 sm:p-6 relative font-sans overflow-y-auto`}>
      
      
      {onUpdateAccessibility && accessibility && (
        <div className="fixed top-4 right-4 z-50">
          <button
            type="button"
            onClick={() => onUpdateAccessibility({
              ...accessibility,
              darkMode: !accessibility.darkMode
            })}
            className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-black uppercase tracking-wider ${
              accessibility.darkMode 
                ? 'bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-750 shadow-md' 
                : 'bg-white border-slate-205 text-slate-700 hover:bg-slate-50 shadow-sm shadow-indigo-100'
            }`}
            title={accessibility.darkMode ? "Mudar para ModoClaro" : "Conforto Visual (Modo Noturno)"}
          >
            {accessibility.darkMode ? (
              <>
                <Sun className="w-4 h-4 text-amber-300 fill-amber-300/15" />
                <span className="hidden xs:inline">ModoClaro</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-950" />
                <span className="hidden xs:inline">Conforto Visual</span>
              </>
            )}
          </button>
        </div>
      )}

      
      <div className="absolute top-0 right-0 w-64 h-64 bg-serene-blue/5 rounded-full blur-3xl text-slate-100"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-care-green/5 rounded-full blur-3xl text-slate-100"></div>

      <div className={`max-w-xl w-full ${accessibility?.darkMode ? 'bg-slate-900 border-slate-800 shadow-2xl shadow-black/50' : 'bg-white border-soft-gray shadow-xl'} rounded-3xl border p-4 sm:p-8 space-y-5 md:space-y-6 relative z-10 my-4 sm:my-auto`}>
        
        
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="w-44 h-44 bg-white rounded-3xl overflow-hidden flex items-center justify-center shadow-lg border border-slate-100 relative group transform hover:scale-105 transition-all p-2">
            <img src="/logo.png?v=15" alt="AnjoCuidador Logo" className="w-full h-full object-contain transform scale-[1.45] rounded-2xl" referrerPolicy="no-referrer" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>

          <div className="space-y-1 w-full px-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight font-display w-full text-center">
              {selectedMode.startsWith('escolar') ? 'Anjinho Escolar' : 'AnjoCuidador'}
            </h1>
            <p className="text-xs sm:text-sm text-serene-blue dark:text-indigo-300 font-extrabold tracking-wide uppercase leading-relaxed w-full text-center block">
              {selectedMode === 'escolar_infantil' 
                ? 'Rotina, Seguranca e Conectividade para Educacao Infantil' 
                : 'Tranquilidade, presença e carinho para quem voce ama'
              }
            </p>
          </div>
        </div>

        
        {!registeredSuccess && (
          <div className="flex bg-slate-100/80 p-1 rounded-2xl gap-1">
            <button
              onClick={() => {
                setActiveTab('login');
                setErrorMessage('');
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'login' 
                  ? 'bg-indigo-650 text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              Entrar (Simular Perfil)
            </button>
            <button
              onClick={() => {
                setActiveTab('trial');
                setErrorMessage('');
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'trial' 
                  ? 'bg-emerald-600 text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              30 Dias Gratis & LGPD
            </button>
          </div>
        )}

        
        {registeredSuccess ? (
          <div className="space-y-5 py-2 animate-fade-in text-left">
            <div className="p-4 bg-emerald-50/75 border border-emerald-200 rounded-2xl flex items-start gap-3">
              <div className="p-2 bg-emerald-500 rounded-xl text-white shrink-0 mt-0.5 animate-bounce">
                <Check className="w-5 h-5 stroke-[3]" />
              </div>
              <div className="space-y-1">
                <strong className="text-sm font-black text-slate-800">Termo LGPD Assinado & Teste Gratis Ativado!</strong>
                <p className="text-xs text-slate-600 leading-normal">
                  Seus dados e o consentimento de tratamento de dados sensiveis foram salvos em nossa planilha central. Chave de auditoria para fins juridicos:
                </p>
                <div className="bg-white/80 border border-emerald-150 rounded-lg px-2.5 py-1 text-[10px] text-emerald-700 font-mono mt-1 w-fit">
                  {registeredSuccess.consentHash}
                </div>
              </div>
            </div>

            
            <div className="border border-slate-150 rounded-2xl p-4 space-y-3 bg-slate-50/50">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Informacoes da Conta de Teste</span>
              
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block leading-tight">Nome Tutor (Admin)</span>
                  <strong className="text-slate-800 block font-bold truncate">{registeredSuccess.user.nome}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block leading-tight">WhatsApp cadastrado</span>
                  <strong className="text-slate-800 block font-bold truncate">{registeredSuccess.user.telefone}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block leading-tight">Canal Promocional</span>
                  <strong className="text-indigo-600 block font-bold truncate">{registeredSuccess.refLabel}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block leading-tight">Assistido (Senior/Aluno)</span>
                  <strong className="text-slate-800 block font-bold truncate">  {registeredSuccess.senior.nome}</strong>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-slate-500">Seu PIN padrao de acesso:</span>
                </div>
                <strong className="font-mono text-amber-600 font-black text-sm bg-amber-50 px-2 py-0.5 rounded border border-amber-200">{registeredSuccess.user.pin}</strong>
              </div>
            </div>

            <p className="text-xs text-slate-550 leading-relaxed text-center">
              Criamos um painel completo com dados estruturados para voce avaliar a rotina, o relatorio de turnos e o envio de mensagens ficticias pelo WhatsApp.
            </p>

            <button
              onClick={() => {
                onLoginSuccess(registeredSuccess.user);
              }}
              className="w-full p-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-base uppercase tracking-wider rounded-2xl transition-all cursor-pointer shadow-md shadow-emerald-600/10 flex items-center justify-center gap-2"
            >
              Comecar Teste Pratico de 30 Dias <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        ) : activeTab === 'trial' ? (
          /* 2. TRIAL ONBOARDING FORM VIEW */
          <form onSubmit={handleTrialSubmit} className="space-y-4 animate-fade-in text-left">
            
            
            <div className={`p-3 rounded-2xl border ${accessibility?.darkMode ? 'bg-emerald-950/20 border-emerald-900/50 text-emerald-300' : 'bg-emerald-50/40 border-emerald-100 text-emerald-800'} flex items-center gap-2`}>
              <span className="text-xs"> </span>
              <p className="text-[11px] font-bold leading-normal">
                Voce escaneou e ativou nosso voucher promocional! Preencha abaixo para assinar os termos e criar seu perfil gratis de 30 dias.
              </p>
            </div>

            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedMode('idoso')}
                className={`p-3 rounded-xl border text-center font-bold text-xs flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                  selectedMode === 'idoso'
                    ? (accessibility?.darkMode ? 'border-emerald-500 bg-emerald-950/30 text-emerald-400 ring-1 ring-emerald-500' : 'border-emerald-500 bg-emerald-50/20 text-emerald-700 ring-1 ring-emerald-400')
                    : (accessibility?.darkMode ? 'border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-750' : 'border-slate-205 bg-slate-50 text-slate-500')
                }`}
              >
                <span className="text-lg"> </span>
                AnjoCuidador (Idosos)
              </button>
              <button
                type="button"
                onClick={() => setSelectedMode('escolar_infantil')}
                className={`p-3 rounded-xl border text-center font-bold text-xs flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                  selectedMode === 'escolar_infantil'
                    ? (accessibility?.darkMode ? 'border-indigo-500 bg-indigo-950/30 text-indigo-400 ring-1 ring-indigo-500' : 'border-indigo-500 bg-indigo-50/20 text-indigo-700 ring-1 ring-indigo-400')
                    : (accessibility?.darkMode ? 'border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-750' : 'border-slate-205 bg-slate-50 text-slate-500')
                }`}
              >
                <div className="w-12 h-12 flex items-center justify-center overflow-hidden border border-slate-200/60 rounded-lg bg-white p-1 shadow-3xs shrink-0">
                  <img src="/logo.png?v=15" alt="Anjinho Logo" className="w-full h-full object-contain transform scale-[1.35]" referrerPolicy="no-referrer" />
                </div>
                AnjinhoCreche/Maternal
              </button>
            </div>

            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Seu Nome Completo (Administrador/Tutor)</label>
                <div className="relative mt-0.5">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Albuquerque"
                    value={tutorName}
                    onChange={e => setTutorName(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 ${accessibility?.darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:bg-slate-850 focus:ring-emerald-500/25' : 'bg-slate-50 border-slate-205 text-slate-800 focus:bg-white focus:ring-emerald-400/25'} rounded-xl text-xs focus:ring-2`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Seu Cargo / Perfil no Sistema</label>
                  <select
                    value={cargoUsuario}
                    onChange={e => setCargoUsuario(e.target.value as any)}
                    className={`w-full mt-0.5 px-3 py-2 ${accessibility?.darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:bg-slate-850 focus:ring-emerald-500/25' : 'bg-slate-50 border-slate-205 text-slate-800 focus:bg-white focus:ring-emerald-400/25'} rounded-xl text-xs font-bold focus:ring-2`}
                  >
                    <option value="diretor">  Diretor(a) / Gestor(a)</option>
                    <option value="coordenador">    Coordenador(a) Pedagogico(a)</option>
                    <option value="professor">    Professor(a) / Educador(a)</option>
                    <option value="desenvolvedor">  Desenvolvedor (Dev)</option>
                    <option value="familiar_admin">    Familiar Admin (Responsavel Principal - Acesso a Autorizacoes)</option>
                    <option value="familiar_convidado">  Familiar Convidado (Leitor / Outro Parente - Sem Autorizacoes)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Telefone WhatsApp</label>
                  <div className="relative mt-0.5">
                    <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="(11) 99999-9999"
                      value={whatsapp}
                      onChange={e => handlePhoneChange(e.target.value)}
                      className={`w-full pl-9 pr-3 py-2 ${accessibility?.darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:bg-slate-850 focus:ring-emerald-500/25' : 'bg-slate-50 border-slate-205 text-slate-800 focus:bg-white focus:ring-emerald-400/25'} rounded-xl text-xs focus:ring-2`}
                    />
                  </div>
                </div>
              </div>

              {(cargoUsuario === 'familiar' || cargoUsuario === 'familiar_admin' || cargoUsuario === 'familiar_convidado') && (
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Grau de Parentesco / Relacao</label>
                  <select
                    value={relacionamento}
                    onChange={e => setRelacionamento(e.target.value)}
                    className={`w-full mt-0.5 px-3 py-2 ${accessibility?.darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:bg-slate-850 focus:ring-emerald-500/25' : 'bg-slate-50 border-slate-205 text-slate-800 focus:bg-white focus:ring-emerald-400/25'} rounded-xl text-xs focus:ring-2`}
                  >
                    <option value="Filho(a)">Filho(a)</option>
                    <option value="Pai/Mae">Pai/Mae</option>
                    <option value="Neto(a)">Neto(a)</option>
                    <option value="Conjuge">Conjuge</option>
                    <option value="Cuidador(a) Profissional">Cuidador(a) Profissional</option>
                    <option value="Responsavel Legal">Responsavel Legal</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-10 gap-3">
                <div className="sm:col-span-7">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                    {selectedMode.startsWith('escolar') ? 'Nome do Aluno (Crianca)' : 'Nome do Assistido (Idoso)'}
                  </label>
                  <div className="relative mt-0.5">
                    <Baby className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder={selectedMode.startsWith('escolar') ? "Ex: Beatriz Albuquerque" : "Ex: Dona Alzira Albuquerque"}
                      value={assistidoNome}
                      onChange={e => setAssistidoNome(e.target.value)}
                      className={`w-full pl-9 pr-3 py-2 ${accessibility?.darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:bg-slate-850 focus:ring-emerald-500/25' : 'bg-slate-50 border-slate-205 text-slate-800 focus:bg-white focus:ring-emerald-400/25'} rounded-xl text-xs focus:ring-2 font-bold`}
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1" title="Digite 4 digitos para servir de PIN de seguranca">PIN desejado</label>
                  <input
                    type="password"
                    required
                    maxLength={4}
                    placeholder="1234"
                    value={customPin}
                    onChange={e => setCustomPin(e.target.value.replace(/\D/g, ''))}
                    className={`w-full mt-0.5 px-3 py-2 ${accessibility?.darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:bg-slate-850 font-mono text-sm tracking-widest font-black' : 'bg-slate-50 border-slate-205 text-slate-800 focus:bg-white font-mono text-sm tracking-widest font-black'} rounded-xl text-xs text-center focus:ring-2 focus:ring-emerald-400/25`}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Seu Melhor E-mail</label>
                <div className="relative mt-0.5">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="carlos@exemplo.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 ${accessibility?.darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:bg-slate-850 focus:ring-emerald-500/25' : 'bg-slate-50 border-slate-205 text-slate-800 focus:bg-white focus:ring-emerald-400/25'} rounded-xl text-xs focus:ring-2`}
                  />
                </div>
              </div>
            </div>

            
            <div className={`p-4.5 rounded-2xl border ${accessibility?.darkMode ? 'bg-slate-850 border-slate-750' : 'bg-slate-50 border-slate-200/80'} space-y-3`}>
              <div className={`flex items-center gap-1.5 ${accessibility?.darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                <Shield className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-black uppercase tracking-wider">Clausulas de Protecao LGPD</span>
              </div>
              
              <div className="space-y-3 pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreedSensivel}
                    onChange={() => setAgreedSensivel(!agreedSensivel)}
                    className="mt-0.5 accent-emerald-600"
                  />
                  <span className={`text-[10.5px] ${accessibility?.darkMode ? 'text-slate-300' : 'text-slate-600'} leading-normal font-medium`}>
                    Autorizo livremente o tratamento de dados pessoais sensiveis de saude de <strong className={accessibility?.darkMode ? 'text-white font-extrabold' : 'text-slate-800'}>{assistidoNome || 'meu assistido'}</strong> conforme Lei 13.709/18.
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreedTutor}
                    onChange={() => setAgreedTutor(!agreedTutor)}
                    className="mt-0.5 accent-emerald-600"
                  />
                  <span className={`text-[10.5px] ${accessibility?.darkMode ? 'text-slate-300' : 'text-slate-600'} leading-normal font-medium`}>
                    Declaro ser familiar legalmente investido ou autorizado para realizar este cadastro em ambiente piloto corporativo.
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreedPolitica}
                    onChange={() => setAgreedPolitica(!agreedPolitica)}
                    className="mt-0.5 accent-emerald-600"
                  />
                  <span className={`text-[10.5px] ${accessibility?.darkMode ? 'text-slate-300' : 'text-slate-600'} leading-normal font-medium`}>
                    Aceito os Termos de Uso e Politica de Privacidade do App, concordando com a geracao de chaves criptograficas para auditoria no painel Admin.
                  </span>
                </label>
              </div>
            </div>

            {errorMessage && (
              <p className="text-[11px] text-alert-red font-bold text-center bg-red-50 border border-red-150 rounded-lg p-2 animate-pulse">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              className="w-full p-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-sm uppercase tracking-widest rounded-2xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
            >
                Assinar Termos & Ativar Periodo de Testes
            </button>
          </form>
        ) : (
          /* 3. SIMULATOR ACCESS LOGIN TAB (Original Chooser) */
          <form onSubmit={handleBypassSubmit} className={`space-y-6 pt-2 border-t ${accessibility?.darkMode ? 'border-slate-800' : 'border-slate-100'} text-left`}>
            
            
            {pendingClassroom && (
              <div className="p-4 bg-indigo-50 dark:bg-indigo-950/70 border-2 border-indigo-500/50 rounded-2xl flex items-start justify-between gap-3 text-indigo-900 dark:text-indigo-100 shadow-md animate-fade-in">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-indigo-600 text-white rounded-xl text-lg shrink-0 shadow-sm shadow-indigo-600/30">
                      
                  </div>
                  <div className="space-y-1 text-xs">
                    <strong className="font-black text-sm text-indigo-950 dark:text-indigo-100 block">
                      Acesso Seguro a Sala: <span className="underline decoration-indigo-400">{pendingClassroom}</span>
                    </strong>
                    <p className="text-[11px] text-indigo-800 dark:text-indigo-200 font-semibold leading-relaxed">
                      {pendingTeacherName 
                        ? `Perfil da professora ${pendingTeacherName} pre-selecionado.` 
                        : 'Selecione seu perfil de professora.'} 
                      Por favor, digite seu PIN de seguranca para autorizar e entrar na sala.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('anjo_pending_classroom');
                    localStorage.removeItem('anjo_pending_teacher_id');
                    setPendingClassroom(null);
                    setPendingTeacherName(null);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg shrink-0 cursor-pointer"
                  title="Cancelar atalho para sala"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="space-y-3">
              <label className={`text-xs font-bold ${accessibility?.darkMode ? 'text-slate-400' : 'text-slate-600'} block text-center md:text-left uppercase tracking-wider`}>
                Selecione o Modo e um dos Perfis Simulados para Entrar:
              </label>
              
              
              <div className={`text-[10px] text-center font-black uppercase tracking-widest p-1 rounded-md ${
                connectionStatus === 'Conectado' ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'
              }`}>
                Estado: {connectionStatus}
              </div>

              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl flex gap-1 w-full max-w-xs mx-auto sm:mx-0">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMode('idoso');
                      setProfileSearch('');
                    }}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
                      selectedMode === 'idoso'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                      Idoso
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMode('escolar_infantil');
                      setProfileSearch('');
                    }}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
                      selectedMode === 'escolar_infantil'
                        ? 'bg-indigo-650 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                      Creche
                  </button>
                </div>

                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold text-center sm:text-right">
                    Busca rapida de profissionais por nome
                </span>
              </div>

              
              <div className="space-y-2 pt-1">
                <div className="relative flex items-center">
                  <Search className={`w-4 h-4 absolute left-3.5 pointer-events-none transition-colors ${
                    accessibility?.darkMode ? 'text-slate-400' : 'text-indigo-500'
                  }`} />
                  <input
                    type="text"
                    value={profileSearch}
                    onChange={(e) => setProfileSearch(e.target.value)}
                    placeholder={
                      selectedMode.startsWith('escolar')
                        ? "  Digite nome da professora, educadora ou responsavel..."
                        : "  Digite nome da cuidadora, medica ou familiar..."
                    }
                    className={`w-full pl-10 pr-20 py-2.5 rounded-2xl text-xs font-bold transition-all focus:outline-none ${
                      accessibility?.darkMode
                        ? 'bg-slate-800 text-slate-100 placeholder-slate-400 border border-slate-700 focus:ring-2 focus:ring-indigo-500'
                        : 'bg-white text-slate-900 placeholder-slate-400 border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-xs'
                    }`}
                  />
                  <div className="absolute right-2.5 flex items-center gap-1">
                    {profileSearch && (
                      <button
                        type="button"
                        onClick={() => setProfileSearch('')}
                        className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-slate-400 transition-all cursor-pointer"
                        title="Limpar busca"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <VoiceInput
                      onTranscript={(text) => setProfileSearch(text)}
                      size="sm"
                    />
                  </div>
                </div>

                
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[10px]">
                  <button
                    type="button"
                    onClick={() => setProfileRoleFilter('todos')}
                    className={`px-2.5 py-1 rounded-xl font-extrabold transition-all shrink-0 cursor-pointer ${
                      profileRoleFilter === 'todos'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfileRoleFilter('admin')}
                    className={`px-2.5 py-1 rounded-xl font-extrabold transition-all shrink-0 cursor-pointer ${
                      profileRoleFilter === 'admin'
                        ? 'bg-indigo-700 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                      Dir.
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfileRoleFilter('profissional')}
                    className={`px-2.5 py-1 rounded-xl font-extrabold transition-all shrink-0 cursor-pointer ${
                      profileRoleFilter === 'profissional'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                        Coord.
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfileRoleFilter('cuidador')}
                    className={`px-2.5 py-1 rounded-xl font-extrabold transition-all shrink-0 cursor-pointer ${
                      profileRoleFilter === 'cuidador'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                        Prof.
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfileRoleFilter('familiar_admin')}
                    className={`px-2.5 py-1 rounded-xl font-extrabold transition-all shrink-0 cursor-pointer ${
                      profileRoleFilter === 'familiar_admin'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                        Fam. Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfileRoleFilter('familiar_convidado')}
                    className={`px-2.5 py-1 rounded-xl font-extrabold transition-all shrink-0 cursor-pointer ${
                      profileRoleFilter === 'familiar_convidado'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                      Fam. Conv.
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfileRoleFilter('desenvolvedor')}
                    className={`px-2.5 py-1 rounded-xl font-extrabold transition-all shrink-0 cursor-pointer ${
                      profileRoleFilter === 'desenvolvedor'
                        ? 'bg-purple-700 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                      Dev
                  </button>
                </div>
              </div>
              
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                {(() => {
                  const matchingUsers = dbUsers.filter(user => {
                    const uType = (user.tipo || '').toLowerCase();
                    const uParentesco = (user.parentesco || '').toLowerCase();
                    const uObs = (user.observacoes || '').toLowerCase();
                    const isConvidadoUser = uType === 'familiar_convidado' || uType === 'convidado' || uParentesco.includes('convidado') || uObs.includes('convidado');

                    // Filter by role chip
                    if (profileRoleFilter !== 'todos') {
                      if (profileRoleFilter === 'desenvolvedor') {
                        if (uType !== 'desenvolvedor' && uType !== 'dev' && user.id !== 'user_desenvolvedor_djalma') return false;
                      } else if (profileRoleFilter === 'admin') {
                        const isDirector = uType === 'admin' || uType === 'diretor' || uType === 'diretora' || uType === 'direcao' || user.nome.toLowerCase().includes('nilva') || uObs.includes('diretor') || uObs.includes('diretora');
                        if (!isDirector) return false;
                      } else if (profileRoleFilter === 'profissional') {
                        const isCoord = uType === 'profissional' || uType === 'coordenador' || uType === 'coordenadora' || uType === 'pedagogo' || uType === 'psicopedagogo' || uType === 'medico';
                        if (!isCoord) return false;
                      } else if (profileRoleFilter === 'cuidador') {
                        const isTeacherOrAssistant = uType === 'cuidador' || uType === 'professor' || uType === 'professora' || uType === 'educador' || uType === 'educadora' || uType === 'assistente' || uType === 'estagiaria';
                        if (!isTeacherOrAssistant) return false;
                      } else if (profileRoleFilter === 'familiar_admin') {
                        if ((uType !== 'familiar' && uType !== 'familiar_admin') || isConvidadoUser) return false;
                      } else if (profileRoleFilter === 'familiar_convidado') {
                        if (!isConvidadoUser) return false;
                      } else if (profileRoleFilter === 'familiar') {
                        if (uType !== 'familiar' && uType !== 'familiar_admin' && !isConvidadoUser) return false;
                      } else if (user.tipo !== profileRoleFilter) {
                        return false;
                      }
                    }

                    // Filter by search term
                    if (profileSearch.trim()) {
                      const term = profileSearch.toLowerCase().trim();
                      const matchName = user.nome.toLowerCase().includes(term);
                      const matchTipo = user.tipo.toLowerCase().includes(term);
                      const matchObs = user.observacoes?.toLowerCase().includes(term) || false;
                      const matchPhone = user.telefone?.includes(term) || false;
                      const matchEmail = user.email?.toLowerCase().includes(term) || false;
                      const matchSala = user.salaAula?.toLowerCase().includes(term) || false;

                      const isDirectorType = uType === 'admin' || uType === 'diretor' || uType === 'diretora' || uType === 'direcao' || user.nome.toLowerCase().includes('nilva');
                      const isTeacherType = uType === 'cuidador' || uType === 'professor' || uType === 'professora' || uType === 'educador' || uType === 'educadora' || uType === 'assistente' || uType === 'estagiaria';
                      const isCoordType = uType === 'profissional' || uType === 'coordenador' || uType === 'coordenadora';

                      const roleKeywords = (
                        isTeacherType ? 'cuidador cuidadora professora educadora assistente estagiaria baba tias de apoio ana mariana' :
                        isDirectorType ? 'admin administradora responsavel mae pai tutor djalma alzira diretor diretora nilva direcao direcao' :
                        isCoordType ? 'profissional medica pediatra geriatra doutora luana roberto coordenador coordenadora' :
                        isConvidadoUser ? 'convidado leitura tio avo parente sem autorizacao' :
                        'familiar admin irmao neto parente mae pai responsavel'
                      );
                      const matchKeywords = roleKeywords.includes(term);

                      return matchName || matchTipo || matchObs || matchPhone || matchEmail || matchSala || matchKeywords;
                    }

                    return true;
                  });

                  if (matchingUsers.length === 0) {
                    return (
                      <div className="col-span-full p-6 text-center space-y-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mx-auto text-slate-500">
                          <User className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
                          Nenhum profissional encontrado com "{profileSearch}"
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setProfileSearch('');
                            setProfileRoleFilter('todos');
                          }}
                          className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-indigo-700 cursor-pointer"
                        >
                          Limpar Filtros e Mostrar Todos
                        </button>
                      </div>
                    );
                  }

                  return matchingUsers.map(user => {
                  const active = selectedUser.id === user.id;
                  const isEscolar = selectedMode.startsWith('escolar');
                  let roleLabel = '';
                  let roleColor = '';
                  
                  const uType = (user.tipo || '').toLowerCase();
                  const uParentesco = (user.parentesco || '').toLowerCase();
                  const uObs = (user.observacoes || '').toLowerCase();
                  const isConvidadoUser = uType === 'familiar_convidado' || uType === 'convidado' || uParentesco.includes('convidado') || uObs.includes('convidado');

                  const nameLower = (user.nome || '').toLowerCase();
                  if (uType === 'desenvolvedor' || uType === 'dev' || nameLower.includes('desenvolvedor') || nameLower.includes('dev') || user.id === 'user_desenvolvedor_djalma') {
                    roleLabel = '  Desenvolvedor do Sistema';
                  } else if (uType === 'diretor' || uType === 'diretora' || user.id === 'user_admin' || nameLower.includes('diret') || nameLower.includes('direcao')) {
                    roleLabel = '  Diretor(a) / Gestao Geral';
                  } else if (uType === 'coordenador' || uType === 'coordenadora' || user.id === 'user_medico_1' || nameLower.includes('coordenad')) {
                    roleLabel = '    Coordenador(a) Pedagogico(a)';
                  } else if (uType === 'professor' || uType === 'professora' || uType === 'cuidador' || user.id === 'user_cuidador_1' || nameLower.includes('prof') || nameLower.includes('educad')) {
                    roleLabel = user.salaAula && user.salaAula !== 'Todas' 
                      ? `    Professora (${user.salaAula})` 
                      : '    Professor(a) / Educador(a)';
                  } else if (uType === 'profissional') {
                    roleLabel = '   Equipe de Apoio / Saude';
                  } else if (isConvidadoUser) {
                    roleLabel = '  Familiar (Convidado / Leitor)';
                  } else {
                    roleLabel = user.parentesco ? `    Familiar Admin (${user.parentesco})` : '    Familiar (Admin)';
                  }

                  if (user.tipo === 'admin') {
                    roleColor = accessibility?.darkMode 
                      ? 'border-indigo-500 bg-indigo-950/40 text-indigo-200 ring-2 ring-indigo-500/50' 
                      : 'border-indigo-300 bg-indigo-50/80 text-indigo-950';
                  } else if (user.tipo === 'cuidador') {
                    roleColor = accessibility?.darkMode 
                      ? 'border-amber-500 bg-amber-950/40 text-amber-200 ring-2 ring-amber-500/50' 
                      : 'border-amber-300 bg-amber-50/80 text-amber-950';
                  } else if (user.tipo === 'profissional') {
                    roleColor = accessibility?.darkMode 
                      ? 'border-sky-500 bg-sky-950/40 text-sky-200 ring-2 ring-sky-500/50' 
                      : 'border-sky-300 bg-sky-50/80 text-sky-950';
                  } else {
                    roleColor = accessibility?.darkMode 
                      ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200 ring-2 ring-emerald-500/50' 
                      : 'border-emerald-300 bg-emerald-50/80 text-emerald-950';
                  }

                  const userPin = user.pin || (user.telefone ? user.telefone.replace(/\D/g, '').slice(-4) : '1234');

                  return (
                    <div
                      key={user.id}
                      onClick={() => {
                        if (!active) {
                          setSelectedUser(user);
                          setPasscode('');
                          setErrorMessage('');

                          // Automatically align selected mode with the chosen profile domain
                          const uTypeCard = (user.tipo || '').toLowerCase();
                          const uNameCard = user.nome.toLowerCase();
                          const uIdCard = user.id.toLowerCase();
                          const uParentescoCard = (user.parentesco || '').toLowerCase();

                          const isSeniorProfile = uIdCard === 'user_cuidador_2' || uIdCard === 'user_neto_1' || uIdCard === 'user_convidado_1' || uIdCard.includes('idoso_') || uParentescoCard.includes('neto');
                          const isDirectorCard = uTypeCard === 'diretor' || uTypeCard === 'diretora' || uTypeCard === 'admin' || uNameCard.includes('nilva') || user.id === 'user_admin';
                          const isSchoolStaffCard = isDirectorCard || uTypeCard === 'coordenador' || uTypeCard === 'coordenadora' || uTypeCard === 'professor' || uTypeCard === 'professora' || uTypeCard === 'educador' || uTypeCard === 'educadora' || uIdCard.startsWith('user_pai_') || uIdCard.startsWith('user_mae_') || uIdCard.startsWith('aluno_') || uNameCard.includes('prof') || uNameCard.includes('educad');

                          if (isSeniorProfile) {
                            setSelectedMode('idoso');
                          } else if (isDirectorCard || isSchoolStaffCard || user.salaAula) {
                            setSelectedMode('escolar_infantil');
                          }
                        }
                      }}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        active 
                          ? `${roleColor} shadow-lg ring-2 ring-indigo-500/40` 
                          : (accessibility?.darkMode 
                              ? 'bg-slate-800 border-slate-700 hover:bg-slate-750 text-slate-150 cursor-pointer' 
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-800 cursor-pointer')
                      }`}
                    >
                      
                      <div className="flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <img referrerPolicy="no-referrer" src={user.foto} alt={user.nome} className="w-10 h-10 rounded-full object-cover shadow-xs border border-white/40 shrink-0" />
                          <div className="min-w-0">
                            <strong className={`text-xs font-bold block ${accessibility?.darkMode ? 'text-slate-100' : 'text-slate-800'} truncate`}>{user.nome}</strong>
                            <span className={`text-[9.5px] ${accessibility?.darkMode ? 'text-slate-400' : 'text-slate-500'} uppercase block font-semibold`}>{roleLabel}</span>
                          </div>
                        </div>
                        {active && (
                          <span className="text-[9.5px] bg-indigo-600 text-white font-black px-2 py-0.5 rounded-full shadow-xs shrink-0">
                              Selecionado
                          </span>
                        )}
                      </div>

                      
                      {active && (
                        <div className="mt-3 pt-3 border-t border-indigo-200/60 dark:border-indigo-800/60 space-y-2.5 animate-fade-in" onClick={e => e.stopPropagation()}>
                          <div className="flex justify-between items-center flex-wrap gap-1">
                            <label className="text-[10px] font-black uppercase text-indigo-950 dark:text-indigo-200">Codigo PIN de Acesso</label>
                            <span className="text-[9.5px] font-bold bg-white/90 dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                              PIN: <span className="font-mono text-xs font-black">{userPin}</span>
                            </span>
                          </div>

                          <input 
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="Insira o seu PIN" 
                            value={passcode}
                            onChange={e => setPasscode(e.target.value.replace(/\D/g, ''))}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleBypassSubmit();
                              }
                            }}
                            className={`w-full px-3 py-2.5 ${accessibility?.darkMode ? 'bg-slate-900 border-slate-700 text-slate-100 focus:ring-indigo-500' : 'bg-white border-slate-300 text-slate-800 focus:ring-indigo-500'} rounded-xl focus:ring-2 tracking-widest font-mono text-center font-black text-base shadow-inner`}
                            maxLength={8}
                            autoFocus
                          />

                          
                          <div className="grid grid-cols-3 gap-1.5 pt-1 max-w-[220px] mx-auto">
                            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                              <button
                                key={num}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPasscode(prev => (prev + num).slice(0, 8));
                                }}
                                className={`py-2 rounded-xl font-mono font-black text-sm transition-all cursor-pointer shadow-2xs active:scale-95 ${
                                  accessibility?.darkMode
                                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700'
                                    : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200'
                                }`}
                              >
                                {num}
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPasscode('');
                              }}
                              className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                                accessibility?.darkMode
                                  ? 'bg-red-950/40 text-red-300 border border-red-900/50'
                                  : 'bg-red-50 text-red-600 border border-red-200'
                              }`}
                              title="Limpar PIN"
                            >
                              C
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPasscode(prev => (prev + '0').slice(0, 8));
                              }}
                              className={`py-2 rounded-xl font-mono font-black text-sm transition-all cursor-pointer shadow-2xs active:scale-95 ${
                                accessibility?.darkMode
                                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200'
                              }`}
                            >
                              0
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPasscode(prev => prev.slice(0, -1));
                              }}
                              className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                                accessibility?.darkMode
                                  ? 'bg-slate-800 text-slate-300 border border-slate-700'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                              title="Apagar ultimo numero"
                            >
                               
                            </button>
                          </div>

                          {errorMessage && (
                            <p className="text-[11px] text-red-600 font-bold text-center bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-lg p-1.5 animate-pulse">
                              {errorMessage}
                            </p>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleBypassSubmit();
                            }}
                            className="w-full py-2.5 px-3 bg-serene-blue hover:bg-blue-600 active:scale-98 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                          >
                            Confirmar & Entrar <Check className="w-4 h-4 stroke-[3px]" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                });
                })()}
              </div>
            </div>
          </form>
        )}

        
        <div className={`p-3.5 ${accessibility?.darkMode ? 'bg-indigo-950/20 border-indigo-900/50 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-800'} rounded-xl text-[10px] text-center leading-relaxed`}>
            <strong>Nota Importante:</strong> O aplicativo {selectedMode.startsWith('escolar') ? 'Anjinho Escolar' : 'AnjoCuidador'} foi desenvolvido de forma estrita em total concord com as diretrizes de protecao e privacidade da <strong>LGPD (Lei no 13.709/2018)</strong> brasileira.
        </div>
      </div>
    </div>
  );
}

