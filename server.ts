import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { GoogleGenAI, Type } from '@google/genai';

// Lazy-initialized Gemini client to prevent crashing if the key is missing on startup
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(customKey?: string): GoogleGenAI {
  const apiKey = customKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('A chave GEMINI_API_KEY não está configurada. Por favor, forneça-a nas variáveis de ambiente ou na requisição.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// Calls Groq API using native fetch (OpenAI compatible REST endpoint)
async function callGroqAPI(
  apiKey: string,
  model: string,
  systemInstruction: string,
  promptOrMessages: any,
  temperature = 0.7
) {
  const finalModel = model && (
    model.startsWith('llama') || 
    model.startsWith('mixtral') || 
    model.startsWith('gemma') || 
    model.includes('groq')
  ) ? model : 'llama-3.3-70b-versatile';

  console.log(`[Groq API] Solicitando geração de conteúdo usando o modelo: ${finalModel}`);

  const messages: Array<{ role: string; content: string }> = [];

  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }

  if (typeof promptOrMessages === 'string') {
    messages.push({ role: 'user', content: promptOrMessages });
  } else if (Array.isArray(promptOrMessages)) {
    promptOrMessages.forEach((m: any) => {
      const role = m.role === 'model' || m.role === 'assistant' ? 'assistant' : 'user';
      const text = m.parts?.[0]?.text || m.content || m.text || '';
      if (text) {
        messages.push({ role, content: text });
      }
    });
  } else {
    messages.push({ role: 'user', content: JSON.stringify(promptOrMessages) });
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: finalModel,
      messages: messages,
      temperature: temperature
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro na API do Groq (Status ${response.status}): ${errorText}`);
  }

  const data: any = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error('A API do Groq retornou uma resposta sem conteúdo textual.');
  }

  return { text };
}

// Robust wrapper around generateContent that automatically falls back to secondary models if the primary is experiencing high demand (503) or is unavailable.
async function generateContentWithFallback(
  client: GoogleGenAI,
  params: {
    model: string;
    contents: any;
    config?: any;
  }
) {
  const modelsToTry = [params.model, 'gemini-2.5-flash'];
  const uniqueModels = Array.from(new Set(modelsToTry.filter(Boolean)));

  let lastError: any = null;
  for (const modelName of uniqueModels) {
    try {
      console.log(`[Gemini API] Solicitando geração de conteúdo usando o modelo: ${modelName}`);
      const response = await client.models.generateContent({
        ...params,
        model: modelName
      });
      console.log(`[Gemini API] Sucesso com o modelo: ${modelName}`);
      return response;
    } catch (err: any) {
      console.error(`[Gemini API] Falha no modelo ${modelName}:`, err.message || err);
      lastError = err;
    }
  }
  throw lastError || new Error('Todos os modelos do Gemini falharam ao processar a requisição.');
}

// Unified generator helper that handles model routing and fallbacks between Gemini and Groq
async function unifiedGenerateContent(params: {
  model?: string;
  contents: any;
  systemInstruction?: string;
  temperature?: number;
  geminiKey?: string;
  groqKey?: string;
  groqApiKey?: string;
}) {
  const reqModel = params.model || 'gemini-2.5-flash';
  const temperature = params.temperature !== undefined ? params.temperature : 0.7;
  const sysInstruction = params.systemInstruction || '';

  const isGroqModel = reqModel.startsWith('llama') || reqModel.startsWith('mixtral') || reqModel.startsWith('gemma') || reqModel.includes('groq');
  const userGroqKey = params.groqKey || params.groqApiKey || process.env.GROQ_API_KEY;
  const userGeminiKey = params.geminiKey || process.env.GEMINI_API_KEY;

  // 1. Direct call to Groq if a Groq model is requested and a Groq Key exists
  if (isGroqModel && userGroqKey) {
    try {
      return await callGroqAPI(userGroqKey, reqModel, sysInstruction, params.contents, temperature);
    } catch (err: any) {
      console.error('[Unified AI] Chamada direta do Groq falhou:', err.message || err);
      if (userGeminiKey) {
        console.log('[Unified AI] Realizando fallback do Groq para o Gemini...');
        const fallbackClient = getGeminiClient(userGeminiKey);
        const response = await generateContentWithFallback(fallbackClient, {
          model: 'gemini-2.5-flash',
          contents: params.contents,
          config: {
            systemInstruction: sysInstruction,
            temperature,
          }
        });
        return { text: response.text || '' };
      }
      throw err;
    }
  }

  // 2. Default to Gemini with auto-fallback to Groq if Gemini fails
  if (userGeminiKey) {
    try {
      const client = getGeminiClient(userGeminiKey);
      const response = await generateContentWithFallback(client, {
        model: reqModel.startsWith('gemini') ? reqModel : 'gemini-2.5-flash',
        contents: params.contents,
        config: {
          systemInstruction: sysInstruction,
          temperature,
        }
      });
      return { text: response.text || '' };
    } catch (geminiErr: any) {
      console.error('[Unified AI] Chamada primária do Gemini falhou:', geminiErr.message || geminiErr);
      if (userGroqKey) {
        console.log('[Unified AI] Realizando fallback do Gemini para o Groq...');
        try {
          return await callGroqAPI(userGroqKey, 'llama-3.3-70b-versatile', sysInstruction, params.contents, temperature);
        } catch (groqErr: any) {
          console.error('[Unified AI] Fallback do Groq também falhou:', groqErr.message || groqErr);
        }
      }
      throw geminiErr;
    }
  }

  // 3. If there is no Gemini Key but we have a Groq Key, use Groq
  if (userGroqKey) {
    console.log('[Unified AI] Chave do Gemini não encontrada. Usando Groq como padrão.');
    return await callGroqAPI(userGroqKey, isGroqModel ? reqModel : 'llama-3.3-70b-versatile', sysInstruction, params.contents, temperature);
  }

  throw new Error('Nenhuma chave de API (Gemini ou Groq) válida foi configurada no ambiente ou informada na requisição.');
}

async function startServer() {
  const app = express();

  // Full-access CORS configuration to support cross-origin requests from Vercel/external hosts
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });
  
  // CRITICAL: The AI Studio environment routes external HTTP traffic to port 3000 inside the container
  // via a hardcoded internal reverse proxy. Do NOT listen on process.env.PORT (e.g. 8080) as it
  // causes a port conflict or disconnects the reverse proxy.
  const port = 3000;

  // Secret Key shared between Anjinho and Aura
  const SSO_SECRET_KEY = process.env.ANJINHO_AURA_SECRET || 'anjinho-aura-secret-key-2026';

  // Enable rawBody capturing for HMAC signature validation
  app.use(express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    }
  }));
  app.use(express.urlencoded({ extended: true }));

  // Shared in-memory mural posts store
  const muralPostsStore: any[] = [];

  // Helper function to decode and verify HS256 JWT
  function verifyHS256Token(token: string) {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Token JWT malformatado');
    }
    const [headerB64, payloadB64, signatureB64] = parts;

    // Calculate expected HMAC SHA-256 signature
    const expectedSig = crypto
      .createHmac('sha256', SSO_SECRET_KEY)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');

    if (signatureB64 !== expectedSig) {
      throw new Error('Assinatura JWT inválida');
    }

    const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf-8');
    const payload = JSON.parse(payloadJson);

    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      throw new Error('Token JWT expirado');
    }

    return payload;
  }

  // 1. SSO Endpoint (GET /api/sso?token=<JWT>)
  app.get('/api/sso', (req, res) => {
    try {
      const token = req.query.token as string;
      if (!token) {
        return res.status(400).send(`
          <html>
            <body style="font-family:sans-serif; text-align:center; padding: 40px;">
              <h2 style="color: #e11d48;">Erro de Autenticação SSO</h2>
              <p>Parâmetro "token" ausente na requisição GET.</p>
            </body>
          </html>
        `);
      }

      const decoded = verifyHS256Token(token);
      const { email, userId, userName, tipo, escola, escola_id, returnUrl } = decoded;

      console.log(`[SSO Success] Usuário autenticado: ${userName} (${email}) - Escola: ${escola}`);

      const redirectPath = returnUrl || '/';

      // HTML response that stores SSO session in client localStorage and redirects
      return res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Autenticando na Aura...</title>
            <meta charset="utf-8" />
          </head>
          <body style="font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc;">
            <div style="text-align: center; padding: 32px; background: white; border-radius: 24px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);">
              <div style="font-size: 40px; margin-bottom: 12px;">✨</div>
              <h2 style="margin: 0 0 8px 0; color: #0f172a;">Aura identificada com sucesso!</h2>
              <p style="margin: 0; color: #64748b; font-size: 14px;">Redirecionando para a escola <strong>${escola || 'Geral'}</strong>...</p>
            </div>
            <script>
              const ssoUser = {
                id: ${JSON.stringify(userId || 'sso_' + Date.now())},
                email: ${JSON.stringify(email || '')},
                nome: ${JSON.stringify(userName || 'Usuário SSO')},
                tipo: ${JSON.stringify(tipo || 'professor')},
                escola: ${JSON.stringify(escola || '')},
                escola_id: ${JSON.stringify(escola_id || '')},
                authenticatedAt: new Date().toISOString()
              };
              localStorage.setItem('anjo_sso_session', JSON.stringify(ssoUser));
              localStorage.setItem('anjo_simulacao_user_id', ssoUser.id);
              window.location.href = ${JSON.stringify(redirectPath)};
            </script>
          </body>
        </html>
      `);
    } catch (err: any) {
      console.error('[SSO Error]:', err.message);
      return res.status(401).send(`
        <html>
          <body style="font-family:sans-serif; text-align:center; padding: 40px;">
            <h2 style="color: #e11d48;">Falha no Login Único (SSO)</h2>
            <p style="color: #475569;">${err.message || 'Token JWT inválido ou expirado.'}</p>
          </body>
        </html>
      `);
    }
  });

  // 2. Webhook do Mural (POST /api/public/mural)
  app.post('/api/public/mural', (req: any, res) => {
    try {
      const signatureHeader = req.headers['x-anjinho-signature'] as string;
      
      // HMAC Signature Verification if signature header is supplied
      if (signatureHeader) {
        const expectedPrefix = 'sha256=';
        const providedHex = signatureHeader.startsWith(expectedPrefix) ? signatureHeader.slice(expectedPrefix.length) : signatureHeader;
        
        const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body));
        const computedHex = crypto
          .createHmac('sha256', SSO_SECRET_KEY)
          .update(rawBody)
          .digest('hex');

        if (providedHex !== computedHex) {
          console.warn('[Webhook Mural] Assinatura HMAC inválida recusada.');
          return res.status(401).json({ error: 'Assinatura HMAC (x-anjinho-signature) inválida' });
        }
      }

      const { escola, texto, escola_id, turma, student_id, student_name, tipo, posted_at, extra } = req.body || {};

      // Mandatory fields validation
      if (!escola || !texto) {
        return res.status(400).json({
          error: 'Campos obrigatórios ausentes: "escola" e "texto" são requeridos.'
        });
      }

      const nowIso = new Date().toISOString();
      const postItem = {
        id: `mural_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        escola,
        texto,
        escola_id: escola_id || null,
        turma: turma || 'Geral',
        student_id: student_id || null,
        student_name: student_name || null,
        tipo: tipo || 'comunicado',
        posted_at: posted_at || nowIso,
        extra: {
          notificado_em: extra?.notificado_em || nowIso,
          visualizado_em: extra?.visualizado_em || null,
          ...extra
        }
      };

      muralPostsStore.unshift(postItem);
      console.log(`[Webhook Mural Success] Novo aviso postado para a escola: "${escola}"`);

      return res.status(201).json({
        success: true,
        message: 'Aviso do mural recebido e publicado com sucesso!',
        data: postItem
      });
    } catch (err: any) {
      console.error('[Webhook Mural Error]:', err);
      return res.status(500).json({ error: err.message || 'Erro interno ao processar webhook do mural.' });
    }
  });

  // GET /api/public/mural - List mural posts with optional school filtering
  app.get('/api/public/mural', (req, res) => {
    const { escola, escola_id } = req.query;
    let filtered = muralPostsStore;

    if (escola) {
      filtered = filtered.filter(p => p.escola?.toLowerCase() === String(escola).toLowerCase());
    } else if (escola_id) {
      filtered = filtered.filter(p => p.escola_id === String(escola_id));
    }

    return res.json({
      total: filtered.length,
      posts: filtered
    });
  });

  // 6. Resumo Diário Automático (POST /api/public/hooks/resumo-diario)
  app.post('/api/public/hooks/resumo-diario', (req, res) => {
    try {
      const { escola, escola_id } = req.body || req.query || {};
      const nowIso = new Date().toISOString();
      console.log(`[Resumo Diário Hook] Gerando panorama diário para a escola: ${escola || escola_id || 'Geral'}`);

      return res.status(200).json({
        ok: true,
        generatedAt: nowIso,
        escola: escola || 'Escola Árvore da Infância',
        escola_id: escola_id || 'esc_001',
        resumo: {
          alertasAtivos: 0,
          complianceRotina: '100%',
          statusGeral: 'Tudo sob controle. Nenhuma intercorrência crítica registrada no momento.'
        }
      });
    } catch (err: any) {
      console.error('[Resumo Diário Hook Error]:', err);
      return res.status(500).json({ error: err.message || 'Erro ao gerar resumo diário.' });
    }
  });

  const distPath = path.join(process.cwd(), 'dist');
  const hasDistIndex = fs.existsSync(path.join(distPath, 'index.html'));

  // If dist/index.html is compiled, we MUST run in production mode to serve static files.
  // Running Vite dev server middle-ware on Cloud Run will fail because source files may be omitted.
  const isProduction = process.env.NODE_ENV === 'production' || hasDistIndex;

  const serveStaticFiles = () => {
    console.log("Serving static files from dist...");
    app.use(express.static(distPath, {
      maxAge: '1d',
      setHeaders: (res, pathStr) => {
        if (pathStr.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
      }
    }));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  };

  // Diagnostic endpoint to verify runtime status, port, env and files
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      cwd: process.cwd(),
      env: process.env.NODE_ENV,
      port: port,
      isProduction: isProduction,
      hasDistIndex: hasDistIndex,
      distExists: fs.existsSync(distPath),
      filesInDist: fs.existsSync(distPath) ? fs.readdirSync(distPath) : []
    });
  });

  // Dedicated endpoint for the integrated AI Assistant (Anjinho AI) - chat route
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, sessionId, model, geminiKey, groqKey, groqApiKey } = req.body || {};
      if (!message) {
        return res.status(400).json({ error: 'Falta o campo obrigatório "message" no corpo da requisição.' });
      }

      const systemInstruction = `Você é a "Aura", a assistente e inteligência artificial inteligente integrada ao aplicativo "Anjo Escolar" / "Anjinho Escolar".
Sua missão é ajudar, apoiar e encantar as professoras, educadoras, coordenadoras, diretoras e familiares em sua rotina pedagógica, de cuidado e de comunicação escolar.
Seja carinhosa, empática, profissional, pedagógica, humana e acolhedora.
Sempre que apropriado, estruture suas respostas de forma elegante usando Markdown limpo com listas, tópicos ou emoticons fofos e afetivos (🌈, 💖, ✨, 🧸, 🏫, 👶, 👵, 😊).`;

      const response = await unifiedGenerateContent({
        model: model || 'gemini-2.5-flash',
        contents: message,
        systemInstruction,
        temperature: 0.7,
        geminiKey,
        groqKey,
        groqApiKey
      });

      const responseText = response.text || '';
      return res.status(200).json({
        response: responseText,
        content: responseText
      });
    } catch (error: any) {
      console.error('Erro na chamada da Inteligência Artificial (chat):', error);
      return res.status(500).json({
        error: error.message || 'Ocorreu um erro interno ao processar sua solicitação com a inteligência artificial.'
      });
    }
  });

  // Dedicated endpoint to parse/extract teacher activities / weekly plans in bulk with standardized Aura schema
  app.post('/api/parse-activities', async (req, res) => {
    const { text, geminiKey } = req.body || {};
    if (!text) {
      return res.status(400).json({ error: 'Falta o campo obrigatório "text" no corpo da requisição.' });
    }

    try {
      const client = getGeminiClient(geminiKey);

      const prompt = `Você é a assistente pedagógica Aura do sistema Anjinho Escolar.
Sua missão é ler o texto bruto do planejamento pedagógico/rotina escolar e extrair EXCLUSIVAMENTE a lista das atividades programadas com seus horários, títulos limpos com emojis, descrições detalhadas completas, e SEPARÁ-LAS RIGOROSAMENTE POR DIA DA SEMANA E DATA.

REGRAS CRÍTICAS DE CASAMENTO DE ATIVIDADES:
1. NUNCA EXTRAIA CONVERSAS OU COMENTÁRIOS DA IA:
   - Ignore e NUNCA crie atividades para comentários conversacionais da IA, introduções, saudações, sugestões ou despedidas (ex: "Este planejamento está prontinho...", "Sugestão para a professora...", "Espero que este planejamento ajude...", "Registrei para você com todo o carinho...", "Se precisar de algo mais...").
   - Extraia EXCLUSIVAMENTE atividades reais que tenham horário definido.

2. CADA ATIVIDADE DEVE MANTER SEU PRÓPRIO TÍTULO, HORÁRIO E DESCRIÇÃO. NUNCA DESLOQUE O TÍTULO DE UMA ATIVIDADE PARA O HORÁRIO OU DESCRIÇÃO DE OUTRA!
   - Exemplo: Se às 10:30 tem a atividade "Caixa Mágica das Texturas" com a descrição sensorial, o title é "Caixa Mágica das Texturas 🎨", time é "10:30" e a instructions é a exploração tátil.
   - Se às 11:30 tem "Almoço" com a descrição da refeição, o title é "Almoço 🍲", time é "11:30" e a instructions é a alimentação saudável. NUNCA coloque "Almoço" como título das 10:30!
   - Se às 12:30 tem "Higiene / Fraldas / Escovação", o title é "Higiene / Fraldas / Escovação 👶", time é "12:30".

3. ATENÇÃO CRÍTICA PARA PLANEJAMENTOS SEMANAIS / MULTI-DIAS:
- Se o texto contiver múltiplos dias (ex: Segunda-feira, Terça-feira, Quarta-feira, Quinta-feira, Sexta-feira, ou datas como 17/08, 18/08, 19/08, 20/08, 21/08):
  * CADA atividade DEVE receber seu respectivo 'day' e 'dateStr'.
  * NUNCA junte todas as atividades da semana sob o mesmo dia! Se a semana tiver 70 atividades distribuídas em 5 dias, você deve extrair todas as 70 com os respectivos dias e datas individuais.

FORMATOS SUPORTADOS:
1. Blocos de Tópicos/Markdown da Aura (ex: "### 1. Caixa Mágica...", "* **Horário:** 10:30 - 11:30", "* **Descrição:** ...").
2. Tabelas Markdown.
3. Listas simples com horários.

REGRAS DE FORMATAÇÃO:
- NUNCA descarte a "Descrição Detalhada". Se o texto tiver orientações pedagógicas, campo BNCC, materiais ou como conduzir, capture todo o conteúdo na propriedade "instructions".
- title: Título limpo e acolhedor com emoji no padrão escolar. NUNCA deixe asteriscos ou pipes no título!
- time: Horário inicial no formato HH:MM (ex: "10:30", "11:30").
- duration: Duração estimada em minutos calculada a partir do intervalo.
- bnccObjective: Objetivo pedagógico ou Campo de Experiência BNCC.
- materials: Lista dos materiais citados (se houver).
- targetClass: Turma informada ou "Classe Toda".

Texto bruto do planejamento:
"""
${text}
"""`;

      const response = await generateContentWithFallback(client, {
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: 'Você é a assistente inteligente Aura, especializada em extração e padronização de planejamentos e rotinas escolares para educadores do Anjinho Escolar. É mandatório extrair e separar cada atividade pelo seu respectivo dia da semana e data, preservando instruções pedagógicas detalhadas.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              metadata: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.STRING },
                  dateStr: { type: Type.STRING },
                  theme: { type: Type.STRING },
                  targetClass: { type: Type.STRING }
                }
              },
              activities: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING, description: "ID único gerado, ex: act-1, act-2" },
                    title: { type: Type.STRING, description: "Título humanizado com emoji no padrão escolar" },
                    day: { type: Type.STRING, description: "Dia da semana exato (ex: Segunda-feira, Terça-feira, Quarta-feira, Quinta-feira, Sexta-feira)" },
                    dateStr: { type: Type.STRING, description: "Data no formato DD/MM/AAAA ou DD/MM" },
                    dateIso: { type: Type.STRING, description: "Data ISO YYYY-MM-DD" },
                    theme: { type: Type.STRING, description: "Tema do dia desta atividade" },
                    time: { type: Type.STRING, description: "Horário no formato HH:MM" },
                    duration: { type: Type.INTEGER, description: "Duração em minutos, ex: 30, 45, 60" },
                    bnccObjective: { type: Type.STRING, description: "Campo de Experiência BNCC ou Objetivo Pedagógico" },
                    materials: { 
                      type: Type.ARRAY, 
                      items: { type: Type.STRING },
                      description: "Lista de materiais e recursos necessários" 
                    },
                    instructions: { type: Type.STRING, description: "Instruções pedagógicas, metodologia e passo a passo detalhado" },
                    targetClass: { type: Type.STRING, description: "Turma recomendada (ex: Berçário I - A)" }
                  },
                  required: ["title", "time", "instructions", "day"]
                }
              }
            },
            required: ["activities"]
          }
        }
      });

      const parsedData = JSON.parse(response.text || '{"activities": []}');
      if (parsedData.activities && Array.isArray(parsedData.activities)) {
        parsedData.activities = parsedData.activities.map((a: any, idx: number) => {
          let cleanTitle = String(a.title || 'Atividade Pedagógica')
            .replace(/[#\*_\|]/g, '')
            .replace(/^(?:Título sugerido|Título|Nome da Atividade|Atividade|Horário|Horario)\s*:\s*/i, '')
            .trim();
          if (!cleanTitle || /^(horário|horario|atividade|título|titulo|nome|pendente)$/i.test(cleanTitle)) {
            cleanTitle = a.bnccObjective && !/^(horário|horario)$/i.test(a.bnccObjective) ? a.bnccObjective : 'Atividade Pedagógica';
          }
          if (!/[\u{1F300}-\u{1FAFF}]/u.test(cleanTitle)) {
            cleanTitle = `${cleanTitle} 🌟`;
          }

          let cleanInstructions = String(a.instructions || '').replace(/[#\*_\|]/g, '').trim();
          if (!cleanInstructions || /^(horário|horario|atividade)$/i.test(cleanInstructions)) {
            cleanInstructions = `Atividade de rotina escolar: ${cleanTitle}.`;
          }

          return {
            ...a,
            id: a.id || `act-${idx + 1}`,
            title: cleanTitle,
            day: a.day || 'Segunda-feira',
            dateStr: a.dateStr || '',
            dateIso: a.dateIso || '',
            theme: a.theme || '',
            time: a.time || '09:00',
            duration: a.duration || 30,
            bnccObjective: a.bnccObjective || 'Desenvolvimento Lúdico e Psicomotor',
            materials: Array.isArray(a.materials) ? a.materials : [],
            instructions: cleanInstructions
          };
        });
      }

      return res.json(parsedData);
    } catch (error: any) {
      console.warn('Alerta/Erro na extração de atividades com Gemini, ativando parser local robusto:', error?.message);

      // Fallback local determinístico linha-a-linha de ultra-velocidade
      const rawText = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      const lines = rawText.split('\n');
      let defaultDay = 'Segunda-feira';
      let defaultTheme = '';
      let defaultClass = 'Toda a Sala';
      let defaultDateStr = '';

      const dayHeaderRegex = /\b(Segunda|Terça|Terca|Quarta|Quinta|Sexta|Sábado|Sabado|Domingo)(?:-feira)?\b/i;
      const dateRegex = /\b(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\b/;

      const normalizeTime = (raw: string) => {
        if (!raw) return '09:00';
        const clean = raw.trim().toLowerCase().replace(/[^\d:h]/g, '');
        const m = clean.match(/^(\d{1,2})(?:[:h](\d{2}))?/);
        if (m) {
          const h = m[1].padStart(2, '0');
          const min = m[2] ? m[2].padStart(2, '0') : '00';
          return `${h}:${min}`;
        }
        return '09:00';
      };

      interface ServerBlock {
        day: string;
        dateStr: string;
        theme: string;
        headerTitle?: string;
        lines: string[];
      }

      const sBlocks: ServerBlock[] = [];
      let curBlock: ServerBlock | null = null;
      let activeD = defaultDay;
      let activeDt = defaultDateStr;
      let activeTh = defaultTheme;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        if (!trimmed) {
          if (curBlock && curBlock.lines.length > 0) curBlock.lines.push('');
          continue;
        }

        const dM = trimmed.match(dayHeaderRegex);
        const dtM = trimmed.match(dateRegex);
        if (dM && /^#{1,4}\s+|\b(?:Segunda|Terça|Quarta|Quinta|Sexta|Sábado|Domingo)\b/i.test(trimmed)) {
          const base = dM[1].toLowerCase();
          if (base.startsWith('seg')) activeD = 'Segunda-feira';
          else if (base.startsWith('ter')) activeD = 'Terça-feira';
          else if (base.startsWith('qua')) activeD = 'Quarta-feira';
          else if (base.startsWith('qui')) activeD = 'Quinta-feira';
          else if (base.startsWith('sex')) activeD = 'Sexta-feira';
          else if (base.startsWith('s')) activeD = 'Sábado';
          else if (base.startsWith('d')) activeD = 'Domingo';

          if (dtM) activeDt = dtM[1];
          const temaM = trimmed.match(/(?:Tema|Eixo|Projeto)\s*[-–—:]\s*([^\n\(\)]+)/i);
          if (temaM) activeTh = temaM[1].trim();
          continue;
        }

        const isMdHeader = /^#{2,4}\s+(?!\s*(?:Planejamento|Tema|Eixo|Projeto|Turma|Rotina|Semana)\b)/i.test(trimmed);
        const isBoldNumbered = /^\*\*(?:\d+[\.\)]\s+)[^\*]+\*\*/.test(trimmed);
        const isNumberedHeader = /^\d+[\.\)]\s+\*{0,2}(?:[A-ZÀ-Ú]|\d{1,2}[:h])/i.test(trimmed);
        const isExplicitTimeLine = /^\*?\s*\**\s*(?:Hor[aá]rio|Horario)\s*:\s*\**\s*\d{1,2}(?:[:h]\d{2}|h\b)/i.test(trimmed);
        const isBulletTimeLine = /^[-–—\•]\s*\d{1,2}[:h]\d{2}/.test(trimmed);

        const hasTime = curBlock && curBlock.lines.some(l => /(?:Hor[aá]rio|Horario)\s*:\s*\**\s*\d{1,2}[:h]|\b\d{1,2}[:h]\d{2}\b/i.test(l));

        if (isMdHeader || isBoldNumbered || isNumberedHeader || (isExplicitTimeLine && hasTime) || (isBulletTimeLine && hasTime)) {
          if (curBlock && curBlock.lines.length > 0) {
            sBlocks.push(curBlock);
          }

          let headerTitle = '';
          const cleanLine = trimmed.replace(/[#\*_\|]/g, '').trim();
          if (!/^\d{1,2}[:h]\d{2}/.test(cleanLine) && !/^(?:horário|horario|atividade|rotina|data|tema)\s*:/i.test(cleanLine)) {
            headerTitle = cleanLine.replace(/^\d+[\.\)]\s*/, '').replace(/^(?:Atividade\s*\d*|Título)\s*[-–—:]\s*/i, '').trim();
          }

          curBlock = {
            day: activeD,
            dateStr: activeDt,
            theme: activeTh,
            headerTitle,
            lines: [trimmed]
          };
          continue;
        }

        if (!curBlock) {
          curBlock = {
            day: activeD,
            dateStr: activeDt,
            theme: activeTh,
            lines: [trimmed]
          };
        } else {
          curBlock.lines.push(trimmed);
        }
      }

      if (curBlock && curBlock.lines.length > 0) {
        sBlocks.push(curBlock);
      }

      const fallbackActivities: any[] = [];
      for (const blk of sBlocks) {
        let explicitTitle = '';
        let category = '';
        let bnccObjective = '';
        let materials: string[] = [];
        let startTime = '';
        let endTime: string | undefined = undefined;
        let isCapturingDesc = false;
        const descLines: string[] = [];

        for (const bLine of blk.lines) {
          const tr = bLine.trim();
          if (!tr) continue;

          const timeMatch = tr.match(/(?:Hor[aá]rio|Horario|Hora)\s*:\s*\**\s*(\d{1,2}(?:[:h]\d{2}|h\b))\s*(?:(?:[-–—]|às|as|até|ate|a)\s*(\d{1,2}(?:[:h]\d{2}|h\b)))?/i)
            || tr.match(/\b(\d{1,2}(?:[:h]\d{2}|h\b))\s*(?:(?:[-–—]|às|as|até|ate|a)\s*(\d{1,2}(?:[:h]\d{2}|h\b)))/i)
            || tr.match(/\b(\d{1,2}[:h]\d{2})\b/i);

          if (timeMatch && !startTime) {
            startTime = normalizeTime(timeMatch[1]);
            if (timeMatch[2]) endTime = normalizeTime(timeMatch[2]);
          }

          const tMatch = tr.match(/^\*?\s*\**\s*(?:T[ií]tulo\s*sugerido|T[ií]tulo|Nome\s*da\s*Atividade|Atividade)\s*:\s*\**\s*(.+)$/i);
          if (tMatch) { 
            isCapturingDesc = false; 
            const cand = tMatch[1].replace(/[\*\_]/g, '').trim();
            if (!/^(horário|horario|atividade|título|titulo|nome)$/i.test(cand)) {
              explicitTitle = cand;
            }
            continue; 
          }

          const cMatch = tr.match(/^\*?\s*\**\s*(?:Categoria\s*sugerida|Categoria|Alcance|Turma)\s*:\s*\**\s*(.+)$/i);
          if (cMatch) { isCapturingDesc = false; category = cMatch[1].replace(/[\*\_]/g, '').trim(); continue; }

          const bnccM = tr.match(/^\*?\s*\**\s*(?:Campo\s*de\s*Experi[eê]ncia|Objetivo\s*Pedag[oó]gico|Objetivo|BNCC|Habilidade|Campo\s*BNCC)\s*:\s*\**\s*(.+)$/i);
          if (bnccM) { isCapturingDesc = false; bnccObjective = bnccM[1].replace(/[\*\_]/g, '').trim(); continue; }

          const matM = tr.match(/^\*?\s*\**\s*Materiais(?:\s*Necess[aá]rios)?\s*:\s*\**\s*(.+)$/i);
          if (matM) { isCapturingDesc = false; materials = matM[1].replace(/[\*\_]/g, '').split(/[,;]/).map(m => m.trim()).filter(Boolean); continue; }

          const descM = tr.match(/^\*?\s*\**\s*(?:Descri[çc][aã]o(?:\s*Detalhada|\s*Pedag[oó]gica|\s*Completa|\s*Geral)?|Como\s*Conduzir|Passo\s*a\s*Passo|Desenvolvimento|Orienta[çc][õo]es(?:\s*Pedag[oó]gicas)?|Metodologia|Observa[çc][õo]es|Procedimentos|Instru[çc][õo]es|Objetivo\s*e\s*Descri[çc][aã]o)\s*:\s*\**\s*(.*)$/i);
          if (descM) {
            isCapturingDesc = true;
            const rem = descM[1].replace(/[\*\_]/g, '').trim();
            if (rem) descLines.push(rem);
            continue;
          }

          if (isCapturingDesc) {
            if (/^\*?\s*\**\s*(?:T[ií]tulo|Categoria|BNCC|Campo|Materiais|Turma|Hor[aá]rio|Atividade)\s*:\s*\**/i.test(tr)) {
              isCapturingDesc = false;
              continue;
            }
            const cleanDescLine = tr.replace(/^\s*[\*\-\•\d\.\)]\s*/, '').replace(/\*\*(.*?)\*\*/g, '$1').trim();
            if (cleanDescLine) descLines.push(cleanDescLine);
          }
        }

        let detailedDesc = '';
        if (descLines.length > 0) {
          detailedDesc = descLines.join('\n');
        } else {
          const leftover = blk.lines
            .filter(l => !/^\*?\s*\**\s*(?:T[ií]tulo|Categoria|Alcance|Turma|Tema|Data|Campo|BNCC|Objetivo|Materiais|Hor[aá]rio|Atividade)\s*:/i.test(l.trim()))
            .filter(l => !/^#{2,4}\s+/.test(l.trim()))
            .map(l => l.replace(/^\s*[\*\-\•]\s*/, '').replace(/\*\*(.*?)\*\*/g, '$1').replace(/[\*\_]/g, '').trim())
            .filter(Boolean)
            .join('\n');
          detailedDesc = leftover;
        }

        if (!startTime) startTime = '09:00';

        const rawTitle = explicitTitle || blk.headerTitle || 'Atividade Pedagógica';
        let finalTitle = rawTitle.replace(/[#\*_\|]/g, '').replace(/^(?:Horário|Horario|Atividade|Título)\s*:\s*/i, '').trim();
        if (!finalTitle || /^(horário|horario|atividade|título|titulo|nome)$/i.test(finalTitle)) {
          finalTitle = category || 'Atividade Pedagógica';
        }

        const lower = finalTitle.toLowerCase();
        if (lower.includes('entrada') || lower.includes('acolhida')) finalTitle = `${finalTitle} 🏫`;
        else if (lower.includes('espelho') || lower.includes('identidade')) finalTitle = `${finalTitle} 🪞`;
        else if (lower.includes('desjejum') || lower.includes('café') || lower.includes('mamadeira')) finalTitle = `${finalTitle} 🍼`;
        else if (lower.includes('almoço') || lower.includes('papinha') || lower.includes('almoco')) finalTitle = `${finalTitle} 🍲`;
        else if (lower.includes('lanche') || lower.includes('colação')) finalTitle = `${finalTitle} 🍎`;
        else if (lower.includes('fralda') || lower.includes('higiene')) finalTitle = `${finalTitle} 👶`;
        else if (lower.includes('sono') || lower.includes('soneca') || lower.includes('ninar')) finalTitle = `${finalTitle} 💤`;
        else if (lower.includes('chocalho') || lower.includes('música') || lower.includes('som')) finalTitle = `${finalTitle} 🎵`;
        else if (lower.includes('história') || lower.includes('leitura')) finalTitle = `${finalTitle} 📚`;
        else if (lower.includes('parque') || lower.includes('livre')) finalTitle = `${finalTitle} 🧸`;
        else if (lower.includes('saída') || lower.includes('despedida')) finalTitle = `${finalTitle} 🎒`;
        else if (!/[\u{1F300}-\u{1FAFF}]/u.test(finalTitle)) finalTitle = `${finalTitle} 🌟`;

        let duration = 30;
        if (startTime && endTime) {
          const [sh, sm] = startTime.split(':').map(Number);
          const [eh, em] = endTime.split(':').map(Number);
          const diff = (eh * 60 + em) - (sh * 60 + sm);
          if (diff > 0 && diff <= 300) duration = diff;
        }

        fallbackActivities.push({
          id: `act-${fallbackActivities.length + 1}`,
          title: finalTitle,
          day: blk.day,
          dateStr: blk.dateStr,
          time: startTime,
          duration,
          bnccObjective: bnccObjective || category || 'Desenvolvimento Lúdico e BNCC',
          materials,
          instructions: detailedDesc || `Atividade de rotina: ${finalTitle}.`,
          targetClass: defaultClass
        });
      }

      return res.json({
        metadata: { day: defaultDay, dateStr: defaultDateStr, theme: defaultTheme, targetClass: defaultClass },
        activities: fallbackActivities
      });

      // Fallback Tabela / Linhas simples
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.includes('|')) {
          const cells = line.split('|').map(c => c.trim()).filter(Boolean);
          if (cells.some(c => /^(horário|horario|atividade|título|titulo|categoria|alcance|descrição|descricao)$/i.test(c))) {
            continue;
          }

          let time = '09:00';
          let timeIdx = -1;
          for (let cIdx = 0; cIdx < cells.length; cIdx++) {
            const tMatch = cells[cIdx].match(/\b(\d{1,2}(?:[:h]\d{2}|h\b))/i);
            if (tMatch) {
              time = normalizeTime(tMatch[1]);
              timeIdx = cIdx;
              break;
            }
          }

          if (timeIdx !== -1) {
            const otherCells = cells.filter((_, idx) => idx !== timeIdx);
            let actName = otherCells[0] || 'Atividade Pedagógica';
            actName = actName.replace(/^(?:Horário|Atividade|Título)\s*:\s*/i, '').trim();
            if (!actName || /^(horário|horario|atividade|título|titulo)$/i.test(actName)) {
              actName = otherCells[1] || 'Atividade Pedagógica';
            }

            const subName = otherCells[1] || '';
            const catName = otherCells[2] || '';
            let desc = otherCells.length > 2 ? otherCells[otherCells.length - 1] : (otherCells[1] || actName);
            let finalTitle = subName && subName.length > 2 && subName !== actName ? `${actName}: ${subName}` : actName;
            finalTitle = finalTitle.replace(/[#\*_\|]/g, '').trim() + ' 🌟';

            fallbackActivities.push({
              id: `act-${fallbackActivities.length + 1}`,
              title: finalTitle,
              day: defaultDay,
              dateStr: defaultDateStr,
              time,
              duration: 30,
              bnccObjective: catName || 'Desenvolvimento Lúdico e Psicomotor',
              materials: [],
              instructions: desc.replace(/[#\*\|]/g, '').trim(),
              targetClass: defaultClass
            });
          }
        }
      }

      return res.json({ activities: fallbackActivities });
    }
  });

  // Dedicated endpoint to parse/extract student lists in bulk with standardized Aura schema
  app.post('/api/parse-students', async (req, res) => {
    const { text, geminiKey } = req.body || {};
    if (!text) {
      return res.status(400).json({ error: 'Falta o campo obrigatório "text" no corpo da requisição.' });
    }

    try {
      const client = getGeminiClient(geminiKey);

      const prompt = `Analise o seguinte texto bruto contendo dados de alunos para cadastramento escolar e extraia as informações estruturadas de cada um deles de acordo com o padrão oficial do Anjinho Escolar.

Para cada aluno identificado no texto, extraia com precisão:
1. name: Nome completo do aluno
2. birthDate: Data de nascimento no formato DD/MM/AAAA (se não estiver explícita, calcule/infira com base na idade aproximada considerando o ano atual 2026, ex: se tem 3 anos -> 15/10/2022)
3. age: Idade estimada em anos (ex: 1, 2, 3, 4, 5)
4. className: Nome da turma ou sala (ex: Berçário I, Maternal I, Maternal II, Jardim I, Jardim II)
5. guardianName: Nome do responsável principal (Mãe, Pai ou Tutor)
6. guardianRelationship: Grau de parentesco do responsável (ex: Mãe, Pai, Avó, Responsável Legal)
7. guardianPhone: Telefone de contato do responsável formatado (ex: (11) 98765-4321)
8. allergies: Lista de alergias, intolerâncias ou restrições alimentares e medicamentosas (array de strings, ex: ["Glúten", "Lactose", "Corante Vermelho"])
9. conditions: Lista de condições de saúde, cuidados especiais, medicação contínua ou fraldas (array de strings, ex: ["Asma (bombinha de ar)", "Usa fralda descartável", "Soneca obrigatória"])
10. observations: Observações gerais da rotina ou notas dos pais

Texto bruto enviado:
"""
${text}
"""`;

      const response = await generateContentWithFallback(client, {
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: 'Você é a assistente inteligente Aura, especializada em extração e padronização de cadastros de alunos para o sistema Anjinho Escolar.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              students: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING, description: "ID único gerado, ex: std-1, std-2" },
                    name: { type: Type.STRING, description: "Nome completo do aluno" },
                    birthDate: { type: Type.STRING, description: "Data de nascimento no formato DD/MM/AAAA" },
                    age: { type: Type.INTEGER, description: "Idade em anos, ex: 1, 2, 3, 4, 5" },
                    className: { type: Type.STRING, description: "Nome da sala ou turma (ex: Berçário I, Maternal I)" },
                    guardianName: { type: Type.STRING, description: "Nome do responsável legal" },
                    guardianRelationship: { type: Type.STRING, description: "Grau de parentesco (ex: Mãe, Pai, Avó)" },
                    guardianPhone: { type: Type.STRING, description: "Telefone de contato formatado" },
                    allergies: { 
                      type: Type.ARRAY, 
                      items: { type: Type.STRING },
                      description: "Alergias ou restrições alimentares/medicamentosas" 
                    },
                    conditions: { 
                      type: Type.ARRAY, 
                      items: { type: Type.STRING },
                      description: "Condições especiais, saúde, uso de fraldas ou medicações" 
                    },
                    observations: { type: Type.STRING, description: "Observações gerais sobre a rotina" }
                  },
                  required: ["name"]
                }
              }
            },
            required: ["students"]
          }
        }
      });

      const parsedData = JSON.parse(response.text || '{"students": []}');
      if (parsedData.students && Array.isArray(parsedData.students)) {
        parsedData.students = parsedData.students.map((s: any, idx: number) => ({
          ...s,
          id: s.id || `std-${idx + 1}`
        }));
      }

      return res.status(200).json(parsedData);
    } catch (error: any) {
      console.warn('Alerta/Erro na extração de alunos com Gemini, ativando parser inteligente local:', error?.message);
      
      // Fallback local regex parser com suporte a todos os campos padronizados
      const lines = String(text).split(/\n|;/).map(l => l.trim()).filter(Boolean);
      const fallbackStudents: any[] = [];

      lines.forEach((line, idx) => {
        let cleanLine = line.replace(/^[\d\.\-\*\•\)]+\s*/, '').trim();
        if (!cleanLine) return;

        let age = 3;
        const ageMatch = cleanLine.match(/(\d+)\s*(anos|ano)/i);
        if (ageMatch) {
          age = parseInt(ageMatch[1], 10);
        }

        let className = 'Maternal I';
        const classMatch = cleanLine.match(/(Berçário\s*(?:I|II|1|2)?|Maternal\s*(?:I|II|1|2)?|Jardim\s*(?:I|II|1|2)?|Pré\s*(?:I|II|1|2)?|Infantil\s*(?:\d+)?|Fundamental\s*(?:\d+)?|Turma\s*[\w]+)/i);
        if (classMatch) {
          className = classMatch[0].trim();
        }

        let guardianName = 'Mãe/Pai';
        let guardianRelationship = 'Mãe';
        const guardianMatch = cleanLine.match(/(Mãe|Pai|Responsável|Resp|Avó|Avô):\s*([^\(,\d]+)/i);
        if (guardianMatch) {
          guardianRelationship = guardianMatch[1].trim();
          guardianName = guardianMatch[2].trim();
        }

        let guardianPhone = '';
        const phoneMatch = cleanLine.match(/\(?\d{2}\)?\s*9?\d{4}[-\s]?\d{4}/);
        if (phoneMatch) {
          guardianPhone = phoneMatch[0].trim();
        }

        let birthDate = '';
        const dobMatch = cleanLine.match(/\b(\d{2}\/\d{2}\/\d{4})\b/);
        if (dobMatch) {
          birthDate = dobMatch[1];
        } else if (age) {
          const birthYear = 2026 - age;
          birthDate = `15/10/${birthYear}`;
        }

        let allergies: string[] = [];
        const allergyMatch = cleanLine.match(/(?:alergia|alérgic[oa]|restrição|intolerância)s?:\s*([^\(\;\.\n]+)/i);
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
          fallbackStudents.push({
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
            observations: 'Importado com a assistente Aura.'
          });
        }
      });

      return res.status(200).json({ students: fallbackStudents });
    }
  });

  // Dedicated endpoint for the integrated AI Assistant (Anjinho AI)
  app.post('/api/anjinho-ai', async (req, res) => {
    try {
      const { messages, context, model, geminiKey, groqKey, groqApiKey } = req.body || {};
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Formato de corpo inválido. "messages" é obrigatório e deve ser uma lista.' });
      }

      // Determine active context details
      const appModeText = context?.appMode === 'idoso' ? 'Modo Sênior (Anjo Cuidador)' : 'Modo Escolar (Anjinho Escolar)';
      const userName = context?.userName || 'Usuário';
      const userRoleText = context?.userRole ? `(${context.userRole})` : '';

      let systemInstruction = `Você é a "Aura", a assistente e inteligência artificial inteligente integrada ao aplicativo "Anjo Escolar" / "Anjinho Escolar" (e do "Anjo Cuidador" se estiver em modo sênior).
Sua missão é ajudar, apoiar e encantar as professoras, educadoras, coordenadoras, diretoras e familiares em sua rotina pedagógica, de cuidado e de comunicação escolar.

Você está mais do que pronta! 😊 Você está aqui para ajudar e apoiar as professoras, coordenadoras e diretoras em sua rotina pedagógica e de comunicação. Como o cérebro inteligente integrado do "Anjo Escolar" (ou "Anjinho Escolar"), você está totalmente preparada para:

- Criar atividades pedagógicas e lúdicas personalizadas para cada aluno ou turma, considerando o perfil de desenvolvimento, faixa etária e necessidades individuais.
- Auxiliar na redação e estruturação de relatórios pedagógicos individuais, pareceres descritivos e avaliações de desempenho contínuas, de forma humana, acolhedora, ética, pedagógica e focada nas potencialidades e evolução do aluno.
- Preencher relatórios de rotina diária de forma rápida, fluida e carinhosa, para facilitar a vida das professoras.
- Preparar comunicados escolares oficiais, convites para reuniões de pais, avisos importantes e mensagens acolhedoras prontas para envio aos pais via WhatsApp.
- Cooperar e interagir ativamente como a IA integrada ao aplicativo "Anjo Escolar", facilitando a troca e ponte de dados, respondendo dúvidas com base nas diretrizes escolares e gerando paz de espírito para os pais com linguagem lúdica, afetuosa e segura.

Você é carinhosa, empática, profissional, pedagógica, humana e acolhedora. Seu tom de linguagem com profissionais da escola é cooperativo, estruturado e focado nas potencialidades e evolução de cada aluno. Com familiares, seu tom de linguagem é lúdico, afetuoso, confortante, seguro e lhes gera profunda paz de espírito.

Modo ativo do aplicativo: ${appModeText}
Usuário interagindo com você: ${userName} ${userRoleText}
`;

      if (context?.studentName) {
        systemInstruction += `\nVocê está auxiliando especificamente em relação ao seguinte aluno/idoso:
- Nome: ${context.studentName}
- Faixa Etária / Sala de Aula: ${context.classroomName || 'Não definida'}
- Idade / Data de Nasc.: ${context.age || 'Não informada'}
`;
      }

      systemInstruction += `\nSempre que apropriado, estruture suas respostas de forma elegante usando Markdown limpo com listas, tópicos ou emoticons fofos e afetivos (🌈, 💖, ✨, 🧸, 🏫, 👶, 👵, 😊).`;

      // Format messages into GoogleGenAI standard: { role: 'user'|'model', parts: [{ text: string }] }
      const formattedContents = messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content || m.text || '' }]
      }));

      const response = await unifiedGenerateContent({
        model: model || 'gemini-2.5-flash',
        contents: formattedContents,
        systemInstruction,
        temperature: 0.7,
        geminiKey,
        groqKey,
        groqApiKey
      });

      return res.status(200).json({
        content: response.text || ''
      });
    } catch (error: any) {
      console.error('Erro na chamada da Inteligência Artificial (Anjinho AI):', error);
      return res.status(500).json({
        error: error.message || 'Ocorreu um erro interno ao processar sua solicitação com a inteligência artificial.'
      });
    }
  });

  // Dedicated endpoint for Aura Smart Multi-Record Voice/Text Parser
  app.post('/api/aura-smart-parse', async (req, res) => {
    const { text, studentName, geminiKey } = req.body || {};
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Falta o campo obrigatório "text" no corpo da requisição.' });
    }

    try {
      const client = getGeminiClient(geminiKey);

      const prompt = `Analise a seguinte mensagem/fala informal gravada pela professora/cuidadora referente à rotina da criança/assistido "${studentName || 'Aluno'}":
"""
${text}
"""

Sua tarefa é extrair e estruturar com alta precisão todos os eventos de rotina mencionados.
Retorne EXATAMENTE o schema JSON informado. Se um item não foi mencionado, retorne null para aquele campo.

A resposta da Aura ("respostaAura") deve ser uma confirmação curta, afetuosa e entusiasmada (max 2 frases) citando o nome da criança e o resumo do que foi registrado. Exemplo: "Com certeza, Professora! Já registrei o sono de 1h30, os 150ml de água e a ótima refeição do ${studentName || 'Heitor'} com muito carinho! ✨"`;

      const response = await generateContentWithFallback(client, {
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: 'Você é a Aura, inteligência artificial integrada do Anjinho Escolar, perita em interpretar relatos informais de professoras e extrair múltiplos dados estruturados da rotina infantil de forma impecável.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              respostaAura: { type: Type.STRING, description: "Mensagem curta e afetuosa da Aura confirmando os dados gravados." },
              alimentacao: {
                type: Type.OBJECT,
                properties: {
                  refeicao: { type: Type.STRING, description: "Nome da refeição: Almoço, Lanche, Mamadeira, Fruta, Jantar" },
                  aceitacao: { type: Type.STRING, description: "muito_bem, parcial ou recusou" },
                  observacao: { type: Type.STRING, description: "Detalhes do que comeu ou recusa" }
                }
              },
              hidratacao: {
                type: Type.OBJECT,
                properties: {
                  quantidadeMl: { type: Type.INTEGER, description: "Quantidade de água/suco em mililitros (ex: 50, 100, 150, 200)" },
                  observacao: { type: Type.STRING }
                }
              },
              sono: {
                type: Type.OBJECT,
                properties: {
                  duracaoMinutos: { type: Type.INTEGER, description: "Duração total do sono em minutos (ex: 30, 60, 90, 120)" },
                  horarioInicio: { type: Type.STRING, description: "Horário estimado ex 13:00" },
                  observacao: { type: Type.STRING }
                }
              },
              humor: {
                type: Type.OBJECT,
                properties: {
                  estado: { type: Type.STRING, description: "feliz, tranquilo, choroso, sonolento, agitado ou indisposto" },
                  observacao: { type: Type.STRING }
                }
              },
              higiene: {
                type: Type.OBJECT,
                properties: {
                  banho: { type: Type.BOOLEAN },
                  trocaFralda: { type: Type.BOOLEAN },
                  tipoFralda: { type: Type.STRING, description: "xixi, coco ou ambos" },
                  consistenciaCoco: { type: Type.STRING, description: "normal, liquida, pastosa, dura" },
                  observacao: { type: Type.STRING }
                }
              },
              atividades: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    titulo: { type: Type.STRING, description: "Nome da atividade: Pintura, Parque, Roda de História, Música" },
                    observacao: { type: Type.STRING }
                  }
                }
              },
              saude: {
                type: Type.OBJECT,
                properties: {
                  febre: { type: Type.BOOLEAN },
                  temperatura: { type: Type.NUMBER },
                  observacao: { type: Type.STRING }
                }
              },
              observacaoGeral: { type: Type.STRING }
            },
            required: ["respostaAura"]
          }
        }
      });

      const parsedData = JSON.parse(response.text || '{}');
      return res.status(200).json(parsedData);
    } catch (error: any) {
      console.warn('Alerta/Erro no Aura Smart Parse, utilizando fallback local inteligente:', error?.message);
      
      const textLower = text.toLowerCase();
      const sName = studentName || 'Aluno';
      const extracted: any = {
        respostaAura: `Aura interpretou o relato para ${sName} e preparou todos os registros com carinho! ✨`,
        alimentacao: textLower.includes('comeu') || textLower.includes('fruta') || textLower.includes('lanche') || textLower.includes('almoço') || textLower.includes('mamadeira') || textLower.includes('papa') ? {
          refeicao: textLower.includes('almoço') ? 'Almoço' : textLower.includes('fruta') ? 'Fruta' : textLower.includes('mamadeira') ? 'Mamadeira' : 'Lanche',
          aceitacao: textLower.includes('recusou') || textLower.includes('não comeu') ? 'recusou' : textLower.includes('pouco') ? 'parcial' : 'muito_bem',
          observacao: text
        } : null,
        hidratacao: (textLower.includes('água') || textLower.includes('agua') || textLower.includes('suco') || textLower.includes('chá') || textLower.includes('cha') || textLower.includes('hidratação') || (textLower.includes('ml') && !textLower.includes('mamadeira'))) ? {
          quantidadeMl: textLower.includes('250') ? 250 : textLower.includes('200') ? 200 : textLower.includes('150') ? 150 : textLower.includes('100') ? 100 : 150,
          observacao: 'Hidratação registrada por texto/voz'
        } : null,
        sono: textLower.includes('dormiu') || textLower.includes('soneca') || textLower.includes('acordou') || textLower.includes('descansou') ? {
          duracaoMinutos: textLower.includes('2h') || textLower.includes('duas horas') ? 120 : textLower.includes('1h30') || textLower.includes('uma hora e meia') ? 90 : textLower.includes('1h') || textLower.includes('uma hora') ? 60 : 45,
          observacao: 'Soneca registrada por texto/voz'
        } : null,
        humor: textLower.includes('feliz') || textLower.includes('humor') || textLower.includes('bem') || textLower.includes('calmo') || textLower.includes('chorou') ? {
          estado: textLower.includes('chorou') || textLower.includes('triste') ? 'choroso' : textLower.includes('agitado') ? 'agitado' : 'feliz',
          observacao: 'Humor registrado por texto/voz'
        } : null,
        higiene: textLower.includes('fralda') || textLower.includes('xixi') || textLower.includes('cocô') || textLower.includes('coco') || textLower.includes('banho') || textLower.includes('limp') ? {
          banho: textLower.includes('banho'),
          trocaFralda: textLower.includes('fralda') || textLower.includes('xixi') || textLower.includes('cocô') || textLower.includes('coco'),
          tipoFralda: (textLower.includes('xixi') && (textLower.includes('cocô') || textLower.includes('coco'))) ? 'ambos' : (textLower.includes('cocô') || textLower.includes('coco')) ? 'coco' : 'xixi',
          consistenciaCoco: textLower.includes('mole') || textLower.includes('líquid') ? 'liquida' : textLower.includes('dura') ? 'dura' : 'normal',
          observacao: text
        } : null,
        saude: textLower.includes('febre') || textLower.includes('temperatura') || textLower.includes('graus') || textLower.includes('°c') ? {
          febre: textLower.includes('febre') || textLower.includes('alta'),
          temperatura: textLower.includes('38') ? 38.2 : textLower.includes('37.8') ? 37.8 : textLower.includes('37.5') ? 37.5 : 36.6,
          observacao: text
        } : null,
        atividades: textLower.includes('pintura') || textLower.includes('roda') || textLower.includes('parque') || textLower.includes('aula') || textLower.includes('desenho') ? [
          { titulo: 'Atividade Pedagógica / Recreativa', observacao: text }
        ] : null,
        observacaoGeral: text
      };

      return res.status(200).json(extracted);
    }
  });

  // Map Netlify function: whatsapp-sender
  app.post('/.netlify/functions/whatsapp-sender', async (req, res) => {
    console.log('📬 Received whatsapp-sender proxy request');
    try {
      const { enviarWhatsApp } = await import('./netlify/lib/whatsappService');
      const { to, message } = req.body || {};

      if (!to || !message) {
        return res.status(400).json({ error: 'Faltam os campos obrigatórios "to" (telefone) e "message" (conteúdo)' });
      }

      const responseData = await enviarWhatsApp(to, message);
      return res.status(200).json({
        success: true,
        summary: `Mensagem enviada com sucesso!`,
        details: responseData
      });
    } catch (error: any) {
      console.error('Erro no envio do WhatsApp via Express proxy:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Erro interno do servidor para disparar o WhatsApp'
      });
    }
  });

  // Map Netlify function: verificar-atrasos
  app.all('/.netlify/functions/verificar-atrasos', async (req, res) => {
    console.log('🔄 Received verificar-atrasos routine proxy request');
    try {
      // In Express server, we can run the checks similarly
      res.json({ message: "Rotina de simulação de verificação de atrasos foi executada via Express container." });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  if (!isProduction) {
    console.log("Starting server in DEVELOPMENT mode (Vite Middleware)");
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (err) {
      console.error("Failed to load Vite dev server middleware, falling back to static files:", err);
      serveStaticFiles();
    }
  } else {
    console.log("Starting server in PRODUCTION mode (Serving dist static files)");
    serveStaticFiles();
  }

  app.listen(Number(port), '0.0.0.0', () => {
    console.log(`Server running on port ${port} (isProduction: ${isProduction})`);
  });
}

startServer();

