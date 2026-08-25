import { Idoso, Usuario, Medicamento, CompromissoMedico, TarefaDiaria, SinalVital, RegistroHidratacao, RegistroSono, RegistroHumor, RegistroAlimentacao, RegistroAtividade, NotificacaoSimulada, Classroom } from './types';
import { SYNC_COLLECTIONS_MAP, saveToFirestore, deleteFromFirestore, deleteBatchFromFirestore, getFirestoreCollectionForKey, notifyCrossTabSync, deleteStudentDataFromFirestore } from './firebase';

// Simulation Configuration
export const USUARIOS_SIMULADOS: Usuario[] = [
  {
    id: 'user_desenvolvedor_djalma',
    nome: 'Djalma Amaral (Desenvolvedor Dev)',
    email: 'djalmaamaral36@gmail.com',
    telefone: '(11) 98765-9181',
    tipo: 'desenvolvedor',
    parentesco: 'Desenvolvedor Master',
    foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Desenvolvedor e Criador da Plataforma. Possui acesso total e privilégios master.',
    pin: '9181'
  },
  {
    id: 'user_admin',
    nome: 'Nilva Amaral (Diretora)',
    email: 'nilva.amaral@escola.com',
    telefone: '(11) 98765-3031',
    tipo: 'diretor',
    parentesco: 'Diretora Escolar',
    foto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Diretora e Gestora Geral da Instituição de Ensino Anjinho Escolar.',
    pin: '3031'
  },
  {
    id: 'user_cuidador_1',
    nome: 'Ana Silva (Cuidadora)',
    email: 'ana.silva@cuidadora.com',
    telefone: '(11) 91234-5678',
    tipo: 'cuidador',
    foto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Professora e cuidadora titular do Berçário I - B. Atenciosa e pontual.',
    pin: '5678',
    salaAula: 'Berçário I - B'
  },
  {
    id: 'user_cuidador_m2',
    nome: 'Profª Cláudia Lemos (Educadora)',
    email: 'claudia.lemos@escola.com',
    telefone: '(11) 92222-2222',
    tipo: 'cuidador',
    foto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Professora titular do Maternal II. Especialista em desenvolvimento infantil.',
    pin: '2222',
    salaAula: 'Maternal II - A'
  },
  {
    id: 'user_cuidador_j1',
    nome: 'Profª Fernanda Melo (Educadora)',
    email: 'fernanda.melo@escola.com',
    telefone: '(11) 93333-3333',
    tipo: 'cuidador',
    foto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Professora titular do Jardim I. Apaixonada por atividades artísticas e lúdicas.',
    pin: '3333',
    salaAula: 'Maternal I - A'
  },
  {
    id: 'user_cuidador_j2',
    nome: 'Profª Sandra Reis (Educadora)',
    email: 'sandra.reis@escola.com',
    telefone: '(11) 94444-4444',
    tipo: 'cuidador',
    foto: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Professora titular do Maternal I - B. Acompanhamento do desenvolvimento e rotina.',
    pin: '4444',
    salaAula: 'Maternal I - B'
  },
  {
    id: 'user_cuidador_b1',
    nome: 'Profª Sofia Mendes (Educadora)',
    email: 'sofia.mendes@escola.com',
    telefone: '(11) 95555-1111',
    tipo: 'cuidador',
    foto: 'https://images.unsplash.com/photo-1594744803329-e58b31de215f?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Professora titular do Berçário I. Especialista em cuidados com lactentes e estimulação precoce.',
    pin: '1111',
    salaAula: 'Berçário I - A'
  },
  {
    id: 'user_cuidador_b2',
    nome: 'Profª Renata Santos (Educadora)',
    email: 'renata.santos@escola.com',
    telefone: '(11) 96666-6666',
    tipo: 'cuidador',
    foto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Professora titular do Berçário II. Focada no desenvolvimento motor e sensorial dos bebês.',
    pin: '6666',
    salaAula: 'Berçário II'
  },
  {
    id: 'user_cuidador_m2b',
    nome: 'Profª Márcia Toledo (Educadora)',
    email: 'marcia.toledo@escola.com',
    telefone: '(11) 98844-1122',
    tipo: 'cuidador',
    foto: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Professora titular do Maternal II - B. Focada em contação de histórias.',
    pin: '1122',
    salaAula: 'Maternal II - B'
  },
  {
    id: 'user_cuidador_m2c',
    nome: 'Profª Luísa Castro (Educadora)',
    email: 'luisa.castro@escola.com',
    telefone: '(11) 99221-1234',
    tipo: 'cuidador',
    foto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Professora titular do Maternal II - C. Especialista em ludicidade.',
    pin: '1234',
    salaAula: 'Maternal II - C'
  },
  {
    id: 'user_cuidador_j1a',
    nome: 'Profª Bruna Rocha (Educadora)',
    email: 'bruna.rocha@escola.com',
    telefone: '(11) 98811-2244',
    tipo: 'cuidador',
    foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Professora titular do Jardim I - A. Ensino bilíngue e projetos visuais.',
    pin: '2244',
    salaAula: 'Jardim I - A'
  },
  {
    id: 'user_cuidador_j1b',
    nome: 'Profª Camila Castro (Educadora)',
    email: 'camila.castro@escola.com',
    telefone: '(11) 99823-3344',
    tipo: 'cuidador',
    foto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Professora titular do Jardim I - B. Expressão artística e musicalização.',
    pin: '3344',
    salaAula: 'Jardim I - B'
  },
  {
    id: 'user_cuidador_j2a',
    nome: 'Profª Estela Pinto (Educadora)',
    email: 'estela.pinto@escola.com',
    telefone: '(11) 98711-4422',
    tipo: 'cuidador',
    foto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Professora titular do Jardim II - A. Focada no letramento lógico-matemático.',
    pin: '4422',
    salaAula: 'Jardim II - A'
  },
  {
    id: 'user_cuidador_j2b',
    nome: 'Profª Tatiana Machado (Educadora)',
    email: 'tatiana.machado@escola.com',
    telefone: '(11) 99311-4455',
    tipo: 'cuidador',
    foto: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Professora titular do Jardim II - B. Transição suave para o Ensino Fundamental.',
    pin: '4455',
    salaAula: 'Jardim II - B'
  },
  {
    id: 'user_cuidador_m1c',
    nome: 'Profª Milena Dias (Educadora)',
    email: 'milena.dias@escola.com',
    telefone: '(11) 99211-5544',
    tipo: 'cuidador',
    foto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Professora titular do Maternal I - C. Musicalização e psicomotricidade.',
    pin: '5544',
    salaAula: 'Maternal I - C'
  },
  {
    id: 'user_cuidador_m1d',
    nome: 'Profª Luciana Ferraz (Educadora)',
    email: 'luciana.ferraz@escola.com',
    telefone: '(11) 99115-6655',
    tipo: 'cuidador',
    foto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Professora titular do Maternal I - D. Exploração da natureza e socialização.',
    pin: '6655',
    salaAula: 'Maternal I - D'
  },
  {
    id: 'user_cuidador_b3',
    nome: 'Profª Vanessa Luz (Educadora)',
    email: 'vanessa.luz@escola.com',
    telefone: '(11) 98877-3311',
    tipo: 'cuidador',
    foto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Professora titular do Berçário III. Desenvolvimento sensorial e psicomotor.',
    pin: '3311',
    salaAula: 'Berçário III'
  },
  {
    id: 'user_medico_1',
    nome: 'Dr. Roberto K. (Médico)',
    email: 'roberto.kardec@clinica.com',
    telefone: '(11) 99999-8888',
    tipo: 'profissional',
    foto: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Geriatra e cardiologista do idoso.',
    pin: '8888'
  },
  {
    id: 'user_mae_clarice',
    nome: 'Clarice Souza (Mãe (Responsável))',
    email: 'clarice.souza@gmail.com',
    telefone: '(11) 98765-4321',
    tipo: 'familiar',
    parentesco: 'Mãe (Responsável)',
    foto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Mãe e responsável legal da aluna Mariana Souza (Berçário I - A).',
    pin: '4321'
  },
  {
    id: 'user_pai_thiago',
    nome: 'Thiago Alencar (Pai)',
    email: 'thiago.alencar@outlook.com',
    telefone: '(11) 95555-4440',
    tipo: 'familiar',
    parentesco: 'Pai',
    foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Pai do Enzo Alencar (Berçário I - A) e familiar do Seu João Alencar.',
    pin: '4440'
  },
  {
    id: 'user_mae_beatriz',
    nome: 'Mariana Castro (Mãe)',
    email: 'mariana.castro@gmail.com',
    telefone: '(11) 99823-3310',
    tipo: 'familiar',
    parentesco: 'Mãe',
    foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Mãe da Beatriz Castro (Berçário I - A). Acompanha a rotina da filha.',
    pin: '3310'
  },
  {
    id: 'user_pai_bernardo',
    nome: 'Julio Lima (Pai)',
    email: 'julio.lima@outlook.com',
    telefone: '(11) 98711-2233',
    tipo: 'familiar',
    parentesco: 'Pai',
    foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Pai do Bernardo Lima (Berçário I - A). Acompanha a rotina escolar.',
    pin: '2233'
  },
  {
    id: 'user_mae_heitor',
    nome: 'Gabriela Ramos (Mãe)',
    email: 'gabriela.ramos@gmail.com',
    telefone: '(11) 99122-8877',
    tipo: 'familiar',
    parentesco: 'Mãe',
    foto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Mãe do Heitor Ramos (Berçário I - A). Focada no desenvolvimento.',
    pin: '8877'
  },
  {
    id: 'user_mae_alice',
    nome: 'Juliana Santos (Mãe)',
    email: 'juliana.santos@gmail.com',
    telefone: '(11) 98844-3322',
    tipo: 'familiar',
    parentesco: 'Mãe',
    foto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Mãe da Alice Santos (Berçário I - B).',
    pin: '3322'
  },
  {
    id: 'user_cuidador_2',
    nome: 'Carlos Souza (Pai/Familiar)',
    email: 'carlos.souza@outlook.com',
    telefone: '(11) 95555-9944',
    tipo: 'familiar',
    parentesco: 'Pai / Neto',
    foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Pai do Arthur Oliveira (Berçário I - B) e familiar.',
    pin: '9944'
  },
  {
    id: 'user_mae_sophia',
    nome: 'Débora Gomes (Mãe)',
    email: 'debora.gomes@gmail.com',
    telefone: '(11) 99881-1121',
    tipo: 'familiar',
    parentesco: 'Mãe',
    foto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Mãe da Sophia Gomes (Berçário I - B).',
    pin: '1121'
  },
  {
    id: 'user_mae_laura',
    nome: 'Marisa Mel (Mãe)',
    email: 'marisa.mel@gmail.com',
    telefone: '(11) 98811-2241',
    tipo: 'familiar',
    parentesco: 'Mãe',
    foto: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Mãe da Laura Mel (Berçário I - B).',
    pin: '2241'
  },
  {
    id: 'user_pai_livia',
    nome: 'Felipe Teixeira (Pai)',
    email: 'felipe.teixeira@outlook.com',
    telefone: '(11) 98822-3321',
    tipo: 'familiar',
    parentesco: 'Pai',
    foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Pai da Lívia Teixeira (Berçário I - B).',
    pin: '3321'
  },
  {
    id: 'user_mae_davi',
    nome: 'Aline Cardozo (Mãe)',
    email: 'aline.cardozo@gmail.com',
    telefone: '(11) 99115-5561',
    tipo: 'familiar',
    parentesco: 'Mãe',
    foto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Mãe do Davi Cardozo (Berçário II).',
    pin: '5561'
  },
  {
    id: 'user_mae_gabriel',
    nome: 'Tatiane Silva (Mãe)',
    email: 'tatiane.silva@gmail.com',
    telefone: '(11) 99221-6651',
    tipo: 'familiar',
    parentesco: 'Mãe',
    foto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Mãe do Gabriel Silva (Berçário II).',
    pin: '6651'
  },
  {
    id: 'user_pai_miguel',
    nome: 'Otávio Nunes (Pai)',
    email: 'otavio.nunes@yahoo.com.br',
    telefone: '(11) 98722-1133',
    tipo: 'familiar',
    parentesco: 'Pai',
    foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Pai do Miguel Nunes (Berçário II). Recebe atualizações em tempo real.',
    pin: '1133'
  },
  {
    id: 'user_mae_helena_f',
    nome: 'Márcia Ferraz (Mãe)',
    email: 'marcia.ferraz@gmail.com',
    telefone: '(11) 98844-5541',
    tipo: 'familiar',
    parentesco: 'Mãe',
    foto: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Mãe da Helena Ferraz (Berçário II).',
    pin: '5541'
  },
  {
    id: 'user_mae_manuela',
    nome: 'Vanessa Rocha (Mãe)',
    email: 'vanessa.rocha@gmail.com',
    telefone: '(11) 98811-2242',
    tipo: 'familiar',
    parentesco: 'Mãe',
    foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Mãe da Manuela Rocha (Berçário II).',
    pin: '2242'
  },
  {
    id: 'user_pai_matheus',
    nome: 'Ricardo Barbosa (Pai)',
    email: 'ricardo.barbosa@outlook.com',
    telefone: '(11) 98711-1101',
    tipo: 'familiar',
    parentesco: 'Pai',
    foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Pai do Matheus Barbosa (Maternal I - A).',
    pin: '1101'
  },
  {
    id: 'user_mae_lucas',
    nome: 'Silvia Barros (Mãe)',
    email: 'silvia.barros@gmail.com',
    telefone: '(11) 99122-4411',
    tipo: 'familiar',
    parentesco: 'Mãe',
    foto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Mãe do Lucas Barros (Maternal I - A).',
    pin: '4411'
  },
  {
    id: 'user_mae_samuel',
    nome: 'Fernanda Mendes (Mãe)',
    email: 'fernanda.mendes@gmail.com',
    telefone: '(11) 99311-4431',
    tipo: 'familiar',
    parentesco: 'Mãe',
    foto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Mãe do Samuel Mendes (Maternal I - B).',
    pin: '4431'
  },
  {
    id: 'user_pai_giovanna',
    nome: 'Maurício Fonseca (Pai)',
    email: 'mauricio.fonseca@outlook.com',
    telefone: '(11) 99122-8871',
    tipo: 'familiar',
    parentesco: 'Pai',
    foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Pai da Giovanna Fonseca (Maternal I - B).',
    pin: '8871'
  },
  {
    id: 'user_pai_felipe',
    nome: 'Renato Antunes (Pai)',
    email: 'renato.antunes@outlook.com',
    telefone: '(11) 98711-2231',
    tipo: 'familiar',
    parentesco: 'Pai',
    foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Pai do Felipe Antunes (Maternal I - C). Apenas perfil de pai/responsável.',
    pin: '2231'
  },
  {
    id: 'user_mae_lorena',
    nome: 'Helena Machado (Mãe)',
    email: 'helena.machado@gmail.com',
    telefone: '(11) 99311-4451',
    tipo: 'familiar',
    parentesco: 'Mãe',
    foto: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Mãe da Lorena Machado (Maternal I - D).',
    pin: '4451'
  },
  {
    id: 'user_mae_pedro',
    nome: 'Fabiana Lima (Mãe)',
    email: 'fabiana.lima@gmail.com',
    telefone: '(11) 98877-6641',
    tipo: 'familiar',
    parentesco: 'Mãe',
    foto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Mãe do Pedro Henrique (Berçário III).',
    pin: '6641'
  },
  {
    id: 'user_pai_theo',
    nome: 'Marcelo Lemos (Pai)',
    email: 'marcelo.lemos@outlook.com',
    telefone: '(11) 92222-2211',
    tipo: 'familiar',
    parentesco: 'Pai',
    foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Pai do Theo Lemos (Maternal II - A).',
    pin: '2211'
  },
  {
    id: 'user_mae_heloisa',
    nome: 'Carolina Toledo (Mãe)',
    email: 'carolina.toledo@gmail.com',
    telefone: '(11) 98844-1123',
    tipo: 'familiar',
    parentesco: 'Mãe',
    foto: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Mãe da Heloísa Toledo (Maternal II - B).',
    pin: '1123'
  },
  {
    id: 'user_mae_nicolas',
    nome: 'Fernanda Castro (Mãe)',
    email: 'fernanda.castro@gmail.com',
    telefone: '(11) 99221-1231',
    tipo: 'familiar',
    parentesco: 'Mãe',
    foto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Mãe do Nicolas Castro (Maternal II - C).',
    pin: '1231'
  },
  {
    id: 'user_pai_cecilia',
    nome: 'Eduardo Rocha (Pai)',
    email: 'eduardo.rocha@outlook.com',
    telefone: '(11) 98811-2243',
    tipo: 'familiar',
    parentesco: 'Pai',
    foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Pai da Cecília Rocha (Jardim I - A).',
    pin: '2243'
  },
  {
    id: 'user_mae_joaquim',
    nome: 'Juliana Dias (Mãe)',
    email: 'juliana.dias@gmail.com',
    telefone: '(11) 99877-7788',
    tipo: 'familiar',
    parentesco: 'Mãe',
    foto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Mãe do Joaquim Dias (Jardim I - B). Apenas perfil de mãe/responsável.',
    pin: '7788'
  },
  {
    id: 'user_mae_valentina',
    nome: 'Patrícia Pinto (Mãe)',
    email: 'patricia.pinto@gmail.com',
    telefone: '(11) 98711-4412',
    tipo: 'familiar',
    parentesco: 'Mãe',
    foto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Mãe da Valentina Pinto (Jardim II - A).',
    pin: '4412'
  },
  {
    id: 'user_pai_isabella',
    nome: 'Jorge Cardoso (Pai)',
    email: 'jorge.cardoso@outlook.com',
    telefone: '(11) 99311-3322',
    tipo: 'familiar',
    parentesco: 'Pai',
    foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Pai da Isabella Cardoso (Jardim II - B).',
    pin: '3322'
  },
  {
    id: 'user_familiar_convidado',
    nome: 'Tio Roberto (Familiar Convidado)',
    email: 'roberto.convidado@gmail.com',
    telefone: '(11) 97777-6655',
    tipo: 'familiar_convidado',
    parentesco: 'Familiar (Convidado)',
    foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    observacoes: 'Familiar Convidado com acesso apenas de leitura ao diário (sem permissão de autorizar ou cadastrar medicamentos).',
    pin: '6677'
  }
];

export const IDOSOS_INICIAIS: Idoso[] = [
  {
    id: 'idoso_maria',
    nome: 'Dona Maria de Souza',
    foto: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?auto=format&fit=crop&q=80&w=200',
    dataNascimento: '14/08/1944', // 81 anos (em 2026)
    condicoesMedicas: ['Hipertensão', 'Alzheimer Estágio Leve', 'Osteoporose'],
    alergias: ['Penicilina', 'Dipirona Sódica'],
    observacoes: 'Dona Maria gosta de ouvir música instrumental antiga durante o banho. Às vezes resiste à medicação das 21:00, precisando de paciência e uma abordagem lúdica.',
    contatoEmergencia: {
      nome: 'Clarice Souza',
      parentesco: 'Filha (Administradora)',
      telefone: '(11) 98765-4321'
    },
    planoCuidado: 'Incentivar caminhadas breves diárias, insistir na hidratação constante (mínimo 1.5L/dia), realizar atividades repetitivas de memória (álbum de fotos).',
    medicoResponsavel: {
      nome: 'Dr. Roberto Kardec',
      especialidade: 'Geriatra & Cardiologista',
      telefone: '(11) 99999-8888'
    }
  },
  {
    id: 'idoso_joao',
    nome: 'Seu João Alencar',
    foto: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=200',
    dataNascimento: '23/11/1947', // 78 anos (em 2026)
    condicoesMedicas: ['Diabetes Tipo 2', 'Artrose nos Joelhos', 'Insuficiência Venosa'],
    alergias: ['Corantes Vermelhos'],
    observacoes: 'Seu João é muito lúcido, mas tem dificuldade de mobilidade física. Necessita de auxílio para apoiar-se durante o banho e nas transferências. Adora ler notícias no jornal de manhã.',
    contatoEmergencia: {
      nome: 'Thiago Alencar',
      parentesco: 'Neto',
      telefone: '(11) 95555-4440'
    },
    planoCuidado: 'Fisioterapia para controle da artrose 2x na semana, aferição de glicemia capilar em jejum e após refeições principais, monitoramento e higienização cuidadosa das pernas devido à má circulação.',
    medicoResponsavel: {
      nome: 'Dra. Helena Mendes',
      especialidade: 'Endocrinologista',
      telefone: '(11) 97777-6666'
    }
  },
  /* --- 29 PRE-REGISTERED PRE-SCHOOL STUDENTS (SALA DE PARCERÍA DOS ANJINHOS) --- */
  {
    id: 'aluno_1',
    nome: 'Mariana Souza (Berçário I - A - 8 Meses)',
    salaAula: 'Berçário I - A',
    quarto: 'Berçário I - A',
    foto: 'https://images.unsplash.com/photo-1519689680058-324335c77ebd?auto=format&fit=crop&q=80&w=150',
    dataNascimento: '12/10/2023',
    condicoesMedicas: ['Soneca após o almoço (requer chupeta para dormir)', 'Verificar dentes de leite nascendo'],
    alergias: ['Leite Integral (lactose)', 'Picada de Pernilongo'],
    observacoes: 'Mariana gosta de dormir with seu ursinho de pelúcia azul. Toma água na canequinha térmica após as refeições.',
    contatoEmergencia: {
      nome: 'Clarice Souza',
      parentesco: 'Mãe (Responsável)',
      telefone: '(11) 98765-4321'
    },
    planoCuidado: 'Oferecer água na canequinha a cada 1h. Verificar troca de fralda antes e depois de dormir. Estimular atividades lúdicas.',
    medicoResponsavel: {
      nome: 'Dra. Luana Peixoto',
      especialidade: 'Pediatra Geral',
      telefone: '(11) 98888-7777'
    }
  },
  {
    id: 'aluno_2',
    nome: 'Enzo Alencar (Berçário I - A - 10 Meses)',
    salaAula: 'Berçário I - A',
    quarto: 'Berçário I - A',
    foto: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&q=80&w=150',
    dataNascimento: '15/03/2022',
    condicoesMedicas: ['Subindo degraus com apoio', 'Asma Alérgica leve'],
    alergias: ['Frutos Vermelhos', 'Pó e Ácaros'],
    observacoes: 'Enzo adora dinossauros e brinquedos de montar. Precisa de incentivo para ir à bacia no desfralde.',
    contatoEmergencia: {
      nome: 'Thiago Alencar',
      parentesco: 'Pai',
      telefone: '(11) 95555-4440'
    },
    planoCuidado: 'Auxiliar na ida ao banheiro a cada 2h. Administrar bombinha caso haja tosse seca frequente.',
    medicoResponsavel: {
      nome: 'Dr. Lucas Mendes',
      especialidade: 'Alergista Infantil',
      telefone: '(11) 97777-6666'
    }
  },
  {
    id: 'aluno_3',
    nome: 'Beatriz Castro (Berçário I - A - 11 Meses)',
    salaAula: 'Berçário I - A',
    quarto: 'Berçário I - A',
    foto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150',
    dataNascimento: '18/07/2021',
    condicoesMedicas: ['Usa óculos corretivos (reforçar uso)', 'Dificuldade leve na mastigação'],
    alergias: ['Corante Amarelo Tartrazina'],
    observacoes: 'Beatriz gosta de desenhar princesas. Muito dócil e concentrada nas dinâmicas de roda.',
    contatoEmergencia: {
      nome: 'Mariana Castro',
      parentesco: 'Mãe',
      telefone: '(11) 99823-3310'
    },
    planoCuidado: 'Garantir que ela não retire os óculos durante as tarefas de corte e colagem. Cortar frutas em pedaços miúdos.',
    medicoResponsavel: {
      nome: 'Dra. Patrícia Faro',
      especialidade: 'Oftalmopediatria',
      telefone: '(11) 99342-8888'
    }
  },
  {
    id: 'aluno_4',
    nome: 'Bernardo Lima (Berçário I - A - 11 Meses)',
    salaAula: 'Berçário I - A',
    quarto: 'Berçário I - A',
    foto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=150',
    dataNascimento: '05/01/2024',
    condicoesMedicas: ['Refluxo gastroesofágico controlado', 'Usa fralda comum'],
    alergias: ['Glúten (Intolerância leve)'],
    observacoes: 'Bernardo adora imitar os sons dos animais. Gosta de ser ninado no colinho antes de deitar no tatame.',
    contatoEmergencia: {
      nome: 'Julio Lima',
      parentesco: 'Pai',
      telefone: '(11) 98711-2233'
    },
    planoCuidado: 'Deixá-lo descansando em plano levemente elevado por 20min após o almoço ou mamadeira. Evitar bolachas com trigo.',
    medicoResponsavel: {
      nome: 'Dr. Roberto Cardoso',
      especialidade: 'Gastroenterologia Ped.',
      telefone: '(11) 91122-3344'
    }
  },
  {
    id: 'aluno_5',
    nome: 'Heitor Ramos (Berçário I - A - 9 Meses)',
    salaAula: 'Berçário I - A',
    quarto: 'Berçário I - A',
    foto: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=150',
    dataNascimento: '29/09/2022',
    condicoesMedicas: ['Desfralde completo', 'Muito agitado no pátio'],
    alergias: ['Frutos do Mar (crítico)'],
    observacoes: 'Heitor corre muito e adora futebol de salão. Tem sono leve.',
    contatoEmergencia: {
      nome: 'Gabriela Ramos',
      parentesco: 'Mãe',
      telefone: '(11) 99122-8877'
    },
    planoCuidado: 'Oferecer atividades de acalmamento antes da soneca (contar histórias, sons calmos).',
    medicoResponsavel: {
      nome: 'Dra. Clara Silveira',
      especialidade: 'Pediatra Clinica',
      telefone: '(11) 97711-5544'
    }
  },
  {
    id: 'aluno_6',
    nome: 'Alice Santos (Berçário I - B - 11 Meses)',
    salaAula: 'Berçário I - B',
    quarto: 'Berçário I - B',
    foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    dataNascimento: '14/11/2023',
    condicoesMedicas: ['Respiração predominantemente bucal', 'Usa chupeta para dormir'],
    alergias: ['Amendoim e Castanhas'],
    observacoes: 'Acalma-se ouvindo cantigas de roda tradicionais. Muito apegada às professoras auxiliares.',
    contatoEmergencia: {
      nome: 'Juliana Santos',
      parentesco: 'Mãe',
      telefone: '(11) 98844-3322'
    },
    planoCuidado: 'Garantir higiene nasal frequente com soro fisiológico. Evitar qualquer biscoito com traços de oleaginosas.',
    medicoResponsavel: {
      nome: 'Dr. Marcelo Abreu',
      especialidade: 'Pediatra Otorrino',
      telefone: '(11) 98822-1100'
    }
  },
  {
    id: 'aluno_7',
    nome: 'Arthur Oliveira (Berçário I - B - 12 Meses)',
    salaAula: 'Berçário I - B',
    quarto: 'Berçário I - B',
    foto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150',
    dataNascimento: '02/02/2021',
    condicoesMedicas: ['Fácil distração nas rodinhas', 'Adora tarefas de desenho livre'],
    alergias: ['Picada de Abelha/Vespa (Trazer adrenalina na mala)'],
    observacoes: 'Arthur é extremamente criativo com massinha de modelar. Fala muito bem e lidera brincadeiras com blocos.',
    contatoEmergencia: {
      nome: 'Carlos Souza',
      parentesco: 'Pai',
      telefone: '(11) 95555-9944'
    },
    planoCuidado: 'Supervisão ativa no jardim externo devido a insetos. Estimular foco visual sustentado.',
    medicoResponsavel: {
      nome: 'Dra. Julia Sampaio',
      especialidade: 'Imunologista Infantil',
      telefone: '(11) 99114-4422'
    }
  },
  {
    id: 'aluno_8',
    nome: 'Sophia Gomes (Berçário I - B - 8 Meses)',
    salaAula: 'Berçário I - B',
    quarto: 'Berçário I - B',
    foto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150',
    dataNascimento: '17/05/2023',
    condicoesMedicas: ['Pele muito seca (requer hidratante)', 'Usa fralda à tarde'],
    alergias: ['Sabonetes perfumados and detergentes comuns'],
    observacoes: 'Fica tímida na entrada, mas adora a hora do parquinho de areia.',
    contatoEmergencia: {
      nome: 'Débora Gomes',
      parentesco: 'Mãe',
      telefone: '(11) 99881-1121'
    },
    planoCuidado: 'Passar hidratante neutro trazido na mochila após o banho/higienização dos locais de fralda.',
    medicoResponsavel: {
      nome: 'Dra. Vanessa Luz',
      especialidade: 'Dermatopediatria',
      telefone: '(11) 98877-3311'
    }
  },
  {
    id: 'aluno_9',
    nome: 'Laura Mel (Berçário I - B - 9 Meses)',
    salaAula: 'Berçário I - B',
    quarto: 'Berçário I - B',
    foto: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=150',
    dataNascimento: '11/12/2023',
    condicoesMedicas: ['Nascimento de molares', 'Chorinho fácil na soneca'],
    alergias: ['Proteína do Ovo'],
    observacoes: 'Laura gosta de mordedores gelados para aliviar as gengivas. Dorme abraçada com sua fraldinha de pano.',
    contatoEmergencia: {
      nome: 'Marisa Mel',
      parentesco: 'Mãe',
      telefone: '(11) 98811-2241'
    },
    planoCuidado: 'Oferecer mordedor higienizado resfriado. Substituir ovos/receitas por lanches especiais enviados de casa.',
    medicoResponsavel: {
      nome: 'Dra. Sofia Lima',
      especialidade: 'Odontopediatria',
      telefone: '(11) 91155-2244'
    }
  },
  {
    id: 'aluno_10',
    nome: 'Lívia Teixeira (Berçário I - B - 10 Meses)',
    salaAula: 'Berçário I - B',
    quarto: 'Berçário I - B',
    foto: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&q=80&w=150',
    dataNascimento: '30/08/2021',
    condicoesMedicas: ['Excelente coordenação motora', 'Gosta de ajudar a organizar a classe'],
    alergias: ['Corante Vermelho Allura'],
    observacoes: 'Lívia é muito independente, come sozinha e ajuda os colegas menores na hora do lanche.',
    contatoEmergencia: {
      nome: 'Felipe Teixeira',
      parentesco: 'Pai',
      telefone: '(11) 98822-3321'
    },
    planoCuidado: 'Estimular liderança positiva e atividades de pareamento lógico/quebra-cabeças complexos.',
    medicoResponsavel: {
      nome: 'Dr. Pedro Gusmão',
      especialidade: 'Pediatra de Rotina',
      telefone: '(11) 98811-7766'
    }
  },
  {
    id: 'aluno_11',
    nome: 'Davi Cardozo (Berçário II - 1 Ano)',
    salaAula: 'Berçário II',
    quarto: 'Berçário II',
    foto: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150',
    dataNascimento: '14/10/2020',
    condicoesMedicas: ['Pratica natação (atenção a ouvido úmido)', 'Hipersensibilidade auditiva leve'],
    alergias: ['Frutos do mar'],
    observacoes: 'Davi gosta de imitar super-heróis. Prefere ambientes de brincadeira estruturada.',
    contatoEmergencia: {
      nome: 'Aline Cardozo',
      parentesco: 'Mãe',
      telefone: '(11) 99115-5561'
    },
    planoCuidado: 'Secar bem os ouvidos após higienizações. Afastá-lo de som muito alto ou caixas de som no pátio.',
    medicoResponsavel: {
      nome: 'Dr. André Fonseca',
      especialidade: 'Otologista Ped.',
      telefone: '(11) 95533-2211'
    }
  },
  {
    id: 'aluno_12',
    nome: 'Gabriel Silva (Berçário II - 1 Ano)',
    salaAula: 'Berçário II',
    quarto: 'Berçário II',
    foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    dataNascimento: '21/01/2023',
    condicoesMedicas: ['Usa fralda descartável para dormir', 'Faz fonoaudiologia'],
    alergias: ['Poeria Extrema e Mofo'],
    observacoes: 'Gabriel adora brincar na mesa de água. Tem muito carinho por livros com texturas.',
    contatoEmergencia: {
      nome: 'Tatiane Silva',
      parentesco: 'Mãe',
      telefone: '(11) 99221-6651'
    },
    planoCuidado: 'Auxiliar na fala de forma bem articulada e incentivar que aponte e verbalize as necessidades diárias.',
    medicoResponsavel: {
      nome: 'Dra. Margarete Reis',
      especialidade: 'Fonoaudiologia Ped.',
      telefone: '(11) 91100-3344'
    }
  },
  {
    id: 'aluno_13',
    nome: 'Miguel Nunes (Berçário II - 1 Ano)',
    salaAula: 'Berçário II',
    quarto: 'Berçário II',
    foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    dataNascimento: '04/04/2022',
    condicoesMedicas: ['Fase final de desfralde noturno', 'Usa óculos escuros no sol'],
    alergias: ['Alergia a protetor solar comum'],
    observacoes: 'Miguel adora dinâmicas com tinta guache. Tem facilidade com numerais.',
    contatoEmergencia: {
      nome: 'Otávio Nunes',
      parentesco: 'Pai',
      telefone: '(11) 98722-1133'
    },
    planoCuidado: 'Usar apenas o protetor solar hypoallergenic trazido na mochila. Lembrar de oferecer o vaso sanitário no meio da tarde.',
    medicoResponsavel: {
      nome: 'Dra. Amanda Couto',
      especialidade: 'Pediatra Geral',
      telefone: '(11) 98844-3322'
    }
  },
  {
    id: 'aluno_14',
    nome: 'Helena Ferraz (Berçário II - 1 Ano)',
    salaAula: 'Berçário II',
    quarto: 'Berçário II',
    foto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    dataNascimento: '19/06/2023',
    condicoesMedicas: ['Soneca de 1h30m obrigatória', 'Muito comunicativa'],
    alergias: ['Nenhuma catalogada'],
    observacoes: 'Helena é risonha e gosta de cantar. Sabe expressar quando quer comer ou ir ao banheiro.',
    contatoEmergencia: {
      nome: 'Márcia Ferraz',
      parentesco: 'Mãe',
      telefone: '(11) 98844-5541'
    },
    planoCuidado: 'Garantir colchão macio e escurecimento leve da sala na hora do repouso pós-almoço.',
    medicoResponsavel: {
      nome: 'Dr. Geraldo Campos',
      especialidade: 'Pediatra de Família',
      telefone: '(11) 99811-2244'
    }
  },
  {
    id: 'aluno_15',
    nome: 'Manuela Rocha (Berçário II - 1 Ano)',
    salaAula: 'Berçário II',
    quarto: 'Berçário II',
    foto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150',
    dataNascimento: '27/02/2024',
    condicoesMedicas: ['Introdução alimentar de sólidos concluída', 'Usa fralda comum'],
    alergias: ['Aditivos químicos / Conservantes de caixinha'],
    observacoes: 'Manuela chora na chegada por 5 minutos, mas se acalma rapidamente com chocalhos e tapetes emborrachados.',
    contatoEmergencia: {
      nome: 'Vanessa Rocha',
      parentesco: 'Mãe',
      telefone: '(11) 98811-2242'
    },
    planoCuidado: 'Evitar alimentos industrializados. Servir apenas papinhas e frutas frescas amassadas na escola.',
    medicoResponsavel: {
      nome: 'Dra. Maria Clara Vaz',
      especialidade: 'Nutrologia Infantil',
      telefone: '(11) 91234-5566'
    }
  },
  {
    id: 'aluno_16',
    nome: 'Matheus Barbosa (Maternal I - A - 2 Anos)',
    salaAula: 'Maternal I - A',
    quarto: 'Maternal I - A',
    foto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150',
    dataNascimento: '08/09/2020',
    condicoesMedicas: ['Usa bombinha de asma em crises', 'Muita energia de manhã'],
    alergias: ['Pelos de Animais (Gatos/Cachorros)', 'Amoxicilina'],
    observacoes: 'Matheus adora jogos de tabuleiro simplificados and dinâmicas com bola de gude.',
    contatoEmergencia: {
      nome: 'Ricardo Barbosa',
      parentesco: 'Pai',
      telefone: '(11) 98711-1101'
    },
    planoCuidado: 'Oferecer inalação preventiva com soro caso respiração fique ofegante no pátio.',
    medicoResponsavel: {
      nome: 'Dr. Hugo Alencar',
      especialidade: 'Pneumologia Ped.',
      telefone: '(11) 98833-2211'
    }
  },
  {
    id: 'aluno_17',
    nome: 'Lucas Barros (Maternal I - A - 2 Anos)',
    salaAula: 'Maternal I - A',
    quarto: 'Maternal I - A',
    foto: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&q=80&w=150',
    dataNascimento: '30/12/2022',
    condicoesMedicas: ['Gosta de comer bastante fruta', 'Em desfralde parcial'],
    alergias: ['Nenhuma recomendada'],
    observacoes: 'Lucas gosta de ajudar com copos plásticos na hora do lanche. Tem sono pesado à tarde.',
    contatoEmergencia: {
      nome: 'Silvia Barros',
      parentesco: 'Mãe',
      telefone: '(11) 99122-4411'
    },
    planoCuidado: 'Perguntar ativamente sobre xixi logo ao acordar da soneca diária.',
    medicoResponsavel: {
      nome: 'Dra. Luiza Castro',
      especialidade: 'Pediatra de Rotina',
      telefone: '(11) 99221-1122'
    }
  },
  {
    id: 'aluno_18',
    nome: 'Joaquim Dias (Jardim I - B - 4 Anos)',
    salaAula: 'Jardim I - B',
    quarto: 'Jardim I - B',
    foto: 'https://images.unsplash.com/photo-1542206395-9feb3edaa68d?auto=format&fit=crop&q=80&w=150',
    dataNascimento: '13/05/2024',
    condicoesMedicas: ['Usa pomada protetora para assaduras', 'Dorme no colo'],
    alergias: ['Tecidos sintéticos (vestir apenas algodão)'],
    observacoes: 'Joaquim é alegre e interage batendo palminhas. Prefere dormir no ninho acolchoado.',
    contatoEmergencia: {
      nome: 'Juliana Dias',
      parentesco: 'Mãe',
      telefone: '(11) 99877-7788'
    },
    planoCuidado: 'Passar pomada preventiva contra assaduras a cada troca. Confirmar roupas de algodão leve.',
    medicoResponsavel: {
      nome: 'Dr. Arthur Mendes',
      especialidade: 'Pediatra Geral',
      telefone: '(11) 98114-1122'
    }
  },
  {
    id: 'aluno_19',
    nome: 'Valentina Pinto (Jardim II - A - 5 Anos)',
    salaAula: 'Jardim II - A',
    quarto: 'Jardim II - A',
    foto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150',
    dataNascimento: '25/03/2022',
    condicoesMedicas: ['Fisioterapia motora leve para alinhamento de marcha'],
    alergias: ['Frutas Cítricas (Laranja/Limão)'],
    observacoes: 'Valentina gosta de criar casinhas com blocos gigantes. Super prestativa na sala.',
    contatoEmergencia: {
      nome: 'Patrícia Pinto',
      parentesco: 'Mãe',
      telefone: '(11) 98711-4412'
    },
    planoCuidado: 'Estimular apoio completo dos pés nas dinâmicas de saltos. Servir mamão/melancia no lanche.',
    medicoResponsavel: {
      nome: 'Dra. Rosana Souto',
      especialidade: 'Fisiatra Pediatra',
      telefone: '(11) 99113-2211'
    }
  },
  {
    id: 'aluno_20',
    nome: 'Isabella Cardoso (Jardim II - B - 5 Anos)',
    salaAula: 'Jardim II - B',
    quarto: 'Jardim II - B',
    foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    dataNascimento: '08/11/2020',
    condicoesMedicas: ['Usa óculos corretivos', 'Muito interessada em letras'],
    alergias: ['Nenhuma'],
    observacoes: 'Isabella já reconhece a primeira letra de todos os nomes dos colegas de sala.',
    contatoEmergencia: {
      nome: 'Jorge Cardoso',
      parentesco: 'Pai',
      telefone: '(11) 99311-3322'
    },
    planoCuidado: 'Higienização das lentes com flanela trazida no estojo. Propor que monte pequenas palavras de madeira.',
    medicoResponsavel: {
      nome: 'Dr. Fábio Silveira',
      especialidade: 'Oftalmopediatria',
      telefone: '(11) 98833-2211'
    }
  },
  {
    id: 'aluno_21',
    nome: 'Samuel Mendes (Maternal I - B - 2 Anos)',
    salaAula: 'Maternal I - B',
    quarto: 'Maternal I - B',
    foto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150',
    dataNascimento: '14/06/2022',
    condicoesMedicas: ['Asma controlada', 'Soneca longa'],
    alergias: ['Cheiros fortes, perfume do piso'],
    observacoes: 'Samuel é observador, brinca em silêncio e tem preferência por quebra-cabeças de pinos.',
    contatoEmergencia: {
      nome: 'Fernanda Mendes',
      parentesco: 'Mãe',
      telefone: '(11) 99311-4431'
    },
    planoCuidado: 'Garantir que descanse em local arejado. Manter produtos de limpeza longe da rodinha.',
    medicoResponsavel: {
      nome: 'Dra. Sandra Lima',
      especialidade: 'Pediatra Alergista',
      telefone: '(11) 99144-8877'
    }
  },
  {
    id: 'aluno_22',
    nome: 'Giovanna Fonseca (Maternal I - B - 2 Anos)',
    salaAula: 'Maternal I - B',
    quarto: 'Maternal I - B',
    foto: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=150',
    dataNascimento: '19/02/2022',
    condicoesMedicas: ['Mastigação lenta', 'Desfralde noturno em evolução'],
    alergias: ['Corante Amarelo'],
    observacoes: 'Giovanna adora fazer tranças em bonecas de pano. Muito educada e sorridente.',
    contatoEmergencia: {
      nome: 'Maurício Fonseca',
      parentesco: 'Pai',
      telefone: '(11) 99122-8871'
    },
    planoCuidado: 'Incentivar mastigação adequada dos alimentos no almoço, mantendo tom relaxado à mesa.',
    medicoResponsavel: {
      nome: 'Dra. Daniela Marinho',
      especialidade: 'Odontopediatria',
      telefone: '(11) 91100-2211'
    }
  },
  {
    id: 'aluno_23',
    nome: 'Felipe Antunes (Maternal I - C - 2 Anos)',
    salaAula: 'Maternal I - C',
    quarto: 'Maternal I - C',
    foto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=150',
    dataNascimento: '14/04/2024',
    condicoesMedicas: ['Usa fralda descartável', 'Toma leite de fórmula no lanche'],
    alergias: ['Picada de Pernilongo/Mosquitos'],
    observacoes: 'Felipe acalma-se na hora de dormir se estiver com sua naninha em formato de elefantinho.',
    contatoEmergencia: {
      nome: 'Renato Antunes',
      parentesco: 'Pai',
      telefone: '(11) 98711-2231'
    },
    planoCuidado: 'Preparar a mamadeira de fórmula às 15h. Aplicar repelente neutro infantil trazido na mochila.',
    medicoResponsavel: {
      nome: 'Dr. Roberto Lemos',
      especialidade: 'Pediatra Geral',
      telefone: '(11) 98844-1122'
    }
  },
  {
    id: 'aluno_24',
    nome: 'Lorena Machado (Maternal I - D - 2 Anos)',
    salaAula: 'Maternal I - D',
    quarto: 'Maternal I - D',
    foto: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&q=80&w=150',
    dataNascimento: '02/10/2022',
    condicoesMedicas: ['Pele atópica / Dermatite', 'Fácil choro de teimosia'],
    alergias: ['Sabonetes químicos / Produtos com essência'],
    observacoes: 'Lorena fala muitas palavras novas por dia. Adora ajudar a organizar as bonecas.',
    contatoEmergencia: {
      nome: 'Helena Machado',
      parentesco: 'Mãe',
      telefone: '(11) 99311-4451'
    },
    planoCuidado: 'Checar hidratação da dobra de braços e pernas. Limpar derramamentos de suco rapidamente para evitar coceira.',
    medicoResponsavel: {
      nome: 'Dra. Clarice Mendes',
      especialidade: 'Dermatopediatria',
      telefone: '(11) 98822-1133'
    }
  },
  {
    id: 'aluno_25',
    nome: 'Pedro Henrique (Berçário III - 1 Ano)',
    salaAula: 'Berçário III',
    quarto: 'Berçário III',
    foto: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150',
    dataNascimento: '18/07/2020',
    condicoesMedicas: ['Adora atividades físicas ao ar livre', 'Desfralde completo'],
    alergias: ['Nenhuma catalogada'],
    observacoes: 'Pedro é extremamente ágil e carinhoso. Lidera corridas de saco e amarelinha no parquinho.',
    contatoEmergencia: {
      nome: 'Fabiana Lima',
      parentesco: 'Mãe',
      telefone: '(11) 98877-6641'
    },
    planoCuidado: 'Incentivar ingestão constante de água após corridas. Proteger cabeça com boné trazido na mochila.',
    medicoResponsavel: {
      nome: 'Dr. Cláudio Rangel',
      especialidade: 'Pediatra Geral',
      telefone: '(11) 98833-1100'
    }
  },
  {
    id: 'aluno_26',
    nome: 'Theo Lemos (Maternal II - A - 3 Anos)',
    salaAula: 'Maternal II - A',
    quarto: 'Maternal II - A',
    foto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=150',
    dataNascimento: '10/05/2021',
    condicoesMedicas: ['Desenvolvimento acelerado de linguagem', 'Desfralde concluído'],
    alergias: ['Nenhuma catalogada'],
    observacoes: 'Theo é muito expressivo e gosta de liderar rodas de história no Maternal II - A.',
    contatoEmergencia: {
      nome: 'Marcelo Lemos',
      parentesco: 'Pai',
      telefone: '(11) 92222-2211'
    },
    planoCuidado: 'Estimular pintura a dedo e atividades de raciocínio lógico.',
    medicoResponsavel: {
      nome: 'Dr. Roberto Kardec',
      especialidade: 'Pediatra de Rotina',
      telefone: '(11) 99999-8888'
    }
  },
  {
    id: 'aluno_27',
    nome: 'Heloísa Toledo (Maternal II - B - 3 Anos)',
    salaAula: 'Maternal II - B',
    quarto: 'Maternal II - B',
    foto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150',
    dataNascimento: '22/09/2021',
    condicoesMedicas: ['Gosta de ouvir contação de histórias', 'Soneca tranquila'],
    alergias: ['Nenhuma catalogada'],
    observacoes: 'Heloísa adora cantar cantigas com a professora Márcia Toledo no Maternal II - B.',
    contatoEmergencia: {
      nome: 'Carolina Toledo',
      parentesco: 'Mãe',
      telefone: '(11) 98844-1123'
    },
    planoCuidado: 'Incentivar participação em jogos coletivos e brincadeiras de roda.',
    medicoResponsavel: {
      nome: 'Dra. Luana Peixoto',
      especialidade: 'Pediatra Geral',
      telefone: '(11) 98888-7777'
    }
  },
  {
    id: 'aluno_28',
    nome: 'Nicolas Castro (Maternal II - C - 3 Anos)',
    salaAula: 'Maternal II - C',
    quarto: 'Maternal II - C',
    foto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150',
    dataNascimento: '14/11/2021',
    condicoesMedicas: ['Gosta de escultura com massinha', 'Boa adaptação social'],
    alergias: ['Nenhuma catalogada'],
    observacoes: 'Nicolas é curioso e carinhoso no Maternal II - C com a professora Luísa Castro.',
    contatoEmergencia: {
      nome: 'Fernanda Castro',
      parentesco: 'Mãe',
      telefone: '(11) 99221-1231'
    },
    planoCuidado: 'Incentivar exploração sensorial e jogos pedagógicos.',
    medicoResponsavel: {
      nome: 'Dr. Lucas Mendes',
      especialidade: 'Pediatra Geral',
      telefone: '(11) 97777-6666'
    }
  },
  {
    id: 'aluno_29',
    nome: 'Cecília Rocha (Jardim I - A - 4 Anos)',
    salaAula: 'Jardim I - A',
    quarto: 'Jardim I - A',
    foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    dataNascimento: '05/04/2020',
    condicoesMedicas: ['Gosta de aulas bilíngues e música', 'Usa protetor solar no parquinho'],
    alergias: ['Nenhuma catalogada'],
    observacoes: 'Cecília participa ativamente das aulas da professora Bruna Rocha no Jardim I - A.',
    contatoEmergencia: {
      nome: 'Eduardo Rocha',
      parentesco: 'Pai',
      telefone: '(11) 98811-2243'
    },
    planoCuidado: 'Incentivar vocabulário e atividades artísticas.',
    medicoResponsavel: {
      nome: 'Dra. Vanessa Luz',
      especialidade: 'Pediatra Geral',
      telefone: '(11) 98877-3311'
    }
  }
];

export const MEDICAMENTOS_INICIAIS: Medicamento[] = [
  // Dona Maria
  {
    id: 'med_maria_losartana',
    idosoId: 'idoso_maria',
    nome: 'Losartana Potássica (Pressão)',
    dosagem: '50mg - 1 Comp.',
    frequência: 'Diário',
    horarios: ['08:00'],
    diasSemana: ['Todos'],
    observacoes: 'Tomar em jejum, com meio copo d\'água.',
    status: 'ativo'
  },
  {
    id: 'med_maria_aricept',
    idosoId: 'idoso_maria',
    nome: 'Donepezila (Aricept - Alzheimer)',
    dosagem: '5mg - 1 Comp.',
    frequência: 'Diário',
    horarios: ['21:00'],
    diasSemana: ['Todos'],
    observacoes: 'Oferecer logo antes do descanso noturno.',
    status: 'ativo'
  },
  {
    id: 'med_maria_calcio',
    idosoId: 'idoso_maria',
    nome: 'Cálcio + Vitamina D',
    dosagem: '1 sachet em pó',
    frequência: 'Diário',
    horarios: ['12:30'],
    diasSemana: ['Todos'],
    observacoes: 'Diluir em 100ml de suco ou água no almoço.',
    status: 'ativo'
  },
  // Seu João
  {
    id: 'med_joao_metformina',
    idosoId: 'idoso_joao',
    nome: 'Glicofage XR (Metformina - Diabetes)',
    dosagem: '850mg - 1 Comp.',
    frequência: 'Diário',
    horarios: ['08:00', '20:00'],
    diasSemana: ['Todos'],
    observacoes: 'Tomar imediatamente após o café da manhã e após o jantar.',
    status: 'ativo'
  },
  {
    id: 'med_joao_daflon',
    idosoId: 'idoso_joao',
    nome: 'Daflon 1000mg (Circulação)',
    dosagem: '1 comprimido',
    frequência: 'A cada 12h',
    horarios: ['09:00', '21:00'],
    diasSemana: ['Todos'],
    observacoes: 'Tomar com as refeições.',
    status: 'ativo'
  }
];

export const AGENDA_INICIAL: CompromissoMedico[] = [
  // Dona Maria
  {
    id: 'compromisso_maria_1',
    idosoId: 'idoso_maria',
    tipo: 'consulta',
    titulo: 'Retorno Clínico de Geriatria',
    medico: 'Dr. Roberto Kardec',
    especialidade: 'Geriatria & Cardiologia',
    local: 'Consultório Dr. Kardec - Av. Paulista, 1500, cj 42',
    data: '2026-06-05', // no futuro próximo
    horario: '14:30',
    observacoes: 'Levar último exame de ecocardiograma e medições de pressão feitas em casa.',
    confirmadoFamiliar: true,
    alertasAtivos: true,
    status: 'agendado'
  },
  {
    id: 'compromisso_maria_2',
    idosoId: 'idoso_maria',
    tipo: 'exame',
    titulo: 'Coleta de Exame de Sangue',
    medico: 'Dra. Patrícia - Laboratório Fleury',
    especialidade: 'Hematologia / Bioquímica',
    local: 'Fleury Moema - Av. Ibirapuera, 1200',
    data: '2026-06-12',
    horario: '07:00',
    observacoes: 'Necessário jejum de 8 horas. Beber água moderadamente livre.',
    confirmadoFamiliar: true,
    alertasAtivos: true,
    status: 'agendado'
  },
  // Seu João
  {
    id: 'compromisso_joao_1',
    idosoId: 'idoso_joao',
    tipo: 'fisioterapia',
    titulo: 'Sessão de Fisioterapia Domiciliar',
    medico: 'Dr. Alan Macedo',
    especialidade: 'Fisioterapia Traumato-Ortopédica',
    local: 'Residencial Seu João',
    data: '2026-06-01',
    horario: '10:00',
    observacoes: 'Foco no ganho de força de quadríceps e flexibilidade patelar.',
    confirmadoFamiliar: true,
    alertasAtivos: true,
    status: 'agendado'
  }
];

// Seed Historical Data (last 5 days) for Charts
export const HISTORICO_SINAIS_INICAIS: SinalVital[] = [
  {
    id: 'sinal_m_1',
    idosoId: 'idoso_maria',
    pressaoArterial: '135/85',
    glicemia: 98,
    tipoGlicemia: 'jejum',
    temperatura: 36.3,
    frequenciaCardiaca: 82,
    saturacao: 97,
    peso: 62.4,
    data: '2026-05-26',
    horario: '08:15',
    registradoPor: 'Ana Silva (Cuidadora)',
    observacoes: 'Aferição normal em jejum.'
  },
  {
    id: 'sinal_m_2',
    idosoId: 'idoso_maria',
    pressaoArterial: '128/80',
    glicemia: 110,
    tipoGlicemia: 'pos-prandial',
    temperatura: 36.6,
    frequenciaCardiaca: 78,
    saturacao: 98,
    peso: 62.4,
    data: '2026-05-27',
    horario: '08:20',
    registradoPor: 'Ana Silva (Cuidadora)',
    observacoes: 'Pressão excelente hoje.'
  },
  {
    id: 'sinal_m_3',
    idosoId: 'idoso_maria',
    pressaoArterial: '142/90',
    glicemia: 104,
    tipoGlicemia: 'jejum',
    temperatura: 36.8,
    frequenciaCardiaca: 88,
    saturacao: 96,
    peso: 62.5,
    data: '2026-05-28',
    horario: '08:10',
    registradoPor: 'Clarice Souza (Filha)',
    observacoes: 'Acordou um pouco irritada, pressão levemente alterada.'
  },
  {
    id: 'sinal_m_4',
    idosoId: 'idoso_maria',
    pressaoArterial: '130/82',
    glicemia: 99,
    tipoGlicemia: 'jejum',
    temperatura: 36.4,
    frequenciaCardiaca: 75,
    saturacao: 98,
    peso: 62.3,
    data: '2026-05-29',
    horario: '08:12',
    registradoPor: 'Ana Silva (Cuidadora)',
    observacoes: 'Tudo dentro do esperado.'
  },
  {
    id: 'sinal_m_5',
    idosoId: 'idoso_maria',
    pressaoArterial: '124/78',
    glicemia: 102,
    tipoGlicemia: 'jejum',
    temperatura: 36.2,
    frequenciaCardiaca: 72,
    saturacao: 99,
    peso: 62.2,
    data: '2026-05-30', // Hoje de manhã
    horario: '08:05',
    registradoPor: 'Ana Silva (Cuidadora)',
    observacoes: 'Medição em repouso absoluto. Ótimo estado geral.'
  },

  // Seu João
  {
    id: 'sinal_j_1',
    idosoId: 'idoso_joao',
    pressaoArterial: '130/82',
    glicemia: 135,
    tipoGlicemia: 'jejum',
    temperatura: 36.4,
    frequenciaCardiaca: 70,
    saturacao: 96,
    peso: 81.3,
    data: '2026-05-28',
    horario: '07:45',
    registradoPor: 'Carlos Souza (Familiar)',
    observacoes: 'Glicemia um pouco acima da meta matinal.'
  },
  {
    id: 'sinal_j_2',
    idosoId: 'idoso_joao',
    pressaoArterial: '125/80',
    glicemia: 112,
    tipoGlicemia: 'jejum',
    temperatura: 36.3,
    frequenciaCardiaca: 72,
    saturacao: 97,
    peso: 81.2,
    data: '2026-05-29',
    horario: '07:50',
    registradoPor: 'Ana Silva (Cuidadora)',
    observacoes: 'Glicemia bem controlada com medicação regular.'
  },
  {
    id: 'sinal_j_3',
    idosoId: 'idoso_joao',
    pressaoArterial: '128/80',
    glicemia: 119,
    tipoGlicemia: 'jejum',
    temperatura: 36.5,
    frequenciaCardiaca: 68,
    saturacao: 97,
    peso: 81.0,
    data: '2026-05-30', // Hoje de manhã
    horario: '07:40',
    registradoPor: 'Ana Silva (Cuidadora)',
    observacoes: 'Tudo normal.'
  },
  // --- HISTÓRICO ESCOLAR DE SINAIS (FRALDA E DESCANSO) ---
  { id: 'sinal_e_a1_1', idosoId: 'aluno_1', pressaoArterial: 'Dormiu 1h30', glicemia: 0, tipoGlicemia: 'jejum', temperatura: 36.4, frequenciaCardiaca: 98, saturacao: 99, peso: 8.5, data: '2026-05-30', horario: '14:30', registradoPor: 'Profª Ana Silva', observacoes: 'Fralda seca na sesta.', fralda: 'Fralda Seca / Limpa', soneca: 'Dormiu das 13h às 14h30' },
  { id: 'sinal_e_a2_1', idosoId: 'aluno_2', pressaoArterial: 'Dormiu 1h00', glicemia: 0, tipoGlicemia: 'jejum', temperatura: 36.6, frequenciaCardiaca: 92, saturacao: 98, peso: 9.8, data: '2026-05-30', horario: '14:15', registradoPor: 'Profª Ana Silva', observacoes: 'Fralda trocada + pomada.', fralda: 'Fralda trocada + pomada', soneca: 'Dormiu das 13h15 às 14h15' },
  { id: 'sinal_e_a3_1', idosoId: 'aluno_3', pressaoArterial: 'Dormiu 1h45', glicemia: 0, tipoGlicemia: 'jejum', temperatura: 36.2, frequenciaCardiaca: 90, saturacao: 99, peso: 10.4, data: '2026-05-30', horario: '14:45', registradoPor: 'Profª Ana Silva', observacoes: 'Óculos guardados na sesta.', fralda: 'Fez Xixi', soneca: 'Dormiu das 13h às 14h45' },
  { id: 'sinal_e_a4_1', idosoId: 'aluno_4', pressaoArterial: 'Dormiu 1h30', glicemia: 0, tipoGlicemia: 'jejum', temperatura: 36.5, frequenciaCardiaca: 96, saturacao: 99, peso: 10.2, data: '2026-05-30', horario: '14:15', registradoPor: 'Profª Ana Silva', observacoes: 'Fralda com troca completa + pomada.', fralda: 'Xixi e Cocô (Passou pomada)', soneca: 'Dormiu das 12h45 às 14h15' },
  { id: 'sinal_e_a5_1', idosoId: 'aluno_5', pressaoArterial: 'Dormiu 1h00', glicemia: 0, tipoGlicemia: 'jejum', temperatura: 36.5, frequenciaCardiaca: 94, saturacao: 99, peso: 11.1, data: '2026-05-30', horario: '14:30', registradoPor: 'Profª Ana Silva', observacoes: 'Desfralde completo correu super bem no vaso.', fralda: 'Fralda Seca / Limpa', soneca: 'Dormiu das 13h30 às 14h30' }
];

export const HISTORICO_HIDRATACAO_INICIAL: RegistroHidratacao[] = [
  // Dona Maria - Hoje 30/05/2026
  { id: 'hid_m_1', idosoId: 'idoso_maria', quantidadeMl: 250, horario: '08:30', data: '2026-05-30', registradoPor: 'Ana Silva (Cuidadora)' },
  { id: 'hid_m_2', idosoId: 'idoso_maria', quantidadeMl: 250, horario: '10:00', data: '2026-05-30', registradoPor: 'Ana Silva (Cuidadora)' },
  { id: 'hid_m_3', idosoId: 'idoso_maria', quantidadeMl: 200, horario: '11:45', data: '2026-05-30', registradoPor: 'Ana Silva (Cuidadora)' },
  // Seu João - Hoje 30/05/2026
  { id: 'hid_j_1', idosoId: 'idoso_joao', quantidadeMl: 300, horario: '08:15', data: '2026-05-30', registradoPor: 'Ana Silva (Cuidadora)' },
  { id: 'hid_j_2', idosoId: 'idoso_joao', quantidadeMl: 300, horario: '11:00', data: '2026-05-30', registradoPor: 'Ana Silva (Cuidadora)' }
];

export const HISTORICO_SONO_INICIAL: RegistroSono[] = [
  // Dona Maria
  { id: 'sono_m_1', idosoId: 'idoso_maria', dormiuEm: '22:00', acordouEm: '06:30', horasTotais: 8.5, qualidade: 'boa', interrupcoes: 1, data: '2026-05-28', observacoes: 'Acordou uma vez para ir ao banheiro, mas dormiu em seguida.' },
  { id: 'sono_m_2', idosoId: 'idoso_maria', dormiuEm: '22:15', acordouEm: '07:00', horasTotais: 8.75, qualidade: 'excelente', interrupcoes: 0, data: '2026-05-29', observacoes: 'Dormiu a noite inteira. Demonstrou ótima disposição ao acordar.' },
  { id: 'sono_m_3', idosoId: 'idoso_maria', dormiuEm: '22:30', acordouEm: '06:00', horasTotais: 7.5, qualidade: 'regular', interrupcoes: 2, data: '2026-05-30', observacoes: 'Um pouco agitada por volta das 03:00. Careceu de auxílio para se acalmar.' },
  // Seu João
  { id: 'sono_j_1', idosoId: 'idoso_joao', dormiuEm: '23:00', acordouEm: '06:30', horasTotais: 7.5, qualidade: 'boa', interrupcoes: 1, data: '2026-05-29', observacoes: 'Artrose incomodou um pouco à noite.' },
  { id: 'sono_j_2', idosoId: 'idoso_joao', dormiuEm: '22:45', acordouEm: '07:00', horasTotais: 8.25, qualidade: 'excelente', interrupcoes: 0, data: '2026-05-30', observacoes: 'Almofada de apoio entre os joelhos ajudou muito.' },
  // Alunos
  { id: 'sono_e_a1_1', idosoId: 'aluno_1', dormiuEm: '13:00', acordouEm: '14:30', horasTotais: 1.5, qualidade: 'boa', interrupcoes: 0, data: '2026-05-30', observacoes: 'Soneca tranquila no tatame com seu ursinho azul.' },
  { id: 'sono_e_a2_1', idosoId: 'aluno_2', dormiuEm: '13:15', acordouEm: '14:15', horasTotais: 1.0, qualidade: 'boa', interrupcoes: 1, data: '2026-05-30', observacoes: 'Acordou tossindo de leve, mas voltou a dormir logo.' },
  { id: 'sono_e_a3_1', idosoId: 'aluno_3', dormiuEm: '13:00', acordouEm: '14:45', horasTotais: 1.75, qualidade: 'excelente', interrupcoes: 0, data: '2026-05-30', observacoes: 'Dormiu profundamente com óculos guardados na caixinha.' },
  { id: 'sono_e_a4_1', idosoId: 'aluno_4', dormiuEm: '12:45', acordouEm: '14:15', horasTotais: 1.5, qualidade: 'boa', interrupcoes: 0, data: '2026-05-30', observacoes: 'Dormiu bem, mantido em cabeceira elevada.' },
  { id: 'sono_e_a5_1', idosoId: 'aluno_5', dormiuEm: '13:30', acordouEm: '14:30', horasTotais: 1.0, qualidade: 'regular', interrupcoes: 0, data: '2026-05-30', observacoes: 'Precisou de historinha calma e carinho para pegar no sono.' }
];

export const HISTORICO_HUMOR_INICIAL: RegistroHumor[] = [
  { id: 'hum_m_1', idosoId: 'idoso_maria', data: '2026-05-29', horario: '09:00', estado: 'feliz', observacoes: 'Adorou assistir ao programa de receitas e comer biscoito integral.', registradoPor: 'Ana Silva (Cuidadora)' },
  { id: 'hum_m_2', idosoId: 'idoso_maria', data: '2026-05-29', horario: '17:00', estado: 'calmo', observacoes: 'Bastante sossegada no entardecer.', registradoPor: 'Ana Silva (Cuidadora)' },
  { id: 'hum_m_3', idosoId: 'idoso_maria', data: '2026-05-30', horario: '08:30', estado: 'com_sono_calmo', registradoPor: 'Ana Silva (Cuidadora)' } as any as RegistroHumor,
  { id: 'hum_m_4', idosoId: 'idoso_maria', data: '2026-05-30', horario: '11:00', estado: 'feliz', observacoes: 'Fez pintura e rascunhos em papel com giz de cera.', registradoPor: 'Ana Silva (Cuidadora)' },
  // Seu João
  { id: 'hum_j_1', idosoId: 'idoso_joao', data: '2026-05-29', horario: '09:30', estado: 'calmo', observacoes: 'Muito concentrado em sua leitura.', registradoPor: 'Ana Silva (Cuidadora)' },
  { id: 'hum_j_2', idosoId: 'idoso_joao', data: '2026-05-30', horario: '09:00', estado: 'feliz', observacoes: 'Disconforme com o frio, mas feliz em receber notícias do neto.', registradoPor: 'Ana Silva (Cuidadora)' },
  // Alunos
  { id: 'hum_e_a1_1', idosoId: 'aluno_1', data: '2026-05-30', horario: '09:00', estado: 'feliz', observacoes: 'Chegou sorridente na escola e bateu palminhas ao ver os amigos.', registradoPor: 'Profª Ana Silva' },
  { id: 'hum_e_a1_2', idosoId: 'aluno_1', data: '2026-05-30', horario: '11:00', estado: 'feliz', observacoes: 'Adorou brincar com chocalhos coloridos de estimulação.', registradoPor: 'Profª Ana Silva' },
  { id: 'hum_e_a2_1', idosoId: 'aluno_2', data: '2026-05-30', horario: '09:30', estado: 'calmo', observacoes: 'Super focado encaixando blocos lógicos gigantes.', registradoPor: 'Profª Ana Silva' },
  { id: 'hum_e_a3_1', idosoId: 'aluno_3', data: '2026-05-30', horario: '09:15', estado: 'feliz', observacoes: 'Cantou e dançou com a turminha na roda de música.', registradoPor: 'Profª Ana Silva' },
  { id: 'hum_e_a4_1', idosoId: 'aluno_4', data: '2026-05-30', horario: '09:30', estado: 'feliz', observacoes: 'Deu muitas gargalhadas imitando barulho de gatinho e vaquinha.', registradoPor: 'Profª Ana Silva' },
  { id: 'hum_e_a5_1', idosoId: 'aluno_5', data: '2026-05-30', horario: '10:00', estado: 'agitado', observacoes: 'Muito ativo correndo na sala de estimulação corporal.', registradoPor: 'Profª Ana Silva' }
];

export const HISTORICO_ALIMENTACAO_INICIAL: RegistroAlimentacao[] = [
  { id: 'ali_m_1', idosoId: 'idoso_maria', refeicao: 'cafe_manha', aceitacao: 'muito_bem', horario: '08:15', data: '2026-05-30', observacoes: 'Geleia sem açúcar com pão integral, e uma xícara pequena de café com leite.', registradoPor: 'Ana Silva (Cuidadora)' },
  { id: 'ali_m_2', idosoId: 'idoso_maria', refeicao: 'lanche', aceitacao: 'muito_bem', horario: '10:30', data: '2026-05-30', observacoes: 'Meia banana amassada com aveia em flocos e mel.', registradoPor: 'Ana Silva (Cuidadora)' },
  { id: 'ali_j_1', idosoId: 'idoso_joao', refeicao: 'cafe_manha', aceitacao: 'muito_bem', horario: '08:00', data: '2026-05-30', observacoes: 'Ovos mexidos sem óleo, torrada e café preto adoçado com sucralose.', registradoPor: 'Ana Silva (Cuidadora)' },
  // Alunos
  { id: 'ali_e_a1_1', idosoId: 'aluno_1', refeicao: 'mamadeira', aceitacao: 'muito_bem', horario: '08:30', data: '2026-05-30', observacoes: 'Tomou toda a mamadeira de leite com aveia.', registradoPor: 'Profª Ana Silva' },
  { id: 'ali_e_a1_2', idosoId: 'aluno_1', refeicao: 'lanche', aceitacao: 'muito_bem', horario: '10:15', data: '2026-05-30', observacoes: 'Comeu purê de maçã integral cozida.', registradoPor: 'Profª Ana Silva' },
  { id: 'ali_e_a1_3', idosoId: 'aluno_1', refeicao: 'almoco', aceitacao: 'muito_bem', horario: '11:45', data: '2026-05-30', observacoes: 'Sopa de legumes amassada com frango desfiado.', registradoPor: 'Profª Ana Silva' },
  { id: 'ali_e_a2_1', idosoId: 'aluno_2', refeicao: 'mamadeira', aceitacao: 'muito_bem', horario: '08:30', data: '2026-05-30', observacoes: 'Mamadeira e biscoito de polvilho.', registradoPor: 'Profª Ana Silva' },
  { id: 'ali_e_a2_2', idosoId: 'aluno_2', refeicao: 'lanche', aceitacao: 'recusou', horario: '10:15', data: '2026-05-30', observacoes: 'Recusou a pera, preferiu tomar água.', registradoPor: 'Profª Ana Silva' },
  { id: 'ali_e_a2_3', idosoId: 'aluno_2', refeicao: 'almoco', aceitacao: 'muito_bem', horario: '11:45', data: '2026-05-30', observacoes: 'Arroz, feijão amassado e purê de abóbora. Comeu tudo.', registradoPor: 'Profª Ana Silva' },
  { id: 'ali_e_a3_1', idosoId: 'aluno_3', refeicao: 'cafe_manha', aceitacao: 'muito_bem', horario: '08:30', data: '2026-05-30', observacoes: 'Copo de leite com bisnaguinha com requeijão.', registradoPor: 'Profª Ana Silva' },
  { id: 'ali_e_a3_2', idosoId: 'aluno_3', refeicao: 'lanche', aceitacao: 'muito_bem', horario: '10:15', data: '2026-05-30', observacoes: 'Mamão picadinho sem caroço.', registradoPor: 'Profª Ana Silva' },
  { id: 'ali_e_a4_1', idosoId: 'aluno_4', refeicao: 'mamadeira', aceitacao: 'muito_bem', horario: '08:30', data: '2026-05-30', observacoes: 'Mamadeira com fórmula sem glúten.', registradoPor: 'Profª Ana Silva' },
  { id: 'ali_e_a4_2', idosoId: 'aluno_4', refeicao: 'lanche', aceitacao: 'muito_bem', horario: '10:15', data: '2026-05-30', observacoes: 'Banana amassada simples.', registradoPor: 'Profª Ana Silva' },
  { id: 'ali_e_a4_3', idosoId: 'aluno_4', refeicao: 'almoco', aceitacao: 'muito_bem', horario: '11:45', data: '2026-05-30', observacoes: 'Almoço especial sem glúten (arroz, caldinho de feijão e carne moída super úmida).', registradoPor: 'Profª Ana Silva' },
  { id: 'ali_e_a5_1', idosoId: 'aluno_5', refeicao: 'cafe_manha', aceitacao: 'muito_bem', horario: '08:30', data: '2026-05-30', observacoes: 'Iogurte natural batido com morango.', registradoPor: 'Profª Ana Silva' },
  { id: 'ali_e_a5_2', idosoId: 'aluno_5', refeicao: 'lanche', aceitacao: 'muito_bem', horario: '10:15', data: '2026-05-30', observacoes: 'Melão cortado em tiras finas.', registradoPor: 'Profª Ana Silva' },
  { id: 'ali_e_a5_3', idosoId: 'aluno_5', refeicao: 'almoco', aceitacao: 'muito_bem', horario: '11:45', data: '2026-05-30', observacoes: 'Arroz integral, sopa de lentilhas e purê de batata doce.', registradoPor: 'Profª Ana Silva' }
];

export const HISTORICO_ATIVIDADE_INICIAL: RegistroAtividade[] = [];

export const HISTORICO_NOTIFICACOES_INICIAIS: NotificacaoSimulada[] = [
  {
    id: 'notif_1',
    idosoId: 'aluno_1',
    familiarNome: 'Clarice Souza (Mãe)',
    telefoneDestino: '(11) 98765-4321',
    tipoCompromisso: 'Rotina de Lanche Concluída',
    mensagem: 'Anjinho Escolar: O lanche da manhã de Mariana Souza foi registrado. Comeu muito bem a frutinha fatiada com cereal.',
    status: 'enviada_whatsapp',
    dataEnvio: '2026-05-30T08:06:00Z',
    canal: 'WhatsApp'
  },
  {
    id: 'notif_2',
    idosoId: 'aluno_1',
    familiarNome: 'Clarice Souza (Mãe)',
    telefoneDestino: '(11) 98765-4321',
    tipoCompromisso: 'Troca de Fralda Registrada',
    mensagem: 'Anjinho Escolar: Troca de fralda de Mariana Souza realizada por Profª Sofia Mendes. Fralda limpa e pomada aplicada.',
    status: 'enviada_whatsapp',
    dataEnvio: '2026-05-30T08:20:00Z',
    canal: 'WhatsApp'
  }
];

export const SALAS_INICIAIS: Classroom[] = [
  { id: 'sala_1', name: 'Berçário I - A', emoji: '🍼', ageGroup: '0-1 ano', capacity: 8, description: 'Lactentes menores e estimulação sensorial contínua.' },
  { id: 'sala_2', name: 'Berçário I - B', emoji: '👶', ageGroup: '0-1 ano', capacity: 8, description: 'Foco em engatinhar, primeiros passos e afeto.' },
  { id: 'sala_3', name: 'Berçário II', emoji: '🐥', ageGroup: '1-2 anos', capacity: 12, description: 'Desenvolvimento motor, marcha e exploração livre.' },
  { id: 'sala_4', name: 'Maternal I - A', emoji: '🧸', ageGroup: '2-3 anos', capacity: 15, description: 'Turma Ursinhos - Linguagem e socialização.' },
  { id: 'sala_5', name: 'Maternal I - B', emoji: '🎪', ageGroup: '2-3 anos', capacity: 15, description: 'Turma Cirquinho - Brincadeiras ativas e lúdicas.' },
  { id: 'sala_6', name: 'Maternal II - A', emoji: '🐥', ageGroup: '3-4 anos', capacity: 18, description: 'Turma Patinhos - Coordenação motora fina e desfralde.' },
  { id: 'sala_7', name: 'Maternal II - B', emoji: '🎈', ageGroup: '3-4 anos', capacity: 18, description: 'Turma Balões - Autonomia e exploração de cores.' },
  { id: 'sala_8', name: 'Maternal II - C', emoji: '🎨', ageGroup: '3-4 anos', capacity: 15, description: 'Turma Pintores - Desenhos livres e massinha.' },
  { id: 'sala_9', name: 'Jardim I - A', emoji: '🌈', ageGroup: '4-5 anos', capacity: 20, description: 'Turma Arco-íris - Introdução aos números e letras.' },
  { id: 'sala_10', name: 'Jardim I - B', emoji: '✏️', ageGroup: '4-5 anos', capacity: 20, description: 'Turma Lápis Mágico - Expressão artística e oralidade.' },
  { id: 'sala_11', name: 'Jardim II - A', emoji: '🚀', ageGroup: '5-6 anos', capacity: 22, description: 'Turma Foguetes - Pré-alfabetização e ciências.' },
  { id: 'sala_12', name: 'Jardim II - B', emoji: '🧬', ageGroup: '5-6 anos', capacity: 22, description: 'Turma Exploradores - Natureza e raciocínio lógico.' },
  { id: 'sala_13', name: 'Maternal I - C', emoji: '🍭', ageGroup: '2-3 anos', capacity: 12, description: 'Turma Docinhos - Aprendizado sensorial e contação de histórias.' },
  { id: 'sala_14', name: 'Maternal I - D', emoji: '🐶', ageGroup: '2-3 anos', capacity: 12, description: 'Turma Filhotes - Integração de música e psicomotricidade.' },
  { id: 'sala_15', name: 'Berçário III', emoji: '👼', ageGroup: '1.5-2 anos', capacity: 10, description: 'Turma Anjinhos - Transição suave para o Maternal I.' }
];

// Helper functions for PIN validation and uniqueness
export function isPinUnique(pin: string, excludeUserId?: string): { isUnique: boolean; conflictingUser?: Usuario } {
  const cleanPin = pin.trim();
  if (!cleanPin) return { isUnique: true };
  const allUsers = getFromDB<Usuario[]>('anjo_usuarios', USUARIOS_SIMULADOS);
  const conflictingUser = allUsers.find(u => u.pin === cleanPin && u.id !== excludeUserId);
  if (conflictingUser) {
    return { isUnique: false, conflictingUser };
  }
  return { isUnique: true };
}

export function generateUniquePin(excludeUserId?: string, preferredDigits?: string): string {
  const allUsers = getFromDB<Usuario[]>('anjo_usuarios', USUARIOS_SIMULADOS);
  const usedPins = new Set(allUsers.filter(u => u.id !== excludeUserId && u.pin).map(u => u.pin!));

  if (preferredDigits) {
    const cleanDigits = preferredDigits.replace(/\D/g, '');
    if (cleanDigits.length >= 4) {
      const candidate = cleanDigits.slice(-4);
      if (!usedPins.has(candidate)) return candidate;
    }
  }

  for (let i = 0; i < 1000; i++) {
    const candidate = String(Math.floor(1000 + Math.random() * 9000));
    if (!usedPins.has(candidate)) return candidate;
  }
  return String(Math.floor(1000 + Math.random() * 9000));
}

// Initialize database in localStorage
export function initializeDB() {
  if (typeof window === 'undefined') return;
  
  const checkAndSet = (key: string, initialData: any) => {
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify(initialData));
    }
  };

  checkAndSet('anjo_salas', SALAS_INICIAIS);
  checkAndSet('anjo_usuarios', USUARIOS_SIMULADOS);
  
  // Migração e Sincronização de PINs por usuário sem sobrescrever nomes/dados editados
  const storedUsers = localStorage.getItem('anjo_usuarios');
  if (storedUsers) {
    try {
      const usersList = JSON.parse(storedUsers);
      let updated = false;

      // 1. Synchronize all canonical predefined users with their official profiles, phones and unique PINs
      let cleanUsers = usersList.map((u: any) => {
        const canonical = USUARIOS_SIMULADOS.find(init => init.id === u.id);
        if (canonical) {
          const isPlaceholderName = !u.nome || u.nome.toLowerCase().includes('a cadastrar') || u.nome === 'Responsável a cadastrar';
          return {
            ...u,
            pin: canonical.pin,
            telefone: u.telefone && u.telefone.trim() ? u.telefone : canonical.telefone,
            nome: isPlaceholderName ? canonical.nome : u.nome,
            tipo: canonical.tipo,
            parentesco: u.parentesco && u.parentesco.trim() ? u.parentesco : canonical.parentesco,
            salaAula: u.salaAula !== undefined ? u.salaAula : canonical.salaAula,
            foto: u.foto || canonical.foto,
            email: u.email && u.email.trim() ? u.email : canonical.email,
            observacoes: u.observacoes && u.observacoes.trim() ? u.observacoes : canonical.observacoes
          };
        }

        // Custom users added by the school management
        if (u.nome && u.nome.includes('Carla')) {
          u.nome = u.nome.replace(/Carla/g, 'Sofia');
          updated = true;
        }

        if (!u.pin && u.telefone) {
          const digits = u.telefone.replace(/\D/g, '');
          if (digits.length >= 4) {
            u.pin = digits.slice(-4);
            updated = true;
          }
        }

        return u;
      });

      // 2. Ensure all canonical mock users exist in the users collection
      USUARIOS_SIMULADOS.forEach(canon => {
        const exists = cleanUsers.some((u: any) => u.id === canon.id);
        if (!exists) {
          cleanUsers.push(canon);
          updated = true;
        }
      });

      // 3. Enforce absolute uniqueness of PINs across custom users
      const seenPins = new Set<string>();
      // First register canonical PINs
      USUARIOS_SIMULADOS.forEach(c => {
        if (c.pin) seenPins.add(c.pin.trim());
      });

      cleanUsers.forEach((u: any) => {
        const canonical = USUARIOS_SIMULADOS.find(init => init.id === u.id);
        if (canonical && canonical.pin) {
          u.pin = canonical.pin;
          u.telefone = canonical.telefone;
          u.nome = canonical.nome;
          return;
        }

        let userPin = u.pin ? u.pin.trim() : '';
        if (!userPin || seenPins.has(userPin)) {
          const digits = u.telefone ? u.telefone.replace(/\D/g, '').slice(-4) : '';
          let candidate = (digits.length === 4 && !seenPins.has(digits)) ? digits : '';
          if (!candidate) {
            for (let i = 0; i < 1000; i++) {
              const testPin = String(Math.floor(1000 + Math.random() * 9000));
              if (!seenPins.has(testPin)) {
                candidate = testPin;
                break;
              }
            }
          }
          userPin = candidate || '7890';
          u.pin = userPin;
          updated = true;
        }
        seenPins.add(userPin);
      });

      localStorage.setItem('anjo_usuarios', JSON.stringify(cleanUsers));
    } catch (e) {
      console.error(e);
    }
  }

  checkAndSet('anjo_idosos', IDOSOS_INICIAIS);
  
  // Ensure classrooms are up-to-date and without fundamental rooms
  try {
    const storedSalas = localStorage.getItem('anjo_salas');
    if (storedSalas) {
      const parsedSalas = JSON.parse(storedSalas) as Classroom[];
      const cleanedSalas = parsedSalas.filter(s => !s.id.startsWith('sala_fun_'));
      // Add any missing preschool classrooms from SALAS_INICIAIS
      SALAS_INICIAIS.forEach(s => {
        if (!cleanedSalas.some(cs => cs.id === s.id || cs.name === s.name)) {
          cleanedSalas.push(s);
        }
      });
      localStorage.setItem('anjo_salas', JSON.stringify(cleanedSalas));
    } else {
      localStorage.setItem('anjo_salas', JSON.stringify(SALAS_INICIAIS));
    }
  } catch (e) {
    console.error('Erro ao sincronizar salas', e);
  }

  // Ensure preschool students exist with accurate room assignments and emergency contacts in anjo_idosos
  const storedIdosos = localStorage.getItem('anjo_idosos');
  const deletedStudentsList = JSON.parse(localStorage.getItem('anjo_deleted_students') || '[]') as string[];
  const deletedStudentsSet = new Set(deletedStudentsList);

  if (storedIdosos) {
    try {
      let parsed = JSON.parse(storedIdosos) as Idoso[];
      // Remove any legacy fundamental school students and deleted students
      parsed = parsed.filter(p => !p.id.startsWith('aluno_fun_') && !deletedStudentsSet.has(p.id));

      // Ensure preschool students exist and have their correct classroom and emergency contact assigned (unless deleted)
      IDOSOS_INICIAIS.forEach(initStudent => {
        if (deletedStudentsSet.has(initStudent.id)) return;
        const existingIdx = parsed.findIndex(p => 
          p.id === initStudent.id || 
          (initStudent.id === 'aluno_1' && p.id === 'idoso_maria') ||
          (initStudent.id === 'idoso_maria' && p.id === 'aluno_1') ||
          (initStudent.id === 'aluno_2' && p.id === 'idoso_joao') ||
          (initStudent.id === 'idoso_joao' && p.id === 'aluno_2') ||
          (p.nome && initStudent.nome && keyMatches(p.nome, initStudent.nome))
        );
        if (existingIdx >= 0) {
          // Normalize room assignments & contacts without destroying user-edited data
          parsed[existingIdx].salaAula = parsed[existingIdx].salaAula || initStudent.salaAula;
          parsed[existingIdx].quarto = parsed[existingIdx].quarto || initStudent.quarto;
          if (!parsed[existingIdx].nome || parsed[existingIdx].nome.length < 5) parsed[existingIdx].nome = initStudent.nome;
          
          // Upgrade legacy 'A cadastrar' contact to canonical contact or preserve user-entered contact
          const currentContact = parsed[existingIdx].contatoEmergencia;
          if (!currentContact || !currentContact.nome || currentContact.nome === 'A cadastrar' || currentContact.nome === 'Responsável a cadastrar') {
            parsed[existingIdx].contatoEmergencia = initStudent.contatoEmergencia;
          }
          if (!parsed[existingIdx].foto || parsed[existingIdx].foto.trim() === '' || parsed[existingIdx].foto.includes('placeholder')) {
            parsed[existingIdx].foto = initStudent.foto;
          }
        } else {
          parsed.push(initStudent);
        }
      });

      localStorage.setItem('anjo_idosos', JSON.stringify(parsed));
    } catch (e) {
      console.error('Erro ao migrar alunos', e);
    }
  } else {
    const activeInitials = IDOSOS_INICIAIS.filter(p => !deletedStudentsSet.has(p.id));
    localStorage.setItem('anjo_idosos', JSON.stringify(activeInitials));
  }
  checkAndSet('anjo_medicamentos', MEDICAMENTOS_INICIAIS);
  checkAndSet('anjo_agenda', AGENDA_INICIAL);
  checkAndSet('anjo_sinais', HISTORICO_SINAIS_INICAIS);
  checkAndSet('anjo_hidratacao', HISTORICO_HIDRATACAO_INICIAL);
  checkAndSet('anjo_sono', HISTORICO_SONO_INICIAL);
  checkAndSet('anjo_humor', HISTORICO_HUMOR_INICIAL);
  checkAndSet('anjo_alimentacao', HISTORICO_ALIMENTACAO_INICIAL);
  checkAndSet('anjo_atividades', HISTORICO_ATIVIDADE_INICIAL);
  checkAndSet('anjo_notificacoes', HISTORICO_NOTIFICACOES_INICIAIS);
  
  // Purge legacy mock activities so school and database start with clean activities
  try {
    const rawAtivStr = localStorage.getItem('anjo_atividades');
    if (rawAtivStr) {
      const parsedAtivs = JSON.parse(rawAtivStr) as any[];
      const cleanedAtivs = parsedAtivs.filter(a => a && a.id !== 'ati_m_1' && a.id !== 'ati_m_2' && a.id !== 'ati_j_1' && !a.tipo?.toLowerCase().includes('sol') && !a.observacoes?.toLowerCase().includes('sol'));
      if (cleanedAtivs.length !== parsedAtivs.length) {
        localStorage.setItem('anjo_atividades', JSON.stringify(cleanedAtivs));
      }
    }
  } catch (e) {
    console.error('Erro ao purgar atividades iniciais', e);
  }

  // Purge legacy mural seed messages
  try {
    const rawMuralStr = localStorage.getItem('anjo_mural_recados');
    if (rawMuralStr) {
      const parsedMural = JSON.parse(rawMuralStr) as any[];
      const cleanedMural = parsedMural.filter(r => r && r.id !== 'rec_seed_1' && r.id !== 'rec_seed_2' && !r.mensagem?.toLowerCase().includes('sol'));
      if (cleanedMural.length !== parsedMural.length) {
        localStorage.setItem('anjo_mural_recados', JSON.stringify(cleanedMural));
      }
    }
  } catch (e) {
    console.error('Erro ao purgar mural inicial', e);
  }

  // Purge legacy task_m_sol from tasks
  try {
    const rawTaskStr = localStorage.getItem('anjo_tarefas_diarias');
    if (rawTaskStr) {
      const parsedTasks = JSON.parse(rawTaskStr) as any[];
      const cleanedTasks = parsedTasks.filter(t => t && t.id !== 'task_m_sol' && !t.titulo?.toLowerCase().includes('banho de sol'));
      if (cleanedTasks.length !== parsedTasks.length) {
        localStorage.setItem('anjo_tarefas_diarias', JSON.stringify(cleanedTasks));
      }
    }
  } catch (e) {
    console.error('Erro ao purgar tarefas sol', e);
  }

  // Purge legacy auto-populated student hydration mock data so students start with 0ml
  try {
    const rawHidStr = localStorage.getItem('anjo_hidratacao');
    if (rawHidStr) {
      const parsedHids = JSON.parse(rawHidStr) as any[];
      const cleanedHids = parsedHids.filter(h => !h || !h.id || !String(h.id).startsWith('hid_e_a'));
      if (cleanedHids.length !== parsedHids.length) {
        localStorage.setItem('anjo_hidratacao', JSON.stringify(cleanedHids));
      }
    }
  } catch (e) {
    console.error('Erro ao purgar hidratação inicial de alunos', e);
  }

  // Merge student histories into existing DB tables if not present
  const mergeStudentHistory = <T extends { id: string; idosoId: string }>(key: string, initialList: T[]) => {
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as T[];
        const studentRecords = initialList.filter(item => item.idosoId.startsWith('aluno_'));
        const missing = studentRecords.filter(item => !parsed.some(existing => existing.id === item.id));
        if (missing.length > 0) {
          localStorage.setItem(key, JSON.stringify([...parsed, ...missing]));
        }
      } catch (e) {
        console.error(`Erro ao mesclar históricos para chave ${key}`, e);
      }
    }
  };

  mergeStudentHistory('anjo_alimentacao', HISTORICO_ALIMENTACAO_INICIAL);
  mergeStudentHistory('anjo_sono', HISTORICO_SONO_INICIAL);
  mergeStudentHistory('anjo_humor', HISTORICO_HUMOR_INICIAL);
  mergeStudentHistory('anjo_sinais', HISTORICO_SINAIS_INICAIS);
  
  // Set default simulation settings
  if (!localStorage.getItem('anjo_simulacao_user_id')) {
    localStorage.setItem('anjo_simulacao_user_id', 'user_cuidador_1'); // default to Caregiver Ana
  }
  if (!localStorage.getItem('anjo_simulacao_idoso_id')) {
    const currentMode = localStorage.getItem('anjo_app_mode') || 'escolar_infantil';
    const defaultId = currentMode.startsWith('escolar') ? 'aluno_1' : 'idoso_maria';
    localStorage.setItem('anjo_simulacao_idoso_id', defaultId);
  }

  // Purge any orphaned data left over from students that no longer exist in the system
  purgeOrphanedStudentData();
}

// Read helpers
export function getFromDB<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  const item = localStorage.getItem(key);
  if (!item) return defaultValue;
  try {
    return JSON.parse(item);
  } catch (e) {
    console.error(`Erro ao analisar JSON do localStorage para chave: ${key}`, e);
    return defaultValue;
  }
}

// Write helpers
export function pruneLocalStorageToFreeSpace() {
  console.warn("Iniciando auto-limpeza de emergência do localStorage para liberar espaço...");
  try {
    // 1. Truncate notifications (anjo_notificacoes) to the last 5 entries
    const notifsStr = localStorage.getItem('anjo_notificacoes');
    if (notifsStr) {
      try {
        const notifs = JSON.parse(notifsStr);
        if (Array.isArray(notifs) && notifs.length > 5) {
          console.log(`Removendo ${notifs.length - 5} notificações antigas...`);
          localStorage.setItem('anjo_notificacoes', JSON.stringify(notifs.slice(-5)));
        }
      } catch (e) {
        localStorage.removeItem('anjo_notificacoes');
      }
    }

    // 2. Clear old tasks with extremely large images in anjo_tarefas_diarias
    const tasksStr = localStorage.getItem('anjo_tarefas_diarias');
    if (tasksStr) {
      try {
        const tasks = JSON.parse(tasksStr);
        if (Array.isArray(tasks)) {
          let modified = false;
          // Deduplicar tarefas e garantir que almoço/papinha não se repita para o mesmo aluno
          const seenKeySet = new Set<string>();
          const seenLunchStudents = new Set<string>();
          const dedupedTasks: any[] = [];

          tasks.forEach(t => {
            if (!t || !t.idosoId) return;
            const tit = (t.titulo || '').toLowerCase();
            const isLunch = tit.includes('almoço') || tit.includes('almocinho') || tit.includes('papinha') || tit.includes('sopinha');
            const studentId = t.idosoId;

            if (isLunch) {
              if (seenLunchStudents.has(studentId)) {
                modified = true;
                return; // Ignora almoços duplicados
              }
              seenLunchStudents.add(studentId);
            }

            const key = `${studentId}_${(t.horarioPrevisto || '').trim()}_${tit.replace(/[^a-z0-9]/g, '')}`;
            if (!seenKeySet.has(key)) {
              seenKeySet.add(key);
              
              if (t.fotoTrabalhinho && t.fotoTrabalhinho.length > 20000) {
                modified = true;
                dedupedTasks.push({ ...t, fotoTrabalhinho: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=150" });
              } else {
                dedupedTasks.push(t);
              }
            } else {
              modified = true;
            }
          });

          if (modified || dedupedTasks.length !== tasks.length) {
            localStorage.setItem('anjo_tarefas_diarias', JSON.stringify(dedupedTasks));
          }
        }
      } catch (e) {
        console.error("Erro ao limpar fotos das tarefas", e);
      }
    }

    // 3. Clear old large photos ONLY if uncompressed (> 400KB base64 string) from anjo_idosos
    const seniorsStr = localStorage.getItem('anjo_idosos');
    if (seniorsStr) {
      try {
        const seniors = JSON.parse(seniorsStr);
        if (Array.isArray(seniors)) {
          let modified = false;
          const cleanedSeniors = seniors.map(s => {
            if (s.foto && s.foto.length > 500000) {
              console.log(`Foto extremamente pesada (>500KB) detectada em "${s.nome}". Otimizando...`);
              modified = true;
              return { ...s, foto: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=80" };
            }
            return s;
          });
          if (modified) {
            localStorage.setItem('anjo_idosos', JSON.stringify(cleanedSeniors));
          }
        }
      } catch (e) {
        console.error("Erro ao limpar fotos de alunos", e);
      }
    }

    // 4. Clear old large photos from anjo_medicamentos
    const medsStr = localStorage.getItem('anjo_medicamentos');
    if (medsStr) {
      try {
        const meds = JSON.parse(medsStr);
        if (Array.isArray(meds)) {
          let modified = false;
          const cleanedMeds = meds.map(m => {
            if (m.fotoEmbalagem && m.fotoEmbalagem.length > 20000) {
              console.log(`Reduzindo foto do medicamento "${m.nome}"...`);
              modified = true;
              return { ...m, fotoEmbalagem: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=80" };
            }
            return m;
          });
          if (modified) {
            localStorage.setItem('anjo_medicamentos', JSON.stringify(cleanedMeds));
          }
        }
      } catch (e) {
        console.error("Erro ao limpar fotos de medicamentos", e);
      }
    }
    console.log("Limpeza de emergência concluída com sucesso!");
  } catch (err) {
    console.error("Falha catastrófica ao tentar auto-limpar o localStorage:", err);
  }
}

export function saveToDB(key: string, data: any) {
  if (typeof window === 'undefined') return;

  const colName = getFirestoreCollectionForKey(key);
  let itemsToUpload: any[] = [];

  // 1. Calculate diff BEFORE overwriting localStorage so oldData is accurate!
  try {
    if (colName) {
      const oldDataRaw = localStorage.getItem(key);
      if (oldDataRaw && Array.isArray(data)) {
        const oldDataMap = new Map<string, string>();
        try {
          const oldArray = JSON.parse(oldDataRaw);
          if (Array.isArray(oldArray)) {
            oldArray.forEach(oldItem => {
              if (oldItem && oldItem.id) {
                oldDataMap.set(String(oldItem.id), JSON.stringify(oldItem));
              }
            });

            // Handle deleted items in batch
            const newIds = new Set(data.map(item => item?.id).filter(Boolean));
            const deletedIds: string[] = [];
            oldArray.forEach(oldItem => {
              if (oldItem && oldItem.id && !newIds.has(oldItem.id)) {
                deletedIds.push(String(oldItem.id));
              }
            });
            if (deletedIds.length > 0) {
              deleteBatchFromFirestore(key, deletedIds);
            }
          }
        } catch (e) {}

        // For shift states or other critical collections, upload items that are new or changed
        itemsToUpload = data.filter(newItem => {
          if (!newItem || !newItem.id) return false;
          const oldJson = oldDataMap.get(String(newItem.id));
          if (!oldJson) return true; // New item!
          return JSON.stringify(newItem) !== oldJson; // Modified item!
        });
      } else if (Array.isArray(data)) {
        itemsToUpload = data;
      } else if (data) {
        itemsToUpload = [data];
      }
    }
  } catch (err) {
    if (Array.isArray(data)) itemsToUpload = data;
    else if (data) itemsToUpload = [data];
  }

  // 2. Write to local storage
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e: any) {
    console.error(`Erro ao gravar no localStorage para chave: ${key}`, e);
    const isQuotaError = e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22 || e.code === 1014;
    
    if (isQuotaError) {
      // Self-heal and retry!
      pruneLocalStorageToFreeSpace();
      try {
        localStorage.setItem(key, JSON.stringify(data));
        console.log(`Sucesso ao salvar chave ${key} após limpeza de emergência!`);
      } catch (retryError) {
        console.error("Falha ao salvar mesmo após a auto-limpeza:", retryError);
      }
    }
  }

  // 3. Write ONLY modified or new items to Firestore immediately (not deferred in broken setTimeout)
  try {
    if (colName && itemsToUpload.length > 0) {
      itemsToUpload.forEach(item => {
        if (item) {
          saveToFirestore(key, item);
        }
      });
      console.log(`⚡ [Firebase Diff Sync] Enviando ${itemsToUpload.length} item(ns) para Firestore na chave "${key}".`);
    }
  } catch (err) {
    console.error("[Firebase Sync] Error uploading saved items", err);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('db-vitals-update'));
    window.dispatchEvent(new CustomEvent('anjo_user_updated', { detail: { localKey: key } }));
    notifyCrossTabSync(key);
  }
}

// Helper to compress images client-side using Canvas to avoid localStorage quota limits (reduces size from 5MB+ to ~10KB)
export function compressImage(file: File, maxWidth: number = 200, maxHeight: number = 200, quality: number = 0.4): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
      img.src = event.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

// Helper to compress existing Base64 / Data URL images before saving to Firestore & LocalStorage
export function compressBase64Image(base64Str: string, maxWidth: number = 250, maxHeight: number = 250, quality: number = 0.5): Promise<string> {
  return new Promise((resolve) => {
    if (!base64Str || !base64Str.startsWith('data:image')) {
      resolve(base64Str);
      return;
    }
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Str);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(base64Str);
    img.src = base64Str;
  });
}

export interface AuthorizationStatus {
  isAuthorized: boolean;
  authorizedNames: string[];
  totalResponsibles: number;
}

export function checkFeedingCareAuthorization(): AuthorizationStatus {
  if (typeof window === 'undefined') {
    return { isAuthorized: true, authorizedNames: [], totalResponsibles: 0 };
  }
  
  const storedUsers = localStorage.getItem('anjo_usuarios');
  let allUsers: any[] = [];
  if (storedUsers) {
    try {
      allUsers = JSON.parse(storedUsers);
    } catch (e) {
      // ignore
    }
  }

  const responsibles = allUsers.filter(u => u.tipo === 'familiar');

  return {
    isAuthorized: true,
    authorizedNames: responsibles.map(u => u.nome),
    totalResponsibles: responsibles.length
  };
}

export function isTeacherForRoom(u: Usuario | null | undefined, roomName: string): boolean {
  if (!u || !u.salaAula || !roomName) return false;
  const isStaff = u.tipo === 'cuidador' || u.tipo === 'professor' || u.tipo === 'professora' || u.tipo === 'educador' || u.tipo === 'educadora' || u.tipo === 'admin' || u.tipo === 'diretor' || u.tipo === 'coordenador';
  if (!isStaff) return false;
  const targetNorm = normalizeKey(roomName);
  const userRooms = u.salaAula.split(',').map(r => r.trim()).filter(Boolean);
  return userRooms.some(r => {
    const rNorm = normalizeKey(r);
    return rNorm === targetNorm || keyMatches(r, roomName);
  });
}

export function getAssignedTeacherForRoom(roomName: string, activeUser?: Usuario | null): Usuario | null {
  if (!roomName) return null;
  
  // 1. If activeUser is logged in and is a teacher/staff for this room, PREFER activeUser!
  if (activeUser && isTeacherForRoom(activeUser, roomName)) {
    return activeUser;
  }

  const allUsers = getFromDB<Usuario[]>('anjo_usuarios', USUARIOS_SIMULADOS);
  
  // 2. Find in stored DB users (excluding general directors/admins/coordinators unless assigned to the room)
  let matched = allUsers.find(u => u.tipo !== 'admin' && u.tipo !== 'diretor' && u.tipo !== 'coordenador' && isTeacherForRoom(u, roomName));
  if (matched) return matched;

  // 3. Check any staff user
  let anyStaff = allUsers.find(u => isTeacherForRoom(u, roomName));
  if (anyStaff) return anyStaff;
  
  return null;
}

export interface ShiftState {
  id: string; // student or senior ID (e.g. 'aluno_heitor')
  active: boolean;
  isAbsent?: boolean;
  reason?: string | null;
  startTime?: string | null;
  lastResetTime?: string | null;
  updatedAt?: string;
}

export function normalizeKey(str: string | undefined | null): string {
  if (!str) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function keyMatches(keyA: string | undefined | null, keyB: string | undefined | null): boolean {
  if (!keyA || !keyB) return false;
  const normA = normalizeKey(keyA);
  const normB = normalizeKey(keyB);
  if (normA === normB) return true;
  const cleanA = normA.replace(/[^a-z0-9]/g, '');
  const cleanB = normB.replace(/[^a-z0-9]/g, '');
  if (cleanA && cleanB && cleanA === cleanB) return true;
  return false;
}

export function getStudentRoomName(studentObj: any): string | null {
  if (!studentObj) return null;
  if (typeof studentObj === 'object') {
    if (studentObj.salaAula && studentObj.salaAula !== 'Todas') return studentObj.salaAula;
    if (studentObj.quarto && studentObj.quarto !== 'Todas') return studentObj.quarto;
    if (studentObj.sala && studentObj.sala !== 'Todas') return studentObj.sala;
    if (studentObj.nome) return getStudentRoomName(studentObj.nome);
    return null;
  }
  const name = String(studentObj);
  const rooms = getFromDB<any[]>('anjo_salas', SALAS_INICIAIS);
  const sortedRooms = [...rooms].sort((a, b) => b.name.length - a.name.length);
  const found = sortedRooms.find(r => name.includes(r.name));
  if (found) return found.name;

  const match = name.match(/\(([^)]+)\)/);
  if (match) {
    const content = match[1];
    const parts = content.split('-');
    if (parts.length > 0) {
      const potentialRoom = parts[0].trim();
      const foundFallback = sortedRooms.find(r => r.name.toLowerCase().includes(potentialRoom.toLowerCase()) || potentialRoom.toLowerCase().includes(r.name.toLowerCase()));
      if (foundFallback) return foundFallback.name;
    }
  }

  if (name.includes('Berçário I - B') || name.includes('Berçário 1B') || name.includes('Berçário 1 - B') || name.includes('B1-B') || name.includes('B1B')) return 'Berçário I - B';
  if (name.includes('Berçário I - A') || name.includes('Berçário 1A') || name.includes('Berçário 1 - A') || name.includes('Berçário I') || name.includes('Berçário 1')) return 'Berçário I - A';
  if (name.includes('Berçário III') || name.includes('Berçário 3')) return 'Berçário III';
  if (name.includes('Berçário II') || name.includes('Berçário 2')) return 'Berçário II';
  if (name.includes('Maternal I - D') || name.includes('Maternal 1D')) return 'Maternal I - D';
  if (name.includes('Maternal I - C') || name.includes('Maternal 1C')) return 'Maternal I - C';
  if (name.includes('Maternal I - B') || name.includes('Maternal 1B')) return 'Maternal I - B';
  if (name.includes('Maternal I - A') || name.includes('Maternal 1A') || name.includes('Maternal I') || name.includes('Maternal 1')) return 'Maternal I - A';
  if (name.includes('Maternal II - C') || name.includes('Maternal 2C')) return 'Maternal II - C';
  if (name.includes('Maternal II - B') || name.includes('Maternal 2B')) return 'Maternal II - B';
  if (name.includes('Maternal II - A') || name.includes('Maternal 2A') || name.includes('Maternal II') || name.includes('Maternal 2')) return 'Maternal II - A';
  if (name.includes('Jardim I - B') || name.includes('Jardim 1B')) return 'Jardim I - B';
  if (name.includes('Jardim I - A') || name.includes('Jardim 1A') || name.includes('Jardim I')) return 'Jardim I - A';
  if (name.includes('Jardim II - B') || name.includes('Jardim 2B')) return 'Jardim II - B';
  if (name.includes('Jardim II - A') || name.includes('Jardim 2A') || name.includes('Jardim II')) return 'Jardim II - A';

  return null;
}

export function isStudentInRoom(student: Idoso | null | undefined, roomName: string | null | undefined): boolean {
  if (!student || !roomName) return false;
  const sRoom = student.salaAula || student.quarto || getStudentRoomName(student);
  if (!sRoom) return false;
  return keyMatches(sRoom, roomName);
}

export function getAllPossibleStudentKeys(key: string): string[] {
  if (!key) return [];
  const trimmed = String(key).trim();
  const keys = new Set<string>();
  keys.add(trimmed);

  if (trimmed === 'idoso_maria') { keys.add('aluno_1'); }
  if (trimmed === 'aluno_1') { keys.add('idoso_maria'); }
  if (trimmed === 'idoso_joao') { keys.add('aluno_2'); }
  if (trimmed === 'aluno_2') { keys.add('idoso_joao'); }

  const allStudents = getFromDB<Idoso[]>('anjo_idosos', IDOSOS_INICIAIS);
  const student = allStudents.find(s => 
    s.id === trimmed || 
    (s.nome && s.nome.toLowerCase() === trimmed.toLowerCase()) ||
    keyMatches(s.id, trimmed) ||
    (s.nome && keyMatches(s.nome, trimmed)) ||
    (s.nome && keyMatches(s.nome.split(' (')[0], trimmed))
  );

  if (student) {
    if (student.id) {
      keys.add(student.id);
      if (student.id === 'idoso_maria') keys.add('aluno_1');
      if (student.id === 'aluno_1') keys.add('idoso_maria');
      if (student.id === 'idoso_joao') keys.add('aluno_2');
      if (student.id === 'aluno_2') keys.add('idoso_joao');
    }
    if (student.nome) {
      keys.add(student.nome);
      keys.add(student.nome.split(' (')[0].trim());
    }
  }

  return Array.from(keys).filter(Boolean);
}

export function getShiftActiveState(studentId: string, customShiftStates?: ShiftState[]): { active: boolean; isAbsent: boolean; reason?: string | null; startTime: string | null; lastResetTime: string | null } {
  if (typeof window === 'undefined' || !studentId) return { active: false, isAbsent: false, reason: null, startTime: null, lastResetTime: null };
  
  let targetStudentId = String(studentId).trim();
  const appMode = (localStorage.getItem('anjo_app_mode') as 'idoso' | 'escolar_infantil' | 'escolar_fundamental') || 'escolar_infantil';
  if (appMode.startsWith('escolar')) {
    if (targetStudentId === 'idoso_maria') targetStudentId = 'aluno_1';
    else if (targetStudentId === 'idoso_joao') targetStudentId = 'aluno_2';
  } else {
    if (targetStudentId === 'aluno_1') targetStudentId = 'idoso_maria';
    else if (targetStudentId === 'aluno_2') targetStudentId = 'idoso_joao';
  }
  const allStudents = getFromDB<Idoso[]>('anjo_idosos', IDOSOS_INICIAIS);
  const studentObj = allStudents.find(s => 
    s.id === targetStudentId || 
    (s.nome && s.nome.toLowerCase() === targetStudentId.toLowerCase()) ||
    keyMatches(s.id, targetStudentId) ||
    (s.nome && keyMatches(s.nome, targetStudentId)) ||
    (s.nome && keyMatches(s.nome.split(' (')[0], targetStudentId))
  );

  const realId = studentObj?.id || targetStudentId;
  const studentName = studentObj?.nome || '';
  const studentCleanName = studentName.split(' (')[0].trim();
  const studentRoom = studentObj?.salaAula || studentObj?.quarto || getStudentRoomName(studentObj || targetStudentId);

  const possibleKeys = getAllPossibleStudentKeys(realId);

  // Check if any local storage active flag is true across possible keys
  let localActiveFlag = false;
  let localActiveKey = '';
  for (const k of possibleKeys) {
    if (localStorage.getItem(`anjo_shift_active_${k}`) === 'true') {
      localActiveFlag = true;
      localActiveKey = k;
      break;
    }
  }

  // Check if any local storage absent flag is true
  let localAbsentFlag = false;
  for (const k of possibleKeys) {
    if (localStorage.getItem(`anjo_is_absent_${k}`) === 'true') {
      localAbsentFlag = true;
      break;
    }
  }

  // 1. Check shift states in DB (PRIMARY SOURCE OF TRUTH)
  const shiftStates = customShiftStates && Array.isArray(customShiftStates) 
    ? customShiftStates 
    : getFromDB<ShiftState[]>('anjo_shift_states', []);

  const directRecords: { record: ShiftState; time: number }[] = [];
  const classroomRecords: { record: ShiftState; time: number }[] = [];

  shiftStates.forEach(s => {
    if (!s || !s.id) return;
    const sid = String(s.id).trim();
    
    let time = 0;
    if (s.updatedAt) {
      const p = new Date(s.updatedAt).getTime();
      if (!isNaN(p)) time = p;
    }
    if (time === 0 && s.startTime) {
      const p = new Date(s.startTime).getTime();
      if (!isNaN(p)) time = p;
    }

    // Direct student match across possible keys
    const isDirectMatch = possibleKeys.some(pk => pk === sid || keyMatches(pk, sid) || keyMatches(sid, pk));
    if (isDirectMatch) {
      directRecords.push({ record: s, time });
      return;
    }

    // Exact classroom match
    if (studentRoom && keyMatches(sid, studentRoom)) {
      classroomRecords.push({ record: s, time });
      return;
    }
  });

  // PRIORITY 1: Direct Student Records (from Firestore)
  if (directRecords.length > 0) {
    directRecords.sort((a, b) => b.time - a.time);
    const latestDirect = directRecords[0].record;
    const isActive = latestDirect.active === true || String(latestDirect.active) === 'true';

    if (isActive) {
      // Sync local to remote state
      possibleKeys.forEach(k => {
        localStorage.removeItem(`anjo_is_absent_${k}`);
        localStorage.setItem(`anjo_is_absent_${k}`, 'false');
        localStorage.removeItem(`anjo_shift_active_${k}`);
        localStorage.setItem(`anjo_shift_active_${k}`, 'true');
      });

      const startTime = latestDirect.startTime || new Date().toISOString();
      const lastResetTime = latestDirect.lastResetTime || startTime;
      return { active: true, isAbsent: false, reason: null, startTime, lastResetTime };
    } else {
      // Not active in Firestore
      const isAbsentBool = Boolean(latestDirect.isAbsent || latestDirect.reason);
      if (isAbsentBool) {
        possibleKeys.forEach(k => localStorage.setItem(`anjo_is_absent_${k}`, 'true'));
      }
      possibleKeys.forEach(k => {
        localStorage.setItem(`anjo_shift_active_${k}`, 'false');
      });
      return { 
        active: false, 
        isAbsent: isAbsentBool, 
        reason: latestDirect.reason || null, 
        startTime: null, 
        lastResetTime: latestDirect.lastResetTime || null 
      };
    }
  }

  // PRIORITY 2: Classroom Records (Firestore)
  if (classroomRecords.length > 0) {
    classroomRecords.sort((a, b) => b.time - a.time);
    const latestClassroom = classroomRecords[0].record;
    const isActive = latestClassroom.active === true || String(latestClassroom.active) === 'true';

    if (isActive) {
      possibleKeys.forEach(k => {
        localStorage.setItem(`anjo_shift_active_${k}`, 'true');
      });

      const startTime = latestClassroom.startTime || new Date().toISOString();
      const lastResetTime = latestClassroom.lastResetTime || startTime;
      return { active: true, isAbsent: false, reason: null, startTime, lastResetTime };
    }
  }

  // FALLBACK: If no direct DB record, use local storage
  if (localActiveFlag) {
    const localDirectStartTime = possibleKeys.reduce((acc, k) => acc || localStorage.getItem(`anjo_shift_start_time_${k}`), null as string | null);
    const startTime = localDirectStartTime || new Date().toISOString();
    return { active: true, isAbsent: false, reason: null, startTime, lastResetTime: startTime };
  }

  // 2. Absence check fallback
  if (localAbsentFlag) {
    return { active: false, isAbsent: true, reason: 'Ausente', startTime: null, lastResetTime: null };
  }

  // 3. Fallback: check direct localStorage flags
  let localDirectActive = false;
  for (const k of possibleKeys) {
    if (localStorage.getItem(`anjo_shift_active_${k}`) === 'true') {
      localDirectActive = true;
      break;
    }
  }
  if (studentRoom && localStorage.getItem(`anjo_shift_active_${studentRoom}`) === 'true') {
    localDirectActive = true;
  }
  
  if (localDirectActive) {
    const localDirectStartTime = possibleKeys.reduce((acc, k) => acc || localStorage.getItem(`anjo_shift_start_time_${k}`), null as string | null) ||
      (studentRoom ? localStorage.getItem(`anjo_shift_start_time_${studentRoom}`) : null);
    const localResetTime = possibleKeys.reduce((acc, k) => acc || localStorage.getItem(`anjo_routine_reset_${k}`), null as string | null) || localDirectStartTime;
    return { active: true, isAbsent: false, reason: null, startTime: localDirectStartTime || new Date().toISOString(), lastResetTime: localResetTime };
  }

  return { active: false, isAbsent: false, reason: null, startTime: null, lastResetTime: null };
}



export function isRecordBeforeResetTimestamp(item: any, resetTimeStr: string | null | undefined): boolean {
  if (!item || !resetTimeStr) return false;
  const resetTime = new Date(resetTimeStr).getTime();
  if (isNaN(resetTime)) return false;

  // Check item.createdAt
  if (item.createdAt) {
    const t = new Date(item.createdAt).getTime();
    if (!isNaN(t)) return t < resetTime;
  }

  // Check item.id timestamp suffix (e.g. ati_aluno_1_1724500000000)
  if (item.id) {
    const parts = String(item.id).split('_');
    const lastPart = Number(parts[parts.length - 1]);
    if (!isNaN(lastPart) && lastPart > 1600000000000) {
      return lastPart < resetTime;
    }
  }

  // Check item.data (YYYY-MM-DD string comparison)
  const resetDateStr = resetTimeStr.split('T')[0];
  if (item.data && typeof item.data === 'string') {
    if (item.data < resetDateStr) return true;
  }

  return false;
}

export function purgeStaleStudentRoutineLocalRecords(studentId: string, resetTimeStr: string) {
  if (typeof window === 'undefined' || !studentId || !resetTimeStr) return;

  const collectionsToClean = [
    'anjo_alimentacao',
    'anjo_hidratacao',
    'anjo_humor',
    'anjo_atividades',
    'anjo_sono',
    'anjo_ocorrencias'
  ];

  collectionsToClean.forEach(colKey => {
    const items = getFromDB<any[]>(colKey, []);
    if (items && items.length > 0) {
      const freshItems = items.filter(item => {
        if (!item) return false;
        const sId = item.idosoId || item.studentId || item.alunoId;
        if (sId !== studentId) return true;
        return !isRecordBeforeResetTimestamp(item, resetTimeStr);
      });
      if (freshItems.length !== items.length) {
        saveToDB(colKey, freshItems);
      }
    }
  });

  const perStudentKeys = [
    `anjo_registro_agua_${studentId}`,
    `anjo_hidratacao_${studentId}`,
    `anjo_alimentacao_${studentId}`,
    `anjo_humor_${studentId}`,
    `anjo_atividades_${studentId}`,
    `anjo_sono_${studentId}`,
    `anjo_ocorrencias_${studentId}`
  ];
  perStudentKeys.forEach(pKey => {
    const items = getFromDB<any[]>(pKey, []);
    if (items && items.length > 0) {
      const freshItems = items.filter(item => !isRecordBeforeResetTimestamp(item, resetTimeStr));
      saveToDB(pKey, freshItems);
    }
  });

  const allTasks = getFromDB<any[]>('anjo_tarefas_diarias', []);
  if (allTasks && allTasks.length > 0) {
    let taskChanged = false;
    const updatedTasks = allTasks.map(task => {
      if (task && task.idosoId === studentId && task.status === 'concluido') {
        const isStale = isRecordBeforeResetTimestamp(
          { ...task, createdAt: task.concluidaEm || task.createdAt },
          resetTimeStr
        );
        if (isStale) {
          taskChanged = true;
          return {
            ...task,
            status: 'pendente' as const,
            concluidaEm: undefined,
            completadaPor: undefined,
            observacao: undefined,
            detalhes: undefined
          };
        }
      }
      return task;
    });
    if (taskChanged) {
      saveToDB('anjo_tarefas_diarias', updatedTasks);
    }
  }
}

export function syncShiftStateLocalStorageFlags(shiftItems?: ShiftState[]) {
  if (typeof window === 'undefined') return;

  const allStudents = getFromDB<Idoso[]>('anjo_idosos', IDOSOS_INICIAIS);

  allStudents.forEach(s => {
    const shiftInfo = getShiftActiveState(s.id, shiftItems);
    const keys = [s.id, s.nome, s.nome.split(' (')[0].trim()].filter(Boolean);
    const effectiveResetTime = shiftInfo.lastResetTime || shiftInfo.startTime;

    keys.forEach(k => {
      if (shiftInfo.active) {
        localStorage.setItem(`anjo_shift_active_${k}`, 'true');
        if (shiftInfo.startTime) localStorage.setItem(`anjo_shift_start_time_${k}`, shiftInfo.startTime);
        if (effectiveResetTime) localStorage.setItem(`anjo_routine_reset_${k}`, effectiveResetTime);
        localStorage.removeItem(`anjo_is_absent_${k}`);
        localStorage.setItem(`anjo_is_absent_${k}`, 'false');
      } else {
        localStorage.removeItem(`anjo_shift_start_time_${k}`);
        localStorage.setItem(`anjo_shift_active_${k}`, 'false');
        if (shiftInfo.isAbsent || shiftInfo.reason) {
          localStorage.setItem(`anjo_is_absent_${k}`, 'true');
        } else {
          localStorage.removeItem(`anjo_is_absent_${k}`);
          localStorage.setItem(`anjo_is_absent_${k}`, 'false');
        }
      }
    });

    if (effectiveResetTime) {
      localStorage.setItem(`anjo_routine_reset_${s.id}`, effectiveResetTime);
      purgeStaleStudentRoutineLocalRecords(s.id, effectiveResetTime);
    }
  });
}

export function generateDefaultTasksForStudent(idosoId: string): any[] {
  const isEscolarStudent = idosoId.startsWith('aluno_') || idosoId.startsWith('aluno') || idosoId.startsWith('escola_');
  if (isEscolarStudent) {
    return [
      {
        id: 'task_s_entrada_' + idosoId,
        idosoId,
        tipo: 'atividade_fisica',
        titulo: 'Acolhida & Entrada Afetiva 🏫',
        descricao: 'Recepção carinhosa dos alunos, acolhimento individual e organização de pertences.',
        horarioPrevisto: '07:00',
        status: 'pendente'
      },
      {
        id: 'task_s_roda_' + idosoId,
        idosoId,
        tipo: 'atividade_fisica',
        titulo: 'Roda de Conversa: Tema do Dia 🪞',
        descricao: 'Apresentação do tema diário, musicalização, chamada divertida e expressão das crianças.',
        horarioPrevisto: '08:00',
        status: 'pendente'
      },
      {
        id: 'task_s_lanche_manha_' + idosoId,
        idosoId,
        tipo: 'alimentacao',
        titulo: 'Lanche da Manhã & Frutinhas 🍎',
        descricao: 'Frutas frescas da estação, biscoito integral e incentivo à hidratação.',
        horarioPrevisto: '09:00',
        status: 'pendente'
      },
      {
        id: 'task_s_parque_' + idosoId,
        idosoId,
        tipo: 'atividade_fisica',
        titulo: 'Recreação no Pátio & Parquinho 🧸',
        descricao: 'Brincadeiras ao ar livre para estímulo motor, socialização e banho de sol adequado.',
        horarioPrevisto: '09:45',
        status: 'pendente'
      },
      {
        id: 'task_s_dirigida_' + idosoId,
        idosoId,
        tipo: 'atividade_fisica',
        titulo: 'Atividade Dirigida Temática (BNCC) 🎨',
        descricao: 'Atividade prática pedagógica com foco no desenvolvimento cognitivo e sensorial.',
        horarioPrevisto: '10:30',
        status: 'pendente'
      },
      {
        id: 'task_s_almoco_' + idosoId,
        idosoId,
        tipo: 'alimentacao',
        titulo: 'Almoço Saudável / Papinha 🍲',
        descricao: 'Pratinho balanceado, introdução de novos sabores, verduras e carninha desfiada.',
        horarioPrevisto: '11:30',
        status: 'pendente'
      },
      {
        id: 'task_s_higiene_escovacao_' + idosoId,
        idosoId,
        tipo: 'banho',
        titulo: 'Higiene, Fraldas & Escovação 👶',
        descricao: 'Troca de fraldas, lavagem das mãos e estímulo à escovação dental com carinho.',
        horarioPrevisto: '12:15',
        status: 'pendente'
      },
      {
        id: 'task_s_soneca_' + idosoId,
        idosoId,
        tipo: 'sono',
        titulo: 'Soneca & Repouso Restaurador 💤',
        descricao: 'Descanso nos colchonetes individuais com ambiente calmo, iluminação suave e música relaxante.',
        horarioPrevisto: '12:30',
        status: 'pendente'
      },
      {
        id: 'task_s_lanche_tarde_' + idosoId,
        idosoId,
        tipo: 'alimentacao',
        titulo: 'Lanche da Tarde / Mamadeira 🍼',
        descricao: 'Mamadeira/fórmula morna ou lanche da tarde equilibrado e hidratação.',
        horarioPrevisto: '14:15',
        status: 'pendente'
      },
      {
        id: 'task_s_brincadeira_livre_' + idosoId,
        idosoId,
        tipo: 'atividade_fisica',
        titulo: 'Brincadeira Livre & Socialização 🧸',
        descricao: 'Cantinhos temáticos com brinquedos educativos, blocos de montar e autonomia.',
        horarioPrevisto: '14:45',
        status: 'pendente'
      },
      {
        id: 'task_s_historias_' + idosoId,
        idosoId,
        tipo: 'atividade_fisica',
        titulo: 'Contação de Histórias & Música 📚',
        descricao: 'Leitura de livros ilustrados, fantoches e cantigas de roda.',
        horarioPrevisto: '15:30',
        status: 'pendente'
      },
      {
        id: 'task_s_saida_' + idosoId,
        idosoId,
        tipo: 'atividade_fisica',
        titulo: 'Preparação para Saída & Despedida Afetiva 🎒',
        descricao: 'Organização das mochilinhas, fechamento da agenda do dia e entrega afetiva aos familiares.',
        horarioPrevisto: '16:00',
        status: 'pendente'
      }
    ];
  }
  return [
    {
      id: 'task_m_losartana_' + idosoId,
      idosoId,
      tipo: 'medicacao',
      titulo: 'Losartana Potássica (Pressão)',
      descricao: 'Dosagem: 50mg - 1 comprimido. Dar com meio copo d\'água.',
      horarioPrevisto: '08:00',
      status: 'pendente'
    },
    {
      id: 'task_m_cafe_' + idosoId,
      idosoId,
      tipo: 'alimentacao',
      titulo: 'Café da manhã',
      descricao: 'Geleia sem açúcar com pão integral + café com leite.',
      horarioPrevisto: '08:30',
      status: 'pendente'
    },
    {
      id: 'task_m_banho_' + idosoId,
      idosoId,
      tipo: 'banho',
      titulo: 'Banho & Higiene Geral',
      descricao: 'Banho morno assistido, hidratação da pele e troca de roupas limpas.',
      horarioPrevisto: '10:00',
      status: 'pendente'
    },
    {
      id: 'task_m_almoco_' + idosoId,
      idosoId,
      tipo: 'alimentacao',
      titulo: 'Almoço',
      descricao: 'Arroz integral, purê de abóbora, filé de frango desfiado e brócolis cozido ao vapor.',
      horarioPrevisto: '12:30',
      status: 'pendente'
    },
    {
      id: 'task_m_hidra_tarde_' + idosoId,
      idosoId,
      tipo: 'hidratacao',
      titulo: 'Copos d\'Água da Tarde',
      descricao: 'Oferecer 250ml de água gelada.',
      horarioPrevisto: '15:00',
      status: 'pendente'
    }
  ];
}

export function resetStudentDailyRoutine(studentIds: string[]) {
  if (typeof window === 'undefined' || !studentIds || studentIds.length === 0) return;

  const validIds = new Set(studentIds.filter(Boolean));
  if (validIds.size === 0) return;

  const resetNowIso = new Date().toISOString();

  // Set reset timestamp & flags so old records from previous days are zeroed out completely
  validIds.forEach(id => {
    localStorage.setItem(`anjo_tasks_initialized_${id}`, 'true');
    localStorage.setItem(`anjo_routine_reset_${id}`, resetNowIso);
    localStorage.removeItem(`anjo_tasks_cleared_${id}`);
    localStorage.removeItem(`anjo_activities_cleared_${id}`);
    localStorage.removeItem(`anjo_routine_cleared_${id}`);
  });

  // 1. Clear routine activity tables for these students so they start at 0
  const allMeals = getFromDB<any[]>('anjo_alimentacao', []);
  saveToDB('anjo_alimentacao', allMeals.filter(m => !m || !m.idosoId || !validIds.has(m.idosoId)));

  const allHids = getFromDB<any[]>('anjo_hidratacao', []);
  saveToDB('anjo_hidratacao', allHids.filter(h => !h || !h.idosoId || !validIds.has(h.idosoId)));

  const allHumor = getFromDB<any[]>('anjo_humor', []);
  saveToDB('anjo_humor', allHumor.filter(h => !h || !h.idosoId || !validIds.has(h.idosoId)));

  // Clear ALL activities for these students completely
  const allAtivs = getFromDB<any[]>('anjo_atividades', []);
  saveToDB('anjo_atividades', allAtivs.filter(a => !a || !a.idosoId || !validIds.has(a.idosoId)));

  const allSono = getFromDB<any[]>('anjo_sono', []);
  saveToDB('anjo_sono', allSono.filter(s => !s || !s.idosoId || !validIds.has(s.idosoId)));

  // 2. Reset daily tasks checklist (anjo_tarefas_diarias) to 'pendente' for the new day
  const allTasks = getFromDB<any[]>('anjo_tarefas_diarias', []);
  const otherTasks = allTasks.filter(t => !t || !t.idosoId || !validIds.has(t.idosoId));
  const newOrResetTasks: any[] = [];

  validIds.forEach(id => {
    const studentTasks = allTasks.filter(t => t && t.idosoId === id);
    if (studentTasks.length > 0) {
      studentTasks.forEach(t => {
        newOrResetTasks.push({
          ...t,
          status: 'pendente' as const,
          concluidaEm: undefined,
          completadaPor: undefined,
          observacao: undefined,
          detalhes: undefined
        });
      });
    } else {
      newOrResetTasks.push(...generateDefaultTasksForStudent(id));
    }
  });

  saveToDB('anjo_tarefas_diarias', [...otherTasks, ...newOrResetTasks]);

  // 3. Clear individual per-student logs and hygiene checkboxes
  validIds.forEach(id => {
    localStorage.removeItem(`anjo_almoço_pct_${id}`);
    localStorage.removeItem(`anjo_sleep_hr_${id}`);
    localStorage.removeItem(`anjo_registro_agua_${id}`);
    localStorage.removeItem(`anjo_hidratacao_${id}`);
    localStorage.removeItem(`anjo_alimentacao_${id}`);
    localStorage.removeItem(`anjo_humor_${id}`);
    localStorage.removeItem(`anjo_atividades_${id}`);
    localStorage.removeItem(`anjo_sono_${id}`);
    localStorage.removeItem(`anjo_sinais_vitais_${id}`);
    localStorage.removeItem(`anjo_is_absent_${id}`);

    saveToDB(`anjo_registro_agua_${id}`, []);
    saveToDB(`anjo_hidratacao_${id}`, []);
    saveToDB(`anjo_alimentacao_${id}`, []);
    saveToDB(`anjo_humor_${id}`, []);
    saveToDB(`anjo_atividades_${id}`, []);
    saveToDB(`anjo_sono_${id}`, []);
    saveToDB(`anjo_ocorrencias_${id}`, []);

    saveToDB(`anjo_higiene_log_${id}`, {
      bath: false,
      teeth: false,
      clothes: false,
      diaper: false,
      hands: false,
      cream: false,
      banho: false,
      higieneBucal: false,
      trocaRoupa: false,
      trocaFralda: false,
      pele: false,
      time: '',
      observations: ''
    });
  });

  // 4. Delete remote data in Firestore so onSnapshot listeners don't resurrect cleared activities
  deleteStudentDataFromFirestore(Array.from(validIds)).catch((err) => {
    console.warn('[resetStudentDailyRoutine] Remote Firestore cleanup error:', err);
  });

  // 5. Broadcast events to refresh all components instantly
  window.dispatchEvent(new CustomEvent('anjo_user_updated'));
  window.dispatchEvent(new CustomEvent('db-vitals-update'));
  window.dispatchEvent(new CustomEvent('db-tasks-update'));
  window.dispatchEvent(new CustomEvent('db-routine-update'));
  window.dispatchEvent(new CustomEvent('db-jornada-update'));
  window.dispatchEvent(new CustomEvent('db-activities-update'));
}

export function setShiftActiveStatesBatch(updates: { targetKey: string; active: boolean; isAbsent?: boolean; reason?: string | null; startTime?: string }[]) {
  if (typeof window === 'undefined' || !updates || updates.length === 0) return;

  const nowStr = new Date().toISOString();
  const allStudents = getFromDB<Idoso[]>('anjo_idosos', IDOSOS_INICIAIS);
  let shiftStates = getFromDB<ShiftState[]>('anjo_shift_states', []);

  updates.forEach(({ targetKey, active, isAbsent, reason, startTime }) => {
    if (!targetKey) return;
    const cleanKey = String(targetKey).trim();

    let effectiveStartTime: string | null = null;
    if (active) {
      const rawTime = startTime || new Date().toISOString();
      if (!isNaN(new Date(rawTime).getTime())) {
        effectiveStartTime = rawTime;
      } else if (rawTime.includes(':')) {
        const parts = rawTime.split(':');
        const d = new Date();
        d.setHours(parseInt(parts[0], 10) || 0, parseInt(parts[1], 10) || 0, 0, 0);
        effectiveStartTime = d.toISOString();
      } else {
        effectiveStartTime = nowStr;
      }
    }

    const upsertState = (k: string) => {
      if (!k) return;
      const normalizedK = String(k).trim();
      if (!normalizedK) return;

      if (active) {
        localStorage.setItem(`anjo_shift_active_${normalizedK}`, 'true');
        if (effectiveStartTime) {
          localStorage.setItem(`anjo_shift_start_time_${normalizedK}`, effectiveStartTime);
          localStorage.setItem(`anjo_routine_reset_${normalizedK}`, effectiveStartTime);
        }
        localStorage.removeItem(`anjo_is_absent_${normalizedK}`);
        localStorage.setItem(`anjo_is_absent_${normalizedK}`, 'false');
      } else {
        localStorage.removeItem(`anjo_shift_start_time_${normalizedK}`);
        localStorage.setItem(`anjo_shift_active_${normalizedK}`, 'false');
        if (isAbsent || reason) {
          localStorage.setItem(`anjo_is_absent_${normalizedK}`, 'true');
        } else {
          localStorage.removeItem(`anjo_is_absent_${normalizedK}`);
          localStorage.setItem(`anjo_is_absent_${normalizedK}`, 'false');
        }
      }

      let idx = shiftStates.findIndex(s => s.id === normalizedK);
      if (idx < 0) {
        idx = shiftStates.findIndex(s => s.id && s.id.toLowerCase() === normalizedK.toLowerCase());
      }

      const newState: ShiftState = {
        id: normalizedK,
        active,
        isAbsent: active ? false : (isAbsent ?? false),
        reason: active ? null : (reason || null),
        startTime: active ? effectiveStartTime : null,
        lastResetTime: active ? effectiveStartTime : (shiftStates[idx]?.lastResetTime || nowStr),
        updatedAt: nowStr
      };
      if (idx >= 0) {
        shiftStates[idx] = newState;
      } else {
        shiftStates.push(newState);
      }
    };

    // 1. Identify all related keys to update (Student, Classmates, Classroom, Teachers)
    const keysToUpdate = new Set<string>();
    getAllPossibleStudentKeys(cleanKey).forEach(k => keysToUpdate.add(k));

    // Check if cleanKey is a student
    const student = allStudents.find(s => 
      s.id === cleanKey || 
      (s.nome && s.nome.toLowerCase() === cleanKey.toLowerCase()) ||
      keyMatches(s.id, cleanKey) ||
      (s.nome && keyMatches(s.nome, cleanKey)) ||
      (s.nome && keyMatches(s.nome.split(' (')[0], cleanKey))
    );

    if (student) {
      // Individual student update - update all possible student alias keys
      getAllPossibleStudentKeys(student.id).forEach(k => keysToUpdate.add(k));
      if (student.nome) {
        keysToUpdate.add(student.nome);
        keysToUpdate.add(student.nome.split(' (')[0].trim());
      }
    } else {
      // Classroom or Group update - update classroom and all room students
      const targetRoom = getStudentRoomName(cleanKey) || cleanKey;
      if (targetRoom) {
        keysToUpdate.add(targetRoom);
        // Find all students in this EXACT room
        const roomStudents = allStudents.filter(s => {
          const sRoom = s.salaAula || s.quarto || getStudentRoomName(s) || '';
          return keyMatches(sRoom, targetRoom);
        });

        roomStudents.forEach(s => {
          keysToUpdate.add(s.id);
          if (s.nome) {
            keysToUpdate.add(s.nome);
            keysToUpdate.add(s.nome.split(' (')[0].trim());
          }
        });

        // Find teacher assigned to this room
        const assignedTeacher = getAssignedTeacherForRoom(targetRoom);
        if (assignedTeacher) {
          keysToUpdate.add(assignedTeacher.id);
          if (assignedTeacher.nome) {
            keysToUpdate.add(assignedTeacher.nome);
            keysToUpdate.add(assignedTeacher.nome.replace(/\s*\([^)]*\)/g, '').trim());
          }
        }
      }
    }

    // Apply upsert for all identified keys
    keysToUpdate.forEach(k => {
      if (k) upsertState(k);
    });
  });

  saveToDB('anjo_shift_states', shiftStates);

  // Broadcast events to update all components in real-time
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('anjo_shift_updated', { detail: { items: shiftStates } }));
    window.dispatchEvent(new CustomEvent('anjo_user_updated', { detail: { localKey: 'anjo_shift_states', items: shiftStates } }));
    window.dispatchEvent(new CustomEvent('db-vitals-update'));
    window.dispatchEvent(new CustomEvent('db-tasks-update'));
    window.dispatchEvent(new CustomEvent('db-routine-update'));
    window.dispatchEvent(new Event('storage'));
  }
}

export function setShiftActiveState(targetKey: string, active: boolean, startTime?: string) {
  setShiftActiveStatesBatch([{ targetKey, active, startTime }]);
}

export function getNowTimeBr(): string {
  return new Date().toLocaleTimeString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function getTodayIsoBr(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}

export function getTodayBr(): string {
  return new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

export function isTodayOrDemoDate(d?: string): boolean {
  if (!d) return true;
  const todayIso = new Date().toISOString().split('T')[0];
  const todayBr = new Date().toLocaleDateString('pt-BR');
  const cleanD = d.split(' ')[0].split('T')[0];
  return cleanD === todayIso || cleanD === todayBr || cleanD === '2026-05-30' || d === '2026-05-30';
}

export interface BottleIntervalCheckResult {
  allowed: boolean;
  lastHorario: string;
  nextAllowedHorario: string;
  diffMinutes: number;
  message: string;
}

export function checkBottleFeedingInterval(
  studentId: string,
  newHorarioStr?: string,
  studentName?: string
): BottleIntervalCheckResult {
  const allMeals = getFromDB<any[]>('anjo_alimentacao', []);
  const studentMealKey = `anjo_alimentacao_${studentId}`;
  const studentMeals = getFromDB<any[]>(studentMealKey, []);

  const combined = [...allMeals, ...studentMeals];
  const uniqueMap = new Map<string, any>();
  combined.forEach(m => {
    if (m && m.id) uniqueMap.set(m.id, m);
  });
  const uniqueMeals = Array.from(uniqueMap.values());

  const todayBottles = uniqueMeals.filter(m =>
    m.idosoId === studentId &&
    m.refeicao === 'mamadeira' &&
    isTodayOrDemoDate(m.data)
  );

  if (todayBottles.length === 0) {
    return {
      allowed: true,
      lastHorario: '',
      nextAllowedHorario: '',
      diffMinutes: 9999,
      message: ''
    };
  }

  const parseTimeToMinutes = (timeStr: string): number => {
    if (!timeStr) return 0;
    const clean = String(timeStr).trim();
    const parts = clean.split(':').map(p => parseInt(p, 10));
    const h = isNaN(parts[0]) ? 0 : parts[0];
    const m = isNaN(parts[1]) ? 0 : parts[1];
    return h * 60 + m;
  };

  const formatMinutesToTime = (totalMinutes: number): string => {
    const wrapped = ((totalMinutes % (24 * 60)) + (24 * 60)) % (24 * 60);
    const h = Math.floor(wrapped / 60);
    const m = wrapped % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const targetTimeStr = newHorarioStr || getNowTimeBr();
  const targetMinutes = parseTimeToMinutes(targetTimeStr);
  const MIN_INTERVAL_MINUTES = 120; // 2 hours

  for (const bottle of todayBottles) {
    const bottleTimeStr = bottle.horario || '00:00';
    const bottleMins = parseTimeToMinutes(bottleTimeStr);
    const diff = Math.abs(targetMinutes - bottleMins);

    if (diff < MIN_INTERVAL_MINUTES) {
      const nextAllowedMins = bottleMins + MIN_INTERVAL_MINUTES;
      const nextAllowedTime = formatMinutesToTime(nextAllowedMins);
      const cleanName = studentName ? (studentName.includes(' (') ? studentName.split(' (')[0] : studentName) : 'A criança';

      return {
        allowed: false,
        lastHorario: bottleTimeStr,
        nextAllowedHorario: nextAllowedTime,
        diffMinutes: diff,
        message: `🍼 COMUNICADO DE SEGURANÇA (MAMADEIRA)\n\n${cleanName} já tomou mamadeira às ${bottleTimeStr}.\nPara a nutrição e digestão adequada, deve ser mantido o intervalo mínimo de 2 horas entre mamadeiras.\n\n⏰ Próxima mamadeira liberada a partir das ${nextAllowedTime}.`
      };
    }
  }

  return {
    allowed: true,
    lastHorario: '',
    nextAllowedHorario: '',
    diffMinutes: 9999,
    message: ''
  };
}

export function registerBottleAttemptNotice(
  studentId: string,
  studentName: string,
  lastTime: string,
  nextTime: string,
  attemptTime: string,
  registradoPor: string = 'Professora'
) {
  const cleanName = studentName.includes(' (') ? studentName.split(' (')[0] : studentName;
  const allLogs = getFromDB<any[]>('anjo_notificacoes', []);

  const newNotice: any = {
    id: `notif_mamadeira_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    idosoId: studentId,
    familiarNome: `Pais/Responsáveis de ${cleanName}`,
    telefone: '(11) 98765-4321',
    dataHora: `${getTodayBr()} ${attemptTime}`,
    tipo: 'comunicado_mamadeira',
    titulo: `🍼 Comunicado: Mamadeira Recente (${cleanName})`,
    mensagem: `Anjinho Escolar: Comunicado de acompanhamento. ${cleanName} já tomou mamadeira às ${lastTime}. A tentativa de registro foi realizada às ${attemptTime}. Respeitando o intervalo mínimo de 2 horas para digestão adequada, a próxima mamadeira estará liberada a partir das ${nextTime}. Registrado por ${registradoPor}.`,
    statusEnvio: 'enviado'
  };

  allLogs.unshift(newNotice);
  saveToDB('anjo_notificacoes', allLogs);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('anjo_user_updated', { detail: { localKey: 'anjo_notificacoes' } }));
    window.dispatchEvent(new CustomEvent('db-routine-update'));
  }
}

export function formatTimeBr(dateOrIso?: string | Date | null, fallback = '07:30'): string {
  if (!dateOrIso) return fallback;
  if (/^\d{2}:\d{2}$/.test(String(dateOrIso))) return String(dateOrIso);
  if (/^\d{2}:\d{2}:\d{2}$/.test(String(dateOrIso))) return String(dateOrIso).substring(0, 5);
  if (dateOrIso === 'Início do Turno' || String(dateOrIso).includes('Invalid')) return fallback;
  try {
    const d = typeof dateOrIso === 'string' ? new Date(dateOrIso) : dateOrIso;
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  } catch (e) {}
  return fallback;
}

/**
 * Completely purge any orphaned data left over from students that no longer exist in the system
 */
export function purgeOrphanedStudentData() {
  if (typeof window === 'undefined') return;

  try {
    const allStudents = getFromDB<Idoso[]>('anjo_idosos', []);
    if (!allStudents || allStudents.length === 0) return;

    const validStudentIds = new Set(allStudents.map(s => s.id));
    const deletedStudentsList = JSON.parse(localStorage.getItem('anjo_deleted_students') || '[]') as string[];
    const deletedSet = new Set(deletedStudentsList);

    const isValidOwner = (ownerId?: string) => {
      if (!ownerId) return false;
      if (deletedSet.has(ownerId)) return false;
      if (ownerId.startsWith('aluno_')) {
        return validStudentIds.has(ownerId);
      }
      return true;
    };

    // 1. Purge anjo_atividades
    const allAtivs = getFromDB<any[]>('anjo_atividades', []);
    const validAtivs = allAtivs.filter(a => a && isValidOwner(a.idosoId));
    if (validAtivs.length !== allAtivs.length) {
      saveToDB('anjo_atividades', validAtivs);
      const orphanedIds = allAtivs.filter(a => a && !isValidOwner(a.idosoId)).map(a => a.id).filter(Boolean);
      if (orphanedIds.length > 0) {
        deleteBatchFromFirestore('anjo_atividades', orphanedIds);
      }
    }

    // 2. Purge anjo_tarefas_diarias
    const allTasks = getFromDB<any[]>('anjo_tarefas_diarias', []);
    const validTasks = allTasks.filter(t => t && isValidOwner(t.idosoId));
    if (validTasks.length !== allTasks.length) {
      saveToDB('anjo_tarefas_diarias', validTasks);
      const orphanedIds = allTasks.filter(t => t && !isValidOwner(t.idosoId)).map(t => t.id).filter(Boolean);
      if (orphanedIds.length > 0) {
        deleteBatchFromFirestore('anjo_tarefas_diarias', orphanedIds);
      }
    }

    // 3. Purge other routine collections
    const collectionsToPurge = [
      'anjo_alimentacao',
      'anjo_hidratacao',
      'anjo_humor',
      'anjo_sono',
      'anjo_sinais',
      'anjo_mural_recados',
      'anjo_jornada_events',
      'anjo_encaminhamentos_pedagogicos',
      'anjo_alertas_desenvolvimento',
      'anjo_mediacao_conflitos'
    ];

    collectionsToPurge.forEach(colKey => {
      const records = getFromDB<any[]>(colKey, []);
      const validRecords = records.filter(r => r && isValidOwner(r.idosoId || r.studentId || r.alunoId));
      if (validRecords.length !== records.length) {
        saveToDB(colKey, validRecords);
        const orphanedIds = records.filter(r => r && !isValidOwner(r.idosoId || r.studentId || r.alunoId)).map(r => r.id).filter(Boolean);
        if (orphanedIds.length > 0) {
          deleteBatchFromFirestore(colKey, orphanedIds);
        }
      }
    });

    if (deletedStudentsList.length > 0) {
      deleteStudentDataFromFirestore(deletedStudentsList).catch(() => {});
    }
  } catch (err) {
    console.warn('[purgeOrphanedStudentData] Error during orphaned data purge:', err);
  }
}

/**
 * Permanently and completely deletes a student and all related historical, activity and task data across both local DB and Firestore
 */
export function deleteStudentEverywhere(studentId: string) {
  if (typeof window === 'undefined' || !studentId) return;

  // 1. Remove from anjo_idosos
  const allPeople = getFromDB<Idoso[]>('anjo_idosos', []);
  const updatedPeople = allPeople.filter(p => p.id !== studentId);
  saveToDB('anjo_idosos', updatedPeople);

  // 2. Track in anjo_deleted_students list so it never resurrects
  const deletedStudents = JSON.parse(localStorage.getItem('anjo_deleted_students') || '[]') as string[];
  if (!deletedStudents.includes(studentId)) {
    deletedStudents.push(studentId);
    localStorage.setItem('anjo_deleted_students', JSON.stringify(deletedStudents));
  }

  // 3. Clear from all collections
  const collections = [
    'anjo_atividades',
    'anjo_tarefas_diarias',
    'anjo_alimentacao',
    'anjo_hidratacao',
    'anjo_humor',
    'anjo_sono',
    'anjo_sinais',
    'anjo_mural_recados',
    'anjo_medicamentos',
    'anjo_agenda',
    'anjo_notificacoes',
    'anjo_jornada_events',
    'anjo_encaminhamentos_pedagogicos',
    'anjo_alertas_desenvolvimento',
    'anjo_mediacao_conflitos'
  ];

  collections.forEach(col => {
    const list = getFromDB<any[]>(col, []);
    const remaining = list.filter(item => item && (item.idosoId || item.studentId || item.alunoId) !== studentId);
    if (remaining.length !== list.length) {
      saveToDB(col, remaining);
    }
  });

  // 4. Clear student specific localStorage flags and parameters
  localStorage.removeItem(`anjo_absences_history_${studentId}`);
  localStorage.removeItem(`anjo_is_absent_${studentId}`);
  localStorage.removeItem(`anjo_tasks_cleared_${studentId}`);
  localStorage.removeItem(`anjo_activities_cleared_${studentId}`);
  localStorage.removeItem(`anjo_tasks_initialized_${studentId}`);
  localStorage.removeItem(`anjo_mural_cleared_${studentId}`);
  localStorage.removeItem(`anjo_almoço_pct_${studentId}`);
  localStorage.removeItem(`anjo_sleep_hr_${studentId}`);
  localStorage.removeItem(`anjo_registro_agua_${studentId}`);
  localStorage.removeItem(`anjo_hidratacao_${studentId}`);
  localStorage.removeItem(`anjo_alimentacao_${studentId}`);
  localStorage.removeItem(`anjo_sub_status_${studentId}`);
  localStorage.removeItem(`anjo_sub_valor_${studentId}`);
  localStorage.removeItem(`anjo_sub_is_custom_${studentId}`);
  localStorage.removeItem(`anjo_shift_active_${studentId}`);
  localStorage.removeItem(`anjo_shift_start_time_${studentId}`);
  
  localStorage.removeItem(`anjo_higiene_log_${studentId}`);
  localStorage.removeItem(`anjo_ocorrencias_${studentId}`);
  localStorage.removeItem(`anjo_lgpd_auditoria_${studentId}`);

  // 5. Delete from Firestore
  deleteFromFirestore('anjo_idosos', studentId);
  deleteStudentDataFromFirestore(studentId).catch(() => {});

  // 6. If the active simulation idoso was this deleted student, reset to first available
  const currentSaved = localStorage.getItem('anjo_simulacao_idoso_id');
  if (currentSaved === studentId) {
    const remainingStudents = updatedPeople.filter(p => p.id.startsWith('aluno_'));
    if (remainingStudents.length > 0) {
      localStorage.setItem('anjo_simulacao_idoso_id', remainingStudents[0].id);
    } else if (updatedPeople.length > 0) {
      localStorage.setItem('anjo_simulacao_idoso_id', updatedPeople[0].id);
    } else {
      localStorage.removeItem('anjo_simulacao_idoso_id');
    }
  }

  // 7. Broadcast update events
  window.dispatchEvent(new CustomEvent('anjo_user_updated'));
  window.dispatchEvent(new CustomEvent('anjo_idosos_updated'));
  window.dispatchEvent(new CustomEvent('db-vitals-update'));
  window.dispatchEvent(new CustomEvent('db-tasks-update'));
  window.dispatchEvent(new CustomEvent('db-routine-update'));
  window.dispatchEvent(new CustomEvent('db-jornada-update'));
  window.dispatchEvent(new CustomEvent('db-mural-update'));
}


