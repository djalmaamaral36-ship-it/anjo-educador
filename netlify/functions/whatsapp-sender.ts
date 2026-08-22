import { Handler } from '@netlify/functions';
import { enviarWhatsApp } from '../lib/whatsappService';

/**
 * Netlify Function para envio automático em tempo real de mensagens de WhatsApp.
 * Esta função age como um backend seguro (Serverless) para não expor as suas chaves de API secretas no navegador.
 * 
 * Agora ela consome o nosso serviço compartilhado /netlify/lib/whatsappService.ts (Engrenagem Compartilhada).
 */
export const handler: Handler = async (event, context) => {
  // Responder a requisições de pre-flight CORS (OPTIONS)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: '',
    };
  }

  // Garantir que aceitamos apenas requisições POST para maior segurança
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ error: 'Método não permitido' }),
    };
  }

  try {
    const { to, message } = JSON.parse(event.body || '{}');

    // Validação básica de parâmetros
    if (!to || !message) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Faltam os campos obrigatórios "to" (telefone) e "message" (conteúdo)' }),
      };
    }

    // Chama o serviço compartilhado unificado (Meta, Twilio, Evolution API ou Mock)
    const responseData = await enviarWhatsApp(to, message);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        summary: `Mensagem enviada para ${to} com sucesso através do serviço compartilhado!`,
        details: responseData
      }),
    };

  } catch (error: any) {
    console.error('Erro no envio do WhatsApp:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        success: false, 
        error: error.message || 'Erro interno do servidor para disparar o WhatsApp' 
      }),
    };
  }
};
