import { schedule } from '@netlify/functions';
import { enviarWhatsApp } from '../lib/whatsappService';

// Se você estiver utilizando Firebase Firestore na produção, podes importar o Admin SDK:
// import * as admin from 'firebase-admin';
// 
// Para evitar erros de carregamento se as chaves do Firebase não estiverem configuradas ainda,
// temos uma inicialização preguiçosa (lazy load) segura abaixo.

async function obterBancoDeDadosFirestore() {
  // Se você usar o Admin SDK, inicialize aqui:
  /*
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      })
    });
  }
  return admin.firestore();
  */
  return null;
}

/**
 * Função Agendada do Netlify (Cron Job)
 * Configurada para rodar a cada 5 minutos ("* / 5 * * * *")
 */
const cronHandler = async (event: any, context: any) => {
  console.log('🔄 [Cron Job] Iniciando verificação programada de atrasos às:', new Date().toISOString());

  try {
    const db = await obterBancoDeDadosFirestore();

    // ------------------------------------------------------------------------
    // AMBIENTE DE PRODUÇÃO (Com Banco de Dados Real - Firestore)
    // ------------------------------------------------------------------------
    if (db) {
      const hojeIso = new Date().toISOString().split('T')[0]; // Ex: 2026-06-03
      
      // 1. Buscar todas as tarefas diárias (Remédios, Atividades) de hoje que estão pendentes
      const tarefasSnapshot = await db.collection('tarefas_diarias')
        .where('data', '==', hojeIso)
        .where('concluido', '==', false)
        .get();

      if (tarefasSnapshot.empty) {
        console.log('✅ Nenhuma medicação ou tarefa pendente para hoje.');
        return { statusCode: 200 };
      }

      // Obter hora atual Ajustada para o Fuso Horário de Brasília (America/Sao_Paulo)
      const agoraBrasilia = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
      const horaAtualStr = agoraBrasilia.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      for (const doc of tarefasSnapshot.docs) {
        const tarefa = doc.data();
        
        // Exemplo de formato de hora da tarefa: "08:00"
        const horaTarefa = tarefa.horario; 

        // Se a hora atual for maior que a hora da tarefa, quer dizer que está ATRASADO
        if (horaAtualStr > horaTarefa) {
          
          // ===================================================================
          // REGRA DE IDEMPOTÊNCIA (EVITAR SPAM):
          // Verifica se o alerta já foi enviado anteriormente para este atraso
          // ===================================================================
          if (tarefa.alerta_atraso_enviado === true) {
            console.log(`ℹ️ Tarefa "${tarefa.titulo}" de ${horaTarefa} está atrasada, mas o fámiliar já foi alertado. Ignorando para evitar Spam.`);
            continue; 
          }

          // Se chegou aqui, está atrasado E nenhum alerta foi enviado ainda!
          console.log(`⚠️ ALERTA: Tarefa "${tarefa.titulo}" agendada para ${horaTarefa} está atrasada!`);

          // 2. Buscar informações do idoso e familiares para saber para quem enviar
          const idosoDoc = await db.collection('idosos').doc(tarefa.idosoId).get();
          const idoso = idosoDoc.data();
          
          if (!idoso) continue;

          // Encontrar os familiares / cuidador principal responsáveis
          const contatosSnapshot = await db.collection('usuarios')
            .where('idosoId', '==', tarefa.idosoId)
            .get();

          const contatos = contatosSnapshot.docs.map(d => d.data());
          
          // Mensagem personalizada elegante
          const mensagemAlerta = `⚠️ *Anjo Cuidador - Atenção!* ⚠️\n\nA medicação/atividade *"${tarefa.titulo}"* prevista para o horário de *${horaTarefa}* para o(a) idoso(a) *${idoso.nome}* ainda não foi registrada como executada.\n\nPor favor, verifique se ocorreu algum problema ou lembre-se de registrar a atividade no painel do aplicativo.`;

          let enviouAlgum = false;

          for (const contato of contatos) {
            if (contato.telefone) {
              try {
                // Dispara utilizando o serviço compartilhado unificado!
                await enviarWhatsApp(contato.telefone, mensagemAlerta);
                console.log(`💬 WhatsApp enviado com sucesso para ${contato.nome} (${contato.telefone})`);
                enviouAlgum = true;
              } catch (waErr) {
                console.error(`❌ Falha ao tentar disparar para o telefone ${contato.telefone}:`, waErr);
              }
            }
          }

          // 3. Atualiza o banco de dados marcando que o alerta já foi disparado
          // para nunca mais mandar spam dessa tarefa específica hoje!
          if (enviouAlgum) {
            await doc.ref.update({
              alerta_atraso_enviado: true,
              data_alerta_atraso: new Date().toISOString()
            });
            console.log(`💾 Flag 'alerta_atraso_enviado' gravada no Firestore para a tarefa: ${tarefa.titulo}`);
          }
        }
      }
    } 
    // ------------------------------------------------------------------------
    // AMBIENTE DE SIMULAÇÃO (Sem Firebase ativo)
    // ------------------------------------------------------------------------
    else {
      console.log('ℹ️ [Simulação Cron] Executando simulação de verificação sem Firebase.');
      console.log('💡 DICA: Quando conectar seu Firestore na produção, configure as variáveis de ambiente (.env) para o Cron Job ler os dados reais.');
    }

  } catch (error: any) {
    console.error('❌ [Cron Job] Ocorreu uma exceção inesperada ao verificar atrasos:', error);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Processamento de rotina concluído." })
  };
};

// Exportando como uma Função Agendada do Netlify para rodar a cada 5 minutos
export const handler = schedule("*/5 * * * *", cronHandler);
