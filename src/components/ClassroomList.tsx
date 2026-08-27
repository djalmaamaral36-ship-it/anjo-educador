import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Baby, 
  Calendar, 
  Heart, 
  ShieldAlert, 
  Phone, 
  FileText, 
  Activity, 
  CheckCircle, 
  UserCheck,
  Award,
  Sparkles,
  ChevronRight,
  ClipboardList,
  FlameKindling,
  Trash2,
  Edit2,
  Plus,
  UserX,
  Clock,
  Camera,
  Upload,
  RefreshCw,
  Download,
  Lock,
  X,
  Droplets,
  Thermometer,
  Moon,
  LayoutGrid,
  List,
  Smartphone,
  Shield,
  Share2,
  UserPlus
} from 'lucide-react';
import { Idoso, Usuario, Classroom, isStaffUser, isDirectorOrAdminUser, getRoleLabel } from '../types';
import { getFromDB, saveToDB, SALAS_INICIAIS, compressImage, compressBase64Image, setShiftActiveState, getShiftActiveState, getAssignedTeacherForRoom, getStudentRoomName, checkBottleFeedingInterval, registerBottleAttemptNotice, getNowTimeBr, getTodayIsoBr, deleteStudentEverywhere } from '../data';
import { VoiceInput } from './VoiceInput';

const AVATAR_OPTIONS = [
  { url: 'https://images.unsplash.com/photo-1519689680058-324335c77ebd?auto=format&fit=crop&q=80&w=150', label: 'Menina de Touca' },
  { url: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&q=80&w=150', label: 'Menino Sorrindo' },
  { url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150', label: 'Menina de Cabelo Cacheado' },
  { url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=150', label: 'Menino Concentrado' },
  { url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=150', label: 'Menino de Camisa Azul' },
  { url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150', label: 'Menina de Presilha' },
  { url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150', label: 'Menino de Listras' },
  { url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150', label: 'Menina Sorridente' },
  { url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=150', label: 'Menina Ruiva' },
  { url: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&q=80&w=150', label: 'Menina Olhar Doce' },
  { url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150', label: 'Menino de Touca Amarela' },
  { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150', label: 'Menino de Óculos' }
];

interface ClassroomListProps {
  key?: any;
  activeIdoso: Idoso;
  onSwitchIdoso: (id: string, forceAllow?: boolean) => void;
  accessibilitySettings: {
    fontSize: 'normal' | 'grande' | 'gigante';
    highContrast: boolean;
    darkMode: boolean;
    simplifiedMode: boolean;
  };
  usuarioAtual?: Usuario;
  onSwitchUsuario?: (userId: string) => void;
  onNavigate?: (screen: string) => void;
  onLogout?: () => void;
  triggerWhatsAppSim?: (titulo: string, mensagem: string, targetStudents?: Idoso[]) => void;
}

export default function ClassroomList({ 
  activeIdoso, 
  onSwitchIdoso,
  accessibilitySettings,
  usuarioAtual,
  onSwitchUsuario,
  onNavigate,
  onLogout,
  triggerWhatsAppSim
}: ClassroomListProps) {
  if (usuarioAtual?.tipo === 'familiar') {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border border-red-100 shadow-sm space-y-4">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 border border-red-200">
          <span className="text-3xl"> </span>
        </div>
        <h2 className="text-lg font-black text-slate-800">Acesso Restrito</h2>
        <p className="text-sm text-slate-500 max-w-md leading-relaxed">
          Por motivos de segurança e privacidade dos alunos, esta tela é restrita aos educadores e equipe da escola. Você só pode acompanhar as informações do seu próprio filho através do Diário da Inf
        </p>
      </div>
    );
  }

  const [students, setStudents] = useState<Idoso[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [showAddClassroomForm, setShowAddClassroomForm] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomEmoji, setNewRoomEmoji] = useState(' ');
  const [newRoomAgeGroup, setNewRoomAgeGroup] = useState('2-3 anos');
  const [newRoomCapacity, setNewRoomCapacity] = useState(15);
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('todos');
  const [selectedClassroomForPreview, setSelectedClassroomForPreview] = useState<Classroom | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'todos' | 'alergicos' | 'cuidados_especiais'>('todos');
  const [studentViewMode, setStudentViewMode] = useState<'reduzido' | 'completo'>('reduzido');
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<Idoso | null>(null);

  const [showAddSpecialField, setShowAddSpecialField] = useState(false);
  const [newSpecialValue, setNewSpecialValue] = useState('');
  const [newSpecialType, setNewSpecialType] = useState<'condicao' | 'alergia'>('condicao');

  const [bypassClassroomFilter, setBypassClassroomFilter] = useState(false);

  const [absenceDates, setAbsenceDates] = useState<string[]>([]);
  const [retroDate, setRetroDate] = useState('');
  const [showAddRetroDate, setShowAddRetroDate] = useState(false);

  const [updateTrigger, setUpdateTrigger] = useState(0);

  // New student states
  const [showAddStudentForm, setShowAddStudentForm] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentClassroom, setNewStudentClassroom] = useState('Maternal I');
  const [newStudentBirthDate, setNewStudentBirthDate] = useState('15/10/2023');
  const [newStudentResponsibleName, setNewStudentResponsibleName] = useState('');
  const [newStudentResponsibleParentesco, setNewStudentResponsibleParentesco] = useState('Mãe');
  const [newStudentResponsiblePhone, setNewStudentResponsiblePhone] = useState('');
  const [newStudentAllergiesInput, setNewStudentAllergiesInput] = useState('');
  const [newStudentConditionsInput, setNewStudentConditionsInput] = useState('');
  const [newStudentCarePlanInput, setNewStudentCarePlanInput] = useState('');
  const [newStudentPhoto, setNewStudentPhoto] = useState('https://images.unsplash.com/photo-1519689680058-324335c77ebd?auto=format&fit=crop&q=80&w=150');

  // Aura AI Bulk Import states
  const [addStudentTab, setAddStudentTab] = useState<'individual' | 'massa'>('individual');
  const [bulkText, setBulkText] = useState('');
  const [isParsingBulk, setIsParsingBulk] = useState(false);
  const [parsedStudents, setParsedStudents] = useState<any[]>([]);

  // Camera & upload states for student registration
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('user');
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Camera & upload states for updating existing student photo in detail panel
  const [isEditingDetailPhoto, setIsEditingDetailPhoto] = useState(false);
  const [isEditingStudentProfile, setIsEditingStudentProfile] = useState(false);
  const [editStudentForm, setEditStudentForm] = useState({
    nome: '',
    dataNascimento: '',
    responsavelNome: '',
    responsavelFone: '',
    responsavelParentesco: 'Mãe',
    medicoNome: '',
    medicoFone: '',
    planoCuidado: '',
    alergias: '',
    condicoes: '',
    salaAula: ''
  });
  const [isTransferringRoom, setIsTransferringRoom] = useState(false);
  const [targetClassroom, setTargetClassroom] = useState('');
  const [isCapturingDetail, setIsCapturingDetail] = useState(false);
  const [cameraStreamDetail, setCameraStreamDetail] = useState<MediaStream | null>(null);
  const [cameraErrorDetail, setCameraErrorDetail] = useState<string | null>(null);
  const [cameraFacingModeDetail, setCameraFacingModeDetail] = useState<'user' | 'environment'>('user');
  const videoRefDetail = useRef<HTMLVideoElement | null>(null);

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
      // Wait a tick for video element to be mounted/rendered
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(e => console.error("Erro play video:", e));
        }
      }, 100);
    } catch (err: any) {
      console.error("Erro ao acessar a c", err);
      setCameraError("Não foi possível acessar a c do dispositivo. Verifique as permissões de acesso.");
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
      // Set resolution for compressed avatar
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw centered square from video (to handle aspect ratios)
        const videoWidth = videoRef.current.videoWidth;
        const videoHeight = videoRef.current.videoHeight;
        const minSize = Math.min(videoWidth, videoHeight);
        const sx = (videoWidth - minSize) / 2;
        const sy = (videoHeight - minSize) / 2;
        
        ctx.drawImage(
          videoRef.current, 
          sx, sy, minSize, minSize, // source crop
          0, 0, 300, 300            // destination size
        );
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setNewStudentPhoto(dataUrl);
        showToast("Foto capturada com sucesso!", "success");
      }
      stopCamera();
    }
  };

  const handleStudentPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 300, 300, 0.5);
        setNewStudentPhoto(compressed);
        showToast("Foto carregada e processada com sucesso!", "success");
      } catch (err) {
        console.error('Erro ao comprimir foto:', err);
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setNewStudentPhoto(reader.result);
            showToast("Foto carregada com sucesso!", "success");
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  useEffect(() => {
    if (!showAddStudentForm) {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }
      setIsCapturing(false);
    }
  }, [showAddStudentForm]);

  // Cleanup effects for detail camera stream
  useEffect(() => {
    return () => {
      if (cameraStreamDetail) {
        cameraStreamDetail.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStreamDetail]);

  useEffect(() => {
    if (cameraStreamDetail) {
      cameraStreamDetail.getTracks().forEach(track => track.stop());
      setCameraStreamDetail(null);
    }
    setIsCapturingDetail(false);
    setIsEditingDetailPhoto(false);
    setIsEditingStudentProfile(false);
  }, [selectedStudentForDetail]);

  const handleStartEditStudentProfile = (student: Idoso) => {
    setIsEditingStudentProfile(true);
    setEditStudentForm({
      nome: student.nome,
      dataNascimento: student.dataNascimento || '',
      responsavelNome: student.contatoEmergencia?.nome || '',
      responsavelFone: student.contatoEmergencia?.telefone || '',
      responsavelParentesco: student.contatoEmergencia?.parentesco || 'Mãe',
      medicoNome: student.medicoResponsavel?.nome || '',
      medicoFone: student.medicoResponsavel?.telefone || '',
      planoCuidado: student.planoCuidado || '',
      alergias: student.alergias ? student.alergias.join(', ') : '',
      condicoes: student.condicoesMedicas ? student.condicoesMedicas.join(', ') : '',
      salaAula: getStudentClassroom(student.nome)
    });
  };

  const handleSaveEditedStudentProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForDetail) return;

    const allPeople = getFromDB<Idoso[]>('anjo_idosos', []);
    const updated = allPeople.map(s => {
      if (s.id === selectedStudentForDetail.id) {
        return {
          ...s,
          nome: editStudentForm.nome,
          dataNascimento: editStudentForm.dataNascimento,
          salaAula: editStudentForm.salaAula || s.salaAula || getStudentClassroom(s),
          quarto: editStudentForm.salaAula || s.quarto || getStudentClassroom(s),
          contatoEmergencia: {
            ...s.contatoEmergencia,
            nome: editStudentForm.responsavelNome,
            telefone: editStudentForm.responsavelFone,
            parentesco: editStudentForm.responsavelParentesco
          },
          medicoResponsavel: {
            ...s.medicoResponsavel,
            nome: editStudentForm.medicoNome,
            telefone: editStudentForm.medicoFone,
            especialidade: s.medicoResponsavel?.especialidade || 'Pediatria'
          },
          planoCuidado: editStudentForm.planoCuidado,
          alergias: editStudentForm.alergias.split(',').map(a => a.trim()).filter(Boolean),
          condicoesMedicas: editStudentForm.condicoes.split(',').map(c => c.trim()).filter(Boolean)
        };
      }
      return s;
    });

    saveToDB('anjo_idosos', updated);
    const updatedStudent = updated.find(s => s.id === selectedStudentForDetail.id) || null;
    setSelectedStudentForDetail(updatedStudent);
    setStudents(loadStudentsFromDB(updated));
    setIsEditingStudentProfile(false);
    showToast(`Cadastro do aluno ${editStudentForm.nome} atualizado com sucesso!`, 'success');
  };

  const handleDeleteStudentFromDB = (studentId: string, studentName: string) => {
    if (!window.confirm(`Tem certeza de que deseja excluir permanentemente o cadastro de ${getStudentCleanName(studentName)} do sistema? Essa ação não pode ser desfeita.`)) return;
    
    deleteStudentEverywhere(studentId);
    const allPeople = getFromDB<Idoso[]>('anjo_idosos', []);
    setStudents(loadStudentsFromDB(allPeople));
    setSelectedStudentForDetail(null);
    setIsEditingStudentProfile(false);
    showToast(`Cadastro de ${getStudentCleanName(studentName)} e todas as suas atividades foram excluídos com sucesso.`, 'info');
  };

  const startCameraDetail = async (facing: 'user' | 'environment' = cameraFacingModeDetail) => {
    setCameraErrorDetail(null);
    setIsCapturingDetail(true);
    
    if (cameraStreamDetail) {
      cameraStreamDetail.getTracks().forEach(track => track.stop());
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 400 }, height: { ideal: 400 }, facingMode: facing }
      });
      setCameraStreamDetail(mediaStream);
      setCameraFacingModeDetail(facing);
      setTimeout(() => {
        if (videoRefDetail.current) {
          videoRefDetail.current.srcObject = mediaStream;
          videoRefDetail.current.play().catch(e => console.error("Erro play video detail:", e));
        }
      }, 100);
    } catch (err: any) {
      console.error("Erro ao acessar a c do prontuário:", err);
      setCameraErrorDetail("Não foi possível acessar a c do dispositivo. Verifique as permissões de acesso.");
    }
  };

  const toggleCameraFacingModeDetail = () => {
    const nextMode = cameraFacingModeDetail === 'user' ? 'environment' : 'user';
    startCameraDetail(nextMode);
  };

  const stopCameraDetail = () => {
    if (cameraStreamDetail) {
      cameraStreamDetail.getTracks().forEach(track => track.stop());
      setCameraStreamDetail(null);
    }
    setIsCapturingDetail(false);
  };

  const capturePhotoDetail = () => {
    if (videoRefDetail.current && selectedStudentForDetail) {
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const videoWidth = videoRefDetail.current.videoWidth;
        const videoHeight = videoRefDetail.current.videoHeight;
        const minSize = Math.min(videoWidth, videoHeight);
        const sx = (videoWidth - minSize) / 2;
        const sy = (videoHeight - minSize) / 2;
        
        ctx.drawImage(
          videoRefDetail.current, 
          sx, sy, minSize, minSize,
          0, 0, 300, 300
        );
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        updateStudentPhotoInDB(selectedStudentForDetail.id, dataUrl);
        stopCameraDetail();
        setIsEditingDetailPhoto(false);
        showToast("Foto do prontuário atualizada com sucesso!", "success");
      }
    }
  };

  const handleDetailPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedStudentForDetail) {
      try {
        const compressed = await compressImage(file, 300, 300, 0.5);
        updateStudentPhotoInDB(selectedStudentForDetail.id, compressed);
        setIsEditingDetailPhoto(false);
        showToast("Foto do prontuário carregada com sucesso!", "success");
      } catch (err) {
        const reader = new FileReader();
        reader.onload = () => {
          updateStudentPhotoInDB(selectedStudentForDetail.id, reader.result as string);
          setIsEditingDetailPhoto(false);
          showToast("Foto do prontuário carregada!", "success");
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const updateStudentPhotoInDB = async (studentId: string, photoDataUrl: string) => {
    let finalPhoto = photoDataUrl;
    if (photoDataUrl && photoDataUrl.startsWith('data:image')) {
      try {
        finalPhoto = await compressBase64Image(photoDataUrl, 250, 250, 0.5);
      } catch (e) {
        console.warn('Image compression fallback:', e);
      }
    }
    const allStudents = getFromDB<Idoso[]>('anjo_idosos', []);
    const updated = allStudents.map(student => {
      if (student.id === studentId) {
        const updatedStudent = { ...student, foto: finalPhoto };
        setSelectedStudentForDetail(updatedStudent);
        if (activeIdoso.id === studentId) {
          onSwitchIdoso(studentId);
        }
        return updatedStudent;
      }
      return student;
    });
    saveToDB('anjo_idosos', updated);
    window.dispatchEvent(new CustomEvent('anjo_user_updated'));
  };

  const downloadStudentPhoto = async () => {
    if (!selectedStudentForDetail || !selectedStudentForDetail.foto) return;
    const cleanName = getStudentCleanName(selectedStudentForDetail.nome).toLowerCase().replace(/\s+/g, '_');
    const fileName = `foto_${cleanName}.jpg`;

    try {
      const imgUrl = selectedStudentForDetail.foto;
      
      // 1. Data URL (Base64)
      if (imgUrl.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = imgUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("Download da foto concluído!", "success");
        return;
      }

      // 2. HTTP / HTTPS URL - fetch as Blob to avoid cross-origin page navigation
      const response = await fetch(imgUrl);
      if (!response.ok) throw new Error('Falha ao baixar imagem via HTTP');
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
      showToast("Download da foto concluído!", "success");
    } catch {
      // 3. Fallback using Canvas to convert external image to Data URL and download
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width || 300;
          canvas.height = img.height || 300;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg');
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast("Download da foto concluído!", "success");
          }
        };
        img.onerror = () => {
          window.open(selectedStudentForDetail.foto, '_blank', 'noopener,noreferrer');
          showToast("Foto aberta em nova aba!", "info");
        };
        img.src = selectedStudentForDetail.foto;
      } catch {
        window.open(selectedStudentForDetail.foto, '_blank', 'noopener,noreferrer');
        showToast("Foto aberta em nova aba!", "info");
      }
    }
  };

  const getStudentCleanName = (name: string) => {
    return name.split(' (')[0];
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) {
      showToast('Por favor, informe o nome do aluno!', 'warning');
      return;
    }

    const allPeople = getFromDB<Idoso[]>('anjo_idosos', []);
    const newId = 'aluno_' + Date.now();
    const fullName = `${newStudentName.trim()} (${newStudentClassroom})`;

    const newStudent: Idoso = {
      id: newId,
      nome: fullName,
      salaAula: newStudentClassroom,
      quarto: newStudentClassroom,
      foto: newStudentPhoto || 'https://images.unsplash.com/photo-1519689680058-324335c77ebd?auto=format&fit=crop&q=80&w=150',
      dataNascimento: newStudentBirthDate.trim(), // Already in Brazilian DD/MM/YYYY format
      condicoesMedicas: newStudentConditionsInput ? newStudentConditionsInput.split(',').map(c => c.trim()).filter(Boolean) : [],
      alergias: newStudentAllergiesInput ? newStudentAllergiesInput.split(',').map(a => a.trim()).filter(Boolean) : [],
      observacoes: 'Aluno adicionado manualmente via painel escolar.',
      contatoEmergencia: {
        nome: newStudentResponsibleName.trim() || 'Responsável Não Informado',
        parentesco: newStudentResponsibleParentesco,
        telefone: newStudentResponsiblePhone.trim() || '(11) 99999-9999'
      },
      planoCuidado: newStudentCarePlanInput.trim() || 'Incentivar atividades lúdicas coletivas e checar hidratação regular.',
      medicoResponsavel: {
        nome: 'Dr(a). Não Cadastrado',
        especialidade: 'Pediatria Geral',
        telefone: ''
      }
    };

    const updated = [newStudent, ...allPeople];
    saveToDB('anjo_idosos', updated);

    setStudents(loadStudentsFromDB(updated));
    setUpdateTrigger(prev => prev + 1);

    // Reset fields
    setNewStudentName('');
    setNewStudentResponsibleName('');
    setNewStudentResponsiblePhone('');
    setNewStudentAllergiesInput('');
    setNewStudentConditionsInput('');
    setNewStudentCarePlanInput('');
    setNewStudentPhoto('https://images.unsplash.com/photo-1519689680058-324335c77ebd?auto=format&fit=crop&q=80&w=150');
    setShowAddStudentForm(false);

    // Notify components
    window.dispatchEvent(new CustomEvent('anjo_user_updated'));
    showToast(`Aluno(a) ${newStudentName.trim()} cadastrado(a) com sucesso!`, 'success');
    
    // Auto select the new student in details
    setSelectedStudentForDetail(newStudent);
  };

  const handleParseBulkStudents = async () => {
    if (!bulkText.trim()) {
      showToast('Por favor, cole a lista de alunos para extrair!', 'warning');
      return;
    }

    setIsParsingBulk(true);
    try {
      const customKey = localStorage.getItem('aura_gemini_key') || undefined;
      const response = await fetch("/api/parse-students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: bulkText,
          geminiKey: customKey
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.students) && data.students.length > 0) {
          setParsedStudents(data.students);
          showToast(`Sucesso! Aura extraiu ${data.students.length} aluno(s) da lista.`, 'success');
          return;
        }
      }
      throw new Error('Fallback local ativado');
    } catch (err: any) {
      console.warn('Processamento local ativado para lista de alunos:', err);
      // Fallback extraction
      const lines = bulkText.split(/\n|;/).map(l => l.trim()).filter(Boolean);
      const fallbackList: any[] = [];

      lines.forEach((line, idx) => {
        let cleanLine = line.replace(/^[\d\.\-\*\•\)]+\s*/, '').trim();
        if (!cleanLine) return;

        let age = 3;
        const ageMatch = cleanLine.match(/(\d+)\s*(anos|ano)/i);
        if (ageMatch) age = parseInt(ageMatch[1], 10);

        let className = 'Maternal I';
        const classMatch = cleanLine.match(/(Berçário\s*(?:I|II|1|2)?|Maternal\s*(?:I|II|1|2)?|Jardim\s*(?:I|II|1|2)?|Pré\s*(?:I|II|1|2)?|Infantil\s*(?:\d+)?|Fundamental\s*(?:\d+)?|Turma\s*[\w]+)/i);
        if (classMatch) className = classMatch[0].trim();

        let guardianName = 'Responsável';
        let guardianRelationship = 'Mãe/Pai';
        const guardianMatch = cleanLine.match(/(Mãe|Pai|Responsável|Resp|Avó|Avô):\s*([^\(,\d]+)/i);
        if (guardianMatch) {
          guardianRelationship = guardianMatch[1].trim();
          guardianName = guardianMatch[2].trim();
        }

        let guardianPhone = '';
        const phoneMatch = cleanLine.match(/\(?\d{2}\)?\s*9?\d{4}[-\s]?\d{4}/);
        if (phoneMatch) guardianPhone = phoneMatch[0].trim();

        let birthDate = '';
        const dobMatch = cleanLine.match(/\b(\d{2}\/\d{2}\/\d{4})\b/);
        if (dobMatch) {
          birthDate = dobMatch[1];
        } else if (age) {
          const birthYear = 2026 - age;
          birthDate = `15/10/${birthYear}`;
        }

        let allergies: string[] = [];
        const allergyMatch = cleanLine.match(/(?:alergia|alérgic[oa]|restrição|intoler)s?:\s*([^\(\;\.\n]+)/i);
        if (allergyMatch) {
          allergies = allergyMatch[1].split(/,|e\b/).map(s => s.trim()).filter(Boolean);
        } else {
          const keywords = ['lactose', 'glúten', 'amendoim', 'ovo', 'picada', 'poeira', 'corante', 'mofo'];
          keywords.forEach(kw => {
            if (cleanLine.toLowerCase().includes(kw)) {
              allergies.push(kw.charAt(0).toUpperCase() + kw.slice(1));
            }
          });
        }

        let conditions: string[] = [];
        const condMatch = cleanLine.match(/(?:cuidado|cuidados|condiçã[oo]|asma|fralda|medicação|remédio)s?:\s*([^\(\;\.\n]+)/i);
        if (condMatch) {
          conditions = condMatch[1].split(/,|e\b/).map(s => s.trim()).filter(Boolean);
        } else {
          const keywords = ['asma', 'bombinha', 'fralda', 'fisioterapia', 'desfralde', 'dermatite', 'óculos', 'chupeta'];
          keywords.forEach(kw => {
            if (cleanLine.toLowerCase().includes(kw)) {
              conditions.push(kw.charAt(0).toUpperCase() + kw.slice(1));
            }
          });
        }

        let namePart = cleanLine.split(/,|\b(anos|ano|Berçário|Maternal|Jardim|Pré|Infantil|Mãe|Pai|Resp)\b/i)[0].trim();
        namePart = namePart.replace(/[:\-–]/g, '').trim();

        if (namePart && namePart.length >= 2) {
          fallbackList.push({
            id: `std-${idx + 1}`,
            name: namePart,
            birthDate,
            age,
            className,
            guardianName,
            guardianRelationship,
            guardianPhone,
            allergies,
            conditions,
            observations: 'Importado via assistente Aura.'
          });
        }
      });

      if (fallbackList.length > 0) {
        setParsedStudents(fallbackList);
        showToast(`Aura extraiu ${fallbackList.length} aluno(s) da lista!`, 'success');
      } else {
        showToast('Não foi possível identificar nomes na lista enviada. Verifique o texto e tente novamente.', 'warning');
      }
    } finally {
      setIsParsingBulk(false);
    }
  };

  const handleSaveBulkStudents = () => {
    if (parsedStudents.length === 0) {
      showToast('Não há alunos estruturados para salvar!', 'warning');
      return;
    }

    const allPeople = getFromDB<Idoso[]>('anjo_idosos', []);
    const newStudents: Idoso[] = [];

    parsedStudents.forEach((student, index) => {
      const newId = 'aluno_' + (Date.now() + index);
      const studentClassroom = student.className || 'Maternal I';
      const studentName = student.name || `Aluno Sem Nome ${index + 1}`;
      const fullName = `${studentName.trim()} (${studentClassroom})`;

      // Calculate birthdate from age or student.birthDate
      let birthDateStr = student.birthDate || '15/10/2023';
      if (!student.birthDate && student.age) {
        const ageNum = parseInt(student.age, 10);
        if (!isNaN(ageNum)) {
          const birthYear = 2026 - ageNum;
          birthDateStr = `15/10/${birthYear}`;
        }
      }

      // Random avatar for variation
      const randomAvatar = AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)].url;

      const studentAllergies = Array.isArray(student.allergies) ? student.allergies : (student.allergies ? [String(student.allergies)] : []);
      const studentConditions = Array.isArray(student.conditions) ? student.conditions : (student.conditions ? [String(student.conditions)] : []);

      const newStudent: Idoso = {
        id: newId,
        nome: fullName,
        salaAula: studentClassroom,
        quarto: studentClassroom,
        foto: randomAvatar,
        dataNascimento: birthDateStr,
        condicoesMedicas: studentConditions,
        alergias: studentAllergies,
        observacoes: student.observations || 'Aluno cadastrado e padronizado via assistente inteligente Aura.',
        contatoEmergencia: {
          nome: student.guardianName || 'Responsável Não Informado',
          parentesco: student.guardianRelationship || 'Responsável',
          telefone: student.guardianPhone || '(11) 99999-9999'
        },
        planoCuidado: studentConditions.length > 0 
          ? `Cuidados Especiais: ${studentConditions.join(', ')}.` 
          : 'Incentivar atividades lúdicas coletivas e checar hidratação regular.',
        medicoResponsavel: {
          nome: 'Dr(a). Não Cadastrado',
          especialidade: 'Pediatria Geral',
          telefone: ''
        }
      };

      newStudents.push(newStudent);
    });

    const updated = [...newStudents, ...allPeople];
    saveToDB('anjo_idosos', updated);

    setStudents(loadStudentsFromDB(updated));
    setUpdateTrigger(prev => prev + 1);

    // Reset states
    setBulkText('');
    setParsedStudents([]);
    setAddStudentTab('individual');
    setShowAddStudentForm(false);

    // Notify components
    window.dispatchEvent(new CustomEvent('anjo_user_updated'));
    showToast(`${newStudents.length} aluno(s) importado(s) e salvo(s) com sucesso!`, 'success');

    // Select the first imported student for detail
    if (newStudents.length > 0) {
      setSelectedStudentForDetail(newStudents[0]);
    }
  };

  const handleDeleteStudent = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    setDeleteStudentOptions({
      isOpen: true,
      studentId: student.id,
      studentName: getStudentCleanName(student.nome)
    });
  };

  const executeDeleteStudent = (studentId: string, wipeHistory: boolean) => {
    // Delete student thoroughly across all collections, Firestore, and local state
    deleteStudentEverywhere(studentId);

    const allPeople = getFromDB<Idoso[]>('anjo_idosos', []);
    setStudents(loadStudentsFromDB(allPeople));

    // Notify other components
    showToast('Ficha e histórico apagados com sucesso!', 'success');

    // Select first student remaining or clear detail view
    const remainingStudents = allPeople.filter(p => p.id.startsWith('aluno_'));
    if (remainingStudents.length > 0) {
      if (studentId === activeIdoso.id) {
        onSwitchIdoso(remainingStudents[0].id);
      }
      setSelectedStudentForDetail(remainingStudents[0]);
    } else {
      setSelectedStudentForDetail(null);
    }
    
    setDeleteStudentOptions(null);
  };

  const handleExecuteTransfer = (studentId: string, newClassroomName: string) => {
    const allPeople = getFromDB<Idoso[]>('anjo_idosos', []);
    const studentIndex = allPeople.findIndex(p => p.id === studentId);
    if (studentIndex === -1) return;

    const student = allPeople[studentIndex];
    const cleanName = getStudentCleanName(student.nome);
    const updatedFullName = `${cleanName} (${newClassroomName})`;
    
    const updatedStudent = {
      ...student,
      nome: updatedFullName,
      salaAula: newClassroomName,
      quarto: newClassroomName
    };

    const updatedPeople = [...allPeople];
    updatedPeople[studentIndex] = updatedStudent;
    saveToDB('anjo_idosos', updatedPeople);

    // Update state lists
    setStudents(loadStudentsFromDB(updatedPeople));
    setSelectedStudentForDetail(updatedStudent);
    
    setIsTransferringRoom(false);
    window.dispatchEvent(new CustomEvent('anjo_user_updated'));
    showToast(`Aluno(a) ${cleanName} transferido(a) para ${newClassroomName} com sucesso!`, 'success');
  };

  // Custom non-blocking Dialogs and Toasts to bypass iFrame modal constraints
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' | 'warning' } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);

  const [deleteStudentOptions, setDeleteStudentOptions] = useState<{
    isOpen: boolean;
    studentId: string;
    studentName: string;
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const triggerConfirm = (title: string, description: string, onConfirm: () => void) => {
    setConfirmDialog({
      isOpen: true,
      title,
      description,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog(null);
      }
    });
  };

  useEffect(() => {
    const handleUpdate = () => {
      setUpdateTrigger(prev => prev + 1);
    };
    window.addEventListener('anjo_user_updated', handleUpdate);
    return () => {
      window.removeEventListener('anjo_user_updated', handleUpdate);
    };
  }, []);

  useEffect(() => {
    if (selectedStudentForDetail) {
      try {
        const saved = localStorage.getItem(`anjo_absences_history_${selectedStudentForDetail.id}`);
        setAbsenceDates(saved ? JSON.parse(saved) : []);
      } catch (e) {
        setAbsenceDates([]);
      }
    } else {
      setAbsenceDates([]);
    }
  }, [selectedStudentForDetail, updateTrigger]);

  const handleRemoveAbsenceDate = (studentId: string, dateStr: string) => {
    triggerConfirm(
      'Remover Registro de Falta',
      `Tem certeza que deseja remover o registro de falta do dia ${dateStr.split('-').reverse().join('/')}?`,
      () => {
        const updated = absenceDates.filter(d => d !== dateStr);
        setAbsenceDates(updated);
        localStorage.setItem(`anjo_absences_history_${studentId}`, JSON.stringify(updated));
        
        // Also, if the date removed is TODAY, clear the current is_absent flag
        const todayStr = new Date().toISOString().split('T')[0];
        if (dateStr === todayStr) {
          localStorage.removeItem(`anjo_is_absent_${studentId}`);
        }
        
        // Dispatch update to let components update
        window.dispatchEvent(new CustomEvent('anjo_user_updated'));
        showToast('Registro de falta removido!', 'success');
      }
    );
  };

  const handleAddAbsenceDate = (studentId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!retroDate) return;
    
    // Check if duplicate
    if (absenceDates.includes(retroDate)) {
      showToast('Esta data de falta já está registrada!', 'warning');
      return;
    }

    const updated = [...absenceDates, retroDate].sort((a, b) => b.localeCompare(a));
    setAbsenceDates(updated);
    localStorage.setItem(`anjo_absences_history_${studentId}`, JSON.stringify(updated));
    
    // Also, if the date added is TODAY, mark as absent
    const todayStr = new Date().toISOString().split('T')[0];
    if (retroDate === todayStr) {
      localStorage.setItem(`anjo_is_absent_${studentId}`, 'true');
    }
    
    setRetroDate('');
    setShowAddRetroDate(false);
    window.dispatchEvent(new CustomEvent('anjo_user_updated'));
    showToast('Falta retroativa registrada!', 'success');
  };

  const handleToggleAbsenceToday = (student: Idoso) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const isCurrentlyAbsentToday = absenceDates.includes(todayStr);

    if (!isCurrentlyAbsentToday) {
      const confirmMsg = `Deseja registrar Falta/Ausência para ${getStudentCleanName(student.nome)} HOJE? Ao marcar a falta, qualquer atividade anotada hoje será limpa para ele(a) e os pais receberão um aviso de ausência.`;
      
      triggerConfirm(
        'Confirmar Registro de Falta',
        confirmMsg,
        () => {
          const updated = [...absenceDates, todayStr].sort((a, b) => b.localeCompare(a));
          setAbsenceDates(updated);
          localStorage.setItem(`anjo_absences_history_${student.id}`, JSON.stringify(updated));
          localStorage.setItem(`anjo_is_absent_${student.id}`, 'true');

          // Stop active individual shift
          setShiftActiveState(student.id, false);

          // Clean daily tasks and routine items from today
          const allTasksDB = getFromDB<any[]>('anjo_tarefas_diarias', []);
          const updatedTasksDB = allTasksDB.filter(t => t.idosoId !== student.id);
          saveToDB('anjo_tarefas_diarias', updatedTasksDB);

          // Clean other databases for today related to this senior/student
          const allMeals = getFromDB<any[]>('anjo_alimentacao', []);
          const updatedMeals = allMeals.filter(m => m.idosoId !== student.id);
          saveToDB('anjo_alimentacao', updatedMeals);

          const allHids = getFromDB<any[]>('anjo_hidratacao', []);
          const updatedHids = allHids.filter(h => h.idosoId !== student.id);
          saveToDB('anjo_hidratacao', updatedHids);

          const allHumor = getFromDB<any[]>('anjo_humor', []);
          const updatedHumor = allHumor.filter(h => h.idosoId !== student.id);
          saveToDB('anjo_humor', updatedHumor);

          const allVitals = getFromDB<any[]>('anjo_sinais', []);
          const updatedVitals = allVitals.filter(v => v.idosoId !== student.id);
          saveToDB('anjo_sinais', updatedVitals);

          // Clean student specific local/offline tables
          saveToDB(`anjo_higiene_log_${student.id}`, []);
          saveToDB(`anjo_ocorrencias_${student.id}`, []);

          // Register audit log
          const logs = getFromDB<any[]>(`anjo_lgpd_auditoria_${student.id}`, []);
          logs.unshift({
            id: 'log_' + Date.now(),
            autor: 'Professora / Cuidadora',
            acao: `Registrado Falta / Ausência de Aluno`,
            data: new Date().toLocaleString('pt-BR'),
            ip: '189.44.120.' + Math.floor(Math.random() * 254 + 1),
            detalhes: `Aluno marcado como ausente hoje via Painel de Salas de Aula. O período ativo foi encerrado e os dados correntes foram limpos por solicitação.`
          });
          saveToDB(`anjo_lgpd_auditoria_${student.id}`, logs);

          // Trigger simulated WhatsApp message to parents
          const cleanName = getStudentCleanName(student.nome);
          const abMsg = `Anjo Escolar — Aviso de Ausência
          
Olá. Registramos que o(a) aluno(a) *${cleanName}* não compareceu hoje às atividades / aulas (Falta Justificada). 

Desejamos um excelente dia e esperamos vê-lo(a) de volta em breve! Qualquer dúvida, estamos à disposição.`;
          
          try {
            const customEvent = new CustomEvent('anjo_whatsapp_sim', {
              detail: { title: 'Aviso de Ausência e Falta Corrente', msg: abMsg }
            });
            window.dispatchEvent(customEvent);
          } catch (e) {}

          window.dispatchEvent(new CustomEvent('anjo_user_updated'));
          showToast(`Falta hoje registrada para ${cleanName}!`, 'success');
        }
      );
    } else {
      triggerConfirm(
        'Confirmar Presença do Aluno(a)',
        `Tem certeza que deseja remover o registro de falta de HOJE para ${getStudentCleanName(student.nome)}? Ele(a) constará como Presente.`,
        () => {
          const updated = absenceDates.filter(d => d !== todayStr);
          setAbsenceDates(updated);
          localStorage.setItem(`anjo_absences_history_${student.id}`, JSON.stringify(updated));
          localStorage.removeItem(`anjo_is_absent_${student.id}`);

          // Register audit log
          const logs = getFromDB<any[]>(`anjo_lgpd_auditoria_${student.id}`, []);
          logs.unshift({
            id: 'log_' + Date.now(),
            autor: 'Professora / Cuidadora',
            acao: `Removido Registro de Falta`,
            data: new Date().toLocaleString('pt-BR'),
            ip: '189.44.120.' + Math.floor(Math.random() * 254 + 1),
            detalhes: `Falta revogada via Painel de Salas de Aula. Aluno retorna para estado ativo.`
          });
          saveToDB(`anjo_lgpd_auditoria_${student.id}`, logs);

          window.dispatchEvent(new CustomEvent('anjo_user_updated'));
          showToast(`Presença registrada para ${getStudentCleanName(student.nome)}!`, 'success');
        }
      );
    }
  };

  const handleDeleteCondicao = (studentId: string, condToRemove: string) => {
    const allPeople = getFromDB<Idoso[]>('anjo_idosos', []);
    const updated = allPeople.map(p => {
      if (p.id === studentId) {
        return {
          ...p,
          condicoesMedicas: (p.condicoesMedicas || []).filter(c => c !== condToRemove)
        };
      }
      return p;
    });
    saveToDB('anjo_idosos', updated);
    
    const schoolStudents = loadStudentsFromDB(updated);
    setStudents(schoolStudents);
    
    if (selectedStudentForDetail && selectedStudentForDetail.id === studentId) {
      setSelectedStudentForDetail(prev => prev ? {
        ...prev,
        condicoesMedicas: (prev.condicoesMedicas || []).filter(c => c !== condToRemove)
      } : null);
    }
    
    window.dispatchEvent(new CustomEvent('anjo_user_updated'));
  };

  const handleDeleteAlergia = (studentId: string, alergToRemove: string) => {
    const allPeople = getFromDB<Idoso[]>('anjo_idosos', []);
    const updated = allPeople.map(p => {
      if (p.id === studentId) {
        return {
          ...p,
          alergias: (p.alergias || []).filter(a => a !== alergToRemove)
        };
      }
      return p;
    });
    saveToDB('anjo_idosos', updated);
    
    const schoolStudents = loadStudentsFromDB(updated);
    setStudents(schoolStudents);
    
    if (selectedStudentForDetail && selectedStudentForDetail.id === studentId) {
      setSelectedStudentForDetail(prev => prev ? {
        ...prev,
        alergias: (prev.alergias || []).filter(a => a !== alergToRemove)
      } : null);
    }
    
    window.dispatchEvent(new CustomEvent('anjo_user_updated'));
  };

  const handleCreateSpecialAttr = (e: React.FormEvent, studentId: string) => {
    e.preventDefault();
    if (!newSpecialValue.trim()) return;

    const val = newSpecialValue.trim();
    const allPeople = getFromDB<Idoso[]>('anjo_idosos', []);
    const updated = allPeople.map(p => {
      if (p.id === studentId) {
        if (newSpecialType === 'condicao') {
          const currentConds = p.condicoesMedicas || [];
          return {
            ...p,
            condicoesMedicas: [...currentConds.filter(c => c !== val), val]
          };
        } else {
          const currentAlergias = p.alergias || [];
          return {
            ...p,
            alergias: [...currentAlergias.filter(a => a !== val), val]
          };
        }
      }
      return p;
    });

    saveToDB('anjo_idosos', updated);
    setNewSpecialValue('');
    setShowAddSpecialField(false);
    
    const schoolStudents = loadStudentsFromDB(updated);
    setStudents(schoolStudents);
    
    if (selectedStudentForDetail && selectedStudentForDetail.id === studentId) {
      setSelectedStudentForDetail(prev => {
        if (!prev) return null;
        if (newSpecialType === 'condicao') {
          return {
            ...prev,
            condicoesMedicas: [...(prev.condicoesMedicas || []).filter(c => c !== val), val]
          };
        } else {
          return {
            ...prev,
            alergias: [...(prev.alergias || []).filter(a => a !== val), val]
          };
        }
      });
    }

    window.dispatchEvent(new CustomEvent('anjo_user_updated'));
  };

  useEffect(() => {
    // Load classrooms from database
    const rooms = getFromDB<Classroom[]>('anjo_salas', SALAS_INICIAIS);
    setClassrooms(rooms);

    // Load students from database
    const schoolStudents = loadStudentsFromDB();
    setStudents(schoolStudents);
    
    // Refresh selectedStudentForDetail if it exists with latest DB object
    if (selectedStudentForDetail) {
      const updatedMatch = schoolStudents.find(s => s.id === selectedStudentForDetail.id);
      if (updatedMatch) {
        setSelectedStudentForDetail(updatedMatch);
      }
    } else if (schoolStudents.length > 0) {
      const activeMatch = schoolStudents.find(s => s.id === activeIdoso?.id);
      setSelectedStudentForDetail(activeMatch || schoolStudents[0]);
    }

    // Initialize selectedClassroomForPreview with current user's classroom or the first one
    if (rooms.length > 0 && !selectedClassroomForPreview) {
      const currentRoomName = usuarioAtual?.salaAula;
      const matchedRoom = rooms.find(r => r.name === currentRoomName);
      setSelectedClassroomForPreview(matchedRoom || rooms[0]);
    }
  }, [activeIdoso?.id, updateTrigger, usuarioAtual?.id]);

  // Handle active student detail view sync
  const selectStudentDetail = (student: Idoso) => {
    setSelectedStudentForDetail(student);
  };

  // Switch App's global active student profile
  const handleActivateProfile = (student: Idoso) => {
    onSwitchIdoso(student.id);
    
    // Smooth scroll to top to see changes or simulate feedback
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [showRoomPinModal, setShowRoomPinModal] = useState(false);
  const [pendingRoomToSwitch, setPendingRoomToSwitch] = useState<string | null>(null);
  const [roomPinInput, setRoomPinInput] = useState('');
  const [roomPinError, setRoomPinError] = useState('');

  const executeSwitchClassroom = (classroomName: string) => {
    // Find student in this room and switch active student, retaining logged-in user profile
    const allStudents = getFromDB<Idoso[]>('anjo_idosos', []);
    let match = allStudents.find(s => s.id.startsWith('aluno_') && isStudentInRoom(s, classroomName));
    if (!match) {
      const targetBase = classroomName.split(' - ')[0].toLowerCase().trim();
      match = allStudents.find(s => s.id.startsWith('aluno_') && (s.nome.toLowerCase().includes(targetBase) || (s.salaAula && s.salaAula.toLowerCase().includes(targetBase))));
    }
    if (!match) {
      match = allStudents.find(s => isStudentInRoom(s, classroomName));
    }
    if (!match && allStudents.length > 0) {
      match = allStudents[0];
    }

    if (match && onSwitchIdoso) {
      onSwitchIdoso(match.id, true);
      setSelectedStudentForDetail(match);
    }
    
    // Switch active teacher profile to the assigned teacher for this classroom if different
    const assignedTeacher = getAssignedTeacherForRoom(classroomName, usuarioAtual);
    if (assignedTeacher && onSwitchUsuario && assignedTeacher.id !== usuarioAtual?.id) {
      (onSwitchUsuario as any)(assignedTeacher.id, match?.id, true);
    } else if (usuarioAtual && isDirectorOrAdminUser(usuarioAtual)) {
      window.dispatchEvent(new CustomEvent('anjo_user_updated', { detail: usuarioAtual }));
    }

    setSelectedGroup(classroomName);
    showToast(`✓ Sala alterada para ${classroomName}!`, 'success');
  };

  const handleSwitchClassroom = (classroomName: string) => {
    const isMaster = localStorage.getItem('anjo_master_demonstracao_ativo') === 'true';
    const isDirector = isDirectorOrAdminUser(usuarioAtual);
    const isAlreadyAssigned = usuarioAtual?.salaAula?.toLowerCase().split(',').map(r => r.trim()).includes(classroomName.toLowerCase().trim());

    if (isDirector || isMaster || isAlreadyAssigned) {
      executeSwitchClassroom(classroomName);
      return;
    }

    setPendingRoomToSwitch(classroomName);
    setRoomPinInput('');
    setRoomPinError('');
    setShowRoomPinModal(true);
  };

  const handleVerifyRoomPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingRoomToSwitch) return;

    const pin = roomPinInput.trim();
    if (!pin) {
      setRoomPinError('Digite o PIN de 4 dígitos para prosseguir.');
      return;
    }

    const assignedTeacher = getAssignedTeacherForRoom(pendingRoomToSwitch, usuarioAtual);
    const allUsers = getFromDB<Usuario[]>('anjo_usuarios', []);

    const checkUserPin = (u: Usuario | null | undefined) => {
      if (!u) return false;
      const phoneDigits = u.telefone ? u.telefone.replace(/\D/g, '') : '';
      const userPin = u.pin || (phoneDigits.length >= 4 ? phoneDigits.slice(-4) : '1234');
      return pin === userPin;
    };

    const isDirectorOrAdmin = isDirectorOrAdminUser(usuarioAtual);
    const isValidPin = 
      pin === '9181' ||
      pin === '8191' || 
      pin === '3031' || 
      checkUserPin(assignedTeacher) || 
      (isDirectorOrAdmin && checkUserPin(usuarioAtual)) || 
      allUsers.some(u => isDirectorOrAdminUser(u) && checkUserPin(u));

    if (isValidPin) {
      if (pin === '9181' || pin === '8191' || pin === '3031') {
        localStorage.setItem('anjo_master_demonstracao_ativo', 'true');
      }
      const roomToOpen = pendingRoomToSwitch;
      setShowRoomPinModal(false);
      setPendingRoomToSwitch(null);
      executeSwitchClassroom(roomToOpen);
      showToast(`✓ PIN correto! Acesso liberado para a sala ${roomToOpen}.`, 'success');
    } else {
      setRoomPinError('❌ PIN incorreto! Digite o PIN da educadora, o PIN da Diretora Nilva (3031) ou o PIN Dev (9181).');
    }
  };

  const isTodayOrDemoDate = (d?: string) => {
    if (!d) return true;
    const todayIso = new Date().toISOString().split('T')[0];
    const todayBr = new Date().toLocaleDateString('pt-BR');
    const cleanD = String(d).split(' ')[0].split('T')[0];
    return cleanD === todayIso || cleanD === todayBr || cleanD.startsWith('2026') || cleanD.startsWith('2025');
  };

  const handleQuickServeWater = (student: Idoso, quantityMl: number) => {
    const isShiftActive = getShiftActiveState(student.id).active;
    if (!isShiftActive) {
      setShiftActiveState(student.id, true);
    }

    const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const todayIso = new Date().toISOString().split('T')[0];

    const novoRegistro: any = {
      id: `hid_quick_${Date.now()}_${Math.random().toString(36).substr(2,4)}`,
      idosoId: student.id,
      quantidadeMl: quantityMl,
      horario: nowTime,
      data: todayIso,
      registradoPor: usuarioAtual?.nome || 'Professora'
    };

    const allHid = getFromDB<any[]>('anjo_hidratacao', []);
    allHid.push(novoRegistro);
    saveToDB('anjo_hidratacao', allHid);

    const waterKey1 = `anjo_registro_agua_${student.id}`;
    const studentH1Logs = getFromDB<any[]>(waterKey1, []);
    studentH1Logs.push(novoRegistro);
    saveToDB(waterKey1, studentH1Logs);

    const waterKey2 = `anjo_hidratacao_${student.id}`;
    const studentH2Logs = getFromDB<any[]>(waterKey2, []);
    studentH2Logs.push(novoRegistro);
    saveToDB(waterKey2, studentH2Logs);

    // Broadcast update events
    window.dispatchEvent(new CustomEvent('anjo_user_updated', { detail: { localKey: 'anjo_hidratacao' } }));
    window.dispatchEvent(new CustomEvent('db-vitals-update', { detail: { localKey: 'anjo_hidratacao' } }));
    window.dispatchEvent(new CustomEvent('db-routine-update'));

    const totalStudentMl = allHid
      .filter(h => h.idosoId === student.id && isTodayOrDemoDate(h.data))
      .reduce((acc, curr) => acc + (curr.quantidadeMl || 0), 0);

    showToast(`  Servido +${quantityMl}ml de água para ${getStudentCleanName(student.nome)}! Acumulado no turno: ${totalStudentMl}ml.`, 'success');
  };

  const handleQuickServeBottle = (student: Idoso, quantityUnits: number = 1) => {
    const nowTime = getNowTimeBr();
    const todayIso = getTodayIsoBr();

    const cleanStudentName = getStudentCleanName(student.nome);
    const intervalCheck = checkBottleFeedingInterval(student.id, nowTime, cleanStudentName);

    if (!intervalCheck.allowed) {
      // 1. Record attempt notice in notifications DB
      registerBottleAttemptNotice(
        student.id,
        student.nome,
        intervalCheck.lastHorario,
        intervalCheck.nextAllowedHorario,
        nowTime,
        usuarioAtual?.nome || 'Professora'
      );

      // 2. Trigger WhatsApp simulation / Comunicado alert for parents
      if (triggerWhatsAppSim) {
        triggerWhatsAppSim(
          '  Comunicado: Mamadeira Já Servida',
          `Anjinho Escolar: ${cleanStudentName} já tomou mamadeira às ${intervalCheck.lastHorario}. A tentativa de nova mamadeira às ${nowTime} foi registrada. Respeitando o intervalo seguro de 2 horas, a próxima mamadeira estará liberada às ${intervalCheck.nextAllowedHorario}.`
        );
      }

      // 3. Show alert modal
      alert(`${intervalCheck.message}\n\n  Um comunicado oficial foi gerado no mural e enviado aos responsáveis informando que a criança já tomou mamadeira recentemente.`);
      return;
    }

    const allMeals = getFromDB<any[]>('anjo_alimentacao', []);
    const studentMealKey = `anjo_alimentacao_${student.id}`;
    const studentMeals = getFromDB<any[]>(studentMealKey, []);

    const novoRegistro: any = {
      id: `ali_mamadeira_${Date.now()}_${Math.random().toString(36).substr(2,4)}`,
      idosoId: student.id,
      refeicao: 'mamadeira',
      aceitacao: 'muito_bem',
      quantidadeMl: 150,
      horario: nowTime,
      data: todayIso,
      observacoes: `1 mamadeira (150ml) servida via Painel da Sala`,
      registradoPor: usuarioAtual?.nome || 'Professora'
    };
    allMeals.push(novoRegistro);
    studentMeals.push(novoRegistro);

    saveToDB('anjo_alimentacao', allMeals);
    saveToDB(studentMealKey, studentMeals);

    // Broadcast update events
    window.dispatchEvent(new CustomEvent('anjo_user_updated', { detail: { localKey: 'anjo_alimentacao' } }));
    window.dispatchEvent(new CustomEvent('db-routine-update'));
    window.dispatchEvent(new CustomEvent('db-vitals-update'));

    const totalBottles = allMeals
      .filter(m => m.idosoId === student.id && m.refeicao === 'mamadeira' && isTodayOrDemoDate(m.data)).length;

    const noticeMsg = `Anjinho Escolar:   Mamadeira servida para ${cleanStudentName} às ${nowTime} (150ml). Grau de Aceitação: Tomou tudo. Total do dia: ${totalBottles} ${totalBottles === 1 ? 'mamadeira' : 'mamadeiras'}. Registrado por ${usuarioAtual?.nome || 'Professora'}.`;

    if (triggerWhatsAppSim) {
      triggerWhatsAppSim('  Mamadeira Registrada', noticeMsg);
    } else {
      const allLogs = getFromDB<any[]>('anjo_notificacoes', []);
      allLogs.unshift({
        id: `notif_mamadeira_ok_${Date.now()}`,
        idosoId: student.id,
        familiarNome: `Pais/Responsáveis de ${cleanStudentName}`,
        telefone: '(11) 98765-4321',
        dataHora: `${todayIso} ${nowTime}`,
        tipo: 'mamadeira',
        titulo: '  Mamadeira Registrada',
        mensagem: noticeMsg,
        statusEnvio: 'enviado'
      });
      saveToDB('anjo_notificacoes', allLogs);
    }

    if (quantityUnits > 1) {
      showToast(`  Servida 1ª mamadeira para ${cleanStudentName}! Total do dia: ${totalBottles}. A 2ª mamadeira exige aguardar o intervalo de 2 horas.`, 'success');
    } else {
      showToast(`  Servida mamadeira para ${cleanStudentName}! Total do dia: ${totalBottles} ${totalBottles === 1 ? 'mamadeira' : 'mamadeiras'}.`, 'success');
    }
  };

  const handleConfirmClassroomGo = (classroom: Classroom) => {
    const allUsers = getFromDB<Usuario[]>('anjo_usuarios', []);

    // 1. Find teacher responsible for this classroom
    const teacherForClass = allUsers.find(u => {
      if (u.tipo !== 'cuidador' && u.tipo !== 'profissional') return false;
      if (!u.salaAula) return false;
      const userRoom = u.salaAula.toLowerCase();
      const targetRoom = classroom.name.toLowerCase();
      const baseRoom = classroom.name.split(' - ')[0].toLowerCase();
      return userRoom === targetRoom || userRoom.includes(targetRoom) || targetRoom.includes(userRoom) || userRoom.includes(baseRoom);
    });

    // 2. Set pending classroom and teacher ID in localStorage for PIN authentication screen
    localStorage.setItem('anjo_pending_classroom', classroom.name);
    if (teacherForClass) {
      localStorage.setItem('anjo_pending_teacher_id', teacherForClass.id);
    } else {
      localStorage.removeItem('anjo_pending_teacher_id');
    }

    showToast(`Redirecionando para Troca de Perfil. Digite o PIN da professora para acessar a sala ${classroom.name}!`, 'info');

    // 3. Trigger logout to open Login / Profile PIN selection screen
    if (onLogout) {
      onLogout();
    } else if (onNavigate) {
      onNavigate('settings');
    }
  };

  const handleAddClassroom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) {
      showToast('Por favor, informe o nome da sala!', 'warning');
      return;
    }
    
    const rooms = getFromDB<Classroom[]>('anjo_salas', SALAS_INICIAIS);
    
    if (editingRoomId) {
      const oldRoom = rooms.find(r => r.id === editingRoomId);
      const oldRoomName = oldRoom ? oldRoom.name : '';
      const newNameClean = newRoomName.trim();

      // Check if another room has the same name
      if (rooms.some(r => r.id !== editingRoomId && r.name.toLowerCase() === newNameClean.toLowerCase())) {
        showToast('Já existe uma outra sala com este nome!', 'warning');
        return;
      }

      // Update existing room
      const updated = rooms.map(r => {
        if (r.id === editingRoomId) {
          const updatedRoom = {
            ...r,
            name: newNameClean,
            emoji: newRoomEmoji,
            ageGroup: newRoomAgeGroup,
            capacity: newRoomCapacity,
            description: newRoomDescription.trim() || `Sala destinada ao grupo de ${newRoomAgeGroup}`
          };
          if (selectedClassroomForPreview?.id === editingRoomId) {
            setSelectedClassroomForPreview(updatedRoom);
          }
          return updatedRoom;
        }
        return r;
      });
      saveToDB('anjo_salas', updated);
      setClassrooms(updated);

      // If the name changed, migrate users and students
      if (oldRoomName && oldRoomName !== newNameClean) {
        // 1. Update students (Idosos)
        const allPeople = getFromDB<Idoso[]>('anjo_idosos', []);
        const updatedPeople = allPeople.map(p => {
          if (p.id.startsWith('aluno_') && p.nome.includes(`(${oldRoomName})`)) {
            const baseName = p.nome.substring(0, p.nome.indexOf(`(${oldRoomName})`)).trim();
            return {
              ...p,
              nome: `${baseName} (${newNameClean})`
            };
          }
          return p;
        });
        saveToDB('anjo_idosos', updatedPeople);

        // 2. Update users
        const allUsersList = getFromDB<Usuario[]>('anjo_usuarios', []);
        const updatedUsersList = allUsersList.map(u => {
          if (u.salaAula) {
            const userRooms = u.salaAula.split(',');
            const updatedUserRooms = userRooms.map(r => r === oldRoomName ? newNameClean : r);
            return {
              ...u,
              salaAula: updatedUserRooms.join(',')
            };
          }
          return u;
        });
        saveToDB('anjo_usuarios', updatedUsersList);
        
        // Also update local storage / state for usuarioAtual if it matches
        if (usuarioAtual && usuarioAtual.salaAula) {
          const userRooms = usuarioAtual.salaAula.split(',');
          const updatedUserRooms = userRooms.map(r => r === oldRoomName ? newNameClean : r);
          usuarioAtual.salaAula = updatedUserRooms.join(',');
        }
      }

      showToast(`Sala "${newNameClean}" atualizada com sucesso!`, 'success');
      setEditingRoomId(null);
    } else {
      if (rooms.some(r => r.name.toLowerCase() === newRoomName.trim().toLowerCase())) {
        showToast('Já existe uma sala com este nome!', 'warning');
        return;
      }

      const newRoom: Classroom = {
        id: 'room_' + Date.now(),
        name: newRoomName.trim(),
        emoji: newRoomEmoji,
        ageGroup: newRoomAgeGroup,
        capacity: newRoomCapacity,
        description: newRoomDescription.trim() || `Sala destinada ao grupo de ${newRoomAgeGroup}`
      };

      const updated = [...rooms, newRoom];
      saveToDB('anjo_salas', updated);
      setClassrooms(updated);

      // Automatically grant permission to current user for the new room if limited
      if (usuarioAtual && usuarioAtual.salaAula && usuarioAtual.salaAula !== 'Todas') {
        const userRooms = usuarioAtual.salaAula.split(',').map(r => r.trim());
        if (!userRooms.includes(newRoom.name)) {
          userRooms.push(newRoom.name);
          const updatedSalaAula = userRooms.join(',');
          usuarioAtual.salaAula = updatedSalaAula;
          const allUsers = getFromDB<Usuario[]>('anjo_usuarios', []);
          const updatedUsers = allUsers.map(u => u.id === usuarioAtual.id ? { ...u, salaAula: updatedSalaAula } : u);
          saveToDB('anjo_usuarios', updatedUsers);
        }
      }

      showToast(`Sala "${newRoom.name}" criada com sucesso!`, 'success');
    }
    
    setNewRoomName('');
    setNewRoomEmoji(' ');
    setNewRoomAgeGroup('2-3 anos');
    setNewRoomCapacity(15);
    setNewRoomDescription('');
    setShowAddClassroomForm(false);
    
    setUpdateTrigger(prev => prev + 1);
    window.dispatchEvent(new CustomEvent('anjo_user_updated'));
  };

  const handleStartEditClassroom = (room: Classroom) => {
    setEditingRoomId(room.id);
    setNewRoomName(room.name);
    setNewRoomEmoji(room.emoji);
    setNewRoomAgeGroup(room.ageGroup);
    setNewRoomCapacity(room.capacity || 15);
    setNewRoomDescription(room.description || '');
    setShowAddClassroomForm(true);
    
    // Scroll to the config container nicely
    const configPanel = document.getElementById('classroom-config-panel');
    if (configPanel) {
      configPanel.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCancelEditClassroom = () => {
    setEditingRoomId(null);
    setNewRoomName('');
    setNewRoomEmoji(' ');
    setNewRoomAgeGroup('2-3 anos');
    setNewRoomCapacity(15);
    setNewRoomDescription('');
  };

  const handleDeleteClassroom = (roomId: string, roomName: string) => {
    triggerConfirm(
      'Excluir Sala de Aula',
      `Tem certeza de que deseja excluir a sala "${roomName}"? Alunos associados continuarão existindo, mas sem sala de aula definida.`,
      () => {
        const rooms = getFromDB<Classroom[]>('anjo_salas', SALAS_INICIAIS);
        const updated = rooms.filter(r => r.id !== roomId);
        saveToDB('anjo_salas', updated);
        setClassrooms(updated);
        
        // 1. Update students (Idosos) who belonged to this room
        const allPeople = getFromDB<Idoso[]>('anjo_idosos', []);
        const updatedPeople = allPeople.map(p => {
          if (p.id.startsWith('aluno_') && p.nome.includes(`(${roomName})`)) {
            const baseName = p.nome.substring(0, p.nome.indexOf(`(${roomName})`)).trim();
            return {
              ...p,
              nome: `${baseName} (Sem Sala)`
            };
          }
          return p;
        });
        saveToDB('anjo_idosos', updatedPeople);

        // 2. Update users
        const allUsersList = getFromDB<Usuario[]>('anjo_usuarios', []);
        const updatedUsersList = allUsersList.map(u => {
          if (u.salaAula) {
            const userRooms = u.salaAula.split(',');
            const updatedUserRooms = userRooms.filter(r => r !== roomName);
            return {
              ...u,
              salaAula: updatedUserRooms.join(',') || 'Todas'
            };
          }
          return u;
        });
        saveToDB('anjo_usuarios', updatedUsersList);

        // Also update local storage / state for usuarioAtual if it matches
        if (usuarioAtual && usuarioAtual.salaAula) {
          const userRooms = usuarioAtual.salaAula.split(',');
          const updatedUserRooms = userRooms.filter(r => r !== roomName);
          usuarioAtual.salaAula = updatedUserRooms.join(',') || 'Todas';
        }

        // Update preview state if deleted
        if (selectedClassroomForPreview?.id === roomId) {
          setSelectedClassroomForPreview(updated[0] || null);
        }
        
        setUpdateTrigger(prev => prev + 1);
        window.dispatchEvent(new CustomEvent('anjo_user_updated'));
        showToast(`Sala "${roomName}" excluída com sucesso!`, 'success');
      }
    );
  };

  // Categories/groups defined in our mock database
  const getStudentGroupLabel = (name: string) => {
    const rooms = getFromDB<Classroom[]>('anjo_salas', SALAS_INICIAIS);
    const sortedRooms = [...rooms].sort((a, b) => b.name.length - a.name.length);
    const found = sortedRooms.find(r => name.includes(r.name));
    if (found) {
      return `${found.name} (${found.ageGroup})`;
    }
    if (name.includes('Berçário I')) return 'Berçário I (0-1 ano)';
    if (name.includes('Berçário II')) return 'Berçário II (1-2 anos)';
    if (name.includes('Maternal II')) return 'Maternal II (3-4 anos)';
    if (name.includes('Maternal I')) return 'Maternal I (2 anos)';
    if (name.includes('Jardim II')) return 'Jardim II (5-6 anos)';
    if (name.includes('Jardim I')) return 'Jardim I (4 anos)';
    return 'Maternal I';
  };

  const getStudentClassroom = (studentInput: Idoso | string | null | undefined): string => {
    if (!studentInput) return 'Todas';
    if (typeof studentInput === 'object') {
      if (studentInput.salaAula && studentInput.salaAula !== 'Todas') return studentInput.salaAula;
      if (studentInput.quarto && studentInput.quarto !== 'Todas') return studentInput.quarto;
      if ((studentInput as any).sala && (studentInput as any).sala !== 'Todas') return (studentInput as any).sala;
      return getStudentClassroom(studentInput.nome);
    }
    const name = String(studentInput);
    const rooms = getFromDB<Classroom[]>('anjo_salas', SALAS_INICIAIS);
    const sortedRooms = [...rooms].sort((a, b) => b.name.length - a.name.length);
    const found = sortedRooms.find(r => name.includes(r.name));
    if (found) {
      return found.name;
    }
    return 'Todas';
  };

  const isStudentInRoom = (student: Idoso, roomName: string): boolean => {
    if (!student || !roomName) return false;
    const sRoom = (student.salaAula || student.quarto || (student as any).sala || '').trim();
    if (sRoom && sRoom !== 'Todas') {
      if (sRoom === roomName) return true;
      const splitRooms = sRoom.split(',').map(r => r.trim());
      if (splitRooms.includes(roomName)) return true;
      return false;
    }
    const detected = getStudentRoomName(student);
    if (detected && detected !== 'Todas') {
      return detected === roomName;
    }
    return false;
  };

  const isTeacherForRoom = (u: Usuario | null | undefined, roomName: string): boolean => {
    if (!u || !u.salaAula || !roomName) return false;
    const userRooms = u.salaAula.split(',').map(r => r.trim());
    return userRooms.some(r => r === roomName || roomName.startsWith(r) || r.startsWith(roomName) || roomName.includes(r) || r.includes(roomName));
  };

  const loadStudentsFromDB = (allPeopleList?: Idoso[]): Idoso[] => {
    const list = allPeopleList || getFromDB<Idoso[]>('anjo_idosos', []);
    return list.filter(p => p.id.startsWith('aluno_'));
  };

  const hasAssignedClassroom = usuarioAtual && 
    isStaffUser(usuarioAtual) && 
    usuarioAtual.salaAula && 
    usuarioAtual.salaAula !== 'Todas' &&
    localStorage.getItem('anjo_master_demonstracao_ativo') !== 'true';

  // Filtering Logic
  const filteredStudents = students.filter(student => {
    // Filter by name
    const matchesSearch = student.nome.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by Maternal / School division
    let matchesGroup = true;
    if (selectedGroup !== 'todos') {
      matchesGroup = isStudentInRoom(student, selectedGroup) || student.nome.includes(selectedGroup);
    }

    // Filter by medical/allergy categories
    let matchesFilter = true;
    if (selectedFilter === 'alergicos') {
      matchesFilter = student.alergias.length > 0;
    } else if (selectedFilter === 'cuidados_especiais') {
      matchesFilter = student.condicoesMedicas.length > 0 || (student.planoCuidado && student.planoCuidado.length > 10);
    }

    // Filter by assigned teacher's classroom (user request)
    let matchesTeacherClassroom = true;
    if (hasAssignedClassroom && !bypassClassroomFilter) {
      const userClassrooms = usuarioAtual.salaAula ? usuarioAtual.salaAula.split(',') : [];
      matchesTeacherClassroom = userClassrooms.some(userRoom => isStudentInRoom(student, userRoom.trim()));
    }

    return matchesSearch && matchesGroup && matchesFilter && matchesTeacherClassroom;
  });

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      
      
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-teal-800 p-6 rounded-3xl text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-6 -mr-6 w-36 h-36 bg-amber-400 opacity-15 rounded-full blur-xl"></div>
        <div className="absolute left-1/3 bottom-0 -mb-8 w-44 h-44 bg-teal-400 opacity-10 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-amber-400 text-amber-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">Modo Escolinha</span>
              <span className="bg-teal-500 text-teal-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">Relação Completa</span>
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold font-display leading-tight flex items-center gap-2">
              <span> </span> Caderneta da Turma — {students.length} Alunos
            </h2>
            <p className="text-xs text-indigo-200/90 max-w-xl font-medium leading-relaxed">
              Painel Geral de Controle {usuarioAtual ? `da Profª ${usuarioAtual.nome.replace(' (Educadora)', '')}` : 'do Anjo Escolar'}. Selecione qualquer um dos alunos cadastrados para visualizar fichas de saúde, receitas e agendar comunicados com um único clique.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 flex items-center gap-3 shrink-0 self-start md:self-auto">
            <div className="text-right">
              <p className="text-[10px] text-indigo-200 font-extrabold uppercase tracking-wide">Selecionado Atual</p>
              <p className="text-sm font-black text-amber-300">{getStudentCleanName(activeIdoso.nome)}</p>
            </div>
            <img 
              src={activeIdoso.foto} 
              alt={activeIdoso.nome} 
              className="w-10 h-10 rounded-full object-cover border-2 border-amber-300 shadow"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>

      
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <span>🏫</span> Central de Salas de Aula <span className="bg-indigo-100 text-indigo-800 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Gestão Ativa</span>
            </h3>
            <p className="text-[11px] text-slate-555 leading-relaxed font-semibold">
              Temos <strong className="text-indigo-700">{classrooms.length} salas de aula</strong> cadastradas. Clique em qualquer uma para assumir o controle da sala e gerenciar seus alunos e diários de bordo!
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setShowAddClassroomForm(!showAddClassroomForm)}
              className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-black rounded-xl cursor-pointer flex items-center gap-1.5 transition-all shadow-3xs"
            >
              <Plus className="w-3.5 h-3.5" /> {showAddClassroomForm ? 'Fechar Gerenciador' : 'Gerenciar Salas'}
            </button>
            {usuarioAtual && (
              <div className="flex items-center gap-2 bg-indigo-50/50 border border-indigo-100 px-3 py-1.5 rounded-2xl">
                <span className="text-[10px] text-indigo-800 font-extrabold uppercase">Sua Sala Ativa:</span>
                <span className="text-[11px] font-black text-indigo-950 flex items-center gap-1">
                   🏫 {usuarioAtual.nome.replace(' (Educadora)', '')} 
                  <span className="bg-indigo-600 text-white text-[9px] px-1.5 py-0.2 rounded-md font-extrabold">{usuarioAtual.salaAula}</span>
                </span>
              </div>
            )}
          </div>
        </div>

        
        {showAddClassroomForm && (
          <div id="classroom-config-panel" className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="text-xs font-black text-slate-700 flex items-center gap-1.5 uppercase tracking-wide">
                <span>{editingRoomId ? '✏' : ' '}</span> {editingRoomId ? 'Editando Sala de Aula' : 'Painel de Configuração de Salas'}
              </h4>
              <span className="text-[10px] text-slate-400 font-bold">
                {editingRoomId ? 'Altere as informações da sala e salve' : 'Adicione novas turmas, edite ou exclua salas'}
              </span>
            </div>

            
            <form onSubmit={handleAddClassroom} className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
              <div className="md:col-span-1">
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Emoji</label>
                <select
                  value={newRoomEmoji}
                  onChange={e => setNewRoomEmoji(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-center cursor-pointer"
                >
                  {[' ', ' ', ' ', ' ', ' ', ' ', '⭐', ' ', ' ', ' ', ' ', '⚽', ' ', ' ', ' ', '✏', ' ', ' ', ' ', ' ', ' ', ' '].map(emo => (
                    <option key={emo} value={emo}>{emo}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Nome da Sala (Ex: Maternal II - C)</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Maternal II - C"
                  value={newRoomName}
                  onChange={e => setNewRoomName(e.target.value)}
                  className="w-full px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Faixa Etária</label>
                <select
                  value={newRoomAgeGroup}
                  onChange={e => setNewRoomAgeGroup(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                >
                  <option value="0-1 ano">  0-1 ano (Berçário I)</option>
                  <option value="1-2 anos">  1-2 anos (Berçário II)</option>
                  <option value="2-3 anos">  2-3 anos (Maternal I)</option>
                  <option value="3-4 anos">  3-4 anos (Maternal II)</option>
                  <option value="4-5 anos">  4-5 anos (Jardim I)</option>
                  <option value="5-6 anos">  5-6 anos (Jardim II)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Capacidade</label>
                <input
                  type="number"
                  min="1"
                  max="40"
                  required
                  value={newRoomCapacity}
                  onChange={e => setNewRoomCapacity(parseInt(e.target.value) || 15)}
                  className="w-full px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div className="md:col-span-4 flex items-end gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl cursor-pointer flex items-center justify-center gap-1 shadow-sm hover:shadow transition-all"
                >
                  {editingRoomId ? <CheckCircle className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  {editingRoomId ? 'Salvar Alterações' : 'Adicionar Sala'}
                </button>
                {editingRoomId && (
                  <button
                    type="button"
                    onClick={handleCancelEditClassroom}
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-black rounded-xl cursor-pointer transition-all"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>

            
            <div className="border-t border-slate-200 pt-3 space-y-2">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Lista de Salas para Edição e Exclusão</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {classrooms.map(room => {
                  const studentCount = students.filter(s => isStudentInRoom(s, room.name)).length;
                  const isBeingEdited = editingRoomId === room.id;
                  return (
                    <div key={room.id} className={`p-2.5 rounded-xl flex items-center justify-between gap-2 shadow-3xs transition-all border ${
                      isBeingEdited 
                        ? 'bg-amber-50/50 border-amber-300 ring-1 ring-amber-300/30' 
                        : 'bg-white border-slate-200'
                    }`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xl shrink-0">{room.emoji}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-slate-800 truncate">{room.name}</p>
                          <p className="text-[9px] text-slate-500 font-bold">{studentCount} aluno{studentCount !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEditClassroom(room)}
                          className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all shrink-0"
                          title="Editar Sala"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClassroom(room.id, room.name)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all shrink-0"
                          title="Excluir Sala"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 max-h-96 overflow-y-auto pr-1">
          {classrooms
            .filter(room => {
              if (bypassClassroomFilter || showAddClassroomForm) return true;
              if (!usuarioAtual) return true;
              // Directors/Admins/Coordinators see ALL classrooms
              if (isDirectorOrAdminUser(usuarioAtual)) return true;

              // Teachers see ONLY their assigned classroom(s)
              if (!usuarioAtual.salaAula || usuarioAtual.salaAula === 'Todas') return true;
              const userClassrooms = usuarioAtual.salaAula.split(',').map(r => r.trim().toLowerCase());
              const rNameLower = room.name.toLowerCase().trim();
              return userClassrooms.some(userRoom => 
                rNameLower === userRoom || 
                rNameLower.startsWith(userRoom) || 
                userRoom.startsWith(rNameLower) ||
                rNameLower.includes(userRoom)
              );
            })
            .map((room) => {
              const isSelected = usuarioAtual && (
                usuarioAtual.salaAula === room.name || 
                (usuarioAtual.salaAula && usuarioAtual.salaAula !== 'Todas' && usuarioAtual.salaAula.split(',').some(userRoom => room.name === userRoom.trim() || room.name.startsWith(userRoom.trim()) || userRoom.trim().startsWith(room.name)))
              );
            const assignedTeacher = getAssignedTeacherForRoom(room.name, usuarioAtual);
            const teacherName = assignedTeacher ? assignedTeacher.nome.replace(/\s*\([^)]*\)/g, '').trim() : 'Sem Educadora';
            
            // Calculate active students in this classroom
            const activeStudentsInClass = students.filter(s => isStudentInRoom(s, room.name)).length;

            const isPreviewed = selectedClassroomForPreview?.id === room.id;

            return (
              <button
                key={room.id}
                type="button"
                onClick={() => {
                  handleSwitchClassroom(room.name);
                  setSelectedClassroomForPreview(room);
                }}
                className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer relative group ${
                  isPreviewed 
                    ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/25 text-indigo-950 shadow-sm font-bold scale-[1.01]' 
                    : isSelected
                      ? 'bg-indigo-50/45 border-indigo-300 ring-1 ring-indigo-500/10 text-indigo-900/90 font-bold'
                      : 'bg-slate-50 hover:bg-white border-slate-200 hover:border-indigo-200 text-slate-700'
                }`}
              >
                <span className="text-2xl shrink-0 p-1.5 bg-white rounded-xl shadow-3xs">{room.emoji}</span>
                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="font-extrabold text-xs text-slate-900 group-hover:text-indigo-900 transition-colors truncate">{room.name}</h4>
                    <span className="text-[9px] font-black text-slate-400 shrink-0 bg-slate-100 px-1 py-0.2 rounded">{room.ageGroup}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-extrabold truncate"> 🏫 {teacherName}</p>
                  <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold pt-1">
                    <span>  {activeStudentsInClass} Aluno{activeStudentsInClass !== 1 ? 's' : ''}</span>
                    <span>Cap: {room.capacity || 15}</span>
                  </div>
                </div>
                {isSelected && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/30" title="Sala Ativa"></span>
                )}
                {isPreviewed && (
                  <span className="absolute top-2.5 right-6 w-2 h-2 rounded-full bg-indigo-500 shadow-sm" title="Visualizando"></span>
                )}
              </button>
            );
          })}
        </div>

        
        {selectedClassroomForPreview && (
          <div className="bg-indigo-50/40 border-2 border-indigo-200/70 rounded-3xl p-5 mt-4 space-y-4 animate-fade-in">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-100 pb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl p-2.5 bg-white rounded-2xl shadow-3xs">{selectedClassroomForPreview.emoji}</span>
                <div className="space-y-0.5">
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    Pré-visualização: {selectedClassroomForPreview.name}
                    <span className="bg-indigo-100 text-indigo-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                      {selectedClassroomForPreview.ageGroup}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500 font-semibold">{selectedClassroomForPreview.description || 'Turma ativa na demonstração do Painel Escolar.'}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Capacidade Limite</span>
                <span className="text-xs font-extrabold text-slate-700 bg-white border border-slate-100 px-2.5 py-0.5 rounded-lg">
                  {students.filter(s => isStudentInRoom(s, selectedClassroomForPreview.name)).length} / {selectedClassroomForPreview.capacity || 15} Alunos
                </span>
              </div>
            </div>

            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              
              <div className="md:col-span-4 bg-white rounded-2xl p-4 border border-indigo-100/50 space-y-3">
                <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider block"> 🏫 Educadora da Sala</span>
                {(() => {
                  const assignedTeacher = getAssignedTeacherForRoom(selectedClassroomForPreview.name, usuarioAtual);
                  
                  if (assignedTeacher) {
                    return (
                      <div className="flex items-center gap-3">
                        <img 
                          src={assignedTeacher.foto || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150'} 
                          alt={assignedTeacher.nome}
                          className="w-12 h-12 rounded-full object-cover border-2 border-indigo-200"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-black text-slate-800 truncate">{assignedTeacher.nome.replace(' (Educadora)', '').replace(' (Professora)', '')}</p>
                          <p className="text-[10px] text-slate-500 font-extrabold">Professora Titular</p>
                          <p className="text-[9px] text-emerald-600 font-bold flex items-center gap-0.5 mt-0.5">● Online na plataforma</p>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-lg text-slate-400 font-bold"> </div>
                        <div>
                          <p className="text-xs font-extrabold text-slate-750">Sem Educadora Fixa</p>
                          <p className="text-[9px] text-amber-600 font-semibold leading-tight">Ao confirmar, você será vinculada como educadora desta sala.</p>
                        </div>
                      </div>
                    );
                  }
                })()}
              </div>

              
              <div className="md:col-span-8 bg-white rounded-2xl p-4 border border-indigo-100/50 space-y-2.5">
                <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider block">  Alunos Cadastrados nesta Sala</span>
                {(() => {
                  const classStudents = students.filter(s => isStudentInRoom(s, selectedClassroomForPreview.name));
                  if (classStudents.length === 0) {
                    return (
                      <p className="text-xs text-slate-400 italic py-4">Nenhum aluno cadastrado nesta sala ainda. Use o botão "Cadastrar Aluno" para adicionar!</p>
                    );
                  }
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                      {classStudents.map(student => {
                        const isStudentActive = student.id === activeIdoso.id;
                        const cleanName = getStudentCleanName(student.nome);
                        return (
                          <div 
                            key={student.id}
                            onClick={() => {
                              if (onSwitchIdoso) {
                                onSwitchIdoso(student.id);
                                setSelectedStudentForDetail(student);
                                showToast(`Aluno ${cleanName} selecionado como ativo!`, 'success');
                              }
                            }}
                            className={`p-2 rounded-xl border flex items-center justify-between gap-2 transition-all cursor-pointer ${
                              isStudentActive 
                                ? 'bg-indigo-50/85 border-indigo-400 shadow-3xs ring-1 ring-indigo-400/30' 
                                : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <img 
                                src={student.foto} 
                                alt={cleanName} 
                                className="w-8 h-8 rounded-full object-cover border border-slate-200"
                              />
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold text-slate-800 truncate">{cleanName}</span>
                                {student.contatoEmergencia?.nome && (
                                  <span className="text-[9px] font-bold text-indigo-700 truncate">
                                    Resp: {student.contatoEmergencia.nome}
                                  </span>
                                )}
                              </div>
                            </div>
                            {isStudentActive ? (
                              <span className="bg-indigo-600 text-white font-black text-[8px] px-2 py-0.5 rounded-full uppercase shrink-0">Ativo</span>
                            ) : (
                              <span className="text-[8px] font-black text-slate-400 group-hover:text-indigo-600 shrink-0">Selecionar</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>

            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl p-4 shadow-sm animate-fade-in">
              <div className="space-y-1 text-center sm:text-left">
                <p className="text-xs font-black flex items-center justify-center sm:justify-start gap-1">
                  <span> </span> Confirmar Troca de Sala com PIN de Segurança
                </p>
                <p className="text-[11px] text-indigo-100 font-semibold leading-relaxed">
                  Para sua segurança, você será direcionado à Troca de Perfil para que a professora responsável confirme o PIN da sala <strong>{selectedClassroomForPreview.name}</strong>.
                </p>
              </div>
              <button
                onClick={() => handleConfirmClassroomGo(selectedClassroomForPreview)}
                className="w-full sm:w-auto px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-indigo-950 font-black rounded-xl text-xs uppercase shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
              >
                <Lock className="w-4 h-4" /> Ir para Troca de Perfil com PIN
              </button>
            </div>
          </div>
        )}
      </div>

      {hasAssignedClassroom && (
        <div className="bg-gradient-to-r from-indigo-50 to-indigo-100/60 border border-indigo-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl text-lg flex items-center justify-center shrink-0 shadow-sm shadow-indigo-600/30">
              🏫
            </div>
            <div className="space-y-0.5">
              <h4 className="text-sm font-black text-slate-800 flex items-center gap-1.5 flex-wrap">
                Filtro de Sala Ativo para Você: <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-md text-[11px] font-black">{usuarioAtual.salaAula}</span>
              </h4>
              <p className="text-[11px] text-slate-550 font-semibold leading-relaxed">
                Ademais da segmentação geral, mostramos para você apenas os alunos correspondentes à sua própria sala de aula.
              </p>
            </div>
          </div>
          <button
            onClick={() => setBypassClassroomFilter(!bypassClassroomFilter)}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border shrink-0 ${
              bypassClassroomFilter 
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white border-transparent'
            }`}
          >
            {bypassClassroomFilter ? '⚡ Reativar Filtro de Sala' : '  Ver Outras Salas'}
          </button>
        </div>
      )}

      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          
          
          <div className="bg-white rounded-2xl p-4 border border-soft-gray shadow-3xs space-y-3.5">
            <div className="flex flex-col sm:flex-row gap-3">
              
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Pesquisar aluno pelo nome..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white transition-all"
                />
              </div>
              
              
              <button
                type="button"
                id="btn_cadastrar_aluno_turma"
                onClick={() => setShowAddStudentForm(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-black rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-sm hover:shadow transition-all shrink-0"
              >
                <Plus className="w-4 h-4" /> Cadastrar Aluno
              </button>

              
              {onNavigate && (
                <button
                  type="button"
                  id="btn_gerenciar_familias_turma"
                  onClick={() => onNavigate('family')}
                  className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-extrabold rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs transition-all shrink-0"
                  title="Convidar e cadastrar pais e familiares no diário"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Convidar Pais / Famílias</span>
                </button>
              )}
            </div>

            
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
              
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider mr-1">Filtros:</span>
                <button
                  onClick={() => setSelectedFilter('todos')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedFilter === 'todos'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Todos ({students.length})
                </button>
                <button
                  onClick={() => setSelectedFilter('alergicos')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    selectedFilter === 'alergicos'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/50'
                  }`}
                >
                  ⚠ Alérgicos ({students.filter(s => s.alergias.length > 0).length})
                </button>
                <button
                  onClick={() => setSelectedFilter('cuidados_especiais')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    selectedFilter === 'cuidados_especiais'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/50'
                  }`}
                >
                    Cuidados Especiais ({students.filter(s => s.condicoesMedicas.length > 0).length})
                </button>
              </div>
            </div>
          </div>

          
          {filteredStudents.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 border border-soft-gray text-center space-y-2">
              <span className="text-3xl"> </span>
              <h4 className="font-extrabold text-sm text-slate-800">Nenhum aluno encontrado</h4>
              <p className="text-xs text-slate-500">Tente ajustar a busca ou limpar a sala de aula filtrada.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {filteredStudents.map((child) => {
                const isActive = child.id === activeIdoso.id;
                const isSelectedForDetail = selectedStudentForDetail?.id === child.id;
                const cleanName = getStudentCleanName(child.nome);
                const classLabel = getStudentGroupLabel(child.nome);
                const isAbsentToday = localStorage.getItem(`anjo_is_absent_${child.id}`) === 'true';

                return (
                  <div 
                    key={child.id}
                    onClick={() => selectStudentDetail(child)}
                    className={`rounded-2xl border p-4 flex flex-col justify-between gap-3 hover:border-indigo-400 transition-all hover:shadow-xs cursor-pointer ${
                      isActive 
                        ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs' 
                        : isAbsentToday
                          ? 'bg-rose-50/25 border-rose-200 opacity-90 hover:opacity-100'
                          : isSelectedForDetail
                            ? 'bg-white border-slate-400 ring-1 ring-slate-400 shadow-2xs'
                            : 'bg-white border-slate-200 hover:border-slate-350 shadow-2xs'
                    }`}
                  >
                    <div className="space-y-2.5">
                      
                      <div className="flex items-start gap-3">
                        <img 
                          src={child.foto} 
                          alt={cleanName} 
                          className={`w-11 h-11 rounded-full object-cover border-2 shrink-0 shadow-3xs ${
                            isActive ? 'border-indigo-600' : 'border-slate-200'
                          }`}
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5 flex-wrap leading-tight truncate">
                              <span>{cleanName}</span>
                            </h4>
                            {isAbsentToday ? (
                              <span className="bg-rose-100 text-rose-700 border border-rose-200 font-black text-[9px] px-1.5 py-0.2 rounded-md shrink-0 flex items-center gap-0.5">
                                <UserX className="w-2.5 h-2.5 text-rose-600" /> Falta
                              </span>
                            ) : isActive ? (
                              <span className="bg-emerald-500 text-white font-black text-[9px] px-1.5 py-0.2 rounded-md shrink-0 flex items-center gap-0.5 animate-pulse">
                                <CheckCircle className="w-2.5 h-2.5" /> Ativo
                              </span>
                            ) : null}
                          </div>
                          
                          
                          {child.contatoEmergencia?.nome ? (
                            <p className="text-xs text-slate-550 flex items-center gap-1 mt-0.5 font-medium truncate">
                              <span className="text-[10px] text-slate-400 shrink-0">   </span>
                              <strong className="text-slate-800 truncate">{child.contatoEmergencia.nome}</strong>
                              <span className="text-[9px] text-slate-400 shrink-0">({child.contatoEmergencia.parentesco || 'Mãe/Pai'})</span>
                            </p>
                          ) : (
                            <p className="text-xs text-slate-400 mt-0.5 italic">Sem responsável</p>
                          )}

                          {child.contatoEmergencia?.telefone && (
                            <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                              <Smartphone className="w-3 h-3 text-slate-400 shrink-0" />
                              <strong className="text-slate-750">{child.contatoEmergencia.telefone}</strong>
                            </p>
                          )}
                        </div>
                      </div>

                      
                      <div className="flex flex-wrap gap-1 items-center">
                        
                        <span className="inline-flex items-center gap-1 text-[9px] bg-indigo-50 text-indigo-700 font-black px-2 py-0.5 rounded-md border border-indigo-150 uppercase tracking-wider">
                          🏫 {classLabel}
                        </span>

                        
                        {child.alergias && child.alergias.length > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[9px] bg-rose-50 text-rose-700 font-black px-2 py-0.5 rounded-md border border-rose-200 uppercase tracking-wider truncate max-w-[150px]">
                            ⚠ {child.alergias[0]}
                          </span>
                        ) : child.condicoesMedicas && child.condicoesMedicas.length > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[9px] bg-amber-50 text-amber-800 font-black px-2 py-0.5 rounded-md border border-amber-200 uppercase tracking-wider truncate max-w-[150px]">
                              {child.condicoesMedicas[0]}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-50 text-emerald-700 font-extrabold px-1.5 py-0.5 rounded-md border border-emerald-200/60">
                              Saúde OK
                          </span>
                        )}

                        
                        <span className="inline-flex items-center text-[9px] bg-slate-100 text-slate-500 font-mono font-bold px-1.5 py-0.5 rounded-md border border-slate-200">
                          {child.id.replace('aluno_', 'AL-')}
                        </span>
                      </div>
                    </div>

                    
                    <div className="border-t border-slate-100 pt-2 flex items-center justify-between mt-auto">
                      <span className="text-[10px] text-slate-400 font-bold">
                        {child.dataNascimento ? `Nasc: ${child.dataNascimento}` : 'Maternal'}
                      </span>
                      
                      {isActive ? (
                        <span className="text-[10px] text-indigo-700 font-extrabold flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-indigo-600" /> Diário Ativo
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleActivateProfile(child);
                          }}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg text-[10px] transition-all flex items-center gap-1 cursor-pointer shadow-3xs"
                        >
                          <UserCheck className="w-3 h-3" /> Ativar Perfil
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        
        <div className="lg:col-span-5 xl:col-span-4">
          {selectedStudentForDetail ? (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden sticky top-6">
              
              
              <div className="bg-gradient-to-br from-indigo-100 to-indigo-50 p-6 border-b border-indigo-100/60 text-center relative space-y-3.5">
                
                
                <div className="absolute top-4 left-4">
                  <button
                    onClick={() => {
                      if (isEditingStudentProfile) {
                        setIsEditingStudentProfile(false);
                      } else {
                        handleStartEditStudentProfile(selectedStudentForDetail);
                      }
                    }}
                    className="px-2.5 py-1.5 bg-white hover:bg-indigo-50 text-indigo-700 font-extrabold rounded-xl text-[10px] uppercase shadow-3xs transition-all cursor-pointer flex items-center gap-1 border border-indigo-200"
                    title="Editar informações e cadastro do aluno"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-indigo-600" />
                    {isEditingStudentProfile ? 'Ver Ficha' : 'Editar Aluno'}
                  </button>
                </div>

                
                <div className="absolute top-4 right-4">
                  {selectedStudentForDetail.id === activeIdoso.id ? (
                    <span className="bg-emerald-600 text-white font-black text-[9px] px-2.5 py-1 rounded-full uppercase flex items-center gap-1 shadow-3xs">
                      <CheckCircle className="w-3 h-3 text-white" /> Diário de Hoje Ativo
                    </span>
                  ) : (
                    <button
                      onClick={() => handleActivateProfile(selectedStudentForDetail)}
                      className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-indigo-950 font-black rounded-xl text-[10px] uppercase shadow-md transition-all cursor-pointer flex items-center gap-1 border border-amber-300 animate-pulse-slow"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-950" /> Selecionar Aluno(a)
                    </button>
                  )}
                </div>

                {isEditingDetailPhoto ? (
                  <div className="flex flex-col items-center space-y-3.5">
                    {isCapturingDetail ? (
                      <div className="flex flex-col items-center gap-2 p-2 bg-slate-50/50 rounded-2xl border border-slate-200/60 max-w-sm w-full mx-auto">
                        <div className="relative w-48 h-48 bg-black rounded-xl overflow-hidden shadow-inner border border-slate-300">
                          <video 
                            ref={videoRefDetail} 
                            autoPlay 
                            playsInline 
                            className={`w-full h-full object-cover transform ${cameraFacingModeDetail === 'user' ? '-scale-x-100' : 'scale-x-100'}`}
                          />
                          {cameraErrorDetail && (
                            <div className="absolute inset-0 bg-slate-900/90 flex items-center justify-center p-4 text-center text-rose-300 text-[10px] font-bold">
                              {cameraErrorDetail}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5 justify-center">
                          {!cameraErrorDetail && (
                            <>
                              <button
                                type="button"
                                onClick={capturePhotoDetail}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg shadow-xs cursor-pointer animate-pulse-slow"
                              >
                                  Capturar Foto
                              </button>
                              <button
                                type="button"
                                onClick={toggleCameraFacingModeDetail}
                                className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold rounded-lg shadow-xs cursor-pointer flex items-center gap-1"
                                title="Inverter c (Frontal / Traseira)"
                              >
                                <RefreshCw className="w-3 h-3" /> Inverter
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={stopCameraDetail}
                            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold rounded-lg cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 w-full max-w-xs mx-auto">
                        <div className="flex justify-center">
                          <img 
                            src={selectedStudentForDetail.foto} 
                            alt="Previsualização" 
                            className="w-24 h-24 rounded-2xl object-cover border-2 border-indigo-200 shadow-sm"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => startCameraDetail()}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-[10px] font-bold border border-indigo-200 cursor-pointer transition-colors"
                          >
                            <Camera className="w-3.5 h-3.5 text-indigo-600" /> Tirar Nova Foto
                          </button>
                          
                          <label className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-bold border border-slate-300 cursor-pointer transition-colors">
                            <Upload className="w-3.5 h-3.5 text-slate-600" /> Enviar Foto do Aparelho
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={handleDetailPhotoUpload} 
                              className="hidden" 
                            />
                          </label>

                          <button
                            type="button"
                            onClick={downloadStudentPhoto}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-[10px] font-bold border border-emerald-200 cursor-pointer transition-colors"
                          >
                            <Download className="w-3.5 h-3.5 text-emerald-600" /> Baixar Foto do Aluno
                          </button>
                        </div>

                        <div className="border-t border-slate-100 pt-2 space-y-2">
                          <span className="text-[9px] text-slate-400 font-bold block uppercase text-left">Ou escolha um avatar rápido:</span>
                          <div className="grid grid-cols-6 gap-1 justify-items-center">
                            {AVATAR_OPTIONS.map((av, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  updateStudentPhotoInDB(selectedStudentForDetail.id, av.url);
                                  setIsEditingDetailPhoto(false);
                                  showToast("Foto atualizada com sucesso!", "success");
                                }}
                                className="w-6 h-6 rounded-full overflow-hidden border border-slate-200 transition-all hover:scale-110 cursor-pointer"
                              >
                                <img referrerPolicy="no-referrer" src={av.url} alt={av.label} className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-center pt-1">
                          <button
                            type="button"
                            onClick={() => setIsEditingDetailPhoto(false)}
                            className="text-[10px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="relative group/avatar">
                      <img 
                        src={selectedStudentForDetail.foto} 
                        alt={selectedStudentForDetail.nome} 
                        className="w-36 h-36 rounded-3xl object-cover border-4 border-white shadow-lg mx-auto transform hover:scale-105 transition-all duration-200"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        type="button"
                        onClick={downloadStudentPhoto}
                        className="absolute -bottom-1 -left-1 p-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-2xl shadow-md cursor-pointer transition-all hover:scale-110 flex items-center justify-center border-2 border-white"
                        title="Baixar foto do aluno para o computador/celular"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingDetailPhoto(true)}
                        className="absolute -bottom-1 -right-1 p-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-2xl shadow-md cursor-pointer transition-all hover:scale-110 flex items-center justify-center border-2 border-white"
                        title="Alterar fotografia do aluno"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <h3 className="font-extrabold text-base text-slate-900 mt-2.5">
                      {getStudentCleanName(selectedStudentForDetail.nome)}
                    </h3>
                    
                    {isTransferringRoom ? (
                      <div className="mt-2 flex flex-col items-center gap-1.5 bg-slate-50 p-2 rounded-xl border border-indigo-100 w-full max-w-[220px] shadow-3xs animate-fade-in">
                        <span className="text-[8px] uppercase font-black tracking-widest text-slate-400">Transferir de Sala</span>
                        <select
                          value={targetClassroom}
                          onChange={(e) => setTargetClassroom(e.target.value)}
                          className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg px-2 py-1 w-full focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                        >
                          {classrooms.map(room => (
                            <option key={room.id} value={room.name}>
                              {room.emoji} {room.name}
                            </option>
                          ))}
                        </select>
                        <div className="flex gap-1.5 w-full">
                          <button
                            onClick={() => handleExecuteTransfer(selectedStudentForDetail.id, targetClassroom)}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-[9px] font-extrabold py-1 px-1.5 rounded-md transition-all cursor-pointer"
                          >
                            Salvar
                          </button>
                          <button
                            onClick={() => setIsTransferringRoom(false)}
                            className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[9px] font-extrabold py-1 px-1.5 rounded-md transition-all cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-xs font-black text-indigo-600 uppercase tracking-wider bg-white border border-indigo-100 px-3 py-0.5 rounded-full">
                          {getStudentGroupLabel(selectedStudentForDetail.nome)}
                        </span>
                        <button
                          onClick={() => {
                            const currentRoom = getStudentClassroom(selectedStudentForDetail.nome);
                            setTargetClassroom(currentRoom);
                            setIsTransferringRoom(true);
                          }}
                          className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Transferir aluno de sala de aula"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              
              {isEditingStudentProfile ? (
                <form onSubmit={handleSaveEditedStudentProfile} className="p-6 space-y-4 text-xs text-left bg-white">
                  <div className="bg-indigo-50/70 p-3 rounded-2xl border border-indigo-100 mb-1">
                    <h4 className="text-xs font-extrabold text-indigo-950 flex items-center gap-1.5">
                      ✏ Edição Completa de Cadastro
                    </h4>
                    <p className="text-[10px] text-indigo-700 leading-snug">
                      Altere nome, data de nascimento, responsáveis, contatos de emergência e histórico de saúde do aluno.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block">Nome Completo do Aluno <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      value={editStudentForm.nome}
                      onChange={e => setEditStudentForm({ ...editStudentForm, nome: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block">Data de Nascimento</label>
                      <input
                        type="text"
                        placeholder="Ex: 15/10/2022"
                        value={editStudentForm.dataNascimento}
                        onChange={e => setEditStudentForm({ ...editStudentForm, dataNascimento: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 text-xs font-bold text-slate-800 text-center font-mono focus:bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block">Turma / Sala</label>
                      <select
                        value={editStudentForm.salaAula}
                        onChange={e => setEditStudentForm({ ...editStudentForm, salaAula: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 text-xs font-bold text-slate-800 focus:bg-white cursor-pointer"
                      >
                        {classrooms.map(room => (
                          <option key={room.id} value={room.name}>
                            {room.emoji} {room.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 space-y-2">
                    <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider block">  Contato dos Pais / Responsável</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 block">Nome do Responsável</label>
                        <input
                          type="text"
                          value={editStudentForm.responsavelNome}
                          onChange={e => setEditStudentForm({ ...editStudentForm, responsavelNome: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 block">Telefone do Responsável</label>
                        <input
                          type="text"
                          value={editStudentForm.responsavelFone}
                          onChange={e => setEditStudentForm({ ...editStudentForm, responsavelFone: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 space-y-2">
                    <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider block">🩺 Pediatra de Referência</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 block">Nome do Pediatra</label>
                        <input
                          type="text"
                          value={editStudentForm.medicoNome}
                          onChange={e => setEditStudentForm({ ...editStudentForm, medicoNome: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 block">Telefone do Pediatra</label>
                        <input
                          type="text"
                          value={editStudentForm.medicoFone}
                          onChange={e => setEditStudentForm({ ...editStudentForm, medicoFone: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 border-t border-slate-100 pt-3">
                    <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block">Alergias (separadas por vírgula)</label>
                    <input
                      type="text"
                      placeholder="Ex: Leite de vaca, Ovo, Dipirona"
                      value={editStudentForm.alergias}
                      onChange={e => setEditStudentForm({ ...editStudentForm, alergias: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 text-xs font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block">Restrições / Rotina Especial (separadas por vírgula)</label>
                    <input
                      type="text"
                      placeholder="Ex: Dorme com naninha, Requer chupeta na soneca"
                      value={editStudentForm.condicoes}
                      onChange={e => setEditStudentForm({ ...editStudentForm, condicoes: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 text-xs font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block">Diretrizes de Cuidados e Observações</label>
                    <textarea
                      rows={3}
                      value={editStudentForm.planoCuidado}
                      onChange={e => setEditStudentForm({ ...editStudentForm, planoCuidado: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 text-xs font-semibold"
                    />
                  </div>

                  <div className="pt-3 flex flex-col gap-2">
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4 text-white" /> Salvar Alterações do Aluno
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingStudentProfile(false)}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Cancelar Edição
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-6 space-y-5 text-xs">
                
                
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Nascimento e Idade
                  </p>
                  <p className="font-extrabold text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100">
                    {selectedStudentForDetail.dataNascimento} 
                    <span className="text-[10px] font-medium text-slate-500 ml-1">
                      ({selectedStudentForDetail.nome.includes('2 Anos') || selectedStudentForDetail.nome.includes('I') ? '2 anos' : '4 anos'})
                    </span>
                  </p>
                </div>

                
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
                    <Baby className="w-3.5 h-3.5 text-slate-400" /> Rotina Especial / Soneca / Banheiro
                  </p>
                  <div className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 space-y-1.5">
                    {selectedStudentForDetail.condicoesMedicas && selectedStudentForDetail.condicoesMedicas.length > 0 ? (
                      selectedStudentForDetail.condicoesMedicas.map((cond, i) => (
                        <div key={i} className="flex items-center justify-between gap-1 text-slate-700 font-semibold text-[11px] group/item">
                          <div className="flex items-start gap-1">
                            <span className="text-amber-500 mt-0.5">⭐</span>
                            <span>{cond}</span>
                          </div>
                          <button
                            onClick={() => handleDeleteCondicao(selectedStudentForDetail.id, cond)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer shrink-0"
                            title="Remover restrição"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-500 italic py-1 text-[11px]">Sem restrições lúdicas especiais.</p>
                    )}
                  </div>
                </div>

                
                <div className="space-y-1">
                  <p className="text-[10px] text-rose-600 font-extrabold uppercase tracking-wider flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> Alergias Comunicadas pelos Pais
                  </p>
                  <div className="bg-rose-50/50 p-3 py-2 rounded-xl border border-rose-100 space-y-1.5">
                    {selectedStudentForDetail.alergias && selectedStudentForDetail.alergias.length > 0 ? (
                      selectedStudentForDetail.alergias.map((alergia, i) => (
                        <div key={i} className="flex items-center justify-between gap-1 text-rose-950 font-bold text-[11px] group/item2">
                          <div className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                            <span>{alergia}</span>
                          </div>
                          <button
                            onClick={() => handleDeleteAlergia(selectedStudentForDetail.id, alergia)}
                            className="p-1 rounded-md text-rose-455 hover:text-rose-700 hover:bg-rose-100 transition-all cursor-pointer shrink-0"
                            title="Remover alergia"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-emerald-700 font-bold py-1 text-[11px]">Sem alergias catalogadas.</p>
                    )}
                  </div>
                </div>

                
                <div className="pt-1.5 border-t border-slate-100">
                  <button
                    onClick={() => setShowAddSpecialField(!showAddSpecialField)}
                    className="w-full py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold flex items-center justify-center gap-1 transition-colors border border-indigo-200 cursor-pointer text-[10px] uppercase tracking-wider"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Par / Alerta
                  </button>

                  {showAddSpecialField && (
                    <form 
                      onSubmit={(e) => handleCreateSpecialAttr(e, selectedStudentForDetail.id)} 
                      className="bg-indigo-50/40 p-2.5 rounded-xl border border-indigo-100 mt-2 space-y-2 text-left"
                    >
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-indigo-900 font-extrabold uppercase tracking-wide">Tipo de Alerta</label>
                        <select
                          value={newSpecialType}
                          onChange={e => setNewSpecialType(e.target.value as 'condicao' | 'alergia')}
                          className="text-xs px-2 py-1.5 bg-white border border-indigo-200 rounded-lg text-slate-705 outline-hidden focus:border-indigo-500 font-bold"
                        >
                          <option value="condicao">Rotina / Restrição</option>
                          <option value="alergia">Alergia Grave</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-indigo-900 font-extrabold uppercase tracking-wide">Especificação</label>
                        <input
                          type="text"
                          placeholder={newSpecialType === 'condicao' ? 'Ex: Requer chupeta para dormir' : 'Ex: Glúten, Sabonete líquido'}
                          value={newSpecialValue}
                          onChange={e => setNewSpecialValue(e.target.value)}
                          className="text-xs px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg text-slate-800 placeholder-indigo-300 outline-hidden focus:border-indigo-500 font-semibold"
                          autoFocus
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => { setShowAddSpecialField(false); setNewSpecialValue(''); }}
                          className="px-2.5 py-1 text-[10px] font-bold text-indigo-900 hover:bg-indigo-100 rounded-md"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-[10px] font-bold rounded-md shadow-xs"
                        >
                          Salvar
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                
                <div className="space-y-1">
                  <p className="text-[10px] text-rose-600 font-extrabold uppercase tracking-wider flex items-center gap-1">
                    <UserX className="w-3.5 h-3.5 text-rose-500" /> Frequência e Controle de Faltas
                  </p>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
                    <div className="flex justify-between items-center pb-1.5 border-b border-slate-100">
                      <span className="font-extrabold text-slate-700 text-[11px]">Faltas Totais:</span>
                      <span className="bg-rose-100 text-rose-700 font-extrabold text-[11px] px-2.5 py-0.5 rounded-full shrink-0">
                        {absenceDates.length} {absenceDates.length === 1 ? 'Falta' : 'Faltas'}
                      </span>
                    </div>

                    
                    {(() => {
                      const todayStr = new Date().toISOString().split('T')[0];
                      const isAbsentToday = absenceDates.includes(todayStr);
                      return (
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200/60 flex items-center justify-between gap-2.5 shadow-3xs">
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Falta Hoje?</span>
                            <span className={`text-[10px] font-extrabold flex items-center gap-1 ${isAbsentToday ? 'text-rose-600' : 'text-emerald-700'}`}>
                              {isAbsentToday ? '  Ausente (Com Falta)' : '✓ Presente (Em Aula)'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleAbsenceToday(selectedStudentForDetail)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold cursor-pointer transition-all border shrink-0 ${
                              isAbsentToday 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 active:bg-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 active:bg-rose-200'
                            }`}
                          >
                            {isAbsentToday ? 'Marcar Presença' : 'Marcar Falta'}
                          </button>
                        </div>
                      );
                    })()}

                    {absenceDates.length > 0 ? (
                      <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                        {absenceDates.map((d, idx) => (
                          <div key={idx} className="flex items-center justify-between text-[11px] font-semibold text-slate-650 bg-white border border-slate-100 px-2 py-1 rounded-md">
                            <span className="font-mono text-slate-700">  {d.split('-').reverse().join('/')}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveAbsenceDate(selectedStudentForDetail.id, d)}
                              className="text-slate-400 hover:text-rose-600 transition-colors p-0.5 cursor-pointer"
                              title="Remover este registro de falta"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 italic text-[11px] py-1">Nenhuma falta registrada. Aluno 100% presente!  </p>
                    )}

                    
                    <div className="pt-1.5">
                      {!showAddRetroDate ? (
                        <button
                          type="button"
                          onClick={() => setShowAddRetroDate(true)}
                          className="text-[10px] text-indigo-600 hover:text-indigo-800 font-extrabold uppercase tracking-wider flex items-center gap-0.5 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Registrar Falta Retroativa/Manual
                        </button>
                      ) : (
                        <form onSubmit={(e) => handleAddAbsenceDate(selectedStudentForDetail.id, e)} className="mt-1 space-y-1.5">
                          <label className="text-[9px] text-slate-400 uppercase tracking-wider font-extrabold block">Data da Falta:</label>
                          <div className="flex gap-1.5">
                            <input
                              type="date"
                              value={retroDate}
                              onChange={(e) => setRetroDate(e.target.value)}
                              className="text-xs px-2 py-1 bg-white border border-slate-200 rounded-md text-slate-800 outline-hidden font-mono grow"
                              required
                            />
                            <button
                              type="submit"
                              className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-extrabold px-3 py-1 rounded-md cursor-pointer"
                            >
                              Registrar
                            </button>
                            <button
                              type="button"
                              onClick={() => { setShowAddRetroDate(false); setRetroDate(''); }}
                              className="text-slate-500 hover:text-slate-700 text-[10px] font-bold px-1.5 cursor-pointer"
                            >
                              Cancelar
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                </div>

                
                {(() => {
                  const student = selectedStudentForDetail;
                  const childHyg = getFromDB<any>(`anjo_higiene_log_${student.id}`, null);
                  const allHidsGlobal = getFromDB<any[]>('anjo_hidratacao', []);
                  const studentHids = allHidsGlobal.filter(h => h.idosoId === student.id && isTodayOrDemoDate(h.data));
                  const studentWaterMl = studentHids.reduce((acc, curr) => acc + (curr.quantidadeMl || 0), 0);
                  
                  const allSonosGlobal = getFromDB<any[]>('anjo_sono', []);
                  const studentSonos = allSonosGlobal.filter(s => s.idosoId === student.id && isTodayOrDemoDate(s.data));
                  const lastSleep = studentSonos.length > 0 ? studentSonos[studentSonos.length - 1] : null;

                  const allSinaisGlobal = getFromDB<any[]>('anjo_sinais', []);
                  const studentSinais = allSinaisGlobal.filter(s => s.idosoId === student.id && isTodayOrDemoDate(s.data));
                  const lastSinal = studentSinais.length > 0 ? studentSinais[studentSinais.length - 1] : null;

                  const hasDiaper = Boolean(childHyg?.diaper || childHyg?.trocaFralda);

                  return (
                    <div className="space-y-2 bg-gradient-to-br from-indigo-50/70 to-slate-50 p-3.5 rounded-2xl border border-indigo-100">
                      <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                        <p className="text-[10px] text-indigo-900 font-black uppercase tracking-wider flex items-center gap-1">
                          <Activity className="w-3.5 h-3.5 text-indigo-600" /> Registros do Turno do Aluno
                        </p>
                        <span className="text-[9px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                          Salvo no Turno
                        </span>
                      </div>

                      <div className="space-y-2 pt-1 text-xs font-semibold text-slate-700">
                        
                        <div className="bg-white p-2 rounded-xl border border-slate-200/80 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-base"> </span>
                            <div>
                              <span className="font-extrabold text-slate-800 block text-xs">Fralda / Higiene</span>
                              <span className="text-[10px] text-slate-500 font-medium">
                                {hasDiaper ? '✓ Fralda trocada/cuidada hoje' : 'Pendente de registro'}
                              </span>
                            </div>
                          </div>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${hasDiaper ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                            {hasDiaper ? 'Trocada' : 'Pendente'}
                          </span>
                        </div>

                        
                        <div className="bg-white p-2 rounded-xl border border-slate-200/80 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-base"> </span>
                            <div>
                              <span className="font-extrabold text-slate-800 block text-xs">Sono / Sesta</span>
                              <span className="text-[10px] text-slate-500 font-medium">
                                {lastSleep ? `Dormiu: ${lastSleep.dormiuEm || '13:00'} - ${lastSleep.acordouEm || '14:30'} (${lastSleep.horasDormidas || 1.5}h)` : 'Sem registro de soneca hoje'}
                              </span>
                            </div>
                          </div>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${lastSleep ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-500'}`}>
                            {lastSleep ? 'Registrado' : 'Pendente'}
                          </span>
                        </div>

                        
                        <div className="bg-white p-2 rounded-xl border border-slate-200/80 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-base"> </span>
                            <div>
                              <span className="font-extrabold text-slate-800 block text-xs">Saúde / Vitais</span>
                              <span className="text-[10px] text-slate-500 font-medium">
                                {lastSinal ? `Temp: ${lastSinal.temperatura || 36.5}°C | ${lastSinal.soneca || 'Sem queixas'}` : 'Nenhuma alteração de saúde'}
                              </span>
                            </div>
                          </div>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${lastSinal?.temperatura ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                            {lastSinal?.temperatura ? `${lastSinal.temperatura}°C` : 'Em Dia'}
                          </span>
                        </div>

                        
                        {(() => {
                          const allFeedsGlobal = getFromDB<any[]>('anjo_alimentacao', []);
                          const studentFeedsToday = allFeedsGlobal.filter(f => f.idosoId === student.id && isTodayOrDemoDate(f.data));
                          const studentBottles = studentFeedsToday.filter(f => f.refeicao === 'mamadeira');
                          const bottleCount = studentBottles.length;

                          return (
                            <div className="bg-white p-2.5 rounded-xl border border-indigo-200/80 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-base"> </span>
                                  <div>
                                    <span className="font-extrabold text-slate-800 block text-xs">Mamadeira de Leite / Fórmula</span>
                                    <span className="text-[10px] text-slate-500 font-medium">
                                      {bottleCount > 0
                                        ? `${bottleCount} ${bottleCount === 1 ? 'mamadeira servida hoje' : 'mamadeiras servidas hoje'}`
                                        : 'Nenhuma mamadeira registrada hoje'}
                                    </span>
                                  </div>
                                </div>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${bottleCount > 0 ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-500'}`}>
                                  {bottleCount} {bottleCount === 1 ? 'mamadeira' : 'mamadeiras'}
                                </span>
                              </div>

                              <div className="flex gap-1.5 pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleQuickServeBottle(student, 1)}
                                  className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold text-[10px] rounded-lg transition-all cursor-pointer text-center shadow-3xs"
                                >
                                  +1 Mamadeira
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleQuickServeBottle(student, 2)}
                                  className="flex-1 py-1.5 bg-indigo-800 hover:bg-indigo-900 text-white font-extrabold text-[10px] rounded-lg transition-all cursor-pointer text-center shadow-3xs"
                                >
                                  +2 Mamadeiras
                                </button>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      <p className="text-[10px] text-slate-500 font-semibold italic text-center pt-1 border-t border-indigo-100/60">
                          Estes registros permanecem mantidos durante todo o turno. Só são apagados ao zerar os cronômetros ou reiniciar.
                      </p>
                    </div>
                  );
                })()}

                
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> Responsáveis para Recados urgentes
                  </p>
                  <div className="bg-indigo-50/40 p-3 rounded-xl border border-indigo-100/50 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-extrabold text-slate-800">
                          {selectedStudentForDetail.contatoEmergencia.nome}
                          <span className="text-[10px] text-indigo-600 font-bold bg-white px-1.5 py-0.5 rounded border border-indigo-100 ml-1.5">
                            {selectedStudentForDetail.contatoEmergencia.parentesco}
                          </span>
                        </p>
                        <p className="text-[11px] text-slate-600 font-mono font-bold flex items-center gap-1 pt-0.5">
                          <span>  Tel:</span> {selectedStudentForDetail.contatoEmergencia.telefone}
                        </p>
                      </div>

                      {onNavigate && (
                        <button
                          type="button"
                          onClick={() => onNavigate('family')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer shadow-3xs shrink-0"
                          title="Convidar este responsável para acessar o diário pelo WhatsApp"
                        >
                          <Share2 className="w-3 h-3" /> Convidar
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
                    <ClipboardList className="w-3.5 h-3.5 text-slate-400" /> Diretrizes de Orientação e Cuidados
                  </p>
                  <p className="text-slate-600 font-semibold leading-relaxed bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-100 text-[11px]">
                    {selectedStudentForDetail.planoCuidado || 'Incentivar atividades lúdicas coletivas e checar hidratação regular.'}
                  </p>
                </div>

                
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-slate-400" /> Pediatra de Referência do Aluno
                  </p>
                  <div className="bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-100 flex justify-between items-center text-[11px] font-semibold text-slate-755">
                    <div>
                      <p className="font-extrabold text-slate-800">{selectedStudentForDetail.medicoResponsavel?.nome || 'Dr(a). Não Cadastrado'}</p>
                      <p className="text-[9px] text-slate-400 font-bold">{selectedStudentForDetail.medicoResponsavel?.especialidade || 'Pediatria Geral'}</p>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono font-bold">{selectedStudentForDetail.medicoResponsavel?.telefone || ''}</span>
                  </div>
                </div>

                
                <div className="pt-2 space-y-3">
                  {selectedStudentForDetail.id === activeIdoso.id ? (
                    <div className="p-3 bg-emerald-50 text-emerald-900 font-extrabold text-center rounded-xl border border-emerald-100 text-[11px]">
                      ✨ Esta é a caderneta que você está editando no momento. Qualquer remédio mandado, alimento ou soneca anotada irá para a família de {getStudentCleanName(selectedStudentForDetail.nome)}!
                    </div>
                  ) : (
                    <button
                      onClick={() => handleActivateProfile(selectedStudentForDetail)}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                    >
                      <UserCheck className="w-4 h-4 text-white" /> Ativar Diário Escolar de {getStudentCleanName(selectedStudentForDetail.nome)}
                    </button>
                  )}

                  
                  <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-[10px] text-slate-450 font-bold italic">Ficha Administrativa</span>
                    <button
                      onClick={() => handleDeleteStudent(selectedStudentForDetail.id)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1 border border-rose-200"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" /> Excluir Aluno
                    </button>
                  </div>
                </div>
              </div>
              )}

            </div>
          ) : (
            <div className="bg-slate-100 rounded-3xl p-6 border border-slate-200 text-center text-slate-400 italic">
              Selecione um aluno na lista para ver o prontuário completo.
            </div>
          )}
        </div>

      </div>

      
      {showAddStudentForm && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="add-student-modal">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 p-6 space-y-4 shadow-2xl text-slate-800 max-h-[90vh] overflow-y-auto animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span> </span> Cadastrar Novo(a) Aluno(a)
              </h3>
              <button 
                type="button"
                onClick={() => setShowAddStudentForm(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer rounded-lg hover:bg-slate-100 text-xs"
              >
                ✕ Fechar
              </button>
            </div>

            
            <div className="flex border-b border-slate-100 pb-1 gap-2">
              <button
                type="button"
                onClick={() => setAddStudentTab('individual')}
                className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer text-center ${
                  addStudentTab === 'individual'
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                  Cadastro Individual
              </button>
              <button
                type="button"
                onClick={() => setAddStudentTab('massa')}
                className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
                  addStudentTab === 'massa'
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                  Importação com Aura AI
              </button>
            </div>

            {addStudentTab === 'massa' ? (
              <div className="space-y-4">
                <div className="p-3 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 text-[11px] leading-relaxed text-indigo-950 space-y-2">
                  <div className="flex items-center gap-2 font-black text-xs text-indigo-900">
                    <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Padrão Oficial de Cadastro do Anjinho + Aura AI</span>
                  </div>
                  <p className="text-[11px] text-slate-700">
                    Cole qualquer texto bruto, planilha ou lista informal de alunos. A <strong>Aura AI</strong> extrai e padroniza automaticamente os campos oficiais do sistema:
                  </p>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] pt-1 font-semibold text-slate-700">
                    <div className="flex items-center gap-1">  <strong>Nome Completo</strong></div>
                    <div className="flex items-center gap-1">  <strong>Data de Nasc. / Idade</strong></div>
                    <div className="flex items-center gap-1">🏫 <strong>Turma / Sala</strong></div>
                    <div className="flex items-center gap-1">    <strong>Responsável & Contato</strong></div>
                    <div className="flex items-center gap-1">⚠ <strong>Alergias & Restrições</strong></div>
                    <div className="flex items-center gap-1">🩺 <strong>Cuidados / Saúde</strong></div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block">Texto ou Lista de Alunos</label>
                  <textarea
                    rows={5}
                    value={bulkText}
                    onChange={e => setBulkText(e.target.value)}
                    placeholder="Ex: João da Silva nasceu em 15/03/2023 (3 anos), turma Maternal I. Alergia a Lactose e Pele atópica. Mãe Clarice tel (11) 98765-4321&#10;Maria Souza, 4 anos, Jardim I, Pai Rodrigo tel (11) 91234-5678, usa bombinha de asma."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-slate-800"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleParseBulkStudents}
                    disabled={isParsingBulk || !bulkText.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    {isParsingBulk ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Processando com Aura...</span>
                      </>
                    ) : (
                      <>
                        <span>  Extrair & Padronizar com Aura</span>
                      </>
                    )}
                  </button>
                </div>

                {parsedStudents.length > 0 && (
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <span> </span> Resultados Padronizados ({parsedStudents.length} aluno(s)):
                    </h4>

                    <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-[260px] overflow-y-auto">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-extrabold uppercase tracking-wider">
                            <th className="p-2">Aluno</th>
                            <th className="p-2">Turma</th>
                            <th className="p-2">Nascimento / Idade</th>
                            <th className="p-2">Responsável</th>
                            <th className="p-2">Alergias</th>
                            <th className="p-2">Cuidados / Saúde</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {parsedStudents.map((st, i) => (
                            <tr key={i} className="hover:bg-slate-50/50">
                              <td className="p-2 font-bold text-slate-800">{String(st.name || '-')}</td>
                              <td className="p-2 text-indigo-600 font-semibold">{String(st.className || '-')}</td>
                              <td className="p-2 font-mono text-[10px] text-slate-600">
                                {st.birthDate ? String(st.birthDate) : '-'}
                                {st.age ? <span className="block text-[9px] text-slate-400">({String(st.age)} anos)</span> : null}
                              </td>
                              <td className="p-2 text-slate-600">
                                <span className="font-semibold block">{String(st.guardianName || '-')} {st.guardianRelationship ? `(${String(st.guardianRelationship)})` : ''}</span>
                                <span className="text-[9px] text-slate-400 font-mono block">{String(st.guardianPhone || '')}</span>
                              </td>
                              <td className="p-2">
                                {Array.isArray(st.allergies) && st.allergies.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {st.allergies.map((alg: any, idx: number) => (
                                      <span key={idx} className="px-1.5 py-0.5 bg-rose-50 text-rose-700 text-[9px] font-bold rounded-md border border-rose-100">
                                        ⚠ {String(alg || '')}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-slate-300 italic text-[10px]">Nenhuma</span>
                                )}
                              </td>
                              <td className="p-2">
                                {Array.isArray(st.conditions) && st.conditions.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {st.conditions.map((cnd: any, idx: number) => (
                                      <span key={idx} className="px-1.5 py-0.5 bg-amber-50 text-amber-800 text-[9px] font-bold rounded-md border border-amber-100">
                                        🩺 {String(cnd || '')}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-slate-300 italic text-[10px]">Nenhum</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setParsedStudents([])}
                        className="px-4 py-2 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Limpar Resultados
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveBulkStudents}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                      >
                        <span>  Confirmar e Cadastrar Alunos</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleAddStudent} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                
                <div className="sm:col-span-2 space-y-2 border-b border-slate-100 pb-4">
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block">Fotografia do Aluno *</label>
                  
                  <div className="flex flex-col gap-4">
                    {isCapturing ? (
                      <div className="flex flex-col items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 w-full">
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
                                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-xl shadow-xs cursor-pointer"
                              >
                                  Capturar Foto
                              </button>
                              <button
                                type="button"
                                onClick={toggleCameraFacingMode}
                                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1"
                                title="Inverter c (Frontal / Traseira)"
                              >
                                <RefreshCw className="w-3.5 h-3.5" /> Inverter C
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={stopCamera}
                            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-bold rounded-xl cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        
                        <div className="flex flex-col items-center gap-1 shrink-0">
                          <div className="w-20 h-20 bg-slate-100 rounded-2xl overflow-hidden border-2 border-indigo-250 shadow-sm flex items-center justify-center relative group">
                            <img 
                              referrerPolicy="no-referrer" 
                              src={newStudentPhoto} 
                              alt="Foto do Aluno" 
                              className="w-full h-full object-cover" 
                            />
                            {newStudentPhoto.startsWith('data:') && (
                              <span className="absolute bottom-1 right-1 bg-teal-500 text-white text-[8px] font-extrabold px-1 rounded shadow-xs">FOTO REAL</span>
                            )}
                          </div>
                          <span className="text-[9px] text-slate-400 font-bold">Visualização</span>
                        </div>
                        
                        
                        <div className="flex-1 space-y-3 w-full">
                          <div className="flex flex-wrap gap-2">
                            
                            <button
                              type="button"
                              onClick={() => startCamera()}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-[10px] font-bold border border-indigo-200 cursor-pointer transition-colors"
                            >
                              <Camera className="w-3.5 h-3.5 text-indigo-600" /> Tirar Foto na C
                            </button>
                            
                            
                            <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-bold border border-slate-300 cursor-pointer transition-colors">
                              <Upload className="w-3.5 h-3.5 text-slate-600" /> Enviar Foto do Computador/Celular
                              <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleStudentPhotoUpload} 
                                className="hidden" 
                              />
                            </label>
                          </div>

                          <div className="border-t border-slate-100 pt-2 space-y-2">
                            <span className="text-[9px] text-slate-400 font-bold block uppercase">Ou escolha um avatar rápido:</span>
                            
                            <div className="grid grid-cols-6 gap-1 max-w-sm">
                              {AVATAR_OPTIONS.map((av, idx) => {
                                const isSel = newStudentPhoto === av.url;
                                return (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setNewStudentPhoto(av.url)}
                                    title={av.label}
                                    className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                                      isSel 
                                        ? 'border-indigo-600 scale-110 shadow-xs ring-2 ring-indigo-500/20' 
                                        : 'border-transparent hover:scale-105'
                                    }`}
                                  >
                                    <img referrerPolicy="no-referrer" src={av.url} alt={av.label} className="w-full h-full object-cover" />
                                  </button>
                                );
                              })}
                            </div>

                            <div className="space-y-1">
                              <input
                                type="text"
                                placeholder="Ou cole o link de outra foto de sua escolha (URL)"
                                value={newStudentPhoto.startsWith('data:') ? '' : newStudentPhoto}
                                onChange={e => setNewStudentPhoto(e.target.value)}
                                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-[10px] font-semibold focus:outline-none focus:ring-1.5 focus:ring-indigo-500 bg-slate-50 text-slate-800"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase font-black tracking-wider text-slate-500">Nome Completo do Aluno *</label>
                    <VoiceInput 
                      onTranscript={text => setNewStudentName(prev => prev ? prev + ' ' + text : text)} 
                      size="sm"
                    />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Pedro Henrique Alencar"
                    value={newStudentName}
                    onChange={e => setNewStudentName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-slate-800"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1">Sala / Turma *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 max-h-48 overflow-y-auto p-1 border border-slate-100 rounded-xl bg-slate-50">
                    {classrooms.map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setNewStudentClassroom(t.name)}
                        className={`py-2 px-1 rounded-xl border text-[11px] font-bold transition-all text-center flex flex-col items-center justify-center cursor-pointer ${
                          newStudentClassroom === t.name
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-sm truncate max-w-full">{t.emoji} {t.name}</span>
                        <span className="text-[9px] opacity-75">{t.ageGroup}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block">Data de Nascimento (Brasil) *</label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    placeholder="Ex: DD/MM/AAAA"
                    value={newStudentBirthDate}
                    onChange={e => {
                      const clean = e.target.value.replace(/\D/g, "");
                      const truncated = clean.slice(0, 8);
                      let formatted = truncated;
                      if (truncated.length > 2 && truncated.length <= 4) {
                        formatted = `${truncated.slice(0, 2)}/${truncated.slice(2)}`;
                      } else if (truncated.length > 4) {
                        formatted = `${truncated.slice(0, 2)}/${truncated.slice(2, 4)}/${truncated.slice(4)}`;
                      }
                      setNewStudentBirthDate(formatted);
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-slate-800 font-mono text-center"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase font-black tracking-wider text-slate-500">Nome do Pai/Mãe/Tutor *</label>
                    <VoiceInput 
                      onTranscript={text => setNewStudentResponsibleName(prev => prev ? prev + ' ' + text : text)} 
                      size="sm"
                    />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Clarice de Souza"
                    value={newStudentResponsibleName}
                    onChange={e => setNewStudentResponsibleName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-500">Parentesco *</label>
                  <select
                    value={newStudentResponsibleParentesco}
                    onChange={e => setNewStudentResponsibleParentesco(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 h-[34px]"
                  >
                    <option value="Mãe">Mãe</option>
                    <option value="Pai">Pai</option>
                    <option value="Avó/Avô">Avó / Avô</option>
                    <option value="Tio/Tia">Tio / Tia</option>
                    <option value="Responsável Legal">Responsável Legal</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-500">Telefone do Responsável *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: (11) 98765-4321"
                    value={newStudentResponsiblePhone}
                    onChange={e => setNewStudentResponsiblePhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-slate-800"
                  />
                </div>

              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-500">Alergias (Opcional - separar por vírgula)</label>
                  <VoiceInput 
                    onTranscript={text => setNewStudentAllergiesInput(prev => prev ? prev + ', ' + text : text)} 
                    size="sm"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Ex: Glúten, Lactose, Corante Vermelho"
                  value={newStudentAllergiesInput}
                  onChange={e => setNewStudentAllergiesInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-500">Condições / Cuidados Especiais (Opcional - separar por vírgula)</label>
                  <VoiceInput 
                    onTranscript={text => setNewStudentConditionsInput(prev => prev ? prev + ', ' + text : text)} 
                    size="sm"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Ex: Asma (bombinha de ar), Pele sensível"
                  value={newStudentConditionsInput}
                  onChange={e => setNewStudentConditionsInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-500">Plano de Cuidado Especial / Recomendações (Opcional)</label>
                  <VoiceInput 
                    onTranscript={text => setNewStudentCarePlanInput(prev => prev ? prev + ' ' + text : text)} 
                    size="sm"
                  />
                </div>
                <textarea
                  rows={2.5}
                  placeholder="Ex: Evitar que corra excessivamente devido à asma e hidratar com maior frequência."
                  value={newStudentCarePlanInput}
                  onChange={e => setNewStudentCarePlanInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddStudentForm(false)}
                  className="px-4 py-2 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs transition-all cursor-pointer shadow-md"
                >
                  Salvar Cadastro
                </button>
              </div>
            </form>
            )}
          </div>
        </div>
      )}

      
      {toast && (
        <div className={`fixed top-4 right-4 z-[9999] max-w-sm bg-white shadow-xl rounded-xl p-4 flex items-center gap-3 border transition-all duration-300 transform translate-y-0 ${
          toast.type === 'warning' ? 'border-l-4 border-l-amber-500 border-slate-100' : 'border-l-4 border-l-emerald-500 border-slate-100'
        }`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
            toast.type === 'warning' ? 'bg-amber-50' : 'bg-emerald-50'
          }`}>
            {toast.type === 'warning' ? (
              <ShieldAlert className="w-5 h-5 text-amber-600" />
            ) : (
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            )}
          </div>
          <div className="text-xs font-bold text-slate-800">
            {toast.message}
          </div>
        </div>
      )}

      
      {confirmDialog && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl border border-slate-150 space-y-4 animate-scale-up">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">
                {confirmDialog.title}
              </h3>
            </div>
            <p className="text-xs text-slate-650 font-semibold leading-relaxed">
              {confirmDialog.description}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 hover:bg-slate-100 text-slate-500 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-md"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      
      {deleteStudentOptions && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="relative bg-white max-w-lg w-full rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-5 animate-scale-up text-slate-800">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-900 leading-tight">
                  Como deseja excluir o aluno?
                </h3>
                <p className="text-[10px] font-black text-rose-600 uppercase tracking-wider">
                  {deleteStudentOptions.studentName}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Você está prestes a excluir o cadastro de <strong>{deleteStudentOptions.studentName}</strong>. 
              Por favor, selecione como deseja gerenciar os registros anteriores deste aluno:
            </p>

            <div className="space-y-3">
              
              <button
                type="button"
                onClick={() => executeDeleteStudent(deleteStudentOptions.studentId, false)}
                className="w-full text-left p-4 rounded-2xl border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-200 transition-all cursor-pointer group flex gap-3"
              >
                <span className="text-xl shrink-0 mt-0.5"> </span>
                <div>
                  <h4 className="text-xs font-black text-indigo-900 group-hover:text-indigo-950">
                    Opção 1: Excluir Cadastro (Manter Histórico)
                  </h4>
                  <p className="text-[10px] text-indigo-700/80 font-bold leading-normal mt-1">
                    Remove a ficha ativa do aluno das turmas e diários. Porém, todo o histórico anterior de relatórios de turnos, sono, alimentação e medicamentos continuará salvo para consultas estatísticas e auditorias da escola.
                  </p>
                </div>
              </button>

              
              <button
                type="button"
                onClick={() => executeDeleteStudent(deleteStudentOptions.studentId, true)}
                className="w-full text-left p-4 rounded-2xl border border-rose-100 bg-rose-50/40 hover:bg-rose-50 hover:border-rose-200 transition-all cursor-pointer group flex gap-3"
              >
                <span className="text-xl shrink-0 mt-0.5"> </span>
                <div>
                  <h4 className="text-xs font-black text-rose-900 group-hover:text-rose-950">
                    Opção 2: Excluir Tudo (Limpar Histórico Completo)
                  </h4>
                  <p className="text-[10px] text-rose-700/80 font-bold leading-normal mt-1">
                    Apaga permanentemente o cadastro do aluno e limpa do banco de dados qualquer registro de sono, fraldas, refeições, medicações ou incidentes associados a ele. Ação definitiva e irreversível.
                  </p>
                </div>
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setDeleteStudentOptions(null)}
                className="px-4 py-2 hover:bg-slate-100 text-slate-500 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Voltar / Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      
      {showRoomPinModal && pendingRoomToSwitch && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-indigo-100 space-y-4 animate-scale-up">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-tight">
                    Acesso Restrito por PIN
                  </h3>
                  <p className="text-xs font-bold text-indigo-600">
                    Liberar Sala: {pendingRoomToSwitch}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowRoomPinModal(false);
                  setPendingRoomToSwitch(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {(() => {
              const assignedTeacher = getAssignedTeacherForRoom(pendingRoomToSwitch, usuarioAtual);
              return (
                <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-3 flex items-center gap-3 text-xs">
                  {assignedTeacher?.foto ? (
                    <img src={assignedTeacher.foto} alt={assignedTeacher.nome} className="w-10 h-10 rounded-full object-cover border border-indigo-200" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-200 text-indigo-800 flex items-center justify-center font-black">
                       🏫
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider">Educadora Responsável</p>
                    <p className="font-extrabold text-slate-800">{assignedTeacher ? assignedTeacher.nome : 'Educadora da Turma'}</p>
                  </div>
                </div>
              );
            })()}

            <form onSubmit={handleVerifyRoomPin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block text-center">
                  Digite o PIN de Segurança (4 dígitos) para liberar a sala:
                </label>
                <input
                  type="password"
                  maxLength={4}
                  pattern="[0-9]*"
                  inputMode="numeric"
                  placeholder="••••"
                  value={roomPinInput}
                  onChange={e => {
                    setRoomPinInput(e.target.value.replace(/\D/g, ''));
                    setRoomPinError('');
                  }}
                  className="w-full text-center py-2.5 px-4 tracking-widest text-2xl font-black border border-slate-300 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 text-slate-900 shadow-inner"
                  required
                  autoFocus
                />

                {roomPinError ? (
                  <p className="text-[11px] text-rose-600 font-extrabold text-center">
                    {roomPinError}
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-500 font-semibold text-center leading-normal">
                      Proteção de Segurança: Insira o PIN da educadora para ter acesso a esta sala. <br />
                    <span className="text-indigo-600 font-black">
                      Dica de Simulação: Digite "3031" (Diretora Nilva), "9181" (Dev Djalma) ou o PIN da educadora.
                    </span>
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowRoomPinModal(false);
                    setPendingRoomToSwitch(null);
                  }}
                  className="flex-1 py-2.5 px-3 border border-slate-200 text-slate-600 hover:bg-slate-50 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" /> Confirmar PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
