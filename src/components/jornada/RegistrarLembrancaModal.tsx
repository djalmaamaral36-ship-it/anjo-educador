import React, { useState, useRef } from 'react';
import { LembrancaCategory, LembrancaMoment } from '../../types';
import {
  X,
  Sparkles,
  Camera,
  Upload,
  Mic,
  MicOff,
  Check,
  Star,
  Users,
  MessageSquare,
  FileText,
  Image as ImageIcon,
  Share2,
} from 'lucide-react';
import CardRedesSociaisPreview, { MENSAGENS_AFETO_PRESET } from './CardRedesSociaisPreview';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (moment: Omit<LembrancaMoment, 'id'>) => void;
  studentName: string;
}

const PRESET_ILLUSTRATIONS = [
  'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1596464716127-f2a829822301?w=600&auto=format&fit=crop&q=80',
];

const BNCC_TAGS = ['Aprendizado', 'Criatividade', 'Movimento', 'Convivência', 'Comunicação'];

const HUMAN_VALUES = [
  'Compartilhou',
  'Empatia',
  'Esperou vez',
  'Consolou',
  'Foi gentil',
  'Cooperou',
  'Respeitou',
];

export default function RegistrarLembrancaModal({
  isOpen,
  onClose,
  onSave,
  studentName,
}: Props) {
  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState<LembrancaCategory>('atividade');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [descricao, setDescricao] = useState('');
  const [fotoUrl, setFotoUrl] = useState(PRESET_ILLUSTRATIONS[0]);
  const [selectedBncc, setSelectedBncc] = useState<string[]>(['Aprendizado']);
  const [selectedValores, setSelectedValores] = useState<string[]>(['Cooperou', 'Compartilhou']);
  const [isDestaque, setIsDestaque] = useState(true);
  const [replicarTurma, setReplicarTurma] = useState(false);
  const [postarRedesSociais, setPostarRedesSociais] = useState(true);
  const [ocultarFotoCrianca, setOcultarFotoCrianca] = useState(true);
  const [mensagemAfeto, setMensagemAfeto] = useState(MENSAGENS_AFETO_PRESET[0]);
  const [nomeAnexo, setNomeAnexo] = useState('');
  const [isListeningTitle, setIsListeningTitle] = useState(false);
  const [isListeningDesc, setIsListeningDesc] = useState(false);

  // Referências para Galeria e Câmera Direta do Celular
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const toggleBncc = (tag: string) => {
    setSelectedBncc((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const toggleValor = (val: string) => {
    setSelectedValores((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  };

  // Reconhecimento de voz (com suporte a Web Speech API + Fallback)
  const handleSpeech = (target: 'title' | 'desc') => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'pt-BR';
        recognition.continuous = false;

        if (target === 'title') setIsListeningTitle(true);
        if (target === 'desc') setIsListeningDesc(true);

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (target === 'title') {
            setTitulo((prev) => (prev ? `${prev} ${transcript}` : transcript));
            setIsListeningTitle(false);
          } else {
            setDescricao((prev) => (prev ? `${prev} ${transcript}` : transcript));
            setIsListeningDesc(false);
          }
        };

        recognition.onerror = () => {
          if (target === 'title') setIsListeningTitle(false);
          if (target === 'desc') setIsListeningDesc(false);
        };

        recognition.onend = () => {
          setIsListeningTitle(false);
          setIsListeningDesc(false);
        };

        recognition.start();
        return;
      } catch (e) {
        console.warn('Speech recognition error:', e);
      }
    }

    // Fallback amigável se a API não estiver disponível no navegador
    if (target === 'title') {
      setIsListeningTitle(true);
      setTimeout(() => {
        setTitulo('Atividade Sensorial com Guache e Texturas');
        setIsListeningTitle(false);
      }, 1500);
    } else {
      setIsListeningDesc(true);
      setTimeout(() => {
        setDescricao(
          `${studentName} explorou as tintas sensoriais com muita curiosidade, sorrindo ao descobrir novas combinações de cores e compartilhando o pincel com os colegas.`
        );
        setIsListeningDesc(false);
      }, 1500);
    }
  };

  // Captura de Foto (seja da Câmera ou da Galeria)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setFotoUrl(uploadEvent.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !descricao.trim()) return;

    const categoryLabels: Record<LembrancaCategory, string> = {
      atividade: 'ATIVIDADE PEDAGÓGICA',
      conquista: 'PRIMEIRA CONQUISTA',
      foto: 'MOMENTO FOTOGRÁFICO',
      evolucao: 'MARCO DE EVOLUÇÃO',
      relatorio: 'PARECER AFETIVO',
    };

    onSave({
      studentId: 'mariana_souza_01',
      titulo,
      tipo: categoria,
      tipoLabel: categoryLabels[categoria] || 'ATIVIDADE PEDAGÓGICA',
      data: new Date(data).toLocaleDateString('pt-BR'),
      descricao,
      fotoUrl: fotoUrl.trim() || undefined,
      foco: selectedBncc,
      valores: selectedValores,
      gestosAfeto: [
        { label: 'Que encanto!', count: 1 },
        { label: 'Feito com amor', count: 1 },
      ],
      postarRedesSociais,
      fotoOcultaRedes: postarRedesSociais ? ocultarFotoCrianca : false,
      mensagemAfetoRedes: postarRedesSociais && ocultarFotoCrianca ? mensagemAfeto : undefined,
    });

    onClose();
    setTitulo('');
    setDescricao('');
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-amber-300 shadow-xl space-y-6 animate-fadeIn relative">
      {/* Botão de Fechar Superior */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
        title="Fechar Formulário"
      >
        <X size={22} />
      </button>

      {/* Título do Card */}
      <div className="flex items-center gap-3 pr-10 border-b border-amber-100 pb-4">
        <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-black text-xl shadow-xs">
          📷
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight">
            Cultivar uma Nova Lembrança ou Escrever uma Nova Página da Jornada
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Registro afetivo e pedagógico na história de <strong className="text-slate-700">{studentName}</strong>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Grid Principal de 3 Colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna 1: Título, Categoria e Data */}
          <div className="space-y-4">
            {/* Título do Momento */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  Título do Momento:
                </label>
                <button
                  type="button"
                  onClick={() => handleSpeech('title')}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer ${
                    isListeningTitle
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                  }`}
                >
                  <Mic size={12} />
                  <span>{isListeningTitle ? 'Ouvindo...' : 'Falar por Voz'}</span>
                </button>
              </div>
              <input
                type="text"
                required
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Primeiros passinhos independentes!"
                className="w-full text-sm p-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition bg-slate-50/50"
              />
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                Categoria:
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as LembrancaCategory)}
                className="w-full text-sm p-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition bg-slate-50/50 cursor-pointer font-bold text-slate-700"
              >
                <option value="atividade">Atividade Pedagógica</option>
                <option value="conquista">Primeira Conquista</option>
                <option value="foto">Momento Fotográfico</option>
                <option value="evolucao">Marco de Evolução</option>
                <option value="relatorio">Parecer Afetivo</option>
              </select>
            </div>

            {/* Data */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                Data:
              </label>
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full text-sm p-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition bg-slate-50/50 text-slate-700 font-medium"
              />
            </div>
          </div>

          {/* Coluna 2: Relato / Descrição e BNCC */}
          <div className="space-y-4">
            {/* Relato / Descrição */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  Relato / Descrição Detalhada:
                </label>
                <button
                  type="button"
                  onClick={() => handleSpeech('desc')}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer ${
                    isListeningDesc
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                  }`}
                >
                  <Mic size={12} />
                  <span>{isListeningDesc ? 'Ouvindo...' : 'Falar por Voz'}</span>
                </button>
              </div>
              <textarea
                required
                rows={4}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Relate como foi a conquista, a reacao do aluno, as habilidades observadas e o sentimento desse momento..."
                className="w-full text-sm p-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition bg-slate-50/50 resize-none"
              />
            </div>

            {/* Habilidades Estimuladas (Tag BNCC) */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                Habilidades Estimuladas (Tag BNCC):
              </label>
              <div className="flex flex-wrap gap-1.5">
                {BNCC_TAGS.map((tag) => {
                  const isSelected = selectedBncc.includes(tag);
                  return (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => toggleBncc(tag)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {isSelected && <Check size={12} />}
                      <span>{tag}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Coluna 3: Foto do Momento (Câmera Celular, Galeria, Preset e URL) */}
          <div className="space-y-4">
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
              Foto do Momento (Câmera ou Galeria):
            </label>

            {/* Input Escondido: Galeria */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Input Escondido: Câmera do Celular em Tempo Real */}
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Botões de Ação para Foto */}
            <div className="grid grid-cols-2 gap-2">
              {/* Botão Câmera Celular */}
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-95 border border-emerald-500"
              >
                <Camera size={16} className="stroke-[2.5]" />
                <span className="truncate">Tirar Foto Agora</span>
              </button>

              {/* Botão Galeria */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-indigo-50 border-2 border-indigo-200 hover:bg-indigo-100 text-indigo-800 font-black text-xs py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              >
                <Upload size={14} />
                <span className="truncate">Da Galeria</span>
              </button>
            </div>

            {/* Preview da Foto Selecionada */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 relative space-y-3">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-emerald-700 uppercase tracking-wider font-black flex items-center gap-1">
                  ✨ FOTO PRONTA PARA POSTAR
                </span>
                <button
                  type="button"
                  onClick={() => setFotoUrl('')}
                  className="text-rose-600 hover:text-rose-700 hover:underline cursor-pointer font-bold"
                >
                  Remover Foto
                </button>
              </div>

              {fotoUrl ? (
                <div className="w-full h-40 rounded-xl overflow-hidden bg-slate-200 relative border border-slate-200 shadow-inner">
                  <img
                    src={fotoUrl}
                    alt="Preview do momento capturado"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-full h-40 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                  <ImageIcon size={32} />
                  <p className="text-xs font-bold mt-2">Toque em "Tirar Foto Agora" para fotografar</p>
                </div>
              )}

              {/* Selector de Ilustrações Pedagógicas Rápidas */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold text-slate-500">
                  Ou escolha uma ilustração pedagógica rápida:
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {PRESET_ILLUSTRATIONS.map((preset, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setFotoUrl(preset)}
                      className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition cursor-pointer flex-shrink-0 ${
                        fotoUrl === preset ? 'border-amber-500 ring-2 ring-amber-300' : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={preset} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* URL da imagem e nome de Anexo */}
              <div className="space-y-2 pt-1 border-t border-slate-200">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-0.5">
                    Ou cole um link direto de imagem (URL):
                  </label>
                  <input
                    type="url"
                    value={fotoUrl}
                    onChange={(e) => setFotoUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg outline-none bg-white text-slate-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-0.5">
                    Nome do Anexo (PDF/Certificado opcional):
                  </label>
                  <input
                    type="text"
                    value={nomeAnexo}
                    onChange={(e) => setNomeAnexo(e.target.value)}
                    placeholder="Ex: certificado_pintor_mirim.pdf"
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg outline-none bg-white text-slate-600"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Linha Inferior: Valores Vivenciados & Opções de Destaque / Replicação */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
          {/* Esquerda: Valores Vivenciados */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <Star size={16} className="text-amber-500 fill-amber-400" />
              <span>Valores Vivenciados (Desenvolvimento Humano):</span>
            </h4>
            <p className="text-xs text-slate-500 font-medium">
              Selecione quais valores humanos o anjinho demonstrou durante este momento especial:
            </p>

            <div className="flex flex-wrap gap-2">
              {HUMAN_VALUES.map((valor) => {
                const isSelected = selectedValores.includes(valor);
                return (
                  <button
                    type="button"
                    key={valor}
                    onClick={() => toggleValor(valor)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-amber-100 border-amber-400 text-amber-950 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-md border flex items-center justify-center ${isSelected ? 'bg-amber-500 border-amber-600 text-white' : 'border-slate-300'}`}>
                      {isSelected && <Check size={10} strokeWidth={3} />}
                    </span>
                    <span>{valor}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Direita: Checkboxes de Destaque e Replicação */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
            {/* Destacar como Momento Inesquecível */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={isDestaque}
                onChange={(e) => setIsDestaque(e.target.checked)}
                className="mt-1 w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-400 cursor-pointer"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <MessageSquare size={14} className="text-amber-500" />
                  Destacar como "Momento Inesquecível"
                </span>
                <p className="text-[11px] font-medium text-slate-500 leading-tight">
                  Selecione isso se este for um registro que merece ser lembrado para sempre. Ele aparecerá com destaque especial e design de recordação no álbum.
                </p>
              </div>
            </label>

            {/* Replicar para a Classe Toda */}
            <label className="flex items-start gap-3 cursor-pointer group pt-2 border-t border-slate-200">
              <input
                type="checkbox"
                checked={replicarTurma}
                onChange={(e) => setReplicarTurma(e.target.checked)}
                className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-400 cursor-pointer"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Users size={14} className="text-indigo-600" />
                  Replicar para a Classe Toda (Maternal I)
                </span>
                <p className="text-[11px] font-medium text-slate-500 leading-tight">
                  Selecione para salvar automaticamente esta mesma atividade pedagógica na linha do tempo de todos os alunos desta mesma turma de forma simultânea.
                </p>
              </div>
            </label>

            {/* Postar nas Redes Sociais da Escola */}
            <label className="flex items-start gap-3 cursor-pointer group pt-2 border-t border-slate-200">
              <input
                type="checkbox"
                checked={postarRedesSociais}
                onChange={(e) => setPostarRedesSociais(e.target.checked)}
                className="mt-1 w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-400 cursor-pointer"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Share2 size={14} className="text-teal-600" />
                  Postar nas Redes Sociais da Escola (Instagram / WhatsApp)
                </span>
                <p className="text-[11px] font-medium text-slate-500 leading-tight">
                  Gere cards comemorativos prontos para publicação. Se não houver autorização da família, ative a opção de ocultar a foto da criança para exibir uma linda mensagem afetiva com blindagem LGPD.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Seção Redes Sociais com Opção de Ocultar Foto da Criança e Mensagem de Afeto */}
        {postarRedesSociais && (
          <CardRedesSociaisPreview
            titulo={titulo}
            descricao={descricao}
            data={new Date(data).toLocaleDateString('pt-BR')}
            studentName={studentName}
            fotoUrl={fotoUrl}
            selectedBncc={selectedBncc}
            ocultarFotoCrianca={ocultarFotoCrianca}
            onToggleOcultarFoto={setOcultarFotoCrianca}
            mensagemAfeto={mensagemAfeto}
            onChangeMensagemAfeto={setMensagemAfeto}
          />
        )}

        {/* Botões Finais de Envio */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3.5 border border-slate-200 text-slate-600 hover:bg-slate-50 font-black text-xs rounded-2xl transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-amber-950 font-black text-xs sm:text-sm rounded-2xl shadow-lg transition transform cursor-pointer active:scale-98 flex items-center justify-center gap-2 border border-amber-300"
          >
            <Sparkles size={16} />
            <span>Eternizar Lembrança e Salvar no Álbum</span>
          </button>
        </div>
      </form>
    </div>
  );
}
