/**
 * whatsappService.ts
 * Motor compartilhado para o disparo de WhatsApp no backend Serverless da Netlify.
 * Centraliza as integrações com Meta, Twilio, Evolution API e simulação para desenvolvimento.
 */

export interface WhatsAppConfig {
  provider?: string;
  templateName?: string; // Ex: 'lembrete_medicacao'
  templateLanguage?: string; // Ex: 'pt_BR'
  templateParams?: string[]; // Variáveis do seu template se aplicável [Idoso, Medicamento, Horario]
  meta?: {
    accessToken?: string;
    phoneNumberId?: string;
  };
  twilio?: {
    accountSid?: string;
    authToken?: string;
    fromNumber?: string;
  };
  evolution?: {
    apiUrl?: string;
    apiKey?: string;
    instance?: string;
  };
}

/**
 * Função unificada para disparar mensagens reais ou simuladas de WhatsApp
 * @param to Telefone de destino do destinatário
 * @param message Mensagem de texto a ser enviada
 * @param customConfig Configurações manuais opcionais (se não passadas, utiliza variáveis de ambiente)
 */
export async function enviarWhatsApp(to: string, message: string, customConfig?: WhatsAppConfig) {
  // Limpar o número de telefone (remover espaços, parênteses e traços)
  // Formato recomendado para o WhatsApp: DDI + DDD + Número (ex: 5511987654321)
  const cleanedPhone = to.replace(/\D/g, '');
  const phoneWithDDI = cleanedPhone.startsWith('55') ? cleanedPhone : `55${cleanedPhone}`;

  const WHATSAPP_PROVIDER = customConfig?.provider || process.env.WHATSAPP_PROVIDER || 'MOCK';

  let responseData: any = {};

  if (WHATSAPP_PROVIDER === 'META') {
    // -----------------------------------------------------------------------
    // MÉTODO A: API Nuvem de WhatsApp Oficial (Meta)
    // -----------------------------------------------------------------------
    const accessToken = customConfig?.meta?.accessToken || process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = customConfig?.meta?.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!accessToken || !phoneNumberId) {
      throw new Error('Chaves de autenticação da Meta não configuradas (.env)');
    }

    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
    
    // Se passarmos propriedades de template, envia como template da Meta (Obrigatório para mensagens proativas fora da janela de 24h)
    let payload: any = {
      messaging_product: 'whatsapp',
      to: phoneWithDDI,
    };

    if (customConfig?.templateName) {
      payload.type = 'template';
      payload.template = {
        name: customConfig.templateName,
        language: {
          code: customConfig.templateLanguage || 'pt_BR'
        },
        components: customConfig.templateParams ? [
          {
            type: 'body',
            parameters: customConfig.templateParams.map(param => ({
              type: 'text',
              text: param
            }))
          }
        ] : []
      };
    } else {
      payload.type = 'text';
      payload.text = { body: message };
    }
    
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errDetails = await res.text();
      throw new Error(`Erro na API Oficial do WhatsApp Meta: ${errDetails}`);
    }
    
    responseData = await res.json();

  } else if (WHATSAPP_PROVIDER === 'TWILIO') {
    // -----------------------------------------------------------------------
    // MÉTODO B: Twilio API para WhatsApp
    // -----------------------------------------------------------------------
    const accountSid = customConfig?.twilio?.accountSid || process.env.TWILIO_ACCOUNT_SID;
    const authToken = customConfig?.twilio?.authToken || process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = customConfig?.twilio?.fromNumber || process.env.TWILIO_WHATSAPP_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      throw new Error('Chaves de autenticação do Twilio não configuradas (.env)');
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    const bodyParams = new URLSearchParams();
    bodyParams.append('To', `whatsapp:+${phoneWithDDI}`);
    bodyParams.append('From', fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`);
    bodyParams.append('Body', message);

    const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: bodyParams.toString()
    });

    if (!res.ok) {
      const errDetails = await res.text();
      throw new Error(`Erro na API do Twilio: ${errDetails}`);
    }

    responseData = await res.json();

  } else if (WHATSAPP_PROVIDER === 'EVOLUTION') {
    // -----------------------------------------------------------------------
    // MÉTODO C: Evolution API ou Z-API (QR Code Scan)
    // -----------------------------------------------------------------------
    const apiUrl = customConfig?.evolution?.apiUrl || process.env.EVOLUTION_API_URL;
    const apiKey = customConfig?.evolution?.apiKey || process.env.EVOLUTION_API_KEY;
    const instance = customConfig?.evolution?.instance || process.env.EVOLUTION_INSTANCE;

    if (!apiUrl || !apiKey || !instance) {
      throw new Error('Configurações da Evolution API não preenchidas (.env)');
    }

    const url = `${apiUrl}/message/sendText/${instance}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        number: phoneWithDDI,
        options: {
          delay: 1200,
          presence: 'composing'
        },
        textMessage: {
          text: message
        }
      })
    });

    if (!res.ok) {
      const errDetails = await res.text();
      throw new Error(`Erro na Evolution API: ${errDetails}`);
    }

    responseData = await res.json();

  } else {
    // -----------------------------------------------------------------------
    // MOCK (Ambiente de Testes/Local ou se não configurado)
    // -----------------------------------------------------------------------
    responseData = {
      status: 'simulated_success',
      message: 'Mensagem enviada com sucesso em ambiente de simulação local!',
      to: phoneWithDDI,
      body: message,
      timestamp: new Date().toISOString()
    };
  }

  return responseData;
}
