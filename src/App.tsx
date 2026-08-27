// Vercel Production Build Commit: 1787865194
// Sync trigger: 2026-06-21 20:37 - Anjo Cuidador high-fidelity PNG logo update using bulletproof asset loading
import React, { useState, useEffect } from 'react';
import { Usuario, Idoso, NotificacaoSimulada, formatWhatsAppNumber, isStaffUser, getRoleLabel, isDirectorOrAdminUser } from './types';
import { initializeDB, getFromDB, saveToDB, SALAS_INICIAIS, IDOSOS_INICIAIS, USUARIOS_SIMULADOS } from './data';
import { startFirebaseSync } from './firebase';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Medications from './components/Medications';
import MedicalAgenda from './components/MedicalAgenda';
import DailyRoutine from './components/DailyRoutine';
import FamilySection from './components/FamilySection';
import Reports from './components/Reports';
import Alerts from './components/Alerts';
import SettingsPage from './components/Settings';
import FinancePaywall from './components/FinancePaywall';
import FinanceModule from './components/FinanceModule';
import CoordinationPanel from './components/CoordinationPanel';
import ClassroomList from './components/ClassroomList';
import AdminPanel from './components/AdminPanel';
import DirectorPanel from './components/DirectorPanel';
import JornadaAnjinho from './components/JornadaAnjinho';
import BrandBook from './components/BrandBook';
import { QuickStudentSearch } from './components/QuickStudentSearch';
import EditProfileModal from './components/EditProfileModal';
import FirebaseDiagnosticBar from './components/FirebaseDiagnosticBar';


import { 
  Heart, 
  Activity, 
  Calendar, 
  Clock, 
  MessageSquare, 
  User, 
  Users, 
  Sliders, 
  Sparkles, 
  LogOut, 
  Menu, 
  X,
  BellRing,
  Award,
  HelpCircle,
  Moon,
  Sun,
  Baby,
  GraduationCap,
  School,
  ShieldCheck,
  Lock,
  BookOpen,
  Coins,
  ChevronDown
} from 'lucide-react';

export default function App() {
  const [usuarioAtual, setUsuarioAtual] = useState<Usuario | null>(null);
  const [idosoAtual, setIdosoAtual] = useState<Idoso | null>(null);
  
  // Modo de aplicativo: Idoso (Anjo Cuidador), Pré-escolar (Anjinho Escolar) ou Fundamental (Ensino Fundamental I)
  const [appMode, setAppMode] = useState<'idoso' | 'escolar_infantil' | 'escolar_fundamental'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlMode = params.get('mode');
      if (urlMode === 'escolar' || urlMode === 'fundamental' || urlMode === 'infantil') {
        localStorage.setItem('anjo_app_mode', 'escolar_infantil');
        return 'escolar_infantil';
      } else if (urlMode === 'idoso') {
        localStorage.setItem('anjo_app_mode', 'idoso');
        return 'idoso';
      }
    }
    const saved = localStorage.getItem('anjo_app_mode');
    if (saved === 'escolar_fundamental' || saved === 'escolar') {
      localStorage.setItem('anjo_app_mode', 'escolar_infantil');
      return 'escolar_infantil';
    }
    return (saved as 'idoso' | 'escolar_infantil' | 'escolar_fundamental') || 'idoso';
  });

  const isEscolar = appMode === 'escolar_infantil' || appMode === 'escolar_fundamental';
  const isFundamental = false;

  const isApresentacao = localStorage.getItem('anjo_modo_apresentacao') === 'true';

  // Inst / Co-Branding states
  const [instName, setInstName] = useState(() => {
    const mode = (localStorage.getItem('anjo_app_mode') as 'idoso' | 'escolar_infantil' | 'escolar_fundamental') || 'idoso';
    return localStorage.getItem(`anjo_brand_name_${mode}`) || '';
  });
  const [instLogo, setInstLogo] = useState(() => {
    const mode = (localStorage.getItem('anjo_app_mode') as 'idoso' | 'escolar_infantil' | 'escolar_fundamental') || 'idoso';
    return localStorage.getItem(`anjo_brand_logo_${mode}`) || '';
  });
  const [instSlogan, setInstSlogan] = useState(() => {
    const mode = (localStorage.getItem('anjo_app_mode') as 'idoso' | 'escolar_infantil' | 'escolar_fundamental') || 'idoso';
    return localStorage.getItem(`anjo_brand_slogan_${mode}`) || '';
  });

  // Controle de PIN de segurança para trancamento do Modo Escolar e Admin
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinValue, setPinValue] = useState('');
  const [pinError, setPinError] = useState('');
  const [pendingAction, setPendingAction] = useState<'toggle_mode' | 'view_admin' | 'view_director' | null>(null);
  const [showModeSelectionModal, setShowModeSelectionModal] = useState(false);

  const handleToggleAppMode = () => {
    // If we are already in school mode, allow opening the mode selection instantly
    if (isEscolar) {
      setShowModeSelectionModal(true);
    } else {
      setPendingAction('toggle_mode');
      setPinValue('');
      setPinError('');
      setShowPinModal(true);
    }
  };

  const handleSelectNavScreen = (screenId: string) => {
    const isMaster = localStorage.getItem('anjo_master_demonstracao_ativo') === 'true';
    const isDev = usuarioAtual?.tipo === 'desenvolvedor' || usuarioAtual?.tipo === 'dev' || usuarioAtual?.id === 'user_desenvolvedor_djalma' || usuarioAtual?.nome?.toLowerCase().includes('djalma');
    const isDirector = isDirectorOrAdminUser(usuarioAtual);

    if (screenId === 'admin') {
      if (isMaster || isDev || isDirector) {
        setActiveScreen('admin');
        return;
      }
      setPendingAction('view_admin');
      setPinValue('');
      setPinError('');
      setShowPinModal(true);
    } else if (screenId === 'director') {
      if (isMaster || isDev || isDirector) {
        setActiveScreen('director');
        return;
      }
      setPendingAction('view_director');
      setPinValue('');
      setPinError('');
      setShowPinModal(true);
    } else if (screenId === 'toggle_mode_tab') {
      handleToggleAppMode();
    } else {
      setActiveScreen(screenId);
    }
  };

  const changeAppMode = (newMode: 'idoso' | 'escolar_infantil' | 'escolar_fundamental') => {
    setAppMode(newMode);
    localStorage.setItem('anjo_app_mode', newMode);
    
    // Update co-branding defaults
    setInstName(localStorage.getItem(`anjo_brand_name_${newMode}`) || '');
    setInstLogo(localStorage.getItem(`anjo_brand_logo_${newMode}`) || '');

    // Auto shift profile depending on target mode so user has correct mock context loaded immediately
    const allSeniors = getFromDB<Idoso[]>('anjo_idosos', []);
    if (newMode === 'escolar_fundamental') {
      const targetStudent = allSeniors.find(s => s.id === 'aluno_fun_1') || allSeniors.find(s => s.id.startsWith('aluno_fun_'));
      if (targetStudent) {
        setIdosoAtual(targetStudent);
        localStorage.setItem('anjo_simulacao_idoso_id', targetStudent.id);
      }
    } else if (newMode === 'escolar_infantil') {
      const targetStudent = allSeniors.find(s => s.id === 'aluno_1') || allSeniors.find(s => s.id.startsWith('aluno_') && !s.id.startsWith('aluno_fun_'));
      if (targetStudent) {
        setIdosoAtual(targetStudent);
        localStorage.setItem('anjo_simulacao_idoso_id', targetStudent.id);
      }
    } else {
      const targetSenior = allSeniors.find(s => s.id === 'idoso_maria') || allSeniors.find(s => !s.id.startsWith('aluno_'));
      if (targetSenior) {
        setIdosoAtual(targetSenior);
        localStorage.setItem('anjo_simulacao_idoso_id', targetSenior.id);
      }
    }

    setShowModeSelectionModal(false);
    setKeyTrigger(prev => prev + 1);
  };

  const executeToggleAppMode = () => {
    setShowModeSelectionModal(true);
  };

  const [activeScreen, setActiveScreen] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const screenParam = new URLSearchParams(window.location.search).get('screen');
      if (screenParam) {
        return screenParam;
      }
    }
    return 'dashboard';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [keyTrigger, setKeyTrigger] = useState(0); // triggering force refreshes
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);

  const handleSaveProfile = (updatedUser: Usuario) => {
    setUsuarioAtual(updatedUser);
    localStorage.setItem('anjo_simulacao_user_id', updatedUser.id);
    setKeyTrigger(prev => prev + 1);
  };

  // Monthly subscription active state
  const [subscriptionStatus, setSubscriptionStatus] = useState<'pago' | 'atrasado'>('pago');
  const [subscriptionPrice, setSubscriptionPrice] = useState<number>(29.90);

  useEffect(() => {
    if (idosoAtual) {
      const status = localStorage.getItem(`anjo_sub_status_${idosoAtual.id}`) || 'pago';
      setSubscriptionStatus(status as 'pago' | 'atrasado');
      const isCustom = localStorage.getItem(`anjo_sub_is_custom_${idosoAtual.id}`) === 'true';
      const price = isCustom
        ? parseFloat(localStorage.getItem(`anjo_sub_valor_${idosoAtual.id}`) || '29.90')
        : parseFloat(localStorage.getItem('anjo_sub_valor_default') || '29.90');
      setSubscriptionPrice(price);
    }
  }, [idosoAtual, keyTrigger]);

  // Global accessibility state
  const [accessibility, setAccessibility] = useState<{ fontSize: 'normal' | 'grande' | 'gigante'; simplifiedMode: boolean; darkMode: boolean }>({
    fontSize: 'normal',
    simplifiedMode: false,
    darkMode: false
  });

  // Floating push notification animation simulation state
  const [notifPush, setNotifPush] = useState<{ visible: boolean; title: string; message: string } | null>(null);

  // Initialize DB once on boot
  useEffect(() => {
    console.log('✅ App JS carregado no dispositivo:', new Date().toISOString());
    initializeDB();
    // startFirebaseSync(); // Temporarily disabled to rescue login
    
    const handleUserUpdatedEvent = (e: any) => {
      const savedUserId = localStorage.getItem('anjo_simulacao_user_id');
      const allUsers = getFromDB<Usuario[]>('anjo_usuarios', []);
      if (e?.detail && typeof e.detail === 'object' && e.detail.id) {
        setUsuarioAtual(e.detail);
      } else if (savedUserId) {
        const match = allUsers.find(u => u.id === savedUserId);
        if (match) {
          setUsuarioAtual(match);
        }
      }

      // Also refresh active student/senior object from DB in case contact/profile was updated
      const allSeniors = getFromDB<Idoso[]>('anjo_idosos', []);
      setIdosoAtual(prev => {
        if (prev) {
          const fresh = allSeniors.find(s => s.id === prev.id);
          if (fresh) return fresh;
        }
        return prev;
      });

      setKeyTrigger(prev => prev + 1);
    };
    const handleIdososUpdatedEvent = () => {
      const allSeniors = getFromDB<Idoso[]>('anjo_idosos', []);
      const savedId = localStorage.getItem('anjo_simulacao_idoso_id');
      const currentAppMode = (localStorage.getItem('anjo_app_mode') as 'idoso' | 'escolar_infantil' | 'escolar_fundamental') || 'escolar_infantil';
      const isEscolar = currentAppMode.startsWith('escolar');
      
      setIdosoAtual(prev => {
        if (prev) {
          const freshCurrent = allSeniors.find(s => s.id === prev.id);
          if (freshCurrent) {
            const isPrevStudent = freshCurrent.id.startsWith('aluno_');
            if (isEscolar && isPrevStudent) return freshCurrent;
            if (!isEscolar && !isPrevStudent) return freshCurrent;
          }
        }
        const matched = savedId ? allSeniors.find(s => s.id === savedId) : null;
        if (matched) {
          const isMatchedStudent = matched.id.startsWith('aluno_');
          if (isEscolar && isMatchedStudent) return matched;
          if (!isEscolar && !isMatchedStudent) return matched;
        }
        if (isEscolar) {
          const validStudents = allSeniors.filter(s => s.id.startsWith('aluno_'));
          const fallbackStudent = validStudents.find(s => s.id === 'aluno_1') || validStudents[0];
          if (fallbackStudent) {
            localStorage.setItem('anjo_simulacao_idoso_id', fallbackStudent.id);
            return fallbackStudent;
          }
        } else {
          const validSeniors = allSeniors.filter(s => !s.id.startsWith('aluno_'));
          const fallbackSenior = validSeniors.find(s => s.id === 'idoso_maria') || validSeniors[0];
          if (fallbackSenior) {
            localStorage.setItem('anjo_simulacao_idoso_id', fallbackSenior.id);
            return fallbackSenior;
          }
        }
        return prev;
      });
      setKeyTrigger(prev => prev + 1);
    };

    window.addEventListener('anjo_user_updated', handleUserUpdatedEvent);
    window.addEventListener('anjo_idosos_updated', handleIdososUpdatedEvent);
    
    // Force restore owner's requested Admin PIN to recover access
    if (!localStorage.getItem('anjo_admin_pin')) {
      localStorage.setItem('anjo_admin_pin', '9181');
    }
    
    // Load active settings if saved
    const savedUserId = localStorage.getItem('anjo_simulacao_user_id');
    let allUsers = getFromDB<Usuario[]>('anjo_usuarios', USUARIOS_SIMULADOS);
    if (!allUsers || allUsers.length === 0) {
      allUsers = USUARIOS_SIMULADOS;
      saveToDB('anjo_usuarios', allUsers);
    }
    
    // Automatically login simulation character if one exists
    let loggedUser: Usuario | null = null;
    if (savedUserId) {
      const match = allUsers.find(u => u.id === savedUserId);
      if (match) {
        setUsuarioAtual(match);
        loggedUser = match;
      }
    }

    const savedIdosoId = localStorage.getItem('anjo_simulacao_idoso_id');
    let allSeniors = getFromDB<Idoso[]>('anjo_idosos', []);
    if (!allSeniors || allSeniors.length === 0) {
      allSeniors = IDOSOS_INICIAIS;
      saveToDB('anjo_idosos', allSeniors);
    }
    
    // Check if there is a studentId specified in the URL query parameters
    const params = new URLSearchParams(window.location.search);
    const studentIdParam = params.get('studentId');
    
    let matchedSaved = savedIdosoId ? allSeniors.find(s => s.id === savedIdosoId) : null;
    
    if (studentIdParam) {
      const found = allSeniors.find(s => s.id === studentIdParam);
      if (found) {
        matchedSaved = found;
        localStorage.setItem('anjo_simulacao_idoso_id', found.id);
      }
    }
    
    const storedAppMode = (localStorage.getItem('anjo_app_mode') as 'idoso' | 'escolar_infantil' | 'escolar_fundamental') || 'escolar_infantil';

    if (loggedUser) {
      const autoTargetMode = determineAppModeForUser(loggedUser, storedAppMode);
      if (autoTargetMode !== appMode) {
        setAppMode(autoTargetMode);
        localStorage.setItem('anjo_app_mode', autoTargetMode);
      }

      const bestIdosoForUser = findBestMatchingIdoso(loggedUser, autoTargetMode);
      
      // Validate saved senior/student against target app mode (e.g., student vs elder)
      const isSavedValidForMode = matchedSaved && (
        autoTargetMode.startsWith('escolar') ? matchedSaved.id.startsWith('aluno_') : !matchedSaved.id.startsWith('aluno_')
      );
      
      const effectiveSaved = isSavedValidForMode ? matchedSaved : null;

      // If user is a teacher with classroom restrictions, enforce classroom matching
      if ((loggedUser.tipo === 'cuidador' || loggedUser.tipo === 'profissional' || loggedUser.tipo === 'professor' || loggedUser.tipo === 'professora' || loggedUser.tipo === 'educador' || loggedUser.tipo === 'educadora' || isStaffUser(loggedUser)) && loggedUser.salaAula && loggedUser.salaAula !== 'Todas') {
        const getStudentClassroomLocal = (name: string): string => {
          if (name.includes('Berçário I')) return 'Berçário I';
          if (name.includes('Berçário II')) return 'Berçário II';
          if (name.includes('Maternal II')) return 'Maternal II';
          if (name.includes('Maternal I')) return 'Maternal I';
          if (name.includes('Jardim II')) return 'Jardim II';
          if (name.includes('Jardim I')) return 'Jardim I';
          return 'Todas';
        };

        const isSavedValidForTeacher = effectiveSaved && (() => {
          const studentClassroom = getStudentClassroomLocal(effectiveSaved.nome);
          const userClassrooms = loggedUser.salaAula.split(',');
          return userClassrooms.some(userRoom => {
            const cleanUserRoom = userRoom.trim();
            if (cleanUserRoom === studentClassroom) return true;
            if (studentClassroom !== 'Todas' && (cleanUserRoom.startsWith(studentClassroom) || studentClassroom.startsWith(cleanUserRoom))) return true;
            if (effectiveSaved.nome.includes(cleanUserRoom)) return true;
            return false;
          });
        })();

        if (isSavedValidForTeacher && effectiveSaved) {
          setIdosoAtual(effectiveSaved);
        } else if (bestIdosoForUser) {
          setIdosoAtual(bestIdosoForUser);
          localStorage.setItem('anjo_simulacao_idoso_id', bestIdosoForUser.id);
        } else if (allSeniors.length > 0) {
          const modeFallback = allSeniors.find(s => autoTargetMode.startsWith('escolar') ? s.id.startsWith('aluno_') : !s.id.startsWith('aluno_')) || allSeniors[0];
          setIdosoAtual(modeFallback);
        }
      } else {
        const isParentUser = loggedUser.tipo === 'familiar' || loggedUser.tipo === 'familiar_admin' || loggedUser.tipo === 'familiar_convidado';
        const isChildOfParentLocal = (pUser: Usuario, child: Idoso): boolean => {
          if (!pUser || !child) return false;
          const isEscolarLocal = (localStorage.getItem('anjo_app_mode') || 'escolar_infantil').startsWith('escolar');
          const isTypeMatch = isEscolarLocal ? child.id.startsWith('aluno_') : !child.id.startsWith('aluno_');
          if (!isTypeMatch) return false;
          if (child.contatoEmergencia) {
            const cleanUserPhone = pUser.telefone ? pUser.telefone.replace(/\D/g, '') : '';
            const cleanContactPhone = child.contatoEmergencia.telefone ? child.contatoEmergencia.telefone.replace(/\D/g, '') : '';
            if (cleanUserPhone && cleanContactPhone && cleanUserPhone === cleanContactPhone) return true;
            const pName = pUser.nome ? pUser.nome.toLowerCase().trim() : '';
            const cName = child.contatoEmergencia.nome ? child.contatoEmergencia.nome.toLowerCase().trim() : '';
            if (pName && cName && (pName.includes(cName) || cName.includes(pName))) return true;
          }
          return false;
        };
        const isSavedValidForParent = effectiveSaved && isParentUser && isChildOfParentLocal(loggedUser, effectiveSaved);

        if (isSavedValidForParent && effectiveSaved) {
          setIdosoAtual(effectiveSaved);
        } else if (isParentUser && bestIdosoForUser) {
          setIdosoAtual(bestIdosoForUser);
          localStorage.setItem('anjo_simulacao_idoso_id', bestIdosoForUser.id);
        } else if (effectiveSaved) {
          setIdosoAtual(effectiveSaved);
        } else if (bestIdosoForUser) {
          setIdosoAtual(bestIdosoForUser);
          localStorage.setItem('anjo_simulacao_idoso_id', bestIdosoForUser.id);
        } else if (allSeniors.length > 0) {
          const modeFallback = allSeniors.find(s => autoTargetMode.startsWith('escolar') ? s.id.startsWith('aluno_') : !s.id.startsWith('aluno_')) || allSeniors[0];
          setIdosoAtual(modeFallback);
        }
      }
    } else if (matchedSaved) {
      setIdosoAtual(matchedSaved);
    } else if (allSeniors.length > 0) {
      const modeFallback = allSeniors.find(s => storedAppMode.startsWith('escolar') ? s.id.startsWith('aluno_') : !s.id.startsWith('aluno_')) || allSeniors[0];
      setIdosoAtual(modeFallback);
    }

    // Load saved accessibility
    const savedAccess = localStorage.getItem('anjo_acessibilidade');
    if (savedAccess) {
      setAccessibility(JSON.parse(savedAccess));
    }

    // Parse campaign tracking referrers for special welcoming animations
    const ref = params.get('ref');
    if (ref) {
      let canalAmigavel = 'Canal de Divulgação';
      if (ref === 'recepcao') canalAmigavel = 'Recepção Parceira / Clínica';
      if (ref === 'panfleto') canalAmigavel = 'Panfleto Comercial (Pix)';
      if (ref === 'parceiros') canalAmigavel = 'Grupo de Parceiros Clínicos';
      
      setTimeout(() => {
        setNotifPush({
          visible: true,
          title: "  Voucher de Parceria Ativado!",
          message: `Código de rastreamento: "${ref.toUpperCase()}". Carregamos o modo ideal para você com suporte de faturamento estendido!`
        });
      }, 2000);
    }

    return () => {
      window.removeEventListener('anjo_user_updated', handleUserUpdatedEvent);
      window.removeEventListener('anjo_idosos_updated', handleIdososUpdatedEvent);
    };
  }, []);

  // Sync active simulated user state when appMode changes or initial load
  useEffect(() => {
    const savedUserId = localStorage.getItem('anjo_simulacao_user_id');
    const allUsers = getFromDB<Usuario[]>('anjo_usuarios', []);
    let activeUser: Usuario | null = null;
    if (savedUserId) {
      const match = allUsers.find(u => u.id === savedUserId);
      if (match) {
        setUsuarioAtual(match);
        activeUser = match;
      }
    }

    const savedIdosoId = localStorage.getItem('anjo_simulacao_idoso_id');
    const allSeniors = getFromDB<Idoso[]>('anjo_idosos', []);
    const matchedSaved = savedIdosoId ? allSeniors.find(s => s.id === savedIdosoId) : null;
    
    const isParentUser = activeUser && (activeUser.tipo === 'familiar' || activeUser.tipo === 'familiar_admin' || activeUser.tipo === 'familiar_convidado');
    const bestIdosoForActiveUser = activeUser ? findBestMatchingIdoso(activeUser, appMode) : null;

    const isEscolarMode = appMode === 'escolar_infantil' || appMode === 'escolar_fundamental';
    if (idosoAtual && allSeniors.some(s => s.id === idosoAtual.id)) {
      const isStudent = idosoAtual.id.startsWith('aluno_');
      if (isEscolarMode && !isStudent) {
        // Elderly record in school mode, switch to student
        const bestStudent = bestIdosoForActiveUser || allSeniors.find(s => s.id.startsWith('aluno_')) || allSeniors[0];
        if (bestStudent) {
          setIdosoAtual(bestStudent);
          localStorage.setItem('anjo_simulacao_idoso_id', bestStudent.id);
        }
        return;
      }
      if (!isEscolarMode && isStudent) {
        // Student record in senior mode, switch to senior
        const bestSenior = bestIdosoForActiveUser || allSeniors.find(s => !s.id.startsWith('aluno_')) || allSeniors[0];
        if (bestSenior) {
          setIdosoAtual(bestSenior);
          localStorage.setItem('anjo_simulacao_idoso_id', bestSenior.id);
        }
        return;
      }
      return;
    }

    // Check if matchedSaved matches mode
    const isSavedValidForMode = matchedSaved && (
      isEscolarMode ? matchedSaved.id.startsWith('aluno_') : !matchedSaved.id.startsWith('aluno_')
    );

    if (isSavedValidForMode && matchedSaved) {
      setIdosoAtual(matchedSaved);
    } else if (isParentUser && bestIdosoForActiveUser) {
      setIdosoAtual(bestIdosoForActiveUser);
      localStorage.setItem('anjo_simulacao_idoso_id', bestIdosoForActiveUser.id);
    } else {
      const fallback = allSeniors.find(s => isEscolarMode ? s.id.startsWith('aluno_') : !s.id.startsWith('aluno_')) || allSeniors[0];
      if (fallback) {
        setIdosoAtual(fallback);
        localStorage.setItem('anjo_simulacao_idoso_id', fallback.id);
      }
    }
  }, [appMode]);

  // Auto-sync appMode based on logged user role on user change
  useEffect(() => {
    if (usuarioAtual) {
      const targetMode = determineAppModeForUser(usuarioAtual, appMode);
      if (appMode !== targetMode) {
        setAppMode(targetMode);
        localStorage.setItem('anjo_app_mode', targetMode);
        setKeyTrigger(prev => prev + 1);
      }
    }
  }, [usuarioAtual?.id]);

  // Update co-branding parameters whenever mode or keyTrigger increments
  useEffect(() => {
    setInstName(localStorage.getItem(`anjo_brand_name_${appMode}`) || '');
    setInstLogo(localStorage.getItem(`anjo_brand_logo_${appMode}`) || '');
    setInstSlogan(localStorage.getItem(`anjo_brand_slogan_${appMode}`) || '');
  }, [appMode, keyTrigger]);

  const handleUpdateAccessibility = (newSettings: { fontSize: 'normal' | 'grande' | 'gigante'; simplifiedMode: boolean; darkMode: boolean }) => {
    setAccessibility(newSettings);
    localStorage.setItem('anjo_acessibilidade', JSON.stringify(newSettings));
  };

  const findBestMatchingIdoso = (user: Usuario, mode: 'idoso' | 'escolar_infantil' | 'escolar_fundamental'): Idoso | null => {
    const allSeniors = getFromDB<Idoso[]>('anjo_idosos', []);
    if (allSeniors.length === 0) return null;

    const isEscolarMode = mode === 'escolar_infantil' || mode === 'escolar_fundamental';
    const isFundamentalMode = mode === 'escolar_fundamental';
    
    // Filter candidates by mode compatibility
    const candidates = allSeniors.filter(s => {
      const isStudent = s.id.startsWith('aluno_');
      if (isEscolarMode) {
        if (!isStudent) return false;
        const isStudentFun = s.id.startsWith('aluno_fun_');
        return isFundamentalMode ? isStudentFun : !isStudentFun;
      } else {
        return !isStudent;
      }
    });

    if (candidates.length === 0) {
      // Fallback
      const fallbackList = allSeniors.filter(s => {
        const isStudent = s.id.startsWith('aluno_');
        return isEscolarMode ? (isStudent && !s.id.startsWith('aluno_fun_')) : !isStudent;
      });
      return fallbackList.length > 0 ? fallbackList[0] : allSeniors[0];
    }

    // 0. Direct high-priority mapping for mock users to ensure 100% accurate profile sync
    // Berçário I - A (5 Alunos & Pais)
    if (user.id === 'user_mae_clarice') {
      const mariana = candidates.find(s => s.id === 'aluno_1' || s.nome.toLowerCase().includes('mariana'));
      if (mariana) return mariana;
    }
    if (user.id === 'user_pai_thiago') {
      const enzo = candidates.find(s => s.id === 'aluno_2' || s.nome.toLowerCase().includes('enzo'));
      if (enzo) return enzo;
    }
    if (user.id === 'user_mae_beatriz') {
      const beatriz = candidates.find(s => s.id === 'aluno_3' || s.nome.toLowerCase().includes('beatriz'));
      if (beatriz) return beatriz;
    }
    if (user.id === 'user_pai_felipe') {
      const bernardo = candidates.find(s => s.id === 'aluno_4' || s.nome.toLowerCase().includes('bernardo'));
      if (bernardo) return bernardo;
    }
    if (user.id === 'user_mae_camila') {
      const cecilia = candidates.find(s => s.id === 'aluno_5' || s.nome.toLowerCase().includes('cecília') || s.nome.toLowerCase().includes('cecilia'));
      if (cecilia) return cecilia;
    }
    // Maternal I - A (5 Alunos & Pais)
    if (user.id === 'user_mae_juliana') {
      const alice = candidates.find(s => s.id === 'aluno_6' || s.nome.toLowerCase().includes('alice'));
      if (alice) return alice;
    }
    if (user.id === 'user_pai_marcelo') {
      const lucas = candidates.find(s => s.id === 'aluno_7' || s.nome.toLowerCase().includes('lucas'));
      if (lucas) return lucas;
    }
    if (user.id === 'user_mae_patricia') {
      const helena = candidates.find(s => s.id === 'aluno_8' || s.nome.toLowerCase().includes('helena'));
      if (helena) return helena;
    }
    if (user.id === 'user_pai_rodrigo') {
      const gabriel = candidates.find(s => s.id === 'aluno_9' || s.nome.toLowerCase().includes('gabriel'));
      if (gabriel) return gabriel;
    }
    if (user.id === 'user_mae_larissa') {
      const laura = candidates.find(s => s.id === 'aluno_10' || s.nome.toLowerCase().includes('laura'));
      if (laura) return laura;
    }
    // Educadoras
    if (user.id === 'user_cuidador_1') {
      const ber1 = candidates.find(s => s.salaAula === 'Berçário I - A' || s.id === 'aluno_1');
      if (ber1) return ber1;
    }
    if (user.id === 'user_cuidador_2') {
      const mat1 = candidates.find(s => s.salaAula === 'Maternal I - A' || s.id === 'aluno_6');
      if (mat1) return mat1;
    }
    // Gestão e Direção
    if (user.id === 'user_admin' || user.id === 'user_coordenador' || user.id === 'user_desenvolvedor_djalma') {
      if (!isEscolarMode) {
        const maria = candidates.find(s => s.id === 'idoso_maria');
        if (maria) return maria;
      } else {
        const firstStudent = candidates.find(s => s.id.startsWith('aluno_'));
        if (firstStudent) return firstStudent;
      }
    }

    // Helper to normalize room strings (e.g., 'Maternal 1 B' <-> 'Maternal I - B')
    const normalizeRoomStr = (r: string) => {
      if (!r) return '';
      return r.toLowerCase()
        .replace(/maternal\s*1\b/g, 'maternal i')
        .replace(/maternal\s*2\b/g, 'maternal ii')
        .replace(/berçário\s*1\b/g, 'berçário i')
        .replace(/bercario\s*1\b/g, 'berçário i')
        .replace(/berçário\s*2\b/g, 'berçário ii')
        .replace(/bercario\s*2\b/g, 'berçário ii')
        .replace(/berçário\s*3\b/g, 'berçário iii')
        .replace(/bercario\s*3\b/g, 'berçário iii')
        .replace(/jardim\s*1\b/g, 'jardim i')
        .replace(/jardim\s*2\b/g, 'jardim ii')
        .replace(/[\s\-\._]+/g, '');
    };

    // 1. If user is a caregiver/teacher, prioritize matching a student in their assigned classroom first!
    if ((user.tipo === 'cuidador' || user.tipo === 'profissional' || user.tipo === 'professor' || user.tipo === 'professora' || user.tipo === 'educador' || user.tipo === 'educadora' || isStaffUser(user)) && isEscolarMode && user.salaAula && user.salaAula !== 'Todas') {
      const loggedRooms = user.salaAula.split(',').map(r => r.trim());

      // Phase A: Try exact classroom section match first (e.g., 'Maternal II - B' or 'Maternal 1 B')
      const exactRoomStudent = candidates.find(s => {
        const sRoom = s.salaAula || s.quarto || (s as any).sala || '';
        const normSRoom = normalizeRoomStr(sRoom);
        const normSName = normalizeRoomStr(s.nome);

        return loggedRooms.some(room => {
          const normRoom = normalizeRoomStr(room);
          if (!normRoom) return false;
          return normSRoom.includes(normRoom) || normSName.includes(normRoom);
        });
      });
      if (exactRoomStudent) return exactRoomStudent;

      // Phase B: Fall back to matching base group (e.g., 'Maternal II') only if no exact section match exists
      const baseGroupStudent = candidates.find(s => {
        const sRoom = s.salaAula || s.quarto || (s as any).sala || '';
        return loggedRooms.some(room => {
          const baseGroups = ['Berçário I', 'Berçário II', 'Maternal I', 'Maternal II', 'Jardim I', 'Jardim II', '1º Ano', '5º Ano'];
          for (const group of baseGroups) {
            if ((sRoom.includes(group) || s.nome.includes(group)) && room.includes(group)) {
              return true;
            }
          }
          return false;
        });
      });
      if (baseGroupStudent) return baseGroupStudent;
    }

    // 2. Try to match by emergency contact phone or name, or direct name mentions (mainly for parents/family)
    const userPhoneClean = user.telefone ? user.telefone.replace(/\D/g, '') : '';
    const userNameClean = user.nome ? user.nome.toLowerCase().trim() : '';

    const foundByContact = candidates.find(s => {
      if (!s.contatoEmergencia) return false;
      const contactPhoneClean = s.contatoEmergencia.telefone ? s.contatoEmergencia.telefone.replace(/\D/g, '') : '';
      const contactNameClean = s.contatoEmergencia.nome ? s.contatoEmergencia.nome.toLowerCase().trim() : '';

      const phoneMatches = userPhoneClean && contactPhoneClean && userPhoneClean === contactPhoneClean;
      const nameMatches = userNameClean && contactNameClean && (
        userNameClean.includes(contactNameClean) || contactNameClean.includes(userNameClean)
      );
      
      const studentFirstName = s.nome.toLowerCase().split(' ')[0];
      const directMention = studentFirstName.length > 2 && userNameClean.includes(studentFirstName);

      return phoneMatches || nameMatches || directMention;
    });

    if (foundByContact) return foundByContact;

    // 3. Fallback for non-school mode caregiver or generic fallback
    if (user.tipo === 'cuidador' || user.tipo === 'profissional' || user.tipo === 'professor' || user.tipo === 'professora' || isStaffUser(user)) {
      if (!isEscolarMode && user.id === 'user_cuidador_1') {
        const maria = candidates.find(s => s.id === 'idoso_maria');
        if (maria) return maria;
      }
    }

    // Default fallback: first candidate for active mode
    return candidates[0];
  };

  const determineAppModeForUser = (user: Usuario, currentMode: 'idoso' | 'escolar_infantil' | 'escolar_fundamental'): 'idoso' | 'escolar_infantil' | 'escolar_fundamental' => {
    if (!user) return currentMode;

    const nameLower = (user.nome || '').toLowerCase();
    const idLower = (user.id || '').toLowerCase();
    const uType = (user.tipo || '').toLowerCase();
    const uParentesco = (user.parentesco || '').toLowerCase();

    // 1. Explicit Elderly Profiles
    if (
      idLower === 'user_cuidador_2' || 
      idLower === 'user_neto_1' || 
      idLower === 'user_convidado_1' ||
      idLower.includes('idoso_') ||
      nameLower.includes('idoso') ||
      nameLower.includes('dona maria') ||
      nameLower.includes('seu joão') ||
      nameLower.includes('sr. joão') ||
      uParentesco.includes('neto') ||
      (uParentesco.includes('idoso') && !idLower.startsWith('aluno_'))
    ) {
      return 'idoso';
    }

    // 2. Flexible / Dual-Role Profiles
    if (idLower === 'user_cuidador_1') {
      return currentMode.startsWith('escolar') ? currentMode : 'escolar_infantil';
    }
    if (idLower === 'user_medico_1' || idLower === 'user_desenvolvedor_djalma' || uType === 'desenvolvedor' || uType === 'dev') {
      return currentMode;
    }

    // 3. School Profiles (Director, Coordinator, Teacher, Educator, School Caregiver, Parent of Student, Student)
    const isSchoolUser = 
      uType === 'diretor' || 
      uType === 'diretora' || 
      uType === 'admin' || 
      uType === 'coordenador' || 
      uType === 'coordenadora' || 
      uType === 'professor' || 
      uType === 'professora' || 
      uType === 'educador' || 
      uType === 'educadora' || 
      nameLower.includes('prof') || 
      nameLower.includes('educad') || 
      nameLower.includes('aluno') || 
      nameLower.includes('creche') || 
      nameLower.includes('nilva') || 
      nameLower.includes('diret') || 
      nameLower.includes('coord') || 
      idLower.includes('cuidador_m') || 
      idLower.includes('cuidador_j') || 
      idLower.includes('cuidador_b') || 
      idLower.includes('cuidador_fun') || 
      idLower.includes('cuidador_3') || 
      idLower.includes('cuidador_4') || 
      idLower.startsWith('user_pai_') || 
      idLower.startsWith('user_mae_') || 
      idLower.startsWith('aluno_') || 
      idLower === 'user_admin' ||
      (user.salaAula && user.salaAula !== 'Todas');

    if (isSchoolUser) {
      if (
        user.salaAula?.includes('1º') || 
        user.salaAula?.includes('2º') || 
        user.salaAula?.includes('3º') || 
        user.salaAula?.includes('4º') || 
        user.salaAula?.includes('5º') || 
        user.salaAula?.toLowerCase().includes('fundamental') || 
        idLower.includes('fun') ||
        idLower.includes('prof_fun')
      ) {
        return 'escolar_fundamental';
      }
      if (
        user.salaAula?.toLowerCase().includes('maternal') || 
        user.salaAula?.toLowerCase().includes('berçário') || 
        user.salaAula?.toLowerCase().includes('bercario') || 
        user.salaAula?.toLowerCase().includes('pré') || 
        user.salaAula?.toLowerCase().includes('pre') || 
        user.salaAula?.toLowerCase().includes('infantil') ||
        idLower.includes('maternal') ||
        idLower.startsWith('user_pai_') || 
        idLower.startsWith('user_mae_') ||
        idLower === 'user_cuidador_1'
      ) {
        return 'escolar_infantil';
      }
      return currentMode === 'escolar_fundamental' ? 'escolar_fundamental' : 'escolar_infantil';
    }

    // 4. Contact matching against DB
    const allSeniors = getFromDB<Idoso[]>('anjo_idosos', []);
    const userPhoneClean = user.telefone ? user.telefone.replace(/\D/g, '') : '';
    const userNameClean = user.nome ? user.nome.toLowerCase().trim() : '';

    const matchedByContact = allSeniors.find(s => {
      if (!s.contatoEmergencia) return false;
      const contactPhoneClean = s.contatoEmergencia.telefone ? s.contatoEmergencia.telefone.replace(/\D/g, '') : '';
      const contactNameClean = s.contatoEmergencia.nome ? s.contatoEmergencia.nome.toLowerCase().trim() : '';

      const phoneMatches = userPhoneClean && contactPhoneClean && userPhoneClean === contactPhoneClean;
      const nameMatches = userNameClean && contactNameClean && (
        userNameClean.includes(contactNameClean) || contactNameClean.includes(userNameClean)
      );
      return phoneMatches || nameMatches;
    });

    if (matchedByContact) {
      if (matchedByContact.id.startsWith('aluno_')) {
        return 'escolar_infantil';
      } else {
        return 'idoso';
      }
    }

    return currentMode;
  };

  const handleLogin = (user: Usuario) => {
    try {
      setUsuarioAtual(user);
      localStorage.setItem('anjo_simulacao_user_id', user.id);
      setActiveScreen('dashboard');
      
      // Explicitly start firebase sync after login, but wait for render first
      setTimeout(() => {
        try {
          import('./firebase').then(f => f.startFirebaseSync(true));
        } catch (e) {}
      }, 100);

      // Read the app mode selected on the login page and align it with the user role
      const savedMode = (localStorage.getItem('anjo_app_mode') as 'idoso' | 'escolar_infantil') || 'idoso';
      const targetMode = determineAppModeForUser(user, savedMode);
      setAppMode(targetMode);
      localStorage.setItem('anjo_app_mode', targetMode);

      let allSeniors = getFromDB<Idoso[]>('anjo_idosos', []);
      if (!allSeniors || allSeniors.length === 0) {
        allSeniors = IDOSOS_INICIAIS;
        saveToDB('anjo_idosos', allSeniors);
      }
      // Update active elderly/child to the one matching this specific user
      const bestIdoso = findBestMatchingIdoso(user, targetMode) || allSeniors[0] || IDOSOS_INICIAIS[0];
      if (bestIdoso) {
        setIdosoAtual(bestIdoso);
        localStorage.setItem('anjo_simulacao_idoso_id', bestIdoso.id);
      }

      setKeyTrigger(prev => prev + 1);
    } catch (err: any) {
      alert('Erro inesperado ao iniciar a sessão: ' + err.message);
    }
  };

  const handleLogout = () => {
    setUsuarioAtual(null);
    localStorage.removeItem('anjo_simulacao_user_id');
    setActiveScreen('dashboard');
  };

  const handleSwitchSenior = (idosoId: string, _forceAllow: boolean = false) => {
    const allSeniors = getFromDB<Idoso[]>('anjo_idosos', []);
    const match = allSeniors.find(s => s.id === idosoId);
    if (match) {
      setIdosoAtual(match);
      localStorage.setItem('anjo_simulacao_idoso_id', idosoId);
      setKeyTrigger(prev => prev + 1);
      setActiveScreen('dashboard');
    }
  };

  const handleSwitchUsuario = (userId: string, explicitStudentId?: string, keepCurrentScreen: boolean = false) => {
    const allUsers = getFromDB<Usuario[]>('anjo_usuarios', []);
    const match = allUsers.find(u => u.id === userId);
    if (match) {
      setUsuarioAtual(match);
      localStorage.setItem('anjo_simulacao_user_id', userId);
      
      // Automatically detect and update the app mode for the switched user!
      const targetMode = determineAppModeForUser(match, appMode);
      if (targetMode !== appMode) {
        setAppMode(targetMode);
        localStorage.setItem('anjo_app_mode', targetMode);
      }
      
      const allSeniors = getFromDB<Idoso[]>('anjo_idosos', []);
      let bestIdoso: Idoso | null = null;
      if (explicitStudentId) {
        bestIdoso = allSeniors.find(s => s.id === explicitStudentId) || null;
      }
      
      const isParentUser = match.tipo === 'familiar' || match.tipo === 'familiar_admin' || match.tipo === 'familiar_convidado';
      
      if (!bestIdoso && idosoAtual) {
        if (isParentUser) {
          // If the user is a parent, ONLY keep idosoAtual if it's genuinely their child AND matches the current app mode type!
          const isEscolarNow = targetMode.startsWith('escolar');
          const isTypeMatch = isEscolarNow ? idosoAtual.id.startsWith('aluno_') : !idosoAtual.id.startsWith('aluno_');
          if (isTypeMatch) {
            const isChild = (Boolean(match.telefone && idosoAtual.contatoEmergencia?.telefone && match.telefone.replace(/\D/g, '') === idosoAtual.contatoEmergencia.telefone.replace(/\D/g, ''))) ||
              (Boolean(match.nome && idosoAtual.contatoEmergencia?.nome && (match.nome.toLowerCase().includes(idosoAtual.contatoEmergencia.nome.toLowerCase()) || idosoAtual.contatoEmergencia.nome.toLowerCase().includes(match.nome.toLowerCase()))));
            if (isChild) {
              bestIdoso = idosoAtual;
            }
          }
        } else {
          const isCompatible = (targetMode === 'escolar_fundamental' && idosoAtual.id.startsWith('aluno_fun_')) ||
            (targetMode === 'escolar_infantil' && idosoAtual.id.startsWith('aluno_') && !idosoAtual.id.startsWith('aluno_fun_')) ||
            (targetMode === 'idoso' && !idosoAtual.id.startsWith('aluno_'));
          
          if (isCompatible) {
            const userRooms = (match.salaAula || '').split(',').map(r => r.trim().toLowerCase());
            const studentRoom = (idosoAtual.salaAula || idosoAtual.quarto || '').toLowerCase();
            if (match.tipo === 'diretor' || match.tipo === 'admin' || match.tipo === 'desenvolvedor' || !match.salaAula || match.salaAula === 'Todas' || userRooms.some(r => studentRoom.includes(r) || r.includes(studentRoom))) {
              bestIdoso = idosoAtual;
            }
          }
        }
      }
      if (!bestIdoso) {
        bestIdoso = findBestMatchingIdoso(match, targetMode) || (allSeniors.length > 0 ? allSeniors[0] : null);
      }
      if (bestIdoso) {
        setIdosoAtual(bestIdoso);
        localStorage.setItem('anjo_simulacao_idoso_id', bestIdoso.id);
      }
      
      setKeyTrigger(prev => prev + 1);
      if (!keepCurrentScreen) {
        setActiveScreen('dashboard');
      }
    }
  };

  // Adaptação dos dados de Idoso / Aluno com base no modo ativo
  const getActiveIdoso = (): Idoso | null => {
    if (!idosoAtual) return null;
    const isEscolar = appMode === 'escolar_infantil' || appMode === 'escolar_fundamental';

    if (!isEscolar) {
      if (idosoAtual.id.startsWith('aluno_')) {
        const allSeniors = getFromDB<Idoso[]>('anjo_idosos', []);
        const realSenior = allSeniors.find(s => s.id === 'idoso_maria') || allSeniors.find(s => !s.id.startsWith('aluno_'));
        if (realSenior) return realSenior;
      }
      return idosoAtual;
    }

    if (idosoAtual.id.startsWith('aluno_')) {
      return idosoAtual;
    }

    // Se for modo escolar, redireciona o idoso para o perfil de aluno real correspondente
    const allSeniors = getFromDB<Idoso[]>('anjo_idosos', []);
    if (idosoAtual.id === 'idoso_maria') {
      const mariana = allSeniors.find(s => s.id === 'aluno_1');
      if (mariana) return mariana;
    }
    if (idosoAtual.id === 'idoso_joao') {
      const enzo = allSeniors.find(s => s.id === 'aluno_2');
      if (enzo) return enzo;
    }

    const fallbackStudent = allSeniors.find(s => s.id.startsWith('aluno_'));
    return fallbackStudent || idosoAtual;
  };

  const getActiveUsuario = (): Usuario | null => {
    if (!usuarioAtual) return null;

    const uType = (usuarioAtual.tipo || '').toLowerCase();
    const uParentesco = (usuarioAtual.parentesco || '').toLowerCase();
    const uObs = (usuarioAtual.observacoes || '').toLowerCase();
    const nameLower = (usuarioAtual.nome || '').toLowerCase();
    const idLower = (usuarioAtual.id || '').toLowerCase();

    // 1. Explicit Family members (Mãe, Pai, Familiar, Convidado, Responsável)
    if (
      uType === 'familiar' || 
      uType === 'familiar_convidado' || 
      uType === 'familiar_admin' || 
      uType === 'responsavel' ||
      uParentesco.includes('mãe') || 
      uParentesco.includes('mae') || 
      uParentesco.includes('pai') || 
      uParentesco.includes('familiar') ||
      nameLower.includes('clarice') ||
      idLower.startsWith('user_mae_') || 
      idLower.startsWith('user_pai_')
    ) {
      if (uType === 'familiar_convidado' || uType === 'convidado' || uParentesco.includes('convidado') || uObs.includes('convidado')) {
        return {
          ...usuarioAtual,
          tipo: 'familiar_convidado',
          parentesco: usuarioAtual.parentesco || 'Convidado'
        };
      }
      if (uType === 'familiar_admin' || uParentesco.includes('admin')) {
        return {
          ...usuarioAtual,
          tipo: 'familiar_admin',
          parentesco: usuarioAtual.parentesco || 'Responsável (Admin)'
        };
      }
      return {
        ...usuarioAtual,
        tipo: 'familiar',
        parentesco: usuarioAtual.parentesco || (nameLower.includes('pai') ? 'Pai' : 'Mãe')
      };
    }

    // 2. Developers / Devs
    if (uType === 'desenvolvedor' || uType === 'dev' || uType === 'developer' || nameLower.includes('desenvolvedor') || nameLower.includes('dev') || idLower.includes('dev')) {
      return {
        ...usuarioAtual,
        tipo: 'desenvolvedor'
      };
    }

    // 3. Directors / Admin
    if (uType === 'diretor' || uType === 'diretora' || (uType === 'admin' && !uParentesco.includes('mãe')) || nameLower.includes('diretor') || nameLower.includes('diretora') || nameLower.includes('direção') || nameLower.includes('nilva')) {
      return {
        ...usuarioAtual,
        tipo: 'diretor',
        parentesco: 'Direção'
      };
    }

    // 4. Coordinators
    if (uType === 'coordenador' || uType === 'coordenadora' || nameLower.includes('coordenad') || idLower === 'user_medico_1') {
      return {
        ...usuarioAtual,
        tipo: 'coordenador'
      };
    }

    // 5. Teachers / Educators / Caregivers
    if (
      uType === 'professor' || uType === 'professora' || uType === 'educador' || uType === 'educadora' || uType === 'cuidador' ||
      nameLower.includes('profª') || nameLower.includes('prof.') || nameLower.includes('prof ') || nameLower.includes('professor') || nameLower.includes('educad') || nameLower.includes('cuidador') ||
      idLower === 'user_cuidador_1' || idLower.includes('cuidador_fun') || idLower.includes('cuidador_m') || idLower.includes('cuidador_j') || idLower.includes('cuidador_b')
    ) {
      const isCustomizedName = usuarioAtual.nome !== 'Ana Silva (Cuidadora)' && usuarioAtual.nome !== 'Profª Ana Silva (Educadora)';
      return {
        ...usuarioAtual,
        nome: idLower === 'user_cuidador_1' ? (isCustomizedName ? usuarioAtual.nome : (isEscolar ? 'Profª Ana Silva (Educadora)' : 'Ana Silva (Cuidadora)')) : usuarioAtual.nome,
        tipo: isEscolar ? 'professor' : 'cuidador',
        observacoes: usuarioAtual.observacoes || (isEscolar ? 'Professora licenciada em Pedagogia, responsável pela classe.' : 'Cuidadora técnica responsável.')
      };
    }

    if (!isEscolar) return usuarioAtual;

    if (usuarioAtual.id === 'user_cuidador_2') {
      const isCustomizedName = usuarioAtual.nome !== 'Carlos Souza (Familiar)' && usuarioAtual.nome !== 'Carlos Souza (Pai)';
      return {
        ...usuarioAtual,
        nome: isCustomizedName ? usuarioAtual.nome : 'Carlos Souza (Pai)',
        tipo: 'familiar',
        parentesco: 'Pai',
      };
    }

    return usuarioAtual;
  };

  const getNotificationRecipient = () => {
    if (isEscolar && idosoAtual?.contatoEmergencia) {
      return { 
        nome: idosoAtual.contatoEmergencia.nome, 
        telefone: idosoAtual.contatoEmergencia.telefone 
      };
    }
    const allUsers = getFromDB<Usuario[]>('anjo_usuarios', []);
    // Try to find the admin user first (usually the primary family member)
    const adminUser = allUsers.find(u => u.tipo === 'admin');
    if (adminUser) {
      return { nome: adminUser.nome, telefone: adminUser.telefone };
    }
    // Try to find a familiar next
    const familiarUser = allUsers.find(u => u.tipo === 'familiar');
    if (familiarUser) {
      return { nome: familiarUser.nome, telefone: familiarUser.telefone };
    }
    // Fallback to elder's own emergency contact
    if (idosoAtual?.contatoEmergencia) {
      return { 
        nome: idosoAtual.contatoEmergencia.nome, 
        telefone: idosoAtual.contatoEmergencia.telefone 
      };
    }
    return { nome: 'Clarice Souza (Filha)', telefone: '(11) 98765-4321' };
  };

  // Central trigger to show high-fidelity simulated mobile notification
  const triggerWhatsAppSim = (titulo: string, mensagem: string, targetStudents?: Idoso[]) => {
    // 1. Play high-pitch simulation sound (using Web Audio API so it's guaranteed to work offline without external MP3s!)
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // high chime sound
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      // Audio context may require click interaction to boot, bypass quietly
    }

    // 2. Append to simulated Database log of WhatsApp dispatches
    if (idosoAtual) {
      const allLogs = getFromDB<NotificacaoSimulada[]>('anjo_notificacoes', []);

      if (targetStudents && targetStudents.length > 0) {
        const destList = targetStudents.map(student => {
          const rawName = student.nome.includes(' (') ? student.nome.split(' (')[0] : student.nome;
          const contactName = student.contatoEmergencia?.nome || `Pais de ${rawName}`;
          const contactPhone = student.contatoEmergencia?.telefone || '(11) 98765-4321';
          return {
            idosoNome: rawName,
            familiarNome: contactName,
            telefone: contactPhone
          };
        });

        targetStudents.forEach((student, idx) => {
          const rawName = student.nome.includes(' (') ? student.nome.split(' (')[0] : student.nome;
          const contactName = student.contatoEmergencia?.nome || `Pais de ${rawName}`;
          const contactPhone = student.contatoEmergencia?.telefone || '(11) 98765-4321';

          const studentLog: NotificacaoSimulada = {
            id: 'log_' + Date.now() + '_std_' + idx + '_' + Math.random().toString(36).substring(2, 5),
            idosoId: student.id,
            familiarNome: contactName,
            telefoneDestino: contactPhone,
            tipoCompromisso: titulo,
            mensagem: mensagem,
            status: 'enviada_whatsapp',
            dataEnvio: new Date().toISOString(),
            canal: 'WhatsApp',
            isBroadcast: targetStudents.length > 1,
            destinatariosContagem: targetStudents.length,
            destinatariosLista: destList
          };
          allLogs.push(studentLog);
        });

        const isActiveInTargets = targetStudents.some(s => s.id === idosoAtual.id);
        if (!isActiveInTargets) {
          const bcastLog: NotificacaoSimulada = {
            id: 'log_' + Date.now() + '_bcast_active',
            idosoId: idosoAtual.id,
            familiarNome: `Pais de Todos os ${targetStudents.length} Alunos`,
            telefoneDestino: '(Transmissão em Massa)',
            tipoCompromisso: titulo,
            mensagem: mensagem,
            status: 'enviada_whatsapp',
            dataEnvio: new Date().toISOString(),
            canal: 'WhatsApp',
            isBroadcast: true,
            destinatariosContagem: targetStudents.length,
            destinatariosLista: destList
          };
          allLogs.push(bcastLog);
        }
      } else {
        // Categorize the alert to match registered preferences:
        let alertProperty: 'atrasos' | 'medicamentos' | 'vitais' | 'resumo' = 'resumo';
        const lowerTitle = titulo.toLowerCase();
        if (lowerTitle.includes('atras') || lowerTitle.includes('alerta importante') || lowerTitle.includes('crític')) {
          alertProperty = 'atrasos';
        } else if (lowerTitle.includes('medic') || lowerTitle.includes('reméd') || lowerTitle.includes('confirmada')) {
          alertProperty = 'medicamentos';
        } else if (lowerTitle.includes('vital') || lowerTitle.includes('aferição') || lowerTitle.includes('pressão') || lowerTitle.includes('glic')) {
          alertProperty = 'vitais';
        } else {
          alertProperty = 'resumo';
        }

        const allUsers = getFromDB<Usuario[]>('anjo_usuarios', []);
        let savedConfigs: Record<string, { atrasos?: boolean; medicamentos?: boolean; vitais?: boolean; resumo?: boolean }> = {};
        try {
          const raw = localStorage.getItem('anjo_alerta_configs');
          if (raw) savedConfigs = JSON.parse(raw);
        } catch (e) {
          // ignore
        }

        let recipients: any[] = [];
        if (appMode.startsWith('escolar')) {
          const primary = getNotificationRecipient();
          recipients.push({
            id: 'school_parent_rcp',
            nome: primary.nome,
            telefone: primary.telefone,
            tipo: 'familiar',
            email: ''
          });
        } else {
          recipients = allUsers.filter(u => {
            const userConfig = savedConfigs[u.id];
            if (userConfig) {
              return userConfig[alertProperty] === true;
            }
            if (u.tipo === 'admin') return true;
            if (u.tipo === 'familiar' && alertProperty !== 'vitais') return true;
            return false;
          });

          if (recipients.length === 0) {
            const primary = getNotificationRecipient();
            recipients.push({
              id: 'fallback_rcp',
              nome: primary.nome,
              telefone: primary.telefone,
              tipo: 'admin',
              email: ''
            });
          }
        }

        recipients.forEach(async (rcp, idx) => {
          const newLog: NotificacaoSimulada = {
            id: 'log_' + Date.now() + '_' + idx,
            idosoId: idosoAtual.id,
            familiarNome: rcp.nome,
            telefoneDestino: rcp.telefone,
            tipoCompromisso: titulo,
            mensagem: mensagem,
            status: 'enviada_whatsapp',
            dataEnvio: new Date().toISOString(),
            canal: 'WhatsApp'
          };
          allLogs.push(newLog);

          try {
            const response = await fetch('/.netlify/functions/whatsapp-sender', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                to: rcp.telefone,
                message: mensagem
              })
            });

            if (!response.ok) {
              throw new Error(`Erro no servidor: ${response.statusText}`);
            }

            const responseData = await response.json();
            console.log('✅ Mensagem real de WhatsApp enviada com sucesso via Netlify:', responseData);
          } catch (err: any) {
            console.warn('ℹ Função serverless local não encontrada ou offline. Erro:', err.message);
          }
        });
      }

      saveToDB('anjo_notificacoes', allLogs);
    }

    // 3. Make the fancy mobile push fly down from top of page
    setNotifPush({
      visible: true,
      title: titulo,
      message: mensagem
    });

    setKeyTrigger(prev => prev + 1);
  };

  // Handle dismiss click
  useEffect(() => {
    if (notifPush?.visible) {
      const timer = setTimeout(() => {
        setNotifPush(null);
      }, 7000); // clear push banner automatically
      return () => clearTimeout(timer);
    }
  }, [notifPush]);

  // Adjust font root sizing class
  const getFontSizeClass = () => {
    if (accessibility.fontSize === 'grande') return 'text-lg md:text-xl font-medium';
    if (accessibility.fontSize === 'gigante') return 'text-xl md:text-2xl font-semibold leading-relaxed';
    return 'text-sm md:text-base';
  };

  // If no user is logged in, show introductory landing selector screen
  if (!usuarioAtual || !idosoAtual) {
    return (
      <Login 
        onLoginSuccess={handleLogin} 
        accessibility={accessibility} 
        onUpdateAccessibility={handleUpdateAccessibility} 
      />
    );
  }

  const idosoAdaptado = getActiveIdoso() || idosoAtual;
  const usuarioAdaptado = getActiveUsuario() || usuarioAtual;

  const uRoleLower = (usuarioAdaptado?.tipo || '').toLowerCase();
  const uIdLower = (usuarioAdaptado?.id || '').toLowerCase();
  const isMasterActive = localStorage.getItem('anjo_master_demonstracao_ativo') === 'true';

  const temAcessoAura = isMasterActive || 
    uRoleLower === 'desenvolvedor' || uRoleLower === 'dev' || uRoleLower === 'developer' || uIdLower.includes('dev') ||
    uRoleLower === 'diretor' || uRoleLower === 'diretora' || uRoleLower === 'admin' || uIdLower === 'user_admin' ||
    uRoleLower === 'coordenador' || uRoleLower === 'coordenadora' ||
    uRoleLower === 'professor' || uRoleLower === 'professora' || uRoleLower === 'cuidador' || uRoleLower === 'educador' || uRoleLower === 'educadora' ||
    uRoleLower === 'profissional';

// Gerador assíncrono de JWT HMAC-SHA256 com Web Crypto API para autenticação no SSO da Aura
const generateAuraJwtAsync = async (payload: any, secret: string): Promise<string> => {
  const header = { alg: "HS256", typ: "JWT" };
  const b64Url = (str: string) =>
    btoa(unescape(encodeURIComponent(str)))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

  const headerB64 = b64Url(JSON.stringify(header));
  const payloadB64 = b64Url(JSON.stringify(payload));
  const dataToSign = `${headerB64}.${payloadB64}`;

  const encoder = new TextEncoder();
  const key = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await window.crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(dataToSign)
  );

  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${dataToSign}.${sigB64}`;
};

  const getAuraTokenAsync = async (): Promise<string> => {
    const secret = localStorage.getItem('anjinho_sso_secret') || "anjinho-aura-secret-key-2026";
    const now = Math.floor(Date.now() / 1000);

    const cleanName = usuarioAdaptado?.nome
      .replace(/ \((Educadora|Cuidadora|Mãe|Pai|Familiar|Médico|Pediatra|Profissional|Responsável|Diretor|Diretora|Direção|Administrador|Coordenador|Coordenadora|Desenvolvedor|Dev)\)/gi, '')
      .replace(/Profª /g, '')
      .replace(/Prof\. /g, '')
      .replace(/Drª\.? /g, '')
      .replace(/Dr\.? /g, '')
      .trim() || 'Usuário';

    // Determinar o cargo do usuário dentre os cargos oficiais da Aura: professor, coordenador, diretor, desenvolvedor, profissional
    let mappedType = 'professor';
    let userCargo = 'Professor Titular';
    let userPersona = 'professor';
    let userRole = 'professor';

    const userTypeLower = (usuarioAdaptado?.tipo || '').toLowerCase();
    const userNameLower = (usuarioAdaptado?.nome || '').toLowerCase();
    const userIdLower = (usuarioAdaptado?.id || '').toLowerCase();

    if (
      isMasterActive ||
      userTypeLower === 'desenvolvedor' ||
      userTypeLower === 'developer' ||
      userTypeLower === 'dev' ||
      userNameLower.includes('desenvolvedor') ||
      userNameLower.includes('developer') ||
      userNameLower.includes('dev') ||
      userIdLower.includes('dev')
    ) {
      mappedType = 'desenvolvedor';
      userCargo = 'Desenvolvedor do Sistema';
      userPersona = 'desenvolvedor';
      userRole = 'desenvolvedor';
    } else if (
      userTypeLower === 'diretor' ||
      userTypeLower === 'diretora' ||
      userTypeLower === 'director' ||
      userTypeLower === 'admin' ||
      userIdLower === 'user_admin' ||
      userNameLower.includes('diretor') ||
      userNameLower.includes('diretora')
    ) {
      mappedType = 'diretor';
      userCargo = isEscolar ? 'Diretor(a) Geral' : 'Diretor(a) / Administrador Geral';
      userPersona = 'diretor';
      userRole = 'diretor';
    } else if (
      userTypeLower === 'coordenador' ||
      userTypeLower === 'coordenadora' ||
      userNameLower.includes('coordenad')
    ) {
      mappedType = 'coordenador';
      userCargo = isEscolar ? 'Coordenador(a) Pedagógico(a)' : 'Coordenador(a) de Equipe';
      userPersona = 'coordenador';
      userRole = 'coordenador';
    } else if (
      userTypeLower === 'profissional' ||
      userNameLower.includes('médic') ||
      userNameLower.includes('medico') ||
      userNameLower.includes('fono') ||
      userNameLower.includes('psico') ||
      userNameLower.includes('terapeuta') ||
      userNameLower.includes('pediatra')
    ) {
      mappedType = 'profissional';
      userCargo = usuarioAdaptado?.parentesco || 'Profissional de Saúde / Especialista';
      userPersona = 'profissional';
      userRole = 'profissional';
    } else if (
      userTypeLower === 'cuidador' ||
      userTypeLower === 'professor' ||
      userTypeLower === 'professora' ||
      userTypeLower === 'educador' ||
      userTypeLower === 'educadora' ||
      userNameLower.includes('prof') ||
      userNameLower.includes('educad') ||
      userNameLower.includes('cuidador')
    ) {
      mappedType = 'professor';
      userCargo = isEscolar ? 'Professor(a) Titular' : 'Cuidador(a) Profissional';
      userPersona = 'professor';
      userRole = 'professor';
    } else if (usuarioAdaptado?.tipo === 'familiar' || userTypeLower === 'mae' || userTypeLower === 'pai') {
      const isPai = usuarioAdaptado?.parentesco?.toLowerCase().includes('pai') || userNameLower.includes('pai');
      mappedType = isPai ? 'pai' : 'mae';
      userCargo = usuarioAdaptado?.parentesco || (isPai ? 'Pai' : 'Mãe / Responsável');
      userPersona = mappedType;
      userRole = 'familiar';
    } else {
      mappedType = 'professor';
      userCargo = isEscolar ? 'Professor(a) Titular' : 'Cuidador(a) Profissional';
      userPersona = 'professor';
      userRole = 'professor';
    }

    const schoolContext = instName || (isEscolar ? 'Escola Pequeno Anjo' : 'Anjo Cuidador Residence');
    const escolaId = (usuarioAdaptado as any)?.escolaId || 
      localStorage.getItem('anjo_escola_id') || 
      (isEscolar ? 'escola_pequeno_anjo' : 'anjo_cuidador_residence');

    // Dados do Aluno em foco
    const hasStudentAccess = !!idosoAdaptado;

    let studentNome = '';
    let studentAge = '';
    let studentRoom = '';

    if (hasStudentAccess && idosoAdaptado) {
      const match = idosoAdaptado.nome.match(/^(.*?)\s*\((.*?)\)$/);
      if (match) {
        studentNome = match[1].trim();
        const details = match[2].split(' - ').map(s => s.trim());
        const lastPart = details[details.length - 1];
        if (/(\d+\s*(Meses|Mês|Anos|Ano))/i.test(lastPart)) {
          studentAge = lastPart;
          studentRoom = details.slice(0, details.length - 1).join(' - ');
        } else {
          studentRoom = details.join(' - ');
        }
      } else {
        studentNome = idosoAdaptado.nome;
      }
    }

    let historyText = '';
    if (hasStudentAccess && idosoAdaptado) {
      try {
        const notificacoes = getFromDB<any[]>('anjo_notificacoes', []);
        const hoje = new Date();
        const hD = hoje.getDate(), hM = hoje.getMonth(), hA = hoje.getFullYear();
        const recentLogs = notificacoes
          .filter(n => {
            if (n.idosoId !== idosoAdaptado.id) return false;
            if (!n.dataEnvio) return false;
            try {
              const d = new Date(n.dataEnvio);
              return d.getDate() === hD && d.getMonth() === hM && d.getFullYear() === hA;
            } catch (e) {
              return false;
            }
          })
          .slice(-5)
          .map(n => {
            let msg = n.mensagem || '';
            msg = msg.replace(/^(Anjo Cuidador:|Anjo Escolar:)\s*/i, '');
            if (n.dataEnvio) {
              try {
                const d = new Date(n.dataEnvio);
                const hrs = String(d.getHours()).padStart(2, '0');
                const mins = String(d.getMinutes()).padStart(2, '0');
                return `[${hrs}:${mins}] ${msg}`;
              } catch (e) {
                return msg;
              }
            }
            return msg;
          });

        if (recentLogs.length > 0) {
          historyText = recentLogs.join(' | ');
        }
      } catch (err) {
        console.warn('Erro ao carregar histórico para Aura AI:', err);
      }
    }

    // Return URL de navegação de volta para o Anjinho
    const currentUrl = (() => {
      try {
        if (typeof window !== 'undefined' && window.location) {
          const href = window.location.href;
          if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
            return href;
          }
          const origin = window.location.origin;
          if (origin && (origin.startsWith('http://') || origin.startsWith('https://'))) {
            return origin;
          }
        }
      } catch (e) {
        // fallback
      }
      return 'https://anjinha.app/dashboard';
    })();

    const activeTurma = studentRoom || usuarioAdaptado?.salaAula || '';
    const activeStudentId = idosoAdaptado?.id || '';

    // Construir Payload JWT assinado
    const userMetadata = {
      userId: usuarioAdaptado?.id || 'user_01',
      sub: usuarioAdaptado?.id || 'user_01',
      name: cleanName,
      userName: cleanName,
      user_name: cleanName,
      nome: cleanName,
      tipo: mappedType,
      type: mappedType,
      papel: mappedType,
      funcao: userCargo,
      cargo: userCargo,
      userCargo: userCargo,
      user_cargo: userCargo,
      persona: userPersona,
      role: userRole,
      userRole: userRole,
      user_role: userRole,
      escola: schoolContext,
      escola_id: escolaId,
      escolaId: escolaId,
      school_id: escolaId,
      schoolId: escolaId,
      greeting_hint: `Olá, ${cleanName}! Como ${userCargo}, estou à sua disposição.`,
      turma: activeTurma,
      turma_id: activeTurma,
      turmaId: activeTurma,
      sala: activeTurma,
      sala_aula: usuarioAdaptado?.salaAula || activeTurma,
      saladoaluno: activeTurma,
      student_id: activeStudentId,
      studentId: activeStudentId,
      iddoaluno: activeStudentId,
      aluno_id: activeStudentId,
      idoso_id: activeStudentId,
      idosoId: activeStudentId,
      studentNome: studentNome,
      nomedoaluno: studentNome,
      studentName: studentNome,
      student_name: studentNome,
      studentAge: studentAge,
      idadedoaluno: studentAge,
      studentRoom: studentRoom,
      aluno: studentNome,
      alunoNome: studentNome,
      crianca: studentNome,
      anjinho: studentNome,
      alergias: idosoAdaptado?.alergias?.join(', ') || '',
      condicoes: idosoAdaptado?.condicoesMedicas?.join(', ') || '',
      historico: historyText,
      returnUrl: currentUrl
    };

    // Incluir par no nível raiz para que a API da Aura monte o redirect "next" com query params,
    // garantindo que a validação x() do contexto da Aura seja satisfeita ao abrir a tela do chat /app
    const payload = {
      userId: usuarioAdaptado?.id || 'user_01',
      sub: usuarioAdaptado?.id || 'user_01',
      email: usuarioAdaptado?.email || `${usuarioAdaptado?.id || 'usuario'}@escolapequenoanjo.com.br`,
      name: cleanName,
      userName: cleanName,
      user_name: cleanName,
      nome: cleanName,
      tipo: mappedType,
      type: mappedType,
      papel: mappedType,
      funcao: userCargo,
      cargo: userCargo,
      userCargo: userCargo,
      user_cargo: userCargo,
      persona: userPersona,
      role: userRole,
      userRole: userRole,
      user_role: userRole,
      escola: schoolContext,
      escola_id: escolaId,
      escolaId: escolaId,
      school_id: escolaId,
      schoolId: escolaId,
      greeting_hint: `Olá, ${cleanName}! Como ${userCargo}, estou à sua disposição.`,
      turma: activeTurma,
      turma_id: activeTurma,
      turmaId: activeTurma,
      sala: activeTurma,
      sala_aula: usuarioAdaptado?.salaAula || activeTurma,
      student_id: activeStudentId,
      studentId: activeStudentId,
      iddoaluno: activeStudentId,
      aluno_id: activeStudentId,
      idoso_id: activeStudentId,
      idosoId: activeStudentId,
      studentNome: studentNome,
      nomedoaluno: studentNome,
      studentAge: studentAge,
      idadedoaluno: studentAge,
      studentRoom: studentRoom,
      saladoaluno: activeTurma,
      alergias: idosoAdaptado?.alergias?.join(', ') || '',
      condicoes: idosoAdaptado?.condicoesMedicas?.join(', ') || '',
      historico: historyText,
      returnUrl: currentUrl,
      user_metadata: userMetadata,
      jti: `token_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sessionId: `sess_${usuarioAdaptado?.id || 'user'}_${idosoAdaptado?.id || 'student'}_${Date.now()}`,
      newChat: true,
      forceReset: true,
      iat: now,
      exp: now + 300
    };

    return await generateAuraJwtAsync(payload, secret);
  };

  const handleOpenAura = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    try {
      const jwtToken = await getAuraTokenAsync();

      // Formulário POST din enviado para https://anjinha-aura.lovable.app/api/sso
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = 'https://anjinha-aura.lovable.app/api/sso';
      form.target = '_blank';

      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'token';
      input.value = jwtToken;
      form.appendChild(input);

      document.body.appendChild(form);
      form.submit();
      setTimeout(() => {
        try {
          if (document.body.contains(form)) {
            document.body.removeChild(form);
          }
        } catch (err) {
          // ignora
        }
      }, 500);
    } catch (err) {
      console.error('Erro ao abrir Anjinha Aura via POST:', err);
    }
  };

  const isFamiliarConvidado = usuarioAdaptado?.tipo === 'familiar_convidado' || 
    usuarioAdaptado?.tipo === 'convidado' || 
    (usuarioAdaptado?.tipo === 'familiar' && (usuarioAdaptado?.parentesco?.toLowerCase().includes('convidado') || usuarioAdaptado?.observacoes?.toLowerCase().includes('convidado')));

  const isFamiliarUser = !isStaffUser(usuarioAdaptado);

  // Header Nav Bar links render
  const primaryKeys = isEscolar 
    ? ['dashboard', 'classroom', 'routine', 'agenda', 'family']
    : ['dashboard', 'medicacoes', 'agenda', 'routine', 'family'];

  const allNavLinks = [
    { 
      id: 'dashboard', 
      label: isEscolar ? 'Diário Escolar  ' : 'Início  ', 
      icon: isEscolar ? <BookOpen className="w-4 h-4 text-indigo-400 font-bold" /> : <Activity className="w-4 h-4" /> 
    },
    ...(isEscolar && !isFamiliarUser ? [{
      id: 'classroom',
      label: `Turma & Alunos  `,
      icon: <Users className="w-4 h-4 text-indigo-400 font-bold" />
    }] : []),
    { 
      id: 'routine', 
      label: isEscolar ? 'Diário de Rotina ⏱' : 'Rotina Diária', 
      icon: <Clock className="w-4 h-4 text-amber-500 font-bold" /> 
    },
    ...(!isFamiliarConvidado ? [{ 
      id: 'medicacoes', 
      label: isEscolar ? 'Autorizações ✍' : 'Remédios', 
      icon: <Heart className="w-4 h-4 text-rose-500 fill-rose-500/10" /> 
    }] : []),
    { 
      id: 'agenda', 
      label: isEscolar ? 'Agenda  ' : 'Agenda Médica', 
      icon: <Calendar className="w-4 h-4 text-blue-500 font-bold" /> 
    },
    ...(isEscolar && !isFamiliarUser ? [{
      id: 'coordenacao',
      label: 'Coordenação  🏫',
      icon: <GraduationCap className="w-4 h-4 text-indigo-400 font-bold" />
    }] : []),
    { 
      id: 'jornada',
      label: 'Jornada do Anjinho  ',
      icon: <Sparkles className="w-4 h-4 text-amber-400 font-bold" />
    },
    ...(isEscolar && !isFamiliarUser ? [{
      id: 'brandbook',
      label: 'Brand Book  ',
      icon: <BookOpen className="w-4 h-4 text-indigo-400 font-bold" />
    }] : []),
    { 
      id: 'reports', 
      label: isFundamental ? 'Boletins & Foco' : (isEscolar ? 'Boletins & Relatórios  ' : 'Relatórios'), 
      icon: <Sliders className="w-4 h-4 text-purple-400 font-bold" /> 
    },
    { 
      id: 'family', 
      label: isEscolar ? 'Famílias    ' : 'Família', 
      icon: <Users className="w-4 h-4 text-indigo-400 font-bold" /> 
    },
    { 
      id: 'alerts', 
      label: isEscolar ? 'Mural de Avisos  ' : 'WhatsApp Log', 
      icon: <MessageSquare className="w-4 h-4 text-emerald-500 font-bold" /> 
    },
    ...(isEscolar && !isFamiliarUser ? [{ 
      id: 'director', 
      label: 'Direção Escolar  ', 
      icon: <ShieldCheck className="w-4 h-4 text-amber-500 font-bold" /> 
    }] : []),
    { 
      id: 'admin', 
      label: 'Painel Dev (Privado)  ', 
      icon: <ShieldCheck className="w-4 h-4 text-indigo-500 font-bold" /> 
    },
    { 
      id: 'settings', 
      label: 'Configurar ⚙', 
      icon: <Sliders className="w-4 h-4 text-slate-500 font-bold" /> 
    },
    { 
      id: 'toggle_mode_tab', 
      label: isEscolar ? 'Modo Sênior  ' : 'Modo Escola  ', 
      icon: isEscolar ? <Baby className="w-4 h-4 text-amber-400 font-bold" /> : <GraduationCap className="w-4 h-4 text-amber-300 font-bold" /> 
    },
  ];

  const primaryNavLinks = allNavLinks.filter(nm => primaryKeys.includes(nm.id));
  const moreNavLinks = allNavLinks.filter(nm => !primaryKeys.includes(nm.id));
  const navLinks = allNavLinks;

  return (
    <div className={`min-h-screen max-w-full ${accessibility.darkMode ? 'bg-[#0f172a] text-slate-100 dark-mode' : 'bg-cozy-cream text-slate-800'} flex flex-col font-sans transition-all selection:bg-serene-blue selection:text-white ${getFontSizeClass()}`}>
      
      {/*   SIMULATED HIGH-FIDELITY SMARTPHONE PUSH BANNER OVERLAY */}
      {notifPush?.visible && (
        <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md bg-zinc-900 text-white p-4 rounded-2xl shadow-2xl z-50 border border-zinc-800 flex items-start gap-3 animate-bounce cursor-pointer hover:bg-zinc-850 transition-all transform hover:scale-101"
             onClick={() => { setActiveScreen('alerts'); setNotifPush(null); }}
             title="Clique para ir à Central de WhatsApp"
        >
          <div className="p-2.5 bg-emerald-600 text-white rounded-xl shrink-0">
            <MessageSquare className="w-5 h-5 fill-current text-white" />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Notificação de Envio</span>
              <span className="text-[9px] text-[#A1A1AA] font-semibold">agora mesmo</span>
            </div>
            <strong className="text-xs font-bold text-white block">{notifPush.title}</strong>
            <p className="text-[11px] leading-relaxed text-[#D4D4D8]">
              {notifPush.message}
            </p>
            <div className="pt-1 flex">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const recipient = getNotificationRecipient();
                  const phone = recipient.telefone || '';
                  const number = formatWhatsAppNumber(phone);
                  const text = encodeURIComponent(notifPush.message);
                  window.open(`https://wa.me/${number}?text=${text}`, '_blank');
                }}
                className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-[10px] px-2.5 py-1 text-white font-black rounded-lg transition-colors flex items-center gap-1 cursor-pointer border border-emerald-500/20"
                title="Clique para abrir a conversa real no WhatsApp e enviar o texto"
              >
                  Enviar WhatsApp p/ {getNotificationRecipient().nome ? getNotificationRecipient().nome.split(' ')[0] : 'Família'} de verdade
              </button>
            </div>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); setNotifPush(null); }}
            className="text-white bg-white/10 hover:bg-white/20 p-1 rounded-md cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Sticky Header Container (Primary Header + Sub-header bar) */}
      <div className="sticky top-0 left-0 right-0 z-40 shadow-md">
        {/* Primary top Header Bar in Serene Blue */}
        <header className={`${
          appMode === 'escolar_fundamental'
            ? 'bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-700'
            : isEscolar
              ? 'bg-gradient-to-r from-teal-600 via-indigo-600 to-indigo-700'
              : 'bg-serene-blue'
        } text-white transition-colors duration-500 shrink-0`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 lg:py-2 flex items-center justify-between gap-2 sm:gap-4">
          
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className={`w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-xl sm:rounded-2xl overflow-hidden flex items-center justify-center shadow-md border shrink-0 bg-white border-white/30 p-1`}>
              {instLogo ? (
                <img src={instLogo} alt={instName || "Logo"} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              ) : (
                <img src="/logo.png?v=15" alt={isEscolar ? "Anjinho Escolar" : "Anjo Cuidador"} className="w-full h-full object-contain transform scale-[1.35]" referrerPolicy="no-referrer" />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base md:text-lg font-bold font-display tracking-tight leading-none flex items-center flex-wrap gap-x-1 sm:gap-x-1.5">
                <span className="truncate">{appMode === 'idoso' ? 'Anjo Cuidador' : (isFundamental ? 'Anjinho Fundamental' : 'Anjinho Escolar')}</span>
                {instName && (
                  <>
                    <span className="text-xs opacity-50 font-normal">|</span>
                    <span className="text-[9px] sm:text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded-md font-semibold tracking-wide uppercase truncate max-w-[80px] sm:max-w-[150px]" title={instName}>
                      {instName}
                    </span>
                  </>
                )}
              </h1>
              <p className="text-[10px] sm:text-[11px] text-white/95 font-medium leading-tight tracking-normal mt-0.5 block">
                {instSlogan || (isFundamental
                  ? 'Onde a educação e o foco se encontram'
                  : isEscolar
                    ? 'Onde a inf é registrada para sempre'
                    : 'Acompanhamento Sênior Inteligente')}
              </p>
            </div>
          </div>

          {/* Desktop Nav Links - Streamlined 5 Primary Items + Dropdown "Mais" */}
          <nav className="hidden lg:flex items-center gap-1 font-bold text-xs relative">
            {primaryNavLinks.map(nm => {
              const active = activeScreen === nm.id;
              
              if (accessibility.simplifiedMode && (nm.id === 'reports' || nm.id === 'family')) return null;

              return (
                <button
                  key={nm.id}
                  onClick={() => { 
                    handleSelectNavScreen(nm.id); 
                    setMobileMenuOpen(false); 
                    setMoreMenuOpen(false);
                  }}
                  className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all text-xs font-bold cursor-pointer ${
                    active 
                      ? (isEscolar ? 'bg-white text-indigo-700 shadow-sm font-black' : 'bg-white text-serene-blue shadow-sm font-black') 
                      : 'hover:bg-white/15 text-white/90 hover:text-white'
                  }`}
                >
                  {nm.icon}
                  <span>{nm.label}</span>
                </button>
              );
            })}

            {/* "Mais (☰)" Dropdown Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                className={`px-3 py-2 rounded-xl flex items-center gap-1 transition-all text-xs font-bold cursor-pointer border ${
                  moreNavLinks.some(m => m.id === activeScreen)
                    ? 'bg-white text-indigo-700 border-white shadow-sm font-black'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                }`}
                title="Mais opções e relatórios"
              >
                <Menu className="w-4 h-4" />
                <span>Mais</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${moreMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {moreMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setMoreMenuOpen(false)}
                  ></div>
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200/80 p-2 z-50 animate-fade-in divide-y divide-slate-100">
                    <div className="py-1">
                      <div className="px-3 py-1.5 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        Outros Módulos & Gestão
                      </div>
                      {moreNavLinks.map(m => {
                        const active = activeScreen === m.id;
                        return (
                          <button
                            key={m.id}
                            onClick={() => {
                              handleSelectNavScreen(m.id);
                              setMoreMenuOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                              active 
                                ? 'bg-indigo-50 text-indigo-700 font-extrabold' 
                                : 'hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <span className="p-1 rounded-lg bg-slate-100/80 shrink-0">{m.icon}</span>
                            <span className="truncate">{m.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </nav>

          {/* User profile bubble showing right side of bar */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Botão de Destaque Inteligente Anjinha Aura (Visível apenas para diretores, coordenadores e professores) */}
            {temAcessoAura && (
              <a
                href="#"
                onClick={handleOpenAura}
                className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl flex items-center gap-1.5 transition-all text-[11px] sm:text-xs font-black cursor-pointer bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 active:from-pink-700 active:to-rose-700 text-white shadow-md hover:shadow-lg hover:scale-103 active:scale-98 duration-150 animate-pulse shrink-0 border border-pink-400/30"
                title="Abrir o assistente inteligente Anjinha Aura em nova aba"
              >
                <Sparkles className="w-4 h-4 text-white fill-white/20" />
                <span className="hidden sm:inline">Anjinha Aura ✨</span>
                <span className="sm:hidden">Aura ✨</span>
              </a>
            )}

            <div className="hidden md:flex flex-col text-right leading-none">
              <span className="text-xs font-bold text-white flex items-center justify-end gap-1">
                {localStorage.getItem('anjo_master_demonstracao_ativo') === 'true' && (
                  <span className="text-[10px]" title="Acesso Total de Demonstração (PIN Dev 9181 / Direção 3031)"> </span>
                )}
                {usuarioAdaptado ? usuarioAdaptado.nome.replace(/ \((Educadora|Cuidadora|Mãe|Pai|Familiar|Médico|Pediatra|Profissional)\)/g, '') : ''}
              </span>
              <span className="text-[9px] uppercase font-black tracking-wider text-white/70 mt-0.5">
                {localStorage.getItem('anjo_master_demonstracao_ativo') === 'true' 
                  ? 'Master (Dev)' 
                  : (usuarioAdaptado?.tipo?.toLowerCase() === 'diretor' || usuarioAdaptado?.tipo?.toLowerCase() === 'diretora' || usuarioAdaptado?.tipo?.toLowerCase() === 'admin' 
                      ? 'Diretor(a)' 
                      : (usuarioAdaptado?.tipo?.toLowerCase() === 'coordenador' || usuarioAdaptado?.tipo?.toLowerCase() === 'coordenadora' || usuarioAdaptado?.tipo?.toLowerCase() === 'profissional'
                          ? 'Coordenador(a)' 
                          : (usuarioAdaptado?.tipo?.toLowerCase() === 'desenvolvedor' || usuarioAdaptado?.tipo?.toLowerCase() === 'dev'
                              ? 'Desenvolvedor' 
                              : (usuarioAdaptado?.tipo === 'cuidador' && isEscolar ? 'Professora' : usuarioAdaptado?.tipo)
                            )
                        )
                    )
                }
                {usuarioAdaptado?.salaAula && ` · ${usuarioAdaptado.salaAula === 'Todas' ? 'Todas' : usuarioAdaptado.salaAula}`}
              </span>
            </div>
            
            <div 
              onClick={() => setIsEditProfileModalOpen(true)}
              className="hidden sm:flex flex-col items-center select-none shrink-0 leading-none cursor-pointer group"
              title="Clique para editar sua foto e dados do seu perfil"
            >
              <div className="relative shrink-0">
                <img 
                  referrerPolicy="no-referrer"
                  src={usuarioAdaptado?.foto || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150"} 
                  alt={usuarioAdaptado?.nome || ''} 
                  className={`w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full object-cover border transition-all shadow-sm transform group-hover:scale-105 duration-200 ${
                    localStorage.getItem('anjo_master_demonstracao_ativo') === 'true'
                      ? 'border-amber-400 ring-2 ring-amber-400/35'
                      : 'border-white/40 group-hover:border-white ring-2 ring-white/20'
                  }`}
                />
                <span className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-1 ring-white/10 ${
                  localStorage.getItem('anjo_master_demonstracao_ativo') === 'true' ? 'bg-amber-400' : 'bg-emerald-400'
                }`}></span>
              </div>
              
              {/* Cargo/perfil abaixo da foto */}
              <span className="text-[7.5px] uppercase font-black tracking-wider text-white bg-black/30 group-hover:bg-indigo-600 px-1 py-0.5 rounded-md mt-1 leading-none text-center transition-colors">
                {localStorage.getItem('anjo_master_demonstracao_ativo') === 'true' 
                  ? 'Dev' 
                  : getRoleLabel(usuarioAdaptado, isEscolar)
                }
              </span>
            </div>

            {/* Quick Dark Mode toggle button - Always visible for high accessibility */}
            <button
              onClick={() => handleUpdateAccessibility({ 
                ...accessibility, 
                darkMode: !accessibility.darkMode 
              })}
              className="hidden md:flex p-2 hover:bg-white/10 text-white rounded-xl transition-all cursor-pointer items-center justify-center"
              title={accessibility.darkMode ? "Mudar para Modo Claro" : "Mudar para Modo Noturno"}
            >
              {accessibility.darkMode ? <Sun className="w-5 h-5 text-amber-300 fill-amber-300/15" /> : <Moon className="w-5 h-5 text-indigo-100" />}
            </button>

            {/* Logout button - Always visible for quick profile switching */}
            <button
              onClick={handleLogout}
              className="flex p-2 hover:bg-white/10 text-white/80 hover:text-white rounded-xl transition-all cursor-pointer"
              title="Voltar ao início de perfis"
            >
              <LogOut className="w-5 h-5" />
            </button>

            {/* Mobile Nav Menu Hamburger Toggle Button with prominent backdrop container */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden px-3 py-2 bg-white/10 hover:bg-white/20 active:bg-white/30 border border-white/15 text-white rounded-xl transition-all cursor-pointer flex items-center justify-center shadow-3xs"
              title="Menu Principal"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </header>

      {/* Mobile drawer layout element */}
      {mobileMenuOpen && (
        <div className={`lg:hidden ${isEscolar ? 'bg-indigo-700' : 'bg-serene-blue'} text-white border-t border-white/10 py-3.5 px-4 space-y-2 sticky top-[68px] z-40 shrink-0 shadow-lg max-h-[calc(100vh-68px)] overflow-y-auto`}>
          
          {/* Active Profile Info inside Drawer */}
          <div className="flex items-center gap-3 p-3 bg-white/10 rounded-2xl mb-2.5 border border-white/5">
            <img 
              referrerPolicy="no-referrer"
              src={usuarioAdaptado?.foto || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150"} 
              alt={usuarioAdaptado?.nome || ''} 
              className="w-10 h-10 rounded-full object-cover border border-white/20"
            />
            <div className="leading-tight">
              <span className="text-xs font-bold text-white block">
                {usuarioAdaptado?.nome.replace(/ \((Educadora|Cuidadora|Mãe|Pai|Familiar|Médico|Pediatra|Profissional)\)/g, '')}
              </span>
              <span className="text-[9px] uppercase font-black tracking-wider text-white/70 block">
                {localStorage.getItem('anjo_master_demonstracao_ativo') === 'true' ? 'Master (Acesso Total)' : getRoleLabel(usuarioAdaptado, isEscolar)}
              </span>
              {usuarioAdaptado?.salaAula && (
                <span className="text-[9px] text-pink-200 font-bold block mt-0.5">
                  Sala: {usuarioAdaptado.salaAula === 'Todas' ? 'Todas' : usuarioAdaptado.salaAula}
                </span>
              )}
            </div>
          </div>

          {navLinks.map(nm => {
            const active = activeScreen === nm.id;
            
            // Filter list in Simple Senior Mode as requested
            if (accessibility.simplifiedMode && (nm.id === 'reports' || nm.id === 'family')) return null;

            return (
              <button
                key={nm.id}
                onClick={() => { handleSelectNavScreen(nm.id); setMobileMenuOpen(false); }}
                className={`w-full text-left p-3 rounded-xl flex items-center gap-3 font-semibold text-sm transition-all cursor-pointer ${
                  active 
                    ? (isEscolar ? 'bg-white text-indigo-700 shadow-sm' : 'bg-white text-serene-blue shadow-sm') 
                    : 'hover:bg-white/10 text-white/90'
                }`}
              >
                {nm.icon}
                {nm.label}
              </button>
            );
          })}

          {/* Botão de Atalho Aura AI Mobile */}
          {temAcessoAura && (
            <a
              href="#"
              onClick={(e) => {
                setMobileMenuOpen(false);
                handleOpenAura(e);
              }}
              className="w-full text-left p-3 rounded-xl flex items-center gap-3 font-semibold text-sm transition-all cursor-pointer bg-pink-500/15 text-pink-200 border border-pink-500/20 shadow-3xs hover:bg-pink-500/25 animate-pulse"
              title="Abrir assistente de IA em nova aba"
            >
              <Sparkles className="w-5 h-5 text-pink-400 font-bold" />
              <span>Anjinha Aura ✨</span>
            </a>
          )}

          {/* Quick settings/config section for mobile users to access mode changes easily */}
          <div className="border-t border-white/10 my-2 pt-2.5 space-y-1">
            <span className="text-[9px] text-white/50 uppercase font-bold tracking-wider px-3 block">Configurações Rápidas</span>
            
            {/* Dark Mode toggle for mobile drawer */}
            <button
              onClick={() => {
                handleUpdateAccessibility({ 
                  ...accessibility, 
                  darkMode: !accessibility.darkMode 
                });
              }}
              className="w-full text-left p-3 rounded-xl flex items-center gap-3 font-semibold text-xs hover:bg-white/10 text-white cursor-pointer"
            >
              {accessibility.darkMode ? (
                <>
                  <Sun className="w-4 h-4 text-amber-300 fill-amber-300/15" />
                  <span>Tema Ativo: Noturno (Mudar p/ Claro)</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-200" />
                  <span>Tema Ativo: Claro (Mudar p/ Noturno)</span>
                </>
              )}
            </button>

            {/* Logout/Profile Switcher for mobile drawer */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="w-full text-left p-3 rounded-xl flex items-center gap-3 font-semibold text-xs hover:bg-rose-500/20 text-rose-200 cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-rose-300 shrink-0" />
              <span>Sair do Perfil Simulado</span>
            </button>
          </div>
        </div>
      )}

      {/* Sub-header Quick Search & Active Student Bar */}
      {usuarioAtual && idosoAdaptado && (
        <div className={`border-b py-1.5 sm:py-2 px-4 sm:px-6 lg:px-8 transition-colors relative z-20 ${
          isEscolar
            ? 'bg-gradient-to-r from-indigo-900/90 via-indigo-950 to-slate-900 text-indigo-100 border-indigo-700/40 shadow-sm'
            : 'bg-slate-800 text-slate-100 border-slate-700 shadow-sm'
        }`}>
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5">
            {/* Active Student Chip */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0">
                <img
                  src={idosoAdaptado.foto || 'https://images.unsplash.com/photo-1519689680058-324335c77ebd?auto=format&fit=crop&q=80&w=150'}
                  alt={idosoAdaptado.nome}
                  className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full object-cover border-2 border-white/80 shadow-xs"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900"></span>
              </div>
              <div className="min-w-0 leading-tight">
                <div className="text-[9.5px] uppercase font-black text-amber-300 tracking-wider flex items-center gap-1">
                  <span>{isEscolar ? '  Criança/Aluno em Exibição:' : '  Assistido em Exibição:'}</span>
                </div>
                <div className="text-xs sm:text-sm font-black text-white truncate flex items-center gap-2">
                  <span>{idosoAdaptado.nome.split(' (')[0]}</span>
                  {idosoAdaptado.dataNascimento && (
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-white/15 rounded-md text-white/90">
                      {idosoAdaptado.dataNascimento}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Search Bar Input */}
            <div className="w-full md:max-w-lg">
              <QuickStudentSearch
                activeIdoso={idosoAdaptado}
                onSwitchIdoso={handleSwitchSenior}
                appMode={appMode}
                usuarioAtual={usuarioAtual}
                compact={true}
                darkMode={accessibility.darkMode}
                onNavigate={setActiveScreen}
              />
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Middle body canvas layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-7">
        
        {/* Banner 1: Active unpaid alert for Admin / Master */}
        {subscriptionStatus === 'atrasado' && usuarioAdaptado && usuarioAdaptado.tipo === 'admin' && (
          <div className="mb-6 p-4 bg-rose-50 border-2 border-rose-200 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-3 text-slate-800 animate-pulse">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠</span>
              <div>
                <strong className="text-sm font-bold text-rose-950 block">Mensalidade Pendente (R$ {subscriptionPrice.toFixed(2).replace('.', ',')})</strong>
                <span className="text-xs text-rose-800 font-medium">Os familiares estão temporariamente com acesso suspenso até a confirmação de regularidade.</span>
              </div>
            </div>
            <button 
              onClick={() => setActiveScreen('settings')}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl cursor-pointer shrink-0 transition-colors"
            >
              Configurar Financeiro / Liberar Acesso
            </button>
          </div>
        )}

        {/* Banner 2: Caregiver operation reassurance */}
        {subscriptionStatus === 'atrasado' && usuarioAdaptado && usuarioAdaptado.tipo === 'cuidador' && (
          <div className="mb-6 p-3.5 bg-emerald-50 border border-emerald-250 rounded-2xl flex items-center gap-2 text-slate-800">
            <span className="text-emerald-600 font-bold shrink-0"> </span>
            <span className="text-xs text-emerald-800 font-semibold leading-normal">
              <strong>Modo de Cuidado de Emergência Ativo:</strong> Mesmo com aviso financeiro pendente do idoso, seu login como cuidador continua 100% liberado para registrar remédios, refeições e sinais vitais. O cuidado físico e a segurança nunca param!
            </span>
          </div>
        )}

        {/* Paywall routing interceptor for passive family companions */}
        {subscriptionStatus === 'atrasado' && usuarioAdaptado && usuarioAdaptado.tipo === 'familiar' ? (
          <FinancePaywall 
            idoso={idosoAdaptado} 
            usuarioAtual={usuarioAdaptado}
            onPaymentSuccess={() => {
              setKeyTrigger(prev => prev + 1);
              setActiveScreen('dashboard');
            }}
            accessibilitySettings={accessibility}
          />
        ) : (
          <>
            {/* Navigation screen switch block */}
            {activeScreen === 'dashboard' && idosoAdaptado && (
              <Dashboard 
                key={`dashboard_${idosoAdaptado.id}_${usuarioAdaptado?.id || ''}`}
                idoso={idosoAdaptado} 
                usuarioAtual={usuarioAdaptado} 
                onNavigate={setActiveScreen} 
                accessibilitySettings={accessibility}
                triggerWhatsAppSim={triggerWhatsAppSim}
                keyTrigger={keyTrigger}
                appMode={appMode}
                onToggleAppMode={handleToggleAppMode}
                onSwitchUsuario={handleSwitchUsuario}
                onSwitchIdoso={handleSwitchSenior}
                onLogout={handleLogout}
              />
            )}

            {activeScreen === 'classroom' && idosoAdaptado && (
              <ClassroomList 
                key={`classroom_${usuarioAdaptado?.id || ''}`}
                activeIdoso={idosoAdaptado}
                onSwitchIdoso={handleSwitchSenior}
                accessibilitySettings={accessibility as any}
                usuarioAtual={usuarioAdaptado}
                onSwitchUsuario={handleSwitchUsuario}
                onNavigate={setActiveScreen}
                onLogout={handleLogout}
                triggerWhatsAppSim={triggerWhatsAppSim}
              />
            )}

            {activeScreen === 'medicacoes' && idosoAdaptado && (
              <Medications 
                key={`medications_${idosoAdaptado.id}_${usuarioAdaptado?.id || ''}`}
                idoso={idosoAdaptado} 
                usuarioAtual={usuarioAdaptado} 
                triggerWhatsAppSim={triggerWhatsAppSim}
                accessibilitySettings={accessibility}
                keyTrigger={keyTrigger}
              />
            )}

            {activeScreen === 'agenda' && idosoAdaptado && (
              <MedicalAgenda 
                key={`agenda_${idosoAdaptado.id}_${usuarioAdaptado?.id || ''}`}
                idoso={idosoAdaptado} 
                usuarioAtual={usuarioAdaptado} 
                triggerWhatsAppSim={triggerWhatsAppSim}
                accessibilitySettings={accessibility}
                keyTrigger={keyTrigger}
              />
            )}

            {activeScreen === 'routine' && idosoAdaptado && (
              <DailyRoutine 
                key={`routine_${idosoAdaptado.id}_${usuarioAdaptado?.id || ''}`}
                idoso={idosoAdaptado} 
                usuarioAtual={usuarioAdaptado} 
                triggerWhatsAppSim={triggerWhatsAppSim}
                accessibilitySettings={accessibility}
                keyTrigger={keyTrigger}
              />
            )}

            {activeScreen === 'jornada' && idosoAdaptado && (
              <JornadaAnjinho 
                key={`jornada_${idosoAdaptado.id}_${usuarioAdaptado?.id || ''}`}
                idoso={idosoAdaptado} 
                usuarioAtual={usuarioAdaptado} 
                accessibilitySettings={accessibility}
                keyTrigger={keyTrigger}
              />
            )}

            {activeScreen === 'coordenacao' && (
              <CoordinationPanel
                key={`coordenacao_${usuarioAdaptado?.id || ''}`}
                accessibilitySettings={accessibility}
                appMode={appMode}
                usuarioAtual={usuarioAdaptado}
              />
            )}

            {activeScreen === 'brandbook' && (
              <BrandBook 
                key="brandbook"
                accessibilitySettings={accessibility as any}
                keyTrigger={keyTrigger}
              />
            )}

            {activeScreen === 'family' && idosoAdaptado && (
              <FamilySection 
                key={`family_${idosoAdaptado.id}_${usuarioAdaptado?.id || ''}`}
                idoso={idosoAdaptado} 
                usuarioAtual={usuarioAdaptado} 
                accessibilitySettings={accessibility}
                keyTrigger={keyTrigger}
              />
            )}

            {activeScreen === 'reports' && idosoAdaptado && (
              <Reports 
                key={`reports_${idosoAdaptado.id}_${usuarioAdaptado?.id || ''}`}
                idoso={idosoAdaptado} 
                accessibilitySettings={accessibility}
                keyTrigger={keyTrigger}
                triggerWhatsAppSim={triggerWhatsAppSim}
              />
            )}

            {activeScreen === 'alerts' && idosoAdaptado && (
              <Alerts 
                key={`alerts_${idosoAdaptado.id}_${usuarioAdaptado?.id || ''}`}
                idoso={idosoAdaptado} 
                usuarioAtual={usuarioAdaptado}
                keyTrigger={keyTrigger}
                triggerWhatsAppSim={triggerWhatsAppSim}
                accessibilitySettings={accessibility}
              />
            )}

            {activeScreen === 'settings' && idosoAdaptado && (
              <SettingsPage 
                key={`settings_${idosoAdaptado.id}_${usuarioAdaptado?.id || ''}`}
                idoso={idosoAdaptado} 
                usuarioAtual={usuarioAdaptado} 
                onSwitchIdoso={handleSwitchSenior}
                onSwitchUsuario={handleSwitchUsuario}
                accessibilitySettings={accessibility}
                onUpdateAccessibility={handleUpdateAccessibility}
                keyTrigger={keyTrigger}
                onOpenEditProfile={() => setIsEditProfileModalOpen(true)}
              />
            )}

            {activeScreen === 'director' && (
              <DirectorPanel 
                key="director"
                accessibilitySettings={accessibility}
                appMode={appMode}
              />
            )}

            {activeScreen === 'admin' && (
              <AdminPanel 
                key="admin"
                accessibilitySettings={accessibility}
                triggerWhatsAppSim={triggerWhatsAppSim}
                idoso={idosoAdaptado || idosoAtual || undefined}
                appMode={appMode}
              />
            )}
          </>
        )}

      </main>



      {/* Humble visual footer (No Telemetry, no logs, anti-slop) */}
      <footer className="py-4 border-t border-soft-gray shrink-0 text-center text-xs text-slate-500 font-medium animate-fade-in">
        {isFundamental
          ? 'Anjinho Fundamental — Aprendizado, foco e desenvolvimento acompanhados de perto.'
          : isEscolar
            ? 'Anjinho Escolar — Cada dia vivido. Cada lembrança guardada.'
            : 'Anjo Cuidador — Cuidado, presença e tranquilidade para quem você ama.'
        }
      </footer>

      {/* MODAL DE SEGURANÇA CONTRA ACESSO DE TERCEIROS DENTRO DA SIMULAÇÁO */}
      {showPinModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="school-protection-modal">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 p-6 space-y-4 shadow-2xl text-slate-800 animate-scale-up">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5 leading-tight">
                  {pendingAction === 'toggle_mode' ? 'Acesso ao Modo Escolar' : pendingAction === 'view_director' ? 'Acesso à Direção Escolar' : 'Painel de Administrador Restrito'}
                </h3>
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block">
                  Segurança e Permissão de Escopo
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Você está tentando acessar uma {pendingAction === 'toggle_mode' ? 'funcionalidade comercial externa' : pendingAction === 'view_director' ? 'área da direção da escola' : 'área administrativa sensível'}. 
              Seu usuário simulado selecionado no momento é <strong className="text-slate-800">{usuarioAtual?.nome}</strong> ({usuarioAtual?.tipo === 'cuidador' ? 'Cuidador de Idosos' : 'Membro da Família'}).
            </p>

            <div className="p-3 bg-slate-50 border rounded-xl space-y-1">
              <strong className="text-[11px] block font-extrabold text-slate-700">Por que isto está bloqueado?</strong>
              <p className="text-[10px] text-slate-500 leading-snug">
                {pendingAction === 'toggle_mode' 
                  ? 'Para assegurar a máxima privacidade e evitar que cuidadores domésticos acessem agendas, fotos e boletins pedagógicos escolares de menores, o modo Anjinho Escolar é isolado contra acessos não autorizados.'
                  : pendingAction === 'view_director'
                    ? 'O Painel da Direção Escolar contém dados sensíveis como o cadastro de turmas, alocação de professoras e personalização visual da escola (co-branding).'
                    : 'O Painel de Auditoria Governamental da LGPD e as configurações de Mensalidades do plano são restritos apenas à titular administradora do plano (Clarice).'
                }
              </p>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const correctPin = localStorage.getItem('anjo_admin_pin') || '3031';
              
              const allUsersList = getFromDB<Usuario[]>('anjo_usuarios', []);
              const matchingDirector = allUsersList.find(u => 
                (u.tipo === 'diretor' || u.tipo === 'diretora' || u.nome.toLowerCase().includes('nilva') || u.nome.toLowerCase().includes('diret')) &&
                u.pin && u.pin === pinValue
              );
              const isDevMasterPin = pinValue === '9181' || pinValue === '8191';
              const isDirectorPin = pinValue === '3031' || pinValue === correctPin || !!matchingDirector;

              if (isDevMasterPin || isDirectorPin) {
                // Grant master permissions on entering Dev or Director PIN
                localStorage.setItem('anjo_master_demonstracao_ativo', 'true');
                setShowPinModal(false);
                setPinValue('');
                setPinError('');
                
                if (pendingAction === 'toggle_mode') {
                  executeToggleAppMode();
                } else if (pendingAction === 'view_admin') {
                  setActiveScreen('admin');
                } else if (pendingAction === 'view_director') {
                  if (isDevMasterPin) {
                    // If entered Dev PIN 9181, keep user or switch to dev if desired, and go straight to director screen
                    setActiveScreen('director');
                  } else {
                    // Switch active user profile to Nilva Amaral or Director if current active user is a Familiar
                    const targetDirector = matchingDirector || allUsersList.find(u => 
                      u.tipo === 'diretor' || u.tipo === 'diretora' || u.nome.toLowerCase().includes('nilva') || u.nome.toLowerCase().includes('diret')
                    ) || allUsersList.find(u => u.id === 'user_admin');

                    if (targetDirector) {
                      localStorage.setItem('anjo_simulacao_user_id', targetDirector.id);
                      setUsuarioAtual(targetDirector);

                      const targetMode = determineAppModeForUser(targetDirector, appMode);
                      if (targetMode !== appMode) {
                        setAppMode(targetMode);
                        localStorage.setItem('anjo_app_mode', targetMode);
                      }

                      const allSeniors = getFromDB<Idoso[]>('anjo_idosos', []);
                      const bestStudent = findBestMatchingIdoso(targetDirector, targetMode) || allSeniors.find(s => s.id.startsWith('aluno_'));
                      if (bestStudent) {
                        setIdosoAtual(bestStudent);
                        localStorage.setItem('anjo_simulacao_idoso_id', bestStudent.id);
                      }

                      window.dispatchEvent(new CustomEvent('anjo_user_updated'));
                    }

                    setActiveScreen('director');
                  }
                }
                setPendingAction(null);
              } else {
                setPinError(pendingAction === 'view_director' ? 'PIN de Diretor incorreto! Tente novamente.' : 'PIN de Administrador incorreto! Tente novamente.');
                try {
                  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                  const osc = ctx.createOscillator();
                  const gain = ctx.createGain();
                  osc.frequency.setValueAtTime(150, ctx.currentTime);
                  gain.gain.setValueAtTime(0.05, ctx.currentTime);
                  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
                  osc.connect(gain);
                  gain.connect(ctx.destination);
                  osc.start();
                  osc.stop(ctx.currentTime + 0.3);
                } catch(err){}
              }
            }} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-650 block">
                  {pendingAction === 'view_director' ? 'Digite o PIN da Direção ou PIN Dev (9181) para Liberar:' : 'Digite o PIN do Administrador / Dev (9181) para Liberar:'}
                </label>
                <input 
                  type="password"
                  maxLength={4}
                  pattern="[0-9]*"
                  inputMode="numeric"
                  placeholder="••••"
                  value={pinValue}
                  onChange={e => {
                    setPinValue(e.target.value.replace(/\D/g, ''));
                    setPinError('');
                  }}
                  className="w-full text-center py-2 px-4 tracking-widest text-lg font-black border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 bg-slate-50 text-slate-800"
                  required
                  autoFocus
                />
                
                {pinError ? (
                  <p className="text-[11px] text-rose-600 font-extrabold text-center">
                    ❌ {pinError}
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-400 font-semibold text-center leading-normal">
                      Acesso Master & Direção: Digite o PIN de 4 dígitos para prosseguir. <br />
                    <span className="text-indigo-600 font-black">
                      {pendingAction === 'view_director' 
                        ? '  Dica de Acesso: Use o PIN Master Dev "9181" (Acesso Total) ou o PIN da Diretora Nilva "3031" para liberar!' 
                        : '  Dica de Acesso: Use o PIN Master Dev "9181" (Acesso Total) ou o PIN da Diretora Nilva "3031" para liberar!'
                      }
                    </span>
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPinModal(false);
                    setPinValue('');
                    setPinError('');
                    setPendingAction(null);
                  }}
                  className="flex-1 py-2 px-3 border border-slate-200 text-slate-550 hover:bg-slate-50 hover:text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  Confirmar PIN (Liberar)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModeSelectionModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in" id="mode-selection-modal">
          <div className="bg-white rounded-3xl max-w-5xl w-full border border-slate-200 p-6 sm:p-8 space-y-6 shadow-2xl text-slate-800 animate-scale-up">
            <div className="text-center space-y-2">
              <div className="inline-flex p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                <School className="w-8 h-8" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Seletor de Ambiente Inteligente
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mx-auto leading-relaxed">
                Olá, <strong className="text-slate-800">{usuarioAtual?.nome}</strong>! Como Administrador/Diretor, você possui privilégios de governança para gerenciar e alternar instantaneamente entre os perfis de atendimento ativos.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto gap-4">
              {/* Opção 1: Idosos */}
              <button
                onClick={() => changeAppMode('idoso')}
                className={`text-left p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between h-full space-y-4 hover:shadow-md ${
                  appMode === 'idoso'
                    ? 'border-emerald-500 bg-emerald-50/20 shadow-xs ring-1 ring-emerald-500/30'
                    : 'border-slate-200 bg-white hover:border-slate-350 hover:bg-slate-50'
                }`}
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-xl shadow-3xs">
                     
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                      Anjo Cuidador
                    </h4>
                    <span className="text-[10px] uppercase font-black text-emerald-600 tracking-wider">Acompanhamento Sênior</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                    Monitoramento de idosos, controle de remédios com alarmes, registro de sinais vitais, agenda médica e alertas instant de emergência no WhatsApp.
                  </p>
                </div>
                <div className="w-full pt-2">
                  <span className={`text-[10px] font-black px-2.5 py-1.5 rounded-full block text-center ${
                    appMode === 'idoso' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {appMode === 'idoso' ? 'Ambiente Ativo ✓' : 'Ativar Ambiente'}
                  </span>
                </div>
              </button>

              {/* Opção 2: Educação Infantil */}
              <button
                onClick={() => changeAppMode('escolar_infantil')}
                className={`text-left p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between h-full space-y-4 hover:shadow-md ${
                  appMode === 'escolar_infantil' || appMode === 'escolar_fundamental'
                    ? 'border-indigo-500 bg-indigo-50/20 shadow-xs ring-1 ring-indigo-500/30'
                    : 'border-slate-200 bg-white hover:border-slate-350 hover:bg-slate-50'
                }`}
              >
                <div className="space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-white border border-indigo-100 flex items-center justify-center shadow-xs overflow-hidden p-1 shrink-0">
                    <img src="/logo.png?v=15" alt="Anjinho Logo" className="w-full h-full object-contain transform scale-[1.45]" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                      Anjinho Escolar
                    </h4>
                    <span className="text-[10px] uppercase font-black text-indigo-600 tracking-wider">Educação Infantil (Berçário, Maternal e Pré)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                    Gestão para berçário, maternal e pré-escola. Caderneta digital de sonecas, trocas de fraldas, mamadeiras, hidratação, refeições e recados diários aos pais.
                  </p>
                </div>
                <div className="w-full pt-2">
                  <span className={`text-[10px] font-black px-2.5 py-1.5 rounded-full block text-center ${
                    appMode === 'escolar_infantil' || appMode === 'escolar_fundamental' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {appMode === 'escolar_infantil' || appMode === 'escolar_fundamental' ? 'Ambiente Ativo ✓' : 'Ativar Ambiente'}
                  </span>
                </div>
              </button>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
              <span className="font-semibold text-center sm:text-left leading-normal flex items-center gap-1">
                  <span>Acesso seguro com privilégios de Direção Geral ativos.</span>
              </span>
              <button
                onClick={() => setShowModeSelectionModal(false)}
                className="w-full sm:w-auto py-2 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl transition-all cursor-pointer"
              >
                Fechar Painel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal for Active User */}
      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        usuarioAtual={usuarioAdaptado}
        onSaveUsuario={handleSaveProfile}
      />

      {/* Floating Realtime Firebase Diagnostic Toolbar (Tests 1, 2, 3, 4, 5) */}
      <FirebaseDiagnosticBar />
    </div>
  );
}
