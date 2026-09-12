# Roteiro de Testes — Integração Anjinho ↔ Anjinha Aura

Ordem sugerida: Teste 1 → 2 → 3 → 4. Cada teste tem "como fazer" e "como saber que passou".

---

## Teste 1 — Login via SSO (Anjinho → Aura)

**Como fazer**
1. No Anjinho, entre com uma conta real de **professora** (ex: Professora Titular Ana Silva).
2. Clique no botão que abre a Anjinha Aura no cabeçalho ou menu.

**Passou se**
- A Aura abre já cumprimentando pelo nome certo.
- O cargo reconhecido é "professora" (não diretora/coordenadora).
- A escola citada é a escola daquela conta ("Escola Árvore da Infância").
- Existe o botão "Voltar ao Anjinho" e ele retorna para a tela de origem.

**Repita** com uma conta de **diretora** e uma de **coordenadora**.
O cumprimento e o foco das sugestões devem mudar conforme o cargo.

**Se falhar**
- Nome/cargo errado → o token foi gerado com dados de outro usuário, ou está sendo reaproveitado um token antigo. Gere um token novo a cada clique.
- "Token expirado" → o token vale 5 minutos; verifique o relógio do servidor do Anjinho.
- "Assinatura inválida" → o segredo do SSO está diferente dos dois lados (`anjinho-aura-secret-key-2026`).

---

## Teste 2 — Webhook do mural (WhatsApp → Aura)

**Como fazer**
1. Envie uma mensagem de teste no fluxo normal do Anjinho (ex.: "Lanche da tarde servido, turma Maternal II").
2. O Anjinho deve repassar esse aviso para a Aura automaticamente.

**Passou se**
- O Anjinho recebe resposta de sucesso (200) do envio.
- Ao perguntar na Aura "o que chegou hoje no mural?", o aviso de teste aparece.

**Se falhar**
- Resposta 401 → assinatura incorreta: ela precisa ser calculada sobre o **corpo bruto** da requisição, exatamente como enviado, com o segredo do mural (`anjinho-mural-secret-2026`).
- Chegou, mas a Aura não encontra → o campo de escola veio escrito de forma diferente do usado no login.

---

## Teste 3 — Consistência dos dados

**Como fazer**
Envie três avisos de teste: um de rotina, um de aluno específico e um geral da turma.

**Passou se**, para os três, estes campos vêm sempre escritos igual (mesma grafia, mesmos códigos):
- escola (nome e código: `"Escola Árvore da Infância"` / `"esc_001"`)
- turma (ex: `"Berçário I - A"`)
- aluno (código e nome: `"mariana_souza_01"` / `"Mariana Souza"`), quando houver
- data/hora do aviso (`posted_at` em ISO 8601)
- tipo do aviso (`aviso`, `saude`, `ocorrencia`, `financeiro`, `pedagogico`, `rotina`, `autorizacao`, `lgpd`)

**Por que importa**: é o que permite à Aura juntar rotina, bem-estar e comunicação da mesma criança. Grafias diferentes viram registros separados.

---

## Teste 4 — Rotina diária e alertas

**Como fazer**
1. Marque no Anjinho o cumprimento de 3 momentos da rotina, sendo um deles com mais de 15 minutos de atraso.
2. Abra a Aura como **diretora**.

**Passou se**
- A Aura menciona o momento atrasado no briefing inicial.
- Os momentos cumpridos no horário não geram alerta.

---

## Checklist final antes de liberar para as escolas

- [ ] Login funciona para professora, coordenadora e diretora
- [ ] Botão "Voltar ao Anjinho" retorna à tela correta
- [ ] Avisos do mural chegam em tempo real
- [ ] Campos de escola/turma/aluno idênticos nos dois sistemas
- [ ] Rotina com atraso gera alerta; rotina em dia não gera
- [ ] Planejamento gerado pela Aura é aceito pelo Anjinho ao copiar e colar.
