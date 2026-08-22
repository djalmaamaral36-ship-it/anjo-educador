import crypto from 'node:crypto';

// Segredo do SSO (pode ser passado por variável de ambiente ANJINHO_SSO_SECRET ou usa valor padrão de teste)
const SECRET = process.env.ANJINHO_SSO_SECRET || "anjinho-aura-secret-key-2026";
const AURA_BASE_URL = process.env.AURA_BASE_URL || "https://anjinha-aura.lovable.app/api/sso";

// Helper para Base64Url
function base64UrlEncode(obj) {
  const jsonStr = typeof obj === 'string' ? obj : JSON.stringify(obj);
  return Buffer.from(jsonStr)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

// Helper para assinar HS256
function signHS256(headerB64, payloadB64, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

// 1. Payload do Teste (Editável conforme o cenário desejado)
const nowSeconds = Math.floor(Date.now() / 1000);

const payload = {
  sub: "user_prof_estela_01",
  email: "estela.pinto@escolapequenoanjo.com.br",
  name: "Profª Estela Pinto",
  userName: "Estela Pinto",
  role: "professora", // professora | coordenadora | diretora | admin | familiar
  tipo: "professora",
  escola: "Escola Pequeno Anjo",
  turma: "Maternal II - A",
  studentId: "aluno_101",
  studentNome: "Laura Mel",
  alergias: "Lactose, Frutos do mar",
  condicoes: "Rinite alérgica",
  historico: "Alimentação excelente no almoço. Aluna sem febre. Atividade de artes realizada com entusiasmo.",
  returnUrl: "https://anjinha.app/dashboard",
  iat: nowSeconds,
  exp: nowSeconds + 3600 // Válido por 1 hora (3600 segundos)
};

const header = {
  alg: "HS256",
  typ: "JWT"
};

// 2. Geração do Token JWT
const headerB64 = base64UrlEncode(header);
const payloadB64 = base64UrlEncode(payload);
const signatureB64 = signHS256(headerB64, payloadB64, SECRET);

const jwtToken = `${headerB64}.${payloadB64}.${signatureB64}`;
const finalUrl = `${AURA_BASE_URL}?token=${encodeURIComponent(jwtToken)}`;

console.log("=================================================");
console.log("🔑 ANJINHO -> ANJINHA AURA: GERADOR DE SSO JWT");
console.log("=================================================");
console.log("\n📦 PAYLOAD GERADO:");
console.log(JSON.stringify(payload, null, 2));

console.log("\n🔒 TOKEN JWT (HS256):");
console.log(jwtToken);

console.log("\n🔗 URL FINAL PARA NAVEGADOR (Opção 1 - Nova Aba com SSO):");
console.log(finalUrl);
console.log("\n=================================================\n");
